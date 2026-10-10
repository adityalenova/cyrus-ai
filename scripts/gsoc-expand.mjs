/* ══ scripts/gsoc-expand.mjs — grow the GSoC archive beyond status=passed ═
   node scripts/gsoc-expand.mjs

   The live archive API (https://summerofcode.withgoogle.com/api/projects/?year=YYYY)
   currently ignores year= and every filter/paging param — all 5 requests return the
   SAME 5,377-uid mixed 2022-2026 page. So we fetch the per-year lists, union the uids,
   pull details for every uid not already archived (plus the historical per-year lists
   in case the API ever starts honouring them), and keep status in {passed, merged}.
   "merged" = student merged their final work (real titles/bodies; 2026 cohort).

   Result is unioned with the existing public/data/gsoc-projects.json (existing rows
   are never lost), the orgs map is merged, and the file is only replaced when:
     - total projects > PREV_TOTAL (currently 5238)  AND
     - every year 2022-2026 keeps >= 900 projects.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, renameSync } from "fs";

const ROOT = new URL("..", import.meta.url).pathname;
const FILE = `${ROOT}public/data/gsoc-projects.json`;
const BASE = "https://summerofcode.withgoogle.com/api";
const YEARS = [2022, 2023, 2024, 2025, 2026];
const KEEP = new Set(["passed", "merged"]);
const CONC = 12;

const EMOJI = /[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]/gu;
const clean = (s) => (s || "").replace(EMOJI, "").replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();

/* same get() helper pattern as scripts/refresh.mjs (3 tries, 20s timeout) */
async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20000) });
      if (r.ok) return await r.json();
    } catch {}
    await new Promise((r) => setTimeout(r, 500 * (i + 1)));
  }
  return null;
}

/* ── load existing archive (base of the union) ── */
const prev = JSON.parse(readFileSync(FILE, "utf8"));
const byUid = new Map(prev.projects.map((p) => [p.u, p]));
const orgs = { ...(prev.orgs || {}) };
const prevTotal = prev.projects.length;
const prevByYear = {};
for (const p of prev.projects) prevByYear[p.y] = (prevByYear[p.y] || 0) + 1;
console.log(`existing: ${prevTotal} projects, ${Object.keys(orgs).length} orgs, by year ${JSON.stringify(prevByYear)}`);

/* ── 1. collect uids from the per-year list endpoints ── */
const uidYearHint = new Map(); // uid -> last-listed year (fallback only; program_slug wins)
for (const year of YEARS) {
  const list = await get(`${BASE}/projects/?year=${year}`);
  const uids = list?.result || [];
  console.log(`list ${year}: ${uids.length} uids`);
  for (const u of uids) if (!uidYearHint.has(u)) uidYearHint.set(u, year);
  await new Promise((r) => setTimeout(r, 300));
}
const allUids = [...uidYearHint.keys()];
console.log(`unique uids across lists: ${allUids.length}`);

/* ── 2. fetch details for everything not already archived ── */
const todo = allUids.filter((u) => !byUid.has(u));
console.log(`to fetch: ${todo.length} new details (concurrency ${CONC})`);
let done = 0, kept = 0, dropped = {};
const statuses = {};
for (let i = 0; i < todo.length; i += CONC) {
  const batch = await Promise.all(todo.slice(i, i + CONC).map((u) => get(`${BASE}/projects/${u}/`)));
  for (let k = 0; k < batch.length; k++) {
    done++;
    const j = batch[k];
    const p = j?.entities?.projects?.[0];
    if (!p) { dropped.fetchFail = (dropped.fetchFail || 0) + 1; continue; }
    statuses[p.status] = (statuses[p.status] || 0) + 1;
    if (!KEEP.has(p.status)) continue;
    const yr = +p.program_slug || uidYearHint.get(todo[i + k]) || 0;
    if (!YEARS.includes(yr)) { dropped.wrongYear = (dropped.wrongYear || 0) + 1; continue; }
    const orgEnt = (j.entities.organizations || []).find((o) => o.uid === p.organization_id) || (j.entities.organizations || [])[0];
    const orgName = clean(orgEnt?.name || p.organization || "").slice(0, 80);
    if (orgEnt?.name) orgs[orgName] = { url: orgEnt.url || orgEnt.website_url || "", category: orgEnt.category || "" };
    kept++;
    byUid.set(p.uid, {
      y: yr, u: p.uid,
      t: clean(p.title).slice(0, 120), o: orgName, s: p.size || "medium",
      tt: (p.tech_tags || []).slice(0, 5).map((x) => clean(x).slice(0, 22)).filter(Boolean),
      tp: (p.topic_tags || []).slice(0, 3).map((x) => clean(x).slice(0, 26)).filter(Boolean),
      b: clean(p.body).slice(0, 200), m: clean(p.mentors_display_name || "").slice(0, 60),
    });
  }
  if (done % 240 === 0 || i + CONC >= todo.length) console.log(`  ${done}/${todo.length} fetched, ${kept} kept so far`);
}
console.log(`detail statuses seen: ${JSON.stringify(statuses)} dropped: ${JSON.stringify(dropped)}`);

/* ── 3. union + validation ── */
const projects = [...byUid.values()];
const byYear = {};
for (const p of projects) byYear[p.y] = (byYear[p.y] || 0) + 1;
console.log(`result: ${projects.length} projects (+${projects.length - prevTotal}), by year ${JSON.stringify(byYear)}, orgs ${Object.keys(orgs).length}`);

const okTotal = projects.length > prevTotal && projects.length > 5238;
const okYears = YEARS.every((y) => (byYear[y] || 0) >= 900);
if (!okTotal || !okYears) {
  console.error(`REFUSING to replace archive (total>5238: ${okTotal}, every year>=900: ${okYears}). Writing .expand-preview.json only.`);
  writeFileSync(`${ROOT}public/data/gsoc-projects.expand-preview.json`, JSON.stringify({ projects, orgs }));
  process.exit(1);
}
const str = JSON.stringify({ projects, orgs });
JSON.parse(str); // sanity
writeFileSync(`${FILE}.tmp`, str);
renameSync(`${FILE}.tmp`, FILE);
console.log(`wrote ${FILE}: ${projects.length} projects, ${Object.keys(orgs).length} orgs`);
