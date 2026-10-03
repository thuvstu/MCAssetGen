import type {
  AnimationId,
  DecorationId,
  EditorState,
  FormId,
  ModeId,
  PresetId,
  ThemeId,
  TierId,
  TextureKind,
} from "./types";

export const DEFAULT_EDITOR: EditorState = {
  preset: "original",
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  pixelSize: 1,
  glow: 0,
  noise: 0,
  highlight: 0,
  edge: 18,
  scanline: 12,
  vignette: 16,
  seed: 7,
  decoration: "none",
  decorationStack: [],
  accent: "#c4f27a",
  tier: "base",
  overclock: 0,
  form: "standard",
  theme: "signature",
  mode: "none",
};

type PresetSettings = Pick<
  EditorState,
  "brightness" | "contrast" | "saturation" | "hue" | "pixelSize" | "glow" | "noise" | "highlight" | "edge" | "scanline" | "vignette" | "seed"
>;

export const PRESETS: {
  id: Exclude<PresetId, "custom">;
  name: string;
  description: string;
  swatch: string;
  kind: TextureKind;
  settings: PresetSettings;
}[] = [
  { id: "original", name: "オリジナル", description: "素材の色をそのまま", swatch: "swatch-original", kind: "any", settings: { brightness: 100, contrast: 100, saturation: 100, hue: 0, pixelSize: 1, glow: 0, noise: 0, highlight: 0, edge: 18, scanline: 12, vignette: 16, seed: 7 } },
  { id: "polished", name: "クリスタル", description: "透明感ときらめきをプラス", swatch: "swatch-polished", kind: "glow", settings: { brightness: 108, contrast: 116, saturation: 145, hue: 8, pixelSize: 1, glow: 12, noise: 0, highlight: 18, edge: 22, scanline: 8, vignette: 20, seed: 11 } },
  { id: "amethyst", name: "アメジスト", description: "深みのある紫晶カラー", swatch: "swatch-amethyst", kind: "stone", settings: { brightness: 103, contrast: 118, saturation: 155, hue: 104, pixelSize: 1, glow: 10, noise: 3, highlight: 12, edge: 20, scanline: 14, vignette: 22, seed: 5 } },
  { id: "nether", name: "ネザーライト", description: "赤銅色の重厚なトーン", swatch: "swatch-nether", kind: "metal", settings: { brightness: 94, contrast: 130, saturation: 142, hue: -128, pixelSize: 1, glow: 6, noise: 10, highlight: 4, edge: 24, scanline: 18, vignette: 30, seed: 17 } },
  { id: "frost", name: "フロスト", description: "冷たく澄んだ氷の質感", swatch: "swatch-frost", kind: "stone", settings: { brightness: 116, contrast: 108, saturation: 126, hue: -25, pixelSize: 1, glow: 14, noise: 4, highlight: 20, edge: 26, scanline: 10, vignette: 22, seed: 9 } },
  { id: "gold", name: "ゴールド", description: "黄金の光沢と重み", swatch: "swatch-gold", kind: "metal", settings: { brightness: 109, contrast: 124, saturation: 170, hue: -22, pixelSize: 1, glow: 18, noise: 5, highlight: 24, edge: 22, scanline: 12, vignette: 28, seed: 3 } },
  { id: "ender", name: "エンダー", description: "歪んだ紫の異界トーン", swatch: "swatch-ender", kind: "glow", settings: { brightness: 98, contrast: 122, saturation: 150, hue: 145, pixelSize: 1, glow: 20, noise: 8, highlight: 10, edge: 26, scanline: 16, vignette: 34, seed: 13 } },
  { id: "redstone", name: "レッドストーン", description: "赤く熱を帯びた発光", swatch: "swatch-redstone", kind: "glow", settings: { brightness: 102, contrast: 134, saturation: 180, hue: -158, pixelSize: 1, glow: 26, noise: 6, highlight: 16, edge: 24, scanline: 14, vignette: 30, seed: 21 } },
  { id: "deepslate", name: "深層岩", description: "沈み込むような深い青緑", swatch: "swatch-deepslate", kind: "stone", settings: { brightness: 88, contrast: 120, saturation: 90, hue: 145, pixelSize: 1, glow: 0, noise: 16, highlight: 2, edge: 20, scanline: 18, vignette: 32, seed: 8 } },
  { id: "prismarine", name: "プリズマリン", description: "海底遺跡のシアン", swatch: "swatch-prismarine", kind: "stone", settings: { brightness: 100, contrast: 116, saturation: 140, hue: 70, pixelSize: 1, glow: 12, noise: 7, highlight: 14, edge: 22, scanline: 12, vignette: 24, seed: 15 } },
  { id: "enchanted", name: "エンチャント", description: "紫に煌めく魔法の質感", swatch: "swatch-enchanted", kind: "glow", settings: { brightness: 112, contrast: 118, saturation: 155, hue: 120, pixelSize: 1, glow: 28, noise: 5, highlight: 18, edge: 24, scanline: 10, vignette: 26, seed: 19 } },
  { id: "grass", name: "草原ブロック", description: "鮮やかで自然な緑", swatch: "swatch-grass", kind: "organic", settings: { brightness: 106, contrast: 108, saturation: 150, hue: 35, pixelSize: 1, glow: 4, noise: 12, highlight: 10, edge: 18, scanline: 14, vignette: 22, seed: 23 } },
  { id: "oak", name: "オーク材", description: "自然な温かみの木目", swatch: "swatch-oak", kind: "block", settings: { brightness: 104, contrast: 108, saturation: 132, hue: -20, pixelSize: 1, glow: 0, noise: 9, highlight: 9, edge: 18, scanline: 16, vignette: 20, seed: 2 } },
  { id: "spruce", name: "ダーク材", description: "深い色味の木目", swatch: "swatch-spruce", kind: "block", settings: { brightness: 92, contrast: 112, saturation: 120, hue: -14, pixelSize: 1, glow: 0, noise: 10, highlight: 8, edge: 16, scanline: 14, vignette: 22, seed: 4 } },
  { id: "birch", name: "シラカバ", description: "白木と黒い斑点の木工素材", swatch: "swatch-birch", kind: "block", settings: { brightness: 112, contrast: 104, saturation: 126, hue: -8, pixelSize: 1, glow: 0, noise: 7, highlight: 14, edge: 16, scanline: 14, vignette: 18, seed: 6 } },
  { id: "acacia", name: "アカシア材", description: "紅い色合いと荒れ目の木紋", swatch: "swatch-acacia", kind: "block", settings: { brightness: 105, contrast: 114, saturation: 146, hue: -42, pixelSize: 1, glow: 0, noise: 10, highlight: 10, edge: 18, scanline: 15, vignette: 22, seed: 6 } },
  { id: "stone", name: "ストーン", description: "岩や石畳に適した中性トーン", swatch: "swatch-stone", kind: "stone", settings: { brightness: 102, contrast: 108, saturation: 92, hue: 0, pixelSize: 1, glow: 0, noise: 13, highlight: 8, edge: 20, scanline: 14, vignette: 24, seed: 10 } },
  { id: "dirt", name: "ダート", description: "土や耕地に自然な湿度感", swatch: "swatch-dirt", kind: "organic", settings: { brightness: 102, contrast: 108, saturation: 128, hue: -28, pixelSize: 1, glow: 0, noise: 14, highlight: 7, edge: 18, scanline: 14, vignette: 22, seed: 12 } },
  { id: "cobblestone", name: "丸石", description: "割れ目と塊の密度を強調", swatch: "swatch-cobblestone", kind: "stone", settings: { brightness: 102, contrast: 116, saturation: 88, hue: 0, pixelSize: 1, glow: 0, noise: 18, highlight: 8, edge: 22, scanline: 16, vignette: 26, seed: 14 } },
  { id: "bricks", name: "ブリック", description: "砂色の継ぎ目と布石の規則", swatch: "swatch-bricks", kind: "stone", settings: { brightness: 103, contrast: 118, saturation: 118, hue: -18, pixelSize: 1, glow: 0, noise: 12, highlight: 10, edge: 20, scanline: 16, vignette: 24, seed: 16 } },
  { id: "obsidian", name: "黒曜石", description: "深い黒と紫の結晶", swatch: "swatch-obsidian", kind: "stone", settings: { brightness: 86, contrast: 134, saturation: 130, hue: 135, pixelSize: 1, glow: 6, noise: 11, highlight: 12, edge: 24, scanline: 14, vignette: 34, seed: 18 } },
];

export const DECORATIONS: { id: DecorationId; name: string; icon: string }[] = [
  { id: "none", name: "なし", icon: "minus" },
  { id: "sparkles", name: "きらめき", icon: "sparkles" },
  { id: "runes", name: "ルーン", icon: "rune" },
  { id: "outline", name: "ネオン縁", icon: "outline" },
  { id: "glint", name: "一筋の光", icon: "flare" },
  { id: "enchanted", name: "エンチャント", icon: "book" },
  { id: "shadow", name: "立体影", icon: "shadow" },
  { id: "glow", name: "発光", icon: "glow" },
  { id: "highlights", name: "自動ハイライト", icon: "shine" },
  { id: "pixelgrid", name: "ピクセル枠", icon: "grid" },
  { id: "vignette", name: "ビネット", icon: "vignette" },
  { id: "frostedge", name: "霜縁", icon: "snow" },
  { id: "ember", name: "炎粒", icon: "flame" },
  { id: "lavaedge", name: "溶岩縁", icon: "lava" },
  { id: "leaves", name: "落葉", icon: "leaf" },
  { id: "crumbs", name: "粉砕", icon: "crumb" },
  { id: "wire", name: "配線", icon: "circuit" },
  { id: "petals", name: "花びら", icon: "flower" },
  { id: "scanline", name: "走査線", icon: "scan" },
  { id: "waves", name: "波紋", icon: "wave" },
  { id: "fracture", name: "ひび割れ", icon: "crack" },
];

// ---- Progression tiers (段階強化) ----
export type TierDef = {
  id: TierId;
  name: string;
  short: string;
  description: string;
  rank: number;
  // Multipliers/offsets applied to the base look.
  brightnessMul: number;
  contrastMul: number;
  saturationMul: number;
  glowAdd: number;
  highlightAdd: number;
  edgeAdd: number;
  overlay: string; // hex tint applied faintly
  overlayAlpha: number;
};

export const TIERS: TierDef[] = [
  { id: "base", name: "原型", short: "I", description: "武器の初期状態", rank: 1, brightnessMul: 1, contrastMul: 1, saturationMul: 1, glowAdd: 0, highlightAdd: 0, edgeAdd: 0, overlay: "#000000", overlayAlpha: 0 },
  { id: "reinforced", name: "強化", short: "II", description: "金属を補強し輝きを増す", rank: 2, brightnessMul: 1.03, contrastMul: 1.06, saturationMul: 1.1, glowAdd: 6, highlightAdd: 8, edgeAdd: 6, overlay: "#8fd6ff", overlayAlpha: 0.05 },
  { id: "tempered", name: "鍛造", short: "III", description: "熱処理で刃紋が浮かぶ", rank: 3, brightnessMul: 1.05, contrastMul: 1.12, saturationMul: 1.2, glowAdd: 12, highlightAdd: 14, edgeAdd: 12, overlay: "#ffd27a", overlayAlpha: 0.08 },
  { id: "mythic", name: "神話", short: "IV", description: "神話級のオーラを纏う", rank: 4, brightnessMul: 1.08, contrastMul: 1.16, saturationMul: 1.32, glowAdd: 20, highlightAdd: 20, edgeAdd: 18, overlay: "#c09bff", overlayAlpha: 0.12 },
  { id: "awakened", name: "覚醒", short: "V", description: "限界を超えた覚醒形態", rank: 5, brightnessMul: 1.1, contrastMul: 1.2, saturationMul: 1.45, glowAdd: 30, highlightAdd: 28, edgeAdd: 24, overlay: "#ffffff", overlayAlpha: 0.05 },
];

// ---- Form / transformation variants (形態変化) ----
export type FormDef = {
  id: FormId;
  name: string;
  icon: string;
  description: string;
  // Geometry transform hints for the compositor.
  scaleX: number;
  scaleY: number;
  rotate: number; // degrees
  mirror: boolean;
  doubleOffset: number; // px offset for a mirrored ghost copy (0 = off)
  stretch: number; // extra elongation factor
};

export const FORMS: FormDef[] = [
  { id: "standard", name: "標準", icon: "sword", description: "基本の形状", scaleX: 1, scaleY: 1, rotate: 0, mirror: false, doubleOffset: 0, stretch: 1 },
  { id: "blade", name: "刀身延長", icon: "blade", description: "刃を長く鋭く伸ばす", scaleX: 1, scaleY: 1, rotate: 0, mirror: false, doubleOffset: 0, stretch: 1.18 },
  { id: "heavy", name: "重量化", icon: "hammer", description: "太く重厚な形へ", scaleX: 1.18, scaleY: 1, rotate: 0, mirror: false, doubleOffset: 0, stretch: 1 },
  { id: "twin", name: "双身", icon: "twin", description: "分身する二刀形態", scaleX: 0.94, scaleY: 0.94, rotate: 0, mirror: true, doubleOffset: 0.16, stretch: 1 },
  { id: "ranged", name: "遠隔", icon: "bow", description: "湾曲した射出形態", scaleX: 1, scaleY: 1.12, rotate: -18, mirror: false, doubleOffset: 0, stretch: 1.05 },
  { id: "spectral", name: "霊体", icon: "ghost", description: "半透明の霊体化", scaleX: 1.04, scaleY: 1.04, rotate: 0, mirror: false, doubleOffset: 0, stretch: 1 },
];

// ---- Thematic model variants (同一テーマ別モデル) ----
export type ThemeDef = {
  id: ThemeId;
  name: string;
  icon: string;
  accent: string;
  hueShift: number;
  saturationMul: number;
  tint: string;
  tintAlpha: number;
  particle: "spark" | "flame" | "frost" | "bolt" | "toxin" | "void" | "ray" | "petal";
};

export const THEMES: ThemeDef[] = [
  { id: "signature", name: "本来", icon: "star", accent: "#c4f27a", hueShift: 0, saturationMul: 1, tint: "#c4f27a", tintAlpha: 0, particle: "spark" },
  { id: "inferno", name: "業火", icon: "flame", accent: "#ff7a35", hueShift: -140, saturationMul: 1.25, tint: "#ff5a1e", tintAlpha: 0.16, particle: "flame" },
  { id: "glacier", name: "氷結", icon: "snow", accent: "#8fdcff", hueShift: 40, saturationMul: 1.1, tint: "#7fd0ff", tintAlpha: 0.16, particle: "frost" },
  { id: "storm", name: "雷鳴", icon: "bolt", accent: "#ffe45a", hueShift: -30, saturationMul: 1.3, tint: "#fff08a", tintAlpha: 0.12, particle: "bolt" },
  { id: "venom", name: "猛毒", icon: "toxin", accent: "#9dff5a", hueShift: 70, saturationMul: 1.35, tint: "#7bff3d", tintAlpha: 0.16, particle: "toxin" },
  { id: "void", name: "虚無", icon: "void", accent: "#b98cff", hueShift: 150, saturationMul: 1.15, tint: "#7a4fd6", tintAlpha: 0.2, particle: "void" },
  { id: "radiant", name: "聖光", icon: "sun", accent: "#fff2c4", hueShift: -18, saturationMul: 0.92, tint: "#fff6d6", tintAlpha: 0.14, particle: "ray" },
  { id: "bloom", name: "花咲", icon: "flower", accent: "#ff8ad0", hueShift: 200, saturationMul: 1.2, tint: "#ff6fc4", tintAlpha: 0.15, particle: "petal" },
];

// ---- Temporary battle modes (一時的モード変化) ----
export type ModeDef = {
  id: ModeId;
  name: string;
  icon: string;
  description: string;
  duration: number; // ms; 0 = permanent while active
  brightnessMul: number;
  saturationMul: number;
  glowAdd: number;
  aura: string;
  auraAlpha: number;
  pulse: boolean;
};

export const MODES: ModeDef[] = [
  { id: "none", name: "通常", icon: "circle", description: "通常状態", duration: 0, brightnessMul: 1, saturationMul: 1, glowAdd: 0, aura: "#000000", auraAlpha: 0, pulse: false },
  { id: "berserk", name: "狂化", icon: "flame", description: "赤く猛り攻撃力上昇", duration: 8000, brightnessMul: 1.06, saturationMul: 1.3, glowAdd: 18, aura: "#ff3b2f", auraAlpha: 0.22, pulse: true },
  { id: "guard", name: "守護", icon: "shield", description: "青い障壁で防御態勢", duration: 10000, brightnessMul: 1.02, saturationMul: 0.95, glowAdd: 12, aura: "#4aa8ff", auraAlpha: 0.2, pulse: false },
  { id: "focus", name: "集中", icon: "target", description: "研ぎ澄まされた金の集中", duration: 6000, brightnessMul: 1.08, saturationMul: 1.1, glowAdd: 14, aura: "#ffd24a", auraAlpha: 0.18, pulse: true },
  { id: "curse", name: "呪詛", icon: "skull", description: "紫の呪いに侵食される", duration: 9000, brightnessMul: 0.9, saturationMul: 1.2, glowAdd: 16, aura: "#a24aff", auraAlpha: 0.24, pulse: true },
  { id: "overdrive", name: "限界駆動", icon: "bolt", description: "全能力を解放する最終モード", duration: 5000, brightnessMul: 1.12, saturationMul: 1.4, glowAdd: 28, aura: "#ffffff", auraAlpha: 0.16, pulse: true },
];

// ---- Combat animations (攻撃・魔法発動アニメーション) ----
export type AnimationDef = {
  id: AnimationId;
  name: string;
  icon: string;
  description: string;
  duration: number; // ms per loop
  loop: boolean;
};

export const ANIMATIONS: AnimationDef[] = [
  { id: "idle", name: "待機", icon: "circle", description: "ゆらめく待機モーション", duration: 2600, loop: true },
  { id: "slash", name: "斬撃", icon: "sword", description: "振り抜く斬撃モーション", duration: 620, loop: true },
  { id: "cast", name: "詠唱", icon: "book", description: "魔法陣を展開する詠唱", duration: 1600, loop: true },
  { id: "charge", name: "溜め", icon: "bolt", description: "エネルギーを溜め込む", duration: 1400, loop: true },
  { id: "channel", name: "詠唱維持", icon: "flare", description: "魔力を放出し続ける", duration: 2000, loop: true },
  { id: "burst", name: "解放", icon: "burst", description: "衝撃波を放つ大技", duration: 900, loop: true },
];

export const findTier = (id: TierId) => TIERS.find((t) => t.id === id) ?? TIERS[0];
export const findForm = (id: FormId) => FORMS.find((f) => f.id === id) ?? FORMS[0];
export const findTheme = (id: ThemeId) => THEMES.find((t) => t.id === id) ?? THEMES[0];
export const findMode = (id: ModeId) => MODES.find((m) => m.id === id) ?? MODES[0];
export const findAnimation = (id: AnimationId) => ANIMATIONS.find((a) => a.id === id) ?? ANIMATIONS[0];
