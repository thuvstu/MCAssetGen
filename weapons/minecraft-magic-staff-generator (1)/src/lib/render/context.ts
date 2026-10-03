/* ═══════════════════════════════════════════════════════
   RenderCtx — everything a pipeline stage needs
   (palette, geometry, animation vars, drawing helpers)
   ═══════════════════════════════════════════════════════ */
import type { AnimState, AnimationType, StaffConfig } from '../types';
import { isShaftless } from '../types';
import { RGB, WHITE, hexToRgb, hueShiftRgb, lerp, mulberry32, shadeRgb } from '../color';
import { getRarity } from '../catalog/rarity';
import { Pix } from './pix';

export type Vec = [number, number];

export interface Palette {
  shaftC: RGB; shaftD: RGB; wrapC: RGB; collarC: RGB;
  gemC: RGB; gem2: RGB; glowC: RGB; gemDark: RGB;
  partC: RGB; prongC: RGB; pommelC: RGB; wingC: RGB; haloC: RGB; hornC: RGB;
  /** tier colour (Hypixel-style) used by the `rarity` outline mode */
  rarityC: RGB;
}

export interface Geometry {
  dir: Vec; perp: Vec; start: Vec; end: Vec; headC: Vec;
  headR: number; baseThick: number; L: number;
  /** true for shaft-free relic families (relic / signet / monolith / …) */
  shaftless: boolean;
  /** light direction (top-left 45°, Minecraft standard) */
  LX: number; LY: number;
  /** projection of `perp` onto the light vector (cylinder shading) */
  lightDot: number;
  posAt: (t: number) => Vec;
  collarPos: Vec; collarLen: number; collarW: number;
  pomPos: Vec;
  tipC: Vec; tipSize: number;
}

export interface AnimVars {
  on: boolean; type: AnimationType; intensity: number;
  t: number; frame: number; TAU: number;
  glowMul: number; orbPhase: number; flicker: number; lightningOn: boolean;
  spinA: number; hueShift: number; wingFlap: number; frostBlink: number; runePhase: number;
}

export interface RenderCtx {
  cfg: StaffConfig;
  N: number; S: number; W: number; small: boolean;
  buf: Pix;
  rng: () => number;
  pal: Palette;
  geo: Geometry;
  anim: AnimVars;
  /** tapered, 3-tone line */
  line: (x0: number, y0: number, x1: number, y1: number, w0: number, w1: number, c: RGB, dark: RGB, light: RGB, alpha?: number) => void;
  /** soft ring with optional outer glow */
  ringHalo: (cx: number, cy: number, r: number, th: number, c: RGB, alpha: number, glow?: number) => void;
  edgeDarken: (col: RGB, f: number) => RGB;
}

export function createContext(cfg: StaffConfig, animState?: Partial<AnimState>): RenderCtx {
  const N = cfg.resolution;
  const S = cfg.refined ? (N >= 128 ? 2 : 3) : 1;
  const W = N * S;
  const buf = new Pix(W, W);
  const small = N <= 16;

  /* ── animation ── */
  const animCfg = cfg.animation;
  const on = !!(animCfg && animCfg.type !== 'none');
  const frame = animState?.frame ?? 0;
  const seed = cfg.seed + (on ? Math.floor(frame * 13.37) : 0);
  const rng = mulberry32(seed || 1);
  const tRaw = animState?.t ?? 0;
  const ping = animState?.pingPong ? (tRaw < 0.5 ? tRaw * 2 : (1 - tRaw) * 2) : tRaw;
  const TAU = Math.PI * 2;
  const t = on ? ping : 0;
  const type: AnimationType = animCfg?.type ?? 'none';
  const intensity = animCfg?.intensity ?? 0;
  const is = (k: AnimationType) => on && type === k;

  const bobX = is('float') ? Math.sin(t * TAU * 2) * W * 0.012 : 0;
  const bobY = is('float') ? Math.sin(t * TAU) * W * 0.022 : 0;
  const rotA = is('float') ? Math.sin(t * TAU) * 0.025 : 0;
  let glowMul = 1;
  if (is('pulse-glow')) glowMul = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * TAU)) * intensity;
  if (is('heartbeat')) glowMul = 0.62 + 0.38 * Math.pow(Math.sin(Math.PI * (t * 2 % 1)), 2.2) * intensity;
  if (is('void-breath')) glowMul = 0.6 + 0.4 * Math.pow(0.5 + 0.5 * Math.sin(t * TAU + Math.PI), 2);
  const orbPhase = is('orbit') ? t * TAU * intensity : 0;
  // NOTE: rng consumption order below is part of the deterministic output — keep it.
  const flicker = is('flame-flicker') || is('ember-swirl') ? 0.72 + 0.28 * Math.sin(t * TAU * 4.3) + 0.18 * rng() : 1;
  const lightningOn = is('lightning-arc') && (frame % Math.max(2, Math.round(4 - intensity * 3))) !== 0 && rng() < 0.4 * intensity;
  const spinA = is('spin-gem') || is('holy-rays') ? t * TAU : is('clock-tick') ? (Math.floor(t * 12) / 12) * TAU : 0;
  const hueShift = is('rainbow-core') || is('chromatic-drift') ? t : is('shimmer-wave') ? t * 0.5 + Math.sin(t * TAU) * 0.05 : 0;
  const wingFlap = is('wings-flap') ? Math.sin(t * TAU * 2) * 0.5 : 0;
  const frostBlink = is('frost-shimmer') ? rng() : 0;
  const runePhase = is('rune-pulse') ? t : -1;

  const transform = (x: number, y: number): Vec => {
    let nx = x + bobX, ny = y + bobY;
    if (Math.abs(rotA) > 0.0001) {
      const cx = W * 0.5, cy = W * 0.5;
      const dx = nx - cx, dy = ny - cy;
      const cs = Math.cos(rotA), sn = Math.sin(rotA);
      nx = cx + dx * cs - dy * sn; ny = cy + dx * sn + dy * cs;
    }
    return [nx, ny];
  };

  /* ── palette ── */
  let gemC = hexToRgb(cfg.gemColor), gem2 = hexToRgb(cfg.gemColor2), glowC = hexToRgb(cfg.glowColor);
  if (hueShift > 0) {
    gemC = hueShiftRgb(gemC, hueShift);
    gem2 = hueShiftRgb(gem2, (hueShift + 0.1) % 1);
    glowC = hueShiftRgb(glowC, (hueShift - 0.05 + 1) % 1);
  }
  const pal: Palette = {
    shaftC: hexToRgb(cfg.shaftColor), shaftD: hexToRgb(cfg.shaftColor2),
    wrapC: hexToRgb(cfg.wrapColor), collarC: hexToRgb(cfg.collarColor),
    gemC, gem2, glowC, gemDark: shadeRgb(gemC, -0.45),
    partC: hexToRgb(cfg.particleColor), prongC: hexToRgb(cfg.prongColor), pommelC: hexToRgb(cfg.pommelColor),
    wingC: hexToRgb(cfg.wingColor), haloC: hexToRgb(cfg.haloColor), hornC: hexToRgb(cfg.hornColor),
    rarityC: hexToRgb(getRarity(cfg.rarity ?? 'common').color),
  };

  /* ── geometry ── */
  const LX = -0.7071, LY = -0.7071;
  const ang = (cfg.shaftAngle * Math.PI) / 180;
  const dir: Vec = [Math.cos(ang), Math.sin(ang)];
  const perp: Vec = [-dir[1], dir[0]];
  /** Shaft-free relics float centred in the frame: no handle, no collar, no pommel. */
  const shaftless = isShaftless(cfg.itemType);
  const mid: Vec = shaftless ? [W * 0.5, W * 0.5] : [W * 0.46, W * 0.57];
  const rawL = shaftless ? 0 : W * cfg.shaftLength * 0.92;
  const rawHeadR = Math.max(2.6 * S, (W * cfg.headSize) / 2);
  const rawGap = shaftless ? 0 : W * 0.016 + rawHeadR * 0.55;
  const rawThickness = Math.max(1.15 * S, W * cfg.shaftThickness);
  const tipScale = cfg.tipScale;
  const tipFactor = cfg.tipStyle === 'none' ? 0.45
    : cfg.tipStyle === 'floating-gem' ? 0.92 + 2.95 * tipScale
      : cfg.tipStyle === 'orbit-ring' || cfg.tipStyle === 'celestial-cage' || cfg.tipStyle === 'prism-vortex' ? 0.92 + 1.85 * tipScale
        : cfg.tipStyle === 'sun-disc' || cfg.tipStyle === 'moon-circlet' ? 0.92 + 1.55 * tipScale
          : cfg.tipStyle === 'phoenix-plume' || cfg.tipStyle === 'plume' ? 0.92 + 1.8 * tipScale
            : 0.92 + 1.5 * tipScale;
  const decorReach = Math.max(
    rawHeadR * tipFactor,
    cfg.itemType === 'scythe' || cfg.itemType === 'trident' ? rawHeadR * 2.65 : 0,
  ) + Math.abs(cfg.shaftCurve) * W + W * 0.035;
  const sideReach = Math.max(
    cfg.wings === 'none' ? 0 : rawHeadR * 2.15,
    cfg.halo === 'none' ? 0 : rawHeadR * (cfg.halo === 'sunburst' || cfg.halo === 'shattered' ? 1.9 : 1.55),
    cfg.orbiterStyle === 'none' ? 0 : rawHeadR * (cfg.orbiterRadius + cfg.orbiterSize * 1.6),
    rawHeadR * 0.72,
  );
  const pad = W * 0.045;
  const rawAlong = rawL + rawGap + decorReach + W * 0.045;
  // Shaft-free relics spread symmetrically, so bound the full diameter instead of a diagonal.
  const projection = shaftless
    ? 2 * Math.max(decorReach, sideReach)
    : Math.max(
      rawAlong * Math.abs(dir[0]) + 2 * sideReach * Math.abs(perp[0]),
      rawAlong * Math.abs(dir[1]) + 2 * sideReach * Math.abs(perp[1]),
    );
  const fit = Math.min(1, Math.max(0.38, (W - pad * 2) / Math.max(1, projection)));
  const L = rawL * fit;
  const baseThick = Math.max(1.0 * S, rawThickness * fit);
  const headR = rawHeadR * fit;
  const gap = rawGap * fit;
  let start: Vec = [mid[0] - (dir[0] * L) / 2, mid[1] - (dir[1] * L) / 2];
  let end: Vec = [mid[0] + (dir[0] * L) / 2, mid[1] + (dir[1] * L) / 2];
  let headC: Vec = [end[0] + dir[0] * gap, end[1] + dir[1] * gap];

  // Fit the entire head + finial/orbit into the square before translating it.
  const marginX = pad + sideReach * fit * Math.abs(perp[0]);
  const marginY = pad + sideReach * fit * Math.abs(perp[1]);
  const reach = decorReach * fit;
  const tMin = shaftless ? -reach : -L / 2 - W * 0.035;
  const tMax = shaftless ? reach : L / 2 + gap + reach;
  const xA = mid[0] + dir[0] * tMin, xB = mid[0] + dir[0] * tMax;
  const yA = mid[1] + dir[1] * tMin, yB = mid[1] + dir[1] * tMax;
  let ox = 0, oy = 0;
  const minX = Math.min(xA, xB) - marginX, maxX = Math.max(xA, xB) + marginX;
  const minY = Math.min(yA, yB) - marginY, maxY = Math.max(yA, yB) + marginY;
  if (minX < pad) ox = pad - minX;
  if (maxX + ox > W - pad) ox += (W - pad) - (maxX + ox);
  if (minY < pad) oy = pad - minY;
  if (maxY + oy > W - pad) oy += (W - pad) - (maxY + oy);
  start = transform(start[0] + ox, start[1] + oy);
  end = transform(end[0] + ox, end[1] + oy);
  headC = transform(headC[0] + ox, headC[1] + oy);

  const posAt = (tt: number): Vec => {
    const bx = lerp(start[0], end[0], tt), by = lerp(start[1], end[1], tt);
    const bend = Math.sin(tt * Math.PI) * cfg.shaftCurve * W;
    let jx = 0, jy = 0;
    if (cfg.shaftStyle === 'gnarled') {
      const j = Math.sin(tt * 22 + cfg.seed * 0.01) * W * 0.007 + Math.sin(tt * 47 + 1.7) * W * 0.004;
      jx = perp[0] * j; jy = perp[1] * j;
    }
    return [bx + perp[0] * bend + jx, by + perp[1] * bend + jy];
  };

  const collarPos = posAt(0.93);
  const collarLen = Math.max(1.6 * S, W * 0.04);
  const collarW = (baseThick / 2) * 1.35;
  const pomPos: Vec = [start[0] - dir[0] * W * 0.012, start[1] - dir[1] * W * 0.012];
  const tipOff = headR * 0.92 + headR * cfg.tipScale * 0.35;
  const tipC: Vec = [headC[0] + dir[0] * tipOff, headC[1] + dir[1] * tipOff];

  const geo: Geometry = {
    dir, perp, start, end, headC, headR, baseThick, L, LX, LY, shaftless,
    lightDot: perp[0] * LX + perp[1] * LY,
    posAt, collarPos, collarLen, collarW, pomPos, tipC, tipSize: headR * cfg.tipScale,
  };

  /* ── helpers ── */
  const line: RenderCtx['line'] = (x0, y0, x1, y1, w0, w1, c, dark, light, alpha = 255) => {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5) + 1;
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len, py = dx / len;
    for (let i = 0; i <= steps; i++) {
      const tt = i / steps;
      const x = lerp(x0, x1, tt), y = lerp(y0, y1, tt);
      const w = lerp(w0, w1, tt);
      for (let k = -w; k <= w; k += 0.6) {
        const e = w > 0 ? k / w : 0;
        const col = e < -0.5 ? dark : e > 0.4 ? light : c;
        buf.blend(x + px * k, y + py * k, col, alpha);
      }
    }
  };
  const ringHalo: RenderCtx['ringHalo'] = (cx, cy, r, th, c, alpha, glow = 0) => {
    for (let y = Math.floor(cy - r - th - 2); y <= cy + r + th + 2; y++) {
      for (let x = Math.floor(cx - r - th - 2); x <= cx + r + th + 2; x++) {
        const dd = Math.abs(Math.hypot(x - cx, y - cy) - r);
        if (dd <= th / 2) buf.blend(x, y, c, alpha * (0.6 + 0.4 * (1 - dd / (th / 2 + 0.001))));
        else if (glow > 0 && dd <= th / 2 + 3) buf.blend(x, y, c, glow * (1 - (dd - th / 2) / 3) * 70);
      }
    }
  };
  const edgeDarken = (col: RGB, f: number) => shadeRgb(col, -0.35 * f - 0.12);

  return {
    cfg, N, S, W, small, buf, rng, pal, geo,
    anim: { on, type, intensity, t, frame, TAU, glowMul, orbPhase, flicker, lightningOn, spinA, hueShift, wingFlap, frostBlink, runePhase },
    line, ringHalo, edgeDarken,
  };
}

export { WHITE };
