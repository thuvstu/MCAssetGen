import { ACTION_DEFINITIONS, ACTION_LIST, ActionKeyframe, IDLE_EXPORT_KEYFRAMES } from "./asset-actions";
import { DIRECTIONS, ModelData, Vector3 } from "./asset-types";

interface BlockbenchFace {
  uv: [number, number, number, number];
  texture: number;
  rotation: number;
}

interface BlockbenchElement {
  name: string;
  box_uv: false;
  rescale: false;
  locked: false;
  render_order: "default";
  allow_mirror_modeling: true;
  from: Vector3;
  to: Vector3;
  origin: Vector3;
  rotation: Vector3;
  color: number;
  uuid: string;
  type: "cube";
  faces: Partial<Record<(typeof DIRECTIONS)[number], BlockbenchFace>>;
  inflate: number;
  visibility: boolean;
}

interface BlockbenchGroup {
  name: string;
  origin: Vector3;
  rotation: Vector3;
  color: number;
  uuid: string;
  export: true;
  isOpen: true;
  locked: false;
  visibility: true;
  autouv: number;
  children: string[];
}

function generateUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = (Math.random() * 16) | 0;
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function toBlockbenchPosition(vector: Vector3): Vector3 {
  return [vector[0] + 8, vector[1] + 8, vector[2] + 8];
}

export function exportToBlockbench(model: ModelData, textureDataUrl: string): string {
  const textureUuid = generateUuid();
  const elementUuidById = new Map<string, string>();

  const elements: BlockbenchElement[] = model.elements.map((element) => {
    const uuid = generateUuid();
    elementUuidById.set(element.id, uuid);

    const faces = DIRECTIONS.reduce<BlockbenchElement["faces"]>((result, direction) => {
      const face = element.faces[direction];
      if (face) {
        result[direction] = {
          uv: [...face.uv],
          texture: 0,
          rotation: face.rotation ?? 0,
        };
      }
      return result;
    }, {});

    return {
      name: element.name,
      box_uv: false,
      rescale: false,
      locked: false,
      render_order: "default",
      allow_mirror_modeling: true,
      from: toBlockbenchPosition(element.from),
      to: toBlockbenchPosition(element.to),
      origin: toBlockbenchPosition(element.origin),
      rotation: [...element.rotation],
      color: 0,
      uuid,
      type: "cube",
      faces,
      inflate: element.inflate ?? 0,
      visibility: element.visible !== false,
    };
  });

  const outlinerGroups: BlockbenchGroup[] = model.groups.map((group) => ({
    name: group.name,
    origin: toBlockbenchPosition(group.pivot),
    rotation: [...group.rotation],
    color: 0,
    uuid: generateUuid(),
    export: true,
    isOpen: true,
    locked: false,
    visibility: true,
    autouv: 0,
    children: group.childrenIds
      .map((elementId) => elementUuidById.get(elementId))
      .filter((uuid): uuid is string => Boolean(uuid)),
  }));

  const parentedElementIds = new Set(model.groups.flatMap((group) => group.childrenIds));
  const rootElementUuids = model.elements
    .filter((element) => !parentedElementIds.has(element.id))
    .map((element) => elementUuidById.get(element.id))
    .filter((uuid): uuid is string => Boolean(uuid));

  // A single animatable root bone wraps every group so all actions move the whole weapon.
  const rootUuid = generateUuid();
  const rootGroup = {
    name: "root",
    origin: [8, 8, 8] as Vector3,
    rotation: [0, 0, 0] as Vector3,
    color: 0,
    uuid: rootUuid,
    export: true,
    isOpen: true,
    locked: false,
    visibility: true,
    autouv: 0,
    children: [...outlinerGroups, ...rootElementUuids],
  };

  const toKeyframes = (keyframes: ActionKeyframe[]) =>
    keyframes.flatMap((frame) => [
      { channel: "position", data_points: [{ x: `${frame.position[0]}`, y: `${frame.position[1]}`, z: `${frame.position[2]}` }], uuid: generateUuid(), time: frame.time, color: -1, interpolation: "linear" },
      { channel: "rotation", data_points: [{ x: `${frame.rotation[0]}`, y: `${frame.rotation[1]}`, z: `${frame.rotation[2]}` }], uuid: generateUuid(), time: frame.time, color: -1, interpolation: "linear" },
      { channel: "scale", data_points: [{ x: `${frame.scale}`, y: `${frame.scale}`, z: `${frame.scale}` }], uuid: generateUuid(), time: frame.time, color: -1, interpolation: "linear" },
    ]);

  const buildAnimation = (name: string, length: number, loop: "loop" | "once", keyframes: ActionKeyframe[]) => ({
    uuid: generateUuid(),
    name,
    loop,
    override: false,
    length,
    snapping: 24,
    selected: false,
    anim_time_update: "",
    blend_weight: "",
    start_delay: "",
    loop_delay: "",
    animators: { [rootUuid]: { name: "root", type: "bone", keyframes: toKeyframes(keyframes) } },
  });

  const animations = [
    buildAnimation("idle_float", 2, "loop", IDLE_EXPORT_KEYFRAMES),
    ...ACTION_LIST.map((action) => buildAnimation(action.id, action.duration, "once", action.keyframes)),
  ];

  // Group-by-group transformation morph: every bone scales in with a staggered offset.
  const scaleKey = (time: number, value: number) => ({
    channel: "scale",
    data_points: [{ x: `${value}`, y: `${value}`, z: `${value}` }],
    uuid: generateUuid(),
    time,
    color: -1,
    interpolation: "linear",
  });
  const morphAnimators: { [x: string]: { name: string; type: string; keyframes: ReturnType<typeof toKeyframes> } } = {
    [rootUuid]: { name: "root", type: "bone", keyframes: toKeyframes(ACTION_DEFINITIONS.transform.keyframes) },
  };
  outlinerGroups.forEach((group, index) => {
    const start = Math.min(0.8, index * 0.06 + 0.05);
    morphAnimators[group.uuid] = {
      name: group.name,
      type: "bone",
      keyframes: [scaleKey(start, 0.001), scaleKey(start + 0.35, 1)],
    };
  });
  animations.push({
    uuid: generateUuid(),
    name: "transform_morph",
    loop: "once",
    override: false,
    length: 1.2,
    snapping: 24,
    selected: false,
    anim_time_update: "",
    blend_weight: "",
    start_delay: "",
    loop_delay: "",
    animators: morphAnimators,
  });

  const project = {
    meta: {
      format_version: "4.10",
      creation_time: Math.floor(Date.now() / 1000),
      model_format: "free",
      box_uv: false,
    },
    name: model.name,
    model_identifier: model.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, ""),
    resolution: { width: model.textureWidth, height: model.textureHeight },
    elements,
    outliner: [rootGroup],
    textures: [{
      name: "texture",
      folder: "item",
      namespace: "",
      id: "0",
      particle: true,
      render_mode: "default",
      source: textureDataUrl,
      uuid: textureUuid,
    }],
    animations,
  };

  return JSON.stringify(project, null, 2);
}
