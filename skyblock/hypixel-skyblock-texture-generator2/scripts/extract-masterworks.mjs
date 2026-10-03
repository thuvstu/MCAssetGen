import { mkdirSync } from "node:fs";
import { Jimp, JimpMime } from "jimp";

/**
 * Splits authored 3x3 atlases into individual transparent 64x64 sprites.
 *
 * Background removal samples the actual corner colours of each cell rather
 * than assuming a fixed hex, because each generated atlas has a slightly
 * different backdrop and panel border tone.
 */
const ATLASES = [
  {
    file: "public/images/masterwork-atlas.png",
    items: [
      "hyperion",
      "aspect_of_the_dragons",
      "terminator",
      "spirit_sceptre",
      "necron_helmet",
      "necron_chestplate",
      "plasmaflux",
      "gemstone_gauntlet",
      "enchanted_book",
    ],
  },
  {
    file: "public/images/atlas-swords.png",
    items: [
      "astraea",
      "scylla",
      "valkyrie",
      "giants_sword",
      "dark_claymore",
      "livid_dagger",
      "midas_sword",
      "flower_of_truth",
      "shadow_fury",
    ],
  },
  {
    file: "public/images/atlas-ranged.png",
    items: [
      "juju_shortbow",
      "last_breath",
      "mosquito_bow",
      "spirit_bow",
      "runaans_bow",
      "bonzo_staff",
      "midas_staff",
      "fire_veil_wand",
      "wand_of_atonement",
    ],
  },
  {
    file: "public/images/atlas-armor.png",
    items: [
      "storm_helmet",
      "superior_helmet",
      "shadow_assassin_helmet",
      "necron_leggings",
      "necron_boots",
      "storm_chestplate",
      "superior_chestplate",
      "crimson_helmet",
      "aurora_chestplate",
    ],
  },
  {
    file: "public/images/atlas-pets.png",
    items: [
      "golden_dragon_pet",
      "blue_whale_pet",
      "tiger_pet",
      "black_cat_pet",
      "griffin_pet",
      "bee_pet",
      "phoenix_pet",
      "enderman_pet",
      "snow_minion",
    ],
  },
  {
    file: "public/images/atlas-tools.png",
    items: [
      "stonk",
      "treecapitator",
      "titanium_drill",
      "grappling_hook",
      "rod_of_the_sea",
      "hegemony_artifact",
      "overflux_capacitor",
      "treasure_ring",
      "critical_potion",
    ],
  },
  {
    file: "public/images/atlas-armor2.png",
    items: [
      "superior_leggings",
      "superior_boots",
      "shadow_assassin_chestplate",
      "shadow_assassin_leggings",
      "shadow_assassin_boots",
      "crimson_chestplate",
      "aurora_helmet",
      "frozen_blaze_helmet",
      "frozen_blaze_chestplate",
    ],
  },
  {
    file: "public/images/atlas-armor3.png",
    items: [
      "aspect_of_the_void",
      "frozen_scythe",
      "axe_of_the_shredded",
      "reaper_falchion",
      "mathematical_hoe",
      "relic_of_power",
      "speed_talisman",
      "personal_compactor",
      "gemstone_mixture",
    ],
  },
];

const OUT = "public/masterworks";
mkdirSync(OUT, { recursive: true });

const near = (a, b, tol) =>
  Math.abs(a.r - b.r) <= tol && Math.abs(a.g - b.g) <= tol && Math.abs(a.b - b.b) <= tol;

function pixelAt(img, x, y) {
  const o = (img.bitmap.width * y + x) << 2;
  return {
    r: img.bitmap.data[o] ?? 0,
    g: img.bitmap.data[o + 1] ?? 0,
    b: img.bitmap.data[o + 2] ?? 0,
  };
}

/** Flood fill from the borders so interior dark pixels of the art survive. */
function clearBackground(img, tol = 26) {
  const { width, height } = img.bitmap;
  const seeds = [];
  for (let x = 0; x < width; x++) {
    seeds.push([x, 0], [x, height - 1]);
  }
  for (let y = 0; y < height; y++) {
    seeds.push([0, y], [width - 1, y]);
  }
  const ref = [
    pixelAt(img, 0, 0),
    pixelAt(img, width - 1, 0),
    pixelAt(img, 0, height - 1),
    pixelAt(img, width - 1, height - 1),
    pixelAt(img, width >> 1, 0),
    pixelAt(img, width >> 1, height - 1),
    pixelAt(img, 0, height >> 1),
    pixelAt(img, width - 1, height >> 1),
  ];
  const seen = new Uint8Array(width * height);
  const stack = seeds;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const idx = y * width + x;
    if (seen[idx]) continue;
    const px = pixelAt(img, x, y);
    if (!ref.some((r) => near(px, r, tol))) continue;
    seen[idx] = 1;
    img.bitmap.data[(idx << 2) + 3] = 0;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

/** Crop to the opaque content so every sprite fills its 64px frame evenly. */
function trimToContent(img, pad = 2) {
  const { width, height } = img.bitmap;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((img.bitmap.data[((width * y + x) << 2) + 3] ?? 0) > 16) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return img;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const side = Math.max(w, h);
  const square = new Jimp({ width: side, height: side, color: 0x00000000 });
  square.composite(img.clone().crop({ x: minX, y: minY, w, h }), (side - w) >> 1, (side - h) >> 1);
  return square;
}

let total = 0;
for (const atlas of ATLASES) {
  const img = await Jimp.read(atlas.file);
  const cellW = Math.floor(img.bitmap.width / 3);
  const cellH = Math.floor(img.bitmap.height / 3);
  for (let i = 0; i < atlas.items.length; i++) {
    const cx = (i % 3) * cellW;
    const cy = Math.floor(i / 3) * cellH;
    const inset = Math.round(cellW * 0.07);
    const cell = img.clone().crop({
      x: cx + inset,
      y: cy + inset,
      w: cellW - inset * 2,
      h: cellH - inset * 2,
    });
    clearBackground(cell);
    const squared = trimToContent(cell);
    squared.resize({ w: 64, h: 64, mode: "nearestNeighbor" });
    // Nearest-neighbour can leave semi-transparent fringes; force binary alpha.
    squared.scan((x, y, o) => {
      squared.bitmap.data[o + 3] = (squared.bitmap.data[o + 3] ?? 0) > 110 ? 255 : 0;
    });
    await squared.write(`${OUT}/${atlas.items[i]}.png`, { mime: JimpMime.png });
    total++;
  }
  console.log(`${atlas.file} -> ${atlas.items.length} sprites`);
}
console.log(`total ${total} masterwork sprites`);
