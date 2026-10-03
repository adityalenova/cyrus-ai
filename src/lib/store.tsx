/* ══ store.tsx — auth, saved items, toasts, modals ═══════════ */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useStored } from "./util";
import type { User } from "./util";

interface Store {
  user: User | null;
  signIn: (u: User) => void;
  signOut: () => void;
  saved: string[];
  toggleSaved: (id: string) => boolean;
  savedOrgs: string[];
  toggleSavedOrg: (login: string) => boolean;
  downloads: Record<string, number>;
  countDownload: (id: string) => void;
  toast: (msg: string) => void;
  authOpen: boolean;
  setAuthOpen: (v: boolean) => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const Ctx = createContext<Store>(null!);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useStored<User | null>("agenthub.user", null);
  const [saved, setSaved] = useStored<string[]>("agenthub.saved", []);
  const [savedOrgs, setSavedOrgs] = useStored<string[]>("agenthub.savedorgs", []);
  const [downloads, setDownloads] = useStored<Record<string, number>>("agenthub.downloads", {});
  const [toastMsg, setToastMsg] = useState<{ msg: string; k: number } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [theme, setTheme] = useStored<"light" | "dark">("agenthub.theme", "light");

  /* flip the warm token set by toggling .dark on <html> */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  const toggleTheme = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  const toast = useCallback((msg: string) => setToastMsg({ msg, k: Date.now() }), []);

  const signIn = useCallback((u: User) => setUser(u), [setUser]);
  const signOut = useCallback(() => { setUser(null); toast("Signed out"); }, [setUser, toast]);

  const toggleSaved = useCallback((id: string) => {
    const added = !saved.includes(id);
    setSaved(added ? [...saved, id] : saved.filter((x) => x !== id));
    return added;
  }, [saved, setSaved]);

  const toggleSavedOrg = useCallback((login: string) => {
    const added = !savedOrgs.includes(login);
    setSavedOrgs(added ? [...savedOrgs, login] : savedOrgs.filter((x) => x !== login));
    return added;
  }, [savedOrgs, setSavedOrgs]);

  const countDownload = useCallback((id: string) => {
    setDownloads({ ...downloads, [id]: (downloads[id] || 0) + 1 });
  }, [downloads, setDownloads]);

  /* auto-dismiss toast */
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2600);
    return () => clearTimeout(t);
  }, [toastMsg]);

  /* global ⌘K / "/" palette hotkeys */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ae = document.activeElement;
      const typing = /INPUT|TEXTAREA|SELECT/.test(ae?.tagName ?? "");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(true); }
      else if (e.key === "/" && !typing) { e.preventDefault(); setPaletteOpen(true); }
      else if (e.key === "Escape") { setPaletteOpen(false); setAuthOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Ctx.Provider value={{
      user, signIn, signOut, saved, toggleSaved, savedOrgs, toggleSavedOrg,
      downloads, countDownload,
      toast: (m: string) => toast(m), authOpen, setAuthOpen, paletteOpen, setPaletteOpen,
      theme, toggleTheme,
    }}>
      {children}
      {toastMsg && (
        <div key={toastMsg.k} className="reveal fixed bottom-6 left-1/2 z-[120] -translate-x-1/2 flex items-center gap-2.5 rounded-full bg-coffee border border-roast text-foam px-5.5 py-3 text-[14px] font-semibold shadow-lift">
          <span className="text-[#7ee2a8]">✓</span> {toastMsg.msg}
        </div>
      )}
    </Ctx.Provider>
  );
}
