// ============================================================
// カスタム(MOD)ブロック定義の永続化・検証・JSON入出力
// ============================================================
import { BLOCKS, ID_REGEX, setCustomBlocks, type BlockDef } from "./minecraft-data";

const STORAGE_KEY = "mam_custom_blocks_v1";

/** 定義の妥当性チェック。問題なければnull、あればエラーメッセージ */
export function validateCustomDef(d: BlockDef): string | null {
  if (!d.id || !ID_REGEX.test(d.id)) return "IDは namespace:path 形式で入力してください（小文字・数字・_ . - / のみ）";
  if (d.id === "minecraft:air") return "airは登録できません";
  if (BLOCKS.some((b) => b.id === d.id)) return "標準ブロックと同じIDは登録できません";
  if (!/^#[0-9a-fA-F]{6}$/.test(d.color)) return "色の形式が不正です";
  for (const [k, vals] of Object.entries(d.props ?? {})) {
    if (!/^[a-z0-9_]+$/.test(k)) return `プロパティ名 "${k}" は小文字英数字と_のみ使用できます`;
    if (!Array.isArray(vals) || vals.length === 0) return `プロパティ "${k}" の値が空です`;
  }
  return null;
}

function sanitize(arr: unknown): BlockDef[] {
  if (!Array.isArray(arr)) return [];
  const out: BlockDef[] = [];
  for (const raw of arr as BlockDef[]) {
    if (!raw || typeof raw !== "object") continue;
    const def: BlockDef = {
      id: String(raw.id ?? ""),
      ja: String(raw.ja ?? raw.id ?? ""),
      en: String(raw.en ?? raw.id ?? ""),
      color: String(raw.color ?? "#888888"),
      category: "custom",
      transparent: !!raw.transparent,
      blockEntity: !!raw.blockEntity,
      props: raw.props,
      defaults: raw.defaults,
    };
    if (!validateCustomDef(def)) out.push(def);
  }
  return out;
}

export function loadCustomBlocks(): BlockDef[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return sanitize(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function persistCustomBlocks(defs: BlockDef[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defs));
  } catch {
    /* 容量超過などは無視 (メモリ上は有効) */
  }
  setCustomBlocks(defs);
}

export function exportCustomBlocksJson(defs: BlockDef[]): string {
  return JSON.stringify({ format: "mam-custom-blocks", version: 1, blocks: defs }, null, 2);
}

export function importCustomBlocksJson(text: string): BlockDef[] {
  const j = JSON.parse(text);
  const arr = Array.isArray(j) ? j : j?.blocks;
  if (!Array.isArray(arr)) throw new Error("カスタムブロック定義のJSONではありません");
  return sanitize(arr);
}
