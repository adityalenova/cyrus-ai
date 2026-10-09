/* ══ Projects.tsx — filter rail + sortable project cards ════ */
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { REPOS, CATEGORIES } from "../data/repos";
import { ORGS } from "../data/orgs";
import { avatarOf, byStars, CAT_META, fmt, levelOf, LANG_COLORS } from "../lib/util";
import type { Level, Repo } from "../lib/types";
import { useStore } from "../lib/store";
import { btn, Chip, LevelChip, OrgImg, Tag, Word } from "../components/ui";

const W = "max-w-[1240px] mx-auto px-6";
const LANGS = ["TypeScript", "Python", "JavaScript", "Go", "Rust", "Shell"];

type Sort = "stars" | "forks" | "issues" | "recent" | "name" | "dl";
const SORTERS: Record<Exclude<Sort, "dl">, (a: Repo, b: Repo) => number> = {
  stars: byStars,
  forks: (a, b) => b.forks - a.forks,
  issues: (a, b) => b.issues - a.issues,
  recent: (a, b) => b.updated.localeCompare(a.updated),
  name: (a, b) => a.repo.localeCompare(b.repo),
};

function PCard({ r }: { r: Repo }) {
  const { saved, toggleSaved, toast, countDownload, downloads } = useStore();
  const on = saved.includes(r.repo);
  const owner = r.repo.split("/")[0];
  const dl = downloads[r.repo] || 0;
  return (
    <article className="bg-card border border-line rounded-[20px] p-[22px] flex flex-col gap-3 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift hover:border-accent/40">
      <div className="flex items-center gap-3.5">
        <OrgImg src={avatarOf(owner, 88)} name={r.repo} className="w-11 h-11 rounded-[13px] object-cover bg-clay" />
        <div className="min-w-0">
          <h3 className="font-display font-bold text-[16.5px] leading-tight truncate">{r.repo.split("/")[1]}</h3>
          <span className="font-mono text-[10.5px] text-dim tracking-[.05em]">{owner} · {CAT_META[r.cat]?.label ?? r.cat}</span>
        </div>
        <span className="ml-auto shrink-0"><LevelChip level={levelOf(r.stars)} /></span>
      </div>
      <div className="flex gap-[7px] flex-wrap">
        <Chip tone="stars">★ {fmt(r.stars)}</Chip>
        <Chip tone="cat">{CAT_META[r.cat]?.label?.split(" ")[0] ?? r.cat}</Chip>
        <Chip tone="lang"><i className="w-2 h-2 rounded-full shrink-0" style={{ background: LANG_COLORS[r.lang] ?? "currentColor" }} aria-hidden />{r.lang}</Chip>
        <Chip>⎇ {fmt(r.forks)}</Chip>
      </div>
      <p className="text-cocoa text-[13.5px] leading-[1.6] line-clamp-2">{r.desc}</p>
      <div className="flex gap-1.5 flex-wrap">{r.tags.slice(0, 4).map((t) => <Tag key={t}>{t}</Tag>)}</div>
      <div className="flex items-center gap-2.5 mt-auto pt-1.5">
        <span className="font-mono text-[10.5px] text-dim">pushed {r.updated}</span>
        <button aria-label={on ? "Unsave project" : "Save project"} onClick={() => {
          const added = toggleSaved(r.repo);
          toast(added ? `Saved ${r.repo.split("/")[1]} to your dashboard` : `Removed ${r.repo.split("/")[1]}`);
        }} className={`ml-auto w-9 h-9 rounded-[11px] border grid place-items-center text-[14px] transition-all ${on ? "bg-accent border-accent text-white" : "bg-cream border-line text-dim hover:border-accent hover:text-accent"}`}>
          {on ? "★" : "☆"}
        </button>
        <a href={`https://api.github.com/repos/${r.repo}/zipball`} title="Download the whole skill as a .zip - cyrus.ai resolves the default branch"
          onClick={() => { countDownload(r.repo); toast(`Downloading ${r.repo.split("/")[1]} .zip via cyrus.ai`); }}
          className={btn("primary", "sm")}>Download .zip{dl > 0 ? ` (${dl})` : ""}</a>
        <Link to={`/repo/${encodeURIComponent(r.repo)}`} className={btn("dark", "sm")}>Open →</Link>
      </div>
    </article>
  );
}

export default function Projects() {
  const [params] = useSearchParams();
  const { downloads } = useStore();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [level, setLevel] = useState<"all" | Level>("all");
  const [cat, setCat] = useState("all");
  const [org, setOrg] = useState("all");
  const [langs, setLangs] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("stars");
  const [shown, setShown] = useState(48);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return REPOS.filter((r) =>
      (level === "all" || levelOf(r.stars) === level) &&
      (cat === "all" || r.cat === cat) &&
      (org === "all" || r.repo.split("/")[0].toLowerCase() === org) &&
      (!langs.length || langs.includes(r.lang)) &&
      (!term || (r.repo + " " + r.desc + " " + r.tags.join(" ") + " " + r.lang).toLowerCase().includes(term))
    ).sort((a, b) => sort === "dl" ? (downloads[b.repo] || 0) - (downloads[a.repo] || 0) || byStars(a, b) : SORTERS[sort](a, b));
  }, [q, level, cat, org, langs, sort, downloads]);

  const orgLogins = useMemo(() => {
    const set = new Map<string, string>();
    ORGS.forEach((o) => set.set(o.login.toLowerCase(), o.name));
    return [...set.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, []);

  const fin = "w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-[14px] outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(180,96,44,.12)]";
  const label = "block font-mono text-[10.5px] tracking-[.12em] uppercase text-dim mb-2.5";

  return (
    <>
      <header className={`${W} pt-14 pb-2`}>
        <p className="font-mono text-[10.5px] tracking-[.14em] uppercase text-dim">
          <Link to="/" className="hover:text-accent">Home</Link> / <span className="text-cocoa">Projects</span>
        </p>
        <h1 className="font-display font-extrabold tracking-[-.02em] leading-[1.08] mt-3.5 mb-3 text-[clamp(33px,4.2vw,52px)]">
          GitHub skills your <Word>AI tools</Word> plug into.
        </h1>
        <p className="text-cocoa max-w-[640px] text-[16px] leading-[1.65]">
          Agent skills, Cursor rules, AGENTS.md files, MCP servers and dev agents - {REPOS.length} repos you can
          install straight into Claude Code, Cursor, Codex or any coding agent. Hit <b className="text-ink">Download .zip</b>
          on any card, unzip into <code className="font-mono text-[13px] text-rust">~/.claude/skills</code>
          or <code className="font-mono text-[13px] text-rust">.cursor/rules</code> and it is live. Mentored programs and their projects live on the <Link to="/opensource" className="text-accent font-semibold hover:underline">open source page</Link>.
        </p>
      </header>

      <div className={`${W} pt-9 grid grid-cols-[280px_1fr] gap-7 items-start max-[980px]:grid-cols-1`}>
        {/* ── filter rail ── */}
        <aside className="sticky top-[86px] max-[980px]:static bg-card border border-line rounded-[22px] p-[22px] shadow-soft grid gap-5">
          <div>
            <span className={label}>Search</span>
            <input className={fin} placeholder="name, tag, description…" value={q} onChange={(e) => { setQ(e.target.value); setShown(48); }} />
          </div>
          <div>
            <span className={label}>Difficulty</span>
            <select className={`${fin} select-warm pr-8`} value={level} onChange={(e) => { setLevel(e.target.value as typeof level); setShown(48); }}>
              <option value="all">Any difficulty</option>
              <option value="beginner">Beginner · under 10k★</option>
              <option value="intermediate">Intermediate · 10–50k★</option>
              <option value="advanced">Advanced · over 50k★</option>
            </select>
          </div>
          <div>
            <span className={label}>Program / org</span>
            <select className={`${fin} select-warm pr-8`} value={org} onChange={(e) => { setOrg(e.target.value); setShown(48); }}>
              <option value="all">Any organization</option>
              {orgLogins.map(([l, n]) => <option key={l} value={l}>{n}</option>)}
            </select>
          </div>
          <div>
            <span className={label}>Shelf</span>
            <select className={`${fin} select-warm pr-8`} value={cat} onChange={(e) => { setCat(e.target.value); setShown(48); }}>
              <option value="all">All shelves</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <span className={label}>Popular stacks</span>
            <div className="flex flex-wrap gap-[7px]">
              {LANGS.map((l) => (
                <button key={l} onClick={() => { setLangs((s) => s.includes(l) ? s.filter((x) => x !== l) : [...s, l]); setShown(48); }}
                  className={`text-[12px] font-semibold rounded-full px-3 py-1.5 border transition-all cursor-pointer ${langs.includes(l) ? "bg-coffee border-coffee text-foam" : "bg-paper border-line text-cocoa hover:border-accent hover:text-rust"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <button className={btn("primary", "md", "w-full")} onClick={() => { setQ(""); setLevel("all"); setCat("all"); setOrg("all"); setLangs([]); setSort("stars"); setShown(48); }}>
            Reset filters
          </button>
        </aside>

        {/* ── results ── */}
        <section>
          <div className="flex items-center gap-3.5 pt-1 pb-[18px] px-0.5 flex-wrap">
            <span className="font-mono text-[12px] tracking-[.1em] uppercase text-cocoa">
              <b className="text-accent">{list.length}</b> projects found
            </span>
            <span className="ml-auto text-[12px] text-dim">Sort by</span>
            <select className={`${fin} select-warm !w-auto rounded-full pr-8 py-2 text-[13px] font-semibold`} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="stars">Most stars</option>
              <option value="dl">Most downloaded on cyrus</option>
              <option value="forks">Most forks</option>
              <option value="issues">Open issues</option>
              <option value="recent">Recently pushed</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>

          {list.length ? (
            <>
              <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
                {list.slice(0, shown).map((r) => <PCard key={r.repo} r={r} />)}
              </div>
              {shown < list.length && (
                <div className="flex justify-center mt-8">
                  <button className={btn("outline", "lg")} onClick={() => setShown((s) => s + 48)}>
                    Show {Math.min(48, list.length - shown)} more ↓
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-dim border border-dashed border-line rounded-[22px] bg-cream">
              <p className="font-display text-[20px] text-cocoa mb-2">Nothing matches that combination.</p>
              <p>Loosen a filter - or the empty shelf is a hint to <Link to="/organizations" className="text-accent font-semibold hover:underline">find an org</Link> instead.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
