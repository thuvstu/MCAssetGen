import { ColorPalette, GroupKey, MaterialKey, VoxelElement } from "./types";
import { shadeColor } from "./color";

const r2 = (v: number) => Math.round(v * 100) / 100;

export interface BoxOpts {
  emissive?: boolean;
  group?: GroupKey;
  /** subtle per-call colour shift so identical materials don't read flat */
  tint?: number;
  uv?: [number, number];
}

/**
 * Fluent voxel authoring helper. All coordinates are Minecraft element space
 * (the same units Blockbench uses), the model is built standing on y ≈ 0.
 */
export class VoxelBuilder {
  readonly elements: VoxelElement[] = [];

  constructor(
    public readonly palette: ColorPalette,
    private readonly cx = 8,
    private readonly cz = 8
  ) {}

  get centerX() {
    return this.cx;
  }
  get centerZ() {
    return this.cz;
  }

  colorOf(material: MaterialKey, tint = 0): string {
    const base = this.palette[material] ?? "#ff00ff";
    return tint ? shadeColor(base, tint) : base;
  }

  box(
    name: string,
    from: [number, number, number],
    to: [number, number, number],
    material: MaterialKey,
    opts: BoxOpts = {}
  ): this {
    const minX = Math.min(from[0], to[0]);
    const minY = Math.min(from[1], to[1]);
    const minZ = Math.min(from[2], to[2]);
    const maxX = Math.max(from[0], to[0]);
    const maxY = Math.max(from[1], to[1]);
    const maxZ = Math.max(from[2], to[2]);
    this.elements.push({
      name,
      from: [r2(minX), r2(minY), r2(minZ)],
      to: [r2(maxX), r2(maxY), r2(maxZ)],
      color: this.colorOf(material, opts.tint),
      material,
      emissive: opts.emissive ?? (material === "gem" || material === "glow"),
      group: opts.group ?? "Blade",
      uv: opts.uv,
    });
    return this;
  }

  /** box centred on x = cx and z = cz */
  cxBox(
    name: string,
    y: number,
    w: number,
    h: number,
    d: number,
    material: MaterialKey,
    opts: BoxOpts & { cx?: number; cz?: number } = {}
  ): this {
    const ox = opts.cx ?? this.cx;
    const oz = opts.cz ?? this.cz;
    return this.box(
      name,
      [ox - w / 2, y, oz - d / 2],
      [ox + w / 2, y + h, oz + d / 2],
      material,
      opts
    );
  }

  /** vertical spike / pyramid built from stacked shrinking rings */
  spike(
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    height: number,
    material: MaterialKey,
    opts: BoxOpts & { layers?: number } = {}
  ): this {
    const layers = opts.layers ?? Math.max(2, Math.round(height));
    for (let i = 0; i < layers; i++) {
      const t = i / layers;
      const s = w * (1 - t);
      if (s <= 0.15) break;
      this.box(
        `${name}_${i}`,
        [x - s / 2, y + (height * i) / layers, z - s / 2],
        [x + s / 2, y + (height * (i + 1)) / layers, z + s / 2],
        material,
        opts
      );
    }
    return this;
  }

  /**
   * Ring (or partial arc) of small boxes around a centre — used for circular
   * guards, halos, magic rings and pommel collars.
   */
  ring(
    name: string,
    y: number,
    radius: number,
    thickness: number,
    material: MaterialKey,
    opts: BoxOpts & {
      segments?: number;
      span?: number;
      start?: number;
      height?: number;
      cx?: number;
      cz?: number;
      yFn?: (t: number) => number;
      tilt?: number;
    } = {}
  ): this {
    const seg = opts.segments ?? Math.max(8, Math.round(radius * 3));
    const span = opts.span ?? Math.PI * 2;
    const start = opts.start ?? 0;
    const h = opts.height ?? thickness;
    const ox = opts.cx ?? this.cx;
    const oz = opts.cz ?? this.cz;
    for (let i = 0; i < seg; i++) {
      const a = start + (i / seg) * span;
      const x = ox + Math.cos(a) * radius;
      const z = oz + Math.sin(a) * radius;
      const yy = y + (opts.yFn ? opts.yFn(i / seg) : 0);
      this.box(
        `${name}_${i}`,
        [x - thickness / 2, yy, z - thickness / 2],
        [x + thickness / 2, yy + h, z + thickness / 2],
        material,
        opts
      );
    }
    return this;
  }

  /** Chain / ribbon / string of boxes following a 3D polyline */
  strand(
    name: string,
    points: [number, number, number][],
    thickness: number,
    material: MaterialKey,
    opts: BoxOpts = {}
  ): this {
    for (let i = 0; i < points.length; i++) {
      const [x, y, z] = points[i];
      this.box(
        `${name}_${i}`,
        [x - thickness / 2, y - thickness / 2, z - thickness / 2],
        [x + thickness / 2, y + thickness / 2, z + thickness / 2],
        material,
        opts
      );
    }
    return this;
  }

  /** Hollow-ish rounded shell row: used by shields, helmets, crystal bodies */
  facetedRing(
    name: string,
    y: number,
    radiusX: number,
    radiusZ: number,
    thickness: number,
    height: number,
    material: MaterialKey,
    opts: BoxOpts & { segments?: number } = {}
  ): this {
    const seg = opts.segments ?? 12;
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const x = this.cx + Math.cos(a) * radiusX;
      const z = this.cz + Math.sin(a) * radiusZ;
      this.box(
        `${name}_${i}`,
        [x - thickness / 2, y, z - thickness / 2],
        [x + thickness / 2, y + height, z + thickness / 2],
        material,
        opts
      );
    }
    return this;
  }

  /** Mirrors a callback across x for symmetric structures */
  mirror(fn: (side: 1 | -1) => void): void {
    fn(1);
    fn(-1);
  }
}
