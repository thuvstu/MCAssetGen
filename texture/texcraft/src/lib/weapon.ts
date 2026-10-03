import { Tex, createTex } from './tex';
import { Layer, newLayer, Params, applyStack } from './effects';

/* ============================================================
   Weapon Progression System
   同一武器の段階強化・限界突破・形態変化・一時モード・攻撃モーション
   ============================================================ */

export type StageId = 'base' | 'enhanced' | 'awakened' | 'limitbreak' | 'ultimate' | 'broken' | 'cursed' | 'divine';
export type FormId = 'normal' | 'fire' | 'ice' | 'lightning' | 'void' | 'holy' | 'corrupt' | 'chrono';
export type ModeId = 'idle' | 'charge' | 'swing' | 'thrust' | 'cast' | 'guard' | 'crit' | 'burst' | 'slash' | 'spin' | 'parry' | 'beam' | 'summon' | 'reload' | 'transform';
export type VariationTag = 'standard' | 'elite' | 'legendary' | 'mythic' | 'ancient' | 'corrupted' | 'blessed';

export interface StageDef {
  id: StageId;
  name: string;
  icon: string;
  desc: string;
  color: string;
  layers: [string, Params?][];
  order: number;
}

export interface FormDef {
  id: FormId;
  name: string;
  icon: string;
  tint: string;
  extraLayers: [string, Params?][];
}

export interface AnimDef {
  id: ModeId;
  name: string;
  icon: string;
  frames: number;
  fps: number;
  layers: [string, Params?][];
  onHitFrame?: number;
  loop: boolean;
}

export interface VariationDef {
  tag: VariationTag;
  name: string;
  icon: string;
  layerOverrides: [string, Params?][];
}

export const STAGES: StageDef[] = [
  { id: 'base', name: '素', icon: '⚪', desc: 'ベースモデル', color: '#888', order: 0,
    layers: [['autoshade', { strength: 25 }]] },
  { id: 'enhanced', name: '強化', icon: '🔧', desc: '鍛冶で強化', color: '#4ec', order: 1,
    layers: [['autoshade', { strength: 35 }], ['metal', { color: '#8fd8a8', amount: 40 }], ['edgewear', { color: '#bfffc8', amount: 30 }]] },
  { id: 'awakened', name: '覚醒', icon: '✨', desc: '魔力が宿る', color: '#a8f', order: 2,
    layers: [['gradmap', { c1: '#1a0a2e', c2: '#8440d8', c3: '#e8c8ff' }], ['enchant', { intensity: 55 }], ['sparkle', { count: 4 }], ['glow', { color: '#c060ff', radius: 2, intensity: 50, pulse: true }]] },
  { id: 'limitbreak', name: '限界突破', icon: '💥', desc: '限界を超えた力', color: '#f80', order: 3,
    layers: [['gradmap', { c1: '#3a1000', c2: '#d86010', c3: '#fff0a0' }], ['cracks', { count: 5, length: 12, glow: true, depth: 100 }], ['glow', { mode: 'bloom', color: '#ff9020', radius: 3, intensity: 70 }], ['pulse', { color: '#ffb040', threshold: 100 }], ['embers', { count: 8 }]] },
  { id: 'ultimate', name: '究極', icon: '🌟', desc: '最終形態', color: '#ff6', order: 4,
    layers: [['gradmap', { c1: '#0a2830', c2: '#10d8c0', c3: '#ffffff' }], ['metal', { color: '#40fff0', amount: 55, animate: true }], ['shimmer', { intensity: 70, width: 3 }], ['sparkle', { count: 8, style: 'star', color: '#e0ffff' }], ['runes', { color: '#20fff0', count: 4, animate: true }]] },
  { id: 'broken', name: '砕かれた', icon: '💔', desc: '破損・朽ちた姿', color: '#644', order: 5,
    layers: [['adjust', { brightness: -30, saturation: -50, contrast: 20 }], ['cracks', { count: 8, length: 16, color: '#1a1410' }], ['weather', { type: 'rust', coverage: 60 }], ['vignette', { strength: 50 }]] },
  { id: 'cursed', name: '呪われた', icon: '☠️', desc: '呪いの力', color: '#80f', order: 6,
    layers: [['tint', { color: '#3a0840', amount: 60 }], ['runes', { style: 'glow', color: '#b040ff', count: 5, animate: true }], ['glow', { mode: 'outer', color: '#8020ff', radius: 3, intensity: 60, pulse: true }], ['embers', { type: 'soul', count: 6 }]] },
  { id: 'divine', name: '神器', icon: '⛩️', desc: '神の加護', color: '#ffd040', order: 7,
    layers: [['gradmap', { c1: '#201808', c2: '#d8b020', c3: '#fff8a0' }], ['metal', { color: '#ffe860', amount: 50 }], ['frame', { style: 'ornate', color: '#e8c030' }], ['emblem', { shape: 'crown', color: '#ffe040' }], ['iridescent', { color: '#fff080', amount: 60, animate: true }]] },
];

export const FORMS: FormDef[] = [
  { id: 'normal', name: '通常', icon: '⬜', tint: '#ffffff', extraLayers: [] },
  { id: 'fire', name: '炎', icon: '🔥', tint: '#ff6020',
    extraLayers: [['tint', { color: '#ff4010', amount: 45 }], ['glow', { color: '#ff8020', radius: 2, intensity: 55, pulse: true }], ['embers', { count: 5 }]] },
  { id: 'ice', name: '氷', icon: '❄️', tint: '#40d0ff',
    extraLayers: [['tint', { color: '#20a0ff', amount: 50 }], ['frost', { amount: 65, crystals: 10 }], ['sparkle', { count: 4, style: 'cross', color: '#c0f0ff' }]] },
  { id: 'lightning', name: '雷', icon: '⚡', tint: '#ffe040',
    extraLayers: [['tint', { color: '#ffd020', amount: 40 }], ['shimmer', { intensity: 60, width: 2, angle: 'd' }], ['glow', { color: '#ffff60', radius: 2, intensity: 65, pulse: true }]] },
  { id: 'void', name: '虚無', icon: '🕳️', tint: '#6020c0',
    extraLayers: [['tint', { color: '#301060', amount: 55 }], ['vignette', { strength: 60, shape: 'round', color: '#100020' }], ['runes', { style: 'glow', color: '#8040ff', count: 3, animate: true }], ['embers', { type: 'soul', count: 4 }]] },
  { id: 'holy', name: '聖', icon: '✝️', tint: '#fff8c0',
    extraLayers: [['gradmap', { c1: '#182010', c2: '#80d060', c3: '#ffffe0' }], ['glow', { mode: 'bloom', color: '#a0ff60', radius: 3, intensity: 50 }], ['sparkle', { count: 6, style: 'star' }]] },
  { id: 'corrupt', name: '腐敗', icon: '☣️', tint: '#604010',
    extraLayers: [['tint', { color: '#402808', amount: 50 }], ['weather', { type: 'moss', coverage: 50, bias: 'bottom' }], ['weather', { type: 'rust', coverage: 30 }], ['vignette', { strength: 40, color: '#181008' }]] },
  { id: 'chrono', name: '時空', icon: '🕰️', tint: '#c080ff',
    extraLayers: [['tint', { color: '#8040d0', amount: 45 }], ['wave', { amp: 1, wavelength: 6, animate: true }], ['huecycle', { amount: 35, spread: 80 }], ['shimmer', { intensity: 50, width: 4 }]] },
];

export const ANIMS: AnimDef[] = [
  { id: 'idle', name: '待機', icon: '💤', frames: 8, fps: 4, loop: true,
    layers: [['pulse', { amount: 15, threshold: 120 }]] },
  { id: 'charge', name: '溜め', icon: '🔋', frames: 12, fps: 10, loop: false, onHitFrame: 10,
    layers: [['glow', { mode: 'bloom', color: '#ffd040', radius: 4, intensity: 80, pulse: true }], ['pulse', { amount: 60, threshold: 80 }], ['shimmer', { intensity: 80, width: 2 }]] },
  { id: 'swing', name: '斬撃', icon: '🗡️', frames: 6, fps: 18, loop: false, onHitFrame: 3,
    layers: [['wave', { amp: 2, wavelength: 8, animate: true, dir: 'h' }], ['shimmer', { intensity: 100, width: 3, angle: 'h' }]] },
  { id: 'thrust', name: '突き', icon: '🔱', frames: 5, fps: 20, loop: false, onHitFrame: 2,
    layers: [['wave', { amp: 1, wavelength: 6, animate: true, dir: 'v' }], ['shimmer', { intensity: 90, width: 2, angle: 'v' }]] },
  { id: 'cast', name: '詠唱', icon: '📜', frames: 16, fps: 8, loop: true,
    layers: [['enchant', { intensity: 70, width: 5 }], ['sparkle', { count: 6, animate: true }], ['runes', { style: 'glow', color: '#60d0ff', count: 4, animate: true }]] },
  { id: 'guard', name: 'ガード', icon: '🛡️', frames: 4, fps: 12, loop: false,
    layers: [['glow', { mode: 'inner', color: '#40c0ff', radius: 3, intensity: 60 }], ['iridescent', { color: '#60f0ff', amount: 55, animate: true }]] },
  { id: 'crit', name: '会心', icon: '💥', frames: 8, fps: 15, loop: false, onHitFrame: 2,
    layers: [['glow', { mode: 'bloom', color: '#ff3060', radius: 5, intensity: 100 }], ['shimmer', { intensity: 100, width: 1 }], ['sparkle', { count: 10, style: 'star' }]] },
  { id: 'burst', name: 'バースト', icon: '☄️', frames: 10, fps: 12, loop: false, onHitFrame: 5,
    layers: [['gradmap', { c1: '#300808', c2: '#e04020', c3: '#fff080' }], ['cracks', { count: 6, length: 14, glow: true }], ['glow', { mode: 'bloom', color: '#ff5020', radius: 5, intensity: 90 }], ['embers', { count: 12 }], ['pulse', { amount: 80, threshold: 60 }]] },
  { id: 'slash', name: '居合斬り', icon: '⚔️', frames: 8, fps: 16, loop: false, onHitFrame: 3,
    layers: [['slash', { color: '#ffffff', width: 2, intensity: 90, dir: 'tlbr' }], ['afterimage', { dir: 'nw', steps: 2 }], ['sparks', { count: 8 }]] },
  { id: 'spin', name: '回転斬り', icon: '🌀', frames: 12, fps: 14, loop: false, onHitFrame: 6,
    layers: [['slash', { color: '#c0e8ff', width: 3, dir: 'trbl' }], ['orbit', { count: 4, radius: 50 }], ['afterimage', { dir: 'ne', steps: 3 }]] },
  { id: 'parry', name: '受け流し', icon: '🛡️', frames: 6, fps: 14, loop: false, onHitFrame: 2,
    layers: [['shockwave', { color: '#80d0ff', width: 2, intensity: 80 }], ['sparkle', { count: 6, style: 'cross' }]] },
  { id: 'beam', name: '魔力ビーム', icon: '📡', frames: 14, fps: 12, loop: false, onHitFrame: 7,
    layers: [['shimmer', { intensity: 100, width: 2, angle: 'v' }], ['glow', { mode: 'bloom', color: '#60e0ff', radius: 4, intensity: 80 }], ['ripple', { color: '#80c0ff', rings: 2 }]] },
  { id: 'summon', name: '召喚詠唱', icon: '📜', frames: 16, fps: 8, loop: true,
    layers: [['ripple', { color: '#c080ff', rings: 3 }], ['orbit', { color: '#e0a0ff', count: 4 }], ['runes', { style: 'glow', color: '#d080ff', count: 4, animate: true }]] },
  { id: 'reload', name: '装填', icon: '🔫', frames: 8, fps: 10, loop: false,
    layers: [['scanline', { color: '#ffd040', gap: 3, amount: 35 }], ['sparkle', { count: 3, style: 'dot' }]] },
  { id: 'transform', name: '形態変化', icon: '🦋', frames: 16, fps: 10, loop: false, onHitFrame: 12,
    layers: [['huecycle', { amount: 70, spread: 40 }], ['breathe', { amount: 2 }], ['glow', { mode: 'outer', color: '#ffffff', radius: 3, intensity: 70, pulse: true }], ['sparkle', { count: 8, style: 'star' }]] },
];

export const VARIATIONS: VariationDef[] = [
  { tag: 'standard', name: '標準', icon: '📦', layerOverrides: [] },
  { tag: 'elite', name: '上位', icon: '🥈', layerOverrides: [['sharpen', { amount: 30 }], ['metal', { color: '#c0c8d0', amount: 25 }]] },
  { tag: 'legendary', name: '伝説', icon: '🥇', layerOverrides: [['gradmap', { c1: '#100820', c2: '#8040c0', c3: '#f0d0ff' }], ['enchant', { intensity: 45 }], ['sparkle', { count: 4 }]] },
  { tag: 'mythic', name: '神話', icon: '🏆', layerOverrides: [['metal', { color: '#ffe060', amount: 40, animate: true }], ['iridescent', { color: '#fff880', amount: 50, animate: true }], ['runes', { style: 'gold', count: 3 }]] },
  { tag: 'ancient', name: '古代', icon: '🏺', layerOverrides: [['weather', { type: 'moss', coverage: 25 }], ['weather', { type: 'dirt', coverage: 20 }], ['cracks', { count: 3, length: 8, depth: 40 }], ['vignette', { strength: 30 }]] },
  { tag: 'corrupted', name: '堕落', icon: '😈', layerOverrides: [['tint', { color: '#401020', amount: 50 }], ['glow', { color: '#c02060', radius: 2, intensity: 55, pulse: true }], ['veins', { color: '#802030', density: 5, amount: 45 }]] },
  { tag: 'blessed', name: '祝福', icon: '😇', layerOverrides: [['tint', { color: '#103020', amount: 30 }], ['glow', { mode: 'bloom', color: '#60ff80', radius: 3, intensity: 45 }], ['sparkle', { count: 5, style: 'cross', color: '#c0ffd0' }]] },
];

/** Build all layers for a specific combination */
export function buildLayers(
  stage: StageId,
  form: FormId,
  variation: VariationTag,
  extraAnim?: ModeId
): Layer[] {
  const stageDef = STAGES.find(s => s.id === stage)!;
  const formDef = FORMS.find(f => f.id === form)!;
  const varDef = VARIATIONS.find(v => v.tag === variation)!;
  const animDef = extraAnim ? ANIMS.find(a => a.id === extraAnim) : null;

  const layers: Layer[] = [
    ...stageDef.layers.map(([t, p]) => newLayer(t, p)),
    ...formDef.extraLayers.map(([t, p]) => newLayer(t, p)),
    ...varDef.layerOverrides.map(([t, p]) => newLayer(t, p)),
  ];

  if (animDef) {
    layers.push(...animDef.layers.map(([t, p]) => newLayer(t, p)));
  }

  return layers;
}

/** Generate a complete weapon line (all stages for one base) */
export function generateWeaponLine(
  baseTex: Tex,
  form: FormId = 'normal',
  variation: VariationTag = 'standard'
): Record<StageId, Tex> {
  const result: Partial<Record<StageId, Tex>> = {};
  for (const s of STAGES) {
    const layers = buildLayers(s.id, form, variation);
    result[s.id] = applyStack(baseTex, layers, 0.25);
  }
  return result as Record<StageId, Tex>;
}

/** Generate all forms for a specific stage */
export function generateFormVariants(
  baseTex: Tex,
  stage: StageId,
  variation: VariationTag = 'standard'
): Record<FormId, Tex> {
  const result: Partial<Record<FormId, Tex>> = {};
  for (const f of FORMS) {
    const layers = buildLayers(stage, f.id, variation);
    result[f.id] = applyStack(baseTex, layers, 0.25);
  }
  return result as Record<FormId, Tex>;
}

/** Generate animation frames for a mode */
export function generateAnimFrames(
  baseTex: Tex,
  stage: StageId,
  form: FormId,
  mode: ModeId,
  variation: VariationTag = 'standard',
  frameCount?: number
): Tex[] {
  const animDef = ANIMS.find(a => a.id === mode)!;
  const layers = buildLayers(stage, form, variation, mode);
  const frames = frameCount || animDef.frames;
  return Array.from({ length: frames }, (_, i) => applyStack(baseTex, layers, i / frames));
}

/** Generate sprite sheet (horizontal strip) */
export function makeSpriteSheet(frames: Tex[]): Tex {
  const w = frames[0].w;
  const h = frames[0].h;
  const out = createTex(w * frames.length, h);
  frames.forEach((f, i) => {
    for (let y = 0; y < h; y++) {
      out.d.set(f.d.subarray(y * w * 4, (y + 1) * w * 4), (y * frames.length + i) * w * 4);
    }
  });
  return out;
}

/** Generate vertical strip (Minecraft format) */
export function makeVerticalStrip(frames: Tex[]): Tex {
  const w = frames[0].w;
  const h = frames[0].h;
  const out = createTex(w, h * frames.length);
  frames.forEach((f, i) => out.d.set(f.d, i * w * h * 4));
  return out;
}

/** Preset combinations for quick start */
export const WEAPON_PRESETS = [
  { name: '炎の剣', icon: '🔥', stage: 'awakened' as StageId, form: 'fire' as FormId, variation: 'legendary' as VariationTag },
  { name: '氷の大剣', icon: '❄️', stage: 'limitbreak' as StageId, form: 'ice' as FormId, variation: 'mythic' as VariationTag },
  { name: '雷の槍', icon: '⚡', stage: 'enhanced' as StageId, form: 'lightning' as FormId, variation: 'elite' as VariationTag },
  { name: '虚無の杖', icon: '🕳️', stage: 'cursed' as StageId, form: 'void' as FormId, variation: 'corrupted' as VariationTag },
  { name: '聖剣エクスカリバー', icon: '✝️', stage: 'divine' as StageId, form: 'holy' as FormId, variation: 'blessed' as VariationTag },
  { name: '古代の斧', icon: '🏺', stage: 'ultimate' as StageId, form: 'normal' as FormId, variation: 'ancient' as VariationTag },
  { name: '時空の短剣', icon: '🕰️', stage: 'awakened' as StageId, form: 'chrono' as FormId, variation: 'mythic' as VariationTag },
  { name: '朽ちた刀', icon: '💔', stage: 'broken' as StageId, form: 'corrupt' as FormId, variation: 'standard' as VariationTag },
];

/** Apply a weapon preset to current layers */
export function applyWeaponPreset(preset: typeof WEAPON_PRESETS[0]): Layer[] {
  return buildLayers(preset.stage, preset.form, preset.variation);
}