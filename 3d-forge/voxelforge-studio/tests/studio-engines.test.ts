import { describe, expect, it } from "vitest";
import { listEngines, runStudioCommand } from "@/lib/studio/dispatch";

/**
 * Smoke coverage for the unified engine registry: every engine that was folded
 * into the studio must answer its list commands and produce files from a cheap
 * render command, all through the same API-shaped entry point.
 */

const run = (engine: string, command: string, args: Record<string, unknown> = {}) =>
  runStudioCommand(engine, command, args);

const expectOk = async (engine: string, command: string, args: Record<string, unknown> = {}) => {
  const result = await run(engine, command, args);
  if (!result.ok) throw new Error(`${engine}:${command} failed — ${result.error}`);
  return result;
};

const firstId = async (engine: string, command: string, patch: (row: never) => string) => {
  const result = await expectOk(engine, command);
  const rows = ((result.data as never[] | undefined) ?? (result.text ?? "").split("\n")) as never[];
  expect(rows.length).toBeGreaterThan(0);
  return patch(rows[0]);
};

describe("studio engine registry", () => {
  it("lists every ported engine once", () => {
    const engines = listEngines();
    const ids = engines.map((engine) => engine.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const expected of [
      "voxel",
      "armor",
      "mob",
      "structure",
      "material",
      "skyforge",
      "sky2",
      "forge",
      "spell",
      "arcane",
      "sword",
      "adv",
      "tex",
    ])
      expect(ids).toContain(expected);
    for (const engine of engines) expect(engine.commands.length).toBeGreaterThan(0);
  });

  it("renders a voxel model and a GeckoLib bundle", async () => {
    const png = await expectOk("voxel", "export", { format: "png", kind: "sword", seed: 42 });
    expect(png.files?.[0]?.path.endsWith(".png")).toBe(true);
    const geckolib = await expectOk("voxel", "export", { format: "geckolib", kind: "sword", seed: 42 });
    expect(geckolib.files?.[0]?.path.endsWith(".zip")).toBe(true);
  });

  it("renders armor with its GeckoLib preview", async () => {
    const presets = await expectOk("armor", "presets");
    expect((presets.text ?? "").length).toBeGreaterThan(0);
    const render = await expectOk("armor", "render", { armorId: "test_armor", geo: true });
    expect(render.files?.length).toBe(2);
    const bundle = await expectOk("armor", "bundle", { armorId: "test_armor" });
    expect(bundle.files?.[0]?.path.endsWith(".zip")).toBe(true);
  });

  it("renders a mob and its GeckoLib bundle", async () => {
    await expectOk("mob", "archetypes");
    const render = await expectOk("mob", "render", { archetype: "humanoid", entityId: "test_mob" });
    expect(render.files?.length).toBe(2);
    const geckolib = await expectOk("mob", "geckolib", { archetype: "humanoid", entityId: "test_mob" });
    expect(geckolib.files?.[0]?.path.endsWith(".zip")).toBe(true);
  });

  it("exports a structure as .nbt and datapack", async () => {
    const nbt = await expectOk("structure", "nbt", { sample: "house" });
    expect(nbt.files?.[0]?.path.endsWith(".nbt")).toBe(true);
    const pack = await expectOk("structure", "export", { sample: "house" });
    expect(pack.files?.some((entry) => entry.path.endsWith(".zip"))).toBe(true);
  });

  it("renders material textures and a resource pack", async () => {
    const shapes = await expectOk("material", "shapes");
    expect((shapes.text ?? "").split("\n").length).toBeGreaterThan(3);
    const render = await expectOk("material", "render", { preset: "iron" });
    expect(render.files?.length).toBeGreaterThan(0);
    const pack = await expectOk("material", "pack", { preset: "iron", modId: "testmod" });
    expect(pack.files?.[0]?.path.endsWith(".zip")).toBe(true);
  });

  it("renders SkyForge items at three resolutions", async () => {
    const itemId = await firstId("skyforge", "items", (row: { id: string }) => row.id);
    for (const res of [16, 32, 64]) {
      const render = await expectOk("skyforge", "render", { item: itemId, res });
      expect(render.files?.[0]?.base64.length).toBeGreaterThan(50);
    }
  }, 20_000);

  it("renders classic SkyBlock items", async () => {
    const itemId = await firstId("sky2", "items", (row: { id: string }) => row.id);
    const render = await expectOk("sky2", "render", { item: itemId, size: 16 });
    expect(render.files?.[0]?.path.endsWith(".png")).toBe(true);
  });

  it("forges an item and a one-item pack", async () => {
    const styles = await expectOk("forge", "styles");
    expect(styles.text).toContain("furfsky");
    const itemId = await firstId("forge", "items", (row: { id: string }) => row.id);
    const render = await expectOk("forge", "render", { item: itemId, res: 16 });
    expect(render.files?.[0]?.path.endsWith(".png")).toBe(true);
    const pack = await expectOk("forge", "pack", { items: itemId, res: 16, target: "optifine" });
    expect(pack.files?.[0]?.path.endsWith(".zip")).toBe(true);
  }, 30_000);

  it("renders spell and arcane staffs", async () => {
    const elements = await expectOk("spell", "elements");
    expect((elements.text ?? "").length).toBeGreaterThan(0);
    const spell = await expectOk("spell", "render", { seed: 3 });
    expect(spell.files?.[0]?.path.endsWith(".png")).toBe(true);
    const arcane = await expectOk("arcane", "render", { size: 64 });
    expect(arcane.files?.[0]?.path.endsWith(".png")).toBe(true);
  }, 30_000);

  it("renders a sword preset", async () => {
    const render = await expectOk("sword", "render", { preset: "Hyperion", size: 64 });
    expect(render.files?.[0]?.path.endsWith(".png")).toBe(true);
  });

  it("renders advanced weapon pixels, models and animations", async () => {
    const shapes = await expectOk("adv", "shapes");
    expect(shapes.text).toContain("sword");
    const render = await expectOk("adv", "render", { shape: "sword", size: 32, seed: 1 });
    expect(render.files?.[0]?.path.endsWith(".png")).toBe(true);
    const model = await expectOk("adv", "model", { shape: "sword", size: 32 });
    expect(model.files?.[0]?.path.endsWith(".json")).toBe(true);
    const anim = await expectOk("adv", "anim", { shape: "sword", size: 32, frames: 3 });
    expect(anim.files?.length).toBe(2);
  }, 30_000);

  it("runs the texcraft commands (texture / variant / effect / convert)", async () => {
    await expectOk("tex", "list-effects");
    const textureId = await firstId("tex", "list-textures", (row: never) =>
      String(row).split("\t")[0],
    );
    const texture = await expectOk("tex", "texture", { id: textureId, size: 16, seed: 7 });
    expect(texture.files?.[0]?.path.endsWith(".png")).toBe(true);

    const variantId = await firstId("tex", "list-variants", (row: never) =>
      String(row).split("\t")[0],
    );
    const variant = await expectOk("tex", "variant", { id: variantId, sample: "sword", size: 16, frame: "strip" });
    expect(variant.files?.[0]?.path.endsWith(".png")).toBe(true);

    const effectId = await firstId("tex", "list-effects", (row: never) =>
      String(row).split("\t")[0],
    );
    const effect = await expectOk("tex", "effect", { id: effectId, sample: "sword", size: 16 });
    expect(effect.files?.[0]?.path.endsWith(".png")).toBe(true);

    const presetId = await firstId("tex", "list-presets", (row: never) => String(row).split("\t")[0]);
    const rendered = await expectOk("tex", "render", { preset: presetId, sample: "sword", size: 16 });
    const inline = rendered.files?.[0]?.base64 ?? "";
    const converted = await expectOk("tex", "convert", { in: inline, colors: 8 });
    expect(converted.files?.[0]?.path.endsWith(".png")).toBe(true);
  }, 30_000);

  it("generates Fabric mod projects through the mod engines", async () => {
    const sample = await expectOk("mythiccraft", "sample", { name: "testmod" });
    const project = JSON.parse(Buffer.from(sample.files?.[0]?.base64 ?? "", "base64").toString("utf8"));
    const built = await expectOk("mythiccraft", "build", { project });
    expect((built.data as { count: number }).count).toBeGreaterThan(5);

    const forgeSample = await expectOk("mythic", "sample");
    const forgeProject = JSON.parse(Buffer.from(forgeSample.files?.[0]?.base64 ?? "", "base64").toString("utf8"));
    const forge = await expectOk("mythic", "build", { project: forgeProject });
    expect((forge.data as { count: number }).count).toBeGreaterThan(5);
  }, 60_000);

  it("reports unknown engines and commands as data", async () => {
    const missing = await run("nope", "render");
    expect(missing.ok).toBe(false);
    const badCommand = await run("voxel", "explode");
    expect(badCommand.ok).toBe(false);
    if (!badCommand.ok) expect(badCommand.error).toContain("unknown voxel command");
  });
});
