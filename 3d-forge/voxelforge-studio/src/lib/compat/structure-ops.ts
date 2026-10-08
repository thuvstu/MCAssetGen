// ============================================================
// 構造の変換(回転・反転) / ID一括リネーム / 検証 / プロジェクト保存 / 対称配置
// ============================================================
import { AIR_ID, DEFAULT_DATAVERSION, ID_REGEX, isRegistered, namespaceOf, type BlockDef } from "./structure-data";
import { createStructure, idx, MAX_SIZE, type AirMode, type PlacedBlock, type Structure, type Vec3 } from "./structure-model";

// ---------- 変換 ----------
export type TransformKind = "rotY" | "flipX" | "flipZ";

const ROT_CW: Record<string, string> = { north: "east", east: "south", south: "west", west: "north" };
const FLIP_X: Record<string, string> = { east: "west", west: "east" };
const FLIP_Z: Record<string, string> = { north: "south", south: "north" };
// 鏡像時は左右の意味が反転する (階段のshape、チェストのtypeなど)
const SWAP_LR: Record<string, string> = {
  inner_left: "inner_right",
  inner_right: "inner_left",
  outer_left: "outer_right",
  outer_right: "outer_left",
  left: "right",
  right: "left",
};

/** blockstateを変換。向き・軸・左右の意味をMinecraftの規則に沿って更新 */
export function mapProps(props: Record<string, string>, kind: TransformKind): Record<string, string> {
  const out = { ...props };
  if (kind === "rotY") {
    if (out.facing && ROT_CW[out.facing]) out.facing = ROT_CW[out.facing];
    if (out.axis === "x") out.axis = "z";
    else if (out.axis === "z") out.axis = "x";
  } else {
    const map = kind === "flipX" ? FLIP_X : FLIP_Z;
    if (out.facing && map[out.facing]) out.facing = map[out.facing];
    if (out.shape && SWAP_LR[out.shape]) out.shape = SWAP_LR[out.shape];
    if (out.type && SWAP_LR[out.type]) out.type = SWAP_LR[out.type];
  }
  return out;
}

export function transformStructure(s: Structure, kind: TransformKind): Structure {
  const [sx, sy, sz] = s.size;
  const nsx = kind === "rotY" ? sz : sx;
  const nsz = kind === "rotY" ? sx : sz;
  const out = createStructure(nsx, sy, nsz);
  for (let y = 0; y < sy; y++)
    for (let z = 0; z < sz; z++)
      for (let x = 0; x < sx; x++) {
        const c = s.cells[idx(sx, sy, sz, x, y, z)];
        if (!c) continue;
        let nx = x;
        let nz = z;
        if (kind === "rotY") {
          nx = sz - 1 - z;
          nz = x;
        } else if (kind === "flipX") {
          nx = sx - 1 - x;
        } else {
          nz = sz - 1 - z;
        }
        out.cells[idx(nsx, sy, nsz, nx, y, nz)] = { id: c.id, props: mapProps(c.props, kind), command: c.command };
      }
  return out;
}

// ---------- ID一括リネーム (MOD移行・仮ID差し替え) ----------
export function renameBlockId(s: Structure, from: string, to: string): Structure {
  const cells = s.cells.map((c) => {
    if (!c) return null;
    return c.id === from ? { id: to, props: { ...c.props }, command: c.command } : c;
  });
  return { size: [...s.size] as Vec3, cells };
}

// ---------- 検証 ----------
export interface ValidationResult {
  total: number;
  namespaces: { ns: string; count: number }[];
  unregistered: { id: string; count: number }[];
  invalid: string[];
}

export function validateStructure(s: Structure): ValidationResult {
  const ns = new Map<string, number>();
  const unk = new Map<string, number>();
  const invalid = new Set<string>();
  let total = 0;
  for (const c of s.cells) {
    if (!c || c.id === AIR_ID) continue;
    total++;
    const n = namespaceOf(c.id);
    ns.set(n, (ns.get(n) ?? 0) + 1);
    if (!ID_REGEX.test(c.id)) invalid.add(c.id);
    if (!isRegistered(c.id)) unk.set(c.id, (unk.get(c.id) ?? 0) + 1);
  }
  const sortDesc = <T extends { count: number }>(a: T, b: T) => b.count - a.count;
  return {
    total,
    namespaces: [...ns.entries()].map(([n, count]) => ({ ns: n, count })).sort(sortDesc),
    unregistered: [...unk.entries()].map(([id, count]) => ({ id, count })).sort(sortDesc),
    invalid: [...invalid],
  };
}

// ---------- プロジェクト保存 (.mcproj.json / 自動保存) ----------
export interface ProjectMeta {
  author: string;
  fileName: string;
  dataVersion: number;
  selectedId: string;
  recent: string[];
  airMode: AirMode;
  packNamespace: string;
}

export const DEFAULT_META: ProjectMeta = {
  author: "AssetMaker",
  fileName: "my_structure",
  dataVersion: DEFAULT_DATAVERSION,
  selectedId: "minecraft:oak_planks",
  recent: ["minecraft:stone", "minecraft:oak_log", "minecraft:glass", "minecraft:lantern"],
  airMode: "omit",
  packNamespace: "assetmaker",
};

interface PaletteItem {
  id: string;
  props: Record<string, string>;
  command?: string;
}

/** v1: 疎なセル配列 */
type SparseCell = [number, string, Record<string, string>, string | null];

const AUTOSAVE_KEY = "mam_autosave_v1";

/**
 * v2 形式: パレット + ランレングス圧縮
 *   runs = [paletteIndex, count, paletteIndex, count, ...]  (-1 = 空気)
 * 48³ を埋め尽くした構造でも数十KB程度に収まる（自動保存の容量超過対策）
 */
export function serializeProject(s: Structure, meta: ProjectMeta): string {
  const palette: PaletteItem[] = [];
  const index = new Map<string, number>();
  const runs: number[] = [];
  let prev = -2;
  let count = 0;
  const flush = () => {
    if (count > 0) runs.push(prev, count);
  };
  for (const c of s.cells) {
    let k = -1;
    if (c) {
      const key = `${c.id}|${Object.keys(c.props).sort().map((p) => `${p}=${c.props[p]}`).join(",")}|${c.command ?? ""}`;
      let i = index.get(key);
      if (i === undefined) {
        i = palette.length;
        palette.push({ id: c.id, props: { ...c.props }, ...(c.command ? { command: c.command } : {}) });
        index.set(key, i);
      }
      k = i;
    }
    if (k === prev) count++;
    else {
      flush();
      prev = k;
      count = 1;
    }
  }
  flush();
  return JSON.stringify({ format: "mam-project", version: 2, app: "Minecraft Asset Maker", size: s.size, palette, runs, meta });
}

export function deserializeProject(text: string): { structure: Structure; meta: ProjectMeta } {
  const j = JSON.parse(text);
  if (j?.format !== "mam-project" || !Array.isArray(j.size) || j.size.length !== 3) {
    throw new Error("Minecraft Asset Maker のプロジェクトファイルではありません");
  }
  const size = (j.size as unknown[]).map((n) => Number(n));
  if (size.some((n) => !Number.isFinite(n) || n < 1 || n > MAX_SIZE)) {
    throw new Error(`サイズが不正です: ${j.size.join("×")}（1〜${MAX_SIZE}）`);
  }
  const [sx, sy, sz] = size as Vec3;
  const st = createStructure(sx, sy, sz);

  if (Number(j.version) >= 2 && Array.isArray(j.runs)) {
    const palette = (Array.isArray(j.palette) ? j.palette : []) as PaletteItem[];
    const blocks: (PlacedBlock | null)[] = palette.map((p) =>
      p && typeof p.id === "string" ? { id: p.id, props: { ...(p.props ?? {}) }, command: p.command || undefined } : null
    );
    let pos = 0;
    const runs = j.runs as number[];
    for (let r = 0; r + 1 < runs.length && pos < st.cells.length; r += 2) {
      const k = runs[r];
      const n = Math.max(0, Math.floor(runs[r + 1]));
      const block = k >= 0 ? blocks[k] ?? null : null;
      if (block) {
        const end = Math.min(st.cells.length, pos + n);
        // PlacedBlock は不変として扱うため同一オブジェクトを共有してよい
        for (let i = pos; i < end; i++) st.cells[i] = block;
      }
      pos += n;
    }
  } else {
    for (const [i, id, props, cmd] of (j.cells ?? []) as SparseCell[]) {
      if (typeof i !== "number" || i < 0 || i >= st.cells.length || typeof id !== "string") continue;
      st.cells[i] = { id, props: props ?? {}, command: cmd ?? undefined };
    }
  }
  return { structure: st, meta: { ...DEFAULT_META, ...(j.meta ?? {}) } };
}

/** 自動保存。容量超過時はfalse */
export function writeAutosave(s: Structure, meta: ProjectMeta): boolean {
  try {
    localStorage.setItem(AUTOSAVE_KEY, serializeProject(s, meta));
    return true;
  } catch {
    return false;
  }
}

export function readAutosave(): { structure: Structure; meta: ProjectMeta } | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return deserializeProject(raw);
  } catch {
    return null;
  }
}

export function clearAutosave() {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    /* noop */
  }
}

// ---------- 対称配置 (ミラー) ----------
export interface SymmetryVariant {
  flipX: boolean;
  flipZ: boolean;
}

/** 有効な対称軸から複製パターンを列挙（先頭は必ず元の位置） */
export function symmetryVariants(mirrorX: boolean, mirrorZ: boolean): SymmetryVariant[] {
  const out: SymmetryVariant[] = [];
  for (const flipX of mirrorX ? [false, true] : [false])
    for (const flipZ of mirrorZ ? [false, true] : [false]) out.push({ flipX, flipZ });
  return out;
}

export function mirrorPos(p: Vec3, size: Vec3, v: SymmetryVariant): Vec3 {
  return [v.flipX ? size[0] - 1 - p[0] : p[0], p[1], v.flipZ ? size[2] - 1 - p[2] : p[2]];
}

/** ミラー後のブロック。向き・左右の意味（階段の形・チェストの左右）もMinecraftの規則で反転 */
export function mirrorBlock(b: PlacedBlock | null, v: SymmetryVariant): PlacedBlock | null {
  if (!b) return null;
  let props = { ...b.props };
  if (v.flipX) props = mapProps(props, "flipX");
  if (v.flipZ) props = mapProps(props, "flipZ");
  return { id: b.id, props, command: b.command };
}

export type { BlockDef };
