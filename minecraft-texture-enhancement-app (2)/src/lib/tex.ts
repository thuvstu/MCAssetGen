export interface Tex {
  w: number;
  h: number;
  d: Uint8ClampedArray;
}

export const createTex = (w: number, h: number): Tex => ({ w, h, d: new Uint8ClampedArray(w * h * 4) });
export const cloneTex = (t: Tex): Tex => ({ w: t.w, h: t.h, d: new Uint8ClampedArray(t.d) });

export const clamp = (v: number, a = 0, b = 255) => (v < a ? a : v > b ? b : v);
export const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;
export const fract = (v: number) => v - Math.floor(v);
export const mod = (v: number, m: number) => ((v % m) + m) % m;

export function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(x: number, y: number, seed: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Tileable value noise with lattice period */
export function tileNoise(seed: number, period: number) {
  return (x: number, y: number) => {
    const x0 = Math.floor(x),
      y0 = Math.floor(y);
    const fx = x - x0,
      fy = y - y0;
    const m = (v: number) => mod(v, period);
    const a = hash2(m(x0), m(y0), seed),
      b = hash2(m(x0 + 1), m(y0), seed),
      c = hash2(m(x0), m(y0 + 1), seed),
      d = hash2(m(x0 + 1), m(y0 + 1), seed);
    const sx = fx * fx * (3 - 2 * fx),
      sy = fy * fy * (3 - 2 * fy);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

/** Tileable fractal noise in pixel coordinates -> 0..1 */
export function fbm(seed: number, w: number, h: number, scale: number, octaves = 3) {
  const layers = Array.from({ length: octaves }, (_, o) => ({
    n: tileNoise(seed + o * 101, Math.max(1, Math.round(scale * 2 ** o))),
    f: Math.max(1, Math.round(scale * 2 ** o)),
    a: 0.5 ** o,
  }));
  const total = layers.reduce((s, l) => s + l.a, 0);
  return (x: number, y: number) => {
    let s = 0;
    for (const l of layers) s += l.n((x / w) * l.f, (y / h) * l.f) * l.a;
    return s / total;
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.round(clamp(v)).toString(16).padStart(2, '0')).join('');

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0,
    s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = mod(h, 360) / 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    t = mod(t, 1);
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

export function texFromSource(src: CanvasImageSource, w: number, h: number, sx = 0, sy = 0, sw = w, sh = h): Tex {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
  const id = ctx.getImageData(0, 0, w, h);
  return { w, h, d: new Uint8ClampedArray(id.data) };
}

export function texToCanvas(t: Tex, scale = 1): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = t.w;
  c.height = t.h;
  c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(t.d), t.w, t.h), 0, 0);
  if (scale === 1) return c;
  const s = document.createElement('canvas');
  s.width = t.w * scale;
  s.height = t.h * scale;
  const sc = s.getContext('2d')!;
  sc.imageSmoothingEnabled = false;
  sc.drawImage(c, 0, 0, s.width, s.height);
  return s;
}

export const texToDataURL = (t: Tex, scale = 1) => texToCanvas(t, scale).toDataURL('image/png');

export function resizeTex(t: Tex, w: number, h: number): Tex {
  const out = createTex(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = Math.min(t.w - 1, Math.floor(x * t.w / w));
    const sy = Math.min(t.h - 1, Math.floor(y * t.h / h));
    const si = (sy * t.w + sx) * 4;
    out.d.set(t.d.subarray(si, si + 4), (y * w + x) * 4);
  }
  return out;
}

export function stackVertical(frames: Tex[]): Tex {
  const w = frames[0].w,
    h = frames[0].h;
  const out = createTex(w, h * frames.length);
  frames.forEach((f, i) => out.d.set(f.d, i * w * h * 4));
  return out;
}

export type ImportMode = 'full' | 'first-frame';

export async function loadFileToTex(file: Blob, maxSize = 128, mode: ImportMode = 'full'): Promise<Tex> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    let sw = img.naturalWidth,
      sh = img.naturalHeight;
    // Only crop a strip when explicitly requested. Skins and atlases may be rectangular.
    if (mode === 'first-frame' && sh > sw && sh % sw === 0) sh = sw;
    let w = sw,
      h = sh;
    const m = Math.max(w, h);
    if (m > maxSize) {
      const k = maxSize / m;
      w = Math.max(1, Math.round(w * k));
      h = Math.max(1, Math.round(h * k));
    }
    return texFromSource(img, w, h, 0, 0, sw, sh);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function download(url: string, name: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
