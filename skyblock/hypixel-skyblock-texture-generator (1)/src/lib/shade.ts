import {
  clamp,
  hexToRgb,
  hslToRgb,
  mixRgb,
  rgbToHsl,
  saturateRgb,
  shiftHueRgb,
  type RGB,
} from "@/lib/colors";
import { mulberry32, rngBool, type Rng } from "@/lib/rng";
import type { PaletteMix, SignatureMix } from "@/lib/styles";

export const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function bayer(x: number, y: number): number {
  return (BAYER4[y & 3]![x & 3]! + 0.5) / 16;
}

export type MaterialKey =
  | "blade"
  | "core"
  | "iron"
  | "gold"
  | "gem"
  | "wood"
  | "leather"
  | "cloth"
  | "string"
  | "energy"
  | "bone"
  | "fur"
  | "rune";

export const CHAR_TO_MATERIAL: Record<string, MaterialKey> = {
  b: "blade",
  B: "core",
  m: "iron",
  M: "gold",
  g: "gem",
  w: "wood",
  l: "leather",
  c: "cloth",
  s: "string",
  e: "energy",
  k: "bone",
  p: "fur",
  r: "rune",
};

export const MATERIAL_BASE: Record<MaterialKey, keyof Omit<PaletteMix, "ids">> = {
  blade: "metal",
  core: "metal",
  iron: "metal",
  gold: "gold",
  gem: "gem",
  wood: "wood",
  leather: "leather",
  cloth: "cloth",
  string: "bone",
  energy: "energy",
  bone: "bone",
  fur: "fur",
  rune: "energy",
};

/**
 * Each material gets its own base tone (lightness / saturation offset) so a
 * blade, its fuller, iron fittings and gold trim never collapse into one flat
 * colour — the single biggest readability win in hand-made packs.
 * Offsets are [lightness, saturation].
 */
const MATERIAL_TONE: Record<MaterialKey, [number, number]> = {
  blade: [0.14, 0.06],
  core: [-0.1, -0.06],
  iron: [-0.02, -0.1],
  gold: [0.1, 0.12],
  gem: [0.04, 0.3],
  wood: [-0.04, -0.04],
  leather: [-0.08, -0.08],
  cloth: [-0.02, 0.02],
  string: [0.16, -0.2],
  energy: [0.16, 0.24],
  bone: [0.1, -0.16],
  fur: [-0.02, 0.06],
  rune: [0.1, 0.2],
};

/**
 * Base tone per material, normalised into a mid-tone band. Hand-made packs keep
 * the body mid-value so the outline has room to go dark and the rim light has
 * room to go bright; without this clamp pale palettes wash out to white.
 */
export function materialBase(material: MaterialKey, pal: PaletteMix, hueShift: number): RGB {
  const key = MATERIAL_BASE[material];
  let rgb = pal[key] as RGB;
  rgb = shiftHueRgb(rgb, hueShift);
  const [dl, ds] = MATERIAL_TONE[material];
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  const lo = material === "energy" || material === "rune" ? 0.42 : 0.26;
  const hi = material === "gem" || material === "energy" ? 0.6 : 0.5;
  return hslToRgb(h, clamp(s + ds, 0.18, 0.96), clamp(l + dl, lo, hi));
}

const EMISSIVE: Record<MaterialKey, number> = {
  blade: 0,
  core: 0,
  iron: 0,
  gold: 0.08,
  gem: 0.42,
  wood: 0,
  leather: 0,
  cloth: 0,
  string: 0,
  energy: 1,
  bone: 0,
  fur: 0,
  rune: 0.9,
};

/**
 * Fixed tonal bias per material. Thin (1-2px) structures have cancelling
 * distance-field normals, so their tone must come from what they are made of
 * rather than from a normal — exactly how hand-made item art is layered.
 */
const MATERIAL_LEVEL: Record<MaterialKey, number> = {
  blade: 0.34,
  core: -0.1,
  iron: -0.02,
  gold: 0.22,
  gem: 0.12,
  wood: -0.04,
  leather: -0.16,
  cloth: -0.06,
  string: 0.2,
  energy: 0.4,
  bone: 0.14,
  fur: -0.02,
  rune: 0.3,
};

const SPECULAR: Record<MaterialKey, number> = {
  blade: 1,
  core: 0.55,
  iron: 0.7,
  gold: 1,
  gem: 1,
  wood: 0.12,
  leather: 0.15,
  cloth: 0.05,
  string: 0.2,
  energy: 0.8,
  bone: 0.25,
  fur: 0.1,
  rune: 0.6,
};

export type ShadeConfig = {
  sig: SignatureMix;
  pal: PaletteMix;
  glowColor: RGB;
  hueShift: number;
  glow: number; // 0..100
  metallic: number; // 0..100
  chaos: number; // 0..100
  seed: number;
  /** resolution / 16 — gates the micro-detail octave and band refinement */
  detailScale: number;
};

export type FieldData = {
  size: number;
  mask: boolean[];
  dist: number[];
  maxDist: number;
  nx: number[];
  ny: number[];
  /** Principal axis of the silhouette (unit vector), oriented toward light. */
  ax: number;
  ay: number;
};

const LIGHT: [number, number] = (() => {
  const x = -0.62;
  const y = -0.78;
  const l = Math.hypot(x, y);
  return [x / l, y / l];
})();

export function computeField(grid: string[][]): FieldData {
  const size = grid.length;
  const n = size * size;
  const mask = new Array<boolean>(n).fill(false);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) mask[y * size + x] = grid[y]![x] !== ".";

  const dist = new Array<number>(n).fill(-1);
  const queue: number[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      if (!mask[i]) continue;
      const open =
        x === 0 ||
        y === 0 ||
        x === size - 1 ||
        y === size - 1 ||
        !mask[i - 1] ||
        !mask[i + 1] ||
        !mask[i - size] ||
        !mask[i + size];
      if (open) {
        dist[i] = 0;
        queue.push(i);
      }
    }
  }

  let head = 0;
  let maxDist = 0;
  while (head < queue.length) {
    const i = queue[head++]!;
    const x = i % size;
    const y = Math.floor(i / size);
    const d = dist[i]! + 1;
    const nb = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [ox, oy] of nb) {
      if (ox < 0 || oy < 0 || ox >= size || oy >= size) continue;
      const j = oy * size + ox;
      if (!mask[j] || dist[j] !== -1) continue;
      dist[j] = d;
      if (d > maxDist) maxDist = d;
      queue.push(j);
    }
  }

  // Outward normals: boundary cells point at their open side, interior cells
  // follow the negative gradient of the distance field (falls back to centroid).
  let cx = 0;
  let cy = 0;
  let count = 0;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (mask[y * size + x]) {
        cx += x;
        cy += y;
        count++;
      }
  cx = count ? cx / count : size / 2;
  cy = count ? cy / count : size / 2;

  const nx = new Array<number>(n).fill(0);
  const ny = new Array<number>(n).fill(0);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      if (!mask[i]) continue;
      let ax = 0;
      let ay = 0;
      if (dist[i] === 0) {
        if (x === 0 || !mask[i - 1]) ax -= 1;
        if (x === size - 1 || !mask[i + 1]) ax += 1;
        if (y === 0 || !mask[i - size]) ay -= 1;
        if (y === size - 1 || !mask[i + size]) ay += 1;
      } else {
        const l = dist[i - 1] ?? dist[i];
        const r = dist[i + 1] ?? dist[i];
        const u = dist[i - size] ?? dist[i];
        const d2 = dist[i + size] ?? dist[i];
        ax = (l ?? 0) - (r ?? 0);
        ay = (u ?? 0) - (d2 ?? 0);
      }
      const len = Math.hypot(ax, ay);
      if (len > 0.001) {
        nx[i] = ax / len;
        ny[i] = ay / len;
      } else {
        const dx = x - cx;
        const dy = y - cy;
        const dl = Math.hypot(dx, dy) || 1;
        nx[i] = dx / dl;
        ny[i] = dy / dl;
      }
    }
  }

  return { size, mask, dist, maxDist: Math.max(1, maxDist), nx, ny, ax: 1, ay: 0 };
}

/** Principal axis (largest variance direction) of the silhouette. */
export function principalAxis(field: FieldData, size: number): [number, number] {
  let cx = 0;
  let cy = 0;
  let n = 0;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (field.mask[y * size + x]) {
        cx += x;
        cy += y;
        n++;
      }
  if (!n) return [1, 0];
  cx /= n;
  cy /= n;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (field.mask[y * size + x]) {
        sxx += (x - cx) ** 2;
        syy += (y - cy) ** 2;
        sxy += (x - cx) * (y - cy);
      }
  if (sxx + syy + Math.abs(sxy) < 0.01) return [1, 0];
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  let ax = Math.cos(theta);
  let ay = Math.sin(theta);
  if (ax * LIGHT[0] + ay * LIGHT[1] < 0) {
    ax = -ax;
    ay = -ay;
  }
  return [ax, ay];
}

function ramp(
  base: RGB,
  level: number,
  dark: RGB,
  light: RGB,
  satMul: number,
  hiCap: number,
): RGB {
  const [h, s, l] = rgbToHsl(base[0], base[1], base[2]);
  const ls = clamp(s * satMul * (1 + Math.abs(level) * 0.14), 0, 1);
  // Shallow slope keeps bodies in the mid tones: outline dark, rim bright,
  // everything else readable — the "clean pack" tonal budget.
  const ll = clamp(l + level * 0.3, 0.04, 0.94);
  let rgb = hslToRgb(h, ls, ll);
  if (level < 0) {
    rgb = mixRgb(rgb, dark, Math.min(0.78, -level * 0.7));
  } else {
    // Highlight blend is tightened at higher resolutions so the extra tonal
    // resolution shows up as crisper bevels rather than a larger white area.
    rgb = mixRgb(rgb, light, Math.min(hiCap, level * 0.3));
  }
  return rgb;
}

function quantise(level: number, bands: number, dither: number, x: number, y: number): number {
  const steps = Math.max(2, bands - 1);
  const scaled = level * steps;
  if (dither <= 0.02) return Math.round(scaled) / steps;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  const threshold = bayer(x, y);
  const q = frac > threshold + (1 - dither) * 0.5 ? floor + 1 : floor;
  return q / steps;
}

/**
 * Ornament + micro-detail. All frequencies are expressed in *source pixel*
 * units (moduli multiplied by `d = detailScale`) so a pattern keeps the same
 * size relative to the silhouette at every resolution. The `micro` layer only
 * exists above 16× and is what makes 32×/64× genuinely more detailed rather
 * than merely smoother: engravings, facet cuts, strands, stitching, wisps.
 */
function ornamentValue(
  material: MaterialKey,
  x: number,
  y: number,
  field: FieldData,
  cfg: ShadeConfig,
  rng: Rng,
): number {
  const amount = cfg.sig.ornament;
  if (amount <= 0.02) return 0;
  const d = cfg.detailScale;
  const i = y * field.size + x;
  const dist = field.dist[i] ?? 0;
  const along = x * field.ax + y * field.ay;
  const perp = x * -field.ay + y * field.ax;
  const onLine = (period: number, phase = 0, width = 1) =>
    ((((x + y + phase) % period) + period) % period) < width * d;

  // micro layer strength: 0 at 16×, full at 64×
  const microGate = (d - 1) / 3;
  // Positive micro detail is damped so adding detail never shifts the tonal
  // balance toward white; negative detail keeps full weight for depth.
  const microGain = (v: number) => (v > 0 ? v * 0.66 : v * 1.05);

  switch (material) {
    case "gold":
    case "iron": {
      const lattice =
        (onLine(4 * d) ? 0.16 : 0) + ((((x - y) % (5 * d)) + 5 * d) % (5 * d) === 0 ? -0.12 : 0);
      const rivet = (x * 7 + y * 13) % (11 * d) === 0 ? 0.3 : 0;
      let micro = 0;
      if (microGate > 0) {
        // engraved filigree scroll following the blade axis
        const scroll = Math.sin(along / (2.2 * d)) * 0.5 + 0.5;
        micro = Math.abs(perp % (3 * d)) < 1 ? (scroll - 0.35) * 0.34 : 0;
        // tiny chased dots along the trim
        if (dist === 1 && Math.round(along) % Math.max(2, 2 * d) === 0) micro += 0.16;
      }
      return (lattice + rivet) * amount + microGain(micro) * microGate * amount;
    }
    case "blade":
    case "core": {
      const grind = onLine(3 * d) ? 0.1 : 0;
      const nick = 0;
      let micro = 0;
      if (microGate > 0) {
        // grind bands running along the edge + a bright fuller line
        micro = Math.abs(perp % (4 * d)) < 1.2 ? -0.12 : 0;
        micro += Math.abs(perp) < 0.9 * d ? 0.2 : 0;
        // micro-serration on the lit edge
        if (dist === 0 && Math.round(along) % Math.max(2, 2 * d) === 0) micro += 0.14;
      }
      return grind * amount + nick + (dist === 0 ? 0.06 * amount : 0) + microGain(micro) * microGate * amount;
    }
    case "gem": {
      const wedge = ((x + y) % (2 * d) < d ? 0.18 : -0.14) * amount;
      const inner = dist === 0 ? 0.1 * amount : 0;
      let micro = 0;
      if (microGate > 0) {
        // faceted cut: triangular wedges + a bright table facet
        const a = Math.floor(along / (2 * d));
        const b = Math.floor(perp / (2 * d));
        micro = (a + b) % 2 === 0 ? 0.16 : -0.12;
        if (dist >= 1 && dist <= 2 * d) micro += 0.1;
      }
      return wedge + inner + microGain(micro) * microGate * amount;
    }
    case "wood": {
      const grain = ((x * 2 + y) % (5 * d) < 2 * d ? -0.14 : 0.06) * amount;
      let micro = 0;
      if (microGate > 0) {
        // fibre strands along the grain, slightly wavy
        const wave = Math.sin(along / (3 * d)) * 0.8;
        micro = Math.abs(perp + wave) % (2 * d) < 1 ? -0.14 : 0.05;
      }
      return grain + microGain(micro) * microGate * amount;
    }
    case "leather":
    case "cloth": {
      const weave = ((x % (2 * d) < d ? 1 : 0) + (y % (2 * d) < d ? 1 : 0)) % 2 === 0 ? 0.07 : -0.07;
      const stitch = (x + y) % (7 * d) === 0 ? 0.18 : 0;
      let micro = 0;
      if (microGate > 0) {
        // visible stitching rows and leather pores
        micro = Math.abs(perp % (3 * d)) < 1 ? 0.12 : 0;
        if ((x * 5 + y * 3) % (13 * d) === 0) micro -= 0.1;
      }
      return (weave + stitch) * amount + microGain(micro) * microGate * amount;
    }
    case "fur": {
      const speckle = 0;
      const stripe = ((x + Math.floor(y / d)) % (4 * d) === 0 ? -0.2 : 0) * amount;
      let micro = 0;
      if (microGate > 0) {
        // individual hair strands across the axis
        const wave = Math.sin(along / (4 * d)) * 1.2;
        micro = Math.abs(perp + wave) % (1.6 * d) < 0.9 ? -0.18 : 0.08;
      }
      return speckle + stripe + microGain(micro) * microGate * amount;
    }
    case "bone": {
      const crack = (x * 3 + y * 5) % (9 * d) === 0 ? -0.3 * amount : 0;
      let micro = 0;
      if (microGate > 0) {
        micro = Math.abs(perp % (5 * d)) < 1 ? -0.1 : 0;
        micro += (rng() - 0.5) * 0.12;
      }
      return crack + (rng() - 0.5) * 0.1 * amount + microGain(micro) * microGate * amount;
    }
    case "energy":
    case "rune": {
      const pulse = Math.sin((x + y) / (1.4 * d)) * 0.14 * amount;
      let micro = 0;
      if (microGate > 0) {
        // crackling wisps drifting along the axis
        const wisp = Math.sin(along / (1.8 * d) + Math.sin(perp / (2.5 * d)) * 1.4);
        micro = wisp > 0.72 ? 0.3 : wisp < -0.86 ? -0.18 : 0;
      }
      return pulse + microGain(micro) * microGate * amount;
    }
    default:
      return 0;
  }
}

export type ShadeResult = {
  pixels: number[];
  width: number;
  height: number;
};

/**
 * Local cross-section coordinate. For every pixel it marches along ±perp until
 * it leaves the silhouette, giving u ∈ [0,1] where 0 is the light-facing edge
 * and 1 is the trailing edge *of that particular band*. A global bounding-box
 * coordinate cannot do this — a sword's hilt would swallow the blade's range.
 */
function localCross(field: FieldData, px: number, py: number): number[] {
  const size = field.size;
  const u = new Array(size * size).fill(0.5);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      if (!field.mask[i]) continue;
      const march = (sx: number, sy: number, dx: number, dy: number): number => {
        let steps = 0;
        let cx = sx;
        let cy = sy;
        while (steps < size) {
          cx += dx * 0.5;
          cy += dy * 0.5;
          const rx = Math.round(cx);
          const ry = Math.round(cy);
          if (rx < 0 || ry < 0 || rx >= size || ry >= size) break;
          if (!field.mask[ry * size + rx]) break;
          steps++;
        }
        return steps * 0.5;
      };
      const back = march(x, y, -px, -py);
      const fwd = march(x, y, px, py);
      const total = back + fwd;
      u[i] = total > 0.001 ? back / total : 0.5;
    }
  }
  return u;
}

export function shadeGrid(grid: string[][], cfg: ShadeConfig): ShadeResult {
  const rng = mulberry32(cfg.seed ^ 0x51ed2701);
  const field = computeField(grid);
  const size = field.size;
  const pixels = new Array(size * size * 4).fill(0);
  const detail = Math.max(1, Math.round(cfg.detailScale ?? 1));
  const axis = principalAxis(field, size);
  field.ax = axis[0];
  field.ay = axis[1];

  const dark = mixRgb(cfg.pal.outline, [0, 0, 0], 0.25);
  // Highlight tint stays slightly coloured so metal never blows out to white.
  const lightTint = mixRgb([255, 250, 235], cfg.pal.accent, 0.34);
  const outlineRgb = mixRgb(
    cfg.pal.outline,
    cfg.pal.metal,
    cfg.sig.outlineSoft * 0.42,
  );
  const specRgb = mixRgb([255, 255, 255], cfg.pal.gem, 0.12);
  const metalT = cfg.metallic / 100;
  // Smooth signatures earn extra tonal steps at higher resolutions (that is
  // the point of 32×/64×); deliberately flat signatures stay flat.
  const bands =
    cfg.sig.bands <= 3
      ? 3
      : Math.min(10, Math.round(cfg.sig.bands * (1 + (detail - 1) * 0.45)));
  const satMul = cfg.sig.sat * (0.85 + metalT * 0.3);
  const contrast = 1 + cfg.sig.contrast * 0.7;
  const cleanFactor = 1 - cfg.sig.clean * 0.6;
  // Outline / inner-rim depth in raw cells, scaling with resolution.
  const inkDepth = Math.max(1, Math.round(detail * 0.5));
  const hiCap = 0.34 * (1 - (detail - 1) * 0.055);

  // Principal axis of the silhouette (already light-oriented by
  // principalAxis), so a blade ramps bright toward its lit end.
  const ax = field.ax;
  const ay = field.ay;
  let cxm = 0;
  let cym = 0;
  let nMask = 0;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      if (!field.mask[i]) continue;
      nMask++;
      cxm += x;
      cym += y;
    }
  cxm /= Math.max(1, nMask);
  cym /= Math.max(1, nMask);
  // Perpendicular axis, oriented toward the light: gives the cross-blade
  // coordinate used for cylindrical (rounded) shading.
  let px = -ay;
  let py = ax;
  if (px * LIGHT[0] + py * LIGHT[1] < 0) {
    px = -px;
    py = -py;
  }
  const axialT = new Array(size * size).fill(0.5);
  const crossT = new Array(size * size).fill(0.5);
  if (nMask > 3) {
    let minA = Infinity;
    let maxA = -Infinity;
    let minC = Infinity;
    let maxC = -Infinity;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        if (!field.mask[i]) continue;
        const a = (x - cxm) * ax + (y - cym) * ay;
        const c = (x - cxm) * px + (y - cym) * py;
        axialT[i] = a;
        crossT[i] = c;
        if (a < minA) minA = a;
        if (a > maxA) maxA = a;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    const spanA = Math.max(0.001, maxA - minA);
    for (let i = 0; i < axialT.length; i++) axialT[i] = (axialT[i]! - minA) / spanA;
  }
  void (() => {
    for (let i = 0; i < crossT.length; i++) crossT[i] = 0.5;
  })();
  const crossLocal = localCross(field, px, py);
  for (let i = 0; i < crossT.length; i++) crossT[i] = crossLocal[i] ?? 0.5;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const ch = grid[y]![x]!;
      if (ch === "." || !field.mask[i]) continue;
      const material = CHAR_TO_MATERIAL[ch];
      if (!material) continue;

      const base = materialBase(material, cfg.pal, cfg.hueShift);

      const d = field.dist[i] ?? 0;
      const nx = field.nx[i] ?? 0;
      const ny = field.ny[i] ?? 0;
      const lambert = clamp(nx * LIGHT[0] + ny * LIGHT[1], -1, 1);
      const form = d / field.maxDist;
      const emissive = EMISSIVE[material];

      // Core lighting term: bevelled rim light, gentle form curve, ambient
      // occlusion in thick cores, and a pseudo-3d top/bottom split.
      // Thin structures trust material tone over the normal. Neighbours are
      // sampled `scale` cells away so "one source pixel wide" means the same
      // thing at 16×, 32× and 64× — otherwise high-res renders lose the tonal
      // compression that keeps thin features out of the highlights.
      const step = Math.max(1, detail);
      const openAt = (dx: number, dy: number): boolean => {
        const xx = x + dx * step;
        const yy = y + dy * step;
        if (xx < 0 || yy < 0 || xx >= size || yy >= size) return true;
        return !field.mask[yy * size + xx];
      };
      let openFaces = 0;
      if (openAt(-1, 0)) openFaces++;
      if (openAt(1, 0)) openFaces++;
      if (openAt(0, -1)) openFaces++;
      if (openAt(0, 1)) openFaces++;
      const thinMix = clamp((openFaces - 1) / 2.2, 0, 0.85);
      const lambertEff = lambert * (1 - thinMix) + MATERIAL_LEVEL[material] * thinMix * 1.35;

      const rim = lambertEff * cfg.sig.bevel * 0.95;
      const formCurve = (form - 0.5) * cfg.sig.depth * 0.26;
      const occlusion = form > 0.62 ? -(form - 0.62) * cfg.sig.depth * 0.55 : 0;
      const pseudo = ny * cfg.sig.pseudo3d * 0.3 + nx * cfg.sig.pseudo3d * 0.1;
      const axial = ((axialT[i] ?? 0.5) - 0.45) * cfg.sig.axialGrad * 0.8;
      // Rounded profile: brightest on the light-facing flank, falling off
      // monotonically toward the trailing edge. Without this a wide blade
      // collapses into two flat tones at high resolution.
      const cylWeight =
        material === "blade" || material === "core"
          ? 1
          : material === "gold" || material === "iron"
            ? 0.6
            : 0.35;
      const cyl =
        (0.5 - (crossT[i] ?? 0.5)) *
        (cfg.sig.bevel * 0.5 + cfg.sig.depth * 0.24) *
        1.7 *
        cylWeight;
      const materialBias = MATERIAL_LEVEL[material] * (1 - thinMix) * 0.3;
      let level = clamp(
        (rim + formCurve + occlusion + axial + cyl + materialBias - pseudo) * contrast * 0.78 - 0.04,
        -1,
        1,
      );
      level = Math.max(level, emissive * 0.5);

      const ornament = ornamentValue(material, x, y, field, cfg, rng) * cleanFactor;
      level = clamp(level + ornament, -1, 1);

      // Silhouette treatment.
      const isBoundary = d === 0;
      const innerRing = d === inkDepth && cfg.sig.doubleEdge > 0.05;
      let rgb: RGB;
      let alpha = 255;

      // edgeDark decides how much of the silhouette is inked vs. left as a lit
      // rim; innerRim adds the bright bevel just inside the outline. Outline
      // depth grows with resolution so a 64× icon still reads as inked.
      const inkThreshold = 0.15 + cfg.sig.edgeDark * 0.55;
      const inked = d < inkDepth && emissive < 0.5;

      if (inked) {
        // Coloured outline: darkened body hue, lighter on the lit side so the
        // silhouette stays hard everywhere but never reads as a black halo.
        const litSide = lambert > inkThreshold ? 0.45 : 0;
        const soft = (1 - cfg.sig.outline) * 0.6 + litSide;
        const bodyDark = ramp(base, -0.55, dark, lightTint, satMul, hiCap);
        rgb = mixRgb(mixRgb(outlineRgb, bodyDark, 0.55), ramp(base, level - 0.2, dark, lightTint, satMul, hiCap), soft);
        if (innerRing) rgb = mixRgb(rgb, dark, 0.24 * cfg.sig.doubleEdge);
      } else {
        let bodyLevel = level;
        const rimBand = d >= inkDepth && d < inkDepth + inkDepth;
        if (rimBand && cfg.sig.innerRim > 0.02 && lambert > -0.1) {
          bodyLevel += cfg.sig.innerRim * 0.22 * clamp(lambert + 0.4, 0, 1);
        }
        const q = quantise(clamp(bodyLevel, -1, 1), bands, cfg.sig.dither, x, y);
        rgb = ramp(base, q, dark, lightTint, satMul, hiCap);
        if (innerRing && lambert < 0) rgb = mixRgb(rgb, dark, 0.3 * cfg.sig.doubleEdge);

        // Lit rim catch-light — the "clean pack" signature.
        if (isBoundary && lambert > 0.3) {
          const power = clamp((lambert - 0.3) * (0.28 + cfg.sig.innerRim * 0.5), 0, 0.45);
          rgb = mixRgb(rgb, lightTint, power);
        }

        // Specular pinpoints on metal / gem / energy — sparse, never blanket.
        const specPower = SPECULAR[material] * cfg.sig.spec * (0.4 + metalT * 0.6);
        if (specPower > 0.5 && lambert > 0.86 && d === inkDepth && (x + y * 3) % 7 === 0) {
          rgb = mixRgb(rgb, specRgb, clamp(0.45 + specPower * 0.35, 0, 0.85));
        }

        if (emissive > 0) {
          const boost = emissive * (0.35 + cfg.glow / 160);
          rgb = mixRgb(rgb, mixRgb(specRgb, base, 0.35), clamp(boost, 0, 0.75));
        }
      }

      // Per-pixel grain, kept subtle so icons stay readable.
      if (cfg.sig.grain > 0.4) {
        const n = (bayer(x, y) - 0.5) * 6 * cfg.sig.grain;
        rgb = [rgb[0] + n, rgb[1] + n, rgb[2] + n];
      }

      rgb = saturateRgb(rgb, (satMul - 1) * 0.35);
      const o = i * 4;
      pixels[o] = clamp(rgb[0]);
      pixels[o + 1] = clamp(rgb[1]);
      pixels[o + 2] = clamp(rgb[2]);
      pixels[o + 3] = alpha;
    }
  }

  bloomAndGlow(pixels, field, cfg);
  return { pixels, width: size, height: size };
}

/** Outer rarity bloom + emissive spill, the glow that sells a legendary icon. */
function bloomAndGlow(pixels: number[], field: FieldData, cfg: ShadeConfig): void {
  const size = field.size;
  const strength = (cfg.glow / 100) * (0.35 + cfg.sig.rim * 0.9);
  if (strength <= 0.01) return;
  const glowRgb = cfg.glowColor;

  // Emissive spill: energy/rune/gem cells brighten their neighbours.
  const spill = new Array(size * size).fill(0);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      if (!field.mask[i]) continue;
      const a = pixels[i * 4 + 3] ?? 0;
      if (a < 200) continue;
      const bright = (pixels[i * 4]! + pixels[i * 4 + 1]! + pixels[i * 4 + 2]!) / 3;
      if (bright < 170) continue;
      for (let oy = -1; oy <= 1; oy++)
        for (let ox = -1; ox <= 1; ox++) {
          if (!ox && !oy) continue;
          const j = (y + oy) * size + (x + ox);
          if (j < 0 || j >= size * size) continue;
          spill[j] += ox === 0 || oy === 0 ? 0.5 : 0.28;
        }
    }
  }
  for (let i = 0; i < size * size; i++) {
    if (!field.mask[i] || spill[i] <= 0) continue;
    const t = clamp(spill[i] * 0.22 * strength, 0, 0.5);
    pixels[i * 4] = clamp(pixels[i * 4]! + glowRgb[0] * t);
    pixels[i * 4 + 1] = clamp(pixels[i * 4 + 1]! + glowRgb[1] * t);
    pixels[i * 4 + 2] = clamp(pixels[i * 4 + 2]! + glowRgb[2] * t);
  }

}

export function sparklePass(pixels: number[], field: FieldData, count: number, seed: number): void {
  if (count <= 0) return;
  const rng = mulberry32(seed ^ 0x2545f491);
  const size = field.size;
  let placed = 0;
  let guard = 0;
  while (placed < count && guard < 600) {
    guard++;
    const x = 1 + Math.floor(rng() * (size - 2));
    const y = 1 + Math.floor(rng() * (size - 2));
    const i = y * size + x;
    if (!field.mask[i]) continue;
    if ((pixels[i * 4 + 3] ?? 0) < 200) continue;
    const bright = (pixels[i * 4]! + pixels[i * 4 + 1]! + pixels[i * 4 + 2]!) / 3;
    if (bright < 90) continue;
    pixels[i * 4] = 255;
    pixels[i * 4 + 1] = 252;
    pixels[i * 4 + 2] = 235;
    pixels[i * 4 + 3] = 255;
    if (rngBool(rng, 0.5)) {
      const j = i + (rng() < 0.5 ? 1 : size);
      if (field.mask[j] && (pixels[j * 4 + 3] ?? 0) > 150) {
        pixels[j * 4] = mixRgb([pixels[j * 4]!, pixels[j * 4 + 1]!, pixels[j * 4 + 2]!], [255, 250, 225], 0.6)[0];
        pixels[j * 4 + 1] = 250;
        pixels[j * 4 + 2] = 225;
      }
    }
    placed++;
  }
}

export function hueRotatePixels(pixels: number[], deg: number): void {
  if (!deg) return;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3]! <= 0) continue;
    const rgb = shiftHueRgb([pixels[i]!, pixels[i + 1]!, pixels[i + 2]!], deg);
    pixels[i] = rgb[0];
    pixels[i + 1] = rgb[1];
    pixels[i + 2] = rgb[2];
  }
}

export { hexToRgb };
