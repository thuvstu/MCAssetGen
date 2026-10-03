/* ═══════════════════════════════════════════════════════
   Color harmony — derive a coherent palette from one hue
   ═══════════════════════════════════════════════════════ */
import type { HarmonyScheme, StaffConfig } from './types';
import { hexToRgb, rgbToHex } from './color';

export interface HSL { h: number; s: number; l: number }

export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h, s, l };
}

export function hslToHex({ h, s, l }: HSL): string {
  h = ((h % 1) + 1) % 1;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  if (s === 0) { const v = l * 255; return rgbToHex(v, v, v); }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return rgbToHex(hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255);
}

export const hexToHsl = (hex: string): HSL => { const [r, g, b] = hexToRgb(hex); return rgbToHsl(r, g, b); };

/** Hue offsets (in turns) for each scheme: [accent, tertiary] */
const OFFSETS: Record<HarmonyScheme, [number, number]> = {
  custom: [0, 0],
  complementary: [0.5, 0.5],
  analogous: [0.083, -0.083],
  triadic: [1 / 3, 2 / 3],
  split: [0.42, 0.58],
  tetradic: [0.25, 0.5],
  monochrome: [0, 0],
};

/**
 * Re-derive the whole colour set from `gemColor` using a harmony scheme.
 * Keeps luminance relationships so shading logic still reads correctly.
 */
export function applyHarmony(cfg: StaffConfig, scheme: HarmonyScheme): Partial<StaffConfig> {
  if (scheme === 'custom') return { harmony: scheme };
  const base = hexToHsl(cfg.gemColor);
  const [o1, o2] = OFFSETS[scheme];
  const mono = scheme === 'monochrome';

  const gem2 = hslToHex({ h: base.h + (mono ? 0 : o1), s: mono ? base.s * 0.55 : Math.min(1, base.s * 0.9), l: Math.min(0.88, base.l + 0.26) });
  const glow = hslToHex({ h: base.h + (mono ? 0 : o1 * 0.4), s: Math.min(1, base.s * 1.05), l: Math.min(0.72, base.l + 0.1) });
  const particle = hslToHex({ h: base.h + (mono ? 0 : o2 * 0.35), s: base.s * 0.75, l: Math.min(0.9, base.l + 0.34) });
  const metal = hslToHex({ h: base.h + (mono ? 0 : o2), s: mono ? base.s * 0.3 : base.s * 0.62, l: 0.6 });
  const shaft = hslToHex({ h: base.h + (mono ? 0 : o2 * 0.8), s: mono ? base.s * 0.35 : base.s * 0.45, l: 0.26 });
  const shaft2 = hslToHex({ h: base.h + (mono ? 0 : o2 * 0.8), s: mono ? base.s * 0.3 : base.s * 0.4, l: 0.13 });
  const halo = hslToHex({ h: base.h + (mono ? 0 : o1), s: base.s * 0.8, l: 0.7 });
  const wing = hslToHex({ h: base.h + (mono ? 0 : o1 * 0.6), s: base.s * 0.3, l: 0.86 });

  return {
    harmony: scheme,
    gemColor2: gem2, glowColor: glow, particleColor: particle,
    collarColor: metal, prongColor: metal, pommelColor: metal, wrapColor: metal,
    shaftColor: shaft, shaftColor2: shaft2, haloColor: halo, wingColor: wing,
  };
}

/** Rotate every colour in the config by `turns` (0..1) — instant recolour. */
export function rotateHue(cfg: StaffConfig, turns: number): Partial<StaffConfig> {
  const keys = ['gemColor', 'gemColor2', 'glowColor', 'particleColor', 'collarColor', 'prongColor', 'pommelColor', 'wrapColor', 'shaftColor', 'shaftColor2', 'haloColor', 'wingColor', 'hornColor'] as const;
  const out: Partial<StaffConfig> = {};
  for (const k of keys) {
    const hsl = hexToHsl(cfg[k]);
    (out as Record<string, string>)[k] = hslToHex({ ...hsl, h: hsl.h + turns });
  }
  return out;
}
