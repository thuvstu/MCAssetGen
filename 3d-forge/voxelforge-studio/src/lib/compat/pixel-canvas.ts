import { PNG } from "pngjs";

/**
 * Minimal RGBA canvas used by the server-side exporters.
 *
 * The ported studios drew their textures with a browser `<canvas>`; API routes
 * cannot, so the same operations are implemented on a plain pixel buffer and
 * encoded with pngjs.
 */

export interface RgbaCanvas {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export function createCanvas(width: number, height: number): RgbaCanvas {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

export type Color = [number, number, number, number];

/** Accepts #rgb, #rrggbb, rgb(r,g,b) and rgba(r,g,b,a). */
export function parseColor(value: string, alpha = 1): Color {
  const text = value.trim();
  if (text.startsWith("rgb")) {
    const parts = text
      .replace(/^rgba?\(|\)$/g, "")
      .split(",")
      .map((part) => Number.parseFloat(part));
    const a = parts.length > 3 && Number.isFinite(parts[3]) ? parts[3] : alpha;
    return [parts[0] | 0, parts[1] | 0, parts[2] | 0, Math.round(a * 255)];
  }
  let hex = text.replace("#", "");
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  if (hex.length < 6) hex = hex.padEnd(6, "0");
  const n = Number.parseInt(hex.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, Math.round(alpha * 255)];
}

export function fillRect(
  canvas: RgbaCanvas,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Color,
): void {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(canvas.width, Math.round(x + width));
  const y1 = Math.min(canvas.height, Math.round(y + height));
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const offset = (py * canvas.width + px) * 4;
      canvas.data[offset] = color[0];
      canvas.data[offset + 1] = color[1];
      canvas.data[offset + 2] = color[2];
      canvas.data[offset + 3] = color[3];
    }
  }
}

export function setPixel(
  canvas: RgbaCanvas,
  x: number,
  y: number,
  color: Color,
): void {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
  const offset = (y * canvas.width + x) * 4;
  canvas.data[offset] = color[0];
  canvas.data[offset + 1] = color[1];
  canvas.data[offset + 2] = color[2];
  canvas.data[offset + 3] = color[3];
}

/** One-pixel outline, matching `ctx.strokeRect(x + .5, y + .5, w - 1, h - 1)`. */
export function strokeRect(
  canvas: RgbaCanvas,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Color,
): void {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  fillRect(canvas, x, y, w, 1, color);
  fillRect(canvas, x, y + h - 1, w, 1, color);
  fillRect(canvas, x, y, 1, h, color);
  fillRect(canvas, x + w - 1, y, 1, h, color);
}

export function scaleCanvas(canvas: RgbaCanvas, scale: number): RgbaCanvas {
  if (scale === 1) return canvas;
  const out = createCanvas(canvas.width * scale, canvas.height * scale);
  for (let y = 0; y < out.height; y++) {
    for (let x = 0; x < out.width; x++) {
      const sx = Math.floor(x / scale);
      const sy = Math.floor(y / scale);
      const source = (sy * canvas.width + sx) * 4;
      const target = (y * out.width + x) * 4;
      out.data[target] = canvas.data[source];
      out.data[target + 1] = canvas.data[source + 1];
      out.data[target + 2] = canvas.data[source + 2];
      out.data[target + 3] = canvas.data[source + 3];
    }
  }
  return out;
}

export function canvasToPng(canvas: RgbaCanvas): Uint8Array {
  const png = new PNG({ width: canvas.width, height: canvas.height });
  png.data = Buffer.from(
    canvas.data.buffer,
    canvas.data.byteOffset,
    canvas.data.byteLength,
  );
  return new Uint8Array(PNG.sync.write(png));
}

/** Tints a hex colour by a multiplier, the shape used by every ported renderer. */
export function shadeColor(hex: string, amount: number): string {
  const [r, g, b] = parseColor(hex);
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  return `rgb(${clamp(r * amount)},${clamp(g * amount)},${clamp(b * amount)})`;
}
