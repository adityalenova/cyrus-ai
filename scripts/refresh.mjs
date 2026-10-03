/* ══ scripts/refresh.mjs — cyrus.ai auto-update pipeline ══════════════
   node scripts/refresh.mjs            # everything
   node scripts/refresh.mjs devpost    # only the hackathon shelf
   node scripts/refresh.mjs gsoc       # only the GSoC project archive

   Writes:
     src/data/hackathonsLive.ts   (compiled into the site bundle)
     public/data/gsoc-projects.json (fetched at runtime by /opensource)
   Cron example (daily 06:00): 0 6 * * * cd ~/Desktop/agent-skills && npm run refresh -- devpost
   ═════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const ROOT = new URL("..", import.meta.url).pathname;
const EMOJI = /[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]/gu;
const clean = (s) => (s || "").replace(EMOJI, "").replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();
const today = new Date().toISOString().slice(0, 10);

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

/* ── 1. Devpost hackathons → src/data/hackathonsLive.ts ─────────────── */
const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
function parseDates(d) {
  const m = (d || "").match(/([A-Za-z]{3,9})\.?\s*(\d{1,2})\s*(?:-\s*(?:(?:[A-Za-z]{3,9})\.?\s*)?(\d{1,2}))?,?\s*(20\d\d)/);
  if (!m) return null;
  const mo = MON[m[1].slice(0, 3).toLowerCase()];
  if (!mo) return null;
  return { month: mo, day: +m[2], endDay: m[3] ? +m[3] : +m[2], year: +m[4] };
}
const LOGOS = { meta: "facebook", google: "google", microsoft: "microsoft", amazon: "aws", nvidia: "nvidia", github: "github", ibm: "ibm", oracle: "oracle", salesforce: "salesforce", intel: "intel", amd: "amd", qualcomm: "qualcomm", spotify: "spotify", uber: "uber", airbnb: "airbnb", adobe: "adobe", mongodb: "mongodb", redis: "redis", cloudflare: "cloudflare", vercel: "vercel", jetbrains: "jetbrains", eclipse: "eclipse-foundation", linux: "linuxfoundation", hugging: "huggingface", anthropic: "anthropics", openai: "openai", devpost: "devpost", girlscript: "GirlScript", twilio: "twilio", stripe: "stripe", figma: "figma", postman: "postman", docker: "moby" };
const logoFor = (org) => { const o = (org || "").toLowerCase(); for (const k in LOGOS) if (o.includes(k)) return LOGOS[k]; return "devpost"; };
const hashOf = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };

/* theme → tags / languages / bench ideas. Keep this table's keys in sync
   with the curated set; new themes still render via the fallback. */
const IDEA_FILE = `${ROOT}/scripts/hackThemes.json`;
const { THEME_TAGS, LANGS, IDEAS } = JSON.parse(readFileSync(IDEA_FILE, "utf8"));
const PALETTE = ["#3b6ea5", "#b4602c", "#3e7d4f", "#7a5aa8", "#a97b1f", "#8c3f3f", "#2f7f86"];
const ARTS = ["globe", "terminal", "cloud", "compass", "notebook", "gpu", "flag", "llama", "cart", "cup", "leaf", "tricolor"];

async function refreshDevpost() {
  const seen = new Set(), rows = [];
  for (const status of ["open", "upcoming", "ended"]) {
    for (let page = 1; page <= (status === "ended" ? 4 : 6); page++) {
      const j = await get(`https://devpost.com/api/hackathons?status%5B%5D=${status}&order_by=prize-amount&page=${page}`);
      const hs = j?.hackathons || [];
      if (!hs.length) break;
      for (const h of hs) {
        if (seen.has(h.id)) continue; seen.add(h.id);
        rows.push({
          id: h.id, title: h.title, online: h.displayed_location?.location || "Online",
          state: h.open_state, url: h.url, dates: h.submission_period_dates,
          themes: (h.themes || []).map((t) => t.name).slice(0, 4),
          prize: (h.prize_amount || "").replace(/<[^>]+>/g, ""),
          org: h.organization_name || "", regs: h.registrations_count || 0,
          left: h.time_left_to_submission || "",
        });
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  const prizeNum = (p) => { const n = parseInt((p || "").replace(/[^0-9]/g, "")); return isNaN(n) ? 0 : n; };
  const out = []; const names = new Set();
  for (const r of rows) {
    const name = clean(r.title);
    if (!name || names.has(name.toLowerCase())) continue; names.add(name.toLowerCase());
    const pd = parseDates(r.dates);
    const deadline = pd ? `${pd.year}-${String(pd.month).padStart(2, "0")}-${String(pd.endDay).padStart(2, "0")}` : (r.state === "open" ? "2026-12-31" : "2026-11-30");
    const themes = (r.themes || []).filter(Boolean);
    const tLow = themes.map((t) => t.toLowerCase());
    const tags = [...new Set(tLow.flatMap((t) => THEME_TAGS[t] || [t.replace(/[^a-z0-9+#./ -]/g, "").trim() || "hackathon"]))].slice(0, 5);
    const langs = [...new Set(tLow.flatMap((t) => LANGS[t] || []))].slice(0, 2);
    const primary = tLow.find((t) => IDEAS[t]) || "open ended";
    const h = hashOf(r.title + r.id);
    const st = r.state === "ended" ? "closed" : r.state;
    const prize = clean(r.prize) || "Devpost prizes";
    const org = clean(r.org) || "Devpost community";
    out.push({
      id: `devpost-${r.id}`, name, org, orgLogo: logoFor(org),
      theme: `${themes.join(" + ") || "Open innovation"} on Devpost - ${clean(r.dates)}`,
      status: st, deadline, estimated: true,
      participants: r.regs > 999 ? (r.regs / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(r.regs || "new"),
      prize,
      format: (r.online || "Online").toLowerCase() === "online" ? "online, worldwide" : `in-person - ${clean(r.online)}`,
      tags, eligibility: "Open via devpost.com - check the official rules page",
      timeline: [
        { label: "Registration", when: clean(r.dates).split(",")[0], note: "Sign up free on the Devpost listing" },
        { label: "Build window", when: clean(r.dates), note: r.left ? `${clean(r.left)} at snapshot time` : "See official timeline" },
        { label: "Submission", when: deadline, note: "Project + repo + demo video via Devpost" },
        { label: "Winners", when: "Judges' pick after close", note: "Announced on the Devpost project page" },
      ],
      prep: [
        `Read the judging criteria on the Devpost page first - ${themes[0] || "open-ended"} events score alignment over polish`,
        "Ship something runnable: judges skip beautiful demos they cannot try",
        "Post early to the community Slack/Discord - mentors spot half the winners there",
        `Track the prize breakdown (${prize}) and target one specific track, not the whole board`,
      ],
      approach: [
        "One working flow beats five stubs - finish the happy path end to end",
        "Record the demo video before you sleep; submission day is when repos break",
        "Write the project description for a judge who has never heard of your idea",
      ],
      ideas: (IDEAS[primary] || IDEAS["open ended"]).map(([title, pitch]) => ({ title, pitch })),
      stack: { languages: langs.length ? langs : ["Python", "JavaScript"], frameworks: ["Devpost APIs"], tools: ["Devpost", "Git"], why: `Built for the ${themes[0] || "open-ended"} track with a judging-friendly demo` },
      perks: `${prize} · Devpost community reach${r.regs > 5000 ? " · large field" : ""}`,
      color: PALETTE[h % PALETTE.length], art: ARTS[h % ARTS.length],
      url: r.url,
    });
  }
  out.sort((a, b) => (a.status === b.status ? prizeNum(b.prize) - prizeNum(a.prize) : a.status === "open" ? -1 : b.status === "open" ? 1 : a.status === "upcoming" ? -1 : 1));
  if (out.length < 50) { console.log(`devpost: only ${out.length} results - API looks degraded, keeping the existing file`); return; }
  const body = out.map((o) => "  " + JSON.stringify(o)).join(",\n");
  const src = `/* ══ hackathonsLive.ts — Devpost API pull, regenerated by npm run refresh ═
   Live snapshot ${today} from https://devpost.com/api/hackathons (open + upcoming + recent ended).
   The url field is the official Devpost page; dates marked estimated come from the listing text. */
import type { Hack } from "./hackathons";

export interface HackLive extends Hack { url: string }

export const HACKS_LIVE: HackLive[] = [
${body},
];
`;
  writeFileSync(`${ROOT}src/data/hackathonsLive.ts`, src);
  console.log(`devpost: ${out.length} hackathons → src/data/hackathonsLive.ts`);
}

/* ── 2. GSoC archive → public/data/gsoc-projects.json ────────────────── */
async function refreshGsoc() {
  const BASE = "https://summerofcode.withgoogle.com/api";
  const YEARS = [2021, 2022, 2023, 2024, 2025];
  const projects = [], orgs = {};
  for (const year of YEARS) {
    const list = await get(`${BASE}/projects/?year=${year}`);
    if (!list?.result) { console.log("  no list for", year); continue; }
    const uids = list.result;
    let kept = 0, done = 0;
    const CONC = 12;
    for (let i = 0; i < uids.length; i += CONC) {
      const batch = await Promise.all(uids.slice(i, i + CONC).map((u) => get(`${BASE}/projects/${u}/`)));
      for (const j of batch) {
        done++;
        const p = j?.entities?.projects?.[0];
        if (!p || p.status !== "passed") continue;
        const orgEnt = (j.entities.organizations || []).find((o) => o.uid === p.organization_id) || (j.entities.organizations || [])[0];
        const orgName = clean(orgEnt?.name || p.organization || "").slice(0, 80);
        if (orgEnt?.name) orgs[orgName] = { url: orgEnt.url || "", category: orgEnt.category || "" };
        kept++;
        projects.push({
          y: year, u: p.uid,
          t: clean(p.title).slice(0, 120), o: orgName, s: p.size || "medium",
          tt: (p.tech_tags || []).slice(0, 5).map((x) => clean(x).slice(0, 22)).filter(Boolean),
          tp: (p.topic_tags || []).slice(0, 3).map((x) => clean(x).slice(0, 26)).filter(Boolean),
          b: clean(p.body).slice(0, 200), m: clean(p.mentors_display_name || "").slice(0, 60),
        });
      }
    }
    console.log(`gsoc ${year}: ${kept}/${done} accepted kept`);
  }
  if (projects.length < 5000) { console.log(`gsoc: only ${projects.length} projects - archive looks degraded, keeping the existing file`); return; }
  mkdirSync(`${ROOT}public/data`, { recursive: true });
  writeFileSync(`${ROOT}public/data/gsoc-projects.json`, JSON.stringify({ projects, orgs }));
  console.log(`gsoc: ${projects.length} projects, ${Object.keys(orgs).length} orgs → public/data/gsoc-projects.json`);
}

const which = (process.argv[2] || "all").toLowerCase();
if (which === "devpost" || which === "all") await refreshDevpost();
if (which === "gsoc" || which === "all") await refreshGsoc();
console.log("refresh done", today);
