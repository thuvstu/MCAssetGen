import {
  A,
  adjustLight,
  blendPx,
  getPx,
  hash2,
  hsl,
  makePix,
  mix,
  noise2,
  Pix,
  R,
  G,
  B,
  rgbToHsl,
  rgba,
  setPx,
  withAlpha,
  mulberry32,
  shiftHue,
  luminance,
} from "./core";
import { getMaterial, Material, Ramp } from "./palettes";
import { getShape, MatKey, Part, Role, Shape, ShapeParams } from "./shapes";

export type Style = "vanilla" | "furfsky" | "imperial" | "hypixelplus" | "painterly";
export type GradientMode = "none" | "length" | "width" | "tip" | "rainbow" | "twoTone" | "radial" | "fire";

export type GenSettings = {
  shape: string;
  material: string;
  material2: string;
  size: 16 | 32 | 64;
  style: Style;
  params: ShapeParams;
  decorations: string[];
  gradient: GradientMode;
  gradientStrength: number; // 0..1
  seed: number;
  outline: number; // 0..1
  glow: number; // 0..1 aura strength
  hueShift: number; // -0.5..0.5 global
  saturation: number; // -0.5..0.5
  brightness: number; // -0.3..0.3
};

export const DEFAULT_SETTINGS: GenSettings = {
  shape: "sword",
  material: "ruby",
  material2: "gold",
  size: 32,
  style: "furfsky",
  params: { width: 1, length: 1, guard: 1, ornate: 2, curve: 0.5 },
  decorations: ["gems", "runes"],
  gradient: "tip",
  gradientStrength: 0.5,
  seed: 1,
  outline: 0.7,
  glow: 0.3,
  hueShift: 0,
  saturation: 0,
  brightness: 0,
};

export const ROLE_LIST: Role[] = [
  "blade", "edge", "core", "guard", "grip", "pommel", "gem", "orb", "string", "wood", "metal",
  "trim", "glow", "barrel", "page", "cover", "ring", "spike", "head",
];

export type RenderResult = {
  pix: Pix;
  /** role index + 1 per pixel (0 = empty) */
  roles: Uint8Array;
  /** relative depth 0..1 per pixel for 3D reconstruction */
  depth: Float32Array;
  /** glow intensity 0..1 per pixel (gems, glow parts, aura) */
  glow: Float32Array;
  /** normalized position along weapon axis 0..1 */
  tN: Float32Array;
  uN: Float32Array;
  /** light-side factor -1..1 */
  light: Float32Array;
  material: Material;
  shape: Shape;
  settings: GenSettings;
};

type Mapper = {
  S: number;
  scale: number;
  toW: (x: number, y: number) => [number, number];
  toP: (t: number, u: number) => [number, number];
};

export function makeMapper(S: number, orientation: Shape["orientation"]): Mapper {
  const scale = S / 16;
  const k = Math.SQRT1_2;
  if (orientation === "diagonal") {
    return {
      S,
      scale,
      toW: (x, y) => [(k * (x + S - y)) / scale, (k * (x + y + 1 - S) + 0.3536) / scale],
      toP: (t, u) => {
        const a = (t * scale) / k;
        const b = (u * scale - 0.3536) / k;
        const x = (a + b - 1) / 2;
        return [x, x + S - a];
      },
    };
  }
  return {
    S,
    scale,
    toW: (x, y) => [(S - (y + 0.5)) / scale, (x + 0.5 - S / 2) / scale],
    toP: (t, u) => [u * scale + S / 2 - 0.5, S - t * scale - 0.5],
  };
}

function pointInPoly(pts: [number, number][], t: number, u: number): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [ti, ui] = pts[i];
    const [tj, uj] = pts[j];
    if (ui > u !== uj > u && t < ((tj - ti) * (u - ui)) / (uj - ui) + ti) inside = !inside;
  }
  return inside;
}

/** sample ramp with fractional index (0..6) */
export function rampAt(r: Ramp, idx: number): number {
  idx = Math.max(0, Math.min(6, idx));
  const i = Math.floor(idx);
  const f = idx - i;
  if (i >= 6 || f < 0.01) return r[Math.min(6, i)];
  return mix(r[i], r[i + 1], f);
}

function matRamp(m: Material, key: MatKey): Ramp {
  switch (key) {
    case "primary":
      return m.primary;
    case "secondary":
      return m.secondary;
    case "grip":
      return m.grip;
    case "gem":
      return m.gem;
    case "glow": {
      const g = m.glow;
      return [adjustLight(g, -0.3), adjustLight(g, -0.2), adjustLight(g, -0.1), g, adjustLight(g, 0.1), adjustLight(g, 0.2), adjustLight(g, 0.3)];
    }
  }
}

type Hit = {
  part: Part;
  un: number; // -1..1 across
  tn: number; // 0..1 along part
  dn: number; // 0..1 radial (discs)
  t: number;
  u: number;
};

function hitTest(parts: Part[], t: number, u: number): Hit | null {
  let best: Hit | null = null;
  for (const part of parts) {
    if (best && part.z < best.part.z) continue;
    if (part.kind === "profile") {
      if (t < part.t0 || t > part.t1) continue;
      const hw = part.hw(t);
      if (hw <= 0) continue;
      const off = part.uOff ? part.uOff(t) : 0;
      const du = u - off;
      if (Math.abs(du) > hw) continue;
      const h: Hit = { part, un: du / hw, tn: (t - part.t0) / (part.t1 - part.t0), dn: Math.abs(du / hw), t, u };
      if (!best || part.z >= best.part.z) best = h;
    } else if (part.kind === "disc") {
      const dt = t - part.t,
        du = u - part.u;
      const d = Math.hypot(dt, du);
      if (d > part.r) continue;
      if (part.r2 !== undefined && d < part.r2) continue;
      const h: Hit = { part, un: du / part.r, tn: dt / part.r, dn: d / part.r, t, u };
      if (!best || part.z >= best.part.z) best = h;
    } else {
      if (!pointInPoly(part.pts, t, u)) continue;
      let tmin = Infinity, tmax = -Infinity, umin = Infinity, umax = -Infinity;
      for (const [pt, pu] of part.pts) {
        tmin = Math.min(tmin, pt); tmax = Math.max(tmax, pt); umin = Math.min(umin, pu); umax = Math.max(umax, pu);
      }
      const cu = (umin + umax) / 2;
      const h: Hit = {
        part,
        un: ((u - cu) / ((umax - umin) / 2 || 1)),
        tn: (t - tmin) / (tmax - tmin || 1),
        dn: 0.5,
        t,
        u,
      };
      if (!best || part.z >= best.part.z) best = h;
    }
  }
  return best;
}

export function renderWeapon(settings: GenSettings): RenderResult {
  const S = settings.size;
  const shape = getShape(settings.shape);
  const mat = getMaterial(settings.material);
  const mat2 = getMaterial(settings.material2);
  const parts = shape.parts(settings.params);
  const map = makeMapper(S, shape.orientation);
  const pix = makePix(S, S);
  const n = S * S;
  const roles = new Uint8Array(n);
  const depth = new Float32Array(n);
  const glow = new Float32Array(n);
  const tN = new Float32Array(n);
  const uN = new Float32Array(n);
  const light = new Float32Array(n);
  const hits: (Hit | null)[] = new Array(n).fill(null);
  const partIdx = new Int16Array(n).fill(-1);
  const rng = mulberry32(settings.seed);

  // extent
  let tMin = Infinity, tMax = -Infinity;
  for (const p of parts) {
    if (p.kind === "profile") { tMin = Math.min(tMin, p.t0); tMax = Math.max(tMax, p.t1); }
    else if (p.kind === "disc") { tMin = Math.min(tMin, p.t - p.r); tMax = Math.max(tMax, p.t + p.r); }
    else for (const [pt] of p.pts) { tMin = Math.min(tMin, pt); tMax = Math.max(tMax, pt); }
  }
  const tSpan = tMax - tMin || 1;

  // pass 1: hit test
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const [t, u] = map.toW(x, y);
      const h = hitTest(parts, t, u);
      if (!h) continue;
      const i = y * S + x;
      hits[i] = h;
      partIdx[i] = parts.indexOf(h.part);
      roles[i] = ROLE_LIST.indexOf(h.part.role) + 1;
      depth[i] = h.part.depth;
      tN[i] = (t - tMin) / tSpan;
      uN[i] = Math.max(-1, Math.min(1, h.un));
    }

  // pass 2: per-pixel edge info (same-part neighbors)
  const same = (i: number, x: number, y: number) =>
    x >= 0 && y >= 0 && x < S && y < S && partIdx[y * S + x] === partIdx[i];
  const silhouette = new Uint8Array(n); // 1 = touches transparent
  const innerEdge = new Uint8Array(n); // 1 = touches other part
  const edgeDir = new Float32Array(n); // -1 lit edge ... +1 shadow edge
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const i = y * S + x;
      if (partIdx[i] < 0) continue;
      let lit = 0, dark = 0;
      const check = (dx: number, dy: number, w: number) => {
        const nx = x + dx, ny = y + dy;
        const inBounds = nx >= 0 && ny >= 0 && nx < S && ny < S;
        const empty = !inBounds || partIdx[ny * S + nx] < 0;
        if (empty) silhouette[i] = 1;
        else if (!same(i, nx, ny)) innerEdge[i] = 1;
        if (!same(i, nx, ny)) {
          if (w < 0) lit += -w; else dark += w;
        }
      };
      check(-1, 0, -1); check(0, -1, -1); check(1, 0, 1); check(0, 1, 1);
      check(-1, -1, -0.5); check(1, 1, 0.5);
      edgeDir[i] = Math.max(-1, Math.min(1, (dark - lit) * 0.5));
    }

  const scaleF = map.scale;
  const style = settings.style;

  // pass 3: shading
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const i = y * S + x;
      const h = hits[i];
      if (!h) continue;
      const part = h.part;
      let idx = 3; // ramp index
      let lightF = -h.un; // positive = lit
      let isGlow = 0;
      const tn = tN[i];
      switch (part.shade) {
        case "blade": {
          idx = 3.3 + (-h.un) * 1.4;
          if (h.un < -0.55) idx += 0.8; // bevel highlight
          if (h.tn > 0.82) idx += (h.tn - 0.82) * 4; // tip brightening
          break;
        }
        case "metal": {
          idx = 3 + (-edgeDir[i]) * 1.4 + (-h.un) * 0.6;
          if (!silhouette[i] && !innerEdge[i]) idx += 0.3;
          break;
        }
        case "round": {
          const a = -h.un; // -1..1
          idx = 3 + (a > 0 ? a * 2.1 : a * 2.4);
          break;
        }
        case "wood": {
          const a = -h.un;
          idx = 3 + (a > 0 ? a * 1.6 : a * 2.0);
          const grain = hash2(Math.floor(h.t * 1.8), Math.floor(h.un * 2.5), settings.seed);
          idx += grain > 0.72 ? -0.9 : grain < 0.2 ? 0.5 : 0;
          break;
        }
        case "flat": {
          idx = 3.2 + (-edgeDir[i]) * 0.6;
          break;
        }
        case "gem": {
          const dx = h.un + 0.38, dy = h.tn - 0.38; // highlight toward top-left (negative u, higher t)
          const hd = Math.hypot(dx, dy);
          idx = h.dn > 0.86 ? 1.2 : h.dn > 0.62 ? 2.4 : 3.6;
          if (hd < 0.3) idx = 6;
          else if (hd < 0.52) idx = 5;
          const dx2 = h.un - 0.35, dy2 = h.tn + 0.4;
          if (Math.hypot(dx2, dy2) < 0.22) idx = Math.max(idx, 4.6);
          lightF = -h.un * 0.5;
          isGlow = part.role === "gem" || part.role === "orb" ? 0.8 : 0.3;
          break;
        }
        case "glow": {
          idx = 5.2 - h.dn * 1.5;
          isGlow = 1;
          break;
        }
      }
      // gradient along length modifies ramp index / color
      const ramp = matRamp(mat, part.mat);
      let col: number;
      const gs = settings.gradientStrength;
      const g = settings.gradient;
      const isMain = part.mat === "primary";
      if (g === "twoTone" && isMain) {
        const r2 = matRamp(mat2, "primary");
        const f = Math.pow(tn, 1.2);
        col = mix(rampAt(ramp, idx), rampAt(r2, idx), f * gs);
      } else if (g === "rainbow" && isMain) {
        const base = rampAt(ramp, idx);
        const [, , l] = rgbToHsl(R(base), G(base), B(base));
        const hue = tn * 1.0 + (-h.un) * 0.08;
        col = mix(base, hsl(hue, 0.85, Math.min(0.9, l)), gs);
      } else if (g === "length" && isMain) {
        col = rampAt(ramp, idx + (tn - 0.5) * 2.4 * gs);
      } else if (g === "width" && isMain) {
        col = rampAt(ramp, idx + (-h.un) * 1.6 * gs);
      } else if (g === "tip" && isMain) {
        const f = Math.pow(tn, 2.4);
        col = rampAt(ramp, idx + f * 2.2 * gs);
        col = mix(col, mat.gem[5], f * gs * 0.45);
      } else if (g === "radial" && isMain) {
        const f = Math.abs(tn - 0.5) * 2;
        col = rampAt(ramp, idx + (1 - f) * 1.6 * gs);
      } else if (g === "fire" && isMain) {
        const nz = noise2(x / scaleF * 0.9, y / scaleF * 0.9, settings.seed) * 0.6 + tn * 0.6;
        col = mix(rampAt(ramp, idx), hsl(0.02 + nz * 0.12, 0.95, 0.35 + nz * 0.4), gs * 0.8);
      } else {
        col = rampAt(ramp, idx);
      }
      if (mat.rainbow && isMain && g !== "rainbow") {
        const [, , l] = rgbToHsl(R(col), G(col), B(col));
        col = mix(col, hsl(tn * 0.9 + (-h.un) * 0.1, 0.8, Math.min(0.92, l)), 0.75);
      }
      // style finishing
      col = applyStyle(col, ramp, idx, style, silhouette[i] === 1, innerEdge[i] === 1, edgeDir[i], settings.outline, x, y, part.mat === "gem");
      pix.data[i] = col;
      light[i] = lightF;
      glow[i] = isGlow;
    }

  const ctx: DecoCtx = { pix, S, scale: scaleF, map, parts, mat, mat2, rng, roles, glow, depth, tN, uN, tMin, tMax, settings, shape, partIdx };
  for (const d of settings.decorations) DECORATIONS[d]?.apply(ctx);

  // aura (outer glow)
  if (settings.glow > 0) auraPass(ctx, settings.glow);

  // global color adjustments
  if (settings.hueShift || settings.saturation || settings.brightness) {
    for (let i = 0; i < n; i++) {
      const c = pix.data[i];
      if (A(c) === 0) continue;
      let o = c;
      if (settings.hueShift) o = shiftHue(o, settings.hueShift);
      if (settings.saturation || settings.brightness) o = adjustLight(o, settings.brightness, settings.saturation);
      pix.data[i] = o;
    }
  }

  return { pix, roles, depth, glow, tN, uN, light, material: mat, shape, settings };
}

function applyStyle(
  col: number,
  ramp: Ramp,
  idx: number,
  style: Style,
  sil: boolean,
  inner: boolean,
  edgeDir: number,
  outline: number,
  x: number,
  y: number,
  isGem: boolean,
): number {
  switch (style) {
    case "vanilla": {
      // 4-5 step quantized shading with 1px darker silhouette like vanilla tools
      const q = Math.round(Math.max(1, Math.min(5, idx)));
      let c = ramp[q];
      if (sil && outline > 0) c = mix(c, ramp[Math.max(0, q - 2)], 0.5 + outline * 0.4);
      else if (inner) c = mix(c, ramp[Math.max(0, q - 1)], 0.5);
      // keep the hue of gradient col
      return mix(c, col, 0.35);
    }
    case "furfsky": {
      let c = col;
      if (sil) c = mix(c, ramp[0], 0.55 * outline + 0.1);
      else if (inner) c = mix(c, ramp[1], 0.3);
      if (!sil && edgeDir < -0.4) c = mix(c, ramp[6], 0.25); // soft rim light
      return c;
    }
    case "imperial": {
      let c = col;
      // bold contrast + near-black outline
      c = mix(c, idx > 3.5 ? ramp[6] : ramp[1], 0.18);
      if (sil) c = mix(c, rgba(10, 8, 16), 0.45 + outline * 0.45);
      else if (inner) c = mix(c, ramp[0], 0.45);
      if (!sil && !inner && edgeDir < -0.5) c = mix(c, ramp[6], 0.5);
      return c;
    }
    case "hypixelplus": {
      const q = Math.round(idx * 2) / 2;
      let c = mix(col, rampAt(ramp, q), 0.5);
      c = adjustLight(c, 0, 0.08);
      if (sil) c = mix(c, ramp[Math.max(0, Math.floor(q) - 2)], 0.35 + outline * 0.45);
      else if (edgeDir < -0.5 && !isGem) c = mix(c, ramp[6], 0.35);
      return c;
    }
    case "painterly": {
      const d = (hash2(x, y, 7) - 0.5) * 0.9;
      let c = rampAt(ramp, idx + d);
      c = mix(c, col, 0.6);
      if (sil) c = mix(c, ramp[0], 0.35 * outline);
      return c;
    }
  }
}

// ---------------- Decorations ----------------
export type DecoCtx = {
  pix: Pix;
  S: number;
  scale: number;
  map: Mapper;
  parts: Part[];
  mat: Material;
  mat2: Material;
  rng: () => number;
  roles: Uint8Array;
  glow: Float32Array;
  depth: Float32Array;
  tN: Float32Array;
  uN: Float32Array;
  tMin: number;
  tMax: number;
  settings: GenSettings;
  shape: Shape;
  partIdx: Int16Array;
};

export type Decoration = {
  id: string;
  name: string;
  nameJa: string;
  group: "ornament" | "effect" | "evil" | "magic" | "tech" | "nature";
  apply: (c: DecoCtx) => void;
};

const roleIdx = (r: Role) => ROLE_LIST.indexOf(r) + 1;
function hasRole(c: DecoCtx, i: number, ...rs: Role[]) {
  return rs.some((r) => c.roles[i] === roleIdx(r));
}
function mainRange(c: DecoCtx): { t0: number; t1: number; hw: number } {
  // find the main part (blade/head/orb/cover) t-range
  let t0 = Infinity, t1 = -Infinity, hw = 1;
  for (const p of c.parts) {
    if (!["blade", "head", "cover", "orb", "metal", "barrel"].includes(p.role)) continue;
    if (p.kind === "profile") { t0 = Math.min(t0, p.t0); t1 = Math.max(t1, p.t1); hw = Math.max(hw, p.hw((p.t0 + p.t1) / 2)); }
    else if (p.kind === "disc") { t0 = Math.min(t0, p.t - p.r); t1 = Math.max(t1, p.t + p.r); hw = Math.max(hw, p.r); }
    else for (const [pt] of p.pts) { t0 = Math.min(t0, pt); t1 = Math.max(t1, pt); }
  }
  if (!isFinite(t0)) { t0 = c.tMin; t1 = c.tMax; }
  return { t0, t1, hw };
}
function guardT(c: DecoCtx): number | null {
  for (const p of c.parts) if (p.role === "guard" && p.kind === "profile") return (p.t0 + p.t1) / 2;
  for (const p of c.parts) if (p.role === "guard" && p.kind === "poly") return p.pts.reduce((a, b) => a + b[0], 0) / p.pts.length;
  for (const p of c.parts) if (p.role === "trim" && p.kind === "profile") return (p.t0 + p.t1) / 2;
  return null;
}
function pommelT(c: DecoCtx): number | null {
  for (const p of c.parts) if (p.role === "pommel" && p.kind === "profile") return (p.t0 + p.t1) / 2;
  return null;
}
/** paint a pixel at weapon coords, also marking glow */
function paintW(c: DecoCtx, t: number, u: number, col: number, glow = 0, overwrite = true) {
  const [x, y] = c.map.toP(t, u);
  const xi = Math.round(x), yi = Math.round(y);
  if (xi < 0 || yi < 0 || xi >= c.S || yi >= c.S) return;
  const i = yi * c.S + xi;
  if (overwrite) blendPx(c.pix, xi, yi, col);
  else if (A(c.pix.data[i]) > 0) blendPx(c.pix, xi, yi, col);
  if (glow > 0) c.glow[i] = Math.max(c.glow[i], glow);
  if (c.roles[i] === 0) c.roles[i] = roleIdx("trim");
  if (c.depth[i] === 0) c.depth[i] = 0.4;
}
function paintP(c: DecoCtx, x: number, y: number, col: number, glow = 0, onlyOnContent = false) {
  if (x < 0 || y < 0 || x >= c.S || y >= c.S) return;
  const i = y * c.S + x;
  if (onlyOnContent && A(c.pix.data[i]) === 0) return;
  blendPx(c.pix, x, y, col);
  if (glow > 0) c.glow[i] = Math.max(c.glow[i], glow);
  if (c.roles[i] === 0) c.roles[i] = roleIdx("trim");
  if (c.depth[i] === 0) c.depth[i] = 0.4;
}
function drawGem(c: DecoCtx, t: number, u: number, r: number, ramp: Ramp) {
  const sc = c.scale;
  const rp = Math.max(0.5, r * sc);
  const [cx, cy] = c.map.toP(t, u);
  for (let y = Math.floor(cy - rp - 1); y <= Math.ceil(cy + rp + 1); y++)
    for (let x = Math.floor(cx - rp - 1); x <= Math.ceil(cx + rp + 1); x++) {
      const dx = x - cx, dy = y - cy;
      const d = Math.abs(dx) + Math.abs(dy); // diamond
      if (d > rp + 0.5) continue;
      const dn = d / (rp + 0.5);
      let idx = dn > 0.78 ? 1.2 : dn > 0.5 ? 2.6 : 3.8;
      if (Math.hypot(dx + rp * 0.35, dy + rp * 0.35) < rp * 0.35) idx = 6;
      paintP(c, x, y, rampAt(ramp, idx), 0.8);
      const i = y * c.S + x;
      if (i >= 0 && i < c.depth.length) c.depth[i] = Math.max(c.depth[i], 0.9);
    }
}
function drawSparkle(c: DecoCtx, x: number, y: number, col: number, size: number) {
  for (let k = -size; k <= size; k++) {
    const a = 255 - (Math.abs(k) / (size + 1)) * 200;
    paintP(c, x + k, y, withAlpha(col, a), 0.9);
    paintP(c, x, y + k, withAlpha(col, a), 0.9);
  }
  if (size >= 2) {
    paintP(c, x + 1, y + 1, withAlpha(col, 120), 0.5);
    paintP(c, x - 1, y - 1, withAlpha(col, 120), 0.5);
    paintP(c, x + 1, y - 1, withAlpha(col, 120), 0.5);
    paintP(c, x - 1, y + 1, withAlpha(col, 120), 0.5);
  }
}
function auraPass(c: DecoCtx, strength: number) {
  const g = c.mat.glow;
  const S = c.S;
  const src = new Uint32Array(c.pix.data);
  const rad = Math.max(1, Math.round(c.scale * 1.2 * strength + 0.5));
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const i = y * S + x;
      if (A(src[i]) > 0) continue;
      let best = 0;
      for (let dy = -rad; dy <= rad; dy++)
        for (let dx = -rad; dx <= rad; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= S || ny >= S) continue;
          const j = ny * S + nx;
          if (A(src[j]) === 0) continue;
          const d = Math.hypot(dx, dy);
          const v = Math.max(0, 1 - d / (rad + 0.5)) * (0.45 + c.glow[j] * 0.55);
          best = Math.max(best, v);
        }
      if (best <= 0.02) continue;
      const a = best * 200 * strength;
      c.pix.data[i] = withAlpha(g, a);
      c.glow[i] = Math.max(c.glow[i], best * 0.8);
    }
}

export const DECORATIONS_LIST: Decoration[] = [
  {
    id: "gems", name: "Gem Inlays", nameJa: "宝石象嵌", group: "ornament",
    apply: (c) => {
      const g = guardT(c), p = pommelT(c);
      const r = 0.55 + 0.15 * c.settings.params.ornate;
      if (g !== null) drawGem(c, g + 0.7, 0, r, c.mat.gem);
      if (p !== null) drawGem(c, p, 0, r * 0.8, c.mat.gem);
      const m = mainRange(c);
      if (c.settings.params.ornate >= 2 && m.hw > 1.2) drawGem(c, m.t0 + (m.t1 - m.t0) * 0.25, 0, 0.5, c.mat2.gem);
    },
  },
  {
    id: "sidegems", name: "Side Gems", nameJa: "側面宝石", group: "ornament",
    apply: (c) => {
      const g = guardT(c);
      if (g === null) return;
      const w = 1.6 * c.settings.params.guard;
      drawGem(c, g, -w, 0.45, c.mat2.gem);
      drawGem(c, g, w, 0.45, c.mat2.gem);
    },
  },
  {
    id: "runes", name: "Runes", nameJa: "ルーン文字", group: "magic",
    apply: (c) => {
      const m = mainRange(c);
      const col = withAlpha(c.mat.glow, 230);
      const n = Math.floor((m.t1 - m.t0) / 1.8);
      for (let k = 1; k < n - 1; k++) {
        const t = m.t0 + 1.5 + k * 1.8;
        const shape = Math.floor(c.rng() * 4);
        paintW(c, t, 0, col, 0.9, false);
        if (shape === 1) paintW(c, t + 0.5, 0.35, col, 0.9, false);
        if (shape === 2) paintW(c, t + 0.6, 0, col, 0.9, false);
        if (shape === 3) { paintW(c, t + 0.5, -0.35, col, 0.9, false); paintW(c, t + 0.5, 0.35, col, 0.9, false); }
      }
    },
  },
  {
    id: "engrave", name: "Engraving", nameJa: "彫金模様", group: "ornament",
    apply: (c) => {
      const m = mainRange(c);
      const col = withAlpha(c.mat.secondary[4], 200);
      const dark = withAlpha(c.mat.secondary[1], 160);
      for (let t = m.t0 + 2; t < m.t1 - 2.5; t += 0.5) {
        const f = (t - m.t0) / (m.t1 - m.t0);
        const w = Math.sin(f * Math.PI * 4) * Math.min(0.6, m.hw * 0.4);
        paintW(c, t, w, col, 0, false);
        paintW(c, t, -w, dark, 0, false);
      }
    },
  },
  {
    id: "rivets", name: "Rivets", nameJa: "リベット", group: "tech",
    apply: (c) => {
      const S = c.S;
      const col = c.mat.secondary[5], dk = c.mat.secondary[1];
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const i = y * S + x;
          if (!hasRole(c, i, "guard", "head", "metal", "trim", "cover")) continue;
          if (hash2(Math.floor(x / c.scale), Math.floor(y / c.scale), c.settings.seed + 3) > 0.92 && (x + y) % 2 === 0) {
            paintP(c, x, y, col);
            paintP(c, x + 1, y + 1, dk, 0, true);
          }
        }
    },
  },
  {
    id: "spikes", name: "Spikes", nameJa: "棘", group: "evil",
    apply: (c) => {
      const m = mainRange(c);
      const ramp = c.mat.secondary;
      const sc = c.scale;
      for (let t = m.t0 + 2; t < m.t1 - 2; t += 2.2) {
        const base = m.hw;
        const len = 1.2 + c.rng() * 0.8;
        for (let k = 0; k <= len * sc; k++) {
          const f = k / (len * sc);
          const w = Math.max(0, (1 - f) * 0.7);
          for (let d = -w; d <= w; d += 0.5 / sc) paintW(c, t + f * 0.9 + d * 0.3, base + f * len, rampAt(ramp, f > 0.7 ? 5 : 3 - d * 2));
        }
      }
    },
  },
  {
    id: "wings", name: "Guard Wings", nameJa: "翼ガード", group: "ornament",
    apply: (c) => {
      const g = guardT(c);
      if (g === null) return;
      const ramp = c.mat.secondary;
      const sc = c.scale;
      const span = 3.2 * c.settings.params.guard;
      for (let side = -1; side <= 1; side += 2)
        for (let k = 0; k <= span * sc; k++) {
          const f = k / (span * sc);
          const u = side * (1.2 + f * span);
          const t = g + f * f * 2.2 - 0.3;
          const th = 1.0 * (1 - f * 0.6);
          for (let d = 0; d <= th; d += 0.5 / sc) {
            const feather = Math.floor(f * 4) % 2 === 0 ? 0 : -0.8;
            paintW(c, t - d, u, rampAt(ramp, 4 - d * 2 + feather));
          }
        }
    },
  },
  {
    id: "halo", name: "Halo", nameJa: "光輪", group: "magic",
    apply: (c) => {
      const m = mainRange(c);
      const t = m.t0 + (m.t1 - m.t0) * 0.62;
      const r = Math.max(2.6, m.hw + 2.0);
      const col = withAlpha(c.mat.glow, 220);
      const steps = Math.ceil(r * c.scale * 8);
      for (let k = 0; k < steps; k++) {
        const a = (k / steps) * Math.PI * 2;
        paintW(c, t + Math.cos(a) * r * 0.45, Math.sin(a) * r, col, 0.9);
      }
    },
  },
  {
    id: "chain", name: "Chain", nameJa: "鎖", group: "evil",
    apply: (c) => {
      const p = pommelT(c) ?? c.tMin + 1;
      const [sx, sy] = c.map.toP(p, 0.8);
      const ramp = c.mat.secondary;
      let x = Math.round(sx), y = Math.round(sy);
      const n = Math.round(4 * c.scale);
      for (let k = 0; k < n; k++) {
        paintP(c, x, y, rampAt(ramp, k % 2 ? 2 : 4));
        if (k % 2) paintP(c, x + 1, y, rampAt(ramp, 3));
        y += 1;
        if (k % 3 === 2) x += c.rng() > 0.5 ? 1 : 0;
        if (y >= c.S) break;
      }
      paintP(c, x, y, rampAt(ramp, 1));
      paintP(c, x + 1, y, rampAt(ramp, 1));
    },
  },
  {
    id: "ribbon", name: "Ribbon / Tassel", nameJa: "リボン/房", group: "ornament",
    apply: (c) => {
      const p = pommelT(c) ?? c.tMin + 1;
      const ramp = c.mat.gem;
      const n = Math.round(5 * c.scale);
      for (let side = 0; side < 2; side++) {
        const [sx, sy] = c.map.toP(p + 0.4 + side * 0.6, 0.9);
        let x = Math.round(sx), y = Math.round(sy);
        for (let k = 0; k < n; k++) {
          paintP(c, x, y, rampAt(ramp, 3 + Math.sin(k * 0.8) * 1.5));
          y += 1;
          x += Math.round(Math.sin(k * 0.9 + side * 2) * 0.9);
        }
      }
    },
  },
  {
    id: "aura_sparkles", name: "Sparkles", nameJa: "きらめき", group: "effect",
    apply: (c) => {
      const S = c.S;
      const col = c.mat.glow;
      const n = 3 + Math.round(c.scale * 1.5);
      for (let k = 0; k < n; k++) {
        const x = Math.floor(c.rng() * S), y = Math.floor(c.rng() * S);
        if (A(c.pix.data[y * S + x]) > 0) continue;
        drawSparkle(c, x, y, col, c.rng() > 0.6 ? 2 : 1);
      }
    },
  },
  {
    id: "stars", name: "Star Dust", nameJa: "星屑", group: "magic",
    apply: (c) => {
      const S = c.S;
      const n = 6 + Math.round(c.scale * 3);
      for (let k = 0; k < n; k++) {
        const x = Math.floor(c.rng() * S), y = Math.floor(c.rng() * S);
        if (A(c.pix.data[y * S + x]) > 0) continue;
        paintP(c, x, y, withAlpha(mix(c.mat.glow, rgba(255, 255, 255), c.rng()), 150 + c.rng() * 100), 0.7);
      }
    },
  },
  {
    id: "drips", name: "Blood Drips", nameJa: "血の滴り", group: "evil",
    apply: (c) => {
      const m = mainRange(c);
      const blood = [rgba(90, 8, 20), rgba(140, 14, 30), rgba(200, 30, 48), rgba(240, 70, 80)];
      const n = Math.floor((m.t1 - m.t0) / 2.2);
      for (let k = 0; k < n; k++) {
        const t = m.t0 + 1 + k * 2.2 + c.rng() * 1.2;
        const [sx, sy] = c.map.toP(t, m.hw * 0.5);
        let x = Math.round(sx), y = Math.round(sy);
        const len = Math.round((1 + c.rng() * 3) * c.scale);
        for (let j = 0; j < len; j++) {
          paintP(c, x, y, blood[j === len - 1 ? 3 : j < 2 ? 1 : 2], 0.2);
          if (j < len - 1 && c.scale > 1 && c.rng() > 0.5) paintP(c, x + 1, y, blood[1], 0.1, true);
          y++;
        }
        paintP(c, x, y, blood[2]);
      }
      // stain blade
      for (let i = 0; i < c.S * c.S; i++) {
        if (!hasRole(c, i, "blade", "head", "edge")) continue;
        if (hash2(i % c.S, Math.floor(i / c.S), 99) > 0.78) c.pix.data[i] = mix(c.pix.data[i], blood[1], 0.6);
      }
    },
  },
  {
    id: "cracks", name: "Cracks", nameJa: "ひび割れ", group: "evil",
    apply: (c) => {
      const m = mainRange(c);
      const dark = withAlpha(c.mat.primary[0], 220);
      const glow = withAlpha(c.mat.glow, 200);
      const n = 2 + Math.floor(c.rng() * 3);
      for (let k = 0; k < n; k++) {
        let t = m.t0 + 2 + c.rng() * (m.t1 - m.t0 - 4);
        let u = (c.rng() - 0.5) * m.hw;
        const steps = 3 + Math.floor(c.rng() * 4);
        for (let j = 0; j < steps; j++) {
          paintW(c, t, u, dark, 0, false);
          paintW(c, t + 0.3, u + 0.3, glow, 0.6, false);
          t += 0.5 + c.rng() * 0.6;
          u += (c.rng() - 0.5) * 1.2;
        }
      }
    },
  },
  {
    id: "lightning", name: "Lightning", nameJa: "稲妻", group: "effect",
    apply: (c) => {
      const m = mainRange(c);
      const col = withAlpha(mix(c.mat.glow, rgba(255, 255, 255), 0.5), 240);
      let t = m.t0 + 1, u = -m.hw - 0.8;
      let dir = 1;
      while (t < m.t1 - 0.5) {
        paintW(c, t, u, col, 1);
        t += 0.5;
        u += dir * 0.6;
        if (Math.abs(u) > m.hw + 1.2) dir *= -1;
        if (c.rng() > 0.8) dir *= -1;
      }
    },
  },
  {
    id: "flames", name: "Flames", nameJa: "炎", group: "effect",
    apply: (c) => {
      const m = mainRange(c);
      const sc = c.scale;
      const cols = [rgba(255, 60, 20, 200), rgba(255, 140, 30, 220), rgba(255, 220, 90, 240)];
      for (let t = m.t0 + 1.5; t < m.t1 - 0.5; t += 0.5 / sc) {
        const nz = noise2(t * 1.3, c.settings.seed, 5);
        const h = nz * 2.2;
        for (let k = 0; k < h; k += 0.5 / sc) {
          const f = k / 2.2;
          paintW(c, t, -m.hw - 0.4 - k, withAlpha(cols[f < 0.3 ? 2 : f < 0.65 ? 1 : 0], 240 - f * 200), 0.9 - f * 0.5);
        }
      }
    },
  },
  {
    id: "frost", name: "Frost Crystals", nameJa: "氷晶", group: "magic",
    apply: (c) => {
      const m = mainRange(c);
      const col = rgba(220, 245, 255, 230), col2 = rgba(140, 200, 255, 200);
      for (let k = 0; k < 4 + c.scale; k++) {
        const t = m.t0 + 1 + c.rng() * (m.t1 - m.t0 - 2);
        const u = (c.rng() > 0.5 ? 1 : -1) * (m.hw + 0.3 + c.rng() * 0.8);
        const [x, y] = c.map.toP(t, u);
        const xi = Math.round(x), yi = Math.round(y);
        paintP(c, xi, yi, col, 0.7);
        paintP(c, xi + 1, yi, col2, 0.5); paintP(c, xi - 1, yi, col2, 0.5);
        paintP(c, xi, yi + 1, col2, 0.5); paintP(c, xi, yi - 1, col2, 0.5);
      }
      for (let i = 0; i < c.S * c.S; i++)
        if (hasRole(c, i, "blade", "head") && hash2(i % c.S, Math.floor(i / c.S), 12) > 0.85)
          c.pix.data[i] = mix(c.pix.data[i], col, 0.5);
    },
  },
  {
    id: "eye", name: "Living Eye", nameJa: "魔眼", group: "evil",
    apply: (c) => {
      const g = guardT(c);
      const m = mainRange(c);
      const t = g !== null ? g + 0.7 : (m.t0 + m.t1) / 2;
      const sc = c.scale;
      const r = Math.max(1, 1.1 * sc);
      const [cx, cy] = c.map.toP(t, 0);
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
        for (let x = Math.floor(cx - r * 1.4); x <= Math.ceil(cx + r * 1.4); x++) {
          const dx = (x - cx) / (r * 1.4), dy = (y - cy) / r;
          if (dx * dx + dy * dy > 1) continue;
          const inner = Math.abs(x - cx) < 0.6 * sc * 0.5 + 0.5 ? 0 : 1;
          paintP(c, x, y, inner ? mix(c.mat.gem[4], rgba(255, 255, 255), 0.4) : rgba(10, 5, 10), inner ? 0.9 : 0);
        }
    },
  },
  {
    id: "skull", name: "Skull Pommel", nameJa: "髑髏", group: "evil",
    apply: (c) => {
      const p = pommelT(c);
      if (p === null) return;
      const sc = c.scale;
      const bone = rgba(225, 218, 190), dk = rgba(120, 110, 90), eye = c.mat.gem[4];
      const [cx, cy] = c.map.toP(p, 0);
      const r = Math.max(1, Math.round(1.3 * sc));
      for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++) {
          if (x * x + y * y > r * r + r * 0.5) continue;
          const isEye = Math.abs(Math.abs(x) - r * 0.45) < 0.5 * sc * 0.6 + 0.3 && Math.abs(y + r * 0.1) < 0.5 * sc * 0.6 + 0.3;
          const isJaw = y > r * 0.55 && x % 2 === 0;
          paintP(c, Math.round(cx) + x, Math.round(cy) + y, isEye ? eye : isJaw ? dk : bone, isEye ? 0.9 : 0);
        }
    },
  },
  {
    id: "thorns", name: "Thorn Grip", nameJa: "茨の柄", group: "nature",
    apply: (c) => {
      const S = c.S;
      const col = c.mat.gem[3], dk = c.mat.gem[1];
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const i = y * S + x;
          if (!hasRole(c, i, "grip", "wood")) continue;
          const v = hash2(Math.floor(x / c.scale), Math.floor(y / c.scale), 21);
          if (v > 0.8) { paintP(c, x, y, col); paintP(c, x - 1, y - 1, dk); }
        }
    },
  },
  {
    id: "vines", name: "Vines", nameJa: "蔦", group: "nature",
    apply: (c) => {
      const m = mainRange(c);
      const leaf = rgba(90, 170, 60), dkl = rgba(40, 100, 35), flower = c.mat.gem[5];
      for (let t = c.tMin + 1; t < m.t1 - 1; t += 0.5 / c.scale) {
        const u = Math.sin(t * 1.4) * (m.hw * 0.8);
        paintW(c, t, u, dkl, 0, false);
        if (Math.floor(t * 2) % 3 === 0) paintW(c, t, u + 0.5, leaf, 0, false);
        if (Math.floor(t * 2) % 7 === 0) paintW(c, t + 0.3, u - 0.5, flower, 0.5, false);
      }
    },
  },
  {
    id: "scales", name: "Dragon Scales", nameJa: "竜鱗", group: "ornament",
    apply: (c) => {
      const S = c.S;
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const i = y * S + x;
          if (!hasRole(c, i, "blade", "head", "guard", "cover", "metal")) continue;
          const px = Math.floor(x / c.scale * 1.5), py = Math.floor(y / c.scale * 1.5);
          const row = py % 2;
          const v = ((px + row) % 2 === 0 ? 1 : 0) ^ (py % 2);
          if (v) c.pix.data[i] = mix(c.pix.data[i], c.mat.secondary[2], 0.35);
          else c.pix.data[i] = mix(c.pix.data[i], c.mat.primary[5], 0.12);
        }
    },
  },
  {
    id: "circuit", name: "Circuit Lines", nameJa: "回路ライン", group: "tech",
    apply: (c) => {
      const S = c.S;
      const col = c.mat.glow;
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const i = y * S + x;
          if (!hasRole(c, i, "metal", "head", "guard", "blade", "cover")) continue;
          const gx = Math.floor(x / c.scale * 2), gy = Math.floor(y / c.scale * 2);
          const h1 = hash2(gx, Math.floor(gy / 3), 31);
          if (h1 > 0.75 && gy % 3 === 0) paintP(c, x, y, withAlpha(col, 230), 0.9);
          else if (hash2(gx, gy, 32) > 0.93) paintP(c, x, y, withAlpha(col, 200), 0.8);
        }
    },
  },
  {
    id: "energy_core", name: "Energy Core", nameJa: "エネルギー核", group: "tech",
    apply: (c) => {
      const m = mainRange(c);
      const col = c.mat.glow;
      for (let t = m.t0 + 1; t < m.t1 - 1.5; t += 0.5 / c.scale) {
        paintW(c, t, 0, withAlpha(col, 240), 1, false);
        if (m.hw > 1.2) { paintW(c, t, 0.4, withAlpha(col, 140), 0.6, false); paintW(c, t, -0.4, withAlpha(col, 140), 0.6, false); }
      }
    },
  },
  {
    id: "feathers", name: "Feathers", nameJa: "羽根飾り", group: "ornament",
    apply: (c) => {
      const p = pommelT(c) ?? c.tMin + 1;
      const ramp = c.mat2.gem;
      const [sx, sy] = c.map.toP(p + 0.2, -0.9);
      const n = Math.round(4 * c.scale);
      let x = Math.round(sx), y = Math.round(sy);
      for (let k = 0; k < n; k++) {
        paintP(c, x, y, rampAt(ramp, 4 - (k % 2)));
        paintP(c, x - 1, y, rampAt(ramp, 2));
        y += 1; x -= k % 2;
      }
    },
  },
  {
    id: "holy_rays", name: "Holy Rays", nameJa: "聖光", group: "magic",
    apply: (c) => {
      const m = mainRange(c);
      const t = m.t1 - 1.5;
      const col = withAlpha(mix(c.mat.glow, rgba(255, 255, 255), 0.5), 200);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        for (let r = m.hw + 1; r < m.hw + 3.5; r += 0.5 / c.scale) {
          if (Math.floor(r * 2) % 2 === 0) paintW(c, t + Math.cos(a) * r * 0.6, Math.sin(a) * r, withAlpha(col, 200 - (r - m.hw) * 40), 0.8);
        }
      }
    },
  },
  {
    id: "void_particles", name: "Void Particles", nameJa: "虚空粒子", group: "evil",
    apply: (c) => {
      const S = c.S;
      const n = 8 + Math.round(c.scale * 4);
      for (let k = 0; k < n; k++) {
        const x = Math.floor(c.rng() * S), y = Math.floor(c.rng() * S);
        if (A(c.pix.data[y * S + x]) > 0) continue;
        const col = mix(rgba(60, 20, 120), c.mat.glow, c.rng());
        paintP(c, x, y, withAlpha(col, 140 + c.rng() * 110), 0.6);
        if (c.rng() > 0.5) paintP(c, x + 1, y, withAlpha(rgba(0, 0, 0), 200), 0);
      }
    },
  },
  {
    id: "gold_trim", name: "Gold Trim", nameJa: "金縁", group: "ornament",
    apply: (c) => {
      const S = c.S;
      const gold = rgba(240, 200, 70), dk = rgba(160, 110, 30);
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const i = y * S + x;
          if (!hasRole(c, i, "guard", "pommel", "trim", "head", "cover")) continue;
          const edge = [getPx(c.pix, x + 1, y), getPx(c.pix, x - 1, y), getPx(c.pix, x, y + 1), getPx(c.pix, x, y - 1)].some((p) => A(p) === 0);
          if (edge) c.pix.data[i] = mix(c.pix.data[i], (x + y) % 2 ? gold : dk, 0.75);
        }
    },
  },
];

export const DECORATIONS: Record<string, Decoration> = Object.fromEntries(DECORATIONS_LIST.map((d) => [d.id, d]));

// ---------- Presets (one-click archetypes) ----------
export type Preset = { id: string; nameJa: string; name: string; settings: Partial<GenSettings> };
export const PRESETS: Preset[] = [
  { id: "vanilla_iron", nameJa: "バニラ+ 鉄の剣", name: "Vanilla+ Iron Sword", settings: { shape: "sword", material: "iron", size: 16, style: "vanilla", params: { width: 1, length: 1, guard: 1, ornate: 0, curve: 0 }, decorations: [], gradient: "tip", gradientStrength: 0.3, glow: 0, outline: 0.6 } },
  { id: "ruby_sword", nameJa: "ルビーソード", name: "Ruby Sword", settings: { shape: "sword", material: "ruby", material2: "gold", size: 32, style: "furfsky", params: { width: 1, length: 1, guard: 1.1, ornate: 2, curve: 0 }, decorations: ["gems", "engrave"], gradient: "tip", gradientStrength: 0.5, glow: 0.2 } },
  { id: "sapphire_pick", nameJa: "サファイアピッケル", name: "Sapphire Pickaxe", settings: { shape: "pickaxe", material: "sapphire", material2: "iron", size: 32, style: "hypixelplus", params: { width: 1, length: 1, guard: 1, ornate: 2, curve: 0 }, decorations: ["gems", "aura_sparkles"], gradient: "length", gradientStrength: 0.4, glow: 0.15 } },
  { id: "dragon_blade", nameJa: "ドラゴンブレード", name: "Dragon Blade", settings: { shape: "claymore_ornate", material: "dragon", material2: "infernal", size: 32, style: "imperial", params: { width: 1.1, length: 1, guard: 1.2, ornate: 3, curve: 0 }, decorations: ["scales", "wings", "gems", "flames"], gradient: "twoTone", gradientStrength: 0.6, glow: 0.35 } },
  { id: "holy_sword", nameJa: "聖剣", name: "Holy Sword", settings: { shape: "greatsword", material: "holy", material2: "gold", size: 32, style: "furfsky", params: { width: 1, length: 1.05, guard: 1.3, ornate: 3, curve: 0 }, decorations: ["gems", "wings", "halo", "holy_rays", "aura_sparkles"], gradient: "tip", gradientStrength: 0.7, glow: 0.5 } },
  { id: "prism_sword", nameJa: "虹彩剣", name: "Prismatic Sword", settings: { shape: "sword", material: "rainbow", material2: "holy", size: 32, style: "hypixelplus", params: { width: 1.1, length: 1.05, guard: 1, ornate: 2, curve: 0 }, decorations: ["gems", "stars", "aura_sparkles"], gradient: "rainbow", gradientStrength: 0.9, glow: 0.4 } },
  { id: "blood_scythe", nameJa: "ブラッドサイズ", name: "Blood Scythe", settings: { shape: "scythe", material: "blood", material2: "bone", size: 32, style: "imperial", params: { width: 1, length: 1, guard: 1, ornate: 2, curve: 0 }, decorations: ["drips", "skull", "chain", "cracks"], gradient: "length", gradientStrength: 0.5, glow: 0.3 } },
  { id: "void_katana", nameJa: "虚空の刀", name: "Void Katana", settings: { shape: "katana", material: "void", material2: "amethyst", size: 32, style: "furfsky", params: { width: 1, length: 1.05, guard: 1, ornate: 1, curve: 0.6 }, decorations: ["runes", "void_particles", "ribbon"], gradient: "tip", gradientStrength: 0.8, glow: 0.45 } },
  { id: "arcane_staff", nameJa: "秘術の杖", name: "Arcane Staff", settings: { shape: "staff", material: "arcane", material2: "gold", size: 32, style: "furfsky", params: { width: 1, length: 1, guard: 1, ornate: 3, curve: 0 }, decorations: ["runes", "stars", "aura_sparkles"], gradient: "none", gradientStrength: 0.5, glow: 0.5 } },
  { id: "grimoire", nameJa: "魔導書", name: "Grimoire", settings: { shape: "grimoire", material: "void", material2: "gold", size: 32, style: "imperial", params: { width: 1, length: 1, guard: 1, ornate: 3, curve: 0 }, decorations: ["gold_trim", "runes", "eye"], gradient: "radial", gradientStrength: 0.4, glow: 0.3 } },
  { id: "magic_circle", nameJa: "魔法陣", name: "Magic Circle", settings: { shape: "magic_circle", material: "arcane", material2: "holy", size: 64, style: "hypixelplus", params: { width: 1, length: 1, guard: 1, ornate: 3, curve: 0 }, decorations: ["stars"], gradient: "none", gradientStrength: 0.5, glow: 0.6 } },
  { id: "railgun", nameJa: "レールガン", name: "Railgun", settings: { shape: "railgun", material: "plasma", material2: "steel", size: 32, style: "hypixelplus", params: { width: 1, length: 1, guard: 1, ornate: 2, curve: 0 }, decorations: ["circuit", "rivets", "lightning"], gradient: "none", gradientStrength: 0.5, glow: 0.4 } },
  { id: "chainsaw", nameJa: "チェーンソー", name: "Chainsaw", settings: { shape: "chainsaw", material: "steel", material2: "blood", size: 32, style: "imperial", params: { width: 1, length: 1, guard: 1, ornate: 1, curve: 0 }, decorations: ["rivets", "drips"], gradient: "none", gradientStrength: 0.5, glow: 0.1 } },
  { id: "ornate_spear", nameJa: "装飾槍", name: "Ornate Spear", settings: { shape: "spear", material: "gold", material2: "sapphire", size: 32, style: "furfsky", params: { width: 1.1, length: 1, guard: 1.2, ornate: 3, curve: 0 }, decorations: ["gems", "sidegems", "ribbon", "engrave", "feathers"], gradient: "tip", gradientStrength: 0.5, glow: 0.2 } },
  { id: "spiked_mace", nameJa: "棘メイス", name: "Spiked Mace", settings: { shape: "mace", material: "netherite", material2: "gold", size: 32, style: "imperial", params: { width: 1, length: 1, guard: 1, ornate: 2, curve: 0 }, decorations: ["gems", "rivets", "cracks"], gradient: "radial", gradientStrength: 0.4, glow: 0.2 } },
  { id: "frost_bow", nameJa: "氷結の弓", name: "Frost Bow", settings: { shape: "bow", material: "frost", material2: "sapphire", size: 32, style: "furfsky", params: { width: 1, length: 1, guard: 1, ornate: 2, curve: 0.8 }, decorations: ["frost", "gems", "stars"], gradient: "length", gradientStrength: 0.4, glow: 0.4 } },
  { id: "emerald_axe", nameJa: "エメラルド斧", name: "Emerald Axe", settings: { shape: "axe", material: "emerald", material2: "gold", size: 32, style: "hypixelplus", params: { width: 1, length: 1, guard: 1, ornate: 1, curve: 0 }, decorations: ["gems", "vines"], gradient: "width", gradientStrength: 0.5, glow: 0.1 } },
  { id: "relic", nameJa: "古代レリック", name: "Ancient Relic", settings: { shape: "relic", material: "bronze", material2: "emerald", size: 32, style: "furfsky", params: { width: 1, length: 1, guard: 1, ornate: 2, curve: 0 }, decorations: ["gems", "engrave", "aura_sparkles"], gradient: "radial", gradientStrength: 0.4, glow: 0.4 } },
  { id: "midas", nameJa: "ミダスの剣", name: "Midas Sword", settings: { shape: "scimitar", material: "midas", material2: "ruby", size: 32, style: "hypixelplus", params: { width: 1, length: 1, guard: 1, ornate: 3, curve: 0.5 }, decorations: ["gems", "sidegems", "engrave", "aura_sparkles"], gradient: "tip", gradientStrength: 0.5, glow: 0.3 } },
  { id: "plasma_pistol", nameJa: "プラズマ銃", name: "Plasma Pistol", settings: { shape: "pistol", material: "steel", material2: "plasma", size: 32, style: "hypixelplus", params: { width: 1, length: 1, guard: 1, ornate: 2, curve: 0 }, decorations: ["circuit", "energy_core"], gradient: "none", gradientStrength: 0.5, glow: 0.3 } },
];

export function luminanceOf(c: number) {
  return luminance(c);
}
export { setPx };
