export const TEXTURE_RESOLUTIONS = [16, 32, 64, 128] as const;
export type TextureResolution = (typeof TEXTURE_RESOLUTIONS)[number];

export const MODEL_THEMES = ["fantasy", "nether", "void", "holy", "cyber", "frost", "nature", "steampunk"] as const;
export type ModelTheme = (typeof MODEL_THEMES)[number];

export const MODEL_CATEGORIES = ["sword", "armor", "staff", "magic", "relic", "ranged", "custom"] as const;
export type ModelCategory = (typeof MODEL_CATEGORIES)[number];

export const MODEL_ARCHETYPES = [
  // blades & original set
  "sword",
  "greatsword",
  "scythe",
  "staff",
  "wand",
  "armor",
  "magic",
  "rapier",
  // industrial set
  "mech_hammer",
  "blood_blade",
  "cursed_blade",
  "wizard_staff",
  "bow",
  "gun",
  "chainsaw",
  "railgun",
  "spear",
  "mace",
  // arsenal expansion
  "drill_lance",
  "pile_bunker",
  "crystal_scepter",
  "orb_catalyst",
  "soul_lantern",
  "bone_scythe",
  "blood_scythe",
  "hemo_lance",
  "frost_staff",
  "druid_staff",
  "necro_grimoire",
  "celestial_codex",
  "crossbow",
  "compound_bow",
  "shotgun",
  "sniper",
  "smg",
  "chainsaw_sword",
  "revolver",
  "rail_cannon",
  "holy_grail",
  "ancient_crown",
  "cursed_amulet",
  "relic_orb",
  "halberd",
  "trident",
  "morning_star",
  "holy_mace",
] as const;
export type ModelArchetype = (typeof MODEL_ARCHETYPES)[number];

export const DIRECTIONS = ["north", "south", "east", "west", "up", "down"] as const;
export type Direction = (typeof DIRECTIONS)[number];
export type Vector3 = [number, number, number];
export type UVRect = [number, number, number, number];

export const FLOATING_ITEM_TYPES = ["crystal", "rune_cube", "shard", "orb", "blade_ring"] as const;
export type FloatingItemType = (typeof FLOATING_ITEM_TYPES)[number];

export const MAGIC_CIRCLE_STYLES = [
  "runic_ring",
  "pentagram",
  "arcane_clock",
  "celestial_sun",
  "void_spiral",
  "gear_ring",
  "blood_rune",
  "hexagram",
  "elemental",
  "sigil_eye",
  "hex_tech",
  "grimoire_seal",
] as const;
export type MagicCircleStyle = (typeof MAGIC_CIRCLE_STYLES)[number];

export const PARTICLE_TYPES = [
  "flame",
  "ice",
  "void",
  "holy",
  "lightning",
  "cherry",
  "sparkle",
  "souls",
  "blood",
  "gears",
  "sparks",
  "runes",
  "smoke",
  "stars",
  "bubbles",
  "glitch",
  "feathers",
  "ash",
  "none",
] as const;
export type ParticleType = (typeof PARTICLE_TYPES)[number];

export const ANIMATION_TYPES = [
  "none",
  "idle_float",
  "orbital_spin",
  "pulse_glow",
  "blade_swing",
  "magic_cast",
  "wing_flutter",
  "hover_spin",
  "heartbeat",
  "pendulum",
  "engine_idle",
  "levitate_tilt",
] as const;
export type AnimationType = (typeof ANIMATION_TYPES)[number];

export const FORM_IDS = ["base", "extended", "twin", "sealed", "demonic", "crystal", "winged"] as const;
export type FormId = (typeof FORM_IDS)[number];

export const TEMPORARY_MODE_IDS = ["overdrive", "berserk", "guardian", "phantom", "awakening"] as const;
export type TemporaryModeId = (typeof TEMPORARY_MODE_IDS)[number];

export const ACTION_IDS = [
  "attack_slash",
  "attack_thrust",
  "combo_strike",
  "spell_charge",
  "spell_release",
  "ultimate_burst",
  "transform",
  "shoot",
  "reload",
  "saw_spin",
  "smash",
  "channel_beam",
  "arrow_release",
  "spin_attack",
  "guard_stance",
  "rail_charge",
  "drill_spin",
  "page_turn",
  "summon",
  "dash_strike",
  "overheat_vent",
  "blood_drain",
  "relic_resonate",
  "uppercut",
] as const;
export type ActionId = (typeof ACTION_IDS)[number];

export const DECORATION_TYPES = [
  "halo_ring",
  "sun_disk",
  "spike_row",
  "spike_crown",
  "gem_studs",
  "gem_cluster",
  "chain_wrap",
  "rune_bands",
  "wing_pair",
  "horn_pair",
  "tassels",
  "ribbon_spiral",
  "shard_ring",
  "gear_cluster",
  "pipes",
  "cooling_fins",
  "thrusters",
  "eye_cluster",
  "blood_drips",
  "crystal_growth",
  "energy_edge",
  "rune_plates",
  "bone_ribs",
  "feather_tuft",
  "banner",
  "skull",
] as const;
export type DecorationType = (typeof DECORATION_TYPES)[number];

export const DECORATION_COLOR_SOURCES = ["glow", "accent", "primary", "secondary", "highlight", "dark", "custom"] as const;
export type DecorationColorSource = (typeof DECORATION_COLOR_SOURCES)[number];

/** A parametric, fully adjustable decoration layer that generates real (exportable) cubes. */
export interface DecorationInstance {
  id: string;
  type: DecorationType;
  enabled: boolean;
  count: number;
  size: number;
  radius: number;
  height: number; // 0 = bottom of model, 1 = top
  tilt: number;
  twist: number;
  offsetZ: number;
  colorSource: DecorationColorSource;
  customColor: string;
  emissive: boolean;
  opacity: number;
  mirror: boolean;
}

export type GizmoMode = "none" | "translate" | "rotate" | "scale";

export interface ElementTransform {
  translate: Vector3;
  rotation: Vector3;
  scale: Vector3;
}

export interface VariantState {
  tier: number;
  limitBreak: number;
  form: FormId;
}

export interface VariantInfo extends VariantState {
  baseName: string;
}

export interface FaceUV {
  uv: UVRect;
  texture?: string;
  rotation?: 0 | 90 | 180 | 270;
}

export type ElementFaces = Partial<Record<Direction, FaceUV>>;

export interface ModelElement {
  id: string;
  name: string;
  group?: string;
  from: Vector3;
  to: Vector3;
  origin: Vector3;
  rotation: Vector3;
  faces: ElementFaces;
  color?: string;
  inflate?: number;
  visible?: boolean;
  emissive?: boolean;
  opacity?: number;
  generated?: boolean;
}

export interface ModelGroup {
  id: string;
  name: string;
  pivot: Vector3;
  rotation: Vector3;
  childrenIds: string[];
}

export interface FloatingItemConfig {
  enabled: boolean;
  count: number;
  type: FloatingItemType;
  orbitRadius: number;
  orbitSpeed: number;
  heightOffset: number;
  bobbingAmplitude: number;
  color: string;
}

export interface MagicCircleConfig {
  enabled: boolean;
  radius: number;
  rotationSpeed: number;
  yOffset: number;
  tiltAngle: number;
  style: MagicCircleStyle;
  color: string;
  emissiveIntensity: number;
  layers?: number; // 1 - 4 stacked counter-rotating rings
  glyphRing?: boolean; // engraved rune glyph band
}

export interface ParticleEffectConfig {
  enabled: boolean;
  type: ParticleType;
  density: number;
  speed: number;
  spread: number;
  color: string;
  secondaryColor?: string;
}

export interface AnimationConfig {
  activeAnimation: AnimationType;
  speed: number;
  amplitude: number;
  enableHover: boolean;
  enableOrbitals: boolean;
  enablePulse: boolean;
  enableFlicker: boolean;
}

export interface ColorPalette {
  id: ModelTheme;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  highlight: string;
  glow: string;
}

export interface ModelData {
  id?: number | string;
  name: string;
  description: string;
  category: ModelCategory;
  theme: ModelTheme;
  archetype?: ModelArchetype;
  textureWidth: TextureResolution;
  textureHeight: TextureResolution;
  elements: ModelElement[];
  groups: ModelGroup[];
  floatingItems: FloatingItemConfig;
  magicCircle: MagicCircleConfig;
  particles: ParticleEffectConfig;
  animations: AnimationConfig;
  palette: ColorPalette;
  decorations?: DecorationInstance[];
  variant?: VariantInfo;
}

export interface PersistedModelPayload {
  name: string;
  description?: string;
  category: ModelCategory;
  theme: ModelTheme;
  textureResolution: TextureResolution;
  modelData: ModelData;
  textureDataUrl: string;
  thumbnailDataUrl?: string | null;
}
