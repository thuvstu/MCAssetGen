import type { Action, Condition, ParamValue } from "../model";
import { EFFECTS, ENTITY_TYPES, PARTICLES, PLACE_BLOCKS, SOUNDS } from "./constants";

export const uid = (): string => Math.random().toString(36).slice(2, 10);

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
