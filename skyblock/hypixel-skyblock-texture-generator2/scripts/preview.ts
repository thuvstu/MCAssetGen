/**
 * Dev tool: renders contact sheets so the generated pixel art can be inspected
 * as real images. Run: npx tsx scripts/preview.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CATALOG, getItem } from "@/lib/catalog";
import { generateTexture } from "@/lib/generate";
import { encodePng } from "@/lib/png";
import { PALETTES, SIGNATURES, type MixEntry } from "@/lib/styles";
import { TEMPLATE_DEFS, getTemplate, validateAllTemplates } from "@/lib/templates";
import { shadeGrid } from "@/lib/shade";
import { mixPalettes, mixSignatures } from "@/lib/styles";
import { hexToRgb } from "@/lib/colors";

const OUT = ".preview";
mkdirSync(OUT, { recursive: true });

type Canvas = { w: number; h: number; data: number[] };

function makeCanvas(w: number, h: number, bg = "#101320"): Canvas {
  const rgb = hexToRgb(bg);
  const data = new Array(w * h * 4).fill(0);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = rgb[0];
    data[i * 4 + 1] = rgb[1];
    data[i * 4 + 2] = rgb[2];
    data[i * 4 + 3] = 255;
  }
  return { w, h, data };
}

function blit(
  c: Canvas,
  pixels: number[],
  pw: number,
  ph: number,
  ox: number,
  oy: number,
  scale: number,
): void {
  for (let y = 0; y < ph * scale; y++) {
    for (let x = 0; x < pw * scale; x++) {
      const sx = Math.floor(x / scale);
      const sy = Math.floor(y / scale);
      const si = (sy * pw + sx) * 4;
      const a = pixels[si + 3] ?? 0;
      if (a < 8) continue;
      const dx = ox + x;
      const dy = oy + y;
      if (dx < 0 || dy < 0 || dx >= c.w || dy >= c.h) continue;
      const di = (dy * c.w + dx) * 4;
      const t = a / 255;
      c.data[di] = c.data[di]! * (1 - t) + pixels[si]! * t;
      c.data[di + 1] = c.data[di + 1]! * (1 - t) + pixels[si + 1]! * t;
      c.data[di + 2] = c.data[di + 2]! * (1 - t) + pixels[si + 2]! * t;
      c.data[di + 3] = 255;
    }
  }
}

function save(c: Canvas, name: string): string {
  const png = encodePng(c.w, c.h, c.data.map((v) => Math.max(0, Math.min(255, Math.round(v)))));
  const path = join(OUT, name);
  writeFileSync(path, Buffer.from(png as unknown as Uint8Array));
  return path;
}

function uniqueColors(pixels: number[]): number {
  const set = new Set<string>();
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3]! < 8) continue;
    set.add(`${pixels[i]!},${pixels[i + 1]!},${pixels[i + 2]!}`);
  }
  return set.size;
}

function coverage(pixels: number[]): number {
  let n = 0;
  for (let i = 3; i < pixels.length; i += 4) if (pixels[i]! > 8) n++;
  return n / (pixels.length / 4);
}

const ITEMS = [
  "hyperion",
  "terminator",
  "superior_helmet",
  "bee_pet",
  "stonk",
  "plasmaflux",
  "aspect_of_the_dragons",
  "necron_chestplate",
];

function sheet(
  rowDefs: { label: string; sig: MixEntry[]; pal: MixEntry[] }[],
  itemIds: string[],
  scale: number,
  name: string,
  seed = 4242,
): void {
  const cell = 16 * scale;
  const pad = 6;
  const c = makeCanvas(itemIds.length * (cell + pad) + pad, rowDefs.length * (cell + pad) + pad);
  rowDefs.forEach((row, ry) => {
    itemIds.forEach((id, rx) => {
      const item = getItem(id)!;
      const gen = generateTexture({
        itemId: id,
        resolution: 16,
        seed: seed + rx * 7 + ry * 13,
        styleMix: row.pal,
        signatureMix: row.sig,
        rarity: item.rarity,
        hueShift: 0,
        glow: 45,
        metallic: 55,
        chaos: 30,
      });
      blit(c, gen.pixels, gen.width, gen.height, pad + rx * (cell + pad), pad + ry * (cell + pad), scale);
    });
  });
  console.log("wrote", save(c, name));
}

validateAllTemplates();
console.log("templates ok:", TEMPLATE_DEFS.length);

// 1. every template, same essence → silhouette + auto shading sanity
{
  const cols = 8;
  const scale = 7;
  const cell = 16 * scale;
  const pad = 6;
  const rows = Math.ceil(TEMPLATE_DEFS.length / cols);
  const c = makeCanvas(cols * (cell + pad) + pad, rows * (cell + pad) + pad);
  TEMPLATE_DEFS.forEach((def, i) => {
    const rx = i % cols;
    const ry = Math.floor(i / cols);
    const grid = getTemplate(def.id);
    const out = shadeGrid(grid, {
      sig: mixSignatures([{ id: "reborn_clean", weight: 1 }]),
      pal: mixPalettes([{ id: "reborn_flare", weight: 1 }]),
      glowColor: [255, 200, 90],
      hueShift: 0,
      glow: 45,
      metallic: 55,
      chaos: 20,
      seed: 1000 + i,
      detailScale: 1,
    });
    blit(c, out.pixels, out.width, out.height, pad + rx * (cell + pad), pad + ry * (cell + pad), scale);
  });
  console.log("wrote", save(c, "sheet-templates.png"));
}

// 2. signatures (rendering archetypes)
sheet(
  SIGNATURES.map((s) => ({
    label: s.id,
    sig: [{ id: s.id, weight: 1 }],
    pal: [{ id: "reborn_flare", weight: 1 }],
  })),
  ITEMS,
  6,
  "sheet-signatures.png",
);

// 3. palettes (colour lineages)
sheet(
  PALETTES.map((p) => ({
    label: p.id,
    sig: [{ id: "reborn_clean", weight: 1 }],
    pal: [{ id: p.id, weight: 1 }],
  })),
  ITEMS.slice(0, 6),
  6,
  "sheet-palettes.png",
);

// 4. signature x palette combos + chaos levels for one hero item
{
  const combos: { sig: string; pal: string; chaos: number }[] = [
    { sig: "reborn_clean", pal: "wither_sovereign", chaos: 20 },
    { sig: "imperial_ornate", pal: "midas_gild", chaos: 40 },
    { sig: "depth_3d", pal: "dragonwake", chaos: 30 },
    { sig: "faithful_smooth", pal: "glacite_veil", chaos: 25 },
    { sig: "skypixel_crisp", pal: "gemnest", chaos: 15 },
    { sig: "neon_bloom", pal: "voidthorn", chaos: 60 },
  ];
  const scale = 12;
  const cell = 16 * scale;
  const pad = 10;
  const c = makeCanvas(combos.length * (cell + pad) + pad, cell + pad * 2);
  combos.forEach((combo, i) => {
    const gen = generateTexture({
      itemId: "hyperion",
      resolution: 16,
      seed: 9000 + i,
      styleMix: [{ id: combo.pal, weight: 1 }],
      signatureMix: [{ id: combo.sig, weight: 1 }],
      rarity: "legendary",
      hueShift: 0,
      glow: 55,
      metallic: 60,
      chaos: combo.chaos,
    });
    blit(c, gen.pixels, gen.width, gen.height, pad + i * (cell + pad), pad, scale);
    console.log(
      `${combo.sig}+${combo.pal}: colors=${uniqueColors(gen.pixels)} coverage=${coverage(gen.pixels).toFixed(2)}`,
    );
  });
  console.log("wrote", save(c, "sheet-combos.png"));
}

// 5. 32x check
{
  const ids = ["hyperion", "superior_helmet", "stonk", "golden_dragon_pet"];
  const scale = 5;
  const cell = 32 * scale;
  const pad = 10;
  const c = makeCanvas(ids.length * (cell + pad) + pad, cell + pad * 2);
  ids.forEach((id, i) => {
    const gen = generateTexture({
      itemId: id,
      resolution: 32,
      seed: 500 + i,
      styleMix: [{ id: "reborn_flare", weight: 1 }],
      signatureMix: [{ id: "faithful_smooth", weight: 1 }],
      rarity: getItem(id)!.rarity,
      hueShift: 0,
      glow: 45,
      metallic: 55,
      chaos: 25,
    });
    blit(c, gen.pixels, gen.width, gen.height, pad + i * (cell + pad), pad, scale);
    console.log(`32x ${id}: colors=${uniqueColors(gen.pixels)} coverage=${coverage(gen.pixels).toFixed(2)}`);
  });
  console.log("wrote", save(c, "sheet-32x.png"));
}

// 6. seed variation of one item (does the generator really diverge?)
{
  const scale = 10;
  const cell = 16 * scale;
  const pad = 8;
  const n = 8;
  const c = makeCanvas(n * (cell + pad) + pad, cell + pad * 2);
  for (let i = 0; i < n; i++) {
    const gen = generateTexture({
      itemId: "aspect_of_the_dragons",
      resolution: 16,
      seed: 100 + i * 977,
      styleMix: [{ id: "dragonwake", weight: 2 }, { id: "midas_gild", weight: 1 }],
      signatureMix: [{ id: "reborn_clean", weight: 2 }, { id: "imperial_ornate", weight: 1 }],
      rarity: "legendary",
      hueShift: i * 6 - 20,
      glow: 40 + i * 5,
      metallic: 50,
      chaos: 10 + i * 10,
    });
    blit(c, gen.pixels, gen.width, gen.height, pad + i * (cell + pad), pad, scale);
  }
  console.log("wrote", save(c, "sheet-seeds.png"));
}

console.log("catalog size:", CATALOG.length, "signatures:", SIGNATURES.length, "palettes:", PALETTES.length);
