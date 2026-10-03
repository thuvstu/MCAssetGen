import { findForm, findMode, findTheme, findTier } from "./data";
import type { AnimationFrame, EditorState, RenderOptions, TextureSource } from "./types";

export function getDimensions(texture: TextureSource) {
  if (texture instanceof HTMLImageElement) {
    return { width: texture.naturalWidth || texture.width, height: texture.naturalHeight || texture.height };
  }
  return { width: texture.width, height: texture.height };
}

export function colorToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3 ? normalized.split("").map((part) => part + part).join("") : normalized;
  const value = Number.parseInt(full, 16);
  return { red: (value >> 16) & 255, green: (value >> 8) & 255, blue: value & 255 };
}

function clampByte(value: number) {
  return Math.max(0, Math.min(255, value));
}

function drawPixelLine(
  context: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  width: number,
  color: string,
) {
  context.fillStyle = color;
  let x = startX;
  let y = startY;
  const dx = Math.abs(endX - startX);
  const sx = startX < endX ? 1 : -1;
  const dy = -Math.abs(endY - startY);
  const sy = startY < endY ? 1 : -1;
  let error = dx + dy;
  const radius = Math.floor(width / 2);
  while (true) {
    for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
      for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
        context.fillRect(x + offsetX, y + offsetY, 1, 1);
      }
    }
    if (x === endX && y === endY) break;
    const doubledError = 2 * error;
    if (doubledError >= dy) {
      error += dy;
      x += sx;
    }
    if (doubledError <= dx) {
      error += dx;
      y += sy;
    }
  }
}

export function createSampleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  drawPixelLine(context, 26, 2, 12, 16, 7, "#183e3a");
  drawPixelLine(context, 26, 2, 12, 16, 5, "#258d7b");
  drawPixelLine(context, 25, 3, 12, 16, 3, "#69dfbd");
  drawPixelLine(context, 25, 3, 15, 13, 1, "#d4fff0");
  drawPixelLine(context, 9, 15, 15, 21, 5, "#183b35");
  drawPixelLine(context, 9, 15, 15, 21, 3, "#bd9860");
  drawPixelLine(context, 12, 17, 5, 24, 5, "#1c3932");
  drawPixelLine(context, 12, 17, 5, 24, 3, "#80583a");
  drawPixelLine(context, 11, 18, 6, 23, 1, "#d6a76a");
  context.fillStyle = "#193b34";
  context.fillRect(2, 22, 6, 6);
  context.fillStyle = "#ac8451";
  context.fillRect(3, 23, 4, 4);
  context.fillStyle = "#f0cb81";
  context.fillRect(4, 24, 2, 2);
  context.fillStyle = "#edfff5";
  context.fillRect(23, 4, 1, 1);
  context.fillRect(19, 8, 1, 1);
  context.fillRect(16, 11, 1, 1);
  context.fillStyle = "#8df5d0";
  context.fillRect(21, 6, 1, 1);
  context.fillRect(17, 10, 1, 1);
  return canvas;
}

// ---------- base decorations (unchanged behaviour) ----------

function drawOutline(context: CanvasRenderingContext2D, width: number, height: number, accent: string) {
  const base = context.getImageData(0, 0, width, height);
  const outline = context.createImageData(width, height);
  const rgb = colorToRgb(accent);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (base.data[index + 3] !== 0) continue;
      const neighbors = [
        x > 0 ? index - 4 : -1,
        x + 1 < width ? index + 4 : -1,
        y > 0 ? index - width * 4 : -1,
        y + 1 < height ? index + width * 4 : -1,
      ];
      if (neighbors.some((neighbor) => neighbor >= 0 && base.data[neighbor + 3] > 0)) {
        outline.data[index] = rgb.red;
        outline.data[index + 1] = rgb.green;
        outline.data[index + 2] = rgb.blue;
        outline.data[index + 3] = 230;
      }
    }
  }
  const outlineCanvas = document.createElement("canvas");
  outlineCanvas.width = width;
  outlineCanvas.height = height;
  outlineCanvas.getContext("2d")?.putImageData(outline, 0, 0);
  context.save();
  context.globalCompositeOperation = "destination-over";
  context.drawImage(outlineCanvas, 0, 0);
  context.restore();
}

function applyPixelEnhancements(context: CanvasRenderingContext2D, width: number, height: number, editor: EditorState) {
  const hasNoise = editor.noise > 0;
  const hasHighlight = editor.highlight > 0;
  const hasScanline = editor.scanline > 0 || editor.decoration === "scanline";
  const hasEdge = editor.edge > 0 || ["frostedge", "ember", "lavaedge", "fracture", "crumbs"].includes(editor.decoration);
  if (!hasNoise && !hasHighlight && !hasScanline && !hasEdge) return;
  const image = context.getImageData(0, 0, width, height);
  const data = image.data;
  const noiseAmount = editor.noise / 100;
  const highlightAmount = editor.highlight / 100;
  const scanlineAmount = (editor.scanline / 100) * (editor.decoration === "scanline" ? 0.35 : 0.18);
  const edgeAmount = editor.edge / 100;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (data[i + 3] === 0) continue;
      if (hasNoise) {
        const seed = x * 73856093 ^ y * 19349663 ^ editor.seed * 83492791;
        const n = (Math.sin(seed) * 43758.5453) % 1;
        const value = (n < 0 ? -1 : 1) * Math.abs(n) * 38 * noiseAmount;
        data[i] = clampByte(data[i] + value);
        data[i + 1] = clampByte(data[i + 1] + value * 0.92);
        data[i + 2] = clampByte(data[i + 2] + value * 0.8);
      }
      if (hasHighlight) {
        const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        const boost = Math.max(0, lum - 0.55) * 130 * highlightAmount;
        data[i] = clampByte(data[i] + boost);
        data[i + 1] = clampByte(data[i + 1] + boost);
        data[i + 2] = clampByte(data[i + 2] + boost);
      }
      if (hasScanline) {
        const line = 1 - scanlineAmount * (y % 2 === 0 ? 1 : 0.45);
        data[i] = clampByte(data[i] * line);
        data[i + 1] = clampByte(data[i + 1] * line);
        data[i + 2] = clampByte(data[i + 2] * line);
      }
      const topAlpha = y > 0 ? data[((y - 1) * width + x) * 4 + 3] : 0;
      const bottomAlpha = y + 1 < height ? data[((y + 1) * width + x) * 4 + 3] : 0;
      const leftAlpha = x > 0 ? data[(y * width + x - 1) * 4 + 3] : 0;
      const rightAlpha = x + 1 < width ? data[(y * width + x + 1) * 4 + 3] : 0;
      const isObjectEdge = topAlpha === 0 || bottomAlpha === 0 || leftAlpha === 0 || rightAlpha === 0;
      if (hasEdge && isObjectEdge) {
        const edgeSeed = Math.abs((Math.sin(x * 91.7 + y * 47.3) * 43758.5453) % 1);
        const edgeValue = Math.min(1, edgeSeed * edgeAmount * 0.6 + 0.08);
        data[i] = clampByte(data[i] + 72 * edgeValue);
        data[i + 1] = clampByte(data[i + 1] + 82 * edgeValue);
        data[i + 2] = clampByte(data[i + 2] + 92 * edgeValue);
      }
    }
  }
  context.putImageData(image, 0, 0);
}

function drawShadow(context: CanvasRenderingContext2D, width: number, height: number) {
  const source = context.getImageData(0, 0, width, height);
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  sourceCanvas.getContext("2d")?.putImageData(source, 0, 0);
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = width;
  shadowCanvas.height = height;
  const shadowContext = shadowCanvas.getContext("2d");
  if (!shadowContext) return;
  for (let y = height - 2; y >= 0; y -= 1) {
    for (let x = width - 2; x >= 0; x -= 1) {
      const index = (y * width + x) * 4;
      if (source.data[index + 3] === 0) continue;
      if (x + 1 < width && y + 1 < height) {
        const targetIndex = ((y + 1) * width + (x + 1)) * 4;
        if (source.data[targetIndex + 3] === 0) {
          shadowContext.fillStyle = "rgba(0,0,0,0.42)";
          shadowContext.fillRect(x + 1, y + 1, 1, 1);
        }
      }
      if (y + 1 < height) {
        const downIndex = ((y + 1) * width + x) * 4;
        if (source.data[downIndex + 3] === 0) {
          shadowContext.fillStyle = "rgba(0,0,0,0.28)";
          shadowContext.fillRect(x, y + 1, 1, 1);
        }
      }
    }
  }
  context.save();
  context.globalCompositeOperation = "source-over";
  context.clearRect(0, 0, width, height);
  context.drawImage(shadowCanvas, 0, 0, width, height);
  context.drawImage(sourceCanvas, 0, 0, width, height);
  context.restore();
}

function drawGlow(context: CanvasRenderingContext2D, width: number, height: number, accent: string, strength: number) {
  if (strength <= 0) return;
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  source.getContext("2d")?.drawImage(context.canvas, 0, 0);
  const glow = document.createElement("canvas");
  glow.width = width;
  glow.height = height;
  const glowContext = glow.getContext("2d");
  if (!glowContext) return;
  glowContext.shadowBlur = Math.max(2, strength * 1.15);
  glowContext.shadowColor = accent;
  glowContext.drawImage(source, 0, 0, width, height);
  context.save();
  context.globalCompositeOperation = "screen";
  context.globalAlpha = Math.min(0.72, strength / 34);
  context.drawImage(glow, 0, 0, width, height);
  context.restore();
}

function drawEnchantedGlint(context: CanvasRenderingContext2D, width: number, height: number, accent: string) {
  const unit = Math.max(1, Math.round(Math.min(width, height) / 32));
  const rgb = colorToRgb(accent);
  const source = context.getImageData(0, 0, width, height);
  context.save();
  context.globalCompositeOperation = "screen";
  for (let band = -height; band < width + height; band += unit * 4) {
    for (let step = 0; step < Math.max(width, height); step += unit) {
      const drift = Math.round(Math.sin(band * 0.31 + step * 0.08) * unit * 2);
      const x = band + step + drift;
      const y = step + drift;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (source.data[(y * width + x) * 4 + 3] < 40) continue;
      const sparkle = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
      const sparkleAbs = Math.abs(sparkle);
      if (sparkleAbs < 0.66) continue;
      const intensity = Math.min(1, (sparkleAbs - 0.66) * 2.2);
      const white = sparkleAbs > 0.9;
      const purpleShift = sparkle < 0 ? -18 : 18;
      context.fillStyle = white
        ? `rgba(255,255,255,${0.72 * intensity})`
        : `rgba(${clampByte(rgb.red + purpleShift)},${clampByte(rgb.green - 12)},${clampByte(rgb.blue + purpleShift)},${0.7 * intensity})`;
      context.fillRect(x, y, unit, unit);
    }
  }
  context.restore();
}

function drawPixelGrid(context: CanvasRenderingContext2D, width: number, height: number, accent: string) {
  const unit = Math.max(1, Math.round(Math.min(width, height) / 32));
  context.save();
  context.globalCompositeOperation = "source-atop";
  context.strokeStyle = `${accent}26`;
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += unit) {
    context.beginPath();
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, height);
    context.stroke();
  }
  for (let y = 0; y <= height; y += unit) {
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(width, y + 0.5);
    context.stroke();
  }
  context.restore();
}

function drawVignette(context: CanvasRenderingContext2D, width: number, height: number, strength = 100) {
  context.save();
  context.globalCompositeOperation = "source-atop";
  const gradient = context.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.28, width / 2, height / 2, Math.max(width, height) * 0.76);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(1, `rgba(12,14,20,${0.74 * Math.min(100, Math.max(0, strength)) / 100})`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function drawHighlightsOverlay(context: CanvasRenderingContext2D, width: number, height: number, accent: string) {
  const source = context.getImageData(0, 0, width, height);
  const rgb = colorToRgb(accent);
  context.save();
  context.globalCompositeOperation = "screen";
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4;
      if (source.data[index + 3] === 0) continue;
      const up = ((y - 1) * width + x) * 4;
      const left = (y * width + (x - 1)) * 4;
      if (source.data[up + 3] === 0 || source.data[left + 3] === 0) {
        const lum = (0.299 * source.data[index] + 0.587 * source.data[index + 1] + 0.114 * source.data[index + 2]) / 255;
        const alpha = Math.min(120, 70 + lum * 120);
        context.fillStyle = `rgba(${Math.min(255, rgb.red + 90)},${Math.min(255, rgb.green + 90)},${Math.min(255, rgb.blue + 90)},${alpha / 255})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  }
  context.restore();
}

function scatter(context: CanvasRenderingContext2D, width: number, height: number, test: (seed: number) => string | null, edgeOnly = false) {
  const source = context.getImageData(0, 0, width, height);
  context.save();
  context.globalCompositeOperation = "screen";
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (source.data[index + 3] === 0) continue;
      if (edgeOnly && !(x === 0 || y === 0 || x === width - 1 || y === height - 1)) continue;
      const seed = Math.abs((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1);
      const color = test(seed);
      if (color) {
        context.fillStyle = color;
        context.fillRect(x, y, 1, 1);
      }
    }
  }
  context.restore();
}

function drawWaves(context: CanvasRenderingContext2D, width: number, height: number, accent: string) {
  const rgb = colorToRgb(accent);
  context.save();
  context.globalCompositeOperation = "screen";
  const step = Math.max(8, Math.round(Math.min(width, height) / 4));
  for (let offset = 0; offset < height; offset += step) {
    context.beginPath();
    for (let x = 0; x < width; x += 1) {
      const y = offset + Math.round(Math.sin(x / (step / 3)) * Math.max(1, step / 8));
      if (x === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = `rgba(${rgb.red},${rgb.green},${rgb.blue},0.18)`;
    context.lineWidth = 1;
    context.stroke();
  }
  context.restore();
}

function drawFracture(context: CanvasRenderingContext2D, width: number, height: number) {
  const crackCanvas = document.createElement("canvas");
  crackCanvas.width = width;
  crackCanvas.height = height;
  const crack = crackCanvas.getContext("2d");
  if (!crack) return;
  crack.strokeStyle = "rgba(0,0,0,0.42)";
  crack.lineWidth = 1;
  const branches = 5;
  for (let i = 0; i < branches; i += 1) {
    let x = Math.round(width / 2 + (i - branches / 2) * width / (branches * 2));
    let y = Math.round(height * 0.1 + i * 0.13 * height);
    crack.beginPath();
    crack.moveTo(x, y);
    for (let step = 0; step < height; step += 2) {
      x += Math.round(Math.sin(i * 7.7 + step * 0.7) * 1.4);
      y += Math.max(1, Math.round(height / 12));
      crack.lineTo(x, y);
    }
    crack.stroke();
  }
  context.save();
  context.globalCompositeOperation = "source-atop";
  context.drawImage(crackCanvas, 0, 0, width, height);
  context.restore();
}

function drawSingleDecoration(context: CanvasRenderingContext2D, width: number, height: number, editor: EditorState) {
  const unit = Math.max(1, Math.round(Math.min(width, height) / 32));
  const decoration = editor.decoration;
  if (decoration === "vignette") drawVignette(context, width, height, Math.max(editor.vignette, 78));
  else if (editor.vignette > 0) drawVignette(context, width, height, editor.vignette);
  if (decoration === "shadow") {
    drawShadow(context, width, height);
    return;
  }
  if (decoration === "outline") drawOutline(context, width, height, editor.accent);
  if (decoration === "pixelgrid") drawPixelGrid(context, width, height, editor.accent);
  if (decoration === "glow" || editor.glow > 0) {
    drawGlow(context, width, height, editor.accent, decoration === "glow" ? Math.max(editor.glow, 22) : editor.glow);
  }
  if (decoration === "enchanted") {
    context.save();
    context.globalCompositeOperation = "overlay";
    context.fillStyle = `${editor.accent}32`;
    context.fillRect(0, 0, width, height);
    context.restore();
    drawEnchantedGlint(context, width, height, editor.accent);
  }
  if (decoration === "highlights") drawHighlightsOverlay(context, width, height, editor.accent);
  if (decoration === "frostedge") {
    const rgb = colorToRgb(editor.accent);
    scatter(context, width, height, (seed) => (seed > 0.35 ? `rgba(${Math.min(255, rgb.red + 90)},${Math.min(255, rgb.green + 90)},${Math.min(255, rgb.blue + 90)},0.7)` : null), true);
  }
  if (decoration === "ember") {
    scatter(context, width, height, (seed) => (seed > 0.88 ? (seed > 0.96 ? "rgba(255,244,180,0.9)" : "rgba(255,116,34,0.72)") : null));
  }
  if (decoration === "lavaedge") {
    const rgb = colorToRgb(editor.accent);
    scatter(context, width, height, (seed) => (seed > 0.25 ? (seed > 0.8 ? "rgba(255,245,160,0.95)" : `rgba(${Math.min(255, rgb.red + 80)},${Math.min(255, rgb.green + 50)},${rgb.blue},0.9)`) : null), true);
  }
  if (decoration === "leaves") {
    scatter(context, width, height, (seed) => (seed > 0.82 ? (seed > 0.96 ? "rgba(255,245,150,0.85)" : editor.accent) : null));
  }
  if (decoration === "crumbs") {
    scatter(context, width, height, (seed) => (seed > 0.94 ? (seed > 0.98 ? "rgba(255,255,255,0.8)" : "rgba(180,180,170,0.7)") : null));
  }
  if (decoration === "wire") {
    const rgb = colorToRgb(editor.accent);
    context.save();
    context.globalCompositeOperation = "source-atop";
    context.strokeStyle = `rgba(${Math.min(255, rgb.red + 70)},${Math.min(255, rgb.green + 70)},${Math.min(255, rgb.blue + 70)},0.9)`;
    context.lineWidth = Math.max(1, Math.round(Math.min(width, height) / 16));
    const step = Math.max(8, Math.round(Math.min(width, height) / 4));
    for (let x = -height; x < width + height; x += step) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + Math.round(height * 0.45), height);
      context.stroke();
    }
    context.restore();
  }
  if (decoration === "petals") {
    const rgb = colorToRgb(editor.accent);
    scatter(context, width, height, (seed) => (seed > 0.85 ? `rgba(${clampByte(rgb.red + (seed > 0.93 ? 60 : -20))},${clampByte(rgb.green - 20)},${clampByte(rgb.blue + (seed > 0.93 ? 60 : -20))},0.9)` : null));
  }
  if (decoration === "scanline") {
    context.save();
    context.globalCompositeOperation = "multiply";
    context.fillStyle = "rgba(60,60,60,0.55)";
    for (let y = 0; y < height; y += 2) context.fillRect(0, y, width, 1);
    context.restore();
  }
  if (decoration === "waves") drawWaves(context, width, height, editor.accent);
  if (decoration === "fracture") drawFracture(context, width, height);

  if (decoration === "none" || decoration === "outline" || decoration === "pixelgrid" || decoration === "vignette") return;

  context.save();
  context.globalCompositeOperation = "screen";
  context.strokeStyle = editor.accent;
  context.fillStyle = editor.accent;
  context.lineWidth = unit;
  if (decoration === "sparkles") {
    const points = [[0.2, 0.25, 2.4], [0.76, 0.18, 1.7], [0.79, 0.72, 2.2], [0.18, 0.77, 1.5], [0.46, 0.08, 1.1]];
    points.forEach(([rx, ry, radius], index) => {
      const x = Math.round(width * rx);
      const y = Math.round(height * ry);
      const r = radius * unit;
      context.globalAlpha = index % 2 === 0 ? 0.95 : 0.66;
      context.beginPath();
      context.moveTo(x, y - r);
      context.lineTo(x, y + r);
      context.moveTo(x - r, y);
      context.lineTo(x + r, y);
      context.stroke();
      context.fillRect(x - Math.floor(unit / 2), y - Math.floor(unit / 2), unit, unit);
    });
  }
  if (decoration === "runes") {
    const arm = Math.max(5, Math.round(Math.min(width, height) * 0.15));
    const inset = Math.max(3, Math.round(Math.min(width, height) * 0.08));
    const corners = [[inset, inset, 1, 1], [width - inset, inset, -1, 1], [inset, height - inset, 1, -1], [width - inset, height - inset, -1, -1]];
    context.globalAlpha = 0.9;
    corners.forEach(([x, y, dirX, dirY]) => {
      context.beginPath();
      context.moveTo(x + dirX * arm, y);
      context.lineTo(x, y);
      context.lineTo(x, y + dirY * arm);
      context.moveTo(x + dirX * arm * 0.58, y + dirY * arm * 0.58);
      context.lineTo(x + dirX * arm * 0.15, y + dirY * arm * 0.15);
      context.stroke();
    });
  }
  if (decoration === "glint") {
    const gradient = context.createLinearGradient(width * 0.2, height * 0.75, width * 0.75, height * 0.2);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.48, editor.accent);
    gradient.addColorStop(0.55, "#ffffff");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.globalAlpha = 0.68;
    context.strokeStyle = gradient;
    context.lineWidth = unit * 1.5;
    context.beginPath();
    context.moveTo(width * 0.2, height * 0.75);
    context.lineTo(width * 0.75, height * 0.2);
    context.stroke();
  }
  context.restore();
}

// Decorations are independent layers. Keeping the stack here prevents one
// effect from erasing another and makes the editor extensible without adding
// more branches to the render pipeline.
function drawDecoration(context: CanvasRenderingContext2D, width: number, height: number, editor: EditorState) {
  const stack = editor.decorationStack.length > 0
    ? editor.decorationStack
    : editor.decoration === "none"
      ? []
      : [editor.decoration];
  stack.forEach((decoration) => {
    drawSingleDecoration(context, width, height, { ...editor, decoration });
  });
}

// ---------- model systems ----------

function applyTint(context: CanvasRenderingContext2D, width: number, height: number, color: string, alpha: number) {
  if (alpha <= 0) return;
  context.save();
  context.globalCompositeOperation = "source-atop";
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.fillRect(0, 0, width, height);
  context.restore();
}

// Merge tier + theme + mode + overclock adjustments into base editor values.
export function resolveEditor(editor: EditorState): EditorState {
  const tier = findTier(editor.tier);
  const theme = findTheme(editor.theme);
  const mode = findMode(editor.mode);
  const overclockRatio = editor.overclock / 100;

  const brightness = editor.brightness * tier.brightnessMul * mode.brightnessMul * (1 + overclockRatio * 0.12);
  const contrast = editor.contrast * tier.contrastMul;
  const saturation = editor.saturation * tier.saturationMul * theme.saturationMul * mode.saturationMul * (1 + overclockRatio * 0.15);
  const hue = editor.hue + theme.hueShift;
  const glow = Math.min(60, editor.glow + tier.glowAdd + mode.glowAdd + overclockRatio * 24);
  const highlight = Math.min(60, editor.highlight + tier.highlightAdd);
  const edge = Math.min(60, editor.edge + tier.edgeAdd);
  const accent = theme.id === "signature" ? editor.accent : theme.accent;

  return { ...editor, brightness, contrast, saturation, hue, glow, highlight, edge, accent };
}

function drawModeAura(context: CanvasRenderingContext2D, width: number, height: number, editor: EditorState, frame?: AnimationFrame) {
  const mode = findMode(editor.mode);
  if (mode.id === "none" || mode.auraAlpha <= 0) return;
  const pulse = mode.pulse && frame ? 0.5 + 0.5 * Math.sin(frame.time / 220) : 1;
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  source.getContext("2d")?.drawImage(context.canvas, 0, 0);
  const aura = document.createElement("canvas");
  aura.width = width;
  aura.height = height;
  const auraContext = aura.getContext("2d");
  if (!auraContext) return;
  auraContext.shadowBlur = Math.max(3, Math.min(width, height) * 0.35);
  auraContext.shadowColor = mode.aura;
  auraContext.drawImage(source, 0, 0, width, height);
  context.save();
  context.globalCompositeOperation = "screen";
  context.globalAlpha = mode.auraAlpha * pulse;
  context.drawImage(aura, 0, 0, width, height);
  context.restore();
}

function drawOverclockCracks(context: CanvasRenderingContext2D, width: number, height: number, editor: EditorState, frame?: AnimationFrame) {
  if (editor.overclock < 25) return;
  const intensity = (editor.overclock - 25) / 75;
  const rgb = colorToRgb(editor.accent);
  const flicker = frame ? 0.7 + 0.3 * Math.sin(frame.time / 90) : 1;
  const source = context.getImageData(0, 0, width, height);
  context.save();
  context.globalCompositeOperation = "screen";
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (source.data[index + 3] === 0) continue;
      const seed = Math.abs((Math.sin(x * 41.3 + y * 27.7 + editor.seed) * 43758.5453) % 1);
      if (seed > 1 - intensity * 0.14) {
        const white = seed > 0.985;
        context.fillStyle = white
          ? `rgba(255,255,255,${0.85 * flicker})`
          : `rgba(${Math.min(255, rgb.red + 80)},${Math.min(255, rgb.green + 80)},${Math.min(255, rgb.blue + 80)},${0.7 * flicker})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  }
  context.restore();
}

function drawThemeParticles(context: CanvasRenderingContext2D, width: number, height: number, editor: EditorState, frame?: AnimationFrame) {
  const theme = findTheme(editor.theme);
  if (theme.id === "signature") return;
  const t = frame ? frame.time / 1000 : 0;
  const count = Math.max(5, Math.round(Math.min(width, height) / 5));
  const rgb = colorToRgb(theme.accent);
  context.save();
  context.globalCompositeOperation = "screen";
  for (let i = 0; i < count; i += 1) {
    const phase = i / count;
    const drift = Math.sin(t * 1.4 + i * 1.7);
    let x = Math.round((phase * width + drift * 4 + i * 7) % width);
    let y: number;
    if (theme.particle === "flame" || theme.particle === "ray") {
      y = Math.round(height - ((t * (18 + i) + i * 9) % height));
    } else if (theme.particle === "frost" || theme.particle === "petal") {
      y = Math.round((t * (10 + i) + i * 11) % height);
      x = Math.round((x + Math.sin(t + i) * 5 + width) % width);
    } else if (theme.particle === "bolt") {
      y = Math.round((Math.sin(t * 6 + i) * 0.5 + 0.5) * height);
    } else {
      y = Math.round((Math.sin(t * 1.2 + i * 2.1) * 0.5 + 0.5) * height);
    }
    const bright = 0.5 + 0.5 * Math.abs(Math.sin(t * 3 + i));
    context.fillStyle = `rgba(${Math.min(255, rgb.red + 40)},${Math.min(255, rgb.green + 40)},${Math.min(255, rgb.blue + 40)},${0.55 * bright})`;
    const size = theme.particle === "bolt" ? 2 : 1;
    context.fillRect(x, y, size, size);
    if (theme.particle === "bolt" && Math.sin(t * 8 + i) > 0.9) {
      context.fillRect(x, 0, 1, y);
    }
  }
  context.restore();
}

// Compose the transformed model onto the output canvas honouring the form.
function drawTransformedModel(
  outputContext: CanvasRenderingContext2D,
  modelCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  editor: EditorState,
  frame?: AnimationFrame,
) {
  const form = findForm(editor.form);
  const cx = width / 2;
  const cy = height / 2;

  // Animation-driven transforms.
  let animRotate = 0;
  let animScale = 1;
  let animOffsetX = 0;
  let animOffsetY = 0;
  let animAlpha = 1;
  if (frame && frame.animation !== "idle") {
    const p = frame.progress;
    if (frame.animation === "slash") {
      animRotate = Math.sin(p * Math.PI) * 46 - 12;
      animOffsetX = Math.sin(p * Math.PI) * width * 0.06;
    } else if (frame.animation === "charge") {
      animScale = 1 + Math.sin(p * Math.PI) * 0.06;
      animOffsetY = -Math.sin(p * Math.PI) * height * 0.03;
    } else if (frame.animation === "cast") {
      animOffsetY = -Math.sin(p * Math.PI * 2) * height * 0.02;
      animRotate = Math.sin(p * Math.PI * 2) * 5;
    } else if (frame.animation === "channel") {
      animScale = 1 + Math.sin(p * Math.PI * 2) * 0.02;
    } else if (frame.animation === "burst") {
      animScale = 1 + p * 0.05;
      animAlpha = 1;
    }
  } else if (frame && frame.animation === "idle") {
    animOffsetY = Math.sin(frame.time / 620) * height * 0.012;
    animRotate = Math.sin(frame.time / 900) * 1.5;
  }

  const drawOne = (offsetX: number, mirror: boolean, alpha: number) => {
    outputContext.save();
    outputContext.globalAlpha = alpha;
    outputContext.translate(cx + offsetX + animOffsetX, cy + animOffsetY);
    outputContext.rotate(((form.rotate + animRotate) * Math.PI) / 180);
    const sx = form.scaleX * animScale * (mirror ? -1 : 1);
    const sy = form.scaleY * form.stretch * animScale;
    outputContext.scale(sx, sy);
    outputContext.imageSmoothingEnabled = false;
    outputContext.drawImage(modelCanvas, -width / 2, -height / 2, width, height);
    outputContext.restore();
  };

  const spectral = form.id === "spectral";
  const baseAlpha = spectral ? 0.72 : 1;

  if (form.doubleOffset > 0) {
    drawOne(-width * form.doubleOffset, false, baseAlpha * 0.85);
    drawOne(width * form.doubleOffset, form.mirror, baseAlpha * 0.85);
  } else {
    drawOne(0, false, baseAlpha * animAlpha);
  }

  if (spectral && frame) {
    // ghost trail
    outputContext.save();
    outputContext.globalAlpha = 0.25 + 0.15 * Math.sin(frame.time / 300);
    outputContext.globalCompositeOperation = "screen";
    outputContext.drawImage(modelCanvas, 0, 0, width, height);
    outputContext.restore();
  }
}

function drawAnimationFx(context: CanvasRenderingContext2D, width: number, height: number, editor: EditorState, frame: AnimationFrame) {
  if (!frame.playing || frame.animation === "idle") return;
  const accent = findTheme(editor.theme).id === "signature" ? editor.accent : findTheme(editor.theme).accent;
  const rgb = colorToRgb(accent);
  const p = frame.progress;
  context.save();
  context.globalCompositeOperation = "screen";

  if (frame.animation === "slash") {
    const sweep = p;
    context.strokeStyle = `rgba(${Math.min(255, rgb.red + 90)},${Math.min(255, rgb.green + 90)},${Math.min(255, rgb.blue + 90)},${0.85 * (1 - Math.abs(sweep - 0.5) * 2)})`;
    context.lineWidth = Math.max(1, Math.min(width, height) / 14);
    context.beginPath();
    const startAngle = -Math.PI * 0.75 + sweep * Math.PI * 1.2;
    context.arc(width / 2, height / 2, Math.min(width, height) * 0.55, startAngle, startAngle + 0.9);
    context.stroke();
  } else if (frame.animation === "cast") {
    const ringR = (Math.min(width, height) * 0.5) * (0.5 + 0.5 * Math.sin(p * Math.PI * 2));
    context.strokeStyle = `rgba(${rgb.red},${rgb.green},${rgb.blue},0.7)`;
    context.lineWidth = 1;
    for (let r = 0; r < 3; r += 1) {
      context.beginPath();
      context.arc(width / 2, height / 2, ringR - r * 3, 0, Math.PI * 2);
      context.stroke();
    }
    // rotating rune ticks
    const ticks = 8;
    for (let i = 0; i < ticks; i += 1) {
      const a = (i / ticks) * Math.PI * 2 + p * Math.PI * 2;
      const ex = width / 2 + Math.cos(a) * ringR;
      const ey = height / 2 + Math.sin(a) * ringR;
      context.fillStyle = `rgba(${Math.min(255, rgb.red + 60)},${Math.min(255, rgb.green + 60)},${Math.min(255, rgb.blue + 60)},0.8)`;
      context.fillRect(Math.round(ex), Math.round(ey), 1, 1);
    }
  } else if (frame.animation === "charge") {
    const count = 14;
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2;
      const dist = (Math.min(width, height) * 0.6) * (1 - p) + 2;
      const ex = width / 2 + Math.cos(a) * dist;
      const ey = height / 2 + Math.sin(a) * dist;
      context.fillStyle = `rgba(${Math.min(255, rgb.red + 70)},${Math.min(255, rgb.green + 70)},${Math.min(255, rgb.blue + 70)},${0.4 + 0.6 * p})`;
      context.fillRect(Math.round(ex), Math.round(ey), 1, 1);
    }
  } else if (frame.animation === "channel") {
    const beamW = Math.max(1, Math.round(width * 0.06));
    context.fillStyle = `rgba(${Math.min(255, rgb.red + 60)},${Math.min(255, rgb.green + 60)},${Math.min(255, rgb.blue + 60)},${0.4 + 0.3 * Math.sin(p * Math.PI * 2)})`;
    context.fillRect(Math.round(width / 2 - beamW / 2), 0, beamW, height);
  } else if (frame.animation === "burst") {
    const ringR = Math.min(width, height) * 0.7 * p;
    context.strokeStyle = `rgba(${Math.min(255, rgb.red + 90)},${Math.min(255, rgb.green + 90)},${Math.min(255, rgb.blue + 90)},${0.9 * (1 - p)})`;
    context.lineWidth = Math.max(1, Math.round((1 - p) * Math.min(width, height) * 0.12));
    context.beginPath();
    context.arc(width / 2, height / 2, ringR, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
}

// ---------- top-level render ----------

// Nearest-neighbour rescale to a square canvas (16-128px Minecraft sizes).
export function rescaleTexture(texture: TextureSource, size: number): HTMLCanvasElement {
  const source = getDimensions(texture);
  const canvas = document.createElement("canvas");
  const ratio = source.width / Math.max(1, source.height);
  const width = ratio >= 1 ? size : Math.max(1, Math.round(size * ratio));
  const height = ratio >= 1 ? Math.max(1, Math.round(size / ratio)) : size;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, width, height);
  context.drawImage(texture, 0, 0, source.width, source.height, 0, 0, width, height);
  return canvas;
}

// Renders base texture with color/decoration to a standalone canvas (no model transforms).
export function renderBaseModel(texture: TextureSource, editor: EditorState, dimensions: { width: number; height: number }) {
  const { width, height } = dimensions;
  const resolved = resolveEditor(editor);
  const pixelSize = Math.max(1, resolved.pixelSize);
  const reducedWidth = Math.max(1, Math.ceil(width / pixelSize));
  const reducedHeight = Math.max(1, Math.ceil(height / pixelSize));
  const workingCanvas = document.createElement("canvas");
  workingCanvas.width = reducedWidth;
  workingCanvas.height = reducedHeight;
  const workingContext = workingCanvas.getContext("2d");
  const modelCanvas = document.createElement("canvas");
  modelCanvas.width = width;
  modelCanvas.height = height;
  const modelContext = modelCanvas.getContext("2d", { willReadFrequently: true });
  if (!workingContext || !modelContext) return modelCanvas;

  workingContext.imageSmoothingEnabled = false;
  const glowBlur = resolved.glow > 0 && resolved.decoration !== "glow" ? Math.min(resolved.glow * 0.09, 1.4) : 0;
  workingContext.filter = `brightness(${resolved.brightness}%) contrast(${resolved.contrast}%) saturate(${resolved.saturation}%) hue-rotate(${resolved.hue}deg)${glowBlur > 0 ? ` drop-shadow(0 0 ${glowBlur * 1.6}px ${resolved.accent})` : ""}`;
  workingContext.drawImage(texture, 0, 0, reducedWidth, reducedHeight);
  workingContext.filter = "none";

  modelContext.imageSmoothingEnabled = false;
  modelContext.clearRect(0, 0, width, height);
  modelContext.drawImage(workingCanvas, 0, 0, width, height);

  const theme = findTheme(resolved.theme);
  applyTint(modelContext, width, height, theme.tint, theme.tintAlpha);
  const tier = findTier(resolved.tier);
  applyTint(modelContext, width, height, tier.overlay, tier.overlayAlpha);

  applyPixelEnhancements(modelContext, width, height, resolved);
  drawDecoration(modelContext, width, height, resolved);
  return modelCanvas;
}

// Composites the cached base model with form transforms, auras and animation FX.
export function composeFrame(
  modelCanvas: HTMLCanvasElement,
  rawEditor: EditorState,
  canvas: HTMLCanvasElement,
  dimensions: { width: number; height: number },
  options: RenderOptions = {},
) {
  const { width, height } = dimensions;
  if (!width || !height) return;
  const editor = resolveEditor(rawEditor);
  const frame = options.frame;
  const showFx = options.showModelFx !== false;

  canvas.width = width;
  canvas.height = height;
  const output = canvas.getContext("2d");
  if (!output) return;
  output.imageSmoothingEnabled = false;
  output.clearRect(0, 0, width, height);

  drawTransformedModel(output, modelCanvas, width, height, editor, frame);

  if (showFx) {
    drawOverclockCracks(output, width, height, editor, frame);
    drawModeAura(output, width, height, editor, frame);
    drawThemeParticles(output, width, height, editor, frame);
    if (frame) drawAnimationFx(output, width, height, editor, frame);
  }
}

export function renderTexture(
  texture: TextureSource,
  rawEditor: EditorState,
  canvas: HTMLCanvasElement,
  dimensions: { width: number; height: number },
  options: RenderOptions = {},
) {
  const { width, height } = dimensions;
  if (!width || !height) return;
  const base = renderBaseModel(texture, rawEditor, dimensions);
  composeFrame(base, rawEditor, canvas, dimensions, options);
}
