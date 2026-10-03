import type { ModelKind, ModelVariant, VoxelCube } from "./model-types";

/**
 * Handheld items are authored upright in a 16-unit model space: handle at the bottom (y ≈ -3),
 * tip at the top (y ≈ 19), centered on x = 8 / z = 8. At export time every element is rotated
 * -45° around the model center, exactly like vanilla flat `item/handheld` sprites, so the
 * vanilla first/third person display transforms line up.
 */
export interface ItemOptions { detailed: boolean; high: boolean; glowing: boolean; seed: number }
export interface BuiltItem { cubes: VoxelCube[]; variants?: ModelVariant[] }

function kit(list: VoxelCube[]) {
  const box = (name: string, x: number, y: number, z: number, w: number, h: number, d: number, color: number, glow = false) =>
    list.push({ name, from: [x, y, z], to: [x + w, y + h, z + d], color, ...(glow ? { glow: true } : {}) });
  /** Box centered on x = cx and z = 8. */
  const bar = (name: string, cx: number, y0: number, y1: number, w: number, t: number, color: number, glow = false) =>
    box(name, cx - w / 2, y0, 8 - t / 2, w, y1 - y0, t, color, glow);
  /** Symmetric pair mirrored around x = 8. */
  const pair = (name: string, x0: number, x1: number, y0: number, y1: number, t: number, color: number, glow = false) => {
    box(`${name}_l`, x0, y0, 8 - t / 2, x1 - x0, y1 - y0, t, color, glow);
    box(`${name}_r`, 16 - x1, y0, 8 - t / 2, x1 - x0, y1 - y0, t, color, glow);
  };
  return { box, bar, pair };
}

function wraps(bar: ReturnType<typeof kit>["bar"], y0: number, y1: number, width = 1.7, a = 6, b = 3) {
  let i = 0;
  for (let y = y0; y < y1 - .3; y += .85, i++) bar("grip_wrap", 8, y, y + .36, width, width, i % 2 ? b : a);
}

function sword(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar, pair } = kit(cubes);
  // Pommel, grip and an upturned crossguard.
  bar("pommel_base", 8, -3.2, -2.2, 2.6, 2.4, 4);
  bar("pommel_gem", 8, -2.95, -1.95, 1.2, 2.8, 0, o.glowing);
  bar("pommel_cap", 8, -2.2, -1.6, 1.8, 1.8, 3);
  bar("grip", 8, -1.6, 2.0, 1.4, 1.4, 5);
  if (o.detailed) wraps(bar, -1.4, 1.8, 1.8);
  bar("guard_core", 8, 2.0, 3.3, 3.2, 2.6, 4);
  pair("guard_arm", 3.0, 6.4, 2.3, 3.3, 2.0, 4);
  pair("guard_tip", 2.2, 3.2, 2.9, 4.5, 1.8, 3);
  pair("guard_shine", 3.4, 6.2, 3.3, 3.6, 1.6, 1);
  bar("guard_gem", 8, 2.25, 3.05, 1.2, 3.0, 1, o.glowing);
  bar("ricasso", 8, 3.3, 4.5, 3.6, 1.8, 4);
  if (!o.detailed) {
    bar("blade", 8, 4.5, 11, 3.0, 1.6, 0); bar("blade_upper", 8, 11, 15.5, 2.6, 1.5, 0);
    bar("blade_tip", 8, 15.5, 18.2, 1.6, 1.3, 1); bar("blade_point", 8, 18.2, 19, .6, 1, 1);
    return { cubes };
  }
  // Blade: half-width tapers from 1.6 to ~0.9; bevelled edges stand proud of a recessed face and fuller groove.
  const halfWidth = (y: number) => y <= 14 ? 1.6 - (y - 4.5) / 9.5 * .35 : 1.25 - (y - 14) / 3 * .35;
  const step = o.high ? .5 : 1;
  for (let y = 4.5; y < 17 - 1e-6; y += step) {
    const y1 = Math.min(y + step, 17), w = Math.round(halfWidth((y + y1) / 2) * 4) / 4;
    const bevel = Math.min(.5, w * .5), inner = w - bevel, groove = y < 16.2 ? .25 : 0;
    box("blade_bevel_l", 8 - w, y, 8 - .7, bevel, y1 - y, 1.4, 1);
    box("blade_bevel_r", 8 + w - bevel, y, 8 - .7, bevel, y1 - y, 1.4, 2);
    if (groove) {
      box("blade_face_l", 8 - inner, y, 8 - .5, inner - groove, y1 - y, 1.0, 0);
      box("blade_face_r", 8 + groove, y, 8 - .5, inner - groove, y1 - y, 1.0, 0);
      box("blade_fuller", 8 - groove, y, 8 - .35, groove * 2, y1 - y, .7, o.glowing ? 1 : 3, o.glowing);
    } else box("blade_face", 8 - inner, y, 8 - .5, inner * 2, y1 - y, 1.0, 0);
  }
  bar("blade_tip_a", 8, 17, 18.2, 1.4, 1.0, 0);
  bar("blade_tip_b", 8, 18.2, 19, .6, .9, 1);
  if (o.high) for (let y = 6; y < 14; y += 2.4) bar("rune", 8, y, y + .6, .4, 1.15, 7, o.glowing);
  return { cubes };
}

function pickaxe(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { bar, pair } = kit(cubes);
  bar("end_cap", 8, -3.2, -2.4, 1.9, 1.9, 3);
  bar("handle", 8, -2.4, 13.6, 1.4, 1.4, 5);
  if (o.detailed) wraps(bar, -2.2, 1.2);
  bar("binding", 8, 11.4, 12.8, 2.2, 2.2, 4);
  bar("head_core", 8, 12.7, 16.1, 3.2, 2.1, 0);
  pair("head_arm", 3.7, 6.4, 12.9, 15.7, 1.9, 0);
  pair("head_arm_outer", 1.5, 3.7, 12.3, 14.9, 1.7, 0);
  pair("head_tip", 0.3, 1.5, 11.0, 13.5, 1.4, 2);
  bar("head_shine", 8, 15.5, 16.1, 3.2, 2.2, 1);
  pair("head_shine", 3.7, 6.4, 15.0, 15.7, 2.0, 1);
  pair("head_shine_outer", 1.5, 3.7, 14.3, 14.9, 1.8, 1);
  pair("head_shade", 3.7, 6.4, 12.9, 13.4, 2.0, 2);
  pair("head_shade_outer", 1.5, 3.7, 12.3, 12.8, 1.8, 2);
  if (o.detailed) { bar("head_gem", 8, 13.2, 14.6, 1.2, 2.4, 1, o.glowing); pair("head_rivet", 4.6, 5.2, 13.7, 14.3, 2.2, 4); }
  if (o.high) pair("tip_shine", 0.6, 1.2, 12.3, 13.2, 1.5, 7);
  return { cubes };
}

function axe(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar } = kit(cubes);
  bar("end_cap", 8, -3.2, -2.4, 1.9, 1.9, 3);
  bar("handle", 8, -2.4, 14.8, 1.4, 1.4, 5);
  if (o.detailed) wraps(bar, -2.2, 1.6);
  box("head_socket", 5.4, 10.0, 7, 3.7, 4.6, 2, 3);
  box("head_body", 3.6, 9.4, 7.05, 1.9, 5.8, 1.9, 0);
  box("head_bit", 2.4, 8.8, 7.15, 1.3, 7.2, 1.7, 0);
  box("head_edge", 1.4, 8.2, 7.25, 1.1, 8.0, 1.5, 1);
  box("poll", 9.0, 10.6, 7.1, 1.4, 3.1, 1.8, 2);
  box("head_top_shine", 3.6, 14.7, 7.0, 1.9, .5, 2.0, 1);
  box("head_bottom_shade", 3.6, 9.1, 7.0, 1.9, .4, 2.0, 2);
  bar("binding", 8, 8.9, 10.0, 2.2, 2.2, 4);
  if (o.detailed) { box("head_gem", 6.2, 11.4, 6.75, 1.1, 1.8, .4, 1, o.glowing); box("axe_beard", 1.6, 7.3, 7.25, 1.2, 1.0, 1.5, 1); box("head_rivet", 4.3, 13.2, 6.85, .5, .5, .3, 4); }
  if (o.high) { box("bit_notch", 1.4, 10.8, 7.1, .5, .7, 1.8, 6); box("bit_notch", 1.4, 13.0, 7.1, .5, .7, 1.8, 6); }
  return { cubes };
}

function shovel(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar, pair } = kit(cubes);
  bar("grip_bar", 8, -3.1, -1.5, 4.4, 1.7, 5);
  pair("grip_cap", 5.6, 6.3, -3.3, -1.3, 1.9, 6);
  bar("handle", 8, -1.5, 10.6, 1.4, 1.4, 5);
  if (o.detailed) wraps(bar, -1.3, 2.2);
  bar("socket", 8, 9.6, 11.4, 2.3, 2.3, 3);
  bar("blade_neck", 8, 11.4, 12.4, 2.4, 1.6, 0);
  bar("blade_a", 8, 12.4, 14.4, 4, 1.6, 0);
  bar("blade_b", 8, 14.4, 16.6, 4.8, 1.6, 0);
  bar("blade_c", 8, 16.6, 18.2, 4, 1.6, 0);
  bar("blade_tip", 8, 18.2, 19, 2.4, 1.6, 1);
  box("edge_l", 5.6, 13.6, 7.1, .8, 4, 1.8, 1);
  box("edge_r", 9.6, 13.6, 7.1, .8, 4, 1.8, 2);
  bar("blade_ridge", 8, 12.4, 18, .8, 2.0, 1);
  if (o.detailed) { bar("socket_gem", 8, 10, 11, 1, 2.6, 1, o.glowing); bar("blade_rim", 8, 15.6, 16.0, 5.2, 1.9, 3); }
  if (o.high) { bar("blade_rim", 8, 18.2, 19, 1.2, 1.9, 7); box("mud", 6.9, 13.2, 6.95, 1, .8, .2, 5); }
  return { cubes };
}

function staff(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar, pair } = kit(cubes);
  bar("ferrule", 8, -3.2, -2.3, 1.9, 1.9, 4);
  // A gently twisted shaft: each segment is nudged sideways along a sine wave.
  for (let i = 0, y = -2.3; y < 13.3; i++, y += 1.15) bar("shaft", 8 + Math.sin(i * 1.1) * .28, y, Math.min(y + 1.25, 13.4), 1.3, 1.3, 5);
  if (o.detailed) { wraps(bar, 2.4, 6.2, 1.6, 6, 3); bar("ring", 8, 8.6, 9.2, 1.9, 1.9, 4); }
  bar("collar", 8, 13.4, 14.4, 2.7, 2.7, 4);
  // Crescent cradle curling around the orb.
  pair("cradle_base", 6.0, 7.0, 14.4, 15.4, 1.3, 4);
  pair("cradle_mid", 5.4, 6.4, 15.2, 16.9, 1.2, 4);
  pair("cradle_tip", 5.7, 6.6, 16.7, 18.0, 1.1, 4);
  pair("cradle_point", 6.4, 7.2, 17.8, 18.8, 1.0, 1);
  bar("orb_base", 8, 14.4, 15.3, 1.6, 1.6, 2, true);
  bar("orb_mid", 8, 15.3, 17.3, 2.7, 2.7, 0, true);
  bar("orb_top", 8, 17.3, 18.5, 1.6, 1.6, 1, true);
  bar("orb_tip", 8, 18.5, 19.2, .8, .8, 7, true);
  box("orb_shine", 6.9, 15.8, 6.55, .7, 1.4, .15, 7, true);
  if (o.detailed) { box("shard", 4.2, 16.2, 7.5, .8, 1.2, 1, 0, true); box("shard", 11.0, 17.6, 7.5, .7, 1.0, 1, 1, true); }
  if (o.high) { box("shard", 11.8, 14.4, 7.6, .6, .8, .8, 7, true); box("shard", 3.6, 13.4, 7.6, .6, .8, .8, 7, true); }
  return { cubes };
}

function trident(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { bar, pair } = kit(cubes);
  bar("butt", 8, -3.2, -2.3, 1.8, 1.8, 4);
  bar("shaft", 8, -2.3, 12.4, 1.2, 1.2, 2);
  if (o.detailed) wraps(bar, -1.6, 2.4, 1.6, 3, 6);
  bar("collar", 8, 12.4, 13.4, 2.4, 2.1, 4);
  bar("collar_gem", 8, 12.6, 13.2, 1, 2.5, 1, o.glowing);
  bar("crossbar", 8, 13.4, 14.6, 6.8, 1.6, 0);
  bar("prong_center", 8, 14.6, 18.4, 1.3, 1.5, 0);
  bar("prong_center_tip", 8, 18.4, 19.2, .6, 1, 1);
  pair("prong_side", 4.6, 5.8, 13.4, 17.4, 1.4, 0);
  pair("prong_side_tip", 4.9, 5.5, 17.4, 18.3, 1, 1);
  pair("barb_in", 5.8, 6.6, 15.6, 16.4, 1.2, 2);
  pair("prong_hook", 3.9, 4.7, 15.6, 17.0, 1.1, 0);
  pair("prong_hook_tip", 3.6, 4.2, 16.6, 17.6, .9, 1);
  if (o.detailed) pair("barb_out", 3.9, 4.6, 15.0, 16.0, 1.2, 2);
  if (o.high) { bar("prong_shine", 8, 15, 18, .4, 1.7, 7, o.glowing); pair("side_shine", 4.8, 5.1, 14, 17, 1.6, 7); }
  return { cubes };
}

/** Bow limb bulges toward -x; the string runs along +x. stage -1 = idle, 0..2 = drawn. */
function bowStage(o: ItemOptions, stage: number): VoxelCube[] {
  const cubes: VoxelCube[] = []; const { box } = kit(cubes);
  const limbs: [number, number, number, number][] = [[9.7, 12.2, 4.3, 6.0], [12.2, 14.6, 5.2, 6.9], [14.6, 16.9, 6.3, 8.0], [16.9, 18.6, 7.5, 9.1]];
  box("grip", 3.4, 6.3, 7.1, 2.0, 3.4, 1.8, 5);
  box("riser_upper", 3.2, 9.7, 7.0, 2.3, 1.0, 2.0, 4);
  box("riser_lower", 3.2, 5.3, 7.0, 2.3, 1.0, 2.0, 4);
  box("arrow_rest", 5.3, 7.5, 6.6, 1.3, .7, .9, 3);
  if (o.detailed) { box("grip_wrap", 3.3, 6.6, 7.0, 2.2, .4, 2, 3); box("grip_wrap", 3.3, 8.6, 7.0, 2.2, .4, 2, 3); box("grip_gem", 3.0, 7.5, 7.5, .5, 1, 1, 1, o.glowing); }
  limbs.forEach(([y0, y1, x0, x1], i) => {
    box("limb_upper", x0, y0, 7.2, x1 - x0, y1 - y0, 1.6, i % 2 ? 2 : 0);
    box("limb_lower", x0, 16 - y1, 7.2, x1 - x0, y1 - y0, 1.6, i % 2 ? 2 : 0);
    if (o.detailed) { box("limb_inlay", x0 + .5, y0 + .2, 6.95, .35, y1 - y0 - .4, .3, 4); box("limb_inlay", x0 + .5, 16 - y1 + .2, 6.95, .35, y1 - y0 - .4, .3, 4); }
    box("limb_shine", x0, y0, 7.1, .5, y1 - y0, 1.8, 1);
    box("limb_shine", x0, 16 - y1, 7.1, .5, y1 - y0, 1.8, 1);
  });
  box("nock_upper", 8.7, 18.3, 7.3, 1.7, .9, 1.4, 4);
  box("nock_lower", 8.7, -3.2, 7.3, 1.7, .9, 1.4, 4);
  if (o.high) { box("limb_tip_glow", 9.2, 17.6, 7.3, .6, .7, 1.4, 7, o.glowing); box("limb_tip_glow", 9.2, -2.3, 7.3, .6, .7, 1.4, 7, o.glowing); }
  if (stage < 0) { box("string", 10.7, -2.3, 7.86, .3, 20.6, .28, 7); return cubes; }
  const pull = [12.4, 13.6, 14.8][stage];
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps, t1 = (i + 1) / steps;
    const x0 = 10.7 + (pull - 10.7) * t0, x1 = 10.7 + (pull - 10.7) * t1 + .3;
    const yTop0 = 18.3 - 10.3 * t0, yTop1 = 18.3 - 10.3 * t1;
    box("string_upper", x0, yTop1, 7.86, x1 - x0, yTop0 - yTop1, .28, 7);
    box("string_lower", x0, 16 - yTop0, 7.86, x1 - x0, yTop0 - yTop1, .28, 7);
  }
  box("arrow_shaft", 2.7, 7.6, 7.6, pull - 2.7, .8, .8, 5);
  box("arrow_head", 1.3, 7.25, 7.25, 1.5, 1.5, 1.5, 2);
  box("arrow_tip", .4, 7.6, 7.6, .9, .8, .8, 1);
  box("fletch_v", pull - 2.3, 7, 7.85, 1.9, 2, .3, 1);
  box("fletch_h", pull - 2.3, 7.6, 7, 1.9, .8, 2, 2);
  return cubes;
}

function bow(o: ItemOptions): BuiltItem {
  return {
    cubes: bowStage(o, -1),
    variants: [0, 1, 2].map(stage => ({ suffix: `_pulling_${stage}`, cubes: bowStage(o, stage) })),
  };
}

function hammer(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar, pair } = kit(cubes);
  bar("end_cap", 8, -3.2, -2.4, 1.9, 1.9, 3);
  bar("handle", 8, -2.4, 10.2, 1.4, 1.4, 5);
  if (o.detailed) wraps(bar, -2.2, 1.6);
  bar("collar", 8, 9.6, 10.9, 2.3, 2.3, 4);
  bar("head_core", 8, 10.9, 15.2, 4.4, 3.0, 0);
  pair("head_shoulder", 3.4, 5.0, 11.2, 14.9, 2.4, 0);
  pair("head_edge", 1.6, 3.4, 10.9, 15.2, 2.0, 1);
  pair("head_tip", .4, 1.6, 10.2, 14.7, 1.5, 2);
  bar("head_body", 8, 15.2, 16.4, 3.4, 2.6, 0);
  bar("head_gold_band", 8, 13.8, 14.6, 4.6, 3.2, 4);
  if (o.detailed) bar("head_gem", 8, 12.4, 13.6, 1.2, 3.5, 1, o.glowing);
  if (o.high) pair("head_rivet", 2.9, 3.8, 12.8, 13.6, 2.7, 7);
  return { cubes };
}

function scythe(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar, pair } = kit(cubes);
  bar("end_cap", 8, -3.1, -2.3, 1.7, 1.7, 4);
  bar("pole", 8, -2.3, 13.4, 1.3, 1.3, 5);
  if (o.detailed) wraps(bar, -1.9, 2.4);
  bar("collar", 8, 12.7, 14.1, 2.2, 2.2, 4);
  bar("grip_top", 8, 14.1, 15.4, 1.6, 1.6, 3);
  bar("handle_wrap", 8, 15.4, 17.0, 1.2, 1.2, 6);
  bar("blade_frame", 8, 17.0, 18.6, 6.8, 1.7, 0);
  bar("blade_top", 8, 17.2, 18.4, 5.8, 1.25, 1);
  bar("blade_spine", 8, 17.0, 18.6, .9, 1.55, 2);
  bar("blade_runner", 8, 17.1, 18.5, 1.4, 1.5, 3);
  pair("blade_wing", 4.0, 6.4, 17.0, 18.6, 1.5, 0);
  pair("blade_edge", 3.4, 5.2, 17.2, 18.4, 1.35, 1);
  if (o.detailed) bar("blade_gem", 8, 17.6, 18.3, 1.0, 1.4, 1, o.glowing);
  if (o.high) { box("runner_shine", 7.6, 17.4, 7.5, .7, .5, 1, 7); box("tip_shine", 3.6, 17.8, 7.55, .6, .4, .8, 1); }
  return { cubes };
}


/** Shared powered-tool parts: engine block, exhaust, guard plate, fuel tank. */
function engineParts(box: ReturnType<typeof kit>["box"], o: ItemOptions) {
  // Engine block with cooling fins
  box("engine_block", 5.5, 4.2, 6.6, 5.0, 4.5, 2.8, 3);
  for (let i = 0; i < 3; i++) box("engine_fin", 5.2, 4.6 + i * 1.4, 6.4, 5.6, .45, .3, 6);
  box("engine_head", 6.0, 8.7, 6.8, 4.0, 1.3, 2.4, 2);
  // Exhaust pipe
  box("exhaust", 10.4, 5.0, 7.3, 1.4, 3.4, 1.4, 6);
  box("exhaust_tip", 10.5, 8.4, 7.4, 1.2, 1.0, 1.2, 2);
  // Pull starter
  box("starter", 4.2, 5.2, 6.7, 1.3, 2.6, 2.6, 4);
  box("starter_handle", 3.4, 5.9, 7.4, 1.0, 1.2, 1.2, 5);
  if (o.detailed) { box("bolt", 6.0, 9.0, 6.9, .5, .5, .3, 4); box("bolt", 9.5, 9.0, 6.9, .5, .5, .3, 4); box("bolt", 6.0, 4.5, 6.9, .5, .5, .3, 4); box("bolt", 9.5, 4.5, 6.9, .5, .5, .3, 4); }
  if (o.high) { box("spark_plug", 7.3, 8.9, 6.8, .6, .8, .5, 7, o.glowing); box("fuel_cap", 8.6, 8.8, 6.8, .8, .5, .6, 4); }
}

function chainsaw(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar } = kit(cubes);
  // Rear handle (top grip)
  bar("handle_rear", 8, -3.0, -1.2, 1.6, 1.6, 5);
  box("handle_top", 4.8, 1.6, 6.9, 3.0, 1.0, 2.2, 5);
  box("trigger", 5.6, .2, 7.0, .8, 1.0, .8, 4);
  box("grip_rear", 6.8, -2.6, 6.8, 2.4, 3.4, 2.4, 5);
  // Engine + body
  engineParts(box, o);
  // Clutch housing
  box("clutch", 5.8, 9.4, 6.8, 4.4, 1.8, 2.4, 3);
  // Guide bar (the long flat blade the chain runs on)
  box("guide_bar", 6.9, 11.0, 7.4, 2.2, 7.4, 1.2, 2);
  box("guide_bar_slot", 7.4, 11.4, 7.35, 1.2, 6.6, .25, 6);
  box("bar_tip", 7.4, 18.4, 7.45, 1.2, 1.4, .9, 1);
  box("bar_nose", 7.7, 19.3, 7.55, .6, .9, .7, 1);
  // Cutting chain: alternating cutters and depth gauges along both sides
  const links = o.high ? 11 : o.detailed ? 8 : 5;
  for (let i = 0; i < links; i++) {
    const y = 11.3 + i * (6.8 / links);
    const side = i % 2 === 0 ? 1 : -1;
    box("chain_cutter", side > 0 ? 9.0 : 6.6, y, 7.3, .5, .55, .8, 1);
    box("chain_link", side > 0 ? 9.35 : 6.45, y + .3, 7.35, .25, .3, .5, 7);
  }
  if (o.detailed) {
    // Chain brake / front guard
    box("chain_brake", 5.0, 10.4, 6.6, 6.0, .9, 2.8, 4);
    box("front_handle", 4.6, 10.6, 6.5, 1.2, 2.2, 3.0, 5);
    box("front_handle_top", 4.6, 12.4, 6.5, 1.4, .7, 3.0, 5);
    // Oil & fuel caps
    box("oil_cap", 6.2, 4.0, 6.5, .8, .5, .6, 4);
  }
  if (o.high) {
    box("chain_tension", 7.2, 10.0, 7.3, 1.6, .5, .7, 4);
    for (let i = 0; i < 3; i++) box("bar_groove_mark", 7.0, 12.0 + i * 2.0, 7.3, .3, .15, .25, 6);
    box("muffler", 10.6, 4.4, 6.7, 1.0, 2.2, 2.0, 6);
  }
  return { cubes };
}

function drill(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar } = kit(cubes);
  // Pistol grip
  bar("handle_grip", 8, -3.0, -1.0, 1.8, 1.8, 5);
  box("grip_body", 6.9, -2.6, 6.8, 2.2, 3.6, 2.4, 5);
  box("trigger", 7.0, 1.0, 7.0, 1.0, 1.2, .8, 4);
  // Motor housing (cylinder)
  box("motor_housing", 5.8, 1.2, 6.6, 4.4, 5.6, 2.8, 3);
  for (let i = 0; i < 4; i++) box("motor_vent", 6.0, 2.0 + i * 1.2, 6.5, 4.0, .5, .3, 6);
  box("motor_cap", 6.2, 6.8, 6.7, 3.6, .9, 2.6, 2);
  // Chuck (holds the bit)
  box("chuck", 6.6, 7.7, 6.9, 2.8, 1.8, 2.2, 4);
  for (let i = 0; i < 3; i++) box("chuck_jaw", 6.8 + i * .9, 9.5, 7.1, .55, .8, 1.8, 2);
  // Drill bit: twisted flute
  const bitLength = o.high ? 8.5 : 6.5;
  const segments = o.high ? 9 : o.detailed ? 6 : 4;
  for (let i = 0; i < segments; i++) {
    const y = 9.5 + i * (bitLength / segments);
    const twist = Math.sin(i * 1.2) * .35;
    box("bit_flute", 7.3 + twist, y, 7.4, 1.4, bitLength / segments + .1, 1.2, 1);
    if (i % 2 === 0) box("bit_flute_edge", 7.2 + twist, y, 7.35, .3, bitLength / segments, 1.3, 2);
  }
  box("bit_tip", 7.5, 9.5 + bitLength, 7.6, 1.0, 1.2, .8, 7, o.glowing);
  if (o.detailed) {
    // Side handle for two-handed use
    box("side_handle", 10.2, 4.0, 7.0, 1.8, 1.2, 2.0, 5);
    box("side_knob", 11.5, 3.7, 7.3, 1.2, 1.8, 1.4, 5);
    // Trigger lock
    box("trigger_lock", 8.8, 1.1, 7.0, .6, .9, .6, 6);
    box("depth_gauge", 5.6, 8.4, 6.7, .8, 2.0, 2.4, 4);
  }
  if (o.high) {
    box("brush_cap", 6.5, 1.5, 6.6, .7, .7, .5, 4);
    box("brush_cap", 8.8, 1.5, 6.6, .7, .7, .5, 4);
    box("cable", 5.4, 3.0, 7.2, .7, .8, 1.6, 5);
    for (let i = 0; i < 2; i++) box("bit_mark", 7.1, 11.5 + i * 2.5, 7.3, .25, .8, .2, 6);
  }
  return { cubes };
}

function nailgun(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar } = kit(cubes);
  // Main body: magazine + nose
  bar("handle_grip", 8, -2.8, -0.6, 1.8, 1.8, 5);
  box("body_main", 5.6, -.4, 6.7, 4.8, 6.0, 2.6, 3);
  box("body_top", 5.8, 5.6, 6.8, 4.4, 1.0, 2.4, 2);
  // Nail magazine (angled clip)
  box("magazine", 6.2, 6.6, 6.9, 3.6, 4.2, 2.0, 3);
  box("magazine_slot", 7.0, 7.0, 6.85, 2.0, 3.4, .2, 6);
  box("magazine_base", 6.4, 10.4, 6.9, 3.2, .6, 2.0, 4);
  if (o.detailed) for (let i = 0; i < 4; i++) box("nail_visible", 7.2, 7.2 + i * .9, 6.82, .5, .5, .15, 7);
  // Contact nose / safety tip
  box("nose", 6.8, 11.0, 6.9, 2.4, 2.0, 2.2, 4);
  box("nose_tip", 7.2, 13.0, 7.1, 1.6, 1.0, 1.8, 2);
  box("nail_exit", 7.5, 13.8, 7.4, 1.0, .8, 1.0, 7, o.glowing);
  // Air hose connector
  box("air_inlet", 7.2, -1.2, 6.8, 1.6, 1.4, 1.8, 6);
  box("air_fitting", 7.5, -2.2, 7.0, 1.0, 1.0, 1.4, 4);
  // Trigger
  box("trigger", 7.0, .4, 6.9, 1.2, 1.4, .8, 4);
  if (o.detailed) {
    // Exhaust port
    box("exhaust_port", 5.0, 2.4, 6.8, .8, 1.6, 1.4, 6);
    // Depth adjustment wheel
    box("depth_wheel", 9.6, 11.2, 7.0, .9, 1.6, 1.6, 4);
    // Belt hook
    box("belt_hook", 10.2, 1.0, 7.1, .7, 1.8, 1.2, 5);
  }
  if (o.high) {
    box("trigger_lock", 8.6, .5, 6.9, .6, 1.0, .6, 6);
    box("nose_spring", 6.9, 12.4, 6.85, 2.2, .4, .3, 2);
    for (let i = 0; i < 3; i++) box("mag_rib", 6.4, 7.5 + i * 1.2, 8.7, 3.2, .35, .25, 4);
    box("brand_plate", 6.0, 1.0, 6.65, 3.0, 1.2, .2, 4);
  }
  return { cubes };
}

function circularsaw(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar } = kit(cubes);
  // Main housing (circular body around the blade)
  bar("handle_grip", 8, -3.0, -1.0, 1.8, 1.8, 5);
  box("housing", 4.6, 1.0, 6.4, 6.8, 6.4, 3.2, 3);
  box("housing_top", 5.0, 7.4, 6.6, 6.0, 1.0, 2.8, 2);
  // Circular blade (approximated with segments around the rim)
  const bladeRadius = o.high ? 4.2 : 3.6, segments = o.high ? 12 : 8;
  box("blade_hub", 7.0, 3.8, 7.2, 2.0, 2.0, .8, 4);
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const cx = 8, cy = 4.8, cz = 7.6;
    const x = cx + Math.cos(angle) * bladeRadius * .8;
    const y = cy + Math.sin(angle) * bladeRadius * .8;
    box("blade_tooth", x - .45, y - .45, cz - .3, .9, .9, .6, 1);
    if (i % 2 === 0 && o.detailed) box("blade_gullet", x - .3, y - .3, cz - .2, .6, .6, .4, 2);
  }
  // Upper blade guard
  box("guard_upper", 4.2, 6.6, 6.5, 7.6, 2.8, 3.4, 5);
  box("guard_lower", 4.4, 1.2, 6.6, 1.6, 3.0, 3.0, 3);
  // Base plate (shoe) that slides on the workpiece
  box("base_plate", 3.8, -.2, 6.2, 8.4, .6, 4.0, 3);
  box("base_front", 3.8, .0, 5.6, 2.4, .5, .7, 2);
  // Trigger & handle
  box("trigger", 7.0, .6, 6.8, 1.0, 1.2, .8, 4);
  box("handle_main", 6.8, -2.4, 6.7, 2.4, 3.6, 2.6, 5);
  if (o.detailed) {
    // Bevel adjustment
    box("bevel_knob", 11.8, 3.4, 7.0, 1.0, 1.6, 1.6, 4);
    // Blade wrench storage
    box("wrench_slot", 4.8, 8.2, 6.7, 1.2, 2.4, .8, 6);
    // Rip fence guide
    box("rip_fence", 12.2, 0.4, 6.4, 1.4, 2.2, 3.2, 4);
  }
  if (o.high) {
    // Spindle lock button
    box("spindle_lock", 10.8, 2.0, 6.7, .8, .8, .6, 7, o.glowing);
    // Arbor bolt
    box("arbor_bolt", 7.4, 4.2, 7.35, 1.2, 1.2, .5, 4);
    // Cord
    box("power_cord", 6.0, -2.0, 7.0, .8, .9, 1.4, 5);
    // Anti-splinter insert
    box("splinter_guard", 10.2, .5, 6.3, 1.8, .4, .6, 6);
  }
  return { cubes };
}

function flamethrower(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar } = kit(cubes);
  // Rear tank (fuel)
  bar("handle_grip", 8, -3.2, -1.4, 1.7, 1.7, 5);
  box("fuel_tank", 5.2, -1.0, 6.5, 5.6, 6.0, 3.0, 3);
  box("fuel_tank_top", 5.8, 5.0, 6.7, 4.4, .8, 2.6, 2);
  box("fuel_cap", 7.2, 5.8, 6.8, 1.6, .6, 1.4, 4);
  // Pressure tank (smaller, behind)
  box("pressure_tank", 10.8, .6, 6.9, 2.0, 4.6, 2.2, 6);
  box("pressure_valve", 11.4, 5.2, 7.3, .8, .9, 1.4, 4);
  // Ignition system
  box("igniter", 4.4, 2.2, 6.8, 1.2, 2.4, 2.0, 4);
  box("igniter_tip", 4.0, 3.0, 7.4, .8, .8, .9, 7, o.glowing);
  // Main barrel / nozzle
  box("barrel_main", 6.2, 5.8, 6.8, 3.6, 7.0, 2.4, 2);
  box("barrel_housing", 5.8, 6.4, 6.6, 4.4, 1.4, 2.8, 3);
  box("nozzle_taper", 6.8, 12.8, 7.0, 2.4, 1.6, 1.8, 4);
  box("nozzle_tip", 7.4, 14.4, 7.3, 1.2, 1.4, 1.2, 6);
  box("nozzle_hole", 7.6, 15.4, 7.5, .8, .8, .8, 1, o.glowing);
  // Trigger + valve
  box("trigger", 7.0, 4.4, 6.9, 1.2, 1.4, .8, 4);
  box("valve_wheel", 8.9, 4.0, 6.8, 1.8, 1.4, 1.8, 4);
  // Hoses connecting tanks
  if (o.detailed) {
    box("hose_upper", 6.4, 5.4, 6.7, 1.0, 1.0, 1.0, 5);
    box("hose_lower", 10.0, 1.4, 6.9, 1.2, .9, 1.0, 5);
    box("hose_connector", 6.8, 4.8, 6.8, 2.0, .8, 1.6, 6);
    // Pilot flame
    box("pilot_flame", 7.3, 16.2, 7.4, 1.4, 1.8, 1.2, 4, true);
    box("pilot_tip", 7.7, 17.4, 7.6, .6, .9, .8, 7, true);
  }
  if (o.high) {
    // Fuel gauge
    box("fuel_gauge", 5.4, 2.0, 6.4, .6, 1.4, .4, 1, true);
    // Tank straps
    for (const y of [.0, 3.0]) box("tank_strap", 5.1, y, 6.4, 5.8, .5, 3.2, 4);
    // Barrel heat shield
    for (let i = 0; i < 4; i++) box("heat_shield", 6.1, 6.6 + i * 1.6, 6.5, 3.8, .4, .3, 6);
    // Backpack strap mount
    box("strap_mount", 9.4, 4.6, 6.6, 1.4, 1.2, 2.4, 5);
    // Flame effect cubes
    box("flame_inner", 7.2, 15.8, 7.3, 1.6, 2.0, 1.4, 4, true);
    box("flame_outer", 6.8, 16.4, 7.1, 2.4, 2.6, 1.8, 1, true);
  }
  return { cubes };
}

function jackhammer(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar } = kit(cubes);
  // Main cylinder body (vertical)
  bar("handle_grip", 8, -3.2, -1.4, 2.0, 2.0, 5);
  box("cylinder", 5.6, -1.0, 6.5, 4.8, 8.0, 3.0, 3);
  for (let i = 0; i < 5; i++) box("cylinder_band", 5.4, .5 + i * 1.6, 6.3, 5.2, .5, 3.4, 4);
  box("cylinder_top", 6.0, 7.0, 6.7, 4.0, 1.0, 2.6, 2);
  // Side handles (two-handed operation)
  for (const side of [[3.6, 1.8], [10.8, 1.8]] as [number, number][]) {
    box("side_handle", side[0], side[1], 6.9, 1.6, 1.4, 2.2, 5);
    box("side_grip", side[0] + .1, side[1] + 1.0, 7.1, 1.4, 2.0, 1.8, 5);
  }
  // Piston & bit holder
  box("piston_housing", 6.2, 8.0, 6.8, 3.6, 2.0, 2.4, 4);
  box("bit_holder", 6.8, 10.0, 7.0, 2.4, 1.4, 2.0, 2);
  // Chisel bit (moil point)
  const bitSegments = o.high ? 7 : 5;
  for (let i = 0; i < bitSegments; i++) {
    const y = 11.4 + i * (6.2 / bitSegments);
    const width = 2.0 - (i / bitSegments) * 1.2;
    box("chisel_shaft", 8 - width / 2, y, 7.9 - width / 3, width, 6.2 / bitSegments + .1, width * .7, 2);
  }
  box("chisel_tip", 7.6, 17.6, 7.6, .8, 1.2, .7, 1, o.glowing);
  if (o.detailed) {
    // Air exhaust ports
    for (let i = 0; i < 3; i++) box("exhaust_port", 5.0, 2.2 + i * 1.6, 6.6, .6, .9, 1.2, 6);
    // Throttle / trigger
    box("throttle", 8.8, .2, 6.7, .8, 1.4, 1.0, 4);
    // Hose connection
    box("air_hose", 10.4, -.6, 6.9, 1.6, 1.2, 1.6, 5);
  }
  if (o.high) {
    // Vibration dampers
    box("damper", 5.2, 9.4, 6.6, 1.2, 1.6, 2.4, 5);
    box("damper", 9.6, 9.4, 6.6, 1.2, 1.6, 2.4, 5);
    // Tool retainer
    box("retainer", 6.4, 10.2, 6.8, 3.2, .6, 2.4, 4);
    // Side rod marks
    for (let i = 0; i < 3; i++) box("rod_mark", 8.4, 2.4 + i * 2.0, 6.4, .4, .8, .3, 6);
    // Foot
    box("machine_foot", 6.0, -1.6, 6.4, 4.0, .7, 3.2, 6);
  }
  return { cubes };
}

// ==== spell_sword ====
function spell_sword(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar, pair } = kit(cubes);
  bar("pommel_base", 8, -3.2, -2.0, 2.6, 2.4, 4);
  bar("pommel_gem", 8, -2.8, -1.6, 1.4, 2.8, 1, o.glowing);
  bar("grip", 8, -1.6, 2.2, 1.6, 1.6, 5);
  if (o.detailed) wraps(bar, -1.4, 2.0, 1.9, 6, 3);
  bar("guard_core", 8, 2.2, 3.6, 3.2, 2.8, 4);
  pair("guard_wing", 2.6, 6.4, 2.5, 3.5, 2.2, 4);
  pair("guard_gem", 3.6, 5.2, 2.6, 3.2, 2.4, 1, true);
  bar("ricasso", 8, 3.6, 4.6, 3.6, 1.8, 4);
  for (let y = 4.6; y < 17; y += 1) {
    const w = y < 14 ? 1.7 - (y - 4.6) / 9.4 * .5 : 1.2 - (y - 14) / 3 * .5;
    bar("blade", 8, y, Math.min(y + 1, 17), w * 2, 1.6, 0);
    bar("blade_ridge", 8, y, Math.min(y + 1, 17), .35, 1.85, 1, true);
    if (o.detailed) { bar("blade_edge_l", 8 - w, y, Math.min(y + 1, 17), .35, 1.7, 1); bar("blade_edge_r", 8 + w - .35, y, Math.min(y + 1, 17), .35, 1.7, 2); }
    if (o.high && y % 2 < 1) bar("blade_rune", 8, y, Math.min(y + .7, 17), .55, 1.95, 7, true);
  }
  bar("blade_tip_a", 8, 17, 18.2, 1.2, 1.1, 1);
  bar("blade_tip_b", 8, 18.2, 19, .5, .9, 7, true);
  if (o.detailed) { box("side_gem_l", 5.8, 8, 7.45, 1, 1, .4, 1, true); box("side_gem_r", 9.2, 8, 7.45, 1, 1, .4, 1, true); }
  return { cubes };
}

// ==== enchanted_axe ====
function enchanted_axe(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar } = kit(cubes);
  bar("end_cap", 8, -3.2, -2.2, 2, 2, 4);
  bar("handle", 8, -2.2, 14.2, 1.5, 1.5, 5);
  if (o.detailed) wraps(bar, -2.0, 2.0, 1.8, 6, 3);
  box("head_socket", 5.2, 9.8, 7, 3.8, 5, 2.2, 3);
  box("head_body", 3.4, 9.2, 7.05, 2, 6.2, 2, 0);
  box("head_bit", 2.2, 8.6, 7.15, 1.4, 7.6, 1.8, 0);
  box("head_edge", 1.2, 8, 7.25, 1.2, 8.6, 1.6, 1);
  box("poll", 8.8, 10.4, 7.1, 1.6, 3.4, 1.9, 2);
  bar("binding", 8, 8.6, 10, 2.3, 2.3, 4);
  box("head_gem", 6, 11.2, 6.7, 1.2, 2, .5, 1, true);
  box("head_glow", 3.4, 9.2, 6.95, 2, 6.2, .25, 1, true);
  if (o.detailed) { box("blade_rune", 2.6, 10, 7, .6, 1.2, 1.8, 7, true); box("blade_rune", 2.6, 12.6, 7, .6, 1.2, 1.8, 7, true); box("head_rivet", 4.1, 13, 6.85, .5, .5, .35, 4); }
  if (o.high) { box("energy_arc", 2.8, 8.2, 7.35, 1, 7.6, .25, 7, true); box("poll_rune", 8.8, 11, 6.85, 1.6, 1, .35, 7, true); }
  return { cubes };
}

// ==== cursed_blade ====
function cursed_blade(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar, pair } = kit(cubes);
  bar("pommel_base", 8, -3.2, -1.8, 2.4, 2.6, 6);
  bar("pommel_eye", 8, -2.8, -1.6, 1.2, 2.8, 7, true);
  bar("grip", 8, -1.8, 2.4, 1.5, 1.5, 5);
  if (o.detailed) wraps(bar, -1.6, 2.2, 1.8, 5, 3);
  bar("guard_core", 8, 2.4, 3.8, 3.4, 2.8, 6);
  pair("guard_horn", 2.4, 5.6, 2.6, 3.6, 2.2, 6);
  pair("guard_eye", 3.4, 5, 2.7, 3.2, 2.5, 7, true);
  for (let y = 3.8; y < 17; y += 1) {
    const w = y < 13 ? 1.9 - (y - 3.8) / 9.2 * .6 : 1.3 - (y - 13) / 4 * .6;
    const twist = Math.sin(y * .3) * .25;
    bar("blade", 8 + twist, y, Math.min(y + 1, 17), w * 2, 1.7, 6);
    bar("blade_edge_l", 8 + twist - w, y, Math.min(y + 1, 17), .35, 1.8, 2);
    bar("blade_edge_r", 8 + twist + w - .35, y, Math.min(y + 1, 17), .35, 1.8, 2);
    if (o.detailed && y % 2 < 1) bar("blade_vein", 8 + twist, y, Math.min(y + .7, 17), .45, 1.95, 7, true);
    if (o.high && y % 3 < 1) { box("blade_thorn", 8 + twist - w - .6, y, 7.5, .6, .7, 1, 2); box("blade_thorn", 8 + twist + w, y, 7.5, .6, .7, 1, 2); }
  }
  bar("blade_tip", 8, 17, 19, .8, 1, 7, true);
  if (o.detailed) for (let i = 0; i < 3; i++) { box("dark_wisp", 6.2 - i * .3, 6 + i * 3.5, 7.5, .5, .5, .5, 7, true); }
  return { cubes };
}

// ==== soul_reaper ====
function soul_reaper(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar, pair } = kit(cubes);
  bar("end_cap", 8, -3.1, -2.2, 1.8, 1.8, 6);
  bar("pole", 8, -2.2, 13.2, 1.4, 1.4, 5);
  if (o.detailed) wraps(bar, -1.8, 2.6, 1.7, 5, 3);
  bar("collar", 8, 12.4, 13.8, 2.4, 2.4, 6);
  box("skull", 6.8, 13.8, 7, 2.4, 2, 2, 7, true);
  box("skull_eye", 7.2, 14.6, 6.85, .6, .5, .3, 2, true);
  box("skull_eye", 8.2, 14.6, 6.85, .6, .5, .3, 2, true);
  bar("blade_frame", 8, 15.8, 17.4, 7, 1.8, 6);
  bar("blade_shine", 8, 16, 17.2, 5.8, 1.3, 1);
  bar("blade_spine", 8, 15.8, 17.4, 1, 1.7, 2);
  pair("blade_wing", 3.8, 6.4, 15.8, 17.4, 1.6, 6);
  pair("blade_edge", 3.2, 5, 16, 17.2, 1.4, 1);
  if (o.detailed) { bar("blade_gem", 8, 16.2, 17, 1, 1.5, 7, true); pair("chain_hook", 5.8, 6.4, 14.8, 15.6, 1.1, 2); }
  if (o.high) { box("soul_wisp", 4, 16.8, 7.5, .6, .6, .5, 7, true); box("soul_wisp", 11, 17, 7.5, .6, .6, .5, 7, true); box("dark_aura", 6, 13.5, 6.9, 4, 1, .3, 7, true); }
  return { cubes };
}

// ==== shadow_dagger ====
function shadow_dagger(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar, pair } = kit(cubes);
  bar("pommel", 8, -2.2, -.8, 2, 2, 6);
  bar("grip", 8, -.8, 2.2, 1.4, 1.4, 5);
  bar("guard", 8, 2.2, 3.4, 4, 2.2, 6);
  pair("guard_shade", 4, 5.6, 2.3, 3.3, 2, 2);
  for (let y = 3.4; y < 11; y += 1) {
    const w = 1.3 - (y - 3.4) / 7.6 * .6;
    bar("blade", 8, y, Math.min(y + 1, 11), w * 2, 1.5, 6);
    bar("blade_edge_l", 8 - w, y, Math.min(y + 1, 11), .3, 1.6, 2);
    bar("blade_edge_r", 8 + w - .3, y, Math.min(y + 1, 11), .3, 1.6, 2);
  }
  bar("blade_tip", 8, 11, 12.6, .6, .9, 7, true);
  if (o.detailed) { box("shadow_wisp", 5.5, 5, 7.5, .5, 1.2, .5, 7, true); box("shadow_wisp", 10, 7, 7.5, .5, 1, .5, 7, true); }
  if (o.high) { box("shadow_aura", 5, 3, 6.9, 6, 8, .3, 7, true); box("glow_eye", 7.5, 2.5, 6.85, 1, .8, .3, 2, true); }
  return { cubes };
}

// ==== blood_sword ====
function blood_sword(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar, pair } = kit(cubes);
  bar("pommel_base", 8, -3.2, -1.8, 2.4, 2.4, 3);
  bar("pommel_gem", 8, -2.8, -1.6, 1.2, 2.8, 2, true);
  bar("grip", 8, -1.8, 2.2, 1.5, 1.5, 5);
  if (o.detailed) wraps(bar, -1.6, 2.0, 1.8, 3, 5);
  bar("guard_core", 8, 2.2, 3.5, 3.2, 2.8, 3);
  pair("guard_wing", 2.8, 6, 2.4, 3.4, 2.2, 3);
  bar("ricasso", 8, 3.5, 4.5, 3.6, 1.8, 3);
  for (let y = 4.5; y < 17; y += 1) {
    const w = y < 13 ? 1.6 - (y - 4.5) / 8.5 * .5 : 1.1 - (y - 13) / 4 * .5;
    bar("blade", 8, y, Math.min(y + 1, 17), w * 2, 1.6, 0);
    bar("blade_fuller", 8, y, Math.min(y + 1, 17), .5, 1.8, 2);
    if (o.detailed && y % 2 < 1) { bar("blood_drip", 8 - .3, y, Math.min(y + .8, 17), .6, 1.75, 2); }
  }
  bar("blade_tip", 8, 17, 18.6, .7, 1, 2);
  if (o.detailed) { box("blood_splatter", 6.5, 8, 7.45, 1.2, .8, .3, 2); box("blood_splatter", 9, 11, 7.45, 1, .6, .3, 2); }
  if (o.high) { box("blood_vein", 7.2, 5, 6.95, .4, 11, .25, 2, true); box("blood_drip_tip", 7.4, 17.5, 7.4, .8, 1.2, .4, 2); }
  return { cubes };
}

// ==== blood_axe ====
function blood_axe(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar } = kit(cubes);
  bar("end_cap", 8, -3.2, -2.2, 2, 2, 3);
  bar("handle", 8, -2.2, 14.2, 1.5, 1.5, 5);
  if (o.detailed) wraps(bar, -2, 2, 1.8, 3, 5);
  box("head_socket", 5.2, 9.8, 7, 3.8, 5, 2.2, 3);
  box("head_body", 3.4, 9.2, 7.05, 2, 6.2, 2, 0);
  box("head_bit", 2.2, 8.6, 7.15, 1.4, 7.6, 1.8, 0);
  box("head_edge", 1.2, 8, 7.25, 1.2, 8.6, 1.6, 1);
  box("poll", 8.8, 10.4, 7.1, 1.6, 3.4, 1.9, 2);
  bar("binding", 8, 8.6, 10, 2.3, 2.3, 3);
  box("blood_stain", 3, 9.5, 6.95, 2, 5, .25, 2);
  if (o.detailed) { box("blood_splatter", 2.6, 11, 7, .8, 1.2, 1.8, 2); box("blood_drip", 2.4, 8, 7, .8, 1, 1.8, 2); box("head_rivet", 4.1, 13, 6.85, .5, .5, .35, 4); }
  if (o.high) { box("blood_vein", 3.2, 9, 6.95, .4, 5, .25, 2, true); box("blood_pool", 2.8, 7.6, 7, 1.6, .6, 1.8, 2); }
  return { cubes };
}

// ==== grimoire ====
function grimoire(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar, pair } = kit(cubes);
  box("book_cover", 3.5, 1.5, 5.5, 9, 12, 5, 2);
  box("book_spine", 3.2, 1.5, 5.2, 1, 12, 5.6, 3);
  box("book_pages", 4.5, 2.5, 6, 7, 10, 3.8, 1);
  box("book_page_top", 4.5, 11.8, 6, 7, .7, 3.8, 7);
  box("book_clasp", 8.2, 6, 5.2, 1.6, 2, .8, 4);
  box("book_clasp2", 8.2, 9.5, 5.2, 1.6, 2, .8, 4);
  bar("book_ribbon", 7.5, 1.5, 13.5, 1, .4, 2);
  if (o.detailed) {
    for (let i = 0; i < 5; i++) box("book_rune", 5 + (i % 3) * 2, 3 + i * 1.8, 5.05, 1, .6, .2, 7, true);
    box("book_gem", 6.2, 7, 5.15, 1.6, 1.6, .4, 1, true);
    pair("book_corner", 3.8, 4.8, 1.8, 2.8, 5.2, 4);
  }
  if (o.high) {
    box("float_page", 10, 4, 7.5, 2, 2.5, .2, 1);
    box("float_page2", 11.5, 8, 7.5, 2, 2, .2, 1);
    box("magic_glow", 4.5, 2, 6.2, 7, 10, .3, 1, true);
  }
  return { cubes };
}

// ==== magic_circle ====
function magic_circle(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar } = kit(cubes);
  box("circle_base", 3, 0, 3, 10, .8, 10, 3);
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    const cx = 8 + Math.cos(angle) * 4.2, cz = 8 + Math.sin(angle) * 4.2;
    box("ring_segment", cx - .8, .8, cz - .8, 1.6, .7, 1.6, 4);
    if (i % 3 === 0) box("ring_gem", cx - .5, 1.5, cz - .5, 1, 1, 1, 1, true);
    if (o.detailed && i % 2 === 0) box("rune_mark", cx - .3, 1.5, cz - .3, .6, .25, .6, 7, true);
  }
  box("inner_ring", 5.5, .8, 5.5, 5, .5, 5, 4);
  box("center_gem", 7, 1.3, 7, 2, 1.6, 2, 1, true);
  box("center_glow", 6.5, 1.8, 6.5, 3, 1.2, 3, 7, true);
  if (o.detailed) {
    for (let i = 0; i < 6; i++) { const angle = i * Math.PI / 3; const cx = 8 + Math.cos(angle) * 3, cz = 8 + Math.sin(angle) * 3; box("line_mark", cx - .2, .85, cz - .2, .4, .2, .4, 7, true); }
    for (const [x, z] of [[2, 2], [14, 2], [2, 14], [14, 14]]) box("corner_rune", x, .8, z, 1.2, .5, 1.2, 4);
  }
  if (o.high) {
    for (let i = 0; i < 4; i++) { const angle = i * Math.PI / 2 + Math.PI / 4; const cx = 8 + Math.cos(angle) * 5.5, cz = 8 + Math.sin(angle) * 5.5; box("outer_pillar", cx - .5, .8, cz - .5, 1, 3, 1, 3); box("pillar_gem", cx - .3, 3.8, cz - .3, .6, .8, .6, 1, true); }
    box("energy_beam", 7.5, 2, 7.5, 1, 6, 1, 7, true);
  }
  return { cubes };
}

// ==== assault_rifle ====
function assault_rifle(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar } = kit(cubes);
  box("stock", 6, -3, 6.8, 2, 5, 2.4, 5);
  box("stock_pad", 5.8, -3.2, 6.6, 2.4, 1, 2.8, 6);
  box("receiver", 5.5, 2, 6.4, 5, 3.2, 3.2, 3);
  box("rail", 5.8, 5.2, 6.6, 4.4, .8, 2.8, 4);
  box("barrel", 7, 5.2, 7.2, 2, 7, 1.6, 3);
  box("muzzle", 7.2, 12, 7.3, 1.6, 1.2, 1.4, 6);
  box("handguard", 5.8, 5, 6.8, 4.4, 5, 2.4, 5);
  for (let i = 0; i < 4; i++) box("handguard_slot", 6, 5.8 + i * 1.1, 6.65, 4, .4, .3, 6);
  box("grip", 6.8, -.2, 6.8, 2, 3, 2, 5);
  box("trigger", 6.2, 2, 6.9, 1, 1.2, .8, 4);
  box("magazine", 6, 1, 6.9, 3, 4, 2, 3);
  box("mag_release", 5.8, 2, 6.6, .6, .8, .8, 4);
  box("scope", 6.2, 5.8, 6.8, 3.6, 2, 2.4, 4);
  box("scope_lens", 7.4, 6.2, 6.65, 1.2, 1.2, .3, 1, true);
  box("charging_handle", 5.2, 4.8, 6.8, 1.2, .8, 1, 6);
  if (o.detailed) {
    box("front_sight", 7, 11.6, 7, 2, .8, 1.4, 6);
    box("rear_sight", 6, 5.4, 7, 1.6, .8, 1.4, 6);
    box("bolt_catch", 5.6, 3, 6.6, .6, 1, .8, 4);
    box("safety", 5.6, 2.6, 7.2, .8, .8, .6, 4);
  }
  if (o.high) {
    box("foregrip", 6, 3, 7, 2, 2, 1.2, 5);
    box("laser", 6.8, 8.4, 6.7, 1.2, 1.6, 1, 6);
    box("laser_dot", 7.2, 9.6, 6.95, .4, .4, .3, 2, true);
    box("stock_cheek", 6, 1, 6.6, 2, 2, .6, 5);
    box("sling_mount", 5.8, 4, 7.2, .8, .8, .6, 4);
  }
  return { cubes };
}

// ==== sniper_rifle ====
function sniper_rifle(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar } = kit(cubes);
  box("stock", 5.5, -3, 6.6, 3, 6, 2.8, 5);
  box("cheek_rest", 6, -1, 6.5, 2, 2, .8, 6);
  box("receiver", 5.5, 3, 6.4, 5, 2.8, 3.2, 3);
  box("bolt_handle", 4.8, 3.4, 6.8, 1, .8, 1.2, 4);
  box("barrel", 7, 4.8, 7.2, 2, 9, 1.6, 3);
  box("muzzle_brake", 7.2, 13.6, 7.3, 1.6, 1.2, 1.4, 6);
  for (let i = 0; i < 3; i++) box("brake_port", 7, 13.8 + i * .3, 7.4, 2, .15, .3, 6);
  box("scope_main", 5.8, 5.6, 6.7, 4.4, 2, 2.6, 4);
  box("scope_lens_f", 7.6, 5.8, 6.55, .8, 1.6, .3, 1, true);
  box("scope_lens_r", 5.2, 5.8, 6.55, .8, 1.6, .3, 7);
  box("scope_ring1", 6, 5.2, 6.6, 3.4, .6, 2.8, 4);
  box("scope_ring2", 6, 7.2, 6.6, 3.4, .6, 2.8, 4);
  box("grip", 6.8, -.2, 6.8, 2, 3.4, 2, 5);
  box("trigger", 6.2, 2, 6.9, 1, 1.2, .8, 4);
  box("magazine", 6, .8, 6.9, 3, 2.6, 2, 3);
  if (o.detailed) {
    box("bipod_leg_l", 5, 2, 6.2, 1, 3, 1, 5);
    box("bipod_leg_r", 10, 2, 6.2, 1, 3, 1, 5);
    box("bipod_foot_l", 4.8, 1.2, 6, 1.4, .8, 1.4, 6);
    box("bipod_foot_r", 10, 1.2, 6, 1.4, .8, 1.4, 6);
    box("rail_bottom", 5.8, 4.6, 7, 4.4, .5, 1.8, 4);
  }
  if (o.high) {
    box("scope_turret_top", 6.4, 7.4, 7, 1.2, 1, 1.4, 4);
    box("scope_turret_side", 5, 5.8, 7, .8, 1.2, 1.4, 4);
    box("thread_protector", 7, 12.8, 7.2, 2, .8, 1.6, 6);
    box("sling_swivel", 5.2, 1, 7.2, .6, .8, .6, 4);
    box("sling_swivel2", 5.2, -1, 7.2, .6, .8, .6, 4);
  }
  return { cubes };
}

// ==== pistol ====
function pistol(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar } = kit(cubes);
  box("slide", 4.8, 6, 6.6, 6.4, 2.4, 2.8, 3);
  box("barrel", 8, 6.4, 7.1, 3.2, 1.6, 1.8, 4);
  box("muzzle", 11, 6.4, 7.2, 1, 1.6, 1.6, 6);
  box("frame", 5, 3.6, 6.6, 5, 2.4, 2.6, 3);
  box("grip", 5.2, -.8, 6.7, 3, 4.4, 2.4, 5);
  box("trigger_guard", 5.8, 2.8, 6.8, 2, 1.2, 1, 4);
  box("trigger", 6.2, 3, 6.9, 1, 1, .8, 4);
  box("hammer", 4.6, 6, 7, 1, 1.2, 1, 4);
  box("magazine_base", 5.4, -.8, 6.8, 2.6, .8, 2.2, 6);
  if (o.detailed) {
    box("sight_front", 9.8, 8.2, 7.2, .8, .8, 1.2, 6);
    box("sight_rear", 5, 8.2, 7, 1.2, .8, 1.2, 6);
    box("slide_serration1", 5, 6.4, 6.55, .4, 1.6, .2, 6);
    box("slide_serration2", 5.8, 6.4, 6.55, .4, 1.6, .2, 6);
    box("slide_serration3", 6.6, 6.4, 6.55, .4, 1.6, .2, 6);
    box("grip_texture", 5.4, 0, 6.65, 2.6, 3, .3, 6);
    box("safety", 5, 4.2, 7.2, .8, .8, .6, 4);
  }
  if (o.high) {
    box("rail_bottom", 5.8, 3.2, 7, 2.6, .5, 1.2, 4);
    box("laser_module", 6, 2.6, 7.1, 1.6, 1, .8, 6);
    box("laser_dot", 7, 2.8, 7.35, .4, .4, .3, 2, true);
    box("slide_release", 5, 4.6, 6.55, 1.2, .6, .3, 4);
  }
  return { cubes };
}

// ==== shotgun ====
function shotgun(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar } = kit(cubes);
  box("stock", 5, -3, 6.6, 3, 6, 2.8, 5);
  box("stock_plate", 4.8, -3.2, 6.4, 3.4, 1, 3.2, 6);
  box("receiver", 5.5, 3, 6.4, 5, 3, 3.2, 3);
  box("barrel", 7, 5.2, 7.2, 2, 8.4, 1.8, 3);
  box("magazine_tube", 7, 5, 8.8, 2, 7.6, 1.2, 4);
  box("muzzle", 7.2, 13.2, 7.3, 1.6, 1.2, 1.6, 6);
  box("pump", 6, 7, 6.8, 4, 3, 2.4, 5);
  for (let i = 0; i < 3; i++) box("pump_grip", 6.2, 7.4 + i * 1, 6.65, 3.6, .35, .3, 6);
  box("grip", 6.8, -.2, 6.8, 2, 3.4, 2, 5);
  box("trigger", 6.2, 2.2, 6.9, 1, 1.2, .8, 4);
  box("trigger_guard", 5.8, 1.6, 6.8, 2.2, 1, 1, 4);
  if (o.detailed) {
    box("front_sight", 7.2, 12.8, 7.3, 1.6, .8, 1.2, 6);
    box("shell_holder", 5, 4.2, 6.55, 1, 2, .4, 4);
    box("shell_visible", 5.2, 4.4, 6.4, .6, 1.2, .5, 2);
    box("shell_visible2", 5.2, 5.8, 6.4, .6, 1.2, .5, 2);
    box("pump_release", 5.8, 6, 6.6, .8, .8, .8, 4);
  }
  if (o.high) {
    box("rail_top", 5.8, 5.6, 6.8, 4.4, .5, 1.8, 4);
    box("heat_shield", 6.5, 6, 6.6, 3, 7, .3, 6);
    box("stock_sling", 5.2, -1, 7.2, .6, 1, .6, 4);
    box("mag_sling", 5.2, 8, 8.8, .6, 1, .6, 4);
  }
  return { cubes };
}

// ==== railgun ====
function railgun(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar, pair } = kit(cubes);
  box("stock", 5.2, -3, 6.5, 3.6, 5.4, 3, 3);
  box("stock_pad", 5, -3.2, 6.3, 4, 1, 3.4, 6);
  box("receiver", 5, 2.4, 6.2, 6, 3.6, 3.6, 3);
  box("rail_barrel", 6, 5.2, 6.8, 4, 8.8, 2.4, 3);
  box("rail_top", 6.2, 5.2, 6.6, 3.6, 8.8, 1, 4);
  box("rail_bottom", 6.2, 5.2, 9, 3.6, 8.8, 1, 4);
  for (let i = 0; i < 5; i++) box("coil", 5.8, 6 + i * 1.6, 6.5, 4.4, .8, 3, 4);
  box("muzzle", 6.4, 13.8, 6.8, 3.2, 1.4, 2.4, 6);
  box("energy_core", 6.8, 6, 7.4, 2.4, 6, 1.2, 1, true);
  box("grip", 6.6, -.6, 6.8, 2.2, 3.2, 2.2, 5);
  box("trigger", 6, 1.6, 6.9, 1, 1.2, .8, 4);
  box("scope", 6.4, 2.8, 6.7, 3.2, 1.8, 2.6, 4);
  box("scope_lens", 7.2, 3.1, 6.55, 1, 1.2, .3, 1, true);
  box("capacitor", 10, 3, 6.8, 1.6, 3, 2.4, 6);
  if (o.detailed) {
    for (let i = 0; i < 3; i++) { box("coil_wire", 5.6, 6.4 + i * 2.2, 6.35, 4.8, .3, .3, 7, true); }
    box("vent1", 5, 3, 6.15, 1, 1.6, .3, 6);
    box("vent2", 5, 5, 6.15, 1, 1.6, .3, 6);
    box("charge_indicator", 5.2, 2.6, 6.15, 1.4, .8, .3, 2, true);
  }
  if (o.high) {
    box("energy_beam_preview", 6.8, 14, 7.4, 2.4, 2, 1.2, 1, true);
    box("heat_sink1", 5, 7, 9, 1, 2, 1, 4);
    box("heat_sink2", 10, 7, 9, 1, 2, 1, 4);
    box("cable1", 9.6, 2, 7.2, 1, 1, 1, 5);
    box("cable2", 9.6, 4, 7.2, 1, 1, 1, 5);
  }
  return { cubes };
}

// ==== relic ====
function relic(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar, pair } = kit(cubes);
  box("base", 4, 0, 4, 8, 1.5, 8, 3);
  box("base_trim", 3.5, 1.5, 3.5, 9, .7, 9, 4);
  box("column", 6, 2.2, 6, 4, 5, 4, 2);
  for (let i = 0; i < 3; i++) box("column_ring", 5.6, 3 + i * 1.8, 5.6, 4.8, .5, 4.8, 4);
  box("top_plate", 5, 7.2, 5, 6, .8, 6, 3);
  box("core_gem", 7, 8, 7, 2, 2, 2, 1, true);
  box("core_glow", 6.5, 7.5, 6.5, 3, 3, 3, 7, true);
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2;
    const cx = 8 + Math.cos(angle) * 3.2, cz = 8 + Math.sin(angle) * 3.2;
    box("float_gem", cx - .6, 8 + (i % 2) * 1.5, cz - .6, 1.2, 1.2, 1.2, i % 2 ? 1 : 4, true);
    box("float_ring", cx - 1, 7.5 + (i % 2) * 1.5, cz - 1, 2, .3, 2, 4);
  }
  if (o.detailed) {
    pair("base_rune", 4.2, 5, .1, .3, 4.2, 7, true);
    pair("base_rune2", 11, 11.8, .1, .3, 4.2, 7, true);
    for (let i = 0; i < 4; i++) { const angle = i * Math.PI / 2 + Math.PI / 4; const cx = 8 + Math.cos(angle) * 4.2, cz = 8 + Math.sin(angle) * 4.2; box("column_rib", cx - .3, 2.2, cz - .3, .6, 5, .6, 4); }
  }
  if (o.high) {
    box("energy_beam", 7.5, 10, 7.5, 1, 4, 1, 7, true);
    box("halo_top", 6, 13, 6, 4, .3, 4, 7, true);
    for (let i = 0; i < 6; i++) { const angle = i * Math.PI / 3; const cx = 8 + Math.cos(angle) * 4.8, cz = 8 + Math.sin(angle) * 4.8; box("orbit_gem", cx - .4, 11.5, cz - .4, .8, .8, .8, 1, true); }
  }
  return { cubes };
}

// ==== spear ====
function spear(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar, pair } = kit(cubes);
  bar("butt_spike", 8, -3.2, -1.5, 1.2, 1.2, 6);
  bar("shaft", 8, -1.5, 12, 1.3, 1.3, 5);
  if (o.detailed) wraps(bar, -1.2, 3, 1.6, 5, 3);
  bar("collar_low", 8, 3, 4, 2.2, 2.2, 4);
  bar("collar_high", 8, 10, 11, 2.2, 2.2, 4);
  bar("blade_base", 8, 11, 13, 2.8, 1.8, 4);
  bar("blade_mid", 8, 13, 16, 2.2, 1.6, 0);
  bar("blade_edge_l", 6.4, 13, 16, .35, 1.7, 1);
  bar("blade_edge_r", 9.25, 13, 16, .35, 1.7, 2);
  bar("blade_tip", 8, 16, 18.6, .8, .9, 1);
  pair("side_prong", 5.2, 6.8, 11, 15, 1.4, 0);
  pair("side_prong_tip", 4.8, 5.6, 14.5, 15.8, 1, 1);
  pair("guard_hook", 3.6, 5, 11, 13, 1.2, 2);
  if (o.detailed) {
    bar("blade_gem", 8, 13.2, 14.4, 1, 1.9, 4, true);
    pair("ribbon_wrap1", 6.4, 7.2, 5, 6.4, 1.5, 2);
    pair("ribbon_wrap2", 6.4, 7.2, 8, 9.4, 1.5, 2);
    for (let i = 0; i < 3; i++) bar("gold_band", 8, 4.4 + i * 2.2, 5 + i * 2.2, 1.8, 1.8, 4);
    pair("blade_rune", 6.8, 7.6, 13.5, 14.5, 1.8, 7, true);
  }
  if (o.high) {
    for (let i = 0; i < 4; i++) { box("hanging_gem", 5.5 + (i % 2) * 3.2, 3 + i * 1.8, 7.5, .7, 1.2, .7, i % 2 ? 1 : 4, true); }
    pair("tassel", 5.6, 6.2, 1, 3.4, 1.6, 2);
    for (let i = 0; i < 3; i++) bar("shaft_rune", 8, 6 + i * 1.6, 6.6 + i * 1.6, .5, 1.7, 7, true);
  }
  return { cubes };
}

// ==== mace ====
function mace(o: ItemOptions): BuiltItem {
  const cubes: VoxelCube[] = []; const { box, bar, pair } = kit(cubes);
  bar("pommel", 8, -3.2, -1.8, 2.2, 2.2, 4);
  bar("handle", 8, -1.8, 9.5, 1.5, 1.5, 5);
  if (o.detailed) wraps(bar, -1.6, 8, 1.8, 3, 5);
  bar("collar", 8, 9.5, 10.6, 2.4, 2.4, 4);
  bar("head_core", 8, 10.6, 15, 3.6, 3, 3);
  bar("head_band", 8, 12, 12.8, 4, 3.2, 4);
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;
    const cx = 8 + Math.cos(angle) * 2.8, cz = 8 + Math.sin(angle) * 2.8;
    box("flange", cx - .7, 10.8, cz - .7, 1.4, 3.6, 1.4, 2);
    box("flange_tip", cx - .45, 14.2, cz - .45, .9, 1, .9, 1);
    if (o.detailed) box("flange_glow", cx - .3, 12, cz - 1, .6, 1, .3, 7, true);
  }
  bar("head_top", 8, 15, 16, 2.4, 2, 4);
  bar("head_gem", 8, 15.8, 16.8, 1.2, 1.2, 1, true);
  if (o.detailed) {
    for (const y of [11, 13.6]) pair("head_rivet", 5.8, 6.6, y, y + .5, 3, 4);
    bar("grip_guard", 8, 8.2, 9, 2.6, 2.6, 4);
  }
  if (o.high) {
    box("energy_field", 4.8, 10.2, 4.8, 6.4, 5, 6.4, 7, true);
    pair("chain_wrap", 5.2, 6, 6, 7.4, 1.6, 6);
  }
  return { cubes };
}

export const ITEM_BUILDERS: Partial<Record<ModelKind, (o: ItemOptions) => BuiltItem>> = { sword, pickaxe, axe, shovel, bow, staff, trident, hammer, scythe, chainsaw, drill, nailgun, circularsaw, flamethrower, jackhammer,
  spell_sword, enchanted_axe, cursed_blade, soul_reaper, shadow_dagger, blood_sword, blood_axe, grimoire, magic_circle,
  assault_rifle, sniper_rifle, pistol, shotgun, railgun, relic, spear, mace };
