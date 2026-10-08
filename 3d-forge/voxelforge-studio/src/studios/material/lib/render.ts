import { makePalette, hexToHsl, hslToHex, hexToRgb, rgbToHex, type Palette, type PaletteOptions } from './color';
import type { Shape } from './shapes';
import type { Fx } from './presets';

export interface MaterialSettings extends PaletteOptions, Fx {
  name: string;
  seed: number;
  noiseAmount: number; // 0 - 1
  sparkle: boolean;
}

export type Edits = Record<string, Record<number, string>>;

export type Pixels = (string | null)[];

const STONE = ['#6e6e6e', '#7f7f7f', '#8a8a8a', '#777777', '#929292'];
const DEEPSLATE = ['#3b3b40', '#48484d', '#525257', '#414146', '#5a5a60'];

export function rand(x: number, y: number, seed: number): number {
  let h = (x * 73856093) ^ (y * 19349663) ^ (seed * 83492791);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function mixHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

/** 明度(%)を加算 */
function adjustL(hex: string, dl: number): string {
  if (Math.abs(dl) < 0.01) return hex;
  const [h, s, l] = hexToHsl(hex);
  return hslToHex([h, s, Math.max(0, Math.min(100, l + dl))]);
}

function withAlpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

function roleColor(ch: string, p: Palette, x: number, y: number, s: MaterialSettings, shape: Shape): string | null {
  switch (ch) {
    case '.':
      return null;
    case '#':
      return p.outline;
    case 'd':
      return p.deep;
    case 's':
      return p.shadow;
    case 'b':
      return p.base;
    case 'l':
      return p.light;
    case 'h':
      return p.highlight;
    case 'w':
      return s.sparkle ? p.white : p.highlight;
    case 'g':
      return p.glow;
    case '2':
      return p.sec;
    case '3':
      return p.secLight;
    case '4':
      return p.secShadow;
    case 'n': {
      const r = rand(x, y, s.seed);
      const a = s.noiseAmount;
      // amount が小さいほどベースに寄る
      if (r < 0.2 * a) return p.shadow;
      if (r < 0.2 * a + 0.1 * a) return p.deep;
      if (r > 1 - 0.22 * a) return p.light;
      if (r > 1 - 0.3 * a && r <= 1 - 0.22 * a) return p.highlight;
      return p.base;
    }
    case 'r': {
      const pal = shape.rock === 'deepslate' ? DEEPSLATE : STONE;
      const r = rand(x, y, s.seed + 17);
      const r2 = rand(x + 3, y + 5, s.seed + 29);
      if (r < 0.12) return pal[0];
      if (r < 0.55) return pal[1];
      if (r < 0.8) return pal[3];
      if (r2 < 0.5) return pal[2];
      return pal[4];
    }
    default:
      return null;
  }
}

/**
 * 1形状分のピクセル色を生成する。
 * 1. 役割文字 → パレット色
 * 2. 質感エフェクト (ざらつき・ブラシ目・ファセット・パティーナ)
 * 3. 発光ハロ (発光ピクセル周囲の透明ピクセルに淡い光)
 */
export function renderPixels(shape: Shape, s: MaterialSettings, edits?: Edits): Pixels {
  const p = makePalette(s);
  const ed = edits?.[shape.id];
  const out: Pixels = new Array(256).fill(null);
  const chars: string[] = new Array(256);

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const i = y * 16 + x;
      chars[i] = ed && ed[i] !== undefined ? ed[i] : shape.rows[y][x];
      out[i] = roleColor(chars[i], p, x, y, s, shape);
    }
  }

  const fx = s.grain > 0 || s.brushed > 0 || s.facet > 0 || s.patina > 0;
  if (fx) {
    for (let i = 0; i < 256; i++) {
      const c = out[i];
      const ch = chars[i];
      if (!c || ch === '#' || ch === 'w' || ch === 'g') continue;
      const x = i % 16;
      const y = (i / 16) | 0;
      let dl = 0;
      if (s.grain > 0) dl += (rand(x, y, s.seed + 101) - 0.5) * s.grain * 16;
      if (s.brushed > 0) {
        // 横方向のブラシ目 (行ごとの明暗 + わずかな縦の揺らぎ)
        dl += (rand(0, y, s.seed + 7) - 0.5) * s.brushed * 14;
        dl += (rand(x, 0, s.seed + 9) - 0.5) * s.brushed * 4;
      }
      if (s.facet > 0) {
        const band = ((x + y) >> 2) & 1 ? 1 : -1;
        dl += band * s.facet * 7;
      }
      let col = adjustL(c, dl);
      if (s.patina > 0 && 'bsdl'.includes(ch) && rand(x, y, s.seed + 55) < s.patina * 0.5) {
        col = mixHex(col, p.sec, 0.55);
      }
      out[i] = col;
    }
  }

  if (s.glow > 0) {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const i = y * 16 + x;
        if (chars[i] !== '.') continue;
        let near = false;
        for (let dy = -1; dy <= 1 && !near; dy++) {
          for (let dx = -1; dx <= 1 && !near; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx > 15 || ny > 15) continue;
            if (chars[ny * 16 + nx] === 'g') near = true;
          }
        }
        if (near) out[i] = withAlpha(p.glow, 0.12 + 0.28 * s.glow);
      }
    }
  }
  return out;
}

export function drawPixels(canvas: HTMLCanvasElement, pixels: Pixels, scale: number) {
  canvas.width = 16 * scale;
  canvas.height = 16 * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < 256; i++) {
    const c = pixels[i];
    if (!c) continue;
    const x = i % 16;
    const y = (i / 16) | 0;
    ctx.fillStyle = c;
    ctx.fillRect(x * scale, y * scale, scale, scale);
  }
}

export function pixelsToBlob(pixels: Pixels, scale: number): Promise<Blob> {
  const c = document.createElement('canvas');
  drawPixels(c, pixels, scale);
  return new Promise((resolve, reject) => {
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

export function spritesheetBlob(list: Pixels[], scale: number, columns: number): Promise<Blob> {
  const cols = Math.max(1, Math.min(columns, list.length));
  const rows = Math.ceil(list.length / cols);
  const c = document.createElement('canvas');
  c.width = 16 * scale * cols;
  c.height = 16 * scale * rows;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  list.forEach((px, idx) => {
    const ox = (idx % cols) * 16 * scale;
    const oy = Math.floor(idx / cols) * 16 * scale;
    for (let i = 0; i < 256; i++) {
      const col = px[i];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(ox + (i % 16) * scale, oy + ((i / 16) | 0) * scale, scale, scale);
    }
  });
  return new Promise((resolve, reject) => {
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeName(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return s || 'material';
}

export function fileNameFor(pattern: string, name: string): string {
  return pattern.replace('{name}', safeName(name));
}
