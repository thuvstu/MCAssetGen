// Parametric weapon shapes defined in "weapon space":
//   t = position along the main axis (16-grid units, 0 = bottom/pommel, ~22 = tip for diagonals)
//   u = perpendicular offset (negative = top-left / lit side)

export type Role =
  | "blade"
  | "edge"
  | "core"
  | "guard"
  | "grip"
  | "pommel"
  | "gem"
  | "orb"
  | "string"
  | "wood"
  | "metal"
  | "trim"
  | "glow"
  | "barrel"
  | "page"
  | "cover"
  | "ring"
  | "spike"
  | "head";

export type Shade = "metal" | "flat" | "round" | "gem" | "wood" | "glow" | "blade";
export type MatKey = "primary" | "secondary" | "grip" | "gem" | "glow";

export type Part =
  | {
      kind: "profile";
      role: Role;
      t0: number;
      t1: number;
      hw: (t: number) => number;
      uOff?: (t: number) => number;
      z: number;
      depth: number;
      shade: Shade;
      mat: MatKey;
    }
  | {
      kind: "disc";
      role: Role;
      t: number;
      u: number;
      r: number;
      r2?: number; // inner radius => ring
      z: number;
      depth: number;
      shade: Shade;
      mat: MatKey;
    }
  | {
      kind: "poly";
      role: Role;
      pts: [number, number][]; // (t,u)
      z: number;
      depth: number;
      shade: Shade;
      mat: MatKey;
    };

export type Orientation = "diagonal" | "upright";

export type ShapeParams = {
  width: number; // blade width multiplier
  length: number; // length multiplier
  guard: number; // guard size multiplier
  ornate: number; // 0..3
  curve: number; // -1..1
};

export type Shape = {
  id: string;
  name: string;
  nameJa: string;
  category: "melee" | "tool" | "ranged" | "magic" | "tech" | "relic";
  orientation: Orientation;
  baseItem: string; // vanilla item id for overrides
  parts: (p: ShapeParams) => Part[];
};

// ---------- helpers ----------
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** half-width function tapering from w0 at t0 to w1 at t1 with easing pow */
const taper =
  (t0: number, t1: number, w0: number, w1: number, pow = 1) =>
  (t: number) =>
    lerp(w0, w1, Math.pow(clamp01((t - t0) / Math.max(1e-6, t1 - t0)), pow));
const constW = (w: number) => () => w;

type PO = Partial<Extract<Part, { kind: "profile" }>>;
function prof(
  role: Role,
  t0: number,
  t1: number,
  hw: (t: number) => number,
  o: PO = {},
): Part {
  return {
    kind: "profile",
    role,
    t0,
    t1,
    hw,
    z: o.z ?? 1,
    depth: o.depth ?? 0.5,
    shade: o.shade ?? defaultShade(role),
    mat: o.mat ?? defaultMat(role),
    uOff: o.uOff,
  };
}
type DO = Partial<Extract<Part, { kind: "disc" }>>;
function disc(role: Role, t: number, u: number, r: number, o: DO = {}): Part {
  return {
    kind: "disc",
    role,
    t,
    u,
    r,
    r2: o.r2,
    z: o.z ?? 3,
    depth: o.depth ?? 0.7,
    shade: o.shade ?? defaultShade(role),
    mat: o.mat ?? defaultMat(role),
  };
}
type YO = Partial<Extract<Part, { kind: "poly" }>>;
function poly(role: Role, pts: [number, number][], o: YO = {}): Part {
  return {
    kind: "poly",
    role,
    pts,
    z: o.z ?? 2,
    depth: o.depth ?? 0.5,
    shade: o.shade ?? defaultShade(role),
    mat: o.mat ?? defaultMat(role),
  };
}
function defaultShade(r: Role): Shade {
  switch (r) {
    case "blade":
    case "edge":
      return "blade";
    case "grip":
    case "wood":
    case "barrel":
      return "round";
    case "gem":
    case "orb":
      return "gem";
    case "glow":
      return "glow";
    case "page":
    case "string":
      return "flat";
    default:
      return "metal";
  }
}
function defaultMat(r: Role): MatKey {
  switch (r) {
    case "blade":
    case "edge":
    case "head":
    case "core":
    case "barrel":
      return "primary";
    case "grip":
    case "wood":
    case "string":
      return "grip";
    case "gem":
    case "orb":
      return "gem";
    case "glow":
      return "glow";
    case "page":
      return "gem";
    default:
      return "secondary";
  }
}

// common sub-assemblies
function hilt(p: ShapeParams, t0: number, tGuard: number, gripW = 0.55, guardW = 2.2): Part[] {
  const g = guardW * p.guard;
  const parts: Part[] = [
    prof("pommel", t0, t0 + 1.2, constW(1.0 + 0.2 * p.ornate), { depth: 0.8 }),
    prof("grip", t0 + 1.2, tGuard, constW(gripW), { depth: 0.55 }),
    prof("guard", tGuard, tGuard + 1.4, (t) =>
      g * (0.75 + 0.25 * Math.sin(((t - tGuard) / 1.4) * Math.PI)), { depth: 0.9 }),
  ];
  if (p.ornate >= 1) parts.push(disc("gem", tGuard + 0.7, 0, 0.6 + 0.15 * p.ornate, { z: 5 }));
  if (p.ornate >= 2) parts.push(disc("gem", t0 + 0.6, 0, 0.5, { z: 5 }));
  if (p.ornate >= 2)
    parts.push(prof("trim", t0 + 2.4, t0 + 2.9, constW(gripW + 0.35), { z: 2, depth: 0.7 }));
  if (p.ornate >= 3)
    parts.push(prof("trim", tGuard - 1.0, tGuard - 0.5, constW(gripW + 0.35), { z: 2, depth: 0.7 }));
  return parts;
}

// ---------- shapes ----------
export const SHAPES: Shape[] = [
  {
    id: "sword",
    name: "Sword",
    nameJa: "剣",
    category: "melee",
    orientation: "diagonal",
    baseItem: "iron_sword",
    parts: (p) => {
      const tip = 7.6 + 13.2 * p.length;
      const bw = 0.9 * p.width;
      return [
        ...hilt(p, 1.0, 6.4),
        prof("blade", 7.6, tip, (t) => (t > tip - 2.2 ? taper(tip - 2.2, tip, bw, 0.25)(t) : bw), {
          depth: 0.4,
        }),
        ...(p.ornate >= 1
          ? [prof("core", 8.6, tip - 3, constW(bw * 0.3), { z: 2, depth: 0.3, mat: "secondary", shade: "flat" })]
          : []),
      ];
    },
  },
  {
    id: "greatsword",
    name: "Greatsword",
    nameJa: "大剣",
    category: "melee",
    orientation: "diagonal",
    baseItem: "netherite_sword",
    parts: (p) => {
      const tip = 8 + 13 * p.length;
      const bw = 1.7 * p.width;
      return [
        ...hilt(p, 0.6, 5.8, 0.7, 3.2),
        prof("blade", 7.2, tip, (t) => (t > tip - 3.5 ? taper(tip - 3.5, tip, bw, 0.3, 0.8)(t) : bw), {
          depth: 0.5,
        }),
        prof("core", 8.4, tip - 4, constW(bw * 0.28), { z: 2, depth: 0.35, mat: "secondary", shade: "flat" }),
        ...(p.ornate >= 2 ? [disc("gem", 10, 0, 0.7, { z: 5 })] : []),
      ];
    },
  },
  {
    id: "katana",
    name: "Katana",
    nameJa: "刀",
    category: "melee",
    orientation: "diagonal",
    baseItem: "iron_sword",
    parts: (p) => {
      const tip = 7.5 + 14 * p.length;
      const bw = 0.7 * p.width;
      const curve = 0.35 + 0.6 * p.curve;
      return [
        prof("pommel", 1.0, 1.8, constW(0.8)),
        prof("grip", 1.8, 6.6, constW(0.55), { shade: "wood", mat: "grip" }),
        prof("guard", 6.6, 7.3, constW(1.3 * p.guard), { depth: 0.8 }),
        prof("blade", 7.3, tip, (t) => (t > tip - 2 ? taper(tip - 2, tip, bw, 0.2)(t) : bw), {
          uOff: (t) => -curve * Math.pow(clamp01((t - 7.3) / (tip - 7.3)), 2) * 2.2,
          depth: 0.35,
        }),
        prof("edge", 7.8, tip - 1.5, constW(bw * 0.3), {
          uOff: (t) => -curve * Math.pow(clamp01((t - 7.3) / (tip - 7.3)), 2) * 2.2 - bw * 0.6,
          z: 2,
          depth: 0.35,
          shade: "flat",
          mat: "primary",
        }),
      ];
    },
  },
  {
    id: "dagger",
    name: "Dagger",
    nameJa: "短剣",
    category: "melee",
    orientation: "diagonal",
    baseItem: "iron_sword",
    parts: (p) => {
      const tip = 10 + 8 * p.length;
      const bw = 1.0 * p.width;
      return [
        ...hilt(p, 3.0, 7.4, 0.55, 1.8),
        prof("blade", 8.6, tip, taper(8.6, tip, bw, 0.2, 1.3), { depth: 0.4 }),
        prof("core", 9.2, tip - 2, taper(9.2, tip - 2, bw * 0.3, 0.1), { z: 2, depth: 0.3, mat: "secondary", shade: "flat" }),
      ];
    },
  },
  {
    id: "rapier",
    name: "Rapier",
    nameJa: "レイピア",
    category: "melee",
    orientation: "diagonal",
    baseItem: "iron_sword",
    parts: (p) => {
      const tip = 8 + 13.5 * p.length;
      return [
        prof("pommel", 1.0, 1.9, constW(0.9)),
        prof("grip", 1.9, 5.6, constW(0.5)),
        disc("guard", 6.6, 0, 1.9 * p.guard, { r2: 1.1 * p.guard, z: 2, depth: 0.8 }),
        prof("guard", 5.6, 6.9, constW(1.1 * p.guard), { depth: 0.8 }),
        prof("blade", 6.9, tip, taper(6.9, tip, 0.55 * p.width, 0.15), { depth: 0.35 }),
        ...(p.ornate >= 1 ? [disc("gem", 6.6, 0, 0.6, { z: 5 })] : []),
      ];
    },
  },
  {
    id: "scimitar",
    name: "Scimitar",
    nameJa: "三日月刀",
    category: "melee",
    orientation: "diagonal",
    baseItem: "golden_sword",
    parts: (p) => {
      const tip = 7.5 + 13.5 * p.length;
      return [
        ...hilt(p, 1.2, 6.4, 0.55, 1.6),
        prof("blade", 7.6, tip, (t) => {
          const f = clamp01((t - 7.6) / (tip - 7.6));
          return (0.7 + 1.1 * Math.sin(f * Math.PI) * (0.6 + 0.4 * f)) * p.width * (f > 0.9 ? (1 - f) * 10 : 1);
        }, {
          uOff: (t) => -(0.5 + 0.5 * p.curve) * Math.pow(clamp01((t - 7.6) / (tip - 7.6)), 2) * 2.5,
          depth: 0.4,
        }),
      ];
    },
  },
  {
    id: "scythe",
    name: "Scythe",
    nameJa: "大鎌",
    category: "melee",
    orientation: "diagonal",
    baseItem: "netherite_hoe",
    parts: (p) => {
      const top = 15 + 5 * p.length;
      return [
        prof("pommel", 0.8, 1.6, constW(0.9)),
        prof("wood", 1.6, top, constW(0.55), { shade: "wood", mat: "grip" }),
        prof("trim", 9, 9.6, constW(0.9), { z: 2 }),
        prof("guard", top - 0.5, top + 0.6, constW(1.4 * p.guard), { depth: 0.8 }),
        // curved blade sweeping to the bottom-right (positive u)
        poly(
          "blade",
          (() => {
            const pts: [number, number][] = [];
            const n = 16;
            const Rr = 9.5;
            const ct = top, cu = 0.5 + Rr; // circle center (blade sweeps toward bottom-right)
            for (let i = 0; i <= n; i++) {
              const f = i / n;
              const ang = f * Math.PI * 0.64;
              pts.push([ct - Math.sin(ang) * Rr * p.width, cu - Math.cos(ang) * Rr]);
            }
            for (let i = n; i >= 0; i--) {
              const f = i / n;
              const ang = f * Math.PI * 0.64;
              const th = (3.4 + 0.6 * p.width) * (1 - f * 0.9);
              pts.push([ct - Math.sin(ang) * (Rr - th) * p.width, cu - Math.cos(ang) * (Rr - th)]);
            }
            return pts;
          })(),
          { depth: 0.35 },
        ),
        ...(p.ornate >= 1 ? [disc("gem", top, 0, 0.8, { z: 5 })] : []),
      ];
    },
  },
  {
    id: "spear",
    name: "Spear",
    nameJa: "槍",
    category: "melee",
    orientation: "diagonal",
    baseItem: "trident",
    parts: (p) => {
      const tip = 21.5 * Math.min(1, p.length);
      const headStart = tip - 6.5;
      const parts: Part[] = [
        prof("pommel", 0.6, 1.6, taper(0.6, 1.6, 0.3, 0.9)),
        prof("wood", 1.6, headStart, constW(0.5), { shade: "wood", mat: "grip" }),
        prof("trim", headStart - 1.6, headStart - 0.2, constW(0.9 * p.guard), { z: 2 }),
        prof("guard", headStart - 0.2, headStart + 0.6, constW(1.6 * p.guard), { depth: 0.8 }),
        prof("blade", headStart + 0.4, tip, (t) => {
          const f = clamp01((t - headStart) / (tip - headStart));
          return (f < 0.3 ? lerp(0.6, 1.4, f / 0.3) : lerp(1.4, 0.15, (f - 0.3) / 0.7)) * p.width;
        }, { depth: 0.45 }),
        prof("core", headStart + 1.2, tip - 1.5, constW(0.25), { z: 2, mat: "secondary", shade: "flat", depth: 0.3 }),
      ];
      if (p.ornate >= 1) parts.push(disc("gem", headStart + 0.2, 0, 0.7, { z: 5 }));
      if (p.ornate >= 2) {
        parts.push(prof("trim", 4, 4.6, constW(0.85), { z: 2 }), prof("trim", 7, 7.6, constW(0.85), { z: 2 }));
        parts.push(
          poly("spike", [[headStart - 0.4, -1.4], [headStart - 2.6, -3.2], [headStart - 1.2, -1.2]], { z: 2, mat: "secondary" }),
          poly("spike", [[headStart - 0.4, 1.4], [headStart - 2.6, 3.2], [headStart - 1.2, 1.2]], { z: 2, mat: "secondary" }),
        );
      }
      if (p.ornate >= 3) parts.push(disc("ring", headStart - 3.5, 0, 1.6, { r2: 1.0, z: 0 }));
      return parts;
    },
  },
  {
    id: "halberd",
    name: "Halberd",
    nameJa: "ハルバード",
    category: "melee",
    orientation: "diagonal",
    baseItem: "netherite_axe",
    parts: (p) => {
      const tip = 21.5 * Math.min(1, p.length);
      const h0 = tip - 8;
      return [
        prof("pommel", 0.6, 1.6, constW(0.8)),
        prof("wood", 1.6, tip - 5.5, constW(0.5), { shade: "wood", mat: "grip" }),
        prof("blade", tip - 5.5, tip, taper(tip - 5.5, tip, 1.0 * p.width, 0.15), { depth: 0.45 }),
        poly("head", [[h0, -0.4], [h0 + 1, -4.5 * p.width], [h0 + 5.5, -4.2 * p.width], [h0 + 6, -0.4]], { depth: 0.5, mat: "primary" }),
        poly("spike", [[h0 + 1.5, 0.4], [h0 + 2.5, 2.6 * p.guard], [h0 + 3.5, 0.4]], { mat: "secondary" }),
        prof("trim", h0 - 0.8, h0 + 0.2, constW(0.9), { z: 2 }),
        ...(p.ornate >= 1 ? [disc("gem", h0 + 3, -1.2, 0.6, { z: 5 })] : []),
      ];
    },
  },
  {
    id: "mace",
    name: "Mace",
    nameJa: "メイス",
    category: "melee",
    orientation: "diagonal",
    baseItem: "mace",
    parts: (p) => {
      const head = 13 + 4 * p.length;
      const r = 2.6 * p.width;
      const parts: Part[] = [
        prof("pommel", 1.0, 2.0, constW(0.9)),
        prof("grip", 2.0, 7, constW(0.6)),
        prof("trim", 7, 7.8, constW(1.0 * p.guard), { z: 2 }),
        prof("metal", 7.8, head - r + 0.5, constW(0.55), { mat: "secondary", shade: "round" }),
        disc("head", head, 0, r, { z: 2, depth: 1.0, shade: "gem", mat: "primary" }),
      ];
      const spikes = 6 + p.ornate * 2;
      for (let i = 0; i < spikes; i++) {
        const a = (i / spikes) * Math.PI * 2;
        const sl = 1.6 + 0.3 * p.ornate;
        const c = Math.cos(a), s = Math.sin(a);
        parts.push(
          poly("spike", [
            [head + c * (r - 0.3) + s * 0.6, s * (r - 0.3) - c * 0.6],
            [head + c * (r + sl), s * (r + sl)],
            [head + c * (r - 0.3) - s * 0.6, s * (r - 0.3) + c * 0.6],
          ], { z: 1, mat: "secondary" }),
        );
      }
      if (p.ornate >= 1) parts.push(disc("gem", head, 0, r * 0.4, { z: 5 }));
      if (p.ornate >= 2) parts.push(disc("ring", head, 0, r * 0.75, { r2: r * 0.6, z: 4, mat: "secondary", shade: "flat" }));
      return parts;
    },
  },
  {
    id: "warhammer",
    name: "Warhammer",
    nameJa: "戦鎚",
    category: "melee",
    orientation: "diagonal",
    baseItem: "mace",
    parts: (p) => {
      const h = 14 + 3 * p.length;
      const w = 3.4 * p.width;
      return [
        prof("pommel", 0.8, 1.8, constW(0.9)),
        prof("grip", 1.8, 8, constW(0.6)),
        prof("wood", 8, h - 1.5, constW(0.55), { shade: "wood", mat: "grip" }),
        prof("trim", 8, 8.8, constW(1.0 * p.guard), { z: 2 }),
        poly("head", [[h - 2.2, -w], [h + 2.2, -w], [h + 2.2, w * 0.4], [h - 2.2, w * 0.4]], { depth: 1.0, mat: "primary", shade: "metal" }),
        poly("spike", [[h - 1.2, w * 0.4], [h, w * 0.4 + 3.2], [h + 1.2, w * 0.4]], { mat: "secondary" }),
        prof("blade", h + 2.2, h + 4.2, taper(h + 2.2, h + 4.2, 0.9, 0.1), { depth: 0.5 }),
        ...(p.ornate >= 1 ? [disc("gem", h, -w * 0.3, 0.8, { z: 5 })] : []),
        ...(p.ornate >= 2 ? [prof("trim", h - 2.4, h - 1.8, (t) => w + 0.3 - (t - h + 2.4) * 0, { z: 3, uOff: () => -w * 0.3 }), ] : []),
      ];
    },
  },
  {
    id: "axe",
    name: "Axe",
    nameJa: "斧",
    category: "tool",
    orientation: "diagonal",
    baseItem: "iron_axe",
    parts: (p) => {
      const top = 15.5 + 4 * p.length;
      const w = 4.2 * p.width;
      return [
        prof("wood", 1.0, top + 1.5, constW(0.55), { shade: "wood", mat: "grip" }),
        poly("head", [
          [top - 4.2, -0.3], [top - 2.5, -w * 0.7], [top - 0.5, -w], [top + 2.3, -w * 0.85],
          [top + 2.6, -0.3],
        ], { depth: 0.7, mat: "primary" }),
        prof("trim", top - 4.5, top + 2.8, constW(0.9), { z: 2 }),
        ...(p.ornate >= 1 ? [disc("gem", top - 1, -1.6, 0.6, { z: 5 })] : []),
      ];
    },
  },
  {
    id: "battleaxe",
    name: "Battleaxe",
    nameJa: "両刃斧",
    category: "melee",
    orientation: "diagonal",
    baseItem: "netherite_axe",
    parts: (p) => {
      const top = 15 + 4 * p.length;
      const w = 4.2 * p.width;
      const blade = (s: number): [number, number][] => [
        [top - 4.2, 0.3 * s], [top - 2.5, w * 0.7 * s], [top - 0.5, w * s], [top + 2.3, w * 0.85 * s], [top + 2.6, 0.3 * s],
      ];
      return [
        prof("pommel", 0.6, 1.6, constW(0.9)),
        prof("grip", 1.6, 6, constW(0.6)),
        prof("wood", 6, top + 1.5, constW(0.55), { shade: "wood", mat: "grip" }),
        poly("head", blade(-1), { depth: 0.7, mat: "primary" }),
        poly("head", blade(1), { depth: 0.7, mat: "primary" }),
        prof("trim", top - 4.5, top + 2.8, constW(1.0), { z: 2 }),
        prof("blade", top + 2.8, top + 4.6, taper(top + 2.8, top + 4.6, 0.8, 0.1), { depth: 0.45 }),
        ...(p.ornate >= 1 ? [disc("gem", top - 1, 0, 0.8, { z: 5 })] : []),
      ];
    },
  },
  {
    id: "pickaxe",
    name: "Pickaxe",
    nameJa: "ツルハシ",
    category: "tool",
    orientation: "diagonal",
    baseItem: "iron_pickaxe",
    parts: (p) => {
      const top = 16 + 3 * p.length;
      const w = 7.2 * p.width;
      return [
        prof("wood", 1.0, top + 0.5, constW(0.55), { shade: "wood", mat: "grip" }),
        poly("head", [
          [top - 1.5, -w], [top + 1.6, -w * 0.6], [top + 2.2, 0], [top + 1.6, w * 0.6],
          [top - 1.5, w], [top + 0.2, 0],
        ], { depth: 0.7, mat: "primary" }),
        ...(p.ornate >= 1 ? [disc("gem", top + 0.8, 0, 0.7, { z: 5 })] : []),
        ...(p.ornate >= 2 ? [prof("trim", top - 3, top - 2.3, constW(0.9), { z: 2 })] : []),
      ];
    },
  },
  {
    id: "shovel",
    name: "Shovel",
    nameJa: "シャベル",
    category: "tool",
    orientation: "diagonal",
    baseItem: "iron_shovel",
    parts: (p) => {
      const top = 17 + 3 * p.length;
      return [
        prof("wood", 1.0, top - 2, constW(0.55), { shade: "wood", mat: "grip" }),
        prof("head", top - 3, top + 2.4, (t) => (t > top + 0.6 ? taper(top + 0.6, top + 2.4, 2.0 * p.width, 0.9)(t) : 2.0 * p.width), { depth: 0.6 }),
        ...(p.ornate >= 1 ? [disc("gem", top - 1, 0, 0.6, { z: 5 })] : []),
      ];
    },
  },
  {
    id: "hoe",
    name: "Hoe",
    nameJa: "クワ",
    category: "tool",
    orientation: "diagonal",
    baseItem: "iron_hoe",
    parts: (p) => {
      const top = 17 + 3 * p.length;
      return [
        prof("wood", 1.0, top + 1.6, constW(0.55), { shade: "wood", mat: "grip" }),
        poly("head", [[top - 0.2, -0.3], [top + 1.5, -6 * p.width], [top + 2.6, -5.6 * p.width], [top + 2.6, -0.3]], { depth: 0.6, mat: "primary" }),
        ...(p.ornate >= 1 ? [disc("gem", top + 1.2, -1.2, 0.6, { z: 5 })] : []),
      ];
    },
  },
  {
    id: "trident",
    name: "Trident",
    nameJa: "トライデント",
    category: "melee",
    orientation: "diagonal",
    baseItem: "trident",
    parts: (p) => {
      const tip = 21.5 * Math.min(1, p.length);
      const h = tip - 6;
      const sp = 2.4 * p.guard;
      return [
        prof("pommel", 0.6, 1.6, constW(0.8)),
        prof("metal", 1.6, h, constW(0.5), { mat: "grip", shade: "round" }),
        prof("guard", h - 0.4, h + 0.8, constW(sp + 0.6), { depth: 0.8 }),
        prof("blade", h + 0.8, tip, taper(h + 0.8, tip, 0.8 * p.width, 0.15), { depth: 0.45 }),
        prof("blade", h + 0.8, tip - 1.5, taper(h + 0.8, tip - 1.5, 0.7 * p.width, 0.15), { uOff: () => -sp, depth: 0.45 }),
        prof("blade", h + 0.8, tip - 1.5, taper(h + 0.8, tip - 1.5, 0.7 * p.width, 0.15), { uOff: () => sp, depth: 0.45 }),
        ...(p.ornate >= 1 ? [disc("gem", h + 0.3, 0, 0.7, { z: 5 })] : []),
        ...(p.ornate >= 2 ? [prof("trim", 5, 5.7, constW(0.9), { z: 2 }), prof("trim", 9, 9.7, constW(0.9), { z: 2 })] : []),
      ];
    },
  },
  {
    id: "bow",
    name: "Bow",
    nameJa: "弓",
    category: "ranged",
    orientation: "diagonal",
    baseItem: "bow",
    parts: (p) => {
      // limbs curve toward negative u (top-left), string on positive side
      const L = 9.5 * p.length;
      const c = 11.5;
      const limb = (s: number): Part =>
        prof("wood", s < 0 ? c - L : c, s < 0 ? c : c + L, (t) => 0.55 + 0.35 * (1 - Math.abs(t - c) / L), {
          uOff: (t) => -Math.pow(Math.abs(t - c) / L, 2) * 3.2 * p.curve - 0.2,
          shade: "wood",
          mat: "grip",
          depth: 0.6,
        });
      return [
        limb(-1),
        limb(1),
        prof("grip", c - 1.6, c + 1.6, constW(0.8), { uOff: () => -0.2, z: 2, depth: 0.8 }),
        prof("string", c - L, c + L, constW(0.25), { uOff: () => -0.2 + 0.0, z: 0, depth: 0.2, mat: "secondary" }),
        prof("trim", c - L - 0.6, c - L + 0.6, constW(0.9), { uOff: () => -3.2 * p.curve - 0.2, z: 3 }),
        prof("trim", c + L - 0.6, c + L + 0.6, constW(0.9), { uOff: () => -3.2 * p.curve - 0.2, z: 3 }),
        ...(p.ornate >= 1 ? [disc("gem", c, -0.2, 0.7, { z: 5 })] : []),
        ...(p.ornate >= 2 ? [disc("gem", c - L * 0.55, -1.2 * p.curve - 0.2, 0.5, { z: 5 }), disc("gem", c + L * 0.55, -1.2 * p.curve - 0.2, 0.5, { z: 5 })] : []),
      ];
    },
  },
  {
    id: "crossbow",
    name: "Crossbow",
    nameJa: "クロスボウ",
    category: "ranged",
    orientation: "diagonal",
    baseItem: "crossbow",
    parts: (p) => {
      const c = 12;
      const L = 7.5 * p.width;
      return [
        prof("wood", 2, 19 * p.length, constW(0.9), { shade: "wood", mat: "grip", depth: 0.9 }),
        prof("metal", 10, 19 * p.length, constW(0.35), { mat: "secondary", z: 2 }),
        prof("trim", c - 0.6, c + 0.6, constW(L), { z: 1, depth: 0.6, mat: "primary", shade: "metal" }),
        prof("string", c - 1.2, c - 0.9, constW(L - 0.3), { z: 0, mat: "secondary", depth: 0.2 }),
        prof("grip", 4, 6, constW(1.3), { uOff: () => 1.2, z: 2 }),
        ...(p.ornate >= 1 ? [disc("gem", c + 1.5, 0, 0.7, { z: 5 })] : []),
      ];
    },
  },
  {
    id: "staff",
    name: "Staff",
    nameJa: "杖",
    category: "magic",
    orientation: "diagonal",
    baseItem: "blaze_rod",
    parts: (p) => {
      const top = 17.5 + 2 * p.length;
      const r = 1.9 * p.width;
      const parts: Part[] = [
        prof("pommel", 0.8, 1.8, constW(0.8)),
        prof("wood", 1.8, top - r, constW(0.6), { shade: "wood", mat: "grip" }),
        // claw holder
        poly("guard", [[top - r - 1.2, -0.7], [top - r + 1.8, -r - 1.0], [top + 0.5, -r - 0.6], [top - r + 0.6, -0.5]], { depth: 0.6 }),
        poly("guard", [[top - r - 1.2, 0.7], [top - r + 1.8, r + 1.0], [top + 0.5, r + 0.6], [top - r + 0.6, 0.5]], { depth: 0.6 }),
        disc("orb", top, 0, r, { z: 4, depth: 1.0 }),
      ];
      if (p.ornate >= 1) parts.push(prof("trim", 6, 6.8, constW(0.95), { z: 2 }), prof("trim", 11, 11.8, constW(0.95), { z: 2 }));
      if (p.ornate >= 2) parts.push(disc("ring", top, 0, r + 1.6, { r2: r + 1.1, z: 0, mat: "secondary", shade: "flat", depth: 0.3 }));
      if (p.ornate >= 3) parts.push(prof("spike", top + r + 0.5, top + r + 3, taper(top + r + 0.5, top + r + 3, 0.7, 0.1), { mat: "secondary" }));
      return parts;
    },
  },
  {
    id: "wand",
    name: "Wand",
    nameJa: "ワンド",
    category: "magic",
    orientation: "diagonal",
    baseItem: "stick",
    parts: (p) => {
      const top = 13 + 6 * p.length;
      return [
        prof("grip", 3, 8, constW(0.65)),
        prof("trim", 8, 8.7, constW(0.9 * p.guard), { z: 2 }),
        prof("wood", 8.7, top - 1, taper(8.7, top, 0.55, 0.3), { shade: "wood", mat: "grip" }),
        disc("gem", top, 0, 1.0 * p.width, { z: 5, depth: 0.9 }),
        ...(p.ornate >= 1 ? [disc("gem", 3.5, 0, 0.6, { z: 5 })] : []),
        ...(p.ornate >= 2 ? [prof("trim", 11.5, 12.1, constW(0.8), { z: 2 })] : []),
      ];
    },
  },
  {
    id: "scepter",
    name: "Scepter / Rod",
    nameJa: "ロッド/王笏",
    category: "magic",
    orientation: "diagonal",
    baseItem: "blaze_rod",
    parts: (p) => {
      const top = 16 + 3 * p.length;
      const parts: Part[] = [
        prof("pommel", 1, 2.2, constW(1.0)),
        prof("metal", 2.2, top - 2.5, constW(0.6), { mat: "secondary", shade: "round" }),
        prof("trim", 5, 5.7, constW(1.0), { z: 2 }),
        prof("trim", top - 3.5, top - 2.5, constW(1.3 * p.guard), { z: 2 }),
        // crown prongs
        poly("guard", [[top - 2.6, -1.4], [top + 0.8, -2.8], [top + 1.6, -1.2], [top - 1.4, -0.3]]),
        poly("guard", [[top - 2.6, 1.4], [top + 0.8, 2.8], [top + 1.6, 1.2], [top - 1.4, 0.3]]),
        disc("gem", top, 0, 1.7 * p.width, { z: 5, depth: 0.9 }),
      ];
      if (p.ornate >= 2) parts.push(disc("gem", top + 0.6, -2.2, 0.5, { z: 6 }), disc("gem", top + 0.6, 2.2, 0.5, { z: 6 }));
      return parts;
    },
  },
  {
    id: "pistol",
    name: "Pistol",
    nameJa: "拳銃",
    category: "tech",
    orientation: "diagonal",
    baseItem: "crossbow",
    parts: (p) => {
      const L = 9 + 5 * p.length;
      return [
        // grip is perpendicular-ish: a poly hanging to positive u
        poly("grip", [[5, -0.2], [5.5, 4.2], [8.2, 4.2], [8.4, -0.2]], { depth: 0.9, mat: "grip", shade: "round" }),
        prof("metal", 4.5, 5 + L, constW(1.3 * p.width), { mat: "primary", depth: 0.8, shade: "metal" }),
        prof("barrel", 5 + L - 2, 5 + L + 2.5, constW(0.7), { mat: "secondary", depth: 0.6 }),
        prof("trim", 7, 7.8, constW(1.5), { z: 2 }),
        poly("guard", [[8.6, 1.4], [8.6, 3.2], [11.2, 3.2], [11.2, 1.4]], { mat: "secondary", z: 0, depth: 0.4 }),
        ...(p.ornate >= 1 ? [disc("gem", 10, -0.2, 0.6, { z: 5 })] : []),
        ...(p.ornate >= 2 ? [prof("glow", 9, 5 + L - 2.2, constW(0.3), { uOff: () => -0.9, z: 3, depth: 0.5 })] : []),
      ];
    },
  },
  {
    id: "rifle",
    name: "Rifle",
    nameJa: "ライフル",
    category: "tech",
    orientation: "diagonal",
    baseItem: "crossbow",
    parts: (p) => [
      poly("grip", [[1, -1.2], [1, 2.4], [6, 2.6], [7, 0.2]], { depth: 0.9, mat: "grip", shade: "wood" }),
      prof("metal", 6, 15 + 4 * p.length, constW(1.1 * p.width), { mat: "primary", depth: 0.8 }),
      prof("barrel", 15 + 4 * p.length, 20.5 + 1.2 * p.length, constW(0.5), { mat: "secondary", depth: 0.5 }),
      poly("grip", [[7.2, 1.0], [7.6, 3.4], [9.4, 3.4], [9.6, 1.0]], { mat: "grip", depth: 0.8, shade: "round" }),
      prof("trim", 9.5, 12.5, constW(1.6), { uOff: () => -0.6, z: 2, depth: 0.9 }), // scope
      prof("trim", 13.5, 15.5, constW(0.9), { uOff: () => 1.2, z: 2, depth: 0.6 }), // magazine
      ...(p.ornate >= 1 ? [disc("gem", 11, -1.6, 0.6, { z: 5 })] : []),
      ...(p.ornate >= 2 ? [prof("glow", 12.5, 18.5, constW(0.25), { uOff: () => -1.2, z: 3 })] : []),
    ],
  },
  {
    id: "railgun",
    name: "Railgun",
    nameJa: "レールガン",
    category: "tech",
    orientation: "diagonal",
    baseItem: "crossbow",
    parts: (p) => {
      const end = 20.5 + 1.2 * p.length;
      const sep = 1.6 * p.width;
      return [
        poly("grip", [[1.5, -1.0], [1.5, 2.2], [6, 2.6], [6.6, 0.4]], { depth: 0.9, mat: "grip", shade: "round" }),
        prof("metal", 5.5, 12, constW(1.9 * p.width), { mat: "primary", depth: 1.0 }),
        poly("grip", [[7, 1.4], [7.4, 4.0], [9.2, 4.0], [9.4, 1.4]], { mat: "grip", depth: 0.8, shade: "round" }),
        prof("barrel", 12, end, constW(0.6), { uOff: () => -sep, mat: "secondary", depth: 0.6 }),
        prof("barrel", 12, end, constW(0.6), { uOff: () => sep, mat: "secondary", depth: 0.6 }),
        prof("glow", 12.5, end - 0.5, constW(0.45), { z: 3, depth: 0.5 }),
        disc("gem", 9.5, -0.3, 1.3, { z: 5, depth: 1.0 }),
        prof("trim", 11.4, 12.4, constW(2.2 * p.width), { z: 2, depth: 1.0 }),
        prof("trim", end - 1.4, end - 0.6, constW(sep + 0.9), { z: 2, depth: 0.8 }),
        ...(p.ornate >= 1 ? [prof("trim", 15.5, 16.3, constW(sep + 0.9), { z: 2, depth: 0.8 })] : []),
        ...(p.ornate >= 2 ? [prof("glow", 6.5, 11, constW(0.25), { uOff: () => -1.2, z: 3 })] : []),
      ];
    },
  },
  {
    id: "chainsaw",
    name: "Chainsaw",
    nameJa: "チェーンソー",
    category: "tech",
    orientation: "diagonal",
    baseItem: "netherite_sword",
    parts: (p) => {
      const end = 19.5 + 2 * p.length;
      const parts: Part[] = [
        poly("grip", [[1, 1.2], [1.4, -2.2], [3.2, -2.4], [3.4, 1.4]], { mat: "grip", depth: 0.8, shade: "round" }),
        prof("metal", 2.5, 8.5, constW(2.2 * p.width), { mat: "primary", depth: 1.0 }),
        poly("grip", [[4.2, -2.4], [4.6, -4.6], [7.6, -4.6], [7.8, -2.4]], { mat: "grip", depth: 0.7, shade: "round", z: 0 }),
        prof("blade", 8.5, end, (t) => (t > end - 1.5 ? taper(end - 1.5, end, 1.2 * p.width, 0.5)(t) : 1.2 * p.width), { mat: "primary", depth: 0.45 }),
        prof("core", 9, end - 1, constW(0.3), { mat: "secondary", shade: "flat", z: 2, depth: 0.3 }),
        prof("trim", 8.2, 9.2, constW(1.6 * p.width), { z: 2, depth: 0.9 }),
        disc("ring", 6.2, 0.6, 1.3, { r2: 0.6, z: 3, mat: "secondary", shade: "flat" }),
      ];
      // chain teeth around blade
      for (let t = 9.5; t < end - 1; t += 1.4) {
        parts.push(
          poly("spike", [[t, -1.2 * p.width + 0.2], [t + 0.5, -1.2 * p.width - 0.9], [t + 1.0, -1.2 * p.width + 0.2]], { mat: "secondary", z: 1 }),
          poly("spike", [[t + 0.7, 1.2 * p.width - 0.2], [t + 1.2, 1.2 * p.width + 0.9], [t + 1.7, 1.2 * p.width - 0.2]], { mat: "secondary", z: 1 }),
        );
      }
      if (p.ornate >= 1) parts.push(disc("gem", 5, -0.5, 0.6, { z: 5 }));
      return parts;
    },
  },
  {
    id: "shield",
    name: "Shield",
    nameJa: "盾",
    category: "relic",
    orientation: "upright",
    baseItem: "shield",
    parts: (p) => {
      const w = 5.5 * p.width;
      const pts: [number, number][] = [];
      // heater shield outline: center u=0, t from 1 (bottom tip) to 15 (top)
      for (let i = 0; i <= 12; i++) {
        const f = i / 12;
        const ang = f * Math.PI * 0.5;
        pts.push([1.2 + Math.sin(ang) * 9.5, Math.cos(ang) * -w + (f < 0.05 ? 0 : 0)]);
      }
      pts.push([14.6, -w], [14.6, w]);
      for (let i = 12; i >= 0; i--) {
        const f = i / 12;
        const ang = f * Math.PI * 0.5;
        pts.push([1.2 + Math.sin(ang) * 9.5, Math.cos(ang) * w]);
      }
      return [
        poly("head", pts, { depth: 0.5, mat: "primary", shade: "flat", z: 1 }),
        poly("trim", [[14.6, -w], [14.6, w], [13.6, w], [13.6, -w]], { z: 2, depth: 0.6 }),
        prof("trim", 2, 14.6, constW(0.4), { z: 2, depth: 0.6, shade: "flat" }),
        poly("trim", [[8.5, -w], [8.5, w], [7.8, w], [7.8, -w]], { z: 2, depth: 0.6 }),
        disc("gem", 8.2, 0, 1.6 + 0.3 * p.ornate, { z: 5, depth: 0.9 }),
        ...(p.ornate >= 2 ? [disc("gem", 12.5, -w * 0.5, 0.6, { z: 5 }), disc("gem", 12.5, w * 0.5, 0.6, { z: 5 })] : []),
      ];
    },
  },
  {
    id: "grimoire",
    name: "Grimoire",
    nameJa: "魔導書",
    category: "magic",
    orientation: "upright",
    baseItem: "enchanted_book",
    parts: (p) => {
      const hw = 5.2 * p.width;
      const h0 = 2.5, h1 = 13.5 + p.length * 0;
      const parts: Part[] = [
        poly("cover", [[h0, -hw], [h1, -hw], [h1, hw], [h0, hw]], { mat: "primary", shade: "flat", depth: 0.8, z: 1 }),
        poly("page", [[h0 - 0.6, -hw + 1.0], [h0, -hw + 1.0], [h0, hw - 0.3], [h0 - 0.6, hw - 0.3]], { z: 0, depth: 0.7, mat: "gem", shade: "flat" }),
        poly("page", [[h0 - 0.6, hw - 0.3], [h1 - 0.5, hw - 0.3], [h1 - 0.5, hw + 0.6], [h0 - 0.6, hw + 0.6]], { z: 0, depth: 0.7, mat: "gem", shade: "flat" }),
        prof("trim", h0, h1, constW(0.5), { uOff: () => -hw + 0.6, z: 2, depth: 0.85, shade: "flat" }), // spine
        poly("trim", [[h0, -hw], [h0 + 1.1, -hw], [h0 + 1.1, hw], [h0, hw]], { z: 2, depth: 0.85 }),
        poly("trim", [[h1 - 1.1, -hw], [h1, -hw], [h1, hw], [h1 - 1.1, hw]], { z: 2, depth: 0.85 }),
        disc("gem", (h0 + h1) / 2, 0.5, 1.6 + 0.3 * p.ornate, { z: 5, depth: 1.0 }),
      ];
      if (p.ornate >= 1)
        parts.push(poly("trim", [[h0 + 2, -1.0], [h0 + 2, 1.5], [h1 - 2, 1.5], [h1 - 2, -1.0]], { z: 3, depth: 0.9, shade: "flat" }));
      if (p.ornate >= 2)
        parts.push(
          poly("trim", [[h0 + 1.1, hw - 1.6], [h1 - 1.1, hw - 1.6], [h1 - 1.1, hw - 0.6], [h0 + 1.1, hw - 0.6]], { z: 3, depth: 0.9 }), // clasp
          disc("gem", h0 + 1.6, hw - 1.0, 0.5, { z: 6 }),
          disc("gem", h1 - 1.6, hw - 1.0, 0.5, { z: 6 }),
        );
      return parts;
    },
  },
  {
    id: "magic_circle",
    name: "Magic Circle",
    nameJa: "魔法陣",
    category: "magic",
    orientation: "upright",
    baseItem: "heart_of_the_sea",
    parts: (p) => {
      const c = 8, r = 7.2 * Math.min(1, p.width);
      const parts: Part[] = [
        disc("ring", c, 0, r, { r2: r - 0.7, z: 1, mat: "glow", shade: "glow", depth: 0.3 }),
        disc("ring", c, 0, r - 1.6, { r2: r - 2.1, z: 1, mat: "glow", shade: "glow", depth: 0.3 }),
      ];
      const n = 3 + Math.min(3, p.ornate); // triangle, square, pentagon, hexagon
      const star: [number, number][] = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.PI / 2;
        star.push([c + Math.sin(a) * (r - 1.8), Math.cos(a) * (r - 1.8)]);
      }
      // polygon edges as thin quads
      for (let i = 0; i < n; i++) {
        const a = star[i], b = star[(i + (n >= 5 ? 2 : 1)) % n];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const l = Math.hypot(dx, dy) || 1;
        const nx = (-dy / l) * 0.3, ny = (dx / l) * 0.3;
        parts.push(poly("glow", [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], { z: 2, mat: "glow", shade: "glow", depth: 0.3 }));
        parts.push(disc("gem", a[0], a[1], 0.7, { z: 4, depth: 0.5 }));
      }
      parts.push(disc("gem", c, 0, 1.4 + 0.2 * p.ornate, { z: 5, depth: 0.6 }));
      return parts;
    },
  },
  {
    id: "orb",
    name: "Orb",
    nameJa: "宝珠",
    category: "magic",
    orientation: "upright",
    baseItem: "ender_eye",
    parts: (p) => [
      poly("guard", [[1.2, -3.2 * p.guard], [3.6, -1.8], [3.6, 1.8], [1.2, 3.2 * p.guard]], { depth: 0.8, z: 1 }),
      poly("guard", [[3.2, -3.6], [6.5, -4.6], [8, -2.8], [5, -1.4]], { depth: 0.6, z: 3 }),
      poly("guard", [[3.2, 3.6], [6.5, 4.6], [8, 2.8], [5, 1.4]], { depth: 0.6, z: 3 }),
      disc("orb", 9, 0, 4.6 * p.width, { z: 2, depth: 1.0 }),
      ...(p.ornate >= 1 ? [disc("gem", 2.4, 0, 0.7, { z: 5 })] : []),
      ...(p.ornate >= 2 ? [disc("ring", 9, 0, 4.6 * p.width + 1.4, { r2: 4.6 * p.width + 0.9, z: 0, mat: "secondary", shade: "flat", depth: 0.3 })] : []),
    ],
  },
  {
    id: "relic",
    name: "Relic / Amulet",
    nameJa: "レリック/護符",
    category: "relic",
    orientation: "upright",
    baseItem: "nether_star",
    parts: (p) => {
      const r = 3.2 * p.width;
      const c = 7;
      const parts: Part[] = [
        // chain loop
        disc("ring", 13, 0, 2.4, { r2: 1.7, z: 0, mat: "secondary", shade: "flat", depth: 0.4 }),
        prof("trim", 10.2, 11.6, constW(0.9), { z: 1, depth: 0.6 }),
        // diamond-shaped pendant frame
        poly("guard", [[c + r + 2.2, 0], [c, r + 2.2], [c - r - 2.2, 0], [c, -r - 2.2]], { z: 1, depth: 0.8 }),
        poly("head", [[c + r + 0.8, 0], [c, r + 0.8], [c - r - 0.8, 0], [c, -r - 0.8]], { z: 2, depth: 0.85, mat: "primary", shade: "flat" }),
        disc("gem", c, 0, r, { z: 4, depth: 1.0 }),
      ];
      if (p.ornate >= 1)
        parts.push(disc("gem", c + r + 1.5, 0, 0.6, { z: 5 }), disc("gem", c, r + 1.5, 0.6, { z: 5 }), disc("gem", c, -r - 1.5, 0.6, { z: 5 }), disc("gem", c - r - 1.5, 0, 0.6, { z: 5 }));
      if (p.ornate >= 2)
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
          parts.push(poly("spike", [[c + Math.cos(a) * (r + 1.4), Math.sin(a) * (r + 1.4)], [c + Math.cos(a) * (r + 3.6), Math.sin(a) * (r + 3.6)], [c + Math.cos(a + 0.25) * (r + 1.4), Math.sin(a + 0.25) * (r + 1.4)]], { z: 0, mat: "secondary" }));
        }
      return parts;
    },
  },
  {
    id: "claymore_ornate",
    name: "Ornate Claymore",
    nameJa: "装飾大剣",
    category: "melee",
    orientation: "diagonal",
    baseItem: "netherite_sword",
    parts: (p) => {
      const tip = 8 + 13 * p.length;
      const bw = 1.4 * p.width;
      const g = 6.6;
      return [
        prof("pommel", 0.6, 1.9, (t) => 1.1 + 0.3 * Math.sin(((t - 0.6) / 1.3) * Math.PI)),
        disc("gem", 1.2, 0, 0.6, { z: 5 }),
        prof("grip", 1.9, g, constW(0.6)),
        prof("trim", 3.2, 3.8, constW(0.95), { z: 2 }),
        prof("trim", 4.8, 5.4, constW(0.95), { z: 2 }),
        // swept guard wings
        poly("guard", [[g, -0.5], [g - 1.6, -3.6 * p.guard], [g + 0.6, -3.2 * p.guard], [g + 1.4, -0.5]], { depth: 0.9 }),
        poly("guard", [[g, 0.5], [g - 1.6, 3.6 * p.guard], [g + 0.6, 3.2 * p.guard], [g + 1.4, 0.5]], { depth: 0.9 }),
        disc("gem", g + 0.7, 0, 1.0, { z: 5 }),
        prof("blade", g + 1.4, tip, (t) => {
          const f = clamp01((t - g - 1.4) / (tip - g - 1.4));
          const notch = f > 0.12 && f < 0.2 ? 0.5 : 1;
          return (f > 0.8 ? lerp(bw, 0.25, (f - 0.8) / 0.2) : bw) * notch;
        }, { depth: 0.45 }),
        prof("core", g + 3.5, tip - 4, constW(bw * 0.3), { z: 2, depth: 0.35, mat: "secondary", shade: "flat" }),
        disc("gem", g + 2.4, 0, 0.55, { z: 5 }),
      ];
    },
  },
];

export const SHAPE_MAP = Object.fromEntries(SHAPES.map((s) => [s.id, s]));
export function getShape(id: string): Shape {
  return SHAPE_MAP[id] ?? SHAPES[0];
}
