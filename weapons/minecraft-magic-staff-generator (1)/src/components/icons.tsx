import React from 'react';
import {
  Wand2, Sparkles, Crown, Flame, Snowflake, Leaf, Moon, Sun, Zap, Eye, Waves, Gem, Skull,
  Layers, Circle, Star, Diamond, Flower2, Box, Droplet, Triangle, Hexagon, Mountain, Orbit,
  Hammer, Square, ArrowUpDown, Feather, Aperture, GitFork, Swords, Lamp, Anvil, MoonStar, Wand, Wind,
  Hourglass, BookOpen, Wine, Cross, Shell, Compass, Heart, Bell, Music, Clock, Cog, Link2,
  Cpu, Bug, Volume2, CloudFog, Shapes, Ghost, Grid3x3, Sword, Scroll, Coins, Anchor, Ribbon, Key, Orbit as OrbitIcon,
} from 'lucide-react';
import type { HeadShape, MotifStyle, OrbiterStyle, TipStyle } from '../lib/types';

const s4 = 'h-4 w-4';
const s3 = 'h-3.5 w-3.5';
const dim = `${s3} opacity-30`;

export const HEAD_ICONS: Record<HeadShape, React.ReactNode> = {
  orb: <Circle className={s4} />, crystal: <Gem className={s4} />, cluster: <Layers className={s4} />,
  star: <Star className={s4} />, crescent: <Moon className={s4} />, eye: <Eye className={s4} />,
  diamond: <Diamond className={s4} />, bloom: <Flower2 className={s4} />, skull: <Skull className={s4} />,
  'rune-cube': <Box className={s4} />, teardrop: <Droplet className={s4} />, prism: <Triangle className={s4} />,
  lantern: <Lamp className={s4} />, anvil: <Anvil className={s4} />, moonlet: <MoonStar className={s4} />,
  hourglass: <Hourglass className={s4} />, tome: <BookOpen className={s4} />, chalice: <Wine className={s4} />,
  feather: <Feather className={s4} />, ankh: <Cross className={s4} />, 'spiral-shell': <Shell className={s4} />,
  tesseract: <Grid3x3 className={s4} />, 'dragon-egg': <Ghost className={s4} />, compass: <Compass className={s4} />,
  heart: <Heart className={s4} />,
  lotus: <Flower2 className={s4} />, portal: <OrbitIcon className={s4} />, meteor: <Flame className={s4} />,
  keyhole: <Key className={s4} />, 'rose-window': <Aperture className={s4} />, mask: <Eye className={s4} />,
  octahedron: <Hexagon className={s4} />, 'aurora-crown': <Crown className={s4} />,
  'snow-globe': <Snowflake className={s4} />, butterfly: <Ghost className={s4} />, wing: <Feather className={s4} />,
  helmet: <Anvil className={s4} />, crown: <Crown className={s4} />, 'music-box': <Music className={s4} />,
  'nether-star': <Star className={s4} />, beacon: <Sun className={s4} />, totem: <Skull className={s4} />,
  geode: <Gem className={s4} />, 'ender-pearl': <Circle className={s4} />, 'potion-flask': <Droplet className={s4} />,
  'dragon-breath': <CloudFog className={s4} />, 'shulker-core': <Box className={s4} />,
  'respawn-anchor': <Anchor className={s4} />, 'glow-berries': <Leaf className={s4} />,
  banner: <Ribbon className={s4} />, brazier: <Flame className={s4} />,
};
export const HEAD_LABELS: Record<HeadShape, string> = {
  orb: '宝珠', crystal: '結晶', cluster: '晶簇', star: '星', crescent: '月', eye: '眼', diamond: '菱形', bloom: '花',
  skull: '髑髏', 'rune-cube': '立方', teardrop: '雫', prism: '棱柱', lantern: '灯', anvil: '金床', moonlet: '小月',
  hourglass: '砂時計', tome: '書物', chalice: '聖杯', feather: '羽根', ankh: 'アンク', 'spiral-shell': '巻貝',
  tesseract: '超立方', 'dragon-egg': '竜卵', compass: '羅針盤', heart: '心臓',
  lotus: '蓮華', portal: '門', meteor: '流星', keyhole: '鍵穴', 'rose-window': '薔薇窓', mask: '仮面',
  octahedron: '八面体', 'aurora-crown': '極光冠',
  'snow-globe': '雪府', butterfly: '蝶', wing: '翼', helmet: '兜', crown: '王冠', 'music-box': 'オルゴール',
  'nether-star': 'ネ星', beacon: 'ビーコン', totem: 'トーテム', geode: '晶洞',
  'ender-pearl': '真珠', 'potion-flask': '薬瓶', 'dragon-breath': '竜息', 'shulker-core': '殻核',
  'respawn-anchor': '錨', 'glow-berries': '光苺', banner: '旗', brazier: '火炉',
};

export const GENERIC_ICONS: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className={s4} />, flame: <Flame className={s4} />, snowflake: <Snowflake className={s4} />,
  zap: <Zap className={s4} />, leaf: <Leaf className={s4} />, sun: <Sun className={s4} />, moon: <Moon className={s4} />,
  droplet: <Droplet className={s4} />, waves: <Waves className={s4} />, mountain: <Mountain className={s4} />,
  orbit: <Orbit className={s4} />, circle: <Circle className={s4} />, rune: <Hexagon className={s4} />,
  hammer: <Hammer className={s4} />, crown: <Crown className={s4} />, square: <Square className={s4} />,
  eye: <Eye className={s4} />, gem: <Gem className={s4} />, skull: <Skull className={s4} />, star: <Star className={s4} />,
  staff: <Wand2 className={s4} />, rod: <ArrowUpDown className={s4} />, wand: <Wand className={s4} />,
  scepter: <Crown className={s4} />, cane: <Feather className={s4} />, trident: <GitFork className={s4} />,
  scythe: <Swords className={s4} />, crosier: <Aperture className={s4} />,
  grimoire: <BookOpen className={s4} />, 'focus-orb': <Circle className={s4} />, censer: <Bell className={s4} />,
  bell: <Bell className={s4} />, talisman: <Coins className={s4} />, spear: <Sword className={s4} />,
  bug: <Bug className={s4} />, wind: <Wind className={s4} />, sound: <Volume2 className={s4} />,
  clock: <Clock className={s4} />, dream: <CloudFog className={s4} />, crystal: <Shapes className={s4} />,
  scroll: <Scroll className={s4} />, cpu: <Cpu className={s4} />, ribbon: <Ribbon className={s4} />,
  flower: <Flower2 className={s4} />, dragon: <Ghost className={s4} />, prism: <Triangle className={s4} />, heart: <Heart className={s4} />,
  'lantern-pole': <Lamp className={s4} />, brush: <Feather className={s4} />, mace: <Anvil className={s4} />, 'chain-flail': <Link2 className={s4} />,
  relic: <Star className={s4} />, signet: <Coins className={s4} />, monolith: <Hexagon className={s4} />,
  'orb-solo': <Circle className={s4} />, pennant: <Ribbon className={s4} />, idol: <Ghost className={s4} />, chime: <Music className={s4} />,
};

export const TIP_ICONS: Record<TipStyle, React.ReactNode> = {
  none: <Circle className={dim} />, gem: <Gem className={s3} />, crown: <Crown className={s3} />,
  spike: <Triangle className={s3} />, flame: <Flame className={s3} />, star: <Star className={s3} />,
  halo: <Aperture className={s3} />, 'floating-gem': <Gem className={s3} />, cluster: <Layers className={s3} />,
  'crystal-tip': <Diamond className={s3} />, lantern: <Lamp className={s3} />,
  'orbit-ring': <Orbit className={s3} />, plume: <Feather className={s3} />, bell: <Bell className={s3} />,
  'eye-tip': <Eye className={s3} />, blade: <Sword className={s3} />,
  'gem-cluster': <Gem className={s3} />, 'triple-prong': <GitFork className={s3} />,
  'lotus-crown': <Flower2 className={s3} />, 'celestial-cage': <Aperture className={s3} />,
  reliquary: <Box className={s3} />, 'phoenix-plume': <Feather className={s3} />,
  'dragon-fang': <Triangle className={s3} />, 'void-crown': <MoonStar className={s3} />,
  'prism-vortex': <OrbitIcon className={s3} />, 'sun-disc': <Sun className={s3} />,
  'moon-circlet': <Moon className={s3} />, 'living-bloom': <Flower2 className={s3} />,
  'snow-globe-tip': <Snowflake className={s3} />, 'butterfly-tip': <Ghost className={s3} />,
  'wing-pair': <Feather className={s3} />, 'prism-trio': <Triangle className={s3} />,
};
export const TIP_LABELS: Partial<Record<TipStyle, string>> = {
  none: '無', gem: '宝石', crown: '王冠', spike: '尖晶', flame: '炎', star: '星', halo: '光輪',
  'floating-gem': '浮遊宝石', cluster: '晶簇', 'crystal-tip': '大結晶', lantern: '灯籠', 'orbit-ring': '環状軌道',
  plume: '羽飾', bell: '鈴', 'eye-tip': '魔眼', blade: '剣刃',
  'gem-cluster': '晶簇', 'triple-prong': '三叉', 'lotus-crown': '蓮冠', 'celestial-cage': '天球',
  reliquary: '聖櫃', 'phoenix-plume': '鳳羽', 'dragon-fang': '竜牙', 'void-crown': '虚冠',
  'prism-vortex': '虹渦', 'sun-disc': '陽輪', 'moon-circlet': '月冠', 'living-bloom': '花冠',
  'snow-globe-tip': '雪府球', 'butterfly-tip': '宝石蝶', 'wing-pair': '翼飾り', 'prism-trio': '虹晶三重奏',
};

export const ORB_ICONS: Record<OrbiterStyle, React.ReactNode> = {
  none: <Circle className={dim} />, orb: <Circle className={s3} />, shard: <Diamond className={s3} />,
  rune: <Hexagon className={s3} />, star: <Star className={s3} />, gear: <Cog className={s3} />,
  leaf: <Leaf className={s3} />, ember: <Flame className={s3} />, snowflake: <Snowflake className={s3} />,
  spark: <Sparkles className={s3} />, crystal: <Gem className={s3} />, skull: <Skull className={s3} />,
  feather: <Feather className={s3} />, bubble: <Droplet className={s3} />, card: <Square className={s3} />,
  'gem-set': <Gem className={s3} />, 'twin-gem': <Diamond className={s3} />, crown: <Crown className={s3} />,
  'rune-satellite': <Hexagon className={s3} />, 'prism-ring': <Aperture className={s3} />, 'petal-orbit': <Flower2 className={s3} />,
  'mini-moon': <Moon className={s3} />, sigil: <Sparkles className={s3} />, 'gem-chain': <Link2 className={s3} />,
  constellation: <Star className={s3} />, 'orbit-diamonds': <Diamond className={s3} />, hourglass: <Hourglass className={s3} />,
  'snow-globe': <Snowflake className={s3} />, 'butterfly-swarm': <Ghost className={s3} />,
  'prism-comet': <Zap className={s3} />, pearl: <Circle className={s3} />, 'comet-dust': <Sparkles className={s3} />,
};
export const ORB_LABELS: Record<OrbiterStyle, string> = {
  none: '無', orb: '宝珠', shard: '破片', rune: '符文', star: '星', gear: '歯車', leaf: '葉', ember: '火',
  snowflake: '雪晶', spark: '火花', crystal: '結晶', skull: '髑髏', feather: '羽根', bubble: '泡', card: '札',
  'gem-set': '宝石簇', 'twin-gem': '双晶', crown: '小冠', 'rune-satellite': '衛星符', 'prism-ring': '虹環',
  'petal-orbit': '花弁環', 'mini-moon': '小月', sigil: '魔印', 'gem-chain': '宝石鎖', constellation: '星座',
  'orbit-diamonds': '菱軌道', hourglass: '砂時計',
  'snow-globe': '雪府', 'butterfly-swarm': '蝶舞', 'prism-comet': '虹彗', pearl: '真珠', 'comet-dust': '星屑',
};

export const MOTIF_ICONS: Record<MotifStyle, React.ReactNode> = {
  none: <Circle className={dim} />, flame: <Flame className={s3} />, frost: <Snowflake className={s3} />,
  bolt: <Zap className={s3} />, leaf: <Leaf className={s3} />, rays: <Sun className={s3} />, wisp: <Wind className={s3} />,
  rune: <Hexagon className={s3} />, drip: <Droplet className={s3} />, wave: <Waves className={s3} />,
  rock: <Mountain className={s3} />, void: <Orbit className={s3} />,
  constellation: <Star className={s3} />, 'sculk-tendril': <Aperture className={s3} />, 'mana-weave': <Sparkles className={s3} />,
  chains: <Link2 className={s3} />, feathers: <Feather className={s3} />, gears: <Cog className={s3} />,
  shards: <Diamond className={s3} />, petals: <Flower2 className={s3} />, notes: <Music className={s3} />,
  clock: <Clock className={s3} />, 'bubbles-motif': <Droplet className={s3} />,
  'aurora-waves': <Waves className={s3} />, 'jewel-halo': <Diamond className={s3} />, 'music-notes': <Music className={s3} />,
};

export const ANCHOR_ICON = <Anchor className={s3} />;
