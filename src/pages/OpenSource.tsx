/* ══ OpenSource.tsx — the program project archive: ~10k accepted GSoC
   projects (fetched at runtime from /data/gsoc-projects.json) + the
   flagship program repos, listed Contribo-style with a filter rail.
   Cards never open an internal page - they redirect to the real
   project page and show the organisation name.                    ═ */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ORGS, PROGRAMS } from "../data/orgs";
import { PROGRAM_REPOS, PROGRAM_META } from "../data/programRepos";
import type { ProgramName } from "../data/programRepos";
import { fmt, hash } from "../lib/util";
import { useStore } from "../lib/store";
import { btn, Chip, Word } from "../components/ui";

const W = "max-w-[1240px] mx-auto px-6";
const GSOC_URL = "https://summerofcode.withgoogle.com";

/* ── one row type for everything this page lists ──────────── */
interface Proj {
  key: string;
  title: string;
  org: string;
  orgUrl: string;
  program: string;            // "GSoC" | "LFX" | "GSSoC" | "Outreachy"
  year: number;
  size: "small" | "medium" | "large";
  tags: string[];
  body: string;
  mentor: string;
  url: string;                // external project / repo page
  stars: number;
  orgTo?: string;             // in-platform org page (cyrus.ai /organizations/…)
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const slugOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* our live GitHub directory, keyed by normalised name AND login */
const DIR_LOGIN = new Map<string, string>();
for (const o of ORGS) { DIR_LOGIN.set(norm(o.login), o.login); DIR_LOGIN.set(norm(o.name), o.login); }

/* where the Org button goes: a cyrus.ai directory profile when we have one
   (real GitHub data), otherwise the org's own official page via orgUrl. */
function orgTarget(p: Proj): Pick<Proj, "orgTo"> {
  const dir = DIR_LOGIN.get(norm(p.org));
  return dir ? { orgTo: `/organizations/${dir}` } : {};
}

interface RawGsoc { y: number; u: string; t: string; o: string; s: string; tt: string[]; tp: string[]; b: string; m: string }
interface RawFile { projects: RawGsoc[]; orgs: Record<string, { url?: string; category?: string }> }

/* stipend + hours bands per project size, deterministic per uid so a
   card always shows the same numbers. GSoC 2021-2025 ranges. */
const BAND: Record<Proj["size"], { stipend: [number, number]; hours: [number, number] }> = {
  small: { stipend: [3.0, 3.6], hours: [150, 175] },
  medium: { stipend: [4.0, 4.9], hours: [300, 350] },
  large: { stipend: [5.3, 6.6], hours: [400, 450] },
};
const DIFF: Record<Proj["size"], string> = { small: "Easy", medium: "Medium", large: "Hard" };
const DIFF_CLS: Record<Proj["size"], string> = {
  small: "text-leaf border-leaf/40 bg-leaf/10",
  medium: "text-honey border-honey/45 bg-honey/12",
  large: "text-brick border-brick/40 bg-brick/10",
};
const inBand = ([a, b]: [number, number], seed: number, dp = 0) => {
  const v = a + (seed % 1000) / 1000 * (b - a);
  return dp ? v.toFixed(dp) : String(Math.round(v));
};

/* the 87 flagship program repos, mapped into the same shape */
const flagships: Proj[] = PROGRAM_REPOS.map((r) => {
  const [owner] = r.repo.split("/");
  return {
    key: r.repo, title: r.repo.split("/")[1].replace(/[-_]/g, " "), org: owner,
    orgUrl: `https://github.com/${owner}`, program: r.programs[0], year: 2026,
    size: (["small", "medium", "large"] as const)[r.stars > 4000 ? 2 : r.stars > 500 ? 1 : 0],
    tags: [r.lang, ...r.tags.slice(0, 3)], body: r.desc, mentor: "",
    url: `https://github.com/${r.repo}`, stars: r.stars,
  };
});

/* ── card - external redirect only, no internal detail page ── */
function ProjCard({ p }: { p: Proj }) {
  const { saved, toggleSaved, toast } = useStore();
  const on = saved.includes(p.url);
  const seed = hash(p.key);
  const bd = BAND[p.size];
  const stipend = inBand(bd.stipend, seed % 997, 1);
  const hours = inBand(bd.hours, (seed >> 3) % 991);
  return (
    <article className="group bg-card border border-line rounded-[18px] p-[18px] flex flex-col shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift hover:border-accent/45">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="card-title text-[16px] line-clamp-2">{p.title}</h3>
          <p className="font-mono text-[10px] tracking-[.09em] uppercase text-dim mt-1.5 truncate">{p.org} • {p.year}</p>
        </div>
        <span className={`font-mono text-[9px] font-bold uppercase tracking-[.09em] px-2 py-1 rounded-md border shrink-0 ${DIFF_CLS[p.size]}`}>{DIFF[p.size] === "Easy" ? "BEGINNER" : DIFF[p.size] === "Medium" ? "INTERMEDIATE" : "ADVANCED"}</span>
      </div>
      <div className="flex gap-1.5 flex-wrap mt-3">
        {p.program === "GSoC" ? <>
          <Chip tone="green">$ {stipend}k–${(+stipend + 2.6).toFixed(1)}k</Chip>
          <span className="font-mono text-[9.5px] font-bold text-rust bg-peach border border-accent/35 rounded-full px-2 py-1">◷ {hours}h ({DIFF[p.size]})</span>
        </> : <Chip tone="cat">{p.program} flagship</Chip>}
        {p.stars > 0 && <Chip tone="stars">★ {fmt(p.stars)}</Chip>}
      </div>
      <p className="text-cocoa text-[12.5px] leading-[1.55] mt-2.5 line-clamp-3">{p.body}</p>
      <div className="flex gap-1.5 flex-wrap mt-3 items-center">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-dim shrink-0"><path d="M8 6l-5 6 5 6M16 6l5 6-5 6" /></svg>
        {p.tags.slice(0, 3).map((t) => <Chip key={t} tone="lang">{t}</Chip>)}
        {p.tags.length > 3 && <span className="text-[11.5px] text-dim">+{p.tags.length - 3}</span>}
      </div>
      {p.mentor && (
        <p className="text-[11.5px] text-dim mt-2.5 truncate flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.5-4 12.5-4 14 0" /></svg>
          <span className="font-mono text-[10px] uppercase tracking-[.06em]">Mentors:</span> {p.mentor}
        </p>
      )}
      <div className="flex items-center gap-2 mt-auto pt-3.5 border-t border-liness mt-4">
        <a href={p.url} target="_blank" rel="noreferrer" className="text-[12.5px] font-bold text-accent hover:text-rust transition-colors">More Details →</a>
        {p.orgTo ? (
          <Link to={p.orgTo} title={`View ${p.org} on cyrus.ai`}
            className="font-mono text-[10px] font-bold tracking-[.08em] uppercase text-cocoa border border-line rounded-[9px] px-2.5 py-1.5 hover:border-accent hover:text-rust transition-colors">Org</Link>
        ) : p.orgUrl && (
          <a href={p.orgUrl} target="_blank" rel="noreferrer" title={`${p.org} on the web`}
            className="font-mono text-[10px] font-bold tracking-[.08em] uppercase text-cocoa border border-line rounded-[9px] px-2.5 py-1.5 hover:border-accent hover:text-rust transition-colors">Org ↗</a>
        )}
        <button aria-label={on ? "Stop tracking" : "Track project"} title={on ? "Stop tracking" : "Track on dashboard"} onClick={() => {
          const added = toggleSaved(p.url);
          toast(added ? "Added to your dashboard" : "Removed from dashboard");
        }} className={`ml-auto w-[30px] h-[30px] rounded-[9px] border grid place-items-center text-[13px] transition-all cursor-pointer ${on ? "bg-accent border-accent text-white" : "bg-cream border-line text-dim hover:border-accent hover:text-accent"}`}>
          {on ? "★" : "☆"}
        </button>
      </div>
    </article>
  );
}

/* ── page ─────────────────────────────────────────────────── */
export default function OpenSource() {
  const [raw, setRaw] = useState<RawFile | null>(null);
  const [loadErr, setLoadErr] = useState(false);

  const [q, setQ] = useState("");
  const [prog, setProg] = useState("all");
  const [diff, setDiff] = useState("all");
  const [year, setYear] = useState("all");
  const [tech, setTech] = useState("all");
  const [sort, setSort] = useState<"recent" | "org" | "title">("recent");
  const [shown, setShown] = useState(60);

  useEffect(() => {
    let go = true;
    fetch("/data/gsoc-projects.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("missing"))))
      .then((d: RawFile) => { if (go && Array.isArray(d?.projects)) setRaw(d); else if (go) setLoadErr(true); })
      .catch(() => { if (go) setLoadErr(true); });
    return () => { go = false; };
  }, []);

  const all = useMemo<Proj[]>(() => {
    const orgs = raw?.orgs ?? {};
    const gsoc: Proj[] = (raw?.projects ?? []).map((p) => ({
      key: `g${p.u}`, title: p.t, org: p.o,
      orgUrl: orgs[p.o]?.url || `${GSOC_URL}/programs/${p.y}/organizations/${slugOf(p.o)}`,
      program: "GSoC", year: p.y, size: (["small", "medium", "large"].includes(p.s) ? p.s : "medium") as Proj["size"],
      tags: [...p.tt, ...p.tp].slice(0, 4), body: p.b, mentor: p.m,
      url: `${GSOC_URL}/programs/${p.y}/projects/${p.u}`, stars: 0,
    }));
    return [...gsoc, ...flagships];
  }, [raw]);

  /* filter option lists derived from what actually loaded */
  const years = useMemo(() => [...new Set(all.map((p) => p.year))].sort((a, b) => b - a), [all]);
  const progs = useMemo(() => [...new Set(["GSoC", ...flagships.map((f) => f.program)])], []);

  const stacks = useMemo(() => {
    const c = new Map<string, number>();
    for (const p of all) for (const t of p.tags) c.set(t, (c.get(t) || 0) + (p.program === "GSoC" ? 1 : 2));
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);
  }, [all]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const r = all.filter((p) =>
      (prog === "all" || p.program === prog) &&
      (diff === "all" || p.size === diff) &&
      (year === "all" || String(p.year) === year) &&
      (tech === "all" || p.tags.some((t) => t.toLowerCase() === tech.toLowerCase())) &&
      (!needle || (p.title + " " + p.org + " " + p.body + " " + p.tags.join(" ")).toLowerCase().includes(needle))
    );
    r.sort((a, b) => sort === "recent" ? b.year - a.year || a.org.localeCompare(b.org)
      : sort === "org" ? a.org.localeCompare(b.org) || b.year - a.year
      : a.title.localeCompare(b.title));
    return r.map((p) => Object.assign({}, p, orgTarget(p)));
  }, [all, q, prog, diff, year, tech, sort]);

  const visible = list.slice(0, shown);

  const fin = "w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-[14px] outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(180,96,44,.12)]";
  const lbl = "block font-mono text-[10.5px] tracking-[.12em] uppercase text-dim mb-2.5";
  const clearAll = () => { setQ(""); setProg("all"); setDiff("all"); setYear("all"); setTech("all"); setShown(60); };
  const anyFilter = q || prog !== "all" || diff !== "all" || year !== "all" || tech !== "all";

  return (
    <div className={`${W} pt-14 pb-4`}>
      {/* header - reference "Explore Projects" style */}
      <p className="font-mono text-[10.5px] tracking-[.14em] uppercase text-dim">
        <Link to="/" className="hover:text-accent">Platform</Link> <span className="text-accent">›</span> <span className="text-cocoa">Projects</span>
      </p>
      <h1 className="font-display font-extrabold tracking-[-.02em] leading-[1.08] mt-3.5 mb-3 text-[clamp(33px,4.2vw,52px)]">
        Explore <Word>Projects</Word>
      </h1>
      <p className="text-ink font-medium max-w-[720px] text-[16.5px] leading-[1.6]">
        Find open source projects actively accepting contributors. Search repositories, filter by program, difficulty tags, or tech stack.
      </p>

      {/* AI-matcher banner */}
      <div className="mt-8 bg-gradient-to-br from-clay to-peach/60 border border-line rounded-[22px] px-8 py-7 flex items-center gap-6 flex-wrap max-[700px]:px-5">
        <div className="min-w-[280px] flex-1">
          <h2 className="card-title-xl">Confused which project to choose or don't know which one you are most suitable to work on?</h2>
          <p className="text-cocoa text-[13.5px] leading-[1.6] mt-2 max-w-[560px]">
            Use our Nova AI Matcher to find out! Get instant matching scores based on your developer skills, preferred frameworks, and contribution experience.
          </p>
        </div>
        <Link to="/nova" className={btn("primary", "lg") + " shrink-0"}>Match with Nova AI →</Link>
      </div>

      {/* rail + results */}
      <div className="grid grid-cols-[280px_1fr] gap-7 items-start mt-8 max-[980px]:grid-cols-1">
        <aside className="sticky top-[86px] max-[980px]:static bg-card border border-line rounded-[22px] p-[22px] shadow-soft grid gap-5">
          <div className="flex items-center gap-2.5">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-ink"><path d="M4 6h16M4 12h10M4 18h5" /><circle cx="19" cy="18" r="2.5" /></svg>
            <span className="font-display font-bold text-[15px] tracking-[-.01em]">Filters</span>
          </div>
          <div>
            <span className={lbl}>Search</span>
            <input className={fin} placeholder="Title, tech, org..." value={q} onChange={(e) => { setQ(e.target.value); setShown(60); }} aria-label="Search projects" />
          </div>
          <div>
            <span className={lbl}>Difficulty</span>
            <select className={`${fin} select-warm pr-8`} value={diff} onChange={(e) => { setDiff(e.target.value); setShown(60); }} aria-label="Filter by difficulty">
              <option value="all">All Difficulties</option>
              <option value="small">Easy · small (~175h)</option>
              <option value="medium">Medium · ~350h</option>
              <option value="large">Hard · large (~450h)</option>
            </select>
          </div>
          <div>
            <span className={lbl}>Program</span>
            <select className={`${fin} select-warm pr-8`} value={prog} onChange={(e) => { setProg(e.target.value); setShown(60); }} aria-label="Filter by program">
              <option value="all">All Programs</option>
              {progs.map((p) => <option key={p} value={p}>{p === "GSoC" ? "Google Summer of Code" : PROGRAM_META[p as ProgramName]?.label ?? p}</option>)}
            </select>
          </div>
          <div>
            <span className={lbl}>Popular stacks</span>
            <div className="flex flex-wrap gap-[7px]">
              {stacks.map((l) => (
                <button key={l} onClick={() => { setTech(tech === l ? "all" : l); setShown(60); }}
                  className={`text-[12px] font-semibold rounded-full px-3 py-1.5 border transition-all cursor-pointer ${tech === l ? "bg-coffee border-coffee text-foam" : "bg-paper border-line text-cocoa hover:border-accent hover:text-rust"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <button className={btn("primary", "md", "w-full")} onClick={() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Apply filters</button>
          {anyFilter && <button className="text-[12.5px] font-semibold text-cocoa hover:text-rust cursor-pointer -mt-2" onClick={clearAll}>Reset filters</button>}
        </aside>

        <section id="results" className="scroll-mt-24">
          <div className="flex gap-2 flex-wrap pb-4">
            {[["all", "All Years"], ...years.map((y) => [String(y), String(y)] as [string, string])].map(([v, l]) => (
              <button key={v} onClick={() => { setYear(v); setShown(60); }}
                className={`font-mono text-[11.5px] font-bold tracking-[.05em] rounded-full px-4 py-2 border transition-all cursor-pointer ${year === v ? "bg-coffee border-coffee text-foam" : "bg-card border-line text-cocoa hover:border-accent hover:text-rust"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3.5 pt-1 pb-[18px] bg-card border border-line rounded-[16px] px-5 flex-wrap shadow-soft">
            <span className="font-mono text-[12.5px] tracking-[.1em] uppercase text-cocoa">
              <b className="text-ink">{fmt(list.length)}</b>&nbsp; projects found
              {loadErr && <span className="normal-case tracking-normal text-brick ml-3">Archive file missing - run npm run refresh</span>}
            </span>
            <span className="ml-auto font-mono text-[10.5px] tracking-[.12em] uppercase text-dim">Sort by</span>
            <select className={`${fin} select-warm !w-auto rounded-full pr-8 py-2 text-[13px] font-semibold`} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort projects">
              <option value="recent">Newest Added</option>
              <option value="org">Organization A-Z</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>

          {list.length ? (
            <>
              <div className="grid grid-cols-3 gap-4 max-[1150px]:grid-cols-2 max-[700px]:grid-cols-1">
                {visible.map((p) => <ProjCard key={p.key} p={p} />)}
              </div>
              {shown < list.length && (
                <div className="flex justify-center mt-8">
                  <button onClick={() => setShown(shown + 60)} className={btn("outline", "lg") + " cursor-pointer"}>
                    Show {Math.min(60, list.length - shown)} of {fmt(list.length - shown)} more ↓
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-dim border border-dashed border-line rounded-[22px] bg-cream">
              {!raw && !loadErr ? (
                <p className="font-display text-[20px] text-cocoa">Loading the GSoC archive…</p>
              ) : (
                <>
                  <p className="font-display text-[20px] text-cocoa mb-2">Nothing matches that combination.</p>
                  <p>Loosen a filter - or the archive is a hint to <button className="text-accent font-semibold hover:underline cursor-pointer" onClick={clearAll}>reset them</button>.</p>
                </>
              )}
            </div>
          )}

          {anyFilter && list.length > 0 && (
            <p className="font-mono text-[10.5px] text-dim mt-5">
              Showing {visible.length} of {fmt(list.length)} · <button className="text-accent font-semibold hover:underline cursor-pointer" onClick={clearAll}>Clear filters</button>
            </p>
          )}

          <div className="flex justify-center gap-3 mt-12 flex-wrap">
            <Link to="/#timeline" className={btn("dark", "md")}>See the 12-month program timeline →</Link>
            <Link to="/organizations" className={btn("outline", "md")}>Browse the {PROGRAMS.length} program orgs →</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
