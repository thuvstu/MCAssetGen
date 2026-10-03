export type ModelCategory =
  // --- classic melee ---
  | "sword"
  | "greatsword"
  | "dagger"
  | "scythe"
  | "axe"
  | "mace"
  | "spear"
  | "spear_ornate"
  // --- casters ---
  | "staff"
  | "scepter"
  // --- ranged ---
  | "bow"
  | "crossbow"
  | "gun"
  | "railgun"
  // --- industrial ---
  | "chainsaw"
  // --- armor ---
  | "shield"
  | "armor_helmet"
  | "armor_wings"
  // --- relics ---
  | "relic_crystal"
  | "relic_grimoire"
  | "totem";

export type CategoryFamily = "melee" | "caster" | "ranged" | "machine" | "armor" | "relic";

export type MagicTheme =
  | "void"
  | "inferno"
  | "frost"
  | "celestial"
  | "storm"
  | "sculk"
  | "verdant"
  | "blood"
  | "redstone"
  | "machina"
  | "arcane"
  | "cursed"
  | "plasma";

export type CrossguardStyle =
  | "winged"
  | "horned"
  | "circular"
  | "dragon"
  | "spiked"
  | "minimal"
  | "runic";

export type BladeEdgeStyle =
  | "straight"
  | "serrated"
  | "crystal_spikes"
  | "curved"
  | "flame_wavy"
  | "split";

export type BladeProfile = "flat" | "bevel" | "fuller" | "hexagonal";

export type FloatingType =
  | "none"
  | "runes"
  | "crystals"
  | "magic_ring"
  | "orbs"
  | "skulls"
  | "feathers"
  | "stars"
  | "gears"
  | "bloodDrops"
  | "shells"
  | "thorns";

export type ParticleEffectType =
  | "none"
  | "sparks"
  | "flames"
  | "void_smoke"
  | "frost_crystals"
  | "holy_halo"
  | "electric_arcs"
  | "souls"
  | "exhaust_smoke"
  | "blood_mist"
  | "gear_sparks"
  | "plasma_vent"
  | "curse_runes"
  | "muzzle_flash";

export type AnimationMode =
  | "idle_float"
  | "orbit_spin"
  | "combat_swing"
  | "magic_pulse"
  | "combo_slash"
  | "charge_cleave"
  | "magic_cast"
  | "form_morph"
  | "limit_burst"
  // --- new ---
  | "chainsaw_rev"
  | "gun_recoil"
  | "reload_cycle"
  | "railgun_charge"
  | "mace_smash"
  | "spear_thrust"
  | "blood_drain"
  | "mech_deploy"
  | "off";

export type UpgradeTier = 1 | 2 | 3 | 4 | 5;
export type LimitBreakLevel = 0 | 1 | 2;

export type WeaponForm =
  | "standard"
  | "sealed"
  | "liberated"
  | "twin_fang"
  | "colossus";

export type TacticalMode =
  | "normal"
  | "overdrive"
  | "soul_devour"
  | "absolute_zero"
  | "thunder_clad"
  | "divine_aegis"
  | "overclock"
  | "hemorrhage";

/** Mechanical muzzle / emitter treatment for guns, railguns and casters. */
export type MuzzleStyle =
  | "none"
  | "barrel"
  | "compensator"
  | "coil_array"
  | "prism_lens"
  | "quad_rail";

export type AtlasPattern =
  | "dither"
  | "stripe"
  | "weave"
  | "grain"
  | "runes"
  | "plate"
  | "circuit"
  | "viscera";

export type MaterialKey =
  | "primary"
  | "secondary"
  | "accent"
  | "gem"
  | "glow"
  | "wood"
  | "bone"
  | "cloth";

export type GroupKey =
  | "Hilt"
  | "Guard"
  | "Blade"
  | "BladeL"
  | "BladeR"
  | "Shaft"
  | "Head"
  | "Core"
  | "Shell"
  | "Seal"
  | "Funnel"
  | "Halo"
  | "Astral"
  | "ModeVFX"
  | "Ornament"
  | "Floating"
  // --- mechanical / modern bones ---
  | "Chain"
  | "Gear"
  | "Piston"
  | "Barrel"
  | "Breech"
  | "Magazine"
  | "Rail"
  | "Coil"
  | "Muzzle"
  | "Banner";

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  gem: string;
  glow: string;
  wood: string;
  bone: string;
  cloth: string;
}

export interface GeneratorConfig {
  name: string;
  category: ModelCategory;
  theme: MagicTheme;

  // --- evolution, form & mode ---
  upgradeTier: UpgradeTier;
  limitBreak: LimitBreakLevel;
  weaponForm: WeaponForm;
  tacticalMode: TacticalMode;

  // --- proportion ---
  overallScale: number;
  bladeLength: number;
  bladeWidth: number;
  handleLength: number;
  crossguardWidth: number;

  // --- silhouette style ---
  crossguardStyle: CrossguardStyle;
  bladeEdgeStyle: BladeEdgeStyle;
  bladeProfile: BladeProfile;
  muzzleStyle: MuzzleStyle;

  // --- ornament toggles (classic) ---
  hasCoreGem: boolean;
  coreGemSize: number;
  hasSecondGem: boolean;
  hasPommelGem: boolean;
  hasChainsOrRibbons: boolean;
  hasSpikesOrWings: boolean;
  hasRunicEngravings: boolean;
  hasEnergyBladeOutline: boolean;

  // --- part library (new modular attachments) ---
  hasGearworks: boolean;
  hasPistons: boolean;
  hasCables: boolean;
  hasVents: boolean;
  hasThornCrown: boolean;
  hasSkullMotif: boolean;
  hasBanner: boolean;
  hasPrismArray: boolean;
  hasScope: boolean;
  hasBloodTank: boolean;

  // --- floating debris ---
  floatingType: FloatingType;
  floatingCount: number;
  floatingRadius: number;
  floatingHeightOffset: number;

  // --- animation ---
  animationEnabled: boolean;
  animationMode: AnimationMode;
  animationSpeed: number;
  floatAmplitude: number;

  // --- vfx ---
  particleEffect: ParticleEffectType;
  particleDensity: number;
  particleSpeed: number;
  bloomIntensity: number;

  // --- material ---
  textureResolution: 16 | 32 | 64;
  atlasPattern: AtlasPattern;
  customPalette?: Partial<ColorPalette>;
  seed: number;
}

export interface VoxelElement {
  name: string;
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  material: MaterialKey;
  emissive?: boolean;
  group: GroupKey;
  uv?: [number, number];
}

export interface ModelStats {
  elementCount: number;
  estimatedTriangles: number;
  size: [number, number, number];
  center: [number, number, number];
  radius: number;
}

export interface GeneratedModel {
  config: GeneratorConfig;
  palette: ColorPalette;
  elements: VoxelElement[];
  stats: ModelStats;
}
