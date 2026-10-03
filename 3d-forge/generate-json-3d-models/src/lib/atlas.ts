import {
  ATLAS_GRID, FACES, KIND_RULES, type FaceName, type ModelKind, type ModelTexture, type VoxelCube, type VoxelModel,
} from "./model-types";

/** Minimal ImageData shape so the pure helpers run in Node as well as the browser. */
export interface ImageDataLike { data: Uint8ClampedArray | number[]; width: number; height: number }
export interface VoxelizeOptions {
  /** Extrusion depth in model units (0.5 – 4). */
  depth: number;
  /** Pixels below this alpha are treated as empty. */
  alphaThreshold: number;
  /** Pixels brighter than this become emissive, or null to disable. */
  glowThreshold: number | null;
  /** Merge horizontal runs of equal color into single elements. */
  mergeRuns: boolean;
  gridSize?: "native" | 16 | 32 | 64;
  removeBackground?: boolean;
}
export interface VoxelizeResult { cubes: VoxelCube[]; palette: string[]; width: number; height: number; transparent: number; gridWidth: number; gridHeight: number; colorCount: number }
export interface ImportedTexture { source: string; kind: "atlas" | "sprite"; width: number; height: number; palette: string[]; name: string; cols?: number; rows?: number; slots?: number[]; extrusion?: VoxelizeOptions; baseItem?: string }

export const DEFAULT_VOXELIZE: VoxelizeOptions = { depth: 1, alphaThreshold: 24, glowThreshold: null, mergeRuns: true, gridSize: "native", removeBackground: false };
/** Stable across PostgreSQL JSONB key reordering and restored optional defaults. */
export function extrusionKey(options?: VoxelizeOptions) {
  const e = { ...DEFAULT_VOXELIZE, ...options };
  return JSON.stringify([e.depth, e.alphaThreshold, e.glowThreshold, e.mergeRuns, e.gridSize ?? "native", !!e.removeBackground]);
}

const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;

/** Average color of a pixel rect, ignoring fully transparent pixels. */
export function averageRect(image: ImageDataLike, x0: number, y0: number, x1: number, y1: number) {
  let r = 0, g = 0, b = 0, a = 0, count = 0;
  for (let y = Math.floor(y0); y < Math.min(Math.ceil(y1), image.height); y++) {
    for (let x = Math.floor(x0); x < Math.min(Math.ceil(x1), image.width); x++) {
      const offset = (y * image.width + x) * 4;
      const alpha = image.data[offset + 3];
      count++; a += alpha;
      r += image.data[offset] * alpha; g += image.data[offset + 1] * alpha; b += image.data[offset + 2] * alpha;
    }
  }
  if (!a || !count) return null;
  return { r: r / a, g: g / a, b: b / a, a: a / count };
}

/** Reads the 8 material tiles of a 4 × 2 UV atlas so tag generation can use a custom texture. */
export function sampleAtlasPalette(image: ImageDataLike, cols: number = ATLAS_GRID.cols, rows: number = ATLAS_GRID.rows): string[] {
  const palette: string[] = [];
  for (let index = 0; index < cols * rows; index++) {
    const col = index % cols, row = Math.floor(index / cols);
    const average = averageRect(image, col * image.width / cols, row * image.height / rows, (col + 1) * image.width / cols, (row + 1) * image.height / rows);
    palette.push(average ? toHex(average.r, average.g, average.b) : "#8a7f96");
  }
  return palette;
}

function quantize(value: number) { return Math.round(value / 32) * 32; }
/** Picks up to 8 representative colors; every other cell snaps to the nearest one. */
function buildPalette(cells: { r: number; g: number; b: number }[]): string[] {
  const counts = new Map<string, { r: number; g: number; b: number; count: number }>();
  for (const cell of cells) {
    const key = `${quantize(cell.r)},${quantize(cell.g)},${quantize(cell.b)}`;
    const entry = counts.get(key);
    if (entry) entry.count++;
    else counts.set(key, { r: cell.r, g: cell.g, b: cell.b, count: 1 });
  }
  const top = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  while (top.length < 8) top.push({ r: 128, g: 128, b: 128, count: 0 });
  return top.map(entry => toHex(entry.r, entry.g, entry.b));
}
function nearestIndex(palette: string[], r: number, g: number, b: number) {
  let best = 0, bestDistance = Infinity;
  palette.forEach((hex, index) => {
    const pr = parseInt(hex.slice(1, 3), 16), pg = parseInt(hex.slice(3, 5), 16), pb = parseInt(hex.slice(5, 7), 16);
    const distance = (pr - r) ** 2 + (pg - g) ** 2 + (pb - b) ** 2;
    if (distance < bestDistance) { bestDistance = distance; best = index; }
  });
  return best;
}

/** Removes only a uniform border-connected background. Enclosed light-colored pixels remain. */
export function removeBorderBackground(image: ImageDataLike): ImageDataLike {
  const { width, height } = image;
  const data = new Uint8ClampedArray(image.data);
  const corners = [0, width - 1, (height - 1) * width, width * height - 1];
  const reference = Array.from(data.slice(0, 3));
  const matches = (pixel: number) => [0, 1, 2].every(channel => Math.abs(data[pixel * 4 + channel] - reference[channel]) <= 18);
  if (!corners.every(pixel => data[pixel * 4 + 3] > 245 && matches(pixel))) return { data, width, height };
  const visited = new Uint8Array(width * height);
  const queue: number[] = [...corners];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const pixel = queue[cursor];
    if (visited[pixel]) continue;
    visited[pixel] = 1;
    if (!matches(pixel)) continue;
    data[pixel * 4 + 3] = 0;
    const x = pixel % width, y = Math.floor(pixel / width);
    if (x > 0) queue.push(pixel - 1);
    if (x < width - 1) queue.push(pixel + 1);
    if (y > 0) queue.push(pixel - width);
    if (y < height - 1) queue.push(pixel + width);
  }
  return { data, width, height };
}

/** Pixel-faithful extrusion. Native pixels up to 64px; larger images are explicitly sampled to 64px. */
export function voxelizeFromImageData(source: ImageDataLike, options: VoxelizeOptions = DEFAULT_VOXELIZE): VoxelizeResult {
  const image = options.removeBackground ? removeBorderBackground(source) : source;
  const limit = options.gridSize === "native" || !options.gridSize ? 64 : options.gridSize;
  const factor = Math.min(1, limit / Math.max(image.width, image.height));
  const gw = Math.max(1, Math.round(image.width * factor)), gh = Math.max(1, Math.round(image.height * factor));
  const sampled: ({ r: number; g: number; b: number; a: number } | null)[] = [];
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const average = averageRect(image, x * image.width / gw, y * image.height / gh, (x + 1) * image.width / gw, (y + 1) * image.height / gh);
    sampled.push(average && average.a > 0 && average.a >= options.alphaThreshold ? average : null);
  }
  const present = sampled.filter(Boolean) as { r: number; g: number; b: number; a: number }[];
  const palette = buildPalette(present);
  const colorCount = new Set(present.map(cell => toHex(cell.r, cell.g, cell.b))).size;
  const cells = sampled.map(cell => cell ? {
    color: nearestIndex(palette, cell.r, cell.g, cell.b),
    glow: options.glowThreshold !== null && (.2126 * cell.r + .7152 * cell.g + .0722 * cell.b) / 255 >= options.glowThreshold,
  } : null);
  const consumed = new Uint8Array(gw * gh);
  const cubes: VoxelCube[] = [];
  const unit = 16 / Math.max(gw, gh);
  const offsetX = 8 - gw * unit / 2, offsetY = 8 - gh * unit / 2;
  const depth = Math.max(.25, Math.min(4, options.depth));
  const z0 = 8 - depth / 2, z1 = 8 + depth / 2;
  const uvRect = (x0: number, y0: number, x1: number, y1: number): [number, number, number, number] =>
    [x0 / gw * 16, y0 / gh * 16, x1 / gw * 16, y1 / gh * 16];
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const entry = cells[y * gw + x];
    if (!entry || consumed[y * gw + x]) continue;
    let end = x + 1, bottom = y + 1;
    if (options.mergeRuns) {
      // Different colors are safe to merge: the front UV retains the entire original image region.
      while (end < gw && !consumed[y * gw + end] && cells[y * gw + end]?.glow === entry.glow) end++;
      rows: while (bottom < gh) {
        for (let column = x; column < end; column++) {
          if (consumed[bottom * gw + column] || cells[bottom * gw + column]?.glow !== entry.glow) break rows;
        }
        bottom++;
      }
    }
    for (let row = y; row < bottom; row++) for (let column = x; column < end; column++) consumed[row * gw + column] = 1;
    const front = uvRect(x, y, end, bottom);
    cubes.push({
      name: `sprite_${x}_${y}`, from: [offsetX + x * unit, offsetY + (gh - bottom) * unit, z0],
      to: [offsetX + end * unit, offsetY + (gh - y) * unit, z1], color: entry.color,
      ...(entry.glow ? { glow: true } : {}),
      uv: {
        south: front,
        // Back is mirrored in object space, so the same image reads correctly from the other side.
        north: [front[2], front[1], front[0], front[3]],
        east: uvRect(end - 1, y, end, bottom), west: uvRect(x, y, x + 1, bottom),
        up: uvRect(x, y, end, y + 1), down: uvRect(x, bottom - 1, end, bottom),
      },
    });
  }
  return { cubes, palette, width: image.width, height: image.height, transparent: gw * gh - present.length, gridWidth: gw, gridHeight: gh, colorCount };
}

const SAMPLE_ART: Record<string, { rows: string[]; colors: Record<string, string> }> = {
  heart: { colors: { "#": "#d9556b", "+": "#ff9fb0" }, rows: [".##..##.", "+#++###+", "########", "########", ".######.", "..####..", "...##...", "........"] },
  key: { colors: { "#": "#d9b25c", "+": "#ffe6a8" }, rows: ["..+++...", ".+#++#..", ".+#++#..", "..+++...", "...#....", "...#.#..", "...#....", "...#.#.."] },
  gem: { colors: { "#": "#4fb9d8", "+": "#c4f4ff" }, rows: ["..++++..", ".+####+.", "+#+#+##+", "########", ".######.", "..####..", "...##...", "........"] },
};
export const SAMPLE_SPRITES = Object.keys(SAMPLE_ART);
/** 8 × 8 art scaled to a 16 × 16 image, so the samples can be tried without uploading a file. */
export function sampleSprite(name: string): ImageDataLike {
  const art = SAMPLE_ART[name] ?? SAMPLE_ART.heart;
  const size = 16, data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const char = art.rows[Math.floor(y / 2)][Math.floor(x / 2)];
      const hex = art.colors[char];
      const offset = (y * size + x) * 4;
      if (!hex) { data[offset + 3] = 0; continue; }
      data[offset] = parseInt(hex.slice(1, 3), 16); data[offset + 1] = parseInt(hex.slice(3, 5), 16);
      data[offset + 2] = parseInt(hex.slice(5, 7), 16); data[offset + 3] = 255;
    }
  }
  return { data, width: size, height: size };
}

/** Motif keywords still decide the base item, so the /give command stays useful for imported sprites. */
export function kindFromTags(tags: string[]): ModelKind | null {
  const text = tags.join(" ").toLowerCase();
  return KIND_RULES.find(([, expression]) => expression.test(text))?.[0] ?? null;
}

// -----------------------------------------------------------------------------------------------
// Browser helpers (image decoding / encoding)
// -----------------------------------------------------------------------------------------------
export function imageDataFromCanvas(canvas: HTMLCanvasElement): ImageDataLike {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("画像を読み込めませんでした。");
  return context.getImageData(0, 0, canvas.width, canvas.height);
}
export function drawToCanvas(image: ImageDataLike): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = image.width; canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("画像を処理できませんでした。");
  const imageData = context.createImageData(image.width, image.height);
  imageData.data.set(image.data as Uint8ClampedArray);
  context.putImageData(imageData, 0, 0);
  return canvas;
}
export const imageDataToPng = (image: ImageDataLike) => drawToCanvas(image).toDataURL("image/png");

/** Loads an uploaded image, downscales huge files, and returns normalized pixel data plus a PNG data URL. */
export async function importImageFile(file: File, maxSize = 512): Promise<{ image: ImageDataLike; source: string; name: string }> {
  if (!file.type.startsWith("image/")) throw new Error("PNG または JPEG 画像を選択してください。");
  if (file.size > 8 * 1024 * 1024) throw new Error("画像は 8MB 以内のものを選択してください。");
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    reader.readAsDataURL(file);
  });
  return { ...(await importImageDataUrl(source, maxSize)), name: file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "texture" };
}
export async function importImageDataUrl(source: string, maxSize = 512): Promise<{ image: ImageDataLike; source: string }> {
  const element = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像をデコードできませんでした。PNG または JPEG をお試しください。"));
    image.src = source;
  });
  if (!element.naturalWidth || !element.naturalHeight) throw new Error("画像のサイズを取得できませんでした。");
  const scale = Math.min(1, maxSize / Math.max(element.naturalWidth, element.naturalHeight));
  const width = Math.max(1, Math.round(element.naturalWidth * scale));
  const height = Math.max(1, Math.round(element.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("画像を処理できませんでした。");
  context.imageSmoothingEnabled = false;
  context.drawImage(element, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  return { image: imageData, source: canvas.toDataURL("image/png") };
}

/** Builds the texture record stored on a model, so previews and exports use the imported pixels. */
export function toModelTexture(imported: ImportedTexture): ModelTexture {
  return {
    source: imported.source, kind: imported.kind, width: imported.width, height: imported.height, name: imported.name, palette: imported.palette,
    ...(imported.kind === "atlas" ? { cols: imported.cols ?? ATLAS_GRID.cols, rows: imported.rows ?? ATLAS_GRID.rows, slots: imported.slots } : { extrusion: imported.extrusion }),
  };
}
export const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 24) || "sprite";
