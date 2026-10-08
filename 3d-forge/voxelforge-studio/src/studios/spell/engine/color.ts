export type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}

export function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function shiftHueToward(h: number, target: number, amount: number) {
  let diff = ((target - h + 540) % 360) - 180;
  const step = Math.sign(diff) * Math.min(Math.abs(diff), amount);
  diff = step;
  return h + diff;
}

/**
 * Hue-shifted 6-step ramp (index 0 = outline, 5 = specular highlight).
 * Shadows lean cool (blue/purple), highlights lean warm (yellow) — the
 * classic pixel-art technique used by vanilla Minecraft and popular packs.
 */
export type Ramp = RGB[];

export function makeRamp(hex: string, contrast = 1): Ramp {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  const steps = [-0.4, -0.25, -0.12, 0, 0.13, 0.27];
  const grey = s < 0.08;
  return steps.map((o) => {
    const off = o * contrast;
    const nl = Math.max(0.03, Math.min(0.97, l + off));
    const hueAmt = grey ? 0 : Math.abs(off) * 55;
    const nh = off < 0 ? shiftHueToward(h, 250, hueAmt) : shiftHueToward(h, 55, hueAmt * 0.8);
    const ns = grey ? s + (off < 0 ? 0.04 : 0) : Math.min(1, s * (off < 0 ? 1 + Math.abs(off) * 0.6 : 1 - off * 0.7));
    return hslToRgb(nh, ns, nl);
  });
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function lighten(c: RGB, amt: number): RGB {
  return mix(c, [255, 255, 255], amt);
}
