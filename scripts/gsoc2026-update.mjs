/* ══ scripts/gsoc2026-update.mjs — Task 1: GSoC 2026 delta + drop 2021 + org rosters ══
   node scripts/gsoc2026-update.mjs

   Notes on API reality (verified 2026-10):
   - https://summerofcode.withgoogle.com/api/projects/?year=YYYY currently IGNORES the year
     param and returns one mixed archive page (result = uids, entities.projects = FULL detail
     rows with program_slug + status + body + tags). Per-uid detail fetches add nothing, so we
     clean straight from the list payload (same cleaning as refresh.mjs: strip emoji, keep
     status==="passed"), filtered to program_slug==="2026" for the delta.
   - /api/organizations/?year=YYYY is 404. Org rosters come from entities.organizations on the
     projects page (rich fields) unioned with the archive file's own per-year org usage.
   - Writes only if sanity checks pass; writes to .tmp then renames.
   ═══════════════════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, renameSync, existsSync } from "fs";

const ROOT = new URL("..", import.meta.url).pathname;
const DATA = `${ROOT}public/data`;
const EMOJI = /[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]/gu;
const clean = (s) => (s || "").replace(EMOJI, "").replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();
const BASE = "https://summerofcode.withgoogle.com/api";

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(30000) });
      if (r.ok) return await r.json();
    } catch {}
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  return null;
}

/* ── fetch the archive page (ask for year=2026; filter locally by program_slug) ── */
const list2026 = await get(`${BASE}/projects/?year=2026`);
if (!list2026?.entities?.projects) { console.error("FATAL: GSoC projects API unreachable - aborting, existing file untouched"); process.exit(1); }
const apiProjects = list2026.entities.projects;
const apiOrgs = list2026.entities.organizations || [];

/* probe 2027 (we only want the window ending 2026 - ignore anything it returns) */
const list2027 = await get(`${BASE}/projects/?year=2027`);
const n2027 = list2027?.result?.length || 0;
const s2027 = new Set((list2027?.entities?.projects || []).map((p) => p.program_slug));
console.log(`probe year=2027: ${n2027 ? `returned ${n2027} rows (slugs ${[...s2027]}) - ignored, same mixed page` : "unavailable/empty"}`);

/* ── load existing archive ── */
const file = JSON.parse(readFileSync(`${DATA}/gsoc-projects.json`, "utf8"));
if (!Array.isArray(file.projects) || !file.orgs) { console.error("FATAL: existing gsoc-projects.json malformed - aborting"); process.exit(1); }

/* IMPORTANT finding: the old gsoc-projects.json held 26,190 rows but only 5,238 UNIQUE uids -
   the same mixed archive page (the live API ignores the year= param) stored five times under
   year labels 2021..2025. The API's program_slug is the only authoritative year, so we rebuild
   deduplicated: every API row keeps its true program year (2022-2026, passed only); any old
   row whose uid is absent from the API is preserved unless it is labelled 2021. */
const YEARS = [2022, 2023, 2024, 2025, 2026];
const apiPassed = apiProjects.filter((p) => p.status === "passed" && YEARS.includes(+p.program_slug));
const apiUids = new Set(apiProjects.map((p) => p.uid)); // ALL statuses, so stale rows never resurrect

/* ── build rows from the API (true years, same cleaning as refresh.mjs) ── */
const rows = [];
const seen = new Set();
for (const p of apiPassed) {
  if (seen.has(p.uid)) continue; seen.add(p.uid);
  const orgName = clean(p.organization_name || "").slice(0, 80);
  if (!orgName) continue;
  rows.push({
    y: +p.program_slug, u: p.uid,
    t: clean(p.title).slice(0, 120), o: orgName, s: p.size || "medium",
    tt: (p.tech_tags || []).slice(0, 5).map((x) => clean(x).slice(0, 22)).filter(Boolean),
    tp: (p.topic_tags || []).slice(0, 3).map((x) => clean(x).slice(0, 26)).filter(Boolean),
    b: clean(p.body).slice(0, 200),
    m: clean((p.assigned_mentors || []).join(", ")).slice(0, 60), // list API lacks mentors_display_name
  });
}
/* preserve any legacy rows the API no longer lists (none in 2026-10 run, kept for safety) */
let legacy = 0;
for (const p of file.projects) {
  if (p.y === 2021 || apiUids.has(p.u) || seen.has(p.u) || !YEARS.includes(p.y)) continue;
  seen.add(p.u); rows.push(p); legacy++;
}


/* ── merge org entries into the orgs map ── */
const orgs = { ...file.orgs };
const apiOrgByName = new Map(apiOrgs.map((o) => [clean(o.name).slice(0, 80), o]));
for (const o of apiOrgs) {
  const name = clean(o.name).slice(0, 80);
  if (!name) continue;
  const prev = orgs[name] || {};
  const cats = (o.categories || []).map(clean).filter(Boolean);
  orgs[name] = {
    url: prev.url || o.website_url || "",
    category: prev.category || cats[0] || "",
  };
}

/* ── final project list (sorted by year, then uid) ── */
const projects = rows.sort((a, b) => a.y - b.y || (a.u < b.u ? -1 : 1));
const byYear = {};
for (const p of projects) byYear[p.y] = (byYear[p.y] || 0) + 1;
console.log(`rebuilt: ${projects.length} unique passed projects (legacy kept: ${legacy}) | byYear:`, byYear);

/* ── guard: never overwrite a good file with a partial one ── */
if (projects.length < 5000 || YEARS.some((y) => !byYear[y]) || (byYear[2021] || 0) > 0) {
  console.error("FATAL: sanity check failed, gsoc-projects.json NOT rewritten"); process.exit(1);
}
const outStr = JSON.stringify({ projects, orgs });
JSON.parse(outStr); // validate before rename
writeFileSync(`${DATA}/gsoc-projects.json.tmp`, outStr);
renameSync(`${DATA}/gsoc-projects.json.tmp`, `${DATA}/gsoc-projects.json`);
console.log(`gsoc-projects.json: ${projects.length} projects, ${Object.keys(orgs).length} orgs`);

/* ── per-year org rosters → gsoc-orgs.json ── */
const years = [2022, 2023, 2024, 2025, 2026];
const rosters = {};
for (const y of years) rosters[y] = new Map(); // orgName -> entry

const addRoster = (y, name, ent) => {
  const m = rosters[y];
  const prev = m.get(name) || {};
  const cats = (ent?.categories || []).map(clean).filter(Boolean);
  m.set(name, {
    name,
    url: prev.url || ent?.website_url || orgs[name]?.url || "",
    category: prev.category || cats[0] || orgs[name]?.category || "",
    slug: prev.slug ?? (ent?.slug || ""),
    tagline: prev.tagline || clean(ent?.tagline || "").slice(0, 120),
    logo: prev.logo || ent?.logo_url || "",
    description: prev.description || clean(ent?.description || "").slice(0, 300),
    tech_tags: prev.tech_tags || (ent?.tech_tags || []).slice(0, 6).map(clean).filter(Boolean),
    topic_tags: prev.topic_tags || (ent?.topic_tags || []).slice(0, 5).map(clean).filter(Boolean),
  });
};

/* source 1: API archive page - orgs with projects in each program year (any status) + org entities */
const projByOrgSlug = new Map(apiOrgs.map((o) => [o.slug, o]));
for (const p of apiProjects) {
  const y = +p.program_slug;
  if (!YEARS.includes(y)) continue;
  const name = clean(p.organization_name || "").slice(0, 80);
  if (!name) continue;
  addRoster(y, name, projByOrgSlug.get(p.organization_slug) || apiOrgByName.get(name));
}
/* source 2: rows preserved from the old file that the API no longer lists */
for (const p of projects) {
  if (!YEARS.includes(p.y)) continue;
  addRoster(p.y, p.o, apiOrgByName.get(p.o));
}
const rosterOut = {};
for (const y of years) rosterOut[y] = [...rosters[y].values()].sort((a, b) => a.name.localeCompare(b.name));
const rStr = JSON.stringify(rosterOut);
JSON.parse(rStr);
writeFileSync(`${DATA}/gsoc-orgs.json.tmp`, rStr);
renameSync(`${DATA}/gsoc-orgs.json.tmp`, `${DATA}/gsoc-orgs.json`);
for (const y of years) console.log(`gsoc-orgs ${y}: ${rosterOut[y].length} orgs`);
console.log("gsoc-orgs.json written");
