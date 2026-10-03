import JSZip from "jszip";
import { getItem } from "@/lib/catalog";
import { citProperties, packMcmeta, packReadme, sanitizeFilename } from "@/lib/pack-files";

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
