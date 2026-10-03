import { clone, clamp01, hash2, type FXCtx } from "./fxutil";
import { CORE_FX, CATS, defaults, type Cat, type EffectDef, type Values } from "./effects";
import { DECOR_FX, MATERIAL_FX, SPECIAL_FX } from "./effects2";
import { EXTRA_FX } from "./effects3";

export { CATS, defaults };
export type { Cat, EffectDef, Values, ParamSpec } from "./effects";

export const ALL_FX: EffectDef[] = [...CORE_FX, ...DECOR_FX, ...MATERIAL_FX, ...SPECIAL_FX, ...EXTRA_FX];
export const FX_BY_ID: Map<string, EffectDef> = new Map(ALL_FX.map((d) => [d.id, d]));
export const CAT_ORDER: Cat[] = ["color", "pixel", "decor", "material", "special"];

export function fxByCat(cat: Cat) {
  return ALL_FX.filter((d) => d.cat === cat);
}

let _uid = 0;
export const uid = () => `${Date.now().toString(36)}-${(++_uid).toString(36)}`;

export interface Inst {
  uid: string;
  id: string;
  on: boolean;
  amount: number; // 0..100 全体の効き
  values: Values;
}

export function makeInst(id: string, overrides: Values = {}): Inst {
  const d = FX_BY_ID.get(id)!;
  return { uid: uid(), id, on: true, amount: 100, values: { ...defaults(d), ...overrides } };
}

const seedOf = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 100000;
};

/** ベーステクスチャにエフェクトスタックを順適用して結果を返す */
export function renderPipeline(base: ImageData, insts: Inst[], t: number, seed = 1): ImageData {
  let img = clone(base);
  const size = base.width;
  for (const it of insts) {
    if (!it.on) continue;
    const d = FX_BY_ID.get(it.id);
    if (!d) continue;
    const ctx: FXCtx = { size, t, seed: seed * 31 + seedOf(it.uid) };
    const amt = clamp01(it.amount / 100);
    if (amt >= 0.999) {
      d.apply(img, it.values, ctx);
    } else {
      const src = clone(img);
      d.apply(img, it.values, ctx);
      const a = src.data, b = img.data;
      for (let i = 0; i < b.length; i++) b[i] = a[i] + (b[i] - a[i]) * amt;
    }
  }
  return img;
}

export function paintTo(canvas: HTMLCanvasElement, img: ImageData) {
  if (canvas.width !== img.width || canvas.height !== img.height) {
    canvas.width = img.width;
    canvas.height = img.height;
  }
  const g = canvas.getContext("2d", { willReadFrequently: true })!;
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.putImageData(img, 0, 0);
}

/** 使用中の色数を数える */
export function countColors(img: ImageData) {
  const set = new Set<number>();
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    set.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
  }
  return set.size;
}

/** 平均色 */
export function averageColor(img: ImageData) {
  let r = 0, g = 0, b = 0, n = 0;
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) continue;
    r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
  }
  if (!n) return { r: 128, g: 128, b: 128 };
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

export function isAnimated(insts: Inst[]) {
  return insts.some((i) => i.on && FX_BY_ID.get(i.id)?.animated);
}

export { hash2 };
