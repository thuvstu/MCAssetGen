import type { RampStyle } from './materials';
import type { GradSpec } from './gradient';

/**
 * MEASURED ESSENCE — medians computed by tools/essence.mts (→ src/lib/measure.ts)
 * over real packs downloaded from Modrinth; textures inside Catharsis .cats
 * containers were carved out by PNG signature. Player-head skins (64×64 UV
 * layout) are excluded. Only derived numbers are stored — no artwork.
 */
export type PackId = 'furfsky' | 'hypixelplus' | 'packshq' | 'aether' | 'hd64';

export type PackEssence = {
  id: PackId;
  name: string;
  version: string;
  author: string;
  note: string;
  nativeRes: 16 | 32 | 64;
  icons: number;
  resMix: [number, number, number, number];
  colors: number;
  rampLen: number;
  contrast: number;
  L: [number, number];
  darker: number;
  black: number;
  colored: number;
  lightShare: number;
  lightDL: number;
  hueShift: number;
  /** degrees the light end rotates toward warm vs the dark end — the hue-shift *technique* */
  warm: number;
  chroma: [number, number, number];
  iso: number;
  cluster: number;
  animated: number;
  frames: number;
  partial: number;
};

export const ESSENCE: Record<PackId, PackEssence> = {
  furfsky: {
    id: 'furfsky', name: 'FurfSky Reborn', version: 'v2.0-pre.5', author: 'Reborn Team (Furf__ ほか10名超)',
    note: '投票1位。黒を使わない暗色輪郭が96%・左上光源が76%・4段ランプ。',
    nativeRes: 16, icons: 2698, resMix: [2518, 101, 78, 1], colors: 9, rampLen: 4,
    contrast: 0.582, L: [0.221, 0.863], darker: 0.962, black: 0, colored: 0.458, lightShare: 0.76, lightDL: 0.078,
    hueShift: 6.0, warm: 9.2, chroma: [0.081, 0.112, 0.127], iso: 0.303, cluster: 2.03, animated: 181, frames: 9, partial: 0,
  },
  hypixelplus: {
    id: 'hypixelplus', name: 'Hypixel+', version: '0.25.0c', author: 'ic22487',
    note: 'バニラ調。色相シフト 1.2° と控えめで既定テクスチャに馴染む5段ランプ。',
    nativeRes: 16, icons: 5904, resMix: [5754, 121, 18, 11], colors: 9, rampLen: 5,
    contrast: 0.534, L: [0.268, 0.877], darker: 0.8, black: 0, colored: 0.35, lightShare: 0.67, lightDL: 0.051,
    hueShift: 1.2, warm: 1.4, chroma: [0.1, 0.126, 0.131], iso: 0.333, cluster: 1.84, animated: 96, frames: 3, partial: 0,
  },
  packshq: {
    id: 'packshq', name: "PacksHQ (ImperiaL's)", version: 'v15 16x', author: 'ImperiaL_24 ほか12名',
    note: '最古参。色数11と多めで、細部の粒度は4パック中最高（孤立画素39%）。',
    nativeRes: 16, icons: 1148, resMix: [1137, 6, 4, 1], colors: 11, rampLen: 5,
    contrast: 0.591, L: [0.254, 0.897], darker: 0.838, black: 0, colored: 0.333, lightShare: 0.58, lightDL: 0.044,
    hueShift: 1.8, warm: 2.6, chroma: [0.095, 0.134, 0.147], iso: 0.389, cluster: 1.82, animated: 37, frames: 9, partial: 0,
  },
  aether: {
    id: 'aether', name: 'AetherPack x32', version: 'V1.0.1', author: 'AetherPack',
    note: '最大級の32x。低コントラストで色の塊が大きく、暗い輪郭は半分だけ。',
    nativeRes: 32, icons: 4141, resMix: [417, 3526, 82, 116], colors: 9, rampLen: 5,
    contrast: 0.404, L: [0.332, 0.837], darker: 0.528, black: 0, colored: 0.278, lightShare: 0.57, lightDL: 0.026,
    hueShift: 0.6, warm: 1.0, chroma: [0.092, 0.114, 0.121], iso: 0.122, cluster: 3.49, animated: 64, frames: 8, partial: 0,
  },
  hd64: {
    id: 'hd64', name: '64x HD（実測プール）', version: 'Hypixel+ · Aether · Legacy', author: '3パックの64xアイテムアイコン',
    note: '本物の64xアイテムアイコン134枚だけを抽出。スキンは除外済み。',
    nativeRes: 64, icons: 135, resMix: [0, 0, 135, 0], colors: 12, rampLen: 7,
    contrast: 0.377, L: [0.295, 0.857], darker: 0.234, black: 0, colored: 0.088, lightShare: 0.5, lightDL: 0.01,
    hueShift: 1.2, warm: 0.07, chroma: [0.086, 0.103, 0.113], iso: 0.068, cluster: 4.17, animated: 2, frames: 10, partial: 0,
  },
};

export const LEGACY_FINDING =
  'SkyBlock Legacy v2.0.1 の 667 PNG のうちアイテムアイコンは 35 枚。残りはプレイヤーヘッド用スキン（64×64 UV）だったため 16x 系の基準からは除外。';

export const TOTAL_ICONS = 2698 + 5904 + 1148 + 4141 + 35;

/** Generator parameters derived from the measurements (tuned by tools/match.mts). */
export type StyleParams = RampStyle & {
  ramp: Record<16 | 32 | 64, number>;
  colors: Record<16 | 32 | 64, number>;
  ambient: number;
  light: number;
  /** 0 = symmetric (pillow) form shading, 1 = fully directional light */
  dir: number;
  contrast: number;
  tl: number;
  rim: number;
  detail: number;
  /** per-pixel surface grain probability (targets the measured isolation rate) */
  noise: number;
  /** directional share used on faceted parts (gems / stars need some to read) */
  facetDir?: number;
  /** ramp steps of contact shadow cast by a higher part (directional) */
  contact?: number;
  /** specular strength multiplier (the specular lobe is inherently light-directional) */
  spec?: number;
  /** width of the ordered-dither band at each ramp step (0 = hard bands, 0.5 = fully interlocked) */
  dither?: number;
  /** darken body pixels that border a *different* part (material seam ink), in ramp steps */
  seamInk?: number;
  /** concave-corner ambient occlusion, in ramp steps (0 = off) */
  ao?: number;
  /** how strongly the gradient field is blended into the shading (0 = none) */
  gradMix?: number;
  /** gradient field spec (see lib/gradient.ts). Defaults to 'shaded'. */
  grad?: GradSpec;
  /** strength of the animated colour cycle applied to energy/aura parts */
  hueDrift?: number;
  /** extra saturation pushed into the brightest ramp step (1 = unchanged) */
  highlightPunch?: number;
  glint: boolean;
  frames: number;
  frametime: number;
};

export const PRESETS: Record<PackId, StyleParams> = {
  furfsky: {
    ramp: { 16: 4, 32: 5, 64: 7 }, colors: { 16: 9, 32: 12, 64: 16 }, Lmin: 0.23, Lmax: 0.82, Lpull: 0.6,
    hueShift: 20, cDark: 0.64, cLight: 1, outlineDrop: 0.01, outlineChroma: 0.55, selout: 0.08,
    ambient: 0.3, light: 0.68, dir: 0.42, facetDir: 0.5, contrast: 0.78, tl: 0.012, rim: 1, detail: 1, noise: 0.1,
    dither: 0.3, seamInk: 1, glint: true, frames: 9, frametime: 2,
  },
  hypixelplus: {
    ramp: { 16: 5, 32: 6, 64: 8 }, colors: { 16: 9, 32: 12, 64: 19 }, Lmin: 0.28, Lmax: 0.84, Lpull: 0.6,
    hueShift: 2, cDark: 0.76, cLight: 1, outlineDrop: 0.01, outlineChroma: 0.25, selout: 0.72,
    ambient: 0.33, light: 0.62, dir: 0.36, facetDir: 0.45, contrast: 0.64, tl: 0.008, rim: 0, detail: 1.1, noise: 0.3,
    dither: 0.22, seamInk: 1, glint: true, frames: 3, frametime: 2,
  },
  packshq: {
    ramp: { 16: 5, 32: 6, 64: 8 }, colors: { 16: 11, 32: 16, 64: 20 }, Lmin: 0.25, Lmax: 0.9, Lpull: 0.55,
    hueShift: 3, cDark: 0.65, cLight: 1, outlineDrop: 0.03, outlineChroma: 0.25, selout: 0.62,
    ambient: 0.3, light: 0.66, dir: 0.4, facetDir: 0.5, contrast: 0.86, tl: 0.008, rim: 1, detail: 1.35, noise: 0.45,
    dither: 0.34, seamInk: 1, glint: true, frames: 9, frametime: 2,
  },
  aether: {
    ramp: { 16: 4, 32: 6, 64: 8 }, colors: { 16: 9, 32: 9, 64: 11 }, Lmin: 0.33, Lmax: 0.84, Lpull: 0.6,
    hueShift: 1, cDark: 0.76, cLight: 1, outlineDrop: 0.03, outlineChroma: 1, selout: 1,
    ambient: 0.4, light: 0.52, dir: 0.25, facetDir: 0.35, contrast: 0.62, tl: 0, rim: 0, detail: 0.3, noise: 0.03,
    dither: 0.12, seamInk: 0, glint: false, frames: 8, frametime: 2,
  },
  hd64: {
    ramp: { 16: 5, 32: 7, 64: 10 }, colors: { 16: 11, 32: 14, 64: 14 }, Lmin: 0.12, Lmax: 0.93, Lpull: 0.85,
    hueShift: 2, cDark: 0.8, cLight: 1, outlineDrop: 0.03, outlineChroma: 0.3, selout: 1.5,
    ambient: 0.08, light: 0.85, dir: 0.3, facetDir: 0.4, contact: 0, spec: 0.3, contrast: 1.4, tl: 0, rim: 0, detail: 0.5, noise: 0.03,
    dither: 0.4, seamInk: 1, glint: true, frames: 10, frametime: 2,
  },
};

export function colorTarget(e: PackEssence): number {
  return e.colors;
}
