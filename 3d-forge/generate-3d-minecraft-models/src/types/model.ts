export type GeneratorStyle =
  | "voxel"
  | "relief"
  | "dome"
  | "blade"
  | "terraced";

export type ExtrudeProfile = "symmetric" | "front" | "stepped_back";

export type GreedyMode = "depth" | "color_depth" | "none";

export type GroupingMode = "single" | "by_depth" | "by_color";

export type DisplayPresetId = "tool" | "item" | "block" | "shield";

export type AnimationPresetId = "none" | "idle_float" | "spin_loop" | "pulse";

export type ExportFormatId =
  | "bbmodel"
  | "java_json"
  | "bedrock_geo"
  | "obj"
  | "gltf"
  | "png";

export type StudioTab =
  | "preview"
  | "editor2d"
  | "outliner"
  | "pack"
  | "json"
  | "history";

export type EditorTool = "brush" | "eraser" | "eyedropper" | "depth" | "emissive";

export type ColorMode = "original" | "quantize" | "dye16" | "concrete16";

export type DitherMode = "none" | "bayer" | "floyd";

export type CornerStyle = "none" | "soften" | "cut";

export type MirrorAxis = "none" | "x" | "y" | "z";

export interface TextureInput {
  source: CanvasImageSource;
  width: number;
  height: number;
  name: string;
}

export interface PixelCell {
  col: number;
  row: number;
  r: number;
  g: number;
  b: number;
  a: number;
  hex: string;
  depth: number;
  emissive: boolean;
}

export interface VoxelCube {
  id: string;
  name: string;
  groupName: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  color: string;
  alpha: number;
  emissive: boolean;
  uv: [number, number, number, number];
  pixelColors: string[][];
  rotation: [number, number, number];
  inflate: number;
}

export interface OutlinerGroupSummary {
  uuid: string;
  name: string;
  colorSwatch: string;
  cubeCount: number;
  cubes: VoxelCube[];
}

export interface PaletteEntry {
  hex: string;
  count: number;
  percentage: number;
}

export interface ValidationItem {
  label: string;
  detail: string;
  passed: boolean;
}

export interface GeneratedModel {
  version: string;
  textureWidth: number;
  textureHeight: number;
  textureDataUrl: string;
  pixels: PixelCell[];
  activePixelCount: number;
  voxels: VoxelCube[];
  groups: OutlinerGroupSummary[];
  palette: PaletteEntry[];
  reductionPercent: number;
  faceCount: number;
  appliedPalette: string[];
  bbmodelJson: string;
  javaJson: string;
  bedrockJson: string;
  gltfText: string;
  validations: ValidationItem[];
}

export interface GeneratorConfig {
  modelName: string;
  namespace: string;
  resolution: number;
  style: GeneratorStyle;
  extrudeProfile: ExtrudeProfile;
  thickness: number;
  alphaThreshold: number;
  removeCornerBg: boolean;
  invertRelief: boolean;
  addOutline: boolean;
  outlineColor: string;
  greedyMode: GreedyMode;
  groupingMode: GroupingMode;
  displayPreset: DisplayPresetId;
  animationPreset: AnimationPresetId;
  ambientOcclusion: boolean;
  doubleSided: boolean;
  colorMode: ColorMode;
  colorCount: number;
  ditherMode: DitherMode;
  ditherStrength: number;
  clampBroadcast: boolean;
  cornerStyle: CornerStyle;
}

export interface PresetItem {
  id: string;
  name: string;
  jaTitle: string;
  category: string;
  description: string;
  recommendedStyle: GeneratorStyle;
  recommendedThickness: number;
  recommendedDisplay: DisplayPresetId;
  pixels: string[];
  palette: Record<string, string>;
  emissiveKeys?: string[];
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  modelName: string;
  cubeCount: number;
  textureSize: string;
  format: ExportFormatId;
  filename: string;
  jsonPreview: string;
  textureDataUrl: string;
  configSnapshot: Pick<
    GeneratorConfig,
    "modelName" | "style" | "thickness" | "resolution" | "greedyMode" | "displayPreset"
  >;
}
