// ============================================================================
// VOXELFORGE — .bbmodel (Blockbench 4.5) exporter + procedural texture atlas
// ============================================================================
import type { GeneratedModel, VoxelPart } from "./spec-engine";
import { effectiveTextureNoise } from "./spec-engine";
import { mulberry32 } from "./spec-rng";
import type { ModelSpec, TexturePattern } from "./spec-catalog";

// --- Texture atlas builder (runs in browser canvas) -------------------------

function applyPattern(ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  x0: number, y0: number, tile: number, r: number, g: number, b: number,
  rand: () => number, noise: number, pattern: TexturePattern, spec: ModelSpec) {
  for (let y = 0; y < tile; y++) {
    for (let x = 0; x < tile; x++) {
      let f = 1;
      switch (pattern) {
        case "brick": {
          const isMortar = y === 0 || y === 8 || (y < 8 && x === 0) || (y >= 8 && x === 8);
          f = isMortar ? 0.8 : 1 + (rand() * 2 - 1) * 0.15 * noise;
          break;
        }
        case "gradient":
          f = 0.85 + (y / tile) * 0.3 + (rand() * 2 - 1) * 0.1 * noise;
          break;
        case "checker":
          f = ((x + y) % 2 === 0) ? 1 + 0.08 * noise : 1 - 0.08 * noise;
          f += (rand() * 2 - 1) * 0.05 * noise;
          break;
        case "crosshatch": {
          const line = ((x + y) % 4 === 0) || ((x - y + tile) % 4 === 0);
          f = line ? 1 - 0.15 * noise : 1 + (rand() * 2 - 1) * 0.1 * noise;
          break;
        }
        case "radial": {
          const dx = x / tile - 0.5, dy = y / tile - 0.5;
          const d = Math.sqrt(dx * dx + dy * dy) * 2;
          f = 1.15 - d * 0.35 + (rand() * 2 - 1) * 0.08 * noise;
          break;
        }
        case "stripe":
          f = 0.85 + ((x + y * 0.3) % 6 < 3 ? 0.25 : 0) + (rand() * 2 - 1) * 0.08 * noise;
          break;
        case "bloodDrip": {
          const drip = Math.sin((x / tile) * Math.PI * 4) * 0.15 + y / tile;
          f = 0.75 + drip * 0.4 + (rand() * 2 - 1) * 0.1 * noise;
          break;
        }
        case "metallic": {
          const band = Math.abs(Math.sin((y / tile) * Math.PI * 3));
          f = 0.7 + band * 0.45 + (rand() * 2 - 1) * 0.06 * noise;
          break;
        }
        case "flow": {
          const w = Math.sin((x + y * 2) / tile * Math.PI * 3);
          f = 0.9 + w * 0.2 + (rand() * 2 - 1) * 0.08 * noise;
          break;
        }
        case "dual":
          f = (x < tile / 2 ? 0.85 : 1.12) + (rand() * 2 - 1) * 0.08 * noise;
          break;
        default: // noise
          f = 1 + (rand() * 2 - 1) * 0.22 * noise;
          break;
      }
      const rr = Math.min(255, Math.max(0, Math.round(r * f)));
      const gg = Math.min(255, Math.max(0, Math.round(g * f)));
      const bb = Math.min(255, Math.max(0, Math.round(b * f)));
      ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
      ctx.fillRect(x0 + x, y0, 1, 1);
    }
  }
}

export function buildTextureCanvas(spec: ModelSpec, palette: string[]): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const tile = 16;
  canvas.width = tile * palette.length;
  canvas.height = tile;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(spec.seed ^ 0x9e3779b9);
  const noise = effectiveTextureNoise(spec);
  const pattern = spec.texturePattern ?? "noise";

  palette.forEach((hex, i) => {
    const n = parseInt(hex.replace("#", ""), 16);
    applyPattern(ctx, i * tile, 0, tile, (n >> 16) & 255, (n >> 8) & 255, n & 255, rand, noise, pattern, spec);
  });
  return canvas;
}

// --- .bbmodel builder -------------------------------------------------------

function uuid(): string { return crypto.randomUUID(); }

const TILE_PX = 16;

const GROUP_ORDER = ["root", "blade", "head", "wings", "floating", "particles", "aura", "trail", "mode", "phantom", "circle"] as const;
const GROUP_COLORS: Record<string, string> = {
  root: "#8a8f98", blade: "#4aa1ff", head: "#c08aff", wings: "#ff7a9e",
  floating: "#ffb347", particles: "#6ee06a", aura: "#e06aff", trail: "#6adfff", mode: "#ff5050", phantom: "#8afff0", circle: "#ffe08a",
};

function facesForTile(tileIndex: number): Record<string, unknown> {
  const u0 = tileIndex * TILE_PX;
  const face = { uv: [u0, 0, u0 + TILE_PX, TILE_PX], texture: 0, enabled: true };
  return { north: { ...face }, east: { ...face }, south: { ...face }, west: { ...face }, up: { ...face }, down: { ...face } };
}

interface Kf { channel: "rotation" | "position" | "scale"; times: number[]; values: [number, number, number][]; interpolation: "linear" | "catmullrom" | "step"; }

function keyframesFor(kfs: Kf[]): unknown[] {
  return kfs.map((kf) => ({
    channel: kf.channel,
    data_points: kf.times.map((t, i) => ({ x: kf.values[i][0], y: kf.values[i][1], z: kf.values[i][2], time: t, uuid: uuid() })),
    uuid: uuid(), color: "#ffda5a", interpolation: kf.interpolation,
  }));
}

export function buildBbModel(spec: ModelSpec, model: GeneratedModel): Record<string, unknown> {
  const texCanvas = buildTextureCanvas(spec, model.palette);
  const textureSource = texCanvas.toDataURL("image/png");

  const groupUuids = new Map<string, string>();
  for (const g of GROUP_ORDER) groupUuids.set(g, uuid());

  const elements = model.parts.map((p: VoxelPart) => ({
    uuid: uuid(), name: p.name, box_uv: true, type: "cube",
    from: p.from, to: p.to, origin: [0, 0, 0],
    faces: facesForTile(p.tile),
  }));

  const childrenByGroup = new Map<string, string[]>();
  for (const g of GROUP_ORDER) childrenByGroup.set(g, []);
  model.parts.forEach((p, i) => childrenByGroup.get(p.group)?.push(elements[i].uuid as string));

  const subGroups = GROUP_ORDER.filter((g) => g !== "root" && (childrenByGroup.get(g)?.length ?? 0) > 0).map((g) => ({
    uuid: groupUuids.get(g), name: g, origin: [0, 0, 0], rotation: [0, 0, 0],
    color: GROUP_COLORS[g] ?? "#8a8f98",
    children: childrenByGroup.get(g),
  }));

  const outliner = [
    { uuid: groupUuids.get("root"), name: "root", origin: [0, 0, 0], rotation: [0, 0, 0], color: "#8a8f98",
      children: [...childrenByGroup.get("root")!, ...subGroups.map((s) => s.uuid as string)] },
    ...subGroups,
  ];

  // ---- animations --------------------------------------------------------
  const animators: Record<string, unknown> = {};
  const has = (g: string) => (childrenByGroup.get(g)?.length ?? 0) > 0;
  const addKf = (group: string, kf: Kf) => { animators[groupUuids.get(group)!] = { name: group, type: "bone", keyframes: keyframesFor([kf]) }; };

  if (spec.animation === "spin") {
    if (has("floating")) addKf("floating", { channel: "rotation", times: [0, 1], values: [[0, 0, 0], [0, -360, 0]], interpolation: "linear" });
    if (has("particles")) addKf("particles", { channel: "rotation", times: [0, 1], values: [[0, 0, 0], [0, 360, 0]], interpolation: "linear" });
    if (has("aura")) addKf("aura", { channel: "rotation", times: [0, 1], values: [[0, 0, 0], [0, 360, 0]], interpolation: "linear" });
  }
  if (spec.animation === "bob") {
    if (has("floating")) addKf("floating", { channel: "position", times: [0, 0.5, 1], values: [[0, 0, 0], [0, 2, 0], [0, 0, 0]], interpolation: "catmullrom" });
    if (has("particles")) addKf("particles", { channel: "position", times: [0, 0.5, 1], values: [[0, 0, 0], [0, 3, 0], [0, 0, 0]], interpolation: "catmullrom" });
    if (has("blade")) addKf("blade", { channel: "position", times: [0, 0.5, 1], values: [[0, 0, 0], [0, 0.5, 0], [0, 0, 0]], interpolation: "catmullrom" });
    if (has("aura")) addKf("aura", { channel: "position", times: [0, 0.5, 1], values: [[0, 0, 0], [0, 1.5, 0], [0, 0, 0]], interpolation: "catmullrom" });
  }
  if (spec.animation === "sway") {
    if (has("blade")) addKf("blade", { channel: "rotation", times: [0, 0.5, 1], values: [[0, 0, -4], [0, 0, 4], [0, 0, -4]], interpolation: "catmullrom" });
    if (has("head")) addKf("head", { channel: "rotation", times: [0, 0.5, 1], values: [[0, 0, -3], [0, 0, 3], [0, 0, -3]], interpolation: "catmullrom" });
    if (has("wings")) addKf("wings", { channel: "rotation", times: [0, 0.5, 1], values: [[0, -10, 0], [0, 10, 0], [0, -10, 0]], interpolation: "catmullrom" });
    if (has("floating")) addKf("floating", { channel: "rotation", times: [0, 0.5, 1], values: [[0, 0, 0], [0, 180, 0], [0, 360, 0]], interpolation: "linear" });
  }
  if (spec.animation === "pulse") {
    if (has("floating")) animators[groupUuids.get("floating")!] = { name: "floating", type: "bone", keyframes: [...keyframesFor([{ channel: "scale", times: [0, 0.5, 1], values: [[1, 1, 1], [1.18, 1.18, 1.18], [1, 1, 1]], interpolation: "catmullrom" }]), ...keyframesFor([{ channel: "rotation", times: [0, 1], values: [[0, 0, 0], [0, -360, 0]], interpolation: "linear" }])] };
    if (has("particles")) addKf("particles", { channel: "scale", times: [0, 0.5, 1], values: [[1, 1, 1], [1.1, 1.1, 1.1], [1, 1, 1]], interpolation: "catmullrom" });
    if (has("aura")) addKf("aura", { channel: "scale", times: [0, 0.5, 1], values: [[1, 1, 1], [1.12, 1.12, 1.12], [1, 1, 1]], interpolation: "catmullrom" });
  }
  if (spec.animation === "breathe") {
    if (has("aura")) addKf("aura", { channel: "scale", times: [0, 0.3, 0.6, 1], values: [[1, 1, 1], [1.08, 1.08, 1.08], [1, 1, 1], [1, 1, 1]], interpolation: "catmullrom" });
    if (has("floating")) addKf("floating", { channel: "position", times: [0, 0.5, 1], values: [[0, 0, 0], [0, 1.5, 0], [0, 0, 0]], interpolation: "catmullrom" });
    if (has("particles")) addKf("particles", { channel: "scale", times: [0, 0.4, 1], values: [[0.9, 0.9, 0.9], [1.05, 1.05, 1.05], [0.9, 0.9, 0.9]], interpolation: "catmullrom" });
  }
  if (spec.animation === "thrum") {
    if (has("blade")) addKf("blade", { channel: "rotation", times: [0, 0.15, 0.3, 0.5], values: [[0, 0, 0], [0, 0, 1.5], [0, 0, -1.5], [0, 0, 0]], interpolation: "step" });
    if (has("head")) addKf("head", { channel: "rotation", times: [0, 0.15, 0.3, 0.5], values: [[0, 0, 0], [0, 0, 1], [0, 0, -1], [0, 0, 0]], interpolation: "step" });
    if (has("floating")) addKf("floating", { channel: "scale", times: [0, 0.2, 0.4, 0.6], values: [[1, 1, 1], [1.06, 1.06, 1.06], [0.94, 0.94, 0.94], [1, 1, 1]], interpolation: "step" });
  }
  if (spec.animation === "orbit") {
    if (has("floating")) addKf("floating", { channel: "rotation", times: [0, 1], values: [[0, 0, 0], [0, 360, 0]], interpolation: "linear" });
    if (has("circle")) addKf("circle", { channel: "rotation", times: [0, 1], values: [[0, 0, 0], [0, -360, 0]], interpolation: "linear" });
    if (has("phantom")) addKf("phantom", { channel: "rotation", times: [0, 1], values: [[0, 0, 0], [0, 360, 0]], interpolation: "linear" });
  }
  if (spec.animation === "flicker") {
    if (has("floating")) addKf("floating", { channel: "scale", times: [0, 0.1, 0.2, 0.3, 0.5], values: [[1, 1, 1], [1.2, 1.2, 1.2], [0.8, 0.8, 0.8], [1.15, 1.15, 1.15], [1, 1, 1]], interpolation: "step" });
    if (has("aura")) addKf("aura", { channel: "scale", times: [0, 0.15, 0.3], values: [[1, 1, 1], [1.25, 1.25, 1.25], [1, 1, 1]], interpolation: "step" });
  }
  if (spec.animation === "whirl") {
    if (has("blade")) addKf("blade", { channel: "rotation", times: [0, 1], values: [[0, 0, 0], [0, 360, 0]], interpolation: "linear" });
    if (has("floating")) addKf("floating", { channel: "rotation", times: [0, 1], values: [[0, 0, 0], [0, 720, 0]], interpolation: "linear" });
    if (has("wings")) addKf("wings", { channel: "rotation", times: [0, 1], values: [[0, 0, 0], [0, 360, 0]], interpolation: "linear" });
  }
  if (spec.animation === "slash") {
    if (has("blade")) addKf("blade", { channel: "rotation", times: [0, 0.2, 0.4, 0.6, 1], values: [[0, 0, 0], [0, 0, -25], [0, 0, 30], [0, 0, -8], [0, 0, 0]], interpolation: "catmullrom" });
    if (has("trail")) addKf("trail", { channel: "scale", times: [0, 0.3, 0.6, 1], values: [[1, 1, 1], [1.4, 1.4, 1.4], [1, 1, 1], [1, 1, 1]], interpolation: "catmullrom" });
  }
  if (has("circle") && spec.animation !== "none") {
    if (!animators[groupUuids.get("circle")!]) addKf("circle", { channel: "rotation", times: [0, 1], values: [[0, 0, 0], [0, 360, 0]], interpolation: "linear" });
  }

  const anims: Record<string, unknown>[] = [];
  if (Object.keys(animators).length > 0) {
    anims.push({ uuid: uuid(), name: `${spec.animation}_loop`, loop: "loop", length: 1,
      override: false, start_delay: 0, loop_delay: 0, blend_weight: 0, animators, sound_effects: [] });
  }

  // ---- attack swing ---------------------------------------------------------
  const atk: Record<string, unknown> = {};
  atk[groupUuids.get("root")!] = {
    name: "root", type: "bone",
    keyframes: keyframesFor([{ channel: "rotation", times: [0, 0.25, 0.45, 0.7, 1], values: [[0, 0, 0], [0, 0, -55], [0, 0, 60], [0, 0, -8], [0, 0, 0]], interpolation: "catmullrom" }]),
  };
  if (has("floating")) atk[groupUuids.get("floating")!] = { name: "floating", type: "bone", keyframes: keyframesFor([{ channel: "position", times: [0, 0.25, 0.45, 0.7, 1], values: [[0, 0, 0], [0, 2, 0], [0, 5, 0], [0, 2, 0], [0, 0, 0]], interpolation: "catmullrom" }]) };
  if (has("aura")) atk[groupUuids.get("aura")!] = { name: "aura", type: "bone", keyframes: keyframesFor([{ channel: "scale", times: [0, 0.25, 0.45, 0.7, 1], values: [[0.9, 0.9, 0.9], [1, 1, 1], [1.6, 1.6, 1.6], [1, 1, 1], [1, 1, 1]], interpolation: "catmullrom" }]) };
  if (has("particles")) atk[groupUuids.get("particles")!] = { name: "particles", type: "bone", keyframes: keyframesFor([{ channel: "scale", times: [0, 0.25, 0.45, 0.7, 1], values: [[0.7, 0.7, 0.7], [1, 1, 1], [1.7, 1.7, 1.7], [1, 1, 1], [1, 1, 1]], interpolation: "catmullrom" }]) };
  anims.push({ uuid: uuid(), name: "attack_swing", loop: "loop", length: 1,
    override: false, start_delay: 0, loop_delay: 0, blend_weight: 0, animators: atk, sound_effects: [] });

  // ---- cast release ---------------------------------------------------------
  const cst: Record<string, unknown> = {};
  cst[groupUuids.get("root")!] = {
    name: "root", type: "bone",
    keyframes: keyframesFor([{ channel: "rotation", times: [0, 0.4, 0.6, 1], values: [[0, 0, 0], [0, 0, 12], [0, 0, 6], [0, 0, 0]], interpolation: "catmullrom" }]),
  };
  if (has("floating")) cst[groupUuids.get("floating")!] = { name: "floating", type: "bone", keyframes: keyframesFor([{ channel: "position", times: [0, 0.5, 0.7, 1], values: [[0, 0, 0], [0, 3, 0], [0, 7, 0], [0, 0, 0]], interpolation: "catmullrom" }]) };
  if (has("aura")) cst[groupUuids.get("aura")!] = { name: "aura", type: "bone", keyframes: keyframesFor([{ channel: "scale", times: [0, 0.5, 0.7, 1], values: [[1, 1, 1], [0.7, 0.7, 0.7], [2.2, 2.2, 2.2], [1, 1, 1]], interpolation: "catmullrom" }]) };
  if (has("particles")) cst[groupUuids.get("particles")!] = { name: "particles", type: "bone", keyframes: keyframesFor([{ channel: "scale", times: [0, 0.5, 0.7, 1], values: [[1, 1, 1], [0.5, 0.5, 0.5], [2.5, 2.5, 2.5], [1, 1, 1]], interpolation: "catmullrom" }]) };
  anims.push({ uuid: uuid(), name: "cast_release", loop: "loop", length: 1,
    override: false, start_delay: 0, loop_delay: 0, blend_weight: 0, animators: cst, sound_effects: [] });

  return {
    meta: { format_version: "4.5", model_identifier: uuid(), box_uv: true, project_format: "free", created: new Date().toISOString() },
    name: spec.name,
    resolution: { width: TILE_PX, height: TILE_PX },
    elements, outliner,
    textures: [{ id: "0", uuid: uuid(), name: "voxelforge_palette", mode: "bitmap", width: texCanvas.width, height: texCanvas.height, source: textureSource }],
    animations: anims,
  };
}

export function downloadBbModel(spec: ModelSpec, model: GeneratedModel): void {
  const bb = buildBbModel(spec, model);
  const blob = new Blob([JSON.stringify(bb, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${spec.name.replace(/[^\w぀-ヿ一-龥-]+/g, "_") || "voxelforge_model"}.bbmodel`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}