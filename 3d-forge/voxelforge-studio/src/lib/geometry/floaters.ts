import type { ModelKind, Vec3 } from "../model-types";
import type { GeometryBuilder } from "./builder";

/** Point each template's floating structures orbit around. */
const FLOATER_ANCHORS: Readonly<Partial<Record<ModelKind, Vec3>>> = {
  sword: [0, 17.5, 0],
  pickaxe: [0, 10.5, 0],
  axe: [8, 8, 0],
  shield: [0, 13, 0],
  staff: [0, 18.5, 0],
  block: [0, 10.5, 0],
  drill: [0, 19, 0],
  cannon: [0, 18, 0],
  mechblade: [0, 19.5, 0],
};

const ORBIT_COUNT = 8;
const ORBIT_RADIUS = 3.4;

function buildCrystal(builder: GeometryBuilder, anchor: Vec3): void {
  const [, y] = anchor;
  builder.floater(
    "floater_crystal",
    [-0.7, y + 4.2, -0.7],
    [0.7, y + 6.4, 0.7],
    3,
    true,
  );
  builder.floater(
    "floater_crystal_glint",
    [-0.45, y + 5.6, 0.55],
    [0.35, y + 6.3, 0.7],
    4,
    true,
  );
  builder.floater(
    "floater_rock",
    [-1.9, y + 2.6, 0.5],
    [-1.05, y + 3.35, 1.25],
    1,
  );
  builder.floater("floater_rock", [1.3, y + 5, -1], [2, y + 5.65, -0.35], 0);
  if (builder.settings.quality !== "standard") {
    builder.floater(
      "floater_rock",
      [-1.6, y + 6.6, -0.8],
      [-1, y + 7.15, -0.3],
      2,
    );
  }
}

function buildOrbit(builder: GeometryBuilder, anchor: Vec3): void {
  const [ax, ay, az] = anchor;
  for (let i = 0; i < ORBIT_COUNT; i++) {
    const angle = (i / ORBIT_COUNT) * Math.PI * 2;
    const x = ax + Math.cos(angle) * ORBIT_RADIUS;
    const z = az + Math.sin(angle) * ORBIT_RADIUS;
    const y = ay + 1.6;
    builder.floater(
      "floater_orb",
      [x - 0.45, y - 0.45, z - 0.45],
      [x + 0.45, y + 0.45, z + 0.45],
      i % 2 ? 3 : 4,
      i % 2 === 0,
    );
  }
  builder.floater(
    "floater_core",
    [ax - 0.5, ay + 1.1, az - 0.5],
    [ax + 0.5, ay + 2.1, az + 0.5],
    2,
    true,
  );
}

function buildSwarm(builder: GeometryBuilder, anchor: Vec3): void {
  const [ax, ay, az] = anchor;
  const count = builder.settings.quality === "standard" ? 7 : 10;
  for (let i = 0; i < count; i++) {
    const azimuth = (builder.noise(i + 5, 7) / 100) * Math.PI * 2;
    const elevation = (builder.noise(i + 5, 13) / 100 - 0.5) * 2.4;
    const radius = 2.4 + (builder.noise(i + 5, 21) / 100) * 2.8;
    const x = ax + Math.cos(azimuth) * Math.cos(elevation) * radius;
    const y = ay + 2 + Math.sin(elevation) * radius * 0.85;
    const z = az + Math.sin(azimuth) * Math.cos(elevation) * radius;
    const size = 0.45 + (builder.noise(i + 5, 31) / 100) * 0.55;
    const material = 1 + (builder.noise(i + 5, 41) % 4);
    builder.floater(
      "floater_shard",
      [x - size / 2, y - size / 2, z - size / 2],
      [x + size / 2, y + size / 2, z + size / 2],
      material,
      material === 4,
    );
  }
}

/** Adds the selected family of floating structures around the model. */
export function applyFloaters(builder: GeometryBuilder): void {
  const { floaters, kind } = builder.settings;
  if (!floaters || floaters === "none") return;
  const bounds = builder.bodyBounds();
  const [x, y, z] = FLOATER_ANCHORS[kind] ?? [
    (bounds.min[0] + bounds.max[0]) / 2,
    bounds.max[1] + 1,
    0,
  ];
  const anchor: Vec3 = [
    x,
    y + (FLOATER_ANCHORS[kind] ? builder.anchorLift : 0),
    z,
  ];
  if (floaters === "crystal") buildCrystal(builder, anchor);
  else if (floaters === "orbit") buildOrbit(builder, anchor);
  else buildSwarm(builder, anchor);
}
