import type { Design } from './archetypes';
import type { Mats, Anim } from './engine';

export type RarityId = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'divine' | 'special';

/** SkyBlock rarity colours = Minecraft formatting codes (§f §a §9 §5 §6 §d §b §c). */
export const RARITIES: Record<RarityId, { en: string; jp: string; color: string; code: string }> = {
  common: { en: 'COMMON', jp: 'コモン', color: '#FFFFFF', code: '§f' },
  uncommon: { en: 'UNCOMMON', jp: 'アンコモン', color: '#55FF55', code: '§a' },
  rare: { en: 'RARE', jp: 'レア', color: '#5555FF', code: '§9' },
  epic: { en: 'EPIC', jp: 'エピック', color: '#AA00AA', code: '§5' },
  legendary: { en: 'LEGENDARY', jp: 'レジェンダリー', color: '#FFAA00', code: '§6' },
  mythic: { en: 'MYTHIC', jp: 'ミシック', color: '#FF55FF', code: '§d' },
  divine: { en: 'DIVINE', jp: 'ディバイン', color: '#55FFFF', code: '§b' },
  special: { en: 'SPECIAL', jp: 'スペシャル', color: '#FF5555', code: '§c' },
};

export type CatItem = {
  id: string;
  en: string;
  jp: string;
  /** vanilla 1.8.9 item the SkyBlock item is built on — used for OptiFine CIT `items=` */
  base: string;
  rarity: RarityId | null;
  type?: string;
  design: Design;
  mats: Mats;
  anim: Anim;
};

const d = (arch: Design['arch'], a: number, b: number, len: number, wid: number, orn: number, gem: boolean, rune: boolean): Design => ({ arch, a, b, len, wid, orn, gem, rune });
const m = (main: Mats['main'], trim: Mats['trim'], grip: Mats['grip'], gem: Mats['gem'], aura: Mats['aura']): Mats => ({ main, trim, grip, gem, aura });

export const CATALOG: CatItem[] = [
  { id: 'HYPERION', en: 'Hyperion', jp: 'ハイペリオン', base: 'iron_sword', rarity: 'legendary', type: 'DUNGEON SWORD', design: d('sword', 0, 1, 0.95, 0.55, 0.7, true, true), mats: m('steel', 'gold', 'void', 'amethyst', 'void'), anim: 'shimmer' },
  { id: 'ASPECT_OF_THE_END', en: 'Aspect of the End', jp: 'アスペクト・オブ・ジ・エンド', base: 'diamond_sword', rarity: 'rare', type: 'SWORD', design: d('sword', 0, 0, 0.7, 0.45, 0.2, true, false), mats: m('ender', 'obsidian', 'obsidian', 'amethyst', 'void'), anim: 'none' },
  { id: 'ASPECT_OF_THE_DRAGONS', en: 'Aspect of the Dragons', jp: 'アスペクト・オブ・ザ・ドラゴン', base: 'diamond_sword', rarity: 'legendary', type: 'SWORD', design: d('sword', 1, 1, 0.8, 0.9, 0.9, true, true), mats: m('crimson', 'gold', 'leather', 'ruby', 'flame'), anim: 'pulse' },
  { id: 'GIANTS_SWORD', en: "Giant's Sword", jp: 'ジャイアントの剣', base: 'iron_sword', rarity: 'legendary', type: 'DUNGEON SWORD', design: d('sword', 1, 0, 1, 1, 0.3, false, false), mats: m('iron', 'netherite', 'leather', 'ruby', 'spirit'), anim: 'none' },
  { id: 'MIDAS_SWORD', en: "Midas' Sword", jp: 'ミダスの剣', base: 'golden_sword', rarity: 'legendary', type: 'SWORD', design: d('sword', 2, 3, 0.75, 0.6, 0.4, true, false), mats: m('gold', 'gold', 'crimson', 'ruby', 'flame'), anim: 'twinkle' },
  { id: 'SHADOW_FURY', en: 'Shadow Fury', jp: 'シャドウフューリー', base: 'diamond_sword', rarity: 'legendary', type: 'DUNGEON SWORD', design: d('sword', 3, 2, 0.85, 0.4, 0.2, false, true), mats: m('obsidian', 'netherite', 'leather', 'amethyst', 'void'), anim: 'flow' },
  { id: 'ASPECT_OF_THE_VOID', en: 'Aspect of the Void', jp: 'アスペクト・オブ・ザ・ヴォイド', base: 'diamond_shovel', rarity: 'epic', design: d('sword', 5, 1, 0.8, 0.45, 0.5, true, true), mats: m('amethyst', 'obsidian', 'obsidian', 'ender', 'void'), anim: 'pulse' },
  { id: 'YETI_SWORD', en: 'Yeti Sword', jp: 'イエティソード', base: 'iron_sword', rarity: 'legendary', type: 'SWORD', design: d('sword', 4, 1, 0.85, 0.55, 0.6, true, false), mats: m('frost', 'steel', 'leather', 'diamond', 'spirit'), anim: 'twinkle' },
  { id: 'EMERALD_BLADE', en: 'Emerald Blade', jp: 'エメラルドブレード', base: 'emerald', rarity: 'epic', type: 'SWORD', design: d('sword', 2, 0, 0.7, 0.6, 0.3, true, false), mats: m('emerald', 'gold', 'leather', 'emerald', 'toxic'), anim: 'shimmer' },
  { id: 'ROGUE_SWORD', en: 'Rogue Sword', jp: 'ローグソード', base: 'golden_sword', rarity: 'common', type: 'SWORD', design: d('sword', 0, 0, 0.4, 0.35, 0, false, false), mats: m('gold', 'oak', 'leather', 'ruby', 'flame'), anim: 'none' },
  { id: 'ASPECT_OF_THE_JERRY', en: 'Aspect of the Jerry', jp: 'アスペクト・オブ・ザ・ジェリー', base: 'wooden_sword', rarity: 'common', type: 'SWORD', design: d('sword', 1, 0, 0.5, 0.7, 0, false, false), mats: m('oak', 'ebony', 'leather', 'emerald', 'toxic'), anim: 'none' },
  { id: 'TERMINATOR', en: 'Terminator', jp: 'ターミネーター', base: 'bow', rarity: 'legendary', type: 'DUNGEON BOW', design: d('bow', 2, 1, 0.7, 0.8, 0.8, true, false), mats: m('obsidian', 'amethyst', 'wither', 'amethyst', 'void'), anim: 'pulse' },
  { id: 'JUJU_SHORTBOW', en: 'Juju Shortbow', jp: 'ジュジュ・ショートボウ', base: 'bow', rarity: 'epic', type: 'BOW', design: d('bow', 2, 0, 0.6, 0.7, 0.3, false, false), mats: m('oak', 'emerald', 'leather', 'emerald', 'toxic'), anim: 'flow' },
  { id: 'REAPER_SCYTHE', en: 'Reaper Scythe', jp: 'リーパーサイズ', base: 'diamond_hoe', rarity: 'legendary', design: d('scythe', 0, 1, 0.8, 0.6, 0.5, true, true), mats: m('netherite', 'bone', 'ebony', 'ruby', 'toxic'), anim: 'pulse' },
  { id: 'FROZEN_SCYTHE', en: 'Frozen Scythe', jp: 'フローズンサイズ', base: 'iron_hoe', rarity: 'rare', design: d('scythe', 2, 0, 0.6, 0.5, 0.2, false, false), mats: m('frost', 'steel', 'ebony', 'diamond', 'spirit'), anim: 'twinkle' },
  { id: 'AXE_OF_THE_SHREDDED', en: 'Axe of the Shredded', jp: 'シュレッデッドの斧', base: 'diamond_axe', rarity: 'legendary', design: d('axe', 1, 1, 0.7, 0.8, 0.6, true, true), mats: m('netherite', 'crimson', 'ebony', 'ruby', 'flame'), anim: 'pulse' },
  { id: 'TREECAPITATOR_AXE', en: 'Treecapitator', jp: 'ツリーキャピテーター', base: 'golden_axe', rarity: 'epic', design: d('axe', 2, 0, 0.7, 0.7, 0.2, false, false), mats: m('gold', 'steel', 'oak', 'emerald', 'toxic'), anim: 'none' },
  { id: 'JUNGLE_AXE', en: 'Jungle Axe', jp: 'ジャングルアックス', base: 'wooden_axe', rarity: 'uncommon', design: d('axe', 0, 0, 0.6, 0.6, 0, false, false), mats: m('oak', 'leather', 'ebony', 'emerald', 'toxic'), anim: 'none' },
  { id: 'DIVAN_DRILL', en: "Divan's Drill", jp: 'ディバンのドリル', base: 'prismarine_shard', rarity: 'mythic', type: 'DRILL', design: d('drill', 1, 1, 0.6, 0.7, 0.6, true, true), mats: m('gold', 'mithril', 'leather', 'diamond', 'spirit'), anim: 'shimmer' },
  { id: 'GRAPPLING_HOOK', en: 'Grappling Hook', jp: 'グラップリングフック', base: 'fishing_rod', rarity: 'uncommon', design: d('rod', 2, 0, 0.6, 0.5, 0, false, false), mats: m('oak', 'steel', 'leather', 'ruby', 'silk'), anim: 'none' },
  { id: 'BONZO_STAFF', en: "Bonzo's Staff", jp: 'ボンゾの杖', base: 'blaze_rod', rarity: 'rare', design: d('staff', 0, 0, 0.6, 0.6, 0.2, false, false), mats: m('gold', 'gold', 'oak', 'ruby', 'flame'), anim: 'none' },
  { id: 'MIDAS_STAFF', en: 'Midas Staff', jp: 'ミダスの杖', base: 'golden_shovel', rarity: 'legendary', design: d('staff', 3, 1, 0.7, 0.6, 0.5, false, true), mats: m('gold', 'gold', 'ebony', 'amber', 'flame'), anim: 'pulse' },
  { id: 'ICE_SPRAY_WAND', en: 'Ice Spray Wand', jp: 'アイススプレーワンド', base: 'stick', rarity: 'rare', design: d('wand', 1, 1, 0.6, 0.5, 0.2, false, false), mats: m('steel', 'steel', 'leather', 'frost', 'spirit'), anim: 'twinkle' },
  { id: 'SKYBLOCK_MENU', en: 'SkyBlock Menu', jp: 'SkyBlock メニュー', base: 'nether_star', rarity: null, design: d('star', 0, 1, 0.5, 0.5, 0, false, false), mats: m('frost', 'gold', 'leather', 'diamond', 'spirit'), anim: 'twinkle' },
  { id: 'ENCHANTED_DIAMOND', en: 'Enchanted Diamond', jp: 'エンチャントダイヤモンド', base: 'diamond', rarity: 'uncommon', design: d('gem', 0, 1, 0.5, 0.5, 0, false, false), mats: m('diamond', 'gold', 'leather', 'diamond', 'spirit'), anim: 'shimmer' },
  { id: 'ENCHANTED_GOLD', en: 'Enchanted Gold', jp: 'エンチャントゴールド', base: 'gold_ingot', rarity: 'uncommon', design: d('ingot', 0, 0, 0.5, 0.5, 0, false, false), mats: m('gold', 'gold', 'leather', 'amber', 'flame'), anim: 'shimmer' },
  { id: 'HOT_POTATO_BOOK', en: 'Hot Potato Book', jp: 'ホットポテトブック', base: 'book', rarity: 'epic', design: d('book', 0, 0, 0.5, 0.5, 0, false, false), mats: m('crimson', 'gold', 'leather', 'amber', 'paper'), anim: 'none' },
  { id: 'SPIRIT_LEAP', en: 'Spirit Leap', jp: 'スピリットリープ', base: 'ender_pearl', rarity: 'rare', design: d('orb', 2, 0, 0.5, 0.5, 0, false, false), mats: m('ender', 'gold', 'leather', 'ender', 'spirit'), anim: 'twinkle' },
  { id: 'STORM_CHESTPLATE', en: "Storm's Chestplate", jp: 'ストームの胸当て', base: 'leather_chestplate', rarity: 'legendary', design: d('chest', 0, 1, 0.5, 0.5, 0.4, true, false), mats: m('diamond', 'steel', 'leather', 'sapphire', 'spirit'), anim: 'shimmer' },
  { id: 'NECRON_LEGGINGS', en: "Necron's Leggings", jp: 'ネクロンの脚甲', base: 'leather_leggings', rarity: 'legendary', design: d('legs', 0, 0, 0.5, 0.5, 0.3, true, false), mats: m('crimson', 'netherite', 'leather', 'ruby', 'flame'), anim: 'none' },
  { id: 'GOLDOR_BOOTS', en: "Goldor's Boots", jp: 'ゴルドーの靴', base: 'leather_boots', rarity: 'legendary', design: d('boots', 1, 0, 0.5, 0.5, 0.3, true, false), mats: m('steel', 'gold', 'netherite', 'amber', 'flame'), anim: 'none' },
  { id: 'HARDENED_DIAMOND_HELMET', en: 'Hardened Diamond Helmet', jp: '硬化ダイヤの兜', base: 'diamond_helmet', rarity: 'rare', design: d('helmet', 0, 0, 0.5, 0.5, 0.2, false, false), mats: m('diamond', 'steel', 'leather', 'sapphire', 'spirit'), anim: 'none' },
  { id: 'AEGIS_OF_THE_ELEMENTS', en: 'Aegis of the Elements', jp: '元素のイージス', base: 'shield', rarity: 'mythic', type: 'SHIELD', design: { ...d('shield', 0, 2, 0.8, 0.7, 0.8, true, true), coreMode: 2 }, mats: m('mithril', 'gold', 'leather', 'amethyst', 'spirit'), anim: 'aurora' },

  /* ---- mechanical / modern ---- */
  { id: 'RIPPER_CHAINSAW', en: 'Ripper Chainsaw', jp: 'リッパーチェーンソー', base: 'diamond_axe', rarity: 'legendary', type: 'CHAINSAW', design: d('chainsaw', 2, 1, 0.85, 0.7, 0.5, true, false), mats: m('gunmetal', 'copper', 'leather', 'amber', 'storm'), anim: 'chain' },
  { id: 'GRAVESAW', en: 'Gravesaw', jp: 'グレイヴソー', base: 'iron_axe', rarity: 'epic', type: 'CHAINSAW', design: { ...d('chainsaw', 1, 0, 0.7, 0.9, 0.3, false, true), adornment: 'thorns' }, mats: m('rust', 'blackgold', 'gore', 'ruby', 'blood'), anim: 'drip' },
  { id: 'MARKSMAN_RIFLE', en: 'Marksman Rifle', jp: 'マークスマンライフル', base: 'iron_hoe', rarity: 'epic', type: 'FIREARM', design: d('gun', 1, 1, 0.8, 0.5, 0.2, false, false), mats: m('carbon', 'gunmetal', 'leather', 'neon', 'neon'), anim: 'muzzle' },
  { id: 'HAND_CANNON', en: 'Hand Cannon', jp: 'ハンドキャノン', base: 'golden_shovel', rarity: 'legendary', type: 'FIREARM', design: d('gun', 3, 0, 0.6, 0.9, 0.6, true, true), mats: m('blackgold', 'gold', 'leather', 'amber', 'flame'), anim: 'muzzle' },
  { id: 'TESLA_RAILGUN', en: 'Tesla Railgun', jp: 'テスラレールガン', base: 'diamond_hoe', rarity: 'divine', type: 'RAILGUN', design: { ...d('railgun', 2, 1, 0.9, 0.6, 0.7, true, true), adornment: 'orbitals' }, mats: m('chrome', 'titanium', 'carbon', 'frost', 'plasma'), anim: 'charge' },
  { id: 'VOID_ACCELERATOR', en: 'Void Accelerator', jp: 'ヴォイドアクセラレータ', base: 'prismarine_shard', rarity: 'mythic', type: 'RAILGUN', design: d('railgun', 3, 0, 0.75, 0.8, 0.4, true, true), mats: m('obsidian', 'blackgold', 'carbon', 'amethyst', 'void'), anim: 'charge' },

  /* ---- martial ---- */
  { id: 'REGAL_WAR_SPEAR', en: 'Regal War Spear', jp: '儀仗の戦槍', base: 'iron_shovel', rarity: 'mythic', type: 'SPEAR', design: { ...d('spear', 0, 3, 0.9, 0.6, 1, true, true), adornment: 'filigree' }, mats: m('gold', 'rosegold', 'silk', 'opal', 'spirit'), anim: 'shimmer' },
  { id: 'DRAGON_TRIDENT', en: 'Dragon Trident', jp: '竜の三叉槍', base: 'iron_shovel', rarity: 'legendary', type: 'SPEAR', design: { ...d('spear', 1, 1, 0.85, 0.75, 0.9, true, true), adornment: 'crest' }, mats: m('crimson', 'gold', 'leather', 'ruby', 'flame'), anim: 'flame' },
  { id: 'LUNAR_GLAIVE', en: 'Lunar Glaive', jp: '月輪の薙刀', base: 'iron_shovel', rarity: 'epic', type: 'SPEAR', design: { ...d('spear', 2, 0, 0.8, 0.6, 0.8, true, false), adornment: 'sigil' }, mats: m('frost', 'mithril', 'silk', 'sapphire', 'spirit'), anim: 'aurora' },
  { id: 'FLANGED_WARMACE', en: 'Flanged Warmace', jp: 'フランジ戦槌', base: 'iron_axe', rarity: 'legendary', type: 'MACE', design: d('mace', 0, 0, 0.7, 0.85, 0.6, true, false), mats: m('steel', 'gold', 'leather', 'ruby', 'spirit'), anim: 'none' },
  { id: 'MORNING_STAR', en: 'Morning Star', jp: 'モーニングスター', base: 'iron_axe', rarity: 'epic', type: 'MACE', design: d('mace', 1, 1, 0.65, 0.9, 0.5, false, true), mats: m('rust', 'gunmetal', 'leather', 'ruby', 'blood'), anim: 'none' },
  { id: 'STARFALL_MAUL', en: 'Starfall Maul', jp: 'スターフォールモール', base: 'diamond_axe', rarity: 'mythic', type: 'MACE', design: { ...d('mace', 2, 0, 0.8, 1, 0.9, true, true), adornment: 'orbitals' }, mats: m('mithril', 'gold', 'silk', 'opal', 'storm'), anim: 'lightning' },
  { id: 'SIEGE_CROSSBOW', en: 'Siege Crossbow', jp: '攻城弩', base: 'bow', rarity: 'epic', type: 'CROSSBOW', design: d('crossbow', 1, 1, 0.8, 0.9, 0.4, true, false), mats: m('ebony', 'steel', 'leather', 'amber', 'flame'), anim: 'none' },
  { id: 'REPEATER_CROSSBOW', en: 'Repeater Crossbow', jp: '連弩', base: 'bow', rarity: 'rare', type: 'CROSSBOW', design: d('crossbow', 2, 1, 0.6, 0.6, 0.2, false, false), mats: m('gunmetal', 'copper', 'leather', 'neon', 'neon'), anim: 'none' },

  /* ---- arcane & cursed ---- */
  { id: 'ASTRAL_RUNEBLADE', en: 'Astral Runeblade', jp: '星霊の魔刃', base: 'diamond_sword', rarity: 'divine', type: 'RUNEBLADE', design: { ...d('runeblade', 3, 0, 0.9, 0.6, 0.8, true, true), adornment: 'sigil' }, mats: m('mithril', 'gold', 'silk', 'sapphire', 'spirit'), anim: 'arcane' },
  { id: 'SPELLBREAKER', en: 'Spellbreaker', jp: 'スペルブレイカー', base: 'diamond_sword', rarity: 'legendary', type: 'RUNEBLADE', design: d('runeblade', 1, 1, 0.8, 0.7, 0.6, true, true), mats: m('ebony', 'amethyst', 'silk', 'amethyst', 'void'), anim: 'pulse' },
  { id: 'ELDRITCH_GRIMBLADE', en: 'Eldritch Grimblade', jp: '禍々しき呪刃', base: 'iron_sword', rarity: 'mythic', type: 'CURSED BLADE', design: { ...d('grimblade', 2, 0, 0.85, 0.8, 0.9, true, true), adornment: 'thorns' }, mats: m('chitin', 'bone', 'sinew', 'void', 'void'), anim: 'pulse' },
  { id: 'BLOODLETTER', en: 'Bloodletter', jp: 'ブラッドレッター', base: 'iron_sword', rarity: 'legendary', type: 'CURSED BLADE', design: { ...d('grimblade', 0, 2, 0.8, 0.9, 0.7, true, true), adornment: 'sigil' }, mats: m('rust', 'blackgold', 'gore', 'ruby', 'blood'), anim: 'drip' },
  { id: 'BONE_REAVER', en: 'Bone Reaver', jp: 'ボーンリーヴァー', base: 'iron_sword', rarity: 'epic', type: 'CURSED BLADE', design: d('grimblade', 1, 1, 0.75, 0.7, 0.6, false, true), mats: m('bone', 'chitin', 'sinew', 'toxic', 'toxic'), anim: 'flow' },

  /* ---- 魔導書・魔導 ---- */
  { id: 'GRIMOIRE_OF_ARCANA', en: 'Grimoire of Arcana', jp: '魔導書', base: 'book', rarity: 'epic', type: 'GRIMOIRE', design: { ...d('tome', 0, 0, 0.8, 0.8, 0.9, true, true), grad: { mode: 'radial', angle: 135, bias: 0, contrast: 0.95, spread: 0.55, local: true } }, mats: m('ebony', 'amethyst', 'silk', 'amethyst', 'spirit'), anim: 'enchant' },
  { id: 'SPELLCIRCLE_TOME', en: 'Spellcircle Tome', jp: '魔法陣の魔典', base: 'enchanted_book', rarity: 'divine', type: 'GRIMOIRE', design: { ...d('tome', 3, 0, 0.85, 0.85, 1, true, true), grad: { mode: 'ripple', angle: 135, bias: 0, contrast: 1.1, spread: 0.45, local: true } }, mats: m('mithril', 'gold', 'silk', 'sapphire', 'plasma'), anim: 'shockwave' },
  { id: 'CODEX_OF_THE_DEAD', en: 'Codex of the Dead', jp: '死霊の法典', base: 'book', rarity: 'mythic', type: 'GRIMOIRE', design: { ...d('tome', 4, 0, 0.8, 0.8, 0.8, true, true), grad: { mode: 'split', angle: 115, bias: 0, contrast: 1.25, spread: 0.4, local: true } }, mats: m('chitin', 'bone', 'sinew', 'void', 'void'), anim: 'smoke' },
  { id: 'SEALED_TALISMAN', en: 'Sealed Talisman', jp: '封印の護符書', base: 'book', rarity: 'legendary', type: 'GRIMOIRE', design: { ...d('tome', 2, 1, 0.7, 0.75, 0.6, true, true), grad: { mode: 'sweep', angle: 135, bias: 0, contrast: 1.1, spread: 0.5, local: true } }, mats: m('rosegold', 'gold', 'silk', 'opal', 'spirit'), anim: 'twinkle' },

  /* ---- レリック ---- */
  { id: 'IDOL_OF_THE_FORGOTTEN', en: 'Idol of the Forgotten', jp: '忘却の偶像', base: 'nether_star', rarity: 'mythic', type: 'RELIC', design: { ...d('relic', 0, 0, 0.85, 0.85, 0.9, true, true), grad: { mode: 'vignette', angle: 135, bias: 0.05, contrast: 1.15, spread: 0.5, local: true } }, mats: m('blackgold', 'gold', 'bone', 'opal', 'void'), anim: 'arcane' },
  { id: 'CROWN_OF_THE_ELDERS', en: 'Crown of the Elders', jp: '古王の王冠', base: 'golden_helmet', rarity: 'legendary', type: 'RELIC', design: { ...d('relic', 1, 0, 0.8, 0.8, 1, true, true), grad: { mode: 'diagonal', angle: 135, bias: 0.08, contrast: 1.1, spread: 0.5, local: true } }, mats: m('gold', 'rosegold', 'silk', 'ruby', 'spirit'), anim: 'shimmer' },
  { id: 'ASTRAL_AMULET', en: 'Astral Amulet', jp: '星霊の護符', base: 'ender_eye', rarity: 'epic', type: 'RELIC', design: { ...d('relic', 2, 0, 0.8, 0.8, 0.8, true, true), grad: { mode: 'radial', angle: 135, bias: 0, contrast: 1, spread: 0.5, local: true } }, mats: m('mithril', 'gold', 'silk', 'sapphire', 'spirit'), anim: 'aurora' },
  { id: 'CHALICE_OF_ETERNITY', en: 'Chalice of Eternity', jp: '永遠の聖杯', base: 'glass_bottle', rarity: 'divine', type: 'RELIC', design: { ...d('relic', 3, 0, 0.8, 0.8, 0.85, true, true), grad: { mode: 'radial', angle: 135, bias: -0.1, contrast: 1.15, spread: 0.55, local: true } }, mats: m('gold', 'rosegold', 'silk', 'opal', 'spirit'), anim: 'pulse' },
  { id: 'TOTEM_OF_THE_WILD', en: 'Totem of the Wild', jp: '荒野のトーテム', base: 'totem_of_undying', rarity: 'legendary', type: 'RELIC', design: { ...d('relic', 4, 1, 0.8, 0.85, 0.8, true, true), grad: { mode: 'split', angle: 90, bias: 0, contrast: 1.05, spread: 0.45, local: true } }, mats: m('ebony', 'copper', 'leather', 'emerald', 'toxic'), anim: 'sparks' },
  { id: 'ASTROLABE_OF_FATE', en: 'Astrolabe of Fate', jp: '運命の天球儀', base: 'compass', rarity: 'mythic', type: 'RELIC', design: { ...d('relic', 5, 0, 0.85, 0.85, 0.9, true, true), grad: { mode: 'ripple', angle: 135, bias: 0, contrast: 1.2, spread: 0.4, local: true } }, mats: m('chrome', 'gold', 'silk', 'frost', 'plasma'), anim: 'orbit' },

  /* ---- 追加武器（魔導・機械・血） ---- */
  { id: 'ARCANE_ORBITBLADE', en: 'Arcane Orbitblade', jp: '魔導の環刃', base: 'diamond_sword', rarity: 'divine', type: 'RUNEBLADE', design: { ...d('runeblade', 2, 0, 0.85, 0.7, 0.9, true, true), grad: { mode: 'band', angle: 135, bias: 0, contrast: 1.1, spread: 0.3, local: true } }, mats: m('mithril', 'gold', 'silk', 'amethyst', 'plasma'), anim: 'shockwave' },
  { id: 'MECH_CLAYMORE', en: 'Mech Claymore', jp: '機甲大剣', base: 'iron_sword', rarity: 'legendary', type: 'MECHANIZED', design: { ...d('sword', 1, 1, 1, 1, 0.5, true, true), grad: { mode: 'band', angle: 90, bias: 0, contrast: 1, spread: 0.28, local: true } }, mats: m('gunmetal', 'copper', 'carbon', 'amber', 'neon'), anim: 'charge' },
  { id: 'BLOODTHIRST_SCYTHE', en: 'Bloodthirst Scythe', jp: '血飢えの大鎌', base: 'diamond_hoe', rarity: 'mythic', type: 'CURSED', design: { ...d('scythe', 0, 1, 0.9, 0.7, 0.8, true, true), grad: { mode: 'diagonal', angle: 135, bias: -0.12, contrast: 1.2, spread: 0.5, local: true } }, mats: m('rust', 'blackgold', 'gore', 'ruby', 'blood'), anim: 'drip' },
  { id: 'CURSED_SAW', en: 'Cursed Saw', jp: '呪縛の鋸', base: 'golden_axe', rarity: 'mythic', type: 'CHAINSAW', design: { ...d('chainsaw', 2, 1, 0.85, 0.85, 0.7, true, true), grad: { mode: 'split', angle: 115, bias: 0, contrast: 1.2, spread: 0.4, local: true } }, mats: m('chitin', 'bone', 'gore', 'ruby', 'blood'), anim: 'chain' },
  { id: 'RUNEPOLE_SPEAR', en: 'Runepole Spear', jp: '魔紋の長槍', base: 'iron_shovel', rarity: 'divine', type: 'SPEAR', design: { ...d('spear', 3, 3, 0.9, 0.7, 1, true, true), grad: { mode: 'sweep', angle: 135, bias: 0.06, contrast: 1.15, spread: 0.55, local: true } }, mats: m('gold', 'mithril', 'silk', 'opal', 'plasma'), anim: 'enchant' },
];

/** 1.8.9 base items OptiFine CIT can target (for custom IDs). */
export const BASE_ITEMS = [
  'iron_sword', 'diamond_sword', 'golden_sword', 'stone_sword', 'wooden_sword', 'bow', 'fishing_rod', 'stick', 'blaze_rod',
  'diamond_axe', 'golden_axe', 'iron_axe', 'wooden_axe', 'diamond_pickaxe', 'golden_pickaxe', 'iron_pickaxe', 'diamond_hoe', 'iron_hoe',
  'diamond_shovel', 'golden_shovel', 'prismarine_shard', 'nether_star', 'diamond', 'emerald', 'gold_ingot', 'iron_ingot', 'book',
  'ender_pearl', 'diamond_helmet', 'iron_helmet', 'leather_chestplate', 'leather_leggings', 'leather_boots', 'shield', 'feather', 'bone', 'paper',
  'iron_shovel', 'stone_shovel', 'stone_axe', 'stone_pickaxe', 'golden_hoe', 'wooden_hoe', 'flint', 'quartz', 'redstone', 'blaze_powder', 'ghast_tear', 'magma_cream',
  'enchanted_book', 'ender_eye', 'totem_of_undying', 'compass', 'glass_bottle', 'golden_helmet', 'nether_star', 'prismarine_shard', 'amethyst_shard', 'echo_shard', 'name_tag', 'tripwire_hook',
];
