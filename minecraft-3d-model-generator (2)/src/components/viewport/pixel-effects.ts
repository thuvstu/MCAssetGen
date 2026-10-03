import * as THREE from "three";
import { EFFECT_PROFILES } from "@/lib/effect-profiles";
import type { EffectStyle } from "@/lib/model-types";

export interface PixelEffect {
  points: THREE.Points;
  phases: Float32Array;
  radii: Float32Array;
  style: EffectStyle;
}
/** Deterministic particle placement prevents a new preview from flashing random layouts. */
export function createPixelEffect(
  style: EffectStyle,
  accent: string,
  seed: number,
): PixelEffect | null {
  const profile = EFFECT_PROFILES[style];
  if (!profile.particleCount) return null;
  const count = profile.particleCount,
    positions = new Float32Array(count * 3),
    phases = new Float32Array(count),
    radii = new Float32Array(count);
  let state = seed >>> 0;
  const rand = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    phases[i] = rand() * Math.PI * 2;
    radii[i] = 2 + rand() * 6;
    positions[i * 3] = (rand() - 0.5) * 16;
    positions[i * 3 + 1] = (rand() - 0.5) * 24;
    positions[i * 3 + 2] = (rand() - 0.5) * 12;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: profile.color ?? accent,
    size: profile.size,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  return { points: new THREE.Points(geometry, material), phases, radii, style };
}
export function updatePixelEffect(
  effect: PixelEffect,
  delta: number,
  time: number,
  power: number,
) {
  const profile = EFFECT_PROFILES[effect.style],
    positions = effect.points.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
  for (let i = 0; i < effect.phases.length; i++) {
    const phase = effect.phases[i],
      r = effect.radii[i];
    if (profile.motion === "orbit") {
      const a = phase + time * profile.speed;
      positions.setXYZ(
        i,
        Math.cos(a) * r,
        Math.sin(phase * 2 + time * 0.4) * 9,
        Math.sin(a) * r * 0.7,
      );
    } else if (profile.motion === "electric") {
      const a = phase + Math.floor(time * 12) * 0.35;
      positions.setXYZ(
        i,
        Math.cos(a) * r,
        Math.sin(phase + time * 4) * 10,
        Math.sin(a) * r * 0.55,
      );
    } else {
      const dir = profile.motion === "fall" ? -1 : 1;
      let y =
        positions.getY(i) + dir * delta * profile.speed * power * (0.7 + r / 8);
      if (y > 15) y = -13;
      if (y < -13) y = 15;
      positions.setY(i, y);
      positions.setX(i, Math.sin(phase + time * 0.3) * r);
    }
  }
  positions.needsUpdate = true;
  (effect.points.material as THREE.PointsMaterial).opacity =
    profile.motion === "electric"
      ? 0.45 + 0.45 * Math.abs(Math.sin(time * 17))
      : 0.55 + 0.2 * Math.sin(time * 2);
}
