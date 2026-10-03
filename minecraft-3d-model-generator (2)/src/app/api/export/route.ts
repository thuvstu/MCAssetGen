import { decodeDataUrl } from "@/lib/atlas";
import {
  isExportFormat,
  toBlockbench,
  toResourcePack,
  toVariantPack,
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
