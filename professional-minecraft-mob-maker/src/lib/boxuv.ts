import { resolveParts } from "@/lib/model";
import type { MobDraft, ResolvedPart } from "@/types";

/**
 * Minecraft 標準の「box UV」レイアウトでテクスチャを詰める。
 * 1つの箱は (2d + 2w) x (d + h) の領域を使い、texOffs(u, v) から下記の配置になる:
 *   up    : (u+d,     v    ) w x d
 *   down  : (u+d+w,   v    ) w x d
 *   east  : (u,       v+d  ) d x h
 *   north : (u+d,     v+d  ) w x h
 *   west  : (u+d+w,   v+d  ) d x h
 *   south : (u+2d+w,  v+d  ) w x h
 * これに従えば Java の CubeListBuilder#texOffs がそのまま正しく貼れる。
 */
export interface BoxUVEntry {
  partId: string;
  part: ResolvedPart;
  u: number;
  v: number;
  /** 整数化した寸法（モデルの addBox にもこの値を使うこと） */
  w: number;
  h: number;
  d: number;
  color: string;
  opacity: number;
}

export interface BoxUVAtlas {
  size: number;
  entries: BoxUVEntry[];
  byId: Map<string, BoxUVEntry>;
}

export function intSize(n: number): number {
  return Math.max(1, Math.round(n));
}

export function packBoxUV(mob: MobDraft): BoxUVAtlas {
  const parts = resolveParts(mob);
  const raw = parts.map((part) => {
    const w = intSize(part.size[0]);
    const h = intSize(part.size[1]);
    const d = intSize(part.size[2]);
    return { part, w, h, d, cw: 2 * d + 2 * w, ch: d + h };
  });

  // 高さ順に棚詰め（shelf packing）
  const order = [...raw].sort((a, b) => b.ch - a.ch);

  for (const size of [32, 64, 128, 256, 512]) {
    const entries: BoxUVEntry[] = [];
    let x = 0;
    let y = 0;
    let shelf = 0;
    let ok = true;
    for (const item of order) {
      if (item.cw > size) {
        ok = false;
        break;
      }
      if (x + item.cw > size) {
        x = 0;
        y += shelf;
        shelf = 0;
      }
      if (y + item.ch > size) {
        ok = false;
        break;
      }
      entries.push({
        partId: item.part.def.id,
        part: item.part,
        u: x,
        v: y,
        w: item.w,
        h: item.h,
        d: item.d,
        color: item.part.color,
        opacity: item.part.opacity,
      });
      x += item.cw;
      shelf = Math.max(shelf, item.ch);
    }
    if (ok && entries.length === raw.length) {
      const byId = new Map(entries.map((e) => [e.partId, e]));
      // 元の部位順に並べ直す（コード生成の見やすさのため）
      const ordered = parts
        .map((p) => byId.get(p.def.id))
        .filter((e): e is BoxUVEntry => Boolean(e));
      return { size, entries: ordered, byId };
    }
  }

  const byId = new Map<string, BoxUVEntry>();
  return { size: 512, entries: [], byId };
}

const FACE_LIGHT = {
  up: 1.08,
  down: 0.52,
  north: 0.92,
  south: 0.72,
  east: 0.84,
  west: 0.66,
} as const;

function shade(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  if (n.length < 6) return hex;
  const ch = (i: number) => Math.min(255, Math.max(0, Math.round(parseInt(n.slice(i, i + 2), 16) * amount)));
  return `rgb(${ch(0)},${ch(2)},${ch(4)})`;
}

/** 擬似乱数（モブごとに安定したノイズを出す） */
function hashNoise(seed: number): number {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

export function drawBoxUVTexture(mob: MobDraft): { canvas: HTMLCanvasElement; atlas: BoxUVAtlas } {
  const atlas = packBoxUV(mob);
  const canvas = document.createElement("canvas");
  canvas.width = atlas.size;
  canvas.height = atlas.size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { canvas, atlas };
  // 透明背景（未使用領域は描かない）
  ctx.clearRect(0, 0, atlas.size, atlas.size);

  let seed = 1;
  const paintRegion = (rx: number, ry: number, rw: number, rh: number, base: string, light: number) => {
    for (let py = 0; py < rh; py++) {
      for (let px = 0; px < rw; px++) {
        seed += 1;
        const n = 0.9 + hashNoise(seed) * 0.2; // バニラらしい軽いノイズ
        ctx.fillStyle = shade(base, light * n);
        ctx.fillRect(rx + px, ry + py, 1, 1);
      }
    }
  };

  for (const e of atlas.entries) {
    const { u, v, w, h, d } = e;
    paintRegion(u + d, v, w, d, e.color, FACE_LIGHT.up);
    paintRegion(u + d + w, v, w, d, e.color, FACE_LIGHT.down);
    paintRegion(u, v + d, d, h, e.color, FACE_LIGHT.east);
    paintRegion(u + d, v + d, w, h, e.color, FACE_LIGHT.north);
    paintRegion(u + d + w, v + d, d, h, e.color, FACE_LIGHT.west);
    paintRegion(u + 2 * d + w, v + d, w, h, e.color, FACE_LIGHT.south);
  }
  return { canvas, atlas };
}
