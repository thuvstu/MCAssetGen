import { strToU8, zipSync } from "fflate";
import { buildDatapackZip } from "./structure-datapack";
import { encodeNbtRoot } from "./structure-nbt";
import { DEFAULT_DATAVERSION } from "./structure-data";
import {
  SAMPLES,
  structureToMcFunction,
  structureToNbt,
  type NbtWriteOptions,
  type Structure,
} from "./structure-model";
import { DEFAULT_META, validateStructure, type ProjectMeta } from "./structure-ops";

/**
 * Server-side helpers for the NBT structure generator.
 *
 * Everything here is pure (fflate + the ported encoder), so the same structures
 * that the Vite studio exports can be produced by an API route.
 */

export { SAMPLES, structureToMcFunction, DEFAULT_META, validateStructure };
export type { Structure, ProjectMeta, NbtWriteOptions };

export interface StructureExport {
  /** Raw structure NBT bytes as written into the datapack. */
  nbt: Uint8Array;
  /** Datapack ZIP containing the structure, README and pack.mcmeta. */
  datapack: Uint8Array;
  files: string[];
  validation: ReturnType<typeof validateStructure>;
}

export interface StructureRequest {
  structure: Structure;
  meta?: Partial<ProjectMeta>;
  options?: NbtWriteOptions;
}

/** Structure → .nbt + installable datapack, like the studio's export tab. */
export function exportStructure(request: StructureRequest): StructureExport {
  const meta: ProjectMeta = { ...DEFAULT_META, ...(request.meta ?? {}) };
  const dataVersion = meta.dataVersion || DEFAULT_DATAVERSION;
  const nbt = structureNbtBytes(request.structure, meta, request.options);
  const validation = validateStructure(request.structure);
  const datapack = buildDatapackZip({
    packName: meta.fileName,
    namespace: meta.packNamespace,
    structName: meta.fileName,
    nbt,
    dataVersion,
    validation,
    author: meta.author,
  });
  const folder = dataVersion >= 3953 ? "structure" : "structures";
  return {
    nbt,
    datapack,
    files: [
      `data/${meta.packNamespace}/${folder}/${meta.fileName}.nbt`,
      "pack.mcmeta",
      "README.txt",
    ],
    validation,
  };
}

/** Standalone .nbt bytes (single-file export). */
export function structureNbtBytes(
  structure: Structure,
  meta: Partial<ProjectMeta> = {},
  options?: NbtWriteOptions,
): Uint8Array {
  const merged: ProjectMeta = { ...DEFAULT_META, ...meta };
  return encodeNbtRoot(
    structureToNbt(
      structure,
      merged.author,
      merged.dataVersion || DEFAULT_DATAVERSION,
      options,
    ),
    "",
  );
}

/** zips a text-file map (used by the studio hub for small multi-file exports). */
export function zipText(files: Record<string, string>): Uint8Array {
  const encoded: Record<string, Uint8Array> = {};
  for (const [path, value] of Object.entries(files))
    encoded[path] = strToU8(value);
  return zipSync(encoded);
}

/** Renders the ported sample structures by id (used by the API and the hub UI). */
export function sampleStructure(id: string): Structure | undefined {
  return SAMPLES.find((sample) => sample.id === id)?.make();
}
