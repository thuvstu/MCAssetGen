import type { RGB } from "./types";

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

export function shade(rgb: RGB, f: number): RGB {
  return rgb.map((c) => Math.max(0, Math.min(255, Math.round(c * f)))) as RGB;
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  const cl = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * cl),
    Math.round(a[1] + (b[1] - a[1]) * cl),
    Math.round(a[2] + (b[2] - a[2]) * cl),
  ];
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Deterministic PRNG */
export function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cheap deterministic hash noise in [-0.5, 0.5] for per-pixel variation */
export function hashNoise(x: number, y: number): number {
  let n = (Math.imul(x + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(y + 0xc2b2ae35, 0x27d4eb2f)) >>> 0;
  n = (n ^ (n >>> 15)) >>> 0;
  return (n % 1000) / 1000 - 0.5;
}

/** Smooth 2D value noise in [0, 1] (deterministic, seedable) */
export function vnoise(x: number, y: number, seed = 0): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const h = (a: number, b: number) => hashNoise(a * 31 + seed, b * 17 - seed) + 0.5;
  const a = h(ix, iy), b = h(ix + 1, iy), c = h(ix, iy + 1), d = h(ix + 1, iy + 1);
  return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy;
}

/** Fractal noise, 3 octaves, in [0, 1] */
export function fbm(x: number, y: number, seed = 0): number {
  return (vnoise(x, y, seed) * 0.5 + vnoise(x * 2.1, y * 2.1, seed + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, seed + 13) * 0.2);
}

/** Rotate the hue of an RGB color by `degrees` */
export function hueShift(rgb: RGB, degrees: number): RGB {
  const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h = ((h * 60 + degrees + 360) % 360) / 360;
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  if (s === 0) return [Math.round(l * 255), Math.round(l * 255), Math.round(l * 255)];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

export function randomPalette(rnd: () => number): import("./types").Palette {
  const h = Math.floor(rnd() * 360);
  const s = 55 + rnd() * 40;
  const l = 42 + rnd() * 25;
  const gh = (h + 30 + rnd() * 50) % 360;
  return {
    blade: hslToHex(h, s, l),
    bladeEdge: hslToHex(h, Math.max(20, s - 25), Math.min(94, l + 35)),
    bladeCore: hslToHex(h, Math.min(100, s + 10), Math.max(15, l - 18)),
    guard: hslToHex(gh, s * 0.75, l * 0.65),
    guardAccent: hslToHex(gh, 90, 75),
    handle: hslToHex(28, 45, 18),
    handleAccent: hslToHex(28, 60, 35),
    pommel: hslToHex(gh, 80, 50),
    outline: hslToHex(h, s, 9),
    spur: hslToHex(h, 90, 70),
  };
}
