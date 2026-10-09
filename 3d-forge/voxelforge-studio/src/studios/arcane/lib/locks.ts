/* ═══════════════════════════════════════════════════════
   固定（ロック）と 指定（プール）の定義
   ═══════════════════════════════════════════════════════ */
import type { AdornmentStyle, ElementType, FinishStyle, GemCut, HeadShape, ItemType, ModEssenceStyle, OrbiterStyle, RarityTier, StaffConfig, TipStyle } from './types';

export type LockKey = keyof StaffConfig;
export type Locks = Partial<Record<LockKey, boolean>>;

export interface LockGroup { id: string; label: string; keys: LockKey[]; }

/** UI sections ⇄ config keys. Also drives "randomize this section only". */
export const LOCK_GROUPS: LockGroup[] = [
  { id: 'identity', label: '属性・型・Mod', keys: ['element', 'itemType', 'modEssence'] },
  { id: 'rarity', label: 'レアリティ', keys: ['rarity'] },
  { id: 'shaft', label: '柄の形', keys: ['shaftStyle', 'shaftLength', 'shaftThickness', 'shaftAngle', 'shaftCurve', 'shaftDetail', 'grain'] },
  { id: 'shaftColor', label: '柄の色', keys: ['shaftColor', 'shaftColor2'] },
  { id: 'wrap', label: '巻き', keys: ['wrapStyle', 'wrapColor', 'wrapDensity'] },
  { id: 'collar', label: '口金・爪', keys: ['collarStyle', 'collarColor', 'prongs', 'prongColor'] },
  { id: 'pommel', label: '柄頭', keys: ['pommelStyle', 'pommelColor'] },
  { id: 'head', label: '頭部形状', keys: ['headShape', 'headSize', 'innerStyle', 'gemGlow', 'gemCut', 'gemMount', 'gemCount', 'gemScale'] },
  { id: 'adornment', label: '装飾様式', keys: ['adornmentStyle', 'adornmentDensity'] },
  { id: 'gem', label: '宝石色', keys: ['gemColor', 'gemColor2', 'glowColor', 'particleColor'] },
  { id: 'tip', label: '先端', keys: ['tipStyle', 'tipScale'] },
  { id: 'orbiters', label: '浮遊物', keys: ['orbiterStyle', 'orbiterCount', 'orbiterRadius', 'orbiterSize'] },
  { id: 'motif', label: 'モチーフ', keys: ['motif', 'motifIntensity', 'motif2', 'motif2Intensity'] },
  { id: 'dangle', label: '吊り飾り', keys: ['dangleStyle', 'dangleCount'] },
  { id: 'wear', label: '摩耗', keys: ['wearStyle', 'wearAmount'] },
  { id: 'decor', label: '翼・光輪・角', keys: ['wings', 'wingColor', 'halo', 'haloColor', 'horns', 'hornColor'] },
  { id: 'particles', label: '粒子', keys: ['particles', 'particleStyle'] },
  { id: 'finish', label: '仕上げ', keys: ['outline', 'shading', 'dither', 'outerGlow', 'finish', 'contrast', 'dropShadow'] },
  { id: 'animation', label: 'アニメ', keys: ['animation'] },
];

/** Keys the randomizer may touch (resolution / refined / seed are handled separately). */
export const RANDOMIZABLE_KEYS: LockKey[] = LOCK_GROUPS.flatMap((g) => g.keys);

export const COLOR_KEYS: LockKey[] = ['shaftColor', 'shaftColor2', 'wrapColor', 'collarColor', 'prongColor', 'pommelColor', 'gemColor', 'gemColor2', 'glowColor', 'particleColor', 'wingColor', 'haloColor', 'hornColor'];
export const SHAPE_KEYS: LockKey[] = ['itemType', 'shaftStyle', 'shaftLength', 'shaftThickness', 'shaftAngle', 'shaftCurve', 'shaftDetail', 'wrapStyle', 'wrapDensity', 'collarStyle', 'prongs', 'pommelStyle', 'headShape', 'headSize', 'innerStyle', 'gemCut', 'gemMount', 'gemCount', 'gemScale', 'tipStyle', 'tipScale', 'adornmentStyle', 'adornmentDensity'];
export const DECOR_KEYS: LockKey[] = ['wings', 'halo', 'horns', 'orbiterStyle', 'orbiterCount', 'orbiterRadius', 'orbiterSize', 'particles', 'particleStyle', 'motif', 'motifIntensity', 'motif2', 'motif2Intensity', 'dangleStyle', 'dangleCount', 'adornmentStyle', 'adornmentDensity'];
export const FX_KEYS: LockKey[] = ['outline', 'shading', 'dither', 'outerGlow', 'finish', 'contrast', 'grain', 'gemGlow', 'dropShadow', 'wearStyle', 'wearAmount'];

/** Human labels for individual keys (used in the lock summary chips). */
export const KEY_LABELS: Partial<Record<LockKey, string>> = {
  element: '属性', itemType: '型', modEssence: 'Modエッセンス', seed: 'シード', resolution: '解像度', refined: '精細', animation: 'アニメ',
  shaftStyle: '柄材質', shaftLength: '長さ', shaftThickness: '太さ', shaftAngle: '角度', shaftCurve: '湾曲', shaftDetail: '刻印', grain: '木目',
  shaftColor: '柄色', shaftColor2: '柄影色', wrapStyle: '巻き', wrapColor: '巻き色', wrapDensity: '巻き密度',
  collarStyle: '口金', collarColor: '金属色', prongs: '爪数', prongColor: '爪色', pommelStyle: '柄頭', pommelColor: '柄頭色',
  headShape: '頭部', headSize: '頭部サイズ', innerStyle: 'コア', gemGlow: '内輝', gemColor: '宝石', gemColor2: '宝石内', glowColor: '輝き色', particleColor: '粒子色',
  gemCut: '宝石カット', gemMount: '宝石台座', gemCount: '副宝石数', gemScale: '副宝石サイズ', adornmentStyle: '装飾様式', adornmentDensity: '装飾密度',
  tipStyle: '先端', tipScale: '先端サイズ', orbiterStyle: '浮遊物', orbiterCount: '浮遊数', orbiterRadius: '公転半径', orbiterSize: '浮遊サイズ',
  motif: 'モチーフ', motifIntensity: 'モチーフ強度', wings: '翼', wingColor: '翼色', halo: '光輪', haloColor: '光輪色', horns: '角', hornColor: '角色',
  particles: '粒子数', particleStyle: '粒子種', outline: '輪郭', shading: '陰影', dither: 'ディザ', outerGlow: '外輝', finish: '表面', contrast: 'コントラスト', dropShadow: '影',
  rarity: 'レアリティ', harmony: '配色', paletteSize: '色数', softEdge: 'ソフト輪郭',
  motif2: '第2モチーフ', motif2Intensity: '第2強度',
  dangleStyle: '吊り飾り', dangleCount: '吊り数', wearStyle: '摩耗', wearAmount: '摩耗量',
};

/* ── 指定 / random rules (pools + behaviour) ── */
export interface RandomRules {
  elements: ElementType[];   // empty = all (except 'none')
  itemTypes: ItemType[];     // empty = all
  modEssences: ModEssenceStyle[]; // empty = all
  headShapes: HeadShape[];   // empty = all
  finishes: FinishStyle[];   // empty = all
  rarities: RarityTier[];    // empty = all
  tipStyles: TipStyle[];
  orbiterStyles: OrbiterStyle[];
  gemCuts: GemCut[];
  adornments: AdornmentStyle[];
  colorsFollowElement: boolean;
  keepTypeGeometry: boolean;
  randomizeAnimation: boolean;
  /** derive the whole palette from one hue using a harmony scheme */
  useHarmony: boolean;
  /** rarity drives glow / particles / ornateness */
  rarityDrivesOrnate: boolean;
  jitter: number;            // 0..1
}
export const DEFAULT_RULES: RandomRules = {
  elements: [], itemTypes: [], modEssences: [], headShapes: [], finishes: [], rarities: [],
  tipStyles: [], orbiterStyles: [], gemCuts: [], adornments: [],
  colorsFollowElement: true, keepTypeGeometry: true, randomizeAnimation: false,
  useHarmony: false, rarityDrivesOrnate: true, jitter: 0.5,
};

/* ── helpers ── */
export const countLocked = (locks: Locks) => Object.values(locks).filter(Boolean).length;
export const allLocked = (locks: Locks, keys: LockKey[]) => keys.length > 0 && keys.every((k) => locks[k]);
export const anyLocked = (locks: Locks, keys: LockKey[]) => keys.some((k) => locks[k]);
export function withLocks(locks: Locks, keys: LockKey[], on: boolean): Locks {
  const next: Locks = { ...locks };
  for (const k of keys) { if (on) next[k] = true; else delete next[k]; }
  return next;
}
/** Lock everything except `keys` (used by "randomize only …"). */
export function locksExcept(keys: LockKey[], base: Locks = {}): Locks {
  const allow = new Set(keys);
  const next: Locks = { ...base };
  for (const k of RANDOMIZABLE_KEYS) if (!allow.has(k)) next[k] = true;
  return next;
}
export const lockedKeys = (locks: Locks): LockKey[] => (Object.keys(locks) as LockKey[]).filter((k) => locks[k]);
