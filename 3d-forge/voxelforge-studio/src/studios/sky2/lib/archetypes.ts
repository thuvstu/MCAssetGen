/**
 * PARAMETRIC ARCHETYPES — every item is authored as named parts in 64-space.
 * Each part carries a material slot, a height profile (how it catches light),
 * an optional surface pattern and optional detail masks. The engine does the
 * rest, so one design renders natively at 16 / 32 / 64.
 */
import { type Mask, newMask, fillPoly, disc as rDisc, ring as rRing, seg as rSeg } from './raster';

export type Slot = 'main' | 'trim' | 'grip' | 'gem' | 'aura';
export type Prof = 'blade' | 'round' | 'flat' | 'facet' | 'cyl' | 'glow';
export type Pat =
  | 'none' | 'wrap' | 'grain' | 'speckle' | 'scales' | 'rivets' | 'spiral' | 'pages'
  /** machined / modern surface vocabulary */
  | 'teeth' | 'vents' | 'circuit' | 'knurl'
  /** organic / cursed surface vocabulary */
  | 'veins' | 'bone';
export type ArchId =
  | 'sword' | 'dagger' | 'scythe' | 'axe' | 'pickaxe' | 'drill' | 'bow' | 'staff' | 'wand' | 'rod'
  | 'helmet' | 'chest' | 'legs' | 'boots' | 'shield'
  | 'book' | 'gem' | 'orb' | 'star' | 'ingot' | 'coin' | 'potion'
  /** mechanical / modern */
  | 'chainsaw' | 'gun' | 'railgun'
  /** martial */
  | 'spear' | 'mace' | 'crossbow'
  /** arcane & cursed */
  | 'runeblade' | 'grimblade'
  /** tomes & relics */
  | 'tome' | 'relic';

export type PartTransform = {
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
};

export type DesignTransform = {
  offsetX?: number;
  offsetY?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  autoFit?: boolean;
};

export type Adornment =
  | 'none' | 'filigree' | 'crest' | 'petals' | 'thorns' | 'sigil' | 'orbitals'
  | 'cross' | 'crown' | 'flame';

/** Shared deterministic 64-space transform used by the pen and facet seeds. */
export function transformPoint(x: number, y: number, t: PartTransform | DesignTransform = {}): [number, number] {
  const baseScale = 'scale' in t ? t.scale : undefined;
  const sx = (('scaleX' in t ? t.scaleX : undefined) ?? baseScale ?? 1) * (t.flipX ? -1 : 1);
  const sy = (('scaleY' in t ? t.scaleY : undefined) ?? baseScale ?? 1) * (t.flipY ? -1 : 1);
  const px = (x - 32) * sx;
  const py = (y - 32) * sy;
  const a = ((t.rotation ?? 0) * Math.PI) / 180;
  const dx = 'offsetX' in t ? t.offsetX ?? 0 : ('x' in t ? t.x ?? 0 : 0);
  const dy = 'offsetY' in t ? t.offsetY ?? 0 : ('y' in t ? t.y ?? 0 : 0);
  return [32 + px * Math.cos(a) - py * Math.sin(a) + dx, 32 + px * Math.sin(a) + py * Math.cos(a) + dy];
}

/** Drawing pen with per-part edits followed by a shared, clipping-aware fit. */
export class Pen {
  constructor(
    public m: Mask,
    public N: number,
    public cx = 32,
    public cy = 32,
    public f = 1,
    public part: PartTransform = {},
    public global: DesignTransform = {},
  ) {}
  private point(x: number, y: number): [number, number] {
    const [lx, ly] = transformPoint(x, y, this.part);
    const [fx, fy] = [32 + (lx - this.cx) * this.f, 32 + (ly - this.cy) * this.f];
    return transformPoint(fx, fy, this.global);
  }
  private radiusScale() {
    return this.f * (this.part.scale ?? 1) * Math.max(Math.abs(this.global.scaleX ?? 1), Math.abs(this.global.scaleY ?? 1));
  }
  X(v: number) { return this.point(v, 32)[0]; }
  Y(v: number) { return this.point(32, v)[1]; }
  get k() { return this.N / 64; }
  poly(pts: number[][]) { fillPoly(this.m, this.N, pts.map(([x, y]) => this.point(x, y)), this.k); }
  disc(x: number, y: number, r: number) { const [px, py] = this.point(x, y); rDisc(this.m, this.N, px, py, r * this.radiusScale(), this.k); }
  ring(x: number, y: number, ro: number, ri: number) {
    const [px, py] = this.point(x, y);
    const s = this.radiusScale();
    rRing(this.m, this.N, px, py, ro * s, ri * s, this.k);
  }
  seg(x1: number, y1: number, x2: number, y2: number, r: number) {
    const [ax, ay] = this.point(x1, y1);
    const [bx, by] = this.point(x2, y2);
    rSeg(this.m, this.N, ax, ay, bx, by, r * this.radiusScale(), this.k);
  }
  line(pts: number[][], r: number) {
    for (let i = 1; i < pts.length; i++) this.seg(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], r);
  }
  rect(x0: number, y0: number, x1: number, y1: number) { this.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]); }
}

export type Detail = { delta: number; draw: (p: Pen) => void };
export type PartSpec = {
  id: string;
  slot: Slot;
  prof: Prof;
  z: number;
  pat?: Pat;
  axis?: [number, number];
  thin?: boolean;
  seeds?: number[][];
  draw: (p: Pen) => void;
  cut?: (p: Pen) => void;
  details?: Detail[];
};
export type Design = {
  arch: ArchId; a: number; b: number; len: number; wid: number; orn: number; gem: boolean; rune: boolean;
  /** how the colour ramp is mapped across the surface (see lib/gradient.ts) */
  grad?: import('./gradient').GradSpec;
  /** bow draw state: 0 = standby, 1..3 = vanilla bow_pulling_0..2 */
  pull?: number;
  /** Canvas-space offsets use 64-space units; the UI steps by one native pixel. */
  offsetX?: number;
  offsetY?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  autoFit?: boolean;
  /** Independent transforms for named decorative parts. */
  partTransforms?: Record<string, PartTransform>;
  /** Parts in each group share a single shading/material region. */
  mergeParts?: string[][];
  /** Multi-element shield/core setting: 0 single, 1 fused dual, 2 triad, 3 orbiting prism. */
  coreMode?: number;
  /** Decorative vocabulary applied around the visual centre, not a random blob. */
  adornment?: Adornment;
};
export type Arch = {
  jp: string; en: string; cat: '武器' | '防具' | '道具' | '装飾'; handheld: boolean;
  A: string[]; B: string[]; build: (d: Design) => PartSpec[];
};

const D = Math.SQRT1_2;
/** blade space: a runs bottom-left → top-right (like vanilla tools), b is perpendicular */
export const P = (a: number, b: number): [number, number] => [32 + D * (a + b), 32 + D * (b - a)];
const DIAG: [number, number] = [D, -D];
const ANTI: [number, number] = [D, D];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const bez = (p0: number[], p1: number[], p2: number[], t: number): number[] => {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
};
const starPts = (cx: number, cy: number, R: number, r: number, k: number, rot = -90) => {
  const pts: number[][] = [];
  for (let i = 0; i < k * 2; i++) {
    const ang = ((rot + (i * 180) / k) * Math.PI) / 180;
    const rr = i % 2 ? r : R;
    pts.push([cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)]);
  }
  return pts;
};

/* ------------------------------ shared pieces ------------------------------ */

/**
 * Blade silhouette. Real pack swords are not simple wedges: they have a short
 * ricasso (unsharpened, slightly narrower base above the guard), a body that
 * keeps its width, and a tip that *flares* a touch before converging — this is
 * what gives FurfSky / PacksHQ swords their recognisable "shouldered" profile.
 *  form 0 直刃 straight   1 幅広 broad   2 木葉 leaf   3 反り curved
 *  form 4 鋸刃 serrated   5 波刃 flame-blade
 */
function bladePoly(a0: number, a1: number, W: number, form: number): number[][] {
  const S = 22;
  const up: number[][] = [];
  const dn: number[][] = [];
  const off = (t: number) => (form === 3 ? -3.4 * t * t : form === 5 ? 0.9 * Math.sin(t * Math.PI * 4.5) : 0);
  for (let i = 0; i <= S; i++) {
    const t = i / S;
    const a = a0 + (a1 - a0) * t;
    // ricasso: first 12% of the blade is 78% width with a shoulder step
    const ric = t < 0.1 ? 0.78 : t < 0.14 ? 0.78 + (t - 0.1) / 0.04 * 0.22 : 1;
    // flare: broad blades widen slightly at 80% before the tip
    const flare = form === 1 ? 1 + 0.12 * Math.exp(-Math.pow((t - 0.82) / 0.08, 2)) : 1;
    let w1 = W * (1 - 0.3 * t) * ric * flare;
    let w2 = w1;
    if (form === 1) w1 = w2 = W * (1.3 - 0.12 * t) * ric * flare;
    if (form === 2) w1 = w2 = W * (0.72 + 0.55 * Math.sin(Math.PI * Math.pow(t, 0.8))) * ric;
    if (form === 3) w1 = w2 = W * (1 - 0.28 * t) * ric;
    if (form === 4 && i % 3 === 1 && t > 0.12 && t < 0.9) w1 += 1.8;
    up.push(P(a, off(t) - w1));
    dn.push(P(a, off(t) + w2));
  }
  // tip: broad blades have a short clipped point; others a longer spear point
  const tipLen = form === 1 ? W * 0.8 : form === 2 ? W * 1.1 : W * 1.6;
  const tipB = off(1) + (form === 3 ? -1.4 : 0);
  // two-point tip so the very end reads as a sharp pixel, not a rounded nub
  return [...up, P(a1 + tipLen * 0.7, tipB - W * 0.18), P(a1 + tipLen, tipB), P(a1 + tipLen * 0.7, tipB + W * 0.18), ...dn.reverse()];
}

function guardPart(style: number, gA: number, gw: number, gt: number, orn: number, discR: number): PartSpec {
  return {
    id: 'guard', slot: 'trim', prof: 'cyl', axis: ANTI, z: 4,
    draw: (p) => {
      // every guard gets a central écusson block where the blade enters —
      // the seam-ink pass then draws the hairline that separates it
      p.poly([P(gA + 1.6, -gt * 1.6), P(gA + 1.6, gt * 1.6), P(gA - 2.2, gt * 1.9), P(gA - 2.2, -gt * 1.9)]);
      if (style === 1) {
        // wing guard: swept quillons that thicken toward the terminals
        p.line([P(gA - 1, 0), P(gA + 1.5, -gw * 0.6), P(gA + 5, -gw)], gt);
        p.line([P(gA - 1, 0), P(gA + 1.5, gw * 0.6), P(gA + 5, gw)], gt);
        p.disc(...P(gA + 5, -gw), gt + 0.7);
        p.disc(...P(gA + 5, gw), gt + 0.7);
        p.poly([P(gA + 4.2, -gw - gt), P(gA + 7.5, -gw - gt * 0.4), P(gA + 5, -gw + gt * 0.6)]);
        p.poly([P(gA + 4.2, gw + gt), P(gA + 7.5, gw + gt * 0.4), P(gA + 5, gw - gt * 0.6)]);
      } else if (style === 2) {
        // disc guard: a tsuba with a raised rim (ring) and a flat plate
        p.disc(...P(gA, 0), discR);
        p.ring(...P(gA, 0), discR + 0.9, discR - 0.1);
      } else if (style === 3) {
        // crescent: thick at centre, tapering horns that curl toward the blade
        const pts: number[][] = [];
        for (let i = 0; i <= 10; i++) {
          const s = -1 + i / 5;
          pts.push(P(gA + 4.5 * s * s, s * gw));
        }
        for (let i = 0; i < pts.length - 1; i++) {
          const s = Math.abs(-1 + i / 5);
          p.seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], gt * (1.15 - 0.45 * s));
        }
        p.disc(...P(gA + 4.5, -gw), gt * 0.85);
        p.disc(...P(gA + 4.5, gw), gt * 0.85);
      } else {
        // cross guard: a straight bar with flared, slightly down-turned terminals
        p.seg(...P(gA, -gw * 0.72), ...P(gA, gw * 0.72), gt);
        p.poly([P(gA + gt * 0.9, -gw * 0.7), P(gA - gt * 1.1, -gw * 0.7), P(gA - gt * 1.5, -gw), P(gA + gt * 0.5, -gw - gt * 0.3)]);
        p.poly([P(gA + gt * 0.9, gw * 0.7), P(gA - gt * 1.1, gw * 0.7), P(gA - gt * 1.5, gw), P(gA + gt * 0.5, gw + gt * 0.3)]);
      }
      if (orn > 0.55 && style !== 2) {
        // spikes sit on the actual guard tips (wing / crescent tips are swept toward the blade)
        const ea = gA + [0, 5, 0, 4][style];
        p.poly([P(ea - 1.4, -gw), P(ea + 1.2, -gw - 3.4), P(ea + 1.6, -gw + 0.4)]);
        p.poly([P(ea - 1.4, gw), P(ea + 1.2, gw + 3.4), P(ea + 1.6, gw - 0.4)]);
      }
    },
  };
}

function pommelPart(style: number, pa: number, gr: number): PartSpec {
  return {
    id: 'pommel', slot: 'trim', prof: 'round', z: 3,
    draw: (p) => {
      // a short ferrule collar between grip and pommel on every style
      p.seg(...P(pa + 2.2, -gr - 0.3), ...P(pa + 2.2, gr + 0.3), 0.9);
      if (style === 1) {
        // fishtail / scent-stopper: a flared triangle with a peen nub
        p.poly([P(pa + 2.5, -gr - 0.9), P(pa - 4.5, -0.6), P(pa - 4.5, 0.6), P(pa + 2.5, gr + 0.9)]);
        p.disc(...P(pa - 5, 0), 0.9);
      } else if (style === 2) {
        // ring pommel with a visible rivet in the centre
        p.ring(...P(pa - 1, 0), 3.8, 1.6);
        p.disc(...P(pa - 1, 0), 0.8);
      } else if (style === 3) {
        // lozenge / wheel: diamond with a flat cap
        p.poly([P(pa + 3.2, 0), P(pa, -3.4), P(pa - 3.4, 0), P(pa, 3.4)]);
        p.seg(...P(pa - 3.4, -1), ...P(pa - 3.4, 1), 0.9);
      } else {
        // wheel pommel: disc plus a smaller cap disc for a two-tier read
        p.disc(...P(pa, 0), gr + 1.5);
        p.disc(...P(pa - 1.6, 0), gr + 0.4);
      }
    },
  };
}

function runes(a0: number, a1: number, k: number, b = 0, r = 1.1): PartSpec {
  return {
    id: 'rune', slot: 'aura', prof: 'glow', z: 5, thin: true,
    draw: (p) => {
      for (let i = 0; i < k; i++) p.disc(...P(a0 + ((a1 - a0) * (i + 0.5)) / k, b), r);
    },
  };
}

const haft = (a0: number, a1: number, r: number, pat: Pat = 'grain'): PartSpec => ({
  id: 'haft', slot: 'grip', prof: 'cyl', pat, axis: DIAG, z: 1,
  draw: (p) => p.seg(...P(a0, 0), ...P(a1, 0), r),
});

const gemAt = (x: number, y: number, r: number, z = 7): PartSpec => ({
  id: 'gem', slot: 'gem', prof: 'facet', z, thin: true, draw: (p) => p.disc(x, y, r),
});

/* -------------------------------- weapons -------------------------------- */

const sword: Arch = {
  jp: '剣', en: 'Sword', cat: '武器', handheld: true,
  A: ['直刃', '幅広', '木葉', '反り', '鋸刃', '波刃'],
  B: ['十字鍔', '翼鍔', '円鍔', '三日月'],
  build(d) {
    const L = lerp(24, 33, d.len);
    const W = lerp(3.1, 5.6, d.wid);
    const a0 = -9;
    const a1 = a0 + L;
    const bp = bladePoly(a0, a1, W, d.a);
    const out: PartSpec[] = [
      {
        id: 'blade', slot: 'main', prof: 'blade', axis: DIAG, z: 1, draw: (p) => p.poly(bp),
        details: d.a <= 1 ? [{ delta: -1, draw: (p) => p.seg(...P(a0 + 1, 0), ...P(a0 + L * 0.66, 0), 0.8) }] : undefined,
      },
    ];
    const gA = a0 - 1.2;
    const gw = lerp(7.5, 11, d.wid) + d.orn * 2.4;
    out.push(guardPart(d.b, gA, gw, lerp(1.9, 2.6, d.wid), d.orn, lerp(5, 7.2, d.wid)));
    const gl = lerp(8.5, 11.5, d.len);
    const gr = lerp(2.0, 2.6, d.wid);
    out.push({ id: 'grip', slot: 'grip', prof: 'cyl', pat: 'wrap', axis: DIAG, z: 2, draw: (p) => p.seg(...P(gA - 1, 0), ...P(gA - gl, 0), gr) });
    out.push(pommelPart(d.b, gA - gl - 1.8, gr));
    if (d.gem) out.push(gemAt(...P(gA, 0), lerp(2.2, 3, d.wid)));
    if (d.rune) out.push(runes(a0 + 3, a0 + L * 0.8, 3));
    return out;
  },
};

const dagger: Arch = {
  jp: '短剣', en: 'Dagger', cat: '武器', handheld: true,
  A: ['直刃', '牙', '波刃'], B: ['小鍔', '鉤鍔', '無鍔'],
  build(d) {
    const L = lerp(15, 21, d.len);
    const W = lerp(2.6, 4.3, d.wid);
    const a0 = -3;
    const a1 = a0 + L;
    const form = [0, 3, 5][d.a] ?? 0;
    const out: PartSpec[] = [{ id: 'blade', slot: 'main', prof: 'blade', axis: DIAG, z: 1, draw: (p) => p.poly(bladePoly(a0, a1, W, form)) }];
    const gA = a0 - 1;
    if (d.b === 1)
      out.push({ id: 'guard', slot: 'trim', prof: 'cyl', z: 4, draw: (p) => p.line([P(gA + 4, -7.5), P(gA, -5), P(gA, 5), P(gA - 4, 7.5)], 1.7) });
    else if (d.b === 2) out.push({ id: 'guard', slot: 'trim', prof: 'round', z: 4, draw: (p) => p.disc(...P(gA, 0), 3.1) });
    else out.push(guardPart(0, gA, lerp(5, 7, d.wid), 1.8, d.orn, 4));
    const gl = lerp(12, 15, d.len);
    const gr = lerp(2.1, 2.7, d.wid);
    out.push({ id: 'grip', slot: 'grip', prof: 'cyl', pat: 'wrap', axis: DIAG, z: 2, draw: (p) => p.seg(...P(gA - 0.5, 0), ...P(gA - gl, 0), gr) });
    out.push(pommelPart(d.b === 1 ? 1 : 0, gA - gl - 1.8, gr));
    if (d.gem) out.push(gemAt(...P(gA, 0), 2.2));
    if (d.rune) out.push(runes(a0 + 2, a1 - 2, 2));
    return out;
  },
};

const scythe: Arch = {
  jp: '大鎌', en: 'Scythe', cat: '武器', handheld: true,
  A: ['大鎌', '双刃', '鉤鎌'], B: ['直柄', '曲柄'],
  build(d) {
    const out: PartSpec[] = [];
    const r = lerp(1.8, 2.4, d.wid);
    if (d.b === 1)
      out.push({ id: 'haft', slot: 'grip', prof: 'cyl', pat: 'grain', axis: DIAG, z: 1, draw: (p) => p.line([P(-30, 0), P(-4, 2.2), P(21, 0)], r) });
    else out.push(haft(-30, 21, r));
    const H = P(21, 0);
    const tip = d.a === 2 ? [9, 27] : [6, 18];
    const th = lerp(0.85, 1.15, d.wid);
    const oc = [30, -6 - 4 * d.len];
    const ic = [28, 6 + 2 * (1 - th)];
    const blade: number[][] = [];
    for (let i = 0; i <= 14; i++) blade.push(bez([H[0] + 2, H[1] - 4 * th], oc, tip, i / 14));
    for (let i = 0; i <= 14; i++) blade.push(bez(tip, ic, [H[0] - 3, H[1] + 5 * th], i / 14));
    out.push({
      id: 'blade', slot: 'main', prof: 'blade', axis: [-0.95, 0.3], z: 2,
      draw: (p) => {
        p.poly(blade);
        if (d.a === 1) {
          const b2: number[][] = [];
          // rooted inside the collar so the second blade can never float free
          for (let i = 0; i <= 10; i++) b2.push(bez([H[0] + 1, H[1] + 1.5], [60, 24], [58, 40], i / 10));
          for (let i = 0; i <= 10; i++) b2.push(bez([58, 40], [52, 27], [H[0] - 1.5, H[1] + 3], i / 10));
          p.poly(b2);
        }
      },
      details: [{ delta: 1, draw: (p) => { const e: number[][] = []; for (let i = 1; i <= 12; i++) e.push(bez(tip, ic, [H[0] - 3, H[1] + 5 * th], i / 14)); p.line(e, 0.7); } }],
    });
    out.push({ id: 'collar', slot: 'trim', prof: 'round', z: 3, draw: (p) => p.disc(H[0], H[1], 3.4) });
    out.push({ id: 'cap', slot: 'trim', prof: 'round', z: 3, draw: (p) => p.disc(...P(-30, 0), r + 0.9) });
    if (d.gem) out.push(gemAt(H[0], H[1], 2.2));
    if (d.rune) {
      const pts = [0.3, 0.55, 0.78].map((t) => { const o = bez([H[0] + 2, H[1] - 4], oc, tip, t); const q = bez(tip, ic, [H[0] - 3, H[1] + 5], 1 - t); return [(o[0] + q[0]) / 2, (o[1] + q[1]) / 2]; });
      out.push({ id: 'rune', slot: 'aura', prof: 'glow', z: 5, thin: true, draw: (p) => pts.forEach(([x, y]) => p.disc(x, y, 1.1)) });
    }
    return out;
  },
};

const axe: Arch = {
  jp: '斧', en: 'Axe', cat: '武器', handheld: true,
  A: ['片刃', '両刃', '髭斧'], B: ['木柄', '金属柄'],
  build(d) {
    const s = lerp(0.85, 1.15, d.wid);
    const out: PartSpec[] = [haft(-30, 22, lerp(1.9, 2.5, d.wid), d.b === 1 ? 'none' : 'grain')];
    const single = [P(21, 2.5), P(5, 2.5), P(4, -5 * s), P(2.5, -13 * s), P(5, -19.5 * s), P(14, -21.5 * s), P(23, -19.5 * s), P(25.5, -13 * s), P(24, -5 * s)];
    const bearded = [P(21, 2.5), P(2, 2.5), P(-5, -6 * s), P(-7, -16 * s), P(2, -21 * s), P(14, -22.5 * s), P(23, -19.5 * s), P(25.5, -12 * s), P(24, -4 * s)];
    const mirror = (pts: number[][]) => pts.map(([x, y]) => { const a = (x - 32 - (y - 32)) / (2 * D); const b = (x - 32 + (y - 32)) / (2 * D); return P(a, -b); });
    const head = d.a === 2 ? bearded : single;
    out.push({
      id: 'head', slot: 'main', prof: 'blade', axis: ANTI, z: 2,
      draw: (p) => { p.poly(head); if (d.a === 1) p.poly(mirror(single)); },
      details: [
        // bright bevelled cutting edge following the bit curve
        { delta: 1, draw: (p) => p.line([P(6, -18 * s), P(14, -19.8 * s), P(22, -18 * s)], 0.8) },
        // cheek line: the forged crease where the bit meets the eye
        { delta: -1, draw: (p) => p.line([P(7, -9 * s), P(14, -11 * s), P(21, -9 * s)], 0.7) },
        ...(d.a === 1 ? [{ delta: 1, draw: (p: Pen) => p.line([P(6, 18 * s), P(14, 19.8 * s), P(22, 18 * s)], 0.8) }] : []),
      ],
    });
    // eye / socket: a proper collar wrapping the haft, with a poll (hammer back) on single-bit axes
    out.push({
      id: 'socket', slot: 'trim', prof: 'cyl', axis: DIAG, z: 3,
      draw: (p) => {
        p.seg(...P(10.5, -3.6), ...P(10.5, 3.6), 1.7);
        p.seg(...P(17.5, -3.6), ...P(17.5, 3.6), 1.7);
        p.disc(...P(22, 0), 2.6);
        if (d.a !== 1) p.poly([P(9, 2.8), P(19, 2.8), P(18, 7.5), P(10, 7.5)]);
      },
    });
    if (d.gem) out.push(gemAt(...P(14, -10 * s), 2.3));
    if (d.rune) out.push({ id: 'rune', slot: 'aura', prof: 'glow', z: 5, thin: true, draw: (p) => { p.disc(...P(9, -13 * s), 1.1); p.disc(...P(19, -13 * s), 1.1); } });
    return out;
  },
};

const pickaxe: Arch = {
  jp: 'ツルハシ', en: 'Pickaxe', cat: '武器', handheld: true,
  A: ['標準', '重型', '鉤型'], B: ['木柄', '金属柄'],
  build(d) {
    const out: PartSpec[] = [haft(-30, 18, lerp(1.9, 2.5, d.wid), d.b === 1 ? 'none' : 'grain')];
    const inner: number[][] = [];
    const outer: number[][] = [];
    const heavy = d.a === 1 ? 1.35 : 1;
    const bend = d.a === 2 ? 10 : 6;
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const b = -21 + 42 * t;
      const ac = 19 - Math.pow((t - 0.5) * 2, 2) * bend;
      const hw = lerp(3.6, 1.1, Math.abs(t - 0.5) * 2) * heavy * lerp(0.9, 1.1, d.wid);
      inner.push(P(ac - hw, b));
      outer.push(P(ac + hw, b));
    }
    out.push({ id: 'head', slot: 'main', prof: 'blade', axis: ANTI, z: 2, draw: (p) => p.poly([...inner.reverse(), ...outer]) });
    out.push({ id: 'socket', slot: 'trim', prof: 'round', z: 3, draw: (p) => p.disc(...P(18.5, 0), 3.5) });
    if (d.gem) out.push(gemAt(...P(18.5, 0), 2.2));
    if (d.rune) out.push(runes(-22, 8, 3));
    return out;
  },
};

const drill: Arch = {
  jp: 'ドリル', en: 'Drill', cat: '武器', handheld: true,
  A: ['円錐', '段付き', '三枚刃'], B: ['標準胴', '重装胴'],
  build(d) {
    const R = lerp(6, 8, d.wid) * (d.b === 1 ? 1.15 : 1);
    const r = R - 0.8;
    const out: PartSpec[] = [];
    out.push({
      id: 'body', slot: 'trim', prof: 'round', z: 2, draw: (p) => p.seg(...P(-13, 0), ...P(5, 0), R),
      details: [{ delta: -1, draw: (p) => { p.seg(...P(-9, -2), ...P(-9, 2), 0.7); p.seg(...P(-5, -2), ...P(-5, 2), 0.7); } }],
    });
    const cone = d.a === 1
      ? [P(4, -r), P(12, -r), P(12, -r * 0.72), P(20, -r * 0.72), P(20, -r * 0.44), P(30, 0), P(20, r * 0.44), P(20, r * 0.72), P(12, r * 0.72), P(12, r), P(4, r)]
      : [P(4, -r), P(30, 0), P(4, r)];
    out.push({
      id: 'bit', slot: 'main', prof: 'blade', pat: 'spiral', axis: DIAG, z: 3,
      draw: (p) => { p.poly(cone); if (d.a === 2) { p.poly([P(7, -r), P(16, -r - 3.2), P(14, -r + 1.4)]); p.poly([P(7, r), P(16, r + 3.2), P(14, r - 1.4)]); } },
    });
    out.push({ id: 'handle', slot: 'grip', prof: 'cyl', pat: 'wrap', axis: DIAG, z: 1, draw: (p) => p.seg(...P(-13, 0), ...P(-29, 0), lerp(2.2, 2.8, d.wid)) });
    out.push({ id: 'tank', slot: 'gem', prof: 'round', z: 4, draw: (p) => p.seg(...P(-10, -R - 0.6), ...P(0, -R - 0.6), 2.4) });
    if (d.gem) out.push(gemAt(...P(-4, 2.5), 2.1));
    if (d.rune) out.push(runes(-11, 3, 2, 3.2, 1));
    return out;
  },
};

const bow: Arch = {
  jp: '弓', en: 'Bow', cat: '武器', handheld: true,
  A: ['長弓', '反り弓', '短弓', '複合弓', '大弓', '霊弓'],
  B: ['素', '翼飾', '矢筒'],
  build(d) {
    const pull = Math.max(0, Math.min(3, d.pull ?? 0));
    const k = pull / 3;
    // drawing the string pulls the tips inward and deepens the bend — like the vanilla pulling frames
    const R = (d.a === 2 ? 22 : d.a === 4 ? 29 : 26) * (1 - 0.12 * k);
    const bulge = lerp(14, 19, d.len) + 2.2 * k + (d.a === 3 ? 2.5 : 0);
    // the grip stays fixed in the hand: extra bend moves the tips back toward the archer
    const c = 9 + 2.2 * k;
    const S = 20;
    const aAt = (u: number) => -c + bulge * (1 - u * u) - (d.a === 1 ? 4.5 * Math.pow(Math.abs(u), 6) : 0);
    const limb: number[][] = [];
    const rads: number[] = [];
    for (let i = 0; i <= S; i++) {
      const u = -1 + (2 * i) / S;
      limb.push(P(aAt(u), R * u));
      rads.push(lerp(1.5, 2.9, 1 - Math.abs(u)) * lerp(0.85, 1.15, d.wid));
    }
    const nockA = aAt(1) - 7.5 * k;
    const nock = P(nockA, 0);
    const out: PartSpec[] = [
      {
        // 霊弓 (spirit bow) renders the limb itself as glowing energy
        id: 'limb', slot: d.a === 5 ? 'aura' : 'main', prof: d.a === 5 ? 'glow' : 'cyl',
        pat: d.a === 5 ? 'none' : 'grain', axis: ANTI, z: 2,
        draw: (p) => { for (let i = 1; i <= S; i++) p.seg(limb[i - 1][0], limb[i - 1][1], limb[i][0], limb[i][1], rads[i]); },
      },
      {
        id: 'string', slot: 'aura', prof: 'flat', z: 1, thin: true,
        draw: (p) => (pull === 0 ? p.seg(limb[0][0], limb[0][1], limb[S][0], limb[S][1], 0.8) : p.line([limb[0], nock, limb[S]], 0.8)),
      },
    ];
    if (d.a === 3) {
      // compound bow: cam wheels at both limb tips plus a cable between them
      out.push({
        id: 'cams', slot: 'trim', prof: 'cyl', z: 4,
        draw: (p) => { p.ring(limb[1][0], limb[1][1], 4.2, 2.2); p.ring(limb[S - 1][0], limb[S - 1][1], 4.2, 2.2); },
      });
      out.push({
        id: 'cable', slot: 'aura', prof: 'flat', z: 1, thin: true,
        draw: (p) => p.line([limb[2], P(aAt(0) + 5, -3), P(aAt(0) + 5, 3), limb[S - 2]], 0.65),
      });
    }
    if (d.b === 2) {
      // quiver strapped behind the grip with three visible fletchings
      out.push({ id: 'quiver', slot: 'grip', prof: 'cyl', pat: 'wrap', axis: DIAG, z: 0, draw: (p) => p.seg(...P(aAt(0) - 15, -9), ...P(aAt(0) - 4, -14), 3.4) });
      out.push({
        id: 'arrows', slot: 'trim', prof: 'cyl', axis: DIAG, z: 1, thin: true,
        draw: (p) => { for (const o of [-1.6, 0, 1.6]) { p.seg(...P(aAt(0) - 5, -13 + o), ...P(aAt(0) + 2, -16 + o), 0.7); p.poly([P(aAt(0) + 1, -16 + o), P(aAt(0) + 4, -17.4 + o), P(aAt(0) + 1, -14.8 + o)]); } },
      });
    }
    const m = S / 2;
    out.push({ id: 'grip', slot: 'grip', prof: 'cyl', pat: 'wrap', axis: ANTI, z: 3, draw: (p) => p.seg(limb[m - 2][0], limb[m - 2][1], limb[m + 2][0], limb[m + 2][1], rads[m] + 0.7) });
    out.push({ id: 'nock', slot: 'trim', prof: 'round', z: 4, draw: (p) => { p.disc(limb[0][0], limb[0][1], 2.1); p.disc(limb[S][0], limb[S][1], 2.1); } });
    if (d.b === 1 || d.orn > 0.6)
      out.push({
        id: 'fin', slot: 'trim', prof: 'flat', z: 1,
        draw: (p) => { for (const s of [-1, 1]) { const u = s * 0.5; p.poly([P(aAt(u - 0.13), R * (u - 0.13)), P(aAt(u) + 6.5, R * u * 1.08), P(aAt(u + 0.13), R * (u + 0.13))]); } },
      });
    if (pull > 0) {
      // arrow nocked on the string, pointing along +a (top-right) like vanilla; head stays inside the standby bounds
      const tipA = aAt(0) + 1.5;
      out.push({ id: 'shaft', slot: 'grip', prof: 'cyl', axis: DIAG, z: 5, thin: true, draw: (p) => p.seg(...nock, ...P(tipA - 3, 0), 0.9) });
      out.push({ id: 'fletch', slot: 'aura', prof: 'flat', z: 5, thin: true, draw: (p) => p.poly([P(nockA + 0.5, 0), P(nockA + 4.5, -2.4), P(nockA + 5.5, 0), P(nockA + 4.5, 2.4)]) });
      out.push({ id: 'head', slot: 'trim', prof: 'blade', z: 6, thin: true, draw: (p) => p.poly([P(tipA - 4, -2.3), P(tipA, 0), P(tipA - 4, 2.3), P(tipA - 3, 0)]) });
    }
    if (d.gem) out.push(gemAt(...P(aAt(0) + 1.2, 0), 2.3));
    return out;
  },
};

const staff: Arch = {
  jp: '杖', en: 'Staff', cat: '武器', handheld: true,
  A: ['宝珠', '結晶', '三日月', '星', '骨杖', '蛇杖', '環杖'],
  B: ['素', '翼飾', '鎖飾'],
  build(d) {
    const out: PartSpec[] = [haft(-30, 13, lerp(1.8, 2.4, d.wid), d.a === 4 ? 'bone' : 'grain')];
    out.push({ id: 'collar', slot: 'trim', prof: 'round', z: 3, draw: (p) => p.disc(...P(13, 0), 3.2) });
    if (d.a === 1)
      out.push({ id: 'head', slot: 'gem', prof: 'facet', z: 2, seeds: [P(16, -2), P(16, 2), P(23, -1.6), P(23, 1.6), P(28, 0)], draw: (p) => p.poly([P(12.5, 0), P(18, -5.2), P(31, 0), P(18, 5.2)]) });
    else if (d.a === 2) {
      out.push({ id: 'head', slot: 'main', prof: 'blade', z: 2, draw: (p) => p.disc(...P(22, 0), 9), cut: (p) => p.disc(...P(26.5, -2.6), 7.4) });
      if (d.gem) out.push(gemAt(...P(23.5, -1.2), 2.4));
    } else if (d.a === 3)
      out.push({ id: 'head', slot: 'aura', prof: 'glow', z: 2, draw: (p) => { const [x, y] = P(21, 0); p.poly(starPts(x, y, 9.5, 3.9, 4, -45)); } });
    else if (d.a === 4) {
      // bone staff: a horned skull cradling the focus
      out.push({
        id: 'head', slot: 'main', prof: 'round', pat: 'bone', z: 2,
        draw: (p) => { p.disc(...P(21, 0), 7.2); p.poly([P(24, -4), P(31, -1.5), P(24, 2)]); },
        cut: (p) => { p.disc(...P(23, -3), 2.2); p.disc(...P(23, 2.6), 2.2); },
      });
      out.push({ id: 'horns', slot: 'trim', prof: 'blade', z: 3, draw: (p) => { p.line([P(17, -6), P(16, -12), P(21, -14)], 1.4); p.line([P(17, 6), P(16, 12), P(21, 14)], 1.4); } });
    } else if (d.a === 5) {
      // serpent staff: a coiled body rising to a fanged head
      const coil: number[][] = [];
      for (let i = 0; i <= 18; i++) { const t = i / 18; coil.push(P(13 + 15 * t, Math.sin(t * Math.PI * 1.8) * 6.5 * (1 - t * 0.35))); }
      out.push({ id: 'head', slot: 'main', prof: 'cyl', pat: 'scales', axis: DIAG, z: 2, draw: (p) => { for (let i = 1; i < coil.length; i++) p.seg(coil[i - 1][0], coil[i - 1][1], coil[i][0], coil[i][1], lerp(2.6, 1.5, i / coil.length)); p.disc(coil[coil.length - 1][0], coil[coil.length - 1][1], 3.1); } });
      out.push({ id: 'fangs', slot: 'trim', prof: 'blade', z: 4, thin: true, draw: (p) => { const [hx, hy] = coil[coil.length - 1]; p.poly([[hx, hy], [hx + 3.4, hy - 2.4], [hx + 1.2, hy + 0.6]]); p.poly([[hx, hy + 1.4], [hx + 3.2, hy + 2.6], [hx + 1, hy + 2.4]]); } });
    } else if (d.a === 6) {
      // ring staff: a floating torus with a suspended core
      out.push({ id: 'head', slot: 'trim', prof: 'cyl', z: 2, draw: (p) => p.ring(...P(21, 0), 9.5, 6.6) });
      out.push({ id: 'core', slot: 'aura', prof: 'glow', z: 3, thin: true, draw: (p) => p.disc(...P(21, 0), 3.4) });
      out.push({ id: 'spokes', slot: 'trim', prof: 'cyl', z: 3, thin: true, draw: (p) => { for (let i = 0; i < 4; i++) { const t = (i * Math.PI) / 2 + 0.78; const [ox, oy] = P(21, 0); p.seg(ox, oy, ox + Math.cos(t) * 8, oy + Math.sin(t) * 8, 0.75); } } });
    } else {
      out.push({ id: 'head', slot: 'gem', prof: 'round', z: 2, draw: (p) => p.disc(...P(21.5, 0), lerp(6.5, 8.5, d.wid)) });
      out.push({ id: 'prong', slot: 'trim', prof: 'cyl', z: 4, draw: (p) => { p.line([P(12, -3), P(15, -8), P(22, -9.5)], 1.6); p.line([P(12, 3), P(15, 8), P(22, 9.5)], 1.6); } });
    }
    if (d.b === 1)
      out.push({ id: 'wing', slot: 'trim', prof: 'flat', z: 1, draw: (p) => { p.poly([P(12, -2), P(9, -11), P(16, -4)]); p.poly([P(12, 2), P(9, 11), P(16, 4)]); } });
    else if (d.b === 2)
      out.push({ id: 'charms', slot: 'aura', prof: 'cyl', z: 4, thin: true, draw: (p) => { p.ring(...P(9, -4.5), 2.4, 1.4); p.ring(...P(5, -7), 2.1, 1.2); p.seg(...P(11, -2.6), ...P(9, -4.5), 0.7); } });
    if (d.rune) out.push(runes(-22, 6, 3));
    return out;
  },
};

const wand: Arch = {
  jp: 'ワンド', en: 'Wand', cat: '武器', handheld: true,
  A: ['星', '結晶', '宝珠'], B: ['素', '握り革'],
  build(d) {
    const r = lerp(1.4, 2.0, d.wid);
    const out: PartSpec[] = [{ id: 'rod', slot: 'main', prof: 'cyl', axis: DIAG, z: 1, draw: (p) => p.seg(...P(-28, 0), ...P(12, 0), r) }];
    if (d.b === 1) out.push({ id: 'grip', slot: 'grip', prof: 'cyl', pat: 'wrap', axis: DIAG, z: 2, draw: (p) => p.seg(...P(-28, 0), ...P(-17, 0), r + 0.6) });
    out.push({ id: 'collar', slot: 'trim', prof: 'round', z: 3, draw: (p) => p.disc(...P(11.5, 0), 2.6) });
    if (d.a === 1) out.push({ id: 'tip', slot: 'gem', prof: 'facet', z: 2, seeds: [P(15, -1.6), P(15, 1.6), P(23, 0)], draw: (p) => p.poly([P(11, 0), P(16, -4.4), P(28, 0), P(16, 4.4)]) });
    else if (d.a === 2) out.push({ id: 'tip', slot: 'gem', prof: 'round', z: 2, draw: (p) => p.disc(...P(18, 0), 6.5) });
    else out.push({ id: 'tip', slot: 'aura', prof: 'glow', z: 2, draw: (p) => { const [x, y] = P(19, 0); p.poly(starPts(x, y, 10, 4.2, 5, -45)); } });
    if (d.gem && d.a !== 1) out.push(gemAt(...P(11.5, 0), 1.8));
    if (d.rune) out.push(runes(-14, 6, 2, 0, 0.9));
    return out;
  },
};

const rod: Arch = {
  jp: '釣竿', en: 'Rod', cat: '武器', handheld: true,
  A: ['釣針', '浮き', '鉤爪'], B: ['素', 'リール大'],
  build(d) {
    const T = P(22, -3.8);
    const Lx = T[0];
    const Ly = T[1] + 24;
    const out: PartSpec[] = [
      { id: 'pole', slot: 'main', prof: 'cyl', pat: 'grain', axis: DIAG, z: 1, draw: (p) => { p.seg(...P(-26, 0), ...P(0, -1.2), lerp(1.8, 2.3, d.wid)); p.seg(...P(0, -1.2), ...T, lerp(1.2, 1.5, d.wid)); } },
      { id: 'handle', slot: 'grip', prof: 'cyl', pat: 'wrap', axis: DIAG, z: 2, draw: (p) => p.seg(...P(-28, 0), ...P(-15, 0), 2.7) },
      { id: 'reel', slot: 'trim', prof: 'round', z: 3, draw: (p) => p.disc(...P(-14, 4.2), d.b === 1 ? 3.6 : 2.8) },
      { id: 'line', slot: 'aura', prof: 'flat', z: 0, thin: true, draw: (p) => p.seg(T[0], T[1], Lx, Ly, 1.1) },
    ];
    if (d.a === 1) out.push({ id: 'bob', slot: 'gem', prof: 'round', z: 4, draw: (p) => p.disc(Lx, Ly + 3, 3.4), details: [{ delta: 2, draw: (p) => p.rect(Lx - 4, Ly - 1, Lx + 4, Ly + 2.6) }] });
    else if (d.a === 2) out.push({ id: 'hook', slot: 'trim', prof: 'cyl', z: 4, draw: (p) => { p.seg(Lx, Ly, Lx, Ly + 3.5, 1.3); p.line([[Lx, Ly + 3], [Lx - 4, Ly + 6.5], [Lx - 5, Ly + 3.8]], 1.25); p.line([[Lx, Ly + 3], [Lx + 4, Ly + 6.5], [Lx + 5, Ly + 3.8]], 1.25); } });
    else out.push({ id: 'hook', slot: 'trim', prof: 'cyl', z: 4, draw: (p) => p.line([[Lx, Ly], [Lx, Ly + 4.5], [Lx - 3, Ly + 6.5], [Lx - 5.5, Ly + 4]], 1.25) });
    return out;
  },
};

/* --------------------------------- armour --------------------------------- */

const helmet: Arch = {
  jp: '兜', en: 'Helmet', cat: '防具', handheld: false,
  A: ['大兜', '角兜', '王冠'], B: ['鶏冠', '無'],
  build(d) {
    const out: PartSpec[] = [];
    if (d.a === 2) {
      out.push({ id: 'cap', slot: 'main', prof: 'round', z: 0, draw: (p) => p.disc(32, 38, 19) });
      out.push({ id: 'band', slot: 'trim', prof: 'flat', z: 2, draw: (p) => { p.rect(8, 36, 56, 54); p.poly([[8, 37], [12, 14], [20, 37]]); p.poly([[22, 37], [32, 5], [42, 37]]); p.poly([[44, 37], [52, 14], [56, 37]]); } });
      out.push({ id: 'gem', slot: 'gem', prof: 'facet', z: 4, thin: true, draw: (p) => { p.disc(32, 45, 3.6); p.disc(19, 45, 2.6); p.disc(45, 45, 2.6); p.disc(32, 7, 2.8); p.disc(12, 15, 2.3); p.disc(52, 15, 2.3); } });
      return out;
    }
    if (d.a === 1) {
      out.push({
        id: 'shell', slot: 'main', prof: 'round', z: 1, draw: (p) => { p.disc(32, 33, 21); p.rect(11, 33, 53, 54); },
        details: [{ delta: -9, draw: (p) => { p.rect(20, 36, 44, 40); p.rect(30, 36, 34, 48); } }],
      });
      out.push({ id: 'horn', slot: 'trim', prof: 'cyl', z: 2, draw: (p) => { for (const s of [1, -1]) { const X = (x: number) => (s > 0 ? x : 64 - x); p.seg(X(16), 27, X(9), 17, 3.6); p.seg(X(9), 17, X(7.5), 8, 2.7); p.seg(X(7.5), 8, X(10), 1.5, 1.7); } } });
    } else {
      out.push({
        id: 'shell', slot: 'main', prof: 'round', z: 1, draw: (p) => { p.disc(32, 30, 25); p.rect(7, 30, 57, 52); },
        details: [
          { delta: -9, draw: (p) => p.rect(19, 36, 45, 40) },
          { delta: -2, draw: (p) => { p.disc(26, 46, 1.5); p.disc(32, 47, 1.5); p.disc(38, 46, 1.5); } },
          { delta: 1, draw: (p) => p.seg(32, 7, 32, 32, 1) },
        ],
      });
      out.push({ id: 'brow', slot: 'trim', prof: 'flat', z: 2, draw: (p) => p.rect(7, 29, 57, 34.5) });
      if (d.b === 0) out.push({ id: 'crest', slot: 'trim', prof: 'round', z: 0, draw: (p) => { p.rect(29.5, 1, 34.5, 12); p.disc(32, 3.5, 3.6); } });
    }
    if (d.gem) out.push(gemAt(32, d.a === 1 ? 30 : 31.8, 3));
    if (d.rune) out.push({ id: 'rune', slot: 'aura', prof: 'glow', z: 5, thin: true, draw: (p) => { p.disc(24, 38, 1.4); p.disc(40, 38, 1.4); } });
    return out;
  },
};

const chest: Arch = {
  jp: '胸当て', en: 'Chestplate', cat: '防具', handheld: false,
  A: ['板金', '竜鱗', '法衣'], B: ['肩当て', '翼肩'],
  build(d) {
    const out: PartSpec[] = [
      {
        id: 'torso', slot: 'main', prof: 'flat', pat: (['rivets', 'scales', 'none'] as Pat[])[d.a], z: 1,
        // breastplate with a waist taper and a subtle central ridge
        draw: (p) => p.poly([[15, 8], [49, 8], [48, 30], [44, 44], [46, 56], [18, 56], [20, 44], [16, 30]]),
        cut: (p) => { p.disc(32, 9, 8.5); p.rect(24.5, 0, 39.5, 9); },
        details: d.a === 2
          ? [{ delta: -2, draw: (p) => p.seg(32, 19, 32, 56, 0.8) }, { delta: 1, draw: (p) => { p.seg(26, 20, 26, 54, 0.6); p.seg(38, 20, 38, 54, 0.6); } }]
          : [
              // central ridge: highlight left, shadow right (reads as a raised keel)
              { delta: 1, draw: (p) => p.seg(31, 16, 31, 44, 0.7) },
              { delta: -1, draw: (p) => p.seg(33.2, 16, 33.2, 44, 0.7) },
              // lower lames (overlapping horizontal plates) below the belt line
              { delta: -1, draw: (p) => { p.seg(19, 31, 45, 31, 0.7); p.seg(20, 39, 44, 39, 0.7); } },
              { delta: 1, draw: (p) => { p.seg(19, 32.4, 45, 32.4, 0.6); p.seg(20, 40.4, 44, 40.4, 0.6); } },
            ],
      },
      // gorget / collar plate across the neck opening
      { id: 'gorget', slot: 'trim', prof: 'cyl', axis: [1, 0], z: 2, draw: (p) => p.poly([[22, 12], [42, 12], [40, 17], [24, 17]]) },
      { id: 'belt', slot: 'trim', prof: 'flat', z: 3, draw: (p) => p.rect(18, 46, 46, 51), details: [{ delta: 1, draw: (p) => p.rect(30, 46, 34, 51) }] },
    ];
    if (d.b === 1) out.push({ id: 'shoulder', slot: 'trim', prof: 'flat', z: 2, draw: (p) => { p.poly([[3, 22], [10, 3], [23, 9], [21, 22]]); p.poly([[61, 22], [54, 3], [41, 9], [43, 22]]); } });
    else out.push({ id: 'shoulder', slot: 'trim', prof: 'round', z: 2, draw: (p) => { p.disc(12, 15, 9.5); p.disc(52, 15, 9.5); } });
    if (d.gem) out.push(gemAt(32, 28, 4));
    else if (d.rune) out.push({ id: 'rune', slot: 'aura', prof: 'glow', z: 4, thin: true, draw: (p) => p.poly(starPts(32, 28, 5, 2.2, 4)) });
    return out;
  },
};

const legs: Arch = {
  jp: '脚甲', en: 'Leggings', cat: '防具', handheld: false,
  A: ['板金', '竜鱗'], B: ['膝当て', '無'],
  build(d) {
    const out: PartSpec[] = [
      { id: 'waist', slot: 'trim', prof: 'flat', z: 2, draw: (p) => p.rect(13, 4, 51, 13), details: [{ delta: 1, draw: (p) => p.rect(29, 4, 35, 13) }] },
      {
        id: 'legs', slot: 'main', prof: 'flat', pat: d.a === 1 ? 'scales' : 'rivets', z: 1,
        // thighs taper toward the knee, then flare at the cuisses
        draw: (p) => { p.rect(13, 12, 51, 24); p.poly([[13, 23], [30, 23], [29, 36], [28, 60], [14, 60], [15, 36]]); p.poly([[34, 23], [51, 23], [49, 36], [50, 60], [36, 60], [35, 36]]); },
        details: [
          // articulation lames across each thigh: shadow line + highlight line
          { delta: -1, draw: (p) => { p.seg(15, 34, 29, 34, 0.7); p.seg(35, 34, 49, 34, 0.7); p.seg(15, 48, 28, 48, 0.7); p.seg(36, 48, 49, 48, 0.7); } },
          { delta: 1, draw: (p) => { p.seg(15, 35.4, 29, 35.4, 0.6); p.seg(35, 35.4, 49, 35.4, 0.6); } },
          // inner-leg shadow where the two legs meet
          { delta: -1, draw: (p) => { p.seg(29.5, 24, 28.8, 60, 0.6); p.seg(34.5, 24, 35.2, 60, 0.6); } },
        ],
      },
    ];
    if (d.b === 0) out.push({ id: 'knee', slot: 'trim', prof: 'round', z: 3, draw: (p) => { p.disc(21, 38, 4.6); p.disc(43, 38, 4.6); } });
    if (d.gem) out.push(gemAt(32, 8.5, 3));
    if (d.rune) out.push({ id: 'rune', slot: 'aura', prof: 'glow', z: 4, thin: true, draw: (p) => { p.disc(21, 50, 1.3); p.disc(43, 50, 1.3); } });
    return out;
  },
};

const boots: Arch = {
  jp: '靴', en: 'Boots', cat: '防具', handheld: false,
  A: ['長靴', '具足', '翼靴'], B: ['素', '拍車'],
  build(d) {
    const out: PartSpec[] = [
      { id: 'boot', slot: 'main', prof: 'flat', z: 1, draw: (p) => { p.rect(16, 2, 48, 36); p.rect(6, 34, 48, 56); p.disc(13, 45, 11); p.rect(44, 34, 58, 44); }, details: d.a === 1 ? [{ delta: 1, draw: (p) => p.rect(16, 19, 48, 24) }] : undefined },
      { id: 'cuff', slot: 'trim', prof: 'flat', z: 2, draw: (p) => p.rect(16, 2, 48, 10) },
      { id: 'sole', slot: 'grip', prof: 'flat', z: 2, draw: (p) => p.rect(6, 51, 48, 57) },
    ];
    if (d.a === 1) out.push({ id: 'toe', slot: 'trim', prof: 'round', z: 3, draw: (p) => p.disc(12.5, 45.5, 7) });
    if (d.a === 2) out.push({ id: 'wing', slot: 'trim', prof: 'flat', z: 0, draw: (p) => p.poly([[46, 12], [61, 3], [59, 13], [63, 15], [48, 25]]) });
    if (d.b === 1) out.push({ id: 'spur', slot: 'trim', prof: 'cyl', z: 3, draw: (p) => { p.seg(48, 44, 56, 50, 1.4); p.disc(57, 51, 2.2); } });
    if (d.gem) out.push(gemAt(32, 6, 2.6));
    if (d.rune) out.push({ id: 'rune', slot: 'aura', prof: 'glow', z: 4, thin: true, draw: (p) => { p.disc(26, 28, 1.3); p.disc(38, 28, 1.3); } });
    return out;
  },
};

/* A shield is built from a silhouette, a raised rim and an inlaid heraldic field.
 * The core can be fused, paired or orbital; decoration stays around the field
 * so random seeds create a crest rather than a featureless colored blob. */
const shield: Arch = {
  jp: '盾', en: 'Shield', cat: '武器', handheld: true,
  A: ['heater', 'kite', 'round', 'tower', 'winged'],
  B: ['融合核', '双核', '三元素', '日輪', '紋章'],
  build(d) {
    const silhouette: number[][][] = [
      [[13, 4], [51, 4], [55, 36], [50, 48], [32, 61], [14, 48], [9, 36]],
      [[12, 4], [52, 4], [51, 34], [43, 49], [32, 61], [21, 49], [13, 34]],
      [[32, 3], [45, 7], [55, 18], [57, 33], [51, 47], [40, 57], [32, 61], [24, 57], [13, 47], [7, 33], [9, 18], [19, 7]],
      [[10, 3], [54, 3], [54, 48], [32, 61], [10, 48]],
      [[14, 5], [50, 5], [58, 24], [53, 43], [32, 61], [11, 43], [6, 24]],
    ];
    const outline = silhouette[d.a];
    const center = outline.reduce(([sx, sy], [x, y]) => [sx + x / outline.length, sy + y / outline.length], [0, 0]);
    const inset = outline.map(([x, y]) => [center[0] + (x - center[0]) * 0.82, center[1] + (y - center[1]) * 0.82]);
    const field = outline.map(([x, y]) => [center[0] + (x - center[0]) * 0.72, center[1] + (y - center[1]) * 0.72]);
    const out: PartSpec[] = [
      {
        id: 'shield', slot: 'main', prof: 'flat', pat: d.a === 2 ? 'rivets' : 'scales', z: 1,
        draw: (p) => p.poly(outline),
        details: [{ delta: 1, draw: (p) => p.poly(inset) }],
      },
      { id: 'rim', slot: 'trim', prof: 'cyl', z: 2, draw: (p) => p.line([...inset, inset[0]], lerp(1.4, 2.4, d.wid)) },
      { id: 'field', slot: 'trim', prof: 'flat', pat: d.a === 4 ? 'scales' : 'none', z: 3, draw: (p) => p.poly(field) },
    ];

    // A raised fork/crosspiece gives the field a heraldic frame instead of one big empty center.
    if (d.b === 4) {
      out.push({ id: 'crest', slot: 'gem', prof: 'facet', z: 6, seeds: [[32, 17], [24, 26], [40, 26]], draw: (p) => p.poly([[32, 10], [42, 23], [32, 20], [22, 23]]) });
      out.push({ id: 'wings', slot: 'trim', prof: 'flat', z: 5, draw: (p) => { p.poly([[13, 24], [27, 28], [23, 34], [12, 31]]); p.poly([[51, 24], [37, 28], [41, 34], [52, 31]]); } });
    } else if (d.b === 3) {
      out.push({ id: 'sun', slot: 'trim', prof: 'flat', z: 4, draw: (p) => p.poly(starPts(32, 31, 19, 15, 12, -90)) });
    } else {
      // beveled cross arms connect the central setting to the shield rim
      out.push({ id: 'crossbar', slot: 'trim', prof: 'flat', z: 4, draw: (p) => { p.poly([[29, 14], [35, 14], [35, 49], [29, 49]]); p.poly([[15, 28], [49, 28], [49, 34], [15, 34]]); } });
    }

    if (d.b === 0) {
      out.push({ id: 'core', slot: 'gem', prof: 'facet', z: 7, seeds: [[32, 22], [26, 30], [38, 30], [32, 38]], draw: (p) => p.poly([[32, 18], [42, 30], [32, 42], [22, 30]]) });
      out.push({ id: 'core_shine', slot: 'aura', prof: 'glow', z: 8, thin: true, draw: (p) => p.poly([[32, 22], [38, 30], [32, 31], [27, 29]]) });
    } else if (d.b === 1) {
      out.push({ id: 'core_left', slot: 'gem', prof: 'facet', z: 7, seeds: [[27, 28], [22, 32]], draw: (p) => p.poly([[27, 22], [34, 30], [27, 38], [20, 30]]) });
      out.push({ id: 'core_right', slot: 'aura', prof: 'facet', z: 7, seeds: [[37, 28], [42, 32]], draw: (p) => p.poly([[37, 22], [44, 30], [37, 38], [30, 30]]) });
      out.push({ id: 'core_fuse', slot: 'gem', prof: 'glow', z: 8, thin: true, draw: (p) => p.disc(32, 30, 2.4) });
    } else if (d.b === 2) {
      for (let i = 0; i < 3; i++) {
        const t = (i * Math.PI * 2) / 3 - Math.PI / 2;
        const x = 32 + Math.cos(t) * 9;
        const y = 30 + Math.sin(t) * 9;
        out.push({ id: `element_${i}`, slot: i === 1 ? 'aura' : 'gem', prof: 'facet', z: 7 + i, thin: true, draw: (p) => p.poly([[x, y - 5], [x + 4.5, y], [x, y + 5], [x - 4.5, y]]) });
      }
      out.push({ id: 'core_merge', slot: 'gem', prof: 'glow', z: 9, thin: true, draw: (p) => p.disc(32, 30, 2.4) });
    } else {
      out.push({ id: 'orbit', slot: 'trim', prof: 'round', z: 6, draw: (p) => p.ring(32, 30, 14, 12.4) });
      const cores = d.coreMode === 3 ? 6 : d.coreMode === 2 ? 3 : 2;
      for (let i = 0; i < cores; i++) {
        const t = (i * Math.PI * 2) / cores - Math.PI / 2;
        const x = 32 + Math.cos(t) * 9;
        const y = 30 + Math.sin(t) * 9;
        out.push({ id: `orb_${i}`, slot: i % 2 ? 'aura' : 'gem', prof: 'facet', z: 7 + i, thin: true, draw: (p) => p.disc(x, y, cores > 3 ? 2.5 : 3.6) });
      }
      out.push({ id: 'core_center', slot: 'gem', prof: 'glow', z: 10, thin: true, draw: (p) => p.disc(32, 30, 3) });
    }

    // Four corner studs and asymmetric pennants break the perfect-circle silhouette.
    if (d.a !== 2) {
      out.push({ id: 'studs', slot: 'trim', prof: 'round', z: 6, thin: true, draw: (p) => { p.disc(18, 13, 1.6); p.disc(46, 13, 1.6); p.disc(17, 41, 1.6); p.disc(47, 41, 1.6); } });
    }
    if (d.a === 4 || d.orn > 0.72) {
      out.push({ id: 'plume', slot: 'aura', prof: 'glow', z: 0, thin: true, draw: (p) => { p.poly([[16, 6], [4, 1], [8, 16], [16, 12]]); p.poly([[48, 6], [60, 1], [56, 16], [48, 12]]); } });
    }
    if (d.gem && d.b !== 0) out.push(gemAt(32, 30, 2.6, 11));
    if (d.rune) {
      out.push({ id: 'runes', slot: 'aura', prof: 'glow', z: 11, thin: true, draw: (p) => { for (const x of [22, 28, 36, 42]) p.disc(x, 48 - Math.abs(x - 32) * 0.25, 1); } });
    }
    return out;
  },
};

/* ---------------------------------- items ---------------------------------- */

const book: Arch = {
  jp: '魔導書', en: 'Book', cat: '道具', handheld: false,
  A: ['菱紋', '円紋', '星紋'], B: ['留め金', '無'],
  build(d) {
    const out: PartSpec[] = [
      { id: 'pages', slot: 'aura', prof: 'flat', pat: 'pages', z: 0, draw: (p) => p.rect(49, 8, 55, 56) },
      { id: 'cover', slot: 'main', prof: 'flat', z: 1, draw: (p) => p.rect(10, 5, 50, 59), details: d.a === 1 ? [{ delta: -2, draw: (p) => p.ring(31, 32, 11, 9.6) }] : undefined },
      { id: 'spine', slot: 'grip', prof: 'cyl', axis: [0, 1], z: 2, draw: (p) => p.rect(8, 5, 16, 59) },
      { id: 'corner', slot: 'trim', prof: 'flat', z: 3, draw: (p) => { p.poly([[50, 5], [41, 5], [50, 14]]); p.poly([[50, 59], [41, 59], [50, 50]]); p.poly([[14, 5], [21, 5], [14, 12]]); p.poly([[14, 59], [21, 59], [14, 52]]); } },
    ];
    const em = d.a === 1 ? (p: Pen) => p.disc(31, 32, 7.5) : d.a === 2 ? (p: Pen) => p.poly(starPts(31, 32, 10, 4.5, 5)) : (p: Pen) => p.poly([[31, 18], [41, 32], [31, 46], [21, 32]]);
    out.push({ id: 'emblem', slot: 'gem', prof: 'facet', z: 4, draw: em });
    if (d.b === 0) out.push({ id: 'clasp', slot: 'trim', prof: 'flat', z: 5, draw: (p) => p.rect(46, 28, 55, 36) });
    return out;
  },
};

const gem: Arch = {
  jp: '宝石', en: 'Gem', cat: '道具', handheld: false,
  A: ['ブリリアント', 'ステップ', '結晶群'], B: ['素', '核光'],
  build(d) {
    const out: PartSpec[] = [];
    if (d.a === 1)
      out.push({
        id: 'stone', slot: 'main', prof: 'facet', z: 1,
        seeds: [[32, 32], [32, 13], [51, 32], [32, 51], [13, 32], [18, 18], [46, 18], [46, 46], [18, 46]],
        draw: (p) => p.poly([[18, 8], [46, 8], [56, 18], [56, 46], [46, 56], [18, 56], [8, 46], [8, 18]]),
        details: [{ delta: 1, draw: (p) => p.line([[22, 16], [42, 16], [48, 22], [48, 42], [42, 48], [22, 48], [16, 42], [16, 22], [22, 16]], 0.7) }],
      });
    else if (d.a === 2)
      out.push({
        id: 'stone', slot: 'main', prof: 'facet', z: 1,
        seeds: [[13, 40], [20, 40], [27, 30], [37, 30], [44, 44], [51, 44], [16, 22], [32, 8], [48, 28]],
        draw: (p) => { p.poly([[10, 58], [8, 30], [16, 18], [24, 30], [24, 58]]); p.poly([[22, 58], [22, 16], [32, 2], [42, 16], [42, 58]]); p.poly([[40, 58], [40, 34], [48, 24], [56, 34], [54, 58]]); },
      });
    else
      out.push({
        id: 'stone', slot: 'main', prof: 'facet', z: 1,
        seeds: [[32, 16], [22, 15], [42, 15], [14, 25], [50, 25], [32, 30], [24, 40], [40, 40], [32, 50]],
        draw: (p) => p.poly([[20, 9], [44, 9], [57, 25], [32, 59], [7, 25]]),
        details: [{ delta: 1, draw: (p) => p.seg(8, 25, 56, 25, 0.8) }],
      });
    if (d.b === 1 || d.rune) out.push({ id: 'core', slot: 'aura', prof: 'glow', z: 3, thin: true, draw: (p) => p.disc(32, d.a === 0 ? 27 : 32, 3.2) });
    return out;
  },
};

const orb: Arch = {
  jp: '宝珠', en: 'Orb', cat: '道具', handheld: false,
  A: ['宝珠', '魔眼', '真珠'], B: ['素', '台座'],
  build(d) {
    const cy = d.b === 1 ? 29 : 32;
    const R = d.b === 1 ? 24 : 26.5;
    const out: PartSpec[] = [];
    if (d.a === 1) {
      out.push({ id: 'sclera', slot: 'main', prof: 'round', z: 1, draw: (p) => p.disc(32, cy, R) });
      out.push({ id: 'iris', slot: 'gem', prof: 'round', z: 2, draw: (p) => p.disc(32, cy, R * 0.48), details: [{ delta: -9, draw: (p) => p.disc(32, cy, R * 0.17) }] });
    } else if (d.a === 2) {
      out.push({ id: 'pearl', slot: 'main', prof: 'round', z: 1, draw: (p) => p.disc(32, cy, R), details: [{ delta: -1, draw: (p) => { const pts: number[][] = []; for (let i = 0; i <= 20; i++) { const t = i / 20; const a = t * Math.PI * 2.2; pts.push([32 + Math.cos(a) * R * 0.65 * t, cy + Math.sin(a) * R * 0.65 * t]); } p.line(pts, 0.9); } }] });
    } else {
      out.push({ id: 'orb', slot: 'main', prof: 'round', z: 1, draw: (p) => p.disc(32, cy, R), details: [{ delta: 1, draw: (p) => p.ring(32, cy, R * 0.74, R * 0.66) }] });
      out.push({ id: 'core', slot: 'aura', prof: 'glow', z: 2, draw: (p) => p.disc(32, cy, R * 0.27) });
    }
    if (d.b === 1) out.push({ id: 'stand', slot: 'trim', prof: 'flat', z: 3, draw: (p) => { p.poly([[16, 60], [48, 60], [42, 48], [22, 48]]); p.seg(23, 50, 14, 38, 2); p.seg(41, 50, 50, 38, 2); } });
    if (d.gem && d.a !== 1) out.push(gemAt(32, cy, 3.4));
    return out;
  },
};

const star: Arch = {
  jp: '星', en: 'Star', cat: '道具', handheld: false,
  A: ['四芒', '五芒', '八芒'], B: ['素', '核'],
  build(d) {
    const k = [4, 5, 8][d.a];
    const R = 30;
    const r = [10.5, 12.5, 17][d.a];
    const seeds: number[][] = [[32, 32]];
    for (let i = 0; i < k; i++) {
      const th = ((-90 + (i * 360) / k) * Math.PI) / 180;
      for (const s of [-1, 1]) {
        const t2 = th + s * 0.16;
        seeds.push([32 + Math.cos(t2) * R * 0.52, 32 + Math.sin(t2) * R * 0.52]);
      }
    }
    const out: PartSpec[] = [{
      id: 'star', slot: 'main', prof: 'facet', z: 1, seeds, thin: true,
      draw: (p) => { p.poly(starPts(32, 32, R, r, k)); if (d.a === 0) p.poly(starPts(32, 32, 17, 9, 4, -45)); },
    }];
    if (d.b === 1 || d.gem) out.push({ id: 'core', slot: d.gem ? 'gem' : 'aura', prof: d.gem ? 'facet' : 'glow', z: 2, thin: true, draw: (p) => p.disc(32, 32, 5.5) });
    return out;
  },
};

const ingot: Arch = {
  jp: '素材', en: 'Material', cat: '道具', handheld: false,
  A: ['延べ棒', '塊', '欠片'], B: ['素', '埋め石'],
  build(d) {
    const out: PartSpec[] = [];
    if (d.a === 1) out.push({ id: 'nugget', slot: 'main', prof: 'round', z: 1, draw: (p) => { p.disc(24, 36, 14); p.disc(40, 32, 13); p.disc(34, 44, 12); p.disc(30, 24, 9); } });
    else if (d.a === 2) out.push({ id: 'shard', slot: 'main', prof: 'facet', z: 1, seeds: [[20, 22], [34, 16], [16, 44], [30, 36], [46, 36], [36, 52]], draw: (p) => p.poly([[14, 56], [8, 30], [26, 6], [44, 18], [56, 44], [36, 58]]) });
    else
      out.push({
        id: 'bar', slot: 'main', prof: 'flat', z: 1, draw: (p) => p.poly([[6, 30], [36, 14], [58, 24], [58, 34], [28, 50], [6, 40]]),
        details: [
          { delta: 1, draw: (p) => p.poly([[6, 30], [36, 14], [58, 24], [28, 40]]) },
          { delta: -1, draw: (p) => p.poly([[6, 30], [28, 40], [28, 50], [6, 40]]) },
        ],
      });
    if (d.b === 1 || d.gem) out.push(gemAt(34, 30, 4));
    return out;
  },
};

const coin: Arch = {
  jp: '貨幣', en: 'Coin', cat: '道具', handheld: false,
  A: ['星', '王冠', '髑髏'], B: ['縁', '無'],
  build(d) {
    const em: Detail[] =
      d.a === 1
        ? [{ delta: -1, draw: (p) => p.poly([[18, 40], [18, 24], [24, 32], [32, 20], [40, 32], [46, 24], [46, 40]]) }]
        : d.a === 2
          ? [{ delta: -1, draw: (p) => { p.disc(32, 29, 10); p.rect(26, 34, 38, 42); } }, { delta: -2, draw: (p) => { p.disc(28, 29, 2.6); p.disc(36, 29, 2.6); } }]
          : [{ delta: -1, draw: (p) => p.poly(starPts(32, 32, 14, 6, 5)) }];
    const rim: Detail[] = d.b === 0 ? [{ delta: 1, draw: (p) => p.ring(32, 32, 27.5, 23.5) }, { delta: -1, draw: (p) => p.ring(32, 32, 23.5, 22) }] : [];
    const out: PartSpec[] = [{ id: 'coin', slot: 'main', prof: 'round', z: 1, draw: (p) => p.disc(32, 32, 27), details: [...rim, ...em] }];
    if (d.gem) out.push(gemAt(32, 32, 4));
    return out;
  },
};

const potion: Arch = {
  jp: '霊薬', en: 'Potion', cat: '道具', handheld: false,
  A: ['丸瓶', '長瓶', '三角瓶'], B: ['素', '泡'],
  build(d) {
    const shape = (p: Pen) => {
      if (d.a === 1) { p.poly([[22, 22], [42, 22], [44, 58], [20, 58]]); p.rect(27, 8, 37, 24); }
      else if (d.a === 2) { p.poly([[26, 22], [38, 22], [55, 58], [9, 58]]); p.rect(27, 8, 37, 24); }
      else { p.disc(32, 40, 19); p.rect(26, 10, 38, 26); p.poly([[26, 24], [38, 24], [42, 30], [22, 30]]); }
    };
    const top = d.a === 2 ? 38 : 35;
    return [
      { id: 'glass', slot: 'main', prof: 'round', z: 1, draw: shape },
      { id: 'liquid', slot: 'aura', prof: 'glow', z: 2, draw: shape, cut: (p) => p.rect(-20, -20, 84, top), details: d.b === 1 ? [{ delta: 2, draw: (p) => { p.disc(28, 47, 1.7); p.disc(36, 51, 1.3); p.disc(33, 42, 1.1); } }] : undefined },
      { id: 'cork', slot: 'grip', prof: 'flat', z: 3, draw: (p) => p.rect(26, 2, 38, 9) },
      { id: 'lip', slot: 'trim', prof: 'flat', z: 4, draw: (p) => p.rect(24.5, 8, 39.5, 12) },
    ];
  },
};

/* ------------------------- mechanical / modern arms ------------------------- */

/** Chainsaw: engine block at the butt, guide bar out to the tip, teeth on both
 *  edges. The teeth are a separate thin part so they survive the downsample. */
const chainsaw: Arch = {
  jp: 'チェーンソー', en: 'Chainsaw', cat: '武器', handheld: true,
  A: ['標準', '重機', '鬼歯'],
  B: ['直バー', '反りバー'],
  build(d) {
    const barLen = lerp(20, 28, d.len);
    const barW = lerp(3.2, 4.4, d.wid);
    // the bar root sits *inside* the engine block (which starts at a = -4)
    const a0 = -7;
    const a1 = a0 + barLen + 5;
    const curve = d.b === 1 ? 2.4 : 0;
    const off = (t: number) => curve * Math.sin(t * Math.PI);
    const S = 14;
    const up: number[][] = [];
    const dn: number[][] = [];
    for (let i = 0; i <= S; i++) {
      const t = i / S;
      const a = a0 + (a1 - a0) * t;
      const w = barW * (1 - 0.22 * t);
      up.push(P(a, off(t) - w));
      dn.push(P(a, off(t) + w));
    }
    const out: PartSpec[] = [
      {
        id: 'bar', slot: 'main', prof: 'flat', axis: DIAG, z: 2,
        draw: (p) => p.poly([...up, P(a1 + barW * 1.1, off(1)), ...dn.reverse()]),
        details: [
          { delta: -2, draw: (p) => { const g: number[][] = []; for (let i = 0; i <= S; i++) { const t = i / S; g.push(P(a0 + (a1 - a0) * t, off(t))); } p.line(g, 0.9); } },
          { delta: 1, draw: (p) => { const g: number[][] = []; for (let i = 0; i <= S; i++) { const t = i / S; g.push(P(a0 + (a1 - a0) * t, off(t) - barW * 0.55)); } p.line(g, 0.7); } },
        ],
      },
      {
        id: 'teeth', slot: 'trim', prof: 'blade', pat: 'teeth', axis: DIAG, z: 3, thin: true,
        draw: (p) => {
          const k = d.a === 2 ? 9 : 7;
          const big = d.a === 2 ? 3.4 : 2.5;
          for (let i = 0; i < k; i++) {
            // skip the first slot — that part of the bar is buried in the engine
            const t = 0.12 + (0.88 * (i + 0.5)) / k;
            const a = a0 + (a1 - a0) * t;
            const w = barW * (1 - 0.22 * t);
            p.poly([P(a - 1.1, off(t) - w), P(a + 1.7, off(t) - w - big), P(a + 1.7, off(t) - w + 0.4)]);
            p.poly([P(a + 1.1, off(t) + w), P(a - 1.7, off(t) + w + big), P(a - 1.7, off(t) + w - 0.4)]);
          }
        },
      },
    ];
    const eW = lerp(7, 9.5, d.wid) * (d.a === 1 ? 1.22 : 1);
    out.push({
      id: 'engine', slot: 'trim', prof: 'flat', pat: 'vents', axis: ANTI, z: 4,
      draw: (p) => p.poly([P(-4, -eW), P(-4, eW), P(-19, eW * 0.86), P(-21, -eW * 0.86)]),
      details: [
        { delta: 1, draw: (p) => p.seg(...P(-8, -eW * 0.62), ...P(-8, eW * 0.62), 1.1) },
        { delta: -1, draw: (p) => p.seg(...P(-14, -eW * 0.7), ...P(-14, eW * 0.7), 0.9) },
      ],
    });
    out.push({
      id: 'handle', slot: 'grip', prof: 'cyl', pat: 'knurl', axis: DIAG, z: 5,
      draw: (p) => p.line([P(-19, -eW * 0.9), P(-16, -eW - 5.5), P(-7, -eW - 5.5), P(-4, -eW * 0.8)], 1.8),
    });
    out.push({ id: 'grip', slot: 'grip', prof: 'cyl', pat: 'wrap', axis: DIAG, z: 4, draw: (p) => p.seg(...P(-21, 2.5), ...P(-30, 7), 2.7) });
    out.push({
      id: 'exhaust', slot: 'trim', prof: 'round', z: 5,
      draw: (p) => { p.disc(...P(-17, eW * 0.72), 2.3); p.disc(...P(-12, eW * 0.84), 1.7); },
    });
    if (d.gem) out.push(gemAt(...P(-13, -2), 2.4, 6));
    if (d.rune) out.push(runes(a0 + 4, a1 - 4, 3, 0, 0.9));
    return out;
  },
};

/** Firearm: barrel + receiver + grip + magazine, with optional optic and stock. */
const gun: Arch = {
  jp: '銃', en: 'Gun', cat: '武器', handheld: true,
  A: ['拳銃', '長銃', '散弾', '重砲'],
  B: ['素', '照準器'],
  build(d) {
    const len = [14, 28, 21, 24][d.a];
    const cal = lerp(2.2, 3.2, d.wid) * (d.a === 3 ? 1.45 : 1);
    const a0 = -6;
    const a1 = a0 + len * lerp(0.86, 1.1, d.len);
    const top = -1.5 - cal;
    const out: PartSpec[] = [
      {
        id: 'barrel', slot: 'main', prof: 'cyl', axis: DIAG, z: 2,
        draw: (p) => p.seg(...P(a0, -1.5), ...P(a1, -1.5), cal),
        details: [{ delta: 1, draw: (p) => p.seg(...P(a0 + 2, top + cal * 0.45), ...P(a1 - 1, top + cal * 0.45), 0.7) }],
      },
      {
        id: 'muzzle', slot: 'trim', prof: 'cyl', axis: ANTI, z: 3,
        draw: (p) => { p.seg(...P(a1 - 1.6, top - 0.9), ...P(a1 - 1.6, -1.5 + cal + 0.9), 1.5); if (d.a === 3) p.ring(...P(a1 - 0.5, -1.5), cal + 1.7, cal + 0.2); },
      },
      {
        id: 'receiver', slot: 'main', prof: 'flat', pat: 'vents', axis: DIAG, z: 3,
        draw: (p) => p.poly([P(a0 + 2, top - 1), P(a0 + 2, 4.5), P(-15, 5.5), P(-15, top - 1.5)]),
        details: [{ delta: -1, draw: (p) => p.seg(...P(-13, top), ...P(a0, top), 0.8) }],
      },
      { id: 'grip', slot: 'grip', prof: 'cyl', pat: 'knurl', axis: [0, 1], z: 4, draw: (p) => p.poly([P(-12, 4.5), P(-17, 5.5), P(-22, 15), P(-16, 16)]) },
      { id: 'mag', slot: 'trim', prof: 'flat', z: 3, draw: (p) => p.poly([P(-5, 4.5), P(-11, 5.5), P(-13, 14), P(-7, 13)]) },
      { id: 'trigger', slot: 'trim', prof: 'cyl', z: 4, thin: true, draw: (p) => p.line([P(-4, 5.5), P(-3, 9.5), P(-9, 11.5), P(-13, 8.5)], 1.05) },
    ];
    if (d.b === 1)
      out.push({
        id: 'optic', slot: 'trim', prof: 'cyl', axis: DIAG, z: 5,
        draw: (p) => {
          p.seg(...P(a0 + 4, top - 3.6), ...P(a0 + 14, top - 3.6), 2.3);
          // mounts must start *inside* the barrel surface (b = top) or the
          // scope floats free once the mask is downsampled
          p.seg(...P(a0 + 5, top + 0.6), ...P(a0 + 5, top - 3.2), 1.05);
          p.seg(...P(a0 + 12, top + 0.6), ...P(a0 + 12, top - 3.2), 1.05);
        },
      });
    if (d.a === 1 || d.a === 3)
      out.push({ id: 'stock', slot: 'grip', prof: 'flat', pat: 'grain', z: 2, draw: (p) => p.poly([P(-15, -1), P(-15, 6), P(-28, 10.5), P(-31, 2)]) });
    if (d.gem) out.push(gemAt(...P(-10, 1.2), 2.2, 6));
    if (d.rune) out.push(runes(a0 + 4, a1 - 3, 3, top - 1.2, 0.9));
    return out;
  },
};

/** Railgun: parallel rails, accelerator coils, a glowing core between them. */
const railgun: Arch = {
  jp: 'レールガン', en: 'Railgun', cat: '武器', handheld: true,
  A: ['双レール', '三連', '環状', '収束'],
  B: ['素', '放熱翼'],
  build(d) {
    const len = lerp(24, 33, d.len);
    const a0 = -10;
    const a1 = a0 + len;
    const sep = lerp(4.4, 6.8, d.wid);
    const out: PartSpec[] = [
      {
        id: 'rails', slot: 'main', prof: 'cyl', pat: 'circuit', axis: DIAG, z: 3,
        draw: (p) => {
          p.seg(...P(a0, -sep), ...P(a1, -sep), 1.7);
          p.seg(...P(a0, sep), ...P(a1, sep), 1.7);
          if (d.a === 1) p.seg(...P(a0, 0), ...P(a1 - 2, 0), 1.3);
        },
      },
      { id: 'core', slot: 'aura', prof: 'glow', axis: DIAG, z: 2, draw: (p) => p.seg(...P(a0 + 2, 0), ...P(a1 - 2, 0), d.a === 3 ? sep * 0.78 : sep * 0.46) },
      {
        id: 'coils', slot: 'trim', prof: 'cyl', axis: ANTI, z: 4,
        draw: (p) => {
          const k = 4;
          for (let i = 0; i < k; i++) {
            const a = a0 + 4 + ((len - 9) * i) / (k - 1);
            if (d.a === 2) p.ring(...P(a, 0), sep + 2.3, sep + 0.7);
            else p.seg(...P(a, -sep - 2.5), ...P(a, sep + 2.5), 1.5);
          }
        },
      },
      {
        id: 'chassis', slot: 'trim', prof: 'flat', pat: 'vents', axis: DIAG, z: 2,
        draw: (p) => p.poly([P(a0, -sep - 2.2), P(a0, sep + 2.2), P(-24, sep + 4.4), P(-27, -sep - 4.4)]),
        details: [{ delta: 1, draw: (p) => p.seg(...P(-21, -sep - 2), ...P(-21, sep + 2), 0.9) }],
      },
      { id: 'grip', slot: 'grip', prof: 'cyl', pat: 'knurl', z: 4, draw: (p) => p.seg(...P(-22, sep + 3.2), ...P(-28, sep + 12), 2.7) },
      { id: 'aperture', slot: 'gem', prof: 'facet', z: 5, thin: true, draw: (p) => p.poly([P(a1 - 3, -sep * 0.72), P(a1 + 3.5, 0), P(a1 - 3, sep * 0.72), P(a1 - 1, 0)]) },
    ];
    if (d.b === 1)
      out.push({
        id: 'fins', slot: 'trim', prof: 'flat', z: 1,
        draw: (p) => {
          p.poly([P(-25, -sep - 3), P(-16, -sep - 11), P(-12, -sep - 8.5), P(-21, -sep - 2)]);
          p.poly([P(-25, sep + 3), P(-16, sep + 11), P(-12, sep + 8.5), P(-21, sep + 2)]);
        },
      });
    if (d.gem) out.push(gemAt(...P(-16, 0), 2.6, 6));
    if (d.rune) out.push(runes(a0 + 5, a1 - 5, 4, -sep - 3.2, 1));
    return out;
  },
};

/* ------------------------------ martial arms ------------------------------ */

/** Heavily ornamented spear: head, side prongs/crescents, langets, collar,
 *  rings or tassels or a banner, and a butt spike. */
const spear: Arch = {
  jp: '槍', en: 'Spear', cat: '武器', handheld: true,
  A: ['翼槍', '三叉', '月槍', '竜槍', '炎槍'],
  B: ['環飾', '房飾', '旗飾', '双環'],
  build(d) {
    const headLen = lerp(13, 19, d.len);
    const headW = lerp(3.2, 4.8, d.wid);
    const tip = 30;
    const hA = tip - headLen;
    const out: PartSpec[] = [
      { id: 'shaft', slot: 'grip', prof: 'cyl', pat: 'wrap', axis: DIAG, z: 1, draw: (p) => p.seg(...P(-29, 0), ...P(hA + 2, 0), lerp(1.7, 2.3, d.wid)) },
      {
        id: 'langet', slot: 'trim', prof: 'cyl', axis: DIAG, z: 2,
        draw: (p) => { p.seg(...P(hA - 9, -1.7), ...P(hA + 1, -1.7), 0.95); p.seg(...P(hA - 9, 1.7), ...P(hA + 1, 1.7), 0.95); },
      },
    ];
    const head = (() => {
      const S = 12;
      const u: number[][] = [];
      const v: number[][] = [];
      for (let i = 0; i <= S; i++) {
        const t = i / S;
        const a = hA + (tip - hA - 2.5) * t;
        let w = headW * (0.3 + 0.85 * Math.sin(Math.PI * Math.pow(t, 0.72)));
        if (d.a === 4) w *= 1 + 0.2 * Math.sin(t * Math.PI * 3);
        u.push(P(a, -w));
        v.push(P(a, w));
      }
      return [...u, P(tip, 0), ...v.reverse()];
    })();
    out.push({
      id: 'head', slot: 'main', prof: 'blade', axis: DIAG, z: 3,
      draw: (p) => p.poly(head),
      details: [
        { delta: -1, draw: (p) => p.seg(...P(hA + 2, 0), ...P(tip - 4, 0), 0.85) },
        { delta: 1, draw: (p) => p.seg(...P(hA + 3, -headW * 0.55), ...P(tip - 5, -headW * 0.3), 0.7) },
      ],
    });
    if (d.a === 1)
      out.push({
        id: 'prongs', slot: 'main', prof: 'blade', axis: DIAG, z: 3,
        // the prongs root into the collar (b ≈ ±2.5) before sweeping outward,
        // otherwise they float beside a head that is still narrow at its base
        draw: (p) => {
          p.poly([P(hA - 2, -2.6), P(hA + 3.5, -headW - 5.5), P(tip - 6, -headW - 5), P(hA + 6, -headW - 1), P(hA + 1, -2.2)]);
          p.poly([P(hA - 2, 2.6), P(hA + 3.5, headW + 5.5), P(tip - 6, headW + 5), P(hA + 6, headW + 1), P(hA + 1, 2.2)]);
        },
      });
    else if (d.a === 2)
      out.push({
        id: 'crescent', slot: 'main', prof: 'blade', axis: ANTI, z: 3,
        draw: (p) => { p.disc(...P(hA + 3.5, -headW - 4), 5.6); p.disc(...P(hA + 3.5, headW + 4), 5.6); },
        cut: (p) => { p.disc(...P(hA + 8, -headW - 5.5), 5.2); p.disc(...P(hA + 8, headW + 5.5), 5.2); },
      });
    else
      out.push({
        id: 'wings', slot: 'trim', prof: 'flat', z: 3,
        draw: (p) => { p.poly([P(hA - 1, -2), P(hA - 8, -8.5), P(hA - 1, -6.2)]); p.poly([P(hA - 1, 2), P(hA - 8, 8.5), P(hA - 1, 6.2)]); },
      });
    out.push({
      id: 'collar', slot: 'trim', prof: 'round', z: 4,
      draw: (p) => { p.disc(...P(hA - 2.5, 0), 3.3); p.seg(...P(hA - 6, -2.7), ...P(hA - 6, 2.7), 1.15); },
    });
    if (d.b === 0 || d.b === 3)
      out.push({
        id: 'rings', slot: 'trim', prof: 'cyl', z: 4, thin: true,
        draw: (p) => {
          p.ring(...P(hA - 9, -4.2), 2.7, 1.6);
          p.ring(...P(hA - 9, 4.2), 2.7, 1.6);
          if (d.b === 3) { p.ring(...P(hA - 15, -4), 2.3, 1.3); p.ring(...P(hA - 15, 4), 2.3, 1.3); }
        },
      });
    else if (d.b === 1)
      out.push({
        id: 'tassel', slot: 'aura', prof: 'cyl', axis: [0, 1], z: 4, thin: true,
        draw: (p) => { for (const o of [-2.6, 0, 2.6]) p.line([P(hA - 7, o), P(hA - 12, o * 1.7), P(hA - 16, o * 2.2)], 1.05); },
      });
    else
      // banner hangs off the shaft: its top edge starts inside the shaft radius
      out.push({ id: 'banner', slot: 'aura', prof: 'flat', z: 0, draw: (p) => p.poly([P(hA - 7, 1.2), P(hA - 21, 3.4), P(hA - 19, 13.5), P(hA - 6, 9.5)]) });
    out.push({ id: 'butt', slot: 'trim', prof: 'blade', axis: DIAG, z: 3, draw: (p) => p.poly([P(-27, -2.5), P(-27, 2.5), P(-32, 0)]) });
    if (d.gem) out.push(gemAt(...P(hA - 2.5, 0), 2.2, 6));
    if (d.rune) out.push(runes(hA + 3, tip - 5, 3));
    return out;
  },
};

/** Mace: flanged / spiked / star / block heads on a straight haft or a chain. */
const mace: Arch = {
  jp: 'メイス', en: 'Mace', cat: '武器', handheld: true,
  A: ['フランジ', '球棘', '星球', '重頭', '鎚'],
  B: ['直柄', '鎖'],
  build(d) {
    const hR = lerp(7.2, 10.5, d.wid);
    const hA = 17;
    const [cx, cy] = P(hA, 0);
    const shaftEnd = d.b === 1 ? 1 : hA - 4;
    const out: PartSpec[] = [
      { id: 'haft', slot: 'grip', prof: 'cyl', pat: 'wrap', axis: DIAG, z: 1, draw: (p) => p.seg(...P(-28, 0), ...P(shaftEnd, 0), lerp(2, 2.6, d.wid)) },
    ];
    if (d.b === 1)
      // the chain is load-bearing: it must physically bridge haft → head,
      // so it is a solid (non-thin) part whose links overlap each other
      out.push({
        id: 'chain', slot: 'trim', prof: 'cyl', axis: DIAG, z: 2,
        draw: (p) => { for (let i = 0; i < 4; i++) p.ring(...P(3 + i * 3.5, 0), 2.15, 1); },
      });
    if (d.a === 0 || d.a === 1)
      out.push({
        id: 'head', slot: 'main', prof: d.a === 0 ? 'blade' : 'round', z: 3,
        draw: (p) => {
          p.disc(cx, cy, hR * (d.a === 0 ? 0.56 : 0.72));
          const k = d.a === 0 ? 6 : 8;
          for (let i = 0; i < k; i++) {
            const t = (i / k) * Math.PI * 2 + 0.34;
            const nx = Math.cos(t);
            const ny = Math.sin(t);
            const px = -ny;
            const py = nx;
            const base = d.a === 0 ? 0.34 : 0.2;
            p.poly([
              [cx + nx * hR * 0.4 + px * hR * base, cy + ny * hR * 0.4 + py * hR * base],
              [cx + nx * hR, cy + ny * hR],
              [cx + nx * hR * 0.4 - px * hR * base, cy + ny * hR * 0.4 - py * hR * base],
            ]);
          }
        },
        details: [{ delta: 1, draw: (p) => p.disc(cx - hR * 0.22, cy - hR * 0.22, hR * 0.22) }],
      });
    else if (d.a === 2)
      out.push({
        id: 'head', slot: 'main', prof: 'facet', z: 3,
        seeds: [[cx, cy], [cx - hR * 0.5, cy - hR * 0.5], [cx + hR * 0.5, cy - hR * 0.4], [cx, cy + hR * 0.55]],
        draw: (p) => { p.poly(starPts(cx, cy, hR, hR * 0.45, 7, -90)); p.disc(cx, cy, hR * 0.42); },
      });
    else if (d.a === 3)
      out.push({
        id: 'head', slot: 'main', prof: 'round', pat: 'rivets', z: 3,
        draw: (p) => { p.disc(cx, cy, hR * 0.84); p.poly([P(hA - 6, -hR * 0.8), P(hA + 6, -hR * 0.8), P(hA + 6, hR * 0.8), P(hA - 6, hR * 0.8)]); },
        details: [{ delta: -1, draw: (p) => p.seg(...P(hA, -hR * 0.75), ...P(hA, hR * 0.75), 0.8) }],
      });
    else
      out.push({
        id: 'head', slot: 'main', prof: 'flat', pat: 'rivets', z: 3,
        draw: (p) => p.poly([P(hA - 7, -hR * 0.92), P(hA + 7, -hR * 0.78), P(hA + 7, hR * 0.78), P(hA - 7, hR * 0.92)]),
        details: [
          { delta: 1, draw: (p) => p.seg(...P(hA + 5.5, -hR * 0.7), ...P(hA + 5.5, hR * 0.7), 0.9) },
          { delta: -1, draw: (p) => p.seg(...P(hA - 5.5, -hR * 0.8), ...P(hA - 5.5, hR * 0.8), 0.9) },
        ],
      });
    out.push({ id: 'collar', slot: 'trim', prof: 'cyl', axis: ANTI, z: 4, draw: (p) => { p.seg(...P(hA - 8, -3), ...P(hA - 8, 3), 1.5); p.seg(...P(hA - 11, -2.6), ...P(hA - 11, 2.6), 1.2); } });
    out.push({ id: 'pommel', slot: 'trim', prof: 'round', z: 3, draw: (p) => { p.disc(...P(-29, 0), lerp(2.6, 3.4, d.wid)); p.seg(...P(-26, -2.6), ...P(-26, 2.6), 1) } });
    if (d.gem) out.push(gemAt(cx, cy, hR * 0.3, 6));
    if (d.rune) out.push(runes(-22, -6, 3));
    return out;
  },
};

/** Crossbow: horizontal prod, stock, string, and a loaded bolt. */
const crossbow: Arch = {
  jp: '弩', en: 'Crossbow', cat: '武器', handheld: true,
  A: ['標準', '重弩', '連弩'],
  B: ['素', '装填'],
  build(d) {
    const span = lerp(20, 27, d.wid);
    const pA = 13;
    const out: PartSpec[] = [];
    const limb: number[][] = [];
    const S = 14;
    for (let i = 0; i <= S; i++) {
      const u = -1 + (2 * i) / S;
      limb.push(P(pA - 5 * u * u, span * u));
    }
    out.push({
      id: 'prod', slot: 'main', prof: 'cyl', pat: 'grain', axis: ANTI, z: 3,
      draw: (p) => { for (let i = 1; i <= S; i++) p.seg(limb[i - 1][0], limb[i - 1][1], limb[i][0], limb[i][1], lerp(1.5, 2.5, 1 - Math.abs(-1 + (2 * i) / S))); },
    });
    out.push({ id: 'string', slot: 'aura', prof: 'flat', z: 2, thin: true, draw: (p) => (d.b === 1 ? p.line([limb[0], P(pA - 11, 0), limb[S]], 0.85) : p.line([limb[0], limb[S]], 0.85)) });
    out.push({
      id: 'stock', slot: 'grip', prof: 'flat', pat: 'grain', axis: DIAG, z: 2,
      draw: (p) => p.poly([P(pA + 2, -2.4), P(pA + 2, 2.4), P(-26, 4.2), P(-29, -2.6)]),
      details: [{ delta: -1, draw: (p) => p.seg(...P(pA, 0), ...P(-24, 1), 0.8) }],
    });
    out.push({ id: 'grip', slot: 'grip', prof: 'cyl', pat: 'knurl', z: 4, draw: (p) => p.seg(...P(-14, 3.4), ...P(-20, 11), 2.6) });
    out.push({ id: 'lock', slot: 'trim', prof: 'flat', z: 4, draw: (p) => { p.poly([P(-7, -3.2), P(-1, -3.2), P(-1, 3.6), P(-7, 3.6)]); p.line([P(-4, 4), P(-3, 8), P(-9, 9.5)], 1) } });
    if (d.b === 1)
      out.push({
        id: 'bolt', slot: 'trim', prof: 'blade', axis: DIAG, z: 5, thin: true,
        draw: (p) => { p.seg(...P(-11, 0), ...P(pA + 7, 0), 0.95); p.poly([P(pA + 5, -1.9), P(pA + 11, 0), P(pA + 5, 1.9)]); p.poly([P(-11, 0), P(-7, -2.4), P(-6, 0), P(-7, 2.4)]); },
      });
    // repeater magazine: rooted into the stock (b ≈ -2) so it stays attached
    if (d.a === 2) out.push({ id: 'magazine', slot: 'trim', prof: 'flat', z: 5, draw: (p) => p.poly([P(-2, -1.8), P(6, -1.8), P(6, -9.5), P(-2, -9.5)]) });
    out.push({ id: 'tips', slot: 'trim', prof: 'round', z: 4, thin: true, draw: (p) => { p.disc(limb[0][0], limb[0][1], 2.1); p.disc(limb[S][0], limb[S][1], 2.1); } });
    if (d.gem) out.push(gemAt(...P(pA - 3, 0), 2.3, 6));
    if (d.rune) out.push(runes(-18, 4, 3, -3.5, 0.95));
    return out;
  },
};

/* --------------------------- arcane & cursed arms --------------------------- */

/** Runeblade: a blade broken into floating segments over a glowing energy
 *  spine, with an orbiting rune ring or spectral wings at the guard. */
const runeblade: Arch = {
  jp: '魔刃', en: 'Runeblade', cat: '武器', handheld: true,
  A: ['分割刃', '結晶刃', '霊刃', '星刃'],
  B: ['環', '翼', '素'],
  build(d) {
    const L = lerp(25, 33, d.len);
    const W = lerp(3.4, 5.2, d.wid);
    const a0 = -7;
    const a1 = a0 + L;
    const segs = d.a === 0 ? 4 : d.a === 3 ? 5 : 3;
    const out: PartSpec[] = [
      { id: 'spine', slot: 'aura', prof: 'glow', axis: DIAG, z: 1, draw: (p) => p.seg(...P(a0 - 1, 0), ...P(a1 + 4, 0), W * 0.38) },
      {
        id: 'blade', slot: 'main', prof: 'blade', axis: DIAG, z: 2,
        draw: (p) => {
          for (let i = 0; i < segs; i++) {
            const t0 = i / segs;
            const t1 = (i + 0.76) / segs;
            const aa = a0 + (a1 - a0) * t0;
            const ab = a0 + (a1 - a0) * t1;
            const w0 = W * (1 - 0.28 * t0);
            const w1 = W * (1 - 0.28 * t1);
            if (d.a === 1) p.poly([P(aa, -w0), P(ab, -w1 * 0.66), P(ab + 1.4, 0), P(ab, w1 * 0.66), P(aa, w0)]);
            else if (d.a === 2) p.poly([P(aa, -w0 * 0.75), P(ab, -w1), P(ab, w1), P(aa, w0 * 0.75)]);
            else p.poly([P(aa, -w0), P(ab, -w1), P(ab, w1), P(aa, w0)]);
          }
          p.poly([P(a1 - 1, -W * 0.68), P(a1 + 4.5, 0), P(a1 - 1, W * 0.68)]);
        },
        details: [{ delta: 1, draw: (p) => p.seg(...P(a0 + 1, -W * 0.5), ...P(a1 - 2, -W * 0.3), 0.7) }],
      },
      { id: 'guard', slot: 'trim', prof: 'cyl', axis: ANTI, z: 4, draw: (p) => { p.seg(...P(a0 - 1, -W * 1.9), ...P(a0 - 1, W * 1.9), 1.7); p.disc(...P(a0 - 1, -W * 1.9), 1.9); p.disc(...P(a0 - 1, W * 1.9), 1.9); } },
      { id: 'grip', slot: 'grip', prof: 'cyl', pat: 'wrap', axis: DIAG, z: 2, draw: (p) => p.seg(...P(a0 - 2, 0), ...P(a0 - 12, 0), lerp(2, 2.6, d.wid)) },
      { id: 'pommel', slot: 'trim', prof: 'round', z: 3, draw: (p) => p.disc(...P(a0 - 14, 0), 3.2) },
    ];
    if (d.b === 0) {
      const [rx, ry] = P(a0 + L * 0.42, 0);
      out.push({ id: 'ring', slot: 'aura', prof: 'glow', z: 5, thin: true, draw: (p) => { p.ring(rx, ry, W * 2.6, W * 2.1); for (let i = 0; i < 4; i++) { const t = (i * Math.PI) / 2 + 0.4; p.disc(rx + Math.cos(t) * W * 2.35, ry + Math.sin(t) * W * 2.35, 1.3); } } });
    } else if (d.b === 1) {
      out.push({ id: 'wings', slot: 'aura', prof: 'glow', z: 1, thin: true, draw: (p) => { p.poly([P(a0 + 1, -W * 1.6), P(a0 - 7, -W * 4.4), P(a0 + 6, -W * 2.6)]); p.poly([P(a0 + 1, W * 1.6), P(a0 - 7, W * 4.4), P(a0 + 6, W * 2.6)]); } });
    }
    if (d.gem) out.push(gemAt(...P(a0 - 1, 0), 2.5, 6));
    if (d.rune) out.push(runes(a0 + 3, a1 - 3, segs, 0, 1.1));
    return out;
  },
};

/** Grimblade: asymmetric cursed/blood weapon — jagged spine, bone spurs, a
 *  watching eye and tendrils or dripping blood along the lower edge. */
const grimblade: Arch = {
  jp: '呪刃', en: 'Grimblade', cat: '武器', handheld: true,
  A: ['牙刃', '骨刃', '眼刃', '裂刃'],
  B: ['触手', '棘', '滴'],
  build(d) {
    const L = lerp(24, 32, d.len);
    const W = lerp(4, 6.2, d.wid);
    const a0 = -8;
    const a1 = a0 + L;
    const S = 16;
    const upper: number[][] = [];
    const lower: number[][] = [];
    for (let i = 0; i <= S; i++) {
      const t = i / S;
      const a = a0 + (a1 - a0) * t;
      // spine (upper) is jagged, belly (lower) swells then hooks
      const jag = d.a === 0 ? (i % 2 ? 1.5 : 0) : d.a === 3 ? 1.1 * Math.sin(t * Math.PI * 5) : 0;
      upper.push(P(a, -W * (0.45 + 0.35 * t) - jag));
      lower.push(P(a, W * (0.5 + 0.75 * Math.sin(Math.PI * Math.pow(t, 0.85)))));
    }
    const out: PartSpec[] = [
      {
        id: 'blade', slot: 'main', prof: 'blade', pat: d.a === 1 ? 'bone' : 'veins', axis: DIAG, z: 2,
        draw: (p) => p.poly([...upper, P(a1 + W * 1.1, -W * 0.35), ...lower.reverse()]),
        details: [
          { delta: -2, draw: (p) => { const g: number[][] = []; for (let i = 2; i <= S - 2; i++) { const t = i / S; g.push(P(a0 + (a1 - a0) * t, W * 0.12)); } p.line(g, 0.95); } },
          { delta: 1, draw: (p) => { const g: number[][] = []; for (let i = 1; i <= S - 1; i++) { const t = i / S; g.push(P(a0 + (a1 - a0) * t, W * (0.42 + 0.68 * Math.sin(Math.PI * Math.pow(t, 0.85))))); } p.line(g, 0.75); } },
        ],
      },
    ];
    if (d.a === 1)
      out.push({
        id: 'spurs', slot: 'trim', prof: 'blade', axis: DIAG, z: 3, thin: true,
        draw: (p) => { for (let i = 1; i < 5; i++) { const t = i / 5; const a = a0 + (a1 - a0) * t; const w = W * (0.45 + 0.35 * t); p.poly([P(a - 1.4, -w), P(a + 1.2, -w - 3.6), P(a + 2, -w + 0.4)]); } },
      });
    if (d.a === 2) {
      const [ex, ey] = P(a0 + L * 0.34, W * 0.1);
      out.push({ id: 'sclera', slot: 'gem', prof: 'round', z: 5, draw: (p) => p.disc(ex, ey, W * 0.72) });
      out.push({ id: 'pupil', slot: 'aura', prof: 'glow', z: 6, thin: true, draw: (p) => { p.disc(ex, ey, W * 0.3); p.poly([[ex, ey - W * 0.6], [ex + W * 0.16, ey], [ex, ey + W * 0.6], [ex - W * 0.16, ey]]); } });
    }
    out.push({
      id: 'guard', slot: 'trim', prof: 'cyl', axis: ANTI, z: 4,
      draw: (p) => { p.line([P(a0 + 4, -W * 2.2), P(a0 - 1, -W * 0.6), P(a0 - 1, W * 0.6), P(a0 + 3, W * 2.4)], 1.7); p.disc(...P(a0 + 4, -W * 2.2), 1.9); p.disc(...P(a0 + 3, W * 2.4), 1.9); },
    });
    out.push({ id: 'grip', slot: 'grip', prof: 'cyl', pat: 'wrap', axis: DIAG, z: 2, draw: (p) => p.seg(...P(a0 - 2, 0), ...P(a0 - 12, 0), lerp(2.1, 2.7, d.wid)) });
    out.push({ id: 'pommel', slot: 'trim', prof: 'facet', z: 3, draw: (p) => p.poly([P(a0 - 13, -3.2), P(a0 - 18, 0), P(a0 - 13, 3.2), P(a0 - 11, 0)]) });
    if (d.b === 0)
      out.push({
        id: 'tendrils', slot: 'aura', prof: 'glow', z: 1, thin: true,
        draw: (p) => { for (let i = 1; i <= 3; i++) { const t = i / 4; const a = a0 + (a1 - a0) * t; const w = W * (0.5 + 0.75 * Math.sin(Math.PI * Math.pow(t, 0.85))); p.line([P(a, w), P(a - 3, w + 4.5), P(a + 1.5, w + 8)], 1); } },
      });
    else if (d.b === 1)
      out.push({
        id: 'thorns', slot: 'trim', prof: 'blade', axis: DIAG, z: 3, thin: true,
        draw: (p) => { for (let i = 1; i <= 3; i++) { const t = i / 4; const a = a0 + (a1 - a0) * t; const w = W * (0.5 + 0.75 * Math.sin(Math.PI * Math.pow(t, 0.85))); p.poly([P(a - 1.5, w), P(a + 2.5, w + 5), P(a + 1.5, w - 0.4)]); } },
      });
    else
      out.push({
        id: 'drips', slot: 'aura', prof: 'glow', z: 1, thin: true,
        draw: (p) => { for (let i = 1; i <= 4; i++) { const t = i / 5; const a = a0 + (a1 - a0) * t; const w = W * (0.5 + 0.75 * Math.sin(Math.PI * Math.pow(t, 0.85))); p.seg(...P(a, w), ...P(a, w + 2.6 + (i % 2) * 2.4), 0.9); p.disc(...P(a, w + 4 + (i % 2) * 2.6), 1.35); } },
      });
    if (d.gem) out.push(gemAt(...P(a0 + 1, 0), 2.3, 7));
    if (d.rune) out.push(runes(a0 + 4, a1 - 4, 3, -W * 0.4, 1));
    return out;
  },
};

/* -------------------------------- tomes & relics -------------------------------- */

/** Magic circle: a ring of glyphs with radial ticks and an inscribed polygon.
 *  Drawn as a thin aura part so it reads as a glowing seal behind the object. */
function magicCircle(p: Pen, cx: number, cy: number, R: number, spokes: number, rot: number, inner: number) {
  p.ring(cx, cy, R, R - 1.1);
  p.ring(cx, cy, R * 0.82, R * 0.82 - 0.9);
  for (let i = 0; i < spokes; i++) {
    const t = rot + (i * Math.PI * 2) / spokes;
    const c = Math.cos(t), s = Math.sin(t);
    p.seg(cx + c * (R * 0.83), cy + s * (R * 0.83), cx + c * (R - 1), cy + s * (R - 1), 0.75);
    // glyph dots at the cardinal ticks
    if (i % 2 === 0) p.disc(cx + c * (R * 0.92), cy + s * (R * 0.92), 1.15);
  }
  if (inner > 0) {
    const k = Math.max(3, Math.round(inner * 6));
    const pts: number[][] = [];
    for (let i = 0; i < k; i++) {
      const t = rot * 0.5 + (i * Math.PI * 2) / k;
      pts.push([cx + Math.cos(t) * R * 0.66, cy + Math.sin(t) * R * 0.66]);
    }
    p.line([...pts, pts[0]], 0.8);
    if (k >= 5) {
      const inner2: number[][] = [];
      for (let i = 0; i < k; i++) {
        const t = rot * 0.5 + ((i + 0.5) * Math.PI * 2) / k;
        inner2.push([cx + Math.cos(t) * R * 0.42, cy + Math.sin(t) * R * 0.42]);
      }
      p.line([...inner2, inner2[0]], 0.7);
    }
  }
}

/** 魔導書 / Tome — a grimoire floating over (or under) an inscribed circle,
 *  with clasps, a raised emblem, and optionally chained pages or floating tabs. */
const tome: Arch = {
  jp: '魔導書', en: 'Tome', cat: '道具', handheld: true,
  A: ['封書', '開典', '浮典', '聖典', '死霊書'],
  B: ['魔法陣', '環状', '素'],
  build(d) {
    const cx = 32, cy = 32;
    const R = lerp(25, 30, d.wid);
    const out: PartSpec[] = [];
    // the circle sits behind everything when requested
    if (d.b === 0)
      out.push({
        id: 'circle', slot: 'aura', prof: 'glow', z: 0, thin: true,
        draw: (p) => magicCircle(p, cx, cy, R, d.a === 4 ? 5 : 8, 0.2, d.orn),
      });
    else if (d.b === 1)
      out.push({
        id: 'circle', slot: 'aura', prof: 'glow', z: 0, thin: true,
        draw: (p) => { p.ring(cx, cy, R, R - 1.2); for (let i = 0; i < 6; i++) { const t = (i * Math.PI) / 3 + 0.3; p.disc(cx + Math.cos(t) * R, cy + Math.sin(t) * R, 1.7); } },
      });

    const open = d.a === 1;
    const tilt = d.a === 2 ? 1 : 0;
    const gy = cy + (open ? 3 : 0) + tilt * -2;
    // page block sits behind the cover
    out.push({
      id: 'pages', slot: 'aura', prof: 'flat', pat: 'pages', z: 1,
      draw: (p) => {
        if (open) {
          p.poly([[cx - 27, gy + 15], [cx - 1, gy + 12], [cx - 1, gy + 22], [cx - 27, gy + 24]]);
          p.poly([[cx + 27, gy + 15], [cx + 1, gy + 12], [cx + 1, gy + 22], [cx + 27, gy + 24]]);
        } else {
          p.rect(cx + 19, gy - 17, cx + 25, gy + 21);
        }
      },
    });
    out.push({
      id: 'cover', slot: 'main', prof: 'flat', pat: d.a === 4 ? 'veins' : 'none', z: 2,
      draw: (p) => {
        if (open) {
          p.poly([[cx - 28, gy + 16], [cx - 1, gy + 11], [cx - 1, gy + 22], [cx - 28, gy + 26]]);
          p.poly([[cx + 28, gy + 16], [cx + 1, gy + 11], [cx + 1, gy + 22], [cx + 28, gy + 26]]);
        } else if (d.a === 3) {
          // ornate closed tome with a raised spine and chamfered corners
          p.poly([[cx - 23, gy - 22], [cx + 21, gy - 22], [cx + 23, gy - 19], [cx + 23, gy + 22], [cx + 21, gy + 24], [cx - 21, gy + 24], [cx - 23, gy + 21], [cx - 23, gy - 19]]);
        } else {
          p.rect(cx - 22, gy - 20, cx + 22, gy + 23);
        }
      },
      details: open
        ? [{ delta: -1, draw: (p) => p.seg(cx, gy + 11, cx, gy + 22, 0.9) }]
        : [
            { delta: 1, draw: (p) => p.seg(cx - 20, gy - 18, cx - 20, gy + 21, 0.8) },
            { delta: -1, draw: (p) => p.seg(cx - 17, gy - 18, cx - 17, gy + 21, 0.8) },
          ],
    });
    if (!open) {
      // spine
      out.push({ id: 'spine', slot: 'grip', prof: 'cyl', axis: [0, 1], z: 3, draw: (p) => p.rect(cx - 24, gy - 20, cx - 17, gy + 23) });
      // corner fittings
      out.push({
        id: 'fittings', slot: 'trim', prof: 'flat', z: 4,
        draw: (p) => {
          p.poly([[cx - 22, gy - 20], [cx - 14, gy - 20], [cx - 22, gy - 12]]);
          p.poly([[cx + 22, gy - 20], [cx + 14, gy - 20], [cx + 22, gy - 12]]);
          p.poly([[cx - 22, gy + 23], [cx - 14, gy + 23], [cx - 22, gy + 15]]);
          p.poly([[cx + 22, gy + 23], [cx + 14, gy + 23], [cx + 22, gy + 15]]);
        },
      });
      // clasp
      if (d.a !== 4) out.push({ id: 'clasp', slot: 'trim', prof: 'flat', z: 5, draw: (p) => p.rect(cx + 17, gy + 2, cx + 26, gy + 9) });
    }
    // the emblem on the cover: gem / sigil / skull / star
    const ey = gy + (open ? 16 : 0);
    if (d.a === 4) {
      out.push({ id: 'emblem', slot: 'gem', prof: 'facet', z: 5, draw: (p) => { p.disc(cx, ey, 7.5); p.rect(cx - 12, ey + 6, cx + 12, ey + 12); }, details: [{ delta: -2, draw: (p) => { p.disc(cx - 3, ey - 1, 1.9); p.disc(cx + 3, ey - 1, 1.9); } }] });
      out.push({ id: 'bones', slot: 'trim', prof: 'flat', z: 6, thin: true, draw: (p) => { p.seg(cx - 12, ey + 15, cx + 12, ey + 15, 1.05); } });
    } else if (d.a === 3) {
      out.push({ id: 'emblem', slot: 'gem', prof: 'facet', z: 5, draw: (p) => p.poly(starPts(cx, ey, 11, 5, 6, -90)) });
    } else if (d.a === 1) {
      out.push({ id: 'emblem', slot: 'gem', prof: 'facet', z: 5, draw: (p) => p.poly([[cx, ey - 8], [cx + 7, ey], [cx, ey + 8], [cx - 7, ey]]) });
    } else {
      out.push({ id: 'emblem', slot: 'gem', prof: 'facet', z: 5, draw: (p) => p.ring(cx, ey, 8.5, 6.2) });
      out.push({ id: 'emblem_core', slot: 'aura', prof: 'glow', z: 6, thin: true, draw: (p) => p.disc(cx, ey, 3.4) });
    }
    if (d.gem && d.a !== 4) out.push(gemAt(cx, ey, 3, 7));
    if (d.rune) out.push({ id: 'runes', slot: 'aura', prof: 'glow', z: 7, thin: true, draw: (p) => { p.disc(cx - 13, gy - 8, 1.25); p.disc(cx + 13, gy - 8, 1.25); p.disc(cx, gy + 20, 1.25); } });
    return out;
  },
};

/** レリック / Relic — an artifact: idol, crown, amulet, totem or vessel. These
 *  are deliberately non-weapon silhouettes so the forge covers the whole item
 *  space a SkyBlock pack needs. */
const relic: Arch = {
  jp: 'レリック', en: 'Relic', cat: '道具', handheld: false,
  A: ['偶像', '王冠', '護符', '聖杯', 'トーテム', '浮遊盤'],
  B: ['光背', '鎖飾', '素'],
  build(d) {
    const cx = 32, cy = 32;
    const out: PartSpec[] = [];

    // optional halo behind the artifact
    if (d.b === 0)
      out.push({
        id: 'halo', slot: 'aura', prof: 'glow', z: 0, thin: true,
        draw: (p) => magicCircle(p, cx, cy, lerp(26, 30, d.wid), 10, 0, d.orn * 0.6),
      });

    switch (d.a) {
      case 0: {
        // idol: a squat figure on a plinth
        out.push({ id: 'plinth', slot: 'trim', prof: 'flat', z: 2, draw: (p) => p.poly([[cx - 17, cy + 15], [cx + 17, cy + 15], [cx + 20, cy + 24], [cx - 20, cy + 24]]) });
        out.push({ id: 'body', slot: 'main', prof: 'round', z: 3, draw: (p) => { p.disc(cx, cy - 2, 15); p.poly([[cx - 14, cy + 10], [cx + 14, cy + 10], [cx + 17, cy + 18], [cx - 17, cy + 18]]); }, cut: (p) => { p.disc(cx - 6, cy - 8, 3); p.disc(cx + 6, cy - 8, 3); } });
        out.push({
          id: 'horns', slot: 'trim', prof: 'blade', z: 4,
          draw: (p) => {
            p.line([[cx - 12, cy - 12], [cx - 18, cy - 22], [cx - 22, cy - 20]], 1.9);
            p.line([[cx + 12, cy - 12], [cx + 18, cy - 22], [cx + 22, cy - 20]], 1.9);
          },
        });
        out.push({ id: 'aura_eye', slot: 'aura', prof: 'glow', z: 5, thin: true, draw: (p) => { p.disc(cx - 6, cy - 8, 1.6); p.disc(cx + 6, cy - 8, 1.6); } });
        break;
      }
      case 1: {
        // crown: band + fleur points + jewels
        out.push({ id: 'band', slot: 'main', prof: 'cyl', axis: [1, 0], z: 2, draw: (p) => p.rect(cx - 22, cy + 6, cx + 22, cy + 20) });
        out.push({
          id: 'points', slot: 'main', prof: 'facet', z: 3,
          draw: (p) => {
            p.poly([[cx - 22, cy + 6], [cx - 14, cy - 16], [cx - 6, cy + 6]]);
            p.poly([[cx - 8, cy + 6], [cx, cy - 22], [cx + 8, cy + 6]]);
            p.poly([[cx + 6, cy + 6], [cx + 14, cy - 16], [cx + 22, cy + 6]]);
          },
        });
        out.push({ id: 'base', slot: 'trim', prof: 'flat', z: 4, draw: (p) => p.rect(cx - 23, cy + 18, cx + 23, cy + 24) });
        out.push({ id: 'jewels', slot: 'gem', prof: 'facet', z: 5, draw: (p) => { p.disc(cx, cy + 13, 3.1); p.disc(cx - 14, cy + 13, 2.5); p.disc(cx + 14, cy + 13, 2.5); } });
        out.push({ id: 'tips', slot: 'aura', prof: 'glow', z: 6, thin: true, draw: (p) => { p.disc(cx, cy - 21, 1.6); p.disc(cx - 14, cy - 17, 1.4); p.disc(cx + 14, cy - 17, 1.4); } });
        break;
      }
      case 2: {
        // amulet: a gem set in an ornate frame on a cord
        out.push({ id: 'cord', slot: 'aura', prof: 'glow', z: 1, thin: true, draw: (p) => { const pts: number[][] = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([cx - 24 + 48 * t, cy - 20 + 26 * Math.sin(t * Math.PI) * 0.42 + Math.abs(t - 0.5) * 26]); } p.line(pts, 1.1); } });
        out.push({ id: 'frame', slot: 'trim', prof: 'round', z: 3, draw: (p) => p.ring(cx, cy + 2, 21, 15.5) });
        out.push({ id: 'gem', slot: 'gem', prof: 'facet', z: 4, draw: (p) => p.poly([[cx, cy - 14], [cx + 14, cy + 2], [cx, cy + 18], [cx - 14, cy + 2]]), seeds: [[cx, cy - 10], [cx + 8, cy + 2], [cx - 8, cy + 2], [cx, cy + 10]] });
        out.push({ id: 'rays', slot: 'trim', prof: 'flat', z: 2, draw: (p) => { for (let i = 0; i < 8; i++) { const t = (i * Math.PI) / 4 + 0.39; const c = Math.cos(t), s = Math.sin(t); p.seg(cx + c * 21.5, cy + 2 + s * 21.5, cx + c * 26, cy + 2 + s * 26, 1.15); } } });
        break;
      }
      case 3: {
        // chalice / vessel
        out.push({ id: 'cup', slot: 'main', prof: 'round', z: 2, draw: (p) => { p.poly([[cx - 19, cy - 18], [cx + 19, cy - 18], [cx + 12, cy + 4], [cx + 6, cy + 6], [cx + 6, cy + 18], [cx - 6, cy + 18], [cx - 6, cy + 6], [cx - 12, cy + 4]]); }, details: [{ delta: 1, draw: (p) => p.seg(cx - 17, cy - 16, cx + 17, cy - 16, 0.9) }] });
        out.push({ id: 'foot', slot: 'trim', prof: 'flat', z: 3, draw: (p) => p.poly([[cx - 17, cy + 18], [cx + 17, cy + 18], [cx + 20, cy + 23], [cx - 20, cy + 23]]) });
        out.push({ id: 'liquid', slot: 'aura', prof: 'glow', z: 1, draw: (p) => p.poly([[cx - 18, cy - 15], [cx + 18, cy - 15], [cx + 15, cy - 4], [cx - 15, cy - 4]]) });
        out.push({ id: 'handles', slot: 'trim', prof: 'cyl', z: 2, draw: (p) => { p.ring(cx - 22, cy - 8, 6, 3.6); p.ring(cx + 22, cy - 8, 6, 3.6); } });
        out.push({ id: 'rim', slot: 'trim', prof: 'cyl', axis: [1, 0], z: 4, draw: (p) => p.seg(cx - 19, cy - 18, cx + 19, cy - 18, 1.5) });
        break;
      }
      case 4: {
        // totem: stacked faces / masks
        out.push({ id: 'post', slot: 'main', prof: 'flat', z: 2, draw: (p) => p.poly([[cx - 12, cy - 24], [cx + 12, cy - 24], [cx + 14, cy + 24], [cx - 14, cy + 24]]) });
        out.push({
          id: 'faces', slot: 'main', prof: 'flat', pat: 'veins', z: 3,
          draw: (p) => { p.rect(cx - 13, cy - 22, cx + 13, cy - 8); p.rect(cx - 15, cy - 5, cx + 15, cy + 9); p.rect(cx - 13, cy + 12, cx + 13, cy + 23); },
          details: [
            { delta: -1, draw: (p) => { p.seg(cx - 8, cy - 18, cx - 3, cy - 18, 1); p.seg(cx + 3, cy - 18, cx + 8, cy - 18, 1); p.seg(cx - 10, cy - 1, cx + 10, cy - 1, 1); p.seg(cx - 8, cy + 17, cx + 8, cy + 17, 1); } },
            { delta: 1, draw: (p) => { p.seg(cx - 8, cy - 12, cx + 8, cy - 12, 1); p.seg(cx - 10, cy + 4, cx + 10, cy + 4, 1); } },
          ],
        });
        out.push({ id: 'crest', slot: 'trim', prof: 'blade', z: 4, draw: (p) => { p.poly([[cx - 12, cy - 24], [cx, cy - 32], [cx + 12, cy - 24]]); } });
        out.push({ id: 'eyes', slot: 'aura', prof: 'glow', z: 5, thin: true, draw: (p) => { p.rect(cx - 8, cy - 19, cx - 3, cy - 17); p.rect(cx + 3, cy - 19, cx + 8, cy - 17); p.rect(cx - 6, cy + 2, cx + 6, cy + 4); } });
        break;
      }
      default: {
        // floating disc / astrolabe
        out.push({ id: 'disc', slot: 'main', prof: 'flat', z: 2, draw: (p) => p.ring(cx, cy, 25, 21) });
        out.push({ id: 'plate', slot: 'main', prof: 'flat', z: 3, draw: (p) => p.disc(cx, cy, 19) });
        out.push({ id: 'teeth', slot: 'trim', prof: 'flat', z: 4, thin: true, draw: (p) => { for (let i = 0; i < 12; i++) { const t = (i * Math.PI) / 6; const c = Math.cos(t), s = Math.sin(t); p.seg(cx + c * 25, cy + s * 25, cx + c * 29, cy + s * 29, 1.1); } } });
        out.push({ id: 'orbit', slot: 'trim', prof: 'cyl', z: 5, draw: (p) => { p.ring(cx, cy, 14, 11.5); p.ring(cx, cy, 6.5, 4.5); } });
        out.push({ id: 'core', slot: 'aura', prof: 'glow', z: 6, thin: true, draw: (p) => p.disc(cx, cy, 3) });
        out.push({ id: 'needles', slot: 'gem', prof: 'facet', z: 7, thin: true, draw: (p) => { p.poly([[cx - 15, cy - 2], [cx - 4, cy], [cx - 15, cy + 2]]); p.poly([[cx + 15, cy - 2], [cx + 4, cy], [cx + 15, cy + 2]]); } });
        break;
      }
    }

    if (d.b === 1)
      out.push({
        id: 'chain', slot: 'trim', prof: 'cyl', z: 1, thin: true,
        draw: (p) => { for (let i = 0; i < 3; i++) { p.ring(cx - 20 + i * 4, cy - 27 - i * 1.6, 2.4, 1.25); p.ring(cx + 20 - i * 4, cy - 27 - i * 1.6, 2.4, 1.25); } },
      });

    if (d.gem && d.a !== 2 && d.a !== 1) out.push(gemAt(cx, cy + 8, 3.2, 8));
    if (d.rune) out.push({ id: 'runes', slot: 'aura', prof: 'glow', z: 8, thin: true, draw: (p) => { p.disc(cx - 20, cy + 18, 1.5); p.disc(cx + 20, cy + 18, 1.5); p.disc(cx, cy - 26, 1.5); } });
    return out;
  },
};

export const ARCHES: Record<ArchId, Arch> = {
  sword, dagger, scythe, axe, pickaxe, drill, bow, staff, wand, rod,
  helmet, chest, legs, boots, shield,
  book, gem, orb, star, ingot, coin, potion,
  chainsaw, gun, railgun, spear, mace, crossbow, runeblade, grimblade,
  tome, relic,
};

type Anchor = { cx: number; cy: number; r: number };

function anchorFor(specs: PartSpec[]): Anchor {
  const n = 64;
  const m = newMask(n);
  const pen = new Pen(m, n);
  specs.filter((s) => !s.thin).forEach((s) => s.draw(pen));
  let x0 = n, y0 = n, x1 = -1, y1 = -1;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (m[y * n + x]) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x);
        y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
  if (x1 < 0) return { cx: 32, cy: 32, r: 8 };
  const cx = (x0 + x1 + 1) / 2;
  const cy = (y0 + y1 + 1) / 2;
  return { cx, cy, r: Math.max(4, Math.min(x1 - x0 + 1, y1 - y0 + 1) * 0.17) };
}

/**
 * Decorative grammar deliberately uses connected, heraldic motifs. The output
 * is not freeform noise: every motif is tied to the existing silhouette's
 * visual centre so it can embellish tools as well as round items.
 */
export function embellish(specs: PartSpec[], d: Design): PartSpec[] {
  const style = d.adornment ?? 'none';
  if (style === 'none') return specs;
  const a = anchorFor(specs);
  const c = a.cx;
  const y = a.cy;
  const r = a.r;
  const out = [...specs];

  if (style === 'filigree') {
    out.push({
      id: 'filigree', slot: 'trim', prof: 'cyl', z: 8, thin: true,
      draw: (p) => {
        p.line([[c - r * 1.25, y], [c - r * 0.45, y - r * 0.58], [c, y - r * 0.2], [c + r * 0.45, y - r * 0.58], [c + r * 1.25, y]], 0.85);
        p.line([[c, y - r], [c - r * 0.35, y], [c, y + r], [c + r * 0.35, y], [c, y - r]], 0.75);
      },
    });
  } else if (style === 'crest') {
    out.push({
      id: 'crest_adornment', slot: 'gem', prof: 'facet', z: 9, thin: true,
      seeds: [[c, y - r], [c - r * 0.65, y + r * 0.15], [c + r * 0.65, y + r * 0.15]],
      draw: (p) => {
        p.poly([[c, y - r * 1.5], [c + r * 0.72, y - r * 0.15], [c + r * 0.28, y + r * 0.95], [c, y + r * 0.45], [c - r * 0.28, y + r * 0.95], [c - r * 0.72, y - r * 0.15]]);
      },
    });
  } else if (style === 'petals') {
    out.push({
      id: 'petal_adornment', slot: 'gem', prof: 'facet', z: 8, thin: true,
      draw: (p) => {
        p.disc(c, y - r * 0.78, r * 0.55); p.disc(c + r * 0.78, y, r * 0.55);
        p.disc(c, y + r * 0.78, r * 0.55); p.disc(c - r * 0.78, y, r * 0.55);
        p.disc(c, y, r * 0.45);
      },
    });
  } else if (style === 'thorns') {
    out.push({
      id: 'thorn_adornment', slot: 'trim', prof: 'blade', z: 8, thin: true,
      draw: (p) => {
        p.poly([[c - r * 1.2, y - r * 0.2], [c - r * 2.1, y - r * 1.15], [c - r * 0.5, y - r * 0.72]]);
        p.poly([[c + r * 1.2, y - r * 0.2], [c + r * 2.1, y - r * 1.15], [c + r * 0.5, y - r * 0.72]]);
        p.poly([[c, y + r * 0.65], [c, y + r * 2.05], [c - r * 0.5, y + r * 0.75], [c + r * 0.5, y + r * 0.75]]);
      },
    });
  } else if (style === 'sigil') {
    out.push({
      id: 'sigil_adornment', slot: 'aura', prof: 'glow', z: 8, thin: true,
      draw: (p) => {
        p.ring(c, y, r * 1.34, r * 1.04);
        p.line([[c - r * 1.15, y], [c, y - r * 1.15], [c + r * 1.15, y], [c, y + r * 1.15], [c - r * 1.15, y]], 0.65);
        p.disc(c, y, r * 0.3);
      },
    });
  } else if (style === 'orbitals') {
    out.push({
      id: 'orbital_adornment', slot: 'aura', prof: 'glow', z: 8, thin: true,
      draw: (p) => {
        p.ring(c, y, r * 1.5, r * 1.25);
        for (let i = 0; i < 4; i++) {
          const t = (i * Math.PI) / 2 + Math.PI / 4;
          const x = c + Math.cos(t) * r * 1.38;
          const yy = y + Math.sin(t) * r * 1.38;
          p.line([[c, y], [x, yy]], 0.55);
          p.disc(x, yy, r * 0.26);
        }
      },
    });
  } else if (style === 'cross') {
    // heraldic cross: a bold bar crossing the part with flared ends
    out.push({
      id: 'cross_adornment', slot: 'trim', prof: 'flat', z: 8, thin: true,
      draw: (p) => {
        p.seg(c, y - r * 1.7, c, y + r * 1.7, r * 0.42);
        p.seg(c - r * 1.7, y, c + r * 1.7, y, r * 0.42);
        p.poly([[c - r * 0.6, y - r * 1.7], [c, y - r * 2.4], [c + r * 0.6, y - r * 1.7]]);
        p.poly([[c - r * 0.6, y + r * 1.7], [c, y + r * 2.4], [c + r * 0.6, y + r * 1.7]]);
        p.disc(c, y, r * 0.5);
      },
    });
  } else if (style === 'crown') {
    // a small crown sitting above the part's centre
    out.push({
      id: 'crown_adornment', slot: 'gem', prof: 'facet', z: 9, thin: true,
      draw: (p) => {
        const base = y - r * 1.15;
        p.poly([[c - r * 1.35, base + r * 0.7], [c + r * 1.35, base + r * 0.7], [c + r * 1.2, base + r * 1.7], [c - r * 1.2, base + r * 1.7]]);
        p.poly([[c - r * 1.35, base + r * 0.7], [c - r * 1.1, base - r * 0.9], [c - r * 0.45, base + r * 0.55]]);
        p.poly([[c - r * 0.45, base + r * 0.55], [c, base - r * 1.5], [c + r * 0.45, base + r * 0.55]]);
        p.poly([[c + r * 0.45, base + r * 0.55], [c + r * 1.1, base - r * 0.9], [c + r * 1.35, base + r * 0.7]]);
        p.disc(c, base - r * 1.5, r * 0.3);
        p.disc(c - r * 1.1, base - r * 0.9, r * 0.26);
        p.disc(c + r * 1.1, base - r * 0.9, r * 0.26);
      },
    });
  } else if (style === 'flame') {
    // flame tongues rising from the lower edge of the part
    out.push({
      id: 'flame_adornment', slot: 'aura', prof: 'glow', z: 8, thin: true,
      draw: (p) => {
        for (let i = -2; i <= 2; i++) {
          const h = r * (1.1 + (2 - Math.abs(i)) * 0.75);
          const bx = c + i * r * 0.85;
          const by = y + r * 1.15;
          p.poly([[bx - r * 0.42, by], [bx + r * 0.42, by], [bx + r * 0.22, by - h * 0.55], [bx, by - h], [bx - r * 0.22, by - h * 0.55]]);
        }
      },
    });
  }
  return out;
}

export const SLOT_LABEL: Record<Slot, string> = { main: '主材', trim: '装飾', grip: '柄・革', gem: '宝石', aura: '霊気・糸' };
