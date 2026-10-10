/* ══ How.tsx — /platform/how: three-step method sections ═
   Step blocks in the style of a best-in-class "how it works" page -
   StepHead, behind-the-scenes checklist, "your action" band and a
   mock product panel per step - with the integrations step carrying
   real GitHub-served org logos.                                 ═ */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { btn, Word, OrgImg } from "../components/ui";
import { avatarOf } from "../lib/util";
import { W, Pill, StepHead, Behind, YourAction, MockPanel, MockRow, GridBG, PlatCTA, Rule } from "../components/plat";

const D = {
  gauge: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8.5 3.5A9.9 9.9 0 0 1 2 12C2 6.5 6.5 2 12 2s10 4.5 10 10a9.9 9.9 0 0 1-1.5 5.5",
  plug: "M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v4",
  check: "M4 12.5 10 18.5 20 6",
};

/* data sources shown as official logos in step 02 */
const SOURCES: [string, string][] = [
  ["github", "GitHub API"],
  ["google", "GSoC program API"],
  ["linuxfoundation", "LFX mentorship API"],
  ["huggingface", "HF org profiles"],
  ["vercel", "Vercel org profiles"],
  ["cloudflare", "Cloudflare org profiles"],
  ["kubernetes", "CNCF project tracks"],
  ["flutter", "Flutter / Google OSS"],
  ["pytorch", "AI-infra org signals"],
  ["openai", "OpenAI org signals"],
  ["microsoft", "Microsoft org signals"],
  ["anthropics", "Anthropic skills reg."],
];

/* ── step panels ── */
const SETUP: [string, string][] = [
  ["Programs you want", "GSoC · LFX · Outreachy · GSSoC · hackathons"],
  ["Languages you know", "tick your real working stack"],
  ["Hours per week", "sets project size and deadline load"],
  ["Target season", "which application window you're racing"],
  ["Experience level", "new · some · vet - changes the ranking"],
  ["Dream orgs", "watchlist feeds the matcher directly"],
  ["Deadline calendar", "every date lands on one dashboard"],
];
const WORKSPACE: [string, string][] = [
  ["Matched orgs", "five shortlists, scored against the archive"],
  ["Skills to install", "the rule packs and configs those orgs ship"],
  ["Issues to claim", "first-timer and good-first-issue signals per org"],
  ["Open deadlines", "sorted soonest-first, refreshed fortnightly"],
  ["Required actions", "the next single step, ticked off when done"],
];

function Step({ step, label, d, tone, h2, sub, behind, action, panel, flip }: {
  step: string; label: string; d: string; tone: string; h2: string; sub: string;
  behind: string[]; action: string; panel: ReactNode; flip?: boolean;
}) {
  return (
    <section className={`${W} mt-[54px] grid grid-cols-[1fr_1.05fr] gap-14 items-start max-[1020px]:grid-cols-1 max-[1020px]:gap-9`}>
      <div className={flip ? "lg:order-2" : ""}>
        <StepHead step={step} label={label} d={d} tone={tone} />
        <h2 className="font-display font-extrabold tracking-[-.025em] leading-[1.1] text-[clamp(26px,3.2vw,38px)]">{h2}</h2>
        <p className="text-cocoa text-[15px] leading-[1.75] mt-4">{sub}</p>
        <Behind items={behind} tone={tone} />
        <YourAction tone={tone}>{action}</YourAction>
      </div>
      <div className={`lg:sticky lg:top-[96px] ${flip ? "lg:order-1" : ""}`}>{panel}</div>
    </section>
  );
}

export default function How() {
  return (
    <div className="relative">
      <GridBG pos="50% 12%" />
      <div className="relative">
        <header className={`${W} pt-[64px] text-center`}>
          <Pill center>Platform · How it works</Pill>
          <h1 className="font-display font-extrabold tracking-[-.02em] leading-[1.05] text-[clamp(36px,4.8vw,58px)] mt-6 max-w-[760px] mx-auto">
            From empty tabs to a <Word>merged PR.</Word>
          </h1>
          <p className="text-cocoa text-[16.5px] leading-[1.7] max-w-[600px] mx-auto mt-5">
            Three steps, no ceremony. cyrus takes you from "I should ship something this season"
            to a tracked shortlist, a credible profile and a submitted application.
          </p>
          <div className="flex gap-3 justify-center flex-wrap mt-8">
            <Link to="/dashboard" className={btn("dark", "lg")}>Start step one</Link>
            <Link to="/platform/features" className={btn("outline", "lg")}>What's on the platform</Link>
          </div>
        </header>

        <Rule />

        {/* STEP 01 */}
        <Step step="01" label="Assess & configure" d={D.gauge} tone="rust"
          h2="Start with your stack."
          sub="Five fields describe every contributor: what you want to do, what you build with, how much time you have, which season you're racing, and how far in you are. cyrus turns that into a working board in under a minute - no resume upload, no onboarding call."
          behind={[
            "Builds your saved board and shelf grouping",
            "Maps your languages to the catalog's 1,500+ repos",
            "Scores every archived org against your stack",
            "Pulls the live deadline calendar for your season",
            "Establishes a readiness baseline you can beat",
          ]}
          action="Open the dashboard, pick your goal and tick your languages. Thirty seconds, and the matcher has everything it needs."
          panel={
            <MockPanel title="Setup wizard" label="Step 1 of 7 shown live on your board">
              {SETUP.map(([b, p], i) => <MockRow key={b} n={i + 1} tone="rust"><b className="block">{b}</b><span className="block text-[12px] font-medium text-dim mt-0.5">{p}</span></MockRow>)}
            </MockPanel>
          }
        />

        <Rule />

        {/* STEP 02 - mirrored */}
        <Step step="02" label="Connect your world" d={D.plug} tone="leaf" flip
          h2="Point it at the orgs you care about."
          sub="cyrus doesn't ask for tokens to private data - it reads the public web you already browse. One optional Google or GitHub sign-in personalises the board; after that, the platform is already wired to the sources that decide your season."
          behind={[
            "Read-only public data - stars, issues, program rosters",
            "Every org profile served with its official GitHub avatar",
            "Nothing you save ever leaves your browser",
          ]}
          action="Sign in with Google or GitHub if you want a greeted dashboard; follow five orgs and the mentor finder starts working."
          panel={
            <MockPanel title="Connected sources" label="Official orgs, live avatars from GitHub">
              <div className="grid grid-cols-3 gap-2.5 max-[520px]:grid-cols-2">
                {SOURCES.map(([login, label]) => (
                  <div key={login} className="flex items-center gap-2.5 bg-paper border border-line rounded-[14px] px-3 py-2.5 shadow-soft min-w-0">
                    <OrgImg src={avatarOf(login, 64)} name={login} className="w-[26px] h-[26px] rounded-[8px] object-cover bg-sand shrink-0" />
                    <span className="min-w-0">
                      <b className="block text-[12px] font-bold text-ink truncate">{login}</b>
                      <span className="block text-[10px] text-dim truncate">{label}</span>
                    </span>
                  </div>
                ))}
              </div>
            </MockPanel>
          }
        />

        <Rule />

        {/* STEP 03 */}
        <Step step="03" label="Turn a shortlist into a merged PR" d={D.check} tone="honey"
          h2="Work the board, not the tabs."
          sub="This is where seasons are actually won: five orgs on your watchlist, the exact skills their maintainers use, starter issues you can claim this week, and a checklist that ticks itself as you go. Nova answers the questions in between without ever leaving the index."
          behind={[
            "Watchlist statuses track researching › preparing › applied",
            "Mentor finder surfaces handles and live channels",
            "Proposal drafts borrow structure from 5 years of accepted projects",
            "Deadline clashes get flagged before you overcommit",
          ]}
          action="Advance one org a day. When every row on the workspace is green, hit submit - the calendar already knows when."
          panel={
            <MockPanel title="Contribution workspace" label="Your board, day 21 of the season">
              {WORKSPACE.map(([b, p], i) => <MockRow key={b} n={i + 1} tone="honey"><b className="block">{b}</b><span className="block text-[12px] font-medium text-dim mt-0.5">{p}</span></MockRow>)}
            </MockPanel>
          }
        />

        <Rule />

        <section className={`${W} mt-[54px] pb-6 text-center`}>
          <p className="text-cocoa text-[14.5px] leading-[1.7] max-w-[560px] mx-auto">
            That's the whole method - assess, connect, ship. The platform behind each step is
            documented on the features and trust pages.
          </p>
          <PlatCTA to="/platform/features" label="Explore platform features" also={["/platform/trust", "See how we verify data"]} />
        </section>
      </div>
    </div>
  );
}
