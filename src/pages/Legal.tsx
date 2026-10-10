/* ══ Legal.tsx — privacy, terms, cookies, affiliations ══════
   One honest article template; the four documents live in DOCS.
   Copy is written for what this site actually does: a static
   client-side catalog that keeps everything in localStorage.   */
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export type LegalKind = "privacy" | "terms" | "cookies" | "affiliations";

interface Sec { id: string; h: string; body: ReactNode }
interface Doc { title: string; kicker: string; updated: string; intro: string; secs: Sec[] }

const P = ({ children }: { children: ReactNode }) => (
  <p className="text-cocoa text-[14.5px] leading-[1.75]">{children}</p>
);
const UL = ({ items }: { items: ReactNode[] }) => (
  <ul className="grid gap-2 my-1">
    {items.map((it, i) => (
      <li key={i} className="flex gap-2.5 text-cocoa text-[14.5px] leading-[1.65]">
        <i className="w-[6px] h-[6px] rounded-full bg-accent shrink-0 mt-[9px]" aria-hidden />
        <span>{it}</span>
      </li>
    ))}
  </ul>
);
const C = ({ children }: { children: ReactNode }) => (
  <code className="font-mono text-[12.5px] bg-paper border border-line rounded-[6px] px-1.5 py-[2px] text-ink">{children}</code>
);

const DOCS: Record<LegalKind, Doc> = {
  privacy: {
    title: "Privacy policy",
    kicker: "Your data stays in your browser",
    updated: "Last updated: 3 October 2026",
    intro:
      "cyrus.ai is a static, client-side catalog. There is no backend, no database of users, and no analytics tracker watching you. Almost everything you do on this site - saves, theme, dashboard preferences - lives only on your device, in your browser's local storage, and only you can read it.",
    secs: [
      {
        id: "what-we-store", h: "What is stored, and where",
        body: (<>
          <P>These items are written to your browser's <C>localStorage</C> under keys prefixed <C>agenthub.*</C>. They never leave your device and clearing your browser data removes them permanently:</P>
          <UL items={[
            <>Saved projects and organizations - the stars and follows you tap on cards.</>,
            <>Your session - the display name and provider ("guest", "Email", or "Google") used to greet you on the dashboard.</>,
            <>Preferences - light or dark theme and the dashboard notification toggles.</>,
          ]} />
        </>),
      },
      {
        id: "google-sign-in", h: "If you sign in with Google",
        body: (<>
          <P>Google sign-in is optional and, when configured, runs entirely in your browser through Google Identity Services. We request your basic profile only, then read your name, email and profile-picture URL from the token Google hands us. That information is kept in your local session so the dashboard can greet you; it is not transmitted to or stored by any server we control. We do not see your Google password or any other Google data.</P>
        </>),
      },
      {
        id: "third-party-assets", h: "Third-party images and requests",
        body: (<>
          <P>Because this is a catalog of real open-source work, pages load some assets from third parties, which means your browser makes requests to them (your IP address is visible to them, as with any website visit):</P>
          <UL items={[
            <>GitHub - organization and repository avatars are fetched from GitHub's image CDN.</>,
            <>Google - the sign-in script and profile pictures, only if you use Google sign-in.</>,
            <>Outbound links - hackathon and resource cards link to organizers' and publishers' own sites; their privacy practices are theirs, not ours.</>,
          ]} />
        </>),
      },
      {
        id: "no-tracking", h: "What we do not do",
        body: (<>
          <P>No advertising networks, no analytics scripts, no heatmaps, no session recording, no email collection beyond what you type into the local sign-up form (which is not sent anywhere), and no sale or sharing of personal data. There simply is no personal data on our side to share.</P>
        </>),
      },
      {
        id: "children", h: "Children",
        body: (<P>The site is a general developer resource and is not directed at children under 13. If you believe a child's data reached us through some unexpected path, contact us and we will remove it.</P>),
      },
      {
        id: "changes", h: "Changes to this policy",
        body: (<>
          <P>If the site ever grows a real backend or accounts system, this page will be rewritten and dated before any such feature goes live. For questions, reach out through the links at the bottom of this page or open an issue on the project's GitHub.</P>
        </>),
      },
    ],
  },
  terms: {
    title: "Terms of service",
    kicker: "The simple deal",
    updated: "Last updated: 3 October 2026",
    intro:
      "These terms cover your use of cyrus.ai and its content. Plain summary: the site is free to use, the catalog data belongs to its original sources under their own licenses, and we provide it as-is without warranties.",
    secs: [
      {
        id: "acceptance", h: "Accepting these terms",
        body: (<P>By browsing cyrus.ai you agree to these terms. If you do not agree, please stop using the site - no account or sign-in is required to view the catalog, so there is nothing to cancel.</P>),
      },
      {
        id: "the-catalog", h: "The catalog and its data",
        body: (<>
          <P>cyrus.ai lists public repositories, learning resources and hackathons assembled from public sources. Star counts and metadata are frozen in a snapshot dated 2 October 2026 and are refreshed periodically; always check the upstream source for live numbers.</P>
          <UL items={[
            <>Every listed repository remains under its own open-source license. Listing here does not change those terms - read the license at the source before using the code.</>,
            <>Repository descriptions may be quoted from GitHub exactly as their authors wrote them.</>,
            <>Hackathon listings are informational summaries; the organizer's official site is always authoritative for rules, eligibility and deadlines.</>,
            <>Program and organization names, logos and marks belong to their respective owners and are used for identification only (see the <Link to="/affiliations" className="text-accent font-semibold hover:underline">affiliations page</Link>).</>,
          ]} />
        </>),
      },
      {
        id: "acceptable-use", h: "Acceptable use",
        body: (<>
          <P>Use the site to discover and evaluate developer resources. You agree not to:</P>
          <UL items={[
            <>Scrape or bulk-redistribute the catalog in ways that misrepresent its source or date.</>,
            <>Use the sign-up forms to impersonate others or submit content you have no rights to.</>,
            <>Attempt to disrupt, reverse-engineer for rehosting, or abuse the site or its upstream services.</>,
          ]} />
        </>),
      },
      {
        id: "your-saves", h: "Your saves and session",
        body: (<P>Saved projects, followed organizations, preferences and guest sessions are stored only in your browser (see the <Link to="/privacy" className="text-accent font-semibold hover:underline">privacy policy</Link>). You can remove any of them with the controls on the dashboard; clearing browser data removes the rest. We cannot recover them for you, and you are responsible for the content of your local session.</P>),
      },
      {
        id: "no-warranty", h: "No warranty",
        body: (<P>The site and its data are provided "as is" and "as available", without warranties of any kind, express or implied, including accuracy of listings, fitness for a particular purpose, and uninterrupted availability. Catalog entries are curated snapshots, not verified endorsements of the software or events they describe.</P>),
      },
      {
        id: "liability", h: "Limitation of liability",
        body: (<P>To the maximum extent permitted by law, the people behind cyrus.ai are not liable for damages arising from use of the site or reliance on its listings - including anything you install, deploy, or travel to a hackathon because of. Decisions about third-party code and events stay with you.</P>),
      },
      {
        id: "changes-terms", h: "Changes and governing law",
        body: (<P>We will update this page for material changes; the "last updated" date at the top is the effective version. Continued use after an update means acceptance. These terms are governed by the laws of India, with the courts of Hyderabad, Telangana having jurisdiction. Questions: raise them through the project's GitHub.</P>),
      },
    ],
  },
  cookies: {
    title: "Cookie policy",
    kicker: "Short page, because there is little to say",
    updated: "Last updated: 3 October 2026",
    intro:
      "cyrus.ai does not use cookies. Not strictly-necessary ones, not analytics ones, not advertising ones. There is no consent banner because there is nothing to consent to.",
    secs: [
      {
        id: "local-storage", h: "What we use instead: localStorage",
        body: (<>
          <P>Your experience is persisted with the browser's <C>localStorage</C> API, under keys prefixed <C>agenthub.*</C>. The difference matters: these values are sent to no server automatically, cannot be read cross-domain, and are deleted the moment you clear site data.</P>
          <UL items={[
            <>Saved projects and followed organizations.</>,
            <>Your lightweight session (display name and sign-in provider).</>,
            <>Theme and dashboard notification preferences.</>,
          ]} />
        </>),
      },
      {
        id: "third-party-storage", h: "Third-party storage",
        body: (<P>If you sign in with Google, Google Identity Services may use its own storage mechanisms on google.com's domain while the sign-in window is open. That storage is governed by Google's privacy policy, not ours, and the only data we keep from it is your name, email and profile-picture URL in your local session.</P>),
      },
      {
        id: "manage-data", h: "Managing or deleting your data",
        body: (<P>Everything is one action away: open your browser's site settings for this domain and clear storage, or use the remove buttons on the dashboard for individual saves. No request to us is needed - we hold nothing server-side.</P>),
      },
      {
        id: "future", h: "If this ever changes",
        body: (<P>If a future version of the site introduces cookies or tracking technologies, this page will be rewritten first, and a proper consent mechanism will go live with it. Until then: no cookies, no tracking, no banner.</P>),
      },
    ],
  },
  affiliations: {
    title: "Affiliations & endorsements",
    kicker: "Who we are - and who we are not",
    updated: "Last updated: 3 October 2026",
    intro:
      "cyrus.ai is an independent catalog built by a developer in Hyderabad. It lists many well-known companies, foundations and programs. This page makes the relationship - or the lack of one - completely clear.",
    secs: [
      {
        id: "independent", h: "We are independent",
        body: (<>
          <P>cyrus.ai is <b className="text-ink">not</b> owned, operated, sponsored, endorsed, or otherwise affiliated with any of the organizations, companies, or programs listed on the site, except where explicitly stated. Nothing here is official documentation from GitHub, Google, NASA, or any hackathon organizer.</P>
        </>),
      },
      {
        id: "trademarks", h: "Names, logos and trademarks",
        body: (<>
          <P>Company and project names, logos and marks appear for identification and commentary only - the standard nominative use of a directory. All trademarks belong to their respective owners. Organization avatars are fetched from GitHub as public identifiers of those organizations.</P>
          <UL items={[
            <>Hackathon cover imagery in this catalog is drawn from public-domain NASA imagery of Earth and space.</>,
            <>Repository and program listings quote names exactly as their owners publish them.</>,
          ]} />
        </>),
      },
      {
        id: "endorsement", h: "Listings are not endorsements",
        body: (<P>Inclusion means we found an entry interesting or popular in the open-source ecosystem - it is not a recommendation, a vetting, or a guarantee. A repository listed here may be unmaintained, and a hackathon's terms may change after our snapshot. Always verify on the official source before you install code or register for an event.</P>),
      },
      {
        id: "commercial", h: "No paid placements, no affiliate links",
        body: (<>
          <P>As of the date above:</P>
          <UL items={[
            <>No listing on cyrus.ai has been sold, sponsored, or paid for. Rankings are computed from public signals like GitHub stars.</>,
            <>There are no affiliate or referral links anywhere on the site. Outbound links go directly to the source.</>,
            <>If commercial placements are ever introduced, they will be visibly labelled and this page will say so before any such link goes live.</>,
          ]} />
        </>),
      },
      {
        id: "takedowns", h: "Are we describing your project wrong?",
        body: (<P>If you maintain a listed project, program or event and something here is inaccurate, out of date, or you would prefer not to appear in the catalog, contact us through the project's GitHub and we will fix or remove it. Accuracy beats coverage.</P>),
      },
    ],
  },
};

const W = "max-w-[1240px] mx-auto px-6";

export default function Legal({ kind }: { kind: LegalKind }) {
  const doc = DOCS[kind];
  return (
    <div className={W}>
      <article className="max-w-[820px] mx-auto pt-14 pb-8">
        <p className="font-mono text-[10.5px] tracking-[.14em] uppercase text-dim mb-4">Legal</p>
        <h1 className="font-display font-extrabold text-[clamp(30px,4.4vw,44px)] tracking-[-.02em] leading-[1.08]">
          {doc.title}.
        </h1>
        <p className="text-cocoa text-[16px] leading-[1.7] mt-4">
          <b className="text-ink font-semibold">{doc.kicker}</b> - {doc.intro}
        </p>
        <p className="font-mono text-[11px] text-dim mt-4">{doc.updated}</p>

        {/* contents rail */}
        <nav aria-label="Sections" className="mt-8 bg-card border border-line rounded-[18px] p-5 shadow-soft">
          <p className="font-mono text-[10px] tracking-[.14em] uppercase text-dim mb-3">In this document</p>
          <ol className="flex flex-wrap gap-x-5 gap-y-2 list-none m-0 p-0">
            {doc.secs.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-[13.5px] font-semibold text-cocoa hover:text-accent transition-colors">
                  <span className="font-mono text-[10.5px] text-dim mr-1.5">{String(i + 1).padStart(2, "0")}</span>{s.h}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {doc.secs.map((s) => (
          <section key={s.id} id={s.id} className="mt-10 pt-9 border-t border-liness first-of-type:border-t-0 scroll-mt-24">
            <h2 className="panel-h-lg tracking-[-.02em] mb-4">{s.h}</h2>
            <div className="grid gap-4">{s.body}</div>
          </section>
        ))}

        <div className="mt-12 bg-card border border-line rounded-[20px] p-6 shadow-soft flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[240px]">
            <h3 className="panel-h mb-1.5">Other documents</h3>
            <p className="text-cocoa text-[13.5px]">The full legal set for cyrus.ai, all written for what the site actually does.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {(Object.keys(DOCS) as LegalKind[]).filter((k) => k !== kind).map((k) => (
              <Link key={k} to={`/${k}`}
                className="inline-flex items-center gap-1.5 bg-paper border border-line rounded-full px-4 py-2 text-[13px] font-semibold text-ink hover:border-accent hover:-translate-y-px transition-all">
                {DOCS[k].title}<span aria-hidden className="text-dim"></span>
              </Link>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
