import {
  MAT as DRAW_MAT,
  arc,
  ellipse,
  get,
  line,
  makeGrid,
  poly,
  rect,
  set,
  thickLine,
  validateGrid,
  type Grid,
} from "@/lib/draw";

const MAT = {
  ...DRAW_MAT,
  core: DRAW_MAT.bladeCore,
  iron: DRAW_MAT.metalDark,
  gold: DRAW_MAT.metalBright,
} as const;

/**
 * True 64×64 template renderer.
 *
 * Important: this module never reads the 16× templates and never multiplies
 * 16-space coordinates. Every silhouette is authored directly in a 64px
 * design space. Curves, one-pixel engravings, separate bevel materials and
 * small negative spaces therefore exist even before the shading pass.
 */

export const NATIVE64_TEMPLATE_IDS = [
  "sword_long",
  "sword_broad",
  "sword_great",
  "sword_katana",
  "sword_dagger",
  "sword_rapier",
  "sword_scythe",
  "sword_wither",
  "sword_chainsaw",
  "sword_piston",
  "bow_long",
  "bow_short",
  "bow_heavy",
  "bow_crossbow",
  "bow_railgun",
  "staff_wand",
  "staff_sceptre",
  "staff_orb",
  "staff_scythe",
  "staff_gyro",
  "tool_pickaxe",
  "tool_axe",
  "tool_drill",
  "tool_hoe",
  "tool_rod",
  "tool_hook",
  "tool_gauntlet",
  "tool_pilebunker",
  "tool_wrench",
  "armor_helm_full",
  "armor_helm_horn",
  "armor_helm_hood",
  "armor_helm_crown",
  "armor_chest_plate",
  "armor_chest_robe",
  "armor_chest_light",
  "armor_legs",
  "armor_boots",
  "acc_talisman",
  "acc_ring",
  "acc_artifact",
  "acc_orb",
  "acc_book",
  "acc_potion",
  "acc_crystal",
  "acc_scroll",
  "pet_dragon",
  "pet_quadruped",
  "pet_bird",
  "pet_bee",
  "pet_whale",
  "minion_base",
] as const;

export type Native64TemplateId = (typeof NATIVE64_TEMPLATE_IDS)[number];
const NATIVE_SET = new Set<string>(NATIVE64_TEMPLATE_IDS);

type Point = [number, number];
type Builder = (g: Grid) => void;

function bezierPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [
    p0[0] * a + p1[0] * b + p2[0] * c + p3[0] * d,
    p0[1] * a + p1[1] * b + p2[1] * c + p3[1] * d,
  ];
}

function bezier(g: Grid, p0: Point, p1: Point, p2: Point, p3: Point, width: number, ch: string): void {
  let prev = p0;
  const steps = 96;
  for (let i = 1; i <= steps; i++) {
    const p = bezierPoint(p0, p1, p2, p3, i / steps);
    thickLine(g, prev[0], prev[1], p[0], p[1], width, ch);
    prev = p;
  }
}

/** Paint a curve only where a body material already exists. */
function clippedBezier(
  g: Grid,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  width: number,
  ch: string,
): void {
  const mask = g.map((r) => r.map((v) => v !== MAT.empty));
  const overlay = makeGrid(64);
  bezier(overlay, p0, p1, p2, p3, width, ch);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) if (mask[y]![x] && overlay[y]![x] !== MAT.empty) g[y]![x] = ch;
}

function clippedLine(g: Grid, a: Point, b: Point, width: number, ch: string): void {
  const mask = g.map((r) => r.map((v) => v !== MAT.empty));
  const overlay = makeGrid(64);
  thickLine(overlay, a[0], a[1], b[0], b[1], width, ch);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) if (mask[y]![x] && overlay[y]![x] !== MAT.empty) g[y]![x] = ch;
}

function cutEllipse(g: Grid, cx: number, cy: number, rx: number, ry: number): void {
  ellipse(g, cx, cy, rx, ry, MAT.empty);
}

function gem(g: Grid, cx: number, cy: number, r = 3): void {
  ellipse(g, cx, cy, r + 1.2, r + 1.2, MAT.gold);
  ellipse(g, cx, cy, r, r, MAT.gem);
  set(g, Math.round(cx - r * 0.35), Math.round(cy - r * 0.45), MAT.energy);
  set(g, Math.round(cx + r * 0.45), Math.round(cy + r * 0.35), MAT.core);
}

function wrap(g: Grid, a: Point, b: Point, width: number): void {
  thickLine(g, a[0], a[1], b[0], b[1], width, MAT.leather);
  const steps = 7;
  for (let i = 1; i < steps; i += 2) {
    const t = i / steps;
    const x = a[0] + (b[0] - a[0]) * t;
    const y = a[1] + (b[1] - a[1]) * t;
    set(g, Math.round(x), Math.round(y), MAT.gold);
  }
}

function runeTicks(g: Grid, a: Point, b: Point, count: number): void {
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const x = Math.round(a[0] + (b[0] - a[0]) * t);
    const y = Math.round(a[1] + (b[1] - a[1]) * t);
    if (get(g, x, y) !== MAT.empty) set(g, x, y, i % 3 === 0 ? MAT.energy : MAT.rune);
  }
}

function swordStandard(
  g: Grid,
  opt: { broad?: boolean; great?: boolean; dagger?: boolean; wither?: boolean },
): void {
  const dagger = !!opt.dagger;
  const great = !!opt.great;
  const broad = !!opt.broad || great;
  const tip: Point = dagger ? [55, 8] : [59, 3];
  const base: Point = dagger ? [31, 34] : [28, 37];
  const half = great ? 8.5 : broad ? 6.2 : 4.4;
  const px = 0.7;
  const py = 0.7;
  const l: Point = [base[0] - px * half, base[1] - py * half];
  const r: Point = [base[0] + px * half, base[1] + py * half];
  const tl: Point = [tip[0] - 2.2, tip[1] + 0.7];
  const tr: Point = [tip[0] - 0.7, tip[1] + 2.2];

  poly(g, [tip, tr, r, l, tl], MAT.blade);
  poly(
    g,
    [
      [tip[0] - 2, tip[1] + 2],
      [tip[0] - 3.3, tip[1] + 3.8],
      [base[0] + half * 0.43, base[1] + half * 0.43],
      [base[0] - half * 0.46, base[1] - half * 0.46],
    ],
    opt.wither ? MAT.energy : MAT.core,
  );
  // Native 1px edge and fuller do not exist in the 16× recipe.
  clippedLine(g, [tip[0] - 1, tip[1] + 2], [r[0] - 1, r[1] - 1], 1, MAT.gold);
  clippedLine(g, [tip[0] - 4, tip[1] + 4], [base[0], base[1]], great ? 2 : 1, opt.wither ? MAT.rune : MAT.iron);
  runeTicks(g, [tip[0] - 5, tip[1] + 5], [base[0], base[1]], dagger ? 3 : 7);

  const guardA: Point = dagger ? [22, 29] : great ? [15, 28] : [17, 31];
  const guardB: Point = dagger ? [37, 44] : great ? [39, 52] : [36, 50];
  thickLine(g, guardA[0], guardA[1], guardB[0], guardB[1], great ? 4 : 3, MAT.gold);
  thickLine(g, guardA[0] + 2, guardA[1], guardA[0] - 1, guardA[1] + 3, 3, MAT.iron);
  thickLine(g, guardB[0], guardB[1] - 2, guardB[0] + 3, guardB[1] + 1, 3, MAT.iron);

  const gripA: Point = dagger ? [24, 40] : [23, 43];
  const gripB: Point = dagger ? [12, 52] : [8, 58];
  wrap(g, gripA, gripB, great ? 7 : 5);
  ellipse(g, gripB[0] - 2, gripB[1] + 2, great ? 4.5 : 3.5, great ? 4.5 : 3.5, MAT.gold);
  gem(g, guardA[0] + (guardB[0] - guardA[0]) * 0.5, guardA[1] + (guardB[1] - guardA[1]) * 0.5, great ? 3 : 2.3);

  if (opt.wither) {
    ellipse(g, 19, 32, 5.5, 5.5, MAT.bone);
    cutEllipse(g, 17.5, 31, 1.2, 1.2);
    cutEllipse(g, 21.2, 33.2, 1.1, 1.1);
    gem(g, 19.5, 32.5, 2.1);
    clippedBezier(g, [29, 36], [37, 28], [45, 21], [54, 9], 1, MAT.rune);
  }
}

function swordKatana(g: Grid): void {
  bezier(g, [14, 55], [28, 42], [44, 22], [58, 3], 7, MAT.core);
  bezier(g, [15, 53], [29, 40], [45, 20], [59, 3], 2, MAT.blade);
  bezier(g, [18, 52], [31, 40], [44, 24], [56, 8], 1, MAT.gold);
  ellipse(g, 17, 51, 6, 4.5, MAT.gold, false);
  wrap(g, [14, 54], [5, 62], 5);
  runeTicks(g, [25, 43], [52, 10], 7);
}

function swordRapier(g: Grid): void {
  thickLine(g, 26, 39, 59, 4, 4, MAT.blade);
  thickLine(g, 28, 37, 57, 7, 1, MAT.gold);
  arc(g, 23, 42, 10, Math.PI * 0.5, Math.PI * 1.48, MAT.gold, 3);
  arc(g, 23, 42, 7, Math.PI * 0.54, Math.PI * 1.42, MAT.iron, 1);
  wrap(g, [19, 45], [7, 58], 4);
  ellipse(g, 5, 60, 3.5, 3.5, MAT.gold);
  gem(g, 22, 42, 2.2);
}

function swordScythe(g: Grid, magical = false): void {
  bezier(g, [9, 16], [27, 1], [51, 3], [59, 18], 8, MAT.core);
  bezier(g, [8, 13], [28, -1], [53, 3], [61, 16], 2, MAT.blade);
  bezier(g, [12, 18], [30, 7], [48, 8], [56, 19], 1, magical ? MAT.energy : MAT.gold);
  thickLine(g, 47, 17, 11, 59, 6, magical ? MAT.iron : MAT.wood);
  wrap(g, [22, 46], [11, 59], 6);
  gem(g, 46, 18, 3);
  if (magical) runeTicks(g, [42, 23], [17, 52], 8);
}

function swordChainsaw(g: Grid): void {
  // Industrial motorized rotating saw blade
  poly(g, [[16, 42], [22, 48], [54, 16], [48, 10]], MAT.iron);
  poly(g, [[18, 40], [24, 46], [52, 18], [46, 12]], MAT.core);
  // Saw teeth alternating around the guide bar
  for (let t = 0; t <= 36; t += 4) {
    const p1: Point = [18 + t * 0.9, 44 - t * 0.9];
    set(g, Math.round(p1[0] - 2), Math.round(p1[1] + 2), MAT.blade);
    set(g, Math.round(p1[0] - 1), Math.round(p1[1] + 3), MAT.blade);
    const p2: Point = [15 + t * 0.9, 41 - t * 0.9];
    set(g, Math.round(p2[0] + 2), Math.round(p2[1] - 2), MAT.blade);
    set(g, Math.round(p2[0] + 3), Math.round(p2[1] - 1), MAT.blade);
  }
  rect(g, 10, 44, 14, 12, MAT.gold);
  rect(g, 12, 46, 10, 8, MAT.iron);
  ellipse(g, 17, 50, 3, 3, MAT.energy);
  thickLine(g, 12, 54, 5, 61, 5, MAT.leather);
  set(g, 4, 62, MAT.gold);
}

function swordPiston(g: Grid): void {
  // Heavy hydraulic pile-driving sword
  poly(g, [[20, 36], [24, 40], [58, 6], [54, 2]], MAT.blade);
  poly(g, [[22, 34], [26, 38], [56, 8], [52, 4]], MAT.core);
  // Hydraulic pistons along the spine
  rect(g, 22, 30, 8, 8, MAT.gold);
  rect(g, 24, 32, 4, 4, MAT.energy);
  thickLine(g, 26, 34, 38, 22, 3, MAT.iron);
  rect(g, 34, 18, 6, 6, MAT.gold);
  set(g, 37, 21, MAT.energy);
  thickLine(g, 18, 42, 6, 54, 6, MAT.iron);
  wrap(g, [16, 44], [6, 54], 5);
  ellipse(g, 4, 56, 4, 4, MAT.gold);
}

function buildSword(id: string, g: Grid): void {
  if (id === "sword_katana") return swordKatana(g);
  if (id === "sword_rapier") return swordRapier(g);
  if (id === "sword_scythe") return swordScythe(g);
  if (id === "sword_chainsaw") return swordChainsaw(g);
  if (id === "sword_piston") return swordPiston(g);
  swordStandard(g, {
    broad: id === "sword_broad",
    great: id === "sword_great",
    dagger: id === "sword_dagger",
    wither: id === "sword_wither",
  });
}

function buildBow(id: string, g: Grid): void {
  if (id === "bow_railgun") {
    // Linear magnetic railgun with glowing capacitor coils
    thickLine(g, 8, 32, 54, 32, 6, MAT.iron);
    thickLine(g, 10, 24, 56, 24, 3, MAT.gold);
    thickLine(g, 10, 40, 56, 40, 3, MAT.gold);
    // Acceleration rings
    for (let x = 16; x <= 48; x += 8) {
      rect(g, x, 22, 3, 20, MAT.energy);
    }
    poly(g, [[52, 26], [61, 32], [52, 38]], MAT.blade);
    wrap(g, [6, 32], [14, 48], 6);
    gem(g, 20, 32, 3);
    return;
  }
  if (id === "bow_crossbow") {
    thickLine(g, 8, 32, 48, 32, 8, MAT.wood);
    poly(g, [[42, 22], [61, 31], [42, 42], [46, 33]], MAT.blade);
    thickLine(g, 23, 28, 15, 55, 7, MAT.leather);
    bezier(g, [20, 7], [46, 10], [55, 20], [48, 31], 4, MAT.gold);
    bezier(g, [48, 33], [55, 44], [45, 54], [20, 57], 4, MAT.gold);
    line(g, 20, 7, 48, 32, MAT.string);
    line(g, 48, 32, 20, 57, MAT.string);
    gem(g, 28, 32, 3);
    runeTicks(g, [33, 32], [48, 32], 4);
    return;
  }
  const heavy = id === "bow_heavy";
  const short = id === "bow_short";
  const top: Point = short ? [21, 15] : [18, 6];
  const bottom: Point = short ? [21, 49] : [18, 58];
  const outside = heavy ? 58 : short ? 49 : 55;
  const width = heavy ? 7 : 5;
  const material = heavy ? MAT.iron : MAT.wood;
  bezier(g, top, [outside, 8], [outside, 24], [35, 32], width, material);
  bezier(g, [35, 32], [outside, 40], [outside, 56], bottom, width, material);
  bezier(g, [top[0] + 2, top[1] + 2], [outside - 3, 12], [outside - 3, 23], [37, 31], 1, MAT.gold);
  bezier(g, [37, 33], [outside - 3, 41], [outside - 3, 52], [bottom[0] + 2, bottom[1] - 2], 1, MAT.gold);
  line(g, top[0], top[1], bottom[0], bottom[1], MAT.string);
  thickLine(g, 32, 28, 32, 36, heavy ? 8 : 6, MAT.leather);
  gem(g, 35, 32, heavy ? 3.5 : 2.7);
  if (heavy) {
    rect(g, 15, 4, 8, 5, MAT.gold);
    rect(g, 15, 55, 8, 5, MAT.gold);
    runeTicks(g, [43, 19], [43, 45], 5);
  }
}

function buildStaff(id: string, g: Grid): void {
  if (id === "staff_scythe") return swordScythe(g, true);
  if (id === "staff_gyro") {
    // Gyrokinetic rotating clockwork wand
    thickLine(g, 10, 59, 42, 22, 5, MAT.wood);
    wrap(g, [11, 58], [20, 48], 6);
    // Outer and inner brass rings
    ellipse(g, 46, 18, 13, 13, MAT.gold, false);
    ellipse(g, 46, 18, 9, 9, MAT.iron, false);
    ellipse(g, 46, 18, 5, 5, MAT.energy);
    // Compass gimbal axes
    line(g, 46, 4, 46, 32, MAT.gold);
    line(g, 32, 18, 60, 18, MAT.gold);
    gem(g, 46, 18, 3);
    return;
  }
  const orb = id === "staff_orb";
  const sceptre = id === "staff_sceptre";
  const head: Point = orb ? [45, 16] : sceptre ? [47, 15] : [51, 10];
  thickLine(g, 10, 59, head[0] - 5, head[1] + 7, sceptre ? 6 : 5, MAT.wood);
  wrap(g, [11, 58], [22, 47], 6);
  clippedBezier(g, [20, 48], [28, 37], [34, 28], [42, 20], 1, MAT.rune);
  if (orb) {
    ellipse(g, head[0], head[1], 11, 11, MAT.energy);
    ellipse(g, head[0], head[1], 8, 8, MAT.gem);
    arc(g, head[0], head[1], 13, 0, Math.PI * 2, MAT.gold, 2);
    line(g, 35, 12, 55, 20, MAT.gold);
    line(g, 37, 23, 53, 8, MAT.gold);
  } else if (sceptre) {
    arc(g, head[0], head[1], 11, 0, Math.PI * 2, MAT.gold, 3);
    gem(g, head[0], head[1], 6);
    for (const a of [-1.15, -0.5, 0.15]) {
      const x = head[0] + Math.cos(a) * 15;
      const y = head[1] + Math.sin(a) * 15;
      thickLine(g, head[0], head[1], x, y, 2, MAT.gold);
    }
  } else {
    gem(g, head[0], head[1], 5);
    bezier(g, [43, 15], [46, 3], [58, 2], [60, 12], 3, MAT.gold);
    bezier(g, [46, 17], [55, 18], [59, 25], [54, 30], 2, MAT.gold);
  }
}

function buildTool(id: string, g: Grid): void {
  if (id === "tool_wrench") {
    // Massive mechanical artificer wrench
    thickLine(g, 12, 58, 44, 26, 7, MAT.iron);
    wrap(g, [12, 58], [24, 46], 8);
    poly(g, [[38, 12], [58, 12], [62, 32], [46, 36], [32, 22]], MAT.gold);
    rect(g, 46, 18, 14, 12, ".");
    gem(g, 36, 26, 3.5);
    return;
  }
  if (id === "tool_pilebunker") {
    // Steam-powered hydraulic pile-driving arm
    poly(g, [[12, 24], [23, 14], [52, 20], [58, 44], [46, 56], [16, 56], [8, 42]], MAT.iron);
    poly(g, [[17, 28], [26, 20], [48, 24], [52, 42], [42, 50], [20, 50], [14, 40]], MAT.core);
    // Heavy hardened spike driven out
    poly(g, [[32, 6], [40, 2], [44, 18], [28, 18]], MAT.blade);
    // Pressure pistons & gears
    rect(g, 26, 26, 16, 12, MAT.gold);
    ellipse(g, 34, 32, 5, 5, MAT.energy);
    wrap(g, [16, 54], [44, 54], 8);
    return;
  }
  if (id === "tool_gauntlet") {
    poly(g, [[12, 24], [23, 14], [49, 20], [56, 35], [49, 52], [22, 55], [8, 42]], MAT.iron);
    poly(g, [[17, 28], [26, 20], [45, 24], [50, 35], [44, 47], [24, 49], [14, 40]], MAT.core);
    for (let i = 0; i < 4; i++) {
      rect(g, 21 + i * 7, 15 + (i % 2), 5, 13, MAT.gold);
      gem(g, 23 + i * 7, 23, 2.1);
    }
    gem(g, 34, 37, 6);
    runeTicks(g, [19, 43], [48, 39], 7);
    return;
  }
  if (id === "tool_drill") {
    poly(g, [[7, 39], [19, 24], [44, 19], [56, 28], [55, 39], [39, 46], [18, 48]], MAT.iron);
    poly(g, [[41, 19], [61, 24], [61, 34], [42, 39], [50, 30]], MAT.blade);
    thickLine(g, 22, 44, 16, 59, 8, MAT.leather);
    rect(g, 13, 56, 12, 6, MAT.gold);
    gem(g, 32, 33, 6);
    for (let x = 45; x < 59; x += 4) line(g, x, 23, x - 2, 36, MAT.gold);
    clippedLine(g, [12, 39], [49, 30], 1, MAT.rune);
    return;
  }
  if (id === "tool_rod") {
    bezier(g, [8, 59], [21, 43], [36, 21], [50, 6], 5, MAT.wood);
    clippedBezier(g, [11, 57], [24, 40], [37, 20], [49, 8], 1, MAT.gold);
    line(g, 50, 6, 57, 46, MAT.string);
    gem(g, 57, 48, 3);
    wrap(g, [8, 59], [18, 47], 6);
    return;
  }
  if (id === "tool_hook") {
    thickLine(g, 8, 58, 39, 27, 5, MAT.wood);
    wrap(g, [8, 58], [18, 48], 6);
    bezier(g, [38, 29], [61, 22], [61, 49], [43, 50], 6, MAT.iron);
    bezier(g, [41, 31], [55, 28], [55, 43], [44, 46], 2, MAT.blade);
    gem(g, 39, 29, 3);
    return;
  }

  // Pickaxe / axe / hoe share a native shaft, but each has its own head.
  thickLine(g, 13, 58, 39, 28, 6, MAT.wood);
  wrap(g, [13, 58], [25, 44], 7);
  gem(g, 38, 29, 2.5);
  if (id === "tool_pickaxe") {
    bezier(g, [16, 24], [29, 8], [48, 4], [61, 16], 7, MAT.iron);
    bezier(g, [17, 21], [31, 7], [50, 7], [60, 18], 2, MAT.blade);
    runeTicks(g, [23, 18], [55, 14], 6);
  } else if (id === "tool_axe") {
    poly(g, [[28, 12], [48, 5], [59, 13], [55, 33], [39, 35], [32, 28]], MAT.blade);
    poly(g, [[34, 15], [47, 10], [53, 15], [50, 27], [39, 30], [34, 25]], MAT.core);
    clippedBezier(g, [35, 18], [43, 15], [49, 17], [51, 25], 1, MAT.gold);
  } else {
    poly(g, [[24, 17], [58, 7], [60, 15], [32, 29]], MAT.blade);
    poly(g, [[30, 19], [55, 12], [48, 20], [35, 26]], MAT.core);
  }
}

function helmBase(g: Grid, hood = false): void {
  if (hood) {
    poly(g, [[13, 50], [9, 27], [18, 10], [33, 4], [49, 12], [57, 29], [52, 53], [43, 59], [20, 58]], MAT.cloth);
    poly(g, [[18, 48], [16, 28], [23, 17], [35, 13], [47, 21], [51, 35], [46, 49]], MAT.core);
  } else {
    poly(g, [[10, 48], [11, 23], [21, 9], [33, 4], [47, 10], [55, 25], [54, 49], [44, 58], [20, 57]], MAT.iron);
    poly(g, [[16, 44], [17, 25], [25, 14], [34, 10], [44, 16], [49, 28], [48, 45], [40, 52], [23, 51]], MAT.core);
  }
}

function buildHelm(id: string, g: Grid): void {
  if (id === "armor_helm_crown") {
    poly(g, [[9, 47], [13, 19], [22, 31], [31, 8], [40, 30], [52, 17], [56, 48]], MAT.gold);
    poly(g, [[14, 42], [18, 28], [24, 37], [31, 19], [39, 37], [49, 27], [52, 43]], MAT.iron);
    rect(g, 11, 43, 44, 9, MAT.gold);
    gem(g, 32, 43, 4);
    gem(g, 17, 42, 2.2);
    gem(g, 48, 42, 2.2);
    return;
  }
  const hood = id === "armor_helm_hood";
  helmBase(g, hood);
  if (id === "armor_helm_horn") {
    poly(g, [[18, 15], [4, 2], [9, 25]], MAT.bone);
    poly(g, [[45, 14], [59, 1], [54, 25]], MAT.bone);
    clippedLine(g, [8, 5], [16, 17], 1, MAT.gold);
    clippedLine(g, [56, 5], [48, 17], 1, MAT.gold);
  }
  if (!hood) {
    poly(g, [[13, 33], [51, 30], [50, 38], [14, 41]], MAT.gold);
    rect(g, 21, 33, 25, 5, MAT.empty);
    for (let x = 22; x <= 45; x += 5) set(g, x, 36, MAT.rune);
    clippedBezier(g, [18, 24], [28, 17], [40, 17], [48, 25], 1, MAT.gold);
  } else {
    gem(g, 33, 18, 3);
    clippedBezier(g, [16, 31], [28, 22], [42, 23], [50, 36], 1, MAT.rune);
  }
}

function chestPlate(g: Grid, light = false): void {
  poly(g, [[6, 23], [17, 8], [26, 15], [38, 15], [48, 8], [59, 23], [53, 34], [50, 59], [14, 59], [11, 34]], light ? MAT.leather : MAT.iron);
  poly(g, [[15, 25], [23, 16], [41, 16], [50, 25], [45, 53], [19, 53]], light ? MAT.cloth : MAT.core);
  poly(g, [[26, 16], [38, 16], [44, 28], [38, 45], [26, 45], [20, 28]], MAT.gold);
  poly(g, [[29, 20], [35, 20], [39, 29], [35, 39], [29, 39], [25, 29]], light ? MAT.leather : MAT.core);
  gem(g, 32, 29, 4);
  clippedBezier(g, [15, 33], [24, 43], [40, 43], [50, 33], 1, MAT.rune);
  if (light) {
    // Negative spaces make it visibly light armour at native 64.
    cutEllipse(g, 13, 45, 3, 7);
    cutEllipse(g, 51, 45, 3, 7);
  }
}

function buildArmor(id: string, g: Grid): void {
  if (id.startsWith("armor_helm")) return buildHelm(id, g);
  if (id === "armor_chest_plate") return chestPlate(g);
  if (id === "armor_chest_light") return chestPlate(g, true);
  if (id === "armor_chest_robe") {
    poly(g, [[7, 21], [19, 8], [27, 15], [38, 15], [47, 8], [58, 22], [50, 35], [55, 61], [10, 61], [15, 35]], MAT.cloth);
    poly(g, [[21, 14], [43, 14], [48, 33], [42, 56], [22, 56], [16, 33]], MAT.core);
    poly(g, [[27, 14], [37, 14], [40, 55], [24, 55]], MAT.gold);
    gem(g, 32, 27, 4);
    clippedBezier(g, [17, 38], [28, 31], [39, 32], [49, 40], 1, MAT.rune);
    return;
  }
  if (id === "armor_legs") {
    poly(g, [[14, 8], [50, 8], [53, 28], [45, 59], [31, 59], [31, 32], [27, 59], [12, 59], [10, 28]], MAT.iron);
    poly(g, [[19, 13], [45, 13], [47, 27], [40, 53], [34, 53], [34, 27], [28, 27], [26, 53], [18, 53], [16, 27]], MAT.core);
    rect(g, 12, 9, 39, 6, MAT.gold);
    gem(g, 32, 13, 3);
    clippedLine(g, [18, 22], [24, 51], 1, MAT.rune);
    clippedLine(g, [46, 22], [40, 51], 1, MAT.rune);
    return;
  }
  // Boots
  poly(g, [[11, 14], [27, 11], [31, 23], [27, 47], [8, 55], [3, 47], [10, 38]], MAT.iron);
  poly(g, [[37, 11], [53, 14], [54, 38], [61, 47], [56, 55], [37, 47], [33, 23]], MAT.iron);
  poly(g, [[14, 17], [23, 16], [26, 25], [22, 42], [10, 47], [14, 36]], MAT.core);
  poly(g, [[41, 16], [50, 17], [50, 36], [54, 47], [42, 42], [38, 25]], MAT.core);
  thickLine(g, 8, 51, 27, 45, 4, MAT.gold);
  thickLine(g, 37, 45, 57, 51, 4, MAT.gold);
  gem(g, 21, 22, 2.2);
  gem(g, 43, 22, 2.2);
}

function buildAccessory(id: string, g: Grid): void {
  if (id === "acc_ring") {
    ellipse(g, 32, 35, 20, 20, MAT.gold, false);
    ellipse(g, 32, 35, 15, 15, MAT.iron, false);
    poly(g, [[21, 19], [27, 8], [38, 8], [44, 19], [38, 28], [27, 28]], MAT.gold);
    gem(g, 32, 17, 7);
    return;
  }
  if (id === "acc_orb") {
    ellipse(g, 32, 32, 24, 24, MAT.energy);
    ellipse(g, 32, 32, 19, 19, MAT.gem);
    ellipse(g, 32, 32, 13, 13, MAT.core);
    arc(g, 32, 32, 27, 0, Math.PI * 2, MAT.gold, 3);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const x = 32 + Math.cos(a) * 27;
      const y = 32 + Math.sin(a) * 27;
      gem(g, x, y, 2);
    }
    clippedBezier(g, [15, 37], [24, 15], [42, 49], [50, 27], 1, MAT.rune);
    return;
  }
  if (id === "acc_book") {
    poly(g, [[8, 13], [31, 9], [32, 55], [8, 59]], MAT.leather);
    poly(g, [[32, 9], [57, 13], [57, 59], [32, 55]], MAT.leather);
    poly(g, [[12, 17], [29, 14], [29, 51], [12, 55]], MAT.bone);
    poly(g, [[35, 14], [53, 17], [53, 55], [35, 51]], MAT.bone);
    line(g, 32, 10, 32, 56, MAT.gold);
    clippedBezier(g, [16, 25], [21, 20], [25, 29], [27, 23], 1, MAT.rune);
    clippedBezier(g, [38, 24], [43, 18], [49, 30], [51, 22], 1, MAT.rune);
    gem(g, 32, 33, 3);
    return;
  }
  if (id === "acc_potion") {
    rect(g, 25, 5, 14, 9, MAT.gold);
    rect(g, 22, 12, 20, 8, MAT.bone);
    poly(g, [[21, 18], [43, 18], [51, 31], [48, 55], [40, 61], [24, 61], [16, 55], [13, 31]], MAT.iron);
    poly(g, [[18, 34], [46, 34], [45, 53], [38, 57], [25, 57], [19, 52]], MAT.energy);
    ellipse(g, 32, 42, 10, 9, MAT.gem);
    set(g, 27, 39, MAT.energy);
    set(g, 37, 46, MAT.core);
    return;
  }
  if (id === "acc_crystal") {
    poly(g, [[32, 2], [50, 22], [43, 53], [32, 62], [20, 52], [13, 23]], MAT.gem);
    poly(g, [[32, 5], [36, 31], [32, 59], [22, 49], [18, 24]], MAT.energy);
    poly(g, [[36, 8], [47, 23], [40, 47], [36, 31]], MAT.core);
    line(g, 32, 6, 32, 57, MAT.rune);
    return;
  }
  if (id === "acc_scroll") {
    poly(g, [[12, 8], [52, 8], [57, 15], [52, 55], [13, 55], [7, 48]], MAT.bone);
    ellipse(g, 14, 12, 7, 7, MAT.gold, false);
    ellipse(g, 51, 51, 7, 7, MAT.gold, false);
    for (let y = 19; y <= 45; y += 6) line(g, 18, y, 47 - (y % 12 === 0 ? 5 : 0), y, MAT.rune);
    gem(g, 33, 34, 3);
    return;
  }
  if (id === "acc_artifact") {
    poly(g, [[32, 3], [55, 15], [60, 39], [44, 59], [20, 59], [4, 39], [9, 15]], MAT.gold);
    poly(g, [[32, 10], [49, 19], [53, 37], [40, 52], [24, 52], [11, 37], [15, 19]], MAT.iron);
    poly(g, [[32, 16], [45, 24], [46, 38], [37, 47], [27, 47], [18, 38], [19, 24]], MAT.core);
    gem(g, 32, 32, 7);
    runeTicks(g, [15, 18], [49, 47], 9);
    return;
  }
  // Talisman
  ellipse(g, 32, 32, 22, 22, MAT.gold);
  ellipse(g, 32, 32, 17, 17, MAT.iron);
  poly(g, [[32, 12], [45, 32], [32, 52], [19, 32]], MAT.core);
  gem(g, 32, 32, 6);
  line(g, 32, 3, 32, 10, MAT.string);
  ellipse(g, 32, 4, 4, 4, MAT.gold, false);
}

function buildPet(id: string, g: Grid): void {
  if (id === "pet_bee") {
    ellipse(g, 32, 34, 19, 15, MAT.gold);
    ellipse(g, 32, 34, 14, 12, MAT.fur);
    for (let x = 25; x <= 39; x += 7) rect(g, x, 22, 3, 25, MAT.iron);
    ellipse(g, 16, 28, 10, 8, MAT.energy);
    ellipse(g, 48, 28, 10, 8, MAT.energy);
    ellipse(g, 25, 31, 2.5, 3, MAT.gem);
    ellipse(g, 39, 31, 2.5, 3, MAT.gem);
    line(g, 25, 20, 21, 10, MAT.string);
    line(g, 39, 20, 43, 10, MAT.string);
    return;
  }
  if (id === "pet_whale") {
    bezier(g, [5, 37], [10, 12], [48, 10], [59, 32], 24, MAT.fur);
    bezier(g, [8, 40], [22, 52], [48, 49], [58, 34], 12, MAT.core);
    poly(g, [[8, 37], [0, 25], [2, 46]], MAT.fur);
    ellipse(g, 45, 28, 3, 3, MAT.gem);
    clippedBezier(g, [18, 23], [27, 16], [40, 18], [50, 25], 1, MAT.energy);
    line(g, 32, 48, 28, 57, MAT.fur);
    line(g, 38, 47, 44, 56, MAT.fur);
    return;
  }
  if (id === "pet_bird") {
    ellipse(g, 34, 32, 15, 18, MAT.fur);
    poly(g, [[24, 31], [4, 17], [13, 44], [28, 48]], MAT.fur);
    poly(g, [[43, 30], [59, 18], [54, 42], [40, 48]], MAT.fur);
    poly(g, [[45, 28], [58, 34], [45, 37]], MAT.gold);
    ellipse(g, 38, 27, 2.6, 2.6, MAT.gem);
    clippedBezier(g, [22, 30], [31, 22], [41, 38], [47, 30], 1, MAT.energy);
    line(g, 30, 49, 25, 59, MAT.gold);
    line(g, 39, 49, 44, 59, MAT.gold);
    return;
  }
  if (id === "pet_dragon") {
    ellipse(g, 39, 31, 14, 12, MAT.fur);
    poly(g, [[26, 27], [8, 8], [14, 36]], MAT.fur);
    poly(g, [[45, 23], [57, 5], [58, 28]], MAT.fur);
    poly(g, [[29, 41], [15, 58], [36, 49]], MAT.fur);
    poly(g, [[43, 42], [55, 58], [53, 39]], MAT.fur);
    bezier(g, [31, 37], [18, 43], [11, 34], [5, 25], 5, MAT.fur);
    poly(g, [[48, 30], [61, 34], [49, 39]], MAT.gold);
    ellipse(g, 43, 27, 2.5, 2.5, MAT.gem);
    clippedBezier(g, [27, 28], [35, 20], [45, 21], [51, 30], 1, MAT.energy);
    for (let x = 28; x <= 47; x += 5) set(g, x, 36 + ((x / 5) % 2 | 0), MAT.gold);
    return;
  }
  // Generic quadruped
  ellipse(g, 36, 32, 18, 14, MAT.fur);
  ellipse(g, 48, 23, 11, 10, MAT.fur);
  poly(g, [[42, 18], [42, 6], [49, 15]], MAT.fur);
  poly(g, [[53, 17], [60, 7], [58, 21]], MAT.fur);
  thickLine(g, 24, 41, 21, 57, 7, MAT.fur);
  thickLine(g, 43, 42, 47, 58, 7, MAT.fur);
  bezier(g, [20, 31], [5, 25], [6, 43], [14, 46], 4, MAT.fur);
  ellipse(g, 51, 22, 2.5, 2.5, MAT.gem);
  clippedBezier(g, [24, 29], [33, 22], [44, 25], [51, 34], 1, MAT.energy);
  for (let x = 28; x <= 42; x += 5) set(g, x, 37, MAT.gold);
}

function buildMinion(g: Grid): void {
  poly(g, [[15, 10], [49, 10], [57, 20], [55, 47], [45, 57], [19, 57], [9, 47], [7, 20]], MAT.cloth);
  poly(g, [[17, 17], [47, 17], [50, 42], [42, 50], [22, 50], [14, 42]], MAT.core);
  rect(g, 16, 23, 32, 15, MAT.iron);
  ellipse(g, 24, 30, 4, 4, MAT.gem);
  ellipse(g, 40, 30, 4, 4, MAT.gem);
  set(g, 23, 29, MAT.energy);
  set(g, 39, 29, MAT.energy);
  rect(g, 24, 41, 16, 3, MAT.gold);
  thickLine(g, 12, 37, 4, 48, 5, MAT.wood);
  thickLine(g, 52, 37, 60, 48, 5, MAT.wood);
  thickLine(g, 24, 51, 22, 62, 6, MAT.leather);
  thickLine(g, 40, 51, 42, 62, 6, MAT.leather);
  gem(g, 32, 14, 3);
  clippedBezier(g, [18, 20], [28, 14], [38, 15], [47, 22], 1, MAT.rune);
}

const BUILDERS: Record<string, Builder> = Object.fromEntries(
  NATIVE64_TEMPLATE_IDS.map((id) => [
    id,
    (g: Grid) => {
      if (id.startsWith("sword_")) buildSword(id, g);
      else if (id.startsWith("bow_")) buildBow(id, g);
      else if (id.startsWith("staff_")) buildStaff(id, g);
      else if (id.startsWith("tool_")) buildTool(id, g);
      else if (id.startsWith("armor_")) buildArmor(id, g);
      else if (id.startsWith("acc_")) buildAccessory(id, g);
      else if (id.startsWith("pet_")) buildPet(id, g);
      else buildMinion(g);
    },
  ]),
);

const cache = new Map<string, Grid>();

export function isNative64Template(id: string): id is Native64TemplateId {
  return NATIVE_SET.has(id);
}

export function getNative64Template(id: string): Grid {
  if (!isNative64Template(id)) throw new Error(`No native 64×64 template: ${id}`);
  let grid = cache.get(id);
  if (!grid) {
    grid = makeGrid(64);
    BUILDERS[id]!(grid);
    validateGrid(grid, `native64:${id}`, 64);
    cache.set(id, grid);
  }
  return grid.map((row) => [...row]);
}

/**
 * Proof-oriented diagnostics: native geometry must contain many 4×4 cells
 * with mixed occupancy/materials. A nearest-neighbour 16→64 enlargement has
 * exactly zero such blocks.
 */
export function native64Diagnostics(id: string): {
  filled: number;
  materials: number;
  mixedBlocks: number;
  mixedBlockRatio: number;
  onePixelFeatures: number;
} {
  const g = getNative64Template(id);
  let filled = 0;
  const materials = new Set<string>();
  let mixedBlocks = 0;
  let occupiedBlocks = 0;
  let onePixelFeatures = 0;
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const ch = g[y]![x]!;
      if (ch === MAT.empty) continue;
      filled++;
      materials.add(ch);
      let same = 0;
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dy] of dirs) if (get(g, x + dx, y + dy) === ch) same++;
      if (same <= 1) onePixelFeatures++;
    }
  for (let by = 0; by < 16; by++)
    for (let bx = 0; bx < 16; bx++) {
      const values = new Set<string>();
      let has = false;
      for (let j = 0; j < 4; j++)
        for (let i = 0; i < 4; i++) {
          const ch = g[by * 4 + j]![bx * 4 + i]!;
          values.add(ch);
          if (ch !== MAT.empty) has = true;
        }
      if (!has) continue;
      occupiedBlocks++;
      if (values.size > 1) mixedBlocks++;
    }
  return {
    filled,
    materials: materials.size,
    mixedBlocks,
    mixedBlockRatio: mixedBlocks / Math.max(1, occupiedBlocks),
    onePixelFeatures,
  };
}

export type Native64EssenceInput = {
  signatureIds: string[];
  ornament: number;
  clean: number;
  pseudo3d: number;
  seed: number;
};

/**
 * Structural 64px essence pass. Unlike colour grading, this changes the actual
 * one-pixel material map: gold chasing, runes, gem facets and polished edge
 * marks. Every write is clipped to an existing native shape.
 */
export function applyNative64Essence(grid: Grid, input: Native64EssenceInput): Grid {
  const g = grid.map((row) => [...row]);
  const ids = new Set(input.signatureIds);
  const overhaul = ids.has("overhaul_intricate");
  const nameless = ids.has("nameless_heroic");
  const imperial = ids.has("imperial_ornate");
  const reborn = ids.has("reborn_clean");
  const depth = ids.has("depth_3d");
  const source = grid.map((row) => [...row]);
  const hash = (x: number, y: number, salt: number) => {
    let n = (x * 374761393 + y * 668265263 + input.seed * 1442695041 + salt * 1013904223) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return (n ^ (n >>> 16)) >>> 0;
  };
  const occupied = (x: number, y: number) => get(source, x, y) !== MAT.empty;
  const interior = (x: number, y: number) =>
    occupied(x, y) && occupied(x - 1, y) && occupied(x + 1, y) && occupied(x, y - 1) && occupied(x, y + 1);

  for (let y = 1; y < 63; y++) {
    for (let x = 1; x < 63; x++) {
      const ch = source[y]![x]!;
      if (ch === MAT.empty) continue;
      const h = hash(x, y, 7);

      // Facets are native 1px/2px material cuts, not post-shading noise.
      if (ch === MAT.gem) {
        if ((x + y + (input.seed & 3)) % (overhaul ? 4 : 6) === 0) g[y]![x] = MAT.energy;
        else if ((x - y + 128) % 7 === 0) g[y]![x] = MAT.core;
        continue;
      }

      // Overhaul / ImperiaL: one clean chased gold line following a gentle
      // wave through broad plates — never scattered speckle.
      if ((overhaul || imperial) && interior(x, y) && (ch === MAT.core || ch === MAT.iron)) {
        const wave = Math.round(Math.sin(x / 6 + input.seed * 0.01) * 3);
        const band = (((y - 32 + wave) % 10) + 10) % 10;
        if (band === 0 && interior(x, y - 1) && interior(x, y + 1)) {
          g[y]![x] = overhaul && (x + input.seed) % 9 === 0 ? MAT.rune : MAT.gold;
          continue;
        }
      }

      // Nameless: strong item-specific diagonal heraldic marks.
      if (nameless && interior(x, y) && (ch === MAT.core || ch === MAT.blade)) {
        const heraldic = (x + y + (input.seed % 11)) % 13;
        if (heraldic === 0 || (heraldic === 1 && h % 4 === 0)) {
          g[y]![x] = h % 3 === 0 ? MAT.energy : MAT.rune;
          continue;
        }
      }

      // FurfSky-like clarity: sparse, repeated energy pin-lights on broad faces.
      if (reborn && input.clean > 0.6 && interior(x, y) && (ch === MAT.core || ch === MAT.gold)) {
        if ((x * 5 + y * 3 + input.seed) % 89 === 0) g[y]![x] = MAT.energy;
      }

      // 3D signature gets a structural under-plane on the bottom-right side.
      if (depth && input.pseudo3d > 0.7 && ch === MAT.core && x + y > 72 && h % 5 === 0) {
        g[y]![x] = MAT.iron;
      }
    }
  }
  return g;
}

export function validateNative64Templates(): void {
  for (const id of NATIVE64_TEMPLATE_IDS) {
    const d = native64Diagnostics(id);
    if (d.filled < 140) throw new Error(`native64:${id}: insufficient coverage ${d.filled}`);
    if (d.materials < 3) throw new Error(`native64:${id}: insufficient material separation ${d.materials}`);
    if (d.mixedBlockRatio < 0.18) {
      throw new Error(`native64:${id}: looks like scaled pixel art (${d.mixedBlockRatio.toFixed(3)})`);
    }
    if (d.onePixelFeatures < 4) throw new Error(`native64:${id}: missing 1px native detail`);
  }
}
