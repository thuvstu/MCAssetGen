export interface Fx {
  grain: number; // ざらつき 0-1
  brushed: number; // ブラシ目 0-1
  facet: number; // ファセット 0-1
  patina: number; // パティーナ(錆・緑青) 0-1
  glow: number; // 発光ハロ 0-1
}

export const FX_DEFAULT: Fx = { grain: 0.3, brushed: 0.15, facet: 0, patina: 0, glow: 0.5 };

const FX_METAL: Fx = { grain: 0.2, brushed: 0.45, facet: 0, patina: 0, glow: 0.3 };
const FX_GEM: Fx = { grain: 0.1, brushed: 0, facet: 0.7, patina: 0, glow: 0.8 };
const FX_ANCIENT: Fx = { grain: 0.4, brushed: 0.1, facet: 0, patina: 0.75, glow: 0.6 };
const FX_MAGIC: Fx = { grain: 0.15, brushed: 0, facet: 0.25, patina: 0, glow: 1 };
const FX_ORGANIC: Fx = { grain: 0.55, brushed: 0, facet: 0, patina: 0, glow: 0 };

export const FX_STYLES: { id: string; label: string; fx: Fx }[] = [
  { id: 'metal', label: '金属', fx: FX_METAL },
  { id: 'gem', label: '宝石', fx: FX_GEM },
  { id: 'ancient', label: '古代', fx: FX_ANCIENT },
  { id: 'magic', label: '魔法', fx: FX_MAGIC },
  { id: 'organic', label: '有機', fx: FX_ORGANIC },
];

export interface MaterialPreset {
  name: string;
  label: string;
  base: string;
  secondary: string;
  hueShift?: number;
  contrast?: number;
  saturationBoost?: number;
  fx?: Partial<Fx>;
}

export const PRESETS: MaterialPreset[] = [
  { name: 'copper', label: '銅', base: '#c47a45', secondary: '#5fb08a', hueShift: 10, fx: FX_METAL },
  { name: 'tin', label: 'スズ', base: '#c3c8cc', secondary: '#8ea0b0', hueShift: 4, fx: FX_METAL },
  { name: 'silver', label: '銀', base: '#d6dde6', secondary: '#9aa7b8', hueShift: 6, fx: FX_METAL },
  { name: 'lead', label: '鉛', base: '#646a85', secondary: '#9b9fb5', hueShift: -4, fx: FX_METAL },
  { name: 'steel', label: '鋼', base: '#8c929c', secondary: '#4d535c', hueShift: 2, fx: FX_METAL },
  { name: 'bronze', label: '青銅', base: '#c58f45', secondary: '#7a5a2d', hueShift: 10, fx: FX_METAL },
  { name: 'brass', label: '真鍮', base: '#d6b14a', secondary: '#9c7d2c', hueShift: 8, fx: FX_METAL },
  { name: 'gold', label: '金', base: '#f1c232', secondary: '#f8e7a0', hueShift: 10, fx: FX_METAL },
  { name: 'iron', label: '鉄', base: '#d0d0d0', secondary: '#8f8f8f', hueShift: 0, fx: FX_METAL },
  { name: 'platinum', label: '白金', base: '#b9d9e6', secondary: '#7ea9bb', hueShift: 6, fx: FX_METAL },
  { name: 'titanium', label: 'チタン', base: '#9aa3ab', secondary: '#c5a0d9', hueShift: -6, fx: FX_METAL },
  { name: 'nickel', label: 'ニッケル', base: '#c9bc9c', secondary: '#8f8468', hueShift: 4, fx: FX_METAL },
  { name: 'zinc', label: '亜鉛', base: '#c0caa8', secondary: '#7d8a63', hueShift: 4, fx: FX_METAL },
  { name: 'aluminum', label: 'アルミ', base: '#dfe6ea', secondary: '#a4b2bb', hueShift: 2, fx: FX_METAL },
  { name: 'cobalt', label: 'コバルト', base: '#2f55d4', secondary: '#7ea0ff', hueShift: -8, fx: FX_METAL },
  { name: 'uranium', label: 'ウラン', base: '#7fc43f', secondary: '#e6ff66', hueShift: 10, saturationBoost: 10, fx: FX_MAGIC },
  { name: 'mithril', label: 'ミスリル', base: '#7fe3ea', secondary: '#c8fbff', hueShift: 8, fx: FX_MAGIC },
  { name: 'adamantite', label: 'アダマンタイト', base: '#b83a3a', secondary: '#6b1c1c', hueShift: -6, fx: FX_METAL },
  { name: 'ruby', label: 'ルビー', base: '#e0304c', secondary: '#ffb3c0', hueShift: -8, saturationBoost: 10, fx: FX_GEM },
  { name: 'sapphire', label: 'サファイア', base: '#2e63d8', secondary: '#9fc3ff', hueShift: -10, saturationBoost: 10, fx: FX_GEM },
  { name: 'emerald', label: 'エメラルド', base: '#1fc266', secondary: '#9bf5c3', hueShift: 8, saturationBoost: 10, fx: FX_GEM },
  { name: 'amethyst', label: 'アメジスト', base: '#9b5de5', secondary: '#dcc2ff', hueShift: -8, fx: FX_GEM },
  { name: 'topaz', label: 'トパーズ', base: '#f3a11e', secondary: '#ffe08a', hueShift: 10, fx: FX_GEM },
  { name: 'obsidian', label: '黒曜石', base: '#2e1f45', secondary: '#7c5ca8', hueShift: -6, contrast: 0.9, fx: FX_GEM },
  { name: 'quartz', label: '水晶', base: '#eef0f3', secondary: '#c7cad1', hueShift: 0, contrast: 0.7, fx: FX_GEM },
  { name: 'ancient_gold', label: '古代金', base: '#d9a441', secondary: '#3f8f6b', hueShift: 8, fx: FX_ANCIENT },
  { name: 'jade', label: '翡翠', base: '#3fa77a', secondary: '#a8f0c8', hueShift: 6, fx: FX_GEM },
  { name: 'lapis', label: 'ラピス', base: '#2b4fb8', secondary: '#e2c24c', hueShift: -6, fx: FX_GEM },
  { name: 'bone', label: '骨', base: '#e6dcc2', secondary: '#a89b7b', hueShift: 4, fx: FX_ORGANIC },
  { name: 'void', label: '虚空', base: '#4b1d7a', secondary: '#c86bff', hueShift: -10, fx: FX_MAGIC },
  { name: 'soul', label: 'ソウル', base: '#3bd3e8', secondary: '#bdf7ff', hueShift: 8, fx: FX_MAGIC },
];
