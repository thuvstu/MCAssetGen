/**
 * 64x64 native pixel raster toolkit.
 *
 * Every shape is authored in a 64-space coordinate system. All primitives map
 * that space through a single centre-relative transform `T(v) = 32 + (v-32)*k`,
 * so the same geometry renders identically at 16 / 32 / 64 and can be uniformly
 * rescaled about the canvas centre by the auto-fit calibrator.
 */
export type Mask = Uint8Array;

export const newMask = (n: number): Mask => new Uint8Array(n * n);

/** centre-relative scale: 64-space -> n-space */
/** 64-space -> n-space, scaled about the canvas centre. `n` and `k` are
 * independent because the auto-fit calibrator folds its factor into `k`. */
export const T = (v: number, k: number, n: number) => n / 2 + (v - 32) * k;

/**
 * Even-odd polygon fill, scanline version: O(rows × edges + filled px).
 * Pixel centres are sampled, so the result is identical to a per-pixel
 * point-in-polygon test — just orders of magnitude faster at 256px masters.
 */
export function fillPoly(m: Mask, n: number, pts: number[][], k: number): void {
  const P = pts.map(([x, y]) => [T(x, k, n), T(y, k, n)] as [number, number]);
  const len = P.length;
  if (len < 3) return;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of P) {
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }
  const y0 = Math.max(0, Math.floor(minY));
  const y1 = Math.min(n - 1, Math.ceil(maxY));
  const xs: number[] = [];
  for (let y = y0; y <= y1; y++) {
    const py = y + 0.5;
    xs.length = 0;
    for (let i = 0, j = len - 1; i < len; j = i++) {
      const yi = P[i][1];
      const yj = P[j][1];
      if (yi > py !== yj > py) xs.push(((P[j][0] - P[i][0]) * (py - yi)) / (yj - yi) + P[i][0]);
    }
    xs.sort((a, b) => a - b);
    for (let q = 0; q + 1 < xs.length; q += 2) {
      // pixel x is inside when its centre x+0.5 lies in [xs[q], xs[q+1])
      const a = Math.max(0, Math.ceil(xs[q] - 0.5));
      const b = Math.min(n - 1, Math.ceil(xs[q + 1] - 0.5) - 1);
      for (let x = a; x <= b; x++) m[y * n + x] = 1;
    }
  }
}

/** axis-aligned box in 64-space, scaled about the centre */
export function rect(m: Mask, n: number, x0: number, y0: number, x1: number, y1: number, k: number): void {
  const ax = T(Math.min(x0, x1), k, n);
  const bx = T(Math.max(x0, x1), k, n);
  const ay = T(Math.min(y0, y1), k, n);
  const by = T(Math.max(y0, y1), k, n);
  const ix0 = Math.max(0, Math.round(ax));
  const iy0 = Math.max(0, Math.round(ay));
  const ix1 = Math.min(n - 1, Math.ceil(bx) - 1);
  const iy1 = Math.min(n - 1, Math.ceil(by) - 1);
  for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) m[y * n + x] = 1;
}

/** axis-aligned box in *n-space* (unscaled) — for tileable block patterns */
export function rectRaw(m: Mask, n: number, x0: number, y0: number, x1: number, y1: number): void {
  for (let y = Math.max(0, y0); y <= Math.min(n - 1, y1); y++)
    for (let x = Math.max(0, x0); x <= Math.min(n - 1, x1); x++) m[y * n + x] = 1;
}

export function disc(m: Mask, n: number, cx: number, cy: number, r: number, k: number): void {
  const X = T(cx, k, n);
  const Y = T(cy, k, n);
  const R = Math.max(r * k, 0.5);
  const x0 = Math.max(0, Math.floor(X - R - 1));
  const x1 = Math.min(n - 1, Math.ceil(X + R + 1));
  const y0 = Math.max(0, Math.floor(Y - R - 1));
  const y1 = Math.min(n - 1, Math.ceil(Y + R + 1));
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - X;
      const dy = y + 0.5 - Y;
      if (dx * dx + dy * dy <= R * R) m[y * n + x] = 1;
    }
}

export function ring(m: Mask, n: number, cx: number, cy: number, rOut: number, rIn: number, k: number): void {
  const X = T(cx, k, n);
  const Y = T(cy, k, n);
  const RO = Math.max(rOut * k, 0.5);
  const RI = rIn * k;
  const x0 = Math.max(0, Math.floor(X - RO - 1));
  const x1 = Math.min(n - 1, Math.ceil(X + RO + 1));
  const y0 = Math.max(0, Math.floor(Y - RO - 1));
  const y1 = Math.min(n - 1, Math.ceil(Y + RO + 1));
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - X;
      const dy = y + 0.5 - Y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= RO * RO && d2 >= RI * RI) m[y * n + x] = 1;
    }
}

export function seg(
  m: Mask,
  n: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: number,
  k: number,
): void {
  const ax = T(x1, k, n);
  const ay = T(y1, k, n);
  const bx = T(x2, k, n);
  const by = T(y2, k, n);
  const R = Math.max(r * k, 0.6);
  const dx = bx - ax;
  const dy = by - ay;
  const L2 = dx * dx + dy * dy || 1e-9;
  const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - R - 1));
  const x3 = Math.min(n - 1, Math.ceil(Math.max(ax, bx) + R + 1));
  const y0 = Math.max(0, Math.floor(Math.min(ay, by) - R - 1));
  const y3 = Math.min(n - 1, Math.ceil(Math.max(ay, by) + R + 1));
  for (let y = y0; y <= y3; y++)
    for (let x = x0; x <= x3; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let t = ((px - ax) * dx + (py - ay) * dy) / L2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = px - (ax + t * dx);
      const qy = py - (ay + t * dy);
      if (qx * qx + qy * qy <= R * R) m[y * n + x] = 1;
    }
}

export function polyline(m: Mask, n: number, pts: number[][], r: number, k: number): void {
  for (let i = 1; i < pts.length; i++) {
    seg(m, n, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], r, k);
  }
}

/* ---------- boolean ops ---------- */
export function union(a: Mask, b: Mask): void {
  for (let i = 0; i < a.length; i++) if (b[i]) a[i] = 1;
}
export function subtract(a: Mask, b: Mask): void {
  for (let i = 0; i < a.length; i++) if (b[i]) a[i] = 0;
}
export function intersect(a: Mask, b: Mask): void {
  for (let i = 0; i < a.length; i++) if (!b[i]) a[i] = 0;
}
export const clone = (a: Mask): Mask => Uint8Array.from(a);
export function count(m: Mask): number {
  let c = 0;
  for (let i = 0; i < m.length; i++) c += m[i];
  return c;
}

/* ---------- morphology ---------- */
const touch = (m: Mask, n: number, i: number) => {
  const x = i % n;
  const y = (i / n) | 0;
  if (m[i]) return true;
  if (x > 0 && m[i - 1]) return true;
  if (x < n - 1 && m[i + 1]) return true;
  if (y > 0 && m[i - n]) return true;
  if (y < n - 1 && m[i + n]) return true;
  return false;
};

/**
 * Dilation with a plus-shaped structuring element. Its dual erosion below uses
 * the *same* element — a mismatched pair (e.g. 4-neighbour dilate against
 * 8-neighbour erode) does not close anything, it shatters thin strokes into
 * fragments, which is exactly the failure the audit caught.
 */
export function dilate(m: Mask, n: number): Mask {
  const o = newMask(n);
  for (let i = 0; i < m.length; i++) if (touch(m, n, i)) o[i] = 1;
  return o;
}

/** Dual of `dilate`: survives only if the pixel and its 4 cardinal neighbours
 *  are set. Pixels beyond the canvas count as set so borders are not eaten. */
export function erode(m: Mask, n: number): Mask {
  const o = newMask(n);
  const ok = (x: number, y: number) =>
    x < 0 || y < 0 || x >= n || y >= n ? true : !!m[y * n + x];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (!m[y * n + x]) continue;
      if (ok(x - 1, y) && ok(x + 1, y) && ok(x, y - 1) && ok(x, y + 1)) o[y * n + x] = 1;
    }
  return o;
}

/**
 * Morphological closing (dilate → erode). Bridges the 1px fissures that appear
 * when 64-space geometry is rasterised at 16/32px, while leaving genuine
 * openings — a bow's window, a helmet's visor — untouched.
 */
export function closing(m: Mask, n: number): void {
  // Pad by one empty pixel on every side: eroding with "outside counts as set"
  // would otherwise let the dilated rim survive at the canvas edge, silently
  // growing any shape that sits within 1px of the border (caught by the audit).
  const N = n + 2;
  const pad = newMask(N);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) pad[(y + 1) * N + x + 1] = m[y * n + x];
  const d = dilate(pad, N);
  const e = erode(d, N);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) m[y * n + x] = e[(y + 1) * N + x + 1] | m[y * n + x];
}

/** Fill enclosed voids of <= max px (leftover rasterisation specks). */
export function closeSpecks(m: Mask, n: number, max = 4): void {
  const size = n * n;
  const outside = new Uint8Array(size);
  const st: number[] = [];
  for (let x = 0; x < n; x++) st.push(x, (n - 1) * n + x);
  for (let y = 0; y < n; y++) st.push(y * n, y * n + n - 1);
  while (st.length) {
    const i = st.pop()!;
    if (outside[i] || m[i]) continue;
    outside[i] = 1;
    const x = i % n;
    const y = (i / n) | 0;
    if (x > 0) st.push(i - 1);
    if (x < n - 1) st.push(i + 1);
    if (y > 0) st.push(i - n);
    if (y < n - 1) st.push(i + n);
  }
  const seen = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    if (m[i] || outside[i] || seen[i]) continue;
    const stack = [i];
    const cells: number[] = [];
    seen[i] = 1;
    while (stack.length) {
      const j = stack.pop()!;
      cells.push(j);
      const x = j % n;
      const y = (j / n) | 0;
      if (x > 0 && !m[j - 1] && !seen[j - 1]) (seen[j - 1] = 1), stack.push(j - 1);
      if (x < n - 1 && !m[j + 1] && !seen[j + 1]) (seen[j + 1] = 1), stack.push(j + 1);
      if (y > 0 && !m[j - n] && !seen[j - n]) (seen[j - n] = 1), stack.push(j - n);
      if (y < n - 1 && !m[j + n] && !seen[j + n]) (seen[j + n] = 1), stack.push(j + n);
    }
    if (cells.length <= max) for (const j of cells) m[j] = 1;
  }
}

/**
 * Chamfer 3-4 distance transform: distance (in px) from every pixel to the
 * nearest pixel where set === 1. Used for outlines, glow falloff and bevels.
 */
export function distTo(set: Mask, n: number): Float32Array {
  const INF = 1e9;
  const d = new Float32Array(n * n);
  let any = false;
  for (let i = 0; i < n * n; i++) {
    if (set[i]) {
      d[i] = 0;
      any = true;
    } else d[i] = INF;
  }
  if (!any) {
    d.fill(99);
    return d;
  }
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 3);
      if (y > 0) v = Math.min(v, d[i - n] + 3);
      if (x > 0 && y > 0) v = Math.min(v, d[i - n - 1] + 4);
      if (x < n - 1 && y > 0) v = Math.min(v, d[i - n + 1] + 4);
      d[i] = v;
    }
  for (let y = n - 1; y >= 0; y--)
    for (let x = n - 1; x >= 0; x--) {
      const i = y * n + x;
      let v = d[i];
      if (x < n - 1) v = Math.min(v, d[i + 1] + 3);
      if (y < n - 1) v = Math.min(v, d[i + n] + 3);
      if (x < n - 1 && y < n - 1) v = Math.min(v, d[i + n + 1] + 4);
      if (x > 0 && y < n - 1) v = Math.min(v, d[i + n - 1] + 4);
      d[i] = v;
    }
  for (let i = 0; i < n * n; i++) d[i] = d[i] >= INF ? 99 : d[i] / 3;
  return d;
}

/* ---------- colour helpers ---------- */

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const H = ((h % 360) + 360) % 360;
  const S = Math.min(100, Math.max(0, s)) / 100;
  const L = Math.min(100, Math.max(0, l)) / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const x = c * (1 - Math.abs(((H / 60) % 2) - 1));
  const m = L - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (H < 60) [r, g, b] = [c, x, 0];
  else if (H < 120) [r, g, b] = [x, c, 0];
  else if (H < 180) [r, g, b] = [0, c, x];
  else if (H < 240) [r, g, b] = [0, x, c];
  else if (H < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

export function hash2(x: number, y: number, s: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2654435761)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
