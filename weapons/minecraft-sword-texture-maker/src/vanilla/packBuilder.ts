/**
 * Minecraft Resource Pack builder.
 *
 * Generates a complete, drop-in resource pack containing:
 *  - pack.mcmeta with the correct pack_format for the target version
 *  - item textures under assets/minecraft/textures/item/
 *  - item model JSON (legacy overrides + modern 1.21.4 range_dispatch)
 *  - OptiFine / CIT Resewn .properties files for custom-named items
 *  - optional .mcmeta animation metadata
 *  - both pure-vanilla 16x16 items AND procedural studio weapons
 */

import { renderSword } from "../engine/render";
import type { SwordOptions } from "../engine/types";
import { canvasToPngBytes, createZip, downloadBlob, utf8, type ZipEntry } from "../utils/zip";
import { type TierPalette } from "./renderer";
import { renderVanillaLike, type VanillaPlusOptions, type VanillaRenderMode } from "./vanillaPlus";
import {
  WEAPON_DEFS,
  vanillaItemId,
  vanillaTexturePath,
  type WeaponDef,
} from "./pixmaps";

// ─── Minecraft version → pack_format ────────────────────────────────
export interface McVersion {
  id: string;
  label: string;
  packFormat: number;
  /** 1.21.4+ uses item model definitions instead of overrides */
  modernModels: boolean;
}

export const MC_VERSIONS: McVersion[] = [
  { id: "1.16", label: "1.16.x", packFormat: 6, modernModels: false },
  { id: "1.17", label: "1.17.x", packFormat: 7, modernModels: false },
  { id: "1.18", label: "1.18.x", packFormat: 8, modernModels: false },
  { id: "1.19", label: "1.19.x", packFormat: 9, modernModels: false },
  { id: "1.19.4", label: "1.19.4", packFormat: 13, modernModels: false },
  { id: "1.20.1", label: "1.20.1", packFormat: 15, modernModels: false },
  { id: "1.20.4", label: "1.20.4", packFormat: 22, modernModels: false },
  { id: "1.20.6", label: "1.20.6", packFormat: 32, modernModels: false },
  { id: "1.21", label: "1.21.x", packFormat: 34, modernModels: false },
  { id: "1.21.4", label: "1.21.4+", packFormat: 46, modernModels: true },
];

// ─── Pack contents description ──────────────────────────────────────
export interface PackEntry {
  /** weapon definition */
  weapon: WeaponDef;
  /** palette to render with */
  palette: TierPalette;
  /** tier key, used for file naming */
  tierKey: string;
  /** if set, generate a CIT property matching this display name */
  citName?: string;
  /** if set, generate a custom_model_data override with this value */
  customModelData?: number;
}

/** A procedural studio weapon bundled into the resource pack */
export interface StudioPackEntry {
  slug: string;
  displayName: string;
  baseItem: string;
  options: SwordOptions;
  citName?: string;
  customModelData?: number;
}

export type VanillaPackStyle = VanillaRenderMode;

export interface PackOptions {
  packName: string;
  description: string;
  version: McVersion;
  size: number;
  /** replace the vanilla textures directly (true) or only as custom items (false) */
  replaceVanilla: boolean;
  /** emit OptiFine / CIT Resewn .properties */
  emitCit: boolean;
  /** emit item model JSON with custom_model_data overrides */
  emitModels: boolean;
  /** vanilla-family render style for the bundled vanilla items */
  style?: VanillaPackStyle;
  /** Vanilla+ tuning (only used when style is "vanilla_plus") */
  plusOptions?: VanillaPlusOptions;
}

// ─── Individual file generators ─────────────────────────────────────

export function makePackMcmeta(opts: PackOptions): string {
  return JSON.stringify(
    {
      pack: {
        pack_format: opts.version.packFormat,
        description: opts.description,
      },
    },
    null,
    2
  );
}

/** Which model parent a vanilla item uses */
function modelParent(weaponId: string): string {
  // Tools and weapons are "handheld" so they angle correctly in hand
  const handheld = [
    "sword", "dagger", "axe", "pickaxe", "shovel", "hoe",
    "trident", "mace", "netherite_sword",
  ];
  if (handheld.includes(weaponId)) return "minecraft:item/handheld";
  if (weaponId === "fishing_rod") return "minecraft:item/handheld_rod";
  return "minecraft:item/generated";
}

/**
 * Legacy item model with custom_model_data overrides (1.14 – 1.21.3).
 * Placed at assets/minecraft/models/item/<base>.json
 */
export function makeLegacyModel(
  baseItem: string,
  weaponId: string,
  overrides: { cmd: number; modelPath: string }[]
): string {
  return JSON.stringify(
    {
      parent: modelParent(weaponId),
      textures: { layer0: `minecraft:item/${baseItem}` },
      overrides: overrides
        .sort((a, b) => a.cmd - b.cmd)
        .map((o) => ({
          predicate: { custom_model_data: o.cmd },
          model: o.modelPath,
        })),
    },
    null,
    2
  );
}

/**
 * Modern item model definition (1.21.4+) using range_dispatch.
 * Placed at assets/minecraft/items/<base>.json
 */
export function makeModernModel(
  baseItem: string,
  entries: { threshold: number; model: string }[]
): string {
  return JSON.stringify(
    {
      model: {
        type: "range_dispatch",
        property: "custom_model_data",
        fallback: { type: "model", model: `minecraft:item/${baseItem}` },
        entries: entries
          .sort((a, b) => a.threshold - b.threshold)
          .map((e) => ({
            threshold: e.threshold,
            model: { type: "model", model: e.model },
          })),
      },
    },
    null,
    2
  );
}

/** A leaf model that just points at a texture */
export function makeLeafModel(weaponId: string, texturePath: string): string {
  return JSON.stringify(
    {
      parent: modelParent(weaponId),
      textures: { layer0: texturePath },
    },
    null,
    2
  );
}

/**
 * OptiFine / CIT Resewn properties file.
 * Matched by the item's display name.
 */
export function makeCitProperties(
  baseItem: string,
  displayName: string,
  textureFile: string,
  modelFile?: string
): string {
  const lines = [
    `# Generated by AegisBlade Studio`,
    `type=item`,
    `items=minecraft:${baseItem}`,
    `texture=${textureFile}`,
  ];
  if (modelFile) lines.push(`model=${modelFile}`);
  lines.push(`nbt.display.Name=ipattern:*${displayName}*`);
  return lines.join("\n") + "\n";
}

/** Animation metadata for a vertically stacked sprite sheet */
export function makeAnimationMcmeta(frameTime: number, frames: number): string {
  return JSON.stringify(
    {
      animation: {
        frametime: frameTime,
        frames: Array.from({ length: frames }, (_, i) => i),
      },
    },
    null,
    2
  );
}

// ─── Full pack assembly ─────────────────────────────────────────────

export type PackFile = ZipEntry;

function renderVanillaToPng(
  weapon: WeaponDef,
  palette: TierPalette,
  size: number,
  style: VanillaPackStyle = "vanilla",
  plus?: VanillaPlusOptions
): Uint8Array {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  renderVanillaLike(c.getContext("2d")!, weapon.map, palette, size, style, plus);
  return canvasToPngBytes(c);
}

function renderStudioToPng(options: SwordOptions, size: number): Uint8Array {
  const c = document.createElement("canvas");
  renderSword(c, size === options.size ? options : { ...options, size }, 0);
  return canvasToPngBytes(c);
}

/**
 * Build the complete file list for a resource pack.
 */
export function buildPackFiles(
  entries: PackEntry[],
  opts: PackOptions,
  studioEntries: StudioPackEntry[] = []
): PackFile[] {
  const files: PackFile[] = [];
  const modern = opts.version.modernModels;
  const seen = new Set<string>();

  const push = (path: string, data: Uint8Array) => {
    if (seen.has(path)) return; // ZIP must not contain duplicate paths
    seen.add(path);
    files.push({ path, data });
  };

  push("pack.mcmeta", utf8(makePackMcmeta(opts)));

  // Group overrides per base vanilla item so we can emit one model file each
  const overridesByItem = new Map<string, { cmd: number; modelPath: string; weaponId: string }[]>();
  const skippedVanilla: string[] = [];
  const vanillaOwners = new Map<string, string>();
  const collisions: string[] = [];

  const style: VanillaPackStyle = opts.style ?? "vanilla";
  for (const e of entries) {
    const png = renderVanillaToPng(e.weapon, e.palette, opts.size, style, opts.plusOptions);
    // keyed by weapon.id, not baseName: dagger and sword share the vanilla
    // base name "sword" and would otherwise overwrite each other
    const slug = `${e.tierKey}_${e.weapon.id}`;
    const itemId = vanillaItemId(e.weapon, e.tierKey);

    // ── Direct vanilla replacement ──
    if (opts.replaceVanilla) {
      const vpath = vanillaTexturePath(e.weapon, e.tierKey);
      if (vpath) {
        const owner = vanillaOwners.get(vpath);
        const who = `${e.tierKey} ${e.weapon.label}`;
        if (owner && owner !== who) {
          // two weapons want the same vanilla slot — only one can win
          collisions.push(`${vpath}.png  ←  ${owner}  /  ${who}`);
        } else {
          vanillaOwners.set(vpath, who);
          push(`assets/minecraft/textures/item/${vpath}.png`, png);
        }
      } else {
        skippedVanilla.push(`${e.tierKey} ${e.weapon.label}`);
      }
    }

    // Custom copy always available for models / CIT
    push(`assets/minecraft/textures/item/aegis/${slug}.png`, png);

    // ── CustomModelData models ──
    if (opts.emitModels && e.customModelData) {
      const leafPath = `minecraft:item/aegis/${slug}`;
      push(
        `assets/minecraft/models/item/aegis/${slug}.json`,
        utf8(makeLeafModel(e.weapon.id, `minecraft:item/aegis/${slug}`))
      );
      const list = overridesByItem.get(itemId) ?? [];
      list.push({ cmd: e.customModelData, modelPath: leafPath, weaponId: e.weapon.id });
      overridesByItem.set(itemId, list);
    }

    // ── OptiFine / CIT Resewn ──
    if (opts.emitCit && e.citName) {
      const props = utf8(makeCitProperties(itemId, e.citName, `${slug}.png`));
      push(`assets/minecraft/optifine/cit/aegis/${slug}.png`, png);
      push(`assets/minecraft/optifine/cit/aegis/${slug}.properties`, props);
      push(`assets/minecraft/citresewn/cit/aegis/${slug}.png`, png);
      push(`assets/minecraft/citresewn/cit/aegis/${slug}.properties`, props);
    }
  }

  // ── Procedural studio weapons (serverpack / custom items) ──
  for (const s of studioEntries) {
    const png = renderStudioToPng(s.options, opts.size);
    const slug = `studio_${s.slug}`;
    const itemId = s.baseItem;
    const weaponId = itemId === "bow" ? "bow" : "sword";

    push(`assets/minecraft/textures/item/aegis/${slug}.png`, png);

    if (opts.emitModels && s.customModelData) {
      const leafPath = `minecraft:item/aegis/${slug}`;
      push(
        `assets/minecraft/models/item/aegis/${slug}.json`,
        utf8(makeLeafModel(weaponId, `minecraft:item/aegis/${slug}`))
      );
      const list = overridesByItem.get(itemId) ?? [];
      list.push({ cmd: s.customModelData, modelPath: leafPath, weaponId });
      overridesByItem.set(itemId, list);
    }

    if (opts.emitCit && s.citName) {
      const props = utf8(makeCitProperties(itemId, s.citName, `${slug}.png`));
      push(`assets/minecraft/optifine/cit/aegis/${slug}.png`, png);
      push(`assets/minecraft/optifine/cit/aegis/${slug}.properties`, props);
      push(`assets/minecraft/citresewn/cit/aegis/${slug}.png`, png);
      push(`assets/minecraft/citresewn/cit/aegis/${slug}.properties`, props);
    }
  }

  // ── One dispatch model per base item ──
  if (opts.emitModels) {
    for (const [itemId, list] of overridesByItem) {
      const weaponId = list[0].weaponId;
      if (modern) {
        push(
          `assets/minecraft/items/${itemId}.json`,
          utf8(makeModernModel(itemId, list.map((l) => ({ threshold: l.cmd, model: l.modelPath }))))
        );
      } else {
        push(`assets/minecraft/models/item/${itemId}.json`, utf8(makeLegacyModel(itemId, weaponId, list)));
      }
    }
  }

  push("README.txt", utf8(makeReadme(entries, studioEntries, opts, skippedVanilla, collisions)));
  return files;
}

function makeReadme(
  entries: PackEntry[],
  studioEntries: StudioPackEntry[],
  opts: PackOptions,
  skippedVanilla: string[] = [],
  collisions: string[] = []
): string {
  const totalCount = entries.length + studioEntries.length;
  const lines = [
    `${opts.packName}`,
    `${"=".repeat(opts.packName.length)}`,
    ``,
    `Generated by AegisBlade Studio — Resource Pack Builder`,
    `Target: Minecraft ${opts.version.label} (pack_format ${opts.version.packFormat})`,
    `Texture resolution: ${opts.size}x${opts.size}`,
    `Vanilla style: ${opts.style === "vanilla_plus" ? "Vanilla+ (enhanced shading, identical silhouettes)" : "Pure vanilla (pixel-exact)"}`,
    ``,
    `INSTALL`,
    `-------`,
    `1. Drop this .zip into  .minecraft/resourcepacks/`,
    `2. Enable it in  Options > Resource Packs`,
    ``,
    `CONTENTS (${totalCount} textures)`,
    `--------`,
  ];

  for (const e of entries) {
    const vpath = vanillaTexturePath(e.weapon, e.tierKey);
    const bits: string[] = [
      opts.replaceVanilla && vpath
        ? `${vpath}.png`
        : `aegis/${e.tierKey}_${e.weapon.id}.png`,
    ];
    if (e.customModelData) {
      bits.push(`${vanillaItemId(e.weapon, e.tierKey)} CMD=${e.customModelData}`);
    }
    if (e.citName) bits.push(`CIT "${e.citName}"`);
    lines.push(`  - ${bits.join("  |  ")}`);
  }

  if (studioEntries.length > 0) {
    lines.push(``, `STUDIO / SERVER ITEMS (${studioEntries.length})`, `---------------------`);
    for (const s of studioEntries) {
      const bits: string[] = [`aegis/studio_${s.slug}.png`, `base=${s.baseItem}`];
      if (s.customModelData) bits.push(`CMD=${s.customModelData}`);
      if (s.citName) bits.push(`CIT "${s.citName}"`);
      lines.push(`  - ${bits.join("  |  ")}`);
    }
  }

  if (collisions.length) {
    lines.push(
      ``,
      `WARNING — vanilla slot collision`,
      `--------------------------------`,
      `Two selected weapons map to the same vanilla texture, so only the first`,
      `one was written. Deselect one of them, or turn off "vanilla replacement"`,
      `and ship them as CustomModelData / CIT items instead:`,
      ...[...new Set(collisions)].map((c) => `  - ${c}`)
    );
  }

  if (skippedVanilla.length) {
    lines.push(
      ``,
      `NOTE — no vanilla slot for these combinations`,
      `---------------------------------------------`,
      `Minecraft has no default texture for them, so they were shipped`,
      `only as custom items (enable CustomModelData or CIT to use them):`,
      ...[...new Set(skippedVanilla)].map((s) => `  - ${s}`)
    );
  }

  if (opts.emitModels) {
    lines.push(
      ``,
      `CUSTOM MODEL DATA USAGE`,
      `-----------------------`,
      opts.version.modernModels
        ? `/give @s minecraft:<item>[custom_model_data={floats:[<N>]}]`
        : `1.20.5+ :  /give @s minecraft:<item>[custom_model_data=<N>]`,
      opts.version.modernModels ? `` : `Older   :  /give @s minecraft:<item>{CustomModelData:<N>}`
    );
  }

  if (opts.emitCit) {
    lines.push(
      ``,
      `OPTIFINE / CIT RESEWN`,
      `---------------------`,
      `Rename the base item in an anvil to the listed CIT name and the`,
      `texture will swap automatically. Requires OptiFine or CIT Resewn.`
    );
  }

  if (opts.replaceVanilla) {
    lines.push(
      ``,
      `VANILLA REPLACEMENT`,
      `-------------------`,
      `This pack overwrites the default item textures directly.`
    );
  }

  return lines.join("\n") + "\n";
}

export const zipFiles = createZip;

/** Convenience: build + download in one call */
export function downloadPack(
  entries: PackEntry[],
  opts: PackOptions,
  studioEntries: StudioPackEntry[] = []
) {
  const files = buildPackFiles(entries, opts, studioEntries);
  const blob = createZip(files);
  downloadBlob(blob, `${opts.packName.replace(/[^a-z0-9_\-]/gi, "_")}.zip`);
  return files.length;
}

/** Every weapon × every selected tier */
export function allCombinations(
  palettes: Record<string, TierPalette>,
  tierKeys: string[],
  weaponIds?: string[]
): Omit<PackEntry, "citName" | "customModelData">[] {
  const weapons = weaponIds
    ? WEAPON_DEFS.filter((w) => weaponIds.includes(w.id))
    : WEAPON_DEFS;
  const out: Omit<PackEntry, "citName" | "customModelData">[] = [];
  for (const tk of tierKeys) {
    for (const w of weapons) {
      out.push({ weapon: w, palette: palettes[tk], tierKey: tk });
    }
  }
  return out;
}
