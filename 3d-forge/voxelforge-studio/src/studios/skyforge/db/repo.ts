import { and, desc, eq } from "drizzle-orm";
import { db } from "@/studios/skyforge/db";
import { packs, textures, type PackRow, type TextureRow } from "@/studios/skyforge/db/schema";

/**
 * SkyForge の保存庫 (パック / テクスチャ)。
 *
 * DATABASE_URL があれば Postgres、無ければプロセス内メモリ。GUIの全機能
 * (スタジオでの生成 → パック保存 → ギャラリー → 書き出し) はメモリでも動く。
 */
const globalForStore = globalThis as typeof globalThis & {
  __skyforgePacks?: Map<string, PackRow>;
  __skyforgeTextures?: Map<string, TextureRow>;
};

const packStore: Map<string, PackRow> = globalForStore.__skyforgePacks ?? new Map();
const textureStore: Map<string, TextureRow> = globalForStore.__skyforgeTextures ?? new Map();
globalForStore.__skyforgePacks = packStore;
globalForStore.__skyforgeTextures = textureStore;

export const storage = db ? "postgres" : "memory";

/* ---------------- packs ---------------- */

/** 一覧: いいね順 → 新しい順 (元の listPublicPacks と同じ) */
export async function listPacksByLikes(): Promise<PackRow[]> {
  if (!db) {
    return [...packStore.values()].sort(
      (a, b) => b.likes - a.likes || b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }
  return db.select().from(packs).orderBy(desc(packs.likes), desc(packs.createdAt));
}

export async function listPacksByCreated(): Promise<PackRow[]> {
  if (!db) {
    return [...packStore.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(packs).orderBy(desc(packs.createdAt));
}

export async function getPack(id: string): Promise<PackRow | null> {
  if (!db) return packStore.get(id) ?? null;
  const [row] = await db.select().from(packs).where(eq(packs.id, id)).limit(1);
  return row ?? null;
}

export async function insertPack(row: PackRow): Promise<void> {
  if (!db) {
    packStore.set(row.id, row);
    return;
  }
  await db.insert(packs).values(row);
}

export async function updatePack(id: string, patch: Partial<PackRow>): Promise<void> {
  if (!db) {
    const current = packStore.get(id);
    if (current) packStore.set(id, { ...current, ...patch, id });
    return;
  }
  await db.update(packs).set(patch).where(eq(packs.id, id));
}

export async function deletePack(id: string): Promise<void> {
  if (!db) {
    packStore.delete(id);
    return;
  }
  await db.delete(packs).where(eq(packs.id, id));
}

/* ---------------- textures ---------------- */

export async function listAllTextures(): Promise<TextureRow[]> {
  if (!db) return [...textureStore.values()];
  return db.select().from(textures);
}

export async function listTexturesByPack(packId: string): Promise<TextureRow[]> {
  if (!db) return [...textureStore.values()].filter((row) => row.packId === packId);
  return db.select().from(textures).where(eq(textures.packId, packId));
}

export async function getTexture(id: string): Promise<TextureRow | null> {
  if (!db) return textureStore.get(id) ?? null;
  const [row] = await db.select().from(textures).where(eq(textures.id, id)).limit(1);
  return row ?? null;
}

/** パック内のアイテム重複チェック (元: and(eq(packId), eq(itemId))) */
export async function findTextureByItem(packId: string, itemId: string): Promise<TextureRow | null> {
  if (!db) {
    for (const row of textureStore.values()) {
      if (row.packId === packId && row.itemId === itemId) return row;
    }
    return null;
  }
  const [row] = await db
    .select()
    .from(textures)
    .where(and(eq(textures.packId, packId), eq(textures.itemId, itemId)))
    .limit(1);
  return row ?? null;
}

export async function insertTexture(row: TextureRow): Promise<void> {
  if (!db) {
    textureStore.set(row.id, row);
    return;
  }
  await db.insert(textures).values(row);
}

export async function insertTextures(rows: TextureRow[]): Promise<void> {
  if (!db) {
    for (const row of rows) textureStore.set(row.id, row);
    return;
  }
  for (let i = 0; i < rows.length; i += 12) await db.insert(textures).values(rows.slice(i, i + 12));
}

export async function updateTexture(id: string, patch: Partial<TextureRow>): Promise<void> {
  if (!db) {
    const current = textureStore.get(id);
    if (current) textureStore.set(id, { ...current, ...patch, id });
    return;
  }
  await db.update(textures).set(patch).where(eq(textures.id, id));
}

export async function deleteTexture(id: string): Promise<void> {
  if (!db) {
    textureStore.delete(id);
    return;
  }
  await db.delete(textures).where(eq(textures.id, id));
}

export async function deleteTexturesByPack(packId: string): Promise<void> {
  if (!db) {
    for (const [id, row] of textureStore) if (row.packId === packId) textureStore.delete(id);
    return;
  }
  await db.delete(textures).where(eq(textures.packId, packId));
}

/** いいね (元: sql`likes + 1`) */
export async function likePack(id: string): Promise<PackRow | null> {
  const current = await getPack(id);
  if (!current) return null;
  await updatePack(id, { likes: current.likes + 1 });
  return getPack(id);
}

/** ダウンロード数 +1 (書き出し時) */
export async function bumpPackDownloads(id: string): Promise<void> {
  const current = await getPack(id);
  if (current) await updatePack(id, { downloads: current.downloads + 1 });
}
