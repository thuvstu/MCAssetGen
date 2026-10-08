import type { PartId } from "./armorTypes";

/**
 * Minecraft 防具テクスチャ (64x32) のUVレイアウト。
 * humanoid (layer_1)        : ヘルメット / チェストプレート / ブーツ
 * humanoid_leggings (layer_2): レギンス
 */

export const ATLAS_W = 64;
export const ATLAS_H = 32;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type FaceName = "top" | "bottom" | "right" | "front" | "left" | "back";

export type Faces = Record<FaceName, Rect>;

export const FACE_LABEL: Record<FaceName, string> = {
  top: "上",
  bottom: "下",
  right: "右",
  front: "正面",
  left: "左",
  back: "背面",
};

/** 面ごとの陰影係数（光源を上方向に仮定） */
export const FACE_SHADE: Record<FaceName, number> = {
  top: 1.12,
  front: 1.0,
  right: 0.86,
  left: 0.86,
  back: 0.78,
  bottom: 0.62,
};

/** ボックスモデルのUV展開（Minecraft標準の計算式） */
export function boxUV(u: number, v: number, w: number, h: number, d: number): Faces {
  return {
    top: { x: u + d, y: v, w, h: d },
    bottom: { x: u + d + w, y: v, w, h: d },
    right: { x: u, y: v + d, w: d, h },
    front: { x: u + d, y: v + d, w, h },
    left: { x: u + d + w, y: v + d, w: d, h },
    back: { x: u + 2 * d + w, y: v + d, w, h },
  };
}

export const HEAD_UV = boxUV(0, 0, 8, 8, 8);
export const BODY_UV = boxUV(16, 16, 8, 12, 4);
export const ARM_UV = boxUV(40, 16, 4, 12, 4); // 左右で共有
export const LEG_UV = boxUV(0, 16, 4, 12, 4); // 左右で共有

export interface FaceDef {
  part: PartId;
  name: FaceName;
  rect: Rect;
  layer: 1 | 2;
  label: string;
}

function collectFaces(part: PartId, layer: 1 | 2, faces: Faces, label: string): FaceDef[] {
  return (Object.keys(faces) as FaceName[]).map((name) => ({
    part,
    name,
    rect: faces[name],
    layer,
    label: `${label}・${FACE_LABEL[name]}`,
  }));
}

/** layer_1 (humanoid) の全面 */
export const LAYER1_FACES: FaceDef[] = [
  ...collectFaces("helmet", 1, HEAD_UV, "頭"),
  ...collectFaces("chest", 1, BODY_UV, "胴"),
  ...collectFaces("chest", 1, ARM_UV, "腕"),
  ...collectFaces("boots", 1, LEG_UV, "脚"),
];

/** layer_2 (humanoid_leggings) の全面 */
export const LAYER2_FACES: FaceDef[] = [
  ...collectFaces("leggings", 2, LEG_UV, "脚"),
  ...collectFaces("leggings", 2, BODY_UV, "腰"),
];

/** 面インデックスの参照テーブルを作る（同じ矩形を重複登録しないよう注意） */
export function buildFaceMap(faces: FaceDef[]): Int16Array {
  const map = new Int16Array(ATLAS_W * ATLAS_H).fill(-1);
  faces.forEach((f, idx) => {
    for (let y = f.rect.y; y < f.rect.y + f.rect.h; y++) {
      for (let x = f.rect.x; x < f.rect.x + f.rect.w; x++) {
        if (x < 0 || y < 0 || x >= ATLAS_W || y >= ATLAS_H) continue;
        if (map[y * ATLAS_W + x] === -1) map[y * ATLAS_W + x] = idx;
      }
    }
  });
  return map;
}
