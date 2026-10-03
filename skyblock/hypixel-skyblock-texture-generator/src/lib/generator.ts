import type { ItemDef } from './items';
import {
  type Decoration, type FormArgs,
  formSampler, amorphousSampler, amorphize,
} from './forms';
import { analyzeBody, buildDecorationLayer } from './decorations';
import { canonicalTweaks, layerOf, tweakOf } from './layers';
import {
  DEFAULT_SHAPE_OPTIONS,
  DEFAULT_TEXTURE_ESSENCE,
  type AnimationFrameOptions,
  type DecorTweak,
  type ElementMode,
  type PackEssenceMix,
  type ShapeOptions,
  type StyleOptions,
  type TextureEssence,
} from './design';

export {
  DEFAULT_SHAPE_OPTIONS,
  DEFAULT_TEXTURE_ESSENCE,
  type AnimationFrameOptions,
  type AnimationMode,
  type DecorLayer,
  type DecorTweak,
  type ElementMergeMode,
  type ElementMode,
  type FitScope,
  type PackEssenceMix,
  type PivotPreset,
  type ShapeOptions,
  type StyleOptions,
  type TextureEssence,
  type TwinMode,
} from './design';

export interface Preset {
  id: string; name: string; jp: string; desc: string; style: StyleOptions; tag: string;
}

export interface RenderMetrics {
  bounds: { x: number; y: number; width: number; height: number } | null;
  opaquePixels: number;
  edgePixels: number;
  coverage: number;
  layout: RenderLayout;
}

export const PRESETS: Preset[] = [
  {
    id: 'reborn', name: 'Reborn Soft', jp: 'リボーン・ソフト', tag: 'FurfSky系エッセンス',
    desc: '太い輪郭＋高彩度＋なめらかな5階調ランプ。最もSkyblockらしい厚みのある質感。',
    style: { outline: 72, softness: 85, saturation: 130, contrast: 55, highlight: 80, grain: 20, bevel: 70, cartoon: 40, glow: 55, edgeLight: 72, dither: 18, hueShift: 48 },
  },
  {
    id: 'vanilla', name: 'Vanilla Plus', jp: 'バニラプラス', tag: 'Vanilla+系',
    desc: '細い輪郭・素直な陰影。バニラの延長線上でクリーンにまとめる。',
    style: { outline: 34, softness: 40, saturation: 104, contrast: 40, highlight: 52, grain: 10, bevel: 40, cartoon: 55, glow: 12, edgeLight: 38, dither: 8, hueShift: 20 },
  },
  {
    id: 'faithful', name: 'Faithful HD', jp: 'フェイスフルHD', tag: 'Faithful 32x系',
    desc: '階調を増やし細密グレインを乗せる。64xの情報量を最大限に使う。',
    style: { outline: 50, softness: 70, saturation: 116, contrast: 70, highlight: 66, grain: 55, bevel: 58, cartoon: 15, glow: 26, edgeLight: 60, dither: 48, hueShift: 34 },
  },
  {
    id: 'mythic', name: 'Dark Mythic', jp: 'ダークミシック', tag: 'Ragnarok系',
    desc: '黒を締めた重厚な陰影。ミシック武器の禍々しさを強調する。',
    style: { outline: 86, softness: 50, saturation: 112, contrast: 88, highlight: 58, grain: 34, bevel: 86, cartoon: 62, glow: 72, edgeLight: 82, dither: 20, hueShift: 72 },
  },
  {
    id: 'pastel', name: 'Pastel Sky', jp: 'パステルスカイ', tag: 'SkyPixel系',
    desc: '淡く明るいパステル調。柔らかい空島の空気感。',
    style: { outline: 44, softness: 94, saturation: 90, contrast: 26, highlight: 94, grain: 8, bevel: 50, cartoon: 34, glow: 44, edgeLight: 88, dither: 6, hueShift: 30 },
  },
  {
    id: 'overhaul', name: 'Overhaul Detail', jp: 'オーバーホール', tag: 'Overhaul 32x系',
    desc: '64xネイティブの描き込みを極限まで。金属の傷や刻印まで描く超解像志向。',
    style: { outline: 58, softness: 74, saturation: 124, contrast: 64, highlight: 76, grain: 72, bevel: 90, cartoon: 10, glow: 38, edgeLight: 68, dither: 62, hueShift: 42 },
  },
];

// ================= color =================
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
function mixHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) { const v = l * 255; return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue(p, q, h + 1 / 3) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3) * 255];
}
function stylizeHex(hex: string, satMul: number, conAmt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s0, l0] = rgbToHsl(r, g, b);
  const s = Math.max(0, Math.min(1, s0 * satMul));
  const l = Math.max(0, Math.min(1, (l0 - 0.5) * (1 + (conAmt / 100) * 0.6) + 0.5));
  const [nr, ng, nb] = hslToRgb(h, s, l);
  return rgbToHex(nr, ng, nb);
}

function shiftHueHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const [nr, ng, nb] = hslToRgb((h + amount + 1) % 1, s, l);
  return rgbToHex(nr, ng, nb);
}
/** hue-shifted shading: shadows go cooler/darker, lights go warmer — the core of good pixel art */
function shadeRamp(base: string, light: string, dark: string, style: StyleOptions): string[] {
  const sat = style.saturation / 100;
  const con = style.contrast / 100;
  const hl = style.highlight / 100;
  const soft = clamp(style.softness / 100, 0, 1);
  const hue = ((style.hueShift ?? 45) / 100) * 0.075;
  const b = stylizeHex(base, sat, style.contrast * 0.25);
  const l = shiftHueHex(stylizeHex(light, sat * 0.92, 0), -hue * 0.42);
  const d = shiftHueHex(stylizeHex(dark, sat * 1.05, style.contrast * 0.3), hue);
  return [
    mixHex(d, '#05060e', (0.30 + con * 0.34) * (1 - soft * 0.12)), // 0 darkest
    mixHex(d, b, soft * 0.08),                  // 1 dark
    b,                                          // 2 base
    mixHex(b, l, 0.48 + soft * 0.27),           // 3 light
    mixHex(l, '#ffffff', 0.18 + hl * 0.42),     // 4 lightest / specular
  ];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizedMix(mix: PackEssenceMix): PackEssenceMix {
  const total = mix.furfsky + mix.vanilla + mix.imperial + mix.faithful;
  if (total <= 0) return { furfsky: 0.25, vanilla: 0.25, imperial: 0.25, faithful: 0.25 };
  return {
    furfsky: mix.furfsky / total,
    vanilla: mix.vanilla / total,
    imperial: mix.imperial / total,
    faithful: mix.faithful / total,
  };
}

/** Converts the named style mix into concrete renderer traits. */
function resolveStyle(base: StyleOptions, essence: TextureEssence): StyleOptions {
  const m = normalizedMix(essence.mix);
  const furf = m.furfsky, vanilla = m.vanilla, imperial = m.imperial, faithful = m.faithful;
  const power = clamp(essence.stylePower ?? 1.35, 0, 2);
  const trait = (neutral: number, bold: number) => neutral + (bold - neutral) * power;
  return {
    ...base,
    outline: clamp(base.outline * essence.outline * trait(1, 0.52 + furf * 1.03 + imperial * 0.42 + faithful * 0.18 - vanilla * 0.15), 0, 240),
    softness: clamp(base.softness * trait(1, 0.56 + furf * 0.74 + vanilla * 0.52 + faithful * 0.24 - imperial * 0.13), 0, 140),
    saturation: clamp(base.saturation * essence.saturation * trait(1, 0.66 + furf * 0.82 + imperial * 0.38 + faithful * 0.18 - vanilla * 0.08), 0, 320),
    contrast: clamp(base.contrast * essence.contrast * trait(1, 0.60 + imperial * 0.95 + faithful * 0.52 + furf * 0.24 - vanilla * 0.16), 0, 240),
    highlight: clamp(base.highlight * trait(1, 0.62 + furf * 0.42 + imperial * 0.55 + faithful * 0.28), 0, 150),
    grain: clamp(base.grain + power * (faithful * 42 + imperial * 12 - vanilla * 10 - furf * 5), 0, 100),
    bevel: clamp(base.bevel * trait(1, 0.64 + imperial * 0.72 + faithful * 0.34 + furf * 0.30), 0, 150),
    cartoon: clamp(base.cartoon * trait(1, 0.54 + furf * 0.82 + vanilla * 0.56 - faithful * 0.32), 0, 100),
    glow: clamp(base.glow * essence.glow * trait(1, 0.60 + furf * 0.52 + imperial * 0.38 + faithful * 0.10), 0, 150),
    edgeLight: clamp(base.edgeLight * trait(1, 0.54 + furf * 0.62 + imperial * 0.48 + faithful * 0.25), 0, 150),
    dither: clamp(base.dither + power * (faithful * 50 + imperial * 12 - furf * 12 - vanilla * 8), 0, 100),
    hueShift: clamp(base.hueShift * trait(1, 0.52 + furf * 0.52 + imperial * 0.35 + faithful * 0.20), 0, 100),
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function hash2(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ================= geometry =================
function inPoly(x: number, y: number, pts: [number, number][]): boolean {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function sdRR(x: number, y: number, cx: number, cy: number, hw: number, hh: number, r: number): number {
  const dx = Math.abs(x - cx) - (hw - r), dy = Math.abs(y - cy) - (hh - r);
  const ax = Math.max(dx, 0), ay = Math.max(dy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(dx, dy), 0) - r;
}
const dist = (x: number, y: number, cx: number, cy: number) => Math.hypot(x - cx, y - cy);

// ================= sampler type =================
export interface Ramps { metal: string[]; accent: string[]; grip: string[]; gem: string[] }
export type Sampler = (x: number, y: number) => string | null;

interface BuildArgs {
  p: ItemDef['palette'];
  shape: number;
  style: StyleOptions;
  R: Ramps;
  detail: number; // 0=16px, 1=32px, 2=64px
  rnd: (a: number, b: number) => number;
  runes: number;
  gems: number;
  wear: number;
}

/** remap ramp level according to cartoon / softness sliders */
function makeLv(style: StyleOptions) {
  const cel = style.cartoon / 100;
  return (i: number): number => {
    if (cel > 0.75) return i <= 1 ? 1 : i >= 3 ? 4 : 2;      // 3 tone
    if (cel > 0.45) return i === 1 ? 1 : i === 3 ? 3 : i;    // 4-5 tone
    return i;
  };
}

// --------------- SWORD ---------------
function swordSampler(a: BuildArgs): Sampler {
  const { shape, R, detail, style, rnd, runes, gems } = a;
  const lv = makeLv(style);
  const Ox = 11.5, Oy = 52.5;
  const dx = Math.SQRT1_2, dy = -Math.SQRT1_2;
  const nx = Math.SQRT1_2, ny = Math.SQRT1_2; // perpendicular, +t = lower-right (shadow side)

  const cfg = [
    { bw: 4.7, guard: 11.0, gT: 4.2, tip: 8, katana: false },  // 0 broad
    { bw: 3.5, guard: 6.5, gT: 3.4, tip: 12, katana: true },   // 1 katana
    { bw: 6.6, guard: 14.0, gT: 5.0, tip: 9, katana: false },  // 2 claymore
    { bw: 5.0, guard: 12.5, gT: 4.6, tip: 8, katana: false },  // 3 fantasy
    { bw: 4.6, guard: 10.0, gT: 4.0, tip: 8, katana: false },  // 4 ornate
  ][shape] ?? { bw: 4.7, guard: 11, gT: 4.2, tip: 8, katana: false };

  const sBladeStart = 26.5;
  const sEnd = 58.5;
  const sTip = sEnd - cfg.tip;
  const sGuard0 = 22.0, sGuard1 = 26.5;
  const sGrip0 = 5.5, sGrip1 = 22.0;

  // gem positions along blade
  const runePositions: number[] = [];
  if (detail >= 1 && runes > 0.04) {
    const maxRunes = detail >= 2 ? (shape === 3 ? 4 : 3) : 2;
    const n = Math.max(1, Math.round(maxRunes * runes));
    for (let i = 0; i < n; i++) runePositions.push(sBladeStart + 5 + (i * (sTip - sBladeStart - 7)) / Math.max(1, n - 1));
  }

  return (x, y) => {
    const rx = x - Ox, ry = y - Oy;
    const s = rx * dx + ry * dy;
    const t = rx * nx + ry * ny;

    // ---- blade ----
    if (s >= sBladeStart && s <= sEnd) {
      let w = cfg.bw;
      if (s > sTip) w = cfg.bw * ((sEnd - s) / (sEnd - sTip));
      // ornate barbs
      if (shape === 4 && detail >= 1) {
        const ph = ((s - sBladeStart) % 9) / 9;
        if (ph < 0.42) w += 1.9 * (1 - Math.abs(ph - 0.21) / 0.21) * 0.9;
      }
      // claymore notch
      if (shape === 2 && s > sBladeStart + 3 && s < sBladeStart + 6.5) w += 1.6;
      const lo = cfg.katana ? -1.1 : -w;
      const hi = w;
      if (t >= lo && t <= hi) {
        const span = hi - lo;
        const n = span > 0.001 ? ((t - lo) / span) * 2 - 1 : 0; // -1 (upper-left) .. 1 (lower-right)
        // gems
        for (const gs of runePositions) {
          const gemRadius = (detail >= 2 ? 0.9 : 0.7) + (detail >= 2 ? 1.65 : 1.0) * gems;
          if (Math.abs(s - gs) + Math.abs(t) * 1.1 < gemRadius && s < sTip) {
            const near = Math.abs(s - gs) + Math.abs(t);
            return R.gem[lv(near < 0.9 ? 4 : 3)];
          }
        }
        let i: number;
        if (n < -0.80) i = 2;
        else if (n < -0.26) i = 4;
        else if (n < 0.22) i = 3;
        else if (n < 0.60) i = 2;
        else if (n < 0.86) i = 1;
        else i = 0;
        // hamon / temper line for katana
        if (cfg.katana && detail >= 1 && n > 0.15 && n < 0.45) {
          const wob = Math.sin(s * 0.85) * 0.12;
          if (n > 0.2 + wob && n < 0.34 + wob) i = 4;
        }
        // tip brightening
        if (s > sTip + (sEnd - sTip) * 0.45) i = Math.min(4, i + 1);
        // engraved fuller dashes at 64px
        if (detail >= 2 && runes > 0.08 && Math.abs(n + 0.5) < 0.18 && Math.floor(s) % Math.max(3, Math.round(8 - runes * 5)) === 0) i = Math.min(4, i + 1);
        // micro scratches
        if (detail >= 2 && rnd(s, t) > 0.94) i = Math.max(0, i - 1);
        return R.metal[lv(i)];
      }
    }

    // ---- guard ----
    if (s >= sGuard0 && s <= sGuard1 + (shape === 3 ? 1.5 : 0)) {
      let gw = cfg.guard;
      const u = (s - sGuard0) / (sGuard1 - sGuard0);
      gw *= 0.55 + 0.45 * Math.sin(Math.min(1, u) * Math.PI); // lens shape
      if (shape === 3) gw = cfg.guard * (0.5 + 0.5 * Math.sin(Math.min(1, u) * Math.PI)) + 1.5;
      if (Math.abs(t) <= gw) {
        const edge = 1 - Math.abs(t) / gw;
        let i = u < 0.32 ? 1 : u < 0.62 ? 3 : 2;
        if (u < 0.15) i = 0;
        if (edge < 0.16) i = Math.max(0, i - 2);
        // end jewels
        if (detail >= 1 && Math.abs(Math.abs(t) - (gw - 1.6)) < 1.5 && u > 0.3 && u < 0.75) return R.gem[lv(3)];
        return R.accent[lv(i)];
      }
    }

    // ---- grip ----
    if (s >= sGrip0 && s <= sGrip1) {
      const gw = shape === 2 ? 2.9 : 2.5;
      if (Math.abs(t) <= gw) {
        const n = t / gw;
        let i = n < -0.45 ? 3 : n < 0.25 ? 2 : n < 0.7 ? 1 : 0;
        if (detail >= 1) {
          const wrap = Math.floor((s - sGrip0) / (detail >= 2 ? 2.4 : 3.4)) % 2;
          if (wrap === 0) i = Math.min(4, i + 1); else i = Math.max(0, i - 1);
        }
        return R.grip[lv(i)];
      }
    }

    // ---- pommel ----
    if (s < sGrip0 + 1.2) {
      const px = Ox + dx * 3.0, py = Oy + dy * 3.0;
      const d = dist(x, y, px, py);
      const rad = shape === 3 ? 4.1 : 3.4;
      if (d <= rad) {
        const lx = (x - px + y - py) / (rad * 2);
        let i = lx < -0.42 ? 4 : lx < -0.05 ? 3 : lx < 0.3 ? 2 : lx < 0.62 ? 1 : 0;
        if (d > rad - 1.0) i = Math.max(0, i - 1);
        return R.gem[lv(i)];
      }
    }
    return null;
  };
}

// --------------- BOW ---------------
function bowSampler(a: BuildArgs): Sampler {
  const { shape, R, detail, style, rnd, runes, gems } = a;
  const lv = makeLv(style);
  const CX = 6, CY = 32, RAD = 25.5;
  const halfAng = 1.17; // ~67deg
  const thick = shape === 1 ? 2.3 : 2.8;

  return (x, y) => {
    const d = dist(x, y, CX, CY);
    const ang = Math.atan2(y - CY, x - CX);
    const inArc = Math.abs(ang) <= halfAng;

    // grip (center swell)
    if (inArc && Math.abs(ang) < 0.30 && d > RAD - thick - 3.2 && d < RAD + thick + 0.6) {
      const n = (d - (RAD - thick - 3.2)) / (thick * 2 + 3.8);
      let i = n < 0.22 ? 1 : n < 0.42 ? 3 : n < 0.72 ? 2 : 0;
      if (detail >= 1 && gems > 0.12 && Math.abs(ang) < 0.12 && n > 0.3 && n < 0.62) return R.gem[lv(4)];
      return R.accent[lv(i)];
    }
    // limbs
    if (inArc && Math.abs(d - RAD) <= thick) {
      const n = (d - RAD) / thick; // -1 inner .. 1 outer
      let i = n < -0.55 ? 3 : n < 0.05 ? 4 : n < 0.5 ? 2 : 0;
      // taper near tips
      const tp = 1 - Math.abs(ang) / halfAng;
      if (tp < 0.12 && Math.abs(n) > 0.45) return null;
      if (detail >= 2 && rnd(d, ang * 10) > 0.93) i = Math.max(0, i - 1);
      // decorative bands
      if (detail >= 1 && runes > 0.12 && Math.abs(Math.abs(ang) - 0.75) < 0.05) return R.accent[lv(3)];
      return R.metal[lv(i)];
    }
    // tips
    for (const sgn of [-1, 1]) {
      const tx = CX + Math.cos(halfAng * sgn) * RAD, ty = CY + Math.sin(halfAng * sgn) * RAD;
      if (dist(x, y, tx, ty) <= (detail >= 1 ? 2.4 : 2.0)) {
        const l = (x - tx + y - ty) / 4;
        return R.accent[lv(l < -0.3 ? 4 : l < 0.3 ? 3 : 1)];
      }
    }
    // string
    {
      const x1 = CX + Math.cos(halfAng) * RAD;
      const y0 = CY - Math.sin(halfAng) * RAD, y1 = CY + Math.sin(halfAng) * RAD;
      const pull = shape === 2 ? 4.5 : 0;
      const mid = (y0 + y1) / 2;
      const tnorm = Math.abs(y - mid) / ((y1 - y0) / 2);
      const sx = x1 + pull * (1 - tnorm);
      if (y >= y0 && y <= y1 && Math.abs(x - sx) <= 0.62) return '#f2f4ff';
    }
    // nocked arrow for terminator
    if (shape === 2 && detail >= 1) {
      if (Math.abs(y - 32) <= 0.9 && x >= 8 && x <= 44) return R.grip[lv(2)];
      if (x > 40 && x < 48 && Math.abs(y - 32) < (48 - x) * 0.45) return R.metal[lv(4)];
      if (x > 8 && x < 15 && Math.abs(y - 32) < 3.4 && Math.abs(y - 32) > 1.0 && (x - 8) * 0.5 > Math.abs(y - 32) - 2.4) return R.gem[lv(y < 32 ? 3 : 1)];
    }
    return null;
  };
}

// --------------- AXE / PICK / HOE ---------------
function toolSampler(a: BuildArgs, kind: string): Sampler {
  const { shape, R, detail, style, rnd, runes, gems } = a;
  const lv = makeLv(style);
  const Ox = 12.5, Oy = 52.5;
  const dx = Math.SQRT1_2, dy = -Math.SQRT1_2;
  const nx = Math.SQRT1_2, ny = Math.SQRT1_2;

  const axeBody: [number, number][] = [[30, 15], [43, 11], [45, 31], [32, 28]];
  const hoeBody: [number, number][] = [[32, 12], [50, 12], [50, 17.5], [36, 19]];
  const hoeLip: [number, number][] = [[44, 17.5], [50, 17.5], [55, 30], [47, 29]];

  return (x, y) => {
    const rx = x - Ox, ry = y - Oy;
    const s = rx * dx + ry * dy;
    const t = rx * nx + ry * ny;

    // ---- AXE ----
    if (kind === 'axe') {
      const BCX = 39, BCY = 21, RO = 17.0, RI = 11.8;
      const bd = dist(x, y, BCX, BCY);
      const bang = Math.atan2(y - BCY, x - BCX);
      const inBit = Math.abs(bang) < 1.22 && bd <= RO && bd >= RI;
      const inBody = inPoly(x, y, axeBody);
      if (inBit || inBody) {
        let i: number;
        if (inBit) {
          const e = (RO - bd) / (RO - RI);   // 0 = cutting edge, 1 = inner
          i = e < 0.20 ? 4 : e < 0.42 ? 3 : e < 0.72 ? 2 : 1;
          if (y > BCY + 7) i = Math.max(0, i - 1);
          if (y < BCY - 9) i = Math.min(4, i + 1);
        } else {
          const ny2 = (y - 11) / 20;
          i = ny2 < 0.18 ? 4 : ny2 < 0.42 ? 3 : ny2 < 0.72 ? 2 : 1;
          if (x < 34) i = Math.max(0, i - 1);
          if (detail >= 1 && gems > 0.1 && (dist(x, y, 35, 18) < 1.7 || dist(x, y, 40, 24) < 1.7)) return R.accent[lv(3)];
        }
        if (detail >= 2 && rnd(x, y) > 0.93) i = Math.max(0, i - 1);
        return R.metal[lv(i)];
      }
    }

    // ---- HOE ----
    if (kind === 'hoe') {
      const onBar = inPoly(x, y, hoeBody);
      const onLip = inPoly(x, y, hoeLip);
      if (onBar || onLip) {
        let i: number;
        if (onLip) {
          // downward blade: bright cutting edge on the right
          const e = (55 - x) / 9;
          i = e < 0.26 ? 4 : e < 0.55 ? 3 : e < 0.82 ? 2 : 1;
          if (y > 26) i = Math.max(0, i - 1);
        } else {
          const ny2 = (y - 12) / 7;
          i = ny2 < 0.26 ? 4 : ny2 < 0.55 ? 3 : ny2 < 0.82 ? 2 : 1;
        }
        if (detail >= 1 && gems > 0.1 && dist(x, y, 36, 15) < 1.7) return R.accent[lv(3)];
        if (detail >= 2 && rnd(x, y) > 0.93) i = Math.max(0, i - 1);
        return R.metal[lv(i)];
      }
    }

    // ---- PICKAXE ----
    if (kind === 'pickaxe') {
      const CX = 36, CY = 40, RAD = 26, TH = 4.3;
      const d = dist(x, y, CX, CY);
      const ang = Math.atan2(y - CY, x - CX);
      if (ang < -0.72 && ang > -2.46) {
        const tp = Math.min(Math.abs(ang + 0.72), Math.abs(ang + 2.46)) / 0.42;
        const allow = TH * Math.min(1, 0.18 + tp * 0.82);
        if (Math.abs(d - RAD) <= allow) {
          const n = (d - RAD) / TH;
          let i = n < -0.52 ? 3 : n < -0.05 ? 4 : n < 0.42 ? 2 : 0;
          if (ang > -1.05 || ang < -2.12) i = Math.max(0, i - 1);
          if (detail >= 1 && runes > 0.1 && Math.abs(ang + 1.40) < 0.13) return R.accent[lv(3)];
          if (detail >= 2 && gems > 0.12 && Math.abs(Math.abs(ang + 1.40) - 0.58) < 0.055) return R.gem[lv(4)];
          if (detail >= 2 && rnd(x, y) > 0.93) i = Math.max(0, i - 1);
          return R.metal[lv(i)];
        }
      }
      // collar joining head and handle
      if (dist(x, y, 37, 22) < 3.6) return R.accent[lv(y < 21 ? 3 : 1)];
    }

    // ---- handle ----
    const hMax = kind === 'pickaxe' ? 40 : kind === 'hoe' ? 40 : 38;
    if (s >= 2 && s <= hMax && Math.abs(t) <= 2.4) {
      const n = t / 2.4;
      let i = n < -0.45 ? 3 : n < 0.25 ? 2 : n < 0.7 ? 1 : 0;
      if (detail >= 1) {
        const band = Math.floor(s / 6) % 2;
        if (band === 0 && n > -0.2 && n < 0.35) i = Math.min(4, i + 1);
      }
      if (detail >= 1 && (s < 4.5 || Math.abs(s - 12) < 1.6)) return R.accent[lv(n < 0 ? 3 : 1)];
      return R.grip[lv(i)];
    }
    void shape;
    return null;
  };
}

// --------------- HELMET ---------------
function helmetSampler(a: BuildArgs): Sampler {
  const { shape, R, detail, style, rnd, runes, gems } = a;
  const lv = makeLv(style);
  return (x, y) => {
    // ---- appendages drawn OUTSIDE the main silhouette ----
    if (detail >= 1) {
      if (shape === 0 || shape === 2) {
        // swept horns
        if (inPoly(x, y, [[19, 24], [5, 13], [8, 7], [18, 16]]) || inPoly(x, y, [[45, 24], [59, 13], [56, 7], [46, 16]])) {
          const u = Math.abs(x - 32) / 27;
          return R.accent[lv(x < 32 ? (u > 0.75 ? 4 : 3) : (u > 0.75 ? 2 : 1))];
        }
      }
      if (shape === 1) {
        // storm: scroll horns curling off the temples
        for (const sgn of [-1, 1]) {
          const lx = (x - 32) * sgn;
          if (lx > 13 && lx < 22 && y > 14 && y < 26) {
            const cd = dist(lx, y, 17.5, 20);
            if (cd < 4.6 && cd > 1.9) return R.gem[lv(sgn < 0 ? 3 : 1)];
            if (cd <= 1.9) return R.accent[lv(4)];
          }
        }
      }
      if (shape === 3) {
        // wither goggles: side straps
        if (Math.abs(y - 30) < 2.4 && (x < 18 || x > 46) && x > 8 && x < 56) return R.grip[lv(y < 30 ? 3 : 1)];
      }
    }
    // --- silhouette: rounded crown + tapering jaw + flared gorget ---
    const crown = sdRR(x, y, 32, 23.5, 15.5, 13.0, 11.5);
    const jaw = inPoly(x, y, [[17, 23], [47, 23], [45, 37], [40, 46], [24, 46], [19, 37]]);
    const gorget = inPoly(x, y, [[22, 43], [42, 43], [47, 53], [17, 53]]);
    if (crown > 0 && !jaw && !gorget) return null;
    if (gorget && !jaw && crown > 0) {
      const gl = (y - 43) / 10;
      return R.accent[lv(gl < 0.22 ? 4 : gl < 0.5 ? 3 : x < 32 ? 2 : 1)];
    }
    const d = Math.min(crown, jaw ? -1.6 : 1);

    const ny = (y - 10.5) / 36;
    const nx = (x - 32) / 16;

    // ---- brow ridge ----
    if (y > 23.5 && y < 26.5 && Math.abs(nx) < 0.92 && shape !== 3) {
      return R.accent[lv(y < 24.8 ? 4 : 2)];
    }

    // ---- face opening ----
    if (shape === 3) {
      for (const gx of [24, 40]) {
        const gd = dist(x, y, gx, 30);
        if (gd < 7.4) {
          if (gd > 5.6) return R.accent[lv(1)];
          const l = (x - gx + y - 30) / 11;
          if (l < -0.45) return R.gem[lv(4)];
          return R.gem[lv(l < 0 ? 3 : l < 0.4 ? 2 : 1)];
        }
      }
      if (Math.abs(y - 30) < 1.6 && x > 29 && x < 35) return R.accent[lv(2)];
    } else {
      const eyeSlot = y >= 26.5 && y < 33 && Math.abs(x - 32) < 12.5;
      const breath = Math.abs(x - 32) < 2.6 && y >= 26.5 && y < 43;
      if (eyeSlot || breath) {
        if (Math.abs(x - 32) < 2.6 && eyeSlot) return R.metal[lv(x < 32 ? 3 : 1)];
        if (breath) {
          if (detail >= 1 && runes > 0.18 && Math.floor(y) % 3 === 0) return R.accent[lv(1)];
          return mixHex(R.metal[0], '#05060e', 0.62);
        }
        const eyeX = (x > 21.5 && x < 28.5) || (x > 35.5 && x < 42.5);
        if (eyeX && y > 27.3 && y < 32) {
          const inner = (x > 22.4 && x < 27.6) || (x > 36.4 && x < 41.6);
          return R.gem[lv(inner ? 4 : 3)];
        }
        return mixHex(R.metal[0], '#05060e', 0.62);
      }
    }

    // ---- trims ----
    
    if (shape === 1 && y > 39 && y < 42.5) return R.accent[lv(y < 40.2 ? 4 : 2)];
    if (shape === 2 && detail >= 1 && Math.abs(nx) > 0.62 && y > 33 && y < 44) return R.accent[lv(nx < 0 ? 3 : 1)];

    // ---- dome shading ----
    let i: number;
    if (ny < 0.07) i = 4;
    else if (ny < 0.19) i = 3;
    else if (ny > 0.92) i = 0;
    else if (ny > 0.80) i = 1;
    else i = 2;
    if (nx < -0.55) i = Math.min(4, i + 1);
    if (nx < -0.80) i = Math.min(4, i + 1);
    if (nx > 0.52) i = Math.max(0, i - 1);
    if (nx > 0.78 || d > -1.4) i = Math.max(0, i - 1);
    // jaw plate is a shade darker than the crown
    if (y > 34) i = Math.max(0, i - 1);
    // rivets
    if (detail >= 1 && gems > 0.12 && (dist(x, y, 20.5, 19.5) < 1.7 || dist(x, y, 43.5, 19.5) < 1.7 || dist(x, y, 24, 40) < 1.5 || dist(x, y, 40, 40) < 1.5)) return R.accent[lv(3)];
    if (detail >= 2 && rnd(x, y) > 0.94) i = Math.max(0, i - 1);
    return R.metal[lv(i)];
  };
}

// --------------- CHESTPLATE ---------------
function chestSampler(a: BuildArgs): Sampler {
  const { shape, R, detail, style, rnd, runes, gems } = a;
  const lv = makeLv(style);
  const torso: [number, number][] = [
    [15, 22], [21, 15], [43, 15], [49, 22], [49, 31], [44, 34], [43, 50], [21, 50], [20, 34], [15, 31],
  ];
  return (x, y) => {
    // ---- neck opening ----
    if (dist(x, y, 32, 12.5) < 7.6) return null;
    if (!inPoly(x, y, torso)) return null;

    const nx = (x - 32) / 17;
    const ny = (y - 15) / 35;

    // ---- pauldron caps (part of the silhouette, separated by a rim line) ----
    const px = Math.abs(x - 32);
    if (px > 10.5 && y < 27.5) {
      const rim = px > 10.5 && px < 12.2;
      if (rim) return R.accent[lv(x < 32 ? 3 : 1)];
      if (y > 25.6) return R.accent[lv(x < 32 ? 3 : 1)];
      const u = (y - 15) / 11;
      let i = u < 0.22 ? 4 : u < 0.5 ? 3 : u < 0.78 ? 2 : 1;
      if (x > 32) i = Math.max(0, i - 1);
      if (detail >= 1 && Math.abs(u - 0.5) < 0.07) i = Math.max(0, i - 2);
      if (detail >= 1 && gems > 0.12 && (dist(x, y, 17.5, 21) < 1.7 || dist(x, y, 46.5, 21) < 1.7)) return R.gem[lv(3)];
      return R.metal[lv(i)];
    }

    // gorget / collar trim
    if (ny < 0.09) return R.accent[lv(nx < 0 ? 4 : 2)];
    // belt
    if (y > 40 && y < 44.5) return R.accent[lv(y < 41.4 ? 4 : nx < 0 ? 2 : 1)];
    // abdominal lames below the belt
    if (y >= 44.5 && detail >= 1) {
      const band = Math.floor((y - 44.5) / 2.2) % 2;
      let i = band === 0 ? 2 : 1;
      if (nx < -0.5) i = Math.min(4, i + 1);
      if (nx > 0.5) i = Math.max(0, i - 1);
      return R.metal[lv(i)];
    }
    // centre ridge
    if (Math.abs(nx) < 0.08) return R.metal[lv(nx < 0 ? 4 : 0)];
    // chest gem
    if (detail >= 1 && gems > 0.08) {
      const dd = Math.abs(x - 32) + Math.abs(y - 28);
      if (dd < (detail >= 2 ? 2.2 + gems * 3.8 : 1.8 + gems * 2.4)) {
        if (dd > (detail >= 2 ? 1.6 + gems * 3.2 : 1.3 + gems * 2.0)) return R.accent[lv(0)];
        return R.gem[lv(dd < 1.8 ? 4 : dd < 3.2 ? 3 : 1)];
      }
    }
    // pectoral plates
    let i: number;
    if (ny < 0.24) i = 3;
    else if (ny < 0.58) i = 2;
    else i = 2;
    if (nx < -0.58) i = Math.min(4, i + 1);
    else if (nx < -0.26) i = Math.min(4, i + 1);
    if (nx > 0.52) i = Math.max(0, i - 1);
    if (nx > 0.78) i = Math.max(0, i - 1);
    // pectoral separation seam
    if (detail >= 1 && runes > 0.12 && Math.abs(y - 34) < 0.9 && Math.abs(nx) > 0.12) i = Math.max(0, i - 2);
    if (shape === 1 && detail >= 2 && Math.abs(Math.abs(nx) - 0.52) < 0.06 && y > 22 && y < 40) return R.accent[lv(3)];
    if (detail >= 2 && rnd(x, y) > 0.94) i = Math.max(0, i - 1);
    return R.metal[lv(i)];
  };
}

// --------------- BLOCK ---------------
function blockSampler(a: BuildArgs): Sampler {
  const { shape, R, detail, style, rnd, runes, gems } = a;
  const lv = makeLv(style);
  if (shape === 1) {
    // ---- enchanted book (front cover, slight perspective) ----
    return (x, y) => {
      if (sdRR(x, y, 33, 32, 19, 22, 3) > 0) return null;
      // page block peeking on the right & bottom
      if (x > 47.5 || y > 50.5) {
        if (sdRR(x, y, 33, 32, 19, 22, 3) > -0.1) return R.accent[lv(0)];
        const band = Math.floor((x > 47.5 ? y : x) / 2) % 2;
        return band === 0 ? '#efe8d8' : '#cec6b2';
      }
      // spine
      if (x < 20) {
        const l = (x - 14) / 6;
        return R.accent[lv(l < 0.35 ? 3 : l < 0.7 ? 2 : 0)];
      }
      // metal corner fittings
      if (detail >= 1) {
        const cn = (cx: number, cy: number) => Math.abs(x - cx) + Math.abs(y - cy) < 7;
        if (cn(22, 14) || cn(45, 14) || cn(22, 50) || cn(45, 50)) {
          const l = (x - 20 + y - 12) / 50;
          return R.gem[lv(l < 0.35 ? 4 : l < 0.6 ? 3 : 1)];
        }
      }
      // central rune sigil
      const rd = Math.abs(x - 34) + Math.abs(y - 32);
      if (runes > 0.05 && rd < 4 + runes * 6.5) {
        if (rd < 3.2) return R.gem[lv(4)];
        if (rd < 5.0) return R.gem[lv(2)];
        if (rd < 6.4) return R.gem[lv(4)];
        if (rd > 9.0) return R.gem[lv(1)];
      }
      // leather cover shading
      const l = (x - 20 + (y - 12) * 0.5) / 40;
      let i = l < 0.18 ? 3 : l < 0.5 ? 2 : l < 0.8 ? 1 : 0;
      if (detail >= 2 && rnd(x, y) > 0.9) i = Math.max(0, i - 1);
      return R.metal[lv(i)];
    };
  }
  // ---- gemstone / crystal block (beveled frame + embedded crystals) ----
  return (x, y) => {
    if (x < 5 || x > 59 || y < 5 || y > 59) return null;
    const e = Math.min(x - 5, 59 - x, y - 5, 59 - y);
    const lt = (x - 5) < (59 - x) || (y - 5) < (59 - y);
    const tlSide = (x - 5) <= e + 0.01 || (y - 5) <= e + 0.01;
    // beveled frame (3px)
    if (e < 3) {
      return R.metal[lv(tlSide ? 4 : 0)];
    }
    if (e < 4.6) return R.metal[lv(tlSide ? 3 : 1)];
    void lt;
    // ---- embedded cut gems: 4 large rhombi + 1 centre, classic ore-block layout ----
    const gemSpots: [number, number, number][] = detail >= 1
      ? [[19, 19, 7.5], [45, 19, 6.5], [19, 45, 6.5], [45, 45, 7.5], [32, 32, 9.0]]
      : [[22, 22, 8], [42, 42, 8]];
    for (const [cx2, cy2, originalRadius] of gemSpots) {
      if (gems < 0.12 || (gems < 0.42 && hash2(cx2, cy2, 57) > gems * 1.8)) continue;
      const rad = originalRadius * (0.55 + gems * 0.62);
      const dd = Math.abs(x - cx2) + Math.abs(y - cy2);
      if (dd < rad) {
        const n = dd / rad;
        // faceted: upper-left facet bright, lower-right dark, thin dark rim
        const diag = (x - cx2 + (y - cy2)) / rad;
        let gi: number;
        if (n > 0.86) gi = 0;
        else if (diag < -0.45) gi = 4;
        else if (diag < -0.05) gi = 3;
        else if (diag < 0.40) gi = 2;
        else gi = 1;
        if (detail >= 2 && n < 0.22 && diag < 0) gi = 4;
        return R.gem[lv(gi)];
      }
    }
    // ---- matrix (light from upper-left) ----
    const l = (x - 8 + (y - 8)) / 96;
    let i = l < 0.24 ? 2 : l < 0.62 ? 1 : 0;
    if (detail >= 2 && rnd(x, y) > 0.9) i = Math.min(2, i + 1);
    return R.metal[lv(i)];
  };
}

// --------------- ORB ---------------
function orbSampler(a: BuildArgs): Sampler {
  const { shape, R, detail, style, rnd, runes, gems } = a;
  const lv = makeLv(style);
  const CX = 32, CY = 32, RAD = shape === 0 ? 20 : 18.5;
  return (x, y) => {
    const d = dist(x, y, CX, CY);
    if (d > RAD) return null;
    const l = (x - CX + (y - CY)) / (RAD * 2); // -1 upper-left .. 1 lower-right
    const rim = d > RAD - 1.6;

    if (shape === 0) {
      // ---- summoning eye: sclera / iris ring / slit pupil ----
      const pw = 2.4 + Math.max(0, 1 - Math.abs(y - CY) / 9) * 1.4;
      if (Math.abs(x - CX) < pw && Math.abs(y - CY) < 9.2) {
        // glint inside the pupil
        if (detail >= 1 && gems > 0.12 && dist(x, y, CX - 0.8, CY - 4.2) < 1.5) return R.gem[4];
        return '#080a12';
      }
      if (d < 11.8) {
        const ir = d / 11.8;
        let i: number;
        if (ir > 0.88) i = 0;                       // dark limbal ring
        else if (l < -0.32) i = 4;
        else if (l < 0.02) i = 3;
        else if (l < 0.38) i = 2;
        else i = 1;
        if (detail >= 1 && runes > 0.1) {
          const ang = Math.atan2(y - CY, x - CX);
          if (Math.abs(Math.sin(ang * 7)) > 0.80 && ir > 0.4) i = Math.max(0, i - 1);
        }
        return R.gem[lv(i)];
      }
      // sclera
      let i = rim ? 0 : l < -0.45 ? 4 : l < -0.1 ? 3 : l < 0.3 ? 2 : l < 0.65 ? 1 : 0;
      if (detail >= 1 && runes > 0.1) {
        const ang = Math.atan2(y - CY, x - CX);
        if (Math.abs(Math.sin(ang * 3.5 + d * 0.3)) > 0.95) i = Math.max(0, i - 1); // veins
      }
      return R.metal[lv(i)];
    }
    // pearl: swirl
    let i = rim ? 1 : l < -0.5 ? 4 : l < -0.15 ? 3 : l < 0.25 ? 2 : l < 0.6 ? 1 : 0;
    if (d > RAD - 2.6 && l > 0.1) i = Math.min(4, i + 2); // bottom bounce light
    if (detail >= 1) {
      const ang = Math.atan2(y - CY, x - CX);
      const sw = (ang + Math.PI) / (Math.PI * 2) + d / 26;
      if ((sw % 0.5) < 0.09 && d < RAD - 3) i = Math.min(4, i + 1);
    }
    if (gems > 0.06 && dist(x, y, CX - RAD * 0.36, CY - RAD * 0.38) < (detail >= 2 ? 1.0 + gems * 3.1 : 0.8 + gems * 2.2)) return R.gem[4];
    if (detail >= 2 && rnd(x, y) > 0.95) i = Math.min(4, i + 1);
    return R.metal[lv(i)];
  };
}

// --------------- STAFF ---------------
function staffSampler(a: BuildArgs): Sampler {
  const { shape, R, detail, style, rnd, runes, gems } = a;
  const lv = makeLv(style);
  const Ox = 11.5, Oy = 52.5;
  const dx = Math.SQRT1_2, dy = -Math.SQRT1_2;
  const nx = Math.SQRT1_2, ny = Math.SQRT1_2;
  const HX = 42, HY = 21, HR = shape === 1 ? 9.5 : 8.4;

  return (x, y) => {
    // head orb
    const hd = dist(x, y, HX, HY);
    if (hd <= HR) {
      const l = (x - HX + y - HY) / (HR * 2);
      if (hd < HR * 0.48) {
        return R.gem[lv(l < -0.3 ? 4 : l < 0.2 ? 3 : 2)];
      }
      let i = l < -0.45 ? 4 : l < -0.1 ? 3 : l < 0.3 ? 2 : l < 0.62 ? 1 : 0;
      if (hd > HR - 1.4) i = Math.max(0, i - 1);
      if (detail >= 2 && rnd(x, y) > 0.94) i = Math.min(4, i + 1);
      return R.gem[lv(i)];
    }
    // wings / prongs
    if (shape === 0) {
      // bat wings with scalloped trailing edge
      for (const sgn of [-1, 1]) {
        const lx = (x - HX) * sgn;      // 0 at orb .. positive outward
        const ly = y - HY;
        if (lx > 1.5 && lx < 19) {
          const u = (lx - 1.5) / 17.5;                 // 0..1 outward
          const top = -3 - 9 * Math.sin(u * 1.5);       // upper edge rises
          const scal = 2.2 * Math.abs(Math.sin(u * 9.4));
          const bot = 4.5 - 6.0 * u + scal;             // scalloped lower edge
          if (ly > top && ly < bot) {
            const v = (ly - top) / Math.max(0.6, bot - top);
            let i = v < 0.22 ? 3 : v < 0.55 ? 2 : v < 0.85 ? 1 : 0;
            if (sgn > 0) i = Math.max(0, i - 1);
            // wing bones
            if (detail >= 1 && runes > 0.1 && Math.abs((u * 3) % 1) < 0.10) i = Math.min(4, i + 2);
            return R.accent[lv(i)];
          }
        }
      }
    } else {
      // claw prongs cradling the orb
      for (const [ox, oy] of [[-15, -11], [15, -11], [-13, 11], [13, 11]] as [number, number][]) {
        const L2 = ox * ox + oy * oy;
        const t0 = Math.max(0, Math.min(1, ((x - HX) * ox + (y - HY) * oy) / L2));
        const qx = HX + ox * t0, qy = HY + oy * t0;
        const dq = dist(x, y, qx, qy);
        const px = HX + ox, py = HY + oy;
        if (t0 > 0.42 && dq < 2.7 - t0 * 1.0) {
          if (gems > 0.1 && dist(x, y, px, py) < 2.6) return R.gem[lv(4)];
          return R.accent[lv(x < HX ? 3 : 1)];
        }
      }
    }
    // rod
    const rx = x - Ox, ry = y - Oy;
    const s = rx * dx + ry * dy;
    const t = rx * nx + ry * ny;
    if (s >= 1.5 && s <= 33 && Math.abs(t) <= 2.3) {
      const n = t / 2.3;
      let i = n < -0.45 ? 3 : n < 0.25 ? 2 : n < 0.7 ? 1 : 0;
      if (detail >= 1 && runes > 0.08) {
        const band = Math.floor(s / 5) % 2;
        if (band === 0) i = Math.min(4, i + 1);
      }
      if (detail >= 1 && (s < 4 || Math.abs(s - 30) < 2)) return R.accent[lv(n < 0 ? 3 : 1)];
      return R.grip[lv(i)];
    }
    return null;
  };
}

// ================= main =================
function getOutlineColor(p: ItemDef['palette'], style: StyleOptions): string {
  return mixHex(stylizeHex(p.dark, 0.85, 0), '#05060e', 0.62 + (style.contrast / 100) * 0.2);
}

function buildRamps(p: ItemDef['palette'], style: StyleOptions): Ramps {
  return {
    metal: shadeRamp(p.primary, p.light, p.dark, style),
    accent: shadeRamp(p.accent, mixHex(p.accent, p.light, 0.55), mixHex(p.accent, '#05060e', 0.4), style),
    grip: shadeRamp(p.handle, mixHex(p.handle, '#ffffff', 0.35), mixHex(p.handle, '#05060e', 0.42), style),
    gem: shadeRamp(p.extra ?? p.light, mixHex(p.extra ?? p.light, '#ffffff', 0.5), mixHex(p.extra ?? p.light, '#05060e', 0.5), style),
  };
}

function buildSampler(
  item: ItemDef,
  p: ItemDef['palette'],
  style: StyleOptions,
  detail: number,
  seed: number,
  essence: TextureEssence,
  shape: ShapeOptions,
  phase: number,
): ComposedSampler {
  // outline is dilated after sampling; reserve its width (in 64-space) inside the safe area
  const outline64 = style.outline <= 6 ? 0 : Math.min(7, Math.ceil((style.outline / 100) * 5));
  const key = preparedKey(item, p, style, detail, seed, essence, shape, phase);
  const cached = prepCache.get(key);
  if (cached) {
    prepCache.delete(key); prepCache.set(key, cached); // refresh LRU position
    return placeLayers(cached, shape, outline64);
  }

  const R = buildRamps(p, style);
  const rnd = (u: number, v: number) => hash2(Math.floor(u * 2.4), Math.floor(v * 2.4), seed);
  const args: BuildArgs = { p, shape: item.shape, style, R, detail, rnd, runes: essence.runes, gems: essence.gems, wear: essence.wear };
  const lv = makeLv(style);
  const formArgs: FormArgs = {
    R, lv, detail, seed, runes: essence.runes, gems: essence.gems, wear: essence.wear,
    decorationScale: shape.decorationScale,
    decorationSpread: shape.decorationSpread,
    phase,
  };

  let sampler: Sampler;
  if (shape.form === 'amorphous') {
    sampler = amorphousSampler(formArgs, Math.max(0.45, shape.amorphous));
  } else if (shape.form !== 'auto') {
    sampler = formSampler(shape.form, formArgs);
  } else {
    switch (item.kind) {
      case 'sword': sampler = swordSampler(args); break;
      case 'bow': sampler = bowSampler(args); break;
      case 'axe': sampler = toolSampler(args, 'axe'); break;
      case 'pickaxe': sampler = toolSampler(args, 'pickaxe'); break;
      case 'hoe': sampler = toolSampler(args, 'hoe'); break;
      case 'helmet': sampler = helmetSampler(args); break;
      case 'chestplate': sampler = chestSampler(args); break;
      case 'shield': sampler = formSampler((['heaterShield', 'roundShield', 'towerShield'] as const)[item.shape % 3], formArgs); break;
      case 'block': sampler = blockSampler(args); break;
      case 'orb': sampler = orbSampler(args); break;
      case 'staff': sampler = staffSampler(args); break;
      default: sampler = swordSampler(args);
    }
  }

  // irregularity is applied to the body only, so decorations stay readable
  if (shape.form !== 'amorphous' && shape.amorphous > 0.02) {
    sampler = amorphize(sampler, formArgs, clamp(shape.amorphous, 0, 1));
  }

  const prepared = prepareLayers(sampler, shape, essence, formArgs);
  prepCache.set(key, prepared);
  if (prepCache.size > PREP_CACHE_LIMIT) prepCache.delete(prepCache.keys().next().value!);
  return placeLayers(prepared, shape, outline64);
}

// Small LRU: while dragging, only placement fields change, so the expensive body analysis,
// decoration build and bounds scans are reused. Several entries let the main canvas, the
// 16x/64x comparison and the seed variations coexist without evicting each other.
const PREP_CACHE_LIMIT = 8;
const prepCache = new Map<string, PreparedLayers>();
function preparedKey(item: ItemDef, p: ItemDef['palette'], style: StyleOptions, detail: number, seed: number, essence: TextureEssence, shape: ShapeOptions, phase: number) {
  const placementFree = {
    ...shape,
    offsetX: 0, offsetY: 0, decorOffsetX: 0, decorOffsetY: 0, autoFit: true, fitPadding: 0, fitScope: 'all',
    decorTweaks: canonicalTweaks(shape, true),
  };
  return JSON.stringify([item.id, item.shape, p, style, detail, seed, essence, placementFree, phase]);
}

// ================= layered composition =================
export interface LayerBox { x: number; y: number; width: number; height: number }
export interface LayoutLayer { id: Decoration | 'body'; layer: 'back' | 'body' | 'front'; box: LayerBox | null; offsetX: number; offsetY: number }
/** Everything the editor needs to draw handles; all coordinates are output 64-space pixels. */
export interface RenderLayout {
  anchor: { x: number; y: number };
  fitScale: number;
  safe: LayerBox | null;
  layers: LayoutLayer[];
}

interface ComposedSampler { sampler: Sampler; layout: RenderLayout }

function scanBounds(sampler: Sampler, from: number, to: number, step: number) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let y = from; y <= to; y += step) {
    for (let x = from; x <= to; x += step) {
      if (!sampler(x, y)) continue;
      if (x < minX) minX = x; if (y < minY) minY = y;
      if (x > maxX) maxX = x; if (y > maxY) maxY = y;
    }
  }
  return Number.isFinite(minX) ? { minX, minY, maxX: maxX + step, maxY: maxY + step } : null;
}

/**
 * Pipeline:
 *   1. analyse the canonical body and build each decoration as its own canonical layer
 *   2. apply the SAME body transform (length/width/rotation/flip/twin/pivot) to every layer,
 *      so decorations stay attached to the body
 *   3. body anchor = centre of the transformed body; it is pinned to the target (offsetX/Y)
 *   4. auto-fit only chooses a uniform scale; decoration offsets are exact output pixels
 *      applied after the scale, so moving decorations never moves the body
 */
interface PreparedLayers {
  bodyT: Sampler;
  bodyBounds: Bounds | null;
  decor: { id: Decoration; layer: 'back' | 'front'; sampler: Sampler; tweak: DecorTweak; bounds: Bounds | null }[];
}
type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

function prepareLayers(body: Sampler, shape: ShapeOptions, essence: TextureEssence, formArgs: FormArgs): PreparedLayers {
  // ---- 1. canonical layers ----
  const visible = shape.decorations.filter((id) => !tweakOf(shape, id).hidden);
  const decorLayers: { id: Decoration; layer: 'back' | 'front'; canon: Sampler; tweak: DecorTweak }[] = [];
  if (visible.length) {
    const geo = analyzeBody(body);
    for (const id of visible) {
      const tweak = tweakOf(shape, id);
      const canon = buildDecorationLayer(id, {
        ...formArgs,
        decorationScale: (shape.decorationScale ?? 1) * tweak.scale,
        decorationSpread: (shape.decorationSpread ?? 1) * tweak.spread,
      }, geo, visible.length);
      if (canon) decorLayers.push({ id, layer: layerOf(shape, id), canon, tweak });
    }
  }

  // ---- 2. shared body transform ----
  const silhouetteScale = 0.82 + clamp(essence.silhouette, 0, 1) * 0.24;
  const length = Math.max(0.45, shape.length ?? 1) * silhouetteScale;
  const width = Math.max(0.45, shape.width ?? 1) * silhouetteScale;
  const rotation = ((shape.rotation ?? 0) * Math.PI) / 180;
  const mirror = shape.mirror ?? false;
  const twin = shape.twin ?? 'single';
  const pivot = shape.pivot === 'hilt' ? { x: 12, y: 52 }
    : shape.pivot === 'head' ? { x: 48, y: 16 }
      : shape.pivot === 'custom' ? { x: shape.pivotX, y: shape.pivotY }
        : { x: 32, y: 32 };

  const transform = (src: Sampler): Sampler => {
    const one = (x: number, y: number, angle: number, flip: boolean, offset: number): string | null => {
      const fx = shape.flipX ? 64 - x : x;
      const fy = shape.flipY ? 64 - y : y;
      const dx = fx - pivot.x, dy = fy - pivot.y;
      const c = Math.cos(-angle), sn = Math.sin(-angle);
      const rx = dx * c - dy * sn;
      const ry = dx * sn + dy * c;
      let along = (rx - ry) * Math.SQRT1_2;
      let across = (rx + ry) * Math.SQRT1_2 - offset;
      if (flip) across = -across;
      along /= length;
      across /= width;
      return src(pivot.x + (along + across) * Math.SQRT1_2, pivot.y + (-along + across) * Math.SQRT1_2);
    };
    if (twin === 'mirror') return (x, y) => one(x, y, rotation, mirror, 0) ?? one(64 - x, y, rotation, !mirror, 0);
    if (twin === 'crossed') {
      const spread = (14 * Math.PI) / 180;
      return (x, y) => one(x, y, rotation - spread, mirror, 0) ?? one(64 - x - 2, y + 2, rotation - spread, !mirror, 0);
    }
    if (twin === 'parallel') {
      const gap = 5.5 * width;
      return (x, y) => one(x, y, rotation, mirror, gap) ?? one(x, y, rotation, mirror, -gap);
    }
    return (x, y) => one(x, y, rotation, mirror, 0);
  };

  const bodyT = transform(body);
  const step = 1.5;
  return {
    bodyT,
    bodyBounds: scanBounds(bodyT, -32, 96, step),
    decor: decorLayers.map((l) => {
      const sampler = transform(l.canon);
      return { id: l.id, layer: l.layer, sampler, tweak: l.tweak, bounds: scanBounds(sampler, -32, 96, step) };
    }),
  };
}

/** Placement only: anchor, fit and offsets. Cheap enough to run on every drag step. */
function placeLayers(prep: PreparedLayers, shape: ShapeOptions, outline64: number): ComposedSampler {
  const { bodyT, bodyBounds } = prep;
  const decorT = prep.decor.map((l) => {
    const tweak = tweakOf(shape, l.id); // offsets are read live; they are excluded from the cache key
    return { ...l, offX: Math.round((shape.decorOffsetX ?? 0) + tweak.x), offY: Math.round((shape.decorOffsetY ?? 0) + tweak.y) };
  });

  // ---- 3. body anchor ----
  const anchor = bodyBounds
    ? { x: (bodyBounds.minX + bodyBounds.maxX) / 2, y: (bodyBounds.minY + bodyBounds.maxY) / 2 }
    : { x: 32, y: 32 };

  // ---- 4. fit ----
  const autoFit = shape.autoFit !== false;
  const safePad = autoFit ? clamp(shape.fitPadding ?? 3, 0, 14) : 0;
  // content must stop `outline64` short of the safe edge so the dilated outline still fits
  const pad = autoFit ? safePad + outline64 : 0;
  const clampTarget = (v: number) => (autoFit ? clamp(v, pad + 1, 63 - pad) : v);
  const target = { x: clampTarget(32 + Math.round(shape.offsetX ?? 0)), y: clampTarget(32 + Math.round(shape.offsetY ?? 0)) };

  let fitScale = 1;
  if (autoFit) {
    // Solve the largest scale s ≤ 1 keeping every constrained layer inside [pad, 64 - pad]:
    //   target + off + (min - anchor) * s ≥ pad   and   target + off + (max - anchor) * s ≤ 64 - pad
    const constrain = (b: { minX: number; minY: number; maxX: number; maxY: number }, offX: number, offY: number) => {
      const sides: [number, number, number][] = [
        [b.minX - anchor.x, target.x + offX - pad, -1], [b.maxX - anchor.x, 64 - pad - target.x - offX, 1],
        [b.minY - anchor.y, target.y + offY - pad, -1], [b.maxY - anchor.y, 64 - pad - target.y - offY, 1],
      ];
      for (const [extent, room, dir] of sides) {
        const reach = extent * dir;
        if (reach <= 0.01 || room <= 0.5) continue; // layer is on the other side, or cannot be rescued by scaling
        fitScale = Math.min(fitScale, room / reach);
      }
    };
    if (bodyBounds) constrain(bodyBounds, 0, 0);
    if (shape.fitScope !== 'body') {
      for (const layer of decorT) {
        // Fit against the un-offset decoration: moving ornaments is a pure translation
        // (clipped by the safe area) and must never rescale the body.
        if (layer.bounds) constrain(layer.bounds, 0, 0);
      }
    }
    // Keep the body readable: a small ornament bleed is better than crushing the weapon.
    fitScale = clamp(fitScale, bodyBounds ? 0.42 : 1, 1);
  }

  const toSource = (x: number, y: number, offX: number, offY: number) => ({
    x: anchor.x + (x - target.x - offX) / fitScale,
    y: anchor.y + (y - target.y - offY) / fitScale,
  });
  const inSafe = (x: number, y: number) => !autoFit || (x >= pad && y >= pad && x < 64 - pad && y < 64 - pad);

  const bodyOut: Sampler = (x, y) => { const q = toSource(x, y, 0, 0); return bodyT(q.x, q.y); };
  const decorOut = decorT.map((l) => ({
    id: l.id, layer: l.layer, offX: l.offX, offY: l.offY,
    // the safe margin always wins over decorations; the body is contained by the fit itself
    sampler: ((x: number, y: number) => {
      if (!inSafe(x, y)) return null;
      const q = toSource(x, y, l.offX, l.offY);
      return l.sampler(q.x, q.y);
    }) as Sampler,
  }));

  // later in the list = higher in the stack; query top-down
  const fronts = decorOut.filter((l) => l.layer === 'front').reverse();
  const backs = decorOut.filter((l) => l.layer === 'back').reverse();
  const sampler: Sampler = (x, y) => {
    for (const l of fronts) { const c = l.sampler(x, y); if (c) return c; }
    const b = bodyOut(x, y);
    if (b) return b;
    for (const l of backs) { const c = l.sampler(x, y); if (c) return c; }
    return null;
  };

  const box = (smp: Sampler): LayerBox | null => {
    const b = scanBounds(smp, 0.5, 63.5, 2);
    return b ? { x: Math.floor(b.minX), y: Math.floor(b.minY), width: Math.ceil(b.maxX - b.minX), height: Math.ceil(b.maxY - b.minY) } : null;
  };
  const layout: RenderLayout = {
    anchor: { x: target.x, y: target.y },
    fitScale,
    safe: autoFit ? { x: safePad, y: safePad, width: 64 - safePad * 2, height: 64 - safePad * 2 } : null,
    layers: [
      ...backs.slice().reverse().map((l) => ({ id: l.id, layer: 'back' as const, box: box(l.sampler), offsetX: l.offX, offsetY: l.offY })),
      { id: 'body' as const, layer: 'body' as const, box: box(bodyOut), offsetX: 0, offsetY: 0 },
      ...fronts.slice().reverse().map((l) => ({ id: l.id, layer: 'front' as const, box: box(l.sampler), offsetX: l.offX, offsetY: l.offY })),
    ],
  };
  return { sampler, layout };
}

function tintPixel(data: Uint8ClampedArray, index: number, color: string, amount: number) {
  const [r, g, b] = hexToRgb(color);
  const t = clamp(amount, 0, 1);
  data[index] = data[index] * (1 - t) + r * t;
  data[index + 1] = data[index + 1] * (1 - t) + g * t;
  data[index + 2] = data[index + 2] * (1 - t) + b * t;
}

const ELEMENT_COLORS: Record<Exclude<ElementMode, 'none'>, [string, string, string]> = {
  fire: ['#fff2a3', '#ff9a32', '#e83b2f'],
  frost: ['#efffff', '#6de7ff', '#2465b8'],
  storm: ['#ffffff', '#75d8ff', '#755cff'],
  void: ['#cf8cff', '#6238b8', '#120b2e'],
  holy: ['#fffbd1', '#ffd95c', '#c17b18'],
  nature: ['#d8ff99', '#64d76d', '#1e7044'],
  blood: ['#ffb0a0', '#e0364f', '#630e24'],
  arcane: ['#fff0ff', '#e85cff', '#43cde8'],
  poison: ['#eaff69', '#79d63d', '#44308d'],
};

/** Applies material-aware elemental veins, edge light and small silhouette extensions. */
function applyElement(
  data: Uint8ClampedArray,
  N: number,
  mode: ElementMode,
  power: number,
  seed: number,
  mask: (x: number, y: number) => number = () => 1,
) {
  if (mode === 'none' || power <= 0.01) return;
  const p = clamp(power, 0, 1);
  const colors = ELEMENT_COLORS[mode];
  const src = new Uint8ClampedArray(data);
  const opaque = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N && src[(y * N + x) * 4 + 3] > 220;
  const set = (x: number, y: number, color: string, alpha = 255) => {
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    const i = (y * N + x) * 4;
    const [r, g, b] = hexToRgb(color);
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = alpha;
  };

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4;
      if (!opaque(x, y)) continue;
      const strength = clamp(p * mask(x, y), 0, 1);
      if (strength <= 0.015) continue;
      const edge = !opaque(x - 1, y) || !opaque(x + 1, y) || !opaque(x, y - 1) || !opaque(x, y + 1);
      const noise = hash2(x, y, seed ^ 0xace1);
      const diagonal = ((x * 3 + y * 5 + seed) % Math.max(5, Math.round(13 - strength * 5)) + 20) % Math.max(5, Math.round(13 - strength * 5));

      if (mode === 'fire') {
        if (edge && (y > N * 0.42 || noise > 0.72)) tintPixel(data, i, colors[1], 0.38 + strength * 0.34);
        else if (noise > 0.91 - strength * 0.08) tintPixel(data, i, colors[0], 0.52);
      } else if (mode === 'frost') {
        if (edge) tintPixel(data, i, colors[0], 0.34 + strength * 0.38);
        else if (diagonal === 0 || (x - y + seed) % 17 === 0) tintPixel(data, i, colors[1], 0.48 + strength * 0.22);
        else tintPixel(data, i, colors[2], 0.08 + strength * 0.10);
      } else if (mode === 'storm') {
        if (diagonal <= (strength > 0.7 ? 1 : 0) && noise > 0.34) tintPixel(data, i, noise > 0.72 ? colors[0] : colors[1], 0.72);
        else tintPixel(data, i, colors[2], 0.09 + strength * 0.12);
      } else if (mode === 'void') {
        tintPixel(data, i, colors[2], 0.18 + strength * 0.25);
        if (noise > 0.90 - strength * 0.10) tintPixel(data, i, colors[0], 0.62);
      } else if (mode === 'holy') {
        if (edge && x + y < N * 1.2) tintPixel(data, i, colors[0], 0.52 + strength * 0.28);
        else tintPixel(data, i, colors[1], 0.11 + strength * 0.14);
      } else if (mode === 'nature') {
        // moss veins only — the base material stays dominant
        if ((x + Math.floor(Math.sin(y * 0.55) * 3) + seed) % Math.max(6, Math.round(13 - strength * 5)) === 0) tintPixel(data, i, colors[0], 0.66);
        else if (noise > 0.86) tintPixel(data, i, colors[1], 0.10 + strength * 0.10);
      } else if (mode === 'blood') {
        tintPixel(data, i, colors[2], 0.12 + strength * 0.20);
        if (y > N * 0.45 && noise > 0.79 - strength * 0.12) tintPixel(data, i, colors[1], 0.62);
      } else if (mode === 'arcane') {
        if ((x * 2 + y * 3 + seed) % Math.max(5, Math.round(15 - strength * 7)) === 0) tintPixel(data, i, noise > 0.5 ? colors[0] : colors[2], 0.76);
        else tintPixel(data, i, colors[1], 0.08 + strength * 0.12);
      } else if (mode === 'poison') {
        // coarse blotches instead of full-surface noise
        const spots = hash2(Math.floor(x / 3), Math.floor(y / 3), seed ^ 0x771);
        if (spots > 0.875 - strength * 0.06) tintPixel(data, i, noise > 0.55 ? colors[0] : colors[1], 0.72);
        else if (spots > 0.72) tintPixel(data, i, colors[2], 0.06 + strength * 0.08);
      }
    }
  }

  // Element-specific pixels outside the body become part of the outline pass.
  const tops = new Int16Array(N).fill(-1);
  const bottoms = new Int16Array(N).fill(-1);
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      if (!opaque(x, y)) continue;
      if (tops[x] < 0) tops[x] = y;
      bottoms[x] = y;
    }
  }
  if (mode === 'fire' || mode === 'blood' || mode === 'frost' || mode === 'poison') {
    const count = Math.max(1, Math.round((N / 12) * p));
    for (let n = 0; n < count; n++) {
      const x = Math.floor(hash2(n, 2, seed) * N);
      const base = mode === 'fire' ? tops[x] : bottoms[x];
      if (base < 0 || mask(x, base) <= 0.15) continue;
      const length = Math.max(1, Math.round((N / 20) * (0.6 + p * 1.8) * (0.6 + hash2(n, 9, seed))));
      for (let k = 1; k <= length; k++) {
        const y = mode === 'fire' ? base - k : base + k;
        if (opaque(x, y)) continue;
        const color = mode === 'fire' ? (k === length ? colors[0] : colors[1]) : mode === 'frost' ? colors[0] : mode === 'poison' ? colors[1] : colors[1];
        set(x, y, color);
      }
    }
  }
}

function applyAnimationFrame(
  ctx: CanvasRenderingContext2D,
  N: number,
  item: ItemDef,
  palette: ItemDef['palette'],
  options: AnimationFrameOptions,
  seed: number,
  glowAmount: number,
) {
  const { mode } = options;
  if (mode === 'none' || options.frames < 2) return;
  const frames = Math.max(2, options.frames);
  const frame = ((options.frame % frames) + frames) % frames;
  const phase = frame / frames;
  const image = ctx.getImageData(0, 0, N, N);
  const pixels = image.data;
  const active = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N && pixels[(y * N + x) * 4 + 3] > 220;
  const accent = palette.extra ?? palette.accent;
  const setPixel = (x: number, y: number, color: string, alpha = 255) => {
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    const i = (y * N + x) * 4;
    const [r, g, b] = hexToRgb(color);
    pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = Math.max(pixels[i + 3], alpha);
  };

  if (mode === 'pulse') {
    const amount = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
    for (let i = 0; i < pixels.length; i += 4) {
      if (!pixels[i + 3]) continue;
      pixels[i] *= amount; pixels[i + 1] *= amount; pixels[i + 2] *= amount;
    }
  } else if (mode === 'flow' || mode === 'enchant') {
    const tint = mode === 'flow' ? '#55e9ff' : '#cf9bff';
    const speed = mode === 'flow' ? 1.8 : 1.25;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = (y * N + x) * 4;
        if (pixels[i + 3] < 32) continue;
        const axis = mode === 'flow' ? x / N : (x + y) / (N * 2);
        const at = ((axis - phase * speed) % 1 + 1) % 1;
        const band = mode === 'flow' ? 0.10 : 0.085;
        const distance = Math.min(at, 1 - at);
        if (distance < band) {
          const strength = (1 - distance / band) * (mode === 'flow' ? 0.72 : 0.82);
          tintPixel(pixels, i, tint, strength);
        }
      }
    }
  } else if (mode === 'sparkle') {
    const count = Math.max(2, Math.round(2 + glowAmount * 4));
    for (let n = 0; n < count; n++) {
      const sx = Math.floor(hash2(n, 7, seed + frame * 197) * N);
      const sy = Math.floor(hash2(n, 19, seed + frame * 311) * N);
      let found: [number, number] | null = null;
      for (let radius = 0; radius <= Math.max(2, Math.floor(N / 12)) && !found; radius++) {
        for (let oy = -radius; oy <= radius && !found; oy++) {
          for (let ox = -radius; ox <= radius && !found; ox++) {
            if (Math.abs(ox) + Math.abs(oy) > radius) continue;
            if (active(sx + ox, sy + oy)) found = [sx + ox, sy + oy];
          }
        }
      }
      if (!found) continue;
      const [x, y] = found;
      for (const [ox, oy, strength] of [[0, 0, 1], [1, 0, 0.75], [-1, 0, 0.75], [0, 1, 0.75], [0, -1, 0.75]] as const) {
        const px = x + ox, py = y + oy;
        if (!active(px, py)) continue;
        tintPixel(pixels, (py * N + px) * 4, '#fff7ca', strength);
      }
    }
  } else if (mode === 'orbit' || mode === 'aura') {
    const count = mode === 'orbit' ? Math.max(5, Math.round(N / 8)) : Math.max(12, Math.round(N / 4));
    // modest radius: a shimmering lane, not a canvas-eating ring
    const radius = mode === 'orbit' ? N * 0.30 : N * (0.30 + Math.sin(phase * Math.PI * 2) * 0.03);
    for (let n = 0; n < count; n++) {
      const angle = (n / count + phase * (mode === 'orbit' ? 1 : 0.22)) * Math.PI * 2;
      if (mode === 'aura' && n % 2 && frame % 2) continue;
      const x = Math.round(N / 2 + Math.cos(angle) * radius);
      const y = Math.round(N / 2 + Math.sin(angle) * radius * 0.86);
      setPixel(x, y, n % 3 === 0 ? '#ffffff' : accent, mode === 'orbit' ? 255 : 205);
      if (mode === 'orbit' && n % 3 === 0) setPixel(x - Math.sign(Math.cos(angle)), y, accent, 210);
    }
  } else if (mode === 'runes') {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (!active(x, y)) continue;
        const band = ((x * 2 - y + frame * 4) % Math.max(6, Math.round(N / 4)) + N) % Math.max(6, Math.round(N / 4));
        if (band <= 1 && hash2(Math.floor(x / 2), Math.floor(y / 2), seed) > 0.42) tintPixel(pixels, (y * N + x) * 4, accent, 0.78);
      }
    }
  } else if (mode === 'wingbeat') {
    const pulse = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (!active(x, y) || Math.abs(x - N / 2) < N * 0.18) continue;
        const outward = Math.abs(x - N / 2) / (N / 2);
        tintPixel(pixels, (y * N + x) * 4, pulse > 0.5 ? '#ffffff' : accent, outward * (0.15 + pulse * 0.38));
      }
    }
  } else if (mode === 'fracture') {
    const count = Math.max(4, Math.round(N / 12));
    for (let n = 0; n < count; n++) {
      const angle = hash2(n, 4, seed) * Math.PI * 2;
      const travel = (phase + hash2(n, 9, seed)) % 1;
      const radius = N * (0.18 + travel * 0.30);
      const x = Math.round(N / 2 + Math.cos(angle) * radius);
      const y = Math.round(N / 2 + Math.sin(angle) * radius);
      setPixel(x, y, n % 2 ? accent : '#ffffff');
      setPixel(x + (n % 2 ? 1 : 0), y + (n % 3 ? 0 : 1), mixHex(accent, '#080a12', 0.25), 230);
    }
  } else if (mode === 'storm') {
    const startX = Math.round(N * (0.22 + phase * 0.56));
    let x = startX;
    for (let y = Math.round(N * 0.08); y < N * 0.92; y++) {
      x += hash2(y, frame, seed) > 0.66 ? 1 : hash2(y, frame + 17, seed) < 0.32 ? -1 : 0;
      if (active(x, y)) setPixel(x, y, y % 4 === 0 ? '#ffffff' : '#77dfff');
    }
  } else if (mode === 'frost') {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (!active(x, y)) continue;
        const crystal = ((x - y + frame * 2) % Math.max(5, Math.round(N / 7)) + N) % Math.max(5, Math.round(N / 7));
        if (crystal === 0 && hash2(x, y, seed) > 0.5) tintPixel(pixels, (y * N + x) * 4, '#eaffff', 0.82);
      }
    }
  } else if (mode === 'void') {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = (y * N + x) * 4;
        if (!active(x, y)) continue;
        const voidNoise = hash2(x + frame * 3, y - frame * 2, seed ^ 0x931);
        if (voidNoise > 0.90) pixels[i + 3] = Math.round(90 + 120 * Math.sin(phase * Math.PI) ** 2);
        else if (voidNoise < 0.08) tintPixel(pixels, i, '#b86cff', 0.65);
      }
    }
  } else if (mode === 'ornament') {
    const ring = N * (0.31 + Math.sin(phase * Math.PI * 2) * 0.022);
    for (let n = 0; n < 16; n++) {
      const angle = (n / 16 + phase * 0.3) * Math.PI * 2;
      setPixel(Math.round(N / 2 + Math.cos(angle) * ring), Math.round(N / 2 + Math.sin(angle) * ring), n % 4 ? accent : '#ffffff', 220);
    }
  } else if (mode === 'flame') {
    const bottom = new Int16Array(N).fill(-1);
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) if (active(x, y)) bottom[x] = y;
    }
    for (let x = 0; x < N; x++) {
      const by = bottom[x];
      if (by < 0) continue;
      for (let rise = 1; rise <= Math.ceil(N * 0.11); rise++) {
        const y = by - rise + 1;
        const wobble = hash2(x, rise, seed + frame * 53);
        const flicker = (phase * 2.4 + x * 0.13 + wobble) % 1;
        if (rise <= 2 && wobble > 0.42 && y >= 0 && !active(x, y)) {
          const color = flicker < 0.33 ? '#fff0a3' : flicker < 0.7 ? '#ff9e38' : '#ff4d39';
          const i = (y * N + x) * 4;
          const [r, g, b] = hexToRgb(color);
          pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = 255;
        } else if (y >= 0 && active(x, y) && wobble > 0.92) {
          tintPixel(pixels, (y * N + x) * 4, flicker < 0.5 ? '#ffcf55' : '#ff6238', 0.74);
        }
      }
    }
  } else if (mode === 'drip') {
    const bottom = new Int16Array(N).fill(-1);
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) if (active(x, y)) bottom[x] = y;
    }
    const count = Math.max(1, Math.round(N / 18));
    for (let n = 0; n < count; n++) {
      const x = Math.floor(hash2(n, 2, seed) * N);
      const by = bottom[x];
      const tick = (phase * 1.45 + hash2(n, 8, seed)) % 1;
      if (by < 0 || tick > 0.78) continue;
      const length = Math.max(1, Math.round((N / 16) * (0.6 + tick * 1.4)));
      for (let k = 0; k < length; k++) {
        const y = by + k + 1;
        if (y >= N || active(x, y)) continue;
        const i = (y * N + x) * 4;
        const [r, g, b] = hexToRgb(k === length - 1 ? accent : mixHex(accent, '#080a12', 0.2));
        pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = 255;
      }
    }
  }

  // A faint non-destructive glint keeps animation legible on dark, non-glowing items.
  if ((mode === 'flow' || mode === 'enchant') && item.glow && glowAmount > 0.35) {
    const i = Math.floor(hash2(frame, 4, seed) * N);
    for (let y = 0; y < N; y++) {
      const x = mode === 'flow' ? i : Math.floor((i - y + N * 2) % N);
      if (active(x, y)) tintPixel(pixels, (y * N + x) * 4, accent, 0.42);
    }
  }
  ctx.putImageData(image, 0, 0);
}

export function generateTexture(
  canvas: HTMLCanvasElement,
  item: ItemDef,
  N: 16 | 32 | 64,
  style: StyleOptions,
  seed: number,
  customPalette?: ItemDef['palette'],
  essence: TextureEssence = DEFAULT_TEXTURE_ESSENCE,
  animation?: AnimationFrameOptions,
  shape: ShapeOptions = DEFAULT_SHAPE_OPTIONS,
) {
  canvas.width = N; canvas.height = N;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, N, N);
  const p = customPalette ?? item.palette;
  const renderStyle = resolveStyle(style, essence);
  const detail = N >= 64 ? 2 : N >= 32 ? 1 : 0;
  const mixSeed = (hashStr(item.id) ^ seed) >>> 0;
  const phase = animation && animation.frames > 0 ? animation.frame / animation.frames : 0;
  const { sampler, layout } = buildSampler(item, p, renderStyle, detail, mixSeed, essence, shape, phase);

  // --- pixel pass with mode-filtered supersampling ---
  const SS = N >= 64 ? 2 : N >= 32 ? 3 : 4;
  const img = ctx.createImageData(N, N);
  const data = img.data;
  const scale = 64 / N;
  const counts = new Map<string, number>();
  for (let py = 0; py < N; py++) {
    for (let px = 0; px < N; px++) {
      counts.clear();
      let empty = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) * scale;
          const y = (py + (sy + 0.5) / SS) * scale;
          const c = sampler(x, y);
          if (!c) { empty++; continue; }
          counts.set(c, (counts.get(c) ?? 0) + 1);
        }
      }
      const total = SS * SS;
      if (empty > total * 0.5) continue;
      let best: string | null = null, bestN = 0;
      counts.forEach((v, k) => { if (v > bestN) { bestN = v; best = k; } });
      if (!best) continue;
      const [r, g, b] = hexToRgb(best);
      const i = (py * N + px) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }

  // --- rim light + shadow on silhouette edges (bevel) ---
  const bevel = renderStyle.bevel / 100, hl = renderStyle.highlight / 100;
  const edgeLight = (renderStyle.edgeLight ?? 70) / 100;
  if (bevel > 0.02) {
    const src = new Uint8ClampedArray(data);
    const op = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N && src[(y * N + x) * 4 + 3] > 0;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = (y * N + x) * 4;
        if (src[i + 3] === 0) continue;
        const tl = !op(x, y - 1) || !op(x - 1, y);
        const br = !op(x, y + 1) || !op(x + 1, y);
        if (tl) {
          const k = 12 + edgeLight * 34 + hl * 18;
          data[i] = Math.min(255, data[i] + k); data[i + 1] = Math.min(255, data[i + 1] + k); data[i + 2] = Math.min(255, data[i + 2] + k * 0.86);
        } else if (br) {
          const k = 20 + bevel * 34;
          data[i] = Math.max(0, data[i] - k); data[i + 1] = Math.max(0, data[i + 1] - k); data[i + 2] = Math.max(0, data[i + 2] - k * 0.8);
        }
      }
    }
  }

  // --- grain (item pixels only, quantized) ---
  const grain = renderStyle.grain / 100;
  if (grain > 0.02) {
    const amt = grain * (N >= 64 ? 15 : N >= 32 ? 10 : 6);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = (y * N + x) * 4;
        if (data[i + 3] === 0) continue;
        const n = Math.round((hash2(x, y, mixSeed) - 0.5) * 2 * amt);
        data[i] = Math.max(0, Math.min(255, data[i] + n));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
      }
    }
  }

  const dither = clamp((renderStyle.dither ?? 0) / 100, 0, 1) * (N >= 64 ? 1 : 0.55);
  if (dither > 0.01) {
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = (y * N + x) * 4;
        if (!data[i + 3]) continue;
        const threshold = (bayer[(y & 3) * 4 + (x & 3)] / 15 - 0.5) * 18 * dither;
        data[i] = clamp(data[i] + threshold, 0, 255);
        data[i + 1] = clamp(data[i + 1] + threshold, 0, 255);
        data[i + 2] = clamp(data[i + 2] + threshold, 0, 255);
      }
    }
  }

  // Fine deterministic wear marks appear only on the material, never in transparent space.
  const wear = clamp(essence.wear, 0, 1) * (N >= 64 ? 1 : N >= 32 ? 0.52 : 0.18);
  if (wear > 0.005) {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = (y * N + x) * 4;
        if (data[i + 3] === 0) continue;
        const streak = hash2(Math.floor((x + y) / 3), Math.floor((x - y + N) / 6), mixSeed ^ 0x51f1);
        const alignment = ((x + y + Math.floor(hash2(x, y, mixSeed) * 3)) % 7) < 5;
        if (alignment && streak > 1 - wear * 0.075) {
          const depth = 18 + hash2(x, y, mixSeed ^ 0xb42) * 42;
          data[i] = Math.max(0, data[i] - depth);
          data[i + 1] = Math.max(0, data[i + 1] - depth);
          data[i + 2] = Math.max(0, data[i + 2] - depth * 0.82);
        }
      }
    }
  }

  const primaryElement = shape.element ?? 'none';
  const secondaryElement = shape.elementSecondary ?? 'none';
  const blend = clamp(shape.elementBlend ?? 0.5, 0, 1);
  const merge = shape.elementMerge ?? 'split';
  const mergeMask = (secondary: boolean) => (x: number, y: number) => {
    if (secondaryElement === 'none') return secondary ? 0 : 1;
    const xn = x / Math.max(1, N - 1), yn = y / Math.max(1, N - 1);
    if (merge === 'gradient') {
      const value = clamp((xn + yn) * 0.5 + blend - 0.5, 0, 1);
      return secondary ? value : 1 - value;
    }
    if (merge === 'weave') {
      const cell = ((Math.floor(x / Math.max(1, N / 8)) + Math.floor(y / Math.max(1, N / 8))) & 1) === 0;
      return secondary ? (cell ? blend : 0.18 * blend) : (cell ? 0.18 * (1 - blend) : 1 - blend);
    }
    if (merge === 'chaos') {
      // large territory patches so two elements read as fusion, not salt noise
      const noise = hash2(Math.floor(x / 4), Math.floor(y / 4), mixSeed ^ 0x7221);
      const second = noise < blend;
      return secondary ? (second ? 1 : 0.14) : (second ? 0.14 : 1);
    }
    const second = (xn + yn) * 0.5 > 1 - blend;
    return secondary ? (second ? 1 : 0) : (second ? 0 : 1);
  };
  applyElement(data, N, primaryElement, shape.elementPower ?? 0.65, mixSeed, mergeMask(false));
  if (secondaryElement !== 'none') applyElement(data, N, secondaryElement, (shape.elementPower ?? 0.65) * (0.62 + blend * 0.55), mixSeed ^ 0x3345, mergeMask(true));

  // --- enchant sparkle for glowing items ---
  if ((item.glow || shape.form === 'amorphous') && renderStyle.glow > 25 && N >= 32) {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = (y * N + x) * 4;
        if (data[i + 3] === 0) continue;
        if (hash2(x, y, mixSeed ^ 0x9e37) > 0.972) {
          data[i] = Math.min(255, data[i] + 46);
          data[i + 1] = Math.min(255, data[i + 1] + 34);
          data[i + 2] = Math.min(255, data[i + 2] + 62);
        }
      }
    }
  }

  // --- outline dilation into a separate layer ---
  const outHex = getOutlineColor(p, renderStyle);
  const [orr, og, ob] = hexToRgb(outHex);
  // outline scales with resolution so 64x keeps the same visual weight as 16x
  const thick = renderStyle.outline <= 6
    ? 0
    : Math.max(0, Math.min(7, Math.round((renderStyle.outline / 100) * (N / 16) * 1.25)));
  const outLayer = ctx.createImageData(N, N);
  if (thick > 0) {
    const od = outLayer.data;
    const op = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N && data[(y * N + x) * 4 + 3] > 0;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (op(x, y)) continue;
        let hit = false;
        for (let dy = -thick; dy <= thick && !hit; dy++) {
          for (let dx = -thick; dx <= thick && !hit; dx++) {
            if (Math.abs(dx) + Math.abs(dy) <= thick && op(x + dx, y + dy)) hit = true;
          }
        }
        if (hit) {
          const i = (y * N + x) * 4;
          od[i] = orr; od[i + 1] = og; od[i + 2] = ob; od[i + 3] = 255;
        }
      }
    }
  }

  // --- compose: glow (behind) -> outline -> item ---
  ctx.clearRect(0, 0, N, N);
  if (renderStyle.glow > 12) {
    const gcol = stylizeHex(p.extra ?? p.accent, 1.15, 0);
    const gx = (layout.anchor.x / 64) * N, gy = (layout.anchor.y / 64) * N;
    const g = ctx.createRadialGradient(gx, gy, N * 0.04, gx, gy, N * 0.5);
    const a = Math.round((renderStyle.glow / 100) * 70).toString(16).padStart(2, '0');
    g.addColorStop(0, gcol + a);
    g.addColorStop(0.55, gcol + '22');
    g.addColorStop(1, gcol + '00');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, N, N);
  }
  const tmp = document.createElement('canvas');
  tmp.width = N; tmp.height = N;
  const tc = tmp.getContext('2d')!;
  if (thick > 0) { tc.putImageData(outLayer, 0, 0); ctx.drawImage(tmp, 0, 0); }
  tc.clearRect(0, 0, N, N);
  tc.putImageData(img, 0, 0);
  ctx.drawImage(tmp, 0, 0);
  if (animation) applyAnimationFrame(ctx, N, item, p, animation, mixSeed, essence.glow);

  // Hard guarantee: glow, elemental drips and animation effects never enter the safe margin.
  if (layout.safe) {
    const k = N / 64;
    const x0 = Math.floor(layout.safe.x * k), y0 = Math.floor(layout.safe.y * k);
    const x1 = Math.ceil((layout.safe.x + layout.safe.width) * k), y1 = Math.ceil((layout.safe.y + layout.safe.height) * k);
    const clip = ctx.getImageData(0, 0, N, N);
    let touched = false;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (x >= x0 && y >= y0 && x < x1 && y < y1) continue;
      const i = (y * N + x) * 4 + 3;
      if (clip.data[i]) { clip.data[i] = 0; touched = true; }
    }
    if (touched) ctx.putImageData(clip, 0, 0);
  }

  const finalPixels = ctx.getImageData(0, 0, N, N).data;
  let minX: number = N, minY: number = N, maxX = -1, maxY = -1, opaquePixels = 0, edgePixels = 0;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (finalPixels[(y * N + x) * 4 + 3] <= 220) continue;
      opaquePixels++;
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      if (x === 0 || y === 0 || x === N - 1 || y === N - 1) edgePixels++;
    }
  }
  return {
    bounds: maxX >= 0 ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 } : null,
    opaquePixels,
    edgePixels,
    coverage: opaquePixels / (N * N),
    layout,
  } satisfies RenderMetrics;
}

export function renderToDataURL(
  item: ItemDef,
  N: 16 | 32 | 64,
  style: StyleOptions,
  seed: number,
  customPalette?: ItemDef['palette'],
  essence: TextureEssence = DEFAULT_TEXTURE_ESSENCE,
  animation?: AnimationFrameOptions,
  shape: ShapeOptions = DEFAULT_SHAPE_OPTIONS,
): string {
  const c = document.createElement('canvas');
  generateTexture(c, item, N, style, seed, customPalette, essence, animation, shape);
  return c.toDataURL('image/png');
}
