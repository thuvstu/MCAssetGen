/*
 * Ornament atelier: the luxury layer around a finished tool.
 * This stage adds thin inlay, filigree, paves, chains, runes and floral frames.
 */
import { WHITE, mixRgb, shadeRgb } from '../color';
import type { RenderCtx } from './context';
import { paintFaceted } from './gems';

export function drawAdornments(c: RenderCtx) {
  const { cfg, buf, geo, pal, S, W, rng, line } = c;
  const style = cfg.adornmentStyle ?? 'none';
  const density = cfg.adornmentDensity ?? 0;
  if (style === 'none' || density < 0.02) return;
  // Shaft-walking goldwork has nothing to walk on for free-floating relics.
  if (geo.shaftless && style !== 'petal-mantle' && style !== 'geodesic') return;
  const { posAt, dir, perp, headC, headR, collarPos, collarW } = geo;
  const count = Math.max(2, Math.round((3 + density * 10) * (W / 64)));
  const gold = pal.collarC, brightGold = mixRgb(gold, WHITE, 0.42);

  if (style === 'filigree') {
    // Paired open curls set between shaft bands; a small bezel marks every third curl.
    for (let i = 0; i < count; i++) {
      const t = 0.14 + (i / count) * 0.72;
      const [x, y] = posAt(t);
      const side = i % 2 ? -1 : 1;
      const r = Math.max(S * 1.3, collarW * (0.52 + density * 0.18));
      const cx = x + perp[0] * side * collarW * 0.28, cy = y + perp[1] * side * collarW * 0.28;
      let prev: [number, number] | null = null;
      for (let q = 0; q <= 22; q++) {
        const a = (q / 22) * Math.PI * 1.7 + i * 0.24;
        const rr = r * (0.18 + q / 22 * 0.82);
        const p: [number, number] = [cx + perp[0] * Math.cos(a) * rr + dir[0] * Math.sin(a) * rr * 0.55,
          cy + perp[1] * Math.cos(a) * rr + dir[1] * Math.sin(a) * rr * 0.55];
        if (prev) line(prev[0], prev[1], p[0], p[1], 0.55 * S, 0.36 * S, brightGold, shadeRgb(gold, -0.3), WHITE, 225);
        prev = p;
      }
      if (i % 3 === 0) buf.disc(cx, cy, Math.max(0.7 * S, collarW * 0.16), pal.gem2, 235);
    }
  } else if (style === 'star-map') {
    const points: Array<[number, number]> = [];
    for (let i = 0; i < count + 2; i++) {
      const t = 0.08 + (i / (count + 1)) * 0.82;
      const [x, y] = posAt(t);
      const side = (i % 2 ? -1 : 1) * (collarW * (0.65 + rng() * 0.8));
      points.push([x + perp[0] * side, y + perp[1] * side]);
    }
    for (let i = 0; i < points.length - 1; i++) {
      if (i % 2 === 0 || density > 0.7) line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], 0.42 * S, 0.32 * S,
        mixRgb(pal.gem2, WHITE, 0.45), pal.gemC, WHITE, 142 + density * 50);
    }
    points.forEach(([x, y], i) => {
      buf.disc(x, y, Math.max(0.65 * S, W * 0.008), i % 3 === 0 ? WHITE : pal.gem2, 230);
      if (i % 3 === 0) {
        buf.disc(x, y, Math.max(1.1 * S, W * 0.018), pal.glowC, 48);
        buf.blend(x - 0.4 * S, y - 0.4 * S, WHITE, 210);
      }
    });
  } else if (style === 'thorn-vine') {
    const turns = 4 + density * 6, steps = Math.round(turns * 18);
    let last: [number, number] | null = null;
    for (let i = 0; i <= steps; i++) {
      const t = 0.07 + (i / steps) * 0.86;
      const [x, y] = posAt(t);
      const a = t * turns * Math.PI * 2;
      const p: [number, number] = [x + perp[0] * Math.cos(a) * collarW * 0.92, y + perp[1] * Math.cos(a) * collarW * 0.92];
      if (last) line(last[0], last[1], p[0], p[1], Math.max(0.45 * S, collarW * 0.13), Math.max(0.35 * S, collarW * 0.09),
        pal.wrapC, shadeRgb(pal.wrapC, -0.32), mixRgb(pal.wrapC, WHITE, 0.32), 240);
      if (i % 6 === 0) {
        const side = Math.sin(a) > 0 ? 1 : -1;
        const tx = p[0] + perp[0] * side * collarW * 0.75 - dir[0] * collarW * 0.35;
        const ty = p[1] + perp[1] * side * collarW * 0.75 - dir[1] * collarW * 0.35;
        line(p[0], p[1], tx, ty, collarW * 0.15, 0.3 * S, [58, 125, 46], [35, 70, 28], [130, 190, 80], 240);
      }
      last = p;
    }
  } else if (style === 'gold-pave') {
    const studs = Math.round(7 + density * 17);
    for (let i = 0; i < studs; i++) {
      const t = 0.08 + (i / studs) * 0.84;
      const [x, y] = posAt(t);
      const side = (i % 2 ? -1 : 1) * collarW * 0.28;
      const px = x + perp[0] * side, py = y + perp[1] * side;
      const r = Math.max(0.65 * S, collarW * (i % 4 === 0 ? 0.23 : 0.13));
      buf.disc(px, py, r * 1.45, shadeRgb(gold, -0.28), 190);
      buf.disc(px, py, r, i % 4 === 0 ? pal.gem2 : brightGold, 250);
      buf.blend(px - r * 0.35, py - r * 0.35, WHITE, 205);
    }
  } else if (style === 'rune-engraving') {
    const n = Math.round(3 + density * 7);
    for (let i = 0; i < n; i++) {
      const t = 0.16 + (i / Math.max(1, n - 1)) * 0.68;
      const [x, y] = posAt(t);
      const cx = x + perp[0] * collarW * 0.3, cy = y + perp[1] * collarW * 0.3;
      const rw = Math.max(1.1 * S, collarW * 0.42), v = i % 4;
      const rc = mixRgb(pal.gem2, WHITE, 0.4);
      if (v === 0) {
        line(cx - rw * 0.45, cy + rw * 0.36, cx + rw * 0.34, cy - rw * 0.36, 0.55 * S, 0.35 * S, rc, pal.gemC, WHITE, 235);
        line(cx - rw * 0.24, cy - rw * 0.1, cx + rw * 0.45, cy + rw * 0.22, 0.45 * S, 0.3 * S, rc, pal.gemC, WHITE, 210);
      } else if (v === 1) {
        line(cx - rw * 0.4, cy, cx + rw * 0.4, cy, 0.55 * S, 0.35 * S, rc, pal.gemC, WHITE, 235);
        line(cx, cy - rw * 0.42, cx, cy + rw * 0.42, 0.55 * S, 0.35 * S, rc, pal.gemC, WHITE, 220);
      } else if (v === 2) {
        line(cx - rw * 0.4, cy - rw * 0.3, cx + rw * 0.4, cy + rw * 0.3, 0.55 * S, 0.35 * S, rc, pal.gemC, WHITE, 235);
        buf.disc(cx, cy, Math.max(0.4 * S, rw * 0.12), WHITE, 220);
      } else {
        buf.ring(cx, cy, rw * 0.36, Math.max(0.4 * S, rw * 0.08), rc, 205);
        line(cx - rw * 0.35, cy + rw * 0.38, cx + rw * 0.35, cy - rw * 0.38, 0.5 * S, 0.3 * S, rc, pal.gemC, WHITE, 225);
      }
    }
  } else if (style === 'chain-drape') {
    for (const side of [-1, 1]) {
      const a: [number, number] = [collarPos[0] + perp[0] * side * collarW * 0.7, collarPos[1] + perp[1] * side * collarW * 0.7];
      const b: [number, number] = [headC[0] + perp[0] * side * headR * 0.9, headC[1] + perp[1] * side * headR * 0.9];
      const sag = headR * 0.4;
      let prev = a;
      const links = Math.round(8 + density * 10);
      for (let i = 1; i <= links; i++) {
        const t = i / links;
        const x = a[0] + (b[0] - a[0]) * t + perp[0] * side * sag * Math.sin(Math.PI * t);
        const y = a[1] + (b[1] - a[1]) * t + perp[1] * side * sag * Math.sin(Math.PI * t);
        buf.ring(x, y, Math.max(0.65 * S, collarW * 0.14), Math.max(0.4 * S, collarW * 0.055), i % 2 ? gold : brightGold, 225);
        if (i % 2 === 0) line(prev[0], prev[1], x, y, 0.36 * S, 0.28 * S, gold, shadeRgb(gold, -0.25), WHITE, 180);
        prev = [x, y];
      }
      paintFaceted(c, b[0], b[1], Math.max(S, headR * 0.14), 'diamond', side);
    }
  } else if (style === 'petal-mantle') {
    for (let i = 0; i < Math.round(6 + density * 6); i++) {
      const a = (i / Math.round(6 + density * 6)) * Math.PI * 2;
      const r = headR * (0.95 + (i % 2) * 0.13);
      const x = headC[0] + Math.cos(a) * r, y = headC[1] + Math.sin(a) * r;
      const tangent = a + Math.PI / 2;
      for (let q = 0; q < 7; q++) {
        const t = q / 7, bx = x + Math.cos(tangent) * headR * 0.26 * (t - 0.5), by = y + Math.sin(tangent) * headR * 0.26 * (t - 0.5);
        const spread = headR * 0.12 * Math.sin(t * Math.PI);
        for (const side of [-1, 1]) buf.blend(bx + Math.cos(a) * spread * side, by + Math.sin(a) * spread * side,
          i % 2 ? pal.gem2 : pal.gemC, 210);
      }
      buf.disc(x, y, Math.max(0.55 * S, headR * 0.045), WHITE, 185);
    }
  } else if (style === 'geodesic') {
    const r = headR * 1.18;
    for (let ring = 0; ring < 3; ring++) {
      const phase = ring * Math.PI / 3;
      const points: Array<[number, number]> = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + phase;
        points.push([headC[0] + Math.cos(a) * r, headC[1] + Math.sin(a) * r * (ring === 1 ? 0.42 : 0.78)]);
      }
      for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        line(a[0], a[1], b[0], b[1], 0.45 * S, 0.3 * S, gold, shadeRgb(gold, -0.25), brightGold, 200);
      }
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      buf.disc(headC[0] + Math.cos(a) * r, headC[1] + Math.sin(a) * r * 0.78, Math.max(0.6 * S, headR * 0.06), pal.gem2, 230);
    }
  } else if (style === 'braided') {
    const steps = Math.round(24 + density * 30), waves = 3 + density * 4;
    for (const offset of [-1, 1]) {
      let prev: [number, number] | null = null;
      for (let i = 0; i <= steps; i++) {
        const t = 0.08 + 0.84 * i / steps, [x, y] = posAt(t);
        const phase = t * waves * Math.PI * 2 + (offset > 0 ? Math.PI : 0);
        const p: [number, number] = [x + perp[0] * Math.cos(phase) * collarW * 0.64, y + perp[1] * Math.cos(phase) * collarW * 0.64];
        if (prev) line(prev[0], prev[1], p[0], p[1], 0.65 * S, 0.42 * S, offset > 0 ? brightGold : gold, shadeRgb(gold, -0.3), WHITE, 225);
        prev = p;
      }
    }
  }
}