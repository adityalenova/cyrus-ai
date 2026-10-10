/* ══ scripts/other-programs.mjs — Task 3: LFX + Outreachy + Summer of Bitcoin → otherProjects.json ══
   node scripts/other-programs.mjs

   Sources that actually exist (verified 2026-10 by probing):
   - LFX Mentorship: https://api.mentorship.lfx.linuxfoundation.org/projects?limit=100 (&nextPageKey=...)
     (api.lfx.linuxfoundation.org does not resolve; insights API needs a PAT). Each project carries
     programTerms[] with unix startDateTime/endDateTime -> one row per CLOSED term starting 2022-2026.
   - Outreachy: no JSON API (all /api/v1/... guesses 404). Public per-round cohort pages under
     outreachy.org list each intern project as <div class="card border"> with an org <h4> + title
     <strong>; "project details hidden" without login, so descriptions/mentors are unavailable.
   - Summer of Bitcoin: api.summerofbitcoin.org is dead and the site is Softr+Airtable
     (base appX7FFuCrAihbphb requires auth), BUT the Softr runtime's datasource proxy is public:
     POST https://www.summerofbitcoin.org/v1/datasource/airtable/{appId}/{pageId}/{blockId}/{dsId}/data
     Ids: app 5abf9a13-d06f-44d6-b50c-187328a34a81; program-details page 7733c2de-523e-4110-a1f2-6605582f4319,
     block 500c7a5a-a23a-4b0a-abd9-6a648ff351df, ds 3b67eedf-8bd9-42cc-b4a7-82f8947977fd (table "Projects");
     organizations page e1fe7459-43b9-446e-b78f-6bac70aa6d0c, block 27095893-142f-450d-ba8e-b244e02722f4,
     ds 7f16bea1-c0aa-46b3-af3a-82fcec855166 (table "Orgs"). The Airtable tables hold the CURRENT
     program year (2026) - past-year tables/views are not exposed. Ids are re-discovered live via
     /softr-system/pages/<slug> where possible.

   Resilient: writes .tmp + rename only if at least one program yields rows; failing sources are
   skipped and reported.
   ════════════════════════════════════════════════════════════════════════════════════════════════ */
import { writeFileSync, renameSync } from "fs";

const ROOT = new URL("..", import.meta.url).pathname;
const DATA = `${ROOT}public/data`;
const YEARS = [2022, 2023, 2024, 2025, 2026];
const EMOJI = /[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]/gu;
const clean = (s) => (s || "").replace(EMOJI, "").replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, opts, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { ...opts, headers: { accept: "application/json", ...(opts?.headers || {}) }, signal: AbortSignal.timeout(30000) });
      if (r.ok) return await r.json();
    } catch {}
    await sleep(1200 * (i + 1));
  }
  return null;
}
const post = (url, body) => get(url, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

const projects = [];
const orgs = {};
const report = {};

/* ── 1. LFX Mentorship ──────────────────────────────────────────────── */
try {
  const LFX = "https://api.mentorship.lfx.linuxfoundation.org/projects";
  let key = null, pages = 0, lfxCount = 0;
  do {
    const j = await get(`${LFX}?limit=100${key ? `&nextPageKey=${encodeURIComponent(key)}` : ""}`);
    if (!j?.projects?.length) break;
    for (const p of j.projects) {
      const org = clean(p.lfProjectName || "").slice(0, 80) || "Linux Foundation";
      const mentors = clean((p.apprenticeNeeds?.mentors || []).map((m) => m.name).join(", ")).slice(0, 60);
      const skills = (p.apprenticeNeeds?.skills || []).slice(0, 5).map((x) => clean(x).slice(0, 22)).filter(Boolean);
      const topics = (p.industry || "").split(",").map((x) => clean(x).slice(0, 26)).filter(Boolean).slice(0, 3);
      if (!orgs[org]) orgs[org] = { url: p.websiteUrl || p.repoLink || "" };
      for (const t of p.programTerms || []) {
        const y = new Date((t.startDateTime || 0) * 1000).getUTCFullYear();
        if (!YEARS.includes(y) || t.active !== "closed") continue;
        projects.push({
          y, u: `lfx-${p.projectId}-${t.id}`,
          t: clean(p.name).slice(0, 120), o: org, s: clean(t.name || "").slice(0, 20),
          tt: skills, tp: topics, b: clean(p.description).slice(0, 200), m: mentors,
          url: `https://mentorship.lfx.linuxfoundation.org/project/${p.projectId}`, program: "LFX",
        });
        lfxCount++;
      }
    }
    key = j.nextPageKey; pages++;
  } while (key && pages < 150);
  report.LFX = lfxCount ? `ok - ${lfxCount} project-terms from ${pages} pages` : "unreachable/empty - skipped";
} catch (e) { report.LFX = `FAILED: ${String(e).slice(0, 120)}`; }

/* ── 2. Outreachy ───────────────────────────────────────────────────── */
try {
  const ROUNDS = [
    ["/outreachy-may-2022-internship-round/", 2022],
    ["/outreachy-december-2022-internship-round/", 2022],
    ["/outreachy-may-2023-internship-cohort/", 2023],
    ["/outreachy-december-2023-internship-round/", 2023],
    ["/outreachy-june-2024-internship-round/", 2024],
    ["/outreachy-dec-2024-internship-cohort/", 2024],
    ["/outreachy-june-2025-internship-cohort/", 2025],
    ["/outreachy-december-2025-internship-cohort/", 2025],
    ["/outreachy-may-2026-internship-cohort/", 2026],
    ["/outreachy-dec-2026-internship-cohort/", 2026],
  ];
  let ouCount = 0, ouPages = 0;
  for (const [path, y] of ROUNDS) {
    const html = await (async () => {
      for (let i = 0; i < 3; i++) {
        try { const r = await fetch(`https://www.outreachy.org${path}`, { signal: AbortSignal.timeout(25000) }); if (r.ok) return await r.text(); } catch {}
        await sleep(1000);
      }
      return null;
    })();
    if (!html || !html.includes("card border")) continue;
    ouPages++;
    const roundSlug = path.replace(/\//g, "");
    const section = html.slice(html.indexOf("Past Participating Communities"));
    const tokenRe = /<h4>([\s\S]*?)<\/h4>|<div class="card border" id="([^"]+)">([\s\S]*?)(?=<div class="card border" id=|<\/section>|$)/g;
    let curOrg = "", curLink = "", m;
    while ((m = tokenRe.exec(section))) {
      if (m[1] !== undefined) {
        curOrg = clean(m[1]).slice(0, 80);
        curLink = (section.slice(m.index, m.index + 2000).match(/href="(\/outreachy[^"]*communities\/[^"]+)"/) || [])[1] || "";
        continue;
      }
      const [id, body] = [m[2], m[3]];
      const title = (body.match(/<strong>([^<]{3,})</) || [])[1] || "";
      if (!title) continue;
      // card header reads "<Org> [closed] project #N" - more reliable than the preceding <h4>,
      // which some round pages render for only part of the communities.
      const headerTxt = clean((body.match(/card-header[^>]*>([\s\S]*?)<\/div>/) || [])[1] || "")
        .replace(/\s*(?:closed\s+)?project\s*#\d+.*$/is, "").slice(0, 80);
      const org = (headerTxt && norm(id).startsWith(norm(headerTxt)) && norm(headerTxt)) ? headerTxt : (curOrg || headerTxt);
      if (!org) continue;
      if (!orgs[org]) orgs[org] = { url: (curLink && curLink.toLowerCase().includes(norm(org).slice(0, 12))) ? `https://www.outreachy.org${curLink}` : "https://www.outreachy.org/" };
      projects.push({ y, u: `ou-${roundSlug}-${id}`, t: clean(title).slice(0, 120), o: org, s: "", tt: [], tp: [], b: "", m: "", url: `https://www.outreachy.org${path}${id ? `#${id}` : ""}`, program: "Outreachy" });
      ouCount++;
    }
  }
  report.Outreachy = ouCount ? `ok - ${ouCount} intern projects from ${ouPages} round pages (titles+orgs only; details hidden without login)` : "no parseable round pages - skipped";
} catch (e) { report.Outreachy = `FAILED: ${String(e).slice(0, 120)}`; }

/* ── 3. Summer of Bitcoin ───────────────────────────────────────────── */
try {
  const APP = "5abf9a13-d06f-44d6-b50c-187328a34a81";
  async function discover(slug, tableName) {
    const def = await get(`https://www.summerofbitcoin.org/softr-system/pages/${slug}`);
    if (!def) return null;
    const b = (def.blocks || []).find((x) => x.collection?.dataSource?.airtable?.tableName === tableName);
    if (!b) return null;
    return { pageId: def.pageId, blockId: b.id, dsId: b.collection.dataSource.id };
  }
  const dataUrl = (d) => `https://www.summerofbitcoin.org/v1/datasource/airtable/${APP}/${d.pageId}/${d.blockId}/${d.dsId}/data`;
  const paged = async (d) => {
    const rows = []; let offset = null, guard = 0;
    do {
      const j = await post(dataUrl(d), { options: { cellFormat: "string", timeZone: "UTC", userLocale: "en-US" }, pagingOption: { offset, count: 100 } });
      if (!j?.records) break;
      rows.push(...j.records); offset = j.offset || null;
    } while (offset && guard++ < 40);
    return rows;
  };
  const pjIds = (await discover("program-details", "Projects")) ||
    { pageId: "7733c2de-523e-4110-a1f2-6605582f4319", blockId: "500c7a5a-a23a-4b0a-abd9-6a648ff351df", dsId: "3b67eedf-8bd9-42cc-b4a7-82f8947977fd" };
  const orgIds = (await discover("organizations", "Orgs")) ||
    { pageId: "e1fe7459-43b9-446e-b78f-6bac70aa6d0c", blockId: "27095893-142f-450d-ba8e-b244e02722f4", dsId: "7f16bea1-c0aa-46b3-af3a-82fcec855166" };
  const pj = await paged(pjIds);
  const og = await paged(orgIds);
  // Airtable tables here hold the CURRENT program year only. The Years table lists COMPLETED
  // programs (latest 2025); the org-detail links on the live site carry the current year slug.
  let sobYear = 2026;
  const orgDef = await get("https://www.summerofbitcoin.org/softr-system/pages/organizations");
  const mYear = JSON.stringify(orgDef || {}).match(/\/(20\d\d)-org-details\//);
  if (mYear) sobYear = +mYear[1];
  for (const r of og) {
    const name = clean(r.fields.Name).slice(0, 80);
    if (!name) continue;
    const slug = clean(r.fields["SEO:Slug"]);
    orgs[name] = { url: slug ? `https://www.summerofbitcoin.org/${sobYear}-org-details/${slug}/r/${r.id}` : "https://www.summerofbitcoin.org/organizations" };
  }
  let sobCount = 0;
  for (const r of pj) {
    const f = r.fields;
    const org = clean(f.Project).slice(0, 80);
    const title = clean(f.Description).slice(0, 120);
    if (!org || !title) continue;
    if (!orgs[org]) orgs[org] = { url: "https://www.summerofbitcoin.org/organizations" };
    projects.push({
      y: sobYear, u: `sob-${r.id}`, t: title, o: org, s: "",
      tt: [], tp: [], b: clean(`Summer of Bitcoin ${sobYear}: ${f.University || ""}${f.Country ? ", " + f.Country : ""}`).slice(0, 200),
      m: clean(f.Mentor).slice(0, 60),
      url: (f.Link || "").match(/https?:\/\/\S+/)?.[0]?.replace(/[<>]/g, "") || `https://www.summerofbitcoin.org/past-programs`,
      program: "Summer of Bitcoin",
    });
    sobCount++;
  }
  report["Summer of Bitcoin"] = sobCount ? `ok - ${sobCount} projects (${sobYear} cohort) + ${og.length} orgs; tables only expose the current year - 2022-${sobYear - 1} not retrievable (auth-gated Airtable)` : "no records - skipped";
} catch (e) { report["Summer of Bitcoin"] = `FAILED: ${String(e).slice(0, 120)}`; }

/* ── write (only if something worked) ───────────────────────────────── */
const byYear = {};
for (const p of projects) byYear[`${p.program}/${p.y}`] = (byYear[`${p.program}/${p.y}`] || 0) + 1;
if (!projects.length) { console.error("FATAL: every source failed - otherProjects.json NOT written"); process.exit(1); }
const str = JSON.stringify({ projects, orgs });
JSON.parse(str);
writeFileSync(`${DATA}/otherProjects.json.tmp`, str);
renameSync(`${DATA}/otherProjects.json.tmp`, `${DATA}/otherProjects.json`);
console.log(`otherProjects.json: ${projects.length} projects, ${Object.keys(orgs).length} orgs`);
console.log("byYear:", byYear);
for (const k in report) console.log(`${k}: ${report[k]}`);
