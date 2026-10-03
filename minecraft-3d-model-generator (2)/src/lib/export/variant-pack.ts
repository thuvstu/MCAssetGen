import { strToU8, zipSync } from "fflate";
import { decodeDataUrl } from "../atlas";
import type { GeneratedModel } from "../model-types";
import { toBlockbench } from "./blockbench";
import { VANILLA_ITEM_BY_KIND } from "./display";
import { toMinecraft } from "./minecraft";

const PACK_FORMAT = 46;

export interface PackVariant {
  key: string;
  label: string;
  model: GeneratedModel;
}

interface DispatchEntry {
  threshold: number;
  slug: string;
  label: string;
}

const json = (value: unknown) => strToU8(JSON.stringify(value, null, 2));

/** Resource locations only allow lowercase letters, digits and `_`. */
const slugFor = (variant: PackVariant) =>
  `${variant.model.settings.kind}_${variant.key}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");

/**
 * 1.21.4 item model definition: picks a variant from the item's
 * `custom_model_data` float and falls back to the vanilla look.
 */
export function customModelDataDefinition(
  item: string,
  entries: DispatchEntry[],
) {
  return {
    model: {
      type: "minecraft:range_dispatch",
      property: "minecraft:custom_model_data",
      index: 0,
      entries: entries.map((entry) => ({
        threshold: entry.threshold,
        model: {
          type: "minecraft:model",
          model: `voxelforge:item/${entry.slug}`,
        },
      })),
      fallback: { type: "minecraft:model", model: `minecraft:item/${item}` },
    },
  };
}

function readme(title: string, byItem: Map<string, DispatchEntry[]>): string {
  const lines = [
    `VoxelForge — ${title}`,
    "",
    "Minecraft Java Edition 1.21.4 / Custom Model Data",
    "",
    "resourcepacks フォルダに入れて有効にし、次のコマンドで各バリアントを入手できます。",
    "",
  ];
  for (const [item, entries] of byItem) {
    for (const entry of entries) {
      lines.push(
        `${entry.label}: /give @p minecraft:${item}[minecraft:custom_model_data={floats:[${entry.threshold}f]}]`,
      );
    }
  }
  lines.push(
    "",
    "段階強化・形態変化・一時モードの切り替えは、データパックやプラグインで",
    "アイテムの custom_model_data を書き換えることで実現できます（例: /item modify）。",
    "",
    "blockbench/ フォルダには各バリアントの .bbmodel（テクスチャ・アニメーション入り）が入っています。",
    "Minecraft のアイテムモデルは静止モデルのため、アニメーションは Blockbench 上で利用してください。",
    "",
  );
  return lines.join("\n");
}

/** Packs every variant as a .bbmodel plus a CMD-driven resource pack. */
export function toVariantPack(
  variants: PackVariant[],
  title: string,
): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "pack.mcmeta": json({
      pack: { pack_format: PACK_FORMAT, description: `VoxelForge · ${title}` },
    }),
  };
  const byItem = new Map<string, DispatchEntry[]>();

  for (const variant of variants) {
    const slug = slugFor(variant);
    files[`assets/voxelforge/models/item/${slug}.json`] = json(
      toMinecraft(variant.model, `voxelforge:item/${slug}`),
    );
    files[`assets/voxelforge/textures/item/${slug}.png`] = new Uint8Array(
      decodeDataUrl(variant.model.texture.source),
    );
    files[`blockbench/${slug}.bbmodel`] = json(toBlockbench(variant.model));

    const item = VANILLA_ITEM_BY_KIND[variant.model.settings.kind];
    const entries = byItem.get(item) ?? [];
    entries.push({
      threshold: entries.length + 1,
      slug,
      label: variant.model.settings.name,
    });
    byItem.set(item, entries);
  }

  for (const [item, entries] of byItem) {
    files[`assets/minecraft/items/${item}.json`] = json(
      customModelDataDefinition(item, entries),
    );
  }
  files["README.txt"] = strToU8(readme(title, byItem));
  return zipSync(files);
}
