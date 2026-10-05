// Core pixel utilities. Pixels are packed as 0xRRGGBBAA in a Uint32Array.

export type Pix = { w: number; h: number; data: Uint32Array };

export function makePix(w: number, h: number): Pix {
  return { w, h, data: new Uint32Array(w * h) };
}
export function clonePix(p: Pix): Pix {
  return { w: p.w, h: p.h, data: new Uint32Array(p.data) };
}
export function pixFromArray(w: number, h: number, arr: number[]): Pix {
  const d = new Uint32Array(w * h);
  for (let i = 0; i < Math.min(arr.length, d.length); i++) d[i] = arr[i] >>> 0;
  return { w, h, data: d };
}
export function pixToArray(p: Pix): number[] {
  return Array.from(p.data);
}

export function rgba(r: number, g: number, b: number, a = 255): number {
  return (
    ((clamp255(r) << 24) | (clamp255(g) << 16) | (clamp255(b) << 8) | clamp255(a)) >>> 0
  );
}
export function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}
export function R(c: number) {
  return (c >>> 24) & 255;
}
export function G(c: number) {
  return (c >>> 16) & 255;
}
export function B(c: number) {
  return (c >>> 8) & 255;
}
export function A(c: number) {
  return c & 255;
}
export function hex(c: number): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(R(c))}${h(G(c))}${h(B(c))}`;
}
export function hexA(c: number): string {
  return hex(c) + A(c).toString(16).padStart(2, "0");
}
export function fromHex(s: string, a = 255): number {
  let t = s.replace("#", "");
  if (t.length === 3) t = t.split("").map((c) => c + c).join("");
  const n = parseInt(t.slice(0, 6), 16);
  const al = t.length >= 8 ? parseInt(t.slice(6, 8), 16) : a;
  return rgba((n >> 16) & 255, (n >> 8) & 255, n & 255, al);
}
export function cssRgba(c: number): string {
  return `rgba(${R(c)},${G(c)},${B(c)},${(A(c) / 255).toFixed(3)})`;
}

export function getPx(p: Pix, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= p.w || y >= p.h) return 0;
  return p.data[y * p.w + x];
}
export function setPx(p: Pix, x: number, y: number, c: number) {
  if (x < 0 || y < 0 || x >= p.w || y >= p.h) return;
  p.data[y * p.w + x] = c >>> 0;
}
/** alpha-composite src over destination pixel */
export function blendPx(p: Pix, x: number, y: number, c: number) {
  if (x < 0 || y < 0 || x >= p.w || y >= p.h) return;
  const i = y * p.w + x;
  p.data[i] = over(c, p.data[i]);
}
export function over(src: number, dst: number): number {
  const sa = A(src) / 255;
  if (sa >= 1) return src;
  if (sa <= 0) return dst;
  const da = A(dst) / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) return 0;
  const f = (s: number, d: number) => (s * sa + d * da * (1 - sa)) / oa;
  return rgba(f(R(src), R(dst)), f(G(src), G(dst)), f(B(src), B(dst)), oa * 255);
}

// ---------- color space ----------
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 1) + 1) % 1;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}
export function hsl(h: number, s: number, l: number, a = 255): number {
  const [r, g, b] = hslToRgb(h, s, l);
  return rgba(r, g, b, a);
}
export function shiftHue(c: number, dh: number): number {
  const [h, s, l] = rgbToHsl(R(c), G(c), B(c));
  return hsl(h + dh, s, l, A(c));
}
export function adjustLight(c: number, dl: number, ds = 0): number {
  const [h, s, l] = rgbToHsl(R(c), G(c), B(c));
  return hsl(h, Math.min(1, Math.max(0, s + ds)), Math.min(1, Math.max(0, l + dl)), A(c));
}
export function withAlpha(c: number, a: number): number {
  return ((c & 0xffffff00) | clamp255(a)) >>> 0;
}
export function mix(a: number, b: number, t: number): number {
  t = Math.min(1, Math.max(0, t));
  return rgba(
    R(a) + (R(b) - R(a)) * t,
    G(a) + (G(b) - G(a)) * t,
    B(a) + (B(b) - B(a)) * t,
    A(a) + (A(b) - A(a)) * t,
  );
}
export function luminance(c: number): number {
  return (0.2126 * R(c) + 0.7152 * G(c) + 0.0722 * B(c)) / 255;
}

// ---------- deterministic random ----------
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash2(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}
/** 2D value noise in [0,1] */
export function noise2(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x),
    yi = Math.floor(y);
  const xf = x - xi,
    yf = y - yi;
  const sx = xf * xf * (3 - 2 * xf),
    sy = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed),
    b = hash2(xi + 1, yi, seed),
    c = hash2(xi, yi + 1, seed),
    d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

// ---------- drawing primitives ----------
export function drawLine(
  p: Pix,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  c: number,
  size = 1,
  blend = false,
) {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0),
    dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1,
    sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    brush(p, x0, y0, c, size, blend);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}
export function brush(p: Pix, x: number, y: number, c: number, size = 1, blend = false) {
  const r = Math.floor(size / 2);
  const off = size % 2 === 0 ? 1 : 0;
  for (let dy = -r + off; dy <= r; dy++)
    for (let dx = -r + off; dx <= r; dx++) {
      if (size >= 4 && dx * dx + dy * dy > r * r + r) continue;
      if (blend) blendPx(p, x + dx, y + dy, c);
      else setPx(p, x + dx, y + dy, c);
    }
}
export function drawRect(
  p: Pix,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  c: number,
  fill: boolean,
) {
  const ax = Math.min(x0, x1),
    bx = Math.max(x0, x1),
    ay = Math.min(y0, y1),
    by = Math.max(y0, y1);
  for (let y = ay; y <= by; y++)
    for (let x = ax; x <= bx; x++) {
      if (fill || x === ax || x === bx || y === ay || y === by) setPx(p, x, y, c);
    }
}
export function drawEllipse(
  p: Pix,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  c: number,
  fill: boolean,
) {
  const ax = Math.min(x0, x1),
    bx = Math.max(x0, x1),
    ay = Math.min(y0, y1),
    by = Math.max(y0, y1);
  const cx = (ax + bx) / 2,
    cy = (ay + by) / 2;
  const rx = (bx - ax) / 2 + 0.5,
    ry = (by - ay) / 2 + 0.5;
  const inside = (x: number, y: number) => {
    const nx = (x - cx) / rx,
      ny = (y - cy) / ry;
    return nx * nx + ny * ny <= 1;
  };
  for (let y = ay; y <= by; y++)
    for (let x = ax; x <= bx; x++) {
      if (!inside(x, y)) continue;
      if (fill) setPx(p, x, y, c);
      else if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1))
        setPx(p, x, y, c);
    }
}
export function floodFill(p: Pix, x: number, y: number, c: number, contiguous = true) {
  const target = getPx(p, x, y);
  if (target === c) return;
  if (!contiguous) {
    for (let i = 0; i < p.data.length; i++) if (p.data[i] === target) p.data[i] = c;
    return;
  }
  const stack = [[x, y]];
  const seen = new Uint8Array(p.w * p.h);
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= p.w || cy >= p.h) continue;
    const i = cy * p.w + cx;
    if (seen[i] || p.data[i] !== target) continue;
    seen[i] = 1;
    p.data[i] = c;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
}

// ---------- gradients ----------
export type GradientType =
  | "linear"
  | "radial"
  | "diagonal"
  | "conic"
  | "reflected"
  | "rainbow";
export type GradientOpts = {
  type: GradientType;
  stops: { t: number; color: number }[]; // sorted by t
  dither: number; // 0..1
  steps: number; // 0 = smooth, else quantize to N bands
  maskOnly: boolean; // only paint on non-transparent pixels
  mode: "replace" | "multiply" | "overlay" | "tint";
};

export function sampleStops(stops: GradientOpts["stops"], t: number): number {
  if (!stops.length) return 0;
  if (t <= stops[0].t) return stops[0].color;
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i].t) {
      const a = stops[i - 1],
        b = stops[i];
      const f = (t - a.t) / Math.max(1e-6, b.t - a.t);
      return mix(a.color, b.color, f);
    }
  }
  return stops[stops.length - 1].color;
}

export function applyGradient(
  p: Pix,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  opt: GradientOpts,
  region?: Uint8Array,
) {
  const dx = x1 - x0,
    dy = y1 - y0;
  const len2 = dx * dx + dy * dy || 1;
  const len = Math.sqrt(len2);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const i = y * p.w + x;
      if (region && !region[i]) continue;
      const dst = p.data[i];
      if (opt.maskOnly && A(dst) === 0) continue;
      let t: number;
      const px = x + 0.5 - x0,
        py = y + 0.5 - y0;
      switch (opt.type) {
        case "radial":
          t = Math.sqrt(px * px + py * py) / len;
          break;
        case "conic":
          t = (Math.atan2(py, px) - Math.atan2(dy, dx)) / (Math.PI * 2);
          t = ((t % 1) + 1) % 1;
          break;
        case "diagonal":
          t = (px + py) / ((dx + dy) || 1);
          break;
        case "reflected":
          t = Math.abs(((px * dx + py * dy) / len2) * 2 - 1);
          break;
        default:
          t = (px * dx + py * dy) / len2;
      }
      t = Math.min(1, Math.max(0, t));
      if (opt.dither > 0) {
        const bayer = (BAYER4[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * opt.dither * 0.35;
        t = Math.min(1, Math.max(0, t + bayer));
      }
      if (opt.steps > 1) t = Math.floor(t * opt.steps) / (opt.steps - 1);
      let col =
        opt.type === "rainbow" ? hsl(t, 0.9, 0.55) : sampleStops(opt.stops, t);
      if (opt.mode === "multiply") {
        col = rgba(
          (R(col) * R(dst)) / 255,
          (G(col) * G(dst)) / 255,
          (B(col) * B(dst)) / 255,
          A(dst),
        );
      } else if (opt.mode === "overlay") {
        const ov = (s: number, d: number) =>
          d < 128 ? (2 * s * d) / 255 : 255 - (2 * (255 - s) * (255 - d)) / 255;
        col = rgba(ov(R(col), R(dst)), ov(G(col), G(dst)), ov(B(col), B(dst)), A(dst));
      } else if (opt.mode === "tint") {
        const l = luminance(dst);
        col = rgba(R(col) * (0.4 + l * 0.9), G(col) * (0.4 + l * 0.9), B(col) * (0.4 + l * 0.9), A(dst));
      } else if (A(dst) > 0 && A(col) < 255) {
        col = over(col, dst);
      }
      p.data[i] = col;
    }
}
export const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// ---------- transforms ----------
export function flipH(p: Pix): Pix {
  const o = makePix(p.w, p.h);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) o.data[y * p.w + (p.w - 1 - x)] = p.data[y * p.w + x];
  return o;
}
export function flipV(p: Pix): Pix {
  const o = makePix(p.w, p.h);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) o.data[(p.h - 1 - y) * p.w + x] = p.data[y * p.w + x];
  return o;
}
export function rotate90(p: Pix): Pix {
  const o = makePix(p.h, p.w);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) o.data[x * o.w + (p.h - 1 - y)] = p.data[y * p.w + x];
  return o;
}
export function shift(p: Pix, dx: number, dy: number): Pix {
  const o = makePix(p.w, p.h);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const sx = x - dx,
        sy = y - dy;
      if (sx >= 0 && sy >= 0 && sx < p.w && sy < p.h) o.data[y * p.w + x] = p.data[sy * p.w + sx];
    }
  return o;
}
/** rotate around center by angle (radians), nearest sampling */
export function rotateAny(p: Pix, ang: number): Pix {
  const o = makePix(p.w, p.h);
  const cx = p.w / 2,
    cy = p.h / 2;
  const c = Math.cos(-ang),
    s = Math.sin(-ang);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const px = x + 0.5 - cx,
        py = y + 0.5 - cy;
      const sx = Math.floor(px * c - py * s + cx),
        sy = Math.floor(px * s + py * c + cy);
      o.data[y * p.w + x] = getPx(p, sx, sy);
    }
  return o;
}
export function resizeNearest(p: Pix, w: number, h: number): Pix {
  const o = makePix(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const sx = Math.floor((x / w) * p.w),
        sy = Math.floor((y / h) * p.h);
      o.data[y * w + x] = p.data[sy * p.w + sx];
    }
  return o;
}
/** outline (1px) of non-transparent area: returns mask of outside pixels adjacent to content */
export function outerOutline(p: Pix, diagonal = false): Uint8Array {
  const m = new Uint8Array(p.w * p.h);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (A(getPx(p, x, y)) > 0) continue;
      const n =
        A(getPx(p, x + 1, y)) > 0 ||
        A(getPx(p, x - 1, y)) > 0 ||
        A(getPx(p, x, y + 1)) > 0 ||
        A(getPx(p, x, y - 1)) > 0 ||
        (diagonal &&
          (A(getPx(p, x + 1, y + 1)) > 0 ||
            A(getPx(p, x - 1, y - 1)) > 0 ||
            A(getPx(p, x - 1, y + 1)) > 0 ||
            A(getPx(p, x + 1, y - 1)) > 0));
      if (n) m[y * p.w + x] = 1;
    }
  return m;
}
export function isEdge(p: Pix, x: number, y: number): boolean {
  if (A(getPx(p, x, y)) === 0) return false;
  return (
    A(getPx(p, x + 1, y)) === 0 ||
    A(getPx(p, x - 1, y)) === 0 ||
    A(getPx(p, x, y + 1)) === 0 ||
    A(getPx(p, x, y - 1)) === 0
  );
}
