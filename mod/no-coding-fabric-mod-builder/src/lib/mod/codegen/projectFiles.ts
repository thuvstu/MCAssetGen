import { makeEffectIconBase64, makeIconPngBase64, parsePngDataUrl } from "../png";
import { gradleFiles } from "../gradleGen";
import { weaponForgeBody, weaponForgeResources } from "../weaponForge";
import { structureResources } from "../structuresGen";
import { extrasMojBody, extrasYarnStub, itemAttributesMojBody, itemAttributesYarnStub } from "../extrasgen";
import { resolveEnv, type TargetEnv } from "../targets";
import type { GeneratedFile, ModProject } from "../model";
import { buildKotlin, projectSymbols } from "./kotlin";
import { generateMobsKotlin } from "./mobs";
import { generateRuntimeKotlin } from "./runtime";
import { advancementJsons, lootTable, recipeJson } from "./resources";
import { generateSupportFiles } from "./supportFiles";
import { skillsKt, triggersKt, CUSTOM_OPEN, CUSTOM_CLOSE } from "./skills";
import { blocksKt, clientKt, configKt, groupKt, itemsKt, mainKt, modItemKt, networkingKt, worldGenKt } from "./content";
import {
  armorDurability, constName, d, f, i, indent as ind, json as js, namespaced as ns,
  number as num, q, mojHelpers, type Dialect,
} from "./shared";


export function generateProject(project: ModProject): GeneratedFile[] {
  const { meta } = project;
  const env: TargetEnv = resolveEnv(meta);
  const moj = env.mappings === "mojmap";
  const FABRIC = env;
  const dialect: Dialect = moj ? "mojmap" : "yarn";
  const pkgPath = meta.packageName.replace(/\./g, "/");
  const files: GeneratedFile[] = [];
  const kt = (path: string, content: string) => files.push({ path: `src/main/kotlin/${pkgPath}/${path}`, content, kind: "kotlin" });
  const res = (path: string, content: string, kind: GeneratedFile["kind"] = "json") => files.push({ path: `src/main/resources/${path}`, content, kind });

  kt("ModMain.kt", mainKt(project, dialect));
  kt("ModItems.kt", itemsKt(project, dialect));
  kt("ModItem.kt", modItemKt(project, dialect));
  kt("ModBlocks.kt", blocksKt(project, dialect));
  kt("ModItemGroup.kt", groupKt(project, dialect));
  kt("ModWorldGen.kt", worldGenKt(project, dialect));
  kt("ModConfig.kt", configKt(project, dialect));
  kt("net/ModNetworking.kt", networkingKt(project, dialect));
  kt("client/ModClient.kt", clientKt(project, dialect));
  kt("skill/SkillRuntime.kt", generateRuntimeKotlin(project, (pkg, body) => buildKotlin(project, dialect, pkg, body)));
  kt("skill/Skills.kt", skillsKt(project, dialect));
  kt("skill/SkillTriggers.kt", triggersKt(project, dialect));
  kt("ModMobs.kt", generateMobsKotlin(project, (pkg, body) => buildKotlin(project, dialect, pkg, body)));
  if (moj && project.forge?.enabled) kt("WeaponForge.kt", buildKotlin(project, dialect, meta.packageName, weaponForgeBody(project, q), { raw: true }));
  const exH = { q, d, f, i, ind, ns: (id: string) => ns(project, id) };
  kt("ModItemAttributes.kt", moj ? buildKotlin(project, dialect, meta.packageName, itemAttributesMojBody(project, exH), { raw: true }) : buildKotlin(project, dialect, meta.packageName, itemAttributesYarnStub()));
  kt("ModExtras.kt", moj ? buildKotlin(project, dialect, meta.packageName, extrasMojBody(project, exH), { raw: true }) : buildKotlin(project, dialect, meta.packageName, extrasYarnStub()));

  res("fabric.mod.json", js({
    schemaVersion: 1, id: meta.modId, version: meta.version, name: meta.name, description: meta.description,
    authors: [meta.author], license: meta.license, environment: "*",
    icon: `assets/${meta.modId}/icon.png`,
    entrypoints: { main: [{ adapter: "kotlin", value: `${meta.packageName}.ModMain` }] },
    depends: { fabricloader: `>=${FABRIC.loader}`, minecraft: `~${FABRIC.minecraft}`, java: `>=${FABRIC.java}`, "fabric-api": "*", "fabric-language-kotlin": "*" },
  }));

  const lang: Record<string, string> = { [`itemGroup.${meta.modId}.main`]: meta.name };
  project.items.forEach((x) => (lang[`item.${meta.modId}.${x.id}`] = x.name));
  project.blocks.forEach((x) => (lang[`block.${meta.modId}.${x.id}`] = x.name));
  if (moj && project.forge?.enabled) {
    lang[`block.${meta.modId}.weapon_forge`] = "Weapon Forge";
    lang[`item.${meta.modId}.forged_weapon`] = "Forged Weapon";
    project.forge.styles.forEach((style) => (lang[`item.${meta.modId}.forged_${style.id}`] = style.name));
  }
  const langJa: Record<string, string> = { [`itemGroup.${meta.modId}.main`]: meta.name };
  project.items.forEach((x) => (langJa[`item.${meta.modId}.${x.id}`] = x.name));
  project.blocks.forEach((x) => (langJa[`block.${meta.modId}.${x.id}`] = x.name));
  if (moj && project.forge?.enabled) {
    langJa[`block.${meta.modId}.weapon_forge`] = "武器工房";
    langJa[`item.${meta.modId}.forged_weapon`] = "鍛造武器";
    project.forge.styles.forEach((style) => (langJa[`item.${meta.modId}.forged_${style.id}`] = style.name));
  }
  if (moj) project.effects.forEach((e) => { lang[`effect.${meta.modId}.${e.id}`] = e.name; langJa[`effect.${meta.modId}.${e.id}`] = e.name; });
  const catKey = moj ? `key.category.${meta.modId}.main` : `key.category.${meta.modId}`;
  const keyCat: Record<string, string> = { [catKey]: "スキル" };
  const keyNames = ["R", "G", "H", "V"];
  keyNames.forEach((_n, i) => (keyCat[`key.${meta.modId}.slot${i + 1}`] = `スキルスロット${i + 1}`));
  res(`assets/${meta.modId}/lang/en_us.json`, js({ ...lang, ...keyCat }));
  res(`assets/${meta.modId}/lang/ja_jp.json`, js({ ...langJa, [catKey]: "スキル", ...Object.fromEntries(keyNames.map((_, i) => [`key.${meta.modId}.slot${i + 1}`, `スキルスロット${i + 1}`])) }));

  const bin = (path: string, b64: string) => files.push({ path, content: b64, kind: "binary", encoding: "base64" });
  for (const it of project.items) {
    const png = parsePngDataUrl(it.customTexture);
    if (png) bin(`src/main/resources/assets/${meta.modId}/textures/item/${it.id}.png`, png);
    if (moj) res(`assets/${meta.modId}/items/${it.id}.json`, js({ model: { type: "minecraft:model", model: `${meta.modId}:item/${it.id}` } }));
    if (it.customModelJson && it.customModelJson.trim().startsWith("{")) {
      try {
        const customObj = JSON.parse(it.customModelJson);
        res(`assets/${meta.modId}/models/item/${it.id}.json`, js(customObj));
      } catch {
        res(`assets/${meta.modId}/models/item/${it.id}.json`, js({ parent: `minecraft:item/${it.model}`, textures: { layer0: png ? `${meta.modId}:item/${it.id}` : it.texture } }));
      }
    } else {
      res(`assets/${meta.modId}/models/item/${it.id}.json`, js({ parent: `minecraft:item/${it.model}`, textures: { layer0: png ? `${meta.modId}:item/${it.id}` : it.texture } }));
    }
  }
  bin(`src/main/resources/assets/${meta.modId}/icon.png`, makeIconPngBase64(meta.modId));
  const tags: Record<string, string[]> = {};
  for (const b of project.blocks) {
    res(`assets/${meta.modId}/blockstates/${b.id}.json`, js({ variants: { "": { model: `${meta.modId}:block/${b.id}` } } }));
    const bpng = parsePngDataUrl(b.customTexture);
    if (bpng) bin(`src/main/resources/assets/${meta.modId}/textures/block/${b.id}.png`, bpng);
    res(`assets/${meta.modId}/models/block/${b.id}.json`, js({ parent: "minecraft:block/cube_all", textures: { all: bpng ? `${meta.modId}:block/${b.id}` : b.texture } }));
    if (moj) res(`assets/${meta.modId}/items/${b.id}.json`, js({ model: { type: "minecraft:model", model: `${meta.modId}:block/${b.id}` } }));
    else res(`assets/${meta.modId}/models/item/${b.id}.json`, js({ parent: `${meta.modId}:block/${b.id}` }));
    res(`data/${meta.modId}/loot_table/blocks/${b.id}.json`, js(lootTable(project, b)));
    if (b.ore) {
      const o = b.ore;
      const fid = `${meta.modId}:ore_${b.id}`;
      const state = { Name: `${meta.modId}:${b.id}` };
      const targets =
        o.dimension === "NETHER" ? [{ state, target: { predicate_type: "minecraft:tag_match", tag: "minecraft:base_stone_nether" } }]
          : o.dimension === "END" ? [{ state, target: { predicate_type: "minecraft:block_match", block: "minecraft:end_stone" } }]
            : [
              { state, target: { predicate_type: "minecraft:tag_match", tag: "minecraft:stone_ore_replaceables" } },
              { state, target: { predicate_type: "minecraft:tag_match", tag: "minecraft:deepslate_ore_replaceables" } },
            ];
      res(`data/${meta.modId}/worldgen/configured_feature/ore_${b.id}.json`, js({
        type: "minecraft:ore",
        config: { discard_chance_on_air_exposure: 0.0, size: Math.max(1, Math.round(o.veinSize)), targets },
      }));
      res(`data/${meta.modId}/worldgen/placed_feature/ore_${b.id}.json`, js({
        feature: fid,
        placement: [
          { type: "minecraft:count", count: Math.max(1, Math.round(o.veinsPerChunk)) },
          { type: "minecraft:in_square" },
          { type: "minecraft:height_range", height: { type: "minecraft:uniform", min_inclusive: { absolute: Math.round(o.minY) }, max_inclusive: { absolute: Math.round(Math.max(o.minY, o.maxY)) } } },
          { type: "minecraft:biome" },
        ],
      }));
    }
    if (b.tool !== "none") (tags[`mineable/${b.tool}`] ??= []).push(`${meta.modId}:${b.id}`);
    if (b.toolTier !== "none") (tags[`needs_${b.toolTier}_tool`] ??= []).push(`${meta.modId}:${b.id}`);
  }
  if (moj && project.forge?.enabled) (tags["mineable/pickaxe"] ??= []).push(`${meta.modId}:weapon_forge`);
  // 地表クラスター生成 (random_patch)
  for (const b of project.blocks) {
    if (!b.surface) continue;
    const sf = b.surface;
    res(`data/${meta.modId}/worldgen/configured_feature/surface_${b.id}.json`, js({
      type: "minecraft:random_patch",
      config: {
        feature: {
          feature: { type: "minecraft:simple_block", config: { to_place: { type: "minecraft:simple_state_provider", state: { Name: `${meta.modId}:${b.id}` } } } },
          placement: [{
            type: "minecraft:block_predicate_filter",
            predicate: { type: "minecraft:all_of", predicates: [{ type: "minecraft:matching_blocks", blocks: "minecraft:air" }, { type: "minecraft:solid", offset: [0, -1, 0] }] },
          }],
        },
        tries: Math.max(1, Math.round(sf.tries)),
        xz_spread: Math.max(1, Math.round(sf.spread)),
        y_spread: 3,
      },
    }));
    res(`data/${meta.modId}/worldgen/placed_feature/surface_${b.id}.json`, js({
      feature: `${meta.modId}:surface_${b.id}`,
      placement: [
        { type: "minecraft:rarity_filter", chance: Math.max(1, Math.round(sf.rarity)) },
        { type: "minecraft:in_square" },
        { type: "minecraft:heightmap", heightmap: "MOTION_BLOCKING" },
        { type: "minecraft:biome" },
      ],
    }));
  }
  // カスタムエフェクトのアイコン / 実績 (1.21.11 のみ)
  if (moj) {
    for (const e of project.effects) bin(`src/main/resources/assets/${meta.modId}/textures/mob_effect/${e.id}.png`, makeEffectIconBase64(e.color));
    for (const adv of advancementJsons(project)) res(`data/${meta.modId}/advancement/${adv.id}.json`, js(adv.json));
  }
  for (const [tag, values] of Object.entries(tags)) res(`data/minecraft/tags/block/${tag}.json`, js({ replace: false, values }));
  if (moj && project.forge?.enabled) files.push(...weaponForgeResources(project));
  if (moj && project.structures?.length) files.push(...structureResources(project));
  for (const r of project.recipes) {
    res(`data/${meta.modId}/recipe/${r.id}.json`, js(recipeJson(project, dialect, r)));
    const material = r.grid.map((x) => x.trim()).find(Boolean);
    if (material) {
      res(`data/${meta.modId}/advancement/recipe/${r.id}.json`, js({
        parent: "minecraft:recipes/root",
        criteria: {
          has_material: { trigger: "minecraft:inventory_changed", conditions: { items: [{ items: [ns(project, material)] }] } },
          has_the_recipe: { trigger: "minecraft:recipe_unlocked", conditions: { recipe: `${meta.modId}:${r.id}` } },
        },
        requirements: [["has_material", "has_the_recipe"]],
        rewards: { recipes: [`${meta.modId}:${r.id}`] },
      }));
    }
  }

  // --- gradle ---
  files.push(...gradleFiles(project, env));
  files.push(...generateSupportFiles(project, env));
  return files;
}

/** 生成済みSkills.ktからカスタムKotlinブロックの行範囲を取得 */
export function customRanges(content: string): Record<string, { start: number; end: number }> {
  const out: Record<string, { start: number; end: number }> = {};
  content.split("\n").forEach((line, idx) => {
    const t = line.trim();
    if (t.startsWith(CUSTOM_OPEN)) out[t.slice(CUSTOM_OPEN.length)] = { start: idx + 2, end: idx + 2 };
    else if (t.startsWith(CUSTOM_CLOSE)) {
      const r = out[t.slice(CUSTOM_CLOSE.length)];
      if (r) r.end = idx;
    }
  });
  return out;
}
