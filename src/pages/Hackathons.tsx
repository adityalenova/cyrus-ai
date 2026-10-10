/* ══ Hackathons.tsx — cover art, shelf cards, list + full prep-plan detail ═ */
import { Link, useParams, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { HACKS, HACK_STATUS } from "../data/hackathons";
import type { Hack } from "../data/hackathons";
import { HACKS_LIVE } from "../data/hackathonsLive";
import type { HackLive } from "../data/hackathonsLive";
import { LIVE_CREDITS } from "../data/liveCovers";
import { REPOS } from "../data/repos";
import { avatarOf, byStars, hash } from "../lib/util";
import { Word, SectionTag, btn, OrgImg, Chip } from "../components/ui";

/* curated prep plans first, then the live Devpost pull (open → upcoming → closed) */
export const ALL_HACKS: Hack[] = [...HACKS, ...HACKS_LIVE];
export const hackLink = (h: Hack): string => (h as HackLive).url || REGISTER[h.id] || "https://devpost.com/hackathons";

/* registration / info links kept honest: official hubs, not deep guesses */
export const REGISTER: Record<string, string> = {
  "nebius-x-nvidia-global-ai-hackathon": "https://devpost.com/hackathons",
  "hacktoberfest-2026": "https://hacktoberfest.com",
  "smart-india-hackathon-2026": "https://sih.gov.in",
  "microsoft-imagine-cup-2027": "https://imaginecup.microsoft.com",
  "google-solution-challenge-2027": "https://solutionchallenge.withgoogle.com",
  "openai-build-week": "https://openai.com/devday/",
  "meta-global-ai-developer-hackathon": "https://dev.meta.ai",
  "hackon-with-amazon": "https://unstop.com/hackathons",
  "mlh-global-hack-week": "https://mlh.io",
  "kaggle-playground-series": "https://www.kaggle.com/competitions",
  "google-cloud-agents-for-impact": "https://cloud.google.com/resources",
  "ai-builder-cup-2026": "https://unstop.com/hackathons",
  "github-universe-ai-hackathon-2026": "https://github.com/universe",
  "anthropic-claude-code-hackathon": "https://www.anthropic.com/events",
  "nvidia-jetson-physical-ai-hackathon": "https://developer.nvidia.com/hackathon",
  "hugging-face-open-model-hackathon": "https://huggingface.co",
  "devpost-hack-new-year-2027": "https://devpost.com/hackathons",
  "microsoft-ai-tour-hackathon": "https://aitour.microsoft.com",
};

const daysTo = (iso: string) => Math.ceil((+new Date(iso) - +new Date("2026-10-03")) / 864e5);

/* cover artwork: plain dark warm gradients - no motifs, no text on the
   background. Each event gets a deterministic gradient direction plus one
   soft glow in its own brand color, nothing else. */
function HackCover({ h, className = "" }: { h: Hack; className?: string }) {
  const c = h.color;
  const seed = hash(h.id);
  const dir = seed % 4;
  const glow = [{ x: "22%", y: "16%" }, { x: "80%", y: "18%" }, { x: "50%", y: "84%" }, { x: "12%", y: "72%" }][dir];
  return (
    <svg viewBox="0 0 220 180" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`hg-${seed}`} x1="0" y1="0" x2={dir % 2 ? 1 : 0.8} y2={dir > 1 ? 0.75 : 1}>
          <stop offset="0" stopColor="#1d150c" /><stop offset="1" stopColor="#2a1c0e" />
        </linearGradient>
        <radialGradient id={`hr-${seed}`} cx={glow.x} cy={glow.y} r="85%">
          <stop offset="0" stopColor={c} stopOpacity=".4" /><stop offset=".55" stopColor={c} stopOpacity=".12" /><stop offset="1" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="220" height="180" fill={`url(#hg-${seed})`} />
      <rect width="220" height="180" fill={`url(#hr-${seed})`} />
    </svg>
  );
}

/* ── cover artwork: the dark warm-gradient HackCover compositions above are
   the covers for every event (no photos). The credit pill on each card links
   to the event's OFFICIAL page on Devpost / Unstop / hack2skill / the
   organizer site, so the organizer always gets the click. */
export interface Credit { label: string; url: string }
const CURATED_CREDITS: Record<string, Credit> = {
  "github-universe-ai-hackathon-2026": { label: "GitHub", url: "https://github.com/universe" },
  "anthropic-claude-code-hackathon": { label: "Anthropic", url: "https://www.anthropic.com/events" },
  "nvidia-jetson-physical-ai-hackathon": { label: "NVIDIA Developer", url: "https://developer.nvidia.com/hackathon" },
  "hugging-face-open-model-hackathon": { label: "Hugging Face", url: "https://huggingface.co" },
  "devpost-hack-new-year-2027": { label: "Devpost", url: "https://devpost.com" },
  "microsoft-ai-tour-hackathon": { label: "Microsoft", url: "https://aitour.microsoft.com" },
  "nebius-x-nvidia-global-ai-hackathon": { label: "Devpost", url: "https://devpost.com/hackathons" },
  "hacktoberfest-2026": { label: "GitHub", url: "https://hacktoberfest.com" },
  "google-solution-challenge-2027": { label: "Google", url: "https://solutionchallenge.withgoogle.com" },
  "openai-build-week": { label: "OpenAI", url: "https://openai.com/devday/" },
  "meta-global-ai-developer-hackathon": { label: "Meta", url: "https://dev.meta.ai" },
  "mlh-global-hack-week": { label: "MLH", url: "https://mlh.io" },
  "google-cloud-agents-for-impact": { label: "Google Cloud", url: "https://cloud.google.com/resources" },
  "ai-builder-cup-2026": { label: "hack2skill", url: "https://hack2skill.com" },
  "smart-india-hackathon-2026": { label: "Smart India Hackathon", url: "https://sih.gov.in" },
  "microsoft-imagine-cup-2027": { label: "Microsoft", url: "https://imaginecup.microsoft.com" },
  "hackon-with-amazon": { label: "Unstop", url: "https://unstop.com/hackathons" },
  "kaggle-playground-series": { label: "Kaggle", url: "https://www.kaggle.com/competitions" },
};
/* every event gets a credit: the curated table, its Devpost listing url, or the live object's own url */
export const creditFor = (h: Hack): Credit =>
  CURATED_CREDITS[h.id] ?? LIVE_CREDITS[h.id] ?? { label: "Devpost", url: hackLink(h) };

/* ── shelf card, reused on Home and the list page. The whole card links to the
   prep plan; the "cover ©" pill is a sibling of the stretched link and opens
   the artwork credit + a jump to the official event page. ── */
export function HackCard({ h }: { h: Hack }) {
  const [label, cls] = HACK_STATUS[h.status];
  const d = daysTo(h.deadline);
  const [showCredit, setShowCredit] = useState(false);
  const cr = creditFor(h);
  return (
    <div className="group relative rounded-[22px] overflow-hidden flex flex-col min-h-[430px] text-foam isolate bg-coffee border border-bean transition-all duration-300 hover:-translate-y-[7px] hover:shadow-[0_34px_66px_-22px_rgba(34,26,19,.55)]">
      <HackCover h={h} className="absolute inset-0 -z-20 w-full h-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]" />
      <span className="absolute inset-0 -z-10 bg-gradient-to-b from-coffee/25 via-coffee/55 to-[#140e09]/95" />
      <div className="flex items-center justify-between gap-2 px-5 pt-[18px]">
        <span className="w-11 h-11 rounded-xl bg-white grid place-items-center overflow-hidden shadow-[0_8px_18px_-6px_rgba(0,0,0,.5)]">
          <OrgImg src={avatarOf(h.orgLogo, 64)} name={h.orgLogo} className="w-[30px] h-[30px] object-contain" />
        </span>
        <span className={`font-mono text-[9.5px] font-bold tracking-[.1em] uppercase px-3 py-[5px] rounded-full border ${cls}`}>{label}</span>
      </div>
      <div className="mt-auto p-5 flex flex-col gap-2.5">
        <span className="font-mono text-[10.5px] tracking-[.1em] uppercase text-ember">{h.org}</span>
        <h3 className="card-title-xl text-white">{h.name}</h3>
        <p className="text-foam/75 text-[13.5px] leading-[1.6]">{h.theme}</p>
        <div className="flex items-center justify-between gap-2.5 mt-1.5">
          <span className="font-mono text-[13px] font-bold text-[#f0a35c]">{h.prize.split("+")[0]}
            <small className="block text-[9.5px] font-medium text-foam/55 tracking-[.08em] uppercase">{h.status === "open" || h.status === "rolling" ? (d > 0 ? `closes in ${d} days` : "closing") : `deadline ${h.deadline.slice(0, 7)}`}</small></span>
          <span className="inline-flex items-center gap-2 text-[12.5px] font-bold text-white bg-white/10 border border-white/20 rounded-full px-3.5 py-[7px] group-hover:bg-accent group-hover:border-accent transition-colors">Prep plan</span>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-3 flex items-center gap-3.5 font-mono text-[10.5px] text-foam/60">
        <span>Scale · <b className="text-white font-semibold">{h.participants}</b></span>
        <span>Format · <b className="text-white font-semibold">{h.format.split(":")[0]}</b></span>
      </div>
      <Link to={`/hackathons/${h.id}`} aria-label={`${h.name} prep plan`}
        className="absolute inset-0 z-10 rounded-[22px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
      <button type="button" onClick={() => setShowCredit((v) => !v)} aria-label="Event credit"
        className="absolute right-3.5 bottom-[42px] z-20 font-mono text-[9px] font-bold tracking-[.08em] uppercase text-foam/65 bg-[#140e09]/65 border border-white/20 rounded-full px-2.5 py-[4px] hover:text-white hover:border-accent cursor-pointer transition-colors">
        event ©
      </button>
      {showCredit && (
        <div className="absolute right-3.5 bottom-[68px] z-30 w-[250px] bg-card border border-line rounded-[14px] shadow-lift p-3.5 text-ink">
          <p className="font-mono text-[9.5px] font-bold uppercase tracking-[.12em] text-dim mb-1.5">Event credit</p>
          <p className="text-[12.5px] leading-[1.55]">
            {h.name} is organized by {h.org} - listing, artwork and marks belong to the organizer on {cr.label}.{" "}
            <a href={cr.url} target="_blank" rel="noopener" className="text-accent font-semibold hover:underline">Official page</a>
          </p>
          <button type="button" onClick={() => setShowCredit(false)} className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-dim hover:text-rust cursor-pointer">Close</button>
        </div>
      )}
    </div>
  );
}

/* ── list page ── */
export default function Hackathons() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | Hack["status"]>("all");
  const [tag, setTag] = useState("all");

  const hotTags = useMemo(() => {
    const c: Record<string, number> = {};
    ALL_HACKS.forEach((h) => h.tags.forEach((t) => { c[t] = (c[t] ?? 0) + 1; }));
    return Object.entries(c).filter(([t, n]) => n >= 3 && t !== "hackathon").sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  }, []);

  const list = useMemo(() => ALL_HACKS.filter((h) =>
    (status === "all" || h.status === status) &&
    (tag === "all" || h.tags.includes(tag)) &&
    (!q.trim() || (h.name + " " + h.org + " " + h.theme + " " + h.tags.join(" ")).toLowerCase().includes(q.trim().toLowerCase()))
  ), [q, status, tag]);

  const fin = "w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-[14px] outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(180,96,44,.12)]";

  return (
    <div className="max-w-[1240px] mx-auto px-6 pt-14 pb-4">
      <h1 className="font-display font-extrabold tracking-[-.02em] leading-[1.08] text-[clamp(38px,4.8vw,58px)]">
        Top <Word>hackathons</Word>, decoded.
      </h1>
      <p className="text-ink font-medium mt-4 text-[16.5px] leading-[1.6] max-w-[620px]">
        Every event decoded - deadlines, prep plan, judging strategy and the right stack.
      </p>

      <div className="flex gap-3 items-center flex-wrap mt-8">
        <input className={`${fin} !w-[320px] max-[640px]:w-full`} placeholder="Search hackathons - “ai”, “nvidia”, “web3”…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search hackathons" />
        <div className="flex gap-1.5 flex-wrap ml-auto max-[900px]:ml-0" role="group" aria-label="Filter by status">
          {(["all", "open", "upcoming", "closed"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`font-mono text-[11px] font-semibold rounded-full px-3.5 py-2 border transition-all cursor-pointer ${status === s ? "bg-coffee border-coffee text-foam" : "bg-paper border-line text-cocoa hover:border-accent hover:text-rust"}`}>
              {s === "all" ? `All · ${ALL_HACKS.length}` : `${s} · ${ALL_HACKS.filter((h) => h.status === s).length}`}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap mt-3" role="group" aria-label="Filter by theme">
        <button onClick={() => setTag("all")} className={`text-[12px] font-semibold rounded-full px-3 py-1.5 border transition-all cursor-pointer ${tag === "all" ? "bg-accent border-accent text-white" : "bg-card border-line text-cocoa hover:border-accent hover:text-rust"}`}>Any theme</button>
        {hotTags.map((t) => (
          <button key={t} onClick={() => setTag(tag === t ? "all" : t)} className={`text-[12px] font-semibold rounded-full px-3 py-1.5 border transition-all cursor-pointer ${tag === t ? "bg-accent border-accent text-white" : "bg-card border-line text-cocoa hover:border-accent hover:text-rust"}`}>#{t}</button>
        ))}
      </div>

      <p className="font-mono text-[11.5px] tracking-[.1em] uppercase text-cocoa mt-7 mb-5">
        <b className="text-accent">{list.length}</b> hackathon{list.length === 1 ? "" : "s"} shown
        {(q || status !== "all" || tag !== "all") && (
          <button className="normal-case tracking-normal font-semibold text-accent ml-3 hover:underline cursor-pointer" onClick={() => { setQ(""); setStatus("all"); setTag("all"); }}>Clear filters</button>
        )}
      </p>
      {list.length ? (
        <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-[700px]:grid-cols-1">
          {list.map((h) => <HackCard key={h.id} h={h} />)}
        </div>
      ) : (
        <div className="text-center py-16 text-dim border border-dashed border-line rounded-[22px] bg-cream">
          No hackathon matches those filters. <button className="text-accent font-semibold hover:underline cursor-pointer" onClick={() => { setQ(""); setStatus("all"); setTag("all"); }}>Clear filters</button>
        </div>
      )}
    </div>
  );
}

/* ── detail: the full prep plan ── */
function Block({ tag, title, children }: { tag: string; title: string; children: ReactNode }) {
  return (
    <section className="mt-9">
      <SectionTag>{tag}</SectionTag>
      <h2 className="font-display font-extrabold tracking-[-.02em] text-[26px] mt-2">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function HackathonDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const h = ALL_HACKS.find((x) => x.id === id);
  if (!h) {
    return (
      <div className="max-w-[720px] mx-auto px-6 py-24 text-center">
        <h1 className="font-display font-extrabold text-[30px]">Hackathon not found</h1>
        <p className="text-cocoa mt-3">That edition drifted off the calendar. The current shelf is one click away.</p>
        <Link className={btn("primary", "md", "mt-6")} to="/hackathons">All hackathons</Link>
      </div>
    );
  }
  const [label, cls] = HACK_STATUS[h.status];
  const d = daysTo(h.deadline);
  const deadlineLabel = new Date(h.deadline).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  const skills = REPOS.slice().sort(byStars).filter((r) => h.tags.some((t) => r.tags.includes(t)) || h.stack.frameworks.some((f) => r.tags.includes(f.toLowerCase()) || r.desc.toLowerCase().includes(f.toLowerCase()))).slice(0, 6);

  return (
    <div className="max-w-[1240px] mx-auto px-6 pt-10 pb-4">
      <button onClick={() => nav("/hackathons")} className="font-mono text-[11px] tracking-[.1em] uppercase text-dim hover:text-rust cursor-pointer transition-colors">← All hackathons</button>

      {/* hero */}
      <div className="grid grid-cols-[1.15fr_.85fr] gap-8 mt-5 items-stretch max-[1020px]:grid-cols-1">
        <div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="w-[54px] h-[54px] rounded-[15px] bg-card border border-line grid place-items-center shadow-soft overflow-hidden">
              <OrgImg src={avatarOf(h.orgLogo, 96)} name={h.orgLogo} className="w-[34px] h-[34px] object-contain" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold tracking-[-.02em] text-[clamp(26px,3.4vw,42px)] leading-[1.08]">{h.name}</h1>
              <span className="text-cocoa text-[14px]">{h.org}</span>
            </div>
            <span className={`font-mono text-[10px] font-bold tracking-[.1em] uppercase px-3 py-[6px] rounded-full border ${cls} !text-rust !border-accent/40 !bg-peach`}>{label}{d > 0 && h.status !== "recurring" ? ` · ${d}d left` : ""}</span>
          </div>
          <p className="text-[16px] leading-[1.7] text-ink mt-5 max-w-[560px]">{h.theme}.</p>
          <div className="grid grid-cols-2 gap-3 mt-6 max-[640px]:grid-cols-1">
            {([["Deadline", deadlineLabel], ["Scale", h.participants + " builders"], ["Format", h.format], ["Eligibility", h.eligibility]] as [string, string][]).map(([k, v]) => (
              <div key={k} className="bg-card border border-line rounded-[16px] p-4 shadow-soft">
                <span className="font-mono text-[10px] tracking-[.12em] uppercase text-dim">{k}</span>
                <p className="text-[13.5px] font-semibold text-ink mt-1.5 leading-snug">{v}</p>
              </div>
            ))}
          </div>
          {h.estimated && <p className="font-mono text-[10.5px] text-dim mt-3">Dates marked estimated are best-known projections; confirm on the organizer page before booking travel.</p>}
        </div>
        {/* event brief - a typographic UI panel, no cover art on the detail page */}
        <div className="rounded-[22px] border border-bean bg-gradient-to-b from-coffee to-bean shadow-lift min-h-[280px] p-6 flex flex-col text-foam">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] tracking-[.14em] uppercase text-foam/60">The brief</span>
            <span className={`font-mono text-[10px] font-bold tracking-[.1em] uppercase px-3 py-[6px] rounded-full border ${cls}${h.status === "closed" ? " !text-foam/70 !border-white/15 !bg-white/5" : ""}`}>{label}</span>
          </div>
          <p className="font-display font-extrabold tracking-[-.02em] text-[clamp(30px,3.6vw,46px)] leading-[1.08] mt-6">{h.prize}</p>
          <p className="font-mono text-[10px] tracking-[.14em] uppercase text-foam/55 mt-1.5">prize pool at stake</p>
          {h.status === "closed" ? (
            <p className="text-[13.5px] text-foam/80 mt-6 leading-relaxed">This edition has wrapped. Winners and projects live on the organizer page below.</p>
          ) : h.status === "recurring" ? (
            <p className="text-[13.5px] text-foam/80 mt-6 leading-relaxed">Runs every year - the next window opens around {deadlineLabel}.</p>
          ) : d > 0 ? (
            <div className="flex items-end gap-3.5 mt-6">
              <span className="font-display font-extrabold text-[52px] leading-[.9] text-honey">{d}</span>
              <span className="text-[13px] leading-snug text-foam/85 pb-1">days left<br /><span className="font-mono text-[10.5px] text-foam/60">closes {deadlineLabel}</span></span>
            </div>
          ) : (
            <p className="text-[13.5px] text-foam/80 mt-6 leading-relaxed">Deadline {deadlineLabel} - check the organizer page for the current window.</p>
          )}
          <div className="h-px bg-white/10 my-5" />
          <div className="flex gap-1.5 flex-wrap">{h.tags.map((t) => <span key={t} className="font-mono text-[10px] font-semibold text-foam/80 border border-white/20 bg-white/10 rounded-full px-2.5 py-1">#{t}</span>)}</div>
          {(() => { const cr = creditFor(h); return (
            <p className="font-mono text-[9.5px] text-foam/55 mt-auto pt-4">
              {h.name} by {h.org} - listing and marks belong to the organizer on {cr.label} ·{" "}
              <a href={cr.url} target="_blank" rel="noopener" className="text-foam/90 underline decoration-white/30 hover:text-white">Official page</a>
            </p>
          ); })()}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-8 mt-4 items-start max-[1020px]:grid-cols-1">
        <div>
          <Block tag="The calendar" title="Key timelines">
            <ol className="relative grid gap-0 list-none border-l-2 border-liness ml-[7px]">
              {h.timeline.map((p, i) => (
                <li key={p.label} className="pl-7 pb-7 relative last:pb-1">
                  <span className="absolute -left-[9px] top-0.5 w-[16px] h-[16px] rounded-full border-[3px] bg-card" style={{ borderColor: i === 0 ? "var(--color-accent)" : "var(--color-line)" }} />
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <b className="font-display text-[15.5px]">{p.label}</b>
                    <span className="font-mono text-[11px] text-rust font-semibold">{p.when}</span>
                  </div>
                  <p className="text-cocoa text-[13.5px] mt-1 leading-[1.55]">{p.note}</p>
                </li>
              ))}
            </ol>
          </Block>

          <Block tag="Weeks before" title="How to prepare">
            <ul className="grid gap-2.5 list-none">
              {h.prep.map((p) => (
                <li key={p} className="flex gap-3 text-[14px] leading-[1.6] text-cocoa">
                  <span className="mt-[7px] w-[7px] h-[7px] rounded-[3px] shrink-0" style={{ background: h.color }} />{p}
                </li>
              ))}
            </ul>
          </Block>

          <Block tag="During + judging" title="How to approach it">
            <ul className="grid gap-2.5 list-none">
              {h.approach.map((p) => (
                <li key={p} className="flex gap-3 text-[14px] leading-[1.6] text-cocoa">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--color-leaf)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="mt-[4px] shrink-0"><path d="m4.5 12.5 5 5 10-11" /></svg>{p}
                </li>
              ))}
            </ul>
          </Block>

          <Block tag="From the cyrus bench" title="Ideas that fit this brief">
            <div className="grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-1">
              {h.ideas.map((idea) => (
                <div key={idea.title} className="bg-card border border-line rounded-[16px] p-[18px] shadow-soft hover:-translate-y-1 hover:border-ember transition-all">
                  <b className="font-display text-[15px] block">{idea.title}</b>
                  <p className="text-cocoa text-[13px] leading-[1.6] mt-1.5">{idea.pitch}</p>
                </div>
              ))}
            </div>
            <p className="font-mono text-[10.5px] text-dim mt-3">Original directions drafted by cyrus for this brief - build them, or fork one into your own.</p>
          </Block>

          <Block tag="What winners run" title="Ideal tech stack">
            <div className="bg-card border border-line rounded-[18px] p-5 shadow-soft">
              {([["Languages", h.stack.languages], ["Frameworks", h.stack.frameworks], ["Tools & platforms", h.stack.tools]] as [string, string[]][]).map(([k, arr]) => (
                <div key={k} className="flex items-center gap-2 flex-wrap py-2 border-b border-liness last:border-0">
                  <span className="font-mono text-[10.5px] tracking-[.1em] uppercase text-dim w-[130px] shrink-0 max-[640px]:w-full">{k}</span>
                  {arr.map((s) => <Chip key={s} tone="lang">{s}</Chip>)}
                </div>
              ))}
              <p className="text-cocoa text-[13.5px] leading-[1.6] mt-3 italic">"{h.stack.why}"</p>
            </div>
          </Block>
        </div>

        <aside className="sticky top-[90px] max-[1020px]:static grid gap-4">
          <div className="bg-coffee text-foam rounded-[20px] p-6 shadow-lift">
            <p className="font-mono text-[10.5px] tracking-[.12em] uppercase text-ember">Register at the source</p>
            <a href={hackLink(h)} target="_blank" rel="noopener" className={btn("primary", "lg", "w-full mt-3")}>Open {h.orgLogo === "unstop" ? "Unstop" : h.orgLogo === "mlh" ? "MLH" : h.orgLogo === "kaggle" ? "Kaggle" : (h as HackLive).url ? "Devpost" : "official page"}</a>
            <p className="text-[12px] text-foam/60 mt-3 leading-[1.55]">{h.perks}</p>
          </div>

          <div className="bg-card border border-line rounded-[20px] p-5">
            <h3 className="panel-h mb-1.5">Skills for this stack</h3>
            <p className="text-[12px] text-dim mb-3 leading-relaxed">Install these from the catalog so your agent builds on the winning stack from hour one.</p>
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
            </ul>
            <Link to={`/projects?q=${h.tags[0]}`} className="font-mono text-[10.5px] font-bold tracking-[.08em] uppercase text-accent hover:text-rust mt-3 inline-block">Browse all #{h.tags[0]} skills</Link>
          </div>

          <div className="bg-card border border-line rounded-[20px] p-5">
            <h3 className="panel-h mb-1.5">Prep with the shelf</h3>
            <ul className="grid gap-2 list-none text-[13px]">
              <li><Link className="text-cocoa hover:text-rust font-semibold" to="/resources">Learning resources by company</Link></li>
              <li><Link className="text-cocoa hover:text-rust font-semibold" to="/#roadmap">The 6-step contributor blueprint</Link></li>
              <li><Link className="text-cocoa hover:text-rust font-semibold" to="/organizations">Study the organizer's repos</Link></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
