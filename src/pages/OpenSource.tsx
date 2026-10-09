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
import { avatarOf, fmt, hash } from "../lib/util";
import { useStore } from "../lib/store";
import { btn, Chip, OrgImg, Word } from "../components/ui";

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
        <span className="w-9 h-9 rounded-[10px] overflow-hidden bg-clay shrink-0 border border-line">
          <OrgImg src={avatarOf(p.org, 72)} name={p.org} className="w-full h-full object-cover" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="card-title text-[15.5px] line-clamp-2">{p.title}</h3>
          <p className="font-mono text-[10px] tracking-[.08em] uppercase text-dim mt-1 truncate">{p.org} • {p.year}</p>
        </div>
        <span className={`font-mono text-[9px] font-bold uppercase tracking-[.09em] px-2 py-1 rounded-full border shrink-0 ${DIFF_CLS[p.size]}`}>{DIFF[p.size]}</span>
      </div>
      <div className="flex gap-1.5 flex-wrap mt-3">
        {p.program === "GSoC" ? <>
          <Chip tone="green">${stipend}k stipend</Chip>
          <span className="font-mono text-[9.5px] font-bold text-rust bg-peach border border-accent/35 rounded-full px-2 py-1">{hours}h ({DIFF[p.size]})</span>
        </> : <Chip tone="cat">{p.program} flagship</Chip>}
        {p.stars > 0 && <Chip tone="stars">★ {fmt(p.stars)}</Chip>}
      </div>
      <p className="text-cocoa text-[12.5px] leading-[1.55] mt-2.5 line-clamp-2">{p.body}</p>
      <div className="flex gap-1.5 flex-wrap mt-3">
        {p.tags.slice(0, 4).map((t) => <Chip key={t} tone="lang">{t}</Chip>)}
      </div>
      {p.mentor && <p className="text-[11.5px] text-dim mt-2.5 truncate">Mentored by {p.mentor}</p>}
      <div className="flex items-center gap-2 mt-auto pt-3.5">
        <a href={p.url} target="_blank" rel="noreferrer"
          className={btn("primary", "sm", "flex-1 justify-center")}>View project ↗</a>
        {p.orgTo ? (
          <Link to={p.orgTo} title={`View ${p.org} on cyrus.ai`}
            className="font-mono text-[10px] font-bold tracking-[.08em] uppercase text-cocoa border border-line rounded-[9px] px-2.5 py-2 hover:border-accent hover:text-rust transition-colors">Org</Link>
        ) : p.orgUrl && (
          <a href={p.orgUrl} target="_blank" rel="noreferrer" title={`${p.org} on the web`}
            className="font-mono text-[10px] font-bold tracking-[.08em] uppercase text-cocoa border border-line rounded-[9px] px-2.5 py-2 hover:border-accent hover:text-rust transition-colors">Org ↗</a>
        )}
        <button aria-label={on ? "Stop tracking" : "Track project"} title={on ? "Stop tracking" : "Track on dashboard"} onClick={() => {
          const added = toggleSaved(p.url);
          toast(added ? "Added to your dashboard" : "Removed from dashboard");
        }} className={`w-[34px] h-[34px] rounded-[9px] border grid place-items-center text-[13px] transition-all cursor-pointer ${on ? "bg-accent border-accent text-white" : "bg-cream border-line text-dim hover:border-accent hover:text-accent"}`}>
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
  const gsocTotal = raw ? raw.projects.length : null;

  const fin = "w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-[14px] outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(180,96,44,.12)]";
  const lbl = "block font-mono text-[10.5px] tracking-[.12em] uppercase text-dim mb-2.5";
  const clearAll = () => { setQ(""); setProg("all"); setDiff("all"); setYear("all"); setTech("all"); setShown(60); };
  const anyFilter = q || prog !== "all" || diff !== "all" || year !== "all" || tech !== "all";

  return (
    <div className={`${W} pt-14 pb-4`}>
      {/* header */}
      <p className="font-mono text-[10.5px] tracking-[.14em] uppercase text-dim">
        <Link to="/" className="hover:text-accent">Home</Link> / <span className="text-cocoa">Open Source</span>
      </p>
      <h1 className="font-display font-extrabold tracking-[-.02em] leading-[1.08] mt-3.5 mb-3 text-[clamp(33px,4.2vw,52px)] max-w-[860px]">
        Every project the programs <Word>ship</Word> - searchable, sortable, one click to apply.
      </h1>
      <p className="text-ink font-medium max-w-[640px] text-[16.5px] leading-[1.6]">
        {PROGRAMS.length} programs tracked - {gsocTotal === null ? "loading the GSoC archive" : `${fmt(gsocTotal)} accepted GSoC projects (2021-2025)`} plus {flagships.length} flagship repos.
        Every card links straight to the real project page.
      </p>

      {/* rail + results - the same filter style as the Projects page */}
      <div className="grid grid-cols-[280px_1fr] gap-7 items-start mt-9 max-[980px]:grid-cols-1">
        <aside className="sticky top-[86px] max-[980px]:static bg-card border border-line rounded-[22px] p-[22px] shadow-soft grid gap-5">
          <div>
            <span className={lbl}>Search</span>
            <input className={fin} placeholder="title, org, tech, description…" value={q} onChange={(e) => { setQ(e.target.value); setShown(60); }} aria-label="Search projects" />
          </div>
          <div>
            <span className={lbl}>Program</span>
            <select className={`${fin} select-warm pr-8`} value={prog} onChange={(e) => { setProg(e.target.value); setShown(60); }} aria-label="Filter by program">
              <option value="all">All programs · {fmt(all.length)}</option>
              {progs.map((p) => <option key={p} value={p}>{p === "GSoC" ? "Google Summer of Code" : PROGRAM_META[p as ProgramName]?.label ?? p} · {fmt(all.filter((x) => x.program === p).length)}</option>)}
            </select>
          </div>
          <div>
            <span className={lbl}>Difficulty</span>
            <select className={`${fin} select-warm pr-8`} value={diff} onChange={(e) => { setDiff(e.target.value); setShown(60); }} aria-label="Filter by difficulty">
              <option value="all">Any difficulty</option>
              <option value="small">Easy · small (~175h)</option>
              <option value="medium">Medium · ~350h</option>
              <option value="large">Hard · large (~450h)</option>
            </select>
          </div>
          <div>
            <span className={lbl}>Year</span>
            <select className={`${fin} select-warm pr-8`} value={year} onChange={(e) => { setYear(e.target.value); setShown(60); }} aria-label="Filter by year">
              <option value="all">Any year</option>
              {years.map((y) => <option key={y} value={String(y)}>{y === 2026 ? "2026 · current flagships" : y}</option>)}
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
          <button className={btn("primary", "md", "w-full")} onClick={clearAll}>Reset filters</button>
        </aside>

        <section>
          <div className="flex items-center gap-3.5 pt-1 pb-[18px] px-0.5 flex-wrap">
            <span className="font-mono text-[12px] tracking-[.1em] uppercase text-cocoa">
              <b className="text-accent">{fmt(list.length)}</b> projects found
              {loadErr && <span className="normal-case tracking-normal text-brick ml-3">Archive file missing - run npm run refresh</span>}
            </span>
            <span className="ml-auto text-[12px] text-dim">Sort by</span>
            <select className={`${fin} select-warm !w-auto rounded-full pr-8 py-2 text-[13px] font-semibold`} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort projects">
              <option value="recent">Newest first</option>
              <option value="org">Organization A-Z</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>

          {list.length ? (
            <>
              <div className="grid grid-cols-2 gap-4 max-[1150px]:grid-cols-2 max-[640px]:grid-cols-1">
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
