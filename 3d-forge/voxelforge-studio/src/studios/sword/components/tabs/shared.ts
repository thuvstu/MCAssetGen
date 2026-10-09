import type { SwordOptions } from "../../engine";
import type { ServerItemConfig } from "../../studio/exports";

export interface TabBaseProps {
  opts: SwordOptions;
  update: (patch: Partial<SwordOptions>) => void;
}

export const SIZES = [16, 32, 64, 128, 256, 512];

export interface ExportActions {
  downloadPNG: () => void;
  downloadZip: () => void;
  downloadServerItem: (config: ServerItemConfig) => void;
  downloadSprite: (frames: number) => void;
  copyPng: () => Promise<void>;
  exportAllSizes: () => void;
  saveCustomPreset: () => void;
  isCustomSaved: boolean;
}
