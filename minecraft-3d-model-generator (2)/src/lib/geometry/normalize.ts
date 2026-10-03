import type { ModelCube, ModelSettings, Vec3 } from "../model-types";

const AXES = [0, 1, 2] as const;
/** Java item models allow -16..32; centred on 8 that is ±24. Keep a margin. */
const JAVA_EXTENT_LIMIT = 23.5;

const round = (value: number) => +value.toFixed(4);

/**
 * Centres the geometry on the origin and rescales it so the body fits the
 * requested width/height/depth. Ornaments from upgrades are excluded from the
 * fit (so +5 is not smaller than +0) and the whole model is then shrunk only
 * if it would leave the Java model coordinate range.
 */
export function normalizeCubes(
  cubes: ModelCube[],
  settings: ModelSettings,
): ModelCube[] {
  const reference = cubes.some((cube) => !cube.ornament)
    ? cubes.filter((cube) => !cube.ornament)
    : cubes;
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const cube of reference) {
    for (const axis of AXES) {
      min[axis] = Math.min(min[axis], cube.from[axis]);
      max[axis] = Math.max(max[axis], cube.to[axis]);
    }
  }

  const target: Vec3 = [settings.width, settings.height, settings.depth];
  const project = (value: number, axis: number) => {
    const center = (min[axis] + max[axis]) / 2;
    const span = max[axis] - min[axis];
    return round(((value - center) * target[axis]) / span);
  };

  let result = cubes.map((cube, index) => ({
    ...cube,
    name: `${cube.name}_${index + 1}`,
    from: cube.from.map(project) as Vec3,
    to: cube.to.map(project) as Vec3,
  }));

  const extent = Math.max(
    ...result.flatMap((cube) => [...cube.from, ...cube.to].map(Math.abs)),
  );
  if (extent > JAVA_EXTENT_LIMIT) {
    const factor = JAVA_EXTENT_LIMIT / extent;
    result = result.map((cube) => ({
      ...cube,
      from: cube.from.map((value) => round(value * factor)) as Vec3,
      to: cube.to.map((value) => round(value * factor)) as Vec3,
    }));
  }
  return result;
}
