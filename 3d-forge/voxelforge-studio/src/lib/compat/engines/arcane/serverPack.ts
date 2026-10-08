/* ══════════════════════════════════════════════════════════════════════════
   Multiplayer server resource pack assembler.

   A curated *collection* of designs is merged into ONE pack: every entry keeps
   its own texture + model, while entries that share a vanilla base item are
   merged into a single dispatcher so several customs can coexist on one item.
   That is exactly how server packs (Lifesteal / SMP / minigame hubs) ship.
   ══════════════════════════════════════════════════════════════════════════ */
import JSZip from 'jszip';
import type { StaffConfig } from './types';
import { buildMcmeta } from './render';
import type { MinecraftPackTarget } from './minecraftPack';
import {
  VANILLA_BASE_ITEMS, animatedPngDataUrl, packIconDataUrl, pngDataUrl, safeId, triggerDownload,
} from './minecraftPack';

export interface ServerPackEntry {
  cfg: StaffConfig;
  baseItem: string;
  cmd: number;
  /** optional in-game display name used by the CIT matcher and the give command */
  name?: string;
}

export interface ServerPackOptions {
  target: MinecraftPackTarget;
  packName: string;
  packDesc: string;
  entries: ServerPackEntry[];
  namespace?: string;
  /** azisaba-style: put textures under a custom folder wired up by a custom atlas */
  customFolder?: string;
  /** start CMD numbering here; the life pack uses small sequential values (2, 3, 4 …) */
  cmdStart?: number;
}

const parentOf = (baseId: string) =>
  VANILLA_BASE_ITEMS.find((b) => b.id === baseId)?.parent ?? 'minecraft:item/generated';

/** Human label for a design, used in README tables and give commands. */
export function entryLabel(cfg: StaffConfig, fallback?: string) {
  return (fallback && fallback.trim()) || `${cfg.rarity ?? 'arcane'} ${cfg.element} ${cfg.itemType}`;
}

export function slugFor(cfg: StaffConfig) {
  return safeId(`${cfg.itemType}_${cfg.element}_${cfg.rarity ?? 'arcane'}_${cfg.seed}`);
}

/** Validate a server collection: duplicate texture/cmd detection with Japanese messages. */
export function validateServerPack(entries: ServerPackEntry[]): string[] {
  const errors: string[] = [];
  const textureIds = new Set<string>();
  const commands = new Set<string>();
  entries.forEach((entry, index) => {
    const textureId = slugFor(entry.cfg);
    const commandKey = `${entry.baseItem}:${entry.cmd}`;
    if (textureIds.has(textureId)) errors.push(`${index + 1}件目: texture ID「${textureId}」が重複しています`);
    if (commands.has(commandKey)) errors.push(`${index + 1}件目: ${commandKey} のCustomModelDataが重複しています`);
    if (!Number.isSafeInteger(entry.cmd) || entry.cmd < 1) errors.push(`${index + 1}件目: CustomModelDataは1以上の整数にしてください`);
    textureIds.add(textureId);
    commands.add(commandKey);
  });
  return errors;
}

/** Machine-readable manifest of a server collection for server operators. */
export function buildCollectionManifest(entries: ServerPackEntry[], namespace: string) {
  return {
    namespace,
    generated_at: new Date().toISOString(),
    items: entries.map((e) => ({
      texture_id: slugFor(e.cfg),
      display_name: entryLabel(e.cfg, e.name),
      base_item: e.baseItem,
      custom_model_data: e.cmd,
      rarity: e.cfg.rarity ?? null,
      element: e.cfg.element,
      type: e.cfg.itemType,
      give_command: `/give @s minecraft:${e.baseItem}{CustomModelData:${e.cmd}} 1`,
    })),
  };
}

/** Assign a free, non-colliding CustomModelData per base item. */
/** Azisaba-style: small sequential IDs per base item starting at 2 (0/1 are vanilla-ish). */
export function autoAssignCmds(entries: ServerPackEntry[], startAt = 2): ServerPackEntry[] {
  const used = new Map<string, Set<number>>();
  return entries.map((e) => {
    const taken = used.get(e.baseItem) ?? new Set<number>();
    let cmd = e.cmd || startAt;
    while (taken.has(cmd)) cmd += 1;
    taken.add(cmd);
    used.set(e.baseItem, taken);
    return { ...e, cmd };
  });
}

/**
 * Build one merged dispatcher per base item.
 * Modern (1.21.4+): `range_dispatch` over custom_model_data floats — Minecraft
 * picks the last entry whose threshold is <= the value, so we sort ascending.
 * Legacy (≤1.20.4): classic `overrides` predicate list.
 */
function buildDispatchers(target: MinecraftPackTarget, entries: ServerPackEntry[], ns: string) {
  const byBase = new Map<string, ServerPackEntry[]>();
  for (const e of entries) {
    const list = byBase.get(e.baseItem) ?? [];
    list.push(e);
    byBase.set(e.baseItem, list);
  }

  const files = new Map<string, unknown>();
  for (const [base, list] of byBase) {
    const sorted = [...list].sort((a, b) => a.cmd - b.cmd);
    if (target === 'java-1.20.4') {
      files.set(`assets/minecraft/models/item/${base}.json`, {
        parent: parentOf(base),
        textures: { layer0: `minecraft:item/${base}` },
        overrides: sorted.map((e) => ({
          predicate: { custom_model_data: e.cmd },
          model: `${ns}:item/${slugFor(e.cfg)}`,
        })),
      });
    } else if (target === 'java-1.21.4') {
      files.set(`assets/minecraft/items/${base}.json`, {
        model: {
          type: 'minecraft:range_dispatch',
          property: 'minecraft:custom_model_data',
          index: 0,
          scale: 1,
          entries: sorted.map((e) => ({
            threshold: e.cmd,
            model: { type: 'minecraft:model', model: `${ns}:item/${slugFor(e.cfg)}` },
          })),
          fallback: { type: 'minecraft:model', model: `minecraft:item/${base}` },
        },
      });
    }
  }
  return files;
}

export async function downloadServerPack(opts: ServerPackOptions): Promise<{ count: number; bases: number }> {
  const ns = safeId(opts.namespace || 'arcane_forge');
  const target = opts.target;
  const isCit = target === 'optifine-cit';
  const entries = autoAssignCmds(opts.entries, opts.cmdStart ?? 2);
  const zip = new JSZip();
  /** azisaba trick: a custom atlas lets textures live in our own folder, so we never touch vanilla `item/`. */
  const folder = safeId(opts.customFolder || 'items');
  const texPath = (slug: string) => `${folder}/${slug}`;

  const packFormat = target === 'java-1.21.4' ? 46 : 22;
  zip.file('pack.mcmeta', JSON.stringify({
    pack: {
      pack_format: packFormat,
      description: [
        { text: opts.packName || 'Arcane Server Pack', color: 'gold', bold: true },
        { text: '\n', color: 'white' },
        { text: opts.packDesc || `${entries.length} custom items · Arcane Forge`, color: 'gray' },
      ],
    },
  }, null, 2));

  if (entries.length > 0) zip.file('pack.png', packIconDataUrl(entries[0].cfg).split(',')[1], { base64: true });

  const bases = new Set(entries.map((e) => e.baseItem));

  for (const e of entries) {
    const slug = slugFor(e.cfg);
    const animated = (e.cfg.animation?.type ?? 'none') !== 'none';
    const png = animated ? animatedPngDataUrl(e.cfg) : pngDataUrl(e.cfg);
    const label = entryLabel(e.cfg, e.name);

    if (isCit) {
      // OptiFine / CIT Resewn: match by anvil name and/or CustomModelData.
      const citDir = `assets/minecraft/optifine/cit/${slug}`;
      zip.file(`${citDir}.png`, png.split(',')[1], { base64: true });
      if (animated && e.cfg.animation?.mcmeta) {
        zip.file(`${citDir}.png.mcmeta`, JSON.stringify(buildMcmeta(e.cfg), null, 2));
      }
      zip.file(`${citDir}.properties`, [
        `# ${label}`,
        `type=item`,
        `items=${e.baseItem}`,
        `texture=${slug}`,
        `nbt.CustomModelData=${e.cmd}`,
        `nbt.display.Name=regex:(?i).*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '.*')}.*`,
      ].join('\n'));
      continue;
    }

    // Textures live in our own folder; the custom atlas below makes it resolvable.
    zip.file(`assets/${ns}/textures/${folder}/${slug}.png`, png.split(',')[1], { base64: true });
    if (animated && e.cfg.animation?.mcmeta) {
      zip.file(`assets/${ns}/textures/${folder}/${slug}.png.mcmeta`, JSON.stringify(buildMcmeta(e.cfg), null, 2));
    }
    zip.file(`assets/${ns}/models/item/${slug}.json`, JSON.stringify({
      parent: parentOf(e.baseItem),
      // `particle` mirrors layer0 so held/3D views pick the right colour.
      textures: { layer0: `${ns}:${texPath(slug)}`, particle: `${ns}:${texPath(slug)}` },
    }, null, 2));
    if (target === 'java-1.21.4') {
      zip.file(`assets/${ns}/items/${slug}.json`, JSON.stringify({
        model: { type: 'minecraft:model', model: `${ns}:item/${slug}` },
      }, null, 2));
    }
  }

  // Custom atlas: registers our folder as a sprite source (the azisaba technique).
  zip.file(`assets/${ns}/atlases/blocks.json`, JSON.stringify({
    sources: [{ type: 'directory', source: folder, prefix: `${folder}/` }],
  }, null, 2));

  if (!isCit) for (const [path, json] of buildDispatchers(target, entries, ns)) {
    zip.file(path, JSON.stringify(json, null, 2));
  }

  // commands + documentation
  const giveLines = entries.map((e) => {
    const label = entryLabel(e.cfg, e.name);
    const nameJson = `'{\"text\":\"${label}\",\"color\":\"gold\",\"italic\":false}'`;
    return target === 'java-1.20.4'
      ? `/give @s minecraft:${e.baseItem}{CustomModelData:${e.cmd},display:{Name:${nameJson}}} 1`
      : isCit
        ? `/give @s minecraft:${e.baseItem}{CustomModelData:${e.cmd},display:{Name:${nameJson}}} 1`
        : `/give @s minecraft:${e.baseItem}[minecraft:custom_model_data={floats:[${e.cmd}.0]},minecraft:custom_name=${nameJson}] 1`;
  });
  zip.file('commands.txt', [
    `# ${opts.packName || 'Arcane Server Pack'} — one command per custom item`,
    `# Target: ${target === 'java-1.21.4' ? 'Java 1.21.4+ (item definitions)' : target === 'java-1.20.4' ? 'Java 1.14–1.20.4 (legacy overrides)' : 'OptiFine / CIT Resewn'}`,
    '',
    ...giveLines,
  ].join('\n'));

  const table = entries.map((e) =>
    `| ${entryLabel(e.cfg, e.name)} | minecraft:${e.baseItem} | ${e.cmd} | ${e.cfg.resolution}px | ${(e.cfg.animation?.type ?? 'none')} |`);
  zip.file('README.txt', [
    `# ${opts.packName || 'Arcane Server Pack'}`,
    opts.packDesc || '',
    '',
    `Items      : ${entries.length}`,
    `Base items : ${bases.size} (${[...bases].join(', ')})`,
    `Target     : ${target}`,
    `Namespace  : ${isCit ? 'minecraft (OptiFine CIT)' : ns}`,
    '',
    '## Contents',
    '| Item | Base | CustomModelData | Res | Animation |',
    '| --- | --- | --- | --- | --- |',
    ...table,
    '',
    '## Install (players)',
    '1. Drop this ZIP into .minecraft/resourcepacks/ and enable it.',
    '2. Or let the server push it (server.properties: resource-pack=<url>, resource-pack-sha1=<hash>).',
    '',
    '## Install (server owners)',
    '1. Host this ZIP over HTTPS and compute its SHA-1.',
    '2. Set resource-pack, resource-pack-url and resource-pack-sha1 in server.properties.',
    '3. Give items with the commands in commands.txt, or set the same',
    `   CustomModelData values from your plugin (ItemsAdder / Oraxen / MMOItems).`,
    '',
    '## Merging with another pack',
    isCit
      ? 'CIT entries live in their own folders, so they stack with other CIT packs safely.'
      : `The dispatcher files under assets/minecraft/ replace the base item model. If another pack
   also overrides the same base item, merge the "entries"/"overrides" arrays by hand,
   or move these customs onto a less contested base item.`,
  ].join('\n'));

  zip.file(`arcane_${ns}_manifest.json`, JSON.stringify(buildCollectionManifest(entries, ns), null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `${safeId(opts.packName || 'arcane-server-pack')}_${target}_${entries.length}items.zip`);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return { count: entries.length, bases: bases.size };
}
