import { ModelElement, Vector3 } from "@/types/model";

export type SpawnKind = "grow" | "jab" | "drop" | "rise" | "unfold" | "converge" | "flash";
export type DeathKind = "crumble" | "shatter" | "vanish";

export interface SpawnPlan {
  kind: SpawnKind;
  delay: number;
  duration: number;
}

export interface TransitionPlan {
  fromPosition: Vector3;
  fromRotation: Vector3;
  fromScale: Vector3;
  duration: number;
}

export interface DeathPlan {
  kind: DeathKind;
  delay: number;
  duration: number;
}

export interface TransformPlan {
  spawns: Map<string, SpawnPlan>;
  transitions: Map<string, TransitionPlan>;
  deaths: Map<string, DeathPlan>;
}

const SPAWN_RULES: ReadonlyArray<[RegExp, SpawnKind]> = [
  [/^vx_form_wing/, "unfold"],
  [/^vx_form_(spike|horn)/, "jab"],
  [/^vx_(tier_guard|lb_fin|tier_crown)/, "jab"],
  [/^vx_form_(chain|lock|seal)/, "drop"],
  [/^vx_form_crystal/, "converge"],
  [/^vx_lb_(halo|sun|crest)/, "flash"],
  [/^vx_tier_(band|socket|pommel)/, "rise"],
  [/^vx_tier_aura/, "flash"],
];

const DEATH_RULES: ReadonlyArray<[RegExp, DeathKind]> = [
  [/^vx_form_(chain|lock|seal)/, "crumble"],
  [/^vx_form_crystal/, "shatter"],
];

// ---------- easings ----------
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const easeOutBounce = (t: number) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
};

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function sameVec(a: Vector3, b: Vector3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function dims(element: ModelElement): Vector3 {
  const inflate = element.inflate ?? 0;
  return [
    element.to[0] - element.from[0] + inflate * 2,
    element.to[1] - element.from[1] + inflate * 2,
    element.to[2] - element.from[2] + inflate * 2,
  ];
}

function spawnKindFor(id: string): SpawnKind {
  const rule = SPAWN_RULES.find(([pattern]) => pattern.test(id));
  return rule ? rule[1] : "grow";
}

function deathKindFor(id: string): DeathKind {
  const rule = DEATH_RULES.find(([pattern]) => pattern.test(id));
  return rule ? rule[1] : "vanish";
}

/** Diff two element sets into a choreographed morph plan (spawn / transition / death). */
export function planTransform(prev: Map<string, ModelElement>, next: ModelElement[]): TransformPlan {
  const spawns = new Map<string, SpawnPlan>();
  const transitions = new Map<string, TransitionPlan>();
  const deaths = new Map<string, DeathPlan>();
  const delays = new Map<string, number>();
  const nextIds = new Set(next.map((element) => element.id));

  const stagger = (bucket: string) => {
    const current = delays.get(bucket) ?? 0;
    delays.set(bucket, current + 1);
    return Math.min(0.85, current * 0.055);
  };

  next.forEach((element) => {
    const old = prev.get(element.id);
    if (!old) {
      const kind = spawnKindFor(element.id);
      const baseDelay = prev.size === 0 ? Math.min(0.4, hashString(element.id) * 0.35) : stagger(`s:${kind}`);
      spawns.set(element.id, { kind, delay: baseDelay, duration: kind === "flash" ? 0.4 : 0.55 });
      return;
    }
    const moved = !sameVec(old.origin, element.origin);
    const rotated = !sameVec(old.rotation, element.rotation);
    const oldDims = dims(old);
    const newDims = dims(element);
    const resized = !sameVec(oldDims, newDims);
    if (moved || rotated || resized) {
      transitions.set(element.id, {
        fromPosition: old.origin,
        fromRotation: old.rotation,
        fromScale: [newDims[0] === 0 ? 1 : oldDims[0] / newDims[0], newDims[1] === 0 ? 1 : oldDims[1] / newDims[1], newDims[2] === 0 ? 1 : oldDims[2] / newDims[2]],
        duration: 0.45,
      });
    }
  });

  prev.forEach((element, id) => {
    if (!nextIds.has(id)) {
      deaths.set(id, { kind: deathKindFor(id), delay: stagger(`d:${deathKindFor(id)}`), duration: 0.5 });
    }
  });

  return { spawns, transitions, deaths };
}

export interface AnimPose {
  pos: Vector3;
  rot: Vector3; // degrees
  scale: number;
  opacity: number;
}

const NEUTRAL: AnimPose = { pos: [0, 0, 0], rot: [0, 0, 0], scale: 1, opacity: 1 };

/** Per-frame spawn choreography. side = sign of the cube's base x offset (for symmetric unfold). */
export function evaluateSpawn(kind: SpawnKind, progress: number, side: number, seed: number): AnimPose {
  const p = Math.max(0, Math.min(1, progress));
  switch (kind) {
    case "grow": {
      const e = easeOutBack(p);
      return { ...NEUTRAL, scale: Math.max(0.001, e), opacity: Math.min(1, p * 3) };
    }
    case "jab": {
      const e = easeOutBack(Math.min(1, p * 1.15));
      return { pos: [0, 0, 0], rot: [0, 0, 0], scale: Math.max(0.001, e), opacity: Math.min(1, p * 5) };
    }
    case "drop": {
      const e = easeOutBounce(p);
      return { pos: [0, (1 - e) * 20, 0], rot: [0, (1 - p) * 120, 0], scale: 1, opacity: Math.min(1, p * 2.5) };
    }
    case "rise": {
      const e = easeOutCubic(p);
      return { pos: [0, -(1 - e) * 8, 0], rot: [0, 0, 0], scale: 1, opacity: e };
    }
    case "unfold": {
      const e = easeOutBack(p);
      // Fold flat toward the hilt, then open outward like a hand fan.
      return { pos: [0, 0, 0], rot: [0, 0, (1 - e) * -75 * side], scale: 0.55 + 0.45 * e, opacity: Math.min(1, p * 2) };
    }
    case "converge": {
      const e = easeOutCubic(p);
      const angle = seed * Math.PI * 2;
      const radius = (1 - e) * 22;
      return { pos: [Math.cos(angle) * radius, (1 - e) * 4, Math.sin(angle) * radius], rot: [0, (1 - e) * 540, 0], scale: 1, opacity: Math.min(1, p * 2) };
    }
    case "flash": {
      const e = easeOutCubic(p);
      return { pos: [0, 0, 0], rot: [0, 0, 0], scale: 0.6 + 0.4 * e, opacity: p };
    }
  }
}

/** Per-frame death choreography for removed cubes. */
export function evaluateDeath(kind: DeathKind, progress: number, seed: number): AnimPose {
  const p = Math.max(0, Math.min(1, progress));
  switch (kind) {
    case "crumble": {
      const e = p * p;
      return { pos: [0, -e * 16, 0], rot: [(seed - 0.5) * 180 * e, 0, (seed - 0.25) * 240 * e], scale: 1 - 0.35 * p, opacity: 1 - p };
    }
    case "shatter": {
      const e = easeOutCubic(p);
      const angle = seed * Math.PI * 2;
      return { pos: [Math.cos(angle) * e * 16, e * 7 - p * p * 9, Math.sin(angle) * e * 16], rot: [seed * 360 * p, seed * 720 * p, 0], scale: 1 - 0.15 * p, opacity: (1 - p) * (1 - p) };
    }
    case "vanish": {
      return { pos: [0, 0, 0], rot: [0, 0, 0], scale: 1 - 0.65 * p, opacity: 1 - p };
    }
  }
}
