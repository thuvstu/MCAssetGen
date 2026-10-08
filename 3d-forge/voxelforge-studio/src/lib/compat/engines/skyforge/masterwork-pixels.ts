import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getMasterwork } from "./masterworks";

/**
 * Server-side decoding of authored masterwork PNGs into the same flat RGBA
 * arrays the procedural pipeline produces, so seeded packs and user-forged
 * textures are stored and exported identically.
 *
 * Only the subset of PNG needed for our own 64x64 RGBA sprites is handled:
 * 8-bit colour type 6, which is exactly what the extractor writes.
 */
const CRC_OK = true;

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilter(raw: Buffer, width: number, height: number): number[] {
  const bpp = 4;
  const stride = width * bpp;
  const out = new Uint8Array(width * height * bpp);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++]!;
    const rowStart = y * stride;
    const prevStart = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const value = raw[pos++]!;
      const left = x >= bpp ? out[rowStart + x - bpp]! : 0;
      const up = y > 0 ? out[prevStart + x]! : 0;
      const upLeft = y > 0 && x >= bpp ? out[prevStart + x - bpp]! : 0;
      let restored: number;
      switch (filter) {
        case 0:
          restored = value;
          break;
        case 1:
          restored = value + left;
          break;
        case 2:
          restored = value + up;
          break;
        case 3:
          restored = value + ((left + up) >> 1);
          break;
        case 4:
          restored = value + paethPredictor(left, up, upLeft);
          break;
        default:
          throw new Error(`unsupported PNG filter ${filter}`);
      }
      out[rowStart + x] = restored & 0xff;
    }
  }
  return Array.from(out);
}

export async function loadMasterworkPixels(itemId: string): Promise<number[] | null> {
  const masterwork = getMasterwork(itemId);
  if (!masterwork) return null;
  const path = join(process.cwd(), "public", masterwork.file.replace(/^\//, ""));
  let file: Buffer;
  try {
    file = await readFile(path);
  } catch {
    return null;
  }

  const zlib = await import("node:zlib");
  let offset = 8; // PNG signature
  let width = 0;
  let height = 0;
  let colourType = 6;
  let bitDepth = 8;
  const idat: Buffer[] = [];

  while (offset < file.length) {
    const length = file.readUInt32BE(offset);
    const type = file.toString("ascii", offset + 4, offset + 8);
    const data = file.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8]!;
      colourType = data[9]!;
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length; // length + type + data + crc
  }

  if (!width || !height || bitDepth !== 8 || colourType !== 6) return null;
  void CRC_OK;

  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const pixels = unfilter(inflated, width, height);
  return pixels.length === width * height * 4 ? pixels : null;
}
