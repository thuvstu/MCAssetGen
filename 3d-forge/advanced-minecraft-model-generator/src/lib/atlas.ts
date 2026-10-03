import { AtlasPattern, ColorPalette } from "./types";
import { shadeColor } from "./color";

/** Material → top-left anchor inside the 16-unit texture space. */
export const UV_ANCHORS: Record<string, [number, number]> = {
  primary: [0, 0],
  secondary: [4, 0],
  accent: [8, 0],
  bone: [12, 0],
  wood: [0, 4],
  cloth: [4, 4],
  gem: [8, 4],
  glow: [12, 4],
};

/**
 * Procedurally paints the Minecraft item texture: an 8-cell material atlas
 * where each cell gets a bevel, an edge highlight and a theme pattern.
 */
export function paintAtlas(
  palette: ColorPalette,
  resolution: 16 | 32 | 64 = 16,
  pattern: AtlasPattern = "dither"
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;
  const unit = resolution / 16; // 16-unit texture space → pixels
  const cell = unit * 4;

  const order: [string, number, number][] = [
    ["primary", 0, 0],
    ["secondary", 4, 0],
    ["accent", 8, 0],
    ["bone", 12, 0],
    ["wood", 0, 4],
    ["cloth", 4, 4],
    ["gem", 8, 4],
    ["glow", 12, 4],
  ];

  order.forEach(([key, ax, ay], index) => {
    const base = (palette as unknown as Record<string, string>)[key] ?? "#ff00ff";
    const px = Math.round(ax * unit);
    const py = Math.round(ay * unit);
    const w = Math.round(cell);

    ctx.fillStyle = base;
    ctx.fillRect(px, py, w, w);

    // bevel: light top-left edge, dark bottom-right edge
    ctx.fillStyle = shadeColor(base, 18);
    ctx.fillRect(px, py, w, Math.max(1, Math.round(unit * 0.5)));
    ctx.fillRect(px, py, Math.max(1, Math.round(unit * 0.5)), w);
    ctx.fillStyle = shadeColor(base, -20);
    ctx.fillRect(px, py + w - Math.max(1, Math.round(unit * 0.5)), w, Math.max(1, Math.round(unit * 0.5)));
    ctx.fillRect(px + w - Math.max(1, Math.round(unit * 0.5)), py, Math.max(1, Math.round(unit * 0.5)), w);

    // centre motif so each swatch reads as "worked material"
    ctx.fillStyle = shadeColor(base, key === "glow" || key === "gem" ? 26 : -14);
    const inner = Math.max(1, Math.round(unit));
    ctx.fillRect(px + w / 2 - inner, py + w / 2 - inner, inner * 2, inner * 2);
  });

  // theme pattern pass over the whole sheet
  const dot = Math.max(1, Math.round(unit / 2));
  for (let y = 0; y < resolution; y += dot) {
    for (let x = 0; x < resolution; x += dot) {
      const i = (x / dot + y / dot) | 0;
      let apply = false;
      switch (pattern) {
        case "dither":
          apply = (x / dot + y / dot) % 3 === 0;
          break;
        case "stripe":
          apply = y % (dot * 4) < dot;
          break;
        case "weave":
          apply = (x / dot) % 4 === 0 || (y / dot) % 4 === 0;
          break;
        case "grain":
          apply = (i * 2654435761) % 7 < 2;
          break;
        case "runes":
          apply = (x / dot) % 6 === 1 && (y / dot) % 6 !== 0;
          break;
      }
      if (!apply) continue;
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fillRect(x, y, dot, dot);
      ctx.fillStyle = "rgba(0,0,0,0.10)";
      ctx.fillRect(x + dot, y, dot, dot);
    }
  }

  return canvas;
}

export function atlasDataUrl(
  palette: ColorPalette,
  resolution: 16 | 32 | 64 = 16,
  pattern: AtlasPattern = "dither"
): string {
  if (typeof document === "undefined") return "";
  return paintAtlas(palette, resolution, pattern).toDataURL("image/png");
}
