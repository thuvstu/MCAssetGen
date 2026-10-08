import { fbm, hashNoise, mix, shade, vnoise } from "./color";
import type { Surface } from "./geometry";
import type { RGB, SurfaceStyle } from "./types";

/**
 * Surface "essences" — material textures drawn on the blade flat.
 *
 * Each pattern runs in blade-axis space (d = progress along the blade, across
 * is the perpendicular signed distance -1..1). This lets them follow curved
 * blades naturally. Each pattern is aware of `c.fine` (enough device pixels
 * across the blade for the pattern) and the shading factor, so it can simplify
 * itself on thin blades and during low-detail renders.
 *
 * Some patterns also receive the per-pixel across value so they can place the
 * highlight on the **lit side of the blade** (always upper-left of the image).
 */
export type SurfaceCtx = {
  seed: number;
  scale: number;        // device pixels per logical unit
  bladePx: number;      // blade full width in device pixels
  fine: boolean;        // enough pixels across the blade for fine detail
  edge: RGB; core: RGB; accent: RGB; glow: RGB;
  shading: number;
};

type Pattern = (col: RGB, s: Surface, c: SurfaceCtx) => RGB;

const cells = (d: number, a: number, size: number, seed: number) => hashNoise(Math.floor(d / size) + seed, Math.floor(a / size) * 7);

/** Common 16× "vanilla texture pack" essence: flat colours with a single bright rim and a single dark rim. */
const vanillaFlat = (col: RGB, _s: Surface, _c: SurfaceCtx): RGB => col;

/** Map a colour into a 3-stop gradient (core → base → edge) used for plain steel looks. */
function gradient3(core: RGB, base: RGB, edge: RGB, t: number): RGB {
  if (t < 0.5) return mix(core, base, t * 2);
  return mix(base, edge, (t - 0.5) * 2);
}

const PATTERNS: Record<SurfaceStyle, Pattern> = {
  polished: vanillaFlat,

  // folded steel: wavy layered bands
  damascus: (col, s, c) => {
    if (!c.fine) return shade(col, c.shading * 0.5);
    const wave = Math.sin(s.d * 5.5 + 2.4 * Math.sin(s.across * 2.8 + s.d * 1.3) + vnoise(s.d * 1.5, s.across, c.seed) * 3);
    if (wave > 0.55) return shade(col, 0.84);
    if (wave < -0.7) return mix(col, c.edge, 0.18);
    return col;
  },

  // differential-hardening temper line near the edge
  hamon: (col, s, c) => {
    const line = -0.25 + Math.sin(s.d * 3.1 + c.seed * 0.01) * 0.12 + vnoise(s.d * 2, 0, c.seed) * 0.16;
    if (s.across < line) return mix(col, c.edge, 0.42 + 0.2 * Math.max(0, line - s.across));
    return Math.abs(s.across - line) < 0.08 ? mix(col, c.edge, 0.8) : col;
  },

  // volcanic glass: dark with conchoidal chips catching light
  obsidian: (col, s, c) => {
    const base = shade(col, 0.72);
    if (!c.fine) return base;
    const chip = cells(s.d * 1.2, s.across * 1.6, 0.9, c.seed);
    if (chip > 0.36) return mix(base, c.edge, 0.32);
    if (chip < -0.38) return shade(base, 0.72);
    return mix(base, c.glow, Math.max(0, Math.sin(s.d * 9 + s.across * 5)) * 0.08);
  },

  // faceted crystal: flat planes with alternating brightness
  crystal: (col, s, c) => {
    if (!c.fine) return col;
    const facet = Math.floor(s.d * 1.6 + s.across * 1.1) + Math.floor(s.d * 0.9 - s.across * 1.7);
    const k = ((facet % 3) + 3) % 3;
    const out = k === 0 ? mix(col, c.edge, 0.3) : k === 1 ? col : shade(col, 0.82);
    return Math.abs((s.d * 1.6 + s.across * 1.1) % 1) < 0.08 ? mix(out, c.edge, 0.5) : out;
  },

  // bone / ivory: warm, porous, hairline cracks
  bone: (col, s, c) => {
    const warm = mix(col, [236, 226, 204], 0.4);
    if (!c.fine) return shade(warm, c.shading * 0.4);
    const pore = fbm(s.d * 3, s.across * 2.5, c.seed);
    const crack = Math.abs(Math.sin(s.d * 2.3 + vnoise(s.d, s.across * 2, c.seed) * 6)) < 0.04;
    return crack ? shade(warm, 0.62) : shade(warm, 0.9 + pore * 0.18);
  },

  // wood grain along the blade
  wood: (col, s, c) => {
    if (!c.fine) return col;
    const grain = Math.sin((s.across * 2.4 + vnoise(s.d * 0.7, s.across, c.seed) * 3 + s.d * 0.25) * 6);
    const w = mix(col, [140, 96, 62], 0.45);
    return grain > 0.6 ? shade(w, 0.78) : grain > 0.2 ? shade(w, 0.9) : shade(w, 1.05);
  },

  // overlapping scales (dragon / prismarine style)
  scales: (col, s, c) => {
    if (!c.fine) return col;
    const freq = 2.6, row = Math.floor(s.d * freq);
    const offset = row % 2 ? 0.5 : 0;
    const fx = ((s.d * freq) % 1 + 1) % 1, fy = ((s.across * 1.4 + offset) % 1 + 1) % 1;
    const r = Math.hypot(fx - 0.5, (fy - 0.5) * 0.9);
    return r > 0.46 ? shade(col, 0.72) : r < 0.2 ? mix(col, c.edge, 0.22) : col;
  },

  // cooled magma: dark crust with glowing cracks
  magma: (col, s, c) => {
    const n = fbm(s.d * (c.fine ? 1.7 : 1.1), s.across * 1.3, c.seed);
    const crack = Math.abs(n - 0.5) < 0.028;
    const crust = shade(mix(col, [48, 34, 36], 0.5), 0.94 + vnoise(s.d * 3, s.across * 2.5, c.seed) * 0.12);
    return crack ? mix(c.glow, [255, 236, 190], 0.2) : Math.abs(n - 0.5) < 0.06 ? mix(crust, c.glow, 0.4) : crust;
  },

  // frost: crystalline fern fractures on pale metal
  frost: (col, s, c) => {
    const pale = mix(col, [228, 244, 250], 0.32);
    if (!c.fine) return pale;
    const fern = Math.abs(Math.sin(s.d * 7 + s.across * 9)) * Math.abs(Math.sin(s.d * 2.2 - s.across * 4 + vnoise(s.d, s.across, c.seed) * 4));
    return fern > 0.86 ? mix(pale, [255, 255, 255], 0.55) : fern < 0.08 ? shade(pale, 0.86) : pale;
  },

  // hammered: soft dimples
  hammered: (col, s, c) => {
    if (!c.fine) return col;
    const size = 0.7;
    const fx = ((s.d / size) % 1 + 1) % 1 - 0.5, fy = ((s.across * 1.2 / size) % 1 + 1) % 1 - 0.5;
    const r = Math.hypot(fx, fy) + cells(s.d, s.across, size, c.seed) * 0.15;
    return r < 0.16 ? shade(col, 0.86) : r < 0.3 ? col : mix(col, c.edge, 0.12);
  },

  // engraved scrollwork along the blade centre
  etched: (col, s, c) => {
    const band = Math.abs(s.across) < 0.55;
    if (!band) return col;
    const curl = Math.sin(s.d * (c.fine ? 4.5 : 2.4)) * 0.28;
    const line = Math.abs(s.across - curl) < 0.07 || (c.fine && Math.abs(s.across + curl) < 0.07);
    const dot = c.fine && Math.abs(((s.d * 2.25) % 1) - 0.5) < 0.08 && Math.abs(s.across) < 0.08;
    return line || dot ? shade(mix(col, c.core, 0.5), 0.8) : col;
  },

  // battle-worn: scratches and edge chips
  worn: (col, s, c) => {
    const tarnish = vnoise(s.d * 2.2, s.across * 2, c.seed) > 0.68;
    let out = tarnish ? shade(col, 0.88) : col;
    if (c.fine) {
      const scratch = Math.abs(hashNoise(Math.floor(s.d * 9 + s.across * 3) + c.seed, 3)) > 0.44 && Math.abs(Math.sin(s.across * 11 + s.d * 40)) > 0.97;
      const chip = s.across < -0.72 && cells(s.d, 0, 0.55, c.seed) > 0.32;
      if (scratch) out = mix(out, c.edge, 0.4);
      if (chip) out = shade(out, 0.7);
    }
    return out;
  },

  // banded: dark/light strata (blackstone / basalt)
  banded: (col, s, c) => {
    if (!c.fine) return col;
    const b = Math.sin(s.d * 3.4 + vnoise(s.d, s.across * 3, c.seed) * 1.5);
    return b > 0.5 ? shade(col, 0.76) : b < -0.6 ? mix(col, c.edge, 0.16) : col;
  },

  // gilded: gold inlay bands and a filigree ridge
  gilded: (col, s, c) => {
    if (!c.fine) return col;
    const gold: RGB = [226, 184, 96];
    const band = Math.abs(((s.d * 1.3) % 1) - 0.5) < 0.07 && Math.abs(s.across) < 0.72;
    const ridge = Math.abs(s.across + 0.15) < 0.06 && Math.sin(s.d * 6) > -0.2;
    return band || ridge ? mix(gold, c.edge, band ? 0.15 : 0.35) : col;
  },

  // circuitry: right-angled traces with nodes
  circuit: (col, s, c) => {
    if (!c.fine) return col;
    const fq = 2.2, fa = 2;
    const gx = Math.floor(s.d * fq), gy = Math.floor(s.across * fa + 2);
    const h = hashNoise(gx + c.seed, gy);
    const fx = ((s.d * fq) % 1 + 1) % 1, fy = ((s.across * fa + 2) % 1 + 1) % 1;
    const trace = (h > 0 ? Math.abs(fy - 0.5) < 0.09 : Math.abs(fx - 0.5) < 0.09);
    const node = Math.hypot(fx - 0.5, fy - 0.5) < 0.14;
    return node ? mix(c.glow, [255, 255, 255], 0.3) : trace ? mix(col, c.accent, 0.55) : shade(col, 0.9);
  },

  // starfield: deep tint with sparse bright points and a nebula haze
  starfield: (col, s, c) => {
    if (!c.fine) return col;
    const deep = mix(col, c.core, 0.55);
    const haze = mix(deep, c.accent, Math.max(0, vnoise(s.d * 0.8, s.across, c.seed) - 0.55) * 0.9);
    const star = hashNoise(Math.floor(s.d * 6) + c.seed, Math.floor(s.across * 5)) > 0.44;
    return star ? mix(haze, [255, 255, 255], 0.75) : haze;
  },

  // prismarine: rounded tiles with dark grout, subtle teal shift
  prismarine: (col, s, c) => {
    if (!c.fine) return mix(col, [98, 168, 160], 0.2);
    const size = 0.85;
    const fx = ((s.d / size) % 1 + 1) % 1, fy = ((s.across * 1.3 / size) % 1 + 1) % 1;
    const tile = mix(col, [98, 168, 160], 0.3);
    const grout = fx < 0.12 || fy < 0.12;
    const t = cells(s.d, s.across * 1.3, size, c.seed);
    return grout ? shade(tile, 0.68) : shade(tile, 1 + t * 0.16);
  },

  // amethyst: clustered angular shards
  amethyst: (col, s, c) => {
    if (!c.fine) return mix(col, [150, 110, 205], 0.3);
    const k = Math.floor(s.d * 2.4 + s.across * 0.8) % 4;
    const violet = mix(col, [150, 110, 205], 0.35);
    const shard = ((k % 4) + 4) % 4;
    const out = shard === 0 ? mix(violet, c.edge, 0.35) : shard === 1 ? violet : shard === 2 ? shade(violet, 0.8) : mix(violet, c.accent, 0.3);
    return Math.abs((s.d * 2.4 + s.across * 0.8) % 1) < 0.07 ? shade(out, 0.6) : out;
  },

  // ender: near-black with drifting violet speckles
  ender: (col, s, c) => {
    const dark = mix(col, [22, 18, 30], 0.6);
    if (!c.fine) return dark;
    const speck = hashNoise(Math.floor(s.d * 5) + c.seed, Math.floor(s.across * 4)) > 0.4;
    const swirl = Math.sin(s.d * 2 + vnoise(s.d, s.across, c.seed) * 5) > 0.7;
    return speck ? mix(dark, [190, 140, 255], 0.7) : swirl ? mix(dark, c.accent, 0.25) : dark;
  },

  // ─── NEW ESSENCES ────────────────────────────────────────────────────────

  // vanilla-faithful: top-lit rim + dark shadow + flat middle (matches Faithful/Jolicraft textures)
  vanilla: (col, s) => {
    const t = s.across;
    if (t < -0.7) return shade(col, 1.3);
    if (t < -0.5) return shade(col, 1.15);
    if (t > 0.7) return shade(col, 0.6);
    if (t > 0.5) return shade(col, 0.75);
    return col;
  },

  // normal-bevelled: a soft light line near the upper-left edge and a shadow line near the bottom-right,
  // simulating aMidianborn / Skyrim NormalMap diffuse without actually generating a normal map.
  bevel: (col, s) => {
    const highlight = Math.exp(-Math.pow((s.across + 0.7) / 0.16, 2));
    const sheen = Math.exp(-Math.pow((s.across + 0.32) / 0.08, 2)) * 0.55;
    const shadow = Math.exp(-Math.pow((s.across - 0.55) / 0.22, 2));
    let out = col;
    out = mix(out, shade(col, 1.35), highlight * 0.8);
    out = mix(out, shade(col, 1.1), sheen);
    out = mix(out, shade(col, 0.6), shadow);
    return out;
  },

  // ice-and-fire: dark steel with drifting pale runes and emissive cracks along the spine.
  ifire: (col, s, c) => {
    const dark = shade(col, 0.78);
    if (!c.fine) return dark;
    const bands = Math.abs(Math.sin(s.d * 4 + vnoise(s.d * 2, 0, c.seed) * 3)) > 0.94;
    const spine = Math.abs(s.across) < 0.18 && ((s.d * 8) % 1) < 0.4;
    const glow = (bands || spine) ? mix(c.glow, [180, 230, 255], 0.4) : dark;
    return mix(glow, dark, bands ? 0.6 : 0);
  },

  // stormforged: lightning crackle pattern with white-hot core lines
  stormforged: (col, s, c) => {
    if (!c.fine) return shade(col, 0.86);
    const bolt = Math.abs(Math.sin(s.d * 9 + vnoise(s.d * 3, s.across, c.seed) * 4)) > 0.96;
    const fork = Math.abs(s.across - Math.sin(s.d * 3) * 0.4) < 0.07 && Math.sin(s.d * 2.3) > 0.7;
    return bolt || fork ? mix(c.glow, [240, 245, 255], 0.5) : shade(col, 0.86);
  },

  // skyblock: heavy specular sheen line, big gem pulse every 0.18 progress, deep warm-to-cool gradient
  skyblock: (col, s, c) => {
    const sheen = Math.exp(-Math.pow((s.across + 0.45) / 0.12, 2));
    const pulse = ((s.d * 5.5) % 1 < 0.05 && Math.abs(s.across) < 0.4) ? 0.6 : 0;
    let out = mix(col, shade(col, 1.5), sheen * 0.7);
    out = mix(out, c.accent, pulse);
    return out;
  },

  // faith-crafted: Faithful 32x and 64x texture-pack style — flat colour banded into 3 zones, dark outline,
  // prominent bevel highlight near the lit edge.
  faithful: (col, s, c) => {
    const t = Math.max(-1, Math.min(1, s.across));
    const lit = t < -0.6;
    const mid = t < 0.3;
    if (lit) return mix(col, c.edge, 0.5);
    if (mid) return col;
    return shade(col, 0.7);
  },

  // warmith: a generic warm-aluminium finish with a single bright band along the spine
  warmith: (col, s) => {
    const sheen = Math.exp(-Math.pow((s.across + 0.5) / 0.18, 2));
    return mix(col, shade(col, 1.4), sheen * 0.6);
  },

  // jade: deep green with subtle polished highlights and tiny carved glyphs
  jade: (col, s, c) => {
    const green = mix(col, [72, 142, 110], 0.25);
    const sheen = Math.exp(-Math.pow((s.across + 0.55) / 0.14, 2));
    let out = mix(green, shade(green, 1.45), sheen * 0.65);
    if (c.fine && Math.abs(s.d * 6 - Math.round(s.d * 6)) < 0.04 && Math.abs(s.across) < 0.3) out = shade(out, 0.78);
    return out;
  },

  // ─── REAL HAMON (刃文) ──────────────────────────────────────────────
  // The temper line separating the hardened edge (yakiba) from the soft spine (ji).
  // `across` is negative on the cutting edge, so the line sits around across ≈ -0.2.

  // suguha (直刃): a straight, unbroken line. The oldest and most restrained pattern.
  suguha: (col, s, c) => {
    const line = -0.22;
    if (s.across < line) return mix(col, c.edge, 0.5);
    return Math.abs(s.across - line) < 0.06 ? mix(col, c.edge, 0.85) : col;
  },

  // gunome (互の目): rounded waves like rolling hills.
  gunome: (col, s, c) => {
    const line = -0.22 + Math.sin(s.d * 4.2) * 0.11;
    if (s.across < line) return mix(col, c.edge, 0.5);
    return Math.abs(s.across - line) < 0.055 ? mix(col, c.edge, 0.85) : col;
  },

  // choji (丁子): clove-bud shaped lobes, the Bizen school signature.
  choji: (col, s, c) => {
    const bud = Math.max(0, Math.sin(s.d * 5.4)) ** 0.7;
    const line = -0.18 - bud * 0.2;
    if (s.across < line) return mix(col, c.edge, 0.52);
    return Math.abs(s.across - line) < 0.06 ? mix(col, c.edge, 0.88) : col;
  },

  // notare (湾れ): broad, irregular flowing waves — the Yamashiro school.
  notare: (col, s, c) => {
    const line = -0.22 + vnoise(s.d * 1.3, 0, c.seed) * 0.2 - 0.1;
    if (s.across < line) return mix(col, c.edge, 0.48);
    return Math.abs(s.across - line) < 0.075 ? mix(col, c.edge, 0.8) : col;
  },

  // inazuma (稲妻): lightning-shaped bright streaks running through the yakiba.
  inazuma: (col, s, c) => {
    const base = -0.22 + Math.sin(s.d * 3.6) * 0.1;
    const bolt = Math.abs(s.across - base + Math.sin(s.d * 14) * 0.06) < 0.035;
    if (s.across < base) return mix(col, c.edge, 0.45);
    return bolt ? mix(col, [255, 255, 255], 0.55) : Math.abs(s.across - base) < 0.05 ? mix(col, c.edge, 0.8) : col;
  },

  // kinsuji (金筋): thin golden lines running along the grain inside the yakiba.
  kinsuji: (col, s, c) => {
    const base = -0.24 + Math.sin(s.d * 3.1) * 0.09;
    const gold = Math.abs(s.across - base * 0.6) < 0.028 && Math.sin(s.d * 9 + c.seed) > 0.35;
    if (s.across < base) return mix(col, c.edge, 0.42);
    return gold ? mix(col, [235, 200, 120], 0.7) : Math.abs(s.across - base) < 0.05 ? mix(col, c.edge, 0.78) : col;
  },

  // ─── FANTASY ESSENCES ──────────────────────────────────────────────

  // dualtone (Night and Flame): the blade split lengthwise into two colours.
  dualtone: (col, s, c) => (s.across < 0
    ? mix(col, c.accent, 0.55)
    : mix(col, c.edge, 0.4)),

  // helix (Godslayer): the blade twisted into a spiral, read as alternating bands.
  helix: (col, s, c) => {
    const twist = Math.sin(s.d * 3.4 + s.across * 5.5);
    return twist > 0.45 ? mix(col, c.edge, 0.35) : twist < -0.6 ? shade(col, 0.78) : col;
  },

  // whorl (Velmorian energy sword): delicate woven patterns on the metal.
  whorl: (col, s, c) => {
    if (!c.fine) return col;
    const a = Math.sin(s.d * 6 + Math.sin(s.across * 4) * 2);
    const b = Math.sin(s.across * 7 + Math.sin(s.d * 3) * 2);
    return a * b > 0.55 ? mix(col, c.edge, 0.4) : a * b < -0.75 ? shade(col, 0.84) : col;
  },

  // divine (Golden Order): rigid geometric order, intersecting straight lines.
  divine: (col, s, c) => {
    if (!c.fine) return mix(col, c.edge, 0.15);
    const v = Math.abs(Math.sin(s.d * 4.5));
    const h = Math.abs(Math.sin(s.across * 6));
    const cross = v < 0.09 || h < 0.09;
    const diamond = Math.abs(v - h) < 0.07;
    return cross ? mix(col, c.edge, 0.5) : diamond ? mix(col, c.edge, 0.28) : col;
  },

  // nightflame: half cold void, half ember, meeting in a ragged seam.
  nightflame: (col, s, c) => {
    const seam = Math.sin(s.d * 5) * 0.15;
    return s.across < seam
      ? mix(shade(col, 0.62), c.core, 0.5)
      : mix(col, c.glow, 0.45 + 0.2 * Math.max(0, s.across));
  },

  // rengoku (Flame Hashira): gold at the spine flowing to crimson at the edge.
  rengoku: (col, s) => {
    const t = (s.across + 1) / 2;
    return mix(mix(col, [232, 186, 92], 0.55), mix(col, [186, 52, 42], 0.6), t);
  },

  // dragonscale (Dragonscale Blade): borrowed from the monster itself.
  dragonscale: (col, s, c) => {
    if (!c.fine) return mix(col, c.core, 0.25);
    const freq = 1.7;
    const row = Math.floor(s.d * freq);
    const fx = ((s.d * freq) % 1 + 1) % 1, fy = (((s.across * 1.1 + (row % 2 ? 0.5 : 0)) % 1) + 1) % 1;
    const r = Math.hypot(fx - 0.5, (fy - 0.5) * 1.1);
    // Softer two-step ramp instead of a hard rim, so the scales stay readable.
    if (r > 0.5) return shade(mix(col, c.core, 0.3), 0.82);
    if (r > 0.38) return shade(mix(col, c.core, 0.2), 0.92);
    return r < 0.2 ? mix(col, c.edge, 0.22) : col;
  },

  // luminous (Sacred Relic): lit from within, brightest along the spine.
  luminous: (col, s, c) => {
    const core = Math.exp(-Math.pow(s.across / 0.45, 2));
    return mix(col, mix(c.edge, [255, 252, 240], 0.4), core * 0.75);
  },

  // Ultimate SkyBlock Remix: high-contrast relic stripe that survives busy
  // inventory screens and makes a custom drop readable at a glance.
  ultimate_skyblock: (col, s, c) => {
    const rim = Math.exp(-Math.pow((s.across + 0.62) / 0.14, 2));
    const relic = c.fine && Math.abs(((s.d * 4.2) % 1) - 0.5) < 0.035 && Math.abs(s.across) < 0.28;
    let out = mix(shade(col, 0.82), c.edge, rim * 0.86);
    if (relic) out = mix(out, c.accent, 0.5);
    return out;
  },

  // FurfSky essence: compact 16x identity, dark contour, saturated gem-like
  // accents and small controlled facets instead of noisy grain.
  furfsky: (col, s, c) => {
    const rim = Math.exp(-Math.pow((s.across + 0.72) / 0.11, 2));
    const facet = Math.sin(s.d * 7 + s.across * 3) > 0.72;
    let out = mix(shade(col, 0.76), c.edge, rim * 0.95);
    if (facet && c.fine) out = mix(out, c.accent, 0.22);
    return out;
  },

  // Hypixel+ / Vanilla+: retain three readable value families, then add one
  // restrained painted edge so custom items still feel native to Minecraft.
  hypixel_plus: (col, s, c) => {
    const t = Math.max(-1, Math.min(1, s.across));
    if (t < -0.72) return mix(col, c.edge, 0.72);
    if (t > 0.68) return shade(col, 0.66);
    if (c.fine && Math.abs(s.d * 3.5 - Math.round(s.d * 3.5)) < 0.05) return mix(col, c.edge, 0.12);
    return col;
  },

  // Spartan Weaponry: forged, functional, slightly worn metal with draw-file marks.
  spartan_forge: (col, s, c) => {
    const file = Math.sin(s.d * 26 + vnoise(s.d * 2, s.across, c.seed) * 2);
    const bevel = Math.exp(-Math.pow((s.across + 0.48) / 0.2, 2));
    let out = shade(col, file > 0.5 ? 1.05 : 0.91);
    out = mix(out, c.edge, bevel * 0.34);
    return out;
  },

  // Ice & Fire Dragonsteel: dark forged shell with elemental veins.
  dragonsteel: (col, s, c) => {
    if (!c.fine) return shade(col, 0.78);
    const vein = Math.abs(Math.sin(s.d * 6 + Math.sin(s.across * 3) * 1.4 + c.seed * 0.01));
    const crack = vein > 0.965;
    return crack ? mix(c.glow, c.edge, 0.35) : mix(shade(col, 0.76), col, 0.2);
  },

  // Dragonbone: porous ivory with a dark organic grain and ridges.
  dragonbone: (col, s, c) => {
    const porous = fbm(s.d * 4, s.across * 3, c.seed);
    const ridge = Math.abs(Math.sin(s.d * 5 + s.across * 2)) > 0.88;
    const bone = mix(col, [226, 215, 187], 0.48);
    return ridge ? shade(bone, 0.68) : shade(bone, 0.88 + porous * 0.15);
  },

  // Simply Swords runic variant: material face plus a clean central rune lane.
  simply_runic: (col, s, c) => {
    const lane = Math.abs(s.across) < 0.24;
    const glyph = c.fine && lane && Math.abs(Math.sin(s.d * 13 + c.seed * 0.02)) > 0.72;
    const out = mix(col, c.core, lane ? 0.12 : 0);
    return glyph ? mix(out, c.accent, 0.7) : out;
  },

  // Vanilla+ finish: the faithful three-band base, plus a crisp inner bevel
  // on the lit side, a restrained shadow line, and micro grain that reads
  // as forged texture rather than noise. Mirrors the vanilla renderer's plus mode.
  vanilla_plus: (col, s, c) => {
    const t = Math.max(-1, Math.min(1, s.across));
    let out = col;
    if (t < -0.68) out = mix(col, c.edge, 0.62);
    else if (t > 0.62) out = shade(col, 0.74);
    const bevel = Math.exp(-Math.pow((t + 0.42) / 0.13, 2));
    out = mix(out, c.edge, bevel * 0.3);
    if (c.fine) {
      const g = hashNoise(Math.floor(s.d * 9) + c.seed, Math.floor(s.across * 9)) * 0.1;
      out = shade(out, 1 + g);
    }
    return out;
  },
};

export function applySurface(style: SurfaceStyle, col: RGB, s: Surface, c: SurfaceCtx): RGB {
  // Thin blades cannot carry fine texture; fall back to a tint of the material.
  if (c.bladePx < 5 && style !== "polished") {
    const tint = PATTERNS[style](col, { ...s, across: 0 }, c);
    return mix(col, tint, 0.5);
  }
  return PATTERNS[style](col, s, c);
}

export const SURFACE_LABELS: Record<SurfaceStyle, string> = {
  polished: "研磨鋼 / Polished", damascus: "積層鋼 / Damascus", hamon: "刃文 / Hamon",
  obsidian: "黒曜石 / Obsidian", crystal: "水晶 / Crystal", bone: "骨 / Bone", wood: "木 / Wood",
  scales: "鱗 / Scales", magma: "溶岩 / Magma", frost: "霜 / Frost", hammered: "槌目 / Hammered",
  etched: "彫刻 / Etched", worn: "使い込み / Worn", banded: "縞岩 / Banded", gilded: "金象嵌 / Gilded",
  circuit: "回路 / Circuit", starfield: "星空 / Starfield", prismarine: "プリズマリン / Prismarine",
  amethyst: "紫水晶 / Amethyst", ender: "エンダー / Ender",
  suguha: "直刃 / Suguha", gunome: "互の目 / Gunome", choji: "丁子 / Choji",
  notare: "湾れ / Notare", inazuma: "稲妻 / Inazuma", kinsuji: "金筋 / Kinsuji",
  dualtone: "二色 / Night & Flame", helix: "螺旋 / Helix", whorl: "渦紋 / Whorl",
  divine: "神聖幾何 / Divine", nightflame: "夜炎 / Nightflame", rengoku: "煉獄 / Rengoku",
  dragonscale: "竜鱗 / Dragonscale", luminous: "内光 / Luminous",
  vanilla: "バニラ信仰 / Vanilla Faithful", bevel: "ベベル仕上げ / Beveled", ifire: "氷火の刃 / Ice & Fire",
  stormforged: "嵐鍛冶 / Stormforged", skyblock: "スカイブロック級 / SkyBlock", faithful: "Faithful 32x / Faithful",
  warmith: "温かみのある鋼 / Warmith", jade: "翡翠鋼 / Jade",
  ultimate_skyblock: "究極スカイブロック / Ultimate SkyBlock",
  furfsky: "ファースカイ風 / FurfSky Essence",
  hypixel_plus: "バニラプラス / Hypixel+ Essence",
  spartan_forge: "スパルタン鍛造 / Spartan Forge",
  dragonsteel: "竜鋼 / Dragonsteel",
  dragonbone: "竜骨 / Dragonbone",
  simply_runic: "ルニック武器 / Simply Runic",
  vanilla_plus: "バニラプラス / Vanilla+",
};

// Avoid an unused-symbol error for the gradient3 helper (kept for upcoming visuals).
void gradient3;
