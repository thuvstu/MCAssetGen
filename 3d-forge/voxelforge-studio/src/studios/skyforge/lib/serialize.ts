import type { PackRow, TextureRow } from "@/studios/skyforge/db/schema";

export type MixDTO = { id: string; weight: number };

export type PackDTO = {
  id: string;
  name: string;
  author: string;
  description: string;
  resolution: number;
  styleId: string;
  signatureId: string;
  isPublic: boolean;
  downloads: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
};

export type TextureDTO = {
  id: string;
  packId: string;
  itemId: string;
  name: string;
  category: string;
  rarity: string;
  styleMix: MixDTO[];
  signatureMix: MixDTO[];
  seed: number;
  resolution: number;
  pixels: number[];
  hueShift: number;
  glow: number;
  metallic: number;
  chaos: number;
  templateId: string;
  createdAt: string;
  updatedAt: string;
};

export type PackDetailDTO = PackDTO & { textures: TextureDTO[] };

export function toPackDTO(row: PackRow): PackDTO {
  return {
    id: row.id,
    name: row.name,
    author: row.author,
    description: row.description,
    resolution: row.resolution,
    styleId: row.styleId,
    signatureId: row.signatureId,
    isPublic: row.isPublic,
    downloads: row.downloads,
    likes: row.likes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toTextureDTO(row: TextureRow): TextureDTO {
  return {
    id: row.id,
    packId: row.packId,
    itemId: row.itemId,
    name: row.name,
    category: row.category,
    rarity: row.rarity,
    styleMix: row.styleMix,
    signatureMix: row.signatureMix ?? [],
    seed: row.seed,
    resolution: row.resolution,
    pixels: row.pixels,
    hueShift: row.hueShift,
    glow: row.glow,
    metallic: row.metallic,
    chaos: row.chaos,
    templateId: row.templateId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Texture metadata without the pixel payload — for list/detail pages that
 *  render through the PNG endpoint instead of drawing client-side. */
export type TextureMetaDTO = Omit<TextureDTO, "pixels">;
export type PackMetaDTO = PackDTO & { textures: TextureMetaDTO[] };

export function toTextureMetaDTO(row: TextureRow): TextureMetaDTO {
  const { pixels: _pixels, ...rest } = toTextureDTO(row);
  void _pixels;
  return rest;
}
