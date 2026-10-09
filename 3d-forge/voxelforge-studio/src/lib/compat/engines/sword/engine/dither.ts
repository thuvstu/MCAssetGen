/**
 * Ordered Bayer dithering for low-resolution sword textures.
 *
 * The vanilla Minecraft sword reads as a stair-step diagonal. A solid
 * "everything below 50% lightness gets full shadow" turns those stairs into
 * bold outlines; a dithered version keeps the diagonal subtle. This is what
 * vanilla textures actually do at 16×.
 *
 * The dither here is intentionally cheap: it only fires when the surface
 * pattern is "polished" or any plain-looking surface, and it only nudges the
 * along-axis surface colour. It is **not** used at high resolutions.
 */
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

const BAYER_8 = (() => {
  const out: number[][] = Array.from({ length: 8 }, () => Array(8).fill(0));
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    out[y][x] = ((BAYER_4[y % 4][x % 4] * 16) + BAYER_4[(y >> 1) % 4][(x >> 1) % 4]) / 256 - 0.5;
  }
  return out;
})();

/** Per-pixel threshold in [-0.5, 0.5]. */
export function bayer8(x: number, y: number): number {
  return BAYER_8[((y % 8) + 8) % 8][((x % 8) + 8) % 8];
}

/**
 * Dither two luminance bands. If the input luminance is closer to `lowBand`,
 * shift toward `highBand` by `strength * threshold`; if closer to `highBand`,
 * shift toward `lowBand` by the same amount. The result reduces mid-tone
 * banding without changing the high- and low-luminance colours.
 */
export function ditherBandShift(
  rgb: [number, number, number],
  lowBand: [number, number, number],
  highBand: [number, number, number],
  strength: number,
  threshold: number,
): [number, number, number] {
  const r0 = rgb[0], g0 = rgb[1], b0 = rgb[2];
  const distLow = Math.abs(r0 - lowBand[0]) + Math.abs(g0 - lowBand[1]) + Math.abs(b0 - lowBand[2]);
  const distHigh = Math.abs(r0 - highBand[0]) + Math.abs(g0 - highBand[1]) + Math.abs(b0 - highBand[2]);
  const towardLow = distLow > distHigh;
  const shift = strength * threshold;
  if (towardLow) {
    return [
      r0 + (lowBand[0] - r0) * shift,
      g0 + (lowBand[1] - g0) * shift,
      b0 + (lowBand[2] - b0) * shift,
    ];
  }
  return [
    r0 + (highBand[0] - r0) * shift,
    g0 + (highBand[1] - g0) * shift,
    b0 + (highBand[2] - b0) * shift,
  ];
}

/** A simple per-pixel noise threshold for breaking up uniform mid-tones. */
export function hashNoise01(x: number, y: number, seed = 0): number {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n >>> 0) % 1000) / 1000;
}
