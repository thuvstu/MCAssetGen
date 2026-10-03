import type { ArchetypeParams, ElementMotion, FloatingRigConfig, MotionRig } from "@/db/schema";

export type CrownStyle = "cage" | "halo" | "eclipse" | "comet" | "barrel";
export type CoreStyle = "octahedron" | "twin" | "eclipse" | "orb" | "cube";

export interface ArchetypeRigDefaults {
  crownStyle: CrownStyle;
  coreStyle: CoreStyle;
  orbitLayers: number;
  satellites: number;
  haloRings: number;
  motes: number;
  loopSeconds: number;
  bob: number;
  pulse: boolean;
  previewFx: boolean;
}

/** Backward-compatible default from the refactor, plus genre presets. */
export const FLOATING_RIG_PRESETS: Record<string, ArchetypeRigDefaults> = {
  staff: {
    crownStyle: "halo",
    coreStyle: "twin",
    orbitLayers: 2,
    satellites: 4,
    haloRings: 2,
    motes: 8,
    loopSeconds: 4,
    bob: 0.42,
    pulse: true,
    previewFx: true,
  },
  axe: {
    crownStyle: "cage",
    coreStyle: "octahedron",
    orbitLayers: 1,
    satellites: 4,
    haloRings: 0,
    motes: 4,
    loopSeconds: 6,
    bob: 0.2,
    pulse: false,
    previewFx: true,
  },
  greatsword: {
    crownStyle: "barrel",
    coreStyle: "orb",
    orbitLayers: 1,
    satellites: 3,
    haloRings: 1,
    motes: 0,
    loopSeconds: 5,
    bob: 0.35,
    pulse: true,
    previewFx: false,
  },
  hat: {
    crownStyle: "halo",
    coreStyle: "octahedron",
    orbitLayers: 0,
    satellites: 3,
    haloRings: 0,
    motes: 12,
    loopSeconds: 3.2,
    bob: 0.55,
    pulse: true,
    previewFx: true,
  },
  shield: {
    crownStyle: "cage",
    coreStyle: "orb",
    orbitLayers: 1,
    satellites: 5,
    haloRings: 1,
    motes: 6,
    loopSeconds: 4.8,
    bob: 0.35,
    pulse: true,
    previewFx: false,
  },
  gun: {
    crownStyle: "barrel",
    coreStyle: "orb",
    orbitLayers: 1,
    satellites: 4,
    haloRings: 0,
    motes: 6,
    loopSeconds: 2.8,
    bob: 0.18,
    pulse: false,
    previewFx: false,
  },
};

export const CROWN_STYLES: Array<{ id: CrownStyle; label: string; detail: string }> = [
  { id: "cage", label: "籠冠", detail: "四方の爪と二段の方形フレーム" },
  { id: "halo", label: "光輪", detail: "二重ハローと周回結晶" },
  { id: "eclipse", label: "蝕", detail: "暗核・外輪・対角の柱" },
  { id: "comet", label: "彗星", detail: "扇状の尾が形を保って周回" },
  { id: "barrel", label: "砲口", detail: "厚い筒・砲身に包まれた浮遊環" },
];

export const CORE_STYLES: Array<{ id: CoreStyle; label: string }> = [
  { id: "octahedron", label: "八面体" },
  { id: "twin", label: "双晶" },
  { id: "eclipse", label: "蝕核" },
  { id: "orb", label: "磨珠" },
  { id: "cube", label: "結晶核" },
];

const rigCache = new Map<string, FloatingRigConfig>();

function keyOf(params: ArchetypeParams) {
  return params.floatingRig ? JSON.stringify(params.floatingRig) : "none";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n * 100) / 100));
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
    bob: clamp(fx.bob * bobScale, 0, 1.4),
    phase: phase % 1,
    pulse: fx.pulse,
      loopSeconds: clamp(fx.loopSeconds, 2.4, 8),
  };
}

/**
 * Resolve the actual floating rig from params (with defaults per archetype).
 * This keeps backwards compatibility with old staff-only database rows.
 */
export function resolveFloatingRig(
  params: ArchetypeParams,
  archetypeId: string
): FloatingRigConfig | null {
  const raw = params.floatingRig ?? (params as any).staffFx;
  const defaults = FLOATING_RIG_PRESETS[archetypeId] ?? FLOATING_RIG_PRESETS.staff;
  if (!raw && archetypeId !== "staff") return null;
  const merged = { ...defaults, ...raw };
  // Normalize back into a stable rig object for the generator.
  return {
    crownStyle: merged.crownStyle,
    coreStyle: merged.coreStyle,
    orbitLayers: Math.max(0, Math.min(3, Math.round(merged.orbitLayers ?? 0))),
    satellites: Math.max(0, Math.min(6, Math.round(merged.satellites ?? 0))),
    haloRings: Math.max(0, Math.min(2, Math.round(merged.haloRings ?? 0))),
    motes: Math.max(0, Math.min(16, Math.round(merged.motes ?? 0))),
    loopSeconds: clamp(merged.loopSeconds ?? 4, 2.4, 8),
    bob: clamp(merged.bob ?? 0, 0, 1.4),
    pulse: merged.pulse ?? true,
    previewFx: merged.previewFx ?? true,
  };
}

/**
 * Build the standard floating ring/orbit structure around a point.
 * Used by staff, axe, greatsword, hat, shield, gun.
 */
type FloatingDraft = {
  id: string;
  name: string;
  group: "float";
  from: [number, number, number];
  to: [number, number, number];
  origin: [number, number, number];
  rotation?: { axis: "x" | "y" | "z"; angle: number };
  materialRole: "primary" | "edge" | "trim" | "gem" | "core";
  motion?: ElementMotion;
};

export function buildFloatingRigDrafts(opts: {
  cx: number;
  cz: number;
  centerY: number;
  span: number;
  colorRole: "gem" | "core";
  fx: FloatingRigConfig;
  baseId?: string;
  bobScale?: number;
  turnsSign?: 1 | -1;
}): FloatingDraft[] {
  const {
    cx,
    cz,
    centerY,
    span,
    colorRole,
    fx,
    baseId = "float",
    bobScale = 1,
    turnsSign = 1,
  } = opts;
  const out: FloatingDraft[] = [];
  const maxY = centerY + 2.4;
  const groups: MotionRig[] = ["orbit_a", "orbit_b", "orbit_c"];
  const turns = [1, -2, 1];

  for (let layer = 0; layer < fx.orbitLayers; layer++) {
    const layerRadius = span + 1.2 + layer * 1.1;
    const count = Math.max(3, fx.satellites - (layer > 1 ? 1 : 0));
    const y = centerY - 0.25 + layer * 1.2;
    const size = Math.max(0.38, 0.62 - layer * 0.07);
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2 + layer * 0.55;
      const x = cx + Math.cos(theta) * layerRadius;
      const z = cz + Math.sin(theta) * layerRadius;
      out.push({
        id: `${baseId}_orb_${layer}_${i}`,
        name: `${baseId} Layer ${layer + 1}-${i + 1}`,
        group: "float",
        from: [x - size, y - size, z - size],
        to: [x + size, y + size, z + size],
        origin: [cx, y, cz],
        materialRole: layer === 0 ? colorRole : (layer === 1 ? "edge" : "core"),
        motion: motion(fx, groups[layer] ?? "orbit_c", turns[layer] * turnsSign, 0.8 + layer * 0.12, i / count),
      });
      if (i % 2 === 0) {
        const sy = y + size * 0.68;
        out.push({
          id: `${baseId}_cap_${layer}_${i}`,
          name: `${baseId} Cap ${layer + 1}-${i + 1}`,
          group: "float",
          from: [x - size * 0.48, sy, z - size * 0.48],
          to: [x + size * 0.48, sy + size * 1.18, z + size * 0.48],
          origin: [cx, sy + size * 0.6, cz],
          materialRole: "edge",
          motion: motion(fx, groups[layer] ?? "orbit_c", turns[layer] * turnsSign, 0.72 + layer * 0.12, i / count),
        });
      }
    }
  }

  for (let ring = 0; ring < fx.haloRings; ring++) {
    const segments = ring === 0 ? 8 : 12;
    const radius = span * (0.82 + ring * 0.28);
    const y = centerY + 0.8 + ring * 0.55;
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2 + ring * 0.15;
      const x = cx + Math.cos(theta) * radius;
      const z = cz + Math.sin(theta) * radius;
      out.push({
        id: `${baseId}_halo_${ring}_${i}`,
        name: `${baseId} Halo ${ring + 1}-${i + 1}`,
        group: "float",
        from: [x - 0.38, y, z - 0.38],
        to: [x + 0.38, y + 0.32, z + 0.38],
        origin: [cx, y + 0.16, cz],
        materialRole: ring === 0 ? "trim" : "edge",
        motion: motion(fx, "halo", turnsSign, 0.4 * bobScale, i / segments),
      });
    }
  }

  for (let i = 0; i < fx.motes; i++) {
    const theta = (i / fx.motes) * Math.PI * 2 + 0.31;
    const radius = span * 0.52 + (i % 3) * 0.72;
    const y = centerY + 0.8 + (i % 4) * 0.52;
    const x = cx + Math.cos(theta) * radius;
    const z = cz + Math.sin(theta) * radius;
    const s = 0.24;
    out.push({
      id: `${baseId}_mote_${i}`,
      name: `${baseId} Mote ${i + 1}`,
      group: "float",
      from: [x - s, y - s, z - s],
      to: [x + s, y + s, z + s],
      origin: [cx, y, cz],
      materialRole: i % 2 === 0 ? "gem" : "core",
      motion: motion(fx, "mote", (i % 2 === 0 ? 2 : -1) * turnsSign, 0.9 * bobScale, i / fx.motes),
    });
  }

  return out;
}
