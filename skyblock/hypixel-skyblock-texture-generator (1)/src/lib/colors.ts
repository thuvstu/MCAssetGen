export type RGB = [number, number, number];
export type RGBA = [number, number, number, number];

export function clamp(n: number, lo = 0, hi = 255): number {
  return Math.max(lo, Math.min(hi, n));
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export function rgbToHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, "0")).join("")}`;
}

export function mixRgb(a: RGB, b: RGB, t: number): RGB {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

export function mixHex(a: string, b: string, t: number): string {
  return rgbToHex(mixRgb(hexToRgb(a), hexToRgb(b), t));
}

export function shadeHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (amount >= 0) {
    return rgbToHex(mixRgb([r, g, b], [255, 255, 255], amount));
  }
  return rgbToHex(mixRgb([r, g, b], [0, 0, 0], -amount));
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
      break;
  }
  return [(h / 6) * 360, s, l];
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hn = h / 360;
  return [
    Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hn) * 255),
    Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  ];
}

export function shiftHueRgb(rgb: RGB, deg: number): RGB {
  if (!deg) return rgb;
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  return hslToRgb(h + deg, s, l);
}

export function saturateRgb(rgb: RGB, amount: number): RGB {
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  return hslToRgb(h, clamp(s + amount, 0, 1), l);
}

export function weightedMixHex(entries: { hex: string; weight: number }[]): string {
  const total = entries.reduce((s, e) => s + e.weight, 0) || 1;
  const acc: RGB = [0, 0, 0];
  for (const e of entries) {
    const rgb = hexToRgb(e.hex);
    const w = e.weight / total;
    acc[0] += rgb[0] * w;
    acc[1] += rgb[1] * w;
    acc[2] += rgb[2] * w;
  }
  return rgbToHex(acc);
}
