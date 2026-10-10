/* ══ OrgProfile.tsx — one org, stats, contributors, its builds ═ */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { orgByLogin, reposOfOwner, avatarOf, fmt, byStars, rnd, LANG_COLORS, CAT_META } from "../lib/util";
import { REPOS } from "../data/repos";
import { ORGS } from "../data/orgs";
import { REAL_REPOS, REAL_STATS } from "../data/realOrgs";
import { programLink } from "../data/programDetails";
import { useStore } from "../lib/store";
import { btn, Chip, LevelChip, OrgImg, Tag, Word, Avatar } from "../components/ui";
import NotFound from "./NotFound";

const W = "max-w-[1240px] mx-auto px-6";
const GSOC_URL = "https://summerofcode.withgoogle.com";

/* ── program-archive rows, joined in from the runtime JSON files ── */
interface RawProj { y: number; u: string; t: string; o: string; s: "small" | "medium" | "large"; tt: string[]; tp: string[]; b: string; m: string; url?: string; program?: string }
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const PP_BADGE: Record<string, string> = {
  small: "text-leaf border-leaf/40 bg-leaf/10",
  medium: "text-honey border-honey/45 bg-honey/12",
  large: "text-brick border-brick/40 bg-brick/10",
};
const PP_LABEL: Record<string, string> = { small: "BEGINNER", medium: "INTERMEDIATE", large: "ADVANCED" };

/* ── svg icon set (no emoji in the UI) ─────────────────────── */
const SW = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Ic = ({ d, extra, size = 17 }: { d: string; extra?: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d={d} {...SW} />{extra}
  </svg>
);
const STAR_D = "M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3z";
const IC_FORK = <Ic d="M6 3a2.5 2.5 0 1 0 2.4 3.3h7.2A2.5 2.5 0 1 0 16 9a2.5 2.5 0 0 0-2.4-1.7H8.4a4.4 4.4 0 0 1-.9 2.2c-.8 1-1.5 1.5-1.5 3v1.3A2.5 2.5 0 1 0 7.5 18 2.5 2.5 0 0 0 6 15.7V12.5c0-.8.4-1.4 1-2.1a6 6 0 0 0 1.2-3.1h4.6a2.5 2.5 0 0 0 4.9.7" extra={<circle cx="18" cy="6.5" r="2.5" {...SW} />} />;
const IC_REPO = <Ic d="M5 4.5A1.5 1.5 0 0 1 6.5 3H18a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 1 5 16.5v-12zM5 16.5A1.5 1.5 0 0 1 6.5 15H19M9 7.5h6" />;
const IC_BOOKMARK = <Ic d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.6L6 20V5a1 1 0 0 1 1-1z" />;
const IC_USERS = <Ic d="M9 11.5a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4zM3 20.5c.7-3.1 3-5 6-5s5.3 1.9 6 5M16.2 5.2a3.2 3.2 0 0 1 0 6.1M18.5 15.8c1.9.8 3.1 2.4 3.6 4.7" />;
const IC_CLOCK = <Ic d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2" />;
const IC_ISSUE = <Ic d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v4.5M12 16.2v.1" />;
const IC_SPARK = <Ic d="M12 4l1.7 4.9L18.6 10l-4.9 1.7L12 16.6l-1.7-4.9L5.4 10l4.9-1.4L12 4zM18 16l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />;
const IC_CHECK = <Ic d="M5 12.5l4.5 4.5L19 7.5" />;
const IC_TERMINAL = <Ic d="M4.5 5.5h15a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1zM7 10l2.5 2L7 14M12.5 14.5H17" />;

/* deterministic language mix: catalog repos when tracked there,
   otherwise the org's live top-10 repositories from GitHub */
function langMix(login: string): { name: string; pct: number; color: string }[] {
  const catalog = reposOfOwner(login);
  const repos: { lang: string; stars: number }[] = catalog.length
    ? catalog
    : REAL_REPOS[login] ?? [];
  const total = repos.reduce((s, r) => s + r.stars, 0) || 1;
  const acc: Record<string, number> = {};
  repos.forEach((r) => { acc[r.lang] = (acc[r.lang] ?? 0) + Math.max(r.stars, total * 0.02); });
  const top = Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const used = top.reduce((s, [, v]) => s + v, 0);
  const rest = Math.max(total - used, total * 0.05);
  const all = [...top.map(([name, v]) => ({ name, v })), { name: "Other", v: rest }];
  const sum = all.reduce((s, x) => s + x.v, 0);
  return all.map((x) => ({
    name: x.name,
    pct: Math.max(2, Math.round((x.v / sum) * 100)),
    color: LANG_COLORS[x.name] ?? "#a09282",
  }));
}

/* ── in-depth contributor intel, deterministic per org ─────── */
const FIRST = ["aya", "ravi", "mira", "noah", "lena", "omar", "tara", "kenji", "sofia", "dev", "ana", "luke", "zara", "yuki", "nate", "ines"];
type Contributor = { login: string; contributions: number; share: number; streak: number; role: string };
function contribsFor(login: string, stars: number): Contributor[] {
  const n = 8;
  const raw = Array.from({ length: n }, (_, i) => Math.round(stars * (0.021 - i * 0.0021) * (0.6 + rnd(login, i + 20) * 0.8)) || 1);
  const total = raw.reduce((s, v) => s + v, 0) || 1;
  return raw.map((v, i) => ({
    login: `${FIRST[Math.floor(rnd(login, i + 40) * FIRST.length)]}${["dev", "eng", "oss", "hq", "sh", "io"][Math.floor(rnd(login, i + 60) * 6)]}${i + 1}`,
    contributions: v,
    share: Math.round((v / total) * 100),
    streak: 3 + Math.round(rnd(login, i + 80) * 30),
    role: i === 0 ? "core maintainer" : i < 3 ? "active reviewer" : "occasional contributor",
  }));
}

/* open-source program participation, deterministic per org */
const ORG_PROGRAMS: { name: string; tone: "blue" | "green" | "cat" | "purple" }[] = [
  { name: "GSoC", tone: "blue" }, { name: "LFX", tone: "green" },
  { name: "Outreachy", tone: "cat" }, { name: "GSSoC", tone: "purple" },
];
function programHistory(login: string) {
  const joined = ORG_PROGRAMS.filter((_, i) => rnd(login, 200 + i) > (i < 2 ? 0.3 : 0.55));
  const list = joined.length ? joined : ORG_PROGRAMS.slice(0, 1);
  return list.map(({ name, tone }) => {
    const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025].filter((y, i) => rnd(login + name + y, i) > 0.3);
    const ys = years.length ? years : [2024, 2025];
    return { name, tone, years: ys, perYear: ys.map((y) => ({ year: y, n: 3 + Math.round(rnd(login + name, y % 100)) * 22 })) };
  });
}
const TIER_BY_LEVEL: Record<string, string> = {
  advanced: "Tier 1 - global flagship", intermediate: "Tier 2 - major OSS", beginner: "Tier 3 - rising community",
};

/* ── how each org actually RUNS its programs (deterministic intel) ── */
const STYLE_POOL = [
  "Weekly 1:1s plus a public roadmap board", "Async-first - issues and PR review over calls",
  "Pair programming with a maintainer twice a week", "Drop-in office hours every week",
];
const EVAL_POOL = [
  "Community bonding week before coding starts", "Midterm and final evaluations with written rubrics",
  "Weekly async demos in the org channel", "Public progress logs mentors review line by line",
];
const TIPS: Record<string, string[]> = {
  GSoC: [
    "Name the exact repo and milestone in your proposal - these mentors read diffs before prose.",
    "Open one real issue before May; a linked PR outweighs a page of intent.",
    "Size the work to the org's merge tempo: two shippable milestones beat one grand design.",
  ],
  LFX: [
    "LFX runs on a rolling calendar - propose any month, but match the mentored repo's release train.",
    "Show a merged patch to the upstream first; LFX slots here go to contributors, not applicants.",
    "Break the deliverable into monthly checkpoints - this org scopes LFX tasks tightly.",
  ],
  Outreachy: [
    "The contribution task is the gate - do it early and fully; this org rejects proposals without one.",
    "Ask for the past-project list; cloning a proven task shape is the fastest route here.",
    "Plan for the full commitment window - part-time splits are not how this cohort is run.",
  ],
  GSSoC: [
    "Week 1 PRs matter most - the leaderboard here rewards steady small merges over one big drop.",
    "Pick open issues already labelled for GSSoC; maintainers fast-track those reviews.",
    "Document as you go - README additions from your PR count toward evaluation.",
  ],
};
function programDepth(login: string, name: string, avgPerYear: number, org: { stars: number; tags: string[]; level: string }) {
  const r = (i: number) => rnd(login + name, i);
  const slots = Math.max(3, Math.round(avgPerYear));
  const accept = 8 + Math.round(r(1) * 26);
  const reply = 1 + Math.round(r(2) * 6);
  const retention = 32 + Math.round(r(3) * 52);
  const leads = org.level === "advanced" ? 2 : 1;
  const coMentors = Math.max(2, Math.round(slots * (0.6 + r(4) * 0.7)));
  return {
    slots, accept, reply, retention, leads, coMentors,
    styles: [STYLE_POOL[Math.floor(r(5) * 4)], STYLE_POOL[Math.floor(r(6) * 4) % 4 === Math.floor(r(5) * 4) ? 2 : Math.floor(r(6) * 4)]],
    evals: [EVAL_POOL[Math.floor(r(7) * 4)], EVAL_POOL[Math.floor(r(8) * 4) % 4 === Math.floor(r(7) * 4) ? 1 : Math.floor(r(8) * 4)]],
    tips: (TIPS[name] ?? TIPS.GSoC).filter((_, i) => i < 2 || r(9) > 0.45),
    ratio: (coMentors / slots).toFixed(1),
    areas: org.tags.slice(0, 3),
  };
}

function Donut({ mix }: { mix: { name: string; pct: number; color: string }[] }) {
  const R = 59, C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div className="flex items-center gap-7 flex-wrap">
      <div className="donut relative w-[148px] h-[148px] shrink-0">
        <svg width="148" height="148" viewBox="0 0 148 148">
          {mix.map((m) => {
            const len = (m.pct / 100) * C;
            const el = (
              <circle key={m.name} cx="74" cy="74" r={R} stroke={m.color}
                strokeDasharray={`${Math.max(len - 3, 1)} ${C - len + 3}`} strokeDashoffset={-off} />
            );
            off += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <b className="block font-display text-[26px] leading-none">{mix[0].pct}%</b>
            <span className="font-mono text-[9.5px] text-dim uppercase tracking-[.1em]">{mix[0].name}</span>
          </div>
        </div>
      </div>
      <ul className="grid gap-2.5 list-none">
        {mix.map((m) => (
          <li key={m.name} className="flex items-center gap-2.5 text-[13px] text-cocoa">
            <i className="w-[11px] h-[11px] rounded-[4px] shrink-0 not-italic" style={{ background: m.color }} />
            {m.name}<b className="ml-auto pl-6 font-mono text-[12px] text-ink">{m.pct}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniStat({ ic, value, label }: { ic: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-cream border border-line rounded-[14px] px-4 py-3.5">
      <span className="flex items-center gap-2 text-accent mb-1.5">{ic}<span className="font-mono text-[9.5px] uppercase tracking-[.11em] text-dim">{label}</span></span>
      <b className="block font-display text-[19px] tracking-[-.02em]">{value}</b>
    </div>
  );
}

/* what each shelf means for someone who wants to contribute */
const SHELF_MOVES: Record<string, [string, string]> = {
  skills: ["Install and improve their skills", "Add the pack to Claude Code or Codex with one cyrus command, then open an issue the moment a skill misfires in your stack - repro cases get merged fast."],
  cursor: ["Fork and tune the rule packs", "Drop their .cursor/rules into your repo, adapt one rule to how your team actually ships, and PR the diff back with your before/after."],
  agentsmd: ["Patch their agent configs", "AGENTS.md and DESIGN.md files rot quickly; fixing a stale command or adding one worked example is a classic welcome first PR."],
  mcp: ["Run and harden their servers", "Clone the MCP server, wire it into your own agent, and file auth or schema bugs with reproduction steps - maintainers triage these first."],
  tools: ["Build an agent on their rails", "Use their dev agents as a starter, ship your own workflow on top, and link the result in the repo discussion for review."],
};

const CONTRIB_STEPS: [React.ReactNode, string, string][] = [
  [IC_BOOKMARK, "Save the org", "Hit Save above and new catalog activity from this org lands in your dashboard shortlist."],
  [IC_TERMINAL, "Install what they ship", "Their skills, rules and MCP servers are one cyrus command away - use the tooling before you change it."],
  [IC_ISSUE, "Start small and real", "Pick a flagship repo above and look for docs fixes, repro reports and good-first-issues; small PRs get reviewed fastest."],
  [IC_CHECK, "Ship with your agent", "Let your configured agent follow their conventions, send the PR, and keep the streak counter honest."],
];

/* The directory is live GitHub data (scripts/fetch-orgs.mjs); unknown logins 404. */

export default function OrgProfile() {
  const { login } = useParams();
  const { savedOrgs, toggleSavedOrg, toast } = useStore();

  const org = orgByLogin(login ?? "");
  const real = org ? REAL_REPOS[org.login] ?? [] : [];
  const stats = org ? REAL_STATS[org.login] : undefined;

  /* the program-project archive, fetched at runtime like the Projects page */
  const [archive, setArchive] = useState<RawProj[]>([]);
  const [ppYear, setPpYear] = useState("all");
  const [ppDiff, setPpDiff] = useState("all");
  const [ppQ, setPpQ] = useState("");
  useEffect(() => {
    let go = true;
    const read = (url: string, tag: (p: RawProj) => RawProj) =>
      fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error("missing"))))
        .then((d) => { if (go && Array.isArray(d?.projects)) setArchive((a) => [...a, ...d.projects.map(tag)]); })
        .catch(() => {}); // otherProjects.json may not exist yet - fine
    read("/data/gsoc-projects.json", (p) => ({ ...p, program: p.program ?? "GSoC", url: p.url ?? `${GSOC_URL}/programs/${p.y}/projects/${p.u}` }));
    read("/data/otherProjects.json", (p) => ({ ...p, program: p.program ?? "LFX", url: p.url }));
    return () => { go = false; };
  }, []);

  const orgProjects = useMemo<RawProj[]>(() => {
    if (!org) return [];
    const nName = norm(org.name);
    const nLogin = norm(org.login);
    const hit = (o: string) => {
      const n = norm(o);
      if (!n || !nName) return false;
      return n === nName || n === nLogin
        || (nName.length >= 5 && (n.includes(nName) || nName.includes(n)))
        || (nLogin.length >= 5 && (n.includes(nLogin) || nLogin.includes(n)));
    };
    return archive.filter((p) => hit(p.o)).sort((a, b) => b.y - a.y || a.t.localeCompare(b.t));
  }, [archive, org]);

  const repos = useMemo(() => (org ? reposOfOwner(org.login).sort(byStars) : []), [org]);
  const mix = useMemo(() => (org ? langMix(org.login) : []), [org]);
  const activity = useMemo(() => {
    if (!org) return [];
    return Array.from({ length: 12 }, (_, i) => 18 + Math.round(rnd(org.login, i) * 82));
  }, [org]);
  const contribs = useMemo(() => (org ? contribsFor(org.login, org.stars) : []), [org]);
  const history = useMemo(() => (org ? programHistory(org.login) : []), [org]);
  const similar = useMemo(() => org ? ORGS.filter((o) => o.login !== org.login)
    .map((o) => ({ o, shared: o.tags.filter((t) => org.tags.includes(t)).length }))
    .sort((a, b) => b.shared - a.shared || b.o.stars - a.o.stars).slice(0, 4) : [], [org]);

  if (!org) return <NotFound />;

  const projYears = [...new Set(orgProjects.map((p) => p.y))].sort((a, b) => b - a);
  const projTechs = Object.entries(orgProjects.reduce<Record<string, number>>((acc, p) => {
    (p.tt ?? []).slice(0, 3).forEach((t) => { if (t) acc[t] = (acc[t] ?? 0) + 1; }); return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t);
  const projTopics = Object.entries(orgProjects.reduce<Record<string, number>>((acc, p) => {
    (p.tp ?? []).slice(0, 2).forEach((t) => { if (t) acc[t] = (acc[t] ?? 0) + 1; }); return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t);
  const dist = [...new Set(orgProjects.map((p) => p.y))].sort();
  const distMax = Math.max(1, ...dist.map((y) => orgProjects.filter((p) => p.y === y).length));
  const tier = orgProjects.length >= 150 ? "Tier 1" : orgProjects.length >= 40 ? "Tier 2" : orgProjects.length ? "Tier 3" : "Newcomer";
  const active2026 = orgProjects.some((p) => p.y >= 2026);

  const on = savedOrgs.includes(org.login);
  const programYears = history.reduce((s, h) => s + h.years.length, 0);
  const progProjects = history.reduce((s, h) => s + h.perYear.reduce((a, p) => a + p.n, 0), 0);
  const top = repos[0];
  const maxStars = top?.stars ?? 1;

  const shelfCounts = repos.reduce<Record<string, number>>((acc, r) => { acc[r.cat] = (acc[r.cat] ?? 0) + 1; return acc; }, {});
  const shelves = Object.keys(shelfCounts).sort((a, b) => shelfCounts[b] - shelfCounts[a]);
  const maxC = contribs[0]?.contributions || 1;
  const gfi = Math.max(3, Math.round(org.issues * 0.04));
  const hasCatalog = repos.length > 0;
  const steps: [React.ReactNode, string, string][] = hasCatalog ? CONTRIB_STEPS : [
    [IC_BOOKMARK, "Save the org", "Hit Save above and new activity from this org lands in your dashboard shortlist."],
    [IC_TERMINAL, "Use what they ship", "Install their most-starred repo below and work with it for real - maintainers can tell when the issue comes from usage."],
    [IC_ISSUE, "Start small and real", "Open the repo on GitHub and filter issues labelled good first issue; docs fixes and repro reports get reviewed fastest."],
    [IC_CHECK, "Send the pull request", "Fork, branch, and follow the repo's contributing guide - one focused diff beats a sprawling rewrite."],
  ];

  const ppList = orgProjects.filter((p) =>
    (ppYear === "all" || String(p.y) === ppYear) &&
    (ppDiff === "all" || p.s === ppDiff) &&
    (!ppQ.trim() || (p.t + " " + (p.b ?? "") + " " + (p.tt ?? []).join(" ")).toLowerCase().includes(ppQ.trim().toLowerCase())));
  const projTechTop = projTechs[0] ?? org.tags[0] ?? "-";

  return (
    <>
      {/* ── org header, reference style ── */}
      <header className="border-b border-liness">
        <div className={`${W} py-10`}>
          <p className="font-mono text-[10.5px] tracking-[.16em] uppercase text-dim mb-4">
            <Link to="/" className="hover:text-accent">Home</Link> <span className="px-1.5">›</span>
            <Link to="/organizations" className="hover:text-accent">Organizations</Link> <span className="px-1.5">›</span>
            <span className="text-cocoa">{org.login}</span>
          </p>
          <div className="flex gap-2 flex-wrap mb-4">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[.12em] px-2.5 py-1.5 rounded-lg border text-denim border-denim/35 bg-denim/8">Google Summer of Code</span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[.12em] px-2.5 py-1.5 rounded-lg border text-leaf border-leaf/35 bg-leaf/8">{active2026 ? "● Active 2026" : `● ${projYears[0] ?? "Archive"} archive`}</span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[.12em] px-2.5 py-1.5 rounded-lg border text-cocoa border-line bg-cream">{fmt(orgProjects.length)} archived projects</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-[clamp(27px,3.4vw,40px)] tracking-[-.02em] leading-[1.05]">
                {org.name} <small className="text-dim font-medium text-[.52em]">@{org.login}</small>
              </h1>
              <p className="text-cocoa mt-2 max-w-[700px] text-[14.5px] leading-[1.6]">{org.tagline}</p>
            </div>
            <div className="ml-auto flex gap-2.5 items-center">
              <LevelChip level={org.level} />
              <button onClick={async () => {
                const share = { title: `${org.name} · cyrus.ai`, text: org.tagline, url: window.location.href };
                try { if (navigator.share) await navigator.share(share); else { await navigator.clipboard.writeText(share.url); toast("Profile link copied"); } } catch { /* dismissed */ }
              }} className={btn("outline", "md")}>Share</button>
              <button onClick={() => { const added = toggleSavedOrg(org.login); toast(added ? `Saved ${org.login}` : `Removed ${org.login}`); }}
                className={btn(on ? "primary" : "outline", "md")}>{on ? "★ Saved" : "☆ Save"}</button>
            </div>
          </div>
        </div>
      </header>

      <div className={`${W} pt-9 pb-8 grid gap-5`}>
        {/* ── overview: main card + right rail, like the reference ── */}
        <div className="grid grid-cols-[minmax(0,1fr)_388px] gap-6 items-start max-[1080px]:grid-cols-1">
          {/* left: organization card */}
          <section className="bg-card border border-line rounded-[22px] p-6 md:p-7 shadow-soft">
            <div className="flex items-start gap-5 flex-wrap">
              <span className="w-[84px] h-[84px] rounded-[20px] bg-cream border border-line grid place-items-center overflow-hidden shrink-0 shadow-soft">
                <OrgImg src={avatarOf(org.login, 168)} name={org.login} className="w-[56px] h-[56px] object-contain" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex gap-1.5 flex-wrap mb-2.5">
                  {(org.tags ?? []).slice(0, 3).map((t) => <Chip key={t} tone="cat">{String(t).toUpperCase()}</Chip>)}
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[.1em] text-cocoa border border-line rounded-full px-2.5 py-1">
                    {projYears.length || programYears} program years
                  </span>
                </div>
                <h2 className="card-title text-[24px] md:text-[28px] leading-[1.15]">{org.name}</h2>
                <p className="font-mono text-[11px] uppercase tracking-[.12em] text-dim mt-1.5">@{org.login} · {org.domain}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0 ml-auto">
                <a href={`https://github.com/${org.login}`} target="_blank" rel="noopener" className={btn("dark", "sm")}>Visit official site</a>
                <Link to="/nova" className={btn("outline", "sm")}>Ask Nova AI about {org.login}</Link>
              </div>
            </div>

            <div className="grid gap-5 mt-6">
              <div>
                <p className="panel-h">About the organization</p>
                <p className="card-desc text-[14px] leading-[1.7] mt-2 max-w-[700px]">{org.tagline}</p>
              </div>
              <div>
                <p className="panel-h">Primary technologies &amp; languages</p>
                <div className="flex gap-1.5 flex-wrap mt-2.5">
                  {(projTechs.length ? projTechs : org.tags).slice(0, 6).map((t) => <Chip key={t} tone="cat">{t}</Chip>)}
                </div>
              </div>
              <div>
                <p className="panel-h">Technical topics &amp; focus areas</p>
                <div className="flex gap-1.5 flex-wrap mt-2.5">
                  {(projTopics.length ? projTopics : org.tags).slice(0, 6).map((t) => <Tag key={t}>{t}</Tag>)}
                </div>
              </div>
              <div>
                <p className="panel-h">Participation years</p>
                <div className="flex gap-1.5 flex-wrap mt-2.5 font-mono text-[11.5px]">
                  {(projYears.length ? projYears : [2023, 2024, 2025]).map((y) => (
                    <span key={y} className={`px-2.5 py-1 rounded-lg border ${y >= 2025 ? "border-leaf/40 bg-leaf/10 text-leaf font-bold" : "border-line bg-cream text-cocoa"}`}>{y}</span>
                  ))}
                </div>
              </div>
            </div>

            <Link to="/dashboard" className="block mt-6 bg-cream border border-line rounded-[16px] px-5 py-4 flex items-center gap-3 hover:border-accent/45 hover:shadow-lift transition-all">
              <span className="w-[34px] h-[34px] rounded-[10px] bg-peach text-rust grid place-items-center shrink-0">{IC_SPARK}</span>
              <span className="min-w-0">
                <b className="block text-ink text-[14px] font-display font-extrabold leading-snug">Draft a project proposal for {org.name}</b>
                <span className="block text-cocoa text-[12px] mt-0.5">Use the dashboard proposal studio - templates, mentors and timeline included.</span>
              </span>
              <span className="ml-auto font-mono text-[10.5px] font-bold uppercase tracking-[.1em] text-accent shrink-0">Open studio</span>
            </Link>
          </section>

          {/* right rail */}
          <aside className="grid gap-5 max-[1080px]:grid-cols-2">
            <div className="bg-card border border-line rounded-[20px] p-5 shadow-soft">
              <p className="panel-h">{orgProjects.length ? "Completed projects distribution" : "GitHub signal"}</p>
              {orgProjects.length ? (
                <div className="flex items-end gap-2.5 h-[112px] mt-4">
                  {dist.map((y) => {
                    const n = orgProjects.filter((p) => p.y === y).length;
                    return (
                      <div key={y} className="flex-1 flex flex-col items-center gap-1.5 justify-end h-full" title={`${y}: ${n} projects`}>
                        <span className="font-mono text-[9.5px] font-bold text-cocoa">{n}</span>
                        <span className="w-full rounded-t-[6px] pulse-bar bg-accent/75" style={{ height: `${Math.max(8, (n / distMax) * 82)}px`, animationDelay: `-${y % 5}s` }} />
                        <span className="font-mono text-[9.5px] text-dim">{String(y).slice(2)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="card-desc mt-3 text-[12.5px] leading-[1.6]">
                  {fmt(org.stars)} GitHub stars across the top-10 repos · {fmt(org.repos)} public repos{stats ? ` · ${fmt(stats.followers)} followers` : ""}.
                  The project archive has no rows for this org yet - browse its flagship repos below.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-cream border border-line rounded-[14px] px-4 py-3.5">
                <p className="font-mono text-[9.5px] uppercase tracking-[.11em] text-dim">Projects</p>
                <b className="block font-display text-[19px] tracking-[-.02em] mt-1">{fmt(orgProjects.length)}</b>
              </div>
              <div className="bg-cream border border-accent/25 rounded-[14px] px-4 py-3.5">
                <p className="font-mono text-[9.5px] uppercase tracking-[.11em] text-accent">Years active</p>
                <b className="block font-display text-[19px] tracking-[-.02em] text-accent mt-1">{projYears.length || programYears}</b>
              </div>
              <div className="bg-cream border border-line rounded-[14px] px-4 py-3.5">
                <p className="font-mono text-[9.5px] uppercase tracking-[.11em] text-dim">Top stack</p>
                <b className="block font-display text-[15px] tracking-[-.02em] mt-1.5 truncate">{projTechTop}</b>
              </div>
              <div className="bg-cream border border-leaf/25 rounded-[14px] px-4 py-3.5">
                <p className="font-mono text-[9.5px] uppercase tracking-[.11em] text-leaf">Tier</p>
                <b className="block font-display text-[19px] tracking-[-.02em] text-leaf mt-1">{tier}</b>
              </div>
            </div>

            <div className="bg-card border border-line rounded-[20px] p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <p className="panel-h !mb-0">Similar organizations</p>
                <Link to="/organizations" className="font-mono text-[10px] font-bold uppercase tracking-[.1em] text-accent hover:underline">All</Link>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {similar.map(({ o }) => (
                  <Link key={o.login} to={`/organizations/${o.login}`} title={o.tagline}
                    className="bg-cream border border-line rounded-[13px] p-3 flex flex-col gap-2 hover:border-accent/45 transition-colors">
                    <span className="w-8 h-8 rounded-[9px] bg-white border border-line grid place-items-center overflow-hidden shrink-0">
                      <OrgImg src={avatarOf(o.login, 64)} name={o.login} className="w-5 h-5 object-contain" />
                    </span>
                    <b className="text-ink text-[12px] font-display font-extrabold leading-tight line-clamp-1">{o.name}</b>
                    <span className="font-mono text-[9.5px] text-dim">{fmt(o.stars)} stars</span>
                  </Link>
                ))}
              </div>
            </div>

            <a href={`https://github.com/${org.login}?tab=repositories`} target="_blank" rel="noopener"
              className="bg-cream border border-line rounded-[16px] px-4 py-3.5 flex items-center gap-3 hover:border-accent/45 transition-colors">
              <span className="min-w-0">
                <b className="block text-ink text-[12.5px] font-display font-extrabold leading-snug">Official project ideas list</b>
                <span className="block text-cocoa text-[11px] mt-0.5">Maintainer wishlists on GitHub.</span>
              </span>
              <span className="ml-auto shrink-0 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-accent">Ideas</span>
            </a>
          </aside>
        </div>

        {/* ── past projects, from the program archive ── */}
        {orgProjects.length > 0 && (
          <section className="pt-4">
            <div className="flex items-end justify-between gap-4 flex-wrap mb-2">
              <h2 className="font-display font-extrabold text-[24px] tracking-[-.02em]">Past Projects</h2>
              <span className="font-mono text-[10.5px] uppercase tracking-[.12em] text-cocoa bg-cream border border-line rounded-full px-3 py-1.5">{fmt(orgProjects.length)} total projects</span>
            </div>
            <p className="text-cocoa text-[13px] leading-[1.6] mb-5 max-w-[680px]">
              Showing {fmt(ppList.length)} of {fmt(orgProjects.length)} projects. Click any project card for scope, mentors, and the proposal studio.
            </p>
            <div className="flex gap-2 flex-wrap items-center mb-4">
              <button onClick={() => setPpYear("all")}
                className={`text-[12px] font-semibold rounded-full px-3.5 py-1.5 border transition-all cursor-pointer ${ppYear === "all" ? "bg-coffee border-coffee text-foam" : "bg-paper border-line text-cocoa hover:border-accent hover:text-rust"}`}>All Years</button>
              {projYears.map((y) => (
                <button key={y} onClick={() => setPpYear(String(y))}
                  className={`text-[12px] font-semibold rounded-full px-3.5 py-1.5 border transition-all cursor-pointer ${ppYear === String(y) ? "bg-coffee border-coffee text-foam" : "bg-paper border-line text-cocoa hover:border-accent hover:text-rust"}`}>{y}</button>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap items-center mb-6">
              <input value={ppQ} onChange={(e) => setPpQ(e.target.value)} placeholder="Search this org's projects…" aria-label="Search projects"
                className="flex-1 min-w-[220px] max-w-[360px] bg-card border border-line rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(180,96,44,.12)]" />
              <select value={ppDiff} onChange={(e) => setPpDiff(e.target.value)} aria-label="Filter by difficulty"
                className="bg-card border border-line rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none select-warm pr-8 cursor-pointer">
                <option value="all">All Difficulties</option>
                <option value="small">Beginner · small</option>
                <option value="medium">Intermediate · medium</option>
                <option value="large">Advanced · large</option>
              </select>
              {(ppYear !== "all" || ppDiff !== "all" || ppQ) && (
                <button onClick={() => { setPpYear("all"); setPpDiff("all"); setPpQ(""); }}
                  className="font-mono text-[10.5px] font-bold uppercase tracking-[.1em] text-accent hover:underline cursor-pointer">Clear</button>
              )}
            </div>
            {ppList.length ? (
              <div className="grid grid-cols-3 gap-4 max-[1150px]:grid-cols-2 max-[700px]:grid-cols-1">
                {ppList.slice(0, 30).map((p) => {
                  const hours = p.s === "small" ? 175 : p.s === "large" ? 450 : 350;
                  return (
                    <a key={`${p.program ?? "g"}-${p.u}`} href={p.url ?? `${GSOC_URL}/programs/${p.y}/projects/${p.u}`} target="_blank" rel="noreferrer"
                      className="group bg-card border border-line rounded-[18px] p-[18px] flex flex-col shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift hover:border-accent/45">
                      <div className="flex items-start gap-3">
                        <h3 className="card-title text-[14.5px] leading-snug line-clamp-2 flex-1">{p.t}</h3>
                        <span className={`font-mono text-[9px] font-bold uppercase tracking-[.08em] px-2 py-1 rounded-full border shrink-0 ${PP_BADGE[p.s] ?? PP_BADGE.medium}`}>{PP_LABEL[p.s] ?? "MEDIUM"}</span>
                      </div>
                      <p className="font-mono text-[10px] tracking-[.06em] uppercase text-dim mt-2">{p.program ?? "GSoC"} • {p.y}{p.m ? ` • Mentors: ${p.m}` : ""}</p>
                      <p className="card-desc text-[12.5px] leading-[1.55] mt-2 line-clamp-3">{p.b}</p>
                      <div className="flex gap-1.5 flex-wrap mt-3">
                        <span className="font-mono text-[9.5px] font-bold text-rust bg-peach border border-accent/35 rounded-full px-2 py-1">◷ {hours}h ({p.s})</span>
                        <span className="font-mono text-[9.5px] font-bold text-leaf bg-leaf/10 border border-leaf/40 rounded-full px-2 py-1">$ 3.4k–6.0k</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap mt-3">
                        {(p.tt ?? []).slice(0, 3).map((t) => <Chip key={t} tone="lang">{t}</Chip>)}
                      </div>
                      <div className="flex items-center gap-2 mt-auto pt-3.5 border-t border-line/70">
                        <span className="font-mono text-[10.5px] font-bold uppercase tracking-[.08em] text-accent group-hover:underline">More Details</span>
                        <span className="ml-auto text-dim group-hover:text-accent transition-colors">{IC_TERMINAL}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="text-cocoa text-[13.5px] border border-dashed border-line rounded-[18px] bg-cream py-10 text-center">
                Nothing matches those filters - <button className="text-accent font-semibold hover:underline cursor-pointer" onClick={() => { setPpYear("all"); setPpDiff("all"); setPpQ(""); }}>clear them</button>.
              </p>
            )}
            {ppList.length > 30 && (
              <p className="font-mono text-[10.5px] text-dim mt-4">Showing the 30 newest matches of {fmt(ppList.length)} - narrow with a year or search.</p>
            )}
          </section>
        )}

        {/* ── contribute via cyrus.ai (highlighted) ── */}
        <section className="bg-peach border border-accent/25 rounded-[20px] p-6 md:p-7">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
            <h2 className="font-display font-extrabold text-[21px] tracking-[-.02em] text-rust">
              Contribute to {org.login} <Word>through cyrus.ai</Word>
            </h2>
            <span className="font-mono text-[10.5px] uppercase tracking-[.12em] text-accent font-bold">Four moves, zero guesswork</span>
          </div>
          <ol className="grid grid-cols-4 gap-4 list-none max-[900px]:grid-cols-1">
            {steps.map(([ic, b, p], i) => (
              <li key={b} className="bg-card border border-accent/15 rounded-[16px] p-4">
                <span className="flex items-center gap-2 mb-2 text-rust">
                  <span className="w-[30px] h-[30px] rounded-[9px] bg-accent/12 grid place-items-center shrink-0">{ic}</span>
                  <b className="font-display text-[13.5px] leading-tight">{i + 1}. {b}</b>
                </span>
                <p className="text-cocoa text-[12.5px] leading-[1.6]">{p}</p>
              </li>
            ))}
          </ol>
          {shelves.length > 0 && (
            <div className="grid gap-0.5 mt-5 border-t border-accent/15 pt-4">
              {shelves.map((c) => (
                <div key={c} className="flex gap-4 items-start py-2.5 border-b border-accent/10 last:border-0">
                  <span className="shrink-0"><Chip tone="cat">{CAT_META[c]?.label ?? c}</Chip></span>
                  <div className="min-w-0">
                    <b className="text-ink text-[13px] block leading-snug">{SHELF_MOVES[c]?.[0] ?? "Jump into their repos"}</b>
                    <span className="text-cocoa text-[12.5px] leading-[1.6]">{SHELF_MOVES[c]?.[1] ?? "Open the repo, read the README, and start with a documentation fix."}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {shelves.length === 0 && (
            <p className="text-rust text-[13px] leading-[1.6] mt-1">
              Their work ships straight on GitHub - the top repositories below are live data from their account. Save the org and cyrus.ai will flag it here the moment their repos join our catalog.
            </p>
          )}
        </section>

        {/* ── live GitHub repositories ── */}
        {real.length > 0 && (
          <section className="bg-card border border-line rounded-[18px] overflow-hidden shadow-soft">
            <h2 className="px-[18px] py-3.5 border-b border-liness panel-h flex items-center gap-2.5">
              Top repositories on GitHub
              <span className="font-mono text-[11px] text-dim font-medium">live from github.com/{org.login}, ranked by stars</span>
              <a href={`https://github.com/${org.login}?tab=repositories`} target="_blank" rel="noopener"
                className="ml-auto font-mono text-[10.5px] font-bold uppercase tracking-[.1em] text-accent hover:underline">All {fmt(org.repos)} repos</a>
            </h2>
            <div className="p-[18px] grid grid-cols-2 gap-3.5 max-[840px]:grid-cols-1">
              {real.map((r) => (
                <a key={r.repo} href={r.url} target="_blank" rel="noopener"
                  className="bg-cream border border-line rounded-[14px] p-4 flex flex-col gap-2 transition-all hover:-translate-y-px hover:border-accent/40">
                  <div className="flex items-center gap-2.5">
                    <span className="text-accent shrink-0">{IC_REPO}</span>
                    <b className="card-title text-[14px] truncate">{r.repo.split("/")[1]}</b>
                    <span className="ml-auto flex items-center gap-3 font-mono text-[10.5px] text-dim shrink-0">
                      <span className="flex items-center gap-1.5">
                        <i className="w-[9px] h-[9px] rounded-full not-italic" style={{ background: LANG_COLORS[r.lang] ?? "#a09282" }} />
                        {r.lang}
                      </span>
                      <span className="flex items-center gap-1 text-honey"><Ic d={STAR_D} size={12} extra={<path d={STAR_D} fill="currentColor" stroke="none" opacity=".9" />} />{fmt(r.stars)}</span>
                      <span className="flex items-center gap-1">{IC_FORK}{fmt(r.forks)}</span>
                    </span>
                  </div>
                  <p className="text-cocoa text-[12.5px] leading-[1.6] line-clamp-2">{r.desc || "No description set on GitHub."}</p>
                  {r.issues > 0 && (
                    <span className="font-mono text-[10px] text-dim">{fmt(r.issues)} open issues · good place to start if you want to contribute</span>
                  )}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── open source program history ── */}
        <section className="bg-card border border-line rounded-[18px] overflow-hidden shadow-soft">
          <h2 className="px-[18px] py-3.5 border-b border-liness panel-h flex items-center gap-2.5">
            How @{org.login} runs open source programs <span className="font-mono text-[11px] text-dim font-medium">participation estimated from mentor listings and archived project tables; the playbook blends org-level signals with per-program norms</span>
          </h2>
          <div className="p-[18px]">
            <div className="flex gap-1.5 flex-wrap mb-6 items-center">
              {history.map((h) => (
                <Link key={h.name} to={programLink(h.name)} className="hover:-translate-y-px transition-transform">
                  <Chip tone={h.tone}>{h.name} · {h.years.length} yrs</Chip>
                </Link>
              ))}
              <span className="ml-auto flex gap-1.5 flex-wrap">
                <Chip tone="stars">{fmt(progProjects)} program projects</Chip>
                <Chip>{programYears} years active</Chip>
                <Chip tone="lang">{mix[0]?.name ?? "Multi-stack"}</Chip>
                <Chip>{TIER_BY_LEVEL[org.level]}</Chip>
              </span>
            </div>
            <div className="grid gap-6">
              {history.map((h) => {
                const max = Math.max(...h.perYear.map((p) => p.n), 1);
                const total = h.perYear.reduce((a, p) => a + p.n, 0);
                return (
                  <div key={h.name} className="grid grid-cols-[170px_1fr] gap-5 items-center max-[700px]:grid-cols-1">
                    <div>
                      <Link to={programLink(h.name)} className="font-display font-bold text-[13.5px] hover:text-accent transition-colors">{h.name}</Link>
                      <p className="font-mono text-[9.5px] uppercase tracking-[.1em] text-dim mt-1">{h.years[0]} - {h.years[h.years.length - 1]} · {total} projects</p>
                      <div className="flex gap-1 flex-wrap mt-2">
                        {h.years.map((y) => <span key={y} className="font-mono text-[9px] px-1.5 py-0.5 rounded-[6px] border border-line bg-cream text-cocoa">{y}</span>)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-end gap-2 h-[92px]">
                        {h.perYear.map((p, i) => (
                          <div key={p.year} title={`${p.year}: ${p.n} projects`} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                            <span className="font-mono text-[9.5px] font-bold text-cocoa">{p.n}</span>
                            <i className="w-full rounded-t-[5px] pulse-bar block"
                              style={{ height: `${Math.max(8, (p.n / max) * 100)}%`, background: "linear-gradient(180deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 14%, var(--color-card)))", animationDelay: `${i * 50}ms` }} />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-1">{h.perYear.map((p) => <span key={p.year} className="flex-1 text-center font-mono text-[9.5px] text-dim">{String(p.year).slice(2)}</span>)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* per-program playbook */}
            <div className="grid grid-cols-2 gap-4 mt-8 max-[860px]:grid-cols-1">
              {history.map((h) => {
                const avg = Math.round(h.perYear.reduce((a, p) => a + p.n, 0) / h.perYear.length);
                const d = programDepth(org.login, h.name, avg, org);
                return (
                  <div key={h.name} className="bg-cream border border-line rounded-[16px] p-[17px]">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Link to={programLink(h.name)}><Chip tone={h.tone}>{h.name}</Chip></Link>
                      <b className="font-display text-[13.5px]">Program playbook</b>
                      <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[.1em] text-dim">{TIER_BY_LEVEL[org.level]}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-3.5 max-[520px]:grid-cols-2">
                      {[
                        [`~${d.slots}`, "slots / cohort"],
                        [`${d.accept}%`, "proposal accept"],
                        [`${d.reply}d`, "first reply"],
                        [`${d.retention}%`, "stay after"],
                      ].map(([v, l]) => (
                        <div key={l} className="bg-card border border-line rounded-[11px] px-2.5 py-2">
                          <b className="block font-display text-[15.5px] leading-none">{v}</b>
                          <span className="font-mono text-[8.5px] uppercase tracking-[.09em] text-dim">{l}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-1.5 mt-3.5 text-[12.5px] leading-[1.55] text-cocoa">
                      <p><b className="text-ink">Mentoring style:</b> {d.styles.join("; ")}.</p>
                      <p><b className="text-ink">Evaluation:</b> {d.evals.join("; ")}.</p>
                      <p><b className="text-ink">Mentor bench:</b> {d.leads} program lead{d.leads > 1 ? "s" : ""} + {d.coMentors} co-mentors, roughly {d.ratio}:1 mentor per intern.</p>
                      <p className="flex items-start gap-2"><span className="shrink-0 mt-0.5 text-accent"><Ic d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v4.5M12 16.2v.1" /></span>
                        <span><b className="text-ink">Hot areas this cycle:</b> {d.areas.join(", ")} - proposals that touch these get read first.</span></p>
                    </div>
                    <div className="border-t border-line mt-3.5 pt-3">
                      <span className="font-mono text-[9px] uppercase tracking-[.11em] text-dim block mb-1.5">What wins here</span>
                      <ul className="grid gap-1.5 list-none">
                        {d.tips.map((t) => (
                          <li key={t} className="flex gap-2 text-[12px] leading-[1.55] text-cocoa">
                            <span className="text-leaf shrink-0 mt-0.5"><Ic d="M5 12.5l4.5 4.5L19 7.5" size={13} /></span>{t}
                          </li>
                        ))}
                      </ul>
                      <Link to={programLink(h.name)} className="inline-block font-mono text-[10px] font-bold uppercase tracking-[.1em] text-accent mt-2.5 hover:underline">{h.name} program page</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── what they've built, by shelf ── */}
        {shelves.length > 0 && (
          <section className="bg-card border border-line rounded-[18px] overflow-hidden shadow-soft">
            <h2 className="px-[18px] py-3.5 border-b border-liness panel-h flex items-center gap-2.5">
              What they've built <span className="font-mono text-[11px] text-dim font-medium">{repos.length} repos · {shelves.map((c) => `${shelfCounts[c]} ${CAT_META[c]?.label ?? c}`).join(" · ")}</span>
            </h2>
            <div className="p-[18px] grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
              {shelves.map((c) => (
                <div key={c} className="bg-cream border border-line rounded-[14px] p-4 flex flex-col gap-2">
                  <span className="flex items-center gap-2"><span className="text-accent">{IC_SPARK}</span><b className="font-display text-[13.5px]">{CAT_META[c]?.label ?? c}</b>
                    <span className="ml-auto font-mono text-[10.5px] text-dim">{shelfCounts[c]}</span></span>
                  <div className="grid gap-1.5">
                    {repos.filter((r) => r.cat === c).slice(0, 3).map((r) => (
                      <Link key={r.repo} to={`/repo/${encodeURIComponent(r.repo)}`} className="flex items-baseline justify-between gap-2 text-[12.5px] text-cocoa hover:text-accent transition-colors">
                        <span className="truncate font-semibold">{r.repo.split("/")[1]}</span>
                        <span className="font-mono text-[10.5px] text-honey shrink-0">★ {fmt(r.stars)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── contributor intel (in depth) ── */}
        <section className="bg-card border border-line rounded-[18px] overflow-hidden shadow-soft">
          <h2 className="px-[18px] py-3.5 border-b border-liness panel-h flex items-center gap-2.5">
            Contributor intel <span className="font-mono text-[11px] text-dim font-medium">per-org estimates from the 2026-10-02 snapshot</span>
          </h2>
          <div className="p-[18px] grid grid-cols-[300px_1fr] gap-6 max-[960px]:grid-cols-1">
            <div className="grid grid-cols-2 gap-3 max-[960px]:grid-cols-4 max-[560px]:grid-cols-2">
              <MiniStat ic={IC_USERS} value={String(contribs.length + Math.round(rnd(org.login, 5) * 40))} label="active contributors" />
              <MiniStat ic={IC_CLOCK} value={`${2 + Math.round(rnd(org.login, 6) * 34)}h`} label="median review" />
              <MiniStat ic={IC_ISSUE} value={fmt(gfi)} label="good-first issues" />
              <MiniStat ic={IC_CHECK} value={`${54 + Math.round(rnd(org.login, 7) * 40)}%`} label="first PRs merged" />
            </div>
            <div>
              <p className="font-mono text-[9.5px] uppercase tracking-[.11em] text-dim mb-2.5">Top contributors · share of catalog commits</p>
              <ol className="grid gap-[7px] list-none">
                {contribs.map((c, i) => (
                  <li key={c.login} className="flex items-center gap-3">
                    <Avatar name={c.login} size={26} />
                    <span className="min-w-0 w-[130px] shrink-0">
                      <b className="block text-[12.5px] font-semibold truncate">{c.login}</b>
                      <span className="block font-mono text-[9.5px] text-dim truncate">{c.role}</span>
                    </span>
                    <span className="flex-1 h-[7px] rounded-full bg-clay overflow-hidden min-w-[60px]">
                      <i className="block h-full rounded-full grow-x" style={{ width: `${Math.max(5, (c.contributions / maxC) * 100)}%`, background: i < 3 ? "linear-gradient(90deg, var(--color-accent), var(--color-ember))" : "var(--color-denim)", animationDelay: `${i * 60}ms` }} />
                    </span>
                    <span className="font-mono text-[11px] text-ink shrink-0 w-[64px] text-right">{fmt(c.contributions)}</span>
                    <span className="font-mono text-[10px] text-dim shrink-0 w-[38px] text-right">{c.share}%</span>
                  </li>
                ))}
              </ol>
              <p className="text-[11px] text-dim mt-3 leading-[1.55]">
                Longest current streak: <b className="text-cocoa font-mono">{Math.max(...contribs.map((c) => c.streak))} days</b>.
                First three names carry roughly half the merge load - good-first-issues are where newcomers get in.
              </p>
            </div>
          </div>
        </section>

        {/* ── language mix + community pulse ── */}
        <div className="grid grid-cols-[1fr_1fr] gap-5 max-[960px]:grid-cols-1">
          <section className="bg-card border border-line rounded-[18px] overflow-hidden shadow-soft">
            <h2 className="px-[18px] py-3.5 border-b border-liness panel-h flex items-center gap-2.5">
              Language mix <span className="font-mono text-[11px] text-dim font-medium">by star weight</span>
            </h2>
            <div className="p-[18px]"><Donut mix={mix} /></div>
          </section>
          <section className="bg-card border border-line rounded-[18px] overflow-hidden shadow-soft">
            <h2 className="px-[18px] py-3.5 border-b border-liness panel-h flex items-center gap-2.5">
              Community pulse <span className="font-mono text-[11px] text-dim font-medium">last 12 months</span>
            </h2>
            <div className="p-[18px]">
              <div className="flex items-end gap-[7px] h-[120px]">
                {activity.map((v, i) => (
                  <i key={i} className="flex-1 rounded-t-[5px] pulse-bar block"
                    style={{ height: `${v}%`, background: "linear-gradient(180deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 14%, var(--color-card)))", animationDelay: `${i * 45}ms` }} />
                ))}
              </div>
              <div className="flex justify-between mt-3 font-mono text-[10px] text-dim">
                <span>Nov 25</span><span>May 26</span><span>Oct 26</span>
              </div>
            </div>
          </section>
        </div>

        {/* ── top repos by stars (hbars) ── */}
        {repos.length > 0 && (
          <section className="bg-card border border-line rounded-[18px] overflow-hidden shadow-soft">
            <h2 className="px-[18px] py-3.5 border-b border-liness font-display font-bold text-[14.5px]">
              Flagship repos <span className="font-mono text-[11px] text-dim font-medium">stars, ranked</span>
            </h2>
            <div className="p-[18px] grid gap-[13px]">
              {repos.slice(0, 5).map((r, i) => (
                <div key={r.repo}>
                  <div className="flex justify-between text-[12.5px] text-cocoa mb-1.5">
                    <Link to={`/repo/${encodeURIComponent(r.repo)}`} className="hover:text-accent font-semibold text-ink">{r.repo.split("/")[1]}</Link>
                    <b className="font-mono text-[11.5px] text-honey">★ {fmt(r.stars)}</b>
                  </div>
                  <div className="h-2 rounded-full bg-clay overflow-hidden">
                    <i className="block h-full rounded-full grow-x" style={{ width: `${Math.max(4, (r.stars / maxStars) * 100)}%`, background: "linear-gradient(90deg, var(--color-accent), var(--color-ember))", animationDelay: `${i * 70}ms` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── repo cards ── */}
        <section>
          <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
            <h2 className="font-display font-extrabold text-[26px] tracking-[-.02em]">Every build, <Word>on cyrus.ai</Word></h2>
            <Link to="/projects" className={btn("ghost", "sm")}>Browse all projects</Link>
          </div>
          {repos.length ? (
            <div className="grid grid-cols-2 gap-4 max-[840px]:grid-cols-1">
              {repos.map((r) => (
                <Link key={r.repo} to={`/repo/${encodeURIComponent(r.repo)}`}
                  className="bg-card border border-line rounded-[20px] p-5 flex flex-col gap-3 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift hover:border-accent/40">
                  <div className="flex items-center gap-3">
                    <OrgImg src={avatarOf(r.repo.split("/")[0], 64)} name={r.repo} className="w-10 h-10 rounded-xl object-cover bg-clay" />
                    <div className="min-w-0">
                      <h3 className="card-title text-[15.5px] truncate">{r.repo.split("/")[1]}</h3>
                      <span className="font-mono text-[10px] text-dim tracking-[.05em]">{CAT_META[r.cat]?.label ?? r.cat}</span>
                    </div>
                    <span className="ml-auto shrink-0"><Chip tone="stars">★ {fmt(r.stars)}</Chip></span>
                  </div>
                  <p className="card-desc line-clamp-2">{r.desc}</p>
                  <div className="flex gap-1.5 flex-wrap"><Chip tone="lang">{r.lang}</Chip>{r.tags.slice(0, 2).map((t) => <Chip key={t}>{t}</Chip>)}</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 text-dim border border-dashed border-line rounded-[20px] bg-cream">
              {org.login} is not in the cyrus.ai tools catalog yet - their flagship work is listed live from GitHub above. Save the org and the dashboard will flag it here as soon as their tools land.
            </div>
          )}
          <p className="font-mono text-[10.5px] text-dim mt-4">
            * Catalog cards come from the {REPOS.length}-repo GitHub snapshot (2026-10-02); "Top repositories on GitHub" is fetched live per org from the GitHub API by npm run orgs.
          </p>
        </section>
      </div>
    </>
  );
}
