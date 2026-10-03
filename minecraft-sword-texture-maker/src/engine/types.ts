export type Palette = {
  blade: string;
  bladeEdge: string;
  bladeCore: string;
  guard: string;
  guardAccent: string;
  handle: string;
  handleAccent: string;
  pommel: string;
  outline: string;
  spur: string;
};

export type Silhouette =
  | "straight" | "scimitar" | "katana" | "claymore" | "dagger" | "flamberge"
  | "twinblade" | "spear" | "rapier" | "glaive" | "cutlass"
  | "falchion" | "kris" | "khopesh" | "gladius" | "cleaver" | "sabre"
  | "tanto" | "zweihander" | "estoc" | "macuahuitl" | "nodachi"
  | "jian" | "whip" | "liuyedao" | "uchigatana" | "nine_ring"
  | "trident" | "battleaxe" | "warpick"
  // Expanded arsenal
  | "mace" | "bow" | "pickaxe"
  // Formless / beauty-first silhouettes (型に囚われない)
  | "essence" | "lotus" | "geode" | "ribbon" | "spine"
  | "fractured" | "obelisk" | "fang" | "sakura";

export type WeaponClass = "sword" | "trident" | "axe" | "spear";

export type GuardStyle =
  | "straight" | "wings" | "cross" | "round" | "crescent" | "rapier"
  | "jagged" | "barbed" | "dread" | "tsuba" | "swept" | "shell" | "hooked"
  // from wuxia / Elden Ring / Bleach research
  | "jian" | "sigil" | "asymmetric" | "none";

export type HandleStyle =
  | "smooth" | "leather" | "wire" | "dragon_scale" | "gold_ribbon" | "bone"
  | "wrapped_parchment" | "ribbed" | "cord" | "studded" | "chain";

export type PommelStyle =
  | "round" | "gem" | "crescent" | "skull" | "ring" | "fang" | "spiked" | "orb" | "wing" | "disc"
  | "tassel" | "chain" | "flattened";

export type GemShape = "diamond" | "circle" | "teardrop" | "hex" | "marquise" | "star";

export type Element =
  | "none" | "flame" | "frost" | "void" | "holy" | "lightning" | "poison"
  | "shadow" | "blood" | "arcane" | "nature" | "ocean";

/**
 * Surface pattern drawn on the blade flat.
 * The first group is generic; the `hamon*` family uses real Japanese swordsmithing
 * terms for the temper line (刃文); the rest are fantasy/game "essences".
 */
export type SurfaceStyle =
  | "polished" | "damascus" | "hamon" | "obsidian" | "crystal" | "bone" | "wood"
  | "scales" | "magma" | "frost" | "hammered" | "etched" | "worn" | "banded"
  | "gilded" | "circuit" | "starfield" | "prismarine" | "amethyst" | "ender"
  | "vanilla" | "bevel" | "ifire" | "stormforged" | "skyblock" | "faithful" | "warmith" | "jade"
  // real temper-line patterns (hamon 刃文)
  | "suguha" | "gunome" | "choji" | "notare" | "inazuma" | "kinsuji"
  // fantasy essences gathered from RPG / anime / sci-fi
  | "dualtone" | "helix" | "whorl" | "divine" | "nightflame" | "rengoku" | "dragonscale" | "luminous"
  // Pack-school essences: named visual languages distilled from community packs/mods.
  | "ultimate_skyblock" | "furfsky" | "hypixel_plus" | "spartan_forge"
  | "dragonsteel" | "dragonbone" | "simply_runic"
  // Vanilla+ finish: faithful silhouette with refined bevel, grain and selective outline.
  | "vanilla_plus";

/** How the blade's colour gradient is oriented. */
export type GradientAxis = "none" | "length" | "across";

export type EffectPreset =
  | "calm" | "infernal" | "glacial" | "celestial" | "abyssal" | "stormcaller"
  | "necrotic" | "verdant" | "stellar" | "infernum" | "astral" | "voidborn" | "tidal" | "sylvan";

export type DetailLevel = "minecraft" | "rich" | "cinematic" | "anime";

export type OutlineColorMode = "dark" | "tinted" | "gold" | "none";

export type SwordOptions = {
  size: number;
  palette: Palette;

  // Shape
  silhouette: Silhouette;
  bladeWidth: number;
  bladeLength: number;
  guardWidth: number;
  handleLength: number;
  guardStyle: GuardStyle;
  handleStyle: HandleStyle;
  pommelStyle: PommelStyle;

  // Blade artistry
  surface: SurfaceStyle;
  fuller: boolean;
  fullerLength: number;
  serrated: boolean;
  edgeHighlight: boolean;
  bevelLine: boolean;
  holographic: boolean;
  runeInlay: boolean;
  runeColor: string;
  /** Gradient along the blade's length (base → mid → tip). */
  gradientBlade: boolean;
  /** Gradient across the blade (spine → edge). The Rengoku essence. */
  edgeGradient: boolean;
  /** A ricasso: an unsharpened section above the guard (real sword anatomy). */
  ricasso: boolean;
  /** Horimono: a carved decorative groove near the spine, distinct from a fuller. */
  horimono: boolean;
  tipColor: string;
  midGradientColor: string;

  // Aggressive attachments
  spurs: boolean;
  spurCount: number;
  boneSpurs: boolean;
  crystalShards: boolean;
  shardColor: string;
  pommelBand: boolean;

  // Guard & hilt
  gem: boolean;
  gemColor: string;
  gemShape: GemShape;
  gemGlow: boolean;
  filigree: boolean;

  // FX
  element: Element;
  elementIntensity: number;
  effectPreset: EffectPreset;
  sheen: boolean;
  sheenSpeed: number;
  sheenPos: number;
  sparkle: boolean;
  sparkleDensity: number;
  tipGlow: boolean;
  auraBloom: boolean;
  particles: boolean;
  lightning: boolean;
  shatter: boolean;
  runePulse: boolean;

  // Detail & render
  detailLevel: DetailLevel;
  noise: number;
  shading: number;
  outline: boolean;
  outlineColorMode: OutlineColorMode;
  antiAlias: boolean;
  seed: number;
  surfaceSeed: number;
  effectSeed: number;
};

export type MaterialPreset = {
  name: string;
  category: string;
  tier: string;
  desc: string;
  palette: Palette;
  element: Element;
  tipColor: string;
  midGradientColor: string;
  gemColor: string;
  runeColor: string;
  shardColor: string;
  effectPreset: EffectPreset;
  /** Optional style overrides applied on top of current options */
  style?: Partial<SwordOptions>;
};

export type RGB = [number, number, number];

/** Logical part of a pixel in the 16×16 base grid */
export type Part =
  | "blade" | "edge" | "core" | "bevel" | "guard" | "handle" | "pommel"
  | "spur" | "shard" | "none";

export type LogicalMap = {
  map: Part[][];
  G: number;
  guard: { gx: number; gy: number };
  bladeStart: number;
  bladeEnd: number;
  shards: { x: number; y: number; size: number }[];
};
