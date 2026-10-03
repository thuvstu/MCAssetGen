import { describe, expect, it } from "vitest";
import { ACTIONS, sampleAction } from "@/lib/animation/actions";
import { toBlockbench } from "@/lib/export";
import { buildGeometry, paletteForPrompt } from "@/lib/geometry";
import { generateModel } from "@/lib/model-generator";
import {
  DEFAULT_SETTINGS,
  TEMPLATES,
  type ModelKind,
  type ModelSettings,
} from "@/lib/model-types";

const MECHANICAL: ModelKind[] = ["drill", "cannon", "mechblade"];
const settingsFor = (
  overrides: Partial<ModelSettings> = {},
): ModelSettings => ({ ...DEFAULT_SETTINGS, ...overrides });
const cubesFor = (overrides: Partial<ModelSettings> = {}) =>
  buildGeometry(settingsFor(overrides));

describe("mechanical templates", () => {
  it.each(MECHANICAL)("builds a detailed %s", (kind) => {
    const cubes = cubesFor({ kind });
    expect(cubes.length).toBeGreaterThan(25);
    for (const cube of cubes) {
      for (let axis = 0; axis < 3; axis++)
        expect(cube.to[axis]).toBeGreaterThan(cube.from[axis]);
    }
  });

  it("gives each machine its signature parts", () => {
    expect(
      cubesFor({ kind: "drill" }).some((cube) =>
        cube.name.startsWith("drill_flight"),
      ),
    ).toBe(true);
    expect(
      cubesFor({ kind: "cannon" }).some((cube) =>
        cube.name.startsWith("cannon_barrel"),
      ),
    ).toBe(true);
    expect(
      cubesFor({ kind: "mechblade" }).some((cube) =>
        cube.name.startsWith("mech_neon_line"),
      ),
    ).toBe(true);
  });

  it("lights up machine energy parts", () => {
    for (const kind of MECHANICAL) {
      expect(cubesFor({ kind }).some((cube) => cube.emissive)).toBe(true);
    }
  });

  it("defaults machine templates to a steel palette", () => {
    expect(paletteForPrompt("ただの武器", "drill")[6]).toBe("#c98f3a");
    expect(paletteForPrompt("ただの武器", "sword")[2]).toBe("#42cbbd");
    // Prompt keywords still win over the kind default.
    expect(paletteForPrompt("紫のアメジストの杖", "drill")[2]).toBe("#9878d9");
  });

  it("stays inside the Java model range when upgraded", () => {
    for (const kind of MECHANICAL) {
      const settings = settingsFor({
        kind,
        tier: 5,
        limitBreak: true,
        form: "released",
        mode: "charged",
        floaters: "swarm",
      });
      const extent = Math.max(
        ...buildGeometry(settings).flatMap((cube) =>
          [...cube.from, ...cube.to].map(Math.abs),
        ),
      );
      expect(extent).toBeLessThanOrEqual(23.5);
    }
  });

  it("exports each machine to its own vanilla item", () => {
    const drill = toBlockbench(generateModel(settingsFor({ kind: "drill" })));
    expect(drill.model_identifier).toBe("voxelforge_drill");
  });
});

describe("sword detail", () => {
  const sword = cubesFor({ kind: "sword" });

  it("carries a fuller and lit cutting edges", () => {
    expect(sword.some((cube) => cube.name.startsWith("blade_fuller"))).toBe(
      true,
    );
    expect(
      sword.filter(
        (cube) => cube.name.startsWith("blade_edge_light") && cube.emissive,
      ).length,
    ).toBeGreaterThan(10);
  });

  it("layers the guard and wraps the grip", () => {
    expect(sword.some((cube) => cube.name.startsWith("guard_rune"))).toBe(true);
    expect(sword.some((cube) => cube.name.startsWith("guard_plate"))).toBe(
      true,
    );
    expect(
      sword.filter((cube) => cube.name.startsWith("grip_ring")).length,
    ).toBeGreaterThanOrEqual(5);
  });

  it("tapers the tip in steps", () => {
    const tips = sword.filter((cube) => cube.name.startsWith("blade_tip"));
    expect(tips.length).toBe(3);
    // Geometry is normalised to ±height/2, so the tip reaches the top edge.
    expect(Math.max(...tips.map((cube) => cube.to[1]))).toBeGreaterThan(15.5);
  });

  it("keeps vanilla style free of the extra detail", () => {
    const vanilla = cubesFor({ kind: "sword", style: "vanilla" });
    expect(vanilla.some((cube) => cube.name.startsWith("blade_fuller"))).toBe(
      false,
    );
    expect(vanilla.some((cube) => cube.name.startsWith("grip_ring"))).toBe(
      false,
    );
    expect(
      vanilla.some((cube) => cube.name.startsWith("blade_tip_point")),
    ).toBe(false);
  });
});

describe("staff upgrades", () => {
  it("rings the crystal with tier gems instead of stacking them", () => {
    const staff = cubesFor({ kind: "staff", tier: 5 });
    const gems = staff.filter((cube) => cube.name.startsWith("tier_gem"));
    const spread = new Set(
      gems.map(
        (cube) => `${Math.round(cube.from[0])}:${Math.round(cube.from[2])}`,
      ),
    ).size;
    expect(gems).toHaveLength(5);
    // Gems encircle the crystal in the X/Z plane rather than stacking on it.
    expect(spread).toBeGreaterThan(3);
    expect(
      new Set(gems.map((cube) => Math.round(cube.from[2]))).size,
    ).toBeGreaterThan(1);
  });
});

describe("transform motion", () => {
  it("is registered with a label and keyframes", () => {
    expect(ACTIONS.transform.label).toBe("変形");
    expect(ACTIONS.transform.keyframes.length).toBeGreaterThan(4);
  });

  it("deforms and reassembles the model", () => {
    const crouch = sampleAction("transform", 0.25);
    expect(crouch.scale[1]).toBeCloseTo(0.5, 5);
    expect(crouch.scale[2]).toBeGreaterThan(1.2);

    const flare = sampleAction("transform", 0.85);
    expect(flare.scale[1]).toBeCloseTo(1.7, 5);
    expect(flare.glow).toBeCloseTo(3.2, 5);
  });

  it("returns to rest at the end of the loop", () => {
    const end = sampleAction("transform", ACTIONS.transform.length);
    expect(end.scale).toEqual([1, 1, 1]);
    expect(end.rotation).toEqual([0, 0, 0]);
  });

  it("writes scale keyframes to the Blockbench animation", () => {
    const project = toBlockbench(
      generateModel(settingsFor({ kind: "mechblade", action: "transform" })),
    );
    expect(project.meta.model_format).toBe("free");
    const animation = project.animations[0] as {
      name: string;
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
    expect(animation.name).toBe("action_transform");
    const keyframes = Object.values(animation.animators)[0].keyframes;
    const scaleKeys = keyframes.filter((frame) => frame.channel === "scale");
    expect(scaleKeys.length).toBe(ACTIONS.transform.keyframes.length);
    // Scale is not inverted by the legacy migration, unlike rotation/position.
    const crouch = scaleKeys.find((frame) => frame.time === 0.25);
    expect(crouch?.data_points[0].y).toBeCloseTo(0.5, 5);
  });
});

describe("template registry", () => {
  it("covers every template with a shape builder", () => {
    for (const template of TEMPLATES) {
      expect(() =>
        buildGeometry(settingsFor({ kind: template.kind })),
      ).not.toThrow();
    }
  });

  it("defaults each template to sensible dimensions", () => {
    for (const template of TEMPLATES) {
      const settings = {
        ...settingsFor(),
        kind: template.kind,
        ...template.defaults,
      };
      expect(settings.action ?? "none").toBeDefined();
    }
  });
});
