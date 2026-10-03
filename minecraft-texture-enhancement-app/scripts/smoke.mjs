import { build } from "esbuild";
import { writeFileSync } from "node:fs";

// ---- ImageData ポリフィル (Node) ----
class ImageDataStub {
  constructor(a, b, c) {
    if (typeof a === "number") {
      this.width = a; this.height = b;
      this.data = new Uint8ClampedArray(a * b * 4);
    } else {
      this.data = a; this.width = b; this.height = c ?? (a.length / 4 / b);
    }
  }
}
globalThis.ImageData = ImageDataStub;

await build({
  entryPoints: ["src/lib/__smoke.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: ".smoke/out.mjs",
  logLevel: "warning",
});

const M = await import(new URL("../.smoke/out.mjs", import.meta.url).href);

const sizes = [16, 32, 64, 128];
let checks = 0, fails = [];
const bad = (v) => !Number.isFinite(v);

function scan(img, tag) {
  checks++;
  const d = img.data;
  for (let i = 0; i < d.length; i++) if (bad(d[i])) { fails.push(`${tag}: NaN at ${i}`); return; }
  let painted = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 0) painted++;
  if (painted === 0) fails.push(`${tag}: 出力が完全に透明`);
  return painted;
}

// 1) 全テクスチャ生成
console.log("── textures ──");
for (const t of M.TEXTURES) {
  for (const s of [16, 48, 128]) {
    try {
      const img = t.gen(s, 5);
      scan(img, `tex:${t.id}@${s}`);
    } catch (e) { fails.push(`tex:${t.id}@${s} → ${e.message}`); }
  }
}
console.log(`${M.TEXTURES.length} textures OK`);

// 2) 全エフェクト単体（既定値 + ランダム値 + 端値）
console.log("── effects ──");
for (const fx of M.ALL_FX) {
  const variants = [];
  variants.push({ tag: "default", values: M.defaults(fx) });
  const min = {}, max = {};
  for (const p of fx.params) {
    if (p.type === "range") { min[p.key] = p.min; max[p.key] = p.max; }
    else if (p.type === "select") { min[p.key] = p.options[0].v; max[p.key] = p.options[p.options.length - 1].v; }
    else if (p.type === "color") { min[p.key] = "#000000"; max[p.key] = "#ffffff"; }
    else { min[p.key] = false; max[p.key] = true; }
  }
  variants.push({ tag: "min", values: min }, { tag: "max", values: max });
  for (const v of variants) {
    for (const s of [16, 64]) {
      for (const t of ["stone", "diamond_sword", "glass"]) {
        try {
          const base = M.generateTexture(t, s, 3);
          const inst = M.makeInst(fx.id, v.values);
          const out = M.renderPipeline(base, [inst], 0.7, 3);
          scan(out, `fx:${fx.id}/${v.tag}@${s}/${t}`);
        } catch (e) { fails.push(`fx:${fx.id}/${v.tag}@${s}/${t} → ${e.message}`); }
      }
    }
  }
}
console.log(`${M.ALL_FX.length} effects × 3 variants × 2 sizes × 3 textures OK`);

// 3) プリセット + 時間経過フレーム
console.log("── presets ──");
for (const p of M.PRESETS) {
  try {
    const base = M.generateTexture(p.tex, p.size, 7);
    const insts = p.fx.map((f) => M.makeInst(f.id, f.values || {}));
    for (const t of [0, 0.5, 1.7, 5.3]) {
      scan(M.renderPipeline(base, insts, t, 3), `preset:${p.id}@t=${t}`);
    }
  } catch (e) { fails.push(`preset:${p.id} → ${e.message}`); }
}
console.log(`${M.PRESETS.length} presets OK`);

// 4) 全スタック（60種全部乗せ）
try {
  const base = M.generateTexture("cobblestone", 32, 3);
  const insts = M.ALL_FX.map((f) => M.makeInst(f.id));
  const t0 = Date.now();
  const out = M.renderPipeline(base, insts, 1.23, 3);
  scan(out, "ALL-STACK");
  console.log(`全 ${insts.length} エフェクト重ね掛け: ${Date.now() - t0}ms @32px`);
  const b128 = M.generateTexture("cobblestone", 128, 3);
  const t1 = Date.now();
  M.renderPipeline(b128, insts, 1.23, 3);
  console.log(`全 ${insts.length} エフェクト重ね掛け: ${Date.now() - t1}ms @128px`);
} catch (e) { fails.push(`ALL-STACK → ${e.message}`); }

console.log(`\n総チェック: ${checks}`);
if (fails.length) {
  const uniq = [...new Set(fails)];
  console.log(`\n!! 問題 ${uniq.length} 件:`);
  uniq.slice(0, 40).forEach((f) => console.log("  - " + f));
} else {
  console.log("✅ 全パス: NaN / 例外 / 空白出力なし");
}
writeFileSync(".smoke/result.json", JSON.stringify({ checks, fails: [...new Set(fails)] }, null, 2));
