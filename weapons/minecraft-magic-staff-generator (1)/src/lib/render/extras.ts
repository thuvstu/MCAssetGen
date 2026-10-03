/* Item-family silhouettes. Tips and orbiting objects live in their own ateliers. */
import { WHITE, mixRgb, shadeRgb } from '../color';
import type { RenderCtx } from './context';

export function drawSilhouette(c: RenderCtx) {
  const { cfg, buf, geo, pal, S, W, small, line } = c;
  if (small) return;
  const { collarPos: cp, collarLen, dir, perp, headR } = geo;
  const { collarC, gemC } = pal;

  if (cfg.itemType === 'trident') {
    const bx = cp[0] + dir[0] * collarLen * 0.3, by = cp[1] + dir[1] * collarLen * 0.3;
    const tipLen = headR * 2.3;
    const tipX = bx + dir[0] * tipLen, tipY = by + dir[1] * tipLen;
    line(bx, by, tipX, tipY, headR * 0.16, headR * 0.04, collarC, shadeRgb(collarC, -0.4), shadeRgb(collarC, 0.55));
    for (const side of [-1, 1]) {
      const p0x = bx + perp[0] * side * headR * 0.12, p0y = by + perp[1] * side * headR * 0.12;
      const p1x = bx + perp[0] * side * headR * 0.85 + dir[0] * tipLen * 0.62;
      const p1y = by + perp[1] * side * headR * 0.85 + dir[1] * tipLen * 0.62;
      line(p0x, p0y, p1x, p1y, headR * 0.1, headR * 0.02, collarC, shadeRgb(collarC, -0.4), shadeRgb(collarC, 0.5));
      const bx2 = p1x - perp[0] * side * headR * 0.22 + dir[0] * headR * 0.28;
      const by2 = p1y - perp[1] * side * headR * 0.22 + dir[1] * headR * 0.28;
      line(p1x, p1y, bx2, by2, headR * 0.06, headR * 0.02, collarC, shadeRgb(collarC, -0.35), shadeRgb(collarC, 0.45));
      buf.disc(p1x, p1y, headR * 0.08, mixRgb(gemC, WHITE, 0.35));
    }
    buf.disc(tipX, tipY, headR * 0.1, mixRgb(gemC, WHITE, 0.4));
  } else if (cfg.itemType === 'scythe') {
    // A broad, tapered crescent blade; alternating highlights read as forged metal facets.
    const bx = cp[0] + dir[0] * collarLen * 0.2, by = cp[1] + dir[1] * collarLen * 0.2;
    const bl = headR * 2.15;
    for (let i = 0; i <= 30; i++) {
      const t = i / 30, a = t * Math.PI * 1.14;
      const px = bx + perp[0] * Math.sin(a) * bl + dir[0] * (1 - Math.cos(a)) * bl * 0.55;
      const py = by + perp[1] * Math.sin(a) * bl - dir[1] * (1 - Math.cos(a)) * bl * 0.55;
      const w = headR * 0.18 * (1 - t * 0.74);
      const col = i % 3 === 0 ? mixRgb(collarC, WHITE, 0.42) : mixRgb(collarC, shadeRgb(collarC, -0.35), t * 0.55);
      buf.disc(px, py, w, col);
      buf.blend(px + perp[0] * w * 0.4, py + perp[1] * w * 0.4, WHITE, 145);
    }
    // inner cutting edge
    line(bx, by, bx + perp[0] * bl * 0.68 + dir[0] * bl * 0.54, by + perp[1] * bl * 0.68 - dir[1] * bl * 0.54,
      headR * 0.055, 0.3 * S, WHITE, collarC, WHITE, 190);
  } else if (cfg.itemType === 'crosier') {
    const bx = cp[0] + dir[0] * collarLen * 0.2, by = cp[1] + dir[1] * collarLen * 0.2;
    const cr = headR * 0.9, cx = bx + dir[0] * cr * 1.05, cy = by + dir[1] * cr * 1.05;
    // curling gold crook with a set terminal stone
    buf.ring(cx, cy, cr, Math.max(0.9 * S, W * 0.016), collarC, 245);
    buf.ring(cx, cy, cr * 0.83, Math.max(0.45 * S, W * 0.007), mixRgb(collarC, WHITE, 0.5), 165);
    line(bx, by, cx - dir[0] * cr, cy - dir[1] * cr, headR * 0.15, headR * 0.09, collarC, shadeRgb(collarC, -0.35), shadeRgb(collarC, 0.55));
    buf.disc(cx + perp[0] * cr * 0.88, cy + perp[1] * cr * 0.88, headR * 0.17, mixRgb(gemC, WHITE, 0.32));
    buf.blend(cx + perp[0] * cr * 0.8, cy + perp[1] * cr * 0.8 - S * 0.5, WHITE, 210);
  }
}