import type { LogicalMap, Part, Silhouette, SwordOptions } from "./types";

export type Surface = { part: Part; across: number; progress: number; d: number; v: number };
export type Point = { x: number; y: number };
export type SwordGeometry = {
  guardD: number; bladeStart: number; bladeEnd: number; handleStart: number; pommelD: number;
  center: (progress: number) => number;
  width: (progress: number) => number;
  point: (progress: number, offset?: number) => Point;
  sample: (x: number, y: number) => Surface | null;
};

const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const SQRT2 = Math.SQRT2;
export const axisToPoint = (d: number, v: number): Point => ({ x: d + v / SQRT2, y: 16 - d + v / SQRT2 });

function inTriangle(x: number, y: number, a: Point, b: Point, c: Point) {
  const side = (p: Point, q: Point) => (x - q.x) * (p.y - q.y) - (p.x - q.x) * (y - q.y);
  const s1 = side(a, b), s2 = side(b, c), s3 = side(c, a);
  return !((s1 < 0 || s2 < 0 || s3 < 0) && (s1 > 0 || s2 > 0 || s3 > 0));
}

/**
 * Blade profile: curve of the spine, half-width multiplier along the blade, and tip shape.
 * `edge`/`back` split the width asymmetrically (negative across = cutting edge side).
 */
type Profile = {
  curve: (p: number) => number;
  width: (p: number) => number;
  taper: number;             // progress where the tip taper begins
  tip: "point" | "clip" | "round" | "square" | "needle" | "hook";
  edgeBias?: number;         // 0 = symmetric, >0 pushes mass to the back (single edged)
  scale?: number;            // overall width multiplier
};
const sinPi = (p: number) => Math.sin(Math.PI * p);
const PROFILES: Record<Silhouette, Profile> = {
  straight:   { curve: () => 0, width: () => 1, taper: 0.66, tip: "point" },
  claymore:   { curve: () => 0, width: (p) => 1 + 0.08 * sinPi(p), taper: 0.7, tip: "point", scale: 1.1 },
  zweihander: { curve: () => 0, width: (p) => 0.9 + 0.12 * (p > 0.22 ? 1 : 0), taper: 0.72, tip: "point", scale: 1.05 },
  gladius:    { curve: () => 0, width: (p) => 0.86 + 0.32 * sinPi(Math.min(1, p * 1.15)), taper: 0.6, tip: "point", scale: 1.05 },
  dagger:     { curve: () => 0, width: (p) => 1 - 0.4 * p, taper: 0.55, tip: "point", scale: 0.95 },
  estoc:      { curve: () => 0, width: () => 1, taper: 0.5, tip: "needle", scale: 0.55 },
  rapier:     { curve: (p) => 0.1 * p * p, width: () => 1, taper: 0.8, tip: "needle", scale: 0.55 },
  katana:     { curve: (p) => 1.05 * p ** 1.5, width: () => 1, taper: 0.9, tip: "clip", scale: 0.7, edgeBias: 0.25 },
  nodachi:    { curve: (p) => 1.5 * p ** 1.4, width: () => 1, taper: 0.9, tip: "clip", scale: 0.72, edgeBias: 0.25 },
  tanto:      { curve: (p) => 0.35 * p * p, width: () => 1, taper: 0.82, tip: "clip", scale: 0.75, edgeBias: 0.3 },
  sabre:      { curve: (p) => 0.85 * p ** 1.7, width: (p) => 1 - 0.1 * p, taper: 0.78, tip: "point", scale: 0.85, edgeBias: 0.2 },
  scimitar:   { curve: (p) => 1.5 * p ** 1.6, width: (p) => 0.78 + 0.5 * sinPi(p), taper: 0.7, tip: "point", edgeBias: 0.2 },
  cutlass:    { curve: (p) => 0.9 * p ** 1.8, width: (p) => 0.85 + 0.35 * sinPi(p), taper: 0.7, tip: "clip", edgeBias: 0.2 },
  falchion:   { curve: (p) => 0.45 * p * p, width: (p) => 0.75 + 0.75 * p ** 1.5, taper: 0.82, tip: "round", edgeBias: 0.25 },
  khopesh:    { curve: (p) => p < 0.45 ? 0 : 2.4 * ((p - 0.45) / 0.55) ** 1.5, width: (p) => p < 0.45 ? 0.62 : 0.8 + 0.5 * sinPi((p - 0.45) / 0.55), taper: 0.86, tip: "hook", edgeBias: 0.2 },
  cleaver:    { curve: () => 0, width: (p) => 1.1 + 0.6 * Math.min(1, p * 2.2), taper: 0.9, tip: "square", scale: 1.05, edgeBias: 0.35 },
  macuahuitl: { curve: () => 0, width: () => 1.15, taper: 0.9, tip: "square", scale: 1.05 },
  flamberge:  { curve: (p) => Math.sin(p * Math.PI * 5) * sinPi(p) * 0.5, width: () => 1, taper: 0.7, tip: "point" },
  kris:       { curve: (p) => Math.sin(p * Math.PI * 6) * (1 - p) * 0.45, width: (p) => 1 - 0.35 * p, taper: 0.6, tip: "point", scale: 0.8 },
  twinblade:  { curve: () => 0, width: () => 1.3, taper: 0.7, tip: "point" },
  spear:      { curve: () => 0, width: (p) => 0.45 + 0.75 * sinPi(Math.min(1, p * 1.05)), taper: 0.62, tip: "point", scale: 0.95 },
  glaive:     { curve: (p) => 0.6 * p * p, width: (p) => 0.7 + 0.5 * sinPi(p), taper: 0.75, tip: "point", edgeBias: 0.3 },
  // jian (劍): straight, double-edged, considerable distal taper, light and precise.
  jian:       { curve: () => 0, width: (p) => 1 - 0.18 * p, taper: 0.55, tip: "point", scale: 0.85 },
  // whip (Mitsuri's Love Blade): extremely thin and flexible.
  whip:       { curve: (p) => 1.9 * p ** 2.2, width: () => 1, taper: 0.4, tip: "point", scale: 0.56 },
  // energy (Halo): twin blades from one hilt, forming a long U.
  liuyedao:   { curve: (p) => 1.05 * p ** 1.9, width: (p) => 0.82 + 0.4 * sinPi(p), taper: 0.68, tip: "clip", scale: 0.9, edgeBias: 0.24 },
  // uchigatana: a slightly deeper curve than katana, longer handle.
  uchigatana: { curve: (p) => 1.3 * p ** 1.45, width: () => 1, taper: 0.9, tip: "clip", scale: 0.72, edgeBias: 0.26 },
  // nine_ring (九環刀): the dao with nine rings on the spine — read as a serrated back.
  nine_ring:  { curve: (p) => 0.75 * p ** 1.8, width: (p) => 0.9 + 0.3 * sinPi(p), taper: 0.72, tip: "clip", scale: 0.92, edgeBias: 0.22 },
  // trident: center prong plus 2 sweeping outer prongs
  trident:    { curve: () => 0, width: (p) => p < 0.25 ? 0.35 : p < 0.85 ? 1.6 : 0.6, taper: 0.8, tip: "point", scale: 1.1 },
  // battleaxe: heavy crescent chopping head on upper half
  battleaxe:  { curve: () => 0, width: (p) => p < 0.3 ? 0.25 : 0.5 + 1.8 * sinPi((p - 0.3) / 0.7), taper: 0.85, tip: "square", scale: 1.25, edgeBias: -0.4 },
  // warpick: sharp pick projecting from back side of shaft
  warpick:    { curve: () => 0, width: (p) => p < 0.4 ? 0.25 : 0.4 + 1.4 * ((p - 0.4) / 0.6), taper: 0.85, tip: "needle", scale: 1.0, edgeBias: -0.6 },
  // mace: bulky heavy core / flanged head
  mace:       { curve: () => 0, width: (p) => p < 0.4 ? 0.28 : p < 0.88 ? 1.75 : 0.4, taper: 0.9, tip: "square", scale: 1.25 },
  // bow: graceful sweeping arc
  bow:        { curve: (p) => Math.sin(p * Math.PI) * 2.2, width: () => 0.55, taper: 0.8, tip: "point", scale: 0.8 },
  // pickaxe: dual-curved pick head
  pickaxe:    { curve: () => 0, width: (p) => p < 0.6 ? 0.25 : 0.4 + 1.6 * sinPi((p - 0.6) / 0.4), taper: 0.9, tip: "needle", scale: 1.2, edgeBias: -0.5 },

  // ─── Formless / beauty-first forms ────────────────────────────────
  // essence: a lens of pure energy — no metal, widest at the middle
  essence:    { curve: () => 0, width: (p) => 0.2 + 1.55 * Math.sin(Math.PI * Math.min(1, p * 1.02)) ** 0.62, taper: 0.94, tip: "needle", scale: 0.78 },
  // lotus: slim shaft that blooms into petals before a rounded tip
  lotus:      { curve: (p) => 0.22 * p * p, width: (p) => p < 0.58 ? 0.52 : 0.52 + 1.35 * ((p - 0.58) / 0.42) ** 0.8, taper: 0.95, tip: "round", scale: 0.92, edgeBias: 0.1 },
  // geode: quantised facets — a crystal cluster grown along the axis
  geode:      { curve: () => 0, width: (p) => 0.62 + 0.95 * Math.floor(Math.sin(p * Math.PI * 3.1) * 0.5 + 0.55), taper: 0.92, tip: "point", scale: 1.05 },
  // ribbon: flowing silk — large graceful oscillation, very thin
  ribbon:     { curve: (p) => Math.sin(p * Math.PI * 2.0) * 0.88, width: (p) => 0.98 - 0.14 * p, taper: 0.68, tip: "point", scale: 0.7 },
  // spine: dragon vertebrae — periodic bulges down the length
  spine:      { curve: () => 0, width: (p) => 0.78 + 0.62 * (Math.sin(p * Math.PI * 8.5) > 0.3 ? 1 : 0), taper: 0.88, tip: "point", scale: 1.0 },
  // fractured: a blade snapped twice, floating apart
  fractured:  { curve: () => 0, width: (p) => (p > 0.42 && p < 0.46) || (p > 0.74 && p < 0.78) ? 0.22 : 1.05, taper: 0.9, tip: "point", scale: 1.02 },
  // obelisk: monolithic slab, almost no taper, flat crown
  obelisk:    { curve: () => 0, width: (p) => 1.3 - 0.42 * p, taper: 0.96, tip: "square", scale: 1.32 },
  // fang: extreme recurve hook — a beast's tooth
  fang:       { curve: (p) => 2.5 * p ** 2.15, width: (p) => 1.05 - 0.35 * p, taper: 0.7, tip: "hook", scale: 0.95, edgeBias: 0.28 },
  // sakura: slender curve that flares into a single petal at the tip
  sakura:     { curve: (p) => 0.85 * p ** 1.55, width: (p) => 0.72 + (p > 0.78 ? 1.25 * ((p - 0.78) / 0.22) : 0), taper: 0.95, tip: "round", scale: 0.84, edgeBias: 0.18 },
};

/** All parts share one blade-axis coordinate system, including attachments and FX anchors. */
export function createGeometry(o: SwordOptions): SwordGeometry {
  const profile = PROFILES[o.silhouette];
  const unit = 12 / Math.max(14, o.bladeLength + o.handleLength + 1.2);
  const pommelD = 1.65;
  const handleStart = 2.05;
  const guardD = handleStart + o.handleLength * unit;
  const bladeStart = guardD;
  const bladeEnd = bladeStart + o.bladeLength * unit;
  const halfWidth = (0.38 + o.bladeWidth * 0.4) * (profile.scale ?? 1);
  const gripWidth = 0.38 + o.handleLength * 0.035;
  const guardLength = Math.min(0.9 + o.guardWidth * 0.43, (guardD - 0.7) * SQRT2);
  const bias = profile.edgeBias ?? 0;

  const center = (t: number) => profile.curve(clamp(t)) + (o.silhouette === "khopesh" ? 0 : 0);
  const width = (t: number) => {
    const p = clamp(t);
    let w = halfWidth * profile.width(p);
    if (p > profile.taper) {
      const k = (p - profile.taper) / (1 - profile.taper);
      switch (profile.tip) {
        case "needle": w *= Math.max(0, 1 - k) ** 0.55; break;
        case "clip":   w *= k < 0.6 ? 1 - k * 0.15 : Math.max(0, 1 - (k - 0.6) / 0.4) ** 0.8 * 0.91; break;
        case "round":  w *= Math.sqrt(Math.max(0, 1 - k * k)); break;
        case "square": w *= k < 0.85 ? 1 : Math.max(0, 1 - (k - 0.85) / 0.15) ** 0.5; break;
        case "hook":   w *= Math.max(0, 1 - k) ** 0.6; break;
        default:       w *= Math.max(0, 1 - k) ** 0.75;
      }
    }
    return Math.max(0.05, w);
  };
  const point = (progress: number, offset = 0): Point => axisToPoint(bladeStart + (bladeEnd - bladeStart) * progress, center(progress) + offset);

  // Attachments are anchored on the blade surface so they always stay connected.
  const spikes: { a: Point; b: Point; c: Point; side: number }[] = [];
  if (o.spurs || o.boneSpurs) {
    for (let i = 0; i < o.spurCount; i++) {
      const t = 0.2 + (i + 0.5) / o.spurCount * 0.55;
      const d = bladeStart + (bladeEnd - bladeStart) * t;
      for (const side of o.boneSpurs ? [1] : [-1, 1]) {
        const root = center(t) + width(t) * side * 0.5;
        const reach = (o.boneSpurs ? 1.3 : 0.9) * side;
        const lean = o.boneSpurs ? 0.55 : 0.2;
        spikes.push({ side, a: { x: d - 0.42, y: root }, b: { x: d + 0.42, y: root }, c: { x: d + lean, y: root + reach } });
      }
    }
  }
  if (o.silhouette === "zweihander") {
    const t = 0.16, d = bladeStart + (bladeEnd - bladeStart) * t, w = width(t);
    for (const side of [-1, 1]) spikes.push({ side, a: { x: d - 0.35, y: w * side * 0.6 }, b: { x: d + 0.35, y: w * side * 0.6 }, c: { x: d + 0.15, y: (w + 0.75) * side } });
  }

  const sample = (x: number, y: number): Surface | null => {
    const d = (x - y + 16) / 2;
    const v = (x + y - 16) / SQRT2;
    const t = (d - bladeStart) / (bladeEnd - bladeStart);
    const vr = v - center(t);
    const surface = (part: Part, across: number, progress = t): Surface => ({ part, across: clamp(across, -1, 1), progress, d, v });

    // ─── Guard (evaluated first so every junction is covered) ───
    const vn = v / guardLength;
    const gs = o.guardStyle;
    const collar = Math.abs(d - guardD) <= 0.3 && Math.abs(v) <= Math.max(gripWidth + 0.15, width(0.02) + 0.1);
    let guard = collar;
    const inBar = Math.abs(vn) <= 1;
    if (gs === "straight") guard ||= inBar && Math.abs(d - guardD) <= 0.28;
    if (gs === "wings" || gs === "barbed" || gs === "dread") guard ||= inBar && Math.abs(d - guardD - 0.5 * vn * vn) <= 0.27;
    if (gs === "swept") guard ||= inBar && Math.abs(d - guardD + 0.55 * vn * vn) <= 0.27;
    if (gs === "crescent") guard ||= inBar && Math.abs(d - guardD + 0.45 * (1 - vn * vn) - 0.25) <= 0.26;
    if (gs === "cross") guard ||= (inBar && Math.abs(d - guardD) <= 0.28) || (Math.abs(d - guardD) < 0.75 && Math.abs(v) < 0.34);
    if (gs === "round") guard ||= ((d - guardD) / 0.5) ** 2 + (vn / 0.82) ** 2 < 1;
    if (gs === "tsuba") {
      const r = Math.hypot((d - guardD) / 0.42, vn / 0.85);
      guard ||= r < 1 && !(r < 0.62 && Math.abs(Math.sin(Math.atan2(vn, d - guardD) * 2)) > 0.72);
    }
    if (gs === "shell") guard ||= d - guardD > -0.3 && d - guardD < 0.95 && Math.abs(v) < guardLength * 0.7 * Math.sqrt(Math.max(0, 1 - ((d - guardD - 0.32) / 0.63) ** 2));
    if (gs === "rapier") {
      const ring = Math.hypot((d - guardD + 0.35) / 1.0, v / (guardLength * 0.75));
      guard ||= (ring < 1 && ring > 0.62) || (inBar && Math.abs(d - guardD) <= 0.26);
    }
    if (gs === "hooked") guard ||= inBar && Math.abs(d - guardD - (Math.abs(vn) > 0.7 ? 0.6 * (Math.abs(vn) - 0.7) / 0.3 : 0)) <= 0.28;
    // jian (劍): the classic Chinese crescent guard — two lobes curving toward the blade.
    if (gs === "jian") {
      const lobe = Math.max(0, 1 - Math.abs(Math.abs(vn) - 0.62) / 0.38);
      guard ||= inBar && d - guardD > -0.35 && d - guardD < 0.1 + lobe * 0.42;
    }
    // sigil (Golden Order): a rigid interwoven geometric cross — a thin cross with notches.
    if (gs === "sigil") {
      const bar = inBar && Math.abs(d - guardD) <= 0.2;
      const notch = Math.abs(vn) > 0.3 && Math.abs(vn) < 0.62 && Math.abs(d - guardD) < 0.62;
      const tip = Math.abs(vn) > 0.86 && Math.abs(d - guardD) < 0.3;
      guard ||= bar || notch || tip;
    }
    // asymmetric (Blasphemous Blade): one long quillon and one hooked one — deliberately unbalanced.
    if (gs === "asymmetric") {
      const upQuillon = vn < -0.1 && vn > -1.5 && d - guardD > -0.3 && d - guardD < 0.1 + (1 + vn) * 0.5;
      const downHook = vn > 0.05 && vn < 1.1 && d - guardD > -0.3 && d - guardD < 0.75 - vn * 0.55;
      guard ||= upQuillon || downHook;
    }
    if (gs === "jagged" || gs === "barbed" || gs === "dread") {
      const tooth = Math.max(0, Math.sin(v * 4.2 + 1)) * 0.3;
      guard ||= inBar && d - guardD > -0.28 && d - guardD < 0.25 + tooth + (gs === "dread" ? 0.25 * vn * vn : 0);
    }
    if (guard) return surface("guard", vn, 0);

    // ─── Grip ───
    const gripT = (d - handleStart) / (guardD - handleStart);
    if (gripT >= -0.02 && gripT <= 1 && Math.abs(v) < gripWidth * (0.9 + 0.12 * Math.sin(gripT * Math.PI)))
      return surface("handle", v / gripWidth, clamp(gripT));

    // ─── Pommel (always overlaps the grip end so it can never float) ───
    const pd = (d - pommelD) * SQRT2;
    const radius = 0.66;
    const dist = Math.hypot(pd, v);
    let pommel = dist < radius;
    switch (o.pommelStyle) {
      case "ring": pommel = dist < radius * 1.1 && (dist > radius * 0.45 || pd > 0.1); break;
      case "crescent": pommel = dist < radius * 1.1 && Math.hypot(pd + 0.45, v) > radius * 0.85; break;
      case "fang": pommel = pd > -1.15 && pd < 0.45 && Math.abs(v) < 0.2 + 0.42 * (pd + 1.15) / 1.6; break;
      case "spiked": pommel = dist < radius * (0.72 + 0.32 * Math.max(0, Math.cos(Math.atan2(v, pd) * 4))); break;
      case "skull": pommel = Math.abs(pd) < 0.7 && Math.abs(v) < (pd < -0.25 ? 0.36 : 0.66); break;
      case "orb": pommel = dist < radius * 1.15; break;
      case "wing": pommel = dist < radius * 0.7 || (pd > -0.9 && pd < 0.3 && Math.abs(v) > 0.25 && Math.abs(v) < 0.5 + 0.55 * (0.3 - pd) / 1.2); break;
      case "disc": pommel = Math.abs(pd) < 0.33 && Math.abs(v) < 0.85; break;
      case "tassel": pommel = Math.hypot(pd, v) < radius * 0.75 || (pd < -0.15 && pd > -1.7 && Math.abs(v) < 0.54 - 0.1 * ((-0.15 - pd) / 1.55)); break;
      case "chain": pommel = Math.hypot(pd, v) < radius * 0.72 || (pd < -0.2 && pd > -1.9 && Math.abs(v) < 0.5 - 0.22 * Math.abs(Math.sin((pd + 0.2) * 4.2))); break;
      case "flattened": pommel = Math.abs(pd) < 0.42 && Math.abs(v) < 0.5 + 0.32 * Math.max(0, Math.cos(pd * 3)); break;
    }
    if (pommel) return surface("pommel", v / radius, 0);

    for (const spike of spikes) {
      if (inTriangle(d, v, spike.a, spike.b, spike.c)) return surface("spur", spike.side * 0.6);
    }
    if (t < 0 || t > 1) return null;

    // ─── Blade ───
    let w = width(t);
    const edgeSide = bias > 0 ? -1 : 0;
    // asymmetric section: cutting edge keeps full reach, back is slimmer
    if (edgeSide && vr > 0) w *= 1 - bias;
    if (o.silhouette === "glaive" && t > 0.35 && t < 0.92 && vr > 0) w += 0.9 * sinPi((t - 0.35) / 0.57) * halfWidth;
    // trident: 3-prong cutouts (empty slits between center prong and side prongs)
    if (o.silhouette === "trident" && t > 0.35 && t < 0.78) {
      const prongDist = Math.abs(vr);
      if (prongDist > 0.32 && prongDist < 0.7) return null;
    }
    // battleaxe: single-side or double-side beard with shaft cutout
    if (o.silhouette === "battleaxe" && t > 0.32 && t < 0.88) {
      if (vr > 0.28 && Math.abs(d - (bladeStart + (bladeEnd - bladeStart) * 0.55)) < 0.35) {
        // center haft hole
        return null;
      }
    }
    if (o.silhouette === "macuahuitl") {
      const teeth = Math.abs(Math.sin(t * Math.PI * 6.5));
      if (Math.abs(vr) > w * 0.6) return teeth > 0.3 && Math.abs(vr) < w * (0.6 + 0.55 * teeth) ? surface("shard", vr > 0 ? 0.6 : -0.6) : null;
    }
    if (o.serrated && t > 0.15 && t < 0.85 && vr < 0) w *= 0.84 + Math.max(0, Math.sin(t * Math.PI * 16)) * 0.16;

    if (o.crystalShards && t > 0.2 && t < 0.72) {
      for (const ct of [0.3, 0.52, 0.68]) {
        const cd = bladeStart + (bladeEnd - bladeStart) * ct;
        const cv = center(ct) + width(ct) * 0.35;
        if (Math.abs((d - cd) * 1.5) + Math.abs(v - cv) * 1.1 < 0.62) return surface("shard", (v - cv) / 0.55);
      }
    }
    if (Math.abs(vr) > w) return null;
    if (o.silhouette === "twinblade" && t > 0.14 && t < 0.95 && Math.abs(vr) < 0.22 + t * 0.12) return null;
    const across = vr / w;
    return surface(across < -0.78 ? "edge" : across > 0.78 && o.bevelLine ? "bevel" : "blade", across);
  };
  return { guardD, bladeStart, bladeEnd, handleStart, pommelD, center, width, point, sample };
}

export function buildLogicalMap(o: SwordOptions): LogicalMap {
  const geometry = createGeometry(o);
  const G = 16;
  const map: Part[][] = Array.from({ length: G }, (_, y) => Array.from({ length: G }, (_, x) => geometry.sample(x + 0.5, y + 0.5)?.part ?? "none"));
  return { map, G, guard: { gx: geometry.guardD, gy: 16 - geometry.guardD }, bladeStart: geometry.bladeStart, bladeEnd: geometry.bladeEnd, shards: [] };
}
