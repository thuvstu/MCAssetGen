/* ═══════════════════════════════════════════════════════
   Color math + deterministic RNG
   ═══════════════════════════════════════════════════════ */

export type RGB = [number, number, number];

export const WHITE: RGB = [255, 255, 255];
export const INK: RGB = [16, 11, 22];

export const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a || 1e-6));
  return t * t * (3 - 2 * t);
}

/* ── hex helpers (UI side) ── */
export function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
/** amt −1..1 — negative darkens, positive lightens */
export function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (amt >= 0) return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  const f = 1 + amt;
  return rgbToHex(r * f, g * f, b * f);
}
export function lerpHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const c = clamp01(t);
  return rgbToHex(r1 + (r2 - r1) * c, g1 + (g2 - g1) * c, b1 + (b2 - b1) * c);
}

/* ── RGB tuple helpers (render side) ── */
export const shadeRgb = (c: RGB, amt: number): RGB => {
  if (amt >= 0) return [c[0] + (255 - c[0]) * amt, c[1] + (255 - c[1]) * amt, c[2] + (255 - c[2]) * amt];
  const f = 1 + amt;
  return [c[0] * f, c[1] * f, c[2] * f];
};
export const mixRgb = (a: RGB, b: RGB, t: number): RGB => {
  const c = clamp01(t);
  return [lerp(a[0], b[0], c), lerp(a[1], b[1], c), lerp(a[2], b[2], c)];
};
export const lum = (c: RGB) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];

/** Approximate hue rotation (0..1) used by the rainbow-core animation. */
export function hueShiftRgb(c: RGB, shift: number): RGB {
  if (Math.abs(shift) < 0.001) return c;
  const stops: RGB[] = [
    [255, 105, 180], [255, 165, 0], [255, 255, 0], [144, 238, 144],
    [0, 255, 255], [100, 149, 237], [186, 85, 211],
  ];
  const s = ((shift % 1) + 1) % 1;
  const i = Math.floor(s * stops.length);
  const f = s * stops.length - i;
  const t = mixRgb(stops[i], stops[(i + 1) % stops.length], f);
  const out = mixRgb(c, t, 0.75);
  const k = lum(c) / Math.max(1, lum(out));
  return [clamp255(out[0] * k), clamp255(out[1] * k), clamp255(out[2] * k)];
}

/* ── deterministic RNG ── */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
