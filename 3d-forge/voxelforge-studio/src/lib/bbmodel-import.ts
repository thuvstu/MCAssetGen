import { DEFAULT_PALETTE, DEFAULT_SETTINGS, type GeneratedModel, type ModelCube, type SavedProject, type Vec3 } from "@/lib/model-types";

// Blockbench (.bbmodel v4) -> VoxelForge SavedProject converter.
// Imports box elements as reference cubes (first available face UV wins).
// Outliner groups, animations and per-face UVs beyond the first face are ignored.

interface BbFace {
  uv?: [number, number, number, number];
  texture?: number | null;
}
interface BbElement {
  name?: string;
  from?: [number, number, number];
  to?: [number, number, number];
  color?: number;
  faces?: Record<string, BbFace>;
}
interface BbModel {
  name?: string;
  resolution?: { width?: number; height?: number };
  elements?: BbElement[];
  textures?: { name?: string; source?: string }[];
}

const BB_COLORS = [
  "#ffffff", "#ff4040", "#ff8040", "#ffbf40", "#ffff40", "#80ff40",
  "#40ff40", "#40ffbf", "#40ffff", "#40bfff", "#4080ff", "#4040ff",
  "#8040ff", "#bf40ff", "#ff40ff", "#ff40bf",
];

function toVec3(v: [number, number, number] | undefined, fallback: Vec3): Vec3 {
  if (!v || v.length !== 3 || v.some((n) => typeof n !== "number" || !Number.isFinite(n))) return fallback;
  return [v[0], v[1], v[2]];
}

export function convertBbmodel(raw: unknown, fileName: string): SavedProject {
  if (!raw || typeof raw !== "object") throw new Error("bbmodel JSONではありません");
  const data = raw as BbModel;
  if (!Array.isArray(data.elements) || !data.elements.length) throw new Error("elements がありません");
  const cubes: ModelCube[] = data.elements.map((el, i) => {
    const faces = el.faces ?? {};
    const first = faces.north ?? faces.south ?? faces.east ?? faces.west ?? faces.up ?? faces.down;
    const uv = Array.isArray(first?.uv) && first.uv.length === 4 ? (first.uv as [number, number, number, number]) : ([0, 0, 8, 8] as [number, number, number, number]);
    return {
      name: typeof el.name === "string" && el.name ? el.name : `cube_${i + 1}`,
      from: toVec3(el.from, [0, 0, 0]),
      to: toVec3(el.to, [8, 8, 8]),
      color: BB_COLORS[el.color ?? 0] ?? "#ffffff",
      material: 0,
      uv,
    };
  });
  const tex = Array.isArray(data.textures) ? data.textures[0] : undefined;
  const resW = data.resolution?.width ?? 16;
  const resH = data.resolution?.height ?? 16;
  const base = typeof data.name === "string" && data.name ? data.name : fileName.replace(/\.bbmodel$/i, "");
  const settings = { ...DEFAULT_SETTINGS, name: base, kind: "relic" as const, prompt: `imported:${base}` };
  const model: GeneratedModel = {
    cubes,
    texture: { source: typeof tex?.source === "string" ? tex.source : "", width: resW, height: resH, name: typeof tex?.name === "string" ? tex.name : "imported" },
    palette: DEFAULT_PALETTE,
    settings,
  };
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), name: base, kind: "relic", settings, model, createdAt: now, updatedAt: now };
}
