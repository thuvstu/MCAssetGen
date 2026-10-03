/**
 * Vanilla+ renderer — faithful 16×16 silhouettes with refined shading.
 *
 * Design contract (the whole point of Vanilla+):
 *  - Pixel positions are IDENTICAL to pure vanilla: same 16×16 opaque mask,
 *    same silhouette, zero added/removed pixels. Only colours change.
 *  - Deterministic: same inputs always produce the same bytes.
 *  - Resolution-independent: at 16px the refinement is per-cell (selective
 *    outline, inner highlight, grain); at 32px+ each vanilla pixel is further
 *    subdivided with a crisp pixel-art bevel (no blur, no anti-alias smear).
 *
 * Techniques (Vanilla Tweaks / Faithful style):
 *  - Selective outline: outline cells facing open space on the top/left are
 *    lifted toward their light tone; bottom/right outlines stay deep.
 *  - Inner highlight: mid-tone cells bordering light or open space on the
 *    lit side pick up a restrained highlight.
 *  - Bevel: within each upscaled cell, the top-left sub-pixels lighten and
 *    the bottom-right darken, like a chiselled pixel.
 *  - Grain: deterministic per-pixel micro variation on broad faces.
 *  - Gradient: a faint diagonal light falloff (top-left bright).
 */

import type { RGB } from "../engine/types";
import { renderVanillaItem, resolveColor, type TierPalette } from "./renderer";

export type VanillaRenderMode = "vanilla" | "vanilla_plus";

export interface VanillaPlusOptions {
  /** 0..1 — sub-pixel bevel strength (only visible at 32px+) */
  bevel: number;
  /** 0..1 — micro grain on broad faces */
  grain: number;
  /** 0..1 — inner highlight / selective-outline strength */
  highlight: number;
  /** soften outlines facing the light */
  selectiveOutline: boolean;
  /** 0..1 — diagonal light falloff */
  gradient: number;
}

export type VanillaPlusPresetId = "subtle" | "balanced" | "bold";

export const VANILLA_PLUS_PRESETS: Record<
  VanillaPlusPresetId,
  { label: string; desc: string; options: VanillaPlusOptions }
> = {
  subtle: {
    label: "Subtle",
    desc: "ほぼバニラ。輪郭と陰影をほんの少しだけ整理。",
    options: { bevel: 0.35, grain: 0.25, highlight: 0.5, selectiveOutline: true, gradient: 0.3 },
  },
  balanced: {
    label: "Balanced",
    desc: "推奨。Faithful系の質感とバニラの可読性の両立。",
    options: { bevel: 0.6, grain: 0.45, highlight: 0.8, selectiveOutline: true, gradient: 0.5 },
  },
  bold: {
    label: "Bold",
    desc: "強めのベベルと陰影。32px以上の高解像度向け。",
    options: { bevel: 0.85, grain: 0.65, highlight: 1, selectiveOutline: true, gradient: 0.7 },
  },
};

export const DEFAULT_VANILLA_PLUS: VanillaPlusOptions =
  VANILLA_PLUS_PRESETS.balanced.options;

export function clampPlusOptions(o: VanillaPlusOptions): VanillaPlusOptions {
  const cl = (v: number) => Math.max(0, Math.min(1, v));
  return {
    bevel: cl(o.bevel),
    grain: cl(o.grain),
    highlight: cl(o.highlight),
    selectiveOutline: !!o.selectiveOutline,
    gradient: cl(o.gradient),
  };
}

// ─── tiny local colour helpers (keeps the vanilla subsystem self-contained) ──
function shade(rgb: RGB, f: number): RGB {
  return rgb.map((c) => Math.max(0, Math.min(255, Math.round(c * f)))) as RGB;
}

function mix(a: RGB, b: RGB, t: number): RGB {
  const cl = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * cl),
    Math.round(a[1] + (b[1] - a[1]) * cl),
    Math.round(a[2] + (b[2] - a[2]) * cl),
  ];
}

/** Deterministic per-pixel hash in [0, 1). */
function hash01(x: number, y: number): number {
  let n =
    (Math.imul(x + 0x9e3779b9, 0x85ebca6b) ^
      Math.imul(y + 0xc2b2ae35, 0x27d4eb2f)) >>>
    0;
  n = Math.imul(n ^ (n >>> 15), 0x85ebca6b) >>> 0;
  return ((n >>> 8) % 1000) / 1000;
}

const OUTLINE_IDX = new Set([4, 6, 8]);

/** Light partner used for selective outline / highlight, per palette index. */
function lightPartner(idx: number, p: TierPalette): RGB {
  switch (idx) {
    case 4:
      return p.light;
    case 6:
      return p.handleLight;
    case 8:
      return p.guardLight;
    case 3:
      return p.mid;
    case 2:
      return p.light;
    case 7:
      return p.accent;
    default:
      return p.light;
  }
}

export interface VanillaPlusFrame {
  data: Uint8ClampedArray;
  /** 1 per opaque output pixel, 0 elsewhere — always identical to pure vanilla's mask */
  mask: Uint8Array;
  width: number;
  height: number;
}

/**
 * Pure (DOM-free) Vanilla+ rasteriser. Used by the canvas wrapper and by the
 * headless self-checks.
 */
export function vanillaPlusPixels(
  map: number[][],
  palette: TierPalette,
  outSize: number,
  options: VanillaPlusOptions = DEFAULT_VANILLA_PLUS
): VanillaPlusFrame {
  const G = 16;
  const scale = outSize / G;
  const o = clampPlusOptions(options);
  const data = new Uint8ClampedArray(outSize * outSize * 4);
  const mask = new Uint8Array(outSize * outSize);

  const at = (x: number, y: number): number =>
    x < 0 || y < 0 || x >= G || y >= G ? 0 : map[y][x];

  for (let sy = 0; sy < G; sy++) {
    for (let sx = 0; sx < G; sx++) {
      const idx = map[sy][sx];
      if (!idx) continue;
      const base = resolveColor(idx, palette);
      if (!base) continue;

      const openTop = at(sx, sy - 1) === 0;
      const openLeft = at(sx - 1, sy) === 0;
      const openBottom = at(sx, sy + 1) === 0;
      const openRight = at(sx + 1, sy) === 0;
      const litFacing = openTop || openLeft;
      const shadowFacing = openBottom || openRight;

      // ── cell-level tone: selective outline + inner highlight ──
      let col = base;
      if (OUTLINE_IDX.has(idx)) {
        if (o.selectiveOutline && litFacing && !shadowFacing) {
          col = mix(col, lightPartner(idx, palette), 0.3 * o.highlight);
        } else if (shadowFacing) {
          col = shade(col, 0.92);
        }
      } else if (idx === 2 || idx === 3 || idx === 7) {
        // mid tones bordering open space (or a light cell) on the lit side
        const nearLight =
          at(sx, sy - 1) === 1 || at(sx - 1, sy) === 1 || at(sx, sy - 1) === 9;
        if (litFacing || nearLight) {
          col = mix(col, lightPartner(idx, palette), 0.2 * o.highlight);
        } else if (openBottom && openRight) {
          col = shade(col, 0.94);
        }
      }

      // ── per output pixel: bevel + gradient + grain ──
      const x0 = Math.floor(sx * scale);
      const y0 = Math.floor(sy * scale);
      const x1 = Math.floor((sx + 1) * scale);
      const y1 = Math.floor((sy + 1) * scale);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          let f = 1;
          if (scale >= 2 && o.bevel > 0) {
            const fx = ((x % scale) + 0.5) / scale;
            const fy = ((y % scale) + 0.5) / scale;
            const l = ((1 - fx) + (1 - fy)) / 2; // 1 at top-left, 0 at bottom-right
            f *= 1 + (l - 0.5) * o.bevel * 0.3;
          }
          if (o.gradient > 0) {
            const g = 0.5 - (x + y) / (2 * outSize);
            f *= 1 + g * o.gradient * 0.16;
          }
          if (o.grain > 0) {
            const h = hash01(x, y) - 0.5; // [-0.5, 0.5)
            const amt = OUTLINE_IDX.has(idx) ? 0.07 : 0.13;
            f *= 1 + h * 2 * amt * o.grain;
          }
          const px = shade(col, f);
          const i = (y * outSize + x) * 4;
          data[i] = px[0];
          data[i + 1] = px[1];
          data[i + 2] = px[2];
          data[i + 3] = 255;
          mask[y * outSize + x] = 1;
        }
      }
    }
  }
  return { data, mask, width: outSize, height: outSize };
}

/** Canvas wrapper around {@link vanillaPlusPixels}. */
export function renderVanillaPlusItem(
  ctx: CanvasRenderingContext2D,
  map: number[][],
  palette: TierPalette,
  outSize: number,
  options: VanillaPlusOptions = DEFAULT_VANILLA_PLUS
): void {
  if (ctx.canvas && (ctx.canvas.width !== outSize || ctx.canvas.height !== outSize)) {
    ctx.canvas.width = outSize;
    ctx.canvas.height = outSize;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, outSize, outSize);
  const frame = vanillaPlusPixels(map, palette, outSize, options);
  const img = ctx.createImageData(outSize, outSize);
  img.data.set(frame.data);
  ctx.putImageData(img, 0, 0);
}

/** Single entry point: pure vanilla or Vanilla+ rendering. */
export function renderVanillaLike(
  ctx: CanvasRenderingContext2D,
  map: number[][],
  palette: TierPalette,
  outSize: number,
  mode: VanillaRenderMode = "vanilla",
  plus: VanillaPlusOptions = DEFAULT_VANILLA_PLUS
): void {
  if (mode === "vanilla_plus") {
    renderVanillaPlusItem(ctx, map, palette, outSize, plus);
  } else {
    renderVanillaItem(ctx, map, palette, outSize);
  }
}
