/* ═══════════════════════════════════════════════════════
   Render pipeline orchestrator
   ═══════════════════════════════════════════════════════ */
import type { AnimState, StaffConfig } from '../types';
import { createContext, RenderCtx } from './context';
import { drawOuterGlow, drawHalo, drawWings, drawHorns } from './decor';
import { drawShaft } from './shaft';
import { drawCollar, drawPommel, drawProngs, drawDangles } from './fittings';
import { drawHead } from './head';
import { drawSilhouette } from './extras';
import { drawTip } from './tips';
import { drawOrbiters } from './orbiters';
import { drawGemSettings } from './gems';
import { drawAdornments } from './adornments';
import { drawItemSignature } from './item-signatures';
import { drawParticles, drawAnimEmbellish, drawMotif, applyWear } from './fx';
import { applyOutline, applyEdgeLight, applyDropShadow, applyContrast, downsample, applyGlint, posterize } from './post';

/** Ordered paint stages (back → front). Order also fixes RNG consumption, so keep it stable. */
export const PAINT_STAGES: Array<[name: string, stage: (c: RenderCtx) => void]> = [
  ['glow', drawOuterGlow],
  ['halo', drawHalo],
  ['wings', drawWings],
  ['shaft', drawShaft],
  ['collar', drawCollar],
  ['pommel', drawPommel],
  ['prongs', drawProngs],
  ['horns', drawHorns],
  ['head', drawHead],
  ['gem-settings', drawGemSettings],
  ['silhouette', drawSilhouette],
  ['item-signature', drawItemSignature],
  ['adornments', drawAdornments],
  ['tip', drawTip],
  ['dangles', drawDangles],
  ['wear', applyWear],
  ['orbiters', drawOrbiters],
  ['particles', drawParticles],
  ['anim-fx', drawAnimEmbellish],
  ['motif', drawMotif],
  ['motif2', drawMotif2],
  ['outline', applyOutline],
  ['edge-light', applyEdgeLight],
];

/** Second motif layer — re-runs drawMotif with the alternate slot swapped in. */
function drawMotif2(c: RenderCtx) {
  const m2 = c.cfg.motif2;
  if (!m2 || m2 === 'none') return;
  const alt: RenderCtx = {
    ...c,
    cfg: { ...c.cfg, motif: m2, motifIntensity: c.cfg.motif2Intensity ?? 0.5, seed: c.cfg.seed + 7777 },
  };
  drawMotif(alt);
}

/** Render a config into raw N×N RGBA pixels. */
export function renderPixels(cfg: StaffConfig, anim?: Partial<AnimState>): { data: Uint8ClampedArray; size: number } {
  const c = createContext(cfg, anim);
  for (const [, stage] of PAINT_STAGES) stage(c);
  const shadowed = applyDropShadow(c);
  applyContrast(shadowed, cfg.contrast);
  // `softEdge` opts out of the vanilla hard-alpha snap for glow-heavy art.
  const out = downsample(shadowed, c.N, c.S, !cfg.softEdge);
  applyGlint(c, out);
  if (cfg.paletteSize && cfg.paletteSize >= 2) posterize(out, cfg.paletteSize);
  return { data: out, size: c.N };
}

/** Render into a canvas element (sized to the texture resolution). */
export function renderStaff(cfg: StaffConfig, canvas: HTMLCanvasElement, anim?: Partial<AnimState>) {
  const { data, size } = renderPixels(cfg, anim);
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);
  ctx.putImageData(new ImageData(new Uint8ClampedArray(data), size, size), 0, 0);
}

/** All animation frames as ImageData (single frame when static). */
export function renderAnimationFrames(cfg: StaffConfig): ImageData[] {
  const anim = cfg.animation;
  if (!anim || anim.type === 'none' || anim.frames <= 1) {
    const { data, size } = renderPixels(cfg);
    return [new ImageData(new Uint8ClampedArray(data), size, size)];
  }
  const frames: ImageData[] = [];
  for (let f = 0; f < anim.frames; f++) {
    const { data, size } = renderPixels(cfg, { frame: f, total: anim.frames, t: f / anim.frames, pingPong: anim.loopMode === 'pingpong' });
    frames.push(new ImageData(new Uint8ClampedArray(data), size, size));
  }
  return frames;
}

/** Minecraft `.png.mcmeta` for a vertical sprite strip. */
export function buildMcmeta(cfg: StaffConfig) {
  const ft = Math.max(1, Math.round(20 / (cfg.animation?.fps ?? 20)));
  // Life-pack convention: frametime 3 dominates and interpolate is on for smooth motion.
  return { animation: { frametime: ft, interpolate: true } };
}

export type { RenderCtx } from './context';
