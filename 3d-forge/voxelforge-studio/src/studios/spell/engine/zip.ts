/**
 * Minimal ZIP (store, no compression) writer.
 * Resource packs are mostly PNGs which are already deflated, so storing them raw keeps the
 * output byte-identical without pulling in a compression dependency.
 */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(data: Uint8Array) {
  let c = -1;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

export type ZipEntry = { path: string; data: Uint8Array };

export function buildZip(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder();
  const now = new Date();
  // MS-DOS packed timestamps: the only date fields a ZIP local header has.
  const dosTime = ((now.getHours() & 31) << 11) | ((now.getMinutes() & 63) << 5) | ((now.getSeconds() / 2) & 31);
  const dosDate = (((now.getFullYear() - 1980) & 127) << 9) | (((now.getMonth() + 1) & 15) << 5) | (now.getDate() & 31);

  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.path);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);   // version needed
    lv.setUint16(6, 0, true);    // general purpose flags
    lv.setUint16(8, 0, true);    // method: store
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);   // extra field length
    local.set(name, 30);
    localChunks.push(local, entry.data);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);   // version made by
    cv.setUint16(6, 20, true);   // version needed
    cv.setUint16(8, 0, true);    // flags
    cv.setUint16(10, 0, true);   // method: store
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true); // offset of this entry's local header
    central.set(name, 46);
    centralChunks.push(central);

    offset += local.length + size;
  }

  const centralSize = centralChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);                 // disk number
  ev.setUint16(6, 0, true);                 // disk with central directory
  ev.setUint16(8, entries.length, true);    // entries on this disk
  ev.setUint16(10, entries.length, true);   // total entries
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);           // central directory offset
  ev.setUint16(20, 0, true);                // comment length

  const parts: BlobPart[] = [];
  for (const chunk of [...localChunks, ...centralChunks, end]) {
    parts.push(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength) as ArrayBuffer);
  }
  return new Blob(parts, { type: "application/zip" });
}
