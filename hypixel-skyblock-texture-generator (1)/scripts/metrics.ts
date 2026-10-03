/**
 * Dev tool: objective evidence that each essence (signature / palette) really
 * changes the render, and that the tonal ramp matches "clean pack" shading.
 *   npx tsx scripts/metrics.ts
 */
import { getItem } from "@/lib/catalog";
import { generateTexture } from "@/lib/generate";
import { computeField } from "@/lib/shade";
import { PALETTES, SIGNATURES } from "@/lib/styles";
import { getTemplate } from "@/lib/templates";

type Render = { id: string; pixels: number[]; size: number };

function render(
  itemId: string,
  sig: string,
  pal: string,
  seed = 4242,
  resolution: 16 | 32 | 64 = 16,
): Render {
  const item = getItem(itemId)!;
  const gen = generateTexture({
    itemId,
    resolution,
    seed,
    styleMix: [{ id: pal, weight: 1 }],
    signatureMix: [{ id: sig, weight: 1 }],
    rarity: item.rarity,
    hueShift: 0,
    glow: 45,
    metallic: 55,
    chaos: 30,
    templateId: item.templates[0],
  });
  return { id: `${sig}+${pal}`, pixels: gen.pixels, size: gen.width };
}

function lumAt(r: Render, i: number): number {
  const a = r.pixels[i * 4 + 3] ?? 0;
  if (a < 24) return -1;
  return (
    (0.299 * r.pixels[i * 4]! + 0.587 * r.pixels[i * 4 + 1]! + 0.114 * r.pixels[i * 4 + 2]!) *
    (a / 255)
  );
}

function histogram(r: Render): number[] {
  const buckets = [0, 0, 0, 0, 0];
  let n = 0;
  for (let i = 0; i < r.size * r.size; i++) {
    if ((r.pixels[i * 4 + 3] ?? 0) < 200) continue;
    const l = lumAt(r, i);
    if (l < 0) continue;
    n++;
    buckets[Math.min(4, Math.floor((l / 256) * 5))]!++;
  }
  return buckets.map((b) => (n ? b / n : 0));
}

function opaqueCount(r: Render): number {
  let n = 0;
  for (let i = 0; i < r.size * r.size; i++) if ((r.pixels[i * 4 + 3] ?? 0) >= 200) n++;
  return n;
}

function rms(a: Render, b: Render): number {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < a.size * a.size; i++) {
    for (let c = 0; c < 4; c++) {
      const av = a.pixels[i * 4 + c] ?? 0;
      const bv = b.pixels[i * 4 + c] ?? 0;
      sum += (av - bv) ** 2;
      n++;
    }
  }
  return Math.sqrt(sum / n);
}

/** Outline quality: how dark is the silhouette edge, how bright the lit rim. */
function edgeReport(r: Render, templateId: string): string {
  const grid = getTemplate(templateId);
  const field = computeField(
    r.size === 16 ? grid : grid.flatMap((row) => [0, 1].map(() => row.flatMap((c) => [c, c]))),
  );
  const light: [number, number] = [-0.62, -0.78];
  let edgeDark = 0;
  let edgeLit = 0;
  let edgeTotal = 0;
  let rimBright = 0;
  let rimTotal = 0;
  for (let y = 0; y < r.size; y++) {
    for (let x = 0; x < r.size; x++) {
      const i = y * r.size + x;
      if (!field.mask[i] || field.dist[i] !== 0) continue;
      const l = lumAt(r, i);
      if (l < 0) continue;
      edgeTotal++;
      if (l < 70) edgeDark++;
      const lam = (field.nx[i] ?? 0) * light[0] + (field.ny[i] ?? 0) * light[1];
      if (lam > 0.35) {
        rimTotal++;
        if (l > 165) rimBright++;
      } else if (l > 190) edgeLit++;
    }
  }
  return `edge${edgeTotal ? Math.round((edgeDark / edgeTotal) * 100) : 0}% rim${
    rimTotal ? Math.round((rimBright / rimTotal) * 100) : 0
  }% strayHi${edgeLit}`;
}

const item = getItem("hyperion")!;
console.log("== signature separation (same palette/seed/shape) ==");
const sigRenders = SIGNATURES.map((s) => render("hyperion", s.id, "wither_sovereign"));
for (const r of sigRenders) {
  const h = histogram(r);
  console.log(
    `${r.id.padEnd(34)} opaque=${String(opaqueCount(r)).padStart(3)} hist=[${h
      .map((v) => v.toFixed(2))
      .join(" ")}] ${edgeReport(r, item.templates[0]!)}`,
  );
}
let minSig = Infinity;
let sumSig = 0;
let pairsSig = 0;
for (let i = 0; i < sigRenders.length; i++)
  for (let j = i + 1; j < sigRenders.length; j++) {
    const d = rms(sigRenders[i]!, sigRenders[j]!);
    minSig = Math.min(minSig, d);
    sumSig += d;
    pairsSig++;
  }
console.log(`signature RMS  min=${minSig.toFixed(1)} avg=${(sumSig / pairsSig).toFixed(1)}`);

console.log("\n== palette separation (same signature/seed/shape) ==");
const palRenders = PALETTES.map((p) => render("hyperion", "reborn_clean", p.id));
for (const r of palRenders) console.log(`${r.id.padEnd(34)} opaque=${opaqueCount(r)}`);
let minPal = Infinity;
let sumPal = 0;
let pairsPal = 0;
for (let i = 0; i < palRenders.length; i++)
  for (let j = i + 1; j < palRenders.length; j++) {
    const d = rms(palRenders[i]!, palRenders[j]!);
    minPal = Math.min(minPal, d);
    sumPal += d;
    pairsPal++;
  }
console.log(`palette RMS    min=${minPal.toFixed(1)} avg=${(sumPal / pairsPal).toFixed(1)}`);

console.log("\n== seed separation (same essence) ==");
const seeds = [1, 2, 3, 4, 5, 6].map((s) => render("hyperion", "reborn_clean", "dragonwake", s * 7919));
let minSeed = Infinity;
let sumSeed = 0;
let pairsSeed = 0;
for (let i = 0; i < seeds.length; i++)
  for (let j = i + 1; j < seeds.length; j++) {
    const d = rms(seeds[i]!, seeds[j]!);
    minSeed = Math.min(minSeed, d);
    sumSeed += d;
    pairsSeed++;
  }
console.log(`seed RMS       min=${minSeed.toFixed(1)} avg=${(sumSeed / pairsSeed).toFixed(1)}`);

console.log("\n== mixing sanity (50/50 blends sit between parents) ==");
const a = render("hyperion", "reborn_clean", "reborn_flare");
const b = render("hyperion", "depth_3d", "voidthorn");
const item2 = getItem("hyperion")!;
const mixGen = generateTexture({
  itemId: "hyperion",
  resolution: 16,
  seed: 4242,
  styleMix: [
    { id: "reborn_flare", weight: 1 },
    { id: "voidthorn", weight: 1 },
  ],
  signatureMix: [
    { id: "reborn_clean", weight: 1 },
    { id: "depth_3d", weight: 1 },
  ],
  rarity: item2.rarity,
  hueShift: 0,
  glow: 45,
  metallic: 55,
  chaos: 30,
  templateId: item2.templates[0],
});
const mixR: Render = { id: "mix", pixels: mixGen.pixels, size: mixGen.width };
console.log(
  `mix vs A=${rms(mixR, a).toFixed(1)} mix vs B=${rms(mixR, b).toFixed(1)} A vs B=${rms(a, b).toFixed(1)}`,
);

console.log("\n== resolution ladder (16 / 32 / 64) ==");
for (const res of [16, 32, 64] as const) {
  const r = render("hyperion", "faithful_smooth", "gemnest", 4242, res);
  const colors = new Set<string>();
  let opaque = 0;
  let lumSum = 0;
  let hi = 0;
  let mid = 0;
  // local contrast: mean absolute luminance difference to the right neighbour
  let edge = 0;
  let edgeN = 0;
  for (let i = 0; i < r.size * r.size; i++) {
    const a = r.pixels[i * 4 + 3] ?? 0;
    if (a < 24) continue;
    opaque++;
    colors.add(`${r.pixels[i * 4]! >> 2},${r.pixels[i * 4 + 1]! >> 2},${r.pixels[i * 4 + 2]! >> 2}`);
    const l = 0.299 * r.pixels[i * 4]! + 0.587 * r.pixels[i * 4 + 1]! + 0.114 * r.pixels[i * 4 + 2]!;
    lumSum += l;
    if (l > 200) hi++;
    if (l > 90 && l <= 200) mid++;
    const x = i % r.size;
    if (x < r.size - 1 && (r.pixels[(i + 1) * 4 + 3] ?? 0) > 24) {
      const l2 =
        0.299 * r.pixels[(i + 1) * 4]! +
        0.587 * r.pixels[(i + 1) * 4 + 1]! +
        0.114 * r.pixels[(i + 1) * 4 + 2]!;
      edge += Math.abs(l - l2);
      edgeN++;
    }
  }
  console.log(
    `${String(res).padStart(3)}x  opaque=${String(opaque).padStart(5)} colors=${String(colors.size).padStart(4)} ` +
      `lum=${(lumSum / opaque).toFixed(0)} mid%=${((mid / opaque) * 100).toFixed(0)} hi%=${((hi / opaque) * 100).toFixed(0)} ` +
      `detail(ΔL)=${(edge / Math.max(1, edgeN)).toFixed(1)}`,
  );
}

console.log("\n== 64x across every signature ==");
for (const s of SIGNATURES) {
  const r = render("hyperion", s.id, "dragonwake", 4242, 64);
  const colors = new Set<string>();
  let opaque = 0;
  let hi = 0;
  let lum = 0;
  for (let i = 0; i < r.pixels.length; i += 4) {
    if ((r.pixels[i + 3] ?? 0) < 24) continue;
    opaque++;
    colors.add(`${r.pixels[i]! >> 2},${r.pixels[i + 1]! >> 2},${r.pixels[i + 2]! >> 2}`);
    const l = 0.299 * r.pixels[i]! + 0.587 * r.pixels[i + 1]! + 0.114 * r.pixels[i + 2]!;
    lum += l;
    if (l > 200) hi++;
  }
  console.log(
    `${s.id.padEnd(17)} opaque=${String(opaque).padStart(5)} colors=${String(colors.size).padStart(4)} lum=${(lum / opaque).toFixed(0)} hi%=${((hi / opaque) * 100).toFixed(0)}`,
  );
}
