/**
 * Universal dependency-free PNG encoder for 16x16, 32x32, and 64x64 pixel-art UV atlases.
 * Works identically in Node.js (API routes / DB seeding) and the browser.
 */

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(buf: Uint8Array): number {
  let a = 1;
  let b = 0;
  const MOD = 65521;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % MOD;
    b = (b + a) % MOD;
  }
  return ((b << 16) | a) >>> 0;
}

function writeUInt32BE(arr: Uint8Array, offset: number, val: number) {
  arr[offset] = (val >>> 24) & 0xff;
  arr[offset + 1] = (val >>> 16) & 0xff;
  arr[offset + 2] = (val >>> 8) & 0xff;
  arr[offset + 3] = val & 0xff;
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  writeUInt32BE(chunk, 0, data.length);
  for (let i = 0; i < 4; i++) {
    chunk[4 + i] = type.charCodeAt(i);
  }
  chunk.set(data, 8);
  const crcInput = chunk.subarray(4, 8 + data.length);
  writeUInt32BE(chunk, 8 + data.length, crc32(crcInput));
  return chunk;
}

function hexToRgba(hex: string): [number, number, number, number] {
  if (!hex || hex === "transparent") return [0, 0, 0, 0];
  const clean = hex.replace("#", "");
  if (clean.length === 6) {
    const num = parseInt(clean, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
  }
  return [20, 24, 36, 255];
}

function uint8ToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function matrixToPngDataUrl(matrix: string[][]): string {
  const height = matrix.length;
  const width = matrix[0]?.length || height;

  // Raw scanlines: each row starts with filter byte 0x00 followed by width * 4 RGBA bytes
  const rawLen = height * (1 + width * 4);
  const rawData = new Uint8Array(rawLen);
  let ptr = 0;

  for (let y = 0; y < height; y++) {
    rawData[ptr++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = hexToRgba(matrix[y]?.[x] || "#121520");
      rawData[ptr++] = r;
      rawData[ptr++] = g;
      rawData[ptr++] = b;
      rawData[ptr++] = a;
    }
  }

  // Wrap rawData in zlib + uncompressed DEFLATE blocks (max 65535 bytes per block)
  const blocks: Uint8Array[] = [];
  const maxBlock = 65535;
  for (let offset = 0; offset < rawData.length; offset += maxBlock) {
    const slice = rawData.subarray(offset, Math.min(rawData.length, offset + maxBlock));
    const isLast = offset + maxBlock >= rawData.length ? 1 : 0;
    const len = slice.length;
    const nlen = ~len & 0xffff;
    const blk = new Uint8Array(5 + len);
    blk[0] = isLast;
    blk[1] = len & 0xff;
    blk[2] = (len >>> 8) & 0xff;
    blk[3] = nlen & 0xff;
    blk[4] = (nlen >>> 8) & 0xff;
    blk.set(slice, 5);
    blocks.push(blk);
  }

  const totalBlocksLen = blocks.reduce((acc, b) => acc + b.length, 0);
  const zlibStream = new Uint8Array(2 + totalBlocksLen + 4);
  zlibStream[0] = 0x78; // CMF
  zlibStream[1] = 0x01; // FLG (no preset dict, fastest compression)
  let zPtr = 2;
  for (const b of blocks) {
    zlibStream.set(b, zPtr);
    zPtr += b.length;
  }
  writeUInt32BE(zlibStream, zPtr, adler32(rawData));

  // PNG Signature
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = new Uint8Array(13);
  writeUInt32BE(ihdrData, 0, width);
  writeUInt32BE(ihdrData, 4, height);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = makeChunk("IHDR", ihdrData);
  const idat = makeChunk("IDAT", zlibStream);
  const iend = makeChunk("IEND", new Uint8Array(0));

  const pngBytes = new Uint8Array(sig.length + ihdr.length + idat.length + iend.length);
  let p = 0;
  pngBytes.set(sig, p);
  p += sig.length;
  pngBytes.set(ihdr, p);
  p += ihdr.length;
  pngBytes.set(idat, p);
  p += idat.length;
  pngBytes.set(iend, p);

  return `data:image/png;base64,${uint8ToBase64(pngBytes)}`;
}
