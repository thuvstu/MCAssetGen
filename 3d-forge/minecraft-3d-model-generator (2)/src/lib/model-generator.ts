import {
  createFallbackAtlas,
  FALLBACK_ATLAS_SIZE,
  matchPaletteToTiles,
  sampleAtlasTiles,
  toHexColor,
} from "./atlas";
import { applyCubeEdits } from "./editor-recipe";
import { buildGeometry, paletteForPrompt } from "./geometry";
import { buildAttachments } from "./geometry/attachments";
import {
  normalizeSettings,
  type AtlasInput,
  type GeneratedModel,
  type ModelSettings,
  type UVRect,
} from "./model-types";
import { ValidationError } from "./settings-schema";
import { finishTexture } from "./texture-finishing";
export { validateSettings, ValidationError } from "./settings-schema";

const fallbackCache = new Map<string, string>();
function fallbackTexture(
  settings: ModelSettings,
  palette: string[],
): AtlasInput {
  const key = palette.join(",");
  let source = fallbackCache.get(key);
  if (!source) {
    source = createFallbackAtlas(palette);
    if (fallbackCache.size >= 24)
      fallbackCache.delete(fallbackCache.keys().next().value!);
    fallbackCache.set(key, source);
  }
  return {
    source,
    width: FALLBACK_ATLAS_SIZE,
    height: FALLBACK_ATLAS_SIZE,
    name: `${settings.kind === "sword" ? "crystal_sword" : settings.kind}_atlas.png`,
  };
}
export function generateModel(input: ModelSettings): GeneratedModel {
  const settings = normalizeSettings(input);
  let palette =
      settings.paletteOverride ??
      paletteForPrompt(settings.prompt, settings.kind),
    regions: UVRect[] | undefined;
  if (settings.limitBreak && !settings.atlas) {
    palette = [...palette];
    palette[4] = "#fff3cf";
    palette[6] = "#f3c35a";
  }
  const texture = settings.atlas ?? fallbackTexture(settings, palette);
  if (settings.atlas) {
    const tiles = sampleAtlasTiles(settings.atlas);
    if (!tiles.length)
      throw new ValidationError(
        "アトラスが透明です。色のあるPNG画像を選んでください。",
      );
    const matches = matchPaletteToTiles(palette, tiles, settings.autoUV);
    regions = matches.map((tile) => tile.uv);
    palette = matches.map((tile) => toHexColor(tile.color));
  }
  const base = [
    ...buildGeometry(settings, palette, regions),
    ...buildAttachments(settings, palette, regions),
  ];
  const custom = (settings.customCubes ?? []).map((c) => ({
    ...c,
    painted: true,
  }));
  const cubes = applyCubeEdits(base, settings.edits, custom);
  return finishTexture({ cubes, texture, palette, settings });
}
