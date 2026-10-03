/* ═══════════════════════════════════════════════════════
   Arcane Forge — shared type definitions
   ═══════════════════════════════════════════════════════ */

export type Resolution = 16 | 32 | 64 | 128;

/* ── 属性 / element ── */
export type ElementType =
  | 'none' | 'fire' | 'ice' | 'lightning' | 'nature' | 'light'
  | 'dark' | 'arcane' | 'blood' | 'water' | 'earth' | 'void'
  | 'poison' | 'wind' | 'crystal' | 'sound' | 'time' | 'dream'
  | 'sakura' | 'steel' | 'cosmos' | 'desert' | 'dragon' | 'psyche'
  /* ── 構造系：機械・自然・宝石・海・村 ── */
  | 'foreman' | 'grove' | 'gemshine' | 'undertow' | 'vine' | 'duality' | 'pastoral';

/* ── 型 / item type ── */
export type ItemType =
  | 'staff' | 'rod' | 'wand' | 'scepter' | 'cane' | 'trident' | 'scythe' | 'crosier'
  | 'grimoire' | 'focus-orb' | 'censer' | 'bell' | 'talisman' | 'spear'
  | 'lantern-pole' | 'brush' | 'mace' | 'chain-flail'
  /* ── 型に囚われない: shaft-free relics ── */
  | 'relic' | 'signet' | 'monolith' | 'orb-solo' | 'pennant' | 'idol' | 'chime';

/** Item families that render as a free-floating relic with no shaft at all. */
export const SHAFTLESS_TYPES: ItemType[] = ['relic', 'signet', 'monolith', 'orb-solo', 'pennant', 'idol', 'chime'];
export const isShaftless = (t: ItemType) => SHAFTLESS_TYPES.includes(t);

/* ── レアリティ ── */
export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'divine';

/* ── カラーハーモニー ── */
export type HarmonyScheme = 'custom' | 'complementary' | 'analogous' | 'triadic' | 'split' | 'tetradic' | 'monochrome';

export type ShaftStyle =
  | 'straight' | 'gnarled' | 'twisted' | 'bone' | 'royal' | 'leather' | 'bamboo' | 'ornate'
  | 'crystal' | 'segmented' | 'obsidian' | 'ivory'
  | 'braided' | 'chain-link' | 'rune-carved' | 'coral' | 'techno' | 'driftwood'
  | 'ebony' | 'porcelain' | 'alloy'
  /* ── 構造系：機械・自然・宝石・海 ── */
  | 'oak' | 'birch' | 'dark-oak' | 'spruce' | 'jungle' | 'cherry' | 'mangrove' | 'azalea'
  | 'mech-brass' | 'mech-iron' | 'copper' | 'pipe' | 'conveyor'
  | 'gemmed' | 'gem-column' | 'gem-tube' | 'embedding'
  | 'bamboo-woven' | 'glass' | 'prismarine' | 'kelp-rope' | 'anchor-chain' | 'sponge';

/** True Minecraft wood textures — authentic vanilla log / stem / stripped-pole feel. */
export const WOOD_STYLE_SET: ReadonlySet<string> = new Set(['oak','birch','dark-oak','spruce','jungle','cherry','mangrove','azalea','bamboo','bamboo-woven','gnarled','driftwood']);
/** Mechanical / industrial shaft materials. */
export const MECH_STYLE_SET: ReadonlySet<string> = new Set(['mech-brass','mech-iron','copper','pipe','conveyor','techno','alloy','segmented']);
/** Jewel-encrusted shaft family. */
export const GEM_STYLE_SET: ReadonlySet<string> = new Set(['gemmed','gem-column','gem-tube','embedding','crystal']);
/** Ocean and aquatic shaft materials. */
export const AQUATIC_STYLE_SET: ReadonlySet<string> = new Set(['prismarine','kelp-rope','anchor-chain','sponge','coral','glass']);
export const isWoodStyle=(s:string)=>WOOD_STYLE_SET.has(s), isMechStyle=(s:string)=>MECH_STYLE_SET.has(s);
export const isGemStyle=(s:string)=>GEM_STYLE_SET.has(s), isAquaticStyle=(s:string)=>AQUATIC_STYLE_SET.has(s);
export type WrapStyle = 'none' | 'spiral' | 'rings' | 'vine' | 'chain' | 'rune-band' | 'stitch' | 'scale' | 'ribbon' | 'thorn' | 'wire';
export type CollarStyle = 'none' | 'ring' | 'guard' | 'crown' | 'claw' | 'filigree' | 'socket' | 'wing-guard' | 'skull-collar' | 'orb-cage'
  | 'tea-cup' | 'bell-dome';
export type HeadShape =
  | 'orb' | 'crystal' | 'cluster' | 'star' | 'crescent' | 'eye' | 'diamond' | 'bloom'
  | 'skull' | 'rune-cube' | 'teardrop' | 'prism' | 'lantern' | 'anvil' | 'moonlet'
  | 'hourglass' | 'tome' | 'chalice' | 'feather' | 'ankh' | 'spiral-shell' | 'tesseract' | 'dragon-egg' | 'compass' | 'heart'
  | 'lotus' | 'portal' | 'meteor' | 'keyhole' | 'rose-window' | 'mask' | 'octahedron' | 'aurora-crown'
  | 'snow-globe' | 'butterfly' | 'wing' | 'helmet' | 'crown' | 'music-box'
  /* ── Minecraft world iconic ── */
  | 'nether-star' | 'beacon' | 'totem' | 'geode' | 'ender-pearl' | 'potion-flask' | 'dragon-breath' | 'shulker-core'
  | 'respawn-anchor' | 'glow-berries' | 'banner' | 'brazier';
export type InnerStyle = 'core' | 'facet' | 'swirl' | 'galaxy' | 'none' | 'crack' | 'liquid';
export type PommelStyle = 'none' | 'cap' | 'gem' | 'spike' | 'ring' | 'tassel' | 'skullcap' | 'orb' | 'crescent' | 'anchor'
  | 'split-tassel' | 'lantern-hanger';
export type TipStyle =
  | 'none' | 'gem' | 'crown' | 'spike' | 'flame' | 'star' | 'halo' | 'floating-gem'
  | 'cluster' | 'crystal-tip' | 'lantern' | 'orbit-ring' | 'plume' | 'bell' | 'eye-tip' | 'blade'
  | 'gem-cluster' | 'triple-prong' | 'lotus-crown' | 'celestial-cage' | 'reliquary' | 'phoenix-plume'
  | 'dragon-fang' | 'void-crown' | 'prism-vortex' | 'sun-disc' | 'moon-circlet' | 'living-bloom'
  | 'snow-globe-tip' | 'butterfly-tip' | 'wing-pair' | 'prism-trio';
export type OrbiterStyle =
  | 'none' | 'orb' | 'shard' | 'rune' | 'star' | 'gear' | 'leaf' | 'ember' | 'snowflake' | 'spark'
  | 'crystal' | 'skull' | 'feather' | 'bubble' | 'card'
  | 'gem-set' | 'twin-gem' | 'crown' | 'rune-satellite' | 'prism-ring' | 'petal-orbit' | 'mini-moon'
  | 'sigil' | 'gem-chain' | 'constellation' | 'orbit-diamonds' | 'hourglass'
  | 'snow-globe' | 'butterfly-swarm' | 'prism-comet' | 'pearl' | 'comet-dust';
export type WingStyle = 'none' | 'angel' | 'bat' | 'fae' | 'blade' | 'seraph' | 'mech' | 'crystal' | 'flame' | 'leafwing' | 'peacock' | 'cape';
export type HaloStyle = 'none' | 'ring' | 'double' | 'rune-ring' | 'eclipse' | 'sunburst' | 'triple' | 'hex-grid' | 'spiral' | 'shattered' | 'lens-flare';
export type ParticleStyle = 'sparkle' | 'dots' | 'plus' | 'diamonds' | 'mixed' | 'embers' | 'bubbles' | 'snow' | 'leaf' | 'stars' | 'runes' | 'hearts' | 'ash' | 'musical' | 'firefly' | 'glow-dust';
export type OutlineStyle = 'none' | 'dark' | 'light' | 'gold' | 'colored' | 'selout' | 'rarity';
export type FinishStyle = 'matte' | 'glossy' | 'metallic' | 'enchanted' | 'weathered' | 'holographic' | 'frosted' | 'lacquered' | 'pearl' | 'vegetal';
export type MotifStyle =
  | 'none' | 'flame' | 'frost' | 'bolt' | 'leaf' | 'rays' | 'wisp' | 'rune' | 'drip' | 'wave' | 'rock' | 'void'
  | 'constellation' | 'sculk-tendril' | 'mana-weave'
  | 'chains' | 'feathers' | 'gears' | 'shards' | 'petals' | 'notes' | 'clock' | 'bubbles-motif'
  | 'aurora-waves' | 'jewel-halo' | 'music-notes';

/* ── 摩耗・ダメージ ── */
export type WearStyle = 'none' | 'chipped' | 'cracked' | 'scratched' | 'burned' | 'mossy' | 'frosted-over' | 'blood-stained';

/* ── 吊り下げ装飾 ── */
export type DangleStyle = 'none' | 'ribbon' | 'chain-charm' | 'bell' | 'feather' | 'crystal-drop' | 'beads' | 'talisman-tag';
export type GemCut = 'brilliant' | 'emerald' | 'marquise' | 'cabochon' | 'star-cut' | 'opal' | 'prism' | 'rose-cut';
export type GemMount = 'claw' | 'bezel' | 'cage' | 'floating' | 'halo' | 'petal';
export type AdornmentStyle = 'none' | 'filigree' | 'star-map' | 'thorn-vine' | 'gold-pave' | 'rune-engraving' | 'chain-drape' | 'petal-mantle' | 'geodesic' | 'braided';

export type ModEssenceStyle =
  | 'none' | 'thaumcraft' | 'botania' | 'aether' | 'astral-sorcery'
  | 'hypixel-legend' | 'electroblob' | 'sculk-ancient' | 'netherite-gilded'
  | 'sakura-oneiric' | 'forge-master'
  | 'industrial' | 'wildwood' | 'aquatic' | 'masterwork';

/* ── アニメーション ── */
export type AnimationType =
  | 'none' | 'enchant-glint' | 'pulse-glow' | 'orbit' | 'float' | 'flame-flicker'
  | 'lightning-arc' | 'frost-shimmer' | 'spin-gem' | 'rainbow-core' | 'holy-rays'
  | 'bubbles-rise' | 'petal-drift' | 'void-breath' | 'ember-swirl' | 'rune-pulse'
  | 'wings-flap' | 'heartbeat' | 'shimmer-wave' | 'chromatic-drift' | 'clock-tick' | 'sparkle-cascade' | 'sakura-fall';

export interface AnimationConfig {
  type: AnimationType;
  fps: number;
  frames: number;
  intensity: number;
  loopMode: 'loop' | 'pingpong';
  mcmeta: boolean;
  blendGlint: boolean;
  frameByFrame: boolean;
}

/** Per-frame animation state handed to the renderer. */
export interface AnimState { t: number; frame: number; total: number; pingPong: boolean; }

/* ── the full recipe ── */
export interface StaffConfig {
  seed: number;
  resolution: Resolution;
  refined: boolean;
  animation?: AnimationConfig;

  modEssence?: ModEssenceStyle;
  rarity?: RarityTier;
  harmony?: HarmonyScheme;
  /** 0 = unlimited; otherwise posterize the final image to N colours (authentic pixel-art constraint) */
  paletteSize?: number;
  /** keep anti-aliased alpha instead of snapping to vanilla's hard 0/255 edges */
  softEdge?: boolean;

  element: ElementType;
  itemType: ItemType;

  shaftLength: number;
  shaftThickness: number;
  shaftAngle: number;
  shaftCurve: number;
  shaftStyle: ShaftStyle;
  shaftColor: string;
  shaftColor2: string;
  shaftDetail: number;
  wrapStyle: WrapStyle;
  wrapColor: string;
  wrapDensity: number;

  collarStyle: CollarStyle;
  collarColor: string;

  headShape: HeadShape;
  headSize: number;
  gemColor: string;
  gemColor2: string;
  gemGlow: number;
  innerStyle: InnerStyle;
  prongs: number;
  prongColor: string;

  tipStyle: TipStyle;
  tipScale: number;

  orbiterStyle: OrbiterStyle;
  orbiterCount: number;
  orbiterRadius: number;
  orbiterSize: number;

  pommelStyle: PommelStyle;
  pommelColor: string;

  dangleStyle?: DangleStyle;
  dangleCount?: number;

  gemCut?: GemCut;
  gemMount?: GemMount;
  gemCount?: number;
  gemScale?: number;
  adornmentStyle?: AdornmentStyle;
  adornmentDensity?: number;

  wearStyle?: WearStyle;
  wearAmount?: number;

  wings: WingStyle;
  wingColor: string;
  halo: HaloStyle;
  haloColor: string;
  horns: boolean;
  hornColor: string;
  particles: number;
  particleStyle: ParticleStyle;
  particleColor: string;

  outline: OutlineStyle;
  shading: number;
  dither: boolean;
  outerGlow: number;
  glowColor: string;
  dropShadow: boolean;
  finish: FinishStyle;
  contrast: number;
  grain: number;

  motif: MotifStyle;
  motifIntensity: number;
  /** optional second motif layer */
  motif2?: MotifStyle;
  motif2Intensity?: number;
}

/* ── catalog record shapes ── */
export interface ElementDef {
  id: ElementType; name: string; nameEn: string; icon: string;
  gem: string; gem2: string; glow: string; particle: string; metal: string;
  shaft: string; shaft2: string;
  particleStyle: ParticleStyle; head: HeadShape; motif: MotifStyle; shaftStyle: ShaftStyle;
  halo: HaloStyle; tip: TipStyle; wings: WingStyle; finish: FinishStyle; desc: string;
}
export interface ItemTypeDef { id: ItemType; name: string; nameEn: string; icon: string; patch: Partial<StaffConfig>; desc: string; }
export interface AnimationDef { id: AnimationType; name: string; en: string; desc: string; frames: number; fps: number; needs: Partial<StaffConfig>; }
export interface EffectPreset { name: string; nameEn: string; icon: string; patch: Partial<StaffConfig>; }
export interface Preset { name: string; tagline: string; icon: string; accent: string; config: Partial<StaffConfig>; }
export interface FinialPreset { id: string; name: string; nameEn: string; icon: string; accent: string; desc: string; patch: Partial<StaffConfig>; }
export interface RarityDef {
  id: RarityTier; name: string; nameEn: string; color: string; glowBoost: number;
  particleBoost: number; ornateLevel: number; patch: Partial<StaffConfig>; desc: string;
}

/* ── enumerations (single source of truth for pools / random) ── */
export const ALL_HEADS: HeadShape[] = ['orb', 'crystal', 'cluster', 'star', 'crescent', 'eye', 'diamond', 'bloom', 'skull', 'rune-cube', 'teardrop', 'prism', 'lantern', 'anvil', 'moonlet', 'hourglass', 'tome', 'chalice', 'feather', 'ankh', 'spiral-shell', 'tesseract', 'dragon-egg', 'compass', 'heart', 'lotus', 'portal', 'meteor', 'keyhole', 'rose-window', 'mask', 'octahedron', 'aurora-crown', 'snow-globe', 'butterfly', 'wing', 'helmet', 'crown', 'music-box', 'nether-star', 'beacon', 'totem', 'geode', 'ender-pearl', 'potion-flask', 'dragon-breath', 'shulker-core', 'respawn-anchor', 'glow-berries', 'banner', 'brazier'];
export const ALL_SHAFTS: ShaftStyle[] = ['straight', 'gnarled', 'twisted', 'bone', 'royal', 'leather', 'bamboo', 'ornate', 'crystal', 'segmented', 'obsidian', 'ivory', 'braided', 'chain-link', 'rune-carved', 'coral', 'techno', 'driftwood', 'ebony', 'porcelain', 'alloy', 'oak', 'birch', 'dark-oak', 'spruce', 'jungle', 'cherry', 'mangrove', 'azalea', 'mech-brass', 'mech-iron', 'copper', 'pipe', 'conveyor', 'gemmed', 'gem-column', 'gem-tube', 'embedding', 'bamboo-woven', 'glass', 'prismarine', 'kelp-rope', 'anchor-chain', 'sponge'];

export const ALL_WRAPS: WrapStyle[] = ['none', 'spiral', 'rings', 'vine', 'chain', 'rune-band', 'stitch', 'scale', 'ribbon', 'thorn', 'wire'];
export const ALL_COLLARS: CollarStyle[] = ['none', 'ring', 'guard', 'crown', 'claw', 'filigree', 'socket', 'wing-guard', 'skull-collar', 'orb-cage', 'tea-cup', 'bell-dome'];

export const ALL_SHAFT_LABELS: Record<ShaftStyle, string> = {
  straight: '真直', gnarled: '節', twisted: '捻', bone: '骨', royal: '王家', leather: '革',
  bamboo: '竹', ornate: '装飾', crystal: '晶', segmented: '節板', obsidian: '黒曜', ivory: '象牙',
  braided: '編組', 'chain-link': '鎖節', 'rune-carved': '刻彫', coral: '珊瑚', techno: '機械', driftwood: '流木',
  ebony: '黒檀', porcelain: '白磁', alloy: '合金',
  oak: 'オーク', birch: '白樺', 'dark-oak': '黒オーク', spruce: 'トウヒ', jungle: 'ジャングル', cherry: '桜木', mangrove: '紅樹', azalea: '皐月',
  'mech-brass': '黄銅管', 'mech-iron': '鉄機械', copper: '銅管', pipe: 'パイプ', conveyor: 'ベルト',
  gemmed: '宝留', 'gem-column': '宝石柱', 'gem-tube': '宝石筒', embedding: '宝石嵌',
  'bamboo-woven': '竹篾', glass: '硝子筒', prismarine: '海洋殻', 'kelp-rope': '昆布索', 'anchor-chain': '錨鎖', sponge: '海綿',
};
export const ALL_POMMELS: PommelStyle[] = ['none', 'cap', 'gem', 'spike', 'ring', 'tassel', 'skullcap', 'orb', 'crescent', 'anchor', 'split-tassel', 'lantern-hanger'];
export const ALL_TIPS: TipStyle[] = ['none', 'gem', 'crown', 'spike', 'flame', 'star', 'halo', 'floating-gem', 'cluster', 'crystal-tip', 'lantern', 'orbit-ring', 'plume', 'bell', 'eye-tip', 'blade', 'gem-cluster', 'triple-prong', 'lotus-crown', 'celestial-cage', 'reliquary', 'phoenix-plume', 'dragon-fang', 'void-crown', 'prism-vortex', 'sun-disc', 'moon-circlet', 'living-bloom', 'snow-globe-tip', 'butterfly-tip', 'wing-pair', 'prism-trio'];
export const ALL_ORBITERS: OrbiterStyle[] = ['none', 'orb', 'shard', 'rune', 'star', 'gear', 'leaf', 'ember', 'snowflake', 'spark', 'crystal', 'skull', 'feather', 'bubble', 'card', 'gem-set', 'twin-gem', 'crown', 'rune-satellite', 'prism-ring', 'petal-orbit', 'mini-moon', 'sigil', 'gem-chain', 'constellation', 'orbit-diamonds', 'hourglass', 'snow-globe', 'butterfly-swarm', 'prism-comet', 'pearl', 'comet-dust'];
export const ALL_WINGS: WingStyle[] = ['none', 'angel', 'bat', 'fae', 'blade', 'seraph', 'mech', 'crystal', 'flame', 'leafwing', 'peacock', 'cape'];
export const ALL_HALOS: HaloStyle[] = ['none', 'ring', 'double', 'rune-ring', 'eclipse', 'sunburst', 'triple', 'hex-grid', 'spiral', 'shattered', 'lens-flare'];
export const ALL_PARTICLES: ParticleStyle[] = ['sparkle', 'dots', 'plus', 'diamonds', 'mixed', 'embers', 'bubbles', 'snow', 'leaf', 'stars', 'runes', 'hearts', 'ash', 'musical', 'firefly', 'glow-dust'];
export const ALL_FINISHES: FinishStyle[] = ['matte', 'glossy', 'metallic', 'enchanted', 'weathered', 'holographic', 'frosted', 'lacquered', 'pearl', 'vegetal'];
export const ALL_MOTIFS: MotifStyle[] = ['none', 'flame', 'frost', 'bolt', 'leaf', 'rays', 'wisp', 'rune', 'drip', 'wave', 'rock', 'void', 'constellation', 'sculk-tendril', 'mana-weave', 'chains', 'feathers', 'gears', 'shards', 'petals', 'notes', 'clock', 'bubbles-motif', 'aurora-waves', 'jewel-halo', 'music-notes'];
export const ALL_INNERS: InnerStyle[] = ['core', 'facet', 'swirl', 'galaxy', 'none', 'crack', 'liquid'];
export const ALL_OUTLINES: OutlineStyle[] = ['none', 'dark', 'light', 'gold', 'colored', 'selout', 'rarity'];
export const ALL_MOD_ESSENCES: ModEssenceStyle[] = ['none', 'thaumcraft', 'botania', 'aether', 'astral-sorcery', 'hypixel-legend', 'electroblob', 'sculk-ancient', 'netherite-gilded', 'sakura-oneiric', 'forge-master', 'industrial', 'wildwood', 'aquatic', 'masterwork'];
export const ALL_RARITIES: RarityTier[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine'];
export const ALL_HARMONIES: HarmonyScheme[] = ['custom', 'complementary', 'analogous', 'triadic', 'split', 'tetradic', 'monochrome'];
export const ALL_WEARS: WearStyle[] = ['none', 'chipped', 'cracked', 'scratched', 'burned', 'mossy', 'frosted-over', 'blood-stained'];
export const ALL_DANGLES: DangleStyle[] = ['none', 'ribbon', 'chain-charm', 'bell', 'feather', 'crystal-drop', 'beads', 'talisman-tag'];
export const ALL_GEM_CUTS: GemCut[] = ['brilliant', 'emerald', 'marquise', 'cabochon', 'star-cut', 'opal', 'prism', 'rose-cut'];
export const ALL_GEM_MOUNTS: GemMount[] = ['claw', 'bezel', 'cage', 'floating', 'halo', 'petal'];
export const ALL_ADORNMENTS: AdornmentStyle[] = ['none', 'filigree', 'star-map', 'thorn-vine', 'gold-pave', 'rune-engraving', 'chain-drape', 'petal-mantle', 'geodesic', 'braided'];
