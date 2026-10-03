/**
 * Splits a generated 3×3 atlas into nine transparent 64×64 sprites.
 *   node scripts/extract-masterworks.mjs <atlas.png> id1,id2,...,id9
 * Background removal is adaptive: the atlas background colour is sampled from
 * the corners so every atlas (any dark navy shade) is handled identically.
 */
import { mkdirSync } from "node:fs";
import { Jimp, JimpMime } from "jimp";

const [source, list] = process.argv.slice(2);
if (!source || !list) {
  console.error("usage: node scripts/extract-masterworks.mjs <atlas> id1,...,id9");
  process.exit(1);
}
const names = list.split(",").map((s) => s.trim()).filter(Boolean);
const output = "public/masterworks";
mkdirSync(output, { recursive: true });

const atlas = await Jimp.read(source);
const { width, height } = atlas.bitmap;
const cols = 3;
const rows = Math.ceil(names.length / cols);
const cellW = Math.floor(width / cols);
const cellH = Math.floor(height / 3);

function cellBackground(img) {
  // Sample the cell's own border ring — atlases differ subtly per compartment.
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  const pts = [];
  for (let x = 0; x < w; x += 4) pts.push([x, 1], [x, h - 2]);
  for (let y = 0; y < h; y += 4) pts.push([1, y], [w - 2, y]);
  const acc = [0, 0, 0];
  for (const [x, y] of pts) {
    const c = img.getPixelColor(x, y);
    acc[0] += (c >>> 24) & 255;
    acc[1] += (c >>> 16) & 255;
    acc[2] += (c >>> 8) & 255;
  }
  return acc.map((v) => v / pts.length);
}

function processCell(index, tol) {
  const col = index % cols;
  const row = Math.floor(index / cols);
  const crop = atlas.clone().crop({
    x: col * cellW + 8,
    y: row * cellH + 8,
    w: cellW - 16,
    h: cellH - 16,
  });

  const bg = cellBackground(crop);
  const TOL = tol;
  // Tight tolerance: only the true background colour, so near-black armour
  // (shadow assassin) survives. Compartment edge lines are slightly lighter.
  const isBackground = (r, g, b) => {
    const d = Math.hypot(r - bg[0], g - bg[1], b - bg[2]);
    const isNavyish = b >= r && b >= g;
    return d < TOL || (isNavyish && d < TOL * 1.8 && Math.max(r, g, b) < 70);
  };
  const w = crop.bitmap.width;
  const h = crop.bitmap.height;
  const visited = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    const o = i * 4;
    const r = crop.bitmap.data[o];
    const g = crop.bitmap.data[o + 1];
    const b = crop.bitmap.data[o + 2];
    if (!isBackground(r, g, b)) return;
    visited[i] = 1;
    stack.push(x, y);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    crop.bitmap.data[(y * w + x) * 4 + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  // Strip residual compartment edge lines: opaque rows/cols hugging the border
  // whose opaque count spans >70% of the side are frame artefacts, not art.
  const opaqueAt = (x, y) => crop.bitmap.data[(y * w + x) * 4 + 3] > 0;
  for (let pass = 0; pass < 6; pass++) {
    for (const y of [pass, h - 1 - pass]) {
      let n = 0;
      for (let x = 0; x < w; x++) if (opaqueAt(x, y)) n++;
      if (n > w * 0.55) for (let x = 0; x < w; x++) crop.bitmap.data[(y * w + x) * 4 + 3] = 0;
    }
    for (const x of [pass, w - 1 - pass]) {
      let n = 0;
      for (let y = 0; y < h; y++) if (opaqueAt(x, y)) n++;
      if (n > h * 0.55) for (let y = 0; y < h; y++) crop.bitmap.data[(y * w + x) * 4 + 3] = 0;
    }
  }
  // Auto-crop to content, then fit into a 64 square with 2px margin.
  let minX = w,
    minY = h,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (crop.bitmap.data[(y * w + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
  if (maxX < 0) {
    return null;
  }
  const content = crop.clone().crop({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
  const size = Math.max(content.bitmap.width, content.bitmap.height);
  const square = new Jimp({ width: size, height: size, color: 0x00000000 });
  square.composite(content, Math.floor((size - content.bitmap.width) / 2), Math.floor((size - content.bitmap.height) / 2));
  square.resize({ w: 60, h: 60, mode: "nearestNeighbor" });
  const final = new Jimp({ width: 64, height: 64, color: 0x00000000 });
  final.composite(square, 2, 2);

  // Snap semi-transparent edge pixels: pixel art must be binary alpha.
  final.scan((x, y, o) => {
    const a = final.bitmap.data[o + 3];
    final.bitmap.data[o + 3] = a < 110 ? 0 : 255;
  });

  return final;
}

function boxiness(img) {
  // Fraction of the outer 3px ring of the 60px content box that is opaque.
  let ring = 0, total = 0;
  img.scan((x, y, o) => {
    const edge = x <= 4 || y <= 4 || x >= 59 || y >= 59;
    if (!edge) return;
    total++;
    if (img.bitmap.data[o + 3] > 0) ring++;
  });
  return ring / total;
}

for (let index = 0; index < names.length; index++) {
  const row = Math.floor(index / cols);
  if (row >= rows) break;
  let final = null;
  for (const tol of [22, 34, 48, 64, 84, 110]) {
    final = processCell(index, tol);
    if (!final) break;
    if (boxiness(final) < 0.35) break;
  }
  if (!final) {
    console.error(`WARN ${names[index]}: empty sprite`);
    continue;
  }
  await final.write(`${output}/${names[index]}.png`, { mime: JimpMime.png });
  console.log(`${output}/${names[index]}.png`);
}
