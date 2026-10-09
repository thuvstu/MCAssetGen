import { deflateSync, inflateSync } from "node:zlib";
import type { Tex } from "./tex";
import { createTex } from "./tex";

// Minimal PNG codec (8-bit RGB/RGBA, non-interlaced). No dependencies.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

function join(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { out.set(p, offset); offset += p.length; }
  return out;
}

export function encodePng(tex: Tex): Uint8Array {
  const { w, h, d } = tex;
  const raw = new Uint8Array((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    raw.set(d.subarray(y * w * 4, (y + 1) * w * 4), y * (w * 4 + 1) + 1);
  }
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, w);
  view.setUint32(4, h);
  ihdr[8] = 8; ihdr[9] = 6;
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  return join([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", new Uint8Array(0))]);
}

function readChunks(bytes: Uint8Array): { type: string; data: Uint8Array }[] {
  const chunks: { type: string; data: Uint8Array }[] = [];
  let offset = 8;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    chunks.push({ type, data: bytes.subarray(offset + 8, offset + 8 + length) });
    offset += 12 + length;
    if (type === "IEND") break;
  }
  return chunks;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

export function decodePng(bytes: Uint8Array): Tex {
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat: Uint8Array[] = [];
  for (const c of readChunks(bytes)) {
    if (c.type === "IHDR") {
      const view = new DataView(c.data.buffer, c.data.byteOffset, c.data.length);
      width = view.getUint32(0); height = view.getUint32(4);
      bitDepth = c.data[8]; colorType = c.data[9];
    } else if (c.type === "IDAT") {
      idat.push(c.data);
    }
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`unsupported PNG (bitDepth=${bitDepth} colorType=${colorType}; need 8-bit RGB/RGBA)`);
  }
  const channels = colorType === 2 ? 3 : 4;
  const raw = inflateSync(join(idat));
  const tex = createTex(width, height);
  const stride = width * channels + 1;
  let prev = new Uint8Array(width * channels);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * stride];
    const row = raw.subarray(y * stride + 1, (y + 1) * stride);
    const out = new Uint8Array(width * channels);
    for (let x = 0; x < width * channels; x++) {
      const a = x >= channels ? out[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let v: number;
      if (filter === 0) v = row[x];
      else if (filter === 1) v = row[x] + a;
      else if (filter === 2) v = row[x] + b;
      else if (filter === 3) v = row[x] + ((a + b) >> 1);
      else v = row[x] + paeth(a, b, c);
      out[x] = v & 0xff;
    }
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      tex.d[i] = out[x * channels];
      tex.d[i + 1] = out[x * channels + 1];
      tex.d[i + 2] = out[x * channels + 2];
      tex.d[i + 3] = channels === 4 ? out[x * channels + 3] : 255;
    }
    prev = out;
  }
  return tex;
}
