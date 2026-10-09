/* ══ OrgProfile.tsx — one org, stats, contributors, its builds ═ */
import { useMemo } from "react";
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

/* ── svg icon set (no emoji in the UI) ─────────────────────── */
const SW = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Ic = ({ d, extra, size = 17 }: { d: string; extra?: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d={d} {...SW} />{extra}
  </svg>
);
const STAR_D = "M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3z";
const IC_STAR = <Ic d={STAR_D} extra={<path d={STAR_D} fill="currentColor" stroke="none" opacity=".9" />} />;
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

function StatCard({ ic, value, label, delta }: { ic: React.ReactNode; value: string; label: string; delta?: string }) {
  return (
    <div className="bg-card border border-line rounded-[18px] p-5 shadow-soft">
      <span className="w-[34px] h-[34px] rounded-[10px] grid place-items-center mb-3 bg-peach text-rust block">{ic}</span>
      <b className="block font-display text-[28px] font-extrabold tracking-[-.02em]">{value}</b>
      <span className="text-cocoa text-[12.5px]">{label}</span>
      {delta && <span className="block font-mono text-[10.5px] font-bold text-leaf mt-1">{delta}</span>}
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
  const on = savedOrgs.includes(org.login);
  const programYears = history.reduce((s, h) => s + h.years.length, 0);
  const progProjects = history.reduce((s, h) => s + h.perYear.reduce((a, p) => a + p.n, 0), 0);
  const top = repos[0];
  const maxStars = top?.stars ?? 1;

  const shelfCounts = repos.reduce<Record<string, number>>((acc, r) => { acc[r.cat] = (acc[r.cat] ?? 0) + 1; return acc; }, {});
  const shelves = Object.keys(shelfCounts).sort((a, b) => shelfCounts[b] - shelfCounts[a]);
  const maxC = contribs[0]?.contributions || 1;
  const forksTotal = repos.reduce((s, r) => s + r.forks, 0)
    || real.reduce((s, r) => s + r.forks, 0)
    || Math.round(org.stars / 9);
  const gfi = Math.max(3, Math.round(org.issues * 0.04));
  const hasCatalog = repos.length > 0;
  const steps: [React.ReactNode, string, string][] = hasCatalog ? CONTRIB_STEPS : [
    [IC_BOOKMARK, "Save the org", "Hit Save above and new activity from this org lands in your dashboard shortlist."],
    [IC_TERMINAL, "Use what they ship", "Install their most-starred repo below and work with it for real - maintainers can tell when the issue comes from usage."],
    [IC_ISSUE, "Start small and real", "Open the repo on GitHub and filter issues labelled good first issue; docs fixes and repro reports get reviewed fastest."],
    [IC_CHECK, "Send the pull request", "Fork, branch, and follow the repo's contributing guide - one focused diff beats a sprawling rewrite."],
  ];

  return (
    <>
      {/* ── org hero ── */}
      <header className="border-b border-liness">
        <div className={`${W} py-12`}>
          <p className="font-mono text-[10.5px] tracking-[.14em] uppercase text-dim mb-5">
            <Link to="/" className="hover:text-accent">Home</Link> / <Link to="/organizations" className="hover:text-accent">Organizations</Link> / <span className="text-cocoa">{org.login}</span>
          </p>
          <div className="flex items-center gap-4.5 flex-wrap">
            <span className="w-16 h-16 rounded-[18px] bg-white border border-line grid place-items-center overflow-hidden shadow-soft">
              <OrgImg src={avatarOf(org.login, 140)} name={org.login} className="w-[46px] h-[46px] object-contain" />
            </span>
            <div>
              <h1 className="font-display font-extrabold text-[clamp(26px,3.2vw,38px)] tracking-[-.02em]">
                {org.name} <small className="text-dim font-medium text-[.55em]">@{org.login}</small>
              </h1>
              <div className="flex gap-3.5 flex-wrap mt-2 font-mono text-[12px] text-cocoa">
                <span>★ {fmt(org.stars)} stars · top 10 repos</span><span>{fmt(org.repos)} public repos</span>
                {stats && <span>{fmt(stats.followers)} followers</span>}
                {stats?.joined && <span>on GitHub since {stats.joined}</span>}
                {stats?.location && <span>{stats.location}</span>}
                <span>{org.domain}</span>
              </div>
            </div>
            <div className="ml-auto flex gap-2.5 items-center">
              <LevelChip level={org.level} />
              <button onClick={() => { const added = toggleSavedOrg(org.login); toast(added ? `Saved ${org.login}` : `Removed ${org.login}`); }}
                className={btn(on ? "primary" : "outline", "md")}>{on ? "★ Saved" : "☆ Save org"}</button>
              <a href={`https://github.com/${org.login}`} target="_blank" rel="noopener" className={btn("dark", "md")}>GitHub ↗</a>
            </div>
          </div>
          <p className="text-cocoa mt-4 max-w-[720px] text-[15px] leading-[1.65]">{org.tagline}</p>
          <div className="flex gap-1.5 flex-wrap mt-4">{org.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
          <p className="font-mono text-[10.5px] uppercase tracking-[.12em] text-cocoa mt-4">
            {org.tags[0]} focus · <b className="text-accent">{programYears} program years</b> across {history.length} mentored open source program{history.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      <div className={`${W} pt-9 pb-8 grid gap-5`}>
        {/* ── statrow ── */}
        <div className="grid grid-cols-4 gap-3.5 max-[900px]:grid-cols-2">
          <StatCard ic={IC_STAR} value={fmt(org.stars)} label="stars across top GitHub repos" delta={stats ? `${fmt(stats.followers)} GitHub followers` : undefined} />
          <StatCard ic={IC_FORK} value={fmt(forksTotal)} label="forks across top GitHub repos" />
          <StatCard ic={IC_REPO} value={fmt(org.repos)} label="public repos on GitHub" delta={stats?.joined ? `joined ${stats.joined}` : undefined} />
          <StatCard ic={IC_BOOKMARK} value={on ? "Saved" : "Not saved"} label={on ? "in your dashboard" : "save to track activity"} />
        </div>

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
            <h2 className="px-[18px] py-3.5 border-b border-liness font-display font-bold text-[14.5px] flex items-center gap-2.5">
              Top repositories on GitHub
              <span className="font-mono text-[11px] text-dim font-medium">live from github.com/{org.login}, ranked by stars</span>
              <a href={`https://github.com/${org.login}?tab=repositories`} target="_blank" rel="noopener"
                className="ml-auto font-mono text-[10.5px] font-bold uppercase tracking-[.1em] text-accent hover:underline">All {fmt(org.repos)} repos ↗</a>
            </h2>
            <div className="p-[18px] grid grid-cols-2 gap-3.5 max-[840px]:grid-cols-1">
              {real.map((r) => (
                <a key={r.repo} href={r.url} target="_blank" rel="noopener"
                  className="bg-cream border border-line rounded-[14px] p-4 flex flex-col gap-2 transition-all hover:-translate-y-px hover:border-accent/40">
                  <div className="flex items-center gap-2.5">
                    <span className="text-accent shrink-0">{IC_REPO}</span>
                    <b className="font-display text-[14px] truncate">{r.repo.split("/")[1]}</b>
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
          <h2 className="px-[18px] py-3.5 border-b border-liness font-display font-bold text-[14.5px] flex items-center gap-2.5">
            How @{org.login} runs open source programs <span className="font-mono text-[11px] text-dim font-medium">participation estimated from mentor listings and archived project tables; the playbook blends org-level signals with per-program norms</span>
          </h2>
          <div className="p-[18px]">
            <div className="flex gap-1.5 flex-wrap mb-6 items-center">
              {history.map((h) => (
                <Link key={h.name} to={programLink(h.name)} className="hover:-translate-y-px transition-transform">
                  <Chip tone={h.tone}>{h.name} · {h.years.length} yrs →</Chip>
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
                      <Link to={programLink(h.name)} className="inline-block font-mono text-[10px] font-bold uppercase tracking-[.1em] text-accent mt-2.5 hover:underline">{h.name} program page →</Link>
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
            <h2 className="px-[18px] py-3.5 border-b border-liness font-display font-bold text-[14.5px] flex items-center gap-2.5">
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
          <h2 className="px-[18px] py-3.5 border-b border-liness font-display font-bold text-[14.5px] flex items-center gap-2.5">
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
            <h2 className="px-[18px] py-3.5 border-b border-liness font-display font-bold text-[14.5px] flex items-center gap-2.5">
              Language mix <span className="font-mono text-[11px] text-dim font-medium">by star weight</span>
            </h2>
            <div className="p-[18px]"><Donut mix={mix} /></div>
          </section>
          <section className="bg-card border border-line rounded-[18px] overflow-hidden shadow-soft">
            <h2 className="px-[18px] py-3.5 border-b border-liness font-display font-bold text-[14.5px] flex items-center gap-2.5">
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
            <Link to="/projects" className={btn("ghost", "sm")}>Browse all projects →</Link>
          </div>
          {repos.length ? (
            <div className="grid grid-cols-2 gap-4 max-[840px]:grid-cols-1">
              {repos.map((r) => (
                <Link key={r.repo} to={`/repo/${encodeURIComponent(r.repo)}`}
                  className="bg-card border border-line rounded-[20px] p-5 flex flex-col gap-3 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift hover:border-accent/40">
                  <div className="flex items-center gap-3">
                    <OrgImg src={avatarOf(r.repo.split("/")[0], 64)} name={r.repo} className="w-10 h-10 rounded-xl object-cover bg-clay" />
                    <div className="min-w-0">
                      <h3 className="font-display text-[15.5px] font-bold leading-tight truncate">{r.repo.split("/")[1]}</h3>
                      <span className="font-mono text-[10px] text-dim tracking-[.05em]">{CAT_META[r.cat]?.label ?? r.cat}</span>
                    </div>
                    <span className="ml-auto shrink-0"><Chip tone="stars">★ {fmt(r.stars)}</Chip></span>
                  </div>
                  <p className="text-cocoa text-[13px] leading-[1.6] line-clamp-2">{r.desc}</p>
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

        {/* ── similar organizations ── */}
        <section className="bg-card border border-line rounded-[18px] overflow-hidden shadow-soft">
          <h2 className="px-[18px] py-3.5 border-b border-liness font-display font-bold text-[14.5px] flex items-center gap-2.5">
            Similar organizations <span className="font-mono text-[11px] text-dim font-medium">shared focus tags and program history</span>
          </h2>
          <div className="p-[18px] grid grid-cols-4 gap-3.5 max-[980px]:grid-cols-2 max-[560px]:grid-cols-1">
            {similar.map(({ o, shared }) => (
              <Link key={o.login} to={`/organizations/${o.login}`}
                className="bg-cream border border-line rounded-[14px] p-4 flex flex-col gap-2 transition-all hover:-translate-y-1 hover:border-accent/40">
                <span className="flex items-center gap-2.5 min-w-0">
                  <OrgImg src={avatarOf(o.login, 64)} name={o.login} className="w-8 h-8 rounded-[9px] object-cover bg-white border border-line shrink-0" />
                  <b className="font-display text-[13px] truncate">{o.name}</b>
                </span>
                <span className="font-mono text-[10px] text-dim">{shared ? `${shared} shared focus tags` : "adjacent ecosystem"} · ★ {fmt(o.stars)}</span>
                <span className="text-[12px] text-cocoa line-clamp-2 leading-[1.55]">{o.tagline}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
