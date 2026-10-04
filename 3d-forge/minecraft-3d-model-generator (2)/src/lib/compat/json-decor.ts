import {
  ACCENT_IDS, BODY_ANIMS, DECOR_ANIMS, DECOR_IDS, DEFAULT_EXTRAS, EFFECT_IDS, TRANSFORM_ANIMS, SLOT_IDS,
  type AccentId, type DecorId, type DecorInstance, type DetailLevel, type EffectId, type Extras, type Intensity, type SlotId, type Vec3, type VoxelCube,
} from "./json-catalog";

import { isHex, resolvedColor, shadeColor } from "./json-colors";

// ---- Options for the UI ------------------------------------------------------------------------

export interface Option<T extends string> { id: T; label: string; category?: string; hint?: string }
export const SLOT_OPTIONS: (Option<SlotId> & { note: string })[] = [
  { id: "guard", label: "鍔", note: "剣・槍・弓の付け根" },
  { id: "pommel", label: "柄頭", note: "柄の末端" },
  { id: "grip", label: "柄", note: "握る部分" },
  { id: "blade_top", label: "刃先", note: "刃・角・先端" },
  { id: "blade_sides", label: "刃の側面", note: "刃・本体の両側" },
  { id: "head", label: "頭", note: "頭部・オーブ・先端" },
  { id: "body", label: "本体", note: "中央の主要部" },
  { id: "sides", label: "両脇", note: "全体の外側" },
  { id: "everywhere", label: "全体", note: "モデル全体に散らす" },
];
export const INTENSITY_OPTIONS: { id: Intensity; label: string; mul: number }[] = [
  { id: "few", label: "少なめ", mul: .5 },
  { id: "normal", label: "普通", mul: 1 },
  { id: "many", label: "多め", mul: 1.7 },
];
export const DECOR_OPTIONS: (Option<DecorId> & { swatch?: string })[] = [
  // Gem & metal
  { id: "gems", label: "宝石", category: "宝石・金属", hint: "カットされた宝石", swatch: "#4fd5cf" },
  { id: "studs", label: "リベット", category: "宝石・金属", hint: "金属の丸い留め具", swatch: "#c7cbd2" },
  { id: "rings", label: "リング", category: "宝石・金属", hint: "はまった金属リング", swatch: "#f2cf7a" },
  { id: "chains", label: "鎖", category: "宝石・金属", hint: "垂れ下がる金属の鎖", swatch: "#9a9fab" },
  { id: "tassels", label: "房飾り", category: "宝石・金属", hint: "房やフリンジ", swatch: "#b9793e" },
  { id: "ribbons", label: "リボン", category: "宝石・金属", hint: "たなびく布", swatch: "#c29af5" },
  { id: "pendants", label: "ペンダント", category: "宝石・金属", hint: "ぶら下がる飾り", swatch: "#f29bb8" },
  { id: "brooches", label: "ブローチ", category: "宝石・金属", hint: "はめ込まれた飾り", swatch: "#66e0ea" },
  { id: "filigree", label: "象嵌", category: "宝石・金属", hint: "細い金属の文様", swatch: "#f2cf7a" },
  // Magical
  { id: "runes", label: "ルーン", category: "魔法", hint: "光る刻印", swatch: "#b99bff" },
  { id: "crystals", label: "クリスタル", category: "魔法", hint: "透明な結晶の欠片", swatch: "#76b7df" },
  { id: "orbs", label: "オーブ", category: "魔法", hint: "浮かぶ光の球", swatch: "#ead9ff" },
  { id: "trails", label: "トレイル", category: "魔法", hint: "残像のような光の筋", swatch: "#a37ce0" },
  // Fire & ice
  { id: "flames", label: "炎", category: "火・氷", hint: "揺らめく炎", swatch: "#e0ab5c" },
  { id: "smoke", label: "煙", category: "火・氷", hint: "漂う煙", swatch: "#66596a" },
  { id: "stars", label: "星", category: "火・氷", hint: "輝く星の粒", swatch: "#eef1f8" },
  { id: "snow", label: "雪", category: "火・氷", hint: "雪の結晶", swatch: "#d0efff" },
  { id: "lightning", label: "稲妻", category: "火・氷", hint: "走る電光", swatch: "#66e0ea" },
  // Nature
  { id: "vines", label: "蔦", category: "自然", hint: "巻きつく蔦", swatch: "#3a9e82" },
  { id: "leaves", label: "葉", category: "自然", hint: "散らばる葉", swatch: "#6fc5aa" },
  { id: "branches", label: "枝", category: "自然", hint: "小さな枝", swatch: "#7b5a58" },
];

export const DECOR_CATEGORIES = ["宝石・金属", "魔法", "火・氷", "自然"];
export const categoryOf = (id: DecorId) => DECOR_OPTIONS.find(o => o.id === id)?.category ?? "宝石・金属";
export const decoLabel = (id: DecorId) => DECOR_OPTIONS.find(o => o.id === id)?.label ?? id;
export const slotLabel = (id: SlotId) => SLOT_OPTIONS.find(o => o.id === id)?.label ?? id;
export const intensityLabel = (id: Intensity) => INTENSITY_OPTIONS.find(o => o.id === id)?.label ?? id;

export function defaultSlot(kind: DecorId): SlotId {
  if (["gems","studs","rings","brooches","filigree"].includes(kind)) return "guard";
  if (["chains","tassels","pendants"].includes(kind)) return "pommel";
  if (["ribbons"].includes(kind)) return "blade_sides";
  if (["runes","crystals","trails","lightning"].includes(kind)) return "blade_top";
  if (["orbs"].includes(kind)) return "head";
  if (["flames","smoke","snow","stars"].includes(kind)) return "sides";
  if (["vines","leaves","branches"].includes(kind)) return "body";
  return "guard";
}
export const makeInstance = (kind: DecorId, slot?: SlotId, intensity?: Intensity, color?: AccentId | null): DecorInstance =>
  ({ kind, slot: slot ?? defaultSlot(kind), intensity: intensity ?? "normal", color: color ?? null });

// ---- Style presets ---------------------------------------------------------------------------

export interface StylePreset { id: string; label: string; desc: string; decor: DecorInstance[]; accent: AccentId; defaultEffect: EffectId; swatch: string }
export const STYLE_PRESETS: StylePreset[] = [
  { id: "plain", label: "シンプル", desc: "装飾なし", decor: [], accent: "auto", defaultEffect: "none", swatch: "#aaa" },
  { id: "ornate", label: "宝石装飾", desc: "鍔に宝石、柄に象嵌、柄頭に房飾り", decor: [
    makeInstance("gems","guard","few"), makeInstance("gems","pommel","few"),
    makeInstance("filigree","grip","many"), makeInstance("tassels","pommel","normal"),
  ], accent: "gold", defaultEffect: "sparkle", swatch: "#f2cf7a" },
  { id: "ancient", label: "古代", desc: "刃にルーン刻印、柄頭にペンダント", decor: [
    makeInstance("runes","blade_top","many"), makeInstance("runes","blade_sides","few"),
    makeInstance("pendants","pommel","normal"), makeInstance("studs","guard","few"),
  ], accent: "cyan", defaultEffect: "magic", swatch: "#66e0ea" },
  { id: "elven", label: "エルフ", desc: "蔦・葉・枝で包む", decor: [
    makeInstance("vines","grip","many"), makeInstance("leaves","blade_sides","normal"),
    makeInstance("branches","pommel","few"), makeInstance("leaves","blade_top","few"),
  ], accent: "emerald", defaultEffect: "snow", swatch: "#5bdc9a" },
  { id: "steampunk", label: "スチームパンク", desc: "リベット、鎖、象嵌", decor: [
    makeInstance("studs","guard","many"), makeInstance("chains","pommel","normal"),
    makeInstance("rings","grip","normal"), makeInstance("studs","head","few"),
  ], accent: "gold", defaultEffect: "none", swatch: "#c7cbd2" },
  { id: "dark_gothic", label: "ゴシック", desc: "鎖・オーブ・象嵌", decor: [
    makeInstance("chains","blade_sides","many"), makeInstance("orbs","guard","normal"),
    makeInstance("pendants","pommel","normal"), makeInstance("filigree","grip","few"),
  ], accent: "lavender", defaultEffect: "soulfire", swatch: "#66596a" },
  { id: "frost", label: "フロスト", desc: "雪・クリスタル・稲妻", decor: [
    makeInstance("snow","blade_sides","many"), makeInstance("crystals","guard","normal"),
    makeInstance("snow","blade_top","normal"), makeInstance("lightning","blade_top","few"),
  ], accent: "cyan", defaultEffect: "snow", swatch: "#d0efff" },
  { id: "fire", label: "フレイム", desc: "炎・煙・トレイル", decor: [
    makeInstance("flames","blade_sides","many"), makeInstance("flames","blade_top","normal"),
    makeInstance("smoke","head","few"), makeInstance("trails","guard","few"),
  ], accent: "gold", defaultEffect: "flame", swatch: "#e0ab5c" },
  { id: "sea", label: "海", desc: "クリスタル・鎖・ペンダント", decor: [
    makeInstance("crystals","head","normal"), makeInstance("chains","blade_sides","few"),
    makeInstance("pendants","pommel","normal"), makeInstance("studs","guard","few"),
  ], accent: "cyan", defaultEffect: "soulfire", swatch: "#4389c4" },
  { id: "wild", label: "ワイルド", desc: "枝・蔦・リベット", decor: [
    makeInstance("branches","grip","many"), makeInstance("vines","blade_sides","normal"),
    makeInstance("studs","guard","few"), makeInstance("leaves","pommel","normal"),
  ], accent: "emerald", defaultEffect: "none", swatch: "#7b5a58" },
  { id: "elegant", label: "エレガント", desc: "ブローチ・象嵌・リボン", decor: [
    makeInstance("brooches","guard","normal"), makeInstance("filigree","grip","many"),
    makeInstance("ribbons","blade_sides","few"), makeInstance("pendants","pommel","few"),
  ], accent: "rose", defaultEffect: "hearts", swatch: "#f29bb8" },
  { id: "fantasy", label: "ファンタジー", desc: "オーブ・トレイル・ルーン", decor: [
    makeInstance("orbs","head","normal"), makeInstance("trails","blade_sides","many"),
    makeInstance("runes","guard","few"), makeInstance("crystals","blade_top","few"),
  ], accent: "lavender", defaultEffect: "magic", swatch: "#b99bff" },
  { id: "ethereal", label: "エーテル", desc: "星・トレイル・オーブ", decor: [
    makeInstance("stars","everywhere","many"), makeInstance("trails","blade_sides","normal"),
    makeInstance("orbs","head","few"), makeInstance("runes","guard","few"),
  ], accent: "white", defaultEffect: "sparkle", swatch: "#eef1f8" },
];

// ---- Exported helpers -------------------------------------------------------------------------

export const MAX_DECOR = 30;
export function normalizeInstance(value: DecorInstance | string, index = 0): DecorInstance {
  const legacy: Record<string, DecorId> = { halo: "rings", sparkles: "stars", ribbon: "ribbons", tassel: "tassels", wings: "leaves", flame: "flames" };
  const raw = typeof value === "string" ? makeInstance(legacy[value] ?? (DECOR_IDS.includes(value as DecorId) ? value as DecorId : "gems")) : value;
  return { kind: raw.kind, slot: raw.slot, intensity: raw.intensity ?? "normal", color: raw.color ?? null,
    id: raw.id ?? `decor-${index}-${raw.kind}`, count: raw.count ?? (raw.intensity === "few" ? 1 : raw.intensity === "many" ? 5 : 3),
    size: raw.size ?? 1, offset: [...(raw.offset ?? [0, 0, 0])] as Vec3, spacing: raw.spacing ?? 1, mirror: raw.mirror ?? false, visible: raw.visible ?? true };
}
export const normalizeExtras = (extras?: Extras | null): Extras => ({
  ...DEFAULT_EXTRAS, ...extras, decor: (extras?.decor ?? []).map((value, index) => normalizeInstance(value, index)),
  animation: { ...DEFAULT_EXTRAS.animation, ...extras?.animation },
});
export const hasExtras = (extras?: Extras | null) => {
  const e = normalizeExtras(extras);
  return e.decor.length > 0 || e.effect !== "none" || e.accent !== "auto" || e.animation.body !== "none" || e.animation.transform !== "none" || e.animation.shimmer;
};

export function applyAccent(palette: string[], accent: AccentId): string[] {
  const slot = (ACCENT_IDS as readonly string[]).indexOf(accent);
  if (slot < 1) return palette;
  // accent colors: 0=auto, 1=gold, 2=rose, 3=cyan, 4=emerald, 5=lavender, 6=white
  const ACCENT = [
    null, ["#f2cf7a","#fff2c8"], ["#f29bb8","#ffe3ee"], ["#66e0ea","#dffcff"],
    ["#5bdc9a","#dcffec"], ["#b99bff","#f0e8ff"], ["#e9edf5","#ffffff"],
  ][slot] as [string, string] | null;
  if (!ACCENT) return palette;
  const next = [...palette];
  next[4] = ACCENT[0]; next[7] = ACCENT[1];
  return next;
}

export function boundsOf(cubes: VoxelCube[]) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const cube of cubes) for (let axis = 0; axis < 3; axis++) { min[axis] = Math.min(min[axis], cube.from[axis]); max[axis] = Math.max(max[axis], cube.to[axis]); }
  return { minX: min[0], minY: min[1], minZ: min[2], maxX: max[0], maxY: max[1], maxZ: max[2] };
}
const r3 = (value: number) => Math.round(value * 1000) / 1000;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ---- Geometry builders per decoration kind ---------------------------------------------------

function geometricSlot(slot: SlotId, b: ReturnType<typeof boundsOf>): { cx: number; cy: number; cz: number; halfW: number; halfD: number; top: number; bottom: number } {
  const h = b.maxY - b.minY, cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2, halfW = Math.max(1.5, (b.maxX - b.minX) / 2 + 1), halfD = Math.max(1.5, (b.maxZ - b.minZ) / 2 + 1);
  switch (slot) {
    case "guard": return { cx, cy: b.minY + h * .22, cz, halfW: halfW + .6, halfD: halfD + .4, top: b.minY + h * .35, bottom: b.minY + h * .12 };
    case "pommel": return { cx, cy: b.minY - 1, cz, halfW: halfW * .6, halfD: halfD * .6, top: b.minY + 1, bottom: b.minY - 3 };
    case "grip": return { cx, cy: b.minY + h * .08, cz, halfW: halfW * .7, halfD: halfD * .7, top: b.minY + h * .18, bottom: b.minY };
    case "blade_top": return { cx, cy: b.maxY - 2, cz, halfW: halfW * .5, halfD: halfD * .5, top: b.maxY + 2, bottom: b.maxY - 4 };
    case "blade_sides": return { cx, cy: b.minY + h * .55, cz, halfW: halfW + .8, halfD: halfD + .6, top: b.maxY - 2, bottom: b.minY + h * .25 };
    case "head": return { cx, cy: b.maxY + .5, cz, halfW: halfW * .5, halfD: halfD * .5, top: b.maxY + 3, bottom: b.maxY - 1 };
    case "body": return { cx, cy: b.minY + h * .45, cz, halfW: halfW * .8, halfD: halfD * .8, top: b.minY + h * .7, bottom: b.minY + h * .2 };
    case "sides": return { cx, cy: b.minY + h * .4, cz, halfW: halfW + 2, halfD: halfD + 1.5, top: b.maxY, bottom: b.minY };
    default: return { cx, cy: b.minY + h * .4, cz, halfW: halfW + 2, halfD: halfD + 2, top: b.maxY + 1, bottom: b.minY - 2 };
  }
}
function slotAnchor(slot: SlotId, b: ReturnType<typeof boundsOf>, body: VoxelCube[] = []) {
  const anchor = geometricSlot(slot, b);
  const patterns: Partial<Record<SlotId, RegExp>> = {
    guard: /^(?:guard_core|guard|collar|binding|socket|riser_upper|lock|crossbar)$/,
    grip: /^(?:grip|handle|shaft|pole|trunk|stem)$/,
    pommel: /^(?:pommel_base|pommel|end_cap|butt|ferrule|grip_bar)$/,
    head: /^(?:head_core|head|orb_mid|cap_top|roof_top|leaves_crown)$/,
    body: /^(?:body|chest_base|walls|light|stem|trunk)$/,
  };
  const targets = patterns[slot] ? body.filter(cube => patterns[slot]!.test(cube.name)) : [];
  if (targets.length) {
    const region = boundsOf(targets);
    anchor.cx = (region.minX + region.maxX) / 2; anchor.cy = (region.minY + region.maxY) / 2; anchor.cz = (region.minZ + region.maxZ) / 2;
    anchor.top = region.maxY; anchor.bottom = region.minY;
    anchor.halfW = Math.max(.8, (region.maxX - region.minX) / 2); anchor.halfD = Math.max(.6, (region.maxZ - region.minZ) / 2);
    return { ...anchor, surface: region.maxZ + .035 };
  }
  const nearest = body.filter(cube => cube.from[1] <= anchor.cy && cube.to[1] >= anchor.cy);
  return { ...anchor, surface: (nearest.length ? Math.max(...nearest.map(cube => cube.to[2])) : b.maxZ) + .035 };
}
const count = (intensity: Intensity) => intensity === "few" ? 1 : intensity === "many" ? 3 : 2;

function gemDeco(inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number, glow: boolean): VoxelCube[] {
  const n = inst.count ?? count(inst.intensity);
  const x = a.cx + (i - (n - 1) / 2) * 1.65 * (inst.spacing ?? 1), y = a.cy, z = a.surface;
  const cube = (suffix: string, from: Vec3, to: Vec3, c: number): VoxelCube => ({ name: `dec_gem_${inst.slot}_${i}_${suffix}`, from, to, color: c, group: "decor", ...(glow && suffix !== "setting" ? { glow: true } : {}) });
  return [cube("setting", [x - .62, y - .78, z], [x + .62, y + .78, z + .22], 4),
    cube("facet", [x - .44, y - .52, z + .22], [x + .44, y + .52, z + .52], color),
    cube("crown", [x - .28, y - .32, z + .52], [x + .28, y + .32, z + .69], 7)];
}

function studDeco(inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number): VoxelCube[] {
  const angle = i * 2.399963 + (inst.slot === "guard" ? 0 : 1.2);
  const x = a.cx + Math.cos(angle) * (a.halfW * .55) - .25, y = a.cy + (i - 1) * 1.1, z = a.cz + Math.sin(angle) * (a.halfD * .4) - .25;
  return [{ name: `dec_stud_${inst.slot}_${i}`, from: [r3(x), r3(y), r3(z)], to: [r3(x + .5), r3(y + .5), r3(z + .5)], color, group: "decor" }];
}
function ringDeco(inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number): VoxelCube[] {
  const r = a.halfW * .45 + i * .3, y = a.cy + i * .8;
  const cubes: VoxelCube[] = [];
  for (let j = 0; j < 8; j++) { const angle = j * Math.PI / 4; cubes.push({ name: `dec_ring_${inst.slot}_${i}_${j}`, from: [r3(a.cx + Math.cos(angle) * r - .4), r3(y), r3(a.cz + Math.sin(angle) * r - .4)], to: [r3(a.cx + Math.cos(angle) * r + .4), r3(y + .4), r3(a.cz + Math.sin(angle) * r + .4)], color, group: "decor" }); }
  return cubes;
}
function chainDeco(inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number): VoxelCube[] {
  const cubes: VoxelCube[] = [];
  const x = a.cx + (i - 1) * 1.2;
  for (let k = 0; k < 4; k++) { const y = a.bottom - k * .9; cubes.push({ name: `dec_chain_${inst.slot}_${i}_${k}`, from: [r3(x - .3), r3(y), r3(a.cz - .3)], to: [r3(x + .3), r3(y + .8), r3(a.cz + .3)], color, group: "decor", motion: { kind: "sway", phase: r3(k * .08), pivot: [x, a.top, a.cz], amp: 4 } }); }
  return cubes;
}
function tasselDeco(inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number): VoxelCube[] {
  const x = a.cx + (i - 1) * 1.6, top: Vec3 = [x, a.bottom, a.cz];
  return [
    { name: `dec_tassel_${inst.slot}_${i}_k`, from: [r3(x - .4), r3(a.bottom - 1), r3(a.cz - .4)], to: [r3(x + .4), r3(a.bottom), r3(a.cz + .4)], color: 4, group: "decor", motion: { kind: "sway", phase: r3(i * .12), pivot: top, amp: 5 } },
    { name: `dec_tassel_${inst.slot}_${i}_b`, from: [r3(x - .7), r3(a.bottom - 2.8), r3(a.cz - .7)], to: [r3(x + .7), r3(a.bottom - 1), r3(a.cz + .7)], color, group: "decor", motion: { kind: "sway", phase: r3(i * .12 + .04), pivot: top, amp: 6 } },
  ];
}
function ribbonDeco(inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number): VoxelCube[] {
  const cubes: VoxelCube[] = [];
  const side = i % 2 === 0 ? 1 : -1;
  for (let k = 0; k < 5; k++) { const x = a.cx + side * (a.halfW + .5) + Math.sin(k * .6) * .3, y = a.cy - k * 1.1, w = 1 - k * .04; cubes.push({ name: `dec_ribbon_${inst.slot}_${i}_${k}`, from: [r3(x), r3(y), r3(a.cz - .15)], to: [r3(x + w), r3(y + 1.1), r3(a.cz + .15)], color, group: "decor", motion: { kind: "sway", phase: r3(k * .09 + i * .15), pivot: [x + w / 2, a.cy, a.cz], amp: r3(6 + k) } }); }
  return cubes;
}
function runeDeco(inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number, glow: boolean): VoxelCube[] {
  const y = a.bottom + i * ((a.top - a.bottom) / (count(inst.intensity) + 1));
  return [{ name: `dec_rune_${inst.slot}_${i}`, from: [r3(a.cx - .4), r3(y), r3(a.cz - a.halfD * .6 - .15)], to: [r3(a.cx + .4), r3(y + .7), r3(a.cz - a.halfD * .6)], color, group: "decor", motion: { kind: "twinkle", phase: r3(i * .13) }, ...(glow ? { glow: true } : {}) }];
}
function crystalDeco(inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number, glow: boolean): VoxelCube[] {
  const s = .5 + i * .15, x = a.cx + (i - 1) * 1.2 - s / 2, y = a.cy - .2;
  return [{ name: `dec_crystal_${inst.slot}_${i}`, from: [r3(x), r3(y), r3(a.cz - s / 3)], to: [r3(x + s), r3(y + s * 1.5), r3(a.cz + s / 3)], color, group: "decor", ...(glow ? { glow: true } : {}) }];
}
function orbDeco(inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number, glow: boolean): VoxelCube[] {
  const s = .7 + i * .2, x = a.cx - s / 2, y = a.top + i * .8;
  return [{ name: `dec_orb_${inst.slot}_${i}`, from: [r3(x), r3(y), r3(a.cz - s / 2)], to: [r3(x + s), r3(y + s), r3(a.cz + s / 2)], color, group: "decor", motion: { kind: "bob", phase: r3(i * .19) }, ...(glow ? { glow: true } : {}) }];
}
function trailDeco(inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number, glow: boolean): VoxelCube[] {
  const cubes: VoxelCube[] = [];
  for (let k = 0; k < 4; k++) { const s = .45 - k * .08, y = a.cy + k * 1.3; cubes.push({ name: `dec_trail_${inst.slot}_${i}_${k}`, from: [r3(a.cx - s / 2 + i * .4), r3(y), r3(a.cz - s / 2)], to: [r3(a.cx + s / 2 + i * .4), r3(y + s), r3(a.cz + s / 2)], color, group: "decor", motion: { kind: "twinkle", phase: r3(k * .11 + i * .2) }, ...(glow && k < 2 ? { glow: true } : {}) }); }
  return cubes;
}
function flameDeco(inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number): VoxelCube[] {
  const cubes: VoxelCube[] = [];
  const n = 5;
  for (let k = 0; k < n; k++) { const y = a.bottom + (a.top - a.bottom) * (k / n), hh = .9 - k * .08, side = (i % 2 === 0 ? 1 : -1) * (a.halfW + .5 + k * .1); cubes.push({ name: `dec_flame_${inst.slot}_${i}_${k}`, from: [r3(a.cx + side - .4), r3(y), r3(a.cz - .4)], to: [r3(a.cx + side + .4), r3(y + hh), r3(a.cz + .4)], color: k < n - 1 ? 4 : 7, group: "decor", ...(k < 2 ? { glow: true } : {}), motion: { kind: "flicker", phase: r3(k * .17 + i * .25) } }); }
  return cubes;
}
function smokeDeco(_inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number): VoxelCube[] {
  const s = .8 + i * .2, y = a.top + i * 1.2;
  return [{ name: `dec_smoke_${i}`, from: [r3(a.cx - s / 2), r3(y), r3(a.cz - s / 2)], to: [r3(a.cx + s / 2), r3(y + s), r3(a.cz + s / 2)], color, group: "decor", motion: { kind: "drift", phase: r3(i * .22) } }];
}
function starDeco(_inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number, glow: boolean): VoxelCube[] {
  const angle = i * 2.399963, r = a.halfW + 1.2 + (i % 2) * .6, s = i % 3 === 0 ? .55 : .35, y = a.bottom + (a.top - a.bottom) * ((i + .5) / 8);
  return [{ name: `dec_star_${i}`, from: [r3(a.cx + Math.cos(angle) * r - s / 2), r3(y), r3(a.cz + Math.sin(angle) * r - s / 2)], to: [r3(a.cx + Math.cos(angle) * r + s / 2), r3(y + s), r3(a.cz + Math.sin(angle) * r + s / 2)], color, group: "decor", motion: { kind: i % 2 ? "orbit" : "twinkle", phase: r3(i / 8) }, ...(glow ? { glow: true } : {}) }];
}
function snowDeco(_inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number): VoxelCube[] {
  const x = a.cx + (Math.sin(i * 1.7) * (a.halfW + 1.5)), y = a.top + i * .6, z = a.cz + (Math.cos(i * 2.1) * (a.halfD + 1));
  return [{ name: `dec_snow_${i}`, from: [r3(x - .2), r3(y), r3(z - .2)], to: [r3(x + .2), r3(y + .4), r3(z + .2)], color, group: "decor", motion: { kind: "drift", phase: r3(i * .14) } }];
}
function lightningDeco(inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number, glow: boolean): VoxelCube[] {
  const cubes: VoxelCube[] = [];
  let x = a.cx + (i - 1) * 1.5, y = a.top;
  for (let k = 0; k < 4; k++) { const dx = (k % 2 ? 1 : -1) * (.4 + k * .15); cubes.push({ name: `dec_lightning_${inst.slot}_${i}_${k}`, from: [r3(x), r3(y), r3(a.cz - .2)], to: [r3(x + .5), r3(y + .6), r3(a.cz + .2)], color, group: "decor", motion: { kind: "flicker", phase: r3(k * .25 + i * .18) }, ...(glow ? { glow: true } : {}) }); x += dx; y -= .7; }
  return cubes;
}
function vineDeco(inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number): VoxelCube[] {
  const cubes: VoxelCube[] = [];
  const side = i % 2 === 0 ? 1 : -1;
  for (let k = 0; k < 5; k++) { const x = a.cx + side * (a.halfW * .6 + k * .4) + Math.sin(k * .8) * .3, y = a.cy + k * .9, s = .35 - k * .02; cubes.push({ name: `dec_vine_${inst.slot}_${i}_${k}`, from: [r3(x - s), r3(y), r3(a.cz - s)], to: [r3(x + s), r3(y + .9), r3(a.cz + s)], color, group: "decor", motion: { kind: "sway", phase: r3(k * .09), pivot: [x, a.cy, a.cz], amp: 3 } }); }
  return cubes;
}
function leafDeco(_inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number): VoxelCube[] {
  const angle = i * 2.399963, r = a.halfW + .8 + (i % 2) * .5, y = a.cy + i * 1.2 - 1.5;
  return [{ name: `dec_leaf_${i}`, from: [r3(a.cx + Math.cos(angle) * r - .5), r3(y), r3(a.cz + Math.sin(angle) * r - .2)], to: [r3(a.cx + Math.cos(angle) * r + .5), r3(y + .35), r3(a.cz + Math.sin(angle) * r + .2)], color, group: "decor", motion: { kind: "drift", phase: r3(i * .16) } }];
}
function branchDeco(inst: DecorInstance, a: ReturnType<typeof slotAnchor>, i: number, color: number): VoxelCube[] {
  const side = i % 2 === 0 ? 1 : -1, y = a.cy + i * .8;
  return [{ name: `dec_branch_${inst.slot}_${i}`, from: [r3(Math.min(a.cx + side * .8, a.cx + side * (a.halfW * .7 + 1))), r3(y), r3(a.cz - .3)], to: [r3(Math.max(a.cx + side * .8, a.cx + side * (a.halfW * .7 + 1))), r3(y + .5), r3(a.cz + .3)], color, group: "decor", motion: { kind: "sway", phase: r3(i * .11), pivot: [a.cx, y, a.cz], amp: 4 } }];
}

function buildInstance(inst: DecorInstance, b: ReturnType<typeof boundsOf>, detail: DetailLevel, body: VoxelCube[]): VoxelCube[] {
  const a = slotAnchor(inst.slot, b, body);
  const n = inst.count ?? Math.max(1, Math.round(count(inst.intensity) * (detail === "high" ? 1.4 : detail === "low" ? .6 : 1)));
  const color = inst.kind === "filigree" ? 4 : inst.kind === "studs" ? 4 : inst.kind === "chains" ? 6 : inst.kind === "rings" ? 4 : inst.kind === "runes" ? 7 : 1;
  const glow = ["runes","crystals","orbs","trails","flames","lightning","snow"].includes(inst.kind);
  const cubes: VoxelCube[] = [];
  for (let i = 0; i < n; i++) {
    switch (inst.kind) {
      case "gems": cubes.push(...gemDeco(inst, a, i, color, glow)); break;
      case "studs": cubes.push(...studDeco(inst, a, i, 4)); break;
      case "rings": cubes.push(...ringDeco(inst, a, i, 4)); break;
      case "chains": cubes.push(...chainDeco(inst, a, i, 6)); break;
      case "tassels": cubes.push(...tasselDeco(inst, a, i, 0)); break;
      case "ribbons": cubes.push(...ribbonDeco(inst, a, i, 2)); break;
      case "pendants": cubes.push(...gemDeco(inst, a, i, 0, true)); break;
      case "brooches": cubes.push(...studDeco(inst, a, i, 0)); break;
      case "filigree": cubes.push(...ribbonDeco(inst, a, i, 4)); break;
      case "runes": cubes.push(...runeDeco(inst, a, i, 7, true)); break;
      case "crystals": cubes.push(...crystalDeco(inst, a, i, 1, true)); break;
      case "orbs": cubes.push(...orbDeco(inst, a, i, 1, true)); break;
      case "trails": cubes.push(...trailDeco(inst, a, i, 1, true)); break;
      case "flames": cubes.push(...flameDeco(inst, a, i, 4)); break;
      case "smoke": cubes.push(...smokeDeco(inst, a, i, 6)); break;
      case "stars": cubes.push(...starDeco(inst, a, i, 7, true)); break;
      case "snow": cubes.push(...snowDeco(inst, a, i, 1)); break;
      case "lightning": cubes.push(...lightningDeco(inst, a, i, 1, true)); break;
      case "vines": cubes.push(...vineDeco(inst, a, i, 2)); break;
      case "leaves": cubes.push(...leafDeco(inst, a, i, i % 2 ? 2 : 3)); break;
      case "branches": cubes.push(...branchDeco(inst, a, i, 5)); break;
      // New decorations map to proven primitives with appropriate colors and motion
      case "plates": cubes.push(...studDeco(inst, a, i, 3)); break;
      case "pipes": cubes.push(...chainDeco(inst, a, i, 6)); break;
      case "wires": cubes.push(...ribbonDeco(inst, a, i, 6)); break;
      case "dials": cubes.push(...studDeco(inst, a, i, 4)); break;
      case "gears": cubes.push(...ringDeco(inst, a, i, 4)); break;
      case "horns": cubes.push(...branchDeco(inst, a, i, 6)); break;
      case "thorns": cubes.push(...branchDeco(inst, a, i, 2)); break;
      case "veins": cubes.push(...runeDeco(inst, a, i, 2, false)); break;
      case "crowns": cubes.push(...ringDeco(inst, a, i, 4)); break;
      case "splatters": cubes.push(...gemDeco(inst, a, i, 2, false)); break;
      case "goo": cubes.push(...smokeDeco(inst, a, i, 2)); break;
      case "bubbles": cubes.push(...orbDeco(inst, a, i, 1, true)); break;
      case "spark": cubes.push(...starDeco(inst, a, i, 7, true)); break;
      case "embers": cubes.push(...starDeco(inst, a, i, 4, true)); break;
      case "fireflies": cubes.push(...starDeco(inst, a, i, 7, true)); break;
      case "dust": cubes.push(...snowDeco(inst, a, i, 6)); break;
      case "wisp": cubes.push(...smokeDeco(inst, a, i, 7)); break;
      case "aura": cubes.push(...orbDeco(inst, a, i, 7, true)); break;
      case "glow_ring": cubes.push(...ringDeco(inst, a, i, 7)); break;
      case "ripple": cubes.push(...ringDeco(inst, a, i, 1)); break;
      case "shield": cubes.push(...studDeco(inst, a, i, 4)); break;
      case "wings": cubes.push(...ribbonDeco(inst, a, i, 1)); break;
      case "tail": cubes.push(...chainDeco(inst, a, i, 5)); break;
      case "fangs": cubes.push(...branchDeco(inst, a, i, 7)); break;
      case "claws": cubes.push(...branchDeco(inst, a, i, 2)); break;
      case "scales": cubes.push(...studDeco(inst, a, i, 3)); break;
      case "feathers": cubes.push(...ribbonDeco(inst, a, i, 1)); break;
      case "bone": cubes.push(...branchDeco(inst, a, i, 7)); break;
      case "skull": cubes.push(...gemDeco(inst, a, i, 7, false)); break;
      case "heart": cubes.push(...orbDeco(inst, a, i, 2, true)); break;
      case "eye": cubes.push(...orbDeco(inst, a, i, 7, true)); break;
      case "mouth": cubes.push(...studDeco(inst, a, i, 2)); break;
      case "blood_vessel": cubes.push(...ribbonDeco(inst, a, i, 2)); break;
      case "venom": cubes.push(...trailDeco(inst, a, i, 2, true)); break;
      case "acid": cubes.push(...trailDeco(inst, a, i, 2, true)); break;
      case "curse": cubes.push(...runeDeco(inst, a, i, 6, true)); break;
      case "sigil": cubes.push(...runeDeco(inst, a, i, 7, true)); break;
      case "seal": cubes.push(...ringDeco(inst, a, i, 7)); break;
      case "ward": cubes.push(...ringDeco(inst, a, i, 4)); break;
      case "barrier": cubes.push(...studDeco(inst, a, i, 7)); break;
    }
  }
  return cubes;
}

/**
 * Builds decoration cubes from every instance. Every cube is tagged `group: "decor"` and carries its
 * own native motion, so the same geometry can be animated in the preview and in Blockbench.
 */
export function buildDecor(body: VoxelCube[], instances: DecorInstance[], detail: DetailLevel, accent: AccentId = "auto"): VoxelCube[] {
  if (!instances.length || !body.length) return [];
  const bounds = boundsOf(body), centerX = (bounds.minX + bounds.maxX) / 2;
  const out: VoxelCube[] = [];
  instances.forEach((input, index) => {
    const inst = normalizeInstance(input, index);
    if (!inst.visible) return;
    const a = slotAnchor(inst.slot, bounds, body), pivot: Vec3 = [a.cx, a.cy, a.cz];
    const [ox, oy, oz] = inst.offset!;
    const size = inst.size!;
    const transform = (point: Vec3): Vec3 => point.map((value, axis) => r3(pivot[axis] + (value - pivot[axis]) * size + [ox, oy, oz][axis])) as Vec3;
    const chosen = resolvedColor(inst.color) ?? resolvedColor(accent);
    const built = buildInstance(inst, bounds, detail, body).map(cube => ({
      ...cube, name: `${cube.name}_${index}`, decorId: inst.id, from: transform(cube.from), to: transform(cube.to),
      ...(chosen ? { tint: shadeColor(chosen, cube.color === 7 ? 1.16 : cube.color === 6 ? .65 : cube.color === 4 ? .82 : 1) } : {}),
      ...(cube.motion ? { motion: { ...cube.motion, pivot: transform(cube.motion.pivot ?? [(cube.from[0] + cube.to[0]) / 2, (cube.from[1] + cube.to[1]) / 2, (cube.from[2] + cube.to[2]) / 2]) } } : {}),
    }));
    if (inst.mirror) {
      const reflect = (point: Vec3): Vec3 => [r3(2 * centerX - point[0]), point[1], point[2]];
      const geometryKey = (cube: VoxelCube) => JSON.stringify([cube.from, cube.to, cube.color, cube.tint, cube.motion]);
      const existing = new Set(built.map(geometryKey));
      const reflected = built.map(cube => ({ ...cube, name: cube.name + "_mirror", from: [r3(2 * centerX - cube.to[0]), cube.from[1], cube.from[2]] as Vec3, to: [r3(2 * centerX - cube.from[0]), cube.to[1], cube.to[2]] as Vec3,
        ...(cube.motion ? { motion: { ...cube.motion, pivot: reflect(cube.motion.pivot!), ...(cube.motion.amp !== undefined ? { amp: -cube.motion.amp } : {}) } } : {}) }));
      for (const cube of reflected) { const key = geometryKey(cube); if (!existing.has(key)) { existing.add(key); built.push(cube); } }
    }
    // Fit the whole instance, never slice off individual cubes or change their positive dimensions.
    if (!built.length) return;
    const b = boundsOf(built), lo = [b.minX,b.minY,b.minZ], hi = [b.maxX,b.maxY,b.maxZ];
    const scale = Math.min(1, ...hi.map((value, axis) => 47 / Math.max(.01, value - lo[axis])));
    const centers = lo.map((value, axis) => (value + hi[axis]) / 2);
    const shift = lo.map((value, axis) => {
      const min = centers[axis] + (value - centers[axis]) * scale, max = centers[axis] + (hi[axis] - centers[axis]) * scale;
      return min < -15.7 ? -15.7 - min : max > 31.7 ? 31.7 - max : 0;
    });
    const fit = (point: Vec3): Vec3 => point.map((value, axis) => r3(centers[axis] + (value - centers[axis]) * scale + shift[axis])) as Vec3;
    built.forEach(cube => { cube.from = fit(cube.from); cube.to = fit(cube.to); if (cube.motion?.pivot) cube.motion.pivot = fit(cube.motion.pivot); });
    out.push(...built);
  });
  return out;
}

// ---- Server-side guard for the optional `extras` block ------------------------------------------

// Effects
export interface EffectOption { id: EffectId; label: string; hint?: string; particle: string; offset: string; delta: string; speed: number; count: number; color: [number, number, number]; }
export const EFFECT_OPTIONS: EffectOption[] = [
  { id: "none", label: "なし", particle: "", offset: "", delta: "", speed: 0, count: 0, color: [1, 1, 1] },
  { id: "sparkle", label: "きらめき", hint: "白い光の粒", particle: "minecraft:end_rod", offset: "^0.2 ^1.0 ^0.7", delta: "0.3 0.4 0.3", speed: .01, count: 2, color: [1, .95, .7] },
  { id: "flame", label: "炎", hint: "火の粉", particle: "minecraft:flame", offset: "^0.3 ^0.9 ^0.6", delta: "0.12 0.2 0.12", speed: .01, count: 2, color: [1, .55, .15] },
  { id: "soulfire", label: "魂の炎", hint: "青い炎", particle: "minecraft:soul_fire_flame", offset: "^0.3 ^0.9 ^0.6", delta: "0.12 0.2 0.12", speed: .01, count: 2, color: [.3, .8, 1] },
  { id: "snow", label: "雪", hint: "雪の結晶", particle: "minecraft:snowflake", offset: "^0 ^1.4 ^0.5", delta: "0.5 0.4 0.5", speed: .02, count: 3, color: [.9, .97, 1] },
  { id: "magic", label: "魔力", hint: "紫の魔力", particle: "minecraft:enchant", offset: "^0 ^1.2 ^0.6", delta: "0.5 0.5 0.5", speed: .5, count: 4, color: [.75, .45, 1] },
  { id: "electric", label: "電気", hint: "青白い火花", particle: "minecraft:electric_spark", offset: "^0.2 ^1.0 ^0.6", delta: "0.3 0.4 0.3", speed: .2, count: 2, color: [.5, .9, 1] },
  { id: "hearts", label: "ハート", hint: "ハートが浮かぶ", particle: "minecraft:heart", offset: "^0 ^1.6 ^0.4", delta: "0.3 0.2 0.3", speed: .01, count: 1, color: [1, .4, .6] },
  { id: "poison", label: "毒", hint: "緑の毒の霧", particle: "minecraft:item_slime", offset: "^0.3 ^0.8 ^0.5", delta: "0.3 0.3 0.3", speed: .02, count: 3, color: [.4, .9, .2] },
  { id: "void", label: "虚空", hint: "闇の渦", particle: "minecraft:portal", offset: "^0 ^1.0 ^0.5", delta: "0.4 0.5 0.4", speed: .05, count: 4, color: [.3, .1, .5] },
  { id: "blood", label: "血", hint: "血の滴り", particle: "minecraft:item_snowball", offset: "^0.2 ^1.2 ^0.5", delta: "0.15 0.3 0.15", speed: .03, count: 2, color: [.8, .1, .15] },
  { id: "gold", label: "金", hint: "金色の輝き", particle: "minecraft:end_rod", offset: "^0 ^1.2 ^0.5", delta: "0.2 0.3 0.2", speed: .01, count: 2, color: [1, .85, .3] },
  { id: "wind", label: "風", hint: "白い風の流れ", particle: "minecraft:cloud", offset: "^0.3 ^1.0 ^0.5", delta: "0.5 0.2 0.5", speed: .02, count: 3, color: [.85, .9, .95] },
  { id: "frost", label: "霜", hint: "氷の結晶", particle: "minecraft:snowflake", offset: "^0 ^1.4 ^0.5", delta: "0.4 0.4 0.4", speed: .01, count: 3, color: [.75, .9, 1] },
];
export const effectOf = (id: EffectId) => EFFECT_OPTIONS.find(o => o.id === id) ?? EFFECT_OPTIONS[0];

export function sanitizeExtras(input: unknown): Extras | null | undefined {
  if (input === undefined) return undefined;
  if (!input || typeof input !== "object") return null;
  const v = input as Record<string, unknown>;
  if (!Array.isArray(v.decor) || v.decor.length > 30) return null;
  const ids = v.decor.flatMap(value => value && typeof value === "object" && typeof value.id === "string" ? [value.id] : []);
  if (new Set(ids).size !== ids.length) return null;
  for (const d of v.decor) {
    if (!d || typeof d !== "object") return null;
    const di = d as Record<string, unknown>;
    if (!(DECOR_IDS as readonly unknown[]).includes(di.kind)) return null;
    if (!['guard','pommel','grip','blade_top','blade_sides','head','body','sides','everywhere'].includes(di.slot as string)) return null;
    if (!["few","normal","many"].includes(di.intensity as string)) return null;
    if (di.color !== null && !(ACCENT_IDS as readonly unknown[]).includes(di.color) && !isHex(di.color)) return null;
    if (di.id !== undefined && (typeof di.id !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(di.id))) return null;
    const finite = (v: unknown, min: number, max: number) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
    if (di.count !== undefined && (!finite(di.count, 1, 12) || !Number.isInteger(di.count))) return null;
    if (di.size !== undefined && !finite(di.size, .25, 2)) return null;
    if (di.spacing !== undefined && !finite(di.spacing, .5, 3)) return null;
    if (di.offset !== undefined && (!Array.isArray(di.offset) || di.offset.length !== 3 || !di.offset.every(v => finite(v, -8, 8)))) return null;
    if (di.visible !== undefined && typeof di.visible !== "boolean") return null;
    if (di.mirror !== undefined && typeof di.mirror !== "boolean") return null;
  }
  if (!(ACCENT_IDS as readonly unknown[]).includes(v.accent) || !(EFFECT_IDS as readonly unknown[]).includes(v.effect)) return null;
  const a = v.animation as Record<string, unknown> | undefined;
  if (!a || typeof a !== "object") return null;
  if (!(BODY_ANIMS as readonly unknown[]).includes(a.body) || !(DECOR_ANIMS as readonly unknown[]).includes(a.decor) || !(TRANSFORM_ANIMS as readonly unknown[]).includes(a.transform)) return null;
  if (typeof a.speed !== "number" || !Number.isFinite(a.speed) || a.speed < .5 || a.speed > 2 || typeof a.shimmer !== "boolean") return null;
  return {
    decor: (v.decor as DecorInstance[]).map((instance, index) => normalizeInstance(instance, index)), accent: v.accent as AccentId, effect: v.effect as EffectId,
    animation: { body: a.body as Extras["animation"]["body"], decor: a.decor as Extras["animation"]["decor"], transform: a.transform as Extras["animation"]["transform"], speed: a.speed, shimmer: a.shimmer },
  };
}