export type PresetId =
  | "original"
  | "polished"
  | "amethyst"
  | "nether"
  | "frost"
  | "gold"
  | "ender"
  | "redstone"
  | "deepslate"
  | "prismarine"
  | "enchanted"
  | "grass"
  | "oak"
  | "spruce"
  | "birch"
  | "acacia"
  | "stone"
  | "dirt"
  | "cobblestone"
  | "bricks"
  | "obsidian"
  | "custom";

export type DecorationId =
  | "none"
  | "sparkles"
  | "runes"
  | "outline"
  | "glint"
  | "enchanted"
  | "shadow"
  | "glow"
  | "highlights"
  | "pixelgrid"
  | "vignette"
  | "frostedge"
  | "ember"
  | "lavaedge"
  | "leaves"
  | "crumbs"
  | "wire"
  | "petals"
  | "scanline"
  | "waves"
  | "fracture";

export type TextureKind = "any" | "block" | "tool" | "organic" | "stone" | "metal" | "glow";

export type TextureSource = HTMLImageElement | HTMLCanvasElement;

// Progression tiers: the same weapon upgraded step by step.
export type TierId = "base" | "reinforced" | "tempered" | "mythic" | "awakened";

// Form / transformation variants applied on top of a tier.
export type FormId = "standard" | "blade" | "heavy" | "twin" | "ranged" | "spectral";

// Thematic model variants (same silhouette, different element/theme).
export type ThemeId =
  | "signature"
  | "inferno"
  | "glacier"
  | "storm"
  | "venom"
  | "void"
  | "radiant"
  | "bloom";

// Temporary in-battle modes (buffs) that layer on for a short time.
export type ModeId = "none" | "berserk" | "guard" | "focus" | "curse" | "overdrive";

// Combat animations played on the model.
export type AnimationId = "idle" | "slash" | "cast" | "charge" | "channel" | "burst";

export type EditorState = {
  preset: PresetId;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  pixelSize: number;
  glow: number;
  noise: number;
  highlight: number;
  edge: number;
  scanline: number;
  vignette: number;
  seed: number;
  decoration: DecorationId;
  decorationStack: Exclude<DecorationId, "none">[];
  accent: string;
  // Model systems
  tier: TierId;
  overclock: number; // 0-100 limit-break overflow energy
  form: FormId;
  theme: ThemeId;
  mode: ModeId;
};

// Live animation clock passed to the renderer (time in ms + progress 0..1).
export type AnimationFrame = {
  animation: AnimationId;
  time: number;
  progress: number;
  playing: boolean;
};

export type RenderOptions = {
  frame?: AnimationFrame;
  showModelFx?: boolean;
};
