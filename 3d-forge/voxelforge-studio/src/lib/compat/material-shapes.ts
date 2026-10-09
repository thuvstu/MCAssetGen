/**
 * 形状定義 (16x16)
 * すべてマスク(述語)から自動シェーディングで生成する。
 *
 * 凡例
 *  .  透明 / r 石背景
 *  #  輪郭(最暗)
 *  d  深影 / s 影 / b ベース / l 明 / h ハイライト / w 光沢
 *  n  ノイズ(粒状)
 *  g  発光(ルーン・魔力など)
 *  2  サブカラー ベース / 3 サブ明 / 4 サブ影
 */
import {
  circle,
  ellipse,
  rect,
  poly,
  seg,
  polyline,
  union,
  minus,
  ring,
  ringE,
  regular,
  starPts,
  gear,
  shade,
  sector,
  dist,
  at,
  type Pred,
  type Overlay,
} from "./material-mask";

import { UPGRADED } from "./material-improved";

export type ShapeCategory = 'metal' | 'gem' | 'raw' | 'block' | 'part' | 'relic';

export interface Shape {
  id: string;
  name: string;
  category: ShapeCategory;
  /** ファイル名パターン。{name} が素材名に置換される */
  file: string;
  rock?: 'stone' | 'deepslate';
  rows: string[];
}

const mk = (
  id: string,
  name: string,
  category: ShapeCategory,
  file: string,
  rows: string[],
  rock?: Shape['rock'],
): Shape => ({ id, name, category, file, rows, rock });

/** 面ごとに色を割り当てるオーバーレイ */
const facet = (cx: number, cy: number, chars: string, minDepth = 2): Overlay => (x, y, ch, { depth }) =>
  depth >= minDepth ? sector(x, y, cx, cy, chars) : ch;

/** 役割文字をサブカラー系に置き換える */
const SEC_MAP: Record<string, string> = { b: '2', l: '3', h: '3', s: '4', d: '4' };
const toSec = (ch: string): string => SEC_MAP[ch] ?? ch;

/** 斜めの帯をサブカラーに置き換える(合金) */
const ALLOY_STRIPE: Overlay = (x, y, ch, { depth }) => {
  const band = x + 0.7 * y;
  if (depth < 2 || band < 10 || band > 13.5) return ch;
  return toSec(ch);
};

/** 短剣の刃と柄 */
const BLADE = poly([
  [1.2, 1.2],
  [3.8, 1.4],
  [10.6, 8.2],
  [8.2, 10.6],
  [1.4, 3.8],
]);
const HANDLE = seg(10.6, 10.6, 13.2, 13.2, 2.4);

const INGOT = poly([
  [1.5, 7],
  [3.5, 4],
  [12.5, 4],
  [14.5, 7],
  [13.5, 12],
  [2.5, 12],
]);

const BAR = poly([
  [1, 5],
  [3, 3],
  [13, 3],
  [15, 5],
  [15, 11],
  [13, 13],
  [3, 13],
  [1, 11],
]);

const ORE_MASK: Pred = union(
  circle(4.5, 4.5, 2.4),
  circle(11.5, 9.5, 2.6),
  circle(5.5, 12, 1.9),
  circle(12.5, 3.2, 1.6),
  circle(9, 6.8, 1.2),
);

const ORE_OPTS = {
  outline: false,
  bg: 'r',
  overlay: ((_x, _y, ch, { depth }) => (depth >= 2 ? 'n' : ch)) as Overlay,
};

const STAR = poly(starPts(8, 8, 3, 1.3, 5));
const EYE_L = ellipse(5.5, 7.5, 1.9, 1.3);
const EYE_R = ellipse(10.5, 7.5, 1.9, 1.3);

/** ルーン文字(8x8) */
const RUNE: string[] = [
  '..#..#..',
  '..#..#..',
  '.######.',
  '..#..#..',
  '.#.##.#.',
  '#......#',
  '.#....#.',
  '..####..',
];

const BASE_SHAPES: Shape[] = [
  // ---------- 金属 ----------
  mk('ingot', 'インゴット', 'metal', '{name}_ingot', shade(INGOT)),
  mk('alloy_ingot', '合金インゴット', 'metal', '{name}_alloy_ingot', shade(INGOT, { overlay: ALLOY_STRIPE })),
  mk(
    'nugget',
    'ナゲット',
    'metal',
    '{name}_nugget',
    shade(union(circle(7, 8.5, 4), circle(10.5, 6.8, 3.1), circle(10.2, 11, 2.6), circle(5, 11.2, 2.1)), {
      overlay: (x, y, ch) => (x === 5 && y === 5 ? 'w' : ch),
    }),
  ),
  mk(
    'bar',
    '延べ棒',
    'metal',
    '{name}_bar',
    shade(BAR, {
      overlay: (x, y, ch, { depth }) => {
        if (depth >= 3 && x >= 5 && x <= 10 && y >= 6 && y <= 9) {
          return x === 5 || x === 10 || y === 6 || y === 9 ? 'd' : 'l';
        }
        return ch;
      },
    }),
  ),

  // ---------- 宝石・結晶 ----------
  mk(
    'gem',
    '宝石',
    'gem',
    '{name}',
    shade(poly(regular(8, 8, 7.2, 8, Math.PI / 8)), {
      overlay: (x, y, ch, { depth }) => {
        if (depth < 2) return ch;
        if (x === 5 && y === 5) return 'w';
        return sector(x, y, 8, 8, 'hlbsdb');
      },
    }),
  ),
  mk(
    'crystal',
    'クリスタル',
    'gem',
    '{name}_crystal',
    shade(
      poly([
        [8, 0.5],
        [11.5, 5],
        [12, 11.5],
        [8, 15.5],
        [4, 11.5],
        [4.5, 5],
      ]),
      {
        overlay: (x, _y, ch, { depth }) => {
          if (depth < 2) return ch;
          const u = x + 0.5;
          return u < 6.5 ? 'l' : u < 8.5 ? 'h' : u < 11 ? 'b' : 's';
        },
      },
    ),
  ),
  mk(
    'cluster',
    'クリスタル群',
    'gem',
    '{name}_cluster',
    shade(
      union(
        poly([
          [7, 1],
          [9.8, 5],
          [10, 11],
          [7, 14.5],
          [4.2, 11],
          [4.4, 5],
        ]),
        poly([
          [12.2, 6],
          [14.6, 9],
          [14.4, 14],
          [12, 15],
          [9.8, 13],
          [9.8, 9],
        ]),
        poly([
          [2.2, 8],
          [4.6, 6.2],
          [5, 12.5],
          [3, 14.2],
          [1.4, 12],
        ]),
      ),
      {
        overlay: (x, _y, ch, { depth }) => {
          if (depth < 2) return ch;
          const u = x + 0.5;
          return u < 6 ? 'l' : u < 10 ? 'b' : 's';
        },
      },
    ),
  ),
  mk(
    'shard',
    '欠片',
    'gem',
    '{name}_shard',
    shade(
      poly([
        [2, 13.5],
        [3.5, 6.5],
        [7, 2.5],
        [11, 4],
        [14, 9.5],
        [10.5, 14.5],
        [6, 15],
      ]),
      { overlay: facet(8, 8, 'hlbsdb') },
    ),
  ),
  mk(
    'orb',
    'オーブ(珠)',
    'gem',
    '{name}_orb',
    shade(circle(8, 8, 6.6), {
      overlay: (x, y, ch) => {
        if (dist(x, y, 8, 8) <= 2.4) return 'g';
        if ((x === 4 && y === 4) || (x === 5 && y === 3)) return 'w';
        return ch;
      },
    }),
  ),

  // ---------- 原料 ----------
  mk(
    'dust',
    '粉(ダスト)',
    'raw',
    '{name}_dust',
    shade(union(ellipse(8, 10.5, 6.3, 4), circle(5, 7.5, 2.6), circle(11.5, 7, 2.2)), {
      outline: false,
      overlay: () => 'n',
    }),
  ),
  mk(
    'raw',
    '原石(Raw)',
    'raw',
    'raw_{name}',
    shade(
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
      { overlay: (_x, _y, ch, { depth }) => (depth >= 3 ? 'n' : ch) },
    ),
  ),
  mk(
    'clump',
    '塊(クランプ)',
    'raw',
    '{name}_clump',
    shade(union(circle(5, 10, 3), circle(10.5, 9.5, 3.2), circle(7.5, 5.5, 2.6)), {
      overlay: (_x, _y, ch, { depth }) => (depth >= 2 ? 'n' : ch),
    }),
  ),

  // ---------- ブロック ----------
  mk('ore', '鉱石(石)', 'block', '{name}_ore', shade(ORE_MASK, ORE_OPTS), 'stone'),
  mk('deepslate_ore', '鉱石(深層岩)', 'block', 'deepslate_{name}_ore', shade(ORE_MASK, ORE_OPTS), 'deepslate'),
  mk(
    'block',
    'ブロック',
    'block',
    '{name}_block',
    shade(rect(0.5, 0.5, 15.5, 15.5), {
      overlay: (x, y, ch) =>
        x >= 3 && x <= 12 && y >= 3 && y <= 12 && (x === 3 || x === 12 || y === 3 || y === 12) ? 'd' : ch,
    }),
  ),
  mk(
    'tile_block',
    'タイルブロック',
    'block',
    '{name}_tiles',
    shade(union(rect(0.5, 0.5, 7.5, 7.5), rect(9.5, 0.5, 15.5, 7.5), rect(0.5, 9.5, 7.5, 15.5), rect(9.5, 9.5, 15.5, 15.5)), {
      bg: 'd',
    }),
  ),

  // ---------- 部品 ----------
  mk(
    'plate',
    'プレート(板)',
    'part',
    '{name}_plate',
    shade(
      poly([
        [3, 2.5],
        [13, 2.5],
        [14.5, 4],
        [14.5, 12],
        [13, 13.5],
        [3, 13.5],
        [1.5, 12],
        [1.5, 4],
      ]),
      {
        overlay: (x, y, ch) => {
          for (const [rx, ry] of [
            [4.5, 4.5],
            [11.5, 4.5],
            [4.5, 11.5],
            [11.5, 11.5],
          ]) {
            const d = dist(x, y, rx, ry);
            if (d <= 0.9) return 'l';
            if (d <= 1.6) return 'd';
          }
          return ch;
        },
      },
    ),
  ),
  mk('rod', 'ロッド(棒)', 'part', '{name}_rod', shade(seg(3, 13, 13, 3, 3.6))),
  mk('gear', '歯車', 'part', '{name}_gear', shade(gear(8, 8, 7.2, 5.8, 8, 2.4))),
  mk(
    'coin',
    'コイン',
    'part',
    '{name}_coin',
    shade(circle(8, 8, 6.8), {
      overlay: (x, y, ch, { depth }) => {
        const d = dist(x, y, 8, 8);
        if (d >= 5 && d <= 5.9) return 's';
        if (depth >= 2 && at(STAR, x, y)) return 'h';
        return ch;
      },
    }),
  ),
  mk(
    'ring',
    'リング',
    'part',
    '{name}_ring',
    shade(union(minus(ellipse(8, 9.5, 6, 5.2), ellipse(8, 10, 3.6, 3.2)), circle(8, 3.4, 2.4)), {
      overlay: (x, y, ch) => (dist(x, y, 8, 3.4) <= 2.2 ? sector(x, y, 8, 3.4, 'hlbsdb') : ch),
    }),
  ),
  mk(
    'bolt',
    'ボルト',
    'part',
    '{name}_bolt',
    shade(
      union(
        poly([
          [3, 2],
          [13, 2],
          [14, 3.5],
          [14, 5],
          [13, 6.5],
          [3, 6.5],
          [2, 5],
          [2, 3.5],
        ]),
        rect(6.5, 6, 9.5, 14.5),
      ),
      {
        overlay: (x, y, ch) => {
          if (ch === '#') return ch;
          if (y === 3 && x >= 4 && x <= 11) return 'd';
          if (x >= 6 && x <= 9 && y >= 7 && y % 2 === 1) return 's';
          return ch;
        },
      },
    ),
  ),
  mk('chain', 'チェーン', 'part', '{name}_chain', shade(union(ringE(8, 4.2, 3.2, 3.8, 1.8, 2.3), ringE(8, 11.8, 3.2, 3.8, 1.8, 2.3)))),
  mk(
    'coil',
    'コイル(巻線)',
    'part',
    '{name}_coil',
    shade(
      union(
        ringE(8, 3.6, 6.2, 2, 4.8, 0.9),
        ringE(8, 8, 6.2, 2, 4.8, 0.9),
        ringE(8, 12.4, 6.2, 2, 4.8, 0.9),
      ),
    ),
  ),
  mk('wire', 'ワイヤー', 'part', '{name}_wire', shade(polyline([[1.5, 3], [6, 3], [8.5, 8], [10, 8], [14.5, 13]], 2.2))),

  // ---------- レリック・アーティファクト ----------
  mk(
    'amulet',
    '護符(アミュレット)',
    'relic',
    '{name}_amulet',
    shade(union(ring(8, 3.2, 3.4, 2.2), circle(8, 10.6, 4.8)), {
      overlay: (x, y, ch) => {
        const d = dist(x, y, 8, 10.6);
        if (d <= 1.6) return 'g';
        if (d <= 3) return sector(x, y, 8, 10.6, '324234');
        return ch;
      },
    }),
  ),
  mk(
    'chalice',
    '聖杯',
    'relic',
    '{name}_chalice',
    shade(
      union(
        poly([
          [2.5, 2.5],
          [13.5, 2.5],
          [12.5, 7],
          [10.5, 9.5],
          [5.5, 9.5],
          [3.5, 7],
        ]),
        rect(7, 9, 9, 12),
        ellipse(8, 13.2, 4, 1.8),
      ),
      { overlay: (x, y, ch) => (y >= 4 && y <= 5 && x % 3 === 1 && ch !== '#' ? 'g' : ch) },
    ),
  ),
  mk(
    'crown',
    '王冠',
    'relic',
    '{name}_crown',
    shade(
      poly([
        [2, 13.5],
        [2, 5],
        [5, 8.5],
        [8, 3],
        [11, 8.5],
        [14, 5],
        [14, 13.5],
      ]),
      {
        overlay: (x, y, ch) => {
          if (ch === '#') return ch;
          if (dist(x, y, 2.5, 5.5) <= 1.1 || dist(x, y, 8, 3.8) <= 1.1 || dist(x, y, 13.5, 5.5) <= 1.1) return 'g';
          if (y === 10) return 'h';
          if (y === 11) return 'd';
          return ch;
        },
      },
    ),
  ),
  mk(
    'mask',
    '仮面',
    'relic',
    '{name}_mask',
    shade(
      poly([
        [2.5, 4],
        [8, 2.2],
        [13.5, 4],
        [14.5, 8],
        [11.5, 13.5],
        [8, 15],
        [4.5, 13.5],
        [1.5, 8],
      ]),
      {
        overlay: (x, y, ch) => {
          if (ch === '#') return ch;
          if (at(EYE_L, x, y) || at(EYE_R, x, y)) return 'g';
          if (x === 8 && y >= 6 && y <= 9) return 'd';
          if (y === 12 && x >= 6 && x <= 9) return 'd';
          return ch;
        },
      },
    ),
  ),
  mk(
    'rune_tablet',
    'ルーン石板',
    'relic',
    '{name}_rune_tablet',
    shade(
      poly([
        [3, 1.5],
        [13, 1.5],
        [14.5, 3],
        [14.5, 13],
        [13, 14.5],
        [3, 14.5],
        [1.5, 13],
        [1.5, 3],
      ]),
      {
        overlay: (x, y, ch) => {
          const gx = x - 4;
          const gy = y - 4;
          if (gx >= 0 && gx < 8 && gy >= 0 && gy < 8 && RUNE[gy][gx] === '#' && ch !== '#') return 'g';
          return ch;
        },
      },
    ),
  ),
  mk(
    'ancient_key',
    '古代の鍵',
    'relic',
    '{name}_key',
    shade(union(ring(4.8, 4.8, 3.6, 2), seg(7.5, 7.5, 13.5, 13.5, 2.4), seg(10.5, 10.5, 12.5, 8.5, 1.6), seg(12.5, 12.5, 14, 10.5, 1.6))),
  ),
  mk(
    'hourglass',
    '砂時計',
    'relic',
    '{name}_hourglass',
    shade(
      union(
        poly([
          [3.5, 3],
          [12.5, 3],
          [9, 8],
          [12.5, 13],
          [3.5, 13],
          [7, 8],
        ]),
        rect(2, 1.5, 14, 2.8),
        rect(2, 13.2, 14, 14.5),
      ),
      {
        overlay: (x, y, ch) => {
          if (ch === '#') return ch;
          if (y === 1 || y === 2 || y === 13 || y === 14) return '2';
          const u = Math.abs(x + 0.5 - 8);
          if (y >= 4 && y <= 6 && u <= 2.6 - (y - 4) * 0.9) return '3';
          if (y >= 10 && y <= 12 && u <= 2 + (y - 10) * 0.6) return '3';
          return ch;
        },
      },
    ),
  ),
  mk(
    'compass',
    '羅針盤',
    'relic',
    '{name}_compass',
    shade(circle(8, 8, 6.8), {
      overlay: (x, y, ch, { depth }) => {
        const dx = x + 0.5 - 8;
        const dy = y + 0.5 - 8;
        const d = Math.hypot(dx, dy);
        if (d >= 5 && d <= 5.8 && depth >= 2) return 's';
        if (Math.abs(dx) / 1.2 + Math.abs(dy) / 5.2 <= 1) return dy < 0 ? '2' : 'h';
        return ch;
      },
    }),
  ),
  mk(
    'scepter',
    '王笏',
    'relic',
    '{name}_scepter',
    shade(union(seg(3.5, 13, 10.5, 6, 2.2), circle(11.5, 4.5, 3)), {
      overlay: (x, y, ch) => (dist(x, y, 11.5, 4.5) <= 1.3 ? 'g' : ch),
    }),
  ),
  mk(
    'tome',
    '魔導書',
    'relic',
    '{name}_tome',
    shade(
      poly([
        [2, 2.5],
        [13.5, 2.5],
        [14.5, 4],
        [14.5, 13],
        [13.5, 14.5],
        [2, 14.5],
      ]),
      {
        overlay: (x, y, ch) => {
          if (ch === '#') return ch;
          if (x >= 12) return '3';
          if (x <= 3) return 'd';
          const d = dist(x, y, 7.5, 8);
          if (d <= 0.9 || (d >= 2.2 && d <= 3)) return 'g';
          return ch;
        },
      },
    ),
  ),
  mk(
    'horn',
    '角笛',
    'relic',
    '{name}_horn',
    shade(union(poly([[2, 6], [9, 4.5], [14.5, 2], [14.5, 14], [9, 11.5], [2, 10]]), rect(0.5, 6.5, 2.5, 9.5)), {
      overlay: (x, _y, ch) => {
        if (ch === '#') return ch;
        if (x === 6 || x === 10) return 'd';
        if (x >= 13) return '2';
        return ch;
      },
    }),
  ),
  mk(
    'reliquary',
    '聖遺物箱',
    'relic',
    '{name}_reliquary',
    shade(
      poly([
        [2, 7],
        [8, 2.5],
        [14, 7],
        [14, 14],
        [2, 14],
      ]),
      {
        overlay: (x, y, ch) => {
          if (ch === '#') return ch;
          if ((x === 7 || x === 8) && y >= 5 && y <= 11) return 'g';
          if (y >= 8 && y <= 9 && x >= 5 && x <= 10) return 'g';
          if (y === 11) return 'd';
          return ch;
        },
      },
    ),
  ),
  mk(
    'scroll',
    '巻物',
    'relic',
    '{name}_scroll',
    shade(union(rect(4.5, 3, 11.5, 13), ellipse(8, 3.2, 5.6, 1.7), ellipse(8, 12.8, 5.6, 1.7)), {
      overlay: (x, y, ch) => {
        if (ch === '#') return ch;
        if (y <= 4 || y >= 11) return toSec(ch);
        if ((y === 6 || y === 8) && x >= 6 && x <= 9) return 'd';
        if (y === 10 && x >= 6 && x <= 7) return 'd';
        return ch;
      },
    }),
  ),
  mk(
    'totem',
    'トーテム',
    'relic',
    '{name}_totem',
    shade(union(rect(5.5, 1.5, 10.5, 5.5), rect(6.5, 5.5, 9.5, 12.5), rect(2.5, 7.5, 13.5, 9.5), rect(5.5, 12.5, 10.5, 14.5)), {
      overlay: (x, y, ch) => {
        if (ch === '#') return ch;
        if ((x === 6 || x === 9) && y === 3) return 'g';
        if ((x === 7 || x === 8) && (y === 10 || y === 11)) return 'g';
        if (y === 6 && x >= 6 && x <= 9) return '2';
        if (y === 8 && (x <= 4 || x >= 11)) return '2';
        return ch;
      },
    }),
  ),
  mk(
    'skull',
    '頭蓋骨',
    'relic',
    '{name}_skull',
    shade(union(circle(8, 6.5, 5.8), rect(5, 9, 11, 13.5)), {
      overlay: (x, y, ch) => {
        if (ch === '#') return ch;
        const dl = dist(x, y, 5.6, 6.5);
        const dr = dist(x, y, 10.4, 6.5);
        if (dl <= 0.8 || dr <= 0.8) return 'g';
        if (dl <= 1.7 || dr <= 1.7) return 'd';
        if ((x === 7 || x === 8) && y === 9) return 'd';
        if (y === 12 && x % 2 === 0) return 'd';
        if (y === 11) return 's';
        return ch;
      },
    }),
  ),
  mk(
    'eye',
    '魔眼',
    'relic',
    '{name}_eye',
    shade(
      poly([
        [0.8, 8],
        [4, 4.4],
        [8, 3.4],
        [12, 4.4],
        [15.2, 8],
        [12, 11.6],
        [8, 12.6],
        [4, 11.6],
      ]),
      {
        overlay: (x, y, ch) => {
          if (ch === '#') return ch;
          const d = dist(x, y, 8, 8);
          if (d <= 1.1) return '#';
          if (d <= 1.9) return 'g';
          if (d <= 3) return x === 6 && y === 6 ? 'w' : sector(x, y, 8, 8, '323424');
          if (d <= 3.6) return 'd';
          return ch;
        },
      },
    ),
  ),
  mk(
    'lantern',
    'ランタン',
    'relic',
    '{name}_lantern',
    shade(union(ring(7.5, 3, 2.4, 1.2), rect(5.5, 4.5, 9.5, 5.5), rect(4.5, 5.5, 10.5, 12.5), rect(5.5, 12.5, 9.5, 14.5)), {
      overlay: (x, y, ch) => {
        if (ch === '#') return ch;
        if (x >= 5 && x <= 9 && y >= 7 && y <= 11) return x === 7 || y === 9 ? 'd' : 'g';
        return ch;
      },
    }),
  ),
  mk(
    'dagger',
    '短剣',
    'relic',
    '{name}_dagger',
    shade(union(BLADE, seg(7, 12, 12, 7, 1.9), HANDLE, circle(14, 14, 1.6)), {
      overlay: (x, y, ch) => {
        if (ch === '#') return ch;
        if (dist(x, y, 14, 14) <= 0.9) return 'g';
        if (at(BLADE, x, y)) return x === y ? 'h' : x > y ? 'l' : 's';
        if (at(HANDLE, x, y)) return toSec(ch);
        return ch;
      },
    }),
  ),
  mk(
    'shield',
    '盾',
    'relic',
    '{name}_shield',
    shade(
      poly([
        [1.6, 1.4],
        [14.4, 1.4],
        [14.4, 7.5],
        [8, 15.2],
        [1.6, 7.5],
      ]),
      {
        overlay: (x, y, ch) => {
          if (ch === '#') return ch;
          const d = dist(x, y, 8, 7);
          if (d <= 1.2) return 'g';
          if (d <= 2.3) return 'h';
          if (x === 7 || x === 8 || y === 6 || y === 7) return toSec(ch);
          return ch;
        },
      },
    ),
  ),
  mk(
    'mirror',
    '手鏡',
    'relic',
    '{name}_mirror',
    shade(union(circle(8, 6.5, 5.8), seg(8, 11, 8, 14.5, 3.4)), {
      overlay: (x, y, ch) => {
        if (ch === '#') return ch;
        const d = dist(x, y, 8, 6.5);
        if (d <= 3.6) {
          if ((x === 6 && y === 4) || (x === 5 && y === 5) || (x === 9 && y === 8)) return 'w';
          const s = x + y - 14;
          return s < -2 ? '3' : s > 2 ? '4' : '2';
        }
        if (d <= 4.4) return 'd';
        return ch;
      },
    }),
  ),
  mk(
    'star',
    '星のかけら',
    'relic',
    '{name}_star',
    shade(poly(starPts(8.5, 8.5, 7.4, 3.8, 5)), {
      overlay: (x, y, ch) => (ch !== '#' && dist(x, y, 8.5, 8.5) <= 1.6 ? 'g' : ch),
    }),
  ),
  mk(
    'vial',
    '小瓶(エッセンス)',
    'relic',
    '{name}_vial',
    shade(union(rect(6, 0.8, 10, 5.5), circle(8, 10, 5)), {
      overlay: (x, y, ch) => {
        if (ch === '#') return ch;
        if (y <= 3) return toSec(ch);
        if (y <= 5) return 'l';
        if (y === 7) return 'h';
        if (x === 4 && y >= 8 && y <= 10) return 'w';
        if (dist(x, y, 8, 10.5) <= 1.5) return 'g';
        return ch;
      },
    }),
  ),
];

/** リワーク版の形状で置き換える */
export const SHAPES: Shape[] = BASE_SHAPES.map((s) => (UPGRADED[s.id] ? { ...s, rows: UPGRADED[s.id] } : s));

export const CATEGORY_LABEL: Record<ShapeCategory, string> = {
  metal: '金属',
  gem: '宝石・結晶',
  raw: '原料',
  block: 'ブロック',
  part: '部品',
  relic: 'レリック・アーティファクト',
};

export const SHAPE_ROLES: { char: string; label: string }[] = [
  { char: '.', label: '透明' },
  { char: '#', label: '輪郭' },
  { char: 'd', label: '深影' },
  { char: 's', label: '影' },
  { char: 'b', label: 'ベース' },
  { char: 'l', label: '明' },
  { char: 'h', label: 'ハイライト' },
  { char: 'w', label: '光沢' },
  { char: 'n', label: 'ノイズ' },
  { char: 'g', label: '発光' },
  { char: '2', label: 'サブ色' },
  { char: '3', label: 'サブ明' },
  { char: '4', label: 'サブ影' },
];
