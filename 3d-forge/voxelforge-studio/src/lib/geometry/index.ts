import type { ModelCube, ModelSettings, UVRect } from "../model-types";
import { GeometryBuilder } from "./builder";
import { applyFloaters } from "./floaters";
import { applyForm, applyLimitBreak, applyMode, applyTier } from "./modifiers";
import { normalizeCubes } from "./normalize";
import { paletteForPrompt } from "./palette";
import { SHAPE_BUILDERS } from "./shapes";

export { paletteForPrompt } from "./palette";
export { GeometryBuilder } from "./builder";

/**
 * Builds the cube list for a model:
 * template shape → form change → floaters → upgrades/limit break/overdrive → fit.
 */
export function buildGeometry(
  settings: ModelSettings,
  palette: string[] = paletteForPrompt(settings.prompt, settings.kind),
  regions?: UVRect[],
): ModelCube[] {
  const builder = new GeometryBuilder(settings, palette, regions);
  SHAPE_BUILDERS[settings.kind](builder);
  applyForm(builder);
  applyFloaters(builder);
  applyTier(builder);
  applyLimitBreak(builder);
  applyMode(builder);
  return normalizeCubes(builder.cubes, settings);
}
