import { readFileSync, writeFileSync } from "node:fs";
import { EFFECTS, applyStack, defaultParams, newLayer } from "./effects";
import { PALETTES, reduceTex } from "./pixelConvert";
import { decodePng, encodePng } from "./pngCodec";
import { PRESETS, presetLayers } from "./presets";
import { SAMPLES } from "./samples";
import { resizeTex } from "./tex";

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
  mcasset render --preset <id> [--sample <id>] [--size 16] --out file.png
  mcasset convert --in file.png [--palette <name>] [--colors 16] --out file.png
  mcasset effect --id <effect> [--sample <id>] [--size 16] [--params k=v,k=v] --out file.png`);
}
