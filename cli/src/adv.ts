import { writeFileSync } from "node:fs";
import { A, B, G, R, type Pix } from "../../weapons/advanced-minecraft-asset-generator/src/lib/pixel/core";
import { ANIM_TYPES, buildAnimation, infoFromPix, type AnimLayer, type AnimType } from "../../weapons/advanced-minecraft-asset-generator/src/lib/pixel/animations";
import { framesToStrip, mcmeta } from "../../weapons/advanced-minecraft-asset-generator/src/lib/pixel/export";
import { DEFAULT_SETTINGS, renderWeapon, type GenSettings } from "../../weapons/advanced-minecraft-asset-generator/src/lib/pixel/generator";
import { buildModel, buildModelJson, DEFAULT_MODEL } from "../../weapons/advanced-minecraft-asset-generator/src/lib/pixel/model3d";
import { MATERIALS } from "../../weapons/advanced-minecraft-asset-generator/src/lib/pixel/palettes";
import { SHAPES } from "../../weapons/advanced-minecraft-asset-generator/src/lib/pixel/shapes";
import { arg, cmd, fail } from "./argv";
import { encodePng } from "../../texture/texcraft/src/lib/pngCodec";
import type { Tex } from "../../texture/texcraft/src/lib/tex";

function pixToTex(p: Pix): Tex {
  const d = new Uint8ClampedArray(p.w * p.h * 4);
  for (let i = 0; i < p.w * p.h; i++) {
    const c = p.data[i]!;
    d[i * 4] = R(c); d[i * 4 + 1] = G(c); d[i * 4 + 2] = B(c); d[i * 4 + 3] = A(c);
  }
  return { w: p.w, h: p.h, d };
}

function settings(): GenSettings {
  const shape = arg("shape", DEFAULT_SETTINGS.shape)!;
  if (!SHAPES.some((s) => s.id === shape)) fail(`unknown shape: ${shape} (see adv:shapes)`);
  const material = arg("material", DEFAULT_SETTINGS.material)!;
  if (!MATERIALS.some((m) => m.id === material)) fail(`unknown material: ${material} (see adv:materials)`);
  const size = Number(arg("size", String(DEFAULT_SETTINGS.size)));
  if (![16, 32, 64].includes(size)) fail(`bad size: ${size} (16|32|64)`);
  return {
    ...DEFAULT_SETTINGS,
    shape,
    material,
    material2: arg("material2", DEFAULT_SETTINGS.material2)!,
    size: size as 16 | 32 | 64,
    style: (arg("style", DEFAULT_SETTINGS.style) ?? DEFAULT_SETTINGS.style) as GenSettings["style"],
    seed: Number(arg("seed", String(DEFAULT_SETTINGS.seed))),
  };
}

const command = cmd();

if (command === "shapes") {
  for (const s of SHAPES) console.log(`${s.id}\t${s.category}\t${s.nameJa}`);
} else if (command === "materials") {
  for (const m of MATERIALS) console.log(`${m.id}\t${m.nameJa}`);
} else if (command === "anims") {
  for (const a of ANIM_TYPES) console.log(`${a.id}\t${a.nameJa}`);
} else if (command === "render") {
  const out = arg("out") ?? fail("usage: adv:render [--shape sword] [--material ruby] [--size 32] [--seed 1] --out file.png");
  const result = renderWeapon(settings());
  writeFileSync(out, encodePng(pixToTex(result.pix)));
  console.log(`wrote ${out} (${result.pix.w}x${result.pix.h}, shape=${result.settings.shape}, material=${result.settings.material})`);
} else if (command === "model") {
  const out = arg("out") ?? fail("usage: adv:model [--shape sword] [--material ruby] [--size 32] [--seed 1] --out model.json");
  const result = renderWeapon(settings());
  const { elements } = buildModel(result.pix, DEFAULT_MODEL, result);
  const json = buildModelJson(elements, `${result.settings.shape}.png`, DEFAULT_MODEL, result.pix.w);
  writeFileSync(out, JSON.stringify(json, null, 2));
  console.log(`wrote ${out} (shape=${result.settings.shape}, elements=${elements.length})`);
} else if (command === "anim") {
  const out = arg("out") ?? fail("usage: adv:anim [--shape sword] [--material ruby] [--layers glow_pulse,sparkle] [--frames 4] --out strip.png");
  const result = renderWeapon(settings());
  const types = (arg("layers", "glow_pulse") ?? "glow_pulse").split(",").map((s) => s.trim()).filter(Boolean) as AnimType[];
  const layers: AnimLayer[] = types.map((type) => ({ type, intensity: 1, speed: 1, enabled: true }));
  const frameCount = Number(arg("frames", "4"));
  const frames = buildAnimation(result.pix, infoFromPix(result.pix), layers, frameCount);
  const strip = framesToStrip(frames);
  writeFileSync(out, encodePng(pixToTex(strip)));
  const meta = mcmeta(2, false, frames.length);
  writeFileSync(`${out}.mcmeta`, typeof meta === "string" ? meta : JSON.stringify(meta, null, 2));
  console.log(`wrote ${out} (${strip.w}x${strip.h}, frames=${frames.length}) + ${out}.mcmeta`);
} else {
  console.log(`adv commands: shapes | materials | anims | render [--shape <id>] [--material <id>] [--size 16|32|64] [--seed N] --out file.png | model [--shape <id>] [--material <id>] --out model.json | anim [--shape <id>] [--layers t1,t2] [--frames 4] --out strip.png`);
}
