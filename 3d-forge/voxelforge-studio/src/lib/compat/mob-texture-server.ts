import { FACE_LIGHT, packTexture } from "./mob-texture";
import {
  canvasToPng,
  createCanvas,
  fillRect,
  parseColor,
  strokeRect,
} from "./pixel-canvas";
import type { MobDraft } from "./mob-types";

/**
 * モブテクスチャのDOM非依存レンダラ。
 *
 * 元アプリ (`mob-texture.ts`) は `<canvas>` で描いていたため、API(サーバー)
 * 経由では `document is not defined` になっていた。ここでは同じレイアウト
 * (`packTexture` が返す面の配置・色・明度) を pngjs ベースの pixel-canvas で
 * 再現し、サーバーとブラウザの双方から使えるようにする。
 */

/** Java版相当のエンティティテクスチャ (暗い背景 + 面ごとの明度 + 輪郭線)。 */
export function renderEntityTexturePng(mob: MobDraft): { png: Uint8Array; size: number } {
  const { size, faces } = packTexture(mob);
  const canvas = createCanvas(size, size);
  fillRect(canvas, 0, 0, size, size, parseColor("#1a120c"));
  for (const face of faces) {
    const [r, g, b] = parseColor(face.color);
    const light = FACE_LIGHT[face.face];
    fillRect(canvas, face.u, face.v, face.w, face.h, [
      Math.min(255, Math.round(r * light)),
      Math.min(255, Math.round(g * light)),
      Math.min(255, Math.round(b * light)),
      255,
    ]);
    strokeRect(canvas, face.u, face.v, face.w, face.h, [0, 0, 0, 115]);
  }
  return { png: canvasToPng(canvas), size };
}

/** Blockbench 等に埋め込む `data:image/png;base64,...` 形式。 */
export function entityTextureDataUrl(mob: MobDraft): { dataUrl: string; size: number } {
  const { png, size } = renderEntityTexturePng(mob);
  return { dataUrl: `data:image/png;base64,${Buffer.from(png).toString("base64")}`, size };
}
