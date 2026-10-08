// 依存なしの最小PNGエンコーダ (無圧縮deflate)。Modアイコン生成用。

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(buf: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];

function chunk(type: string, data: Uint8Array): number[] {
  const t = Array.from(type).map((c) => c.charCodeAt(0));
  const body = new Uint8Array([...t, ...data]);
  return [...u32(data.length), ...Array.from(body), ...u32(crc32(body))];
}

export function encodePng(width: number, height: number, rgb: Uint8Array): Uint8Array {
  const raw = new Uint8Array(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0;
    raw.set(rgb.subarray(y * width * 3, (y + 1) * width * 3), y * (1 + width * 3) + 1);
  }
  const z: number[] = [0x78, 0x01];
  for (let off = 0; off < raw.length; off += 65535) {
    const len = Math.min(65535, raw.length - off);
    const last = off + len >= raw.length ? 1 : 0;
    z.push(last, len & 255, len >>> 8, ~len & 255, (~len >>> 8) & 255);
    for (let i = 0; i < len; i++) z.push(raw[off + i]);
  }
  z.push(...u32(adler32(raw)));
  const ihdr = new Uint8Array([...u32(width), ...u32(height), 8, 2, 0, 0, 0]);
  return new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10,
    ...chunk("IHDR", ihdr),
    ...chunk("IDAT", new Uint8Array(z)),
    ...chunk("IEND", new Uint8Array(0)),
  ]);
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function hsl(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

const cache = new Map<string, string>();

/** Mod IDから決まる色の宝石アイコン (128x128) を base64 で返す */
export function makeIconPngBase64(seed: string): string {
  const hit = cache.get(seed);
  if (hit) return hit;
  let hash = 7;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = hash % 360;
  const N = 128;
  const px = new Uint8Array(N * N * 3);
  const cell = 8; // ドット絵風
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const gx = Math.floor(x / cell) * cell + cell / 2;
      const gy = Math.floor(y / cell) * cell + cell / 2;
      const d = Math.abs(gx - 64) + Math.abs(gy - 64);
      let c: [number, number, number];
      if (d < 22) c = hsl(hue, 0.85, 0.82 - (gy - 40) / 400);
      else if (d < 44) c = hsl(hue, 0.7, gx < 64 ? 0.55 : 0.4);
      else if (d < 52) c = hsl(hue, 0.5, 0.2);
      else c = hsl((hue + 200) % 360, 0.35, 0.1 + (gy / N) * 0.08);
      const i = (y * N + x) * 3;
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
    }
  }
  const out = toBase64(encodePng(N, N, px));
  cache.set(seed, out);
  return out;
}

/** data:image/png;base64,... から base64 部分とPNGかどうかを検証 */
export function parsePngDataUrl(url: string | undefined): string | null {
  if (!url) return null;
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(url);
  return m ? m[1] : null;
}

/** ステータス効果アイコン (18x18)。色から丸いジェム風アイコンを生成 */
export function makeEffectIconBase64(hex: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0x66ccff;
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const N = 18;
  const px = new Uint8Array(N * N * 3);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - 8.5, y - 8.5);
      const i = (y * N + x) * 3;
      let k: number;
      if (d > 8.2) k = 0.12;
      else if (d > 7) k = 0.45;
      else k = 1.0 - d * 0.045 + (x + y < 14 ? 0.18 : 0);
      px[i] = Math.min(255, Math.round(r * k));
      px[i + 1] = Math.min(255, Math.round(g * k));
      px[i + 2] = Math.min(255, Math.round(b * k));
    }
  }
  const bytes = encodePng(N, N, px);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
