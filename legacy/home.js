/* ══ home.js — logo wall, program shelf, how-it-works panel, timeline, orgs marquee ══ */
"use strict";

/* ── hero logo wall (official org logos) ─────────────────── */
const WALL = ["google", "microsoft", "anthropics", "openai", "huggingface", "modelcontextprotocol",
  "vercel", "cloudflare", "langchain-ai", "ollama", "n8n-io", "kubernetes"];
$("#logoWall").innerHTML = WALL.map((o, i) => `
  <a class="logocell" href="org.html?id=${encodeURIComponent(o)}" style="--r:${(hash(o) % 9) - 4}deg;--d:${(i % 4) * .8 + (i % 3) * .3}s">
    <img src="${avatarOf(o, 120)}" alt="${o}" loading="lazy"
      onerror="this.parentNode.style.opacity=.35;this.remove()"/>
    <span class="cap">${o}</span>
  </a>`).join("");

/* ── top developer programs shelf ────────────────────────── */
const STATUS_LBL = { live: "● Live now", upcoming: "Upcoming", closed: "Closed" };
const SHELF_IDS = ["gsoc", "outreachy", "lfx", "oct"];
$("#progShelf").innerHTML = SHELF_IDS.map((id) => {
  const p = PROGRAMS.find((x) => x.id === id);
  return `<a class="progcard" href="${p.url}" target="_blank" rel="noopener">
    <img class="progcard__img" src="${p.img}" alt="" loading="lazy" onerror="this.style.display='none'"/>
    <div class="progcard__top">
      <span class="progcard__logo"><img src="${avatarOf(p.owner, 64)}" alt="${p.owner}" onerror="this.remove()"/></span>
      <span class="pill pill--${p.status}">${STATUS_LBL[p.status]}</span>
    </div>
    <div class="progcard__body">
      <span class="progcard__owner">${p.owner} · ${p.window}</span>
      <h3>${p.name}</h3>
      <p class="progcard__rule">${p.tag}</p>
      <div class="progcard__row">
        <span class="progcard__pay">${p.pay}<small>${p.payNote}</small></span>
        <span class="progcard__cta">Explore ↗</span>
      </div>
    </div>
    <div class="progcard__foot"><span>Orgs · <b>${p.orgs}</b></span><span>Seats · <b>${p.slots}</b></span></div>
  </a>`;
}).join("");

/* ── how-it-works: browser mock with typing code panel ───── */
const SEQ = {
  "find-issue": [
    `<span class="t-c">// cyrus projects → filter: kubernetes, good-first-issue</span>`,
    `<span class="t-f">search</span>(<span class="t-s">"is:issue is:open label:\"good first issue\""</span>)`,
    `<span class="t-g">✓</span> 42 open issues · median first-review: <span class="t-y">11h</span>`,
    `<span class="t-f">pick</span>(<span class="t-o">#3</span>) → <span class="t-s">"add fluent-bit helm test"</span>`,
    `<span class="t-g">✓</span> saved to dashboard · deadline Nov 14 <span class="caret"></span>`,
  ],
  "terminal": [
    `<span class="t-c">$</span> <span class="t-f">npx</span> cyrus add anthropics/skills`,
    `<span class="t-g">✓</span> resolved skill: test-driven-development`,
    `<span class="t-g">✓</span> installed → ~/.claude/skills/tdd`,
    `<span class="t-c">$</span> <span class="t-f">claude</span> "fix issue #3, TDD, then open a PR"`,
    ``,
    `<span class="t-y">◆ agent</span> writing tests first (red)`,
    `<span class="t-y">◆ agent</span> implementing (green) → 14/14 passing`,
    `<span class="t-g">✓</span> PR opened in 3m 41s · <span class="t-c">awaiting review</span> <span class="caret"></span>`,
  ],
  "dashboard": [
    `<span class="t-c"># your saved shortlist — October</span>`,
    `<span class="t-k">project</span>   <span class="t-k">program window</span>      <span class="t-k">progress</span>`,
    `<span class="t-s">kubernetes</span>   Hacktoberfest <span class="t-g">open</span>      <span class="t-y">▮▮▮▮▮▮░░</span> 62%`,
    `<span class="t-s">wikimedia</span>  Outreachy     <span class="t-o">Nov 1</span>       <span class="t-y">▮▮▮░░░░░</span> 30%`,
    `<span class="t-s">pytorch</span>    GSoC          <span class="t-g">open</span>      <span class="t-y">▮▮▮▮▮▮▮▮</span> 88%`,
    ``,
    `<span class="t-g">✓</span> streak: <span class="t-f">9 days</span> · 3 PRs merged this month <span class="caret"></span>`,
  ],
};
const TABS = Object.keys(SEQ);
let tabIdx = 0;

const heroPanel = $("#heroPanel");
heroPanel.innerHTML = `<div class="codepanel__bar">
    <div class="codepanel__tabs" id="cpTabs">${TABS.map((t, i) => `<span class="codepanel__tab ${i === 0 ? "is-on" : ""}">${t}</span>`).join("")}</div>
  </div>
  <div class="codepanel__body" id="cpBody" aria-hidden="true"></div>
  <div class="codepanel__foot"><span class="ok">● agent ready</span><span>cyrus add → merged</span></div>`;

function typeSeq(name) {
  const body = $("#cpBody");
  const lines = SEQ[name];
  body.innerHTML = "";
  const out = document.createElement("div");
  body.appendChild(out);
  let li = 0;
  const lineEl = () => { const d = document.createElement("div"); d.className = "ln"; d.dataset.n = li + 1; out.appendChild(d); return d; };
  function nextLine() {
    if (li >= lines.length) { setTimeout(() => { tabIdx = (tabIdx + 1) % TABS.length; setTab(); }, 3200); return; }
    const src = lines[li]; const el = lineEl(); li++;
    const tmp = document.createElement("div"); tmp.innerHTML = src;
    const total = tmp.textContent.length;
    let ci = 0;
    (function step() {
      if (ci >= total) { el.innerHTML = src; setTimeout(nextLine, 120); return; }
      ci = Math.min(total, ci + Math.max(1, Math.round(total / 40)));
      el.innerHTML = sliceHTML(src, ci);
      setTimeout(step, reduceMotion ? 0 : 16);
    })();
  }
  if (reduceMotion) { out.innerHTML = lines.map((l, i) => `<div class="ln" data-n="${i + 1}">${l}</div>`).join(""); setTimeout(() => { tabIdx = (tabIdx + 1) % TABS.length; setTab(); }, 6000); return; }
  nextLine();
}
function sliceHTML(html, n) {
  let count = 0, out = "", inTag = false;
  for (const ch of html) {
    if (ch === "<") { inTag = true; out += ch; continue; }
    if (ch === ">") { inTag = false; out += ch; continue; }
    if (inTag) { out += ch; continue; }
    if (count >= n) break;
    out += ch; count++;
  }
  const open = (out.match(/<span[^>]*>/g) || []).length - (out.match(/<\/span>/g) || []).length;
  return out + "</span>".repeat(Math.max(0, open)) + '<span class="caret"></span>';
}
function setTab() {
  $$("#cpTabs .codepanel__tab").forEach((t, i) => t.classList.toggle("is-on", i === tabIdx));
  typeSeq(TABS[tabIdx]);
}
$$("#cpTabs .codepanel__tab").forEach((t, i) => t.addEventListener("click", () => { tabIdx = i; setTab(); }));
setTab();

/* ── trust row ───────────────────────────────────────────── */
const TRUST = ["rust-lang", "pytorch", "tensorflow", "flutter", "godotengine", "wikimedia", "mozilla", "gnome", "docker", "jupyterlab"];
$("#trustRow").innerHTML = `<span class="lbl">Contributors land at</span>` + TRUST.map((o) =>
  `<a href="org.html?id=${encodeURIComponent(o)}"><img src="${avatarOf(o, 80)}" alt="${o}" loading="lazy" title="${o}" onerror="this.style.display='none'"/></a>`).join("");

/* ── white cards — top-starred projects ──────────────────── */
$("#whiteCards").innerHTML = `<div style="grid-column:1/-1;margin-bottom:-4px">
    <span class="section-tag">Most-starred in the catalog</span>
  </div>` + REPOS.slice().sort(byStars).slice(0, 4).map((r) => {
  const [owner, name] = r.repo.split("/");
  return `<a class="wcard" href="repo.html?id=${encodeURIComponent(r.repo)}">
    <div class="wcard__head">
      <img src="${avatarOf(owner, 96)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"/>
      <span><h4>${name}</h4><span class="owner">${owner}</span></span>
    </div>
    <p>${r.desc}</p>
    <div class="wcard__foot">
      <span class="chipm chipm--cat">${CAT_META[r.cat].label}</span>
      <span class="stars">★ ${fmt(r.stars)}</span>
    </div>
  </a>`;
}).join("");

/* ── program timeline (12-month Gantt) ───────────────────── */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const NOW_M = 9, NOW_FR = 9 + 2 / 31, NAMECOL = 230, GAP = 14;
(function renderTimeline() {
  const box = $("#timelineBox");
  const months = `<div class="tl__months"><div class="spacer"></div><div class="tl__monthgrid">${MONTHS.map((m, i) =>
    `<span class="${i === NOW_M ? "is-now" : ""}">${m}</span>`).join("")}</div></div>`;
  const rows = PROGRAMS.map((p) => {
    const segs = [];
    p.phases.forEach((ph) => {
      if (ph.e > ph.s) segs.push(ph);
      else { segs.push({ ...ph, s: ph.s, e: 12 }); segs.push({ ...ph, s: 0, e: ph.e, label: "" }); }
    });
    const pills = segs.map((ph) => {
      const left = (ph.s / 12 * 100).toFixed(3), w = ((ph.e - ph.s) / 12 * 100).toFixed(3);
      const cls = ph.active || (ph.s <= NOW_FR && NOW_FR < ph.e) ? " is-active" : (ph.e < NOW_FR ? " is-done" : "");
      return `<span class="tl__phase${cls}" style="left:${left}%;width:${w}%;--pc:${ph.c}" title="${p.name} — ${ph.label}">${ph.label}</span>`;
    }).join("");
    return `<div class="tl__row">
      <span class="tl__name" style="--pc:${p.phases[0].c}">
        <img src="${avatarOf(p.owner, 48)}" alt="" loading="lazy" onerror="this.style.display='none'"/>
        <em>${p.name}</em>
      </span>
      <div class="tl__track">${pills}</div>
    </div>`;
  }).join("");
  const nowLine = `<span class="tl__now" style="left:calc(${NAMECOL + GAP}px + (100% - ${NAMECOL + GAP}px) * ${(NOW_FR / 12).toFixed(4)})"></span>`;
  const legend = [["#3b6ea5", "Applications"], ["#b4602c", "Windows"], ["#3e7d4f", "Coding / active"], ["#7a5aa8", "Bonding & cohorts"]]
    .map(([c, l]) => `<span><i style="background:${c}"></i>${l}</span>`).join("");
  box.innerHTML = months + `<div class="tl__rows">${nowLine}${rows}</div>` +
    `<div class="tl__foot"><div class="tl__legend">${legend}</div><a class="btn btn--sm" href="#programs">All programs ↑</a></div>`;
})();

/* ── popular organizations marquee ───────────────────────── */
(function buildOrgMarquee() {
  const row = $("#orgMarq");
  const slides = ORGS.map((o) => `<a class="orgslide" href="org.html?id=${encodeURIComponent(o.login)}">
    <img src="${avatarOf(o.login, 88)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"/>
    <span class="txt"><b>${o.name}</b><span>${o.tagline}</span>
      <span class="st">★ ${fmt(o.stars)} · ${o.repos} repos</span></span>
  </a>`).join("");
  row.innerHTML = slides + slides;
})();

/* guest CTA shortcut */
$("#ctaSignIn")?.addEventListener("click", openAuth);
