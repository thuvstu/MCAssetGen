import type { GeometryBuilder } from "../builder";

const BARREL_STEPS = 9;
const GEAR_TEETH = 6;

/** Arcane cannon: ribbed barrel, side gears, copper pipes and a charged muzzle. */
export function buildCannon(b: GeometryBuilder): void {
  b.handle(-13, -3, 1.8);

  b.box("cannon_receiver", [-3, -3, -2.4], [3, 3, 2.4], 0);
  b.box("cannon_plate", [-3.2, -3.2, 2.4], [3.2, 3.2, 2.7], 6);
  b.box("cannon_plate_back", [-3.2, -3.2, -2.7], [3.2, 3.2, -2.4], 1);
  b.box("cannon_rail", [-0.7, -3.4, 2.7], [0.7, 3.4, 3.1], 2, true);

  for (let i = 0; i < BARREL_STEPS; i++) {
    const y = 3 + i * 1.35;
    const width = 1.7 + (i > 6 ? (i - 6) * 0.35 : 0);
    b.box(
      "cannon_barrel",
      [-width, y, -width],
      [width, y + 1.25, width],
      i % 2 ? 0 : 1,
    );
    if (i % 3 === 1) {
      b.box(
        "cannon_barrel_glow",
        [-0.45, y + 0.2, width],
        [0.45, y + 1.05, width + 0.35],
        2,
        true,
      );
    }
  }

  b.box("cannon_muzzle", [-2.9, 14.6, -2.9], [2.9, 16.2, 2.9], 6);
  b.box("cannon_muzzle_ring", [-3.3, 16.2, -3.3], [3.3, 16.9, 3.3], 0);
  b.box("cannon_core", [-1.5, 15, -1.5], [1.5, 16.6, 1.5], 2, true);
  b.box("cannon_core_lens", [-0.8, 16.9, -0.8], [0.8, 17.6, 0.8], 4, true);

  for (const side of [-1, 1]) {
    const x = side * 3;
    b.box("cannon_gear", [x - 0.5, -1.7, -1.7], [x + 0.5, 1.7, 1.7], 6);
    b.box(
      "cannon_gear_hub",
      [x + (side < 0 ? -1.1 : 0.5), -0.7, -0.7],
      [x + (side < 0 ? -0.5 : 1.1), 0.7, 0.7],
      0,
    );
    for (let i = 0; i < GEAR_TEETH; i++) {
      const angle = (i / GEAR_TEETH) * Math.PI * 2;
      const y = Math.cos(angle) * 2.5;
      const z = Math.sin(angle) * 2.5;
      b.box(
        "cannon_gear_tooth",
        [x - 0.5, y - 0.45, z - 0.45],
        [x + 0.5, y + 0.45, z + 0.45],
        i % 2 ? 1 : 2,
      );
    }
    b.box(
      "cannon_pipe",
      [side * 3.7 - 0.4, -2, -1.2],
      [side * 3.7 + 0.4, 6.5, -0.4],
      6,
    );
    b.box(
      "cannon_pipe_elbow",
      [side * 3.7 - 0.4, 6.5, -1.2],
      [side * 3.7 + 0.4, 7.4, 1.4],
      0,
    );
    b.box(
      "cannon_grip_guard",
      [side * 2 - 0.35, -5.4, -1.5],
      [side * 2 + 0.35, -3, -1.1],
      1,
    );
  }

  if (b.detailed) {
    for (let i = 0; i < b.accentCount; i++) {
      const x = -1.8 + i * 1.8;
      b.box("cannon_rivet", [x - 0.3, 0.6, 2.7], [x + 0.3, 1.2, 3], 4, true);
    }
  }
}
