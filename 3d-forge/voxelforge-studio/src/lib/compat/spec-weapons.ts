// Extra weapon builders. Factory avoids circular imports with generator.ts.
import type { Ctx } from "./spec-engine";

const TILE = {
  primary: 0, secondary: 1, accent: 2, glow: 3, handle: 4, gem: 5, trim: 6, dark: 7, aura1: 8, aura2: 9,
} as const;

export type WeaponApi = {
  addAura: (ctx: Ctx, height: number) => void;
  addChain: (ctx: Ctx, x: number, y: number) => void;
  addDecor: (ctx: Ctx, guardW: number, hy: number, cluster: number) => void;
  addFloating: (ctx: Ctx, cx: number, cy: number, cz: number) => void;
  addMagicCircle: (ctx: Ctx, cy: number, radius: number) => void;
  addParticles: (ctx: Ctx, y0: number, y1: number, spreadX: number, spreadZ: number) => void;
  addRunes: (ctx: Ctx, count: number, x: number, y0: number, y1: number) => void;
  addTrail: (ctx: Ctx, height: number) => void;
  addWings: (ctx: Ctx, x0: number, y0: number, count: number) => void;
};

let api: WeaponApi | null = null;

function A(): WeaponApi {
  if (!api) throw new Error("weapon api not bound");
  return api;
}

function finish(ctx: Ctx, topY: number, trailH: number, gw = 6, hy = 0, cl = 4): number {
  A().addDecor(ctx, gw, hy, cl);
  A().addParticles(ctx, topY * 0.4, topY, 7, 5);
  A().addAura(ctx, topY + 3);
  A().addTrail(ctx, trailH);
  return topY + 3;
}

function buildChainsaw(ctx: Ctx): number {
  const { spec, box } = ctx;
  const bar = 10 + spec.length * 10;
  box("grip", "root", 0, -4, 2.4, 5, 2.4, TILE.handle);
  box("motor", "root", 0, 1, 5, 4, 4, TILE.primary);
  box("motor_cap", "root", 0, 5, 4, 1.2, 4, TILE.secondary);
  box("exhaust", "root", 2.8, 3, 1.2, 2, 1.2, TILE.dark);
  box("bar", "blade", 0, 6, 1.8, bar, 0.8, TILE.secondary);
  const teeth = 8 + Math.floor(spec.detail * 6);
  for (let i = 0; i < teeth; i++) {
    const y = 6.5 + (i / teeth) * bar;
    const side = i % 2 === 0 ? 1.2 : -1.2;
    box(`tooth_${i}`, "blade", side, y, 1.2, 0.8, 0.6, TILE.accent);
  }
  if (ctx.has("gears")) box("drive_gear", "root", 0, 5.5, 3, 1, 3, TILE.dark);
  if (ctx.has("bolts")) for (let i = 0; i < 4; i++) box(`cs_bolt_${i}`, "root", (i % 2) * 2 - 1, 2 + Math.floor(i / 2), 0.5, 0.5, 0.5, TILE.trim);
  A().addFloating(ctx, 0, 6 + bar + 2, 1);
  return finish(ctx, 6 + bar + 3, bar, 5, 1, 4);
}

function buildGun(ctx: Ctx): number {
  const { spec, box } = ctx;
  const barrel = 8 + spec.length * 8;
  box("grip", "root", 0, -4, 2, 4.5, 2.2, TILE.handle);
  box("receiver", "root", 0, 0, 3.5, 3, 2.5, TILE.primary);
  box("mag", "root", 0, -1.5, 1.6, 3, 1.2, TILE.secondary);
  box("barrel", "blade", 0, 3, 1.4, barrel, 1.4, TILE.dark);
  box("muzzle", "blade", 0, 3 + barrel, 2, 1.2, 2, TILE.accent);
  ctx.glow("muzzle_flash", "head", 0, 4.5 + barrel, 0, 1.6);
  box("sight", "root", 0, 3.2, 0.6, 1.2, 0.6, TILE.trim);
  if (ctx.has("circuits")) for (let i = 0; i < 3; i++) box(`rail_${i}`, "root", 0.9, 3.5 + i * 2, 0.4, 1.5, 0.4, TILE.glow, true);
  A().addFloating(ctx, 0, 5 + barrel, 1);
  return finish(ctx, 6 + barrel, barrel, 4, 0, 3);
}

function buildRailgun(ctx: Ctx): number {
  const { spec, box } = ctx;
  const len = 12 + spec.length * 12;
  box("stock", "root", 0, -5, 2.5, 5, 2.5, TILE.handle);
  box("core", "root", 0, 0, 4.5, 4, 4, TILE.primary);
  box("cap", "root", 0, 2, 3, 2, 3, TILE.gem, true);
  for (const s of [-1, 1]) {
    box(`rail_${s}`, "blade", s * 1.4, 4, 0.8, len, 0.8, TILE.accent);
  }
  const coils = 5 + Math.floor(spec.detail * 3);
  for (let i = 0; i < coils; i++) {
    const y = 5 + (i / coils) * len;
    box(`coil_${i}`, "blade", 0, y, 3.2, 1, 3.2, TILE.secondary);
    ctx.glow(`coil_g_${i}`, "blade", 0, y + 0.4, 0, 1);
  }
  ctx.glow("beam", "head", 0, 5 + len, 0, 2);
  A().addFloating(ctx, 0, 7 + len, 1.2);
  if (ctx.has("halo")) ctx.ring(4, 4 + len, "floating", 1, 10);
  return finish(ctx, 8 + len, len, 5, 0, 4);
}

function buildRelic(ctx: Ctx): number {
  const { spec, box } = ctx;
  const w = 6 + spec.width * 3;
  const h = 8 + spec.length * 4;
  box("tablet", "root", 0, -h / 2, w, h, 1.5, TILE.primary);
  box("frame", "root", 0, -h / 2, w + 1.2, h, 0.8, TILE.accent);
  box("pedestal", "root", 0, -h / 2 - 2, w * 0.7, 2, 3, TILE.secondary);
  if (ctx.has("gem")) box("eye", "root", 0, 0, 2.5, 2.5, 2, TILE.gem, true);
  A().addMagicCircle(ctx, -h / 2 - 3.5, 6);
  const n = 4 + Math.floor(spec.detail * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ctx.glow(`relic_orb_${i}`, "floating", Math.cos(a) * (w / 2 + 2), Math.sin(a) * 2, Math.sin(a) * (w / 2 + 2), 1.2);
  }
  A().addFloating(ctx, 0, h / 2 + 4, 1.4);
  return finish(ctx, h / 2 + 6, h, w, 0, h);
}

function buildSpear(ctx: Ctx): number {
  const { spec, box } = ctx;
  const sh = 14 + spec.length * 14;
  const sw = 1.6 + spec.width * 0.8;
  box("shaft", "root", 0, -sh, sw, sh, sw, TILE.handle);
  for (let i = 0; i < 5; i++) box(`band_${i}`, "root", 0, -sh + ((i + 1) / 6) * sh, sw + 1.2, 1, sw + 1.2, TILE.accent);
  const headH = 7 + spec.length * 4;
  box("head_core", "head", 0, 0, 2, headH, 2, TILE.primary);
  box("blade_l", "blade", -1.8, 1, 2.2, headH - 1, 0.8, TILE.secondary);
  box("blade_r", "blade", 1.8, 1, 2.2, headH - 1, 0.8, TILE.secondary);
  box("tip", "blade", 0, headH, 1.4, 3, 1.4, TILE.accent);
  // heavy ornament
  for (let i = 0; i < 4; i++) {
    box(`orn_l${i}`, "head", -2.5 - i * 0.8, 2 + i * 1.2, 1.2, 2.2, 1.2, TILE.accent);
    box(`orn_r${i}`, "head", 2.5 + i * 0.8, 2 + i * 1.2, 1.2, 2.2, 1.2, TILE.accent);
  }
  if (ctx.has("gem")) {
    box("socket", "head", 0, 2, 2.2, 2.2, 2.2, TILE.gem, true);
    box("tip_gem", "blade", 0, headH + 2, 1.5, 1.5, 1.5, TILE.gem, true);
  }
  if (ctx.has("runes")) A().addRunes(ctx, 6, sw / 2, -sh + 2, -2);
  if (ctx.has("ribbon")) for (let i = 0; i < 10; i++) {
    const t = i / 9;
    box(`ribbon_${i}`, "root", Math.sin(t * Math.PI * 4) * 2, -sh + 2 + t * (sh - 4), 0.7, 0.7, 0.7, TILE.accent);
  }
  if (ctx.has("wings")) A().addWings(ctx, 3, headH * 0.4, 4);
  if (ctx.has("chain")) A().addChain(ctx, 2, -2);
  if (ctx.has("halo")) ctx.ring(5, headH + 2, "floating", 1, 12);
  if (ctx.has("feathers")) for (let i = 0; i < 5; i++) box(`fe_${i}`, "wings", (i - 2) * 1.2, -2 - i * 0.4, 0.5, 2, 0.4, TILE.accent);
  A().addMagicCircle(ctx, headH + 1, 4);
  A().addFloating(ctx, 0, headH + 5, 1.2);
  return finish(ctx, headH + 6, sh, 6, 0, headH);
}

function buildMace(ctx: Ctx): number {
  const { spec, box } = ctx;
  const hH = 8 + spec.length * 8;
  box("handle", "root", 0, -hH, 2, hH, 2, TILE.handle);
  box("neck", "root", 0, 0, 2.5, 2, 2.5, TILE.secondary);
  const r = 3.5 + spec.width * 2;
  box("ball", "head", 0, 2, r * 2, r * 2, r * 2, TILE.primary);
  const spikes = 8 + Math.floor(spec.detail * 4);
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2;
    const y = 2 + r + Math.sin(i) * 1.5;
    box(`spike_${i}`, "head", Math.cos(a) * r, y, 1, 2.4, 1, TILE.accent);
  }
  if (ctx.has("gem")) box("core_gem", "head", 0, 2 + r / 2, 2, 2, 2, TILE.gem, true);
  A().addFloating(ctx, 0, 4 + r * 2, 1);
  return finish(ctx, 6 + r * 2, hH, r * 2, 2, r * 2);
}

function buildScythe(ctx: Ctx): number {
  const { spec, box } = ctx;
  const pole = 14 + spec.length * 12;
  box("pole", "root", 0, -pole * 0.4, 1.8, pole, 1.8, TILE.handle);
  box("collar", "root", 0, pole * 0.55, 3, 1.5, 3, TILE.secondary);
  const bladeH = 3 + spec.width * 2;
  const bladeL = 10 + spec.length * 8;
  box("tang", "blade", 2, pole * 0.55, 3, 1.5, 1.5, TILE.primary);
  box("curve", "blade", 5, pole * 0.5, bladeL, bladeH, 1, TILE.secondary);
  box("edge", "blade", 5.5, pole * 0.5 + bladeH - 0.4, bladeL - 1, 0.5, 0.6, TILE.accent);
  box("hook", "blade", 5 + bladeL / 2, pole * 0.5 + bladeH, 2, 2.5, 1, TILE.accent);
  if (ctx.has("bones")) {
    box("skull", "head", 0, pole * 0.6, 3, 3, 3, TILE.trim);
    box("jaw", "head", 0, pole * 0.55, 2.2, 1.2, 2.2, TILE.trim);
  }
  if (ctx.has("hood")) box("cowl", "head", 0, pole * 0.62, 4, 2, 3, TILE.dark);
  A().addFloating(ctx, 5, pole * 0.55 + 6, 1);
  return finish(ctx, pole * 0.7 + 6, pole, 6, pole * 0.5, 4);
}

function buildWand(ctx: Ctx): number {
  const { spec, box } = ctx;
  const sh = 10 + spec.length * 10;
  box("shaft", "root", 0, -sh, 1.2, sh, 1.2, TILE.handle);
  box("wrap", "root", 0, -sh / 2, 1.6, 2, 1.6, TILE.secondary);
  box("tip_set", "head", 0, 0, 2.2, 2.2, 2.2, TILE.primary);
  ctx.glow("crystal", "head", 0, 3, 0, 2.4);
  const n = 4 + Math.floor(spec.detail * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ctx.glow(`mote_${i}`, "floating", Math.cos(a) * 3.5, 3 + Math.sin(a * 2), Math.sin(a) * 3.5, 0.9);
  }
  A().addMagicCircle(ctx, 5, 4);
  A().addFloating(ctx, 0, 7, 1);
  return finish(ctx, 9, sh, 3, 0, 3);
}

function buildCrossbow(ctx: Ctx): number {
  const { spec, box } = ctx;
  const span = 8 + spec.width * 6;
  box("stock", "root", 0, -4, 2.2, 8, 2.2, TILE.handle);
  box("prod", "root", 0, 4, span, 1.5, 1.5, TILE.primary);
  box("limb_l", "root", -span / 2, 4, 2, 4, 1.2, TILE.secondary);
  box("limb_r", "root", span / 2, 4, 2, 4, 1.2, TILE.secondary);
  box("string", "root", 0, 6, span, 0.4, 0.4, TILE.glow, true);
  box("bolt", "blade", 0, 2, 0.8, 8 + spec.length * 4, 0.8, TILE.accent);
  box("head", "blade", 0, 10 + spec.length * 4, 1.6, 2, 1.6, TILE.gem, true);
  A().addFloating(ctx, 0, 14, 1);
  return finish(ctx, 16, 12, span, 4, 4);
}

function buildCannon(ctx: Ctx): number {
  const { spec, box } = ctx;
  const barrel = 10 + spec.length * 8;
  box("carriage", "root", 0, -3, 6, 3, 4, TILE.secondary);
  box("wheel_l", "root", -3.5, -3, 1.5, 4, 4, TILE.dark);
  box("wheel_r", "root", 3.5, -3, 1.5, 4, 4, TILE.dark);
  box("barrel", "blade", 0, 0, 3.5, barrel, 3.5, TILE.primary);
  box("muzzle", "blade", 0, barrel, 4.2, 1.5, 4.2, TILE.accent);
  box("fuse", "root", 0, 2, 0.6, 2.5, 0.6, TILE.handle);
  ctx.glow("shot", "head", 0, barrel + 3, 0, 2);
  A().addFloating(ctx, 0, barrel + 5, 1);
  return finish(ctx, barrel + 6, barrel, 6, 0, 4);
}

function buildGrimoire(ctx: Ctx): number {
  const { spec, box } = ctx;
  const pw = 7 + spec.width * 3;
  const ph = 6 + spec.length * 3;
  box("left", "root", -pw / 3, 0, pw * 0.55, ph, 0.8, TILE.primary);
  box("right", "root", pw / 3, 0, pw * 0.55, ph, 0.8, TILE.secondary);
  box("pages_l", "root", -pw / 3, 0.2, pw * 0.45, ph - 1, 1.4, TILE.trim);
  box("pages_r", "root", pw / 3, 0.2, pw * 0.45, ph - 1, 1.4, TILE.trim);
  box("spine", "root", 0, 0, 1.2, ph, 2, TILE.accent);
  A().addMagicCircle(ctx, -ph / 2 - 3, 7.5);
  A().addMagicCircle(ctx, ph / 2 + 3, 4);
  const pages = 4 + Math.floor(spec.detail * 3);
  for (let i = 0; i < pages; i++) {
    const a = (i / pages) * Math.PI;
    box(`page_${i}`, "floating", Math.cos(a) * 5, 2 + i * 0.6, 2, 0.3, 1.6, TILE.trim);
  }
  ctx.glow("sigil", "head", 0, 4, 0, 2);
  A().addFloating(ctx, 0, ph / 2 + 6, 1.5);
  return finish(ctx, ph / 2 + 8, ph, pw, 0, ph);
}

function buildMechblade(ctx: Ctx): number {
  const { spec, box } = ctx;
  const hH = 4 + spec.length * 3;
  const bH = 10 + spec.length * 10;
  box("grip", "root", 0, -hH, 2.4, hH, 2.4, TILE.handle);
  box("piston", "root", 0, 0, 4, 3, 3, TILE.primary);
  box("vent_l", "root", -2.5, 1, 1, 2, 1, TILE.dark);
  box("vent_r", "root", 2.5, 1, 1, 2, 1, TILE.dark);
  const segs = 4;
  for (let i = 0; i < segs; i++) {
    box(`seg_${i}`, "blade", 0, 3 + i * (bH / segs), 2.2 - i * 0.2, bH / segs + 0.4, 1.4, i % 2 ? TILE.secondary : TILE.accent);
  }
  box("exhaust", "root", 0, -hH - 1.5, 1.5, 1.5, 1.5, TILE.glow, true);
  if (ctx.has("gears")) box("hub", "root", 0, 2, 3.5, 1, 3.5, TILE.dark);
  A().addFloating(ctx, 0, 5 + bH, 1);
  return finish(ctx, 6 + bH, bH, 5, 0, 4);
}

function buildBloodblade(ctx: Ctx): number {
  const { spec, box } = ctx;
  const hH = 3 + spec.length * 3;
  const bH = 12 + spec.length * 10;
  const bW = 2.5 + spec.width * 2;
  box("bone_grip", "root", 0, -hH, 2, hH, 2, TILE.handle);
  box("guard", "root", 0, 0, 7, 1.8, 2.5, TILE.primary);
  box("blade", "blade", 0, 2, bW, bH, 1, TILE.secondary);
  box("vein", "blade", 0, 2, 0.7, bH, 0.7, TILE.gem, true);
  for (let i = 0; i < 6; i++) {
    box(`jag_${i}`, "blade", (i % 2 ? 1 : -1) * (bW / 2 + 0.6), 3 + i * (bH / 7), 1.2, 1.6, 0.6, TILE.accent);
    box(`drip_${i}`, "trail", (i % 2 ? 0.8 : -0.8), 2 + i * 1.6, 0.5, 1.8, 0.5, TILE.gem, true);
  }
  box("tip", "blade", 0, 2 + bH, 1.2, 2, 1, TILE.accent);
  if (ctx.has("fangs")) {
    box("fang_l", "head", -3, 1, 1.2, 3, 1.2, TILE.gem, true);
    box("fang_r", "head", 3, 1, 1.2, 3, 1.2, TILE.gem, true);
  }
  A().addFloating(ctx, 0, 5 + bH, 1);
  return finish(ctx, 6 + bH, bH, 7, 0, 4);
}

export function makeExtraBuilders(bound: WeaponApi): Record<string, (c: Ctx) => number> {
  api = bound;
  return {
    chainsaw: buildChainsaw,
    gun: buildGun,
    railgun: buildRailgun,
    relic: buildRelic,
    spear: buildSpear,
    mace: buildMace,
    scythe: buildScythe,
    wand: buildWand,
    crossbow: buildCrossbow,
    cannon: buildCannon,
    grimoire: buildGrimoire,
    mechblade: buildMechblade,
    bloodblade: buildBloodblade,
  };
}