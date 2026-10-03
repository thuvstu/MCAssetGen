import type { GeometryBuilder } from "../builder";

const FLIGHT_STEPS = 26;
const FLIGHT_TURNS = 5;
const GEAR_TEETH = 8;

/** Mechanical drill: gear housing, helical flight and a glowing tip. */
export function buildDrill(b: GeometryBuilder): void {
  b.handle(-15, -2, 1.8);

  b.box("drill_gear_housing", [-3.2, -2, -2.2], [3.2, 3.2, 2.2], 0);
  b.box("drill_gear_face", [-2.4, 3.2, -2.4], [2.4, 3.9, 2.4], 1);
  for (let i = 0; i < GEAR_TEETH; i++) {
    const angle = (i / GEAR_TEETH) * Math.PI * 2;
    const x = Math.cos(angle) * 3.6;
    const z = Math.sin(angle) * 3.6;
    b.box(
      "drill_gear_tooth",
      [x - 0.55, 0.2, z - 0.55],
      [x + 0.55, 2.2, z + 0.55],
      i % 2 ? 1 : 2,
    );
  }
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    b.box(
      "drill_bolt",
      [Math.cos(angle) * 1.7 - 0.35, 3.9, Math.sin(angle) * 1.7 - 0.35],
      [Math.cos(angle) * 1.7 + 0.35, 4.5, Math.sin(angle) * 1.7 + 0.35],
      6,
    );
  }

  b.box("drill_shaft", [-0.85, 3.4, -0.85], [0.85, 16, 0.85], 0);
  for (let i = 0; i < FLIGHT_STEPS; i++) {
    const t = i / (FLIGHT_STEPS - 1);
    const y = 3.6 + t * 12.2;
    const angle = t * Math.PI * 2 * FLIGHT_TURNS;
    const radius = 2.5 * (1 - t * 0.82);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const span = 1.15 - t * 0.55;
    b.box(
      "drill_flight",
      [x - span, y, z - span],
      [x + span, y + 0.55, z + span],
      i % 3 === 0 ? 2 : 1,
    );
    if (i % 4 === 1)
      b.box(
        "drill_flight_light",
        [x - span * 0.5, y + 0.55, z - span * 0.5],
        [x + span * 0.5, y + 0.75, z + span * 0.5],
        3,
        true,
      );
  }

  b.box("drill_tip", [-0.5, 16, -0.5], [0.5, 18, 0.5], 2, true);
  b.box("drill_tip_point", [-0.22, 18, -0.22], [0.22, 19.2, 0.22], 4, true);

  for (const side of [-1, 1]) {
    const x = side * 3.6;
    b.box("drill_pipe", [x - 0.45, -1.2, -1.5], [x + 0.45, 4.2, -0.6], 6);
    b.box("drill_pipe_cap", [x - 0.62, 4.2, -1.68], [x + 0.62, 5.1, -0.42], 0);
    b.box(
      "drill_exhaust_glow",
      [x - 0.32, 4.3, -1.36],
      [x + 0.32, 4.9, -0.74],
      3,
      true,
    );
    b.box("drill_vent", [x - 0.35, -1.6, 1.4], [x + 0.35, 1.4, 1.8], 1);
  }

  if (b.detailed) {
    for (let i = 0; i < b.accentCount; i++) {
      const y = -1 + i * 1.5;
      b.box("drill_cable", [-3.9, y, -0.3], [-3.2, y + 0.6, 0.3], 0);
      b.box("drill_cable", [3.2, y, -0.3], [3.9, y + 0.6, 0.3], 0);
    }
  }
}
