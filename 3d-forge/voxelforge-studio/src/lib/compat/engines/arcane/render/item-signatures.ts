/* Item-family identity work: the accessory that makes each type unmistakable. */
import { WHITE, mixRgb, shadeRgb } from '../color';
import type { RenderCtx } from './context';

export function drawItemSignature(c: RenderCtx) {
  const { cfg, buf, geo, pal, S, W, line } = c;
  const { itemType } = cfg;
  const { headC, headR, collarPos, collarW, dir, perp, start, posAt } = geo;
  const { collarC, gemC, gem2 } = pal;

  if (itemType === 'grimoire') {
    // Book corners, spine rivets, clasp and a legible gold sigil.
    const w = headR * 0.88, h = headR * 0.92;
    const x0 = headC[0] - w * 0.8, x1 = headC[0] + w * 0.8;
    const y0 = headC[1] - h * 0.82, y1 = headC[1] + h * 0.82;
    for (const x of [x0, x1]) for (const y of [y0, y1]) {
      buf.disc(x, y, Math.max(0.7 * S, headR * 0.075), collarC, 245);
      buf.disc(x, y, Math.max(0.35 * S, headR * 0.035), mixRgb(collarC, WHITE, 0.5), 240);
    }
    // central embroidered sigil
    line(headC[0] - w * 0.35, headC[1], headC[0] + w * 0.32, headC[1], 0.65 * S, 0.5 * S, gem2, collarC, WHITE, 220);
    line(headC[0], headC[1] - h * 0.3, headC[0], headC[1] + h * 0.28, 0.65 * S, 0.5 * S, gem2, collarC, WHITE, 220);
    buf.disc(headC[0], headC[1], headR * 0.11, mixRgb(gemC, WHITE, 0.45), 240);
  } else if (itemType === 'focus-orb') {
    // Floating focus: three meridian rings, riveted terminals, suspended core.
    const r = headR * 1.08, th = Math.max(0.7 * S, W * 0.01);
    buf.ring(headC[0], headC[1], r, th, collarC, 230);
    buf.ring(headC[0], headC[1], r * 0.74, th * 0.65, mixRgb(collarC, WHITE, 0.4), 205);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI + (c.anim.on ? c.anim.t * c.anim.TAU * 0.12 : 0);
      line(headC[0] + Math.cos(a) * r, headC[1] + Math.sin(a) * r,
        headC[0] - Math.cos(a) * r, headC[1] - Math.sin(a) * r,
        th * 0.55, th * 0.55, collarC, shadeRgb(collarC, -0.32), mixRgb(collarC, WHITE, 0.5), 215);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = headC[0] + Math.cos(a) * r, y = headC[1] + Math.sin(a) * r;
      buf.disc(x, y, Math.max(0.7 * S, r * 0.075), collarC, 245);
    }
    buf.disc(headC[0], headC[1], headR * 0.18, WHITE, 185);
  } else if (itemType === 'censer') {
    // A little suspended incense cup with chain lines and ember core.
    const bowlR = headR * 0.68;
    for (const side of [-1, 1]) {
      const bx = headC[0] + side * bowlR * 0.7, by = headC[1] - bowlR * 0.58;
      line(collarPos[0] + side * collarW * 0.6, collarPos[1], bx, by, 0.65 * S, 0.4 * S, collarC, shadeRgb(collarC, -0.3), WHITE, 215);
      for (let q = 0; q < 3; q++) buf.disc(bx + (q - 1) * S * 1.2, by + q * S * 1.2, Math.max(0.45 * S, collarW * 0.1), collarC, 230);
    }
    // punched filigree holes and a glowing coal
    for (let i = -2; i <= 2; i++) {
      const x = headC[0] + i * bowlR * 0.22;
      buf.blend(x, headC[1] + bowlR * 0.27, [16, 11, 22], 185);
      if (i === 0) buf.blend(x, headC[1] + bowlR * 0.25, mixRgb(gem2, WHITE, 0.6), 240);
    }
  } else if (itemType === 'bell') {
    // Bell yoke, two embossed ribs and a visible clapper.
    const r = headR * 0.72;
    buf.ring(headC[0], headC[1] - r * 0.75, r * 0.36, Math.max(0.65 * S, W * 0.008), collarC, 240);
    for (let i = 0; i < 3; i++) {
      const y = headC[1] - r * 0.15 + i * r * 0.26;
      const span = r * (0.54 + i * 0.1);
      line(headC[0] - span, y, headC[0] + span, y, Math.max(0.45 * S, W * 0.007), Math.max(0.35 * S, W * 0.005),
        mixRgb(collarC, WHITE, i === 0 ? 0.42 : 0.16), shadeRgb(collarC, -0.3), WHITE, 205);
    }
    buf.disc(headC[0], headC[1] + r * 0.78, Math.max(0.6 * S, r * 0.13), mixRgb(gemC, WHITE, 0.25), 245);
    for (let i = 0; i < 3; i++) {
      const a = Math.PI + (i - 1) * 0.28;
      buf.blend(headC[0] + Math.cos(a) * r * 0.65, headC[1] + Math.sin(a) * r * 0.9, WHITE, 100);
    }
  } else if (itemType === 'talisman') {
    // Necklace loop with segmented links framing the seal.
    const r = headR * 1.25;
    const points = 18;
    let prev: [number, number] | null = null;
    for (let i = 0; i <= points; i++) {
      const a = Math.PI * 0.12 + (i / points) * Math.PI * 0.76;
      const x = headC[0] + Math.cos(a) * r, y = headC[1] - Math.sin(a) * r * 0.75;
      if (prev) line(prev[0], prev[1], x, y, 0.55 * S, 0.38 * S, collarC, shadeRgb(collarC, -0.28), mixRgb(collarC, WHITE, 0.35), 225);
      if (i % 3 === 0) buf.disc(x, y, Math.max(0.45 * S, W * 0.008), gem2, 220);
      prev = [x, y];
    }
    buf.ring(headC[0], headC[1], headR * 0.72, Math.max(0.5 * S, W * 0.009), mixRgb(collarC, WHITE, 0.35), 190);
  } else if (itemType === 'spear') {
    // Crossguard, socket and three bright inlay bars on the blade root.
    const gx = headC[0] - dir[0] * headR * 0.5, gy = headC[1] - dir[1] * headR * 0.5;
    line(gx + perp[0] * headR * 0.95, gy + perp[1] * headR * 0.95,
      gx - perp[0] * headR * 0.95, gy - perp[1] * headR * 0.95,
      headR * 0.1, headR * 0.06, collarC, shadeRgb(collarC, -0.4), mixRgb(collarC, WHITE, 0.55));
    for (let i = -1; i <= 1; i++) {
      const x = gx + dir[0] * i * headR * 0.2, y = gy + dir[1] * i * headR * 0.2;
      buf.disc(x, y, Math.max(0.5 * S, headR * 0.07), gemC, 245);
    }
  } else if (itemType === 'cane') {
    // Carved hook handle at the butt end; the base shaft already has a gentle curve.
    const [sx, sy] = start;
    const r = Math.max(collarW * 1.35, headR * 0.14);
    let last: [number, number] = [sx, sy];
    for (let i = 1; i <= 15; i++) {
      const t = i / 15, a = Math.PI * 0.9 + t * Math.PI * 1.5;
      const x = sx + Math.cos(a) * r, y = sy - r * 0.4 + Math.sin(a) * r;
      line(last[0], last[1], x, y, r * (0.28 - t * 0.08), r * (0.22 - t * 0.08), pal.shaftC, pal.shaftD, mixRgb(pal.shaftC, WHITE, 0.3));
      last = [x, y];
    }
    buf.disc(last[0], last[1], Math.max(0.6 * S, r * 0.15), collarC, 235);
  } else if (itemType === 'wand') {
    // Signature wand grip: two thin collars and a tiny light-rune.
    for (const t of [0.24, 0.37, 0.5]) {
      const [x, y] = posAt(t);
      line(x - perp[0] * collarW * 0.7, y - perp[1] * collarW * 0.7,
        x + perp[0] * collarW * 0.7, y + perp[1] * collarW * 0.7,
        Math.max(0.5 * S, collarW * 0.22), Math.max(0.35 * S, collarW * 0.16),
        collarC, shadeRgb(collarC, -0.32), mixRgb(collarC, WHITE, 0.45), 210);
    }
  } else if (itemType === 'rod') {
    // A rod's socket carries a clear gem bezel and a little calibration tick.
    buf.ring(headC[0], headC[1], headR * 0.88, Math.max(0.5 * S, W * 0.008), collarC, 175);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const x = headC[0] + Math.cos(a) * headR * 0.9, y = headC[1] + Math.sin(a) * headR * 0.9;
      buf.disc(x, y, Math.max(0.45 * S, W * 0.006), mixRgb(collarC, WHITE, 0.4), 230);
    }
  } else if (itemType === 'scepter') {
    // Royal neck: double collar and a centered cabochon.
    for (const t of [0.89, 0.95]) {
      const [x, y] = posAt(t);
      line(x - perp[0] * collarW * 1.15, y - perp[1] * collarW * 1.15,
        x + perp[0] * collarW * 1.15, y + perp[1] * collarW * 1.15,
        collarW * 0.28, collarW * 0.19, collarC, shadeRgb(collarC, -0.38), mixRgb(collarC, WHITE, 0.55));
    }
    buf.disc(headC[0] - geo.dir[0] * headR * 0.68, headC[1] - geo.dir[1] * headR * 0.68, headR * 0.12, pal.gem2, 235);
  }
}