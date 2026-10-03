import { ANIMATION_SECONDS, renderSword } from "../engine/render";
import type { SwordOptions } from "../engine/types";
import { canvasToPngBytes, createZip, downloadBlob, downloadDataUrl } from "../utils/zip";
import { sanitizeName } from "../utils/names";
import {
  MC_VERSIONS, makeCitProperties, makeLeafModel, makeLegacyModel, makeModernModel, makePackMcmeta,
  type McVersion,
} from "../vanilla/packBuilder";

export { MC_VERSIONS };
export type { McVersion };

/** Base items a server can hang a custom texture off. */
export const SERVER_BASE_ITEMS = [
  { id: "diamond_sword", label: "ダイヤモンドの剣", kind: "sword" },
  { id: "netherite_sword", label: "ネザライトの剣", kind: "sword" },
  { id: "iron_sword", label: "鉄の剣", kind: "sword" },
  { id: "golden_sword", label: "金の剣", kind: "sword" },
  { id: "stone_sword", label: "石の剣", kind: "sword" },
  { id: "wooden_sword", label: "木の剣", kind: "sword" },
  { id: "trident", label: "トライデント", kind: "trident" },
  { id: "mace", label: "メイス (1.21+)", kind: "mace" },
  { id: "diamond_axe", label: "ダイヤモンドの斧", kind: "axe" },
  { id: "stick", label: "棒（汎用スロット）", kind: "stick" },
] as const;

export type ServerItemConfig = {
  baseItem: string;
  /** cit = 金床リネームで切替 / cmd = custom_model_data で配布 / both */
  matchMode: "cit" | "cmd" | "both";
  /** Display name matched by CIT (defaults to the item's name) */
  citName: string;
  cmd: number;
  version: McVersion;
};

export function makeFrame(options: SwordOptions, seconds = 0, size = options.size) {
  const canvas = document.createElement("canvas");
  renderSword(canvas, size === options.size ? options : { ...options, size }, seconds);
  return canvas;
}
export function exportPNG(options: SwordOptions, name: string, seconds: number) {
  const url = makeFrame(options, seconds).toDataURL("image/png");
  const filename = `${sanitizeName(name) || "sword"}_${options.size}x${options.size}.png`;
  downloadDataUrl(url, filename);
  return { url, name: filename, size: options.size };
}
export async function copyPNG(options: SwordOptions, seconds: number) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") throw new Error("このブラウザでは画像のコピーに対応していません。PNG書き出しをご利用ください。");
  const canvas = makeFrame(options, seconds);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("画像を作成できませんでした。")), "image/png"));
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}
export function exportBatch(options: SwordOptions, name: string, seconds: number) {
  const files = [16, 32, 64, 128].map((size) => ({ path: `${sanitizeName(name) || "sword"}_${size}.png`, data: canvasToPngBytes(makeFrame(options, seconds, size)) }));
  downloadBlob(createZip(files), `${sanitizeName(name) || "sword"}_sizes.zip`);
}
export function exportResourcePack(options: SwordOptions, name: string, seconds: number) {
  const texture = canvasToPngBytes(makeFrame(options, seconds));
  const metadata = JSON.stringify({ pack: { pack_format: 15, description: `AegisBlade: ${sanitizeName(name)}` } }, null, 2);
  const files = [
    { path: "pack.mcmeta", data: new TextEncoder().encode(metadata) },
    { path: "assets/minecraft/textures/item/diamond_sword.png", data: texture },
    { path: "assets/minecraft/textures/item/netherite_sword.png", data: texture },
    { path: "README.txt", data: new TextEncoder().encode("Java Edition 1.20-1.20.1 (pack format 15). Replaces diamond and netherite sword textures only. No item stats are changed.") },
  ];
  downloadBlob(createZip(files), `${sanitizeName(name) || "sword"}_resource_pack.zip`);
}
export function exportAnimation(options: SwordOptions, name: string, count: number) {
  const size = options.size;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size * count;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is not supported.");
  context.imageSmoothingEnabled = false;
  for (let i = 0; i < count; i++) context.drawImage(makeFrame(options, i / count * ANIMATION_SECONDS), 0, i * size);
  const filename = `${sanitizeName(name) || "sword"}.png`;
  const meta = JSON.stringify({ animation: { frametime: ANIMATION_SECONDS * 20 / count, interpolate: false } }, null, 2);
  downloadBlob(createZip([
    { path: filename, data: canvasToPngBytes(canvas) },
    { path: `${filename}.mcmeta`, data: new TextEncoder().encode(meta) },
  ]), `${sanitizeName(name) || "sword"}_animation.zip`);
}
/**
 * Export the *current procedural design* as a multiplayer-server item.
 *
 * This is the アジ鯖Life distribution shape: the vanilla item keeps its stats,
 * and the custom texture appears either when the item is renamed in an anvil
 * (OptiFine / CIT Resewn) or when it carries a custom_model_data value that the
 * server sets with /give. Both roots are written so the pack works with either
 * loader, and the model format follows the target Minecraft version.
 */
export function exportServerItem(
  options: SwordOptions,
  name: string,
  seconds: number,
  config: ServerItemConfig
) {
  const clean = sanitizeName(name) || "custom_blade";
  const slug = clean.toLowerCase();
  const texture = canvasToPngBytes(makeFrame(options, seconds));
  const enc = (text: string) => new TextEncoder().encode(text);
  const kind = SERVER_BASE_ITEMS.find((item) => item.id === config.baseItem)?.kind ?? "sword";

  const files: { path: string; data: Uint8Array }[] = [
    {
      path: "pack.mcmeta",
      data: enc(makePackMcmeta({
        packName: clean,
        description: `\u00a76${name || clean}\u00a7r \u00a77- AegisBlade server item`,
        version: config.version,
        size: options.size,
        replaceVanilla: false,
        emitCit: config.matchMode !== "cmd",
        emitModels: config.matchMode !== "cit",
      })),
    },
    { path: `assets/minecraft/textures/item/aegis/${slug}.png`, data: texture },
  ];

  const wantCit = config.matchMode === "cit" || config.matchMode === "both";
  const wantCmd = config.matchMode === "cmd" || config.matchMode === "both";

  // ── CIT: rename in an anvil to reveal the texture ──
  if (wantCit) {
    const props = enc(makeCitProperties(config.baseItem, config.citName || name || clean, `${slug}.png`));
    for (const root of ["optifine", "citresewn"]) {
      files.push({ path: `assets/minecraft/${root}/cit/aegis/${slug}.png`, data: texture });
      files.push({ path: `assets/minecraft/${root}/cit/aegis/${slug}.properties`, data: props });
    }
  }

  // ── CustomModelData: the server hands the item out with /give ──
  if (wantCmd) {
    const leaf = `minecraft:item/aegis/${slug}`;
    files.push({
      path: `assets/minecraft/models/item/aegis/${slug}.json`,
      data: enc(makeLeafModel(kind, `minecraft:item/aegis/${slug}`)),
    });
    if (config.version.modernModels) {
      files.push({
        path: `assets/minecraft/items/${config.baseItem}.json`,
        data: enc(makeModernModel(config.baseItem, [{ threshold: config.cmd, model: leaf }])),
      });
    } else {
      files.push({
        path: `assets/minecraft/models/item/${config.baseItem}.json`,
        data: enc(makeLegacyModel(config.baseItem, kind, [{ cmd: config.cmd, modelPath: leaf }])),
      });
    }
  }

  files.push({ path: "README.txt", data: enc(serverItemReadme(name, clean, options, config, wantCit, wantCmd)) });

  downloadBlob(createZip(files), `${slug}_server_item.zip`);
  return files.length;
}

function serverItemReadme(
  name: string,
  slug: string,
  options: SwordOptions,
  config: ServerItemConfig,
  wantCit: boolean,
  wantCmd: boolean
): string {
  const give = config.version.modernModels
    ? `/give @s minecraft:${config.baseItem}[custom_model_data={floats:[${config.cmd}]}]`
    : config.version.packFormat >= 32
      ? `/give @s minecraft:${config.baseItem}[custom_model_data=${config.cmd}]`
      : `/give @s minecraft:${config.baseItem}{CustomModelData:${config.cmd}}`;

  const lines = [
    `${name || slug}`,
    `${"=".repeat(Math.max(slug.length, (name || slug).length))}`,
    ``,
    `Generated by AegisBlade Studio`,
    `Target : Minecraft ${config.version.label} (pack_format ${config.version.packFormat})`,
    `Texture: ${options.size}x${options.size} PNG, transparent background`,
    `Base   : minecraft:${config.baseItem} (stats unchanged)`,
    ``,
    `INSTALL`,
    `-------`,
    `1. Put this .zip in  .minecraft/resourcepacks/`,
    `2. Enable it under  Options > Resource Packs`,
    `3. For a server: set  resource-pack  in server.properties and`,
    `   server-resource-packs=true, or host the zip and use the`,
    `   "resource pack" prompt on join.`,
    ``,
  ];

  if (wantCmd) {
    lines.push(
      `GET THE ITEM (CustomModelData ${config.cmd})`,
      `--------------------------------${"-".repeat(String(config.cmd).length)}`,
      give,
      ``,
      `The vanilla ${config.baseItem} keeps its normal appearance; only items`,
      `carrying this value show the custom texture.`,
      ``
    );
  }

  if (wantCit) {
    lines.push(
      `GET THE ITEM (rename / CIT)`,
      `---------------------------`,
      `Rename any ${config.baseItem} in an anvil to:`,
      ``,
      `    ${config.citName || name || slug}`,
      ``,
      `Requires OptiFine or CIT Resewn on the client. Both asset roots are`,
      `included (assets/minecraft/optifine/cit and assets/minecraft/citresewn/cit),`,
      `so the same zip works with either loader.`,
      ``,
      `Matching rule written to the .properties file:`,
      `    nbt.display.Name=ipattern:*${config.citName || name || slug}*`,
      ``
    );
  }

  lines.push(
    `FILES`,
    `-----`,
    `  assets/minecraft/textures/item/aegis/${slug}.png`,
    wantCit ? `  assets/minecraft/{optifine,citresewn}/cit/aegis/${slug}.{png,properties}` : ``,
    wantCmd ? (config.version.modernModels
      ? `  assets/minecraft/items/${config.baseItem}.json          (range_dispatch)`
      : `  assets/minecraft/models/item/${config.baseItem}.json     (overrides)`) : ``,
    wantCmd ? `  assets/minecraft/models/item/aegis/${slug}.json` : ``,
    ``,
    `Item stats are never modified - this pack only changes appearance.`
  );
  return lines.filter((l) => l !== undefined).join("\n") + "\n";
}
