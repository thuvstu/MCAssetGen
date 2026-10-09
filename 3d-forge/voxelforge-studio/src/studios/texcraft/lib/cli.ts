import { readFileSync, writeFileSync } from "node:fs";
import { EFFECTS, applyStack, defaultParams, newLayer } from "./effects";
import { GROUPS, VARIANTS, VARIANT_MAP } from "./evolution";
import { PARTS, PART_MAP, stampPart } from "./parts";
import { TEX_GROUPS, TEXTURES, generateTexture as genProcTexture } from "./pfTextures";
import { PALETTES, reduceTex } from "./pixelConvert";
import { decodePng, encodePng } from "./pngCodec";
import { PRESETS, presetLayers } from "./presets";
import { SAMPLES } from "./samples";
import { resizeTex, type Tex } from "./tex";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const [command] = process.argv.slice(2);

function loadBase(size: number): Tex {
  const input = arg("in");
  if (input) return decodePng(new Uint8Array(readFileSync(input)));
  const sample = SAMPLES.find((s) => s.id === (arg("sample") ?? "sword")) ?? fail(`unknown sample: ${arg("sample")}`);
  return resizeTex(sample.make(), size, size);
}

if (command === "list-effects") {
  for (const e of EFFECTS) console.log(`${e.id}\t${e.category}\t${e.name}`);
} else if (command === "list-presets") {
  for (const p of PRESETS) console.log(`${p.id}\t${p.name}`);
} else if (command === "list-samples") {
  for (const s of SAMPLES) console.log(`${s.id}\t${s.kind}\t${s.name}`);
} else if (command === "list-palettes") {
  for (const name of Object.keys(PALETTES)) console.log(name);
} else if (command === "render") {
  const out = arg("out") ?? fail("usage: render --preset <id> [--sample <id>] [--size 16] [--seed N] --out file.png");
  const preset = PRESETS.find((p) => p.id === arg("preset")) ?? fail(`unknown preset: ${arg("preset")}`);
  const sample = SAMPLES.find((s) => s.id === (arg("sample") ?? "sword")) ?? fail(`unknown sample: ${arg("sample")}`);
  const size = Number(arg("size", "16"));
  const seed = Number(arg("seed", "7"));
  void seed;
  const layers = presetLayers(preset);
  const base = resizeTex(sample.make(), size, size);
  const result = applyStack(base, layers, 0.5);
  writeFileSync(out, encodePng(result));
  console.log(`wrote ${out} (${result.w}x${result.h}, preset=${preset.id}, sample=${sample.id})`);
} else if (command === "convert") {
  const input = arg("in") ?? fail("usage: convert --in file.png [--palette <name>|kmeans] [--colors 16] --out file.png");
  const out = arg("out") ?? fail("usage: convert --in file.png [--palette <name>|kmeans] [--colors 16] --out file.png");
  const names = Object.keys(PALETTES);
  const want = arg("palette", names[0]) ?? names[0];
  const palette = names.includes(want) ? want : names.find((n) => n.toLowerCase().startsWith(want.toLowerCase())) ?? names.find((n) => n.toLowerCase().includes(want.toLowerCase()));
  if (!palette) fail(`unknown palette: ${want} (see list-palettes)`);
  const colors = Number(arg("colors", "16"));
  const src = decodePng(new Uint8Array(readFileSync(input)));
  const auto = PALETTES[palette!] === null;
  const result = reduceTex(src, auto ? null : palette!, colors);
  writeFileSync(out, encodePng(result));
  console.log(`wrote ${out} (${result.w}x${result.h}, palette=${palette}${auto ? `, colors=${colors}` : ""})`);
} else if (command === "list-textures") {
  const group = arg("group");
  for (const t of TEXTURES) {
    if (group && t.group !== group) continue;
    console.log(`${t.id}\t${t.group}\t${t.name}`);
  }
} else if (command === "texture") {
  const id = arg("id") ?? fail("usage: texture --id <texture> [--size 16] [--seed 7] --out file.png");
  const out = arg("out") ?? fail("usage: texture --id <texture> [--size 16] [--seed 7] --out file.png");
  if (!TEXTURES.some((t) => t.id === id)) fail(`unknown texture: ${id} (see list-textures)`);
  const size = Number(arg("size", "16"));
  const seed = Number(arg("seed", "7"));
  const img = genProcTexture(id, size, seed);
  const tex: Tex = { w: img.width, h: img.height, d: new Uint8ClampedArray(img.data) };
  writeFileSync(out, encodePng(tex));
  console.log(`wrote ${out} (${tex.w}x${tex.h}, texture=${id}, seed=${seed})`);
} else if (command === "list-parts") {
  const cat = arg("category");
  for (const p of PARTS) {
    if (cat && p.category !== cat) continue;
    console.log(`${p.id}\t${p.category}\t${p.name}`);
  }
} else if (command === "stamp") {
  const id = arg("part") ?? fail("usage: stamp --part <id> [--in file.png] [--sample <id>] [--size 16] [--recolor #hex] --out file.png");
  const out = arg("out") ?? fail("usage: stamp --part <id> [--in file.png] [--sample <id>] [--size 16] [--recolor #hex] --out file.png");
  const part = PART_MAP[id] ?? fail(`unknown part: ${id} (see list-parts)`);
  const base = loadBase(Number(arg("size", "16")));
  const result = stampPart(base, part, "over", 100, arg("recolor"));
  writeFileSync(out, encodePng(result));
  console.log(`wrote ${out} (${result.w}x${result.h}, part=${part.id})`);
} else if (command === "list-variants") {
  const group = arg("group");
  for (const v of VARIANTS) {
    if (group && v.group !== group) continue;
    console.log(`${v.id}\t${v.group}\t${v.name}${v.animated ? "\tanimated" : ""}`);
  }
} else if (command === "list-groups") {
  for (const g of GROUPS) console.log(`${g.id}\t${g.name}`);
  console.log(`groups: ${TEX_GROUPS.join(" / ")}`);
} else if (command === "variant") {
  const id = arg("id") ?? fail("usage: variant --id <variant> [--in file.png] [--sample <id>] [--size 16] [--seed 7] [--accent #hex] [--frame 0|strip] --out file.png");
  const out = arg("out") ?? fail("usage: variant --id <variant> [--in file.png] [--sample <id>] [--size 16] [--seed 7] [--accent #hex] [--frame 0|strip] --out file.png");
  const def = VARIANT_MAP[id] ?? fail(`unknown variant: ${id} (see list-variants)`);
  const base = loadBase(Number(arg("size", "16")));
  const seed = Number(arg("seed", "7"));
  const frames = def.build({ base, accent: arg("accent", "#ffcf3d")!, seed, frames: def.animated ? 6 : 1 });
  const want = arg("frame", "0")!;
  if (want === "strip") {
    const strip: Tex = { w: base.w, h: base.h * frames.length, d: new Uint8ClampedArray(base.w * base.h * frames.length * 4) };
    frames.forEach((f, i) => strip.d.set(f.d, i * base.w * base.h * 4));
    writeFileSync(out, encodePng(strip));
    console.log(`wrote ${out} (${strip.w}x${strip.h}, variant=${def.id}, frames=${frames.length})`);
  } else {
    const frame = frames[Number(want)] ?? frames[0]!;
    writeFileSync(out, encodePng(frame));
    console.log(`wrote ${out} (${frame.w}x${frame.h}, variant=${def.id}, frame=${want}/${frames.length})`);
  }
} else if (command === "effect") {
  const id = arg("id") ?? fail("usage: effect --id <effect> [--sample <id>] [--size 16] [--params k=v,k=v] --out file.png");
  const out = arg("out") ?? fail("usage: effect --id <effect> [--sample <id>] [--size 16] [--params k=v,k=v] --out file.png");
  const def = EFFECTS.find((e) => e.id === id) ?? fail(`unknown effect: ${id}`);
  const sample = SAMPLES.find((s) => s.id === (arg("sample") ?? "sword")) ?? fail(`unknown sample: ${arg("sample")}`);
  const size = Number(arg("size", "16"));
  const params = { ...defaultParams(def) };
  for (const pair of (arg("params", "") ?? "").split(",").filter(Boolean)) {
    const [k, v] = pair.split("=");
    if (k && v !== undefined) params[k] = Number.isNaN(Number(v)) ? v : Number(v);
  }
  const base = resizeTex(sample.make(), size, size);
  const result = applyStack(base, [newLayer(def.id, params)], 0.5);
  writeFileSync(out, encodePng(result));
  console.log(`wrote ${out} (${result.w}x${result.h}, effect=${def.id})`);
} else {
  console.log(`mcasset — TexCraft CLI
usage:
  mcasset list-effects|list-presets|list-samples|list-palettes
  mcasset list-textures [--group <name>] | list-parts [--category <id>] | list-variants [--group <id>] | list-groups
  mcasset render --preset <id> [--sample <id>] [--size 16] --out file.png
  mcasset convert --in file.png [--palette <name>] [--colors 16] --out file.png
  mcasset effect --id <effect> [--sample <id>] [--size 16] [--params k=v,k=v] --out file.png
  mcasset texture --id <texture> [--size 16] [--seed 7] --out file.png
  mcasset stamp --part <id> [--in file.png] [--sample <id>] [--size 16] [--recolor #hex] --out file.png
  mcasset variant --id <variant> [--in file.png] [--sample <id>] [--size 16] [--seed 7] [--accent #hex] [--frame 0|strip] --out file.png`);
}
