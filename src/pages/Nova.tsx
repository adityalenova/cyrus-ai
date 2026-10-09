/* ══ Nova.tsx — nova.ai: tell it your stack, it ranks your next
   hackathon, project and program match off the live catalog.     ═ */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PROGRAMS } from "../data/orgs";
import { PROGRAM_META } from "../data/programRepos";
import { PROGRAM_ID_BY_NAME } from "../data/programDetails";
import { CATALOG } from "../lib/util";
import { useStored } from "../lib/util";
import type { Repo } from "../lib/types";
import { ALL_HACKS } from "./Hackathons";
import type { Hack } from "../data/hackathons";
import { btn, Chip, Eyebrow, Word } from "../components/ui";

const W = "max-w-[1240px] mx-auto px-6";

const QUICK = ["TypeScript", "Python", "React", "AI agents", "LLMs", "Machine learning", "Go", "Rust", "DevOps", "Kubernetes", "MCP", "Open source", "Web3", "Data", "Mobile", "Security", "Docs", "Design systems", "NLP", "Computer vision"];

type Profile = { skills: string[]; level: "new" | "some" | "vet"; goal: "hack" | "build" | "program" };
const DEFAULT: Profile = { skills: [], level: "some", goal: "hack" };

/* tokenise a skill phrase for fuzzy matching ("AI agents" -> ai, agent) */
const toks = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2).map((t) => (t.endsWith("s") ? t.slice(0, -1) : t));

function scoreNeedle(hay: string, needle: string[]) {
  const h = hay.toLowerCase();
  let s = 0;
  for (const n of needle) {
    if (h.includes(n)) s += n.length > 4 ? 2 : 1.4;
  }
  return s;
}

export default function Nova() {
  const [prof, setProf] = useStored<Profile>("agenthub.nova", DEFAULT);
  const [free, setFree] = useState("");
  const [ran, setRan] = useState(false);
  const resRef = useRef<HTMLDivElement>(null);

  /* accept a typed list too: "python, kubernetes, mcp" */
  const skills = useMemo(() => {
    const extra = free.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
    return [...new Set([...prof.skills, ...extra])];
  }, [prof.skills, free]);
  const needles = useMemo(() => [...new Set(skills.flatMap(toks))], [skills]);

  const run = () => {
    setRan(true);
    setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  const hacks = useMemo(() => {
    if (!ran || !needles.length) return [];
    const scored = ALL_HACKS.map((h) => ({
      h, s: scoreNeedle(h.tags.join(" ") + " " + h.theme + " " + h.stack.languages.join(" ") + " " + h.stack.frameworks.join(" ") + " " + h.name, needles)
        + (h.status === "open" || h.status === "rolling" ? 1.5 : h.status === "upcoming" ? 0.8 : 0)
        + (prof.level === "new" && /beginner|anyone|first/i.test(h.eligibility) ? 1 : 0),
    }));
    return scored.filter((x) => x.s > 1.2).sort((a, b) => b.s - a.s).slice(0, 6);
  }, [ran, needles, prof.level]);

  const repos = useMemo(() => {
    if (!ran || !needles.length) return [] as { r: Repo; s: number }[];
    const scored = CATALOG.map((r) => ({
      r, s: scoreNeedle(r.tags.join(" ") + " " + r.desc + " " + r.lang + " " + r.repo, needles)
        + Math.min(1.5, Math.log10(Math.max(r.stars, 1)) - 2),
    }));
    return scored.filter((x) => x.s > 1.5).sort((a, b) => b.s - a.s).slice(0, 8);
  }, [ran, needles]);

  const progs = useMemo(() => {
    if (!ran) return [];
    const wantRemote = prof.level !== "vet";
    return PROGRAMS.filter((p) => wantRemote || p.id !== "gssoc").slice(0, 3);
  }, [ran, prof.level]);

  useEffect(() => { if (ran) setProf({ ...prof, skills }); /* persist merged skills */ }, [ran]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSkill = (t: string) => setProf({ ...prof, skills: prof.skills.includes(t) ? prof.skills.filter((x) => x !== t) : [...prof.skills, t] });

  return (
    <div className={`${W} pt-12 pb-6`}>
      {/* ── console ── */}
      <div className="bg-coffee border border-bean rounded-[26px] overflow-hidden shadow-lift relative">
        <div className="absolute inset-0 opacity-[.06] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 82% 12%, #fff 0, transparent 45%), radial-gradient(circle at 8% 90%, #f0a35c 0, transparent 40%)" }} />
        <div className="relative p-7 md:p-9">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="w-[38px] h-[38px] rounded-[11px] bg-accent grid place-items-center shadow-[0_8px_20px_-6px_rgba(240,146,60,.7)]">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.4 6.4l2.8 2.8M14.8 14.8l2.8 2.8M17.6 6.4l-2.8 2.8M9.2 14.8l-2.8 2.8" /></svg>
            </span>
            <h1 className="font-display font-extrabold text-[clamp(24px,3vw,34px)] tracking-[-.02em] text-white">nova<span className="text-ember">.ai</span></h1>
            <span className="font-mono text-[9.5px] font-bold uppercase tracking-[.14em] text-foam/70 border border-foam/25 rounded-full px-3 py-1">matching engine</span>
          </div>
          <p className="text-foam/80 mt-3.5 max-w-[560px] text-[15px] leading-[1.65]">
            Tell nova what you work with - languages, tools, the kind of thing you want to ship - and it ranks the right hackathons, projects and mentored programs for <em className="not-italic text-white font-semibold">you</em>, off the same catalog the rest of cyrus.ai uses.
          </p>

          <div className="mt-7 grid gap-5">
            <div>
              <span className="font-mono text-[9.5px] font-bold uppercase tracking-[.12em] text-ember block mb-2.5">Your skills and stack</span>
              <div className="flex gap-2 flex-wrap">
                {QUICK.map((t) => (
                  <button key={t} onClick={() => toggleSkill(t)}
                    className={`font-mono text-[11.5px] font-semibold rounded-full px-3.5 py-2 border transition-all cursor-pointer ${prof.skills.includes(t) ? "bg-accent border-accent text-white shadow-[0_6px_16px_-6px_rgba(240,146,60,.8)]" : "bg-white/6 border-foam/25 text-foam/85 hover:border-ember hover:text-white"}`}>
                    {t}
                  </button>
                ))}
              </div>
              <input value={free} onChange={(e) => setFree(e.target.value)} placeholder="or type anything: pytorch, figma, arduino, solidity…"
                className="mt-3 w-full max-w-[520px] bg-white/8 border border-foam/25 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-foam/45 outline-none focus:border-ember transition-colors" />
            </div>

            <div className="flex gap-5 flex-wrap items-end">
              <div>
                <span className="font-mono text-[9.5px] font-bold uppercase tracking-[.12em] text-ember block mb-2">Experience</span>
                <div className="flex rounded-[12px] border border-foam/25 overflow-hidden">
                  {([["new", "First season"], ["some", "A few reps"], ["vet", "Veteran"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setProf({ ...prof, level: v })}
                      className={`px-3.5 py-2 text-[12px] font-semibold transition-colors cursor-pointer ${prof.level === v ? "bg-accent text-white" : "bg-transparent text-foam/75 hover:bg-white/8"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-mono text-[9.5px] font-bold uppercase tracking-[.12em] text-ember block mb-2">I want to</span>
                <div className="flex rounded-[12px] border border-foam/25 overflow-hidden">
                  {([["hack", "Win a hackathon"], ["build", "Ship / download skills"], ["program", "Join a program"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setProf({ ...prof, goal: v })}
                      className={`px-3.5 py-2 text-[12px] font-semibold transition-colors cursor-pointer ${prof.goal === v ? "bg-accent text-white" : "bg-transparent text-foam/75 hover:bg-white/8"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <button onClick={run} disabled={!skills.length}
                className={`${btn("primary", "lg")} disabled:opacity-40 disabled:cursor-not-allowed !bg-accent !border-accent`}>
                {ran ? "Re-run nova" : "Find my matches"} →
              </button>
              {prof.skills.length > 0 && (
                <button onClick={() => { setProf(DEFAULT); setFree(""); setRan(false); }}
                  className="font-mono text-[10.5px] uppercase tracking-[.1em] text-foam/60 hover:text-ember cursor-pointer transition-colors pb-2">reset</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── results ── */}
      <div ref={resRef} className="scroll-mt-28 pt-10">
        {!ran ? (
          <div className="text-center py-16 border border-dashed border-line rounded-[22px] bg-cream/60 text-dim">
            Pick at least one skill above and hit "Find my matches" - nova scores {ALL_HACKS.length} hackathons and {CATALOG.length} projects against your stack.
          </div>
        ) : !skills.length ? (
          <p className="text-cocoa text-center py-10">nova needs at least one skill to work with - add one above.</p>
        ) : (
          <>
            <Eyebrow>{`tuned to: ${skills.join(" · ")}`}</Eyebrow>
            <h2 className="font-display font-extrabold tracking-[-.02em] text-[26px] mt-3 mb-6">
              {prof.goal === "hack" ? <>Best <Word>hackathon</Word> fits right now</>
                : prof.goal === "build" ? <>Skills to <Word>download</Word> for your stack</>
                : <>Programs that <Word>fit</Word> your season</>}
            </h2>

            {prof.goal === "hack" && (
              <section className="grid gap-3.5">
                {hacks.length ? hacks.map(({ h, s }) => <HackRow key={h.id} h={h} s={s} />)
                  : <p className="text-dim">Nothing in the live shelf matches that stack - try adding a broader tag like "AI agents" or "Web".</p>}
                <Link to="/hackathons" className={btn("outline", "md", "self-start")}>Browse all {ALL_HACKS.length} hackathons →</Link>
              </section>
            )}
            {prof.goal === "build" && (
              <section className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
                {repos.length ? repos.map(({ r }) => (
                  <article key={r.repo} className="bg-card border border-line rounded-[18px] p-[18px] flex flex-col gap-2.5 shadow-soft hover:-translate-y-1 hover:border-accent/40 transition-all">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <h3 className="font-display font-bold text-[15.5px] truncate">{r.repo.split("/")[1]}</h3>
                      <span className="font-mono text-[10px] text-dim truncate">{r.repo.split("/")[0]}</span>
                      <Chip tone="lang" key={r.lang + r.repo}>{r.lang}</Chip>
                    </div>
                    <p className="card-desc line-clamp-2">{r.desc}</p>
                    <div className="flex gap-1.5 flex-wrap">{r.tags.filter((t) => needles.some((n) => t.toLowerCase().includes(n))).slice(0, 4).map((t) => <Chip key={t} tone="green">{t}</Chip>)}
                      {r.tags.filter((t) => !needles.some((n) => t.toLowerCase().includes(n))).slice(0, 2).map((t) => <Chip key={t}>{t}</Chip>)}</div>
                    <div className="flex gap-2 mt-auto pt-1">
                      {r.cat === "tools" ? (
                        <a href={r.url} target="_blank" rel="noopener" className={btn("primary", "sm")}>GitHub ↗</a>
                      ) : (
                        <a href={`https://api.github.com/repos/${r.repo}/zipball`} className={btn("primary", "sm")}>Download .zip</a>
                      )}
                      <Link to={`/repo/${encodeURIComponent(r.repo)}`} className={btn("outline", "sm")}>Open →</Link>
                    </div>
                  </article>
                )) : <p className="text-dim">No catalog repo scored above the line - try a different term.</p>}
                <Link to="/projects" className={btn("dark", "md", "self-start col-span-full")}>Browse all {CATALOG.length} projects →</Link>
              </section>
            )}
            {prof.goal === "program" && (
              <section className="grid grid-cols-3 gap-4 max-[860px]:grid-cols-1">
                {progs.map((p) => (
                  <Link key={p.id} to={`/programs/${p.id}`} className="group bg-card border border-line rounded-[18px] p-5 flex flex-col gap-2 shadow-soft hover:-translate-y-1 hover:border-accent/40 transition-all">
                    <b className="font-display text-[16px]">{p.name} <span className="text-dim group-hover:text-accent transition-colors">→</span></b>
                    <span className="text-cocoa text-[13px] leading-[1.6]">{p.tag}</span>
                    <span className="font-mono text-[10.5px] text-dim mt-auto">{p.pay} · {p.window} · {p.status}</span>
                    {PROGRAM_META[(Object.keys(PROGRAM_META) as (keyof typeof PROGRAM_META)[]).find((k) => PROGRAM_ID_BY_NAME[k] === p.id) ?? ("GSoC" as keyof typeof PROGRAM_META)] && (
                      <Chip tone="cat">flagship projects on /opensource</Chip>
                    )}
                  </Link>
                ))}
                <Link to="/opensource" className={btn("outline", "md", "self-start col-span-full")}>Search the full program project archive →</Link>
              </section>
            )}

            {/* cross-sell the other two modes */}
            {prof.goal !== "hack" && hacks.length > 0 && (
              <section className="mt-10">
                <h3 className="font-display font-extrabold text-[18px] mb-4">Also scoring well for your stack</h3>
                {hacks.slice(0, 3).map(({ h }) => <HackRow key={h.id} h={h} s={0} slim />)}
              </section>
            )}
            {prof.goal !== "build" && repos.length > 0 && (
              <section className="mt-8">
                <p className="font-mono text-[10.5px] uppercase tracking-[.12em] text-dim">
                  {repos.length} skills in the catalog match your stack · <Link to="/projects" className="text-accent font-bold hover:underline">browse them →</Link>
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function HackRow({ h, s, slim }: { h: Hack; s: number; slim?: boolean }) {
  return (
    <Link to={`/hackathons/${h.id}`} className={`group bg-card border border-line rounded-[16px] px-5 ${slim ? "py-3.5" : "py-4.5"} flex items-center gap-4 shadow-soft hover:border-accent/45 hover:-translate-y-0.5 transition-all`}>
      <span className="w-[10px] h-[10px] rounded-[4px] shrink-0" style={{ background: h.color }} />
      <div className="min-w-0 flex-1">
        <b className="font-display text-[15px] block truncate">{h.name}</b>
        <span className="text-cocoa text-[12.5px] block truncate">{h.theme}</span>
      </div>
      {!slim && s > 0 && <Chip tone="green">fit {Math.min(99, Math.round(55 + s * 3))}%</Chip>}
      <span className="font-mono text-[10px] uppercase tracking-[.1em] text-dim shrink-0 hidden max-[640px]:hidden md:block">{h.org} · {h.status}</span>
      <span className="text-accent font-bold group-hover:translate-x-1 transition-transform">→</span>
    </Link>
  );
}
