import type { TargetEnv } from "./environment";

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
  env?: Partial<TargetEnv>;
}

export type ItemKind = "simple" | "sword" | "pickaxe" | "axe" | "shovel" | "armor";
export type ToolMaterial = "WOOD" | "STONE" | "IRON" | "GOLD" | "DIAMOND" | "NETHERITE";
export type ArmorMaterial = "LEATHER" | "COPPER" | "IRON" | "GOLD" | "DIAMOND" | "NETHERITE" | "CHAINMAIL" | "TURTLE" | "TURTLE_SCUTE" | "ARMADILLO_SCUTE";

export interface ItemDef {
  id: string;
  kind: ItemKind;
  material: ToolMaterial;
  attackDamage: number;
  attackSpeed: number;
  armorSlot: "HELMET" | "CHESTPLATE" | "LEGGINGS" | "BOOTS";
  armorMaterial: ArmorMaterial;
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
  /** materials[].id。攻撃力・採掘速度・耐久に倍率を適用 */
  materialId?: string;
  tooltip: string;
}

export interface OreDef {
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
  biomeTag?: string;
}

export interface SurfaceGenDef {
  biomeTag: string;
  rarity: number;
  tries: number;
  spread: number;
}

export interface BlockDef {
  id: string;
  customTexture?: string;
  ore?: OreDef | null;
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
  cooldown: number;
  manaCost: number;
  trigger: SkillTrigger;
  conditions: Condition[];
  actions: Action[];
}

export type RecipeType = "shaped" | "shapeless" | "smelting" | "blasting" | "smoking" | "campfire_cooking" | "stonecutting";

export interface RecipeDef {
  id: string;
  type: RecipeType;
  grid: string[];
  inputItem?: string;
  cookingExperience?: number;
  cookingTimeTicks?: number;
  resultItem: string;
  resultCount: number;
}
