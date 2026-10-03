import { mkdirSync, writeFileSync } from "node:fs";
import { getItem } from "@/lib/catalog";
import { generateTexture } from "@/lib/generate";
import { encodePng } from "@/lib/png";

const cases = [
  ["hyperion", "overhaul_intricate", "wither_sovereign", 4242],
  ["dark_claymore", "nameless_heroic", "voidthorn", 900],
  ["terminator", "nameless_heroic", "gemnest", 777],
  ["spirit_sceptre", "overhaul_intricate", "fairy_atelier", 612],
  ["necron_chestplate", "overhaul_intricate", "catacomb_ink", 51],
  ["superior_helmet", "reborn_clean", "dragonwake", 818],
  ["golden_dragon_pet", "imperial_ornate", "midas_gild", 99],
  ["plasmaflux", "neon_bloom", "voidthorn", 1200],
  ["gemstone_gauntlet", "faithful_smooth", "gemnest", 404],
  ["titanium_drill", "depth_3d", "mithril_vein", 505],
  ["enchanted_book", "overhaul_intricate", "fairy_atelier", 303],
  ["blue_whale_pet", "skypixel_crisp", "glacite_veil", 202],
] as const;

const cols = 4;
const scale = 3;
const cell = 64 * scale;
const pad = 12;
const rows = Math.ceil(cases.length / cols);
const width = cols * cell + (cols + 1) * pad;
const height = rows * cell + (rows + 1) * pad;
const pixels = new Array(width * height * 4).fill(0);
for (let i = 0; i < width * height; i++) {
  const x = i % width;
  const y = Math.floor(i / width);
  const checker = ((x >> 4) + (y >> 4)) & 1;
  pixels[i * 4] = checker ? 14 : 10;
  pixels[i * 4 + 1] = checker ? 18 : 13;
  pixels[i * 4 + 2] = checker ? 29 : 22;
  pixels[i * 4 + 3] = 255;
}

for (let c = 0; c < cases.length; c++) {
  const [itemId, signature, palette, seed] = cases[c]!;
  const item = getItem(itemId)!;
  const gen = generateTexture({
    itemId,
    resolution: 64,
    seed,
    styleMix: [{ id: palette, weight: 1 }],
    signatureMix: [{ id: signature, weight: 1 }],
    rarity: item.rarity,
    hueShift: 0,
    glow: 46,
    metallic: 60,
    chaos: 24,
  });
  if (gen.renderMode !== "native64") throw new Error(`${itemId}: ${gen.renderMode}`);
  const ox = pad + (c % cols) * (cell + pad);
  const oy = pad + Math.floor(c / cols) * (cell + pad);
  for (let y = 0; y < cell; y++) {
    for (let x = 0; x < cell; x++) {
      const sx = Math.floor(x / scale);
      const sy = Math.floor(y / scale);
      const si = (sy * 64 + sx) * 4;
      const a = (gen.pixels[si + 3] ?? 0) / 255;
      if (a < 0.02) continue;
      const di = ((oy + y) * width + ox + x) * 4;
      pixels[di] = pixels[di]! * (1 - a) + gen.pixels[si]! * a;
      pixels[di + 1] = pixels[di + 1]! * (1 - a) + gen.pixels[si + 1]! * a;
      pixels[di + 2] = pixels[di + 2]! * (1 - a) + gen.pixels[si + 2]! * a;
    }
  }
}

mkdirSync(".preview", { recursive: true });
const png = encodePng(width, height, pixels);
writeFileSync(".preview/native64-contact.png", Buffer.from(png));
console.log(`.preview/native64-contact.png ${width}x${height}`);
