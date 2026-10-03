/* ══════════════════════════════════════════════════════════════════════════
   Minecraft Resource Pack & Mod Workspace Exporter
   Support:
   1. Modern Java Edition 1.21.4+ (Item Model Definitions + Float CMD)
   2. Legacy Java Edition 1.14 - 1.20.4 (Predicate Overrides + Int CMD)
   3. OptiFine / CIT Resewn / Multi-server Pack (cit/*.properties by NBT or Item Name)
   4. Mod Asset Template (Fabric / NeoForge / Forge / Quilt) with lang, item tags, model json & data generator templates
   ══════════════════════════════════════════════════════════════════════════ */
import JSZip from 'jszip';
import type { ItemType, StaffConfig } from './types';
import { renderAnimationFrames, renderPixels, buildMcmeta } from './render';

export type MinecraftPackTarget =
  | 'java-1.21.4'
  | 'java-1.20.4'
  | 'optifine-cit'
  | 'mod-fabric-neoforge';

export interface BaseItemProfile {
  id: string;
  label: string;
  parent: 'minecraft:item/generated' | 'minecraft:item/handheld';
}

export const VANILLA_BASE_ITEMS: BaseItemProfile[] = [
  { id: 'blaze_rod', label: 'ブレイズロッド (blaze_rod)', parent: 'minecraft:item/handheld' },
  { id: 'stick', label: '棒 (stick)', parent: 'minecraft:item/generated' },
  { id: 'carrot_on_a_stick', label: 'ニンジン付きの棒 (carrot_on_a_stick)', parent: 'minecraft:item/handheld' },
  { id: 'warped_fungus_on_a_stick', label: '歪んだキノコ付きの棒 (warped_fungus_on_a_stick)', parent: 'minecraft:item/handheld' },
  { id: 'fishing_rod', label: '釣竿 (fishing_rod)', parent: 'minecraft:item/handheld' },
  { id: 'trident', label: 'トライデント (trident)', parent: 'minecraft:item/handheld' },
  { id: 'netherite_sword', label: 'ネザライトの剣 (netherite_sword)', parent: 'minecraft:item/handheld' },
  { id: 'diamond_sword', label: 'ダイヤモンドの剣 (diamond_sword)', parent: 'minecraft:item/handheld' },
  { id: 'netherite_hoe', label: 'ネザライトのクワ (netherite_hoe)', parent: 'minecraft:item/handheld' },
  { id: 'book', label: '本 (book)', parent: 'minecraft:item/generated' },
  { id: 'amethyst_shard', label: 'アメジストの欠片 (amethyst_shard)', parent: 'minecraft:item/generated' },
  { id: 'heart_of_the_sea', label: '海洋の心 (heart_of_the_sea)', parent: 'minecraft:item/generated' },
  { id: 'bell', label: '鐘 (bell)', parent: 'minecraft:item/generated' },
  { id: 'nautilus_shell', label: 'オウムガイの殻 (nautilus_shell)', parent: 'minecraft:item/generated' },
  { id: 'nether_star', label: 'ネザースター (nether_star)', parent: 'minecraft:item/generated' },
  { id: 'mace', label: 'メイス (mace)', parent: 'minecraft:item/handheld' },
  { id: 'breeze_rod', label: 'ブリーズロッド (breeze_rod)', parent: 'minecraft:item/handheld' },
];

const SUGGESTED: Record<ItemType, string> = {
  staff: 'blaze_rod', rod: 'breeze_rod', wand: 'blaze_rod', scepter: 'blaze_rod', cane: 'stick',
  trident: 'trident', scythe: 'netherite_hoe', crosier: 'blaze_rod', grimoire: 'book',
  'focus-orb': 'heart_of_the_sea', censer: 'bell', bell: 'bell', talisman: 'amethyst_shard', spear: 'trident',
  'lantern-pole': 'stick', brush: 'stick', mace: 'netherite_hoe', 'chain-flail': 'netherite_hoe',
  relic: 'nether_star', signet: 'gold_nugget' as never, monolith: 'amethyst_shard', 'orb-solo': 'heart_of_the_sea',
  pennant: 'paper' as never, idol: 'totem_of_undying' as never, chime: 'bell',
};

export const suggestedBaseItem = (type: ItemType) => SUGGESTED[type] ?? 'blaze_rod';

export interface MinecraftPackOptions {
  target: MinecraftPackTarget;
  baseItem: string;
  customModelData: number;
  itemNameMatcher?: string;
  modId?: string;
}

export function safeId(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9_/-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

export function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export function pngDataUrl(cfg: StaffConfig): string {
  const { data, size } = renderPixels(cfg);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(data), size, size), 0, 0);
  return canvas.toDataURL('image/png');
}

export function animatedPngDataUrl(cfg: StaffConfig): string {
  const frames = renderAnimationFrames(cfg);
  const canvas = document.createElement('canvas');
  canvas.width = cfg.resolution;
  canvas.height = cfg.resolution * frames.length;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  frames.forEach((frame, i) => {
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = frame.width;
    frameCanvas.height = frame.height;
    frameCanvas.getContext('2d')!.putImageData(frame, 0, 0);
    ctx.drawImage(frameCanvas, 0, i * cfg.resolution);
  });
  return canvas.toDataURL('image/png');
}

export function packIconDataUrl(cfg: StaffConfig): string {
  const { data, size } = renderPixels(cfg);
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  
  // Background gradient for pack.png
  const grad = ctx.createLinearGradient(0, 0, 64, 64);
  grad.addColorStop(0, '#1a102f');
  grad.addColorStop(1, '#080511');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  // Inner border
  ctx.strokeStyle = '#eab30844';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 62, 62);

  const src = document.createElement('canvas');
  src.width = size;
  src.height = size;
  src.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(data), size, size), 0, 0);
  ctx.drawImage(src, 6, 6, 52, 52);

  return canvas.toDataURL('image/png');
}

export async function downloadMinecraftPack(cfg: StaffConfig, options: MinecraftPackOptions) {
  const profile = VANILLA_BASE_ITEMS.find((v) => v.id === options.baseItem) ?? VANILLA_BASE_ITEMS[0];
  const target = options.target;
  const cmd = Math.max(1, Math.floor(options.customModelData));
  const modId = safeId(options.modId || 'arcane_forge');
  const slug = safeId(`${cfg.itemType}_${cfg.element}_${cfg.rarity ?? 'arcane'}_${cfg.seed}`);
  const matchName = options.itemNameMatcher?.trim() || `${cfg.rarity ?? 'Magic'} ${cfg.element} ${cfg.itemType}`;
  const displayName = `${cfg.rarity ?? 'Arcane'} ${cfg.element} ${cfg.itemType}`;
  const animated = (cfg.animation?.type ?? 'none') !== 'none';
  const zip = new JSZip();

  // Generate main texture & pack icon
  const textureUrl = animated ? animatedPngDataUrl(cfg) : pngDataUrl(cfg);
  const textureBase64 = textureUrl.split(',')[1];
  const iconBase64 = packIconDataUrl(cfg).split(',')[1];

  if (target === 'optifine-cit') {
    // ═══════════════ OptiFine / CIT Resewn / Multi-Server Pack ═══════════════
    zip.file('pack.mcmeta', JSON.stringify({
      pack: {
        pack_format: 22,
        description: `§6${displayName} §7[OptiFine/CIT]\n§eArcane Forge Item Texture`,
      },
    }, null, 2));
    zip.file('pack.png', iconBase64, { base64: true });

    const citPath = `assets/minecraft/optifine/cit/${slug}`;
    zip.file(`${citPath}.png`, textureBase64, { base64: true });
    if (animated && cfg.animation?.mcmeta) {
      zip.file(`${citPath}.png.mcmeta`, JSON.stringify(buildMcmeta(cfg), null, 2));
    }

    // .properties specification
    const props = [
      `# OptiFine / CIT Resewn Custom Item Texture (CIT)`,
      `# Generated by Arcane Forge`,
      `type=item`,
      `items=${profile.id}`,
      `texture=${slug}`,
      `nbt.display.Name=regex:(?i).*${matchName.replace(/\s+/g, '.*')}.*`,
      `nbt.CustomModelData=${cmd}`,
      ``,
      `# How to get: Rename this item in an anvil to "${matchName}"`,
      `# or execute: /give @s minecraft:${profile.id}{display:{Name:'{"text":"${matchName}"}'},CustomModelData:${cmd}}`,
    ].join('\n');
    zip.file(`${citPath}.properties`, props);

    zip.file('give-command.txt', [
      `# Anvil renaming:`,
      `# Take a '${profile.id}' to an anvil and rename it to '${matchName}'`,
      ``,
      `# Give command (with display name and CMD tag):`,
      `/give @s minecraft:${profile.id}{display:{Name:'{"text":"${matchName}","color":"gold","italic":false}'},CustomModelData:${cmd}} 1`,
    ].join('\n'));

  } else if (target === 'mod-fabric-neoforge') {
    // ═══════════════ Fabric / NeoForge / Forge Mod Dev Workspace ═══════════════
    const modNs = modId;
    const resPath = `src/main/resources/assets/${modNs}`;
    const dataPath = `src/main/resources/data/${modNs}`;

    // Tag file for weapons/swords/enchantable
    zip.file(`${dataPath}/tags/item/enchantable/weapon.json`, JSON.stringify({
      replace: false,
      values: [`${modNs}:${slug}`],
    }, null, 2));

    zip.file(`${resPath}/textures/item/${slug}.png`, textureBase64, { base64: true });
    if (animated && cfg.animation?.mcmeta) {
      zip.file(`${resPath}/textures/item/${slug}.png.mcmeta`, JSON.stringify(buildMcmeta(cfg), null, 2));
    }

    // Item Model JSON
    zip.file(`${resPath}/models/item/${slug}.json`, JSON.stringify({
      parent: profile.parent,
      textures: {
        layer0: `${modNs}:item/${slug}`,
      },
    }, null, 2));

    // Modern 1.21.4+ Item definition JSON
    zip.file(`${resPath}/items/${slug}.json`, JSON.stringify({
      model: {
        type: 'minecraft:model',
        model: `${modNs}:item/${slug}`,
      },
    }, null, 2));

    // Language files (en_us and ja_jp)
    zip.file(`${resPath}/lang/en_us.json`, JSON.stringify({
      [`item.${modNs}.${slug}`]: displayName,
    }, null, 2));
    zip.file(`${resPath}/lang/ja_jp.json`, JSON.stringify({
      [`item.${modNs}.${slug}`]: `${cfg.element}の${cfg.itemType}`,
    }, null, 2));

    // Mod registration Java snippet
    const javaItemName = slug.toUpperCase().replace(/-/g, '_');
    const javaSnippet = [
      `package net.example.${modNs};`,
      ``,
      `import net.minecraft.world.item.Item;`,
      `import net.minecraft.world.item.Rarity;`,
      `// Fabric / NeoForge / Forge Item registration template`,
      `public class ModItems {`,
      `    // Register item definition for: ${displayName}`,
      `    // Identifier: "${modNs}:${slug}"`,
      `    public static final Item ${javaItemName} = new Item(new Item.Properties()`,
      `        .stacksTo(1)`,
      `        .rarity(Rarity.${(cfg.rarity ?? 'EPIC').toUpperCase()})`,
      `    );`,
      `}`,
    ].join('\n');
    zip.file(`ModItems_snippet.java`, javaSnippet);

    zip.file('README.txt', [
      `# ${displayName} — Mod Asset Package`,
      `Namespace (modid) : ${modNs}`,
      `Item ID            : ${slug}`,
      ``,
      `Directory Structure:`,
      `- assets/${modNs}/textures/item/${slug}.png (Texture)`,
      `- assets/${modNs}/models/item/${slug}.json (Model Definition)`,
      `- assets/${modNs}/items/${slug}.json (1.21.4+ Item Definition)`,
      `- assets/${modNs}/lang/en_us.json & ja_jp.json`,
      `- ModItems_snippet.java (Java Registration Helper)`,
    ].join('\n'));

  } else {
    // ═══════════════ Vanilla Resource Pack (1.20.4 or 1.21.4) ═══════════════
    const is120 = target === 'java-1.20.4';
    const packFormat = is120 ? 22 : 46;

    zip.file('pack.mcmeta', JSON.stringify({
      pack: {
        pack_format: packFormat,
        description: `§e${displayName}\n§7Arcane Forge Java Resource Pack`,
      },
    }, null, 2));
    zip.file('pack.png', iconBase64, { base64: true });

    const modelPath = `arcane_forge:item/${slug}`;
    const texPath = `assets/arcane_forge/textures/item/${slug}.png`;
    zip.file(texPath, textureBase64, { base64: true });
    if (animated && cfg.animation?.mcmeta) {
      zip.file(`${texPath}.mcmeta`, JSON.stringify(buildMcmeta(cfg), null, 2));
    }

    // Model in arcane_forge namespace
    zip.file(`assets/arcane_forge/models/item/${slug}.json`, JSON.stringify({
      parent: profile.parent,
      textures: { layer0: modelPath },
    }, null, 2));

    if (is120) {
      // Legacy predicate overrides
      zip.file(`assets/minecraft/models/item/${profile.id}.json`, JSON.stringify({
        parent: profile.parent,
        textures: { layer0: `minecraft:item/${profile.id}` },
        overrides: [
          {
            predicate: { custom_model_data: cmd },
            model: modelPath,
          },
        ],
      }, null, 2));
    } else {
      // Modern 1.21.4+ item model definition
      zip.file(`assets/minecraft/items/${profile.id}.json`, JSON.stringify({
        model: {
          type: 'minecraft:range_dispatch',
          property: 'minecraft:custom_model_data',
          index: 0,
          scale: 1,
          entries: [
            {
              threshold: cmd,
              model: { type: 'minecraft:model', model: modelPath },
            },
          ],
          fallback: { type: 'minecraft:model', model: `minecraft:item/${profile.id}` },
        },
      }, null, 2));

      zip.file(`assets/arcane_forge/items/${slug}.json`, JSON.stringify({
        model: { type: 'minecraft:model', model: modelPath },
      }, null, 2));
    }

    const command = is120
      ? `/give @s minecraft:${profile.id}{CustomModelData:${cmd},display:{Name:'{"text":"${displayName}","color":"gold"}'}}`
      : `/give @s minecraft:${profile.id}[minecraft:custom_model_data={floats:[${cmd}.0]},minecraft:item_name='{"text":"${displayName}","color":"gold"}']`;

    zip.file('give-command.txt', [
      `# Minecraft Give Command:`,
      command,
      ``,
      `# Modern 1.21.4+ direct item_model override (no custom model data required):`,
      `/give @s minecraft:${profile.id}[minecraft:item_model="arcane_forge:${slug}"]`,
    ].join('\n'));

    zip.file('texture-recipe.json', JSON.stringify(cfg, null, 2));
    zip.file('README.txt', [
      `# ${displayName}`,
      ``,
      `Target                : Java ${is120 ? '1.20.4 (Legacy CMD)' : '1.21.4 (Modern Item Model Definition)'}`,
      `Base Item             : minecraft:${profile.id}`,
      `CustomModelData       : ${cmd}`,
      `Resolution            : ${cfg.resolution}x${cfg.resolution}`,
      `Animation             : ${animated ? `${cfg.animation?.type} (${cfg.animation?.frames} frames)` : 'Static'}`,
      `Seed                  : ${cfg.seed}`,
      ``,
      `Installation:`,
      `1. Place this .zip directly inside .minecraft/resourcepacks/`,
      `2. Enable the resource pack in-game under Options > Resource Packs`,
      `3. Run the command inside give-command.txt`,
    ].join('\n'));
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `${slug}_${target}.zip`);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return { slug, frames: animated ? (cfg.animation?.frames ?? 1) : 1 };
}
