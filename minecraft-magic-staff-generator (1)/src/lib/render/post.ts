/* Post-processing: outline · edge light · drop shadow · contrast · downsample · glint */
import { INK, RGB, WHITE, clamp255, lum, mixRgb, shadeRgb } from '../color';
import type { RenderCtx } from './context';
import { Pix } from './pix';

export function applyOutline(c: RenderCtx) {
  const { cfg, buf, W, pal, geo } = c;
  if (cfg.outline === 'none') return;
  const { LX, LY } = geo;
  const src = new Uint8ClampedArray(buf.d);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= W ? 0 : src[(y * W + x) * 4 + 3]);
  const colAt = (x: number, y: number): RGB => { const i = (y * W + x) * 4; return [src[i], src[i + 1], src[i + 2]]; };
  const ORTHO: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const DIAG: Array<[number, number]> = [[1, 1], [-1, -1], [1, -1], [-1, 1]];
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      if (at(x, y) > 26) continue;
      let n = 0, sr = 0, sg = 0, sb = 0, best = -1, bx = 0, by = 0;
      for (const [dx, dy] of ORTHO) {
        if (at(x + dx, y + dy) > 26) {
          const col = colAt(x + dx, y + dy);
          sr += col[0]; sg += col[1]; sb += col[2]; n++;
          const l = lum(col);
          if (l > best) { best = l; bx = x + dx; by = y + dy; }
        }
      }
      if (W >= 32) {
        for (const [dx, dy] of DIAG) {
          if (at(x + dx, y + dy) > 26 && at(x + dx, y) <= 26 && at(x, y + dy) <= 26) {
            const col = colAt(x + dx, y + dy);
            sr += col[0]; sg += col[1]; sb += col[2]; n++;
          }
        }
      }
      if (n === 0) continue;
      let oc: RGB;
      switch (cfg.outline) {
        case 'light': oc = [245, 240, 230]; break;
        case 'gold': oc = [212, 175, 55]; break;
        case 'colored': oc = shadeRgb(pal.gemC, -0.5); break;
        case 'rarity': oc = shadeRgb(pal.rarityC, -0.25); break;
        case 'selout': {
          // sel-out: derive from the brightest neighbour; lighter on the lit side
          const facesLight = ((bx - x) * LX + (by - y) * LY) > 0;
          oc = mixRgb(shadeRgb([sr / n, sg / n, sb / n], facesLight ? -0.34 : -0.58), pal.gemC, 0.12);
          break;
        }
        default: oc = INK;
      }
      buf.set(x, y, oc, 255);
    }
  }
}

export function applyEdgeLight(c: RenderCtx) {
  const { cfg, buf, W, geo } = c;
  if (!(cfg.finish === 'metallic' || cfg.finish === 'glossy' || cfg.finish === 'enchanted')) return;
  const { LX, LY } = geo;
  const src = new Uint8ClampedArray(buf.d);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= W ? 0 : src[(y * W + x) * 4 + 3]);
  const boost = cfg.finish === 'metallic' ? 0.42 : 0.26;
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      if (at(x, y) < 200) continue;
      const nx = x + LX > x ? 1 : -1, ny = y + LY > y ? 1 : -1;
      if (at(x + nx, y + ny) > 40) continue;
      const i = (y * W + x) * 4;
      const col: RGB = [src[i], src[i + 1], src[i + 2]];
      if (lum(col) < 60) continue;
      buf.blend(x, y, mixRgb(col, WHITE, boost), 200);
    }
  }
}

export function applyDropShadow(c: RenderCtx): Pix {
  const { cfg, buf, W, S } = c;
  if (!cfg.dropShadow) return buf;
  const sh = new Pix(W, W);
  const sx = Math.max(S, Math.round(W * 0.03)), sy = Math.max(S, Math.round(W * 0.045));
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (buf.alpha(x, y) > 26) sh.blend(x + sx, y + sy, [0, 0, 0], 100);
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const i = buf.idx(x, y);
      if (buf.d[i + 3] === 0) continue;
      const fi = sh.idx(x, y);
      const sa = buf.d[i + 3] / 255, da = sh.d[fi + 3] / 255;
      const out = sa + da * (1 - sa);
      sh.d[fi] = clamp255((buf.d[i] * sa + sh.d[fi] * da * (1 - sa)) / Math.max(0.001, out));
      sh.d[fi + 1] = clamp255((buf.d[i + 1] * sa + sh.d[fi + 1] * da * (1 - sa)) / Math.max(0.001, out));
      sh.d[fi + 2] = clamp255((buf.d[i + 2] * sa + sh.d[fi + 2] * da * (1 - sa)) / Math.max(0.001, out));
      sh.d[fi + 3] = clamp255(out * 255);
    }
  }
  return sh;
}

export function applyContrast(pix: Pix, contrast: number) {
  if (Math.abs(contrast - 1) <= 0.01) return;
  const d = pix.d;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    d[i] = clamp255((d[i] - 128) * contrast + 128);
    d[i + 1] = clamp255((d[i + 1] - 128) * contrast + 128);
    d[i + 2] = clamp255((d[i + 2] - 128) * contrast + 128);
  }
}

/**
 * Area-average downsample W×W → N×N.
 * Colour is alpha-weighted; coverage is the mean sub-pixel alpha.
 * `hardAlpha` snaps every pixel to fully opaque or fully transparent, which is
 * how real Minecraft item textures ship — the Life pack has *zero* soft edges.
 */
export function downsample(pix: Pix, N: number, S: number, hardAlpha = true, threshold = 0.5): Uint8ClampedArray {
  const out = new Uint8ClampedArray(N * N * 4);
  if (S === 1) {
    out.set(pix.d);
    if (hardAlpha) for (let i = 3; i < out.length; i += 4) out[i] = out[i] >= 128 ? 255 : 0;
    return out;
  }
  const W = N * S;
  for (let oy = 0; oy < N; oy++) {
    for (let ox = 0; ox < N; ox++) {
      let sr = 0, sg = 0, sb = 0, sa = 0;
      for (let dy = 0; dy < S; dy++) {
        for (let dx = 0; dx < S; dx++) {
          const i = ((oy * S + dy) * W + (ox * S + dx)) * 4;
          const a = pix.d[i + 3];
          sr += pix.d[i] * a; sg += pix.d[i + 1] * a; sb += pix.d[i + 2] * a; sa += a;
        }
      }
      const o = (oy * N + ox) * 4;
      const cov = sa / (S * S);
      if (sa > 0) {
        out[o] = clamp255(sr / sa); out[o + 1] = clamp255(sg / sa); out[o + 2] = clamp255(sb / sa);
        // hard snap keeps the silhouette crisp and matches vanilla item art
        out[o + 3] = hardAlpha ? (cov >= threshold ? 255 : 0) : clamp255(cov);
      }
    }
  }
  return out;
}

/** Count soft-alpha pixels — a diagnostic for how "non-vanilla" an export is. */
export function countSoftAlpha(out: Uint8ClampedArray) {
  let soft = 0;
  for (let i = 3; i < out.length; i += 4) if (out[i] > 8 && out[i] < 247) soft++;
  return soft;
}

/**
 * Median-cut palette quantisation — the authentic pixel-art constraint.
 * Reduces the sprite to exactly `n` colours (alpha preserved).
 */
export function posterize(out: Uint8ClampedArray, n: number) {
  if (!n || n < 2) return;
  type Px = { r: number; g: number; b: number; i: number };
  const px: Px[] = [];
  for (let i = 0; i < out.length; i += 4) if (out[i + 3] > 8) px.push({ r: out[i], g: out[i + 1], b: out[i + 2], i });
  if (px.length === 0) return;

  let boxes: Px[][] = [px];
  while (boxes.length < n) {
    // split the box with the largest channel range
    let bi = -1, bestRange = -1, bestCh: 'r' | 'g' | 'b' = 'r';
    boxes.forEach((b, idx) => {
      if (b.length < 2) return;
      for (const ch of ['r', 'g', 'b'] as const) {
        let lo = 255, hi = 0;
        for (const p of b) { const v = p[ch]; if (v < lo) lo = v; if (v > hi) hi = v; }
        const range = hi - lo;
        if (range > bestRange) { bestRange = range; bi = idx; bestCh = ch; }
      }
    });
    if (bi < 0 || bestRange <= 0) break;
    const box = boxes[bi];
    box.sort((a, b) => a[bestCh] - b[bestCh]);
    const mid = box.length >> 1;
    boxes.splice(bi, 1, box.slice(0, mid), box.slice(mid));
  }

  for (const box of boxes) {
    if (box.length === 0) continue;
    let r = 0, g = 0, b = 0;
    for (const p of box) { r += p.r; g += p.g; b += p.b; }
    r = Math.round(r / box.length); g = Math.round(g / box.length); b = Math.round(b / box.length);
    for (const p of box) { out[p.i] = r; out[p.i + 1] = g; out[p.i + 2] = b; }
  }
}

/** Vanilla-style enchantment glint, screen-blended on the final N×N image. */
export function applyGlint(c: RenderCtx, out: Uint8ClampedArray) {
  const { cfg, N, anim } = c;
  if (!(anim.on && (anim.type === 'enchant-glint' || cfg.animation?.blendGlint))) return;
  const phase = anim.t * (N * 2);
  const period = N * 1.6;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4;
      if (out[i + 3] < 20) continue;
      const d = ((x - y + phase) % period + period) % period;
      const band = Math.max(0, 1 - Math.abs(d - N * 0.5) / (N * 0.22));
      const band2 = Math.max(0, 1 - Math.abs(d - N * 1.2) / (N * 0.18));
      const s = Math.min(1, band + band2 * 0.7) * anim.intensity * 0.85;
      if (s <= 0.01) continue;
      out[i] = clamp255(out[i] + (255 - out[i]) * s * 0.65);
      out[i + 1] = clamp255(out[i + 1] + (180 - out[i + 1]) * s * 0.5);
      out[i + 2] = clamp255(out[i + 2] + (255 - out[i + 2]) * s * 0.65);
    }
  }
}
