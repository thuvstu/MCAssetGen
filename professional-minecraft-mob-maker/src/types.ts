export type ArchetypeId =
  | "humanoid"
  | "quadruped"
  | "flying"
  | "aquatic"
  | "arachnid"
  | "slime"
  | "serpent"
  | "golem"
  | "multi"
  | "tube"
  | "caster"
  | "boss";

export type Temperament = "hostile" | "neutral" | "passive";
export type Category =
  | "monster"
  | "creature"
  | "ambient"
  | "water_creature"
  | "water_ambient"
  | "misc";
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type ColorSlot = "primary" | "secondary" | "accent" | "skin" | "eye" | "detail";
export type ParticleId =
  | "none"
  | "flame"
  | "soul"
  | "enchant"
  | "spore"
  | "drip"
  | "ash"
  | "electric"
  | "cherry"
  | "note";
export type AnimKind = "none" | "bob" | "swing" | "flap" | "wag" | "look" | "pulse" | "wave";
export type Axis = "x" | "y" | "z";
export type Motion = "ground" | "hover" | "swim" | "squash";
export type Vec3 = [number, number, number];
export type TimeOfDay = "any" | "day" | "night";
export type Weather = "any" | "rain" | "clear";

export interface Colors {
  primary: string;
  secondary: string;
  accent: string;
  skin: string;
  eye: string;
  detail: string;
}

export interface PartDef {
  id: string;
  name: string;
  optional: boolean;
  defaultOn: boolean;
  origin: Vec3;
  size: Vec3;
  pivot: Vec3;
  rotation: Vec3;
  slot: ColorSlot;
  anim: AnimKind;
  phase: number;
  axis: Axis;
  amp: number;
  opacity: number;
  group: "head" | "body" | "arm" | "leg" | "wing" | "tail" | "extra";
  /** Follow this part's rotation (and its parents). */
  attach?: string;
}

export interface VariantDef {
  id: string;
  name: string;
  blurb: string;
  scale: number;
  enable: string[];
  disable: string[];
  partScale: Record<string, Vec3>;
}

export interface StatBlock {
  health: number;
  armor: number;
  armorToughness: number;
  attackDamage: number;
  attackInterval: number;
  attackKnockback: number;
  movementSpeed: number;
  flyingSpeed: number;
  followRange: number;
  knockbackResistance: number;
  xp: number;
}

export interface SpawnSpec {
  dimensions: string[];
  biomes: string[];
  customBiomes: string;
  minLight: number;
  maxLight: number;
  minY: number;
  maxY: number;
  groupMin: number;
  groupMax: number;
  weight: number;
  time: TimeOfDay;
  weather: Weather;
}

export interface DropSpec {
  item: string;
  chance: number;
  min: number;
  max: number;
}

export interface SoundSpec {
  ambient: string;
  hurt: string;
  death: string;
  step: string;
}

export interface AbilitySlot {
  id: string;
  power: number;
}

export interface ArchetypeDef {
  id: ArchetypeId;
  name: string;
  en: string;
  mark: string;
  tagline: string;
  category: Category;
  temperament: Temperament;
  rarity: Rarity;
  motion: Motion;
  canFly: boolean;
  canSwim: boolean;
  canClimb: boolean;
  fireImmune: boolean;
  breathesWater: boolean;
  undead: boolean;
  arthropod: boolean;
  bossBar: boolean;
  tameable: boolean;
  soundSet: string;
  foodItem: string;
  colors: Colors;
  eggBase: string;
  eggSpots: string;
  glow: boolean;
  translucent: boolean;
  particles: ParticleId;
  stats: StatBlock;
  behaviors: string[];
  abilities: AbilitySlot[];
  spawn: Partial<SpawnSpec>;
  parts: PartDef[];
  variants: VariantDef[];
  anchors: { body: string; head: string };
}

export interface MobDraft {
  uid: string;
  createdAt: number;
  updatedAt: number;
  displayName: string;
  displayNameEn: string;
  modId: string;
  entityId: string;
  summary: string;
  archetype: ArchetypeId;
  variant: string;
  category: Category;
  temperament: Temperament;
  rarity: Rarity;
  colors: Colors;
  eggBase: string;
  eggSpots: string;
  scale: number;
  glow: boolean;
  translucent: boolean;
  particles: ParticleId;
  partEnabled: Record<string, boolean>;
  partScale: Record<string, Vec3>;
  partTint: Record<string, string>;
  health: number;
  armor: number;
  armorToughness: number;
  attackDamage: number;
  attackInterval: number;
  attackKnockback: number;
  movementSpeed: number;
  flyingSpeed: number;
  followRange: number;
  knockbackResistance: number;
  xp: number;
  canFly: boolean;
  canSwim: boolean;
  canClimb: boolean;
  fireImmune: boolean;
  breathesWater: boolean;
  undead: boolean;
  arthropod: boolean;
  bossBar: boolean;
  tameable: boolean;
  behaviors: string[];
  abilities: AbilitySlot[];
  spawn: SpawnSpec;
  drops: DropSpec[];
  sounds: SoundSpec;
  notes: string;
  foodItem: string;
}

export interface ResolvedPart {
  def: PartDef;
  origin: Vec3;
  size: Vec3;
  pivot: Vec3;
  color: string;
  opacity: number;
}
