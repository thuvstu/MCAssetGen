import {
  asBool,
  asNumber,
  asString,
  fail,
  file,
  jsonFile,
  rgbaToPng,
  type Args,
  type RegisteredEngine,
  type StudioCommand,
  type StudioEngine,
  type StudioFile,
  type StudioResponse,
  type StudioResult,
} from "./engine-utils";
import { PORTED_ENGINES } from "./engines-ported";
import { sampleFor } from "./command-samples";
import { MOD_ENGINES } from "./engines-mod";
import { DEFAULT_SETTINGS, TEMPLATES, type ModelSettings } from "../model-types";
import { generateModel } from "../model-generator";
import { toBlockbench, toGeckolibBundle } from "../export";
import { isExportFormat, toResourcePack, toVariantPack } from "../export";
import { buildVariants, isVariantFamily, type VariantFamily } from "../variants";
import { DEFAULT_PARAMS, STYLES, COLOR_PRESETS, HELMET_PROFILES, type ArmorParams } from "../compat/armor-types";
import { armorPreview, buildArmorBundle } from "../compat/armor-export";
import { DEFAULT_GECKOLIB_OPTIONS } from "../export/geckolib";
import {
  buildMobBundle,
  buildMobFabricProject,
  buildMobGeckolibBundle,
  buildMobMcaddon,
  renderMobBoxUvTexture,
  renderMobTexture,
} from "../compat/mob-server";
import { createMob } from "../compat/mob-model";
import { buildPresets } from "../compat/mob-presets";
import type { ArchetypeId, MobDraft } from "../compat/mob-types";
import { sampleStructure, exportStructure, structureNbtBytes } from "../compat/structure-server";
import { DEFAULT_META as STRUCTURE_META } from "../compat/structure-ops";
import { SHAPES, CATEGORY_LABEL } from "../compat/material-shapes";
import { PRESETS as MATERIAL_PRESETS, FX_STYLES, FX_DEFAULT } from "../compat/material-presets";
import { makePalette } from "../compat/material-color";
import { renderPixels, safeName, type MaterialSettings } from "../compat/material-render";
import { buildMaterialFolderZip, buildMaterialPackZip, pixelsToPng } from "../compat/material-server";

/**
 * Unified studio engine registry.
 *
 * Every generator that used to live in its own folder is reachable through the
 * same command shape (`engine:command --flags`), both from the API
 * (`/api/studio/run`) and from the CLI, which is now an HTTP client.
 *
 * Engines that still ship their own app keep their own HTTP APIs; this registry
 * covers the engines that were ported into the studio (see MERGE_PLAN.md).
 */

export { rgbaToPng };
export type { StudioCommand, StudioEngine, StudioFile, StudioResponse, StudioResult };

/* ---------------- voxel (studio native) ---------------- */

function runVoxel(command: string, args: Args): StudioResult {
  if (command === "kinds") {
    return {
      ok: true,
      engine: "voxel",
      command,
      text: TEMPLATES.map((t) => `${t.kind}\t${t.category}\t${t.label}`).join("\n"),
    };
  }
  if (command !== "generate" && command !== "export")
    fail(`unknown voxel command: ${command} (kinds|generate|export)`);
  const settings = {
    ...DEFAULT_SETTINGS,
    ...(typeof args.settings === "object" && args.settings !== null
      ? (args.settings as Partial<ModelSettings>)
      : {}),
    kind: asString(args, "kind", DEFAULT_SETTINGS.kind as string) as ModelSettings["kind"],
    seed: asNumber(args, "seed", DEFAULT_SETTINGS.seed),
    name: asString(args, "name", asString(args, "kind", "voxelforge")),
  } as ModelSettings;
  const model = generateModel(settings);
  const format = asString(args, "format", command === "export" ? "bbmodel" : "json");

  if (format === "json")
    return {
      ok: true,
      engine: "voxel",
      command,
      text: `generated ${model.cubes.length} cubes (kind=${settings.kind}, seed=${settings.seed})`,
      data: model,
      files: [jsonFile(`${settings.kind}-${settings.seed}.model.json`, model)],
    };
  if (format === "geckolib") {
    const bundle = toGeckolibBundle(model, {
      namespace: asString(args, "namespace", DEFAULT_GECKOLIB_OPTIONS.namespace),
      modelId: asString(args, "modelId", `voxelforge_${settings.kind}`),
      generation: asString(args, "generation", DEFAULT_GECKOLIB_OPTIONS.generation) as never,
      mirrorX: asBool(args, "mirrorX", true),
    });
    return {
      ok: true,
      engine: "voxel",
      command,
      text: `geckolib bundle: ${bundle.files.length} files (${bundle.layout.size}px atlas)`,
      files: [file(`voxelforge_${settings.kind}_geckolib.zip`, bundle.zip)],
    };
  }
  if (format === "resourcepack")
    return {
      ok: true,
      engine: "voxel",
      command,
      text: "resource pack 1.21.4",
      files: [file(`voxelforge_${settings.kind}_1.21.4.zip`, toResourcePack(model))],
    };
  if (format === "variantpack") {
    const requestedFamily = asString(args, "family", "all");
    const family: VariantFamily = isVariantFamily(requestedFamily) ? requestedFamily : "all";
    const variants = buildVariants(settings, family).map((spec) => ({
      key: spec.key,
      label: spec.label,
      model: generateModel(spec.settings),
    }));
    return {
      ok: true,
      engine: "voxel",
      command,
      text: `${variants.length} variants (${family})`,
      files: [file(`voxelforge_${settings.kind}_variants.zip`, toVariantPack(variants, settings.name))],
    };
  }
  if (format === "png")
    return {
      ok: true,
      engine: "voxel",
      command,
      text: "atlas png",
      files: [file(`voxelforge_${settings.kind}_atlas.png`, new Uint8Array(Buffer.from(model.texture.source.split(",")[1], "base64")))],
    };
  if (!isExportFormat(format)) fail(`unknown format: ${format}`);
  return {
    ok: true,
    engine: "voxel",
    command,
    text: `blockbench: ${model.cubes.length} cubes`,
    files: [jsonFile(`voxelforge_${settings.kind}.bbmodel`, toBlockbench(model))],
  };
}

/* ---------------- armor ---------------- */

function armorParams(args: Args): ArmorParams {
  const style = asString(args, "style", DEFAULT_PARAMS.style) as ArmorParams["style"];
  if (!STYLES.some((entry) => entry.id === style)) fail(`unknown armor style: ${style}`);
  return {
    ...DEFAULT_PARAMS,
    ...(typeof args.params === "object" && args.params !== null ? (args.params as Partial<ArmorParams>) : {}),
    armorId: safeName(asString(args, "armorId", DEFAULT_PARAMS.armorId)),
    displayName: asString(args, "displayName", DEFAULT_PARAMS.displayName),
    namespace: safeName(asString(args, "namespace", DEFAULT_PARAMS.namespace)),
    style,
    seed: asNumber(args, "seed", DEFAULT_PARAMS.seed),
    detail: asNumber(args, "detail", DEFAULT_PARAMS.detail),
    hornLength: asNumber(args, "hornLength", DEFAULT_PARAMS.hornLength),
    includeGeckolib: asBool(args, "geckolib", DEFAULT_PARAMS.includeGeckolib),
    includeJava: asBool(args, "java", DEFAULT_PARAMS.includeJava),
  };
}

function runArmor(command: string, args: Args): StudioResult {
  if (command === "presets")
    return {
      ok: true,
      engine: "armor",
      command,
      text: [
        ...STYLES.map((style) => `style\t${style.id}\t${style.label}\t${style.desc}`),
        ...HELMET_PROFILES.map((profile) => `helmet\t${profile.id}\t${profile.name}\t${profile.description}`),
        ...COLOR_PRESETS.map((preset) => `color\t${preset.name}\t${preset.primary}\t${preset.secondary}\t${preset.accent}`),
      ].join("\n"),
    };
  if (command !== "render" && command !== "bundle" && command !== "export")
    fail(`unknown armor command: ${command} (presets|render|bundle)`);
  const params = armorParams(args);
  const bundle = buildArmorBundle(params);
  if (command === "render") {
    const preview = armorPreview(params);
    const part = asString(args, "part", "humanoid");
    const files = [
      file(
        `${params.armorId}_${part === "legs" ? "humanoid_leggings" : "humanoid"}.png`,
        rgbaToPng(preview.atlas1.width, preview.atlas1.height, part === "legs" ? preview.atlas2.data : preview.atlas1.data),
      ),
    ];
    if (asBool(args, "geo", false))
      files.push(file(`${params.armorId}_geo.png`, rgbaToPng(preview.geo.width, preview.geo.height, preview.geo.data)));
    return {
      ok: true,
      engine: "armor",
      command,
      text: `armor render: ${params.namespace}:${params.armorId} (64x32 ${part}, geo ${preview.geoSize}px)`,
      files,
    };
  }
  return {
    ok: true,
    engine: "armor",
    command,
    text: `armor bundle: ${bundle.files.length} files (geo ${bundle.geoSize}px)`,
    files: [file(`${params.namespace}_${params.armorId}.zip`, bundle.zip)],
  };
}

/* ---------------- mob ---------------- */

function mobFromArgs(args: Args): MobDraft {
  const archetype = asString(args, "archetype", "quadruped");
  const mob = createMob(archetype as ArchetypeId, asString(args, "variant") || undefined);
  const patch: Partial<MobDraft> = {};
  if (typeof args.mob === "object" && args.mob !== null) Object.assign(patch, args.mob);
  if (args.entityId) patch.entityId = safeName(asString(args, "entityId"));
  if (args.modId) patch.modId = safeName(asString(args, "modId"));
  if (args.displayName) patch.displayName = asString(args, "displayName");
  if (args.scale) patch.scale = asNumber(args, "scale", mob.scale);
  return { ...mob, ...patch } as MobDraft;
}

function runMob(command: string, args: Args): StudioResult {
  if (command === "presets") {
    const presets = buildPresets();
    return {
      ok: true,
      engine: "mob",
      command,
      text: presets.map((preset) => `${preset.entityId}\t${preset.archetype}\t${preset.displayName}`).join("\n"),
      data: presets.map((preset) => ({ entityId: preset.entityId, archetype: preset.archetype, displayName: preset.displayName })),
    };
  }
  if (command === "archetypes") {
    // The archetype table is the source of truth for `mob:presets` defaults.
    const presets = buildPresets();
    const archetypes = [...new Set(presets.map((preset) => preset.archetype))];
    return {
      ok: true,
      engine: "mob",
      command,
      text: archetypes.join("\n"),
      data: archetypes,
    };
  }
  const mob = mobFromArgs(args);
  if (command === "render") {
    const texture = renderMobTexture(mob);
    const box = renderMobBoxUvTexture(mob);
    return {
      ok: true,
      engine: "mob",
      command,
      text: `mob render: ${mob.entityId} (java ${texture.size}px, box-uv ${box.size}px)`,
      files: [
        file(`${mob.entityId}.png`, texture.png),
        file(`${mob.entityId}_boxuv.png`, box.png),
      ],
      data: { entityId: mob.entityId, textureSize: texture.size, boxSize: box.size },
    };
  }
  if (command === "bundle" || command === "export") {
    const bundle = buildMobBundle(mob);
    return {
      ok: true,
      engine: "mob",
      command,
      text: `mob bundle: ${bundle.files.length} files`,
      files: [file(`${mob.entityId}_mob.zip`, bundle.zip)],
    };
  }
  if (command === "mcaddon") {
    const bundle = buildMobMcaddon(mob);
    return {
      ok: true,
      engine: "mob",
      command,
      text: `mcaddon: ${bundle.files.length} files`,
      files: [file(`${mob.entityId}.mcaddon`, bundle.zip)],
    };
  }
  if (command === "fabric") {
    const bundle = buildMobFabricProject(mob);
    return {
      ok: true,
      engine: "mob",
      command,
      text: `fabric project: ${bundle.files.length} files`,
      files: [file(`${mob.entityId}_fabric.zip`, bundle.zip)],
    };
  }
  if (command === "geckolib") {
    const bundle = buildMobGeckolibBundle(mob);
    return {
      ok: true,
      engine: "mob",
      command,
      text: `geckolib bundle: ${bundle.files.length} files`,
      files: [file(`${mob.entityId}_geckolib.zip`, bundle.zip)],
    };
  }
  return fail(`unknown mob command: ${command} (archetypes|presets|render|bundle|mcaddon|fabric|geckolib)`);
}

/* ---------------- structure ---------------- */

function runStructure(command: string, args: Args): StudioResult {
  if (command === "samples") {
    return {
      ok: true,
      engine: "structure",
      command,
      text: ["house", "tower", "pixel_sword", "dungeon", "redstone"].join("\n"),
    };
  }
  const sampleId = asString(args, "sample", "house");
  const structure = sampleStructure(sampleId) ?? fail(`unknown sample: ${sampleId}`);
  const meta = {
    ...STRUCTURE_META,
    fileName: safeName(asString(args, "name", sampleId)),
    packNamespace: safeName(asString(args, "namespace", STRUCTURE_META.packNamespace)),
    author: asString(args, "author", STRUCTURE_META.author),
  };
  if (command === "nbt") {
    const nbt = structureNbtBytes(structure, meta);
    return {
      ok: true,
      engine: "structure",
      command,
      text: `nbt: ${nbt.length} bytes`,
      files: [file(`${meta.fileName}.nbt`, nbt)],
    };
  }
  if (command === "export" || command === "datapack") {
    const result = exportStructure({ structure, meta });
    return {
      ok: true,
      engine: "structure",
      command,
      text: `datapack: ${result.files.join(", ")} (${result.validation.total} blocks)`,
      files: [
        file(`${meta.fileName}.nbt`, result.nbt),
        file(`${meta.packNamespace}_${meta.fileName}_datapack.zip`, result.datapack),
      ],
      data: result.validation,
    };
  }
  return fail(`unknown structure command: ${command} (samples|nbt|export)`);
}

/* ---------------- material ---------------- */

function materialSettings(args: Args): MaterialSettings {
  const preset =
    MATERIAL_PRESETS.find((entry) => entry.name === asString(args, "preset", MATERIAL_PRESETS[0].name)) ??
    MATERIAL_PRESETS[0];
  const fx = FX_STYLES.find((entry) => entry.id === asString(args, "fx", FX_STYLES[0].id))?.fx ?? FX_STYLES[0].fx;
  return {
    ...FX_DEFAULT,
    base: preset.base,
    secondary: preset.secondary,
    contrast: preset.contrast ?? 1,
    hueShift: preset.hueShift ?? 0,
    outline: true,
    saturationBoost: preset.saturationBoost ?? 0,
    ...preset.fx,
    ...fx,
    name: asString(args, "name", preset.name),
    seed: asNumber(args, "seed", 1),
    noiseAmount: asNumber(args, "noise", 0.3),
    sparkle: asBool(args, "sparkle", false),
  };
}

function runMaterial(command: string, args: Args): StudioResult {
  if (command === "shapes")
    return {
      ok: true,
      engine: "material",
      command,
      text: SHAPES.map((shape) => `${shape.id}\t${shape.category}\t${CATEGORY_LABEL[shape.category]}\t${shape.name}`).join("\n"),
    };
  if (command === "presets")
    return {
      ok: true,
      engine: "material",
      command,
      text: [
        ...MATERIAL_PRESETS.map((preset) => `material\t${preset.name}\t${preset.label}`),
        ...FX_STYLES.map((style) => `fx\t${style.id}\t${style.label}`),
      ].join("\n"),
    };
  const settings = materialSettings(args);
  const wanted = asString(args, "shape", "");
  const shapes = wanted ? SHAPES.filter((shape) => shape.id === wanted) : SHAPES.filter((shape) => shape.category !== "part");
  if (!shapes.length) fail(`unknown shape: ${wanted}`);
  const rendered = shapes.map((shape) => ({ shape, pixels: renderPixels(shape, settings) }));
  const palette = makePalette(settings);
  const scale = asNumber(args, "scale", 1);
  if (command === "render") {
    const files = rendered.map((entry) =>
      file(`${entry.shape.file.replace("{name}", safeName(settings.name))}.png`, pixelsToPng(entry.pixels, scale)),
    );
    return {
      ok: true,
      engine: "material",
      command,
      text: `rendered ${rendered.length} textures (${settings.name})`,
      files,
    };
  }
  if (command === "pack" || command === "export") {
    const options = {
      modId: safeName(asString(args, "modId", "mymod")),
      scale,
      asPack: true,
    };
    const bundle = buildMaterialPackZip(rendered, settings, palette, options);
    return {
      ok: true,
      engine: "material",
      command,
      text: `pack: ${bundle.files.length} files`,
      files: [file(`${safeName(settings.name)}_textures.zip`, bundle.zip)],
    };
  }
  if (command === "folder") {
    const options = { modId: safeName(asString(args, "modId", "mymod")), scale, asPack: false };
    const bundle = buildMaterialFolderZip(rendered, settings, palette, options);
    return {
      ok: true,
      engine: "material",
      command,
      text: `folder: ${bundle.files.length} files`,
      files: [file(`${safeName(settings.name)}_textures.zip`, bundle.zip)],
    };
  }
  return fail(`unknown material command: ${command} (shapes|presets|render|pack|folder)`);
}

/* ---------------- registry ---------------- */

const CORE_ENGINES: RegisteredEngine[] = [
  {
    id: "voxel",
    label: "VoxelForge 3Dモデル",
    group: "3d",
    description: "24形状のキューブモデル。Blockbench / リソースパック / GeckoLib へ書き出し",
    commands: [
      { id: "kinds", summary: "モデル形状の一覧" },
      { id: "generate", summary: "モデル生成 (JSON)", args: ["kind", "seed", "name"] },
      { id: "export", summary: "書き出し", args: ["format", "kind", "seed", "namespace", "modelId", "generation", "mirrorX"] },
    ],
    run: runVoxel,
  },
  {
    id: "armor",
    label: "アーマー生成 (GeckoLib対応)",
    group: "armor",
    description: "8素材スタイル / 3兜プロファイル。バニラ装備 + GeckoLib 5 の8ボーン装備を同時出力",
    commands: [
      { id: "presets", summary: "スタイル・色プリセット一覧" },
      { id: "render", summary: "PNGを生成", args: ["armorId", "style", "seed"] },
      { id: "bundle", summary: "MOD用ZIP一式", args: ["armorId", "namespace", "style", "geckolib", "java"] },
    ],
    run: runArmor,
  },
  {
    id: "mob",
    label: "モブ生成 (GeckoLib対応)",
    group: "mob",
    description: "アーキタイプ別のモブ。Java/Bedrockテクスチャ、Fabric一式、GeckoLib geo+animation",
    commands: [
      { id: "archetypes", summary: "アーキタイプ一覧" },
      { id: "presets", summary: "プリセットモブ一覧" },
      { id: "render", summary: "テクスチャPNG", args: ["archetype", "entityId", "scale"] },
      { id: "bundle", summary: "全形式ZIP", args: ["archetype", "entityId", "modId"] },
      { id: "mcaddon", summary: "Bedrock .mcaddon", args: ["archetype", "entityId"] },
      { id: "fabric", summary: "Fabric 1.21.11 プロジェクト", args: ["archetype", "entityId", "modId"] },
      { id: "geckolib", summary: "GeckoLibアセット+Java", args: ["archetype", "entityId", "modId"] },
    ],
    run: runMob,
  },
  {
    id: "structure",
    label: "NBT構造物",
    group: "structure",
    description: "ボクセル構造のサンプル生成、.nbt / データパック出力",
    commands: [
      { id: "samples", summary: "サンプル一覧" },
      { id: "nbt", summary: ".nbt 出力", args: ["sample", "name", "namespace"] },
      { id: "export", summary: "データパックZIP", args: ["sample", "name", "namespace", "author"] },
    ],
    run: runStructure,
  },
  {
    id: "material",
    label: "マテリアルテクスチャ",
    group: "texture",
    description: "素材名からアイテム/ブロックのテクスチャ群を生成し、リソースパックにまとめる",
    commands: [
      { id: "shapes", summary: "形状一覧" },
      { id: "presets", summary: "素材プリセット一覧" },
      { id: "render", summary: "PNG生成", args: ["preset", "shape", "scale", "seed"] },
      { id: "pack", summary: "リソースパックZIP", args: ["preset", "modId", "scale"] },
      { id: "folder", summary: "フォルダ出力ZIP", args: ["preset", "modId", "scale"] },
    ],
    run: runMaterial,
  },
];

const ENGINES: RegisteredEngine[] = [...PORTED_ENGINES, ...MOD_ENGINES, ...CORE_ENGINES];

export function listEngines(): StudioEngine[] {
  return ENGINES.map(({ id, label, group, description, commands }) => ({
    id,
    label,
    group,
    description,
    // サンプル引数をここで合流させ、コンソールと CLI が同じ情報を見る
    commands: commands.map((command) => {
      const sample = sampleFor(id, command.id);
      return sample ? { ...command, sample } : command;
    }),
  }));
}

export function engineById(id: string): StudioEngine | undefined {
  return listEngines().find((engine) => engine.id === id);
}

/** Runs one engine command. Errors become data so the API stays JSON. */
export async function runStudioCommand(
  engineId: string,
  command: string,
  args: Args = {},
): Promise<StudioResponse> {
  const engine = ENGINES.find((entry) => entry.id === engineId);
  if (!engine)
    return {
      ok: false,
      error: `unknown engine: ${engineId} (${ENGINES.map((entry) => entry.id).join("|")})`,
    };
  try {
    return await engine.run(command, args);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "コマンドの実行に失敗しました。",
    };
  }
}

/** Human-readable capability list, used by `mcasset --engines` and the hub UI. */
export function capabilities(): {
  engines: (StudioEngine & { commands: StudioCommand[] })[];
  generatedAt: string;
} {
  return { engines: listEngines(), generatedAt: new Date().toISOString() };
}
