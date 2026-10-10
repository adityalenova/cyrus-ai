/* ══ App.tsx — routes + layout shell ════════════════════════ */
import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { StoreProvider } from "./lib/store";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Palette from "./components/Palette";
import AuthModal from "./components/AuthModal";
import { Logo } from "./components/ui";
import Home from "./pages/Home";
import Organizations from "./pages/Organizations";
import OrgProfile from "./pages/OrgProfile";
import Projects from "./pages/Projects";
import OpenSource from "./pages/OpenSource";
import ProgramDetail from "./pages/ProgramDetail";
import Hackathons, { HackathonDetail } from "./pages/Hackathons";
import Resources, { ResourceDetail } from "./pages/Resources";
import RepoDetail from "./pages/RepoDetail";
import Dashboard from "./pages/Dashboard";
import Nova from "./pages/Nova";
import About from "./pages/About";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
    else setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 60);
  }, [pathname, hash]);
  return null;
}

/* one-time intro curtain: logo pops with the orbit glow, wordmark rises, lifts away */
function Splash() {
  const [gone, setGone] = useState(() =>
    sessionStorage.getItem("cyrus-splashed") === "1"
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (gone) return;
    sessionStorage.setItem("cyrus-splashed", "1");
    document.body.style.overflow = "hidden";
    const t1 = setTimeout(() => { document.body.style.overflow = ""; }, 1500);
    const t2 = setTimeout(() => setGone(true), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); document.body.style.overflow = ""; };
  }, [gone]);
  if (gone) return null;
  return (
    <div className="splash" aria-hidden="true">
      <div className="flex flex-col items-center gap-5">
        <div className="splash-mark search-pulse rounded-[24px]"><Logo size={88} /></div>
        <div className="splash-word font-display font-extrabold tracking-[-.02em] text-[34px]">
          cyrus<span className="text-accent">.ai</span>
        </div>
        <div className="splash-sub font-mono text-[10.5px] tracking-[.18em] uppercase text-dim">
          hackathons · open source · agent skills
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ScrollManager />
      <Splash />
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/organizations/:login" element={<OrgProfile />} />
            <Route path="/opensource" element={<OpenSource />} />
            <Route path="/programs/:id" element={<ProgramDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/hackathons" element={<Hackathons />} />
            <Route path="/hackathons/:id" element={<HackathonDetail />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/:id" element={<ResourceDetail />} />
            <Route path="/repo/:id" element={<RepoDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/nova" element={<Nova />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Legal kind="privacy" />} />
            <Route path="/terms" element={<Legal kind="terms" />} />
            <Route path="/cookies" element={<Legal kind="cookies" />} />
            <Route path="/affiliations" element={<Legal kind="affiliations" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Palette />
      <AuthModal />
    </StoreProvider>
  );
}
