import { strToU8, zipSync } from "fflate";
import { PNG } from "pngjs";
import type { ArmorParams, PartId } from "./armor-types";
import { renderAtlas, renderIcons, type RGBA } from "./armor-generator";
import {
  buildGeoLayout,
  geoModelJson,
  islandRect,
  renderGeoTexture,
  validateGeoLayout,
  type GeoLayout,
} from "./armor-geo";
import {
  ATLAS_H,
  ATLAS_W,
  FACE_LABEL,
  LAYER1_FACES,
  LAYER2_FACES,
  type FaceName,
  type FaceDef,
} from "./armor-uv";
import {
  PARTS,
  armorJava,
  equipmentJson,
  geckoItemJava,
  geckoRendererJava,
  itemDefinitionJson,
  itemId,
  itemModelJson,
  langJson,
  readme,
  repairTagJson,
  toPascal,
} from "./armor-templates";

/**
 * Server-side port of the armor generator's browser exporter.
 *
 * The studio runs on the server, so canvases are replaced by pngjs: guide images
 * keep the coloured outlines (and the face letters are dropped, since there is no
 * text renderer here).
 */

export const PART_COLOR: Record<PartId, string> = {
  helmet: "#38bdf8",
  chest: "#f472b6",
  leggings: "#a3e635",
  boots: "#fbbf24",
};

const hexToRgba = (hex: string): [number, number, number, number] => {
  const value = hex.replace("#", "");
  const n = parseInt(value.length === 3 ? value.repeat(2) : value, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
};

/** Encodes an RGBA pixel buffer as PNG bytes. */
export function rgbaToPng(rgba: RGBA): Buffer {
  const png = new PNG({ width: rgba.width, height: rgba.height });
  png.data = Buffer.from(
    rgba.data.buffer,
    rgba.data.byteOffset,
    rgba.data.byteLength,
  );
  return PNG.sync.write(png);
}

/** Nearest-neighbour scale of an RGBA buffer, used for reference images. */
export function scaleRgba(rgba: RGBA, scale: number): RGBA {
  if (scale === 1) return rgba;
  const width = rgba.width * scale;
  const height = rgba.height * scale;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = Math.floor(x / scale);
      const sy = Math.floor(y / scale);
      const source = (sy * rgba.width + sx) * 4;
      const target = (y * width + x) * 4;
      data[target] = rgba.data[source];
      data[target + 1] = rgba.data[source + 1];
      data[target + 2] = rgba.data[source + 2];
      data[target + 3] = rgba.data[source + 3];
    }
  }
  return { width, height, data };
}

function blank(width: number, height: number, color: [number, number, number, number]): RGBA {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }
  return { width, height, data };
}

function drawRect(
  target: RGBA,
  x: number,
  y: number,
  width: number,
  height: number,
  color: [number, number, number, number],
): void {
  for (let py = Math.max(0, y); py < Math.min(target.height, y + height); py++) {
    for (let px = Math.max(0, x); px < Math.min(target.width, x + width); px++) {
      const offset = (py * target.width + px) * 4;
      target.data[offset] = color[0];
      target.data[offset + 1] = color[1];
      target.data[offset + 2] = color[2];
      target.data[offset + 3] = color[3];
    }
  }
}

/** バニラ64x32のUVガイド（outline only）。 */
export function renderUvGuide(layer: 1 | 2, atlas: RGBA | null, scale = 16): RGBA {
  const faces: FaceDef[] = layer === 1 ? LAYER1_FACES : LAYER2_FACES;
  const base = atlas
    ? scaleRgba(atlas, scale)
    : blank(ATLAS_W * scale, ATLAS_H * scale, [255, 255, 255, 255]);
  if (atlas) {
    const dim = blank(base.width, base.height, [15, 23, 42, 255]);
    for (let i = 0; i < base.data.length; i++) dim.data[i] = base.data[i];
  }
  for (const face of faces) {
    const { x, y, w, h } = face.rect;
    const color = hexToRgba(PART_COLOR[face.part]);
    drawRect(base, x * scale, y * scale, w * scale, 1, color);
    drawRect(base, x * scale, (y + h) * scale - 1, w * scale, 1, color);
    drawRect(base, x * scale, y * scale, 1, h * scale, color);
    drawRect(base, (x + w) * scale - 1, y * scale, 1, h * scale, color);
  }
  return base;
}

/** GeckoLib用UVアトラスのガイド。各キューブの島を枠で囲む。 */
export function renderGeoGuide(layout: GeoLayout, texture: RGBA | null): RGBA {
  const scale = Math.max(2, Math.floor(1024 / layout.size));
  const base = texture
    ? scaleRgba(texture, scale)
    : blank(layout.size * scale, layout.size * scale, [255, 255, 255, 255]);
  for (const bone of layout.bones) {
    for (const cube of bone.cubes) {
      const rect = islandRect(cube);
      const color = hexToRgba(PART_COLOR[bone.part]);
      const x = rect.x * scale;
      const y = rect.y * scale;
      const w = rect.w * scale;
      const h = rect.h * scale;
      for (let px = 0; px < w; px++) {
        drawRect(base, x + px, y, 1, 1, color);
        drawRect(base, x + px, y + h - 1, 1, 1, color);
      }
      for (let py = 0; py < h; py++) {
        drawRect(base, x, y + py, 1, 1, color);
        drawRect(base, x + w - 1, y + py, 1, 1, color);
      }
    }
  }
  return base;
}

export interface ArmorBundle {
  zip: Uint8Array;
  files: string[];
  geoSize: number;
}

/** Mod向けアセット一式（バニラ + 任意でGeckoLib）をZIPにまとめる。 */
export function buildArmorBundle(params: ArmorParams): ArmorBundle {
  const namespace = params.namespace;
  const id = params.armorId;
  const base = `assets/${namespace}`;
  const atlas1 = renderAtlas(1, params);
  const atlas2 = renderAtlas(2, params);
  const icons = renderIcons(atlas1, atlas2, params.iconSize, params);
  const layout = buildGeoLayout(params);
  const geoTexture = renderGeoTexture(params, layout);
  validateGeoLayout(layout);

  const json = (value: unknown) => strToU8(JSON.stringify(value, null, 2));
  const files: Record<string, Uint8Array> = {};
  const add = (path: string, data: Uint8Array) => {
    files[path] = data;
  };

  add(`${base}/equipment/${id}.json`, json(JSON.parse(equipmentJson(params))));
  add(`${base}/textures/entity/equipment/humanoid/${id}.png`, rgbaToPng(atlas1));
  add(`${base}/textures/entity/equipment/humanoid_leggings/${id}.png`, rgbaToPng(atlas2));

  for (const part of PARTS) {
    const name = itemId(params, part);
    add(`${base}/textures/item/${name}.png`, rgbaToPng(icons[part]));
    add(`${base}/models/item/${name}.json`, json(JSON.parse(itemModelJson(params, part))));
    add(`${base}/items/${name}.json`, json(JSON.parse(itemDefinitionJson(params, part))));
  }

  add(`${base}/lang/en_us.json`, json(JSON.parse(langJson(params, "en_us"))));
  add(`${base}/lang/ja_jp.json`, json(JSON.parse(langJson(params, "ja_jp"))));
  add(`data/${namespace}/tags/item/repairs_${id}.json`, json(JSON.parse(repairTagJson())));

  if (params.includeGeckolib) {
    add(`${base}/geo/item/armor/${id}.geo.json`, strToU8(geoModelJson(params, layout)));
    add(`${base}/textures/item/armor/${id}.png`, rgbaToPng(geoTexture));
    add(
      `${base}/animations/item/armor/${id}.animation.json`,
      strToU8(JSON.stringify({ format_version: "1.8.0", animations: {} }, null, 2)),
    );
    add("reference/geo_uv_guide.png", rgbaToPng(renderGeoGuide(layout, geoTexture)));
    add("reference/geo_uv_blank.png", rgbaToPng(renderGeoGuide(layout, null)));
  }

  add("reference/uv_guide_humanoid.png", rgbaToPng(renderUvGuide(1, atlas1)));
  add("reference/uv_guide_leggings.png", rgbaToPng(renderUvGuide(2, atlas2)));
  add("reference/uv_blank_humanoid.png", rgbaToPng(renderUvGuide(1, null)));
  add("reference/uv_blank_leggings.png", rgbaToPng(renderUvGuide(2, null)));
  add("README.md", strToU8(readme(params, layout.size)));

  if (params.includeJava) {
    const pascal = toPascal(id);
    add(`java/com/example/${namespace}/${pascal}Armor.java`, strToU8(armorJava(params)));
    if (params.includeGeckolib) {
      add(`java/com/example/${namespace}/${pascal}GeoItem.java`, strToU8(geckoItemJava(params)));
      add(
        `java/com/example/${namespace}/${pascal}ArmorRenderer.java`,
        strToU8(geckoRendererJava(params)),
      );
    }
  }

  return {
    zip: zipSync(files),
    files: Object.keys(files).sort(),
    geoSize: layout.size,
  };
}

/** Preview data for the studio UI: 64x32 atlases, icons and the Geo atlas. */
export function armorPreview(params: ArmorParams): {
  atlas1: RGBA;
  atlas2: RGBA;
  icons: Record<PartId, RGBA>;
  geo: RGBA;
  geoSize: number;
} {
  const atlas1 = renderAtlas(1, params);
  const atlas2 = renderAtlas(2, params);
  const layout = buildGeoLayout(params);
  return {
    atlas1,
    atlas2,
    icons: renderIcons(atlas1, atlas2, params.iconSize, params),
    geo: renderGeoTexture(params, layout),
    geoSize: layout.size,
  };
}

export { FACE_LABEL, ATLAS_W, ATLAS_H };
