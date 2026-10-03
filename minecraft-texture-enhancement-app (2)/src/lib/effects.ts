import {
  Tex, createTex, cloneTex, clamp, lum, fract, mod, rng, hash2, fbm,
  hexToRgb, rgbToHsl, hslToRgb,
} from './tex';
import { PARTS, PART_MAP, stampPart, BlendMode } from './parts';

export type ParamDef =
  | { key: string; label: string; type: 'range'; min: number; max: number; step?: number; default: number }
  | { key: string; label: string; type: 'color'; default: string }
  | { key: string; label: string; type: 'select'; options: [string, string][]; default: string }
  | { key: string; label: string; type: 'bool'; default: boolean };

export type Params = Record<string, number | string | boolean>;
export interface Ctx { seed: number; t: number }
export type CategoryId = 'color' | 'texture' | 'decor' | 'anim' | 'parts' | 'transform';

export const CATEGORIES: { id: CategoryId; name: string; icon: string }[] = [
  { id: 'color', name: '色調', icon: '🎨' },
  { id: 'texture', name: '質感', icon: '🪨' },
  { id: 'decor', name: '装飾', icon: '✨' },
  { id: 'anim', name: 'アニメ', icon: '🎞️' },
  { id: 'parts', name: 'パーツ', icon: '🧩' },
  { id: 'transform', name: '変形/HD', icon: '🔧' },
];

export interface EffectDef {
  id: string;
  name: string;
  category: CategoryId;
  icon: string;
  desc: string;
  params: ParamDef[];
  animated?: (p: any) => boolean;
  isNew?: boolean;
  apply: (src: Tex, p: any, ctx: Ctx) => Tex;
}

/* ---------------- helpers ---------------- */
type RGBA = [number, number, number, number?];
function map(src: Tex, fn: (r: number, g: number, b: number, a: number, x: number, y: number) => RGBA | void, skipClear = true): Tex {
  const out = cloneTex(src);
  const d = out.d;
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const i = (y * src.w + x) * 4;
      if (skipClear && d[i + 3] === 0) continue;
      const r = fn(d[i], d[i + 1], d[i + 2], d[i + 3], x, y);
      if (r) {
        d[i] = r[0];
        d[i + 1] = r[1];
        d[i + 2] = r[2];
        if (r[3] !== undefined) d[i + 3] = r[3];
      }
    }
  return out;
}
const A = (t: Tex, x: number, y: number) => (x < 0 || y < 0 || x >= t.w || y >= t.h ? 0 : t.d[(y * t.w + x) * 4 + 3]);
const I = (t: Tex, x: number, y: number) => (y * t.w + x) * 4;
const IW = (t: Tex, x: number, y: number) => (mod(y, t.h) * t.w + mod(x, t.w)) * 4;
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
function blendAt(t: Tex, x: number, y: number, c: [number, number, number], k: number, wrap = false) {
  if (!wrap && (x < 0 || y < 0 || x >= t.w || y >= t.h)) return;
  const i = wrap ? IW(t, x, y) : I(t, x, y);
  const d = t.d;
  const a = d[i + 3] / 255;
  if (a === 0) {
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = k * 255;
    return;
  }
  d[i] = mix(d[i], c[0], k);
  d[i + 1] = mix(d[i + 1], c[1], k);
  d[i + 2] = mix(d[i + 2], c[2], k);
  d[i + 3] = Math.max(d[i + 3], k * 255);
}
const lighten = (v: number, k: number) => v + (255 - v) * k;
const darken = (v: number, k: number) => v * (1 - k);
const isOpaqueTex = (t: Tex) => {
  for (let i = 3; i < t.d.length; i += 4) if (t.d[i] < 128) return false;
  return true;
};

/** chamfer distance to nearest pixel matching predicate */
function distanceField(t: Tex, target: (x: number, y: number) => boolean, boundsAsTarget = false): Float32Array {
  const W = t.w + 2, H = t.h + 2;
  const D = new Float32Array(W * H).fill(1e9);
  for (let y = -1; y <= t.h; y++)
    for (let x = -1; x <= t.w; x++) {
      const inb = x >= 0 && y >= 0 && x < t.w && y < t.h;
      if (inb ? target(x, y) : boundsAsTarget) D[(y + 1) * W + x + 1] = 0;
    }
  const s2 = Math.SQRT2;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let v = D[i];
      if (x > 0) v = Math.min(v, D[i - 1] + 1);
      if (y > 0) {
        v = Math.min(v, D[i - W] + 1);
        if (x > 0) v = Math.min(v, D[i - W - 1] + s2);
        if (x < W - 1) v = Math.min(v, D[i - W + 1] + s2);
      }
      D[i] = v;
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      let v = D[i];
      if (x < W - 1) v = Math.min(v, D[i + 1] + 1);
      if (y < H - 1) {
        v = Math.min(v, D[i + W] + 1);
        if (x < W - 1) v = Math.min(v, D[i + W + 1] + s2);
        if (x > 0) v = Math.min(v, D[i + W - 1] + s2);
      }
      D[i] = v;
    }
  const out = new Float32Array(t.w * t.h);
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) out[y * t.w + x] = D[(y + 1) * W + x + 1];
  return out;
}

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

export const PALETTES: Record<string, { name: string; colors: string[] }> = {
  gameboy: { name: 'ゲームボーイ', colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
  pico8: { name: 'PICO-8', colors: ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa'] },
  nes: { name: 'ファミコン風', colors: ['#000000', '#fcfcfc', '#bcbcbc', '#7c7c7c', '#a80020', '#f83800', '#fca044', '#f8b800', '#00a800', '#58d854', '#0058f8', '#3cbcfc', '#6844fc', '#d800cc', '#f878f8', '#503000'] },
  gold: { name: '黄金', colors: ['#3a2200', '#6b4200', '#a56d00', '#d9a400', '#fcd94a', '#fff4b0'] },
  diamond: { name: 'ダイヤ', colors: ['#0b2b35', '#146b7a', '#2cb3b8', '#4fe3d6', '#a8fff4', '#e8fffd'] },
  nether: { name: 'ネザー', colors: ['#1a0505', '#4a0e0e', '#7a1b16', '#b3321f', '#e3642b', '#ffb347'] },
  end: { name: 'エンド', colors: ['#0d0717', '#2a1640', '#51306e', '#8a5fb0', '#d7cf8e', '#f5f0c4'] },
  pastel: { name: 'パステル', colors: ['#5b5774', '#f7a8b8', '#fcd5ce', '#b5ead7', '#c7ceea', '#ffdac1', '#e2f0cb', '#ffffff'] },
  grass: { name: '草原', colors: ['#1f3d12', '#2f5c1a', '#467a27', '#5f9e35', '#86c34a', '#6b4a2b', '#8b633a', '#a88157'] },
};

function nearestColor(r: number, g: number, b: number, pal: number[][]) {
  let best = pal[0], bd = 1e12;
  for (const c of pal) {
    const dr = r - c[0], dg = g - c[1], db = b - c[2];
    const dd = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
    if (dd < bd) { bd = dd; best = c; }
  }
  return best;
}

function kmeans(t: Tex, k: number, seed: number): number[][] {
  const px: number[][] = [];
  for (let i = 0; i < t.d.length; i += 4) if (t.d[i + 3] > 0) px.push([t.d[i], t.d[i + 1], t.d[i + 2]]);
  if (!px.length) return [[0, 0, 0]];
  const R = rng(seed);
  let cent = Array.from({ length: k }, () => [...px[Math.floor(R() * px.length)]]);
  for (let it = 0; it < 8; it++) {
    const sum = cent.map(() => [0, 0, 0, 0]);
    for (const p of px) {
      let bi = 0, bd = 1e12;
      cent.forEach((c, j) => {
        const dd = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (dd < bd) { bd = dd; bi = j; }
      });
      sum[bi][0] += p[0]; sum[bi][1] += p[1]; sum[bi][2] += p[2]; sum[bi][3]++;
    }
    cent = cent.map((c, j) => (sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]] : c));
  }
  return cent;
}

/* ---------- pixel glyphs ---------- */
export const GLYPHS: Record<string, { name: string; rows: string[] }> = {
  star: { name: '星', rows: ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##'] },
  heart: { name: 'ハート', rows: ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...'] },
  diamond: { name: 'ダイヤ', rows: ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'] },
  skull: { name: 'ドクロ', rows: ['.#####.', '#######', '#..#..#', '#######', '.##.##.', '.#####.', '.#.#.#.'] },
  cross: { name: '十字', rows: ['..###..', '..###..', '#######', '#######', '#######', '..###..', '..###..'] },
  sword: { name: '剣', rows: ['.....##', '....###', '...###.', '#.###..', '.###...', '.##....', '#..#...'] },
  creeper: { name: 'クリーパー', rows: ['##..##', '##..##', '..##..', '.####.', '.####.', '.#..#.'] },
  moon: { name: '月', rows: ['..###..', '.##....', '##.....', '##.....', '##.....', '.##....', '..###..'] },
  shield: { name: '盾', rows: ['#######', '#.....#', '#..#..#', '#.###.#', '#..#..#', '.#...#.', '..###..'] },
  crown: { name: '王冠', rows: ['#..#..#', '##.#.##', '#######', '#.#.#.#', '#######'] },
};

function runeGlyph(seed: number, w = 3, h = 4): boolean[][] {
  const R = rng(seed);
  const g: boolean[][] = [];
  for (let y = 0; y < h; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < w; x++) row.push(R() < 0.55);
    g.push(row);
  }
  g[0][Math.floor(R() * w)] = true;
  g[h - 1][Math.floor(R() * w)] = true;
  return g;
}

function scale2x(src: Tex): Tex {
  const out = createTex(src.w * 2, src.h * 2);
  const W = src.w, H = src.h;
  const get = (x: number, y: number) => I(src, clamp(x, 0, W - 1), clamp(y, 0, H - 1));
  const eq = (a: number, b: number) =>
    src.d[a] === src.d[b] && src.d[a + 1] === src.d[b + 1] && src.d[a + 2] === src.d[b + 2] && src.d[a + 3] === src.d[b + 3];
  const put = (x: number, y: number, s: number) => {
    const o = I(out, x, y);
    out.d[o] = src.d[s]; out.d[o + 1] = src.d[s + 1]; out.d[o + 2] = src.d[s + 2]; out.d[o + 3] = src.d[s + 3];
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const P = get(x, y), Au = get(x, y - 1), B = get(x + 1, y), C = get(x - 1, y), D = get(x, y + 1);
      let e0 = P, e1 = P, e2 = P, e3 = P;
      if (!eq(C, B) && !eq(Au, D)) {
        if (eq(Au, C)) e0 = Au;
        if (eq(Au, B)) e1 = B;
        if (eq(D, C)) e2 = C;
        if (eq(D, B)) e3 = B;
      }
      put(x * 2, y * 2, e0); put(x * 2 + 1, y * 2, e1); put(x * 2, y * 2 + 1, e2); put(x * 2 + 1, y * 2 + 1, e3);
    }
  return out;
}
function nearestScale(src: Tex, k: number): Tex {
  const out = createTex(src.w * k, src.h * k);
  for (let y = 0; y < out.h; y++)
    for (let x = 0; x < out.w; x++) {
      const s = I(src, Math.floor(x / k), Math.floor(y / k)), o = I(out, x, y);
      out.d[o] = src.d[s]; out.d[o + 1] = src.d[s + 1]; out.d[o + 2] = src.d[s + 2]; out.d[o + 3] = src.d[s + 3];
    }
  return out;
}

const WRAP_OPTS: [string, string][] = [['auto', '自動'], ['wrap', 'タイル(ブロック)'], ['clip', '切り抜き(アイテム)']];
const useWrap = (src: Tex, v: string) => (v === 'auto' ? isOpaqueTex(src) : v === 'wrap');

/* ======================= EFFECTS ======================= */
export const EFFECTS: EffectDef[] = [
  /* ---------------- COLOR ---------------- */
  {
    id: 'adjust', name: '色調補正', category: 'color', icon: '🎚️', desc: '明るさ・コントラスト・彩度・色相・ガンマ',
    params: [
      { key: 'brightness', label: '明るさ', type: 'range', min: -100, max: 100, default: 0 },
      { key: 'contrast', label: 'コントラスト', type: 'range', min: -100, max: 100, default: 0 },
      { key: 'saturation', label: '彩度', type: 'range', min: -100, max: 100, default: 0 },
      { key: 'hue', label: '色相', type: 'range', min: -180, max: 180, default: 0 },
      { key: 'gamma', label: 'ガンマ', type: 'range', min: 0.2, max: 3, step: 0.05, default: 1 },
    ],
    apply(src, p) {
      const br = p.brightness * 1.5, c = (p.contrast + 100) / 100, cf = c * c, sat = (p.saturation + 100) / 100;
      return map(src, (r, g, b) => {
        if (p.hue) { const [h, s, l] = rgbToHsl(r, g, b); [r, g, b] = hslToRgb(h + p.hue, s, l); }
        const lu = lum(r, g, b);
        r = lu + (r - lu) * sat; g = lu + (g - lu) * sat; b = lu + (b - lu) * sat;
        const f = (v: number) => {
          v = (v - 128) * cf + 128 + br;
          return 255 * Math.pow(clamp(v) / 255, 1 / p.gamma);
        };
        return [f(r), f(g), f(b)];
      });
    },
  },
  {
    id: 'tint', name: 'カラーティント', category: 'color', icon: '🖌️', desc: '指定色で着色（乗算/スクリーン/オーバーレイ/カラー）',
    params: [
      { key: 'color', label: '色', type: 'color', default: '#ffb347' },
      { key: 'mode', label: 'モード', type: 'select', options: [['color', 'カラー'], ['multiply', '乗算'], ['screen', 'スクリーン'], ['overlay', 'オーバーレイ'], ['add', '加算']], default: 'color' },
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 60 },
    ],
    apply(src, p) {
      const c = hexToRgb(p.color), k = p.amount / 100;
      const [ch, cs] = rgbToHsl(...c);
      return map(src, (r, g, b) => {
        let o: number[];
        const px = [r, g, b];
        switch (p.mode) {
          case 'multiply': o = px.map((v, i) => (v * c[i]) / 255); break;
          case 'screen': o = px.map((v, i) => 255 - ((255 - v) * (255 - c[i])) / 255); break;
          case 'overlay': o = px.map((v, i) => (v < 128 ? (2 * v * c[i]) / 255 : 255 - (2 * (255 - v) * (255 - c[i])) / 255)); break;
          case 'add': o = px.map((v, i) => v + c[i] * 0.6); break;
          default: { const [, , l] = rgbToHsl(r, g, b); o = hslToRgb(ch, cs, l); }
        }
        return [mix(r, o[0], k), mix(g, o[1], k), mix(b, o[2], k)];
      });
    },
  },
  {
    id: 'gradmap', name: 'グラデーションマップ', category: 'color', icon: '🌈', desc: '明度を3色グラデーションに置き換え（素材変換に最適）',
    params: [
      { key: 'c1', label: '暗部', type: 'color', default: '#1b1030' },
      { key: 'c2', label: '中間', type: 'color', default: '#7a3fb0' },
      { key: 'c3', label: '明部', type: 'color', default: '#f5d0ff' },
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 100 },
      { key: 'normalize', label: '明度を正規化', type: 'bool', default: true },
    ],
    apply(src, p) {
      const c1 = hexToRgb(p.c1), c2 = hexToRgb(p.c2), c3 = hexToRgb(p.c3), k = p.amount / 100;
      let lo = 255, hi = 0;
      if (p.normalize) for (let i = 0; i < src.d.length; i += 4) if (src.d[i + 3]) { const l = lum(src.d[i], src.d[i + 1], src.d[i + 2]); lo = Math.min(lo, l); hi = Math.max(hi, l); }
      if (!p.normalize || hi - lo < 8) { lo = 0; hi = 255; }
      return map(src, (r, g, b) => {
        const t = clamp((lum(r, g, b) - lo) / (hi - lo), 0, 1);
        const o = t < 0.5 ? c1.map((v, i) => mix(v, c2[i], t * 2)) : c2.map((v, i) => mix(v, c3[i], (t - 0.5) * 2));
        return [mix(r, o[0], k), mix(g, o[1], k), mix(b, o[2], k)];
      });
    },
  },
  {
    id: 'gradient', name: 'グラデーション重ね', category: 'color', icon: '🌅', desc: '2色のグラデーションを重ねて光の方向感を演出',
    params: [
      { key: 'c1', label: '開始色', type: 'color', default: '#fff2c0' },
      { key: 'c2', label: '終了色', type: 'color', default: '#302050' },
      { key: 'dir', label: '方向', type: 'select', options: [['v', '縦'], ['h', '横'], ['d', '斜め'], ['r', '放射']], default: 'v' },
      { key: 'mode', label: '合成', type: 'select', options: [['overlay', 'オーバーレイ'], ['multiply', '乗算'], ['screen', 'スクリーン'], ['normal', '通常']], default: 'overlay' },
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 50 },
    ],
    apply(src, p) {
      const c1 = hexToRgb(p.c1), c2 = hexToRgb(p.c2), k = p.amount / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const u = (x + 0.5) / src.w, v = (y + 0.5) / src.h;
        const t = p.dir === 'h' ? u : p.dir === 'd' ? (u + v) / 2 : p.dir === 'r' ? Math.min(1, Math.hypot(u - 0.5, v - 0.5) * 1.6) : v;
        const c = c1.map((cc, i) => mix(cc, c2[i], t));
        const o = [r, g, b].map((pv, i) => {
          const cv = c[i];
          if (p.mode === 'multiply') return (pv * cv) / 255;
          if (p.mode === 'screen') return 255 - ((255 - pv) * (255 - cv)) / 255;
          if (p.mode === 'normal') return cv;
          return pv < 128 ? (2 * pv * cv) / 255 : 255 - (2 * (255 - pv) * (255 - cv)) / 255;
        });
        return [mix(r, o[0], k), mix(g, o[1], k), mix(b, o[2], k)];
      });
    },
  },
  {
    id: 'posterize', name: 'ポスタライズ', category: 'color', icon: '🧱', desc: '階調を減らしてドット絵らしく',
    params: [{ key: 'levels', label: '階調数', type: 'range', min: 2, max: 16, default: 5 }],
    apply(src, p) {
      const s = 255 / (p.levels - 1);
      return map(src, (r, g, b) => [Math.round(r / s) * s, Math.round(g / s) * s, Math.round(b / s) * s]);
    },
  },
  {
    id: 'palette', name: 'パレット制限', category: 'color', icon: '🎴', desc: 'パレットに色を制限（自動抽出/レトロ/素材系）',
    params: [
      { key: 'palette', label: 'パレット', type: 'select', options: [['auto', '自動抽出'], ...Object.entries(PALETTES).map(([k, v]) => [k, v.name] as [string, string])], default: 'auto' },
      { key: 'count', label: '色数(自動)', type: 'range', min: 2, max: 24, default: 8 },
      { key: 'dither', label: 'ディザ', type: 'bool', default: false },
      { key: 'remap', label: '明度順で再配置', type: 'bool', default: true },
    ],
    apply(src, p, ctx) {
      let pal: number[][];
      if (p.palette === 'auto') pal = kmeans(src, p.count, ctx.seed);
      else pal = PALETTES[p.palette].colors.map(hexToRgb);
      const remap = p.palette !== 'auto' && p.remap;
      const sorted = [...pal].sort((a, b) => lum(a[0], a[1], a[2]) - lum(b[0], b[1], b[2]));
      let lo = 255, hi = 0;
      if (remap) for (let i = 0; i < src.d.length; i += 4) if (src.d[i + 3]) { const l = lum(src.d[i], src.d[i + 1], src.d[i + 2]); lo = Math.min(lo, l); hi = Math.max(hi, l); }
      return map(src, (r, g, b, _a, x, y) => {
        const dt = p.dither ? (BAYER4[(y % 4) * 4 + (x % 4)] - 0.5) : 0;
        if (remap) {
          const t = clamp((lum(r, g, b) - lo) / Math.max(1, hi - lo) + dt / sorted.length, 0, 0.9999);
          const c = sorted[Math.floor(t * sorted.length)];
          return [c[0], c[1], c[2]];
        }
        const off = dt * 48;
        const c = nearestColor(r + off, g + off, b + off, pal);
        return [c[0], c[1], c[2]];
      });
    },
  },
  {
    id: 'replace', name: '色置換', category: 'color', icon: '🔁', desc: '特定の色を別の色へ（陰影を保持）',
    params: [
      { key: 'from', label: '対象色', type: 'color', default: '#7f7f7f' },
      { key: 'to', label: '置換色', type: 'color', default: '#3fa7ff' },
      { key: 'tol', label: '許容範囲', type: 'range', min: 0, max: 200, default: 60 },
      { key: 'shade', label: '陰影保持', type: 'bool', default: true },
    ],
    apply(src, p) {
      const f = hexToRgb(p.from), t = hexToRgb(p.to);
      const lf = lum(...f);
      const [th, ts] = rgbToHsl(...t);
      const [, , tl] = rgbToHsl(...t);
      return map(src, (r, g, b) => {
        const dd = Math.sqrt((r - f[0]) ** 2 + (g - f[1]) ** 2 + (b - f[2]) ** 2);
        if (dd > p.tol) return;
        const k = p.tol ? 1 - Math.pow(dd / (p.tol + 1), 3) : 1;
        let o: number[];
        if (p.shade) {
          const dl = (lum(r, g, b) - lf) / 255;
          o = hslToRgb(th, ts, clamp(tl + dl, 0, 1));
        } else o = t;
        return [mix(r, o[0], k), mix(g, o[1], k), mix(b, o[2], k)];
      });
    },
  },
  {
    id: 'filter', name: 'フィルター', category: 'color', icon: '📷', desc: 'モノクロ・セピア・反転・暖色/寒色・ナイト・サーマル',
    params: [
      { key: 'mode', label: '種類', type: 'select', options: [['gray', 'モノクロ'], ['sepia', 'セピア'], ['invert', '反転'], ['warm', '暖色'], ['cool', '寒色'], ['vintage', 'ビンテージ'], ['night', 'ナイトビジョン'], ['thermal', 'サーマル'], ['ghost', '幽霊']], default: 'sepia' },
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 100 },
    ],
    apply(src, p) {
      const k = p.amount / 100;
      return map(src, (r, g, b, a) => {
        const l = lum(r, g, b);
        let o: number[];
        switch (p.mode) {
          case 'gray': o = [l, l, l]; break;
          case 'sepia': o = [l * 1.07 + 20, l * 0.87 + 10, l * 0.62]; break;
          case 'invert': o = [255 - r, 255 - g, 255 - b]; break;
          case 'warm': o = [r * 1.12 + 10, g * 1.02, b * 0.82]; break;
          case 'cool': o = [r * 0.85, g * 0.98, b * 1.15 + 12]; break;
          case 'vintage': o = [l * 0.6 + r * 0.4 + 18, l * 0.6 + g * 0.4 + 8, l * 0.5 + b * 0.3 + 12]; break;
          case 'night': o = [l * 0.25, l * 1.1 + 20, l * 0.3]; break;
          case 'thermal': { const [tr, tg, tb] = hslToRgb(240 - (l / 255) * 260, 1, 0.5); o = [tr, tg, tb]; break; }
          case 'ghost': return [mix(r, l * 0.8 + 60, k), mix(g, l * 0.9 + 70, k), mix(b, l + 80, k), a * (1 - 0.45 * k)];
          default: o = [r, g, b];
        }
        return [mix(r, o[0], k), mix(g, o[1], k), mix(b, o[2], k)];
      });
    },
  },
  {
    id: 'rainbow', name: '虹色ホロ', category: 'color', icon: '🦄', desc: '虹色のホログラム着色（アニメ可）',
    params: [
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 60 },
      { key: 'dir', label: '方向', type: 'select', options: [['d', '斜め'], ['h', '横'], ['v', '縦'], ['r', '放射'], ['l', '明度']], default: 'd' },
      { key: 'repeat', label: '繰り返し', type: 'range', min: 0.5, max: 4, step: 0.5, default: 1 },
      { key: 'animate', label: 'アニメーション', type: 'bool', default: true },
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const k = p.amount / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const u = x / src.w, v = y / src.h;
        const pos = p.dir === 'h' ? u : p.dir === 'v' ? v : p.dir === 'r' ? Math.hypot(u - 0.5, v - 0.5) * 2 : p.dir === 'l' ? lum(r, g, b) / 255 : (u + v) / 2;
        const hue = (pos * p.repeat + (p.animate ? ctx.t : 0)) * 360;
        const [, s, l] = rgbToHsl(r, g, b);
        const o = hslToRgb(hue, Math.max(s, 0.75), clamp(l, 0.15, 0.85));
        return [mix(r, o[0], k), mix(g, o[1], k), mix(b, o[2], k)];
      });
    },
  },

  /* ---------------- TEXTURE ---------------- */
  {
    id: 'noise', name: 'ノイズ/粒子', category: 'texture', icon: '🌫️', desc: 'ざらつきを加えて素材感を強調',
    params: [
      { key: 'amount', label: '量', type: 'range', min: 0, max: 100, default: 20 },
      { key: 'size', label: '粒の大きさ', type: 'range', min: 1, max: 4, default: 1 },
      { key: 'mono', label: 'モノクロ', type: 'bool', default: true },
    ],
    apply(src, p, ctx) {
      const a = p.amount * 1.1;
      return map(src, (r, g, b, _a, x, y) => {
        const cx = Math.floor(x / p.size), cy = Math.floor(y / p.size);
        const n = (hash2(cx, cy, ctx.seed) - 0.5) * 2 * a;
        if (p.mono) return [r + n, g + n, b + n];
        return [r + n, g + (hash2(cx, cy, ctx.seed + 7) - 0.5) * 2 * a, b + (hash2(cx, cy, ctx.seed + 13) - 0.5) * 2 * a];
      });
    },
  },
  {
    id: 'dither', name: 'ディザリング', category: 'texture', icon: '▦', desc: 'ベイヤー配列によるレトロな網点表現',
    params: [
      { key: 'levels', label: '階調数', type: 'range', min: 2, max: 8, default: 4 },
      { key: 'strength', label: '強さ', type: 'range', min: 0, max: 100, default: 70 },
    ],
    apply(src, p) {
      const step = 255 / (p.levels - 1), s = p.strength / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const o = (BAYER4[(y % 4) * 4 + (x % 4)] - 0.5) * step * s;
        const q = (v: number) => Math.round((v + o) / step) * step;
        return [q(r), q(g), q(b)];
      });
    },
  },
  {
    id: 'bevel', name: 'ベベル立体', category: 'texture', icon: '🔷', desc: '縁にハイライトと影を付け立体的に',
    params: [
      { key: 'width', label: '幅', type: 'range', min: 1, max: 6, default: 1 },
      { key: 'strength', label: '強さ', type: 'range', min: 0, max: 100, default: 45 },
      { key: 'dir', label: '光の方向', type: 'select', options: [['tl', '左上'], ['t', '上'], ['tr', '右上'], ['l', '左']], default: 'tl' },
      { key: 'bounds', label: '外周を縁とする', type: 'bool', default: true },
    ],
    apply(src, p) {
      const dirs: Record<string, [number, number]> = { tl: [-1, -1], t: [0, -1], tr: [1, -1], l: [-1, 0] };
      const [dx, dy] = dirs[p.dir];
      const k = p.strength / 100;
      const edge = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= src.w || y >= src.h) return p.bounds;
        return A(src, x, y) < 128;
      };
      const find = (x: number, y: number, sx: number, sy: number) => {
        for (let d = 1; d <= p.width; d++) {
          if ((sx && edge(x + sx * d, y)) || (sy && edge(x, y + sy * d))) return 1 - (d - 1) / p.width;
        }
        return 0;
      };
      return map(src, (r, g, b, _a, x, y) => {
        const hl = find(x, y, dx, dy) * k, sh = find(x, y, -dx, -dy) * k;
        if (hl >= sh && hl > 0) return [lighten(r, hl), lighten(g, hl), lighten(b, hl)];
        if (sh > 0) return [darken(r, sh), darken(g, sh), darken(b, sh)];
      });
    },
  },
  {
    id: 'autoshade', name: '自動陰影(AO)', category: 'texture', icon: '🌓', desc: '明度差から陰影を自動生成しドット絵の立体感を強化',
    params: [
      { key: 'strength', label: '強さ', type: 'range', min: 0, max: 100, default: 50 },
      { key: 'ao', label: '隙間の暗さ', type: 'range', min: 0, max: 100, default: 40 },
      { key: 'wrap', label: '端の処理', type: 'select', options: WRAP_OPTS, default: 'auto' },
    ],
    apply(src, p) {
      const wrap = useWrap(src, p.wrap);
      const L = (x: number, y: number) => {
        if (!wrap && (x < 0 || y < 0 || x >= src.w || y >= src.h)) return null;
        const i = wrap ? IW(src, x, y) : I(src, x, y);
        if (src.d[i + 3] < 128) return null;
        return lum(src.d[i], src.d[i + 1], src.d[i + 2]);
      };
      const k = p.strength / 100, ao = p.ao / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const c = L(x, y)!;
        const tl = L(x - 1, y - 1), br = L(x + 1, y + 1);
        let shade = 0;
        if (tl !== null && br !== null) shade = ((c - tl) + (c - br) * -1) / 255;
        else if (tl === null) shade = 0.35;
        else if (br === null) shade = -0.35;
        // ambient occlusion: darker than neighborhood
        let sum = 0, n = 0;
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const v = L(x + ox, y + oy); if (v !== null) { sum += v; n++; } }
        const avg = n ? sum / n : c;
        const occ = c < avg - 10 ? ((avg - c) / 255) * ao * 2 : 0;
        const s = shade * k - occ;
        const f = (v: number) => (s > 0 ? lighten(v, s) : darken(v, -s));
        return [f(r), f(g), f(b)];
      });
    },
  },
  {
    id: 'emboss', name: 'エンボス', category: 'texture', icon: '🗿', desc: '明度を高さとみなして浮き彫り加工',
    params: [
      { key: 'strength', label: '強さ', type: 'range', min: 0, max: 100, default: 50 },
      { key: 'wrap', label: '端の処理', type: 'select', options: WRAP_OPTS, default: 'auto' },
    ],
    apply(src, p) {
      const wrap = useWrap(src, p.wrap);
      const H = (x: number, y: number) => {
        if (!wrap) { x = clamp(x, 0, src.w - 1); y = clamp(y, 0, src.h - 1); }
        const i = IW(src, x, y);
        return src.d[i + 3] < 128 ? 0 : lum(src.d[i], src.d[i + 1], src.d[i + 2]);
      };
      const k = p.strength / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const gx = H(x + 1, y) - H(x - 1, y), gy = H(x, y + 1) - H(x, y - 1);
        const s = ((-gx - gy) / 255) * k;
        const f = (v: number) => (s > 0 ? lighten(v, s) : darken(v, -s));
        return [f(r), f(g), f(b)];
      });
    },
  },
  {
    id: 'sharpen', name: 'シャープ/ディテール', category: 'texture', icon: '🔪', desc: 'ドットのエッジと細部を強調',
    params: [
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 200, default: 60 },
      { key: 'wrap', label: '端の処理', type: 'select', options: WRAP_OPTS, default: 'auto' },
    ],
    apply(src, p) {
      const wrap = useWrap(src, p.wrap), k = p.amount / 100;
      const out = cloneTex(src);
      for (let y = 0; y < src.h; y++)
        for (let x = 0; x < src.w; x++) {
          const i = I(src, x, y);
          if (!src.d[i + 3]) continue;
          for (let c = 0; c < 3; c++) {
            let s = 0, n = 0;
            for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              let nx = x + ox, ny = y + oy;
              if (!wrap) { if (nx < 0 || ny < 0 || nx >= src.w || ny >= src.h) continue; }
              const j = IW(src, nx, ny);
              if (!src.d[j + 3]) continue;
              s += src.d[j + c]; n++;
            }
            if (n) out.d[i + c] = src.d[i + c] + (src.d[i + c] - s / n) * k;
          }
        }
      return out;
    },
  },
  {
    id: 'blur', name: 'ぼかし', category: 'texture', icon: '💧', desc: '柔らかくぼかす（HD化後の下地作りに）',
    params: [
      { key: 'radius', label: '半径', type: 'range', min: 1, max: 4, default: 1 },
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 100 },
      { key: 'wrap', label: '端の処理', type: 'select', options: WRAP_OPTS, default: 'auto' },
    ],
    apply(src, p) {
      const wrap = useWrap(src, p.wrap), R = p.radius, k = p.amount / 100;
      const out = cloneTex(src);
      for (let y = 0; y < src.h; y++)
        for (let x = 0; x < src.w; x++) {
          const i = I(src, x, y);
          if (!src.d[i + 3]) continue;
          let r = 0, g = 0, b = 0, n = 0;
          for (let oy = -R; oy <= R; oy++)
            for (let ox = -R; ox <= R; ox++) {
              const nx = x + ox, ny = y + oy;
              if (!wrap && (nx < 0 || ny < 0 || nx >= src.w || ny >= src.h)) continue;
              const j = IW(src, nx, ny);
              if (!src.d[j + 3]) continue;
              r += src.d[j]; g += src.d[j + 1]; b += src.d[j + 2]; n++;
            }
          out.d[i] = mix(src.d[i], r / n, k); out.d[i + 1] = mix(src.d[i + 1], g / n, k); out.d[i + 2] = mix(src.d[i + 2], b / n, k);
        }
      return out;
    },
  },
  {
    id: 'weather', name: '風化(苔/錆/雪)', category: 'texture', icon: '🍃', desc: '苔・錆・汚れ・煤・雪・砂を自然に付着',
    params: [
      { key: 'type', label: '種類', type: 'select', options: [['moss', '苔'], ['rust', '錆'], ['dirt', '汚れ'], ['soot', '煤'], ['snow', '雪積もり'], ['sand', '砂'], ['crystal', '結晶化'], ['blood', 'ネザー侵食']], default: 'moss' },
      { key: 'coverage', label: '範囲', type: 'range', min: 0, max: 100, default: 40 },
      { key: 'scale', label: '模様の大きさ', type: 'range', min: 1, max: 8, default: 3 },
      { key: 'bias', label: '偏り', type: 'select', options: [['none', 'なし'], ['top', '上'], ['bottom', '下'], ['edge', '外周']], default: 'none' },
    ],
    apply(src, p, ctx) {
      const pal: Record<string, string[]> = {
        moss: ['#2f5a1c', '#44762a', '#5c9437', '#3a6b22'],
        rust: ['#6b3515', '#8a4a20', '#a55a28', '#c07038'],
        dirt: ['#3f2d1e', '#57402b', '#6b5038', '#4a3524'],
        soot: ['#151515', '#222222', '#2e2a28', '#1a1818'],
        snow: ['#ffffff', '#f0f6ff', '#dce8f5', '#c7d6e8'],
        sand: ['#d9c38a', '#e6d39c', '#c8ae70', '#f0e0b0'],
        crystal: ['#7fe8ff', '#b8f6ff', '#4cc8e8', '#e8fdff'],
        blood: ['#5a0c10', '#7d1418', '#a0201c', '#3d0608'],
      };
      const cols = pal[p.type].map(hexToRgb);
      const n = fbm(ctx.seed, src.w, src.h, p.scale, 3);
      const cov = p.coverage / 100;
      const out = cloneTex(src);
      const biasF = (x: number, y: number) => {
        const v = y / (src.h - 1 || 1);
        if (p.bias === 'top' || p.type === 'snow') return (0.5 - v) * 0.8;
        if (p.bias === 'bottom') return (v - 0.5) * 0.8;
        if (p.bias === 'edge') { const u = x / (src.w - 1 || 1); return (Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5)) - 0.3) * 1.2; }
        return 0;
      };
      const mask = (x: number, y: number) => {
        if (A(src, mod(x, src.w), mod(y, src.h)) === 0) return false;
        return n(mod(x, src.w), mod(y, src.h)) + biasF(mod(x, src.w), mod(y, src.h)) > 1 - cov * 0.75 - 0.12;
      };
      for (let y = 0; y < src.h; y++)
        for (let x = 0; x < src.w; x++) {
          const i = I(src, x, y);
          if (!src.d[i + 3] || !mask(x, y)) continue;
          const ci = Math.floor(hash2(x, y, ctx.seed + 3) * cols.length);
          let c = cols[ci];
          const l = lum(src.d[i], src.d[i + 1], src.d[i + 2]) / 255;
          const shadeK = 0.75 + 0.45 * l;
          let top = !mask(x, y - 1), bot = !mask(x, y + 1);
          let f = shadeK;
          if (top) f *= 1.15;
          if (bot) f *= 0.8;
          c = c.map((v) => clamp(v * f)) as [number, number, number];
          const k = p.type === 'soot' || p.type === 'dirt' ? 0.7 : 0.92;
          out.d[i] = mix(src.d[i], c[0], k); out.d[i + 1] = mix(src.d[i + 1], c[1], k); out.d[i + 2] = mix(src.d[i + 2], c[2], k);
        }
      return out;
    },
  },
  {
    id: 'cracks', name: 'ひび割れ', category: 'texture', icon: '⚡', desc: 'ランダムなひびを刻む（破損・古代遺跡風）',
    params: [
      { key: 'count', label: '本数', type: 'range', min: 1, max: 16, default: 4 },
      { key: 'length', label: '長さ', type: 'range', min: 2, max: 40, default: 8 },
      { key: 'color', label: '色', type: 'color', default: '#1a1410' },
      { key: 'depth', label: '濃さ', type: 'range', min: 0, max: 100, default: 75 },
      { key: 'highlight', label: 'エッジハイライト', type: 'bool', default: true },
      { key: 'glow', label: '発光(溶岩ひび)', type: 'bool', default: false },
    ],
    apply(src, p, ctx) {
      const R = rng(ctx.seed);
      const out = cloneTex(src);
      const wrap = isOpaqueTex(src);
      const c = hexToRgb(p.color), k = p.depth / 100;
      const D8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
      const crack = new Set<number>();
      const walk = (x: number, y: number, dir: number, len: number, depth: number) => {
        for (let s = 0; s < len; s++) {
          const xx = wrap ? mod(x, src.w) : x, yy = wrap ? mod(y, src.h) : y;
          if (xx < 0 || yy < 0 || xx >= src.w || yy >= src.h || A(src, xx, yy) === 0) break;
          crack.add(yy * src.w + xx);
          const rr = R();
          if (rr < 0.3) dir = (dir + 1) % 8; else if (rr < 0.6) dir = (dir + 7) % 8;
          if (depth < 2 && R() < 0.12) walk(x, y, (dir + (R() < 0.5 ? 2 : 6)) % 8, Math.floor(len / 2), depth + 1);
          x += D8[dir][0]; y += D8[dir][1];
        }
      };
      let tries = 0;
      for (let n = 0; n < p.count && tries < 500; tries++) {
        const x = Math.floor(R() * src.w), y = Math.floor(R() * src.h);
        if (A(src, x, y) === 0) continue;
        walk(x, y, Math.floor(R() * 8), p.length, 0);
        n++;
      }
      const glowC: [number, number, number] = [255, 140, 30];
      crack.forEach((idx) => {
        const x = idx % src.w, y = Math.floor(idx / src.w), i = idx * 4;
        const cc = p.glow ? (hash2(x, y, ctx.seed) > 0.5 ? glowC : [255, 210, 80]) : c;
        out.d[i] = mix(src.d[i], cc[0], k); out.d[i + 1] = mix(src.d[i + 1], cc[1], k); out.d[i + 2] = mix(src.d[i + 2], cc[2], k);
        if (p.highlight) {
          const hx = wrap ? mod(x + 1, src.w) : x + 1, hy = wrap ? mod(y + 1, src.h) : y + 1;
          if (hx < src.w && hy < src.h && !crack.has(hy * src.w + hx) && A(src, hx, hy)) {
            const j = I(src, hx, hy);
            if (p.glow) { out.d[j] = mix(out.d[j], 255, 0.35); out.d[j + 1] = mix(out.d[j + 1], 120, 0.35); out.d[j + 2] = mix(out.d[j + 2], 20, 0.35); }
            else for (let q = 0; q < 3; q++) out.d[j + q] = lighten(out.d[j + q], 0.22 * k);
          }
        }
      });
      return out;
    },
  },
  {
    id: 'metal', name: 'メタリック光沢', category: 'texture', icon: '🪙', desc: '金属の反射と鏡面ハイライト（光が走るアニメ可）',
    params: [
      { key: 'color', label: '金属色', type: 'color', default: '#e8c060' },
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 75 },
      { key: 'bands', label: '反射の数', type: 'range', min: 1, max: 4, default: 2 },
      { key: 'spec', label: '鏡面光', type: 'range', min: 0, max: 100, default: 60 },
      { key: 'animate', label: '光を走らせる', type: 'bool', default: false },
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.amount / 100, sp = p.spec / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const l = lum(r, g, b) / 255;
        const diag = (x / src.w + y / src.h) / 2;
        const ph = (p.animate ? ctx.t : 0) * Math.PI * 2;
        const v = 0.5 + 0.5 * Math.sin(l * Math.PI * p.bands * 2 + diag * Math.PI * 2 - ph);
        const base = c.map((cv) => cv * (0.25 + 0.95 * l) * (0.75 + 0.4 * v));
        const s = Math.pow(v, 8) * 255 * sp * (0.5 + l);
        return [mix(r, base[0] + s, k), mix(g, base[1] + s, k), mix(b, base[2] + s, k)];
      });
    },
  },
  {
    id: 'frost', name: '氷結', category: 'texture', icon: '❄️', desc: '霜と氷の結晶で覆う',
    params: [
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 60 },
      { key: 'crystals', label: '結晶の数', type: 'range', min: 0, max: 60, default: 12 },
      { key: 'edge', label: '縁の霜', type: 'range', min: 0, max: 4, default: 2 },
    ],
    apply(src, p, ctx) {
      const k = p.amount / 100;
      const ice = [200, 232, 255];
      const df = distanceField(src, (x, y) => A(src, x, y) < 128, true);
      const out = map(src, (r, g, b, _a, x, y) => {
        const l = lum(r, g, b);
        let o = [mix(r, ice[0] * (0.5 + l / 400), 0.6), mix(g, ice[1] * (0.55 + l / 400), 0.6), mix(b, ice[2] * (0.65 + l / 500), 0.6)];
        const d = df[y * src.w + x];
        if (p.edge && d <= p.edge) { const e = (1 - (d - 1) / p.edge) * 0.7; o = o.map((v) => lighten(v, e)); }
        return [mix(r, o[0], k), mix(g, o[1], k), mix(b, o[2], k)];
      });
      const R = rng(ctx.seed);
      const wrap = isOpaqueTex(src);
      for (let n = 0; n < p.crystals; n++) {
        const x = Math.floor(R() * src.w), y = Math.floor(R() * src.h);
        if (!A(src, x, y)) continue;
        blendAt(out, x, y, [255, 255, 255], 0.9 * k, wrap);
        if (R() < 0.5) {
          const dx = R() < 0.5 ? 1 : -1;
          blendAt(out, x + dx, y + 1, [220, 245, 255], 0.6 * k, wrap);
          blendAt(out, x - dx, y - 1, [220, 245, 255], 0.6 * k, wrap);
        }
      }
      return out;
    },
  },
  {
    id: 'ore', name: '鉱石埋め込み', category: 'texture', icon: '💎', desc: 'マイクラ風の鉱石粒をランダム配置',
    params: [
      { key: 'color', label: '鉱石色', type: 'color', default: '#5ce1e6' },
      { key: 'count', label: '粒の数', type: 'range', min: 1, max: 12, default: 4 },
      { key: 'size', label: '大きさ', type: 'range', min: 1, max: 10, default: 4 },
      { key: 'outline', label: '暗い縁', type: 'bool', default: true },
    ],
    apply(src, p, ctx) {
      const R = rng(ctx.seed);
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const wrap = isOpaqueTex(src);
      const W = src.w, H = src.h;
      const sc = Math.max(1, Math.round(W / 16));
      const blob = new Set<number>();
      const key = (x: number, y: number) => mod(y, H) * W + mod(x, W);
      for (let n = 0; n < p.count; n++) {
        let x = Math.floor(R() * W), y = Math.floor(R() * H);
        const cells: [number, number][] = [[x, y]];
        for (let s = 1; s < p.size; s++) {
          const [bx, by] = cells[Math.floor(R() * cells.length)];
          const d = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(R() * 4)];
          cells.push([bx + d[0], by + d[1]]);
        }
        for (const [cx, cy] of cells)
          for (let yy = 0; yy < sc; yy++) for (let xx = 0; xx < sc; xx++) {
            const px = cx * sc + xx - (sc > 1 ? x * (sc - 1) : 0), py = cy * sc + yy - (sc > 1 ? y * (sc - 1) : 0);
            if (!wrap && (px < 0 || py < 0 || px >= W || py >= H)) continue;
            if (A(src, mod(px, W), mod(py, H))) blob.add(key(px, py));
          }
      }
      const inB = (x: number, y: number) => blob.has(key(x, y));
      blob.forEach((idx) => {
        const x = idx % W, y = Math.floor(idx / W), i = idx * 4;
        let f = 1;
        if (!inB(x - 1, y) || !inB(x, y - 1)) f = 1.3;
        else if (!inB(x + 1, y) || !inB(x, y + 1)) f = 0.7;
        const j = hash2(x, y, ctx.seed) * 0.2 + 0.9;
        out.d[i] = clamp(c[0] * f * j + (f > 1 ? 40 : 0)); out.d[i + 1] = clamp(c[1] * f * j + (f > 1 ? 40 : 0)); out.d[i + 2] = clamp(c[2] * f * j + (f > 1 ? 40 : 0));
      });
      if (p.outline)
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          if (inB(x, y) || !A(src, x, y)) continue;
          if (inB(x + 1, y) || inB(x, y + 1) || inB(x - 1, y) || inB(x, y - 1)) {
            const i = I(out, x, y);
            for (let q = 0; q < 3; q++) out.d[i + q] = darken(out.d[i + q], 0.35);
          }
        }
      return out;
    },
  },
  {
    id: 'pattern', name: 'パターン刻印', category: 'texture', icon: '🔳', desc: 'レンガ・格子・鱗・ジグザグ等の模様を刻む',
    params: [
      { key: 'type', label: '模様', type: 'select', options: [['bricks', 'レンガ'], ['grid', '格子'], ['checker', '市松'], ['stripes', 'ストライプ'], ['diagonal', '斜線'], ['dots', 'ドット'], ['scales', '鱗'], ['zigzag', 'ジグザグ'], ['planks', '板材'], ['circuit', '回路']], default: 'bricks' },
      { key: 'size', label: 'サイズ', type: 'range', min: 2, max: 16, default: 4 },
      { key: 'mode', label: '合成', type: 'select', options: [['carve', '彫刻(影+光)'], ['darken', '暗く'], ['lighten', '明るく'], ['color', '指定色']], default: 'carve' },
      { key: 'color', label: '色', type: 'color', default: '#000000' },
      { key: 'opacity', label: '濃さ', type: 'range', min: 0, max: 100, default: 45 },
    ],
    apply(src, p) {
      const s = Math.max(2, Math.round((p.size * src.w) / 16));
      const on = (x: number, y: number): boolean => {
        x = mod(x, src.w); y = mod(y, src.h);
        switch (p.type) {
          case 'bricks': { const row = Math.floor(y / s); const off = row % 2 ? s : 0; return y % s === s - 1 || mod(x + off, s * 2) === s * 2 - 1; }
          case 'grid': return x % s === s - 1 || y % s === s - 1;
          case 'checker': return (Math.floor(x / s) + Math.floor(y / s)) % 2 === 0;
          case 'stripes': return y % s === 0;
          case 'diagonal': return mod(x + y, s) === 0;
          case 'dots': return x % s === Math.floor(s / 2) && y % s === Math.floor(s / 2);
          case 'scales': { const row = Math.floor(y / s); const cx = mod(x + (row % 2 ? s / 2 : 0), s) - s / 2; const cy = (y % s) - s; return Math.abs(Math.hypot(cx, cy) - s * 0.9) < 0.6; }
          case 'zigzag': return mod(y, s) === Math.abs(mod(x, s * 2) - s) % s;
          case 'planks': { const row = Math.floor(y / s); return y % s === s - 1 || (mod(x + row * 5 * s, s * 4) === 0 && y % s !== s - 1); }
          case 'circuit': { const h = hash2(Math.floor(x / s), Math.floor(y / s), 7); return (h < 0.5 ? x % s === 0 : y % s === 0) || (x % s === 0 && y % s === 0); }
        }
        return false;
      };
      const k = p.opacity / 100, c = hexToRgb(p.color);
      return map(src, (r, g, b, _a, x, y) => {
        const hit = on(x, y);
        if (p.mode === 'carve') {
          if (hit) return [darken(r, k), darken(g, k), darken(b, k)];
          if (on(x - 1, y - 1) || on(x, y - 1) || on(x - 1, y)) return [lighten(r, k * 0.35), lighten(g, k * 0.35), lighten(b, k * 0.35)];
          return;
        }
        if (!hit) return;
        if (p.mode === 'darken') return [darken(r, k), darken(g, k), darken(b, k)];
        if (p.mode === 'lighten') return [lighten(r, k), lighten(g, k), lighten(b, k)];
        return [mix(r, c[0], k), mix(g, c[1], k), mix(b, c[2], k)];
      });
    },
  },

  /* ---------------- DECOR ---------------- */
  {
    id: 'outline', name: 'アウトライン', category: 'decor', icon: '⭕', desc: 'アイテムの外側/内側に縁取り線',
    params: [
      { key: 'color', label: '色', type: 'color', default: '#1a0f2e' },
      { key: 'thickness', label: '太さ', type: 'range', min: 1, max: 4, default: 1 },
      { key: 'mode', label: '位置', type: 'select', options: [['outer', '外側'], ['inner', '内側'], ['auto', '自動シェード']], default: 'outer' },
      { key: 'diag', label: '角も塗る', type: 'bool', default: false },
      { key: 'opacity', label: '不透明度', type: 'range', min: 0, max: 100, default: 100 },
    ],
    apply(src, p) {
      const c = hexToRgb(p.color), k = p.opacity / 100;
      const out = cloneTex(src);
      const lim = p.diag ? p.thickness + 0.5 : p.thickness + 0.01;
      if (p.mode === 'outer') {
        const df = distanceField(src, (x, y) => A(src, x, y) >= 128);
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          const d = df[y * src.w + x];
          if (d > 0 && d <= lim && A(src, x, y) < 128) blendAt(out, x, y, c, k);
        }
      } else {
        const df = distanceField(src, (x, y) => A(src, x, y) < 128, true);
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          const d = df[y * src.w + x];
          if (d > 0 && d <= lim) {
            if (p.mode === 'auto') {
              const i = I(out, x, y);
              for (let q = 0; q < 3; q++) out.d[i + q] = darken(src.d[i + q], 0.55 * k);
            } else blendAt(out, x, y, c, k);
          }
        }
      }
      return out;
    },
  },
  {
    id: 'glow', name: 'グロー/発光', category: 'decor', icon: '💡', desc: '外側/内側の光彩、明部のブルーム（脈動可）',
    params: [
      { key: 'color', label: '色', type: 'color', default: '#b060ff' },
      { key: 'mode', label: '種類', type: 'select', options: [['outer', '外側グロー'], ['inner', '内側グロー'], ['bloom', 'ブルーム']], default: 'outer' },
      { key: 'radius', label: '半径', type: 'range', min: 1, max: 8, default: 3 },
      { key: 'intensity', label: '強さ', type: 'range', min: 0, max: 100, default: 70 },
      { key: 'pulse', label: '脈動アニメ', type: 'bool', default: false },
    ],
    animated: (p) => p.pulse,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color);
      const k = (p.intensity / 100) * (p.pulse ? 0.55 + 0.45 * Math.sin(ctx.t * Math.PI * 2) : 1);
      const out = cloneTex(src);
      const R = p.radius;
      if (p.mode === 'outer') {
        const df = distanceField(src, (x, y) => A(src, x, y) >= 128);
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          const i = I(out, x, y);
          const d = df[y * src.w + x];
          if (src.d[i + 3] >= 128 || d > R + 0.5) continue;
          const a = Math.pow(1 - (d - 1) / (R + 0.5), 1.5) * k;
          const qa = Math.round(a * 4) / 4; // pixel-art stepped alpha
          if (qa <= 0) continue;
          out.d[i] = c[0]; out.d[i + 1] = c[1]; out.d[i + 2] = c[2]; out.d[i + 3] = Math.max(src.d[i + 3], qa * 255);
        }
      } else if (p.mode === 'inner') {
        const df = distanceField(src, (x, y) => A(src, x, y) < 128, true);
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          const d = df[y * src.w + x];
          if (d === 0 || d > R + 0.5) continue;
          const a = (1 - (d - 1) / (R + 0.5)) * k * 0.8;
          const i = I(out, x, y);
          for (let q = 0; q < 3; q++) out.d[i + q] = clamp(src.d[i + q] + c[q] * a);
        }
      } else {
        const wrap = isOpaqueTex(src);
        const bright = new Float32Array(src.w * src.h);
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          const i = I(src, x, y);
          const l = lum(src.d[i], src.d[i + 1], src.d[i + 2]);
          bright[y * src.w + x] = src.d[i + 3] > 0 ? Math.max(0, (l - 150) / 105) : 0;
        }
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          let s = 0, n = 0;
          for (let oy = -R; oy <= R; oy++) for (let ox = -R; ox <= R; ox++) {
            let nx = x + ox, ny = y + oy;
            if (wrap) { nx = mod(nx, src.w); ny = mod(ny, src.h); } else if (nx < 0 || ny < 0 || nx >= src.w || ny >= src.h) { n++; continue; }
            const wgt = 1 / (1 + ox * ox + oy * oy);
            s += bright[ny * src.w + nx] * wgt; n += wgt;
          }
          const a = (s / n) * k * 2.2;
          if (a <= 0.02) continue;
          blendAt(out, x, y, c, 0, false);
          const i = I(out, x, y);
          if (src.d[i + 3] < 128) { out.d[i] = c[0]; out.d[i + 1] = c[1]; out.d[i + 2] = c[2]; out.d[i + 3] = clamp(a * 255); }
          else for (let q = 0; q < 3; q++) out.d[i + q] = clamp(src.d[i + q] + c[q] * a);
        }
      }
      return out;
    },
  },
  {
    id: 'sparkle', name: 'きらめき', category: 'decor', icon: '🌟', desc: '星のきらめきを散りばめる（瞬きアニメ可）',
    params: [
      { key: 'count', label: '数', type: 'range', min: 1, max: 30, default: 5 },
      { key: 'color', label: '色', type: 'color', default: '#ffffff' },
      { key: 'style', label: '形', type: 'select', options: [['dot', '点'], ['cross', '十字'], ['star', '星'], ['big', '大きい星']], default: 'cross' },
      { key: 'onOpaque', label: '不透明部のみ', type: 'bool', default: true },
      { key: 'animate', label: '瞬きアニメ', type: 'bool', default: true },
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const R = rng(ctx.seed);
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const wrap = isOpaqueTex(src);
      const sc = Math.max(1, Math.round(src.w / 32));
      let placed = 0, tries = 0;
      while (placed < p.count && tries++ < 400) {
        const x = Math.floor(R() * src.w), y = Math.floor(R() * src.h);
        const phase = R();
        if (p.onOpaque && !A(src, x, y)) continue;
        placed++;
        let v = 1;
        if (p.animate) v = Math.max(0, Math.sin((ctx.t + phase) * Math.PI * 2));
        if (v < 0.05) continue;
        const arm = p.style === 'dot' ? 0 : p.style === 'cross' ? 1 : p.style === 'star' ? 2 : 3;
        const len = Math.round(arm * v * sc);
        const put = (xx: number, yy: number, a: number) => {
          if (p.onOpaque && !A(src, wrap ? mod(xx, src.w) : xx, wrap ? mod(yy, src.h) : yy)) return;
          blendAt(out, xx, yy, c, a, wrap);
        };
        for (let yy = 0; yy < sc; yy++) for (let xx = 0; xx < sc; xx++) put(x + xx, y + yy, v);
        for (let d = 1; d <= len; d++) {
          const a = v * (1 - (d - 1) / (len + 1)) * 0.85;
          put(x + d, y, a); put(x - d, y, a); put(x, y + d, a); put(x, y - d, a);
        }
        if (arm >= 3 && v > 0.6) { put(x + 1, y + 1, 0.4); put(x - 1, y - 1, 0.4); put(x + 1, y - 1, 0.4); put(x - 1, y + 1, 0.4); }
      }
      return out;
    },
  },
  {
    id: 'frame', name: 'ブロック枠', category: 'decor', icon: '🖼️', desc: '外周に装飾フレーム（ベベル/二重/鋲/豪華）',
    params: [
      { key: 'style', label: 'スタイル', type: 'select', options: [['solid', '単色'], ['bevel', 'ベベル'], ['double', '二重線'], ['dashed', '破線'], ['rivet', '鋲打ち'], ['ornate', '豪華装飾'], ['glass', 'ガラス']], default: 'bevel' },
      { key: 'color', label: '色', type: 'color', default: '#c8a040' },
      { key: 'width', label: '幅', type: 'range', min: 1, max: 4, default: 1 },
      { key: 'opacity', label: '不透明度', type: 'range', min: 0, max: 100, default: 100 },
    ],
    apply(src, p) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color), k = p.opacity / 100;
      const sc = Math.max(1, Math.round(src.w / 16));
      const w = p.width * sc;
      const W = src.w, H = src.h;
      const light = c.map((v) => lighten(v, 0.45)) as [number, number, number];
      const dark = c.map((v) => darken(v, 0.45)) as [number, number, number];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const d = Math.min(x, y, W - 1 - x, H - 1 - y);
        let col: [number, number, number] | null = null, a = k;
        const topLeft = Math.min(x, y) === d && (x === d || y === d) && (x <= W - 1 - x || y === d) && (y <= H - 1 - y || x === d);
        switch (p.style) {
          case 'solid': if (d < w) col = c; break;
          case 'bevel': if (d < w) col = d === 0 ? (x === 0 || y === 0 ? light : dark) : x - d === 0 || y - d === 0 ? (topLeft ? light : c) : c;
            if (d < w) { const isTL = (x === d && y <= H - 1 - d) || (y === d && x <= W - 1 - d); col = isTL && (x < W - 1 - d || y === d) && (y < H - 1 - d || x === d) ? light : dark; if (d === w - 1 && w > 1) col = c; }
            break;
          case 'double': if (d < sc || (d >= w + sc && d < w + 2 * sc)) col = c; break;
          case 'dashed': if (d < w && Math.floor((x + y) / (2 * sc)) % 2 === 0) col = c; break;
          case 'rivet': {
            if (d < w) { const isTL = x === d || y === d; col = isTL ? c : dark; }
            const rp = w + sc;
            const spots = [[rp, rp], [W - 1 - rp, rp], [rp, H - 1 - rp], [W - 1 - rp, H - 1 - rp]];
            if (W >= 32) spots.push([Math.floor(W / 2), rp], [Math.floor(W / 2), H - 1 - rp], [rp, Math.floor(H / 2)], [W - 1 - rp, Math.floor(H / 2)]);
            for (const [sx, sy] of spots) {
              if (x - sx >= 0 && x - sx < sc * 1 + 1 && y - sy >= 0 && y - sy < sc + 1 && sc > 0) {
                col = x === sx && y === sy ? light : c; if (x - sx === sc && y - sy === sc) col = dark;
              }
            }
            break;
          }
          case 'ornate': {
            if (d < w) col = d === 0 ? dark : c;
            const cornerSize = w + 2 * sc;
            const cx = Math.min(x, W - 1 - x), cy = Math.min(y, H - 1 - y);
            if (cx < cornerSize && cy < cornerSize && d >= w && (cx === w || cy === w || (cx === cornerSize - 1 && cy <= cornerSize - 1) || (cy === cornerSize - 1 && cx <= cornerSize - 1)))
              col = light;
            if (d === w && (x === Math.floor(W / 2) || y === Math.floor(H / 2) || x === Math.floor(W / 2) - 1 || y === Math.floor(H / 2) - 1)) col = light;
            break;
          }
          case 'glass': if (d < w) { col = x === d || y === d ? light : c; a = k * 0.9; }
            if (d >= w && x - y === Math.floor(W * 0.25) && x < W * 0.6) { col = light; a = k * 0.35; }
            if (d >= w && x - y === Math.floor(W * 0.25) + 2 * sc && x < W * 0.5) { col = light; a = k * 0.25; }
            break;
        }
        if (col) blendAt(out, x, y, col, a);
      }
      return out;
    },
  },
  {
    id: 'emblem', name: '紋章スタンプ', category: 'decor', icon: '🛡️', desc: '星/ハート/ドクロ/クリーパー等のドット紋章',
    params: [
      { key: 'shape', label: '形', type: 'select', options: [...Object.entries(GLYPHS).map(([k, v]) => [k, v.name] as [string, string]), ['rune', 'ランダムルーン']], default: 'star' },
      { key: 'color', label: '色', type: 'color', default: '#ffd84a' },
      { key: 'pos', label: '位置', type: 'select', options: [['c', '中央'], ['tl', '左上'], ['tr', '右上'], ['bl', '左下'], ['br', '右下']], default: 'c' },
      { key: 'scale', label: '拡大', type: 'range', min: 1, max: 4, default: 1 },
      { key: 'style', label: '表現', type: 'select', options: [['flat', 'ベタ塗り'], ['shaded', '立体'], ['carve', '彫刻'], ['glow', '発光']], default: 'shaded' },
      { key: 'opacity', label: '不透明度', type: 'range', min: 0, max: 100, default: 100 },
    ],
    apply(src, p, ctx) {
      let rows: boolean[][];
      if (p.shape === 'rune') rows = runeGlyph(ctx.seed, 5, 6);
      else rows = GLYPHS[p.shape].rows.map((r) => r.split('').map((ch) => ch === '#'));
      const gh = rows.length, gw = rows[0].length;
      const sc = p.scale * Math.max(1, Math.round(src.w / 16));
      const W = gw * sc, H = gh * sc;
      const m = Math.max(1, Math.round(src.w / 16));
      let ox = Math.floor((src.w - W) / 2), oy = Math.floor((src.h - H) / 2);
      if (p.pos.includes('l')) ox = m; if (p.pos.includes('r')) ox = src.w - W - m;
      if (p.pos.includes('t')) oy = m; if (p.pos.includes('b')) oy = src.h - H - m;
      const on = (x: number, y: number) => { const gx = Math.floor((x - ox) / sc), gy = Math.floor((y - oy) / sc); return x >= ox && y >= oy && gx < gw && gy < gh && rows[gy][gx]; };
      const out = cloneTex(src);
      const c = hexToRgb(p.color), k = p.opacity / 100;
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const i = I(out, x, y);
        if (on(x, y)) {
          if (p.style === 'carve') { for (let q = 0; q < 3; q++) out.d[i + q] = darken(src.d[i + q], 0.5 * k); continue; }
          let col = c;
          if (p.style === 'shaded') {
            if (!on(x - 1, y) || !on(x, y - 1)) col = c.map((v) => lighten(v, 0.4)) as typeof c;
            else if (!on(x + 1, y) || !on(x, y + 1)) col = c.map((v) => darken(v, 0.35)) as typeof c;
          }
          if (p.style === 'glow') col = c.map((v) => lighten(v, 0.3)) as typeof c;
          blendAt(out, x, y, col, k);
        } else if (p.style === 'carve' && on(x - 1, y - 1) && src.d[i + 3]) {
          for (let q = 0; q < 3; q++) out.d[i + q] = lighten(src.d[i + q], 0.3 * k);
        } else if (p.style === 'glow' && (on(x + 1, y) || on(x - 1, y) || on(x, y + 1) || on(x, y - 1))) {
          blendAt(out, x, y, c, 0.4 * k);
        } else if (p.style === 'shaded' && on(x - 1, y - 1) && !on(x, y)) {
          blendAt(out, x, y, [0, 0, 0], 0.35 * k);
        }
      }
      return out;
    },
  },
  {
    id: 'runes', name: 'ルーン刻印', category: 'decor', icon: 'ᚱ', desc: '古代文字を刻む（発光・明滅アニメ可）',
    params: [
      { key: 'count', label: '文字数', type: 'range', min: 1, max: 12, default: 3 },
      { key: 'color', label: '色', type: 'color', default: '#60f0ff' },
      { key: 'style', label: '表現', type: 'select', options: [['glow', '発光'], ['carve', '彫刻'], ['gold', '金象嵌']], default: 'glow' },
      { key: 'animate', label: '明滅アニメ', type: 'bool', default: false },
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const sc = Math.max(1, Math.round(src.w / 16));
      const gw = 3, gh = 4;
      const cols = Math.max(1, Math.floor((src.w - 2 * sc) / ((gw + 1) * sc)));
      const rowsN = Math.max(1, Math.floor((src.h - 2 * sc) / ((gh + 1) * sc)));
      const total = Math.min(p.count, cols * rowsN);
      const R = rng(ctx.seed);
      const slots = Array.from({ length: cols * rowsN }, (_, i) => i).sort(() => R() - 0.5).slice(0, total);
      const c = p.style === 'gold' ? hexToRgb('#ffd24a') : hexToRgb(p.color);
      slots.forEach((slot, n) => {
        const g = runeGlyph(ctx.seed + slot * 17, gw, gh);
        const bx = sc + (slot % cols) * (gw + 1) * sc + Math.floor((src.w - 2 * sc - cols * (gw + 1) * sc) / 2) + Math.floor(sc / 2);
        const by = sc + Math.floor(slot / cols) * (gh + 1) * sc + Math.floor((src.h - 2 * sc - rowsN * (gh + 1) * sc) / 2) + Math.floor(sc / 2);
        const v = p.animate ? 0.35 + 0.65 * Math.max(0, Math.sin((ctx.t + n / total) * Math.PI * 2)) : 1;
        for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
          if (!g[gy][gx]) continue;
          for (let yy = 0; yy < sc; yy++) for (let xx = 0; xx < sc; xx++) {
            const x = bx + gx * sc + xx, y = by + gy * sc + yy;
            if (x >= src.w || y >= src.h || !A(src, x, y)) continue;
            const i = I(out, x, y);
            if (p.style === 'carve') { for (let q = 0; q < 3; q++) out.d[i + q] = darken(out.d[i + q], 0.55); const j = y + 1 < src.h ? I(out, x, y + 1) : -1; if (j >= 0 && !(gy + 1 < gh && g[gy + 1][gx])) for (let q = 0; q < 3; q++) out.d[j + q] = lighten(out.d[j + q], 0.2); }
            else if (p.style === 'gold') { const f = gy === 0 || !g[gy - 1][gx] ? 1.2 : 0.95; for (let q = 0; q < 3; q++) out.d[i + q] = clamp(c[q] * f); }
            else for (let q = 0; q < 3; q++) out.d[i + q] = mix(out.d[i + q], lighten(c[q], 0.3), v);
          }
        }
      });
      return out;
    },
  },
  {
    id: 'shadow', name: 'ドロップシャドウ', category: 'decor', icon: '🌑', desc: 'アイテムの背後に影を落とす',
    params: [
      { key: 'dx', label: 'X', type: 'range', min: -4, max: 4, default: 1 },
      { key: 'dy', label: 'Y', type: 'range', min: -4, max: 4, default: 1 },
      { key: 'color', label: '色', type: 'color', default: '#000000' },
      { key: 'opacity', label: '濃さ', type: 'range', min: 0, max: 100, default: 50 },
    ],
    apply(src, p) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color), k = p.opacity / 100;
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        if (A(src, x, y) >= 128) continue;
        if (A(src, x - p.dx, y - p.dy) >= 128) { const i = I(out, x, y); out.d[i] = c[0]; out.d[i + 1] = c[1]; out.d[i + 2] = c[2]; out.d[i + 3] = k * 255; }
      }
      return out;
    },
  },
  {
    id: 'extrude', name: '押し出し厚み', category: 'decor', icon: '📦', desc: 'アイテムに厚みを付け3D風に',
    params: [
      { key: 'depth', label: '厚み', type: 'range', min: 1, max: 4, default: 1 },
      { key: 'dir', label: '方向', type: 'select', options: [['br', '右下'], ['b', '下'], ['bl', '左下']], default: 'br' },
      { key: 'shade', label: '側面の暗さ', type: 'range', min: 0, max: 100, default: 45 },
    ],
    apply(src, p) {
      const out = cloneTex(src);
      const [dx, dy] = p.dir === 'br' ? [1, 1] : p.dir === 'b' ? [0, 1] : [-1, 1];
      for (let d = p.depth; d >= 1; d--)
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          const sx = x - dx * d, sy = y - dy * d;
          if (A(out, x, y) >= 128 || A(src, sx, sy) < 128) continue;
          const s = I(src, sx, sy), i = I(out, x, y);
          const f = (p.shade / 100) * (0.7 + 0.3 * (d / p.depth));
          out.d[i] = darken(src.d[s], f); out.d[i + 1] = darken(src.d[s + 1], f); out.d[i + 2] = darken(src.d[s + 2], f); out.d[i + 3] = 255;
        }
      return out;
    },
  },
  {
    id: 'vignette', name: 'ビネット', category: 'decor', icon: '🔘', desc: '周辺を暗く（または色で）落として雰囲気を演出',
    params: [
      { key: 'strength', label: '強さ', type: 'range', min: 0, max: 100, default: 40 },
      { key: 'color', label: '色', type: 'color', default: '#000000' },
      { key: 'shape', label: '形', type: 'select', options: [['round', '円形'], ['square', '四角']], default: 'square' },
    ],
    apply(src, p) {
      const c = hexToRgb(p.color), k = p.strength / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const u = (x + 0.5) / src.w - 0.5, v = (y + 0.5) / src.h - 0.5;
        const d = p.shape === 'round' ? Math.hypot(u, v) * 1.414 : Math.max(Math.abs(u), Math.abs(v)) * 2;
        const f = Math.pow(clamp(d, 0, 1), 2.5) * k;
        return [mix(r, c[0], f), mix(g, c[1], f), mix(b, c[2], f)];
      });
    },
  },

  /* ---------------- ANIM ---------------- */
  {
    id: 'enchant', name: 'エンチャントの輝き', category: 'anim', icon: '🔮', desc: 'マイクラ風のエンチャントグリント',
    params: [
      { key: 'color', label: '色', type: 'color', default: '#a060ff' },
      { key: 'intensity', label: '強さ', type: 'range', min: 0, max: 100, default: 65 },
      { key: 'width', label: '帯の幅', type: 'range', min: 1, max: 10, default: 4 },
      { key: 'speed', label: '速さ', type: 'range', min: 1, max: 3, default: 1 },
      { key: 'dual', label: '二重の帯', type: 'bool', default: true },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.intensity / 100;
      const W = src.w;
      const bw = (p.width / 16);
      return map(src, (r, g, b, _a, x, y) => {
        const u = x / W, v = y / src.h;
        const band = (pos: number) => { const f = fract(pos); const d = Math.min(f, 1 - f); return Math.max(0, 1 - d / (bw * 0.5)); };
        let s = band(u + v * 0.5 - ctx.t * p.speed) ;
        if (p.dual) s = Math.max(s, band(u * 0.7 - v + ctx.t * p.speed + 0.37) * 0.7);
        const n = 0.6 + 0.4 * hash2(Math.floor(x / Math.max(1, W / 16)), Math.floor(y / Math.max(1, W / 16)), 99);
        const a = (0.25 + s * 0.9) * n * k;
        return [r + c[0] * a, g + c[1] * a, b + c[2] * a];
      });
    },
  },
  {
    id: 'shimmer', name: '光のスイープ', category: 'anim', icon: '💫', desc: '光の帯が表面を走り抜ける',
    params: [
      { key: 'color', label: '色', type: 'color', default: '#ffffff' },
      { key: 'width', label: '幅', type: 'range', min: 1, max: 8, default: 3 },
      { key: 'intensity', label: '強さ', type: 'range', min: 0, max: 100, default: 70 },
      { key: 'angle', label: '角度', type: 'select', options: [['d', '斜め'], ['h', '横'], ['v', '縦']], default: 'd' },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.intensity / 100;
      const bw = p.width / 16;
      return map(src, (r, g, b, _a, x, y) => {
        const u = x / src.w, v = y / src.h;
        const pos = p.angle === 'h' ? u : p.angle === 'v' ? v : (u + v) / 2;
        const center = -bw + ctx.t * (1 + 2 * bw) * 1.0;
        const d = Math.abs(pos - center);
        const a = d < bw ? (1 - d / bw) * k : 0;
        if (!a) return;
        const q = Math.round(a * 4) / 4;
        return [mix(r, c[0], q), mix(g, c[1], q), mix(b, c[2], q)];
      });
    },
  },
  {
    id: 'pulse', name: '明滅パルス', category: 'anim', icon: '💓', desc: '明るい部分がゆっくり脈打つ（鉱石・ランプに）',
    params: [
      { key: 'color', label: '色', type: 'color', default: '#ffe080' },
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 50 },
      { key: 'threshold', label: 'しきい値', type: 'range', min: 0, max: 250, default: 140 },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color);
      const s = (0.5 - 0.5 * Math.cos(ctx.t * Math.PI * 2)) * (p.amount / 100);
      return map(src, (r, g, b) => {
        const l = lum(r, g, b);
        if (l < p.threshold) return;
        const k = ((l - p.threshold) / (256 - p.threshold)) * s;
        return [r + c[0] * k, g + c[1] * k, b + c[2] * k];
      });
    },
  },
  {
    id: 'wave', name: '波打ち', category: 'anim', icon: '🌊', desc: '水面や熱気のように揺らめく',
    params: [
      { key: 'amp', label: '振幅', type: 'range', min: 0, max: 4, step: 1, default: 1 },
      { key: 'wavelength', label: '波長', type: 'range', min: 2, max: 32, default: 8 },
      { key: 'dir', label: '方向', type: 'select', options: [['h', '横揺れ'], ['v', '縦揺れ']], default: 'h' },
      { key: 'animate', label: 'アニメーション', type: 'bool', default: true },
      { key: 'wrap', label: '端の処理', type: 'select', options: WRAP_OPTS, default: 'auto' },
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const out = createTex(src.w, src.h);
      const wrap = useWrap(src, p.wrap);
      const amp = p.amp * Math.max(1, Math.round(src.w / 16));
      const wl = (p.wavelength * src.w) / 16;
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const t = p.animate ? ctx.t : 0;
        let sx = x, sy = y;
        if (p.dir === 'h') sx = x + Math.round(amp * Math.sin((y / wl + t) * Math.PI * 2));
        else sy = y + Math.round(amp * Math.sin((x / wl + t) * Math.PI * 2));
        if (!wrap && (sx < 0 || sy < 0 || sx >= src.w || sy >= src.h)) continue;
        const s = IW(src, sx, sy), o = I(out, x, y);
        out.d[o] = src.d[s]; out.d[o + 1] = src.d[s + 1]; out.d[o + 2] = src.d[s + 2]; out.d[o + 3] = src.d[s + 3];
      }
      return out;
    },
  },
  {
    id: 'flow', name: '流れる(水/溶岩)', category: 'anim', icon: '⏬', desc: 'テクスチャ全体をスクロール（流水・溶岩向け）',
    params: [
      { key: 'dir', label: '方向', type: 'select', options: [['down', '下'], ['up', '上'], ['left', '左'], ['right', '右'], ['diag', '斜め']], default: 'down' },
      { key: 'speed', label: '周回数', type: 'range', min: 1, max: 3, default: 1 },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = createTex(src.w, src.h);
      const o = ctx.t * p.speed;
      const ox = p.dir === 'left' ? o : p.dir === 'right' || p.dir === 'diag' ? -o : 0;
      const oy = p.dir === 'down' || p.dir === 'diag' ? -o : p.dir === 'up' ? o : 0;
      const dx = Math.round(ox * src.w), dy = Math.round(oy * src.h);
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const s = IW(src, x + dx, y + dy), i = I(out, x, y);
        out.d[i] = src.d[s]; out.d[i + 1] = src.d[s + 1]; out.d[i + 2] = src.d[s + 2]; out.d[i + 3] = src.d[s + 3];
      }
      return out;
    },
  },
  {
    id: 'embers', name: '火の粉/パーティクル', category: 'anim', icon: '🔥', desc: '舞い上がる火の粉・泡・雪・魂パーティクル',
    params: [
      { key: 'type', label: '種類', type: 'select', options: [['ember', '火の粉'], ['bubble', '泡'], ['snow', '雪'], ['soul', '魂'], ['spore', '胞子']], default: 'ember' },
      { key: 'count', label: '数', type: 'range', min: 1, max: 40, default: 10 },
      { key: 'onOpaque', label: '不透明部のみ', type: 'bool', default: false },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const R = rng(ctx.seed);
      const sets: Record<string, { c: string[]; dir: number; sway: number }> = {
        ember: { c: ['#ffdf60', '#ff9a30', '#ff5a1a'], dir: -1, sway: 1 },
        bubble: { c: ['#dff6ff', '#9fd8ff'], dir: -1, sway: 1 },
        snow: { c: ['#ffffff', '#e4f0ff'], dir: 1, sway: 2 },
        soul: { c: ['#7ff6ff', '#40c8e0', '#b0ffff'], dir: -1, sway: 1 },
        spore: { c: ['#ff7ad0', '#d05cff', '#ffc0f0'], dir: 1, sway: 1 },
      };
      const S = sets[p.type];
      const cols = S.c.map(hexToRgb);
      const sc = Math.max(1, Math.round(src.w / 16));
      for (let n = 0; n < p.count; n++) {
        const x0 = R() * src.w, ph = R(), ci = Math.floor(R() * cols.length), sp = R() < 0.5 ? 1 : 2;
        const t = fract(ctx.t * sp + ph);
        const y = Math.floor(S.dir < 0 ? src.h - 1 - t * src.h : t * src.h);
        const x = Math.floor(x0 + Math.sin((t + ph) * Math.PI * 2) * S.sway * sc);
        const a = p.type === 'ember' ? 1 - t * 0.7 : 0.9;
        for (let yy = 0; yy < sc; yy++) for (let xx = 0; xx < sc; xx++) {
          const px = mod(x + xx, src.w), py = y + yy;
          if (py < 0 || py >= src.h) continue;
          if (p.onOpaque && !A(src, px, py)) continue;
          if (p.type === 'bubble' && (xx + yy) % 2 === 1 && sc > 1) continue;
          blendAt(out, px, py, cols[ci], a);
        }
      }
      return out;
    },
  },
  {
    id: 'huecycle', name: '色相サイクル', category: 'anim', icon: '🎡', desc: '色相が一周するゲーミング発光',
    params: [
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 100 },
      { key: 'spread', label: '位置ずらし', type: 'range', min: 0, max: 100, default: 0 },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const k = p.amount / 100;
      return map(src, (r, g, b, _a, x, y) => {
        const [h, s, l] = rgbToHsl(r, g, b);
        const o = hslToRgb(h + ctx.t * 360 + ((x + y) / (src.w + src.h)) * 360 * (p.spread / 100), s, l);
        return [mix(r, o[0], k), mix(g, o[1], k), mix(b, o[2], k)];
      });
    },
  },
  {
    id: 'flicker', name: '炎のゆらぎ', category: 'anim', icon: '🕯️', desc: '松明のような不規則な明るさの揺らぎ',
    params: [
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 40 },
      { key: 'color', label: '光の色', type: 'color', default: '#ffb050' },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color);
      const f = (Math.sin(ctx.t * Math.PI * 2) * 0.5 + Math.sin(ctx.t * Math.PI * 6 + 1) * 0.3 + Math.sin(ctx.t * Math.PI * 10 + 2) * 0.2) * (p.amount / 100);
      return map(src, (r, g, b, _a, _x, y) => {
        const v = y / src.h;
        const k = f * (0.4 + 0.6 * v);
        return k > 0 ? [r + c[0] * k * 0.5, g + c[1] * k * 0.5, b + c[2] * k * 0.5] : [darken(r, -k * 0.5), darken(g, -k * 0.5), darken(b, -k * 0.5)];
      });
    },
  },

  /* ---------------- TRANSFORM ---------------- */
  {
    id: 'upscale', name: '高解像度化(HD)', category: 'transform', icon: '🔍', desc: 'Scale2x/EPXで滑らかにHD化（以降のエフェクトが高精細に）',
    params: [
      { key: 'method', label: '方式', type: 'select', options: [['scale2x', 'Scale2x(EPX)'], ['nearest', 'ニアレスト']], default: 'scale2x' },
      { key: 'factor', label: '倍率', type: 'select', options: [['2', '×2'], ['4', '×4'], ['8', '×8']], default: '2' },
    ],
    apply(src, p) {
      const f = parseInt(p.factor);
      if (src.w * f > 1024) return src;
      if (p.method === 'nearest') return nearestScale(src, f);
      let t = src;
      for (let k = 1; k < f; k *= 2) t = scale2x(t);
      return t;
    },
  },
  {
    id: 'transform', name: '反転/回転', category: 'transform', icon: '🔄', desc: '左右・上下反転と90°回転',
    params: [
      { key: 'flipH', label: '左右反転', type: 'bool', default: true },
      { key: 'flipV', label: '上下反転', type: 'bool', default: false },
      { key: 'rotate', label: '回転', type: 'select', options: [['0', '0°'], ['90', '90°'], ['180', '180°'], ['270', '270°']], default: '0' },
    ],
    apply(src, p) {
      const rot = parseInt(p.rotate);
      const sw = rot % 180 ? src.h : src.w, sh = rot % 180 ? src.w : src.h;
      const out = createTex(sw, sh);
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        let sx = x, sy = y;
        if (rot === 90) { sx = y; sy = src.h - 1 - x; }
        else if (rot === 180) { sx = src.w - 1 - x; sy = src.h - 1 - y; }
        else if (rot === 270) { sx = src.w - 1 - y; sy = x; }
        if (p.flipH) sx = src.w - 1 - sx;
        if (p.flipV) sy = src.h - 1 - sy;
        const s = I(src, sx, sy), o = I(out, x, y);
        out.d[o] = src.d[s]; out.d[o + 1] = src.d[s + 1]; out.d[o + 2] = src.d[s + 2]; out.d[o + 3] = src.d[s + 3];
      }
      return out;
    },
  },
  {
    id: 'mirror', name: '対称化', category: 'transform', icon: '🪞', desc: '左右/上下/四方向に対称コピー',
    params: [{ key: 'mode', label: 'モード', type: 'select', options: [['lr', '左→右'], ['rl', '右→左'], ['tb', '上→下'], ['quad', '四方対称']], default: 'lr' }],
    apply(src, p) {
      const out = cloneTex(src);
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        let sx = x, sy = y;
        if ((p.mode === 'lr' || p.mode === 'quad') && x >= src.w / 2) sx = src.w - 1 - x;
        if (p.mode === 'rl' && x < src.w / 2) sx = src.w - 1 - x;
        if ((p.mode === 'tb' || p.mode === 'quad') && y >= src.h / 2) sy = src.h - 1 - y;
        const s = I(src, sx, sy), o = I(out, x, y);
        out.d[o] = src.d[s]; out.d[o + 1] = src.d[s + 1]; out.d[o + 2] = src.d[s + 2]; out.d[o + 3] = src.d[s + 3];
      }
      return out;
    },
  },
  {
    id: 'offset', name: 'オフセット', category: 'transform', icon: '↔️', desc: 'ループさせてずらす（継ぎ目チェック）',
    params: [
      { key: 'dx', label: 'X(%)', type: 'range', min: -100, max: 100, default: 50 },
      { key: 'dy', label: 'Y(%)', type: 'range', min: -100, max: 100, default: 50 },
    ],
    apply(src, p) {
      const out = createTex(src.w, src.h);
      const dx = Math.round((p.dx / 100) * src.w), dy = Math.round((p.dy / 100) * src.h);
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const s = IW(src, x - dx, y - dy), o = I(out, x, y);
        out.d[o] = src.d[s]; out.d[o + 1] = src.d[s + 1]; out.d[o + 2] = src.d[s + 2]; out.d[o + 3] = src.d[s + 3];
      }
      return out;
    },
  },
  {
    id: 'seamless', name: 'シームレス化', category: 'transform', icon: '♾️', desc: '端を馴染ませて継ぎ目のないタイルに',
    params: [{ key: 'width', label: '馴染ませ幅(%)', type: 'range', min: 5, max: 50, default: 20 }],
    apply(src, p) {
      const out = cloneTex(src);
      const bw = Math.max(1, Math.round((p.width / 100) * src.w)), bh = Math.max(1, Math.round((p.width / 100) * src.h));
      const tmp = cloneTex(src);
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const dx = Math.min(x, src.w - 1 - x);
        if (dx >= bw) continue;
        const k = 0.5 * (1 - dx / bw);
        const i = I(src, x, y), j = I(src, src.w - 1 - x, y);
        for (let q = 0; q < 4; q++) tmp.d[i + q] = mix(src.d[i + q], src.d[j + q], k);
      }
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const dy = Math.min(y, src.h - 1 - y);
        const i = I(src, x, y);
        if (dy >= bh) { for (let q = 0; q < 4; q++) out.d[i + q] = tmp.d[i + q]; continue; }
        const k = 0.5 * (1 - dy / bh);
        const j = I(src, x, src.h - 1 - y);
        for (let q = 0; q < 4; q++) out.d[i + q] = mix(tmp.d[i + q], tmp.d[j + q], k);
      }
      return out;
    },
  },
  {
    id: 'edgewear', name: 'エッジ摩耗', category: 'texture', icon: '✦', desc: '輪郭や素材の境界を摩耗させ、ハイライトを入れる', isNew: true,
    params: [
      { key: 'color', label: '露出する色', type: 'color', default: '#d5c6a0' },
      { key: 'amount', label: '摩耗量', type: 'range', min: 0, max: 100, default: 55 },
      { key: 'width', label: '境界幅', type: 'range', min: 1, max: 4, default: 1 },
      { key: 'roughness', label: 'ムラ', type: 'range', min: 0, max: 100, default: 50 },
    ],
    apply(src, p, ctx) {
      const col = hexToRgb(p.color);
      const transparent = !isOpaqueTex(src);
      const df = transparent ? distanceField(src, (x, y) => A(src, x, y) < 128, true) : null;
      const getLum = (x: number, y: number) => {
        const i = IW(src, x, y);
        return lum(src.d[i], src.d[i + 1], src.d[i + 2]);
      };
      return map(src, (r, g, b, _a, x, y) => {
        const edge = transparent ? Math.max(0, 1 - ((df![y * src.w + x] - 1) / p.width)) :
          Math.min(1, (Math.abs(getLum(x - 1, y) - getLum(x + 1, y)) + Math.abs(getLum(x, y - 1) - getLum(x, y + 1))) / 125);
        const grain = hash2(x, y, ctx.seed);
        const mask = grain < (1 - p.roughness / 100) + edge * p.roughness / 100 ? edge : 0;
        const k = mask * p.amount / 100;
        return [mix(r, col[0], k), mix(g, col[1], k), mix(b, col[2], k)];
      });
    },
  },
  {
    id: 'weave', name: '織物・編み目', category: 'texture', icon: '▤', desc: '布、カーペット、革のような繊維と交差した陰影', isNew: true,
    params: [
      { key: 'size', label: '糸の太さ', type: 'range', min: 1, max: 5, default: 2 },
      { key: 'depth', label: '凹凸', type: 'range', min: 0, max: 100, default: 38 },
      { key: 'style', label: '織り方', type: 'select', options: [['plain', '平織り'], ['twill', '綾織り'], ['leather', '革シボ']], default: 'plain' },
    ],
    apply(src, p, ctx) {
      const size = Math.max(1, Math.round(p.size * Math.max(1, src.w / 32)));
      const depth = p.depth / 100;
      return map(src, (r, g, b, _a, x, y) => {
        let height: number;
        if (p.style === 'leather') {
          height = (hash2(Math.floor(x / size), Math.floor(y / size), ctx.seed) - 0.5) * 1.4;
        } else {
          const cx = Math.floor(x / size), cy = Math.floor(y / size);
          const crossing = p.style === 'twill' ? (cx + cy * 2) % 3 === 0 : (cx + cy) % 2 === 0;
          height = (crossing ? 0.45 : -0.45) + ((x % size === 0 || y % size === 0) ? -0.32 : 0.12);
        }
        const v = height * depth;
        return v > 0 ? [lighten(r, v), lighten(g, v), lighten(b, v)] : [darken(r, -v), darken(g, -v), darken(b, -v)];
      });
    },
  },
  {
    id: 'veins', name: '鉱脈・大理石', category: 'texture', icon: '〰', desc: '継ぎ目のない鉱脈、石目、魔力の筋を刻む', isNew: true,
    params: [
      { key: 'color', label: '筋の色', type: 'color', default: '#e6d2ad' },
      { key: 'density', label: '密度', type: 'range', min: 2, max: 12, default: 5 },
      { key: 'width', label: '幅', type: 'range', min: 1, max: 6, default: 2 },
      { key: 'distort', label: 'うねり', type: 'range', min: 0, max: 100, default: 45 },
      { key: 'amount', label: '濃さ', type: 'range', min: 0, max: 100, default: 70 },
    ],
    apply(src, p, ctx) {
      const col = hexToRgb(p.color);
      const noise = fbm(ctx.seed, src.w, src.h, 4, 3);
      return map(src, (r, g, b, _a, x, y) => {
        const u = x / src.w, v = y / src.h;
        // Integer frequencies keep opposing tile edges continuous.
        const field = Math.sin(Math.PI * 2 * (u * p.density + v * Math.max(1, Math.floor(p.density / 2)) +
          (noise(x, y) - 0.5) * (p.distort / 100) * 2));
        const band = Math.max(0, 1 - Math.abs(field) * (8 / p.width));
        const k = band * p.amount / 100;
        return [mix(r, col[0], k), mix(g, col[1], k), mix(b, col[2], k)];
      });
    },
  },
  {
    id: 'iridescent', name: '玉虫色コーティング', category: 'decor', icon: '◇', desc: '光を受けた面だけ色が変わる真珠・オパール風の艶', isNew: true,
    params: [
      { key: 'color', label: 'ベース色', type: 'color', default: '#84e6dc' },
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 55 },
      { key: 'frequency', label: '色の幅', type: 'range', min: 1, max: 5, default: 2 },
      { key: 'animate', label: '光を動かす', type: 'bool', default: false },
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const [h] = rgbToHsl(...hexToRgb(p.color));
      const noise = fbm(ctx.seed, src.w, src.h, 3, 2);
      return map(src, (r, g, b, _a, x, y) => {
        const l = lum(r, g, b) / 255;
        const phase = ((x / src.w + y / src.h) * 0.5 + noise(x, y) * 0.45 + (p.animate ? ctx.t : 0)) * p.frequency;
        const hue = h + Math.sin(phase * Math.PI * 2) * 90;
        const c = hslToRgb(hue, 0.75, Math.min(0.9, 0.25 + l * 0.65));
        const k = (p.amount / 100) * (0.25 + 0.75 * l);
        return [mix(r, c[0], k), mix(g, c[1], k), mix(b, c[2], k)];
      });
    },
  },

  /* ---------------- NEW ANIMATIONS ---------------- */
  {
    id: 'slash', name: '斬撃軌跡', category: 'anim', icon: '⚔️', desc: '斜めに走る斬撃の残像（ヒットフレーム向き）', isNew: true,
    params: [
      { key: 'color', label: '色', type: 'color', default: '#ffffff' },
      { key: 'width', label: '幅', type: 'range', min: 1, max: 6, default: 2 },
      { key: 'intensity', label: '強さ', type: 'range', min: 0, max: 100, default: 85 },
      { key: 'dir', label: '方向', type: 'select', options: [['tlbr', '＼'], ['trbl', '／'], ['h', '横'], ['v', '縦']], default: 'tlbr' },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.intensity / 100;
      const bw = p.width / 16;
      return map(src, (r, g, b, a, x, y) => {
        const u = x / src.w, v = y / src.h;
        const pos = p.dir === 'h' ? u : p.dir === 'v' ? v : p.dir === 'trbl' ? (1 - u + v) / 2 : (u + v) / 2;
        const center = -bw + ctx.t * (1 + 2 * bw);
        const d = Math.abs(pos - center);
        const hit = d < bw ? (1 - d / bw) * k : 0;
        if (hit < 0.04) return;
        const q = Math.round(hit * 5) / 5;
        if (a < 8) return [c[0], c[1], c[2], q * 200];
        return [mix(r, c[0], q), mix(g, c[1], q), mix(b, c[2], q)];
      }, false);
    },
  },
  {
    id: 'shockwave', name: '衝撃波', category: 'anim', icon: '💥', desc: '中心から広がる円形の衝撃波', isNew: true,
    params: [
      { key: 'color', label: '色', type: 'color', default: '#ffe080' },
      { key: 'width', label: '輪の太さ', type: 'range', min: 1, max: 6, default: 2 },
      { key: 'intensity', label: '強さ', type: 'range', min: 0, max: 100, default: 80 },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.intensity / 100;
      const bw = p.width / 12;
      const radius = ctx.t * 0.85;
      return map(src, (r, g, b, a, x, y) => {
        const d = Math.hypot((x + 0.5) / src.w - 0.5, (y + 0.5) / src.h - 0.5) * 1.5;
        const ring = Math.max(0, 1 - Math.abs(d - radius) / bw);
        if (ring < 0.05) return;
        const q = Math.round(ring * k * 4) / 4;
        if (a < 8) return [c[0], c[1], c[2], q * 220];
        return [mix(r, c[0], q), mix(g, c[1], q), mix(b, c[2], q)];
      }, false);
    },
  },
  {
    id: 'lightning', name: '雷撃', category: 'anim', icon: '⚡', desc: 'ランダムな稲妻が走る（命中演出）', isNew: true,
    params: [
      { key: 'color', label: '色', type: 'color', default: '#fff060' },
      { key: 'bolts', label: '本数', type: 'range', min: 1, max: 6, default: 2 },
      { key: 'intensity', label: '強さ', type: 'range', min: 0, max: 100, default: 90 },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color), k = p.intensity / 100;
      const wrap = isOpaqueTex(src);
      const flash = Math.sin(ctx.t * Math.PI * 8) > 0.15;
      if (!flash) return out;
      const R = rng((ctx.seed + Math.floor(ctx.t * 12)) | 0);
      for (let n = 0; n < p.bolts; n++) {
        let x = Math.floor(R() * src.w), y = 0;
        const len = src.h + src.w;
        for (let s = 0; s < len; s++) {
          blendAt(out, x, y, c, k, wrap);
          if (R() < 0.45) x += R() < 0.5 ? 1 : -1;
          y += 1;
          if (y >= src.h) break;
          if (R() < 0.12) {
            let bx = x, by = y;
            for (let b = 0; b < 4; b++) { bx += R() < 0.5 ? 1 : -1; by += 1; blendAt(out, bx, by, c, k * 0.7, wrap); }
          }
        }
      }
      return out;
    },
  },
  {
    id: 'orbit', name: '周回オーブ', category: 'anim', icon: '🔮', desc: '周囲を回る魔力オーブ', isNew: true,
    params: [
      { key: 'color', label: '色', type: 'color', default: '#80e0ff' },
      { key: 'count', label: '数', type: 'range', min: 1, max: 6, default: 3 },
      { key: 'radius', label: '半径(%)', type: 'range', min: 20, max: 80, default: 45 },
      { key: 'size', label: '大きさ', type: 'range', min: 1, max: 4, default: 2 },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const wrap = isOpaqueTex(src);
      const rad = (p.radius / 100) * Math.min(src.w, src.h) * 0.5;
      const cx = src.w / 2, cy = src.h / 2;
      for (let n = 0; n < p.count; n++) {
        const ang = (ctx.t + n / p.count) * Math.PI * 2;
        const px = Math.round(cx + Math.cos(ang) * rad);
        const py = Math.round(cy + Math.sin(ang) * rad);
        const s = p.size;
        for (let yy = -s; yy <= s; yy++) for (let xx = -s; xx <= s; xx++) {
          if (xx * xx + yy * yy > s * s) continue;
          const a = 1 - Math.hypot(xx, yy) / (s + 0.5);
          blendAt(out, px + xx, py + yy, c, a, wrap);
        }
      }
      return out;
    },
  },
  {
    id: 'ripple', name: '魔法陣リップル', category: 'anim', icon: '🌀', desc: '同心円が広がる詠唱エフェクト', isNew: true,
    params: [
      { key: 'color', label: '色', type: 'color', default: '#c080ff' },
      { key: 'rings', label: '輪の数', type: 'range', min: 1, max: 4, default: 2 },
      { key: 'intensity', label: '強さ', type: 'range', min: 0, max: 100, default: 70 },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.intensity / 100;
      return map(src, (r, g, b, a, x, y) => {
        const d = Math.hypot((x + 0.5) / src.w - 0.5, (y + 0.5) / src.h - 0.5) * 2;
        let hit = 0;
        for (let n = 0; n < p.rings; n++) {
          const phase = fract(d * 2 - ctx.t + n / p.rings);
          hit = Math.max(hit, Math.max(0, 1 - Math.abs(phase - 0.5) * 10));
        }
        if (hit < 0.08) return;
        const q = hit * k;
        if (a < 8) return [c[0], c[1], c[2], q * 180];
        return [mix(r, c[0], q), mix(g, c[1], q), mix(b, c[2], q)];
      }, false);
    },
  },
  {
    id: 'afterimage', name: '残像', category: 'anim', icon: '👻', desc: '半透明の残像が斜めに残る（高速移動）', isNew: true,
    params: [
      { key: 'dir', label: '方向', type: 'select', options: [['nw', '左上'], ['ne', '右上'], ['sw', '左下'], ['se', '右下']], default: 'nw' },
      { key: 'steps', label: '残像数', type: 'range', min: 1, max: 4, default: 2 },
      { key: 'amount', label: '濃さ', type: 'range', min: 0, max: 100, default: 45 },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const dirs: Record<string, [number, number]> = { nw: [-1, -1], ne: [1, -1], sw: [-1, 1], se: [1, 1] };
      const [dx, dy] = dirs[p.dir];
      const sc = Math.max(1, Math.round(src.w / 16));
      const shift = Math.round((0.3 + 0.7 * Math.sin(ctx.t * Math.PI * 2)) * sc);
      for (let s = p.steps; s >= 1; s--) {
        const ox = dx * shift * s, oy = dy * shift * s, a = (p.amount / 100) * (1 - (s - 1) / p.steps) * 0.55;
        for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
          const sx = x - ox, sy = y - oy;
          if (sx < 0 || sy < 0 || sx >= src.w || sy >= src.h) continue;
          const si = I(src, sx, sy);
          if (src.d[si + 3] < 128) continue;
          const oi = I(out, x, y);
          if (out.d[oi + 3] >= 128) continue;
          out.d[oi] = src.d[si]; out.d[oi + 1] = src.d[si + 1]; out.d[oi + 2] = src.d[si + 2];
          out.d[oi + 3] = a * 255;
        }
      }
      return out;
    },
  },
  {
    id: 'scanline', name: '走査線', category: 'anim', icon: '📺', desc: 'レトロなCRT走査線が流れる', isNew: true,
    params: [
      { key: 'color', label: '色', type: 'color', default: '#40ff80' },
      { key: 'gap', label: '間隔', type: 'range', min: 2, max: 8, default: 3 },
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 40 },
      { key: 'animate', label: 'スクロール', type: 'bool', default: true },
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.amount / 100;
      const off = p.animate ? Math.floor(ctx.t * src.h) : 0;
      return map(src, (r, g, b, _a, _x, y) => {
        if ((y + off) % p.gap !== 0) return;
        return [mix(r, c[0], k), mix(g, c[1], k), mix(b, c[2], k)];
      });
    },
  },
  {
    id: 'glitch', name: 'グリッチ', category: 'anim', icon: '📺', desc: 'RGBずらしとスライスずれ（サイバー）', isNew: true,
    params: [
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 50 },
      { key: 'slices', label: 'スライス数', type: 'range', min: 2, max: 10, default: 4 },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = createTex(src.w, src.h);
      const amp = Math.round((p.amount / 100) * src.w * 0.15);
      const R = rng(ctx.seed + Math.floor(ctx.t * 8));
      const sliceH = Math.max(1, Math.floor(src.h / p.slices));
      for (let y = 0; y < src.h; y++) {
        const slice = Math.floor(y / sliceH);
        const ox = Math.round((hash2(slice, Math.floor(ctx.t * 8), ctx.seed) - 0.5) * 2 * amp);
        const ch = R() < 0.3 ? 1 : 0;
        for (let x = 0; x < src.w; x++) {
          const s = IW(src, x - ox, y), o = I(out, x, y);
          out.d[o] = src.d[s]; out.d[o + 1] = src.d[s + 1]; out.d[o + 2] = src.d[s + 2]; out.d[o + 3] = src.d[s + 3];
          if (ch && src.d[s + 3]) {
            out.d[o] = clamp(src.d[s] * 1.4);
            out.d[o + 2] = clamp(src.d[s + 2] * 0.6);
          }
        }
      }
      return out;
    },
  },
  {
    id: 'breathe', name: '呼吸スケール', category: 'anim', icon: '😮‍💨', desc: '輪郭がわずかに伸縮する生命感', isNew: true,
    params: [
      { key: 'amount', label: '振幅', type: 'range', min: 1, max: 4, default: 1 },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = createTex(src.w, src.h);
      const s = 1 + Math.sin(ctx.t * Math.PI * 2) * (p.amount * 0.03);
      const cx = src.w / 2, cy = src.h / 2;
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const sx = Math.round(cx + (x - cx) / s);
        const sy = Math.round(cy + (y - cy) / s);
        if (sx < 0 || sy < 0 || sx >= src.w || sy >= src.h) continue;
        const si = I(src, sx, sy), o = I(out, x, y);
        out.d[o] = src.d[si]; out.d[o + 1] = src.d[si + 1]; out.d[o + 2] = src.d[si + 2]; out.d[o + 3] = src.d[si + 3];
      }
      return out;
    },
  },
  {
    id: 'sparks', name: '衝突スパーク', category: 'anim', icon: '✨', desc: 'ヒット時に飛び散る火花', isNew: true,
    params: [
      { key: 'color', label: '色', type: 'color', default: '#ffe060' },
      { key: 'count', label: '数', type: 'range', min: 4, max: 20, default: 10 },
    ],
    animated: () => true,
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const wrap = isOpaqueTex(src);
      const R = rng(ctx.seed);
      const burst = Math.max(0, Math.sin(ctx.t * Math.PI * 2));
      for (let n = 0; n < p.count; n++) {
        const ang = R() * Math.PI * 2;
        const dist = burst * (0.3 + R() * 0.7) * Math.min(src.w, src.h) * 0.5;
        const px = Math.round(src.w / 2 + Math.cos(ang) * dist);
        const py = Math.round(src.h / 2 + Math.sin(ang) * dist);
        blendAt(out, px, py, c, burst, wrap);
        if (burst > 0.5) blendAt(out, px + Math.round(Math.cos(ang)), py + Math.round(Math.sin(ang)), c, burst * 0.6, wrap);
      }
      return out;
    },
  },

  /* ---------------- NEW DECOR / TEXTURE ---------------- */
  {
    id: 'bloodstain', name: '血しぶき', category: 'decor', icon: '🩸', desc: '刃や表面に血の飛沫を付ける', isNew: true,
    params: [
      { key: 'color', label: '色', type: 'color', default: '#7a1018' },
      { key: 'count', label: '飛沫の数', type: 'range', min: 2, max: 20, default: 8 },
      { key: 'drip', label: '垂れ', type: 'bool', default: true },
    ],
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const wrap = isOpaqueTex(src);
      const R = rng(ctx.seed);
      for (let n = 0; n < p.count; n++) {
        let x = Math.floor(R() * src.w), y = Math.floor(R() * src.h);
        if (!A(src, x, y) && !wrap) continue;
        blendAt(out, x, y, c, 0.9, wrap);
        if (R() < 0.6) blendAt(out, x + 1, y, c, 0.6, wrap);
        if (p.drip) {
          const len = 1 + Math.floor(R() * 4);
          for (let d = 1; d <= len; d++) blendAt(out, x, y + d, c, 0.8 - d * 0.15, wrap);
        }
      }
      return out;
    },
  },
  {
    id: 'scratches', name: '刀傷', category: 'texture', icon: '⚔️', desc: '細い斜めの傷を刻む', isNew: true,
    params: [
      { key: 'count', label: '本数', type: 'range', min: 1, max: 12, default: 4 },
      { key: 'color', label: '色', type: 'color', default: '#d8d0c0' },
      { key: 'depth', label: '濃さ', type: 'range', min: 0, max: 100, default: 55 },
    ],
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color), k = p.depth / 100;
      const wrap = isOpaqueTex(src);
      const R = rng(ctx.seed);
      for (let n = 0; n < p.count; n++) {
        let x = Math.floor(R() * src.w), y = Math.floor(R() * src.h);
        const dx = R() < 0.5 ? 1 : -1, dy = 1;
        const len = 3 + Math.floor(R() * Math.min(src.w, src.h) * 0.5);
        for (let s = 0; s < len; s++) {
          if (A(src, wrap ? mod(x, src.w) : x, wrap ? mod(y, src.h) : y)) blendAt(out, x, y, c, k, wrap);
          x += dx; y += dy;
        }
      }
      return out;
    },
  },
  {
    id: 'chainmail', name: '鎖帷子', category: 'texture', icon: '⛓️', desc: '鎖の編み目を重ねる', isNew: true,
    params: [
      { key: 'color', label: '色', type: 'color', default: '#8a9098' },
      { key: 'size', label: '輪の大きさ', type: 'range', min: 2, max: 6, default: 3 },
      { key: 'amount', label: '濃さ', type: 'range', min: 0, max: 100, default: 55 },
    ],
    apply(src, p) {
      const c = hexToRgb(p.color), k = p.amount / 100, s = p.size;
      return map(src, (r, g, b, _a, x, y) => {
        const ox = (Math.floor(y / s) % 2) * Math.floor(s / 2);
        const cx = mod(x - ox, s * 2) - s, cy = mod(y, s) - s / 2;
        const d = Math.abs(Math.hypot(cx, cy) - s * 0.55);
        if (d > 0.7) return;
        const shade = d < 0.35 ? 1.15 : 0.75;
        return [mix(r, c[0] * shade, k), mix(g, c[1] * shade, k), mix(b, c[2] * shade, k)];
      });
    },
  },
  {
    id: 'leather', name: '革巻き', category: 'texture', icon: '👜', desc: '柄や表面を革のシワで覆う', isNew: true,
    params: [
      { key: 'color', label: '色', type: 'color', default: '#6b4226' },
      { key: 'amount', label: '強さ', type: 'range', min: 0, max: 100, default: 70 },
      { key: 'wrinkles', label: 'シワ', type: 'range', min: 1, max: 8, default: 3 },
    ],
    apply(src, p, ctx) {
      const c = hexToRgb(p.color), k = p.amount / 100;
      const n = fbm(ctx.seed, src.w, src.h, p.wrinkles, 3);
      return map(src, (r, g, b, _a, x, y) => {
        const v = n(x, y);
        const shade = 0.7 + 0.5 * v;
        const o = c.map((cv) => cv * shade);
        return [mix(r, o[0], k), mix(g, o[1], k), mix(b, o[2], k)];
      });
    },
  },
  {
    id: 'geminset', name: '宝石象嵌', category: 'decor', icon: '💠', desc: '中央や四隅にカット宝石を埋め込む', isNew: true,
    params: [
      { key: 'color', label: '宝石色', type: 'color', default: '#d02040' },
      { key: 'pos', label: '位置', type: 'select', options: [['c', '中央'], ['tl', '左上'], ['tr', '右上'], ['bl', '左下'], ['br', '右下']], default: 'c' },
      { key: 'size', label: '大きさ', type: 'range', min: 2, max: 8, default: 3 },
    ],
    apply(src, p) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const light = c.map((v) => lighten(v, 0.5)) as [number, number, number];
      const dark = c.map((v) => darken(v, 0.4)) as [number, number, number];
      const s = p.size;
      let cx = Math.floor(src.w / 2), cy = Math.floor(src.h / 2);
      if (p.pos.includes('l')) cx = s + 1; if (p.pos.includes('r')) cx = src.w - s - 2;
      if (p.pos.includes('t')) cy = s + 1; if (p.pos.includes('b')) cy = src.h - s - 2;
      for (let y = -s; y <= s; y++) for (let x = -s; x <= s; x++) {
        const md = Math.abs(x) + Math.abs(y);
        if (md > s) continue;
        const col = (x + y < 0) ? light : (x + y > 1) ? dark : c;
        const px = cx + x, py = cy + y;
        if (px < 0 || py < 0 || px >= src.w || py >= src.h) continue;
        const i = I(out, px, py);
        out.d[i] = col[0]; out.d[i + 1] = col[1]; out.d[i + 2] = col[2]; out.d[i + 3] = 255;
      }
      return out;
    },
  },
  {
    id: 'ribbon', name: 'リボン/飾り紐', category: 'decor', icon: '🎀', desc: '柄から垂れる飾り紐', isNew: true,
    params: [
      { key: 'color', label: '色', type: 'color', default: '#c02040' },
      { key: 'side', label: '位置', type: 'select', options: [['l', '左'], ['r', '右'], ['both', '両側']], default: 'l' },
    ],
    apply(src, p) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const dark = c.map((v) => darken(v, 0.35)) as [number, number, number];
      const sc = Math.max(1, Math.round(src.w / 16));
      const draw = (x0: number, dir: number) => {
        let x = x0, y = Math.floor(src.h * 0.55);
        for (let s = 0; s < src.h * 0.4; s++) {
          blendAt(out, x, y, s % 3 === 0 ? dark : c, 0.95);
          for (let w = 1; w < sc; w++) blendAt(out, x + w * dir, y, c, 0.85);
          y += 1;
          if (s % 3 === 2) x += dir;
        }
      };
      if (p.side !== 'r') draw(Math.floor(src.w * 0.25), -1);
      if (p.side !== 'l') draw(Math.floor(src.w * 0.7), 1);
      return out;
    },
  },
  {
    id: 'halo', name: '後光', category: 'decor', icon: '😇', desc: '背後に聖なる光輪', isNew: true,
    params: [
      { key: 'color', label: '色', type: 'color', default: '#ffe080' },
      { key: 'radius', label: '半径', type: 'range', min: 2, max: 10, default: 5 },
      { key: 'pulse', label: '脈動', type: 'bool', default: true },
    ],
    animated: (p) => p.pulse,
    apply(src, p, ctx) {
      const out = cloneTex(src);
      const c = hexToRgb(p.color);
      const k = p.pulse ? 0.55 + 0.45 * Math.sin(ctx.t * Math.PI * 2) : 1;
      const cx = src.w / 2, cy = src.h * 0.35;
      const R = p.radius * Math.max(1, src.w / 16);
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const d = Math.hypot(x - cx, y - cy);
        const ring = Math.max(0, 1 - Math.abs(d - R) / 1.4);
        if (ring < 0.1) continue;
        const i = I(out, x, y);
        if (src.d[i + 3] >= 128) continue;
        out.d[i] = c[0]; out.d[i + 1] = c[1]; out.d[i + 2] = c[2];
        out.d[i + 3] = ring * k * 200;
      }
      return out;
    },
  },

  /* ---------------- PARTS STAMP ---------------- */
  {
    id: 'partstamp', name: 'パーツ重ね', category: 'parts', icon: '🧩', desc: '刃・鍔・宝石・翼・オーラ等のドットパーツを重ねる', isNew: true,
    params: [
      { key: 'part', label: 'パーツ', type: 'select', options: PARTS.map((pt) => [pt.id, `${pt.icon} ${pt.name}`] as [string, string]), default: PARTS[0].id },
      { key: 'blend', label: '合成', type: 'select', options: [['over', '上に'], ['under', '下に'], ['add', '加算'], ['multiply', '乗算'], ['screen', 'スクリーン']], default: 'over' },
      { key: 'amount', label: '不透明度', type: 'range', min: 0, max: 100, default: 100 },
      { key: 'recolor', label: '再着色', type: 'color', default: '#ffffff' },
      { key: 'useRecolor', label: '再着色する', type: 'bool', default: false },
      { key: 'animate', label: 'オーラ/炎を動かす', type: 'bool', default: false },
    ],
    animated: (p) => p.animate,
    apply(src, p, ctx) {
      const def = PART_MAP[p.part];
      if (!def) return src;
      const rec = p.useRecolor ? p.recolor : undefined;
      let t = stampPart(src, def, p.blend as BlendMode, p.amount, rec);
      if (p.animate && (def.category === 'aura' || def.category === 'flame' || def.category === 'eye')) {
        // pulse overlay
        t = map(t, (r, g, b, a, x, y) => {
          if (a < 8) return;
          const n = hash2(x, y, ctx.seed);
          const pulse = 0.75 + 0.25 * Math.sin((ctx.t + n) * Math.PI * 2);
          return [r * pulse, g * pulse, b * pulse];
        });
      }
      return t;
    },
  },
];

export const EFFECT_MAP: Record<string, EffectDef> = Object.fromEntries(EFFECTS.map((e) => [e.id, e]));

export const defaultParams = (def: EffectDef): Params => Object.fromEntries(def.params.map((p) => [p.key, p.default]));

export interface Layer {
  id: string;
  type: string;
  params: Params;
  enabled: boolean;
  opacity: number; // 0..100
  seed: number;
}

let _id = 0;
export const newLayer = (type: string, params?: Params, seed?: number): Layer => {
  const def = EFFECT_MAP[type];
  return {
    id: `L${Date.now().toString(36)}${(_id++).toString(36)}`,
    type,
    params: { ...defaultParams(def), ...(params || {}) },
    enabled: true,
    opacity: 100,
    seed: seed ?? Math.floor(Math.random() * 99999),
  };
};

export const isLayerAnimated = (l: Layer) => {
  const def = EFFECT_MAP[l.type];
  return !!(l.enabled && def?.animated && def.animated(l.params));
};

export function applyStack(base: Tex, layers: Layer[], t: number, upto = layers.length): Tex {
  let cur = base;
  for (let li = 0; li < upto; li++) {
    const l = layers[li];
    if (!l.enabled) continue;
    const def = EFFECT_MAP[l.type];
    if (!def) continue;
    let next: Tex;
    try {
      next = def.apply(cur, l.params, { seed: l.seed, t });
    } catch (e) {
      console.error(e);
      continue;
    }
    if (l.opacity < 100 && next.w === cur.w && next.h === cur.h) {
      const k = l.opacity / 100;
      const o = cloneTex(next);
      for (let i = 0; i < o.d.length; i++) o.d[i] = cur.d[i] + (next.d[i] - cur.d[i]) * k;
      next = o;
    }
    cur = next;
  }
  return cur;
}

/** random decoration generator */
export function randomLayers(): Layer[] {
  const R = Math.random;
  const pick = <T,>(a: T[]) => a[Math.floor(R() * a.length)];
  const hue = () => {
    const [r, g, b] = hslToRgb(R() * 360, 0.6 + R() * 0.4, 0.45 + R() * 0.25);
    return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  };
  const out: Layer[] = [];
  const colorFx = pick(['gradmap', 'tint', 'adjust', 'palette', 'metal']);
  if (colorFx === 'gradmap') out.push(newLayer('gradmap', { c1: '#120818', c2: hue(), c3: '#fff8e0' }));
  else if (colorFx === 'tint') out.push(newLayer('tint', { color: hue(), amount: 40 + R() * 40 }));
  else if (colorFx === 'adjust') out.push(newLayer('adjust', { hue: Math.round(R() * 360 - 180), saturation: 20, contrast: 15 }));
  else if (colorFx === 'palette') out.push(newLayer('palette', { palette: pick(Object.keys(PALETTES)) }));
  else out.push(newLayer('metal', { color: hue() }));
  const tex = pick(['weather', 'cracks', 'noise', 'autoshade', 'pattern', 'ore', 'frost', 'edgewear', 'weave', 'veins']);
  out.push(newLayer(tex, tex === 'weather' ? { type: pick(['moss', 'rust', 'snow', 'crystal', 'blood', 'sand']) } : tex === 'ore' ? { color: hue() } : {}));
  const deco = pick(['sparkle', 'glow', 'frame', 'emblem', 'runes', 'outline', 'bevel', 'iridescent']);
  out.push(newLayer(deco, deco === 'glow' || deco === 'outline' ? { color: hue() } : deco === 'emblem' ? { shape: pick(Object.keys(GLYPHS)), color: hue() } : {}));
  if (R() < 0.6) out.push(newLayer(pick(['enchant', 'shimmer', 'pulse', 'embers', 'huecycle', 'slash', 'orbit', 'lightning', 'ripple']), {}));
  if (R() < 0.4) out.push(newLayer('partstamp', { part: pick(PARTS.map((pt) => pt.id)) }));
  return out;
}
