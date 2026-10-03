import { EFFECT_PRESETS, PRESETS } from "./presets";
import type { DetailLevel, Palette, SwordOptions } from "./types";
import { BLADE_LABELS, BLADE_PROFILES, ELEMENT_LABELS, GRIP_LABELS, GUARD_LABELS, PALETTE_KITS, POMMEL_LABELS } from "../generator/catalog";
import { SURFACE_LABELS } from "./surfaces";
import { hexToRgb, mix, rgbToHex } from "./color";

const glacier = PALETTE_KITS.find((p) => p.id === "glacier")!;

export const DEFAULT_OPTIONS: SwordOptions = {
  size: 64, palette: { ...glacier.palette }, silhouette: "straight", bladeWidth: 3, bladeLength: 10,
  guardWidth: 4, handleLength: 3, guardStyle: "wings", handleStyle: "leather", pommelStyle: "gem",
  surface: "polished", fuller: false, fullerLength: 0.75, serrated: false, edgeHighlight: true, bevelLine: true,
  holographic: false, runeInlay: true, runeColor: glacier.accent, gradientBlade: true, edgeGradient: false,
  ricasso: false, horimono: false,
  tipColor: glacier.palette.bladeEdge, midGradientColor: glacier.palette.blade,
  spurs: false, spurCount: 2, boneSpurs: false, crystalShards: false, shardColor: glacier.accent,
  pommelBand: true, gem: true, gemColor: glacier.accent, gemShape: "diamond", gemGlow: true,
  filigree: true, element: "frost", elementIntensity: 0.28, effectPreset: "glacial",
  sheen: true, sheenSpeed: 0.6, sheenPos: 0.4, sparkle: true, sparkleDensity: 0.16, tipGlow: true,
  auraBloom: true, particles: false, lightning: false, shatter: false, runePulse: true,
  detailLevel: "rich", noise: 0.15, shading: 0.82, outline: true, outlineColorMode: "tinted",
  antiAlias: false, seed: 42816, surfaceSeed: 42816, effectSeed: 42816,
};

export const DETAIL_LEVELS: { id: DetailLevel; label: string; desc: string }[] = [
  { id: "minecraft", label: "Minecraft", desc: "16px faithful: coarse pixels, restrained FX" },
  { id: "rich", label: "Rich", desc: "Balanced default: full shading, crisp pixels" },
  { id: "cinematic", label: "Cinematic", desc: "2× supersampled AA, deeper shading, sheen" },
  { id: "anime", label: "Anime", desc: "Cel quantization, holographic shimmer, sparkle" },
];

/** Complete finished look per render mode — applied when the user switches detail level. */
export const DETAIL_PRESETS: Record<DetailLevel, Partial<SwordOptions>> = {
  minecraft: {
    antiAlias: false, holographic: false, particles: false, lightning: false,
    shatter: false, runePulse: false, sparkle: false, noise: 0.08, shading: 0.7,
    outline: true, outlineColorMode: "dark",
  },
  rich: { antiAlias: false, noise: 0.15, shading: 0.82, outline: true },
  cinematic: {
    antiAlias: true, noise: 0.18, shading: 0.9, sheen: true, outline: true,
  },
  anime: {
    antiAlias: true, holographic: true, sparkle: true, sparkleDensity: 0.25,
    noise: 0.05, shading: 1, outline: true, outlineColorMode: "dark",
  },
};

const ENUMS: Partial<Record<keyof SwordOptions, readonly string[]>> = {
  silhouette: Object.keys(BLADE_LABELS), guardStyle: Object.keys(GUARD_LABELS), handleStyle: Object.keys(GRIP_LABELS),
  element: Object.keys(ELEMENT_LABELS), pommelStyle: Object.keys(POMMEL_LABELS), surface: Object.keys(SURFACE_LABELS),
  gemShape: ["diamond", "circle", "teardrop", "hex", "marquise", "star"],
  detailLevel: ["minecraft", "rich", "cinematic", "anime"], outlineColorMode: ["dark", "tinted", "gold", "none"],
  effectPreset: ["calm", "infernal", "glacial", "celestial", "abyssal", "stormcaller", "necrotic", "verdant", "stellar", "infernum", "astral", "voidborn", "tidal", "sylvan"],
};
const RANGES: Partial<Record<keyof SwordOptions, readonly [number, number, boolean?]>> = {
  bladeWidth: [1, 4, true], bladeLength: [5, 12, true], guardWidth: [1, 8, true], handleLength: [2, 5, true],
  spurCount: [1, 6, true], fullerLength: [0.1, 1], elementIntensity: [0, 1], sheenSpeed: [0.2, 2],
  sheenPos: [0, 1], sparkleDensity: [0, 1], noise: [0, 1], shading: [0, 1], seed: [0, 4294967295, true],
  surfaceSeed: [0, 4294967295, true], effectSeed: [0, 4294967295, true],
};
const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);

/** Storage is untrusted: restore supported fields rather than spreading arbitrary JSON. */
/**
 * Form rules that keep exotic silhouettes legible.
 * Slim / flowing forms cannot carry heavy overlays: stray particles and orbiting
 * shards read as dirt at 16-48px, so they are suppressed automatically.
 */
const SLIM_FORMS = new Set(["ribbon", "whip", "essence", "sakura", "estoc", "rapier", "bow", "tanto", "spear"]);
export function applyFormRules<T extends SwordOptions>(o: T): T {
  const out = { ...o };
  const slim = SLIM_FORMS.has(out.silhouette) || BLADE_PROFILES[out.silhouette]?.slim === true;
  if (slim) {
    out.particles = false;
    out.shatter = false;
    out.spurs = false;
    out.boneSpurs = false;
    out.lightning = false;
    // a 1px-wide blade has no room for an inlaid groove
    if (out.bladeWidth <= 1) { out.fuller = false; out.horimono = false; out.runeInlay = false; }
  }
  // monolithic slabs read better without delicate inlays
  if (out.silhouette === "obelisk" || out.silhouette === "mace") out.horimono = false;
  // a snapped blade already tells the "broken" story — don't add orbiting shards on top
  if (out.silhouette === "fractured") out.shatter = false;
  return out;
}

export function normalizeOptions(input: unknown): SwordOptions {
  const out = { ...DEFAULT_OPTIONS, palette: { ...DEFAULT_OPTIONS.palette } };
  if (!input || typeof input !== "object") return out;
  const data = input as Record<string, unknown>;
  for (const key of Object.keys(out) as (keyof SwordOptions)[]) {
    const v = data[key];
    if (key === "palette" || v === undefined) continue;
    if (key === "size") {
      if ([16, 32, 64, 128, 256, 512].includes(v as number)) out.size = v as number;
      continue;
    }
    const allowed = ENUMS[key];
    const range = RANGES[key];
    if (allowed && typeof v === "string" && allowed.includes(v)) Object.assign(out, { [key]: v });
    else if (range && typeof v === "number" && Number.isFinite(v)) {
      const n = Math.max(range[0], Math.min(range[1], v));
      Object.assign(out, { [key]: range[2] ? Math.round(n) : n });
    } else if (typeof out[key] === "boolean" && typeof v === "boolean") Object.assign(out, { [key]: v });
    else if (typeof out[key] === "string" && String(out[key]).startsWith("#") && isHex(v)) Object.assign(out, { [key]: v });
  }
  if (data.palette && typeof data.palette === "object") {
    for (const key of Object.keys(out.palette) as (keyof Palette)[]) {
      const value = (data.palette as Record<string, unknown>)[key];
      if (isHex(value)) out.palette[key] = value;
    }
  }
  if (data.damascus === true && data.surface === undefined) out.surface = "damascus";
  if (data.surfaceSeed === undefined) out.surfaceSeed = out.seed;
  if (data.effectSeed === undefined) out.effectSeed = out.seed;
  return out;
}

export function optionsForPreset(key: string, current: SwordOptions): SwordOptions {
  const preset = PRESETS[key];
  if (!preset) return current;
  const fx = EFFECT_PRESETS[preset.effectPreset] ?? {};
  const result = normalizeOptions({
    ...DEFAULT_OPTIONS, size: current.size, detailLevel: current.detailLevel, antiAlias: current.antiAlias,
    seed: current.seed, runeInlay: false, crystalShards: false, spurs: false, boneSpurs: false,
    fuller: false, surface: "polished", filigree: false, runePulse: false, gemGlow: false,
    ...fx,
    palette: preset.palette, element: preset.element, elementIntensity: fx.elementIntensity ?? 0.35,
    tipColor: preset.tipColor, midGradientColor: preset.midGradientColor, gemColor: preset.gemColor,
    runeColor: preset.runeColor, shardColor: preset.shardColor, effectPreset: preset.effectPreset,
    ...preset.style,
  });
  const profile = BLADE_PROFILES[result.silhouette];
  result.bladeWidth = preset.style?.bladeWidth ?? profile.width[0];
  result.bladeLength = preset.style?.bladeLength ?? profile.length[0];
  result.guardWidth = preset.style?.guardWidth ?? profile.guard;
  result.handleLength = preset.style?.handleLength ?? profile.handle;
  result.guardStyle = preset.style?.guardStyle ?? profile.guards[0];
  result.handleStyle = preset.style?.handleStyle ?? profile.grips[0];
  if (result.runeInlay) result.fuller = false;
  if (result.boneSpurs) { result.spurs = false; result.crystalShards = false; }
  if (result.spurs) result.crystalShards = false;
  result.runePulse = result.runeInlay;
  const edge = hexToRgb(result.palette.bladeEdge), core = hexToRgb(result.palette.bladeCore);
  if (edge.reduce((sum, c) => sum + c, 0) - core.reduce((sum, c) => sum + c, 0) < 120)
    result.palette.bladeEdge = rgbToHex(mix(hexToRgb(result.palette.blade), [238, 231, 246], 0.68));
  return applyFormRules(result);
}