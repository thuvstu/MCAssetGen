import { inspectExport } from "./export-check";
import { zipSync, strToU8 } from "fflate";
import { accentEntries, colorPng } from "./color-textures";
import { NAMESPACE, baseItemOf, fancyGiveCommand, giveCommand, itemDefinition, modelAtStage, poseOf, toBlockbenchJson, toMinecraftJson, type VoxelModel } from "./models";
import { createPackIconPng, createShimmerStripBytes, decodeTexturePng, textureDataUrl, canShimmer, createShimmerStrip, SHIMMER_FRAMES } from "./texture";
import { toBlockbenchAnimatedJson } from "./animation";
import { effectOf, normalizeExtras } from "./decor";

export type ExportFormat = "minecraft" | "blockbench" | "bundle" | "blockbench_anim" | "datapack";
export { textureDataUrl };

function saveFile(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export function downloadTexture(model: VoxelModel) {
  const colors = accentEntries(model);
  if (!colors.length) { saveFile(decodeTexturePng(model).buffer as ArrayBuffer, `${model.slug}.png`, "image/png"); return; }
  const files = { [`${model.slug}.png`]: decodeTexturePng(model), ...Object.fromEntries(colors.map(entry => [`${model.slug}_${entry.key}.png`, colorPng(entry.color)])) };
  saveFile(zipSync(files).buffer as ArrayBuffer, `${model.slug}_textures.zip`, "application/zip");
}

export function packReadme(model: VoxelModel) {
  const bow = poseOf(model) === "bow";
  return [
    `================================================================`,
    ` VoxelForge — Minecraft Java Edition 1.21.4 リソースパック`,
    ` モデル名: ${model.name}`,
    `================================================================`,
    "",
    "■ 導入手順（Minecraft Java 1.21.4 向け / ゲーム内の目視は未検証）",
    "1. この ZIP ファイルを解凍せず、そのまま Minecraft の resourcepacks フォルダに入れます。",
    "   ・Windows: %appdata%\\.minecraft\\resourcepacks\\",
    "   ・Mac: ~/Library/Application Support/minecraft/resourcepacks/",
    "   ・Linux: ~/.minecraft/resourcepacks/",
    "",
    "2. Minecraft を起動し、「設定」>「リソースパック」を開きます。",
    "   「利用可能」一覧から本パックを選択し、右側の「選択中」に移動して「完了」を押します。",
    "",
    "3. ワールドに入り（チートON）、標準コマンドをチャット欄に入力します（権限が必要です）:",
    "",
    "   [標準コマンド]",
    `   ${giveCommand(model)}`,
    "",
    "   [装飾付きコマンド（コマンドブロック用・名前と不壊が追加されます）]",
    `   ${fancyGiveCommand(model)}`,
    "",
    "■ 実機動作の仕様と特徴",
    "   ・1.21.4 最新の item_model コンポーネント方式を採用しています。",
    "   ・元のアイテムの性能、攻撃力、攻撃速度、耐久値、エンチャントはそのまま使えます。",
    bow ? "   ・弓: バニラ同様、右クリックで引くと3段階（pulling 0〜2）でモデルが自動的に切り替わります。" : "",
    ...(canShimmer(model) ? [`   ・テクスチャアニメーション: ${model.slug}.png は ${SHIMMER_FRAMES} フレームの mcmeta アニメーションが付属し、ゲーム内でテクスチャが明滅します。`] : []),
    ...(normalizeExtras(model.extras).effect !== "none" ? [`   ・パーティクル効果: ゲーム内で粒子を出す場合は、別ファイルの「パーティクル用データパック」を world/datapacks/ に導入してください。`] : []),
    "   ・テクスチャと参照先を同梱しています。ゲーム内での読み込み・手持ち表示・他パックとの併用は別途確認が必要です。",
    "   ・独立した装飾色は追加PNGとして同梱します。main textureだけでなくassets全体を配置してください。",
    "   ・このパックは外見を変更するものです。杖の魔法、周囲を照らす動的光源、トライデントの投擲モデル、置ける家具は追加しません。",
    "",
    "■ パック同梱ファイル構成",
    "   pack.mcmeta                                    パックメタデータ（format 46）",
    "   pack.png                                       パック一覧用アイコン画像（64x64）",
    "   assets/minecraft/atlases/blocks.json           テクスチャアトラス自動結合設定",
    `   assets/${NAMESPACE}/items/${model.slug}.json       アイテム定義（1.21.4仕様）`,
    `   assets/${NAMESPACE}/models/item/${model.slug}.json  3DモデルJSON${bow ? " (+ 引き絞り3段階)" : ""}`,
    `   assets/${NAMESPACE}/textures/item/${model.slug}.png テクスチャ画像`,
    ...(canShimmer(model) ? [`   assets/${NAMESPACE}/textures/item/${model.slug}.png.mcmeta アニメーションメタデータ`] : []),
    "",
    "■ Blockbench での編集",
    "   Blockbench を開き、assets/voxelforge/models/item/ 内の JSON を読み込み、",
    "   テクスチャとして assets/voxelforge/textures/item/ の PNG を指定すると再編集できます。",
    "",
  ].join("\n");
}

const pngFromCanvas = (canvas: HTMLCanvasElement) => Uint8Array.from(atob(canvas.toDataURL("image/png").split(",")[1] ?? ""), c => c.charCodeAt(0));

/** Data pack that emits the chosen vanilla particle around players holding this item (1.21.4). */
export function buildDatapack(model: VoxelModel): Record<string, Uint8Array> | null {
  const effect = effectOf(normalizeExtras(model.extras).effect);
  if (effect.id === "none") return null;
  const line = (slot: string) => `execute as @a at @s if items entity @s ${slot} *[minecraft:item_model="${NAMESPACE}:${model.slug}"] run particle ${effect.particle} ${effect.offset} ${effect.delta} ${effect.speed} ${effect.count} normal`;
  const readme = [
    `VoxelForge エフェクト用データパック — ${model.name}`, "",
    `効果: ${effect.label}（${effect.particle}）`,
    "このデータパックを world/datapacks に入れると、対象アイテムを手に持っているプレイヤーの周囲に毎tick粒子を出します。",
    "対象: item_model コンポーネントが、対応するリソースパックのアイテムと一致するもの。",
    "対象バージョン: Minecraft Java Edition 1.21.4（data pack format 61）。他のバージョンとゲーム内での見え方は未検証です。", "",
  ].join("\n");
  return {
    "pack.mcmeta": strToU8(JSON.stringify({ pack: { pack_format: 61, description: `VoxelForge effect — ${model.name}` } }, null, 2)),
    [`data/${NAMESPACE}/function/tick_${model.slug}.mcfunction`]: strToU8([`# VoxelForge — ${model.name}: ${effect.label}`, line("weapon.mainhand"), line("weapon.offhand"), ""].join("\n")),
    "data/minecraft/tags/function/tick.json": strToU8(JSON.stringify({ values: [`${NAMESPACE}:tick_${model.slug}`] }, null, 2)),
    "README.txt": strToU8(readme),
  };
}

export function buildPack(model: VoxelModel): Record<string, Uint8Array> {
  const atlasConfig = {
    sources: [
      {
        type: "directory",
        source: "item",
        prefix: "item/",
      },
    ],
  };

  const files: Record<string, Uint8Array> = {
    "pack.mcmeta": strToU8(JSON.stringify({
      pack: {
        description: `VoxelForge — ${model.name}`,
        pack_format: 46,
        supported_formats: [46, 46],
      },
    }, null, 2)),
    "pack.png": createPackIconPng(model),
    "assets/minecraft/atlases/blocks.json": strToU8(JSON.stringify(atlasConfig, null, 2)),
    [`assets/${NAMESPACE}/items/${model.slug}.json`]: strToU8(JSON.stringify(itemDefinition(model), null, 2)),
    [`assets/${NAMESPACE}/models/item/${model.slug}.json`]: strToU8(JSON.stringify(toMinecraftJson(model), null, 2)),
    [`assets/${NAMESPACE}/textures/item/${model.slug}.png`]: canShimmer(model) ? createShimmerStripBytes(model) : decodeTexturePng(model),
    "README.txt": strToU8(packReadme(model)),
  };
  for (const entry of accentEntries(model)) files[`assets/${NAMESPACE}/textures/item/${model.slug}_${entry.key}.png`] = colorPng(entry.color);
  if (canShimmer(model)) files[`assets/${NAMESPACE}/textures/item/${model.slug}.png.mcmeta`] = strToU8(JSON.stringify({ animation: { frametime: 3, interpolate: true } }, null, 2));
  model.variants?.forEach((variant, stage) => {
    files[`assets/${NAMESPACE}/models/item/${model.slug}${variant.suffix}.json`] = strToU8(JSON.stringify(toMinecraftJson(modelAtStage(model, stage), stage), null, 2));
  });
  return files;
}

export function exportModel(model: VoxelModel, format: ExportFormat) {
  const errors = inspectExport(model).filter(check => check.status === "error");
  if (errors.length) throw new Error(errors.map(check => check.detail).join(" "));
  if (format === "minecraft") {
    saveFile(JSON.stringify(toMinecraftJson(model), null, 2), `${model.slug}.json`, "application/json");
  } else if (format === "blockbench") {
    saveFile(JSON.stringify(toBlockbenchJson(model, textureDataUrl(model)), null, 2), `${model.slug}.bbmodel`, "application/json");
  } else if (format === "blockbench_anim") {
    const project = toBlockbenchAnimatedJson(model, textureDataUrl(model));
    if (!project.animations.length) throw new Error("アニメーションが設定されていません。本体・装飾・トランスフォームのいずれかを選んでください。");
    saveFile(JSON.stringify(project, null, 2), `${model.slug}_animated.bbmodel`, "application/json");
  } else if (format === "datapack") {
    const pack = buildDatapack(model);
    if (!pack) throw new Error("パーティクルのエフェクトを選択してください。");
    saveFile(zipSync(pack).buffer as ArrayBuffer, `${model.slug}_particles_datapack.zip`, "application/zip");
  } else {
    saveFile(zipSync(buildPack(model)).buffer as ArrayBuffer, `${model.slug}_resourcepack.zip`, "application/zip");
  }
}
