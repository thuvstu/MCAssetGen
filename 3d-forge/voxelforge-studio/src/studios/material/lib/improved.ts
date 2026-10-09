/**
 * 初期形状のリワーク版
 * - インゴット / 延べ棒 / ナゲット / プレート : 疑似3D (iso)
 * - 宝石 / クリスタル : ファセット(多面カット)
 * - ブロック / タイル / 鉱石 : タイル前提の手続き的ディテール
 * - コイン / ロッド / 歯車 : 2D + 立体感のディテール
 */
import { iso, frustum } from './iso';
import { facets, grid, shade, poly, ellipse, union, circle, seg, gear, starPts, at, dist } from './mask';

const SEC_MAP: Record<string, string> = { b: '2', l: '3', h: '3', w: '3', s: '4', d: '4' };
const toSec = (ch: string): string => SEC_MAP[ch] ?? ch;

// ---------- 金属 (iso) ----------

const ingot = iso([frustum(0, 0, 5, 12, 0, 3, 1, 1)]);

const alloyIngot = iso([frustum(0, 0, 5, 12, 0, 3, 1, 1)], {
  overlay: (_x, _y, ch, { world }) => {
    if (ch === '#') return ch;
    const wy = world[1];
    if (wy > 4.4 && wy < 7.6) return toSec(ch);
    return ch;
  },
});

const bar = iso([frustum(0, 0, 8, 12, 0, 3, 1.3, 1.3)], {
  specular: 1,
  overlay: (_x, _y, ch, { face, world }) => {
    if (ch === '#' || face !== 'top') return ch;
    const [wx, wy] = world;
    const ix = Math.abs(wx - 4);
    const iy = Math.abs(wy - 6);
    if (ix <= 1.9 && iy <= 3.4) {
      // 刻印(凹み): 左上の内壁は影、右下の内壁は光る
      if (wx < 4 - 1.2 || wy < 6 - 2.6) return 'd';
      if (wx > 4 + 1.2 || wy > 6 + 2.6) return 'h';
      return 'b';
    }
    return ch;
  },
});

const nugget = iso(
  [
    frustum(0, 0, 3, 3.4, 0, 1.8, 0.6),
    frustum(2.6, 1.0, 5.6, 4.6, 0, 2.3, 0.7),
    frustum(0.4, 3.4, 3.2, 6.2, 0, 1.5, 0.5),
  ],
  { fit: 11, cy: 8.5, specular: 1 },
);

const plate = iso([frustum(0, 0, 10, 10, 0, 1.3, 0.5)], {
  specular: 0,
  overlay: (_x, _y, ch, { face, world }) => {
    if (ch === '#' || face !== 'top') return ch;
    const [wx, wy] = world;
    for (const [rx, ry] of [
      [2, 2],
      [8, 2],
      [2, 8],
      [8, 8],
    ]) {
      if (Math.hypot(wx - rx, wy - ry) <= 0.9) return 'd';
    }
    if (wx > 2.6 && wx < 3.8) return 'h';
    if (wx > 4.4 && wx < 4.9) return 'h';
    return ch;
  },
});

// ---------- 宝石 (ファセット) ----------

const CULET: [number, number] = [8, 14.6];
const gem = facets(
  [
    // クラウン (上部)
    [poly([[1.4, 7.2], [5, 2.6], [4, 7.2]]), 'l'],
    [poly([[5, 2.6], [6.6, 7.2], [4, 7.2]]), 'h'],
    [poly([[5, 2.6], [11, 2.6], [9.4, 7.2], [6.6, 7.2]]), 'l'],
    [poly([[11, 2.6], [12, 7.2], [9.4, 7.2]]), 'b'],
    [poly([[11, 2.6], [14.6, 7.2], [12, 7.2]]), 's'],
    // パビリオン (下部)
    [poly([[1.4, 7.2], [4, 7.2], CULET]), 'b'],
    [poly([[4, 7.2], [6.6, 7.2], CULET]), 'l'],
    [poly([[6.6, 7.2], [9.4, 7.2], CULET]), 'b'],
    [poly([[9.4, 7.2], [12, 7.2], CULET]), 's'],
    [poly([[12, 7.2], [14.6, 7.2], CULET]), 'd'],
  ],
  {
    overlay: (x, y, ch) => {
      if (ch === '#') return ch;
      if ((x === 6 && y === 4) || (x === 5 && y === 5)) return 'w';
      if (y === 7) return x < 8 ? 'h' : 'l';
      if (x === 7 && y >= 9 && y <= 11) return 'h';
      return ch;
    },
  },
);

const crystal = facets(
  [
    [poly([[8, 0.6], [4.4, 4.6], [6.6, 5.6]]), 'h'],
    [poly([[8, 0.6], [6.6, 5.6], [9.4, 5.6]]), 'l'],
    [poly([[8, 0.6], [9.4, 5.6], [11.6, 4.6]]), 'b'],
    [poly([[4.4, 4.6], [6.6, 5.6], [6.6, 14], [4.4, 12.4]]), 'l'],
    [poly([[6.6, 5.6], [9.4, 5.6], [9.4, 14], [6.6, 14]]), 'b'],
    [poly([[9.4, 5.6], [11.6, 4.6], [11.6, 12.4], [9.4, 14]]), 's'],
    [poly([[4.4, 12.4], [6.6, 14], [8, 15.6]]), 's'],
    [poly([[6.6, 14], [9.4, 14], [8, 15.6]]), 's'],
    [poly([[9.4, 14], [11.6, 12.4], [8, 15.6]]), 'd'],
  ],
  {
    overlay: (x, y, ch) => {
      if (ch === '#') return ch;
      if (x === 7 && y >= 6 && y <= 12) return y === 7 ? 'w' : 'h';
      if (x === 5 && y >= 6 && y <= 10) return 'h';
      return ch;
    },
  },
);

// ---------- ブロック (タイル前提) ----------

const block = grid((x, y) => {
  if (x === 15 || y === 15) return x === 0 || y === 0 ? 's' : 'd';
  if (x === 0 || y === 0) return 'h';
  if (x === 14 || y === 14) return x === 1 || y === 1 ? 'b' : 's';
  if (x === 1 || y === 1) return 'l';
  // 四隅のリベット
  if ((x === 2 || x === 13) && (y === 2 || y === 13)) return 'h';
  if ((x === 3 || x === 14) && (y === 3 || y === 14) && x <= 13 && y <= 13) return 's';
  // 凹んだパネル(3..12)
  if (x >= 3 && x <= 12 && y >= 3 && y <= 12) {
    if (x === 3 || y === 3) return x === 12 || y === 12 ? 'b' : 'd';
    if (x === 12 || y === 12) return 'h';
    const s = x + y;
    if (s === 9 || s === 10) return 'l';
    if (s === 11) return 'h';
    if (s >= 20) return 's';
    return 'b';
  }
  return 'b';
});

const tiles = grid((x, y) => {
  const lx = x % 8;
  const ly = y % 8;
  if (lx === 7 || ly === 7) return 'd';
  if (lx === 0 || ly === 0) return 'h';
  if (lx === 6 || ly === 6) return 's';
  if (lx === 1 || ly === 1) return 'l';
  const s = lx + ly;
  if (s === 4) return 'w';
  if (s === 5) return 'l';
  if (s >= 9) return 's';
  return 'b';
});

const ORE_BLOBS: [number, number, number][] = [
  [4.2, 4.2, 2.0],
  [11.6, 3.2, 1.4],
  [10.6, 9.8, 2.2],
  [4.6, 11.6, 1.7],
  [13.4, 13.6, 1.2],
  [7.6, 7.4, 1.0],
];
const inBlob = (px: number, py: number): [number, number, number] | null => {
  for (const b of ORE_BLOBS) if ((px - b[0]) ** 2 + (py - b[1]) ** 2 <= b[2] * b[2]) return b;
  return null;
};
const ore = grid((x, y) => {
  const px = x + 0.5;
  const py = y + 0.5;
  const b = inBlob(px, py);
  if (b) {
    const u = (px - b[0] + (py - b[1])) / b[2];
    // 鉱石粒の輪郭(右下)は深影
    if (!inBlob(px + 1, py) || !inBlob(px, py + 1)) return u > 0 ? 'd' : 's';
    if (u < -0.75 && b[2] >= 1.6) return 'w';
    if (u < -0.4) return 'h';
    if (u < 0.3) return 'l';
    if (u < 0.8) return 'b';
    return 's';
  }
  // 石に落ちる影
  if (inBlob(px - 1, py - 1) || inBlob(px - 1, py) || inBlob(px, py - 1)) return '#';
  return 'r';
});

// ---------- 部品 ----------

const COIN_FACE = ellipse(8, 7, 6.6, 5.4);
const COIN_STAR = poly(starPts(8, 7.2, 3, 1.3, 5));
const coin = shade(union(COIN_FACE, ellipse(8, 9, 6.6, 5.4)), {
  overlay: (x, y, ch) => {
    if (ch === '#') return ch;
    const px = x + 0.5;
    const py = y + 0.5;
    if (!COIN_FACE(px, py)) {
      // ギザギザの側面
      if (x < 8) return x % 2 ? 'b' : 's';
      return x % 2 ? 's' : 'd';
    }
    const e = ((px - 8) / 6.6) ** 2 + ((py - 7) / 5.4) ** 2;
    if (e > 0.5 && e <= 0.66) return x + y < 15 ? 's' : 'd';
    if (e > 0.66 && e <= 0.8) return x + y < 15 ? 'h' : 'l';
    if (at(COIN_STAR, x, y)) return x + y < 15 ? 'h' : 'l';
    if (at(COIN_STAR, x - 1, y - 1)) return 's';
    return ch;
  },
});

const rod = shade(seg(3, 13, 13, 3, 3.6), {
  overlay: (x, y, ch) => {
    if (ch === '#') return ch;
    const off = (16 - (x + 0.5) - (y + 0.5)) / Math.SQRT2;
    if (off > 0.25 && off < 1.0) return 'h';
    if (off < -0.8) return 's';
    if (dist(x, y, 3, 13) < 1.6) return 's';
    return ch;
  },
});

const gearRows = shade(gear(8, 8, 7.2, 5.8, 8, 2.2), {
  overlay: (x, y, ch) => {
    if (ch === '#') return ch;
    const d = dist(x, y, 8, 8);
    if (d <= 3.6) return x + y < 15 ? 's' : 'h';
    if (d <= 4.4) return x + y < 15 ? 'h' : 'd';
    return ch;
  },
});

const raw = shade(
  union(
    poly([
      [3, 6],
      [5, 3],
      [10, 2.5],
      [13, 5],
      [14, 10],
      [11, 14],
      [5, 14],
      [2, 10],
    ]),
    circle(12.5, 11.5, 2),
  ),
  {
    overlay: (x, y, ch, { depth }) => {
      if (depth < 3) return ch;
      if ((x === 6 && y === 7) || (x === 9 && y === 10) || (x === 7 && y === 11)) return 'd';
      if ((x === 7 && y === 6) || (x === 10 && y === 9)) return 'h';
      return 'n';
    },
  },
);

export const UPGRADED: Record<string, string[]> = {
  ingot,
  alloy_ingot: alloyIngot,
  bar,
  nugget,
  plate,
  gem,
  crystal,
  block,
  tile_block: tiles,
  ore,
  deepslate_ore: ore,
  coin,
  rod,
  gear: gearRows,
  raw,
};
