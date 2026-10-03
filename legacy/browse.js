/* ══ browse.js — shelves + grid over the 528-repo snapshot ═════════ */
"use strict";

const state = { cat: "all", view: "shelves", gridShown: 60 };
const OFFICIAL_OWNERS = /^(anthropics|openai|microsoft|google-gemini|github|modelcontextprotocol|vercel|supabase|cloudflare|nvidia|docker|continuedev|cline|crewaiinc|langchain-ai|openhands|kilo-org|roocodeinc|aider-ai|sst|prefecthq|activepieces)/i;

const pool = () => REPOS.filter((r) => state.cat === "all" || r.cat === state.cat);

function cardHTML(r, rank) {
  const [owner, name] = r.repo.split("/");
  const href = `repo.html?id=${encodeURIComponent(r.repo)}`;
  const lc = LANG_COLORS[r.lang] || "var(--dim)";
  return `<a class="card" href="${href}">
    <div class="card__strip" style="background:${tileBG(r.repo)}">
      <span class="card__initials">${initials(r.repo)}</span>
      <span class="card__stars">★ ${fmt(r.stars)}</span>
      ${rank ? `<span class="card__rank">#${rank}</span>` : ""}
    </div>
    <div class="card__body">
      <span class="card__owner">${owner}</span>
      <span class="card__name">${name}</span>
      <p class="card__desc">${r.desc}</p>
      <div class="card__meta">
        ${r.lang !== "—" ? `<i><span class="langdot" style="--c:${lc};background:${lc}"></span>${r.lang}</i>` : ""}
        <i>⎇ ${fmt(r.forks)}</i><i>◉ ${fmt(r.issues)}</i><i>${r.license}</i>
      </div>
      <div class="card__foot"><span class="card__cta">Open profile →</span>
      <span class="tag" style="color:${CAT_META[r.cat].color};border-color:${CAT_META[r.cat].color}55">${CAT_META[r.cat].label}</span></div>
    </div>
  </a>`;
}

const ARROW = (dir) => `<button class="shelf__arrow" data-dir="${dir}" aria-label="Scroll ${dir}">
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4">${dir === "left" ? '<path d="m14.5 5.5-7 6.5 7 6.5"/>' : '<path d="m9.5 5.5 7 6.5-7 6.5"/>'}</svg></button>`;

function shelfHTML(id, title, note, repos, opts = {}) {
  if (!repos.length) return "";
  return `<section class="shelf reveal" data-shelf="${id}" ${opts.domId ? `id="${opts.domId}"` : ""}>
    <div class="shelf__head">
      <h2 class="shelf__title">${opts.swatch ? `<span class="swatch" style="background:${opts.swatch}"></span>` : ""}${title}</h2>
      <span class="shelf__count">${repos.length}</span>
      <span class="shelf__note">${note || ""}</span>
      <span class="shelf__rule"></span>
      <div class="shelf__nav">${ARROW("left")}${ARROW("right")}</div>
    </div>
    <div class="shelf__track">${repos.map((r, i) => cardHTML(r, opts.rank ? i + 1 : 0)).join("")}</div>
    <div class="rail"><div class="rail__thumb"></div></div>
  </section>`;
}

function renderShelves() {
  const p = pool().slice().sort(byStars);
  let html = shelfHTML("trending", "🔥 Trending now", "ranked by stars in this snapshot", p.slice(0, 24), { rank: true });
  const cats = state.cat === "all" ? Object.keys(CAT_META) : [state.cat];
  for (const c of cats) {
    const list = p.filter((r) => r.cat === c);
    for (let i = 0; i < list.length; i += 120) {
      const part = list.slice(i, i + 120);
      html += shelfHTML("cat-" + c + i, CAT_META[c].label + (i ? ` — more ${i / 120 + 1}` : ""),
        i ? "" : `${fmt(list.reduce((a, r) => a + r.stars, 0))} combined stars`, part,
        { swatch: CAT_META[c].color, domId: i === 0 ? "shelf-" + c : "" });
    }
  }
  if (state.cat === "all") {
    const official = p.filter((r) => OFFICIAL_OWNERS.test(r.repo) || r.tags.includes("official")).slice(0, 40);
    html += shelfHTML("official", "Official & first-party", "ships from the vendors themselves", official);
  }
  $("#shelvesWrap").innerHTML = html;
  $("#empty").hidden = !!html;
  wireShelves();
  initReveal();
}

function renderGrid() {
  const all = pool().slice().sort(byStars);
  $("#uigrid").innerHTML = all.slice(0, state.gridShown).map((r, i) => cardHTML(r, i + 1)).join("");
  $("#loadMore").hidden = all.length <= state.gridShown;
  $("#empty").hidden = all.length > 0;
}

function wireShelves() {
  $$(".shelf").forEach((shelf) => {
    const track = $(".shelf__track", shelf);
    const arrows = $$(".shelf__arrow", shelf);
    const thumb = $(".rail__thumb", shelf);
    const step = () => Math.round(track.clientWidth * 0.9);
    arrows.forEach((btn) => btn.addEventListener("click", () =>
      track.scrollBy({ left: (btn.dataset.dir === "left" ? -1 : 1) * step(), behavior: reduceMotion ? "auto" : "smooth" })));
    const sync = () => {
      arrows[0].disabled = track.scrollLeft < 8;
      arrows[1].disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 8;
      const visible = track.clientWidth / track.scrollWidth;
      if (thumb && visible < 0.98) {
        thumb.style.width = (visible * 100).toFixed(1) + "%";
        const frac = track.scrollLeft / (track.scrollWidth - track.clientWidth || 1);
        thumb.style.transform = `translateX(${frac * (thumb.parentElement.clientWidth - thumb.offsetWidth)}px)`;
        thumb.parentElement.style.visibility = "visible";
      } else if (thumb) thumb.parentElement.style.visibility = "hidden";
    };
    track.addEventListener("scroll", sync, { passive: true });
    requestAnimationFrame(sync);
    let down = false, startX = 0, startLeft = 0, moved = 0;
    track.addEventListener("pointerdown", (e) => { if (e.button !== 0) return; down = true; moved = 0; startX = e.clientX; startLeft = track.scrollLeft; track.classList.add("is-dragging"); });
    track.addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx)); track.scrollLeft = startLeft - dx; });
    const up = () => {
      if (!down) return; down = false; track.classList.remove("is-dragging");
      if (moved > 6) { const kill = (ev) => { ev.preventDefault(); ev.stopPropagation(); track.removeEventListener("click", kill, true); }; track.addEventListener("click", kill, true); setTimeout(() => track.removeEventListener("click", kill, true), 120); }
    };
    track.addEventListener("pointerup", up); track.addEventListener("pointerleave", up); track.addEventListener("pointercancel", up);
  });
}

function render() {
  $("#statusText").textContent = `${pool().length} repos${state.cat !== "all" ? " · " + CAT_META[state.cat].label : ""}`;
  $("#shelvesWrap").hidden = state.view !== "shelves";
  $("#gridWrap").hidden = state.view !== "grid";
  state.view === "shelves" ? renderShelves() : renderGrid();
  $$(".chip").forEach((c) => c.classList.toggle("is-active", c.dataset.cat === state.cat));
  $$("#viewToggle button").forEach((b) => b.classList.toggle("btn--accent", b.dataset.view === state.view));
}

/* chips */
$("#chips").innerHTML =
  `<button class="chip is-active" data-cat="all">✦ Everything <b>${REPOS.length}</b></button>` +
  Object.entries(CAT_META).map(([id, m]) => {
    const n = REPOS.filter((r) => r.cat === id).length;
    return `<button class="chip" data-cat="${id}"><span class="swatch" style="background:${m.color}"></span>${m.label} <b>${n}</b></button>`;
  }).join("");
$$(".chip").forEach((c) => c.addEventListener("click", () => { state.cat = c.dataset.cat; state.gridShown = 60; render(); }));
$$("#viewToggle button").forEach((b) => b.addEventListener("click", () => { state.view = b.dataset.view; render(); }));
$("#loadMore").addEventListener("click", () => { state.gridShown += 120; renderGrid(); });

/* deep links: browse.html#mcp etc */
if (location.hash && CAT_META[location.hash.slice(1)]) state.cat = location.hash.slice(1);
render();
