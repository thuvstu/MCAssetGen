import {
  Box,
  Circle,
  Cog,
  Crosshair,
  Flame,
  Gem,
  Lock,
  MoveVertical,
  Orbit,
  RefreshCw,
  RotateCw,
  Sparkles,
  SquareDashed,
  Sun,
  Swords,
  WandSparkles,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { ACTIONS } from "@/lib/animation/actions";
import { EFFECT_PROFILES } from "@/lib/effect-profiles";
import { ACTION_IDS, ANIMATION_IDS, EFFECT_IDS } from "@/lib/model-types";
import type {
  ActionStyle,
  AnimationStyle,
  EffectStyle,
  FloatersStyle,
  ModelSettings,
  WeaponForm,
  WeaponMode,
} from "@/lib/model-types";

export const FORM_OPTIONS: Option<WeaponForm>[] = [
  { id: "sealed", label: "封印", icon: Lock },
  { id: "base", label: "通常形態", icon: Circle },
  { id: "released", label: "解放", icon: Flame },
];

export const MODE_OPTIONS: Option<WeaponMode>[] = [
  { id: "normal", label: "通常モード", icon: Circle },
  { id: "charged", label: "オーバードライブ", icon: Zap },
];

export const ACTION_OPTIONS: Option<ActionStyle>[] = ACTION_IDS.map((id) => ({
  id,
  label: id === "none" ? "なし" : ACTIONS[id].label,
  icon:
    id === "transform"
      ? Cog
      : id === "shoot"
        ? Crosshair
        : id === "cast" || id === "ritual"
          ? WandSparkles
          : Zap,
}));

export interface Option<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

export const STYLE_OPTIONS: Option<ModelSettings["style"]>[] = [
  { id: "vanilla", label: "バニラ", icon: Box },
  { id: "fantasy", label: "ファンタジー", icon: Sparkles },
  { id: "minimal", label: "ミニマル", icon: SquareDashed },
];

export const QUALITY_OPTIONS: Option<ModelSettings["quality"]>[] = [
  { id: "standard", label: "標準" },
  { id: "high", label: "高品質" },
  { id: "ultra", label: "最高品質" },
];

export const FLOATER_OPTIONS: Option<FloatersStyle>[] = [
  { id: "none", label: "なし", icon: Circle },
  { id: "crystal", label: "クリスタル", icon: Gem },
  { id: "orbit", label: "軌道", icon: Orbit },
  { id: "swarm", label: "欠片", icon: Sparkles },
];

export const EFFECT_OPTIONS: Option<EffectStyle>[] = EFFECT_IDS.map((id) => ({
  id,
  label: EFFECT_PROFILES[id].label,
  icon:
    id === "none"
      ? Circle
      : id === "electric"
        ? Zap
        : id === "void"
          ? Orbit
          : Sparkles,
}));

const FLOAT_LABELS: Record<AnimationStyle, string> = {
  none: "オフ",
  float: "浮遊",
  spin: "回転",
  sway: "揺れ",
  pulse: "脈動",
  orbit: "公転",
};
export const ANIMATION_OPTIONS: Option<AnimationStyle>[] = ANIMATION_IDS.map(
  (id) => ({
    id,
    label: FLOAT_LABELS[id],
    icon: id === "spin" ? RefreshCw : id === "orbit" ? Orbit : MoveVertical,
  }),
);

export const DIMENSION_FIELDS = [
  { key: "width", axis: "X", min: 2, max: 32 },
  { key: "height", axis: "Y", min: 2, max: 40 },
  { key: "depth", axis: "Z", min: 1, max: 16 },
] as const;

/** Extra prompt suggestions offered by the "ヒントを試す" button. */
export const PROMPT_SUGGESTIONS = [
  "赤いルビーの刀身。炎を思わせるクリスタルと金の鍔、ダークレザーの柄。",
  "氷のように青いクリスタル。シルバーの装飾と、深い紺色のグリップ。",
];
