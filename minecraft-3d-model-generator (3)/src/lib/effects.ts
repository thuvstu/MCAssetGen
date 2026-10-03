import type { EffectPresetId } from "@/db/schema";

export interface EffectPresetMeta {
  id: EffectPresetId;
  label: string;
  detail: string;
  colors: [string, string];
  count: number;
  size: number;
  additive: boolean;
  /** Minecraft particle commands for the exported datapack aura. */
  mcParticles: string[];
}

export const EFFECT_PRESETS: EffectPresetMeta[] = [
  { id: "none", label: "なし", detail: "エフェクトを表示しない", colors: ["#ffffff", "#ffffff"], count: 0, size: 0, additive: false, mcParticles: [] },
  { id: "mana", label: "マナ環", detail: "核の周りを回る魔力の粒", colors: ["#67e8f9", "#e879f9"], count: 90, size: 0.38, additive: true, mcParticles: ["minecraft:end_rod ~ ~1.1 ~ 0.2 0.5 0.2 0.01 2", "minecraft:enchant ~ ~1.2 ~ 0.4 0.4 0.4 0.2 3"] },
  { id: "embers", label: "火の粉", detail: "刀身から立ち上る残り火", colors: ["#fb923c", "#fde047"], count: 110, size: 0.34, additive: true, mcParticles: ["minecraft:flame ~ ~1 ~ 0.15 0.5 0.15 0.01 2", "minecraft:lava ~ ~1.3 ~ 0.1 0.2 0.1 0 1"] },
  { id: "blood_mist", label: "血霧", detail: "滴り落ちる血の雫と赤い霧", colors: ["#7f1d1d", "#ef4444"], count: 100, size: 0.42, additive: false, mcParticles: ["minecraft:dust{color:[0.6,0.02,0.05],scale:1.2} ~ ~1 ~ 0.2 0.5 0.2 0 4", "minecraft:crimson_spore ~ ~1.2 ~ 0.4 0.4 0.4 0 2"] },
  { id: "cursed_smoke", label: "呪煙", detail: "渦を巻いて昇る瘴気", colors: ["#3b0764", "#a855f7"], count: 120, size: 0.5, additive: false, mcParticles: ["minecraft:soul ~ ~1 ~ 0.2 0.5 0.2 0.01 1", "minecraft:squid_ink ~ ~1.2 ~ 0.2 0.3 0.2 0.01 2", "minecraft:witch ~ ~1.4 ~ 0.3 0.3 0.3 0 1"] },
  { id: "sparks", label: "火花", detail: "機械部から弾ける火花", colors: ["#fde047", "#ffffff"], count: 80, size: 0.24, additive: true, mcParticles: ["minecraft:electric_spark ~ ~1 ~ 0.2 0.4 0.2 0.3 3", "minecraft:crit ~ ~1.1 ~ 0.2 0.4 0.2 0.2 2"] },
  { id: "holy_light", label: "聖光", detail: "静かに昇る光の柱と粒", colors: ["#fef9c3", "#fde68a"], count: 90, size: 0.36, additive: true, mcParticles: ["minecraft:end_rod ~ ~1.2 ~ 0.1 0.6 0.1 0.02 2", "minecraft:glow ~ ~1 ~ 0.3 0.4 0.3 0 2"] },
  { id: "frost", label: "氷霧", detail: "舞い落ちる雪片", colors: ["#e0f2fe", "#7dd3fc"], count: 100, size: 0.3, additive: true, mcParticles: ["minecraft:snowflake ~ ~1.2 ~ 0.3 0.5 0.3 0.01 3"] },
  { id: "electric", label: "雷撃", detail: "刀身を走る放電", colors: ["#a5f3fc", "#6366f1"], count: 90, size: 0.28, additive: true, mcParticles: ["minecraft:electric_spark ~ ~1 ~ 0.1 0.6 0.1 0.4 4"] },
];

export function getEffectPreset(id: EffectPresetId | undefined): EffectPresetMeta {
  return EFFECT_PRESETS.find((p) => p.id === id) ?? EFFECT_PRESETS[0];
}

export interface EffectBounds {
  minY: number;
  maxY: number;
  radius: number;
  coreY: number;
}

/** Deterministic hash so every particle has a stable personality. */
export function seedOf(i: number, k: number): number {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Pure particle position function. Writes into out[0..2].
 * Coordinates are viewport space (model centered on x=0,z=0).
 */
export function particlePosition(
  preset: EffectPresetId,
  i: number,
  t: number,
  b: EffectBounds,
  out: Float32Array,
  o: number
) {
  const a = seedOf(i, 1);
  const c = seedOf(i, 2);
  const d = seedOf(i, 3);
  const span = Math.max(4, b.maxY - b.minY);
  const r = Math.max(1.6, b.radius);

  switch (preset) {
    case "mana": {
      const ring = i % 3;
      const theta = a * Math.PI * 2 + t * (0.6 + ring * 0.35) * (ring === 1 ? -1 : 1);
      const rr = r * (0.7 + ring * 0.35);
      out[o] = Math.cos(theta) * rr;
      out[o + 1] = b.coreY - 0.6 + ring * 0.9 + Math.sin(t * 2 + a * 9) * 0.25;
      out[o + 2] = Math.sin(theta) * rr;
      return;
    }
    case "embers":
    case "holy_light": {
      const speed = preset === "embers" ? 2.2 + c * 2 : 1.2 + c;
      const life = (t * speed / span + a) % 1;
      const sway = preset === "embers" ? Math.sin(t * 3 + d * 8) * 0.6 : 0.15;
      out[o] = (c - 0.5) * r * 1.2 + sway * life;
      out[o + 1] = b.minY + span * 0.25 + life * span * 0.95;
      out[o + 2] = (d - 0.5) * r * 1.2;
      return;
    }
    case "blood_mist": {
      const drip = i % 2 === 0;
      if (drip) {
        const life = (t * (0.5 + c * 0.6) + a) % 1;
        out[o] = (c - 0.5) * r * 0.8;
        out[o + 1] = b.maxY - life * life * span * 1.05;
        out[o + 2] = (d - 0.5) * 0.6;
      } else {
        const theta = a * Math.PI * 2 + t * 0.25;
        out[o] = Math.cos(theta) * r * (0.6 + c * 0.8);
        out[o + 1] = b.minY + span * (0.35 + d * 0.6) + Math.sin(t + a * 7) * 0.4;
        out[o + 2] = Math.sin(theta) * r * (0.6 + c * 0.8);
      }
      return;
    }
    case "cursed_smoke": {
      const life = (t * (0.18 + c * 0.15) + a) % 1;
      const theta = a * Math.PI * 2 + life * Math.PI * 4;
      const rr = r * (0.4 + life * 1.1);
      out[o] = Math.cos(theta) * rr;
      out[o + 1] = b.minY + span * 0.2 + life * span * 0.9;
      out[o + 2] = Math.sin(theta) * rr;
      return;
    }
    case "sparks": {
      const life = (t * (1.4 + c) + a) % 1;
      const dir = a * Math.PI * 2;
      const vel = 2 + d * 3;
      out[o] = Math.cos(dir) * vel * life;
      out[o + 1] = b.coreY + vel * life * 1.2 - 6 * life * life;
      out[o + 2] = Math.sin(dir) * vel * life;
      return;
    }
    case "frost": {
      const life = (t * (0.15 + c * 0.1) + a) % 1;
      out[o] = (c - 0.5) * r * 3 + Math.sin(t + a * 6) * 0.8;
      out[o + 1] = b.maxY + 2 - life * (span + 4);
      out[o + 2] = (d - 0.5) * r * 3 + Math.cos(t + d * 6) * 0.8;
      return;
    }
    case "electric": {
      const step = Math.floor(t * 12 + a * 40);
      const jitter = seedOf(i, step);
      const y = b.minY + span * (0.3 + ((i * 0.37) % 1) * 0.7);
      out[o] = (jitter - 0.5) * 1.2;
      out[o + 1] = y + (seedOf(i, step + 1) - 0.5) * 0.6;
      out[o + 2] = (seedOf(i, step + 2) - 0.5) * 0.8;
      return;
    }
    default:
      out[o] = 0;
      out[o + 1] = -999;
      out[o + 2] = 0;
  }
}

export function buildAuraCommands(preset: EffectPresetId | undefined): string[] {
  const meta = getEffectPreset(preset ?? "mana");
  const list = meta.mcParticles.length > 0 ? meta.mcParticles : getEffectPreset("mana").mcParticles;
  return list.map(
    (particle) =>
      `execute as @a at @s anchored eyes positioned ^ ^ ^0.35 if items entity @s weapon.mainhand minecraft:diamond_sword[custom_model_data=1001] run particle ${particle} force`
  );
}
