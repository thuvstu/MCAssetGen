import type { GeometryBuilder } from "../builder";

/** Broad single-sided blade with a back spike and bound neck. */
export function buildAxe(b: GeometryBuilder): void {
  b.handle(-14, 12, 1.8);

  for (let y = 3; y < 13; y++) {
    const reach = y < 5 || y > 10 ? 6 : 8;
    for (let x = 1; x < reach; x++) {
      const edge = x === reach - 1 || y === 3 || y === 12;
      const material = edge
        ? 0
        : x > reach - 3
          ? 3
          : b.noise(x, y) < 35
            ? 1
            : 2;
      b.box("axe_blade", [x, y, -0.75], [x + 1, y + 1, 0.75], material);
    }
  }
  b.box("axe_neck", [-3.5, 6, -1.2], [2, 10, 1.2], 0);
  b.box("axe_back_spike", [-5, 7, -0.8], [-3.5, 9, 0.8], 1);
  b.box("axe_binding", [-1.3, 6.5, -1.3], [1.3, 10.5, 1.3], 6);
  b.box("axe_gem", [-0.75, 7.5, 1.3], [0.75, 9.5, 1.6], 3, true);

  if (b.detailed && b.settings.style === "fantasy") {
    for (let i = 0; i < b.accentCount; i++) {
      const x = 2.4 + (i % 2);
      const y = 4.8 + i * 1.2;
      b.box("axe_rune", [x, y, 0.75], [x + 0.6, y + 0.8, 0.95], 4);
    }
  }
}
