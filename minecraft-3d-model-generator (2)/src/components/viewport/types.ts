import type { GeneratedModel } from "@/lib/model-types";

export type CameraView = "perspective" | "front" | "right" | "top";
export type PointerTool = "orbit" | "pan";

export interface ViewportProps {
  model: GeneratedModel;
  grid: boolean;
  wireframe: boolean;
  autoRotate: boolean;
  tool: PointerTool;
  view: CameraView;
  zoom: number;
  resetKey: number;
  /** Loops the attack/spell motion when true. */
  actionPlaying: boolean;
  /** 0–1 position on the motion timeline, used while paused. */
  actionScrub: number;
  onZoomChange: (zoom: number) => void;
  selectedCube?: string | null;
  onSelectCube?: (name: string) => void;
}
