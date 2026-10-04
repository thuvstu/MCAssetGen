import type { Atlas, Generated, Params } from "./forge-index";
import { CLIPS, clipAnims, evaluate, rootIdle, sampleCount } from "./forge-index";
import type { AnimSpec, Box, ClipMap, FaceKey } from "./forge-types2";
import { slug, uuid } from "./forge-util";

const FACES: FaceKey[] = ["north", "east", "south", "west", "up", "down"];
const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** ルートのクリップ一式（待機＝自転/上下動、他＝動作） */
export const rootClipMap = (p: Params, gen: Generated): ClipMap => ({ idle: rootIdle(p.anim), ...gen.rootClips });

export const clipLength = (id: string, p: Params) => (id === "idle" ? p.anim.loop : CLIPS.find((c) => c.id === id)!.length);

/* ───────── Minecraft Java ブロック/アイテムモデル ───────── */
export function javaModel(p: Params, gen: Generated, atlas: Atlas) {
  const k = 16 / atlas.size;
  const name = slug(p.name);
  const elements = gen.boxes.map((b) => {
    const cell = atlas.cellOf.get(b.id);
    const faces: Record<string, { uv: number[]; texture: string }> = {};
    FACES.forEach((f) => {
      const r = cell?.faces[f] ?? [0, 0, 1, 1];
      faces[f] = { uv: r.map((v) => r3(v * k)), texture: "#0" };
    });
    const el: Record<string, unknown> = { name: b.name, from: b.from.map(r3), to: b.to.map(r3), faces };
    if (b.rot) el.rotation = { angle: b.rot.angle, axis: b.rot.axis, origin: b.rot.origin.map(r3) };
    return el;
  });
  return {
    credit: `UV ATLAS FORGE — ${p.name} / ${p.kind} / 段階${p.tier}${p.overdrive ? "・極" : ""} / seed ${p.seed}`,
    texture_size: [atlas.size, atlas.size],
    textures: { 0: `item/${name}`, particle: `item/${name}` },
    elements,
    groups: [
      { name: "body", origin: [8, 8, 8], color: 0, children: gen.boxes.filter((b) => b.group === "body").map((b) => b.id) },
      ...gen.groups
        .filter((g) => g.id !== "body")
        .map((g, i) => ({
          name: g.name,
          origin: g.origin.map(r3),
          color: (i % 7) + 1,
          children: gen.boxes.filter((b) => b.group === g.id).map((b) => b.id),
        })),
    ],
    display: {
      thirdperson_righthand: { rotation: [0, 0, 0], translation: [0, 3, 1], scale: [0.55, 0.55, 0.55] },
      thirdperson_lefthand: { rotation: [0, 0, 0], translation: [0, 3, 1], scale: [0.55, 0.55, 0.55] },
      firstperson_righthand: { rotation: [0, -90, 25], translation: [1.13, 3.2, 1.13], scale: [0.68, 0.68, 0.68] },
      firstperson_lefthand: { rotation: [0, 90, -25], translation: [1.13, 3.2, 1.13], scale: [0.68, 0.68, 0.68] },
      gui: { rotation: [30, 225, 0], translation: [0, 0, 0], scale: [0.62, 0.62, 0.62] },
      ground: { rotation: [0, 0, 0], translation: [0, 3, 0], scale: [0.4, 0.4, 0.4] },
      fixed: { rotation: [0, 180, 0], translation: [0, 0, 0], scale: [0.8, 0.8, 0.8] },
      head: { rotation: [0, 180, 0], translation: [0, 13, 7], scale: [1, 1, 1] },
    },
  };
}

/* ───────── Blockbench ネイティブ (.bbmodel) ───────── */
function keyframes(anims: AnimSpec[], length: number, loop: boolean, seedStr: string) {
  const N = sampleCount(anims, loop);
  const hasRot = anims.some((a) => ["spin", "sway", "swing", "turn"].includes(a.kind));
  const hasPos = anims.some((a) => ["bob", "rise", "thrust", "shift"].includes(a.kind));
  const hasScale = anims.some((a) => ["pulse", "rise", "blink", "burst"].includes(a.kind));
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i <= N; i++) {
    const t01 = i / N;
    const pose = evaluate(anims, t01);
    const time = r3(t01 * length);
    const kf = (channel: string, x: number, y: number, z: number) =>
      out.push({
        channel,
        data_points: [{ x: String(r3(x)), y: String(r3(y)), z: String(r3(z)) }],
        uuid: uuid(seedStr + channel + i),
        time,
        color: -1,
        interpolation: "linear",
      });
    // Blockbench のボーン回転は x,y が反転して適用されるため符号を合わせる
    if (hasRot) kf("rotation", -pose.rot[0], -pose.rot[1], pose.rot[2]);
    if (hasPos) kf("position", -pose.pos[0], pose.pos[1], pose.pos[2]);
    if (hasScale) kf("scale", pose.scale, pose.scale, pose.scale);
  }
  return out;
}

export function bbmodel(p: Params, gen: Generated, atlas: Atlas, pngDataUrl: string) {
  const name = slug(p.name);
  const S = atlas.size;
  const elUuid = new Map<number, string>();
  const elements = gen.boxes.map((b: Box, i) => {
    const id = uuid(`el${b.id}${name}`);
    elUuid.set(b.id, id);
    const cell = atlas.cellOf.get(b.id);
    const faces: Record<string, { uv: number[]; texture: number }> = {};
    FACES.forEach((f) => (faces[f] = { uv: (cell?.faces[f] ?? [0, 0, 1, 1]).slice(), texture: 0 }));
    const center = [(b.from[0] + b.to[0]) / 2, (b.from[1] + b.to[1]) / 2, (b.from[2] + b.to[2]) / 2];
    const rotation = [0, 0, 0];
    if (b.rot) rotation[{ x: 0, y: 1, z: 2 }[b.rot.axis]] = b.rot.angle;
    return {
      name: b.name,
      box_uv: false,
      rescale: false,
      locked: false,
      light_emission: b.mat === "fx" || b.mat === "glow" ? 15 : b.mat === "gem" ? 8 : 0,
      render_order: "default",
      allow_mirror_modeling: true,
      from: b.from,
      to: b.to,
      autouv: 0,
      color: i % 8,
      origin: b.rot ? b.rot.origin : center,
      rotation,
      faces,
      type: "cube",
      uuid: id,
    };
  });

  const groupUuid = new Map<string, string>();
  const base = { color: 0, export: true, mirror_uv: false, isOpen: true, locked: false, visibility: true, autouv: 0, rotation: [0, 0, 0] };
  const children = gen.groups.map((g, gi) => {
    const id = uuid(`grp${g.id}${name}`);
    groupUuid.set(g.id, id);
    return {
      ...base,
      name: g.id === "body" ? "body" : `${g.name}_${gi}`,
      origin: g.origin,
      color: gi % 8,
      uuid: id,
      isOpen: g.id === "body",
      children: gen.boxes.filter((b) => b.group === g.id).map((b) => elUuid.get(b.id)!),
    };
  });
  const rootId = uuid(`root${name}`);
  const outliner = [{ ...base, name: "root", origin: [8, 0, 8], uuid: rootId, children }];

  const rootClips = rootClipMap(p, gen);
  const animations = CLIPS.map((clip) => {
    const length = clipLength(clip.id, p);
    const animators: Record<string, unknown> = {};
    const ra = clipAnims(rootClips, clip.id);
    if (ra.length) animators[rootId] = { name: "root", type: "bone", keyframes: keyframes(ra, length, clip.loop, `root${clip.id}`) };
    gen.groups.forEach((g, gi) => {
      const specs = clipAnims(g.clips, clip.id);
      if (!specs.length) return;
      animators[groupUuid.get(g.id)!] = {
        name: children[gi].name,
        type: "bone",
        keyframes: keyframes(specs, length, clip.loop, g.id + clip.id),
      };
    });
    if (!Object.keys(animators).length) return null;
    return {
      uuid: uuid(`anim${clip.id}${name}`),
      name: `animation.${name}.${clip.id}`,
      loop: clip.loop ? "loop" : "once",
      override: false,
      length,
      snapping: 24,
      selected: clip.id === "idle",
      anim_time_update: "",
      blend_weight: "",
      start_delay: "",
      loop_delay: "",
      animators,
    };
  }).filter(Boolean);

  return {
    meta: { format_version: "4.10", model_format: "free", box_uv: false },
    name,
    model_identifier: name,
    visible_box: [1, 1, 0],
    variable_placeholders: "",
    variable_placeholder_buttons: [],
    timeline_setups: [],
    unhandled_root_fields: {},
    resolution: { width: S, height: S },
    elements,
    outliner,
    textures: [
      {
        path: "",
        name: `${name}_atlas.png`,
        folder: "",
        namespace: "",
        id: "0",
        width: S,
        height: S,
        uv_width: S,
        uv_height: S,
        particle: false,
        layers_enabled: false,
        sync_to_project: "",
        render_mode: "default",
        render_sides: "auto",
        frame_time: 1,
        frame_order_type: "loop",
        frame_order: "",
        frame_interpolate: false,
        visible: true,
        internal: true,
        saved: false,
        uuid: uuid(`tex${name}`),
        relative_path: "",
        source: pngDataUrl,
      },
    ],
    animations,
  };
}
