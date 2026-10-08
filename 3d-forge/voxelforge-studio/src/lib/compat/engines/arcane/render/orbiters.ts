/*
 * Orbiting ornament atelier.
 * Every body gets its own silhouette/material; this is not a generic dot array.
 */
import { RGB, WHITE, clamp01, mixRgb, shadeRgb } from '../color';
import type { RenderCtx } from './context';
import { paintCrystal } from './head';
import { paintFaceted } from './gems';

function orb(c: RenderCtx, x: number, y: number, r: number, color = c.pal.gemC, alt = c.pal.gem2) {
  const { edgeDarken } = c;
  for (let py = Math.floor(y - r); py <= y + r; py++) {
    for (let px = Math.floor(x - r); px <= x + r; px++) {
      const dx = (px - x) / r, dy = (py - y) / r, d = Math.hypot(dx, dy);
      if (d > 1) continue;
      let col = mixRgb(mixRgb(color, WHITE, 0.44), shadeRgb(color, -0.3), d * d);
      const light = -(dx + dy) * 0.707;
      if (light > 0.28) col = mixRgb(col, WHITE, 0.18);
      if (d > 0.87) col = edgeDarken(col, 0.8);
      if ((dx + dy) < -0.5) col = mixRgb(col, alt, 0.18);
      c.buf.set(px, py, col, 255);
    }
  }
  c.buf.blend(x - r * 0.32, y - r * 0.36, WHITE, 225);
}

function drawRune(c: RenderCtx, x: number, y: number, r: number, index: number) {
  const { buf, pal, S, line } = c;
  const col = mixRgb(pal.gem2, WHITE, 0.42);
  buf.ring(x, y, r * 0.88, Math.max(0.45 * S, r * 0.08), pal.collarC, 225);
  buf.ring(x, y, r * 0.66, Math.max(0.35 * S, r * 0.05), col, 170);
  const variants = index % 3;
  if (variants === 0) {
    line(x - r * 0.38, y + r * 0.24, x + r * 0.32, y - r * 0.3, 0.55 * S, 0.35 * S, col, pal.gemC, WHITE, 240);
    line(x - r * 0.2, y - r * 0.15, x + r * 0.4, y + r * 0.25, 0.45 * S, 0.3 * S, col, pal.gemC, WHITE, 210);
  } else if (variants === 1) {
    line(x - r * 0.3, y - r * 0.3, x + r * 0.3, y + r * 0.3, 0.55 * S, 0.35 * S, col, pal.gemC, WHITE, 240);
    line(x - r * 0.3, y + r * 0.3, x + r * 0.3, y - r * 0.3, 0.55 * S, 0.35 * S, col, pal.gemC, WHITE, 210);
  } else {
    line(x, y - r * 0.38, x, y + r * 0.38, 0.55 * S, 0.35 * S, col, pal.gemC, WHITE, 240);
    line(x - r * 0.3, y, x + r * 0.3, y, 0.55 * S, 0.35 * S, col, pal.gemC, WHITE, 210);
    c.buf.disc(x, y, r * 0.1, WHITE, 220);
  }
}

function petal(c: RenderCtx, x: number, y: number, r: number, a: number, color: RGB) {
  const { buf, S } = c;
  const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
  const length = r * 1.45, width = r * 0.6;
  for (let py = Math.floor(y - length); py <= y + length; py++) {
    for (let px = Math.floor(x - length); px <= x + length; px++) {
      const dx = px - x, dy = py - y;
      const along = dx * ux + dy * uy, across = dx * vx + dy * vy;
      const t = clamp01((along + length * 0.2) / (length * 1.15));
      const half = width * Math.sin(Math.PI * t);
      if (along < -length * 0.2 || along > length * 0.9 || Math.abs(across) > half) continue;
      let col = mixRgb(color, WHITE, 0.18 + 0.3 * (1 - t));
      if (Math.abs(across) < Math.max(0.35 * S, half * 0.11)) col = mixRgb(col, WHITE, 0.22);
      buf.set(px, py, col, 235);
    }
  }
}

function tinyCrown(c: RenderCtx, x: number, y: number, r: number) {
  const { pal, S, line } = c;
  line(x - r, y + r * 0.42, x + r, y + r * 0.42, r * 0.16, r * 0.13, pal.collarC, shadeRgb(pal.collarC, -0.32), mixRgb(pal.collarC, WHITE, 0.5));
  for (let i = -1; i <= 1; i++) {
    const bx = x + i * r * 0.56, by = y + r * 0.38;
    const tx = bx + i * r * 0.08, ty = y - r * (i === 0 ? 0.9 : 0.55);
    line(bx, by, tx, ty, r * 0.15, 0.35 * S, pal.collarC, shadeRgb(pal.collarC, -0.35), WHITE);
    c.buf.disc(tx, ty, Math.max(0.45 * S, r * 0.1), pal.gem2);
  }
  c.buf.disc(x, y + r * 0.04, r * 0.19, pal.gemC);
}

function hourglass(c: RenderCtx, x: number, y: number, r: number) {
  const { buf, pal, S } = c;
  const w = r * 0.68, h = r * 1.05;
  for (let px = Math.floor(x - w); px <= x + w; px++) {
    buf.set(px, y - h, pal.collarC, 240); buf.set(px, y + h, shadeRgb(pal.collarC, -0.2), 240);
  }
  for (let py = Math.floor(y - h); py <= y + h; py++) {
    const f = (py - y) / h, half = w * (0.12 + 0.88 * Math.abs(f));
    for (let px = Math.floor(x - half); px <= x + half; px++) {
      const e = Math.abs(px - x) / Math.max(0.5, half);
      buf.blend(px, py, mixRgb(mixRgb(pal.gem2, WHITE, 0.5), pal.gemC, e), e > 0.82 ? 215 : 170);
    }
  }
  for (let py = y; py < y + h * 0.72; py += Math.max(1, S * 0.6)) buf.blend(x, py, WHITE, 230);
}

export function drawOrbiters(c: RenderCtx) {
  const { cfg, buf, geo, pal, anim, S, W, small, line } = c;
  if (cfg.orbiterStyle === 'none' || cfg.orbiterCount <= 0 || small) return;
  const { headC, headR } = geo;
  const { gemC, gem2, collarC } = pal;
  const size = headR * cfg.orbiterSize;
  const orbitR = headR * cfg.orbiterRadius;
  const positions: Array<[number, number, number]> = [];

  for (let i = 0; i < cfg.orbiterCount; i++) {
    const a = (i / cfg.orbiterCount) * Math.PI * 2 + cfg.seed * 0.013 + Math.PI / 2 + anim.orbPhase;
    const bob = anim.on && anim.type === 'orbit' ? Math.sin(a * 3 + anim.t * anim.TAU * 2) * headR * 0.06 * anim.intensity : 0;
    const px = headC[0] + Math.cos(a) * orbitR, py = headC[1] + Math.sin(a) * orbitR * 0.82 + bob;
    if (px < -size * 2 || py < -size * 2 || px > W + size * 2 || py > W + size * 2) continue;
    positions.push([px, py, a]);
  }

  if (cfg.orbiterStyle === 'gem-chain' || cfg.orbiterStyle === 'constellation') {
    for (let i = 0; i < positions.length; i++) {
      const [x0, y0] = positions[i], [x1, y1] = positions[(i + 1) % positions.length];
      line(x0, y0, x1, y1, Math.max(0.4 * S, size * 0.04), Math.max(0.35 * S, size * 0.025),
        cfg.orbiterStyle === 'gem-chain' ? collarC : mixRgb(gem2, WHITE, 0.38), shadeRgb(collarC, -0.3), WHITE,
        cfg.orbiterStyle === 'gem-chain' ? 190 : 150);
    }
  }

  positions.forEach(([x, y, a], i) => {
    switch (cfg.orbiterStyle) {
      case 'orb': orb(c, x, y, size); break;
      case 'shard': paintFaceted(c, x, y, size * 1.15, 'diamond', i); break;
      case 'crystal': paintCrystal(c, x, y, size * 1.22, mixRgb(gemC, WHITE, 0.1), gem2, i % 2 ? 0.16 : -0.16); break;
      case 'rune': drawRune(c, x, y, size, i); break;
      case 'rune-satellite':
        drawRune(c, x, y, size * 1.25, i);
        for (let q = 0; q < 3; q++) {
          const aa = a + (q / 3) * Math.PI * 2 + anim.spinA;
          buf.blend(x + Math.cos(aa) * size * 1.42, y + Math.sin(aa) * size * 1.42, WHITE, 200);
        }
        break;
      case 'star':
        for (let py = Math.floor(y - size * 1.2); py <= y + size * 1.2; py++) {
          for (let px = Math.floor(x - size * 1.2); px <= x + size * 1.2; px++) {
            const dx = px - x, dy = py - y, d = Math.hypot(dx, dy), aa = Math.atan2(dy, dx);
            const rr = size * (0.38 + 0.62 * Math.pow(0.5 + 0.5 * Math.cos(4 * aa), 0.35));
            if (d <= rr) buf.set(px, py, mixRgb(mixRgb(gem2, WHITE, 0.45), gemC, d / rr), 255);
          }
        }
        buf.blend(x, y, WHITE, 250);
        break;
      case 'gear': {
        const teeth = 8, r = size;
        for (let py = Math.floor(y - r * 1.35); py <= y + r * 1.35; py++) {
          for (let px = Math.floor(x - r * 1.35); px <= x + r * 1.35; px++) {
            const dx = px - x, dy = py - y, d = Math.hypot(dx, dy), aa = Math.atan2(dy, dx);
            const rr = r * (0.78 + 0.3 * Math.pow(Math.max(0, Math.cos(teeth * aa)), 0.5));
            if (d > rr || d < r * 0.28) continue;
            let col = mixRgb(shadeRgb(collarC, 0.38), shadeRgb(collarC, -0.32), clamp01((dx + r) / (2 * r)));
            if (d < r * 0.42) col = mixRgb(col, gemC, 0.65);
            buf.set(px, py, col, 255);
          }
        }
        break;
      }
      case 'leaf':
      case 'feather': {
        const len = size * (cfg.orbiterStyle === 'leaf' ? 1.55 : 1.8), width = size * 0.68;
        const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
        line(x - ux * len * 0.75, y - uy * len * 0.75, x + ux * len * 0.75, y + uy * len * 0.75,
          Math.max(0.45 * S, size * 0.09), 0.35 * S, mixRgb(gemC, WHITE, 0.32), gemC, WHITE, 238);
        for (let q = 0; q < 5; q++) {
          const t = (q + 1) / 6, bx = x + (t - 0.5) * len * ux, by = y + (t - 0.5) * len * uy;
          const span = width * Math.sin(t * Math.PI);
          for (const side of [-1, 1]) line(bx, by, bx + side * span * vx, by + side * span * vy,
            0.45 * S, 0.3 * S, mixRgb(gem2, WHITE, 0.25), gemC, WHITE, 210);
        }
        break;
      }
      case 'ember': {
        const flick = anim.flicker;
        buf.disc(x, y, size * 0.72, mixRgb(gem2, WHITE, 0.5), 235 * flick);
        buf.disc(x, y, size * 0.3, WHITE, 245 * flick);
        buf.disc(x - size * 0.1, y + size * 1.1, size * 0.26, gemC, 135);
        break;
      }
      case 'snowflake': {
        const color = mixRgb(gem2, WHITE, 0.45);
        for (let q = 0; q < 6; q++) {
          const aa = (q / 6) * Math.PI * 2;
          line(x, y, x + Math.cos(aa) * size, y + Math.sin(aa) * size, 0.65 * S, 0.38 * S, color, color, WHITE, 235);
          const bx = x + Math.cos(aa) * size * 0.62, by = y + Math.sin(aa) * size * 0.62;
          line(bx, by, bx + Math.cos(aa + 0.7) * size * 0.3, by + Math.sin(aa + 0.7) * size * 0.3, 0.42 * S, 0.28 * S, color, color, WHITE, 205);
        }
        buf.blend(x, y, WHITE, 250);
        break;
      }
      case 'spark':
        buf.blend(x, y, WHITE, 255);
        line(x - size, y, x + size, y, 0.4 * S, 0.35 * S, gem2, gem2, WHITE, 210);
        line(x, y - size, x, y + size, 0.4 * S, 0.35 * S, gem2, gem2, WHITE, 210);
        break;
      case 'skull': {
        const s = size * 0.95;
        buf.disc(x, y, s, [222, 218, 202], 255);
        buf.disc(x - s * 0.36, y - s * 0.05, s * 0.22, [16, 11, 22], 255);
        buf.disc(x + s * 0.36, y - s * 0.05, s * 0.22, [16, 11, 22], 255);
        buf.blend(x - s * 0.36, y - s * 0.05, gemC, 220); buf.blend(x + s * 0.36, y - s * 0.05, gemC, 220);
        break;
      }
      case 'bubble': {
        const br = size * 0.9;
        buf.disc(x, y, br, mixRgb(gemC, WHITE, 0.3), 55);
        buf.ring(x, y, br, Math.max(0.5 * S, br * 0.14), mixRgb(gem2, WHITE, 0.5), 230);
        buf.blend(x - br * 0.32, y - br * 0.35, WHITE, 240);
        break;
      }
      case 'card': {
        const w = size * 0.7, h = size;
        for (let py = Math.floor(y - h); py <= y + h; py++) for (let px = Math.floor(x - w); px <= x + w; px++) {
          const dx = Math.abs(px - x) / w, dy = Math.abs(py - y) / h;
          if (dx > 1 || dy > 1) continue;
          let col: RGB = mixRgb([247, 242, 224], [190, 180, 156], dx * 0.28 + dy * 0.35);
          if (dx > 0.82 || dy > 0.86) col = shadeRgb(col, -0.3);
          buf.set(px, py, col, 255);
        }
        paintFaceted(c, x, y, size * 0.3, 'round', i);
        break;
      }
      case 'gem-set': {
        const stones = 3;
        for (let q = 0; q < stones; q++) {
          const aa = a + (q - 1) * 0.72;
          const sz = size * (q === 1 ? 0.72 : 0.52);
          const gx = x + Math.cos(aa) * size * 0.45, gy = y + Math.sin(aa) * size * 0.45;
          paintFaceted(c, gx, gy, sz, q === 1 ? 'diamond' : 'marquise', q);
          buf.ring(gx, gy, sz * 1.12, Math.max(0.4 * S, sz * 0.09), collarC, 225);
        }
        break;
      }
      case 'twin-gem':
        paintFaceted(c, x - size * 0.45, y, size * 0.67, 'marquise', i);
        paintFaceted(c, x + size * 0.45, y, size * 0.67, 'diamond', i + 1);
        buf.blend(x - size * 0.45, y - size * 0.3, WHITE, 220);
        break;
      case 'crown': tinyCrown(c, x, y, size); break;
      case 'prism-ring': {
        const rr = size * 1.05;
        for (let q = 0; q < 6; q++) {
          const aa = a + (q / 6) * Math.PI * 2;
          paintFaceted(c, x + Math.cos(aa) * rr, y + Math.sin(aa) * rr * 0.65, size * 0.47, 'diamond', q);
        }
        buf.ring(x, y, rr * 0.82, Math.max(0.45 * S, size * 0.06), mixRgb(gem2, WHITE, 0.4), 160);
        break;
      }
      case 'petal-orbit':
        for (let q = 0; q < 6; q++) petal(c, x, y, size * 0.62, a + (q / 6) * Math.PI * 2, q % 2 ? gemC : mixRgb(gemC, gem2, 0.35));
        buf.disc(x, y, size * 0.24, WHITE, 230);
        break;
      case 'mini-moon': {
        orb(c, x, y, size * 0.9, mixRgb(gemC, WHITE, 0.12), gem2);
        buf.disc(x + size * 0.46, y - size * 0.16, size * 0.8, [9, 7, 18], 245);
        buf.ring(x, y, size * 0.95, Math.max(0.4 * S, size * 0.06), pal.haloC, 170);
        break;
      }
      case 'sigil': drawRune(c, x, y, size * 1.15, i); break;
      case 'gem-chain': {
        const rr = size * 0.62;
        buf.ring(x, y, rr, Math.max(0.55 * S, size * 0.12), collarC, 230);
        paintFaceted(c, x, y, size * 0.35, 'diamond', i);
        buf.disc(x + size * 0.72, y + size * 0.38, Math.max(0.45 * S, size * 0.12), pal.gem2, 240);
        break;
      }
      case 'constellation': {
        const starCount = 4;
        const pts: Array<[number, number]> = [];
        for (let q = 0; q < starCount; q++) {
          const aa = a + (q / starCount) * Math.PI * 2;
          pts.push([x + Math.cos(aa) * size * (0.35 + (q % 2) * 0.4), y + Math.sin(aa) * size * (0.35 + (q % 2) * 0.4)]);
        }
        for (let q = 0; q < pts.length; q++) {
          const [x0, y0] = pts[q], [x1, y1] = pts[(q + 1) % pts.length];
          line(x0, y0, x1, y1, 0.4 * S, 0.3 * S, mixRgb(gem2, WHITE, 0.45), gem2, WHITE, 150);
          buf.disc(x0, y0, Math.max(0.55 * S, size * 0.11), WHITE, 245);
        }
        buf.disc(x, y, Math.max(0.5 * S, size * 0.09), gemC, 225);
        break;
      }
      case 'orbit-diamonds': {
        paintFaceted(c, x, y, size * 0.86, 'diamond', i);
        for (let q = 0; q < 4; q++) {
          const aa = a + q * Math.PI / 2;
          buf.disc(x + Math.cos(aa) * size * 0.95, y + Math.sin(aa) * size * 0.95, Math.max(0.45 * S, size * 0.11), WHITE, 225);
        }
        break;
      }
      case 'hourglass': hourglass(c, x, y, size * 0.85); break;
      case 'snow-globe': {
        const gr = size * 0.92;
        buf.disc(x, y, gr, [203, 230, 255], 55);
        buf.ring(x, y, gr, Math.max(0.6 * S, size * 0.14), mixRgb([215, 235, 250], WHITE, 0.5), 240);
        // inner scene
        for (let t = 0; t < 2; t++) {
          const half = (t + 1) * gr * 0.12;
          line(x - size * 0.18 - half, y + gr * 0.22 - t * gr * 0.2, x - size * 0.18 + half, y + gr * 0.22 - t * gr * 0.2,
            gr * 0.05, gr * 0.035, [52, 132, 74], [30, 92, 48], [150, 215, 150], 235);
        }
        buf.disc(x - size * 0.18, y - gr * 0.04, gr * 0.05, [252, 220, 100], 240);
        buf.disc(x + size * 0.32, y + gr * 0.05, gr * 0.07, [255, 232, 148], 245);
        for (let q = 0; q < 6; q++) {
          const aa = a + q * 1.02;
          buf.blend(x + Math.cos(aa) * gr * 0.42, y + Math.sin(aa) * gr * 0.34, WHITE, 245);
        }
        break;
      }
      case 'butterfly-swarm': {
        const wingSpan = size * 0.72;
        for (const sd of [-1, 1]) {
          for (let py = Math.floor(y - size * 0.5); py <= y + size * 0.15; py++) {
            for (let px = Math.floor(x + sd * 0.05 * size); sd > 0 ? px <= x + sd * wingSpan : px >= x + sd * wingSpan; px++) {
              if (sd < 0 && px > x - 0.05 * size) continue;
              if (sd > 0 && px < x + 0.05 * size) continue;
              const nx = sd * (px - x) / wingSpan, ny = (py - y) / size;
              const span = 0.85 - ny * ny * 0.62;
              if (nx > span || ny > 0.12 - nx * 0.2) continue;
              let col = mixRgb(gemC, gem2, ny * 0.5 + 0.4);
              if (nx > span - 0.16) col = shadeRgb(col, -0.3);
              buf.set(px, py, col, 245);
            }
          }
        }
        line(x, y - size * 0.45, x, y + size * 0.45, size * 0.07, size * 0.045, pal.collarC, shadeRgb(pal.collarC, -0.2), WHITE, 230);
        buf.disc(x, y - size * 0.4, size * 0.07, WHITE, 220);
        for (const sd of [-1, 1]) line(x, y - size * 0.44, x + sd * size * 0.18, y - size * 0.75, 0.35 * S, 0.3 * S, pal.collarC, pal.collarC, WHITE, 200);
        break;
      }
      case 'prism-comet': {
        // bright head + tapering luminous tail, swept along the orbit direction
        const tx = x - Math.cos(a) * size * 1.4, ty = y - Math.sin(a) * size * 1.1;
        line(x, y, tx, ty, size * 0.3, size * 0.05, pal.gem2, pal.gemC, WHITE, 210);
        const perpX = -Math.sin(a), perpY = Math.cos(a);
        for (let q = 0; q < 4; q++) {
          const t2 = q / 4;
          line(x + (tx - x) * t2 - perpX * size * 0.06, y + (ty - y) * t2 - perpY * size * 0.06,
            x + (tx - x) * t2 + perpX * size * 0.06, y + (ty - y) * t2 + perpY * size * 0.06,
            0.45 * S, 0.25 * S, WHITE, mixRgb(gem2, WHITE, 0.5), WHITE, 145 - q * 30);
        }
        paintCrystal(c, x, y, size * 0.62, pal.gem2, WHITE);
        buf.disc(x, y, size * 0.2, WHITE, 245);
        break;
      }
      case 'pearl': {
        const rr = size * 0.85;
        for (let py = Math.floor(y - rr); py <= y + rr; py++) {
          for (let px = Math.floor(x - rr); px <= x + rr; px++) {
            const d = Math.hypot(px - x, py - y) / rr;
            if (d > 1) continue;
            let col = mixRgb([250, 246, 240], [214, 200, 182], d * d * 0.72);
            if (d < 0.55) col = mixRgb(col, gem2, 0.22);
            if ((px + py) % 2 === 0 && d > 0.35 && d < 0.7) col = shadeRgb(col, -0.05);
            if (d > 0.86) col = shadeRgb(col, -0.22);
            buf.set(px, py, col, 255);
          }
        }
        buf.blend(x - rr * 0.32, y - rr * 0.36, WHITE, 245);
        buf.blend(x - rr * 0.16, y - rr * 0.2, WHITE, 200);
        for (let q = 0; q < 5; q++) {
          const aa = a + (q / 5) * Math.PI * 2;
          buf.blend(x + Math.cos(aa) * rr * 1.3, y + Math.sin(aa) * rr * 1.3, gem2, 145);
        }
        break;
      }
      case 'comet-dust': {
        // chain of three diminishing star motes along orbit tangent
        for (let q = 0; q < 3; q++) {
          const aa = a - (q * 0.28);
          const px2 = headC[0] + Math.cos(aa) * orbitR, py2 = headC[1] + Math.sin(aa) * orbitR * 0.82;
          const sz = size * (0.68 - q * 0.16);
          buf.disc(px2, py2, Math.max(0.55 * S, sz), q === 0 ? WHITE : mixRgb(gem2, WHITE, 0.55), 240);
          buf.ring(px2, py2, size * (0.9 - q * 0.1), Math.max(0.35 * S, size * 0.05), mixRgb(pal.glowC, WHITE, 0.35), 150 - q * 25);
        }
        break;
      }
    }
  });
}