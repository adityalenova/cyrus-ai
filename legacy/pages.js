/* ══ pages.js — sponsors · submit · forum · community ══════════════ */
"use strict";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function ghGet(path) {
  try {
    const res = await fetch("https://api.github.com/" + path.replace(/^\/+/, ""), { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function ownerBoard() {
  const m = new Map();
  REPOS.forEach((r) => {
    const o = r.repo.split("/")[0];
    if (!m.has(o)) m.set(o, { o, repos: [], stars: 0 });
    const e = m.get(o); e.repos.push(r); e.stars += r.stars;
  });
  return [...m.values()].sort((a, b) => b.stars - a.stars);
}

/* ── Sponsors ═════════════════════════════════════════════════════ */
function initSponsors() {
  const board = ownerBoard();
  const grid = $("#spGrid"), search = $("#spSearch"), stats = $("#spStats");
  if (!grid) return;

  const sponsored = board.filter((e) => e.stars >= 20000).length;
  stats.innerHTML = `
    <div class="statcard"><b data-count="${board.length}">0</b><span>maintainer orgs listed</span></div>
    <div class="statcard"><b data-count="${sponsored}">0</b><span>with 20k+ catalog stars</span></div>
    <div class="statcard"><b data-count="8.3" data-suffix="M">0</b><span>stars they collectively hold</span></div>
    <div class="statcard"><b data-count="100" data-suffix="%">0</b><span>sponsor links go straight to GitHub</span></div>`;

  const card = (e) => {
    const top = e.repos.slice().sort(byStars)[0];
    return `<div class="sponsorcard">
      <img src="https://github.com/${encodeURIComponent(e.o)}.png?size=88" alt="" loading="lazy" onerror="this.style.visibility='hidden'"/>
      <span>
        <b>${esc(e.o)}</b>
        <span>${e.repos.length} repo${e.repos.length > 1 ? "s" : ""} in the catalog · ★ ${fmt(e.stars)} combined</span>
        <span style="display:block;margin-top:4px"><a href="repo.html?id=${encodeURIComponent(top.repo)}" style="color:var(--blue);font-size:12px">${esc(top.repo)} · ★ ${fmt(top.stars)}</a></span>
      </span>
      <a class="btn" style="color:var(--pink);border-color:rgba(255,123,114,.45)" href="https://github.com/sponsors/${encodeURIComponent(e.o)}" target="_blank" rel="noopener">♥ Sponsor</a>
    </div>`;
  };

  let shown = 40;
  const render = () => {
    const q = search.value.trim().toLowerCase();
    const pool = q ? board.filter((e) => (e.o + " " + e.repos.map((r) => r.repo + " " + r.desc).join(" ")).toLowerCase().includes(q)) : board;
    const slice = pool.slice(0, shown);
    grid.innerHTML = slice.map(card).join("") || `<p style="color:var(--dim);padding:30px 0">No maintainer matches “${esc(search.value)}”. Try “anthropics”, “cursor”, or “mcp”.</p>`;
    $("#spMore").style.display = pool.length > shown ? "" : "none";
    $("#spCount").textContent = `${pool.length} orgs`;
  };
  search.addEventListener("input", () => { shown = 40; render(); });
  $("#spMore").addEventListener("click", () => { shown += 40; render(); });

  const q = new URLSearchParams(location.search).get("q");
  if (q) search.value = q;
  render();
  countUpAll(stats);
}

/* ── Submit a repo ════════════════════════════════════════════════ */
function detectCat(text) {
  const t = text.toLowerCase();
  if (t.includes("mcp")) return "mcp";
  if (t.includes("cursor")) return "cursor";
  if (t.includes("agents.md") || t.includes("agentsmd") || t.includes("design.md")) return "agentsmd";
  if (t.includes("skill")) return "skills";
  return "tools";
}
function initSubmit() {
  const form = $("#submitForm"); if (!form) return;
  const QK = "agenthub.submissions";
  const getQ = () => { try { return JSON.parse(localStorage.getItem(QK)) || []; } catch { return []; } };
  const setQ = (q) => localStorage.setItem(QK, JSON.stringify(q));

  function renderQueue() {
    const q = getQ();
    $("#myQueue").innerHTML = q.length ? q.map((s) => `
      <div class="sponsorcard">
        <span class="thread__avatar" style="background:${tileBG(s.repo)}">${initials(s.repo)}</span>
        <span><b>${esc(s.repo)}</b><span>${CAT_META[s.cat] ? CAT_META[s.cat].label : s.cat} · queued ${new Date(s.when).toLocaleDateString()}</span></span>
        <span class="tag" style="color:var(--yellow);border-color:rgba(227,179,65,.4)">● ${esc(s.status)}</span>
      </div>`).join("") : `<p style="color:var(--dim);font-size:13.5px">Nothing queued yet — paste a repo URL above to get started.</p>`;
  }

  const urlIn = $("#fUrl"), prev = $("#subPreview");
  async function enrich(showErr) {
    const m = urlIn.value.trim().match(/github\.com\/([\w.-]+)\/([\w.-]+)/);
    if (!m) { if (showErr) { prev.classList.add("is-on"); prev.innerHTML = `<span style="color:var(--pink)">That doesn't look like a GitHub repo URL — e.g. <code>https://github.com/you/my-skill</code>.</span>`; } return null; }
    const id = m[1] + "/" + m[2].replace(/\.git$/, "");
    prev.classList.add("is-on");
    prev.innerHTML = `<span class="mono" style="color:var(--dim)">fetching api.github.com/repos/${esc(id)} …</span>`;
    const d = await ghGet("repos/" + id);
    if (!d || d.message) {
      prev.innerHTML = `<span style="color:var(--orange)">⚠ Couldn't reach the GitHub API (rate limit or private repo). You can still queue the listing — it will be verified on review.</span>`;
      form._gh = null;
      return null;
    }
    const guess = detectCat(((d.topics || []).join(" ") + " " + (d.description || "")).toLowerCase());
    $("#fCat").value = guess;
    form._gh = { repo: id, stars: d.stargazers_count, forks: d.forks_count, lang: d.language || "—", lic: (d.license && d.license.spdx_id) || "None", desc: d.description || "" };
    prev.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="https://github.com/${esc(d.owner.login)}.png?size=64" width="40" height="40" style="border-radius:50%" alt="" onerror="this.style.visibility='hidden'"/>
        <div>
          <b>${esc(id)}</b>
          <div class="mono" style="font-size:12px;color:var(--muted);margin-top:4px">
            ★ <span style="color:var(--yellow)">${fmt(d.stargazers_count)}</span> · ⎇ ${fmt(d.forks_count)} · ${esc(d.language || "n/a")} · ${esc((d.license && d.license.spdx_id) || "no license")}
          </div>
          <div style="font-size:12.5px;color:var(--dim);margin-top:4px">${esc((d.description || "").slice(0, 120))}</div>
        </div>
        <span class="tag" style="margin-left:auto;color:var(--green);border-color:rgba(63,185,80,.4)">✓ found on GitHub</span>
      </div>`;
    return d;
  }
  urlIn.addEventListener("blur", () => { if (urlIn.value.trim()) enrich(true); });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const btn = $("#submitBtn"); btn.disabled = true; btn.textContent = "Checking GitHub…";
    const d = await enrich(true);
    btn.disabled = false; btn.textContent = "Queue my listing";
    const m = urlIn.value.trim().match(/github\.com\/([\w.-]+)\/([\w.-]+)/);
    if (!m) return;
    const item = {
      repo: m[1] + "/" + m[2].replace(/\.git$/, ""),
      cat: $("#fCat").value,
      why: $("#fWhy").value.trim().slice(0, 200),
      when: Date.now(),
      status: d ? "queued · verified" : "queued · unverified",
      by: (getUser() || {}).name || "guest",
    };
    const q = getQ();
    if (!q.some((s) => s.repo.toLowerCase() === item.repo.toLowerCase())) q.unshift(item);
    setQ(q);
    renderQueue();
    form.reset(); prev.classList.remove("is-on"); form._gh = null;
    toast(`${item.repo} added to the review queue`);
    $("#myQueueWrap").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  });

  renderQueue();
}

/* ── Forum ════════════════════════════════════════════════════════ */
const SEED_THREADS = [
  { id: "t1", cat: "Show & tell", author: "nhaithi", title: "Shipped a skill that turns our CI logs into agent-readable playbooks — 3 weeks in", body: "It parses failing steps, maps them to the fix SKILL.md, and the agent applies the patch. Cut our mean fix time from 40 minutes to 9.", votes: 128, replies: 34, age: "2h" },
  { id: "t2", cat: "MCP", author: "rpm-codes", title: "Anyone else hitting the 60-req/h limit when a detail page fetches contributors + languages?", body: "We should batch the two calls or cache them for a day. Posting the patch I run locally in replies.", votes: 96, replies: 41, age: "5h" },
  { id: "t3", cat: "Skills", author: "obra-fan", title: "Superpowers vs. raw subagents — which one actually survives a real refactor?", body: "Ran both on the same 80k-line TypeScript monorepo for a week. Results are… not what I expected.", votes: 214, replies: 87, age: "1d" },
  { id: "t4", cat: "Help", author: "newdev-ana", title: "First AGENTS.md — how granular is too granular?", body: "Mine is now 4 pages and my agent seems to ignore half of it. Is there a length sweet spot people have landed on?", votes: 62, replies: 29, age: "1d" },
  { id: "t5", cat: "General", author: "maintainer-bo", title: "PSA: add a license before you submit to the catalog — 8% of listings have none", body: "No license means no reuse rights in most jurisdictions. MIT/Apache-2.0 is a two-minute decision that makes your repo listable and sponsorable.", votes: 173, replies: 22, age: "2d" },
  { id: "t6", cat: "Show & tell", author: "hyd-builds", title: "Built a shelf that filters the catalog by projects hiring agent tooling", body: "Ripped the JSON snapshot out of data.js, cross-matched with job boards. Ugly but works — link in the thread for anyone who wants it.", votes: 89, replies: 15, age: "3d" },
  { id: "t7", cat: "MCP", author: "punkpeye-contrib", title: "Why do we keep rebuilding the same filesystem MCP server?", body: "Counted 14 near-identical ones in the catalog. Proposal: a canonical spec + one reference impl, then thin adapters.", votes: 145, replies: 58, age: "4d" },
  { id: "t8", cat: "Skills", author: "quiet-dev", title: "Cursor rules: is there a way to version them per-project without polluting the repo?", body: "We symlink from a central rules repo but new hires keep missing the setup step.", votes: 41, replies: 0, age: "5d" },
];
function initForum() {
  const list = $("#threadList"); if (!list) return;
  const TK = "agenthub.threads", VK = "agenthub.threadvotes";
  const getT = () => { try { return JSON.parse(localStorage.getItem(TK)) || []; } catch { return []; } };
  const getV = () => { try { return JSON.parse(localStorage.getItem(VK)) || {}; } catch { return {}; } };
  let mode = "latest";

  const threadHTML = (t) => {
    const voted = getV()[t.id];
    return `<article class="thread" data-id="${t.id}">
      <span class="thread__avatar" style="background:${tileBG(t.author)}">${initials("u/" + t.author)}</span>
      <div class="thread__main">
        <h3>${esc(t.title)}</h3>
        <p>${esc(t.body)}</p>
        <div class="thread__meta">
          <span style="color:var(--blue)">${esc(t.cat)}</span><span>by ${esc(t.author)}</span><span>${esc(t.age)}</span>
          <span>💬 ${t.replies}</span>
          <button class="votebtn ${voted ? "voted" : ""}" data-vote="${t.id}">${voted ? "✓ voted" : "▲ vote"}</button>
        </div>
      </div>
      <div class="thread__votes"><b>${t.votes + (voted ? 1 : 0)}</b>votes</div>
    </article>`;
  };
  const all = () => {
    const mine = getT().map((t) => ({ ...t, age: "just now", replies: 0 }));
    return mine.concat(SEED_THREADS);
  };
  const render = () => {
    let t = all();
    if (mode === "top") t = t.slice().sort((a, b) => b.votes - a.votes);
    if (mode === "unanswered") t = t.filter((x) => !x.replies);
    list.innerHTML = t.map(threadHTML).join("");
  };
  $$(".forumtabs button").forEach((b) => b.addEventListener("click", () => {
    mode = b.dataset.mode;
    $$(".forumtabs button").forEach((x) => x.classList.toggle("is-active", x === b));
    render();
  }));
  list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-vote]"); if (!btn) return;
    const id = btn.dataset.vote; const v = getV();
    if (v[id]) { delete v[id]; } else { v[id] = 1; toast("Vote counted — thanks for curating"); }
    localStorage.setItem(VK, JSON.stringify(v)); render();
  });

  const composer = $("#composer"), newBtn = $("#newThreadBtn");
  newBtn.addEventListener("click", () => {
    if (!getUser()) { openAuth(); return; }
    composer.hidden = !composer.hidden;
    if (!composer.hidden) $("#ntTitle").focus();
  });
  $("#ntForm").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const u = getUser(); if (!u) { openAuth(); return; }
    const t = { id: "u" + Date.now(), cat: $("#ntCat").value, author: u.name, title: $("#ntTitle").value.trim(), body: $("#ntBody").value.trim(), votes: 0, age: "" };
    if (!t.title || !t.body) return;
    const mine = getT(); mine.unshift(t); localStorage.setItem(TK, JSON.stringify(mine));
    $("#ntForm").reset(); composer.hidden = true;
    mode = "latest"; render(); toast("Thread posted");
  });
  render();
}

/* ── Community ════════════════════════════════════════════════════ */
function initCommunity() {
  const stats = $("#commStats"); if (!stats) return;
  const board = ownerBoard();
  const langs = new Set(REPOS.map((r) => r.lang).filter((l) => l && l !== "—"));
  stats.innerHTML = `
    <div class="statcard"><b data-count="${REPOS.length}">0</b><span>repos in the catalog</span></div>
    <div class="statcard"><b data-count="${board.length}">0</b><span>unique maintainers &amp; orgs</span></div>
    <div class="statcard"><b data-count="${langs.size}">0</b><span>programming languages</span></div>
    <div class="statcard"><b data-count="8.3" data-suffix="M">0</b><span>stars across listings</span></div>`;
  countUpAll(stats);

  const hall = $("#hall");
  if (hall) hall.innerHTML = board.slice(0, 16).map((e) =>
    `<a href="sponsors.html?q=${encodeURIComponent(e.o)}"><img src="https://github.com/${encodeURIComponent(e.o)}.png?size=52" alt="" loading="lazy" onerror="this.style.visibility='hidden'"/>${esc(e.o)} <i>★ ${fmt(e.stars)}</i></a>`).join("");

  const savedWrap = $("#savedRepos");
  if (savedWrap) {
    const ids = getSaved();
    const rows = ids.map(repoById).filter(Boolean).sort(byStars);
    savedWrap.innerHTML = rows.length
      ? `<div class="spgrid">${rows.map((r) => `
        <a class="sponsorcard" href="repo.html?id=${encodeURIComponent(r.repo)}">
          <span class="thread__avatar" style="background:${tileBG(r.repo)}">${initials(r.repo)}</span>
          <span><b>${esc(r.repo)}</b><span>${CAT_META[r.cat].label} · ${esc(r.lang || "—")} · ${esc(r.license || "no license")}</span></span>
          <span class="tag" style="color:var(--yellow)">★ ${fmt(r.stars)}</span>
        </a>`).join("")}</div>`
      : `<p style="color:var(--dim);font-size:14px">No saved repos yet. Sign in, hit “Save” on any repo page, and they'll show up here.</p>`;
  }
}

/* ── boot ═════════════════════════════════════════════════════════ */
const _page = document.body.dataset.page;
if (_page === "sponsors") initSponsors();
if (_page === "submit") initSubmit();
if (_page === "forum") initForum();
if (_page === "community") initCommunity();
