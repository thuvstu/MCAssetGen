import { decodeDataUrl } from "@/lib/atlas";
import {
  isExportFormat,
  isGeckolibGeneration,
  toBlockbench,
  toGeckolibBundle,
  toResourcePack,
  toVariantPack,
  type GeckolibOptions,
} from "@/lib/export";
import {
  isPayloadTooLarge,
  jsonError,
  publicErrorMessage,
  readJsonBody,
} from "@/lib/http";
import { generateModel, validateSettings } from "@/lib/model-generator";
import { buildVariants, isVariantFamily } from "@/lib/variants";

export const runtime = "nodejs";

function attachment(body: BodyInit, filename: string, type: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/** Picks the GeckoLib options out of the request body, ignoring unknown keys. */
function geckolibOptionsFrom(value: unknown): Partial<GeckolibOptions> {
  if (typeof value !== "object" || value === null) return {};
  const source = value as Record<string, unknown>;
  const options: Partial<GeckolibOptions> = {};
  if (typeof source.namespace === "string") options.namespace = source.namespace;
  if (typeof source.modelId === "string") options.modelId = source.modelId;
  if (typeof source.javaPackage === "string") options.javaPackage = source.javaPackage;
  if (isGeckolibGeneration(source.generation)) options.generation = source.generation;
  if (typeof source.mirrorX === "boolean") options.mirrorX = source.mirrorX;
  return options;
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const format = body.format;
    if (!isExportFormat(format))
      return jsonError("対応していない形式です。", 400);
    const settings = validateSettings(body.settings);
    const slug = `voxelforge_${settings.kind}`;

    if (format === "variantpack") {
      const family = body.family ?? "all";
      if (!isVariantFamily(family))
        return jsonError("対応していないバリアント種別です。", 400);
      const variants = buildVariants(settings, family).map((spec) => ({
        key: spec.key,
        label: spec.label,
        model: generateModel(spec.settings),
      }));
      return attachment(
        new Uint8Array(toVariantPack(variants, settings.name)),
        `${slug}_${family}_variants.zip`,
        "application/zip",
      );
    }

    const model = generateModel(settings);
    if (format === "png") {
      return attachment(
        new Uint8Array(decodeDataUrl(model.texture.source)),
        `${slug}_atlas.png`,
        "image/png",
      );
    }
    if (format === "geckolib") {
      const bundle = toGeckolibBundle(model, geckolibOptionsFrom(body.geckolib));
      return attachment(
        new Uint8Array(bundle.zip),
        `${slug}_geckolib.zip`,
        "application/zip",
      );
    }
    if (format === "resourcepack") {
      return attachment(
        new Uint8Array(toResourcePack(model)),
        `${slug}_1.21.4.zip`,
        "application/zip",
      );
    }
    return attachment(
      JSON.stringify(toBlockbench(model), null, 2),
      `${slug}.bbmodel`,
      "application/json",
    );
  } catch (error) {
    if (isPayloadTooLarge(error)) return jsonError(error.message, 413);
    return jsonError(
      publicErrorMessage(error, "書き出しに失敗しました。"),
      400,
    );
  }
}
