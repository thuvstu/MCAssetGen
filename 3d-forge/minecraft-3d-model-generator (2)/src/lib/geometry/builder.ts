import type { ModelCube, ModelSettings, UVRect, Vec3 } from "../model-types";

/** Layout of the generated 64x64 fallback atlas: 4 columns of 16x32 tiles. */
const ATLAS_COLUMNS = 4;
const TILE_WIDTH = 16;
const TILE_HEIGHT = 32;
/** Materials that collapse onto a simpler one in the minimal style. */
const MINIMAL_MATERIAL_ALIASES: Readonly<Record<number, number>> = { 7: 5 };
/** Above this detail threshold the extra decorative passes run. */
const DETAIL_THRESHOLD = 35;

/**
 * Accumulates the cubes of a model in Blockbench units.
 *
 * Shape modules never touch UV math or the palette directly; they describe
 * boxes with a material index and the builder resolves colours, UV rectangles
 * and the floater layer consistently.
 */
export class GeometryBuilder {
  readonly cubes: ModelCube[] = [];
  /** How far form changes raised the top of the model; floaters follow it. */
  anchorLift = 0;
  private readonly hash: number;

  constructor(
    readonly settings: ModelSettings,
    private readonly palette: string[],
    private readonly regions?: UVRect[],
  ) {
    let hash = settings.seed;
    for (const char of settings.prompt)
      hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
    this.hash = hash;
  }

  /** True when the model should receive its decorative detail pass. */
  get detailed(): boolean {
    const { quality, detail, style } = this.settings;
    return (
      quality !== "standard" && detail > DETAIL_THRESHOLD && style !== "minimal"
    );
  }

  /** How many decorative accents a detailed model receives. */
  get accentCount(): number {
    return this.settings.quality === "ultra" ? 5 : 3;
  }

  /** Deterministic 0-99 value derived from the seed and the prompt. */
  noise(a: number, b: number): number {
    return (
      ((((a + 29) * 73856093) ^ ((b + 53) * 19349663) ^ this.hash) >>> 0) % 100
    );
  }

  /** Adds a cube belonging to the solid body of the model. */
  box(
    name: string,
    from: Vec3,
    to: Vec3,
    material: number,
    emissive = false,
  ): void {
    const resolved = this.resolveMaterial(material);
    this.cubes.push({
      name,
      from,
      to,
      color: this.palette[resolved] ?? this.palette[0],
      material: resolved,
      uv: this.uvFor(resolved),
      ...(emissive ? { emissive: true } : {}),
    });
  }

  /** Adds a cube that floats around the model and animates separately. */
  floater(
    name: string,
    from: Vec3,
    to: Vec3,
    material: number,
    emissive = false,
  ): void {
    this.box(name, from, to, material, emissive);
    this.cubes[this.cubes.length - 1].layer = "floater";
  }

  /**
   * Adds a decoration from an upgrade or form modifier. Ornaments do not
   * count towards the requested model size, so upgrades never shrink the body.
   */
  ornament(
    name: string,
    from: Vec3,
    to: Vec3,
    material: number,
    emissive = false,
    floating = false,
  ): void {
    this.box(name, from, to, material, emissive);
    const cube = this.cubes[this.cubes.length - 1];
    cube.ornament = true;
    if (floating) cube.layer = "floater";
  }

  /** Cubes of the solid weapon itself (no floaters, no ornaments). */
  bodyCubes(): ModelCube[] {
    return this.cubes.filter((cube) => !cube.layer && !cube.ornament);
  }

  bodyBounds(): { min: Vec3; max: Vec3 } {
    const min: Vec3 = [Infinity, Infinity, Infinity];
    const max: Vec3 = [-Infinity, -Infinity, -Infinity];
    for (const cube of this.bodyCubes()) {
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], cube.from[axis]);
        max[axis] = Math.max(max[axis], cube.to[axis]);
      }
    }
    return { min, max };
  }

  /** Horizontal extent of the body at height `y` (falls back to the full width). */
  spanAt(y: number): [number, number] {
    let low = Infinity;
    let high = -Infinity;
    for (const cube of this.bodyCubes()) {
      if (cube.from[1] > y || cube.to[1] < y) continue;
      low = Math.min(low, cube.from[0]);
      high = Math.max(high, cube.to[0]);
    }
    if (Number.isFinite(low)) return [low, high];
    const { min, max } = this.bodyBounds();
    return [min[0], max[0]];
  }

  /** Shared grip used by every handheld template. */
  handle(bottom: number, top: number, width = 1.6): void {
    const half = width / 2;
    this.box(
      "handle_core",
      [-half - 0.2, bottom, -0.9],
      [half + 0.2, top, 0.9],
      0,
    );
    for (let y = bottom + 0.3; y < top - 0.4; y += 1.25) {
      const wrapTop = Math.min(top - 0.2, y + 0.85);
      this.box(
        "leather_wrap",
        [-half, y, -1],
        [half, wrapTop, 1],
        Math.round(y) % 3 === 0 ? 7 : 5,
      );
    }
    this.box("pommel", [-1.4, bottom - 0.7, -1.2], [1.4, bottom + 0.5, 1.2], 0);
    this.box(
      "pommel_inlay",
      [-0.8, bottom - 0.45, 1.2],
      [0.8, bottom + 0.3, 1.5],
      6,
    );
  }

  private resolveMaterial(material: number): number {
    if (this.settings.style !== "minimal") return material;
    return MINIMAL_MATERIAL_ALIASES[material] ?? material;
  }

  private uvFor(material: number): UVRect {
    const sampled = this.regions?.[material];
    if (sampled) return sampled;
    const u = (material % ATLAS_COLUMNS) * TILE_WIDTH;
    const v = Math.floor(material / ATLAS_COLUMNS) * TILE_HEIGHT;
    const row = this.cubes.length % 3;
    return [u + 2, v + 2 + row * 9, u + 14, v + 10 + row * 9];
  }
}

export type ShapeBuilder = (builder: GeometryBuilder) => void;
