import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { packs, textures } from "@/db/schema";
import {
  toPackDTO,
  toTextureDTO,
  toTextureMetaDTO,
  type PackDetailDTO,
  type PackDTO,
  type PackMetaDTO,
  type TextureDTO,
  type TextureMetaDTO,
} from "@/lib/serialize";

/** Gallery listing: metadata only (pixels would be megabytes at 64×). */
export async function listPublicPacks(): Promise<PackMetaDTO[]> {
  const packRows = await db.select().from(packs).orderBy(desc(packs.likes), desc(packs.createdAt));
  const texRows = await db.select().from(textures);
  const grouped = new Map<string, TextureMetaDTO[]>();
  for (const tex of texRows) {
    const list = grouped.get(tex.packId) ?? [];
    list.push(toTextureMetaDTO(tex));
    grouped.set(tex.packId, list);
  }
  return packRows
    .filter((p) => p.isPublic)
    .map((p) => ({ ...toPackDTO(p), textures: grouped.get(p.id) ?? [] }));
}

/** Pack page: metadata only — thumbnails come from /api/textures/[id]/png. */
export async function getPackMeta(id: string): Promise<PackMetaDTO | null> {
  const [pack] = await db.select().from(packs).where(eq(packs.id, id)).limit(1);
  if (!pack) return null;
  const texRows = await db.select().from(textures).where(eq(textures.packId, id));
  return { ...toPackDTO(pack), textures: texRows.map(toTextureMetaDTO) };
}

/** Studio: full pixels, because the editor draws them client-side. */
export async function getPackDetail(id: string): Promise<PackDetailDTO | null> {
  const [pack] = await db.select().from(packs).where(eq(packs.id, id)).limit(1);
  if (!pack) return null;
  const texRows = await db.select().from(textures).where(eq(textures.packId, id));
  return { ...toPackDTO(pack), textures: texRows.map(toTextureDTO) };
}

export type { PackDTO, TextureDTO };
