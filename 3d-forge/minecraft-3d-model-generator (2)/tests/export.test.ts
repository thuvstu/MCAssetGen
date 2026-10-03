import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { toBlockbench, toMinecraft, toResourcePack } from "@/lib/export";
import { generateModel } from "@/lib/model-generator";
import { DEFAULT_SETTINGS, type ModelSettings } from "@/lib/model-types";

const modelFor = (overrides: Partial<ModelSettings> = {}) =>
  generateModel({ ...DEFAULT_SETTINGS, ...overrides });

interface OutlinerGroup {
  name: string;
  uuid: string;
  children: (string | OutlinerGroup)[];
}

const groupsOf = (children: (string | OutlinerGroup)[]) =>
  children.filter((child): child is OutlinerGroup => typeof child === "object");

describe("toBlockbench", () => {
  it("exports every cube with six faces and unique ids", () => {
    const model = modelFor();
    const project = toBlockbench(model);
    expect(project.elements).toHaveLength(model.cubes.length);
    expect(new Set(project.elements.map((element) => element.uuid)).size).toBe(
      model.cubes.length,
    );
    for (const element of project.elements)
      expect(Object.keys(element.faces)).toHaveLength(6);
  });

  it("centres geometry on the Blockbench origin", () => {
    const project = toBlockbench(modelFor());
    for (const element of project.elements) {
      element.from.forEach((value, axis) =>
        expect(value).toBeLessThan(element.to[axis]),
      );
    }
    expect(
      project.elements.every((element) =>
        element.origin.every((value) => value === 8),
      ),
    ).toBe(true);
  });

  it("omits animations when there is nothing floating", () => {
    const project = toBlockbench(
      modelFor({ floaters: "none", animation: "spin" }),
    );
    expect(project.animations).toHaveLength(0);
    expect(groupsOf(project.outliner[0].children)).toHaveLength(0);
  });

  it("groups floaters and targets them with the animation", () => {
    const model = modelFor({
      kind: "staff",
      floaters: "orbit",
      animation: "spin",
    });
    const project = toBlockbench(model);
    const [floaterGroup] = groupsOf(project.outliner[0].children);
    const floaterCount = model.cubes.filter(
      (cube) => cube.layer === "floater",
    ).length;

    expect(floaterGroup.name).toBe("floaters");
    expect(floaterGroup.children).toHaveLength(floaterCount);
    expect(project.animations).toHaveLength(1);

    const animation = project.animations[0] as {
      name: string;
      loop: string;
      animators: Record<string, unknown>;
    };
    expect(animation.name).toBe("floaters_spin");
    expect(animation.loop).toBe("loop");
    expect(animation.animators[floaterGroup.uuid]).toBeDefined();
  });

  it("writes float and sway channels", () => {
    const keyframes = (animationStyle: ModelSettings["animation"]) => {
      const project = toBlockbench(
        modelFor({ floaters: "crystal", animation: animationStyle }),
      );
      const animation = project.animations[0] as {
        animators: Record<string, { keyframes: { channel: string }[] }>;
      };
      return Object.values(animation.animators)[0].keyframes;
    };
    expect(
      keyframes("float").every((frame) => frame.channel === "position"),
    ).toBe(true);
    expect(
      keyframes("sway").every((frame) => frame.channel === "rotation"),
    ).toBe(true);
  });

  it("marks emissive cubes and embeds the texture", () => {
    const project = toBlockbench(modelFor({ effect: "glow" }));
    expect(project.elements.some((element) => "render_mode" in element)).toBe(
      true,
    );
    expect(
      project.textures[0].source.startsWith("data:image/png;base64,"),
    ).toBe(true);
  });
});

describe("toMinecraft", () => {
  it("normalises UVs into the 16x16 space", () => {
    const java = toMinecraft(modelFor());
    for (const element of java.elements) {
      for (const face of Object.values(element.faces)) {
        for (const value of face.uv) {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(16);
        }
      }
    }
  });

  it("keeps the standard item display transforms", () => {
    expect(toMinecraft(modelFor()).display.gui.scale).toEqual([
      0.55, 0.55, 0.55,
    ]);
  });
});

describe("toResourcePack", () => {
  it("packs metadata, model, texture and item definition", () => {
    const archive = unzipSync(toResourcePack(modelFor({ kind: "sword" })));
    expect(JSON.parse(strFromU8(archive["pack.mcmeta"])).pack.pack_format).toBe(
      46,
    );
    expect(archive["assets/voxelforge/models/item/model.json"]).toBeDefined();
    expect(archive["assets/voxelforge/textures/item/model.png"]).toBeDefined();
    expect(archive["assets/minecraft/items/diamond_sword.json"]).toBeDefined();
  });

  it("documents floaters and animation in the readme", () => {
    const archive = unzipSync(
      toResourcePack(modelFor({ floaters: "crystal", animation: "float" })),
    );
    const readme = strFromU8(archive["README.txt"]);
    expect(readme).toContain("浮遊物を含むモデルです。");
    expect(readme).toContain("Blockbench");
  });

  it("maps each template to its vanilla item", () => {
    const itemFor = (kind: ModelSettings["kind"]) =>
      Object.keys(unzipSync(toResourcePack(modelFor({ kind })))).find((path) =>
        path.startsWith("assets/minecraft/items/"),
      );
    expect(itemFor("staff")).toBe("assets/minecraft/items/stick.json");
    expect(itemFor("shield")).toBe("assets/minecraft/items/paper.json");
    expect(itemFor("pickaxe")).toBe(
      "assets/minecraft/items/diamond_pickaxe.json",
    );
  });
});
