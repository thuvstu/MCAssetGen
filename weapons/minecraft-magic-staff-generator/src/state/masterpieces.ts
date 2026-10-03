import type { Config } from "../engine/data";
import { applyEffect, applyElement, applyPalette, applyType, DEFAULT_CONFIG } from "../engine/generator";

export type Masterpiece = {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  build: () => Config;
};

function compose(
  seed: number,
  type: Parameters<typeof applyType>[1],
  rarity: Config["rarity"],
  element: Parameters<typeof applyElement>[1],
  palette: Parameters<typeof applyPalette>[1],
  effect: Parameters<typeof applyEffect>[1],
  head: Partial<Config>,
  name: string,
): Config {
  let config = applyType({ ...DEFAULT_CONFIG, seed, rarity }, type);
  config = applyElement(config, element);
  config = applyPalette(config, palette);
  config = applyEffect(config, effect);
  return { ...config, ...head, name };
}

/** Curated atelier recipes: each one demonstrates a distinct design grammar. */
export const MASTERPIECES: Masterpiece[] = [
  {
    id: "court-rosegold", title: "薔薇宮の宝杖", subtitle: "Court · Rosegold · Arabesque", accent: "#e68a9e",
    build: () => compose(77104, "court", "divine", "light", "rosegold", "haute",
      { form: "shrine", ornament: "arabesque", gemCut: "emerald", floater: "stars", floaterPath: "crown" }, "✪ 薔薇宮の典雅宝杖・天"),
  },
  {
    id: "lotus-celadon", title: "睡蓮華の天衣杖", subtitle: "Lotus · Celadon · Silk Ribbons", accent: "#6ec9b7",
    build: () => compose(88219, "lotus", "mythic", "wind", "celadon", "graceful",
      { form: "bouquet", ornament: "silkRibbons", gemCut: "teardrop", floater: "petals", floaterPath: "figure8" }, "✦ 秘色睡蓮の天衣杖・極"),
  },
  {
    id: "astrolabe-cosmic", title: "星辰渾天の杖", subtitle: "Astrolabe · Cosmic · Celestial", accent: "#9d50e5",
    build: () => compose(94012, "astrolabe", "relic", "cosmic", "imperial", "celestial",
      { form: "constellation", ornament: "celestialAstrolabe", gemCut: "starcut", floater: "stars", floaterPath: "constellation" }, "✪ 星辰渾天の至宝杖・神"),
  },
  {
    id: "valkyrie-pearl", title: "白銀戦乙女の槍杖", subtitle: "Valkyrie · Pearl · Bifurcated", accent: "#e8dff5",
    build: () => compose(51208, "valkyrie", "divine", "crystal", "pearl", "divine",
      { form: "bifurcated", ornament: "silkRibbons", gemCut: "starcut", floater: "stars", floaterPath: "crown" }, "✪ 白銀戦乙女の天槍杖"),
  },
  {
    id: "sylphid-lyric", title: "風精の竪琴杖", subtitle: "Sylphid · Lyre · Lotus Petals", accent: "#ff6fb5",
    build: () => compose(63019, "sylphid", "legendary", "sound", "candy", "graceful",
      { form: "asymmetric", ornament: "lotusPetals", gemCut: "rose", floater: "bells", floaterPath: "figure8" }, "✦ 風精シルフィードの楽杖"),
  },
  {
    id: "eclipse-void", title: "皆既日食の黒輪杖", subtitle: "Eclipse · Obsidian · Royal", accent: "#f0c04a",
    build: () => compose(39081, "eclipse", "artifact", "void", "royal", "haute",
      { form: "levitating", ornament: "celestialAstrolabe", gemCut: "brilliant", floater: "moons", floaterPath: "orbit" }, "✪ 皆既日食の黒輪杖・絶"),
  },
  {
    id: "sakura-dream", title: "花霞の夢見杖", subtitle: "Feywild · Sakura · Constellation", accent: "#ef8fb2",
    build: () => compose(24817, "feywild", "mythic", "sakura", "rosegold", "ethereal",
      { form: "constellation", ornament: "lotusPetals", gemCut: "rose", floater: "butterflies", floaterPath: "figure8" }, "✦ 花霞の夢見杖・真"),
  },
  {
    id: "ink-shrine", title: "墨染祠の封杖", subtitle: "Voidcaller · Ink · Shrine", accent: "#b8c4ff",
    build: () => compose(36914, "voidcaller", "artifact", "ink", "void", "corrupted",
      { form: "shrine", ornament: "arabesque", gemCut: "rune", floater: "sigils", floaterPath: "pendulum" }, "✪ 墨染祠の封杖・絶"),
  },
  {
    id: "festival-lantern", title: "万華祭の提灯杖", subtitle: "Lanternbearer · Festival · Totemic", accent: "#ffe65c",
    build: () => compose(48231, "lanternbearer", "legendary", "festival", "sunset", "graceful",
      { form: "totemic", ornament: "hangingCharms", gemCut: "soul", floater: "lanterns", floaterPath: "pendulum" }, "✦ 万華祭の提灯杖"),
  },
  {
    id: "aurora-clock", title: "極光刻漏の杖", subtitle: "Chronomancer · Aurora · Clockwork", accent: "#55e6c1",
    build: () => compose(59307, "chronomancer", "divine", "aurora", "celadon", "celestial",
      { form: "levitating", ornament: "clockwork", gemCut: "rose", floater: "gears", floaterPath: "helix" }, "✪ 極光刻漏の杖・天"),
  },
  {
    id: "vanilla-plus", title: "バニラ＋の杖", subtitle: "Vanilla · Micro Edge · 1px", accent: "#8a6239",
    build: () => compose(66401, "vanillaPlus", "uncommon", "arcane", "element", "vanillaPlus", {}, "バニラ＋の杖"),
  },
  {
    id: "ruby-tool", title: "ルビーツール", subtitle: "Ruby · Tool · Collar Mount", accent: "#e0314f",
    build: () => compose(61338, "rubyTool", "rare", "fire", "ruby", "rubyTool", {}, "◆ ルビーツール"),
  },
  {
    id: "holy-sword", title: "聖なる剣杖", subtitle: "Holy · Silver Blade · Guard", accent: "#dfe6f5",
    build: () => compose(58440, "holySword", "legendary", "light", "holy", "prismHoly", {}, "✦ 聖なる剣杖"),
  },
  {
    id: "ominous-sword", title: "禍々しい剣杖", subtitle: "Ominous · Shadow Steel · Cursed", accent: "#ff4d5e",
    build: () => compose(52711, "ominousSword", "epic", "dark", "ominous", "ominous", {}, "◆ 禍々しい剣杖"),
  },
];
