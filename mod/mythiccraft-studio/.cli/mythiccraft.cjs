// src/mythiccraft.ts
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");

// ../mod/mythiccraft-studio/src/lib/mod/catalog.ts
function kStr(v) {
  const s = String(v ?? "");
  return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/\n/g, "\\n").replace(/\r/g, "").replace(/\t/g, "\\t") + '"';
}
function num(v, d2 = 0) {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : d2;
}
function kFloat(v) {
  const n = num(v);
  const s = Number.isInteger(n) ? n.toFixed(1) : String(n);
  return s + "f";
}
function kDouble(v) {
  const n = num(v);
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
}
function kInt(v) {
  return String(Math.trunc(num(v)));
}
function kBool(v) {
  return v === true || v === "true" || v === 1 || v === "1" ? "true" : "false";
}
function getParam(defs, p, key) {
  const def = defs.find((d2) => d2.key === key);
  if (key in p) return p[key];
  if (def?.aliases) {
    for (const a of def.aliases) if (a in p) return p[a];
  }
  return def ? def.default : "";
}
var STATUS_EFFECTS = [
  "SPEED",
  "SLOWNESS",
  "HASTE",
  "MINING_FATIGUE",
  "STRENGTH",
  "INSTANT_HEALTH",
  "INSTANT_DAMAGE",
  "JUMP_BOOST",
  "NAUSEA",
  "REGENERATION",
  "RESISTANCE",
  "FIRE_RESISTANCE",
  "WATER_BREATHING",
  "INVISIBILITY",
  "BLINDNESS",
  "NIGHT_VISION",
  "HUNGER",
  "WEAKNESS",
  "POISON",
  "WITHER",
  "HEALTH_BOOST",
  "ABSORPTION",
  "SATURATION",
  "GLOWING",
  "LEVITATION",
  "LUCK",
  "UNLUCK",
  "SLOW_FALLING",
  "CONDUIT_POWER",
  "DOLPHINS_GRACE",
  "DARKNESS"
];
var PARTICLES = [
  "FLAME",
  "SOUL_FIRE_FLAME",
  "SMOKE",
  "LARGE_SMOKE",
  "HEART",
  "CRIT",
  "ENCHANTED_HIT",
  "END_ROD",
  "PORTAL",
  "EXPLOSION",
  "CLOUD",
  "HAPPY_VILLAGER",
  "ANGRY_VILLAGER",
  "WITCH",
  "ENCHANT",
  "LAVA",
  "SNOWFLAKE",
  "TOTEM_OF_UNDYING",
  "SONIC_BOOM",
  "ELECTRIC_SPARK",
  "SOUL",
  "GLOW",
  "NOTE",
  "DRAGON_BREATH"
];
var SOUNDS = [
  "entity.blaze.shoot",
  "entity.generic.explode",
  "entity.lightning_bolt.thunder",
  "entity.player.levelup",
  "entity.experience_orb.pickup",
  "entity.ender_dragon.growl",
  "entity.wither.shoot",
  "entity.enderman.teleport",
  "block.anvil.land",
  "block.note_block.pling",
  "block.beacon.activate",
  "entity.evoker.cast_spell",
  "entity.illusioner.cast_spell",
  "item.totem.use",
  "entity.firework_rocket.launch",
  "entity.warden.sonic_boom"
];
var opts = (arr) => arr.map((v) => ({ value: v, label: v }));
var P = {
  amount: (d2 = 5) => ({ key: "amount", aliases: ["a"], label: "\u91CF", type: "number", default: d2 })
};
var SCOPE = { key: "scope", aliases: ["sc"], label: "\u30B9\u30B3\u30FC\u30D7", type: "select", default: "caster", options: opts(["caster", "target", "global"]) };
function varOwner(p) {
  const sc = String(p.scope ?? p.sc ?? "caster");
  return sc === "global" ? "null" : sc === "target" ? "t.entity" : "ctx.caster";
}
var MECHANICS = [
  {
    id: "damage",
    aliases: ["d"],
    label: "\u30C0\u30E1\u30FC\u30B8",
    category: "\u30C0\u30E1\u30FC\u30B8/\u56DE\u5FA9",
    entityOnly: true,
    description: "\u30BF\u30FC\u30B2\u30C3\u30C8\u306B\u30C0\u30E1\u30FC\u30B8\u3092\u4E0E\u3048\u308B",
    params: [P.amount(5), { key: "magic", aliases: ["ia", "ignoreArmor"], label: "\u9632\u5177\u7121\u8996(\u9B54\u6CD5)", type: "boolean", default: false }],
    gen: (p) => `Mechanics.damage(ctx, t, ${kFloat(getParam(MECHANICS[0].params, p, "amount"))}, ${kBool(getParam(MECHANICS[0].params, p, "magic"))})`
  },
  {
    id: "heal",
    aliases: ["h"],
    label: "\u56DE\u5FA9",
    category: "\u30C0\u30E1\u30FC\u30B8/\u56DE\u5FA9",
    entityOnly: true,
    description: "\u30BF\u30FC\u30B2\u30C3\u30C8\u306EHP\u3092\u56DE\u5FA9",
    params: [P.amount(4)],
    gen: (p) => `Mechanics.heal(t, ${kFloat(p.amount ?? p.a ?? 4)})`
  },
  {
    id: "ignite",
    aliases: ["fire"],
    label: "\u708E\u4E0A",
    category: "\u30C0\u30E1\u30FC\u30B8/\u56DE\u5FA9",
    entityOnly: true,
    description: "\u30BF\u30FC\u30B2\u30C3\u30C8\u3092\u71C3\u3084\u3059",
    params: [{ key: "ticks", aliases: ["t"], label: "tick\u6570", type: "int", default: 60 }],
    gen: (p) => `Mechanics.ignite(t, ${kInt(p.ticks ?? p.t ?? 60)})`
  },
  {
    id: "extinguish",
    aliases: [],
    label: "\u6D88\u706B",
    category: "\u30C0\u30E1\u30FC\u30B8/\u56DE\u5FA9",
    entityOnly: true,
    description: "\u708E\u4E0A\u3092\u6D88\u3059",
    params: [],
    gen: () => `Mechanics.extinguish(t)`
  },
  {
    id: "potion",
    aliases: ["effect"],
    label: "\u30DD\u30FC\u30B7\u30E7\u30F3\u52B9\u679C",
    category: "\u30A8\u30D5\u30A7\u30AF\u30C8",
    entityOnly: true,
    description: "\u30B9\u30C6\u30FC\u30BF\u30B9\u52B9\u679C\u3092\u4ED8\u4E0E",
    params: [
      { key: "type", aliases: ["t"], label: "\u52B9\u679C", type: "select", default: "SPEED", options: opts(STATUS_EFFECTS) },
      { key: "duration", aliases: ["d"], label: "\u6642\u9593(tick)", type: "int", default: 200 },
      { key: "level", aliases: ["l"], label: "\u30EC\u30D9\u30EB(0=I)", type: "int", default: 0 },
      { key: "particles", aliases: ["p"], label: "\u30D1\u30FC\u30C6\u30A3\u30AF\u30EB\u8868\u793A", type: "boolean", default: true }
    ],
    gen: (p, g) => {
      g.imports.add("net.minecraft.entity.effect.StatusEffects");
      const type = String(p.type ?? p.t ?? "SPEED").toUpperCase();
      return `Mechanics.potion(t, StatusEffects.${type}, ${kInt(p.duration ?? p.d ?? 200)}, ${kInt(p.level ?? p.l ?? 0)}, ${kBool(p.particles ?? p.p ?? true)})`;
    }
  },
  {
    id: "cleanse",
    aliases: ["clearEffects"],
    label: "\u52B9\u679C\u89E3\u9664",
    category: "\u30A8\u30D5\u30A7\u30AF\u30C8",
    entityOnly: true,
    description: "\u5168\u3066\u306E\u30B9\u30C6\u30FC\u30BF\u30B9\u52B9\u679C\u3092\u89E3\u9664",
    params: [],
    gen: () => `Mechanics.clearEffects(t)`
  },
  {
    id: "freeze",
    aliases: [],
    label: "\u51CD\u7D50",
    category: "\u30A8\u30D5\u30A7\u30AF\u30C8",
    entityOnly: true,
    description: "\u7C89\u96EA\u306E\u51CD\u7D50\u72B6\u614B\u306B\u3059\u308B",
    params: [{ key: "ticks", aliases: ["t"], label: "tick\u6570", type: "int", default: 140 }],
    gen: (p) => `Mechanics.freeze(t, ${kInt(p.ticks ?? p.t ?? 140)})`
  },
  {
    id: "velocity",
    aliases: ["launch"],
    label: "\u901F\u5EA6\u52A0\u7B97",
    category: "\u79FB\u52D5",
    entityOnly: true,
    description: "\u30BF\u30FC\u30B2\u30C3\u30C8\u306B\u901F\u5EA6\u30D9\u30AF\u30C8\u30EB\u3092\u52A0\u3048\u308B",
    params: [
      { key: "x", label: "X", type: "number", default: 0 },
      { key: "y", label: "Y", type: "number", default: 1 },
      { key: "z", label: "Z", type: "number", default: 0 }
    ],
    gen: (p) => `Mechanics.velocity(t, ${kDouble(p.x ?? 0)}, ${kDouble(p.y ?? 1)}, ${kDouble(p.z ?? 0)})`
  },
  {
    id: "leap",
    aliases: ["dash"],
    label: "\u8DF3\u8E8D/\u30C0\u30C3\u30B7\u30E5",
    category: "\u79FB\u52D5",
    entityOnly: true,
    description: "\u30BF\u30FC\u30B2\u30C3\u30C8\u306E\u5411\u3044\u3066\u3044\u308B\u65B9\u5411\u3078\u98DB\u3076",
    params: [
      { key: "forward", aliases: ["f"], label: "\u524D\u65B9", type: "number", default: 1.2 },
      { key: "up", aliases: ["u"], label: "\u4E0A\u65B9", type: "number", default: 0.5 }
    ],
    gen: (p) => `Mechanics.leap(t, ${kDouble(p.forward ?? p.f ?? 1.2)}, ${kDouble(p.up ?? p.u ?? 0.5)})`
  },
  {
    id: "push",
    aliases: ["knockback", "throw"],
    label: "\u30CE\u30C3\u30AF\u30D0\u30C3\u30AF",
    category: "\u79FB\u52D5",
    entityOnly: true,
    description: "\u30AD\u30E3\u30B9\u30BF\u30FC\u304B\u3089\u9060\u3056\u3051\u308B",
    params: [
      { key: "strength", aliases: ["s", "v"], label: "\u5F37\u3055", type: "number", default: 1.2 },
      { key: "up", aliases: ["u", "vy"], label: "\u4E0A\u65B9", type: "number", default: 0.4 }
    ],
    gen: (p) => `Mechanics.push(ctx, t, ${kDouble(p.strength ?? p.s ?? 1.2)}, ${kDouble(p.up ?? p.u ?? 0.4)})`
  },
  {
    id: "pull",
    aliases: [],
    label: "\u5F15\u304D\u5BC4\u305B",
    category: "\u79FB\u52D5",
    entityOnly: true,
    description: "\u30AD\u30E3\u30B9\u30BF\u30FC\u3078\u5F15\u304D\u5BC4\u305B\u308B",
    params: [{ key: "strength", aliases: ["s", "v"], label: "\u5F37\u3055", type: "number", default: 1 }],
    gen: (p) => `Mechanics.push(ctx, t, -${kDouble(p.strength ?? p.s ?? 1)}, 0.2)`
  },
  {
    id: "teleport",
    aliases: ["tp"],
    label: "\u30C6\u30EC\u30DD\u30FC\u30C8",
    category: "\u79FB\u52D5",
    description: "\u30AD\u30E3\u30B9\u30BF\u30FC\u3092\u30BF\u30FC\u30B2\u30C3\u30C8\u4F4D\u7F6E\u3078\u79FB\u52D5",
    params: [],
    gen: () => `Mechanics.teleport(ctx, t)`
  },
  {
    id: "projectile",
    aliases: ["shoot"],
    label: "\u767A\u5C04\u7269",
    category: "\u53EC\u559A/\u30EF\u30FC\u30EB\u30C9",
    description: "\u30AD\u30E3\u30B9\u30BF\u30FC\u304B\u3089\u30BF\u30FC\u30B2\u30C3\u30C8\u3078\u767A\u5C04\u7269\u3092\u6483\u3064\uFF08@Self\u306A\u3089\u8996\u7DDA\u65B9\u5411\uFF09",
    params: [
      { key: "type", aliases: ["t"], label: "\u7A2E\u985E", type: "select", default: "fireball", options: opts(["arrow", "snowball", "fireball", "large_fireball", "wither_skull", "trident"]) },
      { key: "speed", aliases: ["v"], label: "\u901F\u5EA6", type: "number", default: 1.5 }
    ],
    gen: (p) => `Mechanics.projectile(ctx, t, ${kStr(p.type ?? p.t ?? "fireball")}, ${kFloat(p.speed ?? p.v ?? 1.5)})`
  },
  {
    id: "summon",
    aliases: [],
    label: "\u53EC\u559A",
    category: "\u53EC\u559A/\u30EF\u30FC\u30EB\u30C9",
    description: "\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3\u3092\u53EC\u559A",
    params: [
      { key: "type", aliases: ["t", "mob"], label: "\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3ID", type: "string", default: "minecraft:zombie" },
      { key: "amount", aliases: ["a"], label: "\u6570", type: "int", default: 1 }
    ],
    gen: (p) => `Mechanics.summon(ctx, t, ${kStr(p.type ?? p.t ?? "minecraft:zombie")}, ${kInt(p.amount ?? p.a ?? 1)})`
  },
  {
    id: "lightning",
    aliases: [],
    label: "\u843D\u96F7",
    category: "\u53EC\u559A/\u30EF\u30FC\u30EB\u30C9",
    description: "\u96F7\u3092\u843D\u3068\u3059",
    params: [{ key: "cosmetic", aliases: ["c"], label: "\u898B\u305F\u76EE\u306E\u307F", type: "boolean", default: false }],
    gen: (p) => `Mechanics.lightning(ctx, t, ${kBool(p.cosmetic ?? p.c ?? false)})`
  },
  {
    id: "explosion",
    aliases: ["explode"],
    label: "\u7206\u767A",
    category: "\u53EC\u559A/\u30EF\u30FC\u30EB\u30C9",
    description: "\u7206\u767A\u3092\u8D77\u3053\u3059",
    params: [
      { key: "power", aliases: ["p", "yield"], label: "\u5A01\u529B", type: "number", default: 2 },
      { key: "fire", aliases: ["f"], label: "\u706B\u3092\u3064\u3051\u308B", type: "boolean", default: false },
      { key: "breakBlocks", aliases: ["bb"], label: "\u30D6\u30ED\u30C3\u30AF\u7834\u58CA", type: "boolean", default: false }
    ],
    gen: (p) => `Mechanics.explosion(ctx, t, ${kFloat(p.power ?? p.p ?? 2)}, ${kBool(p.fire ?? p.f ?? false)}, ${kBool(p.breakBlocks ?? p.bb ?? false)})`
  },
  {
    id: "setblock",
    aliases: ["block"],
    label: "\u30D6\u30ED\u30C3\u30AF\u8A2D\u7F6E",
    category: "\u53EC\u559A/\u30EF\u30FC\u30EB\u30C9",
    description: "\u30BF\u30FC\u30B2\u30C3\u30C8\u4F4D\u7F6E\u306B\u30D6\u30ED\u30C3\u30AF\u3092\u7F6E\u304F",
    params: [{ key: "block", aliases: ["b"], label: "\u30D6\u30ED\u30C3\u30AFID", type: "string", default: "minecraft:cobweb" }],
    gen: (p) => `Mechanics.setBlock(ctx, t, ${kStr(p.block ?? p.b ?? "minecraft:cobweb")})`
  },
  {
    id: "particles",
    aliases: ["effect:particles", "particle"],
    label: "\u30D1\u30FC\u30C6\u30A3\u30AF\u30EB",
    category: "\u6F14\u51FA",
    description: "\u30D1\u30FC\u30C6\u30A3\u30AF\u30EB\u3092\u8868\u793A",
    params: [
      { key: "particle", aliases: ["p"], label: "\u7A2E\u985E", type: "select", default: "FLAME", options: opts(PARTICLES) },
      { key: "amount", aliases: ["a"], label: "\u6570", type: "int", default: 20 },
      { key: "spread", aliases: ["hs"], label: "\u62E1\u6563", type: "number", default: 0.5 },
      { key: "speed", aliases: ["s"], label: "\u901F\u5EA6", type: "number", default: 0.05 },
      { key: "yOffset", aliases: ["y"], label: "Y\u88DC\u6B63", type: "number", default: 1 }
    ],
    gen: (p, g) => {
      g.imports.add("net.minecraft.particle.ParticleTypes");
      return `Mechanics.particles(ctx, t, ParticleTypes.${String(p.particle ?? p.p ?? "FLAME").toUpperCase()}, ${kInt(p.amount ?? p.a ?? 20)}, ${kDouble(p.spread ?? p.hs ?? 0.5)}, ${kDouble(p.speed ?? p.s ?? 0.05)}, ${kDouble(p.yOffset ?? p.y ?? 1)})`;
    }
  },
  {
    id: "sound",
    aliases: ["s"],
    label: "\u30B5\u30A6\u30F3\u30C9",
    category: "\u6F14\u51FA",
    description: "\u30B5\u30A6\u30F3\u30C9\u3092\u518D\u751F\uFF08\u4EFB\u610F\u306E\u30B5\u30A6\u30F3\u30C9ID\u304C\u4F7F\u7528\u53EF\u80FD\uFF09",
    params: [
      { key: "sound", aliases: ["s"], label: "\u30B5\u30A6\u30F3\u30C9ID", type: "string", default: "entity.blaze.shoot", options: opts(SOUNDS) },
      { key: "volume", aliases: ["v"], label: "\u97F3\u91CF", type: "number", default: 1 },
      { key: "pitch", aliases: ["p"], label: "\u30D4\u30C3\u30C1", type: "number", default: 1 }
    ],
    gen: (p) => `Mechanics.sound(ctx, t, ${kStr(p.sound ?? p.s ?? "entity.blaze.shoot")}, ${kFloat(p.volume ?? p.v ?? 1)}, ${kFloat(p.pitch ?? p.p ?? 1)})`
  },
  {
    id: "message",
    aliases: ["msg"],
    label: "\u30E1\u30C3\u30BB\u30FC\u30B8",
    category: "\u6F14\u51FA",
    entityOnly: true,
    description: "\u30C1\u30E3\u30C3\u30C8\u30E1\u30C3\u30BB\u30FC\u30B8\uFF08<caster.name> <target.name> \u4F7F\u7528\u53EF\uFF09",
    params: [{ key: "text", aliases: ["m", "msg"], label: "\u30C6\u30AD\u30B9\u30C8", type: "string", default: "Hello <caster.name>!" }],
    gen: (p) => `Mechanics.message(ctx, t, ${kStr(p.text ?? p.m ?? "")}, false)`
  },
  {
    id: "actionbar",
    aliases: [],
    label: "\u30A2\u30AF\u30B7\u30E7\u30F3\u30D0\u30FC",
    category: "\u6F14\u51FA",
    entityOnly: true,
    description: "\u30A2\u30AF\u30B7\u30E7\u30F3\u30D0\u30FC\u306B\u30C6\u30AD\u30B9\u30C8\u8868\u793A",
    params: [{ key: "text", aliases: ["m"], label: "\u30C6\u30AD\u30B9\u30C8", type: "string", default: "Skill!" }],
    gen: (p) => `Mechanics.message(ctx, t, ${kStr(p.text ?? p.m ?? "")}, true)`
  },
  {
    id: "title",
    aliases: [],
    label: "\u30BF\u30A4\u30C8\u30EB",
    category: "\u6F14\u51FA",
    entityOnly: true,
    description: "\u753B\u9762\u4E2D\u592E\u306B\u30BF\u30A4\u30C8\u30EB\u8868\u793A",
    params: [
      { key: "title", aliases: ["t"], label: "\u30BF\u30A4\u30C8\u30EB", type: "string", default: "BOSS" },
      { key: "subtitle", aliases: ["st"], label: "\u30B5\u30D6\u30BF\u30A4\u30C8\u30EB", type: "string", default: "" }
    ],
    gen: (p) => `Mechanics.title(ctx, t, ${kStr(p.title ?? p.t ?? "")}, ${kStr(p.subtitle ?? p.st ?? "")})`
  },
  {
    id: "giveitem",
    aliases: ["give"],
    label: "\u30A2\u30A4\u30C6\u30E0\u4ED8\u4E0E",
    category: "\u30E6\u30FC\u30C6\u30A3\u30EA\u30C6\u30A3",
    entityOnly: true,
    description: "\u30D7\u30EC\u30A4\u30E4\u30FC\u306B\u30A2\u30A4\u30C6\u30E0\u3092\u4E0E\u3048\u308B\uFF08MOD\u30A2\u30A4\u30C6\u30E0\u3082\u53EF: modid:name\uFF09",
    params: [
      { key: "item", aliases: ["i"], label: "\u30A2\u30A4\u30C6\u30E0ID", type: "string", default: "minecraft:diamond" },
      { key: "amount", aliases: ["a"], label: "\u6570", type: "int", default: 1 }
    ],
    gen: (p) => `Mechanics.giveItem(t, ${kStr(p.item ?? p.i ?? "minecraft:diamond")}, ${kInt(p.amount ?? p.a ?? 1)})`
  },
  {
    id: "feed",
    aliases: [],
    label: "\u6E80\u8179\u5EA6\u56DE\u5FA9",
    category: "\u30E6\u30FC\u30C6\u30A3\u30EA\u30C6\u30A3",
    entityOnly: true,
    description: "\u30D7\u30EC\u30A4\u30E4\u30FC\u306E\u6E80\u8179\u5EA6\u3092\u56DE\u5FA9",
    params: [
      { key: "food", aliases: ["f"], label: "\u6E80\u8179\u5EA6", type: "int", default: 4 },
      { key: "saturation", aliases: ["s"], label: "\u96A0\u3057\u6E80\u8179\u5EA6", type: "number", default: 2 }
    ],
    gen: (p) => `Mechanics.feed(t, ${kInt(p.food ?? p.f ?? 4)}, ${kFloat(p.saturation ?? p.s ?? 2)})`
  },
  {
    id: "xp",
    aliases: ["experience"],
    label: "\u7D4C\u9A13\u5024",
    category: "\u30E6\u30FC\u30C6\u30A3\u30EA\u30C6\u30A3",
    entityOnly: true,
    description: "\u7D4C\u9A13\u5024\u3092\u4E0E\u3048\u308B",
    params: [P.amount(10)],
    gen: (p) => `Mechanics.addXp(t, ${kInt(p.amount ?? p.a ?? 10)})`
  },
  {
    id: "command",
    aliases: ["cmd"],
    label: "\u30B3\u30DE\u30F3\u30C9\u5B9F\u884C",
    category: "\u30E6\u30FC\u30C6\u30A3\u30EA\u30C6\u30A3",
    description: "\u30B3\u30DE\u30F3\u30C9\u3092\u5B9F\u884C\uFF08\u5148\u982D\u306E/\u4E0D\u8981\uFF09",
    params: [
      { key: "cmd", aliases: ["c"], label: "\u30B3\u30DE\u30F3\u30C9", type: "string", default: "say <caster.name> used a skill" },
      { key: "asConsole", aliases: ["console"], label: "\u30B5\u30FC\u30D0\u30FC\u6A29\u9650\u3067\u5B9F\u884C", type: "boolean", default: true }
    ],
    gen: (p) => `Mechanics.command(ctx, t, ${kStr(p.cmd ?? p.c ?? "")}, ${kBool(p.asConsole ?? p.console ?? true)})`
  },
  {
    id: "summonmob",
    aliases: ["mythicmob", "spawnmob"],
    label: "\u30AB\u30B9\u30BF\u30E0\u30E2\u30D6\u53EC\u559A",
    category: "\u53EC\u559A/\u30EF\u30FC\u30EB\u30C9",
    description: "\u3053\u306EMod\u3067\u5B9A\u7FA9\u3057\u305F\u30AB\u30B9\u30BF\u30E0\u30E2\u30D6\u3092\u53EC\u559A",
    params: [
      { key: "mob", aliases: ["m", "type"], label: "\u30AB\u30B9\u30BF\u30E0\u30E2\u30D6", type: "mob", default: "" },
      { key: "amount", aliases: ["a"], label: "\u6570", type: "int", default: 1 }
    ],
    gen: (p) => `repeat(${kInt(p.amount ?? p.a ?? 1)}) { CustomMobs.spawn(${kStr(p.mob ?? p.m ?? "")}, ctx.world, t.pos) }`
  },
  {
    id: "beam",
    aliases: ["line", "effect:particleline"],
    label: "\u30D3\u30FC\u30E0",
    category: "\u6F14\u51FA",
    description: "\u30AD\u30E3\u30B9\u30BF\u30FC\u304B\u3089\u30BF\u30FC\u30B2\u30C3\u30C8\u3078\u30D1\u30FC\u30C6\u30A3\u30AF\u30EB\u306E\u7DDA\u3092\u63CF\u304F",
    params: [
      { key: "particle", aliases: ["p"], label: "\u7A2E\u985E", type: "select", default: "END_ROD", options: opts(PARTICLES) },
      { key: "density", aliases: ["d"], label: "\u5BC6\u5EA6(1\u30D6\u30ED\u30C3\u30AF\u5F53\u305F\u308A)", type: "number", default: 4 }
    ],
    gen: (p, g) => {
      g.imports.add("net.minecraft.particle.ParticleTypes");
      return `Mechanics.beam(ctx, t, ParticleTypes.${String(p.particle ?? p.p ?? "END_ROD").toUpperCase()}, ${kDouble(p.density ?? p.d ?? 4)})`;
    }
  },
  {
    id: "dropitem",
    aliases: ["drop"],
    label: "\u30A2\u30A4\u30C6\u30E0\u30C9\u30ED\u30C3\u30D7",
    category: "\u53EC\u559A/\u30EF\u30FC\u30EB\u30C9",
    description: "\u30BF\u30FC\u30B2\u30C3\u30C8\u4F4D\u7F6E\u306B\u30A2\u30A4\u30C6\u30E0\u3092\u843D\u3068\u3059",
    params: [
      { key: "item", aliases: ["i"], label: "\u30A2\u30A4\u30C6\u30E0ID", type: "string", default: "minecraft:emerald" },
      { key: "amount", aliases: ["a"], label: "\u6570", type: "int", default: 1 }
    ],
    gen: (p) => `Mechanics.dropItem(ctx, t, ${kStr(p.item ?? p.i ?? "minecraft:emerald")}, ${kInt(p.amount ?? p.a ?? 1)})`
  },
  {
    id: "remove",
    aliases: ["despawn"],
    label: "\u6D88\u53BB",
    category: "\u30E6\u30FC\u30C6\u30A3\u30EA\u30C6\u30A3",
    entityOnly: true,
    description: "\u30BF\u30FC\u30B2\u30C3\u30C8\u3092\u30EF\u30FC\u30EB\u30C9\u304B\u3089\u6D88\u3059\uFF08\u30D7\u30EC\u30A4\u30E4\u30FC\u306B\u306F\u7121\u52B9\uFF09",
    params: [],
    gen: () => `Mechanics.remove(t)`
  },
  {
    id: "sethealth",
    aliases: ["sethp"],
    label: "HP\u8A2D\u5B9A",
    category: "\u30C0\u30E1\u30FC\u30B8/\u56DE\u5FA9",
    entityOnly: true,
    description: "HP\u3092\u6700\u5927HP\u306E\u5272\u5408\u3067\u8A2D\u5B9A",
    params: [{ key: "percent", aliases: ["p"], label: "\u5272\u5408%", type: "number", default: 100 }],
    gen: (p) => `Mechanics.setHealthPercent(t, ${kFloat(p.percent ?? p.p ?? 100)})`
  },
  {
    id: "missile",
    aliases: ["projectile2", "orb"],
    label: "\u30DF\u30B5\u30A4\u30EB(\u5F3E\u9053\u30B9\u30AD\u30EB)",
    category: "\u53EC\u559A/\u30EF\u30FC\u30EB\u30C9",
    description: "\u30D1\u30FC\u30C6\u30A3\u30AF\u30EB\u306E\u5F3E\u3092\u98DB\u3070\u3057\u3001\u547D\u4E2D\u3057\u305F\u6575/\u4F4D\u7F6E\u3092\u8D77\u70B9\u306B onHit \u30B9\u30AD\u30EB\u3092\u5B9F\u884C\uFF08MythicMobs \u306E projectile \u76F8\u5F53\uFF09",
    params: [
      { key: "onHit", aliases: ["oh"], label: "\u547D\u4E2D\u6642\u30B9\u30AD\u30EB", type: "skill", default: "" },
      { key: "speed", aliases: ["v"], label: "\u901F\u5EA6(\u30D6\u30ED\u30C3\u30AF/tick)", type: "number", default: 1.2 },
      { key: "ticks", aliases: ["mr", "maxTicks"], label: "\u6700\u5927\u98DB\u884Ctick", type: "int", default: 40 },
      { key: "radius", aliases: ["hr"], label: "\u5F53\u305F\u308A\u5224\u5B9A\u534A\u5F84", type: "number", default: 0.8 },
      { key: "gravity", aliases: ["g"], label: "\u91CD\u529B", type: "number", default: 0 },
      { key: "particle", aliases: ["p"], label: "\u8ECC\u8DE1\u30D1\u30FC\u30C6\u30A3\u30AF\u30EB", type: "select", default: "FLAME", options: opts(PARTICLES) },
      { key: "hitBlocks", aliases: ["hb"], label: "\u30D6\u30ED\u30C3\u30AF\u3067\u6B62\u307E\u308B", type: "boolean", default: true }
    ],
    gen: (p, g) => {
      g.imports.add("net.minecraft.particle.ParticleTypes");
      const fn = g.skillFn(String(p.onHit ?? p.oh ?? ""));
      const cb = fn ? `{ hit -> Skills.${fn}(hit) }` : `{ _ -> }`;
      return `Mechanics.missile(ctx, t, ${kDouble(p.speed ?? p.v ?? 1.2)}, ${kInt(p.ticks ?? p.mr ?? 40)}, ${kDouble(p.radius ?? p.hr ?? 0.8)}, ${kDouble(p.gravity ?? p.g ?? 0)}, ParticleTypes.${String(p.particle ?? p.p ?? "FLAME").toUpperCase()}, ${kBool(p.hitBlocks ?? p.hb ?? true)}) ${cb}`;
    }
  },
  {
    id: "setvar",
    aliases: ["variableset", "setvariable"],
    label: "\u5909\u6570\u3092\u8A2D\u5B9A",
    category: "\u5909\u6570",
    description: "\u6570\u5024\u5909\u6570\u3092\u8A2D\u5B9A\uFF08\u30EF\u30FC\u30EB\u30C9\u4FDD\u5B58\u3055\u308C\u518D\u8D77\u52D5\u5F8C\u3082\u4FDD\u6301\uFF09\u3002\u30C6\u30AD\u30B9\u30C8\u3067 <var.\u540D\u524D> / <global.\u540D\u524D> \u4F7F\u7528\u53EF",
    params: [
      { key: "var", aliases: ["name", "n"], label: "\u5909\u6570\u540D", type: "string", default: "mana" },
      { key: "value", aliases: ["v"], label: "\u5024", type: "number", default: 0 },
      SCOPE
    ],
    gen: (p) => `Variables.set(ctx, ${varOwner(p)}, ${kStr(p.var ?? p.name ?? "mana")}, ${kDouble(p.value ?? p.v ?? 0)})`
  },
  {
    id: "addvar",
    aliases: ["variableadd", "modifyvar"],
    label: "\u5909\u6570\u3092\u52A0\u7B97",
    category: "\u5909\u6570",
    description: "\u6570\u5024\u5909\u6570\u306B\u52A0\u7B97\uFF08\u8CA0\u6570\u3067\u6E1B\u7B97\uFF09\u3002min/max \u3067\u30AF\u30E9\u30F3\u30D7",
    params: [
      { key: "var", aliases: ["name", "n"], label: "\u5909\u6570\u540D", type: "string", default: "mana" },
      { key: "amount", aliases: ["a", "v"], label: "\u52A0\u7B97\u5024", type: "number", default: 1 },
      { key: "min", label: "\u6700\u5C0F", type: "number", default: -1e6 },
      { key: "max", label: "\u6700\u5927", type: "number", default: 1e6 },
      SCOPE
    ],
    gen: (p) => `Variables.add(ctx, ${varOwner(p)}, ${kStr(p.var ?? p.name ?? "mana")}, ${kDouble(p.amount ?? p.a ?? 1)}, ${kDouble(p.min ?? -1e6)}, ${kDouble(p.max ?? 1e6)})`
  },
  {
    id: "delay",
    aliases: ["wait"],
    label: "\u9045\u5EF6",
    category: "\u5236\u5FA1",
    noTargeter: true,
    description: "\u4EE5\u964D\u306E\u884C\u3092\u6307\u5B9Atick\u5F8C\u306B\u5B9F\u884C",
    params: [{ key: "ticks", aliases: ["t"], label: "tick\u6570", type: "int", default: 20 }],
    gen: () => ""
  },
  {
    id: "skill",
    aliases: ["metaskill", "castskill"],
    label: "\u30B9\u30AD\u30EB\u547C\u3073\u51FA\u3057",
    category: "\u5236\u5FA1",
    description: "\u5225\u30B9\u30AD\u30EB\u3092\u5404\u30BF\u30FC\u30B2\u30C3\u30C8\u3092\u8D77\u70B9\u306B\u5B9F\u884C",
    params: [{ key: "s", aliases: ["skill"], label: "\u30B9\u30AD\u30EB", type: "skill", default: "" }],
    gen: (p, g) => {
      const fn = g.skillFn(String(p.s ?? p.skill ?? ""));
      if (!fn) return `// \u672A\u5B9A\u7FA9\u30B9\u30AD\u30EB: ${String(p.s ?? p.skill ?? "")}`;
      return `Skills.${fn}(ctx.copy(target = t.entity ?: ctx.target, origin = t.pos))`;
    }
  },
  {
    id: "repeat",
    aliases: ["loop"],
    label: "\u7E70\u308A\u8FD4\u3057",
    category: "\u5236\u5FA1",
    description: "\u5225\u30B9\u30AD\u30EB\u3092\u4E00\u5B9A\u9593\u9694\u3067\u7E70\u308A\u8FD4\u3057\u5B9F\u884C",
    params: [
      { key: "s", aliases: ["skill"], label: "\u30B9\u30AD\u30EB", type: "skill", default: "" },
      { key: "times", aliases: ["r", "repeat"], label: "\u56DE\u6570", type: "int", default: 5 },
      { key: "interval", aliases: ["i"], label: "\u9593\u9694(tick)", type: "int", default: 10 }
    ],
    gen: (p, g) => {
      const fn = g.skillFn(String(p.s ?? p.skill ?? ""));
      if (!fn) return `// \u672A\u5B9A\u7FA9\u30B9\u30AD\u30EB: ${String(p.s ?? p.skill ?? "")}`;
      return `Mechanics.repeatSkill(${kInt(p.times ?? p.r ?? 5)}, ${kInt(p.interval ?? p.i ?? 10)}) { _ -> Skills.${fn}(ctx.copy(target = t.entity ?: ctx.target, origin = t.pos)) }`;
    }
  },
  {
    id: "kotlin",
    aliases: ["code", "custom"],
    label: "\u30AB\u30B9\u30BF\u30E0Kotlin",
    category: "\u5236\u5FA1",
    description: "\u4EFB\u610F\u306EKotlin\u30B3\u30FC\u30C9\u3002\u5909\u6570 ctx (SkillContext), t (SkillTarget), e (Entity?) \u304C\u4F7F\u3048\u307E\u3059",
    params: [{ key: "code", aliases: [], label: "Kotlin\u30B3\u30FC\u30C9", type: "code", default: "e?.let { it.addVelocity(0.0, 0.5, 0.0); it.velocityModified = true }" }],
    gen: (p) => String(p.code ?? "")
  }
];
var TARGETERS = [
  { id: "Self", aliases: ["caster", "s"], label: "\u81EA\u5206", description: "\u30B9\u30AD\u30EB\u306E\u4F7F\u7528\u8005", returnsEntities: true, params: [], gen: () => "Targeters.self(ctx)" },
  { id: "Target", aliases: ["t", "trigger"], label: "\u30BF\u30FC\u30B2\u30C3\u30C8", description: "\u30C8\u30EA\u30AC\u30FC\u306E\u5BFE\u8C61\uFF08\u653B\u6483\u76F8\u624B\u306A\u3069\uFF09", returnsEntities: true, params: [], gen: () => "Targeters.target(ctx)" },
  {
    id: "LookEntity",
    aliases: ["looktarget", "lt"],
    label: "\u8996\u7DDA\u5148\u306E\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3",
    description: "\u8996\u7DDA\u306E\u5148\u306B\u3044\u308B\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3",
    returnsEntities: true,
    params: [{ key: "range", aliases: ["r"], label: "\u8DDD\u96E2", type: "number", default: 20 }],
    gen: (p) => `Targeters.lookEntity(ctx, ${kDouble(p.range ?? p.r ?? 20)})`
  },
  {
    id: "EntitiesInRadius",
    aliases: ["eir", "mir"],
    label: "\u7BC4\u56F2\u5185\u306E\u751F\u7269",
    description: "\u8D77\u70B9\u304B\u3089\u534A\u5F84\u5185\u306E\u751F\u7269\uFF08\u81EA\u5206\u9664\u304F\uFF09",
    returnsEntities: true,
    params: [{ key: "r", aliases: ["radius"], label: "\u534A\u5F84", type: "number", default: 5 }],
    gen: (p) => `Targeters.entitiesInRadius(ctx, ${kDouble(p.r ?? p.radius ?? 5)}, false)`
  },
  {
    id: "PlayersInRadius",
    aliases: ["pir"],
    label: "\u7BC4\u56F2\u5185\u306E\u30D7\u30EC\u30A4\u30E4\u30FC",
    description: "\u8D77\u70B9\u304B\u3089\u534A\u5F84\u5185\u306E\u30D7\u30EC\u30A4\u30E4\u30FC\uFF08\u81EA\u5206\u542B\u3080\uFF09",
    returnsEntities: true,
    params: [{ key: "r", aliases: ["radius"], label: "\u534A\u5F84", type: "number", default: 10 }],
    gen: (p) => `Targeters.entitiesInRadius(ctx, ${kDouble(p.r ?? p.radius ?? 10)}, true)`
  },
  {
    id: "NearestPlayer",
    aliases: ["np", "nearestplayer"],
    label: "\u6700\u5BC4\u308A\u306E\u30D7\u30EC\u30A4\u30E4\u30FC",
    description: "\u8D77\u70B9\u304B\u3089\u6700\u3082\u8FD1\u3044\u30D7\u30EC\u30A4\u30E4\u30FC\uFF08\u81EA\u5206\u9664\u304F\uFF09",
    returnsEntities: true,
    params: [{ key: "r", aliases: ["radius"], label: "\u534A\u5F84", type: "number", default: 32 }],
    gen: (p) => `Targeters.nearestPlayer(ctx, ${kDouble(p.r ?? p.radius ?? 32)})`
  },
  { id: "Origin", aliases: ["o"], label: "\u8D77\u70B9\u306E\u4F4D\u7F6E", description: "\u30B9\u30AD\u30EB\u8D77\u70B9\uFF08\u30D6\u30ED\u30C3\u30AF\u4F4D\u7F6E\u306A\u3069\uFF09", returnsEntities: false, params: [], gen: () => "Targeters.origin(ctx)" },
  { id: "SelfLocation", aliases: ["casterlocation", "sl"], label: "\u81EA\u5206\u306E\u4F4D\u7F6E", description: "\u4F7F\u7528\u8005\u306E\u8DB3\u5143", returnsEntities: false, params: [], gen: () => "Targeters.selfLocation(ctx)" },
  { id: "TargetLocation", aliases: ["tl"], label: "\u30BF\u30FC\u30B2\u30C3\u30C8\u306E\u4F4D\u7F6E", description: "\u30BF\u30FC\u30B2\u30C3\u30C8\u306E\u8DB3\u5143", returnsEntities: false, params: [], gen: () => "Targeters.targetLocation(ctx)" },
  {
    id: "LookBlock",
    aliases: ["targetblock", "lb"],
    label: "\u8996\u7DDA\u5148\u306E\u30D6\u30ED\u30C3\u30AF",
    description: "\u8996\u7DDA\u306E\u5148\u306E\u30D6\u30ED\u30C3\u30AF\u4F4D\u7F6E",
    returnsEntities: false,
    params: [{ key: "range", aliases: ["r"], label: "\u8DDD\u96E2", type: "number", default: 30 }],
    gen: (p) => `Targeters.lookBlock(ctx, ${kDouble(p.range ?? p.r ?? 30)})`
  },
  {
    id: "Forward",
    aliases: ["f"],
    label: "\u524D\u65B9\u306E\u4F4D\u7F6E",
    description: "\u4F7F\u7528\u8005\u306E\u524D\u65B9 N \u30D6\u30ED\u30C3\u30AF",
    returnsEntities: false,
    params: [{ key: "distance", aliases: ["d"], label: "\u8DDD\u96E2", type: "number", default: 5 }],
    gen: (p) => `Targeters.forward(ctx, ${kDouble(p.distance ?? p.d ?? 5)})`
  },
  {
    id: "Ring",
    aliases: ["circle"],
    label: "\u5186\u5468\u4E0A\u306E\u4F4D\u7F6E",
    description: "\u8D77\u70B9\u3092\u4E2D\u5FC3\u3068\u3057\u305F\u5186\u5468\u4E0A\u306E\u70B9",
    returnsEntities: false,
    params: [
      { key: "r", aliases: ["radius"], label: "\u534A\u5F84", type: "number", default: 3 },
      { key: "points", aliases: ["p"], label: "\u70B9\u306E\u6570", type: "int", default: 12 }
    ],
    gen: (p) => `Targeters.ring(ctx, ${kDouble(p.r ?? p.radius ?? 3)}, ${kInt(p.points ?? p.p ?? 12)})`
  }
];
var CONDITIONS = [
  {
    id: "health",
    aliases: ["hp"],
    label: "HP\u5272\u5408",
    description: "HP\u304C\u6307\u5B9A%\u306E\u7BC4\u56F2\u5185",
    params: [
      { key: "min", label: "\u6700\u5C0F%", type: "number", default: 0 },
      { key: "max", label: "\u6700\u5927%", type: "number", default: 50 }
    ],
    gen: (p, e) => `Conditions.healthPercent(${e}, ${kDouble(p.min ?? 0)}, ${kDouble(p.max ?? 50)})`
  },
  { id: "sneaking", aliases: ["crouching"], label: "\u30B9\u30CB\u30FC\u30AF\u4E2D", description: "\u30B9\u30CB\u30FC\u30AF\u3057\u3066\u3044\u308B", params: [], gen: (_p, e) => `Conditions.sneaking(${e})` },
  { id: "sprinting", aliases: [], label: "\u30C0\u30C3\u30B7\u30E5\u4E2D", description: "\u30C0\u30C3\u30B7\u30E5\u3057\u3066\u3044\u308B", params: [], gen: (_p, e) => `Conditions.sprinting(${e})` },
  { id: "onGround", aliases: ["grounded"], label: "\u5730\u4E0A", description: "\u5730\u9762\u306B\u7ACB\u3063\u3066\u3044\u308B", params: [], gen: (_p, e) => `Conditions.onGround(${e})` },
  { id: "inWater", aliases: ["water"], label: "\u6C34\u4E2D", description: "\u6C34\u306B\u89E6\u308C\u3066\u3044\u308B", params: [], gen: (_p, e) => `Conditions.inWater(${e})` },
  { id: "burning", aliases: ["onfire"], label: "\u708E\u4E0A\u4E2D", description: "\u71C3\u3048\u3066\u3044\u308B", params: [], gen: (_p, e) => `Conditions.burning(${e})` },
  { id: "isPlayer", aliases: ["player"], label: "\u30D7\u30EC\u30A4\u30E4\u30FC", description: "\u5BFE\u8C61\u304C\u30D7\u30EC\u30A4\u30E4\u30FC", params: [], gen: (_p, e) => `Conditions.isPlayer(${e})` },
  { id: "isLiving", aliases: ["living"], label: "\u751F\u7269", description: "\u5BFE\u8C61\u304C\u751F\u7269", params: [], gen: (_p, e) => `Conditions.isLiving(${e})` },
  { id: "day", aliases: [], label: "\u663C", description: "\u30EF\u30FC\u30EB\u30C9\u304C\u663C", params: [], gen: () => `Conditions.day(ctx)` },
  { id: "night", aliases: [], label: "\u591C", description: "\u30EF\u30FC\u30EB\u30C9\u304C\u591C", params: [], gen: () => `Conditions.night(ctx)` },
  { id: "raining", aliases: ["rain"], label: "\u96E8", description: "\u96E8\u304C\u964D\u3063\u3066\u3044\u308B", params: [], gen: () => `Conditions.raining(ctx)` },
  {
    id: "chance",
    aliases: [],
    label: "\u78BA\u7387",
    description: "\u6307\u5B9A\u78BA\u7387\u3067\u6210\u529F (0.0\u301C1.0)",
    params: [{ key: "p", aliases: ["chance"], label: "\u78BA\u7387", type: "number", default: 0.5 }],
    gen: (p) => `Conditions.chance(ctx, ${kDouble(p.p ?? p.chance ?? 0.5)})`
  },
  {
    id: "holding",
    aliases: ["hand"],
    label: "\u624B\u6301\u3061\u30A2\u30A4\u30C6\u30E0",
    description: "\u30E1\u30A4\u30F3\u30CF\u30F3\u30C9\u306B\u6307\u5B9A\u30A2\u30A4\u30C6\u30E0",
    params: [{ key: "item", aliases: ["i"], label: "\u30A2\u30A4\u30C6\u30E0ID", type: "string", default: "minecraft:diamond_sword" }],
    gen: (p, e) => `Conditions.holding(${e}, ${kStr(p.item ?? p.i ?? "")})`
  },
  {
    id: "entityType",
    aliases: ["type", "mobtype"],
    label: "\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3\u7A2E\u985E",
    description: "\u5BFE\u8C61\u306E\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3ID",
    params: [{ key: "type", aliases: ["t"], label: "\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3ID", type: "string", default: "minecraft:zombie" }],
    gen: (p, e) => `Conditions.entityType(${e}, ${kStr(p.type ?? p.t ?? "")})`
  },
  {
    id: "dimension",
    aliases: ["world"],
    label: "\u30C7\u30A3\u30E1\u30F3\u30B7\u30E7\u30F3",
    description: "\u6307\u5B9A\u30C7\u30A3\u30E1\u30F3\u30B7\u30E7\u30F3\u5185",
    params: [{ key: "id", label: "\u30C7\u30A3\u30E1\u30F3\u30B7\u30E7\u30F3ID", type: "select", default: "minecraft:overworld", options: opts(["minecraft:overworld", "minecraft:the_nether", "minecraft:the_end"]) }],
    gen: (p) => `Conditions.dimension(ctx, ${kStr(p.id ?? "minecraft:overworld")})`
  },
  {
    id: "altitude",
    aliases: ["height", "y"],
    label: "\u9AD8\u5EA6",
    description: "Y\u5EA7\u6A19\u304C\u7BC4\u56F2\u5185",
    params: [
      { key: "min", label: "\u6700\u5C0FY", type: "number", default: -64 },
      { key: "max", label: "\u6700\u5927Y", type: "number", default: 320 }
    ],
    gen: (p, e) => `Conditions.altitude(${e}, ${kDouble(p.min ?? -64)}, ${kDouble(p.max ?? 320)})`
  },
  {
    id: "mythicMob",
    aliases: ["custommob", "mobid"],
    label: "\u30AB\u30B9\u30BF\u30E0\u30E2\u30D6",
    description: "\u5BFE\u8C61\u304C\u6307\u5B9A\u30AB\u30B9\u30BF\u30E0\u30E2\u30D6",
    params: [{ key: "id", aliases: ["mob"], label: "\u30AB\u30B9\u30BF\u30E0\u30E2\u30D6", type: "mob", default: "" }],
    gen: (p, e) => `CustomMobs.isMob(${e}, ${kStr(p.id ?? p.mob ?? "")})`
  },
  {
    id: "variable",
    aliases: ["varinrange", "var"],
    label: "\u5909\u6570\u306E\u7BC4\u56F2",
    description: "\u6570\u5024\u5909\u6570\u304C min\u301Cmax \u306E\u7BC4\u56F2\u5185\uFF08scope=caster \u306F\u5224\u5B9A\u5BFE\u8C61\u81EA\u8EAB\uFF09",
    params: [
      { key: "var", aliases: ["name", "n"], label: "\u5909\u6570\u540D", type: "string", default: "mana" },
      { key: "min", label: "\u6700\u5C0F", type: "number", default: 10 },
      { key: "max", label: "\u6700\u5927", type: "number", default: 1e6 },
      { key: "scope", aliases: ["sc"], label: "\u30B9\u30B3\u30FC\u30D7", type: "select", default: "caster", options: opts(["caster", "global"]) }
    ],
    gen: (p, e) => `Variables.inRange(ctx, ${String(p.scope ?? "caster") === "global" ? "null" : e}, ${kStr(p.var ?? p.name ?? "mana")}, ${kDouble(p.min ?? 10)}, ${kDouble(p.max ?? 1e6)})`
  },
  {
    id: "wearing",
    aliases: ["armor"],
    label: "\u9632\u5177\u3092\u7740\u7528",
    description: "\u6307\u5B9A\u30A2\u30A4\u30C6\u30E0\u3092\u9632\u5177\u30B9\u30ED\u30C3\u30C8\u306B\u7740\u7528",
    params: [{ key: "item", aliases: ["i"], label: "\u30A2\u30A4\u30C6\u30E0ID", type: "string", default: "minecraft:diamond_helmet" }],
    gen: (p, e) => `Conditions.wearing(${e}, ${kStr(p.item ?? p.i ?? "")})`
  },
  {
    id: "hasEffect",
    aliases: ["haspotion"],
    label: "\u52B9\u679C\u3092\u6301\u3064",
    description: "\u6307\u5B9A\u30B9\u30C6\u30FC\u30BF\u30B9\u52B9\u679C\u3092\u6301\u3064",
    params: [{ key: "type", aliases: ["t"], label: "\u52B9\u679C", type: "select", default: "SPEED", options: opts(STATUS_EFFECTS) }],
    gen: (p, e, g) => {
      g.imports.add("net.minecraft.entity.effect.StatusEffects");
      return `Conditions.hasEffect(${e}, StatusEffects.${String(p.type ?? p.t ?? "SPEED").toUpperCase()})`;
    }
  }
];
var MOB_TRIGGERS = [
  { id: "onAttack", label: "~onAttack \u653B\u6483\u6642", description: "caster=\u30E2\u30D6, target=\u88AB\u5BB3\u8005" },
  { id: "onDamaged", label: "~onDamaged \u88AB\u30C0\u30E1\u30FC\u30B8\u6642", description: "caster=\u30E2\u30D6, target=\u653B\u6483\u8005" },
  { id: "onDeath", label: "~onDeath \u6B7B\u4EA1\u6642", description: "caster=\u30E2\u30D6, target=\u5012\u3057\u305F\u8005" },
  { id: "onTimer", label: "~onTimer \u30BF\u30A4\u30DE\u30FC", description: "caster=\u30E2\u30D6, target=\u30E2\u30D6\u306E\u653B\u6483\u5BFE\u8C61", needsInterval: true }
];
var CUSTOM_MOB_TRIGGERS = [
  { id: "onSpawn", label: "~onSpawn \u51FA\u73FE\u6642", description: "caster=\u30E2\u30D6" },
  ...MOB_TRIGGERS
];
function findBy(list, name) {
  const n = name.toLowerCase();
  return list.find((d2) => d2.id.toLowerCase() === n || d2.aliases.some((a) => a.toLowerCase() === n));
}
var findMechanic = (n) => findBy(MECHANICS, n);
var findTargeter = (n) => findBy(TARGETERS, n.replace(/^@/, ""));
var findCondition = (n) => findBy(CONDITIONS, n.replace(/^\?!?/, ""));

// ../mod/mythiccraft-studio/src/lib/mod/defaults.ts
function defaultMeta(name = "My Skill Mod") {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "mymod";
  const modId = /^[a-z]/.test(slug) ? slug.slice(0, 40) : "mod_" + slug.slice(0, 36);
  const pascal = modId.split("_").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("") || "MyMod";
  return {
    modId,
    name,
    version: "1.0.0",
    packageName: `com.example.${modId.replace(/_/g, "")}`,
    mainClass: pascal.match(/^[A-Z]/) ? pascal : "MyMod",
    authors: "You",
    description: "MythicCraft Studio \u3067\u4F5C\u6210\u3057\u305F\u30B9\u30AD\u30EBMod",
    minecraftVersion: "1.21.1",
    yarnMappings: "1.21.1+build.3",
    loaderVersion: "0.16.14",
    fabricVersion: "0.116.17+1.21.1",
    fabricKotlinVersion: "1.13.3+kotlin.2.1.21",
    kotlinVersion: "2.1.21",
    loomVersion: "1.11.8",
    gradleVersion: "8.14.3"
  };
}
function emptyProject(name) {
  return { meta: defaultMeta(name), items: [], blocks: [], skills: [], mobSkills: [], events: [], commands: [], mobs: [], recipes: [] };
}

// ../mod/mythiccraft-studio/src/lib/mod/kotlinRuntime.ts
function skillCoreKt(pkg, modId) {
  return `package ${pkg}.skill

import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents
import net.minecraft.entity.Entity
import net.minecraft.entity.LivingEntity
import net.minecraft.nbt.NbtCompound
import net.minecraft.registry.RegistryWrapper
import net.minecraft.server.world.ServerWorld
import net.minecraft.util.math.Vec3d
import net.minecraft.world.PersistentState
import org.slf4j.LoggerFactory

/** \u30B9\u30AD\u30EB\u5B9F\u884C\u6642\u306E\u30B3\u30F3\u30C6\u30AD\u30B9\u30C8 (MythicMobs \u306E SkillMetadata \u76F8\u5F53) */
data class SkillContext(
    val caster: Entity,
    val target: Entity?,
    val world: ServerWorld,
    val origin: Vec3d
)

/** \u30BF\u30FC\u30B2\u30C3\u30BF\u30FC\u304C\u8FD4\u3059\u5BFE\u8C61\u3002\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3 or \u4F4D\u7F6E\u306E\u307F */
data class SkillTarget(val entity: Entity?, val pos: Vec3d)

/** tick \u30D9\u30FC\u30B9\u306E\u9045\u5EF6\u5B9F\u884C\u30B9\u30B1\u30B8\u30E5\u30FC\u30E9 */
object SkillScheduler {
    private val logger = LoggerFactory.getLogger("${modId}-skills")
    private val tasks = mutableListOf<Pair<Long, () -> Unit>>()
    private var tick = 0L

    fun init() {
        ServerTickEvents.END_SERVER_TICK.register { _ ->
            tick++
            if (tasks.isEmpty()) return@register
            val due = tasks.filter { it.first <= tick }
            if (due.isEmpty()) return@register
            tasks.removeAll { it.first <= tick }
            for (entry in due) {
                try {
                    entry.second.invoke()
                } catch (e: Exception) {
                    logger.error("Skill task failed", e)
                }
            }
        }
    }

    fun runLater(delay: Int, task: () -> Unit) {
        tasks.add(Pair(tick + delay.coerceAtLeast(1), task))
    }

    fun currentTick(): Long = tick
}

object SkillRuntime {
    private val cooldowns = HashMap<String, Long>()

    /** \u30AF\u30FC\u30EB\u30C0\u30A6\u30F3\u4E2D\u306A\u3089 false */
    fun checkCooldown(skill: String, caster: Entity, seconds: Double): Boolean {
        if (seconds <= 0.0) return true
        val key = skill + ":" + caster.uuidAsString
        val now = SkillScheduler.currentTick()
        val until = cooldowns[key]
        if (until != null && until > now) return false
        cooldowns[key] = now + (seconds * 20.0).toLong()
        return true
    }

    fun contextOf(caster: Entity, target: Entity? = null, origin: Vec3d? = null): SkillContext? {
        val world = caster.world as? ServerWorld ?: return null
        return SkillContext(caster, target, world, origin ?: caster.pos)
    }

    /** <caster.name> <target.name> <caster.hp> \u30D7\u30EC\u30FC\u30B9\u30DB\u30EB\u30C0\u7F6E\u63DB */
    fun format(ctx: SkillContext, t: SkillTarget?, text: String): String {
        val targetName = t?.entity?.name?.string ?: ctx.target?.name?.string ?: ""
        val hp = (ctx.caster as? LivingEntity)?.health?.toInt()?.toString() ?: "0"
        var out = text
            .replace("<caster.name>", ctx.caster.name.string)
            .replace("<target.name>", targetName)
            .replace("<caster.hp>", hp)
        if (out.contains("<var.") || out.contains("<global.")) {
            out = VAR_PATTERN.replace(out) { m ->
                val owner = if (m.groupValues[1] == "global") null else ctx.caster
                Variables.format(Variables.get(ctx, owner, m.groupValues[2]))
            }
        }
        return out
    }

    private val VAR_PATTERN = Regex("<(var|global)\\\\.([A-Za-z0-9_]+)>")
}

/** \u6C38\u7D9A\u5909\u6570\u30B9\u30C8\u30EC\u30FC\u30B8 (\u30EF\u30FC\u30EB\u30C9\u306E data/${modId}_variables.dat \u306B\u4FDD\u5B58) */
class VariableState : PersistentState() {
    val data = HashMap<String, HashMap<String, Double>>()

    override fun writeNbt(nbt: NbtCompound, registryLookup: RegistryWrapper.WrapperLookup): NbtCompound {
        for ((owner, vars) in data) {
            val c = NbtCompound()
            for ((k, v) in vars) c.putDouble(k, v)
            nbt.put(owner, c)
        }
        return nbt
    }

    companion object {
        val TYPE: PersistentState.Type<VariableState> = PersistentState.Type(
            { VariableState() },
            { nbt, _ -> fromNbt(nbt) },
            null
        )

        fun fromNbt(nbt: NbtCompound): VariableState {
            val state = VariableState()
            for (owner in nbt.keys) {
                val c = nbt.getCompound(owner)
                val vars = HashMap<String, Double>()
                for (k in c.keys) vars[k] = c.getDouble(k)
                state.data[owner] = vars
            }
            return state
        }
    }
}

/** \u30B9\u30AD\u30EB\u5909\u6570 (MythicMobs \u306E Variable \u76F8\u5F53)\u3002owner=null \u3067\u30B0\u30ED\u30FC\u30D0\u30EB */
object Variables {
    private fun state(ctx: SkillContext): VariableState =
        ctx.world.server.overworld.persistentStateManager.getOrCreate(VariableState.TYPE, "${modId}_variables")

    private fun key(owner: Entity?): String = owner?.uuidAsString ?: "global"

    fun get(ctx: SkillContext, owner: Entity?, name: String): Double =
        state(ctx).data[key(owner)]?.get(name) ?: 0.0

    fun set(ctx: SkillContext, owner: Entity?, name: String, value: Double) {
        if (owner == null && name.isEmpty()) return
        val st = state(ctx)
        st.data.getOrPut(key(owner)) { HashMap() }[name] = value
        st.markDirty()
    }

    fun add(ctx: SkillContext, owner: Entity?, name: String, amount: Double, min: Double, max: Double) {
        set(ctx, owner, name, (get(ctx, owner, name) + amount).coerceIn(min, max))
    }

    fun inRange(ctx: SkillContext, owner: Entity?, name: String, min: Double, max: Double): Boolean {
        val v = get(ctx, owner, name)
        return v >= min && v <= max
    }

    fun format(v: Double): String = if (v == Math.floor(v) && !v.isInfinite()) v.toLong().toString() else String.format("%.2f", v)
}
`;
}
function targetersKt(pkg) {
  return `package ${pkg}.skill

import net.minecraft.entity.LivingEntity
import net.minecraft.entity.player.PlayerEntity
import net.minecraft.entity.projectile.ProjectileUtil
import net.minecraft.util.hit.HitResult
import net.minecraft.util.math.Box
import net.minecraft.util.math.Vec3d
import kotlin.math.cos
import kotlin.math.sin

object Targeters {
    fun self(ctx: SkillContext): List<SkillTarget> = listOf(SkillTarget(ctx.caster, ctx.caster.pos))

    fun target(ctx: SkillContext): List<SkillTarget> {
        val t = ctx.target ?: return emptyList()
        return listOf(SkillTarget(t, t.pos))
    }

    fun nearestPlayer(ctx: SkillContext, radius: Double): List<SkillTarget> {
        val p = ctx.world.players
            .filter { it !== ctx.caster && it.isAlive && !it.isSpectator && it.squaredDistanceTo(ctx.origin) <= radius * radius }
            .minByOrNull { it.squaredDistanceTo(ctx.origin) } ?: return emptyList()
        return listOf(SkillTarget(p, p.pos))
    }

    fun origin(ctx: SkillContext): List<SkillTarget> = listOf(SkillTarget(null, ctx.origin))

    fun selfLocation(ctx: SkillContext): List<SkillTarget> = listOf(SkillTarget(null, ctx.caster.pos))

    fun targetLocation(ctx: SkillContext): List<SkillTarget> {
        val t = ctx.target ?: return emptyList()
        return listOf(SkillTarget(null, t.pos))
    }

    fun entitiesInRadius(ctx: SkillContext, radius: Double, playersOnly: Boolean): List<SkillTarget> {
        val box = Box.of(ctx.origin, radius * 2.0, radius * 2.0, radius * 2.0)
        val except = if (playersOnly) null else ctx.caster
        return ctx.world.getOtherEntities(except, box) { e ->
            e.isAlive && e is LivingEntity && e.squaredDistanceTo(ctx.origin) <= radius * radius &&
                (!playersOnly || e is PlayerEntity)
        }.map { SkillTarget(it, it.pos) }
    }

    fun lookEntity(ctx: SkillContext, range: Double): List<SkillTarget> {
        val caster = ctx.caster
        val start = caster.eyePos
        val dir = caster.rotationVector
        val end = start.add(dir.multiply(range))
        val box = caster.boundingBox.stretch(dir.multiply(range)).expand(1.0)
        val hit = ProjectileUtil.raycast(caster, start, end, box, { e -> !e.isSpectator && e.canHit() }, range * range)
            ?: return emptyList()
        val e = hit.entity
        return listOf(SkillTarget(e, e.pos))
    }

    fun lookBlock(ctx: SkillContext, range: Double): List<SkillTarget> {
        val hit = ctx.caster.raycast(range, 0.0f, false)
        return if (hit.type == HitResult.Type.BLOCK) listOf(SkillTarget(null, hit.pos)) else emptyList()
    }

    fun forward(ctx: SkillContext, distance: Double): List<SkillTarget> {
        val pos = ctx.caster.pos.add(ctx.caster.rotationVector.multiply(distance))
        return listOf(SkillTarget(null, pos))
    }

    fun ring(ctx: SkillContext, radius: Double, points: Int): List<SkillTarget> {
        val n = points.coerceAtLeast(1)
        return (0 until n).map { i ->
            val a = Math.PI * 2.0 * i / n
            SkillTarget(null, Vec3d(ctx.origin.x + cos(a) * radius, ctx.origin.y, ctx.origin.z + sin(a) * radius))
        }
    }
}
`;
}
function conditionsKt(pkg) {
  return `package ${pkg}.skill

import net.minecraft.entity.Entity
import net.minecraft.entity.LivingEntity
import net.minecraft.entity.effect.StatusEffect
import net.minecraft.entity.player.PlayerEntity
import net.minecraft.registry.Registries
import net.minecraft.registry.entry.RegistryEntry

object Conditions {
    fun healthPercent(e: Entity?, min: Double, max: Double): Boolean {
        val living = e as? LivingEntity ?: return false
        val pct = living.health.toDouble() / living.maxHealth.toDouble() * 100.0
        return pct >= min && pct <= max
    }

    fun sneaking(e: Entity?): Boolean = e?.isSneaking == true
    fun sprinting(e: Entity?): Boolean = e?.isSprinting == true
    fun onGround(e: Entity?): Boolean = e?.isOnGround == true
    fun inWater(e: Entity?): Boolean = e?.isTouchingWater == true
    fun burning(e: Entity?): Boolean = e?.isOnFire == true
    fun isPlayer(e: Entity?): Boolean = e is PlayerEntity
    fun isLiving(e: Entity?): Boolean = e is LivingEntity

    fun day(ctx: SkillContext): Boolean = ctx.world.isDay
    fun night(ctx: SkillContext): Boolean = ctx.world.isNight
    fun raining(ctx: SkillContext): Boolean = ctx.world.isRaining
    fun chance(ctx: SkillContext, p: Double): Boolean = ctx.world.random.nextDouble() < p

    fun holding(e: Entity?, itemId: String): Boolean {
        val living = e as? LivingEntity ?: return false
        return Registries.ITEM.getId(living.mainHandStack.item).toString() == itemId
    }

    fun entityType(e: Entity?, typeId: String): Boolean {
        if (e == null) return false
        return Registries.ENTITY_TYPE.getId(e.type).toString() == typeId
    }

    fun dimension(ctx: SkillContext, id: String): Boolean = ctx.world.registryKey.value.toString() == id

    fun altitude(e: Entity?, min: Double, max: Double): Boolean = e != null && e.y >= min && e.y <= max

    fun wearing(e: Entity?, itemId: String): Boolean {
        val living = e as? LivingEntity ?: return false
        return living.armorItems.any { Registries.ITEM.getId(it.item).toString() == itemId }
    }

    fun hasEffect(e: Entity?, effect: RegistryEntry<StatusEffect>): Boolean =
        (e as? LivingEntity)?.hasStatusEffect(effect) == true
}
`;
}
function mechanicsKt(pkg) {
  return `package ${pkg}.skill

import net.minecraft.entity.EntityType
import net.minecraft.entity.ItemEntity
import net.minecraft.entity.LivingEntity
import net.minecraft.entity.effect.StatusEffect
import net.minecraft.entity.effect.StatusEffectInstance
import net.minecraft.entity.player.PlayerEntity
import net.minecraft.entity.projectile.ProjectileEntity
import net.minecraft.item.ItemStack
import net.minecraft.network.packet.s2c.play.SubtitleS2CPacket
import net.minecraft.network.packet.s2c.play.TitleS2CPacket
import net.minecraft.particle.ParticleEffect
import net.minecraft.registry.Registries
import net.minecraft.registry.entry.RegistryEntry
import net.minecraft.server.network.ServerPlayerEntity
import net.minecraft.sound.SoundCategory
import net.minecraft.sound.SoundEvent
import net.minecraft.text.Text
import net.minecraft.util.Identifier
import net.minecraft.util.math.BlockPos
import net.minecraft.util.math.Box
import net.minecraft.world.World

object Mechanics {
    fun damage(ctx: SkillContext, t: SkillTarget, amount: Float, magic: Boolean) {
        val e = t.entity ?: return
        val caster = ctx.caster
        val sources = ctx.world.damageSources
        val source = when {
            magic || e === caster -> sources.magic()
            caster is PlayerEntity -> sources.playerAttack(caster)
            caster is LivingEntity -> sources.mobAttack(caster)
            else -> sources.magic()
        }
        e.damage(source, amount)
    }

    fun heal(t: SkillTarget, amount: Float) {
        (t.entity as? LivingEntity)?.heal(amount)
    }

    fun ignite(t: SkillTarget, ticks: Int) {
        t.entity?.setOnFireForTicks(ticks)
    }

    fun extinguish(t: SkillTarget) {
        t.entity?.extinguish()
    }

    fun potion(t: SkillTarget, effect: RegistryEntry<StatusEffect>, duration: Int, amplifier: Int, particles: Boolean) {
        (t.entity as? LivingEntity)?.addStatusEffect(StatusEffectInstance(effect, duration, amplifier, false, particles))
    }

    fun clearEffects(t: SkillTarget) {
        (t.entity as? LivingEntity)?.clearStatusEffects()
    }

    fun freeze(t: SkillTarget, ticks: Int) {
        t.entity?.frozenTicks = ticks
    }

    fun velocity(t: SkillTarget, x: Double, y: Double, z: Double) {
        val e = t.entity ?: return
        e.addVelocity(x, y, z)
        e.velocityModified = true
    }

    fun leap(t: SkillTarget, forward: Double, up: Double) {
        val e = t.entity ?: return
        val look = e.rotationVector
        e.addVelocity(look.x * forward, up, look.z * forward)
        e.velocityModified = true
    }

    fun push(ctx: SkillContext, t: SkillTarget, strength: Double, up: Double) {
        val e = t.entity ?: return
        var dir = e.pos.subtract(ctx.caster.pos)
        if (dir.lengthSquared() < 1.0E-4) dir = ctx.caster.rotationVector
        dir = dir.normalize()
        e.addVelocity(dir.x * strength, up, dir.z * strength)
        e.velocityModified = true
    }

    fun teleport(ctx: SkillContext, t: SkillTarget) {
        ctx.caster.requestTeleport(t.pos.x, t.pos.y, t.pos.z)
    }

    fun projectile(ctx: SkillContext, t: SkillTarget, kind: String, speed: Float) {
        val shooter = ctx.caster as? LivingEntity ?: return
        val from = shooter.eyePos
        val aim = t.pos.add(0.0, (t.entity?.height ?: 0.0f) * 0.5, 0.0)
        val dir = if (t.entity === shooter || aim.squaredDistanceTo(from) < 1.0) shooter.rotationVector
            else aim.subtract(from).normalize()
        val type: EntityType<out ProjectileEntity> = when (kind) {
            "snowball" -> EntityType.SNOWBALL
            "fireball" -> EntityType.SMALL_FIREBALL
            "large_fireball" -> EntityType.FIREBALL
            "wither_skull" -> EntityType.WITHER_SKULL
            "trident" -> EntityType.TRIDENT
            else -> EntityType.ARROW
        }
        val proj = type.create(ctx.world) ?: return
        proj.owner = shooter
        proj.refreshPositionAndAngles(from.x + dir.x, from.y + dir.y - 0.1, from.z + dir.z, shooter.yaw, shooter.pitch)
        proj.setVelocity(dir.x, dir.y, dir.z, speed, 1.0f)
        ctx.world.spawnEntity(proj)
    }

    fun summon(ctx: SkillContext, t: SkillTarget, typeId: String, amount: Int) {
        val type = EntityType.get(typeId).orElse(null) ?: return
        repeat(amount.coerceAtLeast(1)) {
            val e = type.create(ctx.world) ?: return@repeat
            e.refreshPositionAndAngles(t.pos.x, t.pos.y, t.pos.z, ctx.world.random.nextFloat() * 360.0f, 0.0f)
            ctx.world.spawnEntity(e)
        }
    }

    fun lightning(ctx: SkillContext, t: SkillTarget, cosmetic: Boolean) {
        val bolt = EntityType.LIGHTNING_BOLT.create(ctx.world) ?: return
        bolt.refreshPositionAfterTeleport(t.pos)
        bolt.setCosmetic(cosmetic)
        ctx.world.spawnEntity(bolt)
    }

    fun explosion(ctx: SkillContext, t: SkillTarget, power: Float, fire: Boolean, breakBlocks: Boolean) {
        val type = if (breakBlocks) World.ExplosionSourceType.TNT else World.ExplosionSourceType.NONE
        ctx.world.createExplosion(ctx.caster, t.pos.x, t.pos.y, t.pos.z, power, fire, type)
    }

    fun setBlock(ctx: SkillContext, t: SkillTarget, blockId: String) {
        val block = Registries.BLOCK.get(Identifier.of(blockId))
        ctx.world.setBlockState(BlockPos.ofFloored(t.pos), block.defaultState)
    }

    fun particles(ctx: SkillContext, t: SkillTarget, particle: ParticleEffect, count: Int, spread: Double, speed: Double, yOffset: Double) {
        ctx.world.spawnParticles(particle, t.pos.x, t.pos.y + yOffset, t.pos.z, count, spread, spread, spread, speed)
    }

    fun sound(ctx: SkillContext, t: SkillTarget, soundId: String, volume: Float, pitch: Float) {
        val event = SoundEvent.of(Identifier.of(soundId))
        ctx.world.playSound(null, t.pos.x, t.pos.y, t.pos.z, event, SoundCategory.PLAYERS, volume, pitch)
    }

    fun message(ctx: SkillContext, t: SkillTarget, text: String, actionBar: Boolean) {
        val player = t.entity as? PlayerEntity ?: return
        player.sendMessage(Text.literal(SkillRuntime.format(ctx, t, text)), actionBar)
    }

    fun title(ctx: SkillContext, t: SkillTarget, title: String, subtitle: String) {
        val player = t.entity as? ServerPlayerEntity ?: return
        if (subtitle.isNotEmpty()) {
            player.networkHandler.sendPacket(SubtitleS2CPacket(Text.literal(SkillRuntime.format(ctx, t, subtitle))))
        }
        player.networkHandler.sendPacket(TitleS2CPacket(Text.literal(SkillRuntime.format(ctx, t, title))))
    }

    fun giveItem(t: SkillTarget, itemId: String, amount: Int) {
        val player = t.entity as? PlayerEntity ?: return
        val item = Registries.ITEM.get(Identifier.of(itemId))
        player.giveItemStack(ItemStack(item, amount))
    }

    fun feed(t: SkillTarget, food: Int, saturation: Float) {
        (t.entity as? PlayerEntity)?.hungerManager?.add(food, saturation)
    }

    fun addXp(t: SkillTarget, amount: Int) {
        (t.entity as? PlayerEntity)?.addExperience(amount)
    }

    fun command(ctx: SkillContext, t: SkillTarget, cmd: String, asConsole: Boolean) {
        val server = ctx.world.server
        val source = if (asConsole) {
            server.commandSource.withWorld(ctx.world).withPosition(t.pos).withSilent()
        } else {
            (t.entity ?: ctx.caster).commandSource.withLevel(2).withSilent()
        }
        server.commandManager.executeWithPrefix(source, SkillRuntime.format(ctx, t, cmd))
    }

    fun beam(ctx: SkillContext, t: SkillTarget, particle: ParticleEffect, density: Double) {
        val from = ctx.caster.eyePos.subtract(0.0, 0.2, 0.0)
        val to = t.pos.add(0.0, (t.entity?.height ?: 0.0f) * 0.5, 0.0)
        val diff = to.subtract(from)
        val steps = (diff.length() * density).toInt().coerceIn(1, 400)
        for (i in 0..steps) {
            val p = from.add(diff.multiply(i.toDouble() / steps))
            ctx.world.spawnParticles(particle, p.x, p.y, p.z, 1, 0.0, 0.0, 0.0, 0.0)
        }
    }

    fun dropItem(ctx: SkillContext, t: SkillTarget, itemId: String, amount: Int) {
        val item = Registries.ITEM.get(Identifier.of(itemId))
        val entity = ItemEntity(ctx.world, t.pos.x, t.pos.y + 0.5, t.pos.z, ItemStack(item, amount.coerceAtLeast(1)))
        ctx.world.spawnEntity(entity)
    }

    fun remove(t: SkillTarget) {
        val e = t.entity ?: return
        if (e !is PlayerEntity) e.discard()
    }

    fun setHealthPercent(t: SkillTarget, percent: Float) {
        val e = t.entity as? LivingEntity ?: return
        e.health = (e.maxHealth * percent / 100.0f).coerceIn(0.0f, e.maxHealth)
    }

    /** tick \u3054\u3068\u306B\u79FB\u52D5\u3059\u308B\u4EEE\u60F3\u5F3E\u3002\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3 or \u30D6\u30ED\u30C3\u30AF\u306B\u5F53\u305F\u308B\u3068 onHit \u3092\u547C\u3076 */
    fun missile(
        ctx: SkillContext, t: SkillTarget, speed: Double, maxTicks: Int, radius: Double, gravity: Double,
        particle: ParticleEffect, hitBlocks: Boolean, onHit: (SkillContext) -> Unit
    ) {
        val caster = ctx.caster
        val start = caster.eyePos.subtract(0.0, 0.2, 0.0)
        val aim = t.pos.add(0.0, (t.entity?.height ?: 0.0f) * 0.5, 0.0)
        val initial = if (t.entity === caster || aim.squaredDistanceTo(start) < 1.0) caster.rotationVector else aim.subtract(start).normalize()
        var pos = start
        var vel = initial.multiply(speed)
        var age = 0
        val world = ctx.world
        fun tick() {
            val steps = (vel.length() / 0.5).toInt().coerceIn(1, 10)
            val step = vel.multiply(1.0 / steps)
            for (i in 0 until steps) {
                pos = pos.add(step)
                world.spawnParticles(particle, pos.x, pos.y, pos.z, 1, 0.0, 0.0, 0.0, 0.0)
                val box = Box.of(pos, radius * 2.0, radius * 2.0, radius * 2.0)
                val hit = world.getOtherEntities(caster, box) { it is LivingEntity && it.isAlive && !it.isSpectator }.firstOrNull()
                if (hit != null) {
                    onHit(ctx.copy(target = hit, origin = pos))
                    return
                }
                val bp = BlockPos.ofFloored(pos)
                if (hitBlocks && !world.getBlockState(bp).getCollisionShape(world, bp).isEmpty) {
                    onHit(ctx.copy(target = null, origin = pos.subtract(step)))
                    return
                }
            }
            vel = vel.add(0.0, -gravity, 0.0)
            age++
            if (age >= maxTicks) {
                onHit(ctx.copy(target = null, origin = pos))
                return
            }
            SkillScheduler.runLater(1) { tick() }
        }
        tick()
    }

    fun repeatSkill(times: Int, interval: Int, action: (Int) -> Unit) {
        for (i in 0 until times.coerceAtLeast(1)) {
            if (i == 0) action(0) else SkillScheduler.runLater(i * interval.coerceAtLeast(1)) { action(i) }
        }
    }
}
`;
}

// ../mod/mythiccraft-studio/src/lib/mod/skillText.ts
function fmtVal(v) {
  const s = String(v);
  if (/^[A-Za-z0-9_.:\-+<>%]+$/.test(s) && s.length > 0) return s;
  return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n") + '"';
}
function fmtParams(p) {
  const entries = Object.entries(p);
  if (entries.length === 0) return "";
  return "{" + entries.map(([k, v]) => `${k}=${fmtVal(v)}`).join(";") + "}";
}
function serializeLine(l) {
  const mech = findMechanic(l.mechanic);
  let s = `- ${mech ? mech.id : l.mechanic}${fmtParams(l.params)}`;
  if (!mech?.noTargeter) {
    const t = findTargeter(l.targeter);
    s += ` @${t ? t.id : l.targeter}${fmtParams(l.targeterParams)}`;
  }
  for (const c of l.conditions) {
    const cd = findCondition(c.type);
    s += ` ?${c.negate ? "!" : ""}${cd ? cd.id : c.type}${fmtParams(c.params)}`;
  }
  return s;
}

// ../mod/mythiccraft-studio/src/lib/mod/mobgen.ts
function ktStr(s) {
  return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/\n/g, "\\n") + '"';
}
function d(n) {
  const v = Number.isFinite(n) ? n : 0;
  return Number.isInteger(v) ? v.toFixed(1) : String(v);
}
function mobFnName(name) {
  return "apply" + name.replace(/[^A-Za-z0-9]/g, "_").replace(/^./, (c) => c.toUpperCase());
}
var SLOTS = [
  ["mainhand", "MAINHAND"],
  ["offhand", "OFFHAND"],
  ["head", "HEAD"],
  ["chest", "CHEST"],
  ["legs", "LEGS"],
  ["feet", "FEET"]
];
function applyFn(m) {
  const lines = [];
  lines.push(`e.addCommandTag(TAG + ${ktStr(m.name)})`);
  if (m.displayName.trim()) {
    lines.push(`e.customName = Text.literal(${ktStr(m.displayName)})`);
    lines.push(`e.isCustomNameVisible = ${m.showName}`);
  }
  if (m.glowing) lines.push(`e.isGlowing = true`);
  if (m.silent) lines.push(`e.isSilent = true`);
  const living = [];
  living.push(`setAttr(e, EntityAttributes.GENERIC_MAX_HEALTH, ${d(m.health)})`);
  living.push(`e.health = ${d(m.health)}f`);
  living.push(`setAttr(e, EntityAttributes.GENERIC_ATTACK_DAMAGE, ${d(m.damage)})`);
  if (m.speedMultiplier !== 1) living.push(`mulAttr(e, EntityAttributes.GENERIC_MOVEMENT_SPEED, ${d(m.speedMultiplier)})`);
  if (m.armor > 0) living.push(`setAttr(e, EntityAttributes.GENERIC_ARMOR, ${d(m.armor)})`);
  if (m.knockbackResistance > 0) living.push(`setAttr(e, EntityAttributes.GENERIC_KNOCKBACK_RESISTANCE, ${d(Math.min(1, m.knockbackResistance))})`);
  for (const [k, slot] of SLOTS) if (m.equipment[k]?.trim()) living.push(`equip(e, EquipmentSlot.${slot}, ${ktStr(m.equipment[k].trim())})`);
  for (const ef of m.effects)
    living.push(`e.addStatusEffect(StatusEffectInstance(StatusEffects.${ef.type.toUpperCase()}, StatusEffectInstance.INFINITE, ${Math.max(0, Math.trunc(ef.level))}, false, false))`);
  lines.push(`if (e is LivingEntity) {
${living.map((l) => "    " + l).join("\n")}
}`);
  if (m.persistent) lines.push(`(e as? MobEntity)?.setPersistent()`);
  return `    /** ${m.displayName.replace(/\*\//g, "")} (${m.baseType}) */
    private fun ${mobFnName(m.name)}(e: Entity) {
${lines.map((l) => l.split("\n").map((x) => "        " + x).join("\n")).join("\n")}
    }`;
}
function genCustomMobsKt(p, fnMap) {
  const pkg = p.meta.packageName;
  const mobs = p.mobs;
  const names = mobs.map((m) => ktStr(m.name)).join(", ");
  const baseCases = mobs.map((m) => `            ${ktStr(m.name)} -> ${ktStr(m.baseType)}`).join("\n");
  const applyCases = mobs.map((m) => `            ${ktStr(m.name)} -> ${mobFnName(m.name)}(e)`).join("\n");
  const fireCases = [];
  const timers = [];
  for (const m of mobs) {
    const by = /* @__PURE__ */ new Map();
    for (const t of m.triggers) {
      const fn = fnMap.get(t.skill);
      if (!fn) continue;
      if (t.trigger === "onTimer") {
        const iv = Math.max(1, Math.trunc(t.interval ?? 40));
        const ex = timers.find((x) => x.mob === m.name && x.interval === iv);
        if (ex) ex.skills.push(fn);
        else timers.push({ mob: m.name, interval: iv, skills: [fn] });
        continue;
      }
      by.set(t.trigger, [...by.get(t.trigger) ?? [], fn]);
    }
    for (const [tr, fns] of by) fireCases.push(`            ${ktStr(m.name + ":" + tr)} -> {
${fns.map((f) => `                Skills.${f}(ctx)`).join("\n")}
            }`);
  }
  for (const t of timers)
    fireCases.push(`            ${ktStr(`${t.mob}:onTimer:${t.interval}`)} -> {
${t.skills.map((f) => `                Skills.${f}(ctx)`).join("\n")}
            }`);
  const dropCases = mobs.filter((m) => m.drops.length || m.xp > 0).map((m) => {
    const ls = m.drops.map((dr) => `                drop(e, ${ktStr(dr.item)}, ${Math.max(1, Math.trunc(dr.min))}, ${Math.max(Math.trunc(dr.min), Math.trunc(dr.max), 1)}, ${d(dr.chance)})`);
    if (m.xp > 0) ls.push(`                xp(e, ${Math.trunc(m.xp)})`);
    return `            ${ktStr(m.name)} -> {
${ls.join("\n")}
            }`;
  });
  const timerCode = timers.map((t) => `            if (ticks % ${t.interval}L == 0L) forEachMob(server, ${ktStr(t.mob)}) { mob -> fire(${ktStr(t.mob)}, ${ktStr(`onTimer:${t.interval}`)}, mob, (mob as? MobEntity)?.target) }`).join("\n");
  const natural = mobs.filter((m) => m.naturalSpawn && m.spawnChance > 0);
  const naturalCode = natural.map((m) => `                if (typeId == ${ktStr(m.baseType)} && world.random.nextDouble() < ${d(m.spawnChance)}) {
                    apply(${ktStr(m.name)}, entity)
                    SkillScheduler.runLater(1) { fire(${ktStr(m.name)}, "onSpawn", entity, null) }
                    return@register
                }`).join("\n");
  return `package ${pkg}.skill

import net.fabricmc.fabric.api.entity.event.v1.ServerLivingEntityEvents
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerEntityEvents
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents
import net.minecraft.entity.Entity
import net.minecraft.entity.EntityType
import net.minecraft.entity.EquipmentSlot
import net.minecraft.entity.ExperienceOrbEntity
import net.minecraft.entity.LivingEntity
import net.minecraft.entity.attribute.EntityAttribute
import net.minecraft.entity.attribute.EntityAttributes
import net.minecraft.entity.effect.StatusEffectInstance
import net.minecraft.entity.effect.StatusEffects
import net.minecraft.entity.mob.MobEntity
import net.minecraft.item.ItemStack
import net.minecraft.registry.Registries
import net.minecraft.registry.entry.RegistryEntry
import net.minecraft.server.MinecraftServer
import net.minecraft.server.world.ServerWorld
import net.minecraft.text.Text
import net.minecraft.util.Identifier
import net.minecraft.util.math.Vec3d

/**
 * \u30AB\u30B9\u30BF\u30E0\u30E2\u30D6 (MythicMobs \u65B9\u5F0F)
 * \u30D0\u30CB\u30E9\u306E\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3\u306B\u30BF\u30B0\u30FB\u540D\u524D\u30FB\u5C5E\u6027\u30FB\u88C5\u5099\u30FB\u30B9\u30AD\u30EB\u3092\u4ED8\u4E0E\u3057\u3066\u5B9F\u88C5\u3057\u307E\u3059\uFF08\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u5074\u306E\u8FFD\u52A0\u63CF\u753B\u306F\u4E0D\u8981\uFF09\u3002
 */
object CustomMobs {
    private const val TAG = "mcs_mob:"
    private const val CHECKED = "mcs_checked"
    private var ticks = 0L
    private var handlingDamage = false

    val NAMES: List<String> = listOf(${names})

    fun idOf(e: Entity?): String? = e?.commandTags?.firstOrNull { it.startsWith(TAG) }?.removePrefix(TAG)

    fun isMob(e: Entity?, id: String): Boolean = idOf(e) == id

    fun spawn(name: String, world: ServerWorld, pos: Vec3d): Entity? {
        val base: String = when (name) {
${baseCases ? baseCases + "\n" : ""}            else -> return null
        }
        val type = EntityType.get(base).orElse(null) ?: return null
        val e = type.create(world) ?: return null
        e.refreshPositionAndAngles(pos.x, pos.y, pos.z, world.random.nextFloat() * 360.0f, 0.0f)
        e.addCommandTag(CHECKED)
        apply(name, e)
        world.spawnEntity(e)
        fire(name, "onSpawn", e, null)
        return e
    }

    fun apply(name: String, e: Entity) {
        when (name) {
${applyCases ? applyCases + "\n" : ""}            else -> {}
        }
    }
${mobs.length ? "\n" + mobs.map(applyFn).join("\n\n") + "\n" : ""}
    private fun setAttr(e: LivingEntity, attr: RegistryEntry<EntityAttribute>, value: Double) {
        e.getAttributeInstance(attr)?.baseValue = value
    }

    private fun mulAttr(e: LivingEntity, attr: RegistryEntry<EntityAttribute>, factor: Double) {
        val inst = e.getAttributeInstance(attr) ?: return
        inst.baseValue = inst.baseValue * factor
    }

    private fun equip(e: LivingEntity, slot: EquipmentSlot, itemId: String) {
        e.equipStack(slot, ItemStack(Registries.ITEM.get(Identifier.of(itemId))))
        (e as? MobEntity)?.setEquipmentDropChance(slot, 0.0f)
    }

    private fun fire(name: String, trigger: String, caster: Entity, target: Entity?) {
        val ctx = SkillRuntime.contextOf(caster, target) ?: return
        when (name + ":" + trigger) {
${fireCases.length ? fireCases.join("\n") + "\n" : ""}            else -> {}
        }
    }

    private fun drop(e: LivingEntity, itemId: String, min: Int, max: Int, chance: Double) {
        val world = e.world as? ServerWorld ?: return
        if (world.random.nextDouble() >= chance) return
        val count = min + world.random.nextInt(max - min + 1)
        e.dropStack(ItemStack(Registries.ITEM.get(Identifier.of(itemId)), count))
    }

    private fun xp(e: LivingEntity, amount: Int) {
        val world = e.world as? ServerWorld ?: return
        ExperienceOrbEntity.spawn(world, e.pos, amount)
    }

    private fun drops(name: String, e: LivingEntity) {
        when (name) {
${dropCases.length ? dropCases.join("\n") + "\n" : ""}            else -> {}
        }
    }

    private fun forEachMob(server: MinecraftServer, name: String, action: (Entity) -> Unit) {
        for (world in server.worlds) {
            val list = world.iterateEntities().filter { it.isAlive && idOf(it) == name }
            for (mob in list) action(mob)
        }
    }

    fun init() {
        ServerLivingEntityEvents.AFTER_DEATH.register { entity, source ->
            val name = idOf(entity) ?: return@register
            drops(name, entity)
            fire(name, "onDeath", entity, source.attacker)
        }
        ServerLivingEntityEvents.ALLOW_DAMAGE.register { entity, source, _ ->
            if (!handlingDamage) {
                handlingDamage = true
                try {
                    val attacker = source.attacker
                    val victimId = idOf(entity)
                    if (victimId != null) fire(victimId, "onDamaged", entity, attacker)
                    val attackerId = idOf(attacker)
                    if (attackerId != null && attacker != null) fire(attackerId, "onAttack", attacker, entity)
                } finally {
                    handlingDamage = false
                }
            }
            true
        }
        ServerTickEvents.END_SERVER_TICK.register { server ->
            ticks++
${timerCode ? timerCode + "\n" : ""}        }
        ServerEntityEvents.ENTITY_LOAD.register { entity, world ->
            if (entity.commandTags.contains(CHECKED)) return@register
            entity.addCommandTag(CHECKED)
            if (idOf(entity) != null) return@register
            val typeId = Registries.ENTITY_TYPE.getId(entity.type).toString()
${naturalCode ? naturalCode + "\n" : `            if (typeId.isEmpty() || world.isClient) return@register
`}        }
    }
}
`;
}
function ing(id) {
  const s = id.trim();
  return s.startsWith("#") ? { tag: s.slice(1) } : { item: s };
}
function shapedFromGrid(grid) {
  const cells = Array.from({ length: 9 }, (_, i) => (grid[i] ?? "").trim());
  const rows = [0, 1, 2].filter((r) => [0, 1, 2].some((c) => cells[r * 3 + c]));
  const cols = [0, 1, 2].filter((c) => [0, 1, 2].some((r) => cells[r * 3 + c]));
  const symbols = "ABCDEFGHI";
  const key = {};
  const map = /* @__PURE__ */ new Map();
  const pattern = rows.map(
    (r) => cols.map((c) => {
      const id = cells[r * 3 + c];
      if (!id) return " ";
      if (!map.has(id)) {
        const sym = symbols[map.size];
        map.set(id, sym);
        key[sym] = id;
      }
      return map.get(id);
    }).join("")
  );
  return { pattern, key };
}
function recipeJson(r) {
  const result = { id: r.result.trim(), count: Math.max(1, Math.trunc(r.count)) };
  switch (r.type) {
    case "shaped": {
      const { pattern, key } = shapedFromGrid(r.grid);
      return {
        type: "minecraft:crafting_shaped",
        category: "misc",
        pattern,
        key: Object.fromEntries(Object.entries(key).map(([k, v]) => [k, ing(v)])),
        result
      };
    }
    case "shapeless":
      return { type: "minecraft:crafting_shapeless", category: "misc", ingredients: r.grid.filter((g) => g.trim()).map(ing), result };
    case "stonecutting":
      return { type: "minecraft:stonecutting", ingredient: ing(r.input), result };
    default:
      return {
        type: `minecraft:${r.type}`,
        category: "misc",
        ingredient: ing(r.input),
        result: { id: r.result.trim() },
        experience: r.experience,
        cookingtime: Math.max(1, Math.trunc(r.cookingTime))
      };
  }
}
function genRecipes(p) {
  return p.recipes.map((r) => ({
    path: `src/main/resources/data/${p.meta.modId}/recipe/${r.name}.json`,
    content: JSON.stringify(recipeJson(r), null, 2) + "\n",
    language: "json"
  }));
}

// ../mod/mythiccraft-studio/src/lib/mod/codegen.ts
var KOTLIN_KEYWORDS = /* @__PURE__ */ new Set([
  "as",
  "break",
  "class",
  "continue",
  "do",
  "else",
  "false",
  "for",
  "fun",
  "if",
  "in",
  "interface",
  "is",
  "null",
  "object",
  "package",
  "return",
  "super",
  "this",
  "throw",
  "true",
  "try",
  "typealias",
  "typeof",
  "val",
  "var",
  "when",
  "while"
]);
function toPascal(s) {
  return s.split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
}
function toConst(s) {
  return s.replace(/[^A-Za-z0-9]+/g, "_").replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
}
function skillFnName(name) {
  let n = name.replace(/[^A-Za-z0-9_]/g, "_");
  if (!n) n = "unnamed";
  if (/^[0-9]/.test(n)) n = "s_" + n;
  n = n[0].toLowerCase() + n.slice(1);
  if (KOTLIN_KEYWORDS.has(n)) n = n + "Skill";
  return n;
}
function jsonStr(o) {
  return JSON.stringify(o, null, 2) + "\n";
}
function indent(code, n) {
  const pad = " ".repeat(n);
  return code.split("\n").map((l) => l.trim() ? pad + l : l).join("\n");
}
function ktStr2(s) {
  return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/\n/g, "\\n") + '"';
}
function importBlock(set) {
  return [...set].sort().map((i) => `import ${i}`).join("\n");
}
function condExpr(conds, entityExpr, g) {
  const parts = [];
  for (const c of conds) {
    const def = findCondition(c.type);
    if (!def) continue;
    const e = def.gen(c.params, entityExpr, g);
    parts.push(c.negate ? `!${e}` : e);
  }
  return parts.length ? parts.join(" && ") : null;
}
function genLines(skill, lines, startIndex, g) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = startIndex + i + 1;
    const mech = findMechanic(line.mechanic);
    out.push(`// ${serializeLine(line)}`);
    if (!mech) {
      out.push(`// \u26A0 \u4E0D\u660E\u306A\u30E1\u30AB\u30CB\u30C3\u30AF: ${line.mechanic}`);
      continue;
    }
    if (mech.id === "delay") {
      const ticks = Math.max(1, Math.trunc(Number(line.params.ticks ?? 20)) || 20);
      const rest = genLines(skill, lines.slice(i + 1), startIndex + i + 1, g);
      out.push(`SkillScheduler.runLater(${ticks}) {`);
      out.push(indent(rest, 4));
      out.push(`}`);
      break;
    }
    const targ = findTargeter(line.targeter) ?? TARGETERS[0];
    const cond = condExpr(line.conditions, "t.entity", g);
    const body = [];
    if (cond) body.push(`if (!(${cond})) continue`);
    if (mech.id === "kotlin") {
      body.push(`val e = t.entity`);
      body.push(`// @origin skill=${skill.name} line=${lineNo}`);
      body.push(`run {`);
      body.push(indent(String(line.params.code ?? ""), 4));
      body.push(`}`);
      body.push(`// @end`);
    } else {
      body.push(mech.gen(line.params, g));
    }
    out.push(`for (t in ${targ.gen(line.targeterParams)}) {`);
    out.push(indent(body.join("\n"), 4));
    out.push(`}`);
  }
  return out.join("\n");
}
function genSkillsKt(p) {
  const pkg = p.meta.packageName;
  const fnMap = /* @__PURE__ */ new Map();
  for (const s of p.skills) fnMap.set(s.name, skillFnName(s.name));
  const g = { imports: /* @__PURE__ */ new Set(), skillFn: (n) => fnMap.get(n) };
  const bodies = [];
  for (const s of p.skills) {
    const fn = fnMap.get(s.name);
    for (const imp of (s.imports || "").split("\n").map((x) => x.trim().replace(/^import\s+/, "")).filter(Boolean)) g.imports.add(imp);
    const lines = [];
    if (s.cooldown > 0) lines.push(`if (!SkillRuntime.checkCooldown(${ktStr2(s.name)}, ctx.caster, ${kDouble(s.cooldown)})) return`);
    const cond = condExpr(s.conditions, "ctx.caster", g);
    if (cond) lines.push(`if (!(${cond})) return`);
    lines.push(genLines(s, s.lines, 0, g));
    const doc = s.description ? `    /** ${s.description.replace(/\*\//g, "* /").replace(/\n/g, " ")} */
` : "";
    bodies.push(`${doc}    fun ${fn}(ctx: SkillContext) {
${indent(lines.join("\n"), 8)}
    }`);
  }
  const names = p.skills.map((s) => ktStr2(s.name)).join(", ");
  const cases = p.skills.map((s) => `            ${ktStr2(s.name)} -> ${fnMap.get(s.name)}(ctx)`).join("\n");
  const imports = importBlock(g.imports);
  return `package ${pkg}.skill
${imports ? "\n" + imports + "\n" : ""}
/**
 * \u81EA\u52D5\u751F\u6210\u3055\u308C\u305F\u30B9\u30AD\u30EB\u5B9A\u7FA9 (MythicCraft Studio)
 * \u5404\u30B9\u30AD\u30EB\u306F SkillContext \u3092\u53D7\u3051\u53D6\u308A\u3001\u30BF\u30FC\u30B2\u30C3\u30BF\u30FC \u2192 \u6761\u4EF6 \u2192 \u30E1\u30AB\u30CB\u30C3\u30AF \u306E\u9806\u306B\u5B9F\u884C\u3055\u308C\u307E\u3059\u3002
 */
object Skills {
    val NAMES: List<String> = listOf(${names})

    fun cast(name: String, ctx: SkillContext): Boolean {
        when (name) {
${cases ? cases + "\n" : ""}            else -> return false
        }
        return true
    }
${bodies.length ? "\n" + bodies.join("\n\n") + "\n" : ""}}
`;
}
function call(skills, ctxExpr, fnMap) {
  const fns = skills.map((s) => fnMap.get(s)).filter(Boolean);
  if (fns.length === 0) return `// (\u30B9\u30AD\u30EB\u672A\u8A2D\u5B9A)`;
  return `${ctxExpr}?.let { ctx ->
${fns.map((f) => `    Skills.${f}(ctx)`).join("\n")}
}`;
}
var ARMOR_KINDS = /* @__PURE__ */ new Set(["helmet", "chestplate", "leggings", "boots"]);
var ARMOR_DURABILITY = { LEATHER: 5, CHAIN: 15, IRON: 15, GOLD: 7, DIAMOND: 33, NETHERITE: 37, TURTLE: 25 };
var isArmor = (k) => ARMOR_KINDS.has(k);
var ITEM_BASE = {
  basic: "Item",
  food: "Item",
  sword: "SwordItem",
  pickaxe: "PickaxeItem",
  axe: "AxeItem",
  shovel: "ShovelItem",
  hoe: "HoeItem"
};
function genItemsKt(p, fnMap) {
  const pkg = p.meta.packageName;
  const imp = /* @__PURE__ */ new Set([
    "net.minecraft.item.Item",
    "net.minecraft.registry.Registries",
    "net.minecraft.registry.Registry",
    "net.minecraft.util.Identifier"
  ]);
  const regs = [];
  const classes = [];
  for (const it of p.items) {
    const cls = toPascal(it.registryName) + "Item";
    const armor = isArmor(it.kind);
    const isTool = it.kind !== "basic" && it.kind !== "food" && !armor;
    let settings = "Item.Settings()";
    if (armor) {
      imp.add("net.minecraft.item.ArmorItem");
      imp.add("net.minecraft.item.ArmorMaterials");
      settings += `.maxDamage(ArmorItem.Type.${it.kind.toUpperCase()}.getMaxDamage(${ARMOR_DURABILITY[it.armorMaterial ?? "IRON"] ?? 15}))`;
    } else if (!isTool) settings += `.maxCount(${Math.max(1, Math.min(99, it.maxCount || 64))})`;
    if (it.fireproof) settings += ".fireproof()";
    if (it.rarity !== "COMMON") {
      imp.add("net.minecraft.util.Rarity");
      settings += `.rarity(Rarity.${it.rarity})`;
    }
    if (it.kind === "food") {
      imp.add("net.minecraft.component.type.FoodComponent");
      settings += `.food(FoodComponent.Builder().nutrition(${Math.trunc(it.nutrition)}).saturationModifier(${kDouble(it.saturation)}f)${it.alwaysEdible ? ".alwaysEdible()" : ""}.build())`;
    }
    if (isTool) {
      imp.add("net.minecraft.item.ToolMaterials");
      if (it.kind === "sword") {
        imp.add("net.minecraft.item.SwordItem");
        settings += `.attributeModifiers(SwordItem.createAttributeModifiers(ToolMaterials.${it.material}, ${Math.trunc(it.attackDamage)}, ${kDouble(it.attackSpeed)}f))`;
      } else {
        imp.add("net.minecraft.item.MiningToolItem");
        imp.add(`net.minecraft.item.${ITEM_BASE[it.kind]}`);
        settings += `.attributeModifiers(MiningToolItem.createAttributeModifiers(ToolMaterials.${it.material}, ${kDouble(it.attackDamage)}f, ${kDouble(it.attackSpeed)}f))`;
      }
    }
    regs.push(`    val ${toConst(it.registryName)}: Item = register(${ktStr2(it.registryName)}, ${cls}(${settings}))`);
    const base = ITEM_BASE[it.kind];
    const superCall = armor ? `ArmorItem(ArmorMaterials.${it.armorMaterial ?? "IRON"}, ArmorItem.Type.${it.kind.toUpperCase()}, settings)` : isTool ? `${base}(ToolMaterials.${it.material}, settings)` : `Item(settings)`;
    const members = [];
    const by = (tr) => it.triggers.filter((t) => t.trigger === tr).map((t) => t.skill);
    const onUse = by("onUse");
    if (onUse.length || it.useCooldown > 0) {
      ["net.minecraft.world.World", "net.minecraft.entity.player.PlayerEntity", "net.minecraft.util.Hand", "net.minecraft.util.TypedActionResult", "net.minecraft.item.ItemStack", `${pkg}.skill.SkillRuntime`, `${pkg}.skill.Skills`].forEach((x) => imp.add(x));
      const ret = it.kind === "food" ? "super.use(world, user, hand)" : "TypedActionResult.success(stack, world.isClient)";
      members.push(`    override fun use(world: World, user: PlayerEntity, hand: Hand): TypedActionResult<ItemStack> {
        val stack = user.getStackInHand(hand)
        if (!world.isClient) {
${indent(call(onUse, "SkillRuntime.contextOf(user)", fnMap), 12)}${it.useCooldown > 0 ? `
            user.itemCooldownManager.set(this, ${Math.trunc(it.useCooldown)})` : ""}
        }
        return ${ret}
    }`);
    }
    const onAttack = by("onAttack");
    if (onAttack.length) {
      ["net.minecraft.item.ItemStack", "net.minecraft.entity.LivingEntity", `${pkg}.skill.SkillRuntime`, `${pkg}.skill.Skills`].forEach((x) => imp.add(x));
      members.push(`    override fun postHit(stack: ItemStack, target: LivingEntity, attacker: LivingEntity): Boolean {
        if (!attacker.world.isClient) {
${indent(call(onAttack, "SkillRuntime.contextOf(attacker, target, target.pos)", fnMap), 12)}
        }
        return super.postHit(stack, target, attacker)
    }`);
    }
    const onEat = by("onEat");
    if (onEat.length) {
      ["net.minecraft.item.ItemStack", "net.minecraft.entity.LivingEntity", "net.minecraft.world.World", `${pkg}.skill.SkillRuntime`, `${pkg}.skill.Skills`].forEach((x) => imp.add(x));
      members.push(`    override fun finishUsing(stack: ItemStack, world: World, user: LivingEntity): ItemStack {
        if (!world.isClient) {
${indent(call(onEat, "SkillRuntime.contextOf(user)", fnMap), 12)}
        }
        return super.finishUsing(stack, world, user)
    }`);
    }
    if (it.glint) {
      imp.add("net.minecraft.item.ItemStack");
      members.push(`    override fun hasGlint(stack: ItemStack): Boolean = true`);
    }
    if (it.tooltip.trim()) {
      ["net.minecraft.item.ItemStack", "net.minecraft.text.Text", "net.minecraft.util.Formatting", "net.minecraft.item.tooltip.TooltipType"].forEach((x) => imp.add(x));
      const adds = it.tooltip.split("\n").filter((l) => l.trim()).map((l) => `        tooltip.add(Text.literal(${ktStr2(l)}).formatted(Formatting.GRAY))`).join("\n");
      members.push(`    override fun appendTooltip(stack: ItemStack, context: Item.TooltipContext, tooltip: MutableList<Text>, type: TooltipType) {
${adds}
        super.appendTooltip(stack, context, tooltip, type)
    }`);
    }
    classes.push(
      `/** ${it.displayName} */
class ${cls}(settings: Item.Settings) : ${superCall}${members.length ? ` {
${members.join("\n\n")}
}` : ""}`
    );
  }
  return `package ${pkg}

${importBlock(imp)}

object ModItems {
${regs.join("\n")}${regs.length ? "\n\n" : ""}    private fun register(name: String, item: Item): Item =
        Registry.register(Registries.ITEM, Identifier.of(${p.meta.mainClass}.MOD_ID, name), item)

    fun init() {
        ${p.meta.mainClass}.LOGGER.info("Registered ${p.items.length} items")
    }
}
${classes.length ? "\n" + classes.join("\n\n") + "\n" : ""}`;
}
function genBlocksKt(p, fnMap) {
  const pkg = p.meta.packageName;
  const imp = /* @__PURE__ */ new Set([
    "net.minecraft.block.AbstractBlock",
    "net.minecraft.block.Block",
    "net.minecraft.item.BlockItem",
    "net.minecraft.item.Item",
    "net.minecraft.registry.Registries",
    "net.minecraft.registry.Registry",
    "net.minecraft.util.Identifier"
  ]);
  const regs = [];
  const classes = [];
  for (const b of p.blocks) {
    const cls = toPascal(b.registryName) + "Block";
    let settings = `AbstractBlock.Settings.create().strength(${kDouble(b.hardness)}f, ${kDouble(b.resistance)}f)`;
    imp.add("net.minecraft.sound.BlockSoundGroup");
    settings += `.sounds(BlockSoundGroup.${b.sound})`;
    if (b.requiresTool) settings += ".requiresTool()";
    if (b.luminance > 0) settings += `.luminance { ${Math.min(15, Math.trunc(b.luminance))} }`;
    regs.push(`    val ${toConst(b.registryName)}: Block = register(${ktStr2(b.registryName)}, ${cls}(${settings}))`);
    const by = (tr) => b.triggers.filter((t) => t.trigger === tr).map((t) => t.skill);
    const members = [];
    const common = ["net.minecraft.block.BlockState", "net.minecraft.util.math.BlockPos", "net.minecraft.world.World", "net.minecraft.util.math.Vec3d", `${pkg}.skill.SkillRuntime`, `${pkg}.skill.Skills`];
    const onInteract = by("onInteract");
    if (onInteract.length) {
      [...common, "net.minecraft.entity.player.PlayerEntity", "net.minecraft.util.hit.BlockHitResult", "net.minecraft.util.ActionResult"].forEach((x) => imp.add(x));
      members.push(`    override fun onUse(state: BlockState, world: World, pos: BlockPos, player: PlayerEntity, hit: BlockHitResult): ActionResult {
        if (!world.isClient) {
${indent(call(onInteract, "SkillRuntime.contextOf(player, null, Vec3d.ofCenter(pos))", fnMap), 12)}
        }
        return ActionResult.SUCCESS
    }`);
    }
    const onStep = by("onStep");
    if (onStep.length) {
      [...common, "net.minecraft.entity.Entity"].forEach((x) => imp.add(x));
      members.push(`    override fun onSteppedOn(world: World, pos: BlockPos, state: BlockState, entity: Entity) {
        if (!world.isClient) {
${indent(call(onStep, "SkillRuntime.contextOf(entity, null, Vec3d.ofCenter(pos))", fnMap), 12)}
        }
        super.onSteppedOn(world, pos, state, entity)
    }`);
    }
    const onPlace = by("onPlace");
    if (onPlace.length) {
      [...common, "net.minecraft.entity.LivingEntity", "net.minecraft.item.ItemStack"].forEach((x) => imp.add(x));
      members.push(`    override fun onPlaced(world: World, pos: BlockPos, state: BlockState, placer: LivingEntity?, itemStack: ItemStack) {
        super.onPlaced(world, pos, state, placer, itemStack)
        if (!world.isClient && placer != null) {
${indent(call(onPlace, "SkillRuntime.contextOf(placer, null, Vec3d.ofCenter(pos))", fnMap), 12)}
        }
    }`);
    }
    classes.push(`/** ${b.displayName} */
class ${cls}(settings: AbstractBlock.Settings) : Block(settings)${members.length ? ` {
${members.join("\n\n")}
}` : ""}`);
  }
  return `package ${pkg}

${importBlock(imp)}

object ModBlocks {
${regs.join("\n")}${regs.length ? "\n\n" : ""}    private fun register(name: String, block: Block): Block {
        val id = Identifier.of(${p.meta.mainClass}.MOD_ID, name)
        val registered = Registry.register(Registries.BLOCK, id, block)
        Registry.register(Registries.ITEM, id, BlockItem(registered, Item.Settings()))
        return registered
    }

    fun init() {
        ${p.meta.mainClass}.LOGGER.info("Registered ${p.blocks.length} blocks")
    }
}
${classes.length ? "\n" + classes.join("\n\n") + "\n" : ""}`;
}
function genItemGroupKt(p) {
  const pkg = p.meta.packageName;
  const entries = [
    ...p.items.map((i) => `ModItems.${toConst(i.registryName)}`),
    ...p.blocks.map((b) => `ModBlocks.${toConst(b.registryName)}`)
  ];
  const icon = entries[0] ?? "net.minecraft.item.Items.BOOK";
  return `package ${pkg}

import net.fabricmc.fabric.api.itemgroup.v1.FabricItemGroup
import net.minecraft.item.ItemGroup
import net.minecraft.item.ItemStack
import net.minecraft.registry.Registries
import net.minecraft.registry.Registry
import net.minecraft.text.Text
import net.minecraft.util.Identifier

object ModItemGroups {
    val MAIN: ItemGroup = Registry.register(
        Registries.ITEM_GROUP,
        Identifier.of(${p.meta.mainClass}.MOD_ID, "main"),
        FabricItemGroup.builder()
            .icon { ItemStack(${icon}) }
            .displayName(Text.translatable("itemGroup.${p.meta.modId}.main"))
            .entries { _, entries ->
${entries.map((e) => `                entries.add(${e})`).join("\n")}
            }
            .build()
    )

    fun init() {}
}
`;
}
function genEventsKt(p, fnMap) {
  const pkg = p.meta.packageName;
  const imp = /* @__PURE__ */ new Set([`${pkg}.skill.SkillRuntime`, `${pkg}.skill.Skills`]);
  const sections = [];
  const breaks = p.blocks.filter((b) => b.triggers.some((t) => t.trigger === "onBreak"));
  if (breaks.length) {
    imp.add("net.fabricmc.fabric.api.event.player.PlayerBlockBreakEvents");
    imp.add("net.minecraft.util.math.Vec3d");
    const body = breaks.map((b) => `if (state.isOf(ModBlocks.${toConst(b.registryName)})) {
${indent(call(b.triggers.filter((t) => t.trigger === "onBreak").map((t) => t.skill), "SkillRuntime.contextOf(player, null, Vec3d.ofCenter(pos))", fnMap), 4)}
}`).join("\n");
    sections.push(`// ~onBreak (\u30D6\u30ED\u30C3\u30AF\u7834\u58CA)
PlayerBlockBreakEvents.AFTER.register { world, player, pos, state, _ ->
    if (!world.isClient) {
${indent(body, 8)}
    }
}`);
  }
  const ge = (tr) => p.events.filter((e) => e.trigger === tr);
  if (ge("onJoin").length) {
    imp.add("net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents");
    sections.push(`// ~onJoin
ServerPlayConnectionEvents.JOIN.register { handler, _, _ ->
    val player = handler.player
${indent(call(ge("onJoin").map((e) => e.skill), "SkillRuntime.contextOf(player)", fnMap), 4)}
}`);
  }
  const tickParts = [];
  const intervals = /* @__PURE__ */ new Map();
  for (const e of ge("onTimer")) {
    const iv = Math.max(1, Math.trunc(e.interval || 20));
    intervals.set(iv, [...intervals.get(iv) ?? [], e.skill]);
  }
  for (const [iv, skills] of intervals) {
    tickParts.push(`if (ticks % ${iv}L == 0L) {
    for (player in server.playerManager.playerList) {
${indent(call(skills, "SkillRuntime.contextOf(player)", fnMap), 8)}
    }
}`);
  }
  for (const it of p.items) {
    for (const t of it.triggers.filter((x) => x.trigger === "onHeld")) {
      const iv = Math.max(1, Math.trunc(t.interval || 20));
      tickParts.push(`if (ticks % ${iv}L == 0L) {
    for (player in server.playerManager.playerList) {
        if (player.mainHandStack.isOf(ModItems.${toConst(it.registryName)})) {
${indent(call([t.skill], "SkillRuntime.contextOf(player)", fnMap), 12)}
        }
    }
}`);
    }
  }
  for (const it of p.items) {
    for (const t of it.triggers.filter((x) => x.trigger === "onWear")) {
      const iv = Math.max(1, Math.trunc(t.interval || 20));
      tickParts.push(`if (ticks % ${iv}L == 0L) {
    for (player in server.playerManager.playerList) {
        if (player.inventory.armor.any { it.isOf(ModItems.${toConst(it.registryName)}) }) {
${indent(call([t.skill], "SkillRuntime.contextOf(player)", fnMap), 12)}
        }
    }
}`);
    }
  }
  for (const m of p.mobSkills.filter((x) => x.trigger === "onTimer")) {
    imp.add("net.minecraft.registry.Registries");
    imp.add("net.minecraft.entity.mob.MobEntity");
    const iv = Math.max(1, Math.trunc(m.interval || 40));
    tickParts.push(`if (ticks % ${iv}L == 0L) {
    for (world in server.worlds) {
        val mobs = world.iterateEntities().filter { it.isAlive && Registries.ENTITY_TYPE.getId(it.type).toString() == ${ktStr2(m.entityType)} }
        for (mob in mobs) {
${indent(call([m.skill], "SkillRuntime.contextOf(mob, (mob as? MobEntity)?.target)", fnMap), 12)}
        }
    }
}`);
  }
  if (tickParts.length) {
    imp.add("net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents");
    sections.push(`// ~onTimer (\u30BF\u30A4\u30DE\u30FC\u7CFB)
ServerTickEvents.END_SERVER_TICK.register { server ->
    ticks++
${indent(tickParts.join("\n"), 4)}
}`);
  }
  const deathParts = [];
  if (ge("onKill").length) {
    imp.add("net.minecraft.server.network.ServerPlayerEntity");
    deathParts.push(`if (attacker is ServerPlayerEntity) {
${indent(call(ge("onKill").map((e) => e.skill), "SkillRuntime.contextOf(attacker, entity, entity.pos)", fnMap), 4)}
}`);
  }
  if (ge("onDeath").length) {
    imp.add("net.minecraft.server.network.ServerPlayerEntity");
    deathParts.push(`if (entity is ServerPlayerEntity) {
${indent(call(ge("onDeath").map((e) => e.skill), "SkillRuntime.contextOf(entity, attacker)", fnMap), 4)}
}`);
  }
  const mobDeaths = p.mobSkills.filter((m) => m.trigger === "onDeath");
  for (const m of mobDeaths) {
    imp.add("net.minecraft.registry.Registries");
    deathParts.push(`if (Registries.ENTITY_TYPE.getId(entity.type).toString() == ${ktStr2(m.entityType)}) {
${indent(call([m.skill], "SkillRuntime.contextOf(entity, attacker)", fnMap), 4)}
}`);
  }
  if (deathParts.length) {
    imp.add("net.fabricmc.fabric.api.entity.event.v1.ServerLivingEntityEvents");
    sections.push(`// ~onKill / ~onDeath
ServerLivingEntityEvents.AFTER_DEATH.register { entity, source ->
    val attacker = source.attacker
${indent(deathParts.join("\n"), 4)}
}`);
  }
  const dmgParts = [];
  if (ge("onDamaged").length) {
    imp.add("net.minecraft.server.network.ServerPlayerEntity");
    dmgParts.push(`if (entity is ServerPlayerEntity) {
${indent(call(ge("onDamaged").map((e) => e.skill), "SkillRuntime.contextOf(entity, attacker)", fnMap), 4)}
}`);
  }
  if (ge("onAttack").length) {
    imp.add("net.minecraft.server.network.ServerPlayerEntity");
    dmgParts.push(`if (attacker is ServerPlayerEntity) {
${indent(call(ge("onAttack").map((e) => e.skill), "SkillRuntime.contextOf(attacker, entity, entity.pos)", fnMap), 4)}
}`);
  }
  for (const m of p.mobSkills.filter((x) => x.trigger === "onAttack")) {
    imp.add("net.minecraft.registry.Registries");
    dmgParts.push(`if (attacker != null && Registries.ENTITY_TYPE.getId(attacker.type).toString() == ${ktStr2(m.entityType)}) {
${indent(call([m.skill], "SkillRuntime.contextOf(attacker, entity, entity.pos)", fnMap), 4)}
}`);
  }
  for (const m of p.mobSkills.filter((x) => x.trigger === "onDamaged")) {
    imp.add("net.minecraft.registry.Registries");
    dmgParts.push(`if (Registries.ENTITY_TYPE.getId(entity.type).toString() == ${ktStr2(m.entityType)}) {
${indent(call([m.skill], "SkillRuntime.contextOf(entity, attacker)", fnMap), 4)}
}`);
  }
  if (dmgParts.length) {
    imp.add("net.fabricmc.fabric.api.entity.event.v1.ServerLivingEntityEvents");
    sections.push(`// ~onDamaged / ~onAttack (\u518D\u5E30\u9632\u6B62\u30AC\u30FC\u30C9\u4ED8\u304D)
ServerLivingEntityEvents.ALLOW_DAMAGE.register { entity, source, _ ->
    if (!handlingDamage) {
        handlingDamage = true
        try {
            val attacker = source.attacker
${indent(dmgParts.join("\n"), 12)}
        } finally {
            handlingDamage = false
        }
    }
    true
}`);
  }
  return `package ${pkg}

${importBlock(imp)}

/** \u30C8\u30EA\u30AC\u30FC (~onX) \u3068\u30B9\u30AD\u30EB\u306E\u7D10\u4ED8\u3051 */
object ModEvents {
    private var ticks = 0L
    private var handlingDamage = false

    fun init() {
${sections.length ? indent(sections.join("\n\n"), 8) : "        // \u30A4\u30D9\u30F3\u30C8\u306A\u3057"}
    }
}
`;
}
function genCommandsKt(p, fnMap) {
  const pkg = p.meta.packageName;
  const cmds = p.commands.map(
    (c) => `dispatcher.register(
    CommandManager.literal(${ktStr2(c.name)})
        .requires { it.hasPermissionLevel(${Math.trunc(c.permissionLevel)}) }
        .executes { context ->
            val player = context.source.player ?: return@executes 0
            val base = SkillRuntime.contextOf(player) ?: return@executes 0
            val target = Targeters.lookEntity(base, 20.0).firstOrNull()?.entity
${indent(call([c.skill], "base.copy(target = target)", fnMap), 12)}
            1
        }
)`
  ).join("\n");
  return `package ${pkg}

import ${pkg}.skill.CustomMobs
import ${pkg}.skill.SkillRuntime
import ${pkg}.skill.Skills
import ${pkg}.skill.Targeters
import com.mojang.brigadier.arguments.StringArgumentType
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback
import net.minecraft.command.CommandSource
import net.minecraft.server.command.CommandManager
import net.minecraft.text.Text

object ModCommands {
    fun init() {
        CommandRegistrationCallback.EVENT.register { dispatcher, _, _ ->
            // /${p.meta.modId} cast <skill> : \u4EFB\u610F\u306E\u30B9\u30AD\u30EB\u3092\u30C7\u30D0\u30C3\u30B0\u5B9F\u884C
            dispatcher.register(
                CommandManager.literal(${ktStr2(p.meta.modId)})
                    .requires { it.hasPermissionLevel(2) }
                    .then(
                        CommandManager.literal("cast").then(
                            CommandManager.argument("skill", StringArgumentType.word())
                                .suggests { _, builder -> CommandSource.suggestMatching(Skills.NAMES, builder) }
                                .executes { context ->
                                    val player = context.source.player ?: return@executes 0
                                    val name = StringArgumentType.getString(context, "skill")
                                    val ctx = SkillRuntime.contextOf(player) ?: return@executes 0
                                    val target = Targeters.lookEntity(ctx, 20.0).firstOrNull()?.entity
                                    val ok = Skills.cast(name, ctx.copy(target = target))
                                    context.source.sendFeedback({ Text.literal(if (ok) "Cast: " + name else "Unknown skill: " + name) }, false)
                                    if (ok) 1 else 0
                                }
                        )
                    )
                    .then(
                        CommandManager.literal("spawn").then(
                            CommandManager.argument("mob", StringArgumentType.word())
                                .suggests { _, builder -> CommandSource.suggestMatching(CustomMobs.NAMES, builder) }
                                .executes { context ->
                                    val player = context.source.player ?: return@executes 0
                                    val name = StringArgumentType.getString(context, "mob")
                                    val world = context.source.world
                                    val pos = Targeters.forward(SkillRuntime.contextOf(player) ?: return@executes 0, 3.0).first().pos
                                    val e = CustomMobs.spawn(name, world, pos)
                                    context.source.sendFeedback({ Text.literal(if (e != null) "Spawned: " + name else "Unknown mob: " + name) }, false)
                                    if (e != null) 1 else 0
                                }
                        )
                    )
                    .then(
                        CommandManager.literal("skills").executes { context ->
                            context.source.sendFeedback({ Text.literal("Skills: " + Skills.NAMES.joinToString(", ")) }, false)
                            1
                        }
                    )
            )
${cmds ? indent(cmds, 12) + "\n" : ""}        }
    }
}
`;
}
function genWorldGenKt(p) {
  const pkg = p.meta.packageName;
  const ores = p.blocks.filter((b) => b.oreGen?.enabled);
  const sel = { overworld: "foundInOverworld", nether: "foundInTheNether", end: "foundInTheEnd" };
  return `package ${pkg}

import net.fabricmc.fabric.api.biome.v1.BiomeModifications
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors
import net.minecraft.registry.RegistryKey
import net.minecraft.registry.RegistryKeys
import net.minecraft.util.Identifier
import net.minecraft.world.gen.GenerationStep

/** \u9271\u77F3\u306E\u81EA\u7136\u751F\u6210 (JSON: data/${p.meta.modId}/worldgen/) */
object ModWorldGen {
    fun init() {
${ores.length ? ores.map((b) => `        BiomeModifications.addFeature(
            BiomeSelectors.${sel[b.oreGen.dimension]}(),
            GenerationStep.Feature.UNDERGROUND_ORES,
            RegistryKey.of(RegistryKeys.PLACED_FEATURE, Identifier.of(${p.meta.mainClass}.MOD_ID, "ore_${b.registryName}"))
        )`).join("\n") : "        // \u9271\u77F3\u751F\u6210\u306A\u3057"}
    }
}
`;
}
function genMainKt(p) {
  const pkg = p.meta.packageName;
  const hasGroup = p.items.length + p.blocks.length > 0;
  return `package ${pkg}

import ${pkg}.skill.CustomMobs
import ${pkg}.skill.SkillScheduler
import net.fabricmc.api.ModInitializer
import org.slf4j.Logger
import org.slf4j.LoggerFactory

object ${p.meta.mainClass} : ModInitializer {
    const val MOD_ID = ${ktStr2(p.meta.modId)}
    val LOGGER: Logger = LoggerFactory.getLogger(MOD_ID)

    override fun onInitialize() {
        ModItems.init()
        ModBlocks.init()
${hasGroup ? "        ModItemGroups.init()\n" : ""}        SkillScheduler.init()
        ModEvents.init()
        CustomMobs.init()
        ModWorldGen.init()
        ModCommands.init()
        LOGGER.info("${p.meta.name} initialized")
    }
}
`;
}
function genResources(p) {
  const m = p.meta;
  const files = [];
  const lang = { [`itemGroup.${m.modId}.main`]: m.name };
  for (const it of p.items) lang[`item.${m.modId}.${it.registryName}`] = it.displayName;
  for (const b of p.blocks) lang[`block.${m.modId}.${b.registryName}`] = b.displayName;
  files.push({ path: `src/main/resources/assets/${m.modId}/lang/en_us.json`, content: jsonStr(lang), language: "json" });
  files.push({ path: `src/main/resources/assets/${m.modId}/lang/ja_jp.json`, content: jsonStr(lang), language: "json" });
  for (const it of p.items) {
    const handheld = !["basic", "food"].includes(it.kind) && !isArmor(it.kind);
    files.push({
      path: `src/main/resources/assets/${m.modId}/models/item/${it.registryName}.json`,
      content: jsonStr({ parent: handheld ? "minecraft:item/handheld" : "minecraft:item/generated", textures: { layer0: `${m.modId}:item/${it.registryName}` } }),
      language: "json"
    });
  }
  const mineable = {};
  const levels = {};
  for (const b of p.blocks) {
    const id = `${m.modId}:${b.registryName}`;
    files.push({ path: `src/main/resources/assets/${m.modId}/blockstates/${b.registryName}.json`, content: jsonStr({ variants: { "": { model: `${m.modId}:block/${b.registryName}` } } }), language: "json" });
    files.push({ path: `src/main/resources/assets/${m.modId}/models/block/${b.registryName}.json`, content: jsonStr({ parent: "minecraft:block/cube_all", textures: { all: `${m.modId}:block/${b.registryName}` } }), language: "json" });
    files.push({ path: `src/main/resources/assets/${m.modId}/models/item/${b.registryName}.json`, content: jsonStr({ parent: `${m.modId}:block/${b.registryName}` }), language: "json" });
    if (b.dropItem && b.dropItem.trim()) {
      const min = Math.max(1, Math.trunc(b.dropMin ?? 1));
      const max = Math.max(min, Math.trunc(b.dropMax ?? 1));
      files.push({
        path: `src/main/resources/data/${m.modId}/loot_table/blocks/${b.registryName}.json`,
        content: jsonStr({
          type: "minecraft:block",
          pools: [{
            rolls: 1,
            bonus_rolls: 0,
            entries: [{
              type: "minecraft:alternatives",
              children: [
                {
                  type: "minecraft:item",
                  name: id,
                  conditions: [{ condition: "minecraft:match_tool", predicate: { predicates: { "minecraft:enchantments": [{ enchantments: "minecraft:silk_touch", levels: { min: 1 } }] } } }]
                },
                {
                  type: "minecraft:item",
                  name: b.dropItem.trim(),
                  functions: [
                    { function: "minecraft:set_count", count: { type: "minecraft:uniform", min, max }, add: false },
                    { function: "minecraft:apply_bonus", enchantment: "minecraft:fortune", formula: "minecraft:ore_drops" },
                    { function: "minecraft:explosion_decay" }
                  ]
                }
              ]
            }]
          }]
        }),
        language: "json"
      });
    } else if (b.dropsSelf) {
      files.push({
        path: `src/main/resources/data/${m.modId}/loot_table/blocks/${b.registryName}.json`,
        content: jsonStr({ type: "minecraft:block", pools: [{ rolls: 1, entries: [{ type: "minecraft:item", name: id }], conditions: [{ condition: "minecraft:survives_explosion" }] }] }),
        language: "json"
      });
    }
    const og = b.oreGen;
    if (og?.enabled) {
      const targets = og.dimension === "nether" ? [{ target: { predicate_type: "minecraft:tag_match", tag: "minecraft:base_stone_nether" }, state: { Name: id } }] : og.dimension === "end" ? [{ target: { predicate_type: "minecraft:block_match", block: "minecraft:end_stone" }, state: { Name: id } }] : [
        { target: { predicate_type: "minecraft:tag_match", tag: "minecraft:stone_ore_replaceables" }, state: { Name: id } },
        { target: { predicate_type: "minecraft:tag_match", tag: "minecraft:deepslate_ore_replaceables" }, state: { Name: id } }
      ];
      files.push({
        path: `src/main/resources/data/${m.modId}/worldgen/configured_feature/ore_${b.registryName}.json`,
        content: jsonStr({ type: "minecraft:ore", config: { size: Math.max(1, Math.min(64, Math.trunc(og.veinSize))), discard_chance_on_air_exposure: 0, targets } }),
        language: "json"
      });
      files.push({
        path: `src/main/resources/data/${m.modId}/worldgen/placed_feature/ore_${b.registryName}.json`,
        content: jsonStr({
          feature: `${m.modId}:ore_${b.registryName}`,
          placement: [
            { type: "minecraft:count", count: Math.max(1, Math.trunc(og.veinsPerChunk)) },
            { type: "minecraft:in_square" },
            { type: "minecraft:height_range", height: { type: "minecraft:trapezoid", min_inclusive: { absolute: Math.trunc(og.minY) }, max_inclusive: { absolute: Math.trunc(og.maxY) } } },
            { type: "minecraft:biome" }
          ]
        }),
        language: "json"
      });
    }
    if (b.tool !== "none") mineable[b.tool] = [...mineable[b.tool] ?? [], id];
    if (b.toolLevel !== "any") levels[b.toolLevel] = [...levels[b.toolLevel] ?? [], id];
  }
  for (const [tool, ids] of Object.entries(mineable))
    files.push({ path: `src/main/resources/data/minecraft/tags/block/mineable/${tool}.json`, content: jsonStr({ replace: false, values: ids }), language: "json" });
  for (const [lvl, ids] of Object.entries(levels))
    files.push({ path: `src/main/resources/data/minecraft/tags/block/needs_${lvl}_tool.json`, content: jsonStr({ replace: false, values: ids }), language: "json" });
  files.push({
    path: "src/main/resources/fabric.mod.json",
    content: jsonStr({
      schemaVersion: 1,
      id: m.modId,
      version: "${version}",
      name: m.name,
      description: m.description,
      authors: m.authors.split(",").map((s) => s.trim()).filter(Boolean),
      license: "MIT",
      icon: `assets/${m.modId}/icon.png`,
      environment: "*",
      entrypoints: { main: [{ adapter: "kotlin", value: `${m.packageName}.${m.mainClass}` }] },
      depends: {
        fabricloader: ">=0.16.0",
        minecraft: `~${m.minecraftVersion}`,
        java: ">=21",
        "fabric-api": "*",
        "fabric-language-kotlin": "*"
      }
    }),
    language: "json"
  });
  return files;
}
function genGradle(p) {
  const m = p.meta;
  return [
    {
      path: "settings.gradle.kts",
      language: "gradle",
      content: `pluginManagement {
    repositories {
        maven("https://maven.fabricmc.net/") { name = "Fabric" }
        mavenCentral()
        gradlePluginPortal()
    }
}

rootProject.name = "${m.modId}"
`
    },
    {
      path: "build.gradle.kts",
      language: "gradle",
      content: `import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("fabric-loom") version "${m.loomVersion}"
    kotlin("jvm") version "${m.kotlinVersion}"
}

version = project.property("mod_version") as String
group = project.property("maven_group") as String

base {
    archivesName.set(project.property("archives_base_name") as String)
}

repositories {
    mavenCentral()
}

dependencies {
    minecraft("com.mojang:minecraft:\${project.property("minecraft_version")}")
    mappings("net.fabricmc:yarn:\${project.property("yarn_mappings")}:v2")
    modImplementation("net.fabricmc:fabric-loader:\${project.property("loader_version")}")
    modImplementation("net.fabricmc.fabric-api:fabric-api:\${project.property("fabric_version")}")
    modImplementation("net.fabricmc:fabric-language-kotlin:\${project.property("fabric_kotlin_version")}")
}

tasks.processResources {
    inputs.property("version", project.version)
    filesMatching("fabric.mod.json") {
        expand(mapOf("version" to project.version))
    }
}

tasks.withType<JavaCompile>().configureEach {
    options.release.set(21)
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_21)
    }
}

java {
    withSourcesJar()
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}
`
    },
    {
      path: "gradle.properties",
      language: "properties",
      content: `org.gradle.jvmargs=-Xmx2G
org.gradle.parallel=true

# Fabric Properties (https://fabricmc.net/develop)
minecraft_version=${m.minecraftVersion}
yarn_mappings=${m.yarnMappings}
loader_version=${m.loaderVersion}

# Mod Properties
mod_version=${m.version}
maven_group=${m.packageName}
archives_base_name=${m.modId}

# Dependencies
fabric_version=${m.fabricVersion}
fabric_kotlin_version=${m.fabricKotlinVersion}
`
    },
    {
      path: "gradle/wrapper/gradle-wrapper.properties",
      language: "properties",
      content: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-${m.gradleVersion}-bin.zip
networkTimeout=10000
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
    },
    {
      path: ".github/workflows/build.yml",
      language: "yaml",
      content: `name: build
on: [push, pull_request, workflow_dispatch]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: "${m.gradleVersion}"
      - run: gradle build --no-daemon
      - uses: actions/upload-artifact@v4
        with:
          name: ${m.modId}-jar
          path: build/libs/
`
    },
    {
      path: ".gitignore",
      language: "text",
      content: `.gradle/
build/
out/
run/
.idea/
*.iml
.kotlin/
`
    },
    {
      path: "README.md",
      language: "markdown",
      content: `# ${m.name}

${m.description}

MythicCraft Studio \u3067\u751F\u6210\u3055\u308C\u305F Minecraft ${m.minecraftVersion} Fabric Mod (Kotlin) \u3067\u3059\u3002

## \u30D3\u30EB\u30C9\u65B9\u6CD5

1. JDK 21 \u3068 Gradle ${m.gradleVersion} \u3092\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB
2. \u3053\u306E\u30D5\u30A9\u30EB\u30C0\u3067 Gradle Wrapper \u3092\u751F\u6210: \`gradle wrapper --gradle-version ${m.gradleVersion}\`
3. \`./gradlew build\` \u2192 \`build/libs/${m.modId}-${m.version}.jar\`
4. \u958B\u767A\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u8D77\u52D5: \`./gradlew runClient\`

IntelliJ IDEA \u3067\u30D5\u30A9\u30EB\u30C0\u3092\u958B\u304F\u3060\u3051\u3067\u3082\u30D3\u30EB\u30C9\u3067\u304D\u307E\u3059\u3002
GitHub \u306B push \u3059\u308B\u3068 \`.github/workflows/build.yml\` \u306B\u3088\u308A\u81EA\u52D5\u3067 JAR \u304C\u30D3\u30EB\u30C9\u3055\u308C\u307E\u3059\u3002

## \u30C7\u30D0\u30C3\u30B0\u30B3\u30DE\u30F3\u30C9

- \`/${m.modId} skills\` : \u30B9\u30AD\u30EB\u4E00\u89A7
- \`/${m.modId} cast <skill>\` : \u30B9\u30AD\u30EB\u3092\u5B9F\u884C\uFF08\u8996\u7DDA\u5148\u306E\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3\u304C\u30BF\u30FC\u30B2\u30C3\u30C8\uFF09
- \`/${m.modId} spawn <mob>\` : \u30AB\u30B9\u30BF\u30E0\u30E2\u30D6\u3092\u53EC\u559A
${p.commands.map((c) => `- \`/${c.name}\` : \u30B9\u30AD\u30EB ${c.skill} \u3092\u5B9F\u884C`).join("\n")}

## \u53CE\u9332\u30B3\u30F3\u30C6\u30F3\u30C4

- \u30A2\u30A4\u30C6\u30E0: ${p.items.map((i) => `${i.displayName} (\`${m.modId}:${i.registryName}\`)`).join(", ") || "\u306A\u3057"}
- \u30D6\u30ED\u30C3\u30AF: ${p.blocks.map((b) => `${b.displayName}${b.oreGen?.enabled ? " [\u9271\u77F3\u751F\u6210]" : ""}`).join(", ") || "\u306A\u3057"}
- \u30AB\u30B9\u30BF\u30E0\u30E2\u30D6: ${p.mobs.map((x) => x.name).join(", ") || "\u306A\u3057"}
- \u30B9\u30AD\u30EB: ${p.skills.map((s) => s.name).join(", ") || "\u306A\u3057"}
- \u30EC\u30B7\u30D4: ${p.recipes.length} \u4EF6

## \u5909\u6570

\u30B9\u30AD\u30EB\u5909\u6570\u306F\u30EF\u30FC\u30EB\u30C9\u306E \`data/${m.modId}_variables.dat\` \u306B\u4FDD\u5B58\u3055\u308C\u3001\u518D\u8D77\u52D5\u5F8C\u3082\u4FDD\u6301\u3055\u308C\u307E\u3059\u3002
\u30C6\u30AD\u30B9\u30C8\u5185\u3067 \`<var.\u540D\u524D>\`\uFF08\u30AD\u30E3\u30B9\u30BF\u30FC\uFF09/ \`<global.\u540D\u524D>\` \u3067\u53C2\u7167\u3067\u304D\u307E\u3059\u3002

## \u30C6\u30AF\u30B9\u30C1\u30E3

\`src/main/resources/assets/${m.modId}/textures/{item,block}/<name>.png\` \u306B 16x16 PNG \u3092\u7F6E\u3044\u3066\u304F\u3060\u3055\u3044\u3002
\uFF08ZIP\u306B\u306F\u4EEE\u30C6\u30AF\u30B9\u30C1\u30E3\u304C\u542B\u307E\u308C\u307E\u3059\uFF09
`
    }
  ];
}
function generateProject(p) {
  const m = p.meta;
  const base = `src/main/kotlin/${m.packageName.replace(/\./g, "/")}`;
  const fnMap = /* @__PURE__ */ new Map();
  for (const s of p.skills) fnMap.set(s.name, skillFnName(s.name));
  const files = [
    ...genGradle(p),
    { path: `${base}/${m.mainClass}.kt`, content: genMainKt(p), language: "kotlin" },
    { path: `${base}/ModItems.kt`, content: genItemsKt(p, fnMap), language: "kotlin" },
    { path: `${base}/ModBlocks.kt`, content: genBlocksKt(p, fnMap), language: "kotlin" }
  ];
  if (p.items.length + p.blocks.length > 0) files.push({ path: `${base}/ModItemGroups.kt`, content: genItemGroupKt(p), language: "kotlin" });
  files.push(
    { path: `${base}/ModEvents.kt`, content: genEventsKt(p, fnMap), language: "kotlin" },
    { path: `${base}/ModWorldGen.kt`, content: genWorldGenKt(p), language: "kotlin" },
    { path: `${base}/ModCommands.kt`, content: genCommandsKt(p, fnMap), language: "kotlin" },
    { path: `${base}/skill/Skills.kt`, content: genSkillsKt(p), language: "kotlin" },
    { path: `${base}/skill/SkillCore.kt`, content: skillCoreKt(m.packageName, m.modId), language: "kotlin" },
    { path: `${base}/skill/Targeters.kt`, content: targetersKt(m.packageName), language: "kotlin" },
    { path: `${base}/skill/Conditions.kt`, content: conditionsKt(m.packageName), language: "kotlin" },
    { path: `${base}/skill/Mechanics.kt`, content: mechanicsKt(m.packageName), language: "kotlin" },
    { path: `${base}/skill/CustomMobs.kt`, content: genCustomMobsKt(p, fnMap), language: "kotlin" },
    ...genResources(p),
    ...genRecipes(p)
  );
  return files;
}

// src/argv.ts
function cmd() {
  return process.env.MCASSET_CMD ?? "";
}
function args() {
  try {
    const parsed = JSON.parse(process.env.MCASSET_ARGS ?? "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
function arg(name, fallback) {
  const list = args();
  const i = list.indexOf(`--${name}`);
  if (i >= 0 && i + 1 < list.length) return list[i + 1];
  return fallback;
}
function fail(message) {
  console.error(message);
  process.exit(1);
}

// src/mythiccraft.ts
var command = cmd();
if (command === "sample") {
  const out = arg("out") ?? fail("usage: mythiccraft:sample --name mymod --out project.json");
  const name = arg("name", "mymod");
  (0, import_node_fs.writeFileSync)(out, JSON.stringify(emptyProject(name), null, 2));
  console.log(`wrote ${out}`);
} else if (command === "build") {
  const projPath = arg("project") ?? fail("usage: mythiccraft:build --project file.json --out dir/");
  const out = arg("out") ?? fail("usage: mythiccraft:build --project file.json --out dir/");
  const project = JSON.parse((0, import_node_fs.readFileSync)(projPath, "utf-8"));
  const files = generateProject(project);
  for (const file of files) {
    const target = (0, import_node_path.join)(out, file.path);
    (0, import_node_fs.mkdirSync)((0, import_node_path.dirname)(target), { recursive: true });
    (0, import_node_fs.writeFileSync)(target, file.content);
  }
  console.log(`wrote ${files.length} files to ${out}`);
} else {
  console.log(`mythiccraft commands: sample --name mymod --out project.json | build --project file.json --out dir/`);
}
