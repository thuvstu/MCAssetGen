import type { ArmorParams, PartId, StyleId } from "./armorTypes";
import { hash, hexToRgb, type RGBA } from "./generator";
import { FACE_SHADE, boxUV, type FaceName, type Rect } from "./uvLayout";

/* ============================================================
 * GeckoLib 5 向けの装備ジオメトリと、キューブごとのUVアトラス。
 * 1テクセル = 1モデル単位(1/16ブロック)。島は自動でパッキングされ、
 * 解像度は必要に応じて 256 / 512 / 1024 に広がる。
 * ============================================================ */

export type MaterialKey =
  | "shell"
  | "shade"
  | "highlight"
  | "filigree"
  | "steel"
  | "void"
  | "horn"
  | "ember"
  | "leather"
  | "edge"
  | "gem"
  | "sole";

export type Decor = "none" | "rivets" | "scales" | "gems";
export type RGB = [number, number, number];
type Vec3 = [number, number, number];

export interface GeoCube {
  name: string;
  origin: Vec3;
  size: Vec3;
  material: MaterialKey;
  decor: Decor;
  /** box-UV の原点（パッキング後に決まる） */
  uv: [number, number];
}

export interface GeoBone {
  name: string;
  pivot: Vec3;
  part: PartId;
  cubes: GeoCube[];
}

export interface GeoLayout {
  bones: GeoBone[];
  /** 正方形UVアトラスの一辺（px） */
  size: number;
}

export interface UvRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const GEO_BONE_NAMES = [
  "armorHead",
  "armorBody",
  "armorRightArm",
  "armorLeftArm",
  "armorRightLeg",
  "armorLeftLeg",
  "armorRightBoot",
  "armorLeftBoot",
];

const sideName = (side: number) => (side < 0 ? "-X側" : "+X側");

function add(
  bone: GeoBone,
  name: string,
  origin: Vec3,
  size: Vec3,
  material: MaterialKey,
  decor: Decor = "none"
) {
  bone.cubes.push({ name, origin, size, material, decor, uv: [0, 0] });
}

/* ---------------- 造形 ---------------- */

export function createArmorModel(params: ArmorParams): GeoBone[] {
  const bones: GeoBone[] = [
    { name: "armorHead", pivot: [0, 24, 0], part: "helmet", cubes: [] },
    { name: "armorBody", pivot: [0, 24, 0], part: "chest", cubes: [] },
    { name: "armorRightArm", pivot: [-5, 22, 0], part: "chest", cubes: [] },
    { name: "armorLeftArm", pivot: [5, 22, 0], part: "chest", cubes: [] },
    { name: "armorRightLeg", pivot: [-2, 12, 0], part: "leggings", cubes: [] },
    { name: "armorLeftLeg", pivot: [2, 12, 0], part: "leggings", cubes: [] },
    { name: "armorRightBoot", pivot: [-2, 12, 0], part: "boots", cubes: [] },
    { name: "armorLeftBoot", pivot: [2, 12, 0], part: "boots", cubes: [] },
  ];
  const [head, body, rightArm, leftArm, rightLeg, leftLeg, rightBoot, leftBoot] = bones;
  const embers = params.visorMode === "embers";
  const hornLength = params.hornLength;

  /* ---- ヘルメット: 面頬・バイザー・額飾りを独立したプレートで構成 ---- */
  add(head, "後頭部の影", [-4.15, 28.5, -4.15], [8.3, 3.65, 8.3], "shade");
  add(head, "頬下の影 -X", [-4.15, 24, -4.15], [1.1, 5.2, 8.3], "shade");
  add(head, "頬下の影 +X", [3.05, 24, -4.15], [1.1, 5.2, 8.3], "shade");
  add(head, "後ろの影", [-3.05, 24, 3.45], [6.1, 5.2, 0.7], "shade");
  add(head, "兜の頭頂", [-5, 29, -5], [10, 3, 10], "shell");
  add(head, "頭頂の光", [-4.5, 31.7, -4.5], [9, 0.7, 9], "highlight");
  add(head, "眉の稜線", [-4.9, 28.3, -5.35], [9.8, 0.8, 1.4], "highlight");
  add(head, "額飾りの帯", [-4.8, 27.6, -5.75], [9.6, 0.7, 1], "filigree");
  if (embers) add(head, "バイザーの闇", [-4.15, 25.7, -5.4], [8.3, 1.95, 0.65], "void");

  for (const side of [-1, 1] as const) {
    const x = (c: number, w: number) => side * c - w / 2;
    const s = sideName(side);
    add(head, `頬当て ${s}`, [x(4.2, 1.65), 24.9, -5.55], [1.65, 2.9, 3], "shell", "rivets");
    add(head, `頬当ての縁 ${s}`, [x(4.2, 1.8), 25.1, -5.9], [1.8, 0.55, 2.5], "filigree");
    add(head, `側面プレート ${s}`, [x(4.25, 1.3), 28.9, -3.7], [1.3, 2.5, 7.5], "steel", "rivets");
    if (embers) add(head, `バイザーの灯 ${s}`, [x(2.45, 2.1), 26.55, -6.02], [2.1, 0.48, 0.55], "ember");
    add(head, `耳当て ${s}`, [x(3.7, 0.6), 29.25, -5.72], [0.6, 0.7, 0.8], "filigree");
    add(head, `留め具 ${s}`, [x(2.4, 1), 24.3, -5.95], [1, 0.9, 1.2], "horn");
    add(head, `リベット ${s}`, [x(4, 0.65), 25.5, -5.98], [0.65, 0.65, 0.65], "filigree");
  }
  add(head, "鼻当て", [-0.85, 26.1, -6.4], [1.7, 2.3, 1.5], "steel");
  add(head, "顎当ての縁", [-3.1, 24.1, -5.8], [6.2, 0.95, 1.35], "shell", "rivets");
  for (const dx of [-1.2, 0, 1.2]) {
    add(head, "呼吸口", [dx - 0.25, 24.35, -6.2], [0.5, 0.45, 0.35], "void");
  }
  add(head, "鼻当ての飾り", [-1, 24.15, -6.08], [2, 0.62, 0.75], "filigree");
  add(head, "中央の飾り", [-1.25, 29, -5.9], [2.5, 2.4, 0.9], "filigree");
  add(head, "額の宝石", [-0.75, 29.7, -6.32], [1.5, 1.45, 0.4], "gem", "gems");
  add(head, "うなじの防具", [-4.6, 25.5, 4.05], [9.2, 3.4, 0.9], "shell", "scales");

  /* ---- ヘルメットの形状バリエーション ---- */
  if (params.helmetProfile === "drake") {
    if (hornLength > 0) {
      for (const side of [-1, 1] as const) {
        const x = (c: number, w: number) => side * c - w / 2;
        const s = sideName(side);
        add(head, `角の根元 ${s}`, [x(4.6, 2.5), 30.4, 0.8], [2.5, 2.5, 3.4], "filigree");
        add(head, `角 ${s}`, [x(5.1, 2.2), 31.9, 1.7], [2.2, 2.5, 2.9], "horn", "scales");
        if (hornLength >= 2) add(head, `角の中ほど ${s}`, [x(6.15, 1.65), 33.65, 2.65], [1.65, 2.35, 2.2], "horn");
        if (hornLength >= 3) add(head, `角の先端 ${s}`, [x(6.85, 1.05), 35.5, 3.4], [1.05, 1.65, 1.35], "highlight");
        add(head, `頬の角 ${s}`, [x(4.3, 1.4), 29.2, 4.1], [1.4, 1.5, 1.8], "horn");
      }
    }
    add(head, "鼻先の稜線", [-0.75, 32.2, -4], [1.5, 1.35, 8], "filigree");
    add(head, "背びれ", [-0.45, 33.2, -2], [0.9, 0.9, 5], "horn", "scales");
  } else if (params.helmetProfile === "sentinel") {
    add(head, "稜線の板", [-1.25, 32.1, -4.5], [2.5, 1.7, 8.7], "filigree", "rivets");
    add(head, "稜線の頂", [-0.8, 33.6, -3.5], [1.6, 1.6 + hornLength * 0.35, 6], "highlight");
    for (const side of [-1, 1] as const) {
      const s = sideName(side);
      add(head, `側面の稜線 ${s}`, [side * 3.9 - 0.75, 30.9, -4.4], [1.5, 1.3, 7.9], "filigree");
      if (hornLength > 1) add(head, `側面の突起 ${s}`, [side * 4.3 - 0.55, 32, 1.5], [1.1, 1.7, 2.1], "horn");
    }
  } else {
    if (hornLength > 0) {
      for (const offset of [-3.7, -1.8, 0, 1.8, 3.7]) {
        const height =
          offset === 0
            ? 2.3 + hornLength * 0.5
            : Math.abs(offset) < 3
              ? 1.8 + hornLength * 0.35
              : 1.2 + hornLength * 0.25;
        add(head, `王冠の尖塔 ${offset}`, [offset - 0.7, 32, -4.2], [1.4, height, 2.2], "filigree");
        add(head, `王冠の宝石 ${offset}`, [offset - 0.42, 32 + height, -3.9], [0.84, 0.65, 1.4], "gem");
      }
    }
    add(head, "王冠の帯", [-4.7, 29.9, -5.15], [9.4, 0.8, 1.6], "filigree", "gems");
  }

  /* ---- チェストプレート: 胸甲・ベルト・腰甲 ---- */
  add(body, "胸当ての裏地", [-4, 12, -2], [8, 12, 4], "leather");
  add(body, "胸甲", [-4.65, 15.5, -3.05], [9.3, 7.8, 2.1], "shell", "rivets");
  add(body, "胸甲の下の影", [-4.3, 15, 2.05], [8.6, 7.5, 0.85], "shade");
  add(body, "ベルト", [-4.8, 22, -3.4], [9.6, 1.1, 5.9], "steel");
  add(body, "襟の縁", [-4.7, 20.6, -3.45], [9.4, 0.75, 1], "filigree");
  add(body, "胸の縁", [-4.6, 15.2, -3.5], [9.2, 0.8, 1.1], "filigree");
  add(body, "腰甲", [-4.45, 11.9, -2.8], [8.9, 2.4, 5.6], "shade");
  add(body, "腰の縁", [-4.5, 12.4, -3.15], [9, 0.85, 0.95], "filigree");
  add(body, "留め金", [-1.35, 17.7, -3.65], [2.7, 3.4, 0.9], "filigree");
  add(body, "胸の宝石", [-0.85, 18.3, -4.05], [1.7, 2.2, 0.6], "gem", "gems");
  for (const side of [-1, 1] as const) {
    const s = sideName(side);
    add(body, `ベルト金具 ${s}`, [side * 2.8 - 1.25, 17.2, -3.6], [2.5, 0.68, 1], "steel");
    add(body, `ベルト飾り ${s}`, [side * 3.45 - 0.6, 14.4, -3.35], [1.2, 1.05, 0.85], "highlight");
  }

  /* ---- 腕: 肩甲・袖 ---- */
  for (const [side, arm] of [[-1, rightArm], [1, leftArm]] as const) {
    const cx = 6 * side;
    const s = sideName(side);
    add(arm, `袖布 ${s}`, [cx - 2, 12, -2], [4, 11.6, 4], "leather");
    add(arm, `肩甲 ${s}`, [cx - 2.65, 19.2, -3], [5.3, 4.4, 6], "shell", "scales");
    add(arm, `肩甲の縁 ${s}`, [cx - 2.7, 20.1, -3.3], [5.4, 0.8, 6.5], "filigree");
    add(arm, `肩甲の帯 ${s}`, [cx - 2.45, 17.8, -2.7], [4.9, 1, 5.4], "steel");
    add(arm, `肘の影 ${s}`, [cx - 2.3, 12.6, -2.65], [4.6, 4.1, 5.3], "shade");
    add(arm, `肘の縁 ${s}`, [cx - 2.35, 12.6, -2.9], [4.7, 0.8, 5.6], "filigree");
    if (hornLength > 0) {
      add(arm, `肩の角 ${s}`, [cx + side * 2.4 - 0.7, 21.7, -0.3], [1.4, 2 + hornLength * 0.45, 1.8], "horn");
    }
    add(arm, `肩の宝石 ${s}`, [cx - 1.25, 20.7, -3.55], [2.5, 1.5, 0.65], "gem", "gems");
  }

  /* ---- 脚・ブーツ ---- */
  for (const [side, leg, boot] of [[-1, rightLeg, rightBoot], [1, leftLeg, leftBoot]] as const) {
    const cx = 2 * side;
    const s = sideName(side);
    add(leg, `脚の布 ${s}`, [cx - 2.05, 4.8, -2.05], [4.1, 7.4, 4.1], "leather");
    add(leg, `脛当て ${s}`, [cx - 2.35, 8, -2.75], [4.7, 3.9, 5.4], "shell", "rivets");
    add(leg, `脛当ての縁 ${s}`, [cx - 2.4, 10.8, -2.8], [4.8, 0.8, 5.6], "filigree");
    add(leg, `膝の影 ${s}`, [cx - 2.3, 4.85, -2.8], [4.6, 3.5, 5.4], "shade");
    add(leg, `膝の宝石 ${s}`, [cx - 1.25, 5.8, -3.05], [2.5, 1.9, 0.8], "gem", "gems");
    add(leg, `膝の金具 ${s}`, [cx - 1.5, 11.6, -2.85], [3, 1.25, 1], "steel");

    add(boot, `ブーツ上部 ${s}`, [cx - 2.35, 0, -2.55], [4.7, 5.2, 5.1], "shade");
    add(boot, `つま先 ${s}`, [cx - 2.5, 0.1, -4.2], [5, 2.4, 6.3], "shell", "scales");
    add(boot, `靴底 ${s}`, [cx - 2.55, 0.1, -4.4], [5.1, 0.65, 6.6], "sole");
    add(boot, `靴の帯 ${s}`, [cx - 2.45, 4.3, -2.85], [4.9, 0.75, 5.7], "filigree");
    add(boot, `留め金 ${s}`, [cx - 1.05, 0.9, -4.55], [2.1, 1.1, 0.6], "steel");
  }

  return bones;
}

/* ---------------- UVアイランド ---------------- */

/** キューブの box-UV 占有範囲（ボックスUVは幅 2(w+d)、高さ d+h） */
export function islandRect(cube: GeoCube): UvRect {
  const [w, h, d] = cube.size;
  return { x: cube.uv[0], y: cube.uv[1], w: 2 * (w + d), h: d + h };
}

/** キューブの各面の矩形 */
export function faceRects(cube: GeoCube): Record<FaceName, Rect> {
  const [w, h, d] = cube.size;
  return boxUV(cube.uv[0], cube.uv[1], w, h, d);
}

function islandSize(cube: GeoCube) {
  const r = islandRect(cube);
  // 1px の余白を入れて隣の島との境界での滲みを防ぐ
  return { width: Math.ceil(r.w) + 1, height: Math.ceil(r.h) + 1 };
}

function tryPack(
  items: { cube: GeoCube; width: number; height: number }[],
  size: number
): boolean {
  let x = 0;
  let y = 0;
  let shelf = 0;
  const placed: [GeoCube, number, number][] = [];
  for (const item of items) {
    if (item.width > size) return false;
    if (x + item.width > size) {
      x = 0;
      y += shelf;
      shelf = 0;
    }
    if (y + item.height > size) return false;
    placed.push([item.cube, x, y]);
    x += item.width;
    shelf = Math.max(shelf, item.height);
  }
  placed.forEach(([cube, px, py]) => {
    cube.uv = [px, py];
  });
  return true;
}

/** 造形を作り、キューブを島として棚詰めパッキングする */
export function buildGeoLayout(params: ArmorParams): GeoLayout {
  const bones = createArmorModel(params);
  const items = bones
    .flatMap((bone) => bone.cubes.map((cube) => ({ cube, ...islandSize(cube) })))
    .sort((a, b) => b.height - a.height || b.width - a.width);
  for (const size of [256, 512, 1024]) {
    if (tryPack(items, size)) return { bones, size };
  }
  throw new Error("UVアトラスに収まりませんでした");
}

/* ---------------- テクスチャ描画 ---------------- */

export function materialColors(params: ArmorParams): Record<MaterialKey, RGB> {
  const primary = hexToRgb(params.primary);
  const secondary = hexToRgb(params.secondary);
  const accent = hexToRgb(params.accent);
  const mix = (a: RGB, b: RGB, t: number): RGB => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
  return {
    shell: primary,
    shade: mix(primary, secondary, 0.68),
    highlight: mix(primary, [238, 223, 194], 0.42),
    filigree: mix(accent, [214, 177, 104], 0.42),
    steel: mix(primary, [174, 183, 189], 0.42),
    void: mix(secondary, [6, 8, 12], 0.88),
    horn: mix(secondary, [216, 198, 157], 0.67),
    ember: mix(accent, [255, 232, 153], 0.42),
    leather: mix(secondary, [87, 66, 57], 0.42),
    edge: mix(secondary, [25, 26, 35], 0.62),
    gem: mix(accent, [247, 235, 208], 0.36),
    sole: mix(secondary, [14, 15, 18], 0.75),
  };
}

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

/** 鱗の格子（0.74 = 縁の影、1.25 = ハイライト） */
function scaleGrid(lx: number, ly: number, detail: number): number {
  const s = Math.max(2, Math.round(detail / 2) + 1);
  const row = Math.floor(ly / s);
  const sx = (lx + (row % 2) * Math.floor(s / 2)) % s;
  const py = ly % s;
  if (py === s - 1) return 0.74;
  if (sx === 1 && py === 0) return 1.25;
  return 1.02;
}

/** 素材ごとの表面パターン（シェル材にのみ適用） */
function stylePattern(style: StyleId, lx: number, ly: number, detail: number): number {
  switch (style) {
    case "scale":
      return scaleGrid(lx, ly, detail);
    case "plate": {
      const s = detail + 2;
      return lx % s === 0 || ly % s === 0 ? 0.7 : 1.05;
    }
    case "chain": {
      const s = Math.max(2, Math.round(detail / 2));
      return (lx + ly) % s === 0 ? 1.25 : 0.84;
    }
    case "leather":
      return (lx * 3 + ly * 5) % 9 === 0 ? 0.8 : 1.04;
    case "crystal":
      return (lx * 2 + ly) % 7 < 3 ? 1.22 : 0.8;
    case "frost":
      return (lx + ly) % (detail + 5) === 0 ? 1.3 : 1.02;
    case "obsidian":
      return 1 + Math.sin((lx * 0.45 + ly * 0.9) * (1 + detail * 0.12)) * 0.12;
    case "ember":
      return (lx + 2 * ly) % 11 === 0 ? 1.3 : 0.9;
    default:
      return 1;
  }
}

function texel(
  face: FaceName,
  cube: GeoCube,
  lx: number,
  ly: number,
  cols: number,
  rows: number,
  px: number,
  py: number,
  bright: number,
  params: ArmorParams,
  colors: Record<MaterialKey, RGB>
): RGB {
  let col = colors[cube.material];
  let k = FACE_SHADE[face];

  // 面の縁を明るく・反対側を暗くして立体感を出す
  if (lx === 0 || ly === 0) k *= 1.13;
  else if (lx >= cols - 1 || ly >= rows - 1) k *= 0.82;

  if (cube.material === "shell") {
    k *= stylePattern(params.style, lx, ly, params.detail);
    if (params.style === "ember" && (lx + 2 * ly) % 11 === 0) col = colors.ember;
  }
  if (cube.decor === "scales") k *= scaleGrid(lx, ly, params.detail);

  const sideFace = face === "front" || face === "back" || face === "left" || face === "right";
  if (
    cube.decor === "rivets" &&
    sideFace &&
    cols >= 5 &&
    rows >= 5 &&
    lx % 3 === 1 &&
    ly % 3 === 1 &&
    lx > 0 &&
    ly > 0 &&
    lx < cols - 1 &&
    ly < rows - 1
  ) {
    col = colors.filigree;
  }
  if (
    cube.decor === "gems" &&
    face === "front" &&
    Math.abs(lx - (cols - 1) / 2) + Math.abs(ly - (rows - 1) / 2) <= Math.min(cols, rows) / 3.2
  ) {
    col = colors.gem;
    k = 1.15 * FACE_SHADE[face];
  }

  const grain = (hash(px, py, params.seed + 97) - 0.5) * (params.noise / 100) * 56;
  const s = k * bright;
  return [clamp(col[0] * s + grain), clamp(col[1] * s + grain), clamp(col[2] * s + grain)];
}

function paintFace(
  out: Uint8ClampedArray,
  atlas: number,
  face: FaceName,
  rect: Rect,
  cube: GeoCube,
  bone: GeoBone,
  params: ArmorParams,
  colors: Record<MaterialKey, RGB>
) {
  const cols = Math.ceil(rect.w);
  const rows = Math.ceil(rect.h);
  const x0 = Math.floor(rect.x);
  const y0 = Math.floor(rect.y);
  const bright = 1 + (params.brightness[bone.part] ?? 0) / 100;
  for (let ly = 0; ly < rows; ly++) {
    for (let lx = 0; lx < cols; lx++) {
      const px = x0 + lx;
      const py = y0 + ly;
      if (px < 0 || py < 0 || px >= atlas || py >= atlas) continue;
      const [r, g, b] = texel(face, cube, lx, ly, cols, rows, px, py, bright, params, colors);
      const o = (py * atlas + px) * 4;
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
      out[o + 3] = 255;
    }
  }
}

/** キューブ単位の島に素材・鱗・リベットを描く。島の外は透明。 */
export function renderGeoTexture(params: ArmorParams, layout: GeoLayout): RGBA {
  const size = layout.size;
  const data = new Uint8ClampedArray(size * size * 4);
  const colors = materialColors(params);
  for (const bone of layout.bones) {
    for (const cube of bone.cubes) {
      const faces = faceRects(cube);
      (Object.keys(faces) as FaceName[]).forEach((face) => {
        paintFace(data, size, face, faces[face], cube, bone, params, colors);
      });
    }
  }
  return { width: size, height: size, data };
}

/* ---------------- 出力 ---------------- */

export function geoModelJson(params: ArmorParams, layout: GeoLayout): string {
  return JSON.stringify(
    {
      format_version: "1.12.0",
      "minecraft:geometry": [
        {
          description: {
            identifier: `geometry.${params.namespace}.${params.armorId}`,
            texture_width: layout.size,
            texture_height: layout.size,
            visible_bounds_width: 3,
            visible_bounds_height: 3.5,
            visible_bounds_offset: [0, 1.1, 0],
          },
          bones: layout.bones.map((bone) => ({
            name: bone.name,
            pivot: bone.pivot,
            cubes: bone.cubes.map((cube) => ({
              origin: cube.origin,
              size: cube.size,
              uv: cube.uv,
            })),
          })),
        },
      ],
    },
    null,
    2
  );
}

/** 出力前の整合性チェック。失敗時は例外を投げる。 */
export function validateGeoLayout(layout: GeoLayout): void {
  if (layout.bones.map((b) => b.name).join() !== GEO_BONE_NAMES.join()) {
    throw new Error("必要な装備ボーンが不足しています");
  }
  for (const bone of layout.bones) {
    if (bone.cubes.length === 0) throw new Error(`空のボーンがあります: ${bone.name}`);
    for (const cube of bone.cubes) {
      if (!cube.size.every((v) => Number.isFinite(v) && v > 0)) {
        throw new Error(`サイズが不正です: ${bone.name}/${cube.name}`);
      }
      const r = islandRect(cube);
      if (r.x < 0 || r.y < 0 || r.x + r.w > layout.size || r.y + r.h > layout.size) {
        throw new Error(`UVが範囲外です: ${bone.name}/${cube.name}`);
      }
    }
  }
}
