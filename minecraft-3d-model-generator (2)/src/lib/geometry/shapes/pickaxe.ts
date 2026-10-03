import type { GeometryBuilder } from "../builder";

/** Curved crystal head on a long wrapped handle. */
export function buildPickaxe(b: GeometryBuilder): void {
  b.handle(-14, 8, 1.6);

  const headHeight = (x: number) => 10 - Math.floor(Math.abs(x + 0.5) / 2.5);
  for (let x = -8; x < 8; x++) {
    const y = headHeight(x);
    b.box("pick_frame", [x, y - 2, -1.1], [x + 1, y + 1, 1.1], 0);
    b.box(
      "pick_crystal",
      [x, y - 0.9, -1.15],
      [x + 1, y + 0.75, 1.15],
      x < 1 ? 3 : 2,
    );
  }
  b.box("left_tip", [-9, 5, -0.85], [-8, 8, 0.85], 2);
  b.box("right_tip", [8, 5, -0.85], [9, 8, 0.85], 1);
  b.box("head_binding", [-1.5, 7, -1.3], [1.5, 10.5, 1.3], 6);
  b.box("head_gem", [-0.8, 8, 1.3], [0.8, 9.7, 1.6], 3, true);

  if (b.detailed && b.settings.style === "fantasy") {
    for (let i = 0; i < b.accentCount; i++) {
      const x = -5 + i * 2;
      const y = headHeight(x);
      b.box(
        "pick_crystal_facet",
        [x, y - 0.5, 1.15],
        [x + 0.7, y + 0.5, 1.35],
        4,
      );
    }
  }
}
