/**
 * Minimal in-browser ZIP writer (stored entries, no compression) —
 * shared across studio exports, Vanilla Lab, and the Resource Pack Builder.
 */

export interface ZipEntry {
  path: string;
  data: Uint8Array;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

export function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  }
  return (c ^ 0xffffffff) >>> 0;
}

export function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/**
 * Build a standard ZIP Blob from a list of `{ path, data }` entries.
 * Duplicate paths are automatically deduplicated (first entry wins).
 */
export function createZip(files: ZipEntry[]): Blob {
  const parts: Uint8Array[] = [];
  const cdParts: Uint8Array[] = [];
  const seen = new Set<string>();
  let offset = 0;
  let count = 0;

  for (const file of files) {
    if (seen.has(file.path)) continue;
    seen.add(file.path);
    count++;

    const nameBytes = utf8(file.path);
    const crc = crc32(file.data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, file.data.length, true);
    lv.setUint32(22, file.data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);

    parts.push(localHeader);
    parts.push(file.data);

    const cdHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cdHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, file.data.length, true);
    cv.setUint32(24, file.data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    cdHeader.set(nameBytes, 46);

    cdParts.push(cdHeader);
    offset += localHeader.length + file.data.length;
  }

  const cdStart = offset;
  let cdSize = 0;
  for (const c of cdParts) cdSize += c.length;

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, count, true);
  ev.setUint16(10, count, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, cdStart, true);

  const finalZip = new Uint8Array(offset + cdSize + 22);
  let writePos = 0;
  for (const p of [...parts, ...cdParts]) {
    finalZip.set(p, writePos);
    writePos += p.length;
  }
  finalZip.set(eocd, writePos);

  return new Blob([finalZip.buffer as ArrayBuffer], { type: "application/zip" });
}

export function canvasToPngBytes(canvas: HTMLCanvasElement): Uint8Array {
  const dataUrl = canvas.toDataURL("image/png");
  const binaryPng = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(binaryPng.length);
  for (let i = 0; i < binaryPng.length; i++) bytes[i] = binaryPng.charCodeAt(i);
  return bytes;
}

export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
