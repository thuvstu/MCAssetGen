import type { AnimationMode, ElementMode, TextureEssence, TwinMode } from './design';

export const PRIMARY_MATERIALS = [
  { id: 'wither', jp: 'ウィザー', en: 'Wither', color: '#7054b5', light: '#d1c2ff', dark: '#251542' },
  { id: 'dragon', jp: 'ドラゴン', en: 'Dragonfire', color: '#dd5a29', light: '#ffd17b', dark: '#641b16' },
  { id: 'aurora', jp: 'オーロラ', en: 'Aurora', color: '#39cbd0', light: '#c2ffff', dark: '#0b3f68' },
  { id: 'necron', jp: 'ネクロン', en: 'Necron', color: '#c83242', light: '#ff968a', dark: '#3b0b17' },
  { id: 'ender', jp: 'エンダー', en: 'Ender', color: '#34ce9b', light: '#b6ffe6', dark: '#073b39' },
  { id: 'void', jp: 'ヴォイド', en: 'Void', color: '#404b70', light: '#b5c5f1', dark: '#111322' },
  { id: 'crystal', jp: 'クリスタル', en: 'Crystal', color: '#ec81d0', light: '#ffe0fa', dark: '#65295f' },
  { id: 'gold', jp: 'ゴールド', en: 'Gold', color: '#e4ad32', light: '#fff1a4', dark: '#684012' },
] as const;

export const ACCENT_MATERIALS = [
  { id: 'gold', jp: '金', en: 'Gold', color: '#edb942' },
  { id: 'wither', jp: 'ウィザー', en: 'Wither', color: '#8955d7' },
  { id: 'ice', jp: '氷晶', en: 'Frost', color: '#54d9f2' },
  { id: 'blood', jp: '血晶', en: 'Blood', color: '#e03f58' },
  { id: 'jade', jp: '翡翠', en: 'Jade', color: '#61dc90' },
  { id: 'pearl', jp: '真珠', en: 'Pearl', color: '#f1e9dc' },
] as const;

export const HANDLE_MATERIALS = [
  { id: 'dark-oak', jp: 'ダークオーク', en: 'Dark Oak', color: '#4a2f20' },
  { id: 'obsidian', jp: '黒曜革', en: 'Obsidian Wrap', color: '#211c36' },
  { id: 'crimson', jp: '深紅の絹', en: 'Crimson Silk', color: '#8e2639' },
  { id: 'bone', jp: '古代骨', en: 'Ancient Bone', color: '#c9b998' },
  { id: 'azure', jp: '蒼革', en: 'Azure Leather', color: '#285e85' },
  { id: 'moss', jp: '苔革', en: 'Moss Hide', color: '#526941' },
] as const;

export const ANIMATION_DEFS: { id: AnimationMode; jp: string; en: string; icon: string }[] = [
  { id: 'none', jp: 'なし', en: 'none', icon: 'circle' },
  { id: 'sparkle', jp: '星屑', en: 'sparkle', icon: 'sparkle' },
  { id: 'pulse', jp: '鼓動', en: 'pulse', icon: 'circle' },
  { id: 'flow', jp: '流動', en: 'flow', icon: 'waves' },
  { id: 'flame', jp: '炎', en: 'flame', icon: 'flame' },
  { id: 'enchant', jp: 'エンチャント', en: 'enchant', icon: 'wand' },
  { id: 'drip', jp: '雫', en: 'drip', icon: 'drop' },
  { id: 'orbit', jp: '周回', en: 'orbit', icon: 'circle' },
  { id: 'aura', jp: '波動', en: 'aura', icon: 'waves' },
  { id: 'runes', jp: 'ルーン走査', en: 'runes', icon: 'sparkle' },
  { id: 'wingbeat', jp: '羽ばたき', en: 'wingbeat', icon: 'feather' },
  { id: 'fracture', jp: '破砕', en: 'fracture', icon: 'gem' },
  { id: 'storm', jp: '雷撃', en: 'storm', icon: 'storm' },
  { id: 'frost', jp: '氷結', en: 'frost', icon: 'frost' },
  { id: 'void', jp: '虚無', en: 'void', icon: 'circle' },
  { id: 'ornament', jp: '装飾連動', en: 'ornament', icon: 'wand' },
];

export const TWIN_MODES: { id: TwinMode; jp: string; en: string }[] = [
  { id: 'single', jp: '単体', en: 'Single' },
  { id: 'mirror', jp: '鏡像双刃', en: 'Mirror' },
  { id: 'crossed', jp: '交差双刃', en: 'Crossed' },
  { id: 'parallel', jp: '並列双刃', en: 'Parallel' },
];

export const ELEMENTS: { id: ElementMode; jp: string; en: string; color: string; icon: string }[] = [
  { id: 'none', jp: '無属性', en: 'None', color: '#778099', icon: 'circle' },
  { id: 'fire', jp: '炎', en: 'Inferno', color: '#ff7338', icon: 'flame' },
  { id: 'frost', jp: '氷', en: 'Frost', color: '#6de7ff', icon: 'frost' },
  { id: 'storm', jp: '雷', en: 'Storm', color: '#75b8ff', icon: 'storm' },
  { id: 'void', jp: '虚空', en: 'Void', color: '#9966ee', icon: 'circle' },
  { id: 'holy', jp: '聖光', en: 'Holy', color: '#ffe472', icon: 'sun' },
  { id: 'nature', jp: '自然', en: 'Nature', color: '#62d674', icon: 'leaf' },
  { id: 'blood', jp: '血', en: 'Blood', color: '#e0364f', icon: 'drop' },
  { id: 'arcane', jp: '秘術', en: 'Arcane', color: '#e85cff', icon: 'sparkle' },
  { id: 'poison', jp: '毒', en: 'Venom', color: '#9cde42', icon: 'drop' },
];

export const PRESET_MIX: Record<string, TextureEssence['mix']> = {
  reborn: { furfsky: 0.42, vanilla: 0.14, imperial: 0.26, faithful: 0.18 },
  vanilla: { furfsky: 0.14, vanilla: 0.56, imperial: 0.12, faithful: 0.18 },
  faithful: { furfsky: 0.13, vanilla: 0.08, imperial: 0.15, faithful: 0.64 },
  mythic: { furfsky: 0.30, vanilla: 0.06, imperial: 0.48, faithful: 0.16 },
  pastel: { furfsky: 0.40, vanilla: 0.32, imperial: 0.10, faithful: 0.18 },
  overhaul: { furfsky: 0.16, vanilla: 0.08, imperial: 0.20, faithful: 0.56 },
};