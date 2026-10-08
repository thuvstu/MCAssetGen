import type { MobDraft } from "@/types";

const KEY = "mobforge.v1";

export interface SaveFile {
  version: 1;
  mobs: MobDraft[];
  selectedId: string | null;
}

export function loadSave(): SaveFile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveFile;
    if (!data || data.version !== 1 || !Array.isArray(data.mobs)) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeSave(data: SaveFile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* quota or private mode */
  }
}
