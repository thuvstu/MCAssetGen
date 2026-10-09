// ============================================================
// NBT (Named Binary Tag) Reader / Writer
// Minecraft Java Edition 構造ファイル (.nbt) 用
// 仕様: Big-Endian / GZip圧縮 / TAG_Compound root
// ============================================================

export const TAG = {
  End: 0,
  Byte: 1,
  Short: 2,
  Int: 3,
  Long: 4,
  Float: 5,
  Double: 6,
  ByteArray: 7,
  String: 8,
  List: 9,
  Compound: 10,
  IntArray: 11,
  LongArray: 12,
} as const;

export type TagType = (typeof TAG)[keyof typeof TAG];

export interface NbtTag {
  type: TagType;
  value: NbtValue;
}

export type NbtValue =
  | number
  | bigint
  | string
  | Uint8Array
  | number[]
  | bigint[]
  | NbtList
  | NbtCompound;

export interface NbtList {
  itemType: TagType;
  items: NbtValue[];
}

export type NbtCompound = Record<string, NbtTag>;

export const tagName = (t: TagType): string => {
  const names: Record<number, string> = {
    0: "TAG_End",
    1: "TAG_Byte",
    2: "TAG_Short",
    3: "TAG_Int",
    4: "TAG_Long",
    5: "TAG_Float",
    6: "TAG_Double",
    7: "TAG_Byte_Array",
    8: "TAG_String",
    9: "TAG_List",
    10: "TAG_Compound",
    11: "TAG_Int_Array",
    12: "TAG_Long_Array",
  };
  return names[t] ?? `UNKNOWN(${t})`;
};

// ---------- Constructors ----------
export const byte = (v: number): NbtTag => ({ type: TAG.Byte, value: v });
export const short = (v: number): NbtTag => ({ type: TAG.Short, value: v });
export const int = (v: number): NbtTag => ({ type: TAG.Int, value: v });
export const long = (v: bigint | number): NbtTag => ({
  type: TAG.Long,
  value: typeof v === "bigint" ? v : BigInt(Math.floor(v)),
});
export const float = (v: number): NbtTag => ({ type: TAG.Float, value: v });
export const double = (v: number): NbtTag => ({ type: TAG.Double, value: v });
export const str = (v: string): NbtTag => ({ type: TAG.String, value: v });
export const byteArray = (v: Uint8Array): NbtTag => ({ type: TAG.ByteArray, value: v });
export const intArray = (v: number[]): NbtTag => ({ type: TAG.IntArray, value: v });
export const longArray = (v: bigint[]): NbtTag => ({ type: TAG.LongArray, value: v });
export const list = (itemType: TagType, items: NbtValue[]): NbtTag => ({
  type: TAG.List,
  value: { itemType, items } as NbtList,
});
export const compound = (v: NbtCompound): NbtTag => ({ type: TAG.Compound, value: v });

export const intList = (arr: number[]): NbtTag => list(TAG.Int, [...arr]);
export const doubleList = (arr: number[]): NbtTag => list(TAG.Double, [...arr]);

// ============================================================
// Modified UTF-8 (Java DataOutput.writeUTF 互換)
//  - U+0000 は 2バイト (C0 80)
//  - 補助文字(絵文字等)はサロゲートペアを各3バイトで符号化 (CESU-8)
// Minecraft は文字列を必ずこの形式で読むため、標準UTF-8と差が出る文字でも壊れない
// ============================================================
export function encodeMutf8(s: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i); // UTF-16 コード単位ごと (サロゲートもそのまま3バイト化)
    if (c >= 0x0001 && c <= 0x007f) out.push(c);
    else if (c <= 0x07ff) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return new Uint8Array(out);
}

export function decodeMutf8(b: Uint8Array): string {
  const units: number[] = [];
  let s = "";
  const at = (i: number) => (i < b.length ? b[i] : 0);
  for (let i = 0; i < b.length; ) {
    const a = b[i];
    if (a < 0x80) {
      units.push(a);
      i += 1;
    } else if ((a & 0xe0) === 0xc0) {
      units.push(((a & 0x1f) << 6) | (at(i + 1) & 0x3f));
      i += 2;
    } else if ((a & 0xf0) === 0xe0) {
      units.push(((a & 0x0f) << 12) | ((at(i + 1) & 0x3f) << 6) | (at(i + 2) & 0x3f));
      i += 3;
    } else if ((a & 0xf8) === 0xf0) {
      // 他ツールが標準UTF-8(4バイト)で書いた場合も受け付ける
      const cp = ((a & 0x07) << 18) | ((at(i + 1) & 0x3f) << 12) | ((at(i + 2) & 0x3f) << 6) | (at(i + 3) & 0x3f);
      const v = cp - 0x10000;
      units.push(0xd800 + (v >> 10), 0xdc00 + (v & 0x3ff));
      i += 4;
    } else {
      units.push(0xfffd);
      i += 1;
    }
    if (units.length >= 4096) {
      s += String.fromCharCode(...units);
      units.length = 0;
    }
  }
  return s + String.fromCharCode(...units);
}

// ============================================================
// Writer
// ============================================================
class Writer {
  bytes: number[] = [];

  writeByte(v: number) {
    this.bytes.push(v & 0xff);
  }
  writeShort(v: number) {
    this.bytes.push((v >> 8) & 0xff, v & 0xff);
  }
  writeUShort(v: number) {
    this.bytes.push((v >> 8) & 0xff, v & 0xff);
  }
  writeInt(v: number) {
    v = v | 0;
    this.bytes.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
  }
  writeLong(v: bigint) {
    const hi = Number((v >> 32n) & 0xffffffffn) | 0;
    const lo = Number(v & 0xffffffffn) | 0;
    this.writeInt(hi);
    this.writeInt(lo);
  }
  writeFloat(v: number) {
    const buf = new DataView(new ArrayBuffer(4));
    buf.setFloat32(0, v, false);
    for (let i = 0; i < 4; i++) this.bytes.push(buf.getUint8(i));
  }
  writeDouble(v: number) {
    const buf = new DataView(new ArrayBuffer(8));
    buf.setFloat64(0, v, false);
    for (let i = 0; i < 8; i++) this.bytes.push(buf.getUint8(i));
  }
  writeBytes(arr: Uint8Array | number[]) {
    for (const b of arr) this.bytes.push(b & 0xff);
  }
  writeString(s: string) {
    const enc = encodeMutf8(s);
    if (enc.length > 65535) throw new Error("文字列が長すぎます（NBT文字列は最大65535バイト）");
    this.writeUShort(enc.length);
    this.writeBytes(enc);
  }
  /** 名前付きタグを書く (Compoundの要素・root用) */
  writeNamedTag(name: string, tag: NbtTag) {
    this.writeByte(tag.type);
    if (tag.type === TAG.End) return;
    this.writeString(name);
    this.writePayload(tag.type, tag.value);
  }
  writePayload(type: TagType, value: NbtValue) {
    switch (type) {
      case TAG.Byte:
        this.writeByte(value as number);
        break;
      case TAG.Short:
        this.writeShort(value as number);
        break;
      case TAG.Int:
        this.writeInt(value as number);
        break;
      case TAG.Long:
        this.writeLong(value as bigint);
        break;
      case TAG.Float:
        this.writeFloat(value as number);
        break;
      case TAG.Double:
        this.writeDouble(value as number);
        break;
      case TAG.ByteArray: {
        const a = value as Uint8Array;
        this.writeInt(a.length);
        this.writeBytes(a);
        break;
      }
      case TAG.String:
        this.writeString(value as string);
        break;
      case TAG.List: {
        const l = value as NbtList;
        // バニラ同様、空リストは要素型 TAG_End で書く
        this.writeByte(l.items.length === 0 ? TAG.End : l.itemType);
        this.writeInt(l.items.length);
        for (const it of l.items) this.writePayload(l.itemType, it);
        break;
      }
      case TAG.Compound: {
        const c = value as NbtCompound;
        for (const [k, t] of Object.entries(c)) this.writeNamedTag(k, t);
        this.writeByte(TAG.End);
        break;
      }
      case TAG.IntArray: {
        const a = value as number[];
        this.writeInt(a.length);
        for (const n of a) this.writeInt(n);
        break;
      }
      case TAG.LongArray: {
        const a = value as bigint[];
        this.writeInt(a.length);
        for (const n of a) this.writeLong(n);
        break;
      }
      case TAG.End:
        break;
    }
  }
  toUint8Array(): Uint8Array {
    return new Uint8Array(this.bytes);
  }
}

// ============================================================
// Reader
// ============================================================
class Reader {
  view: DataView;
  offset = 0;
  constructor(buf: Uint8Array) {
    this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  get length() {
    return this.view.byteLength;
  }
  readByte(): number {
    const v = this.view.getInt8(this.offset);
    this.offset += 1;
    return v;
  }
  readUByte(): number {
    const v = this.view.getUint8(this.offset);
    this.offset += 1;
    return v;
  }
  readShort(): number {
    const v = this.view.getInt16(this.offset, false);
    this.offset += 2;
    return v;
  }
  readUShort(): number {
    const v = this.view.getUint16(this.offset, false);
    this.offset += 2;
    return v;
  }
  readInt(): number {
    const v = this.view.getInt32(this.offset, false);
    this.offset += 4;
    return v;
  }
  readLong(): bigint {
    const hi = this.view.getInt32(this.offset, false);
    const lo = this.view.getUint32(this.offset + 4, false);
    this.offset += 8;
    return (BigInt(hi) << 32n) | BigInt(lo);
  }
  readFloat(): number {
    const v = this.view.getFloat32(this.offset, false);
    this.offset += 4;
    return v;
  }
  readDouble(): number {
    const v = this.view.getFloat64(this.offset, false);
    this.offset += 8;
    return v;
  }
  readBytes(n: number): Uint8Array {
    const out = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, n);
    this.offset += n;
    return new Uint8Array(out);
  }
  readString(): string {
    const len = this.readUShort();
    if (this.offset + len > this.length) throw new Error("文字列長がファイル末尾を超えています（破損の可能性）");
    const bytes = this.readBytes(len);
    return decodeMutf8(bytes);
  }
  readNamedTag(): { name: string; tag: NbtTag } {
    const type = this.readUByte() as TagType;
    if (type === TAG.End) return { name: "", tag: { type, value: 0 } };
    const name = this.readString();
    const value = this.readPayload(type);
    return { name, tag: { type, value } };
  }
  readPayload(type: TagType): NbtValue {
    switch (type) {
      case TAG.Byte:
        return this.readByte();
      case TAG.Short:
        return this.readShort();
      case TAG.Int:
        return this.readInt();
      case TAG.Long:
        return this.readLong();
      case TAG.Float:
        return this.readFloat();
      case TAG.Double:
        return this.readDouble();
      case TAG.ByteArray: {
        const len = this.readInt();
        if (len < 0 || this.offset + len > this.length) throw new Error(`不正なByteArray長: ${len}`);
        return this.readBytes(len);
      }
      case TAG.String:
        return this.readString();
      case TAG.List: {
        const itemType = this.readUByte() as TagType;
        const len = this.readInt();
        if (len < 0 || len > 20_000_000) throw new Error(`不正なList長: ${len}`);
        const items: NbtValue[] = [];
        for (let i = 0; i < len; i++) items.push(this.readPayload(itemType));
        return { itemType, items } as NbtList;
      }
      case TAG.Compound: {
        const c: NbtCompound = {};
        for (;;) {
          const t = this.readUByte() as TagType;
          if (t === TAG.End) break;
          const name = this.readString();
          c[name] = { type: t, value: this.readPayload(t) };
        }
        return c;
      }
      case TAG.IntArray: {
        const len = this.readInt();
        if (len < 0 || len > 20_000_000) throw new Error(`不正なIntArray長: ${len}`);
        const arr: number[] = [];
        for (let i = 0; i < len; i++) arr.push(this.readInt());
        return arr;
      }
      case TAG.LongArray: {
        const len = this.readInt();
        if (len < 0 || len > 20_000_000) throw new Error(`不正なLongArray長: ${len}`);
        const arr: bigint[] = [];
        for (let i = 0; i < len; i++) arr.push(this.readLong());
        return arr;
      }
      case TAG.End:
        return 0;
      default:
        throw new Error(`未知のタグタイプ: ${type}`);
    }
  }
}

// ============================================================
// Public API
// ============================================================
export function encodeNbtRoot(root: NbtTag, rootName = ""): Uint8Array {
  if (root.type !== TAG.Compound) throw new Error("ルートはTAG_Compoundである必要があります");
  const w = new Writer();
  w.writeNamedTag(rootName, root);
  return w.toUint8Array();
}

export function decodeNbtRoot(data: Uint8Array): { name: string; tag: NbtTag } {
  const r = new Reader(data);
  const { name, tag } = r.readNamedTag();
  return { name, tag };
}

// ---- gzip helpers (ブラウザ標準 CompressionStream 利用) ----
async function streamConvert(
  data: Uint8Array,
  format: CompressionFormat,
  mode: "compress" | "decompress"
): Promise<Uint8Array> {
  const StreamCtor = mode === "compress" ? CompressionStream : DecompressionStream;
  const stream = new StreamCtor(format);
  const writer = stream.writable.getWriter();
  writer.write(data as unknown as Uint8Array<ArrayBuffer>);
  writer.close();
  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

export async function gzip(data: Uint8Array): Promise<Uint8Array> {
  try {
    return await streamConvert(data, "gzip", "compress");
  } catch {
    throw new Error("GZip圧縮に失敗しました（このブラウザはCompressionStream未対応の可能性）");
  }
}

export async function gunzip(data: Uint8Array): Promise<Uint8Array> {
  // gzipマジック判定
  if (data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b) {
    try {
      return await streamConvert(data, "gzip", "decompress");
    } catch {
      throw new Error("GZip展開に失敗しました");
    }
  }
  // 非圧縮NBTの可能性
  return data;
}

export async function encodeStructureFile(root: NbtTag): Promise<Uint8Array> {
  const raw = encodeNbtRoot(root, "");
  return gzip(raw);
}

export async function decodeStructureFile(file: Uint8Array): Promise<NbtTag> {
  const raw = await gunzip(file);
  const { tag } = decodeNbtRoot(raw);
  if (tag.type !== TAG.Compound) throw new Error("ルートタグがCompoundではありません");
  return tag;
}

// ---- デバッグ・表示用 ----
export function nbtToJson(tag: NbtTag): unknown {
  const conv = (t: NbtTag): unknown => {
    switch (t.type) {
      case TAG.Compound: {
        const c = t.value as NbtCompound;
        const o: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(c)) o[k] = conv(v);
        return o;
      }
      case TAG.List: {
        const l = t.value as NbtList;
        return l.items.map((it) => conv({ type: l.itemType, value: it }));
      }
      case TAG.ByteArray:
        return `[byte×${(t.value as Uint8Array).length}]`;
      case TAG.IntArray:
        return t.value;
      case TAG.LongArray:
        return (t.value as bigint[]).map((b) => b.toString() + "L");
      case TAG.Long:
        return (t.value as bigint).toString() + "L";
      default:
        return t.value;
    }
  };
  return conv(tag);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
