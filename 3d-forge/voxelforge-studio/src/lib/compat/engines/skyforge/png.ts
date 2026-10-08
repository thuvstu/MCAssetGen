import { deflateSync, inflateSync } from "node:zlib";
import { clamp } from "./colors";

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function u32(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const crcInput = new Uint8Array(typeBytes.length + data.length);
  crcInput.set(typeBytes, 0);
  crcInput.set(data, typeBytes.length);
  const crc = u32(crc32(crcInput));
  const out = new Uint8Array(4 + 4 + data.length + 4);
  out.set(u32(data.length), 0);
  out.set(typeBytes, 4);
  out.set(data, 8);
  out.set(crc, 8 + data.length);
  return out;
}

export function encodePng(
  width: number,
  height: number,
  rgba: ArrayLike<number>,
): Uint8Array {
  const stride = width * 4 + 1;
  const raw = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = y * stride + 1 + x * 4;
      raw[di] = clamp(rgba[si] ?? 0);
      raw[di + 1] = clamp(rgba[si + 1] ?? 0);
      raw[di + 2] = clamp(rgba[si + 2] ?? 0);
      raw[di + 3] = clamp(rgba[si + 3] ?? 0);
    }
  }

  const compressed = deflateSync(raw, { level: 9 });
  const ihdr = new Uint8Array(13);
  ihdr.set(u32(width), 0);
  ihdr.set(u32(height), 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", new Uint8Array())];
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** True nearest-neighbour resize in both directions (box filter for downscale). */
export function resizeNearest(
  pixels: number[],
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): { width: number; height: number; pixels: number[] } {
  const out = new Array<number>(dstW * dstH * 4).fill(0);
  for (let y = 0; y < dstH; y++) {
    const sy = Math.min(srcH - 1, Math.floor((y + 0.5) * srcH / dstH));
    for (let x = 0; x < dstW; x++) {
      const sx = Math.min(srcW - 1, Math.floor((x + 0.5) * srcW / dstW));
      const si = (sy * srcW + sx) * 4;
      const di = (y * dstW + x) * 4;
      out[di] = pixels[si] ?? 0;
      out[di + 1] = pixels[si + 1] ?? 0;
      out[di + 2] = pixels[si + 2] ?? 0;
      out[di + 3] = pixels[si + 3] ?? 0;
    }
  }
  return { width: dstW, height: dstH, pixels: out };
}

export function scaleNearest(
  pixels: number[],
  width: number,
  height: number,
  scale: number,
): { width: number; height: number; pixels: number[] } {
  const w = width * scale;
  const h = height * scale;
  const out = new Array(w * h * 4).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.floor(x / scale);
      const sy = Math.floor(y / scale);
      const si = (sy * width + sx) * 4;
      const di = (y * w + x) * 4;
      out[di] = pixels[si];
      out[di + 1] = pixels[si + 1];
      out[di + 2] = pixels[si + 2];
      out[di + 3] = pixels[si + 3];
    }
  }
  return { width: w, height: h, pixels: out };
}

export function composeCollage(
  textures: { pixels: number[]; width: number; height: number }[],
  size = 128,
): { width: number; height: number; pixels: number[] } {
  const pixels = new Array(size * size * 4).fill(0);
  const fill = (x: number, y: number, r: number, g: number, b: number, a: number) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
    pixels[i + 3] = a;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      fill(x, y, 18, 16, 28, 255);
    }
  }

  const count = Math.max(1, Math.min(4, textures.length));
  const cols = count <= 1 ? 1 : 2;
  const rows = Math.ceil(count / cols);
  const cell = Math.floor(size / Math.max(cols, rows));

  for (let i = 0; i < count; i++) {
    const tex = textures[i]!;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const ox = col * cell + Math.floor((cell - tex.width * Math.floor(cell / tex.width)) / 2);
    const oy = row * cell + Math.floor((cell - tex.height * Math.floor(cell / tex.height)) / 2);
    const s = Math.max(1, Math.floor(cell / Math.max(tex.width, tex.height)));
    for (let y = 0; y < tex.height * s; y++) {
      for (let x = 0; x < tex.width * s; x++) {
        const si = (Math.floor(y / s) * tex.width + Math.floor(x / s)) * 4;
        const a = tex.pixels[si + 3] ?? 0;
        if (a < 8) continue;
        fill(ox + x, oy + y, tex.pixels[si]!, tex.pixels[si + 1]!, tex.pixels[si + 2]!, a);
      }
    }
  }

  for (let i = 0; i < size; i++) {
    fill(i, 0, 212, 175, 55, 255);
    fill(i, size - 1, 212, 175, 55, 255);
    fill(0, i, 212, 175, 55, 255);
    fill(size - 1, i, 212, 175, 55, 255);
  }
  return { width: size, height: size, pixels };
}

/**
 * Minimal PNG decoder for our own 8-bit RGBA / RGB (non-interlaced) sprites.
 * Used server-side to turn curated masterwork PNGs into pixel arrays.
 */
export function decodePng(bytes: Uint8Array): { width: number; height: number; pixels: number[] } {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) if (bytes[i] !== sig[i]) throw new Error("not a PNG");
  let off = 8;
  let width = 0;
  let height = 0;
  let colorType = 6;
  let bitDepth = 8;
  let interlace = 0;
  const idat: Uint8Array[] = [];
  let palette: Uint8Array | null = null;
  let trns: Uint8Array | null = null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  while (off < bytes.length) {
    const len = dv.getUint32(off);
    const type = String.fromCharCode(bytes[off + 4]!, bytes[off + 5]!, bytes[off + 6]!, bytes[off + 7]!);
    const data = bytes.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = dv.getUint32(off + 8);
      height = dv.getUint32(off + 12);
      bitDepth = bytes[off + 16]!;
      colorType = bytes[off + 17]!;
      interlace = bytes[off + 20]!;
    } else if (type === "IDAT") idat.push(data);
    else if (type === "PLTE") palette = data;
    else if (type === "tRNS") trns = data;
    else if (type === "IEND") break;
    off += 12 + len;
  }
  if (bitDepth !== 8 || interlace !== 0) throw new Error("unsupported PNG variant");
  const total = idat.reduce((n, d) => n + d.length, 0);
  const joined = new Uint8Array(total);
  let p = 0;
  for (const d of idat) {
    joined.set(d, p);
    p += d.length;
  }
  const raw = new Uint8Array(inflateSync(joined));
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 0 ? 1 : 1;
  const stride = width * channels;
  const out = new Uint8Array(height * stride);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)]!;
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels]! : 0;
      const b = prev[x]!;
      const c = x >= channels ? prev[x - channels]! : 0;
      let v = line[x]!;
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const pp = a + b - c;
        const pa = Math.abs(pp - a);
        const pb = Math.abs(pp - b);
        const pc = Math.abs(pp - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 255;
    }
    out.set(cur, y * stride);
    prev = cur;
  }
  const pixels = new Array<number>(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    if (colorType === 6) {
      pixels[i * 4] = out[i * 4]!;
      pixels[i * 4 + 1] = out[i * 4 + 1]!;
      pixels[i * 4 + 2] = out[i * 4 + 2]!;
      pixels[i * 4 + 3] = out[i * 4 + 3]!;
    } else if (colorType === 2) {
      pixels[i * 4] = out[i * 3]!;
      pixels[i * 4 + 1] = out[i * 3 + 1]!;
      pixels[i * 4 + 2] = out[i * 3 + 2]!;
      pixels[i * 4 + 3] = 255;
    } else if (colorType === 3 && palette) {
      const idx = out[i]!;
      pixels[i * 4] = palette[idx * 3]!;
      pixels[i * 4 + 1] = palette[idx * 3 + 1]!;
      pixels[i * 4 + 2] = palette[idx * 3 + 2]!;
      pixels[i * 4 + 3] = trns && idx < trns.length ? trns[idx]! : 255;
    } else {
      const g = out[i * channels]!;
      pixels[i * 4] = g;
      pixels[i * 4 + 1] = g;
      pixels[i * 4 + 2] = g;
      pixels[i * 4 + 3] = channels === 2 ? out[i * 2 + 1]! : 255;
    }
  }
  return { width, height, pixels };
}
