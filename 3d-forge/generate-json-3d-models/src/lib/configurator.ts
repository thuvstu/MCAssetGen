import { DEFAULT_EXTRAS, KIND_INFO, PALETTES, PALETTE_KEYS, type Extras, type GenerationSettings, type ModelKind, type PaletteKey, type SavedModel } from "./model-types";
import { analyzePrompt, type Blueprint, type PromptAnalysis } from "./prompt";
import { normalizeExtras } from "./decor";

export interface DesignConfig {
  kind: ModelKind;
  material: Blueprint["material"];
  motif: Blueprint["profile"];
  style: Blueprint["style"];
  length: number; width: number; thickness: number; scale: number;
  glow: boolean; spikes: boolean; palette: PaletteKey;
}
export interface StudioConfig extends DesignConfig { extras: Extras; gradient?: import("./model-types").GradientConfig }
export const DEFAULT_CONFIG: StudioConfig = {
  kind: "sword", material: "crystal", motif: "standard", style: "plain",
  length: 1, width: 1, thickness: 1, scale: 1, glow: false, spikes: false, palette: "violet", extras: DEFAULT_EXTRAS, gradient: { enabled: false, direction: "vertical", intensity: .5, colors: ["#c29af5", "#6744a2"] },
};
export const MATERIAL_LABELS = { crystal: "結晶", diamond: "ダイヤ", iron: "鉄", netherite: "ネザライト", wood: "木製", gold: "金", stone: "石" } as const;
export const DEFAULT_MATERIALS: Partial<Record<ModelKind, Blueprint["material"]>> = { chainsaw: "iron", drill: "iron", nailgun: "iron", circularsaw: "iron", flamethrower: "netherite", jackhammer: "iron", assault_rifle: "iron", sniper_rifle: "iron", pistol: "iron", shotgun: "iron", railgun: "diamond", mace: "iron" };
export const PROFILE_LABELS: Record<Blueprint["profile"], string> = { standard: "標準", katana: "刀", dagger: "短剣", broad: "大剣", spear: "一本槍", curved: "曲刀" };
const MATERIAL_PALETTES = { crystal: "violet", diamond: "diamond", iron: "iron", netherite: "netherite", wood: "warm", gold: "warm", stone: "iron" } as const;

const MACHINE_KINDS = new Set(["chainsaw", "drill", "nailgun", "circularsaw", "flamethrower", "jackhammer"]);
export const isMachineKind = (kind: ModelKind) => MACHINE_KINDS.has(kind);
const MAGIC_KINDS = new Set(["spell_sword", "enchanted_axe", "cursed_blade", "soul_reaper", "shadow_dagger", "blood_sword", "blood_axe", "grimoire", "magic_circle", "relic", "spear"]);
export const isMagicKind = (kind: ModelKind) => MAGIC_KINDS.has(kind);
export function profilesFor(kind: ModelKind): Blueprint["profile"][] {
  return kind === "sword" ? ["standard", "katana", "dagger", "broad", "curved"] : kind === "trident" ? ["standard", "spear"] : ["standard"];
}
export function autoDesign(config: DesignConfig): DesignConfig {
  if (isMachineKind(config.kind)) return { ...config, material: DEFAULT_MATERIALS[config.kind] ?? config.material, motif: "standard", style: "mechanical" };
  if (isMagicKind(config.kind)) return { ...config, motif: "standard" };
  return config;
}
export function designOf(config: DesignConfig): DesignConfig {
  const base = autoDesign(config);
  return { kind: base.kind, material: base.material, motif: profilesFor(base.kind).includes(base.motif) ? base.motif : "standard", style: base.style, length: base.length, width: base.width, thickness: base.thickness, scale: base.scale, glow: base.glow, spikes: base.spikes, palette: base.palette };
}
/** Labels are only metadata for library search. They are NOT parsed to decide the selected shape. */
export function configToTags(config: DesignConfig): string[] {
  const design = designOf(config);
  return [KIND_INFO[design.kind].label, MATERIAL_LABELS[design.material], ...(design.motif !== "standard" ? [PROFILE_LABELS[design.motif]] : []), `長さ:${design.length}`, `幅:${design.width}`, `厚み:${design.thickness}`, `サイズ:${design.scale}`, design.glow ? "発光" : "発光なし", ...(design.spikes ? ["トゲ"] : [])];
}
export function analysisFromDesign(config: DesignConfig, settings: GenerationSettings): PromptAnalysis {
  const design = designOf(config);
  const palette = design.palette === "auto" ? MATERIAL_PALETTES[design.material] : design.palette;
  const colors = [...PALETTES[palette]];
  if (design.material === "wood") { colors[5] = "#805632"; colors[6] = "#3c2c24"; }
  const blueprint: Blueprint = {
    kind: design.kind, material: design.material, palette, colors, color: design.palette === "auto" ? null : ({ violet: "紫", mint: "緑", ice: "青", warm: "琥珀", diamond: "水色", iron: "銀", netherite: "黒" })[design.palette],
    profile: design.motif, style: design.style, length: design.length, width: design.width, thickness: design.thickness,
    scale: design.scale, glow: design.glow, spikes: design.spikes, detail: settings.detail,
  };
  return { engine: "procedural-v2", blueprint, tags: [], warnings: [], summary: [KIND_INFO[design.kind].label, MATERIAL_LABELS[design.material], PROFILE_LABELS[design.motif], `長さ ${Math.round(design.length * 100)}%`, `幅 ${Math.round(design.width * 100)}%`, ...(design.glow ? ["発光"] : [])] };
}
/** Full validation at the API boundary, rather than silently falling back to a different model. */
export function validDesign(input: unknown): input is DesignConfig {
  if (!input || typeof input !== "object") return false;
  const value = input as Record<string, unknown>;
  if (typeof value.kind !== "string" || !Object.hasOwn(KIND_INFO, value.kind)) return false;
  if (typeof value.material !== "string" || !Object.hasOwn(MATERIAL_LABELS, value.material)) return false;
  if (!profilesFor(value.kind as ModelKind).includes(value.motif as Blueprint["profile"])) return false;
  if (!["plain", "ornate", "ancient", "elven", "mechanical"].includes(value.style as string)) return false;
  if (!PALETTE_KEYS.includes(value.palette as PaletteKey)) return false;
  if (typeof value.glow !== "boolean" || typeof value.spikes !== "boolean") return false;
  return ["length", "width", "thickness", "scale"].every(key => typeof value[key] === "number" && Number.isFinite(value[key]) && value[key] >= .35 && value[key] <= 1.8);
}
export function configFromSaved(saved: SavedModel): StudioConfig {
  if (validDesign(saved.settings.design)) return { ...designOf(saved.settings.design), extras: normalizeExtras(saved.settings.extras) };
  const b = saved.model.analysis?.blueprint ?? analyzePrompt(saved.tags, saved.settings).blueprint;
  const kind = b.kind ?? saved.model.kind;
  return { kind, material: b.material, motif: profilesFor(kind).includes(b.profile) ? b.profile : "standard", style: "plain", length: b.length, width: b.width, thickness: b.thickness, scale: b.scale, glow: b.glow ?? false, spikes: b.spikes, palette: saved.settings.palette, extras: normalizeExtras(saved.settings.extras ?? saved.model.extras) };
}
export function stable(value: unknown): string {
  return JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
}
