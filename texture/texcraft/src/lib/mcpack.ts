import JSZip from "jszip";
import { Tex, texToCanvas } from "./tex";
import { Layer, applyStack } from "./effects";

// ============================================================
//  Minecraft Java Edition リソースパック生成
// ============================================================

export const MC_VERSIONS: { v: string; l: string; fmt: number }[] = [
  { v: "1.21.5", l: "1.21.5", fmt: 55 },
  { v: "1.21.4", l: "1.21.4", fmt: 46 },
  { v: "1.21.2", l: "1.21.2 – 1.21.3", fmt: 42 },
  { v: "1.21", l: "1.21 – 1.21.1", fmt: 34 },
  { v: "1.20.5", l: "1.20.5 – 1.20.6", fmt: 32 },
  { v: "1.20.3", l: "1.20.3 – 1.20.4", fmt: 22 },
  { v: "1.20.2", l: "1.20.2", fmt: 18 },
  { v: "1.20", l: "1.20 – 1.20.1", fmt: 15 },
  { v: "1.19.4", l: "1.19.4", fmt: 13 },
  { v: "1.19.3", l: "1.19.3", fmt: 12 },
  { v: "1.19", l: "1.19 – 1.19.2", fmt: 9 },
  { v: "1.18", l: "1.18.x", fmt: 8 },
  { v: "1.17", l: "1.17.x", fmt: 7 },
  { v: "1.16.2", l: "1.16.2 – 1.16.5", fmt: 6 },
];

export interface McTarget { path: string; label: string; warn?: string }

const TINT = "マイクラ側でバイオーム色が乗算されます。グレースケールで作ると本来の色になります。";
const ANIM = "バニラは複数フレームのアニメ画像です。アニメ書き出しを推奨します。";

/** PIXELFORGE テクスチャ → マイクラの置き換え先 */
export const TEX_TO_MC: Record<string, McTarget> = {
  grass_top: { path: "block/grass_block_top", label: "草ブロック (上面)", warn: TINT },
  dirt: { path: "block/dirt", label: "土" },
  stone: { path: "block/stone", label: "石" },
  deepslate: { path: "block/deepslate", label: "深層岩" },
  cobblestone: { path: "block/cobblestone", label: "丸石" },
  mossy_cobble: { path: "block/mossy_cobblestone", label: "苔むした丸石" },
  oak_planks: { path: "block/oak_planks", label: "オークの板材" },
  sand: { path: "block/sand", label: "砂" },
  sandstone: { path: "block/sandstone", label: "砂岩 (側面)" },
  gravel: { path: "block/gravel", label: "砂利" },
  clay: { path: "block/clay", label: "粘土" },
  terracotta: { path: "block/terracotta", label: "テラコッタ" },
  bricks: { path: "block/bricks", label: "レンガ" },
  glass: { path: "block/glass", label: "ガラス" },
  water: { path: "block/water_still", label: "水 (静止)", warn: TINT + " " + ANIM },
  lava: { path: "block/lava_still", label: "溶岩 (静止)", warn: ANIM },
  leaves: { path: "block/oak_leaves", label: "オークの葉", warn: TINT },
  snow_block: { path: "block/snow", label: "雪ブロック" },
  wool: { path: "block/white_wool", label: "白の羊毛" },
  bedrock: { path: "block/bedrock", label: "岩盤" },
  coal_ore: { path: "block/coal_ore", label: "石炭鉱石" },
  iron_ore: { path: "block/iron_ore", label: "鉄鉱石" },
  copper_ore: { path: "block/copper_ore", label: "銅鉱石" },
  gold_ore: { path: "block/gold_ore", label: "金鉱石" },
  redstone_ore: { path: "block/redstone_ore", label: "レッドストーン鉱石" },
  lapis_ore: { path: "block/lapis_ore", label: "ラピスラズリ鉱石" },
  diamond_ore: { path: "block/diamond_ore", label: "ダイヤモンド鉱石" },
  emerald_ore: { path: "block/emerald_ore", label: "エメラルド鉱石" },
  iron_block: { path: "block/iron_block", label: "鉄ブロック" },
  gold_block: { path: "block/gold_block", label: "金ブロック" },
  diamond_block: { path: "block/diamond_block", label: "ダイヤモンドブロック" },
  emerald_block: { path: "block/emerald_block", label: "エメラルドブロック" },
  netherite_block: { path: "block/netherite_block", label: "ネザライトブロック" },
  copper_block: { path: "block/copper_block", label: "銅ブロック" },
  oxidized_copper: { path: "block/oxidized_copper", label: "酸化した銅" },
  obsidian: { path: "block/obsidian", label: "黒曜石" },
  netherrack: { path: "block/netherrack", label: "ネザーラック" },
  soul_sand: { path: "block/soul_sand", label: "ソウルサンド" },
  end_stone: { path: "block/end_stone", label: "エンドストーン" },
  glowstone: { path: "block/glowstone", label: "グロウストーン" },
  ice: { path: "block/ice", label: "氷" },
  bookshelf: { path: "block/bookshelf", label: "本棚" },
  pumpkin_face: { path: "block/jack_o_lantern", label: "ジャック・オ・ランタン (正面)" },
  tnt: { path: "block/tnt_side", label: "TNT (側面)" },
  crafting_table: { path: "block/crafting_table_front", label: "作業台 (正面)" },
  diamond_sword: { path: "item/diamond_sword", label: "ダイヤモンドの剣" },
  netherite_sword: { path: "item/netherite_sword", label: "ネザライトの剣" },
  iron_pickaxe: { path: "item/iron_pickaxe", label: "鉄のツルハシ" },
  golden_pickaxe: { path: "item/golden_pickaxe", label: "金のツルハシ" },
  apple: { path: "item/apple", label: "リンゴ" },
  potion: { path: "item/potion", label: "ポーション (瓶)", warn: "中身の色は potion_overlay に乗算されます。" },
  potion_mana: { path: "item/potion", label: "ポーション (瓶)", warn: "中身の色は potion_overlay に乗算されます。" },
  gold_ingot: { path: "item/gold_ingot", label: "金インゴット" },
  iron_ingot: { path: "item/iron_ingot", label: "鉄インゴット" },
  emerald_gem: { path: "item/emerald", label: "エメラルド" },
  amethyst: { path: "item/amethyst_shard", label: "アメジストの欠片" },
  bow: { path: "item/bow", label: "弓" },
};

/** 選択候補に出す代表的なパス */
export const COMMON_PATHS: McTarget[] = (() => {
  const m = new Map<string, McTarget>();
  Object.values(TEX_TO_MC).forEach((t) => m.set(t.path, t));
  const extra: [string, string][] = [
    ["block/grass_block_side", "草ブロック (側面)"], ["block/oak_log", "オークの原木 (側面)"], ["block/oak_log_top", "オークの原木 (上面)"],
    ["block/stone_bricks", "石レンガ"], ["block/smooth_stone", "滑らかな石"], ["block/andesite", "安山岩"], ["block/granite", "花崗岩"],
    ["block/diorite", "閃緑岩"], ["block/amethyst_block", "アメジストブロック"], ["block/quartz_block_side", "クォーツブロック"],
    ["block/prismarine", "プリズマリン"], ["block/sea_lantern", "シーランタン"], ["block/redstone_block", "レッドストーンブロック"],
    ["block/lapis_block", "ラピスラズリブロック"], ["block/coal_block", "石炭ブロック"], ["block/crying_obsidian", "泣く黒曜石"],
    ["block/ancient_debris_side", "古代の残骸 (側面)"], ["block/magma", "マグマブロック"], ["block/blackstone", "ブラックストーン"],
    ["block/purpur_block", "プルプァブロック"], ["block/beacon", "ビーコン"], ["block/enchanting_table_top", "エンチャントテーブル (上面)"],
    ["item/diamond", "ダイヤモンド"], ["item/netherite_ingot", "ネザライトインゴット"], ["item/stick", "棒"],
    ["item/diamond_pickaxe", "ダイヤのツルハシ"], ["item/netherite_pickaxe", "ネザライトのツルハシ"], ["item/iron_sword", "鉄の剣"],
    ["item/golden_sword", "金の剣"], ["item/wooden_sword", "木の剣"], ["item/stone_sword", "石の剣"], ["item/diamond_axe", "ダイヤの斧"],
    ["item/golden_apple", "金のリンゴ"], ["item/ender_pearl", "エンダーパール"], ["item/blaze_rod", "ブレイズロッド"],
    ["item/nether_star", "ネザースター"], ["item/totem_of_undying", "不死のトーテム"], ["item/book", "本"],
    ["item/enchanted_book", "エンチャントの本"], ["item/experience_bottle", "エンチャントの瓶"], ["item/trident", "トライデント"],
    ["item/crossbow_standby", "クロスボウ"], ["item/arrow", "矢"], ["item/bread", "パン"], ["item/cooked_beef", "ステーキ"],
  ];
  extra.forEach(([p, l]) => { if (!m.has(p)) m.set(p, { path: p, label: l }); });
  return [...m.values()].sort((a, b) => a.path.localeCompare(b.path));
})();

export interface PackEntry {
  key: string;
  path: string;           // 例: block/stone
  label: string;
  size: number;
  frames: number;         // 1 = 静止画
  frametime: number;      // tick (1tick = 1/20秒)
  interpolate: boolean;
  png: Blob;
  thumb: string;          // dataURL
}

export function validPath(p: string) {
  return /^(block|item|entity|painting|particle|mob_effect|gui|environment|misc|models\/armor)\/[a-z0-9_\-/.]+$/.test(p);
}

/** 現在の状態から、マイクラ用画像を書き出す（アニメの場合は縦にフレームを並べる） */
export async function buildEntry(opts: {
  base: Tex; layers: Layer[]; path: string; label: string;
  frames: number; loopSec: number; interpolate: boolean;
}): Promise<PackEntry> {
  const { base, layers, frames, loopSec } = opts;
  const s = base.w;
  const c = document.createElement("canvas");
  c.width = s; c.height = s * frames;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  for (let f = 0; f < frames; f++) {
    const t = applyStack(base, layers, frames > 1 ? f / frames : 0);
    g.drawImage(texToCanvas(t), 0, f * s);
  }
  const png = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), "image/png"));
  const thumb = texToCanvas(applyStack(base, layers, 0)).toDataURL();
  return {
    key: `${opts.path}-${Date.now()}`,
    path: opts.path, label: opts.label, size: s, frames,
    frametime: Math.max(1, Math.round((loopSec * 20) / frames)),
    interpolate: opts.interpolate, png, thumb,
  };
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function downloadPack(entries: PackEntry[], o: { name: string; description: string; fmt: number; edition?: "java" | "bedrock" }) {
  const edition = o.edition ?? "java";
  const zip = new JSZip();
  if (edition === "bedrock") {
    const manifest = {
      format_version: 2,
      header: { description: o.description, name: o.name, uuid: generateUUID(), version: [1, 0, 0], min_engine_version: [1, 20, 0] },
      modules: [{ description: o.description, type: "resources", uuid: generateUUID(), version: [1, 0, 0] }],
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    const remap = (p: string) => p.startsWith("block/") ? p.replace("block/", "blocks/") : p.startsWith("item/") ? p.replace("item/", "items/") : p;
    for (const e of entries) {
      const file = `textures/${remap(e.path)}.png`;
      const png = await (await fetch(e.thumb)).blob();
      zip.file(file, png);
      if (e.frames > 1) zip.file(`${file}.mcmeta`, JSON.stringify({ animation: { frametime: e.frametime, interpolate: e.interpolate } }, null, 2));
    }
    if (entries[0]) {
      const icon = await (await fetch(entries[0].thumb)).blob();
      zip.file("pack_icon.png", icon);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${o.name.replace(/[^\w\-]+/g, "_") || "TexCraft"}_Bedrock.mcpack`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const allFmts = MC_VERSIONS.map((v) => v.fmt);
  const mcmeta = {
    pack: {
      pack_format: o.fmt,
      supported_formats: { min_inclusive: Math.min(...allFmts), max_inclusive: Math.max(o.fmt, 99) },
      description: o.description,
    },
  };
  zip.file("pack.mcmeta", JSON.stringify(mcmeta, null, 2));

  for (const e of entries) {
    const file = `assets/minecraft/textures/${e.path}.png`;
    zip.file(file, e.png);
    if (e.frames > 1) {
      zip.file(`${file}.mcmeta`, JSON.stringify({ animation: { frametime: e.frametime, interpolate: e.interpolate } }, null, 2));
    }
  }

  // パックのアイコン（1枚目を 128px に拡大）
  if (entries[0]) {
    const im = new Image();
    im.src = entries[0].thumb;
    await im.decode();
    const c = document.createElement("canvas");
    c.width = 128; c.height = 128;
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.drawImage(im, 0, 0, 128, 128);
    const icon = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
    if (icon) zip.file("pack.png", icon);
  }

  zip.file("README.txt",
    `${o.name}\nPIXELFORGE で作成したリソースパックです。\n\n【入れ方】\n1. マイクラを起動 → 設定 → リソースパック → 「パックフォルダーを開く」\n2. この zip をそのまま resourcepacks フォルダに入れる（解凍不要）\n3. 一覧に出たパックを右側（使用中）へ移動して「完了」\n\n【中身】\n${entries.map((e) => `- textures/${e.path}.png  (${e.size}px${e.frames > 1 ? `, ${e.frames}フレームのアニメ` : ""})`).join("\n")}\n`);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${o.name.replace(/[^\w\-]+/g, "_") || "PixelForge"}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface TextureTarget {
  id: string;
  name: string;
  category: "block" | "item" | "painting" | "pack_icon";
  path: string; // relative to assets/minecraft/textures/
  recommendedSize: number; // e.g. 16, 32, 64
  description: string;
}

export const TEXTURE_TARGETS: TextureTarget[] = [
  // Blocks
  { id: "diamond_block", name: "ダイヤモンドブロック", category: "block", path: "block/diamond_block.png", recommendedSize: 16, description: "高級感ある青く輝くブロック" },
  { id: "dirt", name: "土ブロック", category: "block", path: "block/dirt.png", recommendedSize: 16, description: "ワールドの基本となる土" },
  { id: "stone", name: "石", category: "block", path: "block/stone.png", recommendedSize: 16, description: "地下を構成する標準的な石" },
  { id: "cobblestone", name: "丸石", category: "block", path: "block/cobblestone.png", recommendedSize: 16, description: "採掘した石ブロック" },
  { id: "oak_planks", name: "オークの板材", category: "block", path: "block/oak_planks.png", recommendedSize: 16, description: "建築の王道となる木材" },
  { id: "obsidian", name: "黒曜石", category: "block", path: "block/obsidian.png", recommendedSize: 16, description: "ネザーゲートを作る堅牢なブロック" },
  { id: "gold_block", name: "金ブロック", category: "block", path: "block/gold_block.png", recommendedSize: 16, description: "黄金色に輝くブロック" },
  { id: "iron_block", name: "鉄ブロック", category: "block", path: "block/iron_block.png", recommendedSize: 16, description: "金属質の白いブロック" },
  { id: "emerald_block", name: "エメラルドブロック", category: "block", path: "block/emerald_block.png", recommendedSize: 16, description: "深い緑の宝石ブロック" },
  { id: "tnt_side", name: "TNT (側面)", category: "block", path: "block/tnt_side.png", recommendedSize: 16, description: "爆薬ブロックの横面" },
  { id: "crafting_table_top", name: "作業台 (天面)", category: "block", path: "block/crafting_table_top.png", recommendedSize: 16, description: "クラフトの天面グリッド" },
  { id: "bookshelf", name: "本棚", category: "block", path: "block/bookshelf.png", recommendedSize: 16, description: "エンチャント部屋の本棚" },
  { id: "bricks", name: "レンガ", category: "block", path: "block/bricks.png", recommendedSize: 16, description: "焼きレンガのブロック" },
  { id: "glass", name: "ガラス", category: "block", path: "block/glass.png", recommendedSize: 16, description: "透明なガラス窓" },
  { id: "crying_obsidian", name: "泣く黒曜石", category: "block", path: "block/crying_obsidian.png", recommendedSize: 16, description: "紫の粒子を放つ神秘の黒曜石" },

  // Items
  { id: "diamond_sword", name: "ダイヤの剣", category: "item", path: "item/diamond_sword.png", recommendedSize: 16, description: "定番の最強武器テクスチャ" },
  { id: "netherite_sword", name: "ネザライトの剣", category: "item", path: "item/netherite_sword.png", recommendedSize: 16, description: "漆黒の最高位武器" },
  { id: "golden_apple", name: "金色のリンゴ", category: "item", path: "item/golden_apple.png", recommendedSize: 16, description: "特殊効果を付与する至高の食料" },
  { id: "totem_of_undying", name: "不死のトーテム", category: "item", path: "item/totem_of_undying.png", recommendedSize: 16, description: "プレイヤーの死を防ぐトーテム" },
  { id: "ender_pearl", name: "エンダーパール", category: "item", path: "item/ender_pearl.png", recommendedSize: 16, description: "テレポートするパール" },
  { id: "diamond", name: "ダイヤモンド", category: "item", path: "item/diamond.png", recommendedSize: 16, description: "鉱石の王様" },

  // Paintings
  { id: "painting_alban", name: "絵画: Alban (16x16)", category: "painting", path: "painting/alban.png", recommendedSize: 16, description: "小さな額縁絵画" },
  { id: "painting_aztec", name: "絵画: Aztec (16x16)", category: "painting", path: "painting/aztec.png", recommendedSize: 16, description: "アステカ風の絵画" },
  { id: "painting_bust", name: "絵画: Bust (32x32)", category: "painting", path: "painting/bust.png", recommendedSize: 32, description: "中型サイズの胸像絵画" },
  { id: "painting_match", name: "絵画: Match (32x32)", category: "painting", path: "painting/match.png", recommendedSize: 32, description: "中型サイズのマッチ絵画" },
  { id: "painting_pointer", name: "絵画: Pointer (64x64)", category: "painting", path: "painting/pointer.png", recommendedSize: 64, description: "壁一面の大型アート" },
  { id: "painting_pigscene", name: "絵画: Pigscene (64x64)", category: "painting", path: "painting/pigscene.png", recommendedSize: 64, description: "大型サイズの絵画" },

  // Pack Icon
  { id: "pack_icon", name: "パックアイコン (pack.png)", category: "pack_icon", path: "pack.png", recommendedSize: 64, description: "リソースパック選択画面に表示される顔" },
];
