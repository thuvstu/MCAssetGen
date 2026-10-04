import { zlibSync } from "fflate";

// CRC32 table for pure-JS PNG generation
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[i] = c >>> 0;
}
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Pure-JS 64x64 PNG encoder that works in both Node.js and browser environments. */
export function encodePurePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  const raw = new Uint8Array((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    raw[rowOffset] = 0; // Filter: None
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), rowOffset + 1);
  }
  const compressed = zlibSync(raw);

  const chunk = (type: string, data: Uint8Array): Uint8Array => {
    const len = data.length;
    const res = new Uint8Array(12 + len);
    const view = new DataView(res.buffer);
    view.setUint32(0, len);
    for (let i = 0; i < 4; i++) res[4 + i] = type.charCodeAt(i);
    res.set(data, 8);
    const crcVal = crc32(res.subarray(4, 8 + len));
    view.setUint32(8 + len, crcVal);
    return res;
  };

  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const header = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const cIHDR = chunk("IHDR", ihdr);
  const cIDAT = chunk("IDAT", compressed);
  const cIEND = chunk("IEND", new Uint8Array(0));

  const total = new Uint8Array(header.length + cIHDR.length + cIDAT.length + cIEND.length);
  let pos = 0;
  for (const part of [header, cIHDR, cIDAT, cIEND]) {
    total.set(part, pos);
    pos += part.length;
  }
  return total;
}

