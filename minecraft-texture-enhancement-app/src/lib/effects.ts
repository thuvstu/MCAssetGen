import {
  clone, clamp, clamp01, hexToRgb, rgbToHsl, hslToRgb, luminance, mulberry32,
  boxBlur, overPx, addPx, screenPx, getAlpha,
  extractPalette, nearestPalette, bayerAt, type FXCtx,
} from "./fxutil";

// ============================================================
//  型定義
// ============================================================
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

const R = (key: string, label: string, min: number, max: number, step: number, def: number, unit?: string): ParamSpec =>
  ({ key, label, type: "range", min, max, step, def, unit });
const C = (key: string, label: string, def: string): ParamSpec => ({ key, label, type: "color", def });
const S = (key: string, label: string, def: string, options: [string, string][]): ParamSpec =>
  ({ key, label, type: "select", def, options: options.map(([v, l]) => ({ v, l })) });
const T = (key: string, label: string, def: boolean): ParamSpec => ({ key, label, type: "toggle", def });

const def = (
  id: string, name: string, en: string, cat: Cat, desc: string, icon: string,
  params: ParamSpec[], apply: EffectDef["apply"], animated = false,
): EffectDef => ({ id, name, en, cat, desc, icon, params, apply, animated });

// ============================================================
//  1. カラー / 階調
// ============================================================
const COLOR_FX: EffectDef[] = [
  def("brightness", "明度", "BRIGHTNESS", "color", "全体の明るさを加算調整", "sun",
    [R("amt", "強さ", -100, 100, 1, 0)],
    (img, v) => {
      const d = img.data, k = v.amt * 2.55;
      for (let i = 0; i < d.length; i += 4) { d[i] = clamp(d[i] + k); d[i + 1] = clamp(d[i + 1] + k); d[i + 2] = clamp(d[i + 2] + k); }
    }),

  def("contrast", "コントラスト", "CONTRAST", "color", "明暗差を強調 / 平坦化", "contrast",
    [R("amt", "強さ", -100, 150, 1, 0)],
    (img, v) => {
      const d = img.data, f = (259 * (v.amt * 2.55 + 255)) / (255 * (259 - v.amt * 2.55));
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp(f * (d[i] - 128) + 128); d[i + 1] = clamp(f * (d[i + 1] - 128) + 128); d[i + 2] = clamp(f * (d[i + 2] - 128) + 128);
      }
    }),

  def("saturation", "彩度", "SATURATION", "color", "色の鮮やかさを制御", "droplet",
    [R("amt", "強さ", -100, 200, 1, 0)],
    (img, v) => {
      const d = img.data, k = 1 + v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        const l = luminance(d[i], d[i + 1], d[i + 2]);
        d[i] = clamp(l + (d[i] - l) * k); d[i + 1] = clamp(l + (d[i + 1] - l) * k); d[i + 2] = clamp(l + (d[i + 2] - l) * k);
      }
    }),

  def("vibrance", "自然な彩度", "VIBRANCE", "color", "低彩度部分だけを強調", "vibrance",
    [R("amt", "強さ", -100, 150, 1, 30)],
    (img, v) => {
      const d = img.data, k = v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
        const sat = (mx - mn) / 255;
        const amt = k * (1 - sat) * 1.6;
        const l = luminance(d[i], d[i + 1], d[i + 2]);
        d[i] = clamp(l + (d[i] - l) * (1 + amt)); d[i + 1] = clamp(l + (d[i + 1] - l) * (1 + amt)); d[i + 2] = clamp(l + (d[i + 2] - l) * (1 + amt));
      }
    }),

  def("hue", "色相回転", "HUE ROTATE", "color", "色相環を回転させる", "hue",
    [R("deg", "角度", 0, 360, 1, 0)],
    (img, v) => {
      const d = img.data, s = v.deg / 360;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        const h = rgbToHsl(d[i], d[i + 1], d[i + 2]);
        const c = hslToRgb(h.h + s, h.s, h.l);
        d[i] = c.r; d[i + 1] = c.g; d[i + 2] = c.b;
      }
    }),

  def("exposure", "露出", "EXPOSURE", "color", "乗算で明るさを制御", "exposure",
    [R("amt", "EV", -100, 150, 1, 0)],
    (img, v) => {
      const d = img.data, k = Math.pow(2, v.amt / 100);
      for (let i = 0; i < d.length; i += 4) { d[i] = clamp(d[i] * k); d[i + 1] = clamp(d[i + 1] * k); d[i + 2] = clamp(d[i + 2] * k); }
    }),

  def("gamma", "ガンマ", "GAMMA", "color", "中間調のカーブ調整", "gamma",
    [R("g", "値", 0.2, 3, 0.01, 1)],
    (img, v) => {
      const d = img.data, g = 1 / Math.max(0.05, v.g);
      const lut = new Uint8ClampedArray(256);
      for (let i = 0; i < 256; i++) lut[i] = clamp(Math.pow(i / 255, g) * 255);
      for (let i = 0; i < d.length; i += 4) { d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]]; }
    }),

  def("temperature", "色温度", "TEMPERATURE", "color", "暖色 ↔ 寒色", "thermo",
    [R("amt", "強さ", -100, 100, 1, 0)],
    (img, v) => {
      const d = img.data, k = v.amt / 100 * 26;
      for (let i = 0; i < d.length; i += 4) { d[i] = clamp(d[i] + k); d[i + 2] = clamp(d[i + 2] - k); }
    }),

  def("tintfx", "色かぶり", "TINT", "color", "緑 ↔ マゼンタ", "tint",
    [R("amt", "強さ", -100, 100, 1, 0)],
    (img, v) => {
      const d = img.data, k = v.amt / 100 * 24;
      for (let i = 0; i < d.length; i += 4) { d[i] = clamp(d[i] + k); d[i + 1] = clamp(d[i + 1] - k); d[i + 2] = clamp(d[i + 2] + k); }
    }),

  def("levels", "レベル補正", "LEVELS", "color", "黒点 / 白点を再定義", "levels",
    [R("bin", "入力黒点", 0, 128, 1, 0), R("win", "入力白点", 128, 255, 1, 255), R("bout", "出力黒点", 0, 128, 1, 0), R("wout", "出力白点", 128, 255, 1, 255)],
    (img, v) => {
      const d = img.data;
      const lo = Math.min(v.bin, v.win - 1), hi = Math.max(v.win, v.bin + 1);
      const lut = new Uint8ClampedArray(256);
      for (let i = 0; i < 256; i++) {
        const t = clamp01((i - lo) / (hi - lo));
        lut[i] = clamp(v.bout + t * (v.wout - v.bout));
      }
      for (let i = 0; i < d.length; i += 4) { d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]]; }
    }),

  def("grayscale", "グレースケール", "GRAYSCALE", "color", "モノトーン化", "gray",
    [R("amt", "強さ", 0, 100, 1, 100), S("mode", "方式", "luma", [["luma", "輝度"], ["avg", "平均"], ["max", "明度優先"]])],
    (img, v) => {
      const d = img.data, k = v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        const g = v.mode === "avg" ? (d[i] + d[i + 1] + d[i + 2]) / 3 : v.mode === "max" ? Math.max(d[i], d[i + 1], d[i + 2]) : luminance(d[i], d[i + 1], d[i + 2]);
        d[i] = clamp(d[i] + (g - d[i]) * k); d[i + 1] = clamp(d[i + 1] + (g - d[i + 1]) * k); d[i + 2] = clamp(d[i + 2] + (g - d[i + 2]) * k);
      }
    }),

  def("sepia", "セピア", "SEPIA", "color", "古写真風の暖色調", "sepia",
    [R("amt", "強さ", 0, 100, 1, 100)],
    (img, v) => {
      const d = img.data, k = v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const nr = clamp(r * 0.393 + g * 0.769 + b * 0.189);
        const ng = clamp(r * 0.349 + g * 0.686 + b * 0.168);
        const nb = clamp(r * 0.272 + g * 0.534 + b * 0.131);
        d[i] = r + (nr - r) * k; d[i + 1] = g + (ng - g) * k; d[i + 2] = b + (nb - b) * k;
      }
    }),

  def("invert", "階調反転", "INVERT", "color", "色をネガポジ反転", "invert",
    [R("amt", "強さ", 0, 100, 1, 100), T("alpha", "アルファも反転", false)],
    (img, v) => {
      const d = img.data, k = v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp(d[i] + (255 - d[i] - d[i]) * k); d[i + 1] = clamp(d[i + 1] + (255 - 2 * d[i + 1]) * k); d[i + 2] = clamp(d[i + 2] + (255 - 2 * d[i + 2]) * k);
        if (v.alpha) d[i + 3] = clamp(d[i + 3] + (255 - 2 * d[i + 3]) * k);
      }
    }),

  def("posterize", "ポスタリゼーション", "POSTERIZE", "color", "階調を段階化", "poster",
    [R("levels", "階調数", 2, 24, 1, 4), R("amt", "強さ", 0, 100, 1, 100)],
    (img, v) => {
      const d = img.data, n = Math.max(2, v.levels), k = v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        for (let c = 0; c < 3; c++) {
          const q = Math.round((d[i + c] / 255) * (n - 1)) / (n - 1) * 255;
          d[i + c] = clamp(d[i + c] + (q - d[i + c]) * k);
        }
      }
    }),

  def("threshold", "二値化", "THRESHOLD", "color", "完全な2値に変換", "threshold",
    [R("val", "しきい値", 0, 255, 1, 128), C("fg", "前景色", "#ffffff"), C("bg", "背景色", "#000000"), T("keepAlpha", "透明維持", true)],
    (img, v) => {
      const d = img.data, f = hexToRgb(v.fg), b = hexToRgb(v.bg);
      for (let i = 0; i < d.length; i += 4) {
        if (v.keepAlpha && d[i + 3] === 0) continue;
        const on = luminance(d[i], d[i + 1], d[i + 2]) >= v.val;
        d[i] = on ? f.r : b.r; d[i + 1] = on ? f.g : b.g; d[i + 2] = on ? f.b : b.b;
        if (!v.keepAlpha) d[i + 3] = 255;
      }
    }),

  def("colorize", "単色化", "COLORIZE", "color", "1色で全体を染める", "colorize",
    [C("color", "色", "#f5a63c"), R("amt", "強さ", 0, 100, 1, 60), T("keepLuma", "明度保持", true)],
    (img, v) => {
      const d = img.data, c = hexToRgb(v.color), k = v.amt / 100;
      const h = rgbToHsl(c.r, c.g, c.b);
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        const l = luminance(d[i], d[i + 1], d[i + 2]);
        const t = v.keepLuma ? hslToRgb(h.h, h.s, l / 255) : c;
        d[i] = clamp(d[i] + (t.r - d[i]) * k); d[i + 1] = clamp(d[i + 1] + (t.g - d[i + 1]) * k); d[i + 2] = clamp(d[i + 2] + (t.b - d[i + 2]) * k);
      }
    }),

  def("duotone", "デュオトーン", "DUOTONE", "color", "暗部と明部を別色で置換", "duotone",
    [C("dark", "暗部色", "#1b1140"), C("light", "明部色", "#ffd166"), R("amt", "強さ", 0, 100, 1, 100)],
    (img, v) => {
      const d = img.data, dk = hexToRgb(v.dark), lt = hexToRgb(v.light), k = v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        const t = luminance(d[i], d[i + 1], d[i + 2]) / 255;
        const r = dk.r + (lt.r - dk.r) * t, g = dk.g + (lt.g - dk.g) * t, b = dk.b + (lt.b - dk.b) * t;
        d[i] = clamp(d[i] + (r - d[i]) * k); d[i + 1] = clamp(d[i + 1] + (g - d[i + 1]) * k); d[i + 2] = clamp(d[i + 2] + (b - d[i + 2]) * k);
      }
    }),

  def("gradientMap", "グラデーションマップ", "GRADIENT MAP", "color", "3点カラーで階調マッピング", "gradient",
    [C("c1", "暗部", "#0b1e3a"), C("c2", "中間", "#37d6c4"), C("c3", "明部", "#fff3c4"), R("amt", "強さ", 0, 100, 1, 100)],
    (img, v) => {
      const d = img.data, a = hexToRgb(v.c1), b = hexToRgb(v.c2), c = hexToRgb(v.c3), k = v.amt / 100;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        const t = luminance(d[i], d[i + 1], d[i + 2]) / 255;
        const p = t < 0.5 ? { r: a.r + (b.r - a.r) * t * 2, g: a.g + (b.g - a.g) * t * 2, b: a.b + (b.b - a.b) * t * 2 }
          : { r: b.r + (c.r - b.r) * (t - 0.5) * 2, g: b.g + (c.g - b.g) * (t - 0.5) * 2, b: b.b + (c.b - b.b) * (t - 0.5) * 2 };
        d[i] = clamp(d[i] + (p.r - d[i]) * k); d[i + 1] = clamp(d[i + 1] + (p.g - d[i + 1]) * k); d[i + 2] = clamp(d[i + 2] + (p.b - d[i + 2]) * k);
      }
    }),

  def("channelSwap", "チャンネル入替", "CHANNEL SWAP", "color", "RGB の割り当てを入れ替える", "swap",
    [S("mode", "順序", "rbg", [["rgb", "RGB (既定)"], ["rbg", "RBG"], ["grb", "GRB"], ["gbr", "GBR"], ["brg", "BRG"], ["bgr", "BGR"]])],
    (img, v) => {
      const d = img.data, m: Record<string, number[]> = { rgb: [0, 1, 2], rbg: [0, 2, 1], grb: [1, 0, 2], gbr: [1, 2, 0], brg: [2, 0, 1], bgr: [2, 1, 0] };
      const o = m[v.mode] || m.rgb;
      const tmp = clone(img);
      for (let i = 0; i < d.length; i += 4) { d[i] = tmp.data[i + o[0]]; d[i + 1] = tmp.data[i + o[1]]; d[i + 2] = tmp.data[i + o[2]]; }
    }),
];

// ============================================================
//  2. ピクセル表現
// ============================================================
const PIXEL_FX: EffectDef[] = [
  def("pixelate", "ピクセル化", "PIXELATE", "pixel", "ブロック単位で間引く", "grid",
    [R("block", "ブロック", 2, 16, 1, 2)],
    (img, v) => {
      const s = clone(img), b = Math.max(2, Math.round(v.block)), w = img.width, h = img.height, d = img.data;
      for (let by = 0; by < h; by += b)
        for (let bx = 0; bx < w; bx += b) {
          let r = 0, g = 0, bl = 0, a = 0, n = 0;
          for (let y = by; y < Math.min(h, by + b); y++)
            for (let x = bx; x < Math.min(w, bx + b); x++) {
              const i = (y * w + x) << 2;
              r += s.data[i]; g += s.data[i + 1]; bl += s.data[i + 2]; a += s.data[i + 3]; n++;
            }
          r /= n; g /= n; bl /= n; a /= n;
          for (let y = by; y < Math.min(h, by + b); y++)
            for (let x = bx; x < Math.min(w, bx + b); x++) {
              const i = (y * w + x) << 2;
              d[i] = r; d[i + 1] = g; d[i + 2] = bl; d[i + 3] = a;
            }
        }
    }),

  def("ditherBayer", "順序ディザ", "ORDERED DITHER", "pixel", "バイエル行列でレトロ調に", "dither",
    [S("order", "行列", "4", [["2", "2×2"], ["4", "4×4"], ["8", "8×8"]]), R("colors", "色数", 2, 32, 1, 6), R("spread", "拡散", 0, 100, 1, 45)],
    (img, v) => {
      const pal = extractPalette(img, v.colors), d = img.data, w = img.width, sp = v.spread / 100 * 64, o = parseInt(v.order, 10);
      for (let y = 0; y < img.height; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (d[i + 3] === 0) continue;
          const bias = bayerAt(x, y, o) * sp;
          const c = nearestPalette(pal, clamp(d[i] + bias), clamp(d[i + 1] + bias), clamp(d[i + 2] + bias));
          d[i] = c.r; d[i + 1] = c.g; d[i + 2] = c.b;
        }
    }),

  def("ditherFS", "誤差拡散ディザ", "FLOYD–STEINBERG", "pixel", "有機的なディザリング", "wave",
    [R("colors", "色数", 2, 48, 1, 8), R("spread", "強度", 0, 100, 1, 100)],
    (img, v) => {
      const pal = extractPalette(img, v.colors), w = img.width, h = img.height;
      const buf = new Float32Array(w * h * 3);
      for (let i = 0; i < w * h; i++) { buf[i * 3] = img.data[i * 4]; buf[i * 3 + 1] = img.data[i * 4 + 1]; buf[i * 3 + 2] = img.data[i * 4 + 2]; }
      const k = v.spread / 100;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const pi = y * w + x, i = pi << 2;
          if (img.data[i + 3] === 0) continue;
          const c = nearestPalette(pal, clamp(buf[pi * 3]), clamp(buf[pi * 3 + 1]), clamp(buf[pi * 3 + 2]));
          const er = (buf[pi * 3] - c.r) * k, eg = (buf[pi * 3 + 1] - c.g) * k, eb = (buf[pi * 3 + 2] - c.b) * k;
          img.data[i] = c.r; img.data[i + 1] = c.g; img.data[i + 2] = c.b;
          const spreadTo = (dx: number, dy: number, f: number) => {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
            const n = (ny * w + nx) * 3;
            buf[n] += er * f; buf[n + 1] += eg * f; buf[n + 2] += eb * f;
          };
          spreadTo(1, 0, 7 / 16); spreadTo(-1, 1, 3 / 16); spreadTo(0, 1, 5 / 16); spreadTo(1, 1, 1 / 16);
        }
    }),

  def("quantize", "減色", "QUANTIZE", "pixel", "パレット色数を制限", "palette",
    [R("colors", "色数", 2, 64, 1, 12)],
    (img, v) => {
      const pal = extractPalette(img, v.colors), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        const c = nearestPalette(pal, d[i], d[i + 1], d[i + 2]);
        d[i] = c.r; d[i + 1] = c.g; d[i + 2] = c.b;
      }
    }),

  def("outline", "アウトライン", "OUTLINE", "pixel", "シルエットを縁取る", "outline",
    [C("color", "色", "#14100c"), R("thick", "太さ", 1, 4, 1, 1), R("alphaTh", "判定α", 1, 255, 1, 32), S("mode", "位置", "outer", [["outer", "外側"], ["inner", "内側"], ["both", "両側"]])],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, c = hexToRgb(v.color), th = Math.max(1, v.thick | 0);
      const solid = (x: number, y: number) => getAlpha(src, x, y) >= v.alphaTh;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const me = solid(x, y);
          let near = false;
          for (let dy = -th; dy <= th && !near; dy++)
            for (let dx = -th; dx <= th; dx++) {
              if (dx === 0 && dy === 0) continue;
              if (Math.abs(dx) + Math.abs(dy) > th + (th > 1 ? 1 : 0)) continue;
              if (solid(x + dx, y + dy) !== me) { near = true; break; }
            }
          if (!near) continue;
          if (v.mode === "inner" && !me) continue;
          if (v.mode === "outer" && me) continue;
          overPx(img, x, y, c.r, c.g, c.b, me ? 255 : 255);
        }
    }),

  def("bevel", "ベベル / 立体化", "BEVEL", "pixel", "ドット絵風の面取り陰影", "bevel",
    [R("amt", "強さ", 0, 100, 1, 45), R("angle", "光源角度", 0, 360, 1, 315), R("soft", "広がり", 1, 3, 1, 1), T("edge", "輪郭強調", true)],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, d = img.data;
      const a = (v.angle * Math.PI) / 180, dx = Math.cos(a), dy = -Math.sin(a), k = v.amt / 100 * 110, soft = v.soft;
      const lumAt = (x: number, y: number, fb: number) => {
        const nx = Math.round(x + dx * soft * fb), ny = Math.round(y + dy * soft * fb);
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) return -1;
        const i = (ny * w + nx) << 2;
        if (src.data[i + 3] < 16) return -1;
        return luminance(src.data[i], src.data[i + 1], src.data[i + 2]);
      };
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (d[i + 3] === 0) continue;
          const here = luminance(src.data[i], src.data[i + 1], src.data[i + 2]);
          const up = lumAt(x, y, 1), down = lumAt(x, y, -1);
          let delta = 0;
          if (up >= 0) delta += (up - here) * 0.6;
          if (down >= 0) delta += (here - down) * 0.6;
          if (v.edge && (up < 0 || down < 0)) delta += (up < 0 ? 0.5 : 0) - (down < 0 ? 0.5 : 0);
          const add = clamp(delta * k, -255, 255);
          d[i] = clamp(d[i] + add); d[i + 1] = clamp(d[i + 1] + add); d[i + 2] = clamp(d[i + 2] + add);
        }
    }),

  def("dropShadow", "ドロップシャドウ", "DROP SHADOW", "pixel", "後ろに影を落とす", "shadow",
    [C("color", "影色", "#000000"), R("dx", "X オフセット", -16, 16, 1, 2), R("dy", "Y オフセット", -16, 16, 1, 3), R("blur", "ぼかし", 0, 8, 1, 2), R("op", "不透明度", 0, 100, 1, 60)],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, c = hexToRgb(v.color);
      const sh = new ImageData(w, h);
      for (let i = 0; i < src.data.length; i += 4) sh.data[i + 3] = src.data[i + 3];
      const blurred = boxBlur(sh, v.blur, true);
      const out = new ImageData(w, h);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const sx = x - v.dx | 0, sy = y - v.dy | 0;
          if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
          const a = blurred.data[(sy * w + sx) << 2 | 3];
          const i = (y * w + x) << 2;
          out.data[i] = c.r; out.data[i + 1] = c.g; out.data[i + 2] = c.b; out.data[i + 3] = a * (v.op / 100);
        }
      // 影 → 元画像の順で合成
      const d = img.data;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          overPx(out, x, y, src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]);
          d[i] = out.data[i]; d[i + 1] = out.data[i + 1]; d[i + 2] = out.data[i + 2]; d[i + 3] = out.data[i + 3];
        }
    }),

  def("innerShadow", "内側シャドウ", "INNER SHADOW", "pixel", "縁から内側に影", "inset",
    [C("color", "色", "#000000"), R("size", "広がり", 1, 16, 1, 4), R("op", "不透明度", 0, 100, 1, 55), R("angle", "方向", 0, 360, 1, 225)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color);
      const inv = new ImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) inv.data[i + 3] = 255 - img.data[i + 3];
      const a = (v.angle * Math.PI) / 180;
      const ox = Math.round(Math.cos(a) * v.size * 0.4), oy = Math.round(Math.sin(a) * v.size * 0.4);
      const sh = new ImageData(w, h);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const sx = clamp(x - ox, 0, w - 1), sy = clamp(y - oy, 0, h - 1);
          sh.data[(y * w + x) << 2 | 3] = inv.data[(sy * w + sx) << 2 | 3];
        }
      const blurred = boxBlur(sh, v.size, true);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (img.data[i + 3] === 0) continue;
          const k = (blurred.data[i + 3] / 255) * (v.op / 100);
          img.data[i] = clamp(img.data[i] * (1 - k) + c.r * k);
          img.data[i + 1] = clamp(img.data[i + 1] * (1 - k) + c.g * k);
          img.data[i + 2] = clamp(img.data[i + 2] * (1 - k) + c.b * k);
        }
    }),

  def("outerGlow", "外側グロー", "OUTER GLOW", "pixel", "輪郭から光を放つ", "glow",
    [C("color", "色", "#ffd166"), R("radius", "広がり", 1, 16, 1, 5), R("intensity", "強さ", 0, 200, 1, 90), T("over", "上に重ねる", false)],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, c = hexToRgb(v.color);
      const a = new ImageData(w, h);
      for (let i = 0; i < src.data.length; i += 4) a.data[i + 3] = src.data[i + 3];
      const glow = boxBlur(a, v.radius, true);
      const out = new ImageData(w, h);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          const k = clamp01(glow.data[i + 3] / 255 * (v.intensity / 100)) * 255;
          out.data[i] = c.r; out.data[i + 1] = c.g; out.data[i + 2] = c.b; out.data[i + 3] = k;
        }
      const d = img.data;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (!v.over) overPx(out, x, y, src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]);
          else addPx(out, x, y, c.r, c.g, c.b, clamp01(glow.data[i + 3] / 255 * (v.intensity / 100)) * 200), overPx(out, x, y, src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]);
          d[i] = out.data[i]; d[i + 1] = out.data[i + 1]; d[i + 2] = out.data[i + 2]; d[i + 3] = out.data[i + 3];
        }
    }),

  def("innerGlow", "内側グロー", "INNER GLOW", "pixel", "内側から発光させる", "innerglow",
    [C("color", "色", "#fff6c9"), R("size", "広がり", 1, 16, 1, 4), R("intensity", "強さ", 0, 200, 1, 80)],
    (img, v) => {
      const w = img.width, h = img.height, c = hexToRgb(v.color);
      const inv = new ImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) inv.data[i + 3] = 255 - img.data[i + 3];
      const blurred = boxBlur(inv, v.size, true);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (img.data[i + 3] === 0) continue;
          const k = clamp01(blurred.data[i + 3] / 255) * (v.intensity / 100);
          screenPx(img, x, y, c.r, c.g, c.b, k * 255);
        }
    }),

  def("grain", "ノイズ / 粒子", "GRAIN", "pixel", "ランダム粒状感を付与", "noise",
    [R("amt", "強さ", 0, 100, 1, 18), T("mono", "モノクロ", true), R("cell", "粒サイズ", 1, 4, 1, 1), T("alphaOnly", "αのみ", false)],
    (img, v, c) => {
      const d = img.data, w = img.width, k = v.amt / 100 * 130, cell = Math.max(1, v.cell | 0), rnd = mulberry32(c.seed * 977 + 13);
      const cache = new Map<number, number[]>();
      for (let y = 0; y < img.height; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (d[i + 3] === 0) continue;
          const cx = Math.floor(x / cell), cy = Math.floor(y / cell), key = cy * 4096 + cx;
          let n = cache.get(key);
          if (!n) { n = [(rnd() - 0.5) * 2, (rnd() - 0.5) * 2, (rnd() - 0.5) * 2]; cache.set(key, n); }
          if (v.alphaOnly) { d[i + 3] = clamp(d[i + 3] + n[0] * k * 0.5); continue; }
          if (v.mono) { const m = n[0] * k; d[i] = clamp(d[i] + m); d[i + 1] = clamp(d[i + 1] + m); d[i + 2] = clamp(d[i + 2] + m); }
          else { d[i] = clamp(d[i] + n[0] * k); d[i + 1] = clamp(d[i + 1] + n[1] * k); d[i + 2] = clamp(d[i + 2] + n[2] * k); }
        }
    }),

  def("blur", "ぼかし", "BLUR", "pixel", "全体を滑らかに", "blur",
    [R("radius", "半径", 0.2, 8, 0.2, 1)],
    (img, v) => {
      const b = boxBlur(img, v.radius);
      img.data.set(b.data);
    }),

  def("sharpen", "シャープン", "SHARPEN", "pixel", "輪郭を強調して引き締め", "sharp",
    [R("amt", "強さ", 0, 200, 1, 70)],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, k = v.amt / 100;
      const kernel = [-k / 4, -k / 4, 0, -k / 4, 1 + k, -k / 4, 0, -k / 4, 0];
      const at = (x: number, y: number, c: number) => src.data[(clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)) * 4 + c];
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (src.data[i + 3] === 0) continue;
          for (let c = 0; c < 3; c++) {
            let s = 0;
            for (let ky = -1; ky <= 1; ky++)
              for (let kx = -1; kx <= 1; kx++) s += at(x + kx, y + ky, c) * kernel[(ky + 1) * 3 + (kx + 1)];
            img.data[i + c] = clamp(s);
          }
        }
    }),

  def("edgeDetect", "エッジ検出", "EDGE DETECT", "pixel", "輪郭線のみを抽出", "edge",
    [R("th", "しきい値", 0, 120, 1, 26), C("color", "線色", "#ffffff"), S("mode", "出力", "color", [["color", "単色線"], ["keep", "元色を維持"], ["invertLine", "反転線"]])],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, c = hexToRgb(v.color);
      const lum = (x: number, y: number) => {
        const i = (clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)) << 2;
        return luminance(src.data[i], src.data[i + 1], src.data[i + 2]) * (src.data[i + 3] / 255);
      };
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          const gx = -lum(x - 1, y - 1) - 2 * lum(x - 1, y) - lum(x - 1, y + 1) + lum(x + 1, y - 1) + 2 * lum(x + 1, y) + lum(x + 1, y + 1);
          const gy = -lum(x - 1, y - 1) - 2 * lum(x, y - 1) - lum(x + 1, y - 1) + lum(x - 1, y + 1) + 2 * lum(x, y + 1) + lum(x + 1, y + 1);
          const mag = Math.sqrt(gx * gx + gy * gy);
          const on = mag > v.th;
          if (v.mode === "keep") { if (!on) { img.data[i] = src.data[i]; img.data[i + 1] = src.data[i + 1]; img.data[i + 2] = src.data[i + 2]; } }
          else if (v.mode === "invertLine") { img.data[i] = on ? 0 : 255; img.data[i + 1] = on ? 0 : 255; img.data[i + 2] = on ? 0 : 255; }
          else { img.data[i] = on ? c.r : 0; img.data[i + 1] = on ? c.g : 0; img.data[i + 2] = on ? c.b : 0; }
          img.data[i + 3] = src.data[i + 3];
        }
    }),

  def("scanline", "スキャンライン", "SCANLINE", "pixel", "走査線パターン", "scan",
    [R("gap", "間隔", 1, 8, 1, 2), R("op", "濃さ", 0, 100, 1, 35), S("dir", "方向", "h", [["h", "横"], ["v", "縦"]]), T("bright", "明線にする", false)],
    (img, v) => {
      const d = img.data, w = img.width, k = v.op / 100;
      for (let y = 0; y < img.height; y++)
        for (let x = 0; x < w; x++) {
          const p = (v.dir === "h" ? y : x) % Math.max(1, v.gap);
          if (p !== 0) continue;
          const i = (y * w + x) << 2;
          const f = v.bright ? 1 + k * 0.9 : 1 - k * 0.85;
          d[i] = clamp(d[i] * f); d[i + 1] = clamp(d[i + 1] * f); d[i + 2] = clamp(d[i + 2] * f);
        }
    }),

  def("halftone", "ハーフトーン", "HALFTONE", "pixel", "网点模様で階調表現", "halftone",
    [R("cell", "セル", 2, 8, 1, 3), R("contrast", "コントラスト", 0, 100, 1, 50), C("color", "色", "#ffffff"), S("mode", "合成", "multiply", [["multiply", "乗算"], ["screen", "加算"]])],
    (img, v) => {
      const w = img.width, h = img.height, cell = Math.max(2, v.cell | 0), c = hexToRgb(v.color), k = v.contrast / 100;
      for (let by = 0; by < h; by += cell)
        for (let bx = 0; bx < w; bx += cell) {
          let sum = 0, n = 0;
          for (let y = by; y < Math.min(h, by + cell); y++)
            for (let x = bx; x < Math.min(w, bx + cell); x++) { const i = (y * w + x) << 2; if (img.data[i + 3] > 0) { sum += luminance(img.data[i], img.data[i + 1], img.data[i + 2]); n++; } }
          if (!n) continue;
          const luma = sum / n / 255;
          const rad = (cell / 2) * (v.mode === "screen" ? luma : 1 - luma) * (0.4 + k);
          const cx = bx + cell / 2 - 0.5, cy = by + cell / 2 - 0.5;
          for (let y = by; y < Math.min(h, by + cell); y++)
            for (let x = bx; x < Math.min(w, bx + cell); x++) {
              const i = (y * w + x) << 2;
              if (img.data[i + 3] === 0) continue;
              const dd = Math.hypot(x - cx, y - cy);
              const aa = clamp01(rad + 0.4 - dd);
              if (v.mode === "screen") screenPx(img, x, y, c.r, c.g, c.b, aa * 190);
              else { img.data[i] = clamp(img.data[i] * (1 - aa * 0.6)); img.data[i + 1] = clamp(img.data[i + 1] * (1 - aa * 0.6)); img.data[i + 2] = clamp(img.data[i + 2] * (1 - aa * 0.6)); }
            }
        }
    }),

  def("crosshatch", "交差ハッチ", "CROSSHATCH", "pixel", "暗部に斜線陰影", "hatch",
    [R("density", "密度", 2, 10, 1, 4), R("op", "濃さ", 0, 100, 1, 40), C("color", "線色", "#0a0a0a"), T("cross", "交差させる", true)],
    (img, v) => {
      const d = img.data, w = img.width, step = Math.max(2, v.density | 0), c = hexToRgb(v.color), k = v.op / 100;
      for (let y = 0; y < img.height; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (d[i + 3] === 0) continue;
          const l = luminance(d[i], d[i + 1], d[i + 2]) / 255;
          const on1 = ((x + y) % step) === 0;
          const on2 = v.cross && ((x - y + step * 8) % step) === 0;
          const strength = (1 - l) * k * (on1 ? 1 : on2 ? 0.7 : 0);
          if (strength <= 0) continue;
          d[i] = clamp(d[i] + (c.r - d[i]) * strength); d[i + 1] = clamp(d[i + 1] + (c.g - d[i + 1]) * strength); d[i + 2] = clamp(d[i + 2] + (c.b - d[i + 2]) * strength);
        }
    }),

  def("symmetry", "対称化", "SYMMETRY", "pixel", "左右 / 上下 / 四分割ミラー", "mirror",
    [S("mode", "方式", "x", [["x", "左右"], ["y", "上下"], ["quad", "四分割"], ["diag", "対角"]])],
    (img, v) => {
      const src = clone(img), w = img.width, h = img.height, d = img.data;
      const copy = (sx: number, sy: number, tx: number, ty: number) => {
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;
        const a = (sy * w + sx) << 2, b = (ty * w + tx) << 2;
        d[b] = src.data[a]; d[b + 1] = src.data[a + 1]; d[b + 2] = src.data[a + 2]; d[b + 3] = src.data[a + 3];
      };
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (v.mode === "x") { if (x >= w / 2) copy(w - 1 - x, y, x, y); }
          else if (v.mode === "y") { if (y >= h / 2) copy(x, h - 1 - y, x, y); }
          else if (v.mode === "diag") { if (y > x) copy(y, x, x, y); }
          else {
            const sx = x < w / 2 ? x : w - 1 - x, sy = y < h / 2 ? y : h - 1 - y;
            copy(sx, sy, x, y);
          }
        }
    }),
];

export { COLOR_FX, PIXEL_FX };
export const CORE_FX: EffectDef[] = [...COLOR_FX, ...PIXEL_FX];
