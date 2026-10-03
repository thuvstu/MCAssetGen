import {
  ANIMATION_TYPES,
  DIRECTIONS,
  FLOATING_ITEM_TYPES,
  FORM_IDS,
  MODEL_ARCHETYPES,
  MAGIC_CIRCLE_STYLES,
  MODEL_CATEGORIES,
  MODEL_THEMES,
  PARTICLE_TYPES,
  TEXTURE_RESOLUTIONS,
  ColorPalette,
  Direction,
  ElementFaces,
  ModelData,
  ModelElement,
  ModelTheme,
  PersistedModelPayload,
  TextureResolution,
  Vector3,
} from "@/types/model";
import { PALETTES } from "@/lib/generators/textureBaker";
import { normalizeDecorations } from "@/lib/decorations/decorations";

export const DEFAULT_TEXTURE_RESOLUTION: TextureResolution = 32;
const MODEL_NAME_LIMIT = 120;
const DESCRIPTION_LIMIT = 800;

export function isOneOf<T extends readonly string[]>(value: unknown, values: T): value is T[number] {
  return typeof value === "string" && values.includes(value as T[number]);
}

export function isTextureResolution(value: unknown): value is TextureResolution {
  return typeof value === "number" && TEXTURE_RESOLUTIONS.includes(value as TextureResolution);
}

export function isModelTheme(value: unknown): value is ModelTheme {
  return isOneOf(value, MODEL_THEMES);
}

export function createId(prefix: string = "cube"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function toFiniteNumber(value: unknown, fallback: number = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function asVector3(value: unknown, fallback: Vector3 = [0, 0, 0]): Vector3 {
  if (!Array.isArray(value) || value.length !== 3) return [...fallback] as Vector3;
  return [toFiniteNumber(value[0], fallback[0]), toFiniteNumber(value[1], fallback[1]), toFiniteNumber(value[2], fallback[2])];
}

export function createUniformFaces(resolution: TextureResolution, regionSize: number = 16): ElementFaces {
  const boundedSize = Math.min(regionSize, resolution);
  const face = { uv: [0, 0, boundedSize, boundedSize] as [number, number, number, number] };

  return DIRECTIONS.reduce<ElementFaces>((faces, direction) => {
    faces[direction] = { ...face, uv: [...face.uv] as [number, number, number, number] };
    return faces;
  }, {});
}

export function createElement(
  index: number,
  resolution: TextureResolution,
  color: string,
): ModelElement {
  return {
    id: createId(),
    name: `Cube ${index + 1}`,
    from: [-1, 0, -1],
    to: [1, 2, 1],
    origin: [0, 1, 0],
    rotation: [0, 0, 0],
    faces: createUniformFaces(resolution),
    color,
    visible: true,
    emissive: false,
  };
}

export function cloneElement(element: ModelElement): ModelElement {
  const offset = 0.5;
  return {
    ...element,
    id: createId(),
    name: `${element.name} (Copy)`,
    from: element.from.map((value) => value + offset) as Vector3,
    to: element.to.map((value) => value + offset) as Vector3,
    origin: element.origin.map((value) => value + offset) as Vector3,
    rotation: [...element.rotation] as Vector3,
    faces: Object.fromEntries(
      Object.entries(element.faces).map(([direction, face]) => [
        direction,
        face ? { ...face, uv: [...face.uv] as [number, number, number, number] } : undefined,
      ]),
    ) as ElementFaces,
  };
}

export function rescaleModelUvs(model: ModelData, nextResolution: TextureResolution): ModelData {
  if (model.textureWidth === nextResolution && model.textureHeight === nextResolution) return model;

  const xScale = nextResolution / model.textureWidth;
  const yScale = nextResolution / model.textureHeight;
  const elements = model.elements.map((element) => ({
    ...element,
    faces: Object.fromEntries(
      Object.entries(element.faces).map(([direction, face]) => [
        direction,
        face
          ? {
              ...face,
              uv: [
                clamp(Math.round(face.uv[0] * xScale), 0, nextResolution),
                clamp(Math.round(face.uv[1] * yScale), 0, nextResolution),
                clamp(Math.round(face.uv[2] * xScale), 0, nextResolution),
                clamp(Math.round(face.uv[3] * yScale), 0, nextResolution),
              ] as [number, number, number, number],
            }
          : undefined,
      ]),
    ) as ElementFaces,
  }));

  return {
    ...model,
    textureWidth: nextResolution,
    textureHeight: nextResolution,
    elements,
  };
}

export function getPalette(theme: unknown): ColorPalette {
  const safeTheme = isModelTheme(theme) ? theme : "fantasy";
  return PALETTES[safeTheme];
}

export function normalizeModelData(value: unknown): ModelData | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<ModelData>;
  const theme = isModelTheme(source.theme) ? source.theme : "fantasy";
  const palette = source.palette && typeof source.palette === "object" ? source.palette : getPalette(theme);
  const resolution = isTextureResolution(source.textureWidth)
    ? source.textureWidth
    : isTextureResolution(source.textureHeight)
      ? source.textureHeight
      : DEFAULT_TEXTURE_RESOLUTION;

  if (typeof source.name !== "string" || !Array.isArray(source.elements)) return null;

  const elements = source.elements
    .filter((element): element is ModelElement => Boolean(element && typeof element === "object"))
    .map((element, index) => ({
      id: typeof element.id === "string" && element.id ? element.id : createId("element"),
      name: typeof element.name === "string" && element.name ? element.name.slice(0, MODEL_NAME_LIMIT) : `Cube ${index + 1}`,
      group: typeof element.group === "string" ? element.group : undefined,
      from: asVector3(element.from, [-1, 0, -1]),
      to: asVector3(element.to, [1, 2, 1]),
      origin: asVector3(element.origin, [0, 1, 0]),
      rotation: asVector3(element.rotation),
      faces: normalizeFaces(element.faces, resolution),
      color: isHexColor(element.color) ? element.color : getPalette(theme).primary,
      inflate: clamp(toFiniteNumber(element.inflate), -0.5, 2),
      visible: element.visible !== false,
      emissive: Boolean(element.emissive),
      opacity: element.opacity === undefined ? undefined : clamp(toFiniteNumber(element.opacity, 1), 0.1, 1),
      generated: Boolean(element.generated),
    }));

  if (elements.length === 0) return null;

  return {
    id: typeof source.id === "string" || typeof source.id === "number" ? source.id : undefined,
    name: source.name.trim().slice(0, MODEL_NAME_LIMIT),
    description: typeof source.description === "string" ? source.description.slice(0, DESCRIPTION_LIMIT) : "",
    category: isOneOf(source.category, MODEL_CATEGORIES) ? source.category : "custom",
    theme,
    textureWidth: resolution,
    textureHeight: resolution,
    elements,
    groups: Array.isArray(source.groups)
      ? source.groups
          .filter((group) => group && typeof group === "object")
          .map((group, index) => {
            const item = group as ModelData["groups"][number];
            return {
              id: typeof item.id === "string" ? item.id : `group_${index + 1}`,
              name: typeof item.name === "string" ? item.name : `Group ${index + 1}`,
              pivot: asVector3(item.pivot),
              rotation: asVector3(item.rotation),
              childrenIds: Array.isArray(item.childrenIds)
                ? item.childrenIds.filter((childId): childId is string => typeof childId === "string")
                : [],
            };
          })
      : [],
    floatingItems: {
      enabled: Boolean(source.floatingItems?.enabled),
      count: clamp(Math.round(toFiniteNumber(source.floatingItems?.count, 3)), 1, 8),
      type: isOneOf(source.floatingItems?.type, FLOATING_ITEM_TYPES) ? source.floatingItems.type : "crystal",
      orbitRadius: clamp(toFiniteNumber(source.floatingItems?.orbitRadius, 7), 3, 20),
      orbitSpeed: clamp(toFiniteNumber(source.floatingItems?.orbitSpeed, 1), 0.2, 3),
      heightOffset: clamp(toFiniteNumber(source.floatingItems?.heightOffset, 0), -10, 25),
      bobbingAmplitude: clamp(toFiniteNumber(source.floatingItems?.bobbingAmplitude, 1), 0, 5),
      color: isHexColor(source.floatingItems?.color) ? source.floatingItems.color : getPalette(theme).glow,
    },
    magicCircle: {
      enabled: Boolean(source.magicCircle?.enabled),
      radius: clamp(toFiniteNumber(source.magicCircle?.radius, 8), 4, 24),
      rotationSpeed: clamp(toFiniteNumber(source.magicCircle?.rotationSpeed, 1), -3, 3),
      yOffset: clamp(toFiniteNumber(source.magicCircle?.yOffset), -10, 30),
      tiltAngle: clamp(toFiniteNumber(source.magicCircle?.tiltAngle, 90), 0, 90),
      style: isOneOf(source.magicCircle?.style, MAGIC_CIRCLE_STYLES) ? source.magicCircle.style : "runic_ring",
      color: isHexColor(source.magicCircle?.color) ? source.magicCircle.color : getPalette(theme).glow,
      emissiveIntensity: clamp(toFiniteNumber(source.magicCircle?.emissiveIntensity, 1.5), 0, 4),
      layers: clamp(Math.round(toFiniteNumber(source.magicCircle?.layers, 1)), 1, 4),
      glyphRing: Boolean(source.magicCircle?.glyphRing),
    },
    particles: {
      enabled: Boolean(source.particles?.enabled),
      type: isOneOf(source.particles?.type, PARTICLE_TYPES) ? source.particles.type : "sparkle",
      density: clamp(Math.round(toFiniteNumber(source.particles?.density, 40)), 10, 200),
      speed: clamp(toFiniteNumber(source.particles?.speed, 1), 0.1, 4),
      spread: clamp(toFiniteNumber(source.particles?.spread, 4), 1, 12),
      color: isHexColor(source.particles?.color) ? source.particles.color : getPalette(theme).glow,
      secondaryColor: isHexColor(source.particles?.secondaryColor) ? source.particles.secondaryColor : getPalette(theme).accent,
    },
    animations: {
      activeAnimation: isOneOf(source.animations?.activeAnimation, ANIMATION_TYPES)
        ? source.animations.activeAnimation
        : "idle_float",
      speed: clamp(toFiniteNumber(source.animations?.speed, 1), 0.2, 3),
      amplitude: clamp(toFiniteNumber(source.animations?.amplitude, 1), 0.2, 2.5),
      enableHover: source.animations?.enableHover !== false,
      enableOrbitals: source.animations?.enableOrbitals !== false,
      enablePulse: source.animations?.enablePulse !== false,
      enableFlicker: source.animations?.enableFlicker !== false,
    },
    palette: normalizePalette(palette, theme),
    archetype: isOneOf(source.archetype, MODEL_ARCHETYPES) ? source.archetype : undefined,
    decorations: normalizeDecorations(source.decorations),
    variant:
      source.variant && typeof source.variant === "object" && isOneOf(source.variant.form, FORM_IDS)
        ? {
            tier: clamp(Math.round(toFiniteNumber(source.variant.tier)), 0, 5),
            limitBreak: clamp(Math.round(toFiniteNumber(source.variant.limitBreak)), 0, 3),
            form: source.variant.form,
            baseName: typeof source.variant.baseName === "string" ? source.variant.baseName.slice(0, MODEL_NAME_LIMIT) : source.name,
          }
        : undefined,
  };
}

function normalizeFaces(value: unknown, resolution: TextureResolution): ElementFaces {
  if (!value || typeof value !== "object") return createUniformFaces(resolution);
  const faces = value as ElementFaces;

  return DIRECTIONS.reduce<ElementFaces>((result, direction) => {
    const face = faces[direction];
    if (!face || !Array.isArray(face.uv) || face.uv.length !== 4) return result;

    const uv = face.uv.map((coordinate) => clamp(toFiniteNumber(coordinate), 0, resolution)) as [
      number,
      number,
      number,
      number,
    ];
    result[direction] = {
      uv,
      texture: typeof face.texture === "string" ? face.texture : undefined,
      rotation: face.rotation === 90 || face.rotation === 180 || face.rotation === 270 ? face.rotation : 0,
    };
    return result;
  }, {});
}

function normalizePalette(value: unknown, fallbackTheme: ModelTheme): ColorPalette {
  const fallback = getPalette(fallbackTheme);
  if (!value || typeof value !== "object") return fallback;
  const palette = value as Partial<ColorPalette>;

  return {
    id: isModelTheme(palette.id) ? palette.id : fallback.id,
    name: typeof palette.name === "string" ? palette.name.slice(0, 80) : fallback.name,
    primary: isHexColor(palette.primary) ? palette.primary : fallback.primary,
    secondary: isHexColor(palette.secondary) ? palette.secondary : fallback.secondary,
    accent: isHexColor(palette.accent) ? palette.accent : fallback.accent,
    dark: isHexColor(palette.dark) ? palette.dark : fallback.dark,
    highlight: isHexColor(palette.highlight) ? palette.highlight : fallback.highlight,
    glow: isHexColor(palette.glow) ? palette.glow : fallback.glow,
  };
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function parsePersistedModelPayload(value: unknown): { data?: PersistedModelPayload; error?: string } {
  if (!value || typeof value !== "object") return { error: "Invalid request body." };
  const payload = value as Partial<PersistedModelPayload>;
  const modelData = normalizeModelData(payload.modelData);

  if (!modelData) return { error: "A valid model with at least one cube is required." };
  if (typeof payload.name !== "string" || !payload.name.trim()) return { error: "Model name is required." };
  if (typeof payload.textureDataUrl !== "string" || !payload.textureDataUrl.startsWith("data:image/")) {
    return { error: "A PNG or image data URL texture is required." };
  }

  const theme = isModelTheme(payload.theme) ? payload.theme : modelData.theme;
  const category = isOneOf(payload.category, MODEL_CATEGORIES) ? payload.category : modelData.category;
  const textureResolution = isTextureResolution(payload.textureResolution)
    ? payload.textureResolution
    : modelData.textureWidth;

  const normalizedModel: ModelData = {
    ...modelData,
    name: payload.name.trim().slice(0, MODEL_NAME_LIMIT),
    description: typeof payload.description === "string" ? payload.description.slice(0, DESCRIPTION_LIMIT) : modelData.description,
    category,
    theme,
    textureWidth: textureResolution,
    textureHeight: textureResolution,
  };

  return {
    data: {
      name: normalizedModel.name,
      description: normalizedModel.description,
      category,
      theme,
      textureResolution,
      modelData: normalizedModel,
      textureDataUrl: payload.textureDataUrl,
      thumbnailDataUrl:
        typeof payload.thumbnailDataUrl === "string" && payload.thumbnailDataUrl.startsWith("data:image/")
          ? payload.thumbnailDataUrl
          : null,
    },
  };
}
