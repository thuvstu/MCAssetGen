import type { PartRig, Vec3 } from "../model-types";
import type { GeometryBuilder } from "./builder";

export function rigBox(
  b: GeometryBuilder,
  name: string,
  from: Vec3,
  to: Vec3,
  material: number,
  rig: PartRig,
  emissive = false,
) {
  b.box(name, from, to, material, emissive);
  b.cubes[b.cubes.length - 1].rig = rig;
}
/** A voxel line, kept as independent editable cubes for native Blockbench geometry. */
export function voxelLine(
  b: GeometryBuilder,
  name: string,
  a: Vec3,
  end: Vec3,
  thickness: number,
  material: number,
  emissive = false,
  rig?: PartRig,
) {
  const length = Math.max(...end.map((value, i) => Math.abs(value - a[i])));
  const steps = Math.max(1, Math.ceil(length / Math.max(thickness * 0.9, 0.5)));
  for (let step = 0; step <= steps; step++) {
    const p = a.map(
      (value, i) => value + ((end[i] - value) * step) / steps,
    ) as Vec3;
    const from = p.map((value) => value - thickness / 2) as Vec3;
    const to = p.map((value) => value + thickness / 2) as Vec3;
    if (rig) rigBox(b, name, from, to, material, rig, emissive);
    else b.box(name, from, to, material, emissive);
  }
}
export function ring(
  b: GeometryBuilder,
  name: string,
  center: Vec3,
  radius: number,
  count: number,
  thickness: number,
  material: number,
  plane: "xy" | "xz" = "xy",
  emissive = false,
) {
  for (let i = 0; i < count; i++) {
    const a = (i * Math.PI * 2) / count;
    const p: Vec3 = [center[0] + Math.cos(a) * radius, center[1], center[2]];
    if (plane === "xy") p[1] += Math.sin(a) * radius;
    else p[2] += Math.sin(a) * radius;
    b.box(
      name,
      p.map((n) => n - thickness / 2) as Vec3,
      p.map((n) => n + thickness / 2) as Vec3,
      material,
      emissive,
    );
  }
}
export function crystal(
  b: GeometryBuilder,
  name: string,
  center: Vec3,
  height: number,
  width: number,
  material = 2,
  emissive = true,
) {
  for (let y = 0; y < 7; y++) {
    const half =
      width * (y === 0 || y === 6 ? 0.25 : y === 1 || y === 5 ? 0.36 : 0.5);
    const bottom = center[1] - height / 2 + (y * height) / 7;
    b.box(
      name,
      [center[0] - half, bottom, center[2] - half],
      [center[0] + half, bottom + height / 7, center[2] + half],
      y % 3 === 1 ? Math.min(4, material + 1) : material,
      emissive,
    );
  }
}
export function hangingChain(
  b: GeometryBuilder,
  name: string,
  start: Vec3,
  links: number,
  material = 6,
) {
  for (let i = 0; i < links; i++) {
    const y = start[1] - i * 1.2;
    if (i % 2)
      b.box(
        name,
        [start[0] - 0.2, y - 0.9, start[2] - 0.55],
        [start[0] + 0.2, y, start[2] + 0.55],
        material,
      );
    else {
      for (const x of [-0.45, 0.3])
        b.box(
          name,
          [start[0] + x, y - 0.9, start[2] - 0.18],
          [start[0] + x + 0.15, y, start[2] + 0.18],
          material,
        );
      b.box(
        name,
        [start[0] - 0.45, y - 0.9, start[2] - 0.18],
        [start[0] + 0.45, y - 0.7, start[2] + 0.18],
        material,
      );
    }
  }
}
