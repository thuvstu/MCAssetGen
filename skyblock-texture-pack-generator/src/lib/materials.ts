import { lchToRgb, hueDelta, type RGB } from './color';

export type Kind = 'metal' | 'gem' | 'wood' | 'cloth' | 'bone' | 'energy' | 'stone' | 'string';

export type MatId =
  | 'steel' | 'iron' | 'gold' | 'rosegold' | 'blackgold' | 'copper' | 'mithril' | 'titanium' | 'netherite' | 'crimson'
  | 'diamond' | 'emerald' | 'ruby' | 'sapphire' | 'amethyst' | 'amber' | 'frost' | 'ender' | 'jade' | 'prismarine' | 'opal'
  | 'obsidian' | 'wither' | 'blackstone' | 'carbon' | 'oak' | 'ebony' | 'leather' | 'silk' | 'bone' | 'paper'
  | 'gunmetal' | 'chrome' | 'rust' | 'gore' | 'sinew' | 'chitin'
  | 'flame' | 'spirit' | 'void' | 'toxic' | 'storm' | 'blood' | 'neon' | 'plasma';

/**
 * h / c in OKLCH, lo / hi = OKLab lightness of the ramp ends.
 * `sheen` scales the specular lobe (1 = default for the kind). Polished
 * metals and glassy gems > 1, matte/oxidised surfaces < 1.
 */
export type Material = { jp: string; en: string; h: number; c: number; lo: number; hi: number; kind: Kind; sheen?: number };

export const MATERIALS: Record<MatId, Material> = {
  steel: { jp: '鋼', en: 'Steel', h: 255, c: 0.022, lo: 0.32, hi: 0.95, kind: 'metal', sheen: 1.2 },
  iron: { jp: '鉄', en: 'Iron', h: 240, c: 0.01, lo: 0.3, hi: 0.9, kind: 'metal', sheen: 0.8 },
  gold: { jp: '金', en: 'Gold', h: 90, c: 0.155, lo: 0.42, hi: 0.95, kind: 'metal', sheen: 1.3 },
  rosegold: { jp: '薔薇金', en: 'Rose Gold', h: 40, c: 0.11, lo: 0.42, hi: 0.93, kind: 'metal', sheen: 1.2 },
  blackgold: { jp: '黒金', en: 'Black Gold', h: 85, c: 0.09, lo: 0.2, hi: 0.72, kind: 'metal', sheen: 1.4 },
  copper: { jp: '赤銅', en: 'Copper', h: 48, c: 0.13, lo: 0.34, hi: 0.86, kind: 'metal', sheen: 0.9 },
  mithril: { jp: 'ミスリル', en: 'Mithril', h: 180, c: 0.075, lo: 0.4, hi: 0.93, kind: 'metal', sheen: 1.1 },
  titanium: { jp: 'チタン', en: 'Titanium', h: 230, c: 0.03, lo: 0.4, hi: 0.9, kind: 'metal', sheen: 0.7 },
  netherite: { jp: '冥鉄', en: 'Netherite', h: 345, c: 0.022, lo: 0.22, hi: 0.66, kind: 'metal', sheen: 0.6 },
  crimson: { jp: '深紅鋼', en: 'Crimson', h: 22, c: 0.17, lo: 0.3, hi: 0.74, kind: 'metal', sheen: 1 },
  diamond: { jp: '金剛石', en: 'Diamond', h: 195, c: 0.12, lo: 0.4, hi: 0.96, kind: 'gem', sheen: 1.4 },
  emerald: { jp: '翠玉', en: 'Emerald', h: 152, c: 0.17, lo: 0.36, hi: 0.9, kind: 'gem', sheen: 1.1 },
  ruby: { jp: '紅玉', en: 'Ruby', h: 20, c: 0.2, lo: 0.32, hi: 0.8, kind: 'gem', sheen: 1.1 },
  sapphire: { jp: '蒼玉', en: 'Sapphire', h: 262, c: 0.18, lo: 0.3, hi: 0.8, kind: 'gem', sheen: 1.1 },
  amethyst: { jp: '紫水晶', en: 'Amethyst', h: 305, c: 0.16, lo: 0.32, hi: 0.86, kind: 'gem', sheen: 1 },
  amber: { jp: '琥珀', en: 'Amber', h: 70, c: 0.16, lo: 0.45, hi: 0.93, kind: 'gem', sheen: 0.9 },
  frost: { jp: '氷晶', en: 'Frost', h: 225, c: 0.08, lo: 0.6, hi: 0.97, kind: 'gem', sheen: 1.3 },
  ender: { jp: '終界石', en: 'Ender', h: 175, c: 0.1, lo: 0.34, hi: 0.88, kind: 'gem', sheen: 1 },
  jade: { jp: '翡翠', en: 'Jade', h: 145, c: 0.09, lo: 0.42, hi: 0.86, kind: 'gem', sheen: 0.7 },
  prismarine: { jp: '海晶', en: 'Prismarine', h: 185, c: 0.09, lo: 0.36, hi: 0.84, kind: 'gem', sheen: 0.9 },
  opal: { jp: '蛋白石', en: 'Opal', h: 320, c: 0.06, lo: 0.6, hi: 0.97, kind: 'gem', sheen: 1.5 },
  obsidian: { jp: '黒曜', en: 'Obsidian', h: 295, c: 0.075, lo: 0.18, hi: 0.6, kind: 'stone', sheen: 1.1 },
  wither: { jp: '凋落', en: 'Wither', h: 285, c: 0.035, lo: 0.18, hi: 0.62, kind: 'stone', sheen: 0.6 },
  blackstone: { jp: '黒石', en: 'Blackstone', h: 60, c: 0.02, lo: 0.16, hi: 0.52, kind: 'stone', sheen: 0.4 },
  oak: { jp: '樫', en: 'Oak', h: 62, c: 0.085, lo: 0.32, hi: 0.76, kind: 'wood' },
  ebony: { jp: '黒檀', en: 'Ebony', h: 40, c: 0.055, lo: 0.22, hi: 0.58, kind: 'wood' },
  leather: { jp: '革', en: 'Leather', h: 48, c: 0.075, lo: 0.28, hi: 0.66, kind: 'cloth' },
  silk: { jp: '絹糸', en: 'Silk', h: 95, c: 0.02, lo: 0.66, hi: 0.97, kind: 'string' },
  bone: { jp: '骨', en: 'Bone', h: 92, c: 0.04, lo: 0.56, hi: 0.95, kind: 'bone' },
  paper: { jp: '羊皮紙', en: 'Vellum', h: 88, c: 0.05, lo: 0.66, hi: 0.96, kind: 'cloth' },
  flame: { jp: '焔', en: 'Flame', h: 50, c: 0.18, lo: 0.52, hi: 0.97, kind: 'energy' },
  spirit: { jp: '霊光', en: 'Spirit', h: 200, c: 0.11, lo: 0.6, hi: 0.98, kind: 'energy' },
  void: { jp: '虚空', en: 'Void', h: 305, c: 0.16, lo: 0.26, hi: 0.8, kind: 'energy' },
  toxic: { jp: '毒液', en: 'Toxic', h: 140, c: 0.19, lo: 0.5, hi: 0.94, kind: 'energy' },
  storm: { jp: '雷電', en: 'Storm', h: 215, c: 0.15, lo: 0.55, hi: 0.98, kind: 'energy' },
  blood: { jp: '血晶', en: 'Blood', h: 15, c: 0.2, lo: 0.3, hi: 0.78, kind: 'energy' },
  gore: { jp: '血肉', en: 'Gore', h: 10, c: 0.14, lo: 0.2, hi: 0.58, kind: 'cloth', sheen: 1.3 },
  neon: { jp: 'ネオン', en: 'Neon', h: 330, c: 0.21, lo: 0.52, hi: 0.98, kind: 'energy' },
  plasma: { jp: 'プラズマ', en: 'Plasma', h: 265, c: 0.18, lo: 0.5, hi: 0.98, kind: 'energy' },
  gunmetal: { jp: '銃鋼', en: 'Gunmetal', h: 250, c: 0.014, lo: 0.2, hi: 0.68, kind: 'metal', sheen: 0.55 },
  chrome: { jp: 'クロム', en: 'Chrome', h: 235, c: 0.012, lo: 0.26, hi: 0.99, kind: 'metal', sheen: 1.8 },
  carbon: { jp: '炭素繊維', en: 'Carbon', h: 250, c: 0.008, lo: 0.14, hi: 0.5, kind: 'stone', sheen: 0.9 },
  rust: { jp: '錆鉄', en: 'Rusted', h: 38, c: 0.1, lo: 0.24, hi: 0.62, kind: 'metal', sheen: 0.3 },
  sinew: { jp: '腱', en: 'Sinew', h: 25, c: 0.06, lo: 0.3, hi: 0.72, kind: 'string' },
  chitin: { jp: '甲殻', en: 'Chitin', h: 300, c: 0.05, lo: 0.2, hi: 0.64, kind: 'bone', sheen: 1.2 },
};

export type RampStyle = {
  Lmin: number;
  Lmax: number;
  /** how strongly a material's own L range is pulled toward the pack's measured range */
  Lpull: number;
  /** degrees of hue rotation across the ramp; the light end turns toward warm */
  hueShift: number;
  /** relative chroma at the dark / light end (measured: 0.64 → 1.0 for FurfSky) */
  cDark: number;
  cLight: number;
  outlineDrop: number;
  outlineChroma: number;
  /** 0 = every outline pixel uses the dark shade; 1 = lit-side outline uses a light shade */
  selout: number;
};

export type Ramp = { cols: RGB[]; outline: RGB; outlineLit: RGB; glint: RGB; kind: Kind; sheen: number };

/** Warm target in OKLCH hue: highlights rotate toward it, shadows away from it. */
const WARM = 100;

/**
 * Per-material tone curves. `t` is the linear ramp position; the result is the
 * perceptual lightness position. These are what make gold look like gold:
 *  metal  — dark-heavy with a sudden bright crest (specular metals)
 *  gem    — mid-heavy, saturated core, bright but not white tip
 *  wood   — nearly linear, slightly dark-weighted
 *  cloth  — gentle S-curve, low contrast
 *  energy — bright-weighted, hot core
 */
const TONE: Record<Kind, (t: number) => number> = {
  metal: (t) => Math.pow(t, 1.35) * 0.82 + (t > 0.78 ? (t - 0.78) * 0.82 : 0),
  gem: (t) => 0.08 + 0.84 * Math.pow(t, 0.9),
  wood: (t) => Math.pow(t, 1.15),
  cloth: (t) => 0.5 + 0.5 * Math.tanh((t - 0.5) * 2.2) / Math.tanh(1.1),
  bone: (t) => 0.1 + 0.9 * Math.pow(t, 0.95),
  energy: (t) => 0.25 + 0.75 * Math.pow(t, 0.7),
  stone: (t) => Math.pow(t, 1.1) * 0.92,
  string: (t) => 0.3 + 0.7 * t,
};

/** Chroma shape: metals desaturate at the crest, gems peak mid-ramp. */
const CHROMA: Record<Kind, (t: number) => number> = {
  metal: (t) => 1 - 0.55 * Math.pow(Math.max(0, t - 0.6) / 0.4, 2),
  gem: (t) => 0.75 + 0.5 * Math.sin(t * Math.PI),
  wood: () => 1,
  cloth: () => 1,
  bone: (t) => 1 - 0.3 * t,
  energy: (t) => 1.1 - 0.4 * t,
  stone: () => 0.9,
  string: () => 0.9,
};

export function buildRamp(id: MatId, K: number, rs: RampStyle): Ramp {
  const m = MATERIALS[id];
  const lo = m.lo + (rs.Lmin - m.lo) * rs.Lpull;
  const hi = m.hi + (rs.Lmax - m.hi) * rs.Lpull;
  const dir = Math.sign(hueDelta(m.h, WARM)) || 1;
  const tone = TONE[m.kind];
  const cshape = CHROMA[m.kind];
  const hue = (t: number) => (m.h + dir * rs.hueShift * (t - 0.5) + 360) % 360;
  const chroma = (t: number) => m.c * cshape(t) * (rs.cDark + (rs.cLight - rs.cDark) * Math.min(1, t / 0.85));
  const L = (t: number) => lo + (hi - lo) * Math.min(1, Math.max(0, tone(t)));
  const cols: RGB[] = [];
  for (let i = 0; i < K; i++) {
    const t = K === 1 ? 0.55 : i / (K - 1);
    cols.push(lchToRgb(L(t), chroma(t), hue(t)));
  }
  const tl = Math.max(0, Math.min(0.9, rs.selout * 0.85));
  return {
    cols,
    // measured: 0% of outline pixels in any pack are black (L<0.2 & C<0.04) → floor at 0.21
    outline: lchToRgb(Math.max(0.21, lo - rs.outlineDrop), m.c * rs.cDark * rs.outlineChroma, hue(0)),
    outlineLit: lchToRgb(L(tl) - (tl < 0.1 ? rs.outlineDrop * 0.5 : 0), chroma(tl), hue(tl)),
    // Glint: metals go near-white and lose chroma; gems keep a tinted sparkle.
    glint: m.kind === 'gem' || m.kind === 'energy'
      ? lchToRgb(Math.min(0.96, hi + 0.06), m.c * 0.55, hue(1))
      : lchToRgb(Math.min(0.97, hi + 0.05), m.c * 0.18, hue(1)),
    kind: m.kind,
    sheen: m.sheen ?? 1,
  };
}
