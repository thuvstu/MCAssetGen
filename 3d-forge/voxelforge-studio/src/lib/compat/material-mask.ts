/**
 * マスクベースの形状エンジン
 * 16x16 グリッドの各ピクセル中心 (x+0.5, y+0.5) を述語 (Pred) で判定し、
 * 輪郭・ハイライト・影を距離場から自動で付けてピクセルアートの行を生成する。
 */

export type Pred = (x: number, y: number) => boolean;

export const N = 16;

export const circle = (cx: number, cy: number, r: number): Pred => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

export const ellipse = (cx: number, cy: number, rx: number, ry: number): Pred => (x, y) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

export const rect = (x0: number, y0: number, x1: number, y1: number): Pred => (x, y) =>
  x >= x0 && x <= x1 && y >= y0 && y <= y1;

export const poly = (pts: [number, number][]): Pred => (x, y) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

export const segDist = (x: number, y: number, x0: number, y0: number, x1: number, y1: number): number => {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const L = dx * dx + dy * dy;
  const t = L === 0 ? 0 : Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / L));
  return Math.hypot(x0 + t * dx - x, y0 + t * dy - y);
};

export const seg = (x0: number, y0: number, x1: number, y1: number, w: number): Pred => (x, y) =>
  segDist(x, y, x0, y0, x1, y1) <= w / 2;

export const union = (...ps: Pred[]): Pred => (x, y) => ps.some((p) => p(x, y));

export const minus = (a: Pred, b: Pred): Pred => (x, y) => a(x, y) && !b(x, y);

export const ring = (cx: number, cy: number, ro: number, ri: number): Pred =>
  minus(circle(cx, cy, ro), circle(cx, cy, ri));

export const ringE = (cx: number, cy: number, rxo: number, ryo: number, rxi: number, ryi: number): Pred =>
  minus(ellipse(cx, cy, rxo, ryo), ellipse(cx, cy, rxi, ryi));

/** 折れ線(太さ付き) */
export const polyline = (pts: [number, number][], w: number): Pred =>
  union(...pts.slice(1).map((p, i) => seg(pts[i][0], pts[i][1], p[0], p[1], w)));

export const regular = (cx: number, cy: number, r: number, n: number, rot = -Math.PI / 2): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const a = rot + (i * 2 * Math.PI) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });

export const starPts = (cx: number, cy: number, ro: number, ri: number, n: number, rot = -Math.PI / 2): [number, number][] =>
  Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 === 0 ? ro : ri;
    const a = rot + (i * Math.PI) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });

/** 歯車(歯の数 teeth, 外径 ro, 谷径 ri, 中心穴 hole) */
export const gear = (cx: number, cy: number, ro: number, ri: number, teeth: number, hole: number): Pred => (x, y) => {
  const dx = x - cx;
  const dy = y - cy;
  const r = Math.hypot(dx, dy);
  if (r <= hole) return false;
  const a = Math.atan2(dy, dx);
  const t = Math.max(0, Math.min(1, Math.cos(teeth * a) * 2 + 0.6));
  return r <= ri + (ro - ri) * t;
};

/** 整数ピクセル座標(x,y)で述語を評価 */
export const at = (p: Pred, x: number, y: number): boolean => p(x + 0.5, y + 0.5);

/** ピクセル中心からの距離 */
export const dist = (x: number, y: number, cx: number, cy: number): number => Math.hypot(x + 0.5 - cx, y + 0.5 - cy);

/** 中心からの角度で扇形に文字を割り当てる(宝石のファセット用) */
export const sector = (x: number, y: number, cx: number, cy: number, chars: string): string => {
  const a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx);
  const i = Math.floor(((a + Math.PI) / (2 * Math.PI)) * chars.length) % chars.length;
  return chars[i];
};

export interface ShadeInfo {
  /** 外側からの距離 (1 = 輪郭) */
  depth: number;
  /** 光源方向の傾き (大きいほど明るい) */
  v: number;
}

export type Overlay = (x: number, y: number, ch: string, info: ShadeInfo) => string;

export interface ShadeOpts {
  /** false なら輪郭線を描かない */
  outline?: boolean;
  /** 形状外のピクセル文字 (既定 '.') */
  bg?: string;
  overlay?: Overlay;
  /** 形状全体に左上→右下の光源グラデーションを付ける (既定 true) */
  gradient?: boolean;
}

/**
 * ファセット(面)ごとにトーンを指定した形状を生成する。
 * list の先頭から順に判定し、最初にヒットした面のトーンを使う。
 */
export function facets(list: [Pred, string][], opts: Omit<ShadeOpts, 'gradient'> = {}): string[] {
  const mask = union(...list.map((f) => f[0]));
  return shade(mask, {
    ...opts,
    gradient: false,
    overlay: (x, y, ch, info) => {
      let c = ch;
      if (ch !== '#') {
        for (const [p, t] of list) {
          if (p(x + 0.5, y + 0.5)) {
            c = t;
            break;
          }
        }
      }
      return opts.overlay ? opts.overlay(x, y, c, info) : c;
    },
  });
}

/** (x, y) → 文字 の関数から16行を生成 */
export const grid = (f: (x: number, y: number) => string): string[] =>
  Array.from({ length: N }, (_, y) => Array.from({ length: N }, (_, x) => f(x, y)).join(''));

/**
 * マスクから自動シェーディング済みの16行の文字列を生成する。
 * 光源は左上。輪郭 '#'、左上の縁 'h'/'l'、右下の縁 's'/'d'、内部 'b'。
 */
export function shade(pred: Pred, opts: ShadeOpts = {}): string[] {
  const bg = opts.bg ?? '.';
  const ins: boolean[][] = Array.from({ length: N }, (_, y) =>
    Array.from({ length: N }, (_, x) => pred(x + 0.5, y + 0.5)),
  );
  const inAt = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < N && y < N && ins[y][x];

  // 背景(外側)からのマンハッタン距離を BFS で求める
  const depth: number[][] = Array.from({ length: N }, () => Array<number>(N).fill(Infinity));
  const q: [number, number][] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!ins[y][x]) continue;
      if (!inAt(x + 1, y) || !inAt(x - 1, y) || !inAt(x, y + 1) || !inAt(x, y - 1)) {
        depth[y][x] = 1;
        q.push([x, y]);
      }
    }
  }
  for (let qi = 0; qi < q.length; qi++) {
    const [x, y] = q[qi];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (inAt(nx, ny) && depth[ny][nx] === Infinity) {
        depth[ny][nx] = depth[y][x] + 1;
        q.push([nx, ny]);
      }
    }
  }

  const H = (x: number, y: number): number => (inAt(x, y) ? Math.min(depth[y][x], 4) : 0);

  // 形状全体のバウンディングボックス(光源グラデーション用)
  let bx0 = N;
  let by0 = N;
  let bx1 = -1;
  let by1 = -1;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      if (ins[y][x]) {
        bx0 = Math.min(bx0, x);
        by0 = Math.min(by0, y);
        bx1 = Math.max(bx1, x);
        by1 = Math.max(by1, y);
      }
  const bw = Math.max(1, bx1 - bx0);
  const bh = Math.max(1, by1 - by0);
  const useGrad = opts.gradient !== false && bw >= 7 && bh >= 7;
  const LV = 'dsblh';

  const rows: string[] = [];
  for (let y = 0; y < N; y++) {
    let row = '';
    for (let x = 0; x < N; x++) {
      if (!ins[y][x]) {
        row += bg;
        continue;
      }
      const d = depth[y][x];
      const v = H(x + 1, y) - H(x - 1, y) + H(x, y + 1) - H(x, y - 1);
      let ch: string;
      if (d === 1 && opts.outline !== false) ch = '#';
      else {
        let lvl = v >= 3 ? 4 : v >= 1 ? 3 : v >= -1 ? 2 : v >= -3 ? 1 : 0;
        if (d === 2 && v >= 2) lvl = 4;
        if (useGrad && d >= 3) {
          const t = ((x - bx0) / bw + (y - by0) / bh) / 2;
          if (t < 0.28) lvl += 1;
          else if (t > 0.74) lvl -= 1;
        }
        ch = LV[Math.max(0, Math.min(4, lvl))];
      }
      if (opts.overlay) ch = opts.overlay(x, y, ch, { depth: d, v });
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}
