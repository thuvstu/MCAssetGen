import { accentEntries, bbFaceTexture, bbTintTextures } from "./color-textures";
import {
  FACES, NAMESPACE, type BodyAnim, type DecorAnim, type EffectId, type Extras, type Motion, type TransformAnim,
  type Vec3, type VoxelCube, type VoxelModel,
} from "./model-types";
import { cubesOf, faceUv, gridOf, isTilted, poseOf, textureHeight, textureWidth, TILT } from "./models";
import { boundsOf, normalizeExtras } from "./decor";

export interface NodeTransform { pos: Vec3; rot: Vec3; scale: Vec3 }
export const identity = (): NodeTransform => ({ pos: [0, 0, 0], rot: [0, 0, 0], scale: [1, 1, 1] });

/** One base cycle in seconds at speed 1. Idle loops run two cycles so orbiting parts close seamlessly. */
export const PERIOD = 2.4;
const round = (value: number, digits = 3) => Math.round(value * 10 ** digits) / 10 ** digits;
export const idleLength = (speed: number) => round(2 * PERIOD / speed);
export const transformLength = (speed: number) => round(PERIOD / speed);

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const outCubic = (x: number) => 1 - (1 - x) ** 3;
const inQuad = (x: number) => x * x;
const inOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
const outBack = (x: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2; };

export const BODY_LABELS: Record<BodyAnim, string> = { none: "なし", float: "浮遊", spin: "回転", sway: "揺れ", pulse: "脈動", breathe: "呼吸", hover: "ホバー", shake: "震え", levitate: "浮上", vibrate: "振動" };
export const DECOR_LABELS: Record<DecorAnim, string> = { none: "なし", auto: "おまかせ", twinkle: "明滅", orbit: "周回", drift: "ゆらぎ" };
export const TRANSFORM_LABELS: Record<TransformAnim, string> = { none: "なし", swing: "斬撃スイング", unsheathe: "展開", powerup: "パワーアップ", spinjump: "回転ジャンプ", slash: "斬撃", slam: "叩きつけ", charge: "チャージ", dash: "ダッシュ", spin_attack: "回転斬り" };

/** Continuous idle motion of the whole body (child of the tilt group, so "spin" rolls around the item's own axis). */
export function bodyAt(mode: BodyAnim, t: number, speed: number): NodeTransform {
  const n = identity(), phase = t * speed / PERIOD, a = phase * TAU;
  switch (mode) {
    case "float": n.pos[1] = Math.sin(a) * .9; n.rot[2] = Math.sin(a + 1) * 2; break;
    case "spin": n.rot[1] = (t * speed / (2 * PERIOD)) * 360; break;
    case "sway": n.rot[2] = Math.sin(a) * 8; n.rot[0] = Math.cos(a) * 3; break;
    case "pulse": { const s = 1 + .06 * Math.sin(2 * a); n.scale = [s, s, s]; break; }
    case "breathe": n.scale = [1 - .02 * Math.sin(a), 1 + .04 * Math.sin(a), 1 - .02 * Math.sin(a)]; break;
    case "hover": n.pos[1] = Math.sin(a) * 1.2; n.rot[0] = Math.cos(a) * 2; break;
    case "shake": n.pos[0] = Math.sin(a * 12) * .4; n.pos[1] = Math.cos(a * 12) * .3; break;
    case "levitate": n.pos[1] = Math.sin(a) * 1.8 + 1; n.rot[1] = Math.sin(a * .5) * 8; break;
    case "vibrate": n.pos[0] = Math.sin(a * 10) * .3; n.pos[2] = Math.cos(a * 10) * .3; break;
    default: break;
  }
  return n;
}

/** Keyframed transform presets. `u` is 0..1 of the clip; `root` moves everything, `tip` only the upper part. */
export function transformAt(preset: TransformAnim, rawU: number): { root: NodeTransform; tip: NodeTransform } {
  const u = clamp01(rawU), root = identity(), tip = identity();
  switch (preset) {
    case "swing": {
      root.rot[2] = u < .25 ? lerp(0, -65, outCubic(u / .25)) : u < .5 ? lerp(-65, 100, inQuad((u - .25) / .25)) : lerp(100, 0, outCubic((u - .5) / .5));
      root.pos[0] = u < .25 ? 0 : u < .5 ? lerp(0, 2, (u - .25) / .25) : lerp(2, 0, outCubic((u - .5) / .5));
      break;
    }
    case "unsheathe": {
      const k = clamp01(u / .6), extend = u < .6 ? outBack(k) : 1;
      tip.scale = [lerp(.6, 1, outCubic(k)), lerp(.12, 1, extend), lerp(.6, 1, outCubic(k))];
      root.pos[1] = lerp(-3, 0, outCubic(clamp01(u / .5)));
      break;
    }
    case "powerup": {
      const s = 1 + .3 * Math.sin(Math.PI * u);
      root.scale = [s, s, s]; root.rot[1] = 360 * inOutSine(u); root.pos[1] = 2.5 * Math.sin(Math.PI * u);
      break;
    }
    case "spinjump": root.pos[1] = 20 * u * (1 - u); root.rot[1] = 720 * inOutSine(u); break;
    case "slash": { root.rot[2] = u < .3 ? lerp(0, -75, outCubic(u / .3)) : u < .55 ? lerp(-75, 85, inQuad((u - .3) / .25)) : lerp(85, 0, outCubic((u - .55) / .45)); break; }
    case "slam": { root.pos[1] = u < .3 ? lerp(0, -12, inQuad(u / .3)) : u < .5 ? lerp(-12, 1.5, outCubic((u - .3) / .2)) : lerp(1.5, 0, outCubic((u - .5) / .5)); root.rot[2] = u < .3 ? 15 * u / .3 : u < .5 ? 15 * (1 - (u - .3) / .2) : 0; break; }
    case "charge": { const s = 1 + .25 * Math.sin(Math.PI * u); root.scale = [s, s, s]; root.rot[1] = 30 * Math.sin(Math.PI * u); root.pos[1] = 3 * Math.sin(Math.PI * u); break; }
    case "dash": { root.pos[0] = u < .3 ? lerp(0, -8, inQuad(u / .3)) : u < .6 ? lerp(-8, 6, outCubic((u - .3) / .3)) : lerp(6, 0, outCubic((u - .6) / .4)); root.rot[2] = u < .3 ? 20 * u / .3 : 0; break; }
    case "spin_attack": { root.rot[1] = 720 * inOutSine(u); root.scale = [1 + .12 * Math.sin(Math.PI * u), 1, 1 + .12 * Math.sin(Math.PI * u)]; break; }
    default: break;
  }
  return { root, tip };
}

/** Which motion a decoration cube performs for the chosen decoration-animation mode. */
export function motionFor(cube: VoxelCube, mode: DecorAnim): Motion | null {
  if (cube.group !== "decor" || mode === "none") return null;
  const native = cube.motion;
  if (mode === "auto") return native ?? null;
  const center: Vec3 = [(cube.from[0] + cube.to[0]) / 2, (cube.from[1] + cube.to[1]) / 2, (cube.from[2] + cube.to[2]) / 2];
  if (mode === "orbit") return { kind: "orbit", phase: native?.phase ?? 0, pivot: native?.kind === "orbit" && native.pivot ? native.pivot : [8, center[1], 8] };
  return { kind: mode, phase: native?.phase ?? 0, pivot: center };
}
export function motionAt(motion: Motion, t: number, speed: number): NodeTransform {
  const n = identity(), period = PERIOD / speed, a = (t / period + motion.phase) * TAU;
  switch (motion.kind) {
    case "orbit": n.rot[1] = (t / (2 * period) + motion.phase) * 360; break;
    case "twinkle": { const s = 1 + .55 * Math.sin(a); n.scale = [s, s, s]; break; }
    case "drift": n.pos = [.5 * Math.cos(a), .7 * Math.sin(a), .5 * Math.sin(a)]; break;
    case "sway": n.rot[2] = (motion.amp ?? 9) * Math.sin(a); break;
    case "flicker": { const f = Math.sin(2 * a); n.scale = [1 - .08 * f, 1 + .28 * f, 1 - .08 * f]; break; }
    case "bob": n.pos[1] = .6 * Math.sin(a); break;
    case "jitter": n.pos = [.3 * Math.sin(a * 7), .25 * Math.cos(a * 7), .3 * Math.cos(a * 5)]; break;
    case "wobble": n.rot[0] = 8 * Math.sin(a); n.rot[2] = 6 * Math.cos(a); break;
    case "stretch": { const s = 1 + .2 * Math.sin(a); n.scale = [1 / s, s, 1 / s]; break; }
    case "pulse_fast": { const s = 1 + .35 * Math.sin(2 * a); n.scale = [s, s, s]; break; }
  }
  return n;
}

export interface DecorNode { cube: VoxelCube; motion: Motion; pivot: Vec3 }
export interface AnimPlan { grip: VoxelCube[]; tip: VoxelCube[]; splitY: number; decorStatic: VoxelCube[]; decorNodes: DecorNode[] }
/** Splits a model into the parts that move independently: grip / tip of the body and decorations. */
export function planFor(cubes: VoxelCube[], extras?: Extras | null): AnimPlan {
  const mode = normalizeExtras(extras).animation.decor;
  const body = cubes.filter(cube => cube.group !== "decor");
  const b = boundsOf(body.length ? body : cubes);
  const splitY = round(b.minY + (b.maxY - b.minY) * .42);
  const grip: VoxelCube[] = [], tip: VoxelCube[] = [], decorStatic: VoxelCube[] = [], decorNodes: DecorNode[] = [];
  for (const cube of cubes) {
    if (cube.group === "decor") {
      const motion = motionFor(cube, mode);
      if (motion) decorNodes.push({ cube, motion, pivot: motion.pivot ?? [(cube.from[0] + cube.to[0]) / 2, (cube.from[1] + cube.to[1]) / 2, (cube.from[2] + cube.to[2]) / 2] });
      else decorStatic.push(cube);
    } else ((cube.from[1] + cube.to[1]) / 2 < splitY ? grip : tip).push(cube);
  }
  return { grip, tip, splitY, decorStatic, decorNodes };
}
export const hasIdleMotion = (extras: Extras | undefined | null, plan: AnimPlan) => {
  const e = normalizeExtras(extras);
  return e.animation.body !== "none" || plan.decorNodes.length > 0;
};

// ---- Particles (preview; the game version is the generated data pack) ---------------------------
export interface ParticleBox { cx: number; cy: number; cz: number; rx: number; ry: number; rz: number }
export interface ParticleState { x: number; y: number; z: number; alpha: number; size: number }
const fract = (value: number) => value - Math.floor(value);
export const rand = (i: number, salt: number) => fract(Math.sin(i * 127.1 + salt * 311.7) * 43758.5453);
const LIFE: Record<Exclude<EffectId, "none">, number> = { sparkle: 2.6, flame: 1.1, soulfire: 1.1, snow: 3.4, magic: 3, electric: .4, hearts: 2.4, poison: 2, void: 2.8, blood: 1.4, gold: 2.2, wind: 1.8, frost: 3 };
/** Stateless particle: position is a pure function of (index, time), so previews are reproducible. */
export function particleAt(effect: EffectId, i: number, t: number, box: ParticleBox, speed = 1): ParticleState | null {
  if (effect === "none") return null;
  const life = LIFE[effect] / Math.max(.5, speed);
  const cycle = t / life + rand(i, 1), k = Math.floor(cycle), u = cycle - k;
  const seed = i + k * 13.7, a = rand(seed, 2) * TAU, b = rand(seed, 3), c = rand(seed, 4);
  const { cx, cy, cz, rx, ry, rz } = box;
  switch (effect) {
    case "sparkle": {
      const r = (0.9 + .4 * b);
      return { x: cx + Math.cos(a) * (rx + 1.5) * r, y: cy + (c * 2 - 1) * ry + u * 1.2, z: cz + Math.sin(a) * (rz + 1.5) * r, alpha: Math.sin(Math.PI * u) ** 2, size: .55 + .5 * rand(i, 5) };
    }
    case "flame": case "soulfire":
      return { x: cx + (b * 2 - 1) * rx * .9 + Math.sin(u * 6 + a) * .3, y: cy - ry * .4 + u * (ry * 1.2 + 2), z: cz + (c * 2 - 1) * rz * .9, alpha: (1 - u) * Math.min(1, u / .1), size: .8 * (1 - u * .6) };
    case "snow":
      return { x: cx + (b * 2 - 1) * (rx + 4), y: cy + ry + 2 - u * (2 * ry + 5), z: cz + (c * 2 - 1) * (rz + 4) + Math.sin(u * 5 + a) * .4, alpha: Math.sqrt(Math.sin(Math.PI * u)), size: .5 };
    case "magic": {
      const angle = a + u * TAU * 1.5, radius = (rx + 1.6) * (1 - .35 * u);
      return { x: cx + Math.cos(angle) * radius, y: cy - ry + u * 2 * ry, z: cz + Math.sin(angle) * radius, alpha: Math.sin(Math.PI * u), size: .7 };
    }
    case "electric":
      return { x: cx + (b * 2 - 1) * (rx + 1.5), y: cy + (c * 2 - 1) * ry, z: cz + (rand(seed, 6) * 2 - 1) * (rz + 1.5), alpha: u < .5 ? 1 - u * 2 : 0, size: .5 };
    case "hearts":
      return { x: cx + (b * 2 - 1) * (rx + 1), y: cy + ry * .3 + u * (ry * .7 + 3), z: cz + (c * 2 - 1) * rz + Math.sin(u * 4 + a) * .5, alpha: Math.sin(Math.PI * u), size: 1 };
    case "poison": return { x: cx + (b * 2 - 1) * rx * .8, y: cy - ry * .3 + u * ry * 1.2, z: cz + (c * 2 - 1) * rz * .8, alpha: Math.sin(Math.PI * u) * .7, size: 1.1 };
    case "void": { const angle2 = a + u * TAU * 1.2, r2 = (rx + 2) * (1 - .4 * u); return { x: cx + Math.cos(angle2) * r2, y: cy + (c * 2 - 1) * ry, z: cz + Math.sin(angle2) * r2, alpha: Math.sin(Math.PI * u) * .8, size: .9 }; }
    case "blood": return { x: cx + (b * 2 - 1) * rx * .6, y: cy + ry - u * ry * 2, z: cz + (c * 2 - 1) * rz * .6, alpha: 1 - u, size: .7 };
    case "gold": { const angle3 = a + u * TAU; return { x: cx + Math.cos(angle3) * (rx + 1), y: cy + Math.sin(u * Math.PI) * ry, z: cz + Math.sin(angle3) * (rz + 1), alpha: Math.sin(Math.PI * u), size: .8 }; }
    case "wind": return { x: cx + (b * 2 - 1) * (rx + 3), y: cy + Math.sin(u * Math.PI * 3 + a) * 2, z: cz + (c * 2 - 1) * (rz + 3), alpha: Math.sin(Math.PI * u) * .5, size: 1.2 };
    case "frost": return { x: cx + (b * 2 - 1) * (rx + 1.5), y: cy + ry + 1 - u * (ry + 2), z: cz + (c * 2 - 1) * (rz + 1.5), alpha: Math.sqrt(Math.sin(Math.PI * u)) * .8, size: .6 };
  }
  return null;
}

// ---- Blockbench animated export ------------------------------------------------------------------
type Sample = { t: number; node: NodeTransform };
const same = (a: Vec3, b: Vec3) => a.every((value, axis) => Math.abs(value - b[axis]) < 1e-4);
function keyframesOf(samples: Sample[]) {
  const frames: Record<string, unknown>[] = [];
  const channels: [string, (node: NodeTransform) => Vec3, Vec3][] = [["position", node => node.pos, [0, 0, 0]], ["rotation", node => node.rot, [0, 0, 0]], ["scale", node => node.scale, [1, 1, 1]]];
  for (const [channel, pick, neutral] of channels) {
    if (samples.every(sample => same(pick(sample.node), neutral))) continue;
    for (const sample of samples) {
      const [x, y, z] = pick(sample.node);
      frames.push({ channel, data_points: [{ x: round(x), y: round(y), z: round(z) }], uuid: crypto.randomUUID(), time: round(sample.t), color: -1, interpolation: "linear" });
    }
  }
  return frames;
}
function sampled(length: number, perSecond: number, at: (t: number) => NodeTransform): Sample[] {
  const count = Math.max(8, Math.round(length * perSecond));
  return Array.from({ length: count + 1 }, (_, index) => { const t = round(index * length / count); return { t, node: at(t) }; });
}

/**
 * A Blockbench "Generic Model" project with the real hierarchy
 * model_root → tilt → body → (grip, tip, decor → per-decoration bones), plus baked animations.
 * Java Block projects have no animation mode in Blockbench, which is why this is a separate format.
 */
export function toBlockbenchAnimatedJson(model: VoxelModel, textureSource: string, stage = -1) {
  const extras = normalizeExtras(model.extras), speed = extras.animation.speed;
  const tilted = isTilted(poseOf(model));
  const width = textureWidth(model), height = textureHeight(model), grid = gridOf(model);
  const cubes = cubesOf(model, stage), plan = planFor(cubes, extras);
  const colors = accentEntries(model);
  const uuid = () => crypto.randomUUID();
  const group = (name: string, origin: Vec3, rotation: Vec3 = [0, 0, 0]) => ({ name, uuid: uuid(), origin, rotation, color: 0, export: true, isOpen: true, locked: false, visibility: true, autouv: 0 });
  const root = group("model_root", [8, 8, 8]), tilt = group("tilt", [8, 8, 8], [0, 0, tilted ? TILT : 0]);
  const body = group("body", [8, 8, 8]), grip = group("grip", [8, 8, 8]), tip = group("tip", [8, plan.splitY, 8]), decor = group("decor", [8, 8, 8]);
  const nodeGroups = plan.decorNodes.map(node => ({ node, group: group(node.cube.name, node.pivot) }));
  const elementOf = (cube: VoxelCube) => ({
    name: cube.name, type: "cube", uuid: uuid(), from: cube.from, to: cube.to,
    origin: [(cube.from[0] + cube.to[0]) / 2, (cube.from[1] + cube.to[1]) / 2, (cube.from[2] + cube.to[2]) / 2], rotation: [0, 0, 0],
    color: cube.color % 8, export: true, visibility: true, box_uv: false,
    faces: Object.fromEntries(FACES.map(face => [face, { uv: faceUv(cube, face, cube.tint ? 16 : width, cube.tint ? 16 : height, grid), texture: bbFaceTexture(cube, colors) }])),
  });
  const gripEls = plan.grip.map(elementOf), tipEls = plan.tip.map(elementOf), staticEls = plan.decorStatic.map(elementOf);
  const nodeEls = nodeGroups.map(entry => ({ ...entry, element: elementOf(entry.node.cube) }));
  const outliner = [{ uuid: root.uuid, isOpen: true, children: [{ uuid: tilt.uuid, isOpen: true, children: [{ uuid: body.uuid, isOpen: true, children: [
    { uuid: grip.uuid, isOpen: true, children: gripEls.map(element => element.uuid) },
    { uuid: tip.uuid, isOpen: true, children: tipEls.map(element => element.uuid) },
    { uuid: decor.uuid, isOpen: true, children: [...staticEls.map(element => element.uuid), ...nodeEls.map(entry => ({ uuid: entry.group.uuid, isOpen: false, children: [entry.element.uuid] }))] },
  ] }] }] }];
  const animators = (entries: { id: string; name: string; samples: Sample[] }[]) => Object.fromEntries(
    entries.map(entry => [entry.id, { name: entry.name, type: "bone", keyframes: keyframesOf(entry.samples) }]).filter(([, value]) => (value as { keyframes: unknown[] }).keyframes.length),
  );
  const animations: Record<string, unknown>[] = [];
  const idle = idleLength(speed);
  const idleEntries = [
    ...(extras.animation.body !== "none" ? [{ id: body.uuid, name: "body", samples: sampled(idle, 5, t => bodyAt(extras.animation.body, t, speed)) }] : []),
    ...nodeGroups.map(entry => ({ id: entry.group.uuid, name: entry.group.name, samples: sampled(idle, 5, t => motionAt(entry.node.motion, t, speed)) })),
  ];
  const idleAnimators = animators(idleEntries);
  const base = { override: false, snapping: 24, selected: false, anim_time_update: "", blend_weight: "", start_delay: "", loop_delay: "" };
  if (Object.keys(idleAnimators).length) animations.push({ uuid: uuid(), name: "idle", loop: "loop", length: idle, ...base, animators: idleAnimators });
  if (extras.animation.transform !== "none") {
    const length = transformLength(speed), preset = extras.animation.transform;
    const at = (t: number) => transformAt(preset, t / length);
    const transformAnimators = animators([
      { id: root.uuid, name: "model_root", samples: sampled(length, 12, t => at(t).root) },
      { id: tip.uuid, name: "tip", samples: sampled(length, 12, t => at(t).tip) },
    ]);
    if (Object.keys(transformAnimators).length) animations.push({ uuid: uuid(), name: `transform_${preset}`, loop: "once", length, ...base, animators: transformAnimators });
  }
  return {
    meta: { format_version: "5.0", model_format: "free", box_uv: false },
    name: model.name, model_identifier: model.slug, resolution: { width, height },
    elements: [...gripEls, ...tipEls, ...staticEls, ...nodeEls.map(entry => entry.element)],
    groups: [root, tilt, body, grip, tip, decor, ...nodeGroups.map(entry => entry.group)],
    outliner,
    textures: [{ uuid: uuid(), id: "0", name: `${model.slug}.png`, width, height, uv_width: width, uv_height: height, source: textureSource, internal: true, mode: "bitmap", saved: false, namespace: NAMESPACE, folder: "item" }, ...bbTintTextures(model)],
    animations,
  };
}
