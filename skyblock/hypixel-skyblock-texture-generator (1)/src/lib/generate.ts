import { CATALOG_MAP, type CatalogItem } from "@/lib/catalog";
import { hexToRgb, type RGB } from "@/lib/colors";
import { mulberry32, rngBool, rngInt, rngPick, type Rng } from "@/lib/rng";
import { RARITIES, type Rarity } from "@/lib/rarity";
import {
  CHAR_TO_MATERIAL,
  computeField,
  shadeGrid,
  sparklePass,
  type ShadeConfig,
} from "@/lib/shade";
import {
  mixPalettes,
  mixSignatures,
  type MixEntry,
  type PaletteMix,
  type SignatureMix,
} from "@/lib/styles";
import { applyNative64Essence, getNative64Template } from "@/lib/native64";
import { getTemplate, templateIds } from "@/lib/templates";
import { NATIVE64_TEMPLATE_IDS } from "@/lib/native64";

const KNOWN_TEMPLATES = new Set<string>([...templateIds(), ...NATIVE64_TEMPLATE_IDS]);
/** Item catalogs are hand-written; never let a stale template id crash a render. */
function safeTemplatesFor(item: CatalogItem): string[] {
  const valid = item.templates.filter((id) => KNOWN_TEMPLATES.has(id));
  return valid.length ? valid : [templateIds()[0]!];
}
import type { Grid as GridType } from "@/lib/draw";

type Grid = GridType;

export type Resolution = 16 | 32 | 64;

export const RESOLUTIONS: Resolution[] = [16, 32, 64];

export type GenerateInput = {
  itemId: string;
  resolution: Resolution;
  seed: number;
  /** Colour lineage (palettes) — up to 3 blended. */
  styleMix: MixEntry[];
  /** Rendering archetype (signatures) — up to 2 blended. */
  signatureMix?: MixEntry[];
  rarity: Rarity;
  hueShift: number;
  glow: number;
  metallic: number;
  chaos: number;
  templateId?: string;
};

export type GeneratedTexture = {
  width: number;
  height: number;
  pixels: number[];
  templateId: string;
  /** 64× is authored by a separate 64px geometry engine, never enlarged. */
  renderMode: "native64" | "classic16" | "refined32";
  paletteHex: Record<string, string>;
  signatureIds: string[];
  paletteIds: string[];
};

export const DEFAULT_SIGNATURE = "reborn_clean";
export const DEFAULT_PALETTE = "reborn_flare";

function clone(grid: GridType): GridType {
  return grid.map((row) => [...row]);
}

/** Stamps an s×s block so chaos features keep their size relative to the item. */
function stamp(g: GridType, x: number, y: number, s: number, ch: string, allowNew = false): void {
  const n = g.length;
  for (let j = 0; j < s; j++)
    for (let i = 0; i < s; i++) {
      const xx = x + i;
      const yy = y + j;
      if (yy < 0 || yy >= n || xx < 0 || xx >= n) continue;
      if (!allowNew && g[yy]![xx] === ".") continue;
      g[yy]![xx] = ch;
    }
}

function flip(grid: GridType): GridType {
  return grid.map((row) => [...row].reverse());
}

/**
 * Chaos = the "artist's hand" that makes the same template diverge between
 * seeds: extra gems, energy veins, blade notches, runes, asymmetry.
 */
function mutate(
  grid: GridType,
  rng: Rng,
  chaos: number,
  item: CatalogItem,
  scale: number,
): GridType {
  const g = clone(grid);
  const n = g.length;
  const t = chaos / 100;
  const field = computeField(g);
  const interior: [number, number][] = [];
  const boundary: [number, number][] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (!field.mask[i]) continue;
      if (field.dist[i] === 0) boundary.push([x, y]);
      else interior.push([x, y]);
    }

  if (!interior.length && !boundary.length) return g;

  // Gem inlays grow with chaos — the "detailed pack" look.
  const gems = Math.round(t * 3.2);
  for (let i = 0; i < gems; i++) {
    const pool = interior.length ? interior : boundary;
    const [x, y] = rngPick(rng, pool);
    stamp(g, x - (scale >> 1), y - (scale >> 1), scale, "g");
    if (rngBool(rng, 0.35)) {
      const ox = x + rngInt(rng, -1, 1) * scale;
      const oy = y + rngInt(rng, -1, 1) * scale;
      if (oy >= 0 && oy < n && ox >= 0 && ox < n && g[oy]![ox] !== ".") {
        stamp(g, ox - (scale >> 1), oy - (scale >> 1), scale, "g");
      }
    }
  }

  // Energy veins / runes threaded through the body.
  if (t > 0.3 && (item.category === "sword" || item.category === "staff" || item.category === "bow")) {
    const veins = 1 + Math.floor(t * 3);
    for (let v = 0; v < veins; v++) {
      let [x, y] = rngPick(rng, interior.length ? interior : boundary);
      const ch = rngBool(rng, 0.6) ? "e" : "r";
      const steps = 4;
      for (let step = 0; step < steps; step++) {
        if (grid[y]?.[x] !== undefined && grid[y]![x] !== ".") {
          stamp(g, x - (scale >> 1), y - (scale >> 1), scale, ch);
        }
        x = Math.max(0, Math.min(n - scale, x + rngInt(rng, -1, 1) * scale));
        y = Math.max(0, Math.min(n - scale, y + rngInt(rng, -1, 1) * scale));
      }
    }
  }

  // Blade notches / spikes on the silhouette.
  if (t > 0.5 && item.category === "sword") {
    const spikes = Math.round((t - 0.5) * 5);
    for (let s = 0; s < spikes; s++) {
      const [x, y] = rngPick(rng, boundary);
      const dirs: [number, number][] = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      for (const [dx, dy] of dirs) {
        const ox = x + dx * scale;
        const oy = y + dy * scale;
        if (ox < 0 || oy < 0 || ox >= n || oy >= n) continue;
        if (g[oy]![ox] !== ".") continue;
        stamp(g, ox - (scale >> 1), oy - (scale >> 1), scale, rngBool(rng, 0.5) ? "M" : "b", true);
        break;
      }
    }
  }

  // Gold trim accents sprinkled on armor / accessories.
  if (t > 0.25 && (item.category === "armor" || item.category === "accessory")) {
    const trims = Math.round(t * 4);
    for (let i = 0; i < trims; i++) {
      const [x, y] = rngPick(rng, boundary);
      if (rngBool(rng, 0.6)) stamp(g, x - (scale >> 1), y - (scale >> 1), scale, "M");
    }
  }

  // Material swaps keep the same silhouette but change the read.
  if (t > 0.65 && rngBool(rng, 0.5)) {
    const from = rngPick(rng, ["m", "w", "l", "c", "k"]);
    const to = rngPick(rng, ["M", "g", "e", "b"]);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) if (g[y]![x] === from && rngBool(rng, 0.4)) stamp(g, x, y, scale, to);
  }

  return g;
}

function glowColorFor(rarity: Rarity, pal: PaletteMix, hueShift: number): RGB {
  const r = RARITIES[rarity] ?? RARITIES.legendary;
  const mixed: RGB = [
    hexToRgb(r.glow)[0] * 0.6 + pal.energy[0] * 0.4,
    hexToRgb(r.glow)[1] * 0.6 + pal.energy[1] * 0.4,
    hexToRgb(r.glow)[2] * 0.6 + pal.energy[2] * 0.4,
  ];
  const [h, s, l] = [0, 0, 0];
  void h;
  void s;
  void l;
  return mixed.map((v) => Math.max(0, Math.min(255, v))) as RGB;
}

export function generateTexture(input: GenerateInput): GeneratedTexture {
  const item = CATALOG_MAP[input.itemId];
  if (!item) throw new Error(`Unknown item: ${input.itemId}`);

  const shapeRng = mulberry32(input.seed >>> 0);
  const paletteMix: MixEntry[] = input.styleMix?.length
    ? input.styleMix
    : [{ id: DEFAULT_PALETTE, weight: 1 }];
  const signatureMix: MixEntry[] = input.signatureMix?.length
    ? input.signatureMix
    : [{ id: DEFAULT_SIGNATURE, weight: 1 }];

  const sig: SignatureMix = mixSignatures(signatureMix);
  const pal: PaletteMix = mixPalettes(paletteMix);

  const templates = safeTemplatesFor(item);
  const templateId =
    input.templateId && templates.includes(input.templateId)
      ? input.templateId
      : rngPick(shapeRng, templates);

  const resolution: Resolution = input.resolution === 64 ? 64 : input.resolution === 32 ? 32 : 16;
  const native64 = resolution === 64;
  // 64× never calls the 16-space template system. It is built by the separate
  // 64px authoring engine with native curves, parts and one-pixel engravings.
  let grid: Grid = native64 ? getNative64Template(templateId) : getTemplate(templateId, resolution);
  // Signature cleanliness decides how much the seed may disturb the silhouette.
  const chaos = Math.round(input.chaos * (1 - sig.clean * 0.45));
  if (rngBool(shapeRng, 0.2 + chaos / 400)) grid = flip(grid);
  // Native details are 1–2 pixels, not 4px stamps inherited from a 16px base.
  const featureScale = native64 ? 2 : resolution / 16;
  grid = mutate(grid, shapeRng, chaos, item, featureScale);
  if (native64) {
    grid = applyNative64Essence(grid, {
      signatureIds: sig.ids,
      ornament: sig.ornament,
      clean: sig.clean,
      pseudo3d: sig.pseudo3d,
      seed: input.seed,
    });
  }

  const cfg: ShadeConfig = {
    sig,
    pal,
    glowColor: glowColorFor(input.rarity, pal, input.hueShift),
    hueShift: input.hueShift,
    glow: input.glow,
    metallic: input.metallic,
    chaos,
    seed: input.seed,
    detailScale: resolution / 16,
  };

  const shaded = shadeGrid(grid, cfg);
  const rarity = RARITIES[input.rarity] ?? RARITIES.legendary;
  // Deliberate pixels only: no random sparkle scatter (hand-made packs never do this).
  void sparklePass;
  void rarity;

  return {
    width: shaded.width,
    height: shaded.height,
    pixels: shaded.pixels,
    templateId,
    renderMode: native64 ? "native64" : resolution === 32 ? "refined32" : "classic16",
    paletteHex: {
      metal: toHex(pal.metal),
      gold: toHex(pal.gold),
      gem: toHex(pal.gem),
      wood: toHex(pal.wood),
      leather: toHex(pal.leather),
      cloth: toHex(pal.cloth),
      energy: toHex(pal.energy),
      accent: toHex(pal.accent),
      bone: toHex(pal.bone),
      outline: toHex(pal.outline),
      fur: toHex(pal.fur),
    },
    signatureIds: sig.ids,
    paletteIds: pal.ids,
  };
}

function toHex(rgb: RGB): string {
  return `#${rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}

export function materialOf(ch: string): string | undefined {
  return CHAR_TO_MATERIAL[ch];
}
