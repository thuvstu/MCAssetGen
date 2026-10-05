import { DEFAULT_PROFILE } from "./targets";
import type { AdvancementDef, CustomEffectDef, DropRule, MaterialDef, ShopDef, ShopTrade, SkillPointDef, MobDef, Action, BlockDef, Condition, ItemDef, ModProject, OreDef, ParamValue, RecipeDef, SkillDef } from "./types";

export const uid = () => Math.random().toString(36).slice(2, 10);

export interface NamedConst {
  key: string; // Kotlin constant name
  label: string;
}

export const EFFECTS: NamedConst[] = [
  { key: "SPEED", label: "移動速度上昇" },
  { key: "SLOWNESS", label: "移動速度低下" },
  { key: "HASTE", label: "採掘速度上昇" },
  { key: "MINING_FATIGUE", label: "採掘速度低下" },
  { key: "STRENGTH", label: "攻撃力上昇" },
  { key: "INSTANT_HEALTH", label: "即時回復" },
  { key: "INSTANT_DAMAGE", label: "即時ダメージ" },
  { key: "JUMP_BOOST", label: "跳躍力上昇" },
  { key: "NAUSEA", label: "吐き気" },
  { key: "REGENERATION", label: "再生能力" },
  { key: "RESISTANCE", label: "耐性" },
  { key: "FIRE_RESISTANCE", label: "火炎耐性" },
  { key: "WATER_BREATHING", label: "水中呼吸" },
  { key: "INVISIBILITY", label: "透明化" },
  { key: "BLINDNESS", label: "盲目" },
  { key: "NIGHT_VISION", label: "暗視" },
  { key: "HUNGER", label: "空腹" },
  { key: "WEAKNESS", label: "弱体化" },
  { key: "POISON", label: "毒" },
  { key: "WITHER", label: "衰弱(ウィザー)" },
  { key: "ABSORPTION", label: "ダメージ吸収" },
  { key: "GLOWING", label: "発光" },
  { key: "LEVITATION", label: "浮遊" },
  { key: "SLOW_FALLING", label: "低速落下" },
  { key: "DARKNESS", label: "暗闇" },
];

export const PARTICLES: NamedConst[] = [
  { key: "FLAME", label: "炎" },
  { key: "SMOKE", label: "煙" },
  { key: "HEART", label: "ハート" },
  { key: "CRIT", label: "クリティカル" },
  { key: "ENCHANT", label: "エンチャント" },
  { key: "EXPLOSION", label: "爆発" },
  { key: "END_ROD", label: "エンドロッド" },
  { key: "SOUL_FIRE_FLAME", label: "魂の炎" },
  { key: "SNOWFLAKE", label: "雪の結晶" },
  { key: "CLOUD", label: "雲" },
  { key: "WITCH", label: "魔女" },
  { key: "HAPPY_VILLAGER", label: "緑のキラキラ" },
  { key: "LAVA", label: "溶岩" },
  { key: "DRAGON_BREATH", label: "ドラゴンブレス" },
  { key: "TOTEM_OF_UNDYING", label: "不死のトーテム" },
  { key: "ELECTRIC_SPARK", label: "電気火花" },
  { key: "SWEEP_ATTACK", label: "薙ぎ払い" },
  { key: "PORTAL", label: "ポータル" },
  { key: "NOTE", label: "音符" },
];

export const SOUNDS: NamedConst[] = [
  { key: "ENTITY_PLAYER_LEVELUP", label: "レベルアップ" },
  { key: "ENTITY_GENERIC_EXPLODE", label: "爆発音" },
  { key: "ENTITY_LIGHTNING_BOLT_THUNDER", label: "雷鳴" },
  { key: "ENTITY_ENDERMAN_TELEPORT", label: "テレポート" },
  { key: "ENTITY_BLAZE_SHOOT", label: "ブレイズ発射" },
  { key: "ENTITY_EXPERIENCE_ORB_PICKUP", label: "経験値取得" },
  { key: "ENTITY_PLAYER_ATTACK_SWEEP", label: "薙ぎ払い" },
  { key: "ENTITY_WITHER_SHOOT", label: "ウィザー発射" },
  { key: "BLOCK_ANVIL_LAND", label: "金床着地" },
  { key: "ENTITY_ENDER_DRAGON_GROWL", label: "ドラゴンの咆哮" },
  { key: "ENTITY_FIREWORK_ROCKET_LAUNCH", label: "花火打ち上げ" },
  { key: "BLOCK_BEACON_ACTIVATE", label: "ビーコン起動" },
  { key: "ENTITY_ILLUSIONER_CAST_SPELL", label: "呪文詠唱" },
  { key: "ITEM_FIRECHARGE_USE", label: "ファイアチャージ" },
];

export const BLOCK_SOUNDS = ["STONE", "WOOD", "METAL", "GLASS", "GRAVEL", "GRASS", "SAND", "WOOL", "AMETHYST_BLOCK"];

export const ITEM_TEXTURES = [
  "minecraft:item/nether_star",
  "minecraft:item/blaze_rod",
  "minecraft:item/stick",
  "minecraft:item/diamond",
  "minecraft:item/emerald",
  "minecraft:item/iron_ingot",
  "minecraft:item/gold_ingot",
  "minecraft:item/amethyst_shard",
  "minecraft:item/fire_charge",
  "minecraft:item/ender_pearl",
  "minecraft:item/book",
  "minecraft:item/diamond_sword",
  "minecraft:item/iron_sword",
  "minecraft:item/golden_apple",
  "minecraft:item/bread",
  "minecraft:item/echo_shard",
  "minecraft:item/heart_of_the_sea",
];

export const BLOCK_TEXTURES = [
  "minecraft:block/stone",
  "minecraft:block/obsidian",
  "minecraft:block/diamond_block",
  "minecraft:block/gold_block",
  "minecraft:block/iron_block",
  "minecraft:block/emerald_block",
  "minecraft:block/amethyst_block",
  "minecraft:block/glowstone",
  "minecraft:block/magma",
  "minecraft:block/oak_planks",
  "minecraft:block/sea_lantern",
  "minecraft:block/crying_obsidian",
  "minecraft:block/redstone_block",
];

export const ENTITY_TYPES: NamedConst[] = [
  { key: "ZOMBIE", label: "ゾンビ" },
  { key: "SKELETON", label: "スケルトン" },
  { key: "CREEPER", label: "クリーパー" },
  { key: "SPIDER", label: "クモ" },
  { key: "ENDERMAN", label: "エンダーマン" },
  { key: "BLAZE", label: "ブレイズ" },
  { key: "WITHER_SKELETON", label: "ウィザースケルトン" },
  { key: "VEX", label: "ヴェックス" },
  { key: "WOLF", label: "オオカミ" },
  { key: "IRON_GOLEM", label: "アイアンゴーレム" },
  { key: "SNOW_GOLEM", label: "スノーゴーレム" },
  { key: "ALLAY", label: "アレイ" },
  { key: "BEE", label: "ミツバチ" },
  { key: "VILLAGER", label: "村人" },
  { key: "MAGMA_CUBE", label: "マグマキューブ" },
];

export const PLACE_BLOCKS: NamedConst[] = [
  { key: "FIRE", label: "火" },
  { key: "SOUL_FIRE", label: "ソウルファイア" },
  { key: "OBSIDIAN", label: "黒曜石" },
  { key: "COBWEB", label: "クモの巣" },
  { key: "MAGMA_BLOCK", label: "マグマブロック" },
  { key: "CAMPFIRE", label: "キャンプファイア" },
  { key: "POWDER_SNOW", label: "粉雪" },
  { key: "TNT", label: "TNT" },
  { key: "WATER", label: "水" },
  { key: "LAVA", label: "溶岩" },
  { key: "ICE", label: "氷" },
  { key: "GLOWSTONE", label: "グロウストーン" },
  { key: "CRYING_OBSIDIAN", label: "泣く黒曜石" },
];

export const COMMON_VANILLA_ITEMS = [
  "minecraft:stick", "minecraft:diamond", "minecraft:iron_ingot", "minecraft:gold_ingot", "minecraft:emerald",
  "minecraft:redstone", "minecraft:lapis_lazuli", "minecraft:coal", "minecraft:blaze_rod", "minecraft:blaze_powder",
  "minecraft:nether_star", "minecraft:ender_pearl", "minecraft:amethyst_shard", "minecraft:obsidian",
  "minecraft:cobblestone", "minecraft:oak_planks", "minecraft:glowstone_dust", "minecraft:book",
  "minecraft:paper", "minecraft:string", "minecraft:feather", "minecraft:gunpowder", "minecraft:apple",
  "minecraft:golden_apple", "minecraft:bread", "minecraft:diamond_block", "minecraft:iron_block",
];

export type FieldKind = "number" | "text" | "textarea" | "select" | "bool" | "skill" | "item" | "mob" | "customEffect" | "advancement" | "shop";

export interface FieldSchema {
  key: string;
  label: string;
  kind: FieldKind;
  default: ParamValue;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  hint?: string;
}

export type ActionCategory = "combat" | "movement" | "effect" | "world" | "flow" | "code";

export interface ActionSchema {
  type: string;
  label: string;
  icon: string;
  category: ActionCategory;
  fields: FieldSchema[];
  container?: boolean;
  describe: (p: Record<string, ParamValue>) => string;
}

export const CATEGORY_STYLE: Record<ActionCategory, { label: string; bar: string; bg: string; text: string }> = {
  combat: { label: "戦闘", bar: "bg-red-500", bg: "bg-red-500/10 border-red-500/30", text: "text-red-300" },
  movement: { label: "移動", bar: "bg-sky-500", bg: "bg-sky-500/10 border-sky-500/30", text: "text-sky-300" },
  effect: { label: "演出", bar: "bg-fuchsia-500", bg: "bg-fuchsia-500/10 border-fuchsia-500/30", text: "text-fuchsia-300" },
  world: { label: "ワールド", bar: "bg-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-300" },
  flow: { label: "制御", bar: "bg-amber-500", bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-300" },
  code: { label: "Kotlin", bar: "bg-violet-500", bg: "bg-violet-500/10 border-violet-500/30", text: "text-violet-300" },
};

const TARGET_OPTIONS = [
  { value: "SELF", label: "自分" },
  { value: "TARGET", label: "視線の先の敵" },
  { value: "AREA", label: "自分の周囲(範囲)" },
  { value: "POINT", label: "発動位置/着弾点の周囲" },
];

const targetFields = (defTarget = "TARGET"): FieldSchema[] => [
  { key: "target", label: "対象", kind: "select", default: defTarget, options: TARGET_OPTIONS },
  { key: "radius", label: "範囲半径", kind: "number", default: 4, min: 1, max: 64, step: 0.5, unit: "ブロック", hint: "対象が「周囲」のときのみ有効" },
];

const VAR_SCOPES = [
  { value: "SELF", label: "自分(発動者)" },
  { value: "TARGET", label: "視線の敵/ターゲット" },
  { value: "GLOBAL", label: "グローバル(全体共通)" },
];
const scopeLabel = (v: ParamValue) => (v === "GLOBAL" ? "全体" : v === "TARGET" ? "敵" : "自分");

const tgtLabel = (p: Record<string, ParamValue>) =>
  p.target === "SELF" ? "自分" : p.target === "AREA" ? `周囲${p.radius}m` : p.target === "POINT" ? `着弾点${p.radius}m` : "視線の敵";

export const ACTION_SCHEMAS: ActionSchema[] = [
  {
    type: "damage", label: "ダメージ", icon: "⚔️", category: "combat",
    fields: [...targetFields(), { key: "amount", label: "ダメージ量", kind: "number", default: 6, min: 0, max: 1000, step: 0.5, unit: "HP" }],
    describe: (p) => `${tgtLabel(p)}に ${p.amount} ダメージ`,
  },
  {
    type: "heal", label: "回復", icon: "💚", category: "combat",
    fields: [...targetFields("SELF"), { key: "amount", label: "回復量", kind: "number", default: 4, min: 0, max: 1000, step: 0.5, unit: "HP" }],
    describe: (p) => `${tgtLabel(p)}を ${p.amount} 回復`,
  },
  {
    type: "effect", label: "ポーション効果", icon: "🧪", category: "combat",
    fields: [
      ...targetFields("SELF"),
      { key: "effect", label: "効果", kind: "select", default: "SPEED", options: EFFECTS.map((e) => ({ value: e.key, label: `${e.label} (${e.key})` })) },
      { key: "seconds", label: "持続時間", kind: "number", default: 10, min: 1, max: 3600, unit: "秒" },
      { key: "amplifier", label: "レベル(0=I)", kind: "number", default: 0, min: 0, max: 255 },
    ],
    describe: (p) => `${tgtLabel(p)}に ${p.effect} Lv${Number(p.amplifier) + 1} を ${p.seconds}秒`,
  },
  {
    type: "ignite", label: "着火", icon: "🔥", category: "combat",
    fields: [...targetFields(), { key: "seconds", label: "燃焼時間", kind: "number", default: 5, min: 1, max: 120, unit: "秒" }],
    describe: (p) => `${tgtLabel(p)}を ${p.seconds}秒燃やす`,
  },
  {
    type: "launch", label: "吹き飛ばし/ダッシュ", icon: "💨", category: "movement",
    fields: [
      ...targetFields("SELF"),
      { key: "power", label: "水平パワー", kind: "number", default: 1.5, min: -5, max: 10, step: 0.1, hint: "自分は視線方向、他は自分から離れる方向" },
      { key: "up", label: "上向きパワー", kind: "number", default: 0.3, min: -2, max: 5, step: 0.1 },
    ],
    describe: (p) => `${tgtLabel(p)}を加速 (水平${p.power}/垂直${p.up})`,
  },
  {
    type: "blink", label: "ブリンク(瞬間移動)", icon: "🌀", category: "movement",
    fields: [{ key: "distance", label: "最大距離", kind: "number", default: 8, min: 1, max: 64, unit: "ブロック" }],
    describe: (p) => `視線方向へ最大 ${p.distance}m テレポート`,
  },
  {
    type: "explosion", label: "爆発", icon: "💥", category: "world",
    fields: [
      { key: "target", label: "爆発位置", kind: "select", default: "TARGET", options: [{ value: "SELF", label: "自分の位置" }, { value: "TARGET", label: "視線の敵の位置" }, { value: "POINT", label: "発動位置/着弾点" }] },
      { key: "power", label: "威力", kind: "number", default: 2, min: 0.5, max: 20, step: 0.5 },
      { key: "fire", label: "火を発生させる", kind: "bool", default: false },
      { key: "breakBlocks", label: "ブロックを破壊する", kind: "bool", default: false },
    ],
    describe: (p) => `${p.target === "SELF" ? "自分" : p.target === "POINT" ? "着弾点" : "敵"}の位置で威力${p.power}の爆発`,
  },
  {
    type: "lightning", label: "落雷", icon: "⚡", category: "world",
    fields: targetFields(),
    describe: (p) => `${tgtLabel(p)}に雷を落とす`,
  },
  {
    type: "particles", label: "パーティクル", icon: "✨", category: "effect",
    fields: [
      ...targetFields("SELF"),
      { key: "particle", label: "種類", kind: "select", default: "FLAME", options: PARTICLES.map((e) => ({ value: e.key, label: `${e.label} (${e.key})` })) },
      { key: "count", label: "数", kind: "number", default: 20, min: 1, max: 500 },
    ],
    describe: (p) => `${tgtLabel(p)}に ${p.particle} x${p.count}`,
  },
  {
    type: "sound", label: "サウンド", icon: "🔊", category: "effect",
    fields: [
      { key: "sound", label: "音", kind: "select", default: "ENTITY_PLAYER_LEVELUP", options: SOUNDS.map((e) => ({ value: e.key, label: `${e.label} (${e.key})` })) },
      { key: "volume", label: "音量", kind: "number", default: 1, min: 0, max: 4, step: 0.1 },
      { key: "pitch", label: "ピッチ", kind: "number", default: 1, min: 0.5, max: 2, step: 0.05 },
    ],
    describe: (p) => `${p.sound} を再生`,
  },
  {
    type: "message", label: "メッセージ", icon: "💬", category: "effect",
    fields: [
      { key: "text", label: "テキスト", kind: "text", default: "スキル発動!" },
      { key: "actionBar", label: "アクションバーに表示", kind: "bool", default: true },
    ],
    describe: (p) => `「${p.text}」を表示 (<var.x> で変数を埋め込めます)`,
  },
  {
    type: "summonCustom", label: "カスタムモブ召喚", icon: "🧌", category: "world",
    fields: [
      ...targetFields("SELF"),
      { key: "mobId", label: "カスタムモブ", kind: "mob", default: "", hint: "「モブ」タブで定義したモブ" },
      { key: "count", label: "体数", kind: "number", default: 1, min: 1, max: 10 },
    ],
    describe: (p) => `${tgtLabel(p)}にカスタムモブ「${p.mobId || "未選択"}」を${p.count}体召喚`,
  },
  {
    type: "customEffect", label: "カスタムエフェクト付与", icon: "🌟", category: "combat",
    fields: [
      ...targetFields("SELF"),
      { key: "effectId", label: "カスタムエフェクト", kind: "customEffect", default: "", hint: "「拡張」タブで定義したエフェクト" },
      { key: "seconds", label: "持続時間", kind: "number", default: 60, min: 1, max: 3600, unit: "秒" },
      { key: "amplifier", label: "レベル(0=I)", kind: "number", default: 0, min: 0, max: 255 },
    ],
    describe: (p) => `${tgtLabel(p)}にエフェクト「${p.effectId || "未選択"}」を${p.seconds}秒`,
  },
  {
    type: "advance", label: "実績を進める", icon: "🏆", category: "world",
    fields: [
      { key: "advId", label: "実績", kind: "advancement", default: "", hint: "「拡張」タブで定義した実績。段数がある実績は n/N と進捗します" },
      { key: "amount", label: "進める段数", kind: "number", default: 1, min: 1, max: 100 },
    ],
    describe: (p) => `実績「${p.advId || "未選択"}」を${p.amount}段進める`,
  },
  {
    type: "openShop", label: "ショップを開く", icon: "🏪", category: "world",
    fields: [
      { key: "shopId", label: "ショップ", kind: "shop", default: "", hint: "「拡張」タブで定義したショップ (村人と同じ取引画面)" },
    ],
    describe: (p) => `ショップ「${p.shopId || "未選択"}」を取引画面で開く`,
  },
  {
    type: "grantSkillPoints", label: "スキルポイント獲得", icon: "⭐", category: "combat",
    fields: [
      { key: "points", label: "獲得ポイント数", kind: "number", default: 1, min: 1, max: 100 },
    ],
    describe: (p) => `スキルポイントを ${p.points} 獲得する`,
  },
  {
    type: "bossbar", label: "ボスバー表示", icon: "📊", category: "effect",
    fields: [
      { key: "text", label: "バーのタイトル", kind: "text", default: "BOSS HP" },
      { key: "percent", label: "進行度(%)", kind: "number", default: 100, min: 0, max: 100 },
      { key: "color", label: "色", kind: "select", default: "PURPLE", options: [
        { value: "PINK", label: "ピンク" }, { value: "BLUE", label: "青" }, { value: "RED", label: "赤" },
        { value: "GREEN", label: "緑" }, { value: "YELLOW", label: "黄" }, { value: "PURPLE", label: "紫" }, { value: "WHITE", label: "白" }
      ]},
    ],
    describe: (p) => `ボスバー「${p.text}」(${p.percent}%, ${p.color})を表示`,
  },
  {
    type: "scoreboard", label: "スコアボード操作", icon: "🔢", category: "world",
    fields: [
      { key: "objective", label: "項目名(Objective)", kind: "text", default: "score" },
      { key: "score", label: "設定する値", kind: "number", default: 10 },
    ],
    describe: (p) => `スコア ${p.objective} を ${p.score} に設定`,
  },
  {
    type: "totemEffect", label: "不死のトーテム効果", icon: "✨", category: "combat",
    fields: [
      ...targetFields("SELF"),
    ],
    describe: (p) => `${tgtLabel(p)}にトーテム発動演出と再生・耐火・吸収効果`,
  },
  {
    type: "spiral", label: "螺旋パーティクル", icon: "🌀", category: "effect",
    fields: [
      ...targetFields("SELF"),
      { key: "particle", label: "種類", kind: "select", default: "FLAME", options: PARTICLES.map((e) => ({ value: e.key, label: `${e.label} (${e.key})` })) },
      { key: "radius", label: "螺旋半径", kind: "number", default: 2, min: 0.5, max: 10, step: 0.5 },
      { key: "height", label: "高さ", kind: "number", default: 4, min: 1, max: 15 },
    ],
    describe: (p) => `${tgtLabel(p)}の周囲に高さ${p.height}の螺旋${p.particle}`,
  },
  {
    type: "openGui", label: "ブロックUI展開/音", icon: "🪟", category: "world",
    fields: [
      { key: "guiType", label: "開くUIの種類", kind: "select", default: "CRAFTING", options: [
        { value: "CRAFTING", label: "作業台 (3x3 クラフト画面)" },
        { value: "ENDER_CHEST", label: "エンダーチェスト" },
        { value: "ANVIL", label: "金床 (修復・名付け)" },
      ]},
    ],
    describe: (p) => `${p.guiType} 画面を即座に開く`,
  },
  {
    type: "swap", label: "位置スワップ", icon: "🔄", category: "combat",
    fields: [...targetFields("TARGET")],
    describe: (p) => `${tgtLabel(p)}と自分の位置を入れ替える`,
  },
  {
    type: "knockup", label: "ノックアップ (打ち上げ)", icon: "🌪️", category: "combat",
    fields: [...targetFields("TARGET"), { key: "power", label: "打ち上げる強さ", kind: "number", default: 1.2, min: 0.1, max: 4, step: 0.1 }],
    describe: (p) => `${tgtLabel(p)}を真上に打ち上げる (強さ${p.power})`,
  },
  {
    type: "gravity", label: "グラビティ (急降下)", icon: "☄️", category: "combat",
    fields: [...targetFields("TARGET"), { key: "power", label: "落とす強さ", kind: "number", default: 1.6, min: 0.1, max: 5, step: 0.1 }],
    describe: (p) => `${tgtLabel(p)}を地面に引きずり下ろす (強さ${p.power})`,
  },
  {
    type: "silence", label: "沈黙 (スキル封印)", icon: "🔇", category: "combat",
    fields: [...targetFields("TARGET"), { key: "seconds", label: "効果時間", kind: "number", default: 4, min: 1, max: 30, unit: "秒" }],
    describe: (p) => `${tgtLabel(p)}を${p.seconds}秒間、スキル使用不可にする`,
  },
  {
    type: "pull", label: "引き寄せ", icon: "🧲", category: "combat",
    fields: [...targetFields("AREA"), { key: "power", label: "強さ", kind: "number", default: 1.2, min: 0.1, max: 5, step: 0.1 }],
    describe: (p) => `${tgtLabel(p)}を自分の方へ引き寄せる (強さ${p.power})`,
  },
  {
    type: "lifesteal", label: "吸血攻撃", icon: "🩸", category: "combat",
    fields: [
      ...targetFields("TARGET"),
      { key: "amount", label: "ダメージ", kind: "number", default: 4, min: 0.5, max: 100, step: 0.5 },
      { key: "ratio", label: "回復割合", kind: "number", default: 50, min: 0, max: 200, unit: "%", hint: "与えたダメージの何%を自分が回復するか" },
    ],
    describe: (p) => `${tgtLabel(p)}に${p.amount}ダメージ、与えた量の${p.ratio}%を回復`,
  },
  {
    type: "chainLightning", label: "連鎖雷", icon: "⛓️", category: "combat",
    fields: [
      ...targetFields("TARGET"),
      { key: "jumps", label: "連鎖回数", kind: "number", default: 4, min: 1, max: 12 },
      { key: "range", label: "連鎖の距離", kind: "number", default: 6, min: 1, max: 20, step: 0.5, unit: "ブロック" },
      { key: "amount", label: "1回あたりのダメージ", kind: "number", default: 5, min: 0.5, max: 100, step: 0.5 },
    ],
    describe: (p) => `${tgtLabel(p)}から最大${p.jumps}体へ雷が連鎖 (各${p.amount}ダメージ)`,
  },
  {
    type: "shield", label: "バリア(衝撃吸収)", icon: "🛡️", category: "combat",
    fields: [{ key: "amount", label: "吸収量", kind: "number", default: 6, min: 1, max: 40, hint: "黄色いハートの量 (半ハート=1)" }],
    describe: (p) => `黄色いハートを${p.amount}付与`,
  },
  {
    type: "resetCooldowns", label: "クールダウン解除", icon: "⏱️", category: "flow",
    fields: [],
    describe: () => "自分の全スキルのクールダウンをリセット",
  },
  {
    type: "dropItem", label: "アイテムをドロップ", icon: "📦", category: "world",
    fields: [
      ...targetFields("SELF"),
      { key: "item", label: "アイテムID", kind: "item", default: "minecraft:emerald" },
      { key: "count", label: "個数", kind: "number", default: 1, min: 1, max: 64 },
    ],
    describe: (p) => `${tgtLabel(p)}の位置に ${p.item} を${p.count}個落とす`,
  },
  {
    type: "giveItem", label: "アイテム付与", icon: "🎁", category: "world",
    fields: [
      { key: "item", label: "アイテムID", kind: "item", default: "minecraft:golden_apple" },
      { key: "count", label: "個数", kind: "number", default: 1, min: 1, max: 64 },
    ],
    describe: (p) => `${p.item} を ${p.count}個付与`,
  },
  {
    type: "command", label: "コマンド実行", icon: "⌨️", category: "world",
    fields: [{ key: "command", label: "コマンド(/なし)", kind: "text", default: "time set day", hint: "OP権限で実行されます" }],
    describe: (p) => `/${p.command}`,
  },
  {
    type: "summon", label: "Mob召喚", icon: "🐺", category: "world",
    fields: [
      ...targetFields("SELF"),
      { key: "entity", label: "種類", kind: "select", default: "ZOMBIE", options: ENTITY_TYPES.map((e) => ({ value: e.key, label: `${e.label} (${e.key})` })) },
      { key: "count", label: "体数", kind: "number", default: 1, min: 1, max: 20 },
    ],
    describe: (p) => `${tgtLabel(p)}の位置に ${p.entity} を${p.count}体召喚`,
  },
  {
    type: "fireball", label: "火の玉を発射", icon: "☄️", category: "combat",
    fields: [
      ...targetFields(),
      { key: "speed", label: "速度", kind: "number", default: 1.5, min: 0.1, max: 10, step: 0.1 },
    ],
    describe: (p) => `${tgtLabel(p)}へ火の玉 (速度${p.speed})`,
  },
  {
    type: "placeBlock", label: "ブロック設置", icon: "🧊", category: "world",
    fields: [
      ...targetFields("SELF"),
      { key: "block", label: "ブロック", kind: "select", default: "FIRE", options: PLACE_BLOCKS.map((e) => ({ value: e.key, label: `${e.label} (${e.key})` })) },
      { key: "yOffset", label: "Yオフセット", kind: "number", default: 0, min: -5, max: 5 },
    ],
    describe: (p) => `${tgtLabel(p)}の足元に ${p.block} を設置`,
  },
  {
    type: "breakBlock", label: "周囲のブロック破壊", icon: "⛏️", category: "world",
    fields: [
      ...targetFields("SELF"),
      { key: "drop", label: "ドロップさせる", kind: "bool", default: false },
    ],
    describe: (p) => `${tgtLabel(p)}の足元のブロックを破壊`,
  },
  {
    type: "teleportNear", label: "自分へ引き寄せ/転送", icon: "🌀", category: "movement",
    fields: [
      ...targetFields(),
      { key: "distance", label: "自分の目の前までの距離", kind: "number", default: 2.5, min: 0.5, max: 32, step: 0.5, unit: "ブロック" },
    ],
    describe: (p) => `${tgtLabel(p)}を自分の${p.distance}m先へ転送`,
  },
  {
    type: "clearEffects", label: "状態異常を解除", icon: "🧹", category: "combat",
    fields: targetFields("SELF"),
    describe: (p) => `${tgtLabel(p)}の全状態異常を解除`,
  },
  {
    type: "giveXp", label: "経験値付与", icon: "⭐", category: "combat",
    fields: [{ key: "amount", label: "経験値", kind: "number", default: 20, min: 1, max: 10000 }],
    describe: (p) => `経験値 +${p.amount}`,
  },
  {
    type: "missile", label: "ミサイル(飛翔弾)", icon: "🎯", category: "combat",
    fields: [
      { key: "particle", label: "軌跡のパーティクル", kind: "select", default: "END_ROD", options: PARTICLES.map((e) => ({ value: e.key, label: `${e.label} (${e.key})` })) },
      { key: "speed", label: "速度", kind: "number", default: 1.4, min: 0.2, max: 5, step: 0.1, unit: "ブロック/tick" },
      { key: "gravity", label: "重力", kind: "number", default: 0, min: 0, max: 0.2, step: 0.005, hint: "0=直進 / 0.04=放物線" },
      { key: "hitRadius", label: "当たり判定の大きさ", kind: "number", default: 0.6, min: 0.1, max: 4, step: 0.1, unit: "ブロック" },
      { key: "lifetime", label: "最大飛翔時間", kind: "number", default: 40, min: 5, max: 200, unit: "tick" },
      { key: "onHitSkill", label: "着弾時に発動するスキル", kind: "skill", default: "", hint: "敵・ブロックに当たる/時間切れで、その場所を「着弾点」として発動" },
    ],
    describe: (p) => `${p.particle} の弾を発射 → 着弾で「${p.onHitSkill || "未設定"}」`,
  },
  {
    type: "ring", label: "パーティクルの輪", icon: "⭕", category: "effect",
    fields: [
      ...targetFields("SELF"),
      { key: "ringRadius", label: "輪の半径", kind: "number", default: 3, min: 0.5, max: 20, step: 0.5, unit: "ブロック" },
      { key: "particle", label: "種類", kind: "select", default: "END_ROD", options: PARTICLES.map((e) => ({ value: e.key, label: `${e.label} (${e.key})` })) },
      { key: "points", label: "点の数", kind: "number", default: 24, min: 4, max: 120 },
    ],
    describe: (p) => `${tgtLabel(p)}に半径${p.ringRadius}の ${p.particle} の輪`,
  },
  {
    type: "setVar", label: "変数をセット", icon: "📝", category: "flow",
    fields: [
      { key: "scope", label: "保存先", kind: "select", default: "SELF", options: VAR_SCOPES },
      { key: "name", label: "変数名", kind: "text", default: "combo", hint: "英数字と _ 。ワールドに保存され再起動後も残ります" },
      { key: "value", label: "値", kind: "number", default: 0, step: 0.5 },
    ],
    describe: (p) => `${scopeLabel(p.scope)}の変数 ${p.name} = ${p.value}`,
  },
  {
    type: "addVar", label: "変数を加算", icon: "➕", category: "flow",
    fields: [
      { key: "scope", label: "保存先", kind: "select", default: "SELF", options: VAR_SCOPES },
      { key: "name", label: "変数名", kind: "text", default: "combo" },
      { key: "amount", label: "加算量 (負で減算)", kind: "number", default: 1, step: 0.5 },
      { key: "min", label: "下限", kind: "number", default: 0 },
      { key: "max", label: "上限", kind: "number", default: 1000000 },
    ],
    describe: (p) => `${scopeLabel(p.scope)}の変数 ${p.name} += ${p.amount} (${p.min}〜${p.max})`,
  },
  {
    type: "ifVar", label: "もし変数が範囲内なら", icon: "❓", category: "flow", container: true,
    fields: [
      { key: "scope", label: "参照先", kind: "select", default: "SELF", options: VAR_SCOPES },
      { key: "name", label: "変数名", kind: "text", default: "combo" },
      { key: "min", label: "最小 (含む)", kind: "number", default: 5 },
      { key: "max", label: "最大 (含む)", kind: "number", default: 1000000 },
    ],
    describe: (p) => `${scopeLabel(p.scope)}の ${p.name} が ${p.min}〜${p.max} なら…`,
  },
  {
    type: "chance", label: "確率で実行", icon: "🎲", category: "flow", container: true,
    fields: [{ key: "percent", label: "確率", kind: "number", default: 30, min: 0, max: 100, unit: "%" }],
    describe: (p) => `${p.percent}% の確率で…`,
  },
  {
    type: "title", label: "タイトル表示", icon: "🎬", category: "effect",
    fields: [
      { key: "text", label: "タイトル", kind: "text", default: "COMBO!" },
      { key: "subtitle", label: "サブタイトル", kind: "text", default: "" },
    ],
    describe: (p) => `画面中央に「${p.text}」`,
  },
  {
    type: "feed", label: "満腹度回復", icon: "🍖", category: "combat",
    fields: [{ key: "amount", label: "回復量 (半分=1)", kind: "number", default: 6, min: 1, max: 20 }],
    describe: (p) => `満腹度 +${p.amount}`,
  },
  {
    type: "restoreMana", label: "マナ回復", icon: "🔷", category: "combat",
    fields: [{ key: "amount", label: "回復量", kind: "number", default: 20, min: 1, max: 1000 }],
    describe: (p) => `マナ +${p.amount}`,
  },
  {
    type: "castSkill", label: "別スキルを発動", icon: "🔗", category: "flow",
    fields: [{ key: "skillId", label: "スキル", kind: "skill", default: "" }],
    describe: (p) => `スキル「${p.skillId || "未選択"}」を連鎖発動`,
  },
  {
    type: "delay", label: "待機してから実行", icon: "⏱️", category: "flow", container: true,
    fields: [{ key: "ticks", label: "待機", kind: "number", default: 20, min: 1, max: 6000, unit: "tick (20=1秒)" }],
    describe: (p) => `${p.ticks}tick後に…`,
  },
  {
    type: "repeat", label: "繰り返し", icon: "🔁", category: "flow", container: true,
    fields: [
      { key: "times", label: "回数", kind: "number", default: 3, min: 1, max: 100 },
      { key: "interval", label: "間隔", kind: "number", default: 10, min: 1, max: 600, unit: "tick" },
    ],
    describe: (p) => `${p.interval}tick間隔で ${p.times}回`,
  },
  {
    type: "custom", label: "Kotlinコード", icon: "🧩", category: "code",
    fields: [
      {
        key: "code", label: "Kotlin (ctx: SkillContext が使えます)", kind: "textarea",
        default: "// ctx.player / ctx.world / ctx.target\nctx.player.sendMessage(Text.literal(\"Hello from Kotlin\"), false)",
      },
    ],
    describe: () => "カスタムKotlinコード",
  },
];

export const schemaOf = (type: string) => ACTION_SCHEMAS.find((s) => s.type === type);

export const CONDITION_SCHEMAS = [
  { type: "SNEAKING", label: "スニーク中", hasValue: false, placeholder: "" },
  { type: "ON_GROUND", label: "地面に立っている", hasValue: false, placeholder: "" },
  { type: "IN_WATER", label: "水に触れている", hasValue: false, placeholder: "" },
  { type: "HAS_TARGET", label: "視線の先に敵がいる", hasValue: false, placeholder: "" },
  { type: "HEALTH_BELOW", label: "体力が○%未満", hasValue: true, placeholder: "50" },
  { type: "HOLDING", label: "メインハンドに持つ", hasValue: true, placeholder: "mymod:fire_staff" },
  { type: "WEARING", label: "防具を装備している", hasValue: true, placeholder: "mymod:mythril_chestplate" },
  { type: "SPRINTING", label: "ダッシュ(走行)中", hasValue: false, placeholder: "" },
  { type: "MANA_ABOVE", label: "マナがN以上", hasValue: true, placeholder: "30" },
  { type: "VARIABLE", label: "変数が範囲内 (?variable)", hasValue: true, placeholder: "" },
  { type: "NOT_SNEAKING", label: "スニークしていない", hasValue: false, placeholder: "" },
  { type: "HEARTS_BELOW", label: "ハート(HP)がN個以下 (半ハート=1)", hasValue: true, placeholder: "6" },
  { type: "IN_OFFHAND", label: "オフハンドに特定アイテムを持つ", hasValue: true, placeholder: "minecraft:shield" },
  { type: "IS_DAY", label: "昼間である", hasValue: false, placeholder: "" },
  { type: "IS_NIGHT", label: "夜である", hasValue: false, placeholder: "" },
  { type: "NEGATE", label: "条件反転 (〜でない時)", hasValue: true, placeholder: "条件名" },
];

/** VARIABLE条件の値は "scope|name|min|max" 形式で保存 */
export function parseVarCondition(v: string) {
  const [scope = "SELF", name = "", min = "", max = ""] = v.split("|");
  return { scope, name, min, max };
}
export const encodeVarCondition = (c: { scope: string; name: string; min: string; max: string }) => `${c.scope}|${c.name}|${c.min}|${c.max}`;

export const TRIGGERS = [
  { value: "MANUAL", label: "手動(アイテム右クリック/ブロック/コマンド)" },
  { value: "ATTACK_ENTITY", label: "エンティティを攻撃した時" },
  { value: "KILL_ENTITY", label: "エンティティを倒した時" },
  { value: "BREAK_BLOCK", label: "ブロックを破壊した時" },
  { value: "TAKE_DAMAGE", label: "ダメージを受けた時" },
  { value: "WEAR", label: "防具を装備している間 (一定間隔 / ~onWear)" },
  { value: "PLAYER_JOIN", label: "ワールド参加時" },
  { value: "PERIODIC", label: "一定間隔(パッシブ)" },
  { value: "SWING", label: "アイテムをスイング(左クリック)した時" },
  { value: "DEATH", label: "プレイヤー死亡時 (復活処理/蘇生)" },
];

export function defaultParams(type: string): Record<string, ParamValue> {
  const s = schemaOf(type);
  const p: Record<string, ParamValue> = {};
  s?.fields.forEach((f) => (p[f.key] = f.default));
  return p;
}

export function newAction(type: string): Action {
  const s = schemaOf(type);
  return { uid: uid(), type, params: defaultParams(type), ...(s?.container ? { children: [] } : {}) };
}

export function newCondition(type = "SNEAKING"): Condition {
  return { uid: uid(), type, value: "" };
}

export function newItem(modId: string): ItemDef {
  return {
    id: "new_item", kind: "simple", material: "IRON", attackDamage: 3, attackSpeed: -2.4,
    armorSlot: "CHESTPLATE", armorMaterial: "IRON", name: "New Item", texture: "minecraft:item/nether_star", model: "generated",
    bonusMaxHealth: 0, bonusMovementSpeed: 0, bonusArmor: 0, bonusToughness: 0, bonusKnockbackResistance: 0,
    maxCount: 64, durability: 0, rarity: "COMMON", fireproof: false, glint: false, food: null, skillId: null, tooltip: "",
  };
}

export function newBlock(): BlockDef {
  return {
    id: "new_block", ore: null, surface: null, name: "New Block", texture: "minecraft:block/stone", hardness: 2, resistance: 6, luminance: 0,
    sound: "STONE", tool: "pickaxe", toolTier: "none", requiresTool: false, skillId: null,
  };
}

export function newSkill(): SkillDef {
  return {
    id: "new_skill", name: "New Skill", description: "", cooldown: 5, manaCost: 10,
    trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [], actions: [newAction("message")],
  };
}

export function newRecipe(): RecipeDef {
  return { id: "new_recipe", type: "shaped", grid: Array(9).fill(""), resultItem: "", resultCount: 1 };
}

export function emptyProject(): ModProject {
  return {
    meta: {
      modId: "mymod", name: "My Mod", version: "1.0.0", author: "Me", description: "Created with MythicForge",
      packageName: "com.example.mymod", license: "MIT",
    },
    mana: { max: 100, regenPerSecond: 2 },
    items: [], blocks: [], skills: [], recipes: [], mobs: [], drops: [], materials: [], effects: [], advancements: [], shops: [], skillPoints: [], customImports: "",
    config: { maxMana: 100, regenPerSecond: 2, hud: true, slots: ["", "", "", ""], slotKeys: [82, 71, 72, 86] },
  };
}

export function starterProject(name: string): ModProject {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/^[0-9]+/, "") || "mymod";
  const p = emptyProject();
  p.meta.modId = id;
  p.meta.name = name;
  p.meta.packageName = `com.example.${id.replace(/_/g, "")}`;
  p.meta.env = { profile: DEFAULT_PROFILE }; // 新規プロジェクトは 1.21.11 / Mojang マッピング
  const a = (type: string, params: Record<string, ParamValue>, children?: Action[]): Action => ({
    ...newAction(type), params: { ...defaultParams(type), ...params }, ...(children ? { children } : {}),
  });
  p.skills = [
    {
      id: "fire_blast", name: "ファイアブラスト", description: "視線の先の敵を焼き、爆発させる", cooldown: 6, manaCost: 25,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" },
      conditions: [{ uid: uid(), type: "HAS_TARGET", value: "" }],
      actions: [
        a("sound", { sound: "ITEM_FIRECHARGE_USE" }),
        a("particles", { target: "TARGET", particle: "FLAME", count: 40 }),
        a("damage", { target: "TARGET", amount: 8 }),
        a("ignite", { target: "TARGET", seconds: 6 }),
        a("delay", { ticks: 10 }, [a("explosion", { target: "TARGET", power: 1.5 }), a("message", { text: "ドカーン!" })]),
      ],
    },
    {
      id: "dash", name: "ダッシュ", description: "前方へ素早く移動する", cooldown: 3, manaCost: 10,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("launch", { target: "SELF", power: 2.2, up: 0.2 }), a("particles", { target: "SELF", particle: "CLOUD", count: 15 }), a("sound", { sound: "ENTITY_ENDERMAN_TELEPORT", pitch: 1.5 })],
    },
    {
      id: "vampire_touch", name: "吸血", description: "敵を倒すと体力を回復する", cooldown: 0, manaCost: 0,
      trigger: { type: "KILL_ENTITY", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("heal", { target: "SELF", amount: 4 }), a("particles", { target: "SELF", particle: "HEART", count: 6 })],
    },
  ];
  const mythril = (extra: Partial<ItemDef>): ItemDef => ({ ...newItem(id), kind: "armor", armorMaterial: "IRON", durability: 0, maxCount: 1, rarity: "RARE", model: "generated", ...extra });
  p.skills.push(
    {
      id: "arcane_missile", name: "アーケインミサイル", description: "魔力の弾を撃ち、着弾点で範囲爆発する", cooldown: 2, manaCost: 20,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("sound", { sound: "ENTITY_ILLUSIONER_CAST_SPELL" }), a("missile", { particle: "END_ROD", speed: 1.4, gravity: 0, hitRadius: 0.6, lifetime: 40, onHitSkill: "arcane_impact" })],
    },
    {
      id: "arcane_impact", name: "アーケイン着弾", description: "ミサイルの着弾点で範囲ダメージ", cooldown: 0, manaCost: 0,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [
        a("ring", { target: "POINT", ringRadius: 3, particle: "END_ROD", points: 28 }),
        a("sound", { sound: "ENTITY_GENERIC_EXPLODE", pitch: 1.4, volume: 0.8 }),
        a("damage", { target: "POINT", radius: 4, amount: 8 }),
        a("explosion", { target: "POINT", power: 1.2 }),
      ],
    },
    {
      id: "combo_strike", name: "コンボストライク", description: "5回連続で当てると雷が落ちる", cooldown: 0, manaCost: 0,
      trigger: { type: "ATTACK_ENTITY", intervalSec: 10, heldItem: `${id}:mythic_blade` }, conditions: [],
      actions: [
        a("addVar", { scope: "SELF", name: "combo", amount: 1, min: 0, max: 5 }),
        a("message", { text: "コンボ <var.combo>/5", actionBar: true }),
        a("ifVar", { scope: "SELF", name: "combo", min: 5, max: 1000000 }, [
          a("lightning", { target: "TARGET" }),
          a("damage", { target: "TARGET", amount: 6 }),
          a("title", { text: "COMBO!", subtitle: "<player> の連撃" }),
          a("setVar", { scope: "SELF", name: "combo", value: 0 }),
        ]),
      ],
    },
    {
      id: "mythril_bonus", name: "ミスリルの加護", description: "ミスリルの胸当てを着ている間、速度と暗視を得る", cooldown: 0, manaCost: 0,
      trigger: { type: "WEAR", intervalSec: 4, heldItem: `${id}:mythril_chestplate` }, conditions: [],
      actions: [a("effect", { target: "SELF", effect: "SPEED", seconds: 8, amplifier: 0 }), a("effect", { target: "SELF", effect: "NIGHT_VISION", seconds: 12, amplifier: 0 })],
    },
  );
  p.config.slots = ["fire_blast", "dash", "arcane_missile", ""];
  p.items = [
    { ...newItem(id), id: "mythic_blade", name: "神話の剣", kind: "sword", material: "DIAMOND", attackDamage: 4, attackSpeed: -2.4, durability: 1561, texture: "minecraft:item/diamond_sword", model: "handheld", maxCount: 1, rarity: "EPIC", skillId: null, tooltip: "5連撃で雷が落ちる" },
    { ...newItem(id), id: "mana_robe", name: "マナのローブ", kind: "armor", armorSlot: "CHESTPLATE", armorMaterial: "IRON", durability: 240, texture: "minecraft:item/iron_chestplate", maxCount: 1, rarity: "RARE", glint: true, tooltip: "身にまとうだけで魔力がみなぎる" },
    { ...newItem(id), id: "fire_staff", name: "炎の杖", texture: "minecraft:item/blaze_rod", model: "handheld", maxCount: 1, rarity: "RARE", glint: true, skillId: "fire_blast", tooltip: "右クリックでファイアブラスト" },
    { ...newItem(id), id: "arcane_staff", name: "アーケインスタッフ", texture: "minecraft:item/amethyst_shard", model: "handheld", maxCount: 1, rarity: "EPIC", glint: true, skillId: "arcane_missile", tooltip: "MP20を消費し、着弾点で範囲爆発するミサイルを撃つ" },
    { ...newItem(id), id: "wind_boots_charm", name: "疾風のお守り", texture: "minecraft:item/amethyst_shard", maxCount: 1, rarity: "UNCOMMON", skillId: "dash", tooltip: "右クリックでダッシュ" },
    { ...newItem(id), id: "mana_fruit", name: "マナの実", texture: "minecraft:item/golden_apple", food: { nutrition: 4, saturation: 0.6 }, tooltip: "" },
    { ...newItem(id), id: "mythril_ingot", name: "ミスリルのインゴット", texture: "minecraft:item/iron_ingot", rarity: "UNCOMMON" },
    mythril({ id: "mythril_helmet", name: "ミスリルのヘルメット", armorSlot: "HELMET", texture: "minecraft:item/iron_helmet" }),
    mythril({ id: "mythril_chestplate", name: "ミスリルの胸当て", armorSlot: "CHESTPLATE", texture: "minecraft:item/iron_chestplate", glint: true, tooltip: "装備中は速度と暗視を得る" }),
    mythril({ id: "mythril_leggings", name: "ミスリルのレギンス", armorSlot: "LEGGINGS", texture: "minecraft:item/iron_leggings" }),
    mythril({ id: "mythril_boots", name: "ミスリルのブーツ", armorSlot: "BOOTS", texture: "minecraft:item/iron_boots" }),
  ];
  p.blocks = [
    { ...newBlock(), id: "mana_crystal_block", name: "マナ結晶ブロック", texture: "minecraft:block/amethyst_block", luminance: 10, sound: "AMETHYST_BLOCK", hardness: 3 },
    {
      ...newBlock(), id: "mythril_ore", name: "ミスリル鉱石", texture: "minecraft:block/iron_ore", hardness: 3, resistance: 3, requiresTool: true, toolTier: "stone",
      ore: { ...newOre(), dropItem: `${id}:mythril_ingot`, dropMin: 1, dropMax: 2, xpMin: 1, xpMax: 3, veinSize: 6, veinsPerChunk: 7, minY: -64, maxY: 32 },
    },
  ];
  const ing = `${id}:mythril_ingot`;
  p.recipes = [
    { id: "fire_staff", type: "shaped", grid: ["", "minecraft:blaze_powder", "minecraft:blaze_rod", "", "minecraft:blaze_rod", "minecraft:blaze_powder", "minecraft:blaze_rod", "", ""], resultItem: `${id}:fire_staff`, resultCount: 1 },
    { id: "arcane_staff", type: "shaped", grid: ["", ing, "minecraft:amethyst_shard", "", "minecraft:stick", ing, "minecraft:stick", "", ""], resultItem: `${id}:arcane_staff`, resultCount: 1 },
    { id: "mythril_chestplate", type: "shaped", grid: [ing, "", ing, ing, ing, ing, ing, ing, ing], resultItem: `${id}:mythril_chestplate`, resultCount: 1 },
    { id: "mythril_helmet", type: "shaped", grid: [ing, ing, ing, ing, "", ing, "", "", ""], resultItem: `${id}:mythril_helmet`, resultCount: 1 },
    { id: "mythril_leggings", type: "shaped", grid: [ing, ing, ing, ing, "", ing, ing, "", ing], resultItem: `${id}:mythril_leggings`, resultCount: 1 },
    { id: "mythril_boots", type: "shaped", grid: ["", "", "", ing, "", ing, ing, "", ing], resultItem: `${id}:mythril_boots`, resultCount: 1 },
  ];
  // ---- 拡張システム (エフェクト / 実績 / ショップ / スキルポイント / 素材) ----
  p.materials = [{ id: "mythril", name: "ミスリル", baseMaterial: "IRON", damageMultiplier: 1.3, speedMultiplier: 1.2, durabilityMultiplier: 1.5, description: "軽くて硬い魔法金属。攻撃力+30% / 採掘+20% / 耐久+50%" }];
  const blade = p.items.find((x) => x.id === "mythic_blade");
  if (blade) blade.materialId = "mythril";
  const chest = p.items.find((x) => x.id === "mythril_chestplate");
  if (chest) { chest.bonusMaxHealth = 4; chest.bonusKnockbackResistance = 0.1; chest.tooltip = "装備中は速度と暗視を得る\n最大HP+4 / ノックバック耐性+10%"; }
  const helmet = p.items.find((x) => x.id === "mythril_helmet");
  if (helmet) { helmet.bonusMovementSpeed = 0.01; helmet.materialId = "mythril"; }
  p.items.push({ ...newItem(id), id: "phoenix_feather", name: "不死鳥の羽", texture: "minecraft:item/feather", maxCount: 4, rarity: "EPIC", glint: true, skillId: "second_wind_cast", tooltip: "右クリックで60秒間「セカンドウィンド」\n致死ダメージを受けると復活する" });
  p.skills.push(
    {
      id: "second_wind_cast", name: "セカンドウィンド", description: "致死ダメージを一度だけ無効化するエフェクトを得る", cooldown: 120, manaCost: 40,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("customEffect", { target: "SELF", effectId: "second_wind", seconds: 60, amplifier: 0 }), a("spiral", { target: "SELF", particle: "TOTEM_OF_UNDYING", radius: 1.2, height: 2.4 }), a("message", { text: "不死鳥の加護が宿った…", actionBar: true })],
    },
    {
      id: "second_wind_burst", name: "不死鳥の復活", description: "セカンドウィンドで復活した時に発動", cooldown: 0, manaCost: 0,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("ring", { target: "SELF", ringRadius: 3, particle: "FLAME", points: 32 }), a("explosion", { target: "SELF", power: 0.1 }), a("restoreMana", { amount: 50 }), a("title", { text: "REBORN", subtitle: "<player> は不死鳥の力で蘇った" }), a("advance", { advId: "reborn", amount: 1 })],
    },
    {
      id: "arcane_focus_tick", name: "魔力集中", description: "エフェクト中、毎秒マナを回復", cooldown: 0, manaCost: 0,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("restoreMana", { amount: 4 })],
    },
    {
      id: "kill_reward", name: "討伐報酬", description: "敵を倒すとスキルポイントと実績進捗を得る", cooldown: 0, manaCost: 0,
      trigger: { type: "KILL_ENTITY", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("chance", { percent: 25 }, [a("grantSkillPoints", { points: 1 })])],
    },
  );
  p.effects = [
    { id: "second_wind", name: "セカンドウィンド", color: "#ffb347", category: "BENEFICIAL", tickSkillId: "", intervalTicks: 40, revive: true, reviveHealth: 10, reviveSkillId: "second_wind_burst" },
    { id: "arcane_focus", name: "魔力集中", color: "#66ccff", category: "BENEFICIAL", tickSkillId: "arcane_focus_tick", intervalTicks: 20, revive: false, reviveHealth: 4, reviveSkillId: "" },
  ];
  p.advancements = [
    { id: "first_mythril", name: "ミスリルを手にした", description: "ミスリルのインゴットを入手する", icon: `${id}:mythril_ingot`, frame: "task", parent: "", kind: "OBTAIN_ITEM", item: `${id}:mythril_ingot`, mob: "", steps: 1, rewardXp: 20, hidden: false },
    { id: "slayer", name: "ゾンビ・スレイヤー", description: "ゾンビを10体倒す (進捗が実績画面に表示されます)", icon: "minecraft:iron_sword", frame: "goal", parent: "first_mythril", kind: "KILL_MOB", item: "", mob: "minecraft:zombie", steps: 10, rewardXp: 60, hidden: false },
    { id: "reborn", name: "不死鳥の再誕", description: "セカンドウィンドで死から蘇る", icon: `${id}:phoenix_feather`, frame: "challenge", parent: "slayer", kind: "MANUAL", item: "", mob: "", steps: 1, rewardXp: 200, hidden: true },
  ];
  p.shops = [{
    id: "adventurer", name: "冒険者の店", openedByBlockId: "mana_crystal_block",
    trades: [
      { id: "t1", offerItem: `${id}:fire_staff`, offerCount: 1, requiredItem1: `${id}:mythril_ingot`, requiredCount1: 8, requiredItem2: "", requiredCount2: 0 },
      { id: "t2", offerItem: `${id}:mana_fruit`, offerCount: 3, requiredItem1: "minecraft:emerald", requiredCount1: 2, requiredItem2: "", requiredCount2: 0 },
      { id: "t3", offerItem: `${id}:phoenix_feather`, offerCount: 1, requiredItem1: "minecraft:nether_star", requiredCount1: 1, requiredItem2: `${id}:mythril_ingot`, requiredCount2: 4 },
    ],
  }];
  p.skillPoints = [
    { id: "vitality", name: "生命力", description: "最大HP +2 (ハート1個)", cost: 1, effect: "INCREASE_MAX_HEALTH", amount: 2 },
    { id: "power", name: "剛力", description: "攻撃力 +0.5", cost: 1, effect: "INCREASE_DAMAGE", amount: 0.5 },
    { id: "swiftness", name: "俊敏", description: "移動速度 +0.004", cost: 2, effect: "INCREASE_SPEED", amount: 0.004 },
    { id: "wisdom", name: "叡智", description: "最大マナ +10", cost: 1, effect: "INCREASE_MAX_MANA", amount: 10 },
    { id: "fortune", name: "幸運", description: "幸運 +0.5", cost: 2, effect: "INCREASE_LUCK", amount: 0.5 },
  ];
  const crystal = p.blocks.find((x) => x.id === "mana_crystal_block");
  if (crystal) crystal.surface = { biomeTag: "minecraft:is_mountain", rarity: 14, tries: 6, spread: 3 };
  p.mobs = [{ id: "blood_slime", name: "ブラッドスライム", baseMob: "MAGMA_CUBE", maxHealth: 40, movementSpeed: 0.4, attackDamage: 6, drops: [{ item: "minecraft:redstone", countMin: 1, countMax: 3, chance: 0.8 }, { item: `${id}:mythril_ingot`, countMin: 1, countMax: 1, chance: 0.15 }], behavior: "hostile" }];
  p.drops = [{ id: "zombie_loot", name: "ゾンビの落とし物", targetMob: "minecraft:zombie", items: [{ id: "minecraft:emerald", min: 1, max: 2, chance: 0.3 }] }];
  return p;
}

/** アーキタイプ別の完成プリセット (スキル・アイテム・ブロック・レシピ入り) */
export function presetProject(name: string, kind: "ice" | "holy" | "ninja"): ModProject {
  const p = starterProject(name);
  // スターター固有の拡張データ (ミスリル素材のショップ・実績等) は引き継がない
  p.mobs = []; p.drops = []; p.materials = []; p.effects = []; p.advancements = []; p.shops = []; p.skillPoints = [];
  const a = (type: string, params: Record<string, ParamValue>, children?: Action[]): Action => ({
    ...newAction(type), params: { ...defaultParams(type), ...params }, ...(children ? { children } : {}),
  });
  const id = p.meta.modId;

  if (kind === "ice") {
    p.meta.name = name || "Frost Legacy";
    p.skills = [
      { id: "frost_nova", name: "フロストノヴァ", description: "周囲の敵を凍結させダメージを与える", cooldown: 8, manaCost: 30,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
        actions: [a("sound", { sound: "ENTITY_PLAYER_LEVELUP", pitch: 0.6 }), a("particles", { target: "SELF", particle: "SNOWFLAKE", count: 60 }),
          a("effect", { target: "AREA", radius: 6, effect: "SLOWNESS", seconds: 6, amplifier: 3 }), a("damage", { target: "AREA", radius: 6, amount: 5 })] },
      { id: "blizzard", name: "ブリザード", description: "視線の敵へ連続した冷気", cooldown: 12, manaCost: 40,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [{ uid: uid(), type: "HAS_TARGET", value: "" }],
        actions: [a("repeat", { times: 5, interval: 6 }, [a("damage", { target: "TARGET", amount: 2 }), a("particles", { target: "TARGET", particle: "SNOWFLAKE", count: 12 })]),
          a("effect", { target: "TARGET", effect: "SLOWNESS", seconds: 8, amplifier: 2 })] },
      { id: "glacial_step", name: "グラシアルステップ", description: "氷の上のように素早く滑る", cooldown: 4, manaCost: 15,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
        actions: [a("launch", { target: "SELF", power: 2.6, up: 0.1 }), a("effect", { target: "SELF", effect: "SPEED", seconds: 6, amplifier: 1 }), a("particles", { target: "SELF", particle: "CLOUD", count: 20 })] },
      { id: "ice_lance", name: "アイスランス", description: "氷の槍を放ち、着弾点を凍結させる", cooldown: 3, manaCost: 22,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
        actions: [a("sound", { sound: "ENTITY_ILLUSIONER_CAST_SPELL", pitch: 1.4 }), a("missile", { particle: "SNOWFLAKE", speed: 1.8, gravity: 0.01, hitRadius: 0.5, lifetime: 50, onHitSkill: "ice_burst" })] },
      { id: "ice_burst", name: "アイスバースト", description: "着弾点の周囲を凍らせる", cooldown: 0, manaCost: 0,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
        actions: [a("ring", { target: "POINT", ringRadius: 3.5, particle: "SNOWFLAKE", points: 32 }), a("damage", { target: "POINT", radius: 3.5, amount: 6 }), a("effect", { target: "POINT", radius: 3.5, effect: "SLOWNESS", seconds: 5, amplifier: 2 }), a("sound", { sound: "BLOCK_ANVIL_LAND", pitch: 1.8, volume: 0.6 })] },
      { id: "cold_blooded", name: "冷却的心臓", description: "氷水に浸かると自然治癒する体質", cooldown: 0, manaCost: 0,
        trigger: { type: "PERIODIC", intervalSec: 5, heldItem: "" }, conditions: [{ uid: uid(), type: "IN_WATER", value: "" }],
        actions: [a("heal", { target: "SELF", amount: 1 })] },
    ];
    p.config.slots = ["frost_nova", "blizzard", "glacial_step", "ice_lance"];
    p.items = [
      { ...newItem(id), id: "frost_scepter", name: "氷結の杖", kind: "simple", texture: "minecraft:item/blaze_rod", maxCount: 1, rarity: "RARE", glint: true, skillId: "frost_nova", tooltip: "右クリックでフロストノヴァ" },
      { ...newItem(id), id: "ice_blade", name: "氷刃", kind: "sword", material: "DIAMOND", attackDamage: 4, attackSpeed: -2.4, durability: 1561, texture: "minecraft:item/diamond_sword", model: "handheld", rarity: "EPIC", tooltip: "冷気が纏わりつく刃" },
      { ...newItem(id), id: "frost_core", name: "霜の核", texture: "minecraft:item/heart_of_the_sea", maxCount: 16, rarity: "UNCOMMON" },
    ];
    p.blocks = [{ ...newBlock(), id: "permafrost_block", name: "永久凍土ブロック", texture: "minecraft:block/packed_ice", hardness: 3, resistance: 6, sound: "GLASS" }];
    p.recipes = [{ id: "frost_scepter", type: "shaped", grid: ["", "minecraft:heart_of_the_sea", "minecraft:blue_ice", "", "minecraft:stick", "minecraft:heart_of_the_sea", "minecraft:stick", "", ""], resultItem: `${id}:frost_scepter`, resultCount: 1 }];
    return p;
  }

  if (kind === "holy") {
    p.meta.name = name || "Sanctum";
    p.skills = [
      { id: "divine_light", name: "ディバインライト", description: "自分と周囲の味方を大きく回復", cooldown: 10, manaCost: 35,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
        actions: [a("sound", { sound: "BLOCK_BEACON_ACTIVATE" }), a("particles", { target: "SELF", particle: "TOTEM_OF_UNDYING", count: 30 }), a("heal", { target: "SELF", amount: 8 }), a("effect", { target: "SELF", effect: "REGENERATION", seconds: 8, amplifier: 1 })] },
      { id: "aegis", name: "イージス", description: "一定時間被ダメージを軽減する聖なる結界", cooldown: 20, manaCost: 45,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
        actions: [a("effect", { target: "SELF", effect: "RESISTANCE", seconds: 12, amplifier: 2 }), a("effect", { target: "SELF", effect: "ABSORPTION", seconds: 12, amplifier: 2 }), a("particles", { target: "SELF", particle: "END_ROD", count: 24 })] },
      { id: "smite", name: "スマイト", description: "視線の敵に聖なる雷を落とす", cooldown: 15, manaCost: 40,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [{ uid: uid(), type: "HAS_TARGET", value: "" }],
        actions: [a("lightning", { target: "TARGET" }), a("damage", { target: "TARGET", amount: 10 }), a("sound", { sound: "ENTITY_LIGHTNING_BOLT_THUNDER" })] },
      { id: "guardian_angel", name: "守護天使", description: "ピンチになると自動で回復する", cooldown: 5, manaCost: 20,
        trigger: { type: "TAKE_DAMAGE", intervalSec: 5, heldItem: "" }, conditions: [{ uid: uid(), type: "HEALTH_BELOW", value: "40" }],
        actions: [a("heal", { target: "SELF", amount: 6 }), a("particles", { target: "SELF", particle: "HEART", count: 12 }), a("message", { text: "守護天使があなたを救った", actionBar: true })] },
    ];
    p.config.slots = ["divine_light", "aegis", "smite", ""];
    p.items = [
      { ...newItem(id), id: "holy_relic", name: "聖遺物", texture: "minecraft:item/nether_star", maxCount: 1, rarity: "EPIC", glint: true, skillId: "divine_light", tooltip: "右クリックでディバインライト" },
      { ...newItem(id), id: "sanctum_plate", name: "聖堂の鎧", kind: "armor", armorSlot: "CHESTPLATE", armorMaterial: "DIAMOND", durability: 528, texture: "minecraft:item/diamond_chestplate", maxCount: 1, rarity: "RARE", tooltip: "祝福された鎧" },
      { ...newItem(id), id: "blessed_ingot", name: "祝福のインゴット", texture: "minecraft:item/gold_ingot", maxCount: 64, rarity: "UNCOMMON" },
    ];
    p.blocks = [{ ...newBlock(), id: "altar_block", name: "祭壇ブロック", texture: "minecraft:block/quartz_block", hardness: 2, resistance: 9, luminance: 12, sound: "STONE", skillId: "divine_light" }];
    p.recipes = [{ id: "holy_relic", type: "shapeless", grid: ["minecraft:nether_star", "minecraft:gold_ingot", `${id}:blessed_ingot`], resultItem: `${id}:holy_relic`, resultCount: 1 }];
    return p;
  }

  p.meta.name = name || "Shadow Craft";
  p.skills = [
    { id: "shunpo", name: "瞬歩", description: "前方へ高速で移動し、短時間高速化", cooldown: 3, manaCost: 12,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("blink", { distance: 10 }), a("effect", { target: "SELF", effect: "SPEED", seconds: 4, amplifier: 2 }), a("particles", { target: "SELF", particle: "CLOUD", count: 10 }), a("sound", { sound: "ENTITY_ENDERMAN_TELEPORT", pitch: 1.6 })] },
    { id: "shuriken", name: "手裏剣", description: "視線の敵へ素早く3連撃", cooldown: 6, manaCost: 18,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [{ uid: uid(), type: "HAS_TARGET", value: "" }],
      actions: [a("sound", { sound: "ENTITY_PLAYER_ATTACK_SWEEP" }), a("repeat", { times: 3, interval: 5 }, [a("damage", { target: "TARGET", amount: 3 }), a("particles", { target: "TARGET", particle: "CRIT", count: 8 })])] },
    { id: "shadow_veil", name: "影纏い", description: "夜間・暗所で透明化と発光無効", cooldown: 25, manaCost: 50,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("effect", { target: "SELF", effect: "INVISIBILITY", seconds: 15, amplifier: 0 }), a("effect", { target: "SELF", effect: "NIGHT_VISION", seconds: 15, amplifier: 0 }), a("particles", { target: "SELF", particle: "SMOKE", count: 30 })] },
    { id: "assassinate", name: "暗殺", description: "背後から敵を倒すと体力を回復", cooldown: 0, manaCost: 0,
      trigger: { type: "KILL_ENTITY", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("heal", { target: "SELF", amount: 6 }), a("restoreMana", { amount: 15 }), a("particles", { target: "SELF", particle: "SWEEP_ATTACK", count: 5 })] },
  ];
  p.config.slots = ["shunpo", "shuriken", "shadow_veil", ""];
  p.items = [
    { ...newItem(id), id: "shadow_kunai", name: "影の苦無", kind: "sword", material: "IRON", attackDamage: 3, attackSpeed: -1.6, durability: 250, texture: "minecraft:item/iron_sword", model: "handheld", maxCount: 1, rarity: "RARE", tooltip: "素早く連続攻撃できる" },
    { ...newItem(id), id: "ninja_hood", name: "忍びの頭巾", kind: "armor", armorSlot: "HELMET", armorMaterial: "LEATHER", durability: 220, texture: "minecraft:item/leather_helmet", maxCount: 1, rarity: "UNCOMMON" },
    { ...newItem(id), id: "smoke_bomb", name: "煙玉", texture: "minecraft:item/fire_charge", maxCount: 16, skillId: "shadow_veil", tooltip: "右クリックで影纏い" },
  ];
  p.blocks = [{ ...newBlock(), id: "shadow_pad", name: "影の踏板", texture: "minecraft:block/black_wool", hardness: 0.8, resistance: 2, sound: "WOOL" }];
  p.recipes = [{ id: "smoke_bomb", type: "shapeless", grid: ["minecraft:coal", "minecraft:gunpowder", "minecraft:paper"], resultItem: `${id}:smoke_bomb`, resultCount: 3 }];
  return p;
}

export function newOre(): OreDef {
  return {
    dropItem: "", dropMin: 1, dropMax: 1, fortune: true, silkTouch: true, explosionDecay: true,
    xpMin: 0, xpMax: 0, dimension: "OVERWORLD", veinSize: 8, veinsPerChunk: 8, minY: -64, maxY: 64, biomeTag: "",
  };
}

/** 保存済みの古いプロジェクトに新フィールドを補完する */
export function normalizeProject(raw: Partial<ModProject>): ModProject {
  const normRecipe = (r: any): RecipeDef => ({ ...newRecipe(), ...r });
  const base = emptyProject();
  const items = (raw.items ?? []).map((it) => ({ ...newItem(raw.meta?.modId ?? base.meta.modId), bonusMaxHealth: 0, bonusMovementSpeed: 0, bonusArmor: 0, bonusToughness: 0, bonusKnockbackResistance: 0, ...it }));
  const blocks = (raw.blocks ?? []).map((b) => ({ ...newBlock(), ...b, ore: b.ore ? { ...newOre(), ...b.ore } : null, surface: b.surface ?? null }));
  const slots = [...(raw.config?.slots ?? []), "", "", "", ""].slice(0, 4);
  const keys = [...(raw.config?.slotKeys ?? []), ...base.config.slotKeys].slice(0, 4);
  const out = {
    ...base,
    ...raw,
    meta: { ...base.meta, ...raw.meta },
    mana: { ...base.mana, ...raw.mana },
    items,
    blocks,
    skills: (raw.skills ?? []).map((s) => ({ ...s, trigger: { ...newSkill().trigger, ...s.trigger }, conditions: s.conditions ?? [], actions: s.actions ?? [] })),
    recipes: (raw.recipes ?? []).map(normRecipe),
    mobs: (raw.mobs ?? []).map((m) => ({ ...newMob(), ...m, drops: m.drops ?? [] })),
    drops: (raw.drops ?? []).map((d) => ({ ...newDropRule(), ...d, items: d.items ?? [] })),
    materials: (raw.materials ?? []).map((m) => ({ ...newMaterial(), ...m })),
    effects: (raw.effects ?? []).map((e) => ({ ...newEffect(), ...e })),
    advancements: (raw.advancements ?? []).map((a) => ({ ...newAdvancement(), ...a })),
    shops: (raw.shops ?? []).map((s) => ({ ...newShop(), ...s, trades: (s.trades ?? []).map((t) => ({ ...newTrade(), ...t })) })),
    skillPoints: (raw.skillPoints ?? []).map((s) => ({ ...newSkillPoint(), ...s })),
    customImports: raw.customImports ?? "",
    config: { ...base.config, ...raw.config, slots, slotKeys: keys },
  } as ModProject;
  // 旧バージョンで保存された未使用フィールドを破棄
  delete (out as unknown as Record<string, unknown>).statusEffects;
  delete (out as unknown as Record<string, unknown>).guilds;
  return out;
}

export function newMob(): MobDef {
  return { id: "new_mob", name: "新しいモブ", baseMob: "ZOMBIE", maxHealth: 30, movementSpeed: 0.3, attackDamage: 5, drops: [], behavior: "hostile" };
}

export function newDropRule(): DropRule {
  return { id: "new_drop", name: "新しいドロップ表", targetMob: "ANY", items: [] };
}

export function newEffect(): CustomEffectDef {
  return { id: "second_wind", name: "セカンドウィンド", color: "#ffb347", category: "BENEFICIAL", tickSkillId: "", intervalTicks: 40, revive: true, reviveHealth: 8, reviveSkillId: "" };
}

export function newAdvancement(): AdvancementDef {
  return { id: "new_advancement", name: "新しい実績", description: "条件を達成しよう", icon: "minecraft:nether_star", frame: "task", parent: "", kind: "MANUAL", item: "", mob: "", steps: 1, rewardXp: 0, hidden: false };
}

export function newMaterial(): MaterialDef {
  return { id: "new_material", name: "新しい素材", baseMaterial: "IRON", damageMultiplier: 1.2, speedMultiplier: 1.1, durabilityMultiplier: 1.3, description: "" };
}

export function newTrade(): ShopTrade {
  return { id: `t${Math.floor(Math.random() * 9000 + 1000)}`, offerItem: "minecraft:golden_apple", offerCount: 1, requiredItem1: "minecraft:emerald", requiredCount1: 3, requiredItem2: "", requiredCount2: 0 };
}

export function newShop(): ShopDef {
  return { id: "new_shop", name: "新しいショップ", trades: [newTrade()], openedByBlockId: "" };
}

export function newSkillPoint(): SkillPointDef {
  return { id: "new_upgrade", name: "新しい強化", description: "", cost: 1, effect: "INCREASE_MAX_HEALTH", amount: 2 };
}

export const SKILL_POINT_EFFECTS: { value: SkillPointDef["effect"]; label: string; hint: string }[] = [
  { value: "INCREASE_MAX_HEALTH", label: "最大HP", hint: "+2 = ハート1個" },
  { value: "INCREASE_MAX_MANA", label: "最大マナ", hint: "+10 など" },
  { value: "INCREASE_DAMAGE", label: "攻撃力", hint: "+0.5 など" },
  { value: "INCREASE_DEFENSE", label: "防御力(アーマー)", hint: "+1 = 防具1ポイント" },
  { value: "INCREASE_SPEED", label: "移動速度", hint: "標準0.1。+0.004で約4%" },
  { value: "INCREASE_LUCK", label: "幸運", hint: "+0.5 など" },
];
