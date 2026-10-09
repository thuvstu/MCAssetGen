export type ItemKind = 'sword' | 'bow' | 'axe' | 'pickaxe' | 'helmet' | 'chestplate' | 'shield' | 'block' | 'orb' | 'staff' | 'hoe';

export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC' | 'DIVINE' | 'SPECIAL';

export interface ItemDef {
  id: string;
  name: string;
  jp: string;
  kind: ItemKind;
  rarity: Rarity;
  category: string;
  desc: string;
  damage?: string;
  // palette driving the generator
  palette: {
    primary: string;   // blade / main
    light: string;     // highlight
    dark: string;      // shadow
    accent: string;    // guard / trim / glow
    handle: string;    // grip / secondary
    extra?: string;    // gem / rune
  };
  shape: number; // shape variant 0-4
  glow: boolean;
}

export const RARITY_COLOR: Record<Rarity, string> = {
  COMMON: '#ffffff',
  UNCOMMON: '#55ff55',
  RARE: '#5555ff',
  EPIC: '#aa00aa',
  LEGENDARY: '#ffaa00',
  MYTHIC: '#ff55ff',
  DIVINE: '#55ffff',
  SPECIAL: '#ff5555',
};

export const RARITY_JP: Record<Rarity, string> = {
  COMMON: 'コモン',
  UNCOMMON: 'アンコモン',
  RARE: 'レア',
  EPIC: 'エピック',
  LEGENDARY: 'レジェンダリー',
  MYTHIC: 'ミシック',
  DIVINE: 'ディバイン',
  SPECIAL: 'スペシャル',
};

export const ITEMS: ItemDef[] = [
  {
    id: 'hyperion', name: 'Hyperion', jp: 'ハイペリオン', kind: 'sword', rarity: 'MYTHIC', category: '剣 Sword',
    desc: 'ウィザーの力を宿した伝説の剣。スクロールが唸る。',
    damage: '❁ Damage +260  ✎ Intelligence +460',
    palette: { primary: '#8fb8ff', light: '#e8f3ff', dark: '#2b3f8f', accent: '#7a5cff', handle: '#2a2140', extra: '#c9b8ff' },
    shape: 3, glow: true,
  },
  {
    id: 'aotd', name: 'Aspect of the Dragons', jp: 'アスペクト・オブ・ドラゴン', kind: 'sword', rarity: 'LEGENDARY', category: '剣 Sword',
    desc: 'エンダードラゴンの鱗を溶かし込んだ大剣。',
    damage: '❁ Damage +225  ❈ Strength +100',
    palette: { primary: '#ff9a2e', light: '#ffe9a8', dark: '#a33d00', accent: '#ff4d2e', handle: '#4a2410', extra: '#fff36b' },
    shape: 0, glow: true,
  },
  {
    id: 'midas', name: "Midas' Sword", jp: 'ミダスソード', kind: 'sword', rarity: 'LEGENDARY', category: '剣 Sword',
    desc: '触れるもの全てを黄金に変える王の剣。',
    damage: '❁ Damage +150  ✪ Greed V',
    palette: { primary: '#ffcf3d', light: '#fff6c8', dark: '#9a5b00', accent: '#ff9d00', handle: '#5a2e00', extra: '#ffffff' },
    shape: 1, glow: true,
  },
  {
    id: 'valkyrie', name: 'Valkyrie', jp: 'ヴァルキリー', kind: 'sword', rarity: 'MYTHIC', category: '剣 Sword',
    desc: 'ネクロンの刃、血に飢えた一振り。',
    damage: '❁ Damage +300  ☠ Crit Damage +60%',
    palette: { primary: '#e5484d', light: '#ffb3ab', dark: '#5e0f1e', accent: '#2b0a12', handle: '#1a0d14', extra: '#ff7a5c' },
    shape: 2, glow: true,
  },
  {
    id: 'fot', name: 'Flower of Truth', jp: 'フラワー・オブ・トゥルース', kind: 'sword', rarity: 'LEGENDARY', category: '剣 Sword',
    desc: '真実を咲かせる薔薇の大剣。',
    damage: '❁ Damage +200  ❤ Health +300',
    palette: { primary: '#ff4d6d', light: '#ffc2d1', dark: '#7a0e2e', accent: '#2e7d32', handle: '#1e4d1e', extra: '#fff0f3' },
    shape: 4, glow: false,
  },
  {
    id: 'atomsplit', name: 'Atomsplit Katana', jp: 'アトムスプリットカタナ', kind: 'sword', rarity: 'DIVINE', category: '剣 Sword',
    desc: '原子を両断する終末の刀。',
    damage: '❁ Damage +300  ⚔ Attack Speed +30',
    palette: { primary: '#5cf2ff', light: '#e6ffff', dark: '#0b5a8a', accent: '#0e1a2e', handle: '#101828', extra: '#b8fffb' },
    shape: 1, glow: true,
  },
  {
    id: 'claymore', name: 'Dark Claymore', jp: 'ダーククレイモア', kind: 'sword', rarity: 'LEGENDARY', category: '剣 Sword',
    desc: '深淵の闇を纏った両手剣。',
    damage: '❁ Damage +500  ⫽ Sweep 60',
    palette: { primary: '#6d5cff', light: '#c4b5fd', dark: '#1a1038', accent: '#0d071f', handle: '#1c1430', extra: '#8b5cf6' },
    shape: 2, glow: true,
  },
  {
    id: 'giant', name: "Giant's Sword", jp: 'ジャイアントソード', kind: 'sword', rarity: 'LEGENDARY', category: '剣 Sword',
    desc: '巨人の骨から削り出した巨剣。',
    damage: '❁ Damage +160  ❈ Strength +110',
    palette: { primary: '#c8ccd4', light: '#ffffff', dark: '#4a4f5e', accent: '#7a2e2e', handle: '#3a2620', extra: '#e8ecf4' },
    shape: 2, glow: false,
  },
  {
    id: 'terminator', name: 'Terminator', jp: 'ターミネーター', kind: 'bow', rarity: 'MYTHIC', category: '弓 Bow',
    desc: '三連の審判を下す究極の弓。',
    damage: '❁ Damage +310  ☣ Crit Damage +250%',
    palette: { primary: '#2a2f45', light: '#8b93b8', dark: '#0c0e1a', accent: '#35f2ff', handle: '#12141f', extra: '#ff3df2' },
    shape: 2, glow: true,
  },
  {
    id: 'juju', name: 'Juju Shortbow', jp: 'ジュジュショートボウ', kind: 'bow', rarity: 'EPIC', category: '弓 Bow',
    desc: 'ヴードゥーの呪いを矢に込める短弓。',
    damage: '❁ Damage +310  ➶ Instant Shoot',
    palette: { primary: '#8b5cf6', light: '#ddd6fe', dark: '#3b1d8f', accent: '#f5c542', handle: '#2e1a08', extra: '#fbbf24' },
    shape: 1, glow: true,
  },
  {
    id: 'runaan', name: "Runaan's Bow", jp: 'ルーナンズボウ', kind: 'bow', rarity: 'LEGENDARY', category: '弓 Bow',
    desc: '三本の矢が獲物を追尾する魔弓。',
    damage: '❁ Damage +160  ❂ Triple Shot',
    palette: { primary: '#4caf50', light: '#c8e6c9', dark: '#1b4d1e', accent: '#8d5a2b', handle: '#4a2f16', extra: '#d6ff7a' },
    shape: 0, glow: false,
  },
  {
    id: 'sceptre', name: 'Spirit Sceptre', jp: 'スピリットセプター', kind: 'staff', rarity: 'EPIC', category: '杖 Staff',
    desc: 'コウモリの魂を束ねる霊杖。',
    damage: '❁ Damage +200  ✎ Intelligence +300',
    palette: { primary: '#7a5cff', light: '#e0d4ff', dark: '#2a1a6b', accent: '#1a1038', handle: '#241a4a', extra: '#b18cff' },
    shape: 0, glow: true,
  },
  {
    id: 'midasstaff', name: 'Midas Staff', jp: 'ミダススタッフ', kind: 'staff', rarity: 'LEGENDARY', category: '杖 Staff',
    desc: '黄金の輝きが敵を貫く。',
    damage: '❁ Damage +160  ✎ Intelligence +200',
    palette: { primary: '#ffcf3d', light: '#fff6c8', dark: '#7a4d00', accent: '#fff3b0', handle: '#5a2e00', extra: '#ff9d00' },
    shape: 1, glow: true,
  },
  {
    id: 'aotv', name: 'Aspect of the Void', jp: 'アスペクト・オブ・ヴォイド', kind: 'sword', rarity: 'EPIC', category: '剣 Sword',
    desc: '虚空を切り裂き瞬間移動する刃。',
    damage: '❁ Damage +120  ✦ Ether Transmission',
    palette: { primary: '#3d2b8f', light: '#a99cff', dark: '#0d0726', accent: '#35f2ff', handle: '#14102e', extra: '#7a5cff' },
    shape: 3, glow: true,
  },
  {
    id: 'treecap', name: 'Treecapitator', jp: 'ツリーキャピテイター', kind: 'axe', rarity: 'EPIC', category: '斧 Axe',
    desc: '森ごと薙ぎ倒す黄金の斧。',
    damage: '❁ Damage +120  ☘ Foraging Fortune +50',
    palette: { primary: '#ffcf3d', light: '#fff6c8', dark: '#8a5a00', accent: '#5a3a00', handle: '#4a2f16', extra: '#ffffff' },
    shape: 1, glow: false,
  },
  {
    id: 'pickonimbus', name: 'Pickonimbus 2000', jp: 'ピコニンバス2000', kind: 'pickaxe', rarity: 'RARE', category: 'ツルハシ Pick',
    desc: '5000回掘れる虹色のツルハシ。',
    damage: '⛏ Mining Speed +1000',
    palette: { primary: '#5cf2ff', light: '#ffffff', dark: '#1a4a8a', accent: '#ff7ad9', handle: '#3a2a1a', extra: '#ffe14d' },
    shape: 0, glow: false,
  },
  {
    id: 'gemdrill', name: 'Gemstone Drill', jp: 'ジェムストーンドリル', kind: 'pickaxe', rarity: 'MYTHIC', category: 'ツルハシ Pick',
    desc: 'ジェムストーンを砕く工業ドリル。',
    damage: '⛏ Mining Speed +1800  ♦ Gemstone',
    palette: { primary: '#3a4358', light: '#aab4d0', dark: '#0e111c', accent: '#ffcf3d', handle: '#1a1d2e', extra: '#35f2ff' },
    shape: 1, glow: true,
  },
  {
    id: 'necronhelm', name: 'Necron Helmet', jp: 'ネクロンヘルメット', kind: 'helmet', rarity: 'MYTHIC', category: '防具 Armor',
    desc: 'ウィザーロードの血塗られた兜。',
    damage: '❤ Health +120  ❈ Strength +40',
    palette: { primary: '#e5484d', light: '#ff9a8a', dark: '#4d0f16', accent: '#1a0a0e', handle: '#2b0f14', extra: '#ffcf3d' },
    shape: 0, glow: false,
  },
  {
    id: 'stormhelm', name: "Storm's Helmet", jp: 'ストームヘルメット', kind: 'helmet', rarity: 'MYTHIC', category: '防具 Armor',
    desc: '嵐の叡智を宿す巻物兜。',
    damage: '✎ Intelligence +400  ❤ Health +90',
    palette: { primary: '#5cc8ff', light: '#e6f7ff', dark: '#0b3a6b', accent: '#f5c542', handle: '#1a2740', extra: '#ffffff' },
    shape: 1, glow: true,
  },
  {
    id: 'sahelm', name: 'Shadow Assassin Helmet', jp: 'シャドーアサシンヘルメット', kind: 'helmet', rarity: 'LEGENDARY', category: '防具 Armor',
    desc: '闇に紛れる暗殺者の面。',
    damage: '☠ Crit Damage +35%  ⚔ Attack Speed +10',
    palette: { primary: '#2e2a4a', light: '#8b7fd4', dark: '#0a0818', accent: '#b18cff', handle: '#14121f', extra: '#ff3df2' },
    shape: 2, glow: true,
  },
  {
    id: 'goggles', name: 'Wither Goggles', jp: 'ウィザーゴーグル', kind: 'helmet', rarity: 'MYTHIC', category: '防具 Armor',
    desc: 'ウィザーの視界を分け与える目鏡。',
    damage: '✎ Intelligence +300  ☄ Ability Damage +35%',
    palette: { primary: '#3b2a5e', light: '#b18cff', dark: '#0e081f', accent: '#35f2ff', handle: '#0a0a14', extra: '#ff7ad9' },
    shape: 3, glow: true,
  },
  {
    id: 'necronchest', name: "Necron's Chestplate", jp: 'ネクロンチェストプレート', kind: 'chestplate', rarity: 'MYTHIC', category: '防具 Armor',
    desc: '血と闇で鍛えた胸当て。',
    damage: '❤ Health +230  ❈ Strength +60',
    palette: { primary: '#c92a3a', light: '#ff8a7a', dark: '#3d0a12', accent: '#5e1620', handle: '#2b0f14', extra: '#ffcf3d' },
    shape: 0, glow: false,
  },
  {
    id: 'superiorchest', name: 'Superior Chestplate', jp: 'スペリオルチェストプレート', kind: 'chestplate', rarity: 'LEGENDARY', category: '防具 Armor',
    desc: 'ドラゴンの帝王が纏う黄金鎧。',
    damage: '❤ Health +150  ❁ Damage +20  ✎ Int +100',
    palette: { primary: '#ffcf3d', light: '#fff6c8', dark: '#7a3d00', accent: '#ff4d2e', handle: '#5a2e00', extra: '#ffffff' },
    shape: 1, glow: true,
  },
  {
    id: 'witherbulwark', name: 'Wither Bulwark', jp: 'ウィザーブルワーク', kind: 'shield', rarity: 'MYTHIC', category: '盾 Shield',
    desc: 'ウィザーの核を封じた異形の騎士盾。',
    damage: '❈ Defense +220  ☄ Wither Guard',
    palette: { primary: '#493969', light: '#bca5ef', dark: '#110b20', accent: '#d2a83f', handle: '#251b35', extra: '#9a6cff' },
    shape: 0, glow: true,
  },
  {
    id: 'dragonaegis', name: 'Dragon Aegis', jp: 'ドラゴンイージス', kind: 'shield', rarity: 'LEGENDARY', category: '盾 Shield',
    desc: '竜鱗を幾層にも重ねた円盾。',
    damage: '❈ Defense +180  ♨ Dragon Ward',
    palette: { primary: '#b6412d', light: '#ffb06f', dark: '#451013', accent: '#e8bd4d', handle: '#4a241c', extra: '#ffdf75' },
    shape: 1, glow: true,
  },
  {
    id: 'crystaltower', name: 'Crystal Tower Shield', jp: 'クリスタルタワーシールド', kind: 'shield', rarity: 'DIVINE', category: '盾 Shield',
    desc: '採掘島の結晶層を切り出した巨大盾。',
    damage: '❈ Defense +260  ♦ Prismatic Shell',
    palette: { primary: '#35aeca', light: '#d2fbff', dark: '#083b62', accent: '#8e57d8', handle: '#1f3555', extra: '#ed91ff' },
    shape: 2, glow: true,
  },
  {
    id: 'diamondblock', name: 'Enchanted Diamond Block', jp: 'エンチャントダイヤブロック', kind: 'block', rarity: 'UNCOMMON', category: 'ブロック Block',
    desc: '圧縮された輝きの結晶塊。',
    damage: '♦ Gemstone  ⛏ Mining VII',
    palette: { primary: '#3fb8e0', light: '#d6fbff', dark: '#0a4a73', accent: '#0e3a5e', handle: '#123', extra: '#9df0ff' },
    shape: 0, glow: false,
  },
  {
    id: 'eye', name: 'Summoning Eye', jp: 'サモニングアイ', kind: 'orb', rarity: 'EPIC', category: '素材 Material',
    desc: 'ドラゴンを呼び覚ます禁断の瞳。',
    damage: '☠ Place on Altar to Summon',
    palette: { primary: '#3ddc5c', light: '#d6ffd6', dark: '#0b4d1e', accent: '#0a1f0e', handle: '#123', extra: '#c8ffd4' },
    shape: 0, glow: true,
  },
  {
    id: 'pearl', name: 'Enchanted Ender Pearl', jp: 'エンチャントエンダーパール', kind: 'orb', rarity: 'UNCOMMON', category: '素材 Material',
    desc: '虚空の粒子が渦巻く真珠。',
    damage: '✦ Teleport 12 blocks',
    palette: { primary: '#2bd9a8', light: '#d6ffef', dark: '#0a4d3a', accent: '#0a2a24', handle: '#123', extra: '#a8ffe2' },
    shape: 1, glow: true,
  },
  {
    id: 'withercloak', name: 'Wither Cloak Sword', jp: 'ウィザークロークソード', kind: 'sword', rarity: 'EPIC', category: '剣 Sword',
    desc: '2秒間 無敵の帳を纏う。',
    damage: '❁ Damage +140  ❈ Strength +70',
    palette: { primary: '#1a1d2e', light: '#6b76a8', dark: '#05060c', accent: '#7a5cff', handle: '#0e0f1a', extra: '#b18cff' },
    shape: 4, glow: true,
  },
  {
    id: 'hoe', name: 'Fermento Hoe', jp: 'ファーメントホー', kind: 'hoe', rarity: 'MYTHIC', category: 'クワ Hoe',
    desc: '畑を黄金に変える神秘の鍬。',
    damage: '☘ Farming Fortune +120',
    palette: { primary: '#d4a24e', light: '#ffedc2', dark: '#5e3a0e', accent: '#2e7d32', handle: '#4a2f16', extra: '#d6ff7a' },
    shape: 0, glow: false,
  },
  {
    id: 'chimera', name: 'Chimera Book', jp: 'キメラの本', kind: 'block', rarity: 'MYTHIC', category: '素材 Material',
    desc: '禁書の頁が紫に燃える。',
    damage: '✎ Ultimate Enchant',
    palette: { primary: '#7a2bff', light: '#dcc2ff', dark: '#1a0a3e', accent: '#2a1650', handle: '#1a1030', extra: '#ff3df2' },
    shape: 1, glow: true,
  },
];

export const CATEGORIES = ['すべて', '剣 Sword', '弓 Bow', '杖 Staff', '斧 Axe', 'ツルハシ Pick', 'クワ Hoe', '盾 Shield', '防具 Armor', 'ブロック Block', '素材 Material'];
