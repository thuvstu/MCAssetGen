// ============================================================
// Voxel構造モデル + NBT変換 + プロシージャル生成
// ============================================================
import {
  NbtTag,
  TAG,
  NbtCompound,
  NbtList,
  compound,
  int,
  byte,
  str,
  intList,
  list,
} from "./structure-nbt";
import { AIR_ID, resolveBlockId } from "./structure-data";

export interface PlacedBlock {
  id: string;
  props: Record<string, string>;
  /** コマンドブロック用などのBlockEntity文字列 (Command等) */
  command?: string;
}

export type Vec3 = [number, number, number];

export const MAX_SIZE = 48;

export function createEmptyCells(sx: number, sy: number, sz: number): (PlacedBlock | null)[] {
  return new Array(sx * sy * sz).fill(null);
}

export function idx(sx: number, sy: number, sz: number, x: number, y: number, z: number): number {
  void sy;
  void sz;
  return (y * sz + z) * sx + x;
}

export function inBounds(sx: number, sy: number, sz: number, x: number, y: number, z: number): boolean {
  return x >= 0 && y >= 0 && z >= 0 && x < sx && y < sy && z < sz;
}

/** PlacedBlockは不変(immutable)として扱うため、配列の浅いコピーで十分（履歴・編集を高速化） */
export function cloneCells(cells: (PlacedBlock | null)[]): (PlacedBlock | null)[] {
  return cells.slice();
}

export interface Structure {
  size: Vec3;
  cells: (PlacedBlock | null)[];
}

export function createStructure(sx: number, sy: number, sz: number): Structure {
  sx = Math.max(1, Math.min(MAX_SIZE, Math.floor(sx)));
  sy = Math.max(1, Math.min(MAX_SIZE, Math.floor(sy)));
  sz = Math.max(1, Math.min(MAX_SIZE, Math.floor(sz)));
  return { size: [sx, sy, sz], cells: createEmptyCells(sx, sy, sz) };
}

export function getCell(s: Structure, x: number, y: number, z: number): PlacedBlock | null {
  const [sx, sy, sz] = s.size;
  if (!inBounds(sx, sy, sz, x, y, z)) return null;
  return s.cells[idx(sx, sy, sz, x, y, z)];
}

export function setCell(s: Structure, x: number, y: number, z: number, b: PlacedBlock | null) {
  const [sx, sy, sz] = s.size;
  if (!inBounds(sx, sy, sz, x, y, z)) return;
  s.cells[idx(sx, sy, sz, x, y, z)] = b;
}

export function resizeStructure(s: Structure, nsx: number, nsy: number, nsz: number): Structure {
  nsx = Math.max(1, Math.min(MAX_SIZE, Math.floor(nsx)));
  nsy = Math.max(1, Math.min(MAX_SIZE, Math.floor(nsy)));
  nsz = Math.max(1, Math.min(MAX_SIZE, Math.floor(nsz)));
  const [sx, sy, sz] = s.size;
  const next = createStructure(nsx, nsy, nsz);
  const mx = Math.min(sx, nsx);
  const my = Math.min(sy, nsy);
  const mz = Math.min(sz, nsz);
  for (let y = 0; y < my; y++)
    for (let z = 0; z < mz; z++)
      for (let x = 0; x < mx; x++) {
        const c = s.cells[idx(sx, sy, sz, x, y, z)];
        if (c) next.cells[idx(nsx, nsy, nsz, x, y, z)] = { ...c, props: { ...c.props } };
      }
  return next;
}

// ---------- 編集オペレーション (すべて新Structureを返す = immutable) ----------
function withCells(s: Structure, mut: (cells: (PlacedBlock | null)[], size: Vec3) => void): Structure {
  const cells = cloneCells(s.cells);
  const ns: Structure = { size: [...s.size] as Vec3, cells };
  mut(cells, ns.size);
  return ns;
}

export function opSet(s: Structure, x: number, y: number, z: number, b: PlacedBlock | null): Structure {
  return withCells(s, (cells, size) => {
    const [sx, sy, sz] = size;
    if (inBounds(sx, sy, sz, x, y, z)) cells[idx(sx, sy, sz, x, y, z)] = b ? { ...b, props: { ...b.props } } : null;
  });
}

export function opBrush(
  s: Structure,
  cx: number, cy: number, cz: number,
  brush: number,
  b: PlacedBlock | null
): Structure {
  const r = Math.floor(brush / 2);
  return withCells(s, (cells, size) => {
    const [sx, sy, sz] = size;
    for (let y = cy - r; y <= cy + r; y++)
      for (let z = cz - r; z <= cz + r; z++)
        for (let x = cx - r; x <= cx + r; x++) {
          if (!inBounds(sx, sy, sz, x, y, z)) continue;
          cells[idx(sx, sy, sz, x, y, z)] = b ? { id: b.id, props: { ...b.props }, command: b.command } : null;
        }
  });
}

export function opBox(s: Structure, a: Vec3, bpos: Vec3, b: PlacedBlock | null, hollow: boolean, wallsOnly = false): Structure {
  const [x0, y0, z0] = [Math.min(a[0], bpos[0]), Math.min(a[1], bpos[1]), Math.min(a[2], bpos[2])];
  const [x1, y1, z1] = [Math.max(a[0], bpos[0]), Math.max(a[1], bpos[1]), Math.max(a[2], bpos[2])];
  return withCells(s, (cells, size) => {
    const [sx, sy, sz] = size;
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++) {
          if (!inBounds(sx, sy, sz, x, y, z)) continue;
          const onShell = x === x0 || x === x1 || y === y0 || y === y1 || z === z0 || z === z1;
          if (hollow && !onShell) continue;
          if (wallsOnly && !(x === x0 || x === x1 || z === z0 || z === z1)) continue;
          cells[idx(sx, sy, sz, x, y, z)] = b ? { id: b.id, props: { ...b.props }, command: b.command } : null;
        }
  });
}

export function opEllipsoid(s: Structure, a: Vec3, bpos: Vec3, b: PlacedBlock | null, hollow: boolean): Structure {
  const [x0, y0, z0] = [Math.min(a[0], bpos[0]), Math.min(a[1], bpos[1]), Math.min(a[2], bpos[2])];
  const [x1, y1, z1] = [Math.max(a[0], bpos[0]), Math.max(a[1], bpos[1]), Math.max(a[2], bpos[2])];
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
  const rx = Math.max(0.5, (x1 - x0 + 1) / 2), ry = Math.max(0.5, (y1 - y0 + 1) / 2), rz = Math.max(0.5, (z1 - z0 + 1) / 2);
  return withCells(s, (cells, size) => {
    const [sx, sy, sz] = size;
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++) {
          if (!inBounds(sx, sy, sz, x, y, z)) continue;
          const dx = (x - cx) / rx, dy = (y - cy) / ry, dz = (z - cz) / rz;
          const d = dx * dx + dy * dy + dz * dz;
          if (d > 1) continue;
          if (hollow && d < 0.55) continue;
          cells[idx(sx, sy, sz, x, y, z)] = b ? { id: b.id, props: { ...b.props }, command: b.command } : null;
        }
  });
}

export function opCylinder(s: Structure, a: Vec3, bpos: Vec3, b: PlacedBlock | null, hollow: boolean): Structure {
  const x0 = Math.min(a[0], bpos[0]), x1 = Math.max(a[0], bpos[0]);
  const y0 = Math.min(a[1], bpos[1]), y1 = Math.max(a[1], bpos[1]);
  const z0 = Math.min(a[2], bpos[2]), z1 = Math.max(a[2], bpos[2]);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const rx = Math.max(0.5, (x1 - x0 + 1) / 2), rz = Math.max(0.5, (z1 - z0 + 1) / 2);
  return withCells(s, (cells, size) => {
    const [sx, sy, sz] = size;
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++) {
          if (!inBounds(sx, sy, sz, x, y, z)) continue;
          const dx = (x - cx) / rx, dz = (z - cz) / rz;
          const d = dx * dx + dz * dz;
          if (d > 1) continue;
          if (hollow) {
            const edgeXZ = d > 0.55;
            const edgeY = y === y0 || y === y1;
            if (!(edgeXZ || edgeY)) continue;
            if (!edgeXZ && !edgeY) continue;
          }
          cells[idx(sx, sy, sz, x, y, z)] = b ? { id: b.id, props: { ...b.props }, command: b.command } : null;
        }
  });
}

export function opLine(s: Structure, a: Vec3, bpos: Vec3, b: PlacedBlock | null): Structure {
  const pts: Vec3[] = [];
  const dx = bpos[0] - a[0], dy = bpos[1] - a[1], dz = bpos[2] - a[2];
  const n = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
  if (n === 0) pts.push([...a] as Vec3);
  else for (let i = 0; i <= n; i++) pts.push([Math.round(a[0] + (dx * i) / n), Math.round(a[1] + (dy * i) / n), Math.round(a[2] + (dz * i) / n)]);
  return withCells(s, (cells, size) => {
    const [sx, sy, sz] = size;
    for (const [x, y, z] of pts) {
      if (!inBounds(sx, sy, sz, x, y, z)) continue;
      cells[idx(sx, sy, sz, x, y, z)] = b ? { id: b.id, props: { ...b.props }, command: b.command } : null;
    }
  });
}

function sameBlock(a: PlacedBlock | null, b: PlacedBlock | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.id !== b.id) return false;
  const ka = Object.keys(a.props), kb = Object.keys(b.props);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => a.props[k] === b.props[k]);
}

export function opFloodFill(s: Structure, sx0: number, sy0: number, sz0: number, b: PlacedBlock | null): Structure {
  const [sx, sy, sz] = s.size;
  if (!inBounds(sx, sy, sz, sx0, sy0, sz0)) return s;
  const target = s.cells[idx(sx, sy, sz, sx0, sy0, sz0)];
  if (sameBlock(target, b)) return s;
  return withCells(s, (cells) => {
    const seen = new Set<number>();
    const stack: Vec3[] = [[sx0, sy0, sz0]];
    let guard = 0;
    while (stack.length && guard < 200000) {
      guard++;
      const [x, y, z] = stack.pop()!;
      if (!inBounds(sx, sy, sz, x, y, z)) continue;
      const i = idx(sx, sy, sz, x, y, z);
      if (seen.has(i)) continue;
      seen.add(i);
      if (!sameBlock(cells[i], target)) continue;
      cells[i] = b ? { id: b.id, props: { ...b.props }, command: b.command } : null;
      stack.push([x + 1, y, z], [x - 1, y, z], [x, y + 1, z], [x, y - 1, z], [x, y, z + 1], [x, y, z - 1]);
    }
  });
}

export function opReplace(s: Structure, fromId: string | null, b: PlacedBlock | null): Structure {
  // fromId=null → 全体を置換 / それ以外は指定IDのみ置換
  return withCells(s, (cells) => {
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (fromId === null) {
        cells[i] = b ? { id: b.id, props: { ...b.props }, command: b.command } : null;
      } else if ((c?.id ?? AIR_ID) === fromId) {
        cells[i] = b ? { id: b.id, props: { ...b.props }, command: b.command } : null;
      }
    }
  });
}

export function opClear(s: Structure): Structure {
  return { size: [...s.size] as Vec3, cells: createEmptyCells(s.size[0], s.size[1], s.size[2]) };
}

// ---------- 選択範囲 / コピー・貼り付け ----------
export interface VoxelSelection {
  min: Vec3;
  max: Vec3;
}

export interface StructureClipboard {
  size: Vec3;
  /** x→z→y順ではなく、構造体と同じ y→z→x のフラット配列 */
  cells: (PlacedBlock | null)[];
}

export function createSelection(a: Vec3, b: Vec3): VoxelSelection {
  return {
    min: [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])],
    max: [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])],
  };
}

export function selectionSize(selection: VoxelSelection): Vec3 {
  return [
    selection.max[0] - selection.min[0] + 1,
    selection.max[1] - selection.min[1] + 1,
    selection.max[2] - selection.min[2] + 1,
  ];
}

export function selectionVolume(selection: VoxelSelection): number {
  const [x, y, z] = selectionSize(selection);
  return x * y * z;
}

export function copySelection(s: Structure, selection: VoxelSelection): StructureClipboard {
  const [dx, dy, dz] = selectionSize(selection);
  const out = createEmptyCells(dx, dy, dz);
  const [sx, sy, sz] = s.size;
  for (let y = 0; y < dy; y++)
    for (let z = 0; z < dz; z++)
      for (let x = 0; x < dx; x++) {
        const source = s.cells[idx(sx, sy, sz, selection.min[0] + x, selection.min[1] + y, selection.min[2] + z)];
        if (source) out[idx(dx, dy, dz, x, y, z)] = { id: source.id, props: { ...source.props }, command: source.command };
      }
  return { size: [dx, dy, dz], cells: out };
}

export function clipboardNonAir(clipboard: StructureClipboard): number {
  return clipboard.cells.reduce((n, c) => n + (c ? 1 : 0), 0);
}

/** 選択範囲を単一ブロックで埋める。nullを渡すと消去。 */
export function opFillSelection(s: Structure, selection: VoxelSelection, block: PlacedBlock | null): Structure {
  return withCells(s, (cells, size) => {
    const [sx, sy, sz] = size;
    for (let y = selection.min[1]; y <= selection.max[1]; y++)
      for (let z = selection.min[2]; z <= selection.max[2]; z++)
        for (let x = selection.min[0]; x <= selection.max[0]; x++) {
          if (!inBounds(sx, sy, sz, x, y, z)) continue;
          cells[idx(sx, sy, sz, x, y, z)] = block ? { id: block.id, props: { ...block.props }, command: block.command } : null;
        }
  });
}

/**
 * クリップボードを貼り付ける。
 * overwriteAir=false の場合は、クリップボード内の空気を無視する「合成貼り付け」。
 */
export function pasteClipboard(
  s: Structure,
  clipboard: StructureClipboard,
  origin: Vec3,
  overwriteAir: boolean
): Structure {
  const [dx, dy, dz] = clipboard.size;
  return withCells(s, (cells, size) => {
    const [sx, sy, sz] = size;
    for (let y = 0; y < dy; y++)
      for (let z = 0; z < dz; z++)
        for (let x = 0; x < dx; x++) {
          const tx = origin[0] + x, ty = origin[1] + y, tz = origin[2] + z;
          if (!inBounds(sx, sy, sz, tx, ty, tz)) continue;
          const source = clipboard.cells[idx(dx, dy, dz, x, y, z)];
          if (!source && !overwriteAir) continue;
          cells[idx(sx, sy, sz, tx, ty, tz)] = source
            ? { id: source.id, props: { ...source.props }, command: source.command }
            : null;
        }
  });
}

/** クリップボードをX/Y/Z方向に反復して配置する。 */
export function repeatClipboard(
  s: Structure,
  clipboard: StructureClipboard,
  origin: Vec3,
  repeats: Vec3,
  gap: Vec3,
  overwriteAir: boolean
): Structure {
  let out = s;
  const [dx, dy, dz] = clipboard.size;
  for (let ry = 0; ry < Math.max(1, repeats[1]); ry++)
    for (let rz = 0; rz < Math.max(1, repeats[2]); rz++)
      for (let rx = 0; rx < Math.max(1, repeats[0]); rx++) {
        out = pasteClipboard(
          out,
          clipboard,
          [origin[0] + rx * (dx + gap[0]), origin[1] + ry * (dy + gap[1]), origin[2] + rz * (dz + gap[2])],
          overwriteAir
        );
      }
  return out;
}

// ---------- 複数セルの一括編集 (1回のコピーで完結 = 履歴1件) ----------
export interface CellEdit {
  pos: Vec3;
  block: PlacedBlock | null;
}

export function opSetMany(s: Structure, edits: CellEdit[]): Structure {
  return withCells(s, (cells, size) => {
    const [sx, sy, sz] = size;
    for (const e of edits) {
      const [x, y, z] = e.pos;
      if (!inBounds(sx, sy, sz, x, y, z)) continue;
      cells[idx(sx, sy, sz, x, y, z)] = e.block
        ? { id: e.block.id, props: { ...e.block.props }, command: e.block.command }
        : null;
    }
  });
}

/** ブラシ範囲(立方体)内の有効座標を列挙 */
export function brushCells(size: Vec3, center: Vec3, brush: number): Vec3[] {
  const [sx, sy, sz] = size;
  const r = Math.floor(brush / 2);
  const out: Vec3[] = [];
  for (let y = center[1] - r; y <= center[1] + r; y++)
    for (let z = center[2] - r; z <= center[2] + r; z++)
      for (let x = center[0] - r; x <= center[0] + r; x++)
        if (inBounds(sx, sy, sz, x, y, z)) out.push([x, y, z]);
  return out;
}

// ---------- 統計 ----------
export interface BlockStat {
  id: string;
  count: number;
  propsVariants: number;
}

export function getStats(s: Structure): { total: number; nonAir: number; stats: BlockStat[] } {
  const map = new Map<string, { count: number; variants: Set<string> }>();
  let nonAir = 0;
  for (const c of s.cells) {
    if (!c) continue;
    nonAir++;
    const e = map.get(c.id) ?? { count: 0, variants: new Set<string>() };
    e.count++;
    e.variants.add(JSON.stringify(c.props));
    map.set(c.id, e);
  }
  const stats: BlockStat[] = [...map.entries()]
    .map(([id, v]) => ({ id, count: v.count, propsVariants: v.variants.size }))
    .sort((a, b) => b.count - a.count);
  return { total: s.cells.length, nonAir, stats };
}

/** NBT書出し直後のラウンドトリップ検証用。差異がなければnullを返す。 */
export function structureDifference(expected: Structure, actual: Structure, allowVoid = false): string | null {
  if (expected.size.some((n, i) => n !== actual.size[i])) {
    return `サイズ不一致: ${expected.size.join("×")} != ${actual.size.join("×")}`;
  }
  for (let i = 0; i < expected.cells.length; i++) {
    const a = expected.cells[i];
    const b = actual.cells[i];
    if (!a && !b) continue;
    if (allowVoid && !a && b && b.id === "minecraft:structure_void") continue;
    if (!a || !b) return `ブロック有無の不一致: index ${i}`;
    if (a.id !== b.id) return `ブロックIDの不一致: ${a.id} != ${b.id} (index ${i})`;
    const aProps = Object.keys(a.props).sort();
    const bProps = Object.keys(b.props).sort();
    if (aProps.length !== bProps.length || aProps.some((k, n) => k !== bProps[n] || a.props[k] !== b.props[k])) {
      return `blockstateの不一致: ${a.id} (index ${i})`;
    }
    if ((a.command ?? "") !== (b.command ?? "")) return `BlockEntity Commandの不一致: ${a.id} (index ${i})`;
  }
  return null;
}

// ============================================================
// NBT 変換 (Structure Block file format)
// root: {
//   DataVersion: Int,
//   size: List<Int>[3],
//   palette: List<Compound[{Name:String, Properties?:Compound<String>}]>,
//   palettes: List<List<Compound>>,
//   blocks: List<Compound[{pos:List<Int>[3], state:Int, nbt?:Compound}]>,
//   entities: List<Compound>,
//   author: String
// }
// ============================================================
interface PaletteEntry {
  key: string;
  id: string;
  props: Record<string, string>;
}

function paletteKey(id: string, props: Record<string, string>): string {
  const ks = Object.keys(props).sort();
  return id + "|" + ks.map((k) => `${k}=${props[k]}`).join(",");
}

/**
 * 空気の扱い
 * - air : 空気を書き出す（読込時、その位置の既存ブロックは空気で上書きされる）
 * - omit: 空気を書き出さない（軽量。読込時、その位置の既存ブロックは残る）
 * - void: 空気を structure_void として書き出す（既存ブロックを残し、構造の範囲を明示）
 */
export type AirMode = "air" | "omit" | "void";

export interface NbtWriteOptions {
  airMode?: AirMode;
}

const VOID_BLOCK: PlacedBlock = { id: "minecraft:structure_void", props: {} };

export function structureToNbt(s: Structure, author: string, dataVersion: number, options: NbtWriteOptions = {}): NbtTag {
  const airMode: AirMode = options.airMode ?? "omit";
  const [sx, sy, sz] = s.size;
  const palette: PaletteEntry[] = [];
  const pIndex = new Map<string, number>();
  if (airMode === "air") {
    palette.push({ key: paletteKey(AIR_ID, {}), id: AIR_ID, props: {} });
    pIndex.set(palette[0].key, 0);
  }

  const getState = (c: PlacedBlock | null): number => {
    if (!c) return 0;
    const id = resolveBlockId(c.id);
    if (id === AIR_ID) return 0;
    const key = paletteKey(id, c.props);
    let i = pIndex.get(key);
    if (i === undefined) {
      i = palette.length;
      palette.push({ key, id, props: { ...c.props } });
      pIndex.set(key, i);
    }
    return i;
  };

  const blockTags: NbtCompound[] = [];
  for (let y = 0; y < sy; y++)
    for (let z = 0; z < sz; z++)
      for (let x = 0; x < sx; x++) {
        const raw = s.cells[idx(sx, sy, sz, x, y, z)];
        const isAir = !raw || raw.id === AIR_ID;
        if (isAir && airMode === "omit") continue;
        const c = isAir && airMode === "void" ? VOID_BLOCK : raw;
        const state = getState(c);
        const entry: NbtCompound = {
          pos: intList([x, y, z]),
          state: int(state),
        };
        // BlockEntity NBT (コマンドブロック等)
        if (c?.command && c.id.includes("command_block")) {
          // 3種のコマンドブロックはすべて BlockEntity 型 "minecraft:command_block" を共有する
          entry.nbt = compound({
            id: str("minecraft:command_block"),
            Command: str(c.command),
            TrackOutput: byte(0),
          });
        }
        blockTags.push(entry);
      }

  // 空の構造でも palette が空にならないよう air を1件入れる
  if (palette.length === 0) palette.push({ key: paletteKey(AIR_ID, {}), id: AIR_ID, props: {} });
  const paletteTags: NbtCompound[] = palette.map((p) => {
    const c: NbtCompound = { Name: str(p.id) };
    const keys = Object.keys(p.props);
    if (keys.length > 0) {
      const pc: NbtCompound = {};
      for (const k of keys) pc[k] = str(p.props[k]);
      c.Properties = compound(pc);
    }
    return c;
  });

  const root: NbtCompound = {
    DataVersion: int(dataVersion),
    size: intList([sx, sy, sz]),
    // バニラの単一パレット構造と同じく "palette" のみ書く（"palettes" はランダム複数パレット用）
    palette: list(TAG.Compound, paletteTags),
    blocks: list(TAG.Compound, blockTags),
    entities: list(TAG.Compound, []),
    author: str(author || "AssetMaker"),
  };
  return compound(root);
}

export interface ParsedStructure {
  structure: Structure;
  author: string;
  dataVersion: number;
  paletteSize: number;
  blockEntries: number;
  warnings: string[];
}

export function nbtToStructure(root: NbtTag): ParsedStructure {
  const warnings: string[] = [];
  if (root.type !== TAG.Compound) throw new Error("ルートがCompoundではありません");
  const c = root.value as NbtCompound;

  const dv = c.DataVersion?.type === TAG.Int ? (c.DataVersion.value as number) : 0;
  const author = c.author?.type === TAG.String ? (c.author.value as string) : "";
  const sizeTag = c.size?.value as NbtList | undefined;
  if (!sizeTag || sizeTag.items.length !== 3) throw new Error("sizeタグが不正です");
  const [sx, sy, sz] = (sizeTag.items as number[]).map((n) => Math.floor(n));
  if ([sx, sy, sz].some((n) => n < 1 || n > MAX_SIZE))
    throw new Error(`サイズが範囲外です: ${sx}x${sy}x${sz} (1〜${MAX_SIZE}のみ対応)`);

  // パレット解決 (palette 優先, なければ palettes[0])
  let paletteCompounds: NbtCompound[] = [];
  const palTag = c.palette?.value as NbtList | undefined;
  const palsTag = c.palettes?.value as NbtList | undefined;
  if (palTag && palTag.items.length > 0) {
    paletteCompounds = palTag.items as unknown as NbtCompound[];
  } else if (palsTag && palsTag.items.length > 0) {
    paletteCompounds = (palsTag.items[0] as NbtList).items as unknown as NbtCompound[];
  } else {
    throw new Error("palette / palettes タグが見つかりません");
  }

  const palette: { id: string; props: Record<string, string> }[] = paletteCompounds.map((pc, i) => {
    try {
      const name = (pc as unknown as Record<string, NbtTag>).Name;
      const id = name?.type === TAG.String ? (name.value as string) : AIR_ID;
      const propsTag = (pc as unknown as Record<string, NbtTag>).Properties;
      const props: Record<string, string> = {};
      if (propsTag?.type === TAG.Compound) {
        for (const [k, v] of Object.entries(propsTag.value as NbtCompound)) {
          if (v.type === TAG.String) props[k] = v.value as string;
          else props[k] = String(v.value);
        }
      }
      return { id, props };
    } catch {
      warnings.push(`パレット#${i}の解析に失敗 → airとして扱います`);
      return { id: AIR_ID, props: {} };
    }
  });

  const structure = createStructure(sx, sy, sz);
  const blocksTag = c.blocks?.value as NbtList | undefined;
  if (!blocksTag) throw new Error("blocksタグが見つかりません");
  let placed = 0;
  for (const item of blocksTag.items) {
    const e = item as unknown as Record<string, NbtTag>;
    try {
      const pos = (e.pos?.value as NbtList).items as number[];
      const state = e.state?.value as number;
      const [x, y, z] = pos.map((n) => Math.floor(n));
      if (!inBounds(sx, sy, sz, x, y, z)) continue;
      const pal = palette[state];
      if (!pal) {
        warnings.push(`未知のstate:${state}をスキップ`);
        continue;
      }
      if (pal.id === AIR_ID || pal.id === "minecraft:cave_air" || pal.id === "minecraft:void_air") continue;
      let command: string | undefined;
      if (e.nbt?.type === TAG.Compound) {
        const nbt = e.nbt.value as NbtCompound;
        if (nbt.Command?.type === TAG.String) command = nbt.Command.value as string;
      }
      structure.cells[idx(sx, sy, sz, x, y, z)] = { id: pal.id, props: { ...pal.props }, command };
      placed++;
    } catch {
      warnings.push("破損したブロックエントリをスキップしました");
    }
  }

  return { structure, author, dataVersion: dv, paletteSize: palette.length, blockEntries: blocksTag.items.length, warnings };
}

// ============================================================
// .mcfunction 生成 (デバッグ・配布用)
// ============================================================
/** SNBT文字列リテラル ("..." で囲み、\ と " をエスケープ) */
function snbtString(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function structureToMcFunction(s: Structure): string {
  const [sx, sy, sz] = s.size;
  const { nonAir } = getStats(s);
  const lines: string[] = [
    `# Generated by Minecraft Asset Maker`,
    `# size: ${sx} ${sy} ${sz} / blocks: ${nonAir}`,
    `# 実行位置が構造の原点 (0,0,0) になります。空気は配置しません。`,
  ];
  // X方向に同一ブロックが連続する区間は fill にまとめる (単純なラン圧縮)
  for (let y = 0; y < sy; y++)
    for (let z = 0; z < sz; z++) {
      let x = 0;
      while (x < sx) {
        const c = s.cells[idx(sx, sy, sz, x, y, z)];
        if (!c) {
          x++;
          continue;
        }
        let x2 = x;
        while (x2 + 1 < sx && sameBlock(s.cells[idx(sx, sy, sz, x2 + 1, y, z)], c) && (s.cells[idx(sx, sy, sz, x2 + 1, y, z)]?.command ?? "") === (c.command ?? "")) x2++;
        const propStr = Object.keys(c.props).length
          ? `[${Object.entries(c.props).map(([k, v]) => `${k}=${v}`).join(",")}]`
          : "";
        const nbtStr = c.command && c.id.includes("command_block") ? `{Command:${snbtString(c.command)}}` : "";
        const block = `${c.id}${propStr}${nbtStr}`;
        if (x === x2) lines.push(`setblock ~${x} ~${y} ~${z} ${block}`);
        else lines.push(`fill ~${x} ~${y} ~${z} ~${x2} ~${y} ~${z} ${block}`);
        x = x2 + 1;
      }
    }
  return lines.join("\n");
}

// ============================================================
// サンプル構造ジェネレータ
// ============================================================
const B = (id: string, props: Record<string, string> = {}): PlacedBlock => ({ id, props });

export function sampleHouse(): Structure {
  const s = createStructure(13, 9, 11);
  const [sx, sy, sz] = s.size;
  const put = (x: number, y: number, z: number, b: PlacedBlock | null) => setCell(s, x, y, z, b);
  // 土台
  for (let x = 1; x < sx - 1; x++)
    for (let z = 1; z < sz - 1; z++) {
      put(x, 0, z, B("minecraft:cobblestone"));
      put(x, 1, z, B("minecraft:oak_planks"));
    }
  // 壁
  for (let y = 2; y <= 4; y++)
    for (let x = 1; x < sx - 1; x++)
      for (let z = 1; z < sz - 1; z++) {
        const edge = x === 1 || x === sx - 2 || z === 1 || z === sz - 2;
        if (!edge) continue;
        const isWindow = y === 3 && ((x === 1 || x === sx - 2) ? z % 3 === 1 : x % 3 === 1);
        if (isWindow) put(x, y, z, B("minecraft:glass"));
        else put(x, y, z, B("minecraft:oak_log", { axis: "y" }));
        if (x === 1 || x === sx - 2 || z === 1 || z === sz - 2) {
          if ((x === 1 || x === sx - 2) && (z === 1 || z === sz - 2)) put(x, y, z, B("minecraft:spruce_log", { axis: "y" }));
        }
      }
  // ドア
  const dz = Math.floor(sz / 2);
  put(Math.floor(sx / 2), 2, sz - 2, null);
  put(Math.floor(sx / 2), 3, sz - 2, null);
  put(Math.floor(sx / 2), 1, sz - 1, B("minecraft:stone_slab", { type: "bottom" }));
  // 屋根
  for (let y = 5; y <= 7; y++) {
    const inset = y - 5;
    for (let x = 1 - 1 + inset; x < sx - 1 + 1 - inset; x++)
      for (let z = 1 - 1 + inset; z < sz - 1 + 1 - inset; z++) {
        if (!inBounds(sx, sy, sz, x, y, z)) continue;
        const edgeX = x === 1 - 1 + inset || x === sx - 1 + 1 - inset - 1;
        const edgeZ = z === 1 - 1 + inset || z === sz - 1 + 1 - inset - 1;
        if (edgeX || edgeZ || y === 7) put(x, y, z, B("minecraft:spruce_stairs" in {} ? "minecraft:cobblestone_stairs" : "minecraft:cobblestone_stairs", { facing: "north", half: "bottom", shape: "straight" }));
      }
  }
  // 屋根材をレンガ階段っぽく上書き (色味のため丸石→レンガ系に)
  for (let y = 5; y <= 7; y++)
    for (let x = 0; x < sx; x++)
      for (let z = 0; z < sz; z++) {
        const c = getCell(s, x, y, z);
        if (c && c.id === "minecraft:cobblestone_stairs") {
          put(x, y, z, B("minecraft:brick_stairs", { facing: y % 2 ? "south" : "north", half: "bottom", shape: "straight" }));
        }
      }
  void dz;
  // 内装: かまど・作業台・ベッド代わりに羊毛・ランタン
  put(2, 2, 2, B("minecraft:crafting_table"));
  put(3, 2, 2, B("minecraft:furnace", { facing: "south", lit: "false" }));
  put(2, 2, 3, B("minecraft:chest", { facing: "south", type: "single" }));
  put(sx - 3, 2, 2, B("minecraft:red_wool"));
  put(sx - 4, 2, 2, B("minecraft:white_wool"));
  put(Math.floor(sx / 2), 4, Math.floor(sz / 2), B("minecraft:lantern", { hanging: "true" }));
  put(2, 2, sz - 3, B("minecraft:bookshelf"));
  return s;
}

export function sampleTower(): Structure {
  const s = createStructure(11, 18, 11);
  const [sx, sy, sz] = s.size;
  const put = (x: number, y: number, z: number, b: PlacedBlock | null) => setCell(s, x, y, z, b);
  const cx = 5, cz = 5;
  for (let y = 0; y < 14; y++) {
    for (let x = 2; x <= 8; x++)
      for (let z = 2; z <= 8; z++) {
        const dx = Math.abs(x - cx), dz = Math.abs(z - cz);
        const ring = Math.max(dx, dz) === 3;
        const corner = dx === 3 && dz === 3;
        if (corner) continue;
        if (ring) {
          put(x, y, z, y % 4 === 0 ? B("minecraft:chiseled_stone_bricks") : B("minecraft:stone_bricks"));
        } else if (dx <= 2 && dz <= 2 && y === 0) {
          put(x, y, z, B("minecraft:polished_blackstone"));
        }
      }
    // 窓
    if (y >= 3 && y % 3 === 0) {
      put(cx, y, 2, B("minecraft:glass"));
      put(cx, y, 8, B("minecraft:glass"));
      put(2, y, cz, B("minecraft:glass"));
      put(8, y, cz, B("minecraft:glass"));
    }
    // 床
    if (y === 5 || y === 9) {
      for (let x = 3; x <= 7; x++) for (let z = 3; z <= 7; z++) put(x, y, z, B("minecraft:oak_planks"));
      put(cx, y, cz, B("minecraft:oak_log", { axis: "y" }));
    }
  }
  // 入口
  put(cx, 1, 8, null); put(cx, 2, 8, null);
  // 城壁上部
  for (let x = 1; x <= 9; x++)
    for (let z = 1; z <= 9; z++) {
      const dx = Math.abs(x - cx), dz = Math.abs(z - cz);
      if (Math.max(dx, dz) === 4 && !(dx === 4 && dz === 4)) {
        put(x, 14, z, B("minecraft:stone_brick_slab", { type: "bottom" }));
        if ((x + z) % 2 === 0) put(x, 15, z, B("minecraft:stone_bricks"));
      }
    }
  for (let x = 3; x <= 7; x++) for (let z = 3; z <= 7; z++) put(x, 14, z, B("minecraft:oak_planks"));
  // 屋根
  for (let y = 16; y <= 17; y++) {
    const r = 17 - y + 1;
    for (let x = cx - r; x <= cx + r; x++)
      for (let z = cz - r; z <= cz + r; z++) {
        if (!inBounds(sx, sy, sz, x, y, z)) continue;
        if (Math.abs(x - cx) === r || Math.abs(z - cz) === r || y === 17) put(x, y, z, B("minecraft:red_nether_bricks"));
      }
  }
  put(cx, 17, cz, B("minecraft:lantern"));
  put(cx, 1, 3, B("minecraft:enchanting_table"));
  put(cx - 1, 1, 5, B("minecraft:bookshelf"));
  put(cx + 1, 1, 5, B("minecraft:bookshelf"));
  return s;
}

export function samplePixelSword(): Structure {
  // ドット絵: ダイヤの剣 (16x16) を薄い構造に
  const art = [
    "................",
    "...............D",
    "..............DD",
    ".............DDD",
    "............DDD.",
    ".B.........DDD..",
    "..B.......DDD...",
    "...B.....DDD....",
    "....B...DDD.....",
    ".....B.DDD......",
    "......BDB.......",
    ".....BBB........",
    "....BBB.........",
    "...BBB..........",
    "..HHH...........",
    ".HHH............",
  ];
  const s = createStructure(16, 16, 3);
  const put = (x: number, y: number, z: number, b: PlacedBlock | null) => setCell(s, x, y, z, b);
  // 背景フレーム
  for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) put(x, y, 0, B("minecraft:black_concrete"));
  art.forEach((row, ry) => {
    const y = 15 - ry;
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      if (ch === "D") put(x, y, 1, B("minecraft:diamond_block"));
      if (ch === "B") put(x, y, 1, B("minecraft:spruce_planks"));
      if (ch === "H") put(x, y, 1, B("minecraft:iron_block"));
    });
  });
  // ガラスカバー
  for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) put(x, y, 2, B("minecraft:glass"));
  return s;
}

export function sampleDungeon(): Structure {
  const s = createStructure(21, 7, 21);
  const [sx, sy, sz] = s.size;
  const put = (x: number, y: number, z: number, b: PlacedBlock | null) => setCell(s, x, y, z, b);
  for (let x = 0; x < sx; x++)
    for (let z = 0; z < sz; z++) {
      put(x, 0, z, B("minecraft:deepslate_tiles"));
      put(x, 6, z, B("minecraft:deepslate_bricks"));
      const wall = x === 0 || z === 0 || x === sx - 1 || z === sz - 1;
      if (wall) for (let y = 1; y <= 5; y++) put(x, y, z, B("minecraft:deepslate_bricks"));
    }
  // 迷路っぽい間仕切り
  const walls: [number, number, number, number][] = [
    [4, 2, 4, 12], [8, 8, 16, 8], [12, 2, 12, 6], [16, 12, 16, 18], [4, 16, 10, 16],
  ];
  for (const [x0, z0, x1, z1] of walls) {
    for (let x = x0; x <= x1; x++)
      for (let z = z0; z <= z1; z++)
        for (let y = 1; y <= 4; y++) put(x, y, z, B("minecraft:cobbled_deepslate"));
  }
  // 松明・スポナー・宝物庫
  put(2, 2, 2, B("minecraft:lantern", { hanging: "false" }));
  put(10, 1, 10, B("minecraft:trial_spawner"));
  put(10, 2, 10, B("minecraft:torch"));
  put(18, 1, 18, B("minecraft:vault", { facing: "north" }));
  put(18, 1, 2, B("minecraft:chest", { facing: "south", type: "single" }));
  put(2, 1, 18, B("minecraft:spawner"));
  // 溶岩トラップ装飾
  put(6, 1, 6, B("minecraft:magma_block"));
  put(14, 1, 14, B("minecraft:magma_block"));
  void sy; void sz;
  return s;
}

export function sampleRedstone(): Structure {
  const s = createStructure(17, 5, 9);
  const put = (x: number, y: number, z: number, b: PlacedBlock | null) => setCell(s, x, y, z, b);
  for (let x = 0; x < 17; x++) for (let z = 0; z < 9; z++) put(x, 0, z, B("minecraft:white_concrete"));
  // クロック回路デモ
  put(2, 1, 4, B("minecraft:repeater", { facing: "east", delay: "1", powered: "false", locked: "false" }));
  put(4, 1, 4, B("minecraft:redstone_block"));
  put(6, 1, 4, B("minecraft:sticky_piston", { facing: "east", extended: "false" }));
  put(8, 1, 4, B("minecraft:slime_block"));
  put(10, 1, 4, B("minecraft:observer", { facing: "up" }));
  put(12, 1, 4, B("minecraft:redstone_lamp", { lit: "false" }));
  put(14, 1, 4, B("minecraft:target"));
  put(2, 1, 2, B("minecraft:lever", { facing: "up", powered: "false" }));
  put(2, 1, 6, B("minecraft:stone_button", { facing: "up", powered: "false" }));
  put(6, 1, 2, B("minecraft:comparator", { facing: "east", mode: "compare", powered: "false" }));
  put(6, 1, 6, B("minecraft:daylight_detector"));
  put(10, 1, 2, B("minecraft:copper_bulb", { lit: "false", powered: "false" }));
  put(10, 1, 6, B("minecraft:crafter"));
  put(14, 1, 2, B("minecraft:note_block"));
  put(14, 1, 6, B("minecraft:tnt", { unstable: "false" }));
  return s;
}

export const SAMPLES: { id: string; ja: string; desc: string; make: () => Structure }[] = [
  { id: "house", ja: "小さな家", desc: "13×9×11・内装付き", make: sampleHouse },
  { id: "tower", ja: "監視塔", desc: "11×18×11・城壁付き", make: sampleTower },
  { id: "sword", ja: "ドット絵ソード", desc: "16×16×3・展示用", make: samplePixelSword },
  { id: "dungeon", ja: "試練ダンジョン", desc: "21×7×21・スポナー付", make: sampleDungeon },
  { id: "redstone", ja: "回路ショーケース", desc: "17×5×9・機構見本", make: sampleRedstone },
];
