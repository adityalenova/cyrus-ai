/* ══ fetch-credits.mjs (npm run covers) — official-page credits for the
   live Devpost hackathons. Cover artwork is NOT fetched anymore: every
   card renders the dark warm-gradient HackCover SVG defined in
   src/pages/Hackathons.tsx. This script only pulls each event's official
   page URL + title from the Devpost API so the "event (c)" credit pill on
   each card can link straight to the organizer's listing.
   Output: src/data/liveCovers.ts  ->  LIVE_CREDITS map
   Run: npm run covers                                              ═ */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_TS = join(ROOT, "src/data/liveCovers.ts");

const UA = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Accept": "application/json, text/javascript, */*; q=0.01",
  "X-Requested-With": "XMLHttpRequest",
  "Referer": "https://devpost.com/hackathons",
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── Devpost API: id -> { url, title } across all statuses ──── */
async function devpostMap() {
  const map = new Map();
  for (const status of ["open", "upcoming", "ended"]) {
    for (let page = 1; page <= 16; page++) {
      let j;
      try {
        const r = await fetch(`https://devpost.com/api/hackathons?status[]=${status}&order_by=prize-amount&page=${page}`, { headers: UA });
        if (!r.ok) { console.error(`  ${status} page ${page}: HTTP ${r.status}`); break; }
        j = await r.json();
      } catch (e) { console.error(`  ${status} page ${page}: ${String(e.message).slice(0, 60)}`); break; }
      const list = j.hackathons || [];
      if (!list.length) break;
      for (const h of list) {
        const k = String(h.id);
        if (!map.has(k)) map.set(k, { url: h.url || "", title: h.title || "" });
      }
      await sleep(350);
    }
    console.log(`devpost ${status}: ${map.size} unique events so far`);
  }
  return map;
}

(async () => {
  const liveSrc = readFileSync(join(ROOT, "src/data/hackathonsLive.ts"), "utf8");
  const ids = [...liveSrc.matchAll(/"id":"(devpost-(\d+))"/g)].map((m) => ({ key: m[1], num: m[2] }));
  console.log(`live events: ${ids.length}`);

  const api = await devpostMap();
  const credits = {};
  let ok = 0, miss = 0;
  for (const { key, num } of ids) {
    const rec = api.get(num);
    if (rec && rec.url) {
      credits[key] = { label: "Devpost", url: rec.url, title: rec.title };
      ok++;
    } else miss++;
  }
  console.log(`official-page credits: ${ok} ok, ${miss} without an API hit`);

  const lines = [];
  lines.push(`/* ══ liveCovers.ts - hackathon credit data, fetched by npm run covers.
   Covers themselves are the dark warm-gradient HackCover SVGs in
   src/pages/Hackathons.tsx (no photos). LIVE_CREDITS maps each live Devpost
   id to {label, url, title}: the organizer's official event page shown in the
   "event (c)" credit pill on each card. Ids missing here fall back to the
   event's own page via creditFor(). ═ */

export interface CoverCredit { label: string; url: string; title?: string }

export const LIVE_CREDITS: Record<string, CoverCredit> = {`);
  for (const { key } of ids) if (credits[key]) {
    const c = credits[key];
    lines.push(`  "${key}":{label:${JSON.stringify(c.label)},url:${JSON.stringify(c.url)},title:${JSON.stringify(c.title)}},`);
  }
  lines.push(`};
`);
  writeFileSync(OUT_TS, lines.join("\n"));
  console.log(`wrote src/data/liveCovers.ts (${Object.keys(credits).length} credits)`);
})();
