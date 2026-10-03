import {
  DEFAULT_PALETTE,
  MECHANICAL_KINDS,
  type ModelKind,
} from "../model-types";

/** Iron, copper and blue-white energy: the default for machine weapons. */
const STEEL_PALETTE = [
  "#22262c",
  "#3b434c",
  "#69757f",
  "#9fadb8",
  "#dfe9f2",
  "#2c241c",
  "#c98f3a",
  "#3f6f8a",
];

interface PaletteRule {
  /** Keywords that select this palette. */
  match: RegExp;
  /** Keywords that veto the rule even when `match` hits. */
  veto?: RegExp;
  colors: readonly string[];
}

/**
 * Palettes are ordered by priority. The first rule that matches the prompt and
 * is not vetoed wins; otherwise the kind's default palette is used.
 */
const PALETTE_RULES: readonly PaletteRule[] = [
  {
    match: /ブラッド|血晶|血月|blood/i,
    colors: [
      "#24101a",
      "#4e1a2b",
      "#aa203c",
      "#f04a60",
      "#ffd4cc",
      "#392330",
      "#bd8e67",
      "#742741",
    ],
  },
  {
    match: /禍々|深淵|黒曜|呪|abyss|cursed/i,
    colors: [
      "#17141f",
      "#30283e",
      "#704492",
      "#b573d6",
      "#e6bbff",
      "#29222e",
      "#987984",
      "#51315b",
    ],
  },
  {
    match: /紫|アメジスト|purple|amethyst/i,
    veto: /刀身|ダイヤモンド|透き通る/i,
    colors: [
      "#322946",
      "#63508c",
      "#9878d9",
      "#c4a1f3",
      "#e5d4ff",
      "#3c314d",
      "#b99a65",
      "#745c99",
    ],
  },
  {
    match: /炎|赤い|ルビー|fire|ruby|red/i,
    colors: [
      "#482c36",
      "#a04448",
      "#e76552",
      "#ffac76",
      "#ffe0a0",
      "#4b3345",
      "#b39356",
      "#835566",
    ],
  },
  {
    match: /エメラルド|緑|emerald|green/i,
    colors: [
      "#213e35",
      "#2b7b56",
      "#58c48a",
      "#98e9b1",
      "#d9ffe0",
      "#423745",
      "#b49a60",
      "#667c57",
    ],
  },
  {
    match: /氷|青い|ice|blue/i,
    colors: [
      "#253c54",
      "#3c6e9d",
      "#62afe6",
      "#a0d7ff",
      "#def5ff",
      "#3c405e",
      "#aaa5bd",
      "#7886ae",
    ],
  },
  {
    match: /機械|鋼鉄|メタル|steel|machine|metal|ネオン/i,
    colors: STEEL_PALETTE,
  },
];

export function paletteForPrompt(prompt: string, kind?: ModelKind): string[] {
  for (const rule of PALETTE_RULES) {
    if (!rule.match.test(prompt)) continue;
    if (rule.veto?.test(prompt)) continue;
    return [...rule.colors];
  }
  return kind && MECHANICAL_KINDS.includes(kind)
    ? [...STEEL_PALETTE]
    : [...DEFAULT_PALETTE];
}
