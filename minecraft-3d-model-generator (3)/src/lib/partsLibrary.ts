import type { ElementMotion } from "@/db/schema";
import type { RawBoxSpec } from "./voxelGenerator";

type V = [number, number, number];

export interface PartDef {
  id: string;
  label: string;
  category: "装飾" | "禍々" | "魔法" | "機械";
  build: (anchor: V, s: number, key: string) => RawBoxSpec[];
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

function c(key: string, id: string, name: string, center: V, size: V, role: RawBoxSpec["materialRole"], extra: Partial<RawBoxSpec> = {}): RawBoxSpec {
  return {
    id: `${key}_${id}`,
    name,
    group: extra.group ?? "detail",
    from: [center[0] - size[0] / 2, center[1] - size[1] / 2, center[2] - size[2] / 2],
    to: [center[0] + size[0] / 2, center[1] + size[1] / 2, center[2] + size[2] / 2],
    materialRole: role,
    ...extra,
  };
}

export const PARTS_LIBRARY: PartDef[] = [
  {
    id: "spike",
    label: "棘スパイク",
    category: "装飾",
    build: ([x, y, z], s, k) => [
      c(k, "base", "Spike Base", [x, y + 0.3 * s, z], [0.9 * s, 0.6 * s, 0.9 * s], "trim"),
      c(k, "tip", "Spike Tip", [x, y + 1.3 * s, z], [0.5 * s, 1.6 * s, 0.5 * s], "edge", { rotation: { axis: "y", angle: 45 } }),
    ],
  },
  {
    id: "gem_socket",
    label: "宝玉台座",
    category: "装飾",
    build: ([x, y, z], s, k) => [
      c(k, "bezel", "Gem Bezel", [x, y + 0.5 * s, z], [1.6 * s, 1.0 * s, 1.6 * s], "trim"),
      c(k, "gem", "Socket Gem", [x, y + 1.2 * s, z], [1.0 * s, 1.0 * s, 1.0 * s], "gem", { rotation: { axis: "y", angle: 45 } }),
    ],
  },
  {
    id: "wings",
    label: "翼一対",
    category: "装飾",
    build: ([x, y, z], s, k) =>
      [-1, 1].flatMap((d) =>
        [0, 1, 2].map((i) =>
          c(k, `wing_${d}_${i}`, `Wing Feather ${d}${i}`, [x + d * (1.4 + (2.2 - i * 0.5) * s * 0.5), y + (0.6 + i * 0.7) * s, z], [(2.2 - i * 0.5) * s, 0.6 * s, 0.35], i === 0 ? "edge" : "trim", {
            origin: [x + d * 1.2, y + (0.6 + i * 0.7) * s, z],
            rotation: { axis: "z", angle: d * 22.5 },
          })
        )
      ),
  },
  {
    id: "horns",
    label: "悪魔の角",
    category: "禍々",
    build: ([x, y, z], s, k) =>
      [-1, 1].flatMap((d) => [
        c(k, `horn_${d}`, `Horn ${d}`, [x + d * 1.0 * s, y + 0.9 * s, z], [0.6 * s, 1.8 * s, 0.6 * s], "trim", { origin: [x + d * 0.8 * s, y, z], rotation: { axis: "z", angle: -d * 22.5 } }),
        c(k, `horn_tip_${d}`, `Horn Tip ${d}`, [x + d * 1.9 * s, y + 2.1 * s, z], [0.4 * s, 1.2 * s, 0.4 * s], "edge", { origin: [x + d * 1.6 * s, y + 1.6 * s, z], rotation: { axis: "z", angle: -d * 45 } }),
      ]),
  },
  {
    id: "chain",
    label: "周回する鎖",
    category: "禍々",
    build: ([x, y, z], s, k) =>
      Array.from({ length: 8 }, (_, i) => {
        const th = (i / 8) * Math.PI * 2;
        const r = 2.4 * s;
        return c(k, `link_${i}`, `Chain Link ${i + 1}`, [x + Math.cos(th) * r, y, z + Math.sin(th) * r], [0.55, 0.35, 0.55], "trim", {
          group: "float",
          origin: [x, y, z],
          rotation: { axis: "y", angle: i % 2 === 0 ? 0 : 45 },
          motion: mo("orbit_a", { orbitTurns: 1, bob: 0.25, phase: i / 8, loopSeconds: 5 }),
        });
      }),
  },
  {
    id: "skull",
    label: "髑髏",
    category: "禍々",
    build: ([x, y, z], s, k) => [
      c(k, "cranium", "Skull Cranium", [x, y + 0.8 * s, z], [1.8 * s, 1.5 * s, 1.6 * s], "trim"),
      c(k, "jaw", "Skull Jaw", [x, y + 0.2 * s, z], [1.3 * s, 0.5 * s, 1.3 * s], "trim"),
      ...[-1, 1].map((d) => c(k, `eye_${d}`, `Skull Eye ${d}`, [x + d * 0.45 * s, y + 0.9 * s, z + 0.82 * s], [0.4 * s, 0.4 * s, 0.36], "core", { motion: mo("core", { pulse: true, loopSeconds: 2 }) })),
    ],
  },
  {
    id: "evil_eye",
    label: "魔眼",
    category: "禍々",
    build: ([x, y, z], s, k) => [
      c(k, "lid", "Eye Lid", [x, y + 0.6 * s, z], [1.8 * s, 1.2 * s, 0.6 * s], "trim"),
      c(k, "ball", "Eye Ball", [x, y + 0.6 * s, z + 0.3 * s], [1.3 * s, 0.9 * s, 0.4], "gem"),
      c(k, "iris", "Slit Iris", [x, y + 0.6 * s, z + 0.5 * s], [0.35 * s, 0.8 * s, 0.36], "core", { motion: mo("core", { scalePulse: 0.2, pulse: true, loopSeconds: 1.6 }) }),
    ],
  },
  {
    id: "blood_drip",
    label: "血の雫",
    category: "禍々",
    build: ([x, y, z], s, k) =>
      [0, 1, 2].map((i) =>
        c(k, `drip_${i}`, `Blood Drip ${i + 1}`, [x + (i - 1) * 0.7 * s, y - (0.6 + i * 0.5) * s, z], [0.4, 0.6 * s, 0.4], "core", {
          group: "float",
          motion: mo("mote", { bob: 0.5, phase: i * 0.3, pulse: true, loopSeconds: 1.8 }),
        })
      ),
  },
  {
    id: "rune_plate",
    label: "ルーン板",
    category: "魔法",
    build: ([x, y, z], s, k) => [
      c(k, "plate", "Rune Plate", [x, y + 0.8 * s, z], [1.6 * s, 1.6 * s, 0.4], "trim"),
      c(k, "glyph", "Rune Glyph", [x, y + 0.8 * s, z + 0.25], [0.9 * s, 0.9 * s, 0.36], "core", { rotation: { axis: "z", angle: 45 }, motion: mo("core", { pulse: true, loopSeconds: 2.5 }) }),
    ],
  },
  {
    id: "halo",
    label: "光輪",
    category: "魔法",
    build: ([x, y, z], s, k) =>
      Array.from({ length: 10 }, (_, i) => {
        const th = (i / 10) * Math.PI * 2;
        const r = 2.2 * s;
        const yy = y + 1.2 * s;
        return c(k, `halo_${i}`, `Halo Segment ${i + 1}`, [x + Math.cos(th) * r, yy, z + Math.sin(th) * r], [0.55, 0.3, 0.55], "trim", {
          group: "float",
          origin: [x, yy, z],
          motion: mo("halo", { orbitTurns: 1, phase: i / 10, pulse: true, loopSeconds: 6 }),
        });
      }),
  },
  {
    id: "feather",
    label: "浮遊羽根",
    category: "魔法",
    build: ([x, y, z], s, k) =>
      [0, 1, 2].map((i) =>
        c(k, `feather_${i}`, `Floating Feather ${i + 1}`, [x + (i - 1) * 1.4 * s, y + (1.2 + (i % 2) * 0.6) * s, z + 0.8], [0.4, 1.4 * s, 0.4], "edge", {
          group: "float",
          rotation: { axis: "z", angle: (i - 1) * 22.5 },
          motion: mo("mote", { bob: 0.45, phase: i / 3, loopSeconds: 3.5 }),
        })
      ),
  },
  {
    id: "tassel",
    label: "房飾り",
    category: "装飾",
    build: ([x, y, z], s, k) => [
      c(k, "cord", "Tassel Cord", [x, y - 1.2 * s, z], [0.35, 2.4 * s, 0.35], "core", { origin: [x, y, z], motion: mo("mote", { bob: 0.18, loopSeconds: 3 }) }),
      c(k, "bead", "Tassel Bead", [x, y - 2.6 * s, z], [0.6 * s, 0.6 * s, 0.6 * s], "gem", { motion: mo("mote", { bob: 0.18, loopSeconds: 3 }) }),
    ],
  },
  {
    id: "piston",
    label: "油圧ピストン",
    category: "機械",
    build: ([x, y, z], s, k) => [
      c(k, "cyl", "Piston Cylinder", [x, y + 0.9 * s, z], [0.8 * s, 1.8 * s, 0.8 * s], "trim"),
      c(k, "rod", "Piston Rod", [x, y + 2.3 * s, z], [0.4 * s, 1.2 * s, 0.4 * s], "edge", { motion: mo("transform_slide", { transformDelta: { translation: [0, 1.0 * s, 0] } }) }),
    ],
  },
  {
    id: "scope",
    label: "光学スコープ",
    category: "機械",
    build: ([x, y, z], s, k) => [
      c(k, "mount", "Scope Mount", [x + 0.8 * s, y + 0.5 * s, z], [0.6 * s, 0.8 * s, 0.6], "trim"),
      c(k, "tube", "Scope Tube", [x + 1.6 * s, y + 0.9 * s, z], [1.2 * s, 3.6 * s, 1.2 * s], "primary"),
      c(k, "lens", "Scope Lens", [x + 1.6 * s, y + 2.85 * s, z], [1.0 * s, 0.36, 1.0 * s], "gem"),
    ],
  },
  {
    id: "energy_cell",
    label: "エネルギーセル",
    category: "機械",
    build: ([x, y, z], s, k) => [
      c(k, "casing", "Cell Casing", [x, y + 0.9 * s, z], [1.2 * s, 1.8 * s, 1.2 * s], "trim"),
      c(k, "core", "Cell Core", [x, y + 0.9 * s, z + 0.45 * s], [0.6 * s, 1.3 * s, 0.4], "core", { motion: mo("core", { scalePulse: 0.1, pulse: true, loopSeconds: 1.2 }) }),
    ],
  },
  {
    id: "gear",
    label: "回転歯車",
    category: "機械",
    build: ([x, y, z], s, k) => [
      c(k, "hub", "Gear Hub", [x, y + 0.6 * s, z + 0.6], [1.6 * s, 1.6 * s, 0.4], "trim", { motion: mo("core", { spin: { axis: "z", turns: 1 }, loopSeconds: 2 }) }),
      c(k, "teeth", "Gear Teeth", [x, y + 0.6 * s, z + 0.6], [2.2 * s, 0.5 * s, 0.36], "edge", { rotation: { axis: "z", angle: 45 }, motion: mo("core", { spin: { axis: "z", turns: 1 }, loopSeconds: 2 }) }),
    ],
  },
];

/** Re-key a part so repeated inserts never collide. */
export function buildPart(partId: string, anchor: V, scale: number, serial: number): RawBoxSpec[] {
  const def = PARTS_LIBRARY.find((p) => p.id === partId);
  if (!def) return [];
  return def.build(anchor, scale, `part${serial}_${def.id}`);
}
