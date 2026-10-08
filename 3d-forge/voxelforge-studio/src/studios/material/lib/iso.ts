/**
 * アイソメトリック疑似3Dエンジン
 * 3D の多面体(凸ソリッド)を 16x16 に投影し、
 *  - 面の法線と光源から面ごとのトーンを決定
 *  - ピクセル単位の Z バッファで前後関係を解決
 *  - 稜線のハイライト(明るい面側の境界を1段明るく)
 *  - 輪郭リムライト・面内グラデーション・スペキュラ
 * を自動で付ける。オーバーレイにはワールド座標が渡されるので
 * 「インゴットの中央に合金の帯」「上面に刻印」のような装飾が容易。
 */
import { poly, type Pred } from './mask';

export type V3 = [number, number, number];
export interface Solid {
  faces: V3[][];
  tag?: string;
}

export type FaceKind = 'top' | 'left' | 'right' | 'bottom';

export interface IsoInfo {
  face: FaceKind;
  solid: number;
  tag?: string;
  world: V3;
  level: number;
}

export type IsoOverlay = (x: number, y: number, ch: string, info: IsoInfo) => string;

export interface IsoOpts {
  /** 投影後の最大サイズ(px) */
  fit?: number;
  cx?: number;
  cy?: number;
  /** 高さ方向の投影係数 */
  c?: number;
  light?: V3;
  /** スペキュラ(光沢点)の数 */
  specular?: number;
  overlay?: IsoOverlay;
}

const LV = 'dsblh';
export const lvChar = (l: number): string => LV[Math.max(0, Math.min(4, Math.round(l)))];
export const lvOf = (ch: string): number => LV.indexOf(ch);

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const centroid = (pts: V3[]): V3 => {
  const c: V3 = [0, 0, 0];
  for (const p of pts) {
    c[0] += p[0];
    c[1] += p[1];
    c[2] += p[2];
  }
  return [c[0] / pts.length, c[1] / pts.length, c[2] / pts.length];
};

/** 角錐台(上面が ix, iy だけ内側に縮んだ箱) */
export function frustum(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  z0: number,
  z1: number,
  ix = 0,
  iy = ix,
  tag?: string,
): Solid {
  const b00: V3 = [x0, y0, z0];
  const b10: V3 = [x1, y0, z0];
  const b11: V3 = [x1, y1, z0];
  const b01: V3 = [x0, y1, z0];
  const t00: V3 = [x0 + ix, y0 + iy, z1];
  const t10: V3 = [x1 - ix, y0 + iy, z1];
  const t11: V3 = [x1 - ix, y1 - iy, z1];
  const t01: V3 = [x0 + ix, y1 - iy, z1];
  return {
    tag,
    faces: [
      [b00, b10, b11, b01],
      [t00, t10, t11, t01],
      [b00, b10, t10, t00],
      [b10, b11, t11, t10],
      [b11, b01, t01, t11],
      [b01, b00, t00, t01],
    ],
  };
}

interface PF {
  pred: Pred;
  n: V3;
  k: number;
  kind: FaceKind;
  solid: number;
  tag?: string;
  level: number;
}

export function iso(solids: Solid[], o: IsoOpts = {}): string[] {
  const A = 1;
  const B = 0.5;
  const C = o.c ?? 1.15;
  const L = norm(o.light ?? [-0.25, 0.45, 1]);
  const D = norm([1, 1, (2 * B) / C]);
  const pr = (p: V3): [number, number] => [(p[0] - p[1]) * A, (p[0] + p[1]) * B - p[2] * C];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of solids)
    for (const f of s.faces)
      for (const p of f) {
        const [X, Y] = pr(p);
        minX = Math.min(minX, X);
        maxX = Math.max(maxX, X);
        minY = Math.min(minY, Y);
        maxY = Math.max(maxY, Y);
      }
  const fit = o.fit ?? 15;
  const sc = fit / Math.max(maxX - minX, maxY - minY);
  const ox = (o.cx ?? 8) - ((minX + maxX) / 2) * sc;
  const oy = (o.cy ?? 8) - ((minY + maxY) / 2) * sc;

  const pfs: PF[] = [];
  solids.forEach((sol, si) => {
    const cen = centroid(sol.faces.flat());
    for (const f of sol.faces) {
      let n = norm(cross(sub(f[1], f[0]), sub(f[2], f[0])));
      if (dot(n, sub(centroid(f), cen)) < 0) n = [-n[0], -n[1], -n[2]];
      if (dot(n, D) <= 1e-6) continue;
      const pts2 = f.map((p) => {
        const [X, Y] = pr(p);
        return [X * sc + ox, Y * sc + oy] as [number, number];
      });
      const br = dot(n, L);
      const level = br > 0.8 ? 3 : br > 0.35 ? 2 : br > -0.35 ? 1 : 0;
      const kind: FaceKind = n[2] > 0.6 ? 'top' : n[2] < -0.6 ? 'bottom' : n[1] >= n[0] ? 'left' : 'right';
      pfs.push({ pred: poly(pts2), n, k: dot(n, f[0]), kind, solid: si, tag: sol.tag, level });
    }
  });

  // スクリーン座標 + 面の平面 → ワールド座標
  const solve = (pf: PF, px: number, py: number): V3 => {
    const m = [
      [A * sc, -A * sc, 0],
      [B * sc, B * sc, -C * sc],
      pf.n,
    ];
    const r = [px - ox, py - oy, pf.k];
    const det3 = (a: number[][]) =>
      a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) -
      a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) +
      a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
    const d = det3(m) || 1e-9;
    const col = (i: number) => m.map((row, j) => row.map((v, c) => (c === i ? r[j] : v)));
    return [det3(col(0)) / d, det3(col(1)) / d, det3(col(2)) / d];
  };

  const fid = new Array<number>(256).fill(-1);
  const world: V3[] = new Array(256);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let best = -1;
      let bestD = -Infinity;
      let bw: V3 = [0, 0, 0];
      pfs.forEach((pf, i) => {
        if (!pf.pred(px, py)) return;
        const w = solve(pf, px, py);
        const dd = dot(w, D);
        if (dd > bestD + 1e-6) {
          bestD = dd;
          best = i;
          bw = w;
        }
      });
      fid[y * 16 + x] = best;
      world[y * 16 + x] = bw;
    }

  const F = (x: number, y: number): number => (x < 0 || y < 0 || x > 15 || y > 15 ? -1 : fid[y * 16 + x]);
  const isOutline = (x: number, y: number): boolean =>
    F(x, y) >= 0 && (F(x + 1, y) < 0 || F(x - 1, y) < 0 || F(x, y + 1) < 0 || F(x, y - 1) < 0);

  // 面ごとのピクセル範囲(グラデーション用)
  const range = pfs.map(() => ({ min: Infinity, max: -Infinity, count: 0 }));
  for (let i = 0; i < 256; i++) {
    const f = fid[i];
    if (f < 0) continue;
    const t = (i % 16) + ((i / 16) | 0);
    range[f].min = Math.min(range[f].min, t);
    range[f].max = Math.max(range[f].max, t);
    range[f].count++;
  }

  const lv = new Array<number>(256).fill(-1);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const i = y * 16 + x;
      const f = fid[i];
      if (f < 0 || isOutline(x, y)) continue;
      let l = pfs[f].level;
      // リムライト(左上が輪郭)/ リムシャドウ(右下が輪郭)
      if (isOutline(x, y - 1) || isOutline(x - 1, y)) l += 1;
      else if (isOutline(x, y + 1) || isOutline(x + 1, y)) l -= 1;
      // 稜線: 右/下に暗い面が隣接 → 明るい稜線
      const fr = F(x + 1, y);
      const fd = F(x, y + 1);
      const brighterEdge =
        (fr >= 0 && fr !== f && !isOutline(x + 1, y) && pfs[fr].level < pfs[f].level) ||
        (fd >= 0 && fd !== f && !isOutline(x, y + 1) && pfs[fd].level < pfs[f].level);
      if (brighterEdge) l = Math.max(l, pfs[f].level + 1);
      // 面内グラデーション(奥/右下ほど暗く)
      const r = range[f];
      if (r.count >= 14 && r.max > r.min) {
        const t = ((x + y) - r.min) / (r.max - r.min);
        if (t > 0.82 && !brighterEdge) l -= 1;
      }
      lv[i] = Math.max(0, Math.min(4, l));
    }

  // スペキュラ: 最も明るい上面の左上寄りの内側ピクセル
  const spec = new Set<number>();
  const nSpec = o.specular ?? 2;
  if (nSpec > 0) {
    const cands: number[] = [];
    for (let i = 0; i < 256; i++) {
      const f = fid[i];
      if (f < 0 || lv[i] < 3 || pfs[f].kind !== 'top') continue;
      const x = i % 16;
      const y = (i / 16) | 0;
      if (F(x - 1, y) !== f || F(x, y - 1) !== f) continue;
      cands.push(i);
    }
    cands.sort((a, b) => (a % 16) + ((a / 16) | 0) * 1.1 - ((b % 16) + ((b / 16) | 0) * 1.1));
    if (cands.length) {
      const p0 = cands[0];
      spec.add(p0);
      if (nSpec > 1 && cands.includes(p0 + 1)) spec.add(p0 + 1);
      else if (nSpec > 1 && cands[1] !== undefined) spec.add(cands[1]);
    }
  }

  const rows: string[] = [];
  for (let y = 0; y < 16; y++) {
    let row = '';
    for (let x = 0; x < 16; x++) {
      const i = y * 16 + x;
      const f = fid[i];
      if (f < 0) {
        row += '.';
        continue;
      }
      let ch = isOutline(x, y) ? '#' : spec.has(i) ? 'w' : lvChar(lv[i]);
      if (o.overlay) {
        const pf = pfs[f];
        ch = o.overlay(x, y, ch, { face: pf.kind, solid: pf.solid, tag: pf.tag, world: world[i], level: lv[i] });
      }
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}
