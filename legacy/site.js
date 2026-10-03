/* ══ cyrus.ai site.js — shared chrome, auth, helpers ═══════════════ */
"use strict";

/* the logo: espresso squircle, cream "c" arc, terracotta spark at the caret */
const LOGO_SVG = `<svg width="30" height="30" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="27" fill="#241b13"/><path d="M68 34a21.5 21.5 0 1 0 .9 32" fill="none" stroke="#f5eee3" stroke-width="11" stroke-linecap="round"/><path d="M76 22c1.6 8.4 5.2 12 13.5 13.6C81.2 37.2 77.6 40.8 76 49.2 74.4 40.8 70.8 37.2 62.4 35.6 70.8 34 74.4 30.4 76 22z" fill="#d98546"/></svg>`;
const LOGO_FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='27' fill='%23241b13'/%3E%3Cpath d='M68 34a21.5 21.5 0 1 0 .9 32' fill='none' stroke='%23f5eee3' stroke-width='11' stroke-linecap='round'/%3E%3Cpath d='M76 22c1.6 8.4 5.2 12 13.5 13.6C81.2 37.2 77.6 40.8 76 49.2 74.4 40.8 70.8 37.2 62.4 35.6 70.8 34 74.4 30.4 76 22z' fill='%23d98546'/%3E%3C/svg%3E";
const BRAND = `cyrus<span class="tld">.ai</span>`;

const CAT_META = {
  skills:   { label: "Agent Skills",          color: "#a97b1f" },
  cursor:   { label: "Cursor Rules",          color: "#3b6ea5" },
  agentsmd: { label: "AGENTS.md & Design.md", color: "#3e7d4f" },
  mcp:      { label: "MCP Servers",           color: "#7a5aa8" },
  tools:    { label: "Dev Agents & Programs", color: "#b4602c" },
};
const LANG_COLORS = { TypeScript:"#3178c6", JavaScript:"#b7a44a", Python:"#3572A5", Rust:"#c08a63", Go:"#0d8fa8", HTML:"#e34c26", CSS:"#563d7c", Java:"#b07219", "C++":"#b0517a", Shell:"#5f9e43", MDX:"#d99a1c", Vue:"#41b883", Ruby:"#a11a2e", Swift:"#F05138", Kotlin:"#A97BFF", Dart:"#00B4AB", "Jupyter Notebook":"#DA5B0B" };

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmt = (n) => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M"
  : n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);
const byStars = (a, b) => b.stars - a.stars;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
function hash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return Math.abs(h); }
/* warm-tinted gradient tile derived from a string */
function tileBG(str) { const h = hash(str) % 360; return `linear-gradient(135deg, hsl(${h} 45% 55%), hsl(${(h + 40) % 360} 50% 40%))`; }
function initials(repo) {
  const name = repo.split("/")[1] || repo;
  const parts = name.split(/[-_.]/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
}
const repoById = (id) => REPOS.find((r) => r.repo.toLowerCase() === String(id).toLowerCase());
const avatarOf = (owner, size = 88) => `https://github.com/${owner}.png?size=${size}`;
function levelOf(stars) { return stars > 50000 ? "Advanced" : stars > 10000 ? "Intermediate" : "Beginner"; }
const orgByLogin = (login) => (typeof ORGS !== "undefined" ? ORGS.find((o) => o.login.toLowerCase() === String(login).toLowerCase()) : null);

/* ── auth (demo, localStorage) ───────────────────────────── */
const AUTH_KEY = "agenthub.user";
const getUser = () => { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; } };
const setUser = (u) => { u ? localStorage.setItem(AUTH_KEY, JSON.stringify(u)) : localStorage.removeItem(AUTH_KEY); renderNav(); };
const SAVED_KEY = "agenthub.saved";
const getSaved = () => { try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; } catch { return []; } };
function toggleSaved(id) {
  const s = getSaved(); const i = s.indexOf(id);
  i >= 0 ? s.splice(i, 1) : s.push(id);
  localStorage.setItem(SAVED_KEY, JSON.stringify(s));
  return i < 0;
}
const SAVED_ORG_KEY = "agenthub.savedorgs";
const getSavedOrgs = () => { try { return JSON.parse(localStorage.getItem(SAVED_ORG_KEY)) || []; } catch { return []; } };
function toggleSavedOrg(login) {
  const s = getSavedOrgs(); const i = s.indexOf(login);
  i >= 0 ? s.splice(i, 1) : s.push(login);
  localStorage.setItem(SAVED_ORG_KEY, JSON.stringify(s));
  return i < 0;
}
function toast(msg) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.innerHTML = `<span class="ok">✓</span> ${msg}`;
  t.classList.add("is-on");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("is-on"), 2600);
}

/* ── nav + footer injection ──────────────────────────────── */
const PAGES = [
  ["index.html", "Home"], ["organizations.html", "Organizations"],
  ["projects.html", "Projects"], ["about.html", "About us"],
];
function currentPage() {
  const p = location.pathname.split("/").pop() || "index.html";
  return p === "" ? "index.html" : p;
}
function renderNav() {
  const el = $("#nav"); if (!el) return;
  const cur = currentPage();
  const navKey = (cur === "org.html" ? "organizations.html" : cur === "repo.html" ? "projects.html" : cur === "dashboard.html" ? "" : cur);
  const user = getUser();
  el.innerHTML = `<nav class="topnav"><div class="topnav__inner">
    <a class="brand" href="index.html">${LOGO_SVG}<span>${BRAND}</span></a>
    <button class="hamb" id="hamb" aria-label="Menu">☰</button>
    <div class="topnav__links" id="navLinks">${PAGES.map(([f, l]) =>
      `<a href="${f}" ${f === navKey ? 'class="is-active"' : ""}>${l}</a>`).join("")}</div>
    <div class="topnav__right">
      <button class="navsearch" id="paletteBtn">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        Search 528 repos <kbd>⌘K</kbd>
      </button>
      ${user ? `<div class="usermenu">
        <button class="avatar" id="userBtn" style="background:${tileBG(user.name)}" aria-label="Account">${initials("u/" + user.name)}</button>
        <div class="usermenu__pop" id="userPop" hidden>
          <div class="who"><b>${user.name}</b><span>${user.provider === "guest" ? "Guest session" : "Signed in with " + user.provider}</span></div>
          <a href="dashboard.html">📈&nbsp; Dashboard</a>
          <a href="dashboard.html#saved">⭐&nbsp; Saved items (${getSaved().length + getSavedOrgs().length})</a>
          <button id="signOutBtn">↩&nbsp; Sign out</button>
        </div></div>`
      : `<button class="btn btn--dark" id="signInBtn" style="font-size:13px;padding:8px 16px">Sign in</button>`}
    </div>
  </div></nav>`;
  $("#hamb")?.addEventListener("click", () => $("#navLinks").classList.toggle("is-open"));
  $("#paletteBtn")?.addEventListener("click", openPalette);
  $("#signInBtn")?.addEventListener("click", openAuth);
  $("#userBtn")?.addEventListener("click", (e) => { e.stopPropagation(); $("#userPop").hidden = !$("#userPop").hidden; });
  document.addEventListener("click", () => { const p = $("#userPop"); if (p) p.hidden = true; });
  $("#signOutBtn")?.addEventListener("click", () => { setUser(null); toast("Signed out"); });
}
function renderFooter() {
  const el = $("#foot"); if (!el) return;
  el.innerHTML = `<footer class="footer"><div class="wrap">
    <div class="footer__brand">
      <a class="brand" href="index.html">${LOGO_SVG}<span>${BRAND}</span></a>
      <p>The open catalog of developer programs, organizations, and the skills, rules, configs and MCP servers that power AI coding agents. 528 repos, ranked by what developers actually star.</p>
    </div>
      <div><h4>Explore</h4><ul>
        <li><a href="organizations.html">Organizations</a></li>
        <li><a href="projects.html">Projects</a></li>
        <li><a href="index.html#timeline">Program timeline</a></li>
        <li><a href="index.html#programs">Developer programs</a></li>
      </ul></div>
      <div><h4>Your space</h4><ul>
        <li><a href="dashboard.html">Dashboard</a></li>
        <li><a href="dashboard.html#saved">Saved projects</a></li>
        <li><a href="dashboard.html#activity">Activity</a></li>
      </ul></div>
      <div><h4>About</h4><ul>
        <li><a href="about.html">About us</a></li>
        <li><a href="about.html#data">Data &amp; methodology</a></li>
        <li><a href="about.html#faq">FAQ</a></li>
      </ul></div>
    </div>
    <div class="footer__base">
      <span>© 2026 cyrus.ai · Data: GitHub API snapshot 2026-10-02 · built by a developer in Hyderabad</span>
      <a href="https://github.com" target="_blank" rel="noopener">Powered by open source ↗</a>
    </div>
  </div></footer>`;
}

/* ── auth modal ──────────────────────────────────────────── */
function openAuth() {
  let m = $("#authModal");
  if (!m) {
    m = document.createElement("div");
    m.id = "authModal"; m.className = "palette"; m.hidden = true;
    m.innerHTML = `<div class="palette__box authbox" role="dialog" aria-modal="true" aria-label="Sign in">
      <div class="palette__input" style="justify-content:center;font-weight:800;font-family:'Bricolage Grotesque';font-size:18px">
        ${LOGO_SVG}
        Sign in to <span style="font-family:'Bricolage Grotesque'">cyrus<span class="tld">.ai</span></span>
      </div>
      <div style="padding:22px">
        <button class="authbox__provider authbox__provider--gh" data-p="GitHub">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.29 9.42 7.86 10.95.58.1.79-.25.79-.55v-2.1c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.35.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.26 5.66.41.36.78 1.06.78 2.14v3.17c0 .31.2.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>
          Continue with GitHub</button>
        <button class="authbox__provider" data-p="Google">
          <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.26c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81Z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.93l-3.87-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.27 14.26A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.55.38-2.26V6.65H1.29a12 12 0 0 0 0 10.7l3.98-3.09Z"/><path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 11.99 11.99 0 0 0 1.29 6.65l3.98 3.09C6.22 6.88 8.87 4.77 12 4.77Z"/></svg>
          Continue with Google</button>
        <div class="authbox__divider">or</div>
        <button class="authbox__provider" data-p="guest">👋&nbsp; Continue as guest</button>
        <p class="authbox__note">Demo authentication — sessions are stored locally in your browser.<br/>Production OAuth drops in behind the same buttons.</p>
      </div></div>`;
    document.body.appendChild(m);
    m.addEventListener("click", (e) => { if (e.target === m) m.hidden = true; });
    $$(".authbox__provider", m).forEach((b) => b.addEventListener("click", () => {
      const p = b.dataset.p;
      let name = p === "guest" ? "Guest " + (hash(String(Date.now())) % 999) : "you";
      if (p !== "guest") {
        const typed = prompt(`Your ${p} username (demo — no real ${p} call is made):`);
        if (!typed) return;
        name = typed.trim().replace(/^@/, "") || "you";
      }
      setUser({ name, provider: p });
      m.hidden = true;
      toast(`Welcome, ${name}! Opening your dashboard…`);
      setTimeout(() => { location.href = "dashboard.html"; }, 650);
    }));
  }
  m.hidden = false;
}

/* ── command palette (global) ────────────────────────────── */
function ensurePalette() {
  if ($("#cmdPalette")) return $("#cmdPalette");
  const m = document.createElement("div");
  m.id = "cmdPalette"; m.className = "palette"; m.hidden = true;
  m.innerHTML = `<div class="palette__box" role="dialog" aria-modal="true" aria-label="Search repositories">
    <div class="palette__input">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="pInput" type="text" placeholder="Search repos & orgs — try “mcp”, “skills”, “Google”" autocomplete="off" spellcheck="false"/>
      <kbd>esc</kbd>
    </div>
    <ul class="palette__results" id="pResults"></ul>
    <p class="palette__foot"><kbd>↑↓</kbd> navigate · <kbd>enter</kbd> open page</p></div>`;
  document.body.appendChild(m);
  const input = $("#pInput", m), results = $("#pResults", m);
  let sel = 0, list = [];
  const filter = () => {
    const q = input.value.trim().toLowerCase();
    const repos = (q ? REPOS.filter((r) => (r.repo + " " + r.desc + " " + r.tags.join(" ") + " " + r.lang).toLowerCase().includes(q)) : REPOS.slice())
      .sort(byStars).slice(0, 9).map((r) => ({ kind: "repo", r }));
    const orgs = (typeof ORGS !== "undefined" && q
      ? ORGS.filter((o) => (o.login + " " + o.name + " " + o.tagline + " " + o.tags.join(" ")).toLowerCase().includes(q)).slice(0, 3)
      : []).map((o) => ({ kind: "org", r: o }));
    list = [...orgs, ...repos].slice(0, 12);
    sel = 0;
    results.innerHTML = list.map((it, i) => it.kind === "org" ? `
      <li><a class="pitem ${i === 0 ? "is-sel" : ""}" href="org.html?id=${encodeURIComponent(it.r.login)}">
        <span class="pitem__icon"><img src="${avatarOf(it.r.login, 64)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('init');this.parentNode.style.background='${tileBG(it.r.login)}';this.remove()"/></span>
        <span class="pitem__main"><span class="pitem__name">${it.r.name} <small>Organization · ${it.r.repos} repos</small></span>
        <span class="pitem__desc">${it.r.tagline}</span></span>
        <span class="pitem__stars">★ ${fmt(it.r.stars)}</span></a></li>` : `
      <li><a class="pitem ${i === 0 ? "is-sel" : ""}" href="repo.html?id=${encodeURIComponent(it.r.repo)}">
        <span class="pitem__icon"><img src="${avatarOf(it.r.repo.split('/')[0], 64)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('init');this.parentNode.style.background='${tileBG(it.r.repo)}';this.remove()"/></span>
        <span class="pitem__main"><span class="pitem__name">${it.r.repo.split("/")[1]} <small>${it.r.repo.split("/")[0]} · ${CAT_META[it.r.cat].label}</small></span>
        <span class="pitem__desc">${it.r.desc}</span></span>
        <span class="pitem__stars">★ ${fmt(it.r.stars)}</span></a></li>`).join("")
      || `<li><span class="pitem" style="color:var(--dim)">No matches for “${input.value}”. Try “mcp”, “skills”, or “Google”.</span></li>`;
  };
  const move = (d) => {
    const items = $$(".pitem", results); if (!items.length || !list.length) return;
    sel = (sel + d + list.length) % list.length;
    items.forEach((el, i) => el.classList.toggle("is-sel", i === sel));
    items[sel].scrollIntoView({ block: "nearest" });
  };
  input.addEventListener("input", filter);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    if (e.key === "Enter" && list[sel]) location.href = list[sel].kind === "org"
      ? "org.html?id=" + encodeURIComponent(list[sel].r.login)
      : "repo.html?id=" + encodeURIComponent(list[sel].r.repo);
    if (e.key === "Escape") m.hidden = true;
  });
  m.addEventListener("click", (e) => { if (e.target === m) m.hidden = true; });
  return m;
}
function openPalette() { const m = ensurePalette(); m.hidden = false; $("#pInput", m).value = ""; $("#pInput", m).dispatchEvent(new Event("input")); $("#pInput", m).focus(); }
document.addEventListener("keydown", (e) => {
  const m = $("#cmdPalette");
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); }
  if (e.key === "/" && (!m || m.hidden) && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openPalette(); }
  if (e.key === "Escape" && m && !m.hidden) m.hidden = true;
});

/* ── 3D tilt + reveal ────────────────────────────────────── */
function initTilt() {
  if (reduceMotion || matchMedia("(pointer: coarse)").matches) return;
  $$("[data-tilt]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateZ(6px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
}
let _io;
function initReveal() {
  if (reduceMotion) { $$(".reveal,.hbars,.pulsebars").forEach((el) => el.classList.add("is-in")); return; }
  _io = _io || new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add("is-in"); _io.unobserve(e.target); } }, { rootMargin: "0px 0px -60px 0px" });
  $$(".reveal,.hbars,.pulsebars").forEach((el) => _io.observe(el));
}
function countUpAll(scope = document) {
  $$("[data-count]", scope).forEach((el) => {
    if (el._done) return; el._done = true;
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const final = (target % 1 ? target.toFixed(1) : target) + suffix;
    if (reduceMotion) { el.textContent = final; return; }
    let start = null; const dur = 1100;
    el.textContent = (target % 1 ? "0.0" : "0") + suffix;
    (function loop() { requestAnimationFrame(function tick(ts) {
      if (start === null) start = ts;
      const k = Math.min(1, (ts - start) / dur), ease = 1 - Math.pow(1 - k, 3);
      const v = target * ease;
      el.textContent = (target % 1 ? v.toFixed(1) : String(Math.round(v))) + suffix;
      k < 1 ? loop() : (el.textContent = final);
    }); })();
    setTimeout(() => { el.textContent = final; }, dur + 120);
  });
}
const revealIO = () => _io;

/* ── boot ────────────────────────────────────────────────── */
renderNav();
renderFooter();
document.addEventListener("DOMContentLoaded", () => { initTilt(); initReveal(); countUpAll(); });
