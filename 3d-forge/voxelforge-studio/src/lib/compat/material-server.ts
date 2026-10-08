import { strToU8, zipSync } from "fflate";
import {
  fileNameFor,
  safeName,
  type MaterialSettings,
  type Pixels,
} from "./material-render";
import { englishName, japaneseName, type PackOptions, type RenderedShape } from "./material-pack";
import type { Palette } from "./material-color";
import { canvasToPng, createCanvas, parseColor, setPixel } from "./pixel-canvas";

/**
 * Server-side texture writer for the material generator.
 *
 * The original studio drew into `<canvas>`; API routes render the same 16x16
 * pixel grid into an RGBA buffer (pngjs) so the studio can generate textures and
 * resource packs without a browser.
 */

const TITLE_CASE = (value: string): string =>
  value
    .split("_")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

/** One 16x16 pixel grid as a PNG, nearest-neighbour scaled. */
export function pixelsToPng(pixels: Pixels, scale = 1): Uint8Array {
  const size = 16 * Math.max(1, Math.round(scale));
  const canvas = createCanvas(size, size);
  const step = size / 16;
  for (let i = 0; i < 256; i++) {
    const color = pixels[i];
    if (!color) continue;
    const rgba = parseColor(color);
    const x = (i % 16) * step;
    const y = Math.floor(i / 16) * step;
    for (let py = 0; py < step; py++)
      for (let px = 0; px < step; px++)
        setPixel(canvas, x + px, y + py, rgba);
  }
  return canvasToPng(canvas);
}

/** Contact sheet of several shapes (used for previews). */
export function spritesheetPng(
  list: Pixels[],
  scale = 1,
  columns = 8,
): Uint8Array {
  const cols = Math.max(1, Math.min(columns, Math.max(list.length, 1)));
  const rows = Math.ceil(list.length / cols);
  const cell = 16 * Math.max(1, Math.round(scale));
  const canvas = createCanvas(cell * cols, cell * Math.max(rows, 1));
  list.forEach((pixels, index) => {
    const originX = (index % cols) * cell;
    const originY = Math.floor(index / cols) * cell;
    const step = cell / 16;
    for (let i = 0; i < 256; i++) {
      const color = pixels[i];
      if (!color) continue;
      const rgba = parseColor(color);
      const x = originX + (i % 16) * step;
      const y = originY + Math.floor(i / 16) * step;
      for (let py = 0; py < step; py++)
        for (let px = 0; px < step; px++) setPixel(canvas, x + px, y + py, rgba);
    }
  });
  return canvasToPng(canvas);
}

export interface MaterialBundle {
  zip: Uint8Array;
  files: string[];
}

/** Textures only: one folder with PNGs and a material.json manifest. */
export function buildMaterialFolderZip(
  rendered: RenderedShape[],
  settings: MaterialSettings,
  palette: Palette,
  options: PackOptions,
): MaterialBundle {
  const name = safeName(settings.name);
  const files: Record<string, Uint8Array> = {};
  for (const { shape, pixels } of rendered)
    files[`${name}/${fileNameFor(shape.file, settings.name)}.png`] = pixelsToPng(
      pixels,
      options.scale,
    );
  files[`${name}/material.json`] = strToU8(
    JSON.stringify(
      {
        name,
        settings,
        palette,
        textures: rendered.map((entry) => ({
          id: entry.shape.id,
          category: entry.shape.category,
          file: `${fileNameFor(entry.shape.file, settings.name)}.png`,
        })),
      },
      null,
      2,
    ),
  );
  return { zip: zipSync(files), files: Object.keys(files).sort() };
}

/** Resource pack: textures under assets/<modId>/textures + lang + pack.mcmeta. */
export function buildMaterialPackZip(
  rendered: RenderedShape[],
  settings: MaterialSettings,
  palette: Palette,
  options: PackOptions,
): MaterialBundle {
  const name = safeName(settings.name);
  const modId = safeName(options.modId || "mymod");
  const files: Record<string, Uint8Array> = {};
  const en: Record<string, string> = {};
  const ja: Record<string, string> = {};
  for (const { shape, pixels } of rendered) {
    const file = fileNameFor(shape.file, settings.name);
    const kind = shape.category === "block" ? "block" : "item";
    files[`assets/${modId}/textures/${kind}/${file}.png`] = pixelsToPng(
      pixels,
      options.scale,
    );
    en[`${kind}.${modId}.${file}`] = englishName(shape, settings.name);
    ja[`${kind}.${modId}.${file}`] = japaneseName(shape, settings.name);
  }
  files[`assets/${modId}/lang/en_us.json`] = strToU8(JSON.stringify(en, null, 2));
  files[`assets/${modId}/lang/ja_jp.json`] = strToU8(JSON.stringify(ja, null, 2));
  files["pack.mcmeta"] = strToU8(
    JSON.stringify(
      {
        pack: {
          pack_format: 34,
          description: `${TITLE_CASE(name)} textures (VoxelForge Studio)`,
        },
      },
      null,
      2,
    ),
  );
  files["material.json"] = strToU8(
    JSON.stringify(
      {
        name,
        modId,
        settings,
        palette,
        textures: rendered.map((entry) => ({
          id: entry.shape.id,
          category: entry.shape.category,
          file: `${fileNameFor(entry.shape.file, settings.name)}.png`,
        })),
      },
      null,
      2,
    ),
  );
  files["README.txt"] = strToU8(
    [
      `${TITLE_CASE(name)} — generated by VoxelForge Studio`,
      "",
      `assets/${modId}/textures/item/   … アイテム用テクスチャ`,
      `assets/${modId}/textures/block/  … ブロック用テクスチャ`,
      `assets/${modId}/lang/            … 表示名 (en_us / ja_jp)`,
      "pack.mcmeta                      … pack_format 34 (1.21 系)",
      "",
      "Mod で使う場合は assets/ 以下を src/main/resources/ にコピーしてください。",
      "",
    ].join("\n"),
  );
  return { zip: zipSync(files), files: Object.keys(files).sort() };
}
