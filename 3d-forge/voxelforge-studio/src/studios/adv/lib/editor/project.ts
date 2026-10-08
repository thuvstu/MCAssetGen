import { ANIM_TYPES, type AnimLayer } from "@/studios/adv/lib/pixel/animations";
import { VERSION_TARGETS } from "@/studios/adv/lib/pixel/export";
import { DEFAULT_MODEL, type ModelSettings } from "@/studios/adv/lib/pixel/model3d";
import { DEFAULT_SETTINGS, type GenSettings } from "@/studios/adv/lib/pixel/generator";
import type { Pix } from "@/studios/adv/lib/pixel/core";
import { pixFromArray, pixToArray } from "@/studios/adv/lib/pixel/core";

export type AnimationSettings = {
  layers: AnimLayer[];
  frameCount: number;
  frametime: number;
  interpolate: boolean;
};

export type ExportSettings = {
  name: string;
  baseItem: string;
  customModelData: number;
  mode3d: boolean;
  packFormat: number;
  versionTarget: string;
};

export type AssetOrigin = "generator" | "edited" | "imported" | "animated";

export type ProjectMeta = {
  version: 2;
  gen: GenSettings;
  anim: AnimationSettings;
  model: ModelSettings;
  exp: ExportSettings;
  origin: AssetOrigin;
};

export type ProjectPayload = {
  name: string;
  kind: string;
  width: number;
  height: number;
  frametime: number;
  interpolate: boolean;
  frames: number[][];
  meta: ProjectMeta;
  thumbnail: string;
};

export const DEFAULT_ANIMATION: AnimationSettings = {
  layers: [{ type: "glow_pulse", intensity: 1, speed: 1, enabled: true }],
  frameCount: 8,
  frametime: 3,
  interpolate: false,
};

export const DEFAULT_EXPORT: ExportSettings = {
  name: "Ruby Sword",
  baseItem: "iron_sword",
  customModelData: 1001,
  mode3d: true,
  packFormat: 46,
  versionTarget: "1.21.4",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const asNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

const asBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const validOrigin = (v: unknown): AssetOrigin =>
  v === "generator" || v === "edited" || v === "imported" || v === "animated" ? v : "edited";

const choice = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? value as T : fallback;

/**
 * Normalises old saved projects too. New 3D settings deliberately receive defaults
 * when they are absent so projects saved before the 3D refactor remain loadable.
 */
export function normalizeProjectMeta(raw: unknown, fallbackName = DEFAULT_EXPORT.name): ProjectMeta {
  const meta = isRecord(raw) ? raw : {};
  const rawGen = isRecord(meta.gen) ? meta.gen : {};
  const rawParams = isRecord(rawGen.params) ? rawGen.params : {};
  const gen: GenSettings = {
    ...DEFAULT_SETTINGS,
    ...rawGen,
    params: {
      ...DEFAULT_SETTINGS.params,
      ...rawParams,
      width: asNumber(rawParams.width, DEFAULT_SETTINGS.params.width, 0.3, 2.5),
      length: asNumber(rawParams.length, DEFAULT_SETTINGS.params.length, 0.4, 1.3),
      guard: asNumber(rawParams.guard, DEFAULT_SETTINGS.params.guard, 0.2, 3),
      ornate: Math.round(asNumber(rawParams.ornate, DEFAULT_SETTINGS.params.ornate, 0, 3)),
      curve: asNumber(rawParams.curve, DEFAULT_SETTINGS.params.curve, -1, 1),
    },
    shape: typeof rawGen.shape === "string" ? rawGen.shape.slice(0, 80) : DEFAULT_SETTINGS.shape,
    material: typeof rawGen.material === "string" ? rawGen.material.slice(0, 80) : DEFAULT_SETTINGS.material,
    material2: typeof rawGen.material2 === "string" ? rawGen.material2.slice(0, 80) : DEFAULT_SETTINGS.material2,
    size: rawGen.size === 16 || rawGen.size === 32 || rawGen.size === 64 ? rawGen.size : DEFAULT_SETTINGS.size,
    style: choice(rawGen.style, ["vanilla", "furfsky", "imperial", "hypixelplus", "painterly"] as const, DEFAULT_SETTINGS.style),
    gradient: choice(rawGen.gradient, ["none", "length", "width", "tip", "rainbow", "twoTone", "radial", "fire"] as const, DEFAULT_SETTINGS.gradient),
    gradientStrength: asNumber(rawGen.gradientStrength, DEFAULT_SETTINGS.gradientStrength, 0, 1),
    outline: asNumber(rawGen.outline, DEFAULT_SETTINGS.outline, 0, 1),
    glow: asNumber(rawGen.glow, DEFAULT_SETTINGS.glow, 0, 1),
    hueShift: asNumber(rawGen.hueShift, DEFAULT_SETTINGS.hueShift, -0.5, 0.5),
    saturation: asNumber(rawGen.saturation, DEFAULT_SETTINGS.saturation, -0.5, 0.5),
    brightness: asNumber(rawGen.brightness, DEFAULT_SETTINGS.brightness, -0.3, 0.3),
    decorations: Array.isArray(rawGen.decorations) ? rawGen.decorations.filter((x): x is string => typeof x === "string").slice(0, 32) : DEFAULT_SETTINGS.decorations,
    seed: Math.round(asNumber(rawGen.seed, DEFAULT_SETTINGS.seed, 0, 999999999)),
  };

  const rawAnim = isRecord(meta.anim) ? meta.anim : {};
  const rawLayers = Array.isArray(rawAnim.layers) ? rawAnim.layers : DEFAULT_ANIMATION.layers;
  const anim: AnimationSettings = {
    layers: rawLayers
      .filter(isRecord)
      .slice(0, 8)
      .map((l) => ({
        type: choice(l.type, ANIM_TYPES.map((item) => item.id) as AnimLayer["type"][], "glow_pulse"),
        intensity: asNumber(l.intensity, 1, 0, 2),
        speed: Math.round(asNumber(l.speed, 1, 1, 8)),
        enabled: asBoolean(l.enabled, true),
      })),
    frameCount: Math.round(asNumber(rawAnim.frameCount, DEFAULT_ANIMATION.frameCount, 2, 32)),
    frametime: Math.round(asNumber(rawAnim.frametime, DEFAULT_ANIMATION.frametime, 1, 40)),
    interpolate: asBoolean(rawAnim.interpolate, DEFAULT_ANIMATION.interpolate),
  };
  if (!anim.layers.length) anim.layers = DEFAULT_ANIMATION.layers.map((l) => ({ ...l }));

  const rawModel = isRecord(meta.model) ? meta.model : {};
  const model: ModelSettings = {
    ...DEFAULT_MODEL,
    ...rawModel,
    thickness: asNumber(rawModel.thickness, DEFAULT_MODEL.thickness, 0.2, 10),
    levels: Math.round(asNumber(rawModel.levels, DEFAULT_MODEL.levels, 1, 8)),
    minThickness: asNumber(rawModel.minThickness, DEFAULT_MODEL.minThickness, 0.02, 1),
    bevelRadius: Math.round(asNumber(rawModel.bevelRadius, DEFAULT_MODEL.bevelRadius, 1, 16)),
    scale: asNumber(rawModel.scale, DEFAULT_MODEL.scale, 0.25, 4),
    smooth: Math.round(asNumber(rawModel.smooth, DEFAULT_MODEL.smooth, 0, 4)),
    roundness: asNumber(rawModel.roundness, DEFAULT_MODEL.roundness, 0, 1),
    glowShell: asNumber(rawModel.glowShell, DEFAULT_MODEL.glowShell, 0, 2),
    bladeBevel: asNumber(rawModel.bladeBevel, DEFAULT_MODEL.bladeBevel, 0, 1),
    tipTaper: asNumber(rawModel.tipTaper, DEFAULT_MODEL.tipTaper, 0, 1),
    ridge: asNumber(rawModel.ridge, DEFAULT_MODEL.ridge, 0, 0.6),
    fuller: asNumber(rawModel.fuller, DEFAULT_MODEL.fuller, 0, 0.6),
    gripRound: asNumber(rawModel.gripRound, DEFAULT_MODEL.gripRound, 0, 1),
    gripSides: Math.round(asNumber(rawModel.gripSides, DEFAULT_MODEL.gripSides, 4, 20)),
    gemFacets: Math.round(asNumber(rawModel.gemFacets, DEFAULT_MODEL.gemFacets, 4, 16)),
    depthMode: choice(rawModel.depthMode, ["uniform", "luminance", "bevel", "auto", "roles"] as const, DEFAULT_MODEL.depthMode),
    reconstruct: choice(rawModel.reconstruct, ["auto", "parts", "extrude"] as const, DEFAULT_MODEL.reconstruct),
    layering: choice(rawModel.layering, ["exclusive", "nested"] as const, DEFAULT_MODEL.layering),
    crossSection: choice(rawModel.crossSection, ["auto", "flat", "round", "diamond"] as const, DEFAULT_MODEL.crossSection),
    emissiveGlow: asBoolean(rawModel.emissiveGlow, DEFAULT_MODEL.emissiveGlow),
    handheld: asBoolean(rawModel.handheld, DEFAULT_MODEL.handheld),
    invert: asBoolean(rawModel.invert, DEFAULT_MODEL.invert),
  };

  const rawExport = isRecord(meta.exp) ? meta.exp : {};
  const exp: ExportSettings = {
    ...DEFAULT_EXPORT,
    ...rawExport,
    name: typeof rawExport.name === "string" && rawExport.name.trim() ? rawExport.name.slice(0, 80) : fallbackName,
    baseItem: typeof rawExport.baseItem === "string" && /^[a-z0-9_]+$/.test(rawExport.baseItem) ? rawExport.baseItem : DEFAULT_EXPORT.baseItem,
    customModelData: Math.round(asNumber(rawExport.customModelData, DEFAULT_EXPORT.customModelData, 1, 9999999)),
    mode3d: asBoolean(rawExport.mode3d, DEFAULT_EXPORT.mode3d),
    packFormat: Math.round(asNumber(rawExport.packFormat, DEFAULT_EXPORT.packFormat, 1, 99)),
    versionTarget: typeof rawExport.versionTarget === "string" && VERSION_TARGETS.some((t) => t.id === rawExport.versionTarget)
      ? rawExport.versionTarget
      : (VERSION_TARGETS.find((t) => t.packFormat === Math.round(asNumber(rawExport.packFormat, 46, 1, 99)))?.id ?? DEFAULT_EXPORT.versionTarget),
  };

  return { version: 2, gen, anim, model, exp, origin: validOrigin(meta.origin) };
}

export function serialiseProject(
  name: string,
  frames: Pix[],
  meta: ProjectMeta,
  thumbnail: string,
): ProjectPayload {
  const first = frames[0];
  return {
    name: name.slice(0, 80),
    kind: meta.gen.shape,
    width: first.w,
    height: first.h,
    frametime: meta.anim.frametime,
    interpolate: meta.anim.interpolate,
    frames: frames.map(pixToArray),
    meta,
    thumbnail,
  };
}

export function framesFromProject(rawFrames: unknown, width: number, height: number): Pix[] {
  if (!Array.isArray(rawFrames)) return [];
  const safeW = Math.round(asNumber(width, 16, 1, 128));
  const safeH = Math.round(asNumber(height, safeW, 1, 128));
  return rawFrames
    .filter(Array.isArray)
    .slice(0, 64)
    .map((frame) => pixFromArray(safeW, safeH, frame as number[]));
}
