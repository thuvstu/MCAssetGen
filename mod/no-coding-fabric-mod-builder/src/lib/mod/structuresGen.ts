import { createStarterVillageNbt } from "./nbt";
import type { GeneratedFile, ModProject, StructureDef } from "./types";

const js = (o: unknown) => JSON.stringify(o, null, 2) + "\n";

/**
 * Minecraft 1.21.11+ Jigsaw Structure 生成
 * 1. data/<namespace>/structure/<id>.nbt (NBTバイナリ: カスタムインポート or 鍛冶屋村プリセット)
 * 2. data/<namespace>/worldgen/template_pool/<id>.json
 * 3. data/<namespace>/worldgen/structure/<id>.json
 * 4. data/<namespace>/worldgen/structure_set/<id>.json
 */
export function structureResources(project: ModProject): GeneratedFile[] {
  const list = project.structures ?? [];
  if (list.length === 0) return [];

  const id = project.meta.modId;
  const files: GeneratedFile[] = [];
  const res = (path: string, content: string) =>
    files.push({ path: `src/main/resources/${path}`, content, kind: "json" });
  const bin = (path: string, b64: string) =>
    files.push({ path: `src/main/resources/${path}`, content: b64, kind: "binary", encoding: "base64" });

  for (const st of list) {
    const structId = st.id;

    // 1. Structure NBT file
    let nbtB64 = st.nbtBase64;
    if (!nbtB64 || nbtB64.trim().length === 0) {
      // Default: 冒険者の初期村・鍛冶工房 NBT を自動生成
      const buf = createStarterVillageNbt();
      nbtB64 = buf.toString("base64");
    }
    bin(`data/${id}/structure/${structId}.nbt`, nbtB64);

    // 2. template_pool
    res(
      `data/${id}/worldgen/template_pool/${structId}.json`,
      js({
        fallback: "minecraft:empty",
        elements: [
          {
            weight: 1,
            element: {
              element_type: "minecraft:single_pool_element",
              location: `${id}:${structId}`,
              projection: "rigid",
              processors: "minecraft:empty",
            },
          },
        ],
      })
    );

    // 3. structure
    const biomeVal = st.biomes.trim() || "#minecraft:is_overworld";
    res(
      `data/${id}/worldgen/structure/${structId}.json`,
      js({
        type: "minecraft:jigsaw",
        biomes: biomeVal,
        step: st.step || "surface_structures",
        spawn_overrides: {},
        terrain_adaptation: st.terrainAdaptation || "beard_thin",
        start_pool: `${id}:${structId}`,
        size: 1,
        start_height: {
          absolute: 0,
        },
        project_start_to_heightmap: "WORLD_SURFACE_WG",
        max_distance_from_center: 80,
        use_expansion_hack: false,
      })
    );

    // 4. structure_set
    const spacing = st.spawnNearOrigin ? Math.min(st.spacing, 12) : st.spacing;
    const separation = st.spawnNearOrigin ? Math.min(st.separation, 4) : st.separation;
    res(
      `data/${id}/worldgen/structure_set/${structId}.json`,
      js({
        structures: [
          {
            structure: `${id}:${structId}`,
            weight: 1,
          },
        ],
        placement: {
          type: "minecraft:random_spread",
          spacing: Math.max(2, spacing),
          separation: Math.max(1, separation),
          salt: Math.abs(hashString(structId)),
          spread_type: "linear",
          ...(st.spawnNearOrigin ? { locate_offset: [0, 0, 0] } : {}),
        },
      })
    );
  }

  return files;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
}
