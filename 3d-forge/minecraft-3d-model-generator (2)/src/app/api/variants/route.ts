import {
  isPayloadTooLarge,
  jsonError,
  publicErrorMessage,
  readJsonBody,
} from "@/lib/http";
import { generateModel, validateSettings } from "@/lib/model-generator";
import { buildVariants, isVariantFamily } from "@/lib/variants";

export const runtime = "nodejs";

/**
 * Previews a family of derived models. Textures and the uploaded atlas are
 * stripped to keep the response small; the client re-applies its own atlas.
 */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    if (!isVariantFamily(body.family))
      return jsonError("対応していないバリアント種別です。", 400);
    const base = validateSettings(body.settings);

    const variants = buildVariants(base, body.family).map((spec) => {
      const model = generateModel(spec.settings);
      const { atlas: _atlas, ...settings } = spec.settings;
      return {
        key: spec.key,
        family: spec.family,
        label: spec.label,
        settings,
        cubes: model.cubes,
        palette: model.palette,
      };
    });
    return Response.json({ variants });
  } catch (error) {
    if (isPayloadTooLarge(error)) return jsonError(error.message, 413);
    return jsonError(
      publicErrorMessage(error, "バリアントを生成できませんでした。"),
      400,
    );
  }
}
