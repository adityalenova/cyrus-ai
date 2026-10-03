/* ══ util.ts — formatting, hashing, storage helpers ═════════ */
import { useEffect, useState } from "react";
import { REPOS } from "../data/repos";
import { PROGRAM_REPOS } from "../data/programRepos";
import type { Level, Repo } from "./types";
import { ORGS } from "../data/orgs";

/** full catalog: the 528-repo agent catalog + program projects */
export const CATALOG: Repo[] = [...REPOS, ...PROGRAM_REPOS];

export const fmt = (n: number): string =>
  n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M"
  : n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);

export const byStars = (a: { stars: number }, b: { stars: number }) => b.stars - a.stars;

export const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

export function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** warm-tinted gradient tile derived from any string */
export function tileBG(str: string): string {
  const h = hash(str) % 360;
  return `linear-gradient(135deg, hsl(${h} 45% 55%), hsl(${(h + 40) % 360} 50% 40%))`;
}

export function initials(full: string): string {
  const name = full.split("/")[1] || full;
  const parts = name.split(/[-_.]/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
}

export const avatarOf = (owner: string, size = 88) => `https://github.com/${owner}.png?size=${size}`;

export const levelOf = (stars: number): Level =>
  stars > 50000 ? "advanced" : stars > 10000 ? "intermediate" : "beginner";

export const LEVEL_LABEL: Record<Level, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

export const repoById = (id: string) => CATALOG.find((r) => r.repo.toLowerCase() === id.toLowerCase());
export const orgByLogin = (login: string) => ORGS.find((o) => o.login.toLowerCase() === login.toLowerCase());
export const reposOfOwner = (owner: string): Repo[] => CATALOG.filter((r) => r.repo.split("/")[0].toLowerCase() === owner.toLowerCase());

export const CAT_META: Record<string, { label: string; color: string }> = {
  skills:   { label: "Agent Skills",          color: "honey" },
  cursor:   { label: "Cursor Rules",          color: "denim" },
  agentsmd: { label: "AGENTS.md & Design.md", color: "leaf" },
  mcp:      { label: "MCP Servers",           color: "plum" },
  tools:    { label: "Dev Agents & Programs", color: "accent" },
  programs: { label: "Program Projects",      color: "denim" },
};

export const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#b7a44a", Python: "#3572A5", Rust: "#c08a63",
  Go: "#0d8fa8", HTML: "#e34c26", CSS: "#563d7c", Java: "#b07219", "C++": "#b0517a",
  Shell: "#5f9e43", MDX: "#d99a1c", Vue: "#41b883", Ruby: "#a11a2e", Swift: "#F05138",
  Kotlin: "#A97BFF", Dart: "#00B4AB", "Jupyter Notebook": "#DA5B0B",
};

/** deterministic pseudo-random in [0,1) from (seed, index) */
export const rnd = (seed: string, i = 0) => {
  const h = hash(seed + ":" + i);
  return (h % 10000) / 10000;
};

/* ── localStorage-backed state ───────────────────────────── */
export function useStored<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : initial; }
    catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* private mode */ }
  }, [key, val]);
  return [val, setVal] as const;
}

export interface User { name: string; provider: string; email?: string; picture?: string }
export interface ToastFn { (msg: string): void }
