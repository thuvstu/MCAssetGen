/**
 * Pure vanilla Minecraft item renderer.
 *
 * Zero interpolation, zero blending — only direct palette lookup
 * and nearest-neighbor upscale.  At 16px each logical pixel = 1px.
 * At 32px each = 2×2, at 64px = 4×4, etc.
 *
 * This is the "honest" renderer that produces textures indistinguishable
 * from Mojang originals at native resolution, and crisp pixel art when upscaled.
 */

import type { RGB } from "../engine/types";

/** 9-tone palette per material tier */
export interface TierPalette {
  label: string;
  /** highlight: brightest point on the blade edge */
  light: RGB;
  /** mid: main blade body */
  mid: RGB;
  /** dark: shadow side / core */
  dark: RGB;
  /** border: outline / deepest shadow */
  shadow: RGB;
  /** handle body (leather wrap / wood stick) */
  handleLight: RGB;
  /** handle shadow / outline */
  handleDark: RGB;
  /** guard / crossguard bright face */
  guardLight: RGB;
  /** guard shadow side */
  guardDark: RGB;
  /** accent: bowstring, fishing line, gem, shield boss */
  accent: RGB;
}

/** Authentic Minecraft material palettes — values from Jappa's official textures */
export const TIER_PALETTES: Record<string, TierPalette> = {
  wood: {
    label: "Wood",
    light: [204, 158, 100],
    mid: [163, 114, 63],
    dark: [124, 83, 39],
    shadow: [79, 50, 20],
    handleLight: [153, 106, 55],
    handleDark: [82, 51, 21],
    guardLight: [178, 127, 70],
    guardDark: [93, 62, 27],
    accent: [214, 210, 200],
  },
  stone: {
    label: "Stone",
    light: [200, 200, 200],
    mid: [148, 148, 148],
    dark: [104, 104, 104],
    shadow: [66, 66, 66],
    handleLight: [147, 107, 59],
    handleDark: [88, 60, 30],
    guardLight: [158, 158, 158],
    guardDark: [78, 78, 78],
    accent: [220, 220, 226],
  },
  iron: {
    label: "Iron",
    light: [255, 255, 255],
    mid: [225, 225, 225],
    dark: [168, 168, 168],
    shadow: [98, 98, 98],
    handleLight: [147, 107, 59],
    handleDark: [88, 60, 30],
    guardLight: [207, 207, 207],
    guardDark: [118, 118, 118],
    accent: [236, 240, 246],
  },
  gold: {
    label: "Gold",
    light: [255, 254, 175],
    mid: [252, 235, 81],
    dark: [217, 166, 31],
    shadow: [140, 100, 18],
    handleLight: [147, 107, 59],
    handleDark: [88, 60, 30],
    guardLight: [252, 220, 72],
    guardDark: [154, 113, 22],
    accent: [255, 248, 210],
  },
  diamond: {
    label: "Diamond",
    light: [164, 253, 240],
    mid: [51, 235, 203],
    dark: [30, 138, 119],
    shadow: [14, 63, 54],
    handleLight: [137, 103, 39],
    handleDark: [40, 30, 11],
    guardLight: [43, 199, 172],
    guardDark: [21, 99, 85],
    accent: [216, 255, 250],
  },
  netherite: {
    label: "Netherite",
    light: [122, 114, 119],
    mid: [82, 73, 79],
    dark: [55, 46, 51],
    shadow: [34, 27, 30],
    handleLight: [108, 76, 44],
    handleDark: [62, 40, 21],
    guardLight: [82, 74, 79],
    guardDark: [45, 37, 41],
    accent: [188, 176, 184],
  },
  copper: {
    label: "Copper",
    light: [235, 160, 100],
    mid: [192, 107, 60],
    dark: [140, 75, 40],
    shadow: [90, 48, 25],
    handleLight: [147, 107, 59],
    handleDark: [88, 60, 30],
    guardLight: [200, 120, 68],
    guardDark: [110, 65, 32],
    accent: [246, 208, 172],
  },
  emerald: {
    label: "Emerald",
    light: [170, 255, 170],
    mid: [80, 220, 80],
    dark: [40, 170, 50],
    shadow: [22, 110, 30],
    handleLight: [147, 107, 59],
    handleDark: [88, 60, 30],
    guardLight: [100, 200, 100],
    guardDark: [50, 140, 55],
    accent: [216, 255, 220],
  },
  amethyst: {
    label: "Amethyst",
    light: [230, 200, 255],
    mid: [178, 120, 225],
    dark: [128, 70, 175],
    shadow: [78, 38, 110],
    handleLight: [147, 107, 59],
    handleDark: [88, 60, 30],
    guardLight: [190, 140, 230],
    guardDark: [100, 55, 145],
    accent: [244, 228, 255],
  },
  prismarine: {
    label: "Prismarine",
    light: [192, 248, 236],
    mid: [100, 186, 172],
    dark: [58, 132, 125],
    shadow: [30, 80, 78],
    handleLight: [80, 132, 124],
    handleDark: [42, 80, 76],
    guardLight: [118, 200, 190],
    guardDark: [48, 110, 105],
    accent: [222, 252, 246],
  },
  breeze: {
    label: "Breeze Rod (1.21)",
    light: [214, 220, 238],
    mid: [124, 132, 158],
    dark: [74, 80, 104],
    shadow: [36, 40, 56],
    handleLight: [238, 198, 118],
    handleDark: [152, 92, 44],
    guardLight: [176, 184, 214],
    guardDark: [62, 66, 88],
    accent: [240, 248, 255],
  },
};

/**
 * Resolve a palette index to an RGB color.
 * Index 0 = transparent (returns null).
 * 1 = light, 2 = mid, 3 = dark, 4 = shadow,
 * 5 = handleLight, 6 = handleDark, 7 = guardLight, 8 = guardDark, 9 = accent.
 */
export function resolveColor(idx: number, p: TierPalette): RGB | null {
  switch (idx) {
    case 0: return null;
    case 1: return p.light;
    case 2: return p.mid;
    case 3: return p.dark;
    case 4: return p.shadow;
    case 5: return p.handleLight;
    case 6: return p.handleDark;
    case 7: return p.guardLight;
    case 8: return p.guardDark;
    case 9: return p.accent;
    default: return null;
  }
}

/**
 * Render a pure vanilla texture at `outSize` (16, 32, 48, 64, 128, or 256).
 *
 * Uses exact pixel-for-pixel palette lookup + nearest-neighbor upscale.
 * No smoothing, no blending, no shading computation — the vanilla way.
 */
export function renderVanillaItem(
  ctx: CanvasRenderingContext2D,
  map: number[][],
  palette: TierPalette,
  outSize: number
) {
  const srcSize = map.length; // always 16
  const scale = outSize / srcSize;

  if (ctx.canvas && (ctx.canvas.width !== outSize || ctx.canvas.height !== outSize)) {
    ctx.canvas.width = outSize;
    ctx.canvas.height = outSize;
  }

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, outSize, outSize);

  const img = ctx.createImageData(outSize, outSize);
  const d = img.data;

  for (let sy = 0; sy < srcSize; sy++) {
    for (let sx = 0; sx < srcSize; sx++) {
      const col = resolveColor(map[sy][sx], palette);
      if (!col) continue;

      const x0 = Math.floor(sx * scale);
      const y0 = Math.floor(sy * scale);
      const x1 = Math.floor((sx + 1) * scale);
      const y1 = Math.floor((sy + 1) * scale);

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * outSize + x) * 4;
          d[i] = col[0];
          d[i + 1] = col[1];
          d[i + 2] = col[2];
          d[i + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(img, 0, 0);
}

/** Build a custom palette from a base colour using hue-shifted shading rules */
export function buildCustomPalette(baseHex: string, style: "warm" | "cool" | "neutral"): TierPalette {
  const n = parseInt(baseHex.replace("#", ""), 16);
  const r0 = (n >> 16) & 255, g0 = (n >> 8) & 255, b0 = n & 255;
  const l = 0.299 * r0 + 0.587 * g0 + 0.114 * b0;

  const mul = (f: number): RGB => [
    Math.max(0, Math.min(255, Math.round(r0 * f))),
    Math.max(0, Math.min(255, Math.round(g0 * f))),
    Math.max(0, Math.min(255, Math.round(b0 * f))),
  ];

  const hueShift = (deg: number): RGB => {
    const shift = deg / 360;
    const rr = Math.max(0, Math.min(255, r0 + shift * 40));
    const gg = Math.max(0, Math.min(255, g0 + (style === "cool" ? shift * 20 : -shift * 10)));
    const bb = Math.max(0, Math.min(255, b0 + (style === "warm" ? -shift * 20 : shift * 40)));
    return [Math.round(rr), Math.round(gg), Math.round(bb)];
  };

  const light = l > 160 ? mul(1.05) : mul(1.32);
  const mid = mul(1.0);
  const dark = mul(0.68);
  const shadow = mul(0.35);

  return {
    label: baseHex,
    light,
    mid,
    dark,
    shadow,
    handleLight: [147, 107, 59],
    handleDark: [68, 44, 20],
    guardLight: hueShift(15),
    guardDark: hueShift(-30),
    accent: mul(1.45),
  };
}
