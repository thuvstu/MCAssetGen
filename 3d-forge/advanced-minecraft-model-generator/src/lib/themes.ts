import {
  AnimationMode,
  AtlasPattern,
  BladeEdgeStyle,
  BladeProfile,
  CategoryFamily,
  ColorPalette,
  CrossguardStyle,
  FloatingType,
  GeneratorConfig,
  LimitBreakLevel,
  MagicTheme,
  ModelCategory,
  MuzzleStyle,
  ParticleEffectType,
  TacticalMode,
  UpgradeTier,
  WeaponForm,
} from "./types";

export const THEME_PALETTES: Record<MagicTheme, ColorPalette> = {
  void: {
    primary: "#1c142b", secondary: "#3d2260", accent: "#9945ff", gem: "#bd77ff",
    glow: "#d9a7ff", wood: "#130d1d", bone: "#d8c9ef", cloth: "#2a1c44",
  },
  inferno: {
    primary: "#281b16", secondary: "#6d1d07", accent: "#ff5a00", gem: "#ffb703",
    glow: "#ffe248", wood: "#1c0d08", bone: "#f2d59b", cloth: "#4a1406",
  },
  frost: {
    primary: "#1b2c3b", secondary: "#35668a", accent: "#48cae4", gem: "#a2ecff",
    glow: "#e6fbff", wood: "#14212c", bone: "#dff3f8", cloth: "#1f4a63",
  },
  celestial: {
    primary: "#3c3725", secondary: "#c99a2c", accent: "#fed766", gem: "#fffdf2",
    glow: "#fff4bd", wood: "#f4f1de", bone: "#ffedc2", cloth: "#8a6f22",
  },
  storm: {
    primary: "#1f242c", secondary: "#2c4a6f", accent: "#00b4d8", gem: "#90e0ef",
    glow: "#d7f6ff", wood: "#2b2d42", bone: "#d9e2f2", cloth: "#23415e",
  },
  sculk: {
    primary: "#031c26", secondary: "#053f47", accent: "#0be3cb", gem: "#44f1dc",
    glow: "#c9fff5", wood: "#061317", bone: "#e8deb5", cloth: "#04333a",
  },
  verdant: {
    primary: "#1a2e1d", secondary: "#2d6a4f", accent: "#52b788", gem: "#8ef0b8",
    glow: "#d8f3dc", wood: "#402e1b", bone: "#eee3c4", cloth: "#1f4d33",
  },
  blood: {
    primary: "#25090e", secondary: "#780016", accent: "#c1121f", gem: "#ff4d6d",
    glow: "#ffb3c1", wood: "#150407", bone: "#f0d8d8", cloth: "#4d0914",
  },
  redstone: {
    primary: "#22252a", secondary: "#495057", accent: "#d90429", gem: "#ef233c",
    glow: "#ffd0d6", wood: "#0d0f12", bone: "#cfd4da", cloth: "#5c0a17",
  },
  /* ---- new: 機械 ---- */
  machina: {
    primary: "#2e3238", secondary: "#767d87", accent: "#c9a227", gem: "#ffc94a",
    glow: "#ffe9a8", wood: "#1a1d21", bone: "#b9bfc7", cloth: "#3f454d",
  },
  /* ---- new: 秘術 ---- */
  arcane: {
    primary: "#1a1b3a", secondary: "#3b3a7a", accent: "#6c63ff",
    gem: "#a78bfa", glow: "#e0d7ff", wood: "#15162e", bone: "#dcd8ff", cloth: "#272a5c",
  },
  /* ---- new: 禍々しい ---- */
  cursed: {
    primary: "#15121a", secondary: "#2f2435", accent: "#7a1f4f", gem: "#b5179e",
    glow: "#f072d4", wood: "#0d0a10", bone: "#cdbfae", cloth: "#231a2a",
  },
  /* ---- new: 近未来 ---- */
  plasma: {
    primary: "#121821", secondary: "#1f3b4d", accent: "#00e5ff", gem: "#5efcff",
    glow: "#ccfeff", wood: "#0c1016", bone: "#c6e6ee", cloth: "#16303d",
  },
};

export const THEME_LABELS: Record<MagicTheme, { ja: string; en: string; prefixJa: string }> = {
  void: { ja: "虚無・エンダー", en: "VOID", prefixJa: "虚無穿ちの" },
  inferno: { ja: "獄炎・ネザー", en: "INFERNO", prefixJa: "獄炎皇の" },
  frost: { ja: "氷華・フロスト", en: "FROST", prefixJa: "氷華零度の" },
  celestial: { ja: "聖光・神聖", en: "CELESTIAL", prefixJa: "聖天光輪の" },
  storm: { ja: "嵐雷・銅導", en: "STORM", prefixJa: "雷霆迅雷の" },
  sculk: { ja: "深淵・スカルク", en: "SCULK", prefixJa: "深淵残響の" },
  verdant: { ja: "翠緑・自然", en: "VERDANT", prefixJa: "翠霊古樹の" },
  blood: { ja: "鮮血・ブラッド", en: "BLOOD", prefixJa: "鮮血啜りの" },
  redstone: { ja: "赤石・機構", en: "REDSTONE", prefixJa: "赤石機巧の" },
  machina: { ja: "鋼鉄・機械", en: "MACHINA", prefixJa: "鋼鉄歯車の" },
  arcane: { ja: "秘術・魔導", en: "ARCANE", prefixJa: "秘術収束の" },
  cursed: { ja: "呪詛・禍々", en: "CURSED", prefixJa: "禍々しき" },
  plasma: { ja: "電漿・近未来", en: "PLASMA", prefixJa: "電漿加速の" },
};

export interface CategoryMeta {
  id: ModelCategory;
  ja: string;
  en: string;
  family: CategoryFamily;
  glyph: string;
  note: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "sword", ja: "片手剣", en: "SWORD", family: "melee", glyph: "R", note: "標準的な柄・鍔・刀身の構成" },
  { id: "greatsword", ja: "両手大剣", en: "GREATSWORD", family: "melee", glyph: "T", note: "幅広の刀身と大型鍔" },
  { id: "dagger", ja: "短剣", en: "DAGGER", family: "melee", glyph: "D", note: "短い柄と鋭い切り返し" },
  { id: "scythe", ja: "大鎌", en: "SCYTHE", family: "melee", glyph: "S", note: "円弧を描く巨大な鎌刃" },
  { id: "axe", ja: "両刃戦斧", en: "BATTLEAXE", family: "melee", glyph: "X", note: "左右対称の斧首と頂部棘" },
  { id: "mace", ja: "戦槌・メイス", en: "MACE", family: "melee", glyph: "M", note: "八枚のフランジと打撃棘" },
  { id: "spear", ja: "魔槍", en: "SPEAR", family: "melee", glyph: "P", note: "長柄に葉形の穂先" },
  { id: "spear_ornate", ja: "装飾大槍", en: "ORNATE LANCE", family: "melee", glyph: "L", note: "多層の装飾環・軍旗・房飾りを纏う儀礼大槍" },

  { id: "staff", ja: "魔導杖", en: "STAFF", family: "caster", glyph: "W", note: "長い杖と浮遊する魔力球" },
  { id: "scepter", ja: "王笏・短杖", en: "SCEPTER", family: "caster", glyph: "Y", note: "宝冠の爪が巨大宝玉を抱く短杖" },

  { id: "bow", ja: "長弓", en: "LONGBOW", family: "ranged", glyph: "B", note: "反る把と張られた弦" },
  { id: "crossbow", ja: "魔導弩", en: "CROSSBOW", family: "ranged", glyph: "K", note: "機械式の弩・照準器・魔導コイル" },
  { id: "gun", ja: "魔導銃", en: "MAGITEK GUN", family: "ranged", glyph: "G", note: "銃把・遊底・銃身・弾倉の近代構造" },
  { id: "railgun", ja: "レールガン", en: "RAILGUN", family: "ranged", glyph: "=", note: "双軌条・蓄電コイル・加速砲口" },

  { id: "chainsaw", ja: "チェーンソー", en: "CHAINSAW", family: "machine", glyph: "C", note: "発動機・ガイドバー・回転刃チェーン" },

  { id: "shield", ja: "魔盾", en: "SHIELD", family: "armor", glyph: "V", note: "重ねた板と中央の宝玉" },
  { id: "armor_helmet", ja: "兜・神冠", en: "CROWN", family: "armor", glyph: "H", note: "冠帯・角・光の輪" },
  { id: "armor_wings", ja: "背翼", en: "WINGS", family: "armor", glyph: "F", note: "骨格と羽膜の対称翼" },

  { id: "relic_crystal", ja: "水晶核", en: "MONOLITH", family: "relic", glyph: "C", note: "浮遊する巨大な結晶体" },
  { id: "relic_grimoire", ja: "魔導書", en: "GRIMOIRE", family: "relic", glyph: "G", note: "開かれた禁書と刻印" },
  { id: "totem", ja: "守護像", en: "TOTEM", family: "relic", glyph: "O", note: "祭壇の柱と発光する眼" },
];

export const FAMILY_LABELS: Record<CategoryFamily, string> = {
  melee: "MELEE 近接",
  caster: "CASTER 杖",
  ranged: "RANGED 射撃",
  machine: "MACHINE 機械",
  armor: "ARMOR 防具",
  relic: "RELIC 遺物",
};

export const UPGRADE_TIERS: {
  tier: UpgradeTier; roman: string; ja: string; en: string; suffixJa: string; desc: string;
}[] = [
  { tier: 1, roman: "I", ja: "壱式・粗製", en: "TIER I · CRUDE", suffixJa: "【壱式】",
    desc: "鍛冶場から上がったばかりの素体。装飾や浮遊物を持たず、簡素な鍔と短い刃で構成される。" },
  { tier: 2, roman: "II", ja: "弐式・鍛錬", en: "TIER II · TEMPERED", suffixJa: "【弐式・改】",
    desc: "焼き入れと研磨を経た実戦仕様。柄頭石と面取り刃が備わり、微かな魔力を帯び始める。" },
  { tier: 3, roman: "III", ja: "参式・魔導", en: "TIER III · ARCANE", suffixJa: "【参式・魔導】",
    desc: "中心核の宝玉が覚醒し、刀身にルーンが刻まれた標準完成形。浮遊魔導片が周囲を巡る。" },
  { tier: 4, roman: "IV", ja: "肆式・聖遺", en: "TIER IV · RELIC", suffixJa: "【肆式・聖遺】",
    desc: "大型化した鍔と副宝玉、鎖飾り、二重オーラ輪郭を備えた英雄級の聖遺兵装。" },
  { tier: 5, roman: "V", ja: "伍式・神話", en: "TIER V · MYTHIC", suffixJa: "【伍式・神話】",
    desc: "全開放された神話級形態。伸長した刀身、副翼ブレード、多重浮遊陣と高輝度コアが脈動する。" },
];

export const LIMIT_BREAK_LEVELS: {
  level: LimitBreakLevel; ja: string; en: string; badge: string; desc: string;
}[] = [
  { level: 0, ja: "通常枠", en: "STANDARD", badge: "—", desc: "制限内の安定稼働状態。" },
  { level: 1, ja: "★ 限界突破", en: "OVERLIMIT ★", badge: "★ OVERLIMIT",
    desc: "浮遊副兵装（ファンネル刃）と背面光輪が展開し、コア出力が限界を超える。" },
  { level: 2, ja: "★★ 神格解放", en: "GENESIS ★★", badge: "★★ GENESIS",
    desc: "神格結晶翼・二重天球魔法陣・追従神剣が顕現する最終超越バージョン。" },
];

export const WEAPON_FORMS: { id: WeaponForm; ja: string; en: string; glyph: string; desc: string }[] = [
  { id: "standard", ja: "通常形態", en: "STANDARD", glyph: "I", desc: "均整の取れた基本武装フォーム。" },
  { id: "sealed", ja: "封印拘束形態", en: "SEALED CAGE", glyph: "#",
    desc: "黒鉄の拘束枷と封印鎖で刀身・魔力核を封じ込めた休眠フォーム。" },
  { id: "liberated", ja: "解放・分裂形態", en: "LIBERATED SPLIT", glyph: "><",
    desc: "刀身が左右に分裂し、内部のプラズマ魔導炉心と浮遊コアが露出した高出力フォーム。" },
  { id: "twin_fang", ja: "双牙・両刃形態", en: "TWIN-FANG", glyph: "X",
    desc: "柄の上下に対称刃が展開する双頭・変形グレイブフォーム。" },
  { id: "colossus", ja: "巨神顕現形態", en: "COLOSSUS", glyph: "A",
    desc: "実体刃の外周に巨大な半透明アストラル光刃を纏わせた超大型決戦フォーム。" },
];

export const TACTICAL_MODES: { id: TacticalMode; ja: string; en: string; color: string; desc: string }[] = [
  { id: "normal", ja: "通常待機", en: "NORMAL", color: "#8a867f", desc: "追加バフなしの基本状態。" },
  { id: "overdrive", ja: "魔力暴走", en: "OVERDRIVE", color: "#ff5a00",
    desc: "鍔と炉心から灼熱の魔力噴射が噴き出し、発光と速度が倍化する。" },
  { id: "soul_devour", ja: "魂喰らい", en: "SOUL DEVOUR", color: "#ff3366",
    desc: "深紅の怨霊触手と魂魄オーブが周囲に渦巻く侵食吸収モード。" },
  { id: "absolute_zero", ja: "絶対零度", en: "ABSOLUTE ZERO", color: "#48cae4",
    desc: "刀身に巨大な氷晶スパイクが隆起し、足元に氷結方陣を展開する。" },
  { id: "thunder_clad", ja: "迅雷纏い", en: "THUNDER CLAD", color: "#ffe248",
    desc: "稲妻のアーク放電が柄から穂先までジグザグに奔る高速雷装モード。" },
  { id: "divine_aegis", ja: "聖域障壁", en: "DIVINE AEGIS", color: "#fed766",
    desc: "六角形の黄金聖光シールドパネルが周囲に展開する守護モード。" },
  { id: "overclock", ja: "機関過負荷", en: "OVERCLOCK", color: "#ffc94a",
    desc: "放熱フィンが開き、排熱プルームと駆動歯車が高速回転する機械過負荷モード。" },
  { id: "hemorrhage", ja: "出血呪詛", en: "HEMORRHAGE", color: "#c1121f",
    desc: "血溜まりの輪が床に広がり、滴る血柱と肉塊の棘が武器を侵食する。" },
];

export const DEFAULT_CONFIG: GeneratorConfig = {
  name: "虚無穿ちの魔剣",
  category: "sword",
  theme: "void",
  upgradeTier: 3,
  limitBreak: 0,
  weaponForm: "standard",
  tacticalMode: "normal",
  overallScale: 1,
  bladeLength: 22,
  bladeWidth: 3,
  handleLength: 8,
  crossguardWidth: 10,
  crossguardStyle: "winged",
  bladeEdgeStyle: "crystal_spikes",
  bladeProfile: "bevel",
  muzzleStyle: "barrel",
  hasCoreGem: true,
  coreGemSize: 4,
  hasSecondGem: true,
  hasPommelGem: true,
  hasChainsOrRibbons: true,
  hasSpikesOrWings: true,
  hasRunicEngravings: true,
  hasEnergyBladeOutline: true,
  hasGearworks: false,
  hasPistons: false,
  hasCables: false,
  hasVents: false,
  hasThornCrown: false,
  hasSkullMotif: false,
  hasBanner: false,
  hasPrismArray: false,
  hasScope: false,
  hasBloodTank: false,
  floatingType: "runes",
  floatingCount: 4,
  floatingRadius: 10,
  floatingHeightOffset: 2,
  animationEnabled: true,
  animationMode: "idle_float",
  animationSpeed: 1,
  floatAmplitude: 0.8,
  particleEffect: "sparks",
  particleDensity: 46,
  particleSpeed: 1,
  bloomIntensity: 1.2,
  textureResolution: 16,
  atlasPattern: "dither",
  seed: 42,
};

export interface LegendaryPreset {
  id: string;
  nameJa: string;
  nameEn: string;
  category: ModelCategory;
  theme: MagicTheme;
  blurb: string;
  config: Partial<GeneratorConfig>;
}

export const LEGENDARY_PRESETS: LegendaryPreset[] = [
  {
    id: "void_reaper", nameJa: "滅魂の星鎌", nameEn: "VOID REAPER", category: "scythe", theme: "void",
    blurb: "時空の裂け目から喚ばれた鎌。四つの古代ルーンが周囲を巡る。",
    config: { upgradeTier: 4, limitBreak: 1, weaponForm: "liberated", bladeLength: 26, bladeWidth: 4,
      crossguardStyle: "winged", bladeEdgeStyle: "curved", floatingType: "runes", floatingCount: 4,
      floatingRadius: 13, floatingHeightOffset: 5, coreGemSize: 5, particleEffect: "void_smoke",
      bloomIntensity: 1.5, animationMode: "combo_slash" },
  },
  {
    id: "chainsaw_ripper", nameJa: "鋼鉄の咆哮鋸", nameEn: "RIPPER ENGINE", category: "chainsaw", theme: "machina",
    blurb: "二気筒発動機が唸り、鋸歯のチェーンがガイドバーを高速循環する処刑具。",
    config: { upgradeTier: 4, bladeLength: 26, bladeWidth: 5, handleLength: 9, atlasPattern: "plate",
      hasGearworks: true, hasPistons: true, hasVents: true, hasCables: true, hasCoreGem: true,
      coreGemSize: 4, floatingType: "gears", floatingCount: 3, floatingRadius: 12,
      particleEffect: "exhaust_smoke", bloomIntensity: 1.1, animationMode: "chainsaw_rev" },
  },
  {
    id: "magitek_sidearm", nameJa: "魔導拳銃・紫電", nameEn: "MAGITEK SIDEARM", category: "gun", theme: "plasma",
    blurb: "蓄魔コイルから電漿を叩き出す近未来拳銃。排莢が宙を舞う。",
    config: { upgradeTier: 4, bladeLength: 16, bladeWidth: 4, handleLength: 7, muzzleStyle: "compensator",
      atlasPattern: "circuit", hasVents: true, hasCables: true, hasScope: true, hasPrismArray: true,
      coreGemSize: 4, floatingType: "shells", floatingCount: 4, floatingRadius: 10,
      particleEffect: "muzzle_flash", bloomIntensity: 1.6, animationMode: "gun_recoil" },
  },
  {
    id: "railgun_lance", nameJa: "電磁加速砲「雷霆」", nameEn: "RAIL LANCE", category: "railgun", theme: "storm",
    blurb: "双軌条を走る超高圧電流が、音速を超える杭を撃ち出す。",
    config: { upgradeTier: 5, limitBreak: 1, bladeLength: 30, bladeWidth: 5, handleLength: 8,
      muzzleStyle: "quad_rail", atlasPattern: "circuit", hasCables: true, hasVents: true,
      hasPrismArray: true, hasScope: true, coreGemSize: 6, floatingType: "orbs", floatingCount: 4,
      floatingRadius: 12, particleEffect: "electric_arcs", bloomIntensity: 1.8,
      animationMode: "railgun_charge" },
  },
  {
    id: "blood_mace", nameJa: "鮮血の鉄槌", nameEn: "SANGUINE MAUL", category: "mace", theme: "blood",
    blurb: "血液槽から脈動を受け、八枚のフランジが赤黒く濡れ光る。",
    config: { upgradeTier: 4, limitBreak: 1, tacticalMode: "hemorrhage", bladeLength: 14, bladeWidth: 8,
      handleLength: 12, crossguardWidth: 12, atlasPattern: "viscera", hasBloodTank: true,
      hasSkullMotif: true, hasThornCrown: true, hasChainsOrRibbons: true, coreGemSize: 5,
      floatingType: "bloodDrops", floatingCount: 6, floatingRadius: 11,
      particleEffect: "blood_mist", bloomIntensity: 1.4, animationMode: "mace_smash" },
  },
  {
    id: "cursed_lance", nameJa: "禍津大槍・百禍", nameEn: "CALAMITY LANCE", category: "spear_ornate", theme: "cursed",
    blurb: "七重の装飾環と呪旗を纏い、穂先に百の禍を封じた儀礼大槍。",
    config: { upgradeTier: 5, limitBreak: 1, bladeLength: 22, bladeWidth: 5, handleLength: 18,
      crossguardWidth: 12, hasBanner: true, hasThornCrown: true, hasSkullMotif: true,
      hasChainsOrRibbons: true, hasRunicEngravings: true, coreGemSize: 6, floatingType: "thorns",
      floatingCount: 6, floatingRadius: 13, particleEffect: "curse_runes", bloomIntensity: 1.6,
      animationMode: "spear_thrust" },
  },
  {
    id: "arcane_scepter", nameJa: "秘術収束の王笏", nameEn: "ARCANE SCEPTER", category: "scepter", theme: "arcane",
    blurb: "六枚のプリズムが魔力を屈折させ、宝冠の爪が巨大な魔晶を抱く。",
    config: { upgradeTier: 5, limitBreak: 2, bladeLength: 10, handleLength: 12, crossguardWidth: 12,
      crossguardStyle: "circular", hasPrismArray: true, hasRunicEngravings: true, coreGemSize: 7,
      floatingType: "magic_ring", floatingCount: 3, floatingRadius: 11, floatingHeightOffset: 10,
      particleEffect: "curse_runes", bloomIntensity: 1.9, animationMode: "magic_cast" },
  },
  {
    id: "mech_crossbow", nameJa: "機械仕掛けの魔導弩", nameEn: "CLOCKWORK CROSSBOW", category: "crossbow", theme: "redstone",
    blurb: "歯車とピストンが弦を巻き上げ、赤石の矢を装填する連弩。",
    config: { upgradeTier: 4, bladeLength: 20, bladeWidth: 4, handleLength: 8, atlasPattern: "plate",
      hasGearworks: true, hasPistons: true, hasScope: true, hasCables: true, coreGemSize: 4,
      floatingType: "gears", floatingCount: 4, floatingRadius: 11,
      particleEffect: "gear_sparks", bloomIntensity: 1.3, animationMode: "reload_cycle" },
  },
  {
    id: "seraphic_greatsword", nameJa: "聖天騎士の大剣", nameEn: "SERAPHIC BLADE", category: "greatsword", theme: "celestial",
    blurb: "黄金の翼と光輪を纏う両手剣。聖なる輝きが闇を裂く。",
    config: { upgradeTier: 5, limitBreak: 2, weaponForm: "colossus", tacticalMode: "divine_aegis",
      bladeLength: 28, bladeWidth: 6, crossguardWidth: 16, crossguardStyle: "winged",
      bladeProfile: "fuller", floatingType: "stars", floatingCount: 5, floatingRadius: 11,
      coreGemSize: 5, particleEffect: "holy_halo", bloomIntensity: 1.5, animationMode: "charge_cleave" },
  },
  {
    id: "inferno_cataclysm", nameJa: "獄炎魔導杖", nameEn: "CATACLYSM STAFF", category: "staff", theme: "inferno",
    blurb: "ネザーの核を封じた杖。マグマの輪が回転し火粉を散らす。",
    config: { upgradeTier: 5, limitBreak: 1, tacticalMode: "overdrive", handleLength: 16,
      crossguardWidth: 14, crossguardStyle: "circular", floatingType: "magic_ring", floatingCount: 3,
      floatingRadius: 9, floatingHeightOffset: 13, coreGemSize: 6, particleEffect: "flames",
      bloomIntensity: 1.8, animationMode: "magic_cast" },
  },
  {
    id: "frost_fangs", nameJa: "氷晶の双牙", nameEn: "GLACIAL FANGS", category: "dagger", theme: "frost",
    blurb: "絶対零度の氷から削り出された短剣。冷気の結晶が舞う。",
    config: { upgradeTier: 4, weaponForm: "twin_fang", tacticalMode: "absolute_zero", bladeLength: 14,
      bladeWidth: 4, handleLength: 5, crossguardWidth: 8, crossguardStyle: "horned",
      bladeEdgeStyle: "serrated", floatingType: "crystals", floatingCount: 6, floatingRadius: 8,
      particleEffect: "frost_crystals", bloomIntensity: 1.3, animationMode: "combo_slash" },
  },
  {
    id: "blood_wings", nameJa: "深紅の禍翼", nameEn: "CRIMSON WINGS", category: "armor_wings", theme: "blood",
    blurb: "背に展開する呪われし骨翼と鮮血の水晶がオーラを放つ。",
    config: { upgradeTier: 5, limitBreak: 2, tacticalMode: "soul_devour", bladeLength: 24,
      crossguardStyle: "dragon", hasSkullMotif: true, floatingType: "bloodDrops", floatingCount: 5,
      floatingRadius: 14, floatingHeightOffset: 5, coreGemSize: 6, particleEffect: "blood_mist",
      bloomIntensity: 1.7, animationMode: "blood_drain" },
  },
];

export const CATEGORY_DEFAULTS: Record<ModelCategory, Partial<GeneratorConfig>> = {
  sword: { bladeLength: 22, bladeWidth: 3, handleLength: 8, crossguardWidth: 10 },
  greatsword: { bladeLength: 30, bladeWidth: 6, handleLength: 10, crossguardWidth: 16 },
  dagger: { bladeLength: 13, bladeWidth: 3, handleLength: 5, crossguardWidth: 7 },
  scythe: { bladeLength: 26, bladeWidth: 4, handleLength: 15, crossguardWidth: 9 },
  axe: { bladeLength: 18, bladeWidth: 8, handleLength: 14, crossguardWidth: 16 },
  mace: { bladeLength: 14, bladeWidth: 8, handleLength: 12, crossguardWidth: 12, animationMode: "mace_smash" },
  spear: { bladeLength: 20, bladeWidth: 4, handleLength: 17, crossguardWidth: 10, animationMode: "spear_thrust" },
  spear_ornate: { bladeLength: 22, bladeWidth: 5, handleLength: 18, crossguardWidth: 12, hasBanner: true,
    hasChainsOrRibbons: true, animationMode: "spear_thrust" },
  staff: { bladeLength: 8, bladeWidth: 4, handleLength: 16, crossguardWidth: 13, animationMode: "magic_cast" },
  scepter: { bladeLength: 10, bladeWidth: 4, handleLength: 11, crossguardWidth: 12, hasPrismArray: true,
    animationMode: "magic_cast" },
  bow: { bladeLength: 24, bladeWidth: 3, handleLength: 8, crossguardWidth: 12 },
  crossbow: { bladeLength: 20, bladeWidth: 4, handleLength: 8, crossguardWidth: 14, hasGearworks: true,
    hasScope: true, animationMode: "reload_cycle" },
  gun: { bladeLength: 16, bladeWidth: 4, handleLength: 7, crossguardWidth: 8, muzzleStyle: "compensator",
    hasVents: true, animationMode: "gun_recoil" },
  railgun: { bladeLength: 30, bladeWidth: 5, handleLength: 8, crossguardWidth: 10, muzzleStyle: "quad_rail",
    hasCables: true, hasScope: true, animationMode: "railgun_charge" },
  chainsaw: { bladeLength: 26, bladeWidth: 5, handleLength: 9, crossguardWidth: 10, hasGearworks: true,
    hasVents: true, animationMode: "chainsaw_rev" },
  shield: { bladeLength: 14, bladeWidth: 5, handleLength: 6, crossguardWidth: 16 },
  armor_helmet: { bladeLength: 10, bladeWidth: 3, handleLength: 6, crossguardWidth: 12 },
  armor_wings: { bladeLength: 24, bladeWidth: 4, handleLength: 8, crossguardWidth: 14 },
  relic_crystal: { bladeLength: 20, bladeWidth: 6, handleLength: 8, crossguardWidth: 14 },
  relic_grimoire: { bladeLength: 16, bladeWidth: 5, handleLength: 8, crossguardWidth: 14 },
  totem: { bladeLength: 16, bladeWidth: 5, handleLength: 12, crossguardWidth: 12 },
};

export const OPTION_SETS = {
  crossguard: [
    { id: "winged", ja: "翼型" }, { id: "horned", ja: "角型" }, { id: "circular", ja: "円環" },
    { id: "dragon", ja: "竜鱗" }, { id: "spiked", ja: "刺棘" }, { id: "minimal", ja: "簡素" },
    { id: "runic", ja: "ルーン" },
  ] as { id: CrossguardStyle; ja: string }[],
  edge: [
    { id: "straight", ja: "ストレート" }, { id: "serrated", ja: "鋸刃" },
    { id: "crystal_spikes", ja: "魔晶棘" }, { id: "curved", ja: "湾曲" },
    { id: "flame_wavy", ja: "波動焔" }, { id: "split", ja: "分割" },
  ] as { id: BladeEdgeStyle; ja: string }[],
  profile: [
    { id: "flat", ja: "平板" }, { id: "bevel", ja: "面取り" },
    { id: "fuller", ja: "溝" }, { id: "hexagonal", ja: "六角" },
  ] as { id: BladeProfile; ja: string }[],
  muzzle: [
    { id: "none", ja: "なし" }, { id: "barrel", ja: "単銃身" },
    { id: "compensator", ja: "制退器" }, { id: "coil_array", ja: "蓄魔コイル" },
    { id: "prism_lens", ja: "集束レンズ" }, { id: "quad_rail", ja: "四連軌条" },
  ] as { id: MuzzleStyle; ja: string }[],
  floating: [
    { id: "none", ja: "なし", glyph: "-" },
    { id: "runes", ja: "古代ルーン片", glyph: "R" },
    { id: "crystals", ja: "浮遊魔晶", glyph: "C" },
    { id: "magic_ring", ja: "魔法陣輪", glyph: "O" },
    { id: "orbs", ja: "霊気球", glyph: "S" },
    { id: "skulls", ja: "怨霊頭骨", glyph: "K" },
    { id: "feathers", ja: "光の羽根", glyph: "W" },
    { id: "stars", ja: "星辰", glyph: "*" },
    { id: "gears", ja: "浮遊歯車", glyph: "G" },
    { id: "bloodDrops", ja: "血滴", glyph: "B" },
    { id: "shells", ja: "排莢薬莢", glyph: "N" },
    { id: "thorns", ja: "呪詛の棘", glyph: "T" },
  ] as { id: FloatingType; ja: string; glyph: string }[],
  particles: [
    { id: "none", ja: "なし" }, { id: "sparks", ja: "光輝スパーク" }, { id: "flames", ja: "火炎" },
    { id: "void_smoke", ja: "虚無の煙" }, { id: "frost_crystals", ja: "氷晶ダスト" },
    { id: "holy_halo", ja: "聖光の光芒" }, { id: "electric_arcs", ja: "放電アーク" },
    { id: "souls", ja: "ソウル" }, { id: "exhaust_smoke", ja: "排気煙" },
    { id: "blood_mist", ja: "血霧" }, { id: "gear_sparks", ja: "金属火花" },
    { id: "plasma_vent", ja: "電漿噴射" }, { id: "curse_runes", ja: "呪詛文字" },
    { id: "muzzle_flash", ja: "銃口閃光" },
  ] as { id: ParticleEffectType; ja: string }[],
  animation: [
    { id: "idle_float", ja: "浮遊ゆらぎ", en: "IDLE FLOAT", kind: "idle" },
    { id: "orbit_spin", ja: "周回回転", en: "ORBIT SPIN", kind: "idle" },
    { id: "magic_pulse", ja: "魔力脈動", en: "PULSE", kind: "idle" },
    { id: "combat_swing", ja: "基本斬撃", en: "SWING", kind: "attack" },
    { id: "combo_slash", ja: "三連撃コンボ", en: "3-HIT COMBO", kind: "attack" },
    { id: "charge_cleave", ja: "溜め次元斬", en: "CHARGE CLEAVE", kind: "attack" },
    { id: "mace_smash", ja: "叩き潰し", en: "MACE SMASH", kind: "attack" },
    { id: "spear_thrust", ja: "連続刺突", en: "THRUST RUSH", kind: "attack" },
    { id: "chainsaw_rev", ja: "鋸回転・空吹かし", en: "CHAINSAW REV", kind: "machine" },
    { id: "gun_recoil", ja: "射撃反動", en: "GUN RECOIL", kind: "machine" },
    { id: "reload_cycle", ja: "排莢・再装填", en: "RELOAD", kind: "machine" },
    { id: "railgun_charge", ja: "電磁加速・発射", en: "RAILGUN FIRE", kind: "machine" },
    { id: "mech_deploy", ja: "機械展開", en: "MECH DEPLOY", kind: "morph" },
    { id: "magic_cast", ja: "大魔法詠唱", en: "GRAND CAST", kind: "magic" },
    { id: "blood_drain", ja: "吸血脈動", en: "BLOOD DRAIN", kind: "magic" },
    { id: "form_morph", ja: "形態変形機構", en: "FORM MORPH", kind: "morph" },
    { id: "limit_burst", ja: "限界突破覚醒", en: "LIMIT BURST", kind: "morph" },
    { id: "off", ja: "停止", en: "OFF", kind: "idle" },
  ] as { id: AnimationMode; ja: string; en: string; kind: "idle" | "attack" | "magic" | "morph" | "machine" }[],
  atlas: [
    { id: "dither", ja: "市松" }, { id: "stripe", ja: "縞" }, { id: "weave", ja: "織" },
    { id: "grain", ja: "粒子" }, { id: "runes", ja: "刻印" }, { id: "plate", ja: "鋼板" },
    { id: "circuit", ja: "回路" }, { id: "viscera", ja: "血肉" },
  ] as { id: AtlasPattern; ja: string }[],
};

/** Modular part library exposed in the inspector. */
export const PART_TOGGLES: {
  key: keyof GeneratorConfig; ja: string; en: string; group: string;
}[] = [
  { key: "hasCoreGem", ja: "宝玉コア", en: "CORE GEM", group: "arcane" },
  { key: "hasSecondGem", ja: "二番目の宝石", en: "SECOND GEM", group: "arcane" },
  { key: "hasPommelGem", ja: "柄頭の宝石", en: "POMMEL GEM", group: "arcane" },
  { key: "hasRunicEngravings", ja: "古代ルーン刻印", en: "RUNES", group: "arcane" },
  { key: "hasEnergyBladeOutline", ja: "オーラ二重輪郭", en: "AURA EDGE", group: "arcane" },
  { key: "hasPrismArray", ja: "集束プリズム列", en: "PRISM ARRAY", group: "arcane" },

  { key: "hasGearworks", ja: "露出歯車機構", en: "GEARWORKS", group: "machine" },
  { key: "hasPistons", ja: "駆動ピストン", en: "PISTONS", group: "machine" },
  { key: "hasCables", ja: "動力ケーブル", en: "CABLES", group: "machine" },
  { key: "hasVents", ja: "排熱フィン", en: "HEAT VENTS", group: "machine" },
  { key: "hasScope", ja: "照準スコープ", en: "SCOPE", group: "machine" },

  { key: "hasThornCrown", ja: "棘冠・茨", en: "THORN CROWN", group: "cursed" },
  { key: "hasSkullMotif", ja: "髑髏装飾", en: "SKULL MOTIF", group: "cursed" },
  { key: "hasBloodTank", ja: "血液槽・管", en: "BLOOD TANK", group: "cursed" },

  { key: "hasSpikesOrWings", ja: "棘・翼の伸び", en: "WING SPIKES", group: "ornament" },
  { key: "hasChainsOrRibbons", ja: "鎖と飾り紐", en: "CHAINS", group: "ornament" },
  { key: "hasBanner", ja: "軍旗・幟", en: "BANNER", group: "ornament" },
];

export const PART_GROUP_LABELS: Record<string, string> = {
  arcane: "ARCANE 魔法部位",
  machine: "MACHINE 機械部位",
  cursed: "CURSED 禍々部位",
  ornament: "ORNAMENT 装飾部位",
};

/** Strip existing tier/limit suffixes from a weapon name so we can re-tag cleanly. */
export function stripEvolutionSuffix(name: string): string {
  return name
    .replace(/【(壱|弐|参|肆|伍)式[^】]*】/g, "")
    .replace(/【★+[^】]*】/g, "")
    .trim();
}

export function deriveTieredConfig(
  base: GeneratorConfig,
  tier: UpgradeTier,
  limitBreak: LimitBreakLevel = base.limitBreak
): GeneratorConfig {
  const cleanName = stripEvolutionSuffix(base.name) || "無銘の兵装";
  const tierMeta = UPGRADE_TIERS.find((t) => t.tier === tier)!;
  const lbSuffix =
    limitBreak === 2 ? "【★★真・神格解放】" : limitBreak === 1 ? "【★極・限界突破】" : tierMeta.suffixJa;
  return { ...base, name: `${cleanName}${lbSuffix}`, upgradeTier: tier, limitBreak };
}

export function deriveThemeArsenalConfigs(base: GeneratorConfig): GeneratorConfig[] {
  const themePrefix = THEME_LABELS[base.theme].prefixJa;
  return CATEGORIES.map((cat, idx) => ({
    ...base,
    ...CATEGORY_DEFAULTS[cat.id],
    category: cat.id,
    name: `${themePrefix}${cat.ja}`,
    seed: base.seed + idx * 17,
  }));
}
