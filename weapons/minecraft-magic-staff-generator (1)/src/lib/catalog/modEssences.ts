/* ═══════════════════════════════════════════════════════
   Mod & Culture-inspired Texturing Essence
   (Thaumcraft, Botania, Aether, Hypixel SkyBlock, Electroblob, Astral Sorcery)
   ═══════════════════════════════════════════════════════ */

import type { ModEssenceStyle } from '../types';

export interface ModEssenceDef {
  id: ModEssenceStyle;
  name: string;
  nameEn: string;
  modSource: string;
  desc: string;
  signatureColors: [string, string, string]; // [primary, accent, glow]
}

export const MOD_ESSENCES: ModEssenceDef[] = [
  {
    id: 'none',
    name: 'バニラ標準',
    nameEn: 'Standard',
    modSource: 'Vanilla',
    desc: '標準的なファンタジーピクセルアートスタイル。',
    signatureColors: ['#6b4226', '#d4af37', '#7c3aed'],
  },
  {
    id: 'thaumcraft',
    name: 'ソームクラフト (魔導)',
    nameEn: 'Thaumic Arcana',
    modSource: 'Thaumcraft 4 & 6',
    desc: 'Visを宿すグレートウッド柄、真鍮/ヴォイドメタル口金、原初の焦点具と紫の歪み。',
    signatureColors: ['#3a1d28', '#d4af37', '#9333ea'],
  },
  {
    id: 'botania',
    name: 'ボタニア (植物魔術)',
    nameEn: 'Botanical Flora',
    modSource: 'Botania',
    desc: '生きた木 (Livingwood) や夢想の木、マナダイヤの心臓、花びらとマナ粒子のきらめき。',
    signatureColors: ['#2e4a28', '#22d3ee', '#4ade80'],
  },
  {
    id: 'aether',
    name: 'エーテル (天界の秘宝)',
    nameEn: 'Aetherial Sky',
    modSource: 'The Aether',
    desc: 'グラビタイトの浮遊共鳴、琥珀の芯、スカイルートと純白の聖金装飾。',
    signatureColors: ['#475569', '#f59e0b', '#38bdf8'],
  },
  {
    id: 'astral-sorcery',
    name: 'アストラル (星幽)',
    nameEn: 'Astral Constellation',
    modSource: 'Astral Sorcery',
    desc: '大理石の純白と宇宙の深青、星座を結ぶ輝くライン、星屑のダスト。',
    signatureColors: ['#f8fafc', '#1e1b4b', '#60a5fa'],
  },
  {
    id: 'hypixel-legend',
    name: 'スカイブロック伝説',
    nameEn: 'SkyBlock Legendary',
    modSource: 'Hypixel SkyBlock (FurfSky/AetherPack)',
    desc: '超高コントラスト、GUIで際立つネオン彩度、太いハイライトと完璧なSel-Out輪郭。',
    signatureColors: ['#18181b', '#fbbf24', '#f43f5e'],
  },
  {
    id: 'electroblob',
    name: 'ウィザードリー (魔術師)',
    nameEn: 'Wizardry Grimoire',
    modSource: "Electroblob's Wizardry",
    desc: '古代羊皮紙スクロール巻き、スペルブック留め具、属性クリスタルソケット。',
    signatureColors: ['#451a03', '#d97706', '#a855f7'],
  },
  {
    id: 'sculk-ancient',
    name: 'スカルク・深層の古代',
    nameEn: 'Deep Sculk Echo',
    modSource: 'Minecraft 1.19+ Deep Dark',
    desc: 'エコーシャードの骨芯、サイアンに脈動する触手、音波と魂の飛沫。',
    signatureColors: ['#041e24', '#06b6d4', '#14b8a6'],
  },
  {
    id: 'netherite-gilded',
    name: 'ギルデッド・ネザライト',
    nameEn: 'Gilded Netherite',
    modSource: 'Piglin Bastion & Netherite',
    desc: '黒曜合金の鈍い光沢に埋め込まれた純金幾何学模様、溶岩の微光。',
    signatureColors: ['#1c1917', '#eab308', '#f97316'],
  },
  {
    id: 'sakura-oneiric',
    name: '桜花夢幻',
    nameEn: 'Sakura Reverie',
    modSource: 'Sakura / Oneiric Flora',
    desc: '散りぬの桜を刻み込む雅な仕立て。薄紅と藤紫の絹引きの夢。',
    signatureColors: ['#fbcfe8', '#a78bfa', '#f9a8d4'],
  },
  {
    id: 'forge-master',
    name: '鍛錬の主人匠',
    nameEn: 'Forge Master',
    modSource: 'Smithing / Netherite Forge',
    desc: '幾何学模様を鋳込む鍛錬技法。鉄色ときらめく焔色の合金美。',
    signatureColors: ['#94a3b8', '#f59e0b', '#d97706'],
  },
  {
    id: 'industrial',
    name: '産業革命の巨輪',
    nameEn: 'Industrial Revolution',
    modSource: 'Create / Immersive Engineering / Mekanism',
    desc: '黄銅パイプと歯車の機械仕掛け。タービン排気に浮着するアンバーの灯。',
    signatureColors: ['#d97706', '#b87333', '#fde68a'],
  },
  {
    id: 'wildwood',
    name: '野生林の斧痕',
    nameEn: 'Wildwood Axe',
    modSource: 'Biomes O` Plenty / Tropicraft / Twilight Forest',
    desc: '生木の樹皮と苔むす節。切株にそっと芽吹く菌糸の旅路。',
    signatureColors: ['#4d7c2a', '#6b4f2e', '#a5d6a7'],
  },
  {
    id: 'aquatic',
    name: '深海沈没船の栄光',
    nameEn: 'Deep Sunken Glory',
    modSource: 'Prismarine / Ocean Monuments / Ruins',
    desc: 'プリズマリンの鱗片と錨鎖。深淵から昇る水泡の響き。',
    signatureColors: ['#0e7490', '#5eead4', '#a5f3fc'],
  },
  {
    id: 'masterwork',
    name: '玉座間の名匠',
    nameEn: 'Throne Hall Atelier',
    modSource: 'Blocks & Items / Gemcraft / Aquamarine',
    desc: '宝石を嵌め込んだ硝子筒。石座から見える内側のライト。',
    signatureColors: ['#f8fafc', '#e879f9', '#d946ef'],
  },
];

export const getModEssence = (id: ModEssenceStyle): ModEssenceDef =>
  MOD_ESSENCES.find((m) => m.id === id) || MOD_ESSENCES[0];
