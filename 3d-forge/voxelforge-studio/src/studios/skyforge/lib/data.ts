import {
  getPack,
  listAllTextures,
  listPacksByCreated,
  listTexturesByPack,
} from "@/studios/skyforge/db/repo";
import {
  toPackDTO,
  toTextureDTO,
  toTextureMetaDTO,
  type PackDetailDTO,
  type PackDTO,
  type PackMetaDTO,
  type TextureDTO,
  type TextureMetaDTO,
} from "@/studios/skyforge/lib/serialize";

/** Gallery listing: metadata only (pixels would be megabytes at 64×). */
export async function listPublicPacks(): Promise<PackMetaDTO[]> {
  const packRows = (await listPacksByCreated())
    .filter((p) => p.isPublic)
    .sort((a, b) => b.likes - a.likes || b.createdAt.getTime() - a.createdAt.getTime());
  const texRows = await listAllTextures();
  const grouped = new Map<string, TextureMetaDTO[]>();
  for (const tex of texRows) {
    const list = grouped.get(tex.packId) ?? [];
    list.push(toTextureMetaDTO(tex));
    grouped.set(tex.packId, list);
  }
  return packRows.map((p) => ({ ...toPackDTO(p), textures: grouped.get(p.id) ?? [] }));
}

/** Pack page: metadata only — thumbnails come from /api/textures/[id]/png. */
export async function getPackMeta(id: string): Promise<PackMetaDTO | null> {
  const pack = await getPack(id);
  if (!pack) return null;
  const texRows = await listTexturesByPack(id);
  return { ...toPackDTO(pack), textures: texRows.map(toTextureMetaDTO) };
}

/** Studio: full pixels, because the editor draws them client-side. */
export async function getPackDetail(id: string): Promise<PackDetailDTO | null> {
  const pack = await getPack(id);
  if (!pack) return null;
  const texRows = await listTexturesByPack(id);
  return { ...toPackDTO(pack), textures: texRows.map(toTextureDTO) };
}

export type { PackDTO, TextureDTO };
