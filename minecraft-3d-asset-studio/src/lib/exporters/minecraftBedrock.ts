import { ACTION_LIST, ActionKeyframe, IDLE_EXPORT_KEYFRAMES } from "@/lib/animation/actions";
import { DIRECTIONS, Direction, ModelData, Vector3 } from "@/types/model";

export function bedrockIdentifier(model: ModelData): string {
  return model.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "") || "custom_model";
}

/** Bedrock resource-pack animation file containing idle + every attack / magic / special action. */
export function exportBedrockAnimations(model: ModelData): string {
  const id = bedrockIdentifier(model);
  const track = (keyframes: ActionKeyframe[], pick: (frame: ActionKeyframe) => Vector3) =>
    Object.fromEntries(keyframes.map((frame) => [frame.time.toFixed(4), pick(frame)]));
  const bone = (keyframes: ActionKeyframe[]) => ({
    root: {
      position: track(keyframes, (frame) => frame.position),
      rotation: track(keyframes, (frame) => frame.rotation),
      scale: track(keyframes, (frame) => [frame.scale, frame.scale, frame.scale]),
    },
  });

  const animations: Record<string, unknown> = {
    [`animation.${id}.idle_float`]: { loop: true, animation_length: 2, bones: bone(IDLE_EXPORT_KEYFRAMES) },
  };
  ACTION_LIST.forEach((action) => {
    animations[`animation.${id}.${action.id}`] = { animation_length: action.duration, bones: bone(action.keyframes) };
  });

  return JSON.stringify({ format_version: "1.8.0", animations }, null, 2);
}

interface BedrockFaceUV {
  uv: [number, number];
  uv_size: [number, number];
}

interface BedrockCube {
  origin: Vector3;
  size: Vector3;
  rotation: Vector3;
  pivot: Vector3;
  uv: Partial<Record<Direction, BedrockFaceUV>>;
  inflate: number;
}

export function exportToMinecraftBedrock(model: ModelData): string {
  const identifier = `geometry.${model.name.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;

  const cubes: BedrockCube[] = model.elements.map((element) => {
    const uv = DIRECTIONS.reduce<BedrockCube["uv"]>((result, direction) => {
      const face = element.faces[direction];
      if (!face) return result;
      result[direction] = {
        uv: [face.uv[0], face.uv[1]],
        uv_size: [face.uv[2] - face.uv[0], face.uv[3] - face.uv[1]],
      };
      return result;
    }, {});

    return {
      origin: [
        Math.min(element.from[0], element.to[0]),
        Math.min(element.from[1], element.to[1]),
        Math.min(element.from[2], element.to[2]),
      ],
      size: [
        Math.abs(element.to[0] - element.from[0]),
        Math.abs(element.to[1] - element.from[1]),
        Math.abs(element.to[2] - element.from[2]),
      ],
      rotation: [...element.rotation],
      pivot: [...element.origin],
      uv,
      inflate: element.inflate ?? 0,
    };
  });

  const document = {
    format_version: "1.12.0",
    "minecraft:geometry": [{
      description: {
        identifier,
        texture_width: model.textureWidth,
        texture_height: model.textureHeight,
        visible_bounds_width: 3,
        visible_bounds_height: 3,
        visible_bounds_offset: [0, 1, 0],
      },
      bones: [{ name: "root", pivot: [0, 0, 0], cubes }],
    }],
  };

  return JSON.stringify(document, null, 2);
}
