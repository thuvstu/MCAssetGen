export type Vec3 = [number, number, number];
export type ModelKind =
  | "sword" | "pickaxe" | "axe" | "hammer" | "scythe" | "shovel" | "bow" | "staff" | "trident"
  | "chainsaw" | "drill" | "nailgun" | "circularsaw" | "flamethrower" | "jackhammer"
  | "spell_sword" | "enchanted_axe" | "cursed_blade" | "soul_reaper" | "shadow_dagger"
  | "blood_sword" | "blood_axe" | "grimoire" | "magic_circle"
  | "assault_rifle" | "sniper_rifle" | "pistol" | "shotgun" | "railgun" | "relic" | "spear" | "mace"
  | "chest" | "mushroom" | "lantern" | "crystal" | "tree" | "house" | "robot";
/** handheld: tools & weapons (vanilla item/handheld), bow: draw animation, decor: block-like objects */
export type Pose = "handheld" | "bow" | "sprite" | "decor";
export type TextureKind = "generated" | "atlas" | "sprite";
export type FaceName = "north" | "east" | "south" | "west" | "up" | "down";
export const FACES: readonly FaceName[] = ["north", "east", "south", "west", "up", "down"];
/** Generated/imported atlases are read as a 4 × 2 grid of material tiles. */
export const ATLAS_GRID = { cols: 4, rows: 2 } as const;

/** A user supplied texture. `atlas` drives material tiles, `sprite` is voxelized into geometry. */
export interface ModelTexture {
  source: string;
  kind: TextureKind;
  /** Sampled tile colors, so tag generation and previews can use an imported atlas. */
  palette?: string[];
  width: number;
  height: number;
  cols?: number;
  rows?: number;
  name?: string;
  slots?: number[];
  extrusion?: {
    depth: number;
    alphaThreshold: number;
    glowThreshold: number | null;
    mergeRuns: boolean;
    gridSize?: "native" | 16 | 32 | 64;
    removeBackground?: boolean;
  };
}
export type PaletteKey = "auto" | "violet" | "mint" | "ice" | "warm" | "diamond" | "iron" | "netherite";
export type ConcretePalette = Exclude<PaletteKey, "auto">;
export type DetailLevel = "low" | "balanced" | "high";
export type Category = "weapon" | "tool" | "decor";

export interface GenerationSettings {
  format: "minecraft" | "blockbench";
  resolution: 16 | 32 | 64;
  detail: DetailLevel;
  palette: PaletteKey;
  extras?: Extras;
  design?: import("./configurator").DesignConfig;
  gradient?: GradientConfig;
}
export interface GradientConfig { enabled: boolean; direction: "vertical" | "horizontal" | "radial"; intensity: number; colors: [string, string]; }
export const GRADIENT_DIRECTIONS = ["vertical", "horizontal", "radial"] as const;
export type GradientDirection = (typeof GRADIENT_DIRECTIONS)[number];
export const DEFAULT_GRADIENT: GradientConfig = { enabled: false, direction: "vertical", intensity: .5, colors: ["#c29af5", "#6744a2"] };

// ---- Decorations, effects and animation -------------------------------------------------------
export const ACCENT_IDS = ["auto", "gold", "rose", "cyan", "emerald", "lavender", "white"] as const;
export type AccentId = (typeof ACCENT_IDS)[number];
export const EFFECT_IDS = ["none", "sparkle", "flame", "soulfire", "snow", "magic", "electric", "hearts",
  "poison", "void", "blood", "gold", "wind", "frost"] as const;
export type EffectId = (typeof EFFECT_IDS)[number];
export const BODY_ANIMS = ["none", "float", "spin", "sway", "pulse", "breathe", "hover", "shake", "levitate", "vibrate"] as const;
export type BodyAnim = (typeof BODY_ANIMS)[number];
export const DECOR_ANIMS = ["none", "auto", "twinkle", "orbit", "drift"] as const;
export type DecorAnim = (typeof DECOR_ANIMS)[number];
export const TRANSFORM_ANIMS = ["none", "swing", "unsheathe", "powerup", "spinjump", "slash", "slam", "charge", "dash", "spin_attack"] as const;
export type TransformAnim = (typeof TRANSFORM_ANIMS)[number];
export type MotionKind = "orbit" | "twinkle" | "drift" | "sway" | "flicker" | "bob" | "jitter" | "wobble" | "stretch" | "pulse_fast";
/** Native motion of one decoration cube. `pivot` is the point it rotates/scales around. */
export interface Motion { kind: MotionKind; phase: number; pivot?: Vec3; amp?: number }
export const DECOR_IDS = [
  "gems","studs","rings","chains","tassels","ribbons","pendants","brooches","filigree",
  "plates","pipes","wires","dials","gears","horns","thorns","veins","crowns","splatters",
  "goo","bubbles","spark","embers","fireflies","dust","wisp","aura","glow_ring","ripple",
  "shield","wings","tail","fangs","claws","scales","feathers","bone","skull","heart",
  "eye","mouth","blood_vessel","venom","acid","curse","sigil","seal","ward","barrier",
  "runes","crystals","orbs","trails","flames","smoke","stars","snow","lightning",
  "vines","leaves","branches",
] as const;
export type DecorId = (typeof DECOR_IDS)[number];
export const SLOT_IDS = ["guard","pommel","grip","blade_top","blade_sides","head","body","sides","everywhere","barrel","scope","magazine","stock","trigger","muzzle"] as const;
export type SlotId = (typeof SLOT_IDS)[number];
export type Intensity = "few" | "normal" | "many";
export interface DecorInstance {
  id?: string;
  kind: DecorId;
  slot: SlotId;
  intensity: Intensity;
  color: AccentId | `#${string}` | null;
  count?: number;
  size?: number;
  offset?: Vec3;
  spacing?: number;
  mirror?: boolean;
  visible?: boolean;
}
export interface Extras {
  decor: DecorInstance[];
  accent: AccentId;
  effect: EffectId;
  animation: { body: BodyAnim; decor: DecorAnim; transform: TransformAnim; speed: number; shimmer: boolean };
}
export const DEFAULT_EXTRAS: Extras = {
  decor: [], accent: "auto", effect: "none",
  animation: { body: "none", decor: "auto", transform: "none", speed: 1, shimmer: false },
};

export interface VoxelCube {
  name: string;
  from: Vec3;
  to: Vec3;
  color: number;
  glow?: boolean;
  /** Decorations are a separate group so they can be animated independently of the body. */
  group?: "decor";
  decorId?: string;
  /** Independent decoration color, exported as a real PNG texture, not a preview-only tint. */
  tint?: string;
  motion?: Motion;
  /** Per-face UV rect in 16-unit space. Used by voxelized 2D textures to sample exact pixels. */
  uv?: Partial<Record<FaceName, [number, number, number, number]>>;
}
export interface ModelVariant { suffix: string; cubes: VoxelCube[] }
export interface VoxelModel {
  name: string;
  slug: string;
  kind: ModelKind;
  cubes: VoxelCube[];
  palette: string[];
  resolution: number;
  seed: number;
  textureSeed?: number;
  matched: boolean;
  pose?: Pose;
  baseItem?: string;
  variants?: ModelVariant[];
  texture?: ModelTexture;
  extras?: Extras;
  /** Exact interpretation of the prompt, kept with the generated model. */
  analysis?: import("./prompt").PromptAnalysis;
}
export interface SavedModel {
  id: string;
  name: string;
  tags: string[];
  settings: GenerationSettings;
  model: VoxelModel;
  createdAt: string;
}
export interface ModelTemplate {
  id: ModelKind;
  name: string;
  description: string;
  tags: string[];
  palette: PaletteKey;
  accent: string;
  category: Category;
}

export const NAMESPACE = "voxelforge";
export const PALETTE_KEYS: PaletteKey[] = ["auto", "violet", "mint", "ice", "warm", "diamond", "iron", "netherite"];
export const DEFAULT_TAGS = ["剣", "クリスタル", "ファンタジー", "紫", "ピクセルアート"];
export const DEFAULT_SETTINGS: GenerationSettings = { format: "minecraft", resolution: 32, detail: "balanced", palette: "violet" };

/** Color slots: 0 main · 1 light · 2 mid-dark · 3 dark accent · 4 gold · 5 handle · 6 darkest · 7 highlight */
export const PALETTES: Record<ConcretePalette, string[]> = {
  violet: ["#c29af5", "#ead9ff", "#9062d9", "#6744a2", "#dcb46c", "#7b5a58", "#352b43", "#f7edff"],
  mint: ["#6fc5aa", "#c2f5dc", "#3a9e82", "#226450", "#dcbb78", "#7d6a4c", "#30493d", "#eafff3"],
  ice: ["#76b7df", "#d0efff", "#4389c4", "#285b92", "#dcbd7a", "#6f6a78", "#29394d", "#f0ffff"],
  warm: ["#e0ab5c", "#ffe6a8", "#b9793e", "#805030", "#f2d68f", "#7b5637", "#3a2d2a", "#fff3d2"],
  diamond: ["#4fd5cf", "#bdfff7", "#2aa3a9", "#1b6f7c", "#e3c36d", "#7b5b3a", "#1d3b44", "#eafffc"],
  iron: ["#c7cbd2", "#f3f5f8", "#9a9fab", "#686e7b", "#dbb967", "#7b5b3a", "#30343c", "#ffffff"],
  netherite: ["#66596a", "#9a8a9c", "#4a3f4d", "#2f2832", "#c99d5c", "#4e3c37", "#1b151c", "#c4b2c6"],
};
export const PALETTE_LABELS: Record<ConcretePalette, string> = {
  violet: "アメジスト", mint: "エメラルド", ice: "アイス", warm: "アンバー", diamond: "ダイヤ", iron: "アイアン", netherite: "ネザライト",
};
export const MATERIAL_NAMES: Record<ConcretePalette, string> = {
  violet: "アメジスト", mint: "エメラルド", ice: "アイス", warm: "ゴールデン", diamond: "ダイヤ", iron: "アイアン", netherite: "ネザライト",
};
export const CATEGORY_LABELS: Record<Category, string> = { weapon: "武器", tool: "ツール", decor: "インテリア" };

export const KIND_INFO: Record<ModelKind, { label: string; pose: Pose; category: Category }> = {
  sword: { label: "剣", pose: "handheld", category: "weapon" },
  pickaxe: { label: "ピッケル", pose: "handheld", category: "tool" },
  axe: { label: "斧", pose: "handheld", category: "weapon" },
  hammer: { label: "ハンマー", pose: "handheld", category: "weapon" },
  chainsaw: { label: "チェーンソー", pose: "handheld", category: "weapon" },
  drill: { label: "ドリル", pose: "handheld", category: "tool" },
  nailgun: { label: "ネイルガン", pose: "handheld", category: "weapon" },
  circularsaw: { label: "丸鋸", pose: "handheld", category: "weapon" },
  flamethrower: { label: "火炎放射器", pose: "handheld", category: "weapon" },
  jackhammer: { label: "ジャックハンマー", pose: "handheld", category: "tool" },
  spell_sword: { label: "魔法の剣", pose: "handheld", category: "weapon" },
  enchanted_axe: { label: "魔法の斧", pose: "handheld", category: "weapon" },
  cursed_blade: { label: "呪いの刃", pose: "handheld", category: "weapon" },
  soul_reaper: { label: "魂刈り鎌", pose: "handheld", category: "weapon" },
  shadow_dagger: { label: "影の短剣", pose: "handheld", category: "weapon" },
  blood_sword: { label: "血の剣", pose: "handheld", category: "weapon" },
  blood_axe: { label: "血の斧", pose: "handheld", category: "weapon" },
  grimoire: { label: "魔導書", pose: "handheld", category: "weapon" },
  magic_circle: { label: "魔法陣", pose: "decor", category: "decor" },
  assault_rifle: { label: "アサルトライフル", pose: "handheld", category: "weapon" },
  sniper_rifle: { label: "スナイパーライフル", pose: "handheld", category: "weapon" },
  pistol: { label: "ピストル", pose: "handheld", category: "weapon" },
  shotgun: { label: "ショットガン", pose: "handheld", category: "weapon" },
  railgun: { label: "レールガン", pose: "handheld", category: "weapon" },
  relic: { label: "レリック", pose: "decor", category: "decor" },
  spear: { label: "豪華スピア", pose: "handheld", category: "weapon" },
  mace: { label: "メイス", pose: "handheld", category: "weapon" },
  scythe: { label: "鎌", pose: "handheld", category: "weapon" },
  shovel: { label: "シャベル", pose: "handheld", category: "tool" },
  bow: { label: "弓", pose: "bow", category: "weapon" },
  staff: { label: "杖", pose: "handheld", category: "weapon" },
  trident: { label: "トライデント", pose: "handheld", category: "weapon" },
  chest: { label: "宝箱", pose: "decor", category: "decor" },
  mushroom: { label: "キノコ", pose: "decor", category: "decor" },
  lantern: { label: "ランタン", pose: "decor", category: "decor" },
  crystal: { label: "クリスタル", pose: "decor", category: "decor" },
  tree: { label: "木", pose: "decor", category: "decor" },
  house: { label: "家", pose: "decor", category: "decor" },
  robot: { label: "ロボット", pose: "decor", category: "decor" },
};

export const TEMPLATES: ModelTemplate[] = [
  { id: "sword", name: "クリスタルソード", description: "物語が始まる、特別な一本。", tags: DEFAULT_TAGS, palette: "violet", accent: "#ae8add", category: "weapon" },
  { id: "pickaxe", name: "ダイヤのピッケル", description: "掘り進むたび、輝きが増していく。", tags: ["ピッケル", "ダイヤ", "ツール", "採掘"], palette: "diamond", accent: "#4fd5cf", category: "tool" },
  { id: "axe", name: "ネザライトの斧", description: "重さと切れ味を、ひとつに。", tags: ["斧", "ネザライト", "武器", "重厚"], palette: "netherite", accent: "#8a7a8e", category: "weapon" },
  { id: "hammer", name: "ネザライトのハンマー", description: "大きな打撃部で、力を伝える。", tags: ["ハンマー", "ネザライト", "重厚", "両手持ち"], palette: "netherite", accent: "#8a7a8e", category: "weapon" },
  { id: "scythe", name: "古代の鎌", description: "反る大きな刃と長い柄。", tags: ["鎌", "古代", "氷", "長い"], palette: "ice", accent: "#6eabbc", category: "weapon" },
  { id: "chainsaw", name: "チェーンソー", description: "回る刃で、何でも切り拓く。", tags: ["チェーンソー", "鉄", "機械", "工具"], palette: "iron", accent: "#c7cbd2", category: "weapon" },
  { id: "drill", name: "ドリル", description: "回転する螺旋で、掘り進む。", tags: ["ドリル", "鉄", "機械", "採掘"], palette: "iron", accent: "#c7cbd2", category: "tool" },
  { id: "nailgun", name: "ネイルガン", description: "釘を撃ち出す、現場の相棒。", tags: ["ネイルガン", "鉄", "機械", "工具"], palette: "iron", accent: "#c7cbd2", category: "weapon" },
  { id: "circularsaw", name: "丸鋸", description: "円盤の刃が唸る切断機。", tags: ["丸鋸", "鉄", "機械", "切断"], palette: "iron", accent: "#c7cbd2", category: "weapon" },
  { id: "flamethrower", name: "火炎放射器", description: "火を吹く、重い鋼の筒。", tags: ["火炎放射器", "鉄", "機械", "炎"], palette: "netherite", accent: "#e0ab5c", category: "weapon" },
  { id: "jackhammer", name: "ジャックハンマー", description: "砕くための、圧縮空気の槌。", tags: ["ジャックハンマー", "鉄", "機械", "破砕"], palette: "iron", accent: "#c7cbd2", category: "tool" },
  { id: "bow", name: "エルフの長弓", description: "引くたびに、森がささやく。", tags: ["弓", "緑", "森", "エルフ"], palette: "mint", accent: "#70ab8e", category: "weapon" },
  { id: "shovel", name: "アイアンシャベル", description: "丈夫で頼れる、毎日の相棒。", tags: ["シャベル", "鉄", "ツール"], palette: "iron", accent: "#b7bcc6", category: "tool" },
  { id: "staff", name: "オーブの杖", description: "光の玉が、魔法を呼び覚ます。", tags: ["杖", "魔法", "発光", "紫"], palette: "violet", accent: "#b68de8", category: "weapon" },
  { id: "trident", name: "深海のトライデント", description: "海の底から、静かな波音を。", tags: ["トライデント", "青", "海", "発光"], palette: "ice", accent: "#6eabbc", category: "weapon" },
  { id: "chest", name: "冒険者の宝箱", description: "次の冒険に、ひとつの宝物。", tags: ["宝箱", "木製", "金", "ファンタジー"], palette: "warm", accent: "#d5a76d", category: "decor" },
  { id: "lantern", name: "魔法のランタン", description: "あなたの世界に、あたたかな光。", tags: ["ランタン", "魔法", "発光", "金属"], palette: "warm", accent: "#c4a36b", category: "decor" },
  { id: "crystal", name: "クリスタル", description: "不思議な輝きを、手のひらに。", tags: ["クリスタル", "青", "発光", "ファンタジー"], palette: "ice", accent: "#6eabbc", category: "decor" },
  { id: "mushroom", name: "森のキノコ", description: "小さな森に、彩りを。", tags: ["キノコ", "赤", "自然", "かわいい"], palette: "auto", accent: "#b97478", category: "decor" },
  { id: "tree", name: "小さな森の木", description: "ブロックの世界に、緑を。", tags: ["木", "緑", "自然", "ピクセルアート"], palette: "mint", accent: "#70ab8e", category: "decor" },
  { id: "house", name: "ボクセルハウス", description: "帰りたくなる、小さなおうち。", tags: ["家", "木製", "建築", "かわいい"], palette: "warm", accent: "#c0a084", category: "decor" },
  { id: "robot", name: "フレンドリーロボット", description: "新しい冒険の、小さな相棒。", tags: ["ロボット", "金属", "青", "かわいい"], palette: "ice", accent: "#829bbd", category: "decor" },
  { id: "spell_sword", name: "魔法の剣", description: "魔力を宿した、光の刃。", tags: ["魔法の剣", "魔力", "発光", "幻想"], palette: "violet", accent: "#b68de8", category: "weapon" },
  { id: "cursed_blade", name: "呪いの刃", description: "闇に飲まれた、呪われた魔剣。", tags: ["呪いの刃", "闇", "魔力", "不気味"], palette: "netherite", accent: "#66596a", category: "weapon" },
  { id: "blood_sword", name: "血の剣", description: "血潮に濡れた、深紅の魔剣。", tags: ["血の剣", "血", "赤", "不気味"], palette: "warm", accent: "#d65b6c", category: "weapon" },
  { id: "grimoire", name: "魔導書", description: "知識と魔力が眠る古代の書物。", tags: ["魔導書", "魔法", "知識", "光る"], palette: "violet", accent: "#b68de8", category: "weapon" },
  { id: "magic_circle", name: "魔法陣", description: "大地に描かれた、光の紋様。", tags: ["魔法陣", "魔法", "紋様", "光る"], palette: "violet", accent: "#b68de8", category: "decor" },
  { id: "assault_rifle", name: "アサルトライフル", description: "現代の、頼れる戦闘武器。", tags: ["アサルトライフル", "銃", "近代", "武器"], palette: "iron", accent: "#c7cbd2", category: "weapon" },
  { id: "railgun", name: "レールガン", description: "電磁加速の、未来的な砲。", tags: ["レールガン", "電磁", "未来", "武器"], palette: "ice", accent: "#66e0ea", category: "weapon" },
  { id: "relic", name: "古代のレリック", description: "失われた文明の遺物。", tags: ["レリック", "古代", "遺物", "神秘"], palette: "warm", accent: "#f2cf7a", category: "decor" },
  { id: "spear", name: "豪華スピア", description: "装飾を極めた、華麗な槍。", tags: ["豪華スピア", "槍", "装飾", "豪華"], palette: "warm", accent: "#f2cf7a", category: "weapon" },
  { id: "mace", name: "メイス", description: "重厚な一撃を叩き込む戦鎚。", tags: ["メイス", "打撃", "重厚", "武器"], palette: "iron", accent: "#c7cbd2", category: "weapon" },
];

/** Order matters: specific motifs first, generic fallbacks last. */
export const KIND_RULES: [ModelKind, RegExp][] = [
  ["pickaxe", /ピッケル|ツルハシ|つるはし|pickaxe|\bpick\b/],
  ["chainsaw", /チェーンソー|チェーンソー|chainsaw|電気鋸|動力鋸/],
  ["drill", /ドリル|dri ll|drill|掘削機|ハンマードリル/],
  ["nailgun", /ネイルガン|釘打ち|ネイラー|nailgun|nail[ -]?gun/],
  ["circularsaw", /丸鋸|丸のこ|サーキュラーソー|circular[ -]?saw|チップソー/],
  ["flamethrower", /火炎放射器|火炎放射|フレームスロワー|flamethrower|火吹き/],
  ["jackhammer", /ジャックハンマー|ブレーカー|jackhammer|破砕機/],
  ["hammer", /ハンマー|hammer|戦槌|金槌/],
  ["scythe", /鎌|大鎌|scythe/],
  ["axe", /斧|\baxe\b|アックス/],
  ["shovel", /シャベル|ショベル|スコップ|shovel|spade/],
  ["sword", /剣|ソード|sword|blade|刀|セイバー|saber/],
  ["bow", /弓|\bbow\b|アーチェリー|archer/],
  ["staff", /杖|スタッフ|ワンド|\bstaff\b|\bwand\b/],
  ["trident", /トライデント|槍|trident|spear/],
  ["chest", /宝箱|チェスト|chest|箱|\bbox\b/],
  ["mushroom", /キノコ|きのこ|mushroom/],
  ["lantern", /ランタン|灯|lantern|lamp|照明/],
  ["house", /家|建築|house|建物|城|castle/],
  ["tree", /樹|\btree\b|forest|森|(^|\s)木(?=\s|$)/],
  ["robot", /ロボット|robot|機械|キャラクター/],
  ["crystal", /クリスタル|結晶|crystal|鉱石|\bgem\b/],
  ["sword", /武器|weapon/],
  ["spell_sword", /魔法の剣|魔剣|呪いの剣|血の剣|ブラッドソード/],
  ["enchanted_axe", /魔法の斧|エンチャント斧/],
  ["cursed_blade", /呪いの刃|呪われた|カースド|cursed/],
  ["soul_reaper", /魂刈り|ソウルリーパー|死神の鎌/],
  ["shadow_dagger", /影の短剣|シャドウ|影/],
  ["blood_sword", /血の剣|ブラッド|血まみれ|blood/],
  ["blood_axe", /血の斧|ブラッド斧/],
  ["grimoire", /魔導書|グリモア|魔法書|spellbook|grimoire/],
  ["magic_circle", /魔法陣|マジックサークル|magic circle/],
  ["assault_rifle", /アサルトライフル|ライフル|銃|rifle|gun|アサルト/],
  ["sniper_rifle", /スナイパー|狙撃|sniper/],
  ["pistol", /ピストル|拳銃|ハンドガン|pistol|handgun/],
  ["shotgun", /ショットガン|散弾銃|shotgun/],
  ["railgun", /レールガン|電磁砲|railgun/],
  ["relic", /レリック|遺物|レリク|relic|artifact/],
  ["spear", /豪華スピア|槍|スピア|spear/],
  ["mace", /メイス|戦鎚|mace/],
  ["pickaxe", /ツール|\btool\b|採掘/],
];
