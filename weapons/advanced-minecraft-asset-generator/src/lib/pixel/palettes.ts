import { fromHex, hsl, rgbToHsl, R, G, B } from "./core";

/** A ramp is 7 colors: 0 = outline (darkest) ... 6 = specular highlight */
export type Ramp = number[];
export type Material = {
  id: string;
  name: string;
  nameJa: string;
  primary: Ramp; // blade / head / main body
  secondary: Ramp; // guard, rings, trims
  grip: Ramp; // handle
  gem: Ramp; // gems / orbs / eyes
  glow: number; // effect color (aura, sparkles)
  rainbow?: boolean;
  tags: string[];
};

/**
 * Build a 7-step ramp from a base color.
 * Dark steps shift hue toward cool (negative) and light steps toward warm, like hand-painted pixel art.
 */
export function ramp(
  baseHex: string,
  o: { hueShift?: number; contrast?: number; satBoost?: number } = {},
): Ramp {
  const c = fromHex(baseHex);
  const [h, s, l] = rgbToHsl(R(c), G(c), B(c));
  const contrast = o.contrast ?? 1;
  const hs = o.hueShift ?? 0.04;
  const sb = o.satBoost ?? 0;
  const out: Ramp = [];
  const offsets = [-0.36, -0.24, -0.12, 0, 0.11, 0.22, 0.32];
  for (let i = 0; i < 7; i++) {
    const k = (i - 3) / 3; // -1..1
    const nl = Math.min(0.97, Math.max(0.04, l + offsets[i] * contrast));
    const nh = h - k * hs; // dark -> hue shifts one way, light -> the other
    const ns = Math.min(1, Math.max(0, s + sb + (i < 3 ? 0.08 * (3 - i) : -0.05 * (i - 3))));
    out.push(hsl(nh, ns, nl));
  }
  return out;
}

const WOOD = ramp("#7a4a22", { contrast: 0.9 });
const DARKWOOD = ramp("#4a2a16", { contrast: 0.9 });
const LEATHER = ramp("#5a3a2a", { contrast: 0.8 });
const GOLD = ramp("#e6b422", { hueShift: 0.06, contrast: 1.05 });
const SILVER = ramp("#b8c0cc", { hueShift: 0.02 });
const IRON = ramp("#9aa0a8", { hueShift: 0.02 });
const DARKSTEEL = ramp("#4b5160", { hueShift: 0.03 });
const OBSIDIAN = ramp("#2a1e3d", { contrast: 0.8 });
const BONE = ramp("#d9d2b8", { contrast: 0.8 });

export const MATERIALS: Material[] = [
  {
    id: "wood",
    name: "Wood",
    nameJa: "木",
    primary: WOOD,
    secondary: DARKWOOD,
    grip: LEATHER,
    gem: ramp("#7fbf4d"),
    glow: fromHex("#c9a86a"),
    tags: ["vanilla"],
  },
  {
    id: "stone",
    name: "Stone",
    nameJa: "石",
    primary: ramp("#8a8a8a", { hueShift: 0.0 }),
    secondary: ramp("#5f5f5f"),
    grip: WOOD,
    gem: ramp("#9bb0c2"),
    glow: fromHex("#cfcfcf"),
    tags: ["vanilla"],
  },
  {
    id: "iron",
    name: "Iron",
    nameJa: "鉄",
    primary: IRON,
    secondary: DARKSTEEL,
    grip: WOOD,
    gem: ramp("#5f9fdc"),
    glow: fromHex("#e8eef5"),
    tags: ["vanilla"],
  },
  {
    id: "gold",
    name: "Gold",
    nameJa: "金",
    primary: GOLD,
    secondary: ramp("#a8741a"),
    grip: WOOD,
    gem: ramp("#d94a4a"),
    glow: fromHex("#ffe680"),
    tags: ["vanilla"],
  },
  {
    id: "diamond",
    name: "Diamond",
    nameJa: "ダイヤモンド",
    primary: ramp("#4fdcd0", { hueShift: 0.05 }),
    secondary: ramp("#2a9ea0"),
    grip: WOOD,
    gem: ramp("#9ff4ff"),
    glow: fromHex("#b8fff8"),
    tags: ["vanilla"],
  },
  {
    id: "netherite",
    name: "Netherite",
    nameJa: "ネザライト",
    primary: ramp("#4a3f44", { hueShift: 0.02, contrast: 0.9 }),
    secondary: ramp("#6b5a5e"),
    grip: DARKWOOD,
    gem: ramp("#d85c3a"),
    glow: fromHex("#ff8a5c"),
    tags: ["vanilla"],
  },
  {
    id: "ruby",
    name: "Ruby",
    nameJa: "ルビー",
    primary: ramp("#d9304a", { hueShift: 0.05, satBoost: 0.1 }),
    secondary: GOLD,
    grip: DARKWOOD,
    gem: ramp("#ff6b7f"),
    glow: fromHex("#ff5a78"),
    tags: ["gem"],
  },
  {
    id: "sapphire",
    name: "Sapphire",
    nameJa: "サファイア",
    primary: ramp("#2f63d9", { hueShift: 0.05, satBoost: 0.1 }),
    secondary: SILVER,
    grip: DARKSTEEL,
    gem: ramp("#7fb0ff"),
    glow: fromHex("#78a8ff"),
    tags: ["gem"],
  },
  {
    id: "emerald",
    name: "Emerald",
    nameJa: "エメラルド",
    primary: ramp("#2fcf5a", { hueShift: 0.05, satBoost: 0.1 }),
    secondary: GOLD,
    grip: LEATHER,
    gem: ramp("#8dffb0"),
    glow: fromHex("#7cff9f"),
    tags: ["gem"],
  },
  {
    id: "amethyst",
    name: "Amethyst",
    nameJa: "アメジスト",
    primary: ramp("#9b5de5", { hueShift: 0.05 }),
    secondary: SILVER,
    grip: OBSIDIAN,
    gem: ramp("#d9a5ff"),
    glow: fromHex("#d59bff"),
    tags: ["gem"],
  },
  {
    id: "topaz",
    name: "Topaz",
    nameJa: "トパーズ",
    primary: ramp("#f0a030", { hueShift: 0.05 }),
    secondary: GOLD,
    grip: LEATHER,
    gem: ramp("#ffd27f"),
    glow: fromHex("#ffcc66"),
    tags: ["gem"],
  },
  {
    id: "dragon",
    name: "Dragon",
    nameJa: "ドラゴン",
    primary: ramp("#5a2a8a", { hueShift: 0.05 }),
    secondary: ramp("#c93cff", { hueShift: 0.04 }),
    grip: OBSIDIAN,
    gem: ramp("#ff4ad8"),
    glow: fromHex("#e05cff"),
    tags: ["special"],
  },
  {
    id: "wither",
    name: "Wither",
    nameJa: "ウィザー",
    primary: ramp("#1e1a22", { contrast: 0.8 }),
    secondary: BONE,
    grip: ramp("#2c2730"),
    gem: ramp("#5ef0c0"),
    glow: fromHex("#2c2c2c"),
    tags: ["special"],
  },
  {
    id: "holy",
    name: "Holy",
    nameJa: "聖",
    primary: ramp("#f4f0dc", { hueShift: 0.03, contrast: 0.85 }),
    secondary: GOLD,
    grip: ramp("#c8d8ff", { contrast: 0.7 }),
    gem: ramp("#7fdfff"),
    glow: fromHex("#fff6b0"),
    tags: ["special"],
  },
  {
    id: "blood",
    name: "Blood",
    nameJa: "ブラッド",
    primary: ramp("#7a0e1e", { hueShift: 0.03, satBoost: 0.15 }),
    secondary: ramp("#2b1a1a"),
    grip: ramp("#3a1212"),
    gem: ramp("#ff2a3a"),
    glow: fromHex("#ff1e3c"),
    tags: ["evil"],
  },
  {
    id: "void",
    name: "Void",
    nameJa: "虚空",
    primary: ramp("#1b1430", { contrast: 0.9 }),
    secondary: ramp("#4a2f8f"),
    grip: ramp("#0e0b18"),
    gem: ramp("#b36bff"),
    glow: fromHex("#7a3cff"),
    tags: ["evil"],
  },
  {
    id: "cursed",
    name: "Cursed",
    nameJa: "呪い",
    primary: ramp("#2e3d2a", { hueShift: 0.05 }),
    secondary: ramp("#6a8a3a"),
    grip: ramp("#1f2318"),
    gem: ramp("#aaff3a"),
    glow: fromHex("#9cff2e"),
    tags: ["evil"],
  },
  {
    id: "infernal",
    name: "Infernal",
    nameJa: "業火",
    primary: ramp("#3a1a14", { hueShift: 0.05 }),
    secondary: ramp("#ff6a1a", { hueShift: 0.08 }),
    grip: ramp("#1c0e0a"),
    gem: ramp("#ffd23a"),
    glow: fromHex("#ff7a2a"),
    tags: ["evil"],
  },
  {
    id: "frost",
    name: "Frost",
    nameJa: "氷結",
    primary: ramp("#b8ecff", { hueShift: 0.04, contrast: 0.85 }),
    secondary: ramp("#5aa4d8"),
    grip: ramp("#2e4a6a"),
    gem: ramp("#e0fbff"),
    glow: fromHex("#c8f4ff"),
    tags: ["magic"],
  },
  {
    id: "arcane",
    name: "Arcane",
    nameJa: "秘術",
    primary: ramp("#3f3a6e", { hueShift: 0.05 }),
    secondary: GOLD,
    grip: ramp("#2a2440"),
    gem: ramp("#5ce1ff"),
    glow: fromHex("#66d9ff"),
    tags: ["magic"],
  },
  {
    id: "nature",
    name: "Nature",
    nameJa: "自然",
    primary: ramp("#4f8a2f", { hueShift: 0.06 }),
    secondary: WOOD,
    grip: ramp("#3a5a24"),
    gem: ramp("#ffe36a"),
    glow: fromHex("#b8ff6a"),
    tags: ["magic"],
  },
  {
    id: "rainbow",
    name: "Rainbow / Prismatic",
    nameJa: "虹彩",
    primary: ramp("#e0e0f0", { contrast: 0.8 }),
    secondary: SILVER,
    grip: ramp("#3a3a4a"),
    gem: ramp("#ffffff"),
    glow: fromHex("#ffffff"),
    rainbow: true,
    tags: ["special"],
  },
  {
    id: "steel",
    name: "Tech Steel",
    nameJa: "機械鋼",
    primary: DARKSTEEL,
    secondary: ramp("#ff9a1a", { hueShift: 0.06 }),
    grip: ramp("#23262e"),
    gem: ramp("#39d4ff"),
    glow: fromHex("#39d4ff"),
    tags: ["tech"],
  },
  {
    id: "plasma",
    name: "Plasma Tech",
    nameJa: "プラズマ",
    primary: ramp("#e8ecf2", { contrast: 0.8 }),
    secondary: ramp("#1e2a3a"),
    grip: ramp("#2e3a4a"),
    gem: ramp("#36f0ff"),
    glow: fromHex("#3cf5ff"),
    tags: ["tech"],
  },
  {
    id: "bronze",
    name: "Bronze / Relic",
    nameJa: "青銅/遺物",
    primary: ramp("#a56f2f", { hueShift: 0.06 }),
    secondary: ramp("#5aa58a"),
    grip: LEATHER,
    gem: ramp("#5ce1c8"),
    glow: fromHex("#ffd27f"),
    tags: ["relic"],
  },
  {
    id: "bone",
    name: "Bone",
    nameJa: "骨",
    primary: BONE,
    secondary: ramp("#6a5a4a"),
    grip: LEATHER,
    gem: ramp("#ff5a3a"),
    glow: fromHex("#cfd0b0"),
    tags: ["evil"],
  },
  {
    id: "midas",
    name: "Midas",
    nameJa: "ミダス",
    primary: GOLD,
    secondary: ramp("#8a1a1a"),
    grip: ramp("#5a2a0a"),
    gem: ramp("#ff3a3a"),
    glow: fromHex("#fff0a0"),
    tags: ["skyblock"],
  },
  {
    id: "aspect",
    name: "Aspect of the End",
    nameJa: "エンド",
    primary: ramp("#9cf0c8", { hueShift: 0.04 }),
    secondary: ramp("#2a1e3d"),
    grip: ramp("#1a1226"),
    gem: ramp("#e0b4ff"),
    glow: fromHex("#c08cff"),
    tags: ["skyblock"],
  },
  {
    id: "livid",
    name: "Livid / Shadow",
    nameJa: "影",
    primary: ramp("#3a3550", { hueShift: 0.05 }),
    secondary: ramp("#8f88b8"),
    grip: ramp("#1e1a2a"),
    gem: ramp("#c7f7ff"),
    glow: fromHex("#a49cff"),
    tags: ["skyblock"],
  },
];

export const MATERIAL_MAP = Object.fromEntries(MATERIALS.map((m) => [m.id, m]));

export function getMaterial(id: string): Material {
  return MATERIAL_MAP[id] ?? MATERIALS[6];
}

/** Common editor palette (DB32-ish plus neon) */
export const EDITOR_PALETTE: string[] = [
  "#000000", "#222034", "#45283c", "#663931", "#8f563b", "#df7126", "#d9a066", "#eec39a",
  "#fbf236", "#99e550", "#6abe30", "#37946e", "#4b692f", "#524b24", "#323c39", "#3f3f74",
  "#306082", "#5b6ee1", "#639bff", "#5fcde4", "#cbdbfc", "#ffffff", "#9badb7", "#847e87",
  "#696a6a", "#595652", "#76428a", "#ac3232", "#d95763", "#d77bba", "#8f974a", "#8a6f30",
  "#ff2a6d", "#05d9e8", "#d1f7ff", "#ffd319", "#ff901f", "#b967ff", "#01cdfe", "#fffb96",
];
