import {
  CATEGORIES, EFFECT_PRESETS, ELEMENTS, PALETTES, RARITIES, STAFF_TYPES, TYPE_SIGNATURES,
  type Category, type Config, type CoreId, type EffectPresetId, type ElementId, type FloaterId,
  DESIGN_MOTIFS, type ArtifactFormId, type DesignMotifId, type FloaterPathId, type GemCutId, type GripStyleId, type MaterialId, type MountId, type OrnamentId,
  type PaletteId, type PatternId, type PommelId, type RarityId, type ShaftShapeId, type StaffTypeId, type TextureFinishId,
} from "./data";
import { mulberry } from "./render";

const pick = <T,>(r: () => number, arr: readonly T[]) => arr[Math.floor(r() * arr.length)];
const keys = <K extends string>(o: Record<K, unknown>) => Object.keys(o) as K[];

export const DEFAULT_CONFIG: Config = {
  seed: 20240, size: 64, type: "wizard", element: "arcane", rarity: "legendary", name: "",
  length: 1, thickness: 2, taper: true, shaftMaterial: "darkoak", pattern: "grain",
  shape: "straight", grip: true, gripStyle: "wrap", gripColor: "#6b2f3a", bands: 2,
  trimMaterial: "gold", pommel: "cap",
  form: "classic", motif: "unbound", mount: "prongs", core: "crystal", coreSize: 1, gemCut: "brilliant", ornament: "runeRing", ornamentScale: 1, accentGems: 3, floatingCore: false,
  floater: "runes", floaterPath: "orbit", floaterCount: 3, floaterRadius: 1,
  coreColor: ELEMENTS.arcane.core, energyColor: ELEMENTS.arcane.energy, particle: "glyphs", palette: "element",
  finish: "engraved", glow: 48, glowRadius: 5, dither: true, aura: false, rimLight: true, trail: false,
  particles: 45, glint: false, pulse: true, magicCircle: false, rays: true, specular: true, aa: true,
  outline: "selout", effectPreset: "legendary", scatter: 18, sparkle: 22, drift: 14,
  frames: 16, frametime: 2,
};

export function applyElement(cfg: Config, el: ElementId): Config {
  const e = ELEMENTS[el];
  return {
    ...cfg, element: el, particle: e.particle,
    floater: cfg.floater === "none" ? "none" : e.floater,
    ...(cfg.palette === "element" ? { coreColor: e.core, energyColor: e.energy } : {}),
  };
}
export function applyPalette(cfg: Config, p: PaletteId | "custom"): Config {
  if (p === "custom") return { ...cfg, palette: p };
  if (p === "element") {
    const e = ELEMENTS[cfg.element];
    return { ...cfg, palette: p, coreColor: e.core, energyColor: e.energy };
  }
  const pal = PALETTES[p];
  return { ...cfg, palette: p, coreColor: pal.core, energyColor: pal.energy };
}
export function applyType(cfg: Config, t: StaffTypeId): Config {
  return { ...cfg, ...(STAFF_TYPES[t].preset as Partial<Config>), ...TYPE_SIGNATURES[t], type: t };
}
export function applyEffect(cfg: Config, p: EffectPresetId): Config {
  const next = { ...cfg, ...EFFECT_PRESETS[p].preset, effectPreset: p };
  if (p === "clean" || p === "vanilla" || p === "vanillaThin") next.floater = "none";
  else if (!("floater" in EFFECT_PRESETS[p].preset) && next.floater === "none") next.floater = ELEMENTS[cfg.element].floater;
  return next;
}

/** Apply a construction language without replacing the user's staff archetype. */
export function applyDesignMotif(cfg: Config, motif: DesignMotifId): Config {
  return { ...cfg, ...DESIGN_MOTIFS[motif].recipe, motif };
}

const ELEMENT_MATS: Record<ElementId, MaterialId[]> = {
  fire: ["blaze", "crimson", "netherite", "darkoak", "copper", "mangrove"],
  ice: ["quartz", "iron", "birch", "prismarine", "diamond", "lapis"],
  thunder: ["gold", "iron", "darkoak", "endrod", "copper", "lapis"],
  nature: ["oak", "birch", "darkoak", "warped", "bamboo", "cherry", "mangrove"],
  water: ["prismarine", "iron", "quartz", "warped", "lapis", "diamond"],
  light: ["quartz", "gold", "birch", "endrod", "diamond"],
  dark: ["obsidian", "netherite", "darkoak", "crimson", "sculk"],
  void: ["obsidian", "endrod", "amethyst", "netherite", "sculk"],
  arcane: ["darkoak", "amethyst", "quartz", "obsidian", "lapis"],
  blood: ["crimson", "bone", "netherite", "darkoak", "mangrove"],
  earth: ["oak", "iron", "darkoak", "netherite", "mud", "copper"],
  wind: ["birch", "prismarine", "quartz", "warped", "bamboo", "cherry"],
  cosmic: ["obsidian", "amethyst", "gold", "endrod", "lapis", "diamond"],
  time: ["copper", "gold", "quartz", "birch", "oak"],
  sound: ["cherry", "gold", "birch", "bamboo", "copper"],
  metal: ["iron", "netherite", "copper", "gold", "diamond"],
  poison: ["warped", "mangrove", "bamboo", "mud", "bone"],
  storm: ["lapis", "iron", "darkoak", "obsidian", "copper"],
  soul: ["sculk", "bone", "obsidian", "quartz", "warped"],
  crystal: ["diamond", "amethyst", "quartz", "prismarine", "lapis"],
  gravity: ["obsidian", "netherite", "sculk", "iron", "mud"],
  plasma: ["redstone", "blaze", "copper", "netherite", "amethyst"],
  sakura: ["cherry", "birch", "quartz", "gold", "bamboo"],
  dream: ["amethyst", "quartz", "endrod", "cherry", "lapis"],
  aurora: ["prismarine", "diamond", "quartz", "warped", "iron"],
  ink: ["darkoak", "obsidian", "sculk", "lapis", "bone"],
  luck: ["emerald", "gold", "bamboo", "oak", "copper"],
  festival: ["cherry", "coral", "gold", "bamboo", "crimson"],
};

// ---------- lock system ----------
export type LockMode = "keep" | "only" | null;
export type LockMap = { [K in Category]?: "keep" | "only" };

export const applyLock = (current: LockMap, cat: Category, mode: LockMode): LockMap => {
  const next = { ...current };
  if (mode == null) delete (next as Record<string, unknown>)[cat]; else next[cat] = mode;
  if (mode === "only") for (const k of Object.keys(next) as Category[]) if (k !== cat && next[k] === "only") delete next[k];
  return next;
};

export function keysOf(cat: Category): readonly (keyof Config)[] {
  switch (cat) {
    case "identity": return ["seed", "size", "type", "element", "rarity", "name"] as const;
    case "shaft": return ["length", "thickness", "taper", "shaftMaterial", "pattern", "shape", "grip", "gripStyle", "gripColor", "bands", "trimMaterial", "pommel"] as const;
    case "head": return ["form", "motif", "mount", "core", "coreSize", "gemCut", "ornament", "ornamentScale", "accentGems", "floatingCore", "floater", "floaterPath", "floaterCount", "floaterRadius"] as const;
    case "colors": return ["coreColor", "energyColor", "particle", "palette"] as const;
    case "effects": return ["finish", "glow", "glowRadius", "dither", "aura", "rimLight", "trail", "particles", "glint", "pulse", "magicCircle", "rays", "specular", "aa", "outline", "scatter", "sparkle", "drift"] as const;
    case "animation": return ["frames", "frametime"] as const;
  }
}

// ---------- category generators ----------
const PATTERNS_ALL: PatternId[] = ["plain", "grain", "spiral", "twisted", "ribbed", "runes", "vine", "gradient", "filigree", "scales", "bamboo", "candy", "cracked", "mossy", "frosted", "lavavein", "chainlink", "engraved", "feathered", "bark", "gearwork", "wave", "riveted", "gemInlay", "woven", "etched", "circuit", "barnacle", "chevron", "crystalSeam", "kintsugi", "marquetry", "microEdge", "tipTint", "notch", "speckle", "thinBand", "vanillaGrain"];
const SHAPES_ALL: ShaftShapeId[] = ["straight", "curved", "gnarled", "hooked", "swan"];
const GRIPS_ALL: GripStyleId[] = ["wrap", "leather", "chain", "studded", "cord", "woven"];
const POMMELS_ALL: PommelId[] = ["cap", "gem", "spike", "orb", "roots", "blade", "skull", "lantern", "chain", "hook", "crystal", "cog", "shell", "knot", "anchor", "gear", "leaf", "pearl", "compass", "none"];
const TRIMS_ALL: MaterialId[] = ["gold", "iron", "netherite", "amethyst", "quartz", "copper", "diamond", "emerald", "obsidian", "bone", "brass", "steel", "silver", "coral", "seaGlass", "jade", "cobalt", "amber", "ruby", "sapphire", "holySilver", "shadowSteel", "prismAlloy", "vanillaStick"];
const CORES_ALL: CoreId[] = ["crystal", "cluster", "orb", "prism", "star", "flame", "lantern", "book", "hourglass", "sun", "moon", "heart", "diamond", "portal", "totem", "anvil", "serpenthead", "skull", "eye", "shell", "conch", "pearl", "battery", "compass", "lanternCore", "coralHeart", "blade", "shortBlade", "ruby", "sapphire", "emeraldGem", "holyBlade", "cursedBlade", "prismBlade"];
const MOUNTS_ALL: MountId[] = ["prongs", "crown", "crescent", "ring", "cage", "wings", "antler", "serpent", "lantern", "scythe", "book", "chain", "claw", "hourglass", "arch", "fork", "curl", "lotus", "astrolabe", "tiara", "lyre", "coralCrown", "trident", "collar", "tinyCollar", "guard", "microRing", "tipCap", "none"];
const FLOATERS_ALL: FloaterId[] = ["shards", "runes", "orbs", "cubes", "stars", "halo", "petals", "chains", "wisps", "bells", "daggers", "candles", "books", "moons", "eyes", "leaves", "coins", "butterflies", "keys", "gears", "lanterns", "sigils", "compasses", "bubbles", "fish", "pearls", "bolts", "cogs", "shells", "tadpoles", "seeds", "paperCrane", "motes", "glints", "dust", "sparkCross"];
const GEM_CUTS_ALL: GemCutId[] = ["raw", "brilliant", "emerald", "rose", "teardrop", "rune", "starcut", "cracked", "caged", "soul"];
const ORNAMENTS_ALL: OrnamentId[] = ["none", "runeRing", "crownJewels", "vineCrest", "hangingCharms", "chainTassel", "sunDisk", "lunarPhase", "thornHalo", "floatingPages", "soulCage", "clockwork", "featherCrest", "serpentCoil", "alchemicalRing", "beadRosary", "crystalLattice", "silkRibbons", "arabesque", "lotusPetals", "celestialAstrolabe"];
const FLOATER_PATHS_ALL: FloaterPathId[] = ["orbit", "spiral", "figure8", "crown", "helix", "pendulum", "constellation", "rain"];
const FINISHES_ALL: TextureFinishId[] = ["vanilla", "forged", "weathered", "engraved", "gilded", "runic"];
const ARTIFACT_FORMS_ALL: ArtifactFormId[] = ["classic", "asymmetric", "bifurcated", "levitating", "constellation", "shrine", "totemic", "bouquet"];
const DESIGN_MOTIFS_ALL = Object.keys(DESIGN_MOTIFS) as DesignMotifId[];
const GRIP_COLORS = ["#6b2f3a", "#2f3b6b", "#3a2a22", "#2e4a33", "#4b2a5c", "#1f1f27", "#7a5a2e", "#5c1f2a", "#1f4a4a", "#4a3b1f"];
const RARITY_POOL: RarityId[] = ["common", "uncommon", "uncommon", "rare", "rare", "epic", "epic", "legendary", "legendary", "mythic", "divine", "artifact", "relic"];

function genIdentity(r: () => number, locked: LockMap, _base: Config, out: Partial<Config>) {
  if (locked.identity === "keep") return;
  out.type = pick(r, keys(STAFF_TYPES) as StaffTypeId[]);
  out.element = pick(r, keys(ELEMENTS) as ElementId[]);
  out.rarity = pick(r, RARITY_POOL);
}

function genColors(r: () => number, locked: LockMap, element: ElementId, out: Partial<Config>) {
  if (locked.colors === "keep") return;
  const usePalette = r() < 0.35;
  if (usePalette) {
    const p = pick(r, keys(PALETTES) as (keyof typeof PALETTES)[]);
    out.palette = p as PaletteId;
    out.coreColor = PALETTES[p].core;
    out.energyColor = PALETTES[p].energy;
  } else {
    out.palette = "element";
    out.coreColor = ELEMENTS[element].core;
    out.energyColor = ELEMENTS[element].energy;
  }
  out.particle = ELEMENTS[element].particle;
}

function genShaft(r: () => number, locked: LockMap, element: ElementId, tier: number, out: Partial<Config>) {
  if (locked.shaft === "keep") return;
  out.shaftMaterial = pick(r, ELEMENT_MATS[element]);
  out.pattern = pick(r, PATTERNS_ALL);
  out.shape = pick(r, SHAPES_ALL);
  out.trimMaterial = pick(r, TRIMS_ALL);
  out.pommel = pick(r, POMMELS_ALL);
  out.thickness = pick(r, [1, 1, 2, 2, 2, 3, 3, 4, 5]);
  out.bands = Math.min(4, Math.max(0, pick(r, [0, 1, 1, 2, 2, 3, 3, 4]) + (tier >= 6 ? 1 : 0)));
  out.length = Math.round((0.6 + r() * 0.4) * 100) / 100;
  out.taper = r() < 0.6;
  out.grip = r() < 0.72;
  out.gripStyle = pick(r, GRIPS_ALL);
  out.gripColor = pick(r, GRIP_COLORS);
}

function genHead(r: () => number, locked: LockMap, tier: number, out: Partial<Config>) {
  if (locked.head === "keep") return;
  out.motif = pick(r, DESIGN_MOTIFS_ALL);
  out.core = pick(r, CORES_ALL);
  out.form = pick(r, ARTIFACT_FORMS_ALL);
  out.mount = pick(r, MOUNTS_ALL);
  out.coreSize = Math.round((0.8 + r() * 0.4) * 100) / 100;
  out.gemCut = pick(r, GEM_CUTS_ALL);
  out.ornament = pick(r, ORNAMENTS_ALL);
  out.ornamentScale = Math.round((0.75 + r() * 0.65) * 100) / 100;
  out.accentGems = Math.min(7, Math.max(0, Math.round(tier * 0.72) + (r() < 0.45 ? 0 : 1)));
  out.floatingCore = r() < 0.28;
  out.floater = pick(r, FLOATERS_ALL);
  out.floaterPath = pick(r, FLOATER_PATHS_ALL);
  out.floaterCount = Math.max(2, Math.min(7, Math.round(tier * 0.8) + (r() < 0.5 ? 0 : 1)));
  out.floaterRadius = Math.round((0.85 + r() * 0.5) * 100) / 100;
}

const PRESET_BY_TIER: Record<number, EffectPresetId[]> = {
  0: ["clean", "vanilla", "vanillaThin"],
  1: ["clean", "vanilla", "vanillaThin", "vanillaPlus", "relic"],
  2: ["enchanted", "vanilla", "vanillaPlus", "relic", "graceful", "rubyTool", "sapphireTool", "emeraldTool"],
  3: ["enchanted", "legendary", "frostbite", "graceful", "vanillaPlus", "plusScatter"],
  4: ["legendary", "ethereal", "stormfront", "infernal", "graceful", "haute", "plusScatter", "prismHoly"],
  5: ["mythic", "corrupted", "ethereal", "soulbound", "plague", "graceful", "haute", "plusScatter", "ominous"],
  6: ["divine", "mythic", "celestial", "prismatic", "haute", "graceful", "prismHoly", "plusScatter"],
  7: ["divine", "celestial", "prismatic", "infernal", "mythic", "haute", "ominous", "prismHoly"],
  8: ["relic", "divine", "celestial", "corrupted", "mythic", "haute", "prismHoly", "ominous"],
};

function genEffects(r: () => number, locked: LockMap, tier: number, out: Partial<Config>) {
  if (locked.effects === "keep") return;
  const preset = pick(r, PRESET_BY_TIER[tier] ?? ["legendary"]);
  Object.assign(out, EFFECT_PRESETS[preset].preset);
  out.effectPreset = preset;
  out.finish = pick(r, FINISHES_ALL);
  // Plus-effect channels: preset value wins, otherwise scale gently with tier.
  if (out.scatter === undefined) out.scatter = tier <= 1 ? Math.round(r() * 8) : Math.round(8 + r() * (10 + tier * 4));
  if (out.sparkle === undefined) out.sparkle = tier <= 1 ? Math.round(r() * 10) : Math.round(10 + r() * (12 + tier * 4));
  if (out.drift === undefined) out.drift = tier >= 5 && r() < 0.5 ? Math.round(10 + r() * 22) : Math.round(r() * 12);
  // Respect the preset's own choice; only occasionally add rays to top-tier relics.
  out.rays = (EFFECT_PRESETS[preset].preset.rays ?? false) || (tier >= 6 && r() < 0.3);
  out.specular = true;
  out.aa = true;
  out.glow = Math.min(78, (EFFECT_PRESETS[preset].preset.glow ?? 40) + Math.round(tier));
  // Stacking aura, rays and a magic circle is what makes a texture look washed out.
  const layers = [out.aura, out.rays, out.magicCircle].filter(Boolean).length;
  if (layers >= 2) {
    if (out.rays && r() < 0.6) out.rays = false;
    else out.aura = false;
  }
  if (locked.head !== "keep" && tier >= 4 && r() < 0.45) out.floater = pick(r, FLOATERS_ALL);
  if (r() < 0.25) out.magicCircle = tier >= 4;
}

// ---------- main API ----------
export type GenerateOpts = { seed?: number; locks?: LockMap };

export function autoGenerate(base: Config, opts: GenerateOpts = {}): Config {
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
  const r = mulberry(seed);
  const requestedLocks = opts.locks ?? {};
  // "only" is not merely a badge: all other categories become keep-locked for this generation.
  const onlyCategory = (Object.keys(requestedLocks) as Category[]).find((key) => requestedLocks[key] === "only");
  const locks: LockMap = onlyCategory
    ? Object.fromEntries(CATEGORIES.map((category) => [category, category === onlyCategory ? "only" : "keep"])) as LockMap
    : requestedLocks;
  const out: Partial<Config> = {};

  genIdentity(r, locks, base, out);
  const type = out.type ?? base.type;
  const element = out.element ?? base.element;
  const rarity = out.rarity ?? base.rarity;
  const tier = RARITIES[rarity].tier;

  const typed = applyType(base, type);
  // A type preset is a starting composition only. Category locks always win over its fields.
  const merged: Partial<Config> = { ...base, type, element, rarity };
  for (const category of ["shaft", "head"] as const) {
    if (locks[category] === "keep") continue;
    for (const key of keysOf(category)) (merged as Record<string, unknown>)[key] = (typed as Record<string, unknown>)[key];
  }
  genColors(r, locks, element, merged);
  genShaft(r, locks, element, tier, merged);
  genHead(r, locks, tier, merged);
  genEffects(r, locks, tier, merged);

  // A motif is a compositional recipe (wood, clockwork, jewelry, sea, etc.), not another staff silhouette.
  const motif = locks.head === "keep" ? base.motif : pick(r, DESIGN_MOTIFS_ALL);
  merged.motif = motif;
  const recipe = DESIGN_MOTIFS[motif].recipe;
  for (const category of CATEGORIES) {
    if (locks[category] === "keep") continue;
    for (const key of keysOf(category)) {
      if (Object.prototype.hasOwnProperty.call(recipe, key)) {
        (merged as Record<string, unknown>)[key] = (recipe as Record<string, unknown>)[key];
      }
    }
  }

  const cfg: Config = { ...base, ...merged, ...out, seed };
  if (locks.animation !== "keep") { cfg.frames = base.frames; cfg.frametime = base.frametime; }
  if (cfg.size === 32 && cfg.thickness > 3) cfg.thickness = 3;
  if (locks.head !== "keep" && tier >= 4 && cfg.floater === "none") cfg.floater = ELEMENTS[element].floater;
  cfg.name = generateName(cfg, seed);
  return cfg;
}

// ---------- naming + lore ----------
const EL_PREFIX: Record<ElementId, string[]> = {
  fire: ["紅蓮", "炎帝", "灼熱", "焔", "業火"], ice: ["氷晶", "蒼氷", "凍土", "霜天", "絶対零度"],
  thunder: ["雷鳴", "迅雷", "霹靂", "天雷", "雷帝"], nature: ["翠緑", "森羅", "樹霊", "若葉", "万緑"],
  water: ["蒼海", "潮騒", "深淵の水", "水鏡", "海神"], light: ["聖光", "黎明", "天輪", "白輝", "曙光"],
  dark: ["宵闇", "冥府", "黒月", "影縫", "暗夜"], void: ["虚空", "終焉", "果ての", "無限", "無"],
  arcane: ["秘儀", "大賢者", "星詠み", "禁書", "叡智"], blood: ["血盟", "緋色", "吸血姫", "深紅", "朱"],
  earth: ["大地", "巌", "地脈", "琥珀", "巨岩"], wind: ["疾風", "天翔", "翠嵐", "蒼穹", "旋"],
  cosmic: ["星辰", "銀河", "天球", "流星", "星雲"], time: ["刻", "永遠", "砂漏", "追憶", "時空"],
  sound: ["共鳴", "調べ", "夜想曲", "歌声", "鈴音"], metal: ["鋼", "鉄壁", "鍛冶", "白銀", "不壊"],
  poison: ["猛毒", "瘴気", "蝕む", "毒針", "疫"], storm: ["嵐", "雷雨", "疾風怒濤", "雲海", "暴風"],
  soul: ["魂", "冥火", "幽世", "霊", "鎮魂"], crystal: ["水晶", "晶彩", "屈折", "硝子", "虹彩"],
  gravity: ["重力", "引力", "落下", "黒孔", "磁場"], plasma: ["電漿", "高熱", "雷光", "陽電子", "閃"],
  sakura: ["桜花", "花霞", "薄紅", "春宵", "花明"], dream: ["夢幻", "微睡", "夜夢", "幻灯", "夢境"],
  aurora: ["極光", "天幕", "虹夜", "光帯", "北天"], ink: ["墨染", "玄墨", "書影", "黒筆", "墨華"],
  luck: ["幸運", "福星", "吉兆", "黄金夢", "四葉"], festival: ["祝祭", "花火", "祭囃子", "万華", "祝宴"],
};
const TYPE_SUFFIX: Record<StaffTypeId, string[]> = {
  wizard: ["の魔導杖", "の大杖"], scepter: ["の王笏", "の聖笏"], wand: ["のワンド", "の小杖"],
  druid: ["の樹杖", "の古木杖"], lunar: ["の月杖", "の月詠杖"], necro: ["の死霊杖", "の骸杖"],
  khakkhara: ["の錫杖", "の鳴杖"], trident: ["の三叉杖", "の海神杖"], seraph: ["の熾天杖", "の聖翼杖"],
  voidcaller: ["の封魔杖", "の魔眼杖"], shaman: ["の呪杖", "のトーテム杖"], lanternbearer: ["の提灯杖", "の夜灯杖"],
  reaper: ["の鎌杖", "の死神杖"], serpentstaff: ["の蛇杖", "の蜿杖"], chronomancer: ["の時杖", "の刻漏杖"],
  bard: ["の楽杖", "の詩杖"], geomancer: ["の岩杖", "の地脈杖"], stormcaller: ["の雷杖", "の嵐杖"],
  soulreaper: ["の魂杖", "の冥杖"], archmage: ["の賢杖", "の奥義杖"], celestial: ["の天杖", "の聖杖"],
  plaguedoctor: ["の疫杖", "の鳥頭杖"], runesmith: ["の刻杖", "の古文杖"], dracolich: ["の竜骨杖", "の竜杖"],
  feywild: ["の妖杖", "の妖精杖"], abyssal: ["の深淵杖", "の裂け目杖"], solar: ["の日輪杖", "の太陽杖"],
  bloodmage: ["の血杖", "の赤術杖"], ashen: ["の灰杖", "の燼杖"], skyfather: ["の天神杖", "の雲上杖"],
  valkyrie: ["の天槍杖", "の戦乙女杖"], lotus: ["の蓮華杖", "の睡蓮杖"], astrolabe: ["の渾天杖", "の星見杖"],
  court: ["の宮廷宝杖", "の典雅杖"], sylphid: ["の竪琴杖", "の風精杖"], eclipse: ["の日食杖", "の黒輪杖"],
  vanillaRod: ["の細杖", "の棒杖"], vanillaPlus: ["の小杖＋", "の細杖＋"], apprentice: ["の見習い杖", "の枝杖"],
  rubyTool: ["の紅玉杖", "のルビーロッド"], sapphireTool: ["の蒼玉杖", "のサファイアロッド"], emeraldTool: ["の翠玉杖", "のエメラルドロッド"],
  prismSword: ["の虹彩剣", "のプリズムソード"], holySword: ["の聖剣杖", "のホーリーソード"], ominousSword: ["の禍剣杖", "の不吉な剣"],
};
const TITLE = ["", "", "・改", "・真", "・極", "・絶", "・天", "・神"];

export function generateName(cfg: Config, seed = cfg.seed) {
  const r = mulberry(seed + 7);
  const tier = RARITIES[cfg.rarity].tier;
  const star = tier >= 6 ? "✪ " : tier >= 4 ? "✦ " : "";
  const title = tier >= 5 ? pick(r, TITLE.slice(2)) : "";
  return `${star}${pick(r, EL_PREFIX[cfg.element])}${pick(r, TYPE_SUFFIX[cfg.type])}${title}`.trim();
}

const ABILITY_FLAVOR: Record<number, string> = {
  0: "素朴だが確かな魔力が宿る。", 1: "使い込まれた痕跡が魔力を導く。", 2: "属性の力がわずかに目覚めている。",
  3: "振るうたびに魔力が渦を巻く。", 4: "伝説に語られる一振り。", 5: "神話の時代の遺された力。",
  6: "神聖な光が絶えず溢れ出す。", 7: "世界の理を曲げる人工神器。", 8: "時代を超えて伝わった至宝。",
};

export function loreFor(cfg: Config) {
  const tier = RARITIES[cfg.rarity].tier;
  const e = ELEMENTS[cfg.element];
  const r = mulberry(cfg.seed + 3);
  const dmg = Math.round((30 + tier * 55) * (0.9 + r() * 0.3));
  const mana = Math.round((50 + tier * 80) * (0.9 + r() * 0.3));
  const stat = Math.round((8 + tier * 20) * (0.8 + r() * 0.4));
  const speed = Math.round((2 + tier * 3) * (0.8 + r() * 0.4));
  return {
    dmg, mana, stat, speed, statName: e.stat, ability: e.ability,
    flavor: ABILITY_FLAVOR[tier] ?? "",
    cost: Math.round(20 + tier * 35), cooldown: Math.max(1, 10 - tier),
  };
}

export {
  MATERIALS, CORES, POMMELS, MOUNTS, PATTERNS, PARTICLES, FLOATERS, OUTLINES, RARITIES,
  STAFF_TYPES, TYPE_SIGNATURES, EFFECT_PRESETS, ELEMENTS, PALETTES, SHAPES, GRIP_STYLES, GEM_CUTS, ORNAMENTS, FLOATER_PATHS, ARTIFACT_FORMS, DESIGN_MOTIFS,
} from "./data";
export type {
  Category, EffectPresetId, ElementId, MaterialId, Config, OutlineId, ParticleId, PatternId,
  RarityId, StaffTypeId, MountId, CoreId, FloaterId, PommelId, PaletteId, ShaftShapeId, GripStyleId, GemCutId, OrnamentId, FloaterPathId, ArtifactFormId, DesignMotifId,
} from "./data";
