import type { Atlas, Box, Cell, FaceKey, Layout, Mat } from "./forge-types2";
import { darken, hashStr, hexToRgb, lighten, mix } from "./forge-util";
import type { GradMode } from "./forge-types2";

type R4 = [number, number, number, number];

interface Net {
  key: string;
  sample: Box;
  count: number;
  W: number;
  H: number;
  D: number;
}

const dims = (b: Box) => [b.to[0] - b.from[0], b.to[1] - b.from[1], b.to[2] - b.from[2]] as const;

function collect(boxes: Box[], share: boolean) {
  const nets = new Map<string, { sample: Box; ids: number[] }>();
  boxes.forEach((b) => {
    const [w, h, d] = dims(b);
    const key = share ? `${b.mat}|${b.color}|${w}|${h}|${d}` : `#${b.id}`;
    const e = nets.get(key);
    if (e) e.ids.push(b.id);
    else nets.set(key, { sample: b, ids: [b.id] });
  });
  return nets;
}

/** Box UV 風の展開図：上段に up/down、下段に west/north/east/south */
function facesOf(x: number, y: number, W: number, H: number, D: number): Record<FaceKey, R4> {
  return {
    up: [x + D, y, x + D + W, y + D],
    down: [x + D + W, y, x + D + 2 * W, y + D],
    west: [x, y + D, x + D, y + D + H],
    north: [x + D, y + D, x + D + W, y + D + H],
    east: [x + D + W, y + D, x + 2 * D + W, y + D + H],
    south: [x + 2 * D + W, y + D, x + 2 * D + 2 * W, y + D + H],
  };
}

function netsAt(list: { key: string; sample: Box; count: number }[], s: number): Net[] {
  return list.map((n) => {
    const [w, h, d] = dims(n.sample);
    return {
      ...n,
      W: Math.max(1, Math.round(w * s)),
      H: Math.max(1, Math.round(h * s)),
      D: Math.max(1, Math.round(d * s)),
    };
  });
}

function shelf(nets: Net[], size: number, sort: boolean) {
  const order = sort ? [...nets].sort((a, b) => b.D + b.H - (a.D + a.H) || b.W + b.D - (a.W + a.D)) : nets;
  const placed: { net: Net; x: number; y: number }[] = [];
  let x = 0;
  let y = 0;
  let rowH = 0;
  for (const n of order) {
    const w = 2 * (n.W + n.D);
    const h = n.D + n.H;
    if (w > size || h > size) return null;
    if (x + w > size) {
      x = 0;
      y += rowH;
      rowH = 0;
    }
    if (y + h > size) return null;
    placed.push({ net: n, x, y });
    x += w;
    rowH = Math.max(rowH, h);
  }
  return placed;
}

function bestScale(list: { key: string; sample: Box; count: number }[], size: number, sort: boolean) {
  let lo = 0.02;
  let hi = 16;
  let best: ReturnType<typeof shelf> = null;
  let bestS = lo;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    const r = shelf(netsAt(list, mid), size, sort);
    if (r) {
      best = r;
      bestS = mid;
      lo = mid;
    } else hi = mid;
  }
  return { placed: best ?? shelf(netsAt(list, 0.02), size, sort) ?? [], scale: bestS };
}

export function layoutAtlas(boxes: Box[], texSetting: number, layout: Layout, share: boolean): Atlas & { scale: number } {
  const groups = collect(boxes, share);
  const list = [...groups.entries()].map(([key, v]) => ({ key, sample: v.sample, count: v.ids.length }));

  const sizes = texSetting > 0 ? [texSetting] : [32, 64, 128, 256];
  let size = sizes[sizes.length - 1];
  let result: { placed: { net: Net; x: number; y: number }[]; scale: number } = { placed: [], scale: 0 };

  if (layout === "grid") {
    // 均等セル：展開図をセルいっぱいに引き伸ばす（等密度ではない）
    for (const s of sizes) {
      size = s;
      const cols = Math.ceil(Math.sqrt(list.length * 1.5));
      const rows = Math.ceil(list.length / cols);
      const cw = Math.floor(s / cols);
      const ch = Math.floor(s / Math.max(1, rows));
      if ((cw >= 12 && ch >= 8) || s === sizes[sizes.length - 1]) {
        const placed = list.map((n, i) => {
          const D = Math.max(1, Math.floor(Math.min(cw / 4, ch / 2)));
          const W = Math.max(1, Math.floor(cw / 2 - D));
          const H = Math.max(1, ch - D);
          return { net: { ...n, W, H, D }, x: (i % cols) * cw, y: Math.floor(i / cols) * ch };
        });
        result = { placed, scale: 0 };
        break;
      }
    }
  } else {
    for (const s of sizes) {
      size = s;
      result = bestScale(list, s, layout === "dense");
      // 自動時は 2px/unit 以上（MC標準の倍密度）を満たす最小サイズを採用
      if (result.scale >= 2 || s === sizes[sizes.length - 1]) break;
    }
  }

  const cells: Cell[] = [];
  const cellOf = new Map<number, Cell>();
  let used = 0;
  result.placed.forEach(({ net, x, y }) => {
    const faces = facesOf(x, y, net.W, net.H, net.D);
    const cell: Cell = {
      key: net.key,
      rect: [x, y, x + 2 * (net.W + net.D), y + net.D + net.H],
      faces,
      sample: net.sample,
      count: net.count,
    };
    used += 2 * net.W * net.H + 2 * net.D * net.H + 2 * net.W * net.D;
    cells.push(cell);
  });
  const byKey = new Map(cells.map((c) => [c.key, c]));
  boxes.forEach((b) => {
    const [w, h, d] = dims(b);
    const key = share ? `${b.mat}|${b.color}|${w}|${h}|${d}` : `#${b.id}`;
    const c = byKey.get(key);
    if (c) cellOf.set(b.id, c);
  });
  return { size, layout, cells, cellOf, fill: Math.min(1, used / (size * size)), scale: result.scale };
}

/* ─────────── ペイント（画素単位） ─────────── */

const FACE_LIGHT: Record<FaceKey, number> = { up: 1.16, down: 0.66, north: 1, south: 0.94, east: 0.86, west: 0.9 };

function noise(x: number, y: number, s: number) {
  let h = (x * 374761393 + y * 668265263 + s * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function shadeFn(mat: Mat, fu: number, fv: number, px: number, py: number, fw: number, fh: number, seed: number): [number, number] {
  // 返り値: [明度係数, 白への混合量]
  let l = 1;
  let w = 0;
  const nz = noise(px, py, seed) - 0.5;
  switch (mat) {
    case "base":
      l = 1.07 - 0.16 * fv + nz * 0.1;
      break;
    case "shade":
      l = (0.92 - 0.12 * fv) * ((px + py) % 2 ? 0.94 : 1) + nz * 0.06;
      break;
    case "metal": {
      const spec = Math.exp(-Math.pow(fv - 0.28, 2) / 0.018);
      l = 0.78 + 0.18 * (1 - fv) + nz * 0.05;
      w = spec * 0.45;
      break;
    }
    case "glow":
    case "fx": {
      const d = Math.hypot(fu - 0.5, fv - 0.5);
      l = 1.02 - d * 0.35;
      w = Math.max(0, 0.5 - d) * 0.8;
      break;
    }
    case "gem": {
      l = fu + fv < 1 ? 1.12 : 0.78;
      if (fu - fv > 0.35) l *= 0.9;
      if (fu < 0.34 && fv < 0.34) w = 0.55;
      break;
    }
  }
  if (fw >= 3 && fh >= 3 && mat !== "fx" && mat !== "glow") {
    if (px === 0 || py === 0) l *= 1.1;
    else if (px === fw - 1 || py === fh - 1) l *= 0.74;
  }
  return [l, w];
}

export interface GradOpts {
  mode: GradMode;
  power: number;
  glow: string;
  minY: number;
  maxY: number;
}

/** 世界高さ t(0..1) に応じて地色へ階調をかける */
function gradeColor(color: string, t: number, g: GradOpts) {
  const k = Math.max(0, Math.min(1, g.power));
  switch (g.mode) {
    case "rise":
      return mix(color, lighten(color, 0.55), t * k);
    case "fall":
      return mix(color, darken(color, 0.6), t * k);
    case "heat":
      return mix(color, g.glow, t * t * k);
    case "abyss":
      return mix(color, "#0B0712", (1 - t) * k);
    default:
      return color;
  }
}

/** size×size の実寸テクスチャに描く（出力PNGと3Dの両方がこれを使う） */
export function paintAtlas(ctx: CanvasRenderingContext2D, atlas: Atlas, seed: number, grad?: GradOpts) {
  const S = atlas.size;
  const img = ctx.createImageData(S, S);
  const data = img.data;
  atlas.cells.forEach((cell, ci) => {
    let tone = cell.sample.color;
    if (grad && grad.mode !== "none") {
      const cy = (cell.sample.from[1] + cell.sample.to[1]) / 2;
      const t = Math.max(0, Math.min(1, (cy - grad.minY) / Math.max(1, grad.maxY - grad.minY)));
      tone = gradeColor(tone, t, grad);
    }
    const rgb = hexToRgb(tone);
    const mat = cell.sample.mat;
    const cs = (hashStr(cell.key) ^ seed) >>> 0;
    (Object.keys(cell.faces) as FaceKey[]).forEach((f) => {
      const [u0, v0, u1, v1] = cell.faces[f];
      const fw = u1 - u0;
      const fh = v1 - v0;
      const fl = mat === "fx" || mat === "glow" ? 1 - (1 - FACE_LIGHT[f]) * 0.35 : FACE_LIGHT[f];
      for (let py = 0; py < fh; py++) {
        for (let px = 0; px < fw; px++) {
          const X = u0 + px;
          const Y = v0 + py;
          if (X < 0 || Y < 0 || X >= S || Y >= S) continue;
          const [l, w] = shadeFn(mat, (px + 0.5) / fw, (py + 0.5) / fh, px + ci * 7, py, fw, fh, cs);
          const k = l * fl;
          const o = (Y * S + X) * 4;
          for (let c = 0; c < 3; c++) {
            const v = rgb[c] * k;
            data[o + c] = Math.max(0, Math.min(255, v + (255 - v) * w));
          }
          data[o + 3] = 255;
        }
      }
    });
  });
  ctx.putImageData(img, 0, 0);
}
