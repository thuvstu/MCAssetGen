import { MATERIALS, type Config } from "./data";
import { hexToRgb, lighten, makeRamp, mix, type Ramp, type RGB } from "./color";

const SQ2 = Math.SQRT2;
const LX = -0.6, LY = -0.8; // light from top-left (Minecraft convention)

export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(x: number, y: number, s: number) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const clampI = (i: number) => Math.max(0, Math.min(5, Math.round(i)));
// 4×4 Bayer ordered dither — gives smooth glow/posterization at 64px+.
const BAYER4 = [
  0 / 16 + 1 / 32,  8 / 16 + 1 / 32,  2 / 16 + 1 / 32, 10 / 16 + 1 / 32,
  12 / 16 + 1 / 32, 4 / 16 + 1 / 32, 14 / 16 + 1 / 32,  6 / 16 + 1 / 32,
  3 / 16 + 1 / 32, 11 / 16 + 1 / 32,  1 / 16 + 1 / 32,  9 / 16 + 1 / 32,
  15 / 16 + 1 / 32, 7 / 16 + 1 / 32, 13 / 16 + 1 / 32,  5 / 16 + 1 / 32,
];

class Layer {
  data: Float32Array;
  constructor(public n: number) { this.data = new Float32Array(n * n * 4); }
  blend(x: number, y: number, c: RGB, a: number) {
    const n = this.n;
    if (x < 0 || y < 0 || x >= n || y >= n || a <= 0) return;
    a = Math.min(1, a);
    const i = (y * n + x) * 4, d = this.data, da = d[i + 3];
    const oa = a + da * (1 - a);
    for (let k = 0; k < 3; k++) d[i + k] = (c[k] * a + d[i + k] * da * (1 - a)) / oa;
    d[i + 3] = oa;
  }
}

class Item {
  col: Float32Array; ol: Float32Array; li: Float32Array; mask: Uint8Array; em: Uint8Array;
  constructor(public n: number) {
    const s = n * n;
    this.col = new Float32Array(s * 3); this.ol = new Float32Array(s * 3); this.li = new Float32Array(s * 3);
    this.mask = new Uint8Array(s); this.em = new Uint8Array(s);
  }
  set(x: number, y: number, c: RGB, o: RGB, l: RGB, em: boolean) {
    const n = this.n;
    if (x < 0 || y < 0 || x >= n || y >= n) return;
    const i = y * n + x;
    for (let k = 0; k < 3; k++) { this.col[i * 3 + k] = c[k]; this.ol[i * 3 + k] = o[k]; this.li[i * 3 + k] = l[k]; }
    this.mask[i] = 1; this.em[i] = em ? 1 : 0;
  }
}

const GLYPHS3 = ["101010101", "111010010", "010111010", "110011011", "101111101", "111101111", "100111001", "011010110"];
const GLYPHS5 = [
  "0010001110101010010000100", "1000101010001000101010001", "1111100100011100010011111", "0111010001101011000101110",
  "1010010100111110010100101", "0010001010100010101000100", "1110010000111000010011100", "0101011111010101111101010",
];

type Ctx = ReturnType<typeof makeCtx>;

function makeCtx(cfg: Config, frame: number) {
  const N = cfg.size, S = N / 64, F = Math.max(1, cfg.frames);
  const phase = (frame / F) * Math.PI * 2;
  const half = N / 2;
  const mat = MATERIALS[cfg.shaftMaterial], trimM = MATERIALS[cfg.trimMaterial];
  const ramps = {
    shaft: makeRamp(mat.color, mat.contrast ?? 1),
    trim: makeRamp(trimM.color, trimM.contrast ?? 1.1),
    core: makeRamp(cfg.coreColor, 1.15),
    energy: makeRamp(cfg.energyColor, 0.9),
    grip: makeRamp(cfg.gripColor, 1),
    leaf: makeRamp("#4fae3a", 1),
    feather: makeRamp("#f1ede4", 0.9),
    sclera: makeRamp("#f2e8df", 0.8),
    iron: makeRamp("#b9bec7", 1),
    bone: makeRamp("#e6dfc8", 1),
    gold: makeRamp("#f2b632", 1.15),
    dark: makeRamp("#241c2c", 0.8),
    paper: makeRamp("#efe6cf", 0.85),
    moss: makeRamp("#5c7a34", 0.9),
    ruby: makeRamp("#e0314f", 1.2),
    sapphire: makeRamp("#2f6fe4", 1.2),
    emerald: makeRamp("#2fbf62", 1.1),
    holy: makeRamp("#f2e9c8", 0.9),
    shadow: makeRamp("#3a2430", 0.85),
    prismA: makeRamp("#7fd2ff", 1.1),
    prismB: makeRamp("#ff9fd8", 1.1),
    prismC: makeRamp("#b8ff9f", 1.1),
  };
  return {
    cfg, N, S, F, frame, phase, half, ramps,
    item: new Item(N), back: new Layer(N), front: new Layer(N), emitX: new Uint8Array(N * N),
    pulse: cfg.pulse ? Math.max(0, Math.sin(phase)) * 0.2 : 0,
  };
}

// ---------- geometry helpers ----------
const toScreen = (a: number, b: number): [number, number] => [(a + b) / SQ2, (b - a) / SQ2];
const toLocal = (px: number, py: number): [number, number] => [(px - py) / SQ2, (px + py) / SQ2];

function plot(ctx: Ctx, x: number, y: number, ramp: Ramp, idx: number, em = false) {
  let c = ramp[clampI(idx)];
  if (em && ctx.pulse) c = lighten(c, ctx.pulse);
  ctx.item.set(x, y, c, ramp[0], ramp[1], em);
}

/** iterate a square box in screen space around (cx, cy) */
function box(ctx: Ctx, cx: number, cy: number, r: number, fn: (x: number, y: number, dx: number, dy: number) => void) {
  const { N, half } = ctx;
  const x0 = Math.max(0, Math.floor(cx + half - r - 1)), x1 = Math.min(N - 1, Math.ceil(cx + half + r + 1));
  const y0 = Math.max(0, Math.floor(cy + half - r - 1)), y1 = Math.min(N - 1, Math.ceil(cy + half + r + 1));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) fn(x, y, x + 0.5 - half - cx, y + 0.5 - half - cy);
}

function fillScreen(ctx: Ctx, cx: number, cy: number, r: number, test: (dx: number, dy: number) => number, ramp: Ramp, em = false) {
  box(ctx, cx, cy, r, (x, y, dx, dy) => { const i = test(dx, dy); if (i >= 0) plot(ctx, x, y, ramp, i, em); });
}

function fillLocal(ctx: Ctx, ca: number, cb: number, r: number, test: (u: number, v: number) => number, ramp: Ramp, em = false, rot = 0) {
  const [cx, cy] = toScreen(ca, cb);
  const cr = Math.cos(rot), sr = Math.sin(rot);
  box(ctx, cx, cy, r, (x, y, dx, dy) => {
    const du = (dx - dy) / SQ2, dv = (dx + dy) / SQ2;
    const u = du * cr + dv * sr, v = -du * sr + dv * cr;
    const i = test(u, v);
    if (i >= 0) plot(ctx, x, y, ramp, i, em);
  });
}

function sphereIdx(dx: number, dy: number, R: number) {
  const nx = dx / R, ny = dy / R, d2 = nx * nx + ny * ny;
  if (d2 > 1) return -1;
  const nz = Math.sqrt(1 - d2);
  const l = -0.55 * nx - 0.62 * ny + 0.56 * nz;
  if (nx > -0.55 && nx < -0.15 && ny > -0.6 && ny < -0.2 && d2 < 0.5) return 5;
  return l > 0.72 ? 4 : l > 0.4 ? 3 : l > 0.08 ? 2 : 1;
}

/** Thick polyline in local (a,b) coords with cylindrical shading */
function drawPath(ctx: Ctx, pts: [number, number][], width: (t: number) => number, ramp: Ramp, em = false, target: "item" | "back" | "front" = "item", alpha = 1) {
  const sp = pts.map(([a, b]) => toScreen(a, b));
  const lens: number[] = [0];
  for (let i = 1; i < sp.length; i++) lens.push(lens[i - 1] + Math.hypot(sp[i][0] - sp[i - 1][0], sp[i][1] - sp[i - 1][1]));
  const total = lens[lens.length - 1] || 1;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  sp.forEach(([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); });
  const pad = 4 * ctx.S + 2;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, r = Math.max(maxX - minX, maxY - minY) / 2 + pad;
  box(ctx, cx, cy, r, (x, y, dx, dy) => {
    const px = dx + cx, py = dy + cy;
    let best = Infinity, bt = 0, ox = 0, oy = 0;
    for (let i = 1; i < sp.length; i++) {
      const [ax, ay] = sp[i - 1], [bx, by] = sp[i];
      const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
      const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2));
      const qx = ax + vx * t, qy = ay + vy * t, d = Math.hypot(px - qx, py - qy);
      if (d < best) { best = d; bt = (lens[i - 1] + (lens[i] - lens[i - 1]) * t) / total; ox = px - qx; oy = py - qy; }
    }
    const w = width(bt);
    if (best > Math.max(w / 2, 0.72)) return;
    const s = best > 0.01 ? ((ox * LX + oy * LY) / best) * (best / Math.max(w / 2, 0.5)) : 0;
    const idx = w < 1.8 ? 4 : s > 0.6 ? 5 : s > 0.2 ? 4 : s < -0.35 ? 2 : 3;
    if (target === "item") plot(ctx, x, y, ramp, idx, em);
    else {
      (target === "back" ? ctx.back : ctx.front).blend(x, y, ramp[clampI(idx)], alpha);
      if (em) ctx.emitX[y * ctx.N + x] = 1;
    }
  });
}

function shadeIdx(rel: number, kk: number) {
  if (kk === 1) return 4;
  if (rel < 0.2 && kk >= 4) return 5;
  return rel < 0.45 ? 4 : rel < 0.75 ? 3 : 2;
}

/**
 * Lateral bend of the shaft in local `b` units, t = 0 at pommel → 1 at head.
 * Always returns 0 at both ends so the head and pommel stay attached.
 */
function bendOffset(shape: string, t: number, S: number, seed: number) {
  const j = (seed % 13) * 0.37;
  const env = Math.pow(Math.sin(Math.PI * Math.max(0, Math.min(1, t))), 0.55);
  switch (shape) {
    case "curved": return Math.sin(t * Math.PI) * 2.8 * S;
    case "gnarled": return (Math.sin(t * 8.1 + j) * 1.2 + Math.sin(t * 15.7 + j * 2) * 0.6) * S * 0.9 * env;
    case "hooked": return Math.pow(t, 2.1) * (1 - t) * 11 * S;
    case "swan": return Math.sin(t * Math.PI * 1.55 - 0.35) * 2.1 * S * env;
    default: return 0;
  }
}

// ---------- layout ----------
function layout(ctx: Ctx) {
  const { cfg, S } = ctx;
  const R = 6 * S * cfg.coreSize;
  const coreTop: Record<string, number> = {
    crystal: 1.55, cluster: 1.6, orb: 0.9, prism: 1.25, star: 1.05, skull: 1.0, eye: 0.85, flame: 1.75,
    lantern: 1.35, book: 1.25, hourglass: 1.4, sun: 1.85, moon: 1.15, heart: 1.05, diamond: 1.45,
    serpenthead: 1.1, portal: 1.05, totem: 1.35, anvil: 1.1, none: 0,
    shell: 1.0, conch: 1.2, pearl: 0.8, battery: 1.2, compass: 0.95, lanternCore: 1.1, coralHeart: 1.0,
    blade: 2.1, shortBlade: 1.4, ruby: 1.0, sapphire: 1.0, emeraldGem: 1.0, holyBlade: 1.9, cursedBlade: 1.9, prismBlade: 2.0,
  };
  const mountTop: Record<string, number> = {
    none: 0, prongs: 1.1 * R, crown: 0.3 * R, crescent: 0.7 * R + 3.5 * S, ring: R + 6 * S,
    fork: R + 7 * S, curl: R + 3.2 * S, wings: 1.4 * R, cage: R + 3.5 * S,
    antler: R + 9 * S, serpent: R + 4 * S, lantern: R + 2 * S, scythe: R + 7 * S, book: R + 4.5 * S,
    chain: R + 3 * S, claw: R + 4.5 * S, hourglass: R + 5 * S, arch: R + 6 * S,
    lotus: R + 4 * S, astrolabe: R + 6.5 * S, tiara: R + 5 * S, lyre: R + 5.5 * S,
    coralCrown: R + 4.5 * S, trident: R + 7 * S,
    collar: R * 0.5, tinyCollar: R * 0.35, guard: R * 0.9, microRing: R * 0.8, tipCap: R * 0.4,
  };
  // lateral reach of the core itself (radial cores like the sun need real headroom)
  const coreLat: Record<string, number> = {
    crystal: 0.62, cluster: 0.95, orb: 0.9, prism: 0.8, star: 1.05, skull: 1, eye: 1, flame: 0.85,
    lantern: 1.15, book: 1.2, hourglass: 1.1, sun: 1.75, moon: 1.05, heart: 1, diamond: 1,
    serpenthead: 1.2, portal: 1.05, totem: 1, anvil: 1.4, none: 0,
    shell: 1.0, conch: 1.1, pearl: 0.8, battery: 0.9, compass: 1.0, lanternCore: 0.9, coralHeart: 1.0,
    blade: 0.55, shortBlade: 0.5, ruby: 0.8, sapphire: 0.8, emeraldGem: 0.8, holyBlade: 0.6, cursedBlade: 0.6, prismBlade: 0.6,
  };
  const mountLat: Record<string, number> = {
    none: R, prongs: 1.25 * R, crown: R, crescent: R + 3.5 * S, ring: R + 6 * S,
    fork: 1.4 * R, curl: R + 3.8 * S, wings: 2.9 * R + 2 * S, cage: R + 2 * S,
    antler: R + 10 * S, serpent: R + 3.5 * S, lantern: R + 3 * S, scythe: R + 6 * S, book: R + 4.5 * S,
    chain: R + 3 * S, claw: R + 4 * S, hourglass: R + 3.5 * S, arch: R + 5.5 * S,
    lotus: R + 5.5 * S, astrolabe: R + 6.5 * S, tiara: R + 4.5 * S, lyre: R + 5 * S,
    coralCrown: R + 4.5 * S, trident: R * 1.6,
    collar: R * 1.1, tinyCollar: R * 0.9, guard: R * 1.5, microRing: R * 1.2, tipCap: R * 0.9,
  };
  const gap = cfg.floatingCore ? 2.2 * S + R * 0.25 : 0;
  const Rf = (R + 5 * S) * cfg.floaterRadius;
  let lat = Math.max(mountLat[cfg.mount], (coreLat[cfg.core] ?? 1) * R + gap * 0.6);
  let top = Math.max(coreTop[cfg.core] * R + gap + 1 * S, mountTop[cfg.mount]);

  // Each ornament is a true part of the silhouette, so reserve canvas room before positioning the shaft.
  const ornamentReach: Record<string, [number, number]> = {
    none: [0, 0], runeRing: [R + 4 * S, R + 4 * S], crownJewels: [R + 4 * S, R + 3 * S],
    vineCrest: [R + 5 * S, R + 3 * S], hangingCharms: [R + 3 * S, R + 5 * S], chainTassel: [R + 3 * S, R + 6 * S],
    sunDisk: [R + 7 * S, R + 7 * S], lunarPhase: [R + 6 * S, R + 5 * S], thornHalo: [R + 6 * S, R + 6 * S],
    floatingPages: [R + 6 * S, R + 5 * S], soulCage: [R + 5 * S, R + 5 * S], clockwork: [R + 6 * S, R + 6 * S],
    featherCrest: [R + 8 * S, R + 6 * S], serpentCoil: [R + 5 * S, R + 5 * S], alchemicalRing: [R + 6 * S, R + 6 * S],
    beadRosary: [R + 5 * S, R + 6 * S], crystalLattice: [R + 6 * S, R + 6 * S],
    silkRibbons: [R + 7 * S, R + 4 * S], arabesque: [R + 6 * S, R + 5 * S],
    lotusPetals: [R + 6.5 * S, R + 6 * S], celestialAstrolabe: [R + 7 * S, R + 6.5 * S],
  };
  const [ornLat, ornTop] = ornamentReach[cfg.ornament] ?? [0, 0];
  lat = Math.max(lat, ornLat * cfg.ornamentScale);
  top = Math.max(top, ornTop * cfg.ornamentScale + gap * 0.4);
  const formReach: Record<string, [number, number]> = {
    classic: [0, 0], asymmetric: [R + 7 * S, R + 5 * S], bifurcated: [R + 6 * S, R + 5 * S],
    levitating: [R + 5 * S, R + 8 * S], constellation: [R + 8 * S, R + 7 * S], shrine: [R + 6 * S, R + 8 * S],
    totemic: [R + 4 * S, R + 10 * S], bouquet: [R + 8 * S, R + 7 * S],
  };
  const [formLat, formTop] = formReach[cfg.form] ?? [0, 0];
  lat = Math.max(lat, formLat);
  top = Math.max(top, formTop + gap * 0.3);

  if (cfg.floater === "halo") {
    top = Math.max(top, R * 1.35 + gap + 4 * S); lat = Math.max(lat, R * 0.85 + 2.5 * S);
  } else if (cfg.floater !== "none") {
    top = Math.max(top, gap + Rf * 0.42 + 3.2 * S);
    lat = Math.max(lat, Rf + 2.4 * S);
  }
  if (cfg.magicCircle) { const Rc = R + 6 * S; top = Math.max(top, gap + Rc * 1.3); lat = Math.max(lat, Rc * 0.94); }
  if (cfg.rays) { const Rr = Math.min(R * 1.35 + cfg.glowRadius * S * 0.45, 15 * S); top = Math.max(top, gap + Rr * 0.9); lat = Math.max(lat, Rr * 0.75); }

  // Every PommelId must appear here: a missing entry makes belowA NaN and breaks the whole layout.
  const pommelLen: Record<string, number> = {
    none: 0.5, cap: 2.5, gem: 5, spike: 6, orb: 4.5, roots: 6, blade: 7, skull: 5,
    lantern: 6.5, chain: 7.5, hook: 4.5, crystal: 7,
    cog: 4.5, shell: 4, knot: 4, anchor: 6.5, gear: 5, leaf: 4, pearl: 3.5, compass: 4.5,
  };
  // The canvas is a square, so in rotated (a,b) coords the usable region is |a+b|<=M and |b-a|<=M.
  // The head's topmost and widest points rarely coincide, so blend the two extremes.
  const reserve = cfg.glow > 0 ? Math.min(cfg.glowRadius * S * 0.32, 3.5 * S) : 0;
  const aboveA = Math.max(top + lat * 0.55, top * 0.55 + lat) + reserve;
  const belowA = pommelLen[cfg.pommel] * S + 3.2 * S + reserve * 0.5;

  const M = 44.2 * S;
  const available = Math.max(10 * S, 2 * M - aboveA - belowA);
  const span = available * Math.max(0.25, Math.min(1, cfg.length));
  let aH = M - aboveA;
  let aStart = aH - span;
  const shift = (available - span) * 0.5;
  aH -= shift; aStart -= shift;
  const bob = cfg.floatingCore ? Math.sin(ctx.phase) * 0.9 * S : 0;
  return { R, aH, aStart, span, coreA: aH + gap + bob, aCollar: aH - R * 0.8, Rf };
}

// ---------- shaft ----------
function drawShaft(ctx: Ctx, L: ReturnType<typeof layout>) {
  const { cfg, N, S, ramps, item, phase } = ctx;
  const k = Math.max(1, Math.round(cfg.thickness));
  const mat = MATERIALS[cfg.shaftMaterial];
  const aEnd = cfg.core === "none" ? L.aH : L.aH - L.R * 0.5;
  const g0 = L.aStart + L.span * 0.1, g1 = L.aStart + L.span * 0.3;
  const hasCollar = cfg.mount !== "curl";
  const bandHw = Math.max(0.75, 1.1 * S);
  const cand: number[] = [];
  if (cfg.grip) cand.push(g1 + bandHw, L.aCollar - L.span * 0.22, g0 - bandHw, L.aCollar - L.span * 0.42);
  else cand.push(L.aCollar - L.span * 0.2, L.aCollar - L.span * 0.4, L.aStart + L.span * 0.3, L.aStart + L.span * 0.1);
  const bands = cand.slice(0, cfg.bands);
  const energyRamp = ramps.energy;
  const seedOff = cfg.seed % 97;

  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const tt = x - y, c = x + y + 1 - N, a = tt / SQ2;
    if (a < L.aStart || a > aEnd) continue;
    let kk = k, ramp = ramps.shaft, region = "shaft";
    if (cfg.taper && a < L.aStart + L.span * 0.4) kk = Math.max(1, k - 1);
    if (hasCollar && a > L.aCollar - 3 * S && a <= L.aCollar + 0.5) { kk = k + (a > L.aCollar - 1 * S ? 3 : 2); ramp = ramps.trim; region = "collar"; }
    else if (bands.some((b) => Math.abs(a - b) <= bandHw)) { kk = k + 2; ramp = ramps.trim; region = "band"; }
    else if (cfg.grip && a >= g0 && a <= g1) { kk = k + 1; ramp = ramps.grip; region = "grip"; }
    const t01 = Math.max(0, Math.min(1, (a - L.aStart) / Math.max(0.001, L.span)));
    const bend = Math.round(bendOffset(cfg.shape, t01, S, cfg.seed));
    const wob = cfg.pattern === "twisted" && region === "shaft" ? Math.round(Math.sin(tt * 0.28 + seedOff) * 0.55) : 0;
    const lo = -Math.floor((kk - 1) / 2) + wob + bend, hi = lo + kk - 1;
    if (c < lo || c > hi) continue;
    const rel = kk === 1 ? 0 : (c - lo) / (kk - 1);
    let idx = shadeIdx(rel, kk);
    let em = !!mat.glow && region === "shaft";

    if (region === "grip") {
      const gg = (((tt + c) % 100) + 100) % 100;
      switch (cfg.gripStyle) {
        case "leather": if (gg % 7 === 0) idx = Math.max(1, idx - 1); if (rel < 0.18) idx = Math.min(5, idx + 1); break;
        case "chain": { const link = gg % 5; if (link < 2) idx = 5; else if (link === 2) idx = 3; else idx = 1; ramp = ramps.trim; break; }
        case "studded": if (gg % 6 === 0 && Math.abs(rel - 0.35) < 0.22) { ramp = ramps.trim; idx = 5; } else if (gg % 3 === 0) idx = Math.max(1, idx - 1); break;
        case "cord": if (gg % 2 === 0) idx = Math.max(1, idx - 2); else idx = Math.min(5, idx + 1); break;
        default: if (gg % 3 === 0) idx = Math.max(1, idx - 2); break;
      }
    } else if (region === "band" || region === "collar") {
      // metal bands: bright top edge, dark bottom edge (classic resource-pack specular)
      if (cfg.specular) {
        const litEdge = c === lo;
        const shadowEdge = c === hi;
        if (litEdge && rel < 0.5) idx = 5;
        else if (shadowEdge && rel > 0.5) idx = 0;
        else if (rel < 0.25) idx = 5;
      } else if (rel < 0.3) idx = 5;
    } else {
      switch (cfg.pattern) {
        case "grain": if (hash(Math.floor(tt / 4), c, cfg.seed) < 0.22) idx = Math.max(1, idx - 1); break;
        case "spiral": {
          const P = Math.max(5, Math.round(6 * S));
          if ((((tt + c * 2) % P) + P) % P < Math.max(1, Math.round(1.3 * S))) ramp = ramps.trim;
          break;
        }
        case "twisted": {
          const P = Math.max(6, Math.round(8 * S));
          const m = (((tt + c * 3) % P) + P) % P;
          if (m < P / 2) idx = Math.max(1, idx - 1); else if (m === Math.floor(P / 2)) idx = Math.min(5, idx + 1);
          break;
        }
        case "ribbed": {
          const P = Math.max(7, Math.round(10 * S));
          const m = (((tt) % P) + P) % P;
          if (m === 0) idx = Math.min(5, idx + 1); else if (m === 1) idx = Math.max(1, idx - 1);
          break;
        }
        case "runes": {
          const mid = Math.round((lo + hi) / 2);
          const seg = Math.floor(tt / 6);
          if (c === mid && kk >= 1 && hash(seg, 3, cfg.seed) > 0.35 && (((tt % 6) + 6) % 6) < 4 && hash(tt, c, cfg.seed + 7) > 0.3) { ramp = energyRamp; idx = 4; em = true; }
          break;
        }
        case "gradient": {
          const t = Math.max(0, (a - L.aStart) / (aEnd - L.aStart));
          if (hash(tt, c, cfg.seed) < t * t * 1.1) { ramp = t > 0.7 ? ramps.core : energyRamp; em = t > 0.75; }
          break;
        }
        case "filigree": {
          const P = Math.max(6, Math.round(6 * S));
          if (kk >= 2 && ((((tt + c) % P) + P) % P === 0 || (((tt - c) % P) + P) % P === 0)) { ramp = ramps.trim; idx = Math.min(5, idx + 1); }
          break;
        }
        case "bark": {
          const n = hash(Math.floor(tt / 3), Math.floor(c / 2), cfg.seed);
          if (n < 0.3) idx = Math.max(1, idx - 1);
          else if (n > 0.88) idx = Math.min(5, idx + 1);
          if (kk >= 3 && (c - lo) % 2 === 0 && n > 0.55) idx = Math.max(1, idx - 1);
          break;
        }
        case "scales": {
          const P = Math.max(4, Math.round(4 * S));
          const row = Math.floor(tt / P), off = row % 2 === 0 ? 0 : Math.floor(P / 2);
          const u = (((c + off) % P) + P) % P, v = (((tt) % P) + P) % P;
          const edge = u === 0 || v === P - 1;
          if (edge) idx = Math.max(1, idx - 2);
          else if (u === 1 && v < P / 2) idx = Math.min(5, idx + 1);
          break;
        }
        case "bamboo": {
          const P = Math.max(9, Math.round(11 * S));
          const m = (((tt) % P) + P) % P;
          if (m === 0) { ramp = ramps.trim; idx = 5; }
          else if (m === 1) { ramp = ramps.trim; idx = 2; }
          else if (m === 2) idx = Math.min(5, idx + 1);
          break;
        }
        case "candy": {
          const P = Math.max(6, Math.round(7 * S));
          const m = (((tt + c) % P) + P) % P;
          if (m < P / 2) { ramp = ramps.energy; idx = Math.min(5, idx + 1); em = true; }
          break;
        }
        case "cracked": {
          const n = hash(Math.floor(tt / 2), c, cfg.seed + 11);
          if (n > 0.86) { ramp = ramps.dark; idx = 0; }
          else if (n < 0.12) idx = Math.max(1, idx - 1);
          if (mat.glow && n > 0.9) { ramp = ramps.energy; idx = 5; em = true; }
          break;
        }
        case "mossy": {
          const n = hash(Math.floor(tt / 3), c, cfg.seed + 5);
          if (n > 0.62 && rel > 0.45) { ramp = ramps.moss; idx = n > 0.88 ? 4 : 3; }
          else if (n < 0.15) idx = Math.max(1, idx - 1);
          break;
        }
        case "frosted": {
          const n = hash(tt, c, cfg.seed + 21);
          if (n > 0.82) { ramp = ramps.energy; idx = 5; em = true; }
          else if (n > 0.6) { ramp = ramps.energy; idx = 4; }
          else if (rel > 0.6) idx = Math.min(5, idx + 1);
          break;
        }
        case "lavavein": {
          const P = Math.max(7, Math.round(9 * S));
          const m = (((tt * 2 + c) % P) + P) % P;
          if (m === 0 || (m === 1 && hash(tt, 3, cfg.seed) > 0.5)) { ramp = ramps.core; idx = 5; em = true; }
          else if (hash(tt, c, cfg.seed + 31) > 0.9) { ramp = ramps.dark; idx = 0; }
          break;
        }
        case "chainlink": {
          const P = Math.max(5, Math.round(6 * S));
          const u = (((tt) % P) + P) % P, v = (((c) % P) + P) % P;
          const ring = Math.abs(Math.hypot(u - P / 2, v - P / 2) - P * 0.34) < 0.85;
          if (ring) { ramp = ramps.trim; idx = u < P / 2 ? 4 : 2; }
          break;
        }
        case "engraved": {
          const P = Math.max(5, Math.round(6 * S));
          const cell = Math.floor(tt / P), bit = (((tt % P) + P) % P);
          const on = hash(cell, Math.floor((c - lo) * 3), cfg.seed + 41) > 0.55;
          if (on && bit > 0 && bit < P - 1 && kk >= 2) { ramp = ramps.trim; idx = rel < 0.4 ? 5 : 1; }
          break;
        }
        case "feathered": {
          const P = Math.max(4, Math.round(5 * S));
          const m = (((tt + c * 2) % P) + P) % P;
          if (m === 0) { ramp = ramps.feather; idx = 5; }
          else if (m === 1) { ramp = ramps.feather; idx = 3; }
          else idx = Math.max(1, idx - 1);
          break;
        }
        case "microEdge": {
          // Vanilla+: a single brighter pixel column on the lit side, nothing else.
          if (kk >= 2 && c === lo) idx = 5;
          else if (kk >= 3 && c === hi) idx = Math.max(1, idx - 1);
          break;
        }
        case "tipTint": {
          // Vanilla+: faint core-color wash that strengthens toward the tip.
          const t = Math.max(0, (a - L.aStart) / Math.max(1, aEnd - L.aStart));
          if (t > 0.55 && hash(tt, c, cfg.seed + 51) < (t - 0.55) * 1.6) { ramp = ramps.core; idx = Math.min(5, idx + 1); }
          break;
        }
        case "notch": {
          // Vanilla tool ticks: tiny dark nicks every N pixels, like durability marks.
          const P = Math.max(8, Math.round(11 * S));
          const m = (((tt) % P) + P) % P;
          if (m === 0 && c === hi) idx = 0;
          else if (m === 0 && kk >= 2 && c === hi - 1) idx = Math.max(1, idx - 1);
          break;
        }
        case "speckle": {
          // Sparse 1px mineral flecks in trim color.
          const n = hash(tt * 2 + 1, c * 3 + 5, cfg.seed + 61);
          if (n > 0.965) { ramp = ramps.trim; idx = 5; }
          else if (n > 0.93) { ramp = ramps.trim; idx = 2; }
          break;
        }
        case "thinBand": {
          // Single-pixel inlay rings, spaced wide for a tool-like read.
          const P = Math.max(10, Math.round(14 * S));
          const m = (((tt) % P) + P) % P;
          if (m === 0) { ramp = ramps.trim; idx = 5; }
          else if (m === 1) { ramp = ramps.trim; idx = 1; }
          break;
        }
        case "vanillaGrain": {
          // Softer, sparser grain than "grain": two tones only.
          const n = hash(Math.floor(tt / 5), c, cfg.seed + 71);
          if (n < 0.16) idx = Math.max(1, idx - 1);
          break;
        }
        case "gearwork": {
          const P = Math.max(6, Math.round(7 * S));
          const m = (((tt) % P) + P) % P;
          if (m === 0 || m === 3) { ramp = ramps.trim; idx = m === 0 ? 5 : 2; }
          else if (kk >= 3 && hash(tt, c, cfg.seed + 81) > 0.9) { ramp = ramps.trim; idx = 4; }
          break;
        }
        case "wave": {
          const wv = Math.sin(tt * 0.45 + seedOff) * (kk / 2);
          if (Math.abs(c - Math.round(wv * 0.5)) < 0.6) { ramp = ramps.energy; idx = 4; em = true; }
          break;
        }
        case "riveted": {
          const P = Math.max(6, Math.round(8 * S));
          const m = (((tt) % P) + P) % P;
          if (m === 0 && (c === lo || c === hi)) { ramp = ramps.trim; idx = 5; }
          else if (m === 1 && (c === lo || c === hi)) { ramp = ramps.trim; idx = 1; }
          break;
        }
        case "gemInlay": {
          const P = Math.max(7, Math.round(9 * S));
          const m = (((tt) % P) + P) % P;
          const mid = Math.round((lo + hi) / 2);
          if (m < 2 && c === mid) { ramp = ramps.core; idx = 5; em = true; }
          else if (m < 2 && Math.abs(c - mid) === 1) { ramp = ramps.core; idx = 3; }
          break;
        }
        case "woven": {
          const m = (((tt + c * 2) % 4) + 4) % 4;
          if (m === 0) idx = Math.min(5, idx + 1); else if (m === 2) idx = Math.max(1, idx - 1);
          break;
        }
        case "etched": {
          const P = Math.max(8, Math.round(10 * S));
          if ((((tt * 3 + c) % P) + P) % P === 0) idx = Math.max(0, idx - 2);
          break;
        }
        case "circuit": {
          const P = Math.max(6, Math.round(7 * S));
          const m = (((tt + c) % P) + P) % P;
          if (m === 0) { ramp = ramps.energy; idx = 5; em = true; }
          else if (m === 3 && hash(tt, 7, cfg.seed) > 0.6) { ramp = ramps.trim; idx = 4; }
          break;
        }
        case "barnacle": {
          const n = hash(Math.floor(tt / 2), c * 2, cfg.seed + 91);
          if (n > 0.9) { ramp = ramps.paper; idx = 4; }
          else if (n > 0.82) { ramp = ramps.paper; idx = 2; }
          break;
        }
        case "chevron": {
          const P = Math.max(6, Math.round(8 * S));
          const v = Math.abs((((tt % P) + P) % P) - P / 2);
          if (Math.abs(c - Math.round((lo + hi) / 2)) === Math.round(v / 2) % Math.max(1, Math.floor(kk / 2) + 1) && hash(tt, 11, cfg.seed) > 0.4) { ramp = ramps.trim; idx = 4; }
          break;
        }
        case "crystalSeam": {
          const mid = Math.round((lo + hi) / 2);
          if (c === mid && hash(tt, 13, cfg.seed) > 0.45) { ramp = ramps.core; idx = 5; em = true; }
          else if (Math.abs(c - mid) === 1 && hash(tt, 14, cfg.seed) > 0.8) { ramp = ramps.core; idx = 3; }
          break;
        }
        case "kintsugi": {
          if (hash(Math.floor(tt / 3), c, cfg.seed + 101) > 0.93) { ramp = ramps.gold; idx = 5; }
          break;
        }
        case "marquetry": {
          const P = Math.max(5, Math.round(6 * S));
          const m = (Math.floor(tt / P) + (c - lo)) % 3;
          if (m === 0) idx = Math.min(5, idx + 1); else if (m === 1) idx = Math.max(1, idx - 1);
          break;
        }
      }
      if (mat.metal && rel < 0.3 && hash(tt, 1, cfg.seed) > 0.8) idx = 5;
    }
    plot(ctx, x, y, ramp, idx, em);
  }

  // pommel
  const pa = L.aStart;
  const pb = bendOffset(cfg.shape, 0, S, cfg.seed);
  if (cfg.pommel === "cap") {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const tt = x - y, c = x + y + 1 - N, a = tt / SQ2;
      if (a < pa - 2.5 * S || a > pa + 0.5) continue;
      const kk = a < pa - 1.8 * S ? Math.max(1, k) : k + 2;
      const lo = -Math.floor((kk - 1) / 2) + Math.round(pb);
      if (c < lo || c > lo + kk - 1) continue;
      plot(ctx, x, y, ramps.trim, shadeIdx(kk === 1 ? 0 : (c - lo) / (kk - 1), kk));
    }
  } else if (cfg.pommel === "spike") {
    const len = 6 * S;
    drawPath(ctx, [[pa + 1, pb], [pa - len * 0.4, pb], [pa - len, pb]], (t) => Math.max(1, (k + 1.6) * (1 - t)), ramps.trim);
  } else if (cfg.pommel === "gem" || cfg.pommel === "orb" || cfg.pommel === "crystal") {
    const r = Math.max(1.3, (k / 2 + 1.3) * S * 0.9 + 0.6);
    const [cx, cy] = toScreen(pa - r * 0.9, pb);
    if (cfg.pommel === "gem") {
      fillLocal(ctx, pa - r * 1.1, pb, r * 2, (u, v) => {
        const d = Math.abs(v) / (r * 0.85) + Math.abs(u) / (r * 1.3);
        if (d > 1.05) return -1;
        return d < 0.45 ? 5 : v < 0 ? 4 : 2;
      }, ramps.core, true);
      drawPath(ctx, [[pa + 0.5, pb], [pa - 0.8 * S, pb]], () => k + 2, ramps.trim);
    } else if (cfg.pommel === "crystal") {
      drawCrystal(ctx, pa - r * 1.5, pb, r * 1.5, 0.85, 0, ramps.core);
    } else fillScreen(ctx, cx, cy, r + 1, (dx, dy) => sphereIdx(dx, dy, r), ramps.trim);
  } else if (cfg.pommel === "roots") {
    for (let i = 0; i < 4; i++) {
      const ang = -0.45 + i * 0.55;
      const len = (2.8 + (i % 2) * 1.4) * S;
      drawPath(ctx, [[pa + 0.5, pb], [pa - len * 0.5, pb + Math.sin(ang) * len * 0.6], [pa - len, pb + Math.sin(ang) * len * 0.9]],
        (t) => Math.max(1, (k * 0.75 + 1) * (1 - t * 0.7)), ramps.shaft);
    }
  } else if (cfg.pommel === "blade") {
    const len = 6.5 * S;
    fillLocal(ctx, pa - len * 0.5, pb, len, (u, v) => {
      if (u < -len * 0.55 || u > len * 0.55) return -1;
      const w = (k * 0.5 + 1.4) * S * (1 - Math.abs(u) / (len * 0.62));
      if (Math.abs(v) > Math.max(0.6, w)) return -1;
      return v < -w * 0.3 ? 5 : v < 0 ? 4 : 1;
    }, ramps.iron);
  } else if (cfg.pommel === "skull") {
    const r = Math.max(1.6, (k * 0.45 + 1.4) * S);
    const [sx, sy] = toScreen(pa - r * 1.2, pb);
    fillScreen(ctx, sx, sy, r + 1, (dx, dy) => {
      if (Math.hypot(dx, dy * 0.85) > r) return -1;
      if (dy > r * 0.25 && Math.abs((dx / Math.max(0.8, r * 0.22)) % 1) < 0.2) return 1;
      return sphereIdx(dx, dy, r);
    }, ramps.bone);
    for (const s of [-1, 1]) fillScreen(ctx, sx + s * r * 0.38, sy + r * 0.05, 2, (dx, dy) => (Math.hypot(dx, dy) <= Math.max(0.5, r * 0.2) ? 0 : -1), ramps.dark);
  } else if (cfg.pommel === "lantern") {
    const r = Math.max(1.6, (k * 0.4 + 1.5) * S);
    const [sx, sy] = toScreen(pa - r * 1.4, pb);
    fillScreen(ctx, sx, sy, r + 1, (dx, dy) => {
      const e = (dx / r) ** 2 + (dy / (r * 1.15)) ** 2;
      if (e > 1) return -1;
      return e > 0.72 ? (dy < 0 ? 4 : 2) : 5;
    }, ramps.energy, true);
    fillScreen(ctx, sx, sy, r + 2, (dx, dy) => {
      const e = Math.sqrt((dx / (r * 1.12)) ** 2 + (dy / (r * 1.28)) ** 2);
      const bar = Math.abs(dy) < 0.6 || Math.abs(dx) < 0.6;
      return e > 0.94 && e < 1.12 && bar ? 4 : -1;
    }, ramps.trim);
  } else if (cfg.pommel === "chain") {
    for (let i = 0; i < 3; i++) {
      const rr = Math.max(0.9, 1.1 * S);
      const [sx, sy] = toScreen(pa - (1.6 + i * 2) * S, pb + (i % 2 === 0 ? 0.6 : -0.6) * S);
      fillScreen(ctx, sx, sy, rr + 1, (dx, dy) => {
        const e = Math.sqrt((dx / rr) ** 2 + (dy / (rr * 0.7)) ** 2);
        return Math.abs(e - 1) * rr * 0.7 > Math.max(0.45, 0.5 * S) ? -1 : dy < 0 ? 4 : 2;
      }, ramps.iron);
    }
  } else if (cfg.pommel === "hook") {
    const pts: [number, number][] = [[pa, pb]];
    for (let i = 0; i <= 10; i++) {
      const ang = Math.PI * 0.15 + (i / 10) * Math.PI * 1.25;
      pts.push([pa - 2.4 * S + Math.cos(ang) * 2.4 * S, pb + Math.sin(ang) * 2.4 * S]);
    }
    drawPath(ctx, pts, () => Math.max(1, 1.5 * S), ramps.trim);
  } else if (cfg.pommel === "cog" || cfg.pommel === "gear") {
    // Toothed wheel; "gear" is the heavier machine variant with a hub.
    const big = cfg.pommel === "gear";
    const gr = Math.max(1.5, (k * 0.45 + 1.5) * S);
    const [gx, gy] = toScreen(pa - gr * 1.1, pb);
    const teeth = big ? 8 : 6;
    fillScreen(ctx, gx, gy, gr * 1.35 + 1, (dx, dy) => {
      const d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + phase * (big ? 0.5 : 0.25);
      const outer = Math.sin(a * teeth) > 0.15 ? gr * 1.25 : gr;
      if (d > outer) return -1;
      if (d < gr * (big ? 0.3 : 0.42)) return 2; // hub / bore
      if (big && d < gr * 0.55) return 4;
      return d > gr * 0.85 ? 4 : dx * LX + dy * LY > 0 ? 5 : 3;
    }, ramps.trim);
    if (big) {
      const hr = Math.max(0.6, gr * 0.22);
      fillScreen(ctx, gx, gy, hr + 1, (dx, dy) => sphereIdx(dx, dy, hr), ramps.energy, true);
    }
  } else if (cfg.pommel === "shell") {
    const r = Math.max(1.4, (k * 0.45 + 1.4) * S);
    const [sx, sy] = toScreen(pa - r * 1.15, pb);
    fillScreen(ctx, sx, sy, r + 1, (dx, dy) => {
      const d = Math.hypot(dx, dy - r * 0.4);
      if (d > r || dy > r * 0.62) return -1;
      if (d > r - Math.max(0.7, 0.8 * S)) return 4;
      const ridge = Math.sin(Math.atan2(dy - r * 0.4, dx) * 6) > 0.2;
      return ridge ? 5 : dx < 0 ? 4 : 3;
    }, ramps.core, true);
    fillScreen(ctx, sx, sy + r * 0.45, 1.6 * S, (dx, dy) => (Math.hypot(dx, dy) <= Math.max(0.6, 0.8 * S) ? 2 : -1), ramps.trim);
  } else if (cfg.pommel === "knot") {
    // Organic burl: lumpy wood ball with a highlight cluster
    const r = Math.max(1.5, (k * 0.5 + 1.4) * S);
    const [sx, sy] = toScreen(pa - r * 1.1, pb);
    fillScreen(ctx, sx, sy, r + 1, (dx, dy) => {
      const wob = 1 + Math.sin(Math.atan2(dy, dx) * 3 + 1.3) * 0.09;
      if (Math.hypot(dx, dy) > r * wob) return -1;
      const grain = Math.sin((dx + dy) * 0.9 / Math.max(1, S) + 2) > 0.45;
      if (dx < -r * 0.2 && dy < r * 0.1) return 5;
      return grain ? 2 : 3;
    }, ramps.shaft);
  } else if (cfg.pommel === "anchor") {
    // Stock, shank and curved flukes
    const aw = Math.max(1.2, (k * 0.4 + 1.3) * S);
    const [ax, ay] = toScreen(pa - 3.2 * S, pb);
    drawPath(ctx, [[pa + 0.5, pb], [pa - 4.4 * S, pb]], () => Math.max(1.1, aw * 0.6), ramps.trim);
    fillScreen(ctx, ax, ay, aw * 2.4, (dx, dy) => {
      if (Math.abs(dx) > aw || dy > 0.4 * S || dy < -aw * 1.1) return -1;
      return dy < -aw * 0.55 ? 5 : dx < 0 ? 4 : 3;
    }, ramps.trim);
    for (const s of [-1, 1]) {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 9; i++) {
        const t = i / 9;
        pts.push([ax + (t - 0.5) * aw * 1.5, pb + s * (aw * 0.35 + Math.sin(t * Math.PI * 0.9) * aw * 1.05)]);
      }
      drawPath(ctx, pts, (t) => Math.max(0.85, aw * 0.55 * (1 - t * 0.55)), ramps.trim);
    }
  } else if (cfg.pommel === "leaf") {
    const lr = Math.max(1.6, (k * 0.4 + 1.5) * S);
    const [lx, ly] = toScreen(pa - lr * 0.95, pb);
    fillScreen(ctx, lx, ly, lr + 1, (dx, dy) => {
      const nx = dx / lr, ny = dy / (lr * 0.55);
      if (Math.abs(ny) > 1 - Math.abs(nx) * 0.35) return -1;
      if (Math.abs(dy) < Math.max(0.4, lr * 0.14)) return 2; // midrib
      return dy < 0 ? 4 : 3;
    }, ramps.leaf);
  } else if (cfg.pommel === "pearl") {
    const r = Math.max(1.2, (k * 0.4 + 1.2) * S);
    const [px, py] = toScreen(pa - r * 1.05, pb);
    fillScreen(ctx, px, py, r + 1, (dx, dy) => {
      const i = sphereIdx(dx, dy, r);
      if (i < 0) return -1;
      const d = Math.hypot(dx, dy) / r;
      if (d > 0.5 && d < 0.82 && dx < 0 && dy < 0.2 * r) return 5;
      return Math.min(5, i + 1);
    }, ramps.core, true);
  } else if (cfg.pommel === "compass") {
    const r = Math.max(1.5, (k * 0.45 + 1.5) * S);
    const [cxp, cyp] = toScreen(pa - r * 1.2, pb);
    fillScreen(ctx, cxp, cyp, r + 1, (dx, dy) => {
      const d = Math.hypot(dx, dy);
      if (d > r) return -1;
      if (d > r - Math.max(0.7, 0.85 * S)) return dx * LX + dy * LY > 0 ? 5 : 2;
      const na = -Math.PI / 2 + Math.sin(phase * 0.6) * 0.45;
      const along = dx * Math.cos(na) + dy * Math.sin(na), across = -dx * Math.sin(na) + dy * Math.cos(na);
      if (Math.abs(across) < Math.max(0.4, 0.45 * S) && Math.abs(along) < r * 0.7) return along > 0 ? 5 : 1;
      if (d < r * 0.15) return 5;
      return 3;
    }, ramps.core, true);
  }

  // vine overlay
  if (cfg.pattern === "vine") {
    const t0 = Math.ceil((L.aStart + L.span * 0.08) * SQ2), t1 = Math.floor((L.aCollar - 0.5 * S) * SQ2);
    for (let tt = t0; tt <= t1; tt++) {
      const s = Math.sin(tt * 0.3 + seedOff), co = Math.cos(tt * 0.3 + seedOff);
      const bd = Math.round(bendOffset(cfg.shape, Math.max(0, Math.min(1, (tt / SQ2 - L.aStart) / Math.max(0.001, L.span))), S, cfg.seed));
      let cv = Math.round(s * (k / 2 + 0.9)) + bd;
      if ((((tt + cv + N - 1) % 2) + 2) % 2 !== 0) cv += co > 0 ? 1 : -1;
      const x = (tt + cv + N - 1) / 2, y = x - tt;
      const lo = -Math.floor((k - 1) / 2) + bd, hi = lo + k - 1;
      const behind = co < 0 && cv >= lo && cv <= hi;
      if (!behind) plot(ctx, x, y, ramps.leaf, co > 0 ? 3 : 2);
      if (Math.abs(s) > 0.93 && hash(tt, 9, cfg.seed) > 0.35) {
        const dir = s > 0 ? 1 : -1;
        plot(ctx, x + (dir > 0 ? 1 : 0), y + (dir > 0 ? 0 : -1), ramps.leaf, 4);
        if (S >= 1) plot(ctx, x + (dir > 0 ? 1 : -1), y + (dir > 0 ? 1 : -1), ramps.leaf, 3);
      }
    }
  }
  void item;
}

// ---------- mounts ----------
function drawMount(ctx: Ctx, L: ReturnType<typeof layout>, layerPass: "back" | "front") {
  const { cfg, S, ramps, phase } = ctx;
  const { R, aH, coreA } = L;
  const k = Math.max(1, cfg.thickness);
  const trim = ramps.trim;
  const w = Math.max(1.2, 1.5 * S);
  const m = cfg.mount;
  if (layerPass === "back") {
    if (m === "prongs") {
      for (const s of [-1, 1]) {
        drawPath(ctx, [[aH - R * 1.0, s * (k / 2 + 0.5)], [aH - R * 0.6, s * R * 0.95], [aH + R * 0.1, s * R * 1.12], [aH + R * 0.7, s * R * 0.78], [aH + R * 1.05, s * R * 0.3]], (t) => w * (1.25 - t * 0.55), trim);
        const [bx, by] = toScreen(aH - R * 0.62, s * R * 1.0);
        const br = Math.max(0.8, 1.1 * S);
        fillScreen(ctx, bx, by, br + 1, (dx, dy) => sphereIdx(dx, dy, br), ramps.core, true);
      }
      drawPath(ctx, [[aH - R * 0.6, 0], [aH + R * 1.1, 0]], () => w * 0.8, trim);
    } else if (m === "crown") {
      const a0 = aH - R * 1.15, a1 = aH - R * 0.72;
      fillLocal(ctx, (a0 + a1) / 2, 0, R * 1.3, (u, v) => {
        if (Math.abs(v) > R * 0.95 || u < (a0 - a1) / 2 || u > (a1 - a0) / 2) return -1;
        const rel = (v / (R * 0.95) + 1) / 2;
        return u > (a1 - a0) / 2 - 1 ? 5 : shadeIdx(rel, 5);
      }, trim);
      const spikes = 5;
      for (let i = 0; i < spikes; i++) {
        const bi = (i / (spikes - 1) - 0.5) * 1.7 * R;
        const len = R * (0.9 + 0.5 * (1 - Math.abs(i / (spikes - 1) - 0.5) * 2));
        drawPath(ctx, [[a1, bi], [a1 + len, bi * 1.12]], (t) => Math.max(1, w * 1.3 * (1 - t * 0.7)), trim);
        const [sx, sy] = toScreen(a1 + len + 0.6 * S, bi * 1.12);
        const sr = Math.max(0.7, 0.9 * S);
        fillScreen(ctx, sx, sy, sr + 1, (dx, dy) => sphereIdx(dx, dy, sr), ramps.core, true);
      }
      const [gx, gy] = toScreen((a0 + a1) / 2, -R * 0.5);
      fillScreen(ctx, gx, gy, 2, (dx, dy) => (Math.abs(dx) + Math.abs(dy) <= Math.max(0.8, S) ? 4 : -1), ramps.energy, true);
    } else if (m === "crescent") {
      const Ro = R + 3.2 * S, ca = aH - R * 0.3;
      const ia = ca + Ro * 0.36, Ri = Ro * 0.8;
      const [ocx, ocy] = toScreen(ca, 0);
      fillLocal(ctx, ca, 0, Ro + 1, (u, v) => {
        const d = Math.hypot(u, v);
        if (d > Ro) return -1;
        if (Math.hypot(u + ca - ia, v) < Ri) return -1;
        const [sx, sy] = toScreen(u + ca, v);
        const dx = sx - ocx, dy = sy - ocy, dl = Math.hypot(dx, dy) || 1;
        const l = (dx * LX + dy * LY) / dl;
        return d > Ro - 1.1 ? (l > 0.3 ? 5 : l > -0.3 ? 4 : 2) : l > 0 ? 3 : 2;
      }, trim);
    } else if (m === "fork") {
      const wc = Math.max(1, 1.4 * S);
      drawPath(ctx, [[aH - R, 0], [aH + R + 4 * S, 0]], () => wc, trim);
      const tipA = aH + R + 4 * S;
      fillLocal(ctx, tipA, 0, 4 * S, (u, v) => (u >= -0.2 && u <= 3 * S && Math.abs(v) <= (1.6 * S + 0.6) * (1 - u / (3 * S)) ? (v < 0 ? 4 : 2) : -1), trim);
      for (const s of [-1, 1]) {
        drawPath(ctx, [[aH - R * 1.05, 0], [aH - R * 0.7, s * R * 1.1], [aH + R * 0.5, s * R * 1.3], [aH + R * 1.35, s * R * 1.1]], () => wc, trim);
        fillLocal(ctx, aH + R * 1.35, s * R * 1.1, 4 * S, (u, v) => (u >= -0.2 && u <= 2.4 * S && Math.abs(v - s * 0.3 * S) <= (1.3 * S + 0.5) * (1 - u / (2.4 * S)) ? (v < 0 ? 4 : 2) : -1), trim);
      }
    } else if (m === "ring") {
      const Ri = R + 1.8 * S, Ro = Ri + Math.max(1, 1.7 * S);
      const [cx, cy] = toScreen(coreA, 0);
      fillScreen(ctx, cx, cy, Ro + 1, (dx, dy) => {
        const d = Math.hypot(dx, dy);
        if (d < Ri || d > Ro) return -1;
        const l = (dx * LX + dy * LY) / (d || 1);
        return l > 0.4 ? 5 : l > -0.2 ? 4 : 2;
      }, trim);
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 - Math.PI / 4;
        const ux = Math.cos(ang), uy = Math.sin(ang);
        fillScreen(ctx, cx + ux * (Ro + 1.2 * S), cy + uy * (Ro + 1.2 * S), 3 * S + 1, (dx, dy) => {
          const along = dx * ux + dy * uy, across = dx * -uy + dy * ux;
          return Math.abs(across) <= Math.max(0.6, 1.1 * S * (1 - Math.abs(along) / (2.2 * S + 0.5))) && Math.abs(along) <= 2.2 * S + 0.5 ? (across < 0 ? 4 : 3) : -1;
        }, trim);
      }
      // jingling rings (khakkhara)
      for (const s of [-1, 1]) {
        const sw = Math.sin(phase + s) * 0.6 * S;
        const [rx, ry] = toScreen(aH - R * 0.55 + sw, s * (Ro + 0.2 * S));
        const rr = Math.max(1.4, 1.7 * S);
        fillScreen(ctx, rx, ry + 1.2 * S, rr + 1, (dx, dy) => { const d = Math.hypot(dx, dy); return d <= rr && d >= rr - Math.max(0.9, 0.9 * S) ? (dy < 0 ? 4 : 2) : -1; }, trim);
      }
    } else if (m === "curl") {
      const r0 = R + 2.4 * S;
      const pts: [number, number][] = [[aH - R - 2.5 * S, 0]];
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const phi = Math.PI * 1.05 + t * Math.PI * 1.85;
        const r = r0 * (1 - t * 0.42);
        pts.push([coreA + r * Math.cos(phi), r * Math.sin(phi)]);
      }
      drawPath(ctx, pts, (t) => Math.max(1.1, (k + 0.9) * (1 - t * 0.75)), ramps.shaft);
      for (const t of [0.22, 0.48, 0.7, 0.9]) {
        const phi = Math.PI * 1.05 + t * Math.PI * 1.85, r = r0 * (1 - t * 0.42) + 1.6 * S;
        fillLocal(ctx, coreA + r * Math.cos(phi), r * Math.sin(phi), 3 * S + 1, (u, v) => {
          const e = (u / (2.2 * S + 0.6)) ** 2 + (v / (1.1 * S + 0.5)) ** 2;
          return e <= 1 ? (v < 0 ? 4 : 3) : -1;
        }, ramps.leaf, false, phi);
      }
    } else if (m === "wings") {
      const feathers = [[0.5, 1.9], [0.9, 1.7], [1.3, 1.4], [1.7, 1.05]];
      for (const s of [-1, 1]) {
        for (let i = feathers.length - 1; i >= 0; i--) {
          const [ang, lf] = feathers[i];
          const Lf = lf * R + 2 * S, wf = 0.9 * S + 0.22 * R;
          const ba = aH - R * 0.35, bb = s * R * 0.65;
          const ca = ba + Math.cos(ang) * Lf / 2, cb = bb + s * Math.sin(ang) * Lf / 2;
          fillLocal(ctx, ca, cb, Lf, (u, v) => {
            const e = (u / (Lf / 2)) ** 2 + (v / wf) ** 2;
            if (e > 1) return -1;
            const side = v * s;
            return u > Lf * 0.3 && side < 0 ? 5 : side > wf * 0.35 ? 2 : i === 0 ? 4 : 3;
          }, ramps.feather, false, s * ang);
        }
        drawPath(ctx, [[aH - R * 0.9, 0], [aH - R * 0.35, s * R * 0.65]], () => Math.max(1.2, 1.4 * S), trim);
      }
    } else if (m === "antler") {
      const bone = ramps.bone;
      for (const s of [-1, 1]) {
        const beam: [number, number][] = [];
        for (let i = 0; i <= 14; i++) {
          const t = i / 14;
          beam.push([aH - R * 0.9 + t * (R * 1.7 + 6 * S), s * (R * 0.35 + Math.pow(t, 1.35) * (R * 0.85 + 5 * S))]);
        }
        drawPath(ctx, beam, (t) => Math.max(1, w * 1.15 * (1 - t * 0.62)), bone);
        for (let ti = 0; ti < 3; ti++) {
          const t = 0.28 + ti * 0.26;
          const bx = aH - R * 0.9 + t * (R * 1.7 + 6 * S), by = s * (R * 0.35 + Math.pow(t, 1.35) * (R * 0.85 + 5 * S));
          drawPath(ctx, [[bx, by], [bx + (2.4 - ti * 0.4) * S, by + s * (2.8 + ti * 0.5) * S]], (u) => Math.max(1, w * 0.7 * (1 - u)), bone);
        }
      }
      drawPath(ctx, [[aH - R * 0.95, 0], [aH - R * 0.3, 0]], () => k + 2, trim);
    } else if (m === "serpent") {
      const sc = makeRamp("#3f8f5a", 1.05);
      for (const s of [-1, 1]) {
        const pts: [number, number][] = [];
        for (let i = 0; i <= 26; i++) {
          const t = i / 26;
          const a = aH - R * 2.6 + t * (R * 2.9 + 3 * S);
          const b = s * (Math.sin(t * Math.PI * 2.2) * (R * 0.62 + 1.6 * S) + R * 0.25);
          pts.push([a, b]);
        }
        drawPath(ctx, pts, (t) => Math.max(1, w * 1.05 * (0.55 + 0.45 * Math.sin(t * Math.PI))), sc, false, "back", s > 0 ? 1 : 0.85);
      }
    } else if (m === "lantern") {
      const top = coreA + R * 0.95, bot = coreA - R * 1.15, wid = R * 0.95 + 1.5 * S;
      drawPath(ctx, [[aH + 1.5 * S, 0], [top + 2.5 * S, 0]], () => Math.max(1, 1.4 * S), trim);
      fillLocal(ctx, top + 2.5 * S, 0, wid * 2, (u, v) => (Math.abs(v) <= wid && Math.abs(u) <= Math.max(0.5, 0.8 * S) ? (v < 0 ? 5 : 2) : -1), trim);
      fillLocal(ctx, bot - 1.5 * S, 0, wid * 2, (u, v) => (Math.abs(v) <= wid * 0.8 && Math.abs(u) <= Math.max(0.5, 0.8 * S) ? (v < 0 ? 4 : 1) : -1), trim);
      for (const s of [-1, 1]) drawPath(ctx, [[top + 2.5 * S, s * wid], [bot - 1.5 * S, s * wid * 0.8]], () => Math.max(0.8, 0.8 * S), trim, false, "back", s > 0 ? 1 : 0.7);
      drawPath(ctx, [[top + 2.5 * S, 0], [top + 4.5 * S, 0]], () => Math.max(1, 1.2 * S), trim);
      const [rx, ry] = toScreen(top + 5.2 * S, 0);
      fillScreen(ctx, rx, ry, 3 * S + 1, (dx, dy) => (Math.abs(dx) < Math.max(0.7, 1.1 * S) && dy > -Math.max(0.7, 1.1 * S) && dy < 0 ? 4 : Math.hypot(dx, dy) < Math.max(0.7, 1.1 * S) && dy >= 0 ? 3 : -1), trim);
    } else if (m === "scythe") {
      const blade: [number, number][] = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        blade.push([aH + R * 0.4 + Math.sin(t * Math.PI * 0.85) * (R * 1.5 + 3 * S), R * 0.4 + t * (R * 1.9 + 2 * S)]);
      }
      drawPath(ctx, blade, (t) => Math.max(1, w * 1.5 * (1 - t * 0.75)), ramps.iron);
      drawPath(ctx, [[aH - R * 0.5, 0], [aH + R * 0.6, R * 0.35]], () => k + 2, trim);
    } else if (m === "book") {
      const ba = coreA - R * 0.1, bw = R * 1.35 + 2 * S, bh = R * 0.5;
      for (const s of [-1, 1]) {
        fillLocal(ctx, ba, s * bw * 0.5, bw, (u, v) => {
          if (u < -bh || u > bh || Math.abs(v) > bw * 0.5) return -1;
          const page = Math.abs(v) / (bw * 0.5);
          if (page > 0.88) return 1;
          if (Math.abs(u) > bh * 0.82) return s < 0 ? 3 : 2;
          return (Math.floor((v + bw) / Math.max(1.2, 1.4 * S)) % 2 === 0) ? 5 : 4;
        }, ramps.paper, false, s * 0.18);
      }
      fillLocal(ctx, ba - bh * 0.95, 0, bw, (u, v) => (Math.abs(u) < Math.max(0.6, 0.9 * S) && Math.abs(v) < bw * 0.35 ? 2 : -1), makeRamp("#6b3a2a", 1));
    } else if (m === "chain") {
      for (const s of [-1, 1]) {
        const links = 5;
        for (let i = 0; i < links; i++) {
          const t = i / links;
          const la = aH + R * 0.9 - t * (R * 0.4), lb = s * (R * 0.5 + t * (R * 0.9 + 2 * S));
          const rr = Math.max(0.8, 1.05 * S), vert = i % 2 === 0;
          const [lx, ly] = toScreen(la, lb);
          fillScreen(ctx, lx, ly, rr + 1, (dx, dy) => {
            const e = Math.sqrt((dx / (vert ? rr * 0.62 : rr)) ** 2 + (dy / (vert ? rr : rr * 0.62)) ** 2);
            return Math.abs(e - 1) * rr * 0.6 > Math.max(0.4, 0.45 * S) ? -1 : dy < 0 ? 4 : 2;
          }, ramps.iron);
        }
      }
      drawPath(ctx, [[aH + R * 0.6, -R * 0.4], [aH - R * 0.2, 0], [aH + R * 0.6, R * 0.4]], () => Math.max(1, 1.3 * S), trim);
    } else if (m === "claw") {
      for (const s of [-1, 0, 1]) {
        const pts: [number, number][] = [[aH - R * 0.8, s * R * 0.3]];
        for (let i = 1; i <= 8; i++) {
          const t = i / 8;
          pts.push([aH - R * 0.8 + t * (R * 1.5), s * (R * 0.3 + Math.pow(t, 1.5) * R * 0.95 * (s === 0 ? 0.35 : 1))]);
        }
        drawPath(ctx, pts, (t) => Math.max(0.9, w * 1.1 * (1 - t * 0.8)), trim);
      }
    } else if (m === "hourglass") {
      const hw = R * 0.95 + 1.5 * S, th = Math.max(0.7, 1 * S);
      for (const s of [-1, 1]) {
        fillLocal(ctx, coreA + s * (R * 1.05 + th), 0, hw * 2, (u, v) => (Math.abs(v) <= hw && Math.abs(u) <= th ? (v < 0 ? 5 : 2) : -1), trim);
        drawPath(ctx, [[coreA + s * (R * 1.05), -hw * 0.9], [coreA + s * (R * 1.05), hw * 0.9]], () => th * 1.6, trim);
      }
      for (const s of [-1, 1]) drawPath(ctx, [[coreA - R * 1.1, s * hw * 0.85], [coreA + R * 1.1, s * hw * 0.85]], () => th * 1.3, trim, false, "back", 0.8);
    } else if (m === "arch") {
      const Ra = R * 1.5 + 3 * S, th = Math.max(0.8, 1.1 * S);
      const [ax, ay] = toScreen(coreA - R * 0.5, 0);
      fillScreen(ctx, ax, ay, Ra + 2, (dx, dy) => {
        const d = Math.hypot(dx, dy);
        if (d < Ra - th || d > Ra) return -1;
        if (dy > 0.5) return -1;
        const l = (dx * LX + dy * LY) / (d || 1);
        return l > 0.45 ? 5 : l > 0 ? 4 : 2;
      }, trim);
      const [fx2, fy2] = toScreen(coreA - R * 0.5 - Ra - 1.5 * S, 0);
      fillScreen(ctx, fx2, fy2, 3 * S + 1, (dx, dy) => sphereIdx(dx, dy, Math.max(0.9, 1.5 * S)), ramps.core, true);
    } else if (m === "lotus") {
      // Multi-layered blooming lotus cradle with golden trim tips
      const petalRamp = makeRamp(cfg.coreColor, 1.05);
      for (const s of [-1, 1]) {
        for (const [ang, lenMul, widMul] of [[0.45, 1.15, 0.42], [0.85, 1.35, 0.48], [1.28, 1.05, 0.38]] as const) {
          const Lf = R * lenMul + 2.2 * S, wf = R * widMul + 0.8 * S;
          const ba = aH - R * 0.65, bb = s * R * 0.25;
          const ca = ba + Math.cos(ang) * (Lf * 0.48), cb = bb + s * Math.sin(ang) * (Lf * 0.48);
          fillLocal(ctx, ca, cb, Lf, (u, v) => {
            const prog = (u + Lf * 0.5) / Lf;
            if (prog < 0 || prog > 1) return -1;
            const halfW = wf * Math.sin(prog * Math.PI) * (1 - prog * 0.15);
            if (Math.abs(v) > halfW) return -1;
            if (prog > 0.82 || Math.abs(v) > halfW * 0.78) return 5;
            return v * s < 0 ? 4 : 3;
          }, petalRamp, true, s * ang);
        }
      }
      drawPath(ctx, [[aH - R * 0.9, -R * 0.65], [aH - R * 0.7, 0], [aH - R * 0.9, R * 0.65]], () => Math.max(1.1, 1.4 * S), trim);
    } else if (m === "astrolabe") {
      // Intersecting armillary sphere rings + cardinal finials
      const Ro = R + 3.2 * S, th = Math.max(0.75, 1.1 * S);
      const [cx, cy] = toScreen(coreA, 0);
      fillScreen(ctx, cx, cy, Ro + 2, (dx, dy) => {
        const d = Math.hypot(dx, dy);
        const e1 = Math.abs(d - Ro) <= th;
        const e2 = Math.abs(Math.hypot(dx * 1.45, dy * 0.78) - Ro * 0.92) <= th * 0.85;
        if (!e1 && !e2) return -1;
        const l = (dx * LX + dy * LY) / (d || 1);
        return l > 0.35 ? 5 : l > -0.2 ? 4 : 2;
      }, trim);
      for (const s of [-1, 1]) {
        const [px, py] = toScreen(coreA, s * (Ro + 1.4 * S));
        fillScreen(ctx, px, py, 2.5 * S + 1, (dx, dy) => sphereIdx(dx, dy, Math.max(0.8, 1.15 * S)), ramps.core, true);
      }
    } else if (m === "tiara") {
      // Graceful filigree tiara cradle with pearled arches
      for (const s of [-1, 1]) {
        const pts: [number, number][] = [];
        for (let i = 0; i <= 16; i++) {
          const t = i / 16;
          pts.push([aH - R * 0.85 + Math.sin(t * Math.PI * 0.88) * (R * 1.65 + 1.8 * S), s * (R * 0.2 + Math.sin(t * Math.PI * 0.95) * (R * 1.05 + 1.5 * S))]);
        }
        drawPath(ctx, pts, (t) => Math.max(0.85, w * (1.15 - t * 0.45)), trim);
        const [gx, gy] = toScreen(aH + R * 0.72, s * (R * 0.85 + 1.1 * S));
        fillScreen(ctx, gx, gy, 2.5 * S, (dx, dy) => sphereIdx(dx, dy, Math.max(0.75, 1.05 * S)), ramps.energy, true);
      }
      drawPath(ctx, [[aH - R * 0.85, 0], [aH + R * 1.25 + 1.8 * S, 0]], (t) => Math.max(0.8, w * (1.1 - t * 0.5)), trim);
    } else if (m === "lyre") {
      // Swan-necked lyre frame with golden harmonic strings behind the core
      const H = R * 1.35 + 2.2 * S, W = R * 1.05 + 1.8 * S;
      for (const s of [-1, 1]) {
        const pts: [number, number][] = [];
        for (let i = 0; i <= 18; i++) {
          const t = i / 18;
          const u = -H * 0.75 + t * H * 1.65;
          const v = s * (W * Math.sin(t * Math.PI * 0.92) + (t > 0.75 ? (t - 0.75) * W * 1.1 : 0));
          pts.push([coreA + u, v]);
        }
        drawPath(ctx, pts, (t) => Math.max(0.9, w * (1.18 - t * 0.35)), trim);
      }
      for (const sb of [-0.45, 0, 0.45]) {
        drawPath(ctx, [[coreA - H * 0.65, sb * W], [coreA + H * 0.78, sb * W]], () => Math.max(0.5, 0.55 * S), ramps.energy, true, "back", 0.65);
      }
    } else if (m === "coralCrown") {
      // Branching coral fingers cradling the core
      for (const s of [-1, 1]) {
        for (let b = 0; b < 3; b++) {
          const spread = (b - 1) * (R * 0.5 + S);
          drawPath(ctx, [[aH - R * 0.7, s * R * 0.4], [aH + R * 0.1, s * (R * 0.75 + S) + spread * 0.3], [aH + R * 0.85, s * (R * 0.6 + S * 1.4) + spread * 0.55]], (t) => Math.max(0.8, w * (1.05 - t * 0.6)), ramps.core, true);
          const [tx, ty] = toScreen(aH + R * 0.85, s * (R * 0.6 + S * 1.4) + spread * 0.55);
          fillScreen(ctx, tx, ty, 1.6 * S + 0.5, (dx, dy) => sphereIdx(dx, dy, Math.max(0.7, 0.95 * S)), ramps.energy, true);
        }
      }
    } else if (m === "trident") {
      // Three slim vanilla-style prongs, center longest
      const wc = Math.max(1, 1.25 * S);
      drawPath(ctx, [[aH - R * 0.8, 0], [aH + R * 1.5, 0]], () => wc, trim);
      fillLocal(ctx, aH + R * 1.5, 0, 3.5 * S, (u, v) => (u >= -0.2 && u <= 2.6 * S && Math.abs(v) <= (1.1 * S + 0.4) * (1 - u / (2.6 * S)) ? (v < 0 ? 5 : 3) : -1), trim);
      for (const s of [-1, 1]) {
        drawPath(ctx, [[aH - R * 0.8, 0], [aH - R * 0.2, s * R * 0.9], [aH + R * 1.0, s * R * 0.95]], () => wc * 0.9, trim);
        fillLocal(ctx, aH + R * 1.0, s * R * 0.95, 3 * S, (u, v) => (u >= -0.2 && u <= 2 * S && Math.abs(v) <= (0.9 * S + 0.4) * (1 - u / (2 * S)) ? (v < 0 ? 5 : 3) : -1), trim);
      }
    } else if (m === "collar") {
      // Single honest metal collar: the vanilla workhorse mount
      fillLocal(ctx, aH - R * 0.45, 0, R + 2 * S, (u, v) => {
        if (Math.abs(v) > R * 0.62 + 1.6 * S || Math.abs(u) > 1.5 * S + 0.4) return -1;
        if (u > 0.9 * S) return 5;
        if (u < -0.9 * S) return 1;
        return v < 0 ? 4 : 2;
      }, trim);
    } else if (m === "tinyCollar") {
      // One-pixel collar ring for 1px vanilla shafts
      fillLocal(ctx, aH - R * 0.4, 0, R + 2 * S, (u, v) => {
        if (Math.abs(v) > R * 0.5 + 1.1 * S || Math.abs(u) > Math.max(0.55, 0.8 * S)) return -1;
        return v < 0 ? 5 : 3;
      }, trim);
    } else if (m === "guard") {
      // Small sword crossguard + grip collar
      fillLocal(ctx, aH - R * 0.55, 0, R * 1.6, (u, v) => {
        if (Math.abs(v) > R * 0.95 + S || Math.abs(u) > Math.max(0.6, 0.85 * S)) return -1;
        const cap = Math.abs(v) > R * 0.95 + S - Math.max(0.8, S);
        if (cap) return 5;
        return u > 0 ? 4 : 2;
      }, trim);
      drawPath(ctx, [[aH - R * 1.1, 0], [aH - R * 0.5, 0]], () => Math.max(1.2, k + 1), trim);
    } else if (m === "microRing") {
      // Hairline ring floating around the core base
      const [mcx, mcy] = toScreen(coreA - R * 0.35, 0);
      const rr = R * 0.95 + 1.4 * S;
      fillScreen(ctx, mcx, mcy, rr + 1.5, (dx, dy) => {
        const d = Math.hypot(dx, dy * 1.5);
        if (Math.abs(d - rr) > Math.max(0.4, 0.45 * S)) return -1;
        return dx * LX + dy * LY > 0 ? 4 : 2;
      }, trim);
    } else if (m === "tipCap") {
      // Tiny cap hugging the shaft tip, vanilla-style
      fillLocal(ctx, aH - R * 0.25, 0, R + S, (u, v) => {
        if (Math.abs(v) > k / 2 + 1.1 * S || u < -1.6 * S || u > 0.9 * S) return -1;
        if (u > 0.3 * S) return 5;
        return v < 0 ? 4 : 2;
      }, trim);
    }
  } else {
    if (m === "cage") {
      const A = R + 1.4 * S;
      for (const f of [1, 0.42]) {
        const B = A * f, wth = Math.max(0.55, 0.7 * S);
        fillLocal(ctx, coreA, 0, A + 2, (u, v) => {
          if (u < -A * 0.72) return -1;
          const e = Math.sqrt((u / A) ** 2 + (v / Math.max(B, 0.8)) ** 2);
          if (Math.abs(e - 1) * Math.min(A, Math.max(B, 1.5)) > wth) return -1;
          return v < 0 ? 5 : 3;
        }, trim);
      }
      drawPath(ctx, [[coreA + A - 0.5, 0], [coreA + A + 2.5 * S, 0]], (t) => Math.max(1, 2 * S * (1 - t)), trim);
      const [fx, fy] = toScreen(coreA + A + 0.5 * S, 0);
      const fr = Math.max(0.8, 1.1 * S);
      fillScreen(ctx, fx, fy, fr + 1, (dx, dy) => sphereIdx(dx, dy, fr), ramps.core, true);
    }
    if (m === "prongs") {
      // claw tips wrap in front of the gem
      for (const s of [-1, 1]) drawPath(ctx, [[aH + R * 0.7, s * R * 0.78], [aH + R * 1.05, s * R * 0.3]], () => Math.max(1, w * 0.7), trim);
    }
  }
}

// ---------- cores ----------
function drawCrystal(ctx: Ctx, ca: number, cb: number, R: number, scale: number, rot: number, rampOverride?: Ramp) {
  // Octahedral gem: crown (top), pavilion (bottom), girdle, table facet, side facets, fresnel rim.
  const Rt = R * 0.56 * scale;         // half-girdle (widest radius perpendicular to shaft)
  const Hc = R * 0.72 * scale;        // crown height
  const Hp = R * 0.7 * scale;         // pavilion height
  const tableW = R * 0.3 * scale;     // table facet half-width
  const tableH = R * 0.18 * scale;    // table depth along axis
  const culetOff = R * 0.08 * scale;  // tiny culet on bottom
  fillLocal(ctx, ca, cb, Math.max(Hc, Hp) * 1.2, (u, v) => {
    // bounds
    if (u > Hc || u < -Hp) return -1;
    const isCrown = u > 0;
    const halfW = isCrown
      ? Rt * (1 - (u / Hc) * 0.52)      // crown tapers gently
      : Rt * (1 + (u / Hp) * 0.25);    // pavilion tapers sharply to a point
    if (Math.abs(v) > halfW + 0.35) return -1;
    const side = v < 0 ? -1 : 1;
    const vN = v / halfW;

    // Girdle shadow/light band where crown meets pavilion
    if (!isCrown && u > -Hp * 0.08 && Math.abs(vN) > 0.2) return 1;
    if (isCrown && u < Hc * 0.1 && side === 1 && Math.abs(vN) > 0.55) return 2;
    if (isCrown && u < Hc * 0.1 && side === -1 && Math.abs(vN) > 0.5) return 4;

    // Table facet (flat top catching light)
    if (isCrown && u > Hc - tableH && Math.abs(v) < tableW) {
      const grad = (u - (Hc - tableH)) / tableH;
      if (grad > 0.45 && v < -tableW * 0.25) return 5;
      return 4;
    }

    // Pavilion culet highlight (tiny point of light)
    if (!isCrown && u < -Hp * 0.85 && Math.abs(v) < culetOff) return 5;

    // Facet shading: top-left facet (side=-1 in crown) catches most light
    if (isCrown) {
      if (side === -1) {
        if (vN < -0.4) return vN < -0.75 ? 5 : 4;
        return 3;
      } else {
        if (vN > 0.6) return 1;
        return 2;
      }
    } else {
      if (side === -1) return Math.max(1, (vN < -0.5 ? 3 : 2));
      return vN > 0.6 ? 0 : 1;
    }
  }, rampOverride ?? ctx.ramps.core, true, rot);
}

function drawCore(ctx: Ctx, L: ReturnType<typeof layout>) {
  const { cfg, ramps, phase, S } = ctx;
  const { R, coreA } = L;
  const [cx, cy] = toScreen(coreA, 0);
  const core = ramps.core;
  switch (cfg.core) {
    case "crystal": drawCrystal(ctx, coreA, 0, R, 1, 0); break;
    case "cluster":
      drawCrystal(ctx, coreA - R * 0.35, -R * 0.55, R, 0.62, -0.6);
      drawCrystal(ctx, coreA - R * 0.35, R * 0.55, R, 0.62, 0.6);
      drawCrystal(ctx, coreA, 0, R, 0.95, 0);
      break;
    case "orb": {
      const r = R * 0.88;
      fillScreen(ctx, cx, cy, r + 1, (dx, dy) => {
        let i = sphereIdx(dx, dy, r);
        if (i < 0) return -1;
        // top-left fresnel rim for a glassy gem feel
        const edge = 1 - Math.hypot(dx, dy) / r;
        const ang = Math.atan2(dy, dx);
        const rim = Math.max(0, -Math.cos(ang + Math.atan2(LY, LX))) * (1 - edge) * 1.8;
        if (rim > 0.55 && edge < 0.22) i = Math.min(5, i + 2);
        const d = Math.hypot(dx, dy) / r;
        if (i < 5 && Math.sin(ang * 2 + d * 5 - phase) > 0.82 && d < 0.85) i = Math.min(5, i + 1);
        return i;
      }, core, true);
      break;
    }
    case "prism": {
      const W = R * 0.78, H = R * 1.3;
      fillLocal(ctx, coreA, 0, H + 1, (u, v) => {
        const d = Math.abs(v) / W + Math.abs(u) / H;
        if (d > 1.02) return -1;
        if (d < 0.42) return v < 0 && u > 0 && d < 0.3 ? 5 : 4;
        if (v < 0) return u > 0 ? 4 : 3;
        return u > 0 ? 3 : 2;
      }, core, true);
      break;
    }
    case "star": {
      const Ro = R * 1.05, Ri = Ro * 0.45;
      const verts: [number, number][] = [];
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI) / 5 + phase * 0 ;
        const r = i % 2 === 0 ? Ro : Ri;
        verts.push([Math.cos(ang) * r, Math.sin(ang) * r]);
      }
      fillScreen(ctx, cx, cy, Ro + 1, (dx, dy) => {
        let inside = false;
        for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
          const [xi, yi] = verts[i], [xj, yj] = verts[j];
          if ((yi > dy) !== (yj > dy) && dx < ((xj - xi) * (dy - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (!inside) return -1;
        const ang = Math.atan2(dy, dx) + Math.PI / 2;
        const seg = ((ang % (Math.PI * 2 / 5)) + Math.PI * 2) % (Math.PI * 2 / 5) - Math.PI / 5;
        const l = -(dx * 0.6 + dy * 0.8) / Ro;
        let idx = l > 0.3 ? 5 : l > -0.05 ? 4 : l > -0.4 ? 3 : 2;
        if (seg < 0 && idx < 5) idx += 0; else idx = Math.max(2, idx - 1);
        if (Math.hypot(dx, dy) < Ri * 0.7) idx = 5;
        return idx;
      }, core, true);
      break;
    }
    case "skull": {
      const bone = makeRamp("#e6dfc8", 1);
      const ecy = cy - R * 0.05;
      fillScreen(ctx, cx, ecy, R + 1, (dx, dy) => {
        const cran = Math.hypot(dx, dy + R * 0.2) <= R * 0.85;
        const jaw = Math.abs(dx) <= R * 0.55 && dy >= R * 0.2 && dy <= R * 0.88;
        if (!cran && !jaw) return -1;
        if (jaw && !cran) {
          if (Math.abs(dy - R * 0.62) < 0.5 || (dy > R * 0.62 && Math.abs((dx / Math.max(1, R * 0.22)) % 1) < 0.18)) return 1;
          return dx < 0 ? 3 : 2;
        }
        if (Math.abs(dx) < R * 0.13 && dy > R * 0.28 && dy < R * 0.48) return 1;
        const i = sphereIdx(dx, dy + R * 0.2, R * 0.85);
        return Math.max(2, i);
      }, bone);
      for (const s of [-1, 1]) {
        const er = Math.max(0.9, R * 0.25);
        fillScreen(ctx, cx + s * R * 0.35, ecy + R * 0.08, er + 1, (dx, dy) => {
          const d = Math.hypot(dx, dy);
          if (d > er) return -1;
          return d < er * 0.45 ? 5 : 3;
        }, ramps.energy, true);
      }
      break;
    }
    case "eye": {
      const Rx = R, Ry = R * 0.62;
      fillScreen(ctx, cx, cy, R + 1, (dx, dy) => {
        if (Math.abs(dx) > Rx) return -1;
        const lim = Ry * (1 - (dx / Rx) ** 2);
        if (Math.abs(dy) > lim + 0.3) return -1;
        return dy < 0 ? 4 : 3;
      }, ramps.sclera);
      const ir = R * 0.47, look = Math.sin(phase) * R * 0.18;
      fillScreen(ctx, cx + look, cy, ir + 1, (dx, dy) => {
        if (Math.abs(dx + look) > Rx) return -1;
        const i = sphereIdx(dx, dy, ir);
        if (i < 0) return -1;
        if (Math.abs(dx) < Math.max(0.5, ir * 0.22) && Math.abs(dy) < ir * 0.8) return 0;
        return i;
      }, core, true);
      break;
    }
    case "flame": {
      const r = R * 0.7;
      fillScreen(ctx, cx, cy - R * 0.4, R * 2, (dx, dy) => {
        dy += R * 0.4;
        const sway = Math.sin(dy * 0.45 / ctx.S - phase * 2) * 0.22 * R * Math.max(0, -dy / R);
        const inBall = Math.hypot(dx, dy - R * 0.1) <= r;
        const topH = R * 1.75;
        const prog = (dy + topH) / (topH + R * 0.1);
        const inTongue = dy < R * 0.1 && dy > -topH && Math.abs(dx - sway) <= r * Math.pow(Math.max(0, prog), 1.3);
        if (!inBall && !inTongue) return -1;
        const d = Math.hypot(dx - sway * 0.5, (dy - R * 0.05) * 0.55) / r;
        return d < 0.35 ? 5 : d < 0.65 ? 4 : d < 0.9 ? 3 : 2;
      }, core, true);
      break;
    }
    case "lantern": {
      const w = R * 0.85, h = R * 1.05;
      fillScreen(ctx, cx, cy, R * 1.6, (dx, dy) => {
        if (Math.abs(dx) > w || Math.abs(dy) > h) return -1;
        const edge = Math.abs(dx) > w - Math.max(0.8, 0.9 * S) || Math.abs(dy) > h - Math.max(0.8, 0.9 * S);
        if (edge) return dy < 0 ? 4 : 2;
        const fy = dy + Math.sin(phase * 2 + dx * 0.3) * 0.6 * S;
        const fd = Math.hypot(dx * 1.25, fy) / (w * 0.72);
        return fd < 0.35 ? 5 : fd < 0.7 ? 4 : 3;
      }, core, true);
      fillScreen(ctx, cx, cy - h - 1.2 * S, w + 2, (dx, dy) => (Math.abs(dx) < w * 0.5 && Math.abs(dy) < Math.max(0.7, 0.9 * S) ? 4 : -1), ramps.trim);
      break;
    }
    case "book": {
      const bw = R * 1.05, bh = R * 1.25;
      fillScreen(ctx, cx, cy, R * 1.6, (dx, dy) => {
        if (Math.abs(dx) > bw || Math.abs(dy) > bh) return -1;
        if (dx < -bw + Math.max(1, 1.4 * S)) return dx < -bw + Math.max(0.6, 0.8 * S) ? 1 : 3;
        if (Math.abs(dy) > bh - Math.max(0.8, S)) return dy < 0 ? 5 : 2;
        return 4;
      }, makeRamp("#6d3a2c", 1));
      fillScreen(ctx, cx + 1.2 * S, cy, bw, (dx, dy) => {
        if (Math.abs(dx) > bw * 0.78 || Math.abs(dy) > bh * 0.82) return -1;
        return Math.floor((dy + bh) / Math.max(1.3, 1.5 * S)) % 2 === 0 ? 5 : 4;
      }, ramps.paper);
      const gr = Math.max(0.8, R * 0.24);
      fillScreen(ctx, cx + 1.2 * S, cy, gr + 1, (dx, dy) => sphereIdx(dx, dy, gr), core, true);
      break;
    }
    case "hourglass": {
      const hw = R * 0.85, hh = R * 1.2;
      fillScreen(ctx, cx, cy, R * 1.7, (dx, dy) => {
        const t = (dy + hh) / (2 * hh);
        if (t < 0 || t > 1) return -1;
        const half = Math.abs(dy) / hh;
        if (Math.abs(dx) > hw * half + 0.4) return -1;
        const glass = Math.abs(dx) > hw * half - Math.max(0.7, 0.8 * S);
        if (glass) return dx < 0 ? 4 : 2;
        const sandTop = dy < 0 && Math.abs(dx) < hw * (-dy / hh) * 0.72;
        const sandBot = dy > 0 && Math.abs(dx) < hw * (dy / hh) * 0.8;
        if (sandTop || sandBot) return 4;
        if (Math.abs(dx) < Math.max(0.4, 0.45 * S) && dy > -hh * 0.2) return 5;
        return -1;
      }, core, true);
      for (const s of [-1, 1]) fillScreen(ctx, cx, cy + s * (hh + 1 * S), hw + 2, (dx, dy) => (Math.abs(dx) <= hw && Math.abs(dy) <= Math.max(0.7, 0.9 * S) ? (dy < 0 ? 5 : 2) : -1), ramps.trim);
      break;
    }
    case "sun": {
      const rd = R * 0.72;
      const rays = 12;
      fillScreen(ctx, cx, cy, R * 1.7, (dx, dy) => {
        const d = Math.hypot(dx, dy);
        if (d <= rd) return d < rd * 0.45 ? 5 : sphereIdx(dx, dy, rd * 1.4);
        const ang = Math.atan2(dy, dx) + phase * 0.4;
        const seg = ((ang % ((Math.PI * 2) / rays)) + (Math.PI * 2)) % ((Math.PI * 2) / rays);
        const tip = rd + R * (0.55 + 0.2 * Math.sin(phase * 2));
        if (seg < 0.16 || seg > (Math.PI * 2) / rays - 0.16) {
          if (d < tip) return d > tip - Math.max(1, S) ? 5 : 4;
        }
        return -1;
      }, core, true);
      break;
    }
    case "moon": {
      const Ro = R * 1.0, Ri = Ro * 0.78;
      const off = Ro * 0.42 + Math.sin(phase) * 0.4 * S;
      fillScreen(ctx, cx, cy, Ro + 1, (dx, dy) => {
        const d = Math.hypot(dx, dy);
        if (d > Ro) return -1;
        if (Math.hypot(dx - off, dy + off * 0.25) < Ri) return -1;
        const l = (dx * LX + dy * LY) / (d || 1);
        return l > 0.5 ? 5 : l > 0.05 ? 4 : l > -0.4 ? 3 : 2;
      }, core, true);
      break;
    }
    case "heart": {
      const hr = R * 0.95;
      fillScreen(ctx, cx, cy, hr * 1.8, (dx, dy) => {
        const nx = dx / hr, ny = (dy + hr * 0.1) / hr;
        const v = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny;
        if (v > 0) return -1;
        const l = (-0.6 * nx - 0.8 * ny);
        return l > 0.55 ? 5 : l > 0.15 ? 4 : l > -0.25 ? 3 : 2;
      }, core, true);
      break;
    }
    case "diamond": {
      const Rt = R * 0.95, Hc = R * 0.62, Hp = R * 1.15;
      fillScreen(ctx, cx, cy - R * 0.1, R * 1.9, (dx, dy) => {
        dy += R * 0.1;
        if (dy < -Hc || dy > Hp) return -1;
        const isTop = dy < 0;
        const halfW = isTop ? Rt : Rt * (1 - dy / Hp);
        if (Math.abs(dx) > halfW) return -1;
        if (isTop) {
          if (Math.abs(dx) < Rt * 0.42 && dy > -Hc * 0.55) return 5;
          return dx < 0 ? 4 : 3;
        }
        const f = Math.abs(dx) / Math.max(0.2, halfW);
        return f < 0.25 ? 5 : f < 0.6 ? (dx < 0 ? 4 : 3) : dx < 0 ? 3 : 1;
      }, core, true);
      break;
    }
    case "serpenthead": {
      const hw = R * 0.85, hl = R * 1.25;
      fillScreen(ctx, cx, cy, R * 1.8, (dx, dy) => {
        const u = -dy, v = dx;
        if (u < -hl * 0.6 || u > hl || Math.abs(v) > hw * (1 - Math.max(0, u) / (hl * 1.5))) return -1;
        if (u > hl * 0.72 && Math.abs(v) < hw * 0.35) return 1;
        return v < 0 ? 4 : v < hw * 0.2 ? 3 : 2;
      }, makeRamp("#3f8f5a", 1.05));
      for (const s of [-1, 1]) fillScreen(ctx, cx + s * R * 0.32, cy - R * 0.35, 2.2 * S, (dx, dy) => (Math.hypot(dx, dy) <= Math.max(0.7, R * 0.16) ? 5 : -1), ramps.energy, true);
      fillScreen(ctx, cx, cy - R * 0.85, 2.5 * S, (dx, dy) => (Math.abs(dx) < Math.max(0.5, R * 0.1) && dy > 0 && dy < Math.max(0.8, R * 0.28) ? 5 : -1), ramps.sclera);
      break;
    }
    case "portal": {
      const Ro = R * 1.05;
      fillScreen(ctx, cx, cy, Ro + 1, (dx, dy) => {
        const d = Math.hypot(dx, dy);
        if (d > Ro) return -1;
        const ang = Math.atan2(dy, dx);
        const swirl = Math.sin(ang * 3 + d * (0.5 / S) - phase * 2);
        if (d < Ro * 0.28) return 5;
        if (swirl > 0.55) return 4;
        if (d > Ro * 0.82) return 1;
        return swirl > -0.2 ? 3 : 2;
      }, core, true);
      break;
    }
    case "totem": {
      const tw = R * 0.8, th = R * 1.3;
      fillScreen(ctx, cx, cy, R * 1.8, (dx, dy) => {
        if (Math.abs(dx) > tw || Math.abs(dy) > th) return -1;
        const edge = Math.abs(dx) > tw - Math.max(0.7, S) || Math.abs(dy) > th - Math.max(0.7, S);
        if (edge) return dx < 0 && dy < 0 ? 4 : 1;
        if (dy < -th * 0.28) {
          if (Math.abs(dx) < tw * 0.62) return 1;
          return 3;
        }
        if (dy > th * 0.1 && dy < th * 0.55 && Math.abs(dx) < tw * 0.5) return Math.abs(dx) < tw * 0.18 ? 1 : 2;
        return dx < 0 ? 4 : 3;
      }, makeRamp("#8a5a33", 1));
      for (const s of [-1, 1]) fillScreen(ctx, cx + s * tw * 0.42, cy - th * 0.42, 2 * S, (dx, dy) => (Math.hypot(dx, dy) <= Math.max(0.7, R * 0.15) ? 5 : -1), ramps.energy, true);
      break;
    }
    case "anvil": {
      const aw = R * 1.25, ah = R * 0.95;
      fillScreen(ctx, cx, cy, R * 1.8, (dx, dy) => {
        const top = dy < -ah * 0.35 && Math.abs(dx) < aw && dy > -ah;
        const horn = dy < -ah * 0.2 && dx > aw * 0.7 && dx < aw * 1.35 && Math.abs(dy + ah * 0.45) < ah * 0.28;
        const waist = dy >= -ah * 0.35 && dy < ah * 0.35 && Math.abs(dx) < aw * 0.42;
        const base = dy >= ah * 0.35 && dy < ah && Math.abs(dx) < aw * 0.82;
        if (!top && !horn && !waist && !base) return -1;
        if (waist) return dx < 0 ? 3 : 1;
        if (base) return dy > ah * 0.8 ? 1 : dx < 0 ? 3 : 2;
        return dy < -ah * 0.75 ? 5 : dx < 0 ? 4 : 3;
      }, ramps.iron);
      break;
    }
    case "shell": {
      // Fan shell: radiating ridges from a hinge point
      const sr = R * 0.95;
      fillScreen(ctx, cx, cy, sr + 1.5, (dx, dy) => {
        const d = Math.hypot(dx, dy - sr * 0.45);
        if (d > sr || dy > sr * 0.62) return -1;
        const ridge = Math.sin(Math.atan2(dy - sr * 0.45, dx) * 7) > 0.25;
        if (d > sr - Math.max(0.8, S)) return 4;
        return ridge ? 5 : dx < 0 ? 4 : 3;
      }, ramps.core, true);
      fillScreen(ctx, cx, cy + sr * 0.5, 2 * S, (dx, dy) => (Math.hypot(dx, dy) <= Math.max(0.7, S * 0.8) ? 2 : -1), ramps.trim);
      break;
    }
    case "conch": {
      // Spiral conch: expanding whorl
      const sr = R * 1.0;
      fillScreen(ctx, cx, cy, sr + 1.5, (dx, dy) => {
        const d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
        if (d > sr) return -1;
        const band = Math.sin(a * 3 + d * (1.1 / Math.max(1, S)) - phase * 0.4);
        if (d > sr - Math.max(0.8, S)) return 2;
        if (band > 0.55) return 5;
        if (band > -0.1) return 4;
        return 3;
      }, ramps.core, true);
      break;
    }
    case "pearl": {
      // Small lustrous pearl with a soft crescent highlight
      const pr = R * 0.72;
      fillScreen(ctx, cx, cy, pr + 1, (dx, dy) => {
        const i = sphereIdx(dx, dy, pr);
        if (i < 0) return -1;
        const d = Math.hypot(dx, dy) / pr;
        if (d > 0.55 && d < 0.85 && dx < 0 && dy < 0.2 * pr) return 5;
        return Math.min(5, i + 1);
      }, ramps.core, true);
      break;
    }
    case "battery": {
      // Riveted power cell with a charge bar that fills with pulse
      const bw = R * 0.72, bh = R * 1.05;
      fillScreen(ctx, cx, cy, R * 1.5, (dx, dy) => {
        if (Math.abs(dx) > bw || Math.abs(dy) > bh) return -1;
        const frame = Math.abs(dx) > bw - Math.max(0.7, 0.8 * S) || Math.abs(dy) > bh - Math.max(0.7, 0.8 * S);
        if (frame) return dy < 0 ? 4 : 2;
        const fill = (dy + bh) / (2 * bh) < 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(phase));
        return fill ? 5 : 1;
      }, ramps.energy, true);
      fillScreen(ctx, cx, cy - bh - 0.9 * S, bw, (dx, dy) => (Math.abs(dx) < bw * 0.4 && Math.abs(dy) < Math.max(0.6, 0.7 * S) ? 4 : -1), ramps.trim);
      break;
    }
    case "compass": {
      // Brass compass face; needle trembles with time
      const cr = R * 0.92;
      fillScreen(ctx, cx, cy, cr + 1.5, (dx, dy) => {
        const d = Math.hypot(dx, dy);
        if (d > cr) return -1;
        if (d > cr - Math.max(0.7, 0.9 * S)) return dx * LX + dy * LY > 0 ? 5 : 2;
        const na = -Math.PI / 2 + Math.sin(phase * 0.7) * 0.5;
        const along = dx * Math.cos(na) + dy * Math.sin(na), across = -dx * Math.sin(na) + dy * Math.cos(na);
        if (Math.abs(across) < Math.max(0.45, 0.5 * S) && Math.abs(along) < cr * 0.72) return along > 0 ? 5 : 1;
        if (d < cr * 0.16) return 5;
        return 3;
      }, ramps.core, true);
      break;
    }
    case "lanternCore": {
      // Caged ember heart
      const lr = R * 0.8;
      fillScreen(ctx, cx, cy, lr + 2, (dx, dy) => {
        const d = Math.hypot(dx, dy);
        if (d > lr) return -1;
        const bars = Math.abs(dx) < Math.max(0.4, 0.45 * S) || Math.abs(dy) < Math.max(0.4, 0.45 * S);
        if (d > lr - Math.max(0.7, 0.8 * S) || bars) return dy < 0 ? 4 : 2;
        const flick = 0.5 + 0.5 * Math.sin(phase * 3 + dx * 0.4);
        return d < lr * (0.4 + flick * 0.2) ? 5 : 4;
      }, ramps.energy, true);
      break;
    }
    case "coralHeart": {
      // Branching coral polyp heart
      const hr = R * 0.9;
      fillScreen(ctx, cx, cy, hr + 1.5, (dx, dy) => {
        const d = Math.hypot(dx, dy);
        if (d > hr) return -1;
        const branch = Math.sin(Math.atan2(dy, dx) * 5 + 0.6) > 0.3 && d > hr * 0.3;
        if (branch) return 5;
        if (d < hr * 0.35) return 4;
        return dx < 0 ? 3 : 2;
      }, ramps.core, true);
      break;
    }
    case "ruby":
    case "sapphire":
    case "emeraldGem": {
      // Small vanilla-tool gem: flat table, beveled pavilion, single glint pixel
      const gemRamp = cfg.core === "ruby" ? ramps.ruby : cfg.core === "sapphire" ? ramps.sapphire : ramps.emerald;
      const gw = R * 0.78, gh = R * 0.95;
      fillScreen(ctx, cx, cy, R * 1.4, (dx, dy) => {
        if (Math.abs(dy) > gh || Math.abs(dx) > gw * (dy < 0 ? 1 : 1 - (dy / gh) * 0.55)) return -1;
        if (dy < -gh * 0.55 && Math.abs(dx) < gw * 0.5) return 5;
        if (dx < -gw * 0.55) return 4;
        if (dx > gw * 0.55) return 1;
        return dy < 0 ? 4 : 3;
      }, gemRamp, true);
      break;
    }
    case "blade":
    case "shortBlade":
    case "holyBlade":
    case "cursedBlade":
    case "prismBlade": {
      // Vanilla-proportioned sword blade along the staff axis
      const len = cfg.core === "shortBlade" ? R * 1.5 : R * 2.05;
      const wid = Math.max(1.1, R * (cfg.core === "shortBlade" ? 0.3 : 0.36));
      const bladeRamp = cfg.core === "holyBlade" ? ramps.holy : cfg.core === "cursedBlade" ? ramps.shadow : ramps.trim;
      const emissive = cfg.core !== "blade" && cfg.core !== "shortBlade";
      fillLocal(ctx, coreA + len * 0.28, 0, len, (u, v) => {
        const t = (u + len * 0.45) / len;
        if (t < 0 || t > 1) return -1;
        const halfW = wid * (t > 0.82 ? (1 - t) / 0.18 : 1) * (1 - t * 0.12);
        if (Math.abs(v) > Math.max(0.5, halfW)) return -1;
        if (cfg.core === "prismBlade") {
          const band = Math.floor(((u / Math.max(1, S)) % 6 + 6) % 6);
          return band < 2 ? 5 : band < 4 ? 4 : 3;
        }
        if (cfg.core === "cursedBlade" && v > halfW * 0.3) return 1;
        if (v < -halfW * 0.45) return 5;
        if (Math.abs(v) < halfW * 0.22) return 4;
        return 3;
      }, cfg.core === "prismBlade" ? ramps.energy : bladeRamp, emissive);
      // fuller groove
      fillLocal(ctx, coreA + len * 0.28, 0, len, (u, v) => {
        const t = (u + len * 0.45) / len;
        if (t < 0.08 || t > 0.72 || Math.abs(v) > Math.max(0.3, wid * 0.2)) return -1;
        return 2;
      }, bladeRamp, false);
      break;
    }
  }
}

// ---------- head composition helpers ----------
type DecorLayer = "back" | "front";

function layerBlend(ctx: Ctx, layer: DecorLayer, sx: number, sy: number, color: RGB, alpha = 1, emissive = false) {
  const x = Math.round(sx + ctx.half), y = Math.round(sy + ctx.half);
  const target = layer === "back" ? ctx.back : ctx.front;
  target.blend(x, y, color, alpha);
  if (emissive && x >= 0 && y >= 0 && x < ctx.N && y < ctx.N) ctx.emitX[y * ctx.N + x] = 1;
}

function layerRing(ctx: Ctx, layer: DecorLayer, sx: number, sy: number, radius: number, thickness: number, ramp: Ramp, alpha = 1, squash = 1, dashed = false) {
  box(ctx, sx, sy, radius + thickness + 2, (x, y, dx, dy) => {
    const d = Math.sqrt(dx * dx + (dy / squash) * (dy / squash));
    if (Math.abs(d - radius) > thickness) return;
    if (dashed && Math.sin(Math.atan2(dy / squash, dx) * 8) < -0.35) return;
    const l = (dx * LX + dy * LY) / (Math.hypot(dx, dy) || 1);
    const idx = l > 0.45 ? 5 : l > -0.1 ? 4 : 2;
    layerBlend(ctx, layer, x - ctx.half, y - ctx.half, ramp[idx], alpha, idx >= 4);
  });
}

function layerOrb(ctx: Ctx, layer: DecorLayer, sx: number, sy: number, radius: number, ramp: Ramp, alpha = 1, emissive = false) {
  box(ctx, sx, sy, radius + 1, (x, y, dx, dy) => {
    const idx = sphereIdx(dx, dy, radius);
    if (idx < 0) return;
    layerBlend(ctx, layer, x - ctx.half, y - ctx.half, ramp[idx], alpha, emissive);
  });
}

function layerDiamond(ctx: Ctx, layer: DecorLayer, sx: number, sy: number, radius: number, ramp: Ramp, alpha = 1, emissive = false, rot = 0) {
  box(ctx, sx, sy, radius + 1, (x, y, dx, dy) => {
    const u = dx * Math.cos(rot) + dy * Math.sin(rot), v = -dx * Math.sin(rot) + dy * Math.cos(rot);
    const d = Math.abs(u) / radius + Math.abs(v) / (radius * 1.35);
    if (d > 1.05) return;
    const idx = d < 0.45 ? 5 : v < 0 ? 4 : u < 0 ? 3 : 2;
    layerBlend(ctx, layer, x - ctx.half, y - ctx.half, ramp[idx], alpha, emissive);
  });
}

function drawGemCut(ctx: Ctx, L: ReturnType<typeof layout>) {
  const { cfg, ramps, phase, S } = ctx;
  if (cfg.core === "none" || cfg.gemCut === "raw") return;
  const [cx, cy] = toScreen(L.coreA, 0);
  const r = Math.max(1.5 * S, L.R * 0.75);
  const put = (x: number, y: number, color: RGB, alpha = 1) => layerBlend(ctx, "front", x, y, color, alpha, true);
  const line = (angle: number, len: number, color: RGB, alpha = 1) => {
    const steps = Math.max(2, Math.round(len));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      put(cx + Math.cos(angle) * (t * len), cy + Math.sin(angle) * (t * len), color, alpha * (1 - t * 0.25));
    }
  };

  switch (cfg.gemCut) {
    case "brilliant": {
      for (let i = 0; i < 6; i++) line(-Math.PI / 2 + (i * Math.PI * 2) / 6, r * 0.9, i % 2 ? ramps.core[4] : ramps.energy[5], 0.65);
      layerOrb(ctx, "front", cx - r * 0.22, cy - r * 0.24, Math.max(0.6, r * 0.2), ramps.energy, 0.9, true);
      break;
    }
    case "emerald": {
      const rr = r * 0.72;
      for (let i = 0; i < 8; i++) {
        const a0 = Math.PI / 8 + (i * Math.PI * 2) / 8;
        const a1 = Math.PI / 8 + ((i + 1) * Math.PI * 2) / 8;
        const steps = Math.max(1, Math.round(rr * 0.8));
        for (let j = 0; j <= steps; j++) put(cx + Math.cos(a0) * rr + (Math.cos(a1) - Math.cos(a0)) * rr * j / steps, cy + Math.sin(a0) * rr + (Math.sin(a1) - Math.sin(a0)) * rr * j / steps, i < 3 ? ramps.energy[5] : ramps.core[2], 0.55);
      }
      layerDiamond(ctx, "front", cx, cy, r * 0.33, ramps.energy, 0.7, true);
      break;
    }
    case "rose": {
      for (let i = 0; i < 8; i++) {
        const a = phase * 0.2 + (i * Math.PI * 2) / 8;
        line(a, r * 0.82, i % 2 ? ramps.core[3] : ramps.energy[5], 0.55);
      }
      layerOrb(ctx, "front", cx, cy, Math.max(0.6, r * 0.16), ramps.energy, 0.9, true);
      break;
    }
    case "teardrop": {
      layerDiamond(ctx, "front", cx, cy + r * 0.08, r * 0.76, ramps.core, 0.65, true, Math.PI / 4);
      put(cx - r * 0.22, cy - r * 0.35, ramps.energy[5], 1);
      break;
    }
    case "rune": {
      const glyph = GLYPHS5[(cfg.seed + Math.round(phase * 3)) % GLYPHS5.length];
      for (let i = 0; i < 25; i++) if (glyph[i] === "1") put(cx + ((i % 5) - 2) * Math.max(1, S), cy + (Math.floor(i / 5) - 2) * Math.max(1, S), ramps.energy[(i % 3) ? 4 : 5], 0.9);
      break;
    }
    case "starcut": {
      const arm = Math.max(2, Math.round(r));
      for (let d = -arm; d <= arm; d++) { put(cx + d, cy, ramps.energy[Math.abs(d) < arm * 0.45 ? 5 : 4], 0.8); put(cx, cy + d, ramps.energy[Math.abs(d) < arm * 0.45 ? 5 : 4], 0.8); }
      line(-Math.PI / 4, r * 0.76, ramps.core[5], 0.75); line(Math.PI * 3 / 4, r * 0.7, ramps.core[4], 0.6);
      break;
    }
    case "cracked": {
      const ang = -0.8 + Math.sin(phase) * 0.12;
      const pts = [[0, 0], [0.25, -0.18], [0.1, -0.45], [0.46, -0.68], [0.32, -0.98]];
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        const steps = Math.max(1, Math.round(r * 0.6));
        for (let j = 0; j <= steps; j++) {
          const px = (x0 + (x1 - x0) * j / steps) * r, py = (y0 + (y1 - y0) * j / steps) * r;
          put(cx + px * Math.cos(ang) - py * Math.sin(ang), cy + px * Math.sin(ang) + py * Math.cos(ang), j % 3 === 0 ? ramps.energy[5] : ramps.dark[0], 0.9);
        }
      }
      break;
    }
    case "caged": {
      layerRing(ctx, "front", cx, cy, r * 0.96, Math.max(0.55, 0.55 * S), ramps.trim, 0.86);
      for (let i = 0; i < 4; i++) line((i * Math.PI) / 2 + phase * 0.1, r * 0.98, ramps.trim[3], 0.75);
      break;
    }
    case "soul": {
      for (let i = 0; i < 4; i++) {
        const a = phase * 1.3 + (i * Math.PI * 2) / 4;
        layerOrb(ctx, "front", cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7, Math.max(0.55, r * 0.16), ramps.energy, 0.8, true);
      }
      layerRing(ctx, "front", cx, cy, r * 0.82, Math.max(0.45, 0.45 * S), ramps.energy, 0.65, 0.9, true);
      break;
    }
  }
}

function drawOrnament(ctx: Ctx, L: ReturnType<typeof layout>, layer: DecorLayer) {
  const { cfg, ramps, S, phase } = ctx;
  if (cfg.ornament === "none") return;
  const { R, coreA } = L;
  const q = cfg.ornamentScale;
  const [cx, cy] = toScreen(coreA, 0);
  const target = layer === "back" ? "back" : "front";
  const path = (pts: [number, number][], width: (t: number) => number, ramp = ramps.trim, em = false, alpha = 1) => drawPath(ctx, pts, width, ramp, em, target, alpha);
  const gem = (a: number, b: number, r: number, alpha = 1) => {
    const [x, y] = toScreen(a, b);
    layerDiamond(ctx, layer, x, y, r, ramps.core, alpha, true);
  };

  // A constellation of small mount gems appears in front, independently of the large ornament silhouette.
  if (layer === "front" && cfg.accentGems > 0) {
    const count = cfg.accentGems;
    for (let i = 0; i < count; i++) {
      const a = coreA - R * 0.62 + Math.sin((i / Math.max(1, count - 1) - 0.5) * Math.PI) * R * 0.2;
      const b = (i / Math.max(1, count - 1) - 0.5) * (R * 1.8 + 2 * S);
      gem(a, b, Math.max(0.55, (0.62 + (i % 2) * 0.14) * S), 0.92);
    }
  }

  if (layer === "back") {
    switch (cfg.ornament) {
      case "runeRing": {
        layerRing(ctx, "back", cx, cy, (R + 3 * S) * q, Math.max(0.45, 0.6 * S), ramps.energy, 0.74, 0.82, true);
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI * 2) / 6 + phase * 0.12;
          const gx = cx + Math.cos(a) * (R + 3 * S) * q, gy = cy + Math.sin(a) * (R + 3 * S) * q * 0.82;
          const g = GLYPHS3[i % GLYPHS3.length];
          for (let j = 0; j < 9; j++) if (g[j] === "1") layerBlend(ctx, "back", gx + (j % 3) - 1, gy + Math.floor(j / 3) - 1, ramps.energy[4], 0.65, true);
        }
        break;
      }
      case "crownJewels": {
        for (const s of [-1, 0, 1]) {
          const b = s * (R * 0.95 + 1.5 * S) * q;
          path([[coreA - R * 0.72, b * 0.55], [coreA + R * 0.65 + 2 * S * q, b]], (t) => Math.max(0.8, (1.2 - t * 0.25) * S));
          path([[coreA + R * 0.55, b], [coreA + R * 1.1 + 3 * S * q, b * 1.18]], (t) => Math.max(0.7, (1.1 - t * 0.6) * S));
        }
        break;
      }
      case "vineCrest": {
        for (const s of [-1, 1]) {
          const pts: [number, number][] = [];
          for (let i = 0; i <= 18; i++) { const t = i / 18; pts.push([coreA - R * 0.85 + t * (R * 1.8 + 4 * S) * q, s * (R * 0.3 + Math.sin(t * Math.PI * 2.2) * (R * 0.72 + 1.7 * S) * q)]); }
          path(pts, (t) => Math.max(0.7, (1.2 - t * 0.3) * S), ramps.leaf);
          for (let i = 3; i < 16; i += 4) { const t = i / 18; gem(coreA - R * 0.85 + t * (R * 1.8 + 4 * S) * q, s * (R * 0.3 + Math.sin(t * Math.PI * 2.2) * (R * 0.72 + 1.7 * S) * q), Math.max(0.45, 0.55 * S), 0.7); }
        }
        break;
      }
      case "sunDisk": {
        const rr = (R + 4.5 * S) * q;
        layerRing(ctx, "back", cx, cy, rr, Math.max(0.7, 0.9 * S), ramps.trim, 0.85);
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI * 2) / 12 + phase * 0.08;
          const p0: [number, number] = [coreA + Math.sin(a) * rr * 0.2, Math.cos(a) * rr];
          const p1: [number, number] = [coreA + Math.sin(a) * rr * 0.36, Math.cos(a) * rr * 1.3];
          path([p0, p1], () => Math.max(0.65, 0.8 * S), ramps.energy, true, 0.78);
        }
        break;
      }
      case "lunarPhase": {
        const rr = (R + 3.3 * S) * q;
        for (let i = 0; i < 5; i++) {
          const b = (i - 2) * rr * 0.72;
          const [x, y] = toScreen(coreA + R * 0.65, b);
          layerRing(ctx, "back", x, y, Math.max(0.8, (1.05 + (i % 2) * 0.14) * S), Math.max(0.45, 0.5 * S), ramps.energy, 0.75, 0.82);
        }
        break;
      }
      case "thornHalo": {
        const rr = (R + 4 * S) * q;
        layerRing(ctx, "back", cx, cy, rr, Math.max(0.55, 0.65 * S), ramps.trim, 0.75, 0.88, true);
        for (let i = 0; i < 9; i++) {
          const a = (i * Math.PI * 2) / 9 - phase * 0.05;
          const p0: [number, number] = [coreA + Math.sin(a) * rr * 0.28, Math.cos(a) * rr * 0.85];
          const p1: [number, number] = [coreA + Math.sin(a) * rr * 0.55, Math.cos(a) * rr * 1.18];
          path([p0, p1], (t) => Math.max(0.55, (1 - t * 0.65) * S), ramps.trim);
        }
        break;
      }
      case "floatingPages": {
        for (let i = 0; i < 4; i++) {
          const a = phase * 0.5 + (i * Math.PI * 2) / 4;
          const px = cx + Math.cos(a) * (R + 3.5 * S) * q, py = cy + Math.sin(a) * (R + 2.5 * S) * q;
          const rot = a * 0.6;
          box(ctx, px, py, 4 * S + 2, (x, y, dx, dy) => {
            const u = dx * Math.cos(rot) + dy * Math.sin(rot), v = -dx * Math.sin(rot) + dy * Math.cos(rot);
            if (Math.abs(u) > 2.3 * S || Math.abs(v) > 1.45 * S) return;
            layerBlend(ctx, "back", x - ctx.half, y - ctx.half, Math.abs(u) > 2 * S || Math.abs(v) > 1.2 * S ? ramps.core[2] : ramps.paper[4], 0.8, false);
          });
        }
        break;
      }
      case "soulCage": {
        const rr = (R + 3.5 * S) * q;
        layerRing(ctx, "back", cx, cy, rr, Math.max(0.55, 0.65 * S), ramps.trim, 0.75, 1.15);
        for (let i = 0; i < 5; i++) {
          const b = (i / 4 - 0.5) * rr * 1.6;
          path([[coreA - rr * 0.72, b], [coreA + rr * 0.9, b]], () => Math.max(0.55, 0.6 * S), ramps.trim);
        }
        break;
      }
      case "clockwork": {
        const rr = (R + 4 * S) * q;
        layerRing(ctx, "back", cx, cy, rr, Math.max(0.75, S), ramps.trim, 0.82);
        for (let i = 0; i < 12; i++) {
          const a = phase * 0.08 + (i * Math.PI * 2) / 12;
          const [x, y] = toScreen(coreA + Math.sin(a) * rr * 0.2, Math.cos(a) * rr);
          layerOrb(ctx, "back", x, y, Math.max(0.55, 0.78 * S), i % 2 ? ramps.trim : ramps.energy, 0.88, i % 3 === 0);
        }
        break;
      }
      case "featherCrest": {
        for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
          const len = (R * (1.15 + i * 0.18) + 2 * S) * q;
          const a0 = coreA - R * 0.45, b0 = s * R * 0.35;
          path([[a0, b0], [a0 + len * 0.52, b0 + s * len * (0.32 + i * 0.09)], [a0 + len, b0 + s * len * (0.45 + i * 0.1)]], (t) => Math.max(0.7, (1.25 - t * 0.72) * S), ramps.feather);
        }
        break;
      }
      case "serpentCoil": {
        for (const s of [-1, 1]) {
          const pts: [number, number][] = [];
          for (let i = 0; i <= 28; i++) { const t = i / 28; pts.push([coreA - R * 1.1 + t * (R * 2.25), s * Math.sin(t * Math.PI * 2.6 + phase * 0.25) * (R * 0.82 + 1.4 * S) * q]); }
          path(pts, (t) => Math.max(0.65, (1.1 - t * 0.2) * S), ramps.leaf);
        }
        break;
      }
      case "alchemicalRing": {
        const rr = (R + 4.6 * S) * q;
        layerRing(ctx, "back", cx, cy, rr, Math.max(0.5, 0.55 * S), ramps.energy, 0.72, 0.96, true);
        layerRing(ctx, "back", cx, cy, rr * 0.68, Math.max(0.4, 0.45 * S), ramps.trim, 0.62, 0.96, true);
        for (let i = 0; i < 3; i++) {
          const a = phase * 0.1 + (i * Math.PI * 2) / 3;
          gem(coreA + Math.sin(a) * rr * 0.38, Math.cos(a) * rr * 0.86, Math.max(0.5, 0.62 * S), 0.85);
        }
        break;
      }
      case "crystalLattice": {
        for (const s of [-1, 1]) {
          for (let i = 0; i < 3; i++) {
            const b = s * (R * 0.55 + i * (R * 0.48 + 1.1 * S)) * q;
            path([[coreA - R * 0.8, b * 0.65], [coreA + R * 0.25, b], [coreA + R * 0.85, b * 0.45]], (t) => Math.max(0.55, (1 - t * 0.25) * S), ramps.core, true, 0.78);
            gem(coreA + R * 0.25, b, Math.max(0.5, 0.6 * S), 0.82);
          }
        }
        break;
      }
      case "arabesque": {
        // Symmetrical golden filigree scrollwork with suspended dewdrop gems
        for (const s of [-1, 1]) {
          const pts: [number, number][] = [];
          for (let i = 0; i <= 22; i++) {
            const t = i / 22;
            const phi = t * Math.PI * 1.65;
            const rad = (R * 0.95 + 2.2 * S) * q * (1 - t * 0.35);
            pts.push([coreA - R * 0.2 + Math.sin(phi) * rad * 0.85, s * (R * 0.35 + (1 - Math.cos(phi)) * rad * 0.62)]);
          }
          path(pts, (t) => Math.max(0.6, (1.1 - t * 0.4) * S), ramps.trim, false, 0.9);
          gem(coreA + R * 0.55 * q, s * (R * 1.15 + 1.8 * S) * q, Math.max(0.65, 0.85 * S), 0.92);
        }
        break;
      }
      case "lotusPetals": {
        // Translucent radiant lotus mandorla behind the core
        for (let i = -3; i <= 3; i++) {
          const ang = i * 0.36;
          const len = (R * (1.45 - Math.abs(i) * 0.08) + 2.8 * S) * q;
          const p0: [number, number] = [coreA - R * 0.25, 0];
          const p1: [number, number] = [coreA + Math.cos(ang) * len * 0.6, Math.sin(ang) * len * 0.65];
          const p2: [number, number] = [coreA + Math.cos(ang) * len, Math.sin(ang) * len];
          path([p0, p1, p2], (t) => Math.max(0.65, Math.sin(t * Math.PI) * 1.65 * S), i % 2 === 0 ? ramps.energy : ramps.core, true, 0.72);
        }
        break;
      }
      case "celestialAstrolabe": {
        // Grand twin tilted celestial rings with orbiting star-beads
        const rr = (R + 4.8 * S) * q;
        layerRing(ctx, "back", cx, cy, rr, Math.max(0.55, 0.7 * S), ramps.trim, 0.86, 0.72);
        layerRing(ctx, "back", cx, cy, rr * 0.82, Math.max(0.45, 0.55 * S), ramps.energy, 0.78, 1.22, true);
        for (let i = 0; i < 8; i++) {
          const a = phase * 0.15 + (i * Math.PI * 2) / 8;
          const [sx, sy] = toScreen(coreA + Math.sin(a) * rr * 0.42, Math.cos(a) * rr * 0.95);
          layerOrb(ctx, "back", sx, sy, Math.max(0.55, (i % 2 === 0 ? 0.85 : 0.6) * S), i % 2 === 0 ? ramps.energy : ramps.trim, 0.9, true);
        }
        break;
      }
    }
  } else {
    switch (cfg.ornament) {
      case "silkRibbons": {
        // Flowing silk ribbons streaming from the collar in graceful S-waves
        for (const s of [-1, 1]) {
          const pts: [number, number][] = [];
          const len = (R * 2.1 + 6.5 * S) * q;
          for (let i = 0; i <= 24; i++) {
            const t = i / 24;
            const wave = Math.sin(t * Math.PI * 2.1 - phase * 1.4 + (s > 0 ? 0 : 0.9)) * (1.35 + t * 1.8) * S;
            const a = coreA - R * 0.55 - t * len * 0.78;
            const b = s * (R * 0.38 + t * (R * 0.95 + 2.4 * S) * q) + wave;
            pts.push([a, b]);
          }
          path(pts, (t) => Math.max(0.65, (1.45 - t * 0.85) * S), s > 0 ? ramps.energy : ramps.core, true, 0.88);
          const last = pts[pts.length - 1];
          gem(last[0], last[1], Math.max(0.55, 0.7 * S), 0.9);
        }
        break;
      }
      case "hangingCharms": {
        for (const s of [-1, 1]) {
          const b = s * (R * 0.95 + 2 * S) * q;
          path([[coreA - R * 0.42, b * 0.45], [coreA - R * 1.2 - 2 * S, b]], () => Math.max(0.5, 0.6 * S), ramps.trim, false, 0.85);
          gem(coreA - R * 1.35 - 2 * S, b * 1.06, Math.max(0.65, 0.8 * S), 0.95);
        }
        break;
      }
      case "chainTassel": {
        for (const s of [-1, 1]) {
          for (let i = 0; i < 4; i++) {
            const a = coreA - R * 0.55 - i * 1.45 * S, b = s * (R * 0.72 + i * 0.35 * S + Math.sin(phase + i) * 0.3 * S);
            const [x, y] = toScreen(a, b);
            layerRing(ctx, "front", x, y, Math.max(0.55, 0.7 * S), Math.max(0.35, 0.35 * S), ramps.iron, 0.9, 0.65);
          }
        }
        break;
      }
      case "beadRosary": {
        for (let i = 0; i < Math.max(4, cfg.accentGems + 2); i++) {
          const a = coreA - R * 0.6 - i * 0.85 * S, b = Math.sin(i * 1.7 + phase) * (R * 0.88 + 1.2 * S) * q;
          const [x, y] = toScreen(a, b);
          layerOrb(ctx, "front", x, y, Math.max(0.55, 0.7 * S), i % 3 === 0 ? ramps.core : ramps.trim, 0.94, i % 3 === 0);
        }
        break;
      }
    }
  }
}

/**
 * Free-form composition sits above the named staff archetype. It changes the visual grammar
 * without changing the base item type, which is useful for MMO/server relics that should not
 * all read as conventional rods.
 */
function drawArtifactForm(ctx: Ctx, L: ReturnType<typeof layout>, layer: DecorLayer) {
  const { cfg, ramps, S, phase } = ctx;
  if (cfg.form === "classic") return;
  const { R, coreA } = L;
  const target = layer === "back" ? "back" : "front";
  const path = (pts: [number, number][], width: (t: number) => number, ramp = ramps.trim, emissive = false, alpha = 1) => drawPath(ctx, pts, width, ramp, emissive, target, alpha);
  const gem = (a: number, b: number, radius: number, ramp = ramps.core, alpha = 1) => {
    const [x, y] = toScreen(a, b);
    layerDiamond(ctx, layer, x, y, radius, ramp, alpha, true, Math.PI / 4);
  };

  if (layer === "back") {
    switch (cfg.form) {
      case "asymmetric": {
        const side = cfg.seed % 2 ? 1 : -1;
        const pts: [number, number][] = [[coreA - R * 0.9, 0], [coreA - R * 0.2, side * (R + 2 * S)], [coreA + R * 0.8, side * (R * 1.45 + 4 * S)]];
        path(pts, (t) => Math.max(0.7, (1.4 - t * 0.8) * S), ramps.trim);
        gem(coreA + R * 0.8, side * (R * 1.45 + 4 * S), Math.max(0.8, 1.1 * S), ramps.energy);
        for (let i = 0; i < 3; i++) gem(coreA + R * (0.05 + i * 0.28), -side * (R * 0.5 + i * S), Math.max(0.48, 0.62 * S), ramps.core, 0.78);
        break;
      }
      case "bifurcated": {
        for (const side of [-1, 1]) {
          path([[coreA - R * 1.05, 0], [coreA - R * 0.1, side * (R + 1.2 * S)], [coreA + R * 0.72, side * (R * 1.3 + 3 * S)]], (t) => Math.max(0.75, (1.35 - t * 0.7) * S), ramps.trim);
          gem(coreA + R * 0.72, side * (R * 1.3 + 3 * S), Math.max(0.85, 1.12 * S), side < 0 ? ramps.core : ramps.energy);
        }
        break;
      }
      case "levitating": {
        for (let i = 0; i < 4; i++) {
          const a = coreA - R * 1.25 + i * (R * 0.8 + 1.2 * S);
          const b = Math.sin(phase + i * 1.7) * (R * 0.55 + 1.2 * S);
          gem(a, b, Math.max(0.65, (0.72 + i * 0.06) * S), i % 2 ? ramps.energy : ramps.core, 0.82);
        }
        break;
      }
      case "constellation": {
        const nodes: [number, number][] = [];
        for (let i = 0; i < 7; i++) {
          const a = coreA + Math.sin(i * 1.83 + cfg.seed) * (R + 3.5 * S);
          const b = Math.cos(i * 1.31 + cfg.seed * 0.1) * (R + 5 * S);
          nodes.push([a, b]);
        }
        for (let i = 1; i < nodes.length; i++) path([nodes[i - 1], nodes[i]], () => Math.max(0.4, 0.45 * S), ramps.energy, true, 0.45);
        nodes.forEach(([a, b], i) => gem(a, b, Math.max(0.45, (i % 3 === 0 ? 0.8 : 0.55) * S), ramps.energy, 0.86));
        break;
      }
      case "shrine": {
        const H = R * 1.7 + 4 * S, W = R + 3.5 * S;
        for (const side of [-1, 1]) path([[coreA - H * 0.65, side * W], [coreA + H * 0.5, side * W], [coreA + H * 0.8, side * W * 0.65]], () => Math.max(0.8, 1.25 * S), ramps.trim);
        path([[coreA + H * 0.5, -W], [coreA + H * 0.75, 0], [coreA + H * 0.5, W]], () => Math.max(0.8, 1.15 * S), ramps.trim);
        for (const side of [-1, 1]) gem(coreA - H * 0.12, side * W, Math.max(0.6, 0.78 * S), ramps.energy);
        break;
      }
      case "totemic": {
        for (let i = -2; i <= 2; i++) {
          const a = coreA + i * (R * 0.72 + S);
          gem(a, Math.sin(i * 1.9 + phase * 0.2) * R * 0.22, Math.max(0.72, (1 - Math.abs(i) * 0.08) * S), i % 2 ? ramps.energy : ramps.core);
        }
        break;
      }
      case "bouquet": {
        for (let i = 0; i < 7; i++) {
          const t = i / 6;
          const angle = -1.15 + t * 2.3;
          const len = R * (1.15 + (i % 2) * 0.25) + 3 * S;
          const end: [number, number] = [coreA + Math.cos(angle) * len, Math.sin(angle) * len];
          path([[coreA - R * 0.8, 0], [coreA + R * 0.1, Math.sin(angle) * R * 0.5], end], (p) => Math.max(0.5, (1 - p * 0.55) * S), ramps.leaf);
          gem(end[0], end[1], Math.max(0.58, (0.72 + (i % 3) * 0.12) * S), i % 2 ? ramps.core : ramps.energy, 0.9);
        }
        break;
      }
    }
  } else if (cfg.form === "levitating") {
    const [cx, cy] = toScreen(coreA + R * 1.1, 0);
    layerRing(ctx, "front", cx, cy, R * 0.62 + 1.5 * S, Math.max(0.45, 0.5 * S), ramps.energy, 0.7, 0.72, true);
  } else if (cfg.form === "shrine") {
    const [cx, cy] = toScreen(coreA - R * 0.8, 0);
    layerOrb(ctx, "front", cx, cy, Math.max(0.6, 0.82 * S), ramps.energy, 0.9, true);
  }
}

// ---------- floaters ----------
function floaterPosition(ctx: Ctx, L: ReturnType<typeof layout>, index: number, count: number) {
  const { cfg, phase, S } = ctx;
  const { R, coreA, Rf } = L;
  const base = (index / Math.max(1, count)) * Math.PI * 2;
  const th = base + phase;
  const bob = Math.sin(phase * 2 + index * 1.7) * 0.5 * S;
  let a = coreA, b = 0, front = true;
  switch (cfg.floaterPath) {
    case "spiral": {
      const rr = Rf * (0.48 + 0.3 * (0.5 + 0.5 * Math.sin(phase + index * 0.8)));
      a += rr * 0.56 * Math.sin(th * 1.25) + bob;
      b = rr * Math.cos(th * 1.25);
      front = Math.sin(th * 1.25) < 0;
      break;
    }
    case "figure8":
      a += Rf * 0.38 * Math.sin(th * 2) + bob;
      b = Rf * Math.sin(th);
      front = Math.cos(th) > 0;
      break;
    case "crown": {
      const u = count <= 1 ? 0.5 : index / (count - 1);
      b = (u - 0.5) * Rf * 2;
      a += R * 0.75 + Math.sin(u * Math.PI) * (Rf * 0.46) + bob * 0.35;
      front = index % 2 === 0;
      break;
    }
    case "helix":
      a += Rf * 0.46 * Math.sin(th * 2) + bob;
      b = Rf * 0.8 * Math.cos(th * 2);
      front = Math.sin(th * 2) < 0;
      break;
    case "pendulum":
      a += R * 0.2 - Math.cos(th) * Rf * 0.22 + bob * 0.3;
      b = Math.sin(th) * Rf;
      front = Math.cos(th) > 0;
      break;
    case "constellation": {
      const seedAng = (cfg.seed % 37) * 0.17;
      a += Math.sin(base * 1.9 + seedAng) * Rf * 0.46 + Math.sin(phase + index) * 0.32 * S;
      b = Math.cos(base * 1.37 + seedAng) * Rf * 0.85;
      front = Math.sin(base + seedAng) < 0;
      break;
    }
    case "rain":
      a += Rf * (0.65 - ((phase * 0.35 + index / Math.max(1, count)) % 1.3)) + bob * 0.2;
      b = (index / Math.max(1, count) - 0.5) * Rf * 2;
      front = index % 2 === 0;
      break;
    default:
      a += Rf * 0.36 * Math.sin(th) + bob;
      b = Rf * Math.cos(th);
      front = Math.sin(th) < 0;
  }
  return { a, b, front, theta: th };
}

function drawFloaters(ctx: Ctx, L: ReturnType<typeof layout>) {
  const { cfg, S, ramps, phase } = ctx;
  const { R, coreA } = L;
  const n = cfg.floaterCount;
  const plotTo = (front: boolean, x: number, y: number, c: RGB, a = 1, em = true) => {
    (front ? ctx.front : ctx.back).blend(x, y, c, a);
    if (em && x >= 0 && y >= 0 && x < ctx.N && y < ctx.N) ctx.emitX[y * ctx.N + x] = 1;
  };
  if (cfg.floater === "halo") {
    const hc = coreA + R * 0.95 + 2.5 * S + Math.sin(phase) * 0.6 * S;
    const Rh = R * 0.85 + 2.2 * S, Ra = Rh * 0.38, th = Math.max(0.6, 0.75 * S);
    const [hx, hy] = toScreen(hc, 0);
    box(ctx, hx, hy, Rh + 2, (x, y, dx, dy) => {
      const [u, v] = toLocal(dx, dy);
      const e = Math.sqrt((u / Ra) ** 2 + (v / Rh) ** 2);
      if (Math.abs(e - 1) * Ra > th) return;
      const front = u < 0;
      const tw = 0.5 + 0.5 * Math.sin(Math.atan2(u / Ra, v / Rh) * 3 - phase * 1);
      plotTo(front, x, y, ramps.energy[tw > 0.75 ? 5 : 4], front ? 1 : 0.7);
    });
    return;
  }
  if (cfg.floater === "none" || n <= 0) return;
  const rnd = mulberry(cfg.seed + 101);
  for (let i = 0; i < n; i++) {
    const { a: la, b: lb, front, theta: th } = floaterPosition(ctx, L, i, n);
    const [sx, sy] = toScreen(la, lb);
    const scaleD = front ? 1 : 0.8;
    const alpha = front ? 1 : 0.75;
    const X = Math.floor(sx + ctx.half), Y = Math.floor(sy + ctx.half);
    const pick = Math.floor(rnd() * 8);
    switch (cfg.floater) {
      case "shards": {
        const w = (1.0 * S + 0.5) * scaleD, h = (2.3 * S + 0.8) * scaleD;
        box(ctx, sx, sy, h + 1, (x, y, dx, dy) => {
          const r = Math.cos(th * 0.5 + i), s2 = Math.sin(th * 0.5 + i);
          const u = dx * r + dy * s2, v = -dx * s2 + dy * r;
          const d = Math.abs(u) / w + Math.abs(v) / h;
          if (d > 1) return;
          const c = d < 0.4 ? ramps.core[5] : u < 0 ? ramps.core[4] : ramps.core[2];
          plotTo(front, x, y, c, alpha);
        });
        break;
      }
      case "runes": {
        const big = ctx.N >= 128;
        const g = (big ? GLYPHS5 : GLYPHS3)[pick % 8], gs = big ? 5 : 3;
        const off = Math.floor(gs / 2);
        for (let j = 0; j < gs * gs; j++) if (g[j] === "1") plotTo(front, X + (j % gs) - off, Y + Math.floor(j / gs) - off, ramps.energy[(j + i) % 3 === 0 ? 5 : 4], alpha);
        break;
      }
      case "orbs": {
        const r = (1.2 * S + 0.6) * scaleD;
        box(ctx, sx, sy, r + 1, (x, y, dx, dy) => { const id = sphereIdx(dx, dy, r); if (id >= 0) plotTo(front, x, y, ramps.core[Math.min(5, id + 1)], alpha); });
        break;
      }
      case "cubes": {
        const s = Math.max(1.2, 1.8 * S * scaleD);
        box(ctx, sx, sy, s * 2, (x, y, dx, dy) => {
          if (Math.abs(dx) > s || dy < -s || dy > s * 1.1) return;
          const topLine = -s * 0.5 + Math.abs(dx) * 0.5;
          const inTop = Math.abs(dx) / s + Math.abs(dy + s * 0.5) / (s * 0.5) <= 1;
          if (!inTop && dy < topLine) return;
          if (!inTop && dy > s * 0.5 + (s - Math.abs(dx)) * 0.5) return;
          const c = inTop ? ramps.core[5] : dx < 0 ? ramps.core[3] : ramps.core[2];
          plotTo(front, x, y, c, alpha);
        });
        break;
      }
      case "stars": {
        const tw = 0.5 + 0.5 * Math.sin(phase * 2 + i * 2.1);
        const arm = Math.max(1, Math.round((1 + 1.6 * S) * tw));
        plotTo(front, X, Y, [255, 255, 255], alpha);
        for (let d = 1; d <= arm; d++) {
          const c = d === arm ? ramps.energy[3] : ramps.energy[5];
          plotTo(front, X + d, Y, c, alpha); plotTo(front, X - d, Y, c, alpha); plotTo(front, X, Y + d, c, alpha); plotTo(front, X, Y - d, c, alpha);
        }
        break;
      }
      case "petals": {
        const w = (1.8 * S + 0.6) * scaleD, h = (0.9 * S + 0.5) * scaleD, rot = th * 1.5 + i;
        box(ctx, sx, sy, w + 1, (x, y, dx, dy) => {
          const u = dx * Math.cos(rot) + dy * Math.sin(rot), v = -dx * Math.sin(rot) + dy * Math.cos(rot);
          if ((u / w) ** 2 + (v / h) ** 2 > 1) return;
          plotTo(front, x, y, v < 0 ? ramps.energy[4] : ramps.core[3], alpha, false);
        });
        break;
      }
      case "chains": {
        const rw = (1.6 * S + 0.7) * scaleD, rh = (1.0 * S + 0.5) * scaleD, rot = th + i * 1.57;
        box(ctx, sx, sy, rw + 1, (x, y, dx, dy) => {
          const u = dx * Math.cos(rot) + dy * Math.sin(rot), v = -dx * Math.sin(rot) + dy * Math.cos(rot);
          const e = Math.sqrt((u / rw) ** 2 + (v / rh) ** 2);
          if (Math.abs(e - 1) * rh > Math.max(0.5, 0.55 * S)) return;
          plotTo(front, x, y, ramps.iron[v < 0 ? 4 : 2], alpha, false);
        });
        break;
      }
      case "wisps": {
        const wr = (1.5 * S + 0.7) * scaleD, flick = 0.6 + 0.4 * Math.sin(phase * 3 + i * 2.4);
        box(ctx, sx, sy, wr * 2.4, (x, y, dx, dy) => {
          const d = Math.hypot(dx, dy + wr * 0.2) / wr;
          if (d > 1.9) return;
          const tail = dy < 0 && Math.abs(dx) < wr * 0.4 * (1 + dy / (wr * 2));
          if (d > 1 && !tail) return;
          const c = d < 0.45 ? ramps.energy[5] : d < 0.85 ? ramps.energy[4] : ramps.core[3];
          plotTo(front, x, y, c, alpha * flick);
        });
        break;
      }
      case "bells": {
        const br = (1.5 * S + 0.8) * scaleD;
        box(ctx, sx, sy, br * 2, (x, y, dx, dy) => {
          const u = dx / br, v = dy / br;
          if (v < -0.9 || v > 0.75) return;
          const wid = 0.42 + 0.5 * Math.pow(Math.max(0, (v + 0.9) / 1.65), 1.7);
          if (Math.abs(u) > wid) return;
          if (v > 0.5) { plotTo(front, x, y, u < 0 ? ramps.gold[4] : ramps.gold[2], alpha, false); return; }
          plotTo(front, x, y, u < -wid * 0.3 ? ramps.gold[5] : u > wid * 0.4 ? ramps.gold[2] : ramps.gold[4], alpha, false);
        });
        plotTo(front, X, Y + Math.round(br * 1.1), ramps.gold[1], alpha, false);
        break;
      }
      case "daggers": {
        const bl = (3.2 * S + 1.2) * scaleD, rot = th * 1.3 + i * 0.8 + phase * 0.5;
        box(ctx, sx, sy, bl * 1.4, (x, y, dx, dy) => {
          const u = dx * Math.cos(rot) + dy * Math.sin(rot), v = -dx * Math.sin(rot) + dy * Math.cos(rot);
          if (u < -bl || u > bl) return;
          const halfW = u < bl * 0.55 ? Math.max(0.4, bl * 0.14) * (1 - Math.max(0, u) / (bl * 1.1)) : Math.max(0.4, bl * 0.22);
          if (Math.abs(v) > halfW) return;
          if (u > bl * 0.5 && Math.abs(v) < halfW * 0.9) return;
          plotTo(front, x, y, u > bl * 0.5 ? ramps.trim[v < 0 ? 4 : 2] : v < 0 ? ramps.iron[5] : ramps.iron[2], alpha, false);
        });
        break;
      }
      case "candles": {
        const ch = (3.4 * S + 1.4) * scaleD, cw = (1.0 * S + 0.6) * scaleD;
        box(ctx, sx, sy, ch, (x, y, dx, dy) => {
          if (Math.abs(dx) > cw) {
            const fy = dy + ch * 0.42;
            const fd = Math.hypot(dx * 1.4, fy) / (cw * 1.5);
            if (fd > 1 || dy > -ch * 0.2) return;
            plotTo(front, x, y, fd < 0.4 ? [255, 255, 255] : fd < 0.7 ? ramps.energy[5] : ramps.core[4], alpha * (0.75 + 0.25 * Math.sin(phase * 4 + i)));
            return;
          }
          if (dy < -ch * 0.45 || dy > ch * 0.45) return;
          plotTo(front, x, y, dx < -cw * 0.3 ? ramps.paper[5] : dx > cw * 0.35 ? ramps.paper[2] : ramps.paper[4], alpha, false);
        });
        break;
      }
      case "books": {
        const bw = (2.2 * S + 1) * scaleD, bh = (1.6 * S + 0.8) * scaleD, rot = Math.sin(phase + i) * 0.35;
        box(ctx, sx, sy, bw * 1.5, (x, y, dx, dy) => {
          const u = dx * Math.cos(rot) + dy * Math.sin(rot), v = -dx * Math.sin(rot) + dy * Math.cos(rot);
          if (Math.abs(u) > bw || Math.abs(v) > bh) return;
          const cover = Math.abs(u) > bw * 0.86 || Math.abs(v) > bh * 0.84;
          plotTo(front, x, y, cover ? (v < 0 ? ramps.core[4] : ramps.core[2]) : ((Math.floor(u / Math.max(1, S)) % 2 === 0) ? ramps.paper[5] : ramps.paper[4]), alpha, !cover);
        });
        break;
      }
      case "moons": {
        const mr = (1.7 * S + 0.8) * scaleD;
        box(ctx, sx, sy, mr * 1.6, (x, y, dx, dy) => {
          const d = Math.hypot(dx, dy);
          if (d > mr || Math.hypot(dx - mr * 0.42, dy + mr * 0.2) < mr * 0.82) return;
          const l = (dx * LX + dy * LY) / (d || 1);
          plotTo(front, x, y, l > 0.4 ? ramps.energy[5] : l > -0.1 ? ramps.energy[4] : ramps.core[2], alpha);
        });
        break;
      }
      case "eyes": {
        const er = (1.5 * S + 0.7) * scaleD;
        box(ctx, sx, sy, er * 1.6, (x, y, dx, dy) => {
          const e = (dx / er) ** 2 + (dy / (er * 0.62)) ** 2;
          if (e > 1.05) return;
          const pupil = Math.hypot(dx, dy) < er * 0.34;
          plotTo(front, x, y, pupil ? ramps.dark[0] : dy < 0 ? ramps.sclera[5] : ramps.sclera[3], alpha, pupil);
        });
        break;
      }
      case "leaves": {
        const lw = (1.9 * S + 0.7) * scaleD, rot = th * 2 + i + phase * 0.6;
        box(ctx, sx, sy, lw * 1.4, (x, y, dx, dy) => {
          const u = dx * Math.cos(rot) + dy * Math.sin(rot), v = -dx * Math.sin(rot) + dy * Math.cos(rot);
          if ((u / lw) ** 2 + (v / (lw * 0.45)) ** 2 > 1) return;
          plotTo(front, x, y, Math.abs(v) < lw * 0.1 ? ramps.leaf[2] : v < 0 ? ramps.leaf[4] : ramps.leaf[3], alpha, false);
        });
        break;
      }
      case "coins": {
        const cr = (1.3 * S + 0.6) * scaleD, spin = Math.abs(Math.cos(phase * 1.5 + i));
        box(ctx, sx, sy, cr * 1.6, (x, y, dx, dy) => {
          const e = (dx / Math.max(0.35, cr * spin)) ** 2 + (dy / cr) ** 2;
          if (e > 1) return;
          plotTo(front, x, y, e < 0.45 ? ramps.gold[5] : dx < 0 ? ramps.gold[4] : ramps.gold[2], alpha, false);
        });
        break;
      }
      case "butterflies": {
        const wr = (1.45 * S + 0.65) * scaleD;
        const flap = 0.35 + 0.65 * Math.abs(Math.sin(phase * 3 + i));
        for (const side of [-1, 1]) {
          const ox = side * wr * flap;
          box(ctx, sx + ox, sy, wr + 1, (x, y, dx, dy) => {
            const e = (dx / Math.max(0.5, wr * 0.9 * flap)) ** 2 + (dy / (wr * 0.65)) ** 2;
            if (e > 1) return;
            plotTo(front, x, y, side < 0 ? ramps.core[4] : ramps.energy[4], alpha, true);
          });
        }
        plotTo(front, X, Y, ramps.trim[2], alpha, false);
        break;
      }
      case "keys": {
        const kr = Math.max(0.8, 1.05 * S), len = (3.4 * S + 1) * scaleD, rot = th + phase * 0.25;
        box(ctx, sx, sy, len + 2, (x, y, dx, dy) => {
          const u = dx * Math.cos(rot) + dy * Math.sin(rot), v = -dx * Math.sin(rot) + dy * Math.cos(rot);
          const ring = Math.abs(Math.hypot(u + len * 0.35, v) - kr) < Math.max(0.45, 0.45 * S);
          const stem = u > -len * 0.2 && u < len * 0.58 && Math.abs(v) < Math.max(0.45, 0.5 * S);
          const tooth = u > len * 0.28 && (Math.abs(v - 0.9 * S) < 0.5 * S || Math.abs(v + 0.9 * S) < 0.5 * S);
          if (!ring && !stem && !tooth) return;
          plotTo(front, x, y, u < 0 ? ramps.gold[5] : ramps.gold[3], alpha, false);
        });
        break;
      }
      case "gears": {
        const gr = (1.55 * S + 0.7) * scaleD, spin = phase * (i % 2 ? -0.9 : 0.9);
        box(ctx, sx, sy, gr * 1.5, (x, y, dx, dy) => {
          const d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + spin;
          const teeth = Math.sin(a * 8) > 0.2 ? gr * 1.18 : gr;
          const body = d < teeth && d > gr * 0.42;
          if (!body) return;
          plotTo(front, x, y, d < gr * 0.72 ? ramps.trim[2] : ramps.trim[4], alpha, false);
        });
        break;
      }
      case "lanterns": {
        const lw = (1.2 * S + 0.6) * scaleD, lh = (1.7 * S + 0.8) * scaleD;
        box(ctx, sx, sy, lh + 1, (x, y, dx, dy) => {
          if (Math.abs(dx) > lw || Math.abs(dy) > lh) return;
          const frame = Math.abs(dx) > lw * 0.72 || Math.abs(dy) > lh * 0.72;
          plotTo(front, x, y, frame ? ramps.trim[3] : (Math.hypot(dx, dy) < lw * 0.55 ? ramps.energy[5] : ramps.core[4]), alpha, !frame);
        });
        break;
      }
      case "sigils": {
        const big = ctx.N >= 128, g = (big ? GLYPHS5 : GLYPHS3)[(pick + i * 3) % 8], gs = big ? 5 : 3, off = Math.floor(gs / 2);
        for (let j = 0; j < gs * gs; j++) if (g[j] === "1") plotTo(front, X + (j % gs) - off, Y + Math.floor(j / gs) - off, i % 2 ? ramps.energy[5] : ramps.core[4], alpha, true);
        const rr = (big ? 3.4 : 2.2) * S;
        box(ctx, sx, sy, rr + 1, (x, y, dx, dy) => {
          const d = Math.hypot(dx, dy);
          if (Math.abs(d - rr) < Math.max(0.35, 0.4 * S)) plotTo(front, x, y, ramps.energy[3], alpha * 0.55, true);
        });
        break;
      }
      case "compasses": {
        const rr = (1.8 * S + 0.8) * scaleD;
        box(ctx, sx, sy, rr + 1, (x, y, dx, dy) => {
          const d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) - phase * 0.55;
          const ring = Math.abs(d - rr) < Math.max(0.4, 0.45 * S);
          const needle = Math.abs(Math.sin(a)) < 0.18 && d < rr * 0.78;
          if (!ring && !needle) return;
          plotTo(front, x, y, needle ? ramps.core[5] : ramps.trim[4], alpha, needle);
        });
        break;
      }
      case "bubbles": {
        const br = (1.1 * S + 0.55) * scaleD;
        box(ctx, sx, sy, br + 1, (x, y, dx, dy) => {
          const d = Math.hypot(dx, dy);
          if (d > br || d < br * 0.45) return;
          plotTo(front, x, y, dx < 0 && dy < 0 ? ramps.energy[5] : ramps.energy[3], alpha * 0.85, false);
        });
        break;
      }
      case "fish": {
        const fl = (2.4 * S + 0.8) * scaleD, swim = Math.sin(phase * 2 + i) * 0.5 * S;
        box(ctx, sx, sy + swim * 0.3, fl, (x, y, dx, dy) => {
          const body = (dx / fl) ** 2 + (dy / (fl * 0.42)) ** 2 <= 1;
          const tail = dx < -fl * 0.7 && Math.abs(dy) < fl * 0.5 * (1 - (-dx - fl * 0.7) / (fl * 0.5));
          if (!body && !tail) return;
          plotTo(front, x, y, tail ? ramps.energy[4] : dx < 0 ? ramps.energy[5] : ramps.core[3], alpha, false);
        });
        break;
      }
      case "pearls": {
        const pr = (0.9 * S + 0.5) * scaleD;
        box(ctx, sx, sy, pr + 1, (x, y, dx, dy) => { const id = sphereIdx(dx, dy, pr); if (id >= 0) plotTo(front, x, y, ramps.core[Math.min(5, id + 1)], alpha, true); });
        break;
      }
      case "bolts": {
        plotTo(front, X, Y, ramps.trim[5], alpha, false);
        plotTo(front, X + 1, Y, ramps.trim[2], alpha * 0.9, false);
        plotTo(front, X, Y + 1, ramps.trim[3], alpha * 0.9, false);
        break;
      }
      case "cogs": {
        const gr = (1.3 * S + 0.5) * scaleD;
        box(ctx, sx, sy, gr * 1.4, (x, y, dx, dy) => {
          const d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + phase * (i % 2 ? -1 : 1);
          const teeth = Math.sin(a * 6) > 0.3 ? gr * 1.2 : gr;
          if (d > teeth || d < gr * 0.4) return;
          plotTo(front, x, y, d < gr * 0.65 ? ramps.trim[2] : ramps.trim[4], alpha, false);
        });
        break;
      }
      case "shells": {
        const sr = (1.2 * S + 0.5) * scaleD;
        box(ctx, sx, sy, sr + 1, (x, y, dx, dy) => {
          const d = Math.hypot(dx, dy);
          if (d > sr) return -1;
          const ridge = Math.sin(Math.atan2(dy, dx) * 6) > 0.2;
          plotTo(front, x, y, ridge ? ramps.core[4] : ramps.core[2], alpha, false);
        });
        break;
      }
      case "tadpoles": {
        const tr = (1.0 * S + 0.4) * scaleD, wig = Math.sin(phase * 3 + i * 2) * S * 0.4;
        box(ctx, sx, sy, tr * 2, (x, y, dx, dy) => {
          const head = Math.hypot(dx, dy) < tr * 0.7;
          const tail = dx < 0 && dx > -tr * 1.8 && Math.abs(dy - wig * (-dx / tr)) < tr * 0.28;
          if (!head && !tail) return;
          plotTo(front, x, y, head ? ramps.core[4] : ramps.core[2], alpha, false);
        });
        break;
      }
      case "seeds": {
        plotTo(front, X, Y, ramps.leaf[4], alpha, false);
        plotTo(front, X + 1, Y + 1, ramps.leaf[2], alpha * 0.9, false);
        if (S >= 1) { plotTo(front, X - 1, Y, ramps.leaf[3], alpha * 0.7, false); }
        break;
      }
      case "paperCrane": {
        const cr = (1.6 * S + 0.5) * scaleD, flap = Math.sin(phase * 2 + i) * 0.4;
        box(ctx, sx, sy, cr * 1.5, (x, y, dx, dy) => {
          const wing = Math.abs(dy - Math.abs(dx) * (0.35 + flap * 0.3)) < Math.max(0.4, 0.45 * S) && Math.abs(dx) < cr;
          const body = Math.abs(dx) < Math.max(0.35, 0.4 * S) && Math.abs(dy) < cr * 0.5;
          if (!wing && !body) return;
          plotTo(front, x, y, ramps.paper[wing && dx < 0 ? 5 : 4], alpha, false);
        });
        break;
      }
      case "motes": {
        const tw = 0.5 + 0.5 * Math.sin(phase * 2.4 + i * 1.9);
        if (tw < 0.3) break;
        plotTo(front, X, Y, ramps.energy[5], alpha * tw, true);
        if (tw > 0.75 && S >= 1) { plotTo(front, X + 1, Y, ramps.energy[3], alpha * 0.5, true); plotTo(front, X, Y + 1, ramps.energy[3], alpha * 0.5, true); }
        break;
      }
      case "glints": {
        const tw = Math.max(0, Math.sin(phase * 3 + i * 2.4));
        if (tw < 0.45) break;
        plotTo(front, X, Y, [255, 255, 255], alpha * tw, true);
        plotTo(front, X + 1, Y, ramps.energy[4], alpha * tw * 0.7, true);
        plotTo(front, X - 1, Y, ramps.energy[4], alpha * tw * 0.7, true);
        plotTo(front, X, Y + 1, ramps.energy[4], alpha * tw * 0.7, true);
        plotTo(front, X, Y - 1, ramps.energy[4], alpha * tw * 0.7, true);
        break;
      }
      case "dust": {
        const dr = Math.max(0.8, 1.0 * S * scaleD);
        box(ctx, sx, sy, dr + 2, (x, y, dx, dy) => {
          const d = Math.hypot(dx * 1.3, dy);
          if (d > dr + ((x + y + i) % 3 === 0 ? 0.9 : 0)) return;
          plotTo(front, x, y, ramps.energy[2], alpha * 0.4, false);
        });
        break;
      }
      case "sparkCross": {
        const arm = Math.max(1, Math.round((0.8 + 1.2 * S) * scaleD * (0.6 + 0.4 * Math.sin(phase * 2 + i))));
        plotTo(front, X, Y, [255, 255, 255], alpha, true);
        for (let d = 1; d <= arm; d++) {
          const a = alpha * (1 - d / (arm + 1)) * 0.9;
          plotTo(front, X + d, Y, ramps.energy[5], a, true); plotTo(front, X - d, Y, ramps.energy[5], a, true);
          plotTo(front, X, Y + d, ramps.energy[4], a, true); plotTo(front, X, Y - d, ramps.energy[4], a, true);
        }
        break;
      }
    }
  }
}

// ---------- particles ----------
function drawParticles(ctx: Ctx, L: ReturnType<typeof layout>) {
  const { cfg, S, ramps, F, frame, N } = ctx;
  const count = Math.round((cfg.particles / 100) * (10 + 10 * S));
  if (!count) return;
  const rnd = mulberry(cfg.seed + 555);
  const [hx, hy] = toScreen(L.coreA, 0);
  const E = ramps.energy, C = ramps.core;
  const put = (x: number, y: number, c: RGB, a = 1, em = true) => {
    x = Math.floor(x + ctx.half); y = Math.floor(y + ctx.half);
    ctx.front.blend(x, y, c, a);
    if (em && x >= 0 && y >= 0 && x < N && y < N && a > 0.5) ctx.emitX[y * N + x] = 1;
  };
  for (let i = 0; i < count; i++) {
    const onShaft = rnd() < 0.28;
    let x0: number, y0: number;
    if (onShaft) {
      const a = L.aStart + rnd() * (L.aH - L.aStart);
      [x0, y0] = toScreen(a, (rnd() - 0.5) * 8 * S);
    } else {
      const ang = rnd() * Math.PI * 2, r = L.R * 0.6 + rnd() * (L.R + 8 * S);
      x0 = hx + Math.cos(ang) * r; y0 = hy + Math.sin(ang) * r;
    }
    const off = rnd(), sp = 0.7 + rnd() * 0.6, big = rnd() > 0.7;
    const t = ((frame / F) * (cfg.particle === "twinkle" || cfg.particle === "stardust" ? 1 : Math.round(sp * 2) / 2 || 1) + off) % 1;
    const fade = Math.sin(t * Math.PI);
    switch (cfg.particle) {
      case "embers": {
        const y = y0 - t * 14 * S, x = x0 + Math.sin(t * 6 + i) * 1.2 * S;
        put(x, y, t < 0.4 ? E[5] : t < 0.7 ? C[4] : C[2], fade);
        if (big && S >= 1) put(x, y + 1, C[3], fade * 0.8);
        break;
      }
      case "snow": {
        const y = y0 + t * 10 * S, x = x0 + Math.sin(t * 5 + i) * 1.5 * S;
        put(x, y, E[5], fade);
        if (big) { put(x + 1, y, E[4], fade * 0.8); put(x - 1, y, E[4], fade * 0.8); put(x, y + 1, E[4], fade * 0.8); put(x, y - 1, E[4], fade * 0.8); }
        break;
      }
      case "sparks": {
        if (hash(i, Math.floor(t * 5), cfg.seed) < 0.45) break;
        const len = big ? 3 : 2;
        for (let j = 0; j < len; j++) put(x0 + j, y0 + (j % 2 === 0 ? j : -j) * 0.5 + j, j === 0 ? [255, 255, 255] : E[5]);
        break;
      }
      case "leaves": {
        const x = x0 + t * 8 * S, y = y0 + t * 9 * S + Math.sin(t * 8 + i) * 1.5 * S;
        put(x, y, ramps.leaf[4], fade, false); put(x + 1, y, ramps.leaf[3], fade, false);
        if (big) put(x, y + 1, ramps.leaf[2], fade, false);
        break;
      }
      case "bubbles": {
        const y = y0 - t * 12 * S, x = x0 + Math.sin(t * 7 + i) * S;
        if (big && S >= 1) { put(x - 1, y, E[5], fade); put(x + 1, y, E[4], fade); put(x, y - 1, E[5], fade); put(x, y + 1, E[3], fade); }
        else put(x, y, E[5], fade);
        break;
      }
      case "twinkle": case "stardust": {
        const tw = Math.max(0, Math.sin((t + off) * Math.PI * 2));
        const x = x0 + (cfg.particle === "stardust" ? t * 3 * S : 0), y = y0;
        const col = cfg.particle === "stardust" ? [E[5], C[4], [255, 255, 255] as RGB][i % 3] : E[5];
        if (tw > 0.2) put(x, y, col, 1);
        if (tw > 0.7 && big) { put(x + 1, y, E[3], 0.9); put(x - 1, y, E[3], 0.9); put(x, y + 1, E[3], 0.9); put(x, y - 1, E[3], 0.9); }
        break;
      }
      case "smoke": {
        const y = y0 - t * 11 * S, x = x0 + Math.sin(t * 4 + i) * 2 * S;
        const c = mix(C[1], C[2], t);
        const s = big ? Math.max(1, Math.round(1.5 * S)) : 1;
        for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) if ((a + b + frame) % 2 === 0 || s === 1) put(x + a, y + b, c, fade * 0.7, false);
        break;
      }
      case "endbits": {
        const x = x0 + Math.sin(i + t * 3) * 3 * S, y = y0 - t * 6 * S;
        const c = [C[4], E[4], C[2]][i % 3];
        put(x, y, c, fade); if (big) { put(x + 1, y, c, fade); put(x, y + 1, c, fade); put(x + 1, y + 1, c, fade); }
        break;
      }
      case "glyphs": {
        const y = y0 - t * 9 * S;
        const g = GLYPHS3[i % 8];
        for (let j = 0; j < 9; j++) if (g[j] === "1") put(x0 + (j % 3) - 1, y + Math.floor(j / 3) - 1, E[4], fade * 0.9);
        break;
      }
      case "drips": {
        const y = y0 + t * t * 14 * S;
        put(x0, y, C[3], fade); put(x0, y + 1, C[2], fade * 0.9);
        break;
      }
      case "pebbles": {
        const y = y0 + t * t * 12 * S, x = x0 + (i % 2 ? 1 : -1) * t * 3 * S;
        put(x, y, C[3], fade, false); if (big) put(x + 1, y, C[2], fade, false);
        break;
      }
      case "streaks": {
        const x = x0 + t * 12 * S - 6 * S, y = y0 - t * 3 * S;
        const len = Math.max(2, Math.round(3 * S));
        for (let j = 0; j < len; j++) put(x + j, y - j * 0.35, E[j === len - 1 ? 5 : 4], fade * (0.4 + (j / len) * 0.6), false);
        break;
      }
      case "feathers": {
        const x = x0 + Math.sin(t * 6 + i) * 4 * S, y = y0 + t * t * 11 * S;
        const rot = Math.sin(t * 4 + i) * 0.6;
        for (let j = -1; j <= 1; j++) {
          const px = x + j * Math.cos(rot) * 1.4 * S, py = y + j * Math.sin(rot) * 1.4 * S;
          put(px, py, j === 0 ? ramps.feather[5] : ramps.feather[3], fade, false);
        }
        break;
      }
      case "hearts": {
        const y = y0 - t * 12 * S, x = x0 + Math.sin(t * 5 + i) * 1.5 * S, hr = Math.max(1.2, 1.7 * S);
        box(ctx, x, y, hr * 1.5, (px, py, dx, dy) => {
          const nx = dx / hr, ny = (dy + hr * 0.12) / hr;
          if (Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny > 0) return;
          put(px - ctx.half, py - ctx.half, ny < -0.2 ? C[5] : C[3], fade);
        });
        break;
      }
      case "fireflies": {
        const tw = Math.max(0, Math.sin((t * 2 + off) * Math.PI * 3));
        if (tw < 0.25) break;
        const x = x0 + Math.sin(t * 7 + i * 2) * 5 * S, y = y0 + Math.cos(t * 5 + i) * 4 * S;
        put(x, y, [255, 255, 210], fade * tw);
        if (tw > 0.7 && big) { put(x + 1, y, E[4], fade * 0.5); put(x - 1, y, E[4], fade * 0.5); put(x, y + 1, E[4], fade * 0.5); put(x, y - 1, E[4], fade * 0.5); }
        break;
      }
      case "ashes": {
        const y = y0 + t * 9 * S, x = x0 + Math.sin(t * 4 + i) * 2.5 * S;
        put(x, y, mix([90, 84, 92], C[2], 0.35), fade * 0.85, false);
        if (big && rnd() > 0.5) put(x + 1, y, [70, 64, 72], fade * 0.7, false);
        break;
      }
      case "coins": {
        const y = y0 + t * t * 13 * S, x = x0 + (i % 2 ? 1 : -1) * t * 4 * S;
        const spin = Math.abs(Math.cos(t * 8 + i)), cr = Math.max(1, 1.4 * S);
        if (spin * cr < 0.35) break;
        for (let dy2 = -cr; dy2 <= cr; dy2++) for (let dx2 = -cr; dx2 <= cr; dx2++) {
          if ((dx2 / Math.max(0.4, cr * spin)) ** 2 + (dy2 / cr) ** 2 > 1) continue;
          put(x + dx2, y + dy2, dx2 < 0 ? ramps.gold[5] : ramps.gold[3], fade, false);
        }
        break;
      }
      case "notes": {
        const y = y0 - t * 12 * S, x = x0 + Math.sin(t * 5 + i) * 3 * S;
        const nr = Math.max(0.9, 1.1 * S);
        box(ctx, x, y, nr * 2, (px, py, dx, dy) => {
          const head = (dx / nr) ** 2 + (dy / (nr * 0.75)) ** 2 <= 1;
          const stem = Math.abs(dx - nr * 0.85) < Math.max(0.5, 0.5 * S) && dy < 0 && dy > -nr * 2.6;
          if (!head && !stem) return;
          put(px - ctx.half, py - ctx.half, head ? E[2] : E[4], fade);
        });
        break;
      }
      case "bolts": {
        if (hash(i, Math.floor(t * 4), cfg.seed + 3) < 0.6) break;
        let bx = x0, by = y0;
        const segs = big ? 5 : 3;
        for (let j = 0; j < segs; j++) {
          const nx2 = bx + (rnd() - 0.5) * 3 * S, ny2 = by + (1.4 + rnd()) * S;
          const steps = Math.max(1, Math.round(Math.hypot(nx2 - bx, ny2 - by)));
          for (let s2 = 0; s2 <= steps; s2++) put(bx + ((nx2 - bx) * s2) / steps, by + ((ny2 - by) * s2) / steps, s2 === 0 ? [255, 255, 255] : E[5], fade);
          bx = nx2; by = ny2;
        }
        break;
      }
      case "sand": {
        const y = y0 + t * t * 15 * S, x = x0 + (rnd() - 0.5) * 1.5 * S;
        put(x, y, E[4], fade, false);
        if (big) put(x + 1, y + 1, E[3], fade * 0.8, false);
        break;
      }
      case "crystalshards": {
        const y = y0 - t * 8 * S, x = x0 + Math.sin(t * 3 + i) * 2 * S;
        const sh = Math.max(1.4, 2.2 * S), sw = Math.max(0.7, 1 * S);
        box(ctx, x, y, sh, (px, py, dx, dy) => {
          if (Math.abs(dx) / sw + Math.abs(dy) / sh > 1) return;
          put(px - ctx.half, py - ctx.half, dx < 0 ? C[5] : C[3], fade);
        });
        break;
      }
      case "mote": {
        const tw = 0.4 + 0.6 * Math.abs(Math.sin((t + off) * Math.PI * 2));
        const x = x0 + Math.sin(t * 4 + i) * 2.2 * S, y = y0 - t * 5 * S;
        put(x, y, E[5], fade * tw);
        if (tw > 0.8 && big) put(x, y + 1, E[3], fade * 0.5);
        break;
      }
      case "glimmer": {
        const tw = Math.max(0, Math.sin((t * 1.5 + off) * Math.PI * 2));
        if (tw < 0.35) break;
        const x = x0, y = y0 - t * 6 * S;
        put(x, y, [255, 255, 255], fade * tw);
        if (tw > 0.7) { put(x + 1, y, E[4], fade * tw * 0.6); put(x - 1, y, E[4], fade * tw * 0.6); put(x, y + 1, E[4], fade * tw * 0.6); put(x, y - 1, E[4], fade * tw * 0.6); }
        break;
      }
      case "dustPuff": {
        const y = y0 - t * 4 * S, x = x0 + Math.sin(t * 3 + i) * 3 * S;
        const dr = Math.max(0.8, (1.0 + t * 0.8) * S);
        box(ctx, x, y, dr + 2, (px, py, dx, dy) => {
          const d = Math.hypot(dx * 1.25, dy);
          if (d > dr) return;
          put(px - ctx.half, py - ctx.half, ramps.energy[2], fade * 0.35, false);
        });
        break;
      }
      case "scatterSpark": {
        const tw = Math.max(0, Math.sin((t * 2 + off) * Math.PI * 2));
        if (tw < 0.3) break;
        const x = x0 + Math.sin(t * 5 + i * 2) * 3.5 * S, y = y0 + Math.cos(t * 4 + i) * 3 * S;
        const arm = Math.max(1, Math.round((0.7 + 1.1 * S) * tw));
        put(x, y, [255, 255, 255], fade * tw);
        for (let d = 1; d <= arm; d++) {
          const a = fade * tw * (1 - d / (arm + 1)) * 0.8;
          put(x + d, y, E[5], a); put(x - d, y, E[5], a); put(x, y + d, E[4], a); put(x, y - d, E[4], a);
        }
        break;
      }
    }
  }
}

/**
 * Plus-effect layer: ambient decoration spread over the whole canvas rather than
 * concentrated at the head. Three independent channels so they compose freely.
 *  - scatter: tiny energy/trim motes seeded across the full sprite
 *  - sparkle: 4-point star twinkles that fade in and out
 *  - drift:   slow vertical dust that settles along the shaft
 */
function drawPlusEffects(ctx: Ctx, L: ReturnType<typeof layout>) {
  const { cfg, N, S, ramps, phase, frame, F } = ctx;
  const total = (cfg.scatter + cfg.sparkle + cfg.drift) / 3;
  if (total <= 0.001) return;
  const rnd = mulberry(cfg.seed + 909);
  const sil = ctx.item.mask;
  const E = ramps.energy, T = ramps.trim;
  const put = (x: number, y: number, c: RGB, a: number, em: boolean) => {
    x = Math.floor(x + ctx.half); y = Math.floor(y + ctx.half);
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    // Plus effects sit behind the silhouette, like the glow layer.
    ctx.back.blend(x, y, c, a);
    if (em) ctx.emitX[y * N + x] = 1;
  };

  const scatterCount = Math.round((cfg.scatter / 100) * (14 + 16 * S));
  for (let i = 0; i < scatterCount; i++) {
    const px = rnd() * N, py = rnd() * N;
    const idx = (Math.floor(py) * N + Math.floor(px));
    if (sil[idx]) continue;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(phase * 1.6 + i * 2.3));
    if (tw < 0.4) continue;
    const c = i % 3 === 0 ? T[4] : E[i % 2 ? 3 : 5];
    put(px - ctx.half, py - ctx.half, c, 0.35 * tw, i % 3 !== 0);
  }

  const sparkleCount = Math.round((cfg.sparkle / 100) * (8 + 9 * S));
  for (let i = 0; i < sparkleCount; i++) {
    const px = rnd() * N, py = rnd() * N;
    if (sil[Math.floor(py) * N + Math.floor(px)]) continue;
    const tw = Math.max(0, Math.sin((frame / F) * Math.PI * 2 + i * 1.7));
    if (tw < 0.45) continue;
    const arm = Math.max(1, Math.round((0.6 + 1.3 * S) * tw));
    const a = 0.75 * tw;
    put(px - ctx.half, py - ctx.half, [255, 255, 255], a, true);
    for (let d = 1; d <= arm; d++) {
      const ad = a * (1 - d / (arm + 1)) * 0.85;
      put(px - ctx.half + d, py - ctx.half, E[5], ad, true);
      put(px - ctx.half - d, py - ctx.half, E[5], ad, true);
      put(px - ctx.half, py - ctx.half + d, E[4], ad, true);
      put(px - ctx.half, py - ctx.half - d, E[4], ad, true);
    }
  }

  const driftCount = Math.round((cfg.drift / 100) * (10 + 12 * S));
  for (let i = 0; i < driftCount; i++) {
    const aLocal = L.aStart + rnd() * Math.max(1, L.aH - L.aStart);
    const side = rnd() < 0.5 ? -1 : 1;
    const off2 = (k2(cfg) / 2 + 0.6 + rnd() * 2.4) * S * side;
    const [bx, by] = toScreen(aLocal, off2);
    const drift = (frame / F + rnd()) % 1;
    const x = bx + Math.sin(drift * Math.PI * 2 + i) * 1.6 * S;
    const y = by + drift * 10 * S;
    const px = x, py = y;
    if (sil[Math.floor(py) * N + Math.floor(px)]) continue;
    const fade = Math.sin(drift * Math.PI);
    put(px - ctx.half, py - ctx.half, E[3], 0.4 * fade, false);
    if (rnd() > 0.6) put(px - ctx.half + 1, py - ctx.half, E[2], 0.3 * fade, false);
  }
}

const k2 = (cfg: Config) => Math.max(1, Math.round(cfg.thickness));

/** Material finishing is applied only to the opaque item silhouette, never to background FX. */
function finishItem(ctx: Ctx, L: ReturnType<typeof layout>) {
  const { cfg, N, S, item, ramps } = ctx;
  const gold = ramps.gold;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    if (!item.mask[i] || item.em[i]) continue;
    const a = (x - y) / SQ2;
    const onShaft = a > L.aStart + S && a < L.aCollar - 3 * S;
    const nearCrown = a > L.aCollar - 3 * S && a < L.coreA + L.R;
    const cluster = hash(Math.floor(x / Math.max(1, S * 2)), Math.floor(y / Math.max(1, S * 2)), cfg.seed + 77);
    let color: RGB | null = null;
    switch (cfg.finish) {
      case "vanilla": {
        const current = [item.col[i * 3], item.col[i * 3 + 1], item.col[i * 3 + 2]] as RGB;
        // Quantize to the nearest of three deliberate material steps; no smooth noise.
        const choices = onShaft ? [ramps.shaft[1], ramps.shaft[3], ramps.shaft[5]] : [ramps.trim[1], ramps.trim[3], ramps.trim[5]];
        let best = Infinity;
        for (const candidate of choices) {
          const diff = Math.abs(candidate[0] - current[0]) + Math.abs(candidate[1] - current[1]) + Math.abs(candidate[2] - current[2]);
          if (diff < best) { best = diff; color = candidate; }
        }
        break;
      }
      case "forged": {
        if (onShaft && cluster > 0.91) color = ramps.shaft[1];
        else if (nearCrown && (x + y) % Math.max(3, Math.round(5 * S)) === 0 && cluster > 0.6) color = ramps.trim[5];
        break;
      }
      case "weathered": {
        if (onShaft && cluster > 0.65) color = ramps.shaft[1];
        else if (onShaft && cluster < 0.12) color = ramps.shaft[4];
        break;
      }
      case "engraved": {
        if (onShaft && cfg.thickness >= 2 && (x + y + cfg.seed) % Math.max(5, Math.round(7 * S)) === 0 && cluster > 0.42) color = ramps.trim[4];
        if (nearCrown && cluster > 0.94) color = ramps.trim[5];
        break;
      }
      case "gilded": {
        if (onShaft && (x - y + cfg.seed) % Math.max(8, Math.round(12 * S)) === 0 && cluster > 0.35) color = gold[4];
        else if (nearCrown && cluster > 0.9) color = gold[5];
        break;
      }
      case "runic": {
        if (onShaft && cfg.thickness >= 2 && (x - y + cfg.seed) % Math.max(7, Math.round(10 * S)) < 2 && cluster > 0.5) {
          color = ramps.energy[4];
          item.em[i] = 1;
        }
        break;
      }
    }
    if (color) for (let k = 0; k < 3; k++) item.col[i * 3 + k] = color[k];
  }
}

// ---------- main render ----------
export type RenderMode = "normal" | "emissive";

export function renderFrame(cfg: Config, frame = 0, mode: RenderMode = "normal"): ImageData {
  const ctx = makeCtx(cfg, frame);
  const { N, S, item, ramps, phase } = ctx;
  const L = layout(ctx);

  drawShaft(ctx, L);
  drawMount(ctx, L, "back");
  drawArtifactForm(ctx, L, "back");
  drawOrnament(ctx, L, "back");
  if (cfg.core !== "none") drawCore(ctx, L);
  drawGemCut(ctx, L);
  drawOrnament(ctx, L, "front");
  drawArtifactForm(ctx, L, "front");
  drawMount(ctx, L, "front");
  // Plus effects are drawn before finishing so they never overwrite the item itself.
  drawPlusEffects(ctx, L);

  // energy trail spiraling around the upper shaft
  if (cfg.trail) {
    const t0 = Math.ceil((L.aStart + (L.aH - L.aStart) * 0.35) * SQ2), t1 = Math.floor((L.aH - L.R * 0.6) * SQ2);
    const k = cfg.thickness;
    for (const off of [0, Math.PI]) {
      for (let tt = t0; tt <= t1; tt++) {
        const ang = tt * (0.5 / Math.max(1, S)) - phase * 2 + off;
        const bd = Math.round(bendOffset(cfg.shape, Math.max(0, Math.min(1, (tt / SQ2 - L.aStart) / Math.max(0.001, L.span))), S, cfg.seed));
        let c = Math.round(Math.sin(ang) * (k / 2 + 1.6)) + bd;
        if ((((tt + c + N - 1) % 2) + 2) % 2 !== 0) c += 1;
        const x = (tt + c + N - 1) / 2, y = x - tt;
        const prog = (tt - t0) / Math.max(1, t1 - t0);
        const front = Math.cos(ang) > 0;
        const a = (0.35 + 0.65 * prog) * (front ? 1 : 0.55);
        (front ? ctx.front : ctx.back).blend(x, y, ramps.energy[prog > 0.6 ? 5 : 4], a);
        if (front && prog > 0.3) ctx.emitX[y * N + x] = 1;
      }
    }
  }

  drawFloaters(ctx, L);
  finishItem(ctx, L);

  // rim light (backlight from bottom-right in energy color)
  if (cfg.rimLight) {
    const rim = ramps.energy[4];
    const orig = item.mask.slice();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (!orig[i] || item.em[i]) continue;
      const r = x + 1 >= N || !orig[i + 1], d = y + 1 >= N || !orig[i + N];
      if (r || d) {
        const t = r && d ? 0.7 : 0.45;
        for (let kk = 0; kk < 3; kk++) item.col[i * 3 + kk] = item.col[i * 3 + kk] + (rim[kk] - item.col[i * 3 + kk]) * t;
      }
    }
  }

  // enchant glint
  if (cfg.glint) {
    const period = N * 1.6, bw = 6 * S;
    const gl: RGB = mix(hexToRgb("#a46bff"), ramps.energy[5], 0.35);
    const shift = (frame / ctx.F) * period;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (!item.mask[i]) continue;
      for (const [o, str] of [[0, 0.55], [period / 2, 0.3]] as const) {
        const m = ((((x + y * 0.5 - shift + o) % period) + period) % period);
        if (m < bw) {
          const it = 1 - Math.abs(m - bw / 2) / (bw / 2);
          for (let kk = 0; kk < 3; kk++) item.col[i * 3 + kk] += (Math.min(255, gl[kk] + 60) - item.col[i * 3 + kk]) * it * str;
        }
      }
    }
  }

  // outline
  const olMask = new Uint8Array(N * N), olCol = new Float32Array(N * N * 3);
  if (cfg.outline !== "none") {
    const black: RGB = [18, 13, 24];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (item.mask[i]) continue;
      const lft = x > 0 && item.mask[i - 1], rgt = x < N - 1 && item.mask[i + 1];
      const up = y > 0 && item.mask[i - N], dn = y < N - 1 && item.mask[i + N];
      if (!lft && !rgt && !up && !dn) continue;
      olMask[i] = 1;
      let src = -1, lit = false;
      if (lft) src = i - 1; else if (up) src = i - N; else if (rgt) { src = i + 1; lit = true; } else if (dn) { src = i + N; lit = true; }
      if (cfg.outline === "black") { olCol.set(black, i * 3); continue; }
      // selout = lit outline uses a brightened, slightly energy-tinted line rather than a dark one
      if (cfg.outline === "selout" && lit) {
        for (let kk = 0; kk < 3; kk++) olCol[i * 3 + kk] = Math.min(255, item.col[src * 3 + kk] * 0.85 + 40);
      } else {
        const arr = item.ol;
        for (let kk = 0; kk < 3; kk++) olCol[i * 3 + kk] = arr[src * 3 + kk] * 0.88;
      }
    }
  }
  const sil = (i: number) => item.mask[i] || olMask[i];

  // glow via chamfer distance transform from emissive pixels
  if (cfg.glow > 0) {
    const INF = 1e9, d = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) d[i] = item.em[i] || ctx.emitX[i] ? 0 : INF;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x; let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 3);
      if (y > 0) { v = Math.min(v, d[i - N] + 3); if (x > 0) v = Math.min(v, d[i - N - 1] + 4); if (x < N - 1) v = Math.min(v, d[i - N + 1] + 4); }
      d[i] = v;
    }
    for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) {
      const i = y * N + x; let v = d[i];
      if (x < N - 1) v = Math.min(v, d[i + 1] + 3);
      if (y < N - 1) { v = Math.min(v, d[i + N] + 3); if (x < N - 1) v = Math.min(v, d[i + N + 1] + 4); if (x > 0) v = Math.min(v, d[i + N - 1] + 4); }
      d[i] = v;
    }
    // Keep the halo close to the silhouette so the gem stays the brightest point.
    const rpx = Math.min(cfg.glowRadius, 9) * S * 0.72;
    const str = (cfg.glow / 100) * 0.62 * (cfg.pulse ? 0.88 + 0.12 * Math.sin(phase) : 1);
    const levels = 3;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (sil(i)) continue;
      const dist = d[i] / 3;
      if (dist <= 0 || dist > rpx) continue;
      const fall = 1 - dist / rpx;
      const a = str * Math.pow(fall, 2.1) * 0.8;
      const q = a * levels;
      const aq = (cfg.dither ? Math.floor(q + BAYER4[((y % 4) * 4) + (x % 4)]) : Math.round(q)) / levels;
      if (aq <= 0) continue;
      ctx.back.blend(x, y, mix(ramps.energy[3], ramps.energy[5], fall), aq);
    }
  }

  // radiance rays behind the core
  if (cfg.rays && cfg.core !== "none") {
    const [rcx, rcy] = toScreen(L.coreA, 0);
    // Short, sparse rays read as a highlight rather than a background burst.
    const Rr = Math.min(N * 0.3, L.R * 1.35 + cfg.glowRadius * S * 0.45, 15 * S);
    const count = 4;
    const offset = phase * 0.25;
    for (let i = 0; i < count; i++) {
      const mid = (i / count) * Math.PI * 2 + offset;
      const angW = 0.032 + 0.02 * Math.sin(phase * 1.7 + i);
      const len = Rr * (0.7 + 0.3 * (0.5 + 0.5 * Math.sin(phase + i * 1.3)));
      box(ctx, rcx, rcy, Rr + 1, (x, y, dx, dy) => {
        const d = Math.hypot(dx, dy);
        if (d < L.R * 0.9 || d > len) return;
        const a = Math.atan2(dy, dx);
        let da = Math.abs(((a - mid + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        // mirror so rays are symmetric
        if (da > Math.PI / 2) da = Math.PI - da;
        if (da > angW * (1 - d / len * 0.4)) return;
        const fall = 1 - d / len;
        const aQ = fall * 0.4;
        const thresh = BAYER4[((y % 4) * 4) + (x % 4)];
        if (cfg.dither && aQ < thresh * 0.9) return;
        ctx.back.blend(x, y, ramps.energy[fall > 0.55 ? 5 : 4], Math.min(0.4, aQ));
      });
    }
  }

  // aura silhouette
  if (cfg.aura) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (sil(i)) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < N && yy < N && sil(yy * N + xx)) { near = true; break; }
      }
      if (!near) continue;
      const sh = 0.5 + 0.5 * Math.sin((x - y) * (0.45 / S) + phase * 2);
      ctx.back.blend(x, y, ramps.energy[sh > 0.6 ? 5 : 4], 0.22 + sh * 0.26);
    }
  }

  // magic circle
  if (cfg.magicCircle) {
    const [cx, cy] = toScreen(L.coreA, 0);
    const Rc = L.R + 6 * S, th = Math.max(0.5, 0.55 * S);
    const rot = phase / 8;
    box(ctx, cx, cy, Rc + 1, (x, y, dx, dy) => {
      const d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
      // Two thin rings read as a sigil; the old radial spokes filled the whole disc.
      let on = false, a = 0.44;
      if (Math.abs(d - Rc) <= th) on = true;
      else if (Math.abs(d - Rc * 0.7) <= th * 0.8 && Math.sin((ang + rot) * 12) > 0.25) { on = true; a = 0.32; }
      if (on) ctx.back.blend(x, y, ramps.energy[4], a);
    });
  }

  drawParticles(ctx, L);

  // Plus-effect sparkle overlay on the silhouette itself (unlike the background layer)
  if (cfg.sparkle > 0) {
    const tw = Math.max(0, Math.sin(phase * 2.2));
    if (tw > 0.5) {
      const rnd2 = mulberry(cfg.seed + 313);
      const nSpark = Math.round((cfg.sparkle / 100) * (5 + 6 * S));
      for (let i = 0; i < nSpark; i++) {
        const px = Math.floor(rnd2() * N), py = Math.floor(rnd2() * N);
        if (!item.mask[py * N + px]) continue;
        const arm = Math.max(1, Math.round((0.5 + 1.1 * S) * tw));
        const a = tw * 0.8;
        ctx.front.blend(px, py, [255, 255, 255], a);
        for (let d = 1; d <= arm; d++) {
          const ad = a * (1 - d / (arm + 1)) * 0.8;
          ctx.front.blend(px + d, py, ramps.energy[5], ad);
          ctx.front.blend(px - d, py, ramps.energy[5], ad);
          ctx.front.blend(px, py + d, ramps.energy[4], ad);
          ctx.front.blend(px, py - d, ramps.energy[4], ad);
        }
      }
    }
  }

  // gem sparkle (jeweler's cross-star flare + secondary facet glint)
  if (cfg.pulse && cfg.core !== "none") {
    const tw = Math.sin(phase);
    if (tw > 0.12) {
      const [sx, sy] = toScreen(L.coreA + L.R * 0.45, -L.R * 0.35);
      const X = Math.floor(sx + ctx.half), Y = Math.floor(sy + ctx.half);
      const arm = Math.max(1, Math.round(tw * 2.8 * S));
      ctx.front.blend(X, Y, [255, 255, 255], 1);
      for (let dd = 1; dd <= arm; dd++) {
        const a = (1 - dd / (arm + 1)) * 0.85;
        const col = dd === 1 ? ([255, 255, 255] as RGB) : ramps.energy[5];
        ctx.front.blend(X + dd, Y, col, a); ctx.front.blend(X - dd, Y, col, a);
        ctx.front.blend(X, Y + dd, col, a); ctx.front.blend(X, Y - dd, col, a);
      }
      const diag = Math.max(1, Math.floor(arm * 0.45));
      for (let dd = 1; dd <= diag; dd++) {
        const a = (1 - dd / (diag + 1)) * 0.55;
        ctx.front.blend(X + dd, Y + dd, ramps.energy[5], a);
        ctx.front.blend(X - dd, Y - dd, ramps.energy[5], a);
        ctx.front.blend(X + dd, Y - dd, ramps.energy[5], a);
        ctx.front.blend(X - dd, Y + dd, ramps.energy[5], a);
      }
    }
    const tw2 = Math.sin(phase - 1.8);
    if (tw2 > 0.35) {
      const [sx2, sy2] = toScreen(L.coreA - L.R * 0.28, L.R * 0.32);
      const X2 = Math.floor(sx2 + ctx.half), Y2 = Math.floor(sy2 + ctx.half);
      ctx.front.blend(X2, Y2, [255, 255, 255], 0.9);
      ctx.front.blend(X2 + 1, Y2, ramps.energy[5], 0.55);
      ctx.front.blend(X2 - 1, Y2, ramps.energy[5], 0.55);
      ctx.front.blend(X2, Y2 + 1, ramps.energy[5], 0.55);
      ctx.front.blend(X2, Y2 - 1, ramps.energy[5], 0.55);
    }
  }

  // composite into an intermediate float buffer so we can apply sub-pixel AA
  const comp = new Float32Array(N * N * 4);
  const bd = ctx.back.data, fd = ctx.front.data;
  for (let i = 0; i < N * N; i++) {
    let r = bd[i * 4], g = bd[i * 4 + 1], b = bd[i * 4 + 2], a = bd[i * 4 + 3];
    if (item.mask[i]) { r = item.col[i * 3]; g = item.col[i * 3 + 1]; b = item.col[i * 3 + 2]; a = 1; }
    else if (olMask[i]) { r = olCol[i * 3]; g = olCol[i * 3 + 1]; b = olCol[i * 3 + 2]; a = 1; }
    const fa = fd[i * 4 + 3];
    if (fa > 0) {
      const oa = fa + a * (1 - fa);
      r = (fd[i * 4] * fa + r * a * (1 - fa)) / oa; g = (fd[i * 4 + 1] * fa + g * a * (1 - fa)) / oa; b = (fd[i * 4 + 2] * fa + b * a * (1 - fa)) / oa; a = oa;
    }
    comp[i * 4] = r; comp[i * 4 + 1] = g; comp[i * 4 + 2] = b; comp[i * 4 + 3] = a;
  }

  // Manual coverage AA on outer corners (classic pixel-art technique):
  // if a transparent pixel is diagonally cornered by the silhouette and has no edge-adjacent neighbours,
  // and its diagonal neighbours match, add a 50%-alpha pixel to smooth the staircase.
  if (cfg.aa) {
    const soft = new Float32Array(N * N * 4);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (comp[i * 4 + 3] > 0.05) continue;
      const hasN = y > 0 && comp[(i - N) * 4 + 3] > 0.5;
      const hasS = y < N - 1 && comp[(i + N) * 4 + 3] > 0.5;
      const hasW = x > 0 && comp[(i - 1) * 4 + 3] > 0.5;
      const hasE = x < N - 1 && comp[(i + 1) * 4 + 3] > 0.5;
      const diagCount = (hasN ? 1 : 0) + (hasS ? 1 : 0) + (hasW ? 1 : 0) + (hasE ? 1 : 0);
      if (diagCount !== 1) continue;
      const dx = hasE ? 1 : hasW ? -1 : 0;
      const dy = hasS ? 1 : hasN ? -1 : 0;
      if (dx === 0 || dy === 0) continue;
      const sI = (y + dy) * N + (x + dx);
      const sR = comp[sI * 4], sG = comp[sI * 4 + 1], sB = comp[sI * 4 + 2];
      // confirm opposite-side corner is also transparent so this is an outer corner
      const oppX = x + dx, oppY = y + dy;
      if (oppX < 0 || oppY < 0 || oppX >= N || oppY >= N) continue;
      const nx = y * N + (x + dx), ny = (y + dy) * N + x;
      const aNx = comp[nx * 4 + 3] > 0.5, aNy = comp[ny * 4 + 3] > 0.5;
      if (aNx || aNy) continue;
      soft[i * 4] = sR; soft[i * 4 + 1] = sG; soft[i * 4 + 2] = sB; soft[i * 4 + 3] = 0.48;
    }
    for (let i = 0; i < N * N; i++) {
      const sa = soft[i * 4 + 3];
      if (sa <= 0) continue;
      const oa = sa + comp[i * 4 + 3] * (1 - sa);
      for (let k = 0; k < 3; k++) comp[i * 4 + k] = (soft[i * 4 + k] * sa + comp[i * 4 + k] * comp[i * 4 + 3] * (1 - sa)) / Math.max(0.0001, oa);
      comp[i * 4 + 3] = oa;
    }
  }

  const img = new ImageData(N, N);
  const out = img.data;
  for (let i = 0; i < N * N; i++) {
    let r = comp[i * 4], g = comp[i * 4 + 1], b = comp[i * 4 + 2], a = comp[i * 4 + 3];

    // Emissive mode is a real OptiFine/Iris glow map: only self-lit pixels survive, at full
    // brightness, so the gem and runes keep glowing in caves while the wooden shaft goes dark.
    if (mode === "emissive") {
      const lit = item.em[i] === 1 || ctx.emitX[i] === 1;
      if (!lit || a < 0.12) { out[i * 4 + 3] = 0; continue; }
      const boost = 1 / Math.max(0.35, a);
      out[i * 4] = Math.min(255, (r + 32) * boost);
      out[i * 4 + 1] = Math.min(255, (g + 32) * boost);
      out[i * 4 + 2] = Math.min(255, (b + 32) * boost);
      out[i * 4 + 3] = 255;
      continue;
    }

    out[i * 4] = Math.max(0, Math.min(255, r));
    out[i * 4 + 1] = Math.max(0, Math.min(255, g));
    out[i * 4 + 2] = Math.max(0, Math.min(255, b));
    out[i * 4 + 3] = Math.max(0, Math.min(255, Math.round(a * 255)));
  }
  return img;
}

export function frameToCanvas(img: ImageData, scale = 1): HTMLCanvasElement {
  const base = document.createElement("canvas");
  base.width = img.width; base.height = img.height;
  base.getContext("2d")!.putImageData(img, 0, 0);
  if (scale === 1) return base;
  const c = document.createElement("canvas");
  c.width = img.width * scale; c.height = img.height * scale;
  const x = c.getContext("2d")!;
  x.imageSmoothingEnabled = false;
  x.drawImage(base, 0, 0, c.width, c.height);
  return c;
}

export function renderSheet(cfg: Config, scale = 1): HTMLCanvasElement {
  const N = cfg.size * scale, F = cfg.frames;
  const c = document.createElement("canvas");
  c.width = N; c.height = N * F;
  const x = c.getContext("2d")!;
  x.imageSmoothingEnabled = false;
  for (let f = 0; f < F; f++) x.drawImage(frameToCanvas(renderFrame(cfg, f), scale), 0, f * N);
  return c;
}

