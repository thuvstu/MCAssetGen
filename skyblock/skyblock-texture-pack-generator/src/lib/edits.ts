import type { Forged } from './engine';
import type { CatItem } from './catalog';

/** pixel index → packed 0xRRGGBBAA (alpha 0 = erased). Applied on top of every frame. */
export type EditMap = Record<number, number>;

export function editKey(it: Pick<CatItem, 'id' | 'design' | 'mats'>, n: number, pack: string, light: number, styleKey = ''): string {
  return [it.id, n, pack, light, styleKey, JSON.stringify(it.design), JSON.stringify(it.mats)].join('|');
}

export const pack4 = (r: number, g: number, b: number, a: number) => ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
export const unpack4 = (v: number): [number, number, number, number] => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];

export function applyEdits(fg: Forged, map: EditMap | undefined): Forged {
  if (!map) return fg;
  const keys = Object.keys(map);
  if (!keys.length) return fg;
  const frames = fg.frames.map((f) => {
    const c = new Uint8ClampedArray(f);
    for (const k of keys) {
      const i = Number(k) * 4;
      const v = map[Number(k)];
      c[i] = (v >>> 24) & 255;
      c[i + 1] = (v >>> 16) & 255;
      c[i + 2] = (v >>> 8) & 255;
      c[i + 3] = v & 255;
    }
    return c;
  });
  const pal = new Set<number>();
  const f0 = frames[0];
  for (let i = 0; i < f0.length; i += 4) if (f0[i + 3]) pal.add((f0[i] << 16) | (f0[i + 1] << 8) | f0[i + 2]);
  return { ...fg, frames, palette: pal.size };
}

/** Distinct opaque colours of a frame, dark → light (perceived luminance). */
export function paletteOf(frame: Uint8ClampedArray): number[] {
  const set = new Set<number>();
  for (let i = 0; i < frame.length; i += 4) if (frame[i + 3]) set.add(pack4(frame[i], frame[i + 1], frame[i + 2], 255));
  const lum = (v: number) => 0.2126 * ((v >>> 24) & 255) + 0.7152 * ((v >>> 16) & 255) + 0.0722 * ((v >>> 8) & 255);
  return [...set].sort((a, b) => lum(a) - lum(b));
}

export const toHex = (v: number) => '#' + [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255].map((x) => x.toString(16).padStart(2, '0')).join('');

export function pixelColorAt(frame: Uint8ClampedArray, i: number, map?: EditMap): number {
  if (map && map[i] !== undefined) return map[i];
  const p = i * 4;
  return pack4(frame[p], frame[p + 1], frame[p + 2], frame[p + 3]);
}

/** squared perceptual-ish distance between two packed colours */
export function colorDist(a: number, b: number): number {
  const ar = (a >>> 24) & 255, ag = (a >>> 16) & 255, ab = (a >>> 8) & 255, aa = a & 255;
  const br = (b >>> 24) & 255, bg = (b >>> 16) & 255, bb = (b >>> 8) & 255, ba = b & 255;
  // weight by perceived luma so a small luminance step reads as "same colour"
  // more readily than the same step in blue
  const dr = ar - br, dg = ag - bg, db = ab - bb, da = aa - ba;
  return 0.3 * dr * dr + 0.6 * dg * dg + 0.1 * db * db + 0.5 * da * da;
}

/** 4-way flood fill. `tolerance` (0..1) widens what counts as "the same colour";
 *  0 is exact-match only. Returns a new EditMap with the filled pixels updated. */
export function floodFill(
  frame: Uint8ClampedArray,
  n: number,
  startIndex: number,
  newColor: number,
  currentMap: EditMap = {},
  tolerance = 0,
): EditMap {
  const target = pixelColorAt(frame, startIndex, currentMap);
  if (target === newColor && tolerance === 0) return currentMap;
  const maxD2 = tolerance * tolerance * (0.3 + 0.6 + 0.1 + 0.5) * 255 * 255;
  const matches = (v: number) => (tolerance <= 0 ? v === target : colorDist(v, target) <= maxD2);
  const result: EditMap = { ...currentMap };
  const seen = new Uint8Array(n * n);
  const stack = [startIndex];
  seen[startIndex] = 1;

  while (stack.length > 0) {
    const idx = stack.pop()!;
    result[idx] = newColor;
    const x = idx % n;
    const y = Math.floor(idx / n);
    const neighbors = [
      x > 0 ? idx - 1 : -1,
      x < n - 1 ? idx + 1 : -1,
      y > 0 ? idx - n : -1,
      y < n - 1 ? idx + n : -1,
    ];
    for (const nb of neighbors) {
      if (nb >= 0 && !seen[nb] && matches(pixelColorAt(frame, nb, currentMap))) {
        seen[nb] = 1;
        stack.push(nb);
      }
    }
  }
  return result;
}

/** Replace matching pixels across the canvas. `tolerance` widens the match. */
export function replaceColor(
  frame: Uint8ClampedArray,
  n: number,
  oldColor: number,
  newColor: number,
  currentMap: EditMap = {},
  tolerance = 0,
): EditMap {
  if (oldColor === newColor && tolerance === 0) return currentMap;
  const maxD2 = tolerance * tolerance * (0.3 + 0.6 + 0.1 + 0.5) * 255 * 255;
  const matches = (v: number) => (tolerance <= 0 ? v === oldColor : colorDist(v, oldColor) <= maxD2);
  const result: EditMap = { ...currentMap };
  for (let i = 0; i < n * n; i++) {
    if (matches(pixelColorAt(frame, i, currentMap))) {
      result[i] = newColor;
    }
  }
  return result;
}

/** Brush footprint as (dx,dy) offsets. size 1 = 1px, 2 = plus, 3 = 3x3, 4 = 5x5 diamond. */
export function brushOffsets(size: number): [number, number][] {
  const r = Math.max(0, size - 1);
  const out: [number, number][] = [];
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      if (r === 0 || Math.abs(dx) + Math.abs(dy) <= r + 0.001 || (Math.abs(dx) <= r && Math.abs(dy) <= r && r <= 1)) out.push([dx, dy]);
    }
  return out;
}

/** Flip manual edit layer horizontally */
export function flipEditsH(map: EditMap, n: number): EditMap {
  const next: EditMap = {};
  for (const [k, v] of Object.entries(map)) {
    const idx = Number(k);
    const x = idx % n;
    const y = Math.floor(idx / n);
    const newIdx = y * n + (n - 1 - x);
    next[newIdx] = v;
  }
  return next;
}

/** Flip manual edit layer vertically */
export function flipEditsV(map: EditMap, n: number): EditMap {
  const next: EditMap = {};
  for (const [k, v] of Object.entries(map)) {
    const idx = Number(k);
    const x = idx % n;
    const y = Math.floor(idx / n);
    const newIdx = (n - 1 - y) * n + x;
    next[newIdx] = v;
  }
  return next;
}

/** Shift manual edits by dx, dy pixels */
export function shiftEdits(map: EditMap, n: number, dx: number, dy: number): EditMap {
  const next: EditMap = {};
  for (const [k, v] of Object.entries(map)) {
    const idx = Number(k);
    const x = idx % n + dx;
    const y = Math.floor(idx / n) + dy;
    if (x >= 0 && x < n && y >= 0 && y < n) {
      next[y * n + x] = v;
    }
  }
  return next;
}
