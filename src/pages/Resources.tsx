/* ══ Resources.tsx — 58 top-company learning resources, list + in-site detail ═ */
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RESOURCES, RESOURCE_CATS, RESOURCE_PROVIDERS, providerGroup } from "../data/resources";
import type { Resource } from "../data/resources";
import { REPOS } from "../data/repos";
import { avatarOf, byStars } from "../lib/util";
import { Word, SectionTag, btn, OrgImg, Chip, Tag } from "../components/ui";

const CAT_TONE: Record<string, string> = {
  Course: "green", "Docs & guides": "blue", Practice: "cat", Reading: "purple", "Tools & labs": "",
};

function ResCard({ r }: { r: Resource }) {
  return (
    <Link to={`/resources/${r.id}`}
      className="group flex flex-col gap-2.5 bg-card border border-line rounded-[18px] p-[18px] shadow-soft hover:-translate-y-1 hover:border-ember hover:shadow-lift transition-all">
      <div className="flex items-center gap-2.5">
        <OrgImg src={avatarOf(r.provider, 64)} name={r.brand} className="w-[34px] h-[34px] rounded-[10px] object-cover bg-sand shrink-0" />
        <div className="min-w-0 flex-1">
          <b className="block card-title truncate group-hover:text-rust transition-colors">{r.title}</b>
          <span className="text-[11.5px] text-dim">{r.brand}</span>
        </div>
        {r.free && <span className="font-mono text-[9.5px] font-bold text-leaf border border-leaf/30 bg-leaf/8 rounded-full px-2 py-[3px] shrink-0">FREE</span>}
      </div>
      <p className="card-desc line-clamp-2">{r.desc}</p>
      <div className="flex items-center gap-1.5 flex-wrap mt-auto pt-1">
        <Chip tone={CAT_TONE[r.cat] as never}>{r.cat}</Chip>
        <Chip>{r.level}</Chip>
        <span className="ml-auto font-mono text-[10.5px] text-dim">{r.time} · open breakdown <span className="inline-block group-hover:translate-x-0.5 transition-transform">→</span></span>
      </div>
    </Link>
  );
}

/* hand-picked on-ramps, shown only when no filter is active */
const PICKS: { id: string; best: string }[] = [
  { id: "react-docs", best: "Most hackathon winners ship React - start with the docs everyone actually respects." },
  { id: "gh-skills", best: "Practice git on real repos before your first team sprint." },
  { id: "openai-cookbook", best: "The answer key for LLM features, one pattern per evening." },
  { id: "cs50", best: "Foundations feel wobbly at midnight? This fixes that." },
];

export default function Resources() {
  const [cat, setCat] = useState<string>("All");
  const [prov, setProv] = useState<string>("All");
  const [freeOnly, setFreeOnly] = useState(false);
  const [q, setQ] = useState("");

  const list = useMemo(() => RESOURCES.filter((r) =>
    (cat === "All" || r.cat === cat) &&
    (prov === "All" || providerGroup(r) === prov) &&
    (!freeOnly || r.free) &&
    (!q.trim() || (r.title + r.brand + r.desc + r.tags.join(" ")).toLowerCase().includes(q.trim().toLowerCase()))
  ), [cat, prov, freeOnly, q]);

  const freeCount = useMemo(() => RESOURCES.filter((r) => r.free).length, []);
  const pristine = cat === "All" && prov === "All" && !freeOnly && !q.trim();

  const pill = (on: boolean) => `font-mono text-[11px] font-bold tracking-[.06em] uppercase rounded-full px-3.5 py-[7px] border transition-all cursor-pointer ${on ? "bg-coffee border-coffee text-foam" : "bg-card border-line text-cocoa hover:border-accent hover:text-rust"}`;

  return (
    <div className="max-w-[1240px] mx-auto px-6 pt-14 pb-4">
      <h1 className="font-display font-extrabold tracking-[-.02em] leading-[1.08] text-[clamp(38px,4.8vw,58px)]">
        Developer <Word>resources</Word>, ranked.
      </h1>
      <p className="text-ink font-medium mt-4 text-[16.5px] leading-[1.6] max-w-[620px]">
        The courses, docs and labs engineers actually recommend - from Google, Meta, Microsoft, GitHub, NVIDIA and OpenAI. Each card opens a full breakdown on cyrus before you click out.
      </p>

      <div className="flex items-center gap-2 flex-wrap mt-5 font-mono text-[11.5px] text-dim">
        <span className="bg-peach border border-accent/20 text-rust rounded-full px-3 py-1 font-bold">{freeCount} free</span>
        <span className="bg-card border border-line rounded-full px-3 py-1">{RESOURCES.length - freeCount} paid or mixed</span>
        <span className="bg-card border border-line rounded-full px-3 py-1">{RESOURCE_PROVIDERS.length - 1} company shelves · {RESOURCE_CATS.length - 1} types</span>
        <span className="bg-card border border-line rounded-full px-3 py-1">every card opens in-site first</span>
      </div>

      {/* ── start-here band, visible only with no filters ── */}
      {pristine && (
        <section className="mt-10">
          <div className="flex items-baseline gap-3 flex-wrap">
            <SectionTag>Not sure where to begin?</SectionTag>
            <span className="text-[12.5px] text-dim">Four picks that unblock the most people.</span>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4 max-[1020px]:grid-cols-2 max-[640px]:grid-cols-1">
            {PICKS.map((p) => {
              const r = RESOURCES.find((x) => x.id === p.id)!;
              return (
                <Link key={p.id} to={`/resources/${p.id}`}
                  className="group flex flex-col gap-2 bg-coffee text-foam rounded-[18px] p-5 shadow-soft hover:shadow-lift hover:-translate-y-1 transition-all">
                  <div className="flex items-center gap-2.5">
                    <OrgImg src={avatarOf(r.provider, 64)} name={r.brand} className="w-[26px] h-[26px] rounded-[8px] object-cover bg-sand shrink-0" />
                    <span className="font-mono text-[9.5px] font-bold tracking-[.12em] uppercase text-ember">{r.level}</span>
                  </div>
                  <b className="card-title text-[16.5px] leading-snug">{r.title}</b>
                  <span className="text-[12.5px] text-foam/70 leading-[1.5]">{p.best}</span>
                  <span className="mt-auto flex items-center gap-2 font-mono text-[10.5px] text-foam/50 pt-2">
                    {r.brand} · {r.time}
                    <span className="ml-auto text-ember group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex gap-2.5 flex-wrap items-center mt-10">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter resources…"
          className="w-[220px] bg-card border border-line rounded-full px-4 py-2 text-[13.5px] outline-none focus:border-accent placeholder:text-dim" />
        <button onClick={() => setFreeOnly(!freeOnly)}
          className={`font-mono text-[11px] font-bold tracking-[.06em] uppercase rounded-full px-3.5 py-[7px] border transition-all cursor-pointer ${freeOnly ? "bg-leaf border-leaf text-white" : "bg-card border-line text-cocoa hover:border-leaf hover:text-leaf"}`}>
          Free only
        </button>
        <span className="w-px h-6 bg-liness mx-1 max-[700px]:hidden" />
        {RESOURCE_PROVIDERS.map((p) => <button key={p} className={pill(prov === p)} onClick={() => setProv(p)}>{p}</button>)}
      </div>
      <div className="flex gap-2 flex-wrap items-center mt-3">
        {RESOURCE_CATS.map((c) => <button key={c} className={pill(cat === c)} onClick={() => setCat(c)}>{c}</button>)}
        <span className="ml-auto font-mono text-[11px] text-dim">{list.length} of {RESOURCES.length} shown</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8 max-[1020px]:grid-cols-2 max-[640px]:grid-cols-1">
        {list.map((r) => <ResCard key={r.id} r={r} />)}
      </div>
      {list.length === 0 && (
        <p className="text-center text-cocoa py-16 text-[14.5px]">Nothing matches that combo - widen a filter, or <button className="text-accent font-semibold cursor-pointer" onClick={() => { setCat("All"); setProv("All"); setFreeOnly(false); setQ(""); }}>reset everything</button>.</p>
      )}
    </div>
  );
}

/* ── detail page (opens inside cyrus, links out from there) ── */
export function ResourceDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const r = RESOURCES.find((x) => x.id === id);

  const more = useMemo(() => r
    ? RESOURCES.filter((x) => x.id !== r.id && (providerGroup(x) === providerGroup(r) || x.tags.some((t) => r.tags.includes(t)))).slice(0, 3)
    : [], [r]);
  const skills = useMemo(() => r
    ? REPOS.slice().sort(byStars).filter((x) => x.tags.some((t) => r.tags.includes(t)) || r.title.toLowerCase().includes(x.lang?.toLowerCase() ?? "__")).slice(0, 4)
    : [], [r]);

  if (!r) {
    return (
      <div className="max-w-[720px] mx-auto px-6 py-24 text-center">
        <h1 className="font-display font-extrabold text-[30px]">Resource not found</h1>
        <p className="text-cocoa mt-3">That link drifted. The full shelf is one click away.</p>
        <Link className={btn("primary", "md", "mt-6")} to="/resources">All resources →</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto px-6 pt-10 pb-4">
      <button onClick={() => nav("/resources")} className="font-mono text-[11px] tracking-[.1em] uppercase text-dim hover:text-rust cursor-pointer transition-colors">← All resources</button>

      <div className="grid grid-cols-[1fr_320px] gap-8 mt-5 items-start max-[1020px]:grid-cols-1">
        <div>
          <div className="flex items-center gap-4 flex-wrap">
            <OrgImg src={avatarOf(r.provider, 96)} name={r.brand} className="w-[58px] h-[58px] rounded-[16px] object-cover bg-sand shadow-soft" />
            <div>
              <h1 className="font-display font-extrabold tracking-[-.02em] text-[clamp(26px,3.4vw,40px)] leading-[1.1]">{r.title}</h1>
              <span className="text-cocoa text-[14px]">by {r.brand}</span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap mt-5">
            <Chip tone={CAT_TONE[r.cat] as never}>{r.cat}</Chip>
            <Chip>{r.level}</Chip>
            <Chip tone="stars">~{r.time}</Chip>
            {r.free && <Chip tone="green">Free</Chip>}
            {r.tags.map((t) => <Link key={t} to={`/projects?q=${t}`}><Tag>#{t}</Tag></Link>)}
          </div>

          <div className="mt-8 space-y-7">
            <section>
              <SectionTag>What this is</SectionTag>
              <p className="text-[15.5px] leading-[1.7] text-ink mt-3">{r.desc}</p>
            </section>
            <section className="bg-card border border-line rounded-[18px] p-6 shadow-soft">
              <SectionTag>Why it earns a spot</SectionTag>
              <p className="text-[15px] leading-[1.7] text-cocoa mt-3">{r.why}</p>
            </section>
            <section className="rounded-[18px] p-6 border" style={{ borderColor: "color-mix(in srgb, var(--color-accent) 35%, transparent)", background: "color-mix(in srgb, var(--color-accent) 6%, var(--color-card))" }}>
              <SectionTag>How to use it with cyrus</SectionTag>
              <p className="text-[15px] leading-[1.7] text-cocoa mt-3">{r.use}</p>
              <Link to="/hackathons" className={`${btn("outline", "sm")} mt-4`}>Pair it with a hackathon plan →</Link>
            </section>
          </div>
        </div>

        <aside className="sticky top-[90px] max-[1020px]:static grid gap-4">
          <div className="bg-coffee text-foam rounded-[20px] p-6 shadow-lift">
            <p className="font-mono text-[10.5px] tracking-[.12em] uppercase text-ember">Ready when you are</p>
            <a href={r.url} target="_blank" rel="noopener" className={btn("primary", "lg", "w-full mt-3")}>Open {r.brand} ↗</a>
            <p className="text-[12px] text-foam/60 mt-3 leading-[1.55]">Leaves cyrus.ai in a new tab. Bookmark here to keep your prep plan in one place.</p>
          </div>

          <div className="bg-card border border-line rounded-[20px] p-5">
            <h3 className="panel-h mb-3">Skills that match</h3>
            <ul className="grid gap-2.5 list-none">
              {skills.map((s) => (
                <li key={s.repo}>
                  <Link to={`/repo/${encodeURIComponent(s.repo)}`} className="flex items-center gap-2.5 text-[13px] font-semibold text-cocoa hover:text-rust transition-colors min-w-0">
                    <OrgImg src={avatarOf(s.repo.split("/")[0], 48)} name={s.repo} className="w-[22px] h-[22px] rounded-[6px] bg-sand object-cover shrink-0" />
                    <span className="truncate">{s.repo.split("/")[1]}</span>
                    <span className="ml-auto font-mono text-[10.5px] text-honey shrink-0">{Math.round(s.stars / 100) / 10}k</span>
                  </Link>
                </li>
              ))}
              {skills.length === 0 && <li className="text-[12.5px] text-dim">No direct skill match - browse the <Link className="text-accent font-semibold" to="/projects">full catalog</Link>.</li>}
            </ul>
          </div>

          <div className="bg-card border border-line rounded-[20px] p-5">
            <h3 className="panel-h mb-3">More from this shelf</h3>
            <ul className="grid gap-2.5 list-none">
              {more.map((m) => (
                <li key={m.id}><Link to={`/resources/${m.id}`} className="block text-[13px] font-semibold text-cocoa hover:text-rust leading-snug transition-colors">{m.title}<span className="block font-normal text-[11px] text-dim mt-0.5">{m.brand} · {m.cat}</span></Link></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
