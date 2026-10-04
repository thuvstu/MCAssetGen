import { ActionId, Vector3 } from "./asset-types";

export type ActionFxType =
  | "slash_trail"
  | "shockwave"
  | "flash"
  | "burst"
  | "circle_charge"
  | "thrust_wave"
  | "pillar"
  | "beam"
  | "muzzle"
  | "wheel"
  | "ring_spin"
  | "steam"
  | "implode";

export interface ActionKeyframe {
  time: number; // seconds
  position: Vector3; // model pixels
  rotation: Vector3; // degrees
  scale: number;
}

export interface ActionFxEvent {
  time: number;
  type: ActionFxType;
  angle?: number; // degrees, used by slash trails
  life?: number; // seconds
}

export interface ActionCinema {
  shake?: Array<{ at: number; strength: number }>;
  freeze?: Array<{ at: number; duration: number }>;
  zoom?: { at: number; amount: number };
  letterbox?: number; // 0 - 0.5, bar height fraction
}

export interface ActionDefinition {
  id: ActionId;
  label: string;
  labelJa: string;
  category: "attack" | "magic" | "special";
  duration: number;
  keyframes: ActionKeyframe[];
  fx: ActionFxEvent[];
  cinema?: ActionCinema;
}

const key = (time: number, position: Vector3 = [0, 0, 0], rotation: Vector3 = [0, 0, 0], scale = 1): ActionKeyframe => ({
  time,
  position,
  rotation,
  scale,
});

export const ACTION_DEFINITIONS: Record<ActionId, ActionDefinition> = {
  attack_slash: {
    id: "attack_slash",
    label: "Slash",
    labelJa: "斬撃",
    category: "attack",
    duration: 0.9,
    keyframes: [
      key(0),
      key(0.25, [-1, 2, 0], [-10, 0, 55]),
      key(0.42, [3, 0, 1], [15, 0, -100], 1.04),
      key(0.6, [3, -0.5, 1], [12, 0, -95]),
      key(0.9),
    ],
    fx: [
      { time: 0.3, type: "slash_trail", angle: 0 },
      { time: 0.36, type: "flash" },
    ],
    cinema: { shake: [{ at: 0.36, strength: 0.4 }], freeze: [{ at: 0.34, duration: 0.09 }], zoom: { at: 0.3, amount: 1.08 } },
  },
  attack_thrust: {
    id: "attack_thrust",
    label: "Thrust",
    labelJa: "刺突",
    category: "attack",
    duration: 0.8,
    keyframes: [
      key(0),
      key(0.25, [0, 4, -5], [-80, 0, 0]),
      key(0.4, [0, 4, 14], [-86, 0, 0], 1.05),
      key(0.55, [0, 4, 13], [-85, 0, 0]),
      key(0.8),
    ],
    fx: [
      { time: 0.36, type: "thrust_wave" },
      { time: 0.4, type: "flash" },
    ],
    cinema: { zoom: { at: 0.34, amount: 1.16 }, shake: [{ at: 0.4, strength: 0.3 }], freeze: [{ at: 0.38, duration: 0.07 }] },
  },
  combo_strike: {
    id: "combo_strike",
    label: "Combo",
    labelJa: "三連撃",
    category: "attack",
    duration: 1.6,
    keyframes: [
      key(0),
      key(0.18, [-1, 2, 0], [0, 0, 60]),
      key(0.32, [3, 0, 1], [10, 0, -95]),
      key(0.52, [2, 1, 0], [0, 0, -110]),
      key(0.68, [-3, 0, 1], [10, 0, 90]),
      key(0.9, [0, 6, -2], [-60, 0, 0]),
      key(1.08, [0, -2, 4], [70, 0, 0], 1.08),
      key(1.3, [0, -2, 4], [65, 0, 0]),
      key(1.6),
    ],
    fx: [
      { time: 0.25, type: "slash_trail", angle: 0 },
      { time: 0.62, type: "slash_trail", angle: 180 },
      { time: 1.02, type: "slash_trail", angle: 90 },
      { time: 1.08, type: "shockwave" },
      { time: 1.08, type: "flash" },
    ],
    cinema: { shake: [{ at: 0.25, strength: 0.25 }, { at: 0.62, strength: 0.32 }, { at: 1.05, strength: 0.55 }], freeze: [{ at: 1.05, duration: 0.16 }], zoom: { at: 0.9, amount: 1.12 } },
  },
  spell_charge: {
    id: "spell_charge",
    label: "Charge",
    labelJa: "詠唱チャージ",
    category: "magic",
    duration: 1.4,
    keyframes: [
      key(0),
      key(0.5, [0, 3, 0], [0, 90, 0], 1.03),
      key(1.1, [0, 4, 0], [0, 180, 0], 1.06),
      key(1.4, [0, 0, 0], [0, 360, 0]),
    ],
    fx: [
      { time: 0, type: "circle_charge", life: 1.3 },
      { time: 1.15, type: "burst" },
    ],
    cinema: { zoom: { at: 0.15, amount: 1.1 }, letterbox: 0.1 },
  },
  spell_release: {
    id: "spell_release",
    label: "Cast",
    labelJa: "魔法発動",
    category: "magic",
    duration: 1.0,
    keyframes: [
      key(0, [0, 3, 0]),
      key(0.15, [0, 1.5, 0], [-20, 0, 0], 0.97),
      key(0.3, [0, 6, 0], [0, 0, 0], 1.12),
      key(1.0),
    ],
    fx: [
      { time: 0.25, type: "pillar" },
      { time: 0.28, type: "shockwave" },
      { time: 0.3, type: "flash" },
      { time: 0.3, type: "burst" },
    ],
    cinema: { zoom: { at: 0.22, amount: 1.2 }, shake: [{ at: 0.28, strength: 0.4 }], letterbox: 0.12 },
  },
  ultimate_burst: {
    id: "ultimate_burst",
    label: "Ultimate",
    labelJa: "奥義解放",
    category: "special",
    duration: 2.4,
    keyframes: [
      key(0),
      key(0.8, [0, 8, 0], [0, 360, 0], 1.1),
      key(1.2, [0, 10, 0], [0, 720, 0], 1.2),
      key(1.35, [0, 3, 0], [0, 720, 0], 1),
      key(2.4, [0, 0, 0], [0, 720, 0]),
    ],
    fx: [
      { time: 0, type: "circle_charge", life: 1.3 },
      { time: 1.3, type: "pillar" },
      { time: 1.3, type: "shockwave" },
      { time: 1.35, type: "flash" },
      { time: 1.35, type: "burst" },
      { time: 1.35, type: "shockwave" },
      { time: 1.55, type: "burst" },
    ],
    cinema: {
      letterbox: 0.18,
      zoom: { at: 0.55, amount: 1.32 },
      freeze: [{ at: 1.28, duration: 0.24 }],
      shake: [{ at: 1.1, strength: 0.28 }, { at: 1.35, strength: 0.95 }],
    },
  },
  transform: {
    id: "transform",
    label: "Transform",
    labelJa: "形態変化",
    category: "special",
    duration: 1.2,
    keyframes: [
      key(0),
      key(0.45, [0, 4, 0], [0, 360, 0], 0.6),
      key(0.65, [0, 5, 0], [0, 540, 0], 1.15),
      key(1.2, [0, 0, 0], [0, 720, 0], 1),
    ],
    fx: [
      { time: 0.55, type: "flash" },
      { time: 0.6, type: "burst" },
      { time: 0.6, type: "shockwave" },
    ],
    cinema: { letterbox: 0.12, freeze: [{ at: 0.55, duration: 0.1 }], shake: [{ at: 0.6, strength: 0.35 }] },
  },
  shoot: {
    id: "shoot",
    label: "Fire",
    labelJa: "射撃",
    category: "attack",
    duration: 0.6,
    keyframes: [
      key(0),
      key(0.08, [-1.6, 0.6, -2.2], [12, 0, 0], 1),
      key(0.22, [0, 0, 0], [0, 0, 0], 1),
      key(0.6),
    ],
    fx: [
      { time: 0.06, type: "muzzle" },
      { time: 0.06, type: "flash" },
    ],
    cinema: { shake: [{ at: 0.06, strength: 0.22 }], freeze: [{ at: 0.05, duration: 0.05 }], zoom: { at: 0, amount: 1.12 } },
  },
  reload: {
    id: "reload",
    label: "Reload",
    labelJa: "リロード",
    category: "special",
    duration: 1.1,
    keyframes: [
      key(0),
      key(0.35, [0, -2, -2], [-70, 0, 10], 1),
      key(0.62, [0, -1, -1], [-45, 0, -18], 1),
      key(1.1),
    ],
    fx: [
      { time: 0.5, type: "burst" },
      { time: 0.9, type: "flash" },
    ],
    cinema: {},
  },
  saw_spin: {
    id: "saw_spin",
    label: "Saw Drive",
    labelJa: "チェーンソー駆動",
    category: "attack",
    duration: 1.2,
    keyframes: [
      key(0),
      key(0.18, [0, 0.5, 3], [-20, 0, 0], 1.02),
      key(1.2, [0, 0.5, 3], [-20, 0, 0], 1.02),
    ],
    fx: [
      { time: 0.1, type: "wheel" },
      { time: 0.1, type: "ring_spin", life: 1.1 },
    ],
    cinema: { shake: [{ at: 0.12, strength: 0.3 }, { at: 0.6, strength: 0.22 }] },
  },
  smash: {
    id: "smash",
    label: "Smash",
    labelJa: "打撃",
    category: "attack",
    duration: 1.1,
    keyframes: [
      key(0),
      key(0.35, [0, 9, -3], [-55, 0, 0], 1),
      key(0.5, [0, -5, 5], [65, 0, 0], 1.06),
      key(0.62, [0, -5, 5], [65, 0, 0], 1),
      key(1.1),
    ],
    fx: [
      { time: 0.5, type: "shockwave" },
      { time: 0.52, type: "flash" },
      { time: 0.52, type: "burst" },
    ],
    cinema: { shake: [{ at: 0.5, strength: 0.9 }], freeze: [{ at: 0.5, duration: 0.18 }], zoom: { at: 0.35, amount: 1.18 }, letterbox: 0.1 },
  },
  channel_beam: {
    id: "channel_beam",
    label: "Beam",
    labelJa: "ビーム発射",
    category: "magic",
    duration: 1.8,
    keyframes: [
      key(0),
      key(0.7, [0, 2, -2], [-15, 0, 0], 1.04),
      key(0.9, [0, 2, -2], [-15, 0, 0], 1.08),
      key(1.8),
    ],
    fx: [
      { time: 0, type: "circle_charge", life: 0.7 },
      { time: 0.72, type: "beam" },
      { time: 0.72, type: "flash" },
    ],
    cinema: { letterbox: 0.14, zoom: { at: 0.7, amount: 1.16 }, shake: [{ at: 0.75, strength: 0.45 }, { at: 1.1, strength: 0.2 }] },
  },
  arrow_release: {
    id: "arrow_release",
    label: "Loose",
    labelJa: "矢撃ち",
    category: "attack",
    duration: 0.9,
    keyframes: [
      key(0),
      key(0.35, [0, 0, -1], [-5, 0, -25], 1),
      key(0.5, [2, 0, 2], [-2, 0, 30], 1),
      key(0.9),
    ],
    fx: [
      { time: 0.42, type: "thrust_wave" },
      { time: 0.44, type: "flash" },
    ],
    cinema: { zoom: { at: 0.3, amount: 1.12 }, shake: [{ at: 0.44, strength: 0.22 }], freeze: [{ at: 0.42, duration: 0.07 }] },
  },
  spin_attack: {
    id: "spin_attack",
    label: "Spin",
    labelJa: "回転斬り",
    category: "attack",
    duration: 1.0,
    keyframes: [
      key(0),
      key(0.25, [0, 1, 0], [0, 180, 15], 1.03),
      key(0.6, [0, 1, 0], [0, 540, 15], 1.03),
      key(1),
    ],
    fx: [
      { time: 0.2, type: "slash_trail", angle: 0 },
      { time: 0.45, type: "slash_trail", angle: 180 },
      { time: 0.62, type: "shockwave" },
      { time: 0.64, type: "flash" },
    ],
    cinema: { shake: [{ at: 0.3, strength: 0.3 }, { at: 0.62, strength: 0.42 }], letterbox: 0.08 },
  },
  guard_stance: {
    id: "guard_stance",
    label: "Guard",
    labelJa: "ガード",
    category: "special",
    duration: 1.2,
    keyframes: [
      key(0),
      key(0.3, [-1, 2, -1], [-25, 0, 35], 1),
      key(1.2, [-1, 2, -1], [-25, 0, 35], 1),
    ],
    fx: [
      { time: 0.3, type: "ring_spin", life: 0.9 },
    ],
    cinema: { letterbox: 0.08 },
  },
  rail_charge: {
    id: "rail_charge",
    label: "Rail Charge",
    labelJa: "レールチャージ",
    category: "magic",
    duration: 2.2,
    keyframes: [key(0), key(1.2, [0, 0.5, -1.5], [-4, 0, 0], 1.02), key(1.42, [0, 0.5, -1.5], [-4, 0, 0], 1.04), key(1.5, [0, 1.5, -5], [14, 0, 0]), key(2.2)],
    fx: [
      { time: 0, type: "circle_charge", life: 1.4 },
      { time: 0.15, type: "implode" },
      { time: 1.45, type: "beam" },
      { time: 1.45, type: "flash" },
      { time: 1.55, type: "steam" },
    ],
    cinema: { letterbox: 0.16, zoom: { at: 1.0, amount: 1.22 }, freeze: [{ at: 1.44, duration: 0.2 }], shake: [{ at: 1.46, strength: 1 }] },
  },
  drill_spin: {
    id: "drill_spin",
    label: "Drill",
    labelJa: "ドリル回転",
    category: "attack",
    duration: 1.4,
    keyframes: [key(0), key(0.2, [0, 0, 3], [-80, 0, 0]), key(1.1, [0, 0, 6], [-80, 1440, 0], 1.03), key(1.4)],
    fx: [
      { time: 0.2, type: "wheel" },
      { time: 0.2, type: "ring_spin", life: 0.9 },
      { time: 0.7, type: "wheel" },
      { time: 1.15, type: "steam" },
      { time: 1.1, type: "flash" },
    ],
    cinema: { shake: [{ at: 0.25, strength: 0.3 }, { at: 0.7, strength: 0.35 }, { at: 1.1, strength: 0.5 }], zoom: { at: 0.2, amount: 1.1 } },
  },
  page_turn: {
    id: "page_turn",
    label: "Page Turn",
    labelJa: "頁めくり詠唱",
    category: "magic",
    duration: 1.4,
    keyframes: [key(0), key(0.3, [0, 2, 0], [-18, 0, 0]), key(0.7, [0, 3, 0], [12, 90, 0], 1.04), key(1.0, [0, 3, 0], [-10, 180, 0], 1.06), key(1.4, [0, 0, 0], [0, 360, 0])],
    fx: [
      { time: 0, type: "circle_charge", life: 1.0 },
      { time: 0.3, type: "ring_spin", life: 1.0 },
      { time: 1.0, type: "burst" },
      { time: 1.0, type: "flash" },
    ],
    cinema: { letterbox: 0.1, zoom: { at: 0.6, amount: 1.1 } },
  },
  summon: {
    id: "summon",
    label: "Summon",
    labelJa: "召喚",
    category: "magic",
    duration: 2.0,
    keyframes: [key(0), key(0.9, [0, 6, 0], [0, 270, 0], 1.04), key(1.2, [0, 7, 0], [0, 360, 0], 1.1), key(2.0)],
    fx: [
      { time: 0, type: "circle_charge", life: 1.2 },
      { time: 0.2, type: "implode" },
      { time: 1.2, type: "pillar" },
      { time: 1.2, type: "shockwave" },
      { time: 1.22, type: "burst" },
      { time: 1.22, type: "flash" },
    ],
    cinema: { letterbox: 0.14, zoom: { at: 1.0, amount: 1.18 }, shake: [{ at: 1.2, strength: 0.6 }], freeze: [{ at: 1.18, duration: 0.12 }] },
  },
  dash_strike: {
    id: "dash_strike",
    label: "Dash",
    labelJa: "突進斬り",
    category: "attack",
    duration: 0.9,
    keyframes: [key(0), key(0.15, [0, 0, -4], [-10, 0, 20]), key(0.32, [0, 0, 14], [10, 0, -80], 1.05), key(0.5, [0, 0, 14], [8, 0, -90]), key(0.9)],
    fx: [
      { time: 0.2, type: "thrust_wave" },
      { time: 0.3, type: "slash_trail", angle: 0 },
      { time: 0.32, type: "flash" },
    ],
    cinema: { zoom: { at: 0.15, amount: 1.14 }, freeze: [{ at: 0.31, duration: 0.1 }], shake: [{ at: 0.32, strength: 0.5 }] },
  },
  overheat_vent: {
    id: "overheat_vent",
    label: "Vent",
    labelJa: "強制排熱",
    category: "special",
    duration: 1.6,
    keyframes: [key(0), key(0.2, [0.3, 0, 0], [2, 0, -2]), key(0.3, [-0.3, 0, 0], [-2, 0, 2]), key(0.4, [0.3, 0.2, 0]), key(0.5, [-0.2, 0, 0]), key(0.9, [0, 0.6, 0], [0, 0, 0], 1.02), key(1.6)],
    fx: [
      { time: 0.45, type: "steam" },
      { time: 0.45, type: "flash" },
      { time: 0.9, type: "steam" },
      { time: 0.9, type: "shockwave" },
    ],
    cinema: { shake: [{ at: 0.2, strength: 0.25 }, { at: 0.45, strength: 0.45 }, { at: 0.9, strength: 0.3 }] },
  },
  blood_drain: {
    id: "blood_drain",
    label: "Drain",
    labelJa: "吸血",
    category: "magic",
    duration: 1.6,
    keyframes: [key(0), key(0.4, [0, 1, 0], [0, 0, 0], 0.94), key(0.8, [0, 1.5, 0], [0, 0, 0], 1.08), key(1.2, [0, 1, 0], [0, 0, 0], 0.97), key(1.6)],
    fx: [
      { time: 0.05, type: "implode" },
      { time: 0.8, type: "burst" },
      { time: 0.8, type: "ring_spin", life: 0.7 },
      { time: 0.8, type: "flash" },
    ],
    cinema: { letterbox: 0.1, zoom: { at: 0.6, amount: 1.12 }, shake: [{ at: 0.8, strength: 0.3 }] },
  },
  relic_resonate: {
    id: "relic_resonate",
    label: "Resonate",
    labelJa: "聖遺物共鳴",
    category: "special",
    duration: 2.0,
    keyframes: [key(0), key(1, [0, 5, 0], [0, 360, 0], 1.05), key(2, [0, 0, 0], [0, 720, 0])],
    fx: [
      { time: 0.2, type: "ring_spin", life: 1.6 },
      { time: 0.6, type: "ring_spin", life: 1.2 },
      { time: 1.0, type: "pillar" },
      { time: 1.0, type: "flash" },
      { time: 1.0, type: "burst" },
    ],
    cinema: { letterbox: 0.14, zoom: { at: 0.9, amount: 1.12 } },
  },
  uppercut: {
    id: "uppercut",
    label: "Uppercut",
    labelJa: "昇竜斬り",
    category: "attack",
    duration: 0.9,
    keyframes: [key(0), key(0.25, [0, -4, 1], [40, 0, 30]), key(0.42, [0, 8, 2], [-70, 0, -20], 1.05), key(0.6, [0, 8, 2], [-65, 0, -15]), key(0.9)],
    fx: [
      { time: 0.35, type: "slash_trail", angle: 90 },
      { time: 0.42, type: "flash" },
      { time: 0.42, type: "burst" },
    ],
    cinema: { freeze: [{ at: 0.4, duration: 0.1 }], shake: [{ at: 0.42, strength: 0.5 }], zoom: { at: 0.3, amount: 1.12 } },
  },
};

export const ACTION_LIST: ActionDefinition[] = Object.values(ACTION_DEFINITIONS);

export const IDLE_EXPORT_KEYFRAMES: ActionKeyframe[] = [
  key(0),
  key(1, [0, 1.5, 0], [0, 180, 0]),
  key(2, [0, 0, 0], [0, 360, 0]),
];

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

export function sampleKeyframes(keyframes: ActionKeyframe[], time: number): Omit<ActionKeyframe, "time"> {
  if (keyframes.length === 0) return { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 };
  if (time <= keyframes[0].time) return keyframes[0];

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const current = keyframes[index];
    const next = keyframes[index + 1];
    if (time > next.time) continue;

    const span = Math.max(0.0001, next.time - current.time);
    const t = smoothstep((time - current.time) / span);
    const mix = (a: number, b: number) => a + (b - a) * t;
    return {
      position: [mix(current.position[0], next.position[0]), mix(current.position[1], next.position[1]), mix(current.position[2], next.position[2])],
      rotation: [mix(current.rotation[0], next.rotation[0]), mix(current.rotation[1], next.rotation[1]), mix(current.rotation[2], next.rotation[2])],
      scale: mix(current.scale, next.scale),
    };
  }

  return keyframes[keyframes.length - 1];
}
