import type { GeometryBuilder } from "../builder";

const BLADE_ROWS = 22;
const GRIP_RINGS = 5;

/** Crystal blade: fullered body, lit cutting edges, layered guard, ringed grip. */
export function buildSword(b: GeometryBuilder): void {
  const { symmetric, detail, style } = b.settings;
  b.handle(-14.5, -6.4, 1.8);

  for (let row = 0; row < BLADE_ROWS; row++) {
    const y = -6 + row;
    const half = row > 19 ? 1 : row > 17 ? 2 : 3;
    for (let x = -half; x < half; x++) {
      const edge = x === -half || x === half - 1;
      let material = edge ? (x < 0 ? 1 : 0) : x <= -1 ? 3 : 2;
      if (!edge && b.noise(symmetric ? Math.abs(x + 0.5) : x, row) < detail / 4)
        material = x < 0 ? 4 : 1;
      if (style === "vanilla" && !edge) material = 2;
      b.box("blade_pixel", [x, y, -0.65], [x + 1, y + 1, 0.65], material);
    }

    if (style === "vanilla") continue;
    // Bright cutting edges catching the light down both sides of the blade.
    if (half === 3 && row > 0 && row < 19) {
      b.box("blade_edge_light", [-3, y, 0.62], [-2, y + 1, 0.82], 4, true);
      b.box("blade_edge_light", [2, y, 0.62], [3, y + 1, 0.82], 4, true);
    }
    // Dark fuller running down the centre of the blade.
    if (half === 3) {
      b.box("blade_fuller", [-0.6, y, -0.62], [0.6, y + 1, 0.62], 0);
      b.box("blade_fuller_ridge", [-0.16, y, -0.72], [0.16, y + 1, 0.72], 3);
    }
  }

  // Three-step taper to the point.
  b.box("blade_tip", [-1.4, 16, -0.6], [1.4, 17, 0.6], 2);
  b.box("blade_tip", [-0.75, 17, -0.5], [0.75, 18, 0.5], 3);
  if (style !== "vanilla") {
    b.box("blade_tip_point", [-0.28, 18, -0.3], [0.28, 18.9, 0.3], 4, true);
  }

  // Cross guard.
  b.box("guard_center", [-2.3, -7.7, -1.5], [2.3, -5.7, 1.5], 0);
  b.box("guard_plate", [-2.5, -7.9, 1.5], [2.5, -5.5, 1.75], 6);
  for (const side of [-1, 1]) {
    const armX = side < 0 ? -5.4 : 2.3;
    b.box("guard_arm", [armX, -7.1, -1.1], [armX + 3.1, -5.5, 1.1], 0);
    b.box(
      "guard_gold_inlay",
      [armX + 0.25, -6.1, 1.1],
      [armX + 2.85, -5.65, 1.32],
      style === "vanilla" ? 1 : 6,
    );
    b.box(
      "guard_rune",
      [armX + 0.6, -6.95, 1.32],
      [armX + 1.5, -6.25, 1.52],
      6,
      true,
    );
    const tipX = side < 0 ? -6.7 : 5.4;
    b.box("guard_tip", [tipX, -6.4, -1.15], [tipX + 1.3, -4.1, 1.15], 0);
    b.box(
      "guard_tip_light",
      [tipX + 0.2, -5, 1.15],
      [tipX + 1.1, -4.25, 1.3],
      1,
    );
    if (style !== "vanilla") {
      b.box(
        "guard_tip_crystal",
        [tipX + 0.35, -3.7, -0.7],
        [tipX + 0.95, -2.7, 0.7],
        2,
        true,
      );
    }
  }

  b.box("hilt_gold", [-1.5, -7.65, 1.5], [1.5, -5.75, 1.7], 6);
  b.box("hilt_gem_frame", [-1.1, -7.4, 1.7], [1.1, -5.9, 1.9], 0);
  b.box("hilt_crystal", [-0.7, -7.15, 1.9], [0.7, -6.15, 2.3], 2, true);

  // Metal rings wrap the grip.
  if (style !== "vanilla") {
    for (let i = 0; i < GRIP_RINGS; i++) {
      const y = -13.2 + i * 1.35;
      b.box("grip_ring", [-1.35, y, -1.15], [1.35, y + 0.38, 1.15], 0);
      b.box(
        "grip_ring_trim",
        [-1.1, y + 0.38, -1.05],
        [1.1, y + 0.58, 1.05],
        6,
      );
    }
  }

  if (b.detailed) {
    const step = b.settings.quality === "ultra" ? 1.5 : 3;
    for (let y = -4; y < 12; y += step) {
      b.box(
        "crystal_facet",
        [-0.15, y, 0.72],
        [0.55, y + 1.2, 0.88],
        b.noise(3, Math.floor(y)) > 45 ? 3 : 2,
      );
    }
    b.box("pommel_crystal", [-0.55, -15.5, -0.7], [0.55, -14.9, 0.7], 2, true);
    b.ornament("pommel_chain", [-0.5, -16.7, -0.5], [0.5, -15.7, 0.5], 6);
    b.ornament("pommel_chain", [-0.38, -17.8, -0.38], [0.38, -16.9, 0.38], 0);
    b.ornament(
      "pommel_chain_link",
      [-0.28, -18.7, -0.28],
      [0.28, -18, 0.28],
      6,
      true,
    );
  }

  if (!symmetric) b.box("asymmetric_guard", [4.8, -4.1, -1], [6.5, -1.6, 1], 6);
}
