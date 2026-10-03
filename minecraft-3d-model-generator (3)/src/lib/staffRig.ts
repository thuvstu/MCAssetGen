import type { ArchetypeParams, ElementMotion, MotionRig, FloatingRigConfig } from "@/db/schema";
import type { BoxGroup as Group } from "./voxelGenerator";
import { FLOATING_RIG_PRESETS, resolveFloatingRig } from "./floatingRigs";
import { buildFloatingRigDrafts } from "./floatingRigs";

export const DEFAULT_STAFF_FX: FloatingRigConfig = FLOATING_RIG_PRESETS.staff;
export const CROWN_STYLES = [
  { id: "cage" as const, label: "籠冠", detail: "四方の爪と二段の方形フレーム" },
  { id: "halo" as const, label: "光輪", detail: "二重ハローと周回結晶" },
  { id: "eclipse" as const, label: "蝕", detail: "暗核・外輪・対角の柱" },
  { id: "comet" as const, label: "彗星", detail: "扇状の尾が形を保って周回" },
  { id: "barrel" as const, label: "砲口", detail: "厚い筒・砲身に包まれた浮遊環" },
];
export const CORE_STYLES = [
  { id: "octahedron" as const, label: "八面体" },
  { id: "twin" as const, label: "双晶" },
  { id: "eclipse" as const, label: "蝕核" },
  { id: "orb" as const, label: "磨珠" },
  { id: "cube" as const, label: "結晶核" },
];

type Vec3 = [number, number, number];
type Role = "primary" | "edge" | "trim" | "handle" | "gem" | "core";

export interface StaffBoxDraft {
  id: string;
  name: string;
  group: Group;
  from: Vec3;
  to: Vec3;
  origin: Vec3;
  rotation?: { axis: "x" | "y" | "z"; angle: number };
  materialRole: Role;
  motion?: ElementMotion;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function r(n: number) {
  return Math.round(n * 100) / 100;
}

export function resolveStaffFx(params: ArchetypeParams): FloatingRigConfig {
  return resolveFloatingRig(params, "staff") ?? DEFAULT_STAFF_FX;
}

function solid(from: Vec3, to: Vec3): [Vec3, Vec3] {
  const a: Vec3 = [
    Math.min(from[0], to[0]),
    Math.min(from[1], to[1]),
    Math.min(from[2], to[2]),
  ];
  const b: Vec3 = [
    Math.max(from[0], to[0]),
    Math.max(from[1], to[1]),
    Math.max(from[2], to[2]),
  ];
  for (let i = 0; i < 3; i++) {
    if (b[i] - a[i] < 0.36) {
      const mid = (a[i] + b[i]) / 2;
      a[i] = mid - 0.18;
      b[i] = mid + 0.18;
    }
  }
  return [
    [r(a[0]), r(a[1]), r(a[2])],
    [r(b[0]), r(b[1]), r(b[2])],
  ];
}

function motion(
  fx: FloatingRigConfig,
  rig: MotionRig,
  orbitTurns: number,
  bobScale: number,
  phase: number
): ElementMotion {
  return {
    rig,
    orbitTurns,
    bob: r(fx.bob * bobScale),
    phase: r(phase % 1),
    pulse: fx.pulse,
    loopSeconds: fx.loopSeconds,
  };
}

export function buildStaffDrafts(input: {
  cx: number;
  cz: number;
  shaftLen: number;
  bladeWidth: number;
  guardWidth: number;
  fx: FloatingRigConfig;
}): StaffBoxDraft[] {
  const { cx, cz, shaftLen, fx } = input;
  const out: StaffBoxDraft[] = [];
  const span = Math.max(2.8, Math.min(6.2, input.guardWidth * 0.5));
  const coreR = Math.max(1.05, Math.min(1.85, input.bladeWidth * 0.46));
  const coreY = shaftLen + 3.15;
  const crownBase = shaftLen + 0.45;

  const push = (
    id: string,
    name: string,
    group: Group,
    from: Vec3,
    to: Vec3,
    origin: Vec3,
    materialRole: Role,
    rotation?: { axis: "x" | "y" | "z"; angle: number },
    mot?: ElementMotion
  ) => {
    const [a, b] = solid(from, to);
    out.push({
      id,
      name,
      group,
      from: a,
      to: b,
      origin: [r(origin[0]), r(origin[1]), r(origin[2])],
      rotation,
      materialRole,
      motion: mot,
    });
  };

  push(
    "staff_shaft",
    "Arcane Staff Shaft",
    "shaft",
    [cx - 0.62, 6.15, cz - 0.62],
    [cx + 0.62, shaftLen, cz + 0.62],
    [cx, (6.15 + shaftLen) / 2, cz],
    "handle"
  );

  const runeCount = 3;
  for (let i = 0; i < runeCount; i++) {
    const y = 7.4 + i * ((shaftLen - 8.2) / runeCount);
    push(
      `staff_rune_${i + 1}`,
      `Shaft Rune Inlay #${i + 1}`,
      "detail",
      [cx - 0.28, y, cz - 0.78],
      [cx + 0.28, y + 0.7, cz + 0.78],
      [cx, y + 0.35, cz],
      "core"
    );
  }

  push(
    "staff_collar",
    "Crown Collar",
    "guard",
    [cx - 1.7, shaftLen - 0.35, cz - 1.7],
    [cx + 1.7, shaftLen + 0.85, cz + 1.7],
    [cx, shaftLen + 0.25, cz],
    "trim"
  );

  push(
    "staff_mana_channel",
    "Mana Channel",
    "detail",
    [cx - 0.22, shaftLen + 0.7, cz - 0.22],
    [cx + 0.22, coreY - coreR * 0.35, cz + 0.22],
    [cx, (shaftLen + coreY) / 2, cz],
    "core"
  );

  const prongH = fx.crownStyle === "comet" ? 4.1 : fx.crownStyle === "eclipse" ? 4.8 : 5.6;
  const prongs: Array<{ id: string; axis: "x" | "z"; sign: -1 | 1; angle: number }> = [
    { id: "west", axis: "z", sign: -1, angle: 22.5 },
    { id: "east", axis: "z", sign: 1, angle: -22.5 },
    { id: "north", axis: "x", sign: -1, angle: -22.5 },
    { id: "south", axis: "x", sign: 1, angle: 22.5 },
  ];
  const activeProngs =
    fx.crownStyle === "comet" ? prongs.filter((p) => p.id !== "north") : prongs;

  for (const prong of activeProngs) {
    const alongX = prong.id === "west" || prong.id === "east";
    const outer = span + 0.15;
    const from: Vec3 = alongX
      ? [cx + prong.sign * outer - 0.42, crownBase, cz - 0.4]
      : [cx - 0.4, crownBase, cz + prong.sign * outer - 0.42];
    const to: Vec3 = alongX
      ? [cx + prong.sign * outer + 0.42, crownBase + prongH, cz + 0.4]
      : [cx + 0.4, crownBase + prongH, cz + prong.sign * outer + 0.42];
    const origin: Vec3 = alongX
      ? [cx + prong.sign * outer, crownBase + 0.35, cz]
      : [cx, crownBase + 0.35, cz + prong.sign * outer];
    push(
      `staff_prong_${prong.id}`,
      `Crown Prong ${prong.id}`,
      "guard",
      from,
      to,
      origin,
      "trim",
      { axis: prong.axis, angle: prong.angle }
    );
    const tipY = crownBase + prongH - 0.15;
    const tipFrom: Vec3 = alongX
      ? [cx + prong.sign * (outer + 0.15) - 0.32, tipY, cz - 0.32]
      : [cx - 0.32, tipY, cz + prong.sign * (outer + 0.15) - 0.32];
    const tipTo: Vec3 = alongX
      ? [cx + prong.sign * (outer + 0.15) + 0.32, tipY + 0.7, cz + 0.32]
      : [cx + 0.32, tipY + 0.7, cz + prong.sign * (outer + 0.15) + 0.32];
    push(
      `staff_prong_tip_${prong.id}`,
      `Prong Gem ${prong.id}`,
      "detail",
      tipFrom,
      tipTo,
      [
        (tipFrom[0] + tipTo[0]) / 2,
        (tipFrom[1] + tipTo[1]) / 2,
        (tipFrom[2] + tipTo[2]) / 2,
      ] as Vec3,
      "gem",
      { axis: "y", angle: 45 }
    );
  }

  if (fx.crownStyle === "cage" || fx.crownStyle === "halo") {
    for (const band of [0, 1]) {
      const y = crownBase + 1.35 + band * (prongH * 0.42);
      const reach = span - 0.15;
      push(
        `staff_brace_x_${band}`,
        `Cage Brace X #${band + 1}`,
        "guard",
        [cx - reach, y, cz - 0.28],
        [cx + reach, y + 0.42, cz + 0.28],
        [cx, y + 0.21, cz],
        "trim"
      );
      push(
        `staff_brace_z_${band}`,
        `Cage Brace Z #${band + 1}`,
        "guard",
        [cx - 0.28, y + 0.08, cz - reach],
        [cx + 0.28, y + 0.46, cz + reach],
        [cx, y + 0.27, cz],
        "edge"
      );
    }
  }

  if (fx.crownStyle === "eclipse") {
    for (const [sx, sz, idx] of [
      [-1, -1, 0],
      [-1, 1, 1],
      [1, -1, 2],
      [1, 1, 3],
    ] as const) {
      const x = cx + sx * span * 0.78;
      const z = cz + sz * span * 0.78;
      push(
        `staff_eclipse_post_${idx}`,
        `Eclipse Post #${idx + 1}`,
        "guard",
        [x - 0.38, crownBase + 0.4, z - 0.38],
        [x + 0.38, crownBase + prongH * 0.72, z + 0.38],
        [x, crownBase + 0.8, z],
        "trim"
      );
    }
  }

  if (fx.coreStyle === "eclipse") {
    push(
      "staff_eclipse_void",
      "Eclipse Void",
      "detail",
      [cx - coreR * 0.85, coreY - coreR * 0.85, cz - coreR * 0.85],
      [cx + coreR * 0.85, coreY + coreR * 0.85, cz + coreR * 0.85],
      [cx, coreY, cz],
      "handle",
      { axis: "y", angle: 0 },
      motion(fx, "core", 1, 0.35, 0)
    );
    push(
      "staff_eclipse_shell",
      "Eclipse Shell",
      "float",
      [cx - coreR * 0.45, coreY - coreR * 1.15, cz - coreR * 0.45],
      [cx + coreR * 0.45, coreY + coreR * 1.15, cz + coreR * 0.45],
      [cx, coreY, cz],
      "core",
      { axis: "z", angle: 45 },
      motion(fx, "core", -1, 0.35, 0.25)
    );
  } else {
    push(
      "staff_mana_core_a",
      "Mana Core A",
      "float",
      [cx - coreR, coreY - coreR, cz - coreR],
      [cx + coreR, coreY + coreR, cz + coreR],
      [cx, coreY, cz],
      "gem",
      { axis: "z", angle: 45 },
      motion(fx, "core", 1, 0.55, 0)
    );
    if (fx.coreStyle === "twin") {
      push(
        "staff_mana_core_b",
        "Mana Core B",
        "float",
        [cx - coreR * 0.72, coreY - coreR * 1.15, cz - coreR * 0.72],
        [cx + coreR * 0.72, coreY + coreR * 1.15, cz + coreR * 0.72],
        [cx, coreY, cz],
        "core",
        { axis: "x", angle: 45 },
        motion(fx, "core", 1, 0.55, 0)
      );
    }
  }

  const haloBase = fx.crownStyle === "eclipse" ? Math.max(1, fx.haloRings) : fx.haloRings;
  for (let ring = 0; ring < haloBase; ring++) {
    const segments = fx.crownStyle === "eclipse" ? 12 : 8;
    const radius = span * (0.92 + ring * 0.28);
    const y = coreY - 0.15 + ring * 1.55;
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2 + ring * 0.2;
      const x = cx + Math.cos(theta) * radius;
      const z = cz + Math.sin(theta) * radius;
      push(
        `staff_halo_${ring}_${i}`,
        `Halo Segment ${ring + 1}-${i + 1}`,
        "float",
        [x - 0.42, y, z - 0.42],
        [x + 0.42, y + 0.4, z + 0.42],
        [cx, y + 0.2, cz],
        ring === 0 ? "edge" : "trim",
        undefined,
        motion(fx, "halo", ring === 0 ? 1 : -1, 0.22, i / segments)
      );
    }
  }

  const rigs: MotionRig[] = ["orbit_a", "orbit_b", "orbit_c"];
  const turns = [1, -2, 1];
  for (let layer = 0; layer < fx.orbitLayers; layer++) {
    const count = fx.satellites;
    const radius = span + 1.15 + layer * 1.05;
    const y = coreY - 0.35 + layer * 1.25;
    const rig = rigs[layer] ?? "orbit_c";
    const size = Math.max(0.42, 0.62 - layer * 0.08);
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2 + layer * 0.55;
      placeCrystal(push, {
        id: `staff_sat_${layer}_${i}`,
        name: `Orbit Crystal L${layer + 1}-${i + 1}`,
        cx,
        cz,
        x: cx + Math.cos(theta) * radius,
        z: cz + Math.sin(theta) * radius,
        y,
        size,
        role: layer === 0 ? "gem" : "core",
        mot: motion(fx, rig, turns[layer] ?? 1, 0.7 + layer * 0.15, i / count),
      });
    }
  }

  if (fx.crownStyle === "comet") {
    for (let i = 0; i < 6; i++) {
      const theta = -Math.PI / 2 + (i - 2.5) * 0.2;
      const radius = 1.7 + i * 0.78;
      const size = Math.max(0.32, 0.7 - i * 0.07);
      placeCrystal(push, {
        id: `staff_tail_${i}`,
        name: `Comet Tail #${i + 1}`,
        cx,
        cz,
        x: cx + Math.cos(theta) * radius,
        z: cz + Math.sin(theta) * radius,
        y: coreY - 0.2 - i * 0.18,
        size,
        role: i < 2 ? "gem" : "edge",
        mot: motion(fx, "orbit_b", 1, 0.35, i * 0.07),
      });
    }
  }

  for (let i = 0; i < fx.motes; i++) {
    const theta = (i / fx.motes) * Math.PI * 2 + 0.4;
    const radius = span * 0.55 + (i % 3) * 0.85;
    const y = coreY + 1.1 + (i % 4) * 0.55;
    const x = cx + Math.cos(theta) * radius;
    const z = cz + Math.sin(theta) * radius;
    const s = 0.28;
    push(
      `staff_mote_${i}`,
      `Mana Mote #${i + 1}`,
      "float",
      [x - s, y - s, z - s],
      [x + s, y + s, z + s],
      [cx, y, cz],
      i % 2 === 0 ? "gem" : "core",
      undefined,
      motion(fx, "mote", i % 2 === 0 ? 2 : -1, 1.15, i / fx.motes)
    );
  }

  const finialY = crownBase + prongH + 0.35;
  push(
    "staff_finial",
    "Crown Finial",
    "detail",
    [cx - 0.55, finialY, cz - 0.55],
    [cx + 0.55, finialY + 1.35, cz + 0.55],
    [cx, finialY + 0.2, cz],
    "trim",
    { axis: "y", angle: 45 }
  );

  return out;
}

function placeCrystal(
  push: (
    id: string,
    name: string,
    group: StaffBoxDraft["group"],
    from: Vec3,
    to: Vec3,
    origin: Vec3,
    materialRole: Role,
    rotation?: { axis: "x" | "y" | "z"; angle: number },
    mot?: ElementMotion
  ) => void,
  spec: {
    id: string;
    name: string;
    cx: number;
    cz: number;
    x: number;
    z: number;
    y: number;
    size: number;
    role: Role;
    mot: ElementMotion;
  }
) {
  const { id, name, cx, cz, x, z, y, size, role, mot } = spec;
  push(
    id,
    name,
    "float",
    [x - size, y - size, z - size],
    [x + size, y + size, z + size],
    [cx, y, cz],
    role,
    undefined,
    mot
  );
  push(
    `${id}_cap`,
    `${name} Cap`,
    "float",
    [x - size * 0.55, y + size * 0.65, z - size * 0.55],
    [x + size * 0.55, y + size * 1.55, z + size * 0.55],
    [cx, y + size * 1.1, cz],
    "edge",
    undefined,
    { ...mot, bob: r(mot.bob * 0.85) }
  );
}
