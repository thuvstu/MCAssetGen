export { toBlockbench } from "./blockbench";
export { toMinecraft } from "./minecraft";
export { toResourcePack } from "./resource-pack";
export {
  toVariantPack,
  customModelDataDefinition,
  type PackVariant,
} from "./variant-pack";
export {
  GECKOLIB_GENERATIONS,
  DEFAULT_GECKOLIB_OPTIONS,
  buildGeckolibLayout,
  geckolibAnimations,
  geckolibAtlas,
  geckolibDependencySnippet,
  geckolibFileList,
  geckolibGeoModel,
  geckolibJavaSources,
  isGeckolibGeneration,
  resolveGeckolibOptions,
  sanitizeModelId,
  sanitizeNamespace,
  toGeckolibBundle,
  type GeckolibBundle,
  type GeckolibGeneration,
  type GeckolibLayout,
  type GeckolibOptions,
} from "./geckolib";
export { VANILLA_ITEM_BY_KIND } from "./display";

export const EXPORT_FORMATS = [
  "bbmodel",
  "resourcepack",
  "png",
  "variantpack",
  "geckolib",
] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export function isExportFormat(value: unknown): value is ExportFormat {
  return EXPORT_FORMATS.includes(value as ExportFormat);
}
