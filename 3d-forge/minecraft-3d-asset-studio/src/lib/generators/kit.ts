import {
  AnimationType,
  DIRECTIONS,
  ElementFaces,
  FloatingItemType,
  MagicCircleStyle,
  ModelCategory,
  ModelData,
  ModelElement,
  ModelGroup,
  ModelTheme,
  ParticleType,
  TextureResolution,
  Vector3,
} from "@/types/model";
import { PALETTES } from "@/lib/generators/textureBaker";

/** Shared construction kit used by every procedural template, decoration and part. */
export type Region = "blade" | "guard" | "gem" | "rune";

export function regionFaces(region: Region, res: TextureResolution): ElementFaces {
  const half = res / 2;
  const u = region === "guard" || region === "rune" ? half : 0;
  const v = region === "gem" || region === "rune" ? half : 0;
  return DIRECTIONS.reduce<ElementFaces>((faces, direction) => {
    faces[direction] = { uv: [u, v, u + half, v + half] };
    return faces;
  }, {});
}

export interface PartOptions {
  region: Region;
  color: string;
  rotation?: Vector3;
  origin?: Vector3;
  emissive?: boolean;
  opacity?: number;
  inflate?: number;
  group: string;
  resolution: TextureResolution;
  generated?: boolean;
}

export function part(id: string, name: string, center: Vector3, size: Vector3, options: PartOptions): ModelElement {
  return {
    id,
    name,
    group: options.group,
    from: [center[0] - size[0] / 2, center[1] - size[1] / 2, center[2] - size[2] / 2],
    to: [center[0] + size[0] / 2, center[1] + size[1] / 2, center[2] + size[2] / 2],
    origin: options.origin ?? [...center],
    rotation: options.rotation ?? [0, 0, 0],
    faces: regionFaces(options.region, options.resolution),
    color: options.color,
    emissive: options.emissive ?? false,
    opacity: options.opacity,
    inflate: options.inflate ?? 0,
    visible: true,
    generated: options.generated ?? false,
  };
}

export type PartExtra = Partial<Omit<PartOptions, "region" | "color" | "group" | "resolution">>;
export type PartMaker = (id: string, name: string, center: Vector3, size: Vector3, region: Region, color: string, group: string, extra?: PartExtra) => ModelElement;

/** Compact positional factory: P(id, name, center, size, region, color, group, extra). */
export function maker(res: TextureResolution, generated = false): PartMaker {
  return (id, name, center, size, region, color, group, extra = {}) =>
    part(id, name, center, size, { region, color, group, resolution: res, generated, ...extra });
}

export const deg = (radians: number) => (radians * 180) / Math.PI;

/** Rotation that tilts a vertical part's top outward from the Y axis at the given ring angle. */
export function outward(angle: number, tilt: number): Vector3 {
  return [Math.sin(angle) * tilt, 0, -Math.cos(angle) * tilt];
}

/** Euler XYZ rotation that points a part's +Y axis along an arbitrary direction. */
export function alignTo(direction: Vector3): Vector3 {
  const length = Math.hypot(direction[0], direction[1], direction[2]) || 1;
  const dx = direction[0] / length;
  const dy = direction[1] / length;
  const dz = direction[2] / length;
  return [deg(Math.atan2(dz, dy)), 0, deg(-Math.asin(Math.max(-1, Math.min(1, dx))))];
}

export function gear(prefix: string, name: string, center: Vector3, radius: number, thickness: number, color: string, res: TextureResolution, group: string, teeth = 8, generated = false): ModelElement[] {
  const parts: ModelElement[] = [
    part(`${prefix}_hub`, `${name} Hub`, center, [radius * 0.9, thickness, radius * 0.9], { region: "guard", color, group, resolution: res, generated }),
  ];
  for (let index = 0; index < teeth; index += 1) {
    const angle = (index / teeth) * Math.PI * 2;
    parts.push(
      part(`${prefix}_t${index}`, `${name} Tooth ${index + 1}`, [center[0] + Math.cos(angle) * radius, center[1], center[2]], [radius * 0.42, thickness, radius * 0.28], {
        region: "blade",
        color,
        group,
        rotation: [0, 0, deg(angle)],
        origin: [...center],
        resolution: res,
        generated,
      }),
    );
  }
  return parts;
}

export function chain(prefix: string, name: string, start: Vector3, end: Vector3, count: number, color: string, res: TextureResolution, group: string, generated = false): ModelElement[] {
  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0.5 : index / (count - 1);
    const center: Vector3 = [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t, start[2] + (end[2] - start[2]) * t];
    return part(`${prefix}_${index}`, `${name} Link ${index + 1}`, center, [0.7, 1.1, 0.7], {
      region: "guard",
      color,
      group,
      rotation: [0, index % 2 === 0 ? 0 : 90, 0],
      resolution: res,
      generated,
    });
  });
}

/**
 * Ring of tangent segments. xz = horizontal halo, xy = vertical disk facing +Z, yz = vertical disk facing +X.
 * For xz / xy the segment length is size[0]; for yz it is size[2].
 */
export function ringOf(
  prefix: string,
  name: string,
  center: Vector3,
  radius: number,
  count: number,
  size: Vector3,
  plane: "xz" | "xy" | "yz",
  options: Omit<PartOptions, "rotation" | "origin">,
  phase = 0,
  sizeAt?: (index: number) => Vector3,
): ModelElement[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = phase + (index / count) * Math.PI * 2;
    const c = Math.cos(angle) * radius;
    const s = Math.sin(angle) * radius;
    let position: Vector3;
    let rotation: Vector3;
    if (plane === "xz") {
      position = [center[0] + c, center[1], center[2] + s];
      rotation = [0, -deg(angle) + 90, 0];
    } else if (plane === "xy") {
      position = [center[0] + c, center[1] + s, center[2]];
      rotation = [0, 0, deg(angle) - 90];
    } else {
      position = [center[0], center[1] + s, center[2] + c];
      rotation = [-deg(angle) - 90, 0, 0];
    }
    return part(`${prefix}_${index}`, `${name} ${index + 1}`, position, sizeAt ? sizeAt(index) : size, { ...options, rotation, origin: position });
  });
}

export function group(id: string, name: string, childrenIds: string[]): ModelGroup {
  return { id, name, pivot: [0, 0, 0], rotation: [0, 0, 0], childrenIds };
}

/** Builds outliner groups automatically from each element's `group` field. */
export function groupsFrom(elements: ModelElement[]): ModelGroup[] {
  const buckets = new Map<string, string[]>();
  elements.forEach((element) => {
    const key = element.group ?? "root";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(element.id);
  });
  return Array.from(buckets.entries()).map(([id, childrenIds]) =>
    group(id, id.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()), childrenIds),
  );
}

export interface AssemblyOverrides extends Partial<Pick<ModelData, "floatingItems" | "magicCircle" | "particles" | "animations">> {
  particleType?: ParticleType;
  circleStyle?: MagicCircleStyle;
  loop?: AnimationType;
  resolution?: TextureResolution;
}

export function assembly(
  name: string,
  description: string,
  category: ModelCategory,
  theme: ModelTheme,
  elements: ModelElement[],
  groups: ModelGroup[],
  overrides: AssemblyOverrides = {},
): ModelData {
  const palette = PALETTES[theme];
  const res = overrides.resolution ?? 32;
  return {
    name,
    description,
    category,
    theme,
    textureWidth: res,
    textureHeight: res,
    elements,
    groups,
    floatingItems: overrides.floatingItems ?? { enabled: true, count: 3, type: "crystal", orbitRadius: 7, orbitSpeed: 1.1, heightOffset: 2, bobbingAmplitude: 1.2, color: palette.glow },
    magicCircle: overrides.magicCircle ?? { enabled: true, radius: 9, rotationSpeed: 0.9, yOffset: 2.5, tiltAngle: 90, style: overrides.circleStyle ?? "runic_ring", color: palette.glow, emissiveIntensity: 1.8 },
    particles: overrides.particles ?? { enabled: true, type: overrides.particleType ?? "sparkle", density: 45, speed: 1, spread: 4, color: palette.glow, secondaryColor: palette.accent },
    animations: overrides.animations ?? {
      activeAnimation: overrides.loop ?? "idle_float",
      speed: 1,
      amplitude: 1,
      enableHover: true,
      enableOrbitals: true,
      enablePulse: true,
      enableFlicker: true,
    },
    palette,
  };
}

export interface FxPreset {
  particle?: ParticleType;
  circle?: MagicCircleStyle;
  loop?: AnimationType;
  circleY?: number;
  circleTilt?: number;
  circleRadius?: number;
  circleSpeed?: number;
  layers?: number;
  glyphs?: boolean;
  circleEnabled?: boolean;
  floatType?: FloatingItemType;
  floatCount?: number;
  floatY?: number;
  floatRadius?: number;
  floatEnabled?: boolean;
  color?: string;
  secondary?: string;
  density?: number;
  spread?: number;
}

/** One-call template finisher: auto groups + effect preset. Category is assigned by the catalog. */
export function forge(name: string, description: string, theme: ModelTheme, res: TextureResolution, elements: ModelElement[], preset: FxPreset = {}): ModelData {
  const palette = PALETTES[theme];
  const color = preset.color ?? palette.glow;
  return assembly(name, description, "custom", theme, elements, groupsFrom(elements), {
    resolution: res,
    loop: preset.loop,
    floatingItems: {
      enabled: preset.floatEnabled ?? true,
      count: preset.floatCount ?? 3,
      type: preset.floatType ?? "crystal",
      orbitRadius: preset.floatRadius ?? 7,
      orbitSpeed: 1.2,
      heightOffset: preset.floatY ?? 4,
      bobbingAmplitude: 1.2,
      color,
    },
    magicCircle: {
      enabled: preset.circleEnabled ?? true,
      radius: preset.circleRadius ?? 9,
      rotationSpeed: preset.circleSpeed ?? 1,
      yOffset: preset.circleY ?? 3,
      tiltAngle: preset.circleTilt ?? 90,
      style: preset.circle ?? "runic_ring",
      color,
      emissiveIntensity: 2,
      layers: preset.layers ?? 1,
      glyphRing: preset.glyphs ?? false,
    },
    particles: {
      enabled: true,
      type: preset.particle ?? "sparkle",
      density: preset.density ?? 50,
      speed: 1,
      spread: preset.spread ?? 4,
      color,
      secondaryColor: preset.secondary ?? palette.accent,
    },
  });
}
