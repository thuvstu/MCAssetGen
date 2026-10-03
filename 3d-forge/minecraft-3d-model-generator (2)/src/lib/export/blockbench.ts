import { randomUUID } from "node:crypto";
import { ACTIONS, actionPivotY, isActiveAction } from "../animation/actions";
import { FLOATING_LENGTH, floatingFrames } from "../animation/floating";
import {
  RIG_IDS,
  type GeneratedModel,
  type ModelCube,
  type Vec3,
} from "../model-types";
import {
  DISPLAY_TRANSFORMS,
  FACE_DIRECTIONS,
  MODEL_CENTER_OFFSET,
} from "./display";

type Channel = "position" | "rotation" | "scale";
interface OutlinerGroup {
  name: string;
  uuid: string;
  origin: number[];
  rotation: number[];
  export: boolean;
  isOpen: boolean;
  children: (string | OutlinerGroup)[];
}
function element(c: ModelCube) {
  return {
    name: c.label ?? c.name,
    type: "cube",
    uuid: randomUUID() as string,
    from: c.from.map((n) => n + 8),
    to: c.to.map((n) => n + 8),
    origin: [8, 8, 8],
    rotation: [0, 0, 0],
    color: c.material,
    box_uv: false,
    rescale: false,
    autouv: 0,
    export: !c.hidden,
    visibility: !c.hidden,
    ...(c.emissive ? { render_mode: "emissive" } : {}),
    faces: Object.fromEntries(
      FACE_DIRECTIONS.map((f) => [f, { uv: c.uv, texture: 0 }]),
    ),
  };
}
/** Pre-invert legacy 4.10 values to compensate Blockbench's 5.x compatibility conversion. */
function key(channel: Channel, time: number, v: Vec3) {
  return {
    channel,
    time,
    data_points: [
      {
        x: channel === "scale" ? v[0] : -v[0],
        y: channel === "rotation" ? -v[1] : v[1],
        z: v[2],
      },
    ],
    interpolation: "linear",
  };
}
function centre(cubes: ModelCube[]): number[] {
  const visible = cubes.filter((c) => !c.hidden),
    reference = visible.length ? visible : cubes;
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (const c of reference)
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], c.from[a]);
      max[a] = Math.max(max[a], c.to[a]);
    }
  return min.map((n, a) => (n + max[a]) / 2 + 8);
}
function group(name: string, origin: number[]): OutlinerGroup {
  return {
    name,
    uuid: randomUUID(),
    origin,
    rotation: [0, 0, 0],
    export: true,
    isOpen: true,
    children: [],
  };
}
function clip(
  name: string,
  length: number,
  animators: Record<string, unknown>,
) {
  return {
    uuid: randomUUID(),
    name,
    loop: "loop",
    length,
    override: false,
    snapping: 20,
    selected: false,
    blend_weight: "1",
    anim_time_update: "",
    start_delay: "",
    loop_delay: "",
    animators,
  };
}
export function toBlockbench(model: GeneratedModel) {
  const { settings } = model,
    root = group(settings.name, [8, 8 + actionPivotY(settings.height), 8]);
  const groups = new Map<string, OutlinerGroup>();
  const grouped = new Map<string, ModelCube[]>();
  for (const c of model.cubes) {
    const name = c.layer === "floater" ? "floaters" : c.rig;
    if (name) grouped.set(name, [...(grouped.get(name) ?? []), c]);
  }
  for (const [name, cubes] of grouped) {
    const g = group(name, centre(cubes));
    groups.set(name, g);
    root.children.push(g);
  }
  const elements = model.cubes.map((c) => {
    const e = element(c),
      name = c.layer === "floater" ? "floaters" : c.rig;
    (name ? groups.get(name)! : root).children.push(e.uuid);
    return e;
  });
  const animations: unknown[] = [];
  const floats = groups.get("floaters");
  if (floats && settings.animation !== "none") {
    const style = settings.animation;
    const channel: Channel =
      style === "pulse"
        ? "scale"
        : style === "spin" || style === "sway"
          ? "rotation"
          : "position";
    const frames = floatingFrames(style).map((f) =>
      key(
        channel,
        f.time,
        channel === "scale"
          ? f.scale
          : channel === "rotation"
            ? f.rotation
            : f.position,
      ),
    );
    animations.push(
      clip(`floaters_${style}`, FLOATING_LENGTH, {
        [floats.uuid]: { name: "floaters", type: "bone", keyframes: frames },
      }),
    );
  }
  if (isActiveAction(settings.action)) {
    const action = ACTIONS[settings.action],
      keys = (frames: typeof action.keyframes) =>
        frames.flatMap((f) => [
          key("rotation", f.time, f.rotation),
          key("position", f.time, f.position),
          key("scale", f.time, f.scale),
        ]);
    const animators: Record<string, unknown> = {
      [root.uuid]: {
        name: root.name,
        type: "bone",
        keyframes: keys(action.keyframes),
      },
    };
    for (const rig of RIG_IDS) {
      const g = groups.get(rig),
        frames = action.rigs?.[rig];
      if (g && frames)
        animators[g.uuid] = {
          name: rig,
          type: "bone",
          keyframes: keys(frames),
        };
    }
    animations.push(
      clip(`action_${settings.action}`, action.length, animators),
    );
  }
  return {
    meta: {
      format_version: "4.10",
      model_format: animations.length ? "free" : "java_block",
      box_uv: false,
    },
    name: settings.name,
    model_identifier: `voxelforge_${settings.kind}`,
    credit: "Created with VoxelForge Studio",
    resolution: { width: model.texture.width, height: model.texture.height },
    elements,
    outliner: [root],
    textures: [
      {
        uuid: randomUUID(),
        id: "0",
        name: model.texture.name,
        width: model.texture.width,
        height: model.texture.height,
        uv_width: model.texture.width,
        uv_height: model.texture.height,
        source: model.texture.source,
        mode: "bitmap",
        internal: true,
        saved: false,
        visible: true,
        render_mode: "default",
        render_sides: "auto",
      },
    ],
    display: DISPLAY_TRANSFORMS,
    animations,
  };
}
