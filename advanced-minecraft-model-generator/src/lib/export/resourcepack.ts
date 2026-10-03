import JSZip from "jszip";
import { GeneratedModel, GeneratorConfig, UpgradeTier } from "../types";
import { toBBModel } from "./bbmodel";
import { toJavaModel } from "./minecraft";
import { paintAtlas } from "../atlas";
import { sanitizeIdentifier } from "../color";
import { deriveThemeArsenalConfigs, deriveTieredConfig, stripEvolutionSuffix } from "../themes";
import { generateModel } from "../generator";

export function downloadFile(content: string | Blob, filename: string, mime = "application/json") {
  const blob = typeof content === "string" ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Drop-in Minecraft Java resource pack: model, texture, blockbench file, readme. */
export async function createResourcePack(model: GeneratedModel): Promise<Blob> {
  const zip = new JSZip();
  const { config, palette } = model;
  const id = sanitizeIdentifier(config.name);

  zip.file(
    "pack.mcmeta",
    JSON.stringify(
      {
        pack: {
          pack_format: 34,
          description: `[Forge 3D] ${config.name} — ${config.theme}/${config.category}`,
        },
      },
      null,
      2
    )
  );

  zip.file(`assets/minecraft/models/item/${id}.json`, toJavaModel(model));

  const canvas = paintAtlas(palette, config.textureResolution, config.atlasPattern);
  const dataUrl = canvas.toDataURL("image/png");
  zip.file(`assets/minecraft/textures/item/${id}.png`, dataUrl.split(",")[1], { base64: true });

  zip.file(`${id}.bbmodel`, toBBModel(model));

  const readmeLines = [
    config.name,
    "================================================",
    "Generated with Minecraft 3D Forge Studio",
    "",
    `TYPE       : ${String(config.category)}`,
    `THEME      : ${String(config.theme)}`,
    `TIER       : Tier ${String(config.upgradeTier)} (LimitBreak: ${String(config.limitBreak)})`,
    `FORM       : ${String(config.weaponForm)} / MODE: ${String(config.tacticalMode)}`,
    `ELEMENTS   : ${model.stats.elementCount} voxels`,
    `SIZE       : ${model.stats.size.join(" x ")}`,
    `ATLAS      : ${String(config.textureResolution)}x${String(config.textureResolution)} (${String(config.atlasPattern)})`,
    "",
    "INSTALL",
    "1. Copy this zip into .minecraft/resourcepacks/",
    "2. Options -> Resource Packs -> enable it",
    `3. In game the model id is:  minecraft:item/${id}`,
    "",
    "EDIT",
    `Open ${id}.bbmodel in Blockbench (web or desktop) to`,
    "tweak bones, UVs and the 5 included animation tracks.",
  ];
  zip.file("README.txt", readmeLines.join("\n"));

  return zip.generateAsync({ type: "blob" });
}

/**
 * Generates a complete 7-stage Evolution & Limit Break Resource Pack for the
 * SAME weapon: Tier I..V + ★ Overlimit + ★★ Genesis, wired to CustomModelData 1001..1007.
 */
export async function createTierProgressionPack(baseConfig: GeneratorConfig): Promise<Blob> {
  const zip = new JSZip();
  const cleanName = stripEvolutionSuffix(baseConfig.name) || "weapon";
  const baseId = sanitizeIdentifier(cleanName);

  zip.file(
    "pack.mcmeta",
    JSON.stringify(
      {
        pack: {
          pack_format: 34,
          description: `§6[Forge 3D Evolution]§f ${cleanName} (Tier I-V + Limit Break)`,
        },
      },
      null,
      2
    )
  );

  const stages: { label: string; suffix: string; cfg: GeneratorConfig; cmd: number }[] = [
    ...([1, 2, 3, 4, 5] as UpgradeTier[]).map((t) => ({
      label: `Tier ${t}`,
      suffix: `tier_${t}`,
      cfg: deriveTieredConfig({ ...baseConfig, limitBreak: 0 }, t, 0),
      cmd: 1000 + t,
    })),
    {
      label: "Limit Break ★ OVERLIMIT",
      suffix: "tier_6_overlimit",
      cfg: deriveTieredConfig(baseConfig, 5, 1),
      cmd: 1006,
    },
    {
      label: "Transcendence ★★ GENESIS",
      suffix: "tier_7_genesis",
      cfg: deriveTieredConfig(baseConfig, 5, 2),
      cmd: 1007,
    },
  ];

  const overrides: { predicate: { custom_model_data: number }; model: string }[] = [];
  const commandLines: string[] = [
    `# ${cleanName} — 段階強化 & 限界突破 CustomModelData コマンド一覧`,
    `# Minecraft 1.20.5+ / 1.21+ 用:`,
    "",
  ];

  for (const st of stages) {
    const modelId = `${baseId}_${st.suffix}`;
    const built = generateModel({ ...st.cfg, name: modelId });

    zip.file(`assets/minecraft/models/item/${modelId}.json`, toJavaModel(built));

    const canvas = paintAtlas(
      built.palette,
      built.config.textureResolution,
      built.config.atlasPattern
    );
    const dataUrl = canvas.toDataURL("image/png");
    zip.file(`assets/minecraft/textures/item/${modelId}.png`, dataUrl.split(",")[1], {
      base64: true,
    });

    zip.file(`blockbench/${modelId}.bbmodel`, toBBModel(built));

    overrides.push({
      predicate: { custom_model_data: st.cmd },
      model: `item/${modelId}`,
    });

    commandLines.push(
      `## ${st.label} (${st.cfg.name} / ${built.stats.elementCount} voxels)`,
      `/give @p minecraft:netherite_sword[minecraft:custom_model_data=${st.cmd},minecraft:item_name='{"text":"${st.cfg.name}","color":"gold"}'] 1`,
      ""
    );
  }

  // Override file for netherite_sword so CustomModelData works out-of-the-box
  zip.file(
    "assets/minecraft/models/item/netherite_sword.json",
    JSON.stringify(
      {
        parent: "minecraft:item/handheld",
        textures: { layer0: "minecraft:item/netherite_sword" },
        overrides,
      },
      null,
      2
    )
  );

  zip.file("COMMANDS.txt", commandLines.join("\n"));
  return zip.generateAsync({ type: "blob" });
}

/**
 * Generates all 14 weapon/armor/relic categories unified under the current
 * theme, palette, tier, form & limit break into one Arsenal Resource Pack.
 */
export async function createThemeArsenalPack(baseConfig: GeneratorConfig): Promise<Blob> {
  const zip = new JSZip();
  const arsenalConfigs = deriveThemeArsenalConfigs(baseConfig);

  zip.file(
    "pack.mcmeta",
    JSON.stringify(
      {
        pack: {
          pack_format: 34,
          description: `§b[Forge 3D Arsenal]§f ${baseConfig.theme.toUpperCase()} Complete 14-Item Set`,
        },
      },
      null,
      2
    )
  );

  const overrides: { predicate: { custom_model_data: number }; model: string }[] = [];
  const commandLines: string[] = [
    `# ${baseConfig.theme.toUpperCase()} テーマ 14種兵装一式コマンド一覧`,
    `# Minecraft 1.20.5+ / 1.21+ 用:`,
    "",
  ];

  arsenalConfigs.forEach((cfg, idx) => {
    const cmd = 2001 + idx;
    const modelId = `${baseConfig.theme}_${cfg.category}`;
    const built = generateModel({ ...cfg, name: modelId });

    zip.file(`assets/minecraft/models/item/${modelId}.json`, toJavaModel(built));

    const canvas = paintAtlas(
      built.palette,
      built.config.textureResolution,
      built.config.atlasPattern
    );
    const dataUrl = canvas.toDataURL("image/png");
    zip.file(`assets/minecraft/textures/item/${modelId}.png`, dataUrl.split(",")[1], {
      base64: true,
    });

    zip.file(`blockbench/${modelId}.bbmodel`, toBBModel(built));

    overrides.push({
      predicate: { custom_model_data: cmd },
      model: `item/${modelId}`,
    });

    commandLines.push(
      `## [${cfg.category}] ${cfg.name} (${built.stats.elementCount} voxels)`,
      `/give @p minecraft:netherite_sword[minecraft:custom_model_data=${cmd},minecraft:item_name='{"text":"${cfg.name}","color":"aqua"}'] 1`,
      ""
    );
  });

  zip.file(
    "assets/minecraft/models/item/netherite_sword.json",
    JSON.stringify(
      {
        parent: "minecraft:item/handheld",
        textures: { layer0: "minecraft:item/netherite_sword" },
        overrides,
      },
      null,
      2
    )
  );

  zip.file("COMMANDS.txt", commandLines.join("\n"));
  return zip.generateAsync({ type: "blob" });
}
