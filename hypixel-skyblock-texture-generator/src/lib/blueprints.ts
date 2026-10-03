import type { ItemDef } from './items';
import {
  completeEssence, completeShape, completeStyle,
  type AnimationMode, type ShapeOptions, type StyleOptions, type TextureEssence,
} from './design';

export interface BlueprintData {
  version: 3;
  id: string;
  name: string;
  createdAt: number;
  itemId: string;
  resolution: 16 | 32 | 64;
  presetId: string;
  style: StyleOptions;
  essence: TextureEssence;
  shape: ShapeOptions;
  animation: { mode: AnimationMode; frames: number; frameTime: number };
  palette: ItemDef['palette'];
  seed: number;
}

export function normalizeBlueprint(input: Partial<BlueprintData>): BlueprintData {
  return {
    version: 3,
    id: input.id ?? `${Date.now()}-${Math.random()}`,
    name: input.name ?? 'Imported Relic',
    createdAt: input.createdAt ?? Date.now(),
    itemId: input.itemId ?? 'hyperion',
    resolution: input.resolution === 16 || input.resolution === 32 ? input.resolution : 64,
    presetId: input.presetId ?? 'reborn',
    style: completeStyle(input.style),
    essence: completeEssence(input.essence),
    shape: completeShape(input.shape),
    animation: {
      mode: input.animation?.mode ?? 'none',
      frames: Math.max(2, input.animation?.frames ?? 6),
      frameTime: Math.max(1, input.animation?.frameTime ?? 2),
    },
    palette: input.palette ?? { primary: '#7054b5', light: '#d1c2ff', dark: '#251542', accent: '#edb942', handle: '#4a2f20', extra: '#c9b8ff' },
    seed: input.seed ?? Date.now(),
  };
}

export function loadBlueprintStore(key: string): BlueprintData[] {
  try {
    const value = window.localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) as Partial<BlueprintData>[] : [];
    return parsed.map(normalizeBlueprint);
  } catch { return []; }
}