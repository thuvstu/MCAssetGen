/* Outer glow · halo · wings · horns */
import { WHITE, clamp01, lerp, mixRgb, shadeRgb } from '../color';
import type { RenderCtx } from './context';

export function drawOuterGlow(c: RenderCtx) {
  const { cfg, buf, geo, pal, anim } = c;
  if (cfg.outerGlow <= 0.02) return;
  const { headC, headR, L, perp, baseThick, posAt } = geo;
  // Keep light local to the gem. Wide fog competes with halos, particles and the silhouette.
  const og = Math.min(0.68, cfg.outerGlow * anim.glowMul * anim.flicker);
  const gr = headR * (1.12 + og * 0.78);
  for (let y = Math.floor(headC[1] - gr); y <= headC[1] + gr; y++) {
    for (let x = Math.floor(headC[0] - gr); x <= headC[0] + gr; x++) {
      const d = Math.hypot(x - headC[0], y - headC[1]);
      if (d > gr) continue;
      buf.blend(x, y, pal.glowC, Math.pow(1 - d / gr, 2.8) * og * 92);
    }
  }
  // A shaft aura needs an actual shaft; free-floating relics glow from the head alone.
  if ((cfg.finish === 'enchanted' || cfg.motif !== 'none') && !geo.shaftless && L > 0) {
    for (let s = 0; s <= L; s += 1) {
      const [cx, cy] = posAt(s / L);
      buf.blend(cx + perp[0] * baseThick * 0.9, cy + perp[1] * baseThick * 0.9, pal.glowC, 6 * og);
    }
  }
  if (anim.lightningOn) {
    const gr2 = headR * 2.15;
    for (let y = Math.floor(headC[1] - gr2); y <= headC[1] + gr2; y++) {
      for (let x = Math.floor(headC[0] - gr2); x <= headC[0] + gr2; x++) {
        const d = Math.hypot(x - headC[0], y - headC[1]);
        if (d > gr2) continue;
        buf.blend(x, y, WHITE, Math.pow(1 - d / gr2, 4) * 140 * anim.intensity);
      }
    }
  }
}

export function drawHalo(c: RenderCtx) {
  const { cfg, buf, geo, pal, anim, S, W, N, small, line, ringHalo } = c;
  if (cfg.halo === 'none' || small) return;
  const { headC, headR } = geo;
  const haloC = pal.haloC;
  const hr = headR * 1.5;
  const ht = Math.max(1 * S, W * 0.015);
  if (cfg.halo === 'ring' || cfg.halo === 'rune-ring') {
    ringHalo(headC[0], headC[1], hr, ht, haloC, 235, 1);
    if (cfg.halo === 'rune-ring') {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + cfg.seed * 0.001;
        const rx = headC[0] + Math.cos(a) * hr, ry = headC[1] + Math.sin(a) * hr;
        buf.blend(rx, ry, WHITE, 235);
        buf.blend(rx + Math.cos(a) * 1.5, ry + Math.sin(a) * 1.5, haloC, 185);
        if (N >= 64) {
          buf.blend(rx - Math.sin(a), ry + Math.cos(a), haloC, 150);
          buf.blend(rx + Math.sin(a), ry - Math.cos(a), haloC, 150);
        }
      }
    }
  } else if (cfg.halo === 'double') {
    ringHalo(headC[0], headC[1], hr * 0.95, ht * 0.8, haloC, 225, 0.8);
    ringHalo(headC[0], headC[1], hr * 1.34, ht * 0.55, mixRgb(haloC, WHITE, 0.4), 185, 0.5);
  } else if (cfg.halo === 'eclipse') {
    ringHalo(headC[0], headC[1], hr, ht * 2.3, [10, 7, 18], 240, 0);
    ringHalo(headC[0], headC[1], hr - ht * 1.4, ht * 0.65, mixRgb(haloC, WHITE, 0.35), 225, 1);
    ringHalo(headC[0], headC[1], hr + ht * 1.4, ht * 0.55, haloC, 165, 0.8);
  } else if (cfg.halo === 'sunburst') {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + anim.spinA;
      const long = i % 2 === 0;
      const r0 = hr * 0.72, r1 = hr * (long ? 1.55 : 1.12);
      line(headC[0] + Math.cos(a) * r0, headC[1] + Math.sin(a) * r0, headC[0] + Math.cos(a) * r1, headC[1] + Math.sin(a) * r1,
        ht * (long ? 0.75 : 0.45), ht * 0.25, haloC, shadeRgb(haloC, -0.3), mixRgb(haloC, WHITE, 0.6));
    }
    ringHalo(headC[0], headC[1], hr * 0.68, ht * 0.5, mixRgb(haloC, WHITE, 0.45), 220, 1);
  } else if (cfg.halo === 'triple') {
    ringHalo(headC[0], headC[1], hr * 0.82, ht * 0.7, haloC, 230, 0.8);
    ringHalo(headC[0], headC[1], hr * 1.18, ht * 0.5, mixRgb(haloC, WHITE, 0.3), 195, 0.6);
    ringHalo(headC[0], headC[1], hr * 1.52, ht * 0.35, mixRgb(haloC, WHITE, 0.55), 155, 0.4);
  } else if (cfg.halo === 'hex-grid') {
    const hexR = hr * 1.05;
    for (let ring = 0; ring < 2; ring++) {
      const rr = hexR * (1 + ring * 0.34);
      const pts: Array<[number, number]> = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + anim.spinA * (ring ? -0.6 : 1) + Math.PI / 6;
        pts.push([headC[0] + Math.cos(a) * rr, headC[1] + Math.sin(a) * rr]);
      }
      const col = ring ? mixRgb(haloC, WHITE, 0.4) : haloC;
      for (let i = 0; i < 6; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % 6];
        line(x0, y0, x1, y1, ht * (ring ? 0.28 : 0.4), ht * (ring ? 0.28 : 0.4), col, shadeRgb(col, -0.3), WHITE, ring ? 165 : 225);
      }
      for (const [px, py] of pts) buf.blend(px, py, WHITE, ring ? 150 : 225);
    }
  } else if (cfg.halo === 'spiral') {
    const turns = 2.2, steps = 60;
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const a = f * Math.PI * 2 * turns + anim.spinA;
      const rr = hr * (0.55 + f * 0.95);
      buf.disc(headC[0] + Math.cos(a) * rr, headC[1] + Math.sin(a) * rr, ht * 0.4 * (1 - f * 0.55), mixRgb(haloC, WHITE, f * 0.5), 235 - f * 90);
    }
  } else if (cfg.halo === 'shattered') {
    const shards = 9;
    for (let i = 0; i < shards; i++) {
      const a = (i / shards) * Math.PI * 2 + anim.spinA * 0.5;
      const gap = 0.16 + (i % 3) * 0.05;
      const a0 = a - gap, a1 = a + gap;
      const rr = hr * (1 + (i % 2 ? 0.14 : -0.08));
      const steps = 6;
      for (let k = 0; k <= steps; k++) {
        const aa = a0 + (a1 - a0) * (k / steps);
        buf.disc(headC[0] + Math.cos(aa) * rr, headC[1] + Math.sin(aa) * rr, ht * 0.45, i % 2 ? mixRgb(haloC, WHITE, 0.35) : haloC, 235);
      }
    }
  } else if (cfg.halo === 'lens-flare') {
    // bright key light: center star + cross + horizontal streak with color shifts
    const cx = headC[0], cy = headC[1];
    const rr = hr * 2.1;
    line(cx - rr, cy, cx + rr, cy, ht * 0.5, ht * 0.28, mixRgb(haloC, WHITE, 0.75), haloC, WHITE, 245);
    line(cx, cy - rr * 0.5, cx, cy + rr * 0.5, ht * 0.35, ht * 0.22, mixRgb(haloC, WHITE, 0.55), haloC, WHITE, 225);
    buf.disc(cx, cy, ht * 1.9, WHITE, 230);
    buf.disc(cx, cy, ht * 1.1, mixRgb(haloC, WHITE, 0.4), 245);
    for (let i = -3; i <= 3; i++) {
      const len = ht * (1.2 + (i % 2 ? 0.5 : 0.9));
      line(cx + i * ht * 5.5, cy - len * 0.3, cx + i * ht * 5.5, cy + len * 0.3, 0.5 * S, 0.4 * S, mixRgb(haloC, WHITE, 0.4), haloC, WHITE, 190 - Math.abs(i) * 24);
    }
    buf.ring(cx, cy, rr * 0.5, ht * 0.28, mixRgb(haloC, WHITE, 0.5), 165);
  }
  if (anim.on && anim.type === 'holy-rays') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + anim.spinA * 1.5;
      const r0 = hr * 1.18, r1 = hr * 1.95;
      line(headC[0] + Math.cos(a) * r0, headC[1] + Math.sin(a) * r0, headC[0] + Math.cos(a) * r1, headC[1] + Math.sin(a) * r1,
        ht * 0.45, ht * 0.12, mixRgb(haloC, WHITE, 0.5), haloC, WHITE, 180 * anim.intensity);
    }
  }
}

export function drawWings(c: RenderCtx) {
  const { cfg, buf, geo, pal, anim, S, small, line } = c;
  if (cfg.wings === 'none' || small) return;
  const { headC, headR } = geo;
  const wingC = pal.wingC;
  const span = headR * (2.1 + anim.wingFlap * 0.35);
  const wDark = shadeRgb(wingC, -0.4), wLight = shadeRgb(wingC, 0.5);
  for (const side of [-1, 1]) {
    const shX = headC[0] + side * headR * 0.35;
    const shY = headC[1] + headR * (0.25 + anim.wingFlap * 0.22);
    if (cfg.wings === 'angel' || cfg.wings === 'seraph') {
      const n = cfg.wings === 'seraph' ? 5 : 4;
      for (let i = 0; i < n; i++) {
        const f = i / Math.max(1, n - 1);
        const bx = shX + side * headR * 0.1 * i, by = shY - i * headR * 0.22;
        const tx = bx + side * span * (1 - f * 0.42), ty = by - headR * (0.55 + f * 0.5);
        line(bx, by, tx, ty, headR * 0.2 * (1 - f * 0.3), 0.6 * S, wingC, wDark, wLight);
        if (cfg.wings === 'seraph') line(bx + side * 1, by - 1, tx, ty, 0.5 * S, 0.4 * S, [255, 215, 130], [200, 150, 60], [255, 235, 190]);
      }
    } else if (cfg.wings === 'bat') {
      const tipX = shX + side * span, tipY = shY - headR * 1.25;
      const botX = shX + side * span * 0.42, botY = shY + headR * 0.35;
      const minX = Math.min(shX, tipX, botX), maxX = Math.max(shX, tipX, botX);
      const minY = Math.min(shY, tipY, botY), maxY = Math.max(shY, tipY, botY);
      const edge = (x: number, y: number, ax: number, ay: number, bx: number, by: number) => (bx - ax) * (y - ay) - (by - ay) * (x - ax);
      for (let y = Math.floor(minY); y <= maxY; y++) {
        for (let x = Math.floor(minX); x <= maxX; x++) {
          const e1 = edge(x, y, shX, shY, tipX, tipY), e2 = edge(x, y, tipX, tipY, botX, botY), e3 = edge(x, y, botX, botY, shX, shY);
          const inside = side > 0 ? e1 >= 0 && e2 >= 0 && e3 >= 0 : e1 <= 0 && e2 <= 0 && e3 <= 0;
          if (!inside) continue;
          let cut = false;
          for (let k = 0; k < 3; k++) {
            const f = 0.25 + k * 0.25;
            if (Math.hypot(x - lerp(tipX, botX, f), y - lerp(tipY, botY, f)) < headR * 0.28) { cut = true; break; }
          }
          if (cut) continue;
          const sf = clamp01((x - minX) / Math.max(1, maxX - minX));
          buf.blend(x, y, mixRgb(shadeRgb(wingC, -0.32), shadeRgb(wingC, 0.14), sf), 255);
        }
      }
      line(shX, shY, tipX, tipY, 1.2 * S, 0.7 * S, wLight, wDark, WHITE);
      line(shX, shY, botX, botY, 1 * S, 0.6 * S, shadeRgb(wingC, 0.2), wDark, wLight);
    } else if (cfg.wings === 'fae') {
      for (let i = 0; i < 2; i++) {
        const ex = shX + side * span * (0.45 + i * 0.3), ey = shY - headR * (0.35 + i * 0.4);
        const erx = headR * (0.55 - i * 0.12), ery = headR * (0.8 - i * 0.15);
        for (let y = Math.floor(ey - ery); y <= ey + ery; y++) {
          for (let x = Math.floor(ex - erx); x <= ex + erx; x++) {
            const dd = ((x - ex) / erx) ** 2 + ((y - ey) / ery) ** 2;
            if (dd > 1) continue;
            buf.blend(x, y, mixRgb(wingC, WHITE, 0.45 * (1 - dd)), dd < 0.7 ? 205 : 125);
            if (Math.abs(dd - 0.85) < 0.18) buf.blend(x, y, WHITE, 120);
          }
        }
      }
    } else if (cfg.wings === 'blade') {
      for (let i = 0; i < 2; i++) {
        const bx = shX, by = shY - i * headR * 0.3;
        const tx = bx + side * span * (1.05 - i * 0.25), ty = by - headR * (0.9 - i * 0.15);
        line(bx, by, tx, ty, headR * 0.16, 0.4 * S, wingC, shadeRgb(wingC, -0.45), WHITE);
        line(bx, by + 1, tx, ty + 1, 0.6 * S, 0.3 * S, WHITE, WHITE, WHITE);
      }
    } else if (cfg.wings === 'mech') {
      // segmented mechanical plates with a pivot joint
      for (let i = 0; i < 3; i++) {
        const f = i / 2;
        const bx = shX + side * headR * 0.18 * i, by = shY - i * headR * 0.3;
        const tx = bx + side * span * (0.95 - f * 0.28), ty = by - headR * (0.35 + f * 0.55);
        line(bx, by, tx, ty, headR * (0.2 - f * 0.05), headR * 0.07, wingC, shadeRgb(wingC, -0.45), shadeRgb(wingC, 0.55));
        // panel seam + rivet
        line(bx, by, tx, ty, 0.5 * S, 0.3 * S, shadeRgb(wingC, -0.55), shadeRgb(wingC, -0.55), shadeRgb(wingC, -0.4), 200);
        buf.disc(bx + side * headR * 0.1, by, Math.max(0.7 * S, headR * 0.07), mixRgb(pal.gemC, WHITE, 0.4));
      }
    } else if (cfg.wings === 'crystal') {
      for (let i = 0; i < 4; i++) {
        const f = i / 3;
        const bx = shX, by = shY - i * headR * 0.24;
        const tx = bx + side * span * (1 - f * 0.34), ty = by - headR * (0.5 + f * 0.62);
        const c0 = mixRgb(pal.gemC, WHITE, 0.25 + f * 0.25);
        line(bx, by, tx, ty, headR * 0.14 * (1 - f * 0.3), 0.5 * S, c0, shadeRgb(c0, -0.45), WHITE, 240);
        buf.disc(tx, ty, Math.max(0.7 * S, headR * 0.06), WHITE, 210);
      }
    } else if (cfg.wings === 'flame') {
      for (let i = 0; i < 4; i++) {
        const f = i / 3;
        const bx = shX, by = shY - i * headR * 0.2;
        const tipX = bx + side * span * (0.95 - f * 0.3);
        const tipY = by - headR * (0.6 + f * 0.7);
        const midX = bx + side * span * 0.45, midY = by - headR * 0.15;
        const col = mixRgb(pal.gemC, pal.gem2, f);
        for (let q = 0; q <= 14; q++) {
          const t = q / 14;
          const x = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * midX + t * t * tipX;
          const y = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * midY + t * t * tipY;
          buf.disc(x, y, Math.max(0.6 * S, headR * 0.16 * (1 - t * 0.85)), mixRgb(col, WHITE, t * 0.55), 240);
        }
      }
    } else if (cfg.wings === 'leafwing') {
      for (let i = 0; i < 3; i++) {
        const f = i / 2;
        const ex = shX + side * span * (0.5 + f * 0.28), ey = shY - headR * (0.25 + f * 0.5);
        const erx = headR * (0.62 - f * 0.12), ery = headR * (0.3 + f * 0.08);
        for (let y = Math.floor(ey - ery); y <= ey + ery; y++) {
          for (let x = Math.floor(ex - erx); x <= ex + erx; x++) {
            const dd = ((x - ex) / erx) ** 2 + ((y - ey) / ery) ** 2;
            if (dd > 1) continue;
            buf.blend(x, y, mixRgb(shadeRgb(wingC, 0.2), shadeRgb(wingC, -0.3), dd), 250);
          }
        }
        line(ex - side * erx, ey, ex + side * erx, ey, 0.6 * S, 0.4 * S, mixRgb(wingC, WHITE, 0.45), wingC, WHITE, 220);
      }
    } else if (cfg.wings === 'peacock') {
      // fan of graduated quills with jeweled ocelli
      const quills = 6;
      for (let i = 0; i < quills; i++) {
        const f = i / (quills - 1);
        const a = -Math.PI / 2 + (f - 0.5) * 0.85 * side;
        const bx = shX, by = shY;
        const tx = bx + Math.cos(a) * span * 1.05, ty = by + Math.sin(a) * span * 1.05;
        const grad = mixRgb(wingC, pal.gemC, 0.35 + f * 0.3);
        line(bx, by, tx, ty, headR * (0.1 - f * 0.04), 0.55 * S, grad, shadeRgb(grad, -0.3), mixRgb(grad, WHITE, 0.4), 235);
        // ocellus eye
        buf.disc(tx, ty, headR * 0.14, mixRgb(pal.gem2, WHITE, 0.15), 250);
        buf.disc(tx, ty, headR * 0.08, mixRgb(pal.gemC, WHITE, 0.25), 250);
        buf.disc(tx, ty, headR * 0.035, WHITE, 235);
      }
    } else if (cfg.wings === 'cape') {
      // flowing silk drape that ribbons outward and downward
      const steps = 16;
      let lastX = shX, lastY = shY;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const sway = Math.sin(t * 5.2 + c.cfg.seed * 0.02) * headR * 0.12;
        const x = shX + side * (span * t * 0.75) + sway;
        const y = shY + span * t * 0.85 + t * t * headR * 0.4;
        line(lastX, lastY, x, y, headR * (0.2 - t * 0.12), headR * (0.16 - t * 0.1), wingC, shadeRgb(wingC, -0.35), shadeRgb(wingC, 0.4), 245);
        if (i % 3 === 0) line(lastX, lastY, x, y, 0.55 * S, 0.4 * S, mixRgb(wingC, WHITE, 0.5), wingC, WHITE, 200);
        lastX = x; lastY = y;
      }
      line(lastX - headR * 0.14, lastY, lastX + headR * 0.14, lastY, 0.6 * S, 0.35 * S, mixRgb(pal.collarC, WHITE, 0.4), pal.collarC, WHITE, 240);
      const gemX = lastX, gemY = lastY + headR * 0.02;
      buf.disc(gemX, gemY, Math.max(0.5 * S, headR * 0.06), mixRgb(pal.gemC, WHITE, 0.3), 240);
    }
  }
}

export function drawHorns(c: RenderCtx) {
  const { cfg, buf, geo, pal, S, small } = c;
  if (!cfg.horns || small) return;
  const { headC, headR, dir, perp } = geo;
  for (const side of [-1, 1]) {
    const bx = headC[0] + perp[0] * side * headR * 0.75 - dir[0] * headR * 0.25;
    const by = headC[1] + perp[1] * side * headR * 0.75 - dir[1] * headR * 0.25;
    const tx = bx + side * headR * 0.85 - dir[0] * headR * 0.55, ty = by - headR * 0.95;
    const mx = bx + side * headR * 0.7, my = by - headR * 0.35;
    for (let q = 0; q <= 20; q++) {
      const t = q / 20;
      const x = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * mx + t * t * tx;
      const y = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * my + t * t * ty;
      const w = Math.max(0.6 * S, headR * 0.14 * (1 - t * 0.75));
      let col = t > 0.8 ? shadeRgb(pal.hornC, -0.25) : pal.hornC;
      if (Math.sin(t * 22) > 0.7) col = shadeRgb(col, -0.18);
      buf.disc(x, y, w, col);
    }
  }
}
