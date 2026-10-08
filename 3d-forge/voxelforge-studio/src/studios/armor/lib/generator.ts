import type { ArmorParams, PartId, StyleId } from "./armorTypes";
import {
  ATLAS_H,
  ATLAS_W,
  FACE_SHADE,
  HEAD_UV,
  BODY_UV,
  ARM_UV,
  LEG_UV,
  LAYER1_FACES,
  LAYER2_FACES,
  buildFaceMap,
  type FaceDef,
} from "./uvLayout";

export interface RGBA {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

type RGB = [number, number, number];

interface Palette {
  P: RGB; // primary
  Q: RGB; // secondary
  A: RGB; // accent
}

interface PixelCtx {
  x: number;
  y: number;
  fx: number;
  fy: number;
  fw: number;
  fh: number;
  face: FaceDef;
  seed: number;
  detail: number;
  p: Palette;
}

/* ---------------- 色ユーティリティ ---------------- */

export function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  h = h.padEnd(6, "0").slice(0, 6);
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const mul = (c: RGB, f: number): RGB => [clamp255(c[0] * f), clamp255(c[1] * f), clamp255(c[2] * f)];
const lighten = (c: RGB, t: number) => mix(c, [255, 255, 255], t);
const darken = (c: RGB, t: number) => mix(c, [0, 0, 0], t);

/* ---------------- ノイズ ---------------- */

/** 決定的な疑似乱数 (0..1) */
export function hash(x: number, y: number, seed: number): number {
  let h =
    Math.imul(x | 0, 374761393) ^
    Math.imul(y | 0, 668265263) ^
    Math.imul(seed | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

/** バリューノイズ (0..1) */
function vnoise(x: number, y: number, seed: number, scale: number): number {
  const gx = x / scale;
  const gy = y / scale;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = gx - x0;
  const fy = gy - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0, seed);
  const b = hash(x0 + 1, y0, seed);
  const c = hash(x0, y0 + 1, seed);
  const d = hash(x0 + 1, y0 + 1, seed);
  const top = a + (b - a) * sx;
  const bot = c + (d - c) * sx;
  return top + (bot - top) * sy;
}

/* ---------------- スタイル別パターン ---------------- */

/** 竜鱗：ずらして並んだ鱗 */
function patternScale(c: PixelCtx): RGB {
  const { fx, fy, x, y, seed, detail, p } = c;
  const s = Math.max(2, Math.round(detail / 2) + 1);
  const row = Math.floor(fy / s);
  const sx = fx + (row % 2) * Math.floor(s / 2);
  const lx = sx % s;
  const ly = fy % s;
  const cell = Math.floor(sx / s);
  if (ly === s - 1 && lx !== 0) return darken(p.P, 0.32);
  if (lx === 0 && ly > 0) return darken(p.Q, 0.17);
  const base = mix(p.P, lighten(p.P, 0.26), ly === 0 ? 0.8 : 0.34);
  return mix(base, p.Q, hash(cell + x, row + y, seed) * 0.12);
}

/** 板金：パネル継ぎ目とリベット */
function patternPlate(c: PixelCtx): RGB {
  const { x, y, seed, detail, p } = c;
  const s = detail + 2;
  const gx = Math.floor(x / s);
  const gy = Math.floor(y / s);
  const cx = x - gx * s;
  const cy = y - gy * s;
  const v = hash(gx, gy, seed);
  const base = mix(darken(p.P, 0.08), lighten(p.P, 0.1), v);
  if (cx === 0 || cy === 0) return darken(p.Q, 0.3);
  if (cx === 1 && cy === 1) return p.A;
  if (cx === 1 || cy === 1) return lighten(base, 0.22);
  return base;
}

/** 鎖帷子：交互に向きを変えたリング */
function patternChain(c: PixelCtx): RGB {
  const { x, y, seed, detail, p } = c;
  const s = detail + 1;
  const row = Math.floor(y / s);
  const off = (row & 1) * (s / 2);
  const col = Math.floor((x + off) / s);
  const lx = x + off - col * s - s / 2 + 0.5;
  const ly = y - row * s - s / 2 + 0.5;
  const odd = (col + row) & 1;
  const kx = odd ? 1 : 0.55;
  const ky = odd ? 0.55 : 1;
  const rr = Math.sqrt((lx * kx) ** 2 + (ly * ky) ** 2);
  if (rr > s * 0.42 || rr < s * 0.2) return darken(p.Q, 0.45);
  const base = lx + ly < 0 ? lighten(p.P, 0.3) : darken(p.P, 0.15);
  return mix(base, p.Q, hash(col, row, seed) * 0.2);
}

/** 革：エンボス風のgrain + 縫い目 */
function patternLeather(c: PixelCtx): RGB {
  const { x, y, fx, fy, fw, fh, seed, detail, p } = c;
  const n = vnoise(x, y, seed, 3);
  const base = mul(p.P, 0.82 + 0.3 * n);
  const inset = 2;
  const onSeam =
    (fx === inset || fx === fw - 1 - inset || fy === inset || fy === fh - 1 - inset) &&
    fw > 4 &&
    fh > 4;
  if (onSeam && (fx + fy + detail) % 4 < 2) return mix(p.A, p.Q, 0.3);
  if ((x + y) % 9 === 0 && n > 0.6) return darken(base, 0.12);
  return base;
}

/** 結晶：ファセットカット */
function patternCrystal(c: PixelCtx): RGB {
  const { x, y, seed, detail, p } = c;
  const s = detail + 2;
  const gx = Math.floor(x / s);
  const gy = Math.floor(y / s);
  const lx = x - gx * s;
  const ly = y - gy * s;
  const facet = hash(gx, gy, seed);
  const upper = lx > ly;
  let col = upper ? mix(p.P, lighten(p.P, 0.35), facet) : mix(darken(p.P, 0.25), p.P, facet);
  if (lx === ly) col = lighten(col, 0.4);
  if (hash(x, y, seed + 7) > 0.985) col = p.A;
  return col;
}

/** 溶岩：発光する亀裂（※バニラのモデルでは発光しない） */
function patternEmber(c: PixelCtx): RGB {
  const { x, y, seed, detail, p } = c;
  const n1 = vnoise(x, y, seed, 4);
  const n2 = vnoise(x, y, seed + 5, 2);
  const v = Math.abs(n1 - 0.5) * 2;
  const thr = 0.06 + detail * 0.01;
  if (v < thr) return mix(p.A, [255, 255, 220], 0.4);
  if (v < thr * 2.2) {
    const t = 1 - v / (thr * 2.2);
    return mix(darken(p.P, 0.2), p.A, 0.5 * t);
  }
  return mix(darken(p.P, 0.45), p.P, n2);
}

/** 氷：霜と輝き */
function patternFrost(c: PixelCtx): RGB {
  const { x, y, seed, detail, p } = c;
  const n = vnoise(x, y, seed, 3);
  let col = mix(p.P, [255, 255, 255], 0.12 + 0.35 * n);
  if ((x + y * 2) % (detail + 5) === 0) col = lighten(col, 0.25);
  if (hash(x, y, seed + 3) > 0.94) col = mix(col, p.A, 0.8);
  return col;
}

/** 黒曜石：貝殻状の断面 */
function patternObsidian(c: PixelCtx): RGB {
  const { x, y, seed, detail, p } = c;
  const n = vnoise(x, y, seed, 6);
  const t = Math.sin((x * 0.45 + y * 0.9) * (1 + detail * 0.12) + n * 6) * 0.5 + 0.5;
  let col = mix(darken(p.P, 0.35), lighten(p.P, 0.22), t);
  if (hash(x, y, seed + 11) > 0.99) col = p.A;
  return col;
}

const PATTERNS: Record<StyleId, (c: PixelCtx) => RGB> = {
  scale: patternScale,
  plate: patternPlate,
  chain: patternChain,
  leather: patternLeather,
  crystal: patternCrystal,
  ember: patternEmber,
  frost: patternFrost,
  obsidian: patternObsidian,
};

/* --- Individual face painting. The pattern is the material, not the design. --- */

function designedPixel(c: PixelCtx, params: ArmorParams): RGB | null | undefined {
  const { fx: x, fy: y, fw: w, face, p } = c;
  const rim = mix(p.P, p.A, 0.68);
  const gilt = lighten(rim, 0.28);
  const dark = darken(p.Q, 0.67);
  const inset = darken(p.Q, 0.36);
  const bright = lighten(p.P, 0.42);
  const mirror = Math.min(x, w - 1 - x);

  if (face.part === "helmet") {
    if (face.name === "front") {
      if (y === 0) {
        if (params.helmetProfile === "crown" && (x === 1 || x === 3 || x === 4 || x === 6)) return gilt;
        return x === 3 || x === 4 ? gilt : x === 0 || x === 7 ? p.Q : bright;
      }
      if (y === 1) {
        if (params.helmetProfile === "sentinel" && (x === 3 || x === 4)) return bright;
        return x === 3 || x === 4 ? rim : mirror === 0 ? p.Q : undefined;
      }
      if (y === 2) return mirror === 0 ? gilt : x === 3 || x === 4 ? gilt : rim;
      if (y === 3 || y === 4) {
        if (mirror === 0) return rim;
        if (params.visorMode === "open" && x >= 2 && x <= 5) return null;
        if (y === 3 && (x === 2 || x === 5) && params.visorMode === "embers") return lighten(p.A, 0.5);
        return dark;
      }
      if (y === 5) return mirror <= 1 ? bright : x === 3 || x === 4 ? rim : inset;
      if (y === 6) return mirror === 0 ? p.Q : x === 3 || x === 4 ? gilt : undefined;
      if (y === 7) return mirror <= 1 ? p.Q : x === 3 || x === 4 ? rim : inset;
    }
    if (face.name === "top") {
      if (x === 3 || x === 4) return y % 3 === 0 ? gilt : rim;
      if ((x === 1 || x === 6) && y % 2 === 0) return bright;
      if (x === 0 || x === 7 || y === 0 || y === 7) return p.Q;
    }
    if (face.name === "right" || face.name === "left") {
      if (y === 0 || y === 2) return y === 2 ? rim : bright;
      if (y === 3 && x >= 2 && x <= 5) return inset;
      if (y === 4 && x >= 2 && x <= 5) return dark;
      if (y === 5 && x <= 2) return gilt;
      if (y === 7) return x % 3 === 0 ? gilt : p.Q;
    }
    if (face.name === "back") {
      if (y === 2 || y === 7) return rim;
      if (x === 3 || x === 4) return y % 3 === 0 ? gilt : bright;
    }
  }

  if (face.part === "chest" && face.rect.x === BODY_UV[face.name].x) {
    if (face.name === "front" || face.name === "back") {
      if (y === 0 && (x === 3 || x === 4)) return null;
      if (y === 0 || y === 1) return x === 0 || x === 7 ? p.Q : rim;
      if (y === 2 && mirror <= 1) return bright;
      if (face.name === "front" && y >= 3 && y <= 7) {
        if ((x === 3 || x === 4) && y >= 4 && y <= 6) return y === 4 ? gilt : p.A;
        if (x === 2 || x === 5) return y % 2 ? rim : inset;
      }
      if (y === 9 || y === 10) return y === 10 ? rim : inset;
      if (y === 11) return x === 0 || x === 7 ? dark : p.Q;
    }
    if (face.name === "left" || face.name === "right") {
      if (y === 0 || y === 1 || y === 10) return rim;
      if (y === 4 && x % 2 === 0) return bright;
    }
  }

  if (face.part === "chest" && face.rect.x === ARM_UV[face.name].x) {
    if (face.name === "front" || face.name === "back" || face.name === "right" || face.name === "left") {
      if (y <= 2) return y === 0 ? gilt : y === 2 ? rim : bright;
      if (y === 3 || y === 8 || y === 11) return inset;
      if (y === 9) return rim;
    }
  }

  if (face.part === "boots") {
    if (face.name === "top") return null;
    if (face.name !== "bottom" && y < 7) return null;
    if (y === 7 || y === 8) return y === 7 ? rim : bright;
    if (y === 9 && x === Math.floor(w / 2)) return gilt;
    if (y === 11 || face.name === "bottom") return dark;
  }

  if (face.part === "leggings") {
    if (face.rect.x === BODY_UV[face.name].x) {
      if (face.name === "front" && (y === 1 || y === 3)) return rim;
      if (face.name === "front" && y === 5 && (x === 3 || x === 4)) return gilt;
      if (y > 7) return null;
    } else {
      if (y === 0 || y === 1) return rim;
      if (y === 6 && face.name === "front") return bright;
      if (y === 7 && face.name === "front") return gilt;
      if (y === 11) return inset;
    }
  }

  return undefined;
}

/* ---------------- アトラス生成 ---------------- */

export function renderAtlas(layer: 1 | 2, params: ArmorParams): RGBA {
  const faces = layer === 1 ? LAYER1_FACES : LAYER2_FACES;
  const faceMap = buildFaceMap(faces);
  const data = new Uint8ClampedArray(ATLAS_W * ATLAS_H * 4);
  const palette: Palette = {
    P: hexToRgb(params.primary),
    Q: hexToRgb(params.secondary),
    A: hexToRgb(params.accent),
  };
  const pattern = PATTERNS[params.style];
  const noiseAmp = (params.noise / 100) * 48;

  for (let y = 0; y < ATLAS_H; y++) {
    for (let x = 0; x < ATLAS_W; x++) {
      const idx = y * ATLAS_W + x;
      const fi = faceMap[idx];
      if (fi < 0) continue;
      const face = faces[fi];
      const fx = x - face.rect.x;
      const fy = y - face.rect.y;
      const fw = face.rect.w;
      const fh = face.rect.h;

      const context = { x, y, fx, fy, fw, fh, face, seed: params.seed, detail: params.detail, p: palette };
      const design = designedPixel(context, params);
      if (design === null) continue;
      let rgb = design ?? pattern(context);
      rgb = mul(rgb, FACE_SHADE[face.name]);
      if (params.edgeShade && (fx === 0 || fy === 0 || fx === fw - 1 || fy === fh - 1)) {
        rgb = darken(rgb, 0.18);
      }
      const bright = 1 + (params.brightness[face.part as PartId] ?? 0) / 100;
      const nz = (hash(x, y, params.seed + 99) - 0.5) * noiseAmp;

      const o = idx * 4;
      data[o] = clamp255(rgb[0] * bright + nz);
      data[o + 1] = clamp255(rgb[1] * bright + nz);
      data[o + 2] = clamp255(rgb[2] * bright + nz);
      data[o + 3] = 255;
    }
  }
  return { width: ATLAS_W, height: ATLAS_H, data };
}

/* ---------------- アイテムアイコン (16px art directed) ---------------- */

function helmetMask(x: number, y: number, params: ArmorParams): boolean {
  if (params.helmetProfile === "drake") {
    if (params.hornLength > 0 && y < 4 && y >= 3 - params.hornLength) {
      const hornX = Math.min(x, 15 - x);
      if ((y === 0 && hornX === 1) || (y === 1 && hornX >= 1 && hornX <= 2) ||
        (y === 2 && hornX >= 2 && hornX <= 4) || (y === 3 && hornX >= 3 && hornX <= 5)) return true;
    }
  } else if (params.helmetProfile === "sentinel") {
    if (params.hornLength > 0 && y < 4 && y >= 3 - params.hornLength &&
      x >= 7 - Math.floor(y / 2) && x <= 8 + Math.floor(y / 2)) return true;
  } else if (params.hornLength > 0 && y < 4 && y >= 3 - params.hornLength) {
    if ((y === 0 && [3, 7, 8, 12].includes(x)) ||
      (y === 1 && [3, 4, 7, 8, 11, 12].includes(x)) ||
      (y === 2 && x >= 3 && x <= 12)) return true;
  }
  if (y === 3) return x >= 4 && x <= 11;
  if (y === 4) return x >= 3 && x <= 12;
  if (y >= 5 && y <= 11) return x >= 2 && x <= 13;
  if (y === 12) return x >= 3 && x <= 12;
  if (y === 13) return x >= 4 && x <= 11;
  if (y === 14) return x >= 5 && x <= 10;
  return y === 15 && x >= 7 && x <= 8;
}

function iconMask(part: PartId, x: number, y: number, params: ArmorParams): boolean {
  if (part === "helmet") return helmetMask(x, y, params);
  if (part === "chest") {
    if (y === 1) return x >= 5 && x <= 10 && x !== 7 && x !== 8;
    if (y === 2) return x >= 3 && x <= 12 && x !== 7 && x !== 8;
    if (y >= 3 && y <= 6) return x >= 1 && x <= 14 && !(x >= 6 && x <= 9 && y === 3);
    if (y >= 7 && y <= 9) return (x >= 1 && x <= 4) || (x >= 5 && x <= 10) || (x >= 11 && x <= 14);
    if (y >= 10 && y <= 13) return x >= 4 && x <= 11;
    return y === 14 && x >= 5 && x <= 10;
  }
  if (part === "leggings") {
    if (y >= 1 && y <= 4) return x >= 3 && x <= 12;
    if (y >= 5 && y <= 13) return (x >= 3 && x <= 7) || (x >= 8 && x <= 12);
    return y === 14 && ((x >= 2 && x <= 7) || (x >= 8 && x <= 13));
  }
  if (y >= 3 && y <= 9) return (x >= 2 && x <= 6) || (x >= 9 && x <= 13);
  if (y >= 10 && y <= 11) return (x >= 1 && x <= 7) || (x >= 8 && x <= 14);
  if (y >= 12 && y <= 13) return x >= 1 && x <= 14;
  return y === 14 && x >= 2 && x <= 14;
}

function sampleIconColor(part: PartId, x: number, y: number, layer1: RGBA, layer2: RGBA, params: ArmorParams): RGB {
  const rect = part === "helmet" ? HEAD_UV.front
    : part === "chest" ? (x < 4 || x > 11 ? ARM_UV.front : BODY_UV.front)
    : part === "leggings" && y < 5 ? BODY_UV.front : LEG_UV.front;
  const atlas = part === "leggings" ? layer2 : layer1;
  const sx = rect.x + Math.min(rect.w - 1, Math.max(0, Math.floor(x / 16 * rect.w)));
  const bootY = part === "boots" ? 7 + Math.floor(y / 16 * 5) : Math.floor(y / 16 * rect.h);
  const sy = rect.y + Math.min(rect.h - 1, Math.max(0, bootY));
  const o = (sy * atlas.width + sx) * 4;
  if (atlas.data[o + 3] < 128) return hexToRgb(params.primary);
  return [atlas.data[o], atlas.data[o + 1], atlas.data[o + 2]];
}

function iconColor(part: PartId, x: number, y: number, base: RGB, params: ArmorParams): RGB | null {
  const accent = hexToRgb(params.accent);
  const secondary = hexToRgb(params.secondary);
  const gold = mix(accent, [222, 188, 112], 0.28);
  const dark = darken(secondary, 0.62);
  const pale = mix(secondary, [235, 213, 170], 0.7);

  if (part === "helmet") {
    if (y <= 3 && ((params.helmetProfile === "drake" && (x <= 5 || x >= 10)) ||
      (params.helmetProfile === "sentinel" && x >= 6 && x <= 9) ||
      params.helmetProfile === "crown")) return y % 2 ? pale : lighten(pale, 0.24);
    if (y === 4 && (x === 7 || x === 8)) return gold;
    if (y >= 5 && y <= 7 && (x === 7 || x === 8)) return y === 6 ? lighten(accent, 0.45) : gold;
    if (y === 8 && x >= 3 && x <= 12) return gold;
    if (y === 9 || y === 10) {
      if (x >= 4 && x <= 11) {
        if (params.visorMode === "open" && (x === 5 || x === 6 || x === 9 || x === 10)) return null;
        if (params.visorMode === "embers" && y === 9 && (x === 5 || x === 6 || x === 9 || x === 10)) return lighten(accent, 0.5);
        if (x === 7 || x === 8) return gold;
        return dark;
      }
    }
    if (y === 11 && (x === 3 || x === 12)) return gold;
    if (y === 13 && (x === 6 || x === 9)) return gold;
    if (y === 14 || y === 15) return y === 15 ? dark : mix(base, gold, 0.3);
    return y < 8 ? lighten(base, 0.14) : base;
  }
  if (part === "chest") {
    if (y >= 3 && y <= 6 && (x <= 3 || x >= 12)) return y === 3 || y === 6 ? gold : lighten(base, 0.26);
    if (y === 3 || y === 4) return gold;
    if (x >= 7 && x <= 8 && y >= 6 && y <= 9) return y === 6 ? lighten(accent, 0.48) : accent;
    if ((x === 5 || x === 10) && y >= 6 && y <= 10) return gold;
    if (y === 12 || y === 13) return y === 13 ? secondary : gold;
  }
  if (part === "leggings") {
    if (y === 1 || y === 4) return gold;
    if (y === 2 && (x === 4 || x === 11)) return lighten(accent, 0.28);
    if (y === 9 || y === 10) return y === 9 ? gold : lighten(base, 0.28);
    if (y === 13) return secondary;
  }
  if (part === "boots") {
    if (y === 3 || y === 10) return gold;
    if (y >= 12) return y === 14 ? dark : mix(base, secondary, 0.38);
    if (y === 7 && (x === 4 || x === 11)) return lighten(accent, 0.32);
  }
  return base;
}

export function renderIcons(layer1: RGBA, layer2: RGBA, size: number, params: ArmorParams): Record<PartId, RGBA> {
  const result = {} as Record<PartId, RGBA>;
  for (const part of ["helmet", "chest", "leggings", "boots"] as PartId[]) {
    const art = new Uint8ClampedArray(16 * 16 * 4);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (!iconMask(part, x, y, params)) continue;
        const base = sampleIconColor(part, x, y, layer1, layer2, params);
        let color = iconColor(part, x, y, base, params);
        if (!color) continue;
        const edge = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) =>
          !iconMask(part, x + dx, y + dy, params)
        );
        if (edge) color = darken(color, 0.4);
        const o = (y * 16 + x) * 4;
        art[o] = color[0];
        art[o + 1] = color[1];
        art[o + 2] = color[2];
        art[o + 3] = 255;
      }
    }
    const scaled = new Uint8ClampedArray(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const from = (Math.floor(y * 16 / size) * 16 + Math.floor(x * 16 / size)) * 4;
        scaled.set(art.subarray(from, from + 4), (y * size + x) * 4);
      }
    }
    result[part] = { width: size, height: size, data: scaled };
  }
  return result;
}
