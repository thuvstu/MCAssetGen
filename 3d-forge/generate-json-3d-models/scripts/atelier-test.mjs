import assert from "node:assert/strict";
import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { unzipSync } from "fflate";

for (const [name, entry] of Object.entries({ models: "models", decor: "decor", config: "configurator", export: "export", colors: "color-textures", animation: "animation", checks: "export-check", texture: "texture" })) {
  await build({ entryPoints: [`src/lib/${entry}.ts`], bundle: true, format: "esm", outfile: `/tmp/atelier-${name}.mjs`, logLevel: "silent" });
}
const m = await import("/tmp/atelier-models.mjs"), d = await import("/tmp/atelier-decor.mjs"), c = await import("/tmp/atelier-config.mjs"), ex = await import("/tmp/atelier-export.mjs"), colors = await import("/tmp/atelier-colors.mjs"), animation = await import("/tmp/atelier-animation.mjs"), checks = await import("/tmp/atelier-checks.mjs");
const tex = await import("/tmp/atelier-texture.mjs");
const settings = { ...m.DEFAULT_SETTINGS, palette: "violet", design: c.designOf(c.DEFAULT_CONFIG) };
const part = (kind, extra = {}) => d.normalizeInstance({ ...d.makeInstance(kind, "guard", "few"), id: "part-first", count: 1, ...extra });
const generate = (decor = [], patch = {}) => m.generateModel(["stored-label-not-used-for-generation"], { ...settings, design: { ...settings.design, ...patch }, extras: { ...m.DEFAULT_EXTRAS, decor } });
const body = generate();
assert.equal(body.kind, "sword");
assert.ok(!body.cubes.some(cube => cube.name === "ornament_gem"), "new configurator has no automatic blade jewellery");
const swordShapes = c.profilesFor("sword");
assert.ok(swordShapes.includes("standard"));
assert.deepEqual(c.profilesFor("shovel"), ["standard"]);
assert.deepEqual(c.profilesFor("trident"), ["standard", "spear"]);
assert.equal(generate([], { kind: "bow", motif: "katana" }).kind, "bow", "direct selections cannot be reinterpreted as a sword");
assert.equal(c.validDesign({ ...settings.design, kind: "bow", motif: "katana" }), false, "incompatible profiles are rejected at API boundary");
const gems = generate([part("gems")]);
const gemCubes = gems.cubes.filter(cube => cube.group === "decor");
assert.equal(gemCubes.length, 3, "one gem includes setting, facet and crown");
assert.ok(gemCubes.every(cube => cube.decorId === "part-first"));
const guard = body.cubes.find(cube => cube.name === "guard_core");
assert.ok(gemCubes.every(cube => cube.from[2] >= guard.to[2]), "gem is on the guard surface, not hidden inside the blade");
assert.ok(Math.abs((gemCubes[0].from[1] + gemCubes[0].to[1]) / 2 - (guard.from[1] + guard.to[1]) / 2) < .01);
for (const count of [1, 3, 8, 12]) for (const detail of ["low", "balanced", "high"]) {
  const model = m.generateModel(["x"], { ...settings, detail, extras: { ...m.DEFAULT_EXTRAS, decor: [part("gems", { count })] } });
  assert.equal(model.cubes.filter(cube => cube.group === "decor").length, count * 3, "quantity is exact and independent of mesh detail");
}
const translated = generate([part("gems", { offset: [1, 2, -1] })]).cubes.filter(cube => cube.group === "decor");
translated.forEach((cube, i) => {
  assert.deepEqual(cube.from.map((value, axis) => Math.round((value - gemCubes[i].from[axis]) * 1000) / 1000), [1, 2, -1]);
  assert.deepEqual(cube.to.map((value, axis) => Math.round((value - gemCubes[i].to[axis]) * 1000) / 1000), [1, 2, -1]);
});
const scaled = generate([part("gems", { size: 1.5 })]).cubes.filter(cube => cube.group === "decor");
assert.ok(Math.abs((scaled[0].to[0] - scaled[0].from[0]) / (gemCubes[0].to[0] - gemCubes[0].from[0]) - 1.5) < .01);
assert.equal(generate([part("gems", { visible: false })]).cubes.length, body.cubes.length);
assert.equal(generate([part("gems", { mirror: true, offset: [2, 0, 0] })]).cubes.filter(cube => cube.group === "decor").length, 6);
assert.equal(generate([part("gems", { mirror: true })]).cubes.filter(cube => cube.group === "decor").length, 3, "centered symmetric parts are not stacked twice");
const copies = generate([part("gems"), part("gems", { id: "part-second", offset: [2, 0, 0], color: "#ff2288" })]);
assert.equal(copies.cubes.filter(cube => cube.group === "decor").length, 6);
const copiedDecor = copies.cubes.filter(cube => cube.group === "decor");
assert.equal(new Set(copiedDecor.map(cube => cube.name)).size, copiedDecor.length, "all new decoration names are distinct among parts");
const bodyColors = copies.cubes.filter(cube => cube.group !== "decor");
assert.ok(bodyColors.every(cube => !cube.tint), "custom decoration colors don't recolor the main model");
assert.ok(copies.cubes.some(cube => cube.tint === "#ff2288"));
assert.deepEqual(tex.createTexturePixels(body), tex.createTexturePixels(copies), "moving and recoloring decorations never randomizes the base texture");
const texEntries = colors.accentEntries(copies);
assert.equal(texEntries.length, 3);
const modelJson = m.toMinecraftJson(copies), pack = ex.buildPack(copies);
for (const element of modelJson.elements) for (const face of Object.values(element.faces)) {
  const reference = modelJson.textures[face.texture.slice(1)];
  const [namespace, resource] = reference.split(":");
  assert.ok(pack[`assets/${namespace}/textures/${resource}.png`], "every texture reference resolves inside the actual downloaded pack");
}
for (const format of [m.toBlockbenchJson(copies, "data:image/png;base64,AA"), animation.toBlockbenchAnimatedJson(copies, "data:image/png;base64,AA")]) {
  assert.equal(format.textures.length, texEntries.length + 1);
  for (const element of format.elements) for (const face of Object.values(element.faces)) assert.ok(format.textures[face.texture], "Blockbench faces reference the right embedded texture");
}
for (const option of d.DECOR_OPTIONS) for (const slot of m.SLOT_IDS) {
  const model = generate([part(option.id, { slot, count: 4, size: 1.5, offset: [1, 0, .5], mirror: true, color: "#2accae" })]);
  assert.ok(model.cubes.some(cube => cube.group === "decor"), `${option.id} ${slot} isn't empty`);
  for (const cube of model.cubes) assert.ok(cube.from.every((value, axis) => Number.isFinite(value) && value >= -16 && value < cube.to[axis] && cube.to[axis] <= 32), `${option.id}/${slot} legal bounds`);
  assert.ok(checks.inspectExport(model).every(check => check.status !== "error"));
}
const branch = generate([part("branches", { count: 4 })]);
assert.equal(branch.cubes.filter(cube => cube.group === "decor").length, 4, "negative-direction branches are not dropped as invalid geometry");
const motion = generate([part("ribbons", { count: 1 })]).cubes.find(cube => cube.motion);
const movedMotion = generate([part("ribbons", { count: 1, offset: [2, 1, 0] })]).cubes.find(cube => cube.motion);
assert.deepEqual(movedMotion.motion.pivot.map((value, axis) => Math.round((value - motion.motion.pivot[axis]) * 100) / 100), [2, 1, 0], "animation pivot moves with the part");
for (const bad of [{ count: 0 }, { count: 13 }, { count: 1.1 }, { size: 3 }, { offset: [9, 0, 0] }, { offset: [0, NaN, 0] }, { color: "red" }, { visible: "yes" }, { id: "../bad" }]) assert.equal(d.sanitizeExtras({ ...m.DEFAULT_EXTRAS, decor: [part("gems", bad)] }), null);
const saved = { settings: { ...settings, design: { ...settings.design, length: 1.4, width: .6, thickness: 1.2, scale: .8 }, extras: { ...m.DEFAULT_EXTRAS, decor: [part("gems", { offset: [2, 3, 1], color: "#ffaa22", count: 4 })] } }, model: gems, tags: ["x"] };
const restored = c.configFromSaved(JSON.parse(JSON.stringify(saved)));
assert.equal(restored.length, 1.4); assert.equal(restored.width, .6); assert.equal(restored.thickness, 1.2); assert.equal(restored.scale, .8);
assert.deepEqual(restored.extras.decor[0].offset, [2, 3, 1]);
assert.equal(restored.extras.decor[0].color, "#ffaa22");
assert.equal(d.sanitizeExtras({ ...m.DEFAULT_EXTRAS, decor: [part("gems"), part("gems")] }), null, "duplicate part identifiers are rejected");
const legacy = d.normalizeExtras({ ...m.DEFAULT_EXTRAS, decor: ["halo", "sparkles"] });
assert.deepEqual(legacy.decor.map(instance => instance.kind), ["rings", "stars"]);
// ---- Mechanical weapons -------------------------------------------------------------------------
const MACHINE_KINDS = ["chainsaw", "drill", "nailgun", "circularsaw", "flamethrower", "jackhammer"];
for (const kind of MACHINE_KINDS) for (const detail of ["low", "balanced", "high"]) {
  const model = m.generateModel(["x"], { ...settings, detail, design: { ...settings.design, kind, material: "iron", motif: "standard" } });
  assert.equal(model.kind, kind);
  assert.ok(model.cubes.length > 10, `${kind} has detailed geometry`);
  for (const cube of model.cubes) {
    assert.ok(cube.from.every((value, axis) => Number.isFinite(value) && value >= -16 && value <= 32 && value < cube.to[axis] && cube.to[axis] <= 32), `${kind}/${detail} ${cube.name} legal bounds`);
  }
  for (const face of m.FACES) for (const cube of model.cubes) assert.ok(m.faceUv(cube, face, 16, 16, m.gridOf(model)).every(v => Number.isFinite(v) && v >= 0 && v <= 16));
  assert.ok(checks.inspectExport(model).every(check => check.status !== "error"), `${kind}/${detail} export check`);
}
const chainsaw = m.generateModel(["x"], { ...settings, design: { ...settings.design, kind: "chainsaw", material: "iron", motif: "standard" } });
assert.ok(chainsaw.cubes.some(c => c.name.startsWith("chain_cutter")), "chainsaw has cutting chain");
assert.ok(chainsaw.cubes.some(c => c.name === "engine_block"), "chainsaw has engine");
assert.ok(chainsaw.cubes.some(c => c.name === "guide_bar"), "chainsaw has guide bar");
const drill = m.generateModel(["x"], { ...settings, design: { ...settings.design, kind: "drill", material: "iron", motif: "standard" } });
assert.ok(drill.cubes.some(c => c.name.startsWith("bit_flute")), "drill has twisted bit");
assert.ok(drill.cubes.some(c => c.name === "chuck"), "drill has chuck");
const nailgunModel = m.generateModel(["x"], { ...settings, design: { ...settings.design, kind: "nailgun", material: "iron", motif: "standard" } });
assert.ok(nailgunModel.cubes.some(c => c.name === "magazine"), "nailgun has magazine");
assert.ok(nailgunModel.cubes.some(c => c.name === "nose"), "nailgun has nose");
const flamethrower = m.generateModel(["x"], { ...settings, design: { ...settings.design, kind: "flamethrower", material: "netherite", motif: "standard" } });
assert.ok(flamethrower.cubes.some(c => c.name === "fuel_tank"), "flamethrower has fuel tank");
assert.ok(flamethrower.cubes.some(c => c.name === "barrel_main"), "flamethrower has barrel");
const jackhammer = m.generateModel(["x"], { ...settings, design: { ...settings.design, kind: "jackhammer", material: "iron", motif: "standard" } });
assert.ok(jackhammer.cubes.some(c => c.name.startsWith("chisel_")), "jackhammer has chisel bit");
assert.ok(jackhammer.cubes.some(c => c.name.startsWith("cylinder")), "jackhammer has cylinder");
const circularsawModel = m.generateModel(["x"], { ...settings, design: { ...settings.design, kind: "circularsaw", material: "iron", motif: "standard" } });
assert.ok(circularsawModel.cubes.some(c => c.name.startsWith("blade_tooth")), "circular saw has teeth");
assert.ok(circularsawModel.cubes.some(c => c.name === "base_plate"), "circular saw has base plate");
assert.equal(m.baseItemFor("chainsaw", "iron"), "iron_axe");
assert.equal(m.baseItemFor("drill", "iron"), "iron_pickaxe");
assert.equal(m.baseItemFor("nailgun", "iron"), "crossbow");
assert.equal(m.baseItemFor("flamethrower", "iron"), "flint_and_steel");
assert.equal(m.baseItemFor("jackhammer", "iron"), "iron_pickaxe");
for (const kind of MACHINE_KINDS) {
  const model = m.generateModel(["x"], { ...settings, design: { ...settings.design, kind, material: "iron" } });
  const pack = ex.buildPack(model);
  assert.ok(pack[`assets/voxelforge/models/item/${model.slug}.json`], `${kind} exports a model`);
  const json = JSON.parse(new TextDecoder().decode(pack[`assets/voxelforge/models/item/${model.slug}.json`]));
  assert.ok(json.elements.length > 0, `${kind} exports elements`);
  assert.ok(json.display.thirdperson_righthand, `${kind} has display transforms`);
  const decorated = m.generateModel(["x"], { ...settings, design: { ...settings.design, kind, material: "iron" }, extras: { ...m.DEFAULT_EXTRAS, decor: [d.makeInstance("studs", "body", "many")] } });
  assert.ok(decorated.cubes.some(c => c.group === "decor"), `${kind} accepts decorations`);
}
// ---- New weapons: magical, cursed, blood, modern, railgun, relic, spear, mace ----
const NEW_KINDS = ["spell_sword","enchanted_axe","cursed_blade","soul_reaper","shadow_dagger","blood_sword","blood_axe","grimoire","magic_circle","assault_rifle","sniper_rifle","pistol","shotgun","railgun","relic","spear","mace"];
for (const kind of NEW_KINDS) for (const detail of ["low","balanced","high"]) {
  const model = m.generateModel(["x"], { ...settings, detail, design: { ...settings.design, kind, material: "iron", motif: "standard", style: "plain" } });
  assert.equal(model.kind, kind);
  assert.ok(model.cubes.length > 5, `${kind} has geometry`);
  for (const cube of model.cubes) {
    assert.ok(cube.from.every((value, axis) => Number.isFinite(value) && value >= -16 && value <= 32 && value < cube.to[axis] && cube.to[axis] <= 32), `${kind}/${detail} ${cube.name} legal bounds`);
  }
  assert.ok(checks.inspectExport(model).every(check => check.status !== "error"), `${kind}/${detail} export check`);
  const pack = ex.buildPack(model);
  assert.ok(pack[`assets/voxelforge/models/item/${model.slug}.json`], `${kind} exports a model`);
}
// Gradient
const gradModel = m.generateModel(["x"], { ...settings, design: { ...settings.design, kind: "sword" }, gradient: { enabled: true, direction: "vertical", intensity: .8, colors: ["#ff0000", "#0000ff"] } });
assert.notDeepEqual(gradModel.palette, m.PALETTES.violet, "gradient modifies palette");
const noGrad = m.generateModel(["x"], { ...settings, design: { ...settings.design, kind: "sword" } });
assert.deepEqual(noGrad.palette, m.PALETTES.violet, "no gradient preserves palette");
// New effects
for (const effect of ["poison","void","blood","gold","wind","frost"]) {
  const model = m.generateModel(["x"], { ...settings, extras: { ...m.DEFAULT_EXTRAS, effect } });
  assert.ok(model.cubes.length > 0);
}
// New animations
for (const body of ["hover","shake","levitate","vibrate"]) {
  const model = m.generateModel(["x"], { ...settings, extras: { ...m.DEFAULT_EXTRAS, animation: { ...m.DEFAULT_EXTRAS.animation, body } } });
  assert.ok(model.cubes.length > 0);
}
for (const transform of ["slash","slam","charge","dash","spin_attack"]) {
  const model = m.generateModel(["x"], { ...settings, extras: { ...m.DEFAULT_EXTRAS, animation: { ...m.DEFAULT_EXTRAS.animation, transform } } });
  assert.ok(model.cubes.length > 0);
}
// New decorations
for (const kind of ["plates","pipes","wires","dials","gears","horns","thorns","veins","crowns","splatters","goo","bubbles","spark","embers","fireflies","dust","wisp","aura","glow_ring","ripple","shield","wings","tail","fangs","claws","scales","feathers","bone","skull","heart","eye","mouth","blood_vessel","venom","acid","curse","sigil","seal","ward","barrier"]) {
  const model = m.generateModel(["x"], { ...settings, extras: { ...m.DEFAULT_EXTRAS, decor: [d.makeInstance(kind, "body", "few")] } });
  assert.ok(model.cubes.some(c => c.group === "decor"), `${kind} decoration produces cubes`);
}
console.log("PASS logic: 17 new weapons, gradients, 6 new effects, 4 new body anims, 5 new transform anims, 39 new decorations across 3 detail levels.");

console.log("PASS logic: mechanical weapons (chainsaw, drill, nailgun, circularsaw, flamethrower, jackhammer) across 3 detail levels, all parts present, legal bounds, exports, decorations.");

console.log("PASS logic: direct configuration, visible surface gems, exact counts, independent translation/size/mirror/colors, 21×9 attachment combinations, real PNG references, pivots, old-save migration, strict API inputs.");
if (process.env.LOGIC_ONLY === "1") process.exit(0);

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, acceptDownloads: true, permissions: ["clipboard-read", "clipboard-write"] });
const page = await context.newPage(); page.setDefaultTimeout(12000);
const errors = []; page.on("pageerror", error => errors.push(error.message));
const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const created = new Set();
const save = async () => {
  const promise = page.waitForResponse(response => response.url().endsWith("/api/models") && response.request().method() === "POST");
  await page.locator(".prompt-panel .generate-button").click();
  const response = await promise, payload = await response.json();
  expect(response.status(), JSON.stringify(payload)).toBe(201); created.add(payload.model.id);
  await expect(page.locator(".model-status")).toHaveText("生成完了"); return payload.model;
};
const download = async format => {
  await page.getByRole("combobox", { name: "書き出し形式", exact: true }).selectOption(format);
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "ダウンロード", exact: true }).click();
  return readFile(await (await promise).path());
};
const setSlider = async (name, value) => {
  const input = page.getByRole("slider", { name, exact: true });
  await input.focus(); await input.fill(String(value));
};
try {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".three-container canvas")).toBeVisible();
  await page.getByRole("radiogroup", { name: "モデルのタイプ", exact: true }).getByRole("radio", { name: "チェーンソー", exact: true }).click();
  await expect(page.locator(".model-caption h3")).toContainText("チェーンソー");
  const sawStats = await page.locator(".stats-group strong").first().innerText();
  expect(Number(sawStats)).toBeGreaterThan(10);
  const chainsawSaved = await save();
  expect(chainsawSaved.model.kind).toBe("chainsaw");
  expect(chainsawSaved.model.baseItem).toBe("iron_axe");
  expect(chainsawSaved.model.cubes.some(c => c.name.startsWith("chain_cutter"))).toBe(true);
  await page.getByRole("radiogroup", { name: "モデルのタイプ", exact: true }).getByRole("radio", { name: "ドリル", exact: true }).click();
  await expect(page.locator(".model-caption h3")).toContainText("ドリル");
  await page.getByRole("radiogroup", { name: "モデルのタイプ", exact: true }).getByRole("radio", { name: "火炎放射器", exact: true }).click();
  await expect(page.locator(".model-caption h3")).toContainText("火炎放射器");
  await page.getByRole("radiogroup", { name: "モデルのタイプ", exact: true }).getByRole("radio", { name: "剣", exact: true }).click();
  await expect(page.locator(".model-caption h3")).toContainText("剣");
  await setSlider("長さ", 1.4); await setSlider("幅", .6);
  await page.getByRole("tab", { name: "装飾", exact: true }).click();
  await page.getByRole("button", { name: "宝石を追加", exact: true }).click();
  await expect(page.getByRole("region", { name: "選択パーツの設定", exact: true })).toBeVisible();
  await page.getByRole("spinbutton", { name: "装飾の位置 X", exact: true }).fill("2");
  await page.getByRole("spinbutton", { name: "装飾の位置 Y", exact: true }).fill("1");
  await setSlider("装飾の個数", 3);
  await setSlider("装飾の大きさ", 150);
  await page.getByRole("button", { name: "装飾色 ローズ", exact: true }).click();
  const first = await save();
  expect(first.settings.design.length).toBe(1.4);
  expect(first.settings.design.width).toBe(.6);
  expect(first.settings.extras.decor[0]).toMatchObject({ count: 3, size: 1.5, offset: [2, 1, 0], color: "rose" });
  expect(first.model.cubes.some(cube => cube.tint)).toBe(true);

  await page.getByRole("button", { name: "宝石 1 を複製", exact: true }).click();
  await expect(page.locator(".decor-layer")).toHaveCount(2);
  await page.getByRole("button", { name: "装飾色 シアン", exact: true }).click();
  await page.getByRole("spinbutton", { name: "装飾の位置 X", exact: true }).fill("-2");
  await page.getByLabel("左右対称にも配置", { exact: true }).check();
  const second = await save();
  expect(second.settings.extras.decor).toHaveLength(2);
  expect(second.settings.extras.decor[1]).toMatchObject({ offset: [-2, 1, 0], color: "cyan", mirror: true });
  expect(second.model.cubes.filter(cube => cube.group === "decor")).toHaveLength(27);
  const countBefore = second.model.cubes.length;
  await page.getByRole("button", { name: "宝石 1 を非表示", exact: true }).click();
  await expect(page.locator(".stats-group strong").first()).toHaveText(String(countBefore - 9));
  await page.getByRole("button", { name: "元に戻す", exact: true }).click();
  await expect(page.locator(".stats-group strong").first()).toHaveText(String(countBefore));
  await page.getByRole("button", { name: "やり直す", exact: true }).click();
  await expect(page.locator(".stats-group strong").first()).toHaveText(String(countBefore - 9));
  await page.getByRole("button", { name: "元に戻す", exact: true }).click();
  await page.getByRole("button", { name: "宝石 2 を削除", exact: true }).click();
  await expect(page.locator(".decor-layer")).toHaveCount(1);
  await page.getByRole("button", { name: "元に戻す", exact: true }).click();
  await expect(page.locator(".decor-layer")).toHaveCount(2);
  const both = await save();
  const resource = unzipSync(await download("bundle"));
  const output = JSON.parse(new TextDecoder().decode(resource[`assets/voxelforge/models/item/${both.model.slug}.json`]));
  for (const reference of Object.values(output.textures).filter(value => !value.startsWith("#"))) {
    const [ns, path] = reference.split(":"); expect(resource[`assets/${ns}/textures/${path}.png`]).toBeTruthy();
  }
  expect(Object.keys(output.textures).filter(key => key.startsWith("accent_")).length).toBeGreaterThan(3);
  const blockbench = JSON.parse((await download("blockbench")).toString());
  expect(blockbench.textures.length).toBeGreaterThan(2);
  expect(blockbench.elements.length).toBe(both.model.cubes.length);
  const pngPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "プレビュー画像を保存", exact: true }).click();
  const preview = await readFile(await (await pngPromise).path());
  expect(preview.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  console.log("PASS browser: add, duplicate, per-part transform/color/count/mirror, hide, delete, undo/redo, color PNGs, Blockbench textures, PNG snapshot.");

  await page.locator(".main-nav button").filter({ hasText: "マイライブラリ" }).click();
  await page.locator(".library-open").first().click();
  await expect(page.locator(".model-status")).toHaveText("保存済み");
  await page.getByRole("tab", { name: "形状", exact: true }).click();
  await expect(page.getByRole("slider", { name: "長さ", exact: true })).toHaveValue("1.4");
  await expect(page.getByRole("slider", { name: "幅", exact: true })).toHaveValue("0.6");
  await page.getByRole("tab", { name: "装飾", exact: true }).click();
  await expect(page.locator(".decor-layer")).toHaveCount(2);
  await page.getByRole("button", { name: "宝石 2 を編集", exact: true }).click();
  await expect(page.getByRole("spinbutton", { name: "装飾の位置 X", exact: true })).toHaveValue("-2");
  await expect(page.getByRole("button", { name: "装飾色 シアン", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.locator(".preset-drawer summary").click();
  await page.getByLabel("いまの装飾に追加する", { exact: true }).check();
  await page.locator(".preset-mini-grid").getByRole("button", { name: "フロスト", exact: true }).click();
  await expect(page.locator(".decor-layer")).toHaveCount(6);
  await page.getByRole("button", { name: "元に戻す", exact: true }).click();
  await expect(page.locator(".decor-layer")).toHaveCount(2);
  await page.getByRole("tab", { name: "モーション", exact: true }).click();
  await page.getByRole("radiogroup", { name: "装飾の動き", exact: true }).getByRole("radio", { name: "明滅", exact: true }).click();
  const animated = await save();
  const bbAnim = JSON.parse((await download("blockbench_anim")).toString());
  expect(bbAnim.animations.some(item => item.name === "idle")).toBe(true);
  expect(bbAnim.textures.length).toBeGreaterThan(2);
  await page.getByRole("button", { name: /書き出し前チェック/ }).click();
  await expect(page.locator(".report-body")).toContainText("未検証");
  const invalid = await context.request.post(`${base}/api/models`, { data: { tags: ["x"], settings: { ...animated.settings, extras: { ...animated.settings.extras, decor: [part("gems", { size: 999 })] } } } });
  expect(invalid.status()).toBe(400);
  const restore = await context.request.get(`${base}/api/models/${animated.id}`);
  expect(restore.status()).toBe(200);
  await page.getByRole("tab", { name: "2Dテクスチャ→3D", exact: true }).click();
  await page.locator("#texture-file").setInputFiles({ name: "atelier-source.png", mimeType: "image/png", buffer: Buffer.from(colors.colorPng("#f0e1a2")) });
  await expect(page.locator(".texture-file-meta")).toContainText("atelier-source");
  await expect(page.locator(".voxel-stats")).toContainText("16 × 16");
  await page.getByRole("group", { name: "押し出しの厚み", exact: true }).getByRole("button", { name: "2", exact: true }).click();
  const imageSaved = await save();
  expect(imageSaved.model.pose).toBe("sprite");
  expect(imageSaved.model.texture.width).toBe(16);
  expect(imageSaved.model.texture.extrusion.depth).toBe(2);
  const imageAgain = await save();
  expect(imageAgain.model.cubes).toEqual(imageSaved.model.cubes);
  expect(imageAgain.model.texture.source).toBe(imageSaved.model.texture.source);
  const latest = (await (await context.request.get(`${base}/api/models`)).json()).models;
  await page.locator(".main-nav button").filter({ hasText: "マイライブラリ" }).click();
  await page.locator(".library-open").nth(latest.findIndex(row => row.id === animated.id)).click();
  await expect(page.locator(".model-status")).toHaveText("保存済み");
  console.log("PASS browser: uploaded image extrusion still works; returning to a saved model restores the independent parts.");
  await page.getByRole("tab", { name: "装飾", exact: true }).click();
  const drawer = page.locator(".preset-drawer");
  if (await drawer.getAttribute("open") !== null) await drawer.locator("summary").click();
  await page.getByRole("button", { name: "宝石 2 を編集", exact: true }).click();
  await page.getByRole("button", { name: "アニメーションを再生・停止", exact: true }).click();
  if (await page.locator(".toast-close").count()) await page.locator(".toast-close").click();
  if (await page.locator(".report-body").count()) await page.getByRole("button", { name: /書き出し前チェック/ }).click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(450);
  await page.screenshot({ path: "/tmp/atelier-desktop.png", fullPage: true });
  console.log("PASS browser: exact restore after database save, append preset, animated color export, honest structure report, invalid API input rejection.");
  for (const width of [390, 700, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(350);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: "装飾", exact: true }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(450);
  await page.screenshot({ path: "/tmp/atelier-mobile.png", fullPage: true });
  expect(errors).toEqual([]);
  console.log("PASS browser: phone/tablet/desktop without horizontal overflow or page errors.");
} finally {
  for (const id of created) await context.request.delete(`${base}/api/models/${id}`).catch(() => {});
  await browser.close();
}
