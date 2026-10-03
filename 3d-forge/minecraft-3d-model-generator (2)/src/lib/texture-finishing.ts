import { PNG } from "pngjs";
import { decodeDataUrl, toDataUrl, toHexColor, toRgb } from "./atlas";
import {
  DEFAULT_GRADIENT,
  type GeneratedModel,
  type GradientSettings,
  type ModelCube,
} from "./model-types";

const PATCH = 16;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function gradientProgress(
  cube: ModelCube,
  bounds: { min: number[]; max: number[] },
  mode: GradientSettings["mode"],
): number {
  const centre = cube.from.map((v, i) => (v + cube.to[i]) / 2);
  const norm = centre.map(
    (v, i) =>
      (v - bounds.min[i]) / Math.max(0.01, bounds.max[i] - bounds.min[i]),
  );
  const value =
    mode === "vertical"
      ? norm[1]
      : mode === "horizontal"
        ? norm[0]
        : mode === "diagonal"
          ? (norm[0] + norm[1]) / 2
          : Math.min(1, Math.hypot((norm[0] - 0.5) * 2, (norm[1] - 0.5) * 2));
  return Math.max(0, Math.min(1, value));
}
/** Bakes gradient and per-cube paint into a portable, deduplicated pixel atlas. */
export function finishTexture(model: GeneratedModel): GeneratedModel {
  const gradient = { ...DEFAULT_GRADIENT, ...model.settings.gradient };
  if (!gradient.enabled && !model.cubes.some((c) => c.painted)) return model;
  const source = PNG.sync.read(decodeDataUrl(model.texture.source));
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (const c of model.cubes)
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], c.from[a]);
      max[a] = Math.max(max[a], c.to[a]);
    }
  const from = toRgb(gradient.from),
    to = toRgb(gradient.to);
  const patches = new Map<
    string,
    { uv: number[]; paint?: string; level: number; index: number }
  >();
  const keys = model.cubes.map((c) => {
    const t = gradient.enabled
      ? gradientProgress(c, { min, max }, gradient.mode)
      : 0;
    const level = Math.round(t * (gradient.steps - 1));
    const key = `${c.uv.join(",")}|${c.painted ? c.color : ""}|${level}`;
    if (!patches.has(key))
      patches.set(key, {
        uv: c.uv,
        paint: c.painted ? c.color : undefined,
        level,
        index: patches.size,
      });
    return key;
  });
  const columns =
    2 ** Math.ceil(Math.log2(Math.max(1, Math.ceil(Math.sqrt(patches.size)))));
  const rows =
    2 ** Math.ceil(Math.log2(Math.max(1, Math.ceil(patches.size / columns))));
  const png = new PNG({ width: columns * PATCH, height: rows * PATCH });
  const patchColours = new Map<string, string>();
  for (const [key, p] of patches) {
    const ox = (p.index % columns) * PATCH,
      oy = Math.floor(p.index / columns) * PATCH;
    const tint = from.map((v, i) =>
      mix(v, to[i], p.level / Math.max(1, gradient.steps - 1)),
    );
    const paint = p.paint ? toRgb(p.paint) : undefined;
    const sum = [0, 0, 0];
    let count = 0;
    for (let y = 0; y < PATCH; y++)
      for (let x = 0; x < PATCH; x++) {
        const sx = Math.max(
          0,
          Math.min(
            source.width - 1,
            Math.floor(p.uv[0] + ((p.uv[2] - p.uv[0]) * (x + 0.5)) / PATCH),
          ),
        );
        const sy = Math.max(
          0,
          Math.min(
            source.height - 1,
            Math.floor(p.uv[1] + ((p.uv[3] - p.uv[1]) * (y + 0.5)) / PATCH),
          ),
        );
        const si = (sy * source.width + sx) * 4,
          di = ((oy + y) * png.width + ox + x) * 4;
        for (let a = 0; a < 3; a++) {
          const base = paint?.[a] ?? source.data[si + a];
          const target =
            gradient.blend === "multiply" ? (base * tint[a]) / 255 : tint[a];
          png.data[di + a] = Math.round(
            gradient.enabled
              ? mix(base, target, gradient.strength / 100)
              : base,
          );
          sum[a] += png.data[di + a];
        }
        png.data[di + 3] = paint ? 255 : source.data[si + 3];
        count++;
      }
    patchColours.set(key, toHexColor(sum.map((v) => v / count)));
  }
  return {
    ...model,
    texture: {
      ...model.texture,
      width: png.width,
      height: png.height,
      source: toDataUrl(PNG.sync.write(png)),
      name: model.texture.name.replace(/\.png$/i, "_finished.png"),
    },
    cubes: model.cubes.map((c, i) => {
      const p = patches.get(keys[i])!,
        x = (p.index % columns) * PATCH,
        y = Math.floor(p.index / columns) * PATCH;
      return {
        ...c,
        color: patchColours.get(keys[i])!,
        painted: false,
        uv: [x, y, x + PATCH, y + PATCH],
      };
    }),
  };
}
