import { encodePurePng } from "./png";
export { encodePurePng } from "./png";
import { FACES, type VoxelModel } from "./model-types";
import { faceUv, gridOf } from "./models";

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const channel = (hex: string, offset: number) => parseInt(hex.slice(offset, offset + 2), 16);

/**
 * Pixel-art atlas: 8 material tiles in a 4 × 2 grid. Each tile carries per-pixel noise,
 * a soft vertical gradient, sparkles and dark specks, in the spirit of vanilla textures.
 * The same canvas is used for the 3D preview and for the exported PNG (WYSIWYG).
 */
/** Generate raw RGBA pixel data for the 4x2 material atlas. Pure JS, runs in any environment. */
export function createTexturePixels(model: VoxelModel): Uint8Array {
  const size = model.resolution;
  const pixels = new Uint8Array(size * size * 4);
  const tileW = size / 4, tileH = size / 2;
  const gradient = (model as any).gradient;
  model.palette.forEach((color, index) => {
    const grad = gradient?.enabled ? (() => {
      const t = gradient.direction === "horizontal" ? (index % 4) / 3 : gradient.direction === "radial" ? Math.abs(index - 3.5) / 3.5 : index / 7;
      return gradient.colors[1];
    })() : null;
    const random = mulberry((model.textureSeed ?? model.seed) + index * 977);
    const col = index % 4, row = Math.floor(index / 4);
    for (let py = 0; py < tileH; py++) {
      for (let px = 0; px < tileW; px++) {
        const r = random();
        let factor = 1 + (r - .5) * .17 + (.5 - py / tileH) * .07;
        if (r > .93) factor += .13;
        else if (r < .045) factor -= .14;
        if (px === 0 || py === 0) factor += .05;
        if (px === tileW - 1 || py === tileH - 1) factor -= .05;
        const offset = ((row * tileH + py) * size + col * tileW + px) * 4;
        const baseColor = grad ?? color;
        for (let c = 0; c < 3; c++) pixels[offset + c] = Math.max(0, Math.min(255, Math.round(channel(baseColor, 1 + c * 2) * factor)));
        pixels[offset + 3] = 255;
      }
    }
  });
  return pixels;
}

export function createTextureCanvas(model: VoxelModel): HTMLCanvasElement {
  const size = model.resolution;
  if (typeof document === "undefined") {
    throw new Error("Canvas is only available in a browser environment.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("テクスチャを作成できませんでした。");
  const pixels = createTexturePixels(model);
  const image = context.createImageData(size, size);
  image.data.set(pixels);
  context.putImageData(image, 0, 0);
  return canvas;
}

/** Pure-JS helper to convert a data URL or model to a raw PNG byte array without relying on DOM. */
export function modelToPngBytes(model: VoxelModel): Uint8Array {
  if (model.texture?.source) {
    const base64 = model.texture.source.split(",")[1] ?? "";
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  }
  const size = model.resolution;
  const pixels = createTexturePixels(model);
  return encodePurePng(size, size, pixels);
}

/** Imported atlases and voxelized sprites keep their own pixels; everything else is generated. */
export const textureDataUrl = (model: VoxelModel): string => {
  if (model.texture?.source) return model.texture.source;
  if (typeof document !== "undefined") {
    try {
      return createTextureCanvas(model).toDataURL("image/png");
    } catch {
      // Fallback to pure PNG data URL
    }
  }
  const bytes = modelToPngBytes(model);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return "data:image/png;base64," + btoa(binary);
};

export const decodeTexturePng = (model: VoxelModel): Uint8Array => {
  return modelToPngBytes(model);
};

/** Generates a stylish 64x64 pack.png for the resource pack root, showing the VoxelForge icon. */
export function createPackIconPng(model: VoxelModel): Uint8Array {
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Dark stylized background
      ctx.fillStyle = "#16131c";
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = "#382d46";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 62, 62);

      const p = model.palette;
      const cTop = p[0] || "#c4a4ff";
      const cLeft = p[2] || "#9869e9";
      const cRight = p[3] || "#7850c5";

      ctx.fillStyle = cTop;
      ctx.beginPath();
      ctx.moveTo(32, 12); ctx.lineTo(50, 22); ctx.lineTo(32, 32); ctx.lineTo(14, 22);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = cLeft;
      ctx.beginPath();
      ctx.moveTo(14, 22); ctx.lineTo(32, 32); ctx.lineTo(32, 52); ctx.lineTo(14, 42);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = cRight;
      ctx.beginPath();
      ctx.moveTo(50, 22); ctx.lineTo(32, 32); ctx.lineTo(32, 52); ctx.lineTo(50, 42);
      ctx.closePath(); ctx.fill();

      ctx.strokeStyle = "#ffffff40";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, 12); ctx.lineTo(32, 32);
      ctx.moveTo(14, 22); ctx.lineTo(32, 32);
      ctx.moveTo(50, 22); ctx.lineTo(32, 32);
      ctx.moveTo(32, 32); ctx.lineTo(32, 52);
      ctx.stroke();

      const dataUrl = canvas.toDataURL("image/png");
      const base64 = dataUrl.split(",")[1] ?? "";
      return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    }
  }

  // Pure JS fallback when running in Node.js
  const pixels = new Uint8Array(64 * 64 * 4);
  const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [r, g, b] = hex(model.palette[0] || "#c4a4ff");
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const idx = (y * 64 + x) * 4;
      const isBorder = x <= 1 || x >= 62 || y <= 1 || y >= 62;
      const isInner = x >= 16 && x <= 48 && y >= 16 && y <= 48;
      if (isBorder) {
        pixels[idx] = 56; pixels[idx + 1] = 45; pixels[idx + 2] = 70; pixels[idx + 3] = 255;
      } else if (isInner) {
        pixels[idx] = r; pixels[idx + 1] = g; pixels[idx + 2] = b; pixels[idx + 3] = 255;
      } else {
        pixels[idx] = 22; pixels[idx + 1] = 19; pixels[idx + 2] = 28; pixels[idx + 3] = 255;
      }
    }
  }
  return encodePurePng(64, 64, pixels);
}

// ---- Animated "shimmer" texture (works in-game through a .png.mcmeta animation) ---------------------
export const SHIMMER_FRAMES = 8;
/** Only generated textures can shimmer; imported atlases and sprites keep their own pixels untouched. */
export const canShimmer = (model: VoxelModel) => !!model.extras?.animation.shimmer && !model.texture?.source;

/** Pixel rects of everything that should twinkle: glowing cubes, decorations and highlight colors. */
function shimmerRects(model: VoxelModel, size: number) {
  const grid = gridOf(model);
  const all = [...model.cubes, ...(model.variants ?? []).flatMap(variant => variant.cubes)];
  const rects: { x: number; y: number; w: number; h: number; phase: number }[] = [];
  all.forEach((cube, index) => {
    if (!(cube.group === "decor" || cube.glow || cube.color === 1 || cube.color === 7)) return;
    for (const face of FACES) {
      const [u0, v0, u1, v1] = faceUv(cube, face, size, size, grid);
      const x = Math.max(0, Math.floor(Math.min(u0, u1))), y = Math.max(0, Math.floor(Math.min(v0, v1)));
      const w = Math.min(size - x, Math.max(1, Math.ceil(Math.abs(u1 - u0)))), h = Math.min(size - y, Math.max(1, Math.ceil(Math.abs(v1 - v0))));
      if (w > 0 && h > 0) rects.push({ x, y, w, h, phase: (index * .137) % 1 });
    }
  });
  return rects;
}
/** Canvas frames and exported PNG use the exact same pixel computation. */
export function createShimmerFrames(model: VoxelModel, frames = SHIMMER_FRAMES): HTMLCanvasElement[] {
  const size = model.resolution;
  return shimmerPixelFrames(model, frames).map(pixels => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = size;
    const context = canvas.getContext("2d"); if (!context) throw new Error("テクスチャを作成できませんでした。");
    const data = context.createImageData(size, size); data.data.set(pixels); context.putImageData(data, 0, 0); return canvas;
  });
}
function shimmerPixelFrames(model: VoxelModel, frames: number) {
  const size = model.resolution, base = createTexturePixels(model), mask = new Float32Array(size * size);
  // Overlapping UV faces may reference the same tile hundreds of times. Apply brightness once, never cumulatively.
  for (const cube of [...model.cubes, ...(model.variants ?? []).flatMap(v => v.cubes)]) {
    if (cube.tint || !(cube.glow || cube.group === "decor" || cube.color === 1 || cube.color === 7)) continue;
    for (const face of FACES) {
      const [u0,v0,u1,v1] = faceUv(cube,face,size,size,gridOf(model));
      for (let y = Math.floor(Math.min(v0,v1)); y < Math.ceil(Math.max(v0,v1)); y++) for (let x = Math.floor(Math.min(u0,u1)); x < Math.ceil(Math.max(u0,u1)); x++) {
        if(x >= 0 && y >= 0 && x < size && y < size) mask[y * size + x] = 1;
      }
    }
  }
  return Array.from({ length: frames }, (_, frame) => {
    const pixels = new Uint8Array(base);
    for(let i=0;i<mask.length;i++) if(mask[i]) {
      const factor = 1 + .24 * Math.sin(Math.PI * 2 * (frame / frames + (i % size) / size * .3));
      for(let c=0;c<3;c++) pixels[i*4+c] = Math.min(255, Math.round(base[i*4+c]*factor));
    }
    return pixels;
  });
}
/** Pure JS generation of shimmer animation strip PNG bytes. Runs in both Node.js and browser. */
export function createShimmerStripBytes(model: VoxelModel, frames = SHIMMER_FRAMES): Uint8Array {
  const size = model.resolution;
  const pixels = new Uint8Array(size * size * frames * 4);
  shimmerPixelFrames(model, frames).forEach((frame, index) => pixels.set(frame, index * size * size * 4));
  return encodePurePng(size, size * frames, pixels);
}

/** Vertical strip of square frames, the layout Minecraft expects for animated textures. */
export function createShimmerStrip(model: VoxelModel, frames = SHIMMER_FRAMES): HTMLCanvasElement {
  if (typeof document === "undefined") {
    throw new Error("Canvas is only available in a browser environment.");
  }
  const list = createShimmerFrames(model, frames), size = list[0].width;
  const strip = document.createElement("canvas");
  strip.width = size; strip.height = size * frames;
  const context = strip.getContext("2d");
  if (!context) throw new Error("テクスチャを作成できませんでした。");
  list.forEach((frame, index) => context.drawImage(frame, 0, index * size));
  return strip;
}
