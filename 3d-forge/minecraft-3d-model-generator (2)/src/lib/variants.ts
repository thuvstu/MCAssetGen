import { paletteForPrompt } from "./geometry/palette";
import {
  dimensionsFor,
  MAX_TIER,
  TEMPLATES,
  type ModelSettings,
} from "./model-types";

/** Families of derived models built from one base design. */
export const VARIANT_FAMILIES = [
  { id: "tiers", label: "段階強化", description: "+0 から +5 までの強化段階" },
  { id: "limit", label: "限界突破", description: "通常版と限界突破版" },
  { id: "forms", label: "形態変化", description: "封印・通常・解放の3形態" },
  {
    id: "modes",
    label: "一時モード",
    description: "通常時とオーバードライブ時",
  },
  { id: "theme", label: "同テーマ", description: "同じ配色と演出で全武器種" },
  { id: "all", label: "すべて", description: "上記をまとめた一式" },
] as const;

export type VariantFamily = (typeof VARIANT_FAMILIES)[number]["id"];

export interface VariantSpec {
  /** Stable, resource-location safe key (a-z, 0-9, _). */
  key: string;
  family: Exclude<VariantFamily, "all">;
  label: string;
  settings: ModelSettings;
}

const FORM_LABELS = {
  sealed: "封印形態",
  base: "通常形態",
  released: "解放形態",
} as const;
const MODE_LABELS = {
  normal: "通常モード",
  charged: "オーバードライブ",
} as const;
const MAX_VARIANTS = 64;

export function isVariantFamily(value: unknown): value is VariantFamily {
  return VARIANT_FAMILIES.some((family) => family.id === value);
}

function named(base: ModelSettings, suffix: string): string {
  return `${base.name} ${suffix}`.slice(0, 80);
}

const BUILDERS: Record<
  Exclude<VariantFamily, "all">,
  (base: ModelSettings) => VariantSpec[]
> = {
  tiers: (base) =>
    Array.from({ length: MAX_TIER + 1 }, (_, tier) => ({
      key: `tier_${tier}`,
      family: "tiers",
      label: `+${tier}`,
      settings: {
        ...base,
        tier,
        limitBreak: false,
        name: named(base, `+${tier}`),
      },
    })),
  limit: (base) => [
    {
      key: "limit_off",
      family: "limit",
      label: "通常版",
      settings: { ...base, limitBreak: false },
    },
    {
      key: "limit_on",
      family: "limit",
      label: "限界突破版",
      settings: {
        ...base,
        limitBreak: true,
        tier: MAX_TIER,
        name: named(base, "【限界突破】"),
      },
    },
  ],
  forms: (base) =>
    (["sealed", "base", "released"] as const).map((form) => ({
      key: `form_${form}`,
      family: "forms",
      label: FORM_LABELS[form],
      settings: {
        ...base,
        form,
        name: named(base, `〈${FORM_LABELS[form]}〉`),
      },
    })),
  modes: (base) =>
    (["normal", "charged"] as const).map((mode) => ({
      key: `mode_${mode}`,
      family: "modes",
      label: MODE_LABELS[mode],
      settings: {
        ...base,
        mode,
        action:
          mode === "charged" && base.action === "none" ? "charge" : base.action,
        name: named(base, `〈${MODE_LABELS[mode]}〉`),
      },
    })),
  theme: (base) =>
    TEMPLATES.map((template) => ({
      key: `theme_${template.kind}`,
      family: "theme",
      label: template.label,
      settings: {
        ...base,
        kind: template.kind,
        ...dimensionsFor(template.kind),
        name: named(base, `・${template.label}`),
        paletteOverride:
          base.paletteOverride ?? paletteForPrompt(base.prompt, base.kind),
        edits: [],
        customCubes: [],
      },
    })),
};

/** Expands one design into a family of related models. */
export function buildVariants(
  base: ModelSettings,
  family: VariantFamily,
): VariantSpec[] {
  if (family !== "all") return BUILDERS[family](base);
  const all = (
    Object.keys(BUILDERS) as Exclude<VariantFamily, "all">[]
  ).flatMap((id) => BUILDERS[id](base));
  return all.slice(0, MAX_VARIANTS);
}
