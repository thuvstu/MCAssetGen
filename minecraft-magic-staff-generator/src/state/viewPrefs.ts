import type { Category } from "../engine/labels";

export type Tab = "identity" | "shaft" | "head" | "colors" | "fx" | "export";

export const TABS: readonly (readonly [Tab, string])[] = [
  ["identity", "型・属性"],
  ["shaft", "柄"],
  ["head", "先端・宝飾"],
  ["colors", "彩色"],
  ["fx", "光彩"],
  ["export", "リソパ・出力"],
];

export const TAB_TO_CATEGORY: Record<Tab, Category> = {
  identity: "identity", shaft: "shaft", head: "head", colors: "colors", fx: "effects", export: "animation",
};

export const BACKGROUNDS = [
  ["checker", "透過"], ["night", "星夜"], ["grass", "庭園"],
  ["nether", "深紅"], ["end", "虚空"], ["deepslate", "黒曜"],
] as const;

export type Bg = (typeof BACKGROUNDS)[number][0];

export const SHORTCUTS: readonly (readonly [string, string])[] = [
  ["G", "生成"], ["F", "保存"], ["Space", "再生/停止"], ["E", "発光"], ["1–6", "タブ"], ["Ctrl+Z", "戻す"],
];
