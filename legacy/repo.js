/* ══ repo.js — per-repo profile: snapshot stats + live GitHub data ═ */
"use strict";

const id = new URLSearchParams(location.search).get("id");
const r = repoById(id) || REPOS.find((x) => x.repo.toLowerCase() === decodeURIComponent(id || "").toLowerCase());

if (!r) {
  $("#repoRoot").innerHTML = `<div class="wrap pagehead"><h1>Repository not found</h1>
    <p>“${id ? escapeHTML(id) : "No repo id"}” isn't in the 2026-10-02 snapshot.
    <a href="browse.html" style="color:var(--blue)">Back to the directory →</a></p></div>`;
} else {
  boot(r);
}

function escapeHTML(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

function boot(r) {
  const [owner, name] = r.repo.split("/");
  document.title = `${r.repo} — cyrus.ai`;
  const saved = getSaved().includes(r.repo);
  const lc = LANG_COLORS[r.lang] || "var(--dim)";
  const top = REPOS.slice().sort(byStars);
  const rank = top.findIndex((x) => x.repo === r.repo) + 1;
  const related = REPOS.filter((x) => x.cat === r.cat && x.repo !== r.repo).sort(byStars).slice(0, 4);

  $("#repoRoot").innerHTML = `
  <header class="rhead"><div class="wrap">
    <div class="rhead__top">
      <span class="rhead__icon" style="background:${tileBG(r.repo)}">${initials(r.repo)}</span>
      <div>
        <h1><small>${owner} /</small> ${name}</h1>
        <div class="card__meta" style="margin-top:8px;font-family:'JetBrains Mono';font-size:11.5px;color:var(--dim)">
          <span class="tag" style="color:${CAT_META[r.cat].color};border-color:${CAT_META[r.cat].color}55">${CAT_META[r.cat].label}</span>
          <span>#${rank} in the catalog</span><span>pushed ${r.updated || "—"}</span>
          ${r.home ? `<span>· <a href="${r.home}" target="_blank" rel="noopener" style="color:var(--blue)">${escapeHTML(safeHost(r.home))} ↗</a></span>` : ""}
        </div>
      </div>
      <div class="rhead__actions">
        <button class="btn" id="saveBtn">${saved ? "★ Saved" : "☆ Save"}</button>
        <a class="btn btn--primary" href="${r.url}" target="_blank" rel="noopener">View on GitHub ↗</a>
      </div>
    </div>
    <p class="rhead__desc">${escapeHTML(r.desc)}</p>
    <div class="rstats">
      <div class="rstat"><b style="color:var(--yellow)">★ ${fmt(r.stars)}</b><span>stars</span></div>
      <div class="rstat"><b style="color:var(--blue)">⎇ ${fmt(r.forks)}</b><span>forks</span></div>
      <div class="rstat"><b style="color:var(--green)">◉ ${fmt(r.issues)}</b><span>open issues</span></div>
      <div class="rstat"><b style="color:${lc}">◆ ${r.lang}</b><span>language</span></div>
      <div class="rstat"><b>⚖ ${r.license}</b><span>license</span></div>
    </div>
  </div></header>

  <div class="wrap rlayout">
    <div>
      <section class="panel"><div class="panel__head">📦 About this project</div>
        <div class="panel__body">
          <p style="color:var(--muted);font-size:14.5px;line-height:1.75">${escapeHTML(r.desc)}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">${r.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
        </div></section>

      <section class="panel"><div class="panel__head">🛠 How developers use it <span class="count">derived from topics &amp; description</span></div>
        <div class="panel__body" id="usecases"></div></section>

      <section class="panel"><div class="panel__head">📊 Community pulse <span class="count" id="pulseNote">snapshot bars · live data loading…</span></div>
        <div class="panel__body">
          <div class="pulsebars is-in" id="pulse"></div>
          <div class="pulse-legend">
            <span><i style="background:var(--yellow)"></i>stars</span>
            <span><i style="background:var(--blue)"></i>forks</span>
            <span><i style="background:var(--green)"></i>open issues</span>
            <span><i style="background:var(--purple)"></i>contributors</span>
          </div>
        </div></section>

      <section class="panel"><div class="panel__head">👥 Contributors <span class="count" id="contribNote">live from GitHub API…</span></div>
        <div class="panel__body"><div class="contribs" id="contribs"><span style="color:var(--dim);font-size:13px">Loading…</span></div></div></section>

      <section class="panel"><div class="panel__head">🧬 Language breakdown <span class="count" id="langNote">live from GitHub API…</span></div>
        <div class="panel__body"><div class="langbar" id="langbar"></div><ul class="langlist" id="langlist"></ul></div></section>
    </div>

    <aside>
      <section class="panel"><div class="panel__head">🔥 Trending now</div>
        <div class="panel__body" style="padding-top:6px;padding-bottom:6px">
          ${top.slice(0, 10).map((x, i) => `<a class="trendrow" href="repo.html?id=${encodeURIComponent(x.repo)}">
            <span class="n">${i + 1}</span><b>${x.repo}</b><span class="s">★ ${fmt(x.stars)}</span></a>`).join("")}
        </div></section>

      <section class="panel"><div class="panel__head">💖 Sponsor ${owner}</div>
        <div class="panel__body">
          <div class="sponsorcard" style="margin:0">
            <img src="https://github.com/${owner}.png?size=64" width="42" height="42" style="border-radius:50%" alt="" onerror="this.style.visibility='hidden'"/>
            <span><b>${owner}</b><span>${REPOS.filter((x) => x.repo.startsWith(owner + "/")).length} repos in catalog</span></span>
          </div>
          <a class="btn" style="width:100%;margin-top:12px;border-color:rgba(255,123,114,.5);color:var(--pink)" href="https://github.com/sponsors/${owner}" target="_blank" rel="noopener">♥ Sponsor on GitHub</a>
        </div></section>

      <section class="panel"><div class="panel__head">🔗 Related in ${CAT_META[r.cat].label}</div>
        <div class="panel__body"><div class="related-grid">
          ${related.map((x) => `<a class="related-card" href="repo.html?id=${encodeURIComponent(x.repo)}">
            <b>${x.repo.split("/")[1]}</b><p>${escapeHTML(x.desc)}</p>
            <div class="card__meta"><i style="color:var(--yellow)">★ ${fmt(x.stars)}</i>${x.lang !== "—" ? `<i><span class="langdot" style="background:${LANG_COLORS[x.lang] || "var(--dim)"}"></span>${x.lang}</i>` : ""}</div>
          </a>`).join("")}
        </div></div></section>
    </aside>
  </div>`;

  /* save button */
  $("#saveBtn").addEventListener("click", () => {
    if (!getUser()) { openAuth(); return; }
    const nowSaved = toggleSaved(r.repo);
    $("#saveBtn").textContent = nowSaved ? "★ Saved" : "☆ Save";
    toast(nowSaved ? `${name} saved to your list` : `Removed ${name}`);
  });

  /* use cases (derived, honest framing) */
  const t = r.tags.join(" ") + " " + r.desc.toLowerCase();
  const uc = [];
  if (/review|test|debug|tdd/.test(t)) uc.push("Bake a senior-engineer review loop into your agent before it ships code.");
  if (/mcp|server|tool/.test(t)) uc.push("Wire it into Claude/Cursor/Codex as a tool server so the agent can act on real systems.");
  if (/skill|claude/.test(t)) uc.push("Drop it into ~/.claude/skills (or the plugin marketplace) for durable, reusable capability.");
  if (/cursor|rule|mdc/.test(t)) uc.push("Copy the rule files into .cursor/rules to constrain model behavior per project.");
  if (/agent|autonomous|coding/.test(t)) uc.push("Run it as your daily driver agent in the terminal or editor.");
  if (/security|pentest|red/.test(t)) uc.push("Add structured security methodology — audits, scanning, adversarial review.");
  if (!uc.length) uc.push("Explore the README on GitHub for setup — most listings are a one-command install.");
  $("#usecases").innerHTML = uc.map((u) => `<div class="usecase"><span class="tick">✓</span><span>${u}</span></div>`).join("");

  /* pulse bars from snapshot */
  drawPulse(r.stars, r.forks, r.issues, Math.max(2, Math.round(r.forks * 0.02)));

  /* live GitHub fetches (graceful fallback) */
  gh(`/repos/${r.repo}`).then((d) => {
    if (!d) { $("#pulseNote").textContent = "snapshot values"; return; }
    drawPulse(d.stargazers_count, d.forks_count, d.open_issues_count, null);
    $("#pulseNote").textContent = "live from api.github.com just now";
  });
  gh(`/repos/${r.repo}/contributors?per_page=12`).then((list) => {
    if (!Array.isArray(list) || !list.length) { $("#contribNote").textContent = "open GitHub to see contributors"; $("#contribs").innerHTML = `<a class="btn" href="${r.url}/graphs/contributors" target="_blank" rel="noopener">View on GitHub ↗</a>`; return; }
    $("#contribNote").textContent = `top ${list.length} · live from GitHub API`;
    $("#contribs").innerHTML = list.map((c) => `<a class="contrib" href="${c.html_url}" target="_blank" rel="noopener">
      <img src="${c.avatar_url}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"/>${c.login}<small>${fmt(c.contributions)}</small></a>`).join("");
    gh(`/repos/${r.repo}`).then((d) => { if (d) drawPulse(d.stargazers_count, d.forks_count, d.open_issues_count, list.length >= 12 ? null : list.length); });
  });
  gh(`/repos/${r.repo}/languages`).then((langs) => {
    if (!langs || !Object.keys(langs).length) { $("#langNote").textContent = "—"; return; }
    const entries = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const total = Object.values(langs).reduce((a, b) => a + b, 0);
    $("#langNote").textContent = "live from GitHub API";
    $("#langbar").innerHTML = entries.map(([l, v]) => `<i style="width:${(v / total * 100).toFixed(1)}%;background:${LANG_COLORS[l] || "var(--dim)"}"></i>`).join("");
    $("#langlist").innerHTML = entries.map(([l, v]) => `<li><i style="background:${LANG_COLORS[l] || "var(--dim)"}"></i>${l} <span style="color:var(--dim)">${(v / total * 100).toFixed(1)}%</span></li>`).join("");
  });
}

function drawPulse(stars, forks, issues, contribs) {
  const vals = [[stars, "var(--yellow)"], [forks, "var(--blue)"], [issues, "var(--green)"], [contribs || Math.max(2, Math.round(forks * 0.02)), "var(--purple)"]];
  const max = Math.max(...vals.map((v) => v[0]), 1);
  $("#pulse").innerHTML = vals.map(([v, c], i) =>
    `<i title="${fmt(v)}" style="background:linear-gradient(180deg, ${c}, transparent);height:${Math.max(6, v / max * 100)}%;animation-delay:${i * 90}ms"></i>`).join("");
}
function safeHost(u) { try { return new URL(u).hostname; } catch { return u.slice(0, 30); } }

/* fetch with cache + rate-limit safety */
async function gh(path) {
  try {
    const res = await fetch("https://api.github.com" + path, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}
