/* ══ Dashboard.tsx — greeting, saved repos/orgs, matcher, watchlist, mentors, deadlines ══ */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { REPOS } from "../data/repos";
import { HACKS } from "../data/hackathons";
import { RESOURCES } from "../data/resources";
import { ORGS } from "../data/orgs";
import { REAL_STATS } from "../data/realOrgs";
import { orgByLogin, repoById, avatarOf, fmt, rnd, CAT_META } from "../lib/util";
import { useStore } from "../lib/store";
import { useStored } from "../lib/util";
import { googleConfigured, promptGoogle } from "../lib/google";
import { Avatar, btn, Chip, OrgImg, Word } from "../components/ui";

const W = "max-w-[1240px] mx-auto px-6";

/* ── svg icon set (no glyph symbols in the UI) ─────────────── */
const SW = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Ic = ({ d, size = 17, filled }: { d: string; size?: number; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    {filled
      ? <path d={d} fill="currentColor" stroke="none" />
      : <path d={d} {...SW} />}
  </svg>
);
const D = {
  grid: "M4 5.5h6.5V12H4zM13.5 5.5H20V10h-6.5zM13.5 13H20v5.5h-6.5zM4 15h6.5v3.5H4z",
  star: "M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3z",
  building: "M4 21V6.5L11 3.5V21M11 21h9V10l-9-2.8M7 9.5v.1M7 13v.1M7 16.5v.1M15 13v.1M15 16.5v.1",
  pulse: "M3 12h4l2.5-7 4 14L16 12h5",
  spark: "M12 4l1.7 4.9L18.6 10l-4.9 1.7L12 16.6l-1.7-4.9L5.4 10l4.9-1.4L12 4z",
  code: "M8.5 8L3.5 13l5 5M15.5 8l5 5-5 5M13.5 4.5l-3 17",
  plus: "M12 5v14M5 12h14",
  x: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  bookmark: "M7 4h10a1 1 0 0 1 1 1v15l-6-3.6L6 20V5a1 1 0 0 1 1-1z",
};
const IC_STAR = <Ic d={D.star} filled />;
const IC_STAR_SM = <Ic d={D.star} size={14} filled />;
const IC_X = <Ic d={D.x} size={13} />;
const IC_FLAG = <Ic d="M5 21V4l13 3.5L5 11" size={16} />;
const IC_BOOK = <Ic d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 5.5v15" size={16} />;
const IC_USER = <Ic d="M9 11.5a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4zM3 20.5c.7-3.1 3-5 6-5s5.3 1.9 6 5M16.2 5.2a3.2 3.2 0 0 1 0 6.1M18.5 15.8c1.9.8 3.1 2.4 3.6 4.7" size={15} />;
const IC_SCALE = <Ic d="M12 4v16M6 8h12M7 8l-3 5.5h6L7 8zM17 8l-3 5.5h6L17 8z" size={15} />;
const IC_TARGET = <Ic d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" size={15} />;
const IC_EYE = <Ic d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6z" size={15} />;

/* ── program-archive rows for matcher / mentors / compare ──── */
interface ARow { y: number; u: string; t: string; o: string; s: string; tt: string[]; tp: string[]; b: string; m: string; url?: string; program?: string }
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const YEARS_AGO = Math.max(1, Math.round((Date.now() - +new Date("2026-04-20")) / 864e5 / 7));

/* skill vocabulary we can honestly match against org tech tags */
const SKILL_WORDS = ["python", "javascript", "typescript", "react", "vue", "svelte", "angular", "node", "golang", "go", "rust", "java", "kotlin", "swift", "c++", "c#", "ruby", "php", "django", "flask", "fastapi", "next", "tailwind", "sql", "postgres", "mongodb", "redis", "graphql", "machine learning", "deep learning", "nlp", "computer vision", "llm", "ai", "data science", "devops", "kubernetes", "docker", "cloud", "aws", "android", "ios", "flutter", "security", "web", "frontend", "backend", "full stack", "embedded", "blockchain", "bitcoin", "cli", "testing", "documentation", "design", "ux", "wasm", "api", "ml", "numpy", "pytorch", "tensorflow", "linux", "networking", "database", "compiler", "game", "graphics", "science", "education", "accessibility"];
function extractSkills(text: string): string[] {
  const low = " " + text.toLowerCase().replace(/[^a-z0-9+#. -]/g, " ") + " ";
  const found = SKILL_WORDS.filter((w) => low.includes(w));
  const out: string[] = [];
  for (const f of found) if (!out.some((k) => k.includes(f) || f.includes(k))) out.push(f);
  return out.slice(0, 18);
}

const daysTo = (iso: string) => Math.ceil((+new Date(iso) - Date.now()) / 864e5);
const greet = () => {
  const h = new Date().getHours();
  return h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 22 ? "Good evening" : "Late session";
};
const dueTone = (d: number) => (d <= 7 ? "text-brick border-brick/30 bg-brick/8" : d <= 14 ? "text-honey border-honey/30 bg-honey/8" : "text-leaf border-leaf/30 bg-leaf/8");

const DUELS = [
  ["Reviewed 3 candidate skills before your last PR", "2h ago"],
  ["Ran the palette search across the catalog", "yesterday"],
  ["Compared forks vs open issues on two MCP servers", "2 days ago"],
  ["Opened the hackathon calendar for Q4 deadlines", "4 days ago"],
  ["Saved your first repo from the Agent Skills shelf", "last week"],
];

function Ring({ pct }: { pct: number }) {
  const R = 18, C = 2 * Math.PI * R;
  return (
    <span className="relative ml-auto w-11 h-11 shrink-0 grid place-items-center">
      <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
        <circle cx="22" cy="22" r={R} fill="none" strokeWidth="4" stroke="var(--color-roast)" />
        <circle cx="22" cy="22" r={R} fill="none" strokeWidth="4" strokeLinecap="round" stroke="var(--color-ember)"
          strokeDasharray={`${(pct / 100) * C} ${C}`} />
      </svg>
      <em className="absolute inset-0 grid place-items-center font-mono text-[10px] not-italic font-bold text-ember">{pct}%</em>
    </span>
  );
}

function Toggle({ on, flip }: { on: boolean; flip: () => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={flip}
      className={`relative w-[38px] h-[22px] rounded-full shrink-0 transition-colors cursor-pointer ${on ? "bg-accent" : "bg-roast"}`}>
      <span className={`absolute top-[3px] w-4 h-4 rounded-full transition-all duration-200 ease-silk ${on ? "left-[19px] bg-white" : "left-[3px] bg-steam"}`} />
    </button>
  );
}

export default function Dashboard() {
  const { user, signIn, setAuthOpen, saved, toggleSaved, savedOrgs, toggleSavedOrg, toast } = useStore();
  const nav = useNavigate();
  const [prefs, setPrefs] = useStored("agenthub.prefs", { digest: true, windows: true, mentions: false });
  const [gBusy, setGBusy] = useState(false);

  /* matcher profile - GitHub handle + skills parsed from typed list or resume */
  type Profile = { gh: string; skills: string[]; resume: string; done: boolean };
  const [prof, setProf] = useStored<Profile>("cyrus.matcher", { gh: "", skills: [], resume: "", done: false });
  const [ghIn, setGhIn] = useState(prof.gh);
  const [skillsIn, setSkillsIn] = useState(prof.skills.join(", "));
  const [fileNote, setFileNote] = useState("");

  /* watchlist - orgs with a status and a note */
  type Watch = { org: string; status: "researching" | "preparing" | "applied"; note: string };
  const [watch, setWatch] = useStored<Watch[]>("cyrus.watchlist", []);
  const STATUS_CYCLE = ["researching", "preparing", "applied"] as const;
  const STATUS_CLS = { researching: "text-cocoa border-line bg-cream", preparing: "text-honey border-honey/40 bg-honey/10", applied: "text-leaf border-leaf/40 bg-leaf/10" };

  /* org compare picker */
  const [cmpQ, setCmpQ] = useState("");
  const [cmpIds, setCmpIds] = useStored<string[]>("cyrus.compare", []);

  /* program archive, same runtime JSON the Projects page streams */
  const [archive, setArchive] = useState<ARow[]>([]);
  useEffect(() => {
    let go = true;
    const read = (url: string, program: string) =>
      fetch(url).then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => {
        if (!go || !Array.isArray(d?.projects)) return;
        setArchive((a) => [...a, ...d.projects.map((p: ARow) => ({ ...p, program: p.program ?? program }))]);
      }).catch(() => { /* file may not exist yet */ });
    read("/data/gsoc-projects.json", "GSoC");
    read("/data/otherProjects.json", "LFX");
    return () => { go = false; };
  }, []);

  const parseResume = async (f: File | null) => {
    if (!f) return;
    let text = "";
    if (/^text\/|^application\/(json|pdf)/.test(f.type) || /\.(md|txt|json|csv|pdf)$/i.test(f.name)) {
      try {
        text = await f.text();
        if (f.name.toLowerCase().endsWith(".pdf") || text.includes("%PDF")) {
          /* lightweight PDF text harvest - good enough for skill keywords */
          text = text.replace(/[^\x20-\x7E]/g, " ").match(/\(([^()]{2,40})\)/g)?.map((s) => s.slice(1, -1)).join(" ") ?? text;
        }
      } catch { text = ""; }
    }
    const found = extractSkills(text);
    if (found.length) {
      setSkillsIn((s) => [...new Set([...(s ? s.split(",").map((x) => x.trim()) : []), ...found])].filter(Boolean).join(", "));
      setFileNote(`Read ${f.name} - picked up ${found.length} skill keyword${found.length === 1 ? "" : "s"}.`);
    } else setFileNote(`${f.name} loaded, but no known skills detected - type a few below.`);
  };

  const runMatch = () => {
    const skills = extractSkills(skillsIn);
    if (!skills.length && !ghIn.trim()) { toast("Add a GitHub username or some skills first."); return; }
    setProf({ gh: ghIn.trim().replace(/^@/, ""), skills, resume: "", done: true });
    toast(`Profile saved - matched against ${fmt(archive.length || 5238)} archived projects.`);
  };


  const googleIn = async () => {
    if (!googleConfigured()) { setAuthOpen(true); return; }
    setGBusy(true);
    try {
      const g = await promptGoogle();
      signIn({ name: g.name, provider: "Google", email: g.email, picture: g.picture });
      toast(`Welcome, ${g.name.split(" ")[0]} - signed in with Google.`);
      nav("/dashboard");
    } catch (e) {
      toast(((e as Error).message || "").includes("popup") ? (e as Error).message : "Google sign-in didn't complete - try again.");
    } finally {
      setGBusy(false);
    }
  };

  const savedRepos = useMemo(() => saved.map(repoById).filter(Boolean), [saved]);
  const orgList = useMemo(() => savedOrgs.map(orgByLogin).filter(Boolean), [savedOrgs]);
  const stars = savedRepos.reduce((s, r) => s + (r?.stars ?? 0), 0);
  const langs = useMemo(() => [...new Set(savedRepos.map((r) => r!.lang))], [savedRepos]);
  const skills = useMemo(() => [...new Set(savedRepos.flatMap((r) => r!.tags.slice(0, 2)))].slice(0, 12), [savedRepos]);
  const pct = Math.min(100, 20 + saved.length * 8 + savedOrgs.length * 10);

  /* live deadlines: anything still accepting entries, soonest first */
  const due = useMemo(() => HACKS
    .filter((h) => (h.status === "open" || h.status === "rolling") && daysTo(h.deadline) >= 0)
    .sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline)).slice(0, 4), []);

  /* three resources that feed the stack you actually saved */
  const picks = useMemo(() => {
    const tags = new Set(savedRepos.flatMap((r) => r!.tags));
    const matched = RESOURCES.filter((x) => x.tags.some((t) => tags.has(t)));
    return (matched.length ? matched : RESOURCES.filter((x) => x.free && x.level === "Beginner")).slice(0, 3);
  }, [savedRepos]);

  const acts = useMemo(() => {
    const mine = saved.slice(0, 5).map((id, i) => [
      `Saved <b>${id.split("/")[1]}</b> from the ${CAT_META[repoById(id)?.cat ?? "tools"]?.label ?? "community"} shelf`,
      ["just now", "1h ago", "3h ago", "yesterday", "2 days ago"][i % 5],
    ] as [string, string]);
    return [...mine, ...DUELS.slice(mine.length ? 1 : 0)];
  }, [saved]);

  /* ── personalised org matcher: score the archive + directory against the profile ── */
  const profileSkills = useMemo(() => [...new Set([...prof.skills, ...skills.map((s) => s.toLowerCase())])], [prof.skills, skills]);
  const recs = useMemo(() => {
    if (!prof.done && !profileSkills.length) return [];
    const byOrg = new Map<string, { hits: number; total: number; techs: Set<string>; years: Set<number> }>();
    for (const p of archive) {
      const e = byOrg.get(p.o) ?? { hits: 0, total: 0, techs: new Set<string>(), years: new Set<number>() };
      e.total++;
      e.years.add(p.y);
      for (const t of (p.tt ?? []).slice(0, 4)) {
        e.techs.add(t);
        const lt = t.toLowerCase();
        if (profileSkills.some((s) => lt.includes(s) || s.includes(lt))) e.hits++;
      }
      byOrg.set(p.o, e);
    }
    const dirBonus = new Map<string, number>();
    for (const o of ORGS) {
      const meta = [...o.tags, ...o.login.split("-")];
      dirBonus.set(norm(o.name), profileSkills.filter((s) => meta.some((m) => m.toLowerCase().includes(s) || s.includes(m.toLowerCase()))).length);
    }
    type Rec = { name: string; login?: string; hits: number; projects: number; years: number; techs: string[]; score: number };
    const list: Rec[] = [];
    for (const [name, e] of byOrg) {
      const extra = dirBonus.get(norm(name)) ?? 0;
      if (!e.hits && !extra) continue;
      list.push({
        name, login: e.hits || extra ? ORGS.find((o) => norm(o.name) === norm(name))?.login : undefined,
        hits: e.hits + extra, projects: e.total, years: e.years.size,
        techs: [...e.techs].slice(0, 4),
        score: Math.min(97, 34 + (e.hits + extra) * 6 + e.years.size * 2),
      });
    }
    return list.sort((a, b) => b.score - a.score || b.projects - a.projects).slice(0, 6);
  }, [archive, prof.done, profileSkills]);

  /* ── mentor finder: handles harvested offline from the archive ── */
  const watchNames = useMemo(() => [...new Set([
    ...watch.map((w) => norm(w.org)), ...savedOrgs.map((l) => norm(orgByLogin(l)?.name ?? l)),
  ])], [watch, savedOrgs]);
  const mentors = useMemo(() => {
    if (!archive.length) return [];
    const pool = archive.filter((p) => p.m && (watchNames.length === 0 || watchNames.some((n) => norm(p.o).includes(n) || n.includes(norm(p.o)))));
    const seen = new Set<string>();
    const out: { name: string; org: string; channel: string; projects: number }[] = [];
    const CH = ["Org Slack / Gitter", "Mailing list", "GitHub discussions", "Community calls"];
    for (const p of pool) {
      const key = norm(p.m);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ name: p.m, org: p.o, channel: CH[Math.floor(rnd(p.m, 3) * CH.length)], projects: 1 });
      if (out.length >= 10) break;
    }
    return out;
  }, [archive, watchNames]);

  /* ── compare organisations ── */
  const cmpOrgs = useMemo(() => cmpIds.map((id) => ORGS.find((o) => o.login === id)).filter(Boolean), [cmpIds]);
  const cmpRows = useMemo(() => cmpOrgs.map((o) => {
    const nName = norm(o!.name);
    const ps = archive.filter((p) => { const n = norm(p.o); return n === nName || (nName.length >= 5 && (n.includes(nName) || nName.includes(n))); });
    const techFreq = ps.reduce<Record<string, number>>((acc, p) => { (p.tt ?? []).slice(0, 2).forEach((t) => { acc[t] = (acc[t] ?? 0) + 1; }); return acc; }, {});
    const topTech = Object.entries(techFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? o!.tags[0];
    return { o: o!, projects: ps.length, years: new Set(ps.map((p) => p.y)).size, topTech,
      tier: ps.length >= 150 ? "Tier 1" : ps.length >= 40 ? "Tier 2" : ps.length ? "Tier 3" : "-", followers: REAL_STATS[o!.login]?.followers ?? 0 };
  }), [cmpOrgs, archive]);
  const cmpMatches = useMemo(() => {
    const q = cmpQ.trim().toLowerCase();
    if (!q) return [];
    return ORGS.filter((o) => !cmpIds.includes(o.login) && (o.login.includes(q) || o.name.toLowerCase().includes(q))).slice(0, 6);
  }, [cmpQ, cmpIds]);

  const addWatch = (org: string) => {
    if (watch.some((w) => w.org === org)) { toast(`${org} is already on your watchlist`); return; }
    setWatch([...watch, { org, status: "researching", note: "" }]);
    toast(`Watching ${org} - it now feeds your mentor finder`);
  };


  if (!user) {
    return (
      <div className={`${W} py-24 text-center`}>
        <p className="font-mono text-[10.5px] tracking-[.14em] uppercase text-dim mb-4">Dashboard</p>
        <h1 className="font-display font-extrabold text-[clamp(28px,4vw,42px)] tracking-[-.02em] mb-3">
          Your board is <Word>empty</Word> until you sign in.
        </h1>
        <p className="text-cocoa max-w-[440px] mx-auto text-[15.5px] leading-[1.65] mb-8">
          Saved repos, followed orgs, live hackathon deadlines and a reading list tuned to your stack - all behind one free sign-in.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button className={btn("primary", "lg")} onClick={googleIn} disabled={gBusy}>
            {gBusy ? "Opening Google..." : "Continue with Google"}
          </button>
          <button className={btn("outline", "lg")} onClick={() => setAuthOpen(true)}>Use email instead</button>
        </div>
        <p className="font-mono text-[10.5px] text-dim mt-5">
          {googleConfigured() ? "Google sign-in is live" : "demo mode - set VITE_GOOGLE_CLIENT_ID to enable real Google sign-in"}
        </p>
      </div>
    );
  }

  const menu: [React.ReactNode, string, string, string][] = [
    [<Ic key="g" d={D.grid} size={15} />, "Overview", "#overview", ""],
    [IC_STAR, "Saved projects", "#saved", String(saved.length)],
    [<Ic key="b" d={D.building} size={15} />, "Saved organizations", "#orgs", String(savedOrgs.length)],
    [IC_TARGET, "Org matcher", "#matcher", String(prof.done ? recs.length : "")],
    [IC_EYE, "Watchlist", "#watchlist", String(watch.length)],
    [IC_USER, "Mentor finder", "#mentors", String(mentors.length)],
    [IC_SCALE, "Compare orgs", "#compare", String(cmpOrgs.length)],
    [IC_FLAG, "Deadlines ahead", "#deadlines", String(due.length)],
    [<Ic key="p" d={D.pulse} size={15} />, "Activity", "#activity", ""],
  ];

  const stats: [React.ReactNode, string, string][] = [
    [IC_STAR, String(savedRepos.length), "projects saved"],
    [<Ic key="b" d={D.building} size={15} />, String(orgList.length), "organizations followed"],
    [<Ic key="s" d={D.spark} size={15} />, fmt(stars) || "0", "combined stars on your board"],
    [<Ic key="c" d={D.code} size={15} />, String(langs.length), "languages across your stack"],
  ];

  return (
    <div className={`${W} pt-8 pb-6 grid grid-cols-[290px_1fr] gap-6 items-start max-[980px]:grid-cols-1`}>
      {/* ── dark sidebar ── */}
      <aside className="sticky top-[86px] max-[980px]:static bg-coffee border border-bean rounded-[24px] p-6 text-foam">
        <div className="flex items-center gap-3.5 pb-[18px] border-b border-bean">
          <Avatar name={user.name} size={48} src={user.picture} />
          <div className="min-w-0">
            <b className="block font-display text-[15px] text-white truncate">{user.name}</b>
            {user.email
              ? <span className="block text-[11.5px] text-steam truncate">{user.email}</span>
              : <span className="text-[11.5px] text-steam">{user.provider === "guest" ? "Guest session" : `Signed in with ${user.provider}`}</span>}
          </div>
          <Ring pct={pct} />
        </div>

        <nav className="grid gap-[3px] py-3.5">
          {menu.map(([ic, l, href, cnt]) => (
            <a key={l} href={href}
              className="flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold text-steam transition-colors hover:bg-bean hover:text-foam">
              <span className="w-4 text-center shrink-0">{ic}</span>{l}
              {cnt && <span className="ml-auto font-mono text-[10.5px] opacity-75">{cnt}</span>}
            </a>
          ))}
        </nav>

        <div className="border-t border-bean pt-3.5 grid gap-1">
          <p className="font-mono text-[9.5px] tracking-[.14em] uppercase text-dimdk px-3.5 pb-2">Notifications</p>
          {([
            ["Weekly digest", "digest"],
            ["Hackathon deadlines", "windows"],
            ["Mentions & replies", "mentions"],
          ] as const).map(([l, k]) => (
            <div key={k} className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-steam">
              <span className="flex-1">{l}</span>
              <Toggle on={prefs[k]} flip={() => setPrefs({ ...prefs, [k]: !prefs[k] })} />
            </div>
          ))}
        </div>

        <div className="border-t border-bean mt-3.5 pt-3.5 grid gap-1">
          <Link to="/nova" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-bold text-white bg-accent/85 hover:bg-accent transition-colors"><Ic d={D.spark} size={15} /> Ask nova.ai</Link>
          <Link to="/projects" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold text-steam hover:bg-bean hover:text-foam"><Ic d={D.plus} size={15} /> Find something to save</Link>
          <Link to="/organizations" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold text-steam hover:bg-bean hover:text-foam"><Ic d={D.building} size={15} /> Pick an organization</Link>
        </div>
      </aside>

      {/* ── main ── */}
      <main className="grid gap-5 min-w-0">
        <section className="bg-card border border-line rounded-[22px] p-6 shadow-soft flex items-center gap-5 flex-wrap">
          <div className="min-w-0">
            <h2 className="font-display font-extrabold tracking-[-.02em] text-[clamp(22px,2.6vw,30px)]">
              {greet()}, {user.name.split(" ")[0]}<span className="text-accent">.</span>
            </h2>
            <p className="text-cocoa text-[14px] mt-1.5">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              {" · "}{due.length ? `${due.length} deadline${due.length > 1 ? "s" : ""} coming up` : "no live deadlines right now"}
              {" · "}{saved.length + savedOrgs.length} saved item{saved.length + savedOrgs.length === 1 ? "" : "s"} on the board
            </p>
          </div>
          <div className="ml-auto flex gap-2.5 flex-wrap">
            <Link to="/hackathons" className={btn("outline", "sm")}>Hackathon calendar</Link>
            <Link to="/resources" className={btn("outline", "sm")}>Resource shelf</Link>
          </div>
        </section>

        <section id="overview" className="grid grid-cols-4 gap-3.5 scroll-mt-24 max-[900px]:grid-cols-2">
          {stats.map(([ic, v, l]) => (
            <div key={l} className="bg-card border border-line rounded-[18px] p-5 shadow-soft">
              <span className="w-[34px] h-[34px] rounded-[10px] grid place-items-center mb-3 bg-peach text-rust block">{ic}</span>
              <b className="block font-display text-[28px] font-extrabold tracking-[-.02em]">{v}</b>
              <span className="text-cocoa text-[12.5px]">{l}</span>
            </div>
          ))}
        </section>

        <section id="saved" className="bg-card border border-line rounded-[22px] p-6 shadow-soft scroll-mt-24">
          <h3 className="panel-h-lg mb-4 flex items-center gap-2.5">
            {IC_STAR_SM} Saved projects <Link to="/projects" className="go ml-auto text-dim text-[13px] font-medium hover:text-accent">browse more →</Link>
          </h3>
          {savedRepos.length ? savedRepos.map((r) => {
            const prog = Math.round(20 + rnd(r!.repo + user.name, 3) * 70);
            return (
              <div key={r!.repo} className="flex items-center gap-3.5 py-3.5 border-b border-liness last:border-0 last:pb-0">
                <OrgImg src={avatarOf(r!.repo.split("/")[0], 76)} name={r!.repo} className="w-[38px] h-[38px] rounded-[11px] object-cover bg-clay shrink-0" />
                <div className="min-w-0 flex-1">
                  <b className="block card-title text-[14px] truncate"><Link to={`/repo/${encodeURIComponent(r!.repo)}`} className="hover:text-accent">{r!.repo.split("/")[1]}</Link></b>
                  <span className="font-mono text-[10.5px] text-dim">★ {fmt(r!.stars)} · {r!.lang} · {CAT_META[r!.cat]?.label}</span>
                </div>
                <div className="w-[120px] h-1.5 rounded-full bg-clay overflow-hidden shrink-0 max-[640px]:hidden" title={`${prog}% catalog activity`}>
                  <i className="block h-full rounded-full grow-x" style={{ width: `${prog}%`, background: "linear-gradient(90deg, var(--color-accent), var(--color-ember))" }} />
                </div>
                <span className="font-mono text-[10.5px] text-dim w-8 shrink-0 max-[640px]:hidden">{prog}%</span>
                <button aria-label="Remove" onClick={() => { toggleSaved(r!.repo); toast(`Removed ${r!.repo.split("/")[1]}`); }}
                  className="text-dim p-1.5 rounded-lg hover:text-brick transition-colors cursor-pointer shrink-0">{IC_X}</button>
              </div>
            );
          }) : (
            <p className="text-dim text-[14px] py-6 text-center">Nothing saved yet - tap the star on any project card and it lands here. <Link to="/projects" className="text-accent font-semibold hover:underline">Browse projects →</Link></p>
          )}
        </section>

        <section id="orgs" className="bg-card border border-line rounded-[22px] p-6 shadow-soft scroll-mt-24">
          <h3 className="panel-h-lg mb-4 flex items-center gap-2.5"><Ic d={D.building} size={16} /> Saved organizations</h3>
          {orgList.length ? (
            <div className="flex gap-2.5 flex-wrap">
              {orgList.map((o) => (
                <span key={o!.login} className="inline-flex items-center gap-2.5 bg-paper border border-line rounded-full py-2 pl-2 pr-3.5 text-[13px] font-semibold">
                  <OrgImg src={avatarOf(o!.login, 52)} name={o!.login} className="w-[26px] h-[26px] rounded-full object-cover bg-clay" />
                  <Link to={`/organizations/${o!.login}`} className="hover:text-accent">{o!.login}</Link>
                  <span className="font-mono text-[10.5px] text-honey font-bold">★ {fmt(o!.stars)}</span>
                  <button aria-label="Unfollow" onClick={() => { toggleSavedOrg(o!.login); toast(`Unfollowed ${o!.login}`); }}
                    className="text-dim hover:text-brick cursor-pointer">{IC_X}</button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-dim text-[14px] py-6 text-center">Follow a few orgs and their new catalog repos show up in your digest. <Link to="/organizations" className="text-accent font-semibold hover:underline">Browse organizations →</Link></p>
          )}
        </section>

        <section id="matcher" className="bg-card border border-line rounded-[22px] p-6 shadow-soft scroll-mt-24">
          <h3 className="panel-h-lg mb-1 flex items-center gap-2.5">{IC_TARGET} Personalised org selection</h3>
          <p className="text-cocoa text-[13px] mb-4 max-w-[640px]">
            Give cyrus a GitHub handle and your skills - typed or read straight off your resume - and it scores every
            organization in the {fmt(Math.max(archive.length, 5238))}-project program archive against what you actually build with.
          </p>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end max-[820px]:grid-cols-1">
            <label className="block">
              <span className="font-mono text-[9.5px] uppercase tracking-[.12em] text-dim block mb-1.5">GitHub username</span>
              <input value={ghIn} onChange={(e) => setGhIn(e.target.value)} placeholder="yourhandle" spellCheck={false}
                className="w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-[14px] outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(180,96,44,.12)]" />
            </label>
            <label className="block">
              <span className="font-mono text-[9.5px] uppercase tracking-[.12em] text-dim block mb-1.5">Skills (or drop your resume)</span>
              <div className="flex gap-2">
                <input value={skillsIn} onChange={(e) => setSkillsIn(e.target.value)} placeholder="python, react, kubernetes…"
                  className="flex-1 min-w-0 bg-paper border border-line rounded-xl px-3.5 py-2.5 text-[14px] outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(180,96,44,.12)]" />
                <label className={btn("outline", "sm") + " shrink-0 cursor-pointer flex items-center gap-1.5"}>
                  <input type="file" accept=".md,.txt,.json,.csv,.pdf,text/*,application/pdf" className="hidden" onChange={(e) => parseResume(e.target.files?.[0] ?? null)} />
                  Resume
                </label>
              </div>
            </label>
            <button onClick={runMatch} className={btn("primary", "md")}>Match me →</button>
          </div>
          {fileNote && <p className="font-mono text-[10.5px] text-leaf mt-2">{fileNote}</p>}
          {prof.done && (
            <div className="mt-5 border-t border-liness pt-4">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[.1em] text-cocoa">
                  Profile: {prof.gh ? `@${prof.gh} · ` : ""}{prof.skills.length} skills{savedOrgs.length ? ` · ${savedOrgs.length} followed orgs` : ""}
                </span>
                <button onClick={() => { setProf({ ...prof, done: false }); }} className="font-mono text-[10px] font-bold uppercase tracking-[.1em] text-accent hover:underline cursor-pointer">Edit profile</button>
              </div>
              {recs.length ? (
                <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2 max-[620px]:grid-cols-1">
                  {recs.map((r) => (
                    <div key={r.name} className="bg-cream border border-line rounded-[16px] p-4 flex flex-col gap-2 hover:border-accent/45 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-[9px] bg-white border border-line grid place-items-center overflow-hidden shrink-0">
                          <OrgImg src={avatarOf(r.login ?? r.name, 64)} name={r.login ?? r.name} className="w-5 h-5 object-contain" />
                        </span>
                        <b className="card-title text-[13px] truncate flex-1">{r.name}</b>
                        <span className="font-mono text-[11px] font-bold text-accent shrink-0">{r.score}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-clay overflow-hidden"><i className="block h-full rounded-full" style={{ width: `${r.score}%`, background: "linear-gradient(90deg, var(--color-accent), var(--color-ember))" }} /></div>
                      <span className="font-mono text-[10px] text-dim">{r.hits} skill matches · {r.projects} projects · {r.years} program years</span>
                      <div className="flex gap-1 flex-wrap">{r.techs.map((t) => <Chip key={t} tone="lang">{t}</Chip>)}</div>
                      <div className="flex gap-2 mt-1">
                        {r.login ? (
                          <Link to={`/organizations/${r.login}`} className={btn("primary", "sm") + " flex-1 justify-center !px-2 text-[11.5px]"}>View org</Link>
                        ) : (
                          <a href={`https://github.com/search?q=${encodeURIComponent(r.name)}&type=organizations`} target="_blank" rel="noopener" className={btn("outline", "sm") + " flex-1 justify-center !px-2 text-[11.5px]"}>Find on GitHub ↗</a>
                        )}
                        <button onClick={() => addWatch(r.name)} title="Add to watchlist"
                          className="w-[30px] h-[30px] rounded-[9px] border border-line grid place-items-center text-dim hover:border-accent hover:text-accent transition-colors cursor-pointer shrink-0">{IC_EYE}</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dim text-[13.5px]">No archive org overlapped that profile - broaden a skill or two and re-run the match.</p>
              )}
            </div>
          )}
        </section>

        <section id="watchlist" className="bg-card border border-line rounded-[22px] p-6 shadow-soft scroll-mt-24">
          <h3 className="panel-h-lg mb-4 flex items-center gap-2.5">
            {IC_EYE} Watchlist <Link to="/organizations" className="go ml-auto text-dim text-[13px] font-medium hover:text-accent">add orgs →</Link>
          </h3>
          {watch.length ? (
            <div className="grid gap-2.5">
              {watch.map((w) => {
                const o = ORGS.find((x) => norm(x.name) === norm(w.org) || x.login === w.org);
                return (
                  <div key={w.org} className="flex items-center gap-3 border border-line rounded-[14px] px-4 py-3 max-[720px]:flex-wrap">
                    <span className="w-8 h-8 rounded-[9px] bg-cream border border-line grid place-items-center overflow-hidden shrink-0">
                      <OrgImg src={avatarOf(o?.login ?? w.org, 64)} name={o?.login ?? w.org} className="w-5 h-5 object-contain" />
                    </span>
                    <b className="card-title text-[13.5px] w-[190px] truncate shrink-0">{o ? o.name : w.org}</b>
                    <button onClick={() => setWatch(watch.map((x) => x.org === w.org
                      ? { ...x, status: STATUS_CYCLE[(STATUS_CYCLE.indexOf(x.status) + 1) % 3] as typeof x.status } : x))}
                      title="Click to advance status"
                      className={`font-mono text-[9.5px] font-bold uppercase tracking-[.08em] px-2.5 py-1 rounded-full border cursor-pointer transition-colors shrink-0 ${STATUS_CLS[w.status]}`}>{w.status}</button>
                    <input value={w.note} placeholder="why it's on the list - repo, idea, mentor…" onChange={(e) => setWatch(watch.map((x) => x.org === w.org ? { ...x, note: e.target.value } : x))}
                      className="flex-1 min-w-[140px] bg-transparent border-b border-dashed border-line text-[12.5px] py-1 outline-none focus:border-accent" />
                    <button aria-label="Remove from watchlist" onClick={() => setWatch(watch.filter((x) => x.org !== w.org))}
                      className="text-dim p-1 rounded hover:text-brick transition-colors cursor-pointer shrink-0">{IC_X}</button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-dim text-[14px] py-5 text-center">Track orgs from the matcher cards above - or just <Link to="/organizations" className="text-accent font-semibold hover:underline">browse the directory</Link> and tap the eye.</p>
          )}
        </section>

        <section id="mentors" className="bg-card border border-line rounded-[22px] p-6 shadow-soft scroll-mt-24">
          <h3 className="panel-h-lg mb-1 flex items-center gap-2.5">{IC_USER} Mentor finder</h3>
          <p className="font-mono text-[10.5px] text-dim mb-4 flex flex-wrap items-center gap-x-2">
            Pre-fetched contact channels and mentor handles from archived project pages - so you can introduce yourself before proposal season gets busy.
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-4 font-mono text-[10px] uppercase tracking-[.08em]">
            <span className="text-cocoa bg-cream border border-line rounded-full px-2.5 py-1">Cached mentor contact data</span>
            <span className="text-cocoa bg-cream border border-line rounded-full px-2.5 py-1">Generated offline by the project workflow - no scraping in your browser</span>
            <span className="text-honey bg-honey/10 border border-honey/35 rounded-full px-2.5 py-1">Last updated: {YEARS_AGO} weeks ago</span>
            <span className="text-leaf bg-leaf/10 border border-leaf/35 rounded-full px-2.5 py-1">GSoC selection complete - data won't update frequently</span>
          </div>
          {mentors.length ? (
            <div className="grid grid-cols-2 gap-2.5 max-[820px]:grid-cols-1">
              {mentors.map((mt) => (
                <div key={mt.name + mt.org} className="flex items-center gap-3 border border-line rounded-[14px] px-4 py-3 hover:border-accent/40 transition-colors">
                  <Avatar name={mt.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <b className="block card-title text-[13px] truncate">{mt.name}</b>
                    <span className="font-mono text-[10px] text-dim truncate block">{mt.org}</span>
                  </div>
                  <span className="font-mono text-[9.5px] font-bold text-cocoa bg-cream border border-line rounded-full px-2.5 py-1 shrink-0">{mt.channel}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dim text-[14px] py-5 text-center">
              {archive.length ? "Follow or watch an org and its mentor handles surface here." : "The archive is still loading - mentor handles appear once it lands."}
            </p>
          )}
          <p className="font-mono text-[10px] text-dim mt-4">
            Handles come straight from accepted-project pages in the archive; verify each channel on the org's own community page before first contact.
          </p>
        </section>

        <section id="compare" className="bg-card border border-line rounded-[22px] p-6 shadow-soft scroll-mt-24">
          <h3 className="panel-h-lg mb-4 flex items-center gap-2.5">{IC_SCALE} Compare organisations</h3>
          <div className="relative mb-4 max-w-[380px]">
            <input value={cmpQ} onChange={(e) => setCmpQ(e.target.value)} placeholder="Search orgs to compare (up to 3)…" aria-label="Search organizations"
              className="w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-[14px] outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(180,96,44,.12)]" />
            {cmpMatches.length > 0 && (
              <div className="absolute z-10 top-full mt-1.5 left-0 right-0 bg-card border border-line rounded-[14px] shadow-lift overflow-hidden">
                {cmpMatches.map((o) => (
                  <button key={o.login} onClick={() => { setCmpIds([...cmpIds, o.login].slice(-3)); setCmpQ(""); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-cream transition-colors cursor-pointer">
                    <OrgImg src={avatarOf(o.login, 48)} name={o.login} className="w-6 h-6 rounded-md object-cover bg-clay shrink-0" />
                    <b className="text-[13px] truncate">{o.name}</b>
                    <span className="ml-auto font-mono text-[10px] text-dim shrink-0">★ {fmt(o.stars)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {cmpRows.length >= 2 ? (
            <div className={cmpRows.length === 2 ? "grid grid-cols-2 gap-3 max-[900px]:grid-cols-1" : "grid grid-cols-3 gap-3 max-[1050px]:grid-cols-1"}>
              {cmpRows.map(({ o, projects, years, topTech, tier, followers }) => (
                <div key={o.login} className="bg-cream border border-line rounded-[16px] p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <OrgImg src={avatarOf(o.login, 64)} name={o.login} className="w-8 h-8 rounded-[9px] object-cover bg-white border border-line shrink-0" />
                    <Link to={`/organizations/${o.login}`} className="card-title text-[13.5px] truncate hover:text-accent">{o.name}</Link>
                    <button aria-label={`Remove ${o.login}`} onClick={() => setCmpIds(cmpIds.filter((x) => x !== o.login))}
                      className="ml-auto text-dim hover:text-brick cursor-pointer shrink-0">{IC_X}</button>
                  </div>
                  <dl className="grid gap-2 font-mono text-[11px]">
                    {([["GitHub stars", fmt(o.stars)], ["Public repos", fmt(o.repos)], ["Followers", followers ? fmt(followers) : "-"],
                      ["Archive projects", fmt(projects)], ["Program years", String(years || "-")], ["Top stack", topTech], ["Tier", tier]] as [string, string][])
                      .map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3 border-b border-dashed border-line/70 pb-1.5 last:border-0">
                          <dt className="text-dim">{k}</dt><dd className="text-ink font-bold text-right truncate">{v}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dim text-[13.5px]">Pick at least two organizations above - stars, repos, archive footprint, years and tier land side by side.</p>
          )}
        </section>

        <section id="deadlines" className="bg-card border border-line rounded-[22px] p-6 shadow-soft scroll-mt-24">
          <h3 className="panel-h-lg mb-4 flex items-center gap-2.5">
            {IC_FLAG} Deadlines ahead <Link to="/hackathons" className="ml-auto text-[13px] font-medium text-dim hover:text-accent">full calendar →</Link>
          </h3>
          {due.length ? (
            <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
              {due.map((h) => {
                const d = daysTo(h.deadline);
                return (
                  <Link key={h.id} to={`/hackathons/${h.id}`}
                    className="group flex items-center gap-3 border border-line rounded-[16px] p-4 hover:border-ember hover:-translate-y-px transition-all">
                    <OrgImg src={avatarOf(h.orgLogo, 64)} name={h.orgLogo} className="w-[34px] h-[34px] rounded-[10px] object-cover bg-sand shrink-0" />
                    <div className="min-w-0">
                      <b className="block card-title text-[14px] group-hover:text-rust transition-colors">{h.name}</b>
                      <span className="font-mono text-[10.5px] text-dim">{h.org} · closes {h.deadline}</span>
                    </div>
                    <span className={`ml-auto shrink-0 font-mono text-[10px] font-bold border rounded-full px-2.5 py-1 ${dueTone(d)}`}>
                      {d === 0 ? "today" : `${d}d left`}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-dim text-[14px] py-6 text-center">Nothing open this second - the <Link to="/hackathons" className="text-accent font-semibold hover:underline">calendar</Link> refills every season.</p>
          )}
        </section>

        <section className="bg-card border border-line rounded-[22px] p-6 shadow-soft">
          <h3 className="panel-h-lg mb-4 flex items-center gap-2.5">
            {IC_BOOK} Reading picked for your stack <Link to="/resources" className="ml-auto text-[13px] font-medium text-dim hover:text-accent">all resources →</Link>
          </h3>
          <div className="grid grid-cols-3 gap-3 max-[800px]:grid-cols-1">
            {picks.map((r) => (
              <Link key={r.id} to={`/resources/${r.id}`}
                className="group flex flex-col gap-2 border border-line rounded-[16px] p-4 hover:border-ember hover:-translate-y-px transition-all">
                <div className="flex items-center gap-2">
                  <OrgImg src={avatarOf(r.provider, 48)} name={r.brand} className="w-[24px] h-[24px] rounded-[7px] object-cover bg-sand shrink-0" />
                  <span className="font-mono text-[10px] text-dim truncate">{r.brand}</span>
                  {r.free && <span className="ml-auto shrink-0 font-mono text-[9px] font-bold text-leaf">FREE</span>}
                </div>
                <b className="card-title text-[14px] leading-snug group-hover:text-rust transition-colors line-clamp-2">{r.title}</b>
                <span className="font-mono text-[10px] text-dim mt-auto">{r.cat} · {r.time}</span>
              </Link>
            ))}
          </div>
        </section>

        <section id="activity" className="bg-card border border-line rounded-[22px] p-6 shadow-soft scroll-mt-24">
          <h3 className="panel-h-lg mb-2 flex items-center gap-2.5"><Ic d={D.pulse} size={16} /> Activity</h3>
          <div>
            {acts.map(([txt, when], i) => (
              <div key={i} className="flex gap-3.5 py-3 relative">
                <span className="shrink-0 grid gap-1 justify-items-center">
                  <i className="w-3 h-3 rounded-full mt-1 not-italic bg-peach border-[3px] border-accent" />
                  {i < acts.length - 1 && <i className="w-[2px] flex-1 bg-line not-italic" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] text-cocoa leading-[1.55]" dangerouslySetInnerHTML={{ __html: txt.replace("<b>", '<b class="text-ink">') }} />
                  <time className="font-mono text-[10.5px] text-dim">{when}</time>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border border-line rounded-[22px] p-6 shadow-soft">
          <h3 className="panel-h-lg mb-4 flex items-center gap-2.5"><Ic d={D.bookmark} size={16} /> Your working stack, per the board</h3>
          <div className="flex flex-wrap gap-2">
            {(langs.length ? langs : ["TypeScript", "Python"]).map((l) => <Chip key={l} tone="lang">{l}</Chip>)}
            {skills.map((t) => <Chip key={t} tone="cat">{t}</Chip>)}
            {!saved.length && <span className="text-dim text-[13.5px]">Save a few repos and your real stack appears here - {REPOS.length} repos to choose from.</span>}
          </div>
        </section>
      </main>
    </div>
  );
}
