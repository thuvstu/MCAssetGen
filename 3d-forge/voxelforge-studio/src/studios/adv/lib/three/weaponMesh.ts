import * as THREE from "three";
import type { RenderResult } from "@/studios/adv/lib/pixel/generator";
import { makeMapper } from "@/studios/adv/lib/pixel/generator";
import { ROLE_THICK, weaponToWorld, type ModelSettings } from "@/studios/adv/lib/pixel/model3d";
import type { Orientation, Part, Shade } from "@/studios/adv/lib/pixel/shapes";

type Vec3 = [number, number, number];
/** A cross-section placed in weapon space: c = (t,u,v) centre, e1/e2 = section axes. */
type Frame = { c: Vec3; e1: Vec3; e2: Vec3 };
/** Section points live in unit space: x ∈ [-1,1] across, y ∈ [-1,1] through. */
type Section = [number, number][];

export type MaterialKey = "blade" | "metal" | "wood" | "gem" | "glow" | "flat";
export type WeaponMaterials = Record<MaterialKey, THREE.Material>;

export function materialKeyFor(shade: Shade, role: string): MaterialKey {
  if (shade === "gem") return "gem";
  if (shade === "glow" || role === "glow") return "glow";
  if (shade === "wood") return "wood";
  if (shade === "blade") return "blade";
  if (shade === "flat") return "flat";
  return "metal";
}

export type MeshContext = {
  toWorld: (t: number, u: number, v: number) => Vec3;
  projectUV: (t: number, u: number) => [number, number];
  settings: ModelSettings;
};

/**
 * Loft a closed section along frames. Vertices are duplicated per section strip so shading
 * is smooth along the weapon but crisp across bevels — how a real blade reads under light.
 */
function loft(
  frames: Frame[],
  section: Section,
  ctx: MeshContext,
  opts: {
    /** per-frame across (u) half width */
    widths: number[];
    /** per-frame through (v) half depth */
    depths: number[];
    capStart?: boolean;
    capEnd?: boolean;
  },
): THREE.BufferGeometry | null {
  const N = frames.length;
  const R = section.length;
  if (N < 2 || R < 3) return null;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];

  const vertex = (i: number, k: number): Vec3 => {
    const f = frames[i];
    const u = f.c[1] + (f.e1[1] * section[k][0] * opts.widths[i]) + (f.e2[1] * section[k][1] * opts.depths[i]);
    const t = f.c[0] + (f.e1[0] * section[k][0] * opts.widths[i]) + (f.e2[0] * section[k][1] * opts.depths[i]);
    const v = f.c[2] + (f.e1[2] * section[k][0] * opts.widths[i]) + (f.e2[2] * section[k][1] * opts.depths[i]);
    return ctx.toWorld(t, u, v);
  };
  const pushVertex = (i: number, k: number) => {
    const w = vertex(i, k);
    pos.push(w[0], w[1], w[2]);
    const f = frames[i];
    const t = f.c[0] + (f.e1[0] * section[k][0] * opts.widths[i]) + (f.e2[0] * section[k][1] * opts.depths[i]);
    const u = f.c[1] + (f.e1[1] * section[k][0] * opts.widths[i]) + (f.e2[1] * section[k][1] * opts.depths[i]);
    const [px, py] = ctx.projectUV(t, u);
    uv.push(px, py);
  };
  const pushCenter = (i: number) => {
    const f = frames[i];
    const w = ctx.toWorld(f.c[0], f.c[1], f.c[2]);
    pos.push(w[0], w[1], w[2]);
    const [px, py] = ctx.projectUV(f.c[0], f.c[1]);
    uv.push(px, py);
  };

  for (let k = 0; k < R; k++) {
    const k2 = (k + 1) % R;
    const base = pos.length / 3;
    for (let i = 0; i < N; i++) { pushVertex(i, k); pushVertex(i, k2); }
    for (let i = 0; i < N - 1; i++) {
      const a = base + i * 2;
      idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
  }
  const cap = (i: number, flip: boolean) => {
    const apex = pos.length / 3;
    pushCenter(i);
    const ring = pos.length / 3;
    for (let k = 0; k < R; k++) pushVertex(i, k);
    for (let k = 0; k < R; k++) {
      const k2 = (k + 1) % R;
      if (flip) idx.push(apex, ring + k2, ring + k);
      else idx.push(apex, ring + k, ring + k2);
    }
  };
  if (opts.capStart) cap(0, true);
  if (opts.capEnd) cap(N - 1, false);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(idx);
  geometry.computeVertexNormals();
  return geometry;
}

// ---------- unit cross sections ----------
function bladeSection(bevel: number, ridge: number, fuller: number): Section {
  const b = Math.min(0.96, Math.max(0, bevel));
  const edge = 1 - b; // 0 = knife sharp, 1 = flat slab
  const face = 0.42 + 0.4 * (1 - b);
  const r = Math.max(0, ridge);
  const g = Math.max(0, fuller);
  return [
    [1, edge],
    [face, 0.55 + r * 0.4],
    [0.18, 1 + r - g],
    [-0.18, 1 + r - g],
    [-face, 0.55 + r * 0.4],
    [-1, edge],
    [-1, -edge],
    [-face, -0.55 - r * 0.4],
    [-0.18, -1 - r + g],
    [0.18, -1 - r + g],
    [face, -0.55 - r * 0.4],
  ];
}

function polygonSection(sides: number): Section {
  const out: Section = [];
  const n = Math.max(3, Math.round(sides));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push([Math.cos(a), Math.sin(a)]);
  }
  return out;
}

function chamferSection(chamfer: number): Section {
  const c = Math.min(0.48, Math.max(0, chamfer));
  return [
    [1 - c, 1], [-1 + c, 1], [-1, 1 - c], [-1, -1 + c],
    [-1 + c, -1], [1 - c, -1], [1, -1 + c], [1, 1 - c],
  ];
}

function facetedDiscSection(radius: number, facets: number): Section {
  const out: Section = [];
  const n = Math.max(4, Math.round(facets));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    // Alternating radii produce crown/pavilion facets that catch light like a cut stone.
    const jitter = 1 + (i % 2 === 0 ? 0.055 : -0.045) * (n >= 8 ? 1 : 0.4);
    out.push([Math.cos(a) * radius * jitter, Math.sin(a) * radius * jitter]);
  }
  return out;
}

const GEM_LEVELS = [
  { h: 1, r: 0.5 },
  { h: 0.74, r: 0.86 },
  { h: 0.3, r: 1 },
  { h: 0.06, r: 0.99 },
  { h: -0.16, r: 0.92 },
  { h: -0.55, r: 0.5 },
  { h: -1, r: 0.04 },
];
const BOSS_LEVELS = [
  { h: 0.95, r: 0.36 }, { h: 0.6, r: 0.84 }, { h: 0.18, r: 1 },
  { h: -0.18, r: 1 }, { h: -0.6, r: 0.84 }, { h: -0.95, r: 0.36 },
];

function profileGeometry(part: Extract<Part, { kind: "profile" }>, ctx: MeshContext): THREE.BufferGeometry | null {
  const s = ctx.settings;
  const length = Math.max(0.2, part.t1 - part.t0);
  const samples = Math.max(4, Math.min(48, Math.ceil(length * 6)));
  const roleThick = ROLE_THICK[part.role] ?? 0.7;
  const half = Math.max(0.05, (s.thickness * roleThick * (0.45 + part.depth)) / 2);

  let section: Section;
  /** true = depth follows the across width (round handles), false = depth follows `half` */
  let depthFollowsWidth = false;
  switch (part.shade) {
    case "blade":
      section = bladeSection(s.bladeBevel, s.ridge, s.fuller);
      break;
    case "round":
    case "wood":
      section = polygonSection(s.gripSides);
      depthFollowsWidth = true;
      break;
    case "glow":
      section = chamferSection(0.3);
      break;
    case "gem":
      section = polygonSection(8);
      depthFollowsWidth = true;
      break;
    default:
      section = chamferSection(part.shade === "metal" ? 0.38 : 0.12);
  }

  const frames: Frame[] = [];
  const widths: number[] = [];
  const depths: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const f = i / samples;
    const t = part.t0 + length * f;
    const hw = Math.max(0.02, part.hw(t));
    frames.push({ c: [t, part.uOff ? part.uOff(t) : 0, 0], e1: [0, 1, 0], e2: [0, 0, 1] });
    widths.push(hw);
    // Leading end converges to a point; the pommel end stays blunt.
    const tipZone = Math.max(0, (f - 0.78) / 0.22);
    const taper = 1 - s.tipTaper * Math.pow(tipZone, 1.5);
    const base = depthFollowsWidth ? hw * (0.55 + s.gripRound * 0.45) : half;
    depths.push(Math.max(0.02, base * Math.max(0.1, taper)));
  }
  return loft(frames, section, ctx, {
    widths,
    depths,
    capStart: part.role !== "blade",
    capEnd: false,
  });
}

function discGeometry(part: Extract<Part, { kind: "disc" }>, ctx: MeshContext): THREE.BufferGeometry | null {
  const s = ctx.settings;
  const roleThick = ROLE_THICK[part.role] ?? 0.8;
  const half = Math.max(0.05, (s.thickness * roleThick * (0.5 + part.depth)) / 2);

  if (part.r2 !== undefined) {
    // Ring / halo: tube swept around a circle lying in the t-u plane.
    const rm = (part.r + part.r2) / 2;
    const tube = Math.max(0.05, (part.r - part.r2) / 2);
    const steps = 30;
    const frames: Frame[] = [];
    const widths: number[] = [];
    const depths: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const radial: Vec3 = [Math.cos(a), Math.sin(a), 0];
      frames.push({ c: [part.t + radial[0] * rm, part.u + radial[1] * rm, 0], e1: radial, e2: [0, 0, 1] });
      widths.push(tube);
      depths.push(tube);
    }
    return loft(frames, polygonSection(10), ctx, { widths, depths });
  }

  const gem = part.role === "gem" || part.role === "orb" || part.shade === "gem";
  const levels = gem ? GEM_LEVELS : BOSS_LEVELS;
  const frames = levels.map((l) => ({ c: [part.t, part.u, l.h * half] as Vec3, e1: [1, 0, 0] as Vec3, e2: [0, 1, 0] as Vec3 }));
  // Sections are unit-radius; the real radius is applied per level so both gems and
  // bosses scale identically (and gem facet jitter stays proportional).
  const section = gem ? facetedDiscSection(1, s.gemFacets) : polygonSection(16);
  const radii = levels.map((l) => Math.max(0.02, part.r * l.r));
  return loft(frames, section, ctx, {
    widths: radii,
    depths: radii,
    capStart: true,
    capEnd: true,
  });
}

function polyGeometry(part: Extract<Part, { kind: "poly" }>, ctx: MeshContext): THREE.BufferGeometry | null {
  const s = ctx.settings;
  if (part.pts.length < 3) return null;
  const roleThick = ROLE_THICK[part.role] ?? 0.6;
  const thickness = Math.max(0.06, s.thickness * roleThick * (0.4 + part.depth));
  const bladeLike = part.shade === "blade" || part.role === "blade" || part.role === "head";
  const shape = new THREE.Shape();
  part.pts.forEach(([t, u], i) => (i === 0 ? shape.moveTo(t, u) : shape.lineTo(t, u)));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: bladeLike ? thickness * 0.44 : thickness * 0.16,
    bevelSize: bladeLike ? thickness * 0.42 : thickness * 0.12,
    bevelSegments: bladeLike ? 3 : 2,
    curveSegments: 1,
  });
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");
  for (let i = 0; i < positions.count; i++) {
    const t = positions.getX(i);
    const u = positions.getY(i);
    const v = positions.getZ(i) - thickness / 2;
    const world = ctx.toWorld(t, u, v);
    positions.setXYZ(i, world[0], world[1], world[2]);
    const [px, py] = ctx.projectUV(t, u);
    uvs.setXY(i, px, py);
  }
  positions.needsUpdate = true;
  uvs.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function merge(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (list.length === 1) return list[0];
  const pos: number[] = [], uv: number[] = [], nrm: number[] = [], idx: number[] = [];
  let offset = 0;
  for (const g of list) {
    const p = g.getAttribute("position") as THREE.BufferAttribute;
    const u = g.getAttribute("uv") as THREE.BufferAttribute | undefined;
    const n = g.getAttribute("normal") as THREE.BufferAttribute | undefined;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0);
      nrm.push(n ? n.getX(i) : 0, n ? n.getY(i) : 1, n ? n.getZ(i) : 0);
    }
    const index = g.getIndex();
    if (index) for (let i = 0; i < index.count; i++) idx.push(index.getX(i) + offset);
    offset += p.count;
    g.dispose();
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  merged.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  merged.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  merged.setIndex(idx);
  return merged;
}

export function createWeaponMaterials(texture: THREE.Texture, glowColor: THREE.Color): WeaponMaterials {
  const shared = { map: texture, side: THREE.DoubleSide };
  return {
    blade: new THREE.MeshStandardMaterial({ ...shared, metalness: 0.94, roughness: 0.19, envMapIntensity: 1.4 }),
    metal: new THREE.MeshStandardMaterial({ ...shared, metalness: 0.86, roughness: 0.33, envMapIntensity: 1.15 }),
    wood: new THREE.MeshStandardMaterial({ ...shared, metalness: 0.04, roughness: 0.84 }),
    flat: new THREE.MeshStandardMaterial({ ...shared, metalness: 0.32, roughness: 0.62 }),
    glow: new THREE.MeshStandardMaterial({
      ...shared, metalness: 0.1, roughness: 0.32, emissive: glowColor, emissiveIntensity: 1.7,
    }),
    gem: new THREE.MeshPhysicalMaterial({
      ...shared, metalness: 0.06, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03,
      iridescence: 0.7, iridescenceIOR: 1.8, reflectivity: 0.95,
      emissive: glowColor, emissiveIntensity: 0.45, envMapIntensity: 1.8,
    }),
  };
}

export function disposeWeaponMaterials(materials: WeaponMaterials) {
  Object.values(materials).forEach((m) => m.dispose());
}

/** True 3D reconstruction: volumetric parts with UVs projected from the 2D texture. */
export function buildWeaponGroup(
  render: RenderResult,
  settings: ModelSettings,
  materials: WeaponMaterials,
): THREE.Group {
  const group = new THREE.Group();
  const orientation: Orientation = render.shape.orientation;
  const size = render.pix.w;
  const mapper = makeMapper(size, orientation);
  const ctx: MeshContext = {
    toWorld: (t, u, v) => weaponToWorld(t, u, v, orientation),
    projectUV: (t, u) => {
      const [x, y] = mapper.toP(t, u);
      return [Math.max(0, Math.min(1, x / size)), Math.max(0, Math.min(1, y / size))];
    },
    settings,
  };
  const buckets = new Map<MaterialKey, THREE.BufferGeometry[]>();
  for (const part of render.shape.parts(render.settings.params)) {
    const geometry =
      part.kind === "profile" ? profileGeometry(part, ctx)
      : part.kind === "disc" ? discGeometry(part, ctx)
      : polyGeometry(part, ctx);
    if (!geometry) continue;
    const key = materialKeyFor(part.shade, part.role);
    const list = buckets.get(key) ?? [];
    list.push(geometry);
    buckets.set(key, list);
  }
  for (const [key, list] of buckets) {
    const mesh = new THREE.Mesh(merge(list), materials[key]);
    mesh.name = key;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}
