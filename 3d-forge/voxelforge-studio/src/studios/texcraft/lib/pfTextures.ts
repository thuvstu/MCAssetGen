import { setPx, fbm, hash2, clamp, clamp01, valueNoise, mulberry32, lerp, hexToRgb } from "./fxutil";

// ============================================================
//  手続き生成による Minecraft 風テクスチャライブラリ
//  すべて 16〜128px の任意サイズで生成可能
// ============================================================

export interface TexGen {
  id: string;
  name: string;
  en: string;
  group: string;
  gen: (size: number, seed: number) => ImageData;
}

export const TEX_GROUPS = ["基本ブロック", "鉱石", "金属ブロック", "特殊次元", "装飾・意匠", "アイテム"] as const;

type RGBA = [number, number, number, number];

class Pt {
  img: ImageData;
  size: number;
  constructor(size: number) {
    this.size = size;
    this.img = new ImageData(size, size);
  }
  set(x: number, y: number, r: number, g: number, b: number, a = 255) {
    setPx(this.img, x | 0, y | 0, r, g, b, a);
  }
  at(x: number, y: number) {
    const i = (clamp(y | 0, 0, this.size - 1) * this.size + clamp(x | 0, 0, this.size - 1)) << 2;
    return [this.img.data[i], this.img.data[i + 1], this.img.data[i + 2], this.img.data[i + 3]];
  }
  fill(fn: (x: number, y: number) => RGBA | null) {
    const s = this.size;
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        const c = fn(x, y);
        if (c) this.set(x, y, c[0], c[1], c[2], c[3]);
      }
    return this;
  }
}

const jit = (x: number, y: number, seed: number, amt: number) => (hash2(x, y, seed) - 0.5) * 2 * amt;

/** 基本ノイズテクスチャ: 色 + fbm の明暗 + 斑点 */
function noisy(size: number, seed: number, base: RGBA, variation: number, scale = 4, speck = 0.06, darkSpeck = -30) {
  const p = new Pt(size);
  return p.fill((x, y) => {
    const n = fbm(x / scale, y / scale, seed, 4);
    const h = hash2(x, y, seed + 7);
    let k = 0.72 + n * 0.56 + jit(x, y, seed, variation * 0.16);
    if (h > 1 - speck) k += darkSpeck / 100;
    else if (h < speck * 0.6) k -= darkSpeck / 160;
    return [clamp(base[0] * k), clamp(base[1] * k), clamp(base[2] * k), base[3]];
  }).img;
}

/** ボロノイ細胞 (丸石 / 砂利) */
function voronoi(size: number, seed: number, cells: number, colFn: (t: number, edge: number, i: number) => RGBA, jitterAmt = 1) {
  const p = new Pt(size);
  const rnd = mulberry32(seed * 7717 + 3);
  const pts: [number, number][] = [];
  for (let i = 0; i < cells; i++) pts.push([rnd() * size, rnd() * size]);
  return p.fill((x, y) => {
    let d1 = 1e9, d2 = 1e9, idx = 0;
    for (let i = 0; i < pts.length; i++) {
      // タイリング対応の最近傍
      for (let ox = -1; ox <= 1; ox++)
        for (let oy = -1; oy <= 1; oy++) {
          const dx = x + 0.5 - (pts[i][0] + ox * size), dy = y + 0.5 - (pts[i][1] + oy * size);
          const d = dx * dx + dy * dy;
          if (d < d1) { d2 = d1; d1 = d; idx = i; } else if (d < d2) d2 = d;
        }
    }
    const edge = clamp01((Math.sqrt(d2) - Math.sqrt(d1)) / (size * 0.09 * jitterAmt));
    const t = hash2(idx, 0, seed);
    return colFn(t, edge, idx);
  }).img;
}

/** 鉱石ブロック: 石ベース + 鉱石の塊 */
function ore(size: number, seed: number, color: string, glow = false, blobs = 3) {
  const base = new Pt(size);
  base.img.data.set(noisy(size, seed * 13 + 1, [126, 126, 129, 255], 1, size / 22, 0.05).data);
  const c = hexToRgb(color);
  const rnd = mulberry32(seed * 991 + 5);
  const pts: [number, number, number][] = [];
  for (let i = 0; i < blobs; i++) pts.push([0.18 + rnd() * 0.64, 0.18 + rnd() * 0.64, (0.09 + rnd() * 0.09) * size]);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let m = 0;
      for (const [px, py, r] of pts) {
        const dx = x - px * size, dy = y - py * size;
        const wob = 1 + (fbm(x / (size / 9), y / (size / 9), seed + Math.round(px * 50), 3) - 0.5) * 0.85;
        const d = Math.hypot(dx, dy) / (r * wob);
        m = Math.max(m, 1 - d);
      }
      if (m <= 0.08) continue;
      m = clamp01(m);
      const k = 0.72 + m * 0.55 + hash2(x, y, seed + 3) * 0.16;
      base.set(x, y, clamp(c.r * k), clamp(c.g * k), clamp(c.b * k), 255);
      if (glow && m > 0.55) base.set(x, y, clamp(c.r * k + 60), clamp(c.g * k + 50), clamp(c.b * k + 40), 255);
    }
  return base.img;
}

/** 金属 / 宝石ブロック: 面取り + 中央の紋様 */
function metalBlock(size: number, seed: number, color: string, pattern: "plate" | "gem" | "brick" = "plate") {
  const c = hexToRgb(color);
  const p = new Pt(size);
  const s = size;
  p.fill((x, y) => {
    const n = fbm(x / (s / 5), y / (s / 5), seed, 3);
    let k = 0.82 + n * 0.26 + jit(x, y, seed, 5) / 100;
    // 外周の面取り
    const d = Math.min(x, y, s - 1 - x, s - 1 - y);
    if (d === 0) k *= 0.55;
    else if (d === 1) k *= 1.28;
    else if (d === 2) k *= 0.92;
    if (pattern === "brick") {
      const rows = 4, bh = s / rows;
      const row = Math.floor(y / bh);
      const off = (row % 2) * (s / 4);
      const bx = (x + off) % (s / 2);
      if (Math.abs(y % bh) < 1 || bx < 1) k *= 0.62;
    }
    if (pattern === "gem") {
      const cx = (s - 1) / 2, cy = (s - 1) / 2;
      const dd = Math.abs(x - cx) + Math.abs(y - cy);
      if (Math.abs(dd - s * 0.3) < 1.2) k *= 1.4;
      if (Math.abs(dd - s * 0.16) < 1) k *= 0.7;
      if (x === y || x === s - 1 - y) k *= 1.12;
    }
    if (pattern === "plate") {
      const cx = (s - 1) / 2, cy = (s - 1) / 2;
      if (Math.abs(x - cx) < 1 && Math.abs(y - cy) < s * 0.18) k *= 1.18;
      if (Math.abs(y - cy) < 1 && Math.abs(x - cx) < s * 0.18) k *= 0.9;
    }
    return [clamp(c.r * k), clamp(c.g * k), clamp(c.b * k), 255];
  });
  return p.img;
}

// ---- 直線への符号付き距離 (アイテム描画用) ----
function segDist(x: number, y: number, x0: number, y0: number, x1: number, y1: number) {
  const dx = x1 - x0, dy = y1 - y0;
  const L2 = dx * dx + dy * dy || 1e-6;
  let t = ((x - x0) * dx + (y - y0) * dy) / L2;
  t = clamp01(t);
  const px = x0 + dx * t, py = y0 + dy * t;
  const d = Math.hypot(x - px, y - py);
  const cross = (x - x0) * dy - (y - y0) * dx;
  return { d, t, sign: cross > 0 ? 1 : -1 };
}

function itemSword(size: number, seed: number, blade: string, guard: string) {
  const p = new Pt(size), s = size;
  const bc = hexToRgb(blade), gc = hexToRgb(guard);
  const N = (u: number) => u * s;
  p.fill((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    // 刃
    const b = segDist(px, py, N(0.14), N(0.86), N(0.86), N(0.14));
    const wB = N(0.075) * (1 - b.t * 0.72);
    if (b.d < wB) {
      const shade = 1 + b.sign * 0.24 * (1 - b.t * 0.4);
      const edge = b.d > wB * 0.72 ? 1.32 : 1;
      const n = 0.94 + hash2(x, y, seed) * 0.12;
      return [clamp(bc.r * shade * edge * n), clamp(bc.g * shade * edge * n), clamp(bc.b * shade * edge * n), 255];
    }
    // ガード
    const g = segDist(px, py, N(0.06), N(0.78), N(0.24), N(0.96));
    if (g.d < N(0.055)) {
      const k = 1 + g.sign * 0.2;
      return [clamp(gc.r * k), clamp(gc.g * k), clamp(gc.b * k), 255];
    }
    // 柄
    const h = segDist(px, py, N(0.13), N(0.87), N(0.03), N(0.97));
    if (h.d < N(0.05)) {
      const k = 0.85 + h.sign * 0.2 + Math.sin(h.t * 18) * 0.08;
      return [clamp(96 * k), clamp(64 * k), clamp(38 * k), 255];
    }
    return null;
  });
  return p.img;
}

function itemPickaxe(size: number, seed: number, head: string) {
  const p = new Pt(size), s = size;
  const hc = hexToRgb(head);
  const N = (u: number) => u * s;
  p.fill((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    // 柄
    const h = segDist(px, py, N(0.1), N(0.92), N(0.66), N(0.36));
    if (h.d < N(0.052)) {
      const k = 0.9 + h.sign * 0.22 + Math.sin(h.t * 22) * 0.06;
      return [clamp(122 * k), clamp(84 * k), clamp(50 * k), 255];
    }
    // 頭: 弧
    const t = clamp01((px - N(0.16)) / (N(0.78) - N(0.16)));
    if (px > N(0.16) && px < N(0.8)) {
      const cy = N(0.46) - Math.sin(t * Math.PI) * N(0.3);
      const width = N(0.085) * (1 - Math.abs(t - 0.5) * 0.85);
      const d = py - cy;
      if (Math.abs(d) < width) {
        const k = 1 - d / (width * 3.2);
        const n = 0.93 + hash2(x, y, seed) * 0.14;
        return [clamp(hc.r * k * n), clamp(hc.g * k * n), clamp(hc.b * k * n), 255];
      }
    }
    return null;
  });
  return p.img;
}

function itemApple(size: number, seed: number) {
  const p = new Pt(size), s = size;
  const cx = s * 0.5, cy = s * 0.6, r = s * 0.33;
  p.fill((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const dx = (px - cx) / r, dy = (py - cy) / (r * 1.02);
    let d = Math.hypot(dx, dy);
    d *= 1 + Math.abs(dx) * 0.14 - Math.max(0, -dy) * 0.1;
    if (d < 1) {
      const light = clamp01(1 - Math.hypot(dx + 0.45, dy + 0.5) * 0.9);
      const n = 0.9 + hash2(x, y, seed) * 0.18 + fbm(x / (s / 6), y / (s / 6), seed, 3) * 0.16;
      const k = (0.62 + light * 0.62) * n;
      const rim = d > 0.9 ? 0.7 : 1;
      return [clamp(206 * k * rim), clamp(48 * k * rim * 1.05), clamp(48 * k * rim), 255];
    }
    // 茎
    const st = segDist(px, py, cx, cy - r * 0.92, cx + s * 0.05, cy - r * 1.5);
    if (st.d < s * 0.035) return [clamp(96 * (1 + st.sign * 0.2)), clamp(66), clamp(38), 255];
    // 葉
    const lx = (px - (cx + s * 0.13)) / (s * 0.13), ly = (py - (cy - r * 1.24)) / (s * 0.06);
    if (lx * lx + ly * ly < 1 && lx > -0.2) return [clamp(88 + lx * 40), clamp(168 - ly * 30), clamp(58), 255];
    return null;
  });
  return p.img;
}

function itemPotion(size: number, seed: number, liquid: string) {
  const p = new Pt(size), s = size;
  const lc = hexToRgb(liquid);
  const cx = s * 0.5, cy = s * 0.62, r = s * 0.3;
  p.fill((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const inNeck = px > s * 0.42 && px < s * 0.58 && py > s * 0.18 && py < s * 0.4;
    const d = Math.hypot((px - cx) / r, (py - cy) / r);
    const inBody = d < 1;
    if (inNeck || inBody) {
      const fillLine = cy + r * 0.15;
      if (py > fillLine && inBody) {
        const light = clamp01(1 - Math.hypot(px - (cx - r * 0.4), py - (cy - r * 0.4)) / (r * 1.5));
        const n = 0.9 + hash2(x, y, seed) * 0.2;
        const k = (0.7 + light * 0.6) * n;
        return [clamp(lc.r * k), clamp(lc.g * k), clamp(lc.b * k), 235];
      }
      const edge = d > 0.88 || (inNeck && (px < s * 0.45 || px > s * 0.55));
      return edge ? [214, 232, 240, 200] : [236, 248, 255, 120];
    }
    // コルク
    if (px > s * 0.4 && px < s * 0.6 && py > s * 0.1 && py < s * 0.22) {
      const k = 0.85 + hash2(x, y, seed) * 0.3;
      return [clamp(150 * k), clamp(108 * k), clamp(66 * k), 255];
    }
    // ハイライト
    if (inBody) return [255, 255, 255, 90];
    return null;
  });
  return p.img;
}

function itemIngot(size: number, seed: number, color: string) {
  const p = new Pt(size), s = size;
  const c = hexToRgb(color);
  const N = (u: number) => u * s;
  p.fill((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    if (py < N(0.34) || py > N(0.78)) return null;
    const t = (py - N(0.34)) / (N(0.78) - N(0.34));
    const halfTop = N(0.22), halfBot = N(0.38);
    const half = lerp(halfTop, halfBot, t);
    const dx = Math.abs(px - s / 2);
    if (dx > half) return null;
    const n = 0.94 + hash2(x, y, seed) * 0.12;
    let k = 1.14 - t * 0.44 + (dx / half) * 0.06;
    if (t < 0.18) k *= 1.16; // 上面
    if (dx > half * 0.9) k *= 0.66; // 側面
    return [clamp(c.r * k * n), clamp(c.g * k * n), clamp(c.b * k * n), 255];
  });
  return p.img;
}

function itemGem(size: number, seed: number, color: string) {
  const p = new Pt(size), s = size;
  const c = hexToRgb(color);
  const cx = s / 2;
  p.fill((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    // ダイヤモンド型: 上テーブル + 下部パビリオン
    const topY = s * 0.2, midY = s * 0.42, botY = s * 0.88;
    let inside = false, facet = 0;
    if (py >= topY && py <= midY) {
      const t = (py - topY) / (midY - topY);
      const half = lerp(s * 0.2, s * 0.36, t);
      inside = Math.abs(px - cx) < half;
      facet = 0.95 + t * 0.2 - Math.abs(px - cx) / (half * 2.2);
    } else if (py > midY && py <= botY) {
      const t = (py - midY) / (botY - midY);
      const half = lerp(s * 0.36, 0, t);
      inside = Math.abs(px - cx) < half;
      facet = 0.8 - t * 0.35 + Math.abs(px - cx) / (s * 0.5) * 0.5;
    }
    if (!inside) return null;
    const band = Math.abs(Math.abs(px - cx) - s * 0.12) < s * 0.02 ? 1.25 : 1;
    const n = 0.95 + hash2(x, y, seed) * 0.1;
    const k = clamp(facet * band * n, 0.25, 1.7);
    if (py < midY && Math.abs(px - cx) < s * 0.06) return [clamp(c.r * 1.5 + 70), clamp(c.g * 1.5 + 70), clamp(c.b * 1.5 + 70), 255];
    return [clamp(c.r * k), clamp(c.g * k), clamp(c.b * k), 255];
  });
  return p.img;
}

function itemBow(size: number, seed: number) {
  const p = new Pt(size), s = size;
  p.fill((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const cx = s * 0.72, cy = s * 0.5, r = s * 0.42;
    const d = Math.hypot(px - cx, py - cy);
    if (Math.abs(d - r) < s * 0.05 && px < cx) {
      const k = 0.8 + (1 - d / r) * 0.5 + hash2(x, y, seed) * 0.12;
      return [clamp(128 * k), clamp(88 * k), clamp(52 * k), 255];
    }
    if (Math.abs(px - (cx - r)) < s * 0.02 && py > cy - r + s * 0.02 && py < cy + r - s * 0.02)
      return [236, 236, 224, 235];
    return null;
  });
  return p.img;
}

// ============================================================
//  登録
// ============================================================
const T = (id: string, name: string, en: string, group: string, gen: TexGen["gen"]): TexGen => ({ id, name, en, group, gen });

export const TEXTURES: TexGen[] = [
  T("grass_top", "草ブロック上面", "GRASS TOP", "基本ブロック", (s, sd) =>
    new Pt(s).fill((x, y) => {
      const n = fbm(x / (s / 5), y / (s / 5), sd, 4);
      const b = fbm(x / (s / 14), y / (s / 14), sd + 40, 3);
      const k = (0.72 + n * 0.5 + b * 0.16) * (0.94 + hash2(x, y, sd) * 0.12);
      return [clamp(96 * k * 0.92), clamp(172 * k), clamp(66 * k * 0.9), 255];
    }).img),

  T("dirt", "土", "DIRT", "基本ブロック", (s, sd) => noisy(s, sd, [134, 96, 67, 255], 1.2, s / 16, 0.09, -34)),
  T("stone", "石", "STONE", "基本ブロック", (s, sd) => noisy(s, sd + 3, [126, 126, 129, 255], 1, s / 18, 0.05, -26)),
  T("deepslate", "深層岩", "DEEPSLATE", "基本ブロック", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 6), y / (s / 26), sd, 4);
      const k = 0.66 + n * 0.6 + jit(x, y, sd, 6) / 100;
      return [clamp(72 * k), clamp(72 * k), clamp(78 * k), 255];
    }).img;
  }),
  T("cobblestone", "丸石", "COBBLESTONE", "基本ブロック", (s, sd) =>
    voronoi(s, sd, Math.max(10, Math.round(s * s / 90)), (t, edge) => {
      const base = 104 + t * 56;
      const k = (base / 128) * (0.55 + edge * 0.62);
      return [clamp(128 * k), clamp(128 * k), clamp(131 * k), 255];
    })),
  T("mossy_cobble", "苔むした丸石", "MOSSY COBBLE", "基本ブロック", (s, sd) => {
    const img = voronoi(s, sd + 5, Math.max(10, Math.round(s * s / 90)), (t, edge) => {
      const k = ((104 + t * 56) / 128) * (0.55 + edge * 0.62);
      return [clamp(128 * k), clamp(128 * k), clamp(131 * k), 255];
    });
    const p = new Pt(s); p.img = img;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const n = fbm(x / (s / 8), y / (s / 8), sd + 17, 4);
      if (n > 0.6) {
        const c = p.at(x, y);
        const m = clamp01((n - 0.6) * 2.6);
        p.set(x, y, lerp(c[0], 92, m), lerp(c[1], 148, m), lerp(c[2], 62, m), 255);
      }
    }
    return p.img;
  }),
  T("oak_planks", "オークの板材", "OAK PLANKS", "基本ブロック", (s, sd) => {
    const p = new Pt(s);
    const rows = 4;
    return p.fill((x, y) => {
      const row = Math.floor((y / s) * rows);
      const tone = 0.86 + hash2(row, 0, sd) * 0.28;
      const grain = fbm(x / (s / 3), y / (s / 40) + row * 11, sd + row, 4);
      const seam = (y / s) * rows - row < 0.09 ? 0.6 : 1;
      const knot = Math.hypot(x - (hash2(row, 3, sd) * s), y - (row + 0.5) * (s / rows)) < s * 0.05 ? 0.72 : 1;
      const k = tone * (0.78 + grain * 0.44) * seam * knot + jit(x, y, sd, 3) / 100;
      return [clamp(178 * k), clamp(142 * k), clamp(92 * k), 255];
    }).img;
  }),
  T("sand", "砂", "SAND", "基本ブロック", (s, sd) => noisy(s, sd + 11, [219, 207, 163, 255], 0.8, s / 12, 0.05, -18)),
  T("sandstone", "砂岩", "SANDSTONE", "基本ブロック", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const band = Math.sin((y / s) * Math.PI * 6 + fbm(x / (s / 8), y / (s / 30), sd, 3) * 2.4);
      const k = 0.88 + band * 0.09 + fbm(x / (s / 5), y / (s / 5), sd + 9, 3) * 0.12 + jit(x, y, sd, 3) / 100;
      return [clamp(222 * k), clamp(208 * k), clamp(160 * k), 255];
    }).img;
  }),
  T("gravel", "砂利", "GRAVEL", "基本ブロック", (s, sd) =>
    voronoi(s, sd + 21, Math.max(14, Math.round(s * s / 55)), (t, edge) => {
      const hue = t;
      const base = 0.5 + edge * 0.6;
      const r = clamp((128 + hue * 60) * base), g = clamp((122 + hue * 52) * base), b = clamp((118 + hue * 46) * base);
      return [r, g, b, 255];
    })),
  T("clay", "粘土", "CLAY", "基本ブロック", (s, sd) => noisy(s, sd + 33, [164, 166, 178, 255], 0.5, s / 9, 0.02, -10)),
  T("terracotta", "テラコッタ", "TERRACOTTA", "基本ブロック", (s, sd) => noisy(s, sd + 44, [168, 94, 60, 255], 1, s / 14, 0.06, -26)),
  T("bricks", "レンガ", "BRICKS", "基本ブロック", (s, sd) => {
    const p = new Pt(s);
    const rows = 4, cols = 2;
    return p.fill((x, y) => {
      const bh = s / rows, bw = s / cols;
      const row = Math.floor(y / bh);
      const off = (row % 2) * (bw / 2);
      const lx = ((x + off) % bw), ly = y % bh;
      const mortar = ly < Math.max(1, s / 24) || lx < Math.max(1, s / 24);
      if (mortar) {
        const k = 0.9 + hash2(x, y, sd) * 0.18;
        return [clamp(176 * k), clamp(168 * k), clamp(160 * k), 255];
      }
      const brickTone = 0.86 + hash2(row, Math.floor((x + off) / bw), sd + 3) * 0.3;
      const k = brickTone * (0.86 + fbm(x / (s / 6), y / (s / 6), sd + row, 3) * 0.3) + jit(x, y, sd, 4) / 100;
      return [clamp(156 * k), clamp(76 * k), clamp(62 * k), 255];
    }).img;
  }),
  T("glass", "ガラス", "GLASS", "基本ブロック", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const d = Math.min(x, y, s - 1 - x, s - 1 - y);
      if (d === 0) return [206, 226, 236, 255];
      if (d === 1) return [170, 200, 214, 150];
      const diag = Math.abs((x / s) * 0.7 + (y / s) * 0.7 - 0.42) < 0.035;
      if (diag) return [255, 255, 255, 120];
      const n = hash2(x, y, sd);
      return [214, 236, 246, n > 0.94 ? 90 : 34];
    }).img;
  }),
  T("water", "水", "WATER", "基本ブロック", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const wave = Math.sin((y / s) * Math.PI * 5 + fbm(x / (s / 8), y / (s / 20), sd, 3) * 4);
      const k = 0.84 + wave * 0.14 + jit(x, y, sd, 4) / 100;
      return [clamp(48 * k), clamp(112 * k), clamp(214 * k), 196];
    }).img;
  }),
  T("lava", "溶岩", "LAVA", "基本ブロック", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 7), y / (s / 7), sd, 5);
      const crust = clamp01((n - 0.44) * 3.4);
      const r = lerp(255, 122, crust), g = lerp(214, 40, crust), b = lerp(86, 26, crust);
      const k = 0.9 + hash2(x, y, sd) * 0.2;
      return [clamp(r * k), clamp(g * k), clamp(b * k), 255];
    }).img;
  }),
  T("leaves", "木の葉", "LEAVES", "基本ブロック", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 6), y / (s / 6), sd, 4);
      if (n > 0.72 && hash2(x, y, sd + 1) > 0.55) return null;
      const k = 0.6 + n * 0.7 + jit(x, y, sd, 8) / 100;
      return [clamp(52 * k), clamp(126 * k), clamp(38 * k), 255];
    }).img;
  }),
  T("snow_block", "雪ブロック", "SNOW BLOCK", "基本ブロック", (s, sd) => noisy(s, sd + 55, [238, 244, 250, 255], 0.35, s / 10, 0.04, -12)),
  T("wool", "羊毛 (白)", "WHITE WOOL", "基本ブロック", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 4), y / (s / 4), sd, 3);
      const fiber = Math.sin((x + y) * 1.4 + n * 8) * 0.5 + 0.5;
      const k = 0.84 + n * 0.2 + fiber * 0.1 + jit(x, y, sd, 3) / 100;
      return [clamp(234 * k), clamp(234 * k), clamp(238 * k), 255];
    }).img;
  }),
  T("bedrock", "岩盤", "BEDROCK", "基本ブロック", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 7), y / (s / 7), sd, 5);
      const blk = Math.floor(n * 5) / 5;
      const k = 0.4 + blk * 1.35 + jit(x, y, sd, 5) / 100;
      return [clamp(84 * k), clamp(84 * k), clamp(90 * k), 255];
    }).img;
  }),

  // ---- 鉱石 ----
  T("coal_ore", "石炭鉱石", "COAL ORE", "鉱石", (s, sd) => ore(s, sd, "#2c2c30")),
  T("iron_ore", "鉄鉱石", "IRON ORE", "鉱石", (s, sd) => ore(s, sd + 1, "#d9a58a")),
  T("copper_ore", "銅鉱石", "COPPER ORE", "鉱石", (s, sd) => ore(s, sd + 2, "#c9743f")),
  T("gold_ore", "金鉱石", "GOLD ORE", "鉱石", (s, sd) => ore(s, sd + 3, "#fcd647")),
  T("redstone_ore", "レッドストーン鉱石", "REDSTONE ORE", "鉱石", (s, sd) => ore(s, sd + 4, "#e0312c", true, 4)),
  T("lapis_ore", "ラピスラズリ鉱石", "LAPIS ORE", "鉱石", (s, sd) => ore(s, sd + 5, "#2f4fc4", false, 4)),
  T("diamond_ore", "ダイヤモンド鉱石", "DIAMOND ORE", "鉱石", (s, sd) => ore(s, sd + 6, "#57e6ef", true)),
  T("emerald_ore", "エメラルド鉱石", "EMERALD ORE", "鉱石", (s, sd) => ore(s, sd + 7, "#1fd95b", true, 2)),

  // ---- 金属ブロック ----
  T("iron_block", "鉄ブロック", "IRON BLOCK", "金属ブロック", (s, sd) => metalBlock(s, sd, "#dcdcdc", "plate")),
  T("gold_block", "金ブロック", "GOLD BLOCK", "金属ブロック", (s, sd) => metalBlock(s, sd + 1, "#f7d63b", "plate")),
  T("diamond_block", "ダイヤモンドブロック", "DIAMOND BLOCK", "金属ブロック", (s, sd) => metalBlock(s, sd + 2, "#62e5e0", "gem")),
  T("emerald_block", "エメラルドブロック", "EMERALD BLOCK", "金属ブロック", (s, sd) => metalBlock(s, sd + 3, "#2ac25c", "gem")),
  T("netherite_block", "ネザライトブロック", "NETHERITE BLOCK", "金属ブロック", (s, sd) => metalBlock(s, sd + 4, "#4a4148", "brick")),
  T("copper_block", "銅ブロック", "COPPER BLOCK", "金属ブロック", (s, sd) => metalBlock(s, sd + 5, "#c96f3c", "brick")),
  T("oxidized_copper", "錆びた銅", "OXIDIZED COPPER", "金属ブロック", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 6), y / (s / 6), sd, 5);
      const t = clamp01((n - 0.3) * 1.8);
      const k = 0.8 + n * 0.4 + jit(x, y, sd, 5) / 100;
      return [clamp(lerp(190, 78, t) * k), clamp(lerp(112, 168, t) * k), clamp(lerp(70, 140, t) * k), 255];
    }).img;
  }),

  // ---- 特殊次元 ----
  T("obsidian", "黒曜石", "OBSIDIAN", "特殊次元", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 9), y / (s / 9), sd, 5);
      const k = 0.5 + n * 0.9 + (hash2(x, y, sd) > 0.965 ? 0.6 : 0);
      return [clamp(28 * k), clamp(20 * k), clamp(44 * k), 255];
    }).img;
  }),
  T("netherrack", "ネザーラック", "NETHERRACK", "特殊次元", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 5), y / (s / 5), sd, 5);
      const pit = n > 0.72 ? 0.5 : 1;
      const k = (0.6 + n * 0.8) * pit + jit(x, y, sd, 8) / 100;
      return [clamp(132 * k), clamp(52 * k), clamp(52 * k), 255];
    }).img;
  }),
  T("soul_sand", "ソウルサンド", "SOUL SAND", "特殊次元", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 6), y / (s / 6), sd, 4);
      let k = 0.76 + n * 0.44 + jit(x, y, sd, 5) / 100;
      const holes: [number, number, number][] = [[0.3, 0.36, 0.11], [0.7, 0.36, 0.11], [0.5, 0.68, 0.14]];
      for (const [hx, hy, hr] of holes) {
        const d = Math.hypot((x / s - hx) / hr, (y / s - hy) / (hr * 1.2));
        if (d < 1) k *= 0.34 + d * 0.4;
      }
      return [clamp(98 * k), clamp(72 * k), clamp(62 * k), 255];
    }).img;
  }),
  T("end_stone", "エンドストーン", "END STONE", "特殊次元", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 8), y / (s / 8), sd, 4);
      const speck = hash2(x, y, sd + 2) > 0.93 ? 0.55 : 1;
      const k = (0.84 + n * 0.3) * speck;
      return [clamp(222 * k), clamp(214 * k), clamp(158 * k), 255];
    }).img;
  }),
  T("glowstone", "グロウストーン", "GLOWSTONE", "特殊次元", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 6), y / (s / 6), sd, 5);
      const hot = clamp01((n - 0.45) * 2.6);
      const r = lerp(146, 255, hot), g = lerp(104, 214, hot), b = lerp(58, 118, hot);
      const k = 0.92 + hash2(x, y, sd) * 0.16;
      return [clamp(r * k), clamp(g * k), clamp(b * k), 255];
    }).img;
  }),
  T("ice", "氷", "ICE", "特殊次元", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const n = fbm(x / (s / 7), y / (s / 7), sd, 4);
      const crack = Math.abs(valueNoise(x / (s / 3), y / (s / 22), sd + 4) - 0.5) < 0.035;
      let k = 0.84 + n * 0.3;
      if (crack) k *= 1.3;
      return [clamp(148 * k), clamp(196 * k), clamp(246 * k), crack ? 255 : 205];
    }).img;
  }),

  // ---- 装飾・意匠 ----
  T("bookshelf", "本棚", "BOOKSHELF", "装飾・意匠", (s, sd) => {
    const p = new Pt(s);
    const cols = 6;
    return p.fill((x, y) => {
      const inShelf = y > s * 0.14 && y < s * 0.86;
      if (!inShelf) {
        const grain = fbm(x / (s / 3), y / (s / 40), sd, 4);
        const k = 0.82 + grain * 0.36 + jit(x, y, sd, 3) / 100;
        return [clamp(178 * k), clamp(142 * k), clamp(92 * k), 255];
      }
      const col = Math.floor((x / s) * cols);
      const lx = (x / s) * cols - col;
      if (lx < 0.08) return [56, 40, 26, 255];
      const tone = hash2(col, 7, sd);
      const hue = [
        [152, 62, 54], [58, 92, 152], [146, 122, 52], [72, 122, 72], [112, 72, 132], [178, 142, 84],
      ][Math.floor(tone * 6) % 6];
      const top = y < s * 0.22 || y > s * 0.78 ? 1.18 : 1;
      const k = (0.78 + hash2(x, y, sd + col) * 0.24) * top;
      return [clamp(hue[0] * k), clamp(hue[1] * k), clamp(hue[2] * k), 255];
    }).img;
  }),
  T("pumpkin_face", "ジャック・オ・ランタン", "JACK O'LANTERN", "装飾・意匠", (s, sd) => {
    const p = new Pt(s);
    const face = (x: number, y: number) => {
      const u = x / s, v = y / s;
      const eyeL = Math.abs(u - 0.3) < 0.09 && Math.abs(v - 0.38) < 0.08;
      const eyeR = Math.abs(u - 0.7) < 0.09 && Math.abs(v - 0.38) < 0.08;
      const nose = Math.abs(u - 0.5) < 0.06 && Math.abs(v - 0.55) < 0.06;
      const mouth = v > 0.68 && v < 0.82 && u > 0.22 && u < 0.78 && Math.floor(u * 12) % 2 === (v > 0.75 ? 1 : 0);
      return eyeL || eyeR || nose || mouth;
    };
    return p.fill((x, y) => {
      const ridge = Math.abs(Math.sin((x / s) * Math.PI * 6)) * 0.16;
      const k = 0.86 + fbm(x / (s / 8), y / (s / 8), sd, 3) * 0.26 - ridge + jit(x, y, sd, 3) / 100;
      if (face(x, y)) return [clamp(255 * 0.92), clamp(168 * 0.9), clamp(42 * 0.8), 255];
      return [clamp(214 * k), clamp(118 * k), clamp(28 * k), 255];
    }).img;
  }),
  T("creeper_face", "クリーパーの顔", "CREEPER FACE", "装飾・意匠", (s, sd) => {
    const p = new Pt(s);
    const face = (x: number, y: number) => {
      const u = Math.floor((x / s) * 8), v = Math.floor((y / s) * 8);
      const eyes = (u === 1 || u === 2 || u === 5 || u === 6) && (v === 2 || v === 3);
      const mouth = ((u === 3 || u === 4) && v >= 4 && v <= 7) || ((u === 2 || u === 5) && (v === 5 || v === 6));
      return eyes || mouth;
    };
    return p.fill((x, y) => {
      if (face(x, y)) return [18, 22, 18, 255];
      const n = fbm(x / (s / 4), y / (s / 4), sd, 4);
      const k = 0.7 + n * 0.6 + jit(x, y, sd, 6) / 100;
      return [clamp(68 * k), clamp(168 * k), clamp(56 * k), 255];
    }).img;
  }),
  T("tnt", "TNT", "TNT", "装飾・意匠", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const v = y / s;
      const band = v > 0.3 && v < 0.7;
      const k = 0.86 + fbm(x / (s / 6), y / (s / 6), sd, 3) * 0.28 + jit(x, y, sd, 4) / 100;
      if (band) {
        const u = x / s;
        const letter = (u > 0.1 && u < 0.9) && (v > 0.4 && v < 0.6);
        if (letter && Math.floor(u * 4) % 2 === 0) return [236, 232, 224, 255];
        return [clamp(226 * k), clamp(222 * k), clamp(214 * k), 255];
      }
      return [clamp(198 * k), clamp(56 * k), clamp(48 * k), 255];
    }).img;
  }),
  T("crafting_table", "作業台", "CRAFTING TABLE", "装飾・意匠", (s, sd) => {
    const p = new Pt(s);
    return p.fill((x, y) => {
      const u = x / s, v = y / s;
      if (v < 0.28) {
        const grid = (Math.floor(u * 3) + Math.floor(v * 9)) % 2 === 0;
        const k = grid ? 1.05 : 0.82;
        const n = 0.86 + fbm(x / (s / 4), y / (s / 12), sd, 3) * 0.28;
        return [clamp(160 * k * n), clamp(120 * k * n), clamp(74 * k * n), 255];
      }
      const grain = fbm(x / (s / 3), y / (s / 30), sd + 1, 4);
      const k = 0.8 + grain * 0.4 + jit(x, y, sd, 3) / 100;
      const tool = Math.abs(u - 0.5) < 0.06 && v > 0.4 && v < 0.8;
      if (tool) return [clamp(120 * k), clamp(90 * k), clamp(60 * k), 255];
      return [clamp(150 * k), clamp(112 * k), clamp(70 * k), 255];
    }).img;
  }),

  // ---- アイテム ----
  T("diamond_sword", "ダイヤモンドの剣", "DIAMOND SWORD", "アイテム", (s, sd) => itemSword(s, sd, "#5ee7e0", "#c9a227")),
  T("netherite_sword", "ネザライトの剣", "NETHERITE SWORD", "アイテム", (s, sd) => itemSword(s, sd + 2, "#574b52", "#8c6b3f")),
  T("iron_pickaxe", "鉄のツルハシ", "IRON PICKAXE", "アイテム", (s, sd) => itemPickaxe(s, sd, "#dfe3e8")),
  T("golden_pickaxe", "金のツルハシ", "GOLDEN PICKAXE", "アイテム", (s, sd) => itemPickaxe(s, sd + 4, "#f8dc55")),
  T("apple", "リンゴ", "APPLE", "アイテム", (s, sd) => itemApple(s, sd)),
  T("potion", "ポーション瓶", "POTION", "アイテム", (s, sd) => itemPotion(s, sd, "#e0436a")),
  T("potion_mana", "魔力のポーション", "MANA POTION", "アイテム", (s, sd) => itemPotion(s, sd + 8, "#4aa8ff")),
  T("gold_ingot", "金の延べ棒", "GOLD INGOT", "アイテム", (s, sd) => itemIngot(s, sd, "#f7d63b")),
  T("iron_ingot", "鉄の延べ棒", "IRON INGOT", "アイテム", (s, sd) => itemIngot(s, sd + 6, "#dfe3e8")),
  T("emerald_gem", "エメラルド", "EMERALD", "アイテム", (s, sd) => itemGem(s, sd, "#2ee86a")),
  T("amethyst", "アメジスト", "AMETHYST", "アイテム", (s, sd) => itemGem(s, sd + 3, "#a765e8")),
  T("bow", "弓", "BOW", "アイテム", (s, sd) => itemBow(s, sd)),
  T("blank", "空白 (透明)", "BLANK", "アイテム", (s) => new Pt(s).img),
];

export const TEX_BY_ID = new Map(TEXTURES.map((t) => [t.id, t]));

export function generateTexture(id: string, size: number, seed: number): ImageData {
  const t = TEX_BY_ID.get(id);
  if (!t) return new ImageData(size, size);
  return t.gen(Math.max(8, Math.min(256, size)), seed);
}

/** 外部ファイル読み込み → 正方形にリサイズ (最近傍) */
export function imageFileToImageData(file: File | Blob, target: number): Promise<ImageData> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const c = document.createElement("canvas");
      c.width = target; c.height = target;
      const g = c.getContext("2d", { willReadFrequently: true })!;
      g.imageSmoothingEnabled = false;
      g.clearRect(0, 0, target, target);
      g.drawImage(im, 0, 0, target, target);
      URL.revokeObjectURL(url);
      res(g.getImageData(0, 0, target, target));
    };
    im.onerror = (e) => { URL.revokeObjectURL(url); rej(e); };
    im.src = url;
  });
}
