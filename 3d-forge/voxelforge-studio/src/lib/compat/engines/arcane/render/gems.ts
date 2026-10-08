/*
 * Gem atelier: cut/facet overlays, gem mounts, and secondary jewels.
 * The gem is intentionally a dedicated stage so the "hero stone" can be
 * designed independently from the surrounding tip and staff silhouette.
 */
import { RGB, WHITE, clamp01, mixRgb, shadeRgb, smoothstep } from '../color';
import type { RenderCtx, Vec } from './context';
import type { GemCut } from '../types';

function drawFacetRay(c: RenderCtx, center: Vec, radius: number, angle: number, alpha = 140) {
  const { line, pal, S } = c;
  const [cx, cy] = center;
  const x0 = cx + Math.cos(angle) * radius * 0.15;
  const y0 = cy + Math.sin(angle) * radius * 0.15;
  const x1 = cx + Math.cos(angle) * radius * 0.92;
  const y1 = cy + Math.sin(angle) * radius * 0.92;
  line(x0, y0, x1, y1, Math.max(0.35 * S, radius * 0.018), Math.max(0.25 * S, radius * 0.01),
    mixRgb(pal.gem2, WHITE, 0.55), shadeRgb(pal.gemC, -0.16), WHITE, alpha);
}

function cutOverlay(c: RenderCtx) {
  const { cfg, buf, geo, pal, S, line } = c;
  const { headC: center, headR: radius } = geo;
  const { gemC, gem2 } = pal;
  if (radius < 3 * S) return;

  switch (cfg.gemCut ?? 'brilliant') {
    case 'brilliant':
      for (let i = 0; i < 8; i++) drawFacetRay(c, center, radius, (i / 8) * Math.PI * 2 + Math.PI / 8, 145);
      buf.disc(center[0], center[1], radius * 0.11, mixRgb(gem2, WHITE, 0.7), 210);
      break;
    case 'emerald': {
      const r = radius * 0.68, chamfer = r * 0.25;
      const pts: Vec[] = [
        [center[0] - r + chamfer, center[1] - r], [center[0] + r - chamfer, center[1] - r],
        [center[0] + r, center[1] - r + chamfer], [center[0] + r, center[1] + r - chamfer],
        [center[0] + r - chamfer, center[1] + r], [center[0] - r + chamfer, center[1] + r],
        [center[0] - r, center[1] + r - chamfer], [center[0] - r, center[1] - r + chamfer],
      ];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        line(ax, ay, bx, by, 0.7 * S, 0.7 * S, mixRgb(gem2, WHITE, 0.5), gemC, WHITE, 195);
      }
      line(center[0] - r * 0.5, center[1], center[0] + r * 0.5, center[1], 0.7 * S, 0.5 * S, gem2, gemC, WHITE, 150);
      line(center[0], center[1] - r * 0.5, center[0], center[1] + r * 0.5, 0.7 * S, 0.5 * S, gem2, gemC, WHITE, 150);
      break;
    }
    case 'marquise':
      for (const a of [-Math.PI / 2, Math.PI / 2]) {
        const x0 = center[0] + Math.cos(a) * radius * 0.95, y0 = center[1] + Math.sin(a) * radius * 0.95;
        for (let i = -2; i <= 2; i++) {
          const x1 = center[0] + Math.cos(a + Math.PI + i * 0.2) * radius * 0.75;
          const y1 = center[1] + Math.sin(a + Math.PI + i * 0.2) * radius * 0.75;
          line(x0, y0, x1, y1, 0.5 * S, 0.4 * S, mixRgb(gem2, WHITE, 0.55), gemC, WHITE, 155);
        }
      }
      break;
    case 'cabochon':
      // Smooth dome: narrow, high-gloss crescent and a soft lower bounce.
      for (let y = Math.floor(center[1] - radius * 0.72); y <= center[1] - radius * 0.18; y++) {
        for (let x = Math.floor(center[0] - radius * 0.6); x <= center[0] - radius * 0.08; x++) {
          const d = ((x - (center[0] - radius * 0.32)) / (radius * 0.36)) ** 2
            + ((y - (center[1] - radius * 0.48)) / (radius * 0.15)) ** 2;
          if (d < 1) buf.blend(x, y, WHITE, (1 - d) * 165);
        }
      }
      buf.blend(center[0] + radius * 0.2, center[1] + radius * 0.55, gem2, 70);
      break;
    case 'star-cut':
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        drawFacetRay(c, center, radius, a, i % 2 === 0 ? 210 : 110);
      }
      buf.disc(center[0], center[1], radius * 0.17, WHITE, 235);
      break;
    case 'opal': {
      // Iridescent flecks in a small, repeatable mosaic.
      const hues: RGB[] = [gem2, [255, 160, 220], [100, 245, 230], [255, 225, 140]];
      const step = Math.max(2, Math.round(S * 1.15));
      for (let y = center[1] - radius * 0.72; y <= center[1] + radius * 0.72; y += step) {
        for (let x = center[0] - radius * 0.72; x <= center[0] + radius * 0.72; x += step) {
          if (Math.hypot(x - center[0], y - center[1]) > radius * 0.72) continue;
          const h = (Math.floor((x + cfg.seed) / step) * 7 + Math.floor((y - cfg.seed) / step) * 11) % hues.length;
          buf.blend(x, y, hues[(h + hues.length) % hues.length] as [number, number, number], 110);
          if ((Math.floor(x + y) + cfg.seed) % 3 === 0) buf.blend(x + S, y, WHITE, 90);
        }
      }
      break;
    }
    case 'prism':
      for (let y = center[1] - radius * 0.8; y <= center[1] + radius * 0.8; y += Math.max(2, S * 1.25)) {
        const shift = Math.sin((y - center[1]) / radius * Math.PI) * radius * 0.45;
        const col: RGB = y < center[1] - radius * 0.25 ? [248, 113, 113]
          : y < center[1] ? [250, 204, 21]
            : y < center[1] + radius * 0.25 ? [74, 222, 128] : [96, 165, 250];
        line(center[0] - shift, y, center[0] + shift, y, 0.6 * S, 0.6 * S, col, col, WHITE, 125);
      }
      break;
    case 'rose-cut':
      for (let i = 1; i <= 4; i++) {
        buf.ring(center[0], center[1], radius * (i * 0.16), Math.max(0.45 * S, radius * 0.012),
          i % 2 ? mixRgb(gem2, WHITE, 0.55) : shadeRgb(gemC, -0.12), 145);
      }
      for (let i = 0; i < 6; i++) drawFacetRay(c, center, radius * 0.82, (i / 6) * Math.PI * 2, 110);
      break;
  }
}

function drawPrimaryMount(c: RenderCtx) {
  const { cfg, buf, geo, pal, S, W, line } = c;
  const { headC: center, headR: r } = geo;
  const { collarC, gemC, gem2 } = pal;
  const width = Math.max(0.7 * S, W * 0.009);

  switch (cfg.gemMount ?? 'claw') {
    case 'claw': {
      const count = cfg.rarity === 'divine' || cfg.rarity === 'mythic' ? 6 : 4;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + Math.PI / 4;
        const bx = center[0] + Math.cos(a) * r * 1.12, by = center[1] + Math.sin(a) * r * 1.12;
        const mx = center[0] + Math.cos(a) * r * 0.92, my = center[1] + Math.sin(a) * r * 0.92;
        const tx = center[0] + Math.cos(a) * r * 0.72, ty = center[1] + Math.sin(a) * r * 0.72;
        line(bx, by, mx, my, width * 2.1, width * 1.35, collarC, shadeRgb(collarC, -0.35), mixRgb(collarC, WHITE, 0.45), 245);
        line(mx, my, tx, ty, width * 1.35, width * 0.5, collarC, shadeRgb(collarC, -0.3), WHITE, 250);
        buf.disc(bx, by, width * 0.85, mixRgb(gem2, WHITE, 0.35), 240);
      }
      break;
    }
    case 'bezel':
      buf.ring(center[0], center[1], r * 1.06, width * 1.8, shadeRgb(collarC, -0.16), 245);
      buf.ring(center[0], center[1], r * 1.06, width * 0.68, mixRgb(collarC, WHITE, 0.45), 225);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        buf.disc(center[0] + Math.cos(a) * r * 1.07, center[1] + Math.sin(a) * r * 1.07,
          Math.max(0.55 * S, width * 0.55), gemC, 210);
      }
      break;
    case 'cage':
      buf.ring(center[0], center[1], r * 1.12, width, collarC, 220);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI + Math.PI / 4;
        line(center[0] + Math.cos(a) * r * 1.05, center[1] + Math.sin(a) * r * 1.05,
          center[0] - Math.cos(a) * r * 1.05, center[1] - Math.sin(a) * r * 1.05,
          width * 0.72, width * 0.72, collarC, shadeRgb(collarC, -0.25), mixRgb(collarC, WHITE, 0.4), 215);
      }
      break;
    case 'floating':
      // Disconnected mount arcs imply a levitating stone.
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const cx = center[0] + Math.cos(a) * r * 1.32, cy = center[1] + Math.sin(a) * r * 1.32;
        buf.disc(cx, cy, width * 1.5, collarC, 230);
        line(cx, cy, center[0] + Math.cos(a) * r * 0.88, center[1] + Math.sin(a) * r * 0.88,
          width * 0.5, width * 0.35, mixRgb(gem2, WHITE, 0.5), gem2, WHITE, 125);
      }
      break;
    case 'halo':
      buf.ring(center[0], center[1], r * 1.22, width, mixRgb(collarC, WHITE, 0.3), 220);
      break;
    case 'petal':
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const px = center[0] + Math.cos(a) * r * 1.05, py = center[1] + Math.sin(a) * r * 1.05;
        buf.disc(px, py, r * 0.2, mixRgb(collarC, WHITE, 0.2), 230);
        buf.blend(px, py, gem2, 150);
      }
      break;
  }
}

function drawSecondaryGems(c: RenderCtx) {
  const { cfg, buf, geo, pal, S, line } = c;
  const { headC, headR, perp, collarPos } = geo;
  const count = Math.max(0, Math.min(8, cfg.gemCount ?? 0));
  if (count <= 0) return;
  const scale = headR * (cfg.gemScale ?? 0.16);
  const gold = pal.collarC;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.PI / 4;
    const r = headR * (1.22 + (i % 2) * 0.13);
    const x = headC[0] + Math.cos(a) * r;
    const y = headC[1] + Math.sin(a) * r * 0.84;
    // tiny articulated connector + jeweled setting
    const anchorX = headC[0] + Math.cos(a) * headR * 0.82;
    const anchorY = headC[1] + Math.sin(a) * headR * 0.82;
    if (cfg.gemMount === 'floating') {
      line(anchorX, anchorY, x, y, 0.55 * S, 0.35 * S, pal.gem2, gold, WHITE, 155);
    } else {
      line(collarPos[0] + perp[0] * (i - (count - 1) / 2) * geo.collarW * 0.35,
        collarPos[1] + perp[1] * (i - (count - 1) / 2) * geo.collarW * 0.35,
        x, y, 0.65 * S, 0.35 * S, gold, shadeRgb(gold, -0.25), mixRgb(gold, WHITE, 0.45), 210);
    }
    const cuts = [cfg.gemCut ?? 'brilliant', 'emerald', 'marquise', 'rose-cut', 'star-cut', 'opal', 'prism', 'cabochon'] as const;
    paintFaceted(c, x, y, scale, cuts[i % cuts.length], i);
    const mount = cfg.gemMount ?? 'claw';
    const mountWidth = Math.max(0.45 * S, scale * 0.12);
    if (mount === 'bezel') {
      buf.ring(x, y, scale * 1.12, mountWidth * 1.45, shadeRgb(gold, -0.12), 240);
      buf.ring(x, y, scale * 1.12, mountWidth * 0.48, mixRgb(gold, WHITE, 0.48), 220);
      for (let k = 0; k < 8; k++) {
        const aa = (k / 8) * Math.PI * 2;
        buf.disc(x + Math.cos(aa) * scale * 1.12, y + Math.sin(aa) * scale * 1.12, mountWidth * 0.42, WHITE, 200);
      }
    } else if (mount === 'cage') {
      buf.ring(x, y, scale * 1.18, mountWidth, gold, 225);
      for (let k = 0; k < 3; k++) {
        const aa = (k / 3) * Math.PI;
        line(x + Math.cos(aa) * scale * 1.12, y + Math.sin(aa) * scale * 1.12,
          x - Math.cos(aa) * scale * 1.12, y - Math.sin(aa) * scale * 1.12,
          mountWidth * 0.58, mountWidth * 0.42, gold, shadeRgb(gold, -0.28), WHITE, 210);
      }
    } else if (mount === 'halo') {
      buf.ring(x, y, scale * 1.2, mountWidth * 0.65, pal.glowC, 210);
      buf.ring(x, y, scale * 1.06, mountWidth * 0.32, WHITE, 155);
      for (let k = 0; k < 4; k++) {
        const aa = (k / 4) * Math.PI * 2 + Math.PI / 4;
        buf.disc(x + Math.cos(aa) * scale * 1.24, y + Math.sin(aa) * scale * 1.24, mountWidth * 0.6, gold, 230);
      }
    } else if (mount === 'petal') {
      for (let k = 0; k < 6; k++) {
        const aa = (k / 6) * Math.PI * 2;
        const px = x + Math.cos(aa) * scale * 1.02, py = y + Math.sin(aa) * scale * 1.02;
        buf.disc(px, py, scale * 0.22, mixRgb(gold, WHITE, 0.22), 220);
        buf.disc(px, py, scale * 0.1, pal.gem2, 190);
      }
    } else if (mount === 'claw') {
      buf.ring(x, y, scale * 1.12, mountWidth * 0.42, shadeRgb(gold, -0.16), 205);
      for (let k = 0; k < 4; k++) {
        const aa = (k / 4) * Math.PI * 2 + Math.PI / 4;
        const bx = x + Math.cos(aa) * scale * 1.26, by = y + Math.sin(aa) * scale * 1.26;
        const tx = x + Math.cos(aa) * scale * 0.72, ty = y + Math.sin(aa) * scale * 0.72;
        line(bx, by, tx, ty, mountWidth * 0.85, mountWidth * 0.28, gold, shadeRgb(gold, -0.3), mixRgb(gold, WHITE, 0.5), 245);
      }
    } else {
      buf.ring(x, y, scale * 1.12, mountWidth, gold, 220);
    }
  }
}

/** Tiny coherent faceted gem used by pavé/cluster settings. */
export function paintFaceted(c: RenderCtx, cx: number, cy: number, r: number, shape: GemCut | 'diamond' | 'marquise' | 'round', salt = 0) {
  const { buf, pal, edgeDarken } = c;
  if (r < 0.5) return;
  for (let y = Math.floor(cy - r * 1.25 - 1); y <= cy + r * 1.25 + 1; y++) {
    for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const dx = (x - cx) / r, dy = (y - cy) / (r * 1.25);
      const d = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      let inside = d <= 1;
      if (shape === 'diamond' || shape === 'brilliant') inside = Math.abs(dx) + Math.abs(dy) * 0.75 <= 1;
      else if (shape === 'marquise') inside = d <= 0.94 && Math.abs(dx) <= 0.7 + 0.3 * Math.abs(dy);
      else if (shape === 'emerald') inside = Math.max(Math.abs(dx), Math.abs(dy)) <= 0.93 && Math.abs(dx) + Math.abs(dy) <= 1.62;
      else if (shape === 'star-cut') {
        const rr = 0.48 + 0.52 * Math.pow(0.5 + 0.5 * Math.cos(5 * a - Math.PI / 2), 0.45);
        inside = d <= rr;
      } else if (shape === 'cabochon' || shape === 'opal' || shape === 'rose-cut' || shape === 'round') inside = d <= 0.94;
      else if (shape === 'prism') inside = Math.abs(dx) * 0.82 + Math.abs(dy) <= 1;
      if (!inside) continue;
      const facet = Math.floor(((a + Math.PI + salt * 0.2) / (Math.PI * 2)) * 6) % 6;
      const light = clamp01((-dx - dy) * 0.36 + 0.48);
      let col: RGB = mixRgb(shadeRgb(pal.gemC, -0.38), mixRgb(pal.gemC, WHITE, 0.38), light);
      if (shape === 'emerald') {
        const step = Math.floor((Math.abs(dx) * 2 + Math.abs(dy) * 1.3 + salt * 0.13) * 3) % 3;
        if (step === 0) col = mixRgb(col, pal.gem2, 0.22);
        if (Math.abs(dx) > 0.68 || Math.abs(dy) > 0.67) col = shadeRgb(col, 0.12);
        if (Math.abs(dx) > 0.89 || Math.abs(dy) > 0.88) col = shadeRgb(col, -0.24);
      } else if (shape === 'cabochon' || shape === 'round') {
        const spec = ((dx + 0.36) / 0.32) ** 2 + ((dy + 0.42) / 0.2) ** 2;
        if (spec < 1) col = mixRgb(col, WHITE, (1 - spec) * 0.7);
        col = mixRgb(col, shadeRgb(pal.gemC, -0.28), smoothstep(0.58, 0.96, d) * 0.72);
      } else if (shape === 'opal') {
        const tile = (Math.floor((x + salt * 7) / Math.max(1, c.S)) * 13 + Math.floor((y - salt * 5) / Math.max(1, c.S)) * 7) % 4;
        const flash: RGB[] = [pal.gem2, [250, 150, 214], [96, 231, 224], [255, 220, 132]];
        col = mixRgb(col, flash[(tile + 4) % 4], tile === 0 ? 0.58 : 0.19);
      } else if (shape === 'rose-cut') {
        const ring = Math.floor(d * 6 + salt) % 2;
        if (ring === 0) col = mixRgb(col, WHITE, 0.28);
        if (d > 0.68) col = shadeRgb(col, -0.14);
      } else if (shape === 'prism') {
        const bands: RGB[] = [[255, 112, 126], [255, 210, 90], [94, 226, 151], [96, 165, 250]];
        const bi = Math.min(3, Math.floor((dy + 1) * 2));
        col = mixRgb(col, bands[bi], 0.36);
      } else if (shape === 'star-cut') {
        col = mixRgb(col, WHITE, (0.5 + 0.5 * Math.cos(a * 5 + salt)) * 0.28);
      } else {
        col = facet % 3 === 0 ? mixRgb(col, WHITE, 0.28) : facet % 3 === 2 ? shadeRgb(col, -0.18) : col;
      }
      if (dy < -0.15) col = mixRgb(col, pal.gem2, 0.13);
      if (d > 0.82) col = edgeDarken(col, 0.75);
      buf.set(x, y, col, 255);
    }
  }
  buf.blend(cx - r * 0.3, cy - r * 0.45, WHITE, 240);
}

/** Main gem settings: lapidary facet work, mount, then pavé satellites. */
export function drawGemSettings(c: RenderCtx) {
  cutOverlay(c);
  drawPrimaryMount(c);
  drawSecondaryGems(c);
}