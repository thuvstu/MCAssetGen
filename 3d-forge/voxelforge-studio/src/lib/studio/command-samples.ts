import type { Args } from "./engine-utils";

/**
 * `engine:command` ごとの実行サンプル。
 *
 * コンソールと CLI (`mcasset engines --json`) はこの表を使って引数を
 * 事前入力するので、引数の書き方を覚えていなくても全エンジンを実行できる。
 * 値はすべて実データから確認済み (tests/studio-command-samples.test.ts が
 * サンプルを実際に実行して検証する)。
 */
export const COMMAND_SAMPLES: Record<string, Args> = {
  /* ---- 3d / voxel ---- */
  "voxel:generate": { kind: "sword", name: "sample_blade", seed: 7 },
  "voxel:export": { kind: "sword", format: "bbmodel", name: "sample_blade", seed: 7 },
  "voxel:kinds": {},

  /* ---- armor ---- */
  "armor:presets": {},
  "armor:render": { armorId: "studio_hero", style: "scale", seed: 3, geo: true },
  "armor:bundle": { armorId: "studio_hero", namespace: "mymod", style: "plate", geckolib: true, java: true },

  /* ---- mob ---- */
  "mob:archetypes": {},
  "mob:presets": {},
  "mob:render": { archetype: "quadruped", entityId: "studio_pup", scale: 1.1 },
  "mob:bundle": { archetype: "quadruped", entityId: "studio_pup", modId: "mymod" },
  "mob:mcaddon": { archetype: "quadruped", entityId: "studio_pup" },
  "mob:fabric": { archetype: "quadruped", entityId: "studio_pup", modId: "mymod" },
  "mob:geckolib": { archetype: "quadruped", entityId: "studio_pup", modId: "mymod" },

  /* ---- structure ---- */
  "structure:samples": {},
  "structure:nbt": { sample: "house", name: "studio_house", namespace: "mymod" },
  "structure:export": { sample: "house", name: "studio_house", namespace: "mymod" },

  /* ---- material ---- */
  "material:shapes": {},
  "material:presets": {},
  "material:render": { preset: "iron", shape: "ingot", scale: 1, seed: 2 },
  "material:pack": { preset: "iron", modId: "mymod", scale: 1 },
  "material:folder": { preset: "iron", modId: "mymod", scale: 1 },

  /* ---- skyblock: SkyForge ---- */
  "skyforge:items": {},
  "skyforge:render": { item: "hyperion", res: 32, seed: 5 },

  /* ---- skyblock: classic (sky2) ---- */
  "sky2:items": {},
  "sky2:render": { item: "hyperion", size: 32, seed: 5 },

  /* ---- skyblock: Texture Forge ---- */
  "forge:items": {},
  "forge:styles": {},
  "forge:render": { item: "HYPERION", res: 32, style: "furfsky" },
  "forge:pack": { items: "HYPERION,ASPECT_OF_THE_DRAGONS", target: "catharsis", name: "Studio Pack", res: 32, style: "furfsky" },

  /* ---- staff: Spellforge ---- */
  "spell:elements": {},
  "spell:render": { element: "fire", seed: 4 },

  /* ---- staff: Arcane ---- */
  "arcane:config": {},
  "arcane:render": { size: 32, seed: 9 },

  /* ---- swords ---- */
  "sword:presets": {},
  "sword:render": { preset: "Hyperion", size: 64, seconds: 0 },

  /* ---- advanced weapons ---- */
  "adv:shapes": {},
  "adv:materials": {},
  "adv:anims": {},
  "adv:render": { shape: "sword", material: "iron", size: 32, seed: 3 },
  "adv:model": { shape: "sword", material: "iron", size: 32, seed: 3 },
  "adv:anim": { shape: "sword", material: "iron", layers: 8, frames: 16 },

  /* ---- texture: TexCraft ---- */
  "tex:list-effects": {},
  "tex:list-presets": {},
  "tex:list-samples": {},
  "tex:list-palettes": {},
  "tex:list-textures": {},
  "tex:list-parts": {},
  "tex:list-variants": {},
  "tex:list-groups": {},
  "tex:render": { preset: "luminous", sample: "stone", size: 32 },
  "tex:texture": { id: "grass_top", size: 32, seed: 1 },
  "tex:stamp": { part: "blade_long", sample: "sword", size: 32, recolor: "#88ccff" },
  "tex:variant": { id: "tier0", sample: "stone", size: 32, seed: 2 },
  "tex:effect": { id: "edgewear", sample: "sword", size: 32 },

  /* ---- mod ---- */
  "mythic:sample": {},
  "mythiccraft:sample": { name: "Studio Sample" },
};

/**
 * 入力画像など動的な引数が必要で、静的なサンプルを持てないコマンド。
 * (テスト側で2段階のチェーンを組んで検証する)
 */
export const DYNAMIC_COMMANDS = [
  "tex:convert",
  "mythic:build",
  "mythiccraft:build",
] as const;

/** `engine:command` のサンプル引数 (なければ undefined)。 */
export function sampleFor(engineId: string, commandId: string): Args | undefined {
  return COMMAND_SAMPLES[`${engineId}:${commandId}`];
}

/** サンプルのキー一覧 (`engine:command`)。 */
export function sampleKeys(): string[] {
  return Object.keys(COMMAND_SAMPLES);
}
