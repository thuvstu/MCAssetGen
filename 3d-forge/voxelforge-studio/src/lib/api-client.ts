import type { ExportFormat, GeckolibGeneration } from "./export";
import type {
  GeneratedModel,
  ModelCube,
  ModelSettings,
  SavedProject,
} from "./model-types";
import type { VariantFamily, VariantSpec } from "./variants";

export interface VariantPreview {
  key: string;
  family: VariantSpec["family"];
  label: string;
  settings: Omit<ModelSettings, "atlas">;
  cubes: ModelCube[];
  palette: string[];
}

async function errorFrom(response: Response, fallback: string): Promise<Error> {
  try {
    const data = await response.json();
    return new Error(typeof data?.error === "string" ? data.error : fallback);
  } catch {
    return new Error(fallback);
  }
}

async function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function listProjects(): Promise<SavedProject[]> {
  const response = await fetch("/api/models");
  if (!response.ok)
    throw await errorFrom(response, "モデル一覧を取得できませんでした。");
  const data = await response.json();
  return data.projects as SavedProject[];
}

export async function requestModel(
  settings: ModelSettings,
  persist: boolean,
): Promise<{ model: GeneratedModel; project?: SavedProject }> {
  const response = await postJson("/api/models", { settings, persist });
  if (!response.ok) throw await errorFrom(response, "生成に失敗しました。");
  return response.json();
}

/** Generates a model without saving it or touching editor state. */
export async function previewModel(
  settings: ModelSettings,
): Promise<GeneratedModel> {
  return (await requestModel(settings, false)).model;
}

export async function requestVariants(
  settings: ModelSettings,
  family: VariantFamily,
): Promise<VariantPreview[]> {
  const response = await postJson("/api/variants", { settings, family });
  if (!response.ok)
    throw await errorFrom(response, "バリアントを生成できませんでした。");
  return (await response.json()).variants as VariantPreview[];
}

export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`/api/models/${id}`, { method: "DELETE" });
  if (!response.ok) throw await errorFrom(response, "削除できませんでした。");
}

export interface GeckolibExportRequest {
  namespace: string;
  modelId: string;
  generation: GeckolibGeneration;
  mirrorX: boolean;
}

export async function exportModel(
  settings: ModelSettings,
  format: ExportFormat,
  family?: VariantFamily,
  geckolib?: GeckolibExportRequest,
): Promise<{ blob: Blob; filename: string }> {
  const response = await postJson("/api/export", {
    settings,
    format,
    family,
    geckolib,
  });
  if (!response.ok)
    throw await errorFrom(response, "エクスポートできませんでした。");
  const filename =
    response.headers
      .get("Content-Disposition")
      ?.match(/filename="(.+)"/)?.[1] ?? "voxelforge-model.bbmodel";
  return { blob: await response.blob(), filename };
}
