import JSZip from 'jszip';
import type { ItemDef, ItemKind } from './items';
import { generateTexture, type StyleOptions, type TextureEssence, type ShapeOptions, type AnimationMode } from './generator';

export type MinecraftTarget = 'universal' | 'cit_1_8_9' | 'cmd_1_20_1' | 'item_model_1_21_5' | 'mod_assets' | 'textures';

export const MINECRAFT_TARGETS: { id: MinecraftTarget; label: string; detail: string }[] = [
  { id: 'universal', label: 'Universal Project', detail: '全Resource Pack＋Data Pack＋Mod assets' },
  { id: 'cit_1_8_9', label: 'Hypixel 1.8.9 CIT', detail: 'MCPatcher / OptiFine・名前マッチ' },
  { id: 'cmd_1_20_1', label: 'Java 1.20.1 CMD', detail: 'CustomModelData・pack_format 15' },
  { id: 'item_model_1_21_5', label: 'Java 1.21.5+', detail: 'Item Model Definition・pack_format 55' },
  { id: 'mod_assets', label: 'Mod Assets Source', detail: 'Fabric / Forgeのresourcesへコピー' },
  { id: 'textures', label: 'Texture Bundle', detail: '16/32/64 PNG＋アニメ＋設計情報' },
];

export interface MinecraftExportConfig {
  projectName: string;
  namespace: string;
  baseItem: string;
  customModelData: number;
  item: ItemDef;
  resolution: 16 | 32 | 64;
  style: StyleOptions;
  essence: TextureEssence;
  shape: ShapeOptions;
  animation: { mode: AnimationMode; frames: number; frameTime: number };
  palette: ItemDef['palette'];
  seed: number;
  blueprint: unknown;
}

export interface BuiltProject {
  blob: Blob;
  filename: string;
  command: string;
}

export const DEFAULT_BASE_ITEM: Record<ItemKind, string> = {
  sword: 'diamond_sword', bow: 'bow', axe: 'diamond_axe', pickaxe: 'diamond_pickaxe',
  helmet: 'diamond_helmet', chestplate: 'diamond_chestplate', shield: 'shield', block: 'paper',
  orb: 'ender_pearl', staff: 'blaze_rod', hoe: 'diamond_hoe',
};

export const BASE_ITEM_OPTIONS = [
  'diamond_sword', 'iron_sword', 'netherite_sword', 'bow', 'stick', 'blaze_rod',
  'carrot_on_a_stick', 'warped_fungus_on_a_stick', 'diamond_axe', 'diamond_pickaxe',
  'diamond_hoe', 'shield', 'paper', 'ender_pearl', 'diamond_helmet', 'diamond_chestplate',
];

function safeId(input: string, fallback = 'custom_relic'): string {
  return input.toLowerCase().replace(/[^a-z0-9_.-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48) || fallback;
}

function normalizeNamespace(input: string): string {
  return safeId(input, 'skyforge').replace(/\./g, '_');
}

function animationMeta(config: MinecraftExportConfig): string {
  return JSON.stringify({
    animation: {
      frametime: Math.max(1, Math.round(config.animation.frameTime)),
      interpolate: false,
      frames: Array.from({ length: config.animation.frames }, (_, index) => index),
    },
  }, null, 2);
}

function renderTexture(config: MinecraftExportConfig, resolution = config.resolution): HTMLCanvasElement {
  const frames = config.animation.mode === 'none' ? 1 : Math.max(2, config.animation.frames);
  const sheet = document.createElement('canvas');
  sheet.width = resolution;
  sheet.height = resolution * frames;
  const ctx = sheet.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  for (let frame = 0; frame < frames; frame++) {
    const canvas = document.createElement('canvas');
    generateTexture(
      canvas, config.item, resolution, config.style, config.seed, config.palette, config.essence,
      frames > 1 ? { mode: config.animation.mode, frame, frames } : undefined,
      config.shape,
    );
    ctx.drawImage(canvas, 0, frame * resolution);
  }
  return sheet;
}

function addTexture(zip: JSZip, path: string, canvas: HTMLCanvasElement, config: MinecraftExportConfig) {
  zip.file(path, canvas.toDataURL('image/png').split(',')[1], { base64: true });
  if (config.animation.mode !== 'none') zip.file(`${path}.mcmeta`, animationMeta(config));
}

function modelParent(baseItem: string): string {
  return baseItem.includes('sword') || baseItem.includes('axe') || baseItem.includes('pickaxe') || baseItem.includes('hoe') || baseItem === 'stick' || baseItem === 'blaze_rod'
    ? 'minecraft:item/handheld'
    : 'minecraft:item/generated';
}

function packMeta(packFormat: number, description: string): string {
  return JSON.stringify({ pack: { pack_format: packFormat, description } }, null, 2);
}

async function buildCitPack(config: MinecraftExportConfig): Promise<Blob> {
  const zip = new JSZip();
  const id = safeId(config.projectName);
  const texture = renderTexture(config);
  zip.file('pack.mcmeta', packMeta(1, `SkyForge CIT - ${config.projectName}`));
  const properties = [
    'type=item',
    `matchItems=minecraft:${config.baseItem}`,
    `texture=${id}`,
    `nbt.display.Name=ipattern:*${config.projectName}*`,
    '',
  ].join('\n');
  for (const root of ['assets/minecraft/mcpatcher/cit/skyforge', 'assets/minecraft/optifine/cit/skyforge']) {
    addTexture(zip, `${root}/${id}.png`, texture, config);
    zip.file(`${root}/${id}.properties`, properties);
  }
  zip.file('INSTALL.txt', [
    'Minecraft Java 1.8.9 CIT pack',
    '1. Put this ZIP into .minecraft/resourcepacks.',
    '2. Enable Custom Items in OptiFine, or use MCPatcher-compatible CIT support.',
    `3. Rename a minecraft:${config.baseItem} to: ${config.projectName}`,
    'Both mcpatcher/cit and optifine/cit layouts are included.',
  ].join('\n'));
  zip.file('skyforge_blueprint.json', JSON.stringify(config.blueprint, null, 2));
  return zip.generateAsync({ type: 'blob' });
}

function command120(config: MinecraftExportConfig): string {
  const name = JSON.stringify({ text: config.projectName, italic: false });
  return `give @s minecraft:${config.baseItem}{CustomModelData:${Math.round(config.customModelData)},display:{Name:'${name.replace(/'/g, "\\'")}'}} 1`;
}

async function build120ResourcePack(config: MinecraftExportConfig): Promise<Blob> {
  const zip = new JSZip();
  const ns = normalizeNamespace(config.namespace), id = safeId(config.projectName);
  const texture = renderTexture(config);
  zip.file('pack.mcmeta', packMeta(15, `SkyForge 1.20.1 - ${config.projectName}`));
  addTexture(zip, `assets/${ns}/textures/item/${id}.png`, texture, config);
  zip.file(`assets/${ns}/models/item/${id}.json`, JSON.stringify({ parent: modelParent(config.baseItem), textures: { layer0: `${ns}:item/${id}` } }, null, 2));
  zip.file(`assets/minecraft/models/item/${config.baseItem}.json`, JSON.stringify({
    parent: modelParent(config.baseItem),
    textures: { layer0: `minecraft:item/${config.baseItem}` },
    overrides: [{ predicate: { custom_model_data: Math.round(config.customModelData) }, model: `${ns}:item/${id}` }],
  }, null, 2));
  zip.file('GIVE_COMMAND.txt', `/${command120(config)}\n`);
  zip.file('skyforge_blueprint.json', JSON.stringify(config.blueprint, null, 2));
  return zip.generateAsync({ type: 'blob' });
}

function command121(config: MinecraftExportConfig): string {
  const ns = normalizeNamespace(config.namespace), id = safeId(config.projectName);
  return `give @s minecraft:${config.baseItem}[minecraft:item_model="${ns}:${id}"] 1`;
}

async function build121ResourcePack(config: MinecraftExportConfig): Promise<Blob> {
  const zip = new JSZip();
  const ns = normalizeNamespace(config.namespace), id = safeId(config.projectName);
  const texture = renderTexture(config);
  zip.file('pack.mcmeta', packMeta(55, `SkyForge 1.21.5+ - ${config.projectName}`));
  addTexture(zip, `assets/${ns}/textures/item/${id}.png`, texture, config);
  zip.file(`assets/${ns}/models/item/${id}.json`, JSON.stringify({ parent: modelParent(config.baseItem), textures: { layer0: `${ns}:item/${id}` } }, null, 2));
  zip.file(`assets/${ns}/items/${id}.json`, JSON.stringify({ model: { type: 'minecraft:model', model: `${ns}:item/${id}` } }, null, 2));
  zip.file('GIVE_COMMAND.txt', `/${command121(config)}\n`);
  zip.file('skyforge_blueprint.json', JSON.stringify(config.blueprint, null, 2));
  return zip.generateAsync({ type: 'blob' });
}

async function buildDatapack(config: MinecraftExportConfig, modern: boolean): Promise<Blob> {
  const zip = new JSZip();
  const ns = normalizeNamespace(config.namespace), id = safeId(config.projectName);
  zip.file('pack.mcmeta', packMeta(modern ? 71 : 15, `SkyForge give function - ${config.projectName}`));
  const folder = modern ? 'function' : 'functions';
  zip.file(`data/${ns}/${folder}/give_${id}.mcfunction`, `${modern ? command121(config) : command120(config)}\n`);
  zip.file('README.txt', `Install in <world>/datapacks and run:\n/function ${ns}:give_${id}\n`);
  return zip.generateAsync({ type: 'blob' });
}

async function buildTextureBundle(config: MinecraftExportConfig): Promise<Blob> {
  const zip = new JSZip();
  for (const resolution of [16, 32, 64] as const) addTexture(zip, `textures/${safeId(config.projectName)}_${resolution}x.png`, renderTexture(config, resolution), config);
  zip.file('blueprint.skyforge.json', JSON.stringify(config.blueprint, null, 2));
  zip.file('README.txt', 'Native 16x, 32x and 64x textures. Animated textures are vertically stacked and include matching .png.mcmeta files.');
  return zip.generateAsync({ type: 'blob' });
}

async function buildModAssets(config: MinecraftExportConfig): Promise<Blob> {
  const zip = new JSZip();
  const ns = normalizeNamespace(config.namespace), id = safeId(config.projectName);
  const root = 'src/main/resources';
  addTexture(zip, `${root}/assets/${ns}/textures/item/${id}.png`, renderTexture(config), config);
  zip.file(`${root}/assets/${ns}/models/item/${id}.json`, JSON.stringify({ parent: modelParent(config.baseItem), textures: { layer0: `${ns}:item/${id}` } }, null, 2));
  zip.file(`${root}/assets/${ns}/items/${id}.json`, JSON.stringify({ model: { type: 'minecraft:model', model: `${ns}:item/${id}` } }, null, 2));
  zip.file('README_MOD_INTEGRATION.md', [
    '# SkyForge generated assets', '',
    'Copy `src/main/resources` into a Fabric, NeoForge or Forge project.',
    `Modern item model component: ${ns}:${id}`,
    `Texture: ${ns}:item/${id}`,
    'Register the item in your mod code, then attach the generated model/texture as normal client resources.',
    'The files are loader-agnostic assets; Java registration code intentionally remains in your mod.',
  ].join('\n'));
  zip.file('skyforge_blueprint.json', JSON.stringify(config.blueprint, null, 2));
  return zip.generateAsync({ type: 'blob' });
}

async function addBlob(zip: JSZip, path: string, promise: Promise<Blob>) {
  zip.file(path, await promise);
}

export async function buildMinecraftProject(config: MinecraftExportConfig, target: MinecraftTarget): Promise<BuiltProject> {
  const id = safeId(config.projectName);
  if (target === 'cit_1_8_9') return { blob: await buildCitPack(config), filename: `${id}_1.8.9_CIT.zip`, command: `Rename minecraft:${config.baseItem} to ${config.projectName}` };
  if (target === 'cmd_1_20_1') return { blob: await build120ResourcePack(config), filename: `${id}_1.20.1_resourcepack.zip`, command: `/${command120(config)}` };
  if (target === 'item_model_1_21_5') return { blob: await build121ResourcePack(config), filename: `${id}_1.21.5_resourcepack.zip`, command: `/${command121(config)}` };
  if (target === 'mod_assets') return { blob: await buildModAssets(config), filename: `${id}_mod_assets.zip`, command: `${normalizeNamespace(config.namespace)}:${id}` };
  if (target === 'textures') return { blob: await buildTextureBundle(config), filename: `${id}_textures.zip`, command: '' };

  const zip = new JSZip();
  await Promise.all([
    addBlob(zip, `resourcepacks/${id}_1.8.9_CIT.zip`, buildCitPack(config)),
    addBlob(zip, `resourcepacks/${id}_1.20.1_CMD.zip`, build120ResourcePack(config)),
    addBlob(zip, `resourcepacks/${id}_1.21.5_item_model.zip`, build121ResourcePack(config)),
    addBlob(zip, `datapacks/${id}_1.20.1_datapack.zip`, buildDatapack(config, false)),
    addBlob(zip, `datapacks/${id}_1.21.5_datapack.zip`, buildDatapack(config, true)),
    addBlob(zip, `integration/${id}_mod_assets.zip`, buildModAssets(config)),
    addBlob(zip, `textures/${id}_texture_bundle.zip`, buildTextureBundle(config)),
  ]);
  zip.file('README_START_HERE.txt', [
    'SKYFORGE UNIVERSAL MINECRAFT PROJECT',
    '====================================',
    'Each nested ZIP is independently installable.',
    '- resourcepacks/: choose the ZIP matching your Minecraft version.',
    '- datapacks/: move the matching ZIP into <world>/datapacks.',
    '- integration/: loader-agnostic Fabric/Forge/NeoForge resource source tree.',
    '- textures/: raw 16/32/64 native textures and animation metadata.',
    '',
    `1.21.5 give command: /${command121(config)}`,
    `1.20.1 give command: /${command120(config)}`,
  ].join('\n'));
  return { blob: await zip.generateAsync({ type: 'blob' }), filename: `${id}_universal_project.zip`, command: `/${command121(config)}` };
}