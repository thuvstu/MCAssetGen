/**
 * GRADIENT FIELDS — how a ramp is *mapped onto* a surface, independent of the
 * lighting. The height/shading pass produces a value in 0..1; a gradient field
 * produces another 0..1 value, and the two are blended with `mix`. This is what
 * lets a blade be top-lit AND diagonally graded, or a gem carry a radial core
 * without the bevel having to fake it.
 *
 * Every field is evaluated in part-local coordinates so it follows the object
 * rather than the canvas, and stays pixel-snappable at 16px.
 */
export type GradMode =
  | 'shaded' // no extra field: pure lighting (default)
  | 'linear' // straight sweep across the canvas
  | 'diagonal' // classic top-left → bottom-right metal ramp
  | 'radial' // hot core fading outward
  | 'vignette' // dark toward the edge, bright centre
  | 'split' // two halves separated by a soft seam along `angle`
  | 'band' // a bright band sweeping across, width = `band`
  | 'ripple' // concentric rings, animated-friendly
  | 'sweep'; // gradient that only applies near the silhouette (edge tint)

export type GradSpec = {
  mode: GradMode;
  /** degrees, used by linear / diagonal / split / band / sweep */
  angle: number;
  /** -1..1, shifts the whole field toward dark or light */
  bias: number;
  /** 0..2, how hard the field is pushed */
  contrast: number;
  /** 0..1, band width for `band`; ring spacing scale for `ripple` */
  spread: number;
  /** when true the field is measured from the part's own bbox, not the canvas */
  local: boolean;
};

export const DEFAULT_GRAD: GradSpec = {
  mode: 'shaded',
  angle: 135,
  bias: 0,
  contrast: 1,
  spread: 0.45,
  local: true,
};

/** bbox of the part in n-space (pixels), used to normalise local fields. */
export type PartBox = { cx: number; cy: number; rx: number; ry: number };

export function gradField(
  x: number,
  y: number,
  n: number,
  g: GradSpec,
  box: PartBox,
  /** 0..1 distance-to-edge normalised by the part's max distance */
  edgeT: number,
): number {
  const a = (g.angle * Math.PI) / 180;
  // coordinates in normalised part space (-1..1), or canvas space (0..1)
  const nx = g.local ? (x + 0.5 - box.cx) / Math.max(1, box.rx) : (x + 0.5) / n - 0.5;
  const ny = g.local ? (y + 0.5 - box.cy) / Math.max(1, box.ry) : (y + 0.5) / n - 0.5;
  let v = 0.5;
  switch (g.mode) {
    case 'shaded':
      return 0.5;
    case 'linear': {
      v = 0.5 - (nx * Math.cos(a) + ny * Math.sin(a)) * 0.5;
      break;
    }
    case 'diagonal': {
      // richer than linear: a curve so the bright end carries more of the area
      const t = 0.5 - (nx * Math.cos(a) + ny * Math.sin(a)) * 0.5;
      v = Math.pow(Math.max(0, Math.min(1, t)), 1.35);
      break;
    }
    case 'radial': {
      const r = Math.hypot(nx, ny * (g.local ? 1 : 1));
      v = 1 - Math.min(1, r * (0.9 + g.spread * 0.9));
      break;
    }
    case 'vignette': {
      const r = Math.hypot(nx, ny);
      v = Math.min(1, r * (1.1 + g.spread));
      break;
    }
    case 'split': {
      const d = nx * Math.cos(a) + ny * Math.sin(a);
      v = d > 0 ? 0.78 : 0.22;
      // soften the seam over a couple of pixels worth of distance
      v += -Math.sign(d) * Math.min(0.28, Math.abs(d) * 0.35);
      break;
    }
    case 'band': {
      const d = (nx * Math.cos(a) + ny * Math.sin(a)) * 0.5 + 0.5;
      const w = Math.max(0.06, g.spread);
      const k = (d - 0.5) / w;
      v = 0.5 + 0.5 * Math.exp(-k * k * 2.4);
      break;
    }
    case 'ripple': {
      const r = Math.hypot(nx, ny);
      const k = r * (3 + g.spread * 9);
      v = 0.5 + 0.5 * Math.sin(k * Math.PI * 2);
      break;
    }
    case 'sweep': {
      // brighten only the outer band near the silhouette
      const t = Math.max(0, Math.min(1, 1 - edgeT));
      v = 0.5 + 0.5 * Math.pow(t, 1.6) * (0.6 + g.spread);
      break;
    }
  }
  return v;
}
