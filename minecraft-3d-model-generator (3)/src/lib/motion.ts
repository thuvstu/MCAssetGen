import type { CuboidElement, EffectPresetId, ElementMotion } from "@/db/schema";
import { buildAuraCommands } from "@/lib/effects";

export function rotationVec(el: CuboidElement): [number, number, number] {
  return [
    el.rotation.axis === "x" ? el.rotation.angle : 0,
    el.rotation.axis === "y" ? el.rotation.angle : 0,
    el.rotation.axis === "z" ? el.rotation.angle : 0,
  ];
}

function loopOf(m: ElementMotion) {
  return Math.max(0.2, m.loopSeconds);
}

export function bobOffset(motion: ElementMotion, seconds: number): number {
  const u = (seconds / loopOf(motion) + motion.phase) % 1;
  return Math.sin(u * Math.PI * 2) * motion.bob;
}

export function orbitRadians(motion: ElementMotion, seconds: number): number {
  const u = (seconds / loopOf(motion)) % 1;
  return motion.orbitTurns * u * Math.PI * 2;
}

export function spinRadians(motion: ElementMotion, seconds: number): number {
  if (!motion.spin) return 0;
  const u = (seconds / loopOf(motion) + motion.phase) % 1;
  return motion.spin.turns * u * Math.PI * 2;
}

export function pulseScale(motion: ElementMotion, seconds: number): number {
  if (!motion.scalePulse) return 1;
  const u = (seconds / loopOf(motion) + motion.phase) % 1;
  // Double-beat heartbeat curve: two quick thumps then rest.
  const beat = Math.max(0, Math.sin(u * Math.PI * 4)) * (u < 0.5 ? 1 : 0.35);
  return 1 + motion.scalePulse * beat;
}

export function isLooping(m: ElementMotion | undefined): boolean {
  return !!m && (m.orbitTurns !== 0 || m.bob > 0 || !!m.spin || !!m.scalePulse);
}

export function isAnimated(el: CuboidElement): boolean {
  return isLooping(el.motion) || !!el.motion?.transformDelta;
}

export function boneUuid(elementUuid: string): string {
  return `bone-${elementUuid}`;
}

type Channel = "rotation" | "position" | "scale";

let kfCounter = 0;
function kf(channel: Channel, time: number, vec: [number, number, number], interpolation = "linear") {
  kfCounter += 1;
  return {
    channel,
    data_points: [{ x: vec[0].toFixed(3), y: vec[1].toFixed(3), z: vec[2].toFixed(3) }],
    uuid: `kf-${channel}-${kfCounter}`,
    time: Number(time.toFixed(4)),
    color: -1,
    interpolation,
  };
}

/**
 * Blockbench animations keyed by per-cube bones (see the exporter's outliner).
 * Keyframes are bone-relative, so the cube keeps its own rest rotation and the bone
 * origin equals the cube origin — shared origins make rings orbit as a unit.
 */
export function buildBlockbenchAnimations(elements: CuboidElement[], uuids: string[]): unknown[] {
  kfCounter = 0;
  const visible = elements.filter((el) => el.visible);
  const animations: unknown[] = [];

  const looping = visible
    .map((el, index) => ({ el, uuid: uuids[index] }))
    .filter((item) => isLooping(item.el.motion));

  if (looping.length > 0) {
    const loops = looping.map((l) => loopOf(l.el.motion as ElementMotion));
    const length = Math.max(...loops);
    const animators: Record<string, unknown> = {};

    for (const { el, uuid } of looping) {
      const mot = el.motion as ElementMotion;
      if (!uuid) continue;
      // Whole turns over the shared length keep the loop seamless.
      const ratio = length / loopOf(mot);
      const turns = (t: number) => (t === 0 ? 0 : Math.round(t * ratio) || Math.sign(t));
      const keyframes: unknown[] = [];
      const orbit = turns(mot.orbitTurns);
      const spin = mot.spin ? turns(mot.spin.turns) : 0;
      if (orbit !== 0 || spin !== 0) {
        const end: [number, number, number] = [0, orbit * 360, 0];
        if (mot.spin) {
          const axisIndex = mot.spin.axis === "x" ? 0 : mot.spin.axis === "y" ? 1 : 2;
          end[axisIndex] += spin * 360;
        }
        keyframes.push(kf("rotation", 0, [0, 0, 0]));
        keyframes.push(kf("rotation", length, end));
      }
      const samples = 12;
      if (mot.bob > 0) {
        for (let i = 0; i <= samples; i++) {
          const time = (i / samples) * length;
          keyframes.push(kf("position", time, [0, Number(bobOffset(mot, time).toFixed(3)), 0], "catmullrom"));
        }
      }
      if (mot.scalePulse) {
        for (let i = 0; i <= samples; i++) {
          const time = (i / samples) * length;
          const s = Number(pulseScale(mot, time).toFixed(3));
          keyframes.push(kf("scale", time, [s, s, s], "catmullrom"));
        }
      }
      animators[boneUuid(uuid)] = { name: `${el.name}_bone`, type: "bone", keyframes };
    }

    animations.push({
      uuid: "anim-idle-mana",
      name: "idle_mana",
      loop: "loop",
      override: false,
      length,
      snapping: 24,
      selected: true,
      anim_time_update: "",
      blend_weight: "",
      start_delay: "",
      loop_delay: "",
      animators,
    });
  }

  const transformable = visible
    .map((el, index) => ({ el, uuid: uuids[index] }))
    .filter((item) => item.el.motion?.transformDelta);

  if (transformable.length > 0) {
    const tfLen = 1.5;
    const animators: Record<string, unknown> = {};
    for (const { el, uuid } of transformable) {
      const td = el.motion?.transformDelta;
      if (!td || !uuid) continue;
      const rot: [number, number, number] = [td.rotation?.[0] ?? 0, td.rotation?.[1] ?? 0, td.rotation?.[2] ?? 0];
      const pos: [number, number, number] = [td.translation?.[0] ?? 0, td.translation?.[1] ?? 0, td.translation?.[2] ?? 0];
      const keyframes: unknown[] = [];
      for (const [time, k] of [[0, 0], [tfLen * 0.5, 1], [tfLen, 1]] as const) {
        keyframes.push(kf("position", time, [pos[0] * k, pos[1] * k, pos[2] * k], "catmullrom"));
        keyframes.push(kf("rotation", time, [rot[0] * k, rot[1] * k, rot[2] * k], "catmullrom"));
        if (td.scale) {
          keyframes.push(kf("scale", time, [1 + (td.scale[0] - 1) * k, 1 + (td.scale[1] - 1) * k, 1 + (td.scale[2] - 1) * k]));
        }
      }
      animators[boneUuid(uuid)] = { name: `${el.name}_bone`, type: "bone", keyframes };
    }
    animations.push({
      uuid: "anim-transform-overdrive",
      name: "transform_overdrive",
      loop: "hold",
      override: true,
      length: tfLen,
      snapping: 24,
      selected: false,
      anim_time_update: "",
      blend_weight: "",
      start_delay: "",
      loop_delay: "",
      animators,
    });
  }

  return animations;
}

export function buildAuraFunction(modelName: string, preset?: EffectPresetId): string {
  const safeName = modelName.replace(/"/g, "");
  return [
    `# VoxelForge aura for ${safeName} (effect: ${preset ?? "mana"})`,
    "# Drop the datapack/ folder into <world>/datapacks and /reload.",
    "# Vanilla item models cannot animate. These particles play while the posed model is held.",
    ...buildAuraCommands(preset),
    "",
  ].join("\n");
}

export function hasMotion(elements: CuboidElement[]): boolean {
  return elements.some((el) => el.visible && isAnimated(el));
}
