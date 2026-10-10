/* ══ Nav.tsx — floating pill header + clean circle theme toggle + user menu + drawer ═ */
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Logo, Brand, Avatar, btn } from "./ui";
import { TONES } from "./plat";
import { useStore } from "../lib/store";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/organizations", label: "Organizations" },
  { to: "/opensource", label: "Open Source" },
  { to: "/projects", label: "Projects" },
  { to: "/hackathons", label: "Hackathons" },
  { to: "/resources", label: "Resources" },
  { to: "/about", label: "About us" },
];

/* Platform menu entries: slug, label, blurb, icon path, tone class from the plat kit */
const PLAT: [string, string, string, string, string][] = [
  ["features", "Features", "The whole contributor workflow.", "M12 3 3 8l9 5 9-5-9-5ZM3 16l9 5 9-5M3 12l9 5 9-5", "rust"],
  ["nova", "Nova AI", "Answers from your stack and the archive.", "M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z", "plum"],
  ["trust", "Trust centre", "Data sources, snapshots, verification.", "M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3Z", "leaf"],
  ["how", "How it works", "Three steps from empty tabs to merged PR.", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3.5 2", "honey"],
];

export default function Nav() {
  const { user, signOut, saved, savedOrgs } = useStore();
  const [pop, setPop] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const loc = useLocation();

  useEffect(() => { setPop(false); setOpen(false); }, [loc.pathname]);
  useEffect(() => {
    const close = () => setPop(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const active = (to: string) =>
    to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(to) || (to === "/projects" && loc.pathname.startsWith("/repo/"));

  return (
    <nav className="sticky top-0 z-[60] bg-paper px-4 pt-3 max-[700px]:px-2.5">
      <div className="max-w-[1340px] mx-auto bg-paper/92 backdrop-blur-[16px] saturate-[1.35] border border-liness rounded-full shadow-soft">
        <div className="flex items-center gap-5 h-[62px] pl-4 pr-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0"><Logo size={34} /><Brand /></Link>
          <button className="hidden max-[767px]:grid place-items-center w-9 h-9 rounded-[10px] border border-line bg-card ml-1 text-ink"
            aria-label="Menu" onClick={() => setOpen(!open)}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>

          {/* our pill-link style, laid out on the reference bar's rhythm */}
          <div className={`gap-1.5 overflow-x-auto md:overflow-visible no-scrollbar flex-col ${open ? "flex absolute left-4 right-4 top-[76px] bg-card border border-line rounded-[22px] shadow-lift z-50 px-5 py-4" : "hidden"} md:!flex md:static md:bg-transparent md:border-0 md:shadow-none md:p-0 md:flex-row md:rounded-full`}>
            {LINKS.slice(0, -1).map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"}
                className={`px-3.5 py-2 rounded-full text-[13.5px] font-semibold whitespace-nowrap transition-colors ${active(l.to) ? "bg-coffee text-foam" : "text-cocoa hover:bg-card hover:text-ink"}`}>
                {l.label}
              </NavLink>
            ))}
            <PlatformMenu drawer={open} />
            <NavLink to="/about" className={`px-3.5 py-2 rounded-full text-[13.5px] font-semibold whitespace-nowrap transition-colors ${active("/about") ? "bg-coffee text-foam" : "text-cocoa hover:bg-card hover:text-ink"}`}>
              About us
            </NavLink>
          </div>

          <div className="ml-auto flex items-center gap-3.5 max-[700px]:gap-2">
            <ThemeToggle />
            <span className="w-px h-6 bg-line shrink-0" aria-hidden />
            {user ? (
              <div className="relative" ref={menuRef}>
                <button className="!p-0 border-0" onClick={(e) => { e.stopPropagation(); setPop(!pop); }} aria-label="Account">
                  <Avatar name={user.name} size={34} src={user.picture} />
                </button>
                {pop && (
                  <div className="absolute right-0 top-[46px] w-[232px] bg-card border border-line rounded-[16px] shadow-lift p-1.5 z-[70]">
                    <div className="px-3 py-2.5 border-b border-liness mb-1.5">
                      <b className="block text-[14px]">{user.name}</b>
                      <span className="text-[12px] text-cocoa block truncate">{user.email || (user.provider === "guest" ? "Guest session" : "Signed in with " + user.provider)}</span>
                    </div>
                    <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13.5px] font-medium text-cocoa hover:bg-peach hover:text-rust"><MenuIcon d="M4 18v-6M10 18V7M16 18v-4M22 18H2" /> Dashboard</Link>
                    <Link to="/nova" className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13.5px] font-semibold text-rust hover:bg-peach"><MenuIcon d="M12 4l1.7 4.9L18.6 10l-4.9 1.7L12 16.6l-1.7-4.9L5.4 10l4.9-1.4zM18 16l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" /> nova.ai matches</Link>
                    <Link to="/dashboard#saved" className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13.5px] font-medium text-cocoa hover:bg-peach hover:text-rust"><MenuIcon d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.9z" /> Saved items ({saved.length + savedOrgs.length})</Link>
                    <button onClick={signOut} className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13.5px] font-medium text-cocoa hover:bg-peach hover:text-rust"><MenuIcon d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10" /> Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <SignInButton />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function SignInButton({ label = "Sign in", size = "md" as const, variant = "dark" as const, onClick }: { label?: string; size?: "sm" | "md" | "lg"; variant?: "dark" | "primary" | "outline"; onClick?: () => void }) {
  const { setAuthOpen } = useStore();
  return <button className={btn(variant, size)} onClick={onClick ?? (() => setAuthOpen(true))}>{label}</button>;
}

/* ── Platform dropdown: caret pill + card panel on desktop, inline list in the mobile drawer ── */
function PlatformMenu({ drawer }: { drawer: boolean }) {
  const [pop, setPop] = useState(false);
  const loc = useLocation();
  useEffect(() => setPop(false), [loc.pathname]);
  useEffect(() => {
    const close = () => setPop(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  const on = loc.pathname.startsWith("/platform");
  return (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); setPop(!pop); }} aria-expanded={pop}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${on ? "bg-coffee text-foam" : "text-cocoa hover:bg-card hover:text-ink"}`}>
        Platform
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden
          className={`transition-transform duration-200 ${pop ? "rotate-180" : ""}`}><path d="m5 9 7 7 7-7" /></svg>
      </button>
      {pop && (
        <div className="hidden md:block absolute left-0 top-[50px] w-[340px] bg-card border border-line rounded-[18px] shadow-lift p-2 z-[70]">
          {PLAT.map(([slug, label, desc, d, tone]) => (
            <Link key={slug} to={`/platform/${slug}`}
              onClick={() => setPop(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] hover:bg-peach transition-colors">
              <span className={`w-[36px] h-[36px] rounded-[11px] border grid place-items-center shrink-0 ${TONES[tone]}`}><MenuIcon d={d} /></span>
              <span className="min-w-0">
                <b className="block text-[13.5px] font-bold text-ink leading-tight">{label}</b>
                <span className="block text-[11.5px] text-dim mt-0.5 truncate">{desc}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
      {drawer && (
        <div className="md:hidden grid gap-1 pl-1.5 pb-1">
          {PLAT.map(([slug, label, , d]) => (
            <Link key={slug} to={`/platform/${slug}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold text-cocoa hover:bg-peach hover:text-rust transition-colors">
              <MenuIcon d={d} />{label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export const SearchIcon = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
  </svg>
);

const MenuIcon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d={d} />
  </svg>
);

/* ── light / dark switch: warm track, white circle knob, flat circle sun ── */
const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];
const SUN = (color: string) => (
  <g stroke={color} strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="4.2" fill={color} stroke="none" />
    {RAYS.map((a) => (
      <line key={a} x1="12" y1="3" x2="12" y2="5" transform={`rotate(${a} 12 12)`} />
    ))}
  </g>
);
const MOON = (color: string) => (
  <path d="M20.4 14.2A8.6 8.6 0 0 1 9.8 3.6a.6.6 0 0 0-.8-.7 9.2 9.2 0 1 0 12.1 12.1.6.6 0 0 0-.7-.8Z" fill={color} />
);

export function ThemeToggle() {
  const { theme, toggleTheme } = useStore();
  const dark = theme === "dark";
  return (
    <button role="switch" aria-checked={dark} aria-label="Toggle dark theme" onClick={toggleTheme}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="group relative w-[68px] h-[34px] rounded-full cursor-pointer shrink-0 border transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      style={{
        borderColor: dark ? "#3d3020" : "#e5dccd",
        background: dark ? "#241a0c" : "#efe8dc",
        boxShadow: dark ? "inset 0 1px 4px rgba(0,0,0,.5)" : "inset 0 1px 3px rgba(150,130,100,.18)",
      }}>
      {/* idle icon resting on the track (opposite side from the knob) */}
      <svg aria-hidden width="17" height="17" viewBox="0 0 24 24"
        className="absolute top-[8.5px] transition-opacity duration-300" style={{ right: "9px", opacity: dark ? 0 : 1 }}>
        {MOON("#a09282")}
      </svg>
      <svg aria-hidden width="17" height="17" viewBox="0 0 24 24"
        className="absolute top-[8.5px] transition-opacity duration-300" style={{ left: "9px", opacity: dark ? 1 : 0 }}>
        {SUN("#d98546")}
      </svg>
      {/* knob: a clean white circle carrying the active glyph */}
      <span aria-hidden className="absolute top-[3px] left-[3px] w-[26px] h-[26px] rounded-full bg-white grid place-items-center transition-transform duration-400 ease-[cubic-bezier(.55,1.6,.45,1)] group-hover:scale-[1.06]"
        style={{ boxShadow: "0 2px 6px rgba(60,42,24,.22), 0 0 0 1px rgba(60,42,24,.04)", transform: dark ? "translateX(34px)" : "none" }}>
        <svg width="19" height="19" viewBox="0 0 24 24" style={{ opacity: dark ? 0 : 1, position: "absolute", transition: "opacity .3s" }}>
          <circle cx="12" cy="12" r="4.8" fill="#f0913a" />
          <g stroke="#f0913a" strokeWidth="1.7" strokeLinecap="round">
            {RAYS.map((a) => (
              <line key={a} x1="12" y1="2.6" x2="12" y2="4.4" transform={`rotate(${a} 12 12)`} />
            ))}
          </g>
        </svg>
        <svg width="14" height="14" viewBox="0 0 24 24" style={{ opacity: dark ? 1 : 0, position: "absolute", transition: "opacity .3s" }}>
          {MOON("#5a4632")}
        </svg>
      </span>
    </button>
  );
}
