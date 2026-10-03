/**
 * Native-resolution proof suite.
 *
 * 16× and 32× intentionally share the classic template family.
 * 64× must satisfy all of the following:
 *  - built by native64.ts, not getTemplate(..., 64)
 *  - many mixed 4×4 blocks (nearest-neighbour enlargement has zero)
 *  - native one-pixel material structures
 *  - materially different from a 16→64 nearest-neighbour grid
 *  - generateTexture reports `native64`
 *
 * Run: npx tsx scripts/resolution.ts
 */
import { getItem } from "@/lib/catalog";
import { generateTexture } from "@/lib/generate";
import {
  NATIVE64_TEMPLATE_IDS,
  getNative64Template,
  native64Diagnostics,
  validateNative64Templates,
} from "@/lib/native64";
import { getTemplate, validateAllTemplates } from "@/lib/templates";

function nearest4(g: string[][]): string[][] {
  return Array.from({ length: 64 }, (_, y) =>
    Array.from({ length: 64 }, (_, x) => g[Math.floor(y / 4)]![Math.floor(x / 4)]!),
  );
}

function materialAgreement(a: string[][], b: string[][]): number {
  let same = 0;
  let union = 0;
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const av = a[y]![x]!;
      const bv = b[y]![x]!;
      if (av === "." && bv === ".") continue;
      union++;
      if (av === bv) same++;
    }
  return same / Math.max(1, union);
}

function silhouetteIou(a: string[][], b: string[][]): number {
  let intersection = 0;
  let union = 0;
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const av = a[y]![x] !== ".";
      const bv = b[y]![x] !== ".";
      if (av || bv) union++;
      if (av && bv) intersection++;
    }
  return intersection / Math.max(1, union);
}

console.log("== classic family ==");
validateAllTemplates([16, 32]);
console.log("16× / refined 32× templates valid");

console.log("\n== native 64 family ==");
validateNative64Templates();
console.log(`${NATIVE64_TEMPLATE_IDS.length} independently-authored 64× templates valid`);

let minMixed = 1;
let minOnePx = Infinity;
let maxMaterialAgreement = 0;
let minSilhouetteIou = 1;
let maxSilhouetteIou = 0;
let badMode = 0;

for (const id of NATIVE64_TEMPLATE_IDS) {
  const classic = nearest4(getTemplate(id, 16));
  const native = getNative64Template(id);
  const diag = native64Diagnostics(id);
  const agreement = materialAgreement(classic, native);
  const iou = silhouetteIou(classic, native);
  minMixed = Math.min(minMixed, diag.mixedBlockRatio);
  minOnePx = Math.min(minOnePx, diag.onePixelFeatures);
  maxMaterialAgreement = Math.max(maxMaterialAgreement, agreement);
  minSilhouetteIou = Math.min(minSilhouetteIou, iou);
  maxSilhouetteIou = Math.max(maxSilhouetteIou, iou);
  // Native should preserve the archetype while clearly being a different model.
  if (diag.mixedBlockRatio < 0.18) throw new Error(`${id}: block-scaled geometry`);
  if (diag.onePixelFeatures < 4) throw new Error(`${id}: no native one-pixel structure`);
  if (agreement > 0.82) throw new Error(`${id}: too similar to nearest-neighbour enlargement (${agreement})`);
}

// Production-path assertion: representative item from each broad family.
for (const itemId of [
  "hyperion",
  "terminator",
  "spirit_sceptre",
  "titanium_drill",
  "necron_chestplate",
  "hegemony_artifact",
  "golden_dragon_pet",
  "inferno_minion",
]) {
  const item = getItem(itemId)!;
  const out = generateTexture({
    itemId,
    resolution: 64,
    seed: 4242,
    styleMix: [{ id: "wither_sovereign", weight: 1 }],
    signatureMix: [{ id: "overhaul_intricate", weight: 1 }],
    rarity: item.rarity,
    hueShift: 0,
    glow: 48,
    metallic: 60,
    chaos: 25,
  });
  if (out.renderMode !== "native64" || out.width !== 64 || out.pixels.length !== 64 * 64 * 4) badMode++;
}
if (badMode) throw new Error(`${badMode} production renders missed native64 path`);

console.log({
  minimumMixed4x4Ratio: Number(minMixed.toFixed(3)),
  minimumOnePixelFeatures: minOnePx,
  maximumAgreementWith16xEnlargement: Number(maxMaterialAgreement.toFixed(3)),
  nativeVsClassicSilhouetteIouRange: [Number(minSilhouetteIou.toFixed(3)), Number(maxSilhouetteIou.toFixed(3))],
  productionNativeModeFailures: badMode,
});
console.log("\nPASS: 64× is a separate native template family, not an enlarged 16/32 model.");
