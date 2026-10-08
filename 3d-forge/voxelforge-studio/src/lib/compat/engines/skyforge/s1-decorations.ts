import type { Ramps, Sampler } from './s1-types';
import type { Decoration, FormArgs } from './forms-sampler';

/**
 * Body-aware decorations.
 *
 * Instead of stamping ornaments at fixed canvas coordinates, the rendered body is
 * analysed first (centroid, principal axis, width profile, outline normals, inner /
 * outer distance fields, thickest points). Every decoration is then anchored to that
 * geometry, so it hugs swords, shields, helmets, polearms and moved/rotated bodies alike.
 */

const G = 64;
const TAU = Math.PI * 2;
const BINS = 24;

// ---------------------------------------------------------------- helpers
function hash2(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
function fbm(x: number, y: number, seed: number): number {
  let sum = 0, amp = 0.5, f = 1;
  for (let o = 0; o < 3; o++) { sum += vnoise(x * f, y * f, seed + o * 1013) * amp; amp *= 0.5; f *= 2; }
  return sum / 0.875;
}
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a), B = hexToRgb(b);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(A[0] + (B[0] - A[0]) * t)}${c(A[1] + (B[1] - A[1]) * t)}${c(A[2] + (B[2] - A[2]) * t)}`;
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------- geometry
export interface EdgePoint { x: number; y: number; nx: number; ny: number; u: number; t: number; angle: number }

export interface BodyGeometry {
  empty: boolean;
  mask: Uint8Array;
  inside: Float32Array;
  outside: Float32Array;
  nearX: Int16Array;
  nearY: Int16Array;
  cx: number; cy: number;
  ax: number; ay: number;   // principal axis, pointing hilt → tip
  nx: number; ny: number;   // normal, + side = lower-right (shade side)
  sMin: number; sMax: number; L: number;
  tMin: number; tMax: number;
  elongation: number;
  weapon: boolean;
  hilt: { x: number; y: number };
  tip: { x: number; y: number };
  upper: Float32Array;      // half width on the − normal side per bin
  lower: Float32Array;      // half width on the + normal side per bin
  maxHalf: number;
  guardU: number;
  edges: EdgePoint[];
  maxima: { x: number; y: number; depth: number; u: number }[];
}

/** Multi-source nearest-point field (two-pass 8SSEDT-style propagation). */
function nearestField(isSource: (i: number) => boolean) {
  const dist = new Float32Array(G * G).fill(1e9);
  const nx = new Int16Array(G * G).fill(-1);
  const ny = new Int16Array(G * G).fill(-1);
  for (let i = 0; i < G * G; i++) {
    if (isSource(i)) { dist[i] = 0; nx[i] = i % G; ny[i] = Math.floor(i / G); }
  }
  const relax = (x: number, y: number, qx: number, qy: number) => {
    if (qx < 0 || qy < 0 || qx >= G || qy >= G) return;
    const j = qy * G + qx;
    if (nx[j] < 0) return;
    const i = y * G + x;
    const d = Math.hypot(x - nx[j], y - ny[j]);
    if (d < dist[i]) { dist[i] = d; nx[i] = nx[j]; ny[i] = ny[j]; }
  };
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < G; y++) {
      for (let x = 0; x < G; x++) { relax(x, y, x - 1, y); relax(x, y, x - 1, y - 1); relax(x, y, x, y - 1); relax(x, y, x + 1, y - 1); }
      for (let x = G - 1; x >= 0; x--) relax(x, y, x + 1, y);
    }
    for (let y = G - 1; y >= 0; y--) {
      for (let x = G - 1; x >= 0; x--) { relax(x, y, x + 1, y); relax(x, y, x + 1, y + 1); relax(x, y, x, y + 1); relax(x, y, x - 1, y + 1); }
      for (let x = 0; x < G; x++) relax(x, y, x - 1, y);
    }
  }
  return { dist, nx, ny };
}

export function analyzeBody(body: Sampler): BodyGeometry {
  const mask = new Uint8Array(G * G);
  let count = 0, sx = 0, sy = 0;
  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      if (body(x + 0.5, y + 0.5)) { mask[y * G + x] = 1; count++; sx += x + 0.5; sy += y + 0.5; }
    }
  }
  const empty = count < 4;
  const cx = empty ? 32 : sx / count;
  const cy = empty ? 32 : sy / count;

  // covariance → principal axis
  let cxx = 0, cyy = 0, cxy = 0;
  for (let i = 0; i < G * G; i++) {
    if (!mask[i]) continue;
    const dx = (i % G) + 0.5 - cx, dy = Math.floor(i / G) + 0.5 - cy;
    cxx += dx * dx; cyy += dy * dy; cxy += dx * dy;
  }
  const n = Math.max(1, count);
  cxx /= n; cyy /= n; cxy /= n;
  const tr = cxx + cyy, det = cxx * cyy - cxy * cxy;
  const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  const l1 = tr / 2 + disc, l2 = Math.max(0.05, tr / 2 - disc);
  const elongation = empty ? 3 : Math.sqrt(l1 / l2);
  const weapon = elongation >= 1.8;

  let ax: number, ay: number;
  if (empty) { ax = Math.SQRT1_2; ay = -Math.SQRT1_2; }
  else if (!weapon) { ax = 0; ay = -1; }             // round/compact bodies: "up" is the tip
  else {
    const ang = 0.5 * Math.atan2(2 * cxy, cxx - cyy);
    ax = Math.cos(ang); ay = Math.sin(ang);
    // tip points toward the upper-right, the Minecraft held-item convention
    if (ax - ay < -1e-6 || (Math.abs(ax - ay) <= 1e-6 && ay > 0)) { ax = -ax; ay = -ay; }
  }
  const nx = -ay, ny = ax;

  // extents along the axis + width profile
  let sMin = Infinity, sMax = -Infinity, tMin = Infinity, tMax = -Infinity;
  for (let i = 0; i < G * G; i++) {
    if (!mask[i]) continue;
    const dx = (i % G) + 0.5 - cx, dy = Math.floor(i / G) + 0.5 - cy;
    const s = dx * ax + dy * ay, t = dx * nx + dy * ny;
    sMin = Math.min(sMin, s); sMax = Math.max(sMax, s); tMin = Math.min(tMin, t); tMax = Math.max(tMax, t);
  }
  if (empty) { sMin = -24; sMax = 24; tMin = -4; tMax = 4; }
  const L = Math.max(1, sMax - sMin);

  const upper = new Float32Array(BINS).fill(-1);
  const lower = new Float32Array(BINS).fill(-1);
  let hx = 0, hy = 0, hn = 0, px = 0, py = 0, pn = 0;
  for (let i = 0; i < G * G; i++) {
    if (!mask[i]) continue;
    const x = (i % G) + 0.5, y = Math.floor(i / G) + 0.5;
    const dx = x - cx, dy = y - cy;
    const s = dx * ax + dy * ay, t = dx * nx + dy * ny;
    const b = clamp(Math.floor(((s - sMin) / L) * BINS), 0, BINS - 1);
    upper[b] = Math.max(upper[b], -t);
    lower[b] = Math.max(lower[b], t);
    if (s <= sMin + 1.5) { hx += x; hy += y; hn++; }
    if (s >= sMax - 1.5) { px += x; py += y; pn++; }
  }
  // fill gaps from nearest filled bin
  for (const arr of [upper, lower]) {
    for (let b = 0; b < BINS; b++) {
      if (arr[b] >= 0) continue;
      let best = 0;
      for (let d = 1; d < BINS; d++) {
        if (b - d >= 0 && arr[b - d] >= 0) { best = arr[b - d]; break; }
        if (b + d < BINS && arr[b + d] >= 0) { best = arr[b + d]; break; }
      }
      arr[b] = best;
    }
    for (let b = 0; b < BINS; b++) arr[b] = Math.max(0.5, arr[b]);
  }
  let maxHalf = 1;
  for (let b = 0; b < BINS; b++) maxHalf = Math.max(maxHalf, upper[b], lower[b]);

  // guard = widest station in the lower half (where hands and crossguards live)
  let guardU = 0.5;
  if (weapon) {
    let bestW = -1;
    for (let b = Math.floor(BINS * 0.1); b <= Math.floor(BINS * 0.5); b++) {
      const w = upper[b] + lower[b];
      if (w > bestW) { bestW = w; guardU = (b + 0.5) / BINS; }
    }
  }

  const outsideF = nearestField((i) => mask[i] === 1);
  const insideF = nearestField((i) => mask[i] === 0);
  const inside = new Float32Array(G * G);
  for (let i = 0; i < G * G; i++) {
    if (!mask[i]) continue;
    const x = i % G, y = Math.floor(i / G);
    const border = Math.min(x + 0.5, y + 0.5, G - x - 0.5, G - y - 0.5);
    inside[i] = Math.min(insideF.dist[i], border);
  }

  // outline points with outward normals
  const edges: EdgePoint[] = [];
  const isEmpty = (x: number, y: number) => x < 0 || y < 0 || x >= G || y >= G || !mask[y * G + x];
  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      if (!mask[y * G + x]) continue;
      if (!(isEmpty(x - 1, y) || isEmpty(x + 1, y) || isEmpty(x, y - 1) || isEmpty(x, y + 1))) continue;
      let ex = 0, ey = 0;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        if ((ox || oy) && isEmpty(x + ox, y + oy)) { ex += ox; ey += oy; }
      }
      let len = Math.hypot(ex, ey);
      if (len < 1e-4) { ex = x + 0.5 - cx; ey = y + 0.5 - cy; len = Math.hypot(ex, ey) || 1; }
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      edges.push({
        x: x + 0.5, y: y + 0.5, nx: ex / len, ny: ey / len,
        u: (dx * ax + dy * ay - sMin) / L, t: dx * nx + dy * ny,
        angle: Math.atan2(dy, dx),
      });
    }
  }
  if (weapon) edges.sort((p, q) => p.u - q.u || p.t - q.t);
  else edges.sort((p, q) => p.angle - q.angle);

  // thickest interior points (good seats for emblems)
  const maxima: BodyGeometry['maxima'] = [];
  for (let y = 1; y < G - 1; y++) {
    for (let x = 1; x < G - 1; x++) {
      const i = y * G + x;
      if (!mask[i] || inside[i] < 2) continue;
      let peak = true;
      for (let oy = -1; oy <= 1 && peak; oy++) for (let ox = -1; ox <= 1; ox++) {
        if ((ox || oy) && inside[(y + oy) * G + x + ox] > inside[i]) { peak = false; break; }
      }
      if (!peak) continue;
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      maxima.push({ x: x + 0.5, y: y + 0.5, depth: inside[i], u: (dx * ax + dy * ay - sMin) / L });
    }
  }
  maxima.sort((p, q) => q.depth - p.depth);

  return {
    empty, mask, inside, outside: outsideF.dist, nearX: outsideF.nx, nearY: outsideF.ny,
    cx, cy, ax, ay, nx, ny, sMin, sMax, L, tMin, tMax, elongation, weapon,
    hilt: hn ? { x: hx / hn, y: hy / hn } : { x: cx + ax * sMin, y: cy + ay * sMin },
    tip: pn ? { x: px / pn, y: py / pn } : { x: cx + ax * sMax, y: cy + ay * sMax },
    upper, lower, maxHalf, guardU, edges, maxima,
  };
}

// ---------------------------------------------------------------- decorations
type Deco = (x: number, y: number) => string | null;

interface DecorationLayer { back: Sampler; front: Sampler; hasBack: boolean; hasFront: boolean }

/**
 * Builds decoration samplers in canonical 64-space.
 * `stackCount` is the total number of active decorations; when many are stacked, their
 * sizes are quietened so the composition does not collapse into a knot.
 */
function decorationSamplers(list: Decoration[], a: FormArgs, geo: BodyGeometry, stackCount = list.length): DecorationLayer {
  const none: Sampler = () => null;
  if (list.length === 0) return { back: none, front: none, hasBack: false, hasFront: false };

  const R: Ramps = a.R;
  const { lv, detail, seed } = a;
  const gems = a.gems;
  const calm = stackCount > 3 ? Math.max(0.55, 1 - 0.08 * (stackCount - 3)) : 1;
  const scale = (a.decorationScale ?? 1) * calm;
  const spread = a.decorationSpread ?? 1;
  const phase = a.phase ?? 0;
  const has = (d: Decoration) => list.includes(d);

  const { cx, cy, ax, ay, nx, ny, sMin, L, weapon } = geo;
  const local = (x: number, y: number) => {
    const dx = x - cx, dy = y - cy;
    const s = dx * ax + dy * ay;
    return { u: (s - sMin) / L, t: dx * nx + dy * ny };
  };
  const pointAt = (u: number, t: number) => {
    const s = sMin + u * L;
    return { x: cx + ax * s + nx * t, y: cy + ay * s + ny * t };
  };
  const half = (u: number, side: number) => {
    const b = clamp(Math.floor(u * BINS), 0, BINS - 1);
    return side > 0 ? geo.lower[b] : geo.upper[b];
  };
  const cell = (x: number, y: number) => {
    const gx = Math.floor(x), gy = Math.floor(y);
    return gx < 0 || gy < 0 || gx >= G || gy >= G ? -1 : gy * G + gx;
  };
  const isBody = (x: number, y: number) => { const i = cell(x, y); return i >= 0 && geo.mask[i] === 1; };
  /** oriented frame: a = along dir, b = across dir */
  const frame = (x: number, y: number, ox: number, oy: number, dx: number, dy: number) => {
    const vx = x - ox, vy = y - oy;
    return { a: vx * dx + vy * dy, b: -vx * dy + vy * dx };
  };
  const pick = (count: number, filter: (e: EdgePoint) => boolean, salt: number): EdgePoint[] => {
    const pool = geo.edges.filter(filter);
    if (!pool.length || count <= 0) return [];
    const step = pool.length / count;
    const off = hash2(salt, 3, seed) * step;
    const out: EdgePoint[] = [];
    for (let k = 0; k < count; k++) out.push(pool[Math.floor(off + k * step) % pool.length]);
    return out;
  };
  const bladeEdge = (lo: number, hi: number, side = 0) => (e: EdgePoint) =>
    !weapon || (e.u >= lo && e.u <= hi && (side === 0 || Math.sign(e.t) === side));

  const guard = pointAt(geo.guardU, 0);
  const mid = pointAt(0.5, 0);
  const crossWidth = geo.tMax - geo.tMin;

  const back: Deco[] = [];
  const front: Deco[] = [];

  // ================================================================ BACK LAYER

  if (has('halo')) {
    // coronet just past the tip, oriented across the body
    const c = { x: geo.tip.x + ax * 4.2 * scale, y: geo.tip.y + ay * 4.2 * scale };
    const r1 = (weapon ? clamp(half(0.92, 1) + half(0.92, -1) + 5, 5, 9) : clamp(crossWidth * 0.34, 5, 13)) * spread * scale;
    const r2 = 2.3 * scale;
    back.push((x, y) => {
      const { a: along, b: across } = frame(x, y, c.x, c.y, ax, ay);
      const q = (across / r1) ** 2 + (along / r2) ** 2;
      if (q < 0.5 || q > 1.2) return null;
      const pulse = Math.sin(Math.atan2(along, across) * 3 + phase * TAU);
      return R.accent[lv(pulse > 0.55 ? 4 : 3)];
    });
  }

  if (has('runering')) {
    const c = weapon ? guard : { x: cx, y: cy };
    const rr = (weapon ? clamp((half(geo.guardU, 1) + half(geo.guardU, -1)) * 0.9 + 6, 8, 13) : clamp(Math.max(crossWidth, L) * 0.5 + 3, 10, 27)) * spread;
    back.push((x, y) => {
      const d = Math.hypot(x - c.x, y - c.y);
      if (Math.abs(d - rr) < 0.75 * scale) return R.gem[lv(2)];
      if (detail >= 1 && d < rr - 0.75 * scale && d > rr - 3.8 * scale) {
        const ang = Math.atan2(y - c.y, x - c.x) + phase * TAU * 0.25;
        const slots = Math.max(8, Math.round(rr * 0.9));
        const f = ((ang + Math.PI) / TAU) * slots;
        const slot = Math.floor(f);
        if (f - slot < 0.38 && hash2(slot, 7, seed) > 0.3) return R.gem[lv(4)];
      }
      return null;
    });
  }

  if (has('orbit')) {
    const ra = (L * 0.5 + 4) * spread, rb = (geo.maxHalf + 5) * spread;
    const count = detail >= 2 ? 8 : 5;
    const motes = Array.from({ length: count }, (_, i) => {
      const ang = (i / count + phase) * TAU + hash2(i, 3, seed) * 0.6;
      return {
        x: mid.x + ax * Math.cos(ang) * ra + nx * Math.sin(ang) * rb,
        y: mid.y + ay * Math.cos(ang) * ra + ny * Math.sin(ang) * rb,
        r: (0.9 + hash2(i, 29, seed) * 1.0) * scale,
        v: hash2(i, 47, seed),
      };
    });
    back.push((x, y) => {
      for (const m of motes) {
        if (Math.hypot(x - m.x, y - m.y) < m.r) return R.gem[lv(m.v > 0.85 ? 4 : m.v > 0.4 ? 3 : 2)];
      }
      return null;
    });
  }

  if (has('wings')) {
    const u0 = weapon ? geo.guardU : 0.55;
    const anchor = pointAt(u0, 0);
    const span = (weapon ? clamp(L * 0.4, 10, 22) : clamp(crossWidth * 0.55, 9, 20)) * spread;
    const flap = Math.sin(phase * TAU) * 2.4;
    back.push((x, y) => {
      const { a: along, b: across } = frame(x, y, anchor.x, anchor.y, ax, ay);
      for (const sgn of [-1, 1]) {
        const o = across * sgn;
        const w0 = half(u0, sgn) + 0.5;
        if (o <= w0 || o >= w0 + span) continue;
        const u = (o - w0) / span;
        const top = 3 + span * 0.55 * Math.sin(u * 1.4) + flap * u;
        const bot = -6 + u * span * 0.45 + 2.2 * Math.abs(Math.sin(u * 7.6)) * scale;
        if (along <= bot || along >= top) continue;
        const v = (along - bot) / Math.max(0.6, top - bot);
        let i = v > 0.78 ? 4 : v > 0.45 ? 3 : v > 0.18 ? 2 : 1;
        if (sgn > 0) i = Math.max(0, i - 1);
        if (detail >= 1 && Math.abs((u * 4) % 1) < 0.09) i = Math.max(0, i - 2);
        return R.accent[lv(i)];
      }
      return null;
    });
  }

  if (has('ribbon')) {
    const o = geo.hilt;
    const steps = Math.round(18 * spread);
    back.push((x, y) => {
      if (Math.hypot(x - o.x, y - o.y) < 1.6 * scale) return R.accent[lv(3)];
      for (let k = 0; k < 2; k++) {
        for (let step = 0; step <= steps; step++) {
          const py = o.y + 1 + step * 0.9;
          const px = o.x - step * 0.35 + k * 2.2 + Math.sin(step * 0.33 + k * 1.9 + phase * TAU) * (1.5 + step * 0.16) * spread;
          if (Math.abs(x - px) < 1.0 * scale && Math.abs(y - py) < 0.6) {
            return R.accent[lv(step % 4 === 0 ? 1 : step % 2 === 0 ? 2 : 3)];
          }
        }
      }
      return null;
    });
  }

  if (has('chain')) {
    const o = geo.hilt;
    const links = Array.from({ length: 7 }, (_, k) => {
      const t = k / 6;
      return {
        x: o.x - k * 1.7 * spread + Math.sin(phase * TAU + k * 0.6) * 0.8 * t,
        y: o.y + 1.8 + k * 2.1 * spread - Math.sin(t * Math.PI) * 1.4,
      };
    });
    back.push((x, y) => {
      for (let k = 0; k < links.length; k++) {
        const d = Math.hypot(x - links[k].x, y - links[k].y);
        if (d < 2.1 * scale && d > 0.9 * scale) return R.grip[lv(k % 2 === 0 ? 3 : 1)];
      }
      return null;
    });
  }

  if (has('crown')) {
    // weapons: a crown-shaped guard crest pointing toward the tip; compact bodies: sits on top
    const base = weapon ? pointAt(geo.guardU + 0.03, 0) : { x: geo.tip.x - ax * 1, y: geo.tip.y - ay * 1 };
    const bLo = weapon ? -half(geo.guardU, -1) - 3 : -clamp(crossWidth * 0.24, 4, 8) * spread;
    const bHi = weapon ? half(geo.guardU, 1) + 3 : clamp(crossWidth * 0.24, 4, 8) * spread;
    const width = bHi - bLo;
    back.push((x, y) => {
      const { a: along, b: across } = frame(x, y, base.x, base.y, ax, ay);
      if (across < bLo || across > bHi || along < 0) return null;
      const f = Math.abs(Math.sin(((across - bLo) / width) * Math.PI * 2.5));
      const peak = (weapon ? 4.5 + 6 * f : 3 + 4.2 * f) * scale;
      if (along > peak) return null;
      if (detail >= 1 && gems > 0.1 && f > 0.93 && along > peak - 1.3) return R.gem[lv(4)];
      return R.accent[lv(along < 1 ? 2 : across < (bLo + bHi) / 2 ? 4 : 3)];
    });
  }

  if (has('moons')) {
    const rad = (weapon ? L * 0.5 + 5 : Math.max(crossWidth, L) * 0.5 + 6) * spread;
    const baseAng = Math.atan2(ay, ax);
    const moons = Array.from({ length: 5 }, (_, i) => {
      const ang = baseAng + (i - 2) * 0.42 + phase * 0.3;
      return { x: mid.x + Math.cos(ang) * rad, y: mid.y + Math.sin(ang) * rad, r: (2.1 + (i === 2 ? 1.2 : 0)) * scale, i };
    });
    back.push((x, y) => {
      for (const m of moons) {
        if (Math.hypot(x - m.x, y - m.y) < m.r && Math.hypot(x - m.x - m.r * 0.5, y - m.y + m.r * 0.2) > m.r * 0.7) {
          return R.gem[lv(m.i % 2 ? 3 : 4)];
        }
      }
      return null;
    });
  }

  if (has('feathers')) {
    const o = geo.hilt;
    let gx = -ax, gy = -ay + 0.8;
    const gl = Math.hypot(gx, gy) || 1; gx /= gl; gy /= gl;
    const feathers = [-0.55, -0.18, 0.18, 0.55].map((off, k) => {
      const ang = Math.atan2(gy, gx) + off * spread;
      return { dx: Math.cos(ang), dy: Math.sin(ang), len: (12.5 - Math.abs(off) * 4) * scale, k };
    });
    back.push((x, y) => {
      for (const f of feathers) {
        const { a: along, b: across } = frame(x, y, o.x, o.y, f.dx, f.dy);
        if (along < 0.5 || along > f.len) continue;
        const w = 2.9 * scale * Math.pow(Math.sin((along / f.len) * Math.PI), 0.7);
        if (Math.abs(across) > w) continue;
        if (Math.abs(across) < 0.4) return R.accent[lv(1)];
        return R.accent[lv(across < 0 ? 4 : f.k % 2 ? 2 : 3)];
      }
      return null;
    });
  }

  if (has('gears')) {
    const gearsAt = [-1, 1].map((sgn) => {
      const u = weapon ? geo.guardU : 0.5;
      const r = (weapon ? clamp(half(u, sgn) * 0.9 + 2.5, 3.5, 6.5) : clamp(geo.maxHalf * 0.35, 4, 7)) * scale;
      const p = pointAt(u, sgn * (half(u, sgn) + r * 0.85));
      return { ...p, r, dir: sgn };
    });
    back.push((x, y) => {
      for (const g of gearsAt) {
        const d = Math.hypot(x - g.x, y - g.y);
        if (d > g.r * 1.05) continue;
        const ang = Math.atan2(y - g.y, x - g.x) + phase * TAU * g.dir * 0.25;
        const tooth = 0.82 + 0.2 * (Math.sin(ang * 8) > 0.2 ? 1 : 0);
        if (d < g.r * tooth && d > g.r * 0.42) return R.metal[lv(x + y < g.x + g.y ? 3 : 1)];
        if (d <= g.r * 0.22) return R.accent[lv(3)];
      }
      return null;
    });
  }

  if (has('banner')) {
    const u0 = weapon ? 0.3 : 0.35, u1 = weapon ? 0.52 : 0.75;
    const lenF = (weapon ? 11 : 9) * spread * scale;
    back.push((x, y) => {
      const p = local(x, y);
      if (p.u < u0 - 0.02 || p.u > u1 + 0.12) return null;
      const edge = half(clamp(p.u, u0, u1), -1);
      const o = -p.t - edge;
      if (o <= 0 || o > lenF) return null;
      const frac = o / lenF;
      const wave = (Math.sin(o * 0.55 + phase * TAU) * 1.1) / L;
      const lo = u0 + wave;
      const hi = u1 - (u1 - u0) * frac * 0.55 + wave;
      if (p.u < lo || p.u > hi) return null;
      if (frac > 0.72 && Math.abs(p.u - (lo + hi) / 2) < (hi - lo) * 0.2) return null; // swallow-tail
      if (frac > 0.12 && frac < 0.22) return R.gem[lv(3)];
      return R.accent[lv(p.u < (lo + hi) / 2 ? 3 : 2)];
    });
  }

  // ================================================================ FRONT LAYER

  if (has('thorns')) {
    const barbs = [
      ...pick(detail >= 2 ? 6 : 4, bladeEdge(0.32, 0.92, 1), 11).map((e) => ({ e, big: true })),
      ...(detail >= 2 ? pick(3, bladeEdge(0.4, 0.85, -1), 19).map((e) => ({ e, big: false })) : []),
    ].map(({ e, big }, k) => {
      let dx = e.nx - (weapon ? ax * 0.45 : 0), dy = e.ny - (weapon ? ay * 0.45 : 0);
      const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      return {
        ox: e.x - e.nx * 0.5, oy: e.y - e.ny * 0.5, dx, dy,
        len: (big ? 6 + hash2(k, 19, seed) * 3.5 : 4 + hash2(k, 23, seed) * 1.8) * scale,
        base: (big ? 2.3 : 1.6) * scale,
      };
    });
    front.push((x, y) => {
      for (const b of barbs) {
        const { a: along, b: across } = frame(x, y, b.ox, b.oy, b.dx, b.dy);
        if (along < -0.3 || along > b.len) continue;
        if (Math.abs(across) >= b.base * (1 - along / b.len)) continue;
        return R.accent[lv(along / b.len > 0.7 ? 4 : across < 0 ? 3 : 1)];
      }
      return null;
    });
  }

  if (has('crystal')) {
    const clusters = pick(weapon ? (detail >= 2 ? 4 : 3) : 5, bladeEdge(0.3, 0.95), 31).flatMap((e, k) => {
      const base = Math.atan2(e.ny, e.nx);
      const size = (5.5 + hash2(k, 71, seed) * 3.5) * scale;
      return [-0.45, 0, 0.45].map((off, j) => ({
        ox: e.x - e.nx * 0.6, oy: e.y - e.ny * 0.6,
        dx: Math.cos(base + off), dy: Math.sin(base + off),
        len: size * (j === 1 ? 1 : 0.66), w: (j === 1 ? 1.9 : 1.4) * scale,
      }));
    });
    front.push((x, y) => {
      for (const c of clusters) {
        const { a: along, b: across } = frame(x, y, c.ox, c.oy, c.dx, c.dy);
        if (along < -0.4 || along > c.len) continue;
        const w = c.w * Math.min(1, (c.len - along) / (c.w * 1.6));
        if (Math.abs(across) > w) continue;
        if (Math.abs(across) > w - 0.6) return R.gem[lv(0)];
        return R.gem[lv(across < 0 ? (along > c.len * 0.5 ? 4 : 3) : 2)];
      }
      return null;
    });
  }

  if (has('skull')) {
    let c: { x: number; y: number } | null = null;
    let k = scale;
    if (weapon) {
      c = { x: geo.hilt.x - ax * 3.4 * scale, y: geo.hilt.y - ay * 3.4 * scale };
    } else if (geo.maxima.length && geo.maxima[0].depth >= 3.2) {
      c = { x: geo.maxima[0].x, y: geo.maxima[0].y };
      k = Math.min(scale, geo.maxima[0].depth / 5.5);
    }
    if (c) {
      const center = c;
      front.push((x, y) => {
        const dx = (x - center.x) / k, dy = (y - center.y) / k;
        if (Math.abs(dx) > 5.4 || dy < -5.8 || dy > 4.6) return null;
        const cranium = Math.hypot(dx, dy + 1.4) < 5.0;
        const jaw = Math.abs(dx) < 3.2 && dy > 2.0 && dy < 4.4;
        if (!cranium && !jaw) return null;
        if (dy > -2.4 && dy < 0.4 && Math.abs(Math.abs(dx) - 2.1) < 1.3) return '#0a0b12';
        if (dy > 1.1 && dy < 2.2 && Math.abs(dx) < 0.7) return '#0a0b12';
        if (jaw && Math.floor(x) % 2 === 0) return R.metal[lv(0)];
        const l = (dx + dy) / 10;
        return mix(R.metal[lv(l < -0.25 ? 4 : l < 0.15 ? 3 : 2)], '#f3efe2', 0.42);
      });
    }
  }

  if (has('flame')) {
    const hot = '#fff1ad';
    const midC = mix('#ff9a2e', R.gem[3], 0.3);
    const lowC = mix('#e5382c', R.gem[1], 0.3);
    front.push((x, y) => {
      const i = cell(x, y);
      if (i < 0 || geo.mask[i]) return null;
      const d = geo.outside[i];
      if (d < 0.5 || d > 10) return null;
      const bx = geo.nearX[i] + 0.5, by = geo.nearY[i] + 0.5;
      const vy = y - by;
      if (vy > (weapon ? 0.35 : -0.3) * d) return null;   // fire rises; compact bodies burn only on top
      const nl = local(bx, by);
      if (weapon && (nl.t > 0.6 || nl.u < 0.3)) return null;  // only the upper flank of the blade
      const flick = fbm(bx * 0.28 + phase * 1.5, phase * 4.2, seed + 404);
      const H = (2.5 + 7 * flick) * scale;
      if (d > H) return null;
      // tongue silhouette: a narrowing column, animated sideways — no salt noise
      const sway = Math.sin(y * 0.7 + phase * TAU + bx * 0.3) * 0.6;
      if (fbm((x + sway) * 0.35, phase * 3, seed + 77) < 0.22 + (d / H) * 0.4) return null;
      const f = d / H;
      return f < 0.35 ? hot : f < 0.7 ? midC : lowC;
    });
  }

  if (has('lightning')) {
    const core = '#effcff';
    const arc = R.gem[4], glow = R.gem[3];
    const frameTick = Math.floor(phase * 8);
    const bolts = pick(3, bladeEdge(0.35, 0.95), 41).map((e, k) => {
      const px = -e.ny, py = e.nx;
      const pts: { x: number; y: number }[] = [];
      let sx = e.x, sy = e.y;
      for (let step = 0; step < 7; step++) {
        const j = (hash2(k, step + frameTick * 13, seed) - 0.5) * 2.6;
        sx += e.nx * 1.2 + px * j * 0.6; sy += e.ny * 1.2 + py * j * 0.6;
        pts.push({ x: sx, y: sy });
      }
      return pts;
    });
    front.push((x, y) => {
      const i = cell(x, y);
      if (i >= 0 && !geo.mask[i]) {
        const d = geo.outside[i];
        if (d > 0.9 && d < 2.1) {
          const bx = geo.nearX[i] + 0.5, by = geo.nearY[i] + 0.5;
          if (!weapon || local(bx, by).u > 0.25) {
            const theta = Math.atan2(y - cy, x - cx);
            if (fbm(theta * 2.4 + 5, phase * 3 + d * 0.3, seed + 919) > 0.58) return d < 1.5 ? core : arc;
          }
        }
      }
      for (const pts of bolts) {
        for (let s = 0; s < pts.length; s++) {
          if (Math.hypot(x - pts[s].x, y - pts[s].y) < 0.62 * scale) return s % 3 === 0 ? core : glow;
        }
      }
      return null;
    });
  }

  if (has('roots')) {
    const freq = TAU * 2.2 / Math.max(10, L * 0.45) * L;   // ~2 full wraps across the body
    const shift = phase * TAU * 0.25;
    const vine = mix(R.grip[lv(2)], '#4f7a2e', 0.55);
    const vineDark = mix(R.grip[lv(1)], '#2e4d1c', 0.55);
    const leaf = mix(R.accent[lv(3)], '#6fb04a', 0.6);
    const leaves: { x: number; y: number; dx: number; dy: number }[] = [];
    for (let k = 0; k < 8; k++) {
      const u = (Math.PI / 2 + k * Math.PI - shift) / freq;
      if (u < 0.05 || u > (weapon ? 0.88 : 0.95)) continue;
      const side = k % 2 === 0 ? 1 : -1;
      const p = pointAt(u, side * (half(u, side) + 1.6));
      leaves.push({ ...p, dx: ax, dy: ay });
    }
    front.push((x, y) => {
      for (const l of leaves) {
        const { a: along, b: across } = frame(x, y, l.x, l.y, l.dx, l.dy);
        if ((along / (2.1 * scale)) ** 2 + (across / (1.1 * scale)) ** 2 < 1) return leaf;
      }
      if (!isBody(x, y)) return null;
      const p = local(x, y);
      if (weapon && p.u > 0.9) return null;
      const up = half(p.u, -1), lo = half(p.u, 1);
      const tv = (lo - up) / 2 + Math.sin(p.u * freq + shift) * (lo + up) / 2;
      const dv = Math.abs(p.t - tv);
      if (dv < 0.75 * scale) return vine;
      if (dv < 1.15 * scale && p.t > tv) return vineDark;
      return null;
    });
  }

  if (has('tendril')) {
    const tendrils = pick(detail >= 2 ? 4 : 2, bladeEdge(0.2, 0.85), 53).map((e, k) => {
      const pts: { x: number; y: number; r: number }[] = [];
      let ang = Math.atan2(e.ny, e.nx);
      const curl = hash2(k, 7, seed) > 0.5 ? 1 : -1;
      let sx = e.x, sy = e.y;
      for (let step = 1; step <= 14; step++) {
        ang += curl * 0.19 + Math.sin(phase * TAU + k) * 0.03;
        sx += Math.cos(ang); sy += Math.sin(ang);
        pts.push({ x: sx, y: sy, r: 1.6 * scale * (1 - step / 16) });
      }
      return pts;
    });
    front.push((x, y) => {
      for (const pts of tendrils) {
        for (let s = 0; s < pts.length; s++) {
          if (Math.hypot(x - pts[s].x, y - pts[s].y) < pts[s].r) return mix(R.grip[lv(3)], R.accent[lv(s % 4 === 0 ? 4 : 3)], 0.55);
        }
      }
      return null;
    });
  }

  if (has('eyes')) {
    // seat eyes on the thickest parts of the body, sized to fit inside it
    const seats: { x: number; y: number; rx: number; ry: number }[] = [];
    for (const m of geo.maxima) {
      if (seats.length >= (detail >= 2 ? 3 : 2)) break;
      if (m.depth < 2.2) break;
      if (weapon && (m.u < 0.3 || m.u > 0.92)) continue;
      if (seats.some((s) => Math.hypot(s.x - m.x, s.y - m.y) < 7)) continue;
      const rx = Math.min(3 * scale, m.depth * 1.05);
      seats.push({ x: m.x, y: m.y, rx, ry: rx * 0.62 });
    }
    const [ex, ey] = weapon ? [ax, ay] : [1, 0];
    const look = Math.sin(phase * TAU) * 0.6;
    front.push((x, y) => {
      for (const s of seats) {
        const { a: along, b: across } = frame(x, y, s.x, s.y, ex, ey);
        const q = (along / s.rx) ** 2 + (across / s.ry) ** 2;
        if (q > 1.5) continue;
        if (q > 1) return '#07080f';
        if (Math.hypot(along - look, across) < 0.85 * scale) return '#080912';
        if (along + across < -s.rx * 0.45 && detail >= 1) return R.gem[4];
        return R.gem[lv(along + across < 0 ? 3 : 2)];
      }
      return null;
    });
  }

  if (has('shard')) {
    const shards = pick(detail >= 2 ? 5 : 3, bladeEdge(0.5, 1), 61).map((e, k) => {
      const orbitA = phase * TAU + hash2(k, 4, seed) * TAU;
      const off = (3 + hash2(k, 45, seed) * 3) * spread;
      return {
        x: e.x + e.nx * off + Math.cos(orbitA) * 0.8,
        y: e.y + e.ny * off + Math.sin(orbitA) * 0.8,
        dx: e.nx, dy: e.ny,
        r: (1.3 + hash2(k, 83, seed) * 1.4) * scale,
      };
    });
    front.push((x, y) => {
      for (const s of shards) {
        const { a: along, b: across } = frame(x, y, s.x, s.y, s.dx, s.dy);
        const dd = Math.abs(along) + Math.abs(across) * 1.6;
        if (dd > s.r) continue;
        if (dd > s.r - 0.7) return R.metal[lv(0)];
        return R.metal[lv(along + across < 0 ? 4 : 2)];
      }
      return null;
    });
  }

  return {
    back: back.length ? (x, y) => { for (const d of back) { const c = d(x, y); if (c) return c; } return null; } : none,
    front: front.length ? (x, y) => { for (const d of front) { const c = d(x, y); if (c) return c; } return null; } : none,
    hasBack: back.length > 0,
    hasFront: front.length > 0,
  };
}

/** One decoration as an independent layer (null when it has nothing to draw for this body). */
export function buildDecorationLayer(id: Decoration, a: FormArgs, geo: BodyGeometry, stackCount: number): Sampler | null {
  const built = decorationSamplers([id], a, geo, stackCount);
  if (built.hasFront && built.hasBack) return (x, y) => built.front(x, y) ?? built.back(x, y);
  if (built.hasFront) return built.front;
  if (built.hasBack) return built.back;
  return null;
}

