import { build } from "esbuild";
import { writeFileSync } from "node:fs";

// Node has no ImageData; stub it for fxutil-based (adapted PIXELFORGE) effects.
if (typeof globalThis.ImageData === "undefined") {
  globalThis.ImageData = class {
    constructor(a, b, c) {
      if (typeof a === "number") {
        this.width = a; this.height = b;
        this.data = new Uint8ClampedArray(a * b * 4);
      } else {
        this.data = a; this.width = b; this.height = c ?? a.length / 4 / b;
      }
    }
  };
}

// Bundle base libs and smoke every effect (default/min/max params).
await build({
  entryPoints: ["src/lib/__smoke.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: ".smoke/out.mjs",
  logLevel: "warning",
});

const M = await import(new URL("../.smoke/out.mjs", import.meta.url).href);

let checks = 0;
const fails = [];
const bad = (v) => !Number.isFinite(v);

function scan(tex, tag) {
  checks++;
  const d = tex.d;
  for (let i = 0; i < d.length; i++) if (bad(d[i])) { fails.push(`${tag}: NaN at ${i}`); return; }
  let painted = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 0) painted++;
  // invert/max legitimately zeroes alpha (alpha inversion at 100%)
  if (painted === 0 && tag !== "fx:invert/max") fails.push(`${tag}: output fully transparent`);
  return painted;
}

function seedTex() {
  const t = M.createTex(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const i = (y * 16 + x) * 4;
    t.d[i] = (x * 16) % 256; t.d[i + 1] = (y * 16) % 256; t.d[i + 2] = 128; t.d[i + 3] = 255;
  }
  return t;
}

console.log("smoke effects...");
for (const fx of M.EFFECTS) {
  const variants = [{ tag: "default", values: M.defaultParams(fx) }];
  const min = {}, max = {};
  for (const p of fx.params) {
    if (p.type === "range") { min[p.key] = p.min; max[p.key] = p.max; }
    else if (p.type === "select") { min[p.key] = p.options[0][0]; max[p.key] = p.options[p.options.length - 1][0]; }
    else if (p.type === "color") { min[p.key] = "#000000"; max[p.key] = "#ffffff"; }
    else { min[p.key] = false; max[p.key] = true; }
  }
  variants.push({ tag: "min", values: min }, { tag: "max", values: max });
  for (const v of variants) {
    try {
      const out = M.applyStack(seedTex(), [{ ...M.newLayer(fx.id), params: v.values }], 0.5);
      scan(out, `fx:${fx.id}/${v.tag}`);
    } catch (e) { fails.push(`fx:${fx.id}/${v.tag}: ${e.message}`); }
  }
}
console.log(`${M.EFFECTS.length} effects x 3 variants OK`);

const result = { checks, fails, at: new Date().toISOString() };
writeFileSync(".smoke/result.json", JSON.stringify(result, null, 2));
if (fails.length) {
  console.error(`FAIL ${fails.length}/${checks}`);
  for (const f of fails.slice(0, 20)) console.error(" - " + f);
  process.exit(1);
}
console.log(`PASS ${checks} checks`);
