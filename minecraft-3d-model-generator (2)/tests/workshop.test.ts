import { describe, expect, it } from "vitest";
import { PNG } from "pngjs";
import * as THREE from "three";
import { decodeDataUrl } from "@/lib/atlas";
import { ACTIONS, sampleAction } from "@/lib/animation/actions";
import {
  FLOATING_LENGTH,
  floatingFrames,
  sampleFloating,
} from "@/lib/animation/floating";
import {
  createModelBatches,
  nameAtIntersection,
} from "@/components/viewport/batched-model";
import { applyCubeEdits, upsertCubeEdit } from "@/lib/editor-recipe";
import { generateModel } from "@/lib/model-generator";
import { validateSettings } from "@/lib/settings-schema";
import { toBlockbench, toMinecraft } from "@/lib/export";
import { buildVariants } from "@/lib/variants";
import {
  ACTION_IDS,
  ANIMATION_IDS,
  ATTACHMENT_IDS,
  DEFAULT_GRADIENT,
  DEFAULT_SETTINGS,
  EFFECT_IDS,
  MODEL_KINDS,
  TEMPLATES,
  settingsForTemplate,
  type ModelCube,
  type ModelSettings,
} from "@/lib/model-types";

const settings = (partial: Partial<ModelSettings> = {}): ModelSettings => ({
  ...DEFAULT_SETTINGS,
  ...partial,
});
const signature: Partial<Record<ModelSettings["kind"], string>> = {
  bloodblade: "blood_heart",
  cursedblade: "abyss_eye",
  elderstaff: "astral_armillary",
  bloodstaff: "blood_moon",
  grimoire: "grimoire_page",
  magiccircle: "sigil_star",
  bow: "bow_string",
  rifle: "rifle_scope",
  pistol: "pistol_slide",
  railgun: "railgun_coil",
  chainsaw: "chainsaw_chain",
  relic: "relic_cage",
  spear: "spear_tassel",
  mace: "mace_flange",
};

describe("24-template workshop", () => {
  it("keeps the kind registry and catalog in sync", () => {
    expect(TEMPLATES.map((t) => t.kind).sort()).toEqual(
      [...MODEL_KINDS].sort(),
    );
    expect(new Set(TEMPLATES.map((t) => t.kind)).size).toBe(24);
    for (const t of TEMPLATES) expect(t.vanillaItem).toMatch(/^[a-z_]+$/);
  });
  it.each(MODEL_KINDS)(
    "generates valid, bounded and named geometry for %s",
    (kind) => {
      const model = generateModel(settingsForTemplate(kind, DEFAULT_SETTINGS));
      expect(model.cubes.length).toBeGreaterThan(15);
      expect(new Set(model.cubes.map((c) => c.name)).size).toBe(
        model.cubes.length,
      );
      for (const c of model.cubes) {
        for (let a = 0; a < 3; a++) {
          expect(c.to[a]).toBeGreaterThan(c.from[a]);
          expect(c.from[a]).toBeGreaterThanOrEqual(-23.5);
          expect(c.to[a]).toBeLessThanOrEqual(23.5);
        }
        expect(c.uv[2]).toBeLessThanOrEqual(model.texture.width);
        expect(c.uv[3]).toBeLessThanOrEqual(model.texture.height);
      }
      if (signature[kind])
        expect(
          model.cubes.some((c) => c.name.startsWith(signature[kind]!)),
        ).toBe(true);
    },
  );
  it("does not leak the previous template's action or upgrades", () => {
    const prior = settings({
      kind: "mechblade",
      tier: 5,
      action: "transform",
      effect: "void",
      limitBreak: true,
    });
    const next = settingsForTemplate("sword", prior);
    expect(next.action).toBe("none");
    expect(next.tier).toBe(0);
    expect(next.effect).toBe("none");
    expect(next.limitBreak).toBe(false);
  });
  it("round-trips every supported action, effect and floater motion through validation", () => {
    for (const id of ACTION_IDS)
      expect(validateSettings(settings({ action: id })).action).toBe(id);
    for (const id of EFFECT_IDS)
      expect(validateSettings(settings({ effect: id })).effect).toBe(id);
    for (const id of ANIMATION_IDS)
      expect(validateSettings(settings({ animation: id })).animation).toBe(id);
  });
  it("includes all 24 theme models plus all upgrade families", () =>
    expect(buildVariants(DEFAULT_SETTINGS, "all")).toHaveLength(37));
  it("preserves the palette even for modern same-theme weapons", () => {
    const variants = buildVariants(DEFAULT_SETTINGS, "theme");
    expect(
      new Set(variants.map((v) => generateModel(v.settings).palette.join(",")))
        .size,
    ).toBe(1);
  });
});

describe("attachments", () => {
  it.each(ATTACHMENT_IDS)(
    "adds editable %s geometry without resizing the base",
    (kind) => {
      const base = generateModel(settings());
      const model = generateModel(
        settings({
          attachments: [
            {
              id: "test",
              kind,
              position: [0, 3, 1],
              scale: 1,
              material: 3,
              floating: true,
              emissive: true,
            },
          ],
        }),
      );
      expect(model.cubes.length).toBeGreaterThan(base.cubes.length);
      const parts = model.cubes.filter((c) =>
        c.name.startsWith("attachment_test_"),
      );
      expect(parts.length).toBeGreaterThan(0);
      expect(parts.every((c) => c.layer === "floater")).toBe(true);
      expect(model.cubes[0].from).toEqual(base.cubes[0].from);
    },
  );
  it("rejects invalid attachment kinds and excessive part arrays", () => {
    expect(() =>
      validateSettings({
        ...DEFAULT_SETTINGS,
        attachments: [{ kind: "unknown" }],
      }),
    ).toThrow();
    expect(() =>
      validateSettings({
        ...DEFAULT_SETTINGS,
        attachments: Array(30).fill({ kind: "crystal" }),
      }),
    ).toThrow();
  });
});

describe("non-destructive edit recipes", () => {
  it("keeps position and paint after regeneration and in .bbmodel", () => {
    const base = generateModel(settings()),
      target = base.cubes[0].name;
    const model = generateModel(
      settings({
        edits: [
          {
            target,
            from: [-2, -7, -1],
            to: [2, -3, 1],
            color: "#ef2345",
            label: "Edited grip",
          },
        ],
      }),
    );
    const c = model.cubes.find((c) => c.name === target)!;
    expect(c.from).toEqual([-2, -7, -1]);
    expect(c.to).toEqual([2, -3, 1]);
    expect(c.color).toBe("#ef2345");
    const exported = toBlockbench(model).elements.find(
      (e) => e.name === "Edited grip",
    )!;
    expect(exported.from).toEqual([6, 1, 7]);
    expect(exported.to).toEqual([10, 5, 9]);
    expect(model.texture.source).not.toBe(base.texture.source);
  });
  it("includes custom cubes, excludes hidden geometry from Java output", () => {
    const base = generateModel(settings()),
      custom: ModelCube = {
        name: "custom_test",
        label: "My crystal",
        from: [0, 0, 0],
        to: [2, 2, 2],
        color: "#123456",
        material: 3,
        uv: [2, 2, 14, 10],
      };
    const model = generateModel(
      settings({
        customCubes: [custom],
        edits: [{ target: base.cubes[0].name, hidden: true }],
      }),
    );
    expect(model.cubes).toHaveLength(base.cubes.length + 1);
    expect(toMinecraft(model).elements).toHaveLength(base.cubes.length);
    const hidden = toBlockbench(model).elements.find(
      (e) => e.export === false,
    )!;
    expect(hidden.visibility).toBe(false);
    expect(model.cubes.find((c) => c.name === "custom_test")!.color).toBe(
      "#123456",
    );
  });
  it("merges edits without applying deltas twice", () => {
    const target = generateModel(settings()).cubes[0];
    const edits = upsertCubeEdit([{ target: target.name, hidden: true }], {
      target: target.name,
      color: "#ffffff",
    });
    expect(edits).toHaveLength(1);
    expect(edits[0].hidden).toBe(true);
    const moved = {
      target: target.name,
      from: [-2, 1, -1] as [number, number, number],
      to: [2, 3, 1] as [number, number, number],
    };
    expect(applyCubeEdits(applyCubeEdits([target], [moved]), [moved])).toEqual(
      applyCubeEdits([target], [moved]),
    );
  });
  it("rejects degenerate custom cubes and non-finite positions", () => {
    expect(() =>
      validateSettings(
        settings({
          customCubes: [
            {
              name: "custom_bad",
              from: [0, 0, 0],
              to: [0, 0, 0],
              color: "#ffffff",
              material: 0,
              uv: [0, 0, 1, 1],
            },
          ],
        }),
      ),
    ).toThrow();
    expect(() =>
      validateSettings(
        settings({ edits: [{ target: "cube", from: [Infinity, 0, 0] }] }),
      ),
    ).toThrow();
  });
});

describe("baked gradient", () => {
  it("leaves the original atlas unchanged when disabled", () => {
    const original = generateModel(settings());
    expect(
      generateModel(
        settings({ gradient: { ...DEFAULT_GRADIENT, enabled: false } }),
      ).texture.source,
    ).toBe(original.texture.source);
  });
  it.each(["vertical", "horizontal", "diagonal", "radial"] as const)(
    "bakes %s into valid PNG and UVs",
    (mode) => {
      const model = generateModel(
        settings({
          gradient: { ...DEFAULT_GRADIENT, enabled: true, mode, strength: 100 },
        }),
      );
      const png = PNG.sync.read(decodeDataUrl(model.texture.source));
      expect(png.width).toBe(model.texture.width);
      expect(png.height).toBe(model.texture.height);
      expect(new Set(model.cubes.map((c) => c.color)).size).toBeGreaterThan(2);
      for (const c of model.cubes) {
        expect(c.uv[2]).toBeLessThanOrEqual(png.width);
        expect(c.uv[3]).toBeLessThanOrEqual(png.height);
      }
      const bb = toBlockbench(model);
      expect(bb.textures[0].source).toBe(model.texture.source);
    },
  );
  it("supports quantised steps and multiply composition", () => {
    const model = generateModel(
      settings({
        gradient: {
          ...DEFAULT_GRADIENT,
          enabled: true,
          steps: 2,
          blend: "multiply",
          strength: 100,
        },
      }),
    );
    expect(model.texture.name).toContain("finished");
    expect(model.texture.width).toBeLessThanOrEqual(1024);
  });
});

describe("shared articulated animations", () => {
  it.each(["shoot", "reload", "draw", "ritual", "rev", "transform"] as const)(
    "exports articulated %s animators",
    (action) => {
      const kind =
        action === "draw"
          ? "bow"
          : action === "ritual"
            ? "grimoire"
            : action === "rev"
              ? "chainsaw"
              : action === "transform"
                ? "mechblade"
                : "rifle";
      const project = toBlockbench(
        generateModel(settingsForTemplate(kind, settings())),
      );
      const animated = toBlockbench(
        generateModel({ ...settingsForTemplate(kind, settings()), action }),
      );
      const clip = animated.animations.find(
        (v: unknown) => (v as { name: string }).name === `action_${action}`,
      ) as { animators: Record<string, unknown> };
      expect(clip).toBeDefined();
      expect(Object.keys(clip.animators).length).toBeGreaterThan(1);
      expect(project.meta.model_format).toBe("free");
    },
  );
  it("samples the magazine separately from the rifle", () => {
    const pose = sampleAction("reload", 0.8, "magazine");
    expect(pose.position[1]).toBe(-4);
    expect(ACTIONS.reload.keyframes.length).toBeGreaterThan(2);
  });
  it.each(["float", "spin", "sway", "pulse", "orbit"] as const)(
    "shares %s loop duration and endpoints",
    (style) => {
      const frames = floatingFrames(style),
        first = frames[0],
        last = frames.at(-1)!;
      expect(last.time).toBe(FLOATING_LENGTH);
      expect(sampleFloating(style, FLOATING_LENGTH).position).toEqual(
        first.position,
      );
    },
  );
});

describe("draw-call batching and picking", () => {
  it("reduces hundreds of cubes into a few selectable meshes", () => {
    const model = generateModel(
        settings({
          kind: "sword",
          tier: 5,
          limitBreak: true,
          floaters: "orbit",
        }),
      ),
      texture = new THREE.Texture();
    const batches = createModelBatches(model, texture, false);
    expect(batches.length).toBeLessThan(8);
    expect(model.cubes.length).toBeGreaterThan(200);
    for (const batch of batches) {
      const names = batch.mesh.userData.cubeNames as string[];
      expect(nameAtIntersection({ object: batch.mesh, faceIndex: 0 })).toBe(
        names[0],
      );
      expect(nameAtIntersection({ object: batch.mesh, faceIndex: 12 })).toBe(
        names[1] ?? null,
      );
      batch.mesh.geometry.dispose();
      (batch.mesh.material as THREE.Material).dispose();
    }
    texture.dispose();
  });
});
