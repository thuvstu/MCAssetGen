import type { RGB } from "./types";
import { mix, shade } from "./color";

/**
 * Universal lighting model.
 *
 * Minecraft-style pixel art always assumes light from the **upper-left of the
 * image**, not the upper-left of the blade. Without this, curved blades look
 * strange: a horizontal cutlass lit by "blade-upper-left" has its tip glowing on
 * the wrong side compared to the rest of the inventory icon.
 *
 * Each shader receives the *image-space* light direction and the per-pixel
 * *object-space* normal (currently just the across-axis and progress), and the
 * helpers below compute:
 *  - the diffuse shading factor (used as the base multiplier),
 *  - the specular highlight along the lit edge (used as the bevel line),
 *  - the rim shadow on the dark edge.
 */
export type Lighting = {
  imageLightX: number;     // device-space light vector: x component in [-1, 1], top-left = +1
  imageLightY: number;     // device-space light vector: y component in [-1, 1], top = -1
  intensity: number;       // user shading factor
};

/** Default lighting matches vanilla-tex-pack conventions: light from upper-left. */
export function defaultLighting(shading: number): Lighting {
  return { imageLightX: 0.7071, imageLightY: -0.7071, intensity: shading };
}

/**
 * Returns the directional light intensity at a pixel given the *object* normal.
 * Normal is a 2D vector in device space; for sword pixels we approximate it from
 * the across-axis (perpendicular to the spine) and the progress slope (the angle of
 * the spine in image space).
 */
export function diffuse(normalX: number, normalY: number, l: Lighting): number {
  const dot = l.imageLightX * normalX + l.imageLightY * normalY;
  return 1 + dot * 0.45 * l.intensity;
}

/**
 * A clean edge highlight along the lit rim. Uses a soft Gaussian that is
 * direction-aware so it doesn't band.
 */
export function edgeHighlight(acrossLitEdge: number, l: Lighting): number {
  return Math.exp(-Math.pow(acrossLitEdge, 2) / 0.02) * l.intensity;
}

/** Dark shadow near the back (rim away from the light). */
export function rimShadow(acrossShadow: number, l: Lighting): number {
  return Math.exp(-Math.pow(acrossShadow, 2) / 0.05) * l.intensity;
}

/**
 * A small specular dot near the highlight. Returns 0..1.
 */
export function specular(across: number, l: Lighting): number {
  const peak = 0.32;
  const band = Math.exp(-Math.pow((across - peak) / 0.08, 2));
  return band * (0.7 * l.intensity + 0.1);
}

/**
 * Compute the lit direction in *object space* (across-axis perpendicular to the spine).
 * Used by shading helpers so they can ask "what is the lit side of this blade?".
 * Returns the across value where the highlight peaks.
 */
export function litEdgeAcross(): number {
  // The lit side is always the side that faces the upper-left of the image.
  // For diagonal swords, the spine points roughly upper-right; the lit rim
  // is therefore the upper-left rim of the blade — which is `across == -0.6`.
  return -0.6;
}

export function shadowEdgeAcross(): number {
  return 0.8;
}

/** Convenience: apply diffuse + edge highlight + rim shadow in one pass. */
export function paintLit(col: RGB, across: number, l: Lighting): RGB {
  const lit = litEdgeAcross(), shadow = shadowEdgeAcross();
  // diffuse ramp: bright on the lit side, dark on the back
  const t = (across - shadow) / (lit - shadow);
  const tt = Math.max(0, Math.min(1, t));
  let out: RGB = mix(shade(col, 0.72), col, tt);
  out = mix(out, shade(col, 1.18), Math.max(0, (across - 0) / (lit - 0)) * 0.45 * l.intensity);
  // specular dot
  out = mix(out, shade(col, 1.4), specular(across, l));
  // edge highlight (thin lit rim)
  out = mix(out, shade(col, 1.25), edgeHighlight(lit - across, l));
  // rim shadow (broader dark on the back)
  out = mix(out, shade(col, 0.65), rimShadow(across - shadow, l) * 0.6);
  return out;
}
