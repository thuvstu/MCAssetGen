/* Particles · animation embellishments · element motif */
import { RGB, WHITE, clamp01, mixRgb, mulberry32, shadeRgb } from '../color';
import type { RenderCtx } from './context';

const EMBER_PAL: RGB[] = [[255, 120, 40], [255, 200, 90], [255, 80, 60], [255, 240, 200]];

export function drawParticles(c: RenderCtx) {
  const { cfg, buf, geo, pal, anim, S, N, W, rng, line } = c;
  const { headC, headR } = geo;
  const partC = pal.partC;
  const TAU = anim.TAU;
  // stable per-particle RNG so positions move continuously between frames
  const pRng = mulberry32(cfg.seed * 17 + 3);
  const pData = Array.from({ length: cfg.particles }, () => ({
    a: pRng() * Math.PI * 2, r: headR * (1.18 + pRng() * 1.4), ph: pRng(), tw: 150 + Math.floor(pRng() * 105), big: pRng() < 0.3,
  }));
  for (let i = 0; i < cfg.particles; i++) {
    const { a: a0, r: rad0, ph, tw, big: big0 } = pData[i];
    let px0 = headC[0] + Math.cos(a0) * rad0, py0 = headC[1] + Math.sin(a0) * rad0;
    if (anim.on) {
      const drift = anim.t + ph;
      switch (anim.type) {
        case 'bubbles-rise': py0 -= Math.sin(drift * TAU) * headR * 0.5; px0 += Math.sin(drift * TAU * 2) * headR * 0.08; break;
        case 'petal-drift': py0 += Math.sin(drift * TAU) * headR * 0.6; px0 += Math.cos(drift * TAU * 1.3) * headR * 0.25; break;
        case 'ember-swirl':
        case 'flame-flicker': py0 -= Math.sin(drift * TAU) * headR * 0.9; px0 += Math.cos(a0 * 3 + drift * TAU * 2) * headR * 0.2; break;
        case 'frost-shimmer': px0 += Math.sin(drift * TAU + ph * 7) * headR * 0.08; py0 += Math.cos(drift * TAU + ph * 7) * headR * 0.08; break;
        case 'sparkle-cascade': px0 += Math.sin(drift * TAU * 2 + ph * 6) * headR * 0.18; py0 -= Math.sin(drift * TAU) * headR * 1.0; break;
        case 'sakura-fall': px0 += Math.sin(drift * TAU * 3 + ph * 4) * headR * 0.3; py0 += (drift % 1) * headR * 1.1 - headR * 0.55; break;
      }
    }
    const px = Math.round(px0), py = Math.round(py0);
    if (px < 0 || py < 0 || px >= W || py >= W) continue;
    if (buf.alpha(px, py) > 40 && rng() < 0.75) continue;
    let st = cfg.particleStyle;
    if (st === 'mixed') st = (['sparkle', 'dots', 'plus', 'diamonds'] as const)[Math.floor(rng() * 4)];
    const big = N >= 64 && big0;
    const alpha = tw * (anim.type === 'flame-flicker' || anim.type === 'ember-swirl' ? anim.flicker : 1);
    const plus = (col: RGB, k: number) => {
      buf.blend(px + 1, py, col, alpha * k); buf.blend(px - 1, py, col, alpha * k);
      buf.blend(px, py + 1, col, alpha * k); buf.blend(px, py - 1, col, alpha * k);
    };
    switch (st) {
      case 'sparkle':
        buf.blend(px, py, rng() < 0.4 ? WHITE : partC, alpha); plus(partC, 0.7);
        if (big) { buf.blend(px + 2, py, partC, alpha * 0.35); buf.blend(px - 2, py, partC, alpha * 0.35); buf.blend(px, py + 2, partC, alpha * 0.35); buf.blend(px, py - 2, partC, alpha * 0.35); }
        break;
      case 'dots': {
        const col = rng() < 0.3 ? WHITE : partC;
        buf.blend(px, py, col, alpha);
        if (big) { buf.blend(px + 1, py, col, alpha * 0.8); buf.blend(px, py + 1, col, alpha * 0.8); }
        break;
      }
      case 'plus': buf.blend(px, py, WHITE, alpha); plus(WHITE, 0.6); break;
      case 'diamonds':
        buf.blend(px, py, WHITE, alpha); plus(partC, 0.8);
        if (big) { buf.blend(px + 1, py + 1, partC, alpha * 0.4); buf.blend(px - 1, py - 1, partC, alpha * 0.4); }
        break;
      case 'embers': {
        const col = EMBER_PAL[Math.floor(rng() * EMBER_PAL.length)];
        buf.blend(px, py, col, alpha); buf.blend(px, py - 1, col, alpha * 0.4);
        if (big) buf.blend(px, py + 1, col, alpha * 0.3);
        break;
      }
      case 'bubbles': {
        const br = big ? 2.4 * S : 1.6 * S;
        for (let yy = -3 * S; yy <= 3 * S; yy++) for (let xx = -3 * S; xx <= 3 * S; xx++) {
          if (Math.abs(Math.hypot(xx, yy) - br) < 0.7) buf.blend(px + xx, py + yy, partC, alpha * 0.8);
        }
        buf.blend(px - 1, py - 1, WHITE, 205);
        break;
      }
      case 'snow': {
        const sr = big ? 2.2 * S : 1.4 * S;
        for (let k = 0; k < 3; k++) {
          const a2 = (k / 3) * Math.PI;
          line(px - Math.cos(a2) * sr, py - Math.sin(a2) * sr, px + Math.cos(a2) * sr, py + Math.sin(a2) * sr, 0.6 * S, 0.6 * S, partC, partC, WHITE, alpha * 0.9);
        }
        buf.blend(px, py, WHITE, 245);
        break;
      }
      case 'leaf': {
        const lr = big ? 2.6 * S : 1.8 * S;
        for (let y = Math.floor(py - lr); y <= py + lr; y++) {
          for (let x = Math.floor(px - lr * 0.6); x <= px + lr * 0.6; x++) {
            const dx = (x - px) / (lr * 0.6), dy = (y - py) / lr;
            if (dx * dx + dy * dy > 1) continue;
            buf.blend(x, y, mixRgb(shadeRgb(partC, 0.2), shadeRgb(partC, -0.2), clamp01((dy + 1) / 2)), alpha);
          }
        }
        buf.blend(px, py, WHITE, 180);
        break;
      }
      case 'stars': {
        const sr = big ? 2.6 * S : 1.8 * S;
        for (let y = Math.floor(py - sr); y <= py + sr; y++) {
          for (let x = Math.floor(px - sr); x <= px + sr; x++) {
            const dx = x - px, dy = y - py;
            const d = Math.hypot(dx, dy);
            const a2 = Math.atan2(dy, dx);
            const rr = sr * (0.34 + 0.66 * Math.pow(0.5 + 0.5 * Math.cos(5 * a2 - Math.PI / 2), 0.5));
            if (d <= rr) buf.blend(x, y, mixRgb(WHITE, partC, d / Math.max(0.5, rr)), alpha);
          }
        }
        break;
      }
      case 'runes': {
        const rr = big ? 2.2 * S : 1.6 * S;
        buf.ring(px, py, rr, Math.max(0.5 * S, rr * 0.3), partC, alpha * 0.9);
        line(px - rr * 0.5, py, px + rr * 0.5, py, 0.5 * S, 0.5 * S, WHITE, WHITE, WHITE, alpha);
        line(px, py - rr * 0.55, px, py + rr * 0.55, 0.5 * S, 0.5 * S, WHITE, WHITE, WHITE, alpha * 0.85);
        break;
      }
      case 'hearts': {
        const hr = big ? 2.3 * S : 1.6 * S;
        for (let y = Math.floor(py - hr); y <= py + hr * 1.2; y++) {
          for (let x = Math.floor(px - hr); x <= px + hr; x++) {
            const nx = (x - px) / hr, my = -((y - py) / hr - 0.2);
            if (Math.pow(nx * nx + my * my - 0.5, 3) - nx * nx * my * my * my > 0) continue;
            buf.blend(x, y, mixRgb(partC, WHITE, 0.25), alpha);
          }
        }
        break;
      }
      case 'ash': {
        const col = mixRgb(partC, [70, 66, 62], 0.55);
        buf.blend(px, py, col, alpha);
        if (big) { buf.blend(px + 1, py, col, alpha * 0.6); buf.blend(px, py + 1, shadeRgb(col, -0.2), alpha * 0.5); }
        buf.blend(px, py - 1, mixRgb(col, WHITE, 0.25), alpha * 0.35);
        break;
      }
      case 'musical': {
        const nr = big ? 2.2 * S : 1.5 * S;
        buf.disc(px, py + nr * 0.5, nr * 0.55, partC, alpha);          // note head
        line(px + nr * 0.5, py + nr * 0.5, px + nr * 0.5, py - nr, 0.5 * S, 0.5 * S, partC, partC, WHITE, alpha);  // stem
        line(px + nr * 0.5, py - nr, px + nr * 1.2, py - nr * 0.55, 0.5 * S, 0.4 * S, partC, partC, WHITE, alpha * 0.9); // flag
        break;
      }
      case 'firefly': {
        const spec = big ? 1.9 * S : 1.4 * S;
        buf.disc(px, py, spec, mixRgb(partC, WHITE, 0.9), alpha * 0.9);
        buf.disc(px, py, spec * 0.55, [255, 246, 190], alpha);
        for (let q = 0; q < 3; q++) {
          buf.blend(px - S * 1.1 * (q + 1) * (i % 2 ? 1 : -1), py - S * 0.5 * q, mixRgb(partC, [255, 220, 130], 0.5), alpha * (0.4 - q * 0.1));
        }
        if (big) buf.ring(px, py, spec * 2.2, 0.5 * S, partC, alpha * 0.22);
        break;
      }
      case 'glow-dust': {
        const ep = big ? 1.2 * S : 0.85 * S;
        buf.disc(px, py, ep, mixRgb(partC, WHITE, 0.75), alpha);
        buf.blend(px + 1, py, partC, alpha * 0.5);
        buf.blend(px, py + 1, partC, alpha * 0.45);
        if (big) {
          buf.disc(px, py, ep * 2.3, partC, alpha * 0.22);
          buf.blend(px, py - 1, WHITE, alpha * 0.85);
        } else {
          buf.blend(px, py - 1, WHITE, alpha * 0.75);
        }
        break;
      }
    }
  }
}

/* ═══════════════ 摩耗・ダメージ (surface wear) ═══════════════ */
export function applyWear(c: RenderCtx) {
  const { cfg, buf, W, S, rng } = c;
  const style = cfg.wearStyle ?? 'none';
  const amt = cfg.wearAmount ?? 0;
  if (style === 'none' || amt <= 0.01) return;

  // Collect the current silhouette so wear only lands on the item
  const solid: Array<[number, number]> = [];
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (buf.alpha(x, y) > 200) solid.push([x, y]);
  if (solid.length === 0) return;
  const pickPx = () => solid[Math.floor(rng() * solid.length)];

  /**
   * Paint one *output* pixel worth of speckle (S×S block snapped to the
   * downsample grid). Single sub-pixels would be averaged 1:S² away and
   * vanish entirely after supersampling — this keeps specks readable.
   */
  const speck = (x: number, y: number, col: RGB, a: number) => {
    const bx = Math.floor(x / S) * S, by = Math.floor(y / S) * S;
    for (let dy = 0; dy < S; dy++) {
      for (let dx = 0; dx < S; dx++) {
        if (buf.alpha(bx + dx, by + dy) > 60) buf.blend(bx + dx, by + dy, col, a);
      }
    }
  };

  switch (style) {
    case 'chipped': {
      // gnaw clusters out of the silhouette edge
      const edges = solid.filter(([x, y]) =>
        buf.alpha(x + S, y) < 40 || buf.alpha(x - S, y) < 40 || buf.alpha(x, y + S) < 40 || buf.alpha(x, y - S) < 40);
      if (edges.length === 0) break;
      const bites = Math.max(3, Math.round(edges.length * amt * 0.035));
      for (let i = 0; i < bites; i++) {
        const [cx, cy] = edges[Math.floor(rng() * edges.length)];
        const r = (0.7 + rng() * 1.1) * S;
        for (let y = Math.floor(cy - r); y <= cy + r; y++) {
          for (let x = Math.floor(cx - r); x <= cx + r; x++) {
            if (Math.hypot(x - cx, y - cy) > r) continue;
            buf.set(x, y, [0, 0, 0], 0);
          }
        }
        // darken the freshly exposed inner rim
        for (let y = Math.floor(cy - r - S); y <= cy + r + S; y++) {
          for (let x = Math.floor(cx - r - S); x <= cx + r + S; x++) {
            const d = Math.hypot(x - cx, y - cy);
            if (d > r && d <= r + S && buf.alpha(x, y) > 60) buf.blend(x, y, [30, 22, 26], 190 * amt);
          }
        }
      }
      break;
    }
    case 'cracked':
      for (let n = 0; n < Math.max(5, Math.round(amt * 16)); n++) {
        let [x, y] = pickPx();
        let a = rng() * Math.PI * 2;
        const steps = 18 + rng() * 26;
        for (let s = 0; s < steps; s++) {
          a += (rng() - 0.5) * 0.8;
          x += Math.cos(a) * S; y += Math.sin(a) * S;
          if (buf.alpha(Math.round(x), Math.round(y)) < 60) break;
          buf.blend(x, y, [16, 10, 18], 240 * amt);
          if (S > 1) buf.blend(x + 1, y, [16, 10, 18], 150 * amt);
          if (rng() < 0.3) buf.blend(x - 1, y - 1, [250, 250, 255], 110 * amt);   // stress highlight
          // branch
          if (rng() < 0.07) {
            let bx = x, by = y, ba = a + (rng() < 0.5 ? 1 : -1) * 0.9;
            for (let k = 0; k < 6 + rng() * 8; k++) {
              bx += Math.cos(ba) * S; by += Math.sin(ba) * S;
              if (buf.alpha(Math.round(bx), Math.round(by)) < 60) break;
              buf.blend(bx, by, [16, 10, 18], 190 * amt);
            }
          }
        }
      }
      break;
    case 'scratched':
      for (let n = 0; n < Math.max(8, Math.round(amt * 38)); n++) {
        const [sx, sy] = pickPx();
        const a = -Math.PI / 4 + (rng() - 0.5) * 0.8;
        const len = (4 + rng() * 14) * S;
        const bright = rng() < 0.5;
        for (let s = 0; s < len; s++) {
          const x = sx + Math.cos(a) * s, y = sy + Math.sin(a) * s;
          if (buf.alpha(Math.round(x), Math.round(y)) < 60) break;
          buf.blend(x, y, bright ? [255, 255, 255] : [38, 30, 38], 175 * amt);
        }
      }
      break;
    case 'burned': {
      const n = Math.round((solid.length / (S * S)) * amt * 0.5);
      for (let i = 0; i < n; i++) {
        const [x, y] = pickPx();
        const soot = rng();
        if (soot < 0.58) speck(x, y, [24, 18, 17], 215 * amt);
        else if (soot < 0.84) speck(x, y, [74, 41, 22], 195 * amt);
        else speck(x, y, [255, 143, 48], 200 * amt);        // lingering ember
      }
      break;
    }
    case 'mossy': {
      const n = Math.round((solid.length / (S * S)) * amt * 0.55);
      for (let i = 0; i < n; i++) {
        const [x, y] = pickPx();
        // moss colonises the shaded lower part first
        if (rng() > 0.25 + 0.75 * (y / W)) continue;
        const g = rng();
        speck(x, y, g < 0.55 ? [56, 102, 46] : g < 0.85 ? [88, 140, 62] : [124, 170, 90], 225 * amt);
      }
      break;
    }
    case 'frosted-over': {
      const n = Math.round((solid.length / (S * S)) * amt * 0.55);
      for (let i = 0; i < n; i++) {
        const [x, y] = pickPx();
        // rime builds on the upper, light-facing surfaces
        if (rng() > 0.3 + 0.7 * (1 - y / W)) continue;
        speck(x, y, rng() < 0.65 ? [210, 236, 255] : [255, 255, 255], 215 * amt);
      }
      break;
    }
    case 'blood-stained':
      for (let n = 0; n < Math.max(3, Math.round(amt * 9)); n++) {
        const [sx, sy] = pickPx();
        const r = (1.2 + rng() * 2.4) * S;
        for (let y = Math.floor(sy - r); y <= sy + r; y++) {
          for (let x = Math.floor(sx - r); x <= sx + r; x++) {
            if (Math.hypot(x - sx, y - sy) > r || buf.alpha(x, y) < 60) continue;
            buf.blend(x, y, rng() < 0.75 ? [122, 18, 22] : [162, 34, 30], 215 * amt);
          }
        }
        // drip run
        for (let d = 0; d < r * 3; d++) {
          const y = sy + r * 0.6 + d;
          if (buf.alpha(Math.round(sx), Math.round(y)) < 60) break;
          buf.blend(sx, y, [104, 14, 18], 185 * amt * (1 - d / (r * 3)));
        }
      }
      break;
  }
}

export function drawAnimEmbellish(c: RenderCtx) {
  const { cfg, buf, geo, pal, anim, S, W, small, rng, line } = c;
  if (!anim.on || small) return;
  const { headC, headR } = geo;
  const { gemC, glowC } = pal;
  const aInt = anim.intensity;
  if (anim.type === 'frost-shimmer' || cfg.element === 'ice') {
    const n = Math.round(10 * aInt);
    const fc = mixRgb(gemC, WHITE, 0.6);
    for (let i = 0; i < n; i++) {
      const ang = rng() * Math.PI * 2, rad = headR * (0.5 + rng() * 1.5);
      const px = headC[0] + Math.cos(ang) * rad, py = headC[1] + Math.sin(ang) * rad;
      if (anim.frostBlink * rng() > 0.4) {
        buf.blend(px, py, WHITE, 255 * aInt);
        buf.blend(px + 1, py, fc, 180 * aInt); buf.blend(px - 1, py, fc, 180 * aInt);
        buf.blend(px, py + 1, fc, 180 * aInt); buf.blend(px, py - 1, fc, 180 * aInt);
      }
    }
  }
  if (anim.lightningOn) {
    const branches = 2 + Math.floor(rng() * 2);
    for (let b = 0; b < branches; b++) {
      const ang = rng() * Math.PI * 2;
      let x = headC[0], y = headC[1];
      const steps = 6 + Math.floor(rng() * 4);
      for (let s = 0; s < steps; s++) {
        const nx = x + (Math.cos(ang) + (rng() - 0.5) * 0.9) * headR * 0.35;
        const ny = y + (Math.sin(ang) + (rng() - 0.5) * 0.9) * headR * 0.35;
        line(x, y, nx, ny, 0.9 * S, 0.4 * S, WHITE, [200, 200, 255], WHITE, 255);
        line(x, y, nx, ny, 2.2 * S, 0.8 * S, glowC, glowC, glowC, 90);
        x = nx; y = ny;
      }
    }
  }
  if (anim.type === 'void-breath') {
    const breath = 0.5 + 0.5 * Math.sin(anim.t * anim.TAU);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * anim.TAU + anim.t * 0.8;
      const r = headR * (1.3 + breath * 0.6 + rng() * 0.2);
      const px = headC[0] + Math.cos(a) * r, py = headC[1] + Math.sin(a) * r;
      buf.disc(px, py, headR * 0.28 * breath, [18, 10, 32], 120 * aInt);
      buf.ring(px, py, headR * 0.28 * breath, Math.max(0.7 * S, W * 0.007), mixRgb(gemC, WHITE, 0.2), 80 * aInt);
    }
  }
}

export function drawMotif(c: RenderCtx) {
  const { cfg, buf, geo, pal, S, W, small, line } = c;
  if (cfg.motif === 'none' || cfg.motifIntensity <= 0.02 || small) return;
  const { headC, headR } = geo;
  const { gemC, gem2 } = pal;
  const rng2 = mulberry32(cfg.seed * 7 + 13);
  const cnt = Math.max(2, Math.round(2 + cfg.motifIntensity * 9));
  const mI = cfg.motifIntensity;
  for (let i = 0; i < cnt; i++) {
    const a = rng2() * Math.PI * 2 + (i / cnt) * Math.PI * 2;
    const rad = headR * (1.1 + rng2() * 1.5);
    const px = headC[0] + Math.cos(a) * rad, py = headC[1] + Math.sin(a) * rad;
    if (px < 0 || py < 0 || px >= W || py >= W) continue;
    const sc = headR * 0.16;
    switch (cfg.motif) {
      case 'flame': {
        const fy = py + sc * 1.2, fr = sc * 0.7;
        for (let y = Math.floor(fy - fr * 2.2); y <= fy + fr; y++) {
          for (let x = Math.floor(px - fr); x <= px + fr; x++) {
            const dd = ((x - px) / fr) ** 2 + ((y - fy) / (fr * 2)) ** 2;
            if (dd <= 1) buf.blend(x, y, mixRgb(gem2, mixRgb(gemC, WHITE, 0.45), dd), 235 * (1 - dd * 0.4) * mI);
          }
        }
        break;
      }
      case 'frost': {
        const fc = mixRgb(gem2, WHITE, 0.4);
        for (let k = 0; k < 6; k++) {
          const a2 = (k / 6) * Math.PI * 2;
          line(px, py, px + Math.cos(a2) * sc * 1.2, py + Math.sin(a2) * sc * 1.2, 0.7 * S, 0.5 * S, fc, fc, WHITE, 235 * mI);
        }
        buf.blend(px, py, WHITE, 250 * mI);
        break;
      }
      case 'bolt': {
        let bx = px, by = py;
        for (let k = 0; k < 4; k++) {
          const nx = bx + (rng2() - 0.5) * sc * 2.2, ny = by + sc * (0.6 + rng2() * 0.6);
          line(bx, by, nx, ny, 0.8 * S, 0.6 * S, mixRgb(gem2, WHITE, 0.5), gemC, WHITE, 235 * mI);
          bx = nx; by = ny;
        }
        break;
      }
      case 'leaf': {
        const lr = sc * 1.4;
        for (let y = Math.floor(py - lr); y <= py + lr; y++) {
          for (let x = Math.floor(px - lr * 0.6); x <= px + lr * 0.6; x++) {
            const dx = (x - px) / (lr * 0.6), dy = (y - py) / lr;
            const m = dx * dx + dy * dy;
            if (m <= 1) buf.blend(x, y, mixRgb(shadeRgb(gemC, 0.25), shadeRgb(gemC, -0.25), clamp01((dy + 1) / 2)), 230 * (1 - m * 0.3) * mI);
          }
        }
        break;
      }
      case 'rays': {
        const a2 = rng2() * Math.PI * 2;
        line(px, py, px + Math.cos(a2) * sc * 2.4, py + Math.sin(a2) * sc * 2.4, 0.9 * S, 0.3 * S, mixRgb(gem2, WHITE, 0.5), gemC, WHITE, 235 * mI);
        break;
      }
      case 'wisp': {
        const wr = sc * 0.9;
        for (let y = Math.floor(py - wr * 1.6); y <= py + wr * 0.8; y++) {
          for (let x = Math.floor(px - wr); x <= px + wr; x++) {
            const dd = ((x - px) / wr) ** 2 + ((y - py) / (wr * 1.4)) ** 2;
            if (dd <= 1) buf.blend(x, y, mixRgb([30, 20, 50], mixRgb(gemC, WHITE, 0.4), 1 - dd), 215 * (1 - dd * 0.5) * mI);
          }
        }
        buf.blend(px, py - wr * 0.3, WHITE, 190 * mI);
        break;
      }
      case 'rune': {
        const rc = mixRgb(gem2, WHITE, 0.55), s2 = sc * 1.1;
        buf.disc(px, py, s2 * 0.75, rc, 225 * mI);
        buf.disc(px, py, s2 * 0.42, WHITE, 215 * mI);
        line(px - s2 * 0.35, py, px + s2 * 0.35, py, 0.7 * S, 0.7 * S, gemC, gemC, WHITE, 235 * mI);
        line(px, py - s2 * 0.4, px, py + s2 * 0.4, 0.7 * S, 0.7 * S, gemC, gemC, WHITE, 235 * mI);
        break;
      }
      case 'drip': {
        const dr = sc * 0.5;
        for (let y = Math.floor(py); y <= py + sc * 2.2; y++) {
          const f = (y - py) / (sc * 2.2);
          const rr = dr * Math.sin(Math.PI * clamp01(f)) * 0.9 + 0.3;
          for (let x = Math.floor(px - rr); x <= px + rr; x++) if (Math.abs(x - px) <= rr) buf.blend(x, y, mixRgb(gemC, WHITE, 0.25 * (1 - f)), 230 * mI);
        }
        buf.blend(px, py, WHITE, 220 * mI);
        break;
      }
      case 'wave':
        for (let k = 0; k < 10; k++) {
          const t2 = k / 10;
          buf.blend(px - sc * 1.4 + t2 * sc * 2.8, py + Math.sin(t2 * Math.PI * 2) * sc * 0.45, mixRgb(gem2, WHITE, 0.4), 225 * mI);
        }
        break;
      case 'rock': {
        const rr = sc * (0.7 + rng2() * 0.5);
        for (let y = Math.floor(py - rr); y <= py + rr; y++) {
          for (let x = Math.floor(px - rr); x <= px + rr; x++) {
            const dd = Math.hypot(x - px, y - py) / rr;
            if (dd > 1) continue;
            let col = mixRgb(shadeRgb(gemC, 0.25), shadeRgb(gemC, -0.3), clamp01(dd));
            if (rng2() < 0.2) col = shadeRgb(col, -0.2);
            buf.blend(x, y, col, 235 * mI);
          }
        }
        break;
      }
      case 'void': {
        const vr = sc * 0.9;
        buf.ring(px, py, vr, Math.max(0.7 * S, W * 0.01), [12, 8, 22], 240 * mI);
        buf.ring(px, py, vr * 1.5, Math.max(0.6 * S, W * 0.008), mixRgb(gemC, WHITE, 0.3), 190 * mI);
        buf.blend(px, py, WHITE, 240 * mI);
        buf.blend(px + 2, py - 1, WHITE, 150 * mI);
        break;
      }
      case 'constellation': {
        // Astral Sorcery constellation node & starlight line
        const starR = sc * 0.8;
        buf.disc(px, py, starR * 0.6, WHITE, 255 * mI);
        buf.ring(px, py, starR * 1.2, Math.max(0.6 * S, W * 0.008), [147, 197, 253], 220 * mI);
        // Connect to head with thin starlight filament
        line(px, py, headC[0], headC[1], 0.5 * S, 0.3 * S, [191, 219, 254], [147, 197, 253], WHITE, 160 * mI);
        break;
      }
      case 'sculk-tendril': {
        // Deep Dark Sculk sensor tendril branch
        let tx = px, ty = py;
        for (let s = 0; s < 3; s++) {
          const ntx = tx + (rng2() - 0.5) * sc * 2, nty = ty - sc * (0.8 + rng2() * 0.5);
          line(tx, ty, ntx, nty, 0.9 * S, 0.5 * S, [6, 182, 212], [4, 30, 36], [20, 184, 166], 240 * mI);
          tx = ntx; ty = nty;
        }
        buf.disc(tx, ty, sc * 0.45, [6, 182, 212], 255 * mI);
        buf.blend(tx, ty, WHITE, 200 * mI);
        break;
      }
      case 'mana-weave': {
        // Botania mana filament orbit
        const rad = sc * 1.5;
        for (let q = 0; q < 8; q++) {
          const ma = (q / 8) * Math.PI * 2;
          const mx = px + Math.cos(ma) * rad, my = py + Math.sin(ma) * rad * 0.6;
          buf.blend(mx, my, [34, 211, 238], 220 * mI);
          buf.blend(mx + 1, my, [74, 222, 128], 150 * mI);
        }
        buf.blend(px, py, WHITE, 240 * mI);
        break;
      }
      case 'chains': {
        const links = 4;
        for (let q = 0; q < links; q++) {
          const lx = px + q * sc * 0.85, ly = py + Math.sin(q * 1.1) * sc * 0.35;
          buf.ring(lx, ly, sc * 0.42, Math.max(0.5 * S, sc * 0.18), q % 2 ? shadeRgb(gemC, -0.2) : mixRgb(gemC, WHITE, 0.3), 235 * mI);
        }
        break;
      }
      case 'feathers': {
        const fl = sc * 1.6;
        line(px, py + fl * 0.4, px, py - fl * 0.5, 0.6 * S, 0.4 * S, mixRgb(gem2, WHITE, 0.4), gemC, WHITE, 235 * mI);
        for (let q = 0; q < 5; q++) {
          const t = q / 5;
          const yy = py + fl * 0.3 - t * fl * 0.8;
          const sp = sc * 0.7 * Math.sin(t * Math.PI);
          for (const sd of [-1, 1]) line(px, yy, px + sd * sp, yy - sp * 0.35, 0.5 * S, 0.3 * S, mixRgb(gemC, WHITE, 0.35), gemC, WHITE, 225 * mI);
        }
        break;
      }
      case 'gears': {
        const gr = sc * 0.9, teeth = 6;
        for (let y = Math.floor(py - gr * 1.4); y <= py + gr * 1.4; y++) {
          for (let x = Math.floor(px - gr * 1.4); x <= px + gr * 1.4; x++) {
            const dx = x - px, dy = y - py;
            const d = Math.hypot(dx, dy), a2 = Math.atan2(dy, dx);
            const rr = gr * (0.76 + 0.32 * Math.pow(Math.max(0, Math.cos(teeth * a2)), 0.5));
            if (d > rr || d < gr * 0.3) continue;
            buf.blend(x, y, mixRgb(shadeRgb(gemC, 0.3), shadeRgb(gemC, -0.3), clamp01((dx + gr) / (2 * gr))), 235 * mI);
          }
        }
        break;
      }
      case 'shards': {
        for (let q = 0; q < 3; q++) {
          const a2 = rng2() * Math.PI * 2;
          const sx = px + Math.cos(a2) * sc * 0.9, sy = py + Math.sin(a2) * sc * 0.9;
          const h = sc * (0.7 + rng2() * 0.6);
          for (let y = Math.floor(sy - h); y <= sy + h; y++) {
            for (let x = Math.floor(sx - h * 0.4); x <= sx + h * 0.4; x++) {
              const m = Math.abs(x - sx) / (h * 0.4) + Math.abs(y - sy) / h;
              if (m > 1) continue;
              buf.blend(x, y, mixRgb(mixRgb(gem2, WHITE, 0.45), gemC, m), 235 * mI);
            }
          }
        }
        break;
      }
      case 'petals': {
        for (let q = 0; q < 5; q++) {
          const a2 = (q / 5) * Math.PI * 2 + rng2();
          const cx2 = px + Math.cos(a2) * sc * 0.75, cy2 = py + Math.sin(a2) * sc * 0.75;
          const prx = sc * 0.46, pry = sc * 0.3;
          for (let y = Math.floor(cy2 - prx); y <= cy2 + prx; y++) {
            for (let x = Math.floor(cx2 - prx); x <= cx2 + prx; x++) {
              const rx = (x - cx2) * Math.cos(-a2) - (y - cy2) * Math.sin(-a2);
              const ry = (x - cx2) * Math.sin(-a2) + (y - cy2) * Math.cos(-a2);
              if ((rx / prx) ** 2 + (ry / pry) ** 2 > 1) continue;
              buf.blend(x, y, mixRgb(mixRgb(gemC, WHITE, 0.35), gem2, 0.35), 230 * mI);
            }
          }
        }
        buf.blend(px, py, WHITE, 220 * mI);
        break;
      }
      case 'notes': {
        const nr = sc * 0.8;
        buf.disc(px, py + nr * 0.6, nr * 0.55, mixRgb(gemC, WHITE, 0.25), 240 * mI);
        line(px + nr * 0.5, py + nr * 0.6, px + nr * 0.5, py - nr * 1.1, 0.5 * S, 0.5 * S, gemC, gemC, WHITE, 235 * mI);
        line(px + nr * 0.5, py - nr * 1.1, px + nr * 1.3, py - nr * 0.6, 0.5 * S, 0.4 * S, mixRgb(gem2, WHITE, 0.3), gemC, WHITE, 225 * mI);
        break;
      }
      case 'clock': {
        const cr = sc * 1.05;
        buf.ring(px, py, cr, Math.max(0.6 * S, sc * 0.2), mixRgb(gemC, WHITE, 0.3), 235 * mI);
        for (let q = 0; q < 4; q++) {
          const a2 = (q / 4) * Math.PI * 2;
          buf.blend(px + Math.cos(a2) * cr * 0.74, py + Math.sin(a2) * cr * 0.74, WHITE, 210 * mI);
        }
        const ha = rng2() * Math.PI * 2;
        line(px, py, px + Math.cos(ha) * cr * 0.6, py + Math.sin(ha) * cr * 0.6, 0.55 * S, 0.4 * S, WHITE, gemC, WHITE, 240 * mI);
        line(px, py, px + Math.cos(ha + 2.1) * cr * 0.4, py + Math.sin(ha + 2.1) * cr * 0.4, 0.5 * S, 0.4 * S, mixRgb(gem2, WHITE, 0.4), gemC, WHITE, 225 * mI);
        break;
      }
      case 'bubbles-motif': {
        for (let q = 0; q < 3; q++) {
          const bx = px + (rng2() - 0.5) * sc * 2, by = py + (rng2() - 0.5) * sc * 2;
          const br = sc * (0.3 + rng2() * 0.4);
          buf.ring(bx, by, br, Math.max(0.5 * S, br * 0.35), mixRgb(gem2, WHITE, 0.45), 225 * mI);
          buf.blend(bx - br * 0.35, by - br * 0.35, WHITE, 205 * mI);
        }
        break;
      }
      case 'aurora-waves': {
        const width = sc * 3.2, amp = sc * 0.55;
        for (let q = 0; q < 18; q++) {
          const t2 = q / 18, waveX = px - width / 2 + t2 * width;
          const waveY = py + Math.sin(t2 * Math.PI * 3 + a) * amp;
          const hue = q % 3 === 0 ? mixRgb(gem2, WHITE, 0.5) : q % 3 === 1 ? [103, 232, 249] as RGB : [167, 139, 250] as RGB;
          buf.blend(waveX, waveY, hue, 220 * mI);
          if (q % 3 === 1) buf.blend(waveX, waveY - S, WHITE, 145 * mI);
        }
        break;
      }
      case 'jewel-halo': {
        const rr = sc * 1.15;
        buf.ring(px, py, rr, Math.max(0.5 * S, sc * 0.18), mixRgb(gemC, WHITE, 0.35), 235 * mI);
        for (let q = 0; q < 6; q++) {
          const aa = a + (q / 6) * Math.PI * 2;
          const gx = px + Math.cos(aa) * rr, gy = py + Math.sin(aa) * rr;
          buf.disc(gx, gy, Math.max(0.5 * S, sc * 0.13), q % 2 ? WHITE : mixRgb(gem2, WHITE, 0.4), 240 * mI);
        }
        buf.disc(px, py, sc * 0.3, mixRgb(gem2, WHITE, 0.4), 240 * mI);
        break;
      }
      case 'music-notes': {
        const n2 = sc * 0.75;
        buf.disc(px, py + n2 * 0.6, n2 * 0.55, mixRgb(gemC, WHITE, 0.32), 240 * mI);
        line(px + n2 * 0.5, py + n2 * 0.6, px + n2 * 0.5, py - n2 * 1.1, 0.55 * S, 0.45 * S, gemC, gemC, WHITE, 235 * mI);
        line(px + n2 * 0.5, py - n2 * 1.1, px + n2 * 1.35, py - n2 * 0.55, 0.5 * S, 0.4 * S, mixRgb(gem2, WHITE, 0.35), gemC, WHITE, 225 * mI);
        if (i % 2 === 0) {
          const dx = px + sc * 1.9, dy = py - sc * 0.55;
          buf.disc(dx, dy + n2 * 0.7, n2 * 0.5, mixRgb(gemC, WHITE, 0.28), 230 * mI);
          line(dx + n2 * 0.5, dy + n2 * 0.7, dx + n2 * 0.5, dy - n2 * 1.0, 0.5 * S, 0.42 * S, gemC, gemC, WHITE, 225 * mI);
        }
        buf.blend(px + sc * 0.7, py - sc * 0.85, WHITE, 195 * mI);
        break;
      }
    }
  }
}
