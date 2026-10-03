export const RARITY_IDS = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "divine",
  "special",
  "very_special",
  "ultimate",
] as const;

export type Rarity = (typeof RARITY_IDS)[number];

export const RARITIES: Record<
  Rarity,
  { label: string; labelJa: string; color: string; glow: string; sparkle: number }
> = {
  common: { label: "COMMON", labelJa: "コモン", color: "#f2f2f2", glow: "#9aa0a6", sparkle: 0 },
  uncommon: { label: "UNCOMMON", labelJa: "アンコモン", color: "#55ff55", glow: "#2ecc71", sparkle: 0 },
  rare: { label: "RARE", labelJa: "レア", color: "#5555ff", glow: "#4d6dff", sparkle: 1 },
  epic: { label: "EPIC", labelJa: "エピック", color: "#aa00aa", glow: "#d946ef", sparkle: 2 },
  legendary: { label: "LEGENDARY", labelJa: "レジェンダリー", color: "#ffaa00", glow: "#f5c542", sparkle: 3 },
  mythic: { label: "MYTHIC", labelJa: "ミシック", color: "#ff55ff", glow: "#ff6bff", sparkle: 5 },
  divine: { label: "DIVINE", labelJa: "ディバイン", color: "#55ffff", glow: "#67e8f9", sparkle: 6 },
  special: { label: "SPECIAL", labelJa: "スペシャル", color: "#ff5555", glow: "#fb7185", sparkle: 4 },
  very_special: { label: "VERY SPECIAL", labelJa: "ベリー・スペシャル", color: "#ff5555", glow: "#ff7a7a", sparkle: 6 },
  ultimate: { label: "ULTIMATE", labelJa: "アルティメット", color: "#ff6b33", glow: "#ff8a3d", sparkle: 8 },
};

export function isRarity(v: string): v is Rarity {
  return (RARITY_IDS as readonly string[]).includes(v);
}
