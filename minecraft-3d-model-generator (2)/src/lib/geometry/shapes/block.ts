import type { GeometryBuilder } from "../builder";

/** Full cube with ore speckles applied to the three visible faces. */
export function buildBlock(b: GeometryBuilder): void {
  b.box("block_core", [-8, -8, -8], [8, 8, 8], 0);

  for (let x = -7; x < 8; x += 2) {
    for (let y = -7; y < 8; y += 2) {
      const sample = b.noise(x, y);
      const material = sample < 40 ? 1 : sample < 65 ? 2 : 0;
      b.box("ore_front", [x, y, 8], [x + 1.8, y + 1.8, 8.15], material);
      b.box("ore_side", [8, y, x], [8.15, y + 1.8, x + 1.8], material);
      b.box(
        "ore_top",
        [x, 8, y],
        [x + 1.8, 8.15, y + 1.8],
        material === 0 ? 1 : 3,
        material !== 0,
      );
    }
  }

  if (b.detailed && b.settings.style === "fantasy") {
    for (let i = 0; i < b.accentCount; i++) {
      const x = -5 + i * 2.1;
      b.box(
        "ore_crystal_facet",
        [x, -3 + i, 8.15],
        [x + 1.3, -1.7 + i, 8.4],
        3,
      );
    }
  }
}
