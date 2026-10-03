import { Tex, createTex, cloneTex, clamp, hash2, rgbToHsl, rgbToHex } from './tex';

export type RGB = [number, number, number];
const idx = (t: Tex, x: number, y: number) => (y * t.w + x) * 4;
export const alphaAt = (t: Tex, x: number, y: number) => (x < 0 || y < 0 || x >= t.w || y >= t.h ? 0 : t.d[idx(t, x, y) + 3]);
export const isOpaqueTex = (t: Tex) => { for (let i = 3; i < t.d.length; i += 4) if (t.d[i] < 128) return false; return true; };
export const px = (t: Tex) => Math.max(1, Math.round(Math.max(t.w, t.h) / 16));

export function bounds(t: Tex) {
  let x0 = t.w, y0 = t.h, x1 = -1, y1 = -1;
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) if (t.d[idx(t, x, y) + 3] >= 128) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (x1 < 0) return { x0: 0, y0: 0, x1: t.w - 1, y1: t.h - 1, cx: t.w / 2, cy: t.h / 2 };
  return { x0, y0, x1, y1, cx: (x0 + x1 + 1) / 2, cy: (y0 + y1 + 1) / 2 };
}
/** Grip of an item: opaque pixel nearest to the bottom-left corner (Minecraft convention). */
export function handleOf(t: Tex): [number, number] {
  let best: [number, number] = [t.w * 0.25, t.h * 0.75], bd = Infinity;
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) if (t.d[idx(t, x, y) + 3] >= 128) { const d = x + (t.h - 1 - y); if (d < bd) { bd = d; best = [x + 0.5, y + 0.5]; } }
  return best;
}
export function tipOf(t: Tex): [number, number] {
  let best: [number, number] = [t.w * 0.75, t.h * 0.25], bd = -Infinity;
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) if (t.d[idx(t, x, y) + 3] >= 128) { const d = x + (t.h - 1 - y); if (d > bd) { bd = d; best = [x + 0.5, y + 0.5]; } }
  return best;
}
export function axisAngle(t: Tex) { const [hx, hy] = handleOf(t), [tx, ty] = tipOf(t); return Math.atan2(ty - hy, tx - hx); }
export function reach(t: Tex) { const [hx, hy] = handleOf(t), [tx, ty] = tipOf(t); return Math.max(1, Math.hypot(tx - hx, ty - hy)); }

export function transformTex(src: Tex, inverse: (x: number, y: number) => [number, number]): Tex {
  const out = createTex(src.w, src.h);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const [sx, sy] = inverse(x + 0.5, y + 0.5);
    const ix = Math.floor(sx), iy = Math.floor(sy);
    if (ix < 0 || iy < 0 || ix >= src.w || iy >= src.h) continue;
    const s = idx(src, ix, iy), o = idx(out, x, y);
    out.d[o] = src.d[s]; out.d[o + 1] = src.d[s + 1]; out.d[o + 2] = src.d[s + 2]; out.d[o + 3] = src.d[s + 3];
  }
  return out;
}
/** Rotate by deg (clockwise on screen) and scale about a pivot, then translate. */
export function rotateAbout(src: Tex, deg: number, pxv: number, pyv: number, scale = 1, dx = 0, dy = 0): Tex {
  if (!deg && scale === 1 && !dx && !dy) return src;
  const r = (-deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return transformTex(src, (x, y) => { const ox = x - dx - pxv, oy = y - dy - pyv; return [pxv + (ox * c - oy * s) / scale, pyv + (ox * s + oy * c) / scale]; });
}
export const translateTex = (src: Tex, dx: number, dy: number) => (dx || dy ? transformTex(src, (x, y) => [x - dx, y - dy]) : src);
/** Largest scale (≤ k) about the pivot that keeps the opaque box inside the canvas. */
export function safeScale(t: Tex, k: number, pxv: number, pyv: number) {
  const b = bounds(t);
  let m = k;
  for (const [cx, cy] of [[b.x0, b.y0], [b.x1 + 1, b.y0], [b.x0, b.y1 + 1], [b.x1 + 1, b.y1 + 1]]) {
    const ox = cx - pxv, oy = cy - pyv;
    if (ox > 0.01) m = Math.min(m, (t.w - pxv) / ox); if (ox < -0.01) m = Math.min(m, pxv / -ox);
    if (oy > 0.01) m = Math.min(m, (t.h - pyv) / oy); if (oy < -0.01) m = Math.min(m, pyv / -oy);
  }
  return Math.max(0.3, m);
}
export const scaleAbout = (src: Tex, k: number, pxv: number, pyv: number) => rotateAbout(src, 0, pxv, pyv, safeScale(src, k, pxv, pyv));

export function composite(dst: Tex, src: Tex, opacity = 1): Tex {
  const out = cloneTex(dst);
  for (let i = 0; i < out.d.length; i += 4) {
    const sa = (src.d[i + 3] / 255) * opacity;
    if (sa <= 0) continue;
    const da = out.d[i + 3] / 255, oa = sa + da * (1 - sa);
    for (let q = 0; q < 3; q++) out.d[i + q] = (src.d[i + q] * sa + out.d[i + q] * da * (1 - sa)) / oa;
    out.d[i + 3] = oa * 255;
  }
  return out;
}
export function silhouette(src: Tex, color: RGB, opacity = 1): Tex {
  const out = cloneTex(src);
  for (let i = 0; i < out.d.length; i += 4) { if (!out.d[i + 3]) continue; out.d[i] = color[0]; out.d[i + 1] = color[1]; out.d[i + 2] = color[2]; out.d[i + 3] *= opacity; }
  return out;
}
export function withAlpha(src: Tex, k: number): Tex { const out = cloneTex(src); for (let i = 3; i < out.d.length; i += 4) out.d[i] *= k; return out; }
export function tintTex(src: Tex, color: RGB, k: number): Tex {
  const out = cloneTex(src);
  for (let i = 0; i < out.d.length; i += 4) { if (!out.d[i + 3]) continue; for (let q = 0; q < 3; q++) out.d[i + q] += (color[q] - out.d[i + q]) * k; }
  return out;
}
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export function dilate(src: Tex, n = 1, shade = 0.82): Tex {
  let cur = src;
  for (let p = 0; p < n; p++) {
    const next = cloneTex(cur);
    for (let y = 0; y < cur.h; y++) for (let x = 0; x < cur.w; x++) {
      if (alphaAt(cur, x, y) >= 128) continue;
      for (const [ox, oy] of N4) if (alphaAt(cur, x + ox, y + oy) >= 128) {
        const s = idx(cur, x + ox, y + oy), o = idx(next, x, y);
        next.d[o] = cur.d[s] * shade; next.d[o + 1] = cur.d[s + 1] * shade; next.d[o + 2] = cur.d[s + 2] * shade; next.d[o + 3] = 255; break;
      }
    }
    cur = next;
  }
  return cur;
}
export function erode(src: Tex, n = 1, chance = 1, seed = 1): Tex {
  let cur = src;
  for (let p = 0; p < n; p++) {
    const next = cloneTex(cur);
    for (let y = 0; y < cur.h; y++) for (let x = 0; x < cur.w; x++) {
      if (alphaAt(cur, x, y) < 128) continue;
      const edge = N4.some(([ox, oy]) => alphaAt(cur, x + ox, y + oy) < 128);
      if (edge && hash2(x, y, seed + p) < chance) next.d[idx(next, x, y) + 3] = 0;
    }
    cur = next;
  }
  return cur;
}
export function edgePixels(t: Tex) {
  const out: { x: number; y: number; nx: number; ny: number }[] = [];
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) {
    if (alphaAt(t, x, y) < 128) continue;
    let nx = 0, ny = 0;
    for (const [ox, oy] of N4) if (alphaAt(t, x + ox, y + oy) < 128) { nx += ox; ny += oy; }
    if (nx || ny) out.push({ x, y, nx: Math.sign(nx), ny: Math.sign(ny) });
  }
  return out;
}
const pick = <T,>(arr: T[], count: number, seed: number, minDist: number, key: (v: T) => [number, number]) => {
  const chosen: T[] = [];
  const order = arr.map((v, i) => ({ v, r: hash2(i, 7, seed) })).sort((a, b) => a.r - b.r).map((o) => o.v);
  for (const v of order) {
    if (chosen.length >= count) break;
    const [x, y] = key(v);
    if (chosen.every((c) => { const [cx, cy] = key(c); return Math.hypot(cx - x, cy - y) >= minDist; })) chosen.push(v);
  }
  return chosen;
};
/** Protrusions (spikes / serrations) along the far part of the item. */
export function addSpikes(src: Tex, count: number, color: RGB, seed: number, length = 1): Tex {
  const [hx, hy] = handleOf(src), R = reach(src), s = px(src);
  const cands = edgePixels(src).filter((e) => Math.hypot(e.x - hx, e.y - hy) > R * 0.4);
  const out = cloneTex(src);
  for (const e of pick(cands, count, seed, s * 2.5, (v) => [v.x, v.y])) for (let l = 1; l <= length * s; l++) {
    const x = e.x + e.nx * l, y = e.y + e.ny * l;
    if (x < 0 || y < 0 || x >= src.w || y >= src.h || alphaAt(out, x, y) >= 128) break;
    const o = idx(out, x, y), k = 1 - (l / (length * s + 1)) * 0.5;
    out.d[o] = color[0] * k; out.d[o + 1] = color[1] * k; out.d[o + 2] = color[2] * k; out.d[o + 3] = 255;
  }
  return out;
}
/** Small shaded gems near the grip / guard region. */
export function addGems(src: Tex, count: number, color: RGB, seed: number): Tex {
  const [hx, hy] = handleOf(src), R = reach(src), s = px(src);
  const cands: [number, number][] = [];
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    if (alphaAt(src, x, y) < 128) continue;
    const d = Math.hypot(x + 0.5 - hx, y + 0.5 - hy);
    if (d > R * 0.12 && d < R * 0.5 && x + s <= src.w && y + s <= src.h) cands.push([x, y]);
  }
  const out = cloneTex(src);
  for (const [gx, gy] of pick(cands, count, seed + 3, s * 2.2, (v) => v)) for (let yy = 0; yy < s; yy++) for (let xx = 0; xx < s; xx++) {
    const o = idx(out, gx + xx, gy + yy);
    const k = xx === 0 || yy === 0 ? 1.35 : xx === s - 1 || yy === s - 1 ? 0.65 : 1;
    out.d[o] = clamp(color[0] * k + (k > 1 ? 40 : 0)); out.d[o + 1] = clamp(color[1] * k + (k > 1 ? 40 : 0)); out.d[o + 2] = clamp(color[2] * k + (k > 1 ? 40 : 0)); out.d[o + 3] = 255;
  }
  return out;
}
function blendPx(t: Tex, x: number, y: number, c: RGB, a: number) {
  if (x < 0 || y < 0 || x >= t.w || y >= t.h || a <= 0) return;
  const o = idx(t, x, y), da = t.d[o + 3] / 255, oa = a + da * (1 - a);
  for (let q = 0; q < 3; q++) t.d[o + q] = (c[q] * a + t.d[o + q] * da * (1 - a)) / oa;
  t.d[o + 3] = oa * 255;
}
const normAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
/** Arc ring segment (slash trails, shock waves, magic rings). Angles in radians, screen coords. */
export function drawArc(t: Tex, cx: number, cy: number, radius: number, a0: number, a1: number, color: RGB, alpha: number, thickness = 1, fade = true): Tex {
  const out = cloneTex(t);
  const sweep = a1 - a0;
  const total = Math.abs(sweep) < 1e-6 ? Math.PI * 2 : Math.abs(sweep);
  const start = sweep >= 0 ? a0 : a1;
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy);
    if (Math.abs(d - radius) > thickness / 2) continue;
    let rel = normAngle(Math.atan2(dy, dx) - start);
    if (rel < 0) rel += Math.PI * 2;
    if (rel > total) continue;
    const k = fade ? (sweep >= 0 ? rel / total : 1 - rel / total) : 1;
    blendPx(out, x, y, color, alpha * (0.35 + 0.65 * k));
  }
  return out;
}
export function drawCircle(t: Tex, cx: number, cy: number, radius: number, color: RGB, alpha: number, thickness = 1) {
  return drawArc(t, cx, cy, radius, 0, 0, color, alpha, thickness, false);
}
function line(t: Tex, x0: number, y0: number, x1: number, y1: number, c: RGB, a: number, w: number) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let n = 0; n < 1024; n++) {
    for (let ox = 0; ox < w; ox++) for (let oy = 0; oy < w; oy++) blendPx(t, x0 + ox, y0 + oy, c, a);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
/** Jagged lightning bolt with a bright core. */
export function drawBolt(t: Tex, x0: number, y0: number, x1: number, y1: number, color: RGB, seed: number, alpha = 1): Tex {
  const out = cloneTex(t), s = px(t), segs = 7;
  const len = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
  const pts: [number, number][] = [[x0, y0]];
  for (let i = 1; i < segs; i++) { const k = i / segs, j = (hash2(i, seed, 11) - 0.5) * len * 0.22; pts.push([x0 + (x1 - x0) * k + nx * j, y0 + (y1 - y0) * k + ny * j]); }
  pts.push([x1, y1]);
  for (let i = 0; i < pts.length - 1; i++) {
    line(out, Math.round(pts[i][0]), Math.round(pts[i][1]), Math.round(pts[i + 1][0]), Math.round(pts[i + 1][1]), color, alpha * 0.7, s + 1);
    line(out, Math.round(pts[i][0]), Math.round(pts[i][1]), Math.round(pts[i + 1][0]), Math.round(pts[i + 1][1]), [255, 255, 255], alpha, Math.max(1, s - 1));
    if (hash2(i, seed, 5) < 0.4) { const b = pts[i]; line(out, Math.round(b[0]), Math.round(b[1]), Math.round(b[0] + (hash2(i, seed, 9) - 0.5) * len * 0.3), Math.round(b[1] + len * 0.2), color, alpha * 0.5, s); }
  }
  return out;
}
export function drawSparks(t: Tex, cx: number, cy: number, count: number, spread: number, color: RGB, seed: number, alpha = 1): Tex {
  const out = cloneTex(t), s = px(t);
  for (let i = 0; i < count; i++) {
    const a = hash2(i, seed, 3) * Math.PI * 2, r = hash2(i, seed, 4) * spread;
    const x = Math.floor(cx + Math.cos(a) * r), y = Math.floor(cy + Math.sin(a) * r);
    for (let yy = 0; yy < s; yy++) for (let xx = 0; xx < s; xx++) blendPx(out, x + xx, y + yy, color, alpha * (0.5 + 0.5 * hash2(i, seed, 6)));
  }
  return out;
}
/** Most vivid colour of a texture, used as the default accent. */
export function accentOf(t: Tex): string {
  let best = '#b9ed80', bs = -1;
  const seen = new Map<string, number>();
  for (let i = 0; i < t.d.length; i += 4) {
    if (t.d[i + 3] < 128) continue;
    const key = rgbToHex(t.d[i], t.d[i + 1], t.d[i + 2]);
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  seen.forEach((n, hex) => {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const [, s, l] = rgbToHsl(r, g, b);
    const score = s * (1 - Math.abs(l - 0.55) * 1.4) * Math.sqrt(n);
    if (score > bs) { bs = score; best = hex; }
  });
  return best;
}
export const shakeOffset = (seed: number, i: number, amp: number): [number, number] => [Math.round((hash2(i, 1, seed) - 0.5) * 2 * amp), Math.round((hash2(i, 2, seed) - 0.5) * 2 * amp)];

const axisCache = new WeakMap<Tex, ReturnType<typeof calculateAxis>>();
function calculateAxis(t: Tex) {
  const [hx, hy] = handleOf(t), [tx, ty] = tipOf(t);
  const len = Math.max(1, Math.hypot(tx - hx, ty - hy));
  return { hx, hy, tx, ty, ax: (tx - hx) / len, ay: (ty - hy) / len, px: -(ty - hy) / len, py: (tx - hx) / len, len };
}
export function axis(t: Tex) {
  let cached = axisCache.get(t);
  if (!cached) { cached = calculateAxis(t); axisCache.set(t, cached); }
  return cached;
}
/** 0 at the grip, 1 at the tip. */
export const along = (t: Tex, x: number, y: number) => {
  const a = axis(t);
  return ((x + 0.5 - a.hx) * a.ax + (y + 0.5 - a.hy) * a.ay) / a.len;
};
export type Zone = 'handle' | 'guard' | 'blade' | 'tip';
export const zoneOf = (t: Tex, x: number, y: number): Zone => {
  const u = along(t, x, y);
  return u < 0.22 ? 'handle' : u < 0.42 ? 'guard' : u < 0.82 ? 'blade' : 'tip';
};

export function put(t: Tex, x: number, y: number, c: RGB, a = 255) {
  if (x < 0 || y < 0 || x >= t.w || y >= t.h) return;
  const o = idx(t, x, y);
  t.d[o] = c[0]; t.d[o + 1] = c[1]; t.d[o + 2] = c[2]; t.d[o + 3] = a;
}
export function sample(t: Tex, x: number, y: number): [number, number, number, number] {
  if (x < 0 || y < 0 || x >= t.w || y >= t.h) return [0, 0, 0, 0];
  const o = idx(t, x, y);
  return [t.d[o], t.d[o + 1], t.d[o + 2], t.d[o + 3]];
}

/** Keep the original shading. Only the hue/material changes. */
export function remapLuma(src: Tex, dark: RGB, mid: RGB, light: RGB, amount = 1): Tex {
  const out = cloneTex(src);
  let lo = 255, hi = 0;
  for (let i = 0; i < src.d.length; i += 4) if (src.d[i + 3] >= 128) {
    const l = 0.299 * src.d[i] + 0.587 * src.d[i + 1] + 0.114 * src.d[i + 2];
    lo = Math.min(lo, l); hi = Math.max(hi, l);
  }
  const span = Math.max(8, hi - lo);
  const mix3 = (t: number): RGB => {
    if (t < 0.5) { const k = t * 2; return dark.map((v, i) => v + (mid[i] - v) * k) as RGB; }
    const k = (t - 0.5) * 2; return mid.map((v, i) => v + (light[i] - v) * k) as RGB;
  };
  for (let i = 0; i < out.d.length; i += 4) {
    if (out.d[i + 3] < 8) continue;
    const l = (0.299 * src.d[i] + 0.587 * src.d[i + 1] + 0.114 * src.d[i + 2] - lo) / span;
    const c = mix3(Math.min(1, Math.max(0, l)));
    for (let q = 0; q < 3; q++) out.d[i + q] = src.d[i + q] + (c[q] - src.d[i + q]) * amount;
  }
  return out;
}

export function outline1(src: Tex, color: RGB, onlyTransparent = true): Tex {
  const out = cloneTex(src);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    if (onlyTransparent && alphaAt(src, x, y) >= 128) continue;
    if (!onlyTransparent && alphaAt(src, x, y) < 128) continue;
    const hit = N4.some(([ox, oy]) => onlyTransparent ? alphaAt(src, x + ox, y + oy) >= 128 : alphaAt(src, x + ox, y + oy) < 128);
    if (hit) {
      if (onlyTransparent) put(out, x, y, color, 255);
      else { const o = idx(out, x, y); for (let q = 0; q < 3; q++) out.d[o + q] = out.d[o + q] * 0.45 + color[q] * 0.55; }
    }
  }
  return out;
}

/** Grow the blade along its own axis by `pixels`, copying existing blade colours. */
export function extendBlade(src: Tex, pixels: number): Tex {
  if (pixels <= 0 || isOpaqueTex(src)) return src;
  const a = axis(src), out = cloneTex(src);
  const copies: { x: number; y: number; c: [number, number, number, number] }[] = [];
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    if (alphaAt(src, x, y) < 128) continue;
    if (along(src, x, y) < 0.55) continue;
    copies.push({ x, y, c: sample(src, x, y) });
  }
  for (const p of copies) for (let k = 1; k <= pixels; k++) {
    const nx = Math.round(p.x + a.ax * k), ny = Math.round(p.y + a.ay * k);
    if (alphaAt(out, nx, ny) >= 128) continue;
    const fade = 1 - (k - 1) / (pixels + 1) * 0.15;
    put(out, nx, ny, [p.c[0] * fade, p.c[1] * fade, p.c[2] * fade], p.c[3]);
  }
  return out;
}

/** Thicken only the blade, perpendicular to the axis. */
export function thickenBlade(src: Tex, pixels = 1): Tex {
  if (pixels <= 0 || isOpaqueTex(src)) return src;
  const a = axis(src), out = cloneTex(src);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    if (alphaAt(src, x, y) < 128 || along(src, x, y) < 0.38) continue;
    const c = sample(src, x, y);
    for (const s of [-pixels, pixels]) {
      const nx = Math.round(x + a.px * s), ny = Math.round(y + a.py * s);
      if (alphaAt(out, nx, ny) >= 128) continue;
      put(out, nx, ny, [c[0] * 0.82, c[1] * 0.82, c[2] * 0.82], c[3]);
    }
  }
  return out;
}

/** Second blade, mirrored through the item's midpoint — same weapon, double-ended. */
export function dualBlade(src: Tex): Tex {
  const a = axis(src), mx = (a.hx + a.tx) / 2, my = (a.hy + a.ty) / 2;
  const flipped = transformTex(src, (x, y) => [2 * mx - x, 2 * my - y]);
  return composite(src, flipped);
}

/** Place the item so its grip sits on a comfortable pivot, then rotate. */
export function poseItem(src: Tex, deg: number, scale = 0.82, pivotX = 0.38, pivotY = 0.72): Tex {
  const [hx, hy] = handleOf(src);
  return rotateAbout(src, deg, hx, hy, scale, src.w * pivotX - hx, src.h * pivotY - hy);
}

export function ghostCopies(src: Tex, offsets: [number, number, number][], color?: RGB): Tex {
  let bg = createTex(src.w, src.h);
  for (const [dx, dy, a] of offsets) {
    const moved = translateTex(src, dx, dy);
    bg = composite(bg, color ? silhouette(moved, color, a) : withAlpha(moved, a));
  }
  return composite(bg, src);
}

export function wrapHandle(src: Tex, color: RGB, seed: number): Tex {
  const out = cloneTex(src), s = px(src);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    if (alphaAt(src, x, y) < 128 || zoneOf(src, x, y) !== 'handle') continue;
    if ((x + y + seed) % (2 * s + 1) !== 0) continue;
    const o = idx(out, x, y);
    out.d[o] = color[0]; out.d[o + 1] = color[1]; out.d[o + 2] = color[2];
  }
  return out;
}

export function bladeRunes(src: Tex, color: RGB, seed: number, count: number): Tex {
  const out = cloneTex(src), s = px(src);
  const cands: [number, number][] = [];
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    if (alphaAt(src, x, y) < 128) continue;
    const z = zoneOf(src, x, y);
    if (z === 'blade' || z === 'tip') cands.push([x, y]);
  }
  for (const [x, y] of pick(cands, count, seed, s * 2.4, (v) => v)) {
    put(out, x, y, color);
    if (s > 1) put(out, x, y + 1, [color[0] * 0.6, color[1] * 0.6, color[2] * 0.6]);
  }
  return out;
}

export function chipTip(src: Tex, seed: number, amount = 0.45): Tex {
  const out = cloneTex(src);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    if (alphaAt(src, x, y) < 128 || zoneOf(src, x, y) !== 'tip') continue;
    const edge = N4.some(([ox, oy]) => alphaAt(src, x + ox, y + oy) < 128);
    if (edge && hash2(x, y, seed) < amount) out.d[idx(out, x, y) + 3] = 0;
  }
  return out;
}
