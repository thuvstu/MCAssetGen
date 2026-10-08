import { describe, expect, it } from "vitest";
import { emptyProject } from "@/lib/compat/engines/modforge/mod/catalog";
import { generateProject } from "@/lib/compat/engines/modforge/mod/codegen";
import type { ModProject } from "@/lib/compat/engines/modforge/mod/types";

/**
 * Directive ① — GeckoLib support for generated Fabric mods.
 *
 * Opting a mob in with `geckolib: true` must add the geo/animation/texture
 * assets, the Kotlin glue, the client entrypoint and the Gradle dependency.
 */

function projectWithGeckolibMob(geckolib: boolean): ModProject {
  const project = emptyProject();
  project.meta.modId = "testmod";
  project.meta.name = "Test Mod";
  project.meta.packageName = "com.example.testmod";
  project.mobs = [
    {
      id: "cinderling",
      name: "Cinderling",
      baseMob: "BLAZE",
      maxHealth: 24,
      movementSpeed: 0.32,
      attackDamage: 5,
      drops: [],
      behavior: "hostile",
      geckolib,
    },
  ];
  return project;
}

describe("mod GeckoLib support", () => {
  it("adds geo/animation/texture assets and Kotlin glue", () => {
    const files = generateProject(projectWithGeckolibMob(true));
    const paths = files.map((entry) => entry.path);
    expect(paths).toContain("src/main/resources/assets/testmod/geo/entity/cinderling.geo.json");
    expect(paths).toContain("src/main/resources/assets/testmod/animations/entity/cinderling.animation.json");
    expect(paths).toContain("src/main/resources/assets/testmod/textures/entity/cinderling.png");
    expect(paths).toContain("src/main/kotlin/com/example/testmod/mobs/GeckoMobs.kt");
    expect(paths).toContain("src/main/kotlin/com/example/testmod/client/GeckoMobRenderers.kt");
    expect(paths).toContain("GECKOLIB.md");

    const geo = JSON.parse(files.find((entry) => entry.path.endsWith(".geo.json"))!.content);
    expect(geo.format_version).toBe("1.12.0");
    const bones = geo["minecraft:geometry"][0].bones.map((bone: { name: string }) => bone.name);
    expect(bones).toContain("head");
    expect(bones).toContain("body");

    const animation = JSON.parse(files.find((entry) => entry.path.endsWith(".animation.json"))!.content);
    expect(animation.format_version).toBe("1.8.0");
    expect(Object.keys(animation.animations)).toEqual(expect.arrayContaining(["idle", "walk", "attack"]));

    const texture = files.find((entry) => entry.path.endsWith("cinderling.png"))!;
    expect(texture.encoding).toBe("base64");
    expect(Buffer.from(texture.content, "base64").subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  });

  it("wires the Gradle dependency, properties and client entrypoint", () => {
    const files = generateProject(projectWithGeckolibMob(true));
    const read = (path: string) => files.find((entry) => entry.path === path)!.content;
    expect(read("build.gradle.kts")).toContain("geckolib-fabric-");
    expect(read("build.gradle.kts")).toContain("dl.cloudsmith.io/public/geckolib3/geckolib/maven");
    expect(read("gradle.properties")).toContain("geckolib_version=5.4.4");
    const mod = JSON.parse(read("src/main/resources/fabric.mod.json"));
    expect(mod.entrypoints.client?.[0]?.value).toBe("com.example.testmod.client.GeckoMobRenderers");
    expect(read("src/main/kotlin/com/example/testmod/client/GeckoMobRenderers.kt")).toContain("GeoReplacedEntityRenderer");
    expect(read("src/main/kotlin/com/example/testmod/mobs/GeckoMobs.kt")).toContain("GeoReplacedEntity");
  });

  it("leaves regular mods untouched", () => {
    const files = generateProject(projectWithGeckolibMob(false));
    const paths = files.map((entry) => entry.path);
    expect(paths.some((path) => path.includes("geo/entity"))).toBe(false);
    expect(paths).not.toContain("GECKOLIB.md");
    const read = (path: string) => files.find((entry) => entry.path === path)!.content;
    expect(read("build.gradle.kts")).not.toContain("geckolib");
    const mod = JSON.parse(read("src/main/resources/fabric.mod.json"));
    expect(mod.entrypoints.client).toBeUndefined();
  });
});
