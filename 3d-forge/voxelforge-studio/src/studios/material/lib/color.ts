export type RGB = [number, number, number];
export type HSL = [number, number, number];

export function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.padEnd(6, '0').slice(0, 6), 16);
  if (Number.isNaN(n)) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function rgbToHsl([r, g, b]: RGB): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
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
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

export function hslToRgb([h, s, l]: HSL): RGB {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = h / 360;
  const conv = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [conv(hk + 1 / 3) * 255, conv(hk) * 255, conv(hk - 1 / 3) * 255];
}

export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex));
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

export function shiftHex(hex: string, dH: number, dS: number, dL: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex([h + dH, s + dS, l + dL]);
}

export interface Palette {
  outline: string;
  deep: string;
  shadow: string;
  base: string;
  light: string;
  highlight: string;
  white: string;
  sec: string;
  secLight: string;
  secShadow: string;
  glow: string;
}

export interface PaletteOptions {
  base: string;
  secondary: string;
  contrast: number; // 0.3 - 1.8
  hueShift: number; // -30 - 30
  outline: boolean;
  saturationBoost: number; // -40 - 40
}

export function makePalette(o: PaletteOptions): Palette {
  const c = o.contrast;
  const hs = o.hueShift;
  const [h, s0, l] = hexToHsl(o.base);
  const s = Math.max(0, Math.min(100, s0 + o.saturationBoost));
  const mk = (dh: number, ds: number, dl: number) => hslToHex([h + dh, s + ds, l + dl]);
  const light = mk(hs * 0.5, -4 * c, 12 * c);
  const highlight = mk(hs, -10 * c, 24 * c);
  const shadow = mk(-hs * 0.5, 6 * c, -12 * c);
  const deep = mk(-hs, 8 * c, -24 * c);
  const outlineL = Math.max(4, l - 38 * c);
  const outline = o.outline ? hslToHex([h - hs, s + 4 * c, outlineL]) : deep;
  const white = hslToHex([h + hs, s * 0.25, Math.min(97, l + 36 * c)]);

  const [sh, ss, sl] = hexToHsl(o.secondary);
  const sec = o.secondary;
  const secLight = hslToHex([sh + hs * 0.5, ss - 4 * c, sl + 12 * c]);
  const secShadow = hslToHex([sh - hs * 0.5, ss + 6 * c, sl - 12 * c]);

  const glow = hslToHex([sh, Math.min(100, ss + 25), Math.min(92, sl + 40)]);
  return { outline, deep, shadow, base: o.base, light, highlight, white, sec, secLight, secShadow, glow };
}
