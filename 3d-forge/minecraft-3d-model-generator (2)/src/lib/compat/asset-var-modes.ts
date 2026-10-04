import { ActionId, TemporaryModeId, VariantState } from "./asset-types";

export interface TemporaryModeDefinition {
  id: TemporaryModeId;
  label: string;
  labelJa: string;
  description: string;
  duration: number; // seconds
  glow: number; // emissive multiplier
  speedMultiplier: number; // animation / orbit / particle speed
  scale: number;
  opacity: number;
  shake: number;
  tint: string | null; // null = use palette glow
  tintStrength: number;
  aura: "rings" | "spikes" | "shield" | "halo" | "none";
  variantOverride?: Partial<VariantState>;
  transitionAction?: ActionId;
}

export const TEMPORARY_MODES: Record<TemporaryModeId, TemporaryModeDefinition> = {
  overdrive: {
    id: "overdrive",
    label: "Overdrive",
    labelJa: "オーバードライブ",
    description: "全発光・周回・粒子速度を一時的に最大化",
    duration: 8,
    glow: 2.2,
    speedMultiplier: 2.2,
    scale: 1.04,
    opacity: 1,
    shake: 0,
    tint: null,
    tintStrength: 0.35,
    aura: "rings",
    transitionAction: "spell_release",
  },
  berserk: {
    id: "berserk",
    label: "Berserk",
    labelJa: "狂化",
    description: "一時的に魔獣形態へ変化し、真紅のオーラと振動を纏う",
    duration: 8,
    glow: 1.8,
    speedMultiplier: 1.6,
    scale: 1.06,
    opacity: 1,
    shake: 0.35,
    tint: "#ff1744",
    tintStrength: 0.9,
    aura: "spikes",
    variantOverride: { form: "demonic" },
    transitionAction: "transform",
  },
  guardian: {
    id: "guardian",
    label: "Guardian",
    labelJa: "守護結界",
    description: "多面体バリアを展開し、動作を重厚に減速",
    duration: 10,
    glow: 1.2,
    speedMultiplier: 0.6,
    scale: 1,
    opacity: 1,
    shake: 0,
    tint: "#64b5f6",
    tintStrength: 0.4,
    aura: "shield",
    transitionAction: "spell_charge",
  },
  phantom: {
    id: "phantom",
    label: "Phantom",
    labelJa: "幻影化",
    description: "半透明の霊体モードで存在をかき消す",
    duration: 6,
    glow: 1.4,
    speedMultiplier: 1.2,
    scale: 1,
    opacity: 0.3,
    shake: 0,
    tint: "#b388ff",
    tintStrength: 0.5,
    aura: "none",
  },
  awakening: {
    id: "awakening",
    label: "Awakening",
    labelJa: "真・覚醒",
    description: "一時的に +5・限界突破III の姿へ覚醒し、光輪を展開",
    duration: 10,
    glow: 2.6,
    speedMultiplier: 1.3,
    scale: 1.08,
    opacity: 1,
    shake: 0,
    tint: "#ffd54a",
    tintStrength: 0.6,
    aura: "halo",
    variantOverride: { tier: 5, limitBreak: 3 },
    transitionAction: "ultimate_burst",
  },
};

export const TEMPORARY_MODE_LIST = Object.values(TEMPORARY_MODES);
