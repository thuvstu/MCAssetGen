import type { ActionStyle, PartRig, Vec3 } from "../model-types";

/**
 * Attack, spell and transformation motions. The same keyframes drive the
 * in-app preview and the Blockbench export, so what you see is what gets
 * written. `scale` exists so a machine can unfold and reassemble.
 */
export type ActiveAction = Exclude<ActionStyle, "none">;

export interface ActionKeyframe {
  time: number;
  /** Degrees, applied around the grip pivot. */
  rotation: Vec3;
  /** Model units (1/16 block). */
  position: Vec3;
  /** Applied around the grip pivot. */
  scale: Vec3;
  /** Preview-only light multiplier. */
  glow: number;
}

export interface ActionDefinition {
  label: string;
  length: number;
  keyframes: ActionKeyframe[];
  rigs?: Partial<Record<PartRig, ActionKeyframe[]>>;
}

export interface ActionSample {
  rotation: Vec3;
  position: Vec3;
  scale: Vec3;
  glow: number;
}

const ZERO: Vec3 = [0, 0, 0];
const UNIT: Vec3 = [1, 1, 1];
const key = (
  time: number,
  rotation: Vec3 = ZERO,
  position: Vec3 = ZERO,
  scale: Vec3 = UNIT,
  glow = 1,
): ActionKeyframe => ({ time, rotation, position, scale, glow });

export const ACTIONS: Record<ActiveAction, ActionDefinition> = {
  slash: {
    label: "斬撃",
    length: 1.2,
    keyframes: [
      key(0),
      key(0.25, [0, 0, 35]),
      key(0.5, [0, 0, -95], [2, 0, 0], UNIT, 1.6),
      key(0.8, [0, 0, -95], [2, 0, 0], UNIT, 1.2),
      key(1.2),
    ],
  },
  thrust: {
    label: "刺突",
    length: 1.2,
    keyframes: [
      key(0),
      key(0.3, ZERO, [0, -3, 0]),
      key(0.45, ZERO, [0, 6, 0], UNIT, 1.8),
      key(0.8, ZERO, [0, 6, 0], UNIT, 1.2),
      key(1.2),
    ],
  },
  spin: {
    label: "回転斬り",
    length: 1,
    keyframes: [
      key(0),
      key(0.2, [0, 0, 20]),
      key(0.7, [0, 360, 20], ZERO, UNIT, 1.6),
      key(1, [0, 360, 0]),
    ],
  },
  cast: {
    label: "詠唱",
    length: 1.6,
    keyframes: [
      key(0),
      key(0.4, [-15, 0, 0], [0, 3, 0], UNIT, 2.2),
      key(1, [-15, 0, 0], [0, 3, 0], UNIT, 2.6),
      key(1.6),
    ],
  },
  charge: {
    label: "チャージ",
    length: 1.2,
    keyframes: [
      key(0),
      key(0.15, [0, 0, 4], [0, 0.6, 0], UNIT, 1.4),
      key(0.3, [0, 0, -4], [0, 0.8, 0], UNIT, 1.8),
      key(0.45, [0, 0, 4], [0, 1, 0], UNIT, 2.2),
      key(0.6, [0, 0, -4], [0, 1, 0], UNIT, 2.6),
      key(0.9, ZERO, [0, 1, 0], UNIT, 3),
      key(1.2),
    ],
  },
  transform: {
    label: "変形",
    length: 1.8,
    keyframes: [
      key(0),
      key(0.25, [0, 0, -12], [0, -1.2, 0], [1, 0.5, 1.4], 1.3),
      key(0.55, [0, 180, -26], [0, 2.2, 0], [1.4, 1.2, 1.4], 2.6),
      key(0.85, [0, 360, 0], [0, 4.5, 0], [1, 1.7, 1], 3.2),
      key(1.15, [0, 360, 0], [0, 2, 0], [1, 1.15, 1], 2.4),
      key(1.8),
    ],
    rigs: {
      panel_left: [
        key(0),
        key(0.55, [0, 0, 35], [-1, 0, 0]),
        key(1.15, [0, 0, 35], [-1, 0, 0]),
        key(1.8),
      ],
      panel_right: [
        key(0),
        key(0.55, [0, 0, -35], [1, 0, 0]),
        key(1.15, [0, 0, -35], [1, 0, 0]),
        key(1.8),
      ],
    },
  },
  shoot: {
    label: "射撃",
    length: 0.8,
    keyframes: [
      key(0),
      key(0.08, [0, 0, 6], [-1.4, 0, 0], UNIT, 2.5),
      key(0.2, [0, 0, 2], [-0.4, 0, 0]),
      key(0.8),
    ],
    rigs: {
      mechanism: [key(0), key(0.08, ZERO, [-1.3, 0, 0]), key(0.25), key(0.8)],
    },
  },
  reload: {
    label: "リロード",
    length: 2.2,
    keyframes: [key(0), key(0.4, [0, 0, 18]), key(1.5, [0, 0, 18]), key(2.2)],
    rigs: {
      magazine: [
        key(0),
        key(0.5, ZERO, [0, -4, 0]),
        key(1.2, ZERO, [0, -4, 0]),
        key(1.7),
        key(2.2),
      ],
    },
  },
  draw: {
    label: "弓引き",
    length: 1.8,
    keyframes: [
      key(0),
      key(0.8, [0, 0, -4], ZERO, UNIT, 1.8),
      key(1.2, [0, 0, -4], ZERO, UNIT, 2),
      key(1.4),
      key(1.8),
    ],
    rigs: {
      string: [
        key(0),
        key(0.8, ZERO, [-3, 0, 0]),
        key(1.2, ZERO, [-3, 0, 0]),
        key(1.35),
        key(1.8),
      ],
    },
  },
  summon: {
    label: "召喚",
    length: 2.4,
    keyframes: [
      key(0),
      key(0.6, [0, 15, 0], [0, 2, 0], UNIT, 1.6),
      key(1.2, [0, 30, 0], [0, 3, 0], [1.1, 1.1, 1.1], 3),
      key(1.8, [0, 15, 0], [0, 2, 0], UNIT, 1.8),
      key(2.4),
    ],
  },
  ritual: {
    label: "儀式",
    length: 3,
    keyframes: [
      key(0),
      key(1, [0, 0, 4], [0, 1.2, 0], UNIT, 2),
      key(2, [0, 0, -4], [0, 1.2, 0], UNIT, 2.5),
      key(3),
    ],
    rigs: {
      page: [
        key(0),
        key(1, [0, 12, 0], [0, 0, 0.25]),
        key(2, [0, -12, 0], [0, 0, 0.25]),
        key(3),
      ],
    },
  },
  slam: {
    label: "振り下ろし",
    length: 1.5,
    keyframes: [
      key(0),
      key(0.4, [0, 0, 55], [0, 2, 0]),
      key(0.65, [0, 0, -115], [0, -3, 0], UNIT, 2.8),
      key(0.95, [0, 0, -100], [0, -2, 0], UNIT, 1.5),
      key(1.5),
    ],
  },
  rev: {
    label: "チェーン駆動",
    length: 0.6,
    keyframes: [
      key(0),
      key(0.15, [0, 0, 1], [0, 0.1, 0], UNIT, 1.6),
      key(0.3, [0, 0, -1], [0, -0.1, 0], UNIT, 1.8),
      key(0.6),
    ],
    rigs: {
      mechanism: [
        key(0),
        key(0.15, ZERO, [0, 0.35, 0]),
        key(0.3, ZERO, [0, -0.35, 0]),
        key(0.6),
      ],
    },
  },
};

export function isActiveAction(
  action: ActionStyle | undefined,
): action is ActiveAction {
  return !!action && action !== "none" && action in ACTIONS;
}

/** Pivot height of the motion: roughly where the weapon is gripped. */
export function actionPivotY(height: number): number {
  return -height * 0.3;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpVec = (a: Vec3, b: Vec3, t: number) =>
  a.map((value, axis) => lerp(value, b[axis], t)) as Vec3;

/** Linear sample of an action at `time` seconds (wraps around the loop). */
export function sampleAction(
  action: ActiveAction,
  time: number,
  rig?: PartRig,
): ActionSample {
  const { length } = ACTIONS[action];
  const keyframes = rig
    ? (ACTIONS[action].rigs?.[rig] ?? [key(0), key(length)])
    : ACTIONS[action].keyframes;
  const t = ((time % length) + length) % length;
  for (let i = 0; i < keyframes.length - 1; i++) {
    const current = keyframes[i];
    const next = keyframes[i + 1];
    if (t < current.time || t > next.time) continue;
    const progress =
      next.time === current.time
        ? 0
        : (t - current.time) / (next.time - current.time);
    return {
      rotation: lerpVec(current.rotation, next.rotation, progress),
      position: lerpVec(current.position, next.position, progress),
      scale: lerpVec(current.scale, next.scale, progress),
      glow: lerp(current.glow, next.glow, progress),
    };
  }
  const last = keyframes[keyframes.length - 1];
  return {
    rotation: last.rotation,
    position: last.position,
    scale: last.scale,
    glow: last.glow,
  };
}
