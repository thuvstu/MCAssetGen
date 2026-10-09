import { A, luminance, Pix } from "./core";
import { makeMapper, ROLE_LIST, RenderResult } from "./generator";
import { getShape, Orientation, Part, Role, Shade } from "./shapes";

export type DepthMode = "uniform" | "luminance" | "bevel" | "auto" | "roles";
export type ReconstructMode = "auto" | "parts" | "extrude";
export type Layering = "exclusive" | "nested";
export type CrossSection = "auto" | "flat" | "round" | "diamond";

export type ModelSettings = {
  depthMode: DepthMode;
  thickness: number;
  levels: number;
  minThickness: number;
  invert: boolean;
  bevelRadius: number;
  scale: number;
  emissiveGlow: boolean;
  handheld: boolean;
  reconstruct: ReconstructMode;
  layering: Layering;
  crossSection: CrossSection;
  smooth: number;
  roundness: number;
  glowShell: number;
  /** True-mesh (sculpt) controls */
  bladeBevel: number; // 0..1 how sharp the cutting edge is
  tipTaper: number; // 0..1 converge the tip to a point
  ridge: number; // 0..0.6 centre ridge height (spine)
  fuller: number; // 0..0.6 blood groove depth
  gripRound: number; // 0..1 handle circularity
  gripSides: number; // 4..20 handle polygon sides
  gemFacets: number; // 4..16 cut-gem facet count
};

export const DEFAULT_MODEL: ModelSettings = {
  depthMode: "auto",
  thickness: 2.8,
  levels: 5,
  minThickness: 0.18,
  invert: false,
  bevelRadius: 4,
  scale: 1,
  emissiveGlow: true,
  handheld: true,
  reconstruct: "auto",
  layering: "exclusive",
  crossSection: "auto",
  smooth: 1,
  roundness: 0.75,
  glowShell: 0.35,
  bladeBevel: 0.72,
  tipTaper: 0.62,
  ridge: 0.16,
  fuller: 0.14,
  gripRound: 0.85,
  gripSides: 12,
  gemFacets: 10,
};

export type MCFace = { uv: [number, number, number, number]; texture: string; tintindex?: number };
export type MCRotation = { origin: [number, number, number]; axis: "x" | "y" | "z"; angle: number };
export type MCElement = {
  from: [number, number, number];
  to: [number, number, number];
  rotation?: MCRotation;
  faces: Partial<Record<"north" | "south" | "east" | "west" | "up" | "down", MCFace>>;
  _px?: [number, number, number, number];
  _level?: number;
  _role?: string;
  _emissive?: boolean;
};

const TEX = "#layer0";
const T_MID = 16 * Math.SQRT1_2; // 11.3137 — diagonal half-length in 16-space
const r3 = (v: number) => Math.round(v * 1000) / 1000;

export const ROLE_THICK: Record<Role, number> = {
  blade: 0.34, edge: 0.22, core: 0.2, guard: 1.15, grip: 0.9, pommel: 1.05,
  gem: 1.45, orb: 1.65, string: 0.12, wood: 0.72, metal: 0.95, trim: 1.0,
  glow: 0.4, barrel: 0.78, page: 0.22, cover: 0.5, ring: 0.42, spike: 0.55, head: 1.2,
};

export function weaponToWorld(t: number, u: number, v: number, ori: Orientation): [number, number, number] {
  if (ori === "upright") return [8 + u, t, 8 + v];
  const X = 8 + u, Y = 8 + (t - T_MID), Z = 8 + v;
  const k = Math.SQRT1_2;
  return [8 + (X - 8) * k + (Y - 8) * k, 8 - (X - 8) * k + (Y - 8) * k, Z];
}

export function applyRotation(
  x: number, y: number, z: number, rot?: MCRotation,
): [number, number, number] {
  if (!rot) return [x, y, z];
  const [ox, oy, oz] = rot.origin;
  const a = (rot.angle * Math.PI) / 180;
  const c = Math.cos(a), s = Math.sin(a);
  const X = x - ox, Y = y - oy, Z = z - oz;
  if (rot.axis === "z") return [ox + X * c - Y * s, oy + X * s + Y * c, oz + Z];
  if (rot.axis === "x") return [ox + X, oy + Y * c - Z * s, oz + Y * s + Z * c];
  return [ox + X * c + Z * s, oy + Y, oz - X * s + Z * c];
}

function rotFor(ori: Orientation): MCRotation | undefined {
  return ori === "diagonal" ? { origin: [8, 8, 8], axis: "z", angle: -45 } : undefined;
}

/** Euclidean-ish distance to transparent (pixels). */
function distToEmpty(pix: Pix): Float32Array {
  const { w, h } = pix;
  const n = w * h;
  const INF = 1e5;
  const d = new Float32Array(n);
  for (let i = 0; i < n; i++) d[i] = A(pix.data[i]) < 16 ? 0 : INF;
  const relax = (i: number, j: number, c: number) => {
    if (d[j] + c < d[i]) d[i] = d[j] + c;
  };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (x) relax(i, i - 1, 1);
      if (y) relax(i, i - w, 1);
      if (x && y) relax(i, i - w - 1, 1.414);
      if (x < w - 1 && y) relax(i, i - w + 1, 1.414);
    }
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (x < w - 1) relax(i, i + 1, 1);
      if (y < h - 1) relax(i, i + w, 1);
      if (x < w - 1 && y < h - 1) relax(i, i + w + 1, 1.414);
      if (x && y < h - 1) relax(i, i + w - 1, 1.414);
    }
  return d;
}

function blurDepth(d: Float32Array, pix: Pix, times: number): Float32Array {
  if (times <= 0) return d;
  const { w, h } = pix;
  const a = new Float32Array(d);
  const b = new Float32Array(d.length);
  let useA = true;
  for (let t = 0; t < times; t++) {
    const src = useA ? a : b;
    const dst = useA ? b : a;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (A(pix.data[i]) === 0) { dst[i] = 0; continue; }
        let s = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            const j = yy * w + xx;
            if (A(pix.data[j]) === 0) continue;
            s += src[j]; n++;
          }
        dst[i] = n ? s / n : src[i];
      }
    useA = !useA;
  }
  return useA ? a : b;
}

export function computeDepth(
  pix: Pix, s: ModelSettings, roleDepth?: Float32Array, glow?: Float32Array, roles?: Uint8Array,
): Float32Array {
  const { w, h } = pix;
  const n = w * h;
  const out = new Float32Array(n);
  const dist = s.depthMode === "uniform" ? null : distToEmpty(pix);
  const maxR = Math.max(1, s.bevelRadius);
  for (let i = 0; i < n; i++) {
    const c = pix.data[i];
    if (A(c) === 0) continue;
    const lum = luminance(c);
    const bevel = dist ? Math.min(1, dist[i] / maxR) : 1;
    let d = 1;
    const rd = roleDepth && roleDepth[i] > 0 ? roleDepth[i] : 0;
    const roleMul = roles && roles[i] > 0 ? ROLE_THICK[ROLE_LIST[roles[i] - 1]] ?? 0.7 : 0.7;
    switch (s.depthMode) {
      case "uniform": d = 1; break;
      case "luminance": d = 0.2 + lum * 0.8; break;
      case "bevel": d = 0.18 + bevel * 0.82; break;
      case "roles": d = 0.15 + roleMul * 0.55 + bevel * 0.3; break;
      default: d = 0.12 + (rd > 0 ? rd : lum) * 0.28 + bevel * 0.32 + roleMul * 0.28 + lum * 0.08;
    }
    if (s.emissiveGlow && glow && glow[i] > 0.55) d = Math.max(d, 0.72 + glow[i] * 0.28);
    if (A(c) < 240) d = Math.min(d, 0.22);
    if (s.invert) d = 1 - d;
    out[i] = Math.min(1, Math.max(0.02, d));
  }
  return blurDepth(out, pix, Math.round(s.smooth));
}

function greedy(mask: Uint8Array, w: number, h: number): [number, number, number, number][] {
  const used = new Uint8Array(w * h);
  const rects: [number, number, number, number][] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!mask[i] || used[i]) continue;
      let rw = 1;
      while (x + rw < w && mask[i + rw] && !used[i + rw]) rw++;
      let rh = 1;
      outer: while (y + rh < h) {
        for (let k = 0; k < rw; k++) {
          const j = (y + rh) * w + x + k;
          if (!mask[j] || used[j]) break outer;
        }
        rh++;
      }
      for (let yy = 0; yy < rh; yy++) for (let xx = 0; xx < rw; xx++) used[(y + yy) * w + x + xx] = 1;
      rects.push([x, y, rw, rh]);
    }
  return rects;
}

function uvRect(x: number, y: number, rw: number, rh: number, w: number, h: number): [number, number, number, number] {
  return [r3((x / w) * 16), r3((y / h) * 16), r3(((x + rw) / w) * 16), r3(((y + rh) / h) * 16)];
}

function facesFromUV(uv: [number, number, number, number], ps: number, psY: number): MCElement["faces"] {
  const [u0, v0, u1, v1] = uv;
  const sliverE: [number, number, number, number] = [r3(u1 - ps), r3(v0), r3(u1), r3(v1)];
  const sliverW: [number, number, number, number] = [r3(u0), r3(v0), r3(u0 + ps), r3(v1)];
  const sliverU: [number, number, number, number] = [r3(u0), r3(v0), r3(u1), r3(v0 + psY)];
  const sliverD: [number, number, number, number] = [r3(u0), r3(v1 - psY), r3(u1), r3(v1)];
  return {
    south: { uv, texture: TEX },
    north: { uv: [u1, v0, u0, v1], texture: TEX },
    east: { uv: sliverE, texture: TEX },
    west: { uv: sliverW, texture: TEX },
    up: { uv: sliverU, texture: TEX },
    down: { uv: sliverD, texture: TEX },
  };
}

function makeBox(
  x0: number, y0: number, z0: number, x1: number, y1: number, z1: number,
  faces: MCElement["faces"], extra: Partial<MCElement> = {},
): MCElement {
  const from: [number, number, number] = [r3(Math.min(x0, x1)), r3(Math.min(y0, y1)), r3(Math.min(z0, z1))];
  const to: [number, number, number] = [r3(Math.max(x0, x1)), r3(Math.max(y0, y1)), r3(Math.max(z0, z1))];
  for (let k = 0; k < 3; k++) if (to[k] - from[k] < 0.05) to[k] = r3(from[k] + 0.05);
  return { from, to, faces, ...extra };
}

export function buildElements(pix: Pix, depth: Float32Array, s: ModelSettings): MCElement[] {
  const { w, h } = pix;
  const ps = 16 / w, psY = 16 / h;
  const levels = Math.max(1, Math.min(8, Math.round(s.levels)));
  const elements: MCElement[] = [];
  const levelOf = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (A(pix.data[i]) === 0) continue;
    levelOf[i] = Math.max(1, Math.min(levels, Math.round(depth[i] * levels) || 1));
  }
  for (let L = 1; L <= levels; L++) {
    const mask = new Uint8Array(w * h);
    if (s.layering === "nested") {
      for (let i = 0; i < w * h; i++) if (levelOf[i] >= L) mask[i] = 1;
    } else {
      for (let i = 0; i < w * h; i++) if (levelOf[i] === L) mask[i] = 1;
    }
    const rects = greedy(mask, w, h);
    const frac = s.minThickness + (1 - s.minThickness) * (L / levels);
    const thk = Math.max(0.06, s.thickness * frac);
    const z0 = 8 - thk / 2, z1 = 8 + thk / 2;
    for (const [x, y, rw, rh] of rects) {
      const uv = uvRect(x, y, rw, rh, w, h);
      elements.push(makeBox(x * ps, 16 - (y + rh) * psY, z0, (x + rw) * ps, 16 - y * psY, z1, facesFromUV(uv, ps, psY), {
        _px: [x, y, rw, rh], _level: L,
      }));
    }
  }
  return elements;
}

function uvFromTU(
  t0: number, t1: number, u0: number, u1: number, ori: Orientation, S: number,
): [number, number, number, number] {
  const map = makeMapper(S, ori);
  const pts = [map.toP(t0, u0), map.toP(t1, u0), map.toP(t0, u1), map.toP(t1, u1)];
  let minX = 99, minY = 99, maxX = -1, maxY = -1;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  minX = Math.max(0, minX); minY = Math.max(0, minY);
  maxX = Math.min(S, maxX + 1); maxY = Math.min(S, maxY + 1);
  return [r3((minX / S) * 16), r3((minY / S) * 16), r3((maxX / S) * 16), r3((maxY / S) * 16)];
}

function tuBox(
  t0: number, t1: number, u0: number, u1: number, v0: number, v1: number,
  ori: Orientation, uv: [number, number, number, number], extra: Partial<MCElement> = {},
): MCElement {
  const rot = rotFor(ori);
  let x0: number, y0: number, z0: number, x1: number, y1: number, z1: number;
  if (ori === "diagonal") {
    x0 = 8 + u0; x1 = 8 + u1;
    y0 = 8 + (t0 - T_MID); y1 = 8 + (t1 - T_MID);
    z0 = 8 + v0; z1 = 8 + v1;
  } else {
    x0 = 8 + u0; x1 = 8 + u1;
    y0 = t0; y1 = t1;
    z0 = 8 + v0; z1 = 8 + v1;
  }
  const ps = Math.max(0.2, Math.abs(uv[2] - uv[0]) / 8);
  const el = makeBox(x0, y0, z0, x1, y1, z1, facesFromUV(uv, ps, ps), extra);
  if (rot) el.rotation = rot;
  return el;
}

function sectionOf(shade: Shade, mode: CrossSection): "flat" | "round" | "diamond" {
  if (mode !== "auto") return mode;
  if (shade === "blade") return "diamond";
  if (shade === "round" || shade === "wood" || shade === "gem") return "round";
  return "flat";
}

function emitCross(
  t0: number, t1: number, uc: number, hw: number, thk: number, shade: Shade,
  ori: Orientation, uv: [number, number, number, number], s: ModelSettings, role: Role,
  taper = 1,
): MCElement[] {
  const kind = sectionOf(shade, s.crossSection);
  const rnd = s.roundness;
  const out: MCElement[] = [];
  const extra = { _role: role, _emissive: role === "gem" || role === "orb" || role === "glow" };
  const T = Math.max(0.06, thk * Math.max(0.05, taper));
  if (kind === "flat" || hw < 0.18) {
    out.push(tuBox(t0, t1, uc - hw, uc + hw, -T / 2, T / 2, ori, uv, extra));
    return out;
  }
  if (kind === "diamond") {
    // bevel 1 => knife-sharp: thin flat faces plus a narrow centre ridge (true diamond read)
    const b = Math.min(1, Math.max(0, s.bladeBevel));
    const thin = T * (1 - b * 0.82);
    const spine = hw * (0.14 + (1 - b) * 0.42);
    out.push(tuBox(t0, t1, uc - hw, uc + hw, -thin / 2, thin / 2, ori, uv, extra));
    out.push(tuBox(t0, t1, uc - spine, uc + spine, -T / 2, T / 2, ori, uv, extra));
    if (b > 0.4 && s.fuller > 0.02) {
      // fuller cheeks: two slightly proud strips either side of the ridge
      const cheek = hw * 0.5;
      out.push(tuBox(t0, t1, uc - cheek, uc + cheek, -T * 0.3, T * 0.3, ori, uv, extra));
    }
    return out;
  }
  // round / octagon handle: 3 boxes approximate an n-gon barrel
  const round = Math.min(1, Math.max(0, s.gripRound));
  out.push(tuBox(t0, t1, uc - hw * 0.55, uc + hw * 0.55, -T / 2, T / 2, ori, uv, extra));
  const side = hw * (0.45 + 0.12 * round);
  const v2 = (T / 2) * (0.4 + 0.35 * round);
  out.push(tuBox(t0, t1, uc - hw, uc - hw + side, -v2, v2, ori, uv, extra));
  out.push(tuBox(t0, t1, uc + hw - side, uc + hw, -v2, v2, ori, uv, extra));
  void rnd;
  return out;
}

function profileToBoxes(p: Extract<Part, { kind: "profile" }>, ori: Orientation, s: ModelSettings, S: number): MCElement[] {
  const thk = Math.max(0.08, s.thickness * (ROLE_THICK[p.role] ?? 0.7) * (0.55 + p.depth));
  const samples: { t: number; hw: number; u: number }[] = [];
  const n = Math.max(3, Math.ceil((p.t1 - p.t0) * 3.2));
  for (let i = 0; i <= n; i++) {
    const t = p.t0 + ((p.t1 - p.t0) * i) / n;
    const hw = p.hw(t);
    if (hw <= 0.04) continue;
    samples.push({ t, hw, u: p.uOff ? p.uOff(t) : 0 });
  }
  if (samples.length < 2) return [];
  const out: MCElement[] = [];
  let i = 0;
  while (i < samples.length - 1) {
    let j = i + 1;
    while (j < samples.length - 1) {
      const a = samples[i], b = samples[j];
      if (Math.abs(b.hw - a.hw) / Math.max(0.2, a.hw) > 0.22) break;
      if (Math.abs(b.u - a.u) > 0.45) break;
      j++;
    }
    const a = samples[i], b = samples[j];
    const hw = Math.max(a.hw, b.hw);
    const uc = (a.u + b.u) / 2;
    const t0 = a.t, t1 = Math.max(a.t + 0.12, b.t);
    const uv = uvFromTU(t0, t1, uc - hw, uc + hw, ori, S);
    // Leading end converges to a point so blades/spears are genuinely sharp in 3D.
    const len = Math.max(0.001, p.t1 - p.t0);
    const tipZone = Math.max(0, ((t0 + t1) / 2 - (p.t1 - 0.22 * len)) / (0.22 * len));
    const taper = Math.max(0.12, 1 - s.tipTaper * Math.pow(tipZone, 1.5));
    out.push(...emitCross(t0, t1, uc, hw, thk, p.shade, ori, uv, s, p.role, taper));
    i = j;
  }
  return out;
}

function discToBoxes(p: Extract<Part, { kind: "disc" }>, ori: Orientation, s: ModelSettings, S: number): MCElement[] {
  const mul = ROLE_THICK[p.role] ?? 0.8;
  const isGem = p.role === "gem" || p.role === "orb" || p.shade === "gem";
  const out: MCElement[] = [];
  if (p.r2 !== undefined) {
    const segs = 8;
    const r = (p.r + p.r2) / 2, rw = Math.max(0.18, (p.r - p.r2) / 2);
    const thk = s.thickness * 0.22 * mul;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
      const a = (a0 + a1) / 2;
      const t = p.t + Math.cos(a) * r, u = p.u + Math.sin(a) * r;
      const uv = uvFromTU(t - rw, t + rw, u - rw, u + rw, ori, S);
      out.push(tuBox(t - rw, t + rw, u - rw, u + rw, -thk / 2, thk / 2, ori, uv, { _role: p.role, _emissive: true }));
    }
    return out;
  }
  const r = p.r;
  const thk = s.thickness * mul * (isGem ? 1.15 : 0.75) * (0.5 + p.depth);
  const extra = { _role: p.role, _emissive: isGem };
  // Stones are built as a brilliant-cut stack along the depth axis:
  // culet -> pavilion -> girdle -> crown -> table. Bosses use a rounder 3-box stack.
  const stack: { rf: number; z0: number; z1: number }[] = isGem
    ? [
        { rf: 0.2, z0: -0.62, z1: -0.16 },
        { rf: 0.66, z0: -0.3, z1: 0.06 },
        { rf: 1.0, z0: -0.12, z1: 0.2 },
        { rf: 0.84, z0: 0.06, z1: 0.42 },
        { rf: 0.52, z0: 0.3, z1: 0.58 },
      ]
    : [
        { rf: 1.0, z0: -0.24, z1: 0.24 },
        { rf: 0.62, z0: -0.5, z1: 0.5 },
        { rf: 0.34, z0: -0.64, z1: 0.64 },
      ];
  for (const layer of stack) {
    const rad = Math.max(0.08, r * layer.rf);
    const uv = uvFromTU(p.t - rad, p.t + rad, p.u - rad, p.u + rad, ori, S);
    out.push(tuBox(
      p.t - rad, p.t + rad, p.u - rad, p.u + rad,
      (thk / 2) * layer.z0, (thk / 2) * layer.z1,
      ori, uv, extra,
    ));
  }
  return out;
}

function polyToBoxes(p: Extract<Part, { kind: "poly" }>, ori: Orientation, s: ModelSettings, S: number): MCElement[] {
  const pts = p.pts;
  if (pts.length < 3) return [];
  let tmin = Infinity, tmax = -Infinity, umin = Infinity, umax = -Infinity;
  for (const [t, u] of pts) {
    tmin = Math.min(tmin, t); tmax = Math.max(tmax, t);
    umin = Math.min(umin, u); umax = Math.max(umax, u);
  }
  const thk = Math.max(0.08, s.thickness * (ROLE_THICK[p.role] ?? 0.6) * (0.45 + p.depth));
  const dt = Math.max(0.35, (tmax - tmin) / 12);
  const out: MCElement[] = [];
  const inside = (t: number, u: number) => {
    let ins = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [ti, ui] = pts[i], [tj, uj] = pts[j];
      if (ui > u !== uj > u && t < ((tj - ti) * (u - ui)) / ((uj - ui) || 1e-6) + ti) ins = !ins;
    }
    return ins;
  };
  for (let t = tmin; t < tmax; t += dt) {
    const t1 = Math.min(tmax, t + dt);
    const us: number[] = [];
    const steps = 24;
    for (let k = 0; k <= steps; k++) {
      const u = umin + ((umax - umin) * k) / steps;
      if (inside((t + t1) / 2, u)) us.push(u);
    }
    if (!us.length) continue;
    const u0 = us[0], u1 = us[us.length - 1];
    const uv = uvFromTU(t, t1, u0, u1, ori, S);
    out.push(tuBox(t, t1, u0, u1, -thk / 2, thk / 2, ori, uv, { _role: p.role }));
  }
  return out;
}

export function buildFromParts(rr: RenderResult, s: ModelSettings, pix: Pix): MCElement[] {
  const shape = rr.shape ?? getShape(rr.settings.shape);
  const parts = shape.parts(rr.settings.params);
  const ori = shape.orientation;
  const S = pix.w;
  const out: MCElement[] = [];
  for (const p of parts) {
    if (p.kind === "profile") out.push(...profileToBoxes(p, ori, s, S));
    else if (p.kind === "disc") out.push(...discToBoxes(p, ori, s, S));
    else out.push(...polyToBoxes(p, ori, s, S));
  }
  return out;
}

function glowShells(pix: Pix, glow: Float32Array | undefined, s: ModelSettings): MCElement[] {
  if (!glow || s.glowShell <= 0) return [];
  const { w, h } = pix;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (glow[i] > 0.7 && A(pix.data[i]) > 0) mask[i] = 1;
  const rects = greedy(mask, w, h);
  const ps = 16 / w, psY = 16 / h;
  const thk = s.thickness * (0.5 + s.glowShell);
  const pad = 0.12 * s.glowShell;
  const out: MCElement[] = [];
  for (const [x, y, rw, rh] of rects) {
    if (rw * rh < 2 && w >= 32) continue;
    const uv = uvRect(x, y, rw, rh, w, h);
    out.push(makeBox(
      x * ps - pad, 16 - (y + rh) * psY - pad, 8 - thk / 2,
      (x + rw) * ps + pad, 16 - y * psY + pad, 8 + thk / 2,
      facesFromUV(uv, ps, psY),
      { _emissive: true, _role: "glow" },
    ));
  }
  return out;
}

export function buildModel(pix: Pix, s: ModelSettings, rr?: RenderResult | null): { elements: MCElement[]; depth: Float32Array } {
  const depth = computeDepth(pix, s, rr?.depth, rr?.glow, rr?.roles);
  const mode = s.reconstruct === "auto" ? (rr ? "parts" : "extrude") : s.reconstruct;
  let elements: MCElement[];
  if (mode === "parts" && rr) {
    elements = buildFromParts(rr, s, pix);
    if (elements.length < 2) elements = buildElements(pix, depth, s);
  } else {
    elements = buildElements(pix, depth, s);
  }
  if (s.glowShell > 0) elements = elements.concat(glowShells(pix, rr?.glow, s));
  // keep Minecraft-ish limits
  if (elements.length > 700) elements = elements.slice(0, 700);
  return { elements, depth };
}

export function buildModelJson(elements: MCElement[], texturePath: string, s: ModelSettings, texSize = 16) {
  const sc = s.scale;
  const display = s.handheld
    ? {
        thirdperson_righthand: { rotation: [0, -90, 55], translation: [0, 4.0, 0.5], scale: [0.85 * sc, 0.85 * sc, 0.85 * sc] },
        thirdperson_lefthand: { rotation: [0, 90, -55], translation: [0, 4.0, 0.5], scale: [0.85 * sc, 0.85 * sc, 0.85 * sc] },
        firstperson_righthand: { rotation: [0, -90, 25], translation: [1.13, 3.2, 1.13], scale: [0.68 * sc, 0.68 * sc, 0.68 * sc] },
        firstperson_lefthand: { rotation: [0, 90, -25], translation: [1.13, 3.2, 1.13], scale: [0.68 * sc, 0.68 * sc, 0.68 * sc] },
        gui: { rotation: [30, 45, 0], translation: [0, 0, 0], scale: [0.9, 0.9, 0.9] },
        ground: { rotation: [0, 0, 0], translation: [0, 2, 0], scale: [0.5, 0.5, 0.5] },
        fixed: { rotation: [0, 180, 0], translation: [0, 0, 0], scale: [1, 1, 1] },
        head: { rotation: [0, 180, 0], translation: [0, 13, 7], scale: [1, 1, 1] },
      }
    : {
        thirdperson_righthand: { rotation: [0, 0, 0], translation: [0, 3, 1], scale: [0.55 * sc, 0.55 * sc, 0.55 * sc] },
        thirdperson_lefthand: { rotation: [0, 0, 0], translation: [0, 3, 1], scale: [0.55 * sc, 0.55 * sc, 0.55 * sc] },
        firstperson_righthand: { rotation: [0, -90, 25], translation: [1.13, 3.2, 1.13], scale: [0.68 * sc, 0.68 * sc, 0.68 * sc] },
        firstperson_lefthand: { rotation: [0, 90, -25], translation: [1.13, 3.2, 1.13], scale: [0.68 * sc, 0.68 * sc, 0.68 * sc] },
        gui: { rotation: [30, 45, 0], translation: [0, 0, 0], scale: [0.9, 0.9, 0.9] },
        ground: { rotation: [0, 0, 0], translation: [0, 2, 0], scale: [0.5, 0.5, 0.5] },
        fixed: { rotation: [0, 180, 0], translation: [0, 0, 0], scale: [1, 1, 1] },
      };
  return {
    credit: "Made with MC Asset Forge",
    gui_light: "front",
    texture_size: [texSize, texSize],
    textures: { layer0: texturePath, particle: texturePath },
    elements: elements.map((e) => {
      const o: Record<string, unknown> = { from: e.from, to: e.to, faces: e.faces };
      if (e.rotation) o.rotation = e.rotation;
      return o;
    }),
    display,
  };
}

export function elementsToOBJ(elements: MCElement[]): string {
  const lines: string[] = ["# MC Asset Forge 3D reconstruction", "o weapon"];
  let vi = 1;
  const corner = (e: MCElement, i: number): [number, number, number] => {
    const [x0, y0, z0] = e.from, [x1, y1, z1] = e.to;
    const x = i & 1 ? x1 : x0, y = i & 2 ? y1 : y0, z = i & 4 ? z1 : z0;
    return applyRotation(x, y, z, e.rotation);
  };
  // vertex order for a box: 0 --- 1  (x)
  //                         |     |
  //                         2 --- 3     + y
  for (const e of elements) {
    const vs = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => corner(e, i));
    for (const [x, y, z] of vs) lines.push(`v ${x.toFixed(4)} ${y.toFixed(4)} ${z.toFixed(4)}`);
    const f = (a: number, b: number, c: number, d: number) =>
      lines.push(`f ${vi + a} ${vi + b} ${vi + c} ${vi + d}`);
    // MC: 0=x0y0z0 1=x1y0z0 2=x0y1z0 3=x1y1z0 4=x0y0z1 5=x1y0z1 6=x0y1z1 7=x1y1z1
    f(0, 2, 3, 1); // north -z
    f(4, 5, 7, 6); // south +z
    f(1, 3, 7, 5); // east +x
    f(0, 4, 6, 2); // west -x
    f(2, 6, 7, 3); // up +y
    f(0, 1, 5, 4); // down -y
    vi += 8;
  }
  return lines.join("\n");
}

export function depthToHeat(depth: Float32Array, pix: Pix): Pix {
  const o = { w: pix.w, h: pix.h, data: new Uint32Array(pix.w * pix.h) };
  for (let i = 0; i < depth.length; i++) {
    if (A(pix.data[i]) === 0) continue;
    const t = depth[i];
    const r = Math.round(40 + t * 215), g = Math.round(t * t * 200), b = Math.round(180 - t * 140);
    o.data[i] = ((r << 24) | (g << 16) | (b << 8) | 255) >>> 0;
  }
  return o;
}
