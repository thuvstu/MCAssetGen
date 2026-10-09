import { hexToRgb, hueShift, mix, mulberry32, shade } from "./color";
import { axisToPoint, createGeometry } from "./geometry";
import type { SwordGeometry } from "./geometry";
import { createShader } from "./shading";
import { bayer8, hashNoise01 } from "./dither";
import type { RGB, SwordOptions } from "./types";
import { ELEMENT_COLORS } from "./elements";

export const ANIMATION_SECONDS = 4;

type Prepared = {
  width: number; pixels: Uint8ClampedArray; flags: Uint8Array;
  occupied: number[]; geometry: SwordGeometry;
};
export type PixelFrame = { width: number; height: number; data: Uint8ClampedArray };
const cache = new Map<SwordOptions, Prepared>();
const TAU = Math.PI * 2;

function gemDistance(shape: SwordOptions["gemShape"], x: number, y: number): number {
  if (shape === "diamond") return Math.abs(x) + Math.abs(y);
  if (shape === "hex") return Math.max(Math.abs(x) * 0.866 + Math.abs(y) * 0.5, Math.abs(y));
  if (shape === "marquise") return Math.hypot(x, y / 1.3);
  if (shape === "teardrop") return Math.hypot(x, y * 0.85) * (1 + Math.max(0, -y) * 0.5);
  if (shape === "star") return Math.hypot(x, y) / (0.8 + 0.2 * Math.cos(Math.atan2(y, x) * 5));
  return Math.hypot(x, y);
}

function prepare(o: SwordOptions): Prepared {
  const found = cache.get(o);
  if (found) return found;
  const width = o.size * (o.antiAlias ? 2 : 1), scale = width / 16;
  const geometry = createGeometry(o);
  const shader = createShader(o, scale);
  const pixels = new Uint8ClampedArray(width * width * 4);
  const flags = new Uint8Array(width * width);
  const outline = o.outlineColorMode === "tinted" ? shade(hexToRgb(o.palette.bladeCore), 0.52) :
    o.outlineColorMode === "gold" ? shade(hexToRgb(o.palette.guard), 0.7) : hexToRgb(o.palette.outline);
  const coarse = o.detailLevel === "minecraft";
  // Outline cells: the *single* sample direction that opens onto empty space.
  // We pick the direction of the strongest silhouette change so diagonal stair-steps don't get outlined twice.
  const probe = coarse ? 0.55 : Math.max(0.18, Math.min(0.45, 1.2 / scale));
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      const lx = coarse ? Math.floor(x / scale) + 0.5 : (x + 0.5) / scale;
      const ly = coarse ? Math.floor(y / scale) + 0.5 : (y + 0.5) / scale;
      const s = geometry.sample(lx, ly);
      if (!s) continue;
      const i = y * width + x;
      let color = shader.color(s, lx, ly);
      const blade = ["blade", "edge", "core", "bevel"].includes(s.part);
      if (blade) flags[i] |= 1;
      if (shader.runeAt(s)) flags[i] |= 2;
      if (o.outline && o.outlineColorMode !== "none") {
        // Per-direction outline check: only outline in the *closest* empty direction.
        const dx1 = geometry.sample(lx + probe, ly), dx2 = geometry.sample(lx - probe, ly);
        const dy1 = geometry.sample(lx, ly + probe), dy2 = geometry.sample(lx, ly - probe);
        const dxL = !dx1, dxR = !dx2, dyT = !dy1, dyB = !dy2;
        const blankCount = +dxL + +dxR + +dyT + +dyB;
        // Most silhouettes will only flag in 1-2 directions. Skip cells where 3+ sides are empty
        // (likely on a thin corner, where outlining causes banding).
        if (blankCount > 0 && blankCount < 3) {
          const litSide = blade && s.across < -0.5;
          color = mix(color, outline, litSide ? 0.32 : 0.72);
        }
      }
      pixels.set([...color, 255], i * 4);
    }
  }
  // Bayer dither for low-detail modes: nudges solid mid-tones toward adjacent bands to avoid aliasing.
  if (o.detailLevel === "minecraft" || (o.detailLevel === "rich" && width <= 32)) {
    for (let y = 0; y < width; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (pixels[i * 4 + 3] < 40) continue;
        const t = bayer8(x, y) * 0.18;
        pixels[i * 4] = Math.max(0, Math.min(255, pixels[i * 4] + t * 14));
        pixels[i * 4 + 1] = Math.max(0, Math.min(255, pixels[i * 4 + 1] + t * 14));
        pixels[i * 4 + 2] = Math.max(0, Math.min(255, pixels[i * 4 + 2] + t * 14));
      }
    }
  }
  const drawGem = (d: number, radius: number) => {
    const center = axisToPoint(d, 0);
    const gem = hexToRgb(o.gemColor);
    const r = radius * scale;
    const cx = center.x * scale, cy = center.y * scale;
    for (let y = Math.max(0, Math.floor(cy - r * 1.6)); y < Math.min(width, cy + r * 1.6); y++) {
      for (let x = Math.max(0, Math.floor(cx - r * 1.6)); x < Math.min(width, cx + r * 1.6); x++) {
        const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r;
        const distance = gemDistance(o.gemShape, dx, dy);
        if (distance > 1.18) continue;
        const i = y * width + x;
        let color = distance > 1 ? outline : shade(gem, dx + dy < 0 ? 1.15 : 0.64);
        if (distance < 0.75 && dx < 0 && dy < 0) color = mix(color, [235, 248, 255], 0.55);
        // Sprinkle a single facet noise onto the gem for facets at high res
        if (scale > 4) {
          const facet = hashNoise01(Math.floor(x / (scale * 0.4)), Math.floor(y / (scale * 0.4)), Math.floor(o.effectSeed) % 1000);
          color = mix(color, shade(gem, 1.25), Math.max(0, facet - 0.6));
        }
        pixels.set([...color, 255], i * 4);
        flags[i] = distance < 1 ? 4 : 0;
      }
    }
  };
  if (o.gem) drawGem(geometry.guardD, Math.min(0.72, 0.32 + o.guardWidth * 0.07));
  if (o.pommelStyle === "gem") drawGem(geometry.pommelD, 0.38);
  const occupied: number[] = [];
  for (let i = 0; i < flags.length; i++) if (pixels[i * 4 + 3]) occupied.push(i);
  const result = { width, pixels, flags, occupied, geometry };
  if (cache.size >= 3) cache.delete(cache.keys().next().value!);
  cache.set(o, result);
  return result;
}

function blend(data: Uint8ClampedArray, width: number, x: number, y: number, col: RGB, opacity: number) {
  const px = Math.round(x), py = Math.round(y);
  if (px < 0 || py < 0 || px >= width || py >= width) return;
  const i = (py * width + px) * 4;
  const alpha = Math.max(0, Math.min(1, opacity));
  const oldAlpha = data[i + 3] / 255;
  const outAlpha = alpha + oldAlpha * (1 - alpha);
  if (!outAlpha) return;
  for (let c = 0; c < 3; c++) data[i + c] = (col[c] * alpha + data[i + c] * oldAlpha * (1 - alpha)) / outAlpha;
  data[i + 3] = outAlpha * 255;
}

function animate(data: Uint8ClampedArray, frame: Prepared, o: SwordOptions, phase: number) {
  const { width, geometry, occupied, flags } = frame;
  const scale = width / 16;
  const accent = hexToRgb(o.runeColor);
  const element = ELEMENT_COLORS[o.element].main;
  const sheenPosition = (phase * Math.max(1, Math.round(o.sheenSpeed * 2)) + o.sheenPos) % 1;
  for (const i of occupied) {
    const x = i % width, y = Math.floor(i / width);
    const d = (x - y) / scale;
    let col: RGB = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
    if (flags[i] & 1) {
      if (o.element !== "none") col = mix(col, element, o.elementIntensity * (0.1 + Math.sin(phase * TAU + d) * 0.04));
      if (o.holographic) col = hueShift(col, Math.sin(phase * TAU + d * 0.4) * 24);
      if (o.sheen) {
        const distance = Math.abs((d + 16) / 32 - sheenPosition);
        if (distance < 0.08) col = mix(col, [235, 243, 250], (1 - distance / 0.08) * 0.35);
      }
      if (o.tipGlow) {
        const tip = geometry.point(0.97);
        const dist = Math.hypot(x / scale - tip.x, y / scale - tip.y);
        if (dist < 2.4) col = mix(col, accent, (1 - dist / 2.4) * 0.3);
      }
    }
    if ((flags[i] & 2) && o.runePulse) col = mix(col, [232, 242, 255], (0.5 + 0.5 * Math.sin(phase * TAU + d)) * 0.3);
    if ((flags[i] & 4) && o.gemGlow) col = mix(col, [231, 247, 255], (0.5 + 0.5 * Math.sin(phase * TAU)) * 0.18);
    data[i * 4] = col[0]; data[i * 4 + 1] = col[1]; data[i * 4 + 2] = col[2];
  }
  if (o.sparkle || o.particles) {
    const rnd = mulberry32(o.effectSeed + 97);
    const count = Math.round(o.sparkleDensity * 15) + (o.particles ? 8 : 0);
    for (let i = 0; i < count; i++) {
      const t = 0.13 + rnd() * 0.73;
      const offset = (rnd() - 0.5) * (o.particles ? 5 : geometry.width(t));
      const angle = rnd() * TAU;
      const p = geometry.point(t, offset);
      const x = p.x * scale + (o.particles ? Math.sin(phase * TAU + angle) * scale * 0.4 : 0);
      const y = p.y * scale + (o.particles ? Math.cos(phase * TAU + angle) * scale * 0.65 : 0);
      const intensity = Math.max(0, Math.sin(phase * TAU + angle));
      if (intensity < 0.3) continue;
      blend(data, width, x, y, accent, intensity * 0.85);
      if (o.sparkle && i % 3 === 0) {
        const r = Math.max(1, Math.round(scale * 0.18));
        for (const [dx, dy] of [[-r, 0], [r, 0], [0, -r], [0, r]] as [number, number][]) blend(data, width, x + dx, y + dy, accent, intensity * 0.38);
      }
    }
  }
  if (o.lightning) {
    const rnd = mulberry32(o.effectSeed + 701 + Math.floor(phase * 12));
    let previous = geometry.point(0.05);
    for (let i = 1; i <= 15; i++) {
      const point = geometry.point(i / 16, (rnd() - 0.5) * 1.4);
      const steps = Math.max(1, Math.ceil(Math.hypot(point.x - previous.x, point.y - previous.y) * scale));
      for (let s = 0; s <= steps; s++) blend(data, width,
        (previous.x + (point.x - previous.x) * s / steps) * scale,
        (previous.y + (point.y - previous.y) * s / steps) * scale, accent, 0.85);
      previous = point;
    }
  }
  if (o.shatter) {
    for (let i = 0; i < 5; i++) {
      const angle = phase * TAU + i / 5 * TAU;
      const p = geometry.point(0.5 + Math.cos(angle) * 0.28, Math.sin(angle) * 3.2);
      const r = Math.max(1, Math.round(scale * 0.23));
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        if (Math.abs(x) + Math.abs(y) <= r) blend(data, width, p.x * scale + x, p.y * scale + y, accent, 0.65);
      }
    }
  }
}

export function renderPixels(o: SwordOptions, seconds = 0): PixelFrame {
  const frame = prepare(o);
  const data = new Uint8ClampedArray(frame.pixels);
  const phase = ((seconds / ANIMATION_SECONDS) % 1 + 1) % 1;
  animate(data, frame, o, phase);
  if (!o.antiAlias) return { width: o.size, height: o.size, data };
  const final = new Uint8ClampedArray(o.size * o.size * 4);
  for (let y = 0; y < o.size; y++) for (let x = 0; x < o.size; x++) {
    const sum = [0, 0, 0, 0];
    for (let oy = 0; oy < 2; oy++) for (let ox = 0; ox < 2; ox++) {
      const p = ((y * 2 + oy) * frame.width + x * 2 + ox) * 4;
      const a = data[p + 3] / 255;
      sum[0] += data[p] * a; sum[1] += data[p + 1] * a; sum[2] += data[p + 2] * a; sum[3] += a;
    }
    const p = (y * o.size + x) * 4;
    if (sum[3]) for (let c = 0; c < 3; c++) final[p + c] = sum[c] / sum[3];
    final[p + 3] = sum[3] / 4 * 255;
  }
  return { width: o.size, height: o.size, data: final };
}

export function renderSword(canvas: HTMLCanvasElement, o: SwordOptions, seconds = 0) {
  const frame = renderPixels(o, seconds);
  if (canvas.width !== frame.width || canvas.height !== frame.height) {
    canvas.width = frame.width; canvas.height = frame.height;
  }
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is not supported.");
  const image = context.createImageData(frame.width, frame.height);
  image.data.set(frame.data);
  context.putImageData(image, 0, 0);
}
