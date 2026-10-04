import type { GeneratedModel, UVRect } from "../model-types";
import {
  DISPLAY_TRANSFORMS,
  FACE_DIRECTIONS,
  MODEL_CENTER_OFFSET,
} from "./display";

/** Java item models always address a 16x16 UV space. */
const JAVA_UV_SPACE = 16;

export const DEFAULT_TEXTURE_ID = "voxelforge:item/model";

/** Builds the vanilla `assets/.../models/item/<name>.json` payload. */
export function toMinecraft(
  model: GeneratedModel,
  textureId = DEFAULT_TEXTURE_ID,
) {
  const { width, height } = model.texture;
  const normalizeUV = (uv: UVRect) =>
    uv.map(
      (value, index) =>
        +((value * JAVA_UV_SPACE) / (index % 2 === 0 ? width : height)).toFixed(
          6,
        ),
    );

  return {
    credit: "Created with VoxelForge",
    texture_size: [width, height],
    textures: { "0": textureId, particle: textureId },
    elements: model.cubes
      .filter((cube) => !cube.hidden)
      .map((cube) => ({
        from: cube.from.map(
          (value) => +(value + MODEL_CENTER_OFFSET).toFixed(4),
        ),
        to: cube.to.map((value) => +(value + MODEL_CENTER_OFFSET).toFixed(4)),
        faces: Object.fromEntries(
          FACE_DIRECTIONS.map((face) => [
            face,
            { uv: normalizeUV(cube.uv), texture: "#0" },
          ]),
        ),
      })),
    display: DISPLAY_TRANSFORMS,
  };
}
