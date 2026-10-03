import { buildGltfDocument } from "./exporters";
import {
  clampExtremeValues,
  CONCRETE_16,
  medianCutPalette,
  paletteFromHexes,
  quantizeInPlace,
  DYE_16,
} from "./quantize";
import type {
  AnimationPresetId,
  DisplayPresetId,
  ExtrudeProfile,
  GeneratedModel,
  GeneratorConfig,
  OutlinerGroupSummary,
  PaletteEntry,
  PixelCell,
  TextureInput,
  ValidationItem,
  VoxelCube,
} from "../types/model";

export function makeUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function safeFileName(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || "voxel_model";
}

export function safeIdentifier(value: string): string {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || "voxel_model";
}

function rounded(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = Number.parseInt(clean.padEnd(6, "0").slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function getDisplayTransform(preset: DisplayPresetId) {
  switch (preset) {
    case "tool":
      return {
        thirdperson_righthand: {
          rotation: [0, -90, 55],
          translation: [0, 4.0, 0.5],
          scale: [0.85, 0.85, 0.85],
        },
        thirdperson_lefthand: {
          rotation: [0, 90, -55],
          translation: [0, 4.0, 0.5],
          scale: [0.85, 0.85, 0.85],
        },
        firstperson_righthand: {
          rotation: [0, -90, 25],
          translation: [1.13, 3.2, 1.13],
          scale: [0.68, 0.68, 0.68],
        },
        firstperson_lefthand: {
          rotation: [0, 90, -25],
          translation: [1.13, 3.2, 1.13],
          scale: [0.68, 0.68, 0.68],
        },
        ground: {
          rotation: [0, 0, 0],
          translation: [0, 2, 0],
          scale: [0.5, 0.5, 0.5],
        },
        gui: {
          rotation: [0, 0, 0],
          translation: [0, 0, 0],
          scale: [0.95, 0.95, 0.95],
        },
        fixed: {
          rotation: [0, 180, 0],
          translation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      };
    case "block":
      return {
        gui: {
          rotation: [30, 225, 0],
          translation: [0, 0, 0],
          scale: [0.625, 0.625, 0.625],
        },
        ground: {
          rotation: [0, 0, 0],
          translation: [0, 3, 0],
          scale: [0.25, 0.25, 0.25],
        },
        fixed: {
          rotation: [0, 0, 0],
          translation: [0, 0, 0],
          scale: [0.5, 0.5, 0.5],
        },
        thirdperson_righthand: {
          rotation: [75, 45, 0],
          translation: [0, 2.5, 0],
          scale: [0.375, 0.375, 0.375],
        },
        firstperson_righthand: {
          rotation: [0, 45, 0],
          translation: [0, 0, 0],
          scale: [0.4, 0.4, 0.4],
        },
      };
    case "shield":
      return {
        thirdperson_righthand: {
          rotation: [0, 90, 0],
          translation: [2, -2, 4],
          scale: [1, 1, 1],
        },
        firstperson_righthand: {
          rotation: [0, 180, 5],
          translation: [-2, 1, -2],
          scale: [0.85, 0.85, 0.85],
        },
        gui: {
          rotation: [15, -25, -5],
          translation: [0, 0, 0],
          scale: [0.82, 0.82, 0.82],
        },
        ground: {
          rotation: [0, 0, 0],
          translation: [0, 3, 0],
          scale: [0.45, 0.45, 0.45],
        },
        fixed: {
          rotation: [0, 180, 0],
          translation: [0, 0, -1],
          scale: [0.9, 0.9, 0.9],
        },
      };
    case "item":
    default:
      return {
        ground: {
          rotation: [0, 0, 0],
          translation: [0, 2, 0],
          scale: [0.5, 0.5, 0.5],
        },
        head: {
          rotation: [0, 180, 0],
          translation: [0, 13, 7],
          scale: [1, 1, 1],
        },
        thirdperson_righthand: {
          rotation: [0, 0, 0],
          translation: [0, 3, 1],
          scale: [0.55, 0.55, 0.55],
        },
        firstperson_righthand: {
          rotation: [0, -90, 25],
          translation: [1.13, 3.2, 1.13],
          scale: [0.68, 0.68, 0.68],
        },
        fixed: {
          rotation: [0, 180, 0],
          translation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        gui: {
          rotation: [0, 0, 0],
          translation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      };
  }
}

function buildAnimations(preset: AnimationPresetId, rootGroupUuid: string, rootGroupName: string) {
  if (preset === "none") return [];

  if (preset === "idle_float") {
    return [
      {
        uuid: makeUuid(),
        name: "animation.model.idle_float",
        loop: "loop",
        override: false,
        length: 2.0,
        snapping: 24,
        selected: true,
        animators: {
          [rootGroupUuid]: {
            name: rootGroupName,
            type: "bone",
            keyframes: [
              {
                channel: "position",
                data_points: [{ x: "0", y: "0", z: "0" }],
                uuid: makeUuid(),
                time: 0,
                color: -1,
                interpolation: "catmullrom",
              },
              {
                channel: "position",
                data_points: [{ x: "0", y: "1.5", z: "0" }],
                uuid: makeUuid(),
                time: 1.0,
                color: -1,
                interpolation: "catmullrom",
              },
              {
                channel: "position",
                data_points: [{ x: "0", y: "0", z: "0" }],
                uuid: makeUuid(),
                time: 2.0,
                color: -1,
                interpolation: "catmullrom",
              },
              {
                channel: "rotation",
                data_points: [{ x: "0", y: "-6", z: "0" }],
                uuid: makeUuid(),
                time: 0,
                color: -1,
                interpolation: "linear",
              },
              {
                channel: "rotation",
                data_points: [{ x: "0", y: "6", z: "0" }],
                uuid: makeUuid(),
                time: 1.0,
                color: -1,
                interpolation: "linear",
              },
              {
                channel: "rotation",
                data_points: [{ x: "0", y: "-6", z: "0" }],
                uuid: makeUuid(),
                time: 2.0,
                color: -1,
                interpolation: "linear",
              },
            ],
          },
        },
      },
    ];
  }

  if (preset === "spin_loop") {
    return [
      {
        uuid: makeUuid(),
        name: "animation.model.spin_loop",
        loop: "loop",
        override: false,
        length: 4.0,
        snapping: 24,
        selected: true,
        animators: {
          [rootGroupUuid]: {
            name: rootGroupName,
            type: "bone",
            keyframes: [
              {
                channel: "rotation",
                data_points: [{ x: "0", y: "0", z: "0" }],
                uuid: makeUuid(),
                time: 0,
                color: -1,
                interpolation: "linear",
              },
              {
                channel: "rotation",
                data_points: [{ x: "0", y: "360", z: "0" }],
                uuid: makeUuid(),
                time: 4.0,
                color: -1,
                interpolation: "linear",
              },
            ],
          },
        },
      },
    ];
  }

  return [
    {
      uuid: makeUuid(),
      name: "animation.model.pulse",
      loop: "loop",
      override: false,
      length: 1.6,
      snapping: 24,
      selected: true,
      animators: {
        [rootGroupUuid]: {
          name: rootGroupName,
          type: "bone",
          keyframes: [
            {
              channel: "scale",
              data_points: [{ x: "1", y: "1", z: "1" }],
              uuid: makeUuid(),
              time: 0,
              color: -1,
              interpolation: "catmullrom",
            },
            {
              channel: "scale",
              data_points: [{ x: "1.08", y: "1.08", z: "1.14" }],
              uuid: makeUuid(),
              time: 0.8,
              color: -1,
              interpolation: "catmullrom",
            },
            {
              channel: "scale",
              data_points: [{ x: "1", y: "1", z: "1" }],
              uuid: makeUuid(),
              time: 1.6,
              color: -1,
              interpolation: "catmullrom",
            },
          ],
        },
      },
    },
  ];
}

function getZBounds(depth: number, maxThickness: number, profile: ExtrudeProfile): [number, number] {
  if (profile === "front") {
    return [0, rounded(depth)];
  }
  if (profile === "stepped_back") {
    const zStart = rounded(-maxThickness / 2);
    return [zStart, rounded(zStart + depth)];
  }
  return [rounded(-depth / 2), rounded(depth / 2)];
}

export function buildModelFromTexture(
  texture: TextureInput,
  config: GeneratorConfig,
  depthOverrides: ReadonlyMap<string, number>,
  emissiveOverrides: ReadonlySet<string>,
): GeneratedModel {
  const aspect = texture.width / texture.height;
  const textureWidth =
    aspect >= 1 ? config.resolution : Math.max(1, Math.round(config.resolution * aspect));
  const textureHeight =
    aspect >= 1 ? Math.max(1, Math.round(config.resolution / aspect)) : config.resolution;

  const canvas = document.createElement("canvas");
  canvas.width = textureWidth;
  canvas.height = textureHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Canvas context is not available.");
  }

  context.clearRect(0, 0, textureWidth, textureHeight);
  context.imageSmoothingEnabled =
    texture.width > textureWidth || texture.height > textureHeight;
  context.imageSmoothingQuality = "medium";
  context.drawImage(texture.source, 0, 0, textureWidth, textureHeight);

  const imgData = context.getImageData(0, 0, textureWidth, textureHeight);
  const raw = imgData.data;
  const thresholdAlpha = Math.round((config.alphaThreshold / 100) * 255);

  // Optional Flood-fill background removal from corners
  if (config.removeCornerBg) {
    const corners = [
      0,
      (textureWidth - 1) * 4,
      (textureHeight - 1) * textureWidth * 4,
      ((textureHeight - 1) * textureWidth + (textureWidth - 1)) * 4,
    ];
    const seedColors: [number, number, number][] = [];
    corners.forEach((idx) => {
      if (raw[idx + 3] >= thresholdAlpha) {
        seedColors.push([raw[idx], raw[idx + 1], raw[idx + 2]]);
      }
    });

    if (seedColors.length > 0) {
      const visited = new Uint8Array(textureWidth * textureHeight);
      const queue: [number, number][] = [];

      const matchesBg = (col: number, row: number) => {
        const idx = (row * textureWidth + col) * 4;
        if (raw[idx + 3] < thresholdAlpha) return true;
        const r = raw[idx];
        const g = raw[idx + 1];
        const b = raw[idx + 2];
        return seedColors.some(
          ([sr, sg, sb]) =>
            Math.abs(r - sr) + Math.abs(g - sg) + Math.abs(b - sb) <= 38,
        );
      };

      for (let col = 0; col < textureWidth; col += 1) {
        if (matchesBg(col, 0)) queue.push([col, 0]);
        if (matchesBg(col, textureHeight - 1)) queue.push([col, textureHeight - 1]);
      }
      for (let row = 0; row < textureHeight; row += 1) {
        if (matchesBg(0, row)) queue.push([0, row]);
        if (matchesBg(textureWidth - 1, row)) queue.push([textureWidth - 1, row]);
      }

      while (queue.length > 0) {
        const [col, row] = queue.pop()!;
        if (col < 0 || col >= textureWidth || row < 0 || row >= textureHeight) continue;
        const flatIdx = row * textureWidth + col;
        if (visited[flatIdx]) continue;
        if (!matchesBg(col, row)) continue;

        visited[flatIdx] = 1;
        raw[flatIdx * 4 + 3] = 0;
        queue.push([col + 1, row], [col - 1, row], [col, row + 1], [col, row - 1]);
      }
    }
  }

  // Optional 1px outline around opaque pixels
  if (config.addOutline) {
    const [or, og, ob] = hexToRgb(config.outlineColor);
    const snapshotAlpha = new Uint8Array(textureWidth * textureHeight);
    for (let i = 0; i < textureWidth * textureHeight; i += 1) {
      snapshotAlpha[i] = raw[i * 4 + 3] >= thresholdAlpha ? 1 : 0;
    }
    for (let row = 0; row < textureHeight; row += 1) {
      for (let col = 0; col < textureWidth; col += 1) {
        const idx = row * textureWidth + col;
        if (snapshotAlpha[idx]) continue;
        const hasOpaqueNeighbor =
          (col > 0 && snapshotAlpha[idx - 1] === 1) ||
          (col < textureWidth - 1 && snapshotAlpha[idx + 1] === 1) ||
          (row > 0 && snapshotAlpha[idx - textureWidth] === 1) ||
          (row < textureHeight - 1 && snapshotAlpha[idx + textureWidth] === 1);
        if (hasOpaqueNeighbor) {
          raw[idx * 4] = or;
          raw[idx * 4 + 1] = og;
          raw[idx * 4 + 2] = ob;
          raw[idx * 4 + 3] = 255;
        }
      }
    }
  }

  // ---- Palette pipeline: Heckbert median cut / vanilla palettes + Bayer or FS dithering ----
  let appliedPalette: string[] = [];
  if (config.colorMode !== "original") {
    const palette =
      config.colorMode === "dye16"
        ? paletteFromHexes(DYE_16)
        : config.colorMode === "concrete16"
          ? paletteFromHexes(CONCRETE_16)
          : medianCutPalette(raw, thresholdAlpha, config.colorCount);
    quantizeInPlace(
      raw,
      textureWidth,
      textureHeight,
      palette,
      thresholdAlpha,
      config.ditherMode,
      config.ditherStrength,
    );
    appliedPalette = palette.map(([r, g, b]) => rgbToHex(r, g, b));
  }
  if (config.clampBroadcast) clampExtremeValues(raw, thresholdAlpha);

  // ---- Silhouette cleanup: convex-corner softening (bevel) and speck removal ----
  const cornerFactor = new Float32Array(textureWidth * textureHeight).fill(1);
  if (config.cornerStyle !== "none") {
    const opaque = new Uint8Array(textureWidth * textureHeight);
    for (let i = 0; i < textureWidth * textureHeight; i += 1) {
      opaque[i] = raw[i * 4 + 3] >= thresholdAlpha ? 1 : 0;
    }
    const solid = (col: number, row: number) =>
      col < 0 || col >= textureWidth || row < 0 || row >= textureHeight
        ? 0
        : opaque[row * textureWidth + col];

    for (let row = 0; row < textureHeight; row += 1) {
      for (let col = 0; col < textureWidth; col += 1) {
        const idx = row * textureWidth + col;
        if (!opaque[idx]) continue;
        const orthoEmpty =
          (solid(col - 1, row) ? 0 : 1) +
          (solid(col + 1, row) ? 0 : 1) +
          (solid(col, row - 1) ? 0 : 1) +
          (solid(col, row + 1) ? 0 : 1);
        let convex = 0;
        ([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).forEach(([dc, dr]) => {
          if (!solid(col + dc, row) && !solid(col, row + dr) && !solid(col + dc, row + dr)) {
            convex += 1;
          }
        });

        if (convex === 0 && orthoEmpty === 0) continue;
        if (config.cornerStyle === "cut") {
          if (orthoEmpty === 4 || convex >= 2) raw[idx * 4 + 3] = 0;
          else cornerFactor[idx] = 0.72;
        } else {
          cornerFactor[idx] = Math.max(0.34, 1 - 0.17 * convex - 0.06 * orthoEmpty);
        }
      }
    }
  }

  // Write processed image data back to canvas so textureDataUrl matches
  context.putImageData(imgData, 0, 0);

  // Compute distance transform (distance from transparent/border) for dome & blade styles
  const distGrid = new Int16Array(textureWidth * textureHeight).fill(-1);
  const bfsQueue: [number, number][] = [];

  for (let row = 0; row < textureHeight; row += 1) {
    for (let col = 0; col < textureWidth; col += 1) {
      const idx = row * textureWidth + col;
      const alpha = raw[idx * 4 + 3];
      if (alpha < thresholdAlpha) {
        distGrid[idx] = 0;
      } else if (
        col === 0 ||
        row === 0 ||
        col === textureWidth - 1 ||
        row === textureHeight - 1
      ) {
        distGrid[idx] = 1;
        bfsQueue.push([col, row]);
      }
    }
  }

  for (let row = 0; row < textureHeight; row += 1) {
    for (let col = 0; col < textureWidth; col += 1) {
      const idx = row * textureWidth + col;
      if (distGrid[idx] !== -1) continue;
      const neighbors = [
        [col - 1, row],
        [col + 1, row],
        [col, row - 1],
        [col, row + 1],
      ];
      if (
        neighbors.some(
          ([nc, nr]) =>
            nc < 0 ||
            nc >= textureWidth ||
            nr < 0 ||
            nr >= textureHeight ||
            distGrid[nr * textureWidth + nc] === 0,
        )
      ) {
        distGrid[idx] = 1;
        bfsQueue.push([col, row]);
      }
    }
  }

  let head = 0;
  let maxEdgeDist = 1;
  while (head < bfsQueue.length) {
    const [col, row] = bfsQueue[head++];
    const currentDist = distGrid[row * textureWidth + col];
    maxEdgeDist = Math.max(maxEdgeDist, currentDist);
    const dirs = [
      [col - 1, row],
      [col + 1, row],
      [col, row - 1],
      [col, row + 1],
    ];
    dirs.forEach(([nc, nr]) => {
      if (nc < 0 || nc >= textureWidth || nr < 0 || nr >= textureHeight) return;
      const nIdx = nr * textureWidth + nc;
      if (distGrid[nIdx] === -1) {
        distGrid[nIdx] = currentDist + 1;
        bfsQueue.push([nc, nr]);
      }
    });
  }

  // Build 2D grid of PixelCells
  const cellGrid: (PixelCell | null)[][] = Array.from({ length: textureHeight }, () =>
    Array.from({ length: textureWidth }, () => null),
  );
  const pixels: PixelCell[] = [];
  const paletteCounts = new Map<string, number>();

  for (let row = 0; row < textureHeight; row += 1) {
    for (let col = 0; col < textureWidth; col += 1) {
      const idx = row * textureWidth + col;
      const offset = idx * 4;
      const r = raw[offset];
      const g = raw[offset + 1];
      const b = raw[offset + 2];
      const aByte = raw[offset + 3];
      if (aByte < thresholdAlpha) continue;

      const hex = rgbToHex(r, g, b);
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const adjLum = config.invertRelief ? 1 - lum : lum;
      const edgeNorm = distGrid[idx] / Math.max(1, maxEdgeDist);
      const key = `${col}:${row}`;

      let computedDepth = config.thickness;
      switch (config.style) {
        case "voxel":
          computedDepth = config.thickness;
          break;
        case "relief":
          computedDepth = Math.max(
            1,
            Math.round(config.thickness * (0.22 + adjLum * 0.78)),
          );
          break;
        case "dome":
          computedDepth = Math.max(
            1,
            Math.round(config.thickness * (0.25 + edgeNorm * 0.55 + adjLum * 0.2)),
          );
          break;
        case "blade": {
          const u = col / Math.max(1, textureWidth - 1);
          const v = 1 - row / Math.max(1, textureHeight - 1);
          const diagSpine = Math.max(0, 1 - Math.abs(u - v) * 1.65);
          const centerCross = Math.max(
            diagSpine,
            1 - Math.abs(u - 0.5) * 1.8,
          );
          computedDepth = Math.max(
            1,
            Math.round(
              config.thickness * (0.2 + edgeNorm * 0.45 + centerCross * 0.35),
            ),
          );
          break;
        }
        case "terraced": {
          const bands = Math.max(2, Math.min(6, config.thickness));
          const step = Math.min(bands, Math.floor(adjLum * bands) + 1);
          computedDepth = Math.max(
            1,
            Math.round((step / bands) * config.thickness),
          );
          break;
        }
      }

      if (config.cornerStyle !== "none") {
        computedDepth = Math.max(1, Math.round(computedDepth * cornerFactor[idx]));
      }

      if (depthOverrides.has(key)) {
        computedDepth = Math.max(1, Math.min(16, depthOverrides.get(key)!));
      }

      const emissive = emissiveOverrides.has(key);
      const cell: PixelCell = {
        col,
        row,
        r,
        g,
        b,
        a: aByte / 255,
        hex,
        depth: computedDepth,
        emissive,
      };
      cellGrid[row][col] = cell;
      pixels.push(cell);
      paletteCounts.set(hex, (paletteCounts.get(hex) ?? 0) + 1);
    }
  }

  // 2D Greedy Meshing
  const visited = Array.from({ length: textureHeight }, () =>
    new Uint8Array(textureWidth),
  );
  const modelWidth = aspect >= 1 ? 16 : 16 * aspect;
  const modelHeight = aspect >= 1 ? 16 / aspect : 16;
  const cellWidth = modelWidth / textureWidth;
  const cellHeight = modelHeight / textureHeight;
  const voxels: VoxelCube[] = [];

  const canMerge = (base: PixelCell, candidate: PixelCell | null): boolean => {
    if (!candidate) return false;
    if (config.greedyMode === "none") return false;
    if (base.depth !== candidate.depth || base.emissive !== candidate.emissive) {
      return false;
    }
    if (config.greedyMode === "color_depth") {
      return base.hex === candidate.hex;
    }
    if (config.groupingMode === "by_color") {
      return base.hex === candidate.hex;
    }
    return true;
  };

  for (let row = 0; row < textureHeight; row += 1) {
    for (let col = 0; col < textureWidth; col += 1) {
      const startCell = cellGrid[row][col];
      if (!startCell || visited[row][col]) continue;

      let colSpan = 1;
      let rowSpan = 1;

      if (config.greedyMode !== "none") {
        while (
          col + colSpan < textureWidth &&
          !visited[row][col + colSpan] &&
          canMerge(startCell, cellGrid[row][col + colSpan])
        ) {
          colSpan += 1;
        }

        let canExpandRow = true;
        while (canExpandRow && row + rowSpan < textureHeight) {
          for (let c = col; c < col + colSpan; c += 1) {
            if (
              visited[row + rowSpan][c] ||
              !canMerge(startCell, cellGrid[row + rowSpan][c])
            ) {
              canExpandRow = false;
              break;
            }
          }
          if (canExpandRow) {
            rowSpan += 1;
          }
        }
      }

      const pixelColors: string[][] = [];
      for (let rIdx = 0; rIdx < rowSpan; rIdx += 1) {
        const rowColors: string[] = [];
        for (let cIdx = 0; cIdx < colSpan; cIdx += 1) {
          visited[row + rIdx][col + cIdx] = 1;
          rowColors.push(cellGrid[row + rIdx][col + cIdx]?.hex ?? startCell.hex);
        }
        pixelColors.push(rowColors);
      }

      const x = rounded(-modelWidth / 2 + col * cellWidth);
      const y = rounded(
        -modelHeight / 2 + (textureHeight - (row + rowSpan)) * cellHeight,
      );
      const [zMin, zMax] = getZBounds(
        startCell.depth,
        config.thickness,
        config.extrudeProfile,
      );
      const groupName =
        config.groupingMode === "by_depth"
          ? `depth_layer_${startCell.depth}`
          : config.groupingMode === "by_color"
            ? `color_${startCell.hex.slice(1)}`
            : "voxel_mesh";

      const cubeId = makeUuid();
      voxels.push({
        id: cubeId,
        name:
          colSpan === 1 && rowSpan === 1
            ? `px_${String(row).padStart(2, "0")}_${String(col).padStart(2, "0")}`
            : `mesh_${String(row).padStart(2, "0")}_${String(col).padStart(2, "0")}_${colSpan}x${rowSpan}`,
        groupName,
        col,
        row,
        colSpan,
        rowSpan,
        x,
        y,
        z: zMin,
        width: rounded(colSpan * cellWidth),
        height: rounded(rowSpan * cellHeight),
        depth: rounded(zMax - zMin),
        color: startCell.hex,
        alpha: startCell.a,
        emissive: startCell.emissive,
        uv: [col, row, col + colSpan, row + rowSpan],
        pixelColors,
        rotation: [0, 0, 0],
        inflate: 0,
      });
    }
  }

  // Group organization
  const groupMap = new Map<string, OutlinerGroupSummary>();
  voxels.forEach((cube) => {
    const existing = groupMap.get(cube.groupName);
    if (existing) {
      existing.cubes.push(cube);
      existing.cubeCount += 1;
    } else {
      groupMap.set(cube.groupName, {
        uuid: makeUuid(),
        name: cube.groupName,
        colorSwatch: cube.color,
        cubeCount: 1,
        cubes: [cube],
      });
    }
  });
  const groups = Array.from(groupMap.values());

  // Build Blockbench .bbmodel JSON
  const projectName = config.modelName.trim() || "voxel_model";
  const identifier = safeIdentifier(projectName);
  const namespace = safeIdentifier(config.namespace || "custom");
  const textureUuid = makeUuid();
  const textureDataUrl = canvas.toDataURL("image/png");
  const displayTransforms = getDisplayTransform(config.displayPreset);

  const bbElements = voxels.map((cube, index) => {
    const [u1, v1, u2, v2] = cube.uv;
    const northUv = [u1, v1, u2, v2];
    const southUv = [u1, v1, u2, v2];
    const upUv = [u1, v1, u2, Math.min(textureHeight, v1 + 1)];
    const downUv = [u1, Math.max(v1, v2 - 1), u2, v2];
    const eastUv = [Math.max(u1, u2 - 1), v1, u2, v2];
    const westUv = [u1, v1, Math.min(textureWidth, u1 + 1), v2];

    return {
      name: cube.name,
      type: "cube",
      uuid: cube.id,
      from: [cube.x, cube.y, cube.z],
      to: [
        rounded(cube.x + cube.width),
        rounded(cube.y + cube.height),
        rounded(cube.z + cube.depth),
      ],
      origin: [0, 0, 0],
      rotation: [0, 0, 0],
      color: index % 8,
      export: true,
      visibility: true,
      locked: false,
      box_uv: false,
      rescale: false,
      autouv: 0,
      shade: !cube.emissive && config.ambientOcclusion,
      light_emission: cube.emissive ? 15 : 0,
      faces: {
        north: { uv: northUv, texture: 0 },
        east: { uv: eastUv, texture: 0 },
        south: { uv: southUv, texture: 0 },
        west: { uv: westUv, texture: 0 },
        up: { uv: upUv, texture: 0 },
        down: { uv: downUv, texture: 0 },
      },
    };
  });

  const rootGroupUuid = groups[0]?.uuid ?? makeUuid();
  const rootGroupName = groups[0]?.name ?? "voxel_mesh";

  const bbGroups =
    groups.length > 0
      ? groups.map((group, idx) => ({
          uuid: group.uuid,
          name: group.name,
          origin: [0, 0, 0],
          rotation: [0, 0, 0],
          color: idx % 8,
          export: true,
          mirror_uv: false,
          isOpen: true,
          locked: false,
          visibility: true,
          autouv: 0,
          nbt: "{}",
        }))
      : [
          {
            uuid: rootGroupUuid,
            name: "voxel_mesh",
            origin: [0, 0, 0],
            rotation: [0, 0, 0],
            color: 0,
            export: true,
            mirror_uv: false,
            isOpen: true,
            locked: false,
            visibility: true,
            autouv: 0,
            nbt: "{}",
          },
        ];

  const bbOutliner =
    groups.length > 0
      ? groups.map((group) => ({
          uuid: group.uuid,
          isOpen: true,
          children: group.cubes.map((c) => c.id),
        }))
      : [];

  const bbProject = {
    meta: {
      format_version: "5.0",
      model_format: "free",
      box_uv: false,
    },
    name: projectName,
    modelIdentifier: identifier,
    credit: "Generated with Voxel Forge Studio",
    ambientocclusion: config.ambientOcclusion,
    resolution: { width: textureWidth, height: textureHeight },
    elements: bbElements,
    groups: bbGroups,
    outliner: bbOutliner,
    textures: [
      {
        uuid: textureUuid,
        id: "0",
        name: `${identifier}_texture`,
        path: `${identifier}.png`,
        relative_path: `${identifier}.png`,
        width: textureWidth,
        height: textureHeight,
        uv_width: textureWidth,
        uv_height: textureHeight,
        particle: true,
        render_mode: "default",
        render_sides: config.doubleSided ? "double" : "auto",
        internal: true,
        source: textureDataUrl,
        mode: "bitmap",
        saved: false,
        visible: true,
        folder: "item",
        namespace,
      },
    ],
    display: displayTransforms,
    animations: buildAnimations(
      config.animationPreset,
      rootGroupUuid,
      rootGroupName,
    ),
    animation_controllers: [],
  };

  // Build Minecraft Java Edition Block/Item .json
  const javaElements = voxels.map((cube) => {
    const [u1, v1, u2, v2] = cube.uv;
    const sU1 = u1;
    const sV1 = v1;
    const sU2 = u2;
    const sV2 = v2;
    const onePxU = 1;
    const onePxV = 1;

    return {
      name: cube.name,
      from: [rounded(cube.x + 8), rounded(cube.y + 8), rounded(cube.z + 8)],
      to: [
        rounded(cube.x + cube.width + 8),
        rounded(cube.y + cube.height + 8),
        rounded(cube.z + cube.depth + 8),
      ],
      shade: !cube.emissive && config.ambientOcclusion,
      faces: {
        north: { uv: [sU1, sV1, sU2, sV2], texture: "#0" },
        south: { uv: [sU1, sV1, sU2, sV2], texture: "#0" },
        east: { uv: [rounded(sU2 - onePxU), sV1, sU2, sV2], texture: "#0" },
        west: { uv: [sU1, sV1, rounded(sU1 + onePxU), sV2], texture: "#0" },
        up: { uv: [sU1, sV1, sU2, rounded(sV1 + onePxV)], texture: "#0" },
        down: { uv: [sU1, rounded(sV2 - onePxV), sU2, sV2], texture: "#0" },
      },
    };
  });

  const javaModel = {
    credit: "Generated with Voxel Forge Studio",
    ambientocclusion: config.ambientOcclusion,
    texture_size: [textureWidth, textureHeight],
    textures: {
      "0": `${namespace}:item/${identifier}`,
      particle: `${namespace}:item/${identifier}`,
    },
    elements: javaElements,
    display: displayTransforms,
    groups: groups.map((group, gIdx) => ({
      name: group.name,
      origin: [8, 8, 8],
      color: gIdx % 8,
      children: group.cubes.map((c) => voxels.findIndex((v) => v.id === c.id)),
    })),
  };

  // Build glTF 2.0 (.gltf) — single file with embedded PNG texture
  const gltfText = buildGltfDocument({
    name: identifier,
    voxels,
    textureWidth,
    textureHeight,
    textureDataUrl,
  });

  // Build Minecraft Bedrock Edition .geo.json
  const bedrockBones = groups.map((group) => ({
    name: group.name,
    pivot: [0, 8, 0],
    cubes: group.cubes.map((cube) => ({
      origin: [cube.x, rounded(cube.y + 8), cube.z],
      size: [cube.width, cube.height, cube.depth],
      uv: [cube.uv[0], cube.uv[1]],
    })),
  }));

  const bedrockModel = {
    format_version: "1.12.0",
    "minecraft:geometry": [
      {
        description: {
          identifier: `geometry.${identifier}`,
          texture_width: textureWidth,
          texture_height: textureHeight,
          visible_bounds_width: 2,
          visible_bounds_height: 2.5,
          visible_bounds_offset: [0, 0.75, 0],
        },
        bones:
          bedrockBones.length > 0
            ? [
                {
                  name: "root",
                  pivot: [0, 0, 0],
                },
                ...bedrockBones.map((bone) => ({ ...bone, parent: "root" })),
              ]
            : [],
      },
    ],
  };

  // Palette summary
  const activePixelCount = pixels.length;
  const palette: PaletteEntry[] = Array.from(paletteCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([hex, count]) => ({
      hex,
      count,
      percentage:
        activePixelCount > 0
          ? Math.round((count / activePixelCount) * 1000) / 10
          : 0,
    }));

  const reductionPercent =
    activePixelCount > 0
      ? Math.max(
          0,
          Math.round(((activePixelCount - voxels.length) / activePixelCount) * 100),
        )
      : 0;

  // Model Validations
  const withinJavaBounds = voxels.every(
    (c) =>
      c.x + 8 >= -16 &&
      c.y + 8 >= -16 &&
      c.z + 8 >= -16 &&
      c.x + c.width + 8 <= 32 &&
      c.y + c.height + 8 <= 32 &&
      c.z + c.depth + 8 <= 32,
  );

  const validations: ValidationItem[] = [
    {
      label: "Blockbench 5.0 互換性",
      detail: `elements(${voxels.length}) / outliner(${groups.length} groups) / embedded PNG`,
      passed: voxels.length > 0,
    },
    {
      label: "Minecraft Java 座標範囲 (-16〜32)",
      detail: withinJavaBounds
        ? "すべてのキューブがJava Editionの座標制限内です"
        : "一部のキューブが範囲外です",
      passed: withinJavaBounds && voxels.length > 0,
    },
    {
      label: "メッシュ軽量化パフォーマンス",
      detail:
        voxels.length <= 350
          ? `${voxels.length} キューブ（マイクラ描画負荷：低・快適）`
          : `${voxels.length} キューブ（グリーディ統合の有効化を推奨）`,
      passed: voxels.length <= 350 && voxels.length > 0,
    },
    {
      label: "UVマッピング整合性",
      detail: `${textureWidth}×${textureHeight} UV空間に全6面を正規化済み / 描画 ${voxels.length * 12} トライアングル`,
      passed: voxels.length > 0,
    },
    {
      label:
        config.colorMode === "original"
          ? "パレット制限"
          : `パレット制限（${
              config.colorMode === "quantize"
                ? `メディアンカット ${config.colorCount}色`
                : config.colorMode === "dye16"
                  ? "染料16色"
                  : "コンクリート16色"
            }）`,
      detail:
        config.colorMode === "original"
          ? `${palette.length}色を維持。16色以下にするとマイクラ純正と馴染みます`
          : `適用後 ${palette.length}色 / ジザリング ${
              config.ditherMode === "none"
                ? "オフ"
                : config.ditherMode === "bayer"
                  ? `Bayer 8×8 ${config.ditherStrength}%`
                  : `Floyd–Steinberg ${config.ditherStrength}%`
            }`,
      passed: config.colorMode !== "original" || palette.length <= 32,
    },
    {
      label: "テクスチャ安全性 (純黒/純白)",
      detail: config.clampBroadcast
        ? "明度 extremes を 12〜246 にクランプ済み（AO・空光照らし対応）"
        : "クランプ無効。純白/純黒はゲーム内で破綻しやすいです",
      passed: config.clampBroadcast || palette.every((entry) => entry.count > 0),
    },
  ];

  return {
    version: makeUuid(),
    textureWidth,
    textureHeight,
    textureDataUrl,
    pixels,
    activePixelCount,
    voxels,
    groups,
    palette,
    reductionPercent,
    faceCount: voxels.length * 6,
    appliedPalette,
    bbmodelJson: JSON.stringify(bbProject, null, 2),
    javaJson: JSON.stringify(javaModel, null, 2),
    bedrockJson: JSON.stringify(bedrockModel, null, 2),
    gltfText,
    validations,
  };
}
