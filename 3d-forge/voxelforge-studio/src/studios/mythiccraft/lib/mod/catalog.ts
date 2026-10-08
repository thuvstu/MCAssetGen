import type { Params, ParamValue } from "./types";

export type ParamType = "number" | "int" | "string" | "boolean" | "select" | "code" | "skill" | "mob";

export interface ParamDef {
  key: string;
  aliases?: string[];
  label: string;
  type: ParamType;
  default: ParamValue;
  options?: { value: string; label: string }[];
  help?: string;
}

export interface GenCtx {
  imports: Set<string>;
  skillFn: (name: string) => string | undefined;
}

export interface MechanicDef {
  id: string;
  aliases: string[];
  label: string;
  category: "ダメージ/回復" | "エフェクト" | "移動" | "召喚/ワールド" | "演出" | "ユーティリティ" | "変数" | "制御";
  description: string;
  params: ParamDef[];
  entityOnly?: boolean;
  noTargeter?: boolean;
  gen: (p: Params, g: GenCtx) => string; // statement(s) using `ctx` and `t` (SkillTarget)
}

export interface TargeterDef {
  id: string;
  aliases: string[];
  label: string;
  description: string;
  returnsEntities: boolean;
  params: ParamDef[];
  gen: (p: Params) => string; // expression: List<SkillTarget>
}

export interface ConditionDef {
  id: string;
  aliases: string[];
  label: string;
  description: string;
  params: ParamDef[];
  gen: (p: Params, entityExpr: string, g: GenCtx) => string; // boolean expression
}

// ---------- helpers ----------
export function kStr(v: ParamValue): string {
  const s = String(v ?? "");
  return (
    '"' +
    s
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\$/g, "\\$")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "")
      .replace(/\t/g, "\\t") +
    '"'
  );
}
export function num(v: ParamValue, d = 0): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : d;
}
export function kFloat(v: ParamValue): string {
  const n = num(v);
  const s = Number.isInteger(n) ? n.toFixed(1) : String(n);
  return s + "f";
}
export function kDouble(v: ParamValue): string {
  const n = num(v);
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
}
export function kInt(v: ParamValue): string {
  return String(Math.trunc(num(v)));
}
export function kBool(v: ParamValue): string {
  return v === true || v === "true" || v === 1 || v === "1" ? "true" : "false";
}
export function getParam(defs: ParamDef[], p: Params, key: string): ParamValue {
  const def = defs.find((d) => d.key === key);
  if (key in p) return p[key];
  if (def?.aliases) for (const a of def.aliases) if (a in p) return p[a];
  return def ? def.default : "";
}

export const STATUS_EFFECTS = [
  "SPEED", "SLOWNESS", "HASTE", "MINING_FATIGUE", "STRENGTH", "INSTANT_HEALTH", "INSTANT_DAMAGE",
  "JUMP_BOOST", "NAUSEA", "REGENERATION", "RESISTANCE", "FIRE_RESISTANCE", "WATER_BREATHING",
  "INVISIBILITY", "BLINDNESS", "NIGHT_VISION", "HUNGER", "WEAKNESS", "POISON", "WITHER",
  "HEALTH_BOOST", "ABSORPTION", "SATURATION", "GLOWING", "LEVITATION", "LUCK", "UNLUCK",
  "SLOW_FALLING", "CONDUIT_POWER", "DOLPHINS_GRACE", "DARKNESS",
];
export const PARTICLES = [
  "FLAME", "SOUL_FIRE_FLAME", "SMOKE", "LARGE_SMOKE", "HEART", "CRIT", "ENCHANTED_HIT", "END_ROD",
  "PORTAL", "EXPLOSION", "CLOUD", "HAPPY_VILLAGER", "ANGRY_VILLAGER", "WITCH", "ENCHANT", "LAVA",
  "SNOWFLAKE", "TOTEM_OF_UNDYING", "SONIC_BOOM", "ELECTRIC_SPARK", "SOUL", "GLOW", "NOTE", "DRAGON_BREATH",
];
export const SOUNDS = [
  "entity.blaze.shoot", "entity.generic.explode", "entity.lightning_bolt.thunder", "entity.player.levelup",
  "entity.experience_orb.pickup", "entity.ender_dragon.growl", "entity.wither.shoot", "entity.enderman.teleport",
  "block.anvil.land", "block.note_block.pling", "block.beacon.activate", "entity.evoker.cast_spell",
  "entity.illusioner.cast_spell", "item.totem.use", "entity.firework_rocket.launch", "entity.warden.sonic_boom",
];
const opts = (arr: string[]) => arr.map((v) => ({ value: v, label: v }));

const P = {
  amount: (d = 5): ParamDef => ({ key: "amount", aliases: ["a"], label: "量", type: "number", default: d }),
};

const SCOPE: ParamDef = { key: "scope", aliases: ["sc"], label: "スコープ", type: "select", default: "caster", options: opts(["caster", "target", "global"]) };
function varOwner(p: Params): string {
  const sc = String(p.scope ?? p.sc ?? "caster");
  return sc === "global" ? "null" : sc === "target" ? "t.entity" : "ctx.caster";
}

// ---------- Mechanics ----------
export const MECHANICS: MechanicDef[] = [
  {
    id: "damage", aliases: ["d"], label: "ダメージ", category: "ダメージ/回復", entityOnly: true,
    description: "ターゲットにダメージを与える",
    params: [P.amount(5), { key: "magic", aliases: ["ia", "ignoreArmor"], label: "防具無視(魔法)", type: "boolean", default: false }],
    gen: (p) => `Mechanics.damage(ctx, t, ${kFloat(getParam(MECHANICS[0].params, p, "amount"))}, ${kBool(getParam(MECHANICS[0].params, p, "magic"))})`,
  },
  {
    id: "heal", aliases: ["h"], label: "回復", category: "ダメージ/回復", entityOnly: true,
    description: "ターゲットのHPを回復",
    params: [P.amount(4)],
    gen: (p) => `Mechanics.heal(t, ${kFloat(p.amount ?? p.a ?? 4)})`,
  },
  {
    id: "ignite", aliases: ["fire"], label: "炎上", category: "ダメージ/回復", entityOnly: true,
    description: "ターゲットを燃やす",
    params: [{ key: "ticks", aliases: ["t"], label: "tick数", type: "int", default: 60 }],
    gen: (p) => `Mechanics.ignite(t, ${kInt(p.ticks ?? p.t ?? 60)})`,
  },
  {
    id: "extinguish", aliases: [], label: "消火", category: "ダメージ/回復", entityOnly: true,
    description: "炎上を消す", params: [],
    gen: () => `Mechanics.extinguish(t)`,
  },
  {
    id: "potion", aliases: ["effect"], label: "ポーション効果", category: "エフェクト", entityOnly: true,
    description: "ステータス効果を付与",
    params: [
      { key: "type", aliases: ["t"], label: "効果", type: "select", default: "SPEED", options: opts(STATUS_EFFECTS) },
      { key: "duration", aliases: ["d"], label: "時間(tick)", type: "int", default: 200 },
      { key: "level", aliases: ["l"], label: "レベル(0=I)", type: "int", default: 0 },
      { key: "particles", aliases: ["p"], label: "パーティクル表示", type: "boolean", default: true },
    ],
    gen: (p, g) => {
      g.imports.add("net.minecraft.entity.effect.StatusEffects");
      const type = String(p.type ?? p.t ?? "SPEED").toUpperCase();
      return `Mechanics.potion(t, StatusEffects.${type}, ${kInt(p.duration ?? p.d ?? 200)}, ${kInt(p.level ?? p.l ?? 0)}, ${kBool(p.particles ?? p.p ?? true)})`;
    },
  },
  {
    id: "cleanse", aliases: ["clearEffects"], label: "効果解除", category: "エフェクト", entityOnly: true,
    description: "全てのステータス効果を解除", params: [],
    gen: () => `Mechanics.clearEffects(t)`,
  },
  {
    id: "freeze", aliases: [], label: "凍結", category: "エフェクト", entityOnly: true,
    description: "粉雪の凍結状態にする",
    params: [{ key: "ticks", aliases: ["t"], label: "tick数", type: "int", default: 140 }],
    gen: (p) => `Mechanics.freeze(t, ${kInt(p.ticks ?? p.t ?? 140)})`,
  },
  {
    id: "velocity", aliases: ["launch"], label: "速度加算", category: "移動", entityOnly: true,
    description: "ターゲットに速度ベクトルを加える",
    params: [
      { key: "x", label: "X", type: "number", default: 0 },
      { key: "y", label: "Y", type: "number", default: 1 },
      { key: "z", label: "Z", type: "number", default: 0 },
    ],
    gen: (p) => `Mechanics.velocity(t, ${kDouble(p.x ?? 0)}, ${kDouble(p.y ?? 1)}, ${kDouble(p.z ?? 0)})`,
  },
  {
    id: "leap", aliases: ["dash"], label: "跳躍/ダッシュ", category: "移動", entityOnly: true,
    description: "ターゲットの向いている方向へ飛ぶ",
    params: [
      { key: "forward", aliases: ["f"], label: "前方", type: "number", default: 1.2 },
      { key: "up", aliases: ["u"], label: "上方", type: "number", default: 0.5 },
    ],
    gen: (p) => `Mechanics.leap(t, ${kDouble(p.forward ?? p.f ?? 1.2)}, ${kDouble(p.up ?? p.u ?? 0.5)})`,
  },
  {
    id: "push", aliases: ["knockback", "throw"], label: "ノックバック", category: "移動", entityOnly: true,
    description: "キャスターから遠ざける",
    params: [
      { key: "strength", aliases: ["s", "v"], label: "強さ", type: "number", default: 1.2 },
      { key: "up", aliases: ["u", "vy"], label: "上方", type: "number", default: 0.4 },
    ],
    gen: (p) => `Mechanics.push(ctx, t, ${kDouble(p.strength ?? p.s ?? 1.2)}, ${kDouble(p.up ?? p.u ?? 0.4)})`,
  },
  {
    id: "pull", aliases: [], label: "引き寄せ", category: "移動", entityOnly: true,
    description: "キャスターへ引き寄せる",
    params: [{ key: "strength", aliases: ["s", "v"], label: "強さ", type: "number", default: 1.0 }],
    gen: (p) => `Mechanics.push(ctx, t, -${kDouble(p.strength ?? p.s ?? 1)}, 0.2)`,
  },
  {
    id: "teleport", aliases: ["tp"], label: "テレポート", category: "移動",
    description: "キャスターをターゲット位置へ移動", params: [],
    gen: () => `Mechanics.teleport(ctx, t)`,
  },
  {
    id: "projectile", aliases: ["shoot"], label: "発射物", category: "召喚/ワールド",
    description: "キャスターからターゲットへ発射物を撃つ（@Selfなら視線方向）",
    params: [
      { key: "type", aliases: ["t"], label: "種類", type: "select", default: "fireball", options: opts(["arrow", "snowball", "fireball", "large_fireball", "wither_skull", "trident"]) },
      { key: "speed", aliases: ["v"], label: "速度", type: "number", default: 1.5 },
    ],
    gen: (p) => `Mechanics.projectile(ctx, t, ${kStr(p.type ?? p.t ?? "fireball")}, ${kFloat(p.speed ?? p.v ?? 1.5)})`,
  },
  {
    id: "summon", aliases: [], label: "召喚", category: "召喚/ワールド",
    description: "エンティティを召喚",
    params: [
      { key: "type", aliases: ["t", "mob"], label: "エンティティID", type: "string", default: "minecraft:zombie" },
      { key: "amount", aliases: ["a"], label: "数", type: "int", default: 1 },
    ],
    gen: (p) => `Mechanics.summon(ctx, t, ${kStr(p.type ?? p.t ?? "minecraft:zombie")}, ${kInt(p.amount ?? p.a ?? 1)})`,
  },
  {
    id: "lightning", aliases: [], label: "落雷", category: "召喚/ワールド",
    description: "雷を落とす",
    params: [{ key: "cosmetic", aliases: ["c"], label: "見た目のみ", type: "boolean", default: false }],
    gen: (p) => `Mechanics.lightning(ctx, t, ${kBool(p.cosmetic ?? p.c ?? false)})`,
  },
  {
    id: "explosion", aliases: ["explode"], label: "爆発", category: "召喚/ワールド",
    description: "爆発を起こす",
    params: [
      { key: "power", aliases: ["p", "yield"], label: "威力", type: "number", default: 2 },
      { key: "fire", aliases: ["f"], label: "火をつける", type: "boolean", default: false },
      { key: "breakBlocks", aliases: ["bb"], label: "ブロック破壊", type: "boolean", default: false },
    ],
    gen: (p) => `Mechanics.explosion(ctx, t, ${kFloat(p.power ?? p.p ?? 2)}, ${kBool(p.fire ?? p.f ?? false)}, ${kBool(p.breakBlocks ?? p.bb ?? false)})`,
  },
  {
    id: "setblock", aliases: ["block"], label: "ブロック設置", category: "召喚/ワールド",
    description: "ターゲット位置にブロックを置く",
    params: [{ key: "block", aliases: ["b"], label: "ブロックID", type: "string", default: "minecraft:cobweb" }],
    gen: (p) => `Mechanics.setBlock(ctx, t, ${kStr(p.block ?? p.b ?? "minecraft:cobweb")})`,
  },
  {
    id: "particles", aliases: ["effect:particles", "particle"], label: "パーティクル", category: "演出",
    description: "パーティクルを表示",
    params: [
      { key: "particle", aliases: ["p"], label: "種類", type: "select", default: "FLAME", options: opts(PARTICLES) },
      { key: "amount", aliases: ["a"], label: "数", type: "int", default: 20 },
      { key: "spread", aliases: ["hs"], label: "拡散", type: "number", default: 0.5 },
      { key: "speed", aliases: ["s"], label: "速度", type: "number", default: 0.05 },
      { key: "yOffset", aliases: ["y"], label: "Y補正", type: "number", default: 1 },
    ],
    gen: (p, g) => {
      g.imports.add("net.minecraft.particle.ParticleTypes");
      return `Mechanics.particles(ctx, t, ParticleTypes.${String(p.particle ?? p.p ?? "FLAME").toUpperCase()}, ${kInt(p.amount ?? p.a ?? 20)}, ${kDouble(p.spread ?? p.hs ?? 0.5)}, ${kDouble(p.speed ?? p.s ?? 0.05)}, ${kDouble(p.yOffset ?? p.y ?? 1)})`;
    },
  },
  {
    id: "sound", aliases: ["s"], label: "サウンド", category: "演出",
    description: "サウンドを再生（任意のサウンドIDが使用可能）",
    params: [
      { key: "sound", aliases: ["s"], label: "サウンドID", type: "string", default: "entity.blaze.shoot", options: opts(SOUNDS) },
      { key: "volume", aliases: ["v"], label: "音量", type: "number", default: 1 },
      { key: "pitch", aliases: ["p"], label: "ピッチ", type: "number", default: 1 },
    ],
    gen: (p) => `Mechanics.sound(ctx, t, ${kStr(p.sound ?? p.s ?? "entity.blaze.shoot")}, ${kFloat(p.volume ?? p.v ?? 1)}, ${kFloat(p.pitch ?? p.p ?? 1)})`,
  },
  {
    id: "message", aliases: ["msg"], label: "メッセージ", category: "演出", entityOnly: true,
    description: "チャットメッセージ（<caster.name> <target.name> 使用可）",
    params: [{ key: "text", aliases: ["m", "msg"], label: "テキスト", type: "string", default: "Hello <caster.name>!" }],
    gen: (p) => `Mechanics.message(ctx, t, ${kStr(p.text ?? p.m ?? "")}, false)`,
  },
  {
    id: "actionbar", aliases: [], label: "アクションバー", category: "演出", entityOnly: true,
    description: "アクションバーにテキスト表示",
    params: [{ key: "text", aliases: ["m"], label: "テキスト", type: "string", default: "Skill!" }],
    gen: (p) => `Mechanics.message(ctx, t, ${kStr(p.text ?? p.m ?? "")}, true)`,
  },
  {
    id: "title", aliases: [], label: "タイトル", category: "演出", entityOnly: true,
    description: "画面中央にタイトル表示",
    params: [
      { key: "title", aliases: ["t"], label: "タイトル", type: "string", default: "BOSS" },
      { key: "subtitle", aliases: ["st"], label: "サブタイトル", type: "string", default: "" },
    ],
    gen: (p) => `Mechanics.title(ctx, t, ${kStr(p.title ?? p.t ?? "")}, ${kStr(p.subtitle ?? p.st ?? "")})`,
  },
  {
    id: "giveitem", aliases: ["give"], label: "アイテム付与", category: "ユーティリティ", entityOnly: true,
    description: "プレイヤーにアイテムを与える（MODアイテムも可: modid:name）",
    params: [
      { key: "item", aliases: ["i"], label: "アイテムID", type: "string", default: "minecraft:diamond" },
      { key: "amount", aliases: ["a"], label: "数", type: "int", default: 1 },
    ],
    gen: (p) => `Mechanics.giveItem(t, ${kStr(p.item ?? p.i ?? "minecraft:diamond")}, ${kInt(p.amount ?? p.a ?? 1)})`,
  },
  {
    id: "feed", aliases: [], label: "満腹度回復", category: "ユーティリティ", entityOnly: true,
    description: "プレイヤーの満腹度を回復",
    params: [
      { key: "food", aliases: ["f"], label: "満腹度", type: "int", default: 4 },
      { key: "saturation", aliases: ["s"], label: "隠し満腹度", type: "number", default: 2 },
    ],
    gen: (p) => `Mechanics.feed(t, ${kInt(p.food ?? p.f ?? 4)}, ${kFloat(p.saturation ?? p.s ?? 2)})`,
  },
  {
    id: "xp", aliases: ["experience"], label: "経験値", category: "ユーティリティ", entityOnly: true,
    description: "経験値を与える",
    params: [P.amount(10)],
    gen: (p) => `Mechanics.addXp(t, ${kInt(p.amount ?? p.a ?? 10)})`,
  },
  {
    id: "command", aliases: ["cmd"], label: "コマンド実行", category: "ユーティリティ",
    description: "コマンドを実行（先頭の/不要）",
    params: [
      { key: "cmd", aliases: ["c"], label: "コマンド", type: "string", default: "say <caster.name> used a skill" },
      { key: "asConsole", aliases: ["console"], label: "サーバー権限で実行", type: "boolean", default: true },
    ],
    gen: (p) => `Mechanics.command(ctx, t, ${kStr(p.cmd ?? p.c ?? "")}, ${kBool(p.asConsole ?? p.console ?? true)})`,
  },
  {
    id: "summonmob", aliases: ["mythicmob", "spawnmob"], label: "カスタムモブ召喚", category: "召喚/ワールド",
    description: "このModで定義したカスタムモブを召喚",
    params: [
      { key: "mob", aliases: ["m", "type"], label: "カスタムモブ", type: "mob", default: "" },
      { key: "amount", aliases: ["a"], label: "数", type: "int", default: 1 },
    ],
    gen: (p) => `repeat(${kInt(p.amount ?? p.a ?? 1)}) { CustomMobs.spawn(${kStr(p.mob ?? p.m ?? "")}, ctx.world, t.pos) }`,
  },
  {
    id: "beam", aliases: ["line", "effect:particleline"], label: "ビーム", category: "演出",
    description: "キャスターからターゲットへパーティクルの線を描く",
    params: [
      { key: "particle", aliases: ["p"], label: "種類", type: "select", default: "END_ROD", options: opts(PARTICLES) },
      { key: "density", aliases: ["d"], label: "密度(1ブロック当たり)", type: "number", default: 4 },
    ],
    gen: (p, g) => {
      g.imports.add("net.minecraft.particle.ParticleTypes");
      return `Mechanics.beam(ctx, t, ParticleTypes.${String(p.particle ?? p.p ?? "END_ROD").toUpperCase()}, ${kDouble(p.density ?? p.d ?? 4)})`;
    },
  },
  {
    id: "dropitem", aliases: ["drop"], label: "アイテムドロップ", category: "召喚/ワールド",
    description: "ターゲット位置にアイテムを落とす",
    params: [
      { key: "item", aliases: ["i"], label: "アイテムID", type: "string", default: "minecraft:emerald" },
      { key: "amount", aliases: ["a"], label: "数", type: "int", default: 1 },
    ],
    gen: (p) => `Mechanics.dropItem(ctx, t, ${kStr(p.item ?? p.i ?? "minecraft:emerald")}, ${kInt(p.amount ?? p.a ?? 1)})`,
  },
  {
    id: "remove", aliases: ["despawn"], label: "消去", category: "ユーティリティ", entityOnly: true,
    description: "ターゲットをワールドから消す（プレイヤーには無効）", params: [],
    gen: () => `Mechanics.remove(t)`,
  },
  {
    id: "sethealth", aliases: ["sethp"], label: "HP設定", category: "ダメージ/回復", entityOnly: true,
    description: "HPを最大HPの割合で設定",
    params: [{ key: "percent", aliases: ["p"], label: "割合%", type: "number", default: 100 }],
    gen: (p) => `Mechanics.setHealthPercent(t, ${kFloat(p.percent ?? p.p ?? 100)})`,
  },
  {
    id: "missile", aliases: ["projectile2", "orb"], label: "ミサイル(弾道スキル)", category: "召喚/ワールド",
    description: "パーティクルの弾を飛ばし、命中した敵/位置を起点に onHit スキルを実行（MythicMobs の projectile 相当）",
    params: [
      { key: "onHit", aliases: ["oh"], label: "命中時スキル", type: "skill", default: "" },
      { key: "speed", aliases: ["v"], label: "速度(ブロック/tick)", type: "number", default: 1.2 },
      { key: "ticks", aliases: ["mr", "maxTicks"], label: "最大飛行tick", type: "int", default: 40 },
      { key: "radius", aliases: ["hr"], label: "当たり判定半径", type: "number", default: 0.8 },
      { key: "gravity", aliases: ["g"], label: "重力", type: "number", default: 0 },
      { key: "particle", aliases: ["p"], label: "軌跡パーティクル", type: "select", default: "FLAME", options: opts(PARTICLES) },
      { key: "hitBlocks", aliases: ["hb"], label: "ブロックで止まる", type: "boolean", default: true },
    ],
    gen: (p, g) => {
      g.imports.add("net.minecraft.particle.ParticleTypes");
      const fn = g.skillFn(String(p.onHit ?? p.oh ?? ""));
      const cb = fn ? `{ hit -> Skills.${fn}(hit) }` : `{ _ -> }`;
      return `Mechanics.missile(ctx, t, ${kDouble(p.speed ?? p.v ?? 1.2)}, ${kInt(p.ticks ?? p.mr ?? 40)}, ${kDouble(p.radius ?? p.hr ?? 0.8)}, ${kDouble(p.gravity ?? p.g ?? 0)}, ParticleTypes.${String(p.particle ?? p.p ?? "FLAME").toUpperCase()}, ${kBool(p.hitBlocks ?? p.hb ?? true)}) ${cb}`;
    },
  },
  {
    id: "setvar", aliases: ["variableset", "setvariable"], label: "変数を設定", category: "変数",
    description: "数値変数を設定（ワールド保存され再起動後も保持）。テキストで <var.名前> / <global.名前> 使用可",
    params: [
      { key: "var", aliases: ["name", "n"], label: "変数名", type: "string", default: "mana" },
      { key: "value", aliases: ["v"], label: "値", type: "number", default: 0 },
      SCOPE,
    ],
    gen: (p) => `Variables.set(ctx, ${varOwner(p)}, ${kStr(p.var ?? p.name ?? "mana")}, ${kDouble(p.value ?? p.v ?? 0)})`,
  },
  {
    id: "addvar", aliases: ["variableadd", "modifyvar"], label: "変数を加算", category: "変数",
    description: "数値変数に加算（負数で減算）。min/max でクランプ",
    params: [
      { key: "var", aliases: ["name", "n"], label: "変数名", type: "string", default: "mana" },
      { key: "amount", aliases: ["a", "v"], label: "加算値", type: "number", default: 1 },
      { key: "min", label: "最小", type: "number", default: -1000000 },
      { key: "max", label: "最大", type: "number", default: 1000000 },
      SCOPE,
    ],
    gen: (p) => `Variables.add(ctx, ${varOwner(p)}, ${kStr(p.var ?? p.name ?? "mana")}, ${kDouble(p.amount ?? p.a ?? 1)}, ${kDouble(p.min ?? -1000000)}, ${kDouble(p.max ?? 1000000)})`,
  },
  {
    id: "delay", aliases: ["wait"], label: "遅延", category: "制御", noTargeter: true,
    description: "以降の行を指定tick後に実行",
    params: [{ key: "ticks", aliases: ["t"], label: "tick数", type: "int", default: 20 }],
    gen: () => "",
  },
  {
    id: "skill", aliases: ["metaskill", "castskill"], label: "スキル呼び出し", category: "制御",
    description: "別スキルを各ターゲットを起点に実行",
    params: [{ key: "s", aliases: ["skill"], label: "スキル", type: "skill", default: "" }],
    gen: (p, g) => {
      const fn = g.skillFn(String(p.s ?? p.skill ?? ""));
      if (!fn) return `// 未定義スキル: ${String(p.s ?? p.skill ?? "")}`;
      return `Skills.${fn}(ctx.copy(target = t.entity ?: ctx.target, origin = t.pos))`;
    },
  },
  {
    id: "repeat", aliases: ["loop"], label: "繰り返し", category: "制御",
    description: "別スキルを一定間隔で繰り返し実行",
    params: [
      { key: "s", aliases: ["skill"], label: "スキル", type: "skill", default: "" },
      { key: "times", aliases: ["r", "repeat"], label: "回数", type: "int", default: 5 },
      { key: "interval", aliases: ["i"], label: "間隔(tick)", type: "int", default: 10 },
    ],
    gen: (p, g) => {
      const fn = g.skillFn(String(p.s ?? p.skill ?? ""));
      if (!fn) return `// 未定義スキル: ${String(p.s ?? p.skill ?? "")}`;
      return `Mechanics.repeatSkill(${kInt(p.times ?? p.r ?? 5)}, ${kInt(p.interval ?? p.i ?? 10)}) { _ -> Skills.${fn}(ctx.copy(target = t.entity ?: ctx.target, origin = t.pos)) }`;
    },
  },
  {
    id: "kotlin", aliases: ["code", "custom"], label: "カスタムKotlin", category: "制御",
    description: "任意のKotlinコード。変数 ctx (SkillContext), t (SkillTarget), e (Entity?) が使えます",
    params: [{ key: "code", aliases: [], label: "Kotlinコード", type: "code", default: "e?.let { it.addVelocity(0.0, 0.5, 0.0); it.velocityModified = true }" }],
    gen: (p) => String(p.code ?? ""),
  },
];

// ---------- Targeters ----------
export const TARGETERS: TargeterDef[] = [
  { id: "Self", aliases: ["caster", "s"], label: "自分", description: "スキルの使用者", returnsEntities: true, params: [], gen: () => "Targeters.self(ctx)" },
  { id: "Target", aliases: ["t", "trigger"], label: "ターゲット", description: "トリガーの対象（攻撃相手など）", returnsEntities: true, params: [], gen: () => "Targeters.target(ctx)" },
  {
    id: "LookEntity", aliases: ["looktarget", "lt"], label: "視線先のエンティティ", description: "視線の先にいるエンティティ", returnsEntities: true,
    params: [{ key: "range", aliases: ["r"], label: "距離", type: "number", default: 20 }],
    gen: (p) => `Targeters.lookEntity(ctx, ${kDouble(p.range ?? p.r ?? 20)})`,
  },
  {
    id: "EntitiesInRadius", aliases: ["eir", "mir"], label: "範囲内の生物", description: "起点から半径内の生物（自分除く）", returnsEntities: true,
    params: [{ key: "r", aliases: ["radius"], label: "半径", type: "number", default: 5 }],
    gen: (p) => `Targeters.entitiesInRadius(ctx, ${kDouble(p.r ?? p.radius ?? 5)}, false)`,
  },
  {
    id: "PlayersInRadius", aliases: ["pir"], label: "範囲内のプレイヤー", description: "起点から半径内のプレイヤー（自分含む）", returnsEntities: true,
    params: [{ key: "r", aliases: ["radius"], label: "半径", type: "number", default: 10 }],
    gen: (p) => `Targeters.entitiesInRadius(ctx, ${kDouble(p.r ?? p.radius ?? 10)}, true)`,
  },
  {
    id: "NearestPlayer", aliases: ["np", "nearestplayer"], label: "最寄りのプレイヤー", description: "起点から最も近いプレイヤー（自分除く）", returnsEntities: true,
    params: [{ key: "r", aliases: ["radius"], label: "半径", type: "number", default: 32 }],
    gen: (p) => `Targeters.nearestPlayer(ctx, ${kDouble(p.r ?? p.radius ?? 32)})`,
  },
  { id: "Origin", aliases: ["o"], label: "起点の位置", description: "スキル起点（ブロック位置など）", returnsEntities: false, params: [], gen: () => "Targeters.origin(ctx)" },
  { id: "SelfLocation", aliases: ["casterlocation", "sl"], label: "自分の位置", description: "使用者の足元", returnsEntities: false, params: [], gen: () => "Targeters.selfLocation(ctx)" },
  { id: "TargetLocation", aliases: ["tl"], label: "ターゲットの位置", description: "ターゲットの足元", returnsEntities: false, params: [], gen: () => "Targeters.targetLocation(ctx)" },
  {
    id: "LookBlock", aliases: ["targetblock", "lb"], label: "視線先のブロック", description: "視線の先のブロック位置", returnsEntities: false,
    params: [{ key: "range", aliases: ["r"], label: "距離", type: "number", default: 30 }],
    gen: (p) => `Targeters.lookBlock(ctx, ${kDouble(p.range ?? p.r ?? 30)})`,
  },
  {
    id: "Forward", aliases: ["f"], label: "前方の位置", description: "使用者の前方 N ブロック", returnsEntities: false,
    params: [{ key: "distance", aliases: ["d"], label: "距離", type: "number", default: 5 }],
    gen: (p) => `Targeters.forward(ctx, ${kDouble(p.distance ?? p.d ?? 5)})`,
  },
  {
    id: "Ring", aliases: ["circle"], label: "円周上の位置", description: "起点を中心とした円周上の点", returnsEntities: false,
    params: [
      { key: "r", aliases: ["radius"], label: "半径", type: "number", default: 3 },
      { key: "points", aliases: ["p"], label: "点の数", type: "int", default: 12 },
    ],
    gen: (p) => `Targeters.ring(ctx, ${kDouble(p.r ?? p.radius ?? 3)}, ${kInt(p.points ?? p.p ?? 12)})`,
  },
];

// ---------- Conditions ----------
export const CONDITIONS: ConditionDef[] = [
  {
    id: "health", aliases: ["hp"], label: "HP割合", description: "HPが指定%の範囲内",
    params: [
      { key: "min", label: "最小%", type: "number", default: 0 },
      { key: "max", label: "最大%", type: "number", default: 50 },
    ],
    gen: (p, e) => `Conditions.healthPercent(${e}, ${kDouble(p.min ?? 0)}, ${kDouble(p.max ?? 50)})`,
  },
  { id: "sneaking", aliases: ["crouching"], label: "スニーク中", description: "スニークしている", params: [], gen: (_p, e) => `Conditions.sneaking(${e})` },
  { id: "sprinting", aliases: [], label: "ダッシュ中", description: "ダッシュしている", params: [], gen: (_p, e) => `Conditions.sprinting(${e})` },
  { id: "onGround", aliases: ["grounded"], label: "地上", description: "地面に立っている", params: [], gen: (_p, e) => `Conditions.onGround(${e})` },
  { id: "inWater", aliases: ["water"], label: "水中", description: "水に触れている", params: [], gen: (_p, e) => `Conditions.inWater(${e})` },
  { id: "burning", aliases: ["onfire"], label: "炎上中", description: "燃えている", params: [], gen: (_p, e) => `Conditions.burning(${e})` },
  { id: "isPlayer", aliases: ["player"], label: "プレイヤー", description: "対象がプレイヤー", params: [], gen: (_p, e) => `Conditions.isPlayer(${e})` },
  { id: "isLiving", aliases: ["living"], label: "生物", description: "対象が生物", params: [], gen: (_p, e) => `Conditions.isLiving(${e})` },
  { id: "day", aliases: [], label: "昼", description: "ワールドが昼", params: [], gen: () => `Conditions.day(ctx)` },
  { id: "night", aliases: [], label: "夜", description: "ワールドが夜", params: [], gen: () => `Conditions.night(ctx)` },
  { id: "raining", aliases: ["rain"], label: "雨", description: "雨が降っている", params: [], gen: () => `Conditions.raining(ctx)` },
  {
    id: "chance", aliases: [], label: "確率", description: "指定確率で成功 (0.0〜1.0)",
    params: [{ key: "p", aliases: ["chance"], label: "確率", type: "number", default: 0.5 }],
    gen: (p) => `Conditions.chance(ctx, ${kDouble(p.p ?? p.chance ?? 0.5)})`,
  },
  {
    id: "holding", aliases: ["hand"], label: "手持ちアイテム", description: "メインハンドに指定アイテム",
    params: [{ key: "item", aliases: ["i"], label: "アイテムID", type: "string", default: "minecraft:diamond_sword" }],
    gen: (p, e) => `Conditions.holding(${e}, ${kStr(p.item ?? p.i ?? "")})`,
  },
  {
    id: "entityType", aliases: ["type", "mobtype"], label: "エンティティ種類", description: "対象のエンティティID",
    params: [{ key: "type", aliases: ["t"], label: "エンティティID", type: "string", default: "minecraft:zombie" }],
    gen: (p, e) => `Conditions.entityType(${e}, ${kStr(p.type ?? p.t ?? "")})`,
  },
  {
    id: "dimension", aliases: ["world"], label: "ディメンション", description: "指定ディメンション内",
    params: [{ key: "id", label: "ディメンションID", type: "select", default: "minecraft:overworld", options: opts(["minecraft:overworld", "minecraft:the_nether", "minecraft:the_end"]) }],
    gen: (p) => `Conditions.dimension(ctx, ${kStr(p.id ?? "minecraft:overworld")})`,
  },
  {
    id: "altitude", aliases: ["height", "y"], label: "高度", description: "Y座標が範囲内",
    params: [
      { key: "min", label: "最小Y", type: "number", default: -64 },
      { key: "max", label: "最大Y", type: "number", default: 320 },
    ],
    gen: (p, e) => `Conditions.altitude(${e}, ${kDouble(p.min ?? -64)}, ${kDouble(p.max ?? 320)})`,
  },
  {
    id: "mythicMob", aliases: ["custommob", "mobid"], label: "カスタムモブ", description: "対象が指定カスタムモブ",
    params: [{ key: "id", aliases: ["mob"], label: "カスタムモブ", type: "mob", default: "" }],
    gen: (p, e) => `CustomMobs.isMob(${e}, ${kStr(p.id ?? p.mob ?? "")})`,
  },
  {
    id: "variable", aliases: ["varinrange", "var"], label: "変数の範囲", description: "数値変数が min〜max の範囲内（scope=caster は判定対象自身）",
    params: [
      { key: "var", aliases: ["name", "n"], label: "変数名", type: "string", default: "mana" },
      { key: "min", label: "最小", type: "number", default: 10 },
      { key: "max", label: "最大", type: "number", default: 1000000 },
      { key: "scope", aliases: ["sc"], label: "スコープ", type: "select", default: "caster", options: opts(["caster", "global"]) },
    ],
    gen: (p, e) => `Variables.inRange(ctx, ${String(p.scope ?? "caster") === "global" ? "null" : e}, ${kStr(p.var ?? p.name ?? "mana")}, ${kDouble(p.min ?? 10)}, ${kDouble(p.max ?? 1000000)})`,
  },
  {
    id: "wearing", aliases: ["armor"], label: "防具を着用", description: "指定アイテムを防具スロットに着用",
    params: [{ key: "item", aliases: ["i"], label: "アイテムID", type: "string", default: "minecraft:diamond_helmet" }],
    gen: (p, e) => `Conditions.wearing(${e}, ${kStr(p.item ?? p.i ?? "")})`,
  },
  {
    id: "hasEffect", aliases: ["haspotion"], label: "効果を持つ", description: "指定ステータス効果を持つ",
    params: [{ key: "type", aliases: ["t"], label: "効果", type: "select", default: "SPEED", options: opts(STATUS_EFFECTS) }],
    gen: (p, e, g) => {
      g.imports.add("net.minecraft.entity.effect.StatusEffects");
      return `Conditions.hasEffect(${e}, StatusEffects.${String(p.type ?? p.t ?? "SPEED").toUpperCase()})`;
    },
  },
];

// ---------- Triggers ----------
export interface TriggerDef {
  id: string;
  label: string;
  description: string;
  needsInterval?: boolean;
}

export const ITEM_TRIGGERS: TriggerDef[] = [
  { id: "onUse", label: "~onUse 右クリック", description: "caster=使用者" },
  { id: "onAttack", label: "~onAttack 攻撃ヒット", description: "caster=攻撃者, target=被弾者" },
  { id: "onEat", label: "~onEat 食べ終わり", description: "食料アイテムのみ。caster=食べた生物" },
  { id: "onHeld", label: "~onTimer 所持中タイマー", description: "メインハンドに持っている間、一定間隔で発動", needsInterval: true },
  { id: "onWear", label: "~onWear 着用中タイマー", description: "防具として着用している間、一定間隔で発動（セットボーナス等）", needsInterval: true },
];
export const BLOCK_TRIGGERS: TriggerDef[] = [
  { id: "onInteract", label: "~onInteract 右クリック", description: "caster=プレイヤー, origin=ブロック中心" },
  { id: "onBreak", label: "~onBreak 破壊", description: "caster=プレイヤー, origin=ブロック中心" },
  { id: "onStep", label: "~onStep 踏む", description: "毎tick発火するためクールダウン推奨" },
  { id: "onPlace", label: "~onPlace 設置", description: "caster=設置者" },
];
export const MOB_TRIGGERS: TriggerDef[] = [
  { id: "onAttack", label: "~onAttack 攻撃時", description: "caster=モブ, target=被害者" },
  { id: "onDamaged", label: "~onDamaged 被ダメージ時", description: "caster=モブ, target=攻撃者" },
  { id: "onDeath", label: "~onDeath 死亡時", description: "caster=モブ, target=倒した者" },
  { id: "onTimer", label: "~onTimer タイマー", description: "caster=モブ, target=モブの攻撃対象", needsInterval: true },
];
export const CUSTOM_MOB_TRIGGERS: TriggerDef[] = [
  { id: "onSpawn", label: "~onSpawn 出現時", description: "caster=モブ" },
  ...MOB_TRIGGERS,
];
export const GLOBAL_TRIGGERS: TriggerDef[] = [
  { id: "onJoin", label: "~onJoin ログイン", description: "caster=プレイヤー" },
  { id: "onTimer", label: "~onTimer タイマー", description: "全プレイヤーに一定間隔で", needsInterval: true },
  { id: "onKill", label: "~onKill キル", description: "caster=プレイヤー, target=倒した相手" },
  { id: "onDeath", label: "~onDeath 死亡", description: "caster=死亡プレイヤー, target=倒した者" },
  { id: "onDamaged", label: "~onDamaged 被ダメージ", description: "caster=プレイヤー, target=攻撃者" },
  { id: "onAttack", label: "~onAttack 攻撃", description: "caster=プレイヤー, target=被害者" },
];

// ---------- lookup ----------
function findBy<T extends { id: string; aliases: string[] }>(list: T[], name: string): T | undefined {
  const n = name.toLowerCase();
  return list.find((d) => d.id.toLowerCase() === n || d.aliases.some((a) => a.toLowerCase() === n));
}
export const findMechanic = (n: string) => findBy(MECHANICS, n);
export const findTargeter = (n: string) => findBy(TARGETERS, n.replace(/^@/, ""));
export const findCondition = (n: string) => findBy(CONDITIONS, n.replace(/^\?!?/, ""));

export function defaultParams(defs: ParamDef[]): Params {
  const p: Params = {};
  for (const d of defs) p[d.key] = d.default;
  return p;
}

/** Normalize params: map aliases to canonical keys. */
export function normalizeParams(defs: ParamDef[], p: Params): Params {
  const out: Params = {};
  for (const [k, v] of Object.entries(p)) {
    const def = defs.find((d) => d.key.toLowerCase() === k.toLowerCase() || d.aliases?.some((a) => a.toLowerCase() === k.toLowerCase()));
    out[def ? def.key : k] = v;
  }
  return out;
}
