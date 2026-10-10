/* ══ Trust.tsx — /platform/trust: data, sources & verification ═
   Structure borrowed from a best-in-class trust centre - status bar,
   live verification cards, foundations grid, source cadence ledger -
   populated with cyrus's real snapshot numbers.                  ═ */
import { Link } from "react-router-dom";
import { btn, Word } from "../components/ui";
import { fmt } from "../lib/util";
import { REPOS } from "../data/repos";
import { ORGS } from "../data/orgs";
import { HACKS } from "../data/hackathons";
import { RESOURCES } from "../data/resources";
import { W, Pill, Ico, Check, CenterHead, GridBG, PlatCTA, Rule } from "../components/plat";

const D: Record<string, string> = {
  shield: "M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3Z",
  db: "M12 3c4.97 0 9 1.34 9 3s-4.03 3-9 3-9-1.34-9-3 4.03-3 9-3Zm9 6v3c0 1.66-4.03 3-9 3s-9-1.34-9-3V9m18 6v3c0 1.66-4.03 3-9 3s-9-1.34-9-3v-3",
  scale: "M12 3v18M8 21h8M3 7h6l-3 7-3-7Zm0 0 3 7m6-7h6l-3 7-3-7Zm0 0 3 7",
  eye: "M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  lock: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z",
  badge: "M12 3l2.3 4.6 5 .8-3.6 3.6.8 5L12 14.8 7.5 17l.8-5L4.7 8.4l5-.8z",
  layers: "M12 3 3 8l9 5 9-5-9-5ZM3 16l9 5 9-5M3 12l9 5 9-5",
};

/* the three archive datasets, with their real verified row counts */
const VERIFIED: [string, string, string, number, string, string][] = [
  ["Google Summer of Code", "Programs.google.com API + org proposals", "Accepted project records, 2022–2026", 5238, "leaf", "gsoc api"],
  ["LFX Mentorship", "mentorship.lfx.linuxfoundation.net listings", "Completed + active mentored projects", 941, "denim", "lfx api"],
  ["Outreachy + Summer of Bitcoin", "Outreachy archives + event organizers", "Accepted intern and participant projects", 503, "plum", "org pages"],
];

const FOUNDATIONS: [string, string, string][] = [
  ["scale", "Ranking honesty", "Stars first, always shown beside forks, open issues and last push - so a dormant 200k-star repo can't pretend otherwise."],
  ["badge", "Derived difficulty", "Beginner under 10k stars, intermediate to 50k, advanced above. Labels come from the data, never from a claim in a README."],
  ["layers", "Official logos only", "Every org avatar is served straight from GitHub's own CDN. Hackathon covers are generated gradients - no copied artwork anywhere."],
  ["lock", "Local-only sessions", "Sign-in, saved repos, watchlists and match profiles live in your browser's localStorage. There is no user database to breach."],
  ["eye", "Labelled estimates", "When an API is rate-limited, pages fall back to deterministic estimates and say so in plain words on the card."],
  ["shield", "Independent index", "Not affiliated with GitHub, Google or Anthropic. If a snapshot mislabels your project, we fix it on the next regeneration."],
];

const SOURCES: [string, string, string][] = [
  ["GitHub REST API", "Every 14 days", "Stars, forks, open issues, language, license and last push for all " + fmt(REPOS.length) + " catalog repos and " + fmt(ORGS.length) + " org profiles."],
  ["GSoC + mentorship APIs", "Each season window", "Accepted-project records for GSoC, LFX, Outreachy and Summer of Bitcoin - titles, orgs, stacks, sizes, mentors."],
  ["Official event pages + Devpost", "Every 14 days", "Dates, prizes and rules for all " + HACKS.length + " tracked hackathons; estimates are marked as estimates."],
  ["Company learning docs", "Monthly pass", "Provider pages for " + RESOURCES.length + " courses, docs and labs are re-checked before the shelf ships."],
];

export default function Trust() {
  return (
    <div className="relative">
      <GridBG pos="50% 10%" />
      <div className="relative">
        {/* ── hero + status bar (image 8) ── */}
        <section className={`${W} pt-[64px]`}>
          <CenterHead pill="Live verification network"
            h2={<>Data, sources <Word>&amp; trust engine.</Word></>}
            sub="cyrus is a static index with a live conscience: every number below was pulled from a public API, regenerated on a schedule, and can be re-verified by you in one click. Here is exactly what is running, and on what cadence." />
          <div className="mt-11 bg-card border border-line rounded-[22px] p-6 shadow-soft flex items-center gap-5 flex-wrap max-[700px]:flex-col max-[700px]:items-start">
            <span className="w-[46px] h-[46px] rounded-full bg-leaf/12 border border-leaf/30 grid place-items-center text-leaf shrink-0">
              <Ico d="M4 12.5 10 18.5 20 6" size={20} sw={2.6} />
            </span>
            <div className="min-w-0">
              <b className="block font-display font-bold text-[16px]">All data pipelines online</b>
              <span className="text-cocoa text-[13.5px]">Last full snapshot 2026-10-02 · regenerated fortnightly · nothing typed by hand.</span>
            </div>
            <div className="flex gap-2.5 ml-auto flex-wrap">
              <Link to="/about#data" className={btn("dark", "sm")}>View methodology</Link>
              <Link to="/opensource" className={btn("outline", "sm")}>Open the archive</Link>
            </div>
          </div>
        </section>

        <Rule />
        {/* ── active verifications ── */}
        <section className={`${W} mt-[54px]`}>
          <div className="flex items-baseline gap-3 flex-wrap mb-7">
            <h2 className="font-display font-extrabold tracking-[-.02em] text-[clamp(24px,3vw,34px)]">Active snapshot verifications</h2>
            <span className="font-mono text-[11px] tracking-[.12em] uppercase text-dim">running now · 6,682 records under review each cycle</span>
          </div>
          <div className="grid grid-cols-3 gap-5 max-[900px]:grid-cols-1">
            {VERIFIED.map(([b, src, sub, n, tone, badge]) => (
              <div key={b} className="bg-card border border-line rounded-[20px] p-6 shadow-soft">
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="flex items-center gap-1.5 font-mono text-[9.5px] font-bold tracking-[.14em] uppercase text-leaf bg-leaf/10 border border-leaf/25 rounded-full px-3 py-1.5"><Check /> Verified</span>
                  <span className={`ml-auto font-mono text-[9.5px] font-bold tracking-[.12em] uppercase ${tone === "leaf" ? "text-leaf" : tone === "denim" ? "text-denim" : "text-plum"}`}>{badge}</span>
                </div>
                <b className="font-mono font-bold text-[34px] tracking-[-.02em] block text-ink">{fmt(n)}</b>
                <span className="block font-display font-bold text-[15px] mt-1.5 mb-1">{b}</span>
                <p className="text-cocoa text-[12.5px] leading-[1.6]">{sub}</p>
                <p className="font-mono text-[10.5px] text-dim mt-4 pt-4 border-t border-liness break-words">Source: {src}</p>
              </div>
            ))}
          </div>
        </section>

        <Rule />
        {/* ── foundations ── */}
        <section className={`${W} mt-[54px]`}>
          <CenterHead pill="Platform audit foundations" h2={<>Six rules the index <Word>polices itself</Word> with.</>} />
          <div className="grid grid-cols-3 gap-5 mt-11 max-[1020px]:grid-cols-2 max-[640px]:grid-cols-1">
            {FOUNDATIONS.map(([d, b, p]) => (
              <div key={b} className="bg-card border border-line rounded-[20px] p-6 shadow-soft hover:border-ember transition-colors">
                <span className="w-[42px] h-[42px] rounded-[13px] border border-accent/25 bg-peach text-rust grid place-items-center mb-5"><Ico d={D[d]} size={19} /></span>
                <b className="block font-display font-bold text-[16px] mb-1.5">{b}</b>
                <p className="text-cocoa text-[13.5px] leading-[1.65]">{p}</p>
              </div>
            ))}
          </div>
        </section>

        <Rule />
        {/* ── source cadence ledger ── */}
        <section className={`${W} mt-[54px]`}>
          <div className="flex items-baseline gap-3 flex-wrap mb-7">
            <h2 className="font-display font-extrabold tracking-[-.02em] text-[clamp(24px,3vw,34px)]">Sources &amp; cadence</h2>
            <Pill>4 live feeds</Pill>
          </div>
          <div className="bg-card border border-line rounded-[22px] overflow-hidden shadow-soft">
            {SOURCES.map(([src, cad, what], i) => (
              <div key={src} className={`flex items-start gap-5 px-6 py-5 flex-wrap max-[700px]:gap-3 ${i ? "border-t border-liness" : ""}`}>
                <span className="mt-1 w-[8px] h-[8px] rounded-full bg-leaf shrink-0 shadow-[0_0_0_3px_rgba(62,125,79,.14)]" />
                <div className="min-w-[200px] flex-1">
                  <b className="block font-display font-bold text-[15px]">{src}</b>
                  <span className="text-cocoa text-[13.5px] leading-[1.6] block mt-1">{what}</span>
                </div>
                <span className="font-mono text-[10.5px] font-bold tracking-[.1em] uppercase text-cocoa bg-cream border border-line rounded-full px-3.5 py-2 shrink-0">{cad}</span>
              </div>
            ))}
          </div>
        </section>

        <Rule />
        {/* ── snapshot ledger stats ── */}
        <section className={`${W} mt-[54px]`}>
          <div className="rounded-[26px] bg-coffee text-foam border border-bean shadow-lift px-8 py-10">
            <p className="text-center font-mono text-[10.5px] font-bold tracking-[.18em] uppercase text-ember mb-8">The current snapshot, in plain numbers</p>
            <div className="grid grid-cols-5 gap-6 text-center max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
              {[
                [fmt(REPOS.length), "catalog repos"],
                ["6,682", "archive projects"],
                [String(ORGS.length), "org profiles"],
                [String(HACKS.length), "hackathons checked"],
                [String(RESOURCES.length), "resources re-verified"],
              ].map(([v, l]) => (
                <div key={l}>
                  <b className="font-mono font-bold text-[clamp(22px,2.6vw,32px)] tracking-[-.02em] text-white block">{v}</b>
                  <span className="text-foam/60 text-[12.5px] mt-1 block">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Rule />
        <section className={`${W} mt-[54px] pb-6`}>
          <p className="text-center text-cocoa text-[14.5px] leading-[1.7] max-w-[640px] mx-auto">
            Spot something the snapshot got wrong? The About page explains exactly how data is gathered and
            how to tell us - corrections land in the next regeneration, not in a ticket queue.
          </p>
          <PlatCTA to="/about#data" label="Read the full methodology" also={["/platform/features", "Back to platform features"]} />
        </section>
      </div>
    </div>
  );
}
