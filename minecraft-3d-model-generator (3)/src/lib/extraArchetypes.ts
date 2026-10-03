import type { ArchetypeParams, CuboidElement, ElementMotion } from "@/db/schema";
import type {
  ArchetypeId,
  ArchetypeMeta,
  MaterialPalette,
  MaterialPresetId,
  RawBoxSpec,
} from "./voxelGenerator";

type V = [number, number, number];
type Role = CuboidElement["materialRole"];
type Grp = CuboidElement["group"];

interface BoxOpts {
  origin?: V;
  rot?: ["x" | "y" | "z", number];
  motion?: ElementMotion;
}

const cx = 8;
const cz = 8;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Small builder that normalises min/max, enforces a printable minimum thickness and prefixes ids. */
class B {
  out: RawBoxSpec[] = [];
  constructor(private prefix: string) {}

  box(id: string, name: string, group: Grp, a: V, b: V, role: Role, o: BoxOpts = {}) {
    const from: V = [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])];
    const to: V = [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])];
    for (let i = 0; i < 3; i++) {
      if (to[i] - from[i] < 0.3) {
        const mid = (from[i] + to[i]) / 2;
        from[i] = mid - 0.15;
        to[i] = mid + 0.15;
      }
    }
    this.out.push({
      id: `${this.prefix}_${id}`,
      name,
      group,
      from,
      to,
      origin: o.origin,
      rotation: o.rot ? { axis: o.rot[0], angle: o.rot[1] } : undefined,
      materialRole: role,
      motion: o.motion,
    });
  }

  /** Centered cube helper. */
  c(id: string, name: string, group: Grp, center: V, size: V, role: Role, o: BoxOpts = {}) {
    this.box(
      id,
      name,
      group,
      [center[0] - size[0] / 2, center[1] - size[1] / 2, center[2] - size[2] / 2],
      [center[0] + size[0] / 2, center[1] + size[1] / 2, center[2] + size[2] / 2],
      role,
      o
    );
  }
}

const mo = (rig: ElementMotion["rig"], p: Partial<ElementMotion> = {}): ElementMotion => ({
  rig,
  orbitTurns: 0,
  bob: 0,
  phase: 0,
  pulse: false,
  loopSeconds: 4,
  ...p,
});

/** Ring of cubes sharing one origin, so a single Y rotation orbits the whole ring. */
function ring(
  b: B,
  id: string,
  name: string,
  center: V,
  radius: number,
  count: number,
  size: V,
  role: Role,
  motion: (i: number) => ElementMotion | undefined,
  plane: "xz" | "xy" = "xz",
  group: Grp = "float"
) {
  for (let i = 0; i < count; i++) {
    const th = (i / count) * Math.PI * 2;
    const p: V =
      plane === "xz"
        ? [center[0] + Math.cos(th) * radius, center[1], center[2] + Math.sin(th) * radius]
        : [center[0] + Math.cos(th) * radius, center[1] + Math.sin(th) * radius, center[2]];
    b.c(`${id}_${i}`, `${name} ${i + 1}`, group, p, size, role, { origin: center, motion: motion(i) });
  }
}

/** Four prongs leaning outward, like a crown or claw. */
function prongs(b: B, id: string, y: number, h: number, span: number, role: Role) {
  const list: Array<[string, number, number, "x" | "z", number]> = [
    ["w", -1, 0, "z", 22.5],
    ["e", 1, 0, "z", -22.5],
    ["n", 0, -1, "x", -22.5],
    ["s", 0, 1, "x", 22.5],
  ];
  for (const [k, sx, sz, axis, angle] of list) {
    const x = cx + sx * span;
    const z = cz + sz * span;
    b.box(`${id}_${k}`, `Prong ${k.toUpperCase()}`, "guard", [x - 0.38, y, z - 0.38], [x + 0.38, y + h, z + 0.38], role, {
      origin: [x, y + 0.3, z],
      rot: [axis, angle],
    });
  }
}

function wrappedGrip(b: B, y0: number, h: number, w: number, d: number, bands: number) {
  b.box("grip", "Grip Core", "grip", [cx - w / 2, y0, cz - d / 2], [cx + w / 2, y0 + h, cz + d / 2], "handle");
  for (let i = 0; i < bands; i++) {
    const y = y0 + 0.4 + (i * (h - 0.8)) / Math.max(1, bands - 1);
    b.box(`wrap_${i}`, `Grip Wrap #${i + 1}`, "grip", [cx - w / 2 - 0.15, y - 0.22, cz - d / 2 - 0.15], [cx + w / 2 + 0.15, y + 0.22, cz + d / 2 + 0.15], i % 2 === 0 ? "trim" : "handle");
  }
}

// ─────────────────────────────────────────── 禍々しい: 魔剣「禍津」
function cursedBlade(p: ArchetypeParams): RawBoxSpec[] {
  const b = new B("cur");
  const L = clamp(p.bladeLength, 8, 22);
  const W = clamp(p.bladeWidth, 2, 6);
  const G = clamp(p.guardWidth, 4, 12);
  const hd = clamp(p.voxelDepth, 0.8, 3) / 2;

  b.c("skull", "Skull Pommel", "pommel", [cx, 1.3, cz], [2.6, 2.0, hd * 2.6], "trim");
  b.c("jaw", "Skull Jaw", "pommel", [cx, 0.35, cz], [1.8, 0.6, hd * 2.2], "trim");
  for (const s of [-1, 1]) {
    b.c(`socket_${s}`, `Eye Socket ${s < 0 ? "L" : "R"}`, "pommel", [cx + s * 0.6, 1.5, cz + hd * 1.3], [0.5, 0.5, 0.36], "core", {
      motion: mo("core", { pulse: true, loopSeconds: 2 }),
    });
  }
  b.box("grip", "Bone Grip", "grip", [cx - 0.6, 2.2, cz - hd * 0.7], [cx + 0.6, 6.6, cz + hd * 0.7], "handle");
  for (let i = 0; i < 4; i++) {
    const y = 2.6 + i * 1.05;
    b.box(`vert_${i}`, `Vertebra #${i + 1}`, "grip", [cx - 0.85, y, cz - hd * 0.9], [cx + 0.85, y + 0.45, cz + hd * 0.9], "trim");
  }

  const gy = 6.6;
  b.box("guard", "Horned Guard", "guard", [cx - 2, gy, cz - hd * 1.4], [cx + 2, gy + 1.6, cz + hd * 1.4], "trim");
  for (const s of [-1, 1]) {
    const tag = s < 0 ? "L" : "R";
    b.box(`horn_${tag}`, `Demon Horn ${tag}`, "guard", [cx + s * 1.6, gy + 0.4, cz - 0.45], [cx + s * (G / 2 + 0.6), gy + 1.3, cz + 0.45], "edge", {
      origin: [cx + s * 1.8, gy + 0.8, cz],
      rot: ["z", s * 22.5],
    });
    b.box(`horn_tip_${tag}`, `Horn Tip ${tag}`, "guard", [cx + s * (G / 2 + 0.4), gy + 1.2, cz - 0.3], [cx + s * (G / 2 + 1.4), gy + 2.8, cz + 0.3], "edge", {
      origin: [cx + s * (G / 2 + 0.9), gy + 1.2, cz],
      rot: ["z", -s * 22.5],
    });
    b.box(`thorn_${tag}`, `Down Thorn ${tag}`, "guard", [cx + s * 1.3, gy - 1.4, cz - 0.3], [cx + s * 1.9, gy + 0.1, cz + 0.3], "edge", {
      rot: ["z", s * 22.5],
    });
  }
  b.c("eye", "Abyss Eye", "detail", [cx, gy + 0.8, cz + hd * 1.4 + 0.2], [1.6, 1.2, 0.5], "gem");
  b.c("iris", "Slit Iris", "detail", [cx, gy + 0.8, cz + hd * 1.4 + 0.5], [0.4, 1.0, 0.36], "core", {
    motion: mo("core", { scalePulse: 0.22, pulse: true, loopSeconds: 1.6 }),
  });

  const by = gy + 1.6;
  const n = 6;
  const seg = L / n;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const w = (W * (1 - t * 0.55)) / 2;
    const off = (i % 2 === 0 ? 0.3 : -0.3) * (1 - t);
    const y0 = by + i * seg;
    b.box(`blade_${i}`, `Jagged Blade #${i + 1}`, "blade", [cx - w + off, y0, cz - hd * 0.7], [cx + w + off, y0 + seg + 0.1, cz + hd * 0.7], "primary");
    const side = i % 2 === 0 ? 1 : -1;
    const ex = cx + side * (w + Math.abs(off));
    b.box(`fang_${i}`, `Edge Fang #${i + 1}`, "blade", [ex - 0.45, y0 + seg * 0.2, cz - hd * 0.35], [ex + 0.45, y0 + seg * 0.2 + 1.0, cz + hd * 0.35], "edge", {
      rot: ["z", -side * 45],
    });
  }
  b.box("vein", "Corrupted Vein", "detail", [cx - 0.22, by + 0.4, cz - hd * 0.85], [cx + 0.22, by + L * 0.85, cz + hd * 0.85], "core", {
    motion: mo("core", { pulse: true, loopSeconds: 2.2 }),
  });
  b.box("tip", "Rending Tip", "blade", [cx - 0.6, by + L, cz - hd * 0.4], [cx + 0.6, by + L + 1.6, cz + hd * 0.4], "edge", { rot: ["z", 45] });
  for (let i = 0; i < 3; i++) {
    const y = by + 2 + i * L * 0.25;
    b.box(`spine_${i}`, `Spine Thorn #${i + 1}`, "detail", [cx - 0.25, y, cz - hd * 0.7 - 0.9], [cx + 0.25, y + 0.9, cz - hd * 0.7], "edge", { rot: ["x", -22.5] });
  }
  ring(b, "chain_a", "Bound Chain A", [cx, by + L * 0.35, cz], W / 2 + 2.2, 8, [0.55, 0.35, 0.55], "trim", (i) =>
    mo("orbit_a", { orbitTurns: 1, bob: 0.25, phase: i / 8, loopSeconds: 5 })
  );
  ring(b, "chain_b", "Bound Chain B", [cx, by + L * 0.62, cz], W / 2 + 1.6, 6, [0.5, 0.35, 0.5], "trim", (i) =>
    mo("orbit_b", { orbitTurns: -1, bob: 0.3, phase: i / 6, loopSeconds: 5 })
  );
  return b.out;
}

// ─────────────────────────────────────────── ブラッド: 鮮血の大鎌
function bloodScythe(p: ArchetypeParams): RawBoxSpec[] {
  const b = new B("bld");
  const L = clamp(p.bladeLength, 10, 22);
  const hd = clamp(p.voxelDepth, 0.8, 3) / 2;
  const top = Math.min(26, 8 + L);

  b.c("butt", "Blood Spike Butt", "pommel", [cx, 0.8, cz], [1.0, 1.6, 1.0], "edge", { rot: ["y", 45] });
  b.box("shaft", "Bone-Iron Shaft", "shaft", [cx - 0.6, 1.4, cz - 0.6], [cx + 0.6, top, cz + 0.6], "handle");
  b.box("artery", "Arterial Line", "detail", [cx - 0.2, 2, cz + 0.55], [cx + 0.2, top - 0.6, cz + 0.85], "core", {
    motion: mo("core", { pulse: true, loopSeconds: 1.1 }),
  });
  for (let i = 0; i < 3; i++) {
    const y = 3 + i * 1.3;
    b.box(`band_${i}`, `Grip Band #${i + 1}`, "grip", [cx - 0.85, y, cz - 0.85], [cx + 0.85, y + 0.5, cz + 0.85], "trim");
  }
  for (let i = 0; i < 2; i++) {
    const y = top * 0.55 + i * 3;
    b.box(`rib_${i}`, `Rib Ring #${i + 1}`, "shaft", [cx - 0.9, y, cz - 0.9], [cx + 0.9, y + 0.6, cz + 0.9], "trim");
    b.box(`rib_spike_${i}`, `Rib Spike #${i + 1}`, "detail", [cx - 2.2, y, cz - 0.25], [cx - 0.9, y + 0.5, cz + 0.25], "edge", { rot: ["z", 22.5] });
  }
  b.box("socket", "Head Socket", "head", [cx - 1.4, top - 1.2, cz - 1.2], [cx + 1.4, top + 1.2, cz + 1.2], "trim");
  b.c("heart", "Beating Heart", "detail", [cx, top + 0.1, cz + 1.45], [1.4, 1.6, 0.9], "gem", {
    motion: mo("core", { scalePulse: 0.18, pulse: true, loopSeconds: 1.1 }),
  });

  const segs = 6;
  for (let i = 0; i < segs; i++) {
    const x0 = cx + 1.2 + i * 2.0;
    const x1 = x0 + 2.2;
    const yT = top + 1.8 - i * i * 0.22;
    const h = Math.max(0.8, 2.6 - i * 0.35);
    b.box(`blade_${i}`, `Crescent Blade #${i + 1}`, "blade", [x0, yT - h, cz - hd * 0.5], [x1, yT, cz + hd * 0.5], "primary");
    b.box(`edge_${i}`, `Crimson Edge #${i + 1}`, "blade", [x0, yT - h - 0.45, cz - hd * 0.3], [x1, yT - h + 0.05, cz + hd * 0.3], "edge");
    if (i % 2 === 0) {
      b.box(`groove_${i}`, `Blood Groove #${i + 1}`, "detail", [x0 + 0.3, yT - h * 0.6, cz - hd * 0.55], [x1 - 0.3, yT - h * 0.4, cz + hd * 0.55], "core");
    }
  }
  const tipX = cx + 1.2 + segs * 2.0;
  const tipY = top + 1.8 - segs * segs * 0.22;
  b.box("tip", "Reaper Tip", "blade", [tipX - 0.3, tipY - 1.6, cz - hd * 0.3], [tipX + 1.4, tipY - 0.4, cz + hd * 0.3], "edge", { rot: ["z", -22.5] });
  b.box("back_spike", "Back Spike", "blade", [cx - 4, top - 0.2, cz - 0.4], [cx - 1.2, top + 0.8, cz + 0.4], "edge", { rot: ["z", 22.5] });
  for (let i = 0; i < 4; i++) {
    const x = cx + 3 + i * 2.4;
    const y = top - 1.2 - i * 0.9;
    b.c(`drip_${i}`, `Blood Drip #${i + 1}`, "float", [x, y, cz], [0.42, 0.6, 0.42], "core", {
      motion: mo("mote", { bob: 0.6, phase: i * 0.23, loopSeconds: 1.8, pulse: true }),
    });
  }
  return b.out;
}

// ─────────────────────────────────────────── 杖: 聖杖 / 王笏
function scepter(p: ArchetypeParams): RawBoxSpec[] {
  const b = new B("sct");
  const L = clamp(p.bladeLength, 10, 22);
  const top = Math.min(24, 6 + L);

  b.c("pommel", "Orb Pommel", "pommel", [cx, 1.0, cz], [1.6, 1.6, 1.6], "gem", { rot: ["y", 45] });
  b.box("shaft", "Gilded Shaft", "shaft", [cx - 0.55, 1.6, cz - 0.55], [cx + 0.55, top, cz + 0.55], "handle");
  for (let i = 0; i < 5; i++) {
    const y = 2.5 + (i * (top - 4)) / 5;
    b.box(`band_${i}`, `Gold Band #${i + 1}`, "shaft", [cx - 0.85, y, cz - 0.85], [cx + 0.85, y + 0.5, cz + 0.85], "trim");
    if (i % 2 === 1) b.c(`stud_${i}`, `Sapphire Stud #${i + 1}`, "detail", [cx, y + 0.25, cz + 0.95], [0.45, 0.45, 0.36], "gem");
  }
  b.box("collar", "Crown Collar", "guard", [cx - 1.5, top - 0.4, cz - 1.5], [cx + 1.5, top + 0.8, cz + 1.5], "trim");
  prongs(b, "arm", top + 0.6, 4, 1.6, "trim");
  b.c("gem", "Sanctum Gem", "detail", [cx, top + 3.0, cz], [1.8, 2.4, 1.8], "gem", {
    motion: mo("core", { spin: { axis: "y", turns: 1 }, pulse: true, loopSeconds: 6 }),
  });
  b.box("cross_v", "Cross Upright", "detail", [cx - 0.35, top + 4.8, cz - 0.35], [cx + 0.35, top + 7.4, cz + 0.35], "trim");
  b.box("cross_h", "Cross Bar", "detail", [cx - 1.3, top + 6.2, cz - 0.3], [cx + 1.3, top + 6.8, cz + 0.3], "trim");
  for (const s of [-1, 1]) {
    const tag = s < 0 ? "L" : "R";
    for (let k = 0; k < 3; k++) {
      const len = 3 - k * 0.7;
      const y = top + 1.6 + k * 0.9;
      b.box(`wing_${tag}_${k}`, `Seraph Feather ${tag}${k + 1}`, "detail", [cx + s * 1.8, y, cz - 0.25], [cx + s * (1.8 + len), y + 0.8, cz + 0.25], k === 0 ? "edge" : "trim", {
        origin: [cx + s * 1.8, y + 0.4, cz],
        rot: ["z", s * 22.5],
      });
    }
  }
  ring(b, "halo", "Holy Halo", [cx, top + 3.2, cz], 3.2, 10, [0.6, 0.3, 0.6], "trim", (i) =>
    mo("halo", { orbitTurns: 1, bob: 0.15, phase: i / 10, loopSeconds: 6, pulse: true })
  );
  return b.out;
}

// ─────────────────────────────────────────── 魔導書 + 魔法陣
function grimoire(p: ArchetypeParams): RawBoxSpec[] {
  const b = new B("grm");
  const W = clamp(p.bladeWidth * 2.4, 6, 10);
  const H = clamp(p.bladeLength * 0.7, 8, 13);
  const T = clamp(p.voxelDepth * 2, 2.4, 4.4);
  const y0 = 4;
  const x0 = cx - W / 2;
  const midY = y0 + H / 2;

  b.box("cover_back", "Back Cover", "head", [x0, y0, cz - T / 2], [x0 + W, y0 + H, cz - T / 2 + 0.5], "handle");
  b.box("cover_front", "Front Cover", "head", [x0, y0, cz + T / 2 - 0.5], [x0 + W, y0 + H, cz + T / 2], "handle");
  b.box("pages", "Page Block", "detail", [x0 + 0.4, y0 + 0.35, cz - T / 2 + 0.5], [x0 + W - 0.2, y0 + H - 0.35, cz + T / 2 - 0.5], "edge");
  b.box("spine", "Leather Spine", "shaft", [x0 - 0.5, y0 - 0.1, cz - T / 2 - 0.1], [x0 + 0.4, y0 + H + 0.1, cz + T / 2 + 0.1], "trim");
  for (let i = 0; i < 3; i++) {
    const y = y0 + 1.5 + (i * (H - 3)) / 2;
    b.box(`spine_band_${i}`, `Spine Band #${i + 1}`, "shaft", [x0 - 0.7, y, cz - T / 2 - 0.2], [x0 - 0.3, y + 0.5, cz + T / 2 + 0.2], "trim");
  }
  for (const [k, yy] of [["b", y0 + 0.6], ["t", y0 + H - 0.6]] as const) {
    for (const zs of [-1, 1]) {
      b.c(`corner_${k}_${zs}`, `Corner Guard ${k}${zs}`, "guard", [x0 + W - 0.55, yy, cz + zs * (T / 2 + 0.05)], [1.3, 1.3, 0.4], "trim");
    }
  }
  b.box("clasp", "Iron Clasp", "guard", [x0 + W - 0.2, midY - 0.8, cz - T / 2 - 0.2], [x0 + W + 0.6, midY + 0.8, cz + T / 2 + 0.2], "trim");
  b.c("lock", "Soul Lock", "detail", [x0 + W + 0.75, midY, cz], [0.5, 1.0, 1.0], "gem");
  b.c("sigil", "Cover Sigil", "detail", [cx, midY, cz + T / 2 + 0.18], [2.6, 2.6, 0.36], "core", {
    rot: ["z", 45],
    motion: mo("core", { pulse: true, loopSeconds: 3 }),
  });
  b.c("sigil_eye", "Sigil Eye", "detail", [cx, midY, cz + T / 2 + 0.4], [1.0, 1.0, 0.36], "gem", {
    motion: mo("core", { scalePulse: 0.15, pulse: true, loopSeconds: 2 }),
  });
  for (let i = 0; i < 2; i++) {
    b.box(`ribbon_${i}`, `Bookmark Ribbon #${i + 1}`, "detail", [cx + 0.6 + i * 1.1, y0 - 2.2, cz - 0.2], [cx + 1.0 + i * 1.1, y0 + 0.4, cz + 0.2], "core", {
      origin: [cx + 0.8 + i * 1.1, y0 + 0.4, cz],
      motion: mo("mote", { bob: 0.15, phase: i * 0.4, loopSeconds: 3 }),
    });
  }
  for (let i = 0; i < 3; i++) {
    b.c(`page_${i}`, `Floating Page #${i + 1}`, "float", [cx + (i - 1) * 2.8, y0 + H + 2.2 + (i % 2) * 0.6, cz], [2.2, 2.8, 0.36], "edge", {
      motion: mo("mote", { bob: 0.5, phase: i / 3, spin: { axis: "y", turns: i % 2 === 0 ? 1 : -1 }, loopSeconds: 4 }),
    });
  }
  ring(b, "circle_outer", "Magic Circle Outer", [cx, midY, cz], W * 0.9, 16, [0.7, 0.3, 0.7], "core", (i) =>
    mo("magic_circle", { orbitTurns: 1, pulse: true, loopSeconds: 8, phase: i / 16 })
  );
  ring(b, "circle_inner", "Magic Circle Inner", [cx, midY, cz], W * 0.65, 8, [0.5, 0.3, 0.5], "gem", (i) =>
    mo("magic_circle", { orbitTurns: -1, pulse: true, loopSeconds: 8, phase: i / 8 })
  );
  ring(b, "glyph", "Rune Glyph", [cx, midY + 0.8, cz], W * 0.9, 4, [0.4, 1.2, 0.4], "trim", () =>
    mo("magic_circle", { orbitTurns: 1, loopSeconds: 8 })
  );
  ring(b, "gyro", "Gyro Circle", [cx, midY, cz], W * 0.95 + 0.6, 12, [0.5, 0.5, 0.4], "trim", (i) =>
    mo("halo", { orbitTurns: 1, pulse: true, loopSeconds: 8, phase: i / 12 }), "xy"
  );
  return b.out;
}

// ─────────────────────────────────────────── 弓
function bow(p: ArchetypeParams): RawBoxSpec[] {
  const b = new B("bow");
  const L = clamp(p.bladeLength, 10, 22);
  const gy = 13;
  const segLen = (L * 0.55) / 5;
  const angles = [0, 0, 22.5, 22.5, 45];

  b.box("grip", "Leather Grip", "grip", [cx - 0.7, gy - 1.6, cz - 0.7], [cx + 0.7, gy + 1.6, cz + 0.7], "handle");
  for (const s of [-1, 1]) b.box(`grip_wrap_${s}`, `Grip Wrap ${s}`, "grip", [cx - 0.85, gy + s * 1.1 - 0.2, cz - 0.85], [cx + 0.85, gy + s * 1.1 + 0.2, cz + 0.85], "trim");
  b.box("riser_u", "Upper Riser", "guard", [cx - 0.8, gy + 1.6, cz - 0.6], [cx + 0.6, gy + 3.2, cz + 0.6], "trim");
  b.box("riser_l", "Lower Riser", "guard", [cx - 0.8, gy - 3.2, cz - 0.6], [cx + 0.6, gy - 1.6, cz + 0.6], "trim");
  b.c("riser_gem", "Riser Gem", "detail", [cx, gy + 2.4, cz + 0.7], [0.6, 0.8, 0.36], "gem");
  b.box("rest", "Arrow Rest", "detail", [cx + 0.6, gy - 0.1, cz - 0.3], [cx + 1.0, gy + 0.3, cz + 0.3], "trim");

  let ux = cx - 0.1;
  let uy = gy + 3.2;
  let lx = cx - 0.1;
  let ly = gy - 3.2;
  for (let i = 0; i < 5; i++) {
    const ang = angles[i];
    const rad = (ang * Math.PI) / 180;
    const role: Role = i === 4 ? "edge" : "primary";
    b.box(`limb_u_${i}`, `Upper Limb #${i + 1}`, "blade", [ux - 0.45, uy, cz - 0.4], [ux + 0.45, uy + segLen, cz + 0.4], role, {
      origin: [ux, uy, cz],
      rot: ["z", ang],
    });
    b.box(`limb_l_${i}`, `Lower Limb #${i + 1}`, "blade", [lx - 0.45, ly - segLen, cz - 0.4], [lx + 0.45, ly, cz + 0.4], role, {
      origin: [lx, ly, cz],
      rot: ["z", -ang],
    });
    if (i > 0 && i < 4) {
      b.box(`inlay_u_${i}`, `Rune Inlay U${i}`, "detail", [ux - 0.2, uy + 0.2, cz + 0.4], [ux + 0.2, uy + segLen - 0.2, cz + 0.7], "core", { origin: [ux, uy, cz], rot: ["z", ang] });
      b.box(`inlay_l_${i}`, `Rune Inlay L${i}`, "detail", [lx - 0.2, ly - segLen + 0.2, cz + 0.4], [lx + 0.2, ly - 0.2, cz + 0.7], "core", { origin: [lx, ly, cz], rot: ["z", -ang] });
    }
    ux -= Math.sin(rad) * segLen;
    uy += Math.cos(rad) * segLen;
    lx -= Math.sin(rad) * segLen;
    ly -= Math.cos(rad) * segLen;
  }
  b.box("tip_u", "Upper Recurve Hook", "blade", [ux - 0.35, uy - 0.2, cz - 0.35], [ux + 0.35, uy + 1.2, cz + 0.35], "trim", { origin: [ux, uy, cz], rot: ["z", -22.5] });
  b.box("tip_l", "Lower Recurve Hook", "blade", [lx - 0.35, ly - 1.2, cz - 0.35], [lx + 0.35, ly + 0.2, cz + 0.35], "trim", { origin: [lx, ly, cz], rot: ["z", 22.5] });

  const half = (uy - ly) / 2;
  const draw = 2.9;
  const drawDeg = (Math.atan(draw / half) * 180) / Math.PI;
  b.box("string_u", "Bowstring Upper", "detail", [ux - 0.15, uy - half, cz - 0.15], [ux + 0.15, uy, cz + 0.15], "edge", {
    origin: [ux, uy, cz],
    motion: mo("transform_slide", { transformDelta: { rotation: [0, 0, -drawDeg] } }),
  });
  b.box("string_l", "Bowstring Lower", "detail", [lx - 0.15, ly, cz - 0.15], [lx + 0.15, ly + half, cz + 0.15], "edge", {
    origin: [lx, ly, cz],
    motion: mo("transform_slide", { transformDelta: { rotation: [0, 0, drawDeg] } }),
  });
  const nockX = ux;
  const arrowMotion = () => mo("transform_slide", { transformDelta: { translation: [-draw, 0, 0] } });
  b.box("arrow", "Nocked Arrow Shaft", "detail", [nockX, gy - 0.05, cz - 0.15], [cx + 5, gy + 0.3, cz + 0.15], "trim", { motion: arrowMotion() });
  b.box("arrow_head", "Broadhead", "detail", [cx + 5, gy - 0.3, cz - 0.3], [cx + 6.2, gy + 0.6, cz + 0.3], "edge", { motion: arrowMotion() });
  for (const s of [-1, 1]) {
    b.box(`fletch_${s}`, `Fletching ${s}`, "detail", [nockX + 0.2, gy + 0.3 * s, cz - 0.15], [nockX + 1.6, gy + 0.3 * s + 0.5 * s, cz + 0.15], "core", { motion: arrowMotion() });
  }
  return b.out;
}

// ─────────────────────────────────────────── 近代: アサルトライフル
function assaultRifle(p: ArchetypeParams): RawBoxSpec[] {
  const b = new B("ar");
  const hd = clamp(p.voxelDepth, 1.2, 2.4) / 2;
  const L = clamp(p.bladeLength, 10, 22);
  const hgTop = 12 + L * 0.42;
  const bTop = hgTop + L * 0.3;

  b.box("buttplate", "Rubber Buttplate", "pommel", [cx - 2.2, 0.4, cz - hd], [cx + 1.6, 1.0, cz + hd], "handle");
  b.box("stock", "Collapsible Stock", "pommel", [cx - 1.8, 1, cz - hd * 0.8], [cx + 1.2, 5, cz + hd * 0.8], "handle");
  b.box("cheek", "Cheek Riser", "pommel", [cx + 1.2, 2.5, cz - hd * 0.6], [cx + 1.8, 4.6, cz + hd * 0.6], "trim");
  b.box("buffer", "Buffer Tube", "shaft", [cx - 0.5, 5, cz - 0.5], [cx + 0.5, 6, cz + 0.5], "trim");
  b.box("lower", "Lower Receiver", "head", [cx - 1.4, 6, cz - hd], [cx + 1.0, 12, cz + hd], "primary");
  b.box("upper", "Upper Receiver", "head", [cx + 1.0, 6, cz - hd * 0.85], [cx + 2.0, 12.4, cz + hd * 0.85], "primary");
  b.box("rail", "Picatinny Rail", "guard", [cx + 2.0, 6.4, cz - 0.45], [cx + 2.4, hgTop - 1, cz + 0.45], "trim");
  for (let i = 0; i < 5; i++) {
    const y = 7 + (i * (hgTop - 8.5)) / 5;
    b.box(`notch_${i}`, `Rail Notch #${i + 1}`, "guard", [cx + 2.4, y, cz - 0.4], [cx + 2.7, y + 0.4, cz + 0.4], "trim");
  }
  b.box("pistol_grip", "Pistol Grip", "grip", [cx - 4.6, 6.6, cz - 0.6], [cx - 1.4, 8.2, cz + 0.6], "handle", { origin: [cx - 1.4, 7.4, cz], rot: ["z", -22.5] });
  b.box("trigger_guard", "Trigger Guard", "guard", [cx - 2.6, 8.4, cz - 0.25], [cx - 1.4, 10, cz + 0.25], "trim");
  b.box("trigger", "Trigger", "detail", [cx - 2.2, 8.9, cz - 0.2], [cx - 1.4, 9.3, cz + 0.2], "edge");
  b.box("magazine", "Curved Magazine", "detail", [cx - 5.6, 9.6, cz - 0.7], [cx - 1.4, 11.6, cz + 0.7], "trim", { origin: [cx - 1.4, 10.6, cz], rot: ["z", 22.5] });
  b.box("mag_window", "Round Counter", "detail", [cx - 4.4, 10, cz + 0.7], [cx - 2.4, 11.2, cz + 1.0], "core", { origin: [cx - 1.4, 10.6, cz], rot: ["z", 22.5] });
  b.box("charging", "Charging Handle", "detail", [cx + 0.2, 10.2, cz + hd], [cx + 1.0, 11.4, cz + hd + 0.6], "edge", {
    motion: mo("transform_slide", { transformDelta: { translation: [0, -1.6, 0] } }),
  });
  b.box("port", "Ejection Port", "detail", [cx + 1.0, 9, cz + hd * 0.86], [cx + 1.6, 11, cz + hd + 0.05], "core");
  b.box("handguard", "Free-Float Handguard", "shaft", [cx - 1.2, 12, cz - hd], [cx + 1.8, hgTop, cz + hd], "handle");
  for (let i = 0; i < 3; i++) {
    const y = 13 + (i * (hgTop - 14.5)) / 2;
    for (const zs of [-1, 1]) {
      b.box(`vent_${i}_${zs}`, `M-LOK Slot ${i + 1}`, "detail", [cx - 0.6, y, zs > 0 ? cz + hd : cz - hd - 0.3], [cx + 1.2, y + 0.6, zs > 0 ? cz + hd + 0.3 : cz - hd], "trim");
    }
  }
  b.box("foregrip", "Vertical Foregrip", "guard", [cx - 3.4, hgTop - 4, cz - 0.55], [cx - 1.2, hgTop - 2.9, cz + 0.55], "handle");
  b.box("laser", "Laser Module", "detail", [cx + 0.2, hgTop - 2.5, cz - hd - 0.6], [cx + 1.2, hgTop - 0.9, cz - hd], "trim");
  b.box("laser_lens", "Laser Emitter", "detail", [cx + 0.35, hgTop - 0.9, cz - hd - 0.5], [cx + 1.05, hgTop - 0.6, cz - hd - 0.1], "core", { motion: mo("core", { pulse: true, loopSeconds: 1.5 }) });
  b.box("barrel", "Chrome-Lined Barrel", "blade", [cx - 0.4, hgTop, cz - 0.4], [cx + 0.4, bTop, cz + 0.4], "edge");
  b.box("gas_block", "Gas Block", "blade", [cx - 0.6, hgTop + 1, cz - 0.6], [cx + 0.6, hgTop + 1.8, cz + 0.6], "trim");
  b.box("front_sight", "Front Sight Post", "blade", [cx + 0.6, hgTop + 1.1, cz - 0.25], [cx + 1.6, hgTop + 1.7, cz + 0.25], "trim");
  b.box("muzzle", "Muzzle Brake", "blade", [cx - 0.65, bTop, cz - 0.65], [cx + 0.65, bTop + 1.5, cz + 0.65], "trim");
  b.box("scope_mount", "Scope Mount", "guard", [cx + 2.4, 9, cz - 0.4], [cx + 3.0, 10.6, cz + 0.4], "trim");
  b.box("scope", "Optic Tube", "guard", [cx + 3.0, 8, cz - 0.7], [cx + 4.4, 13.6, cz + 0.7], "primary");
  b.box("scope_lens", "Objective Lens", "detail", [cx + 3.1, 13.6, cz - 0.6], [cx + 4.3, 14, cz + 0.6], "gem");
  b.box("scope_turret", "Elevation Turret", "detail", [cx + 4.4, 10.4, cz - 0.3], [cx + 4.9, 11.2, cz + 0.3], "trim");
  return b.out;
}

// ─────────────────────────────────────────── 銃: 拳銃
function pistol(p: ArchetypeParams): RawBoxSpec[] {
  const b = new B("pst");
  const L = clamp(p.bladeLength, 6, 16);
  const top = 6 + L * 0.4;
  const slide = () => mo("transform_slide", { transformDelta: { translation: [0, -1.8, 0] } });

  b.box("frame", "Polymer Frame", "head", [cx - 1.0, 2.0, cz - 0.6], [cx + 0.6, top - 1.6, cz + 0.6], "handle");
  b.box("slide", "Machined Slide", "blade", [cx + 0.5, 1.8, cz - 0.65], [cx + 2.1, top, cz + 0.65], "primary", { motion: slide() });
  for (let i = 0; i < 4; i++) {
    b.box(`serration_${i}`, `Slide Serration #${i + 1}`, "detail", [cx + 2.1, 2.4 + i * 0.55, cz - 0.55], [cx + 2.4, 2.7 + i * 0.55, cz + 0.55], "trim", { motion: slide() });
  }
  b.box("engrave", "Slide Engraving", "detail", [cx + 0.8, 4, cz + 0.65], [cx + 1.8, top - 1.5, cz + 0.95], "core", { motion: slide() });
  b.box("rear_sight", "Rear Sight", "detail", [cx + 2.1, 2.2, cz - 0.4], [cx + 2.6, 2.8, cz + 0.4], "trim", { motion: slide() });
  b.box("front_sight", "Front Sight", "detail", [cx + 2.1, top - 1, cz - 0.2], [cx + 2.6, top - 0.4, cz + 0.2], "core", { motion: slide() });
  b.box("muzzle", "Barrel Crown", "blade", [cx + 0.9, top, cz - 0.35], [cx + 1.7, top + 0.4, cz + 0.35], "core");
  b.box("grip", "Stippled Grip", "grip", [cx - 5.2, 2.4, cz - 0.7], [cx - 1.0, 4.6, cz + 0.7], "handle", { origin: [cx - 1, 3.5, cz], rot: ["z", -22.5] });
  b.box("grip_panel", "Grip Medallion Panel", "grip", [cx - 4.6, 2.6, cz + 0.7], [cx - 1.4, 4.4, cz + 1.0], "trim", { origin: [cx - 1, 3.5, cz], rot: ["z", -22.5] });
  b.box("mag_base", "Magazine Baseplate", "pommel", [cx - 5.8, 2.5, cz - 0.6], [cx - 5.1, 4.5, cz + 0.6], "trim", { origin: [cx - 1, 3.5, cz], rot: ["z", -22.5] });
  b.box("trigger_guard", "Trigger Guard", "guard", [cx - 2.6, 4.8, cz - 0.25], [cx - 1.0, 6.6, cz + 0.25], "trim");
  b.box("trigger", "Trigger", "detail", [cx - 2.0, 5.2, cz - 0.2], [cx - 1.0, 5.6, cz + 0.2], "edge");
  b.box("hammer", "Hammer", "detail", [cx + 0.4, 0.8, cz - 0.3], [cx + 1.2, 1.8, cz + 0.3], "trim", {
    origin: [cx + 0.8, 1.8, cz],
    motion: mo("transform_slide", { transformDelta: { rotation: [0, 0, -45] } }),
  });
  b.box("accessory_rail", "Accessory Rail", "guard", [cx - 1.6, 6.4, cz - 0.5], [cx - 1.0, top - 2, cz + 0.5], "trim");
  b.c("medallion", "Grip Medallion", "detail", [cx - 3, 3.5, cz + 1.05], [0.6, 0.6, 0.36], "gem");
  return b.out;
}

// ─────────────────────────────────────────── レールガン
function railgun(p: ArchetypeParams): RawBoxSpec[] {
  const b = new B("rg");
  const L = clamp(p.bladeLength, 12, 22);
  const y0 = 11;

  b.box("stock", "Recoil Stock", "pommel", [cx - 2, 0.5, cz - 1], [cx + 1.6, 4.5, cz + 1], "handle");
  b.box("pad", "Shoulder Pad", "pommel", [cx - 2.2, 0.2, cz - 1.1], [cx + 1.8, 0.8, cz + 1.1], "trim");
  b.box("grip", "Pistol Grip", "grip", [cx - 4.6, 6, cz - 0.6], [cx - 1.6, 7.6, cz + 0.6], "handle", { origin: [cx - 1.6, 6.8, cz], rot: ["z", -22.5] });
  b.box("body", "Capacitor Housing", "head", [cx - 1.6, 4.5, cz - 1.3], [cx + 1.6, 10.5, cz + 1.3], "primary");
  for (let i = 0; i < 3; i++) {
    b.box(`cell_${i}`, `Capacitor Cell #${i + 1}`, "detail", [cx - 1.25 + i * 0.95, 5.2, cz + 1.3], [cx - 0.55 + i * 0.95, 9.6, cz + 1.9], "core", {
      motion: mo("core", { scalePulse: 0.08, pulse: true, phase: i / 3, loopSeconds: 1.5 }),
    });
  }
  for (let i = 0; i < 3; i++) {
    b.box(`fin_${i}`, `Cooling Fin #${i + 1}`, "guard", [cx - 1.4, 5 + i * 1.8, cz - 1.9], [cx + 1.4, 5.6 + i * 1.8, cz - 1.3], "trim");
  }
  b.box("housing", "Barrel Housing", "shaft", [cx - 0.9, 10.5, cz - 0.9], [cx + 0.9, y0 + L, cz + 0.9], "trim");
  for (const s of [-1, 1]) {
    const tag = s < 0 ? "L" : "R";
    const spread = () => mo("transform_slide", { transformDelta: { translation: [s * 1.1, 0, 0] } });
    b.box(`rail_${tag}`, `Magnetic Rail ${tag}`, "blade", [cx + s * 1.2, y0, cz - 0.5], [cx + s * 2.2, y0 + L + 1.5, cz + 0.5], "primary", { motion: spread() });
    b.box(`prong_${tag}`, `Muzzle Prong ${tag}`, "blade", [cx + s * 1.4, y0 + L + 1.5, cz - 0.4], [cx + s * 2.4, y0 + L + 3, cz + 0.4], "edge", {
      origin: [cx + s * 1.9, y0 + L + 1.5, cz],
      rot: ["z", -s * 22.5],
      motion: spread(),
    });
  }
  for (let i = 0; i < 5; i++) {
    const y = y0 + 0.5 + (i * L) / 5;
    b.c(`coil_${i}`, `Accelerator Coil #${i + 1}`, "detail", [cx, y + 0.3, cz], [3.6, 0.6, 2.6], "trim", {
      motion: mo("core", { spin: { axis: "y", turns: 2 }, pulse: true, phase: i / 5, loopSeconds: 2 }),
    });
  }
  b.box("slug", "Ferro Slug Core", "detail", [cx - 0.35, y0 + 1, cz - 0.35], [cx + 0.35, y0 + L, cz + 0.35], "core", {
    motion: mo("transform_barrel", { pulse: true, loopSeconds: 2, transformDelta: { translation: [0, 2.5, 0] } }),
  });
  b.box("scope", "Long Range Optic", "guard", [cx + 1.8, 7, cz - 0.6], [cx + 3.1, 13, cz + 0.6], "primary");
  b.box("scope_lens", "Optic Lens", "detail", [cx + 1.9, 13, cz - 0.5], [cx + 3.0, 13.4, cz + 0.5], "gem");
  return b.out;
}

// ─────────────────────────────────────────── レリック
function relic(p: ArchetypeParams): RawBoxSpec[] {
  const b = new B("rlc");
  const core = clamp(p.bladeWidth * 0.7, 1.6, 3);
  const cy = 11.5;

  b.c("pommel", "Ancient Pommel", "pommel", [cx, 0.6, cz], [1.4, 1.0, 1.4], "gem", { rot: ["y", 45] });
  wrappedGrip(b, 1.1, 4.9, 1.1, 1.1, 3);
  b.box("crown", "Reliquary Crown", "guard", [cx - 1.6, 6, cz - 1.6], [cx + 1.6, 7.2, cz + 1.6], "trim");
  prongs(b, "claw", 7.0, 3.5, 1.5, "trim");
  b.c("core", "Relic Heart", "detail", [cx, cy, cz], [core, core, core], "gem", {
    motion: mo("core", { spin: { axis: "y", turns: 1 }, scalePulse: 0.08, pulse: true, loopSeconds: 4 }),
  });
  b.c("core_inner", "Inner Spindle", "detail", [cx, cy, cz], [core * 0.5, core * 1.4, core * 0.5], "core", {
    motion: mo("core", { spin: { axis: "y", turns: -1 }, pulse: true, loopSeconds: 4 }),
  });
  ring(b, "ring_h", "Horizon Ring", [cx, cy, cz], core + 1.8, 10, [0.6, 0.35, 0.6], "trim", (i) =>
    mo("halo", { orbitTurns: 1, phase: i / 10, pulse: true, loopSeconds: 4 })
  );
  ring(b, "ring_v", "Meridian Ring", [cx, cy, cz], core + 2.8, 12, [0.45, 0.45, 0.45], "edge", (i) =>
    mo("halo", { orbitTurns: -1, phase: i / 12, loopSeconds: 4 }), "xy"
  );
  for (let i = 0; i < 6; i++) {
    const th = (i / 6) * Math.PI * 2;
    b.c(`shard_${i}`, `Orbiting Shard #${i + 1}`, "float", [cx + Math.cos(th) * (core + 4), cy - 1 + (i % 2) * 2, cz + Math.sin(th) * (core + 4)], [0.7, 1.1, 0.7], "gem", {
      origin: [cx, cy, cz],
      motion: mo("orbit_b", { orbitTurns: 1, bob: 0.5, phase: i / 6, loopSeconds: 4 }),
    });
  }
  const plates: Array<[number, number, V]> = [
    [0, 1, [0.9, 1.4, 0.36]],
    [0, -1, [0.9, 1.4, 0.36]],
    [1, 0, [0.36, 1.4, 0.9]],
    [-1, 0, [0.36, 1.4, 0.9]],
  ];
  plates.forEach(([sx, sz, size], i) => {
    b.c(`plate_${i}`, `Rune Plate #${i + 1}`, "float", [cx + sx * (core / 2 + 1), cy - 2.4, cz + sz * (core / 2 + 1)], size, "core", {
      motion: mo("mote", { bob: 0.3, phase: i / 4, pulse: true, loopSeconds: 4 }),
    });
  });
  b.box("spire", "Crown Spire", "detail", [cx - 0.3, cy + core / 2 + 2, cz - 0.3], [cx + 0.3, cy + core / 2 + 4, cz + 0.3], "trim");
  ring(b, "crownlet", "Floating Crownlet", [cx, cy + core / 2 + 3, cz], 1.2, 4, [0.4, 0.6, 0.4], "trim", () =>
    mo("halo", { orbitTurns: 1, loopSeconds: 4 })
  );
  return b.out;
}

// ─────────────────────────────────────────── 超装飾スピア
function ornateSpear(p: ArchetypeParams): RawBoxSpec[] {
  const b = new B("spr");
  const L = clamp(p.bladeLength, 10, 22);
  const st = Math.min(24, 10 + L);
  const hd = clamp(p.voxelDepth, 0.8, 2.4) / 2;

  b.c("butt", "Butt Spike", "pommel", [cx, 0.6, cz], [0.9, 1.2, 0.9], "edge", { rot: ["y", 45] });
  b.box("butt_cap", "Butt Cap", "pommel", [cx - 0.8, 1.0, cz - 0.8], [cx + 0.8, 1.8, cz + 0.8], "trim");
  b.box("shaft", "Lacquered Shaft", "shaft", [cx - 0.5, 1.8, cz - 0.5], [cx + 0.5, st, cz + 0.5], "handle");
  for (let i = 0; i < 4; i++) {
    const y = 7 + i * 1.1;
    b.box(`wrap_${i}`, `Grip Wrap #${i + 1}`, "grip", [cx - 0.7, y, cz - 0.7], [cx + 0.7, y + 0.5, cz + 0.7], i % 2 === 0 ? "trim" : "handle");
  }
  for (let i = 0; i < 5; i++) {
    const y = 3 + (i * (st - 5)) / 5;
    if (y > 6.5 && y < 11.5) continue;
    b.box(`band_${i}`, `Gilded Band #${i + 1}`, "shaft", [cx - 0.8, y, cz - 0.8], [cx + 0.8, y + 0.6, cz + 0.8], "trim");
    for (const zs of [-1, 1]) b.c(`stud_${i}_${zs}`, `Ruby Stud ${i + 1}`, "detail", [cx, y + 0.3, cz + zs * 0.95], [0.45, 0.45, 0.36], "gem");
  }
  for (let i = 0; i < 6; i++) {
    const th = i * 1.1;
    const y = 12.5 + i * ((st - 14) / 6);
    b.c(`spiral_${i}`, `Spiral Inlay #${i + 1}`, "detail", [cx + Math.cos(th) * 0.55, y, cz + Math.sin(th) * 0.55], [0.36, 0.8, 0.36], "core");
  }
  const sway = () => mo("mote", { bob: 0.12, loopSeconds: 3 });
  b.box("banner", "War Banner", "detail", [cx + 0.5, st - 6, cz - 0.18], [cx + 3.4, st - 2.2, cz + 0.18], "trim", { motion: sway() });
  b.c("emblem", "Banner Emblem", "detail", [cx + 1.95, st - 4.1, cz + 0.36], [1.0, 1.0, 0.36], "gem", { motion: sway() });
  b.box("banner_tail_a", "Banner Tail A", "detail", [cx + 0.6, st - 7, cz - 0.16], [cx + 1.6, st - 6, cz + 0.16], "trim", { motion: sway() });
  b.box("banner_tail_b", "Banner Tail B", "detail", [cx + 2.3, st - 7, cz - 0.16], [cx + 3.3, st - 6, cz + 0.16], "trim", { motion: sway() });
  b.box("collar", "Head Collar", "guard", [cx - 1.2, st, cz - 1.2], [cx + 1.2, st + 1.4, cz + 1.2], "trim");
  for (let i = 0; i < 4; i++) {
    const th = (i / 4) * Math.PI * 2;
    b.c(`collar_gem_${i}`, `Collar Gem #${i + 1}`, "detail", [cx + Math.cos(th) * 1.25, st + 0.7, cz + Math.sin(th) * 1.25], [0.45, 0.6, 0.45], "gem");
  }
  for (const s of [-1, 1]) {
    const tag = s < 0 ? "L" : "R";
    b.box(`lug_${tag}`, `Wing Lug ${tag}`, "guard", [cx + s * 1.1, st + 0.3, cz - 0.35], [cx + s * 3.2, st + 1.1, cz + 0.35], "trim", {
      origin: [cx + s * 1.1, st + 0.7, cz],
      rot: ["z", s * 22.5],
    });
    b.box(`side_blade_${tag}`, `Crescent Side Blade ${tag}`, "blade", [cx + s * 2.6, st + 1.2, cz - 0.3], [cx + s * 4.2, st + 3.6, cz + 0.3], "edge", {
      rot: ["z", -s * 22.5],
    });
    b.box(`tassel_${tag}`, `Silk Tassel ${tag}`, "detail", [cx + s * 1.2 - 0.2, st - 3.2, cz - 0.2], [cx + s * 1.2 + 0.2, st, cz + 0.2], "core", {
      origin: [cx + s * 1.2, st, cz],
      motion: mo("mote", { bob: 0.2, phase: s > 0 ? 0.5 : 0, loopSeconds: 3 }),
    });
    b.c(`tassel_bead_${tag}`, `Tassel Bead ${tag}`, "detail", [cx + s * 1.2, st - 3.4, cz], [0.5, 0.5, 0.5], "gem", {
      motion: mo("mote", { bob: 0.2, phase: s > 0 ? 0.5 : 0, loopSeconds: 3 }),
    });
  }
  const widths = [2.2, 2.6, 2.2, 1.5, 0.8];
  let y = st + 1.4;
  widths.forEach((w, i) => {
    b.box(`leaf_${i}`, `Leaf Blade #${i + 1}`, "blade", [cx - w / 2, y, cz - hd * 0.6], [cx + w / 2, y + 1.3, cz + hd * 0.6], "primary");
    if (i < 4) {
      for (const s of [-1, 1]) {
        b.box(`leaf_edge_${i}_${s}`, `Leaf Edge ${i + 1}`, "blade", [cx + s * (w / 2), y + 0.1, cz - hd * 0.35], [cx + s * (w / 2 + 0.35), y + 1.2, cz + hd * 0.35], "edge");
      }
    }
    y += 1.3;
  });
  b.box("fuller", "Blade Fuller", "detail", [cx - 0.2, st + 1.6, cz - hd * 0.7], [cx + 0.2, y - 1.6, cz + hd * 0.7], "core", { motion: mo("core", { pulse: true, loopSeconds: 3 }) });
  b.box("tip", "Spear Point", "blade", [cx - 0.4, y - 0.3, cz - hd * 0.4], [cx + 0.4, y + 1.1, cz + hd * 0.4], "edge", { rot: ["z", 45] });
  ring(b, "halo", "Spear Halo", [cx, st + 3.5, cz], 3.0, 8, [0.5, 0.3, 0.5], "trim", (i) =>
    mo("halo", { orbitTurns: 1, phase: i / 8, pulse: true, loopSeconds: 6 })
  );
  return b.out;
}

// ─────────────────────────────────────────── メイス
function mace(p: ArchetypeParams): RawBoxSpec[] {
  const b = new B("mce");
  const L = clamp(p.bladeLength, 8, 20);
  const headY = Math.min(20, 6 + L * 0.75);
  const R = clamp(p.guardWidth * 0.35, 1.8, 3.4);
  const H = clamp(p.bladeWidth * 1.3, 3, 5.5);
  const mid: V = [cx, headY + H / 2, cz];

  b.c("pommel", "Flanged Pommel", "pommel", [cx, 1.0, cz], [1.6, 1.4, 1.6], "trim", { rot: ["y", 45] });
  b.c("pommel_gem", "Pommel Gem", "pommel", [cx, 0.35, cz], [0.7, 0.6, 0.7], "gem");
  wrappedGrip(b, 1.6, 4.4, 1.2, 1.2, 3);
  b.box("guard", "Guard Disc", "guard", [cx - 1.3, 6, cz - 1.3], [cx + 1.3, 6.6, cz + 1.3], "trim");
  b.box("shaft", "Iron Haft", "shaft", [cx - 0.55, 6.6, cz - 0.55], [cx + 0.55, headY, cz + 0.55], "handle");
  for (let i = 0; i < 2; i++) {
    const y = 6.6 + ((headY - 6.6) * (i + 1)) / 3;
    b.box(`haft_band_${i}`, `Haft Band #${i + 1}`, "shaft", [cx - 0.8, y, cz - 0.8], [cx + 0.8, y + 0.5, cz + 0.8], "trim");
  }
  b.box("head", "Mace Head Core", "head", [cx - 1.3, headY, cz - 1.3], [cx + 1.3, headY + H, cz + 1.3], "primary");
  b.box("band_low", "Lower Head Band", "head", [cx - 1.5, headY - 0.2, cz - 1.5], [cx + 1.5, headY + 0.4, cz + 1.5], "trim");
  b.box("band_high", "Upper Head Band", "head", [cx - 1.5, headY + H - 0.4, cz - 1.5], [cx + 1.5, headY + H + 0.2, cz + 1.5], "trim");
  const flange = (id: string, rot?: number) => {
    const o: BoxOpts = rot ? { origin: mid, rot: ["y", rot] } : {};
    b.box(`${id}_e`, `Flange ${id} E`, "blade", [cx + 1.3, headY + 0.3, cz - 0.25], [cx + 1.3 + R, headY + H - 0.3, cz + 0.25], "edge", o);
    b.box(`${id}_w`, `Flange ${id} W`, "blade", [cx - 1.3 - R, headY + 0.3, cz - 0.25], [cx - 1.3, headY + H - 0.3, cz + 0.25], "edge", o);
    b.box(`${id}_n`, `Flange ${id} N`, "blade", [cx - 0.25, headY + 0.3, cz - 1.3 - R], [cx + 0.25, headY + H - 0.3, cz - 1.3], "edge", o);
    b.box(`${id}_s`, `Flange ${id} S`, "blade", [cx - 0.25, headY + 0.3, cz + 1.3], [cx + 0.25, headY + H - 0.3, cz + 1.3 + R], "edge", o);
  };
  flange("card");
  flange("diag", 45);
  for (let i = 0; i < 4; i++) {
    const th = (i / 4) * Math.PI * 2;
    b.c(`face_gem_${i}`, `Face Gem #${i + 1}`, "detail", [cx + Math.cos(th) * 1.32, headY + H / 2, cz + Math.sin(th) * 1.32], [0.5, 0.8, 0.5], "gem");
    b.c(`crown_spike_${i}`, `Crown Spike #${i + 1}`, "detail", [cx + Math.cos(th + Math.PI / 4) * 1.1, headY + H + 0.6, cz + Math.sin(th + Math.PI / 4) * 1.1], [0.4, 0.9, 0.4], "trim");
  }
  b.box("top_spike", "Top Spike", "blade", [cx - 0.45, headY + H, cz - 0.45], [cx + 0.45, headY + H + 2.4, cz + 0.45], "edge", { rot: ["y", 45] });
  return b.out;
}

// ─────────────────────────────────────────── 機械: ドリルランス
function drillLance(p: ArchetypeParams): RawBoxSpec[] {
  const b = new B("drl");
  const L = clamp(p.bladeLength, 10, 22);
  const W = clamp(p.bladeWidth, 2.4, 6);
  const spin = (phase = 0) => mo("core", { spin: { axis: "y", turns: 4 }, loopSeconds: 1, phase });

  b.box("counterweight", "Counterweight", "pommel", [cx - 1.4, 0.4, cz - 1.4], [cx + 1.4, 1.6, cz + 1.4], "trim");
  wrappedGrip(b, 1.6, 4.8, 1.3, 1.3, 3);
  const discs: Array<[number, number, number]> = [
    [6.4, 7.2, 3.0],
    [7.2, 8.2, 5.2],
    [8.2, 9.0, 6.4],
  ];
  discs.forEach(([a, c, w], i) => {
    b.box(`vamplate_${i}`, `Vamplate Tier #${i + 1}`, "guard", [cx - w / 2, a, cz - w / 2], [cx + w / 2, c, cz + w / 2], "trim");
  });
  b.box("engine", "Drive Engine", "head", [cx - 1.6, 9, cz - 1.6], [cx + 1.6, 12, cz + 1.6], "primary");
  b.box("engine_glow", "Engine Vent Glow", "detail", [cx - 1.7, 10, cz - 1.7], [cx + 1.7, 10.6, cz + 1.7], "core", { motion: mo("core", { pulse: true, loopSeconds: 0.8 }) });
  for (const s of [-1, 1]) {
    b.box(`exhaust_${s}`, `Exhaust Stack ${s}`, "detail", [cx + s * 0.9 - 0.35, 9.4, cz - 2.6], [cx + s * 0.9 + 0.35, 11.2, cz - 1.6], "edge", { rot: ["x", -22.5] });
    b.box(`piston_${s}`, `Hydraulic Cylinder ${s}`, "detail", [cx + s * 1.6, 9.4, cz - 0.4], [cx + s * 2.4, 12, cz + 0.4], "trim");
    b.box(`rod_${s}`, `Piston Rod ${s}`, "detail", [cx + s * 1.8, 12, cz - 0.25], [cx + s * 2.2, 14, cz + 0.25], "edge", {
      motion: mo("transform_slide", { transformDelta: { translation: [0, 1.2, 0] } }),
    });
  }
  const n = 7;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const w = W * 1.5 * (1 - t) + 0.6;
    const y0 = 12 + (i * L) / n;
    const h = L / n + 0.05;
    b.box(`bit_${i}`, `Drill Bit Tier #${i + 1}`, "blade", [cx - w / 2, y0, cz - w / 2], [cx + w / 2, y0 + h, cz + w / 2], "primary", {
      origin: [cx, y0 + h / 2, cz],
      motion: spin(),
    });
    b.box(`flute_${i}`, `Spiral Flute #${i + 1}`, "blade", [cx - w / 2 - 0.25, y0, cz - 0.25], [cx + w / 2 + 0.25, y0 + h * 0.6, cz + 0.25], "edge", {
      origin: [cx, y0, cz],
      rot: ["y", i % 2 === 0 ? 45 : -45],
      motion: spin(),
    });
  }
  b.box("tip", "Carbide Tip", "blade", [cx - 0.3, 12 + L, cz - 0.3], [cx + 0.3, 13.2 + L, cz + 0.3], "edge", { origin: [cx, 12 + L, cz], motion: spin() });
  return b.out;
}

// ─────────────────────────────────────────── 魔法: 浮遊結晶の魔法剣
function crystalSpellblade(p: ArchetypeParams): RawBoxSpec[] {
  const b = new B("csb");
  const L = clamp(p.bladeLength, 8, 22);
  const W = clamp(p.bladeWidth, 2, 5);
  const G = clamp(p.guardWidth, 4, 10);
  const hd = clamp(p.voxelDepth, 0.8, 2.4) / 2;

  b.c("pommel", "Prism Pommel", "pommel", [cx, 1.0, cz], [1.4, 1.6, 1.4], "gem", { rot: ["y", 45] });
  wrappedGrip(b, 1.8, 4.4, 1.2, hd * 1.6, 3);
  for (let i = 0; i < 3; i++) b.c(`rune_${i}`, `Grip Rune #${i + 1}`, "detail", [cx, 2.6 + i * 1.3, cz + hd * 0.85], [0.4, 0.5, 0.36], "core");
  const gy = 6.2;
  b.box("guard", "Arcane Guard", "guard", [cx - 1.6, gy, cz - hd * 1.2], [cx + 1.6, gy + 1.2, cz + hd * 1.2], "trim");
  for (const s of [-1, 1]) {
    b.box(`arm_${s}`, `Guard Arm ${s}`, "guard", [cx + s * 1.4, gy + 0.2, cz - 0.35], [cx + s * (G / 2), gy + 0.9, cz + 0.35], "trim", {
      origin: [cx + s * 1.4, gy + 0.55, cz],
      rot: ["z", s * 22.5],
    });
  }
  ring(b, "guard_circle", "Guard Circle", [cx, gy + 0.6, cz], G / 2 + 0.6, 10, [0.5, 0.3, 0.5], "core", (i) =>
    mo("magic_circle", { orbitTurns: 1, phase: i / 10, pulse: true, loopSeconds: 6 })
  );
  const by = gy + 1.4;
  b.box("spine", "Mana Spine", "detail", [cx - 0.2, by, cz - 0.2], [cx + 0.2, by + L, cz + 0.2], "core", { motion: mo("core", { pulse: true, loopSeconds: 2 }) });
  const n = 5;
  const seg = L / n;
  for (let i = 0; i < n; i++) {
    const w = W * (1 - i * 0.13);
    b.c(`shard_${i}`, `Floating Blade Shard #${i + 1}`, "float", [cx, by + seg * (i + 0.5), cz], [w, seg * 0.78, Math.max(0.6, hd * 1.4)], i % 2 === 0 ? "gem" : "primary", {
      motion: mo("mote", { bob: 0.35, phase: i / n, pulse: true, loopSeconds: 3 }),
    });
    const side = i % 2 === 0 ? 1 : -1;
    b.c(`spark_${i}`, `Edge Fragment #${i + 1}`, "float", [cx + side * (w / 2 + 0.5), by + seg * (i + 0.5), cz], [0.5, 0.5, 0.5], "edge", {
      rot: ["z", 45],
      motion: mo("mote", { bob: 0.45, phase: i / n + 0.3, loopSeconds: 3 }),
    });
  }
  b.c("tip", "Tip Crystal", "float", [cx, by + L + 1, cz], [0.9, 1.8, 0.9], "gem", { rot: ["y", 45], motion: mo("mote", { bob: 0.4, phase: 0.9, loopSeconds: 3 }) });
  ring(b, "runes", "Orbit Rune", [cx, by + L * 0.5, cz], W / 2 + 1.6, 4, [0.4, 0.7, 0.4], "core", (i) =>
    mo("orbit_a", { orbitTurns: 1, phase: i / 4, bob: 0.2, loopSeconds: 3 })
  );
  return b.out;
}

export const EXTRA_BUILDERS: Partial<Record<ArchetypeId, (p: ArchetypeParams) => RawBoxSpec[]>> = {
  cursed_blade: cursedBlade,
  blood_scythe: bloodScythe,
  scepter,
  grimoire,
  bow,
  assault_rifle: assaultRifle,
  pistol,
  railgun,
  relic,
  ornate_spear: ornateSpear,
  mace,
  drill_lance: drillLance,
  crystal_spellblade: crystalSpellblade,
};

function dp(o: Partial<ArchetypeParams>): ArchetypeParams {
  return {
    bladeLength: 14,
    bladeWidth: 3,
    guardWidth: 7,
    guardStyle: "cruciform",
    pommelStyle: "gem",
    voxelDepth: 1.4,
    taperSteps: 4,
    fullerGroove: true,
    edgeBevel: true,
    gemAccent: true,
    strictMinecraftRotation: true,
    uvPadding: 1,
    shadingStyle: "hand_painted",
    effectPreset: "none",
    ...o,
  };
}

export const EXTRA_CATALOG: ArchetypeMeta[] = [
  { id: "cursed_blade", nameJa: "魔剣 (Cursed Blade)", nameEn: "Magatsu Demon Blade", category: "Cursed", description: "髑髏柄頭・魔眼の鍔・ギザ刃・呪鎖が周回する禍々しい魔剣。", defaultParams: dp({ bladeLength: 15, bladeWidth: 3.6, guardWidth: 8, voxelDepth: 1.4, shadingStyle: "cursed_noise", effectPreset: "cursed_smoke" }) },
  { id: "blood_scythe", nameJa: "血鎌 (Blood Scythe)", nameEn: "Sanguine Reaper", category: "Blood", description: "脈打つ心臓核と三日月刃、滴る血を纏う鮮血の大鎌。", defaultParams: dp({ bladeLength: 16, bladeWidth: 3.2, voxelDepth: 1.2, shadingStyle: "blood_veins", effectPreset: "blood_mist" }) },
  { id: "scepter", nameJa: "聖杖 (Holy Scepter)", nameEn: "Seraph Scepter", category: "Magic", description: "回転する聖晶・十字・熾天使の翼と光輪を持つ王笏。", defaultParams: dp({ bladeLength: 14, guardWidth: 6, shadingStyle: "holy_sheen", effectPreset: "holy_light" }) },
  { id: "grimoire", nameJa: "魔導書 (Grimoire)", nameEn: "Grimoire & Magic Circle", category: "Magic", description: "留め金と魔眼の封印、浮遊頁、三重魔法陣とジャイロ環が回る魔導書。", defaultParams: dp({ bladeLength: 14, bladeWidth: 3.4, voxelDepth: 1.6, shadingStyle: "runic_glow", effectPreset: "mana" }) },
  { id: "bow", nameJa: "長弓 (Longbow)", nameEn: "Recurve Longbow", category: "Ranged", description: "リカーブ弓。変形展開で弦が引かれ矢がしなる（引き絞りアニメ）。", defaultParams: dp({ bladeLength: 16, shadingStyle: "gradient_vertical", effectPreset: "none" }) },
  { id: "assault_rifle", nameJa: "突撃銃 (Rifle)", nameEn: "Tactical Assault Rifle", category: "Modern", description: "光学照準器・M-LOKハンドガード・湾曲弾倉を備えた近代ライフル。", defaultParams: dp({ bladeLength: 14, voxelDepth: 1.6, shadingStyle: "carbon_tech", effectPreset: "none" }) },
  { id: "pistol", nameJa: "拳銃 (Pistol)", nameEn: "Engraved Sidearm", category: "Modern", description: "スライドが後退し撃鉄が起きる、彫金入りハンドガン。", defaultParams: dp({ bladeLength: 10, voxelDepth: 1.2, shadingStyle: "metallic_gradient", effectPreset: "sparks" }) },
  { id: "railgun", nameJa: "電磁砲 (Railgun)", nameEn: "Coil Railgun", category: "Mech", description: "回転加速コイル、脈動するコンデンサ、展開するレールと射出スラッグ。", defaultParams: dp({ bladeLength: 16, voxelDepth: 1.8, shadingStyle: "carbon_tech", effectPreset: "electric" }) },
  { id: "relic", nameJa: "聖遺物 (Relic)", nameEn: "Ancient Relic", category: "Relic", description: "鉤爪の台座に浮かぶ心核。水平・子午の二重環と破片が周回する。", defaultParams: dp({ bladeWidth: 3.2, shadingStyle: "gradient_radial", effectPreset: "holy_light" }) },
  { id: "ornate_spear", nameJa: "装飾槍 (Ornate Spear)", nameEn: "Imperial Ornate Spear", category: "Polearm", description: "金帯・宝石鋲・螺旋象嵌・軍旗・房飾り・副刃・光輪まで盛った儀礼槍。", defaultParams: dp({ bladeLength: 14, voxelDepth: 1.2, shadingStyle: "metallic_gradient", effectPreset: "none" }) },
  { id: "mace", nameJa: "鎚矛 (Mace)", nameEn: "Flanged War Mace", category: "Blunt", description: "8枚フランジと宝石面、王冠スパイクの重装メイス。", defaultParams: dp({ bladeLength: 12, bladeWidth: 3.4, guardWidth: 7.5, shadingStyle: "metallic_gradient" }) },
  { id: "drill_lance", nameJa: "螺旋槍 (Drill Lance)", nameEn: "Mecha Drill Lance", category: "Mech", description: "高速回転する多段ドリルと三段ヴァンプレート、油圧ピストンの機巧ランス。", defaultParams: dp({ bladeLength: 14, bladeWidth: 3.6, shadingStyle: "carbon_tech", effectPreset: "sparks" }) },
  { id: "crystal_spellblade", nameJa: "晶剣 (Spellblade)", nameEn: "Floating Crystal Spellblade", category: "Magic", description: "分離浮遊する結晶刃をマナの背骨が繋ぐ魔法剣。鍔に魔法陣。", defaultParams: dp({ bladeLength: 15, bladeWidth: 3.2, shadingStyle: "gradient_diagonal", effectPreset: "mana" }) },
];

export type ArchetypeFamily = "melee" | "heavy" | "magic" | "cursed" | "ranged" | "mech" | "relic";

export const ARCHETYPE_FAMILIES: Array<{ id: ArchetypeFamily | "all"; label: string }> = [
  { id: "all", label: "全部" },
  { id: "melee", label: "近接" },
  { id: "heavy", label: "重量" },
  { id: "magic", label: "魔法" },
  { id: "cursed", label: "禍・血" },
  { id: "ranged", label: "射撃" },
  { id: "mech", label: "機械" },
  { id: "relic", label: "遺物" },
];

export const ARCHETYPE_FAMILY: Record<ArchetypeId, ArchetypeFamily> = {
  sword: "melee",
  katana: "melee",
  dagger: "melee",
  ornate_spear: "melee",
  greatsword: "heavy",
  axe: "heavy",
  hammer: "heavy",
  pickaxe: "heavy",
  mace: "heavy",
  staff: "magic",
  scepter: "magic",
  grimoire: "magic",
  crystal_spellblade: "magic",
  cursed_blade: "cursed",
  blood_scythe: "cursed",
  bow: "ranged",
  pistol: "ranged",
  assault_rifle: "ranged",
  railgun: "mech",
  rail_cannon: "mech",
  gunblade: "mech",
  chainsaw_blade: "mech",
  drill_lance: "mech",
  relic: "relic",
};

export const EXTRA_PALETTES: Record<"abyss" | "blood" | "gunmetal" | "holy", MaterialPalette> = {
  abyss: { id: "abyss" as MaterialPresetId, nameJa: "深淵 (Abyss)", nameEn: "Abyssal Malice", primaryLight: "#6d28d9", primaryBase: "#2e1065", primaryDark: "#0c0420", edgeHighlight: "#c4b5fd", trimLight: "#a3a3a3", trimBase: "#3f3f46", trimDark: "#18181b", handleLight: "#57534e", handleBase: "#292524", handleDark: "#0c0a09", gemLight: "#fca5a5", gemBase: "#dc2626", gemDark: "#450a0a", coreGlow: "#a855f7" },
  blood: { id: "blood" as MaterialPresetId, nameJa: "鮮血 (Blood)", nameEn: "Sanguine Pact", primaryLight: "#f87171", primaryBase: "#991b1b", primaryDark: "#3f0a0a", edgeHighlight: "#fecaca", trimLight: "#e7e5e4", trimBase: "#a8a29e", trimDark: "#44403c", handleLight: "#44403c", handleBase: "#1c1917", handleDark: "#0c0a09", gemLight: "#fda4af", gemBase: "#e11d48", gemDark: "#4c0519", coreGlow: "#ef4444" },
  gunmetal: { id: "gunmetal" as MaterialPresetId, nameJa: "ガンメタル (Tactical)", nameEn: "Tactical Gunmetal", primaryLight: "#9ca3af", primaryBase: "#4b5563", primaryDark: "#1f2937", edgeHighlight: "#e5e7eb", trimLight: "#6b7280", trimBase: "#374151", trimDark: "#111827", handleLight: "#57534e", handleBase: "#292524", handleDark: "#0c0a09", gemLight: "#fdba74", gemBase: "#f97316", gemDark: "#7c2d12", coreGlow: "#fb923c" },
  holy: { id: "holy" as MaterialPresetId, nameJa: "聖銀 (Holy)", nameEn: "Sanctified Silver", primaryLight: "#ffffff", primaryBase: "#e2e8f0", primaryDark: "#94a3b8", edgeHighlight: "#fffbeb", trimLight: "#fef08a", trimBase: "#eab308", trimDark: "#854d0e", handleLight: "#f8fafc", handleBase: "#cbd5e1", handleDark: "#64748b", gemLight: "#bae6fd", gemBase: "#38bdf8", gemDark: "#075985", coreGlow: "#fde68a" },
};
