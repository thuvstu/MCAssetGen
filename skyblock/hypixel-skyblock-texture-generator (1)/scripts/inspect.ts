/**
 * Dev tool: prints generated textures as luminance ASCII + metrics so the art
 * can be reviewed without an image viewer.
 *   npx tsx scripts/inspect.ts templates
 *   npx tsx scripts/inspect.ts sigs
 *   npx tsx scripts/inspect.ts palettes
 *   npx tsx scripts/inspect.ts items
 */
import { getItem } from "@/lib/catalog";
import { hexToRgb, rgbToHsl } from "@/lib/colors";
import { generateTexture } from "@/lib/generate";
import { shadeGrid } from "@/lib/shade";
import { mixPalettes, mixSignatures, PALETTES, SIGNATURES } from "@/lib/styles";
import { getTemplate, TEMPLATE_DEFS } from "@/lib/templates";

const RAMP = " .,:;+*oO#%@";

function toAscii(pixels: number[], size: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < size; y++) {
    let row = "";
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const a = pixels[i + 3] ?? 0;
      if (a < 24) {
        row += " ";
        continue;
      }
      const lum =
        (0.299 * pixels[i]! + 0.587 * pixels[i + 1]! + 0.114 * pixels[i + 2]!) * (a / 255);
      const idx = Math.min(RAMP.length - 1, Math.max(1, Math.round((lum / 255) * (RAMP.length - 1))));
      row += a < 200 ? RAMP[idx]!.toLowerCase() : RAMP[idx];
    }
    rows.push(row);
  }
  return rows;
}

function metrics(pixels: number[], size: number): string {
  const colors = new Set<string>();
  let cover = 0;
  let lumSum = 0;
  let topLum = 0;
  let topN = 0;
  let botLum = 0;
  let botN = 0;
  let leftLum = 0;
  let leftN = 0;
  let rightLum = 0;
  let rightN = 0;
  let dark = 0;
  let bright = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const a = pixels[i + 3] ?? 0;
      if (a < 24) continue;
      cover++;
      const key = `${pixels[i]! >> 3},${pixels[i + 1]! >> 3},${pixels[i + 2]! >> 3}`;
      colors.add(key);
      const lum = 0.299 * pixels[i]! + 0.587 * pixels[i + 1]! + 0.114 * pixels[i + 2]!;
      lumSum += lum;
      if (lum < 60) dark++;
      if (lum > 200) bright++;
      if (y < size / 2) {
        topLum += lum;
        topN++;
      } else {
        botLum += lum;
        botN++;
      }
      if (x < size / 2) {
        leftLum += lum;
        leftN++;
      } else {
        rightLum += lum;
        rightN++;
      }
    }
  }
  const tl = topN ? topLum / topN : 0;
  const bl = botN ? botLum / botN : 0;
  const ll = leftN ? leftLum / leftN : 0;
  const rl = rightN ? rightLum / rightN : 0;
  return [
    `cov ${(cover / (size * size)).toFixed(2)}`,
    `col ${colors.size}`,
    `lum ${(lumSum / Math.max(1, cover)).toFixed(0)}`,
    `lightΔ ${(tl - bl).toFixed(0)}/${(ll - rl).toFixed(0)}`,
    `dark ${dark}`,
    `spec ${bright}`,
  ].join(" ");
}

function printBand(
  entries: { label: string; pixels: number[]; size: number }[],
  perRow = 4,
): void {
  for (let start = 0; start < entries.length; start += perRow) {
    const group = entries.slice(start, start + perRow);
    console.log(group.map((g) => g.label.padEnd(17)).join(" "));
    const ascs = group.map((g) => toAscii(g.pixels, g.size));
    for (let y = 0; y < 16; y++) {
      console.log(
        ascs
          .map((a) => (a[Math.floor((y * a.length) / 16)] ?? "").slice(0, 16).padEnd(17))
          .join(" "),
      );
    }
    console.log(group.map((g) => metrics(g.pixels, g.size).padEnd(17)).join(" "));
    console.log("");
  }
}

const mode = process.argv[2] ?? "templates";

if (mode === "templates") {
  const entries = TEMPLATE_DEFS.map((def, i) => {
    const grid = getTemplate(def.id);
    const out = shadeGrid(grid, {
      sig: mixSignatures([{ id: "reborn_clean", weight: 1 }]),
      pal: mixPalettes([{ id: "reborn_flare", weight: 1 }]),
      glowColor: [255, 200, 90],
      hueShift: 0,
      glow: 40,
      metallic: 55,
      chaos: 20,
      seed: 1000 + i,
      detailScale: 1,
    });
    return { label: def.id, pixels: out.pixels, size: out.width };
  });
  printBand(entries, 4);
}

if (mode === "sigs") {
  const item = getItem("hyperion")!;
  const entries = SIGNATURES.map((s, i) => {
    const gen = generateTexture({
      itemId: item.id,
      resolution: 16,
      seed: 4242,
      styleMix: [{ id: "wither_sovereign", weight: 1 }],
      signatureMix: [{ id: s.id, weight: 1 }],
      templateId: "sword_wither",
      rarity: item.rarity,
      hueShift: 0,
      glow: 45,
      metallic: 55,
      chaos: 30,
    });
    return { label: s.id, pixels: gen.pixels, size: gen.width };
  });
  printBand(entries, 4);
}

if (mode === "palettes") {
  const item = getItem("aspect_of_the_dragons")!;
  const entries = PALETTES.map((p, i) => {
    const gen = generateTexture({
      itemId: item.id,
      resolution: 16,
      seed: 777,
      styleMix: [{ id: p.id, weight: 1 }],
      signatureMix: [{ id: "reborn_clean", weight: 1 }],
      templateId: "sword_long",
      rarity: item.rarity,
      hueShift: 0,
      glow: 45,
      metallic: 55,
      chaos: 25,
    });
    const rgb = hexToRgb(p.accent);
    const [h, s] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    console.log(`# ${p.id} accent h=${h.toFixed(0)} s=${s.toFixed(2)}`);
    return { label: p.id, pixels: gen.pixels, size: gen.width };
  });
  printBand(entries, 4);
}

if (mode === "items") {
  const ids = process.argv.slice(3);
  const list = ids.length ? ids : ["hyperion", "terminator", "superior_helmet", "bee_pet", "stonk", "plasmaflux", "golden_dragon_pet", "necron_chestplate"];
  const entries = list.map((id, i) => {
    const item = getItem(id)!;
    const gen = generateTexture({
      itemId: id,
      resolution: 16,
      seed: 31337,
      styleMix: [{ id: "reborn_flare", weight: 2 }, { id: "dragonwake", weight: 1 }],
      signatureMix: [{ id: "reborn_clean", weight: 1 }],
      rarity: item.rarity,
      hueShift: 0,
      glow: 50,
      metallic: 55,
      chaos: 30,
    });
    return { label: `${id.slice(0, 12)}/${gen.templateId.slice(0, 4)}`, pixels: gen.pixels, size: gen.width };
  });
  printBand(entries, 4);
}

if (mode === "raw") {
  // Full-resolution luminance dump of a single render.
  const id = process.argv[3] ?? "hyperion";
  const res = (Number(process.argv[4] ?? 64) as 16 | 32 | 64);
  const sigId = process.argv[5] ?? "reborn_clean";
  const palId = process.argv[6] ?? "dragonwake";
  const item = getItem(id)!;
  const gen = generateTexture({
    itemId: id,
    resolution: res,
    seed: Number(process.argv[7] ?? 4242),
    styleMix: [{ id: palId, weight: 1 }],
    signatureMix: [{ id: sigId, weight: 1 }],
    rarity: item.rarity,
    hueShift: 0,
    glow: 45,
    metallic: 55,
    chaos: 25,
    templateId: item.templates[0],
  });
  console.log(`# ${id} @${res} ${sigId} x ${palId} template=${gen.templateId}`);
  const n = gen.width;
  for (let y = 0; y < n; y++) {
    let row = "";
    for (let x = 0; x < n; x++) {
      const i = (y * n + x) * 4;
      const a = gen.pixels[i + 3] ?? 0;
      if (a < 24) {
        row += " ";
        continue;
      }
      const lum =
        (0.299 * gen.pixels[i]! + 0.587 * gen.pixels[i + 1]! + 0.114 * gen.pixels[i + 2]!) *
        (a / 255);
      row += RAMP[Math.min(RAMP.length - 1, Math.max(1, Math.round((lum / 255) * (RAMP.length - 1))))]!;
    }
    console.log(row);
  }
  const buckets = [0, 0, 0, 0, 0];
  let tot = 0;
  for (let i = 0; i < n * n; i++) {
    const a = gen.pixels[i * 4 + 3] ?? 0;
    if (a < 24) continue;
    tot++;
    const lum = 0.299 * gen.pixels[i * 4]! + 0.587 * gen.pixels[i * 4 + 1]! + 0.114 * gen.pixels[i * 4 + 2]!;
    buckets[Math.min(4, Math.floor((lum / 256) * 5))]!++;
  }
  console.log(
    `# hist=[${buckets.map((b) => ((b / Math.max(1, tot)) * 100).toFixed(0) + "%").join(" ")}] colors=${
      new Set(
        Array.from({ length: n * n }, (_, i) =>
          (gen.pixels[i * 4 + 3] ?? 0) < 24
            ? ""
            : `${gen.pixels[i * 4]! >> 2},${gen.pixels[i * 4 + 1]! >> 2},${gen.pixels[i * 4 + 2]! >> 2}`,
        ),
      ).size
    }`,
  );
}
