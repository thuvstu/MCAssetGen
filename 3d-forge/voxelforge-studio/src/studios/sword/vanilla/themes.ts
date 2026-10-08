/**
 * Vanilla+ Themes ("系") — curated finish families built on the pure-vanilla grid.
 *
 * Each theme converts palette-index cells (not pixels) before Vanilla+ shading,
 * so every Vanilla tool keeps its exact silhouette while colour, ornament and
 * atmosphere change completely. These are presets for VanillaPlusOptions plus
 * transform rules applied to the 9-tone palette indices.
 */

import type { RGB } from "../engine/types";
import type { TierPalette } from "./renderer";
import type { VanillaPlusOptions } from "./vanillaPlus";



export type ThemeId =
  | "simple"        // 単純（そのまま）
  | "dragon"        // ドラゴン系
  | "gem"           // 宝石系（ルビー/サファイア/エメラルド等）
  | "ornate"        // 超装飾
  | "magic"         // 魔法剣
  | "mechanical"    // 機械風
  | "rainbow"       // 虹彩剣
  | "holy"          // 聖剣
  | "chainsaw"      // チェーンソー風
  | "ominous";      // 禍々しさ

export interface ThemeDef {
  id: ThemeId;
  label: string;
  emoji: string;
  description: string;
  /** Apply per-index changes to a vanilla palette colour */
  transform: (idx: number, col: RGB, tier: TierPalette) => RGB;
  /** Suggested VanillaPlusOptions overrides */
  plusOverrides: Partial<VanillaPlusOptions>;
  /** suggested tier for previews / exports */
  recommendedTiers: string[];
}

export const THEME_IDS: ThemeId[] = [
  "simple", "dragon", "gem", "ornate", "magic", "mechanical", "rainbow", "holy", "chainsaw", "ominous",
];

export function clampColor(col: RGB): RGB {
  return col.map((c) => Math.max(0, Math.min(255, Math.round(c)))) as RGB;
}

export function mixRGB(a: RGB, b: RGB, t: number): RGB {
  const cl = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * cl),
    Math.round(a[1] + (b[1] - a[1]) * cl),
    Math.round(a[2] + (b[2] - a[2]) * cl),
  ];
}

export function shadeRGB(col: RGB, f: number): RGB {
  return clampColor(col.map((c) => Math.round(c * f)) as RGB);
}

const mixCol = mixRGB;

const gemHues: Record<string, { base: RGB; edge: RGB; dark: RGB; accent: RGB }> = {
  ruby:      { base: [186, 34, 55],  edge: [255, 107, 122], dark: [102, 10, 25], accent: [255, 191, 200] },
  sapphire:  { base: [25, 82, 186],  edge: [96, 165, 255],  dark: [11, 42, 107], accent: [185, 215, 255] },
  opal:      { base: [160, 170, 195], edge: [225, 235, 255], dark: [74, 82, 102], accent: [240, 245, 255] },
};

export const THEMES: Record<ThemeId, ThemeDef> = {
  simple: {
    id: "simple",
    label: "単純剣",
    emoji: "🗡️",
    description: "バニラのまま。素材の自然な美しさ。",
    transform: (_idx, col) => col,
    plusOverrides: { bevel: 0.2, grain: 0.1, highlight: 0.35, gradient: 0.15 },
    recommendedTiers: ["diamond", "iron", "netherite"],
  },
  dragon: {
    id: "dragon",
    label: "ドラゴン系",
    emoji: "🐉",
    description: "龍骨・龍鱗・炎の息吹。Ice & Fire風。",
    transform: (idx, col) => {
      if (idx === 1) return mixCol(col, [255, 90, 30], 0.85);   // 熱い刃先
      if (idx === 2) return mixCol(col, [40, 26, 16], 0.85);    // 骨の芯
      if (idx === 3) return mixCol(col, [20, 30, 80], 0.9);     // 鱗深部
      if (idx === 4) return mixCol(col, [15, 15, 40], 0.95);    // 漆黒の外郭
      if (idx === 5 || idx === 6) return mixCol(col, [64, 38, 18], 0.8);  // 骨柄
      if (idx === 7) return mixCol(col, [255, 150, 40], 0.9);   // 燃える鍔
      if (idx === 8) return mixCol(col, [60, 20, 60], 0.9);     // 暗い鍔影
      if (idx === 9) return mixCol(col, [255, 220, 100], 0.95); // 龍の目
      return col;
    },
    plusOverrides: { bevel: 0.65, grain: 0.85, highlight: 0.75, gradient: 0.75, selectiveOutline: true },
    recommendedTiers: ["netherite", "iron", "diamond"],
  },
  gem: {
    id: "gem",
    label: "宝石系",
    emoji: "💎",
    description: "ルビー・サファイア・エメラルド。透き通る輝き。",
    transform: (idx, col, tier) => {
      const map: Record<number, [number, number, number]> = {
        1: gemHues.ruby.edge ?? gemHues.opal.edge!,
        2: gemHues.ruby.base ?? gemHues.opal.base!,
        3: gemHues.ruby.dark ?? gemHues.opal.dark!,
        7: gemHues.ruby.base ?? gemHues.opal.base!,
        8: gemHues.ruby.dark ?? gemHues.opal.dark!,
      };
      if (map[idx]) return map[idx]!;
      if (idx === 9) return tier.accent;
      return col;
    },
    plusOverrides: { bevel: 0.8, grain: 0.3, highlight: 0.9, gradient: 0.8, selectiveOutline: true },
    recommendedTiers: ["diamond", "netherite"],
  },
  ornate: {
    id: "ornate",
    label: "超装飾剣",
    emoji: "👑",
    description: "金象嵌・渦巻き彫刻・王侯貴族の剣。",
    transform: (idx, col) => {
      if (idx === 1) return mixCol(col, [255, 215, 0], 0.9);    // 金の刃紋
      if (idx === 2) return mixCol(col, [30, 20, 40], 0.9);     // 濃紫の芯
      if (idx === 3) return mixCol(col, [50, 30, 70], 0.9);     // 影紫
      if (idx === 7) return mixCol(col, [255, 200, 80], 0.95);  // 象嵌された金鍔
      if (idx === 8) return mixCol(col, [100, 70, 20], 0.9);    // 暗い金影
      if (idx === 9) return mixCol(col, [255, 100, 200], 0.9);  // ルビー装飾
      return col;
    },
    plusOverrides: { bevel: 0.9, grain: 0.4, highlight: 0.95, gradient: 0.85, selectiveOutline: true },
    recommendedTiers: ["netherite", "gold", "diamond"],
  },
  magic: {
    id: "magic",
    label: "魔法剣",
    emoji: "✨",
    description: "ルーン・オーラ・内側から光る刃。",
    transform: (idx, col) => {
      if (idx === 1) return mixCol(col, [180, 100, 255], 0.9);  // 魔力的刃先
      if (idx === 2) return mixCol(col, [60, 30, 100], 0.85);   // 闇の芯
      if (idx === 3) return mixCol(col, [30, 10, 60], 0.9);     // 深淵
      if (idx === 7) return mixCol(col, [200, 150, 255], 0.9);  // ルーン鍔
      if (idx === 8) return mixCol(col, [80, 40, 130], 0.9);
      if (idx === 9) return mixCol(col, [255, 255, 255], 0.98); // 魔法の輝き
      return col;
    },
    plusOverrides: { bevel: 0.5, grain: 0.2, highlight: 0.9, gradient: 0.95, selectiveOutline: false },
    recommendedTiers: ["diamond", "netherite", "amethyst"],
  },
  mechanical: {
    id: "mechanical",
    label: "機械剣",
    emoji: "⚙️",
    description: "鋼鉄・リベット・歯車・回路。工業的な剣。",
    transform: (idx, col) => {
      if (idx === 1) return mixCol(col, [200, 220, 235], 0.9);  // ステンレス刃
      if (idx === 2) return mixCol(col, [70, 80, 95], 0.9);     // 鈍い鋼芯
      if (idx === 3) return mixCol(col, [40, 45, 60], 0.9);     // 暗い機体
      if (idx === 4) return mixCol(col, [20, 25, 35], 0.95);    // 黒鉄の外郭
      if (idx === 5) return mixCol(col, [120, 80, 40], 0.9);    // 革・リベット柄
      if (idx === 6) return mixCol(col, [70, 50, 30], 0.9);
      if (idx === 7) return mixCol(col, [255, 180, 60], 0.9);   // オレンジ警報鍔
      if (idx === 8) return mixCol(col, [100, 50, 0], 0.9);
      if (idx === 9) return mixCol(col, [60, 220, 255], 0.95);  // 電気回路
      return col;
    },
    plusOverrides: { bevel: 0.9, grain: 0.75, highlight: 0.55, gradient: 0.5, selectiveOutline: true },
    recommendedTiers: ["iron", "netherite"],
  },
  rainbow: {
    id: "rainbow",
    label: "虹彩剣",
    emoji: "🌈",
    description: "虹色グラデーション。音楽シリーズのソプラノ。",
    transform: (idx, col, tier) => {
      if (idx === 1) return mixCol(col, [255, 80, 180], 0.85); // ピンク刃先
      if (idx === 2) return mixCol(col, [80, 150, 255], 0.85); // 青の芯
      if (idx === 3) return mixCol(col, [40, 60, 120], 0.9);   // 濃紺
      if (idx === 7) return mixCol(col, [255, 220, 150], 0.9); // 金の鍔
      if (idx === 8) return mixCol(col, [90, 50, 20], 0.9);
      if (idx === 9) return tier.accent;                       // 虹のアクセント
      return col;
    },
    plusOverrides: { bevel: 0.75, grain: 0.15, highlight: 0.85, gradient: 1, selectiveOutline: true },
    recommendedTiers: ["diamond", "amethyst", "prismarine"],
  },
  holy: {
    id: "holy",
    label: "聖剣",
    emoji: "🛡️",
    description: "白銀・金・天使の光。アイテムが神聖石に見える。",
    transform: (idx, col) => {
      if (idx === 1) return mixCol(col, [255, 255, 250], 0.98); // 白刃
      if (idx === 2) return mixCol(col, [230, 240, 250], 0.9);  // 銀の芯
      if (idx === 3) return mixCol(col, [150, 170, 200], 0.9);  // 淡影
      if (idx === 4) return mixCol(col, [200, 220, 255], 0.95); // 白外郭（控えめ）
      if (idx === 5) return mixCol(col, [230, 190, 120], 0.9);  // 金柄
      if (idx === 7) return mixCol(col, [255, 220, 100], 0.95); // 天使鍔
      if (idx === 8) return mixCol(col, [180, 140, 60], 0.9);
      if (idx === 9) return mixCol(col, [255, 255, 255], 0.99); // 純白の輝き
      return col;
    },
    plusOverrides: { bevel: 0.4, grain: 0.1, highlight: 1, gradient: 0.6, selectiveOutline: true },
    recommendedTiers: ["gold", "diamond", "iron"],
  },
  chainsaw: {
    id: "chainsaw",
    label: "チェーンソー剣",
    emoji: "⚙️",
    description: "歯状の刃・回転チューブ・危険な工具剣。",
    transform: (idx, col) => {
      if (idx === 1) return mixCol(col, [255, 140, 40], 0.9);  // 危険色刃
      if (idx === 2) return mixCol(col, [50, 50, 60], 0.9);    // 機体芯
      if (idx === 3) return mixCol(col, [25, 25, 40], 0.95);   // 闇機体
      if (idx === 4) return mixCol(col, [8, 8, 12], 0.98);     // 焦げた外郭
      if (idx === 5) return mixCol(col, [150, 70, 30], 0.9);   // 革カバー柄
      if (idx === 7) return mixCol(col, [200, 130, 60], 0.9);  // 錆びた鍔
      if (idx === 9) return mixCol(col, [30, 255, 60], 0.95);  // 警告ランプ
      return col;
    },
    plusOverrides: { bevel: 0.85, grain: 0.9, highlight: 0.6, gradient: 0.6, selectiveOutline: true },
    recommendedTiers: ["iron", "netherite"],
  },
  ominous: {
    id: "ominous",
    label: "禍々しき剣",
    emoji: "💀",
    description: "闇・鈍い光・不吉な緑・腐食した金属。",
    transform: (idx, col) => {
      if (idx === 1) return mixCol(col, [140, 40, 80], 0.9);   // 暗紅の刃
      if (idx === 2) return mixCol(col, [25, 10, 25], 0.95);   // 腐った芯
      if (idx === 3) return mixCol(col, [8, 4, 12], 0.98);     // 腐った影
      if (idx === 4) return mixCol(col, [40, 15, 45], 0.95);   // 闇の外郭
      if (idx === 5) return mixCol(col, [60, 25, 35], 0.9);    // 闇柄
      if (idx === 6) return mixCol(col, [25, 10, 15], 0.95);
      if (idx === 7) return mixCol(col, [180, 60, 100], 0.9);  // 腐った珊瑚鍔
      if (idx === 8) return mixCol(col, [60, 15, 40], 0.95);
      if (idx === 9) return mixCol(col, [40, 200, 80], 0.95);  // 腐食の緑光
      return col;
    },
    plusOverrides: { bevel: 0.7, grain: 0.95, highlight: 0.5, gradient: 0.4, selectiveOutline: true },
    recommendedTiers: ["netherite", "obsidian", "breeze"],
  },
};

/** Theme list (in UI order) for the gallery selector. */
export const THEME_LIST: ThemeDef[] = THEME_IDS.map((id) => THEMES[id as ThemeId]);

/** Apply a theme to a vanilla palette (sanitized input). */
export function applyThemeToPalette(palette: TierPalette, id: ThemeId): TierPalette {
  const theme = THEMES[id];
  const t = theme.transform;
  return {
    label: `${palette.label} ${theme.label}`,
    light: t(1, palette.light, palette),
    mid: t(2, palette.mid, palette),
    dark: t(3, palette.dark, palette),
    shadow: t(4, palette.shadow, palette),
    handleLight: t(5, palette.handleLight, palette),
    handleDark: t(6, palette.handleDark, palette),
    guardLight: t(7, palette.guardLight, palette),
    guardDark: t(8, palette.guardDark, palette),
    accent: t(9, palette.accent, palette),
  };
}

/** Compute the VanillaPlusOptions for a theme (merged with base overrides). */
export function themePlusOptions(id: ThemeId, base: VanillaPlusOptions): VanillaPlusOptions {
  const theme = THEMES[id];
  return { ...base, ...theme.plusOverrides };
}

/** Convert theme preset names to UI-safe camelCase IDs. */
export function themeLabelKey(id: ThemeId): string {
  return id;
}
