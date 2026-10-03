// ============================================================
//  PIXELFORGE — 低レベル ピクセル演算ユーティリティ
// ============================================================

export type RGB = { r: number; g: number; b: number };
export type FXCtx = { size: number; t: number; seed: number };

export const clamp = (v: number, a = 0, b = 255) => (v < a ? a : v > b ? b : v);
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const fract = (v: number) => v - Math.floor(v);

let _cv: HTMLCanvasElement | null = null;
export function scratchCanvas(): HTMLCanvasElement {
  if (!_cv) _cv = document.createElement("canvas");
  return _cv;
}

export function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export function ctx2d(c: HTMLCanvasElement) {
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.imageSmoothingEnabled = false;
  return g;
}

export function blank(size: number): ImageData {
  return new ImageData(size, size);
}

export function clone(img: ImageData): ImageData {
  return new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
}

export function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "");
  if (h.length === 3)
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbaToHex(r: number, g: number, b: number, a = 255) {
  const to = (v: number) => Math.round(clamp(v)).toString(16).padStart(2, "0");
  return a >= 255 ? `#${to(r)}${to(g)}${to(b)}` : `#${to(r)}${to(g)}${to(b)}${to(a)}`;
}

export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  const d = max - min;
  if (d > 1e-6) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h, s, l };
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  h = fract(h);
  if (s <= 0) {
    const v = Math.round(clamp(l * 255));
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (tt: number) => {
    let t = tt;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: Math.round(clamp(f(h + 1 / 3) * 255)),
    g: Math.round(clamp(f(h) * 255)),
    b: Math.round(clamp(f(h - 1 / 3) * 255)),
  };
}

export const luminance = (r: number, g: number, b: number) =>
  0.299 * r + 0.587 * g + 0.114 * b;

// ---------- 乱数 / ノイズ ----------
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(x: number, y: number, seed = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** 値ノイズ 0..1 (タイリング可能) */
export function valueNoise(x: number, y: number, seed = 0, period = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const w = (a: number, b: number) =>
    period > 0 ? hash2(((a % period) + period) % period, ((b % period) + period) % period, seed) : hash2(a, b, seed);
  const v00 = w(xi, yi), v10 = w(xi + 1, yi), v01 = w(xi, yi + 1), v11 = w(xi + 1, yi + 1);
  const u = smooth(xf), v = smooth(yf);
  return lerp(lerp(v00, v10, u), lerp(v01, v11, u), v);
}

export function fbm(x: number, y: number, seed = 0, oct = 4, period = 0) {
  let amp = 0.5, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += amp * valueNoise(x * freq, y * freq, seed + i * 131, period ? period * freq : 0);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/** ワープ付き domain-warp ノイズ */
export function warpNoise(x: number, y: number, seed: number, amount = 0.6) {
  const wx = fbm(x + 5.2, y + 1.3, seed + 7, 3) - 0.5;
  const wy = fbm(x + 9.1, y + 4.7, seed + 13, 3) - 0.5;
  return fbm(x + wx * amount * 4, y + wy * amount * amount * 4, seed, 4);
}

// ---------- 直接描画プリミティブ ----------
export function setPx(img: ImageData, x: number, y: number, r: number, g: number, b: number, a = 255) {
  const { width: w, height: h, data: d } = img;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const i = (y * w + x) << 2;
  d[i] = clamp(r); d[i + 1] = clamp(g); d[i + 2] = clamp(b); d[i + 3] = clamp(a);
}

/** 通常合成 (source over) */
export function overPx(img: ImageData, x: number, y: number, r: number, g: number, b: number, a: number) {
  if (a <= 0) return;
  const { width: w, height: h, data: d } = img;
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const i = (y * w + x) << 2;
  if (a >= 255) {
    d[i] = clamp(r); d[i + 1] = clamp(g); d[i + 2] = clamp(b); d[i + 3] = 255;
    return;
  }
  const sa = a / 255, da = d[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) { d[i + 3] = 0; return; }
  d[i] = clamp((r * sa + d[i] * da * (1 - sa)) / oa);
  d[i + 1] = clamp((g * sa + d[i + 1] * da * (1 - sa)) / oa);
  d[i + 2] = clamp((b * sa + d[i + 2] * da * (1 - sa)) / oa);
  d[i + 3] = clamp(oa * 255);
}

/** 加算合成 (グロー系) */
export function addPx(img: ImageData, x: number, y: number, r: number, g: number, b: number, a: number) {
  if (a <= 0) return;
  const { width: w, height: h, data: d } = img;
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const i = (y * w + x) << 2;
  const k = a / 255;
  const da = d[i + 3] / 255;
  const na = Math.min(1, da + k);
  d[i] = clamp(d[i] + r * k);
  d[i + 1] = clamp(d[i + 1] + g * k);
  d[i + 2] = clamp(d[i + 2] + b * k);
  d[i + 3] = clamp(na * 255);
}

export function screenPx(img: ImageData, x: number, y: number, r: number, g: number, b: number, a: number) {
  if (a <= 0) return;
  const { width: w, height: h, data: d } = img;
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const i = (y * w + x) << 2;
  if (d[i + 3] === 0) return;
  const k = a / 255;
  d[i] = clamp(d[i] + (255 - d[i]) * (r / 255) * k);
  d[i + 1] = clamp(d[i + 1] + (255 - d[i + 1]) * (g / 255) * k);
  d[i + 2] = clamp(d[i + 2] + (255 - d[i + 2]) * (b / 255) * k);
}

export function linePx(
  img: ImageData, x0: number, y0: number, x1: number, y1: number,
  r: number, g: number, b: number, a: number, thick = 1, add = false,
) {
  let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let guard = 0;
  const half = (thick - 1) / 2;
  while (guard++ < 4096) {
    for (let ox = -half; ox <= half; ox++)
      for (let oy = -half; oy <= half; oy++) {
        if (add) addPx(img, Math.round(x0 + ox), Math.round(y0 + oy), r, g, b, a);
        else overPx(img, Math.round(x0 + ox), Math.round(y0 + oy), r, g, b, a);
      }
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
}

export function discPx(
  img: ImageData, cx: number, cy: number, rad: number,
  r: number, g: number, b: number, a: number, add = false,
) {
  const R = Math.ceil(rad) + 1;
  for (let y = -R; y <= R; y++)
    for (let x = -R; x <= R; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d > rad + 0.5) continue;
      const aa = clamp01(rad + 0.5 - d);
      const al = a * aa;
      if (add) addPx(img, cx + x, cy + y, r, g, b, al);
      else overPx(img, cx + x, cy + y, r, g, b, al);
    }
}

export function ringPx(img: ImageData, cx: number, cy: number, rad: number, r: number, g: number, b: number, a: number, add = false) {
  const steps = Math.max(12, Math.ceil(rad * 8));
  for (let i = 0; i < steps; i++) {
    const ang = (i / steps) * Math.PI * 2;
    const x = Math.round(cx + Math.cos(ang) * rad);
    const y = Math.round(cy + Math.sin(ang) * rad);
    if (add) addPx(img, x, y, r, g, b, a);
    else overPx(img, x, y, r, g, b, a);
  }
}

// ---------- フィルタ演算 ----------
export function boxBlur(src: ImageData, radius: number, alphaOnly = false): ImageData {
  const w = src.width, h = src.height;
  const out = clone(src);
  if (radius <= 0) return out;
  const r = Math.max(1, Math.round(radius));
  const tmp = new Uint8ClampedArray(src.data);
  const div = r * 2 + 1;
  const chans = alphaOnly ? [3] : [0, 1, 2, 3];
  // horizontal
  for (let y = 0; y < h; y++) {
    for (const c of chans) {
      let sum = 0;
      for (let k = -r; k <= r; k++) {
        const x = Math.min(w - 1, Math.max(0, k));
        sum += src.data[(y * w + x) * 4 + c];
      }
      for (let x = 0; x < w; x++) {
        tmp[(y * w + x) * 4 + c] = sum / div;
        const addX = Math.min(w - 1, x + r + 1);
        const subX = Math.max(0, x - r);
        sum += src.data[(y * w + addX) * 4 + c] - src.data[(y * w + subX) * 4 + c];
      }
    }
  }
  // vertical
  for (let x = 0; x < w; x++) {
    for (const c of chans) {
      let sum = 0;
      for (let k = -r; k <= r; k++) {
        const y = Math.min(h - 1, Math.max(0, k));
        sum += tmp[(y * w + x) * 4 + c];
      }
      for (let y = 0; y < h; y++) {
        out.data[(y * w + x) * 4 + c] = sum / div;
        const addY = Math.min(h - 1, y + r + 1);
        const subY = Math.max(0, y - r);
        sum += tmp[(addY * w + x) * 4 + c] - tmp[(subY * w + x) * 4 + c];
      }
    }
  }
  return out;
}

export function getAlpha(img: ImageData, x: number, y: number) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return 0;
  return img.data[(y * img.width + x) * 4 + 3];
}

/** ソース画像から色数 n の代表パレットを抽出 */
export function extractPalette(img: ImageData, n: number): RGB[] {
  const counts = new Map<number, number>();
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 24) continue;
    const key = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, Math.max(1, n));
  const pal = sorted.map(([k]) => ({
    r: (((k >> 10) & 31) << 3) + 4,
    g: (((k >> 5) & 31) << 3) + 4,
    b: ((k & 31) << 3) + 4,
  }));
  if (!pal.length) pal.push({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
  return pal;
}

export function nearestPalette(pal: RGB[], r: number, g: number, b: number): RGB {
  let best = pal[0], bd = Infinity;
  for (const c of pal) {
    const dr = c.r - r, dg = c.g - g, db = c.b - b;
    const dist = dr * dr * 2 + dg * dg * 3 + db * db;
    if (dist < bd) { bd = dist; best = c; }
  }
  return best;
}

export const BAYER2 = [[0, 2], [3, 1]];
export const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
export const BAYER8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

/** バイエル行列値を -0.5..0.5 に正規化 */
export function bayerAt(x: number, y: number, order: number) {
  if (order <= 2) return BAYER2[y & 1][x & 1] / 4 - 0.375;
  if (order === 4) return BAYER4[y & 3][x & 3] / 16 - 0.46875;
  return BAYER8[y & 7][x & 7] / 64 - 0.4921875;
}

/** 全ピクセル走査ヘルパ */
export function eachPixel(img: ImageData, fn: (i: number, x: number, y: number) => void) {
  const w = img.width, h = img.height;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) fn((y * w + x) << 2, x, y);
}
