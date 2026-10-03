/* Collar / pommel / prongs — the metalwork */
import { INK, RGB, WHITE, mixRgb, shadeRgb } from '../color';
import type { RenderCtx } from './context';

/** Rectangle oriented along the shaft with cylinder shading. */
function drawOriented(c: RenderCtx, cx: number, cy: number, len: number, wid: number, col0: RGB, glowMix?: RGB) {
  const { buf, geo } = c;
  const { dir, perp, lightDot } = geo;
  for (let a = -len / 2; a <= len / 2; a += 0.5) {
    for (let k = -wid; k <= wid; k += 0.6) {
      const x = Math.round(cx + dir[0] * a + perp[0] * k);
      const y = Math.round(cy + dir[1] * a + perp[1] * k);
      const uu = wid > 0 ? (k * lightDot) / wid : 0;
      let col: RGB = uu > 0.4 ? shadeRgb(col0, 0.5) : uu > -0.1 ? col0 : uu > -0.6 ? shadeRgb(col0, -0.22) : shadeRgb(col0, -0.45);
      if (Math.abs(a) > len / 2 - 0.6) col = shadeRgb(col, -0.22);
      if (glowMix && Math.abs(k) < wid * 0.3 && Math.abs(a) < len * 0.2) col = mixRgb(glowMix, WHITE, 0.28);
      buf.set(x, y, col, 255);
    }
  }
}

export function drawCollar(c: RenderCtx) {
  const { cfg, buf, geo, pal, S, W, small, line } = c;
  if (cfg.collarStyle === 'none') return;
  if (geo.shaftless && cfg.collarStyle !== 'orb-cage' && cfg.collarStyle !== 'bell-dome') return;
  const { collarPos: cp, collarLen, collarW, dir, perp } = geo;
  const { collarC, gemC } = pal;
  switch (cfg.collarStyle) {
    case 'ring':
    case 'claw':
      drawOriented(c, cp[0], cp[1], collarLen, collarW, collarC);
      drawOriented(c, cp[0] - dir[0] * collarLen * 0.9, cp[1] - dir[1] * collarLen * 0.9, collarLen * 0.5, collarW * 0.92, shadeRgb(collarC, -0.2));
      if (cfg.collarStyle === 'claw' && !small) {
        for (const sd of [-1, 1]) {
          const bx = cp[0] + perp[0] * sd * collarW * 1.1, by = cp[1] + perp[1] * sd * collarW * 1.1;
          const tx = bx + perp[0] * sd * collarW * 0.9 - dir[0] * collarW * 0.5, ty = by + perp[1] * sd * collarW * 0.9 - dir[1] * collarW * 0.5;
          line(bx, by, tx, ty, collarW * 0.3, collarW * 0.06, collarC, shadeRgb(collarC, -0.35), shadeRgb(collarC, 0.5));
        }
      }
      break;
    case 'guard':
      drawOriented(c, cp[0], cp[1], collarLen * 0.9, collarW * 1.7, collarC);
      for (const sd of [-1, 1]) {
        const gx = cp[0] + perp[0] * sd * collarW * 1.55, gy = cp[1] + perp[1] * sd * collarW * 1.55;
        buf.disc(gx, gy, Math.max(1 * S, W * 0.017), gemC);
        buf.blend(gx - 0.5, gy - 0.5, WHITE, 165);
      }
      break;
    case 'crown':
      drawOriented(c, cp[0], cp[1], collarLen, collarW * 1.15, collarC);
      for (let i = -1; i <= 1; i++) {
        const bx = cp[0] + perp[0] * i * collarW * 0.62 + dir[0] * collarLen * 0.4;
        const by = cp[1] + perp[1] * i * collarW * 0.62 + dir[1] * collarLen * 0.4;
        const h = W * (i === 0 ? 0.05 : 0.038);
        const tx = bx + dir[0] * h, ty = by + dir[1] * h;
        line(bx, by, tx, ty, 1.1 * S, 0.3 * S, collarC, shadeRgb(collarC, -0.35), shadeRgb(collarC, 0.5));
        buf.disc(tx, ty, Math.max(0.8 * S, W * 0.012), mixRgb(gemC, WHITE, 0.35));
      }
      break;
    case 'filigree':
      drawOriented(c, cp[0], cp[1], collarLen * 1.25, collarW * 1.1, collarC, gemC);
      for (let i = -2; i <= 2; i++) buf.blend(cp[0] + perp[0] * i * collarW * 0.42, cp[1] + perp[1] * i * collarW * 0.42, WHITE, 95);
      break;
    case 'socket':
      drawOriented(c, cp[0], cp[1], collarLen * 0.7, collarW * 1.5, shadeRgb(collarC, -0.15));
      drawOriented(c, cp[0], cp[1], collarLen * 0.7, collarW * 0.9, collarC);
      for (const sd of [-1, 1]) {
        buf.disc(cp[0] + perp[0] * sd * collarW * 1.2, cp[1] + perp[1] * sd * collarW * 1.2, Math.max(1 * S, W * 0.02), mixRgb(gemC, WHITE, 0.2));
      }
      break;
    case 'wing-guard': {
      drawOriented(c, cp[0], cp[1], collarLen * 0.85, collarW * 1.1, collarC);
      if (small) break;
      for (const sd of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const f = i / 2;
          const bx = cp[0] + perp[0] * sd * collarW * 0.7, by = cp[1] + perp[1] * sd * collarW * 0.7;
          const tx = bx + perp[0] * sd * collarW * (1.5 - f * 0.4) + dir[0] * collarLen * (0.3 + f * 0.7);
          const ty = by + perp[1] * sd * collarW * (1.5 - f * 0.4) + dir[1] * collarLen * (0.3 + f * 0.7);
          line(bx, by, tx, ty, collarW * (0.24 - f * 0.05), collarW * 0.05, collarC, shadeRgb(collarC, -0.4), shadeRgb(collarC, 0.55));
        }
      }
      break;
    }
    case 'skull-collar': {
      drawOriented(c, cp[0], cp[1], collarLen * 0.7, collarW * 1.15, shadeRgb(collarC, -0.1));
      const sr = collarW * 0.95;
      for (let y = Math.floor(cp[1] - sr); y <= cp[1] + sr * 0.85; y++) {
        for (let x = Math.floor(cp[0] - sr); x <= cp[0] + sr; x++) {
          const d = Math.hypot(x - cp[0], y - cp[1]) / sr;
          if (d > 1) continue;
          buf.set(x, y, mixRgb(shadeRgb(collarC, 0.3), shadeRgb(collarC, -0.3), d), 255);
        }
      }
      buf.disc(cp[0] - sr * 0.36, cp[1] - sr * 0.1, sr * 0.2, INK);
      buf.disc(cp[0] + sr * 0.36, cp[1] - sr * 0.1, sr * 0.2, INK);
      buf.blend(cp[0] - sr * 0.36, cp[1] - sr * 0.1, gemC, 215);
      buf.blend(cp[0] + sr * 0.36, cp[1] - sr * 0.1, gemC, 215);
      break;
    }
    case 'orb-cage': {
      drawOriented(c, cp[0], cp[1], collarLen * 0.6, collarW * 1.05, collarC);
      const cr = collarW * 1.5;
      // caged sphere: two rings + vertical bars
      buf.ring(cp[0], cp[1], cr, Math.max(0.8 * S, W * 0.012), collarC, 255);
      buf.ring(cp[0], cp[1], cr * 0.62, Math.max(0.7 * S, W * 0.01), shadeRgb(collarC, -0.25), 235);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 8;
        line(cp[0] + Math.cos(a) * cr, cp[1] + Math.sin(a) * cr, cp[0] - Math.cos(a) * cr, cp[1] - Math.sin(a) * cr,
          0.6 * S, 0.6 * S, shadeRgb(collarC, 0.2), shadeRgb(collarC, -0.3), shadeRgb(collarC, 0.5), 215);
      }
      buf.disc(cp[0], cp[1], cr * 0.42, mixRgb(gemC, WHITE, 0.35), 240);
      buf.blend(cp[0] - cr * 0.16, cp[1] - cr * 0.16, WHITE, 220);
      break;
    }
    case 'tea-cup': {
      // flared cup form around a liquid surface and delicate handle
      drawOriented(c, cp[0], cp[1], collarLen * 0.55, collarW * 0.9, shadeRgb(collarC, -0.18));
      const bw = collarW * 1.42, bh = collarW * 0.95;
      for (let y = Math.floor(cp[1] - bh * 0.42); y <= cp[1] + bh * 0.58; y++) {
        const f = (y - (cp[1] - bh * 0.42)) / bh;
        const half = bw * (0.55 + f * 0.45);
        for (let x = Math.floor(cp[0] - half); x <= cp[0] + half; x++) {
          const e = Math.abs(x - cp[0]) / Math.max(0.5, half);
          let col = mixRgb(shadeRgb(collarC, 0.42), shadeRgb(collarC, -0.35), e);
          if (e > 0.9) col = shadeRgb(col, -0.2);
          buf.set(x, y, col, 255);
        }
      }
      // liquid surface
      const surfY = cp[1] - bh * 0.12;
      for (let x = Math.floor(cp[0] - bw * 0.52); x <= cp[0] + bw * 0.52; x++) {
        const e = Math.abs(x - cp[0]) / (bw * 0.52);
        buf.set(x, surfY, mixRgb(gemC, pal.gem2, e * 0.75), 255);
        buf.set(x, surfY + S, shadeRgb(gemC, -0.25), 235);
      }
      for (let x = Math.floor(cp[0] - bw * 0.86); x <= cp[0] + bw * 0.86; x++) buf.set(x, cp[1] - bh * 0.45, mixRgb(collarC, WHITE, 0.42), 235);
      // small loop handle at one side (pointing with the shaft's visible broad side)
      const lightProj = perp[0] * geo.LX + perp[1] * geo.LY;
      const hSide = lightProj > 0 ? -1 : 1;
      for (let i = -3; i <= 3; i++) {
        const ax = cp[0] + perp[0] * hSide * bw * 0.72, ay = cp[1] + i * bh * 0.13;
        buf.disc(ax, ay, bh * 0.1, mixRgb(collarC, WHITE, 0.25), 230);
      }
      for (let i = -2; i <= 2; i++) {
        const ax = cp[0] + perp[0] * hSide * (bw * 0.72 + bh * 0.1), ay = cp[1] + i * bh * 0.1;
        buf.set(ax, ay, [18, 14, 24], 200);
      }
      buf.blend(cp[0] - bw * 0.42, cp[1] - bh * 0.32, WHITE, 220);
      break;
    }
    case 'bell-dome': {
      // dome cap with a brass rim and dangling inner sphere
      const dr = collarW * 1.55;
      for (let y = Math.floor(cp[1] - dr * 0.75); y <= cp[1] + dr * 0.35; y++) {
        const t = (y - (cp[1] - dr * 0.75)) / (dr * 1.1);
        const half = dr * Math.sin(Math.min(Math.PI / 2, t * Math.PI * 0.55 + 0.06));
        for (let x = Math.floor(cp[0] - half); x <= cp[0] + half; x++) {
          const e = Math.abs(x - cp[0]) / Math.max(0.5, half);
          let col = mixRgb(shadeRgb(collarC, 0.45), shadeRgb(collarC, -0.4), e * 0.8);
          if (e > 0.9) col = shadeRgb(col, -0.2);
          buf.set(x, y, col, 255);
        }
      }
      for (let x = Math.floor(cp[0] - dr); x <= cp[0] + dr; x++) {
        buf.set(x, cp[1] + dr * 0.35, mixRgb(collarC, WHITE, 0.3), 250);
        buf.set(x, cp[1] + dr * 0.42, shadeRgb(collarC, -0.28), 240);
      }
      buf.disc(cp[0], cp[1] - dr * 0.78, dr * 0.14, mixRgb(collarC, WHITE, 0.42), 245);
      // inner bell clapper (hanging gem)
      line(cp[0], cp[1] + dr * 0.35, cp[0], cp[1] + dr * 0.62, 0.5 * S, 0.4 * S, collarC, shadeRgb(collarC, -0.3), WHITE, 235);
      buf.disc(cp[0], cp[1] + dr * 0.68, dr * 0.17, mixRgb(gemC, WHITE, 0.3), 245);
      buf.blend(cp[0] - dr * 0.05, cp[1] + dr * 0.62, WHITE, 215);
      buf.blend(cp[0] - dr * 0.42, cp[1] - dr * 0.52, WHITE, 225);
      break;
    }
  }
}

export function drawPommel(c: RenderCtx) {
  const { cfg, buf, geo, pal, S, W, line } = c;
  if (geo.shaftless) return;                        // relics have no butt end
  const { pomPos: pp, dir, perp, baseThick } = geo;
  const { pommelC, gemC, wrapC } = pal;
  const pr = Math.max(1.2 * S, baseThick * 0.72);
  switch (cfg.pommelStyle) {
    case 'cap':
      buf.disc(pp[0], pp[1], pr * 1.05, pommelC);
      buf.disc(pp[0] + perp[0] * 0.7, pp[1] + perp[1] * 0.7, pr * 0.38, shadeRgb(pommelC, 0.5));
      break;
    case 'gem': {
      const gr = pr * 1.35;
      for (let y = Math.floor(pp[1] - gr - 1); y <= pp[1] + gr + 1; y++) {
        for (let x = Math.floor(pp[0] - gr - 1); x <= pp[0] + gr + 1; x++) {
          const m = Math.abs(x - pp[0]) + Math.abs(y - pp[1]);
          if (m <= gr + 1 && m > gr) buf.set(x, y, pommelC, 255);
          else if (m <= gr) {
            const col = mixRgb(mixRgb(gemC, WHITE, 0.4), gemC, m / gr);
            buf.set(x, y, x < pp[0] ? shadeRgb(col, -0.15) : col, 255);
          }
        }
      }
      buf.blend(pp[0] - 0.6, pp[1] - 0.6, WHITE, 205);
      break;
    }
    case 'spike':
      line(pp[0], pp[1], pp[0] - dir[0] * W * 0.055, pp[1] - dir[1] * W * 0.055, pr * 0.8, 0.3 * S, pommelC, shadeRgb(pommelC, -0.4), shadeRgb(pommelC, 0.5));
      break;
    case 'ring': {
      const or = pr * 1.5, ir = pr * 0.75;
      for (let y = Math.floor(pp[1] - or); y <= pp[1] + or; y++) {
        for (let x = Math.floor(pp[0] - or); x <= pp[0] + or; x++) {
          const d = Math.hypot(x - pp[0], y - pp[1]);
          if (d <= or && d >= ir) buf.set(x, y, x > pp[0] ? shadeRgb(pommelC, 0.45) : shadeRgb(pommelC, -0.2), 255);
        }
      }
      break;
    }
    case 'tassel':
      buf.disc(pp[0], pp[1], pr * 0.7, pommelC);
      for (let i = -1; i <= 1; i++) {
        const bx = pp[0] + perp[0] * i * 1.6 * S - dir[0] * S, by = pp[1] + perp[1] * i * 1.6 * S - dir[1] * S;
        const tx = bx - dir[0] * W * 0.05 + perp[0] * i * 1.2 * S, ty = by - dir[1] * W * 0.05 + perp[1] * i * 1.2 * S;
        line(bx, by, tx, ty, 0.8 * S, 0.5 * S, wrapC, shadeRgb(wrapC, -0.3), shadeRgb(wrapC, 0.3));
        buf.disc(tx, ty, 0.9 * S, gemC);
      }
      break;
    case 'skullcap': {
      const sr = pr * 1.2;
      for (let y = Math.floor(pp[1] - sr - 1); y <= pp[1] + sr * 0.8; y++) {
        for (let x = Math.floor(pp[0] - sr - 1); x <= pp[0] + sr + 1; x++) {
          const d = Math.hypot(x - pp[0], y - pp[1]) / sr;
          if (d <= 1 && y < pp[1] + sr * 0.45) {
            let col = mixRgb(shadeRgb(pommelC, 0.2), shadeRgb(pommelC, -0.2), (y - (pp[1] - sr)) / (1.8 * sr));
            if (d > 0.88) col = shadeRgb(col, -0.3);
            buf.set(x, y, col, 255);
          }
        }
      }
      buf.disc(pp[0] - sr * 0.35, pp[1] - sr * 0.1, sr * 0.16, INK);
      buf.disc(pp[0] + sr * 0.35, pp[1] - sr * 0.1, sr * 0.16, INK);
      buf.blend(pp[0] - sr * 0.38, pp[1] - sr * 0.13, gemC, 200);
      buf.blend(pp[0] + sr * 0.33, pp[1] - sr * 0.13, gemC, 200);
      break;
    }
    case 'orb': {
      const orr = pr * 1.4;
      for (let y = Math.floor(pp[1] - orr); y <= pp[1] + orr; y++) {
        for (let x = Math.floor(pp[0] - orr); x <= pp[0] + orr; x++) {
          const dx = x - pp[0], dy = y - pp[1];
          const d = Math.hypot(dx, dy) / orr;
          if (d > 1) continue;
          const uu = (dx * -0.7071 + dy * -0.7071) / orr;
          let col = mixRgb(mixRgb(gemC, WHITE, 0.4), gemC, d);
          if (uu > 0.35) col = mixRgb(col, WHITE, 0.3);
          if (d > 0.85) col = shadeRgb(col, -0.4);
          buf.set(x, y, col, 255);
        }
      }
      buf.blend(pp[0] - orr * 0.35, pp[1] - orr * 0.35, WHITE, 235);
      break;
    }
    case 'crescent': {
      const cr = pr * 1.5, ox = cr * 0.52;
      for (let y = Math.floor(pp[1] - cr); y <= pp[1] + cr; y++) {
        for (let x = Math.floor(pp[0] - cr); x <= pp[0] + cr; x++) {
          const d1 = Math.hypot(x - pp[0], y - pp[1]) / cr;
          const d2 = Math.hypot(x - (pp[0] + ox), y - (pp[1] - cr * 0.2)) / (cr * 0.82);
          if (d1 > 1 || d2 < 1) continue;
          buf.set(x, y, mixRgb(shadeRgb(pommelC, 0.35), shadeRgb(pommelC, -0.3), d1), 255);
        }
      }
      break;
    }
    case 'anchor': {
      const aw = pr * 1.5;
      // crossbar
      for (let k = -aw; k <= aw; k += 0.5) {
        buf.set(pp[0] + perp[0] * k, pp[1] + perp[1] * k, k < 0 ? shadeRgb(pommelC, -0.25) : shadeRgb(pommelC, 0.4), 255);
      }
      // stem
      line(pp[0], pp[1], pp[0] - dir[0] * aw * 1.3, pp[1] - dir[1] * aw * 1.3, pr * 0.42, pr * 0.3, pommelC, shadeRgb(pommelC, -0.35), shadeRgb(pommelC, 0.5));
      // flukes
      for (const sd of [-1, 1]) {
        const bx = pp[0] - dir[0] * aw * 1.1, by = pp[1] - dir[1] * aw * 1.1;
        const tx = bx + perp[0] * sd * aw * 0.95 - dir[0] * aw * 0.1;
        const ty = by + perp[1] * sd * aw * 0.95 - dir[1] * aw * 0.1;
        line(bx, by, tx, ty, pr * 0.4, pr * 0.1, pommelC, shadeRgb(pommelC, -0.35), shadeRgb(pommelC, 0.5));
      }
      buf.disc(pp[0], pp[1], pr * 0.34, mixRgb(gemC, WHITE, 0.3));
      break;
    }
    case 'split-tassel': {
      buf.disc(pp[0], pp[1], pr * 0.85, mixRgb(pommelC, WHITE, 0.18), 245);
      const cordLen = W * 0.085;
      for (const sd of [-1, 1]) {
        const bx2 = pp[0] + perp[0] * sd * pr * 0.32, by2 = pp[1] + perp[1] * sd * pr * 0.32;
        let lx = bx2, ly = by2;
        for (let i = 0; i < 4; i++) {
          const t = (i + 1) / 4;
          const tx = bx2 + perp[0] * sd * (0.2 + t * 0.5) * cordLen, ty = by2 + dir[0] * 0 + cordLen * t * 0.88 - perp[1] * Math.abs(Math.sin(t * Math.PI)) * cordLen * 0.12;
          line(lx, ly, tx, ty, pr * (0.24 - t * 0.12), pr * (0.2 - t * 0.1), wrapC, shadeRgb(wrapC, -0.32), mixRgb(wrapC, WHITE, 0.32), 245);
          lx = tx; ly = ty;
        }
        for (let i = 0; i < 5; i++) {
          line(lx, ly, lx + perp[0] * (i - 2) * W * 0.006, ly + W * 0.014 * (i % 2 ? 1.2 : 1), 0.55 * S, 0.35 * S, shadeRgb(wrapC, 0.2), wrapC, WHITE, 235);
        }
        buf.disc(lx, ly + W * 0.012, Math.max(0.55 * S, pr * 0.09), mixRgb(wrapC, WHITE, 0.35), 235);
      }
      break;
    }
    case 'lantern-hanger': {
      // hanging miniature lantern on a short chain
      const cordLen = W * 0.105;
      const glide = (i: number, t: number): [number, number] => [
        pp[0] + Math.sin(i * 0.8 + cfg.seed * 0.01) * W * 0.004 + dir[0] * -cordLen * t * 0.24,
        pp[1] + cordLen * t * 0.68,
      ];
      let prev = glide(0, 0);
      for (let i = 1; i <= 6; i++) {
        const cur = glide(i, i / 6);
        line(prev[0], prev[1], cur[0], cur[1], 0.55 * S, 0.38 * S, pommelC, shadeRgb(pommelC, -0.35), WHITE, 235);
        if (i % 2 === 0) buf.disc(cur[0], cur[1], Math.max(0.55 * S, pr * 0.06), pommelC, 225);
        prev = cur;
      }
      const lx = prev[0], ly = prev[1] + cordLen * 0.1;
      const lw2 = pr * 1.45;
      for (let y = Math.floor(ly - lw2 * 0.7); y <= ly + lw2 * 0.85; y++) {
        const f = (y - (ly - lw2 * 0.7)) / (lw2 * 1.55);
        const half = lw2 * (0.3 + Math.sin(Math.min(Math.PI, f * Math.PI)) * 0.85);
        for (let x = Math.floor(lx - half); x <= lx + half; x++) {
          const e = Math.abs(x - lx) / Math.max(0.5, half);
          let col = mixRgb(mixRgb(gemC, WHITE, 0.36), shadeRgb(gemC, -0.46), e * 0.78);
          if (Math.abs(x - lx) < half * 0.22 && f > 0.28 && f < 0.72) col = mixRgb(col, mixRgb(gemC, WHITE, 0.5), 0.72);
          if (e > 0.9) col = shadeRgb(col, -0.22);
          buf.set(x, y, col, 255);
        }
      }
      buf.disc(lx, ly, lw2 * 0.2, mixRgb(gemC, WHITE, 0.52), 240);
      buf.blend(lx - lw2 * 0.03, ly - lw2 * 0.04, WHITE, 235);
      for (let x = Math.floor(lx - lw2 * 0.55); x <= lx + lw2 * 0.55; x++) {
        buf.set(x, ly - lw2 * 0.72, mixRgb(pommelC, WHITE, 0.32), 235);
        buf.set(x, ly + lw2 * 0.86, shadeRgb(pommelC, -0.28), 240);
      }
      line(lx - lw2 * 0.5, ly - lw2 * 0.8, lx + lw2 * 0.5, ly - lw2 * 0.8, 0.55 * S, 0.35 * S, pommelC, shadeRgb(pommelC, -0.3), WHITE, 232);
      buf.blend(lx - lw2 * 0.42, ly - lw2 * 0.42, WHITE, 218);
      break;
    }
  }
}

/* ═══════════════ Dangles (吊り下げ装飾) ═══════════════ */
export function drawDangles(c: RenderCtx) {
  const { cfg, buf, geo, pal, S, W, small, line, rng } = c;
  const style = cfg.dangleStyle ?? 'none';
  const count = cfg.dangleCount ?? 2;
  if (style === 'none' || count <= 0 || small) return;
  const { collarPos: cp, dir, perp, shaftless, headR } = geo;
  // Free-floating relics hang their charms from the head's own width.
  const collarW = shaftless ? headR * 0.62 : geo.collarW;
  const { collarC, gemC, gem2, wrapC } = pal;
  const dropLen = W * (shaftless ? 0.16 : 0.1);

  for (let i = 0; i < count; i++) {
    const off = (i - (count - 1) / 2) * collarW * 1.15;
    const ax = cp[0] + perp[0] * off - dir[0] * collarW * 0.4;
    const ay = cp[1] + perp[1] * off - dir[1] * collarW * 0.4;
    // gravity-ish sway (down-screen) with slight per-index offset
    const sway = (rng() - 0.5) * W * 0.02;
    const ex = ax + sway, ey = ay + dropLen;

    switch (style) {
      case 'ribbon': {
        for (let q = 0; q <= 14; q++) {
          const t = q / 14;
          const x = ax + sway * t + Math.sin(t * Math.PI * 1.6 + i) * W * 0.012;
          const y = ay + dropLen * t;
          const col = mixRgb(wrapC, WHITE, Math.sin(t * Math.PI) * 0.35);
          buf.disc(x, y, Math.max(0.6 * S, W * 0.009 * (1 - t * 0.25)), col, 250);
        }
        break;
      }
      case 'chain-charm': {
        const links = 5;
        for (let q = 0; q < links; q++) {
          const t = q / links;
          const y = ay + dropLen * t;
          buf.ring(ax + sway * t, y, Math.max(0.8 * S, W * 0.011), Math.max(0.5 * S, W * 0.005),
            q % 2 ? shadeRgb(collarC, -0.2) : collarC, 245);
        }
        buf.disc(ex, ey, Math.max(1 * S, W * 0.017), mixRgb(gemC, WHITE, 0.3));
        buf.blend(ex - 0.6, ey - 0.6, WHITE, 205);
        break;
      }
      case 'bell': {
        line(ax, ay, ex, ey - W * 0.02, 0.5 * S, 0.5 * S, collarC, shadeRgb(collarC, -0.3), shadeRgb(collarC, 0.4), 235);
        const br = W * 0.022;
        for (let y = Math.floor(ey - br); y <= ey + br * 0.7; y++) {
          const f = (y - (ey - br)) / (br * 1.7);
          const hw2 = br * (0.32 + 0.68 * f);
          for (let x = Math.floor(ex - hw2); x <= ex + hw2; x++) {
            const e = Math.abs(x - ex) / Math.max(0.4, hw2);
            buf.set(x, y, mixRgb(shadeRgb(collarC, 0.4), shadeRgb(collarC, -0.35), e * 0.85), 255);
          }
        }
        buf.disc(ex, ey + br * 0.85, Math.max(0.6 * S, br * 0.3), shadeRgb(collarC, -0.45));
        break;
      }
      case 'feather': {
        line(ax, ay, ex, ey, 0.5 * S, 0.4 * S, collarC, collarC, collarC, 210);
        for (let q = 0; q < 8; q++) {
          const t = q / 8;
          const y = ey + t * W * 0.05;
          const spread = W * 0.016 * Math.sin((1 - t) * Math.PI);
          for (const sd of [-1, 1]) {
            line(ex, y, ex + sd * spread, y - spread * 0.4, 0.5 * S, 0.35 * S,
              mixRgb(pal.wingC, gem2, t * 0.4), shadeRgb(pal.wingC, -0.3), WHITE, 235);
          }
        }
        break;
      }
      case 'crystal-drop': {
        line(ax, ay, ex, ey - W * 0.018, 0.5 * S, 0.45 * S, collarC, shadeRgb(collarC, -0.3), shadeRgb(collarC, 0.45), 235);
        const dr = W * 0.02;
        for (let y = Math.floor(ey - dr); y <= ey + dr * 1.5; y++) {
          for (let x = Math.floor(ex - dr); x <= ex + dr; x++) {
            const m = Math.abs(x - ex) / dr + Math.abs(y - ey) / (dr * 1.5);
            if (m > 1) continue;
            let col = mixRgb(mixRgb(gem2, WHITE, 0.45), gemC, m);
            if (x < ex) col = shadeRgb(col, -0.18);
            buf.set(x, y, col, 255);
          }
        }
        buf.blend(ex - dr * 0.3, ey - dr * 0.3, WHITE, 240);
        break;
      }
      case 'beads': {
        const n = 4;
        for (let q = 0; q < n; q++) {
          const t = (q + 1) / n;
          const bx = ax + sway * t, by = ay + dropLen * t;
          const col = q % 2 ? mixRgb(gemC, WHITE, 0.25) : mixRgb(gem2, WHITE, 0.15);
          buf.disc(bx, by, Math.max(0.8 * S, W * 0.012), col);
          buf.blend(bx - 0.5, by - 0.5, WHITE, 180);
        }
        break;
      }
      case 'talisman-tag': {
        line(ax, ay, ex, ey - W * 0.016, 0.5 * S, 0.45 * S, wrapC, shadeRgb(wrapC, -0.3), shadeRgb(wrapC, 0.35), 230);
        const tw2 = W * 0.018, th2 = W * 0.026;
        for (let y = Math.floor(ey - th2 * 0.4); y <= ey + th2; y++) {
          for (let x = Math.floor(ex - tw2); x <= ex + tw2; x++) {
            const pointed = y > ey + th2 * 0.5 && Math.abs(x - ex) > tw2 * (1 - (y - (ey + th2 * 0.5)) / (th2 * 0.5));
            if (pointed) continue;
            buf.set(x, y, mixRgb([236, 226, 198], [176, 158, 120], Math.abs(x - ex) / tw2 * 0.6), 255);
          }
        }
        // ink glyph
        line(ex, ey + th2 * 0.05, ex, ey + th2 * 0.6, 0.6 * S, 0.6 * S, gemC, gemC, gemC, 235);
        line(ex - tw2 * 0.5, ey + th2 * 0.28, ex + tw2 * 0.5, ey + th2 * 0.28, 0.6 * S, 0.6 * S, gemC, gemC, gemC, 235);
        break;
      }
    }
  }
}

export function drawProngs(c: RenderCtx) {
  const { cfg, buf, geo, pal, S, W, small } = c;
  if (cfg.prongs <= 0 || small) return;
  const { collarPos: cp, collarLen, collarW, dir, perp, headC, headR } = geo;
  const w = Math.max(0.8 * S, W * 0.013);
  for (let i = 0; i < cfg.prongs; i++) {
    const off = (i - (cfg.prongs - 1) / 2) * collarW * 0.78;
    const bx = cp[0] + perp[0] * off + dir[0] * collarLen * 0.4;
    const by = cp[1] + perp[1] * off + dir[1] * collarLen * 0.4;
    const tx = headC[0] - dir[0] * headR * 0.85 + perp[0] * off * 1.1;
    const ty = headC[1] - dir[1] * headR * 0.85 + perp[1] * off * 1.1;
    const mx = (bx + tx) / 2 + perp[0] * off * 0.35 - dir[0] * headR * 0.1;
    const my = (by + ty) / 2 + perp[1] * off * 0.35 - dir[1] * headR * 0.1;
    for (let q = 0; q <= 16; q++) {
      const t = q / 16;
      const x = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * mx + t * t * tx;
      const y = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * my + t * t * ty;
      buf.disc(x, y, w * (1 - t * 0.35), pal.prongC);
      buf.blend(x - 0.4, y - 0.4, WHITE, 75);
    }
    buf.disc(tx, ty, w * 1.15, shadeRgb(pal.prongC, 0.45));
  }
}
