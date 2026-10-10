/* ══ NovaAI.tsx — /platform/nova, the marketing page for Nova.
   Sections mirror a best-in-class AI-product page: question-card
   scatter hero, hub-and-spoke capability grid, generic-AI vs Nova
   split panel - rebuilt in the Contriho coffee/honey theme.     ═ */
import { Link } from "react-router-dom";
import { btn, Word } from "../components/ui";
import { W, Pill, Ico, Check, Cross, Tile, CenterHead, GridBG, Rule } from "../components/plat";

const D: Record<string, string> = {
  spark: "M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z",
  doc: "M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 0v5h5M9 13h7M9 17h5",
  book: "M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13",
  layers: "M12 3 3 8l9 5 9-5-9-5ZM3 16l9 5 9-5M3 12l9 5 9-5",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3.5 2",
  chart: "M4 20V10M10 20V4M16 20v-7M2 20h20",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-3.5-3.5",
};

/* ── hero: six scattered question cards around the Nova core (image 5) ── */
const QUESTIONS: [string, string, string, string, string][] = [
  ["Which orgs merge PRs in under 48 hours?", "3%", "10%", "-6deg", "rust"],
  ["What should I prioritize this quarter?", "44%", "2%", "4deg", "leaf"],
  ["Am I ready for GSoC?", "70%", "20%", "-4deg", "honey"],
  ["Show open deadlines this month.", "2%", "58%", "5deg", "plum"],
  ["Summarize my saved stack.", "40%", "74%", "-5deg", "denim"],
  ["Which skills match Kubernetes work?", "72%", "52%", "6deg", "brick"],
];
function AskCards() {
  return (
    <div className="relative min-h-[440px] max-[1020px]:hidden">
      {/* core tile */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[168px] rounded-[26px] bg-coffee text-foam p-6 text-center shadow-lift z-[2]">
        <span className="mx-auto mb-3 w-11 h-11 rounded-full border border-ember/50 text-ember grid place-items-center"><Ico d={D.spark} size={20} /></span>
        <b className="font-display font-extrabold text-[19px] tracking-[-.02em] block">Nova</b>
        <span className="font-mono text-[9.5px] font-bold tracking-[.16em] uppercase text-foam/55">answers from the archive</span>
      </div>
      <span aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-dashed border-accent/25" />
      <span aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-dashed border-accent/14" />
      {QUESTIONS.map(([q, l, t, rot, tone]) => (
        <div key={q} className="absolute w-[215px] bg-card border border-line rounded-[16px] px-4 py-3.5 shadow-soft hover:shadow-lift transition-shadow"
          style={{ left: l, top: t, rotate: rot }}>
          <span className={`inline-block mb-1.5 font-mono text-[9.5px] font-bold tracking-[.14em] uppercase ${tone === "rust" ? "text-rust" : tone === "leaf" ? "text-leaf" : tone === "honey" ? "text-[#a97b1f]" : tone === "plum" ? "text-plum" : tone === "denim" ? "text-denim" : "text-brick"}`}>
            <Ico d={D.search} size={10} sw={2.4} /> ask nova</span>
          <b className="block font-display font-bold text-[13.5px] leading-snug text-ink">{q}</b>
        </div>
      ))}
    </div>
  );
}

/* ── hub-and-spoke capability grid (image 6) ── */
const DOERS: [string, string, string, string][] = [
  ["doc", "rust", "Draft a proposal outline", "Point Nova at a watchlist org and it assembles the structure, scope and schedule from five years of accepted projects."],
  ["book", "leaf", "Explain program rules", "Stipends, hours, eligibility and timelines for GSoC, LFX, Outreachy and GSSoC - answered from the program records, not memory."],
  ["layers", "honey", "Recommend next skills", "The exact rule packs, AGENTS.md configs and MCP servers the orgs you target actually ship with."],
  ["clock", "plum", "Flag deadline clashes", "Two applications due the same week? Nova spots the collision in your calendar before you commit to both."],
  ["chart", "denim", "Build a prep report", "One scored summary of stack fit, saved repos, watched orgs and open PRs - ready to share or keep."],
  ["users", "brick", "Find mentor contacts", "Handles and channels harvested from accepted-project records, ranked by how recently they mentored."],
];
function Hub() {
  return (
    <section className={`${W} mt-[54px]`}>
      <CenterHead pill="What Nova answers" h2={<>Turn months of digging into <Word>minutes.</Word></>}
        sub="Tell Nova your stack once. Every question you would have spread across READMEs, event pages and Discord history comes back ranked, sourced and honest about what it can't know." />
      <div className="relative mt-12">
        {/* connector spokes - desktop only */}
        <svg aria-hidden viewBox="0 0 300 240" preserveAspectRatio="none" className="absolute inset-0 w-full h-full hidden lg:block pointer-events-none">
          {[[50, 45], [150, 45], [250, 45], [50, 195], [150, 195], [250, 195]].map(([x, y]) => (
            <line key={`${x}-${y}`} x1="150" y1="120" x2={x} y2={y} stroke="var(--color-accent)" strokeOpacity=".22" strokeWidth="1" strokeDasharray="4 5" />
          ))}
        </svg>
        <div className="relative grid grid-cols-3 gap-x-6 gap-y-6 max-[1020px]:grid-cols-2 max-[640px]:grid-cols-1">
          {DOERS.slice(0, 3).map(([d, tone, b, p]) => (
            <div key={b} className="bg-card border border-line rounded-[20px] p-6 shadow-soft hover:-translate-y-1 hover:border-ember transition-all">
              <Tile d={D[d]} tone={tone} size={40} />
              <b className="block font-display font-bold text-[15.5px] mt-4 mb-1.5">{b}</b>
              <p className="text-cocoa text-[13px] leading-[1.6]">{p}</p>
            </div>
          ))}
          {/* center row: spacer / Nova core / spacer */}
          <div className="hidden lg:block" />
          <Link to="/nova" className="rounded-[22px] bg-coffee text-foam border border-bean shadow-lift grid place-items-center text-center p-7 hover:-translate-y-1 transition-transform max-lg:col-span-2">
            <span>
              <span className="mx-auto mb-3 w-12 h-12 rounded-full border border-ember/50 text-ember grid place-items-center"><Ico d={D.spark} size={22} /></span>
              <b className="font-display font-extrabold text-[20px] tracking-[-.02em] block">Nova</b>
              <span className="font-mono text-[10px] font-bold tracking-[.14em] uppercase text-foam/55 block mt-1">Ask it anything ✦</span>
            </span>
          </Link>
          <div className="hidden lg:block" />
          {DOERS.slice(3).map(([d, tone, b, p]) => (
            <div key={b} className="bg-card border border-line rounded-[20px] p-6 shadow-soft hover:-translate-y-1 hover:border-ember transition-all">
              <Tile d={D[d]} tone={tone} size={40} />
              <b className="block font-display font-bold text-[15.5px] mt-4 mb-1.5">{b}</b>
              <p className="text-cocoa text-[13px] leading-[1.6]">{p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── generic AI vs Nova split panel (image 7) ── */
const GENERIC = [
  "Answers from whatever it memorized last training run",
  "Invents repo names, star counts and application dates",
  "Forgets your stack the moment the chat resets",
  "Wants an account, an API key and a monthly bill",
];
const NOVA_SIDE = [
  "Answers ranked from the same 6,600+ project archive you browse",
  "Every number traceable to the 2026-10-02 GitHub snapshot",
  "Knows your saved board, watchlist and stated stack",
  "Deterministic matching in your browser - no key, no bill, no spam",
];
function Versus() {
  return (
    <section className={`${W} mt-[54px]`}>
      <CenterHead pill="Why it isn't a chatbot" h2={<>Not a generic <Word>chatbot.</Word></>}
        sub="A model guessing at open source will confidently name repos that don't exist. Nova takes the opposite bet: no generation, only ranking - against data you can open, click and verify." />
      <div className="relative grid grid-cols-2 gap-6 mt-12 max-[860px]:grid-cols-1">
        <div className="bg-card border border-line rounded-[24px] p-8 shadow-soft">
          <p className="font-mono text-[10.5px] font-bold tracking-[.16em] uppercase text-dim mb-6">Generic AI</p>
          <ul className="grid gap-4 list-none">
            {GENERIC.map((x) => (
              <li key={x} className="flex items-start gap-3 text-[14.5px] text-cocoa leading-snug">
                <span className="mt-1 w-[18px] h-[18px] rounded-full bg-brick/10 border border-brick/25 grid place-items-center shrink-0"><Cross /></span>{x}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[24px] p-8 shadow-lift bg-coffee text-foam border border-bean">
          <p className="font-mono text-[10.5px] font-bold tracking-[.16em] uppercase text-ember mb-6 flex items-center gap-2">
            <Ico d={D.spark} size={13} /> Nova
          </p>
          <ul className="grid gap-4 list-none">
            {NOVA_SIDE.map((x) => (
              <li key={x} className="flex items-start gap-3 text-[14.5px] text-steam leading-snug">
                <span className="mt-1 w-[18px] h-[18px] rounded-full bg-white/10 border border-white/20 grid place-items-center shrink-0"><Check className="text-[#7ee2a8]" /></span>{x}
              </li>
            ))}
          </ul>
        </div>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[46px] h-[46px] rounded-full bg-paper border border-line shadow-lift grid place-items-center font-mono text-[11px] font-bold text-cocoa z-[2] max-[860px]:hidden">vs</span>
      </div>
    </section>
  );
}

export default function NovaAI() {
  return (
    <div className="relative">
      <GridBG pos="50% 14%" />
      <div className="relative">
        <section className={`${W} pt-[64px] grid grid-cols-[1.05fr_.95fr] gap-12 items-center max-[1020px]:grid-cols-1 max-[1020px]:gap-6`}>
          <div>
            <Pill>Ask Nova</Pill>
            <h1 className="font-display font-extrabold tracking-[-.025em] leading-[1.05] text-[clamp(36px,4.8vw,58px)] mt-6 max-w-[560px]">
              Instant answers from your <Word>open-source data.</Word>
            </h1>
            <p className="text-cocoa text-[16.5px] leading-[1.7] mt-6 max-w-[520px]">
              Nova reads the full cyrus index - every skill shelf, org profile, program archive and
              hackathon deadline - and answers in the shape of a decision: which org, which skill,
              which week. Free, instant, and it never makes up a repository.
            </p>
            <div className="flex gap-2.5 flex-wrap mt-7">
              {["Skills", "Organizations", "Programs", "Deadlines", "Your stack"].map((c) => (
                <span key={c} className="bg-card border border-line rounded-full px-4 py-2 text-[12.5px] font-semibold text-ink shadow-soft">{c}</span>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap mt-9">
              <Link to="/nova" className={btn("dark", "lg")}>Ask Nova now</Link>
              <Link to="/platform/how" className={btn("outline", "lg")}>See how cyrus works</Link>
            </div>
          </div>
          <AskCards />
          {/* mobile fallback: plain question list */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            {QUESTIONS.map(([q]) => (
              <span key={q} className="bg-card border border-line rounded-[14px] px-4 py-3 text-[12.5px] font-semibold text-ink shadow-soft">{q}</span>
            ))}
          </div>
        </section>

        <Rule />
        <Hub />
        <Rule />
        <Versus />
        <Rule />

        <section className={`${W} mt-[54px] pb-6`}>
          <div className="max-w-[760px] mx-auto text-center">
            <p className="font-mono text-[10.5px] font-bold tracking-[.16em] uppercase text-dim mb-3">Straight answer</p>
            <h2 className="font-display font-extrabold tracking-[-.02em] text-[clamp(24px,3vw,34px)] leading-[1.2]">
              Nova is <Word>matching, not generation.</Word>
            </h2>
            <p className="text-cocoa text-[15.5px] leading-[1.7] mt-4">
              Under the hood it is the same deterministic recommender that powers your dashboard: tokenized
              stacks, scored against 6,682 accepted projects and 1,500-plus catalog repos, with every result
              linking straight back to the source record. No model sits between you and the data - which is
              exactly why you can trust the shortlist it hands you.
            </p>
            <div className="flex gap-3 justify-center flex-wrap mt-8">
              <Link to="/nova" className={btn("primary", "lg")}>Open Nova — free</Link>
              <Link to="/platform/features" className={btn("outline", "lg")}>All platform features</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
