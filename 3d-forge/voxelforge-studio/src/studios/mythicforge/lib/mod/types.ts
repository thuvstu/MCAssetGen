export type ParamValue = string | number | boolean;

export interface ModMeta {
  modId: string;
  name: string;
  version: string;
  author: string;
  description: string;
  packageName: string;
  license: string;
  /** ビルド環境 (未保存の古いプロジェクトは 1.21.1 / Yarn として扱う) */
  env?: Partial<import("./targets").TargetEnv>;
}

export type ItemKind = "simple" | "sword" | "pickaxe" | "axe" | "shovel" | "armor";

export interface ItemDef {
  id: string;
  kind: ItemKind;
  material: "WOOD" | "STONE" | "IRON" | "GOLD" | "DIAMOND" | "NETHERITE";
  attackDamage: number;
  attackSpeed: number;
  armorSlot: "HELMET" | "CHESTPLATE" | "LEGGINGS" | "BOOTS";
  armorMaterial: "LEATHER" | "IRON" | "GOLD" | "DIAMOND" | "NETHERITE" | "CHAINMAIL" | "TURTLE";
  /** アップロードしたPNG (data URL)。未設定ならバニラのテクスチャを参照 */
  customTexture?: string;
  bonusMaxHealth?: number;
  bonusMovementSpeed?: number;
  bonusArmor?: number;
  bonusToughness?: number;
  bonusKnockbackResistance?: number;
  name: string;
  texture: string;
  model: "generated" | "handheld";
  maxCount: number;
  durability: number;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC";
  fireproof: boolean;
  glint: boolean;
  food: { nutrition: number; saturation: number } | null;
  skillId: string | null;
  shiftSkillId?: string | null;
  leftClickSkillId?: string | null;
  customModelJson?: string;
  /** 素材 (materials[].id)。攻撃力・採掘速度・耐久に倍率を適用 */
  materialId?: string;
  tooltip: string;
}

export interface OreDef {
  /** "" = 鉱石ブロック自身をドロップ */
  dropItem: string;
  dropMin: number;
  dropMax: number;
  fortune: boolean;
  silkTouch: boolean;
  explosionDecay: boolean;
  xpMin: number;
  xpMax: number;
  dimension: "OVERWORLD" | "NETHER" | "END";
  veinSize: number;
  veinsPerChunk: number;
  minY: number;
  maxY: number;
  /** 生成するバイオームのタグ (例: minecraft:is_forest)。空 = 全バイオーム */
  biomeTag?: string;
}

/** 地表クラスター生成 (random_patch): バイオーム指定でブロックを地表に群生させる */
export interface SurfaceGenDef {
  biomeTag: string;
  /** 1/N チャンクで試行 (大きいほど珍しい) */
  rarity: number;
  tries: number;
  spread: number;
}

export interface BlockDef {
  id: string;
  customTexture?: string;
  /** 鉱石設定 (null = 通常ブロック) */
  ore?: OreDef | null;
  /** 地表クラスター生成 (null = なし) */
  surface?: SurfaceGenDef | null;
  name: string;
  texture: string;
  hardness: number;
  resistance: number;
  luminance: number;
  sound: string;
  tool: "none" | "pickaxe" | "axe" | "shovel" | "hoe";
  toolTier: "none" | "stone" | "iron" | "diamond";
  requiresTool: boolean;
  skillId: string | null;
  shiftSkillId?: string | null;
}

export interface Action {
  uid: string;
  type: string;
  params: Record<string, ParamValue>;
  children?: Action[];
}


export interface Condition {
  uid: string;
  type: string;
  value: string;
}

export interface SkillTrigger {
  type: "MANUAL" | "ATTACK_ENTITY" | "KILL_ENTITY" | "BREAK_BLOCK" | "TAKE_DAMAGE" | "PLAYER_JOIN" | "PERIODIC" | "WEAR" | "SWING" | "DEATH";
  intervalSec: number;
  heldItem: string;
}

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  cooldown: number; // seconds
  manaCost: number;
  trigger: SkillTrigger;
  conditions: Condition[];
  actions: Action[];
}

export type RecipeType = "shaped" | "shapeless" | "smelting" | "blasting" | "smoking" | "campfire_cooking" | "stonecutting";

export interface RecipeDef {
  id: string;
  type: RecipeType;
  grid: string[]; // 9 entries, item ids ("" = empty)
  inputItem?: string;
  cookingExperience?: number;
  cookingTimeTicks?: number;
  resultItem: string;
  resultCount: number;
}

export interface MobDef {
  id: string;
  name: string;
  baseMob: string; // e.g., ZOMBIE, SKELETON
  maxHealth: number;
  movementSpeed: number;
  attackDamage: number;
  drops: { item: string; countMin: number; countMax: number; chance: number }[];
  behavior: "hostile" | "neutral" | "passive";
  wearableArmorId?: string;
  spawnBiomes?: string[];
  spawnChance?: number;
  /** GeckoLib の置き換えレンダラ + geo/animation アセットを生成する */
  geckolib?: boolean;
  /** 追加スケール (未使用なら 1) */
  scale?: number;
}

export interface DropRule {
  id: string;
  name: string;
  targetMob: string; // "ANY" or vanilla mob type like "minecraft:zombie", "mymod:blood_slime"
  items: { id: string; min: number; max: number; chance: number; nbt?: string }[];
}

export interface MaterialDef {
  id: string;
  name: string;
  baseMaterial: string; // IRON, DIAMOND, etc.
  damageMultiplier: number;
  speedMultiplier: number;
  durabilityMultiplier: number;
  description: string;
}

export interface ShopTrade {
  id: string;
  offerItem: string;
  offerCount: number;
  requiredItem1: string;
  requiredCount1: number;
  requiredItem2: string;
  requiredCount2: number;
}

export interface ShopDef {
  id: string;
  name: string;
  trades: ShopTrade[];
  openedByBlockId?: string; // Block ID that opens this shop via UI
}

export interface SkillPointDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: "INCREASE_MAX_HEALTH" | "INCREASE_MAX_MANA" | "INCREASE_DAMAGE" | "INCREASE_DEFENSE" | "INCREASE_SPEED" | "INCREASE_LUCK";
  amount: number;
}

/** カスタムステータス効果 (トーテム風の復活・毎tickスキル発動に対応) */
export interface CustomEffectDef {
  id: string;
  name: string;
  /** #RRGGBB */
  color: string;
  category: "BENEFICIAL" | "HARMFUL" | "NEUTRAL";
  /** 効果中に一定間隔で発動するスキル (プレイヤーのみ) */
  tickSkillId: string;
  intervalTicks: number;
  /** 致死ダメージを受けた時に効果を消費して復活 (不死のトーテム風) */
  revive: boolean;
  reviveHealth: number;
  /** 復活時に発動するスキル */
  reviveSkillId: string;
}

export interface AdvancementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  frame: "task" | "goal" | "challenge";
  /** 空 = このModのルートタブ直下。他の実績IDも指定可 */
  parent: string;
  kind: "MANUAL" | "OBTAIN_ITEM" | "KILL_MOB";
  item: string;
  mob: string;
  /** 進捗の段数 (MANUAL / KILL_MOB)。実績画面に n/N と表示される */
  steps: number;
  rewardXp: number;
  hidden: boolean;
}

export interface ModProject {
  meta: ModMeta;
  mana: { max: number; regenPerSecond: number };
  items: ItemDef[];
  blocks: BlockDef[];
  skills: SkillDef[];
  recipes: RecipeDef[];
  mobs: MobDef[];
  drops: DropRule[];
  materials: MaterialDef[];
  effects: CustomEffectDef[];
  advancements: AdvancementDef[];
  shops: ShopDef[];
  skillPoints: SkillPointDef[];
  customImports: string;
  config: { maxMana: number; regenPerSecond: number; hud: boolean; slots: string[]; slotKeys: number[] };
}

export type Severity = "error" | "warning" | "info";

export interface Diagnostic {
  file: string;
  line: number;
  col: number;
  severity: Severity;
  code: string;
  message: string;
  fix?: { kind: "addImport"; fqn: string };
}

export interface GeneratedFile {
  path: string;
  content: string;
  kind: "kotlin" | "json" | "gradle" | "text" | "binary";
  /** "base64" の場合 content はバイナリ(PNG/JARなど)のbase64 */
  encoding?: "base64";
  /** ZIP内で実行権限(755)を付与 (gradlew) */
  executable?: boolean;
}
