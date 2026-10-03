import { strToU8, zipSync } from "fflate";
import { decodeDataUrl } from "../atlas";
import type { GeneratedModel } from "../model-types";
import { VANILLA_ITEM_BY_KIND } from "./display";
import { toMinecraft } from "./minecraft";

/** pack_format for Minecraft Java Edition 1.21.4. */
const PACK_FORMAT = 46;

function readmeFor(model: GeneratedModel, item: string): string {
  const notes: string[] = [];
  if (model.cubes.some((cube) => cube.layer === "floater"))
    notes.push("浮遊物を含むモデルです。");
  if (model.settings.animation && model.settings.animation !== "none") {
    notes.push(
      "アニメーション付きで使うには .bbmodel を Blockbench で開いてください。",
    );
  }
  if (model.settings.effect === "glow" || model.settings.effect === "magic") {
    notes.push(
      "発光・粒子・点光源はアプリ内演出です。バニラのアイテムモデルには粒子や点光源は含まれません。",
    );
  }

  return [
    `VoxelForge — ${model.settings.name}`,
    "",
    "Minecraft Java Edition 1.21.4",
    "",
    "1. Put this ZIP into your .minecraft/resourcepacks folder.",
    "2. Enable it in Options > Resource Packs.",
    `3. This pack replaces minecraft:${item}.`,
    "",
    "日本語: このZIPをresourcepacksフォルダに入れ、設定から有効にしてください。",
    `置き換え対象: minecraft:${item}`,
    "盾とブロックは表示用アイテムとしてpaperを置き換えます。",
    ...(notes.length ? ["", ...notes] : []),
    "",
    "UVグラデーションとパーツの塗りはPNGに焼き込まれています。",
    "Minecraftのアイテムモデルは静止状態です。可動パーツ・アニメーションはBlockbenchで編集してください。",
    "For further editing, export a .bbmodel file from VoxelForge and open it in Blockbench.",
    "",
  ].join("\n");
}

/** Packs the model, texture and item definition into a loadable resource pack. */
export function toResourcePack(model: GeneratedModel): Uint8Array {
  const item = VANILLA_ITEM_BY_KIND[model.settings.kind];
  const json = (value: unknown) => strToU8(JSON.stringify(value, null, 2));

  return zipSync({
    "pack.mcmeta": json({
      pack: {
        pack_format: PACK_FORMAT,
        description: `VoxelForge · ${model.settings.name}`,
      },
    }),
    "assets/voxelforge/models/item/model.json": json(toMinecraft(model)),
    "assets/voxelforge/textures/item/model.png": new Uint8Array(
      decodeDataUrl(model.texture.source),
    ),
    [`assets/minecraft/items/${item}.json`]: json({
      model: { type: "minecraft:model", model: "voxelforge:item/model" },
    }),
    "README.txt": strToU8(readmeFor(model, item)),
  });
}
