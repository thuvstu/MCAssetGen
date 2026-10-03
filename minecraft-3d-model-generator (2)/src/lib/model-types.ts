import { TEMPLATE_CATALOG } from "./template-catalog";

export const MODEL_KINDS = [
  "sword",
  "pickaxe",
  "axe",
  "shield",
  "staff",
  "block",
  "drill",
  "cannon",
  "mechblade",
  "runeblade",
  "cursedblade",
  "bloodblade",
  "elderstaff",
  "bloodstaff",
  "grimoire",
  "magiccircle",
  "bow",
  "rifle",
  "pistol",
  "railgun",
  "chainsaw",
  "relic",
  "spear",
  "mace",
] as const;
export type ModelKind = (typeof MODEL_KINDS)[number];
export const MECHANICAL_KINDS: readonly ModelKind[] = [
  "drill",
  "cannon",
  "mechblade",
  "chainsaw",
  "rifle",
  "pistol",
  "railgun",
];
export const STYLE_IDS = ["fantasy", "vanilla", "minimal"] as const;
export const QUALITY_IDS = ["standard", "high", "ultra"] as const;
export const FLOATER_IDS = ["none", "crystal", "orbit", "swarm"] as const;
export const EFFECT_IDS = [
  "none",
  "glow",
  "sparkle",
  "magic",
  "embers",
  "frost",
  "void",
  "blood",
  "electric",
  "runes",
] as const;
export const ANIMATION_IDS = [
  "none",
  "float",
  "spin",
  "sway",
  "pulse",
  "orbit",
] as const;
export const ACTION_IDS = [
  "none",
  "slash",
  "thrust",
  "spin",
  "cast",
  "charge",
  "transform",
  "shoot",
  "reload",
  "draw",
  "summon",
  "ritual",
  "slam",
  "rev",
] as const;
export const FORM_IDS = ["sealed", "base", "released"] as const;
export const MODE_IDS = ["normal", "charged"] as const;
export type ModelStyle = (typeof STYLE_IDS)[number];
export type Quality = (typeof QUALITY_IDS)[number];
export type FloatersStyle = (typeof FLOATER_IDS)[number];
export type EffectStyle = (typeof EFFECT_IDS)[number];
export type AnimationStyle = (typeof ANIMATION_IDS)[number];
export type WeaponForm = (typeof FORM_IDS)[number];
export type WeaponMode = (typeof MODE_IDS)[number];
export type ActionStyle = (typeof ACTION_IDS)[number];
export type Vec3 = [number, number, number];
export type UVRect = [number, number, number, number];
export type TemplateCategory =
  "classic" | "mechanical" | "arcane" | "dark" | "modern";
export const TEMPLATE_CATEGORIES: {
  id: TemplateCategory;
  label: string;
  english: string;
}[] = [
  { id: "classic", label: "クラシック", english: "CLASSIC" },
  { id: "mechanical", label: "機械", english: "MECHANICAL" },
  { id: "arcane", label: "魔法・レリック", english: "ARCANE" },
  { id: "dark", label: "禍々しい・ブラッド", english: "DARK & BLOOD" },
  { id: "modern", label: "近代兵装", english: "MODERN" },
];
export const MAX_TIER = 5;
export const GRADIENT_MODES = [
  "vertical",
  "horizontal",
  "diagonal",
  "radial",
] as const;
export interface GradientSettings {
  enabled: boolean;
  mode: (typeof GRADIENT_MODES)[number];
  from: string;
  to: string;
  strength: number;
  steps: number;
  blend: "mix" | "multiply";
}
export const DEFAULT_GRADIENT: GradientSettings = {
  enabled: false,
  mode: "vertical",
  from: "#5e3b9a",
  to: "#a5f7e0",
  strength: 55,
  steps: 16,
  blend: "mix",
};
export const ATTACHMENT_IDS = [
  "crystal",
  "wings",
  "halo",
  "chain",
  "runes",
  "gear",
  "scope",
  "bayonet",
  "sigil",
  "spikes",
] as const;
export type AttachmentKind = (typeof ATTACHMENT_IDS)[number];
export interface AttachmentSettings {
  id: string;
  kind: AttachmentKind;
  position: Vec3;
  scale: number;
  material: number;
  floating: boolean;
  emissive: boolean;
}
export type PartRig =
  "mechanism" | "magazine" | "string" | "page" | "panel_left" | "panel_right";
export const RIG_IDS: PartRig[] = [
  "mechanism",
  "magazine",
  "string",
  "page",
  "panel_left",
  "panel_right",
];
export interface CubeEdit {
  target: string;
  from?: Vec3;
  to?: Vec3;
  color?: string;
  label?: string;
  hidden?: boolean;
  emissive?: boolean;
}
export interface AtlasInput {
  source: string;
  width: number;
  height: number;
  name: string;
}
export interface ModelSettings {
  name: string;
  kind: ModelKind;
  prompt: string;
  quality: Quality;
  style: ModelStyle;
  detail: number;
  width: number;
  height: number;
  depth: number;
  symmetric: boolean;
  autoUV: boolean;
  seed: number;
  floaters: FloatersStyle;
  effect: EffectStyle;
  animation: AnimationStyle;
  tier: number;
  limitBreak: boolean;
  form: WeaponForm;
  mode: WeaponMode;
  action: ActionStyle;
  atlas?: AtlasInput;
  gradient?: GradientSettings;
  paletteOverride?: string[];
  attachments?: AttachmentSettings[];
  edits?: CubeEdit[];
  customCubes?: ModelCube[];
}
export interface ModelCube {
  name: string;
  from: Vec3;
  to: Vec3;
  color: string;
  material: number;
  uv: UVRect;
  layer?: "floater";
  emissive?: boolean;
  ornament?: boolean;
  rig?: PartRig;
  hidden?: boolean;
  painted?: boolean;
  label?: string;
}
export interface GeneratedModel {
  cubes: ModelCube[];
  texture: AtlasInput;
  palette: string[];
  settings: ModelSettings;
}
export interface SavedProject {
  id: string;
  name: string;
  kind: ModelKind;
  settings: ModelSettings;
  model: GeneratedModel;
  createdAt: string;
  updatedAt: string;
}
export interface Template {
  kind: ModelKind;
  label: string;
  english: string;
  name: string;
  prompt: string;
  category: TemplateCategory;
  dimensions: Vec3;
  vanillaItem: string;
  defaults?: Partial<ModelSettings>;
}
export const TEMPLATES: Template[] = TEMPLATE_CATALOG;
export const DEFAULT_SETTINGS: ModelSettings = {
  name: TEMPLATES[0].name,
  kind: "sword",
  prompt: TEMPLATES[0].prompt,
  quality: "high",
  style: "fantasy",
  detail: 72,
  width: 16,
  height: 32,
  depth: 4,
  symmetric: true,
  autoUV: true,
  seed: 42,
  floaters: "none",
  effect: "none",
  animation: "none",
  tier: 0,
  limitBreak: false,
  form: "base",
  mode: "normal",
  action: "none",
};
export const DEFAULT_PALETTE = [
  "#183b43",
  "#287c82",
  "#42cbbd",
  "#87ebd8",
  "#c6ffe8",
  "#514168",
  "#ba985e",
  "#8872ad",
];
export function dimensionsFor(
  kind: ModelKind,
): Pick<ModelSettings, "width" | "height" | "depth"> {
  const [width, height, depth] = TEMPLATES.find((t) => t.kind === kind)
    ?.dimensions ?? [16, 32, 4];
  return { width, height, depth };
}
export function normalizeSettings(
  value: Partial<ModelSettings>,
): ModelSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...value,
    name: value.name || DEFAULT_SETTINGS.name,
    kind: value.kind || DEFAULT_SETTINGS.kind,
    prompt: value.prompt ?? DEFAULT_SETTINGS.prompt,
  };
}
/** Switching templates starts with the new template's motion, not stale weapon defaults. */
export function settingsForTemplate(
  kind: ModelKind,
  current: ModelSettings,
): ModelSettings {
  const template = TEMPLATES.find((t) => t.kind === kind)!;
  return {
    ...current,
    ...DEFAULT_SETTINGS,
    quality: current.quality,
    detail: current.detail,
    atlas: current.atlas,
    gradient: current.gradient,
    kind,
    name: template.name,
    prompt: template.prompt,
    ...dimensionsFor(kind),
    ...template.defaults,
    attachments: [],
    edits: [],
    customCubes: [],
    paletteOverride: undefined,
  };
}
