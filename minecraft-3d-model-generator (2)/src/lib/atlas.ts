import { PNG } from "pngjs";
import type { AtlasInput, UVRect } from "./model-types";

export const FALLBACK_ATLAS_SIZE = 64;
const FALLBACK_TILE_WIDTH = 16;
const FALLBACK_TILE_HEIGHT = 32;
/** Tiles sampled per axis when matching an uploaded atlas to the palette. */
const SAMPLE_GRID = 16;
const PNG_SIGNATURE = "89504e470d0a1a0a";
const DATA_URL_PREFIX = "data:image/png;base64,";

export interface AtlasTile {
  color: [number, number, number];
  uv: UVRect;
}

export function toDataUrl(buffer: Buffer): string {
  return DATA_URL_PREFIX + buffer.toString("base64");
}

export function decodeDataUrl(source: string): Buffer {
  return Buffer.from(source.split(",")[1], "base64");
}

export function isPngDataUrl(source: unknown): source is string {
  return typeof source === "string" && source.startsWith(DATA_URL_PREFIX);
}

export function hasPngSignature(buffer: Buffer): boolean {
  return buffer.length >= 24 && buffer.toString("hex", 0, 8) === PNG_SIGNATURE;
}

export function readPngSize(buffer: Buffer): { width: number; height: number } {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

export function toHexColor(rgb: readonly number[]): string {
  return (
    "#" +
    rgb.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")
  );
}

export function toRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((index) =>
    parseInt(hex.slice(index, index + 2), 16),
  ) as [number, number, number];
}

/** Renders the built-in 64x64 atlas: one 16x32 tile per palette entry. */
export function createFallbackAtlas(palette: string[]): string {
  const png = new PNG({
    width: FALLBACK_ATLAS_SIZE,
    height: FALLBACK_ATLAS_SIZE,
  });
  for (let y = 0; y < FALLBACK_ATLAS_SIZE; y++) {
    for (let x = 0; x < FALLBACK_ATLAS_SIZE; x++) {
      const tile =
        Math.floor(x / FALLBACK_TILE_WIDTH) +
        Math.floor(y / FALLBACK_TILE_HEIGHT) * 4;
      const color = toRgb(palette[tile]);
      const localX = x % FALLBACK_TILE_WIDTH;
      const localY = y % FALLBACK_TILE_HEIGHT;
      const isBorder = localX < 1 || localX > 14 || localY < 1 || localY > 30;
      const grain =
        (((Math.floor(localX / 3) * 31 +
          Math.floor(localY / 3) * 17 +
          tile * 13) %
          13) -
          6) *
        0.65;
      const offset = (y * FALLBACK_ATLAS_SIZE + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        png.data[offset + channel] = isBorder
          ? Math.round(color[channel] * 0.45)
          : Math.max(0, Math.min(255, color[channel] + grain));
      }
      png.data[offset + 3] = 255;
    }
  }
  return toDataUrl(PNG.sync.write(png));
}

/** Splits an uploaded atlas into a grid and averages the opaque pixels of each cell. */
const sampleCache = new Map<string, AtlasTile[]>();
export function sampleAtlasTiles(atlas: AtlasInput): AtlasTile[] {
  const cached = sampleCache.get(atlas.source);
  if (cached) return cached;
  const png = PNG.sync.read(decodeDataUrl(atlas.source));
  const tileWidth = Math.max(1, Math.floor(png.width / SAMPLE_GRID));
  const tileHeight = Math.max(1, Math.floor(png.height / SAMPLE_GRID));
  const tiles: AtlasTile[] = [];

  for (let y = 0; y <= png.height - tileHeight; y += tileHeight) {
    for (let x = 0; x <= png.width - tileWidth; x += tileWidth) {
      const sums = [0, 0, 0];
      let opaque = 0;
      for (let py = y; py < y + tileHeight; py++) {
        for (let px = x; px < x + tileWidth; px++) {
          const index = (py * png.width + px) * 4;
          if (png.data[index + 3] < 128) continue;
          for (let channel = 0; channel < 3; channel++)
            sums[channel] += png.data[index + channel];
          opaque++;
        }
      }
      if (opaque > 0) {
        tiles.push({
          color: sums.map((sum) => sum / opaque) as [number, number, number],
          uv: [x, y, x + tileWidth, y + tileHeight],
        });
      }
    }
  }
  if (sampleCache.size >= 4)
    sampleCache.delete(sampleCache.keys().next().value!);
  sampleCache.set(atlas.source, tiles);
  return tiles;
}

/**
 * Maps every palette slot onto a tile of the uploaded atlas, either by closest
 * colour (auto UV) or by walking the atlas in order.
 */
export function matchPaletteToTiles(
  palette: string[],
  tiles: AtlasTile[],
  autoUV: boolean,
): AtlasTile[] {
  return palette.map((color, index) => {
    if (!autoUV)
      return tiles[Math.floor((index * tiles.length) / palette.length)];
    const target = toRgb(color);
    const distance = (tile: AtlasTile) =>
      tile.color.reduce(
        (sum, value, channel) => sum + (value - target[channel]) ** 2,
        0,
      );
    return tiles.reduce((best, tile) =>
      distance(tile) < distance(best) ? tile : best,
    );
  });
}
