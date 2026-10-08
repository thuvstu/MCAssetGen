import JSZip from "jszip";
import type { ArmorParams, PartId } from "./armorTypes";
import { renderIcons, type RGBA } from "./generator";
import { geoModelJson, islandRect, validateGeoLayout, type GeoLayout } from "./geoModel";
import { canvasToBlob, rgbaToCanvas } from "./imageUtils";
import { ATLAS_H, ATLAS_W, FACE_LABEL, LAYER1_FACES, LAYER2_FACES, type FaceDef } from "./uvLayout";
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
} from "./templates";

export const PART_COLOR: Record<PartId, string> = {
  helmet: "#38bdf8",
  chest: "#f472b6",
  leggings: "#a3e635",
  boots: "#fbbf24",
};

/** バニラ64x32のUVガイド（atlas を null にすると白紙テンプレート） */
export function renderUvGuide(layer: 1 | 2, atlas: RGBA | null, scale = 16): HTMLCanvasElement {
  const faces: FaceDef[] = layer === 1 ? LAYER1_FACES : LAYER2_FACES;
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_W * scale;
  canvas.height = ATLAS_H * scale;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = atlas ? "#0f172a" : "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (atlas) {
    const src = rgbaToCanvas(atlas, 1);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontPx = Math.round(scale * 0.62);
  for (const face of faces) {
    const { x, y, w, h } = face.rect;
    const px = x * scale;
    const py = y * scale;
    const pw = w * scale;
    const ph = h * scale;
    ctx.strokeStyle = PART_COLOR[face.part];
    ctx.lineWidth = Math.max(1, scale / 8);
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);

    if (face.name === "front" || (pw >= scale * 4 && ph >= scale * 4)) {
      ctx.fillStyle = atlas ? "rgba(255,255,255,0.9)" : "#334155";
      ctx.font = `bold ${fontPx}px sans-serif`;
      ctx.fillText(FACE_LABEL[face.name], px + pw / 2, py + ph / 2);
    }
  }

  ctx.textAlign = "left";
  ctx.font = `bold ${fontPx}px sans-serif`;
  const legend: [PartId, string][] = [
    ["helmet", "ヘルメット(頭)"],
    ["chest", "チェスト(胴・腕)"],
    ["leggings", "レギンス(脚・腰)"],
    ["boots", "ブーツ(脚)"],
  ];
  const showLegend = layer === 1 ? legend : legend.filter(([p]) => p === "leggings");
  showLegend.forEach(([part, text], i) => {
    const ly = canvas.height - (showLegend.length - i) * fontPx * 1.5 - 4;
    ctx.fillStyle = PART_COLOR[part];
    ctx.fillRect(6, ly, fontPx, fontPx);
    ctx.fillStyle = atlas ? "#ffffff" : "#0f172a";
    ctx.fillText(text, 6 + fontPx * 1.4, ly + fontPx / 2);
  });

  return canvas;
}

/**
 * GeckoLib用UVアトラスのガイド。各キューブの島を枠で囲み、
 * 大きい島にはキューブ名を書く。texture が null なら白紙テンプレート。
 */
export function renderGeoGuide(layout: GeoLayout, texture: HTMLCanvasElement | null): HTMLCanvasElement {
  const scale = Math.max(2, Math.floor(1024 / layout.size));
  const px = layout.size * scale;
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = texture ? "#0f172a" : "#ffffff";
  ctx.fillRect(0, 0, px, px);
  if (texture) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(texture, 0, 0, px, px);
  }

  const fontPx = Math.max(8, Math.round(scale * 1.25));
  ctx.font = `bold ${fontPx}px sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (const bone of layout.bones) {
    for (const cube of bone.cubes) {
      const r = islandRect(cube);
      const x = r.x * scale;
      const y = r.y * scale;
      const w = r.w * scale;
      const h = r.h * scale;
      ctx.strokeStyle = PART_COLOR[bone.part];
      ctx.lineWidth = Math.max(1, scale / 4);
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

      if (w > fontPx * 6 && h > fontPx * 2) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.fillStyle = texture ? "rgba(255,255,255,0.92)" : "#0f172a";
        ctx.fillText(cube.name, x + 2, y + 2);
        ctx.restore();
      }
    }
  }
  return canvas;
}

export interface PackageResult {
  blob: Blob;
  files: string[];
}

/** ZIPに含まれるファイル一覧（プレビュー用） */
export function listFiles(params: ArmorParams): string[] {
  const ns = params.namespace;
  const id = params.armorId;
  const base = `assets/${ns}`;
  const files = [
    `${base}/equipment/${id}.json`,
    `${base}/textures/entity/equipment/humanoid/${id}.png`,
    `${base}/textures/entity/equipment/humanoid_leggings/${id}.png`,
  ];
  for (const part of PARTS) {
    files.push(`${base}/textures/item/${itemId(params, part)}.png`);
    files.push(`${base}/models/item/${itemId(params, part)}.json`);
    files.push(`${base}/items/${itemId(params, part)}.json`);
  }
  files.push(`${base}/lang/en_us.json`, `${base}/lang/ja_jp.json`);
  files.push(`data/${ns}/tags/item/repairs_${id}.json`);
  if (params.includeGeckolib) {
    files.push(
      `${base}/geo/item/armor/${id}.geo.json`,
      `${base}/textures/item/armor/${id}.png`,
      `${base}/animations/item/armor/${id}.animation.json`
    );
  }
  files.push(
    `reference/uv_guide_humanoid.png`,
    `reference/uv_guide_leggings.png`,
    `reference/uv_blank_humanoid.png`,
    `reference/uv_blank_leggings.png`
  );
  if (params.includeGeckolib) {
    files.push(`reference/geo_uv_guide.png`, `reference/geo_uv_blank.png`);
  }
  files.push(`README.md`);
  if (params.includeJava) {
    files.push(`java/com/example/${ns}/${toPascal(id)}Armor.java`);
    if (params.includeGeckolib) {
      files.push(`java/com/example/${ns}/${toPascal(id)}GeoItem.java`);
      files.push(`java/com/example/${ns}/${toPascal(id)}ArmorRenderer.java`);
    }
  }
  return files;
}

/** Fabric MOD向けのアセット一式をZIPにまとめる */
export async function buildPackage(
  params: ArmorParams,
  atlas1: RGBA,
  atlas2: RGBA,
  geoTexture: RGBA,
  layout: GeoLayout
): Promise<PackageResult> {
  const zip = new JSZip();
  const ns = params.namespace;
  const id = params.armorId;
  const base = `assets/${ns}`;

  zip.file(`${base}/equipment/${id}.json`, equipmentJson(params));
  zip.file(`${base}/textures/entity/equipment/humanoid/${id}.png`, await canvasToBlob(rgbaToCanvas(atlas1)));
  zip.file(`${base}/textures/entity/equipment/humanoid_leggings/${id}.png`, await canvasToBlob(rgbaToCanvas(atlas2)));

  const icons = renderIcons(atlas1, atlas2, params.iconSize, params);
  for (const part of PARTS) {
    const name = itemId(params, part);
    zip.file(`${base}/textures/item/${name}.png`, await canvasToBlob(rgbaToCanvas(icons[part])));
    zip.file(`${base}/models/item/${name}.json`, itemModelJson(params, part));
    zip.file(`${base}/items/${name}.json`, itemDefinitionJson(params, part));
  }

  zip.file(`${base}/lang/en_us.json`, langJson(params, "en_us"));
  zip.file(`${base}/lang/ja_jp.json`, langJson(params, "ja_jp"));
  zip.file(`data/${ns}/tags/item/repairs_${id}.json`, repairTagJson());

  if (params.includeGeckolib) {
    validateGeoLayout(layout);
    const geoCanvas = rgbaToCanvas(geoTexture);
    zip.file(`${base}/geo/item/armor/${id}.geo.json`, geoModelJson(params, layout));
    zip.file(`${base}/textures/item/armor/${id}.png`, await canvasToBlob(geoCanvas));
    zip.file(
      `${base}/animations/item/armor/${id}.animation.json`,
      JSON.stringify({ format_version: "1.8.0", animations: {} }, null, 2)
    );
    zip.file(`reference/geo_uv_guide.png`, await canvasToBlob(renderGeoGuide(layout, geoCanvas)));
    zip.file(`reference/geo_uv_blank.png`, await canvasToBlob(renderGeoGuide(layout, null)));
  }

  zip.file(`reference/uv_guide_humanoid.png`, await canvasToBlob(renderUvGuide(1, atlas1)));
  zip.file(`reference/uv_guide_leggings.png`, await canvasToBlob(renderUvGuide(2, atlas2)));
  zip.file(`reference/uv_blank_humanoid.png`, await canvasToBlob(renderUvGuide(1, null)));
  zip.file(`reference/uv_blank_leggings.png`, await canvasToBlob(renderUvGuide(2, null)));

  zip.file(`README.md`, readme(params, layout.size));

  if (params.includeJava) {
    zip.file(`java/com/example/${ns}/${toPascal(id)}Armor.java`, armorJava(params));
    if (params.includeGeckolib) {
      zip.file(`java/com/example/${ns}/${toPascal(id)}GeoItem.java`, geckoItemJava(params));
      zip.file(`java/com/example/${ns}/${toPascal(id)}ArmorRenderer.java`, geckoRendererJava(params));
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, files: listFiles(params) };
}
