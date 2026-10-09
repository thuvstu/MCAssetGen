export type ParamValue = string | number | boolean;
export type Params = Record<string, ParamValue>;

export interface ConditionRef {
  id: string;
  type: string;
  params: Params;
  negate?: boolean;
}

export interface SkillLine {
  id: string;
  mechanic: string;
  params: Params;
  targeter: string;
  targeterParams: Params;
  conditions: ConditionRef[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  cooldown: number; // seconds
  conditions: ConditionRef[]; // evaluated against caster
  lines: SkillLine[];
  imports: string; // extra imports for custom Kotlin (one FQCN per line)
}

export interface TriggerBinding {
  id: string;
  trigger: string;
  skill: string;
  interval?: number;
}

export type ItemKind = "basic" | "food" | "sword" | "pickaxe" | "axe" | "shovel" | "hoe" | "helmet" | "chestplate" | "leggings" | "boots";
export type ArmorMat = "LEATHER" | "CHAIN" | "IRON" | "GOLD" | "DIAMOND" | "NETHERITE" | "TURTLE";
export type ToolMaterial = "WOOD" | "STONE" | "IRON" | "GOLD" | "DIAMOND" | "NETHERITE";

export interface ModItem {
  id: string;
  registryName: string;
  displayName: string;
  kind: ItemKind;
  maxCount: number;
  material: ToolMaterial;
  attackDamage: number;
  attackSpeed: number;
  nutrition: number;
  saturation: number;
  alwaysEdible: boolean;
  fireproof: boolean;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC";
  glint: boolean;
  tooltip: string;
  useCooldown: number; // ticks
  armorMaterial?: ArmorMat;
  triggers: TriggerBinding[];
  /** attached PNG (dataURL) from texture studios; used in zip + moddev deploy instead of placeholder */
  texture?: string;
}

export interface ModBlock {
  id: string;
  registryName: string;
  displayName: string;
  hardness: number;
  resistance: number;
  sound: string;
  luminance: number;
  requiresTool: boolean;
  tool: "none" | "pickaxe" | "axe" | "shovel" | "hoe";
  toolLevel: "any" | "stone" | "iron" | "diamond";
  dropsSelf: boolean;
  dropItem?: string; // 鉱石: 指定時はこのアイテムをドロップ (幸運/シルクタッチ対応)
  dropMin?: number;
  dropMax?: number;
  oreGen?: { enabled: boolean; dimension: "overworld" | "nether" | "end"; veinSize: number; veinsPerChunk: number; minY: number; maxY: number };
  triggers: TriggerBinding[];
  /** attached PNG (dataURL) from texture studios; used in zip + moddev deploy instead of placeholder */
  texture?: string;
}

export interface MobSkill {
  id: string;
  entityType: string;
  trigger: string;
  skill: string;
  interval: number;
}

export interface GlobalEvent {
  id: string;
  trigger: string;
  skill: string;
  interval: number;
}

export interface ModCommand {
  id: string;
  name: string;
  skill: string;
  permissionLevel: number;
}

export interface ModMeta {
  modId: string;
  name: string;
  version: string;
  packageName: string;
  mainClass: string;
  authors: string;
  description: string;
  minecraftVersion: string;
  yarnMappings: string;
  loaderVersion: string;
  fabricVersion: string;
  fabricKotlinVersion: string;
  kotlinVersion: string;
  loomVersion: string;
  gradleVersion: string;
}

export interface ModProject {
  meta: ModMeta;
  items: ModItem[];
  blocks: ModBlock[];
  skills: Skill[];
  mobSkills: MobSkill[];
  events: GlobalEvent[];
  commands: ModCommand[];
  mobs: ModMob[];
  recipes: ModRecipe[];
}

export type Severity = "error" | "warning" | "info";

export interface Diagnostic {
  severity: Severity;
  message: string;
  file?: string;
  line?: number;
  col?: number;
  source: "model" | "kotlin";
  location?: string; // human readable location in editor (e.g. "スキル fireball / 行 2")
  fix?: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: "kotlin" | "json" | "gradle" | "properties" | "markdown" | "yaml" | "text";
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface MobDrop {
  id: string;
  item: string;
  min: number;
  max: number;
  chance: number; // 0..1
}

export interface MobEffect {
  id: string;
  type: string;
  level: number;
}

export interface ModMob {
  id: string;
  name: string; // internal id (MythicMobs internal name)
  displayName: string;
  baseType: string; // minecraft:zombie
  health: number;
  damage: number;
  speedMultiplier: number;
  armor: number;
  knockbackResistance: number;
  showName: boolean;
  glowing: boolean;
  persistent: boolean;
  silent: boolean;
  equipment: { mainhand: string; offhand: string; head: string; chest: string; legs: string; feet: string };
  effects: MobEffect[];
  drops: MobDrop[];
  xp: number;
  naturalSpawn: boolean;
  spawnChance: number; // replace chance 0..1
  triggers: TriggerBinding[];
}

export type RecipeType = "shaped" | "shapeless" | "smelting" | "blasting" | "smoking" | "campfire_cooking" | "stonecutting";

export interface ModRecipe {
  id: string;
  name: string;
  type: RecipeType;
  grid: string[]; // 9 cells (item ids or "") for shaped/shapeless
  input: string; // for cooking / stonecutting
  result: string;
  count: number;
  experience: number;
  cookingTime: number;
}
