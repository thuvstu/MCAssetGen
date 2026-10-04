import {
  ATLAS_GRID, DEFAULT_SETTINGS, DEFAULT_TAGS, FACES, KIND_INFO, KIND_RULES, MATERIAL_NAMES, NAMESPACE, PALETTES, TEMPLATES,
  type ConcretePalette, type GenerationSettings, type FaceName, type ModelKind, type ModelTexture, type ModelVariant,
  type Pose, type Vec3, type VoxelCube, type VoxelModel,
} from "./json-catalog";
import { ITEM_BUILDERS } from "./json-items";
import { analyzePrompt, normalizeTags, PromptError } from "./json-prompt";
import { applyShape } from "./json-shape";
import { analysisFromDesign } from "./json-configurator";
import { accentEntries, bbFaceTexture, bbTintTextures, tintKey, tintTextureVariables } from "./json-colors";
import { applyAccent, buildDecor, hasExtras, normalizeExtras } from "./json-decor";
export { analyzePrompt, normalizeTags, splitTags, PROMPT_EXAMPLES, PromptError } from "./json-prompt";

export * from "./json-catalog";

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

export function baseItemFor(kind: ModelKind, material: string): string {
  if (kind === "bow") return "bow";
  if (kind === "staff") return "stick";
  if (kind === "trident") return "trident";
  if (KIND_INFO[kind].pose === "decor") return "paper";
  const tier = material === "netherite" ? "netherite" : material === "wood" ? "wooden" : material === "gold" ? "golden" : material === "stone" ? "stone" : material === "diamond" || material === "crystal" ? "diamond" : "iron";
  if (kind === "hammer") return `${tier}_axe`;
  if (kind === "scythe") return `${tier}_hoe`;
  if (kind === "chainsaw" || kind === "circularsaw") return `${tier}_axe`;
  if (kind === "spell_sword" || kind === "cursed_blade" || kind === "blood_sword") return `${tier}_sword`;
  if (kind === "enchanted_axe" || kind === "blood_axe") return `${tier}_axe`;
  if (kind === "soul_reaper") return `${tier}_hoe`;
  if (kind === "shadow_dagger") return `${tier}_sword`;
  if (kind === "grimoire") return "enchanted_book";
  if (kind === "magic_circle") return "paper";
  if (kind === "assault_rifle" || kind === "sniper_rifle" || kind === "shotgun") return "crossbow";
  if (kind === "pistol") return "crossbow";
  if (kind === "railgun") return "trident";
  if (kind === "relic") return "paper";
  if (kind === "spear") return "trident";
  if (kind === "mace") return `${tier}_axe`;
  if (kind === "drill" || kind === "jackhammer") return `${tier}_pickaxe`;
  if (kind === "nailgun") return "crossbow";
  if (kind === "flamethrower") return "flint_and_steel";
  return `${tier}_${kind}`;
}

export function generateModel(tags: string[], settings: GenerationSettings = DEFAULT_SETTINGS, variation = 0, texture?: ModelTexture | null): VoxelModel {
  tags = normalizeTags(tags);
  const analysis = settings.design ? analysisFromDesign(settings.design, settings) : analyzePrompt(tags, settings);
  const blueprint = analysis.blueprint;
  if (!blueprint.kind) throw new PromptError("対応する形状が見つかりません。剣・弓・ピッケルなどの形状を指定してください。未対応の語は下の解析結果で確認できます。");
  const kind = blueprint.kind;
  const extras = normalizeExtras(settings.extras);
  const seed = hashString(JSON.stringify({ blueprint, resolution: settings.resolution, variation, extras: hasExtras(settings.extras) ? extras : null, texture: texture?.source ? hashString(texture.source) : null }));
  const palette = texture?.kind === "atlas" && texture.palette?.length === 8 ? [...texture.palette] : applyAccent([...blueprint.colors], extras.accent);
  if (texture?.kind === "atlas") analysis.warnings.push("画像のUV割り当てを使用中のため、色タグは画像の色を変更しません。");
  const gradient = settings.gradient;
  if (gradient?.enabled) {
    const [from, to] = gradient.colors;
    const blend = (c1: string, c2: string, t: number) => "#" + [1, 3, 5].map(offset => {
      const a = parseInt(c1.slice(offset, offset + 2), 16), b = parseInt(c2.slice(offset, offset + 2), 16);
      return Math.round(a + (b - a) * t).toString(16).padStart(2, "0");
    }).join("");
    palette.forEach((color, i) => {
      const t = gradient.direction === "horizontal" ? i / 7 : gradient.direction === "radial" ? Math.abs(i - 3.5) / 3.5 : i / 7;
      palette[i] = blend(from, to, Math.min(1, t * gradient.intensity + (1 - gradient.intensity) * (i / 7)));
    });
  }
  const cubes: VoxelCube[] = [];
  const high = blueprint.detail === "high";
  const detailed = blueprint.detail !== "low";
  const glowing = blueprint.glow === true;
  const add = (name: string, from: Vec3, to: Vec3, color: number, glow = false) => cubes.push({ name, from, to, color, ...(glow ? { glow: true } : {}) });
  const box = (name: string, x: number, y: number, z: number, w: number, h: number, d: number, color: number, glow = false) => add(name, [x, y, z], [x + w, y + h, z + d], color, glow);
  let variants: ModelVariant[] | undefined;
  const builder = ITEM_BUILDERS[kind];
  if (builder) {
    const built = builder({ detailed, high, glowing, seed });
    cubes.push(...built.cubes);
    variants = built.variants;
  }

  if (kind === "chest") {
    box("chest_base", 2, 1, 3, 12, 7, 10, 2);
    box("chest_lid", 2, 8.1, 3, 12, 2.7, 10, 0);
    box("lid_top", 2.7, 10.8, 3.6, 10.6, .8, 8.8, 0);
    for (const x of [2, 12.8]) { box("iron_band", x, 1, 2.9, 1.2, 10, 10.2, 4); }
    box("bottom_rim", 2, .6, 2.8, 12, 1, 10.4, 3);
    box("lid_rim", 1.9, 7.8, 2.8, 12.2, .65, 10.4, 3);
    box("lock", 7, 6.5, 2.5, 2, 2.7, .5, 4);
    box("keyhole", 7.7, 7.2, 2.35, .6, 1, .15, 6);
    if (detailed) {
      for (let y = 2.4; y < 7.7; y += 1.8) box("plank_seam", 3.2, y, 2.96, 9.6, .12, .08, 3);
      for (const x of [2.35, 13.15]) for (const y of [2, 7, 9.5]) box("rivet", x, y, 2.7, .5, .5, .2, 1);
    }
    if (high) for (let x = 4; x < 12; x += 2) box("lid_grain", x, 10.79, 4, .12, .08, 8, 2);
  }

  if (kind === "mushroom") {
    box("forest_floor", 2, 0, 2, 12, .7, 12, 6);
    box("stem", 6, .7, 6, 4, 7, 4, 4);
    box("stem_light", 6, 1, 5.92, 1.1, 6.5, .1, 1);
    box("cap_bottom", 2, 7, 2, 12, 2, 12, 2);
    box("cap_middle", 3, 9, 3, 10, 2.5, 10, 0);
    box("cap_top", 5, 11.5, 5, 6, 1.5, 6, 0);
    if (detailed) {
      for (const [x, y, z, w, d] of [[4, 11.5, 4, 2, 2], [8, 13, 6, 2, 2], [9, 11.5, 9, 2, 2], [3, 9, 8, 2, 2], [8, 9, 2, 2, .12]]) box("cap_spot", x, y, z, w, .16, d, 1);
      box("front_spot", 4, 9.2, 2.87, 2, 1.5, .14, 1);
      box("front_spot", 9, 7.5, 1.87, 2, 1, .14, 1);
      for (const [x, z] of [[3, 4], [11, 10], [4, 11]]) box("moss", x, .7, z, 1.8, .3, 1.8, 3);
    }
    if (high) { box("tiny_stem", 12, .7, 3, 1, 2, 1, 4); box("tiny_cap", 11, 2.7, 2, 3, 1, 3, 0); }
  }

  if (kind === "lantern") {
    box("foot", 3.5, 0, 3.5, 9, 1.2, 9, 6);
    box("base", 4, 1.2, 4, 8, 1.3, 8, 3);
    box("light", 5, 2.5, 5, 6, 7, 6, 1, true);
    for (const x of [4, 11]) for (const z of [4, 11]) box("frame", x, 2.5, z, 1, 7.5, 1, 5);
    box("top_rim", 3.7, 9.6, 3.7, 8.6, 1, 8.6, 3);
    box("roof", 4.7, 10.6, 4.7, 6.6, 1.2, 6.6, 6);
    box("roof_top", 6, 11.8, 6, 4, 1, 4, 5);
    for (const x of [6.2, 9]) box("handle", x, 12.6, 7.5, .8, 2.6, 1, 5);
    box("handle_top", 6.2, 15.2, 7.5, 3.6, .8, 1, 5);
    if (detailed) for (const y of [3.5, 8.4]) { box("frame_cross", 4, y, 3.85, 8, .45, .3, 4); box("frame_cross", 3.85, y, 4, .3, .45, 8, 4); }
    if (high) box("light_center", 6.5, 3.5, 4.88, 3, 5, .12, 7, true);
  }

  if (kind === "crystal") {
    box("stone_base", 2, 0, 3, 12, 1.3, 10, 6);
    box("stone_top", 3, 1.3, 4, 10, .7, 8, 3);
    const shards = [[6, 5, 4, 11], [3, 6, 3, 6], [10, 7, 3, 8], [6, 10, 2, 5]];
    for (const [x, z, width, height] of shards) {
      box("crystal_core", x, 2, z, width, height - 2, width, 0, glowing);
      box("crystal_light", x, 2, z - .05, width * .3, height - 2, .1, 1, glowing);
      box("crystal_edge", x + width * .75, 2, z, width * .25, height - 2, width, 2);
      box("crystal_tip", x + .5, height, z + .5, width - 1, 1.5, width - 1, 1, glowing);
      if (width > 2) box("crystal_point", x + 1, height + 1.5, z + 1, width - 2, 1, width - 2, 1, glowing);
      if (high) box("crystal_facet", x + .5, 4, z - .12, 1, 1, .1, 7, glowing);
    }
  }

  if (kind === "tree") {
    box("grass", 1, 0, 1, 14, .7, 14, 3);
    box("trunk", 6.5, .7, 6.5, 3, 7, 3, 5);
    box("leaves_bottom", 3, 6, 3, 10, 3, 10, 2);
    box("leaves_middle", 2, 9, 2, 12, 3, 12, 0);
    box("leaves_top", 4, 12, 4, 8, 2.5, 8, 0);
    box("leaves_crown", 6, 14.5, 6, 4, 1.5, 4, 1);
    if (detailed) for (const [x, y, z] of [[2, 9, 4], [9, 12, 4], [4, 12, 9], [4, 6, 3]]) box("leaf_detail", x, y, z, 3, .5, 3, 1);
    if (high) { box("root", 5.5, .7, 6, 5, .5, 4, 5); box("branch", 9, 5, 7, 2, 1, 1, 5); }
  }

  if (kind === "house") {
    box("foundation", 1, 0, 1, 14, 1, 14, 6);
    box("walls", 2, 1, 2, 12, 8, 12, 1);
    for (const x of [2, 13]) for (const z of [2, 13]) box("wall_beam", x, 1, z, 1, 8, 1, 5);
    for (let y = 9; y < 15; y++) { const inset = y - 9; box("roof", 1 + inset, y, 1, 14 - inset * 2, 1, 14, y % 2 ? 2 : 3); }
    box("door", 6.3, 1, 1.85, 3.4, 5.7, .2, 5);
    box("doorknob", 8.7, 3.5, 1.55, .45, .45, .3, 4);
    if (detailed) { for (const x of [3, 10]) { box("window_frame", x, 4, 1.75, 3, 3, .3, 3); box("glass", x + .4, 4.4, 1.6, 2.2, 2.2, .15, 0); } box("chimney", 10, 10, 9, 2, 5, 2, 6); }
    if (high) box("step", 5, .6, .1, 6, .7, 1.8, 5);
  }

  if (kind === "robot") {
    for (const x of [4, 9]) { box("foot", x, 0, 5, 3, 1.8, 5, 6); box("leg", x + .5, 1.8, 6, 2, 3, 2, 3); }
    box("body", 4, 4.8, 5, 8, 5.5, 6, 0);
    box("chest_panel", 6, 6.3, 4.8, 4, 2.5, .25, 3);
    box("power_light", 7, 7, 4.5, 2, 1, .3, 1, true);
    box("neck", 6.5, 10.3, 6.5, 3, .8, 3, 6);
    box("head", 3.5, 11.1, 4.5, 9, 4, 7, 0);
    box("face", 4.5, 11.8, 4.3, 7, 2.5, .25, 6);
    for (const x of [5.2, 9]) box("eye", x, 12.7, 4.1, 1.8, .8, .2, 1, true);
    for (const x of [1.8, 12.2]) { box("arm", x, 5.5, 6, 2, 4, 3, 2); box("hand", x, 4.4, 5.6, 2, 1.7, 3.8, 3); }
    if (detailed) { box("antenna", 7.7, 15.1, 7.7, .6, .5, .6, 4); for (const x of [5, 10]) box("bolt", x, 9.2, 4.75, .6, .6, .25, 1); }
    if (high) for (let x = 6; x < 10; x++) box("vent", x, 5.5, 4.85, .4, .4, .2, 6);
  }
  const info = KIND_INFO[kind];
  const materialLabel = { crystal: "結晶", diamond: "ダイヤ", iron: "鉄", netherite: "ネザライト", wood: "木", gold: "金", stone: "石" }[blueprint.material];
  const shapeLabel = blueprint.profile === "katana" && kind === "sword" ? "刀" : blueprint.profile === "dagger" && kind === "sword" ? "短剣" : blueprint.profile === "broad" && kind === "sword" ? "大剣" : blueprint.profile === "spear" && kind === "trident" ? "槍" : info.label;
  const name = `${blueprint.color ? blueprint.color + "の" : ""}${materialLabel}の${shapeLabel}`;
  const shaped = applyShape(cubes, blueprint);
  // Decorations are built from the final, scaled body so they always sit on the model they belong to.
  const builtCubes = [...shaped, ...buildDecor(shaped, extras.decor, blueprint.detail, extras.accent)];
  if (variants) variants = variants.map(variant => { const body = applyShape(variant.cubes, blueprint); return { ...variant, cubes: [...body, ...buildDecor(body, extras.decor, blueprint.detail, extras.accent)] }; });
  return {
    name, slug: `${kind}_${seed.toString(16).slice(0, 8)}`, kind, cubes: builtCubes, palette, resolution: texture?.width ?? settings.resolution, seed, textureSeed: hashString(JSON.stringify({ blueprint, resolution: settings.resolution, variation })), matched: true,
    pose: info.pose, baseItem: baseItemFor(kind, blueprint.material), ...(variants ? { variants } : {}), analysis, ...(hasExtras(settings.extras) ? { extras } : {}),
    ...(texture?.kind === "atlas" ? { texture } : {}),
  };
}

/** A voxelized 2D texture keeps its own image and references exact pixel rects, so no atlas is needed. */
export function modelFromSprite(options: {
  name: string; slugSeed: string; cubes: VoxelCube[]; palette: string[]; texture: ModelTexture; tags: string[]; baseItem?: string;
}): VoxelModel {
  const kind = kindFromTags(options.tags) ?? "crystal";
  const seed = hashString(options.slugSeed);
  return {
    name: options.name, slug: `sprite_${seed.toString(16).slice(0, 6)}`, kind, cubes: options.cubes, palette: options.palette,
    resolution: options.texture.width, seed, matched: false, pose: "sprite",
    baseItem: options.baseItem ?? "paper", texture: { ...options.texture, palette: [...options.palette] },
  };
}

export const INITIAL_MODEL = generateModel(DEFAULT_TAGS, DEFAULT_SETTINGS);

// ---------------------------------------------------------------------------------------------
// Minecraft / Blockbench output
// ---------------------------------------------------------------------------------------------
export const poseOf = (model: VoxelModel): Pose => model.pose ?? "decor";
/** Tools, weapons and bows are authored upright and tilted at export, like vanilla handheld sprites. */
export const isTilted = (pose: Pose) => pose === "handheld" || pose === "bow";
export const textureWidth = (model: VoxelModel) => model.texture?.width ?? model.resolution;
export const textureHeight = (model: VoxelModel) => model.texture?.height ?? model.resolution;
export const kindFromTags = (tags: string[]): ModelKind | null => {
  return analyzePrompt(tags, DEFAULT_SETTINGS).blueprint.kind;
};
export const baseItemOf = (model: VoxelModel) => model.baseItem ?? "paper";
/** Stage -1 (or models without variants) returns the idle cubes. */
export const cubesOf = (model: VoxelModel, stage = -1): VoxelCube[] => (stage >= 0 && model.variants?.[stage] ? model.variants[stage].cubes : model.cubes);
export const modelAtStage = (model: VoxelModel, stage: number): VoxelModel => (stage >= 0 && model.variants?.[stage] ? { ...model, cubes: model.variants[stage].cubes } : model);

const round = (value: number) => Math.round(value * 1000) / 1000;
const jitter = (a: number, b: number, c: number, k: number) => Math.abs(Math.sin(a * 12.9898 + b * 78.233 + c * 37.719 + k) * 43758.5453) % 1;
/** UV rectangle on the 4 × 2 tile atlas. `space` is the UV space size (16 for Minecraft, texture px for Blockbench). */
export interface UvGrid { cols: number; rows: number; slots?: number[] }
export const gridOf = (model: VoxelModel): UvGrid => ({ cols: model.texture?.cols ?? ATLAS_GRID.cols, rows: model.texture?.rows ?? ATLAS_GRID.rows, slots: model.texture?.slots });
/**
 * UV rect for one face. Voxelized sprites carry an explicit rect sampling their own source pixel;
 * everything else lands inside the material tile for its color slot, with a stable per-cube offset.
 */
export function faceUv(cube: VoxelCube, face: FaceName, spaceX = 16, spaceY = spaceX, grid: UvGrid = ATLAS_GRID): [number, number, number, number] {
  if (cube.tint) return [0, 0, spaceX, spaceY];
  const override = cube.uv?.[face];
  if (override) return [round(override[0] * spaceX / 16), round(override[1] * spaceY / 16), round(override[2] * spaceX / 16), round(override[3] * spaceY / 16)];
  const [x1, y1, z1] = cube.from, [x2, y2, z2] = cube.to;
  const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
  const [fw, fh] = face === "north" || face === "south" ? [dx, dy] : face === "east" || face === "west" ? [dz, dy] : [dx, dz];
  const kx = spaceX / 16, ky = spaceY / 16, tw = spaceX / grid.cols, th = spaceY / grid.rows;
  const padX = .2 * kx, padY = .2 * ky;
  const w = Math.max(.3 * kx, Math.min(fw * kx, tw - 2 * padX));
  const h = Math.max(.3 * ky, Math.min(fh * ky, th - 2 * padY));
  const slot = grid.slots?.[cube.color] ?? cube.color;
  const u0 = (slot % grid.cols) * tw + padX + (tw - 2 * padX - w) * jitter(x1, y1, z1, 1);
  const v0 = Math.floor(slot / grid.cols) * th + padY + (th - 2 * padY - h) * jitter(z1, x1, y1, 2);
  return [round(u0), round(v0), round(u0 + w), round(v0 + h)];
}

const DISPLAY_FLAT = { translation: [0, 0, 0], scale: [1, 1, 1] };
/** Display transforms copied from vanilla `item/handheld`, `item/bow`, `item/generated` and `block/block`. */
export function displayFor(pose: Pose) {
  if (pose === "sprite") {
    return {
      gui: { rotation: [0, 0, 0], ...DISPLAY_FLAT },
      ground: { rotation: [0, 0, 0], translation: [0, 2, 0], scale: [.5, .5, .5] },
      head: { rotation: [0, 180, 0], translation: [0, 13, 7], scale: [1, 1, 1] },
      fixed: { rotation: [0, 180, 0], ...DISPLAY_FLAT },
      thirdperson_righthand: { rotation: [0, 0, 0], translation: [0, 3, 1], scale: [.55, .55, .55] },
      thirdperson_lefthand: { rotation: [0, 0, 0], translation: [0, 3, 1], scale: [.55, .55, .55] },
      firstperson_righthand: { rotation: [0, -90, 25], translation: [1.13, 3.2, 1.13], scale: [.68, .68, .68] },
      firstperson_lefthand: { rotation: [0, 90, -25], translation: [1.13, 3.2, 1.13], scale: [.68, .68, .68] },
    };
  }
  if (pose === "handheld" || pose === "bow") {
    const bow = pose === "bow";
    return {
      gui: { rotation: [0, 0, 0], ...DISPLAY_FLAT },
      ground: { rotation: [0, 0, 0], translation: [0, 2, 0], scale: [.5, .5, .5] },
      head: { rotation: [0, 180, 0], translation: [0, 13, 7], scale: [1, 1, 1] },
      fixed: { rotation: [0, 180, 0], ...DISPLAY_FLAT },
      thirdperson_righthand: bow ? { rotation: [-80, 260, -40], translation: [-1, -2, 2.5], scale: [.9, .9, .9] } : { rotation: [0, -90, 55], translation: [0, 4, .5], scale: [.85, .85, .85] },
      thirdperson_lefthand: bow ? { rotation: [-80, -280, 40], translation: [-1, -2, 2.5], scale: [.9, .9, .9] } : { rotation: [0, 90, -55], translation: [0, 4, .5], scale: [.85, .85, .85] },
      firstperson_righthand: { rotation: [0, -90, 25], translation: [1.13, 3.2, 1.13], scale: [.68, .68, .68] },
      firstperson_lefthand: { rotation: [0, 90, -25], translation: [1.13, 3.2, 1.13], scale: [.68, .68, .68] },
    };
  }
  return {
    gui: { rotation: [30, 225, 0], translation: [0, 0, 0], scale: [.625, .625, .625] },
    ground: { rotation: [0, 0, 0], translation: [0, 3, 0], scale: [.25, .25, .25] },
    fixed: { rotation: [0, 0, 0], translation: [0, 0, 0], scale: [.5, .5, .5] },
    thirdperson_righthand: { rotation: [75, 45, 0], translation: [0, 2.5, 0], scale: [.375, .375, .375] },
    firstperson_righthand: { rotation: [0, 45, 0], translation: [0, 0, 0], scale: [.4, .4, .4] },
    firstperson_lefthand: { rotation: [0, 225, 0], translation: [0, 0, 0], scale: [.4, .4, .4] },
  };
}
/** Handheld/bow items are authored upright and tilted -45° around the model center at export time. */
export const TILT = -45;

export function modelDisplay(model: VoxelModel, stage = -1) {
  const display = displayFor(poseOf(model));
  if (poseOf(model) === "decor") return display;
  const points = cubesOf(model, stage).flatMap(cube => {
    const points: Vec3[] = [];
    for (const x of [cube.from[0], cube.to[0]]) for (const y of [cube.from[1], cube.to[1]]) for (const z of [cube.from[2], cube.to[2]]) {
      const c = Math.SQRT1_2;
      points.push(isTilted(poseOf(model)) ? [8 + (x - 8) * c + (y - 8) * c, 8 - (x - 8) * c + (y - 8) * c, z] : [x, y, z]);
    }
    return points;
  });
  const size = Math.max(...[0, 1].map(axis => Math.max(...points.map(point => point[axis])) - Math.min(...points.map(point => point[axis]))));
  const scale = Math.min(1, 15 / Math.max(1, size));
  const center = [0, 1, 2].map(axis => (Math.max(...points.map(point => point[axis])) + Math.min(...points.map(point => point[axis]))) / 2);
  const translation = center.map(value => (8 - value) * scale);
  return { ...display, gui: { rotation: [0, 0, 0], translation, scale: [scale, scale, scale] } };
}

export function getModelSize(model: VoxelModel) {
  return (new TextEncoder().encode(JSON.stringify(toMinecraftJson(model))).byteLength / 1024).toFixed(1);
}
export function textureRef(model: VoxelModel) { return `${NAMESPACE}:item/${model.slug}`; }

export function toMinecraftJson(model: VoxelModel, stage = -1) {
  const pose = poseOf(model);
  const tilted = isTilted(pose);
  const grid = gridOf(model);
  return {
    credit: "Created with VoxelForge",
    texture_size: [textureWidth(model), textureHeight(model)],
    ambientocclusion: !tilted,
    gui_light: tilted || pose === "sprite" ? "front" : "side",
    textures: { "0": textureRef(model), particle: "#0", ...tintTextureVariables(model) },
    elements: cubesOf(model, stage).map(cube => ({
      name: cube.name, from: cube.from, to: cube.to,
      ...(tilted ? { rotation: { angle: TILT, axis: "z", origin: [8, 8, 8] } } : {}),
      ...(cube.glow ? { light_emission: 15 } : {}),
      faces: Object.fromEntries(FACES.map(face => [face, { uv: faceUv(cube, face, 16, 16, grid), texture: cube.tint ? `#${tintKey(cube.tint)}` : "#0" }])),
    })),
    display: modelDisplay(model, stage),
  };
}
export function toBlockbenchJson(model: VoxelModel, textureSource: string, stage = -1) {
  const pose = poseOf(model);
  const tilted = isTilted(pose);
  const grid = gridOf(model);
  const width = textureWidth(model), height = textureHeight(model);
  const colorTextures = accentEntries(model);
  const elements = cubesOf(model, stage).map(cube => ({
    name: cube.name, type: "cube", uuid: crypto.randomUUID(), from: cube.from, to: cube.to,
    origin: [8, 8, 8], rotation: [0, 0, tilted ? TILT : 0], color: cube.color % 8, export: true, visibility: true, box_uv: false,
    faces: Object.fromEntries(FACES.map(face => [face, { uv: faceUv(cube, face, cube.tint ? 16 : width, cube.tint ? 16 : height, grid), texture: bbFaceTexture(cube, colorTextures) }])),
  }));
  return {
    meta: { format_version: "5.0", model_format: "java_block", box_uv: false },
    name: model.name, model_identifier: model.slug,
    resolution: { width, height },
    elements, groups: [], outliner: elements.map(element => element.uuid),
    textures: [{ uuid: crypto.randomUUID(), id: "0", name: `${model.slug}.png`, width, height, uv_width: width, uv_height: height, source: textureSource, internal: true, mode: "bitmap", saved: false, namespace: NAMESPACE, folder: "item" }, ...bbTintTextures(model)],
    animations: [], display: modelDisplay(model, stage),
  };
}
/** 1.21.4+ client item definition (assets/<namespace>/items/<id>.json). Bows get the vanilla draw animation. */
export function itemDefinition(model: VoxelModel) {
  const base = textureRef(model);
  const single = (id: string) => ({ type: "minecraft:model", model: id });
  if (poseOf(model) === "bow" && model.variants?.length === 3) {
    return {
      model: {
        type: "minecraft:condition", property: "minecraft:using_item",
        on_false: single(base),
        on_true: {
          type: "minecraft:range_dispatch", property: "minecraft:use_duration", scale: .05,
          entries: [{ threshold: .65, model: single(`${base}_pulling_1`) }, { threshold: .9, model: single(`${base}_pulling_2`) }],
          fallback: single(`${base}_pulling_0`),
        },
      },
    };
  }
  return { model: single(base) };
}
export function giveCommand(model: VoxelModel) {
  return `/give @p minecraft:${baseItemOf(model)}[minecraft:item_model="${NAMESPACE}:${model.slug}"]`;
}

/** Palette color to Minecraft text color name. */
function minecraftColorName(hex: string): string {
  const c = hex.toLowerCase();
  if (c.includes("4f") || c.includes("66e") || c.includes("76b")) return "aqua";
  if (c.includes("c2") || c.includes("b99") || c.includes("986")) return "light_purple";
  if (c.includes("6f") || c.includes("5bd") || c.includes("3a9")) return "green";
  if (c.includes("e0") || c.includes("f2c") || c.includes("dcb")) return "gold";
  if (c.includes("d6") || c.includes("ffcad")) return "red";
  if (c.includes("665") || c.includes("4a3")) return "dark_gray";
  if (c.includes("c7c") || c.includes("eef")) return "white";
  return "yellow";
}

/**
 * Production-ready /give command for Minecraft Java 1.21.4 with custom name, lore and unbreakable tag.
 * Players or server admins can copy-paste this straight into chat or command blocks.
 */
export function fancyGiveCommand(model: VoxelModel) {
  const color = minecraftColorName(model.palette[0] || "#ffffff");
  const baseItem = baseItemOf(model);
  const decorCount = model.cubes.filter(c => c.group === "decor").length;
  const decorText = decorCount > 0 ? `装飾: ${decorCount}パーツ` : "装飾: シンプル";
  const typeText = KIND_INFO[model.kind]?.label ?? "アイテム";
  const nameJson = JSON.stringify({ text: model.name, color, bold: true, italic: false });
  const quote = (value: string) => "'" + value.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
  const loreList = [
    JSON.stringify({ text: "✦ VoxelForge 3D Model", color: "gray", italic: true }),
    JSON.stringify({ text: `種別: ${typeText} · ${decorText}`, color: "dark_purple", italic: false }),
    JSON.stringify({ text: "Minecraft Java 1.21.4 対応", color: "dark_aqua", italic: false }),
  ];

  return `/give @p minecraft:${baseItem}[minecraft:item_model="${NAMESPACE}:${model.slug}",minecraft:custom_name=${quote(nameJson)},minecraft:lore=[${loreList.map(quote).join(",")}],minecraft:unbreakable={}]`;
}
