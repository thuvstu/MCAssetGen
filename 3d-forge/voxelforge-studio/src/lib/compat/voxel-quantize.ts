/**
 * Palette tools for Minecraft-style pixel textures.
 * - Median cut quantization: Heckbert, "Color Image Quantization for Frame Buffer
 *   Display" (ACM SIGGRAPH, 1982) — the same approach used by MagicaVoxel's
 *   palette reduction.
 * - Error diffusion: Floyd–Steinberg.
 * - Ordered dithering: 8x8 Bayer matrix (stable, pixel-art friendly, no worm
 *   artifacts along flat edges).
 * Everything works in place on ImageData so the exported PNG matches the preview.
 */

export type DitherMode = "none" | "bayer" | "floyd";

/** Vanilla 1.20+ dye / wool family (approximate reference hexes). */
export const DYE_16: string[] = [
  "#e9eceb", "#f07613", "#be44b3", "#3aafd9",
  "#f1af15", "#5ea918", "#d96c88", "#36393d",
  "#7d7d73", "#158991", "#792aac", "#2d328a",
  "#4a2617", "#546d1b", "#a72b29", "#0f0e10",
];

/** Concrete family — higher saturation, common for build/prop assets. */
export const CONCRETE_16: string[] = [
  "#cfd5d5", "#c06800", "#96398d", "#3a76a6",
  "#b7a21c", "#5aa327", "#a86b7a", "#3d4449",
  "#7c7c76", "#127a86", "#5e2f88", "#2b3c90",
  "#4a2a1b", "#4d6d24", "#8a2a25", "#0e0d0f",
];

const BAYER_8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = Number.parseInt(clean.padEnd(6, "0").slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function distance(a: [number, number, number], b: [number, number, number]): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
}

export function paletteFromHexes(hexes: string[]): [number, number, number][] {
  return hexes.map(hexToRgb);
}

/** Median cut over the opaque pixels of an ImageData buffer. */
export function medianCutPalette(
  data: Uint8ClampedArray,
  alphaThreshold: number,
  targetCount: number,
): [number, number, number][] {
  const colors: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < alphaThreshold) continue;
    colors.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (colors.length === 0) return [[128, 128, 128]];

  const count = Math.max(1, Math.min(targetCount, colors.length));
  let boxes: [number, number, number][][] = [colors];

  while (boxes.length < count) {
    let splitIndex = -1;
    let bestScore = -1;
    let bestAxis = 0;

    boxes.forEach((box, index) => {
      if (box.length < 2) return;
      (["r", "g", "b"] as const).forEach((_, axis) => {
        let min = 255;
        let max = 0;
        box.forEach((c) => {
          const value = c[axis];
          if (value < min) min = value;
          if (value > max) max = value;
        });
        const score = (max - min) * Math.log(box.length + 1);
        if (score > bestScore) {
          bestScore = score;
          splitIndex = index;
          bestAxis = axis;
        }
      });
    });

    if (splitIndex < 0) break;
    const box = boxes[splitIndex];
    const sorted = [...box].sort((a, b) => a[bestAxis] - b[bestAxis]);
    const middle = Math.floor(sorted.length / 2);
    boxes = [
      ...boxes.slice(0, splitIndex),
      sorted.slice(0, middle),
      sorted.slice(middle),
      ...boxes.slice(splitIndex + 1),
    ];
  }

  return boxes
    .filter((box) => box.length > 0)
    .map((box) => {
      let r = 0;
      let g = 0;
      let b = 0;
      box.forEach((c) => {
        r += c[0];
        g += c[1];
        b += c[2];
      });
      return [r / box.length, g / box.length, b / box.length] as [number, number, number];
    });
}

export function nearestPaletteIndex(
  color: [number, number, number],
  palette: [number, number, number][],
): number {
  let best = 0;
  let bestScore = Infinity;
  for (let i = 0; i < palette.length; i += 1) {
    const score = distance(color, palette[i]);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

/**
 * Quantize the opaque pixels of a canvas buffer in place.
 * `ditherStrength` scales the dither amplitude (0 = flat snap, 100 = full noise).
 */
export function quantizeInPlace(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: [number, number, number][],
  alphaThreshold: number,
  ditherMode: DitherMode,
  ditherStrength: number,
): void {
  if (palette.length === 0) return;
  const amount = Math.max(0, Math.min(1, ditherStrength / 100));

  if (ditherMode === "floyd") {
    const errors = new Float32Array(width * height * 3);
    for (let i = 0; i < width * height; i += 1) {
      const o = i * 4;
      if (data[o + 3] < alphaThreshold) continue;
      const r = data[o] + errors[o];
      const g = data[o + 1] + errors[o + 1];
      const b = data[o + 2] + errors[o + 2];
      const snapped = palette[nearestPaletteIndex([r, g, b], palette)];
      const er = (r - snapped[0]) * amount;
      const eg = (g - snapped[1]) * amount;
      const eb = (b - snapped[2]) * amount;
      data[o] = snapped[0];
      data[o + 1] = snapped[1];
      data[o + 2] = snapped[2];

      const x = i % width;
      const y = Math.floor(i / width);
      const spread = (dx: number, dy: number, weight: number) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
        const t = (ny * width + nx) * 3;
        errors[t] += er * weight;
        errors[t + 1] += eg * weight;
        errors[t + 2] += eb * weight;
      };
      spread(1, 0, 7 / 16);
      spread(-1, 1, 3 / 16);
      spread(0, 1, 5 / 16);
      spread(1, 1, 1 / 16);
    }
    return;
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const o = (y * width + x) * 4;
      if (data[o + 3] < alphaThreshold) continue;
      const threshold = ((BAYER_8[y % 8][x % 8] + 0.5) / 64 - 0.5) * 48 * amount;
      const color: [number, number, number] = [
        data[o] + threshold,
        data[o + 1] + threshold,
        data[o + 2] + threshold,
      ];
      const snapped = palette[nearestPaletteIndex(color, palette)];
      data[o] = snapped[0];
      data[o + 1] = snapped[1];
      data[o + 2] = snapped[2];
    }
  }
}

/**
 * Blockbench/Hytale texture guidance: pure #000 and #fff break in-game lighting.
 * Clamp channels into a safe band without touching alpha.
 */
export function clampExtremeValues(
  data: Uint8ClampedArray,
  alphaThreshold: number,
  low = 12,
  high = 246,
): void {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < alphaThreshold) continue;
    const luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    if (luminance < 24) {
      data[i] = Math.max(low, data[i]);
      data[i + 1] = Math.max(low, data[i + 1]);
      data[i + 2] = Math.max(low, data[i + 2]);
    } else if (luminance > 238) {
      data[i] = Math.min(high, data[i]);
      data[i + 1] = Math.min(high, data[i + 1]);
      data[i + 2] = Math.min(high, data[i + 2]);
    }
  }
}
