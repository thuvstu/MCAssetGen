import type { CatalogItem } from "./catalog";

/**
 * `supported_formats` lets modern clients (1.20.2+) accept the pack while the
 * legacy `pack_format` keeps 1.8.9 OptiFine / SkyClient loaders happy — the
 * same trick community SkyBlock packs use to span versions.
 */
export function packMcmeta(name: string, description: string): string {
  const desc = `${name} — ${description || "SkyForge generated SkyBlock pack"}`.slice(0, 110);
  return `${JSON.stringify(
    {
      pack: {
        pack_format: 15,
        supported_formats: { min_inclusive: 4, max_inclusive: 64 },
        description: desc,
      },
    },
    null,
    2,
  )}\n`;
}

export function citProperties(item: CatalogItem): string {
  return [
    "type=item",
    `items=${item.mcItems.join(" ")}`,
    `nbt.display.Name=ipattern:*${item.citPattern}*`,
    `texture=${item.id}`,
  ].join("\n");
}

export function packReadme(name: string, author: string): string {
  return [
    `SkyForge Texture Pack: ${name}`,
    `Author: ${author}`,
    "",
    "このパックは SkyForge が生成したオリジナルピクセルアートです。",
    "既存の Hypixel SkyBlock テクスチャパックの画像は使用していません。",
    "",
    "導入方法:",
    "1. この ZIP を Minecraft の resourcepacks フォルダへ入れる",
    "2. OptiFine または CIT 対応クライアント（SkyClient など）を使う",
    "3. リソースパックを有効化する",
    "",
    "CIT パス: assets/minecraft/optifine/cit/skyforge/",
    "生 PNG: textures/",
    "",
    "Hypixel / SkyBlock はそれぞれの所有者の商標です。",
    "",
  ].join("\n");
}

export function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^\w\u3040-\u30ff\u4e00-\u9faf\- ]+/g, "").trim() || "skyforge-pack";
  return cleaned.replace(/\s+/g, "_").slice(0, 48);
}
