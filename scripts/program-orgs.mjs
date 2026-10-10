/* ══ scripts/program-orgs.mjs — Task 2: programOrgs.json ═══════════════
   Union of org names from public/data/gsoc-projects.json (orgs map) and
   public/data/gsoc-orgs.json (per-year rosters); for each, find a confident
   GitHub login via `gh api search/users` (rate-limited: sleep 2.3s) then
   verify with `gh api users/<login>` (5000/hr). Results cached in
   scripts/org-login-cache.json so re-runs are cheap.
   Output: public/data/programOrgs.json  { "<orgName>": {login,name,url,avatar} }
   ═══════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, renameSync, existsSync } from "fs";
import { execFileSync } from "child_process";

const ROOT = new URL("..", import.meta.url).pathname;
const DATA = `${ROOT}public/data`;
const CACHE = `${ROOT}scripts/org-login-cache.json`;
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const STOP = new Set(["the", "a", "an", "of", "and", "to", "for", "open", "source", "software", "free", "inc", "llc", "org", "io"]);
const firstWord = (name) => {
  const w = norm(name);
  for (const raw of name.split(/[\s\-–—\/(),.&]+/)) {
    const t = norm(raw);
    if (t.length >= 3 && !STOP.has(t.toLowerCase())) return t;
  }
  return [...w][0] ? w : "";
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function gh(args, tries = 2) {
  for (let i = 0; i <= tries; i++) {
    try { return JSON.parse(execFileSync("gh", ["api", ...args], { timeout: 30000, maxBuffer: 20e6, stdio: ["ignore", "pipe", "pipe"] }).toString()); }
    catch (e) { if (i === tries) return null; sleep(1500); }
  }
  return null;
}

/* ── collect org names ── */
const names = new Set();
try {
  const gsoc = JSON.parse(readFileSync(`${DATA}/gsoc-projects.json`, "utf8"));
  for (const n of Object.keys(gsoc.orgs || {})) if (n) names.add(n);
} catch (e) { console.log("warn: gsoc-projects.json unreadable:", e.message); }
try {
  const roster = JSON.parse(readFileSync(`${DATA}/gsoc-orgs.json`, "utf8"));
  for (const yr of Object.values(roster)) for (const o of yr) if (o.name) names.add(o.name);
} catch (e) { console.log("warn: gsoc-orgs.json unreadable:", e.message); }

const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
console.log(`orgs: ${names.size}, cached: ${Object.keys(cache).length}`);

let done = 0, matched = 0, ghDead = 0;
for (const name of [...names].sort()) {
  if (!(name in cache)) {
    if (ghDead > 5) { cache[name] = { login: null }; continue; } // don't hammer a dead gh
    const q = encodeURIComponent(`"${name}" type:user`);
    const s = gh([`search/users?q=${q}&per_page=1`]);
    const top = s?.items?.[0];
    let ok = false;
    if (top && (top.public_repos || 0) > 5) {
      const key = firstWord(name);
      const nLogin = norm(top.login), nName = norm(top.name);
      if (key && ((nName && (nName.includes(key) || key.includes(nName))) || nLogin.includes(key))) ok = true;
    }
    if (ok) {
      const v = gh([`users/${top.login}`]);
      if (v && v.login) cache[name] = { login: v.login, name: v.name || top.name || v.login, url: v.html_url || `https://github.com/${v.login}`, avatar: v.avatar_url || "" };
      else cache[name] = { login: null };
    } else cache[name] = { login: null };
    if (!s) ghDead++;
    await sleep(2300); // search API: 30/min
  }
  if (cache[name].login) matched++;
  done++;
  if (done % 25 === 0) { console.log(`  ${done}/${names.size} processed, ${matched} matched`); writeFileSync(CACHE, JSON.stringify(cache)); }
}

/* ── final output: only entries (login may be null) ── */
const out = {};
for (const n of names) out[n] = cache[n] && cache[n].login ? { login: cache[n].login, name: cache[n].name || "", url: cache[n].url || "", avatar: cache[n].avatar || "" } : { login: null, name: n, url: "", avatar: "" };
const str = JSON.stringify(out);
JSON.parse(str);
writeFileSync(`${DATA}/programOrgs.json.tmp`, str);
renameSync(`${DATA}/programOrgs.json.tmp`, `${DATA}/programOrgs.json`);
writeFileSync(CACHE, JSON.stringify(cache));
console.log(`programOrgs.json: ${names.size} orgs, ${matched} with GitHub login`);
