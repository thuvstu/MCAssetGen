import type { GeometryBuilder } from "../builder";

/** Long staff with a forked crown cradling a stack of crystals. */
export function buildStaff(b: GeometryBuilder): void {
  b.handle(-16, 7, 1.4);

  for (const side of [-1, 1]) {
    const armX = side < 0 ? -4 : 2.5;
    b.box("crown_arm", [armX, 6, -0.85], [armX + 1.5, 12, 0.85], 6);
    const tipX = side < 0 ? -3.5 : 2;
    b.box("crown_tip", [tipX, 12, -0.8], [tipX + 1.5, 14, 0.8], 0);
  }
  b.box("crown_base", [-3, 6, -1], [3, 8, 1], 0);

  for (let y = 9; y < 17; y++) {
    const half = y < 11 || y > 14 ? 1 : 2;
    for (let x = -half; x < half; x++) {
      b.box(
        "staff_crystal",
        [x, y, -1.4],
        [x + 1, y + 1, 1.4],
        x < 0 ? 3 : 2,
        x >= 0,
      );
    }
  }

  if (b.detailed) {
    for (let y = -12; y < 5; y += 4)
      b.box("staff_rune", [-0.4, y, 1], [0.4, y + 1, 1.2], 3, true);
  }
}
