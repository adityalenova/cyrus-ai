import type { Org, Program } from "../lib/types";
import { REAL_ORGS } from "./realOrgs";

export const PROGRAMS: Program[] = [
  {
    id: "gsoc", name: "Google Summer of Code", owner: "google",
    img: "assets/prog-gsoc.jpg", url: "https://summerofcode.withgoogle.com",
    tag: "Write real code for open-source orgs, mentored full-time over the summer.",
    pay: "$1,500 – $3,300", payNote: "STIPEND",
    status: "closed", window: "Applications close April",
    orgs: "900+ orgs", slots: "~3,800 students",
    phases: [
      { label: "Org applications", s: 0, e: 1.6, c: "#3b6ea5" },
      { label: "Student applications", s: 2.1, e: 3.8, c: "#b4602c" },
      { label: "Community bonding", s: 3.8, e: 4.6, c: "#7a5aa8" },
      { label: "Coding period", s: 4.6, e: 8.2, c: "#3e7d4f" },
    ],
  },
  {
    id: "outreachy", name: "Outreachy", owner: "outreachy",
    img: "/assets/hack/covers/devpost-hack-new-year-2027.jpg", url: "https://www.outreachy.org",
    tag: "Paid remote internships in open source for people from under-represented groups.",
    pay: "$8,000 USD", payNote: "PER INTERNSHIP",
    status: "upcoming", window: "Dec cohort pairing opens Nov",
    orgs: "150+ communities", slots: "~120 interns",
    phases: [
      { label: "Outreach period", s: 10.2, e: 11.2, c: "#3b6ea5" },
      { label: "Applications", s: 1.6, e: 3.1, c: "#b4602c" },
      { label: "Internship (May cohort)", s: 4, e: 8, c: "#3e7d4f" },
      { label: "Internship (Dec cohort)", s: 11, e: 12, c: "#7a5aa8" },
    ],
  },
  {
    id: "lfx", name: "LFX Mentorship", owner: "linuxfoundation",
    img: "assets/prog-lfx.jpg", url: "https://mentorship.lfx.linuxfoundation.org",
    tag: "Cloud & ecosystem mentored projects across Linux Foundation host projects.",
    pay: "$1,500 – $3,000", payNote: "PER TERM",
    status: "live", window: "Term 3 running now · Sep – Nov",
    orgs: "100+ projects", slots: "300+ mentees",
    phases: [
      { label: "Term 1", s: 2, e: 5, c: "#3b6ea5" },
      { label: "Term 2", s: 5, e: 8, c: "#7a5aa8" },
      { label: "Term 3", s: 8.3, e: 11, c: "#3e7d4f", active: true },
    ],
  },
  {
    id: "esoc", name: "Eclipse SoC", owner: "eclipse-foundation",
    img: "assets/prog-esoc.jpg", url: "https://soc.eclipse.to",
    tag: "Summer contributions to Eclipse Foundation projects with structured mentoring.",
    pay: "€500 – €1,200", payNote: "PER PROJECT",
    status: "closed", window: "Runs May – August",
    orgs: "40+ projects", slots: "~60 contributors",
    phases: [
      { label: "Project proposals", s: 2.8, e: 4.2, c: "#3b6ea5" },
      { label: "Teams formed", s: 4.2, e: 4.9, c: "#a97b1f" },
      { label: "Coding & demos", s: 4.9, e: 7.6, c: "#3e7d4f" },
    ],
  },
  {
    id: "mlh", name: "MLH Fellowship", owner: "MLH",
    img: "assets/prog-alt-roorkee.jpg", url: "https://fellowship.mlh.io",
    tag: "A remote, batch-based alternative to internships on real open-source teams.",
    pay: "Paid tracks", payNote: "UP TO $2K/MO",
    status: "live", window: "Fall batch in session",
    orgs: "30+ partner orgs", slots: "Small cohorts",
    phases: [
      { label: "Spring batch", s: 2.5, e: 5, c: "#3b6ea5" },
      { label: "Summer batch", s: 5.3, e: 7.8, c: "#7a5aa8" },
      { label: "Fall batch", s: 8.2, e: 10.8, c: "#3e7d4f", active: true },
    ],
  },
  {
    id: "gssoc", name: "GSSoC'26", owner: "GirlScript",
    img: "assets/prog-gsoc.jpg", url: "https://gssoc.girlscript.tech",
    tag: "Three-month open-source contribution sprint, biggest women-led program in India.",
    pay: "Leaderboard prizes", payNote: "SWAG + CERTS",
    status: "live", window: "Contributions Aug – Nov",
    orgs: "200+ projects", slots: "Open to all",
    phases: [
      { label: "Registration", s: 6.3, e: 7.4, c: "#3b6ea5" },
      { label: "Contribution period", s: 7.4, e: 10.6, c: "#b4602c", active: true },
      { label: "Evaluation", s: 10.6, e: 11.2, c: "#a97b1f" },
    ],
  },
  {
    id: "kde", name: "Season of KDE", owner: "kde",
    img: "assets/prog-lfx.jpg", url: "https://season.kde.org",
    tag: "Winter mentoring program for KDE - design, code, docs, and community work.",
    pay: "€300 – €1,000", payNote: "PRIZES",
    status: "upcoming", window: "Registrations open December",
    orgs: "KDE ecosystem", slots: "Global",
    phases: [
      { label: "Ideas list", s: 9.4, e: 10.6, c: "#3b6ea5" },
      { label: "Registration", s: 11, e: 12, c: "#b4602c" },
      { label: "Mentoring", s: 0, e: 2.9, c: "#3e7d4f" },
    ],
  },
  {
    id: "sob", name: "Summer of Bitcoin", owner: "summerofbitcoin",
    img: "assets/prog-lfx.jpg", url: "https://www.summerofbitcoin.org",
    tag: "Eight mentored weeks building real Bitcoin and Lightning tech, with a stipend.",
    pay: "~$2,500 USD", payNote: "PER PROJECT",
    status: "upcoming", window: "Applications open December",
    orgs: "Bitcoin ecosystem", slots: "~50 contributors",
    phases: [
      { label: "Applications", s: 11, e: 12, c: "#3b6ea5" },
      { label: "Learning period", s: 0.5, e: 2.5, c: "#a97b1f" },
      { label: "Development", s: 4.5, e: 7.5, c: "#3e7d4f" },
    ],
  },
  {
    id: "oct", name: "Hacktoberfest", owner: "github",
    img: "/assets/hack/covers/hacktoberfest-2026.jpg", url: "https://hacktoberfest.com",
    tag: "One month of pull requests, first-timer friendly, the on-ramp for most contributors.",
    pay: "Badge + tree", payNote: "PER PARTICIPANT",
    status: "live", window: "All of October · you are here",
    orgs: "All of GitHub", slots: "Millions",
    phases: [
      { label: "Prep & first-timer issues", s: 8.3, e: 9, c: "#7a5aa8" },
      { label: "Hacktoberfest", s: 9, e: 10, c: "#3e7d4f", active: true },
    ],
  },
];

/* Popular GitHub organizations - login doubles as the official-logo source:
   https://github.com/{login}.png */
/* The directory is LIVE GitHub data - regenerated by scripts/fetch-orgs.mjs
   (gh api users/{login} + top-10 repos per org). No hand-tuned stats. */
export const ORGS: Org[] = REAL_ORGS;
