import { DIRECTIONS, Direction, ModelData, UVRect, Vector3 } from "./asset-types";

type JavaRotationAxis = "x" | "y" | "z";

interface JavaFace {
  uv: UVRect;
  texture: "#0";
  rotation?: number;
}

interface JavaElement {
  from: Vector3;
  to: Vector3;
  faces: Partial<Record<Direction, JavaFace>>;
  rotation?: { angle: number; axis: JavaRotationAxis; origin: Vector3 };
}

// Minecraft Java rejects any element coordinate outside [-16, 32].
const JAVA_MIN = -16;
const JAVA_MAX = 32;
const round = (value: number) => Math.round(value * 1000) / 1000;

function normalizeUv(uv: UVRect, textureWidth: number, textureHeight: number): UVRect {
  return [(uv[0] * 16) / textureWidth, (uv[1] * 16) / textureHeight, (uv[2] * 16) / textureWidth, (uv[3] * 16) / textureHeight].map(round) as UVRect;
}

function dominantRotation(rotation: Vector3): { axis: JavaRotationAxis; angle: number } | null {
  const candidates: Array<{ axis: JavaRotationAxis; value: number }> = [
    { axis: "x", value: rotation[0] },
    { axis: "y", value: rotation[1] },
    { axis: "z", value: rotation[2] },
  ];
  const best = candidates.reduce((current, candidate) => (Math.abs(candidate.value) > Math.abs(current.value) ? candidate : current));
  if (Math.abs(best.value) <= 0.01) return null;
  // Java only supports a single axis in 22.5° steps within ±45°.
  return { axis: best.axis, angle: Math.max(-45, Math.min(45, Math.round(best.value / 22.5) * 22.5)) };
}

export interface JavaFitInfo {
  scale: number;
  fitted: boolean;
}

/** Computes a uniform scale that keeps the whole model inside Minecraft's legal element box. */
export function computeJavaFit(model: ModelData): JavaFitInfo & { center: Vector3 } {
  const lo: Vector3 = [Infinity, Infinity, Infinity];
  const hi: Vector3 = [-Infinity, -Infinity, -Infinity];
  model.elements.forEach((element) => {
    if (element.visible === false) return;
    const inflate = element.inflate ?? 0;
    for (let axis = 0; axis < 3; axis += 1) {
      lo[axis] = Math.min(lo[axis], Math.min(element.from[axis], element.to[axis]) - inflate + 8);
      hi[axis] = Math.max(hi[axis], Math.max(element.from[axis], element.to[axis]) + inflate + 8);
    }
  });
  if (!Number.isFinite(lo[0])) return { scale: 1, fitted: false, center: [8, 8, 8] };
  const inside = lo.every((value) => value >= JAVA_MIN) && hi.every((value) => value <= JAVA_MAX);
  if (inside) return { scale: 1, fitted: false, center: [8, 8, 8] };
  const center: Vector3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  const halfExtent = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2;
  return { scale: Math.min(1, 23.9 / Math.max(0.01, halfExtent)), fitted: true, center };
}

export function exportToMinecraftJava(model: ModelData, texturePath: string = "item/custom_model"): string {
  const fit = computeJavaFit(model);
  const toJava = (vector: Vector3): Vector3 =>
    fit.fitted
      ? (vector.map((value, axis) => round(8 + (value + 8 - fit.center[axis]) * fit.scale)) as Vector3)
      : (vector.map((value) => round(value + 8)) as Vector3);

  const elements: JavaElement[] = model.elements
    .filter((element) => element.visible !== false)
    .map((element) => {
      const inflate = element.inflate ?? 0;
      const from: Vector3 = [Math.min(element.from[0], element.to[0]) - inflate, Math.min(element.from[1], element.to[1]) - inflate, Math.min(element.from[2], element.to[2]) - inflate];
      const to: Vector3 = [Math.max(element.from[0], element.to[0]) + inflate, Math.max(element.from[1], element.to[1]) + inflate, Math.max(element.from[2], element.to[2]) + inflate];
      const faces = DIRECTIONS.reduce<JavaElement["faces"]>((result, direction) => {
        const face = element.faces[direction];
        if (face) result[direction] = { uv: normalizeUv(face.uv, model.textureWidth, model.textureHeight), texture: "#0", ...(face.rotation ? { rotation: face.rotation } : {}) };
        return result;
      }, {});
      const rotation = dominantRotation(element.rotation);
      return {
        from: toJava(from),
        to: toJava(to),
        faces,
        ...(rotation ? { rotation: { ...rotation, origin: toJava(element.origin) } } : {}),
      };
    });

  // Compensate in-hand size when the geometry had to be shrunk (display scale is capped at 4 by the game).
  const grow = (value: number) => round(Math.min(4, value / fit.scale));
  const scaled = (base: number): Vector3 => [grow(base), grow(base), grow(base)];

  return JSON.stringify(
    {
      credit: "Created with Minecraft 3D Model Forge",
      texture_size: [model.textureWidth, model.textureHeight],
      textures: { "0": texturePath, particle: texturePath },
      elements,
      display: {
        thirdperson_righthand: { rotation: [0, -90, 55], translation: [0, 4, 0.5], scale: scaled(0.85) },
        thirdperson_lefthand: { rotation: [0, 90, -55], translation: [0, 4, 0.5], scale: scaled(0.85) },
        firstperson_righthand: { rotation: [0, -90, 25], translation: [1.13, 3.2, 1.13], scale: scaled(0.68) },
        firstperson_lefthand: { rotation: [0, 90, -25], translation: [1.13, 3.2, 1.13], scale: scaled(0.68) },
        ground: { rotation: [0, 0, 0], translation: [0, 2, 0], scale: scaled(0.5) },
        gui: { rotation: [15, -25, -5], translation: [0, 0, 0], scale: scaled(0.5) },
        head: { rotation: [0, 180, 0], translation: [0, 13, 7], scale: scaled(1) },
        fixed: { rotation: [0, 180, 0], translation: [0, 0, 0], scale: scaled(0.8) },
      },
    },
    null,
    2,
  );
}
