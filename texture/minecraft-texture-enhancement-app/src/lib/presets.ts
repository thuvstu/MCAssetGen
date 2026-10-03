import type { Values } from "./effects";

export interface PresetFx { id: string; amount?: number; values?: Values }
export interface Preset {
  id: string;
  name: string;
  en: string;
  desc: string;
  tex: string;
  size: number;
  accent: string;
  fx: PresetFx[];
}

export const PRESETS: Preset[] = [
  {
    id: "legendary", name: "伝説の剣", en: "LEGENDARY BLADE", accent: "#ff9f2e",
    desc: "エンチャントの輝きとレアリティオーラを纏った英雄の武器",
    tex: "diamond_sword", size: 32,
    fx: [
      { id: "sharpen", values: { amt: 90 } },
      { id: "outline", values: { color: "#0e1a22", thick: 1, mode: "outer" } },
      { id: "bevel", values: { amt: 55, angle: 315 } },
      { id: "rarityAura", values: { rarity: "legendary", radius: 4, intensity: 105, speed: 1.4 } },
      { id: "enchantGlint", values: { speed: 1.2, width: 10, intensity: 95, bands: 2 } },
      { id: "bloom", values: { threshold: 150, radius: 3, intensity: 95 } },
    ],
  },
  {
    id: "relic", name: "古代の遺物", en: "ARCANE RELIC", accent: "#63d8ff",
    desc: "ルーン文字が明滅する、遺跡から出土した石板",
    tex: "end_stone", size: 32,
    fx: [
      { id: "cracks", values: { count: 5, depth: 20 } },
      { id: "grime", values: { amount: 45, edges: true } },
      { id: "sepia", values: { amt: 35 } },
      { id: "runes", values: { color: "#63d8ff", count: 3, glow: 70, speed: 0.9 } },
      { id: "innerShadow", values: { size: 5, op: 60 } },
      { id: "vignette", values: { amount: 55, radius: 55 } },
    ],
  },
  {
    id: "ruin", name: "苔むす廃墟", en: "MOSSY RUIN", accent: "#b6e14f",
    desc: "風に削られ苔に覆われた古い石畳",
    tex: "cobblestone", size: 32,
    fx: [
      { id: "moss", values: { coverage: 52, topOnly: false, scale: 8 } },
      { id: "grime", values: { amount: 55, color: "#241c12" } },
      { id: "erosion", values: { amount: 34, mode: "tatter", scale: 5 } },
      { id: "bevel", values: { amt: 62, angle: 300 } },
      { id: "vibrance", values: { amt: 30 } },
      { id: "vignette", values: { amount: 34, radius: 66 } },
    ],
  },
  {
    id: "nether", name: "ネザーの灼熱", en: "NETHER HEAT", accent: "#ff5a2b",
    desc: "溶岩の脈が脈動し火の粉が舞う灼熱の岩",
    tex: "netherrack", size: 32,
    fx: [
      { id: "lavaCracks", values: { count: 6, glow: 85, speed: 1.4 } },
      { id: "temperature", values: { amt: 45 } },
      { id: "cracks", values: { count: 4, color: "#180a06", depth: 22 } },
      { id: "ember", values: { count: 34, speed: 1.4, glow: true } },
      { id: "bloom", values: { threshold: 120, radius: 4, intensity: 130 } },
      { id: "vignette", values: { amount: 40, color: "#2a0600" } },
    ],
  },
  {
    id: "frosted", name: "凍てつく氷霜", en: "FROSTBOUND", accent: "#8fd8ff",
    desc: "霜の結晶が縁を覆い、雪が降り積もる",
    tex: "iron_block", size: 32,
    fx: [
      { id: "frost", values: { amount: 62, crystal: 60, edge: 70 } },
      { id: "temperature", values: { amt: -40 } },
      { id: "snowfall", values: { count: 20, size: 1, frost: true, speed: 0.7 } },
      { id: "innerGlow", values: { color: "#dff4ff", size: 4, intensity: 60 } },
      { id: "chromatic", values: { amount: 1, edgeOnly: true } },
      { id: "sharpen", values: { amt: 80 } },
    ],
  },
  {
    id: "retrogb", name: "レトロ携帯機", en: "RETRO HANDHELD", accent: "#9bbc0f",
    desc: "4階調グリーン＋ディザの懐かしゲーム機風",
    tex: "grass_top", size: 16,
    fx: [
      { id: "grayscale", values: { amt: 100 } },
      { id: "levels", values: { bin: 12, win: 236 } },
      { id: "gradientMap", values: { c1: "#0f380f", c2: "#306230", c3: "#9bbc0f", amt: 100 } },
      { id: "ditherBayer", values: { order: "2", colors: 4, spread: 60 } },
      { id: "scanline", values: { gap: 2, op: 22 } },
    ],
  },
  {
    id: "cyberholo", name: "サイバー・ホロ", en: "CYBER HOLO", accent: "#37d6c4",
    desc: "ホログラム箔とグリッチが走る近未来チップ",
    tex: "diamond_block", size: 32,
    fx: [
      { id: "circuit", values: { density: 6, glow: 70, speed: 1.2 } },
      { id: "holographic", values: { intensity: 85, speed: 1, scale: 14 } },
      { id: "chromatic", values: { amount: 1.5, edgeOnly: true } },
      { id: "glitch", values: { amount: 22, slices: 5, speed: 5 } },
      { id: "bloom", values: { threshold: 160, radius: 3, intensity: 110 } },
      { id: "hexPattern", values: { size: 6, op: 22 } },
    ],
  },
  {
    id: "royal", name: "王家の黄金", en: "ROYAL GOLD", accent: "#ffe066",
    desc: "金箔押しと豪華な額縁、宝石を嵌めた至宝",
    tex: "gold_block", size: 32,
    fx: [
      { id: "frame", values: { style: "ornate", thick: 3, color: "#8c5a12", shade: 75 } },
      { id: "embossGold", values: { amount: 70, angle: 315 } },
      { id: "gemInlay", values: { color: "#e0405a", count: 4, size: 2, shine: true } },
      { id: "lightSweep", values: { speed: 0.7, width: 10, intensity: 90 } },
      { id: "bloom", values: { threshold: 190, radius: 3, intensity: 90 } },
      { id: "rivets", values: { spacing: 7, size: 1, inset: 4 } },
    ],
  },
  {
    id: "dream", name: "ドリームポップ", en: "DREAM POP", accent: "#ef5f8c",
    desc: "虹色の薄膜ときらめきに包まれた夢見心地",
    tex: "wool", size: 32,
    fx: [
      { id: "iridescent", values: { amount: 85, scale: 14, angle: 40, speed: 0.6 } },
      { id: "vibrance", values: { amt: 60 } },
      { id: "sparkle", values: { count: 16, size: 2, speed: 1.4 } },
      { id: "bloom", values: { threshold: 130, radius: 4, intensity: 120 } },
      { id: "wetLook", values: { amount: 40, spec: 45 } },
    ],
  },
  {
    id: "cursed", name: "呪われし鉱石", en: "CURSED ORE", accent: "#b45cff",
    desc: "紫の二色調とグリッチが滲む禁忌の鉱石",
    tex: "diamond_ore", size: 32,
    fx: [
      { id: "duotone", values: { dark: "#160a2c", light: "#b45cff", amt: 70 } },
      { id: "outerGlow", values: { color: "#8a2be2", radius: 5, intensity: 110 } },
      { id: "runes", values: { color: "#e0a8ff", count: 2, scale: 1, glow: 55, speed: 1.4 } },
      { id: "glitch", values: { amount: 18, slices: 4, speed: 3, rgbSplit: true } },
      { id: "soulFlame", values: { c1: "#e6c8ff", c2: "#6a2bd0", intensity: 70, reach: 4 } },
    ],
  },
  {
    id: "antique", name: "アンティーク絵画", en: "ANTIQUE", accent: "#c9a227",
    desc: "セピアのシミと傷、額縁入りの古美術品",
    tex: "oak_planks", size: 32,
    fx: [
      { id: "sepia", values: { amt: 70 } },
      { id: "scratches", values: { count: 22, op: 40 } },
      { id: "grain", values: { amt: 22, cell: 1 } },
      { id: "grime", values: { amount: 38, edges: true } },
      { id: "frame", values: { style: "gold", thick: 2, color: "#8a6a2c", shade: 70 } },
      { id: "vignette", values: { amount: 52, radius: 58 } },
    ],
  },
  {
    id: "forge", name: "溶岩の鍛造", en: "MAGMA FORGE", accent: "#ff7a2b",
    desc: "錆びた鉄に溶岩の亀裂が走る鍛冶の名残",
    tex: "iron_block", size: 32,
    fx: [
      { id: "brushedMetal", values: { amount: 55, specular: true } },
      { id: "rust", values: { amount: 55, pits: true } },
      { id: "lavaCracks", values: { count: 4, glow: 60, speed: 0.8 } },
      { id: "bevel", values: { amt: 45, angle: 300 } },
      { id: "ember", values: { count: 18, speed: 0.8 } },
      { id: "temperature", values: { amt: 28 } },
    ],
  },
  {
    id: "divine", name: "神性の輝き", en: "DIVINE", accent: "#ffe066",
    desc: "魔法陣とオーラ、光の帯が巡る聖遺物",
    tex: "emerald_gem", size: 48,
    fx: [
      { id: "rarityAura", values: { rarity: "divine", radius: 6, intensity: 130, speed: 1 } },
      { id: "sigil", values: { color: "#ffe066", rings: 2, ticks: 12, speed: 0.5, glow: 40 } },
      { id: "lightSweep", values: { speed: 0.5, width: 14, intensity: 110, color: "#fff6d0" } },
      { id: "sparkle", values: { count: 14, size: 2, speed: 1.6 } },
      { id: "bloom", values: { threshold: 140, radius: 4, intensity: 140 } },
      { id: "innerGlow", values: { color: "#fffbe6", size: 5, intensity: 90 } },
    ],
  },
  {
    id: "arcade", name: "アーケード筐体", en: "ARCADE CRT", accent: "#59a7ff",
    desc: "走査線とRGBマスク、滲みのあるブラウン管表示",
    tex: "tnt", size: 32,
    fx: [
      { id: "saturation", values: { amt: 35 } },
      { id: "crt", values: { scan: 42, mask: 30, bloom: 45, curve: 40, flicker: 18 } },
      { id: "chromatic", values: { amount: 1.2 } },
      { id: "scanline", values: { gap: 3, op: 18, bright: true } },
      { id: "bloom", values: { threshold: 150, radius: 2, intensity: 60 } },
    ],
  },
];
