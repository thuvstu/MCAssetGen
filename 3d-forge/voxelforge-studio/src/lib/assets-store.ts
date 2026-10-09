import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";

/**
 * アセットバス — スタジオ間の受け渡し。
 *
 * 各スタジオ (GUI / エンジン / CLI) の出力をここへ保存し、別のスタジオの
 * 入力として取り出せるようにする。DBは使わず `.mcasset-assets/` に
 * 1アセット=1JSONで置くので、スタジオをまたいでも・再起動しても残る。
 */

export interface AssetFile {
  path: string;
  base64: string;
}

export interface AssetRecord {
  id: string;
  name: string;
  /** 生成元スタジオ (texcraft / voxel / mythic …) */
  studio: string;
  /** 生成元コマンド (render / export / build …) */
  kind: string;
  createdAt: string;
  files: AssetFile[];
  /** 一覧表示用の小さなPNG (単一画像アセットのみ) */
  thumb?: string;
  note?: string;
}

export interface AssetSummary {
  id: string;
  name: string;
  studio: string;
  kind: string;
  createdAt: string;
  bytes: number;
  files: string[];
  thumb?: string;
  note?: string;
}

export interface SaveAssetInput {
  name: string;
  studio: string;
  kind: string;
  files: AssetFile[];
  note?: string;
}

const ASSET_DIR = join(process.cwd(), ".mcasset-assets");
const NAME_PATTERN = /[^a-zA-Z0-9._-]+/g;

function ensureDir(): void {
  if (!existsSync(ASSET_DIR)) mkdirSync(ASSET_DIR, { recursive: true });
}

export const assetSlug = (name: string): string =>
  name.trim().replace(/\s+/g, "-").replace(NAME_PATTERN, "_").replace(/^[-_.]+/, "") ||
  "asset";

const recordPath = (id: string) => join(ASSET_DIR, `${id}.json`);

/** 単一PNGなら64px以下のサムネイルを作る (一覧でプレビューするため)。 */
function makeThumb(files: AssetFile[]): string | undefined {
  if (files.length !== 1) return undefined;
  const file = files[0];
  if (!/\.png$/i.test(file.path)) return undefined;
  try {
    const png = PNG.sync.read(Buffer.from(file.base64, "base64"));
    const scale = Math.min(1, 64 / Math.max(png.width, png.height));
    const width = Math.max(1, Math.round(png.width * scale));
    const height = Math.max(1, Math.round(png.height * scale));
    const out = new PNG({ width, height });
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // 最近傍で縮小 (ピクセルアートは模糊させない)
        const sx = Math.min(png.width - 1, Math.floor(x / scale));
        const sy = Math.min(png.height - 1, Math.floor(y / scale));
        const from = (png.width * sy + sx) << 2;
        const to = (width * y + x) << 2;
        out.data[to] = png.data[from];
        out.data[to + 1] = png.data[from + 1];
        out.data[to + 2] = png.data[from + 2];
        out.data[to + 3] = png.data[from + 3];
      }
    }
    const encoded = PNG.sync.write(out).toString("base64");
    return encoded.length <= 40_000 ? encoded : undefined;
  } catch {
    return undefined;
  }
}

function summarize(record: AssetRecord): AssetSummary {
  const bytes = record.files.reduce((total, file) => total + Math.floor((file.base64.length * 3) / 4), 0);
  return {
    id: record.id,
    name: record.name,
    studio: record.studio,
    kind: record.kind,
    createdAt: record.createdAt,
    bytes,
    files: record.files.map((file) => file.path),
    thumb: record.thumb,
    note: record.note,
  };
}

/** 保存する。同じ名前があれば上書き (作業中の成果物を更新する運用のため)。 */
export function saveAsset(input: SaveAssetInput): AssetRecord {
  if (!input.files.length) throw new Error("アセットにファイルがありません。");
  ensureDir();

  const existing = listRecords().find((record) => record.name === input.name);
  const record: AssetRecord = {
    id: existing?.id ?? randomUUID(),
    name: input.name,
    studio: input.studio,
    kind: input.kind,
    createdAt: new Date().toISOString(),
    files: input.files,
    thumb: makeThumb(input.files),
    note: input.note,
  };
  writeFileSync(recordPath(record.id), JSON.stringify(record));
  return record;
}

function listRecords(): AssetRecord[] {
  if (!existsSync(ASSET_DIR)) return [];
  const records: AssetRecord[] = [];
  for (const entry of readdirSync(ASSET_DIR)) {
    if (!entry.endsWith(".json")) continue;
    try {
      records.push(JSON.parse(readFileSync(join(ASSET_DIR, entry), "utf8")) as AssetRecord);
    } catch {
      // 壊れたファイルは無視する (手で消せる)
    }
  }
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAssets(): AssetSummary[] {
  return listRecords().map(summarize);
}

/** id でも名前でも引ける (CLI/コンソールから扱いやすくするため)。 */
export function readAsset(idOrName: string): AssetRecord | null {
  const records = listRecords();
  return (
    records.find((record) => record.id === idOrName) ??
    records.find((record) => record.name === idOrName) ??
    records.find((record) => record.name.toLowerCase() === idOrName.toLowerCase()) ??
    null
  );
}

export function deleteAsset(idOrName: string): boolean {
  const record = readAsset(idOrName);
  if (!record) return false;
  rmSync(recordPath(record.id), { force: true });
  return true;
}

export { summarize as summarizeAsset };
