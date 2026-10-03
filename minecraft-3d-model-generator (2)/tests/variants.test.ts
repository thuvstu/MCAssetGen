import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { ACTIONS, sampleAction } from "@/lib/animation/actions";
import { toBlockbench, toVariantPack } from "@/lib/export";
import { buildGeometry } from "@/lib/geometry";
import { generateModel } from "@/lib/model-generator";
import {
  DEFAULT_SETTINGS,
  MAX_TIER,
  TEMPLATES,
  type ModelSettings,
} from "@/lib/model-types";
import { presetsFor } from "@/lib/presets";
import { buildVariants } from "@/lib/variants";

const settingsFor = (
  overrides: Partial<ModelSettings> = {},
): ModelSettings => ({ ...DEFAULT_SETTINGS, ...overrides });
const cubesFor = (overrides: Partial<ModelSettings> = {}) =>
  buildGeometry(settingsFor(overrides));
const emissiveCount = (overrides: Partial<ModelSettings>) =>
  cubesFor(overrides).filter((cube) => cube.emissive).length;
const maxExtent = (overrides: Partial<ModelSettings>) =>
  Math.max(
    ...cubesFor(overrides).flatMap((cube) =>
      [...cube.from, ...cube.to].map(Math.abs),
    ),
  );

describe("upgrade tiers", () => {
  it("adds more ornaments with every tier", () => {
    const counts = Array.from(
      { length: MAX_TIER + 1 },
      (_, tier) => cubesFor({ tier }).length,
    );
    for (let i = 1; i < counts.length; i++)
      expect(counts[i]).toBeGreaterThan(counts[i - 1]);
  });

  it("keeps the body the same size as the tier grows", () => {
    const bodyHeight = (tier: number) => {
      const body = cubesFor({ tier }).filter((cube) => !cube.ornament);
      return (
        Math.max(...body.map((cube) => cube.to[1])) -
        Math.min(...body.map((cube) => cube.from[1]))
      );
    };
    expect(bodyHeight(5)).toBeCloseTo(bodyHeight(0), 3);
  });

  it("adds a floating halo from tier 4", () => {
    expect(
      cubesFor({ tier: 3 }).some((cube) => cube.name.startsWith("tier_halo")),
    ).toBe(false);
    expect(
      cubesFor({ tier: 4 }).filter(
        (cube) => cube.name.startsWith("tier_halo") && cube.layer === "floater",
      ),
    ).toHaveLength(6);
  });
});

describe("limit break, forms and modes", () => {
  it("limit break adds wings and glowing trim", () => {
    const cubes = cubesFor({ limitBreak: true });
    expect(
      cubes.filter((cube) => cube.name.startsWith("limit_wing")),
    ).toHaveLength(8);
    expect(emissiveCount({ limitBreak: true })).toBeGreaterThan(
      emissiveCount({}),
    );
  });

  it("limit break recolours the fallback palette gold", () => {
    expect(generateModel(settingsFor({ limitBreak: true })).palette[6]).toBe(
      "#f3c35a",
    );
  });

  it("sealed form removes glow and adds chains", () => {
    const sealed = cubesFor({ form: "sealed" });
    expect(
      sealed.filter((cube) => cube.name.startsWith("seal_chain")),
    ).toHaveLength(4);
    expect(
      sealed.filter((cube) => cube.emissive && !cube.ornament),
    ).toHaveLength(0);
  });

  it("released form stretches the head and adds spikes", () => {
    const released = cubesFor({ form: "released" });
    expect(
      released.filter((cube) => cube.name.startsWith("release_spike")),
    ).toHaveLength(6);
    // The body is refit to the same height, so the head takes a larger share.
    const tipShare = (cubes: typeof released) => {
      const blade = cubes.filter((cube) => cube.name.startsWith("blade_pixel"));
      const min = Math.min(...blade.map((cube) => cube.from[1]));
      const max = Math.max(...blade.map((cube) => cube.to[1]));
      return max - min;
    };
    expect(tipShare(released)).toBeGreaterThan(tipShare(cubesFor()));
  });

  it("overdrive ignites crystals and adds sparks", () => {
    expect(emissiveCount({ mode: "charged" })).toBeGreaterThan(
      emissiveCount({}) + 20,
    );
    expect(
      cubesFor({ mode: "charged" }).filter((cube) =>
        cube.name.startsWith("overdrive_spark"),
      ),
    ).toHaveLength(6);
  });

  it("keeps every combination inside the Java model range", () => {
    for (const template of TEMPLATES) {
      const extent = maxExtent({
        kind: template.kind,
        height: 40,
        width: 32,
        tier: 5,
        limitBreak: true,
        form: "released",
        mode: "charged",
        floaters: "swarm",
      });
      expect(extent).toBeLessThanOrEqual(23.5);
    }
  });
});

describe("actions", () => {
  it("starts and ends every motion at rest", () => {
    for (const action of Object.keys(ACTIONS) as (keyof typeof ACTIONS)[]) {
      const start = sampleAction(action, 0);
      expect(start.rotation).toEqual([0, 0, 0]);
      expect(start.position).toEqual([0, 0, 0]);
    }
  });

  it("interpolates between keyframes and wraps", () => {
    const mid = sampleAction("slash", 0.125);
    expect(mid.rotation[2]).toBeCloseTo(17.5, 5);
    expect(sampleAction("slash", 1.2 + 0.125).rotation[2]).toBeCloseTo(17.5, 5);
  });
});

describe("variant families", () => {
  const base = settingsFor({ name: "Blade" });

  it("builds six tiers with suffixed names", () => {
    const tiers = buildVariants(base, "tiers");
    expect(tiers.map((variant) => variant.settings.tier)).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
    expect(tiers[3].settings.name).toBe("Blade +3");
  });

  it("builds the same theme for every weapon type", () => {
    const theme = buildVariants(base, "theme");
    expect(theme.map((variant) => variant.settings.kind)).toEqual(
      TEMPLATES.map((template) => template.kind),
    );
    expect(new Set(theme.map((variant) => variant.settings.prompt)).size).toBe(
      1,
    );
  });

  it("gives overdrive a charge motion when none is set", () => {
    const [, charged] = buildVariants(base, "modes");
    expect(charged.settings.mode).toBe("charged");
    expect(charged.settings.action).toBe("charge");
  });

  it("combines every family with unique keys", () => {
    const all = buildVariants(base, "all");
    expect(all.length).toBe(13 + TEMPLATES.length);
    expect(new Set(all.map((variant) => variant.key)).size).toBe(all.length);
    for (const variant of all) expect(variant.key).toMatch(/^[a-z0-9_]+$/);
  });

  it("offers kind-specific skill presets", () => {
    expect(presetsFor("staff").some((preset) => preset.id === "meteor")).toBe(
      true,
    );
    expect(presetsFor("sword").some((preset) => preset.id === "meteor")).toBe(
      false,
    );
    expect(presetsFor("block").some((preset) => preset.id === "awaken")).toBe(
      true,
    );
  });
});

describe("animated Blockbench export", () => {
  it("exports the action on the root group in Generic Model format", () => {
    const project = toBlockbench(
      generateModel(settingsFor({ action: "slash" })),
    );
    expect(project.meta.model_format).toBe("free");
    const animation = project.animations[0] as {
      name: string;
      length: number;
      animators: Record<
        string,
        {
          keyframes: {
            channel: string;
            time: number;
            data_points: { x: number; y: number; z: number }[];
          }[];
        }
      >;
    };
    expect(animation.name).toBe("action_slash");
    expect(animation.length).toBe(ACTIONS.slash.length);
    const keyframes = animation.animators[project.outliner[0].uuid].keyframes;
    const swing = keyframes.find(
      (frame) => frame.channel === "rotation" && frame.time === 0.5,
    );
    // Z is written as-is; X/Y are pre-inverted for the pre-5.0 migration.
    expect(swing?.data_points[0].z).toBe(-95);
  });

  it("pre-inverts X/Y for Blockbench's legacy migration", () => {
    const project = toBlockbench(
      generateModel(settingsFor({ action: "cast" })),
    );
    const animation = project.animations[0] as {
      animators: Record<
        string,
        {
          keyframes: {
            channel: string;
            time: number;
            data_points: { x: number }[];
          }[];
        }
      >;
    };
    const raise = Object.values(animation.animators)[0].keyframes.find(
      (frame) => frame.channel === "rotation" && frame.time === 0.4,
    );
    expect(raise?.data_points[0].x).toBe(15);
  });

  it("stays in Java format when nothing is animated", () => {
    expect(toBlockbench(generateModel(settingsFor())).meta.model_format).toBe(
      "java_block",
    );
  });

  it("puts the root pivot at the grip", () => {
    const project = toBlockbench(generateModel(settingsFor({ height: 30 })));
    expect(project.outliner[0].origin[1]).toBeCloseTo(8 - 9, 5);
  });
});

describe("variant pack", () => {
  const base = settingsFor({ name: "Blade" });
  const packFor = (family: Parameters<typeof buildVariants>[1]) =>
    unzipSync(
      toVariantPack(
        buildVariants(base, family).map((spec) => ({
          key: spec.key,
          label: spec.label,
          model: generateModel(spec.settings),
        })),
        base.name,
      ),
    );

  it("dispatches tiers by custom_model_data with a vanilla fallback", () => {
    const archive = packFor("tiers");
    const definition = JSON.parse(
      strFromU8(archive["assets/minecraft/items/diamond_sword.json"]),
    );
    expect(definition.model.type).toBe("minecraft:range_dispatch");
    expect(definition.model.property).toBe("minecraft:custom_model_data");
    expect(
      definition.model.entries.map(
        (entry: { threshold: number }) => entry.threshold,
      ),
    ).toEqual([1, 2, 3, 4, 5, 6]);
    expect(definition.model.fallback.model).toBe(
      "minecraft:item/diamond_sword",
    );
  });

  it("includes a model, texture and bbmodel per variant", () => {
    const archive = packFor("forms");
    for (const key of ["form_sealed", "form_base", "form_released"]) {
      const model = JSON.parse(
        strFromU8(archive[`assets/voxelforge/models/item/sword_${key}.json`]),
      );
      expect(model.textures["0"]).toBe(`voxelforge:item/sword_${key}`);
      expect(
        archive[`assets/voxelforge/textures/item/sword_${key}.png`],
      ).toBeDefined();
      expect(archive[`blockbench/sword_${key}.bbmodel`]).toBeDefined();
    }
  });

  it("splits a themed set across vanilla items and documents /give", () => {
    const archive = packFor("theme");
    expect(archive["assets/minecraft/items/stick.json"]).toBeDefined();
    const paper = JSON.parse(
      strFromU8(archive["assets/minecraft/items/paper.json"]),
    );
    expect(paper.model.entries).toHaveLength(
      TEMPLATES.filter((template) => template.vanillaItem === "paper").length,
    );
    const readme = strFromU8(archive["README.txt"]);
    expect(readme).toContain("minecraft:custom_model_data={floats:[1f]}");
  });
});
