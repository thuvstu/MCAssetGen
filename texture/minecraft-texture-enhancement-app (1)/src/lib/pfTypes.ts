import type { FXCtx } from "./fxutil";

export type Cat = "color" | "pixel" | "decor" | "material" | "special";

export const CATS: Record<Cat, { label: string; en: string; color: string; desc: string }> = {
  color: { label: "カラー", en: "COLOR", color: "#f5a63c", desc: "色・階調の調整" },
  pixel: { label: "ピクセル表現", en: "PIXEL", color: "#37d6c4", desc: "ドット絵専用処理" },
  decor: { label: "装飾デコレーション", en: "DECOR", color: "#ef5f8c", desc: "枠・宝石・粒子・紋様" },
  material: { label: "マテリアル質感", en: "MATERIAL", color: "#b6e14f", desc: "苔・錆・霜・ひび割れ" },
  special: { label: "特殊エフェクト", en: "SPECIAL", color: "#59a7ff", desc: "光・魔法・アニメ" },
};

export type ParamSpec =
  | { key: string; label: string; type: "range"; min: number; max: number; step: number; def: number; unit?: string }
  | { key: string; label: string; type: "color"; def: string }
  | { key: string; label: string; type: "select"; def: string; options: { v: string; l: string }[] }
  | { key: string; label: string; type: "toggle"; def: boolean };

export interface EffectDef {
  id: string;
  name: string;
  en: string;
  cat: Cat;
  desc: string;
  icon: string;
  animated?: boolean;
  params: ParamSpec[];
  apply: (img: ImageData, v: Record<string, any>, ctx: FXCtx) => void;
}

export type Values = Record<string, any>;

export function defaults(def: EffectDef): Values {
  const v: Values = {};
  for (const p of def.params) v[p.key] = p.def;
  return v;
}

export const R = (key: string, label: string, min: number, max: number, step: number, def: number, unit?: string): ParamSpec =>
  ({ key, label, type: "range", min, max, step, def, unit });
export const C = (key: string, label: string, def: string): ParamSpec => ({ key, label, type: "color", def });
export const S = (key: string, label: string, def: string, options: [string, string][]): ParamSpec =>
  ({ key, label, type: "select", def, options: options.map(([v, l]) => ({ v, l })) });
export const T = (key: string, label: string, def: boolean): ParamSpec => ({ key, label, type: "toggle", def });

export const mkdef = (
  id: string, name: string, en: string, cat: Cat, desc: string, icon: string,
  params: ParamSpec[], apply: EffectDef["apply"], animated = false,
): EffectDef => ({ id, name, en, cat, desc, icon, params, apply, animated });
export { mkdef as def };
