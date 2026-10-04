import { PNG } from "pngjs";
import {
  decodeDataUrl,
  hasPngSignature,
  isPngDataUrl,
  readPngSize,
} from "./atlas";
import {
  ATLAS_BYTES_MESSAGE,
  ATLAS_LIMITS,
  ATLAS_SIZE_MESSAGE,
} from "./atlas-limits";
import {
  ACTION_IDS,
  ANIMATION_IDS,
  ATTACHMENT_IDS,
  DEFAULT_GRADIENT,
  DEFAULT_SETTINGS,
  EFFECT_IDS,
  FLOATER_IDS,
  FORM_IDS,
  GRADIENT_MODES,
  MAX_TIER,
  MODEL_KINDS,
  MODE_IDS,
  QUALITY_IDS,
  RIG_IDS,
  STYLE_IDS,
  type AttachmentSettings,
  type CubeEdit,
  type ModelCube,
  type ModelSettings,
  type Vec3,
} from "./model-types";
export const MAX_REQUEST_CHARS = ATLAS_LIMITS.maxRequestChars;
export class ValidationError extends Error {}
export function pickOption<T extends string>(
  value: unknown,
  options: readonly T[],
  fallback: T,
): T {
  return options.includes(value as T) ? (value as T) : fallback;
}
function numeric(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = Number(value ?? fallback);
  if (!Number.isFinite(n))
    throw new ValidationError("数値には有限の値を指定してください。");
  return Math.max(min, Math.min(max, n));
}
const hex = (value: unknown, fallback: string) =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
function vec(value: unknown, min = -23.4, max = 23.4): Vec3 {
  if (!Array.isArray(value) || value.length !== 3)
    throw new ValidationError("座標は3つの数値で指定してください。");
  return value.map((v) => numeric(v, min, max, 0)) as Vec3;
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ValidationError("設定の形式が正しくありません。");
  return value as Record<string, unknown>;
}
function array(value: unknown, max: number): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > max)
    throw new ValidationError(`パーツ数は${max}以内にしてください。`);
  return value;
}
function readAtlas(raw: unknown): ModelSettings["atlas"] {
  if (!raw) return undefined;
  const a = object(raw);
  if (!isPngDataUrl(a.source) || a.source.length > ATLAS_LIMITS.maxDataUrlChars)
    throw new ValidationError(ATLAS_BYTES_MESSAGE);
  const buffer = decodeDataUrl(a.source);
  if (buffer.length > ATLAS_LIMITS.maxBytes)
    throw new ValidationError(ATLAS_BYTES_MESSAGE);
  if (!hasPngSignature(buffer))
    throw new ValidationError("有効なPNGファイルではありません。");
  const { width, height } = readPngSize(buffer);
  if (
    width < ATLAS_LIMITS.minSize ||
    height < ATLAS_LIMITS.minSize ||
    width > ATLAS_LIMITS.maxSize ||
    height > ATLAS_LIMITS.maxSize
  )
    throw new ValidationError(ATLAS_SIZE_MESSAGE);
  try {
    PNG.sync.read(buffer);
  } catch {
    throw new ValidationError("PNG画像を読み込めませんでした。");
  }
  return {
    source: a.source,
    width,
    height,
    name:
      typeof a.name === "string" ? a.name.slice(0, 100) : "custom_atlas.png",
  };
}
function readAttachments(raw: unknown): AttachmentSettings[] {
  return array(raw, 24).map((v, i) => {
    const a = object(v);
    if (!ATTACHMENT_IDS.includes(a.kind as AttachmentSettings["kind"]))
      throw new ValidationError("未対応の装飾パーツです。");
    return {
      id:
        typeof a.id === "string"
          ? a.id.replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || `part${i}`
          : `part${i}`,
      kind: a.kind as AttachmentSettings["kind"],
      position: vec(a.position),
      scale: numeric(a.scale, 0.25, 2.5, 1),
      material: Math.round(numeric(a.material, 0, 7, 3)),
      floating: a.floating === true,
      emissive: a.emissive !== false,
    };
  });
}
function readEdits(raw: unknown): CubeEdit[] {
  return array(raw, 800).map((v) => {
    const a = object(v);
    if (typeof a.target !== "string" || a.target.length > 160)
      throw new ValidationError("パーツIDが無効です。");
    const edit: CubeEdit = { target: a.target };
    if (a.from !== undefined) edit.from = vec(a.from);
    if (a.to !== undefined) edit.to = vec(a.to);
    if (edit.from && edit.to && !edit.to.every((n, i) => n > edit.from![i]))
      throw new ValidationError("パーツサイズは0より大きくしてください。");
    if (a.color !== undefined) edit.color = hex(a.color, "#87ebd8");
    if (typeof a.label === "string") edit.label = a.label.slice(0, 80);
    if (typeof a.hidden === "boolean") edit.hidden = a.hidden;
    if (typeof a.emissive === "boolean") edit.emissive = a.emissive;
    return edit;
  });
}
function readCustomCubes(raw: unknown): ModelCube[] {
  return array(raw, 128).map((v, i) => {
    const a = object(v),
      from = vec(a.from),
      to = vec(a.to);
    if (!to.every((n, j) => n > from[j]))
      throw new ValidationError(
        "追加キューブのサイズは0より大きくしてください。",
      );
    return {
      name:
        typeof a.name === "string" && /^custom_[a-z0-9_-]+$/i.test(a.name)
          ? a.name.slice(0, 100)
          : `custom_${i}`,
      from,
      to,
      color: hex(a.color, "#87ebd8"),
      material: Math.round(numeric(a.material, 0, 7, 3)),
      uv: [2, 2, 14, 10],
      painted: true,
      hidden: a.hidden === true,
      emissive: a.emissive === true,
      layer: a.layer === "floater" ? "floater" : undefined,
      rig: RIG_IDS.includes(a.rig as ModelCube["rig"] & string)
        ? (a.rig as ModelCube["rig"])
        : undefined,
      label:
        typeof a.label === "string" ? a.label.slice(0, 80) : "追加キューブ",
    };
  });
}
export function validateSettings(input: unknown): ModelSettings {
  const s = object(input);
  if (!MODEL_KINDS.includes(s.kind as ModelSettings["kind"]))
    throw new ValidationError("対応していないテンプレートです。");
  const gradient = s.gradient ? object(s.gradient) : undefined;
  return {
    ...DEFAULT_SETTINGS,
    kind: s.kind as ModelSettings["kind"],
    name:
      typeof s.name === "string"
        ? s.name.trim().slice(0, 80) || "Untitled model"
        : "Untitled model",
    prompt: typeof s.prompt === "string" ? s.prompt.slice(0, 1000) : "",
    quality: pickOption(s.quality, QUALITY_IDS, "high"),
    style: pickOption(s.style, STYLE_IDS, "fantasy"),
    floaters: pickOption(s.floaters, FLOATER_IDS, "none"),
    effect: pickOption(s.effect, EFFECT_IDS, "none"),
    animation: pickOption(s.animation, ANIMATION_IDS, "none"),
    form: pickOption(s.form, FORM_IDS, "base"),
    mode: pickOption(s.mode, MODE_IDS, "normal"),
    action: pickOption(s.action, ACTION_IDS, "none"),
    tier: Math.round(numeric(s.tier, 0, MAX_TIER, 0)),
    limitBreak: s.limitBreak === true,
    detail: numeric(s.detail, 0, 100, 72),
    width: numeric(s.width, 2, 32, 16),
    height: numeric(s.height, 2, 40, 32),
    depth: numeric(s.depth, 1, 16, 4),
    seed: Math.floor(numeric(s.seed, 0, 999999, 42)),
    symmetric: s.symmetric !== false,
    autoUV: s.autoUV !== false,
    atlas: readAtlas(s.atlas),
    gradient: gradient
      ? {
          enabled: gradient.enabled === true,
          mode: pickOption(gradient.mode, GRADIENT_MODES, "vertical"),
          from: hex(gradient.from, DEFAULT_GRADIENT.from),
          to: hex(gradient.to, DEFAULT_GRADIENT.to),
          strength: numeric(gradient.strength, 0, 100, 55),
          steps: Math.round(numeric(gradient.steps, 2, 16, 16)),
          blend: gradient.blend === "multiply" ? "multiply" : "mix",
        }
      : undefined,
    paletteOverride:
      s.paletteOverride === undefined
        ? undefined
        : array(s.paletteOverride, 8).length === 8
          ? (s.paletteOverride as unknown[]).map((c) => hex(c, "#87ebd8"))
          : undefined,
    attachments: readAttachments(s.attachments),
    edits: readEdits(s.edits),
    customCubes: readCustomCubes(s.customCubes),
  };
}
