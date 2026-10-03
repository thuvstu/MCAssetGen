/*
 * Tip atelier — every finial is a small, finished sculpture rather than an icon.
 * Keep this module separate from item silhouettes: the item shape can be chosen
 * independently from its finial, gemstone cut, mount and orbiting jewels.
 */
import { RGB, WHITE, mixRgb, shadeRgb } from '../color';
import type { RenderCtx } from './context';
import type { GemCut } from '../types';
import { paintCrystal } from './head';
import { paintFaceted } from './gems';

function setGem(c: RenderCtx, cx: number, cy: number, r: number, shape: GemCut | 'round' | 'diamond' = c.cfg.gemCut ?? 'brilliant', frame = true) {
  const { buf, pal, S } = c;
  paintFaceted(c, cx, cy, r, shape, Math.round(cx + cy));
  if (frame) {
    buf.ring(cx, cy, r * 1.1, Math.max(0.5 * S, r * 0.12), pal.collarC, 235);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      buf.disc(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9, Math.max(0.45 * S, r * 0.11), mixRgb(pal.collarC, WHITE, 0.42), 240);
    }
  }
}

function connector(c: RenderCtx, width = 0.45) {
  const { geo, pal, line, S } = c;
  const { tipC: p, tipSize: r, headC, headR, dir } = geo;
  const sx = headC[0] + dir[0] * headR * 0.76;
  const sy = headC[1] + dir[1] * headR * 0.76;
  const ex = p[0] - dir[0] * r * 0.42;
  const ey = p[1] - dir[1] * r * 0.42;
  line(sx, sy, ex, ey, Math.max(0.55 * S, r * width * 0.18), Math.max(0.35 * S, r * width * 0.1),
    pal.collarC, shadeRgb(pal.collarC, -0.38), mixRgb(pal.collarC, WHITE, 0.5), 238);
}

function drawStar(c: RenderCtx, cx: number, cy: number, r: number, points = 5, color: RGB = c.pal.gemC) {
  const { buf, edgeDarken } = c;
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) {
    for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const rr = r * (0.43 + 0.57 * Math.pow(0.5 + 0.5 * Math.cos(points * a - Math.PI / 2), 0.43));
      if (d > rr) continue;
      let col = mixRgb(mixRgb(color, WHITE, 0.48), color, d / rr);
      if (d / rr > 0.84) col = edgeDarken(col, 0.9);
      buf.set(x, y, col, 255);
    }
  }
  buf.disc(cx, cy, Math.max(0.5, r * 0.12), WHITE, 245);
}

function drawPetal(c: RenderCtx, cx: number, cy: number, r: number, a: number, color: RGB) {
  const { buf, S } = c;
  const len = r, width = r * 0.38;
  const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
  for (let y = Math.floor(cy - len); y <= cy + len; y++) {
    for (let x = Math.floor(cx - len); x <= cx + len; x++) {
      const dx = x - cx, dy = y - cy;
      const along = dx * ux + dy * uy, across = dx * vx + dy * vy;
      const taper = Math.sin(Math.PI * Math.max(0, Math.min(1, (along + len * 0.1) / (len * 1.15))));
      if (along < -len * 0.12 || along > len || Math.abs(across) > width * taper) continue;
      const t = Math.max(0, Math.min(1, along / len));
      let col = mixRgb(color, WHITE, 0.18 + (1 - t) * 0.18);
      if (Math.abs(across) < Math.max(0.45 * S, width * 0.12)) col = mixRgb(col, WHITE, 0.3);
      buf.blend(x, y, col, 245);
    }
  }
}

export function drawTip(c: RenderCtx) {
  const { cfg, buf, geo, pal, S, W, line, anim } = c;
  const p = geo.tipC, r = geo.tipSize, dir = geo.dir;
  if (cfg.tipStyle === 'none' || r <= 0.55) return;

  // A narrow setting connects the finial to the staff, giving each design a crafted silhouette.
  if (!['floating-gem', 'orbit-ring', 'celestial-cage', 'prism-vortex'].includes(cfg.tipStyle)) connector(c);

  switch (cfg.tipStyle) {
    case 'gem':
      setGem(c, p[0], p[1], r * 0.62, cfg.gemCut ?? 'brilliant', true);
      break;
    case 'crown': {
      const w = r * 0.92, baseY = p[1] + r * 0.35;
      line(p[0] - w, baseY, p[0] + w, baseY, r * 0.12, r * 0.08, pal.collarC, shadeRgb(pal.collarC, -0.35), mixRgb(pal.collarC, WHITE, 0.45));
      for (let i = -2; i <= 2; i++) {
        const bx = p[0] + i * w * 0.43, by = baseY;
        const tx = bx + dir[0] * r * (i === 0 ? 0.9 : 0.58), ty = by + dir[1] * r * (i === 0 ? 0.9 : 0.58) - r * (i === 0 ? 0.1 : 0.05);
        line(bx, by, tx, ty, r * 0.13, 0.35 * S, pal.collarC, shadeRgb(pal.collarC, -0.4), mixRgb(pal.collarC, WHITE, 0.58));
        buf.disc(tx, ty, Math.max(0.65 * S, r * 0.11), i % 2 ? pal.gem2 : pal.gemC, 255);
        buf.blend(tx - 0.35 * S, ty - 0.35 * S, WHITE, 210);
      }
      setGem(c, p[0], p[1] - r * 0.18, r * 0.28, 'round', false);
      break;
    }
    case 'spike':
      line(p[0] - dir[0] * r * 0.8, p[1] - dir[1] * r * 0.8, p[0] + dir[0] * r * 1.22, p[1] + dir[1] * r * 1.22,
        r * 0.32, 0.28 * S, pal.collarC, shadeRgb(pal.collarC, -0.48), mixRgb(pal.collarC, WHITE, 0.62));
      line(p[0] - dir[0] * r * 0.34, p[1] - dir[1] * r * 0.34, p[0] + dir[0] * r * 1.1, p[1] + dir[1] * r * 1.1,
        r * 0.07, 0.2 * S, shadeRgb(pal.collarC, -0.35), shadeRgb(pal.collarC, -0.35), WHITE, 170);
      buf.disc(p[0] + dir[0] * r * 1.18, p[1] + dir[1] * r * 1.18, Math.max(0.5 * S, r * 0.1), WHITE, 220);
      break;
    case 'flame': {
      for (let i = 0; i < 5; i++) {
        const f = i / 5, sway = Math.sin(f * 7 + (anim.on ? anim.t * anim.TAU : 0)) * r * 0.14;
        const cx = p[0] + sway, baseY = p[1] + r * 0.72 - f * r * 0.54;
        const rr = r * (0.5 - f * 0.075);
        for (let y = Math.floor(baseY - rr * 1.7); y <= baseY + rr; y++) {
          for (let x = Math.floor(cx - rr); x <= cx + rr; x++) {
            const d = ((x - cx) / rr) ** 2 + ((y - baseY) / (rr * 1.7)) ** 2;
            if (d > 1) continue;
            buf.blend(x, y, mixRgb(pal.gem2, pal.gemC, f), 230 * (1 - d * 0.35));
          }
        }
      }
      buf.blend(p[0] - r * 0.1, p[1] - r * 0.18, WHITE, 230);
      break;
    }
    case 'star':
      drawStar(c, p[0], p[1], r * 0.92, 5, pal.gemC);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        buf.disc(p[0] + Math.cos(a) * r * 1.08, p[1] + Math.sin(a) * r * 1.08, Math.max(0.5 * S, r * 0.08), pal.gem2, 220);
      }
      break;
    case 'halo':
      buf.ring(p[0], p[1], r * 0.82, Math.max(0.8 * S, r * 0.13), pal.haloC, 240);
      buf.ring(p[0], p[1], r * 0.82, Math.max(0.35 * S, r * 0.04), WHITE, 150);
      setGem(c, p[0], p[1], r * 0.28, 'round', false);
      break;
    case 'floating-gem': {
      const gx = p[0] + dir[0] * r * 1.15, gy = p[1] + dir[1] * r * 1.15;
      line(geo.headC[0] + dir[0] * geo.headR * 0.72, geo.headC[1] + dir[1] * geo.headR * 0.72, gx, gy,
        Math.max(0.55 * S, W * 0.008), Math.max(0.35 * S, W * 0.005), pal.collarC, shadeRgb(pal.collarC, -0.35), mixRgb(pal.collarC, WHITE, 0.5), 220);
      setGem(c, gx, gy, r * 0.5, 'diamond', false);
      buf.ring(gx, gy, r * 0.95, Math.max(0.45 * S, r * 0.06), pal.glowC, 115);
      break;
    }
    case 'cluster':
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const rr = r * (i === 0 ? 0.48 : 0.36);
        const x = p[0] + Math.cos(a) * r * 0.42, y = p[1] + Math.sin(a) * r * 0.38;
        paintCrystal(c, x, y, rr, i % 2 ? pal.gemC : mixRgb(pal.gemC, pal.gem2, 0.26), pal.gem2, i % 2 ? 0.08 : -0.08);
        buf.ring(x, y, rr * 0.7, Math.max(0.35 * S, rr * 0.06), pal.collarC, 145);
      }
      setGem(c, p[0], p[1], r * 0.38, 'round', false);
      break;
    case 'crystal-tip':
      paintCrystal(c, p[0], p[1], r * 0.92, pal.gemC, pal.gem2);
      line(p[0] - r * 0.48, p[1] + r * 0.25, p[0] + r * 0.4, p[1] - r * 0.45, 0.65 * S, 0.35 * S, WHITE, pal.gemC, WHITE, 175);
      break;
    case 'lantern': {
      const w = r * 0.58, h = r * 0.72;
      buf.ring(p[0], p[1] - h * 0.8, w * 0.4, Math.max(0.7 * S, W * 0.008), pal.collarC, 255);
      for (let y = Math.floor(p[1] - h * 0.58); y <= p[1] + h * 0.6; y++) {
        const f = (y - (p[1] - h * 0.58)) / (h * 1.18), hw = w * (0.35 + f * 0.65);
        for (let x = Math.floor(p[0] - hw); x <= p[0] + hw; x++) {
          const d = Math.abs(x - p[0]) / hw;
          let col = mixRgb(mixRgb(pal.gemC, WHITE, 0.4), pal.gemDark, d);
          if (Math.hypot(x - p[0], y - (p[1] + h * 0.12)) < h * 0.28) col = mixRgb(col, mixRgb(pal.gem2, WHITE, 0.6), 0.72);
          buf.set(x, y, col, 235);
        }
      }
      for (const dx of [-w * 0.55, w * 0.55]) line(p[0] + dx, p[1] - h * 0.54, p[0] + dx, p[1] + h * 0.6, 0.55 * S, 0.45 * S, pal.collarC, pal.collarC, WHITE, 240);
      break;
    }
    case 'orbit-ring': {
      const rr = r * 0.92, th = Math.max(0.65 * S, r * 0.09);
      for (let a = 0; a < Math.PI * 2; a += 0.045) {
        const x = p[0] + Math.cos(a) * rr, y = p[1] + Math.sin(a) * rr * 0.46;
        buf.disc(x, y, th * 0.48, Math.sin(a) > 0 ? mixRgb(pal.collarC, WHITE, 0.48) : shadeRgb(pal.collarC, -0.32), 245);
      }
      setGem(c, p[0], p[1], r * 0.42, 'round', false);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + (anim.on ? anim.t * anim.TAU : 0.4);
        setGem(c, p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr * 0.46, r * 0.14, 'diamond', false);
      }
      break;
    }
    case 'plume':
    case 'phoenix-plume': {
      const plumeCount = cfg.tipStyle === 'phoenix-plume' ? 5 : 3;
      const plumeLen = cfg.tipStyle === 'phoenix-plume' ? 1.35 : 1.1;
      for (let i = 0; i < plumeCount; i++) {
        const f = i / Math.max(1, plumeCount - 1), a = -Math.PI / 2 + (f - 0.5) * 0.95;
        const x1 = p[0] + Math.cos(a) * r * plumeLen, y1 = p[1] + Math.sin(a) * r * plumeLen;
        line(p[0], p[1], x1, y1, r * 0.11, 0.35 * S, mixRgb(pal.gemC, WHITE, 0.36), pal.gemC, WHITE, 248);
        for (let q = 1; q <= 7; q++) {
          const t = q / 8, bx = p[0] + (x1 - p[0]) * t, by = p[1] + (y1 - p[1]) * t;
          const spread = r * 0.25 * Math.sin(Math.PI * t) * (cfg.tipStyle === 'phoenix-plume' ? 1.25 : 1);
          for (const side of [-1, 1]) {
            line(bx, by, bx + side * spread, by - spread * 0.34, 0.55 * S, 0.28 * S,
              mixRgb(pal.gem2, WHITE, 0.38), pal.gemC, WHITE, 232);
          }
        }
      }
      if (cfg.tipStyle === 'phoenix-plume') {
        buf.disc(p[0], p[1] + r * 0.16, r * 0.3, mixRgb(pal.gemC, WHITE, 0.22));
        buf.blend(p[0], p[1] + r * 0.08, WHITE, 210);
      }
      break;
    }
    case 'bell': {
      const w = r * 0.68, h = r * 0.82;
      buf.ring(p[0], p[1] - h * 0.9, w * 0.32, Math.max(0.6 * S, W * 0.008), pal.collarC, 245);
      for (let y = Math.floor(p[1] - h * 0.62); y <= p[1] + h * 0.52; y++) {
        const f = (y - (p[1] - h * 0.62)) / (h * 1.14), hw = w * (0.28 + 0.72 * f);
        for (let x = Math.floor(p[0] - hw); x <= p[0] + hw; x++) {
          const e = Math.abs(x - p[0]) / Math.max(0.5, hw);
          buf.set(x, y, mixRgb(shadeRgb(pal.collarC, 0.48), shadeRgb(pal.collarC, -0.42), e), 255);
        }
      }
      for (let x = Math.floor(p[0] - w); x <= p[0] + w; x++) buf.set(x, p[1] + h * 0.57, shadeRgb(pal.collarC, -0.34), 255);
      buf.disc(p[0], p[1] + h * 0.72, Math.max(0.65 * S, r * 0.12), mixRgb(pal.gemC, WHITE, 0.32));
      for (let i = -1; i <= 1; i++) buf.blend(p[0] + i * w * 0.42, p[1] - h * 0.25, WHITE, 110);
      break;
    }
    case 'eye-tip': {
      const rx = r * 0.95, ry = r * 0.62;
      for (let y = Math.floor(p[1] - ry); y <= p[1] + ry; y++) {
        for (let x = Math.floor(p[0] - rx); x <= p[0] + rx; x++) {
          const d = ((x - p[0]) / rx) ** 2 + ((y - p[1]) / ry) ** 2;
          if (d > 1) continue;
          let col: RGB = mixRgb(WHITE, pal.gem2, 0.22);
          const iris = Math.hypot(x - p[0], y - p[1]) / (r * 0.42);
          if (iris < 1) col = mixRgb(pal.gem2, pal.gemC, iris);
          if (Math.hypot(x - p[0], y - p[1]) < r * 0.16) col = [12, 8, 18];
          if (d > 0.84) col = shadeRgb(col, -0.28);
          buf.set(x, y, col, 255);
        }
      }
      buf.blend(p[0] - rx * 0.24, p[1] - ry * 0.28, WHITE, 245);
      buf.ring(p[0], p[1], r * 0.92, Math.max(0.55 * S, r * 0.08), pal.collarC, 210);
      break;
    }
    case 'blade': {
      const len = r * 1.65, ex = p[0] + dir[0] * len, ey = p[1] + dir[1] * len;
      line(p[0] - dir[0] * r * 0.3, p[1] - dir[1] * r * 0.3, ex, ey,
        r * 0.29, 0.3 * S, mixRgb(pal.collarC, WHITE, 0.15), shadeRgb(pal.collarC, -0.45), mixRgb(pal.collarC, WHITE, 0.62));
      line(p[0], p[1], ex, ey, r * 0.055, 0.2 * S, shadeRgb(pal.collarC, -0.28), shadeRgb(pal.collarC, -0.28), WHITE, 180);
      buf.disc(p[0] - dir[0] * r * 0.28, p[1] - dir[1] * r * 0.28, r * 0.19, mixRgb(pal.gemC, WHITE, 0.3));
      buf.blend(ex, ey, WHITE, 225);
      break;
    }
    case 'gem-cluster':
      connector(c, 0.58);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
        const rr = r * (i === 0 ? 0.56 : 0.44);
        const x = p[0] + Math.cos(a) * r * 0.48, y = p[1] + Math.sin(a) * r * 0.42;
        paintCrystal(c, x, y, rr, i % 2 ? pal.gemC : mixRgb(pal.gemC, pal.gem2, 0.28), pal.gem2, i % 2 ? 0.11 : -0.11);
        buf.ring(x, y, rr * 0.82, Math.max(0.45 * S, rr * 0.06), pal.collarC, 145);
      }
      setGem(c, p[0], p[1], r * 0.42, 'round', false);
      break;
    case 'triple-prong': {
      setGem(c, p[0], p[1], r * 0.52, 'diamond', false);
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i / 3) * Math.PI * 2;
        const bx = p[0] + Math.cos(a) * r * 0.52, by = p[1] + Math.sin(a) * r * 0.52;
        const tx = p[0] + Math.cos(a) * r * 1.05, ty = p[1] + Math.sin(a) * r * 1.05;
        line(bx, by, tx, ty, r * 0.16, 0.42 * S, pal.collarC, shadeRgb(pal.collarC, -0.36), mixRgb(pal.collarC, WHITE, 0.58));
        buf.disc(tx, ty, Math.max(0.5 * S, r * 0.08), WHITE, 220);
      }
      buf.ring(p[0], p[1], r * 0.68, Math.max(0.5 * S, r * 0.07), pal.collarC, 200);
      break;
    }
    case 'lotus-crown':
    case 'living-bloom': {
      const n = cfg.tipStyle === 'living-bloom' ? 9 : 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const col = i % 2 ? mixRgb(pal.gemC, pal.gem2, 0.38) : pal.gemC;
        drawPetal(c, p[0] + Math.cos(a) * r * 0.22, p[1] + Math.sin(a) * r * 0.22, r * (cfg.tipStyle === 'living-bloom' ? 0.78 : 0.72), a, col);
        if (cfg.tipStyle === 'lotus-crown') {
          const tx = p[0] + Math.cos(a) * r * 0.82, ty = p[1] + Math.sin(a) * r * 0.82;
          buf.disc(tx, ty, Math.max(0.55 * S, r * 0.1), mixRgb(pal.collarC, WHITE, 0.35), 240);
        }
      }
      setGem(c, p[0], p[1], r * 0.31, 'round', false);
      for (let i = 0; i < 5; i++) buf.disc(p[0] + Math.cos(i * Math.PI * 0.4) * r * 0.13, p[1] + Math.sin(i * Math.PI * 0.4) * r * 0.13, r * 0.045, WHITE, 215);
      break;
    }
    case 'celestial-cage': {
      setGem(c, p[0], p[1], r * 0.55, 'round', false);
      const ringR = r * 0.9;
      for (let ring = 0; ring < 3; ring++) {
        const phase = (ring / 3) * Math.PI / 3 + (anim.on && anim.type === 'orbit' ? anim.t * anim.TAU * (ring % 2 ? -0.12 : 0.12) : 0);
        for (let a = 0; a < Math.PI * 2; a += 0.045) {
          const x = p[0] + Math.cos(a + phase) * ringR;
          const y = p[1] + Math.sin(a + phase) * ringR * (ring === 1 ? 0.42 : 0.72);
          buf.disc(x, y, Math.max(0.45 * S, r * 0.045), ring === 1 ? mixRgb(pal.collarC, WHITE, 0.4) : pal.collarC, 205);
        }
      }
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        const x = p[0] + Math.cos(a) * ringR, y = p[1] + Math.sin(a) * ringR * 0.72;
        buf.disc(x, y, r * 0.095, i % 2 ? pal.gem2 : pal.gemC, 255);
        buf.blend(x - 0.35 * S, y - 0.35 * S, WHITE, 205);
      }
      break;
    }
    case 'reliquary': {
      const w = r * 0.68, h = r * 1.08;
      // gold capsule frame with tapered shoulders
      for (let y = Math.floor(p[1] - h); y <= p[1] + h; y++) {
        const t = Math.abs(y - p[1]) / h;
        const hw = w * (0.72 + 0.28 * Math.cos(t * Math.PI * 0.5));
        for (let x = Math.floor(p[0] - hw); x <= p[0] + hw; x++) {
          const e = Math.abs(x - p[0]) / hw;
          if (e > 0.92) buf.set(x, y, e > 0.97 ? shadeRgb(pal.collarC, -0.28) : pal.collarC, 255);
          else if (t < 0.22 || t > 0.82) buf.set(x, y, shadeRgb(pal.collarC, e < 0.3 ? 0.18 : -0.12), 255);
        }
      }
      const capsuleR = r * 0.46;
      setGem(c, p[0], p[1], capsuleR, 'marquise', false);
      buf.ring(p[0], p[1], capsuleR * 1.12, Math.max(0.6 * S, r * 0.05), mixRgb(pal.collarC, WHITE, 0.35), 220);
      for (const sy of [-0.72, 0.72]) {
        const y = p[1] + h * sy;
        buf.disc(p[0], y, r * 0.14, pal.collarC, 255);
        buf.disc(p[0], y, r * 0.055, pal.gem2, 245);
      }
      break;
    }
    case 'dragon-fang': {
      const h = r * 1.25, w = r * 0.62;
      for (let y = Math.floor(p[1] - h); y <= p[1] + h * 0.72; y++) {
        const t = (y - (p[1] - h)) / (h * 1.72);
        const half = w * Math.sin(Math.PI * Math.min(0.98, t)) * (0.88 - t * 0.35);
        for (let x = Math.floor(p[0] - half); x <= p[0] + half; x++) {
          const e = Math.abs(x - p[0]) / Math.max(0.5, half);
          let col = mixRgb(mixRgb(pal.gemC, WHITE, 0.4), shadeRgb(pal.gemC, -0.4), e * 0.75 + t * 0.25);
          if (Math.abs(x - (p[0] - half * 0.35)) < Math.max(0.5 * S, w * 0.07)) col = mixRgb(col, WHITE, 0.4);
          buf.set(x, y, col, 255);
        }
      }
      // collar band and two tiny side spurs
      line(p[0] - w * 0.75, p[1] + h * 0.35, p[0] + w * 0.75, p[1] + h * 0.35, r * 0.12, r * 0.1, pal.collarC, shadeRgb(pal.collarC, -0.3), WHITE);
      for (const s of [-1, 1]) line(p[0] + s * w * 0.55, p[1] + h * 0.1, p[0] + s * w * 1.0, p[1] - h * 0.18, r * 0.09, 0.3 * S, pal.collarC, shadeRgb(pal.collarC, -0.35), WHITE);
      buf.blend(p[0] - w * 0.24, p[1] - h * 0.48, WHITE, 230);
      break;
    }
    case 'void-crown': {
      buf.disc(p[0], p[1], r * 0.78, [13, 7, 28], 248);
      buf.ring(p[0], p[1], r * 0.76, Math.max(0.65 * S, r * 0.08), pal.glowC, 235);
      buf.ring(p[0], p[1], r * 0.59, Math.max(0.5 * S, r * 0.045), mixRgb(pal.gem2, WHITE, 0.35), 200);
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i / 6) * Math.PI;
        const bx = p[0] + Math.cos(a) * r * 0.58, by = p[1] + Math.sin(a) * r * 0.58;
        const tx = p[0] + Math.cos(a) * r * (i % 2 ? 1.12 : 1.34), ty = p[1] + Math.sin(a) * r * (i % 2 ? 1.12 : 1.34);
        line(bx, by, tx, ty, r * 0.11, 0.28 * S, pal.collarC, shadeRgb(pal.collarC, -0.45), mixRgb(pal.gem2, WHITE, 0.42));
        buf.disc(tx, ty, Math.max(0.45 * S, r * 0.055), pal.gem2, 210);
      }
      buf.disc(p[0], p[1], r * 0.25, [4, 2, 12], 255);
      buf.blend(p[0] - r * 0.14, p[1] - r * 0.18, WHITE, 220);
      break;
    }
    case 'prism-vortex': {
      const turns = 2.3;
      for (let i = 0; i < 9; i++) {
        const t = i / 9, a = t * turns * Math.PI * 2 + (anim.on ? anim.t * anim.TAU * 0.18 : 0);
        const rr = r * (0.22 + t * 0.78), x = p[0] + Math.cos(a) * rr, y = p[1] + Math.sin(a) * rr * 0.72;
        const sz = r * (0.18 - t * 0.085);
        paintCrystal(c, x, y, sz, i % 2 ? pal.gemC : pal.gem2, WHITE, Math.sin(a) * 0.2);
        buf.disc(x - sz * 0.2, y - sz * 0.35, Math.max(0.45 * S, sz * 0.1), WHITE, 200);
      }
      setGem(c, p[0], p[1], r * 0.23, 'round', false);
      break;
    }
    case 'sun-disc': {
      const rr = r * 0.63;
      buf.disc(p[0], p[1], rr, mixRgb(pal.gemC, WHITE, 0.12), 255);
      buf.ring(p[0], p[1], rr * 0.9, Math.max(0.6 * S, r * 0.045), pal.collarC, 245);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const inner = rr * 1.12, outer = rr * (i % 2 ? 1.42 : 1.7);
        line(p[0] + Math.cos(a) * inner, p[1] + Math.sin(a) * inner, p[0] + Math.cos(a) * outer, p[1] + Math.sin(a) * outer,
          (i % 2 ? 0.6 : 0.9) * S, 0.3 * S, pal.collarC, shadeRgb(pal.collarC, -0.35), mixRgb(pal.gem2, WHITE, 0.6), 245);
      }
      setGem(c, p[0], p[1], rr * 0.46, 'round', false);
      break;
    }
    case 'moon-circlet': {
      const rr = r * 0.88;
      buf.ring(p[0], p[1], rr, Math.max(0.75 * S, r * 0.085), pal.collarC, 240);
      buf.ring(p[0], p[1], rr * 0.87, Math.max(0.4 * S, r * 0.035), mixRgb(pal.collarC, WHITE, 0.42), 190);
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 0.72;
        const x = p[0] + Math.cos(a) * rr, y = p[1] + Math.sin(a) * rr;
        setGem(c, x, y, r * (i === 0 ? 0.23 : 0.17), 'diamond', false);
      }
      buf.disc(p[0], p[1], r * 0.24, [14, 8, 28], 150);
      break;
    }
    case 'snow-globe-tip': {
      const gr = r * 0.68;
      buf.disc(p[0], p[1] - r * 0.1, gr, [203, 230, 255], 75);
      buf.ring(p[0], p[1] - r * 0.1, gr, Math.max(0.7 * S, r * 0.05), mixRgb([210, 232, 250], WHITE, 0.5), 235);
      buf.ring(p[0], p[1] - r * 0.1, gr * 0.9, Math.max(0.45 * S, r * 0.022), [235, 245, 255], 130);
      // little scene: snowcap + candle
      const treeX = p[0] - gr * 0.22, treeH = gr * 0.86, treeTop = p[1] - gr * 0.62;
      for (let i = 0; i < 3; i++) {
        const ty = treeTop + (treeH * i) / 3;
        const half = (i + 1) * gr * 0.1;
        line(treeX - half, ty, treeX + half, ty, gr * 0.05, gr * 0.035, [52, 132, 72], [30, 92, 48], [140, 210, 140]);
      }
      buf.disc(treeX, treeTop, gr * 0.05, [252, 220, 100], 240);
      for (let i = 0; i < 4; i++) line(p[0] + gr * 0.14 + i * gr * 0.08, p[1] - gr * 0.18, p[0] + gr * 0.14 + i * gr * 0.08, p[1] + gr * 0.3, gr * 0.04, gr * 0.04, [206, 72, 62], [150, 44, 40], [255, 165, 145], 240);
      buf.disc(p[0] + gr * 0.4, p[1] - gr * 0.08, gr * 0.07, [255, 232, 148], 245);
      const snowN = Math.round(9 + r * 0.4);
      for (let i = 0; i < snowN; i++) {
        const a = (i * 2.399 + cfg.seed * 0.011) % (Math.PI * 2), d = gr * (0.2 + (i % 4) * 0.16);
        buf.blend(p[0] + Math.cos(a) * d, p[1] - r * 0.1 + Math.sin(a) * d * 0.82, WHITE, 245);
      }
      // gold base
      for (let y = Math.floor(p[1] + gr * 0.38); y <= p[1] + gr * 0.72; y++) {
        const f = (y - (p[1] + gr * 0.38)) / (gr * 0.34);
        const half = gr * (0.68 - 0.16 * f);
        for (let x = Math.floor(p[0] - half); x <= p[0] + half; x++) {
          const e = Math.abs(x - p[0]) / Math.max(0.5, half);
          buf.set(x, y, mixRgb(shadeRgb(pal.collarC, 0.28), shadeRgb(pal.collarC, -0.3), e * 0.85), 255);
        }
      }
      line(p[0] - gr * 0.66, p[1] + gr * 0.44, p[0] + gr * 0.66, p[1] + gr * 0.44, 0.6 * S, 0.42 * S, mixRgb(pal.collarC, WHITE, 0.42), pal.collarC, WHITE, 215);
      buf.blend(p[0] - gr * 0.38, p[1] - gr * 0.42, WHITE, 225);
      line(p[0] - gr * 1.1, p[1] + gr * 0.72, p[0] + gr * 1.1, p[1] + gr * 0.72, 0.6 * S, 0.4 * S, pal.collarC, shadeRgb(pal.collarC, -0.3), WHITE, 230);
      buf.disc(p[0], p[1] - r * 0.5, Math.max(0.55 * S, r * 0.045), [240, 235, 230], 200);
      break;
    }
    case 'butterfly-tip': {
      // Jeweled butterfly finial with gold filigree rim.
      const bw = r * 0.9;
      for (const side of [-1, 1]) {
        for (let y = Math.floor(p[1] - r * 0.75); y <= p[1] + r * 0.15; y++) {
          for (let x = Math.floor(p[0] + side * 0.05 * r); side > 0 ? x <= p[0] + side * bw : x >= p[0] + side * bw; x++) {
            if (side < 0 && x > p[0] - 0.05 * r) continue;
            if (side > 0 && x < p[0] + 0.05 * r) continue;
            const nx = side * (x - p[0]) / bw, ny = (y - p[1]) / r;
            const span = 0.9 - ny * ny * 0.52;
            if (nx > span || ny > 0.14 - nx * 0.16) continue;
            let col = mixRgb(pal.gemC, pal.gem2, ny * 0.45 + 0.2);
            if (ny < -0.4) col = mixRgb(col, WHITE, 0.25);
            if (nx > span - 0.14) col = shadeRgb(col, -0.3);
            buf.set(x, y, col, 255);
          }
        }
        for (let i = 0; i < 2; i++) {
          const sx = p[0] + side * bw * (0.38 + i * 0.22), sy = p[1] - r * (0.44 + i * 0.07);
          buf.disc(sx, sy, r * 0.05, WHITE, 235);
          buf.disc(sx, sy, r * 0.026, pal.gem2, 240);
        }
      }
      line(p[0], p[1] - r * 0.7, p[0], p[1] + r * 0.5, r * 0.06, r * 0.04, pal.collarC, shadeRgb(pal.collarC, -0.3), WHITE);
      for (const side of [-1, 1]) {
        line(p[0], p[1] - r * 0.7, p[0] + side * r * 0.26, p[1] - r * 0.98, 0.5 * S, 0.35 * S, pal.collarC, pal.collarC, WHITE, 220);
        buf.disc(p[0] + side * r * 0.26, p[1] - r * 0.98, r * 0.03, WHITE, 230);
      }
      buf.disc(p[0], p[1] - r * 0.42, r * 0.09, mixRgb(pal.collarC, WHITE, 0.35), 240);
      setGem(c, p[0], p[1] - r * 0.12, r * 0.22, 'round', false);
      break;
    }
    case 'wing-pair': {
      // Twin angelic wings wrapping the finial.
      for (const side of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const f = i / 3;
          const bx = p[0] + side * r * (0.28 + i * 0.12), by = p[1] + r * (0.45 - i * 0.1);
          const tx = bx + side * r * (1.15 - f * 0.25), ty = by - r * (0.85 + f * 0.42);
          const col = mixRgb(pal.gem2, WHITE, 0.2 + f * 0.2);
          line(bx, by, tx, ty, r * (0.1 - f * 0.03), 0.35 * S, col, shadeRgb(pal.gemC, -0.2), WHITE, 238);
          for (let q = 1; q <= 5; q++) {
            const t = q / 6, fx = bx + (tx - bx) * t, fy = by + (ty - by) * t;
            for (const sd of [-1, 1]) buf.blend(fx + sd * r * 0.05, fy, mixRgb(col, WHITE, 0.4), 120);
          }
        }
        buf.disc(p[0] + side * r * 0.28, p[1] + r * 0.42, r * 0.1, pal.collarC, 240);
      }
      setGem(c, p[0], p[1] + r * 0.05, r * 0.42, cfg.gemCut ?? 'brilliant', false);
      buf.disc(p[0], p[1] + r * 0.42, r * 0.08, WHITE, 235);
      break;
    }
    case 'prism-trio': {
      // Three joined prisms spiraling around a core gem.
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i / 3) * Math.PI * 2;
        const cx = p[0] + Math.cos(a) * r * 0.42, cy = p[1] + Math.sin(a) * r * 0.4;
        paintCrystal(c, cx, cy, r * 0.42, i % 2 ? pal.gemC : mixRgb(pal.gemC, pal.gem2, 0.3), pal.gem2, i % 2 ? 0.16 : -0.16);
        for (let q = 0; q < 3; q++) {
          const aa = a + (q - 1) * 0.5;
          buf.blend(cx + Math.cos(aa) * r * 0.3, cy + Math.sin(aa) * r * 0.3, WHITE, 150);
        }
        buf.ring(cx, cy, r * 0.62, Math.max(0.45 * S, r * 0.045), pal.collarC, 150);
      }
      setGem(c, p[0], p[1], r * 0.33, cfg.gemCut ?? 'prism', false);
      for (let i = 0; i < 3; i++) buf.disc(p[0] + Math.cos(i * 2.1) * r * 0.7, p[1] + Math.sin(i * 2.1) * r * 0.62, Math.max(0.5 * S, r * 0.04), WHITE, 235);
      break;
    }
  }
}