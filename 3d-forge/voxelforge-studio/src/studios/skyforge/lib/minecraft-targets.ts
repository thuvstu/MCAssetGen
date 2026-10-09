import type { ItemKind } from './hypixel-items';

// 6 output targets ported from the S1 (Vite) forge.
export type MinecraftTarget = 'universal' | 'cit_1_8_9' | 'cmd_1_20_1' | 'item_model_1_21_5' | 'mod_assets' | 'textures';

export const MINECRAFT_TARGETS: { id: MinecraftTarget; label: string; detail: string }[] = [
  { id: 'universal', label: 'Universal Project', detail: 'Resource Pack / Data Pack / Mod assets' },
  { id: 'cit_1_8_9', label: 'Hypixel 1.8.9 CIT', detail: 'MCPatcher / OptiFine' },
  { id: 'cmd_1_20_1', label: 'Java 1.20.1 CMD', detail: 'CustomModelData / pack_format 15' },
  { id: 'item_model_1_21_5', label: 'Java 1.21.5+', detail: 'Item Model Definition / pack_format 55' },
  { id: 'mod_assets', label: 'Mod Assets Source', detail: 'Fabric / Forge resources' },
  { id: 'textures', label: 'Texture Bundle', detail: '16/32/64 PNG' },
];

export const DEFAULT_BASE_ITEM: Record<ItemKind, string> = {
  sword: 'diamond_sword', bow: 'bow', axe: 'diamond_axe', pickaxe: 'diamond_pickaxe',
  helmet: 'diamond_helmet', chestplate: 'diamond_chestplate', shield: 'shield', block: 'paper',
  orb: 'ender_pearl', staff: 'blaze_rod', hoe: 'diamond_hoe',
};

export const BASE_ITEM_OPTIONS = [
  'diamond_sword', 'iron_sword', 'netherite_sword', 'bow', 'stick', 'blaze_rod',
  'carrot_on_a_stick', 'warped_fungus_on_a_stick', 'diamond_axe', 'diamond_pickaxe',
  'diamond_hoe', 'shield', 'paper', 'ender_pearl', 'diamond_helmet', 'diamond_chestplate',
];
