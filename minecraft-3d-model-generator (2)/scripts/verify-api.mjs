import assert from "node:assert/strict";
import { PNG } from "pngjs";
import { unzipSync, strFromU8 } from "fflate";
import { readFile } from "node:fs/promises";

const base = "http://localhost:3000";
const settings = {
  name: "API validation model",
  kind: "sword",
  prompt: "氷のように青いクリスタル",
  quality: "high",
  style: "fantasy",
  detail: 72,
  width: 16,
  height: 32,
  depth: 4,
  symmetric: true,
  autoUV: true,
  seed: 42,
};
async function post(path, body) {
  const response = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assert.ok(
    response.ok,
    `${path}: ${response.status} ${response.ok ? "" : await response.text()}`,
  );
  return response;
}
const catalog = (
  await (await post("/api/variants", { settings, family: "theme" })).json()
).variants;
assert.equal(catalog.length, 24);
for (const kind of catalog.map((v) => v.settings.kind)) {
  const { model } = await (
    await post("/api/models", {
      settings: { ...settings, kind },
      persist: false,
    })
  ).json();
  assert.ok(model.cubes.length > 10);
  assert.equal(model.settings.kind, kind);
  for (const cube of model.cubes) {
    for (let a = 0; a < 3; a++) assert.ok(cube.to[a] > cube.from[a]);
    assert.ok(
      cube.uv[0] >= 0 &&
        cube.uv[1] >= 0 &&
        cube.uv[2] <= 64 &&
        cube.uv[3] <= 64,
    );
  }
  console.log(kind, "geometry valid,", model.cubes.length, "elements");
}
const staffSettings = {
  ...settings,
  kind: "staff",
  name: "Animated staff",
  floaters: "orbit",
  effect: "magic",
  animation: "spin",
};
const staffModel = await (
  await post("/api/models", { settings: staffSettings, persist: false })
).json();
const floaterCubes = staffModel.model.cubes.filter(
  (cube) => cube.layer === "floater",
);
assert.ok(floaterCubes.length >= 9, "expected orbit floaters");
assert.ok(
  floaterCubes.some((cube) => cube.emissive),
  "expected emissive floaters",
);
const bbStaff = await (
  await post("/api/export", { settings: staffSettings, format: "bbmodel" })
).json();
const floaterGroup = bbStaff.outliner[0].children.find(
  (child) => typeof child === "object" && child.name === "floaters",
);
assert.ok(floaterGroup, "expected a floaters group in the outliner");
assert.equal(bbStaff.elements.length, staffModel.model.cubes.length);
assert.equal(bbStaff.animations.length, 1);
assert.equal(bbStaff.animations[0].name, "floaters_spin");
assert.ok(
  bbStaff.animations[0].animators[floaterGroup.uuid],
  "animation must target the floaters group",
);
assert.ok(
  bbStaff.elements.some((e) => e.render_mode === "emissive"),
  "expected emissive render mode",
);
console.log(
  "Animated staff: floaters group, spin animation, and emissive marks validated",
);
const image = new PNG({ width: 32, height: 32 });
for (let i = 0; i < image.data.length; i += 4) {
  image.data[i] = 70;
  image.data[i + 1] = 130;
  image.data[i + 2] = 205;
  image.data[i + 3] = 255;
}
const atlas = {
  source: "data:image/png;base64," + PNG.sync.write(image).toString("base64"),
  width: 32,
  height: 32,
  name: "validation.png",
};
const custom = { ...settings, atlas };
const { model } = await (
  await post("/api/models", { settings: custom, persist: false })
).json();
assert.deepEqual(model.palette, Array(8).fill("#4682cd"));
assert.equal(model.texture.source, atlas.source);
for (const c of model.cubes) assert.ok(c.uv[2] <= 32 && c.uv[3] <= 32);
console.log("Custom PNG colors, UV mapping, and original texture validated");
const bb = await (
  await post("/api/export", { settings: custom, format: "bbmodel" })
).json();
assert.equal(bb.meta.model_format, "java_block");
assert.equal(bb.textures[0].source, atlas.source);
assert.equal(bb.elements.length, model.cubes.length);
assert.equal(new Set(bb.elements.map((e) => e.uuid)).size, bb.elements.length);
assert.equal(bb.outliner[0].children.length, bb.elements.length);
assert.ok(bb.elements.every((e) => Object.keys(e.faces).length === 6));
console.log(
  "Blockbench format, embedded texture, UUIDs, and scene hierarchy valid",
);
const archive = unzipSync(
  new Uint8Array(
    await (
      await post("/api/export", { settings: custom, format: "resourcepack" })
    ).arrayBuffer(),
  ),
);
assert.equal(
  JSON.parse(strFromU8(archive["pack.mcmeta"])).pack.pack_format,
  46,
);
assert.ok(archive["assets/minecraft/items/diamond_sword.json"]);
assert.ok(archive["assets/voxelforge/textures/item/model.png"]);
const java = JSON.parse(
  strFromU8(archive["assets/voxelforge/models/item/model.json"]),
);
assert.equal(java.elements.length, model.cubes.length);
for (const e of java.elements) {
  assert.ok(e.from.every((n) => n >= -16) && e.to.every((n) => n <= 32));
  for (const face of Object.values(e.faces))
    assert.ok(face.uv.every((n) => n >= 0 && n <= 16));
}
console.log(
  "Minecraft 1.21.4 resource pack and normalized model UVs validated",
);
const png = await (
  await post("/api/export", { settings: custom, format: "png" })
).arrayBuffer();
assert.equal(PNG.sync.read(Buffer.from(png)).width, 32);
const invalid = await fetch(base + "/api/models", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ settings: { ...settings, kind: "invalid" } }),
});
assert.equal(invalid.status, 400);
const invalidId = await fetch(base + "/api/models/not-a-uuid");
assert.equal(invalidId.status, 400);
const invalidAtlas = await fetch(base + "/api/models", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    settings: { ...settings, atlas: { source: "data:image/png;base64,bad" } },
  }),
});
assert.equal(invalidAtlas.status, 400);
console.log("Invalid templates, model IDs, and PNG files correctly rejected");
const { project } = await (await post("/api/models", { settings })).json();
const loaded = await (await fetch(base + "/api/models/" + project.id)).json();
assert.equal(loaded.project.name, settings.name);
assert.equal(loaded.project.model.cubes.length, project.model.cubes.length);
assert.equal(
  (await fetch(base + "/api/models/" + project.id, { method: "DELETE" }))
    .status,
  200,
);
assert.equal((await fetch(base + "/api/models/" + project.id)).status, 404);
console.log(
  "Database creation, retrieval, deletion, and missing record behavior validated",
);
const variantResponse = await post("/api/variants", {
  settings: { ...settings, kind: "staff" },
  family: "all",
});
const { variants } = await variantResponse.json();
assert.equal(variants.length, 13 + catalog.length);
for (const kind of ["drill", "cannon", "mechblade"]) {
  const { model } = await (
    await post("/api/models", {
      settings: { ...settings, kind },
      persist: false,
    })
  ).json();
  assert.ok(model.cubes.length > 25, `${kind} too small`);
  assert.ok(
    model.cubes.some((cube) => cube.emissive),
    `${kind} has no lit parts`,
  );
}
const transformed = await (
  await post("/api/models", {
    settings: { ...settings, kind: "mechblade", action: "transform" },
    persist: false,
  })
).json();
const mechBb = await (
  await post("/api/export", {
    settings: transformed.model.settings,
    format: "bbmodel",
  })
).json();
const mechKeys = Object.values(mechBb.animations[0].animators)[0].keyframes;
assert.ok(
  mechKeys.some(
    (keyframe) =>
      keyframe.channel === "scale" && keyframe.data_points[0].y === 0.5,
  ),
);
assert.equal(mechBb.meta.model_format, "free");
console.log("Mechanical templates and transform scale channel validated");
assert.ok(
  variants.every(
    (variant) => variant.cubes.length > 10 && !("atlas" in variant.settings),
  ),
);
const badFamily = await fetch(base + "/api/variants", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ settings, family: "nope" }),
});
assert.equal(badFamily.status, 400);
const variantPack = unzipSync(
  new Uint8Array(
    await (
      await post("/api/export", {
        settings,
        format: "variantpack",
        family: "tiers",
      })
    ).arrayBuffer(),
  ),
);
const dispatch = JSON.parse(
  strFromU8(variantPack["assets/minecraft/items/diamond_sword.json"]),
);
assert.equal(dispatch.model.type, "minecraft:range_dispatch");
assert.equal(dispatch.model.entries.length, 6);
assert.ok(
  Object.keys(variantPack).filter((path) => path.endsWith(".bbmodel"))
    .length === 6,
);
console.log(
  `Variant API (${variants.length} variants) and CMD variant pack (6 tiers) validated`,
);

const finishedSettings = {
  ...settings,
  gradient: {
    enabled: true,
    mode: "radial",
    from: "#551133",
    to: "#ffccdd",
    strength: 75,
    steps: 8,
    blend: "mix",
  },
  attachments: [
    {
      id: "apihalo",
      kind: "halo",
      position: [0, 5, 0],
      scale: 1,
      material: 3,
      floating: true,
      emissive: true,
    },
  ],
  customCubes: [
    {
      name: "custom_apitest",
      label: "API cube",
      from: [1, 1, 1],
      to: [3, 3, 3],
      color: "#ef2234",
      material: 3,
      uv: [2, 2, 14, 10],
    },
  ],
};
const finished = (
  await (
    await post("/api/models", { settings: finishedSettings, persist: false })
  ).json()
).model;
assert.ok(finished.texture.name.includes("finished"));
assert.ok(finished.cubes.some((c) => c.name.startsWith("attachment_apihalo_")));
const pngData = PNG.sync.read(
  Buffer.from(finished.texture.source.split(",")[1], "base64"),
);
assert.equal(pngData.width, finished.texture.width);
const finishedBb = await (
  await post("/api/export", { settings: finishedSettings, format: "bbmodel" })
).json();
assert.equal(finishedBb.textures[0].source, finished.texture.source);
const hiddenName = finished.cubes[0].name;
const hiddenJavaZip = unzipSync(
  new Uint8Array(
    await (
      await post("/api/export", {
        settings: {
          ...finishedSettings,
          edits: [{ target: hiddenName, hidden: true }],
        },
        format: "resourcepack",
      })
    ).arrayBuffer(),
  ),
);
const hiddenModel = JSON.parse(
  strFromU8(hiddenJavaZip["assets/voxelforge/models/item/model.json"]),
);
assert.equal(hiddenModel.elements.length, finished.cubes.length - 1);
console.log(
  "Gradient, editable decorations, custom cubes and hidden-part exports validated",
);
console.log("All API checks passed.");
