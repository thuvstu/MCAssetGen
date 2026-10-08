/**
 * Perceptual colour maths (OKLab / OKLCH, Björn Ottosson 2020).
 * The essence analyser measures real packs in this space and the ramp builder
 * generates palettes in the same space, so measured numbers map 1:1 onto
 * generator parameters.
 */
export type RGB = [number, number, number];
export type LCH = { L: number; C: number; h: number };

const toLin = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const toSrgb = (v: number) => {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return c * 255;
};

export function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const R = toLin(r);
  const G = toLin(g);
  const B = toLin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToLinear(L: number, a: number, b: number): [number, number, number] {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function rgbToLch(r: number, g: number, b: number): LCH {
  const [L, A, B] = rgbToOklab(r, g, b);
  const C = Math.hypot(A, B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h };
}

/** OKLCH -> sRGB with chroma reduction until the colour sits inside the gamut. */
export function lchToRgb(L: number, C: number, h: number): RGB {
  const hr = (h * Math.PI) / 180;
  let c = Math.max(0, C);
  for (let i = 0; i < 24; i++) {
    const [r, g, b] = oklabToLinear(L, c * Math.cos(hr), c * Math.sin(hr));
    if (r >= -1e-4 && g >= -1e-4 && b >= -1e-4 && r <= 1.0001 && g <= 1.0001 && b <= 1.0001) {
      return [
        Math.round(Math.min(255, Math.max(0, toSrgb(r)))),
        Math.round(Math.min(255, Math.max(0, toSrgb(g)))),
        Math.round(Math.min(255, Math.max(0, toSrgb(b)))),
      ];
    }
    c *= 0.86;
  }
  const [r, g, b] = oklabToLinear(L, 0, 0);
  return [toSrgb(r), toSrgb(g), toSrgb(b)].map((v) => Math.round(Math.min(255, Math.max(0, v)))) as RGB;
}

/** signed shortest angular difference b - a, in degrees (-180..180] */
export const hueDelta = (a: number, b: number) => {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
};

export const lerpHue = (a: number, b: number, t: number) => (a + hueDelta(a, b) * t + 360) % 360;

export function circMean(hs: number[]): number {
  let x = 0;
  let y = 0;
  for (const h of hs) {
    x += Math.cos((h * Math.PI) / 180);
    y += Math.sin((h * Math.PI) / 180);
  }
  const m = (Math.atan2(y, x) * 180) / Math.PI;
  return m < 0 ? m + 360 : m;
}

export const hex = (c: RGB) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

export function hexToRgb(h: string): RGB {
  const v = h.replace('#', '');
  const n = parseInt(v.length === 3 ? v.split('').map((c) => c + c).join('') : v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
