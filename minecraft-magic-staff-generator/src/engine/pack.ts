import { RARITIES, type Config } from "./data";
import { renderFrame, frameToCanvas } from "./render";
import { buildZip, type ZipEntry } from "./zip";

/** Java Edition versions a pack can declare, in release order. */
export const MC_VERSIONS = [
  { id: "1.8.9", label: "1.8.9", format: 1, range: false },
  { id: "1.12.2", label: "1.12.2", format: 3, range: false },
  { id: "1.16.5", label: "1.16.5", format: 6, range: false },
  { id: "1.18.2", label: "1.18.2", format: 8, range: false },
  { id: "1.19.4", label: "1.19.4", format: 13, range: false },
  { id: "1.20.1", label: "1.20.1", format: 15, range: false },
  { id: "1.20.4", label: "1.20.4", format: 22, range: false },
  { id: "1.20.6", label: "1.20.6", format: 32, range: false },
  { id: "1.21.1", label: "1.21.1", format: 34, range: false },
  { id: "1.21.4", label: "1.21.4", format: 46, range: false },
  { id: "1.21.8", label: "1.21.8", format: 64, range: false },
  { id: "1.21.10", label: "1.21.10", format: 69, range: true },
  { id: "1.21.11", label: "1.21.11", format: 75, range: true },
  { id: "26.1", label: "26.1", format: 84, range: true },
  { id: "26.2", label: "26.2", format: 88, range: true },
] as const;
export type McVersionId = (typeof MC_VERSIONS)[number]["id"];

/** Items commonly retextured into custom staffs by Skyblock-style packs. */
export const VANILLA_TARGETS = [
  { id: "blaze_rod", label: "ブレイズロッド" },
  { id: "stick", label: "棒" },
  { id: "breeze_rod", label: "ブリーズロッド" },
  { id: "warped_fungus_on_a_stick", label: "歪んだキノコ棒" },
  { id: "carrot_on_a_stick", label: "ニンジン付きの棒" },
  { id: "bone", label: "骨" },
  { id: "golden_hoe", label: "金のクワ" },
  { id: "netherite_hoe", label: "ネザライトのクワ" },
] as const;

export type PackTarget = "vanilla" | "cit" | "custom";
export type PackOptions = {
  version: McVersionId;
  target: PackTarget;
  itemId: string;
  namespace: string;
  customModelData: number;
  emissive: boolean;
  lang: boolean;
  model: boolean;
  interpolate: boolean;
  description?: string;
};

export type ServerPackItem = {
  config: Config;
  itemId: string;
  customModelData: number;
  textureId: string;
  evolutionStage?: number;
};

const json = (value: unknown) => new TextEncoder().encode(JSON.stringify(value, null, 2));
const text = (value: string) => new TextEncoder().encode(value);

/** Decode a canvas PNG data URL straight into raw bytes without an async round-trip. */
function canvasBytes(canvas: HTMLCanvasElement): Uint8Array {
  const base64 = canvas.toDataURL("image/png").split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Textures folder for an item across Vanilla override, CIT Resewn/OptiFine, and Mod namespaces. */
function itemTextureFolder(version: McVersionId) {
  const format = MC_VERSIONS.find((v) => v.id === version)?.format ?? 34;
  return format <= 3 ? "items" : "item";
}

function textureDir(target: PackTarget, namespace: string, version: McVersionId) {
  const safeNamespace = safeAssetId(namespace);
  if (target === "cit") return `assets/minecraft/optifine/cit/${safeNamespace}`;
  const itemFolder = itemTextureFolder(version);
  return target === "custom" ? `assets/${safeNamespace}/textures/${itemFolder}` : `assets/minecraft/textures/${itemFolder}`;
}

export function buildPackMcmeta(cfg: Config, options: PackOptions) {
  const version = MC_VERSIONS.find((v) => v.id === options.version) ?? MC_VERSIONS[8];
  const description = options.description?.trim() || `Spellforge · ${cfg.name}`;
  const pack: Record<string, unknown> = {
    pack_format: version.format,
    description: `§d${description}\n§7${cfg.rarity.toUpperCase()} · ${cfg.size}px`,
  };
  if (version.range) {
    pack.min_format = version.format;
    pack.max_format = version.format + 24;
  }
  return { pack };
}

export function buildGiveCommand(cfg: Config, options: PackOptions): string {
  const item = options.target === "custom" ? `${safeAssetId(options.namespace)}:${safeAssetId(options.itemId)}` : `minecraft:${safeAssetId(options.itemId || "blaze_rod")}`;
  const rarColor = RARITIES[cfg.rarity].color;
  const safeName = (cfg.name || "Mystic Staff").replace(/"/g, '\\"');
  const cmdNum = Math.max(1, Math.round(options.customModelData || 1001));
  const version = MC_VERSIONS.find((v) => v.id === options.version) ?? MC_VERSIONS[8];
  // 1.21.4+ reads the first float in custom_model_data for range dispatch.
  if (version.format >= 46) {
    return `/give @p ${item}[minecraft:custom_name='{"text":"${safeName}","color":"${rarColor}","italic":false}',minecraft:custom_model_data={floats:[${cmdNum}.0]}] 1`;
  }
  // 1.20.5-1.21.3 uses an integer component.
  if (version.format >= 32) {
    return `/give @p ${item}[minecraft:custom_name='{"text":"${safeName}","color":"${rarColor}","italic":false}',minecraft:custom_model_data=${cmdNum}] 1`;
  }
  return `/give @p ${item}{CustomModelData:${cmdNum},display:{Name:'{"text":"${safeName}","color":"${rarColor}","italic":false}'}} 1`;
}

export function packFileList(options: PackOptions, cfg: Config) {
  const dir = textureDir(options.target, options.namespace, options.version);
  const name = options.target === "cit" ? `${cfg.type}_${cfg.element}` : safeAssetId(options.itemId);
  const namespace = safeAssetId(options.namespace);
  const files: string[] = ["pack.mcmeta", "pack.png"];
  files.push(`${dir}/${name}.png`);
  if (cfg.frames > 1) files.push(`${dir}/${name}.png.mcmeta`);
  if (options.emissive) {
    files.push(`${dir}/${name}_e.png`);
    if (cfg.frames > 1) files.push(`${dir}/${name}_e.png.mcmeta`);
    files.push("assets/minecraft/optifine/emissive.properties");
  }
  if (options.target === "cit") {
    files.push(`${dir}/${name}.properties`);
  }
  if (options.target === "custom" && options.lang) {
    files.push(`assets/${namespace}/lang/en_us.json`, `assets/${namespace}/lang/ja_jp.json`);
  }
  if (options.model) {
    if (options.target === "custom") {
      files.push(`assets/${namespace}/models/item/${name}.json`);
      if ((MC_VERSIONS.find((v) => v.id === options.version)?.format ?? 0) >= 46) files.push(`assets/${namespace}/items/${name}.json`);
    } else if (options.target === "vanilla") {
      files.push(`assets/minecraft/models/item/${name}.json`);
    }
  }
  return files;
}

function renderTextureBytes(cfg: Config, mode: "normal" | "emissive"): Uint8Array {
  if (cfg.frames > 1) {
    const sheet = document.createElement("canvas");
    sheet.width = cfg.size;
    sheet.height = cfg.size * cfg.frames;
    const context = sheet.getContext("2d")!;
    context.imageSmoothingEnabled = false;
    for (let frame = 0; frame < cfg.frames; frame++) {
      context.drawImage(frameToCanvas(renderFrame(cfg, frame, mode), 1), 0, frame * cfg.size);
    }
    return canvasBytes(sheet);
  }
  return canvasBytes(frameToCanvas(renderFrame(cfg, 0, mode), 1));
}

export async function buildResourcePack(cfg: Config, options: PackOptions): Promise<Blob> {
  const dir = textureDir(options.target, options.namespace, options.version);
  const name = options.target === "cit" ? `${cfg.type}_${cfg.element}` : safeAssetId(options.itemId);
  const namespace = safeAssetId(options.namespace);
  const textureFolder = itemTextureFolder(options.version);
  const entries: ZipEntry[] = [];

  entries.push({ path: "pack.mcmeta", data: json(buildPackMcmeta(cfg, options)) });
  // Pack icon (64x64 preview of frame 0)
  entries.push({ path: "pack.png", data: canvasBytes(frameToCanvas(renderFrame({ ...cfg, size: 64, frames: 1 }, 0), 1)) });

  entries.push({ path: `${dir}/${name}.png`, data: renderTextureBytes(cfg, "normal") });
  if (cfg.frames > 1) {
    entries.push({
      path: `${dir}/${name}.png.mcmeta`,
      data: json({ animation: { frametime: cfg.frametime, interpolate: options.interpolate } }),
    });
  }

  if (options.emissive) {
    entries.push({ path: `${dir}/${name}_e.png`, data: renderTextureBytes(cfg, "emissive") });
    if (cfg.frames > 1) {
      entries.push({
        path: `${dir}/${name}_e.png.mcmeta`,
        data: json({ animation: { frametime: cfg.frametime, interpolate: options.interpolate } }),
      });
    }
    entries.push({ path: "assets/minecraft/optifine/emissive.properties", data: text("suffix.emissive=_e\n") });
  }

  if (options.target === "cit") {
    const citProps = [
      "type=item",
      `items=minecraft:${safeAssetId(options.itemId || "blaze_rod")}`,
      `texture=${name}.png`,
      `nbt.display.Name=ipattern:*${cfg.name || name}*`,
    ].join("\n") + "\n";
    entries.push({ path: `${dir}/${name}.properties`, data: text(citProps) });
  }

  const handheldDisplay = {
    thirdperson_righthand: { rotation: [0, -90, 55], translation: [0, 4.0, 0.5], scale: [1.15, 1.15, 0.85] },
    thirdperson_lefthand: { rotation: [0, 90, -55], translation: [0, 4.0, 0.5], scale: [1.15, 1.15, 0.85] },
    firstperson_righthand: { rotation: [0, -90, 25], translation: [1.13, 3.2, 1.13], scale: [0.95, 0.95, 0.68] },
    firstperson_lefthand: { rotation: [0, 90, -25], translation: [1.13, 3.2, 1.13], scale: [0.95, 0.95, 0.68] },
  };

  if (options.target === "custom") {
    if (options.lang) {
      const key = `item.${namespace}.${name}`;
      entries.push({ path: `assets/${namespace}/lang/en_us.json`, data: json({ [key]: cfg.name }) });
      entries.push({ path: `assets/${namespace}/lang/ja_jp.json`, data: json({ [key]: cfg.name }) });
    }
    if (options.model) {
      entries.push({
        path: `assets/${namespace}/models/item/${name}.json`,
        data: json({
          parent: "minecraft:item/handheld",
          textures: { layer0: `${namespace}:${textureFolder}/${name}` },
          display: handheldDisplay,
        }),
      });
      if ((MC_VERSIONS.find((v) => v.id === options.version)?.format ?? 0) >= 46) {
        entries.push({
          path: `assets/${namespace}/items/${name}.json`,
          data: json({ model: { type: "minecraft:model", model: `${namespace}:item/${name}` } }),
        });
      }
    }
  } else if (options.target === "vanilla" && options.model) {
    entries.push({
      path: `assets/minecraft/models/item/${name}.json`,
      data: json({
        parent: "minecraft:item/handheld",
        textures: { layer0: `minecraft:${textureFolder}/${name}` },
        display: handheldDisplay,
      }),
    });
  }

  return buildZip(entries);
}

function safeAssetId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, "_").replace(/^_+|_+$/g, "") || "relic";
}

export function validateServerCollection(items: ServerPackItem[]) {
  const errors: string[] = [];
  const textureIds = new Set<string>();
  const commands = new Set<string>();
  for (const [index, item] of items.entries()) {
    const textureId = safeAssetId(item.textureId);
    const commandKey = `${safeAssetId(item.itemId)}:${item.customModelData}`;
    if (textureIds.has(textureId)) errors.push(`${index + 1}番: texture ID「${textureId}」が重複しています`);
    if (commands.has(commandKey)) errors.push(`${index + 1}番: ${commandKey} のCustomModelDataが重複しています`);
    if (!Number.isSafeInteger(item.customModelData) || item.customModelData < 1) errors.push(`${index + 1}番: CustomModelDataは1以上の整数にしてください`);
    textureIds.add(textureId);
    commands.add(commandKey);
  }
  return errors;
}

/** Pure model definitions for a server pack: suitable for validating without canvas. */
export function buildServerModelEntries(items: ServerPackItem[], options: PackOptions): ZipEntry[] {
  const namespace = safeAssetId(options.namespace || "spellforge_server");
  const format = MC_VERSIONS.find((version) => version.id === options.version)?.format ?? 34;
  const textureFolder = itemTextureFolder(options.version);
  const groups = new Map<string, ServerPackItem[]>();
  for (const item of items) {
    const base = safeAssetId(item.itemId || "blaze_rod");
    groups.set(base, [...(groups.get(base) ?? []), item]);
  }

  const entries: ZipEntry[] = [];
  for (const [base, members] of groups) {
    const sorted = [...members].sort((a, b) => a.customModelData - b.customModelData);
    const ids = new Set<number>();
    for (const member of sorted) {
      if (!Number.isInteger(member.customModelData) || member.customModelData < 1 || ids.has(member.customModelData)) {
        throw new Error(`${base}: CustomModelData must be a unique positive integer`);
      }
      ids.add(member.customModelData);
      const id = safeAssetId(member.textureId);
      const displayScale = member.evolutionStage === undefined ? 1.15 : 0.9 + Math.max(0, Math.min(3, member.evolutionStage)) * 0.14;
      entries.push({
        path: `assets/${namespace}/models/item/${id}.json`,
        data: json({
          parent: "minecraft:item/handheld",
          textures: { layer0: `${namespace}:${textureFolder}/${id}` },
          display: {
            firstperson_righthand: { rotation: [-17, -90, 9], translation: [6, 2.25, -4.75], scale: [1.25, 1.25, 1] },
            firstperson_lefthand: { rotation: [-17, 90, -9], translation: [6, 2.25, -4.75], scale: [1.25, 1.25, 1] },
            thirdperson_righthand: { rotation: [0, -90, 55], translation: [0, 4, 0.5], scale: [displayScale, displayScale, 1] },
            ground: { rotation: [0, 0, 0], translation: [0, 2, 0], scale: [displayScale, displayScale, 1] },
            gui: { scale: [1, 1, 1] },
          },
        }),
      });
    }

    // Life-style legacy handheld override lists keep the unmodified item as fallback.
    if (format < 46) {
      entries.push({
        path: `assets/minecraft/models/item/${base}.json`,
        data: json({
          parent: "minecraft:item/handheld",
          textures: { layer0: `minecraft:${textureFolder}/${base}` },
          overrides: sorted.map((member) => ({
            predicate: { custom_model_data: member.customModelData },
            model: `${namespace}:item/${safeAssetId(member.textureId)}`,
          })),
        }),
      });
    } else {
      // 1.21.4+ item definitions dispatch on the first custom_model_data float.
      entries.push({
        path: `assets/minecraft/items/${base}.json`,
        data: json({
          model: {
            type: "minecraft:range_dispatch",
            property: "minecraft:custom_model_data",
            entries: sorted.map((member) => ({
              threshold: member.customModelData,
              model: { type: "minecraft:model", model: `${namespace}:item/${safeAssetId(member.textureId)}` },
            })),
            fallback: { type: "minecraft:model", model: `minecraft:item/${base}` },
          },
        }),
      });
    }
  }
  return entries;
}

/**
 * Build a server-scale pack containing many unique MMO items. Each item receives its own CIT
 * rule and texture, while sharing one pack.mcmeta, one emissive declaration, and one pack icon.
 * This mirrors the organization used by large multiplayer resource packs.
 */
export async function buildServerCollectionPack(items: ServerPackItem[], options: PackOptions): Promise<Blob> {
  if (!items.length) throw new Error("At least one server item is required");
  const errors = validateServerCollection(items);
  if (errors.length) throw new Error(errors.join(" / "));
  const namespace = safeAssetId(options.namespace || "spellforge_server");
  const useCit = options.target === "cit";
  const entries: ZipEntry[] = [];
  entries.push({
    path: "pack.mcmeta",
    data: json(buildPackMcmeta(items[0].config, { ...options, description: options.description || `Spellforge Server Collection · ${items.length} items` })),
  });
  entries.push({ path: "pack.png", data: canvasBytes(frameToCanvas(renderFrame({ ...items[0].config, size: 64, frames: 1 }, 0), 1)) });
  if (options.emissive) entries.push({ path: "assets/minecraft/optifine/emissive.properties", data: text("suffix.emissive=_e\n") });

  if (!useCit) entries.push(...buildServerModelEntries(items, options));

  const manifestItems: unknown[] = [];
  for (const [index, item] of items.entries()) {
    const textureId = safeAssetId(item.textureId || `relic_${index + 1}`);
    const folder = useCit ? `assets/minecraft/optifine/cit/${namespace}/${textureId}` : `assets/${namespace}/textures/${itemTextureFolder(options.version)}`;
    const cfg = item.config;
    entries.push({ path: `${folder}/${textureId}.png`, data: renderTextureBytes(cfg, "normal") });
    if (cfg.frames > 1) {
      entries.push({ path: `${folder}/${textureId}.png.mcmeta`, data: json({ animation: { frametime: cfg.frametime, interpolate: options.interpolate } }) });
    }
    if (options.emissive) {
      entries.push({ path: `${folder}/${textureId}_e.png`, data: renderTextureBytes(cfg, "emissive") });
      if (cfg.frames > 1) entries.push({ path: `${folder}/${textureId}_e.png.mcmeta`, data: json({ animation: { frametime: cfg.frametime, interpolate: options.interpolate } }) });
    }
    if (useCit) {
      const properties = [
        "type=item",
        `items=minecraft:${safeAssetId(item.itemId || "blaze_rod")}`,
        `texture=${textureId}.png`,
        `nbt.display.Name=ipattern:*${cfg.name || textureId}*`,
        `weight=${1000 - index}`,
      ].join("\n") + "\n";
      entries.push({ path: `${folder}/${textureId}.properties`, data: text(properties) });
    }
    manifestItems.push({
      texture_id: textureId,
      display_name: cfg.name,
      base_item: item.itemId,
      custom_model_data: item.customModelData,
      rarity: cfg.rarity,
      element: cfg.element,
      type: cfg.type,
      evolution_stage: item.evolutionStage ?? null,
      give_command: buildGiveCommand(cfg, { ...options, itemId: item.itemId, customModelData: item.customModelData }),
    });
    // Large animated collections can take seconds; yield so the progress state remains visible.
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  }

  entries.push({ path: `spellforge_${namespace}_manifest.json`, data: json({ namespace, generated_at: new Date().toISOString(), items: manifestItems }) });
  entries.push({
    path: "README.txt",
    data: text([
      `Spellforge Server Collection: ${namespace}`,
      `${items.length} custom items`,
      "",
      useCit ? "OptiFine / CIT Resewn name-based matching. Requires a compatible client." : "Vanilla CustomModelData model overrides. No client mod required.",
      "Server operators can use the commands in the manifest JSON to distribute each item.",
      "For server-pushed packs, host this ZIP and set resource-pack / resource-pack-sha1 in server.properties.",
    ].join("\n")),
  });
  return buildZip(entries);
}
