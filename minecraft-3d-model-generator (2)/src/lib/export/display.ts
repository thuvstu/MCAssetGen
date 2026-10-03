import { TEMPLATES, type ModelKind } from "../model-types";

export const FACE_DIRECTIONS = [
  "north",
  "east",
  "south",
  "west",
  "up",
  "down",
] as const;

/** Item display transforms shared by the Blockbench project and the Java model. */
export const DISPLAY_TRANSFORMS = {
  thirdperson_righthand: {
    rotation: [0, 90, -35],
    translation: [0, 1, -2],
    scale: [0.65, 0.65, 0.65],
  },
  thirdperson_lefthand: {
    rotation: [0, -90, 35],
    translation: [0, 1, -2],
    scale: [0.65, 0.65, 0.65],
  },
  firstperson_righthand: {
    rotation: [0, -90, 25],
    translation: [1.1, 3.2, 1.1],
    scale: [0.6, 0.6, 0.6],
  },
  firstperson_lefthand: {
    rotation: [0, 90, -25],
    translation: [1.1, 3.2, 1.1],
    scale: [0.6, 0.6, 0.6],
  },
  gui: {
    rotation: [0, 0, -40],
    translation: [0, 0, 0],
    scale: [0.55, 0.55, 0.55],
  },
  ground: {
    rotation: [0, 0, 0],
    translation: [0, 3, 0],
    scale: [0.25, 0.25, 0.25],
  },
  fixed: {
    rotation: [0, 180, 0],
    translation: [0, 0, 0],
    scale: [0.5, 0.5, 0.5],
  },
} as const;

/** Blockbench models are centred on [8,8,8] instead of the origin. */
export const MODEL_CENTER_OFFSET = 8;

/** Vanilla item each template replaces in the generated resource pack. */
export const VANILLA_ITEM_BY_KIND = Object.fromEntries(
  TEMPLATES.map((template) => [template.kind, template.vanillaItem]),
) as Readonly<Record<ModelKind, string>>;
