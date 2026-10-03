import { ModelArchetype, ModelCategory, ModelTheme } from "@/types/model";

export interface PresetDefinition {
  type: ModelArchetype;
  theme: ModelTheme;
  category: ModelCategory;
}

export const DEFAULT_PRESETS: readonly PresetDefinition[] = [
  { type: "sword", theme: "void", category: "sword" },
  { type: "greatsword", theme: "holy", category: "sword" },
  { type: "staff", theme: "fantasy", category: "staff" },
  { type: "scythe", theme: "nether", category: "sword" },
  { type: "armor", theme: "holy", category: "armor" },
  { type: "magic", theme: "void", category: "magic" },
  { type: "rapier", theme: "frost", category: "sword" },
] as const;

// Server-safe fallback used only until a browser session opens and bakes its full atlas.
export const PRESET_TEXTURE_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAALElEQVRYR+3OAREAAAgEIe1f2qTxgwccrAIzSVc1AQIECBAgQIAAAQIECBDIChQfAQE3vJ5FAAAAAElFTkSuQmCC";

export function deterministicPresetLikes(index: number): number {
  return 14 + ((index * 17) % 31);
}
