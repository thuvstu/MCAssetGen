import type { BaseForm, Decoration } from './forms-sampler';

export interface StyleOptions {
  outline: number;
  softness: number;
  saturation: number;
  contrast: number;
  highlight: number;
  grain: number;
  bevel: number;
  cartoon: number;
  glow: number;
  edgeLight: number;
  dither: number;
  hueShift: number;
}

export interface PackEssenceMix {
  furfsky: number;
  vanilla: number;
  imperial: number;
  faithful: number;
}

export interface TextureEssence {
  silhouette: number;
  outline: number;
  saturation: number;
  contrast: number;
  runes: number;
  gems: number;
  wear: number;
  glow: number;
  stylePower: number;
  mix: PackEssenceMix;
}

export type AnimationMode =
  | 'none' | 'sparkle' | 'pulse' | 'flow' | 'flame' | 'enchant' | 'drip'
  | 'orbit' | 'aura' | 'runes' | 'wingbeat' | 'fracture' | 'storm' | 'frost' | 'void' | 'ornament';

export interface AnimationFrameOptions {
  mode: AnimationMode;
  frame: number;
  frames: number;
}

export type TwinMode = 'single' | 'mirror' | 'crossed' | 'parallel';
export type ElementMode = 'none' | 'fire' | 'frost' | 'storm' | 'void' | 'holy' | 'nature' | 'blood' | 'arcane' | 'poison';
export type ElementMergeMode = 'split' | 'gradient' | 'weave' | 'chaos';
export type PivotPreset = 'center' | 'hilt' | 'head' | 'custom';
export type DecorLayer = 'back' | 'front';
/** 'all' fits body + decorations; 'body' fits the body only and clips decorations to the safe area. */
export type FitScope = 'all' | 'body';

/** Per-decoration overrides. Offsets are exact output pixels relative to the body anchor. */
export interface DecorTweak {
  x: number;
  y: number;
  scale: number;
  spread: number;
  hidden: boolean;
  layer?: DecorLayer;
}

export const DEFAULT_DECOR_TWEAK: DecorTweak = { x: 0, y: 0, scale: 1, spread: 1, hidden: false };

export interface ShapeOptions {
  form: BaseForm;
  decorations: Decoration[];
  amorphous: number;
  length: number;
  width: number;
  rotation: number;
  mirror: boolean;
  flipX: boolean;
  flipY: boolean;
  twin: TwinMode;
  offsetX: number;
  offsetY: number;
  pivot: PivotPreset;
  pivotX: number;
  pivotY: number;
  autoFit: boolean;
  fitPadding: number;
  fitScope: FitScope;
  /** global decoration size (ornament thickness / length) */
  decorationScale: number;
  /** global distance of ornaments from the body outline */
  decorationSpread: number;
  /** global decoration offset in output pixels, applied after fitting */
  decorOffsetX: number;
  decorOffsetY: number;
  /** order of `decorations` is the z-order inside each layer (later = higher) */
  decorTweaks: Partial<Record<Decoration, DecorTweak>>;
  element: ElementMode;
  elementSecondary: ElementMode;
  elementBlend: number;
  elementMerge: ElementMergeMode;
  elementPower: number;
}

export const DEFAULT_STYLE: StyleOptions = {
  outline: 72,
  softness: 85,
  saturation: 130,
  contrast: 55,
  highlight: 80,
  grain: 20,
  bevel: 70,
  cartoon: 40,
  glow: 55,
  edgeLight: 70,
  dither: 18,
  hueShift: 45,
};

export const DEFAULT_TEXTURE_ESSENCE: TextureEssence = {
  silhouette: 0.74,
  outline: 1,
  saturation: 1,
  contrast: 1,
  runes: 0.62,
  gems: 0.72,
  wear: 0.16,
  glow: 0.48,
  stylePower: 1.35,
  mix: { furfsky: 0.42, vanilla: 0.14, imperial: 0.26, faithful: 0.18 },
};

export const DEFAULT_SHAPE_OPTIONS: ShapeOptions = {
  form: 'auto',
  decorations: [],
  amorphous: 0,
  length: 1,
  width: 1,
  rotation: 0,
  mirror: false,
  flipX: false,
  flipY: false,
  twin: 'single',
  offsetX: 0,
  offsetY: 0,
  pivot: 'center',
  pivotX: 32,
  pivotY: 32,
  autoFit: true,
  fitPadding: 3,
  fitScope: 'all',
  decorationScale: 1,
  decorationSpread: 1,
  decorOffsetX: 0,
  decorOffsetY: 0,
  decorTweaks: {},
  element: 'none',
  elementSecondary: 'none',
  elementBlend: 0.5,
  elementMerge: 'split',
  elementPower: 0.65,
};

export function completeStyle(value?: Partial<StyleOptions>): StyleOptions {
  return { ...DEFAULT_STYLE, ...value };
}

export function completeEssence(value?: Partial<TextureEssence>): TextureEssence {
  return {
    ...DEFAULT_TEXTURE_ESSENCE,
    ...value,
    mix: { ...DEFAULT_TEXTURE_ESSENCE.mix, ...value?.mix },
  };
}

export function completeShape(value?: Partial<ShapeOptions>): ShapeOptions {
  // Legacy blueprints stored unused `decorationX/Y` (default 32); they never had an effect, so drop them.
  const { decorationX: _lx, decorationY: _ly, ...rest } = (value ?? {}) as Partial<ShapeOptions> & { decorationX?: number; decorationY?: number };
  void _lx; void _ly;
  const tweaks: Partial<Record<Decoration, DecorTweak>> = {};
  for (const [id, tweak] of Object.entries(rest.decorTweaks ?? {})) {
    if (tweak) tweaks[id as Decoration] = { ...DEFAULT_DECOR_TWEAK, ...tweak };
  }
  return {
    ...DEFAULT_SHAPE_OPTIONS,
    ...rest,
    fitScope: rest.fitScope === 'body' ? 'body' : 'all',
    decorations: [...new Set(rest.decorations ?? [])],
    decorTweaks: tweaks,
  };
}
