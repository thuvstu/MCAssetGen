import type { GeometryBuilder } from "../builder";

const SEGMENTS = 6;

/** Deployable mecha blade: armoured segments, neon spine and thruster hilts. */
export function buildMechBlade(b: GeometryBuilder): void {
  b.handle(-15, -5, 2);

  b.box("mech_guard", [-3.4, -6, -1.9], [3.4, -3.6, 1.9], 0);
  b.box("mech_guard_plate", [-3.6, -6.2, 1.9], [3.6, -3.4, 2.15], 6);
  b.box("mech_guard_plate", [-3.6, -6.2, -2.15], [3.6, -3.4, -1.9], 1);

  for (const side of [-1, 1]) {
    const x = side * 3.6;
    b.box("mech_thruster", [x - 0.8, -5.4, -1.2], [x + 0.8, -1.6, 1.2], 1);
    b.box(
      "mech_thruster_ring",
      [x - 0.95, -1.6, -1.35],
      [x + 0.95, -1, 1.35],
      0,
    );
    b.box(
      "mech_thruster_glow",
      [x - 0.5, -0.95, -0.6],
      [x + 0.5, -0.1, 0.6],
      2,
      true,
    );
    b.box("mech_wing_rail", [x - 0.3, -3.4, -1], [x + 0.3, -1, 1], 6);
  }

  for (let segment = 0; segment < SEGMENTS; segment++) {
    const y = -3 + segment * 3.1;
    const half = segment < 4 ? 2.6 : 2.1;
    b.box("mech_blade_segment", [-half, y, -0.85], [half, y + 2.6, 0.85], 1);
    b.box(
      "mech_blade_plate",
      [-half + 0.35, y + 0.35, 0.85],
      [half - 0.35, y + 2.25, 1.05],
      3,
    );
    for (const side of [-1, 1]) {
      const edgeX = side < 0 ? -half - 0.25 : half - 0.25;
      b.box(
        "mech_blade_edge",
        [edgeX, y, -0.7],
        [edgeX + 0.5, y + 2.6, 0.7],
        4,
        true,
      );
    }
    if (segment < SEGMENTS - 1) {
      b.box(
        "mech_neon_line",
        [-0.35, y + 2.6, 0.85],
        [0.35, y + 3.15, 1.1],
        2,
        true,
      );
      b.box("mech_joint", [-0.9, y + 2.6, -0.9], [0.9, y + 3.15, 0.9], 0);
    }
    if (b.detailed && segment % 2 === 0) {
      b.box("mech_rune", [-0.6, y + 0.9, 1.05], [0.6, y + 1.8, 1.25], 4, true);
    }
  }

  b.box("mech_tip", [-1.6, 15.6, -0.85], [1.6, 17.6, 0.85], 1);
  b.box("mech_tip_crown", [-0.9, 17.6, -0.6], [0.9, 18.6, 0.6], 0);
  b.box("mech_tip_glow", [-0.4, 18.6, -0.35], [0.4, 20, 0.35], 2, true);

  for (const cube of b.cubes) {
    if (
      cube.name.startsWith("mech_thruster") ||
      cube.name.startsWith("mech_wing_rail")
    )
      cube.rig = cube.from[0] < 0 ? "panel_left" : "panel_right";
  }

  if (!b.settings.symmetric) {
    b.box("mech_asymmetric_rail", [3.2, -2, -1.6], [3.9, 8, -0.9], 6);
  }
}
