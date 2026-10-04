import type { ArchetypeParams, ElementMotion, MotionRig, FloatingRigConfig } from "../compat/forge3-types";
import type { ArchetypeId } from "./forge3-voxel";
import { buildFloatingRigDrafts } from "./forge3-rigs";

export type VisualStyleId =
  | "base"
  | "plus"
  | "awakened"
  | "ascendant"
  | "eclipse"
  | "divine"
  | "arcane"
  | "void";

export type EvolutionStageId = "base" | "plus" | "awakened" | "ascendant";

export type AttackModeId =
  | "slash"
  | "thrust"
  | "overhead"
  | "spin"
  | "skyward"
  | "downward"
  | "twin"
  | "cast"
  | "draw_shot"
  | "recoil"
  | "charge"
  | "heartbeat";

export type AttackPhaseId = "windup" | "attack" | "recover";

export interface VisualStyleMeta {
  id: VisualStyleId;
  nameJa: string;
  nameEn: string;
  tier: "base" | "upgrade" | "ascended" | "cosmic" | "mode";
  description: string;
  /** Unique geometry features layered on top of the archetype. */
  features: {
    bladeRunes?: boolean;
    haloRing?: boolean;
    haloRingCount?: number;
    spinePlates?: number;
    gemSplit?: boolean;
    orbitRing?: boolean;
    orbitCount?: number;
    orbitTurns?: number;
    finial?: "diamond" | "orb" | "spike" | "twin" | "void";
    auraCrown?: boolean;
    voidShards?: boolean;
    modeFinisher?: boolean;
    extraBevels?: boolean;
    coreRail?: boolean;
    secondaryJoints?: boolean;
  };
}

export const EVOLUTION_STAGES: Array<{
  id: EvolutionStageId;
  label: string;
  bladeDelta: number;
  widthDelta: number;
  guardDelta: number;
  gemAccent: boolean;
  edgeBevel: boolean;
  haloRingCount: number;
  bladeRunes: boolean;
  description: string;
}> = [
  {
    id: "base",
    label: "Ⅰ 基礎",
    bladeDelta: 0,
    widthDelta: 0,
    guardDelta: 0,
    gemAccent: true,
    edgeBevel: true,
    haloRingCount: 0,
    bladeRunes: false,
    description: "標準状態",
  },
  {
    id: "plus",
    label: "Ⅱ 強化",
    bladeDelta: 2.5,
    widthDelta: 0.3,
    guardDelta: 1.0,
    gemAccent: true,
    edgeBevel: true,
    haloRingCount: 0,
    bladeRunes: false,
    description: "リーチと装飾を強化",
  },
  {
    id: "awakened",
    label: "Ⅲ 覚醒",
    bladeDelta: 5.0,
    widthDelta: 0.7,
    guardDelta: 2.0,
    gemAccent: true,
    edgeBevel: true,
    haloRingCount: 1,
    bladeRunes: true,
    description: "ルーン周縁と光輪が覚醒",
  },
  {
    id: "ascendant",
    label: "Ⅳ 限界突破",
    bladeDelta: 7.5,
    widthDelta: 1.0,
    guardDelta: 3.0,
    gemAccent: true,
    edgeBevel: true,
    haloRingCount: 2,
    bladeRunes: true,
    description: "浮遊リング・増幅結晶を限界まで",
  },
];

export const VISUAL_STYLES: VisualStyleMeta[] = [
  {
    id: "base",
    nameJa: "标准 / Base",
    nameEn: "Base Form",
    tier: "base",
    description: "原型、素体。パラメータだけで決まる素の造形。",
    features: {},
  },
  {
    id: "plus",
    nameJa: "改 / Upgrade",
    nameEn: "Reinforced",
    tier: "upgrade",
    description: "増設された装飾とガード。一本先。段階強化モデル。",
    features: {
      finial: "diamond",
      spinePlates: 2,
      bladeRunes: true,
      extraBevels: true,
    },
  },
  {
    id: "awakened",
    nameJa: "覚醒 / Awakened",
    nameEn: "Awakened",
    tier: "ascended",
    description: "刃文に発光ルーン、ガードの透かし装備。光輪が顔を出す。",
    features: {
      finial: "twin",
      haloRing: true,
      haloRingCount: 1,
      bladeRunes: true,
      gemSplit: true,
      spinePlates: 3,
      extraBevels: true,
    },
  },
  {
    id: "ascendant",
    nameJa: "限界突破 / Ascendant",
    nameEn: "Limit Break",
    tier: "ascended",
    description: "原点共有の浮遊結晶リングが二重、尾根に走る浮遊ルーン。",
    features: {
      finial: "void",
      haloRing: true,
      haloRingCount: 2,
      bladeRunes: true,
      gemSplit: true,
      voidShards: true,
      orbitRing: true,
      orbitCount: 4,
      orbitTurns: 1,
      extraBevels: true,
    },
  },
  {
    id: "eclipse",
    nameJa: "蝕 / Eclipse",
    nameEn: "Eclipse",
    tier: "mode",
    description: "一時モード変化。闇核と浮遊の不気味な帯がまとい、刃は反転。",
    features: {
      finial: "void",
      haloRing: true,
      haloRingCount: 2,
      bladeRunes: true,
      gemSplit: true,
      voidShards: true,
      orbitRing: true,
      orbitCount: 6,
      orbitTurns: -1,
      coreRail: true,
      auraCrown: true,
      extraBevels: true,
    },
  },
  {
    id: "divine",
    nameJa: "聖 / Divine",
    nameEn: "Holy",
    tier: "mode",
    description: "一時モード変化。対戦用の聖盾、祝福された浮遊石、巨大な光輪。",
    features: {
      finial: "orb",
      haloRing: true,
      haloRingCount: 2,
      bladeRunes: true,
      spinePlates: 4,
      orbitRing: true,
      orbitCount: 3,
      orbitTurns: 2,
      auraCrown: true,
      extraBevels: true,
    },
  },
  {
    id: "arcane",
    nameJa: "魔導 / Arcane",
    nameEn: "Arcane",
    tier: "cosmic",
    description: "浮遊結晶が三次元に増え、芯は二重、尾は流れる。",
    features: {
      finial: "orb",
      haloRing: true,
      haloRingCount: 2,
      bladeRunes: true,
      gemSplit: true,
      orbitRing: true,
      orbitCount: 5,
      orbitTurns: 1,
      auraCrown: true,
      extraBevels: true,
    },
  },
  {
    id: "void",
    nameJa: "虚 / Void",
    nameEn: "Void",
    tier: "cosmic",
    description: "断片化した虚空の結晶が旋回、本体は不完全でより大きく。",
    features: {
      finial: "void",
      bladeRunes: true,
      gemSplit: true,
      voidShards: true,
      orbitRing: true,
      orbitCount: 6,
      orbitTurns: -2,
      auraCrown: true,
      extraBevels: true,
    },
  },
];

export const ATTACK_MODES: Array<{ id: AttackModeId; label: string; detail: string }> = [
  { id: "slash", label: "横斬り", detail: "刃先を大きく弧を描く" },
  { id: "thrust", label: "突き", detail: "筋を伸ばしつつブレードを立てる" },
  { id: "overhead", label: "薙ぎ払い", detail: "ガードごと前に振り込む" },
  { id: "spin", label: "旋風", detail: "刃が円を描きながら回転" },
  { id: "skyward", label: "空突", detail: "クラウンを上昇させながら両手を伸ばす" },
  { id: "downward", label: "落斧", detail: "頭を落とし、打撃へ届ける" },
  { id: "twin", label: "双撃", detail: "刃が二度に分かれて斬撃" },
  { id: "cast", label: "魔法詠唱", detail: "掲げて核を浮上させ魔力を放つ" },
  { id: "draw_shot", label: "引き絞り", detail: "弦を引いて放つ（弓・変形連動）" },
  { id: "recoil", label: "射撃反動", detail: "跳ね上がりとスライド後退" },
  { id: "charge", label: "チャージ", detail: "レール展開→溜め→発射" },
  { id: "heartbeat", label: "鼓動", detail: "禍々しく脈動して膨らむ" },
];

/** Seconds for windup + attack + recover; viewport and studio share it. */
export const ATTACK_DURATIONS: Record<AttackModeId, [number, number, number]> = {
  slash: [0.18, 0.32, 0.25],
  thrust: [0.2, 0.2, 0.3],
  overhead: [0.3, 0.25, 0.3],
  spin: [0.15, 0.5, 0.3],
  skyward: [0.25, 0.35, 0.35],
  downward: [0.3, 0.2, 0.35],
  twin: [0.15, 0.4, 0.25],
  cast: [0.6, 0.5, 0.5],
  draw_shot: [0.7, 0.12, 0.4],
  recoil: [0.05, 0.1, 0.3],
  charge: [0.9, 0.15, 0.45],
  heartbeat: [0.25, 0.25, 0.5],
};

export function attackTotalMs(mode: AttackModeId): number {
  const d = ATTACK_DURATIONS[mode];
  return Math.round((d[0] + d[1] + d[2]) * 1000);
}

export interface AttackAnimationMeta {
  mode: AttackModeId;
  phase: AttackPhaseId;
  /** Blade yaw — turn speed & direction of the slashing arc. */
  yaw: [number, number];
  /** Blade pitch / tilt — swing arc's vertical component. */
  pitch: [number, number];
  /** Blade roll / spin — frame of the strike. */
  roll: [number, number];
  /** Guard (guard pivot) swing direction. */
  guardSwing: [number, number];
  /** Core (crown pivot) lift in voxels — rise on the cast. */
  coreLift: number;
  /** How much the tip sweeps for the trail effect. */
  trailStrength: number;
  /** Transform (変形) progress override, start→end of the phase. */
  transform?: [number, number];
  /** Uniform model scale start→end of the phase. */
  scale?: [number, number];
}

export const ATTACK_ANIMATIONS: Record<AttackModeId, Record<AttackPhaseId, AttackAnimationMeta>> = {
  slash: {
    windup: {
      mode: "slash",
      phase: "windup",
      yaw: [-30, -75],
      pitch: [0, -12],
      roll: [0, -15],
      guardSwing: [0, -10],
      coreLift: 0,
      trailStrength: 0,
    },
    attack: {
      mode: "slash",
      phase: "attack",
      yaw: [65, 100],
      pitch: [0, 35],
      roll: [0, 25],
      guardSwing: [0, 35],
      coreLift: 0.8,
      trailStrength: 0.9,
    },
    recover: {
      mode: "slash",
      phase: "recover",
      yaw: [35, 0],
      pitch: [0, 0],
      roll: [0, 0],
      guardSwing: [0, 0],
      coreLift: 0,
      trailStrength: 0,
    },
  },
  thrust: {
    windup: {
      mode: "thrust",
      phase: "windup",
      yaw: [-5, -20],
      pitch: [0, 5],
      roll: [0, 0],
      guardSwing: [0, 5],
      coreLift: 0,
      trailStrength: 0,
    },
    attack: {
      mode: "thrust",
      phase: "attack",
      yaw: [15, 25],
      pitch: [-20, -40],
      roll: [0, 0],
      guardSwing: [0, 50],
      coreLift: -1.2,
      trailStrength: 0.8,
    },
    recover: {
      mode: "thrust",
      phase: "recover",
      yaw: [5, 0],
      pitch: [0, 0],
      roll: [0, 0],
      guardSwing: [0, 0],
      coreLift: 0,
      trailStrength: 0,
    },
  },
  overhead: {
    windup: {
      mode: "overhead",
      phase: "windup",
      yaw: [0, 0],
      pitch: [35, 75],
      roll: [0, 0],
      guardSwing: [0, -15],
      coreLift: 1.8,
      trailStrength: 0,
    },
    attack: {
      mode: "overhead",
      phase: "attack",
      yaw: [0, 0],
      pitch: [55, -35],
      roll: [0, 0],
      guardSwing: [0, 40],
      coreLift: -2.4,
      trailStrength: 0.8,
    },
    recover: {
      mode: "overhead",
      phase: "recover",
      yaw: [0, 0],
      pitch: [0, 0],
      roll: [0, 0],
      guardSwing: [0, 0],
      coreLift: 0,
      trailStrength: 0,
    },
  },
  spin: {
    windup: {
      mode: "spin",
      phase: "windup",
      yaw: [-15, -35],
      pitch: [0, -10],
      roll: [0, -5],
      guardSwing: [0, -10],
      coreLift: 0.5,
      trailStrength: 0,
    },
    attack: {
      mode: "spin",
      phase: "attack",
      yaw: [70, 90],
      pitch: [15, -5],
      roll: [0, 15],
      guardSwing: [0, 20],
      coreLift: 0.8,
      trailStrength: 0.85,
    },
    recover: {
      mode: "spin",
      phase: "recover",
      yaw: [25, 0],
      pitch: [0, 0],
      roll: [0, 0],
      guardSwing: [0, 0],
      coreLift: 0,
      trailStrength: 0,
    },
  },
  skyward: {
    windup: {
      mode: "skyward",
      phase: "windup",
      yaw: [0, -15],
      pitch: [-25, -45],
      roll: [0, 0],
      guardSwing: [0, -5],
      coreLift: 0.4,
      trailStrength: 0,
    },
    attack: {
      mode: "skyward",
      phase: "attack",
      yaw: [0, -25],
      pitch: [-25, -60],
      roll: [0, 0],
      guardSwing: [0, 15],
      coreLift: 3.5,
      trailStrength: 0.95,
    },
    recover: {
      mode: "skyward",
      phase: "recover",
      yaw: [0, 0],
      pitch: [0, 0],
      roll: [0, 0],
      guardSwing: [0, 0],
      coreLift: 0,
      trailStrength: 0,
    },
  },
  downward: {
    windup: {
      mode: "downward",
      phase: "windup",
      yaw: [0, -8],
      pitch: [40, 70],
      roll: [0, 0],
      guardSwing: [0, -25],
      coreLift: 1.2,
      trailStrength: 0,
    },
    attack: {
      mode: "downward",
      phase: "attack",
      yaw: [0, -5],
      pitch: [30, -55],
      roll: [0, 0],
      guardSwing: [0, 50],
      coreLift: -3.0,
      trailStrength: 0.9,
    },
    recover: {
      mode: "downward",
      phase: "recover",
      yaw: [0, 0],
      pitch: [0, 0],
      roll: [0, 0],
      guardSwing: [0, 0],
      coreLift: 0,
      trailStrength: 0,
    },
  },
  twin: {
    windup: {
      mode: "twin",
      phase: "windup",
      yaw: [-40, -90],
      pitch: [0, -15],
      roll: [0, -20],
      guardSwing: [0, -15],
      coreLift: 0.2,
      trailStrength: 0,
    },
    attack: {
      mode: "twin",
      phase: "attack",
      yaw: [90, 105],
      pitch: [0, 30],
      roll: [0, 20],
      guardSwing: [0, 40],
      coreLift: 0.8,
      trailStrength: 0.95,
    },
    recover: {
      mode: "twin",
      phase: "recover",
      yaw: [45, 0],
      pitch: [0, 0],
      roll: [0, 0],
      guardSwing: [0, 0],
      coreLift: 0,
      trailStrength: 0,
    },
  },
  cast: {
    windup: { mode: "cast", phase: "windup", yaw: [0, 0], pitch: [0, -20], roll: [0, 0], guardSwing: [0, -10], coreLift: 1.5, trailStrength: 0.3, scale: [1, 1.04] },
    attack: { mode: "cast", phase: "attack", yaw: [0, 0], pitch: [-20, -35], roll: [0, 0], guardSwing: [-10, 10], coreLift: 3.2, trailStrength: 0.7, scale: [1.04, 1.1] },
    recover: { mode: "cast", phase: "recover", yaw: [0, 0], pitch: [-35, 0], roll: [0, 0], guardSwing: [10, 0], coreLift: 0, trailStrength: 0, scale: [1.1, 1] },
  },
  draw_shot: {
    windup: { mode: "draw_shot", phase: "windup", yaw: [0, 0], pitch: [0, -6], roll: [0, 0], guardSwing: [0, 0], coreLift: 0, trailStrength: 0, transform: [0, 1] },
    attack: { mode: "draw_shot", phase: "attack", yaw: [0, 0], pitch: [-6, -14], roll: [0, 0], guardSwing: [0, 0], coreLift: 0, trailStrength: 0.6, transform: [1, 0] },
    recover: { mode: "draw_shot", phase: "recover", yaw: [0, 0], pitch: [-14, 0], roll: [0, 0], guardSwing: [0, 0], coreLift: 0, trailStrength: 0, transform: [0, 0] },
  },
  recoil: {
    windup: { mode: "recoil", phase: "windup", yaw: [0, 0], pitch: [0, 0], roll: [0, 0], guardSwing: [0, 0], coreLift: 0, trailStrength: 0, transform: [0, 0] },
    attack: { mode: "recoil", phase: "attack", yaw: [0, 4], pitch: [0, -28], roll: [0, 6], guardSwing: [0, 8], coreLift: 0, trailStrength: 0.5, transform: [0, 1] },
    recover: { mode: "recoil", phase: "recover", yaw: [4, 0], pitch: [-28, 0], roll: [6, 0], guardSwing: [8, 0], coreLift: 0, trailStrength: 0, transform: [1, 0] },
  },
  charge: {
    windup: { mode: "charge", phase: "windup", yaw: [0, 0], pitch: [0, -8], roll: [0, 0], guardSwing: [0, 0], coreLift: 0.6, trailStrength: 0.2, transform: [0, 1], scale: [1, 0.97] },
    attack: { mode: "charge", phase: "attack", yaw: [0, 0], pitch: [-8, -22], roll: [0, 0], guardSwing: [0, 0], coreLift: 1.2, trailStrength: 0.9, transform: [1, 1], scale: [0.97, 1.06] },
    recover: { mode: "charge", phase: "recover", yaw: [0, 0], pitch: [-22, 0], roll: [0, 0], guardSwing: [0, 0], coreLift: 0, trailStrength: 0, transform: [1, 0], scale: [1.06, 1] },
  },
  heartbeat: {
    windup: { mode: "heartbeat", phase: "windup", yaw: [0, 0], pitch: [0, 0], roll: [0, -6], guardSwing: [0, 0], coreLift: 0.5, trailStrength: 0.2, scale: [1, 1.12] },
    attack: { mode: "heartbeat", phase: "attack", yaw: [0, 0], pitch: [0, 0], roll: [-6, 6], guardSwing: [0, 0], coreLift: 1.0, trailStrength: 0.4, scale: [1.12, 0.96] },
    recover: { mode: "heartbeat", phase: "recover", yaw: [0, 0], pitch: [0, 0], roll: [6, 0], guardSwing: [0, 0], coreLift: 0, trailStrength: 0, scale: [0.96, 1] },
  },
};

export interface EvolutionTransform {
  label: string;
  description: string;
  params: ArchetypeParams;
  visualStyle: VisualStyleId;
  displayOverrides: Partial<Record<keyof import("../compat/forge3-types").ModelDisplaySettings, Record<string, unknown>>>;
}

/**
 * Derive the parametric deltas for an evolution stage (plus / awakened / ascendant).
 * Base stage returns the params unchanged.
 */
export function applyEvolutionStage(
  _archetype: ArchetypeId,
  baseParams: ArchetypeParams,
  stage: EvolutionStageId
): { params: ArchetypeParams; visualStyle: VisualStyleId } {
  const meta =
    EVOLUTION_STAGES.find((s) => s.id === stage) ?? EVOLUTION_STAGES[0];
  if (stage === "base") return { params: { ...baseParams }, visualStyle: "base" };

  const next: ArchetypeParams = {
    ...baseParams,
    bladeLength: clampNum(baseParams.bladeLength + meta.bladeDelta, 6, 22),
    bladeWidth: clampNum(baseParams.bladeWidth + meta.widthDelta, 1.5, 6),
    guardWidth: clampNum(baseParams.guardWidth + meta.guardDelta, 3, 12),
    gemAccent: meta.gemAccent,
    edgeBevel: meta.edgeBevel,
    fullerGroove: false,
  };
  const visStyle: VisualStyleId =
    stage === "plus" ? "plus" : stage === "awakened" ? "awakened" : "ascendant";
  return { params: next, visualStyle: visStyle };
}

function clampNum(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n * 100) / 100));
}

/** Theme family for same-theme alternate model labels. */
export interface ThemeFamilyMeta {
  id: string;
  label: string;
  members: Array<{ id: string; label: string; visualStyle: VisualStyleId }>;
}

export const THEME_FAMILIES: ThemeFamilyMeta[] = [
  {
    id: "celestial",
    label: "天穹系 / Celestial",
    members: [
      { id: "divine", label: "聖 / Divine", visualStyle: "divine" },
      { id: "arcane", label: "魔導 / Arcane", visualStyle: "arcane" },
      { id: "void", label: "虚 / Void", visualStyle: "void" },
      { id: "eclipse", label: "蝕 / Eclipse", visualStyle: "eclipse" },
    ],
  },
  {
    id: "ascendant",
    label: "進化系 / Ascendant",
    members: [
      { id: "base", label: "基础", visualStyle: "base" },
      { id: "plus", label: "改", visualStyle: "plus" },
      { id: "awakened", label: "覚醒", visualStyle: "awakened" },
      { id: "ascendant", label: "限界突破", visualStyle: "ascendant" },
    ],
  },
];

/**
 * Temporary mode presets: full visual transformation that the user can toggle,
 * e.g. "eclipse" for a moment, or "divine" style during a mode shift.
 */
export interface TemporaryModeMeta {
  id: string;
  label: string;
  detail: string;
  style: VisualStyleId;
}

export const TEMPORARY_MODES: TemporaryModeMeta[] = [
  {
    id: "eclipse",
    label: "一時モード: 蝕",
    detail: "闇核と浮遊の不気味な帯。反転ブレード。",
    style: "eclipse",
  },
  {
    id: "divine",
    label: "一時モード: 聖盾",
    detail: "祝福された浮遊石と巨大な光輪。",
    style: "divine",
  },
  {
    id: "arcane",
    label: "一時モード: 魔導",
    detail: "三次元の浮遊結晶が増え、芯は二重、尾は流れる。",
    style: "arcane",
  },
  {
    id: "void",
    label: "一時モード: 虚断",
    detail: "断片化した虚空結晶が旋回、本体は不完全でより大きく。",
    style: "void",
  },
];

/**
 * Forge a complete "same theme" alternate model: an archetype + visual style
 * combination that shares the same material palette but a completely different
 * silhouette and ring geometry.
 */
export interface ForgeModelPreset {
  id: string;
  label: string;
  archetype: ArchetypeId;
  visualStyle: VisualStyleId;
  description: string;
}

export const FORGE_PRESETS: ForgeModelPreset[] = [
  { id: "sword-plus", label: "片手剣・改", archetype: "sword", visualStyle: "plus", description: "増設装飾と短刃文。王道な二段強化。" },
  { id: "sword-ascend", label: "片手剣・限界突破", archetype: "sword", visualStyle: "ascendant", description: "浮遊リング二重とルーン増設。" },
  { id: "greatsword-eclipse", label: "大剣・蝕", archetype: "greatsword", visualStyle: "eclipse", description: "モード変化。反転ブレードと闇核。" },
  { id: "greatsword-divine", label: "大剣・聖盾", archetype: "greatsword", visualStyle: "divine", description: "祝福された浮遊石と巨大光輪。" },
  { id: "katana-void", label: "日本刀・虚", archetype: "katana", visualStyle: "void", description: "断片化した虚空結晶が旋回。不完全な刃。" },
  { id: "axe-awakened", label: "戦斧・覚醒", archetype: "axe", visualStyle: "awakened", description: "刃文に発光ルーン、光輪が顔を出す。" },
  { id: "hammer-arcane", label: "戦槌・魔導", archetype: "hammer", visualStyle: "arcane", description: "浮遊結晶三次元、芯は二重、尾は流れる。" },
  { id: "pickaxe-arcane", label: "ツルハシ・魔導", archetype: "pickaxe", visualStyle: "arcane", description: "マイニングツルハシに浮遊結晶。" },
  { id: "dagger-eclipse", label: "短剣・蝕", archetype: "dagger", visualStyle: "eclipse", description: "闇核の不気味な帯がまとい。" },
  { id: "staff-awakened", label: "魔導杖・覚醒", archetype: "staff", visualStyle: "awakened", description: "籠冠と光輪が覚醒。" },
  { id: "gunblade-transform", label: "銃剣・変形展開", archetype: "gunblade", visualStyle: "plus", description: "バレル伸長＆放熱スリット全開の射撃形態。" },
  { id: "railcannon-overdrive", label: "重砲・限界展開", archetype: "rail_cannon", visualStyle: "ascendant", description: "ツイン加速レール展開＆プラズマ加速全開。" },
  { id: "chainsaw-shredder", label: "鋸刃・過給シュレッダー", archetype: "chainsaw_blade", visualStyle: "awakened", description: "高回転タングステン鋸歯＆排熱マフラー全開。" },
  { id: "cursed-eclipse", label: "魔剣・蝕", archetype: "cursed_blade", visualStyle: "eclipse", description: "魔眼が開き呪鎖が逆巻く禍々しき形態。" },
  { id: "blood-void", label: "血鎌・虚", archetype: "blood_scythe", visualStyle: "void", description: "心臓核が脈動し虚空片が旋回。" },
  { id: "grimoire-arcane", label: "魔導書・魔導", archetype: "grimoire", visualStyle: "arcane", description: "三重魔法陣が高速回転する詠唱形態。" },
  { id: "spear-divine", label: "装飾槍・聖", archetype: "ornate_spear", visualStyle: "divine", description: "光輪と軍旗を掲げる儀礼槍。" },
  { id: "relic-ascendant", label: "聖遺物・限界突破", archetype: "relic", visualStyle: "ascendant", description: "二重環と破片が全開で周回。" },
  { id: "sword-photon", label: "片手剣・フォトン覚醒", archetype: "sword", visualStyle: "awakened", description: "レーザー発光エッジ＆多層セレーション鋸歯。" },
];

/** Extract the active visual style id from params. */
export function getVisualStyle(params: ArchetypeParams): VisualStyleId {
  const style = (params as { visualStyle?: VisualStyleId }).visualStyle;
  return style ?? "base";
}
