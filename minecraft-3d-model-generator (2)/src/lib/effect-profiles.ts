import type { EffectStyle } from "./model-types";
export interface EffectProfile {
  label: string;
  color?: string;
  particleCount: number;
  size: number;
  speed: number;
  motion: "rise" | "fall" | "orbit" | "electric";
  light: boolean;
}
/** Shader-free, bounded pixel effects. These are preview effects, not vanilla item-model particles. */
export const EFFECT_PROFILES: Record<EffectStyle, EffectProfile> = {
  none: {
    label: "なし",
    particleCount: 0,
    size: 0.4,
    speed: 0,
    motion: "rise",
    light: false,
  },
  glow: {
    label: "グロー",
    particleCount: 0,
    size: 0.4,
    speed: 0,
    motion: "rise",
    light: true,
  },
  sparkle: {
    label: "キラキラ",
    particleCount: 56,
    size: 0.45,
    speed: 1.4,
    motion: "rise",
    light: false,
  },
  magic: {
    label: "マジック",
    particleCount: 64,
    size: 0.5,
    speed: 1.2,
    motion: "orbit",
    light: true,
  },
  embers: {
    label: "火の粉",
    color: "#ff9b54",
    particleCount: 48,
    size: 0.3,
    speed: 2.8,
    motion: "rise",
    light: true,
  },
  frost: {
    label: "氷晶",
    color: "#9ce3ff",
    particleCount: 48,
    size: 0.5,
    speed: 1.2,
    motion: "fall",
    light: true,
  },
  void: {
    label: "深淵",
    color: "#b08bf7",
    particleCount: 56,
    size: 0.55,
    speed: 0.5,
    motion: "orbit",
    light: true,
  },
  blood: {
    label: "血晶",
    color: "#ff4160",
    particleCount: 40,
    size: 0.6,
    speed: 1.6,
    motion: "fall",
    light: true,
  },
  electric: {
    label: "雷光",
    color: "#70dcff",
    particleCount: 64,
    size: 0.3,
    speed: 3,
    motion: "electric",
    light: true,
  },
  runes: {
    label: "ルーン",
    color: "#d0adff",
    particleCount: 36,
    size: 0.7,
    speed: 0.6,
    motion: "orbit",
    light: true,
  },
};
