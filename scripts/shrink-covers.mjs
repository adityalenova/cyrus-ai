/* ══ shrink-covers.mjs — one-off optimizer for public/assets/hack/covers/live:
   everything becomes a 800px-wide, quality-78 .jpg (PNG photos from Commons
   are 3-5x heavier), and src/data/liveCovers.ts is rewritten to match.      ═ */
import { readFileSync, writeFileSync, readdirSync, unlinkSync, statSync } from "fs";
import sharp from "sharp";

const ROOT = process.env.INIT_CWD || process.cwd();
const DIR = `${ROOT}/public/assets/hack/covers/live`;
const MAP = `${ROOT}/src/data/liveCovers.ts`;

const files = readdirSync(DIR).filter((f) => /\.(jpe?g|png)$/i.test(f));
let kept = 0, dropped = 0, before = 0, after = 0;
const ids = new Set();

for (const f of files) {
  const path = `${DIR}/${f}`;
  const id = f.replace(/\.(jpe?g|png)$/i, "");
  before += statSync(path).size;
  try {
    const buf = readFileSync(path);           // buffer input so jpg->jpg in-place is allowed
    const out = `${DIR}/${id}.jpg`;
    const info = await sharp(buf).resize({ width: 800, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(out);
    if (out !== path) unlinkSync(path);
    after += info.size; ids.add(id); kept++;
  } catch (e) {
    console.warn("bad image, keeping as-is:", f, e.message);
    ids.add(id); kept++;                      // never delete source on failure
  }
}

const map = readFileSync(MAP, "utf8");
const entries = Object.fromEntries([...ids].sort().map((id) => [id, `/assets/hack/covers/live/${id}.jpg`]));
writeFileSync(MAP, map.replace(/\{[^}]*\}/, JSON.stringify(entries, null, 0).replace(/,"/g, ',\n  "').replace(/^\{/, "{\n  ").replace(/\}$/, "\n}")));
console.log(`kept ${kept}, dropped ${dropped}; ${(before / 1e6).toFixed(1)}MB -> ${(after / 1e6).toFixed(1)}MB`);
