// ============================================================
// Minecraft ブロック定義・DataVersion定義
// ============================================================

export interface BlockDef {
  id: string; // minecraft:xxx
  ja: string;
  en: string;
  color: string; // 3D表示色
  category: CategoryId;
  transparent?: boolean;
  props?: Record<string, string[]>; // 選択可能なblockstate
  defaults?: Record<string, string>;
  blockEntity?: boolean; // ブロックエンティティを持つ
}

export type CategoryId =
  | "building"
  | "wood"
  | "natural"
  | "functional"
  | "redstone"
  | "colored"
  | "nether"
  | "special"
  | "custom";

export const CATEGORIES: { id: CategoryId; ja: string }[] = [
  { id: "building", ja: "建築・石材" },
  { id: "wood", ja: "木材・葉" },
  { id: "natural", ja: "自然・鉱石" },
  { id: "colored", ja: "色付き・ガラス" },
  { id: "functional", ja: "機能・装置" },
  { id: "redstone", ja: "レッドストーン" },
  { id: "nether", ja: "ネザー・エンド" },
  { id: "special", ja: "特殊・液体" },
  { id: "custom", ja: "MOD・カスタム" },
];

const AXIS = { axis: ["x", "y", "z"] };
const FACING_H = { facing: ["north", "south", "east", "west"] };
const FACING_ALL = { facing: ["north", "south", "east", "west", "up", "down"] };
const STAIR = {
  facing: ["north", "south", "east", "west"],
  half: ["top", "bottom"],
  shape: ["straight", "inner_left", "inner_right", "outer_left", "outer_right"],
};
const SLAB = { type: ["top", "bottom", "double"] };

export const BLOCKS: BlockDef[] = [
  // ---- 建築・石材 ----
  { id: "minecraft:stone", ja: "石", en: "Stone", color: "#7d7d7d", category: "building" },
  { id: "minecraft:granite", ja: "花崗岩", en: "Granite", color: "#9a5f4f", category: "building" },
  { id: "minecraft:diorite", ja: "閃緑岩", en: "Diorite", color: "#bdbdbd", category: "building" },
  { id: "minecraft:andesite", ja: "安山岩", en: "Andesite", color: "#868686", category: "building" },
  { id: "minecraft:deepslate", ja: "深層岩", en: "Deepslate", color: "#4a4a52", category: "building", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:cobbled_deepslate", ja: "丸石の深層岩", en: "Cobbled Deepslate", color: "#56565e", category: "building" },
  { id: "minecraft:cobblestone", ja: "丸石", en: "Cobblestone", color: "#6e6e6e", category: "building" },
  { id: "minecraft:mossy_cobblestone", ja: "苔むした丸石", en: "Mossy Cobblestone", color: "#5f7a4e", category: "building" },
  { id: "minecraft:stone_bricks", ja: "石レンガ", en: "Stone Bricks", color: "#757575", category: "building" },
  { id: "minecraft:mossy_stone_bricks", ja: "苔むした石レンガ", en: "Mossy Stone Bricks", color: "#6b7f5e", category: "building" },
  { id: "minecraft:cracked_stone_bricks", ja: "ひび割れた石レンガ", en: "Cracked Stone Bricks", color: "#6a6a6a", category: "building" },
  { id: "minecraft:chiseled_stone_bricks", ja: "模様入り石レンガ", en: "Chiseled Stone Bricks", color: "#787878", category: "building" },
  { id: "minecraft:deepslate_bricks", ja: "深層岩レンガ", en: "Deepslate Bricks", color: "#4c4c55", category: "building" },
  { id: "minecraft:cracked_deepslate_bricks", ja: "ひび割れた深層岩レンガ", en: "Cracked Deepslate Bricks", color: "#43434c", category: "building" },
  { id: "minecraft:deepslate_tiles", ja: "深層岩タイル", en: "Deepslate Tiles", color: "#3d3d46", category: "building" },
  { id: "minecraft:bricks", ja: "レンガ", en: "Bricks", color: "#9c5a4a", category: "building" },
  { id: "minecraft:mud_bricks", ja: "泥レンガ", en: "Mud Bricks", color: "#8a5f4d", category: "building" },
  { id: "minecraft:sandstone", ja: "砂岩", en: "Sandstone", color: "#d9c894", category: "building" },
  { id: "minecraft:chiseled_sandstone", ja: "模様入り砂岩", en: "Chiseled Sandstone", color: "#d6c48e", category: "building" },
  { id: "minecraft:cut_sandstone", ja: "研がれた砂岩", en: "Cut Sandstone", color: "#d9c894", category: "building" },
  { id: "minecraft:red_sandstone", ja: "赤い砂岩", en: "Red Sandstone", color: "#b25a2e", category: "building" },
  { id: "minecraft:quartz_block", ja: "クォーツブロック", en: "Quartz Block", color: "#e8e0d0", category: "building" },
  { id: "minecraft:smooth_quartz", ja: "滑らかなクォーツ", en: "Smooth Quartz", color: "#e3dcca", category: "building" },
  { id: "minecraft:quartz_bricks", ja: "クォーツレンガ", en: "Quartz Bricks", color: "#e0d6c2", category: "building" },
  { id: "minecraft:quartz_pillar", ja: "クォーツの柱", en: "Quartz Pillar", color: "#e5dcc8", category: "building", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:prismarine", ja: "プリズマリン", en: "Prismarine", color: "#5f9e8e", category: "building" },
  { id: "minecraft:prismarine_bricks", ja: "プリズマリンレンガ", en: "Prismarine Bricks", color: "#5a9a8a", category: "building" },
  { id: "minecraft:dark_prismarine", ja: "ダークプリズマリン", en: "Dark Prismarine", color: "#3d5f56", category: "building" },
  { id: "minecraft:sea_lantern", ja: "シーランタン", en: "Sea Lantern", color: "#a8c8b8", category: "building" },
  { id: "minecraft:oak_stairs", ja: "オークの階段", en: "Oak Stairs", color: "#a67c4a", category: "building", props: STAIR, defaults: { facing: "north", half: "bottom", shape: "straight" } },
  { id: "minecraft:stone_stairs", ja: "石の階段", en: "Stone Stairs", color: "#7d7d7d", category: "building", props: STAIR, defaults: { facing: "north", half: "bottom", shape: "straight" } },
  { id: "minecraft:stone_brick_stairs", ja: "石レンガの階段", en: "Stone Brick Stairs", color: "#757575", category: "building", props: STAIR, defaults: { facing: "north", half: "bottom", shape: "straight" } },
  { id: "minecraft:cobblestone_stairs", ja: "丸石の階段", en: "Cobblestone Stairs", color: "#6e6e6e", category: "building", props: STAIR, defaults: { facing: "north", half: "bottom", shape: "straight" } },
  { id: "minecraft:brick_stairs", ja: "レンガの階段", en: "Brick Stairs", color: "#9c5a4a", category: "building", props: STAIR, defaults: { facing: "north", half: "bottom", shape: "straight" } },
  { id: "minecraft:quartz_stairs", ja: "クォーツの階段", en: "Quartz Stairs", color: "#e8e0d0", category: "building", props: STAIR, defaults: { facing: "north", half: "bottom", shape: "straight" } },
  { id: "minecraft:oak_slab", ja: "オークのハーフ", en: "Oak Slab", color: "#a67c4a", category: "building", props: SLAB, defaults: { type: "bottom" } },
  { id: "minecraft:stone_slab", ja: "石のハーフ", en: "Stone Slab", color: "#7d7d7d", category: "building", props: SLAB, defaults: { type: "bottom" } },
  { id: "minecraft:cobblestone_slab", ja: "丸石のハーフ", en: "Cobblestone Slab", color: "#6e6e6e", category: "building", props: SLAB, defaults: { type: "bottom" } },
  { id: "minecraft:stone_brick_slab", ja: "石レンガのハーフ", en: "Stone Brick Slab", color: "#757575", category: "building", props: SLAB, defaults: { type: "bottom" } },
  { id: "minecraft:quartz_slab", ja: "クォーツのハーフ", en: "Quartz Slab", color: "#e8e0d0", category: "building", props: SLAB, defaults: { type: "bottom" } },
  { id: "minecraft:cut_copper", ja: "切り込み入りの銅", en: "Cut Copper", color: "#c07850", category: "building" },
  { id: "minecraft:cut_copper_stairs", ja: "切り込み入りの銅の階段", en: "Cut Copper Stairs", color: "#c07850", category: "building", props: STAIR, defaults: { facing: "north", half: "bottom", shape: "straight" } },
  { id: "minecraft:cut_copper_slab", ja: "切り込み入りの銅のハーフ", en: "Cut Copper Slab", color: "#c07850", category: "building", props: SLAB, defaults: { type: "bottom" } },
  { id: "minecraft:oxidized_cut_copper", ja: "酸化した切り込み入りの銅", en: "Oxidized Cut Copper", color: "#4fa08e", category: "building" },
  { id: "minecraft:tuff", ja: "凝灰岩", en: "Tuff", color: "#6e6259", category: "building" },
  { id: "minecraft:tuff_bricks", ja: "凝灰岩レンガ", en: "Tuff Bricks", color: "#75685e", category: "building" },
  { id: "minecraft:chiseled_tuff", ja: "模様入りの凝灰岩", en: "Chiseled Tuff", color: "#6e6259", category: "building" },
  { id: "minecraft:calcite", ja: "方解石", en: "Calcite", color: "#d8d2c4", category: "building" },
  { id: "minecraft:dripstone_block", ja: "鍾乳石ブロック", en: "Dripstone Block", color: "#8a6f5c", category: "building" },
  { id: "minecraft:smooth_stone", ja: "滑らかな石", en: "Smooth Stone", color: "#8a8a8a", category: "building" },
  { id: "minecraft:smooth_stone_slab", ja: "滑らかな石のハーフ", en: "Smooth Stone Slab", color: "#8a8a8a", category: "building", props: SLAB, defaults: { type: "bottom" } },

  // ---- 木材・葉 ----
  { id: "minecraft:oak_log", ja: "オークの原木", en: "Oak Log", color: "#6b5230", category: "wood", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:spruce_log", ja: "トウヒの原木", en: "Spruce Log", color: "#4a3520", category: "wood", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:birch_log", ja: "シラカバの原木", en: "Birch Log", color: "#c8c0a8", category: "wood", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:jungle_log", ja: "ジャングルの原木", en: "Jungle Log", color: "#5c4a26", category: "wood", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:acacia_log", ja: "アカシアの原木", en: "Acacia Log", color: "#6e5a3a", category: "wood", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:dark_oak_log", ja: "ダークオークの原木", en: "Dark Oak Log", color: "#3e2e1e", category: "wood", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:mangrove_log", ja: "マングローブの原木", en: "Mangrove Log", color: "#5c2e2e", category: "wood", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:cherry_log", ja: "サクラの原木", en: "Cherry Log", color: "#4a2e3a", category: "wood", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:pale_oak_log", ja: "ペールオークの原木", en: "Pale Oak Log", color: "#c8bfae", category: "wood", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:oak_planks", ja: "オークの板材", en: "Oak Planks", color: "#a67c4a", category: "wood" },
  { id: "minecraft:spruce_planks", ja: "トウヒの板材", en: "Spruce Planks", color: "#7a5a34", category: "wood" },
  { id: "minecraft:birch_planks", ja: "シラカバの板材", en: "Birch Planks", color: "#c8b078", category: "wood" },
  { id: "minecraft:jungle_planks", ja: "ジャングルの板材", en: "Jungle Planks", color: "#9a7a52", category: "wood" },
  { id: "minecraft:acacia_planks", ja: "アカシアの板材", en: "Acacia Planks", color: "#b06a3e", category: "wood" },
  { id: "minecraft:dark_oak_planks", ja: "ダークオークの板材", en: "Dark Oak Planks", color: "#5a3e22", category: "wood" },
  { id: "minecraft:mangrove_planks", ja: "マングローブの板材", en: "Mangrove Planks", color: "#8a4a3e", category: "wood" },
  { id: "minecraft:cherry_planks", ja: "サクラの板材", en: "Cherry Planks", color: "#d8a8a0", category: "wood" },
  { id: "minecraft:bamboo_planks", ja: "竹の板材", en: "Bamboo Planks", color: "#c8a84a", category: "wood" },
  { id: "minecraft:oak_leaves", ja: "オークの葉", en: "Oak Leaves", color: "#3a7a2e", category: "wood", transparent: true, props: { persistent: ["true", "false"] }, defaults: { persistent: "true" } },
  { id: "minecraft:spruce_leaves", ja: "トウヒの葉", en: "Spruce Leaves", color: "#2e5a34", category: "wood", transparent: true, props: { persistent: ["true", "false"] }, defaults: { persistent: "true" } },
  { id: "minecraft:birch_leaves", ja: "シラカバの葉", en: "Birch Leaves", color: "#5a9a3a", category: "wood", transparent: true, props: { persistent: ["true", "false"] }, defaults: { persistent: "true" } },
  { id: "minecraft:jungle_leaves", ja: "ジャングルの葉", en: "Jungle Leaves", color: "#2e8a2e", category: "wood", transparent: true, props: { persistent: ["true", "false"] }, defaults: { persistent: "true" } },
  { id: "minecraft:cherry_leaves", ja: "サクラの葉", en: "Cherry Leaves", color: "#e8a8c0", category: "wood", transparent: true, props: { persistent: ["true", "false"] }, defaults: { persistent: "true" } },
  { id: "minecraft:azalea_leaves", ja: "ツツジの葉", en: "Azalea Leaves", color: "#4a8a3a", category: "wood", transparent: true, props: { persistent: ["true", "false"] }, defaults: { persistent: "true" } },
  { id: "minecraft:bookshelf", ja: "本棚", en: "Bookshelf", color: "#8a6a3a", category: "wood" },
  { id: "minecraft:chiseled_bookshelf", ja: "模様入り本棚", en: "Chiseled Bookshelf", color: "#8a6a3a", category: "wood", props: FACING_H, defaults: { facing: "north" }, blockEntity: true },
  { id: "minecraft:bamboo_block", ja: "竹ブロック", en: "Bamboo Block", color: "#a8944a", category: "wood", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:bamboo_mosaic", ja: "竹モザイク", en: "Bamboo Mosaic", color: "#b8a05a", category: "wood" },

  // ---- 自然・鉱石 ----
  { id: "minecraft:grass_block", ja: "草ブロック", en: "Grass Block", color: "#5d9c3a", category: "natural", props: { snowy: ["true", "false"] }, defaults: { snowy: "false" } },
  { id: "minecraft:dirt", ja: "土", en: "Dirt", color: "#8a5f3e", category: "natural" },
  { id: "minecraft:coarse_dirt", ja: "粗い土", en: "Coarse Dirt", color: "#7a5638", category: "natural" },
  { id: "minecraft:rooted_dirt", ja: "根付いた土", en: "Rooted Dirt", color: "#7a5236", category: "natural" },
  { id: "minecraft:mud", ja: "泥", en: "Mud", color: "#4a3e3a", category: "natural" },
  { id: "minecraft:clay", ja: "粘土", en: "Clay", color: "#9aa4b0", category: "natural" },
  { id: "minecraft:sand", ja: "砂", en: "Sand", color: "#dcd29e", category: "natural" },
  { id: "minecraft:red_sand", ja: "赤い砂", en: "Red Sand", color: "#b25a2e", category: "natural" },
  { id: "minecraft:gravel", ja: "砂利", en: "Gravel", color: "#8a837e", category: "natural" },
  { id: "minecraft:snow_block", ja: "雪ブロック", en: "Snow Block", color: "#f0f4f4", category: "natural" },
  { id: "minecraft:ice", ja: "氷", en: "Ice", color: "#a0c8e8", category: "natural", transparent: true },
  { id: "minecraft:packed_ice", ja: "氷塊", en: "Packed Ice", color: "#8ab8e0", category: "natural" },
  { id: "minecraft:blue_ice", ja: "青氷", en: "Blue Ice", color: "#6a9ad8", category: "natural" },
  { id: "minecraft:podzol", ja: "ポドゾル", en: "Podzol", color: "#6a4e2e", category: "natural", props: { snowy: ["true", "false"] }, defaults: { snowy: "false" } },
  { id: "minecraft:mycelium", ja: "菌糸", en: "Mycelium", color: "#7a6a7a", category: "natural", props: { snowy: ["true", "false"] }, defaults: { snowy: "false" } },
  { id: "minecraft:coal_ore", ja: "石炭鉱石", en: "Coal Ore", color: "#5a5a5a", category: "natural" },
  { id: "minecraft:iron_ore", ja: "鉄鉱石", en: "Iron Ore", color: "#9a8a7a", category: "natural" },
  { id: "minecraft:gold_ore", ja: "金鉱石", en: "Gold Ore", color: "#9a8a5a", category: "natural" },
  { id: "minecraft:diamond_ore", ja: "ダイヤモンド鉱石", en: "Diamond Ore", color: "#5ad8d0", category: "natural" },
  { id: "minecraft:emerald_ore", ja: "エメラルド鉱石", en: "Emerald Ore", color: "#3ad86a", category: "natural" },
  { id: "minecraft:lapis_ore", ja: "ラピスラズリ鉱石", en: "Lapis Ore", color: "#3a5ad8", category: "natural" },
  { id: "minecraft:redstone_ore", ja: "レッドストーン鉱石", en: "Redstone Ore", color: "#c83a3a", category: "natural", props: { lit: ["true", "false"] }, defaults: { lit: "false" } },
  { id: "minecraft:copper_ore", ja: "銅鉱石", en: "Copper Ore", color: "#8a7a6a", category: "natural" },
  { id: "minecraft:deepslate_diamond_ore", ja: "深層ダイヤ鉱石", en: "Deepslate Diamond Ore", color: "#3a8a8a", category: "natural" },
  { id: "minecraft:ancient_debris", ja: "古代の残骸", en: "Ancient Debris", color: "#5a3a34", category: "natural" },
  { id: "minecraft:iron_block", ja: "鉄ブロック", en: "Iron Block", color: "#d8d8d8", category: "natural" },
  { id: "minecraft:gold_block", ja: "金ブロック", en: "Gold Block", color: "#f8d83a", category: "natural" },
  { id: "minecraft:diamond_block", ja: "ダイヤブロック", en: "Diamond Block", color: "#5ae8e0", category: "natural" },
  { id: "minecraft:emerald_block", ja: "エメラルドブロック", en: "Emerald Block", color: "#3ae87a", category: "natural" },
  { id: "minecraft:lapis_block", ja: "ラピスブロック", en: "Lapis Block", color: "#2a4ad8", category: "natural" },
  { id: "minecraft:redstone_block", ja: "レッドストーンブロック", en: "Redstone Block", color: "#c82a2a", category: "natural" },
  { id: "minecraft:copper_block", ja: "銅ブロック", en: "Copper Block", color: "#c07850", category: "natural" },
  { id: "minecraft:netherite_block", ja: "ネザライトブロック", en: "Netherite Block", color: "#4a3a3e", category: "natural" },
  { id: "minecraft:coal_block", ja: "石炭ブロック", en: "Coal Block", color: "#1e1e1e", category: "natural" },
  { id: "minecraft:amethyst_block", ja: "アメジストブロック", en: "Amethyst Block", color: "#8a6ac8", category: "natural" },
  { id: "minecraft:pumpkin", ja: "カボチャ", en: "Pumpkin", color: "#c0782e", category: "natural", props: FACING_H, defaults: { facing: "north" } },
  { id: "minecraft:carved_pumpkin", ja: "くり抜かれたカボチャ", en: "Carved Pumpkin", color: "#c0782e", category: "natural", props: FACING_H, defaults: { facing: "north" } },
  { id: "minecraft:jack_o_lantern", ja: "ジャック・オ・ランタン", en: "Jack o'Lantern", color: "#d8a03a", category: "natural", props: FACING_H, defaults: { facing: "north" } },
  { id: "minecraft:melon", ja: "スイカ", en: "Melon", color: "#5aa83a", category: "natural" },
  { id: "minecraft:hay_block", ja: "干草の俵", en: "Hay Block", color: "#d8b83a", category: "natural", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:glowstone", ja: "グロウストーン", en: "Glowstone", color: "#e8c86a", category: "natural" },
  { id: "minecraft:obsidian", ja: "黒曜石", en: "Obsidian", color: "#1e1428", category: "natural" },
  { id: "minecraft:crying_obsidian", ja: "泣く黒曜石", en: "Crying Obsidian", color: "#2a1a3a", category: "natural" },
  { id: "minecraft:bedrock", ja: "岩盤", en: "Bedrock", color: "#2e2e2e", category: "natural" },

  // ---- 色付き・ガラス ----
  { id: "minecraft:glass", ja: "ガラス", en: "Glass", color: "#d8ecf0", category: "colored", transparent: true },
  { id: "minecraft:white_wool", ja: "白色の羊毛", en: "White Wool", color: "#e8e8e8", category: "colored" },
  { id: "minecraft:black_wool", ja: "黒色の羊毛", en: "Black Wool", color: "#1e1e1e", category: "colored" },
  { id: "minecraft:red_wool", ja: "赤色の羊毛", en: "Red Wool", color: "#a83a3a", category: "colored" },
  { id: "minecraft:blue_wool", ja: "青色の羊毛", en: "Blue Wool", color: "#3a5ad8", category: "colored" },
  { id: "minecraft:green_wool", ja: "緑色の羊毛", en: "Green Wool", color: "#4a8a3a", category: "colored" },
  { id: "minecraft:yellow_wool", ja: "黄色の羊毛", en: "Yellow Wool", color: "#e8d83a", category: "colored" },
  { id: "minecraft:orange_wool", ja: "橙色の羊毛", en: "Orange Wool", color: "#e87a2a", category: "colored" },
  { id: "minecraft:purple_wool", ja: "紫色の羊毛", en: "Purple Wool", color: "#7a3ad8", category: "colored" },
  { id: "minecraft:pink_wool", ja: "桃色の羊毛", en: "Pink Wool", color: "#e88ab0", category: "colored" },
  { id: "minecraft:light_blue_wool", ja: "空色の羊毛", en: "Light Blue Wool", color: "#6ab8e8", category: "colored" },
  { id: "minecraft:lime_wool", ja: "黄緑色の羊毛", en: "Lime Wool", color: "#7ad83a", category: "colored" },
  { id: "minecraft:cyan_wool", ja: "青緑色の羊毛", en: "Cyan Wool", color: "#2a9aaa", category: "colored" },
  { id: "minecraft:gray_wool", ja: "灰色の羊毛", en: "Gray Wool", color: "#6e6e6e", category: "colored" },
  { id: "minecraft:white_concrete", ja: "白色のコンクリート", en: "White Concrete", color: "#d8d8d8", category: "colored" },
  { id: "minecraft:black_concrete", ja: "黒色のコンクリート", en: "Black Concrete", color: "#101010", category: "colored" },
  { id: "minecraft:red_concrete", ja: "赤色のコンクリート", en: "Red Concrete", color: "#8e2a2a", category: "colored" },
  { id: "minecraft:blue_concrete", ja: "青色のコンクリート", en: "Blue Concrete", color: "#2a3eb8", category: "colored" },
  { id: "minecraft:green_concrete", ja: "緑色のコンクリート", en: "Green Concrete", color: "#3e6e2a", category: "colored" },
  { id: "minecraft:yellow_concrete", ja: "黄色のコンクリート", en: "Yellow Concrete", color: "#d8b82a", category: "colored" },
  { id: "minecraft:orange_concrete", ja: "橙色のコンクリート", en: "Orange Concrete", color: "#d86a1e", category: "colored" },
  { id: "minecraft:light_blue_concrete", ja: "空色のコンクリート", en: "Light Blue Concrete", color: "#4a9ed8", category: "colored" },
  { id: "minecraft:lime_concrete", ja: "黄緑色のコンクリート", en: "Lime Concrete", color: "#5eb82a", category: "colored" },
  { id: "minecraft:pink_concrete", ja: "桃色のコンクリート", en: "Pink Concrete", color: "#d87aa8", category: "colored" },
  { id: "minecraft:white_stained_glass", ja: "白色のガラス", en: "White Glass", color: "#e8e8e8", category: "colored", transparent: true },
  { id: "minecraft:red_stained_glass", ja: "赤色のガラス", en: "Red Glass", color: "#a83a3a", category: "colored", transparent: true },
  { id: "minecraft:blue_stained_glass", ja: "青色のガラス", en: "Blue Glass", color: "#3a5ad8", category: "colored", transparent: true },
  { id: "minecraft:light_blue_stained_glass", ja: "空色のガラス", en: "Light Blue Glass", color: "#6ab8e8", category: "colored", transparent: true },
  { id: "minecraft:lime_stained_glass", ja: "黄緑色のガラス", en: "Lime Glass", color: "#7ad83a", category: "colored", transparent: true },
  { id: "minecraft:tinted_glass", ja: "遮光ガラス", en: "Tinted Glass", color: "#3a3a3a", category: "colored", transparent: true },
  { id: "minecraft:terracotta", ja: "テラコッタ", en: "Terracotta", color: "#9a5f4a", category: "colored" },
  { id: "minecraft:white_terracotta", ja: "白色のテラコッタ", en: "White Terracotta", color: "#c8b8a8", category: "colored" },
  { id: "minecraft:red_terracotta", ja: "赤色のテラコッタ", en: "Red Terracotta", color: "#8a3e32", category: "colored" },
  { id: "minecraft:blue_terracotta", ja: "青色のテラコッタ", en: "Blue Terracotta", color: "#4a4a7a", category: "colored" },
  { id: "minecraft:glazed_terracotta_placeholder", ja: "彩釉テラコッタ(白)", en: "White Glazed Terracotta", color: "#d8e0e0", category: "colored", props: FACING_H, defaults: { facing: "north" } },

  // ---- 機能・装置 ----
  { id: "minecraft:crafting_table", ja: "作業台", en: "Crafting Table", color: "#9a7a4a", category: "functional" },
  { id: "minecraft:furnace", ja: "かまど", en: "Furnace", color: "#6e6e6e", category: "functional", props: { ...FACING_H, lit: ["true", "false"] }, defaults: { facing: "north", lit: "false" }, blockEntity: true },
  { id: "minecraft:blast_furnace", ja: "溶鉱炉", en: "Blast Furnace", color: "#5a5a5a", category: "functional", props: { ...FACING_H, lit: ["true", "false"] }, defaults: { facing: "north", lit: "false" }, blockEntity: true },
  { id: "minecraft:smoker", ja: "燻製器", en: "Smoker", color: "#6a5a4a", category: "functional", props: { ...FACING_H, lit: ["true", "false"] }, defaults: { facing: "north", lit: "false" }, blockEntity: true },
  { id: "minecraft:chest", ja: "チェスト", en: "Chest", color: "#a67c3a", category: "functional", props: { ...FACING_H, type: ["single", "left", "right"] }, defaults: { facing: "north", type: "single" }, blockEntity: true },
  { id: "minecraft:barrel", ja: "樽", en: "Barrel", color: "#8a6a3e", category: "functional", props: FACING_ALL, defaults: { facing: "up" }, blockEntity: true },
  { id: "minecraft:ender_chest", ja: "エンダーチェスト", en: "Ender Chest", color: "#2a3a4a", category: "functional", props: FACING_H, defaults: { facing: "north" }, blockEntity: true },
  { id: "minecraft:hopper", ja: "ホッパー", en: "Hopper", color: "#5a5a5a", category: "functional", props: { facing: ["down", "north", "south", "east", "west"], enabled: ["true", "false"] }, defaults: { facing: "down", enabled: "true" }, blockEntity: true },
  { id: "minecraft:dispenser", ja: "ディスペンサー", en: "Dispenser", color: "#7a7a7a", category: "functional", props: { ...FACING_ALL, triggered: ["true", "false"] }, defaults: { facing: "north", triggered: "false" }, blockEntity: true },
  { id: "minecraft:dropper", ja: "ドロッパー", en: "Dropper", color: "#6a6a6a", category: "functional", props: { ...FACING_ALL, triggered: ["true", "false"] }, defaults: { facing: "north", triggered: "false" }, blockEntity: true },
  { id: "minecraft:observer", ja: "オブザーバー", en: "Observer", color: "#5a5a5a", category: "functional", props: FACING_ALL, defaults: { facing: "south" } },
  { id: "minecraft:piston", ja: "ピストン", en: "Piston", color: "#9a8a6a", category: "functional", props: { ...FACING_ALL, extended: ["true", "false"] }, defaults: { facing: "north", extended: "false" } },
  { id: "minecraft:sticky_piston", ja: "粘着ピストン", en: "Sticky Piston", color: "#7a9a5a", category: "functional", props: { ...FACING_ALL, extended: ["true", "false"] }, defaults: { facing: "north", extended: "false" } },
  { id: "minecraft:tnt", ja: "TNT", en: "TNT", color: "#c83a2a", category: "functional", props: { unstable: ["true", "false"] }, defaults: { unstable: "false" } },
  { id: "minecraft:sponge", ja: "スポンジ", en: "Sponge", color: "#c8b83a", category: "functional" },
  { id: "minecraft:torch", ja: "松明", en: "Torch", color: "#e8c83a", category: "functional", transparent: true },
  { id: "minecraft:lantern", ja: "ランタン", en: "Lantern", color: "#d8a84a", category: "functional", props: { hanging: ["true", "false"] }, defaults: { hanging: "false" } },
  { id: "minecraft:soul_lantern", ja: "ソウルランタン", en: "Soul Lantern", color: "#5ab8c8", category: "functional", props: { hanging: ["true", "false"] }, defaults: { hanging: "false" } },
  { id: "minecraft:shroomlight", ja: "シュルームライト", en: "Shroomlight", color: "#d88a4a", category: "functional" },
  { id: "minecraft:ochre_froglight", ja: "黄土色のフロッグライト", en: "Ochre Froglight", color: "#d8c85e", category: "functional", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:verdant_froglight", ja: "新緑色のフロッグライト", en: "Verdant Froglight", color: "#7ad88a", category: "functional", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:pearlescent_froglight", ja: "真珠色のフロッグライト", en: "Pearlescent Froglight", color: "#d8a8c8", category: "functional", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:enchanting_table", ja: "エンチャントテーブル", en: "Enchanting Table", color: "#7a2a2a", category: "functional", blockEntity: true },
  { id: "minecraft:anvil", ja: "金床", en: "Anvil", color: "#4a4a4a", category: "functional", props: FACING_H, defaults: { facing: "north" } },
  { id: "minecraft:lectern", ja: "書見台", en: "Lectern", color: "#8a6a3e", category: "functional", props: FACING_H, defaults: { facing: "north" }, blockEntity: true },
  { id: "minecraft:note_block", ja: "音符ブロック", en: "Note Block", color: "#7a5a3a", category: "functional", blockEntity: true },
  { id: "minecraft:jukebox", ja: "ジュークボックス", en: "Jukebox", color: "#6a4a2e", category: "functional", blockEntity: true },
  { id: "minecraft:beacon", ja: "ビーコン", en: "Beacon", color: "#5ae8e0", category: "functional", blockEntity: true },
  { id: "minecraft:conduit", ja: "コンジット", en: "Conduit", color: "#c88a3a", category: "functional", blockEntity: true },
  { id: "minecraft:ladder", ja: "はしご", en: "Ladder", color: "#8a6a3a", category: "functional", props: FACING_H, defaults: { facing: "north" }, transparent: true },

  // ---- レッドストーン ----
  { id: "minecraft:redstone_torch", ja: "レッドストーントーチ", en: "Redstone Torch", color: "#c83a2a", category: "redstone", props: { lit: ["true", "false"] }, defaults: { lit: "true" }, transparent: true },
  { id: "minecraft:redstone_lamp", ja: "レッドストーンランプ", en: "Redstone Lamp", color: "#8a5a2a", category: "redstone", props: { lit: ["true", "false"] }, defaults: { lit: "false" } },
  { id: "minecraft:lever", ja: "レバー", en: "Lever", color: "#8a8a8a", category: "redstone", props: { ...FACING_ALL, powered: ["true", "false"] }, defaults: { facing: "up", powered: "false" }, transparent: true },
  { id: "minecraft:stone_button", ja: "石のボタン", en: "Stone Button", color: "#7a7a7a", category: "redstone", props: { ...FACING_ALL, powered: ["true", "false"] }, defaults: { facing: "north", powered: "false" }, transparent: true },
  { id: "minecraft:oak_button", ja: "オークのボタン", en: "Oak Button", color: "#a67c4a", category: "redstone", props: { ...FACING_ALL, powered: ["true", "false"] }, defaults: { facing: "north", powered: "false" }, transparent: true },
  { id: "minecraft:stone_pressure_plate", ja: "石の感圧板", en: "Stone Pressure Plate", color: "#7a7a7a", category: "redstone", props: { powered: ["true", "false"] }, defaults: { powered: "false" }, transparent: true },
  { id: "minecraft:repeater", ja: "リピーター", en: "Repeater", color: "#9a9a9a", category: "redstone", props: { ...FACING_H, delay: ["1", "2", "3", "4"], powered: ["true", "false"], locked: ["true", "false"] }, defaults: { facing: "north", delay: "1", powered: "false", locked: "false" }, transparent: true },
  { id: "minecraft:comparator", ja: "コンパレーター", en: "Comparator", color: "#9a9a9a", category: "redstone", props: { ...FACING_H, mode: ["compare", "subtract"], powered: ["true", "false"] }, defaults: { facing: "north", mode: "compare", powered: "false" }, transparent: true },
  { id: "minecraft:piston_head", ja: "ピストンヘッド", en: "Piston Head", color: "#9a8a6a", category: "redstone", props: { ...FACING_ALL, short: ["true", "false"] }, defaults: { facing: "north", short: "false" } },
  { id: "minecraft:slime_block", ja: "スライムブロック", en: "Slime Block", color: "#7ad88a", category: "redstone", transparent: true },
  { id: "minecraft:honey_block", ja: "ハチミツブロック", en: "Honey Block", color: "#d8a83a", category: "redstone", transparent: true },
  { id: "minecraft:target", ja: "的", en: "Target", color: "#d8c8b8", category: "redstone" },
  { id: "minecraft:daylight_detector", ja: "日照センサー", en: "Daylight Detector", color: "#8a7a5a", category: "redstone", transparent: true },
  { id: "minecraft:sculk_sensor", ja: "スカルクセンサー", en: "Sculk Sensor", color: "#2a4a5a", category: "redstone", blockEntity: true, transparent: true },
  { id: "minecraft:calibrated_sculk_sensor", ja: "較正されたスカルクセンサー", en: "Calibrated Sculk Sensor", color: "#3a5a6a", category: "redstone", props: FACING_H, defaults: { facing: "north" }, blockEntity: true, transparent: true },
  { id: "minecraft:copper_bulb", ja: "銅の電球", en: "Copper Bulb", color: "#c07850", category: "redstone", props: { lit: ["true", "false"], powered: ["true", "false"] }, defaults: { lit: "false", powered: "false" } },
  { id: "minecraft:crafter", ja: "クラフター", en: "Crafter", color: "#8a7a6a", category: "redstone", blockEntity: true },

  // ---- ネザー・エンド ----
  { id: "minecraft:netherrack", ja: "ネザーラック", en: "Netherrack", color: "#6e2e2e", category: "nether" },
  { id: "minecraft:nether_bricks", ja: "ネザーレンガ", en: "Nether Bricks", color: "#2e1a24", category: "nether" },
  { id: "minecraft:cracked_nether_bricks", ja: "ひび割れたネザーレンガ", en: "Cracked Nether Bricks", color: "#281624", category: "nether" },
  { id: "minecraft:chiseled_nether_bricks", ja: "模様入りネザーレンガ", en: "Chiseled Nether Bricks", color: "#2e1a24", category: "nether" },
  { id: "minecraft:red_nether_bricks", ja: "赤いネザーレンガ", en: "Red Nether Bricks", color: "#5e1e2e", category: "nether" },
  { id: "minecraft:basalt", ja: "玄武岩", en: "Basalt", color: "#5a5a5e", category: "nether", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:smooth_basalt", ja: "滑らかな玄武岩", en: "Smooth Basalt", color: "#4e4e52", category: "nether" },
  { id: "minecraft:blackstone", ja: "ブラックストーン", en: "Blackstone", color: "#2e2a33", category: "nether" },
  { id: "minecraft:polished_blackstone", ja: "磨かれたブラックストーン", en: "Polished Blackstone", color: "#3a3642", category: "nether" },
  { id: "minecraft:polished_blackstone_bricks", ja: "磨かれたブラックストーンレンガ", en: "Polished Blackstone Bricks", color: "#35313d", category: "nether" },
  { id: "minecraft:soul_sand", ja: "ソウルサンド", en: "Soul Sand", color: "#5a443e", category: "nether" },
  { id: "minecraft:soul_soil", ja: "ソウルソイル", en: "Soul Soil", color: "#4e3a34", category: "nether" },
  { id: "minecraft:nether_gold_ore", ja: "ネザー金鉱石", en: "Nether Gold Ore", color: "#7a4a3e", category: "nether" },
  { id: "minecraft:nether_quartz_ore", ja: "ネザークォーツ鉱石", en: "Nether Quartz Ore", color: "#7a5a5a", category: "nether" },
  { id: "minecraft:crimson_stem", ja: "真紅の幹", en: "Crimson Stem", color: "#6e2e3e", category: "nether", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:warped_stem", ja: "歪んだ幹", en: "Warped Stem", color: "#2e6e6a", category: "nether", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:crimson_planks", ja: "真紅の板材", en: "Crimson Planks", color: "#6e3e52", category: "nether" },
  { id: "minecraft:warped_planks", ja: "歪んだ板材", en: "Warped Planks", color: "#2e7a76", category: "nether" },
  { id: "minecraft:nether_wart_block", ja: "ネザーウォートブロック", en: "Nether Wart Block", color: "#7a1e1e", category: "nether" },
  { id: "minecraft:warped_wart_block", ja: "歪んだウォートブロック", en: "Warped Wart Block", color: "#1e6e62", category: "nether" },
  { id: "minecraft:shroomlight", ja: "シュルームライト", en: "Shroomlight", color: "#d88a4a", category: "nether" },
  { id: "minecraft:end_stone", ja: "エンドストーン", en: "End Stone", color: "#d8d29e", category: "nether" },
  { id: "minecraft:end_stone_bricks", ja: "エンドストーンレンガ", en: "End Stone Bricks", color: "#d0caa0", category: "nether" },
  { id: "minecraft:purpur_block", ja: "プルプァブロック", en: "Purpur Block", color: "#a88ab0", category: "nether" },
  { id: "minecraft:purpur_pillar", ja: "プルプァの柱", en: "Purpur Pillar", color: "#b092b8", category: "nether", props: AXIS, defaults: { axis: "y" } },
  { id: "minecraft:purpur_stairs", ja: "プルプァの階段", en: "Purpur Stairs", color: "#a88ab0", category: "nether", props: STAIR, defaults: { facing: "north", half: "bottom", shape: "straight" } },
  { id: "minecraft:purpur_slab", ja: "プルプァのハーフ", en: "Purpur Slab", color: "#a88ab0", category: "nether", props: SLAB, defaults: { type: "bottom" } },
  { id: "minecraft:magma_block", ja: "マグマブロック", en: "Magma Block", color: "#8a3e1e", category: "nether" },
  { id: "minecraft:respawn_anchor", ja: "リスポーンアンカー", en: "Respawn Anchor", color: "#3a2a4a", category: "nether", props: { charges: ["0", "1", "2", "3", "4"] }, defaults: { charges: "0" }, blockEntity: true },

  // ---- 特殊・液体 ----
  { id: "minecraft:water", ja: "水", en: "Water", color: "#3a6ad8", category: "special", transparent: true, props: { level: ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"] }, defaults: { level: "0" } },
  { id: "minecraft:lava", ja: "溶岩", en: "Lava", color: "#e86a1e", category: "special", transparent: true, props: { level: ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"] }, defaults: { level: "0" } },
  { id: "minecraft:air", ja: "空気(消去用)", en: "Air", color: "#00000000", category: "special", transparent: true },
  { id: "minecraft:structure_void", ja: "ストラクチャーヴォイド", en: "Structure Void", color: "#c83a3a", category: "special", transparent: true },
  { id: "minecraft:barrier", ja: "バリア", en: "Barrier", color: "#c83a3a", category: "special", transparent: true },
  { id: "minecraft:command_block", ja: "コマンドブロック", en: "Command Block", color: "#c88a5a", category: "special", props: { conditional: ["true", "false"], facing: ["north","south","east","west","up","down"] }, defaults: { conditional: "false", facing: "north" }, blockEntity: true },
  { id: "minecraft:chain_command_block", ja: "チェーンコマンドブロック", en: "Chain Command Block", color: "#5aa88a", category: "special", props: { conditional: ["true", "false"], facing: ["north","south","east","west","up","down"] }, defaults: { conditional: "false", facing: "north" }, blockEntity: true },
  { id: "minecraft:repeating_command_block", ja: "リピートコマンドブロック", en: "Repeating Command Block", color: "#8a6ac8", category: "special", props: { conditional: ["true", "false"], facing: ["north","south","east","west","up","down"] }, defaults: { conditional: "false", facing: "north" }, blockEntity: true },
  { id: "minecraft:structure_block", ja: "ストラクチャーブロック", en: "Structure Block", color: "#5a5a5a", category: "special", props: { mode: ["save","load","corner","data"] }, defaults: { mode: "data" }, blockEntity: true },
  { id: "minecraft:jigsaw", ja: "ジグソーブロック", en: "Jigsaw", color: "#6a5a8a", category: "special", blockEntity: true },
  { id: "minecraft:trial_spawner", ja: "トライアルスポナー", en: "Trial Spawner", color: "#5a7a8a", category: "special", blockEntity: true },
  { id: "minecraft:vault", ja: "宝物庫", en: "Vault", color: "#8a7a5a", category: "special", props: FACING_H, defaults: { facing: "north" }, blockEntity: true },
  { id: "minecraft:spawner", ja: "スポナー", en: "Spawner", color: "#3a3a3a", category: "special", blockEntity: true },
  { id: "minecraft:oak_sign", ja: "オークの看板", en: "Oak Sign", color: "#a67c4a", category: "special", blockEntity: true, transparent: true },
  { id: "minecraft:oak_hanging_sign", ja: "オークの吊り看板", en: "Oak Hanging Sign", color: "#a67c4a", category: "special", blockEntity: true, transparent: true },
  { id: "minecraft:skeleton_skull", ja: "スケルトンの頭", en: "Skeleton Skull", color: "#d8d8d8", category: "special", blockEntity: true, transparent: true },
  { id: "minecraft:player_head", ja: "プレイヤーの頭", en: "Player Head", color: "#c8a878", category: "special", blockEntity: true, transparent: true },
  { id: "minecraft:light", ja: "光ブロック", en: "Light", color: "#fff8c8", category: "special", props: { level: ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"] }, defaults: { level: "15" }, transparent: true },
];

export const AIR_ID = "minecraft:air";

const byId = new Map(BLOCKS.map((b) => [b.id, b]));
// glazed terracotta プレースホルダを実IDに解決
byId.set("minecraft:white_glazed_terracotta", {
  id: "minecraft:white_glazed_terracotta",
  ja: "白色の彩釉テラコッタ",
  en: "White Glazed Terracotta",
  color: "#d8e0e0",
  category: "colored",
  props: FACING_H,
  defaults: { facing: "north" },
});

// ============================================================
// カスタム(MOD)ブロック レジストリ & 仮ID対応
// 未登録IDでも文字列としてそのまま扱える(フォールバック表示あり)
// ============================================================
const customMap = new Map<string, BlockDef>();

/** namespace:path (Minecraftの正規表現に準拠) */
export const ID_REGEX = /^[a-z0-9_.-]+:[a-z0-9_./-]+$/;

export function setCustomBlocks(defs: BlockDef[]) {
  customMap.clear();
  for (const d of defs) customMap.set(d.id, { ...d, category: "custom" });
}
export function getCustomBlocks(): BlockDef[] {
  return [...customMap.values()];
}
export function getAllBlocks(): BlockDef[] {
  return [...BLOCKS, ...customMap.values()];
}
export function isRegistered(id: string): boolean {
  return customMap.has(id) || byId.has(id);
}
export function namespaceOf(id: string): string {
  const i = id.indexOf(":");
  return i < 0 ? "minecraft" : id.slice(0, i);
}
/** 入力を正規化: 小文字化・空白→_・名前空間なしはminecraft: を補完 */
export function normalizeBlockId(raw: string): string {
  let s = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (!s) return "";
  if (!s.includes(":")) s = `minecraft:${s}`;
  return s;
}
/** "[facing=north,lit=true]" や "facing=north,lit=true" をパース */
export function parseStateString(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const body = raw.trim().replace(/^\[/, "").replace(/\]$/, "");
  for (const part of body.split(",")) {
    const p = part.trim();
    if (!p) continue;
    const eq = p.indexOf("=");
    const k = (eq < 0 ? p : p.slice(0, eq)).trim();
    const v = eq < 0 ? "" : p.slice(eq + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}
export function stringifyState(props: Record<string, string>): string {
  return Object.keys(props)
    .map((k) => `${k}=${props[k]}`)
    .join(",");
}

/** IDから安定した色を生成 (未登録MODブロックの見分け用) */
export function hashColor(id: string): string {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return hslToHex((h >>> 0) % 360, 0.55, 0.5);
}
function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r, g, b] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = l - c / 2;
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function getBlock(id: string): BlockDef {
  const found = customMap.get(id) ?? byId.get(id);
  if (found) return found;
  const path = id.includes(":") ? id.slice(id.indexOf(":") + 1) : id;
  return { id, ja: path, en: id, color: hashColor(id), category: "custom" };
}

export function isTransparent(id: string): boolean {
  return getBlock(id).transparent ?? false;
}

// テラコッタ系のid修正 (プレースホルダ対策)
export function resolveBlockId(id: string): string {
  if (id === "minecraft:glazed_terracotta_placeholder") return "minecraft:white_glazed_terracotta";
  return id;
}

// ============================================================
// DataVersion
// ============================================================
export interface DataVersion {
  label: string;
  version: number;
}

export const DATA_VERSIONS: DataVersion[] = [
  { label: "1.21.4 (4189)", version: 4189 },
  { label: "1.21 – Tricky Trials (3953)", version: 3953 },
  { label: "1.21.1 (3955)", version: 3955 },
  { label: "1.20.6 (3839)", version: 3839 },
  { label: "1.20.5 (3837)", version: 3837 },
  { label: "1.20.4 (3700)", version: 3700 },
  { label: "1.20.2 (3578)", version: 3578 },
  { label: "1.20.1 (3465)", version: 3465 },
  { label: "1.20 (3463)", version: 3463 },
  { label: "1.19.4 (3337)", version: 3337 },
];

export const DEFAULT_DATAVERSION = 4189;
