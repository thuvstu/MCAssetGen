/* Head gem — 15 archetypes + shared orb / crystal painters */
import { INK, RGB, WHITE, clamp01, mixRgb, shadeRgb, smoothstep } from '../color';
import type { RenderCtx } from './context';
import { paintFaceted } from './gems';

export function paintOrb(c: RenderCtx, cx: number, cy: number, r: number, c1: RGB, c2: RGB) {
  const { cfg, buf, rng, anim, S, geo, pal, edgeDarken } = c;
  const { LX, LY } = geo;
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) {
    for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const dx = x - cx, dy = y - cy;
      const d = Math.hypot(dx, dy) / r;
      if (d > 1) continue;
      const uu = r > 0 ? (dx * LX + dy * LY) / r : 0;
      let col: RGB = d < 0.55 ? mixRgb(mixRgb(c1, WHITE, 0.45), c1, smoothstep(0, 0.55, d)) : mixRgb(c1, pal.gemDark, smoothstep(0.55, 1, d));
      if (uu > 0.45) col = mixRgb(col, WHITE, 0.2 * smoothstep(0.45, 0.95, uu));
      if (cfg.innerStyle === 'core' && d < 0.34) col = mixRgb(WHITE, c2, (d / 0.34) * 0.65);
      else if (cfg.innerStyle === 'facet') {
        if (Math.abs(dx) < Math.max(1 * S, r * 0.06) || Math.abs(dy) < Math.max(1 * S, r * 0.06)) col = mixRgb(col, WHITE, 0.3);
        if ((dx > 0) !== (dy > 0)) col = shadeRgb(col, -0.1);
      } else if (cfg.innerStyle === 'swirl' && d < 0.9) {
        const a = Math.atan2(dy, dx) + anim.spinA;
        col = mixRgb(col, c2, (0.5 + 0.5 * Math.sin(a * 3 + d * 9 + cfg.seed * 0.01)) * 0.35 * (1 - d) * (anim.on && anim.type === 'spin-gem' ? 0.9 : 1));
      } else if (cfg.innerStyle === 'galaxy' && d < 0.85) {
        const a = Math.atan2(dy, dx) + anim.spinA * 0.7;
        col = mixRgb(col, c2, (0.5 + 0.5 * Math.sin(a * 2 + d * 6)) * 0.4 * (1 - d));
        if (rng() < 0.035) col = WHITE;
      }
      col = mixRgb(col, c2, cfg.gemGlow * 0.22 * (1 - d));
      if (d > 0.86) col = edgeDarken(col, 1);
      if (cfg.dither && (x + y) % 2 === 0 && d > 0.3 && d < 0.85 && rng() < 0.25) col = shadeRgb(col, -0.08);
      buf.set(x, y, col, 255);
    }
  }
  const hlR = r * 0.3;
  for (let y = Math.floor(cy - r * 0.62); y <= cy - r * 0.1; y++) {
    for (let x = Math.floor(cx - r * 0.6); x <= cx - r * 0.05; x++) {
      const dd = ((x - (cx - r * 0.32)) / hlR) ** 2 + ((y - (cy - r * 0.36)) / (hlR * 0.62)) ** 2;
      if (dd <= 1) buf.blend(x, y, WHITE, 235 * (1 - dd * 0.7));
    }
  }
  buf.blend(cx + r * 0.3, cy + r * 0.34, WHITE, 115);
  if (r > 8) buf.blend(cx + r * 0.3 + 1, cy + r * 0.34, WHITE, 70);
}

export function paintCrystal(c: RenderCtx, cx: number, cy: number, r: number, c1: RGB, c2: RGB, shear = 0) {
  const { cfg, buf, S, edgeDarken } = c;
  const w = r * 0.72, h = r * 1.18;
  for (let y = Math.floor(cy - h - 1); y <= cy + h + 1; y++) {
    for (let x = Math.floor(cx - w - 2); x <= cx + w + 2; x++) {
      const dx = x - cx - (y - cy) * shear, dy = y - cy;
      const m = Math.abs(dx) / w + Math.abs(dy) / h;
      if (m > 1) continue;
      let col: RGB = dx < -w * 0.08 ? shadeRgb(c1, -0.3 + 0.1 * (1 - m)) : dx > w * 0.08 ? shadeRgb(c1, 0.2) : mixRgb(c1, c2, 0.5);
      col = dy < 0 ? mixRgb(col, WHITE, 0.16 * (1 - m)) : shadeRgb(col, 0.12 * m);
      if (Math.abs(dx) < Math.max(0.8 * S, w * 0.09)) col = mixRgb(col, WHITE, 0.45);
      if (Math.abs(dy) < Math.max(0.8 * S, h * 0.05) && m < 0.8) col = shadeRgb(col, -0.12);
      if (m > 0.86) col = edgeDarken(col, 1);
      if (cfg.innerStyle === 'core' && m < 0.35) col = mixRgb(WHITE, c2, m);
      buf.set(x, y, col, 255);
    }
  }
  buf.blend(cx - w * 0.3, cy - h * 0.42, WHITE, 225);
}

export function drawHead(c: RenderCtx) {
  const { cfg, buf, geo, pal, rng, S, W, line, edgeDarken } = c;
  const [hx, hy] = geo.headC;
  const R = geo.headR;
  const { dir, perp } = geo;
  const { gemC, gem2, gemDark, collarC, haloC } = pal;

  switch (cfg.headShape) {
    case 'orb': paintOrb(c, hx, hy, R, gemC, gem2); break;
    case 'crystal': paintCrystal(c, hx, hy, R, gemC, gem2); break;
    case 'cluster':
      paintCrystal(c, hx - R * 0.72, hy + R * 0.4, R * 0.58, shadeRgb(gemC, -0.12), gem2, 0.16);
      paintCrystal(c, hx + R * 0.7, hy + R * 0.42, R * 0.52, shadeRgb(gemC, 0.08), gem2, -0.16);
      paintCrystal(c, hx, hy - R * 0.08, R * 0.95, gemC, gem2);
      break;
    case 'star':
      for (let y = Math.floor(hy - R - 1); y <= hy + R + 1; y++) {
        for (let x = Math.floor(hx - R - 1); x <= hx + R + 1; x++) {
          const dx = x - hx, dy = y - hy;
          const d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
          const rr = R * (0.46 + 0.54 * Math.pow(0.5 + 0.5 * Math.cos(5 * a - Math.PI / 2), 0.42));
          if (d > rr) continue;
          const edge = d / rr;
          let col = mixRgb(mixRgb(gemC, WHITE, 0.45), gemC, smoothstep(0, 0.6, edge));
          col = mixRgb(col, gem2, cfg.gemGlow * 0.25 * (1 - edge));
          if (d < R * 0.24) col = mixRgb(WHITE, gem2, 0.25);
          if (edge > 0.88) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      buf.blend(hx, hy, WHITE, 240);
      break;
    case 'crescent': {
      const cx2 = hx + R * 0.52, cy2 = hy - R * 0.26, r2 = R * 0.84;
      for (let y = Math.floor(hy - R - 1); y <= hy + R + 1; y++) {
        for (let x = Math.floor(hx - R - 1); x <= hx + R + 1; x++) {
          const d1 = Math.hypot(x - hx, y - hy) / R, d2 = Math.hypot(x - cx2, y - cy2) / r2;
          if (d1 > 1 || d2 < 1) continue;
          let col = mixRgb(mixRgb(gemC, WHITE, 0.28), gemC, d1 * 0.7);
          if (d2 < 1.18) col = mixRgb(col, gem2, 0.55 * (1 - (d2 - 1) / 0.18));
          if (d1 > 0.9) col = edgeDarken(col, 0.9);
          buf.set(x, y, col, 255);
        }
      }
      buf.disc(hx - R * 0.35, hy + R * 0.1, R * 0.12, shadeRgb(gemC, -0.25));
      buf.disc(hx - R * 0.15, hy - R * 0.4, R * 0.08, shadeRgb(gemC, -0.2));
      const sx = hx + R * 0.72, sy = hy - R * 0.1;
      buf.blend(sx, sy, WHITE, 255);
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) buf.blend(sx + ox, sy + oy, gem2, 205);
      break;
    }
    case 'eye': {
      const rx = R, ry = R * 0.72;
      const sclera = mixRgb(WHITE, gem2, 0.25);
      for (let y = Math.floor(hy - ry - 1); y <= hy + ry + 1; y++) {
        for (let x = Math.floor(hx - rx - 1); x <= hx + rx + 1; x++) {
          const dd = ((x - hx) / rx) ** 2 + ((y - hy) / ry) ** 2;
          if (dd > 1) continue;
          let col = sclera;
          const irisD = Math.hypot(x - hx, y - hy) / (R * 0.52);
          if (irisD <= 1) {
            col = mixRgb(mixRgb(gem2, WHITE, 0.2), gemC, smoothstep(0, 1, irisD));
            const pupD = Math.hypot(x - hx, y - hy) / (R * 0.26);
            if (pupD <= 1) col = pupD < 0.6 ? INK : mixRgb(INK, gemC, 0.3);
          }
          if (dd > 0.86) col = edgeDarken(col, 0.8);
          buf.set(x, y, col, 255);
        }
      }
      buf.blend(hx - R * 0.12, hy - R * 0.12, WHITE, 245);
      const lw = Math.max(0.8 * S, W * 0.012);
      line(hx - rx * 0.9, hy - ry * 0.55, hx + rx * 0.9, hy - ry * 0.55, lw, lw, collarC, shadeRgb(collarC, -0.3), shadeRgb(collarC, 0.5));
      break;
    }
    case 'diamond':
      for (let y = Math.floor(hy - R - 1); y <= hy + R + 1; y++) {
        for (let x = Math.floor(hx - R - 1); x <= hx + R + 1; x++) {
          const m = (Math.abs(x - hx) + Math.abs(y - hy)) / R;
          if (m > 1) continue;
          let col: RGB = y < hy - R * 0.1 ? mixRgb(shadeRgb(gemC, 0.4), gemC, m) : y > hy + R * 0.1 ? mixRgb(gemC, gemDark, m * 0.8) : x < hx ? shadeRgb(gemC, -0.14) : shadeRgb(gemC, 0.14);
          col = mixRgb(col, gem2, cfg.gemGlow * 0.18 * (1 - m));
          const table = (Math.abs(x - hx) + Math.abs(y - hy + R * 0.35)) / (R * 0.4);
          if (table < 1 && y < hy) col = mixRgb(WHITE, gem2, 0.35);
          if (m > 0.88) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      buf.blend(hx - R * 0.18, hy - R * 0.3, WHITE, 235);
      break;
    case 'bloom':
      for (let p = 0; p < 6; p++) {
        const a = (p / 6) * Math.PI * 2 - Math.PI / 2;
        const px = hx + Math.cos(a) * R * 0.52, py = hy + Math.sin(a) * R * 0.52, prr = R * 0.4;
        for (let y = Math.floor(py - prr - 1); y <= py + prr + 1; y++) {
          for (let x = Math.floor(px - prr - 1); x <= px + prr + 1; x++) {
            const d = Math.hypot(x - px, y - py) / prr;
            if (d > 1) continue;
            let col = mixRgb(mixRgb(gemC, WHITE, 0.22), gemC, d * 0.7);
            if (d > 0.82) col = edgeDarken(col, 0.8);
            buf.set(x, y, col, 255);
          }
        }
        line(hx, hy, px, py, 0.6 * S, 0.4 * S, mixRgb(gemC, WHITE, 0.45), gemC, WHITE);
      }
      for (let y = Math.floor(hy - R * 0.36); y <= hy + R * 0.36; y++) {
        for (let x = Math.floor(hx - R * 0.36); x <= hx + R * 0.36; x++) {
          const d = Math.hypot(x - hx, y - hy) / (R * 0.36);
          if (d > 1) continue;
          let col = mixRgb(mixRgb(gem2, WHITE, 0.32), gem2, d * 0.6);
          if (rng() < 0.1) col = shadeRgb(col, -0.3);
          buf.set(x, y, col, 255);
        }
      }
      buf.blend(hx - 1, hy - 1, WHITE, 205);
      break;
    case 'skull': {
      const cr = R * 0.8, ccx = hx, ccy = hy - R * 0.14;
      const bone = mixRgb([232, 228, 216], gemC, 0.12);
      for (let y = Math.floor(hy - R - 1); y <= hy + R + 1; y++) {
        for (let x = Math.floor(hx - R - 1); x <= hx + R + 1; x++) {
          const dc = Math.hypot(x - ccx, y - ccy) / cr;
          const inJaw = Math.abs(x - hx) < R * 0.5 && y >= hy - R * 0.1 && y <= hy + R * 0.78;
          if (dc > 1 && !inJaw) continue;
          let col = mixRgb(shadeRgb(bone, 0.16), shadeRgb(bone, -0.18), clamp01((y - (hy - R)) / (2 * R)));
          if (dc > 0.88 && !inJaw) col = edgeDarken(col, 0.7);
          buf.set(x, y, col, 255);
        }
      }
      for (const s of [-1, 1]) {
        const ex = hx + s * R * 0.32, ey = hy - R * 0.08;
        buf.disc(ex, ey, R * 0.21, INK);
        buf.disc(ex, ey, R * 0.11, gemC);
        buf.blend(ex, ey, gem2, 205);
        buf.blend(ex - 1, ey - 1, WHITE, 165);
      }
      buf.set(hx, hy + R * 0.28, INK); buf.set(hx - 1, hy + R * 0.36, INK); buf.set(hx + 1, hy + R * 0.36, INK);
      for (let i = -2; i <= 2; i++) {
        const tx = hx + i * Math.max(1.4 * S, R * 0.16);
        for (let yy = hy + R * 0.46; yy <= hy + R * 0.66; yy += 1) buf.blend(tx, yy, [90, 80, 70], 165);
      }
      const fg = R * 0.14;
      for (let y = Math.floor(hy - R * 0.62 - fg); y <= hy - R * 0.62 + fg; y++)
        for (let x = Math.floor(hx - fg); x <= hx + fg; x++)
          if (Math.abs(x - hx) + Math.abs(y - (hy - R * 0.62)) <= fg) buf.set(x, y, gem2, 255);
      break;
    }
    case 'rune-cube': {
      const s = R * 0.95, th = s * 0.42;
      for (let y = Math.floor(hy - s / 2); y <= hy + s / 2; y++)
        for (let x = Math.floor(hx - s / 2); x <= hx + s / 2; x++)
          buf.set(x, y, mixRgb(shadeRgb(gemC, 0.12), shadeRgb(gemC, -0.18), clamp01((y - (hy - s / 2)) / s)), 255);
      for (let y = 0; y < th; y++) for (let x = 0; x < s; x++) buf.set(hx - s / 2 + x + y * 0.5, hy - s / 2 - th + y, mixRgb(shadeRgb(gemC, 0.38), WHITE, 0.14), 255);
      for (let y = 0; y < s; y++) for (let x2 = 0; x2 < th * 0.5; x2++) buf.set(hx + s / 2 + x2, hy - s / 2 + y + x2 * 0.4, shadeRgb(gemC, -0.34), 255);
      for (let x = Math.floor(hx - s / 2); x <= hx + s / 2; x++) { buf.set(x, Math.round(hy - s / 2), collarC, 255); buf.set(x, Math.round(hy + s / 2), shadeRgb(collarC, -0.25), 255); }
      for (let y = Math.floor(hy - s / 2); y <= hy + s / 2; y++) { buf.set(Math.round(hx - s / 2), y, collarC, 255); buf.set(Math.round(hx + s / 2), y, shadeRgb(collarC, -0.25), 255); }
      const rc = mixRgb(gem2, WHITE, 0.45);
      line(hx, hy - s * 0.3, hx, hy + s * 0.3, 1 * S, 1 * S, rc, rc, WHITE);
      line(hx - s * 0.25, hy - s * 0.1, hx, hy - s * 0.28, 0.9 * S, 0.9 * S, rc, rc, WHITE);
      line(hx, hy - s * 0.05, hx + s * 0.25, hy - s * 0.22, 0.9 * S, 0.9 * S, rc, rc, WHITE);
      line(hx - s * 0.22, hy + s * 0.18, hx + s * 0.22, hy + s * 0.18, 0.9 * S, 0.9 * S, rc, rc, WHITE);
      buf.disc(hx, hy + s * 0.18, 1.2 * S, WHITE);
      break;
    }
    case 'teardrop': {
      const tipY = hy - R * 1.08, bcY = hy + R * 0.3, br = R * 0.72;
      for (let y = Math.floor(tipY - 1); y <= bcY + br + 1; y++) {
        for (let x = Math.floor(hx - br - 2); x <= hx + br + 2; x++) {
          let inside = false;
          if (y >= bcY - br * 0.4) inside = Math.hypot(x - hx, y - bcY) <= br;
          else { const f = (y - tipY) / ((bcY - br * 0.4) - tipY); inside = Math.abs(x - hx) <= Math.max(0.5, f * br * 0.95); }
          if (!inside) continue;
          const vf = (y - tipY) / ((bcY + br) - tipY);
          let col = mixRgb(mixRgb(gem2, WHITE, 0.32), gemC, smoothstep(0, 0.75, vf));
          col = x < hx ? shadeRgb(col, 0.08) : shadeRgb(col, -0.1);
          if (Math.abs(x - hx) > br * 0.8 && y > bcY) col = edgeDarken(col, 0.6);
          buf.set(x, y, col, 255);
        }
      }
      line(hx - br * 0.3, tipY + R * 0.25, hx - br * 0.35, bcY + R * 0.1, 1 * S, 1.2 * S, WHITE, WHITE, WHITE);
      buf.blend(hx - br * 0.3, bcY - 1, WHITE, 185);
      break;
    }
    case 'prism': {
      const w = R * 0.58, h = R * 1.28;
      for (let y = Math.floor(hy - h - 1); y <= hy + h + 1; y++) {
        for (let x = Math.floor(hx - w - 1); x <= hx + w + 1; x++) {
          const dx = x - hx, dy = y - hy;
          const m = Math.abs(dx) / w + Math.abs(dy) / h;
          if (m > 1) continue;
          let col = mixRgb(gemC, gem2, ((dy + h) / (2 * h)) * 0.75);
          col = dx < -w * 0.25 ? shadeRgb(col, -0.3) : dx > w * 0.25 ? shadeRgb(col, 0.25) : mixRgb(col, WHITE, 0.18);
          if (Math.abs(dx - dy * 0.35) < Math.max(0.8 * S, w * 0.12)) col = mixRgb(col, WHITE, 0.5);
          if (m > 0.88) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      break;
    }
    case 'lantern': {
      const lw = R * 0.72, lh = R * 0.92;
      buf.ring(hx, hy - lh * 0.72, lw * 0.42, Math.max(0.8 * S, W * 0.012), collarC, 255);
      for (let x = Math.floor(hx - lw * 0.8); x <= hx + lw * 0.8; x++) { buf.set(x, hy - lh * 0.62, collarC, 255); buf.set(x, hy - lh * 0.66, shadeRgb(collarC, 0.4), 255); }
      for (let y = Math.floor(hy - lh * 0.6); y <= hy + lh * 0.72; y++) {
        for (let x = Math.floor(hx - lw); x <= hx + lw; x++) {
          const fx = Math.abs(x - hx) / lw;
          const taper = 0.35 + 0.65 * clamp01((y - (hy - lh * 0.6)) / (lh * 1.32));
          if (fx > taper) continue;
          let col = mixRgb(mixRgb(gemC, WHITE, 0.35), gemDark, clamp01(fx * 1.2));
          if (fx < 0.3) col = mixRgb(col, WHITE, 0.3);
          const fd = Math.hypot(x - hx, y - (hy + lh * 0.15)) / (lh * 0.42);
          if (fd < 1) col = mixRgb(col, mixRgb(gem2, WHITE, 0.4), (1 - fd) * 0.8);
          if (fx > taper - 0.12) col = shadeRgb(col, -0.3);
          buf.set(x, y, col, 255);
        }
      }
      for (let y = Math.floor(hy - lh * 0.6); y <= hy + lh * 0.72; y++) { buf.set(hx - lw * 0.5, y, shadeRgb(collarC, -0.25), 255); buf.set(hx + lw * 0.5, y, shadeRgb(collarC, -0.25), 255); }
      for (let x = Math.floor(hx - lw); x <= hx + lw; x++) { buf.set(x, hy + lh * 0.72, collarC, 255); buf.set(x, hy + lh * 0.76, shadeRgb(collarC, -0.3), 255); }
      buf.blend(hx - lw * 0.45, hy - lh * 0.35, WHITE, 150);
      break;
    }
    case 'anvil': {
      const aw = R * 1.05, ah = R * 0.6;
      for (let y = Math.floor(hy - ah); y <= hy + ah; y++) {
        for (let x = Math.floor(hx - aw); x <= hx + aw; x++) {
          const dx = Math.abs(x - hx) / aw, dy = (y - hy) / ah;
          const inside = y < hy - ah * 0.25 ? dx < 0.95 : y < hy + ah * 0.25 ? dx < 0.42 : dx < 0.8;
          if (!inside) continue;
          let col = mixRgb(shadeRgb(gemC, 0.2), shadeRgb(gemC, -0.25), clamp01((dy + 1) / 2));
          if (y < hy - ah * 0.25 && dx > 0.6 && dx < 0.9) col = mixRgb(col, collarC, 0.6);
          if (Math.abs(dx) < 0.3 && y < hy) col = mixRgb(col, WHITE, 0.2);
          buf.set(x, y, col, 255);
        }
      }
      const rc = mixRgb(gem2, WHITE, 0.5);
      line(hx - aw * 0.35, hy - ah * 0.45, hx + aw * 0.35, hy - ah * 0.45, 1 * S, 1 * S, rc, rc, WHITE);
      line(hx - aw * 0.2, hy - ah * 0.45, hx, hy - ah * 0.15, 0.9 * S, 0.9 * S, rc, rc, WHITE);
      line(hx + aw * 0.2, hy - ah * 0.45, hx, hy - ah * 0.15, 0.9 * S, 0.9 * S, rc, rc, WHITE);
      buf.disc(hx, hy - ah * 0.15, 1.2 * S, WHITE);
      break;
    }
    case 'moonlet': {
      const mr = R * 0.78;
      paintOrb(c, hx, hy, mr, mixRgb(gemC, WHITE, 0.1), gem2);
      for (let i = 0; i < 5; i++) {
        const a = rng() * Math.PI * 2, d = rng() * mr * 0.65, cr = mr * (0.1 + rng() * 0.13);
        const ccx = hx + Math.cos(a) * d, ccy = hy + Math.sin(a) * d;
        for (let y = Math.floor(ccy - cr); y <= ccy + cr; y++)
          for (let x = Math.floor(ccx - cr); x <= ccx + cr; x++)
            if (Math.hypot(x - ccx, y - ccy) <= cr) buf.set(x, y, shadeRgb(gemC, -0.22), 255);
      }
      const rw = Math.max(0.8 * S, W * 0.014);
      buf.ring(hx, hy, mr * 1.42, rw, haloC, 220);
      buf.ring(hx, hy, mr * 1.42, rw, WHITE, 60);
      break;
    }
    case 'hourglass': {
      const hw = R * 0.72, hh = R;
      // frame caps
      for (let x = Math.floor(hx - hw); x <= hx + hw; x++) {
        buf.set(x, hy - hh, collarC, 255); buf.set(x, hy - hh + 1, shadeRgb(collarC, 0.35), 255);
        buf.set(x, hy + hh, shadeRgb(collarC, -0.25), 255); buf.set(x, hy + hh - 1, collarC, 255);
      }
      // glass bulbs (two opposing cones)
      for (let y = Math.floor(hy - hh + 2); y <= hy + hh - 2; y++) {
        const f = (y - hy) / hh;                       // -1..1
        const waist = Math.abs(f);                     // 0 at middle
        const halfW = hw * (0.12 + 0.88 * waist);
        for (let x = Math.floor(hx - halfW); x <= hx + halfW; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, halfW);
          let col = mixRgb(mixRgb(gemC, WHITE, 0.4), gemDark, e * 0.9);
          // upper bulb empties, lower fills
          const filled = f > 0 ? (1 - f) < 0.75 : f < -0.55;
          if (filled) col = mixRgb(col, gem2, 0.75);
          if (e > 0.84) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      // falling sand thread
      for (let y = Math.floor(hy); y <= hy + hh * 0.7; y++) buf.blend(hx, y, mixRgb(gem2, WHITE, 0.5), 225);
      buf.blend(hx - hw * 0.4, hy - hh * 0.55, WHITE, 215);
      break;
    }
    case 'tome': {
      const bw = R * 0.92, bh = R * 1.05;
      // covers
      for (let y = Math.floor(hy - bh); y <= hy + bh; y++) {
        for (let x = Math.floor(hx - bw); x <= hx + bw; x++) {
          const ex = Math.abs(x - hx) / bw, ey = Math.abs(y - hy) / bh;
          if (ex > 1 || ey > 1) continue;
          let col = mixRgb(shadeRgb(gemC, 0.12), shadeRgb(gemC, -0.3), ey * 0.8 + ex * 0.2);
          if (ex > 0.86 || ey > 0.88) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      // pages block on the right
      for (let y = Math.floor(hy - bh * 0.82); y <= hy + bh * 0.82; y++) {
        for (let x = Math.floor(hx + bw * 0.18); x <= hx + bw * 0.92; x++) {
          const pf = (x - (hx + bw * 0.18)) / (bw * 0.74);
          buf.set(x, y, mixRgb([248, 244, 232], [190, 180, 160], pf * 0.8 + (Math.round(y) % 2 ? 0.12 : 0)), 255);
        }
      }
      // spine + clasp
      for (let y = Math.floor(hy - bh); y <= hy + bh; y++) buf.set(hx - bw * 0.72, y, collarC, 255);
      buf.disc(hx + bw * 0.55, hy, Math.max(1 * S, R * 0.14), mixRgb(gem2, WHITE, 0.3));
      // glowing sigil on cover
      const sg = mixRgb(gem2, WHITE, 0.55);
      line(hx - bw * 0.42, hy - bh * 0.3, hx - bw * 0.42, hy + bh * 0.3, 0.8 * S, 0.8 * S, sg, sg, WHITE);
      line(hx - bw * 0.6, hy, hx - bw * 0.24, hy, 0.8 * S, 0.8 * S, sg, sg, WHITE);
      break;
    }
    case 'chalice': {
      const cw = R * 0.85;
      // bowl
      for (let y = Math.floor(hy - R * 0.9); y <= hy + R * 0.1; y++) {
        const f = (y - (hy - R * 0.9)) / R;
        const halfW = cw * (1 - f * 0.55);
        for (let x = Math.floor(hx - halfW); x <= hx + halfW; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, halfW);
          let col = mixRgb(shadeRgb(collarC, 0.35), shadeRgb(collarC, -0.35), e * 0.9);
          if (e > 0.85) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      // liquid surface
      for (let x = Math.floor(hx - cw * 0.86); x <= hx + cw * 0.86; x++) {
        const e = Math.abs(x - hx) / (cw * 0.86);
        buf.set(x, hy - R * 0.78, mixRgb(gem2, gemC, e * 0.7), 255);
        buf.set(x, hy - R * 0.72, mixRgb(gemC, gemDark, e * 0.5), 255);
      }
      // stem + foot
      for (let y = Math.floor(hy + R * 0.1); y <= hy + R * 0.7; y++)
        for (let x = Math.floor(hx - R * 0.14); x <= hx + R * 0.14; x++)
          buf.set(x, y, x < hx ? shadeRgb(collarC, -0.2) : collarC, 255);
      buf.disc(hx, hy + R * 0.35, R * 0.2, mixRgb(gemC, WHITE, 0.25));
      for (let x = Math.floor(hx - cw * 0.7); x <= hx + cw * 0.7; x++) {
        buf.set(x, hy + R * 0.72, collarC, 255);
        buf.set(x, hy + R * 0.78, shadeRgb(collarC, -0.3), 255);
      }
      buf.blend(hx - cw * 0.45, hy - R * 0.6, WHITE, 205);
      break;
    }
    case 'feather': {
      const fl = R * 1.25, fw = R * 0.5;
      // shaft (rachis)
      line(hx, hy + fl * 0.8, hx, hy - fl * 0.9, 0.9 * S, 0.5 * S, mixRgb(gemC, WHITE, 0.35), gemC, WHITE);
      // barbs
      for (let i = 0; i < 16; i++) {
        const f = i / 16;
        const y = hy + fl * 0.7 - f * fl * 1.5;
        const spread = fw * Math.sin(f * Math.PI) * 1.1;
        for (const sd of [-1, 1]) {
          const tipX = hx + sd * spread, tipY = y - spread * 0.35;
          const col = mixRgb(shadeRgb(gemC, sd > 0 ? 0.22 : -0.18), gem2, f * 0.5);
          line(hx, y, tipX, tipY, 0.7 * S, 0.4 * S, col, shadeRgb(col, -0.25), mixRgb(col, WHITE, 0.4), 250);
        }
      }
      buf.blend(hx - fw * 0.3, hy - fl * 0.4, WHITE, 190);
      break;
    }
    case 'ankh': {
      const aw = Math.max(0.9 * S, R * 0.17);
      // loop
      buf.ring(hx, hy - R * 0.46, R * 0.42, aw, collarC, 255);
      buf.ring(hx - R * 0.1, hy - R * 0.56, R * 0.42, aw * 0.5, mixRgb(collarC, WHITE, 0.5), 150);
      // vertical + crossbar
      for (let y = Math.floor(hy - R * 0.05); y <= hy + R * 0.95; y++)
        for (let x = Math.floor(hx - aw); x <= hx + aw; x++)
          buf.set(x, y, x < hx ? shadeRgb(collarC, -0.25) : x > hx + aw * 0.4 ? shadeRgb(collarC, 0.45) : collarC, 255);
      for (let x = Math.floor(hx - R * 0.62); x <= hx + R * 0.62; x++)
        for (let y = Math.floor(hy + R * 0.12 - aw); y <= hy + R * 0.12 + aw; y++)
          buf.set(x, y, y < hy + R * 0.12 ? shadeRgb(collarC, 0.35) : shadeRgb(collarC, -0.25), 255);
      buf.disc(hx, hy - R * 0.46, R * 0.18, mixRgb(gemC, WHITE, 0.3));
      break;
    }
    case 'spiral-shell': {
      const turns = 2.6, steps = 74;
      for (let i = steps; i >= 0; i--) {
        const f = i / steps;
        const a = f * Math.PI * 2 * turns;
        const rad = R * 0.95 * f;
        const px = hx + Math.cos(a) * rad * 0.92, py = hy + Math.sin(a) * rad;
        const w = Math.max(0.9 * S, R * 0.3 * f);
        const col = mixRgb(mixRgb(gemC, WHITE, 0.45 * (1 - f)), gem2, f * 0.5);
        buf.disc(px, py, w, col);
        buf.blend(px - w * 0.35, py - w * 0.35, WHITE, 90);
      }
      buf.disc(hx, hy, Math.max(1 * S, R * 0.13), mixRgb(gem2, WHITE, 0.55));
      break;
    }
    case 'tesseract': {
      const o = R * 0.82, i2 = R * 0.44;
      const rect = (half: number, col: RGB, a = 255) => {
        for (let x = Math.floor(hx - half); x <= hx + half; x++) { buf.set(x, hy - half, col, a); buf.set(x, hy + half, shadeRgb(col, -0.3), a); }
        for (let y = Math.floor(hy - half); y <= hy + half; y++) { buf.set(hx - half, y, col, a); buf.set(hx + half, y, shadeRgb(col, -0.3), a); }
      };
      // inner volume glow
      for (let y = Math.floor(hy - o); y <= hy + o; y++)
        for (let x = Math.floor(hx - o); x <= hx + o; x++) {
          if (Math.abs(x - hx) > o || Math.abs(y - hy) > o) continue;
          const d = Math.max(Math.abs(x - hx), Math.abs(y - hy)) / o;
          buf.blend(x, y, mixRgb(gem2, gemC, d), 90 + 80 * (1 - d));
        }
      rect(o, mixRgb(collarC, WHITE, 0.25));
      rect(i2, mixRgb(gem2, WHITE, 0.45));
      // connecting edges
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const)
        line(hx + sx * o, hy + sy * o, hx + sx * i2, hy + sy * i2, 0.7 * S, 0.7 * S, mixRgb(gemC, WHITE, 0.5), gemC, WHITE, 235);
      break;
    }
    case 'dragon-egg': {
      const ew = R * 0.78, eh = R * 1.02;
      for (let y = Math.floor(hy - eh); y <= hy + eh; y++) {
        for (let x = Math.floor(hx - ew); x <= hx + ew; x++) {
          const fy = (y - hy) / eh;
          const taper = Math.sqrt(Math.max(0, 1 - fy * fy)) * (fy < 0 ? 0.82 : 1);
          const halfW = ew * taper;
          if (Math.abs(x - hx) > halfW) continue;
          const e = Math.abs(x - hx) / Math.max(0.5, halfW);
          let col = mixRgb(mixRgb(gemC, WHITE, 0.3), gemDark, e * 0.75 + (fy + 1) * 0.12);
          // scale pattern
          const sc = Math.sin((x - hx) * 1.3) + Math.sin((y - hy) * 1.5);
          if (sc > 0.9) col = mixRgb(col, gem2, 0.4);
          if (e > 0.85) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      // hairline cracks leaking light
      line(hx + ew * 0.1, hy - eh * 0.4, hx - ew * 0.25, hy + eh * 0.15, 0.7 * S, 0.5 * S, mixRgb(gem2, WHITE, 0.7), gem2, WHITE, 230);
      line(hx - ew * 0.25, hy + eh * 0.15, hx + ew * 0.2, hy + eh * 0.55, 0.6 * S, 0.4 * S, mixRgb(gem2, WHITE, 0.6), gem2, WHITE, 200);
      buf.blend(hx - ew * 0.36, hy - eh * 0.42, WHITE, 215);
      break;
    }
    case 'compass': {
      const cr = R * 0.9;
      // brass case
      for (let y = Math.floor(hy - cr); y <= hy + cr; y++)
        for (let x = Math.floor(hx - cr); x <= hx + cr; x++) {
          const d = Math.hypot(x - hx, y - hy) / cr;
          if (d > 1) continue;
          let col = d > 0.82
            ? mixRgb(shadeRgb(collarC, 0.4), shadeRgb(collarC, -0.35), (x - hx + cr) / (2 * cr))
            : mixRgb(mixRgb(gemC, WHITE, 0.55), gemC, d);
          if (d > 0.95) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      // cardinal ticks
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r0 = cr * 0.62, r1 = cr * (i % 2 === 0 ? 0.78 : 0.72);
        line(hx + Math.cos(a) * r0, hy + Math.sin(a) * r0, hx + Math.cos(a) * r1, hy + Math.sin(a) * r1,
          0.6 * S, 0.5 * S, shadeRgb(collarC, -0.4), shadeRgb(collarC, -0.5), collarC, 230);
      }
      // needle
      const na = -Math.PI / 4 + cfg.seed * 0.01;
      line(hx - Math.cos(na) * cr * 0.5, hy - Math.sin(na) * cr * 0.5, hx + Math.cos(na) * cr * 0.55, hy + Math.sin(na) * cr * 0.55,
        R * 0.1, 0.4 * S, [220, 60, 60], [150, 30, 30], [255, 140, 140]);
      buf.disc(hx, hy, Math.max(0.9 * S, R * 0.1), mixRgb(collarC, WHITE, 0.5));
      buf.blend(hx - cr * 0.35, hy - cr * 0.4, WHITE, 180);
      break;
    }
    case 'heart': {
      const hs = R * 0.95;
      for (let y = Math.floor(hy - hs); y <= hy + hs * 1.15; y++) {
        for (let x = Math.floor(hx - hs); x <= hx + hs; x++) {
          const nx = (x - hx) / hs;
          const my = -((y - hy) / hs - 0.18);   // flip Y (screen→math) and recentre
          // implicit heart: (x² + y² − 1)³ − x²·y³ ≤ 0
          const v = Math.pow(nx * nx + my * my - 0.5, 3) - nx * nx * my * my * my;
          if (v > 0) continue;
          const ny = (y - hy) / hs;
          const d = Math.hypot(nx, ny);
          let col = mixRgb(mixRgb(gemC, WHITE, 0.42), gemC, Math.min(1, d * 1.2));
          col = mixRgb(col, gem2, cfg.gemGlow * 0.25 * (1 - Math.min(1, d)));
          if (d > 0.72) col = edgeDarken(col, 0.9);
          buf.set(x, y, col, 255);
        }
      }
      buf.blend(hx - hs * 0.38, hy - hs * 0.3, WHITE, 240);
      buf.blend(hx - hs * 0.3, hy - hs * 0.22, WHITE, 160);
      break;
    }
    case 'lotus': {
      // Three tiers of sculpted petals, each with a lit ridge and a gold seed-heart.
      for (let tier = 2; tier >= 0; tier--) {
        const petals = tier === 0 ? 8 : 6;
        const pr = R * (tier === 0 ? 0.48 : tier === 1 ? 0.38 : 0.3);
        const orbit = R * (tier === 0 ? 0.43 : tier === 1 ? 0.29 : 0.14);
        for (let i = 0; i < petals; i++) {
          const a = (i / petals) * Math.PI * 2 - Math.PI / 2 + tier * 0.24;
          const px = hx + Math.cos(a) * orbit, py = hy + Math.sin(a) * orbit;
          const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
          for (let y = Math.floor(py - pr); y <= py + pr; y++) {
            for (let x = Math.floor(px - pr); x <= px + pr; x++) {
              const dx = x - px, dy = y - py, along = dx * ux + dy * uy, across = dx * vx + dy * vy;
              const t = Math.max(0, Math.min(1, (along + pr * 0.5) / (pr * 1.45)));
              const half = pr * 0.5 * Math.sin(Math.PI * t);
              if (along < -pr * 0.5 || along > pr * 0.9 || Math.abs(across) > half) continue;
              const shade = across < 0 ? 0.35 : -0.18;
              let col = shadeRgb(mixRgb(gemC, gem2, tier * 0.24), shade);
              if (Math.abs(across) < half * 0.13) col = mixRgb(col, WHITE, 0.35);
              if (t < 0.18) col = edgeDarken(col, 0.7);
              buf.set(x, y, col, 255);
            }
          }
          line(hx, hy, px + ux * pr * 0.5, py + uy * pr * 0.5, 0.48 * S, 0.28 * S, mixRgb(gem2, WHITE, 0.32), gemC, WHITE, 145);
        }
      }
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        buf.disc(hx + Math.cos(a) * R * 0.17, hy + Math.sin(a) * R * 0.17, R * 0.065, mixRgb(gem2, WHITE, 0.4), 250);
      }
      buf.disc(hx, hy, R * 0.22, mixRgb(collarC, WHITE, 0.3), 255);
      buf.disc(hx, hy, R * 0.13, WHITE, 240);
      break;
    }
    case 'portal': {
      const pr = R * 0.86;
      // dark glass, concentric rune gates, and a spiral event horizon
      buf.disc(hx, hy, pr, [10, 6, 24], 250);
      buf.ring(hx, hy, pr * 0.95, Math.max(1 * S, R * 0.08), collarC, 250);
      buf.ring(hx, hy, pr * 0.79, Math.max(0.65 * S, R * 0.045), mixRgb(gem2, WHITE, 0.28), 220);
      buf.ring(hx, hy, pr * 0.55, Math.max(0.6 * S, R * 0.04), gemC, 185);
      for (let i = 0; i < 5; i++) {
        const t = i / 5, a = t * Math.PI * 4.5 + cfg.seed * 0.01;
        const d = pr * (0.54 - t * 0.43);
        buf.blend(hx + Math.cos(a) * d, hy + Math.sin(a) * d, mixRgb(gem2, WHITE, 0.5), 215);
      }
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const x = hx + Math.cos(a) * pr * 1.08, y = hy + Math.sin(a) * pr * 1.08;
        buf.disc(x, y, Math.max(0.55 * S, R * 0.055), i % 3 === 0 ? WHITE : collarC, 240);
      }
      buf.blend(hx - pr * 0.25, hy - pr * 0.38, WHITE, 220);
      break;
    }
    case 'meteor': {
      // Faceted meteor body with a swept, molten tail pointing down-left.
      const tailX = hx - dir[0] * R * 1.5 - perp[0] * R * 0.4;
      const tailY = hy - dir[1] * R * 1.5 - perp[1] * R * 0.4;
      for (let i = 0; i < 8; i++) {
        const t = i / 8;
        const x = hx + (tailX - hx) * t, y = hy + (tailY - hy) * t;
        const w = R * (0.55 * (1 - t) + 0.04);
        line(x - perp[0] * w, y - perp[1] * w, x + perp[0] * w, y + perp[1] * w,
          0.65 * S, 0.45 * S, mixRgb(gem2, gemC, t), shadeRgb(gemC, -0.25), WHITE, 225 * (1 - t * 0.65));
      }
      paintCrystal(c, hx, hy, R * 0.76, gemC, gem2, 0.12);
      for (let i = 0; i < 5; i++) {
        const a = cfg.seed * 0.01 + i * 2.4;
        buf.disc(hx + Math.cos(a) * R * 0.8, hy + Math.sin(a) * R * 0.8, Math.max(0.55 * S, R * 0.055), WHITE, 225);
      }
      break;
    }
    case 'keyhole': {
      const cr = R * 0.62;
      // antique keyhole medallion and long tapered ward
      buf.disc(hx, hy - R * 0.25, cr, collarC, 255);
      buf.disc(hx, hy - R * 0.25, cr * 0.72, mixRgb(gemC, WHITE, 0.12), 255);
      buf.ring(hx, hy - R * 0.25, cr * 0.85, Math.max(0.7 * S, R * 0.05), mixRgb(collarC, WHITE, 0.42), 230);
      for (let y = Math.floor(hy + R * 0.2); y <= hy + R * 1.12; y++) {
        const t = (y - (hy + R * 0.2)) / (R * 0.92);
        const half = R * 0.29 * (1 - t * 0.66);
        for (let x = Math.floor(hx - half); x <= hx + half; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, half);
          let col = mixRgb(shadeRgb(collarC, 0.35), shadeRgb(collarC, -0.3), e);
          if (e > 0.8) col = edgeDarken(col, 0.8);
          buf.set(x, y, col, 255);
        }
      }
      buf.disc(hx, hy - R * 0.25, cr * 0.2, [16, 10, 22], 255);
      buf.disc(hx, hy - R * 0.25, cr * 0.1, gem2, 255);
      line(hx - R * 0.16, hy + R * 0.65, hx + R * 0.16, hy + R * 0.65, 0.6 * S, 0.4 * S, WHITE, collarC, WHITE, 200);
      break;
    }
    case 'rose-window': {
      const rr = R * 0.92;
      buf.disc(hx, hy, rr, shadeRgb(collarC, -0.16), 255);
      buf.disc(hx, hy, rr * 0.86, gemC, 255);
      buf.ring(hx, hy, rr, Math.max(0.8 * S, R * 0.06), collarC, 255);
      buf.ring(hx, hy, rr * 0.7, Math.max(0.6 * S, R * 0.035), mixRgb(collarC, WHITE, 0.4), 235);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const col = [gemC, gem2, mixRgb(gemC, WHITE, 0.45)][i % 3];
        const x = hx + Math.cos(a) * rr * 0.7, y = hy + Math.sin(a) * rr * 0.7;
        buf.disc(x, y, rr * 0.18, col, 230);
        line(hx, hy, x, y, 0.55 * S, 0.35 * S, collarC, collarC, WHITE, 205);
        buf.disc(hx + Math.cos(a) * rr * 0.89, hy + Math.sin(a) * rr * 0.89, Math.max(0.6 * S, rr * 0.055), WHITE, 230);
      }
      buf.disc(hx, hy, rr * 0.24, mixRgb(gem2, WHITE, 0.35), 255);
      buf.blend(hx - rr * 0.15, hy - rr * 0.18, WHITE, 220);
      break;
    }
    case 'mask': {
      // Half-moon masquerade mask with arched eye slits, enamel panels and a gold bridge.
      const mw = R * 0.98, mh = R * 0.7;
      for (let y = Math.floor(hy - mh); y <= hy + mh; y++) {
        for (let x = Math.floor(hx - mw); x <= hx + mw; x++) {
          const nx = (x - hx) / mw, ny = (y - hy) / mh;
          if (nx * nx + ny * ny > 1 || y > hy + mh * 0.5 + Math.abs(nx) * mh * 0.3) continue;
          let col = mixRgb(shadeRgb(gemC, 0.26), shadeRgb(gemC, -0.26), (ny + 1) * 0.48);
          if (Math.abs(nx) > 0.84 || ny < -0.84) col = collarC;
          if (Math.abs(nx) < 0.1) col = mixRgb(col, WHITE, 0.3);
          buf.set(x, y, col, 255);
        }
      }
      for (const side of [-1, 1]) {
        const ex = hx + side * mw * 0.43, ey = hy - mh * 0.05;
        buf.disc(ex, ey, mw * 0.2, [11, 7, 18], 255);
        buf.disc(ex, ey, mw * 0.11, gem2, 245);
        buf.blend(ex - mw * 0.035, ey - mh * 0.06, WHITE, 235);
        line(ex, ey - mh * 0.12, ex + side * mw * 0.28, ey - mh * 0.34, 0.6 * S, 0.3 * S, collarC, collarC, WHITE, 220);
      }
      buf.disc(hx, hy + mh * 0.2, mw * 0.12, mixRgb(collarC, WHITE, 0.35), 240);
      break;
    }
    case 'octahedron': {
      // Three interlocking diamond planes; the center seam sells the 3D cut.
      const r = R * 0.96;
      for (let y = Math.floor(hy - r); y <= hy + r; y++) {
        for (let x = Math.floor(hx - r); x <= hx + r; x++) {
          const dx = (x - hx) / r, dy = (y - hy) / r;
          const m = Math.abs(dx) + Math.abs(dy);
          if (m > 1) continue;
          let col: RGB;
          if (dy < -Math.abs(dx) * 0.52) col = mixRgb(gem2, WHITE, 0.38 - Math.abs(dx) * 0.13);
          else if (dy < Math.abs(dx) * 0.48) col = dx < 0 ? shadeRgb(gemC, 0.2) : mixRgb(gemC, gem2, 0.38);
          else col = shadeRgb(gemC, -0.2 - Math.abs(dx) * 0.12);
          if (Math.abs(dy + Math.abs(dx) * 0.52) < 0.045 || Math.abs(dy - Math.abs(dx) * 0.48) < 0.045) col = mixRgb(col, WHITE, 0.5);
          if (m > 0.9) col = edgeDarken(col, 0.9);
          buf.set(x, y, col, 255);
        }
      }
      line(hx, hy - r, hx, hy + r, 0.55 * S, 0.35 * S, collarC, shadeRgb(collarC, -0.25), WHITE, 175);
      buf.disc(hx - r * 0.18, hy - r * 0.35, r * 0.09, WHITE, 240);
      break;
    }
    case 'aurora-crown': {
      buf.ring(hx, hy + R * 0.14, R * 0.72, Math.max(0.7 * S, R * 0.055), collarC, 245);
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI * 0.94 + (i / 8) * Math.PI * 0.88;
        const h = R * (0.65 + 0.48 * Math.sin((i / 8) * Math.PI));
        const bx = hx + Math.cos(a) * R * 0.68, by = hy + R * 0.12 + Math.sin(a) * R * 0.25;
        const tx = bx + Math.cos(a) * h * 0.52, ty = by - h;
        line(bx, by, tx, ty, R * 0.11, 0.35 * S, collarC, shadeRgb(collarC, -0.36), mixRgb(gem2, WHITE, 0.6), 250);
        buf.disc(tx, ty, Math.max(0.55 * S, R * 0.07), i % 2 ? gemC : gem2, 255);
        buf.blend(tx - 0.3 * S, ty - 0.3 * S, WHITE, 215);
      }
      paintFaceted(c, hx, hy - R * 0.22, R * 0.42, 'marquise', 1);
      for (let i = -2; i <= 2; i++) buf.disc(hx + i * R * 0.18, hy + R * 0.14, R * 0.055, WHITE, 215);
      break;
    }
    case 'snow-globe': {
      // Glass dome with falling snow, a little scene inside and an ornate base.
      const gr = R * 0.82;
      buf.disc(hx, hy - R * 0.1, gr, mixRgb([203, 230, 255], [255, 255, 255], 0.35), 90);
      buf.ring(hx, hy - R * 0.1, gr, Math.max(0.8 * S, R * 0.05), mixRgb([200, 225, 245], WHITE, 0.5), 230);
      buf.ring(hx, hy - R * 0.1, gr * 0.9, Math.max(0.5 * S, R * 0.025), [235, 245, 255], 140);
      // little festive scene: a tiny pine and a candle
      const treeX = hx - gr * 0.24, treeTop = hy - gr * 0.62, treeH = gr * 0.95;
      for (let i = 0; i < 4; i++) {
        const ty = treeTop + (treeH * i) / 4;
        const half = (i + 1) * gr * 0.1;
        line(treeX - half, ty, treeX + half, ty, gr * 0.045, gr * 0.03, [46, 125, 68], [26, 85, 44], [120, 200, 120]);
      }
      buf.disc(treeX, treeTop, gr * 0.05, [250, 220, 100], 240);
      for (let i = 0; i < 5; i++) line(hx + gr * 0.16 + i * gr * 0.09, hy - gr * 0.16, hx + gr * 0.16 + i * gr * 0.09, hy + gr * 0.34, gr * 0.04, gr * 0.04, [206, 72, 62], [150, 44, 40], [255, 160, 140], 240);
      buf.disc(hx + gr * 0.42, hy - gr * 0.08, gr * 0.07, [255, 230, 140], 245);
      // snow pellets drifting
      const snowN = Math.round(12 + R * 0.5);
      for (let i = 0; i < snowN; i++) {
        const a = (i * 2.399 + cfg.seed * 0.01) % (Math.PI * 2), d = gr * (0.18 + (i % 5) * 0.14);
        const sx = hx + Math.cos(a) * d, sy = hy - gr * 0.1 + Math.sin(a) * d * 0.85;
        buf.blend(sx, sy, WHITE, 245);
        if (i % 4 === 0) buf.blend(sx + S * 0.5, sy, WHITE, 160);
      }
      // base trim and pedestal
      for (let y = Math.floor(hy + gr * 0.4); y <= hy + R * 0.72; y++) {
        const f = (y - (hy + gr * 0.4)) / (R * 0.32);
        const half = gr * (0.7 - 0.15 * f);
        for (let x = Math.floor(hx - half); x <= hx + half; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, half);
          let col = mixRgb(shadeRgb(collarC, 0.28), shadeRgb(collarC, -0.3), e * 0.85);
          if (e > 0.85) col = edgeDarken(col, 0.8);
          buf.set(x, y, col, 255);
        }
      }
      line(hx - gr * 0.68, hy + gr * 0.48, hx + gr * 0.68, hy + gr * 0.48, 0.65 * S, 0.45 * S, mixRgb(collarC, WHITE, 0.4), collarC, WHITE, 215);
      buf.blend(hx - gr * 0.4, hy - gr * 0.5, WHITE, 225);
      buf.blend(hx - gr * 0.52, hy + gr * 0.12, WHITE, 150);
      break;
    }
    case 'butterfly': {
      // Ornate jeweled butterfly, symmetrical wings with enamel panes.
      const bw = R * 0.98;
      for (const side of [-1, 1]) {
        // forewing
        for (let y = Math.floor(hy - R * 0.9); y <= hy + R * 0.1; y++) {
          for (let x = Math.floor(hx + side * 0.1 * R); x <= hx + side * bw; x++) {
            if (side < 0 && x > hx - 0.08 * R) continue;
            if (side > 0 && x < hx + 0.08 * R) continue;
            const nx = side * (x - hx) / bw, ny = (y - hy) / R;
            const span = 0.95 - ny * ny * 0.55;
            if (nx > span || ny > 0.16 - nx * 0.2) continue;
            let col = mixRgb(gemC, gem2, ny * 0.5 + 0.2);
            if (ny < -0.55) col = mixRgb(col, WHITE, 0.3);
            if (nx > span - 0.16) col = shadeRgb(col, -0.32);
            buf.set(x, y, col, 255);
          }
        }
        // hindwing
        for (let y = Math.floor(hy + R * 0.05); y <= hy + R * 0.85; y++) {
          for (let x = Math.floor(hx + 0.05 * R); side > 0 ? x <= hx + bw * 0.75 : x >= hx - bw * 0.75; x++) {
            if (side < 0 && x > hx - 0.05 * R) continue;
            if (side > 0 && x < hx + 0.05 * R) continue;
            const nx = side * (x - hx) / (bw * 0.75), ny = (y - hy - R * 0.42) / (R * 0.5);
            const span = 0.82 - ny * ny * 0.5;
            if (nx > span || nx < 0.12) continue;
            let col = mixRgb(shadeRgb(gemC, 0.18), gem2, ny * 0.4 + 0.3);
            if (nx > span - 0.13) col = shadeRgb(col, -0.28);
            buf.set(x, y, col, 255);
          }
        }
        // jeweled spots on forewing
        for (let i = 0; i < 3; i++) {
          const sx = hx + side * bw * (0.32 + i * 0.2), sy = hy - R * (0.55 + i * 0.05);
          buf.disc(sx, sy, R * 0.06, WHITE, 235);
          buf.blend(sx - S * 0.35, sy - S * 0.35, gem2, 200);
        }
      }
      // body
      line(hx, hy - R * 0.78, hx, hy + R * 0.62, R * 0.075, R * 0.05, shadeRgb(collarC, 0.35), collarC, WHITE);
      // head + antennae
      buf.disc(hx, hy - R * 0.8, R * 0.09, shadeRgb(collarC, 0.4), 245);
      buf.blend(hx - S * 0.4, hy - R * 0.84, WHITE, 220);
      for (const side of [-1, 1]) {
        line(hx, hy - R * 0.86, hx + side * R * 0.3, hy - R * 1.06, 0.5 * S, 0.35 * S, collarC, collarC, WHITE, 220);
        buf.disc(hx + side * R * 0.3, hy - R * 1.06, R * 0.035, WHITE, 230);
      }
      break;
    }
    case 'wing': {
      // Elegant sweeping wing prop, five graduated feathers rising from a gold quill.
      const qhX = hx - R * 0.12, qhY = hy + R * 0.62;
      // feathers back to front
      for (let i = 4; i >= 0; i--) {
        const fi = i / 4;
        const bx = qhX + (i - 0.5) * R * 0.12, by = qhY - i * R * 0.18;
        const tx = bx + R * (0.42 + fi * 0.2), ty = by - R * (1.15 - fi * 0.08);
        const shade = 0.16 + fi * 0.16;
        const col = mixRgb(gemC, gem2, 0.22 + fi * 0.05);
        for (let s = 0; s <= 14; s++) {
          const t = s / 14;
          const px = bx + (tx - bx) * t, py = by + (ty - by) * t;
          const w = R * (0.14 - t * 0.1) * (1 - fi * 0.1);
          buf.disc(px, py, Math.max(0.55 * S, w), shadeRgb(col, shade));
          for (const sd of [-1, 1]) buf.blend(px + sd * w * 0.7, py, mixRgb(col, WHITE, shade * 0.6), 90);
        }
        buf.blend(tx, ty, WHITE, 195);
      }
      // quill ridge and collar
      line(qhX - R * 0.18, qhY + R * 0.05, qhX + R * 0.32, qhY - R * 0.42, R * 0.05, R * 0.035, mixRgb(collarC, WHITE, 0.45), collarC, WHITE);
      buf.disc(qhX, qhY, R * 0.12, collarC, 245);
      for (let k = 0; k < 4; k++) buf.disc(qhX - R * 0.06 + k * R * 0.04, qhY + S * 0.3, R * 0.022, WHITE, 225);
      break;
    }
    case 'helmet': {
      // Regal knight's helm with plume, visor slits and cheek guards.
      const hw = R * 0.78, domeH = R * 0.62;
      // dome
      for (let y = Math.floor(hy - domeH); y <= hy + R * 0.32; y++) {
        const f = (y - (hy - domeH)) / (domeH + R * 0.32);
        const hw2 = hw * Math.sin(Math.min(Math.PI / 2, f * Math.PI * 0.52 + 0.05));
        for (let x = Math.floor(hx - hw2); x <= hx + hw2; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, hw2 || 0.5);
          const col = mixRgb(shadeRgb(collarC, 0.42), shadeRgb(collarC, -0.42), e * 0.78 + Math.max(0, f - 0.6) * 0.18);
          buf.set(x, y, col, 255);
        }
      }
      // cheek guards (angled, lower sides slightly pointed)
      for (const sd of [-1, 1]) {
        for (let y = Math.floor(hy + R * 0.12); y <= hy + R * 0.72; y++) {
          const f = (y - (hy + R * 0.12)) / (R * 0.6);
          const cx0 = hx + sd * hw * (0.62 - f * 0.18);
          const half = R * 0.16 * (1 - f * 0.35);
          for (let x = Math.floor(cx0 - half); x <= cx0 + half; x++) {
            const e = Math.abs(x - cx0) / Math.max(0.4, half);
            buf.set(x, y, mixRgb(shadeRgb(collarC, 0.34), shadeRgb(collarC, -0.38), e), 250);
          }
        }
        buf.disc(hx + sd * hw * 0.52, hy + R * 0.42, R * 0.04, gem2, 230);
      }
      // visor slit
      for (let y = Math.floor(hy - R * 0.12); y <= hy + R * 0.06; y++) {
        for (let x = Math.floor(hx - hw * 0.55); x <= hx + hw * 0.55; x++) {
          if (Math.abs(y - hy - R * 0.03) > R * 0.05) continue;
          buf.set(x, y, [13, 9, 20], 245);
        }
      }
      line(hx - hw * 0.55, hy - R * 0.08, hx + hw * 0.55, hy - R * 0.08, 0.55 * S, 0.4 * S, mixRgb(collarC, WHITE, 0.45), collarC, WHITE, 205);
      // crest plume
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.16;
        const bx = hx, by = hy - domeH - R * 0.02;
        const tx = hx + Math.cos(a) * (R * 0.45 + (i % 2 ? R * 0.22 : R * 0.12));
        const ty = by - Math.abs(Math.sin(a)) * R * (0.55 + (i % 3) * 0.12) - (i === 0 || i === 5 ? R * 0.1 : R * 0.28);
        line(bx, by, tx, ty, R * 0.08, 0.4 * S, mixRgb(gemC, WHITE, 0.35), gemC, WHITE, 245);
        for (let s = 1; s < 5; s++) {
          const t = s / 5, fx = bx + (tx - bx) * t, fy = by + (ty - by) * t;
          for (const sd of [-1, 1]) buf.blend(fx + sd * R * 0.1, fy, mixRgb(gemC, WHITE, 0.25), 200);
        }
      }
      // brow band + gem
      for (let x = Math.floor(hx - hw * 0.68); x <= hx + hw * 0.68; x++) {
        buf.set(x, hy - R * 0.3, mixRgb(collarC, WHITE, 0.3), 250);
        buf.set(x, hy - R * 0.33, shadeRgb(collarC, -0.28), 240);
      }
      paintFaceted(c, hx, hy - R * 0.31, R * 0.1, 'diamond', 1);
      break;
    }
    case 'crown': {
      // Crown of might: heavy band with points, crossed inner circle and stones.
      const bw2 = R * 0.95, baseY = hy + R * 0.4;
      // band
      for (let y = Math.floor(baseY - R * 0.18); y <= baseY + R * 0.26; y++) {
        for (let x = Math.floor(hx - bw2); x <= hx + bw2; x++) {
          const e = Math.abs(x - hx) / bw2;
          buf.set(x, y, mixRgb(shadeRgb(collarC, 0.45), shadeRgb(collarC, -0.35), e * 0.9), 255);
        }
      }
      line(hx - bw2, baseY + R * 0.02, hx + bw2, baseY + R * 0.02, 0.7 * S, 0.5 * S, mixRgb(collarC, WHITE, 0.45), collarC, WHITE, 220);
      line(hx - bw2, baseY + R * 0.2, hx + bw2, baseY + R * 0.2, 0.5 * S, 0.35 * S, shadeRgb(collarC, -0.25), collarC, WHITE, 180);
      // 5 stylized points
      const pointN = 5;
      for (let i = 0; i < pointN; i++) {
        const f = i / (pointN - 1);
        const bx = hx - bw2 + f * bw2 * 2;
        const pH = R * (i === 2 ? 0.9 : i % 2 ? 0.7 : 0.55);
        const txY = baseY - R * 0.18 - pH;
        line(bx, baseY - R * 0.18, bx, txY, R * 0.09, 0.3 * S, collarC, shadeRgb(collarC, -0.36), mixRgb(collarC, WHITE, 0.58));
        if (i === 2) {
          line(bx, txY, bx + R * 0.12, txY - R * 0.14, R * 0.07, 0.25 * S, collarC, shadeRgb(collarC, -0.3), WHITE);
          line(bx, txY, bx - R * 0.12, txY - R * 0.14, R * 0.07, 0.25 * S, collarC, shadeRgb(collarC, -0.3), WHITE);
        }
        paintFaceted(c, bx, txY, R * 0.07, 'round', i);
        if (i < pointN && i % 2 === 0) buf.blend(bx - S * 0.3, txY - S * 0.3, WHITE, 205);
      }
      // three gem stones in the band
      const stones: Array<[number, RGB, number]> = [[-0.5, gemC, 0.09], [0, gem2, 0.12], [0.5, gemC, 0.09]];
      for (const [f, , ss] of stones) {
        paintFaceted(c, hx + bw2 * f, baseY + R * 0.04, R * ss, 'diamond', Math.round(f * 7));
        buf.ring(hx + bw2 * f, baseY + R * 0.04, R * (ss + 0.012), 0.5 * S, mixRgb(collarC, WHITE, 0.3), 215);
      }
      for (let i = 0; i < 5; i++) buf.disc(hx - bw2 * 0.85 + i * R * 0.12, baseY + R * 0.2, R * 0.03, WHITE, 220);
      break;
    }
    case 'music-box': {
      // Ornate gilded music box with crank, lid and keyhole.
      const bx = R * 0.85, by = R * 0.78;
      // lids: back half slightly open with dark interior
      for (let x = Math.floor(hx - bx); x <= hx + bx; x++) {
        for (let y = Math.floor(hy - by * 1.1); y <= hy - by * 0.5; y++) {
          buf.set(x, y, mixRgb([24, 12, 22], [46, 24, 34], (y - (hy - by * 1.1)) / (by * 0.6)), 245);
        }
      }
      // outer box body
      for (let y = Math.floor(hy - by * 0.5); y <= hy + by; y++) {
        for (let x = Math.floor(hx - bx); x <= hx + bx; x++) {
          const e = Math.abs(x - hx) / bx, fy = (y - (hy - by * 0.5)) / (by * 1.5);
          let col = mixRgb(shadeRgb(collarC, 0.35), shadeRgb(collarC, -0.3), e * 0.55 + fy * 0.25);
          if (fy < 0.12) col = mixRgb(collarC, WHITE, 0.25);
          if (e > 0.9) col = edgeDarken(col, 0.8);
          buf.set(x, y, col, 255);
        }
      }
      // ornate lid panel
      for (let x = Math.floor(hx - bx * 0.72); x <= hx + bx * 0.72; x++) {
        for (let y = Math.floor(hy - by * 0.32); y <= hy + by * 0.42; y++) {
          if (Math.abs(x - hx) < bx * 0.1 && Math.abs(y - (hy + by * 0.05)) < by * 0.32) continue;
          if ((Math.round(x - hx + y) % 3) === 0) {
            const e = Math.abs(x - hx) / bx;
            buf.set(x, y, mixRgb(shadeRgb(collarC, -0.04), shadeRgb(collarC, -0.22), e), 245);
          }
        }
      }
      // golden keyhole plate
      buf.disc(hx, hy + by * 0.6, R * 0.16, mixRgb(collarC, WHITE, 0.4), 245);
      buf.disc(hx, hy + by * 0.6, R * 0.08, [13, 9, 18], 250);
      line(hx - R * 0.16, hy + by * 0.6, hx + R * 0.16, hy + by * 0.6, 0.4 * S, 0.35 * S, [13, 9, 18], [13, 9, 18], [13, 9, 18], 220);
      // crank arm
      line(hx + bx + R * 0.06, hy - by * 0.1, hx + bx + R * 0.32, hy - by * 0.42, R * 0.07, R * 0.06, collarC, shadeRgb(collarC, -0.32), WHITE);
      buf.disc(hx + bx + R * 0.32, hy - by * 0.42, R * 0.1, mixRgb(collarC, WHITE, 0.42), 245);
      buf.disc(hx + bx + R * 0.32, hy - by * 0.42, R * 0.045, WHITE, 235);
      // musical notes rising
      for (let i = 0; i < 3; i++) {
        const nx = hx - R * 0.55 + i * R * 0.42, ny = hy - by * 1.15 - i * R * 0.18;
        buf.disc(nx, ny, R * 0.055, mixRgb(gem2, WHITE, 0.35), 215);
        line(nx + R * 0.05, ny, nx + R * 0.05, ny - R * 0.14, 0.42 * S, 0.35 * S, mixRgb(gem2, WHITE, 0.4), gem2, WHITE, 205);
      }
      break;
    }

    /* ══════ Minecraft world icons ══════ */
    case 'nether-star': {
      const r = R * 1.0;
      for (let y = Math.floor(hy - r - 1); y <= hy + r + 1; y++) {
        for (let x = Math.floor(hx - r - 1); x <= hx + r + 1; x++) {
          const dx = x - hx, dy = y - hy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
          const rr = r * (0.3 + 0.7 * Math.pow(Math.abs(Math.cos(2 * a)), 0.26));
          if (d > rr) continue;
          const e = d / rr;
          let col = mixRgb(WHITE, mixRgb(gem2, WHITE, 0.5), e);
          if (dx > 0 || dy > 0) col = mixRgb(col, shadeRgb(gem2, -0.2), 0.42);
          if (e > 0.88) col = edgeDarken(col, 0.55);
          buf.set(x, y, col, 255);
        }
      }
      buf.disc(hx, hy, r * 0.2, WHITE, 255);
      buf.ring(hx, hy, r * 0.33, Math.max(0.55 * S, r * 0.045), mixRgb(gem2, WHITE, 0.6), 170);
      break;
    }
    case 'beacon': {
      const bw = R * 0.86, bh = R * 0.86;
      // obsidian plinth
      for (let x = Math.floor(hx - bw); x <= hx + bw; x++) {
        for (let y = Math.floor(hy + bh * 0.55); y <= hy + bh; y++) {
          const e = (x - (hx - bw)) / (bw * 2);
          buf.set(x, y, mixRgb([46, 32, 62], [18, 10, 26], e * 0.5 + ((y - hy) / bh) * 0.3), 255);
        }
      }
      // glass cube
      for (let y = Math.floor(hy - bh); y <= hy + bh * 0.58; y++) {
        for (let x = Math.floor(hx - bw * 0.92); x <= hx + bw * 0.92; x++) {
          const e = Math.abs(x - hx) / (bw * 0.92), f = (y - (hy - bh)) / (bh * 1.58);
          buf.set(x, y, mixRgb(mixRgb([150, 220, 235], WHITE, 0.35), [70, 150, 175], e * 0.6 + f * 0.4), 205);
        }
      }
      paintFaceted(c, hx, hy - bh * 0.06, R * 0.3, 'brilliant', 3);
      buf.disc(hx, hy - bh * 0.06, R * 0.12, WHITE, 245);
      for (const sx of [-1, 1]) line(hx + sx * bw * 0.92, hy - bh, hx + sx * bw * 0.92, hy + bh * 0.58, 0.7 * S, 0.55 * S, [225, 245, 250], [120, 175, 195], WHITE, 235);
      line(hx - bw * 0.92, hy - bh, hx + bw * 0.92, hy - bh, 0.7 * S, 0.55 * S, WHITE, [150, 200, 215], WHITE, 235);
      // beam
      for (let y = Math.floor(hy - bh * 1.85); y <= hy - bh; y++) {
        const t = (hy - bh - y) / (bh * 0.85), half = R * 0.16 * (1 - t * 0.4);
        for (let x = Math.floor(hx - half); x <= hx + half; x++) buf.blend(x, y, mixRgb([140, 230, 245], WHITE, 0.4), 200 * (1 - t * 0.55));
      }
      break;
    }
    case 'totem': {
      const bw = R * 0.56, headH = R * 0.5, bodyH = R * 0.78;
      for (let y = Math.floor(hy - headH * 0.2); y <= hy + bodyH; y++) {
        const f = (y - (hy - headH * 0.2)) / (bodyH + headH * 0.2), half = bw * (0.82 - f * 0.18);
        for (let x = Math.floor(hx - half); x <= hx + half; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, half);
          let col = mixRgb([126, 176, 62], [58, 96, 34], e * 0.75 + f * 0.25);
          if (e > 0.88) col = edgeDarken(col, 0.85);
          buf.set(x, y, col, 255);
        }
      }
      for (let y = Math.floor(hy - headH * 1.15); y <= hy - headH * 0.1; y++) {
        for (let x = Math.floor(hx - bw); x <= hx + bw; x++) buf.set(x, y, mixRgb([168, 208, 96], [86, 128, 48], Math.abs(x - hx) / bw * 0.7), 255);
      }
      for (const sd of [-1, 1]) {
        buf.disc(hx + sd * bw * 0.42, hy - headH * 0.62, bw * 0.19, [22, 120, 60], 255);
        buf.disc(hx + sd * bw * 0.42, hy - headH * 0.62, bw * 0.1, [86, 220, 130], 255);
        buf.blend(hx + sd * bw * 0.46, hy - headH * 0.7, WHITE, 215);
      }
      line(hx - bw * 0.3, hy - headH * 0.26, hx + bw * 0.3, hy - headH * 0.26, 0.7 * S, 0.5 * S, [40, 74, 26], [30, 58, 20], [70, 110, 44], 235);
      for (const fy of [0.18, 0.58]) {
        const yy = hy + bodyH * fy, half = bw * (0.82 - fy * 0.18);
        line(hx - half, yy, hx + half, yy, 0.75 * S, 0.55 * S, mixRgb(collarC, WHITE, 0.35), collarC, WHITE, 235);
      }
      paintFaceted(c, hx, hy + bodyH * 0.36, bw * 0.24, 'diamond', 2);
      for (const sd of [-1, 1]) line(hx + sd * bw * 0.8, hy + bodyH * 0.06, hx + sd * bw * 1.18, hy + bodyH * 0.5, bw * 0.16, bw * 0.1, [126, 176, 62], [58, 96, 34], [178, 214, 120], 240);
      break;
    }
    case 'geode': {
      const r = R * 0.95;
      for (let y = Math.floor(hy - r); y <= hy + r; y++) {
        for (let x = Math.floor(hx - r); x <= hx + r; x++) {
          const a = Math.atan2(y - hy, x - hx);
          const wob = 1 + Math.sin(a * 7 + cfg.seed * 0.02) * 0.07 + Math.sin(a * 13) * 0.04;
          const d = Math.hypot(x - hx, y - hy) / (r * wob);
          if (d > 1) continue;
          let col = mixRgb([126, 110, 104], [62, 52, 50], d * 0.85);
          if (rng() < 0.14) col = shadeRgb(col, rng() < 0.5 ? 0.1 : -0.12);
          if (d > 0.9) col = edgeDarken(col, 0.7);
          buf.set(x, y, col, 255);
        }
      }
      const cr = r * 0.6;
      for (let y = Math.floor(hy - cr); y <= hy + cr; y++) {
        for (let x = Math.floor(hx - cr); x <= hx + cr; x++) {
          const a = Math.atan2(y - hy, x - hx), wob = 1 + Math.sin(a * 5 + 1.2) * 0.12;
          if (Math.hypot(x - hx, y - hy) > cr * wob) continue;
          buf.set(x, y, mixRgb([54, 28, 84], [24, 10, 44], Math.hypot(x - hx, y - hy) / cr), 255);
        }
      }
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + 0.4;
        paintCrystal(c, hx + Math.cos(a) * cr * 0.42, hy + Math.sin(a) * cr * 0.42, cr * (0.3 + (i % 3) * 0.08), mixRgb(gemC, WHITE, 0.12), gem2, Math.sin(a) * 0.2);
      }
      paintFaceted(c, hx, hy, cr * 0.26, 'brilliant', 5);
      buf.ring(hx, hy, cr * 1.02, Math.max(0.6 * S, r * 0.035), mixRgb(gem2, WHITE, 0.35), 160);
      break;
    }
    case 'ender-pearl': {
      const r = R * 0.88;
      for (let y = Math.floor(hy - r); y <= hy + r; y++) {
        for (let x = Math.floor(hx - r); x <= hx + r; x++) {
          const dx = x - hx, dy = y - hy, d = Math.hypot(dx, dy) / r;
          if (d > 1) continue;
          const uu = -(dx + dy) * 0.707 / r;
          let col = mixRgb(mixRgb(gemC, WHITE, 0.42), shadeRgb(gemC, -0.52), d * d);
          const swirl = Math.sin(Math.atan2(dy, dx) * 3 + d * 7 + cfg.seed * 0.02);
          col = mixRgb(col, mixRgb(gem2, WHITE, 0.2), Math.max(0, swirl) * 0.3 * (1 - d));
          if (uu > 0.35) col = mixRgb(col, WHITE, 0.2);
          if (d > 0.9) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      for (let i = 0; i < 9; i++) {
        const a = rng() * Math.PI * 2, d = rng() * r * 0.72;
        buf.blend(hx + Math.cos(a) * d, hy + Math.sin(a) * d, mixRgb(gem2, WHITE, 0.5), 175);
      }
      buf.blend(hx - r * 0.34, hy - r * 0.38, WHITE, 245);
      buf.blend(hx - r * 0.2, hy - r * 0.24, WHITE, 175);
      break;
    }
    case 'potion-flask': {
      const bw = R * 0.6, neck = R * 0.24, topY = hy - R * 0.95, botY = hy + R * 0.85, liquidTop = hy - R * 0.1;
      for (let y = Math.floor(topY); y <= botY; y++) {
        const inNeck = y < hy - R * 0.35;
        const f = inNeck ? 0 : (y - (hy - R * 0.35)) / (botY - (hy - R * 0.35));
        const half = inNeck ? neck : neck + (bw - neck) * Math.sin(Math.min(1, f * 1.25) * Math.PI * 0.5);
        for (let x = Math.floor(hx - half); x <= hx + half; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, half);
          let col: RGB = y < liquidTop
            ? mixRgb([214, 236, 244], [150, 190, 205], e)
            : mixRgb(mixRgb(gemC, WHITE, 0.32), shadeRgb(gemC, -0.3), e * 0.85);
          if (e > 0.88) col = edgeDarken(col, 0.75);
          buf.set(x, y, col, 255);
        }
      }
      line(hx - bw * 0.86, liquidTop, hx + bw * 0.86, liquidTop, 0.7 * S, 0.5 * S, mixRgb(gem2, WHITE, 0.55), gemC, WHITE, 235);
      for (let i = 0; i < 4; i++) buf.disc(hx - bw * 0.4 + i * bw * 0.28, liquidTop + R * (0.14 + (i % 2) * 0.2), R * 0.045, mixRgb(gem2, WHITE, 0.6), 210);
      for (let y = Math.floor(topY - R * 0.2); y <= topY + R * 0.06; y++) {
        for (let x = Math.floor(hx - neck * 1.05); x <= hx + neck * 1.05; x++) buf.set(x, y, mixRgb([178, 132, 82], [110, 76, 44], Math.abs(x - hx) / (neck * 1.05)), 255);
      }
      line(hx - bw * 0.55, hy + R * 0.05, hx - bw * 0.5, hy + R * 0.6, 0.8 * S, 0.6 * S, WHITE, WHITE, WHITE, 205);
      buf.blend(hx - neck * 0.5, topY + R * 0.16, WHITE, 185);
      break;
    }
    case 'dragon-breath': {
      const bw = R * 0.62, neck = R * 0.22, topY = hy - R * 0.9, botY = hy + R * 0.82;
      for (let y = Math.floor(topY); y <= botY; y++) {
        const inNeck = y < hy - R * 0.32;
        const f = inNeck ? 0 : (y - (hy - R * 0.32)) / (botY - (hy - R * 0.32));
        const half = inNeck ? neck : neck + (bw - neck) * Math.sin(Math.min(1, f * 1.25) * Math.PI * 0.5);
        for (let x = Math.floor(hx - half); x <= hx + half; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, half);
          let col = mixRgb(mixRgb(gemC, WHITE, 0.35), shadeRgb(gemC, -0.32), e * 0.85);
          const sw = Math.sin(((y - hy) * 0.5) / S + Math.atan2(x - hx, y - hy) * 2 + cfg.seed * 0.02);
          col = mixRgb(col, mixRgb(gem2, WHITE, 0.45), Math.max(0, sw) * 0.45);
          if (e > 0.88) col = edgeDarken(col, 0.75);
          buf.set(x, y, col, 255);
        }
      }
      for (let i = 0; i < 7; i++) {
        const a = rng() * Math.PI * 2, d = rng() * R * 0.42;
        buf.blend(hx + Math.cos(a) * d, hy + R * 0.15 + Math.sin(a) * d * 0.8, mixRgb(gem2, WHITE, 0.6), 200);
      }
      for (let y = Math.floor(topY - R * 0.2); y <= topY + R * 0.06; y++)
        for (let x = Math.floor(hx - neck * 1.05); x <= hx + neck * 1.05; x++)
          buf.set(x, y, mixRgb([178, 132, 82], [110, 76, 44], Math.abs(x - hx) / (neck * 1.05)), 255);
      line(hx - bw * 0.5, hy + R * 0.1, hx - bw * 0.46, hy + R * 0.58, 0.8 * S, 0.6 * S, WHITE, WHITE, WHITE, 200);
      buf.ring(hx, hy + R * 0.16, bw * 0.72, Math.max(0.5 * S, R * 0.03), mixRgb(gem2, WHITE, 0.5), 130);
      break;
    }
    case 'shulker-core': {
      const r = R * 0.9;
      for (const sd of [-1, 1]) {
        for (let y = Math.floor(hy - r); y <= hy + r; y++) {
          for (let x = Math.floor(hx - r); x <= hx + r; x++) {
            const dy = (y - hy) / r;
            if (sd < 0 ? dy > -0.08 : dy < 0.08) continue;
            const dx = (x - (hx + sd * r * 0.05)) / r;
            if (dx * dx + dy * dy > 1) continue;
            const e = Math.hypot(dx, dy);
            let col = mixRgb(shadeRgb(gemC, 0.22), shadeRgb(gemC, -0.34), e);
            if (Math.abs(Math.sin(Math.atan2(dy, dx) * 8)) > 0.86) col = shadeRgb(col, -0.16);
            if (e > 0.9) col = edgeDarken(col, 0.8);
            buf.set(x, y, col, 255);
          }
        }
      }
      buf.disc(hx, hy, r * 0.3, mixRgb(gem2, WHITE, 0.25), 255);
      buf.disc(hx, hy, r * 0.17, [250, 214, 90], 255);
      buf.disc(hx, hy, r * 0.08, WHITE, 250);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        buf.blend(hx + Math.cos(a) * r * 0.42, hy + Math.sin(a) * r * 0.42, mixRgb(gem2, WHITE, 0.5), 185);
      }
      line(hx - r * 0.95, hy, hx + r * 0.95, hy, 0.6 * S, 0.45 * S, mixRgb(gem2, WHITE, 0.4), gemC, WHITE, 170);
      break;
    }
    case 'respawn-anchor': {
      const s = R * 0.92;
      for (let y = 0; y < s * 0.42; y++) {
        for (let x = 0; x < s * 1.5; x++) buf.set(hx - s * 0.75 + x + y * 0.28, hy - s * 0.9 + y, mixRgb([78, 46, 96], [40, 22, 54], x / (s * 1.5)), 255);
      }
      for (let y = Math.floor(hy - s * 0.5); y <= hy + s * 0.62; y++) {
        for (let x = Math.floor(hx - s * 0.75); x <= hx + s * 0.75; x++) {
          const e = Math.abs(x - hx) / (s * 0.75), f = (y - (hy - s * 0.5)) / (s * 1.12);
          let col = mixRgb([46, 24, 60], [16, 8, 24], e * 0.5 + f * 0.5);
          const v = Math.sin((x * 0.42) / S + Math.sin((y * 0.31) / S) * 2.2);
          if (v > 0.86) col = mixRgb(col, mixRgb(gem2, WHITE, 0.25), 0.75);
          buf.set(x, y, col, 255);
        }
      }
      for (let i = 0; i < 4; i++) {
        const lx = hx - s * 0.5 + i * s * 0.34, ly = hy - s * 0.18, lit = i < 3;
        buf.disc(lx, ly, s * 0.085, lit ? mixRgb(gem2, WHITE, 0.45) : [30, 18, 40], 255);
        if (lit) buf.blend(lx, ly, WHITE, 215);
      }
      line(hx - s * 0.75, hy - s * 0.5, hx + s * 0.75, hy - s * 0.5, 0.7 * S, 0.5 * S, mixRgb(gemC, WHITE, 0.3), [24, 12, 34], WHITE, 225);
      break;
    }
    case 'glow-berries': {
      for (let i = 0; i < 4; i++) {
        const sx = hx - R * 0.55 + i * R * 0.36;
        let px = sx, py = hy - R * 0.85;
        for (let k = 0; k < 10; k++) {
          const nx = sx + Math.sin(k * 0.7 + i) * R * 0.1, ny = py + R * 0.18;
          line(px, py, nx, ny, 0.65 * S, 0.45 * S, [86, 132, 52], [48, 84, 34], [150, 196, 96], 235);
          px = nx; py = ny;
          if (k % 3 === 1) {
            buf.disc(nx, ny, R * 0.11, mixRgb([250, 168, 62], WHITE, 0.18), 255);
            buf.disc(nx, ny, R * 0.055, [255, 232, 150], 250);
            buf.blend(nx - R * 0.03, ny - R * 0.04, WHITE, 225);
          }
        }
      }
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * 0.85 + (i / 4) * Math.PI * 0.7;
        const lx = hx + Math.cos(a) * R * 0.5, ly = hy - R * 0.8 + Math.sin(a) * R * 0.24;
        buf.disc(lx, ly, R * 0.15, i % 2 ? [104, 162, 66] : [72, 122, 48], 245);
        buf.blend(lx - R * 0.04, ly - R * 0.05, [178, 216, 130], 190);
      }
      break;
    }
    case 'banner': {
      const bw = R * 0.72, top = hy - R * 0.92, bot = hy + R * 0.95;
      line(hx - bw * 1.02, top - R * 0.12, hx - bw * 1.02, bot, 0.8 * S, 0.6 * S, collarC, shadeRgb(collarC, -0.3), mixRgb(collarC, WHITE, 0.45), 235);
      for (let y = Math.floor(top); y <= bot; y++) {
        const f = (y - top) / (bot - top);
        const wave = Math.sin(f * 3.4 + cfg.seed * 0.01) * R * 0.1;
        const x0 = hx - bw * 0.9 + wave, x1 = hx + bw * 0.95 + wave;
        const notch = f > 0.78 ? (f - 0.78) / 0.22 : 0, mid = (x0 + x1) / 2;
        for (let x = Math.floor(x0); x <= Math.floor(x1); x++) {
          if (notch > 0 && Math.abs(x - mid) < bw * 0.3 * notch) continue;
          const e = (x - x0) / Math.max(1, x1 - x0);
          let col = mixRgb(shadeRgb(gemC, 0.16), shadeRgb(gemC, -0.26), e);
          if (f < 0.06 || f > 0.94) col = mixRgb(collarC, WHITE, 0.25);
          buf.set(x, y, col, 255);
        }
      }
      paintFaceted(c, hx + R * 0.02, hy - R * 0.16, R * 0.24, 'diamond', 4);
      buf.ring(hx + R * 0.02, hy - R * 0.16, R * 0.34, Math.max(0.5 * S, R * 0.035), mixRgb(gem2, WHITE, 0.45), 205);
      line(hx - bw * 0.62, hy + R * 0.42, hx + bw * 0.7, hy + R * 0.42, 0.6 * S, 0.45 * S, mixRgb(collarC, WHITE, 0.35), collarC, WHITE, 215);
      break;
    }
    case 'brazier': {
      const bw = R * 0.85, rim = hy + R * 0.05;
      for (let y = Math.floor(rim); y <= hy + R * 0.72; y++) {
        const f = (y - rim) / (R * 0.67), half = bw * (1 - f * 0.45);
        for (let x = Math.floor(hx - half); x <= hx + half; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, half);
          let col = mixRgb(shadeRgb(collarC, 0.3), shadeRgb(collarC, -0.42), e * 0.8 + f * 0.2);
          if (e > 0.9) col = edgeDarken(col, 0.8);
          buf.set(x, y, col, 255);
        }
      }
      line(hx - bw, rim, hx + bw, rim, 0.9 * S, 0.6 * S, mixRgb(collarC, WHITE, 0.45), collarC, WHITE, 245);
      for (let i = 0; i < 7; i++) {
        const cx = hx + (rng() - 0.5) * bw * 1.3, cy = rim - R * 0.02 + rng() * R * 0.08;
        buf.disc(cx, cy, R * (0.06 + rng() * 0.05), rng() < 0.5 ? [226, 92, 30] : [255, 176, 70], 245);
      }
      for (let i = 0; i < 3; i++) {
        const fx = hx + (i - 1) * bw * 0.42, fh = R * (i === 1 ? 0.82 : 0.55);
        for (let y = Math.floor(rim - fh); y <= rim; y++) {
          const f = (rim - y) / fh, half = bw * 0.2 * Math.sin((1 - f) * Math.PI * 0.9);
          for (let x = Math.floor(fx - half); x <= fx + half; x++) buf.blend(x, y, mixRgb([255, 196, 80], [255, 110, 40], f), 225 * (1 - f * 0.35));
        }
        buf.blend(fx, rim - fh * 0.55, [255, 246, 200], 235);
      }
      for (const sd of [-1, 1]) line(hx + sd * bw * 0.55, hy + R * 0.7, hx + sd * bw * 0.78, hy + R * 0.98, R * 0.07, R * 0.05, collarC, shadeRgb(collarC, -0.35), mixRgb(collarC, WHITE, 0.4), 240);
      break;
    }
  }
}


