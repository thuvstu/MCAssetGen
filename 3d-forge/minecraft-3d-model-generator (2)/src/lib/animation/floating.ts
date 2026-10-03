import type { AnimationStyle, Vec3 } from "../model-types";
export interface FloatingFrame {
  time: number;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}
export const FLOATING_LENGTH = 3;
const FRAME_CACHE = new Map<AnimationStyle, FloatingFrame[]>();
export function floatingFrames(style: AnimationStyle): FloatingFrame[] {
  const cached = FRAME_CACHE.get(style);
  if (cached) return cached;
  const frames: FloatingFrame[] = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12,
      angle = t * Math.PI * 2;
    return {
      time: t * FLOATING_LENGTH,
      position:
        style === "orbit"
          ? [
              Math.sin(angle) * 1.1,
              Math.sin(angle) * 0.25,
              (Math.cos(angle) - 1) * 1.1,
            ]
          : [0, style === "float" ? Math.sin(angle) * 0.7 : 0, 0],
      rotation:
        style === "spin"
          ? [0, t * 360, 0]
          : style === "sway"
            ? [Math.sin(angle) * 6, 0, 0]
            : [0, 0, 0],
      scale:
        style === "pulse"
          ? [
              1 + Math.sin(angle) * 0.12,
              1 + Math.sin(angle) * 0.12,
              1 + Math.sin(angle) * 0.12,
            ]
          : [1, 1, 1],
    };
  });
  FRAME_CACHE.set(style, frames);
  return frames;
}
export function sampleFloating(
  style: AnimationStyle,
  time: number,
): FloatingFrame {
  const frames = floatingFrames(style),
    t = ((time % FLOATING_LENGTH) + FLOATING_LENGTH) % FLOATING_LENGTH;
  const i = Math.min(11, Math.floor((t / FLOATING_LENGTH) * 12)),
    a = frames[i],
    b = frames[i + 1],
    p = (t - a.time) / (b.time - a.time);
  const blend = (v: Vec3, w: Vec3) =>
    v.map((n, j) => n + (w[j] - n) * p) as Vec3;
  return {
    time: t,
    position: blend(a.position, b.position),
    rotation: blend(a.rotation, b.rotation),
    scale: blend(a.scale, b.scale),
  };
}
