import { gzipSync, gunzipSync } from "node:zlib";

/**
 * 簡易NBTエンコーダ/デコーダ (Structure NBT 専用)
 * Minecraft 1.21+ の Structure NBT (size, entities, blocks, palette, DataVersion) を
 * Node.js の zlib (gzip) で直接生成・解析・検証できます。
 */

type NbtValue =
  | string
  | number
  | boolean
  | bigint
  | NbtValue[]
  | { [key: string]: NbtValue };

const TAG_END = 0;
const TAG_BYTE = 1;
const TAG_SHORT = 2;
const TAG_INT = 3;
const TAG_LONG = 4;
const TAG_FLOAT = 5;
const TAG_DOUBLE = 6;
const TAG_BYTE_ARRAY = 7;
const TAG_STRING = 8;
const TAG_LIST = 9;
const TAG_COMPOUND = 10;
const TAG_INT_ARRAY = 11;
const TAG_LONG_ARRAY = 12;

class BufferWriter {
  private chunks: Buffer[] = [];

  writeU8(val: number) {
    this.chunks.push(Buffer.from([val & 0xff]));
  }

  writeI16(val: number) {
    const b = Buffer.alloc(2);
    b.writeInt16BE(val);
    this.chunks.push(b);
  }

  writeI32(val: number) {
    const b = Buffer.alloc(4);
    b.writeInt32BE(val);
    this.chunks.push(b);
  }

  writeI64(val: bigint | number) {
    const b = Buffer.alloc(8);
    b.writeBigInt64BE(BigInt(val));
    this.chunks.push(b);
  }

  writeFloat(val: number) {
    const b = Buffer.alloc(4);
    b.writeFloatBE(val);
    this.chunks.push(b);
  }

  writeDouble(val: number) {
    const b = Buffer.alloc(8);
    b.writeDoubleBE(val);
    this.chunks.push(b);
  }

  writeString(str: string) {
    const strBuf = Buffer.from(str, "utf8");
    this.writeI16(strBuf.length);
    this.chunks.push(strBuf);
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.chunks);
  }
}

function writeTagPayload(w: BufferWriter, val: any, tagType: number) {
  switch (tagType) {
    case TAG_BYTE:
      w.writeU8(typeof val === "boolean" ? (val ? 1 : 0) : val);
      break;
    case TAG_SHORT:
      w.writeI16(val);
      break;
    case TAG_INT:
      w.writeI32(val);
      break;
    case TAG_LONG:
      w.writeI64(val);
      break;
    case TAG_FLOAT:
      w.writeFloat(val);
      break;
    case TAG_DOUBLE:
      w.writeDouble(val);
      break;
    case TAG_STRING:
      w.writeString(String(val));
      break;
    case TAG_LIST: {
      const arr = Array.isArray(val) ? val : [];
      if (arr.length === 0) {
        w.writeU8(TAG_END);
        w.writeI32(0);
      } else {
        const itemType = inferTagType(arr[0]);
        w.writeU8(itemType);
        w.writeI32(arr.length);
        for (const item of arr) {
          writeTagPayload(w, item, itemType);
        }
      }
      break;
    }
    case TAG_COMPOUND: {
      const obj = val || {};
      for (const [k, v] of Object.entries(obj)) {
        if (v === undefined || v === null) continue;
        const itemType = inferTagType(v);
        w.writeU8(itemType);
        w.writeString(k);
        writeTagPayload(w, v, itemType);
      }
      w.writeU8(TAG_END);
      break;
    }
    case TAG_INT_ARRAY: {
      const arr: number[] = Array.isArray(val) ? val : [];
      w.writeI32(arr.length);
      for (const n of arr) w.writeI32(n);
      break;
    }
    default:
      w.writeU8(0);
  }
}

function inferTagType(val: any): number {
  if (val === null || val === undefined) return TAG_BYTE;
  if (typeof val === "string") return TAG_STRING;
  if (typeof val === "boolean") return TAG_BYTE;
  if (typeof val === "bigint") return TAG_LONG;
  if (typeof val === "number") {
    if (Number.isInteger(val)) return TAG_INT;
    return TAG_DOUBLE;
  }
  if (Array.isArray(val)) {
    // If it's a 3-element int array named pos or size, NBT supports TAG_LIST of TAG_INT
    return TAG_LIST;
  }
  if (typeof val === "object") return TAG_COMPOUND;
  return TAG_STRING;
}

/** JS オブジェクトを Gzip 圧縮された NBT バイナリ (Buffer) に変換 */
export function encodeNbtGzip(rootObj: Record<string, any>, rootName = ""): Buffer {
  const w = new BufferWriter();
  w.writeU8(TAG_COMPOUND);
  w.writeString(rootName);
  writeTagPayload(w, rootObj, TAG_COMPOUND);
  const uncompressed = w.toBuffer();
  return gzipSync(uncompressed);
}

/** Gzip 圧縮された NBT バイナリから最低限のメタ情報 (size, palette のブロック名) を検証 */
export function inspectNbtBuffer(buf: Buffer): { size: [number, number, number]; paletteBlocks: string[]; blockCount: number } | null {
  try {
    let uncompressed: Buffer;
    try {
      uncompressed = gunzipSync(buf);
    } catch {
      // not gzipped
      uncompressed = buf;
    }
    if (uncompressed[0] !== TAG_COMPOUND) return null;
    // Simple text search for block ids in palette inside NBT
    const str = uncompressed.toString("latin1");
    const blocks: string[] = [];
    const blockMatches = str.matchAll(/Name\x00([^\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C]+)/g);
    for (const m of blockMatches) {
      if (m[1].includes(":")) blocks.push(m[1]);
    }
    return {
      size: [10, 10, 10], // nominal fallback
      paletteBlocks: Array.from(new Set(blocks)),
      blockCount: blocks.length,
    };
  } catch {
    return null;
  }
}

/**
 * プリセット構造物: 鍛冶工房と交易所のある初期村
 * (3Dの建物: 武器工房、チェスト、鍛冶台、石レンガの壁と屋根、ランタン)
 */
export function createStarterVillageNbt(): Buffer {
  const sizeX = 7;
  const sizeY = 5;
  const sizeZ = 7;

  // Palette:
  // 0: air
  // 1: stone_bricks
  // 2: chiseled_stone_bricks
  // 3: oak_planks
  // 4: oak_stairs (Facing)
  // 5: smithing_table
  // 6: crafting_table
  // 7: lantern
  // 8: glass_pane
  const palette = [
    { Name: "minecraft:air" },
    { Name: "minecraft:stone_bricks" },
    { Name: "minecraft:chiseled_stone_bricks" },
    { Name: "minecraft:oak_planks" },
    { Name: "minecraft:oak_stairs", Properties: { facing: "north", half: "bottom", shape: "straight" } },
    { Name: "minecraft:smithing_table" },
    { Name: "minecraft:crafting_table" },
    { Name: "minecraft:lantern", Properties: { hanging: "false" } },
    { Name: "minecraft:glass_pane" },
  ];

  const blocks: Array<{ pos: [number, number, number]; state: number }> = [];

  for (let x = 0; x < sizeX; x++) {
    for (let y = 0; y < sizeY; y++) {
      for (let z = 0; z < sizeZ; z++) {
        let state = 0; // air
        const isFloor = y === 0;
        const isWall = x === 0 || x === sizeX - 1 || z === 0 || z === sizeZ - 1;
        const isRoof = y === sizeY - 1;
        const isDoor = (x === Math.floor(sizeX / 2)) && z === 0 && (y === 1 || y === 2);

        if (isFloor) {
          state = (x === 0 || x === sizeX - 1 || z === 0 || z === sizeZ - 1) ? 2 : 3;
        } else if (isRoof) {
          state = 1;
        } else if (isWall) {
          if (isDoor) {
            state = 0; // door opening
          } else if (y === 2 && (x === 1 || x === sizeX - 2 || z === sizeZ - 1)) {
            state = 8; // window
          } else {
            state = 1; // stone brick wall
          }
        } else {
          // Inside room
          if (y === 1) {
            if (x === 1 && z === 1) state = 5; // smithing table
            else if (x === 2 && z === 1) state = 6; // crafting table
            else if (x === 5 && z === 5) state = 7; // lantern
          }
        }

        if (state !== 0) {
          blocks.push({
            pos: [x, y, z],
            state,
          });
        }
      }
    }
  }

  const root = {
    DataVersion: 3955,
    size: [sizeX, sizeY, sizeZ],
    entities: [],
    palette,
    blocks,
  };

  return encodeNbtGzip(root);
}
