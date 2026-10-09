import JSZip from "jszip";
import { getItem } from "./catalog";
import { citProperties, packMcmeta, packReadme, sanitizeFilename } from "./pack-files";

export type PackFile = { path: string; data: Uint8Array | string };

export async function zipFiles(files: PackFile[]): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.path, file.data);
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

export function buildPackFileList(opts: {
  name: string;
  author: string;
  description: string;
  textures: { itemId: string; png: Uint8Array }[];
  packPng?: Uint8Array;
}): PackFile[] {
  const files: PackFile[] = [
    { path: "pack.mcmeta", data: packMcmeta(opts.name, opts.description) },
    { path: "readme-skyforge.txt", data: packReadme(opts.name, opts.author) },
  ];
  if (opts.packPng) files.push({ path: "pack.png", data: opts.packPng });

  for (const tex of opts.textures) {
    const item = getItem(tex.itemId);
    files.push({ path: `textures/${tex.itemId}.png`, data: tex.png });
    if (!item) continue;
    files.push({
      path: `assets/minecraft/optifine/cit/skyforge/${item.id}.png`,
      data: tex.png,
    });
    files.push({
      path: `assets/minecraft/optifine/cit/skyforge/${item.id}.properties`,
      data: citProperties(item),
    });
  }
  return files;
}

export function downloadFilename(packName: string): string {
  return `${sanitizeFilename(packName)}.zip`;
}

/**
 * A complete installable resource pack containing exactly one texture.
 * Users can drop this on top of another pack without carrying anyone else's
 * textures along — the normal use case for distributing a single item.
 */
export function buildSingleTextureFileList(opts: {
  name: string;
  author: string;
  description: string;
  itemId: string;
  png: Uint8Array;
}): PackFile[] {
  const item = getItem(opts.itemId);
  const files: PackFile[] = [
    {
      path: "pack.mcmeta",
      data: packMcmeta(opts.name, opts.description || `single item: ${opts.itemId}`),
    },
    {
      path: "readme-skyforge.txt",
      data: packReadme(opts.name, opts.author),
    },
    { path: `textures/${opts.itemId}.png`, data: opts.png },
    { path: `pack.png`, data: opts.png },
  ];
  if (item) {
    files.push({
      path: `assets/minecraft/optifine/cit/skyforge/${item.id}.png`,
      data: opts.png,
    });
    files.push({
      path: `assets/minecraft/optifine/cit/skyforge/${item.id}.properties`,
      data: citProperties(item),
    });
  }
  return files;
}

export function singleTextureFilename(itemId: string): string {
  return `${sanitizeFilename(itemId)}-skyforge-single.zip`;
}
