/**
 * Unifies the whole masterwork set into one coherent pack:
 *  1. median-cut palette quantisation (≤26 colours) — removes AI colour noise
 *  2. silhouette inking — every edge pixel is darkened toward a navy outline
 *  3. contrast + saturation lift so icons pop in the inventory grid
 *  4. speck removal — stray opaque islands under 4px are deleted
 * Run: node scripts/polish-masterworks.mjs
 */
import { readdirSync } from "node:fs";
import { Jimp, JimpMime } from "jimp";

const dir = "public/masterworks";
const files = readdirSync(dir).filter((f) => f.endsWith(".png")).sort();

function medianCut(colors, budget) {
  if (colors.length <= budget) return colors;
  const boxes = [colors];
  while (boxes.length < budget) {
    // split the box with the greatest channel range
    let best = -1;
    let bestRange = -1;
    boxes.forEach((box, i) => {
      if (box.length < 2) return;
      for (let ch = 0; ch < 3; ch++) {
        const vals = box.map((c) => c[ch]);
        const r = Math.max(...vals) - Math.min(...vals);
        if (r > bestRange) {
          bestRange = r;
          best = i;
        }
      }
    });
    if (best < 0) break;
    const box = boxes.splice(best, 1)[0];
    for (let ch = 0; ch < 3; ch++) {
      const vals = box.map((c) => c[ch]);
      const range = Math.max(...vals) - Math.min(...vals);
      if (range > 0) {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const lo = box.filter((c) => c[ch] < avg);
        const hi = box.filter((c) => c[ch] >= avg);
        boxes.push(lo.length ? lo : box.slice(0, 1));
        boxes.push(hi.length ? hi : box.slice(-1));
        break;
      }
    }
    if (box.length === boxes[boxes.length - 1]?.length && boxes.length > budget) break;
  }
  return boxes
    .filter((b) => b.length)
    .map((b) => [
      Math.round(b.reduce((a, c) => a + c[0], 0) / b.length),
      Math.round(b.reduce((a, c) => a + c[1], 0) / b.length),
      Math.round(b.reduce((a, c) => a + c[2], 0) / b.length),
    ]);
}

const OUTLINE = [16, 14, 28];

for (const file of files) {
  const im = await Jimp.read(`${dir}/${file}`);
  const w = im.bitmap.width;
  const h = im.bitmap.height;
  const data = im.bitmap.data;

  // --- 1. quantise palette ---------------------------------------------
  const seen = new Map();
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3] === 0) continue;
    const key = `${data[i * 4] >> 2},${data[i * 4 + 1] >> 2},${data[i * 4 + 2] >> 2}`;
    const cur = seen.get(key);
    if (cur) cur.n++;
    else seen.set(key, { c: [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]], n: 1 });
  }
  const palette = medianCut(
    [...seen.values()].map((v) => v.c),
    26,
  );
  const nearest = (r, g, b) => {
    let bi = 0;
    let bd = Infinity;
    palette.forEach((c, i) => {
      const d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2;
      if (d < bd) {
        bd = d;
        bi = i;
      }
    });
    return palette[bi];
  };

  const opaque = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3] === 0) continue;
    opaque[i] = 1;
    const [r, g, b] = nearest(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }

  // --- 4 (early). speck removal ----------------------------------------
  const seenPx = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (!opaque[i] || seenPx[i]) continue;
    const stack = [i];
    const comp = [];
    seenPx[i] = 1;
    while (stack.length) {
      const j = stack.pop();
      comp.push(j);
      const x = j % w;
      const y = (j / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const k = ny * w + nx;
        if (opaque[k] && !seenPx[k]) {
          seenPx[k] = 1;
          stack.push(k);
        }
      }
    }
    if (comp.length < 4) for (const j of comp) data[j * 4 + 3] = 0;
  }

  // --- 2 & 3. ink silhouette + lift contrast ---------------------------
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (data[i * 4 + 3] === 0) continue;
      let exposed = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
          exposed = true;
          break;
        }
        if (data[(ny * w + nx) * 4 + 3] === 0) {
          exposed = true;
          break;
        }
      }
      for (let c = 0; c < 3; c++) {
        let v = data[i * 4 + c];
        // S-curve around 128 plus a small saturation push.
        const t = v / 255;
        const curved = t + 0.18 * (t - 0.5) * (1 - Math.abs(t - 0.5) * 1.2);
        v = Math.max(0, Math.min(255, curved * 255));
        if (exposed) v = v * 0.62 + OUTLINE[c] * 0.38;
        data[i * 4 + c] = Math.round(v);
      }
    }
  }

  await im.write(`${dir}/${file}`, { mime: JimpMime.png });
}
console.log(`polished ${files.length} masterworks`);
