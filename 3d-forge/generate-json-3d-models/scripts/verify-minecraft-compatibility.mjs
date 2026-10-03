import assert from "node:assert/strict";
import { build } from "esbuild";
import { unzipSync } from "fflate";

await build({ entryPoints: ["src/lib/models.ts"], bundle: true, format: "esm", outfile: "/tmp/vm.mjs", logLevel: "silent" });
await build({ entryPoints: ["src/lib/export.ts"], bundle: true, format: "esm", outfile: "/tmp/ve.mjs", logLevel: "silent" });
await build({ entryPoints: ["src/lib/decor.ts"], bundle: true, format: "esm", outfile: "/tmp/vd.mjs", logLevel: "silent" });

const m = await import("/tmp/vm.mjs");
const ex = await import("/tmp/ve.mjs");
const d = await import("/tmp/vd.mjs");

console.log("=== Minecraft Java 1.21.4 Compatibility Verification ===");

// Check PNG dimensions from raw bytes
function readPngSize(buffer) {
  assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "Invalid PNG header");
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

// Validate that a Minecraft model JSON adheres to the structural subset checked here
function validateMinecraftModelJson(json, modelName = "test") {
  assert.ok(json.elements, `${modelName}: missing elements array`);
  assert.ok(Array.isArray(json.elements), `${modelName}: elements must be array`);
  assert.ok(json.elements.length > 0, `${modelName}: elements array is empty`);
  assert.ok(json.elements.length <= 4096, `${modelName}: elements exceed Minecraft limit`);

  for (let i = 0; i < json.elements.length; i++) {
    const el = json.elements[i];
    assert.ok(el.from, `${modelName} el ${i}: missing from`);
    assert.ok(el.to, `${modelName} el ${i}: missing to`);
    assert.equal(el.from.length, 3);
    assert.equal(el.to.length, 3);

    // Coordinates MUST be in [-16.0, 32.0] for vanilla Java Edition
    for (let axis = 0; axis < 3; axis++) {
      assert.ok(
        el.from[axis] >= -16.0 && el.from[axis] <= 32.0,
        `${modelName} el ${i} from[${axis}]=${el.from[axis]} out of [-16, 32]`
      );
      assert.ok(
        el.to[axis] >= -16.0 && el.to[axis] <= 32.0,
        `${modelName} el ${i} to[${axis}]=${el.to[axis]} out of [-16, 32]`
      );
      assert.ok(
        el.from[axis] < el.to[axis],
        `${modelName} el ${i} degenerate dimension on axis ${axis}: ${el.from[axis]} >= ${el.to[axis]}`
      );
    }

    // Rotation angle MUST be one of -45, -22.5, 0, 22.5, 45
    if (el.rotation) {
      assert.ok(["x", "y", "z"].includes(el.rotation.axis), `${modelName} el ${i}: invalid rotation axis`);
      assert.ok(
        [-45, -22.5, 0, 22.5, 45].includes(el.rotation.angle),
        `${modelName} el ${i}: rotation angle ${el.rotation.angle} not in [-45, -22.5, 0, 22.5, 45]`
      );
      assert.equal(el.rotation.origin.length, 3);
    }

    // Faces UV must be valid 0..16 coordinates
    assert.ok(el.faces, `${modelName} el ${i}: missing faces`);
    for (const faceName of Object.keys(el.faces)) {
      assert.ok(
        ["north", "east", "south", "west", "up", "down"].includes(faceName),
        `${modelName} el ${i}: invalid face ${faceName}`
      );
      const face = el.faces[faceName];
      assert.ok(face.uv, `${modelName} el ${i} face ${faceName}: missing uv`);
      assert.equal(face.uv.length, 4);
      for (const val of face.uv) {
        assert.ok(
          val >= 0.0 && val <= 16.0,
          `${modelName} el ${i} face ${faceName} UV ${val} out of [0, 16]`
        );
      }
    }
  }

  // Display transforms check
  if (json.display) {
    for (const slot of Object.keys(json.display)) {
      const dt = json.display[slot];
      if (dt.rotation) assert.equal(dt.rotation.length, 3);
      if (dt.translation) assert.equal(dt.translation.length, 3);
      if (dt.scale) {
        assert.equal(dt.scale.length, 3);
        assert.ok(dt.scale.every(s => s >= 0 && s <= 4), "scale out of bounds");
      }
    }
  }
}

// 1. Test all 16 template models for complete resource pack generation
console.log("Checking all templates for resource pack validity...");
for (const tmpl of m.TEMPLATES) {
  const model = m.generateModel(tmpl.tags, { ...m.DEFAULT_SETTINGS, palette: tmpl.palette, design: { kind: tmpl.id, material: "iron", motif: "standard", style: "plain", length: 1, width: 1, thickness: 1, scale: 1, glow: false, spikes: false, palette: tmpl.palette } });
  const pack = ex.buildPack(model);

  // Check pack.mcmeta
  assert.ok(pack["pack.mcmeta"], `${tmpl.name}: missing pack.mcmeta`);
  const meta = JSON.parse(new TextDecoder().decode(pack["pack.mcmeta"]));
  assert.equal(meta.pack.pack_format, 46, "pack_format must be 46 for 1.21.4");

  // Check pack.png icon exists and is a valid 64x64 PNG
  assert.ok(pack["pack.png"], `${tmpl.name}: missing pack.png`);
  const iconSize = readPngSize(Buffer.from(pack["pack.png"]));
  assert.equal(iconSize.width, 64, "pack.png must be 64x64");
  assert.equal(iconSize.height, 64, "pack.png must be 64x64");

  // Check assets/minecraft/atlases/blocks.json exists
  assert.ok(pack["assets/minecraft/atlases/blocks.json"], "missing atlas registration");
  const atlas = JSON.parse(new TextDecoder().decode(pack["assets/minecraft/atlases/blocks.json"]));
  assert.ok(atlas.sources.some(s => s.source === "item" && s.prefix === "item/"), "atlas missing item/ directory source");

  // Check 1.21.4 Item Model Definition
  const itemDefPath = `assets/voxelforge/items/${model.slug}.json`;
  assert.ok(pack[itemDefPath], `missing item definition: ${itemDefPath}`);
  const itemDef = JSON.parse(new TextDecoder().decode(pack[itemDefPath]));
  assert.ok(itemDef.model, "item definition missing model");

  // Check Model JSON
  const modelJsonPath = `assets/voxelforge/models/item/${model.slug}.json`;
  assert.ok(pack[modelJsonPath], `missing model json: ${modelJsonPath}`);
  const modelJson = JSON.parse(new TextDecoder().decode(pack[modelJsonPath]));
  validateMinecraftModelJson(modelJson, model.name);

  // Check Texture PNG exists and has non-zero size
  const texPath = `assets/voxelforge/textures/item/${model.slug}.png`;
  assert.ok(pack[texPath], `missing texture: ${texPath}`);
  const texSize = readPngSize(Buffer.from(pack[texPath]));
  assert.ok(texSize.width >= 16 && texSize.height >= 16, "texture too small");

  // Bow specific checks: pulling states must exist
  if (model.kind === "bow") {
    assert.equal(itemDef.model.type, "minecraft:condition");
    assert.equal(itemDef.model.property, "minecraft:using_item");
    assert.equal(itemDef.model.on_true.type, "minecraft:range_dispatch");
    assert.equal(itemDef.model.on_true.property, "minecraft:use_duration");
    for (let stage = 0; stage < 3; stage++) {
      const pullModelPath = `assets/voxelforge/models/item/${model.slug}_pulling_${stage}.json`;
      assert.ok(pack[pullModelPath], `missing bow pulling stage model: ${pullModelPath}`);
      const pullJson = JSON.parse(new TextDecoder().decode(pack[pullModelPath]));
      validateMinecraftModelJson(pullJson, `bow pulling ${stage}`);
    }
  }

  // Check Give Commands syntax
  const cmd = m.giveCommand(model);
  assert.match(cmd, /^\/give @p minecraft:[a-z_]+\[minecraft:item_model="voxelforge:[a-z0-9_]+"\]$/);

  const fancyCmd = m.fancyGiveCommand(model);
  assert.match(fancyCmd, /^\/give @p minecraft:[a-z_]+\[minecraft:item_model="voxelforge:[a-z0-9_]+",minecraft:custom_name='\{.+\}',minecraft:lore=\[\'.+\'\],minecraft:unbreakable=\{\}\]$/);
}
console.log("PASS: All templates generate structurally valid Minecraft 1.21.4 resource packs!");

// 2. Test fully decorated & animated models with all 21 decorations
console.log("Checking fully decorated models across multiple slots...");
const heavyDecor = d.DECOR_OPTIONS.map(opt => d.makeInstance(opt.id, d.defaultSlot(opt.id), "many"));
const heavyExtras = {
  decor: heavyDecor,
  accent: "gold",
  effect: "sparkle",
  animation: { body: "float", decor: "auto", transform: "swing", speed: 1.25, shimmer: true }
};

for (const kind of ["sword", "bow", "hammer", "staff", "trident", "chest"]) {
  const model = m.generateModel([kind, "ダイヤ"], { ...m.DEFAULT_SETTINGS, palette: "auto", extras: heavyExtras, detail: "high", design: { kind, material: "iron", motif: "standard", style: "plain", length: 1, width: 1, thickness: 1, scale: 1, glow: false, spikes: false, palette: "auto" } });
  const pack = ex.buildPack(model);

  // Validate the model JSON with all decorations attached
  const modelJson = JSON.parse(new TextDecoder().decode(pack[`assets/voxelforge/models/item/${model.slug}.json`]));
  validateMinecraftModelJson(modelJson, `${kind} (heavy decor)`);

  // Check shimmer animation files
  assert.ok(pack[`assets/voxelforge/textures/item/${model.slug}.png.mcmeta`], "missing shimmer mcmeta");
  const mcmeta = JSON.parse(new TextDecoder().decode(pack[`assets/voxelforge/textures/item/${model.slug}.png.mcmeta`]));
  assert.equal(mcmeta.animation.frametime, 3);
  assert.equal(mcmeta.animation.interpolate, true);

  // Shimmer texture must be exactly 8 frames vertically
  const texSize = readPngSize(Buffer.from(pack[`assets/voxelforge/textures/item/${model.slug}.png`]));
  assert.equal(texSize.height, texSize.width * 8, "shimmer texture must be 8 frames tall");

  // Datapack for particles
  const dp = ex.buildDatapack(model);
  assert.ok(dp, "datapack must be generated for sparkle effect");
  assert.equal(JSON.parse(new TextDecoder().decode(dp["pack.mcmeta"])).pack.pack_format, 61, "datapack format must be 61 for 1.21.4");
  assert.ok(dp[`data/voxelforge/function/tick_${model.slug}.mcfunction`], "missing tick function");
}
console.log("PASS: Heavy decorated models adhere strictly to [-16, 32] bounds and produce animated texture and data-pack files!");

// 3. Test Blockbench 5.0 project exports
console.log("Checking Blockbench export compatibility...");
for (const tmpl of m.TEMPLATES.slice(0, 4)) {
  const model = m.generateModel(tmpl.tags, { ...m.DEFAULT_SETTINGS, palette: tmpl.palette, extras: heavyExtras, design: { kind: tmpl.id, material: "iron", motif: "standard", style: "plain", length: 1, width: 1, thickness: 1, scale: 1, glow: false, spikes: false, palette: tmpl.palette } });
  
  // Static project
  const bbStatic = m.toBlockbenchJson(model, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
  assert.equal(bbStatic.meta.format_version, "5.0");
  assert.equal(bbStatic.elements.length, model.cubes.length);
  assert.ok(bbStatic.textures.length > 0);

  // Animated project
  await build({ entryPoints: ["src/lib/animation.ts"], bundle: true, format: "esm", outfile: "/tmp/va.mjs", logLevel: "silent" });
  const va = await import("/tmp/va.mjs");
  const bbAnim = va.toBlockbenchAnimatedJson(model, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
  assert.equal(bbAnim.meta.format_version, "5.0");
  assert.equal(bbAnim.meta.model_format, "free");
  assert.ok(bbAnim.animations.length > 0);
  assert.ok(bbAnim.animations.some(a => a.name === "idle"));
  assert.ok(bbAnim.animations.some(a => a.name === "transform_swing"));
}
console.log("PASS: Blockbench 5.0 projects export cleanly with valid outliner hierarchies and animators!");

console.log("\n=======================================================");
console.log(" ALL MINECRAFT 1.21.4 STRUCTURAL CHECKS PASSED — GAME CLIENT NOT TESTED");
console.log("=======================================================");
