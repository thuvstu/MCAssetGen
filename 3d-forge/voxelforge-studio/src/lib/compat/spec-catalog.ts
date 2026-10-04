// ============================================================================
// VOXELFORGE — Model specification types, labels, colour presets, defaults
// ============================================================================

// --- Model types ------------------------------------------------------------
export type ModelType =
  | "sword"
  | "staff"
  | "bow"
  | "shield"
  | "armor"
  | "axe"
  | "trident"
  | "dagger"
  | "tome"
  | "amulet"
  | "chainsaw"
  | "gun"
  | "railgun"
  | "relic"
  | "spear"
  | "mace"
  | "scythe"
  | "wand"
  | "crossbow"
  | "cannon"
  | "grimoire"
  | "mechblade"
  | "bloodblade";

export const MODEL_TYPE_LABELS: Record<ModelType, string> = {
  sword: "剣",
  staff: "杖",
  bow: "弓",
  shield: "盾",
  armor: "防具",
  axe: "斧",
  trident: "銛",
  dagger: "短剣",
  tome: "魔導書",
  amulet: "護符",
  chainsaw: "チェーンソー",
  gun: "銃",
  railgun: "レールガン",
  relic: "レリック",
  spear: "装飾槍",
  mace: "メイス",
  scythe: "大鎌",
  wand: "魔杖",
  crossbow: "クロスボウ",
  cannon: "大砲",
  grimoire: "魔導書陣",
  mechblade: "機械剣",
  bloodblade: "血剣",
};

export const MODEL_TYPE_ICONS: Record<ModelType, string> = {
  sword: "⚔️",
  staff: "🪄",
  bow: "🏹",
  shield: "🛡️",
  armor: "🦺",
  axe: "🪓",
  trident: "🔱",
  dagger: "🗡️",
  tome: "📖",
  amulet: "🔮",
  chainsaw: "🪚",
  gun: "🔫",
  railgun: "⚡",
  relic: "📿",
  spear: "🗡️",
  mace: "🔨",
  scythe: "☠️",
  wand: "✨",
  crossbow: "🏹",
  cannon: "💣",
  grimoire: "📜",
  mechblade: "⚙️",
  bloodblade: "🩸",
};

export const MODEL_CATEGORIES: { id: string; label: string; types: ModelType[] }[] = [
  { id: "all", label: "全て", types: [] },
  { id: "melee", label: "近接", types: ["sword", "axe", "dagger", "mace", "spear", "scythe", "trident", "mechblade", "bloodblade", "chainsaw"] },
  { id: "magic", label: "魔法", types: ["staff", "wand", "tome", "grimoire", "amulet", "relic"] },
  { id: "ranged", label: "遠隔", types: ["bow", "crossbow", "gun", "railgun", "cannon"] },
  { id: "modern", label: "近代/機械", types: ["chainsaw", "gun", "railgun", "cannon", "mechblade"] },
  { id: "cursed", label: "禍々/血", types: ["scythe", "bloodblade", "relic", "grimoire"] },
  { id: "defense", label: "防具", types: ["shield", "armor"] },
];

// --- Magic systems (14) -----------------------------------------------------
export type MagicSystem =
  | "fire"
  | "ice"
  | "lightning"
  | "void"
  | "nature"
  | "arcane"
  | "light"
  | "water"
  | "dark"
  | "poison"
  | "holy"
  | "chaos"
  | "blood"
  | "crystal";

export const MAGIC_LABELS: Record<MagicSystem, string> = {
  fire: "炎",
  ice: "氷",
  lightning: "稲妻",
  void: "虚空",
  nature: "自然",
  arcane: "秘術",
  light: "光",
  water: "水",
  dark: "闇",
  poison: "毒",
  holy: "聖",
  chaos: "混沌",
  blood: "血",
  crystal: "水晶",
};

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
}

export const MAGIC_THEMES: Record<MagicSystem, ThemeColors> = {
  fire: { primary: "#b8341f", secondary: "#7d1f14", accent: "#ff7a1a", glow: "#ffb347" },
  ice: { primary: "#4fa8c9", secondary: "#2b5d77", accent: "#9fe8ff", glow: "#d6f6ff" },
  lightning: { primary: "#b8952c", secondary: "#6b5416", accent: "#ffe94f", glow: "#fff6b0" },
  void: { primary: "#4a3573", secondary: "#2a1d47", accent: "#a06bff", glow: "#d3b3ff" },
  nature: { primary: "#4d7c35", secondary: "#2e4d20", accent: "#8fd14f", glow: "#d9f2a7" },
  arcane: { primary: "#8f4f8f", secondary: "#57305a", accent: "#e08fff", glow: "#ffc4f5" },
  light: { primary: "#c9a227", secondary: "#8a6d1a", accent: "#ffe98a", glow: "#fff7cf" },
  water: { primary: "#2f6f9f", secondary: "#1c4563", accent: "#5cc8ff", glow: "#b3ecff" },
  dark: { primary: "#4a4a52", secondary: "#2b2b31", accent: "#c43b3b", glow: "#ff8a8a" },
  poison: { primary: "#5c7a2b", secondary: "#37491a", accent: "#b6e52c", glow: "#e2ff7a" },
  holy: { primary: "#e8e0d0", secondary: "#b8a88a", accent: "#fff4cc", glow: "#fffcf0" },
  chaos: { primary: "#8a3f5a", secondary: "#4a1f3a", accent: "#e05aff", glow: "#ffb0e8" },
  blood: { primary: "#7a1a1a", secondary: "#4a0e0e", accent: "#ff2a2a", glow: "#ff8a8a" },
  crystal: { primary: "#7a5acc", secondary: "#4a3080", accent: "#d0a8ff", glow: "#f0d8ff" },
};

// --- Floating modes (8) -----------------------------------------------------
export type FloatingMode = "none" | "orb" | "shards" | "ring" | "satellite" | "cascade" | "vortex" | "orbit";

export const FLOATING_LABELS: Record<FloatingMode, string> = {
  none: "なし",
  orb: "オーブ",
  shards: "破片群",
  ring: "回転リング",
  satellite: "衛星座",
  cascade: "滝落下",
  vortex: "渦巻",
  orbit: "多重軌道",
};

// --- Animation modes (7) ----------------------------------------------------
export type AnimationMode = "none" | "spin" | "bob" | "sway" | "pulse" | "breathe" | "thrum" | "orbit" | "flicker" | "whirl" | "slash";

export const ANIMATION_LABELS: Record<AnimationMode, string> = {
  none: "なし",
  spin: "回転",
  bob: "浮遊",
  sway: "揺らめき",
  pulse: "脈動",
  breathe: "呼吸",
  thrum: "震動",
  orbit: "周回",
  flicker: "点滅",
  whirl: "旋風",
  slash: "斬閃",
};

// --- Particle kinds (12) ----------------------------------------------------
export type ParticleKind =
  | "none"
  | "embers"
  | "snow"
  | "sparks"
  | "runes"
  | "petals"
  | "bubbles"
  | "dust"
  | "souls"
  | "slime"
  | "smoke"
  | "stardust"
  | "blood"
  | "oil"
  | "glyphs"
  | "shrapnel";

export const PARTICLE_LABELS: Record<ParticleKind, string> = {
  none: "なし",
  embers: "火の粉",
  snow: "雪",
  sparks: "火花",
  runes: "符文",
  petals: "花びら",
  bubbles: "気泡",
  dust: "塵",
  souls: "魂魄",
  slime: "粘液",
  smoke: "煙",
  stardust: "星屑",
  blood: "血飛沫",
  oil: "油滴",
  glyphs: "魔紋",
  shrapnel: "破片弾",
};

// --- Decorations (16) --------------------------------------------------------
export type Decoration =
  | "gem"
  | "runes"
  | "ribbon"
  | "chain"
  | "spikes"
  | "wings"
  | "halo"
  | "crown"
  | "scales"
  | "thorns"
  | "prongs"
  | "hood"
  | "shoulder"
  | "tassels"
  | "claws"
  | "fangs"
  | "gears"
  | "pipes"
  | "circuits"
  | "bloodDrips"
  | "bones"
  | "sigils"
  | "feathers"
  | "bolts";

export const DECORATION_LABELS: Record<Decoration, string> = {
  gem: "宝石",
  runes: "符文",
  ribbon: "リボン",
  chain: "鎖",
  spikes: "棘",
  wings: "翼",
  halo: "光輪",
  crown: "冠",
  scales: "鱗",
  thorns: "茨棘",
  prongs: "爪飾",
  hood: "兜頭巾",
  shoulder: "肩飾",
  tassels: "房飾",
  claws: "鉤爪",
  fangs: "牙飾",
  gears: "歯車",
  pipes: "パイプ",
  circuits: "回路",
  bloodDrips: "血垂",
  bones: "骨飾",
  sigils: "魔印",
  feathers: "羽根",
  bolts: "ボルト",
};

// --- Aura / trail effects (6) -----------------------------------------------
export type AuraKind = "none" | "flame" | "frost" | "voidField" | "lightRays" | "shadowSmoke" | "prismatic" | "bloodMist" | "machineHeat" | "curseVeil" | "magicCircle";

export const AURA_LABELS: Record<AuraKind, string> = {
  none: "なし",
  flame: "炎オーラ",
  frost: "霜オーラ",
  voidField: "虚空フィールド",
  lightRays: "聖光線",
  shadowSmoke: "闇煙",
  prismatic: "プリズマ",
  bloodMist: "血霧",
  machineHeat: "排熱",
  curseVeil: "呪幕",
  magicCircle: "魔法陣",
};

export type TrailKind = "none" | "sparkle" | "fireTrail" | "iceTrail" | "darkTrail" | "leafTrail" | "phantom" | "afterimage" | "bloodTrail" | "railBeam" | "sawDust";

export const TRAIL_LABELS: Record<TrailKind, string> = {
  none: "なし",
  sparkle: "きらめき",
  fireTrail: "炎尾",
  iceTrail: "氷尾",
  darkTrail: "闇尾",
  leafTrail: "葉尾",
  phantom: "幻影残像",
  afterimage: "分身残影",
  bloodTrail: "血尾",
  railBeam: "レール光",
  sawDust: "鋸屑",
};

// --- Phantom afterimages (幻影分身) -------------------------------------------
export type PhantomKind = "none" | "mirror" | "spiral" | "orbit";
export const PHANTOM_LABELS: Record<PhantomKind, string> = {
  none: "なし",
  mirror: "鏡像",
  spiral: "螺旋分身",
  orbit: "円環分身",
};

// --- Style presets (17) -----------------------------------------------------
export type StylePreset =
  | "royal"
  | "nether"
  | "forest"
  | "ocean"
  | "celestial"
  | "voidwalker"
  | "storm"
  | "bone"
  | "crystal"
  | "blood"
  | "frost"
  | "eclipse"
  | "infernal"
  | "jade"
  | "cosmic"
  | "ancient"
  | "holy"
  | "mechanical"
  | "cursed"
  | "relic"
  | "modern"
  | "gore";

export const STYLE_PRESETS: Record<
  StylePreset,
  { label: string; blurb: string; magic: MagicSystem; apply: (s: ModelSpec) => void }
> = {
  royal: {
    label: "王家",
    blurb: "黄金 + 深緑の格式",
    magic: "light",
    apply: (s) => {
      s.primaryColor = "#3d6b35"; s.secondaryColor = "#1e3a1a"; s.accentColor = "#f5c542";
      s.glowColor = "#fff3c4"; s.handleColor = "#5a3a22"; s.gemColor = "#e03535";
    },
  },
  nether: {
    label: "ネザー",
    blurb: "黒曜石 + 獄炎",
    magic: "fire",
    apply: (s) => {
      s.primaryColor = "#2a2230"; s.secondaryColor = "#161021"; s.accentColor = "#ff5a2a";
      s.glowColor = "#ffab5e"; s.handleColor = "#3d2b1f"; s.gemColor = "#ffd24a";
    },
  },
  forest: {
    label: "森",
    blurb: "苔むす + 枝",
    magic: "nature",
    apply: (s) => {
      s.primaryColor = "#5a4a2a"; s.secondaryColor = "#3a2f1a"; s.accentColor = "#7ddb4a";
      s.glowColor = "#c8ff9e"; s.handleColor = "#4a3320"; s.gemColor = "#66e0c8";
    },
  },
  ocean: {
    label: "深海",
    blurb: "深海石 + 潮光",
    magic: "water",
    apply: (s) => {
      s.primaryColor = "#2f4f6f"; s.secondaryColor = "#1c3049"; s.accentColor = "#4fc8e8";
      s.glowColor = "#b3f0ff"; s.handleColor = "#37455a"; s.gemColor = "#7af0d4";
    },
  },
  celestial: {
    label: "天界",
    blurb: "ダイヤ + 黄金",
    magic: "light",
    apply: (s) => {
      s.primaryColor = "#e8e8f0"; s.secondaryColor = "#a8b0c8"; s.accentColor = "#ffe98a";
      s.glowColor = "#fffbe0"; s.handleColor = "#6a5a8a"; s.gemColor = "#7af0ff";
    },
  },
  voidwalker: {
    label: "虚歩",
    blurb: "黒曜 + エンダー紫",
    magic: "void",
    apply: (s) => {
      s.primaryColor = "#241f33"; s.secondaryColor = "#12101d"; s.accentColor = "#9a5cff";
      s.glowColor = "#cfa8ff"; s.handleColor = "#1e1a2b"; s.gemColor = "#35e0c8";
    },
  },
  storm: {
    label: "嵐",
    blurb: "金床 + 稲妻",
    magic: "lightning",
    apply: (s) => {
      s.primaryColor = "#3a3f4a"; s.secondaryColor = "#23262e"; s.accentColor = "#ffe94f";
      s.glowColor = "#fff6b0"; s.handleColor = "#4a3a28"; s.gemColor = "#5cc8ff";
    },
  },
  bone: {
    label: "骨",
    blurb: "骨 + 血",
    magic: "dark",
    apply: (s) => {
      s.primaryColor = "#d8cfb8"; s.secondaryColor = "#a89a7c"; s.accentColor = "#c43b3b";
      s.glowColor = "#ffd9a8"; s.handleColor = "#3d2f28"; s.gemColor = "#6aff9e";
    },
  },
  crystal: {
    label: "水晶",
    blurb: "プリズム色 + ガラス質",
    magic: "crystal",
    apply: (s) => {
      s.primaryColor = "#6a3aaa"; s.secondaryColor = "#4a2070"; s.accentColor = "#d0a8ff";
      s.glowColor = "#f0d8ff"; s.handleColor = "#3a2860"; s.gemColor = "#ff88cc";
    },
  },
  blood: {
    label: "血染",
    blurb: "深紅 + 黒鉄",
    magic: "blood",
    apply: (s) => {
      s.primaryColor = "#5a1a1a"; s.secondaryColor = "#2a0a0a"; s.accentColor = "#ff2a2a";
      s.glowColor = "#ff8a8a"; s.handleColor = "#3d2020"; s.gemColor = "#ff4444";
    },
  },
  frost: {
    label: "凍結",
    blurb: "氷 + 白銀",
    magic: "ice",
    apply: (s) => {
      s.primaryColor = "#8ab8cc"; s.secondaryColor = "#5a809a"; s.accentColor = "#c8eeff";
      s.glowColor = "#e8f8ff"; s.handleColor = "#607888"; s.gemColor = "#a0e0ff";
    },
  },
  eclipse: {
    label: "蝕",
    blurb: "闇紫 + 薄暮オレンジ",
    magic: "dark",
    apply: (s) => {
      s.primaryColor = "#2a1a3a"; s.secondaryColor = "#18102a"; s.accentColor = "#e87830";
      s.glowColor = "#ffc060"; s.handleColor = "#2a1830"; s.gemColor = "#c040a0";
    },
  },
  infernal: {
    label: "地獄",
    blurb: "溶岩 + 黒曜石",
    magic: "fire",
    apply: (s) => {
      s.primaryColor = "#1a0a0a"; s.secondaryColor = "#0a0404"; s.accentColor = "#ff3300";
      s.glowColor = "#ff6600"; s.handleColor = "#2a1208"; s.gemColor = "#ff8800";
    },
  },
  jade: {
    label: "翡翠",
    blurb: "翡翠 + 金糸",
    magic: "nature",
    apply: (s) => {
      s.primaryColor = "#2a6a4a"; s.secondaryColor = "#1a4a30"; s.accentColor = "#60d8a0";
      s.glowColor = "#a0ffc0"; s.handleColor = "#3a5a3a"; s.gemColor = "#ffd060";
    },
  },
  cosmic: {
    label: "星宙",
    blurb: "深碧 + 星屑紫",
    magic: "void",
    apply: (s) => {
      s.primaryColor = "#0a1a4a"; s.secondaryColor = "#060e2a"; s.accentColor = "#6a80ff";
      s.glowColor = "#a0b8ff"; s.handleColor = "#1a2040"; s.gemColor = "#ff60a0";
    },
  },
  ancient: {
    label: "古代",
    blurb: "砂岩 + 緑青",
    magic: "arcane",
    apply: (s) => {
      s.primaryColor = "#8a7a5a"; s.secondaryColor = "#5a4a30"; s.accentColor = "#60b8a0";
      s.glowColor = "#a0e8d0"; s.handleColor = "#6a5a3a"; s.gemColor = "#c0a060";
    },
  },
  holy: {
    label: "聖別",
    blurb: "白金 + 聖光",
    magic: "holy",
    apply: (s) => {
      s.primaryColor = "#e8e0d0"; s.secondaryColor = "#b8a88a"; s.accentColor = "#fff4cc";
      s.glowColor = "#fffcf0"; s.handleColor = "#8a7a5a"; s.gemColor = "#ffe080";
    },
  },
  mechanical: {
    label: "機械",
    blurb: "鉄鋼 + 警告黄",
    magic: "lightning",
    apply: (s) => {
      s.primaryColor = "#5a6068"; s.secondaryColor = "#2a3038"; s.accentColor = "#ffcc33";
      s.glowColor = "#ffe080"; s.handleColor = "#3a3a40"; s.gemColor = "#44ddff";
    },
  },
  cursed: {
    label: "呪詛",
    blurb: "黒緑 + 病んだ紫",
    magic: "dark",
    apply: (s) => {
      s.primaryColor = "#1a2418"; s.secondaryColor = "#0c100c"; s.accentColor = "#6a3080";
      s.glowColor = "#a050c0"; s.handleColor = "#241818"; s.gemColor = "#80ff40";
    },
  },
  relic: {
    label: "遺物",
    blurb: "錆金 + 古代碧",
    magic: "arcane",
    apply: (s) => {
      s.primaryColor = "#8a6a38"; s.secondaryColor = "#5a4020"; s.accentColor = "#40c8a0";
      s.glowColor = "#a0ffe0"; s.handleColor = "#4a3820"; s.gemColor = "#ffd070";
    },
  },
  modern: {
    label: "近代",
    blurb: "ポリマー黒 + サイト赤",
    magic: "fire",
    apply: (s) => {
      s.primaryColor = "#2a2c30"; s.secondaryColor = "#141518"; s.accentColor = "#ff3030";
      s.glowColor = "#ff8080"; s.handleColor = "#1c1c20"; s.gemColor = "#40a0ff";
    },
  },
  gore: {
    label: "血肉",
    blurb: "生肉 + 凝血",
    magic: "blood",
    apply: (s) => {
      s.primaryColor = "#6a2020"; s.secondaryColor = "#3a1010"; s.accentColor = "#ff2040";
      s.glowColor = "#ff7080"; s.handleColor = "#4a1818"; s.gemColor = "#ff1010";
    },
  },
};

// --- Main spec interface ----------------------------------------------------
export interface ModelSpec {
  version: 1;
  name: string;
  seed: number;
  type: ModelType;
  magic: MagicSystem;
  scale: number;
  length: number;
  width: number;
  detail: number;
  blockiness: number;
  stylePreset: StylePreset;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowColor: string;
  handleColor: string;
  gemColor: string;
  decorations: Decoration[];
  floating: FloatingMode;
  animation: AnimationMode;
  particles: ParticleKind;
  aura: AuraKind;
  trail: TrailKind;
  glowIntensity: number;
  textureNoise: number;
  texturePattern: TexturePattern;
  // enhancement (段階強化 / 限界突破 / 形態変化)
  tier: Tier;
  limitBreak: LimitBreak;
  morph: MorphKind;
  // phantom effect (幻影分身)
  phantom: PhantomKind;
}

export type TexturePattern =
  | "noise"
  | "brick"
  | "gradient"
  | "checker"
  | "crosshatch"
  | "radial"
  | "stripe"
  | "bloodDrip"
  | "metallic"
  | "flow"
  | "dual";

export const TEXTURE_PATTERN_LABELS: Record<TexturePattern, string> = {
  noise: "ノイズ",
  brick: "レンガ",
  gradient: "縦グラデ",
  checker: "格子",
  crosshatch: "クロス",
  radial: "放射グラデ",
  stripe: "縞グラデ",
  bloodDrip: "血垂れ",
  metallic: "金属",
  flow: "魔力流",
  dual: "二色グラデ",
};

// --- Enhancement tiers (段階強化) --------------------------------------------
export type Tier = 1 | 2 | 3 | 4;
export const TIER_LABELS: Record<Tier, string> = {
  1: "T1 通常",
  2: "T2 強化",
  3: "T3 極",
  4: "T4 神化",
};
export const TIER_BLURBS: Record<Tier, string> = {
  1: "基本形態。素朴だが確実。",
  2: "魔力帯が一周、符文が追加される。",
  3: "光翼と奥のオーラが生じる。",
  4: "光環 + 飛翔棘。完成された武器。",
};

// --- Limit break (限界突破) ---------------------------------------------------
export type LimitBreak = 0 | 1 | 2 | 3;
export const LIMIT_BREAK_LABELS: Record<LimitBreak, string> = {
  0: "未突破",
  1: "LB1",
  2: "LB2",
  3: "LB3",
};
export const LIMIT_BREAK_BLURBS: Record<LimitBreak, string> = {
  0: "本来の姿。",
  1: "魔力コアと周回結晶が出現。",
  2: "光翼 + 螺旋オーラを追加、色味が過充電する。",
  3: "完全解放。多重光環・光柱・粒子嵐。",
};

// --- Morph forms (形態変化) ---------------------------------------------------
export type MorphKind = "standard" | "great" | "fragment" | "twin";
export const MORPH_LABELS: Record<MorphKind, string> = {
  standard: "通常形態",
  great: "巨化形態",
  fragment: "分裂形態",
  twin: "双剣形態",
};
export const MORPH_BLURBS: Record<MorphKind, string> = {
  standard: "デフォルトの形状。",
  great: "刃部を 1.5 倍に肥大化させる。",
  fragment: "刃が 3 枚に分裂し浮遊する。",
  twin: "副刃が追加され双剣化する。",
};

// --- Temporary modes (一時モード) ---------------------------------------------
export type ModeKind = "idle" | "charge" | "focus";
export const MODE_LABELS: Record<ModeKind, string> = {
  idle: "通常",
  charge: "蓄積",
  focus: "集中",
};

// --- Action animations (攻撃 / 発動) -------------------------------------------
export type ActionKind = "attack" | "cast";
export const ACTION_LABELS: Record<ActionKind, string> = {
  attack: "斬撃",
  cast: "詠唱",
};

// Magic -> fitting particle / aura for set generation
export const MAGIC_PARTICLES: Record<MagicSystem, ParticleKind> = {
  fire: "embers", ice: "snow", lightning: "sparks", void: "souls", nature: "petals",
  arcane: "runes", light: "stardust", water: "bubbles", dark: "smoke", poison: "slime",
  holy: "stardust", chaos: "souls", blood: "smoke", crystal: "stardust",
};
export const MAGIC_AURAS: Record<MagicSystem, AuraKind> = {
  fire: "flame", ice: "frost", lightning: "prismatic", void: "voidField", nature: "prismatic",
  arcane: "voidField", light: "lightRays", water: "frost", dark: "shadowSmoke", poison: "shadowSmoke",
  holy: "lightRays", chaos: "prismatic", blood: "shadowSmoke", crystal: "lightRays",
};

// --- Defaults ---------------------------------------------------------------
export function defaultSpec(): ModelSpec {
  return {
    version: 1,
    name: "無名の武具",
    seed: 20250101,
    type: "sword",
    magic: "fire",
    scale: 0.5,
    length: 0.5,
    width: 0.5,
    detail: 0.5,
    blockiness: 0.5,
    stylePreset: "royal",
    primaryColor: "#3d6b35",
    secondaryColor: "#1e3a1a",
    accentColor: "#f5c542",
    glowColor: "#fff3c4",
    handleColor: "#5a3a22",
    gemColor: "#e03535",
    decorations: ["gem", "runes"],
    floating: "shards",
    animation: "bob",
    particles: "embers",
    aura: "none",
    trail: "none",
    glowIntensity: 0.5,
    textureNoise: 0.5,
    texturePattern: "noise",
    tier: 1,
    limitBreak: 0,
    morph: "standard",
    phantom: "none",
  };
}