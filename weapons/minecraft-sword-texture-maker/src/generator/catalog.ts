import type { Element, GuardStyle, HandleStyle, Palette, PommelStyle, Silhouette, SurfaceStyle } from "../engine/types";
import { SURFACE_LABELS } from "../engine/surfaces";

export const GROUP_IDS = ["blade", "guard", "grip", "palette", "element", "attachments", "finish", "effects"] as const;
export type GroupId = (typeof GROUP_IDS)[number];
export type RuleMode = "auto" | "keep" | "pick";
export type PartRule = { mode: RuleMode; value: string };
export type Density = "quiet" | "balanced" | "ornate";
export type ThemeId =
  | "classic" | "royal" | "eastern" | "abyssal" | "crystal" | "nether" | "ocean"
  | "verdant" | "ancient" | "arcanotech" | "assassin" | "celestial"
  | "ultimate_skyblock" | "furfsky" | "hypixel_plus" | "spartan_weaponry"
  | "dragonsteel" | "simply_swords";
export type Recipe = {
  theme: ThemeId | "auto";
  density: Density;
  groups: Record<GroupId, PartRule>;
};
export type Choice = { id: string; label: string };

export const BLADE_LABELS: Record<Silhouette, string> = {
  straight: "ロングソード", claymore: "クレイモア", zweihander: "ツヴァイヘンダー", gladius: "グラディウス",
  dagger: "ダガー", estoc: "エストック", rapier: "レイピア", katana: "刀", nodachi: "野太刀", tanto: "短刀",
  sabre: "サーベル", scimitar: "シミター", cutlass: "カトラス", falchion: "ファルシオン", khopesh: "コペシュ",
  cleaver: "クリーバー", macuahuitl: "マクアフティル", flamberge: "フランベルジュ", kris: "クリス",
  twinblade: "双刃", spear: "槍", glaive: "グレイブ",
  jian: "剣 / Jian", whip: "軟剣 / Whip", liuyedao: "柳葉刀 / Willow Leaf",
  uchigatana: "打刀 / Uchigatana", nine_ring: "九環刀 / Nine Ring",
  trident: "三叉槍 / Trident", battleaxe: "戦斧 / Battleaxe", warpick: "戦嘴 / Warpick",
  mace: "重槌 / Mace", bow: "弓 / Bow", pickaxe: "採掘鶴嘴 / Pickaxe",
  essence: "純能量体 / Essence", lotus: "蓮華 / Lotus", geode: "晶洞 / Geode",
  ribbon: "絹流し / Ribbon", spine: "龍骨 / Spine", fractured: "破断剣 / Fractured",
  obelisk: "石碑刃 / Obelisk", fang: "牙 / Fang", sakura: "夜桜 / Sakura",
};
export const GUARD_LABELS: Record<GuardStyle, string> = {
  straight: "ストレート", wings: "ウィング", swept: "下反り", cross: "クロス", round: "円形", tsuba: "透かし鍔",
  crescent: "クレセント", shell: "シェル", rapier: "バスケット", hooked: "鉤付き", jagged: "鋸形", barbed: "有刺", dread: "デモニック",
  jian: "剣格 / Jian", sigil: "神紋 / Sigil", asymmetric: "非対称 / Asymmetric", none: "鍔なし / None",
};
export const GRIP_LABELS: Record<HandleStyle, string> = {
  smooth: "スムース", leather: "革巻き", wire: "金属巻き", cord: "紐巻き", ribbed: "段付き", studded: "鋲打ち",
  chain: "鎖巻き", dragon_scale: "竜鱗", gold_ribbon: "金糸巻き", bone: "骨細工", wrapped_parchment: "組紐巻き",
};
export const POMMEL_LABELS: Record<PommelStyle, string> = {
  round: "丸型", orb: "宝珠", disc: "円盤", gem: "宝石", ring: "環", crescent: "三日月", wing: "翼", skull: "髑髏", fang: "牙", spiked: "棘",
  tassel: "剣穂 / Tassel", chain: "鎖 / Chain", flattened: "平頭 / Flattened",
};
export const ELEMENT_LABELS: Record<Element, string> = {
  none: "無属性", flame: "炎", frost: "氷", lightning: "雷", holy: "聖", void: "虚無", shadow: "影",
  blood: "血", poison: "毒", nature: "緑", ocean: "海", arcane: "魔術",
};
export const ELEMENT_ACCENTS: Record<Element, string> = {
  none: "#b7c1d1", flame: "#ff9960", frost: "#85dce9", void: "#ba98ec", holy: "#f1d28b", lightning: "#b4bcff",
  poison: "#a6d584", shadow: "#aa88bd", blood: "#e28696", arcane: "#c1a4f1", nature: "#96cf84", ocean: "#7cc7cf",
};

export type BladeProfile = {
  width: readonly [number, number]; length: readonly [number, number];
  guard: number; handle: number; slim: boolean;
  guards: readonly GuardStyle[]; grips: readonly HandleStyle[]; theme: ThemeId;
};
const P = (width: [number, number], length: [number, number], guard: number, handle: number, slim: boolean, guards: GuardStyle[], grips: HandleStyle[], theme: ThemeId): BladeProfile =>
  ({ width, length, guard, handle, slim, guards, grips, theme });
export const BLADE_PROFILES: Record<Silhouette, BladeProfile> = {
  straight:   P([2, 3], [9, 11], 4, 3, false, ["straight", "cross", "wings", "swept"], ["leather", "wire", "cord"], "classic"),
  claymore:   P([3, 4], [10, 12], 5, 4, false, ["cross", "wings", "barbed", "jagged", "swept"], ["leather", "wire", "bone", "ribbed"], "royal"),
  zweihander: P([3, 3], [11, 12], 5, 5, false, ["cross", "straight", "swept"], ["leather", "ribbed", "cord"], "royal"),
  gladius:    P([2, 3], [7, 9], 3, 3, false, ["straight", "round", "disc" as GuardStyle].filter((g) => g !== "disc") as GuardStyle[], ["ribbed", "leather", "smooth"], "ancient"),
  dagger:     P([2, 2], [5, 7], 2, 2, true, ["straight", "crescent", "swept"], ["leather", "wire", "smooth", "cord"], "assassin"),
  estoc:      P([1, 1], [11, 12], 3, 4, true, ["cross", "straight"], ["wire", "leather"], "classic"),
  rapier:     P([1, 1], [11, 12], 3, 3, true, ["rapier", "shell", "cross"], ["wire", "gold_ribbon", "leather"], "royal"),
  katana:     P([1, 2], [10, 12], 2, 4, true, ["tsuba", "round", "straight"], ["wrapped_parchment", "cord", "leather"], "eastern"),
  nodachi:    P([1, 2], [12, 12], 2, 5, true, ["tsuba", "round"], ["wrapped_parchment", "cord"], "eastern"),
  tanto:      P([1, 2], [5, 6], 2, 3, true, ["tsuba", "round", "straight"], ["wrapped_parchment", "cord", "smooth"], "assassin"),
  sabre:      P([2, 2], [9, 11], 3, 3, false, ["shell", "swept", "rapier"], ["leather", "wire", "cord"], "classic"),
  scimitar:   P([2, 3], [8, 10], 3, 3, false, ["crescent", "wings", "straight"], ["leather", "gold_ribbon", "cord"], "eastern"),
  cutlass:    P([2, 3], [7, 9], 3, 3, false, ["shell", "rapier", "crescent"], ["leather", "wire", "cord"], "classic"),
  falchion:   P([2, 3], [8, 9], 3, 3, false, ["straight", "swept", "crescent"], ["leather", "ribbed", "studded"], "ancient"),
  khopesh:    P([2, 2], [8, 10], 2, 3, false, ["straight", "round"], ["leather", "gold_ribbon", "smooth"], "ancient"),
  cleaver:    P([3, 4], [7, 9], 2, 3, false, ["straight", "hooked", "jagged"], ["leather", "studded", "chain", "bone"], "abyssal"),
  macuahuitl: P([3, 3], [7, 9], 1, 3, false, ["straight", "round"], ["cord", "leather", "wrapped_parchment"], "ancient"),
  flamberge:  P([2, 3], [9, 11], 4, 4, false, ["cross", "wings", "dread", "swept"], ["leather", "bone", "dragon_scale"], "abyssal"),
  kris:       P([2, 2], [7, 9], 2, 3, true, ["crescent", "straight", "wings"], ["gold_ribbon", "cord", "leather"], "assassin"),
  twinblade:  P([3, 4], [8, 10], 4, 3, false, ["wings", "cross", "hooked"], ["wire", "leather", "chain"], "crystal"),
  spear:      P([2, 3], [5, 7], 1, 5, true, ["straight", "round"], ["smooth", "cord", "leather"], "classic"),
  glaive:     P([2, 3], [7, 9], 2, 5, false, ["straight", "hooked", "barbed"], ["leather", "bone", "cord"], "abyssal"),
  jian:       P([1, 2], [9, 11], 3, 3, true, ["jian", "sigil", "round", "straight"], ["cord", "smooth", "ribbed", "wrapped_parchment"], "classic"),
  whip:       P([1, 1], [10, 12], 2, 3, true, ["jian", "round", "crescent"], ["cord", "smooth"], "assassin"),
  liuyedao:   P([2, 3], [8, 10], 3, 3, false, ["crescent", "round", "jian", "straight"], ["cord", "leather", "ribbed"], "ancient"),
  uchigatana: P([1, 2], [10, 12], 2, 4, true, ["tsuba", "round", "straight"], ["wrapped_parchment", "cord", "leather"], "eastern"),
  nine_ring:  P([2, 3], [8, 10], 3, 3, false, ["round", "straight", "jian", "crescent"], ["cord", "leather", "ribbed"], "ancient"),
  trident:    P([2, 3], [8, 11], 3, 4, false, ["wings", "crescent", "straight"], ["cord", "wire", "leather"], "ocean"),
  battleaxe:  P([3, 4], [7, 9], 2, 4, false, ["straight", "hooked", "jagged", "barbed"], ["leather", "chain", "studded", "bone"], "abyssal"),
  warpick:    P([2, 3], [6, 8], 2, 4, false, ["straight", "hooked"], ["leather", "studded", "ribbed"], "ancient"),
  mace:       P([3, 4], [6, 8], 2, 4, false, ["straight", "round", "jagged"], ["leather", "cord", "ribbed"], "abyssal"),
  bow:        P([1, 2], [9, 12], 1, 3, true, ["straight", "round", "crescent"], ["cord", "leather", "wrapped_parchment"], "classic"),
  pickaxe:    P([2, 3], [6, 8], 2, 4, false, ["straight", "cross", "hooked"], ["leather", "cord", "ribbed"], "ancient"),
  essence:    P([2, 3], [9, 11], 1, 3, true, ["sigil", "wings", "none", "round", "crescent"], ["wire", "gold_ribbon", "smooth"], "celestial"),
  lotus:      P([2, 3], [8, 10], 2, 4, false, ["crescent", "round", "sigil"], ["wrapped_parchment", "gold_ribbon", "cord"], "eastern"),
  geode:      P([3, 4], [7, 9], 2, 3, false, ["round", "wings", "none", "crescent"], ["wire", "dragon_scale", "smooth"], "crystal"),
  ribbon:     P([1, 2], [10, 12], 1, 4, true, ["sigil", "none", "crescent"], ["gold_ribbon", "wrapped_parchment", "cord"], "celestial"),
  spine:      P([2, 3], [9, 11], 2, 3, false, ["barbed", "jagged", "none"], ["bone", "dragon_scale", "chain"], "abyssal"),
  fractured:  P([2, 3], [9, 11], 2, 3, false, ["straight", "asymmetric", "none"], ["chain", "bone", "wire"], "abyssal"),
  obelisk:    P([4, 4], [8, 10], 3, 3, false, ["straight", "cross", "sigil"], ["ribbed", "studded", "smooth"], "ancient"),
  fang:       P([2, 3], [8, 10], 2, 3, false, ["hooked", "crescent", "barbed"], ["leather", "bone", "dragon_scale"], "nether"),
  sakura:     P([1, 2], [9, 11], 2, 4, true, ["tsuba", "crescent", "none"], ["wrapped_parchment", "cord", "gold_ribbon"], "eastern"),
};

export type SilhouetteCategory = "all" | "standard" | "eastern" | "curved" | "heavy" | "formless";
export const SILHOUETTE_CATEGORIES: { id: SilhouetteCategory; label: string; items?: Silhouette[] }[] = [
  { id: "all", label: "すべて (49)" },
  { id: "standard", label: "直剣・西洋", items: ["straight", "claymore", "zweihander", "gladius", "dagger", "estoc", "rapier", "flamberge", "twinblade"] },
  { id: "eastern", label: "刀・東洋", items: ["katana", "nodachi", "tanto", "uchigatana", "jian", "liuyedao", "nine_ring", "whip"] },
  { id: "curved", label: "曲刀・異国", items: ["sabre", "scimitar", "cutlass", "falchion", "khopesh", "kris", "macuahuitl"] },
  { id: "heavy", label: "長柄・重武器", items: ["spear", "glaive", "trident", "battleaxe", "warpick", "mace", "cleaver", "pickaxe", "bow"] },
  { id: "formless", label: "異形・美", items: ["essence", "lotus", "geode", "ribbon", "spine", "fractured", "obelisk", "fang", "sakura"] },
];

export type SurfaceCategory = "all" | "steel" | "hamon" | "mineral" | "arcane" | "minecraft" | "packstyles";
export const SURFACE_CATEGORIES: { id: SurfaceCategory; label: string; items?: SurfaceStyle[] }[] = [
  { id: "all", label: "すべて (50)" },
  { id: "steel", label: "鍛造・鋼", items: ["polished", "damascus", "hammered", "etched", "worn", "gilded", "bevel", "warmith", "spartan_forge"] },
  { id: "hamon", label: "刃文・和刀", items: ["hamon", "suguha", "gunome", "choji", "notare", "inazuma", "kinsuji", "rengoku"] },
  { id: "mineral", label: "鉱物・生体", items: ["obsidian", "crystal", "amethyst", "prismarine", "jade", "banded", "bone", "wood", "scales", "dragonscale", "dragonbone"] },
  { id: "arcane", label: "魔術・神話", items: ["magma", "frost", "circuit", "starfield", "ender", "dualtone", "helix", "whorl", "divine", "nightflame", "luminous", "ifire", "stormforged"] },
  { id: "minecraft", label: "マイクラ系", items: ["vanilla", "vanilla_plus", "faithful", "skyblock"] },
  { id: "packstyles", label: "パック・Mod系", items: ["ultimate_skyblock", "furfsky", "hypixel_plus", "dragonsteel", "simply_runic"] },
];

export type PaletteKit = { id: string; label: string; element: Element; palette: Palette; accent: string; surfaces: SurfaceStyle[] };
function kit(id: string, label: string, element: Element, blade: string, edge: string, core: string, metal: string, accent: string, handle: string, surfaces: SurfaceStyle[]): PaletteKit {
  return { id, label, element, accent, surfaces, palette: {
    blade, bladeEdge: edge, bladeCore: core, guard: metal, guardAccent: accent,
    handle, handleAccent: core, pommel: metal, outline: "#141522", spur: core,
  } };
}
export const PALETTE_KITS: PaletteKit[] = [
  kit("silver", "月銀 / Moonsteel", "none", "#95a7bd", "#edf1f4", "#49596e", "#69798b", "#ccdbe7", "#282935", ["polished", "damascus", "hamon", "hammered", "suguha", "notare", "gunome", "bevel", "faithful", "vanilla_plus"]),
  kit("iron", "鍛鉄 / Iron", "none", "#8c8f96", "#dadde2", "#4a4d55", "#5e6068", "#b8bcc4", "#3a2e28", ["polished", "hammered", "worn", "damascus", "suguha", "gunome", "bevel", "vanilla_plus"]),
  kit("gold", "純金 / Gold", "holy", "#d6b45a", "#fff2c2", "#8a6a24", "#a67c2c", "#ffe9a8", "#3b2f2a", ["gilded", "polished", "etched", "divine", "luminous", "rengoku"]),
  kit("royal", "王金 / Sovereign", "holy", "#c5c1b2", "#fff9e8", "#7e808e", "#b99654", "#ead29d", "#343047", ["polished", "etched", "gilded", "divine", "luminous", "rengoku"]),
  kit("rosegold", "薔薇金 / Rose Gold", "holy", "#d4a08a", "#ffe6da", "#8a5a48", "#b07a60", "#f5cfc0", "#3a2a2e", ["polished", "etched", "gilded", "rengoku", "divine"]),
  kit("bronze", "青銅 / Bronze", "none", "#b08a5a", "#e8d0a0", "#5e4a2a", "#7a6236", "#c8a86a", "#2e2a26", ["worn", "hammered", "etched", "banded", "gunome", "kinsuji", "notare"]),
  kit("copper", "緑青 / Patina", "ocean", "#8fa892", "#dbeadb", "#3f5e52", "#a06a48", "#9fd9c0", "#2c2a2a", ["worn", "banded", "hammered", "notare", "gunome"]),
  kit("glacier", "氷晶 / Glacier", "frost", "#8dc9d8", "#e8ffff", "#396784", "#aa8d59", "#a6eeec", "#242638", ["frost", "crystal", "polished", "suguha", "luminous", "notare"]),
  kit("frostbone", "霜骨 / Frostbone", "frost", "#c9d6d8", "#f4fbfb", "#6c7f86", "#8c9aa0", "#c1ecf2", "#2a3038", ["bone", "frost", "worn", "gunome", "notare"]),
  kit("prismarine", "海晶 / Prismarine", "ocean", "#6fb3ad", "#d2f5ef", "#2f5f5e", "#8a9a70", "#9fe3d8", "#233238", ["prismarine", "scales", "polished", "whorl", "dragonscale"]),
  kit("abyss", "深海 / Abyss", "ocean", "#4f7a93", "#bfe3f2", "#22394a", "#5c6d78", "#7fc4dc", "#1c2430", ["scales", "banded", "worn", "whorl", "dragonscale", "dualtone"]),
  kit("jade", "翠玉 / Jade", "nature", "#89b7a1", "#def7e2", "#406c65", "#a28b57", "#b5deab", "#26352f", ["polished", "etched", "crystal", "divine", "whorl"]),
  kit("emerald", "翡翠 / Emerald", "nature", "#4fae7e", "#c9f5dc", "#1f5d43", "#7d7f5a", "#9be7b9", "#22302a", ["crystal", "polished", "whorl", "dragonscale"]),
  kit("venom", "毒緑 / Venom", "poison", "#8fb26a", "#e4f7c3", "#4a5e2c", "#5f6a52", "#c6ef8a", "#282c22", ["banded", "scales", "worn", "inazuma", "dualtone"]),
  kit("ember", "熾火 / Ember", "flame", "#99756e", "#ffe1ba", "#523e4a", "#946851", "#f7b378", "#2b222d", ["magma", "damascus", "hammered", "rengoku", "nightflame", "kinsuji"]),
  kit("netherite", "ネザライト / Netherite", "flame", "#5a4e52", "#b8a8a4", "#2c2426", "#3f3538", "#c9925a", "#241e20", ["banded", "worn", "magma", "nightflame", "rengoku", "choji"]),
  kit("obsidian", "黒曜 / Obsidian", "void", "#4a3d5e", "#c4b0e6", "#1d1628", "#3a3142", "#a67cf0", "#1c1822", ["obsidian", "ender", "crystal", "dualtone", "helix", "nightflame"]),
  kit("void", "宵闇 / Dusk", "void", "#746986", "#ddd2f0", "#373044", "#686179", "#b6a2e3", "#211e2c", ["obsidian", "starfield", "polished", "dualtone", "helix", "nightflame", "luminous"]),
  kit("ender", "終末 / Ender", "void", "#3a3244", "#b79ce8", "#17121e", "#2f2938", "#8f5fe0", "#16121c", ["ender", "obsidian", "starfield", "dualtone", "helix", "nightflame"]),
  kit("amethyst", "紫水晶 / Amethyst", "arcane", "#9f86c8", "#efe2ff", "#4f3c72", "#6c5c86", "#d8bcff", "#2a2434", ["amethyst", "crystal", "starfield", "dualtone", "whorl", "luminous"]),
  kit("astral", "星鋼 / Astral", "arcane", "#a293c1", "#efe7ff", "#534768", "#7d7095", "#cbb8f0", "#292333", ["starfield", "circuit", "polished", "divine", "luminous", "dualtone", "whorl"]),
  kit("blood", "紅鉄 / Crimson", "blood", "#926979", "#f4c9d0", "#4c2d43", "#706574", "#e19aa6", "#291e2b", ["damascus", "worn", "banded", "rengoku", "choji", "dualtone"]),
  kit("nightshade", "夜影 / Nightshade", "shadow", "#5c5670", "#c9c2dc", "#2b2738", "#48435a", "#9a8fbd", "#1d1a26", ["obsidian", "polished", "worn", "dualtone", "inazuma", "kinsuji"]),
  kit("stormsteel", "嵐鋼 / Stormsteel", "lightning", "#8f9bbf", "#e9edff", "#3f4870", "#636a8c", "#c5ceff", "#262a3a", ["circuit", "polished", "damascus", "inazuma", "dualtone", "divine"]),
  kit("sakura", "桜 / Sakura", "nature", "#d9b4bf", "#fff0f3", "#7d5a66", "#8d7a70", "#f6c9d3", "#332a30", ["hamon", "polished", "etched", "choji", "suguha", "rengoku", "divine"]),
  kit("driftwood", "流木 / Driftwood", "nature", "#a8927a", "#e6d7c2", "#5e4c3c", "#6f6154", "#c7b092", "#2e2823", ["wood", "worn", "gunome"]),
];

export type Theme = {
  id: ThemeId; label: string; name: string; description: string;
  blades: Silhouette[]; palettes: string[]; elements: Element[]; pommels: PommelStyle[];
  guards: GuardStyle[]; grips: HandleStyle[]; surfaces: SurfaceStyle[];
};
export const THEMES: Theme[] = [
  { id: "classic", label: "クラシック", name: "Tempered", description: "輪郭と金属の質感を主役に。", blades: ["straight", "dagger", "cutlass", "spear", "sabre", "estoc", "jian", "bow"], palettes: ["silver", "iron", "royal"], elements: ["none", "frost"], pommels: ["round", "ring", "disc", "tassel"], guards: ["straight", "cross", "rapier", "round", "swept", "shell", "jian"], grips: ["leather", "wire", "smooth", "cord"], surfaces: ["polished", "hammered", "damascus", "worn", "vanilla", "vanilla_plus", "faithful", "bevel", "suguha", "notare"] },
  { id: "royal", label: "ロイヤル", name: "Sovereign", description: "整った刀身に、控えめな金細工。", blades: ["straight", "claymore", "rapier", "zweihander", "lotus"], palettes: ["royal", "gold", "silver", "rosegold"], elements: ["holy", "lightning", "none"], pommels: ["gem", "round", "orb", "flattened"], guards: ["cross", "wings", "rapier", "straight", "shell", "sigil"], grips: ["wire", "gold_ribbon", "leather", "ribbed"], surfaces: ["polished", "etched", "gilded", "bevel", "vanilla", "divine", "luminous", "skyblock"] },
  { id: "eastern", label: "オリエンタル", name: "Silent", description: "反りのある刃と、小ぶりな鍔。", blades: ["katana", "nodachi", "tanto", "scimitar", "uchigatana", "lotus", "sakura", "liuyedao"], palettes: ["silver", "sakura", "jade", "glacier"], elements: ["none", "frost", "lightning", "nature"], pommels: ["ring", "round", "disc", "chain", "tassel"], guards: ["tsuba", "round", "crescent", "straight"], grips: ["wrapped_parchment", "cord", "leather", "gold_ribbon"], surfaces: ["hamon", "damascus", "polished", "vanilla", "faithful", "suguha", "gunome", "choji", "notare", "inazuma", "kinsuji", "rengoku"] },
  { id: "abyssal", label: "アビサル", name: "Duskborn", description: "重い刀身に、ひとつの鋭いアクセント。", blades: ["claymore", "flamberge", "glaive", "cleaver", "battleaxe", "mace", "spine", "fractured"], palettes: ["void", "blood", "ember", "obsidian", "nightshade"], elements: ["void", "shadow", "blood", "flame"], pommels: ["fang", "spiked", "skull", "chain"], guards: ["jagged", "barbed", "dread", "cross", "hooked", "asymmetric"], grips: ["bone", "dragon_scale", "leather", "chain"], surfaces: ["obsidian", "damascus", "worn", "banded", "bone", "ender", "ifire", "helix", "nightflame", "dualtone"] },
  { id: "crystal", label: "クリスタル", name: "Frostbound", description: "透き通る寒色と、小さな結晶の装飾。", blades: ["straight", "claymore", "twinblade", "estoc", "geode"], palettes: ["glacier", "amethyst", "astral", "emerald"], elements: ["frost", "arcane"], pommels: ["gem", "ring", "orb"], guards: ["straight", "wings", "cross", "round"], grips: ["wire", "smooth", "leather"], surfaces: ["crystal", "frost", "amethyst", "starfield", "luminous", "dragonscale", "skyblock"] },
  { id: "nether", label: "ネザー", name: "Infernal", description: "焦げた鋼と、溶岩の割れ目。", blades: ["cleaver", "claymore", "falchion", "glaive", "fang", "battleaxe"], palettes: ["netherite", "ember", "obsidian"], elements: ["flame", "blood", "shadow"], pommels: ["spiked", "skull", "round"], guards: ["jagged", "barbed", "straight", "hooked"], grips: ["chain", "studded", "leather", "bone"], surfaces: ["magma", "banded", "worn", "bone", "ifire", "nightflame", "dragonscale"] },
  { id: "ocean", label: "オーシャン", name: "Tidecaller", description: "海晶のタイルと、鱗の光沢。", blades: ["scimitar", "spear", "cutlass", "falchion", "jian", "trident"], palettes: ["prismarine", "abyss", "copper"], elements: ["ocean", "frost"], pommels: ["orb", "round", "crescent", "tassel"], guards: ["shell", "crescent", "round", "straight"], grips: ["cord", "wire", "leather"], surfaces: ["prismarine", "scales", "worn", "bevel", "whorl", "dragonscale"] },
  { id: "verdant", label: "ヴァーダント", name: "Wildgrown", description: "翠玉と木目、生きた曲線。", blades: ["kris", "gladius", "spear", "scimitar", "lotus", "bow"], palettes: ["jade", "emerald", "driftwood", "venom"], elements: ["nature", "poison"], pommels: ["orb", "round", "wing", "tassel"], guards: ["crescent", "wings", "straight", "round"], grips: ["cord", "wrapped_parchment", "leather"], surfaces: ["wood", "etched", "crystal", "scales", "jade", "whorl", "dragonscale"] },
  { id: "ancient", label: "エンシェント", name: "Relic", description: "青銅と摩耗、遺跡から掘り出した刃。", blades: ["gladius", "khopesh", "falchion", "macuahuitl", "nine_ring", "jian", "warpick", "pickaxe", "obelisk"], palettes: ["bronze", "copper", "iron", "driftwood"], elements: ["none", "nature", "holy"], pommels: ["disc", "round", "ring", "tassel", "flattened"], guards: ["straight", "round", "swept", "jian", "none"], grips: ["ribbed", "cord", "leather", "studded"], surfaces: ["worn", "hammered", "banded", "etched", "bone", "bevel", "gunome", "kinsuji"] },
  { id: "arcanotech", label: "アルカノテック", name: "Resonant", description: "回路と星鋼、静かに脈打つ光。", blades: ["straight", "twinblade", "estoc", "claymore", "obelisk", "geode"], palettes: ["stormsteel", "astral", "amethyst"], elements: ["lightning", "arcane"], pommels: ["gem", "orb", "disc", "chain", "flattened"], guards: ["cross", "wings", "hooked", "straight", "sigil", "round"], grips: ["wire", "ribbed", "smooth"], surfaces: ["circuit", "starfield", "polished", "stormforged", "divine", "dualtone", "whorl"] },
  { id: "assassin", label: "アサシン", name: "Whisper", description: "黒と細身、影に溶ける短刀。", blades: ["dagger", "tanto", "kris", "sabre", "whip", "jian", "fang"], palettes: ["nightshade", "iron", "obsidian"], elements: ["shadow", "poison", "none"], pommels: ["ring", "round", "fang", "chain"], guards: ["straight", "swept", "crescent", "tsuba", "none"], grips: ["cord", "leather", "wire", "wrapped_parchment"], surfaces: ["obsidian", "polished", "worn", "ender", "bevel", "dualtone", "kinsuji", "inazuma"] },
  { id: "celestial", label: "セレスティアル", name: "Dawnbringer", description: "白金と光、星を宿す刃。", blades: ["straight", "rapier", "claymore", "spear", "jian", "essence", "ribbon"], palettes: ["gold", "royal", "rosegold", "astral"], elements: ["holy", "arcane"], pommels: ["gem", "wing", "orb", "flattened"], guards: ["wings", "cross", "shell", "straight", "sigil", "crescent", "none"], grips: ["gold_ribbon", "wire", "ribbed", "cord"], surfaces: ["gilded", "starfield", "etched", "polished", "faithful", "vanilla", "warmith", "divine", "luminous", "rengoku"] },
  // Named pack-school profiles. These are design grammars, not copied assets.
  { id: "ultimate_skyblock", label: "Ultimate SkyBlock", name: "Relic Atlas", description: "Every drop gets a readable identity: dark UI, crisp silhouette, rarity accent.", blades: ["straight", "claymore", "katana", "dagger", "bow", "trident", "mace", "essence"], palettes: ["royal", "glacier", "amethyst", "astral", "gold", "netherite"], elements: ["none", "void", "arcane", "holy", "lightning"], pommels: ["gem", "orb", "ring", "flattened"], guards: ["straight", "cross", "wings", "sigil", "round", "none"], grips: ["wire", "leather", "gold_ribbon", "wrapped_parchment"], surfaces: ["ultimate_skyblock", "skyblock", "faithful", "crystal", "gilded", "luminous"] },
  { id: "furfsky", label: "FurfSky Essence", name: "Dungeon Relics", description: "16x clarity with item-specific identity, gem facets and compact emissive accents.", blades: ["straight", "claymore", "scimitar", "dagger", "rapier", "katana", "spear", "bow"], palettes: ["amethyst", "abyss", "glacier", "jade", "astral", "blood"], elements: ["void", "arcane", "frost", "poison", "blood"], pommels: ["gem", "fang", "orb", "ring"], guards: ["straight", "wings", "crescent", "round", "rapier", "sigil", "none"], grips: ["wire", "leather", "cord", "dragon_scale"], surfaces: ["furfsky", "ultimate_skyblock", "crystal", "simply_runic", "luminous", "ender"] },
  { id: "hypixel_plus", label: "Hypixel+", name: "Vanilla Plus", description: "Vanilla readability first, cleaner values and a single authored accent per item.", blades: ["straight", "gladius", "sabre", "claymore", "dagger", "bow", "battleaxe", "pickaxe"], palettes: ["silver", "iron", "gold", "diamond", "netherite", "bronze"], elements: ["none", "holy", "frost"], pommels: ["round", "ring", "gem", "flattened"], guards: ["straight", "cross", "round", "wings", "swept", "none"], grips: ["leather", "smooth", "cord", "ribbed"], surfaces: ["hypixel_plus", "vanilla", "faithful", "bevel", "polished", "spartan_forge"] },
  { id: "spartan_weaponry", label: "Spartan Weaponry", name: "Arsenal", description: "Every weapon type has a role: reach, sweep, thrown, two-handed, or precise.", blades: ["dagger", "straight", "zweihander", "katana", "sabre", "rapier", "spear", "glaive", "battleaxe", "warpick", "bow", "pickaxe"], palettes: ["iron", "bronze", "silver", "royal", "copper", "netherite"], elements: ["none", "flame", "lightning", "poison"], pommels: ["round", "disc", "ring", "flattened"], guards: ["straight", "cross", "swept", "hooked", "jagged", "shell"], grips: ["leather", "studded", "cord", "chain", "ribbed"], surfaces: ["spartan_forge", "hammered", "worn", "damascus", "bevel", "faithful"] },
  { id: "dragonsteel", label: "Ice & Fire: Dragonsteel", name: "Dragonforge", description: "A forged base material with three elemental bloodlines: fire, ice, and lightning.", blades: ["straight", "claymore", "zweihander", "glaive", "fang", "spine", "battleaxe", "mace"], palettes: ["ember", "glacier", "stormsteel", "netherite", "frostbone"], elements: ["flame", "frost", "lightning"], pommels: ["fang", "spiked", "gem", "orb"], guards: ["straight", "dread", "barbed", "wings", "jagged", "sigil"], grips: ["dragon_scale", "bone", "chain", "leather"], surfaces: ["dragonsteel", "dragonbone", "dragonscale", "ifire", "magma", "frost", "stormforged"] },
  { id: "simply_swords", label: "Simply Swords", name: "Runic Arsenal", description: "Weapon variants, runic powers, sockets and unique-loot identity without losing Minecraft readability.", blades: ["straight", "claymore", "cutlass", "glaive", "battleaxe", "mace", "katana", "rapier", "spear", "twinblade", "sabre", "whip"], palettes: ["iron", "gold", "diamond", "netherite", "amethyst", "ember", "glacier"], elements: ["none", "flame", "frost", "lightning", "nature", "arcane"], pommels: ["gem", "orb", "ring", "fang", "tassel"], guards: ["straight", "wings", "cross", "rapier", "crescent", "sigil"], grips: ["leather", "wire", "cord", "dragon_scale", "gold_ribbon"], surfaces: ["simply_runic", "damascus", "gilded", "circuit", "crystal", "dragonsteel", "luminous"] },
];

const choices = (labels: Record<string, string>): Choice[] => Object.entries(labels).map(([id, label]) => ({ id, label }));
export const GROUPS: Record<GroupId, { label: string; english: string; description: string; choices: Choice[] }> = {
  blade: { label: "刀身", english: "Blade", description: "型・刃の幅・長さを固定", choices: choices(BLADE_LABELS) },
  guard: { label: "鍔と宝石", english: "Guard", description: "鍔の形・幅・宝石・彫金を固定", choices: choices(GUARD_LABELS) },
  grip: { label: "柄・柄頭", english: "Grip", description: "柄巻き・長さ・柄頭・口金を固定", choices: choices(GRIP_LABELS) },
  palette: { label: "配色", english: "Palette", description: "刃・柄・宝石・ルーンなど全色を固定", choices: PALETTE_KITS.map(({ id, label }) => ({ id, label })) },
  element: { label: "属性", english: "Element", description: "属性とその強さを固定", choices: choices(ELEMENT_LABELS) },
  attachments: { label: "アタッチメント", english: "Attachment", description: "トゲ・骨・結晶・鋸刃と数量を固定", choices: [
    { id: "none", label: "装飾なし" }, { id: "spurs", label: "ブレードスパイク" }, { id: "bone", label: "ボーンスパイク" },
    { id: "crystals", label: "結晶インレイ" }, { id: "serrated", label: "鋸刃" },
  ] },
  finish: { label: "素材・仕上げ", english: "Finish", description: "表面模様・溝・ルーン・陰影を固定", choices: [
    { id: "fullered", label: "樋 / Fullered" }, { id: "runic", label: "ルーン彫刻 / Runic" },
    ...choices(SURFACE_LABELS),
  ] },
  effects: { label: "エフェクト", english: "Effects", description: "発光・粒子・光沢などの全設定を固定", choices: [
    { id: "none", label: "エフェクトなし" }, { id: "subtle", label: "静かな光沢" },
    { id: "elemental", label: "属性の輝き" }, { id: "runic", label: "ルーンの脈動" },
    { id: "lightning", label: "稲妻" }, { id: "orbit", label: "浮遊する欠片" }, { id: "hologram", label: "偏光シマー" },
  ] },
};

export function createRecipe(): Recipe {
  return { theme: "auto", density: "balanced", groups: Object.fromEntries(GROUP_IDS.map((id) => [id, { mode: "auto", value: GROUPS[id].choices[0].id }])) as Recipe["groups"] };
}

export function parseRecipe(value: unknown): Recipe {
  const result = createRecipe();
  if (!value || typeof value !== "object") return result;
  const v = value as Partial<Recipe>;
  if (v.theme === "auto" || THEMES.some((t) => t.id === v.theme)) result.theme = v.theme!;
  if (["quiet", "balanced", "ornate"].includes(v.density ?? "")) result.density = v.density!;
  for (const id of GROUP_IDS) {
    const rule = v.groups?.[id];
    if (!rule || !["auto", "keep", "pick"].includes(rule.mode)) continue;
    if (!GROUPS[id].choices.some((c) => c.id === rule.value)) continue;
    result.groups[id] = { mode: rule.mode, value: rule.value };
  }
  return result;
}
