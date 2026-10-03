export type Grid = string[][];

/**
 * Material legend (what a cell is made of). Shading is derived automatically
 * by the lighting engine, so templates only describe silhouette + material.
 */
export const MAT = {
  empty: ".",
  blade: "b", // sharpened weapon edge (catches light)
  bladeCore: "B", // fuller / flat of the blade
  metalDark: "m", // iron, dark trim, rivets
  metalBright: "M", // gold / polished trim
  gem: "g", // faceted crystal
  wood: "w", // handle, shaft
  leather: "l", // grip wrap, straps
  cloth: "c", // robes, capes
  string: "s", // bowstring, thread
  energy: "e", // emissive magic core
  bone: "k", // bone / skull
  fur: "p", // hide, scales of pets
  rune: "r", // emissive inscription
} as const;

export const MATERIAL_CHARS: Set<string> = new Set<string>(Object.values(MAT));

export function makeGrid(n = 16): Grid {
  return Array.from({ length: n }, () => Array<string>(n).fill("."));
}

export function inBounds(g: Grid, x: number, y: number): boolean {
  return y >= 0 && y < g.length && x >= 0 && x < g[0]!.length;
}

export function set(g: Grid, x: number, y: number, ch: string): void {
  if (!inBounds(g, x, y)) return;
  g[y]![x] = ch;
}

export function get(g: Grid, x: number, y: number): string {
  if (!inBounds(g, x, y)) return ".";
  return g[y]![x]!;
}

export function rect(g: Grid, x: number, y: number, w: number, h: number, ch: string): void {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(g, i, j, ch);
}

export function line(g: Grid, x0: number, y0: number, x1: number, y1: number, ch: string): void {
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    set(g, x, y, ch);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

/**
 * Bresenham path dilated by a square structuring element. At size 1 this is
 * byte-for-byte the classic 8-connected line; at size s it becomes a smooth
 * 1px-stepped band of thickness s (never gappy, never blocky).
 */
export function thickPath(
  g: Grid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  size: number,
  ch: string,
): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const xe = Math.round(x1);
  const ye = Math.round(y1);
  const dx = Math.abs(xe - x);
  const dy = -Math.abs(ye - y);
  const sx = x < xe ? 1 : -1;
  const sy = y < ye ? 1 : -1;
  let err = dx + dy;
  const lo = -Math.floor((size - 1) / 2);
  const hi = lo + size - 1;
  for (;;) {
    for (let j = lo; j <= hi; j++) for (let i = lo; i <= hi; i++) set(g, x + i, y + j, ch);
    if (x === xe && y === ye) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

export function thickLine(
  g: Grid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: number,
  ch: string,
): void {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;
  const half = (width - 1) / 2;
  const minX = Math.floor(Math.min(x0, x1) - width);
  const maxX = Math.ceil(Math.max(x0, x1) + width);
  const minY = Math.floor(Math.min(y0, y1) - width);
  const maxY = Math.ceil(Math.max(y0, y1) + width);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x - x0;
      const py = y - y0;
      const along = (px * (x1 - x0) + py * (y1 - y0)) / len;
      const perp = Math.abs(px * nx + py * ny);
      if (along >= -0.5 && along <= len + 0.5 && perp <= half + 0.35) set(g, x, y, ch);
    }
  }
}

/** Filled polygon (even-odd scanline) — used for armor plates and heads. */
export function poly(g: Grid, pts: [number, number][], ch: string): void {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    const crossings: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i]!;
      const [x1, y1] = pts[(i + 1) % pts.length]!;
      if (y0 === y1) continue;
      if (y + 0.5 < Math.min(y0, y1) || y + 0.5 >= Math.max(y0, y1)) continue;
      crossings.push(x0 + ((y + 0.5 - y0) / (y1 - y0)) * (x1 - x0));
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const xa = Math.round(crossings[i]! - 0.5);
      const xb = Math.round(crossings[i + 1]! - 0.5);
      for (let x = xa; x <= xb; x++) set(g, x, y, ch);
    }
  }
  void xs;
}

export function ellipse(
  g: Grid,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  ch: string,
  fill = true,
): void {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const v = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
      if (fill ? v <= 1 : v > 0.72 && v <= 1.12) set(g, x, y, ch);
    }
  }
}

/** Cells whose x+y lies in [sumMin,sumMax] inside a box — perfect 45° bands. */
export function antiBand(
  g: Grid,
  sumMin: number,
  sumMax: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  ch: string,
): void {
  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const s = x + y;
      if (s >= sumMin && s <= sumMax) set(g, x, y, ch);
    }
  }
}

/** Cells whose x-y lies in [dMin,dMax] inside a box — the other 45° family. */
export function diagBand(
  g: Grid,
  dMin: number,
  dMax: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  ch: string,
): void {
  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const d = x - y;
      if (d >= dMin && d <= dMax) set(g, x, y, ch);
    }
  }
}

export function arc(
  g: Grid,
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  ch: string,
  thickness = 1,
): void {
  const steps = Math.max(24, Math.ceil(r * 12));
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    for (let t = 0; t < thickness; t++) {
      const rr = r - t * 0.5;
      set(g, Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr), ch);
    }
  }
}

export function outlineRing(g: Grid, ch: string, includeDiagonal = true): void {
  const n = g.length;
  const copy = g.map((r) => [...r]);
  const dirs = includeDiagonal
    ? [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]
    : [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (copy[y]![x] !== ".") continue;
      for (const [dx, dy] of dirs) {
        if (get(copy, x + dx, y + dy) !== ".") {
          set(g, x, y, ch);
          break;
        }
      }
    }
  }
}

export function swap(g: Grid, from: string, to: string): void {
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < g[0]!.length; x++) if (g[y]![x] === from) g[y]![x] = to;
}

export function mirror(g: Grid): Grid {
  return g.map((row) => [...row].reverse());
}

export function gridToString(g: Grid): string {
  return g.map((r) => r.join("")).join("\n");
}

export function validateGrid(g: Grid, id: string, expected?: number): void {
  const n = g.length;
  if (expected && n !== expected) throw new Error(`template ${id}: height ${n} != ${expected}`);
  if (!expected && n < 16) throw new Error(`template ${id}: height ${n}`);
  for (let y = 0; y < n; y++) {
    if (g[y]!.length !== n) throw new Error(`template ${id}: row ${y} width ${g[y]!.length}`);
    for (let x = 0; x < n; x++) {
      const ch = g[y]![x]!;
      if (!MATERIAL_CHARS.has(ch)) throw new Error(`template ${id}: bad char "${ch}" @${x},${y}`);
    }
  }
  let count = 0;
  for (const row of g) for (const ch of row) if (ch !== ".") count++;
  if (count < 18) throw new Error(`template ${id}: too few pixels (${count})`);
}

/**
 * Legacy 16/32 compatibility drawing context. Templates are authored in
 * 16-space and re-rasterised for the refined 32× mode. Production 64× output
 * intentionally does NOT use this context; see native64.ts for its separate
 * 64-coordinate authoring engine.
 *
 * Coordinate mapping: source cell (x,y) maps to the s×s block starting at
 * (x·s, y·s); float centres land on (x·s + (s-1)/2).
 */
export type Ctx = {
  g: Grid;
  s: number;
  n: number;
  set(x: number, y: number, ch: string): void;
  line(x0: number, y0: number, x1: number, y1: number, ch: string): void;
  thickLine(x0: number, y0: number, x1: number, y1: number, w: number, ch: string): void;
  rect(x: number, y: number, w: number, h: number, ch: string): void;
  poly(pts: [number, number][], ch: string): void;
  ellipse(cx: number, cy: number, rx: number, ry: number, ch: string, fill?: boolean): void;
  arc(
    cx: number,
    cy: number,
    r: number,
    a0: number,
    a1: number,
    ch: string,
    thickness?: number,
  ): void;
  antiBand(
    sumMin: number,
    sumMax: number,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    ch: string,
  ): void;
  diagBand(
    dMin: number,
    dMax: number,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    ch: string,
  ): void;
  clear(x: number, y: number, w: number, h: number): void;
};

export function makeCtx(size: number): Ctx {
  const s = Math.max(1, Math.round(size / 16));
  const n = 16 * s;
  const g = makeGrid(n);
  const block = (x: number, y: number, ch: string) => {
    const bx = Math.round(x) * s;
    const by = Math.round(y) * s;
    for (let j = 0; j < s; j++)
      for (let i = 0; i < s; i++) set(g, bx + i, by + j, ch);
  };
  const ctr = (v: number) => v * s + (s - 1) / 2;

  return {
    g,
    s,
    n,
    set: block,
    line: (x0, y0, x1, y1, ch) =>
      thickPath(g, ctr(x0), ctr(y0), ctr(x1), ctr(y1), Math.max(1, s), ch),
    thickLine: (x0, y0, x1, y1, w, ch) =>
      thickLine(g, ctr(x0), ctr(y0), ctr(x1), ctr(y1), Math.max(1, w * s), ch),
    rect: (x, y, w, h, ch) => rect(g, Math.round(x) * s, Math.round(y) * s, Math.round(w) * s, Math.round(h) * s, ch),
    poly: (pts, ch) =>
      poly(
        g,
        pts.map(([x, y]) => [ctr(x), ctr(y)] as [number, number]),
        ch,
      ),
    ellipse: (cx, cy, rx, ry, ch, fill = true) =>
      ellipse(g, ctr(cx), ctr(cy), Math.max(0.5, rx * s), Math.max(0.5, ry * s), ch, fill),
    arc: (cx, cy, r, a0, a1, ch, thickness = 1) =>
      arc(g, ctr(cx), ctr(cy), Math.max(0.5, r * s), a0, a1, ch, Math.max(1, Math.round(thickness * s))),
    antiBand: (sumMin, sumMax, xMin, xMax, yMin, yMax, ch) =>
      antiBand(
        g,
        Math.round(sumMin * s),
        Math.round((sumMax + 1) * s) - 1,
        Math.round(xMin * s),
        Math.round((xMax + 1) * s) - 1,
        Math.round(yMin * s),
        Math.round((yMax + 1) * s) - 1,
        ch,
      ),
    diagBand: (dMin, dMax, xMin, xMax, yMin, yMax, ch) =>
      diagBand(
        g,
        Math.round(dMin * s),
        Math.round((dMax + 1) * s) - 1,
        Math.round(xMin * s),
        Math.round((xMax + 1) * s) - 1,
        Math.round(yMin * s),
        Math.round((yMax + 1) * s) - 1,
        ch,
      ),
    clear: (x, y, w, h) =>
      rect(g, Math.round(x) * s, Math.round(y) * s, Math.round(w) * s, Math.round(h) * s, "."),
  };
}
