import { hexToRgb } from "@/lib/generators/textureBaker";

export const GRADIENT_TYPES = ["vertical", "horizontal", "diagonal", "radial", "diamond", "rim", "bands", "shine", "noise"] as const;
export type GradientType = (typeof GRADIENT_TYPES)[number];

export const GRADIENT_LABELS: Record<GradientType, string> = {
  vertical: "縦",
  horizontal: "横",
  diagonal: "斜め",
  radial: "放射",
  diamond: "ダイヤ",
  rim: "縁光 (リム)",
  bands: "縞 (バンド)",
  shine: "光沢スジ",
  noise: "ノイズ",
};

export const BLEND_MODES = ["normal", "multiply", "screen", "overlay", "add", "color"] as const;
export type BlendMode = (typeof BLEND_MODES)[number];

export const BLEND_LABELS: Record<BlendMode, string> = {
  normal: "通常",
  multiply: "乗算",
  screen: "スクリーン",
  overlay: "オーバーレイ",
  add: "加算 (発光)",
  color: "カラー (色相置換)",
};

export interface GradientConfig {
  type: GradientType;
  from: string;
  to: string;
  mid: string | null;
  opacity: number; // 0 - 1
  steps: number; // 0 = smooth, 2 - 16 = posterized pixel-art bands
  dither: boolean; // ordered Bayer 4x4
  blend: BlendMode;
  reverse: boolean;
  preserveAlpha: boolean;
  frequency: number; // bands / noise scale
}

export const DEFAULT_GRADIENT: GradientConfig = {
  type: "vertical",
  from: "#ffffff",
  to: "#202030",
  mid: null,
  opacity: 0.6,
  steps: 5,
  dither: true,
  blend: "overlay",
  reverse: false,
  preserveAlpha: true,
  frequency: 3,
};

export const GRADIENT_PRESETS: Array<{ id: string; label: string; config: Partial<GradientConfig> }> = [
  { id: "metal", label: "金属光沢", config: { type: "shine", to: "#ffffff", blend: "screen", opacity: 0.75, steps: 0, dither: false } },
  { id: "fire", label: "炎", config: { type: "vertical", from: "#fff176", mid: "#ff6d00", to: "#b71c1c", blend: "overlay", opacity: 0.8, steps: 5, dither: true, reverse: true } },
  { id: "ice", label: "氷", config: { type: "diagonal", from: "#ffffff", mid: null, to: "#0277bd", blend: "color", opacity: 0.6, steps: 4, dither: true } },
  { id: "blood", label: "血", config: { type: "vertical", from: "#ff1744", to: "#2b0000", blend: "multiply", opacity: 0.75, steps: 6, dither: true } },
  { id: "void", label: "虚空", config: { type: "radial", from: "#e040fb", to: "#12001f", blend: "overlay", opacity: 0.8, steps: 5, dither: true } },
  { id: "gold", label: "黄金", config: { type: "vertical", from: "#fff59d", mid: "#ffb300", to: "#6d4c00", blend: "color", opacity: 0.7, steps: 4, dither: true } },
  { id: "rust", label: "錆", config: { type: "noise", from: "#a1887f", to: "#3e2723", blend: "multiply", opacity: 0.55, steps: 3, dither: false, frequency: 4 } },
  { id: "rim_glow", label: "縁発光", config: { type: "rim", to: "#7df9ff", blend: "add", opacity: 0.85, steps: 0, dither: false } },
  { id: "toxic", label: "毒", config: { type: "bands", from: "#c6ff00", to: "#1b5e20", blend: "overlay", opacity: 0.6, steps: 4, dither: true, frequency: 4 } },
  { id: "aurora", label: "オーロラ", config: { type: "horizontal", from: "#00e5ff", mid: "#76ff03", to: "#d500f9", blend: "color", opacity: 0.65, steps: 0, dither: false } },
];

export interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function hashNoise(x: number, y: number, frequency: number): number {
  const cell = Math.max(1, Math.round(4 / Math.max(0.5, frequency)));
  const cx = Math.floor(x / cell);
  const cy = Math.floor(y / cell);
  const n = Math.sin(cx * 127.1 + cy * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function blendChannel(base: number, color: number, mode: BlendMode): number {
  switch (mode) {
    case "multiply":
      return base * color;
    case "screen":
      return 1 - (1 - base) * (1 - color);
    case "overlay":
      return base < 0.5 ? 2 * base * color : 1 - 2 * (1 - base) * (1 - color);
    case "add":
      return Math.min(1, base + color);
    default:
      return color;
  }
}

/** Applies a pixel-art-aware gradient (optional posterize + ordered dither) to one or more atlas rectangles. */
export function applyGradient(context: CanvasRenderingContext2D, rects: PixelRect[], config: GradientConfig): number {
  const canvas = context.canvas;
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const from = hexToRgb(config.from).map((value) => value / 255);
  const to = hexToRgb(config.to).map((value) => value / 255);
  const mid = config.mid ? hexToRgb(config.mid).map((value) => value / 255) : null;
  const maskMode = config.type === "rim" || config.type === "shine";
  let touched = 0;

  rects.forEach((rect) => {
    const x0 = Math.max(0, Math.floor(rect.x));
    const y0 = Math.max(0, Math.floor(rect.y));
    const x1 = Math.min(canvas.width, Math.ceil(rect.x + rect.w));
    const y1 = Math.min(canvas.height, Math.ceil(rect.y + rect.h));
    const w = Math.max(1, x1 - x0);
    const h = Math.max(1, y1 - y0);

    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const index = (y * canvas.width + x) * 4;
        if (config.preserveAlpha && data[index + 3] === 0) continue;
        const u = (x - x0 + 0.5) / w;
        const v = (y - y0 + 0.5) / h;

        let t: number;
        switch (config.type) {
          case "horizontal":
            t = u;
            break;
          case "diagonal":
            t = (u + v) / 2;
            break;
          case "radial":
            t = Math.min(1, Math.hypot(u - 0.5, v - 0.5) / 0.7071);
            break;
          case "diamond":
            t = Math.min(1, Math.abs(u - 0.5) + Math.abs(v - 0.5));
            break;
          case "rim":
            t = 1 - Math.min(1, Math.min(u, 1 - u, v, 1 - v) * 4);
            break;
          case "bands":
            t = 0.5 + 0.5 * Math.sin((u + v) * Math.PI * 2 * config.frequency);
            break;
          case "shine":
            t = Math.max(0, 1 - Math.abs(u - v * 0.6 - 0.35) * 6);
            break;
          case "noise":
            t = hashNoise(x, y, config.frequency);
            break;
          default:
            t = v;
        }
        if (config.reverse) t = 1 - t;
        if (config.dither) t += ((BAYER4[(y % 4) * 4 + (x % 4)] + 0.5) / 16 - 0.5) / (config.steps > 1 ? config.steps : 6);
        t = Math.min(1, Math.max(0, t));
        if (config.steps > 1) t = Math.round(t * (config.steps - 1)) / (config.steps - 1);

        let color: number[];
        let alpha = config.opacity;
        if (maskMode) {
          color = to;
          alpha *= t;
        } else if (mid) {
          color = t < 0.5 ? from.map((value, channel) => lerp(value, mid[channel], t * 2)) : mid.map((value, channel) => lerp(value, to[channel], (t - 0.5) * 2));
        } else {
          color = from.map((value, channel) => lerp(value, to[channel], t));
        }

        const base = [data[index] / 255, data[index + 1] / 255, data[index + 2] / 255];
        let blended: number[];
        if (config.blend === "color") {
          const luminance = base[0] * 0.299 + base[1] * 0.587 + base[2] * 0.114;
          const colorLuminance = Math.max(0.05, color[0] * 0.299 + color[1] * 0.587 + color[2] * 0.114);
          blended = color.map((value) => Math.min(1, value * (luminance / colorLuminance)));
        } else {
          blended = base.map((value, channel) => blendChannel(value, color[channel], config.blend));
        }

        for (let channel = 0; channel < 3; channel += 1) {
          data[index + channel] = Math.round(Math.min(1, Math.max(0, lerp(base[channel], blended[channel], alpha))) * 255);
        }
        if (!config.preserveAlpha) data[index + 3] = 255;
        touched += 1;
      }
    }
  });

  context.putImageData(image, 0, 0);
  return touched;
}
