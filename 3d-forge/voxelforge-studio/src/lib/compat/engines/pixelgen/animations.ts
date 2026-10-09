import {
  A, R, G, B, adjustLight, blendPx, clonePix, hash2, hsl, makePix, mix, noise2, Pix,
  rgbToHsl, rgba, rotateAny, shift, shiftHue, withAlpha, luminance, isEdge, getPx,
} from "./core";
import type { RenderResult } from "./generator";

export type AnimType =
  | "glow_pulse"
  | "rainbow_cycle"
  | "energy_flow"
  | "shimmer"
  | "flicker"
  | "sparkle"
  | "fire"
  | "drip"
  | "rotate"
  | "bob"
  | "lightning"
  | "aura_breathe"
  | "hue_wave"
  | "electric_arc"
  | "smoke";

export type AnimLayer = { type: AnimType; intensity: number; speed: number; enabled: boolean };

export const ANIM_TYPES: { id: AnimType; nameJa: string; name: string }[] = [
  { id: "glow_pulse", nameJa: "発光パルス", name: "Glow Pulse" },
  { id: "rainbow_cycle", nameJa: "虹彩サイクル", name: "Rainbow Cycle" },
  { id: "hue_wave", nameJa: "色相ウェーブ", name: "Hue Wave" },
  { id: "energy_flow", nameJa: "エネルギー流", name: "Energy Flow" },
  { id: "shimmer", nameJa: "シマー(光沢掃引)", name: "Shimmer" },
  { id: "flicker", nameJa: "ちらつき", name: "Flicker" },
  { id: "sparkle", nameJa: "きらめき", name: "Sparkle" },
  { id: "fire", nameJa: "炎", name: "Fire" },
  { id: "electric_arc", nameJa: "電撃アーク", name: "Electric Arc" },
  { id: "lightning", nameJa: "稲妻フラッシュ", name: "Lightning" },
  { id: "drip", nameJa: "血の滴り", name: "Blood Drip" },
  { id: "smoke", nameJa: "瘴気/煙", name: "Smoke" },
  { id: "aura_breathe", nameJa: "オーラ呼吸", name: "Aura Breathe" },
  { id: "rotate", nameJa: "回転", name: "Rotate" },
  { id: "bob", nameJa: "浮遊", name: "Bob / Float" },
];

export type AnimInfo = {
  glow: Float32Array; // 0..1
  tN: Float32Array; // 0..1 along axis
  glowColor: number;
  main: Uint8Array; // 1 = primary body pixel
  isAura: Uint8Array; // 1 = aura (translucent outside glow)
};

export function infoFromRender(r: RenderResult): AnimInfo {
  const n = r.pix.w * r.pix.h;
  const main = new Uint8Array(n);
  const isAura = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const a = A(r.pix.data[i]);
    if (a === 0) continue;
    if (a < 250 && r.roles[i] === 0) isAura[i] = 1;
    // blade, edge, head, core, metal, cover, barrel
    if ([1, 2, 3, 11, 14, 16, 19].includes(r.roles[i])) main[i] = 1;
  }
  return { glow: r.glow, tN: r.tN, glowColor: r.material.glow, main, isAura };
}

/** Derive animation info from an arbitrary image (imported / hand drawn). */
export function infoFromPix(p: Pix): AnimInfo {
  const n = p.w * p.h;
  const glow = new Float32Array(n);
  const tN = new Float32Array(n);
  const main = new Uint8Array(n);
  const isAura = new Uint8Array(n);
  let sumH = 0, cnt = 0, bestSat = 0, glowCol = rgba(255, 255, 255);
  let minD = Infinity, maxD = -Infinity;
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const i = y * p.w + x;
      const c = p.data[i];
      if (A(c) === 0) continue;
      const d = x - y;
      minD = Math.min(minD, d); maxD = Math.max(maxD, d);
    }
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const i = y * p.w + x;
      const c = p.data[i];
      if (A(c) === 0) continue;
      const [h, s, l] = rgbToHsl(R(c), G(c), B(c));
      const g = Math.max(0, (s - 0.35) * 1.5) * Math.max(0, (l - 0.4) * 2);
      glow[i] = Math.min(1, g);
      tN[i] = (x - y - minD) / Math.max(1, maxD - minD);
      main[i] = 1;
      if (A(c) < 250) isAura[i] = 1;
      if (s * l > bestSat) { bestSat = s * l; glowCol = hsl(h, 0.9, 0.65); }
      sumH += h; cnt++;
    }
  void sumH; void cnt;
  return { glow, tN, glowColor: glowCol, main, isAura };
}

type LayerFn = (src: Pix, base: Pix, phase: number, info: AnimInfo, intensity: number, frameIdx: number, speed: number) => Pix;

const LAYERS: Record<AnimType, LayerFn> = {
  glow_pulse: (src, _b, phase, info, k) => {
    const out = clonePix(src);
    const s = (Math.sin(phase * Math.PI * 2) + 1) / 2; // 0..1
    for (let i = 0; i < out.data.length; i++) {
      const g = info.glow[i];
      if (g <= 0 || A(out.data[i]) === 0) continue;
      const amt = (s - 0.5) * 0.5 * k * g;
      out.data[i] = adjustLight(out.data[i], amt, amt * 0.4);
      if (s > 0.7 && g > 0.7) out.data[i] = mix(out.data[i], withAlpha(info.glowColor, A(out.data[i])), (s - 0.7) * k * 0.8);
    }
    return out;
  },
  rainbow_cycle: (src, _b, phase, info, k) => {
    const out = clonePix(src);
    for (let i = 0; i < out.data.length; i++) {
      if (A(out.data[i]) === 0 || !info.main[i]) continue;
      out.data[i] = mix(out.data[i], shiftHue(out.data[i], phase), k);
    }
    return out;
  },
  hue_wave: (src, _b, phase, info, k) => {
    const out = clonePix(src);
    for (let i = 0; i < out.data.length; i++) {
      if (A(out.data[i]) === 0 || !info.main[i]) continue;
      const w = Math.sin((info.tN[i] - phase) * Math.PI * 2) * 0.12 * k;
      out.data[i] = shiftHue(out.data[i], w);
    }
    return out;
  },
  energy_flow: (src, _b, phase, info, k) => {
    const out = clonePix(src);
    for (let i = 0; i < out.data.length; i++) {
      if (A(out.data[i]) === 0 || !info.main[i]) continue;
      let d = ((info.tN[i] - phase) % 1 + 1) % 1; // 0..1
      d = Math.min(d, 1 - d) * 2; // distance to band 0..1
      const band = Math.max(0, 1 - d * 4);
      if (band > 0) out.data[i] = mix(out.data[i], withAlpha(mix(info.glowColor, rgba(255, 255, 255), 0.5), A(out.data[i])), band * k * 0.85);
    }
    return out;
  },
  shimmer: (src, _b, phase, _info, k) => {
    const out = clonePix(src);
    const S = out.w;
    const pos = phase * (S * 2 + 6) - 3;
    for (let y = 0; y < out.h; y++)
      for (let x = 0; x < S; x++) {
        const i = y * S + x;
        if (A(out.data[i]) === 0 || A(out.data[i]) < 250) continue;
        const d = Math.abs(x + y - pos);
        if (d < 2.2) {
          const f = (1 - d / 2.2) * k * 0.8;
          out.data[i] = mix(out.data[i], rgba(255, 255, 255, A(out.data[i])), f);
        }
      }
    return out;
  },
  flicker: (src, _b, _phase, info, k, idx) => {
    const out = clonePix(src);
    const seed = idx * 7919;
    for (let i = 0; i < out.data.length; i++) {
      if (A(out.data[i]) === 0 || info.glow[i] <= 0.2) continue;
      const v = (hash2(i, seed, 3) - 0.5) * 0.4 * k * info.glow[i];
      out.data[i] = adjustLight(out.data[i], v);
    }
    return out;
  },
  sparkle: (src, _b, phase, info, k, idx) => {
    const out = clonePix(src);
    const S = out.w;
    const n = Math.round((2 + S / 8) * k);
    for (let s = 0; s < n; s++) {
      // each sparkle lives for 3 frames; position seeded by its id and lifetime slot
      const life = Math.floor((idx + s * 3) / 3);
      const sub = (idx + s * 3) % 3;
      const x = Math.floor(hash2(s, life, 11) * S), y = Math.floor(hash2(s, life, 12) * S);
      if (A(getPx(out, x, y)) > 240) continue;
      const col = mix(info.glowColor, rgba(255, 255, 255), 0.5);
      const a = sub === 1 ? 255 : 150;
      blendPx(out, x, y, withAlpha(col, a));
      if (sub === 1) {
        blendPx(out, x + 1, y, withAlpha(col, 120)); blendPx(out, x - 1, y, withAlpha(col, 120));
        blendPx(out, x, y + 1, withAlpha(col, 120)); blendPx(out, x, y - 1, withAlpha(col, 120));
      }
    }
    void phase;
    return out;
  },
  fire: (src, base, phase, info, k, idx) => {
    const out = clonePix(src);
    const S = out.w;
    const cols = [rgba(255, 50, 10), rgba(255, 130, 20), rgba(255, 220, 90)];
    for (let y = 0; y < out.h; y++)
      for (let x = 0; x < S; x++) {
        const i = y * S + x;
        if (A(base.data[i]) > 0) continue;
        // distance to nearest content below-right (flames rise up/left)
        let near = 0;
        for (let d = 1; d <= 3; d++) {
          if (A(getPx(base, x + d, y)) > 200 || A(getPx(base, x, y + d)) > 200 || A(getPx(base, x + d, y + d)) > 200) { near = 4 - d; break; }
        }
        if (!near) continue;
        const nz = noise2(x * 0.5, y * 0.5 - idx * 0.9 * 1.0, 8) * 0.7 + noise2(x * 1.3, y * 1.3 + idx * 0.5, 9) * 0.3;
        const v = nz * (near / 3) * k * 1.4;
        if (v < 0.35) continue;
        const c = cols[v > 0.75 ? 2 : v > 0.55 ? 1 : 0];
        blendPx(out, x, y, withAlpha(mix(c, info.glowColor, 0.25), Math.min(255, (v - 0.3) * 500)));
      }
    void phase;
    return out;
  },
  electric_arc: (src, base, _phase, info, k, idx) => {
    const out = clonePix(src);
    const S = out.w;
    const col = mix(info.glowColor, rgba(255, 255, 255), 0.6);
    const n = Math.round(1 + k * 2);
    for (let a = 0; a < n; a++) {
      // find an edge pixel of content to start from
      let sx = -1, sy = -1;
      for (let tries = 0; tries < 30; tries++) {
        const x = Math.floor(hash2(idx, a * 31 + tries, 21) * S), y = Math.floor(hash2(idx, a * 31 + tries, 22) * S);
        if (isEdge(base, x, y)) { sx = x; sy = y; break; }
      }
      if (sx < 0) continue;
      let x = sx, y = sy;
      const len = 3 + Math.floor(hash2(idx, a, 23) * S * 0.25);
      for (let s = 0; s < len; s++) {
        const dir = hash2(idx, a * 100 + s, 24);
        x += dir < 0.33 ? -1 : dir < 0.66 ? 0 : 1;
        y += hash2(idx, a * 100 + s, 25) < 0.5 ? -1 : 1;
        if (A(getPx(base, x, y)) > 200) continue;
        blendPx(out, x, y, withAlpha(col, 230));
        if (s % 2 === 0) blendPx(out, x + 1, y, withAlpha(info.glowColor, 110));
      }
    }
    return out;
  },
  lightning: (src, _b, _phase, info, k, idx) => {
    const out = clonePix(src);
    const flash = hash2(idx, 0, 41) > 0.7;
    if (!flash) return out;
    for (let i = 0; i < out.data.length; i++) {
      if (A(out.data[i]) === 0) continue;
      out.data[i] = mix(out.data[i], withAlpha(mix(info.glowColor, rgba(255, 255, 255), 0.6), A(out.data[i])), 0.35 * k * (0.5 + info.glow[i] * 0.5));
    }
    return out;
  },
  drip: (src, base, phase, _info, k, _idx) => {
    const out = clonePix(src);
    const S = out.w;
    const blood = [rgba(150, 14, 30), rgba(210, 36, 52), rgba(245, 80, 90)];
    const n = Math.round(2 + k * S / 8);
    for (let d = 0; d < n; d++) {
      // choose a bottom edge pixel column
      const x = Math.floor(hash2(d, 1, 51) * S);
      let startY = -1;
      for (let y = out.h - 1; y >= 0; y--) if (A(getPx(base, x, y)) > 200) { startY = y; break; }
      if (startY < 0) continue;
      const len = 2 + Math.floor(hash2(d, 2, 52) * S * 0.3);
      const offset = (phase + hash2(d, 3, 53)) % 1;
      const headY = startY + 1 + Math.floor(offset * (len + 2));
      for (let y = startY + 1; y <= headY && y < out.h; y++) {
        if (A(getPx(base, x, y)) > 200) break;
        const isHead = y === headY;
        blendPx(out, x, y, withAlpha(blood[isHead ? 2 : 1], isHead ? 255 : 170));
        if (isHead && S >= 32) blendPx(out, x + 1, y, withAlpha(blood[0], 180));
      }
    }
    return out;
  },
  smoke: (src, base, _phase, info, k, idx) => {
    const out = clonePix(src);
    const S = out.w;
    for (let y = 0; y < out.h; y++)
      for (let x = 0; x < S; x++) {
        const i = y * S + x;
        if (A(base.data[i]) > 200) continue;
        let near = false;
        for (let d = 1; d <= 3 && !near; d++) if (A(getPx(base, x, y + d)) > 200 || A(getPx(base, x + d, y + d)) > 200) near = true;
        if (!near) continue;
        const nz = noise2(x * 0.35 + idx * 0.1, y * 0.35 - idx * 0.6, 61);
        if (nz < 0.55) continue;
        const col = mix(rgba(30, 20, 40), info.glowColor, 0.3);
        blendPx(out, x, y, withAlpha(col, (nz - 0.5) * 300 * k));
      }
    return out;
  },
  aura_breathe: (src, _b, phase, info, k) => {
    const out = clonePix(src);
    const s = (Math.sin(phase * Math.PI * 2) + 1) / 2;
    for (let i = 0; i < out.data.length; i++) {
      if (!info.isAura[i]) continue;
      const a = A(out.data[i]);
      out.data[i] = withAlpha(out.data[i], a * (0.55 + s * 0.6 * k));
    }
    return out;
  },
  rotate: (src, _b, phase, _info, k) => rotateAny(src, phase * Math.PI * 2 * k),
  bob: (src, _b, phase, _info, k) => shift(src, 0, Math.round(Math.sin(phase * Math.PI * 2) * k * Math.max(1, src.w / 16))),
};

export function buildAnimation(base: Pix, info: AnimInfo, layers: AnimLayer[], frameCount: number): Pix[] {
  const frames: Pix[] = [];
  const active = layers.filter((l) => l.enabled);
  if (active.length === 0) return [clonePix(base)];
  for (let f = 0; f < frameCount; f++) {
    let cur = clonePix(base);
    for (const l of active) {
      const phase = ((f * l.speed) / frameCount) % 1;
      cur = LAYERS[l.type](cur, base, phase, info, l.intensity, f, l.speed);
    }
    frames.push(cur);
  }
  return frames;
}

export function emptyLike(p: Pix): Pix {
  return makePix(p.w, p.h);
}
export { luminance };
