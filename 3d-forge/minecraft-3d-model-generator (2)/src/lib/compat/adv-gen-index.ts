import { GeneratedModel, GeneratorConfig, VoxelElement } from "./adv-gen-types";
import { DEFAULT_CONFIG, THEME_PALETTES } from "./advanced-themes";
import { VoxelBuilder } from "./adv-voxel";
import { mulberry32 } from "./adv-color";
import { GenCtx, WEAPON_BUILDERS } from "./adv-gen-weapons";
import { ARMOR_BUILDERS } from "./adv-gen-armor";
import { RELIC_BUILDERS } from "./adv-gen-relics";
import { MACHINE_BUILDERS } from "./adv-gen-machines";
import { buildPartLibrary } from "./adv-gen-parts";
import { assignUVs, buildOrnaments } from "./adv-gen-ornaments";
import {
  buildLimitBreak,
  buildTacticalMode,
  buildTierAdditions,
  buildWeaponForm,
  partitionSplitBones,
  resolveModePalette,
  resolveTieredConfig,
} from "./adv-gen-evolution";

const ALL_BUILDERS: Record<string, ((ctx: GenCtx) => void) | undefined> = {
  ...WEAPON_BUILDERS,
  ...ARMOR_BUILDERS,
  ...RELIC_BUILDERS,
  ...MACHINE_BUILDERS,
};

/** Categories whose silhouette is machine-defined: skip blade-oriented morphs. */
const MACHINE_CATEGORIES = new Set([
  "chainsaw",
  "gun",
  "railgun",
  "crossbow",
]);

function applyScale(elements: VoxelElement[], scale: number): void {
  if (Math.abs(scale - 1) < 0.001) return;
  const ox = 8;
  const oz = 8;
  for (const el of elements) {
    el.from = [
      round(ox + (el.from[0] - ox) * scale),
      round(el.from[1] * scale),
      round(oz + (el.from[2] - oz) * scale),
    ];
    el.to = [
      round(ox + (el.to[0] - ox) * scale),
      round(el.to[1] * scale),
      round(oz + (el.to[2] - oz) * scale),
    ];
  }
}

const round = (v: number) => Math.round(v * 100) / 100;

function computeStats(elements: VoxelElement[]) {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  for (const el of elements) {
    minX = Math.min(minX, el.from[0], el.to[0]);
    minY = Math.min(minY, el.from[1], el.to[1]);
    minZ = Math.min(minZ, el.from[2], el.to[2]);
    maxX = Math.max(maxX, el.from[0], el.to[0]);
    maxY = Math.max(maxY, el.from[1], el.to[1]);
    maxZ = Math.max(maxZ, el.from[2], el.to[2]);
  }

  if (!elements.length) {
    return {
      elementCount: 0,
      estimatedTriangles: 0,
      size: [0, 0, 0] as [number, number, number],
      center: [8, 8, 8] as [number, number, number],
      radius: 10,
    };
  }

  const size: [number, number, number] = [
    Math.round((maxX - minX) * 10) / 10,
    Math.round((maxY - minY) * 10) / 10,
    Math.round((maxZ - minZ) * 10) / 10,
  ];
  const center: [number, number, number] = [
    Math.round(((minX + maxX) / 2) * 100) / 100,
    Math.round(((minY + maxY) / 2) * 100) / 100,
    Math.round(((minZ + maxZ) / 2) * 100) / 100,
  ];
  const radius =
    Math.max(
      Math.hypot(size[0], size[1]) / 2,
      Math.hypot(size[1], size[2]) / 2,
      Math.hypot(size[0], size[2]) / 2,
      6
    ) * 1.12;

  return {
    elementCount: elements.length,
    estimatedTriangles: elements.length * 12,
    size,
    center,
    radius: Math.round(radius * 10) / 10,
  };
}

export function generateModel(rawConfig: GeneratorConfig): GeneratedModel {
  const config: GeneratorConfig = { ...DEFAULT_CONFIG, ...rawConfig };
  const effectiveCfg = resolveTieredConfig(config);
  const basePalette = {
    ...THEME_PALETTES[config.theme],
    ...(config.customPalette || {}),
  };
  const palette = resolveModePalette(basePalette, effectiveCfg);

  const builder = new VoxelBuilder(palette);
  const rng = mulberry32(effectiveCfg.seed);

  const ctx: GenCtx = { cfg: effectiveCfg, palette, b: builder, rng };
  const build = ALL_BUILDERS[effectiveCfg.category];
  if (build) build(ctx);

  // Split left/right halves into articulated bone groups
  partitionSplitBones(builder.elements);

  const isMachine = MACHINE_CATEGORIES.has(effectiveCfg.category);

  // Tier IV/V structural additions & blade-based form morphs (melee/caster only)
  if (!isMachine) {
    buildTierAdditions(ctx);
    buildWeaponForm(ctx);
  }

  // Bolt-on modular parts, limit break rigs, tactical mode VFX, orbiting debris
  buildPartLibrary(ctx);
  buildLimitBreak(ctx);
  buildTacticalMode(ctx);
  buildOrnaments(ctx);

  const elements = builder.elements;
  applyScale(elements, effectiveCfg.overallScale);
  assignUVs(elements);

  return {
    config,
    palette,
    elements,
    stats: computeStats(elements),
  };
}
