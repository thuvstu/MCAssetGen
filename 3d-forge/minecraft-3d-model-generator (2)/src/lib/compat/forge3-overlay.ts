import type { ElementMotion } from "../compat/forge3-types";
import type { RawBoxSpec } from "./forge3-voxel";
import { VISUAL_STYLES, type VisualStyleId } from "./forge3-visual";

type V = [number, number, number];

const mo = (rig: ElementMotion["rig"], p: Partial<ElementMotion> = {}): ElementMotion => ({
  rig,
  orbitTurns: 0,
  bob: 0,
  phase: 0,
  pulse: true,
  loopSeconds: 5,
  ...p,
});

function cube(
  id: string,
  name: string,
  group: RawBoxSpec["group"],
  c: V,
  s: V,
  role: RawBoxSpec["materialRole"],
  extra: Partial<RawBoxSpec> = {}
): RawBoxSpec {
  return {
    id,
    name,
    group,
    from: [c[0] - s[0] / 2, c[1] - s[1] / 2, c[2] - s[2] / 2],
    to: [c[0] + s[0] / 2, c[1] + s[1] / 2, c[2] + s[2] / 2],
    materialRole: role,
    ...extra,
  };
}

/**
 * Layers the selected visual style (改 / 覚醒 / 限界突破 / 蝕 / 聖 / 魔導 / 虚) on top of any archetype,
 * using the model's own bounds so it fits swords, staves, guns and books alike.
 */
export function buildStyleOverlay(raw: RawBoxSpec[], style: VisualStyleId): RawBoxSpec[] {
  const meta = VISUAL_STYLES.find((s) => s.id === style);
  if (!meta || style === "base" || raw.length === 0) return [];
  const f = meta.features;

  let minY = Infinity;
  let maxY = -Infinity;
  let maxR = 1;
  let frontZ = 8.5;
  let backZ = 7.5;
  for (const s of raw) {
    if (s.group === "float") continue;
    minY = Math.min(minY, s.from[1], s.to[1]);
    maxY = Math.max(maxY, s.from[1], s.to[1]);
    const xr = Math.max(Math.abs(s.from[0] - 8), Math.abs(s.to[0] - 8));
    maxR = Math.max(maxR, Math.min(8, xr));
    if (Math.abs((s.from[0] + s.to[0]) / 2 - 8) < 2.2) {
      frontZ = Math.max(frontZ, s.to[2]);
      backZ = Math.min(backZ, s.from[2]);
    }
  }
  if (!Number.isFinite(minY)) return [];
  const span = maxY - minY;
  const midY = minY + span * 0.6;
  const out: RawBoxSpec[] = [];
  const P = `sty_${style}`;

  if (f.bladeRunes) {
    for (let i = 0; i < 4; i++) {
      const y = minY + span * (0.5 + i * 0.11);
      out.push(cube(`${P}_rune_${i}`, `Style Rune #${i + 1}`, "detail", [8, y, frontZ + 0.18], [0.4, 0.6, 0.36], "core"));
    }
  }

  if (f.spinePlates) {
    for (let i = 0; i < f.spinePlates; i++) {
      const y = minY + span * (0.35 + i * 0.1);
      out.push(cube(`${P}_plate_${i}`, `Spine Plate #${i + 1}`, "detail", [8, y, backZ - 0.2], [1.2, 0.7, 0.4], "trim"));
    }
  }

  if (f.coreRail) {
    out.push({
      id: `${P}_rail`,
      name: "Overdrive Core Rail",
      group: "detail",
      from: [7.8, minY + span * 0.3, frontZ + 0.05],
      to: [8.2, maxY - span * 0.08, frontZ + 0.4],
      materialRole: "core",
      motion: mo("core", { loopSeconds: 1.4 }),
    });
  }

  const halos = f.haloRing ? f.haloRingCount ?? 1 : 0;
  for (let k = 0; k < halos; k++) {
    const y = maxY - 1.5 - k * 1.6;
    const r = maxR * 0.55 + 1.6 + k * 0.9;
    for (let i = 0; i < 10; i++) {
      const th = (i / 10) * Math.PI * 2;
      out.push(
        cube(`${P}_halo_${k}_${i}`, `Style Halo ${k + 1}-${i + 1}`, "float", [8 + Math.cos(th) * r, y, 8 + Math.sin(th) * r], [0.55, 0.3, 0.55], k === 0 ? "trim" : "edge", {
          origin: [8, y, 8],
          motion: mo("halo", { orbitTurns: k % 2 === 0 ? 1 : -1, phase: i / 10, bob: 0.12, loopSeconds: 6 }),
        })
      );
    }
  }

  if (f.orbitRing) {
    const n = f.orbitCount ?? 4;
    const r = maxR + 1.6;
    for (let i = 0; i < n; i++) {
      const th = (i / n) * Math.PI * 2;
      const c: V = [8 + Math.cos(th) * r, midY, 8 + Math.sin(th) * r];
      const motion = mo("orbit_c", { orbitTurns: f.orbitTurns ?? 1, bob: 0.4, phase: i / n });
      out.push(cube(`${P}_orb_${i}`, `Style Orbit Crystal #${i + 1}`, "float", c, [0.8, 0.8, 0.8], "gem", { origin: [8, midY, 8], motion }));
      out.push(cube(`${P}_orb_cap_${i}`, `Style Orbit Cap #${i + 1}`, "float", [c[0], c[1] + 0.75, c[2]], [0.45, 0.7, 0.45], "edge", { origin: [8, midY + 0.75, 8], motion }));
    }
  }

  if (f.voidShards) {
    for (let i = 0; i < 6; i++) {
      const th = i * 1.7 + 0.4;
      const r = 1.6 + (i % 3) * 1.1;
      out.push(
        cube(`${P}_shard_${i}`, `Void Shard #${i + 1}`, "float", [8 + Math.cos(th) * r, minY + span * (0.55 + (i % 4) * 0.1), 8 + Math.sin(th) * r], [0.5, 0.9, 0.5], i % 2 === 0 ? "core" : "edge", {
          motion: mo("mote", { bob: 0.6, phase: i / 6, spin: { axis: "y", turns: i % 2 === 0 ? 1 : -1 }, loopSeconds: 3 }),
        })
      );
    }
  }

  if (f.gemSplit) {
    for (const s of [-1, 1]) {
      out.push(
        cube(`${P}_twin_gem_${s}`, `Split Gem ${s < 0 ? "L" : "R"}`, "float", [8 + s * (maxR * 0.5 + 1.2), midY - span * 0.15, 8], [0.7, 1.0, 0.7], "gem", {
          motion: mo("mote", { bob: 0.35, phase: s > 0 ? 0.5 : 0 }),
        })
      );
    }
  }

  if (f.auraCrown) {
    const y = maxY + 0.8;
    for (let i = 0; i < 6; i++) {
      const th = (i / 6) * Math.PI * 2;
      out.push(
        cube(`${P}_crown_${i}`, `Aura Crown Spike #${i + 1}`, "float", [8 + Math.cos(th) * 1.6, y, 8 + Math.sin(th) * 1.6], [0.35, 1.0, 0.35], "trim", {
          origin: [8, y, 8],
          motion: mo("halo", { orbitTurns: 1, phase: i / 6, loopSeconds: 6 }),
        })
      );
    }
  }

  switch (f.finial) {
    case "diamond":
      out.push(cube(`${P}_finial`, "Style Finial", "detail", [8, maxY + 0.6, 8], [0.8, 1.4, 0.8], "edge", { rotation: { axis: "y", angle: 45 } }));
      break;
    case "orb":
      out.push(cube(`${P}_finial`, "Style Orb", "float", [8, maxY + 1.4, 8], [1.2, 1.2, 1.2], "gem", { motion: mo("mote", { bob: 0.35, spin: { axis: "y", turns: 1 } }) }));
      break;
    case "spike":
      out.push(cube(`${P}_finial`, "Style Spike", "detail", [8, maxY + 1.0, 8], [0.5, 2.0, 0.5], "edge"));
      break;
    case "twin":
      for (const s of [-1, 1]) out.push(cube(`${P}_finial_${s}`, `Twin Finial ${s}`, "detail", [8 + s * 0.6, maxY + 0.8, 8], [0.45, 1.6, 0.45], "edge", { rotation: { axis: "z", angle: -s * 22.5 } }));
      break;
    case "void":
      out.push(cube(`${P}_finial`, "Void Core", "float", [8, maxY + 1.5, 8], [1.0, 1.0, 1.0], "core", { motion: mo("core", { spin: { axis: "y", turns: 2 }, scalePulse: 0.15, bob: 0.3 }) }));
      out.push(cube(`${P}_finial_shell`, "Void Shell", "float", [8, maxY + 1.5, 8], [0.5, 1.6, 0.5], "edge", { motion: mo("core", { spin: { axis: "y", turns: -1 }, bob: 0.3 }) }));
      break;
    default:
      break;
  }

  return out;
}
