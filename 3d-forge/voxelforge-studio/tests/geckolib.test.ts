import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { PNG } from "pngjs";
import { decodeDataUrl } from "@/lib/atlas";
import {
  buildGeckolibLayout,
  geckolibAnimations,
  geckolibAtlas,
  geckolibDependencySnippet,
  geckolibGeoModel,
  geckolibJavaSources,
  resolveGeckolibOptions,
  sanitizeModelId,
  toGeckolibBundle,
} from "@/lib/export/geckolib";
import { generateModel } from "@/lib/model-generator";
import { DEFAULT_SETTINGS, type ModelSettings } from "@/lib/model-types";

const modelFor = (overrides: Partial<ModelSettings> = {}) =>
  generateModel({ ...DEFAULT_SETTINGS, ...overrides });

describe("resolveGeckolibOptions", () => {
  it("slugs unsafe ids and keeps a valid namespace", () => {
    expect(sanitizeModelId("My Sword!")).toBe("my_sword");
    expect(sanitizeModelId("")).toBe("voxelforge_model");
    const options = resolveGeckolibOptions(modelFor({ kind: "staff" }), {
      namespace: "My Mod",
      modelId: "",
      generation: "geckolib4",
    });
    expect(options.namespace).toBe("my_mod");
    expect(options.modelId).toBe("voxelforge_staff");
    expect(options.generation).toBe("geckolib4");
    expect(options.javaPackage).toBe("com.example.my_mod");
  });

  it("falls back to GeckoLib 5 when the generation is unknown", () => {
    expect(
      resolveGeckolibOptions(modelFor(), { generation: "geckolib9" as never })
        .generation,
    ).toBe("geckolib5");
  });
});

describe("buildGeckolibLayout", () => {
  it("packs every visible cube into its own island", () => {
    const model = modelFor({ kind: "sword" });
    const options = resolveGeckolibOptions(model);
    const layout = buildGeckolibLayout(model, options);
    const cubes = layout.bones.flatMap((bone) => bone.cubes);
    expect(cubes).toHaveLength(model.cubes.filter((cube) => !cube.hidden).length);
    const origins = new Set(cubes.map((cube) => cube.uv.join(",")));
    expect(origins.size).toBe(cubes.length);
    for (const cube of cubes) {
      // Box unwrap footprint must stay inside the atlas.
      expect(cube.uv[0] + 2 * (cube.size[0] + cube.size[2])).toBeLessThanOrEqual(
        layout.size,
      );
      expect(cube.uv[1] + cube.size[2] + cube.size[1]).toBeLessThanOrEqual(
        layout.size,
      );
      expect(cube.size.every((value) => value > 0)).toBe(true);
    }
  });

  it("groups rigs and floaters into their own bones", () => {
    const model = modelFor({
      kind: "staff",
      floaters: "crystal",
      animation: "orbit",
      action: "cast",
    });
    const layout = buildGeckolibLayout(model, resolveGeckolibOptions(model));
    const names = layout.bones.map((bone) => bone.name);
    expect(names).toContain("floaters");
    expect(layout.clips).toEqual(["floaters_orbit", "action_cast"]);
  });

  it("mirrors geometry on the X axis for Bedrock", () => {
    const model = modelFor({ kind: "sword" });
    const mirrored = buildGeckolibLayout(model, resolveGeckolibOptions(model));
    const plain = buildGeckolibLayout(
      model,
      resolveGeckolibOptions(model, { mirrorX: false }),
    );
    const firstMirrored = mirrored.bones.flatMap((bone) => bone.cubes)[0];
    const firstPlain = plain.bones.flatMap((bone) => bone.cubes)[0];
    expect(firstMirrored.size).toEqual(firstPlain.size);
    for (let axis = 1; axis < 3; axis++)
      expect(firstMirrored.origin[axis]).toBeCloseTo(firstPlain.origin[axis], 5);
    // x' = -x maps the mirrored origin onto the far side of the same cube.
    expect(firstMirrored.origin[0]).toBeCloseTo(
      -(firstPlain.origin[0] + firstPlain.size[0]),
      3,
    );
  });
});

describe("geckolibGeoModel", () => {
  it("writes a Bedrock 1.12.0 geometry with a root bone", () => {
    const model = modelFor({ kind: "staff", floaters: "orbit", animation: "spin" });
    const options = resolveGeckolibOptions(model, { namespace: "mymod", modelId: "arcane_staff" });
    const geo = JSON.parse(geckolibGeoModel(model, options));
    expect(geo.format_version).toBe("1.12.0");
    const geometry = geo["minecraft:geometry"][0];
    expect(geometry.description.identifier).toBe("geometry.mymod.arcane_staff");
    expect(geometry.description.texture_width).toBeGreaterThan(0);
    expect(geometry.bones[0].name).toBe("root");
    const names = geometry.bones.map((bone: { name: string }) => bone.name);
    expect(names).toContain("floaters");
    for (const bone of geometry.bones.slice(1))
      expect(bone.parent).toBe("root");
  });

  it("marks emissive cubes", () => {
    const model = modelFor({ kind: "cannon", effect: "glow" });
    const options = resolveGeckolibOptions(model);
    const geo = JSON.parse(geckolibGeoModel(model, options));
    const cubes = geo["minecraft:geometry"][0].bones.flatMap(
      (bone: { cubes?: { render_type?: string }[] }) => bone.cubes ?? [],
    );
    expect(cubes.some((cube: { render_type?: string }) => cube.render_type === "emissive")).toBe(
      true,
    );
  });
});

describe("geckolibAnimations", () => {
  it("writes the Bedrock animation envelope", () => {
    const model = modelFor({ kind: "staff", floaters: "crystal", animation: "spin" });
    const options = resolveGeckolibOptions(model);
    const animations = JSON.parse(geckolibAnimations(model, options));
    expect(animations.format_version).toBe("1.8.0");
    expect(Object.keys(animations.animations)).toEqual(["floaters_spin"]);
  });

  it("writes floaters_orbit keyframes on the floaters bone", () => {
    const model = modelFor({ kind: "staff", floaters: "orbit", animation: "orbit" });
    const options = resolveGeckolibOptions(model);
    const clip = JSON.parse(geckolibAnimations(model, options)).animations
      .floaters_orbit;
    expect(clip.loop).toBe(true);
    expect(clip.animation_length).toBe(3);
    expect(Object.keys(clip.bones)).toEqual(["floaters"]);
    expect(Object.keys(clip.bones.floaters.position).length).toBeGreaterThan(2);
  });

  it("writes action clips with root and rig bones", () => {
    const model = modelFor({ kind: "mechblade", action: "transform" });
    const options = resolveGeckolibOptions(model);
    const animations = JSON.parse(geckolibAnimations(model, options)).animations;
    const clip = animations.action_transform;
    expect(clip.loop).toBe(false);
    expect(clip.bones.root.rotation["0"]).toBeDefined();
    const rigs = Object.keys(clip.bones).filter((name) => name !== "root");
    for (const rig of rigs)
      expect(["mechanism", "magazine", "string", "page", "panel_left", "panel_right"]).toContain(
        rig,
      );
  });
});

describe("geckolibAtlas", () => {
  it("paints the islands from the studio texture", () => {
    const model = modelFor({ kind: "sword" });
    const options = resolveGeckolibOptions(model);
    const layout = buildGeckolibLayout(model, options);
    const atlas = PNG.sync.read(geckolibAtlas(model, layout));
    expect(atlas.width).toBe(layout.size);
    expect(atlas.height).toBe(layout.size);
    const source = PNG.sync.read(decodeDataUrl(model.texture.source));
    const opaque = (png: PNG) => {
      let count = 0;
      for (let i = 3; i < png.data.length; i += 4) if (png.data[i] > 0) count++;
      return count;
    };
    expect(opaque(atlas)).toBeGreaterThan(0);
    expect(opaque(atlas)).toBeLessThanOrEqual(opaque(source) * 4);
  });
});

describe("geckolibJavaSources", () => {
  it("targets the GeckoLib 5 API with plain clip names", () => {
    const model = modelFor({ kind: "staff", floaters: "crystal", animation: "spin", action: "cast" });
    const options = resolveGeckolibOptions(model, {
      modelId: "arcane_staff",
      javaPackage: "com.example.mymod",
    });
    const layout = buildGeckolibLayout(model, options);
    const files = geckolibJavaSources(model, options, layout);
    const paths = Object.keys(files);
    expect(paths).toContain("java/com/example/mymod/ArcaneStaffItem.java");
    expect(paths).toContain("java/com/example/mymod/ArcaneStaffRenderer.java");
    const item = files["java/com/example/mymod/ArcaneStaffItem.java"];
    expect(item).toContain('RawAnimation.begin().thenLoop("floaters_spin")');
    expect(item).toContain('RawAnimation.begin().thenPlay("action_cast")');
    expect(item).toContain("software.bernie.geckolib.animatable.manager.AnimatableManager");
    expect(item).toContain("GeoItem.registerSyncedAnimatable(this)");
    const renderer = files["java/com/example/mymod/ArcaneStaffRenderer.java"];
    expect(renderer).toContain('fromNamespaceAndPath("voxelforge", "arcane_staff")');
  });

  it("uses the 4.x controller signature and mclib dependency", () => {
    const model = modelFor({ kind: "staff", floaters: "crystal", animation: "spin" });
    const options = resolveGeckolibOptions(model, {
      modelId: "arcane_staff",
      generation: "geckolib4",
    });
    const layout = buildGeckolibLayout(model, options);
    const item = geckolibJavaSources(model, options, layout)[
      "java/com/example/voxelforge/ArcaneStaffItem.java"
    ];
    expect(item).toContain("new AnimationController<>(this,");
    expect(item).toContain("software.bernie.geckolib.animation.AnimatableManager");
    expect(item).toContain("SingletonGeoAnimatable.registerSyncedAnimatable(this)");
    expect(geckolibDependencySnippet(options)).toContain("com.eliotlash.mclib:mclib:20");
  });

  it("omits Java when the generation is none", () => {
    const model = modelFor();
    const options = resolveGeckolibOptions(model, { generation: "none" });
    expect(geckolibJavaSources(model, options)).toEqual({});
  });
});

describe("toGeckolibBundle", () => {
  it("packs assets, java, dependency snippet and readme", () => {
    const model = modelFor({ kind: "staff", floaters: "orbit", animation: "orbit", action: "cast" });
    const bundle = toGeckolibBundle(model, { namespace: "mymod", modelId: "arcane_staff" });
    const archive = unzipSync(bundle.zip);
    const paths = Object.keys(archive);
    expect(paths).toContain("assets/mymod/geo/item/arcane_staff.geo.json");
    expect(paths).toContain("assets/mymod/animations/item/arcane_staff.animation.json");
    expect(paths).toContain("assets/mymod/textures/item/arcane_staff.png");
    expect(paths).toContain("java/com/example/mymod/ArcaneStaffItem.java");
    expect(paths).toContain("dependencies/geckolib.gradle.kts");
    expect(paths).toContain("README.md");

    const geo = JSON.parse(strFromU8(archive["assets/mymod/geo/item/arcane_staff.geo.json"]));
    expect(geo["minecraft:geometry"][0].description.identifier).toBe(
      "geometry.mymod.arcane_staff",
    );
    const clips = Object.keys(
      JSON.parse(strFromU8(archive["assets/mymod/animations/item/arcane_staff.animation.json"]))
        .animations,
    );
    expect(clips).toEqual(["floaters_orbit", "action_cast"]);
    const png = PNG.sync.read(Buffer.from(archive["assets/mymod/textures/item/arcane_staff.png"]));
    expect(png.width).toBe(bundle.layout.size);
    expect(strFromU8(archive["dependencies/geckolib.gradle.kts"])).toContain(
      "geckolib-fabric-",
    );
  });

  it("reports the files it wrote", () => {
    const model = modelFor({ kind: "pickaxe" });
    const bundle = toGeckolibBundle(model, { modelId: "ore_pick" });
    expect(bundle.files).toContain("assets/voxelforge/geo/item/ore_pick.geo.json");
    expect(bundle.files).toContain("java/com/example/voxelforge/OrePickItem.java");
  });
});
