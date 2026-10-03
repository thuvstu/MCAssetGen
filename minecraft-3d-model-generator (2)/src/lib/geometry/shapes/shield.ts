import type { GeometryBuilder } from "../builder";

/** Heater shield with a bordered face, crystal emblem and rear grip. */
export function buildShield(b: GeometryBuilder): void {
  for (let y = -11; y < 12; y++) {
    const half =
      y < -5 ? Math.max(1, Math.floor((y + 13) / 1.4)) : y > 9 ? 6 : 8;
    for (let x = -half; x < half; x++) {
      const edge = x === -half || x === half - 1 || y === 11;
      const border = x === -half + 1 || x === half - 2 || y === 10;
      const material = edge ? 0 : border ? 6 : Math.abs(x) < 1 ? 7 : 5;
      b.box("shield_pixel", [x, y, -0.8], [x + 1, y + 1, 0.8], material);
    }
  }
  b.box("emblem_frame", [-3, -1, 0.8], [3, 5, 1.4], 6);
  b.box("emblem_dark", [-2.5, -0.5, 1.4], [2.5, 4.5, 1.6], 0);
  b.box("emblem_crystal", [-1.6, 0.4, 1.6], [1.6, 3.6, 2.3], 2, true);
  b.box("emblem_glint", [-1.3, 2.5, 2.3], [-0.4, 3.3, 2.45], 4, true);
  b.box("shield_grip", [-2.5, -2.5, -2], [2.5, 2.5, -1.6], 6);

  if (b.detailed && b.settings.style === "fantasy") {
    for (const side of [-1, 1]) {
      for (let i = 0; i < b.accentCount; i++) {
        const offset = !b.settings.symmetric && side < 0 ? 0.75 : 0;
        const y = -4 + i * 2.5 + offset;
        const x = side < 0 ? -5.5 : 4.5;
        b.box("shield_rune", [x, y, 0.8], [x + 1, y + 1.4, 1.1], 6);
      }
    }
  }
}
