if(typeof globalThis.ImageData==="undefined"){globalThis.ImageData=class{constructor(a,b,c){if(typeof a==="number"){this.width=a;this.height=b;this.data=new Uint8ClampedArray(a*b*4)}else{this.data=a;this.width=b;this.height=c??a.length/4/b}}};}

// src/arcane.ts
var import_node_fs = require("node:fs");

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/defaults.ts
var DEFAULT_ANIMATION = {
  type: "none",
  fps: 20,
  frames: 16,
  intensity: 0.8,
  loopMode: "loop",
  mcmeta: true,
  blendGlint: false,
  frameByFrame: true
};
var DEFAULT_CONFIG = {
  seed: 1337,
  resolution: 64,
  refined: true,
  animation: { ...DEFAULT_ANIMATION },
  modEssence: "none",
  gemCut: "brilliant",
  gemMount: "claw",
  gemCount: 3,
  gemScale: 0.18,
  adornmentStyle: "filigree",
  adornmentDensity: 0.45,
  rarity: "epic",
  harmony: "custom",
  paletteSize: 0,
  softEdge: false,
  dangleStyle: "none",
  dangleCount: 2,
  wearStyle: "none",
  wearAmount: 0.35,
  motif2: "none",
  motif2Intensity: 0.4,
  element: "arcane",
  itemType: "staff",
  shaftLength: 0.86,
  shaftThickness: 0.062,
  shaftAngle: -48,
  shaftCurve: 0.04,
  shaftStyle: "royal",
  shaftColor: "#6b4226",
  shaftColor2: "#3d2413",
  shaftDetail: 0.45,
  wrapStyle: "spiral",
  wrapColor: "#d4af37",
  wrapDensity: 6,
  collarStyle: "filigree",
  collarColor: "#d4af37",
  headShape: "orb",
  headSize: 0.3,
  gemColor: "#7c3aed",
  gemColor2: "#22d3ee",
  gemGlow: 0.8,
  innerStyle: "galaxy",
  prongs: 3,
  prongColor: "#e8c874",
  tipStyle: "gem",
  tipScale: 0.5,
  orbiterStyle: "none",
  orbiterCount: 3,
  orbiterRadius: 1.55,
  orbiterSize: 0.14,
  pommelStyle: "gem",
  pommelColor: "#d4af37",
  wings: "none",
  wingColor: "#f5f0e6",
  halo: "none",
  haloColor: "#ffd700",
  horns: false,
  hornColor: "#e8dcc0",
  particles: 10,
  particleStyle: "sparkle",
  particleColor: "#c4b5fd",
  outline: "selout",
  shading: 0.75,
  dither: true,
  outerGlow: 0.28,
  glowColor: "#7c3aed",
  dropShadow: false,
  finish: "enchanted",
  contrast: 1.1,
  grain: 0.35,
  motif: "rune",
  motifIntensity: 0.5
};

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/types.ts
var SHAFTLESS_TYPES = ["relic", "signet", "monolith", "orb-solo", "pennant", "idol", "chime"];
var isShaftless = (t) => SHAFTLESS_TYPES.includes(t);
var ALL_HEADS = ["orb", "crystal", "cluster", "star", "crescent", "eye", "diamond", "bloom", "skull", "rune-cube", "teardrop", "prism", "lantern", "anvil", "moonlet", "hourglass", "tome", "chalice", "feather", "ankh", "spiral-shell", "tesseract", "dragon-egg", "compass", "heart", "lotus", "portal", "meteor", "keyhole", "rose-window", "mask", "octahedron", "aurora-crown", "snow-globe", "butterfly", "wing", "helmet", "crown", "music-box", "nether-star", "beacon", "totem", "geode", "ender-pearl", "potion-flask", "dragon-breath", "shulker-core", "respawn-anchor", "glow-berries", "banner", "brazier"];
var ALL_SHAFTS = ["straight", "gnarled", "twisted", "bone", "royal", "leather", "bamboo", "ornate", "crystal", "segmented", "obsidian", "ivory", "braided", "chain-link", "rune-carved", "coral", "techno", "driftwood", "ebony", "porcelain", "alloy", "oak", "birch", "dark-oak", "spruce", "jungle", "cherry", "mangrove", "azalea", "mech-brass", "mech-iron", "copper", "pipe", "conveyor", "gemmed", "gem-column", "gem-tube", "embedding", "bamboo-woven", "glass", "prismarine", "kelp-rope", "anchor-chain", "sponge"];
var ALL_WRAPS = ["none", "spiral", "rings", "vine", "chain", "rune-band", "stitch", "scale", "ribbon", "thorn", "wire"];
var ALL_COLLARS = ["none", "ring", "guard", "crown", "claw", "filigree", "socket", "wing-guard", "skull-collar", "orb-cage", "tea-cup", "bell-dome"];
var ALL_POMMELS = ["none", "cap", "gem", "spike", "ring", "tassel", "skullcap", "orb", "crescent", "anchor", "split-tassel", "lantern-hanger"];
var ALL_TIPS = ["none", "gem", "crown", "spike", "flame", "star", "halo", "floating-gem", "cluster", "crystal-tip", "lantern", "orbit-ring", "plume", "bell", "eye-tip", "blade", "gem-cluster", "triple-prong", "lotus-crown", "celestial-cage", "reliquary", "phoenix-plume", "dragon-fang", "void-crown", "prism-vortex", "sun-disc", "moon-circlet", "living-bloom", "snow-globe-tip", "butterfly-tip", "wing-pair", "prism-trio"];
var ALL_ORBITERS = ["none", "orb", "shard", "rune", "star", "gear", "leaf", "ember", "snowflake", "spark", "crystal", "skull", "feather", "bubble", "card", "gem-set", "twin-gem", "crown", "rune-satellite", "prism-ring", "petal-orbit", "mini-moon", "sigil", "gem-chain", "constellation", "orbit-diamonds", "hourglass", "snow-globe", "butterfly-swarm", "prism-comet", "pearl", "comet-dust"];
var ALL_WINGS = ["none", "angel", "bat", "fae", "blade", "seraph", "mech", "crystal", "flame", "leafwing", "peacock", "cape"];
var ALL_HALOS = ["none", "ring", "double", "rune-ring", "eclipse", "sunburst", "triple", "hex-grid", "spiral", "shattered", "lens-flare"];
var ALL_PARTICLES = ["sparkle", "dots", "plus", "diamonds", "mixed", "embers", "bubbles", "snow", "leaf", "stars", "runes", "hearts", "ash", "musical", "firefly", "glow-dust"];
var ALL_FINISHES = ["matte", "glossy", "metallic", "enchanted", "weathered", "holographic", "frosted", "lacquered", "pearl", "vegetal"];
var ALL_MOTIFS = ["none", "flame", "frost", "bolt", "leaf", "rays", "wisp", "rune", "drip", "wave", "rock", "void", "constellation", "sculk-tendril", "mana-weave", "chains", "feathers", "gears", "shards", "petals", "notes", "clock", "bubbles-motif", "aurora-waves", "jewel-halo", "music-notes"];
var ALL_INNERS = ["core", "facet", "swirl", "galaxy", "none", "crack", "liquid"];
var ALL_MOD_ESSENCES = ["none", "thaumcraft", "botania", "aether", "astral-sorcery", "hypixel-legend", "electroblob", "sculk-ancient", "netherite-gilded", "sakura-oneiric", "forge-master", "industrial", "wildwood", "aquatic", "masterwork"];
var ALL_RARITIES = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "divine"];
var ALL_HARMONIES = ["custom", "complementary", "analogous", "triadic", "split", "tetradic", "monochrome"];
var ALL_WEARS = ["none", "chipped", "cracked", "scratched", "burned", "mossy", "frosted-over", "blood-stained"];
var ALL_DANGLES = ["none", "ribbon", "chain-charm", "bell", "feather", "crystal-drop", "beads", "talisman-tag"];
var ALL_GEM_CUTS = ["brilliant", "emerald", "marquise", "cabochon", "star-cut", "opal", "prism", "rose-cut"];
var ALL_GEM_MOUNTS = ["claw", "bezel", "cage", "floating", "halo", "petal"];
var ALL_ADORNMENTS = ["none", "filigree", "star-map", "thorn-vine", "gold-pave", "rune-engraving", "chain-drape", "petal-mantle", "geodesic", "braided"];

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/catalog/rarity.ts
var RARITIES = [
  {
    id: "common",
    name: "\u30B3\u30E2\u30F3",
    nameEn: "COMMON",
    color: "#d4d4d8",
    glowBoost: 0,
    particleBoost: 0,
    ornateLevel: 0,
    desc: "\u7D20\u6734\u306A\u91CF\u7523\u54C1\u3002\u88C5\u98FE\u306A\u3057\u3001\u920D\u3044\u9670\u5F71\u3002",
    patch: { outerGlow: 0.04, particles: 2, halo: "none", wings: "none", orbiterStyle: "none", motifIntensity: 0, finish: "matte", collarStyle: "ring", tipStyle: "none", shaftDetail: 0.15, contrast: 0.95, gemGlow: 0.15, gemCount: 0, adornmentStyle: "none", adornmentDensity: 0.08 }
  },
  {
    id: "uncommon",
    name: "\u30A2\u30F3\u30B3\u30E2\u30F3",
    nameEn: "UNCOMMON",
    color: "#4ade80",
    glowBoost: 0.12,
    particleBoost: 3,
    ornateLevel: 1,
    desc: "\u308F\u305A\u304B\u306A\u9B54\u529B\u306E\u5146\u3057\u3002\u63A7\u3048\u3081\u306A\u8F1D\u304D\u3002",
    patch: { outerGlow: 0.1, particles: 5, halo: "none", wings: "none", orbiterStyle: "none", motifIntensity: 0.2, finish: "matte", collarStyle: "ring", tipStyle: "gem", shaftDetail: 0.3, contrast: 1, gemGlow: 0.35, gemCount: 1, gemMount: "bezel", adornmentStyle: "gold-pave", adornmentDensity: 0.2 }
  },
  {
    id: "rare",
    name: "\u30EC\u30A2",
    nameEn: "RARE",
    color: "#3b82f6",
    glowBoost: 0.25,
    particleBoost: 6,
    ornateLevel: 2,
    desc: "\u5B89\u5B9A\u3057\u305F\u9B54\u529B\u5FAA\u74B0\u3002\u91D1\u5177\u3068\u7C92\u5B50\u304C\u73FE\u308C\u308B\u3002",
    patch: { outerGlow: 0.18, particles: 9, halo: "none", orbiterStyle: "none", motifIntensity: 0.4, finish: "glossy", collarStyle: "guard", tipStyle: "gem-cluster", shaftDetail: 0.45, contrast: 1.05, gemGlow: 0.55, gemCount: 2, gemMount: "claw", adornmentStyle: "filigree", adornmentDensity: 0.35 }
  },
  {
    id: "epic",
    name: "\u30A8\u30D4\u30C3\u30AF",
    nameEn: "EPIC",
    color: "#a855f7",
    glowBoost: 0.4,
    particleBoost: 10,
    ornateLevel: 3,
    desc: "\u5F37\u5927\u306A\u9B54\u529B\u3002\u5149\u8F2A\u3068\u88C5\u98FE\u91D1\u5177\u304C\u5BBF\u308B\u3002",
    patch: { outerGlow: 0.28, particles: 12, halo: "ring", orbiterStyle: "gem-set", orbiterCount: 3, motifIntensity: 0.6, finish: "enchanted", collarStyle: "filigree", tipStyle: "reliquary", shaftDetail: 0.6, contrast: 1.1, gemGlow: 0.7, prongs: 2, gemCount: 4, adornmentStyle: "star-map", adornmentDensity: 0.52 }
  },
  {
    id: "legendary",
    name: "\u30EC\u30B8\u30A7\u30F3\u30C0\u30EA\u30FC",
    nameEn: "LEGENDARY",
    color: "#fbbf24",
    glowBoost: 0.55,
    particleBoost: 14,
    ornateLevel: 4,
    desc: "\u4F1D\u8AAC\u306E\u907A\u7269\u3002\u6D6E\u904A\u7269\u3068\u4E8C\u91CD\u5149\u8F2A\u3092\u5F93\u3048\u308B\u3002",
    patch: { outerGlow: 0.38, particles: 15, halo: "double", orbiterStyle: "prism-ring", orbiterCount: 4, motifIntensity: 0.78, finish: "metallic", collarStyle: "crown", tipStyle: "celestial-cage", shaftDetail: 0.75, contrast: 1.16, gemGlow: 0.85, prongs: 3, dangleStyle: "chain-charm", gemCount: 5, adornmentStyle: "filigree", adornmentDensity: 0.68 }
  },
  {
    id: "mythic",
    name: "\u30DF\u30B7\u30C3\u30AF",
    nameEn: "MYTHIC",
    color: "#f472b6",
    glowBoost: 0.7,
    particleBoost: 18,
    ornateLevel: 5,
    desc: "\u795E\u8A71\u7D1A\u3002\u7FFC\u304C\u751F\u3048\u3001\u8679\u8272\u306E\u7C92\u5B50\u304C\u6E26\u5DFB\u304F\u3002",
    patch: { outerGlow: 0.5, particles: 19, halo: "triple", wings: "seraph", orbiterStyle: "twin-gem", orbiterCount: 5, motifIntensity: 0.9, finish: "holographic", collarStyle: "wing-guard", tipStyle: "lotus-crown", shaftDetail: 0.88, contrast: 1.22, gemGlow: 0.95, prongs: 4, dangleStyle: "crystal-drop", gemCount: 7, adornmentStyle: "geodesic", adornmentDensity: 0.84 }
  },
  {
    id: "divine",
    name: "\u30C7\u30A3\u30F4\u30A1\u30A4\u30F3",
    nameEn: "DIVINE",
    color: "#67e8f9",
    glowBoost: 0.85,
    particleBoost: 24,
    ornateLevel: 6,
    desc: "\u795E\u57DF\u3002\u3042\u3089\u3086\u308B\u88C5\u98FE\u304C\u6700\u5927\u9650\u306B\u958B\u82B1\u3059\u308B\u3002",
    patch: { outerGlow: 0.62, particles: 24, halo: "shattered", wings: "seraph", orbiterStyle: "constellation", orbiterCount: 6, motifIntensity: 1, finish: "holographic", collarStyle: "orb-cage", tipStyle: "prism-vortex", shaftDetail: 1, contrast: 1.28, gemGlow: 1, prongs: 4, dangleStyle: "crystal-drop", horns: false, gemCount: 8, adornmentStyle: "geodesic", adornmentDensity: 1 }
  }
];
var getRarity = (id) => RARITIES.find((r) => r.id === id) || RARITIES[0];

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/color.ts
var WHITE = [255, 255, 255];
var INK = [16, 11, 22];
var clamp255 = (v) => v < 0 ? 0 : v > 255 ? 255 : v;
var clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
var lerp = (a, b, t) => a + (b - a) * t;
function smoothstep(a, b, x) {
  const t = clamp01((x - a) / (b - a || 1e-6));
  return t * t * (3 - 2 * t);
}
function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  if (amt >= 0) return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  const f = 1 + amt;
  return rgbToHex(r * f, g * f, b * f);
}
var shadeRgb = (c, amt) => {
  if (amt >= 0) return [c[0] + (255 - c[0]) * amt, c[1] + (255 - c[1]) * amt, c[2] + (255 - c[2]) * amt];
  const f = 1 + amt;
  return [c[0] * f, c[1] * f, c[2] * f];
};
var mixRgb = (a, b, t) => {
  const c = clamp01(t);
  return [lerp(a[0], b[0], c), lerp(a[1], b[1], c), lerp(a[2], b[2], c)];
};
var lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
function hueShiftRgb(c, shift) {
  if (Math.abs(shift) < 1e-3) return c;
  const stops = [
    [255, 105, 180],
    [255, 165, 0],
    [255, 255, 0],
    [144, 238, 144],
    [0, 255, 255],
    [100, 149, 237],
    [186, 85, 211]
  ];
  const s = (shift % 1 + 1) % 1;
  const i = Math.floor(s * stops.length);
  const f = s * stops.length - i;
  const t = mixRgb(stops[i], stops[(i + 1) % stops.length], f);
  const out = mixRgb(c, t, 0.75);
  const k = lum(c) / Math.max(1, lum(out));
  return [clamp255(out[0] * k), clamp255(out[1] * k), clamp255(out[2] * k)];
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/harmony.ts
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h, s, l };
}
function hslToHex({ h, s, l }) {
  h = (h % 1 + 1) % 1;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  if (s === 0) {
    const v = l * 255;
    return rgbToHex(v, v, v);
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t) => {
    t = (t % 1 + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return rgbToHex(hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255);
}
var hexToHsl = (hex) => {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHsl(r, g, b);
};
var OFFSETS = {
  custom: [0, 0],
  complementary: [0.5, 0.5],
  analogous: [0.083, -0.083],
  triadic: [1 / 3, 2 / 3],
  split: [0.42, 0.58],
  tetradic: [0.25, 0.5],
  monochrome: [0, 0]
};
function applyHarmony(cfg, scheme) {
  if (scheme === "custom") return { harmony: scheme };
  const base = hexToHsl(cfg.gemColor);
  const [o1, o2] = OFFSETS[scheme];
  const mono = scheme === "monochrome";
  const gem2 = hslToHex({ h: base.h + (mono ? 0 : o1), s: mono ? base.s * 0.55 : Math.min(1, base.s * 0.9), l: Math.min(0.88, base.l + 0.26) });
  const glow = hslToHex({ h: base.h + (mono ? 0 : o1 * 0.4), s: Math.min(1, base.s * 1.05), l: Math.min(0.72, base.l + 0.1) });
  const particle = hslToHex({ h: base.h + (mono ? 0 : o2 * 0.35), s: base.s * 0.75, l: Math.min(0.9, base.l + 0.34) });
  const metal = hslToHex({ h: base.h + (mono ? 0 : o2), s: mono ? base.s * 0.3 : base.s * 0.62, l: 0.6 });
  const shaft = hslToHex({ h: base.h + (mono ? 0 : o2 * 0.8), s: mono ? base.s * 0.35 : base.s * 0.45, l: 0.26 });
  const shaft2 = hslToHex({ h: base.h + (mono ? 0 : o2 * 0.8), s: mono ? base.s * 0.3 : base.s * 0.4, l: 0.13 });
  const halo = hslToHex({ h: base.h + (mono ? 0 : o1), s: base.s * 0.8, l: 0.7 });
  const wing = hslToHex({ h: base.h + (mono ? 0 : o1 * 0.6), s: base.s * 0.3, l: 0.86 });
  return {
    harmony: scheme,
    gemColor2: gem2,
    glowColor: glow,
    particleColor: particle,
    collarColor: metal,
    prongColor: metal,
    pommelColor: metal,
    wrapColor: metal,
    shaftColor: shaft,
    shaftColor2: shaft2,
    haloColor: halo,
    wingColor: wing
  };
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/catalog/elements.ts
var ELEMENTS = [
  { id: "arcane", name: "\u79D8\u8853", nameEn: "Arcane", icon: "sparkles", gem: "#7c3aed", gem2: "#22d3ee", glow: "#8b5cf6", particle: "#c4b5fd", metal: "#d4af37", shaft: "#4a2c17", shaft2: "#241408", particleStyle: "sparkle", head: "orb", motif: "rune", shaftStyle: "royal", halo: "rune-ring", tip: "gem", wings: "none", finish: "enchanted", desc: "\u5747\u8861\u3057\u305F\u9B54\u529B \xB7 \u30EB\u30FC\u30F3\u3068\u661F" },
  { id: "fire", name: "\u708E", nameEn: "Inferno", icon: "flame", gem: "#ff5722", gem2: "#ffd54f", glow: "#ff6b1a", particle: "#ffb347", metal: "#b87333", shaft: "#2b1a12", shaft2: "#120905", particleStyle: "embers", head: "crystal", motif: "flame", shaftStyle: "gnarled", halo: "none", tip: "flame", wings: "none", finish: "glossy", desc: "\u71C3\u3048\u76DB\u308B\u696D\u706B \xB7 \u706B\u306E\u7C89" },
  { id: "ice", name: "\u6C37", nameEn: "Glacier", icon: "snowflake", gem: "#4fc3f7", gem2: "#e1f5fe", glow: "#29b6f6", particle: "#b3e5fc", metal: "#cfd8dc", shaft: "#dbeafe", shaft2: "#64748b", particleStyle: "diamonds", head: "diamond", motif: "frost", shaftStyle: "straight", halo: "ring", tip: "crystal-tip", wings: "angel", finish: "glossy", desc: "\u6C38\u4E45\u51CD\u571F \xB7 \u971C\u306E\u7D50\u6676" },
  { id: "lightning", name: "\u96F7", nameEn: "Tempest", icon: "zap", gem: "#ffd54f", gem2: "#fffde7", glow: "#ffeb3b", particle: "#fff59d", metal: "#90a4ae", shaft: "#334155", shaft2: "#0f172a", particleStyle: "mixed", head: "prism", motif: "bolt", shaftStyle: "twisted", halo: "double", tip: "star", wings: "blade", finish: "metallic", desc: "\u7A32\u59BB\u306E\u8108\u52D5 \xB7 \u653E\u96FB" },
  { id: "nature", name: "\u81EA\u7136", nameEn: "Verdant", icon: "leaf", gem: "#66bb6a", gem2: "#dcedc8", glow: "#4caf50", particle: "#a5d6a7", metal: "#8d6e63", shaft: "#4d3b28", shaft2: "#241a10", particleStyle: "leaf", head: "bloom", motif: "leaf", shaftStyle: "gnarled", halo: "none", tip: "cluster", wings: "fae", finish: "matte", desc: "\u751F\u547D\u306E\u606F\u5439 \xB7 \u8526\u3068\u8449" },
  { id: "light", name: "\u8056", nameEn: "Radiant", icon: "sun", gem: "#ffca28", gem2: "#fffde7", glow: "#ffc107", particle: "#fff9c4", metal: "#ffd700", shaft: "#f5f0e6", shaft2: "#a89f8d", particleStyle: "plus", head: "star", motif: "rays", shaftStyle: "royal", halo: "sunburst", tip: "crown", wings: "seraph", finish: "metallic", desc: "\u795E\u8056\u306A\u308B\u5149 \xB7 \u592A\u967D\u306E\u51A0" },
  { id: "dark", name: "\u95C7", nameEn: "Umbral", icon: "moon", gem: "#5e35b1", gem2: "#b39ddb", glow: "#7e57c2", particle: "#ce93d8", metal: "#5c6bc0", shaft: "#1e1b2e", shaft2: "#0b0a14", particleStyle: "dots", head: "crescent", motif: "wisp", shaftStyle: "twisted", halo: "eclipse", tip: "floating-gem", wings: "bat", finish: "metallic", desc: "\u5F71\u306E\u62B1\u64C1 \xB7 \u95C7\u306E\u9727" },
  { id: "blood", name: "\u8840", nameEn: "Sanguine", icon: "droplet", gem: "#c62828", gem2: "#ef9a9a", glow: "#e53935", particle: "#ff8a80", metal: "#8d6e63", shaft: "#e8dcc0", shaft2: "#8a7d5c", particleStyle: "embers", head: "eye", motif: "drip", shaftStyle: "bone", halo: "none", tip: "spike", wings: "none", finish: "weathered", desc: "\u8D64\u3044\u6708\u306E\u5100\u5F0F \xB7 \u8840\u306E\u6EF4" },
  { id: "water", name: "\u6C34", nameEn: "Tidal", icon: "waves", gem: "#0288d1", gem2: "#b3e5fc", glow: "#03a9f4", particle: "#80deea", metal: "#80deea", shaft: "#164e63", shaft2: "#082f49", particleStyle: "bubbles", head: "teardrop", motif: "wave", shaftStyle: "twisted", halo: "ring", tip: "floating-gem", wings: "fae", finish: "glossy", desc: "\u6F6E\u306E\u5F8B\u52D5 \xB7 \u6CE1\u3068\u6CE2" },
  { id: "earth", name: "\u5730", nameEn: "Titan", icon: "mountain", gem: "#8d6e63", gem2: "#d7ccc8", glow: "#a1887f", particle: "#bcaaa4", metal: "#a1887f", shaft: "#5d4037", shaft2: "#3e2723", particleStyle: "dots", head: "rune-cube", motif: "rock", shaftStyle: "segmented", halo: "none", tip: "crown", wings: "none", finish: "weathered", desc: "\u5927\u5730\u306E\u91CD\u307F \xB7 \u5CA9\u77F3" },
  { id: "void", name: "\u865A\u7A7A", nameEn: "Void", icon: "orbit", gem: "#311b92", gem2: "#7c4dff", glow: "#651fff", particle: "#b388ff", metal: "#b0bec5", shaft: "#1a1030", shaft2: "#08060f", particleStyle: "dots", head: "moonlet", motif: "void", shaftStyle: "obsidian", halo: "eclipse", tip: "floating-gem", wings: "bat", finish: "matte", desc: "\u7121\u306E\u4E2D\u5FC3 \xB7 \u661F\u98DF\u3044" },
  { id: "poison", name: "\u6BD2", nameEn: "Venom", icon: "bug", gem: "#65a30d", gem2: "#bef264", glow: "#84cc16", particle: "#a3e635", metal: "#4d7c0f", shaft: "#2f3b1a", shaft2: "#161d0c", particleStyle: "bubbles", head: "spiral-shell", motif: "drip", shaftStyle: "coral", halo: "none", tip: "eye-tip", wings: "none", finish: "glossy", desc: "\u8150\u8755\u306E\u9727 \xB7 \u6EF4\u308B\u6BD2\u6DB2" },
  { id: "wind", name: "\u98A8", nameEn: "Zephyr", icon: "wind", gem: "#67e8f9", gem2: "#f0fdfa", glow: "#a5f3fc", particle: "#cffafe", metal: "#cbd5e1", shaft: "#d6d3d1", shaft2: "#78716c", particleStyle: "leaf", head: "feather", motif: "feathers", shaftStyle: "driftwood", halo: "spiral", tip: "plume", wings: "leafwing", finish: "matte", desc: "\u75BE\u98A8\u306E\u56C1\u304D \xB7 \u821E\u3046\u7FBD\u6839" },
  { id: "crystal", name: "\u6676", nameEn: "Prismatic", icon: "crystal", gem: "#e879f9", gem2: "#a5f3fc", glow: "#d946ef", particle: "#f5d0fe", metal: "#e2e8f0", shaft: "#f8fafc", shaft2: "#94a3b8", particleStyle: "diamonds", head: "tesseract", motif: "shards", shaftStyle: "crystal", halo: "hex-grid", tip: "crystal-tip", wings: "crystal", finish: "holographic", desc: "\u8679\u306E\u5C48\u6298 \xB7 \u7D50\u6676\u306E\u5171\u9CF4" },
  { id: "sound", name: "\u97F3", nameEn: "Resonance", icon: "sound", gem: "#f59e0b", gem2: "#fde68a", glow: "#fbbf24", particle: "#fef3c7", metal: "#b45309", shaft: "#78350f", shaft2: "#3b1c05", particleStyle: "musical", head: "chalice", motif: "notes", shaftStyle: "braided", halo: "triple", tip: "bell", wings: "none", finish: "metallic", desc: "\u97FF\u304D\u306E\u6CE2\u7D0B \xB7 \u9418\u306E\u5F8B\u52D5" },
  { id: "time", name: "\u6642", nameEn: "Chronos", icon: "clock", gem: "#d4af37", gem2: "#fef9c3", glow: "#eab308", particle: "#fde047", metal: "#a16207", shaft: "#44403c", shaft2: "#1c1917", particleStyle: "runes", head: "hourglass", motif: "clock", shaftStyle: "techno", halo: "double", tip: "orbit-ring", wings: "mech", finish: "lacquered", desc: "\u7802\u306E\u6D41\u8EE2 \xB7 \u6B6F\u8ECA\u306E\u79E9\u5E8F" },
  { id: "dream", name: "\u5922", nameEn: "Oneiric", icon: "dream", gem: "#c084fc", gem2: "#fbcfe8", glow: "#e9d5ff", particle: "#f5d0fe", metal: "#a78bfa", shaft: "#4c1d95", shaft2: "#2e1065", particleStyle: "stars", head: "dragon-egg", motif: "petals", shaftStyle: "braided", halo: "spiral", tip: "floating-gem", wings: "fae", finish: "frosted", desc: "\u7720\u308A\u306E\u5E33 \xB7 \u6DE1\u3044\u5E7B\u5F71" },
  { id: "sakura", name: "\u685C", nameEn: "Sakura", icon: "flower", gem: "#f9a8d4", gem2: "#fbcfe8", glow: "#f472b6", particle: "#fecdd3", metal: "#f9c5d5", shaft: "#783c50", shaft2: "#4c1d2c", particleStyle: "sparkle", head: "bloom", motif: "petals", shaftStyle: "gnarled", halo: "none", tip: "living-bloom", wings: "fae", finish: "glossy", desc: "\u591C\u306E\u82B1\u5439\u96EA \xB7 \u6DE1\u3044\u6625\u306E\u9B54\u529B" },
  { id: "steel", name: "\u92FC", nameEn: "Forged Steel", icon: "hammer", gem: "#94a3b8", gem2: "#fcd34d", glow: "#d97706", particle: "#e2e8f0", metal: "#e8c874", shaft: "#57534e", shaft2: "#26221f", particleStyle: "ash", head: "anvil", motif: "gears", shaftStyle: "alloy", halo: "none", tip: "blade", wings: "blade", finish: "metallic", desc: "\u935B\u9020\u306E\u8A87\u308A \xB7 \u71C3\u3048\u308B\u5FC3\u9244" },
  { id: "cosmos", name: "\u5B87\u5B99", nameEn: "Cosmos", icon: "orbit", gem: "#6366f1", gem2: "#a5b4fc", glow: "#818cf8", particle: "#c7d2fe", metal: "#b0bec5", shaft: "#1e1b4b", shaft2: "#0d0a26", particleStyle: "stars", head: "portal", motif: "constellation", shaftStyle: "obsidian", halo: "hex-grid", tip: "prism-trio", wings: "seraph", finish: "holographic", desc: "\u9280\u6CB3\u306E\u5DE1\u661F \xB7 \u7121\u9650\u306E\u5171\u9CF4" },
  { id: "desert", name: "\u7802", nameEn: "Desert", icon: "mountain", gem: "#f59e0b", gem2: "#fde68a", glow: "#fbbf24", particle: "#fdba74", metal: "#b08968", shaft: "#7c5a35", shaft2: "#4a3721", particleStyle: "ash", head: "meteor", motif: "rock", shaftStyle: "driftwood", halo: "sunburst", tip: "gem-cluster", wings: "none", finish: "weathered", desc: "\u707C\u71B1\u306E\u5730\u5E73 \xB7 \u5343\u5E74\u306E\u7802\u5D50" },
  { id: "dragon", name: "\u7ADC", nameEn: "Dragon", icon: "crown", gem: "#ef4444", gem2: "#fca5a5", glow: "#dc2626", particle: "#fca5a5", metal: "#7d7461", shaft: "#44403c", shaft2: "#1c1917", particleStyle: "embers", head: "dragon-egg", motif: "flame", shaftStyle: "bone", halo: "none", tip: "dragon-fang", wings: "bat", finish: "lacquered", desc: "\u53E4\u304D\u7ADC\u306E\u606F\u5439 \xB7 \u7259\u3068\u9C57\u306E\u5A01\u5149" },
  { id: "psyche", name: "\u970A", nameEn: "Psyche", icon: "moon", gem: "#a78bfa", gem2: "#67e8f9", glow: "#c4b5fd", particle: "#99f6e4", metal: "#5eead4", shaft: "#312e81", shaft2: "#161342", particleStyle: "mixed", head: "eye", motif: "wisp", shaftStyle: "crystal", halo: "spiral", tip: "eye-tip", wings: "fae", finish: "frosted", desc: "\u601D\u5FF5\u306E\u6E56\u9762 \xB7 \u5E7B\u60D1\u306E\u5149\u8108" },
  { id: "foreman", name: "\u7523", nameEn: "Industrialist", icon: "hammer", gem: "#d97706", gem2: "#fde68a", glow: "#f59e0b", particle: "#fbbf24", metal: "#b87333", shaft: "#8b5a2b", shaft2: "#3a2313", particleStyle: "ash", head: "anvil", motif: "gears", shaftStyle: "mech-brass", halo: "none", tip: "blade", wings: "none", finish: "metallic", desc: "\u92FC\u8F2A\u306E\u9999\u308A \xB7 \u5DE5\u696D\u306E\u8A87\u308A" },
  { id: "grove", name: "\u91CE", nameEn: "Wildwood", icon: "leaf", gem: "#65a30d", gem2: "#a3e635", glow: "#4ade80", particle: "#a5d6a7", metal: "#6b4f2e", shaft: "#6b4f2e", shaft2: "#362716", particleStyle: "leaf", head: "feather", motif: "leaf", shaftStyle: "oak", halo: "none", tip: "cluster", wings: "leafwing", finish: "matte", desc: "\u68EE\u6797\u547C\u5438 \xB7 \u5927\u5730\u306E\u547C\u5438" },
  { id: "gemshine", name: "\u7C8B", nameEn: "Gemshine", icon: "gem", gem: "#e879f9", gem2: "#a5b4fc", glow: "#d946ef", particle: "#f5d0fe", metal: "#d4af37", shaft: "#f8fafc", shaft2: "#94a3b8", particleStyle: "diamonds", head: "octahedron", motif: "shards", shaftStyle: "gem-tube", halo: "triple", tip: "gem-cluster", wings: "crystal", finish: "holographic", desc: "\u5916\u90E8\u306F\u785D\u5B50\u7B52 \xB7 \u5149\u6F0F\u308C\u306E\u5B9D\u77F3\u67F1" },
  { id: "undertow", name: "\u6F6E", nameEn: "Undertow", icon: "waves", gem: "#06b6d4", gem2: "#a5f3fc", glow: "#22d3ee", particle: "#80deea", metal: "#5eead4", shaft: "#0e7490", shaft2: "#062a36", particleStyle: "bubbles", head: "teardrop", motif: "wave", shaftStyle: "prismarine", halo: "ring", tip: "floating-gem", wings: "fae", finish: "glossy", desc: "\u6DF1\u6DF5\u306E\u6697\u6CE2 \xB7 \u518D\u6B21\u6F6E\u6C50\u306E\u5E30\u308A" },
  { id: "vine", name: "\u8513", nameEn: "Vineyard", icon: "leaf", gem: "#15803d", gem2: "#86efac", glow: "#22c55e", particle: "#bbf7d0", metal: "#166534", shaft: "#4d7c2a", shaft2: "#1e3510", particleStyle: "leaf", head: "glow-berries", motif: "leaf", shaftStyle: "mangrove", halo: "none", tip: "cluster", wings: "leafwing", finish: "vegetal", desc: "\u8328\u306E\u8513 \xB7 \u6E7F\u6C17\u306E\u68EE\u8DEF\u5730" },
  { id: "duality", name: "\u4E21", nameEn: "Duality", icon: "moon", gem: "#8b5cf6", gem2: "#f9a8d4", glow: "#c4b5fd", particle: "#f5d0fe", metal: "#a5b4fc", shaft: "#f8fafc", shaft2: "#312e81", particleStyle: "mixed", head: "moonlet", motif: "jewel-halo", shaftStyle: "twisted", halo: "eclipse", tip: "moon-circlet", wings: "bat", finish: "frosted", desc: "\u5149\u3068\u5F71 \xB7 \u9670\u967D\u306E\u547C\u5438" },
  { id: "pastoral", name: "\u6751", nameEn: "Pastoral", icon: "sun", gem: "#f5f0e6", gem2: "#e8dcc0", glow: "#fffde7", particle: "#fef3c7", metal: "#dca35d", shaft: "#dca35d", shaft2: "#8b5a2b", particleStyle: "plus", head: "beacon", motif: "rays", shaftStyle: "birch", halo: "ring", tip: "gem", wings: "seraph", finish: "matte", desc: "\u767D\u65E5\u306E\u6751\u8DEF \xB7 \u5B89\u3089\u3050\u7530\u5712" },
  { id: "none", name: "\u7121", nameEn: "Neutral", icon: "circle", gem: "#94a3b8", gem2: "#e2e8f0", glow: "#64748b", particle: "#cbd5e1", metal: "#c0c0c0", shaft: "#6b4226", shaft2: "#3d2413", particleStyle: "sparkle", head: "orb", motif: "none", shaftStyle: "straight", halo: "none", tip: "gem", wings: "none", finish: "matte", desc: "\u5C5E\u6027\u306A\u3057 \xB7 \u6C4E\u7528" }
];
var getElement = (id) => ELEMENTS.find((e) => e.id === id) || ELEMENTS[0];

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/catalog/itemTypes.ts
var ITEM_TYPES = [
  { id: "staff", name: "\u6756", nameEn: "Staff", icon: "staff", patch: { shaftLength: 0.88, shaftThickness: 0.062, shaftAngle: -48, headSize: 0.3, collarStyle: "filigree", pommelStyle: "gem", prongs: 3, shaftStyle: "royal", wrapStyle: "spiral", shaftCurve: 0.04, tipStyle: "gem-cluster", gemCut: "brilliant", gemMount: "claw", gemCount: 5, adornmentStyle: "filigree", adornmentDensity: 0.76 }, desc: "\u53E4\u5178\u7684\u306A\u9577\u6756 \xB7 \u82B1\u54B2\u304F\u5B9D\u77F3\u51A0\u3068\u5F6B\u91D1" },
  { id: "rod", name: "\u30ED\u30C3\u30C9", nameEn: "Rod", icon: "rod", patch: { shaftLength: 0.9, shaftThickness: 0.028, shaftAngle: -40, headSize: 0.14, collarStyle: "ring", pommelStyle: "cap", prongs: 0, shaftStyle: "straight", wrapStyle: "none", shaftCurve: 0, headShape: "orb", tipStyle: "floating-gem", gemCut: "emerald", gemMount: "floating", gemCount: 2, adornmentStyle: "star-map", adornmentDensity: 0.34 }, desc: "\u6975\u7D30\u306E\u9B54\u5C0E\u30ED\u30C3\u30C9 \xB7 \u6D6E\u904A\u3059\u308B\u6838\u3068\u661F\u56F3" },
  { id: "wand", name: "\u30EF\u30F3\u30C9", nameEn: "Wand", icon: "wand", patch: { shaftLength: 0.6, shaftThickness: 0.046, shaftAngle: -38, headSize: 0.24, collarStyle: "none", pommelStyle: "cap", prongs: 2, shaftStyle: "straight", wrapStyle: "none", shaftCurve: 0, tipStyle: "star", gemCut: "star-cut", gemMount: "claw", gemCount: 1, adornmentStyle: "rune-engraving", adornmentDensity: 0.52 }, desc: "\u77ED\u3044\u6307\u63EE\u68D2 \xB7 \u661F\u706F\u308A\u306E\u30EB\u30FC\u30F3\u5F6B\u523B" },
  { id: "scepter", name: "\u30BB\u30D7\u30BF\u30FC", nameEn: "Scepter", icon: "scepter", patch: { shaftLength: 0.58, shaftThickness: 0.072, shaftAngle: -34, headSize: 0.27, collarStyle: "crown", pommelStyle: "gem", prongs: 0, shaftStyle: "royal", wrapStyle: "spiral", shaftCurve: 0, tipStyle: "lotus-crown", gemCut: "emerald", gemMount: "bezel", gemCount: 7, adornmentStyle: "gold-pave", adornmentDensity: 0.82 }, desc: "\u738B\u5BB6\u306E\u7B0F \xB7 \u5B9D\u77F3\u3092\u62B1\u304F\u84EE\u83EF\u51A0" },
  { id: "cane", name: "\u30B9\u30C6\u30C3\u30AD", nameEn: "Cane", icon: "cane", patch: { shaftLength: 0.76, shaftThickness: 0.05, shaftAngle: -56, headSize: 0.17, collarStyle: "ring", pommelStyle: "cap", prongs: 0, shaftStyle: "leather", wrapStyle: "stitch", shaftCurve: 0.13, tipStyle: "none", gemCut: "cabochon", gemMount: "bezel", gemCount: 1, adornmentStyle: "chain-drape", adornmentDensity: 0.32 }, desc: "\u6E7E\u66F2\u3057\u305F\u67C4 \xB7 \u9769\u5DFB\u304D\u3068\u61D0\u4E2D\u6642\u8A08\u98A8\u306E\u91D1\u5177" },
  { id: "trident", name: "\u30C8\u30E9\u30A4\u30C7\u30F3\u30C8", nameEn: "Trident", icon: "trident", patch: { shaftLength: 0.88, shaftThickness: 0.055, shaftAngle: -58, headSize: 0.2, collarStyle: "guard", pommelStyle: "spike", prongs: 3, shaftStyle: "coral", wrapStyle: "scale", shaftCurve: 0, tipStyle: "triple-prong", gemCut: "marquise", gemMount: "cage", gemCount: 3, adornmentStyle: "geodesic", adornmentDensity: 0.62 }, desc: "\u4E09\u53C9\u306E\u6D77\u795E\u69CD \xB7 \u73CA\u745A\u3068\u771F\u73E0\u306E\u51A0" },
  { id: "scythe", name: "\u938C", nameEn: "Scythe", icon: "scythe", patch: { shaftLength: 0.94, shaftThickness: 0.042, shaftAngle: -62, headSize: 0.2, collarStyle: "skull-collar", pommelStyle: "anchor", prongs: 0, shaftStyle: "bone", wrapStyle: "thorn", shaftCurve: 0, tipStyle: "void-crown", gemCut: "rose-cut", gemMount: "halo", gemCount: 2, adornmentStyle: "thorn-vine", adornmentDensity: 0.68 }, desc: "\u5927\u938C \xB7 \u9ED2\u8594\u8587\u3068\u9AD1\u9ACF\u306E\u8B77\u74B0" },
  { id: "crosier", name: "\u53F8\u6559\u6756", nameEn: "Crosier", icon: "crosier", patch: { shaftLength: 0.84, shaftThickness: 0.055, shaftAngle: -50, headSize: 0.19, collarStyle: "wing-guard", pommelStyle: "gem", prongs: 0, shaftStyle: "ivory", wrapStyle: "rune-band", shaftCurve: -0.11, tipStyle: "moon-circlet", gemCut: "rose-cut", gemMount: "petal", gemCount: 5, adornmentStyle: "rune-engraving", adornmentDensity: 0.72 }, desc: "\u5DFB\u304D\u77E2\u3058\u308A \xB7 \u8056\u82B1\u3068\u7948\u7977\u30EB\u30FC\u30F3\u306E\u53F8\u6559\u6756" },
  { id: "grimoire", name: "\u9B54\u9053\u66F8", nameEn: "Grimoire", icon: "grimoire", patch: { shaftLength: 0.3, shaftThickness: 0.03, shaftAngle: -20, headSize: 0.42, collarStyle: "none", pommelStyle: "none", prongs: 0, shaftStyle: "leather", wrapStyle: "none", shaftCurve: 0, headShape: "tome", tipStyle: "none", dangleStyle: "ribbon", dangleCount: 2, gemCut: "opal", gemMount: "bezel", gemCount: 3, adornmentStyle: "rune-engraving", adornmentDensity: 0.62 }, desc: "\u643A\u3048\u308B\u66F8\u7269 \xB7 \u661F\u5EA7\u306E\u9280\u7B94\u3068\u5B9D\u77F3\u7559\u3081\u5177" },
  { id: "focus-orb", name: "\u9B54\u5C0E\u7403", nameEn: "Focus Orb", icon: "focus-orb", patch: { shaftLength: 0.22, shaftThickness: 0.026, shaftAngle: -30, headSize: 0.44, collarStyle: "orb-cage", pommelStyle: "none", prongs: 4, shaftStyle: "techno", wrapStyle: "none", shaftCurve: 0, headShape: "orb", tipStyle: "celestial-cage", orbiterStyle: "prism-ring", orbiterCount: 6, gemCut: "prism", gemMount: "cage", gemCount: 6, adornmentStyle: "geodesic", adornmentDensity: 0.9 }, desc: "\u9B54\u5C0E\u7126\u70B9\u7403 \xB7 \u516D\u91CD\u30B8\u30AA\u30C7\u30B7\u30C3\u30AF\u6ABB\u3068\u885B\u661F\u5B9D\u77F3" },
  { id: "censer", name: "\u9999\u7089", nameEn: "Censer", icon: "censer", patch: { shaftLength: 0.52, shaftThickness: 0.032, shaftAngle: -66, headSize: 0.3, collarStyle: "ring", pommelStyle: "ring", prongs: 0, shaftStyle: "chain-link", wrapStyle: "chain", shaftCurve: 0, headShape: "chalice", tipStyle: "none", dangleStyle: "chain-charm", dangleCount: 3, particleStyle: "ash", gemCut: "cabochon", gemMount: "cage", gemCount: 2, adornmentStyle: "chain-drape", adornmentDensity: 0.7 }, desc: "\u540A\u308B\u3059\u9999\u7089 \xB7 \u7D30\u9396\u3068\u71FB\u308B\u5B9D\u77F3" },
  { id: "bell", name: "\u9234\u6756", nameEn: "Bell Staff", icon: "bell", patch: { shaftLength: 0.8, shaftThickness: 0.05, shaftAngle: -52, headSize: 0.22, collarStyle: "ring", pommelStyle: "cap", prongs: 0, shaftStyle: "braided", wrapStyle: "ribbon", shaftCurve: 0.05, tipStyle: "bell", dangleStyle: "bell", dangleCount: 3, particleStyle: "musical", gemCut: "rose-cut", gemMount: "bezel", gemCount: 3, adornmentStyle: "filigree", adornmentDensity: 0.56 }, desc: "\u9234\u306E\u97F3\u8272 \xB7 \u87BA\u923F\u3068\u6D6E\u304B\u3076\u97F3\u7B26\u306E\u5DE1\u793C\u6756" },
  { id: "talisman", name: "\u8B77\u7B26", nameEn: "Talisman", icon: "talisman", patch: { shaftLength: 0.26, shaftThickness: 0.022, shaftAngle: -70, headSize: 0.36, collarStyle: "ring", pommelStyle: "none", prongs: 0, shaftStyle: "chain-link", wrapStyle: "none", shaftCurve: 0, headShape: "ankh", tipStyle: "none", dangleStyle: "beads", dangleCount: 2, gemCut: "opal", gemMount: "bezel", gemCount: 3, adornmentStyle: "star-map", adornmentDensity: 0.44 }, desc: "\u8B77\u7B26\u30DA\u30F3\u30C0\u30F3\u30C8 \xB7 \u4E03\u661F\u3068\u6570\u73E0\u306E\u5C01\u5370" },
  { id: "spear", name: "\u9B54\u69CD", nameEn: "Spear", icon: "spear", patch: { shaftLength: 0.96, shaftThickness: 0.038, shaftAngle: -60, headSize: 0.16, collarStyle: "guard", pommelStyle: "anchor", prongs: 0, shaftStyle: "straight", wrapStyle: "wire", shaftCurve: 0, tipStyle: "blade", gemCut: "marquise", gemMount: "claw", gemCount: 2, adornmentStyle: "gold-pave", adornmentDensity: 0.32 }, desc: "\u9577\u67C4\u306E\u7A42\u5148 \xB7 \u935B\u9020\u3055\u308C\u305F\u5203\u3068\u5B9D\u77F3\u92F2" },
  { id: "lantern-pole", name: "\u63D0\u706F\u6756", nameEn: "Lantern Pole", icon: "lantern-pole", patch: { shaftLength: 0.82, shaftThickness: 0.042, shaftAngle: -54, headSize: 0.2, collarStyle: "ring", pommelStyle: "cap", prongs: 0, shaftStyle: "bamboo", wrapStyle: "none", shaftCurve: 0.18, tipStyle: "lantern", dangleStyle: "ribbon", dangleCount: 2, gemGlow: 0.9, outerGlow: 0.75, adornmentStyle: "none" }, desc: "\u9759\u304B\u306B\u63FA\u308C\u308B\u706F\u7C60 \xB7 \u6696\u304B\u306A\u706F\u706B" },
  { id: "brush", name: "\u7B46", nameEn: "Calligraphy Brush", icon: "brush", patch: { shaftLength: 0.72, shaftThickness: 0.028, shaftAngle: -36, headSize: 0.13, collarStyle: "ring", pommelStyle: "cap", prongs: 0, shaftStyle: "porcelain", wrapStyle: "none", shaftCurve: 0, tipStyle: "prism-trio", outerGlow: 0.4, finish: "glossy", adornmentStyle: "none" }, desc: "\u9B54\u66F8\u3092\u523B\u3080\u7B46 \xB7 \u9ED2\u3044\u7B46\u5148\u3068\u767D\u78C1\u67C4" },
  { id: "mace", name: "\u9B54\u7403\u939A", nameEn: "Orb Mace", icon: "mace", patch: { shaftLength: 0.78, shaftThickness: 0.06, shaftAngle: -46, headSize: 0.27, collarStyle: "guard", pommelStyle: "anchor", prongs: 0, shaftStyle: "alloy", wrapStyle: "scale", shaftCurve: 0, tipStyle: "gem-cluster", prongColor: "#c8c8c8", outerGlow: 0.5, finish: "metallic", adornmentStyle: "gold-pave", adornmentDensity: 0.42 }, desc: "\u5927\u304D\u306A\u5B9D\u73E0\u306E\u939A\u982D \xB7 \u91CD\u539A\u306A\u6253\u6483\u5177" },
  { id: "chain-flail", name: "\u9396\u939A\u6756", nameEn: "Chain Flail Staff", icon: "chain-flail", patch: { shaftLength: 0.8, shaftThickness: 0.032, shaftAngle: -62, headSize: 0.18, collarStyle: "ring", pommelStyle: "anchor", prongs: 0, shaftStyle: "chain-link", wrapStyle: "wire", shaftCurve: 0, tipStyle: "snow-globe-tip", dangleStyle: "chain-charm", dangleCount: 3, outerGlow: 0.3, finish: "metallic", adornmentStyle: "chain-drape", adornmentDensity: 0.5 }, desc: "\u9396\u3068\u8FEB\u529B\u3042\u308B\u9244\u7403 \xB7 \u63FA\u308C\u308B\u904B\u52D5\u611F" },
  /* ── 型に囚われない: 柄のない浮遊遺物 ── */
  { id: "relic", name: "\u6D6E\u904A\u907A\u7269", nameEn: "Floating Relic", icon: "relic", patch: { shaftLength: 0, shaftThickness: 0.02, shaftAngle: -45, headSize: 0.34, collarStyle: "none", pommelStyle: "none", prongs: 0, wrapStyle: "none", shaftCurve: 0, tipStyle: "orbit-ring", orbiterStyle: "gem-set", orbiterCount: 4, halo: "triple", adornmentStyle: "star-map", adornmentDensity: 0.7, outerGlow: 0.8 }, desc: "\u67C4\u306A\u304D\u907A\u7269 \xB7 \u7A7A\u306B\u6D6E\u304B\u3076\u5B9D\u77F3\u3068\u661F\u56F3" },
  { id: "signet", name: "\u5370\u7AE0\u6307\u8F2A", nameEn: "Signet Ring", icon: "signet", patch: { shaftLength: 0, shaftThickness: 0.02, shaftAngle: -45, headSize: 0.26, collarStyle: "none", pommelStyle: "none", prongs: 0, wrapStyle: "none", shaftCurve: 0, tipStyle: "gem", gemMount: "bezel", gemCut: "cabochon", gemCount: 2, adornmentStyle: "filigree", adornmentDensity: 0.55, finish: "metallic" }, desc: "\u91D1\u306E\u8F2A\u306B\u636E\u3048\u305F\u5B9D\u77F3 \xB7 \u5C0F\u3055\u306A\u7D0B\u7AE0" },
  { id: "monolith", name: "\u7D50\u6676\u7891", nameEn: "Crystal Monolith", icon: "monolith", patch: { shaftLength: 0, shaftThickness: 0.02, shaftAngle: -90, headSize: 0.42, collarStyle: "none", pommelStyle: "none", prongs: 0, wrapStyle: "none", shaftCurve: 0, headShape: "cluster", tipStyle: "crystal-tip", adornmentStyle: "geodesic", adornmentDensity: 0.5, finish: "glossy" }, desc: "\u6797\u7ACB\u3059\u308B\u5DE8\u5927\u6676\u7C07 \xB7 \u67C4\u3092\u6301\u305F\u306A\u3044\u7891" },
  { id: "orb-solo", name: "\u5358\u72EC\u5B9D\u73E0", nameEn: "Lone Orb", icon: "orb-solo", patch: { shaftLength: 0, shaftThickness: 0.02, shaftAngle: -45, headSize: 0.4, collarStyle: "none", pommelStyle: "none", prongs: 0, wrapStyle: "none", shaftCurve: 0, headShape: "orb", tipStyle: "none", gemMount: "floating", innerStyle: "galaxy", orbiterStyle: "pearl", orbiterCount: 3, outerGlow: 0.85 }, desc: "\u305F\u3060\u4E00\u3064\u306E\u5B9D\u73E0 \xB7 \u5185\u306A\u308B\u9280\u6CB3" },
  { id: "pennant", name: "\u5FA1\u65D7", nameEn: "Pennant", icon: "pennant", patch: { shaftLength: 0, shaftThickness: 0.02, shaftAngle: -45, headSize: 0.38, collarStyle: "none", pommelStyle: "none", prongs: 0, wrapStyle: "none", shaftCurve: 0, headShape: "banner", tipStyle: "none", dangleStyle: "ribbon", dangleCount: 3, finish: "matte" }, desc: "\u7FFB\u308B\u5E03\u306E\u65D7 \xB7 \u7D0B\u7AE0\u3068\u623F\u98FE\u308A" },
  { id: "idol", name: "\u5C0F\u5076\u50CF", nameEn: "Idol", icon: "idol", patch: { shaftLength: 0, shaftThickness: 0.02, shaftAngle: -45, headSize: 0.36, collarStyle: "none", pommelStyle: "none", prongs: 0, wrapStyle: "none", shaftCurve: 0, headShape: "totem", tipStyle: "none", adornmentStyle: "gold-pave", adornmentDensity: 0.6, finish: "lacquered" }, desc: "\u4E0D\u6B7B\u306E\u30C8\u30FC\u30C6\u30E0 \xB7 \u91D1\u7DD1\u306E\u5076\u50CF" },
  { id: "chime", name: "\u98A8\u9234", nameEn: "Wind Chime", icon: "chime", patch: { shaftLength: 0, shaftThickness: 0.02, shaftAngle: -45, headSize: 0.3, collarStyle: "bell-dome", pommelStyle: "none", prongs: 0, wrapStyle: "none", shaftCurve: 0, headShape: "brazier", tipStyle: "none", dangleStyle: "bell", dangleCount: 4, particleStyle: "musical", motif: "notes", motifIntensity: 0.7 }, desc: "\u9234\u3068\u77ED\u518A\u304C\u63FA\u308C\u308B\u98A8\u9234" }
];
var getItemType = (id) => ITEM_TYPES.find((t) => t.id === id) || ITEM_TYPES[0];

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/catalog/presets.ts
var ANIMATIONS = [
  { id: "none", name: "\u9759\u6B62", en: "Static", desc: "\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3\u306A\u3057\u30FB\u5358\u4E00\u30D5\u30EC\u30FC\u30E0\u3002", frames: 1, fps: 20, needs: {} },
  { id: "enchant-glint", name: "\u30A8\u30F3\u30C1\u30E3\u30F3\u30C8", en: "Enchant Glint", desc: "\u30D0\u30CB\u30E9\u306E\u30A8\u30F3\u30C1\u30E3\u30F3\u30C8\u98A8\u306E\u7D2B\u306E\u30B0\u30EA\u30F3\u30C8\u304C\u659C\u3081\u306B\u6D41\u308C\u308B\u3002", frames: 16, fps: 20, needs: { finish: "glossy" } },
  { id: "pulse-glow", name: "\u8108\u52D5\u30AA\u30FC\u30E9", en: "Pulsing Aura", desc: "\u5916\u5074\u306E\u5149\u304C\u9F13\u52D5\u306E\u3088\u3046\u306B\u660E\u6EC5\u3002", frames: 12, fps: 20, needs: {} },
  { id: "orbit", name: "\u6D6E\u904A\u7269\u516C\u8EE2", en: "Orbiters", desc: "\u5468\u56F2\u306E\u6D6E\u904A\u7269\u304C\u982D\u90E8\u3092\u516C\u8EE2\u3059\u308B\u3002", frames: 20, fps: 20, needs: { orbiterCount: 4 } },
  { id: "float", name: "\u6D6E\u904A\u63FA\u308C", en: "Bob & Sway", desc: "\u6756\u5168\u4F53\u304C\u3086\u3063\u304F\u308A\u4E0A\u4E0B\u3057\u3001\u5FAE\u5C11\u56DE\u8EE2\u3059\u308B\u3002", frames: 24, fps: 20, needs: {} },
  { id: "flame-flicker", name: "\u708E\u3086\u3089\u304E", en: "Flame Flicker", desc: "\u708E\u306E\u8F1D\u304D\u30FB\u706B\u306E\u7C89\u304C\u3086\u3089\u3081\u304D\u7ACB\u3061\u4E0A\u304C\u308B\u3002", frames: 14, fps: 20, needs: { element: "fire" } },
  { id: "lightning-arc", name: "\u96F7\u5149", en: "Lightning Arc", desc: "\u7A32\u59BB\u306E\u30A2\u30FC\u30AF\u304C\u4E0D\u898F\u5247\u306B\u30D5\u30E9\u30C3\u30B7\u30E5\u3002", frames: 10, fps: 30, needs: { element: "lightning", motif: "bolt", motifIntensity: 1 } },
  { id: "frost-shimmer", name: "\u971C\u306E\u714C\u3081\u304D", en: "Frost Shimmer", desc: "\u971C\u306E\u7C92\u5B50\u304C\u660E\u6EC5\u3057\u3001\u8868\u9762\u306E\u30AD\u30E9\u30AD\u30E9\u304C\u79FB\u52D5\u3002", frames: 16, fps: 20, needs: { element: "ice" } },
  { id: "spin-gem", name: "\u5B9D\u73E0\u56DE\u8EE2", en: "Gem Spin", desc: "\u5B9D\u73E0\u306E\u5185\u90E8\u306E\u6E26\u304C\u56DE\u8EE2\u3057\u3001\u30AD\u30E9\u30C3\u3068\u53CD\u5C04\u3002", frames: 18, fps: 24, needs: { innerStyle: "swirl" } },
  { id: "rainbow-core", name: "\u8679\u8272\u30B3\u30A2", en: "Rainbow Core", desc: "\u5B9D\u77F3\u306E\u5185\u5074\u304C\u8272\u76F8\u74B0\u3092\u4E00\u5468\u3002", frames: 24, fps: 18, needs: { innerStyle: "core" } },
  { id: "holy-rays", name: "\u8056\u5149\u56DE\u8EE2", en: "Rotating Rays", desc: "\u30B5\u30F3\u30D0\u30FC\u30B9\u30C8\u306E\u5149\u7DDA\u304C\u3086\u3063\u304F\u308A\u56DE\u308B\u3002", frames: 20, fps: 20, needs: { halo: "sunburst" } },
  { id: "bubbles-rise", name: "\u6C17\u6CE1\u4E0A\u6607", en: "Rising Bubbles", desc: "\u6C17\u6CE1\u306E\u30D1\u30FC\u30C6\u30A3\u30AF\u30EB\u304C\u3086\u3063\u304F\u308A\u4E0A\u306B\u6D41\u308C\u308B\u3002", frames: 18, fps: 20, needs: { element: "water", particleStyle: "bubbles" } },
  { id: "petal-drift", name: "\u82B1\u3073\u3089\u821E\u3044", en: "Petal Drift", desc: "\u82B1\u3073\u3089/\u8449\u304C\u98A8\u3067\u821E\u3044\u843D\u3061\u308B\u3002", frames: 22, fps: 20, needs: { particleStyle: "leaf", particles: 12 } },
  { id: "void-breath", name: "\u95C7\u306E\u547C\u5438", en: "Void Breath", desc: "\u865A\u7121\u306E\u9744\u304C\u3086\u3063\u304F\u308A\u5438\u6C17/\u547C\u6C17\u3002", frames: 24, fps: 15, needs: { element: "void", motif: "wisp" } },
  { id: "ember-swirl", name: "\u706B\u306E\u7C89\u87BA\u65CB", en: "Ember Swirl", desc: "\u706B\u306E\u7C89\u304C\u87BA\u65CB\u3092\u63CF\u3044\u3066\u4E0A\u6607\u3002", frames: 16, fps: 24, needs: { element: "fire", particleStyle: "embers" } },
  { id: "rune-pulse", name: "\u30EB\u30FC\u30F3\u9F13\u52D5", en: "Runic Pulse", desc: "\u30EB\u30FC\u30F3\u30FB\u30D0\u30F3\u30C9\u306E\u30EB\u30FC\u30F3\u304C\u9806\u306B\u8108\u6253\u3064\u3002", frames: 14, fps: 20, needs: { wrapStyle: "rune-band" } },
  { id: "wings-flap", name: "\u7FBD\u3070\u305F\u304D", en: "Wing Flap", desc: "\u7FFC\u304C\u3086\u3063\u304F\u308A\u7FBD\u3070\u305F\u304F\u3002", frames: 16, fps: 18, needs: { wings: "angel" } },
  { id: "heartbeat", name: "\u9F13\u52D5", en: "Heartbeat", desc: "\u5149\u304C\u4E8C\u5EA6\u6253\u3064\u3088\u3046\u306B\u8108\u52D5\u3059\u308B\u3002", frames: 16, fps: 16, needs: { outerGlow: 0.8 } },
  { id: "shimmer-wave", name: "\u63FA\u5149", en: "Shimmer Wave", desc: "\u5B9D\u77F3\u306E\u8272\u304C\u3086\u3063\u305F\u308A\u8679\u3078\u3086\u308C\u308B\u3002", frames: 20, fps: 18, needs: { innerStyle: "galaxy" } },
  { id: "chromatic-drift", name: "\u5F69\u6D41", en: "Chromatic Drift", desc: "\u8272\u76F8\u304C\u9759\u304B\u306B\u4E00\u5468\u3092\u5DE1\u308B\u3002", frames: 24, fps: 16, needs: {} },
  { id: "clock-tick", name: "\u6642\u8A08", en: "Clockwork", desc: "\u523B\u307F\u306A\u304C\u3089\u7259\u8ECA\u3084\u5B9D\u73E0\u304C\u56DE\u308B\u3002", frames: 12, fps: 10, needs: { orbiterStyle: "gear" } },
  { id: "sparkle-cascade", name: "\u661F\u7011", en: "Sparkle Cascade", desc: "\u661F\u5C51\u304C\u5C3E\u3092\u5F15\u3044\u3066\u6D41\u308C\u843D\u3061\u308B\u3002", frames: 16, fps: 18, needs: { particleStyle: "mixed" } },
  { id: "sakura-fall", name: "\u82B1\u5439\u96EA", en: "Sakura Fall", desc: "\u82B1\u3073\u3089\u304C\u9759\u304B\u306B\u821E\u3044\u964D\u308A\u308B\u3002", frames: 22, fps: 14, needs: { particleStyle: "leaf", particles: 14 } }
];
var LIFE_AUTHENTIC = {
  resolution: 32,
  refined: true,
  softEdge: false,
  paletteSize: 0,
  shaftLength: 0.92,
  shaftThickness: 0.03,
  shaftAngle: -44,
  shaftCurve: 0.03,
  shaftStyle: "straight",
  shaftDetail: 0.5,
  grain: 0.18,
  headSize: 0.17,
  prongs: 0,
  particles: 3,
  particleStyle: "dots",
  outerGlow: 0.18,
  gemGlow: 0.45,
  dither: false,
  shading: 0.85,
  contrast: 1.18,
  outline: "dark",
  finish: "glossy",
  motif: "none",
  motifIntensity: 0,
  motif2: "none",
  wings: "none",
  halo: "none",
  orbiterStyle: "none",
  dangleStyle: "none",
  adornmentStyle: "none",
  wearStyle: "none"
};
var EFFECT_PRESETS = [
  { name: "\u9759\u7A4F\u306A\u5B9D\u77F3\u5149", nameEn: "Restrained Jewel Light", icon: "gem", patch: { outerGlow: 0.16, gemGlow: 0.55, particles: 4, halo: "none", dropShadow: false, motifIntensity: 0.2, motif2: "none", contrast: 1.08, finish: "glossy" } },
  {
    name: "Life\u9BD6\u30AA\u30FC\u30BB\u30F3\u30C6\u30A3\u30C3\u30AF",
    nameEn: "Azisaba Life Authentic",
    icon: "square",
    patch: {
      ...LIFE_AUTHENTIC,
      harmony: "monochrome",
      paletteSize: 48,
      wrapStyle: "rings",
      wrapDensity: 9,
      collarStyle: "ring",
      pommelStyle: "cap",
      tipStyle: "gem",
      motif: "none",
      motifIntensity: 0
    }
  },
  { name: "\u30A8\u30F3\u30C1\u30E3\u30F3\u30C8\u8F1D\u304D", nameEn: "Enchanted Glint", icon: "sparkles", patch: { finish: "enchanted", outerGlow: 0.6, dither: true, particleStyle: "sparkle", particles: 10, outline: "selout", shading: 0.8, contrast: 1.12, grain: 0.2, motif: "rune", motifIntensity: 0.55 } },
  { name: "\u696D\u706B\u306E\u8ECC\u8DE1", nameEn: "Ember Trail", icon: "flame", patch: { element: "fire", particleStyle: "embers", particles: 16, outerGlow: 0.88, finish: "glossy", motif: "flame", motifIntensity: 0.95, outline: "colored", shading: 0.7 } },
  { name: "\u6C37\u7D50\u306E\u30AA\u30FC\u30E9", nameEn: "Frost Aura", icon: "snowflake", patch: { element: "ice", particleStyle: "diamonds", particles: 12, outerGlow: 0.5, finish: "glossy", motif: "frost", motifIntensity: 0.8, halo: "ring", outline: "light", shading: 0.85 } },
  { name: "\u96F7\u6483\u306E\u8108\u52D5", nameEn: "Arc Pulse", icon: "zap", patch: { element: "lightning", particleStyle: "mixed", particles: 14, outerGlow: 0.72, finish: "metallic", motif: "bolt", motifIntensity: 0.9, halo: "double", outline: "dark", shading: 0.9 } },
  { name: "\u8056\u306A\u308B\u5149", nameEn: "Divine Rays", icon: "sun", patch: { element: "light", particleStyle: "plus", particles: 12, outerGlow: 0.85, finish: "metallic", motif: "rays", motifIntensity: 1, halo: "sunburst", outline: "gold", shading: 0.8 } },
  { name: "\u865A\u7121\u306E\u9727", nameEn: "Void Mist", icon: "orbit", patch: { element: "void", particleStyle: "dots", particles: 14, outerGlow: 0.78, finish: "matte", motif: "void", motifIntensity: 0.85, halo: "eclipse", outline: "colored", shading: 0.6, contrast: 1.05 } },
  { name: "\u795E\u79D8\u306E\u30EB\u30FC\u30F3", nameEn: "Arcane Runes", icon: "rune", patch: { motif: "rune", motifIntensity: 1, particleStyle: "sparkle", particles: 12, outerGlow: 0.6, halo: "rune-ring", finish: "enchanted", outline: "selout", shading: 0.75 } },
  { name: "\u8840\u306E\u5100\u5F0F", nameEn: "Blood Ritual", icon: "droplet", patch: { element: "blood", particleStyle: "embers", particles: 11, outerGlow: 0.65, finish: "weathered", motif: "drip", motifIntensity: 0.8, outline: "dark", shading: 0.7, contrast: 1.15 } },
  { name: "\u8077\u4EBA\u306E\u8CEA\u7D20\u4ED5\u4E0A\u3052", nameEn: "Humble Artisan", icon: "hammer", patch: { finish: "matte", outerGlow: 0.1, particles: 3, dither: false, shading: 0.5, contrast: 0.95, grain: 0.55, outline: "dark", motif: "none", motifIntensity: 0 } },
  { name: "\u9AD8\u7D1A\u88C5\u98FE", nameEn: "Opulent Regalia", icon: "crown", patch: { finish: "metallic", outerGlow: 0.55, halo: "double", particles: 10, particleStyle: "diamonds", collarStyle: "filigree", pommelStyle: "gem", contrast: 1.16, outline: "gold", shading: 0.85, motif: "rune", motifIntensity: 0.4 } },
  { name: "\u30DF\u30CB\u30DE\u30EB\u30FB\u30AF\u30E9\u30B7\u30C3\u30AF", nameEn: "Minimal Classic", icon: "square", patch: { resolution: 16, refined: false, outerGlow: 0.2, particles: 4, particleStyle: "dots", dither: false, outline: "dark", finish: "matte", shading: 0.6, contrast: 1, motif: "none", motifIntensity: 0, shaftDetail: 0.2 } },
  { name: "\u6708\u5149\u306E\u304D\u3089\u3081\u304D", nameEn: "Moonlight Sheen", icon: "moon", patch: { element: "dark", particleStyle: "sparkle", particles: 9, outerGlow: 0.6, finish: "glossy", motif: "wisp", motifIntensity: 0.7, halo: "eclipse", outline: "light", shading: 0.8, contrast: 1.08 } }
];

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/catalog/palettes.ts
var GEM_PALETTES = [
  ["#7c3aed", "#22d3ee", "#a78bfa"],
  ["#ef4444", "#f59e0b", "#fca5a5"],
  ["#0ea5e9", "#e0f2fe", "#7dd3fc"],
  ["#22c55e", "#a3e635", "#86efac"],
  ["#a855f7", "#ec4899", "#f0abfc"],
  ["#eab308", "#fef08a", "#fde047"],
  ["#06b6d4", "#34d399", "#99f6e4"],
  ["#f43f5e", "#7c2d12", "#fda4af"],
  ["#6366f1", "#c4b5fd", "#a5b4fc"],
  ["#14b8a6", "#f59e0b", "#5eead4"],
  ["#8b5cf6", "#f472b6", "#ddd6fe"],
  ["#0f766e", "#84cc16", "#6ee7b7"],
  ["#ff6d00", "#ffd54f", "#ffcc80"],
  ["#0288d1", "#b3e5fc", "#81d4fa"],
  ["#5e35b1", "#b39ddb", "#d1c4e9"],
  ["#c62828", "#ef9a9a", "#ffcdd2"]
];
var WOOD_PALETTES = [
  ["#6b4226", "#3d2413"],
  ["#8b5a2b", "#4a2f16"],
  ["#4a3728", "#241a12"],
  ["#7a6a5a", "#3f362e"],
  ["#5b3a8c", "#2e1d4a"],
  ["#1f2937", "#0b1220"],
  ["#92400e", "#451a03"],
  ["#b08968", "#6b4f2e"],
  ["#5d4037", "#3e2723"],
  ["#cfd8dc", "#78909c"],
  ["#311b92", "#1a0f4d"],
  ["#37474f", "#102027"]
];
var METAL_COLORS = ["#d4af37", "#e8c874", "#c0c0c0", "#b87333", "#8b9bb4", "#f5f0e6", "#7d7461", "#ef9f2e", "#ffd700", "#b0bec5"];

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/locks.ts
var LOCK_GROUPS = [
  { id: "identity", label: "\u5C5E\u6027\u30FB\u578B\u30FBMod", keys: ["element", "itemType", "modEssence"] },
  { id: "rarity", label: "\u30EC\u30A2\u30EA\u30C6\u30A3", keys: ["rarity"] },
  { id: "shaft", label: "\u67C4\u306E\u5F62", keys: ["shaftStyle", "shaftLength", "shaftThickness", "shaftAngle", "shaftCurve", "shaftDetail", "grain"] },
  { id: "shaftColor", label: "\u67C4\u306E\u8272", keys: ["shaftColor", "shaftColor2"] },
  { id: "wrap", label: "\u5DFB\u304D", keys: ["wrapStyle", "wrapColor", "wrapDensity"] },
  { id: "collar", label: "\u53E3\u91D1\u30FB\u722A", keys: ["collarStyle", "collarColor", "prongs", "prongColor"] },
  { id: "pommel", label: "\u67C4\u982D", keys: ["pommelStyle", "pommelColor"] },
  { id: "head", label: "\u982D\u90E8\u5F62\u72B6", keys: ["headShape", "headSize", "innerStyle", "gemGlow", "gemCut", "gemMount", "gemCount", "gemScale"] },
  { id: "adornment", label: "\u88C5\u98FE\u69D8\u5F0F", keys: ["adornmentStyle", "adornmentDensity"] },
  { id: "gem", label: "\u5B9D\u77F3\u8272", keys: ["gemColor", "gemColor2", "glowColor", "particleColor"] },
  { id: "tip", label: "\u5148\u7AEF", keys: ["tipStyle", "tipScale"] },
  { id: "orbiters", label: "\u6D6E\u904A\u7269", keys: ["orbiterStyle", "orbiterCount", "orbiterRadius", "orbiterSize"] },
  { id: "motif", label: "\u30E2\u30C1\u30FC\u30D5", keys: ["motif", "motifIntensity", "motif2", "motif2Intensity"] },
  { id: "dangle", label: "\u540A\u308A\u98FE\u308A", keys: ["dangleStyle", "dangleCount"] },
  { id: "wear", label: "\u6469\u8017", keys: ["wearStyle", "wearAmount"] },
  { id: "decor", label: "\u7FFC\u30FB\u5149\u8F2A\u30FB\u89D2", keys: ["wings", "wingColor", "halo", "haloColor", "horns", "hornColor"] },
  { id: "particles", label: "\u7C92\u5B50", keys: ["particles", "particleStyle"] },
  { id: "finish", label: "\u4ED5\u4E0A\u3052", keys: ["outline", "shading", "dither", "outerGlow", "finish", "contrast", "dropShadow"] },
  { id: "animation", label: "\u30A2\u30CB\u30E1", keys: ["animation"] }
];
var RANDOMIZABLE_KEYS = LOCK_GROUPS.flatMap((g) => g.keys);
var DEFAULT_RULES = {
  elements: [],
  itemTypes: [],
  modEssences: [],
  headShapes: [],
  finishes: [],
  rarities: [],
  tipStyles: [],
  orbiterStyles: [],
  gemCuts: [],
  adornments: [],
  colorsFollowElement: true,
  keepTypeGeometry: true,
  randomizeAnimation: false,
  useHarmony: false,
  rarityDrivesOrnate: true,
  jitter: 0.5
};

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/random.ts
var clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function randomConfig(prev, opts = {}) {
  const locks = opts.locks ?? {};
  const rules = { ...DEFAULT_RULES, ...opts.rules ?? {} };
  const rand = mulberry32(opts.seed ?? Math.floor(Math.random() * 1e9));
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const range = (a, b) => a + rand() * (b - a);
  const jit = (v, amt) => v * (1 + (rand() - 0.5) * 2 * amt);
  const chance = (p2) => rand() < p2;
  const elPool = rules.elements.length ? rules.elements : ELEMENTS.map((e) => e.id).filter((id) => id !== "none");
  const element = locks.element ? prev.element : pick(elPool);
  const el = getElement(element);
  const typePool = rules.itemTypes.length ? rules.itemTypes : ITEM_TYPES.map((t) => t.id);
  const itemType = locks.itemType ? prev.itemType : pick(typePool);
  const type = getItemType(itemType);
  const headPool = rules.headShapes.length ? rules.headShapes : ALL_HEADS;
  const finishPool = rules.finishes.length ? rules.finishes : ALL_FINISHES;
  const tipPool = rules.tipStyles.length ? rules.tipStyles : ALL_TIPS;
  const orbiterPool = rules.orbiterStyles.length ? rules.orbiterStyles : ALL_ORBITERS;
  const cutPool = rules.gemCuts.length ? rules.gemCuts : ALL_GEM_CUTS;
  const adornmentPool = rules.adornments.length ? rules.adornments : ALL_ADORNMENTS;
  const essencePool = rules.modEssences.length ? rules.modEssences : ALL_MOD_ESSENCES;
  const modEssence = locks.modEssence ? prev.modEssence : pick(essencePool);
  const rarityPool = rules.rarities.length ? rules.rarities : ALL_RARITIES;
  const rarity = locks.rarity ? prev.rarity ?? "common" : pick(rarityPool);
  const rd = getRarity(rarity);
  const follow = rules.colorsFollowElement;
  const tint = (hex) => shade(hex, (rand() - 0.5) * 0.16 * rules.jitter);
  const gem = pick(GEM_PALETTES), wood = pick(WOOD_PALETTES), metal = pick(METAL_COLORS);
  const colors = follow ? {
    gemColor: tint(el.gem),
    gemColor2: tint(el.gem2),
    glowColor: el.glow,
    particleColor: el.particle,
    shaftColor: tint(el.shaft),
    shaftColor2: tint(el.shaft2),
    collarColor: el.metal,
    prongColor: el.metal,
    pommelColor: el.metal,
    wrapColor: chance(0.5) ? el.metal : el.gem,
    haloColor: element === "light" || element === "arcane" ? "#ffd700" : el.glow,
    wingColor: chance(0.5) ? "#f5f0e6" : shade(el.gem2, 0.3),
    hornColor: "#e8dcc0"
  } : {
    gemColor: gem[0],
    gemColor2: gem[1],
    glowColor: gem[0],
    particleColor: gem[2],
    shaftColor: wood[0],
    shaftColor2: wood[1],
    collarColor: metal,
    prongColor: metal,
    pommelColor: metal,
    wrapColor: chance(0.5) ? metal : gem[0],
    haloColor: chance(0.5) ? "#ffd700" : gem[1],
    wingColor: chance(0.6) ? "#f5f0e6" : gem[2],
    hornColor: "#e8dcc0"
  };
  const p = type.patch;
  const J = rules.jitter;
  const geo = rules.keepTypeGeometry ? {
    shaftLength: clamp(jit(p.shaftLength ?? 0.86, 0.12 * J), 0.55, 1),
    shaftThickness: clamp(jit(p.shaftThickness ?? 0.06, 0.28 * J), 0.016, 0.13),
    shaftAngle: clamp((p.shaftAngle ?? -48) + (rand() - 0.5) * 22 * J, -70, -15),
    shaftCurve: clamp((p.shaftCurve ?? 0) + (rand() - 0.5) * 0.12 * J, -0.18, 0.18),
    headSize: clamp(jit(p.headSize ?? 0.3, 0.22 * J), 0.14, 0.44),
    collarStyle: chance(0.75) ? p.collarStyle ?? pick(ALL_COLLARS) : pick(ALL_COLLARS),
    pommelStyle: chance(0.7) ? p.pommelStyle ?? pick(ALL_POMMELS) : pick(ALL_POMMELS),
    prongs: chance(0.5) ? p.prongs ?? 0 : Math.floor(rand() * 5)
  } : {
    shaftLength: range(0.7, 0.96),
    shaftThickness: range(0.024, 0.074),
    shaftAngle: range(-58, -32),
    shaftCurve: (rand() - 0.5) * 0.24,
    headSize: range(0.2, 0.38),
    collarStyle: pick(ALL_COLLARS),
    pommelStyle: pick(ALL_POMMELS),
    prongs: Math.floor(rand() * 5)
  };
  const out = {
    ...prev,
    ...p,
    modEssence,
    rarity,
    element,
    itemType,
    seed: Math.floor(rand() * 999999),
    ...geo,
    shaftStyle: rules.keepTypeGeometry && p.shaftStyle && chance(0.72) ? p.shaftStyle : follow && chance(0.5) ? el.shaftStyle : pick(ALL_SHAFTS),
    shaftDetail: rand(),
    grain: rand() * 0.6,
    wrapStyle: rules.keepTypeGeometry && p.wrapStyle && chance(0.72) ? p.wrapStyle : pick(ALL_WRAPS),
    wrapDensity: 3 + Math.floor(rand() * 7),
    headShape: rules.keepTypeGeometry && p.headShape && chance(0.82) && headPool.includes(p.headShape) ? p.headShape : follow && chance(0.4) && headPool.includes(el.head) ? el.head : pick(headPool),
    gemGlow: 0.4 + rand() * 0.6,
    gemCut: p.gemCut ?? pick(cutPool),
    gemMount: p.gemMount ?? pick(ALL_GEM_MOUNTS),
    gemCount: p.gemCount ?? 1 + Math.floor(rand() * 7),
    gemScale: p.gemScale ?? 0.1 + rand() * 0.25,
    adornmentStyle: p.adornmentStyle ?? pick(adornmentPool),
    adornmentDensity: p.adornmentDensity ?? 0.22 + rand() * 0.74,
    innerStyle: pick(ALL_INNERS),
    tipStyle: rules.keepTypeGeometry && p.tipStyle && chance(0.76) && tipPool.includes(p.tipStyle) ? p.tipStyle : follow && chance(0.45) && tipPool.includes(el.tip) ? el.tip : pick(tipPool),
    tipScale: 0.3 + rand() * 0.7,
    orbiterStyle: chance(0.24) && orbiterPool.includes("none") ? "none" : pick(orbiterPool),
    orbiterCount: 1 + Math.floor(rand() * 5),
    orbiterRadius: 1.25 + rand() * 1.1,
    orbiterSize: 0.08 + rand() * 0.14,
    wings: follow && chance(0.5) ? el.wings : pick(["none", "none", ...ALL_WINGS]),
    halo: follow && chance(0.5) ? el.halo : pick(["none", "none", ...ALL_HALOS]),
    horns: chance(0.14),
    particles: 5 + Math.floor(rand() * 14),
    particleStyle: follow ? el.particleStyle : pick(ALL_PARTICLES),
    ...colors,
    shading: 0.55 + rand() * 0.4,
    dither: chance(0.7),
    outerGlow: 0.06 + rand() * 0.42,
    finish: follow && chance(0.4) && finishPool.includes(el.finish) ? el.finish : pick(finishPool),
    contrast: 0.95 + rand() * 0.3,
    outline: pick(["selout", "selout", "dark", "dark", "colored", "gold", "light"]),
    motif: follow ? el.motif : pick(ALL_MOTIFS),
    motifIntensity: rand() * 0.9,
    motif2: chance(0.25) ? pick(ALL_MOTIFS) : "none",
    motif2Intensity: 0.2 + rand() * 0.5,
    dangleStyle: p.dangleStyle ?? (chance(0.45) ? pick(ALL_DANGLES) : "none"),
    dangleCount: 1 + Math.floor(rand() * 3),
    wearStyle: chance(0.35) ? pick(ALL_WEARS) : "none",
    wearAmount: 0.15 + rand() * 0.5
  };
  if (rules.rarityDrivesOrnate) {
    Object.assign(out, rd.patch);
    out.rarity = rarity;
    if (p.headShape) out.headShape = p.headShape;
    if (p.tipStyle) out.tipStyle = p.tipStyle;
    if (p.collarStyle) out.collarStyle = p.collarStyle;
    out.outerGlow = clamp((rd.patch.outerGlow ?? out.outerGlow) * (0.85 + rand() * 0.3), 0, 1);
    out.particles = Math.max(0, Math.round((rd.patch.particles ?? out.particles) * (0.8 + rand() * 0.4)));
    if (rd.ornateLevel < 2) {
      out.motif2 = "none";
      out.dangleStyle = "none";
    }
  }
  if (rules.useHarmony) {
    const scheme = pick(ALL_HARMONIES.filter((h) => h !== "custom"));
    Object.assign(out, applyHarmony(out, scheme));
  }
  if (rules.randomizeAnimation) {
    const a = pick(ANIMATIONS.filter((x) => x.id !== "none"));
    Object.assign(out, a.needs);
    out.animation = { ...prev.animation ?? DEFAULT_ANIMATION, type: a.id, frames: a.frames, fps: a.fps, intensity: 0.5 + rand() * 0.5 };
  }
  const bag = out;
  for (const k of Object.keys(locks)) {
    if (locks[k]) bag[k] = prev[k];
  }
  return out;
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/render/pix.ts
var Pix = class {
  w;
  h;
  d;
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Uint8ClampedArray(w * h * 4);
  }
  idx(x, y) {
    return (y * this.w + x) * 4;
  }
  in(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
  alpha(x, y) {
    if (!this.in(x, y)) return 0;
    return this.d[this.idx(x, y) + 3];
  }
  set(x, y, c, a = 255) {
    x = Math.round(x);
    y = Math.round(y);
    if (!this.in(x, y)) return;
    const i = this.idx(x, y);
    this.d[i] = clamp255(c[0]);
    this.d[i + 1] = clamp255(c[1]);
    this.d[i + 2] = clamp255(c[2]);
    this.d[i + 3] = clamp255(a);
  }
  blend(x, y, c, a) {
    x = Math.round(x);
    y = Math.round(y);
    if (!this.in(x, y) || a <= 0) return;
    const i = this.idx(x, y);
    const da = this.d[i + 3] / 255;
    const sa = clamp01(a / 255);
    const out = sa + da * (1 - sa);
    if (out <= 1e-3) return;
    this.d[i] = clamp255((c[0] * sa + this.d[i] * da * (1 - sa)) / out);
    this.d[i + 1] = clamp255((c[1] * sa + this.d[i + 1] * da * (1 - sa)) / out);
    this.d[i + 2] = clamp255((c[2] * sa + this.d[i + 2] * da * (1 - sa)) / out);
    this.d[i + 3] = clamp255(out * 255);
  }
  disc(cx, cy, r, c, a = 255) {
    if (r <= 0) {
      this.blend(cx, cy, c, a);
      return;
    }
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if (Math.hypot(x - cx, y - cy) <= r + 0.2) this.blend(x, y, c, a);
      }
    }
  }
  ring(cx, cy, r, th, c, a) {
    for (let y = Math.floor(cy - r - th); y <= cy + r + th; y++) {
      for (let x = Math.floor(cx - r - th); x <= cx + r + th; x++) {
        const d = Math.abs(Math.hypot(x - cx, y - cy) - r);
        if (d <= th) this.blend(x, y, c, a * (1 - d / (th + 1e-3) * 0.55));
      }
    }
  }
};

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/render/context.ts
function createContext(cfg, animState) {
  const N = cfg.resolution;
  const S = cfg.refined ? N >= 128 ? 2 : 3 : 1;
  const W = N * S;
  const buf = new Pix(W, W);
  const small = N <= 16;
  const animCfg = cfg.animation;
  const on = !!(animCfg && animCfg.type !== "none");
  const frame = animState?.frame ?? 0;
  const seed = cfg.seed + (on ? Math.floor(frame * 13.37) : 0);
  const rng = mulberry32(seed || 1);
  const tRaw = animState?.t ?? 0;
  const ping = animState?.pingPong ? tRaw < 0.5 ? tRaw * 2 : (1 - tRaw) * 2 : tRaw;
  const TAU = Math.PI * 2;
  const t = on ? ping : 0;
  const type = animCfg?.type ?? "none";
  const intensity = animCfg?.intensity ?? 0;
  const is = (k) => on && type === k;
  const bobX = is("float") ? Math.sin(t * TAU * 2) * W * 0.012 : 0;
  const bobY = is("float") ? Math.sin(t * TAU) * W * 0.022 : 0;
  const rotA = is("float") ? Math.sin(t * TAU) * 0.025 : 0;
  let glowMul = 1;
  if (is("pulse-glow")) glowMul = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * TAU)) * intensity;
  if (is("heartbeat")) glowMul = 0.62 + 0.38 * Math.pow(Math.sin(Math.PI * (t * 2 % 1)), 2.2) * intensity;
  if (is("void-breath")) glowMul = 0.6 + 0.4 * Math.pow(0.5 + 0.5 * Math.sin(t * TAU + Math.PI), 2);
  const orbPhase = is("orbit") ? t * TAU * intensity : 0;
  const flicker = is("flame-flicker") || is("ember-swirl") ? 0.72 + 0.28 * Math.sin(t * TAU * 4.3) + 0.18 * rng() : 1;
  const lightningOn = is("lightning-arc") && frame % Math.max(2, Math.round(4 - intensity * 3)) !== 0 && rng() < 0.4 * intensity;
  const spinA = is("spin-gem") || is("holy-rays") ? t * TAU : is("clock-tick") ? Math.floor(t * 12) / 12 * TAU : 0;
  const hueShift = is("rainbow-core") || is("chromatic-drift") ? t : is("shimmer-wave") ? t * 0.5 + Math.sin(t * TAU) * 0.05 : 0;
  const wingFlap = is("wings-flap") ? Math.sin(t * TAU * 2) * 0.5 : 0;
  const frostBlink = is("frost-shimmer") ? rng() : 0;
  const runePhase = is("rune-pulse") ? t : -1;
  const transform = (x, y) => {
    let nx = x + bobX, ny = y + bobY;
    if (Math.abs(rotA) > 1e-4) {
      const cx = W * 0.5, cy = W * 0.5;
      const dx = nx - cx, dy = ny - cy;
      const cs = Math.cos(rotA), sn = Math.sin(rotA);
      nx = cx + dx * cs - dy * sn;
      ny = cy + dx * sn + dy * cs;
    }
    return [nx, ny];
  };
  let gemC = hexToRgb(cfg.gemColor), gem2 = hexToRgb(cfg.gemColor2), glowC = hexToRgb(cfg.glowColor);
  if (hueShift > 0) {
    gemC = hueShiftRgb(gemC, hueShift);
    gem2 = hueShiftRgb(gem2, (hueShift + 0.1) % 1);
    glowC = hueShiftRgb(glowC, (hueShift - 0.05 + 1) % 1);
  }
  const pal = {
    shaftC: hexToRgb(cfg.shaftColor),
    shaftD: hexToRgb(cfg.shaftColor2),
    wrapC: hexToRgb(cfg.wrapColor),
    collarC: hexToRgb(cfg.collarColor),
    gemC,
    gem2,
    glowC,
    gemDark: shadeRgb(gemC, -0.45),
    partC: hexToRgb(cfg.particleColor),
    prongC: hexToRgb(cfg.prongColor),
    pommelC: hexToRgb(cfg.pommelColor),
    wingC: hexToRgb(cfg.wingColor),
    haloC: hexToRgb(cfg.haloColor),
    hornC: hexToRgb(cfg.hornColor),
    rarityC: hexToRgb(getRarity(cfg.rarity ?? "common").color)
  };
  const LX = -0.7071, LY = -0.7071;
  const ang = cfg.shaftAngle * Math.PI / 180;
  const dir = [Math.cos(ang), Math.sin(ang)];
  const perp = [-dir[1], dir[0]];
  const shaftless = isShaftless(cfg.itemType);
  const mid = shaftless ? [W * 0.5, W * 0.5] : [W * 0.46, W * 0.57];
  const rawL = shaftless ? 0 : W * cfg.shaftLength * 0.92;
  const rawHeadR = Math.max(2.6 * S, W * cfg.headSize / 2);
  const rawGap = shaftless ? 0 : W * 0.016 + rawHeadR * 0.55;
  const rawThickness = Math.max(1.15 * S, W * cfg.shaftThickness);
  const tipScale = cfg.tipScale;
  const tipFactor = cfg.tipStyle === "none" ? 0.45 : cfg.tipStyle === "floating-gem" ? 0.92 + 2.95 * tipScale : cfg.tipStyle === "orbit-ring" || cfg.tipStyle === "celestial-cage" || cfg.tipStyle === "prism-vortex" ? 0.92 + 1.85 * tipScale : cfg.tipStyle === "sun-disc" || cfg.tipStyle === "moon-circlet" ? 0.92 + 1.55 * tipScale : cfg.tipStyle === "phoenix-plume" || cfg.tipStyle === "plume" ? 0.92 + 1.8 * tipScale : 0.92 + 1.5 * tipScale;
  const decorReach = Math.max(
    rawHeadR * tipFactor,
    cfg.itemType === "scythe" || cfg.itemType === "trident" ? rawHeadR * 2.65 : 0
  ) + Math.abs(cfg.shaftCurve) * W + W * 0.035;
  const sideReach = Math.max(
    cfg.wings === "none" ? 0 : rawHeadR * 2.15,
    cfg.halo === "none" ? 0 : rawHeadR * (cfg.halo === "sunburst" || cfg.halo === "shattered" ? 1.9 : 1.55),
    cfg.orbiterStyle === "none" ? 0 : rawHeadR * (cfg.orbiterRadius + cfg.orbiterSize * 1.6),
    rawHeadR * 0.72
  );
  const pad = W * 0.045;
  const rawAlong = rawL + rawGap + decorReach + W * 0.045;
  const projection = shaftless ? 2 * Math.max(decorReach, sideReach) : Math.max(
    rawAlong * Math.abs(dir[0]) + 2 * sideReach * Math.abs(perp[0]),
    rawAlong * Math.abs(dir[1]) + 2 * sideReach * Math.abs(perp[1])
  );
  const fit = Math.min(1, Math.max(0.38, (W - pad * 2) / Math.max(1, projection)));
  const L = rawL * fit;
  const baseThick = Math.max(1 * S, rawThickness * fit);
  const headR = rawHeadR * fit;
  const gap = rawGap * fit;
  let start = [mid[0] - dir[0] * L / 2, mid[1] - dir[1] * L / 2];
  let end = [mid[0] + dir[0] * L / 2, mid[1] + dir[1] * L / 2];
  let headC = [end[0] + dir[0] * gap, end[1] + dir[1] * gap];
  const marginX = pad + sideReach * fit * Math.abs(perp[0]);
  const marginY = pad + sideReach * fit * Math.abs(perp[1]);
  const reach = decorReach * fit;
  const tMin = shaftless ? -reach : -L / 2 - W * 0.035;
  const tMax = shaftless ? reach : L / 2 + gap + reach;
  const xA = mid[0] + dir[0] * tMin, xB = mid[0] + dir[0] * tMax;
  const yA = mid[1] + dir[1] * tMin, yB = mid[1] + dir[1] * tMax;
  let ox = 0, oy = 0;
  const minX = Math.min(xA, xB) - marginX, maxX = Math.max(xA, xB) + marginX;
  const minY = Math.min(yA, yB) - marginY, maxY = Math.max(yA, yB) + marginY;
  if (minX < pad) ox = pad - minX;
  if (maxX + ox > W - pad) ox += W - pad - (maxX + ox);
  if (minY < pad) oy = pad - minY;
  if (maxY + oy > W - pad) oy += W - pad - (maxY + oy);
  start = transform(start[0] + ox, start[1] + oy);
  end = transform(end[0] + ox, end[1] + oy);
  headC = transform(headC[0] + ox, headC[1] + oy);
  const posAt = (tt) => {
    const bx = lerp(start[0], end[0], tt), by = lerp(start[1], end[1], tt);
    const bend = Math.sin(tt * Math.PI) * cfg.shaftCurve * W;
    let jx = 0, jy = 0;
    if (cfg.shaftStyle === "gnarled") {
      const j = Math.sin(tt * 22 + cfg.seed * 0.01) * W * 7e-3 + Math.sin(tt * 47 + 1.7) * W * 4e-3;
      jx = perp[0] * j;
      jy = perp[1] * j;
    }
    return [bx + perp[0] * bend + jx, by + perp[1] * bend + jy];
  };
  const collarPos = posAt(0.93);
  const collarLen = Math.max(1.6 * S, W * 0.04);
  const collarW = baseThick / 2 * 1.35;
  const pomPos = [start[0] - dir[0] * W * 0.012, start[1] - dir[1] * W * 0.012];
  const tipOff = headR * 0.92 + headR * cfg.tipScale * 0.35;
  const tipC = [headC[0] + dir[0] * tipOff, headC[1] + dir[1] * tipOff];
  const geo = {
    dir,
    perp,
    start,
    end,
    headC,
    headR,
    baseThick,
    L,
    LX,
    LY,
    shaftless,
    lightDot: perp[0] * LX + perp[1] * LY,
    posAt,
    collarPos,
    collarLen,
    collarW,
    pomPos,
    tipC,
    tipSize: headR * cfg.tipScale
  };
  const line = (x0, y0, x1, y1, w0, w1, c, dark, light, alpha = 255) => {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5) + 1;
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len, py = dx / len;
    for (let i = 0; i <= steps; i++) {
      const tt = i / steps;
      const x = lerp(x0, x1, tt), y = lerp(y0, y1, tt);
      const w = lerp(w0, w1, tt);
      for (let k = -w; k <= w; k += 0.6) {
        const e = w > 0 ? k / w : 0;
        const col = e < -0.5 ? dark : e > 0.4 ? light : c;
        buf.blend(x + px * k, y + py * k, col, alpha);
      }
    }
  };
  const ringHalo = (cx, cy, r, th, c, alpha, glow = 0) => {
    for (let y = Math.floor(cy - r - th - 2); y <= cy + r + th + 2; y++) {
      for (let x = Math.floor(cx - r - th - 2); x <= cx + r + th + 2; x++) {
        const dd = Math.abs(Math.hypot(x - cx, y - cy) - r);
        if (dd <= th / 2) buf.blend(x, y, c, alpha * (0.6 + 0.4 * (1 - dd / (th / 2 + 1e-3))));
        else if (glow > 0 && dd <= th / 2 + 3) buf.blend(x, y, c, glow * (1 - (dd - th / 2) / 3) * 70);
      }
    }
  };
  const edgeDarken = (col, f) => shadeRgb(col, -0.35 * f - 0.12);
  return {
    cfg,
    N,
    S,
    W,
    small,
    buf,
    rng,
    pal,
    geo,
    anim: { on, type, intensity, t, frame, TAU, glowMul, orbPhase, flicker, lightningOn, spinA, hueShift, wingFlap, frostBlink, runePhase },
    line,
    ringHalo,
    edgeDarken
  };
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/render/decor.ts
function drawOuterGlow(c) {
  const { cfg, buf, geo, pal, anim } = c;
  if (cfg.outerGlow <= 0.02) return;
  const { headC, headR, L, perp, baseThick, posAt } = geo;
  const og = Math.min(0.68, cfg.outerGlow * anim.glowMul * anim.flicker);
  const gr = headR * (1.12 + og * 0.78);
  for (let y = Math.floor(headC[1] - gr); y <= headC[1] + gr; y++) {
    for (let x = Math.floor(headC[0] - gr); x <= headC[0] + gr; x++) {
      const d = Math.hypot(x - headC[0], y - headC[1]);
      if (d > gr) continue;
      buf.blend(x, y, pal.glowC, Math.pow(1 - d / gr, 2.8) * og * 92);
    }
  }
  if ((cfg.finish === "enchanted" || cfg.motif !== "none") && !geo.shaftless && L > 0) {
    for (let s = 0; s <= L; s += 1) {
      const [cx, cy] = posAt(s / L);
      buf.blend(cx + perp[0] * baseThick * 0.9, cy + perp[1] * baseThick * 0.9, pal.glowC, 6 * og);
    }
  }
  if (anim.lightningOn) {
    const gr2 = headR * 2.15;
    for (let y = Math.floor(headC[1] - gr2); y <= headC[1] + gr2; y++) {
      for (let x = Math.floor(headC[0] - gr2); x <= headC[0] + gr2; x++) {
        const d = Math.hypot(x - headC[0], y - headC[1]);
        if (d > gr2) continue;
        buf.blend(x, y, WHITE, Math.pow(1 - d / gr2, 4) * 140 * anim.intensity);
      }
    }
  }
}
function drawHalo(c) {
  const { cfg, buf, geo, pal, anim, S, W, N, small, line, ringHalo } = c;
  if (cfg.halo === "none" || small) return;
  const { headC, headR } = geo;
  const haloC = pal.haloC;
  const hr = headR * 1.5;
  const ht = Math.max(1 * S, W * 0.015);
  if (cfg.halo === "ring" || cfg.halo === "rune-ring") {
    ringHalo(headC[0], headC[1], hr, ht, haloC, 235, 1);
    if (cfg.halo === "rune-ring") {
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2 + cfg.seed * 1e-3;
        const rx = headC[0] + Math.cos(a) * hr, ry = headC[1] + Math.sin(a) * hr;
        buf.blend(rx, ry, WHITE, 235);
        buf.blend(rx + Math.cos(a) * 1.5, ry + Math.sin(a) * 1.5, haloC, 185);
        if (N >= 64) {
          buf.blend(rx - Math.sin(a), ry + Math.cos(a), haloC, 150);
          buf.blend(rx + Math.sin(a), ry - Math.cos(a), haloC, 150);
        }
      }
    }
  } else if (cfg.halo === "double") {
    ringHalo(headC[0], headC[1], hr * 0.95, ht * 0.8, haloC, 225, 0.8);
    ringHalo(headC[0], headC[1], hr * 1.34, ht * 0.55, mixRgb(haloC, WHITE, 0.4), 185, 0.5);
  } else if (cfg.halo === "eclipse") {
    ringHalo(headC[0], headC[1], hr, ht * 2.3, [10, 7, 18], 240, 0);
    ringHalo(headC[0], headC[1], hr - ht * 1.4, ht * 0.65, mixRgb(haloC, WHITE, 0.35), 225, 1);
    ringHalo(headC[0], headC[1], hr + ht * 1.4, ht * 0.55, haloC, 165, 0.8);
  } else if (cfg.halo === "sunburst") {
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2 + anim.spinA;
      const long = i % 2 === 0;
      const r0 = hr * 0.72, r1 = hr * (long ? 1.55 : 1.12);
      line(
        headC[0] + Math.cos(a) * r0,
        headC[1] + Math.sin(a) * r0,
        headC[0] + Math.cos(a) * r1,
        headC[1] + Math.sin(a) * r1,
        ht * (long ? 0.75 : 0.45),
        ht * 0.25,
        haloC,
        shadeRgb(haloC, -0.3),
        mixRgb(haloC, WHITE, 0.6)
      );
    }
    ringHalo(headC[0], headC[1], hr * 0.68, ht * 0.5, mixRgb(haloC, WHITE, 0.45), 220, 1);
  } else if (cfg.halo === "triple") {
    ringHalo(headC[0], headC[1], hr * 0.82, ht * 0.7, haloC, 230, 0.8);
    ringHalo(headC[0], headC[1], hr * 1.18, ht * 0.5, mixRgb(haloC, WHITE, 0.3), 195, 0.6);
    ringHalo(headC[0], headC[1], hr * 1.52, ht * 0.35, mixRgb(haloC, WHITE, 0.55), 155, 0.4);
  } else if (cfg.halo === "hex-grid") {
    const hexR = hr * 1.05;
    for (let ring = 0; ring < 2; ring++) {
      const rr = hexR * (1 + ring * 0.34);
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2 + anim.spinA * (ring ? -0.6 : 1) + Math.PI / 6;
        pts.push([headC[0] + Math.cos(a) * rr, headC[1] + Math.sin(a) * rr]);
      }
      const col = ring ? mixRgb(haloC, WHITE, 0.4) : haloC;
      for (let i = 0; i < 6; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % 6];
        line(x0, y0, x1, y1, ht * (ring ? 0.28 : 0.4), ht * (ring ? 0.28 : 0.4), col, shadeRgb(col, -0.3), WHITE, ring ? 165 : 225);
      }
      for (const [px, py] of pts) buf.blend(px, py, WHITE, ring ? 150 : 225);
    }
  } else if (cfg.halo === "spiral") {
    const turns = 2.2, steps = 60;
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const a = f * Math.PI * 2 * turns + anim.spinA;
      const rr = hr * (0.55 + f * 0.95);
      buf.disc(headC[0] + Math.cos(a) * rr, headC[1] + Math.sin(a) * rr, ht * 0.4 * (1 - f * 0.55), mixRgb(haloC, WHITE, f * 0.5), 235 - f * 90);
    }
  } else if (cfg.halo === "shattered") {
    const shards = 9;
    for (let i = 0; i < shards; i++) {
      const a = i / shards * Math.PI * 2 + anim.spinA * 0.5;
      const gap = 0.16 + i % 3 * 0.05;
      const a0 = a - gap, a1 = a + gap;
      const rr = hr * (1 + (i % 2 ? 0.14 : -0.08));
      const steps = 6;
      for (let k = 0; k <= steps; k++) {
        const aa = a0 + (a1 - a0) * (k / steps);
        buf.disc(headC[0] + Math.cos(aa) * rr, headC[1] + Math.sin(aa) * rr, ht * 0.45, i % 2 ? mixRgb(haloC, WHITE, 0.35) : haloC, 235);
      }
    }
  } else if (cfg.halo === "lens-flare") {
    const cx = headC[0], cy = headC[1];
    const rr = hr * 2.1;
    line(cx - rr, cy, cx + rr, cy, ht * 0.5, ht * 0.28, mixRgb(haloC, WHITE, 0.75), haloC, WHITE, 245);
    line(cx, cy - rr * 0.5, cx, cy + rr * 0.5, ht * 0.35, ht * 0.22, mixRgb(haloC, WHITE, 0.55), haloC, WHITE, 225);
    buf.disc(cx, cy, ht * 1.9, WHITE, 230);
    buf.disc(cx, cy, ht * 1.1, mixRgb(haloC, WHITE, 0.4), 245);
    for (let i = -3; i <= 3; i++) {
      const len = ht * (1.2 + (i % 2 ? 0.5 : 0.9));
      line(cx + i * ht * 5.5, cy - len * 0.3, cx + i * ht * 5.5, cy + len * 0.3, 0.5 * S, 0.4 * S, mixRgb(haloC, WHITE, 0.4), haloC, WHITE, 190 - Math.abs(i) * 24);
    }
    buf.ring(cx, cy, rr * 0.5, ht * 0.28, mixRgb(haloC, WHITE, 0.5), 165);
  }
  if (anim.on && anim.type === "holy-rays") {
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + anim.spinA * 1.5;
      const r0 = hr * 1.18, r1 = hr * 1.95;
      line(
        headC[0] + Math.cos(a) * r0,
        headC[1] + Math.sin(a) * r0,
        headC[0] + Math.cos(a) * r1,
        headC[1] + Math.sin(a) * r1,
        ht * 0.45,
        ht * 0.12,
        mixRgb(haloC, WHITE, 0.5),
        haloC,
        WHITE,
        180 * anim.intensity
      );
    }
  }
}
function drawWings(c) {
  const { cfg, buf, geo, pal, anim, S, small, line } = c;
  if (cfg.wings === "none" || small) return;
  const { headC, headR } = geo;
  const wingC = pal.wingC;
  const span = headR * (2.1 + anim.wingFlap * 0.35);
  const wDark = shadeRgb(wingC, -0.4), wLight = shadeRgb(wingC, 0.5);
  for (const side of [-1, 1]) {
    const shX = headC[0] + side * headR * 0.35;
    const shY = headC[1] + headR * (0.25 + anim.wingFlap * 0.22);
    if (cfg.wings === "angel" || cfg.wings === "seraph") {
      const n = cfg.wings === "seraph" ? 5 : 4;
      for (let i = 0; i < n; i++) {
        const f = i / Math.max(1, n - 1);
        const bx = shX + side * headR * 0.1 * i, by = shY - i * headR * 0.22;
        const tx = bx + side * span * (1 - f * 0.42), ty = by - headR * (0.55 + f * 0.5);
        line(bx, by, tx, ty, headR * 0.2 * (1 - f * 0.3), 0.6 * S, wingC, wDark, wLight);
        if (cfg.wings === "seraph") line(bx + side * 1, by - 1, tx, ty, 0.5 * S, 0.4 * S, [255, 215, 130], [200, 150, 60], [255, 235, 190]);
      }
    } else if (cfg.wings === "bat") {
      const tipX = shX + side * span, tipY = shY - headR * 1.25;
      const botX = shX + side * span * 0.42, botY = shY + headR * 0.35;
      const minX = Math.min(shX, tipX, botX), maxX = Math.max(shX, tipX, botX);
      const minY = Math.min(shY, tipY, botY), maxY = Math.max(shY, tipY, botY);
      const edge = (x, y, ax, ay, bx, by) => (bx - ax) * (y - ay) - (by - ay) * (x - ax);
      for (let y = Math.floor(minY); y <= maxY; y++) {
        for (let x = Math.floor(minX); x <= maxX; x++) {
          const e1 = edge(x, y, shX, shY, tipX, tipY), e2 = edge(x, y, tipX, tipY, botX, botY), e3 = edge(x, y, botX, botY, shX, shY);
          const inside = side > 0 ? e1 >= 0 && e2 >= 0 && e3 >= 0 : e1 <= 0 && e2 <= 0 && e3 <= 0;
          if (!inside) continue;
          let cut = false;
          for (let k = 0; k < 3; k++) {
            const f = 0.25 + k * 0.25;
            if (Math.hypot(x - lerp(tipX, botX, f), y - lerp(tipY, botY, f)) < headR * 0.28) {
              cut = true;
              break;
            }
          }
          if (cut) continue;
          const sf = clamp01((x - minX) / Math.max(1, maxX - minX));
          buf.blend(x, y, mixRgb(shadeRgb(wingC, -0.32), shadeRgb(wingC, 0.14), sf), 255);
        }
      }
      line(shX, shY, tipX, tipY, 1.2 * S, 0.7 * S, wLight, wDark, WHITE);
      line(shX, shY, botX, botY, 1 * S, 0.6 * S, shadeRgb(wingC, 0.2), wDark, wLight);
    } else if (cfg.wings === "fae") {
      for (let i = 0; i < 2; i++) {
        const ex = shX + side * span * (0.45 + i * 0.3), ey = shY - headR * (0.35 + i * 0.4);
        const erx = headR * (0.55 - i * 0.12), ery = headR * (0.8 - i * 0.15);
        for (let y = Math.floor(ey - ery); y <= ey + ery; y++) {
          for (let x = Math.floor(ex - erx); x <= ex + erx; x++) {
            const dd = ((x - ex) / erx) ** 2 + ((y - ey) / ery) ** 2;
            if (dd > 1) continue;
            buf.blend(x, y, mixRgb(wingC, WHITE, 0.45 * (1 - dd)), dd < 0.7 ? 205 : 125);
            if (Math.abs(dd - 0.85) < 0.18) buf.blend(x, y, WHITE, 120);
          }
        }
      }
    } else if (cfg.wings === "blade") {
      for (let i = 0; i < 2; i++) {
        const bx = shX, by = shY - i * headR * 0.3;
        const tx = bx + side * span * (1.05 - i * 0.25), ty = by - headR * (0.9 - i * 0.15);
        line(bx, by, tx, ty, headR * 0.16, 0.4 * S, wingC, shadeRgb(wingC, -0.45), WHITE);
        line(bx, by + 1, tx, ty + 1, 0.6 * S, 0.3 * S, WHITE, WHITE, WHITE);
      }
    } else if (cfg.wings === "mech") {
      for (let i = 0; i < 3; i++) {
        const f = i / 2;
        const bx = shX + side * headR * 0.18 * i, by = shY - i * headR * 0.3;
        const tx = bx + side * span * (0.95 - f * 0.28), ty = by - headR * (0.35 + f * 0.55);
        line(bx, by, tx, ty, headR * (0.2 - f * 0.05), headR * 0.07, wingC, shadeRgb(wingC, -0.45), shadeRgb(wingC, 0.55));
        line(bx, by, tx, ty, 0.5 * S, 0.3 * S, shadeRgb(wingC, -0.55), shadeRgb(wingC, -0.55), shadeRgb(wingC, -0.4), 200);
        buf.disc(bx + side * headR * 0.1, by, Math.max(0.7 * S, headR * 0.07), mixRgb(pal.gemC, WHITE, 0.4));
      }
    } else if (cfg.wings === "crystal") {
      for (let i = 0; i < 4; i++) {
        const f = i / 3;
        const bx = shX, by = shY - i * headR * 0.24;
        const tx = bx + side * span * (1 - f * 0.34), ty = by - headR * (0.5 + f * 0.62);
        const c0 = mixRgb(pal.gemC, WHITE, 0.25 + f * 0.25);
        line(bx, by, tx, ty, headR * 0.14 * (1 - f * 0.3), 0.5 * S, c0, shadeRgb(c0, -0.45), WHITE, 240);
        buf.disc(tx, ty, Math.max(0.7 * S, headR * 0.06), WHITE, 210);
      }
    } else if (cfg.wings === "flame") {
      for (let i = 0; i < 4; i++) {
        const f = i / 3;
        const bx = shX, by = shY - i * headR * 0.2;
        const tipX = bx + side * span * (0.95 - f * 0.3);
        const tipY = by - headR * (0.6 + f * 0.7);
        const midX = bx + side * span * 0.45, midY = by - headR * 0.15;
        const col = mixRgb(pal.gemC, pal.gem2, f);
        for (let q = 0; q <= 14; q++) {
          const t = q / 14;
          const x = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * midX + t * t * tipX;
          const y = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * midY + t * t * tipY;
          buf.disc(x, y, Math.max(0.6 * S, headR * 0.16 * (1 - t * 0.85)), mixRgb(col, WHITE, t * 0.55), 240);
        }
      }
    } else if (cfg.wings === "leafwing") {
      for (let i = 0; i < 3; i++) {
        const f = i / 2;
        const ex = shX + side * span * (0.5 + f * 0.28), ey = shY - headR * (0.25 + f * 0.5);
        const erx = headR * (0.62 - f * 0.12), ery = headR * (0.3 + f * 0.08);
        for (let y = Math.floor(ey - ery); y <= ey + ery; y++) {
          for (let x = Math.floor(ex - erx); x <= ex + erx; x++) {
            const dd = ((x - ex) / erx) ** 2 + ((y - ey) / ery) ** 2;
            if (dd > 1) continue;
            buf.blend(x, y, mixRgb(shadeRgb(wingC, 0.2), shadeRgb(wingC, -0.3), dd), 250);
          }
        }
        line(ex - side * erx, ey, ex + side * erx, ey, 0.6 * S, 0.4 * S, mixRgb(wingC, WHITE, 0.45), wingC, WHITE, 220);
      }
    } else if (cfg.wings === "peacock") {
      const quills = 6;
      for (let i = 0; i < quills; i++) {
        const f = i / (quills - 1);
        const a = -Math.PI / 2 + (f - 0.5) * 0.85 * side;
        const bx = shX, by = shY;
        const tx = bx + Math.cos(a) * span * 1.05, ty = by + Math.sin(a) * span * 1.05;
        const grad = mixRgb(wingC, pal.gemC, 0.35 + f * 0.3);
        line(bx, by, tx, ty, headR * (0.1 - f * 0.04), 0.55 * S, grad, shadeRgb(grad, -0.3), mixRgb(grad, WHITE, 0.4), 235);
        buf.disc(tx, ty, headR * 0.14, mixRgb(pal.gem2, WHITE, 0.15), 250);
        buf.disc(tx, ty, headR * 0.08, mixRgb(pal.gemC, WHITE, 0.25), 250);
        buf.disc(tx, ty, headR * 0.035, WHITE, 235);
      }
    } else if (cfg.wings === "cape") {
      const steps = 16;
      let lastX = shX, lastY = shY;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const sway = Math.sin(t * 5.2 + c.cfg.seed * 0.02) * headR * 0.12;
        const x = shX + side * (span * t * 0.75) + sway;
        const y = shY + span * t * 0.85 + t * t * headR * 0.4;
        line(lastX, lastY, x, y, headR * (0.2 - t * 0.12), headR * (0.16 - t * 0.1), wingC, shadeRgb(wingC, -0.35), shadeRgb(wingC, 0.4), 245);
        if (i % 3 === 0) line(lastX, lastY, x, y, 0.55 * S, 0.4 * S, mixRgb(wingC, WHITE, 0.5), wingC, WHITE, 200);
        lastX = x;
        lastY = y;
      }
      line(lastX - headR * 0.14, lastY, lastX + headR * 0.14, lastY, 0.6 * S, 0.35 * S, mixRgb(pal.collarC, WHITE, 0.4), pal.collarC, WHITE, 240);
      const gemX = lastX, gemY = lastY + headR * 0.02;
      buf.disc(gemX, gemY, Math.max(0.5 * S, headR * 0.06), mixRgb(pal.gemC, WHITE, 0.3), 240);
    }
  }
}
function drawHorns(c) {
  const { cfg, buf, geo, pal, S, small } = c;
  if (!cfg.horns || small) return;
  const { headC, headR, dir, perp } = geo;
  for (const side of [-1, 1]) {
    const bx = headC[0] + perp[0] * side * headR * 0.75 - dir[0] * headR * 0.25;
    const by = headC[1] + perp[1] * side * headR * 0.75 - dir[1] * headR * 0.25;
    const tx = bx + side * headR * 0.85 - dir[0] * headR * 0.55, ty = by - headR * 0.95;
    const mx = bx + side * headR * 0.7, my = by - headR * 0.35;
    for (let q = 0; q <= 20; q++) {
      const t = q / 20;
      const x = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * mx + t * t * tx;
      const y = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * my + t * t * ty;
      const w = Math.max(0.6 * S, headR * 0.14 * (1 - t * 0.75));
      let col = t > 0.8 ? shadeRgb(pal.hornC, -0.25) : pal.hornC;
      if (Math.sin(t * 22) > 0.7) col = shadeRgb(col, -0.18);
      buf.disc(x, y, w, col);
    }
  }
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/render/shaft.ts
function drawShaft(c) {
  const { cfg, buf, geo, pal, anim, S, rng } = c;
  if (geo.shaftless) return;
  const { L, perp, baseThick, posAt, lightDot } = geo;
  const { shaftC, shaftD, wrapC, collarC, gemC } = pal;
  const detail = cfg.shaftDetail;
  const sh = cfg.shading;
  for (let s = 0; s <= L; s += 0.4) {
    const t = s / L;
    const [cx, cy] = posAt(t);
    let thick = baseThick * (1.2 - 0.38 * t);
    if (cfg.shaftStyle === "royal") thick *= 1 + 0.09 * Math.sin(t * Math.PI);
    if (cfg.shaftStyle === "ivory" || cfg.shaftStyle === "bone") thick *= 1 + 0.2 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 5)), 6);
    if (cfg.shaftStyle === "bamboo") thick *= 1 + 0.1 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 14)), 8);
    const r = thick / 2;
    const rr = Math.ceil(r) + 1;
    let matBase = shaftC, matShadow = shaftD;
    if (cfg.shaftStyle === "obsidian") {
      matBase = shaftC;
      matShadow = shadeRgb(matBase, -0.7);
    } else if (cfg.shaftStyle === "crystal") {
      matBase = mixRgb(shaftC, gemC, 0.45);
      matShadow = shadeRgb(matBase, -0.45);
    } else if (cfg.shaftStyle === "ivory") {
      matBase = mixRgb(shaftC, WHITE, 0.2);
      matShadow = shadeRgb(matBase, -0.3);
    }
    const cHi = shadeRgb(matBase, 0.3 * sh);
    const cBaseHi = shadeRgb(matBase, 0.14 * sh);
    const cSh = mixRgb(matShadow, matBase, 0.25);
    const cCore = mixRgb(matShadow, INK, 0.35);
    const cRim = mixRgb(matShadow, INK, 0.6);
    for (let k = -rr; k <= rr; k++) {
      const cov = clamp01(r - Math.abs(k) + 0.5);
      if (cov <= 0.02) continue;
      const uu = r > 0 ? k * lightDot / r : 0;
      let col;
      if (uu > 0.82) col = shadeRgb(cHi, 0.22);
      else if (uu > 0.34) col = cHi;
      else if (uu > 0.06) col = cBaseHi;
      else if (uu > -0.26) col = matBase;
      else if (uu > -0.6) col = cSh;
      else if (uu > -0.86) col = cCore;
      else col = cRim;
      if (uu < -0.93) col = mixRgb(cRim, cSh, 0.32);
      switch (cfg.shaftStyle) {
        case "twisted":
          col = shadeRgb(col, Math.sin((s + k * 2.1) * 0.9 + cfg.seed) > 0.08 ? 0.2 : -0.22);
          break;
        case "bone":
        case "ivory": {
          const seg = Math.abs(t * 5 % 1 - 0.5);
          if (seg > 0.44) col = shadeRgb(col, -0.26);
          else if (seg < 0.1) col = shadeRgb(col, 0.12);
          if (cfg.shaftStyle === "ivory" && Math.abs(k) < r * 0.22) col = mixRgb(col, WHITE, 0.1);
          break;
        }
        case "gnarled":
          if (Math.sin(t * 43 + cfg.seed * 0.02) > 0.94 && Math.abs(k) < r * 0.4) col = shadeRgb(col, -0.38);
          break;
        case "royal":
          if (Math.abs(k) < Math.max(0.8 * S, r * 0.22)) {
            col = mixRgb(wrapC, WHITE, uu > 0 ? 0.4 : 0);
            if (Math.abs(uu) < 0.1) col = mixRgb(col, WHITE, 0.28);
          }
          break;
        case "bamboo": {
          const seg = Math.abs(t * 14 % 1 - 0.5);
          if (seg > 0.47) col = shadeRgb(col, -0.22);
          if (Math.abs(k) < r * 0.16) col = shadeRgb(col, 0.18);
          break;
        }
        case "ornate": {
          const spiral = Math.sin(s * 0.55 + k * 0.9) > 0.55;
          if (spiral && Math.abs(k) < r * 0.55) col = mixRgb(collarC, WHITE, 0.25);
          else if (spiral) col = shadeRgb(col, -0.2);
          break;
        }
        case "segmented": {
          const seg = t * 8 % 1;
          if (seg > 0.86) col = shadeRgb(col, -0.4);
          else if (seg < 0.12) col = shadeRgb(col, 0.2);
          break;
        }
        case "crystal":
          if (Math.sin(k * 1.4 + s * 0.1) > 0.6) col = mixRgb(col, WHITE, 0.3);
          break;
        case "leather":
          if (rng() < 0.35) col = shadeRgb(col, rng() > 0.5 ? 0.1 : -0.14);
          break;
        case "obsidian":
          if (uu > 0.3 && uu < 0.75) col = mixRgb(col, gemC, 0.35);
          break;
        case "ebony": {
          col = shadeRgb(col, -0.3);
          if (uu > 0.68) col = mixRgb(col, [184, 132, 54], 0.42);
          if (Math.abs(t * 7 % 1 - 0.5) < 0.06) col = mixRgb(col, mixRgb(collarC, WHITE, 0.4), 0.7);
          break;
        }
        case "porcelain": {
          col = mixRgb(col, WHITE, 0.72);
          if (rng() < 0.08) col = shadeRgb(col, -0.06);
          if (Math.sin(s * 0.9 + Math.sin(t * 5.3) * 2.4 + k * 1.35) > 0.965) col = mixRgb(collarC, WHITE, 0.28);
          break;
        }
        case "alloy": {
          if (t * 12 % 1 > 0.82) col = shadeRgb(col, -0.22);
          else if (t * 12 % 1 < 0.1) col = mixRgb(col, WHITE, 0.22);
          if (t * 6 % 1 < 0.05 && Math.abs(k) < r * 0.3) col = mixRgb(col, mixRgb(collarC, WHITE, 0.5), 0.6);
          if (rng() < 0.04) col = shadeRgb(col, 0.13);
          break;
        }
        /* ══════════════════ WOOD PLANKS (vanilla family) ══════════════════
           Every plank shaft inherits a unique grain direction and colour palette. */
        case "oak":
        case "birch":
        case "dark-oak":
        case "spruce":
        case "jungle":
        case "cherry":
        case "mangrove":
        case "azalea": {
          const oakWood = [[115, 92, 61], [89, 69, 43], [197, 157, 98]];
          const birchWood = [[190, 165, 125], [214, 217, 215], [238, 196, 140]];
          const darkWood = [[60, 38, 26], [46, 27, 19], [194, 110, 76]];
          const spruceWood = [[74, 54, 33], [62, 40, 25], [145, 96, 53]];
          const jungleWood = [[202, 158, 122], [188, 138, 102], [240, 184, 126]];
          const cherryWood = [[192, 130, 130], [148, 84, 84], [238, 184, 184]];
          const mangroveWood = [[92, 52, 42], [74, 35, 28], [146, 66, 50]];
          const azaleaWood = [[110, 90, 62], [88, 68, 50], [202, 158, 110]];
          const woodMap = {
            oak: oakWood,
            birch: birchWood,
            "dark-oak": darkWood,
            spruce: spruceWood,
            jungle: jungleWood,
            cherry: cherryWood,
            mangrove: mangroveWood,
            azalea: azaleaWood
          };
          const styl = woodMap[cfg.shaftStyle] ?? [hexToRgb(cfg.shaftColor), hexToRgb(cfg.shaftColor2), [0, 0, 0]];
          const base = styl[0];
          const dark = styl[1];
          const isBirch = cfg.shaftStyle === "birch";
          const spr = cfg.shaftStyle === "spruce";
          const jungle = cfg.shaftStyle === "jungle";
          const cherry = cfg.shaftStyle === "cherry";
          const mangroveM = cfg.shaftStyle === "mangrove";
          const rings = isBirch ? 17 : jungle ? 7 : cherry ? 9 : mangroveM ? 11 : 13;
          const grow = (x, y) => {
            let g = base;
            const band = Math.abs(y * rings % 1 - 0.5);
            if (band > (isBirch ? 0.47 : 0.44) && rng() < 0.72) g = rng() < 0.55 ? dark : shadeRgb(base, 0.1);
            if (spr && y % 5 < 2 && rng() < 0.32) g = shadeRgb(g, 0.12);
            if (isBirch && (Math.sin(x * 3.4 + y * 0.7) > 0.55 || Math.cos(y * 5.1) > 0.62)) g = shadeRgb(g, -0.25);
            if (jungle && rng() < 0.16) g = mixRgb(g, [236, 190, 140], 0.3);
            if (cfg.shaftStyle === "azalea" && rng() < 0.2) g = mixRgb(g, [104, 134, 72], 0.42);
            g = shadeRgb(g, uu * -0.14);
            return g;
          };
          col = grow(Math.round(cx + perp[0] * k), Math.round(cy + perp[1] * k));
          break;
        }
        /* ── industrial ── */
        case "mech-brass": {
          if (Math.abs(k) < r * 0.22) col = mixRgb([194, 152, 74], [214, 178, 106], 0.5);
          if (Math.abs(t * 6 % 1 - 0.5) < 0.07) col = mixRgb(col, [216, 168, 82], 0.7);
          col = uu < -0.16 ? shadeRgb(col, -0.34) : uu > 0.5 ? shadeRgb(col, 0.22) : col;
          break;
        }
        case "mech-iron": {
          col = mixRgb([176, 178, 182], [122, 126, 132], (k / (r > 0 ? r : 1) + 1) / 2);
          if (Math.abs(uu) > 0.8) col = shadeRgb(col, -0.18);
          if (t * 8 % 1 < 0.11) col = mixRgb(col, [244, 244, 248], 0.3);
          break;
        }
        case "copper": {
          col = mixRgb([200, 128, 82], [170, 90, 55], t * 8 % 1 > 0.55 ? 0.3 : 0.6);
          if (rng() < 0.06) col = mixRgb(col, [110, 176, 110], 0.28);
          if (Math.abs(t * 5 % 1 - 0.5) < 0.06) col = shadeRgb(col, -0.2);
          break;
        }
        case "pipe": {
          if (Math.abs(k) < r * 0.3) col = mixRgb(col, [34, 36, 44], 0.78);
          if (Math.abs(k) > r * 0.62) col = mixRgb([198, 200, 206], col, 0.72);
          if (t * 4 % 1 < 0.1 && Math.abs(k) < r * 0.6) col = mixRgb(col, [204, 168, 58], 0.55);
          break;
        }
        case "conveyor": {
          if (t * 14 % 1 > 0.86) col = mixRgb([222, 185, 70], [30, 26, 24], 0.75);
          if (rng() < 0.04) col = shadeRgb(col, -0.2);
          break;
        }
        /* ── jewel-encrusted ── */
        case "gemmed": {
          if (t * 5 % 1 < 0.09) col = mixRgb(col, uu < 0 ? shadeRgb(wrapC, -0.35) : shadeRgb(wrapC, 0.38), 0.6);
          if (rng() < 0.05) col = mixRgb(col, gemC, 0.5);
          break;
        }
        case "gem-column": {
          if (Math.abs(k) < r * 0.36) col = mixRgb(col, gemC, 0.72);
          if (Math.abs(k) < r * 0.14) col = mixRgb(col, WHITE, 0.25);
          if (Math.abs(k) > r * 0.58) col = mixRgb(col, collarC, 0.5);
          break;
        }
        case "gem-tube": {
          if (Math.abs(k) > r * 0.58) col = mixRgb(col, collarC, 0.55);
          else col = mixRgb(col, gemC, 0.58 + Math.sin(t * 30) * 0.08);
          if (Math.abs(k) < r * 0.16) col = mixRgb(col, mixRgb(gemC, WHITE, 0.55), 0.4);
          break;
        }
        case "embedding": {
          if (rng() < 0.3) col = mixRgb(col, collarC, 0.5);
          if (Math.abs(t * 4 % 1 - 0.5) < 0.07) col = mixRgb(col, gemC, 0.6);
          if (t * 8 % 1 < 0.05 && Math.abs(k) < r * 0.42) col = mixRgb(col, gemC, 0.85);
          break;
        }
        /* ── aquatic ── */
        case "prismarine": {
          if (rng() < 0.32) col = mixRgb(col, [76, 146, 150], 0.75);
          if (rng() < 0.12) col = mixRgb(col, [34, 70, 68], 0.55);
          if (Math.abs(k) < r * 0.16 && rng() < 0.5) col = mixRgb(col, WHITE, 0.3);
          break;
        }
        case "kelp-rope": {
          col = mixRgb([88, 132, 88], [58, 94, 50], clamp01((k / (r || 1) + 1) / 2));
          if (rng() < 0.18) col = mixRgb(col, [160, 180, 110], 0.5);
          if (t * 9 % 1 < 0.12) col = shadeRgb(col, -0.18);
          break;
        }
        case "anchor-chain": {
          const linkShade = t * 4 % 1 < 0.3 ? mixRgb(collarC, WHITE, 0.35) : shadeRgb(collarC, -0.3);
          if (t * 4 % 1 < 0.3) col = mixRgb(col, linkShade, 0.7);
          else col = shadeRgb(col, -0.22);
          if (t * 2 % 1 < 0.08) col = mixRgb(col, WHITE, 0.22);
          break;
        }
        case "sponge": {
          col = mixRgb([204, 190, 96], [170, 154, 74], clamp01((k / (r || 1) + 1) / 2));
          if (rng() < 0.38) col = mixRgb(col, [16, 38, 44], 0.24);
          if (rng() < 0.16) col = mixRgb(col, [124, 168, 94], 0.3);
          break;
        }
        case "glass": {
          if (rng() < 0.55) col = mixRgb([214, 236, 242], col, 0.75);
          if (Math.abs(k) < r * 0.28) col = mixRgb(col, gemC, 0.35);
          if (Math.abs(k) < r * 0.1) col = mixRgb(col, WHITE, 0.5);
          col = mixRgb(col, WHITE, uu > 0.5 ? 0.25 : 0.08);
          break;
        }
        case "bamboo-woven": {
          col = mixRgb([186, 158, 94], [154, 134, 86], clamp01((k / (r || 1) + 1) / 2));
          if (t * 12 % 1 < 0.42) col = shadeRgb(col, -0.14);
          else col = mixRgb(col, [142, 114, 74], 0.22);
          if (rng() < 0.05) col = mixRgb(col, [114, 96, 44], 0.32);
          break;
        }
      }
      if (cfg.wrapStyle !== "none") {
        const cnt = cfg.wrapDensity;
        let frac = t * cnt % 1;
        let inWrap = false;
        switch (cfg.wrapStyle) {
          case "spiral":
            frac = ((t * cnt + k * 0.1) % 1 + 1) % 1;
            inWrap = frac < 0.3;
            break;
          case "rings":
            inWrap = frac < 0.16;
            break;
          case "vine":
            inWrap = frac < 0.2 + 0.08 * Math.sin(t * 30);
            break;
          case "chain":
            inWrap = frac < 0.17 || frac > 0.5 && frac < 0.67;
            break;
          case "rune-band":
            inWrap = frac < 0.46;
            break;
          case "stitch":
            inWrap = frac < 0.1 && Math.abs(k) > r * 0.45;
            break;
          case "scale":
            inWrap = (s + k * 2) % 4 < 2;
            break;
        }
        if (inWrap) {
          let wc = uu < -0.5 ? shadeRgb(wrapC, -0.42) : uu < 0.3 ? wrapC : shadeRgb(wrapC, 0.42);
          if (cfg.wrapStyle === "chain") wc = shadeRgb(wc, Math.sin(s * 2.2) > 0 ? 0.15 : -0.15);
          if (cfg.wrapStyle === "rune-band" && Math.abs(k) < r * 0.45) {
            const baseRune = s % 3.2 < 1.4;
            let pulse = 0;
            if (anim.on && anim.type === "rune-pulse") {
              const d = Math.abs((t / L - anim.runePhase + 0.12) % 1 - 0.12);
              pulse = d < 0.12 ? (1 - d / 0.12) * anim.intensity : 0;
            }
            const gemCol = mixRgb(gemC, WHITE, 0.55);
            wc = baseRune ? pulse > 0 ? mixRgb(gemCol, WHITE, pulse * 0.4) : gemCol : shadeRgb(wrapC, -0.15);
            if (pulse > 0) wc = mixRgb(wc, WHITE, pulse * 0.35);
          }
          if (cfg.wrapStyle === "vine" && rng() < 0.12) wc = shadeRgb(wc, 0.32);
          if (cfg.wrapStyle === "scale") wc = shadeRgb(wc, (s + k * 2) % 8 < 4 ? 0.2 : -0.2);
          col = wc;
        }
      }
      if (detail > 0.25 && r > 2.2 * S) {
        if (Math.abs(uu - 0.16) < 0.05 * detail) col = shadeRgb(col, -0.3 * detail);
        if (detail > 0.6 && Math.abs(k) < r * 0.9 && t * 6 % 1 < 0.06) col = shadeRgb(col, -0.22);
      }
      if (detail > 0.7 && r > 2.6 * S && t * 8 % 1 < 0.05 && Math.abs(k) < r * 0.35) col = mixRgb(collarC, WHITE, 0.5);
      if (cfg.modEssence === "thaumcraft") {
        const channel = Math.abs(uu - 0.1) < 0.18;
        if (channel) {
          const visGlow = 0.5 + 0.5 * Math.sin(t * 18 - (anim.on ? anim.t * anim.TAU : 0));
          col = mixRgb(col, [168, 85, 247], visGlow * 0.75);
        }
      } else if (cfg.modEssence === "botania") {
        if (Math.sin(t * 26 + k * 0.5) > 0.65) {
          col = mixRgb(col, [74, 222, 128], 0.65);
        }
        if (Math.abs(uu + 0.1) < 0.12) {
          col = mixRgb(col, [34, 211, 238], 0.7);
        }
      } else if (cfg.modEssence === "astral-sorcery") {
        if (Math.abs(uu) < 0.14) {
          col = mixRgb(WHITE, [147, 197, 253], 0.4);
        }
      } else if (cfg.modEssence === "sculk-ancient") {
        if (Math.sin(t * 14 + k * 0.8) > 0.4) {
          const sculkPulse = 0.4 + 0.6 * (Math.sin(t * 10 + (anim.on ? anim.t * anim.TAU * 2 : 0)) > 0 ? 1 : 0);
          col = mixRgb([4, 30, 36], [6, 182, 212], sculkPulse);
        }
      } else if (cfg.modEssence === "netherite-gilded") {
        if (Math.abs(uu - 0.25) < 0.1 || t * 10 % 1 < 0.1 && Math.abs(k) < r * 0.8) {
          col = [234, 179, 8];
        }
      } else if (cfg.modEssence === "sakura-oneiric") {
        if (Math.abs(uu) < 0.13) col = mixRgb(col, [248, 169, 208], 0.55);
        if (Math.sin(t * 34 + k * 1.1 + cfg.seed * 0.03) > 0.93) {
          col = mixRgb(col, [253, 207, 232], 0.75);
        }
      } else if (cfg.modEssence === "forge-master") {
        if (Math.abs(uu - 0.35) < 0.12) col = mixRgb(col, [245, 158, 11], 0.6);
        if (Math.abs(uu + 0.6) < 0.1) col = mixRgb(col, [249, 115, 22], 0.7);
      } else if (cfg.modEssence === "industrial") {
        if (Math.abs(uu - 0.3) < 0.1) col = mixRgb(col, [194, 152, 74], 0.66);
        if ((t * 5 + (anim.on ? anim.t * anim.TAU : 0)) % 1 < 0.08 && Math.abs(k) < r * 0.4) col = mixRgb(col, [30, 26, 22], 0.72);
      } else if (cfg.modEssence === "wildwood") {
        if (Math.sin(t * 24 + k * 2) > 0.55) col = mixRgb(col, [76, 125, 58], 0.58);
        if (rng() < 0.2) col = mixRgb(col, [168, 198, 148], 0.32);
      } else if (cfg.modEssence === "aquatic") {
        if (Math.abs(uu - 0.2) < 0.1) col = mixRgb(col, [94, 234, 212], 0.55);
        if (Math.sin(t * 32 + k * 1.5) > 0.92) col = mixRgb(col, WHITE, 0.55);
      } else if (cfg.modEssence === "masterwork") {
        if (Math.abs(uu) < 0.11) col = mixRgb(col, [232, 121, 249], 0.58);
        if (Math.abs(uu - 0.5) < 0.08) col = mixRgb(col, gemC, 0.4);
      }
      if (rng() < cfg.grain * 0.26) col = shadeRgb(col, rng() > 0.5 ? 0.09 : -0.12);
      if (cfg.dither && (Math.round(cx) + Math.round(cy)) % 2 === 0 && rng() < 0.3) col = shadeRgb(col, -0.07);
      if (cfg.finish === "glossy" && uu > 0.1 && uu < 0.5) col = mixRgb(col, WHITE, 0.26);
      else if (cfg.finish === "metallic") {
        if (uu > 0.5 && uu < 0.74) col = mixRgb(col, WHITE, 0.5);
        else if (uu < -0.5) col = shadeRgb(col, -0.12);
      } else if (cfg.finish === "enchanted" && rng() < 0.05) col = mixRgb(col, gemC, 0.45);
      else if (cfg.finish === "weathered" && rng() < 0.08) col = shadeRgb(col, -0.25);
      buf.blend(cx + perp[0] * k, cy + perp[1] * k, col, cov * 255);
    }
  }
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/render/fittings.ts
function drawOriented(c, cx, cy, len, wid, col0, glowMix) {
  const { buf, geo } = c;
  const { dir, perp, lightDot } = geo;
  for (let a = -len / 2; a <= len / 2; a += 0.5) {
    for (let k = -wid; k <= wid; k += 0.6) {
      const x = Math.round(cx + dir[0] * a + perp[0] * k);
      const y = Math.round(cy + dir[1] * a + perp[1] * k);
      const uu = wid > 0 ? k * lightDot / wid : 0;
      let col = uu > 0.4 ? shadeRgb(col0, 0.5) : uu > -0.1 ? col0 : uu > -0.6 ? shadeRgb(col0, -0.22) : shadeRgb(col0, -0.45);
      if (Math.abs(a) > len / 2 - 0.6) col = shadeRgb(col, -0.22);
      if (glowMix && Math.abs(k) < wid * 0.3 && Math.abs(a) < len * 0.2) col = mixRgb(glowMix, WHITE, 0.28);
      buf.set(x, y, col, 255);
    }
  }
}
function drawCollar(c) {
  const { cfg, buf, geo, pal, S, W, small, line } = c;
  if (cfg.collarStyle === "none") return;
  if (geo.shaftless && cfg.collarStyle !== "orb-cage" && cfg.collarStyle !== "bell-dome") return;
  const { collarPos: cp, collarLen, collarW, dir, perp } = geo;
  const { collarC, gemC } = pal;
  switch (cfg.collarStyle) {
    case "ring":
    case "claw":
      drawOriented(c, cp[0], cp[1], collarLen, collarW, collarC);
      drawOriented(c, cp[0] - dir[0] * collarLen * 0.9, cp[1] - dir[1] * collarLen * 0.9, collarLen * 0.5, collarW * 0.92, shadeRgb(collarC, -0.2));
      if (cfg.collarStyle === "claw" && !small) {
        for (const sd of [-1, 1]) {
          const bx = cp[0] + perp[0] * sd * collarW * 1.1, by = cp[1] + perp[1] * sd * collarW * 1.1;
          const tx = bx + perp[0] * sd * collarW * 0.9 - dir[0] * collarW * 0.5, ty = by + perp[1] * sd * collarW * 0.9 - dir[1] * collarW * 0.5;
          line(bx, by, tx, ty, collarW * 0.3, collarW * 0.06, collarC, shadeRgb(collarC, -0.35), shadeRgb(collarC, 0.5));
        }
      }
      break;
    case "guard":
      drawOriented(c, cp[0], cp[1], collarLen * 0.9, collarW * 1.7, collarC);
      for (const sd of [-1, 1]) {
        const gx = cp[0] + perp[0] * sd * collarW * 1.55, gy = cp[1] + perp[1] * sd * collarW * 1.55;
        buf.disc(gx, gy, Math.max(1 * S, W * 0.017), gemC);
        buf.blend(gx - 0.5, gy - 0.5, WHITE, 165);
      }
      break;
    case "crown":
      drawOriented(c, cp[0], cp[1], collarLen, collarW * 1.15, collarC);
      for (let i = -1; i <= 1; i++) {
        const bx = cp[0] + perp[0] * i * collarW * 0.62 + dir[0] * collarLen * 0.4;
        const by = cp[1] + perp[1] * i * collarW * 0.62 + dir[1] * collarLen * 0.4;
        const h = W * (i === 0 ? 0.05 : 0.038);
        const tx = bx + dir[0] * h, ty = by + dir[1] * h;
        line(bx, by, tx, ty, 1.1 * S, 0.3 * S, collarC, shadeRgb(collarC, -0.35), shadeRgb(collarC, 0.5));
        buf.disc(tx, ty, Math.max(0.8 * S, W * 0.012), mixRgb(gemC, WHITE, 0.35));
      }
      break;
    case "filigree":
      drawOriented(c, cp[0], cp[1], collarLen * 1.25, collarW * 1.1, collarC, gemC);
      for (let i = -2; i <= 2; i++) buf.blend(cp[0] + perp[0] * i * collarW * 0.42, cp[1] + perp[1] * i * collarW * 0.42, WHITE, 95);
      break;
    case "socket":
      drawOriented(c, cp[0], cp[1], collarLen * 0.7, collarW * 1.5, shadeRgb(collarC, -0.15));
      drawOriented(c, cp[0], cp[1], collarLen * 0.7, collarW * 0.9, collarC);
      for (const sd of [-1, 1]) {
        buf.disc(cp[0] + perp[0] * sd * collarW * 1.2, cp[1] + perp[1] * sd * collarW * 1.2, Math.max(1 * S, W * 0.02), mixRgb(gemC, WHITE, 0.2));
      }
      break;
    case "wing-guard": {
      drawOriented(c, cp[0], cp[1], collarLen * 0.85, collarW * 1.1, collarC);
      if (small) break;
      for (const sd of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const f = i / 2;
          const bx = cp[0] + perp[0] * sd * collarW * 0.7, by = cp[1] + perp[1] * sd * collarW * 0.7;
          const tx = bx + perp[0] * sd * collarW * (1.5 - f * 0.4) + dir[0] * collarLen * (0.3 + f * 0.7);
          const ty = by + perp[1] * sd * collarW * (1.5 - f * 0.4) + dir[1] * collarLen * (0.3 + f * 0.7);
          line(bx, by, tx, ty, collarW * (0.24 - f * 0.05), collarW * 0.05, collarC, shadeRgb(collarC, -0.4), shadeRgb(collarC, 0.55));
        }
      }
      break;
    }
    case "skull-collar": {
      drawOriented(c, cp[0], cp[1], collarLen * 0.7, collarW * 1.15, shadeRgb(collarC, -0.1));
      const sr = collarW * 0.95;
      for (let y = Math.floor(cp[1] - sr); y <= cp[1] + sr * 0.85; y++) {
        for (let x = Math.floor(cp[0] - sr); x <= cp[0] + sr; x++) {
          const d = Math.hypot(x - cp[0], y - cp[1]) / sr;
          if (d > 1) continue;
          buf.set(x, y, mixRgb(shadeRgb(collarC, 0.3), shadeRgb(collarC, -0.3), d), 255);
        }
      }
      buf.disc(cp[0] - sr * 0.36, cp[1] - sr * 0.1, sr * 0.2, INK);
      buf.disc(cp[0] + sr * 0.36, cp[1] - sr * 0.1, sr * 0.2, INK);
      buf.blend(cp[0] - sr * 0.36, cp[1] - sr * 0.1, gemC, 215);
      buf.blend(cp[0] + sr * 0.36, cp[1] - sr * 0.1, gemC, 215);
      break;
    }
    case "orb-cage": {
      drawOriented(c, cp[0], cp[1], collarLen * 0.6, collarW * 1.05, collarC);
      const cr = collarW * 1.5;
      buf.ring(cp[0], cp[1], cr, Math.max(0.8 * S, W * 0.012), collarC, 255);
      buf.ring(cp[0], cp[1], cr * 0.62, Math.max(0.7 * S, W * 0.01), shadeRgb(collarC, -0.25), 235);
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * Math.PI * 2 + Math.PI / 8;
        line(
          cp[0] + Math.cos(a) * cr,
          cp[1] + Math.sin(a) * cr,
          cp[0] - Math.cos(a) * cr,
          cp[1] - Math.sin(a) * cr,
          0.6 * S,
          0.6 * S,
          shadeRgb(collarC, 0.2),
          shadeRgb(collarC, -0.3),
          shadeRgb(collarC, 0.5),
          215
        );
      }
      buf.disc(cp[0], cp[1], cr * 0.42, mixRgb(gemC, WHITE, 0.35), 240);
      buf.blend(cp[0] - cr * 0.16, cp[1] - cr * 0.16, WHITE, 220);
      break;
    }
    case "tea-cup": {
      drawOriented(c, cp[0], cp[1], collarLen * 0.55, collarW * 0.9, shadeRgb(collarC, -0.18));
      const bw = collarW * 1.42, bh = collarW * 0.95;
      for (let y = Math.floor(cp[1] - bh * 0.42); y <= cp[1] + bh * 0.58; y++) {
        const f = (y - (cp[1] - bh * 0.42)) / bh;
        const half = bw * (0.55 + f * 0.45);
        for (let x = Math.floor(cp[0] - half); x <= cp[0] + half; x++) {
          const e = Math.abs(x - cp[0]) / Math.max(0.5, half);
          let col = mixRgb(shadeRgb(collarC, 0.42), shadeRgb(collarC, -0.35), e);
          if (e > 0.9) col = shadeRgb(col, -0.2);
          buf.set(x, y, col, 255);
        }
      }
      const surfY = cp[1] - bh * 0.12;
      for (let x = Math.floor(cp[0] - bw * 0.52); x <= cp[0] + bw * 0.52; x++) {
        const e = Math.abs(x - cp[0]) / (bw * 0.52);
        buf.set(x, surfY, mixRgb(gemC, pal.gem2, e * 0.75), 255);
        buf.set(x, surfY + S, shadeRgb(gemC, -0.25), 235);
      }
      for (let x = Math.floor(cp[0] - bw * 0.86); x <= cp[0] + bw * 0.86; x++) buf.set(x, cp[1] - bh * 0.45, mixRgb(collarC, WHITE, 0.42), 235);
      const lightProj = perp[0] * geo.LX + perp[1] * geo.LY;
      const hSide = lightProj > 0 ? -1 : 1;
      for (let i = -3; i <= 3; i++) {
        const ax = cp[0] + perp[0] * hSide * bw * 0.72, ay = cp[1] + i * bh * 0.13;
        buf.disc(ax, ay, bh * 0.1, mixRgb(collarC, WHITE, 0.25), 230);
      }
      for (let i = -2; i <= 2; i++) {
        const ax = cp[0] + perp[0] * hSide * (bw * 0.72 + bh * 0.1), ay = cp[1] + i * bh * 0.1;
        buf.set(ax, ay, [18, 14, 24], 200);
      }
      buf.blend(cp[0] - bw * 0.42, cp[1] - bh * 0.32, WHITE, 220);
      break;
    }
    case "bell-dome": {
      const dr = collarW * 1.55;
      for (let y = Math.floor(cp[1] - dr * 0.75); y <= cp[1] + dr * 0.35; y++) {
        const t = (y - (cp[1] - dr * 0.75)) / (dr * 1.1);
        const half = dr * Math.sin(Math.min(Math.PI / 2, t * Math.PI * 0.55 + 0.06));
        for (let x = Math.floor(cp[0] - half); x <= cp[0] + half; x++) {
          const e = Math.abs(x - cp[0]) / Math.max(0.5, half);
          let col = mixRgb(shadeRgb(collarC, 0.45), shadeRgb(collarC, -0.4), e * 0.8);
          if (e > 0.9) col = shadeRgb(col, -0.2);
          buf.set(x, y, col, 255);
        }
      }
      for (let x = Math.floor(cp[0] - dr); x <= cp[0] + dr; x++) {
        buf.set(x, cp[1] + dr * 0.35, mixRgb(collarC, WHITE, 0.3), 250);
        buf.set(x, cp[1] + dr * 0.42, shadeRgb(collarC, -0.28), 240);
      }
      buf.disc(cp[0], cp[1] - dr * 0.78, dr * 0.14, mixRgb(collarC, WHITE, 0.42), 245);
      line(cp[0], cp[1] + dr * 0.35, cp[0], cp[1] + dr * 0.62, 0.5 * S, 0.4 * S, collarC, shadeRgb(collarC, -0.3), WHITE, 235);
      buf.disc(cp[0], cp[1] + dr * 0.68, dr * 0.17, mixRgb(gemC, WHITE, 0.3), 245);
      buf.blend(cp[0] - dr * 0.05, cp[1] + dr * 0.62, WHITE, 215);
      buf.blend(cp[0] - dr * 0.42, cp[1] - dr * 0.52, WHITE, 225);
      break;
    }
  }
}
function drawPommel(c) {
  const { cfg, buf, geo, pal, S, W, line } = c;
  if (geo.shaftless) return;
  const { pomPos: pp, dir, perp, baseThick } = geo;
  const { pommelC, gemC, wrapC } = pal;
  const pr = Math.max(1.2 * S, baseThick * 0.72);
  switch (cfg.pommelStyle) {
    case "cap":
      buf.disc(pp[0], pp[1], pr * 1.05, pommelC);
      buf.disc(pp[0] + perp[0] * 0.7, pp[1] + perp[1] * 0.7, pr * 0.38, shadeRgb(pommelC, 0.5));
      break;
    case "gem": {
      const gr = pr * 1.35;
      for (let y = Math.floor(pp[1] - gr - 1); y <= pp[1] + gr + 1; y++) {
        for (let x = Math.floor(pp[0] - gr - 1); x <= pp[0] + gr + 1; x++) {
          const m = Math.abs(x - pp[0]) + Math.abs(y - pp[1]);
          if (m <= gr + 1 && m > gr) buf.set(x, y, pommelC, 255);
          else if (m <= gr) {
            const col = mixRgb(mixRgb(gemC, WHITE, 0.4), gemC, m / gr);
            buf.set(x, y, x < pp[0] ? shadeRgb(col, -0.15) : col, 255);
          }
        }
      }
      buf.blend(pp[0] - 0.6, pp[1] - 0.6, WHITE, 205);
      break;
    }
    case "spike":
      line(pp[0], pp[1], pp[0] - dir[0] * W * 0.055, pp[1] - dir[1] * W * 0.055, pr * 0.8, 0.3 * S, pommelC, shadeRgb(pommelC, -0.4), shadeRgb(pommelC, 0.5));
      break;
    case "ring": {
      const or = pr * 1.5, ir = pr * 0.75;
      for (let y = Math.floor(pp[1] - or); y <= pp[1] + or; y++) {
        for (let x = Math.floor(pp[0] - or); x <= pp[0] + or; x++) {
          const d = Math.hypot(x - pp[0], y - pp[1]);
          if (d <= or && d >= ir) buf.set(x, y, x > pp[0] ? shadeRgb(pommelC, 0.45) : shadeRgb(pommelC, -0.2), 255);
        }
      }
      break;
    }
    case "tassel":
      buf.disc(pp[0], pp[1], pr * 0.7, pommelC);
      for (let i = -1; i <= 1; i++) {
        const bx = pp[0] + perp[0] * i * 1.6 * S - dir[0] * S, by = pp[1] + perp[1] * i * 1.6 * S - dir[1] * S;
        const tx = bx - dir[0] * W * 0.05 + perp[0] * i * 1.2 * S, ty = by - dir[1] * W * 0.05 + perp[1] * i * 1.2 * S;
        line(bx, by, tx, ty, 0.8 * S, 0.5 * S, wrapC, shadeRgb(wrapC, -0.3), shadeRgb(wrapC, 0.3));
        buf.disc(tx, ty, 0.9 * S, gemC);
      }
      break;
    case "skullcap": {
      const sr = pr * 1.2;
      for (let y = Math.floor(pp[1] - sr - 1); y <= pp[1] + sr * 0.8; y++) {
        for (let x = Math.floor(pp[0] - sr - 1); x <= pp[0] + sr + 1; x++) {
          const d = Math.hypot(x - pp[0], y - pp[1]) / sr;
          if (d <= 1 && y < pp[1] + sr * 0.45) {
            let col = mixRgb(shadeRgb(pommelC, 0.2), shadeRgb(pommelC, -0.2), (y - (pp[1] - sr)) / (1.8 * sr));
            if (d > 0.88) col = shadeRgb(col, -0.3);
            buf.set(x, y, col, 255);
          }
        }
      }
      buf.disc(pp[0] - sr * 0.35, pp[1] - sr * 0.1, sr * 0.16, INK);
      buf.disc(pp[0] + sr * 0.35, pp[1] - sr * 0.1, sr * 0.16, INK);
      buf.blend(pp[0] - sr * 0.38, pp[1] - sr * 0.13, gemC, 200);
      buf.blend(pp[0] + sr * 0.33, pp[1] - sr * 0.13, gemC, 200);
      break;
    }
    case "orb": {
      const orr = pr * 1.4;
      for (let y = Math.floor(pp[1] - orr); y <= pp[1] + orr; y++) {
        for (let x = Math.floor(pp[0] - orr); x <= pp[0] + orr; x++) {
          const dx = x - pp[0], dy = y - pp[1];
          const d = Math.hypot(dx, dy) / orr;
          if (d > 1) continue;
          const uu = (dx * -0.7071 + dy * -0.7071) / orr;
          let col = mixRgb(mixRgb(gemC, WHITE, 0.4), gemC, d);
          if (uu > 0.35) col = mixRgb(col, WHITE, 0.3);
          if (d > 0.85) col = shadeRgb(col, -0.4);
          buf.set(x, y, col, 255);
        }
      }
      buf.blend(pp[0] - orr * 0.35, pp[1] - orr * 0.35, WHITE, 235);
      break;
    }
    case "crescent": {
      const cr = pr * 1.5, ox = cr * 0.52;
      for (let y = Math.floor(pp[1] - cr); y <= pp[1] + cr; y++) {
        for (let x = Math.floor(pp[0] - cr); x <= pp[0] + cr; x++) {
          const d1 = Math.hypot(x - pp[0], y - pp[1]) / cr;
          const d2 = Math.hypot(x - (pp[0] + ox), y - (pp[1] - cr * 0.2)) / (cr * 0.82);
          if (d1 > 1 || d2 < 1) continue;
          buf.set(x, y, mixRgb(shadeRgb(pommelC, 0.35), shadeRgb(pommelC, -0.3), d1), 255);
        }
      }
      break;
    }
    case "anchor": {
      const aw = pr * 1.5;
      for (let k = -aw; k <= aw; k += 0.5) {
        buf.set(pp[0] + perp[0] * k, pp[1] + perp[1] * k, k < 0 ? shadeRgb(pommelC, -0.25) : shadeRgb(pommelC, 0.4), 255);
      }
      line(pp[0], pp[1], pp[0] - dir[0] * aw * 1.3, pp[1] - dir[1] * aw * 1.3, pr * 0.42, pr * 0.3, pommelC, shadeRgb(pommelC, -0.35), shadeRgb(pommelC, 0.5));
      for (const sd of [-1, 1]) {
        const bx = pp[0] - dir[0] * aw * 1.1, by = pp[1] - dir[1] * aw * 1.1;
        const tx = bx + perp[0] * sd * aw * 0.95 - dir[0] * aw * 0.1;
        const ty = by + perp[1] * sd * aw * 0.95 - dir[1] * aw * 0.1;
        line(bx, by, tx, ty, pr * 0.4, pr * 0.1, pommelC, shadeRgb(pommelC, -0.35), shadeRgb(pommelC, 0.5));
      }
      buf.disc(pp[0], pp[1], pr * 0.34, mixRgb(gemC, WHITE, 0.3));
      break;
    }
    case "split-tassel": {
      buf.disc(pp[0], pp[1], pr * 0.85, mixRgb(pommelC, WHITE, 0.18), 245);
      const cordLen = W * 0.085;
      for (const sd of [-1, 1]) {
        const bx2 = pp[0] + perp[0] * sd * pr * 0.32, by2 = pp[1] + perp[1] * sd * pr * 0.32;
        let lx = bx2, ly = by2;
        for (let i = 0; i < 4; i++) {
          const t = (i + 1) / 4;
          const tx = bx2 + perp[0] * sd * (0.2 + t * 0.5) * cordLen, ty = by2 + dir[0] * 0 + cordLen * t * 0.88 - perp[1] * Math.abs(Math.sin(t * Math.PI)) * cordLen * 0.12;
          line(lx, ly, tx, ty, pr * (0.24 - t * 0.12), pr * (0.2 - t * 0.1), wrapC, shadeRgb(wrapC, -0.32), mixRgb(wrapC, WHITE, 0.32), 245);
          lx = tx;
          ly = ty;
        }
        for (let i = 0; i < 5; i++) {
          line(lx, ly, lx + perp[0] * (i - 2) * W * 6e-3, ly + W * 0.014 * (i % 2 ? 1.2 : 1), 0.55 * S, 0.35 * S, shadeRgb(wrapC, 0.2), wrapC, WHITE, 235);
        }
        buf.disc(lx, ly + W * 0.012, Math.max(0.55 * S, pr * 0.09), mixRgb(wrapC, WHITE, 0.35), 235);
      }
      break;
    }
    case "lantern-hanger": {
      const cordLen = W * 0.105;
      const glide = (i, t) => [
        pp[0] + Math.sin(i * 0.8 + cfg.seed * 0.01) * W * 4e-3 + dir[0] * -cordLen * t * 0.24,
        pp[1] + cordLen * t * 0.68
      ];
      let prev = glide(0, 0);
      for (let i = 1; i <= 6; i++) {
        const cur = glide(i, i / 6);
        line(prev[0], prev[1], cur[0], cur[1], 0.55 * S, 0.38 * S, pommelC, shadeRgb(pommelC, -0.35), WHITE, 235);
        if (i % 2 === 0) buf.disc(cur[0], cur[1], Math.max(0.55 * S, pr * 0.06), pommelC, 225);
        prev = cur;
      }
      const lx = prev[0], ly = prev[1] + cordLen * 0.1;
      const lw2 = pr * 1.45;
      for (let y = Math.floor(ly - lw2 * 0.7); y <= ly + lw2 * 0.85; y++) {
        const f = (y - (ly - lw2 * 0.7)) / (lw2 * 1.55);
        const half = lw2 * (0.3 + Math.sin(Math.min(Math.PI, f * Math.PI)) * 0.85);
        for (let x = Math.floor(lx - half); x <= lx + half; x++) {
          const e = Math.abs(x - lx) / Math.max(0.5, half);
          let col = mixRgb(mixRgb(gemC, WHITE, 0.36), shadeRgb(gemC, -0.46), e * 0.78);
          if (Math.abs(x - lx) < half * 0.22 && f > 0.28 && f < 0.72) col = mixRgb(col, mixRgb(gemC, WHITE, 0.5), 0.72);
          if (e > 0.9) col = shadeRgb(col, -0.22);
          buf.set(x, y, col, 255);
        }
      }
      buf.disc(lx, ly, lw2 * 0.2, mixRgb(gemC, WHITE, 0.52), 240);
      buf.blend(lx - lw2 * 0.03, ly - lw2 * 0.04, WHITE, 235);
      for (let x = Math.floor(lx - lw2 * 0.55); x <= lx + lw2 * 0.55; x++) {
        buf.set(x, ly - lw2 * 0.72, mixRgb(pommelC, WHITE, 0.32), 235);
        buf.set(x, ly + lw2 * 0.86, shadeRgb(pommelC, -0.28), 240);
      }
      line(lx - lw2 * 0.5, ly - lw2 * 0.8, lx + lw2 * 0.5, ly - lw2 * 0.8, 0.55 * S, 0.35 * S, pommelC, shadeRgb(pommelC, -0.3), WHITE, 232);
      buf.blend(lx - lw2 * 0.42, ly - lw2 * 0.42, WHITE, 218);
      break;
    }
  }
}
function drawDangles(c) {
  const { cfg, buf, geo, pal, S, W, small, line, rng } = c;
  const style = cfg.dangleStyle ?? "none";
  const count = cfg.dangleCount ?? 2;
  if (style === "none" || count <= 0 || small) return;
  const { collarPos: cp, dir, perp, shaftless, headR } = geo;
  const collarW = shaftless ? headR * 0.62 : geo.collarW;
  const { collarC, gemC, gem2, wrapC } = pal;
  const dropLen = W * (shaftless ? 0.16 : 0.1);
  for (let i = 0; i < count; i++) {
    const off = (i - (count - 1) / 2) * collarW * 1.15;
    const ax = cp[0] + perp[0] * off - dir[0] * collarW * 0.4;
    const ay = cp[1] + perp[1] * off - dir[1] * collarW * 0.4;
    const sway = (rng() - 0.5) * W * 0.02;
    const ex = ax + sway, ey = ay + dropLen;
    switch (style) {
      case "ribbon": {
        for (let q = 0; q <= 14; q++) {
          const t = q / 14;
          const x = ax + sway * t + Math.sin(t * Math.PI * 1.6 + i) * W * 0.012;
          const y = ay + dropLen * t;
          const col = mixRgb(wrapC, WHITE, Math.sin(t * Math.PI) * 0.35);
          buf.disc(x, y, Math.max(0.6 * S, W * 9e-3 * (1 - t * 0.25)), col, 250);
        }
        break;
      }
      case "chain-charm": {
        const links = 5;
        for (let q = 0; q < links; q++) {
          const t = q / links;
          const y = ay + dropLen * t;
          buf.ring(
            ax + sway * t,
            y,
            Math.max(0.8 * S, W * 0.011),
            Math.max(0.5 * S, W * 5e-3),
            q % 2 ? shadeRgb(collarC, -0.2) : collarC,
            245
          );
        }
        buf.disc(ex, ey, Math.max(1 * S, W * 0.017), mixRgb(gemC, WHITE, 0.3));
        buf.blend(ex - 0.6, ey - 0.6, WHITE, 205);
        break;
      }
      case "bell": {
        line(ax, ay, ex, ey - W * 0.02, 0.5 * S, 0.5 * S, collarC, shadeRgb(collarC, -0.3), shadeRgb(collarC, 0.4), 235);
        const br = W * 0.022;
        for (let y = Math.floor(ey - br); y <= ey + br * 0.7; y++) {
          const f = (y - (ey - br)) / (br * 1.7);
          const hw2 = br * (0.32 + 0.68 * f);
          for (let x = Math.floor(ex - hw2); x <= ex + hw2; x++) {
            const e = Math.abs(x - ex) / Math.max(0.4, hw2);
            buf.set(x, y, mixRgb(shadeRgb(collarC, 0.4), shadeRgb(collarC, -0.35), e * 0.85), 255);
          }
        }
        buf.disc(ex, ey + br * 0.85, Math.max(0.6 * S, br * 0.3), shadeRgb(collarC, -0.45));
        break;
      }
      case "feather": {
        line(ax, ay, ex, ey, 0.5 * S, 0.4 * S, collarC, collarC, collarC, 210);
        for (let q = 0; q < 8; q++) {
          const t = q / 8;
          const y = ey + t * W * 0.05;
          const spread = W * 0.016 * Math.sin((1 - t) * Math.PI);
          for (const sd of [-1, 1]) {
            line(
              ex,
              y,
              ex + sd * spread,
              y - spread * 0.4,
              0.5 * S,
              0.35 * S,
              mixRgb(pal.wingC, gem2, t * 0.4),
              shadeRgb(pal.wingC, -0.3),
              WHITE,
              235
            );
          }
        }
        break;
      }
      case "crystal-drop": {
        line(ax, ay, ex, ey - W * 0.018, 0.5 * S, 0.45 * S, collarC, shadeRgb(collarC, -0.3), shadeRgb(collarC, 0.45), 235);
        const dr = W * 0.02;
        for (let y = Math.floor(ey - dr); y <= ey + dr * 1.5; y++) {
          for (let x = Math.floor(ex - dr); x <= ex + dr; x++) {
            const m = Math.abs(x - ex) / dr + Math.abs(y - ey) / (dr * 1.5);
            if (m > 1) continue;
            let col = mixRgb(mixRgb(gem2, WHITE, 0.45), gemC, m);
            if (x < ex) col = shadeRgb(col, -0.18);
            buf.set(x, y, col, 255);
          }
        }
        buf.blend(ex - dr * 0.3, ey - dr * 0.3, WHITE, 240);
        break;
      }
      case "beads": {
        const n = 4;
        for (let q = 0; q < n; q++) {
          const t = (q + 1) / n;
          const bx = ax + sway * t, by = ay + dropLen * t;
          const col = q % 2 ? mixRgb(gemC, WHITE, 0.25) : mixRgb(gem2, WHITE, 0.15);
          buf.disc(bx, by, Math.max(0.8 * S, W * 0.012), col);
          buf.blend(bx - 0.5, by - 0.5, WHITE, 180);
        }
        break;
      }
      case "talisman-tag": {
        line(ax, ay, ex, ey - W * 0.016, 0.5 * S, 0.45 * S, wrapC, shadeRgb(wrapC, -0.3), shadeRgb(wrapC, 0.35), 230);
        const tw2 = W * 0.018, th2 = W * 0.026;
        for (let y = Math.floor(ey - th2 * 0.4); y <= ey + th2; y++) {
          for (let x = Math.floor(ex - tw2); x <= ex + tw2; x++) {
            const pointed = y > ey + th2 * 0.5 && Math.abs(x - ex) > tw2 * (1 - (y - (ey + th2 * 0.5)) / (th2 * 0.5));
            if (pointed) continue;
            buf.set(x, y, mixRgb([236, 226, 198], [176, 158, 120], Math.abs(x - ex) / tw2 * 0.6), 255);
          }
        }
        line(ex, ey + th2 * 0.05, ex, ey + th2 * 0.6, 0.6 * S, 0.6 * S, gemC, gemC, gemC, 235);
        line(ex - tw2 * 0.5, ey + th2 * 0.28, ex + tw2 * 0.5, ey + th2 * 0.28, 0.6 * S, 0.6 * S, gemC, gemC, gemC, 235);
        break;
      }
    }
  }
}
function drawProngs(c) {
  const { cfg, buf, geo, pal, S, W, small } = c;
  if (cfg.prongs <= 0 || small) return;
  const { collarPos: cp, collarLen, collarW, dir, perp, headC, headR } = geo;
  const w = Math.max(0.8 * S, W * 0.013);
  for (let i = 0; i < cfg.prongs; i++) {
    const off = (i - (cfg.prongs - 1) / 2) * collarW * 0.78;
    const bx = cp[0] + perp[0] * off + dir[0] * collarLen * 0.4;
    const by = cp[1] + perp[1] * off + dir[1] * collarLen * 0.4;
    const tx = headC[0] - dir[0] * headR * 0.85 + perp[0] * off * 1.1;
    const ty = headC[1] - dir[1] * headR * 0.85 + perp[1] * off * 1.1;
    const mx = (bx + tx) / 2 + perp[0] * off * 0.35 - dir[0] * headR * 0.1;
    const my = (by + ty) / 2 + perp[1] * off * 0.35 - dir[1] * headR * 0.1;
    for (let q = 0; q <= 16; q++) {
      const t = q / 16;
      const x = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * mx + t * t * tx;
      const y = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * my + t * t * ty;
      buf.disc(x, y, w * (1 - t * 0.35), pal.prongC);
      buf.blend(x - 0.4, y - 0.4, WHITE, 75);
    }
    buf.disc(tx, ty, w * 1.15, shadeRgb(pal.prongC, 0.45));
  }
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/render/gems.ts
function drawFacetRay(c, center, radius, angle, alpha = 140) {
  const { line, pal, S } = c;
  const [cx, cy] = center;
  const x0 = cx + Math.cos(angle) * radius * 0.15;
  const y0 = cy + Math.sin(angle) * radius * 0.15;
  const x1 = cx + Math.cos(angle) * radius * 0.92;
  const y1 = cy + Math.sin(angle) * radius * 0.92;
  line(
    x0,
    y0,
    x1,
    y1,
    Math.max(0.35 * S, radius * 0.018),
    Math.max(0.25 * S, radius * 0.01),
    mixRgb(pal.gem2, WHITE, 0.55),
    shadeRgb(pal.gemC, -0.16),
    WHITE,
    alpha
  );
}
function cutOverlay(c) {
  const { cfg, buf, geo, pal, S, line } = c;
  const { headC: center, headR: radius } = geo;
  const { gemC, gem2 } = pal;
  if (radius < 3 * S) return;
  switch (cfg.gemCut ?? "brilliant") {
    case "brilliant":
      for (let i = 0; i < 8; i++) drawFacetRay(c, center, radius, i / 8 * Math.PI * 2 + Math.PI / 8, 145);
      buf.disc(center[0], center[1], radius * 0.11, mixRgb(gem2, WHITE, 0.7), 210);
      break;
    case "emerald": {
      const r = radius * 0.68, chamfer = r * 0.25;
      const pts = [
        [center[0] - r + chamfer, center[1] - r],
        [center[0] + r - chamfer, center[1] - r],
        [center[0] + r, center[1] - r + chamfer],
        [center[0] + r, center[1] + r - chamfer],
        [center[0] + r - chamfer, center[1] + r],
        [center[0] - r + chamfer, center[1] + r],
        [center[0] - r, center[1] + r - chamfer],
        [center[0] - r, center[1] - r + chamfer]
      ];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        line(ax, ay, bx, by, 0.7 * S, 0.7 * S, mixRgb(gem2, WHITE, 0.5), gemC, WHITE, 195);
      }
      line(center[0] - r * 0.5, center[1], center[0] + r * 0.5, center[1], 0.7 * S, 0.5 * S, gem2, gemC, WHITE, 150);
      line(center[0], center[1] - r * 0.5, center[0], center[1] + r * 0.5, 0.7 * S, 0.5 * S, gem2, gemC, WHITE, 150);
      break;
    }
    case "marquise":
      for (const a of [-Math.PI / 2, Math.PI / 2]) {
        const x0 = center[0] + Math.cos(a) * radius * 0.95, y0 = center[1] + Math.sin(a) * radius * 0.95;
        for (let i = -2; i <= 2; i++) {
          const x1 = center[0] + Math.cos(a + Math.PI + i * 0.2) * radius * 0.75;
          const y1 = center[1] + Math.sin(a + Math.PI + i * 0.2) * radius * 0.75;
          line(x0, y0, x1, y1, 0.5 * S, 0.4 * S, mixRgb(gem2, WHITE, 0.55), gemC, WHITE, 155);
        }
      }
      break;
    case "cabochon":
      for (let y = Math.floor(center[1] - radius * 0.72); y <= center[1] - radius * 0.18; y++) {
        for (let x = Math.floor(center[0] - radius * 0.6); x <= center[0] - radius * 0.08; x++) {
          const d = ((x - (center[0] - radius * 0.32)) / (radius * 0.36)) ** 2 + ((y - (center[1] - radius * 0.48)) / (radius * 0.15)) ** 2;
          if (d < 1) buf.blend(x, y, WHITE, (1 - d) * 165);
        }
      }
      buf.blend(center[0] + radius * 0.2, center[1] + radius * 0.55, gem2, 70);
      break;
    case "star-cut":
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        drawFacetRay(c, center, radius, a, i % 2 === 0 ? 210 : 110);
      }
      buf.disc(center[0], center[1], radius * 0.17, WHITE, 235);
      break;
    case "opal": {
      const hues = [gem2, [255, 160, 220], [100, 245, 230], [255, 225, 140]];
      const step = Math.max(2, Math.round(S * 1.15));
      for (let y = center[1] - radius * 0.72; y <= center[1] + radius * 0.72; y += step) {
        for (let x = center[0] - radius * 0.72; x <= center[0] + radius * 0.72; x += step) {
          if (Math.hypot(x - center[0], y - center[1]) > radius * 0.72) continue;
          const h = (Math.floor((x + cfg.seed) / step) * 7 + Math.floor((y - cfg.seed) / step) * 11) % hues.length;
          buf.blend(x, y, hues[(h + hues.length) % hues.length], 110);
          if ((Math.floor(x + y) + cfg.seed) % 3 === 0) buf.blend(x + S, y, WHITE, 90);
        }
      }
      break;
    }
    case "prism":
      for (let y = center[1] - radius * 0.8; y <= center[1] + radius * 0.8; y += Math.max(2, S * 1.25)) {
        const shift = Math.sin((y - center[1]) / radius * Math.PI) * radius * 0.45;
        const col = y < center[1] - radius * 0.25 ? [248, 113, 113] : y < center[1] ? [250, 204, 21] : y < center[1] + radius * 0.25 ? [74, 222, 128] : [96, 165, 250];
        line(center[0] - shift, y, center[0] + shift, y, 0.6 * S, 0.6 * S, col, col, WHITE, 125);
      }
      break;
    case "rose-cut":
      for (let i = 1; i <= 4; i++) {
        buf.ring(
          center[0],
          center[1],
          radius * (i * 0.16),
          Math.max(0.45 * S, radius * 0.012),
          i % 2 ? mixRgb(gem2, WHITE, 0.55) : shadeRgb(gemC, -0.12),
          145
        );
      }
      for (let i = 0; i < 6; i++) drawFacetRay(c, center, radius * 0.82, i / 6 * Math.PI * 2, 110);
      break;
  }
}
function drawPrimaryMount(c) {
  const { cfg, buf, geo, pal, S, W, line } = c;
  const { headC: center, headR: r } = geo;
  const { collarC, gemC, gem2 } = pal;
  const width = Math.max(0.7 * S, W * 9e-3);
  switch (cfg.gemMount ?? "claw") {
    case "claw": {
      const count = cfg.rarity === "divine" || cfg.rarity === "mythic" ? 6 : 4;
      for (let i = 0; i < count; i++) {
        const a = i / count * Math.PI * 2 + Math.PI / 4;
        const bx = center[0] + Math.cos(a) * r * 1.12, by = center[1] + Math.sin(a) * r * 1.12;
        const mx = center[0] + Math.cos(a) * r * 0.92, my = center[1] + Math.sin(a) * r * 0.92;
        const tx = center[0] + Math.cos(a) * r * 0.72, ty = center[1] + Math.sin(a) * r * 0.72;
        line(bx, by, mx, my, width * 2.1, width * 1.35, collarC, shadeRgb(collarC, -0.35), mixRgb(collarC, WHITE, 0.45), 245);
        line(mx, my, tx, ty, width * 1.35, width * 0.5, collarC, shadeRgb(collarC, -0.3), WHITE, 250);
        buf.disc(bx, by, width * 0.85, mixRgb(gem2, WHITE, 0.35), 240);
      }
      break;
    }
    case "bezel":
      buf.ring(center[0], center[1], r * 1.06, width * 1.8, shadeRgb(collarC, -0.16), 245);
      buf.ring(center[0], center[1], r * 1.06, width * 0.68, mixRgb(collarC, WHITE, 0.45), 225);
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        buf.disc(
          center[0] + Math.cos(a) * r * 1.07,
          center[1] + Math.sin(a) * r * 1.07,
          Math.max(0.55 * S, width * 0.55),
          gemC,
          210
        );
      }
      break;
    case "cage":
      buf.ring(center[0], center[1], r * 1.12, width, collarC, 220);
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * Math.PI + Math.PI / 4;
        line(
          center[0] + Math.cos(a) * r * 1.05,
          center[1] + Math.sin(a) * r * 1.05,
          center[0] - Math.cos(a) * r * 1.05,
          center[1] - Math.sin(a) * r * 1.05,
          width * 0.72,
          width * 0.72,
          collarC,
          shadeRgb(collarC, -0.25),
          mixRgb(collarC, WHITE, 0.4),
          215
        );
      }
      break;
    case "floating":
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * Math.PI * 2;
        const cx = center[0] + Math.cos(a) * r * 1.32, cy = center[1] + Math.sin(a) * r * 1.32;
        buf.disc(cx, cy, width * 1.5, collarC, 230);
        line(
          cx,
          cy,
          center[0] + Math.cos(a) * r * 0.88,
          center[1] + Math.sin(a) * r * 0.88,
          width * 0.5,
          width * 0.35,
          mixRgb(gem2, WHITE, 0.5),
          gem2,
          WHITE,
          125
        );
      }
      break;
    case "halo":
      buf.ring(center[0], center[1], r * 1.22, width, mixRgb(collarC, WHITE, 0.3), 220);
      break;
    case "petal":
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        const px = center[0] + Math.cos(a) * r * 1.05, py = center[1] + Math.sin(a) * r * 1.05;
        buf.disc(px, py, r * 0.2, mixRgb(collarC, WHITE, 0.2), 230);
        buf.blend(px, py, gem2, 150);
      }
      break;
  }
}
function drawSecondaryGems(c) {
  const { cfg, buf, geo, pal, S, line } = c;
  const { headC, headR, perp, collarPos } = geo;
  const count = Math.max(0, Math.min(8, cfg.gemCount ?? 0));
  if (count <= 0) return;
  const scale = headR * (cfg.gemScale ?? 0.16);
  const gold = pal.collarC;
  for (let i = 0; i < count; i++) {
    const a = i / count * Math.PI * 2 + Math.PI / 4;
    const r = headR * (1.22 + i % 2 * 0.13);
    const x = headC[0] + Math.cos(a) * r;
    const y = headC[1] + Math.sin(a) * r * 0.84;
    const anchorX = headC[0] + Math.cos(a) * headR * 0.82;
    const anchorY = headC[1] + Math.sin(a) * headR * 0.82;
    if (cfg.gemMount === "floating") {
      line(anchorX, anchorY, x, y, 0.55 * S, 0.35 * S, pal.gem2, gold, WHITE, 155);
    } else {
      line(
        collarPos[0] + perp[0] * (i - (count - 1) / 2) * geo.collarW * 0.35,
        collarPos[1] + perp[1] * (i - (count - 1) / 2) * geo.collarW * 0.35,
        x,
        y,
        0.65 * S,
        0.35 * S,
        gold,
        shadeRgb(gold, -0.25),
        mixRgb(gold, WHITE, 0.45),
        210
      );
    }
    const cuts = [cfg.gemCut ?? "brilliant", "emerald", "marquise", "rose-cut", "star-cut", "opal", "prism", "cabochon"];
    paintFaceted(c, x, y, scale, cuts[i % cuts.length], i);
    const mount = cfg.gemMount ?? "claw";
    const mountWidth = Math.max(0.45 * S, scale * 0.12);
    if (mount === "bezel") {
      buf.ring(x, y, scale * 1.12, mountWidth * 1.45, shadeRgb(gold, -0.12), 240);
      buf.ring(x, y, scale * 1.12, mountWidth * 0.48, mixRgb(gold, WHITE, 0.48), 220);
      for (let k = 0; k < 8; k++) {
        const aa = k / 8 * Math.PI * 2;
        buf.disc(x + Math.cos(aa) * scale * 1.12, y + Math.sin(aa) * scale * 1.12, mountWidth * 0.42, WHITE, 200);
      }
    } else if (mount === "cage") {
      buf.ring(x, y, scale * 1.18, mountWidth, gold, 225);
      for (let k = 0; k < 3; k++) {
        const aa = k / 3 * Math.PI;
        line(
          x + Math.cos(aa) * scale * 1.12,
          y + Math.sin(aa) * scale * 1.12,
          x - Math.cos(aa) * scale * 1.12,
          y - Math.sin(aa) * scale * 1.12,
          mountWidth * 0.58,
          mountWidth * 0.42,
          gold,
          shadeRgb(gold, -0.28),
          WHITE,
          210
        );
      }
    } else if (mount === "halo") {
      buf.ring(x, y, scale * 1.2, mountWidth * 0.65, pal.glowC, 210);
      buf.ring(x, y, scale * 1.06, mountWidth * 0.32, WHITE, 155);
      for (let k = 0; k < 4; k++) {
        const aa = k / 4 * Math.PI * 2 + Math.PI / 4;
        buf.disc(x + Math.cos(aa) * scale * 1.24, y + Math.sin(aa) * scale * 1.24, mountWidth * 0.6, gold, 230);
      }
    } else if (mount === "petal") {
      for (let k = 0; k < 6; k++) {
        const aa = k / 6 * Math.PI * 2;
        const px = x + Math.cos(aa) * scale * 1.02, py = y + Math.sin(aa) * scale * 1.02;
        buf.disc(px, py, scale * 0.22, mixRgb(gold, WHITE, 0.22), 220);
        buf.disc(px, py, scale * 0.1, pal.gem2, 190);
      }
    } else if (mount === "claw") {
      buf.ring(x, y, scale * 1.12, mountWidth * 0.42, shadeRgb(gold, -0.16), 205);
      for (let k = 0; k < 4; k++) {
        const aa = k / 4 * Math.PI * 2 + Math.PI / 4;
        const bx = x + Math.cos(aa) * scale * 1.26, by = y + Math.sin(aa) * scale * 1.26;
        const tx = x + Math.cos(aa) * scale * 0.72, ty = y + Math.sin(aa) * scale * 0.72;
        line(bx, by, tx, ty, mountWidth * 0.85, mountWidth * 0.28, gold, shadeRgb(gold, -0.3), mixRgb(gold, WHITE, 0.5), 245);
      }
    } else {
      buf.ring(x, y, scale * 1.12, mountWidth, gold, 220);
    }
  }
}
function paintFaceted(c, cx, cy, r, shape, salt = 0) {
  const { buf, pal, edgeDarken } = c;
  if (r < 0.5) return;
  for (let y = Math.floor(cy - r * 1.25 - 1); y <= cy + r * 1.25 + 1; y++) {
    for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const dx = (x - cx) / r, dy = (y - cy) / (r * 1.25);
      const d = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      let inside = d <= 1;
      if (shape === "diamond" || shape === "brilliant") inside = Math.abs(dx) + Math.abs(dy) * 0.75 <= 1;
      else if (shape === "marquise") inside = d <= 0.94 && Math.abs(dx) <= 0.7 + 0.3 * Math.abs(dy);
      else if (shape === "emerald") inside = Math.max(Math.abs(dx), Math.abs(dy)) <= 0.93 && Math.abs(dx) + Math.abs(dy) <= 1.62;
      else if (shape === "star-cut") {
        const rr = 0.48 + 0.52 * Math.pow(0.5 + 0.5 * Math.cos(5 * a - Math.PI / 2), 0.45);
        inside = d <= rr;
      } else if (shape === "cabochon" || shape === "opal" || shape === "rose-cut" || shape === "round") inside = d <= 0.94;
      else if (shape === "prism") inside = Math.abs(dx) * 0.82 + Math.abs(dy) <= 1;
      if (!inside) continue;
      const facet = Math.floor((a + Math.PI + salt * 0.2) / (Math.PI * 2) * 6) % 6;
      const light = clamp01((-dx - dy) * 0.36 + 0.48);
      let col = mixRgb(shadeRgb(pal.gemC, -0.38), mixRgb(pal.gemC, WHITE, 0.38), light);
      if (shape === "emerald") {
        const step = Math.floor((Math.abs(dx) * 2 + Math.abs(dy) * 1.3 + salt * 0.13) * 3) % 3;
        if (step === 0) col = mixRgb(col, pal.gem2, 0.22);
        if (Math.abs(dx) > 0.68 || Math.abs(dy) > 0.67) col = shadeRgb(col, 0.12);
        if (Math.abs(dx) > 0.89 || Math.abs(dy) > 0.88) col = shadeRgb(col, -0.24);
      } else if (shape === "cabochon" || shape === "round") {
        const spec = ((dx + 0.36) / 0.32) ** 2 + ((dy + 0.42) / 0.2) ** 2;
        if (spec < 1) col = mixRgb(col, WHITE, (1 - spec) * 0.7);
        col = mixRgb(col, shadeRgb(pal.gemC, -0.28), smoothstep(0.58, 0.96, d) * 0.72);
      } else if (shape === "opal") {
        const tile = (Math.floor((x + salt * 7) / Math.max(1, c.S)) * 13 + Math.floor((y - salt * 5) / Math.max(1, c.S)) * 7) % 4;
        const flash = [pal.gem2, [250, 150, 214], [96, 231, 224], [255, 220, 132]];
        col = mixRgb(col, flash[(tile + 4) % 4], tile === 0 ? 0.58 : 0.19);
      } else if (shape === "rose-cut") {
        const ring = Math.floor(d * 6 + salt) % 2;
        if (ring === 0) col = mixRgb(col, WHITE, 0.28);
        if (d > 0.68) col = shadeRgb(col, -0.14);
      } else if (shape === "prism") {
        const bands = [[255, 112, 126], [255, 210, 90], [94, 226, 151], [96, 165, 250]];
        const bi = Math.min(3, Math.floor((dy + 1) * 2));
        col = mixRgb(col, bands[bi], 0.36);
      } else if (shape === "star-cut") {
        col = mixRgb(col, WHITE, (0.5 + 0.5 * Math.cos(a * 5 + salt)) * 0.28);
      } else {
        col = facet % 3 === 0 ? mixRgb(col, WHITE, 0.28) : facet % 3 === 2 ? shadeRgb(col, -0.18) : col;
      }
      if (dy < -0.15) col = mixRgb(col, pal.gem2, 0.13);
      if (d > 0.82) col = edgeDarken(col, 0.75);
      buf.set(x, y, col, 255);
    }
  }
  buf.blend(cx - r * 0.3, cy - r * 0.45, WHITE, 240);
}
function drawGemSettings(c) {
  cutOverlay(c);
  drawPrimaryMount(c);
  drawSecondaryGems(c);
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/render/head.ts
function paintOrb(c, cx, cy, r, c1, c2) {
  const { cfg, buf, rng, anim, S, geo, pal, edgeDarken } = c;
  const { LX, LY } = geo;
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) {
    for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const dx = x - cx, dy = y - cy;
      const d = Math.hypot(dx, dy) / r;
      if (d > 1) continue;
      const uu = r > 0 ? (dx * LX + dy * LY) / r : 0;
      let col = d < 0.55 ? mixRgb(mixRgb(c1, WHITE, 0.45), c1, smoothstep(0, 0.55, d)) : mixRgb(c1, pal.gemDark, smoothstep(0.55, 1, d));
      if (uu > 0.45) col = mixRgb(col, WHITE, 0.2 * smoothstep(0.45, 0.95, uu));
      if (cfg.innerStyle === "core" && d < 0.34) col = mixRgb(WHITE, c2, d / 0.34 * 0.65);
      else if (cfg.innerStyle === "facet") {
        if (Math.abs(dx) < Math.max(1 * S, r * 0.06) || Math.abs(dy) < Math.max(1 * S, r * 0.06)) col = mixRgb(col, WHITE, 0.3);
        if (dx > 0 !== dy > 0) col = shadeRgb(col, -0.1);
      } else if (cfg.innerStyle === "swirl" && d < 0.9) {
        const a = Math.atan2(dy, dx) + anim.spinA;
        col = mixRgb(col, c2, (0.5 + 0.5 * Math.sin(a * 3 + d * 9 + cfg.seed * 0.01)) * 0.35 * (1 - d) * (anim.on && anim.type === "spin-gem" ? 0.9 : 1));
      } else if (cfg.innerStyle === "galaxy" && d < 0.85) {
        const a = Math.atan2(dy, dx) + anim.spinA * 0.7;
        col = mixRgb(col, c2, (0.5 + 0.5 * Math.sin(a * 2 + d * 6)) * 0.4 * (1 - d));
        if (rng() < 0.035) col = WHITE;
      }
      col = mixRgb(col, c2, cfg.gemGlow * 0.22 * (1 - d));
      if (d > 0.86) col = edgeDarken(col, 1);
      if (cfg.dither && (x + y) % 2 === 0 && d > 0.3 && d < 0.85 && rng() < 0.25) col = shadeRgb(col, -0.08);
      buf.set(x, y, col, 255);
    }
  }
  const hlR = r * 0.3;
  for (let y = Math.floor(cy - r * 0.62); y <= cy - r * 0.1; y++) {
    for (let x = Math.floor(cx - r * 0.6); x <= cx - r * 0.05; x++) {
      const dd = ((x - (cx - r * 0.32)) / hlR) ** 2 + ((y - (cy - r * 0.36)) / (hlR * 0.62)) ** 2;
      if (dd <= 1) buf.blend(x, y, WHITE, 235 * (1 - dd * 0.7));
    }
  }
  buf.blend(cx + r * 0.3, cy + r * 0.34, WHITE, 115);
  if (r > 8) buf.blend(cx + r * 0.3 + 1, cy + r * 0.34, WHITE, 70);
}
function paintCrystal(c, cx, cy, r, c1, c2, shear = 0) {
  const { cfg, buf, S, edgeDarken } = c;
  const w = r * 0.72, h = r * 1.18;
  for (let y = Math.floor(cy - h - 1); y <= cy + h + 1; y++) {
    for (let x = Math.floor(cx - w - 2); x <= cx + w + 2; x++) {
      const dx = x - cx - (y - cy) * shear, dy = y - cy;
      const m = Math.abs(dx) / w + Math.abs(dy) / h;
      if (m > 1) continue;
      let col = dx < -w * 0.08 ? shadeRgb(c1, -0.3 + 0.1 * (1 - m)) : dx > w * 0.08 ? shadeRgb(c1, 0.2) : mixRgb(c1, c2, 0.5);
      col = dy < 0 ? mixRgb(col, WHITE, 0.16 * (1 - m)) : shadeRgb(col, 0.12 * m);
      if (Math.abs(dx) < Math.max(0.8 * S, w * 0.09)) col = mixRgb(col, WHITE, 0.45);
      if (Math.abs(dy) < Math.max(0.8 * S, h * 0.05) && m < 0.8) col = shadeRgb(col, -0.12);
      if (m > 0.86) col = edgeDarken(col, 1);
      if (cfg.innerStyle === "core" && m < 0.35) col = mixRgb(WHITE, c2, m);
      buf.set(x, y, col, 255);
    }
  }
  buf.blend(cx - w * 0.3, cy - h * 0.42, WHITE, 225);
}
function drawHead(c) {
  const { cfg, buf, geo, pal, rng, S, W, line, edgeDarken } = c;
  const [hx, hy] = geo.headC;
  const R = geo.headR;
  const { dir, perp } = geo;
  const { gemC, gem2, gemDark, collarC, haloC } = pal;
  switch (cfg.headShape) {
    case "orb":
      paintOrb(c, hx, hy, R, gemC, gem2);
      break;
    case "crystal":
      paintCrystal(c, hx, hy, R, gemC, gem2);
      break;
    case "cluster":
      paintCrystal(c, hx - R * 0.72, hy + R * 0.4, R * 0.58, shadeRgb(gemC, -0.12), gem2, 0.16);
      paintCrystal(c, hx + R * 0.7, hy + R * 0.42, R * 0.52, shadeRgb(gemC, 0.08), gem2, -0.16);
      paintCrystal(c, hx, hy - R * 0.08, R * 0.95, gemC, gem2);
      break;
    case "star":
      for (let y = Math.floor(hy - R - 1); y <= hy + R + 1; y++) {
        for (let x = Math.floor(hx - R - 1); x <= hx + R + 1; x++) {
          const dx = x - hx, dy = y - hy;
          const d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
          const rr = R * (0.46 + 0.54 * Math.pow(0.5 + 0.5 * Math.cos(5 * a - Math.PI / 2), 0.42));
          if (d > rr) continue;
          const edge = d / rr;
          let col = mixRgb(mixRgb(gemC, WHITE, 0.45), gemC, smoothstep(0, 0.6, edge));
          col = mixRgb(col, gem2, cfg.gemGlow * 0.25 * (1 - edge));
          if (d < R * 0.24) col = mixRgb(WHITE, gem2, 0.25);
          if (edge > 0.88) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      buf.blend(hx, hy, WHITE, 240);
      break;
    case "crescent": {
      const cx2 = hx + R * 0.52, cy2 = hy - R * 0.26, r2 = R * 0.84;
      for (let y = Math.floor(hy - R - 1); y <= hy + R + 1; y++) {
        for (let x = Math.floor(hx - R - 1); x <= hx + R + 1; x++) {
          const d1 = Math.hypot(x - hx, y - hy) / R, d2 = Math.hypot(x - cx2, y - cy2) / r2;
          if (d1 > 1 || d2 < 1) continue;
          let col = mixRgb(mixRgb(gemC, WHITE, 0.28), gemC, d1 * 0.7);
          if (d2 < 1.18) col = mixRgb(col, gem2, 0.55 * (1 - (d2 - 1) / 0.18));
          if (d1 > 0.9) col = edgeDarken(col, 0.9);
          buf.set(x, y, col, 255);
        }
      }
      buf.disc(hx - R * 0.35, hy + R * 0.1, R * 0.12, shadeRgb(gemC, -0.25));
      buf.disc(hx - R * 0.15, hy - R * 0.4, R * 0.08, shadeRgb(gemC, -0.2));
      const sx = hx + R * 0.72, sy = hy - R * 0.1;
      buf.blend(sx, sy, WHITE, 255);
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) buf.blend(sx + ox, sy + oy, gem2, 205);
      break;
    }
    case "eye": {
      const rx = R, ry = R * 0.72;
      const sclera = mixRgb(WHITE, gem2, 0.25);
      for (let y = Math.floor(hy - ry - 1); y <= hy + ry + 1; y++) {
        for (let x = Math.floor(hx - rx - 1); x <= hx + rx + 1; x++) {
          const dd = ((x - hx) / rx) ** 2 + ((y - hy) / ry) ** 2;
          if (dd > 1) continue;
          let col = sclera;
          const irisD = Math.hypot(x - hx, y - hy) / (R * 0.52);
          if (irisD <= 1) {
            col = mixRgb(mixRgb(gem2, WHITE, 0.2), gemC, smoothstep(0, 1, irisD));
            const pupD = Math.hypot(x - hx, y - hy) / (R * 0.26);
            if (pupD <= 1) col = pupD < 0.6 ? INK : mixRgb(INK, gemC, 0.3);
          }
          if (dd > 0.86) col = edgeDarken(col, 0.8);
          buf.set(x, y, col, 255);
        }
      }
      buf.blend(hx - R * 0.12, hy - R * 0.12, WHITE, 245);
      const lw = Math.max(0.8 * S, W * 0.012);
      line(hx - rx * 0.9, hy - ry * 0.55, hx + rx * 0.9, hy - ry * 0.55, lw, lw, collarC, shadeRgb(collarC, -0.3), shadeRgb(collarC, 0.5));
      break;
    }
    case "diamond":
      for (let y = Math.floor(hy - R - 1); y <= hy + R + 1; y++) {
        for (let x = Math.floor(hx - R - 1); x <= hx + R + 1; x++) {
          const m = (Math.abs(x - hx) + Math.abs(y - hy)) / R;
          if (m > 1) continue;
          let col = y < hy - R * 0.1 ? mixRgb(shadeRgb(gemC, 0.4), gemC, m) : y > hy + R * 0.1 ? mixRgb(gemC, gemDark, m * 0.8) : x < hx ? shadeRgb(gemC, -0.14) : shadeRgb(gemC, 0.14);
          col = mixRgb(col, gem2, cfg.gemGlow * 0.18 * (1 - m));
          const table = (Math.abs(x - hx) + Math.abs(y - hy + R * 0.35)) / (R * 0.4);
          if (table < 1 && y < hy) col = mixRgb(WHITE, gem2, 0.35);
          if (m > 0.88) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      buf.blend(hx - R * 0.18, hy - R * 0.3, WHITE, 235);
      break;
    case "bloom":
      for (let p = 0; p < 6; p++) {
        const a = p / 6 * Math.PI * 2 - Math.PI / 2;
        const px = hx + Math.cos(a) * R * 0.52, py = hy + Math.sin(a) * R * 0.52, prr = R * 0.4;
        for (let y = Math.floor(py - prr - 1); y <= py + prr + 1; y++) {
          for (let x = Math.floor(px - prr - 1); x <= px + prr + 1; x++) {
            const d = Math.hypot(x - px, y - py) / prr;
            if (d > 1) continue;
            let col = mixRgb(mixRgb(gemC, WHITE, 0.22), gemC, d * 0.7);
            if (d > 0.82) col = edgeDarken(col, 0.8);
            buf.set(x, y, col, 255);
          }
        }
        line(hx, hy, px, py, 0.6 * S, 0.4 * S, mixRgb(gemC, WHITE, 0.45), gemC, WHITE);
      }
      for (let y = Math.floor(hy - R * 0.36); y <= hy + R * 0.36; y++) {
        for (let x = Math.floor(hx - R * 0.36); x <= hx + R * 0.36; x++) {
          const d = Math.hypot(x - hx, y - hy) / (R * 0.36);
          if (d > 1) continue;
          let col = mixRgb(mixRgb(gem2, WHITE, 0.32), gem2, d * 0.6);
          if (rng() < 0.1) col = shadeRgb(col, -0.3);
          buf.set(x, y, col, 255);
        }
      }
      buf.blend(hx - 1, hy - 1, WHITE, 205);
      break;
    case "skull": {
      const cr = R * 0.8, ccx = hx, ccy = hy - R * 0.14;
      const bone = mixRgb([232, 228, 216], gemC, 0.12);
      for (let y = Math.floor(hy - R - 1); y <= hy + R + 1; y++) {
        for (let x = Math.floor(hx - R - 1); x <= hx + R + 1; x++) {
          const dc = Math.hypot(x - ccx, y - ccy) / cr;
          const inJaw = Math.abs(x - hx) < R * 0.5 && y >= hy - R * 0.1 && y <= hy + R * 0.78;
          if (dc > 1 && !inJaw) continue;
          let col = mixRgb(shadeRgb(bone, 0.16), shadeRgb(bone, -0.18), clamp01((y - (hy - R)) / (2 * R)));
          if (dc > 0.88 && !inJaw) col = edgeDarken(col, 0.7);
          buf.set(x, y, col, 255);
        }
      }
      for (const s of [-1, 1]) {
        const ex = hx + s * R * 0.32, ey = hy - R * 0.08;
        buf.disc(ex, ey, R * 0.21, INK);
        buf.disc(ex, ey, R * 0.11, gemC);
        buf.blend(ex, ey, gem2, 205);
        buf.blend(ex - 1, ey - 1, WHITE, 165);
      }
      buf.set(hx, hy + R * 0.28, INK);
      buf.set(hx - 1, hy + R * 0.36, INK);
      buf.set(hx + 1, hy + R * 0.36, INK);
      for (let i = -2; i <= 2; i++) {
        const tx = hx + i * Math.max(1.4 * S, R * 0.16);
        for (let yy = hy + R * 0.46; yy <= hy + R * 0.66; yy += 1) buf.blend(tx, yy, [90, 80, 70], 165);
      }
      const fg = R * 0.14;
      for (let y = Math.floor(hy - R * 0.62 - fg); y <= hy - R * 0.62 + fg; y++)
        for (let x = Math.floor(hx - fg); x <= hx + fg; x++)
          if (Math.abs(x - hx) + Math.abs(y - (hy - R * 0.62)) <= fg) buf.set(x, y, gem2, 255);
      break;
    }
    case "rune-cube": {
      const s = R * 0.95, th = s * 0.42;
      for (let y = Math.floor(hy - s / 2); y <= hy + s / 2; y++)
        for (let x = Math.floor(hx - s / 2); x <= hx + s / 2; x++)
          buf.set(x, y, mixRgb(shadeRgb(gemC, 0.12), shadeRgb(gemC, -0.18), clamp01((y - (hy - s / 2)) / s)), 255);
      for (let y = 0; y < th; y++) for (let x = 0; x < s; x++) buf.set(hx - s / 2 + x + y * 0.5, hy - s / 2 - th + y, mixRgb(shadeRgb(gemC, 0.38), WHITE, 0.14), 255);
      for (let y = 0; y < s; y++) for (let x2 = 0; x2 < th * 0.5; x2++) buf.set(hx + s / 2 + x2, hy - s / 2 + y + x2 * 0.4, shadeRgb(gemC, -0.34), 255);
      for (let x = Math.floor(hx - s / 2); x <= hx + s / 2; x++) {
        buf.set(x, Math.round(hy - s / 2), collarC, 255);
        buf.set(x, Math.round(hy + s / 2), shadeRgb(collarC, -0.25), 255);
      }
      for (let y = Math.floor(hy - s / 2); y <= hy + s / 2; y++) {
        buf.set(Math.round(hx - s / 2), y, collarC, 255);
        buf.set(Math.round(hx + s / 2), y, shadeRgb(collarC, -0.25), 255);
      }
      const rc = mixRgb(gem2, WHITE, 0.45);
      line(hx, hy - s * 0.3, hx, hy + s * 0.3, 1 * S, 1 * S, rc, rc, WHITE);
      line(hx - s * 0.25, hy - s * 0.1, hx, hy - s * 0.28, 0.9 * S, 0.9 * S, rc, rc, WHITE);
      line(hx, hy - s * 0.05, hx + s * 0.25, hy - s * 0.22, 0.9 * S, 0.9 * S, rc, rc, WHITE);
      line(hx - s * 0.22, hy + s * 0.18, hx + s * 0.22, hy + s * 0.18, 0.9 * S, 0.9 * S, rc, rc, WHITE);
      buf.disc(hx, hy + s * 0.18, 1.2 * S, WHITE);
      break;
    }
    case "teardrop": {
      const tipY = hy - R * 1.08, bcY = hy + R * 0.3, br = R * 0.72;
      for (let y = Math.floor(tipY - 1); y <= bcY + br + 1; y++) {
        for (let x = Math.floor(hx - br - 2); x <= hx + br + 2; x++) {
          let inside = false;
          if (y >= bcY - br * 0.4) inside = Math.hypot(x - hx, y - bcY) <= br;
          else {
            const f = (y - tipY) / (bcY - br * 0.4 - tipY);
            inside = Math.abs(x - hx) <= Math.max(0.5, f * br * 0.95);
          }
          if (!inside) continue;
          const vf = (y - tipY) / (bcY + br - tipY);
          let col = mixRgb(mixRgb(gem2, WHITE, 0.32), gemC, smoothstep(0, 0.75, vf));
          col = x < hx ? shadeRgb(col, 0.08) : shadeRgb(col, -0.1);
          if (Math.abs(x - hx) > br * 0.8 && y > bcY) col = edgeDarken(col, 0.6);
          buf.set(x, y, col, 255);
        }
      }
      line(hx - br * 0.3, tipY + R * 0.25, hx - br * 0.35, bcY + R * 0.1, 1 * S, 1.2 * S, WHITE, WHITE, WHITE);
      buf.blend(hx - br * 0.3, bcY - 1, WHITE, 185);
      break;
    }
    case "prism": {
      const w = R * 0.58, h = R * 1.28;
      for (let y = Math.floor(hy - h - 1); y <= hy + h + 1; y++) {
        for (let x = Math.floor(hx - w - 1); x <= hx + w + 1; x++) {
          const dx = x - hx, dy = y - hy;
          const m = Math.abs(dx) / w + Math.abs(dy) / h;
          if (m > 1) continue;
          let col = mixRgb(gemC, gem2, (dy + h) / (2 * h) * 0.75);
          col = dx < -w * 0.25 ? shadeRgb(col, -0.3) : dx > w * 0.25 ? shadeRgb(col, 0.25) : mixRgb(col, WHITE, 0.18);
          if (Math.abs(dx - dy * 0.35) < Math.max(0.8 * S, w * 0.12)) col = mixRgb(col, WHITE, 0.5);
          if (m > 0.88) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      break;
    }
    case "lantern": {
      const lw = R * 0.72, lh = R * 0.92;
      buf.ring(hx, hy - lh * 0.72, lw * 0.42, Math.max(0.8 * S, W * 0.012), collarC, 255);
      for (let x = Math.floor(hx - lw * 0.8); x <= hx + lw * 0.8; x++) {
        buf.set(x, hy - lh * 0.62, collarC, 255);
        buf.set(x, hy - lh * 0.66, shadeRgb(collarC, 0.4), 255);
      }
      for (let y = Math.floor(hy - lh * 0.6); y <= hy + lh * 0.72; y++) {
        for (let x = Math.floor(hx - lw); x <= hx + lw; x++) {
          const fx = Math.abs(x - hx) / lw;
          const taper = 0.35 + 0.65 * clamp01((y - (hy - lh * 0.6)) / (lh * 1.32));
          if (fx > taper) continue;
          let col = mixRgb(mixRgb(gemC, WHITE, 0.35), gemDark, clamp01(fx * 1.2));
          if (fx < 0.3) col = mixRgb(col, WHITE, 0.3);
          const fd = Math.hypot(x - hx, y - (hy + lh * 0.15)) / (lh * 0.42);
          if (fd < 1) col = mixRgb(col, mixRgb(gem2, WHITE, 0.4), (1 - fd) * 0.8);
          if (fx > taper - 0.12) col = shadeRgb(col, -0.3);
          buf.set(x, y, col, 255);
        }
      }
      for (let y = Math.floor(hy - lh * 0.6); y <= hy + lh * 0.72; y++) {
        buf.set(hx - lw * 0.5, y, shadeRgb(collarC, -0.25), 255);
        buf.set(hx + lw * 0.5, y, shadeRgb(collarC, -0.25), 255);
      }
      for (let x = Math.floor(hx - lw); x <= hx + lw; x++) {
        buf.set(x, hy + lh * 0.72, collarC, 255);
        buf.set(x, hy + lh * 0.76, shadeRgb(collarC, -0.3), 255);
      }
      buf.blend(hx - lw * 0.45, hy - lh * 0.35, WHITE, 150);
      break;
    }
    case "anvil": {
      const aw = R * 1.05, ah = R * 0.6;
      for (let y = Math.floor(hy - ah); y <= hy + ah; y++) {
        for (let x = Math.floor(hx - aw); x <= hx + aw; x++) {
          const dx = Math.abs(x - hx) / aw, dy = (y - hy) / ah;
          const inside = y < hy - ah * 0.25 ? dx < 0.95 : y < hy + ah * 0.25 ? dx < 0.42 : dx < 0.8;
          if (!inside) continue;
          let col = mixRgb(shadeRgb(gemC, 0.2), shadeRgb(gemC, -0.25), clamp01((dy + 1) / 2));
          if (y < hy - ah * 0.25 && dx > 0.6 && dx < 0.9) col = mixRgb(col, collarC, 0.6);
          if (Math.abs(dx) < 0.3 && y < hy) col = mixRgb(col, WHITE, 0.2);
          buf.set(x, y, col, 255);
        }
      }
      const rc = mixRgb(gem2, WHITE, 0.5);
      line(hx - aw * 0.35, hy - ah * 0.45, hx + aw * 0.35, hy - ah * 0.45, 1 * S, 1 * S, rc, rc, WHITE);
      line(hx - aw * 0.2, hy - ah * 0.45, hx, hy - ah * 0.15, 0.9 * S, 0.9 * S, rc, rc, WHITE);
      line(hx + aw * 0.2, hy - ah * 0.45, hx, hy - ah * 0.15, 0.9 * S, 0.9 * S, rc, rc, WHITE);
      buf.disc(hx, hy - ah * 0.15, 1.2 * S, WHITE);
      break;
    }
    case "moonlet": {
      const mr = R * 0.78;
      paintOrb(c, hx, hy, mr, mixRgb(gemC, WHITE, 0.1), gem2);
      for (let i = 0; i < 5; i++) {
        const a = rng() * Math.PI * 2, d = rng() * mr * 0.65, cr = mr * (0.1 + rng() * 0.13);
        const ccx = hx + Math.cos(a) * d, ccy = hy + Math.sin(a) * d;
        for (let y = Math.floor(ccy - cr); y <= ccy + cr; y++)
          for (let x = Math.floor(ccx - cr); x <= ccx + cr; x++)
            if (Math.hypot(x - ccx, y - ccy) <= cr) buf.set(x, y, shadeRgb(gemC, -0.22), 255);
      }
      const rw = Math.max(0.8 * S, W * 0.014);
      buf.ring(hx, hy, mr * 1.42, rw, haloC, 220);
      buf.ring(hx, hy, mr * 1.42, rw, WHITE, 60);
      break;
    }
    case "hourglass": {
      const hw = R * 0.72, hh = R;
      for (let x = Math.floor(hx - hw); x <= hx + hw; x++) {
        buf.set(x, hy - hh, collarC, 255);
        buf.set(x, hy - hh + 1, shadeRgb(collarC, 0.35), 255);
        buf.set(x, hy + hh, shadeRgb(collarC, -0.25), 255);
        buf.set(x, hy + hh - 1, collarC, 255);
      }
      for (let y = Math.floor(hy - hh + 2); y <= hy + hh - 2; y++) {
        const f = (y - hy) / hh;
        const waist = Math.abs(f);
        const halfW = hw * (0.12 + 0.88 * waist);
        for (let x = Math.floor(hx - halfW); x <= hx + halfW; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, halfW);
          let col = mixRgb(mixRgb(gemC, WHITE, 0.4), gemDark, e * 0.9);
          const filled = f > 0 ? 1 - f < 0.75 : f < -0.55;
          if (filled) col = mixRgb(col, gem2, 0.75);
          if (e > 0.84) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      for (let y = Math.floor(hy); y <= hy + hh * 0.7; y++) buf.blend(hx, y, mixRgb(gem2, WHITE, 0.5), 225);
      buf.blend(hx - hw * 0.4, hy - hh * 0.55, WHITE, 215);
      break;
    }
    case "tome": {
      const bw = R * 0.92, bh = R * 1.05;
      for (let y = Math.floor(hy - bh); y <= hy + bh; y++) {
        for (let x = Math.floor(hx - bw); x <= hx + bw; x++) {
          const ex = Math.abs(x - hx) / bw, ey = Math.abs(y - hy) / bh;
          if (ex > 1 || ey > 1) continue;
          let col = mixRgb(shadeRgb(gemC, 0.12), shadeRgb(gemC, -0.3), ey * 0.8 + ex * 0.2);
          if (ex > 0.86 || ey > 0.88) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      for (let y = Math.floor(hy - bh * 0.82); y <= hy + bh * 0.82; y++) {
        for (let x = Math.floor(hx + bw * 0.18); x <= hx + bw * 0.92; x++) {
          const pf = (x - (hx + bw * 0.18)) / (bw * 0.74);
          buf.set(x, y, mixRgb([248, 244, 232], [190, 180, 160], pf * 0.8 + (Math.round(y) % 2 ? 0.12 : 0)), 255);
        }
      }
      for (let y = Math.floor(hy - bh); y <= hy + bh; y++) buf.set(hx - bw * 0.72, y, collarC, 255);
      buf.disc(hx + bw * 0.55, hy, Math.max(1 * S, R * 0.14), mixRgb(gem2, WHITE, 0.3));
      const sg = mixRgb(gem2, WHITE, 0.55);
      line(hx - bw * 0.42, hy - bh * 0.3, hx - bw * 0.42, hy + bh * 0.3, 0.8 * S, 0.8 * S, sg, sg, WHITE);
      line(hx - bw * 0.6, hy, hx - bw * 0.24, hy, 0.8 * S, 0.8 * S, sg, sg, WHITE);
      break;
    }
    case "chalice": {
      const cw = R * 0.85;
      for (let y = Math.floor(hy - R * 0.9); y <= hy + R * 0.1; y++) {
        const f = (y - (hy - R * 0.9)) / R;
        const halfW = cw * (1 - f * 0.55);
        for (let x = Math.floor(hx - halfW); x <= hx + halfW; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, halfW);
          let col = mixRgb(shadeRgb(collarC, 0.35), shadeRgb(collarC, -0.35), e * 0.9);
          if (e > 0.85) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      for (let x = Math.floor(hx - cw * 0.86); x <= hx + cw * 0.86; x++) {
        const e = Math.abs(x - hx) / (cw * 0.86);
        buf.set(x, hy - R * 0.78, mixRgb(gem2, gemC, e * 0.7), 255);
        buf.set(x, hy - R * 0.72, mixRgb(gemC, gemDark, e * 0.5), 255);
      }
      for (let y = Math.floor(hy + R * 0.1); y <= hy + R * 0.7; y++)
        for (let x = Math.floor(hx - R * 0.14); x <= hx + R * 0.14; x++)
          buf.set(x, y, x < hx ? shadeRgb(collarC, -0.2) : collarC, 255);
      buf.disc(hx, hy + R * 0.35, R * 0.2, mixRgb(gemC, WHITE, 0.25));
      for (let x = Math.floor(hx - cw * 0.7); x <= hx + cw * 0.7; x++) {
        buf.set(x, hy + R * 0.72, collarC, 255);
        buf.set(x, hy + R * 0.78, shadeRgb(collarC, -0.3), 255);
      }
      buf.blend(hx - cw * 0.45, hy - R * 0.6, WHITE, 205);
      break;
    }
    case "feather": {
      const fl = R * 1.25, fw = R * 0.5;
      line(hx, hy + fl * 0.8, hx, hy - fl * 0.9, 0.9 * S, 0.5 * S, mixRgb(gemC, WHITE, 0.35), gemC, WHITE);
      for (let i = 0; i < 16; i++) {
        const f = i / 16;
        const y = hy + fl * 0.7 - f * fl * 1.5;
        const spread = fw * Math.sin(f * Math.PI) * 1.1;
        for (const sd of [-1, 1]) {
          const tipX = hx + sd * spread, tipY = y - spread * 0.35;
          const col = mixRgb(shadeRgb(gemC, sd > 0 ? 0.22 : -0.18), gem2, f * 0.5);
          line(hx, y, tipX, tipY, 0.7 * S, 0.4 * S, col, shadeRgb(col, -0.25), mixRgb(col, WHITE, 0.4), 250);
        }
      }
      buf.blend(hx - fw * 0.3, hy - fl * 0.4, WHITE, 190);
      break;
    }
    case "ankh": {
      const aw = Math.max(0.9 * S, R * 0.17);
      buf.ring(hx, hy - R * 0.46, R * 0.42, aw, collarC, 255);
      buf.ring(hx - R * 0.1, hy - R * 0.56, R * 0.42, aw * 0.5, mixRgb(collarC, WHITE, 0.5), 150);
      for (let y = Math.floor(hy - R * 0.05); y <= hy + R * 0.95; y++)
        for (let x = Math.floor(hx - aw); x <= hx + aw; x++)
          buf.set(x, y, x < hx ? shadeRgb(collarC, -0.25) : x > hx + aw * 0.4 ? shadeRgb(collarC, 0.45) : collarC, 255);
      for (let x = Math.floor(hx - R * 0.62); x <= hx + R * 0.62; x++)
        for (let y = Math.floor(hy + R * 0.12 - aw); y <= hy + R * 0.12 + aw; y++)
          buf.set(x, y, y < hy + R * 0.12 ? shadeRgb(collarC, 0.35) : shadeRgb(collarC, -0.25), 255);
      buf.disc(hx, hy - R * 0.46, R * 0.18, mixRgb(gemC, WHITE, 0.3));
      break;
    }
    case "spiral-shell": {
      const turns = 2.6, steps = 74;
      for (let i = steps; i >= 0; i--) {
        const f = i / steps;
        const a = f * Math.PI * 2 * turns;
        const rad = R * 0.95 * f;
        const px = hx + Math.cos(a) * rad * 0.92, py = hy + Math.sin(a) * rad;
        const w = Math.max(0.9 * S, R * 0.3 * f);
        const col = mixRgb(mixRgb(gemC, WHITE, 0.45 * (1 - f)), gem2, f * 0.5);
        buf.disc(px, py, w, col);
        buf.blend(px - w * 0.35, py - w * 0.35, WHITE, 90);
      }
      buf.disc(hx, hy, Math.max(1 * S, R * 0.13), mixRgb(gem2, WHITE, 0.55));
      break;
    }
    case "tesseract": {
      const o = R * 0.82, i2 = R * 0.44;
      const rect = (half, col, a = 255) => {
        for (let x = Math.floor(hx - half); x <= hx + half; x++) {
          buf.set(x, hy - half, col, a);
          buf.set(x, hy + half, shadeRgb(col, -0.3), a);
        }
        for (let y = Math.floor(hy - half); y <= hy + half; y++) {
          buf.set(hx - half, y, col, a);
          buf.set(hx + half, y, shadeRgb(col, -0.3), a);
        }
      };
      for (let y = Math.floor(hy - o); y <= hy + o; y++)
        for (let x = Math.floor(hx - o); x <= hx + o; x++) {
          if (Math.abs(x - hx) > o || Math.abs(y - hy) > o) continue;
          const d = Math.max(Math.abs(x - hx), Math.abs(y - hy)) / o;
          buf.blend(x, y, mixRgb(gem2, gemC, d), 90 + 80 * (1 - d));
        }
      rect(o, mixRgb(collarC, WHITE, 0.25));
      rect(i2, mixRgb(gem2, WHITE, 0.45));
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
        line(hx + sx * o, hy + sy * o, hx + sx * i2, hy + sy * i2, 0.7 * S, 0.7 * S, mixRgb(gemC, WHITE, 0.5), gemC, WHITE, 235);
      break;
    }
    case "dragon-egg": {
      const ew = R * 0.78, eh = R * 1.02;
      for (let y = Math.floor(hy - eh); y <= hy + eh; y++) {
        for (let x = Math.floor(hx - ew); x <= hx + ew; x++) {
          const fy = (y - hy) / eh;
          const taper = Math.sqrt(Math.max(0, 1 - fy * fy)) * (fy < 0 ? 0.82 : 1);
          const halfW = ew * taper;
          if (Math.abs(x - hx) > halfW) continue;
          const e = Math.abs(x - hx) / Math.max(0.5, halfW);
          let col = mixRgb(mixRgb(gemC, WHITE, 0.3), gemDark, e * 0.75 + (fy + 1) * 0.12);
          const sc = Math.sin((x - hx) * 1.3) + Math.sin((y - hy) * 1.5);
          if (sc > 0.9) col = mixRgb(col, gem2, 0.4);
          if (e > 0.85) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      line(hx + ew * 0.1, hy - eh * 0.4, hx - ew * 0.25, hy + eh * 0.15, 0.7 * S, 0.5 * S, mixRgb(gem2, WHITE, 0.7), gem2, WHITE, 230);
      line(hx - ew * 0.25, hy + eh * 0.15, hx + ew * 0.2, hy + eh * 0.55, 0.6 * S, 0.4 * S, mixRgb(gem2, WHITE, 0.6), gem2, WHITE, 200);
      buf.blend(hx - ew * 0.36, hy - eh * 0.42, WHITE, 215);
      break;
    }
    case "compass": {
      const cr = R * 0.9;
      for (let y = Math.floor(hy - cr); y <= hy + cr; y++)
        for (let x = Math.floor(hx - cr); x <= hx + cr; x++) {
          const d = Math.hypot(x - hx, y - hy) / cr;
          if (d > 1) continue;
          let col = d > 0.82 ? mixRgb(shadeRgb(collarC, 0.4), shadeRgb(collarC, -0.35), (x - hx + cr) / (2 * cr)) : mixRgb(mixRgb(gemC, WHITE, 0.55), gemC, d);
          if (d > 0.95) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        const r0 = cr * 0.62, r1 = cr * (i % 2 === 0 ? 0.78 : 0.72);
        line(
          hx + Math.cos(a) * r0,
          hy + Math.sin(a) * r0,
          hx + Math.cos(a) * r1,
          hy + Math.sin(a) * r1,
          0.6 * S,
          0.5 * S,
          shadeRgb(collarC, -0.4),
          shadeRgb(collarC, -0.5),
          collarC,
          230
        );
      }
      const na = -Math.PI / 4 + cfg.seed * 0.01;
      line(
        hx - Math.cos(na) * cr * 0.5,
        hy - Math.sin(na) * cr * 0.5,
        hx + Math.cos(na) * cr * 0.55,
        hy + Math.sin(na) * cr * 0.55,
        R * 0.1,
        0.4 * S,
        [220, 60, 60],
        [150, 30, 30],
        [255, 140, 140]
      );
      buf.disc(hx, hy, Math.max(0.9 * S, R * 0.1), mixRgb(collarC, WHITE, 0.5));
      buf.blend(hx - cr * 0.35, hy - cr * 0.4, WHITE, 180);
      break;
    }
    case "heart": {
      const hs = R * 0.95;
      for (let y = Math.floor(hy - hs); y <= hy + hs * 1.15; y++) {
        for (let x = Math.floor(hx - hs); x <= hx + hs; x++) {
          const nx = (x - hx) / hs;
          const my = -((y - hy) / hs - 0.18);
          const v = Math.pow(nx * nx + my * my - 0.5, 3) - nx * nx * my * my * my;
          if (v > 0) continue;
          const ny = (y - hy) / hs;
          const d = Math.hypot(nx, ny);
          let col = mixRgb(mixRgb(gemC, WHITE, 0.42), gemC, Math.min(1, d * 1.2));
          col = mixRgb(col, gem2, cfg.gemGlow * 0.25 * (1 - Math.min(1, d)));
          if (d > 0.72) col = edgeDarken(col, 0.9);
          buf.set(x, y, col, 255);
        }
      }
      buf.blend(hx - hs * 0.38, hy - hs * 0.3, WHITE, 240);
      buf.blend(hx - hs * 0.3, hy - hs * 0.22, WHITE, 160);
      break;
    }
    case "lotus": {
      for (let tier = 2; tier >= 0; tier--) {
        const petals = tier === 0 ? 8 : 6;
        const pr = R * (tier === 0 ? 0.48 : tier === 1 ? 0.38 : 0.3);
        const orbit = R * (tier === 0 ? 0.43 : tier === 1 ? 0.29 : 0.14);
        for (let i = 0; i < petals; i++) {
          const a = i / petals * Math.PI * 2 - Math.PI / 2 + tier * 0.24;
          const px = hx + Math.cos(a) * orbit, py = hy + Math.sin(a) * orbit;
          const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
          for (let y = Math.floor(py - pr); y <= py + pr; y++) {
            for (let x = Math.floor(px - pr); x <= px + pr; x++) {
              const dx = x - px, dy = y - py, along = dx * ux + dy * uy, across = dx * vx + dy * vy;
              const t = Math.max(0, Math.min(1, (along + pr * 0.5) / (pr * 1.45)));
              const half = pr * 0.5 * Math.sin(Math.PI * t);
              if (along < -pr * 0.5 || along > pr * 0.9 || Math.abs(across) > half) continue;
              const shade2 = across < 0 ? 0.35 : -0.18;
              let col = shadeRgb(mixRgb(gemC, gem2, tier * 0.24), shade2);
              if (Math.abs(across) < half * 0.13) col = mixRgb(col, WHITE, 0.35);
              if (t < 0.18) col = edgeDarken(col, 0.7);
              buf.set(x, y, col, 255);
            }
          }
          line(hx, hy, px + ux * pr * 0.5, py + uy * pr * 0.5, 0.48 * S, 0.28 * S, mixRgb(gem2, WHITE, 0.32), gemC, WHITE, 145);
        }
      }
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2;
        buf.disc(hx + Math.cos(a) * R * 0.17, hy + Math.sin(a) * R * 0.17, R * 0.065, mixRgb(gem2, WHITE, 0.4), 250);
      }
      buf.disc(hx, hy, R * 0.22, mixRgb(collarC, WHITE, 0.3), 255);
      buf.disc(hx, hy, R * 0.13, WHITE, 240);
      break;
    }
    case "portal": {
      const pr = R * 0.86;
      buf.disc(hx, hy, pr, [10, 6, 24], 250);
      buf.ring(hx, hy, pr * 0.95, Math.max(1 * S, R * 0.08), collarC, 250);
      buf.ring(hx, hy, pr * 0.79, Math.max(0.65 * S, R * 0.045), mixRgb(gem2, WHITE, 0.28), 220);
      buf.ring(hx, hy, pr * 0.55, Math.max(0.6 * S, R * 0.04), gemC, 185);
      for (let i = 0; i < 5; i++) {
        const t = i / 5, a = t * Math.PI * 4.5 + cfg.seed * 0.01;
        const d = pr * (0.54 - t * 0.43);
        buf.blend(hx + Math.cos(a) * d, hy + Math.sin(a) * d, mixRgb(gem2, WHITE, 0.5), 215);
      }
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        const x = hx + Math.cos(a) * pr * 1.08, y = hy + Math.sin(a) * pr * 1.08;
        buf.disc(x, y, Math.max(0.55 * S, R * 0.055), i % 3 === 0 ? WHITE : collarC, 240);
      }
      buf.blend(hx - pr * 0.25, hy - pr * 0.38, WHITE, 220);
      break;
    }
    case "meteor": {
      const tailX = hx - dir[0] * R * 1.5 - perp[0] * R * 0.4;
      const tailY = hy - dir[1] * R * 1.5 - perp[1] * R * 0.4;
      for (let i = 0; i < 8; i++) {
        const t = i / 8;
        const x = hx + (tailX - hx) * t, y = hy + (tailY - hy) * t;
        const w = R * (0.55 * (1 - t) + 0.04);
        line(
          x - perp[0] * w,
          y - perp[1] * w,
          x + perp[0] * w,
          y + perp[1] * w,
          0.65 * S,
          0.45 * S,
          mixRgb(gem2, gemC, t),
          shadeRgb(gemC, -0.25),
          WHITE,
          225 * (1 - t * 0.65)
        );
      }
      paintCrystal(c, hx, hy, R * 0.76, gemC, gem2, 0.12);
      for (let i = 0; i < 5; i++) {
        const a = cfg.seed * 0.01 + i * 2.4;
        buf.disc(hx + Math.cos(a) * R * 0.8, hy + Math.sin(a) * R * 0.8, Math.max(0.55 * S, R * 0.055), WHITE, 225);
      }
      break;
    }
    case "keyhole": {
      const cr = R * 0.62;
      buf.disc(hx, hy - R * 0.25, cr, collarC, 255);
      buf.disc(hx, hy - R * 0.25, cr * 0.72, mixRgb(gemC, WHITE, 0.12), 255);
      buf.ring(hx, hy - R * 0.25, cr * 0.85, Math.max(0.7 * S, R * 0.05), mixRgb(collarC, WHITE, 0.42), 230);
      for (let y = Math.floor(hy + R * 0.2); y <= hy + R * 1.12; y++) {
        const t = (y - (hy + R * 0.2)) / (R * 0.92);
        const half = R * 0.29 * (1 - t * 0.66);
        for (let x = Math.floor(hx - half); x <= hx + half; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, half);
          let col = mixRgb(shadeRgb(collarC, 0.35), shadeRgb(collarC, -0.3), e);
          if (e > 0.8) col = edgeDarken(col, 0.8);
          buf.set(x, y, col, 255);
        }
      }
      buf.disc(hx, hy - R * 0.25, cr * 0.2, [16, 10, 22], 255);
      buf.disc(hx, hy - R * 0.25, cr * 0.1, gem2, 255);
      line(hx - R * 0.16, hy + R * 0.65, hx + R * 0.16, hy + R * 0.65, 0.6 * S, 0.4 * S, WHITE, collarC, WHITE, 200);
      break;
    }
    case "rose-window": {
      const rr = R * 0.92;
      buf.disc(hx, hy, rr, shadeRgb(collarC, -0.16), 255);
      buf.disc(hx, hy, rr * 0.86, gemC, 255);
      buf.ring(hx, hy, rr, Math.max(0.8 * S, R * 0.06), collarC, 255);
      buf.ring(hx, hy, rr * 0.7, Math.max(0.6 * S, R * 0.035), mixRgb(collarC, WHITE, 0.4), 235);
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        const col = [gemC, gem2, mixRgb(gemC, WHITE, 0.45)][i % 3];
        const x = hx + Math.cos(a) * rr * 0.7, y = hy + Math.sin(a) * rr * 0.7;
        buf.disc(x, y, rr * 0.18, col, 230);
        line(hx, hy, x, y, 0.55 * S, 0.35 * S, collarC, collarC, WHITE, 205);
        buf.disc(hx + Math.cos(a) * rr * 0.89, hy + Math.sin(a) * rr * 0.89, Math.max(0.6 * S, rr * 0.055), WHITE, 230);
      }
      buf.disc(hx, hy, rr * 0.24, mixRgb(gem2, WHITE, 0.35), 255);
      buf.blend(hx - rr * 0.15, hy - rr * 0.18, WHITE, 220);
      break;
    }
    case "mask": {
      const mw = R * 0.98, mh = R * 0.7;
      for (let y = Math.floor(hy - mh); y <= hy + mh; y++) {
        for (let x = Math.floor(hx - mw); x <= hx + mw; x++) {
          const nx = (x - hx) / mw, ny = (y - hy) / mh;
          if (nx * nx + ny * ny > 1 || y > hy + mh * 0.5 + Math.abs(nx) * mh * 0.3) continue;
          let col = mixRgb(shadeRgb(gemC, 0.26), shadeRgb(gemC, -0.26), (ny + 1) * 0.48);
          if (Math.abs(nx) > 0.84 || ny < -0.84) col = collarC;
          if (Math.abs(nx) < 0.1) col = mixRgb(col, WHITE, 0.3);
          buf.set(x, y, col, 255);
        }
      }
      for (const side of [-1, 1]) {
        const ex = hx + side * mw * 0.43, ey = hy - mh * 0.05;
        buf.disc(ex, ey, mw * 0.2, [11, 7, 18], 255);
        buf.disc(ex, ey, mw * 0.11, gem2, 245);
        buf.blend(ex - mw * 0.035, ey - mh * 0.06, WHITE, 235);
        line(ex, ey - mh * 0.12, ex + side * mw * 0.28, ey - mh * 0.34, 0.6 * S, 0.3 * S, collarC, collarC, WHITE, 220);
      }
      buf.disc(hx, hy + mh * 0.2, mw * 0.12, mixRgb(collarC, WHITE, 0.35), 240);
      break;
    }
    case "octahedron": {
      const r = R * 0.96;
      for (let y = Math.floor(hy - r); y <= hy + r; y++) {
        for (let x = Math.floor(hx - r); x <= hx + r; x++) {
          const dx = (x - hx) / r, dy = (y - hy) / r;
          const m = Math.abs(dx) + Math.abs(dy);
          if (m > 1) continue;
          let col;
          if (dy < -Math.abs(dx) * 0.52) col = mixRgb(gem2, WHITE, 0.38 - Math.abs(dx) * 0.13);
          else if (dy < Math.abs(dx) * 0.48) col = dx < 0 ? shadeRgb(gemC, 0.2) : mixRgb(gemC, gem2, 0.38);
          else col = shadeRgb(gemC, -0.2 - Math.abs(dx) * 0.12);
          if (Math.abs(dy + Math.abs(dx) * 0.52) < 0.045 || Math.abs(dy - Math.abs(dx) * 0.48) < 0.045) col = mixRgb(col, WHITE, 0.5);
          if (m > 0.9) col = edgeDarken(col, 0.9);
          buf.set(x, y, col, 255);
        }
      }
      line(hx, hy - r, hx, hy + r, 0.55 * S, 0.35 * S, collarC, shadeRgb(collarC, -0.25), WHITE, 175);
      buf.disc(hx - r * 0.18, hy - r * 0.35, r * 0.09, WHITE, 240);
      break;
    }
    case "aurora-crown": {
      buf.ring(hx, hy + R * 0.14, R * 0.72, Math.max(0.7 * S, R * 0.055), collarC, 245);
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI * 0.94 + i / 8 * Math.PI * 0.88;
        const h = R * (0.65 + 0.48 * Math.sin(i / 8 * Math.PI));
        const bx = hx + Math.cos(a) * R * 0.68, by = hy + R * 0.12 + Math.sin(a) * R * 0.25;
        const tx = bx + Math.cos(a) * h * 0.52, ty = by - h;
        line(bx, by, tx, ty, R * 0.11, 0.35 * S, collarC, shadeRgb(collarC, -0.36), mixRgb(gem2, WHITE, 0.6), 250);
        buf.disc(tx, ty, Math.max(0.55 * S, R * 0.07), i % 2 ? gemC : gem2, 255);
        buf.blend(tx - 0.3 * S, ty - 0.3 * S, WHITE, 215);
      }
      paintFaceted(c, hx, hy - R * 0.22, R * 0.42, "marquise", 1);
      for (let i = -2; i <= 2; i++) buf.disc(hx + i * R * 0.18, hy + R * 0.14, R * 0.055, WHITE, 215);
      break;
    }
    case "snow-globe": {
      const gr = R * 0.82;
      buf.disc(hx, hy - R * 0.1, gr, mixRgb([203, 230, 255], [255, 255, 255], 0.35), 90);
      buf.ring(hx, hy - R * 0.1, gr, Math.max(0.8 * S, R * 0.05), mixRgb([200, 225, 245], WHITE, 0.5), 230);
      buf.ring(hx, hy - R * 0.1, gr * 0.9, Math.max(0.5 * S, R * 0.025), [235, 245, 255], 140);
      const treeX = hx - gr * 0.24, treeTop = hy - gr * 0.62, treeH = gr * 0.95;
      for (let i = 0; i < 4; i++) {
        const ty = treeTop + treeH * i / 4;
        const half = (i + 1) * gr * 0.1;
        line(treeX - half, ty, treeX + half, ty, gr * 0.045, gr * 0.03, [46, 125, 68], [26, 85, 44], [120, 200, 120]);
      }
      buf.disc(treeX, treeTop, gr * 0.05, [250, 220, 100], 240);
      for (let i = 0; i < 5; i++) line(hx + gr * 0.16 + i * gr * 0.09, hy - gr * 0.16, hx + gr * 0.16 + i * gr * 0.09, hy + gr * 0.34, gr * 0.04, gr * 0.04, [206, 72, 62], [150, 44, 40], [255, 160, 140], 240);
      buf.disc(hx + gr * 0.42, hy - gr * 0.08, gr * 0.07, [255, 230, 140], 245);
      const snowN = Math.round(12 + R * 0.5);
      for (let i = 0; i < snowN; i++) {
        const a = (i * 2.399 + cfg.seed * 0.01) % (Math.PI * 2), d = gr * (0.18 + i % 5 * 0.14);
        const sx = hx + Math.cos(a) * d, sy = hy - gr * 0.1 + Math.sin(a) * d * 0.85;
        buf.blend(sx, sy, WHITE, 245);
        if (i % 4 === 0) buf.blend(sx + S * 0.5, sy, WHITE, 160);
      }
      for (let y = Math.floor(hy + gr * 0.4); y <= hy + R * 0.72; y++) {
        const f = (y - (hy + gr * 0.4)) / (R * 0.32);
        const half = gr * (0.7 - 0.15 * f);
        for (let x = Math.floor(hx - half); x <= hx + half; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, half);
          let col = mixRgb(shadeRgb(collarC, 0.28), shadeRgb(collarC, -0.3), e * 0.85);
          if (e > 0.85) col = edgeDarken(col, 0.8);
          buf.set(x, y, col, 255);
        }
      }
      line(hx - gr * 0.68, hy + gr * 0.48, hx + gr * 0.68, hy + gr * 0.48, 0.65 * S, 0.45 * S, mixRgb(collarC, WHITE, 0.4), collarC, WHITE, 215);
      buf.blend(hx - gr * 0.4, hy - gr * 0.5, WHITE, 225);
      buf.blend(hx - gr * 0.52, hy + gr * 0.12, WHITE, 150);
      break;
    }
    case "butterfly": {
      const bw = R * 0.98;
      for (const side of [-1, 1]) {
        for (let y = Math.floor(hy - R * 0.9); y <= hy + R * 0.1; y++) {
          for (let x = Math.floor(hx + side * 0.1 * R); x <= hx + side * bw; x++) {
            if (side < 0 && x > hx - 0.08 * R) continue;
            if (side > 0 && x < hx + 0.08 * R) continue;
            const nx = side * (x - hx) / bw, ny = (y - hy) / R;
            const span = 0.95 - ny * ny * 0.55;
            if (nx > span || ny > 0.16 - nx * 0.2) continue;
            let col = mixRgb(gemC, gem2, ny * 0.5 + 0.2);
            if (ny < -0.55) col = mixRgb(col, WHITE, 0.3);
            if (nx > span - 0.16) col = shadeRgb(col, -0.32);
            buf.set(x, y, col, 255);
          }
        }
        for (let y = Math.floor(hy + R * 0.05); y <= hy + R * 0.85; y++) {
          for (let x = Math.floor(hx + 0.05 * R); side > 0 ? x <= hx + bw * 0.75 : x >= hx - bw * 0.75; x++) {
            if (side < 0 && x > hx - 0.05 * R) continue;
            if (side > 0 && x < hx + 0.05 * R) continue;
            const nx = side * (x - hx) / (bw * 0.75), ny = (y - hy - R * 0.42) / (R * 0.5);
            const span = 0.82 - ny * ny * 0.5;
            if (nx > span || nx < 0.12) continue;
            let col = mixRgb(shadeRgb(gemC, 0.18), gem2, ny * 0.4 + 0.3);
            if (nx > span - 0.13) col = shadeRgb(col, -0.28);
            buf.set(x, y, col, 255);
          }
        }
        for (let i = 0; i < 3; i++) {
          const sx = hx + side * bw * (0.32 + i * 0.2), sy = hy - R * (0.55 + i * 0.05);
          buf.disc(sx, sy, R * 0.06, WHITE, 235);
          buf.blend(sx - S * 0.35, sy - S * 0.35, gem2, 200);
        }
      }
      line(hx, hy - R * 0.78, hx, hy + R * 0.62, R * 0.075, R * 0.05, shadeRgb(collarC, 0.35), collarC, WHITE);
      buf.disc(hx, hy - R * 0.8, R * 0.09, shadeRgb(collarC, 0.4), 245);
      buf.blend(hx - S * 0.4, hy - R * 0.84, WHITE, 220);
      for (const side of [-1, 1]) {
        line(hx, hy - R * 0.86, hx + side * R * 0.3, hy - R * 1.06, 0.5 * S, 0.35 * S, collarC, collarC, WHITE, 220);
        buf.disc(hx + side * R * 0.3, hy - R * 1.06, R * 0.035, WHITE, 230);
      }
      break;
    }
    case "wing": {
      const qhX = hx - R * 0.12, qhY = hy + R * 0.62;
      for (let i = 4; i >= 0; i--) {
        const fi = i / 4;
        const bx = qhX + (i - 0.5) * R * 0.12, by = qhY - i * R * 0.18;
        const tx = bx + R * (0.42 + fi * 0.2), ty = by - R * (1.15 - fi * 0.08);
        const shade2 = 0.16 + fi * 0.16;
        const col = mixRgb(gemC, gem2, 0.22 + fi * 0.05);
        for (let s = 0; s <= 14; s++) {
          const t = s / 14;
          const px = bx + (tx - bx) * t, py = by + (ty - by) * t;
          const w = R * (0.14 - t * 0.1) * (1 - fi * 0.1);
          buf.disc(px, py, Math.max(0.55 * S, w), shadeRgb(col, shade2));
          for (const sd of [-1, 1]) buf.blend(px + sd * w * 0.7, py, mixRgb(col, WHITE, shade2 * 0.6), 90);
        }
        buf.blend(tx, ty, WHITE, 195);
      }
      line(qhX - R * 0.18, qhY + R * 0.05, qhX + R * 0.32, qhY - R * 0.42, R * 0.05, R * 0.035, mixRgb(collarC, WHITE, 0.45), collarC, WHITE);
      buf.disc(qhX, qhY, R * 0.12, collarC, 245);
      for (let k = 0; k < 4; k++) buf.disc(qhX - R * 0.06 + k * R * 0.04, qhY + S * 0.3, R * 0.022, WHITE, 225);
      break;
    }
    case "helmet": {
      const hw = R * 0.78, domeH = R * 0.62;
      for (let y = Math.floor(hy - domeH); y <= hy + R * 0.32; y++) {
        const f = (y - (hy - domeH)) / (domeH + R * 0.32);
        const hw2 = hw * Math.sin(Math.min(Math.PI / 2, f * Math.PI * 0.52 + 0.05));
        for (let x = Math.floor(hx - hw2); x <= hx + hw2; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, hw2 || 0.5);
          const col = mixRgb(shadeRgb(collarC, 0.42), shadeRgb(collarC, -0.42), e * 0.78 + Math.max(0, f - 0.6) * 0.18);
          buf.set(x, y, col, 255);
        }
      }
      for (const sd of [-1, 1]) {
        for (let y = Math.floor(hy + R * 0.12); y <= hy + R * 0.72; y++) {
          const f = (y - (hy + R * 0.12)) / (R * 0.6);
          const cx0 = hx + sd * hw * (0.62 - f * 0.18);
          const half = R * 0.16 * (1 - f * 0.35);
          for (let x = Math.floor(cx0 - half); x <= cx0 + half; x++) {
            const e = Math.abs(x - cx0) / Math.max(0.4, half);
            buf.set(x, y, mixRgb(shadeRgb(collarC, 0.34), shadeRgb(collarC, -0.38), e), 250);
          }
        }
        buf.disc(hx + sd * hw * 0.52, hy + R * 0.42, R * 0.04, gem2, 230);
      }
      for (let y = Math.floor(hy - R * 0.12); y <= hy + R * 0.06; y++) {
        for (let x = Math.floor(hx - hw * 0.55); x <= hx + hw * 0.55; x++) {
          if (Math.abs(y - hy - R * 0.03) > R * 0.05) continue;
          buf.set(x, y, [13, 9, 20], 245);
        }
      }
      line(hx - hw * 0.55, hy - R * 0.08, hx + hw * 0.55, hy - R * 0.08, 0.55 * S, 0.4 * S, mixRgb(collarC, WHITE, 0.45), collarC, WHITE, 205);
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.16;
        const bx = hx, by = hy - domeH - R * 0.02;
        const tx = hx + Math.cos(a) * (R * 0.45 + (i % 2 ? R * 0.22 : R * 0.12));
        const ty = by - Math.abs(Math.sin(a)) * R * (0.55 + i % 3 * 0.12) - (i === 0 || i === 5 ? R * 0.1 : R * 0.28);
        line(bx, by, tx, ty, R * 0.08, 0.4 * S, mixRgb(gemC, WHITE, 0.35), gemC, WHITE, 245);
        for (let s = 1; s < 5; s++) {
          const t = s / 5, fx = bx + (tx - bx) * t, fy = by + (ty - by) * t;
          for (const sd of [-1, 1]) buf.blend(fx + sd * R * 0.1, fy, mixRgb(gemC, WHITE, 0.25), 200);
        }
      }
      for (let x = Math.floor(hx - hw * 0.68); x <= hx + hw * 0.68; x++) {
        buf.set(x, hy - R * 0.3, mixRgb(collarC, WHITE, 0.3), 250);
        buf.set(x, hy - R * 0.33, shadeRgb(collarC, -0.28), 240);
      }
      paintFaceted(c, hx, hy - R * 0.31, R * 0.1, "diamond", 1);
      break;
    }
    case "crown": {
      const bw2 = R * 0.95, baseY = hy + R * 0.4;
      for (let y = Math.floor(baseY - R * 0.18); y <= baseY + R * 0.26; y++) {
        for (let x = Math.floor(hx - bw2); x <= hx + bw2; x++) {
          const e = Math.abs(x - hx) / bw2;
          buf.set(x, y, mixRgb(shadeRgb(collarC, 0.45), shadeRgb(collarC, -0.35), e * 0.9), 255);
        }
      }
      line(hx - bw2, baseY + R * 0.02, hx + bw2, baseY + R * 0.02, 0.7 * S, 0.5 * S, mixRgb(collarC, WHITE, 0.45), collarC, WHITE, 220);
      line(hx - bw2, baseY + R * 0.2, hx + bw2, baseY + R * 0.2, 0.5 * S, 0.35 * S, shadeRgb(collarC, -0.25), collarC, WHITE, 180);
      const pointN = 5;
      for (let i = 0; i < pointN; i++) {
        const f = i / (pointN - 1);
        const bx = hx - bw2 + f * bw2 * 2;
        const pH = R * (i === 2 ? 0.9 : i % 2 ? 0.7 : 0.55);
        const txY = baseY - R * 0.18 - pH;
        line(bx, baseY - R * 0.18, bx, txY, R * 0.09, 0.3 * S, collarC, shadeRgb(collarC, -0.36), mixRgb(collarC, WHITE, 0.58));
        if (i === 2) {
          line(bx, txY, bx + R * 0.12, txY - R * 0.14, R * 0.07, 0.25 * S, collarC, shadeRgb(collarC, -0.3), WHITE);
          line(bx, txY, bx - R * 0.12, txY - R * 0.14, R * 0.07, 0.25 * S, collarC, shadeRgb(collarC, -0.3), WHITE);
        }
        paintFaceted(c, bx, txY, R * 0.07, "round", i);
        if (i < pointN && i % 2 === 0) buf.blend(bx - S * 0.3, txY - S * 0.3, WHITE, 205);
      }
      const stones = [[-0.5, gemC, 0.09], [0, gem2, 0.12], [0.5, gemC, 0.09]];
      for (const [f, , ss] of stones) {
        paintFaceted(c, hx + bw2 * f, baseY + R * 0.04, R * ss, "diamond", Math.round(f * 7));
        buf.ring(hx + bw2 * f, baseY + R * 0.04, R * (ss + 0.012), 0.5 * S, mixRgb(collarC, WHITE, 0.3), 215);
      }
      for (let i = 0; i < 5; i++) buf.disc(hx - bw2 * 0.85 + i * R * 0.12, baseY + R * 0.2, R * 0.03, WHITE, 220);
      break;
    }
    case "music-box": {
      const bx = R * 0.85, by = R * 0.78;
      for (let x = Math.floor(hx - bx); x <= hx + bx; x++) {
        for (let y = Math.floor(hy - by * 1.1); y <= hy - by * 0.5; y++) {
          buf.set(x, y, mixRgb([24, 12, 22], [46, 24, 34], (y - (hy - by * 1.1)) / (by * 0.6)), 245);
        }
      }
      for (let y = Math.floor(hy - by * 0.5); y <= hy + by; y++) {
        for (let x = Math.floor(hx - bx); x <= hx + bx; x++) {
          const e = Math.abs(x - hx) / bx, fy = (y - (hy - by * 0.5)) / (by * 1.5);
          let col = mixRgb(shadeRgb(collarC, 0.35), shadeRgb(collarC, -0.3), e * 0.55 + fy * 0.25);
          if (fy < 0.12) col = mixRgb(collarC, WHITE, 0.25);
          if (e > 0.9) col = edgeDarken(col, 0.8);
          buf.set(x, y, col, 255);
        }
      }
      for (let x = Math.floor(hx - bx * 0.72); x <= hx + bx * 0.72; x++) {
        for (let y = Math.floor(hy - by * 0.32); y <= hy + by * 0.42; y++) {
          if (Math.abs(x - hx) < bx * 0.1 && Math.abs(y - (hy + by * 0.05)) < by * 0.32) continue;
          if (Math.round(x - hx + y) % 3 === 0) {
            const e = Math.abs(x - hx) / bx;
            buf.set(x, y, mixRgb(shadeRgb(collarC, -0.04), shadeRgb(collarC, -0.22), e), 245);
          }
        }
      }
      buf.disc(hx, hy + by * 0.6, R * 0.16, mixRgb(collarC, WHITE, 0.4), 245);
      buf.disc(hx, hy + by * 0.6, R * 0.08, [13, 9, 18], 250);
      line(hx - R * 0.16, hy + by * 0.6, hx + R * 0.16, hy + by * 0.6, 0.4 * S, 0.35 * S, [13, 9, 18], [13, 9, 18], [13, 9, 18], 220);
      line(hx + bx + R * 0.06, hy - by * 0.1, hx + bx + R * 0.32, hy - by * 0.42, R * 0.07, R * 0.06, collarC, shadeRgb(collarC, -0.32), WHITE);
      buf.disc(hx + bx + R * 0.32, hy - by * 0.42, R * 0.1, mixRgb(collarC, WHITE, 0.42), 245);
      buf.disc(hx + bx + R * 0.32, hy - by * 0.42, R * 0.045, WHITE, 235);
      for (let i = 0; i < 3; i++) {
        const nx = hx - R * 0.55 + i * R * 0.42, ny = hy - by * 1.15 - i * R * 0.18;
        buf.disc(nx, ny, R * 0.055, mixRgb(gem2, WHITE, 0.35), 215);
        line(nx + R * 0.05, ny, nx + R * 0.05, ny - R * 0.14, 0.42 * S, 0.35 * S, mixRgb(gem2, WHITE, 0.4), gem2, WHITE, 205);
      }
      break;
    }
    /* ══════ Minecraft world icons ══════ */
    case "nether-star": {
      const r = R * 1;
      for (let y = Math.floor(hy - r - 1); y <= hy + r + 1; y++) {
        for (let x = Math.floor(hx - r - 1); x <= hx + r + 1; x++) {
          const dx = x - hx, dy = y - hy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
          const rr = r * (0.3 + 0.7 * Math.pow(Math.abs(Math.cos(2 * a)), 0.26));
          if (d > rr) continue;
          const e = d / rr;
          let col = mixRgb(WHITE, mixRgb(gem2, WHITE, 0.5), e);
          if (dx > 0 || dy > 0) col = mixRgb(col, shadeRgb(gem2, -0.2), 0.42);
          if (e > 0.88) col = edgeDarken(col, 0.55);
          buf.set(x, y, col, 255);
        }
      }
      buf.disc(hx, hy, r * 0.2, WHITE, 255);
      buf.ring(hx, hy, r * 0.33, Math.max(0.55 * S, r * 0.045), mixRgb(gem2, WHITE, 0.6), 170);
      break;
    }
    case "beacon": {
      const bw = R * 0.86, bh = R * 0.86;
      for (let x = Math.floor(hx - bw); x <= hx + bw; x++) {
        for (let y = Math.floor(hy + bh * 0.55); y <= hy + bh; y++) {
          const e = (x - (hx - bw)) / (bw * 2);
          buf.set(x, y, mixRgb([46, 32, 62], [18, 10, 26], e * 0.5 + (y - hy) / bh * 0.3), 255);
        }
      }
      for (let y = Math.floor(hy - bh); y <= hy + bh * 0.58; y++) {
        for (let x = Math.floor(hx - bw * 0.92); x <= hx + bw * 0.92; x++) {
          const e = Math.abs(x - hx) / (bw * 0.92), f = (y - (hy - bh)) / (bh * 1.58);
          buf.set(x, y, mixRgb(mixRgb([150, 220, 235], WHITE, 0.35), [70, 150, 175], e * 0.6 + f * 0.4), 205);
        }
      }
      paintFaceted(c, hx, hy - bh * 0.06, R * 0.3, "brilliant", 3);
      buf.disc(hx, hy - bh * 0.06, R * 0.12, WHITE, 245);
      for (const sx of [-1, 1]) line(hx + sx * bw * 0.92, hy - bh, hx + sx * bw * 0.92, hy + bh * 0.58, 0.7 * S, 0.55 * S, [225, 245, 250], [120, 175, 195], WHITE, 235);
      line(hx - bw * 0.92, hy - bh, hx + bw * 0.92, hy - bh, 0.7 * S, 0.55 * S, WHITE, [150, 200, 215], WHITE, 235);
      for (let y = Math.floor(hy - bh * 1.85); y <= hy - bh; y++) {
        const t = (hy - bh - y) / (bh * 0.85), half = R * 0.16 * (1 - t * 0.4);
        for (let x = Math.floor(hx - half); x <= hx + half; x++) buf.blend(x, y, mixRgb([140, 230, 245], WHITE, 0.4), 200 * (1 - t * 0.55));
      }
      break;
    }
    case "totem": {
      const bw = R * 0.56, headH = R * 0.5, bodyH = R * 0.78;
      for (let y = Math.floor(hy - headH * 0.2); y <= hy + bodyH; y++) {
        const f = (y - (hy - headH * 0.2)) / (bodyH + headH * 0.2), half = bw * (0.82 - f * 0.18);
        for (let x = Math.floor(hx - half); x <= hx + half; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, half);
          let col = mixRgb([126, 176, 62], [58, 96, 34], e * 0.75 + f * 0.25);
          if (e > 0.88) col = edgeDarken(col, 0.85);
          buf.set(x, y, col, 255);
        }
      }
      for (let y = Math.floor(hy - headH * 1.15); y <= hy - headH * 0.1; y++) {
        for (let x = Math.floor(hx - bw); x <= hx + bw; x++) buf.set(x, y, mixRgb([168, 208, 96], [86, 128, 48], Math.abs(x - hx) / bw * 0.7), 255);
      }
      for (const sd of [-1, 1]) {
        buf.disc(hx + sd * bw * 0.42, hy - headH * 0.62, bw * 0.19, [22, 120, 60], 255);
        buf.disc(hx + sd * bw * 0.42, hy - headH * 0.62, bw * 0.1, [86, 220, 130], 255);
        buf.blend(hx + sd * bw * 0.46, hy - headH * 0.7, WHITE, 215);
      }
      line(hx - bw * 0.3, hy - headH * 0.26, hx + bw * 0.3, hy - headH * 0.26, 0.7 * S, 0.5 * S, [40, 74, 26], [30, 58, 20], [70, 110, 44], 235);
      for (const fy of [0.18, 0.58]) {
        const yy = hy + bodyH * fy, half = bw * (0.82 - fy * 0.18);
        line(hx - half, yy, hx + half, yy, 0.75 * S, 0.55 * S, mixRgb(collarC, WHITE, 0.35), collarC, WHITE, 235);
      }
      paintFaceted(c, hx, hy + bodyH * 0.36, bw * 0.24, "diamond", 2);
      for (const sd of [-1, 1]) line(hx + sd * bw * 0.8, hy + bodyH * 0.06, hx + sd * bw * 1.18, hy + bodyH * 0.5, bw * 0.16, bw * 0.1, [126, 176, 62], [58, 96, 34], [178, 214, 120], 240);
      break;
    }
    case "geode": {
      const r = R * 0.95;
      for (let y = Math.floor(hy - r); y <= hy + r; y++) {
        for (let x = Math.floor(hx - r); x <= hx + r; x++) {
          const a = Math.atan2(y - hy, x - hx);
          const wob = 1 + Math.sin(a * 7 + cfg.seed * 0.02) * 0.07 + Math.sin(a * 13) * 0.04;
          const d = Math.hypot(x - hx, y - hy) / (r * wob);
          if (d > 1) continue;
          let col = mixRgb([126, 110, 104], [62, 52, 50], d * 0.85);
          if (rng() < 0.14) col = shadeRgb(col, rng() < 0.5 ? 0.1 : -0.12);
          if (d > 0.9) col = edgeDarken(col, 0.7);
          buf.set(x, y, col, 255);
        }
      }
      const cr = r * 0.6;
      for (let y = Math.floor(hy - cr); y <= hy + cr; y++) {
        for (let x = Math.floor(hx - cr); x <= hx + cr; x++) {
          const a = Math.atan2(y - hy, x - hx), wob = 1 + Math.sin(a * 5 + 1.2) * 0.12;
          if (Math.hypot(x - hx, y - hy) > cr * wob) continue;
          buf.set(x, y, mixRgb([54, 28, 84], [24, 10, 44], Math.hypot(x - hx, y - hy) / cr), 255);
        }
      }
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2 + 0.4;
        paintCrystal(c, hx + Math.cos(a) * cr * 0.42, hy + Math.sin(a) * cr * 0.42, cr * (0.3 + i % 3 * 0.08), mixRgb(gemC, WHITE, 0.12), gem2, Math.sin(a) * 0.2);
      }
      paintFaceted(c, hx, hy, cr * 0.26, "brilliant", 5);
      buf.ring(hx, hy, cr * 1.02, Math.max(0.6 * S, r * 0.035), mixRgb(gem2, WHITE, 0.35), 160);
      break;
    }
    case "ender-pearl": {
      const r = R * 0.88;
      for (let y = Math.floor(hy - r); y <= hy + r; y++) {
        for (let x = Math.floor(hx - r); x <= hx + r; x++) {
          const dx = x - hx, dy = y - hy, d = Math.hypot(dx, dy) / r;
          if (d > 1) continue;
          const uu = -(dx + dy) * 0.707 / r;
          let col = mixRgb(mixRgb(gemC, WHITE, 0.42), shadeRgb(gemC, -0.52), d * d);
          const swirl = Math.sin(Math.atan2(dy, dx) * 3 + d * 7 + cfg.seed * 0.02);
          col = mixRgb(col, mixRgb(gem2, WHITE, 0.2), Math.max(0, swirl) * 0.3 * (1 - d));
          if (uu > 0.35) col = mixRgb(col, WHITE, 0.2);
          if (d > 0.9) col = edgeDarken(col, 1);
          buf.set(x, y, col, 255);
        }
      }
      for (let i = 0; i < 9; i++) {
        const a = rng() * Math.PI * 2, d = rng() * r * 0.72;
        buf.blend(hx + Math.cos(a) * d, hy + Math.sin(a) * d, mixRgb(gem2, WHITE, 0.5), 175);
      }
      buf.blend(hx - r * 0.34, hy - r * 0.38, WHITE, 245);
      buf.blend(hx - r * 0.2, hy - r * 0.24, WHITE, 175);
      break;
    }
    case "potion-flask": {
      const bw = R * 0.6, neck = R * 0.24, topY = hy - R * 0.95, botY = hy + R * 0.85, liquidTop = hy - R * 0.1;
      for (let y = Math.floor(topY); y <= botY; y++) {
        const inNeck = y < hy - R * 0.35;
        const f = inNeck ? 0 : (y - (hy - R * 0.35)) / (botY - (hy - R * 0.35));
        const half = inNeck ? neck : neck + (bw - neck) * Math.sin(Math.min(1, f * 1.25) * Math.PI * 0.5);
        for (let x = Math.floor(hx - half); x <= hx + half; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, half);
          let col = y < liquidTop ? mixRgb([214, 236, 244], [150, 190, 205], e) : mixRgb(mixRgb(gemC, WHITE, 0.32), shadeRgb(gemC, -0.3), e * 0.85);
          if (e > 0.88) col = edgeDarken(col, 0.75);
          buf.set(x, y, col, 255);
        }
      }
      line(hx - bw * 0.86, liquidTop, hx + bw * 0.86, liquidTop, 0.7 * S, 0.5 * S, mixRgb(gem2, WHITE, 0.55), gemC, WHITE, 235);
      for (let i = 0; i < 4; i++) buf.disc(hx - bw * 0.4 + i * bw * 0.28, liquidTop + R * (0.14 + i % 2 * 0.2), R * 0.045, mixRgb(gem2, WHITE, 0.6), 210);
      for (let y = Math.floor(topY - R * 0.2); y <= topY + R * 0.06; y++) {
        for (let x = Math.floor(hx - neck * 1.05); x <= hx + neck * 1.05; x++) buf.set(x, y, mixRgb([178, 132, 82], [110, 76, 44], Math.abs(x - hx) / (neck * 1.05)), 255);
      }
      line(hx - bw * 0.55, hy + R * 0.05, hx - bw * 0.5, hy + R * 0.6, 0.8 * S, 0.6 * S, WHITE, WHITE, WHITE, 205);
      buf.blend(hx - neck * 0.5, topY + R * 0.16, WHITE, 185);
      break;
    }
    case "dragon-breath": {
      const bw = R * 0.62, neck = R * 0.22, topY = hy - R * 0.9, botY = hy + R * 0.82;
      for (let y = Math.floor(topY); y <= botY; y++) {
        const inNeck = y < hy - R * 0.32;
        const f = inNeck ? 0 : (y - (hy - R * 0.32)) / (botY - (hy - R * 0.32));
        const half = inNeck ? neck : neck + (bw - neck) * Math.sin(Math.min(1, f * 1.25) * Math.PI * 0.5);
        for (let x = Math.floor(hx - half); x <= hx + half; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, half);
          let col = mixRgb(mixRgb(gemC, WHITE, 0.35), shadeRgb(gemC, -0.32), e * 0.85);
          const sw = Math.sin((y - hy) * 0.5 / S + Math.atan2(x - hx, y - hy) * 2 + cfg.seed * 0.02);
          col = mixRgb(col, mixRgb(gem2, WHITE, 0.45), Math.max(0, sw) * 0.45);
          if (e > 0.88) col = edgeDarken(col, 0.75);
          buf.set(x, y, col, 255);
        }
      }
      for (let i = 0; i < 7; i++) {
        const a = rng() * Math.PI * 2, d = rng() * R * 0.42;
        buf.blend(hx + Math.cos(a) * d, hy + R * 0.15 + Math.sin(a) * d * 0.8, mixRgb(gem2, WHITE, 0.6), 200);
      }
      for (let y = Math.floor(topY - R * 0.2); y <= topY + R * 0.06; y++)
        for (let x = Math.floor(hx - neck * 1.05); x <= hx + neck * 1.05; x++)
          buf.set(x, y, mixRgb([178, 132, 82], [110, 76, 44], Math.abs(x - hx) / (neck * 1.05)), 255);
      line(hx - bw * 0.5, hy + R * 0.1, hx - bw * 0.46, hy + R * 0.58, 0.8 * S, 0.6 * S, WHITE, WHITE, WHITE, 200);
      buf.ring(hx, hy + R * 0.16, bw * 0.72, Math.max(0.5 * S, R * 0.03), mixRgb(gem2, WHITE, 0.5), 130);
      break;
    }
    case "shulker-core": {
      const r = R * 0.9;
      for (const sd of [-1, 1]) {
        for (let y = Math.floor(hy - r); y <= hy + r; y++) {
          for (let x = Math.floor(hx - r); x <= hx + r; x++) {
            const dy = (y - hy) / r;
            if (sd < 0 ? dy > -0.08 : dy < 0.08) continue;
            const dx = (x - (hx + sd * r * 0.05)) / r;
            if (dx * dx + dy * dy > 1) continue;
            const e = Math.hypot(dx, dy);
            let col = mixRgb(shadeRgb(gemC, 0.22), shadeRgb(gemC, -0.34), e);
            if (Math.abs(Math.sin(Math.atan2(dy, dx) * 8)) > 0.86) col = shadeRgb(col, -0.16);
            if (e > 0.9) col = edgeDarken(col, 0.8);
            buf.set(x, y, col, 255);
          }
        }
      }
      buf.disc(hx, hy, r * 0.3, mixRgb(gem2, WHITE, 0.25), 255);
      buf.disc(hx, hy, r * 0.17, [250, 214, 90], 255);
      buf.disc(hx, hy, r * 0.08, WHITE, 250);
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2;
        buf.blend(hx + Math.cos(a) * r * 0.42, hy + Math.sin(a) * r * 0.42, mixRgb(gem2, WHITE, 0.5), 185);
      }
      line(hx - r * 0.95, hy, hx + r * 0.95, hy, 0.6 * S, 0.45 * S, mixRgb(gem2, WHITE, 0.4), gemC, WHITE, 170);
      break;
    }
    case "respawn-anchor": {
      const s = R * 0.92;
      for (let y = 0; y < s * 0.42; y++) {
        for (let x = 0; x < s * 1.5; x++) buf.set(hx - s * 0.75 + x + y * 0.28, hy - s * 0.9 + y, mixRgb([78, 46, 96], [40, 22, 54], x / (s * 1.5)), 255);
      }
      for (let y = Math.floor(hy - s * 0.5); y <= hy + s * 0.62; y++) {
        for (let x = Math.floor(hx - s * 0.75); x <= hx + s * 0.75; x++) {
          const e = Math.abs(x - hx) / (s * 0.75), f = (y - (hy - s * 0.5)) / (s * 1.12);
          let col = mixRgb([46, 24, 60], [16, 8, 24], e * 0.5 + f * 0.5);
          const v = Math.sin(x * 0.42 / S + Math.sin(y * 0.31 / S) * 2.2);
          if (v > 0.86) col = mixRgb(col, mixRgb(gem2, WHITE, 0.25), 0.75);
          buf.set(x, y, col, 255);
        }
      }
      for (let i = 0; i < 4; i++) {
        const lx = hx - s * 0.5 + i * s * 0.34, ly = hy - s * 0.18, lit = i < 3;
        buf.disc(lx, ly, s * 0.085, lit ? mixRgb(gem2, WHITE, 0.45) : [30, 18, 40], 255);
        if (lit) buf.blend(lx, ly, WHITE, 215);
      }
      line(hx - s * 0.75, hy - s * 0.5, hx + s * 0.75, hy - s * 0.5, 0.7 * S, 0.5 * S, mixRgb(gemC, WHITE, 0.3), [24, 12, 34], WHITE, 225);
      break;
    }
    case "glow-berries": {
      for (let i = 0; i < 4; i++) {
        const sx = hx - R * 0.55 + i * R * 0.36;
        let px = sx, py = hy - R * 0.85;
        for (let k = 0; k < 10; k++) {
          const nx = sx + Math.sin(k * 0.7 + i) * R * 0.1, ny = py + R * 0.18;
          line(px, py, nx, ny, 0.65 * S, 0.45 * S, [86, 132, 52], [48, 84, 34], [150, 196, 96], 235);
          px = nx;
          py = ny;
          if (k % 3 === 1) {
            buf.disc(nx, ny, R * 0.11, mixRgb([250, 168, 62], WHITE, 0.18), 255);
            buf.disc(nx, ny, R * 0.055, [255, 232, 150], 250);
            buf.blend(nx - R * 0.03, ny - R * 0.04, WHITE, 225);
          }
        }
      }
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * 0.85 + i / 4 * Math.PI * 0.7;
        const lx = hx + Math.cos(a) * R * 0.5, ly = hy - R * 0.8 + Math.sin(a) * R * 0.24;
        buf.disc(lx, ly, R * 0.15, i % 2 ? [104, 162, 66] : [72, 122, 48], 245);
        buf.blend(lx - R * 0.04, ly - R * 0.05, [178, 216, 130], 190);
      }
      break;
    }
    case "banner": {
      const bw = R * 0.72, top = hy - R * 0.92, bot = hy + R * 0.95;
      line(hx - bw * 1.02, top - R * 0.12, hx - bw * 1.02, bot, 0.8 * S, 0.6 * S, collarC, shadeRgb(collarC, -0.3), mixRgb(collarC, WHITE, 0.45), 235);
      for (let y = Math.floor(top); y <= bot; y++) {
        const f = (y - top) / (bot - top);
        const wave = Math.sin(f * 3.4 + cfg.seed * 0.01) * R * 0.1;
        const x0 = hx - bw * 0.9 + wave, x1 = hx + bw * 0.95 + wave;
        const notch = f > 0.78 ? (f - 0.78) / 0.22 : 0, mid = (x0 + x1) / 2;
        for (let x = Math.floor(x0); x <= Math.floor(x1); x++) {
          if (notch > 0 && Math.abs(x - mid) < bw * 0.3 * notch) continue;
          const e = (x - x0) / Math.max(1, x1 - x0);
          let col = mixRgb(shadeRgb(gemC, 0.16), shadeRgb(gemC, -0.26), e);
          if (f < 0.06 || f > 0.94) col = mixRgb(collarC, WHITE, 0.25);
          buf.set(x, y, col, 255);
        }
      }
      paintFaceted(c, hx + R * 0.02, hy - R * 0.16, R * 0.24, "diamond", 4);
      buf.ring(hx + R * 0.02, hy - R * 0.16, R * 0.34, Math.max(0.5 * S, R * 0.035), mixRgb(gem2, WHITE, 0.45), 205);
      line(hx - bw * 0.62, hy + R * 0.42, hx + bw * 0.7, hy + R * 0.42, 0.6 * S, 0.45 * S, mixRgb(collarC, WHITE, 0.35), collarC, WHITE, 215);
      break;
    }
    case "brazier": {
      const bw = R * 0.85, rim = hy + R * 0.05;
      for (let y = Math.floor(rim); y <= hy + R * 0.72; y++) {
        const f = (y - rim) / (R * 0.67), half = bw * (1 - f * 0.45);
        for (let x = Math.floor(hx - half); x <= hx + half; x++) {
          const e = Math.abs(x - hx) / Math.max(0.5, half);
          let col = mixRgb(shadeRgb(collarC, 0.3), shadeRgb(collarC, -0.42), e * 0.8 + f * 0.2);
          if (e > 0.9) col = edgeDarken(col, 0.8);
          buf.set(x, y, col, 255);
        }
      }
      line(hx - bw, rim, hx + bw, rim, 0.9 * S, 0.6 * S, mixRgb(collarC, WHITE, 0.45), collarC, WHITE, 245);
      for (let i = 0; i < 7; i++) {
        const cx = hx + (rng() - 0.5) * bw * 1.3, cy = rim - R * 0.02 + rng() * R * 0.08;
        buf.disc(cx, cy, R * (0.06 + rng() * 0.05), rng() < 0.5 ? [226, 92, 30] : [255, 176, 70], 245);
      }
      for (let i = 0; i < 3; i++) {
        const fx = hx + (i - 1) * bw * 0.42, fh = R * (i === 1 ? 0.82 : 0.55);
        for (let y = Math.floor(rim - fh); y <= rim; y++) {
          const f = (rim - y) / fh, half = bw * 0.2 * Math.sin((1 - f) * Math.PI * 0.9);
          for (let x = Math.floor(fx - half); x <= fx + half; x++) buf.blend(x, y, mixRgb([255, 196, 80], [255, 110, 40], f), 225 * (1 - f * 0.35));
        }
        buf.blend(fx, rim - fh * 0.55, [255, 246, 200], 235);
      }
      for (const sd of [-1, 1]) line(hx + sd * bw * 0.55, hy + R * 0.7, hx + sd * bw * 0.78, hy + R * 0.98, R * 0.07, R * 0.05, collarC, shadeRgb(collarC, -0.35), mixRgb(collarC, WHITE, 0.4), 240);
      break;
    }
  }
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/render/extras.ts
function drawSilhouette(c) {
  const { cfg, buf, geo, pal, S, W, small, line } = c;
  if (small) return;
  const { collarPos: cp, collarLen, dir, perp, headR } = geo;
  const { collarC, gemC } = pal;
  if (cfg.itemType === "trident") {
    const bx = cp[0] + dir[0] * collarLen * 0.3, by = cp[1] + dir[1] * collarLen * 0.3;
    const tipLen = headR * 2.3;
    const tipX = bx + dir[0] * tipLen, tipY = by + dir[1] * tipLen;
    line(bx, by, tipX, tipY, headR * 0.16, headR * 0.04, collarC, shadeRgb(collarC, -0.4), shadeRgb(collarC, 0.55));
    for (const side of [-1, 1]) {
      const p0x = bx + perp[0] * side * headR * 0.12, p0y = by + perp[1] * side * headR * 0.12;
      const p1x = bx + perp[0] * side * headR * 0.85 + dir[0] * tipLen * 0.62;
      const p1y = by + perp[1] * side * headR * 0.85 + dir[1] * tipLen * 0.62;
      line(p0x, p0y, p1x, p1y, headR * 0.1, headR * 0.02, collarC, shadeRgb(collarC, -0.4), shadeRgb(collarC, 0.5));
      const bx2 = p1x - perp[0] * side * headR * 0.22 + dir[0] * headR * 0.28;
      const by2 = p1y - perp[1] * side * headR * 0.22 + dir[1] * headR * 0.28;
      line(p1x, p1y, bx2, by2, headR * 0.06, headR * 0.02, collarC, shadeRgb(collarC, -0.35), shadeRgb(collarC, 0.45));
      buf.disc(p1x, p1y, headR * 0.08, mixRgb(gemC, WHITE, 0.35));
    }
    buf.disc(tipX, tipY, headR * 0.1, mixRgb(gemC, WHITE, 0.4));
  } else if (cfg.itemType === "scythe") {
    const bx = cp[0] + dir[0] * collarLen * 0.2, by = cp[1] + dir[1] * collarLen * 0.2;
    const bl = headR * 2.15;
    for (let i = 0; i <= 30; i++) {
      const t = i / 30, a = t * Math.PI * 1.14;
      const px = bx + perp[0] * Math.sin(a) * bl + dir[0] * (1 - Math.cos(a)) * bl * 0.55;
      const py = by + perp[1] * Math.sin(a) * bl - dir[1] * (1 - Math.cos(a)) * bl * 0.55;
      const w = headR * 0.18 * (1 - t * 0.74);
      const col = i % 3 === 0 ? mixRgb(collarC, WHITE, 0.42) : mixRgb(collarC, shadeRgb(collarC, -0.35), t * 0.55);
      buf.disc(px, py, w, col);
      buf.blend(px + perp[0] * w * 0.4, py + perp[1] * w * 0.4, WHITE, 145);
    }
    line(
      bx,
      by,
      bx + perp[0] * bl * 0.68 + dir[0] * bl * 0.54,
      by + perp[1] * bl * 0.68 - dir[1] * bl * 0.54,
      headR * 0.055,
      0.3 * S,
      WHITE,
      collarC,
      WHITE,
      190
    );
  } else if (cfg.itemType === "crosier") {
    const bx = cp[0] + dir[0] * collarLen * 0.2, by = cp[1] + dir[1] * collarLen * 0.2;
    const cr = headR * 0.9, cx = bx + dir[0] * cr * 1.05, cy = by + dir[1] * cr * 1.05;
    buf.ring(cx, cy, cr, Math.max(0.9 * S, W * 0.016), collarC, 245);
    buf.ring(cx, cy, cr * 0.83, Math.max(0.45 * S, W * 7e-3), mixRgb(collarC, WHITE, 0.5), 165);
    line(bx, by, cx - dir[0] * cr, cy - dir[1] * cr, headR * 0.15, headR * 0.09, collarC, shadeRgb(collarC, -0.35), shadeRgb(collarC, 0.55));
    buf.disc(cx + perp[0] * cr * 0.88, cy + perp[1] * cr * 0.88, headR * 0.17, mixRgb(gemC, WHITE, 0.32));
    buf.blend(cx + perp[0] * cr * 0.8, cy + perp[1] * cr * 0.8 - S * 0.5, WHITE, 210);
  }
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/render/tips.ts
function setGem(c, cx, cy, r, shape = c.cfg.gemCut ?? "brilliant", frame = true) {
  const { buf, pal, S } = c;
  paintFaceted(c, cx, cy, r, shape, Math.round(cx + cy));
  if (frame) {
    buf.ring(cx, cy, r * 1.1, Math.max(0.5 * S, r * 0.12), pal.collarC, 235);
    for (let k = 0; k < 4; k++) {
      const a = k / 4 * Math.PI * 2 + Math.PI / 4;
      buf.disc(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9, Math.max(0.45 * S, r * 0.11), mixRgb(pal.collarC, WHITE, 0.42), 240);
    }
  }
}
function connector(c, width = 0.45) {
  const { geo, pal, line, S } = c;
  const { tipC: p, tipSize: r, headC, headR, dir } = geo;
  const sx = headC[0] + dir[0] * headR * 0.76;
  const sy = headC[1] + dir[1] * headR * 0.76;
  const ex = p[0] - dir[0] * r * 0.42;
  const ey = p[1] - dir[1] * r * 0.42;
  line(
    sx,
    sy,
    ex,
    ey,
    Math.max(0.55 * S, r * width * 0.18),
    Math.max(0.35 * S, r * width * 0.1),
    pal.collarC,
    shadeRgb(pal.collarC, -0.38),
    mixRgb(pal.collarC, WHITE, 0.5),
    238
  );
}
function drawStar(c, cx, cy, r, points = 5, color = c.pal.gemC) {
  const { buf, edgeDarken } = c;
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) {
    for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const rr = r * (0.43 + 0.57 * Math.pow(0.5 + 0.5 * Math.cos(points * a - Math.PI / 2), 0.43));
      if (d > rr) continue;
      let col = mixRgb(mixRgb(color, WHITE, 0.48), color, d / rr);
      if (d / rr > 0.84) col = edgeDarken(col, 0.9);
      buf.set(x, y, col, 255);
    }
  }
  buf.disc(cx, cy, Math.max(0.5, r * 0.12), WHITE, 245);
}
function drawPetal(c, cx, cy, r, a, color) {
  const { buf, S } = c;
  const len = r, width = r * 0.38;
  const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
  for (let y = Math.floor(cy - len); y <= cy + len; y++) {
    for (let x = Math.floor(cx - len); x <= cx + len; x++) {
      const dx = x - cx, dy = y - cy;
      const along = dx * ux + dy * uy, across = dx * vx + dy * vy;
      const taper = Math.sin(Math.PI * Math.max(0, Math.min(1, (along + len * 0.1) / (len * 1.15))));
      if (along < -len * 0.12 || along > len || Math.abs(across) > width * taper) continue;
      const t = Math.max(0, Math.min(1, along / len));
      let col = mixRgb(color, WHITE, 0.18 + (1 - t) * 0.18);
      if (Math.abs(across) < Math.max(0.45 * S, width * 0.12)) col = mixRgb(col, WHITE, 0.3);
      buf.blend(x, y, col, 245);
    }
  }
}
function drawTip(c) {
  const { cfg, buf, geo, pal, S, W, line, anim } = c;
  const p = geo.tipC, r = geo.tipSize, dir = geo.dir;
  if (cfg.tipStyle === "none" || r <= 0.55) return;
  if (!["floating-gem", "orbit-ring", "celestial-cage", "prism-vortex"].includes(cfg.tipStyle)) connector(c);
  switch (cfg.tipStyle) {
    case "gem":
      setGem(c, p[0], p[1], r * 0.62, cfg.gemCut ?? "brilliant", true);
      break;
    case "crown": {
      const w = r * 0.92, baseY = p[1] + r * 0.35;
      line(p[0] - w, baseY, p[0] + w, baseY, r * 0.12, r * 0.08, pal.collarC, shadeRgb(pal.collarC, -0.35), mixRgb(pal.collarC, WHITE, 0.45));
      for (let i = -2; i <= 2; i++) {
        const bx = p[0] + i * w * 0.43, by = baseY;
        const tx = bx + dir[0] * r * (i === 0 ? 0.9 : 0.58), ty = by + dir[1] * r * (i === 0 ? 0.9 : 0.58) - r * (i === 0 ? 0.1 : 0.05);
        line(bx, by, tx, ty, r * 0.13, 0.35 * S, pal.collarC, shadeRgb(pal.collarC, -0.4), mixRgb(pal.collarC, WHITE, 0.58));
        buf.disc(tx, ty, Math.max(0.65 * S, r * 0.11), i % 2 ? pal.gem2 : pal.gemC, 255);
        buf.blend(tx - 0.35 * S, ty - 0.35 * S, WHITE, 210);
      }
      setGem(c, p[0], p[1] - r * 0.18, r * 0.28, "round", false);
      break;
    }
    case "spike":
      line(
        p[0] - dir[0] * r * 0.8,
        p[1] - dir[1] * r * 0.8,
        p[0] + dir[0] * r * 1.22,
        p[1] + dir[1] * r * 1.22,
        r * 0.32,
        0.28 * S,
        pal.collarC,
        shadeRgb(pal.collarC, -0.48),
        mixRgb(pal.collarC, WHITE, 0.62)
      );
      line(
        p[0] - dir[0] * r * 0.34,
        p[1] - dir[1] * r * 0.34,
        p[0] + dir[0] * r * 1.1,
        p[1] + dir[1] * r * 1.1,
        r * 0.07,
        0.2 * S,
        shadeRgb(pal.collarC, -0.35),
        shadeRgb(pal.collarC, -0.35),
        WHITE,
        170
      );
      buf.disc(p[0] + dir[0] * r * 1.18, p[1] + dir[1] * r * 1.18, Math.max(0.5 * S, r * 0.1), WHITE, 220);
      break;
    case "flame": {
      for (let i = 0; i < 5; i++) {
        const f = i / 5, sway = Math.sin(f * 7 + (anim.on ? anim.t * anim.TAU : 0)) * r * 0.14;
        const cx = p[0] + sway, baseY = p[1] + r * 0.72 - f * r * 0.54;
        const rr = r * (0.5 - f * 0.075);
        for (let y = Math.floor(baseY - rr * 1.7); y <= baseY + rr; y++) {
          for (let x = Math.floor(cx - rr); x <= cx + rr; x++) {
            const d = ((x - cx) / rr) ** 2 + ((y - baseY) / (rr * 1.7)) ** 2;
            if (d > 1) continue;
            buf.blend(x, y, mixRgb(pal.gem2, pal.gemC, f), 230 * (1 - d * 0.35));
          }
        }
      }
      buf.blend(p[0] - r * 0.1, p[1] - r * 0.18, WHITE, 230);
      break;
    }
    case "star":
      drawStar(c, p[0], p[1], r * 0.92, 5, pal.gemC);
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * Math.PI * 2;
        buf.disc(p[0] + Math.cos(a) * r * 1.08, p[1] + Math.sin(a) * r * 1.08, Math.max(0.5 * S, r * 0.08), pal.gem2, 220);
      }
      break;
    case "halo":
      buf.ring(p[0], p[1], r * 0.82, Math.max(0.8 * S, r * 0.13), pal.haloC, 240);
      buf.ring(p[0], p[1], r * 0.82, Math.max(0.35 * S, r * 0.04), WHITE, 150);
      setGem(c, p[0], p[1], r * 0.28, "round", false);
      break;
    case "floating-gem": {
      const gx = p[0] + dir[0] * r * 1.15, gy = p[1] + dir[1] * r * 1.15;
      line(
        geo.headC[0] + dir[0] * geo.headR * 0.72,
        geo.headC[1] + dir[1] * geo.headR * 0.72,
        gx,
        gy,
        Math.max(0.55 * S, W * 8e-3),
        Math.max(0.35 * S, W * 5e-3),
        pal.collarC,
        shadeRgb(pal.collarC, -0.35),
        mixRgb(pal.collarC, WHITE, 0.5),
        220
      );
      setGem(c, gx, gy, r * 0.5, "diamond", false);
      buf.ring(gx, gy, r * 0.95, Math.max(0.45 * S, r * 0.06), pal.glowC, 115);
      break;
    }
    case "cluster":
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2 - Math.PI / 2;
        const rr = r * (i === 0 ? 0.48 : 0.36);
        const x = p[0] + Math.cos(a) * r * 0.42, y = p[1] + Math.sin(a) * r * 0.38;
        paintCrystal(c, x, y, rr, i % 2 ? pal.gemC : mixRgb(pal.gemC, pal.gem2, 0.26), pal.gem2, i % 2 ? 0.08 : -0.08);
        buf.ring(x, y, rr * 0.7, Math.max(0.35 * S, rr * 0.06), pal.collarC, 145);
      }
      setGem(c, p[0], p[1], r * 0.38, "round", false);
      break;
    case "crystal-tip":
      paintCrystal(c, p[0], p[1], r * 0.92, pal.gemC, pal.gem2);
      line(p[0] - r * 0.48, p[1] + r * 0.25, p[0] + r * 0.4, p[1] - r * 0.45, 0.65 * S, 0.35 * S, WHITE, pal.gemC, WHITE, 175);
      break;
    case "lantern": {
      const w = r * 0.58, h = r * 0.72;
      buf.ring(p[0], p[1] - h * 0.8, w * 0.4, Math.max(0.7 * S, W * 8e-3), pal.collarC, 255);
      for (let y = Math.floor(p[1] - h * 0.58); y <= p[1] + h * 0.6; y++) {
        const f = (y - (p[1] - h * 0.58)) / (h * 1.18), hw = w * (0.35 + f * 0.65);
        for (let x = Math.floor(p[0] - hw); x <= p[0] + hw; x++) {
          const d = Math.abs(x - p[0]) / hw;
          let col = mixRgb(mixRgb(pal.gemC, WHITE, 0.4), pal.gemDark, d);
          if (Math.hypot(x - p[0], y - (p[1] + h * 0.12)) < h * 0.28) col = mixRgb(col, mixRgb(pal.gem2, WHITE, 0.6), 0.72);
          buf.set(x, y, col, 235);
        }
      }
      for (const dx of [-w * 0.55, w * 0.55]) line(p[0] + dx, p[1] - h * 0.54, p[0] + dx, p[1] + h * 0.6, 0.55 * S, 0.45 * S, pal.collarC, pal.collarC, WHITE, 240);
      break;
    }
    case "orbit-ring": {
      const rr = r * 0.92, th = Math.max(0.65 * S, r * 0.09);
      for (let a = 0; a < Math.PI * 2; a += 0.045) {
        const x = p[0] + Math.cos(a) * rr, y = p[1] + Math.sin(a) * rr * 0.46;
        buf.disc(x, y, th * 0.48, Math.sin(a) > 0 ? mixRgb(pal.collarC, WHITE, 0.48) : shadeRgb(pal.collarC, -0.32), 245);
      }
      setGem(c, p[0], p[1], r * 0.42, "round", false);
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * Math.PI * 2 + (anim.on ? anim.t * anim.TAU : 0.4);
        setGem(c, p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr * 0.46, r * 0.14, "diamond", false);
      }
      break;
    }
    case "plume":
    case "phoenix-plume": {
      const plumeCount = cfg.tipStyle === "phoenix-plume" ? 5 : 3;
      const plumeLen = cfg.tipStyle === "phoenix-plume" ? 1.35 : 1.1;
      for (let i = 0; i < plumeCount; i++) {
        const f = i / Math.max(1, plumeCount - 1), a = -Math.PI / 2 + (f - 0.5) * 0.95;
        const x1 = p[0] + Math.cos(a) * r * plumeLen, y1 = p[1] + Math.sin(a) * r * plumeLen;
        line(p[0], p[1], x1, y1, r * 0.11, 0.35 * S, mixRgb(pal.gemC, WHITE, 0.36), pal.gemC, WHITE, 248);
        for (let q = 1; q <= 7; q++) {
          const t = q / 8, bx = p[0] + (x1 - p[0]) * t, by = p[1] + (y1 - p[1]) * t;
          const spread = r * 0.25 * Math.sin(Math.PI * t) * (cfg.tipStyle === "phoenix-plume" ? 1.25 : 1);
          for (const side of [-1, 1]) {
            line(
              bx,
              by,
              bx + side * spread,
              by - spread * 0.34,
              0.55 * S,
              0.28 * S,
              mixRgb(pal.gem2, WHITE, 0.38),
              pal.gemC,
              WHITE,
              232
            );
          }
        }
      }
      if (cfg.tipStyle === "phoenix-plume") {
        buf.disc(p[0], p[1] + r * 0.16, r * 0.3, mixRgb(pal.gemC, WHITE, 0.22));
        buf.blend(p[0], p[1] + r * 0.08, WHITE, 210);
      }
      break;
    }
    case "bell": {
      const w = r * 0.68, h = r * 0.82;
      buf.ring(p[0], p[1] - h * 0.9, w * 0.32, Math.max(0.6 * S, W * 8e-3), pal.collarC, 245);
      for (let y = Math.floor(p[1] - h * 0.62); y <= p[1] + h * 0.52; y++) {
        const f = (y - (p[1] - h * 0.62)) / (h * 1.14), hw = w * (0.28 + 0.72 * f);
        for (let x = Math.floor(p[0] - hw); x <= p[0] + hw; x++) {
          const e = Math.abs(x - p[0]) / Math.max(0.5, hw);
          buf.set(x, y, mixRgb(shadeRgb(pal.collarC, 0.48), shadeRgb(pal.collarC, -0.42), e), 255);
        }
      }
      for (let x = Math.floor(p[0] - w); x <= p[0] + w; x++) buf.set(x, p[1] + h * 0.57, shadeRgb(pal.collarC, -0.34), 255);
      buf.disc(p[0], p[1] + h * 0.72, Math.max(0.65 * S, r * 0.12), mixRgb(pal.gemC, WHITE, 0.32));
      for (let i = -1; i <= 1; i++) buf.blend(p[0] + i * w * 0.42, p[1] - h * 0.25, WHITE, 110);
      break;
    }
    case "eye-tip": {
      const rx = r * 0.95, ry = r * 0.62;
      for (let y = Math.floor(p[1] - ry); y <= p[1] + ry; y++) {
        for (let x = Math.floor(p[0] - rx); x <= p[0] + rx; x++) {
          const d = ((x - p[0]) / rx) ** 2 + ((y - p[1]) / ry) ** 2;
          if (d > 1) continue;
          let col = mixRgb(WHITE, pal.gem2, 0.22);
          const iris = Math.hypot(x - p[0], y - p[1]) / (r * 0.42);
          if (iris < 1) col = mixRgb(pal.gem2, pal.gemC, iris);
          if (Math.hypot(x - p[0], y - p[1]) < r * 0.16) col = [12, 8, 18];
          if (d > 0.84) col = shadeRgb(col, -0.28);
          buf.set(x, y, col, 255);
        }
      }
      buf.blend(p[0] - rx * 0.24, p[1] - ry * 0.28, WHITE, 245);
      buf.ring(p[0], p[1], r * 0.92, Math.max(0.55 * S, r * 0.08), pal.collarC, 210);
      break;
    }
    case "blade": {
      const len = r * 1.65, ex = p[0] + dir[0] * len, ey = p[1] + dir[1] * len;
      line(
        p[0] - dir[0] * r * 0.3,
        p[1] - dir[1] * r * 0.3,
        ex,
        ey,
        r * 0.29,
        0.3 * S,
        mixRgb(pal.collarC, WHITE, 0.15),
        shadeRgb(pal.collarC, -0.45),
        mixRgb(pal.collarC, WHITE, 0.62)
      );
      line(p[0], p[1], ex, ey, r * 0.055, 0.2 * S, shadeRgb(pal.collarC, -0.28), shadeRgb(pal.collarC, -0.28), WHITE, 180);
      buf.disc(p[0] - dir[0] * r * 0.28, p[1] - dir[1] * r * 0.28, r * 0.19, mixRgb(pal.gemC, WHITE, 0.3));
      buf.blend(ex, ey, WHITE, 225);
      break;
    }
    case "gem-cluster":
      connector(c, 0.58);
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2 - Math.PI / 2;
        const rr = r * (i === 0 ? 0.56 : 0.44);
        const x = p[0] + Math.cos(a) * r * 0.48, y = p[1] + Math.sin(a) * r * 0.42;
        paintCrystal(c, x, y, rr, i % 2 ? pal.gemC : mixRgb(pal.gemC, pal.gem2, 0.28), pal.gem2, i % 2 ? 0.11 : -0.11);
        buf.ring(x, y, rr * 0.82, Math.max(0.45 * S, rr * 0.06), pal.collarC, 145);
      }
      setGem(c, p[0], p[1], r * 0.42, "round", false);
      break;
    case "triple-prong": {
      setGem(c, p[0], p[1], r * 0.52, "diamond", false);
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i / 3 * Math.PI * 2;
        const bx = p[0] + Math.cos(a) * r * 0.52, by = p[1] + Math.sin(a) * r * 0.52;
        const tx = p[0] + Math.cos(a) * r * 1.05, ty = p[1] + Math.sin(a) * r * 1.05;
        line(bx, by, tx, ty, r * 0.16, 0.42 * S, pal.collarC, shadeRgb(pal.collarC, -0.36), mixRgb(pal.collarC, WHITE, 0.58));
        buf.disc(tx, ty, Math.max(0.5 * S, r * 0.08), WHITE, 220);
      }
      buf.ring(p[0], p[1], r * 0.68, Math.max(0.5 * S, r * 0.07), pal.collarC, 200);
      break;
    }
    case "lotus-crown":
    case "living-bloom": {
      const n = cfg.tipStyle === "living-bloom" ? 9 : 8;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 - Math.PI / 2;
        const col = i % 2 ? mixRgb(pal.gemC, pal.gem2, 0.38) : pal.gemC;
        drawPetal(c, p[0] + Math.cos(a) * r * 0.22, p[1] + Math.sin(a) * r * 0.22, r * (cfg.tipStyle === "living-bloom" ? 0.78 : 0.72), a, col);
        if (cfg.tipStyle === "lotus-crown") {
          const tx = p[0] + Math.cos(a) * r * 0.82, ty = p[1] + Math.sin(a) * r * 0.82;
          buf.disc(tx, ty, Math.max(0.55 * S, r * 0.1), mixRgb(pal.collarC, WHITE, 0.35), 240);
        }
      }
      setGem(c, p[0], p[1], r * 0.31, "round", false);
      for (let i = 0; i < 5; i++) buf.disc(p[0] + Math.cos(i * Math.PI * 0.4) * r * 0.13, p[1] + Math.sin(i * Math.PI * 0.4) * r * 0.13, r * 0.045, WHITE, 215);
      break;
    }
    case "celestial-cage": {
      setGem(c, p[0], p[1], r * 0.55, "round", false);
      const ringR = r * 0.9;
      for (let ring = 0; ring < 3; ring++) {
        const phase = ring / 3 * Math.PI / 3 + (anim.on && anim.type === "orbit" ? anim.t * anim.TAU * (ring % 2 ? -0.12 : 0.12) : 0);
        for (let a = 0; a < Math.PI * 2; a += 0.045) {
          const x = p[0] + Math.cos(a + phase) * ringR;
          const y = p[1] + Math.sin(a + phase) * ringR * (ring === 1 ? 0.42 : 0.72);
          buf.disc(x, y, Math.max(0.45 * S, r * 0.045), ring === 1 ? mixRgb(pal.collarC, WHITE, 0.4) : pal.collarC, 205);
        }
      }
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        const x = p[0] + Math.cos(a) * ringR, y = p[1] + Math.sin(a) * ringR * 0.72;
        buf.disc(x, y, r * 0.095, i % 2 ? pal.gem2 : pal.gemC, 255);
        buf.blend(x - 0.35 * S, y - 0.35 * S, WHITE, 205);
      }
      break;
    }
    case "reliquary": {
      const w = r * 0.68, h = r * 1.08;
      for (let y = Math.floor(p[1] - h); y <= p[1] + h; y++) {
        const t = Math.abs(y - p[1]) / h;
        const hw = w * (0.72 + 0.28 * Math.cos(t * Math.PI * 0.5));
        for (let x = Math.floor(p[0] - hw); x <= p[0] + hw; x++) {
          const e = Math.abs(x - p[0]) / hw;
          if (e > 0.92) buf.set(x, y, e > 0.97 ? shadeRgb(pal.collarC, -0.28) : pal.collarC, 255);
          else if (t < 0.22 || t > 0.82) buf.set(x, y, shadeRgb(pal.collarC, e < 0.3 ? 0.18 : -0.12), 255);
        }
      }
      const capsuleR = r * 0.46;
      setGem(c, p[0], p[1], capsuleR, "marquise", false);
      buf.ring(p[0], p[1], capsuleR * 1.12, Math.max(0.6 * S, r * 0.05), mixRgb(pal.collarC, WHITE, 0.35), 220);
      for (const sy of [-0.72, 0.72]) {
        const y = p[1] + h * sy;
        buf.disc(p[0], y, r * 0.14, pal.collarC, 255);
        buf.disc(p[0], y, r * 0.055, pal.gem2, 245);
      }
      break;
    }
    case "dragon-fang": {
      const h = r * 1.25, w = r * 0.62;
      for (let y = Math.floor(p[1] - h); y <= p[1] + h * 0.72; y++) {
        const t = (y - (p[1] - h)) / (h * 1.72);
        const half = w * Math.sin(Math.PI * Math.min(0.98, t)) * (0.88 - t * 0.35);
        for (let x = Math.floor(p[0] - half); x <= p[0] + half; x++) {
          const e = Math.abs(x - p[0]) / Math.max(0.5, half);
          let col = mixRgb(mixRgb(pal.gemC, WHITE, 0.4), shadeRgb(pal.gemC, -0.4), e * 0.75 + t * 0.25);
          if (Math.abs(x - (p[0] - half * 0.35)) < Math.max(0.5 * S, w * 0.07)) col = mixRgb(col, WHITE, 0.4);
          buf.set(x, y, col, 255);
        }
      }
      line(p[0] - w * 0.75, p[1] + h * 0.35, p[0] + w * 0.75, p[1] + h * 0.35, r * 0.12, r * 0.1, pal.collarC, shadeRgb(pal.collarC, -0.3), WHITE);
      for (const s of [-1, 1]) line(p[0] + s * w * 0.55, p[1] + h * 0.1, p[0] + s * w * 1, p[1] - h * 0.18, r * 0.09, 0.3 * S, pal.collarC, shadeRgb(pal.collarC, -0.35), WHITE);
      buf.blend(p[0] - w * 0.24, p[1] - h * 0.48, WHITE, 230);
      break;
    }
    case "void-crown": {
      buf.disc(p[0], p[1], r * 0.78, [13, 7, 28], 248);
      buf.ring(p[0], p[1], r * 0.76, Math.max(0.65 * S, r * 0.08), pal.glowC, 235);
      buf.ring(p[0], p[1], r * 0.59, Math.max(0.5 * S, r * 0.045), mixRgb(pal.gem2, WHITE, 0.35), 200);
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + i / 6 * Math.PI;
        const bx = p[0] + Math.cos(a) * r * 0.58, by = p[1] + Math.sin(a) * r * 0.58;
        const tx = p[0] + Math.cos(a) * r * (i % 2 ? 1.12 : 1.34), ty = p[1] + Math.sin(a) * r * (i % 2 ? 1.12 : 1.34);
        line(bx, by, tx, ty, r * 0.11, 0.28 * S, pal.collarC, shadeRgb(pal.collarC, -0.45), mixRgb(pal.gem2, WHITE, 0.42));
        buf.disc(tx, ty, Math.max(0.45 * S, r * 0.055), pal.gem2, 210);
      }
      buf.disc(p[0], p[1], r * 0.25, [4, 2, 12], 255);
      buf.blend(p[0] - r * 0.14, p[1] - r * 0.18, WHITE, 220);
      break;
    }
    case "prism-vortex": {
      const turns = 2.3;
      for (let i = 0; i < 9; i++) {
        const t = i / 9, a = t * turns * Math.PI * 2 + (anim.on ? anim.t * anim.TAU * 0.18 : 0);
        const rr = r * (0.22 + t * 0.78), x = p[0] + Math.cos(a) * rr, y = p[1] + Math.sin(a) * rr * 0.72;
        const sz = r * (0.18 - t * 0.085);
        paintCrystal(c, x, y, sz, i % 2 ? pal.gemC : pal.gem2, WHITE, Math.sin(a) * 0.2);
        buf.disc(x - sz * 0.2, y - sz * 0.35, Math.max(0.45 * S, sz * 0.1), WHITE, 200);
      }
      setGem(c, p[0], p[1], r * 0.23, "round", false);
      break;
    }
    case "sun-disc": {
      const rr = r * 0.63;
      buf.disc(p[0], p[1], rr, mixRgb(pal.gemC, WHITE, 0.12), 255);
      buf.ring(p[0], p[1], rr * 0.9, Math.max(0.6 * S, r * 0.045), pal.collarC, 245);
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2;
        const inner = rr * 1.12, outer = rr * (i % 2 ? 1.42 : 1.7);
        line(
          p[0] + Math.cos(a) * inner,
          p[1] + Math.sin(a) * inner,
          p[0] + Math.cos(a) * outer,
          p[1] + Math.sin(a) * outer,
          (i % 2 ? 0.6 : 0.9) * S,
          0.3 * S,
          pal.collarC,
          shadeRgb(pal.collarC, -0.35),
          mixRgb(pal.gem2, WHITE, 0.6),
          245
        );
      }
      setGem(c, p[0], p[1], rr * 0.46, "round", false);
      break;
    }
    case "moon-circlet": {
      const rr = r * 0.88;
      buf.ring(p[0], p[1], rr, Math.max(0.75 * S, r * 0.085), pal.collarC, 240);
      buf.ring(p[0], p[1], rr * 0.87, Math.max(0.4 * S, r * 0.035), mixRgb(pal.collarC, WHITE, 0.42), 190);
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 0.72;
        const x = p[0] + Math.cos(a) * rr, y = p[1] + Math.sin(a) * rr;
        setGem(c, x, y, r * (i === 0 ? 0.23 : 0.17), "diamond", false);
      }
      buf.disc(p[0], p[1], r * 0.24, [14, 8, 28], 150);
      break;
    }
    case "snow-globe-tip": {
      const gr = r * 0.68;
      buf.disc(p[0], p[1] - r * 0.1, gr, [203, 230, 255], 75);
      buf.ring(p[0], p[1] - r * 0.1, gr, Math.max(0.7 * S, r * 0.05), mixRgb([210, 232, 250], WHITE, 0.5), 235);
      buf.ring(p[0], p[1] - r * 0.1, gr * 0.9, Math.max(0.45 * S, r * 0.022), [235, 245, 255], 130);
      const treeX = p[0] - gr * 0.22, treeH = gr * 0.86, treeTop = p[1] - gr * 0.62;
      for (let i = 0; i < 3; i++) {
        const ty = treeTop + treeH * i / 3;
        const half = (i + 1) * gr * 0.1;
        line(treeX - half, ty, treeX + half, ty, gr * 0.05, gr * 0.035, [52, 132, 72], [30, 92, 48], [140, 210, 140]);
      }
      buf.disc(treeX, treeTop, gr * 0.05, [252, 220, 100], 240);
      for (let i = 0; i < 4; i++) line(p[0] + gr * 0.14 + i * gr * 0.08, p[1] - gr * 0.18, p[0] + gr * 0.14 + i * gr * 0.08, p[1] + gr * 0.3, gr * 0.04, gr * 0.04, [206, 72, 62], [150, 44, 40], [255, 165, 145], 240);
      buf.disc(p[0] + gr * 0.4, p[1] - gr * 0.08, gr * 0.07, [255, 232, 148], 245);
      const snowN = Math.round(9 + r * 0.4);
      for (let i = 0; i < snowN; i++) {
        const a = (i * 2.399 + cfg.seed * 0.011) % (Math.PI * 2), d = gr * (0.2 + i % 4 * 0.16);
        buf.blend(p[0] + Math.cos(a) * d, p[1] - r * 0.1 + Math.sin(a) * d * 0.82, WHITE, 245);
      }
      for (let y = Math.floor(p[1] + gr * 0.38); y <= p[1] + gr * 0.72; y++) {
        const f = (y - (p[1] + gr * 0.38)) / (gr * 0.34);
        const half = gr * (0.68 - 0.16 * f);
        for (let x = Math.floor(p[0] - half); x <= p[0] + half; x++) {
          const e = Math.abs(x - p[0]) / Math.max(0.5, half);
          buf.set(x, y, mixRgb(shadeRgb(pal.collarC, 0.28), shadeRgb(pal.collarC, -0.3), e * 0.85), 255);
        }
      }
      line(p[0] - gr * 0.66, p[1] + gr * 0.44, p[0] + gr * 0.66, p[1] + gr * 0.44, 0.6 * S, 0.42 * S, mixRgb(pal.collarC, WHITE, 0.42), pal.collarC, WHITE, 215);
      buf.blend(p[0] - gr * 0.38, p[1] - gr * 0.42, WHITE, 225);
      line(p[0] - gr * 1.1, p[1] + gr * 0.72, p[0] + gr * 1.1, p[1] + gr * 0.72, 0.6 * S, 0.4 * S, pal.collarC, shadeRgb(pal.collarC, -0.3), WHITE, 230);
      buf.disc(p[0], p[1] - r * 0.5, Math.max(0.55 * S, r * 0.045), [240, 235, 230], 200);
      break;
    }
    case "butterfly-tip": {
      const bw = r * 0.9;
      for (const side of [-1, 1]) {
        for (let y = Math.floor(p[1] - r * 0.75); y <= p[1] + r * 0.15; y++) {
          for (let x = Math.floor(p[0] + side * 0.05 * r); side > 0 ? x <= p[0] + side * bw : x >= p[0] + side * bw; x++) {
            if (side < 0 && x > p[0] - 0.05 * r) continue;
            if (side > 0 && x < p[0] + 0.05 * r) continue;
            const nx = side * (x - p[0]) / bw, ny = (y - p[1]) / r;
            const span = 0.9 - ny * ny * 0.52;
            if (nx > span || ny > 0.14 - nx * 0.16) continue;
            let col = mixRgb(pal.gemC, pal.gem2, ny * 0.45 + 0.2);
            if (ny < -0.4) col = mixRgb(col, WHITE, 0.25);
            if (nx > span - 0.14) col = shadeRgb(col, -0.3);
            buf.set(x, y, col, 255);
          }
        }
        for (let i = 0; i < 2; i++) {
          const sx = p[0] + side * bw * (0.38 + i * 0.22), sy = p[1] - r * (0.44 + i * 0.07);
          buf.disc(sx, sy, r * 0.05, WHITE, 235);
          buf.disc(sx, sy, r * 0.026, pal.gem2, 240);
        }
      }
      line(p[0], p[1] - r * 0.7, p[0], p[1] + r * 0.5, r * 0.06, r * 0.04, pal.collarC, shadeRgb(pal.collarC, -0.3), WHITE);
      for (const side of [-1, 1]) {
        line(p[0], p[1] - r * 0.7, p[0] + side * r * 0.26, p[1] - r * 0.98, 0.5 * S, 0.35 * S, pal.collarC, pal.collarC, WHITE, 220);
        buf.disc(p[0] + side * r * 0.26, p[1] - r * 0.98, r * 0.03, WHITE, 230);
      }
      buf.disc(p[0], p[1] - r * 0.42, r * 0.09, mixRgb(pal.collarC, WHITE, 0.35), 240);
      setGem(c, p[0], p[1] - r * 0.12, r * 0.22, "round", false);
      break;
    }
    case "wing-pair": {
      for (const side of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const f = i / 3;
          const bx = p[0] + side * r * (0.28 + i * 0.12), by = p[1] + r * (0.45 - i * 0.1);
          const tx = bx + side * r * (1.15 - f * 0.25), ty = by - r * (0.85 + f * 0.42);
          const col = mixRgb(pal.gem2, WHITE, 0.2 + f * 0.2);
          line(bx, by, tx, ty, r * (0.1 - f * 0.03), 0.35 * S, col, shadeRgb(pal.gemC, -0.2), WHITE, 238);
          for (let q = 1; q <= 5; q++) {
            const t = q / 6, fx = bx + (tx - bx) * t, fy = by + (ty - by) * t;
            for (const sd of [-1, 1]) buf.blend(fx + sd * r * 0.05, fy, mixRgb(col, WHITE, 0.4), 120);
          }
        }
        buf.disc(p[0] + side * r * 0.28, p[1] + r * 0.42, r * 0.1, pal.collarC, 240);
      }
      setGem(c, p[0], p[1] + r * 0.05, r * 0.42, cfg.gemCut ?? "brilliant", false);
      buf.disc(p[0], p[1] + r * 0.42, r * 0.08, WHITE, 235);
      break;
    }
    case "prism-trio": {
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i / 3 * Math.PI * 2;
        const cx = p[0] + Math.cos(a) * r * 0.42, cy = p[1] + Math.sin(a) * r * 0.4;
        paintCrystal(c, cx, cy, r * 0.42, i % 2 ? pal.gemC : mixRgb(pal.gemC, pal.gem2, 0.3), pal.gem2, i % 2 ? 0.16 : -0.16);
        for (let q = 0; q < 3; q++) {
          const aa = a + (q - 1) * 0.5;
          buf.blend(cx + Math.cos(aa) * r * 0.3, cy + Math.sin(aa) * r * 0.3, WHITE, 150);
        }
        buf.ring(cx, cy, r * 0.62, Math.max(0.45 * S, r * 0.045), pal.collarC, 150);
      }
      setGem(c, p[0], p[1], r * 0.33, cfg.gemCut ?? "prism", false);
      for (let i = 0; i < 3; i++) buf.disc(p[0] + Math.cos(i * 2.1) * r * 0.7, p[1] + Math.sin(i * 2.1) * r * 0.62, Math.max(0.5 * S, r * 0.04), WHITE, 235);
      break;
    }
  }
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/render/orbiters.ts
function orb(c, x, y, r, color = c.pal.gemC, alt = c.pal.gem2) {
  const { edgeDarken } = c;
  for (let py = Math.floor(y - r); py <= y + r; py++) {
    for (let px = Math.floor(x - r); px <= x + r; px++) {
      const dx = (px - x) / r, dy = (py - y) / r, d = Math.hypot(dx, dy);
      if (d > 1) continue;
      let col = mixRgb(mixRgb(color, WHITE, 0.44), shadeRgb(color, -0.3), d * d);
      const light = -(dx + dy) * 0.707;
      if (light > 0.28) col = mixRgb(col, WHITE, 0.18);
      if (d > 0.87) col = edgeDarken(col, 0.8);
      if (dx + dy < -0.5) col = mixRgb(col, alt, 0.18);
      c.buf.set(px, py, col, 255);
    }
  }
  c.buf.blend(x - r * 0.32, y - r * 0.36, WHITE, 225);
}
function drawRune(c, x, y, r, index) {
  const { buf, pal, S, line } = c;
  const col = mixRgb(pal.gem2, WHITE, 0.42);
  buf.ring(x, y, r * 0.88, Math.max(0.45 * S, r * 0.08), pal.collarC, 225);
  buf.ring(x, y, r * 0.66, Math.max(0.35 * S, r * 0.05), col, 170);
  const variants = index % 3;
  if (variants === 0) {
    line(x - r * 0.38, y + r * 0.24, x + r * 0.32, y - r * 0.3, 0.55 * S, 0.35 * S, col, pal.gemC, WHITE, 240);
    line(x - r * 0.2, y - r * 0.15, x + r * 0.4, y + r * 0.25, 0.45 * S, 0.3 * S, col, pal.gemC, WHITE, 210);
  } else if (variants === 1) {
    line(x - r * 0.3, y - r * 0.3, x + r * 0.3, y + r * 0.3, 0.55 * S, 0.35 * S, col, pal.gemC, WHITE, 240);
    line(x - r * 0.3, y + r * 0.3, x + r * 0.3, y - r * 0.3, 0.55 * S, 0.35 * S, col, pal.gemC, WHITE, 210);
  } else {
    line(x, y - r * 0.38, x, y + r * 0.38, 0.55 * S, 0.35 * S, col, pal.gemC, WHITE, 240);
    line(x - r * 0.3, y, x + r * 0.3, y, 0.55 * S, 0.35 * S, col, pal.gemC, WHITE, 210);
    c.buf.disc(x, y, r * 0.1, WHITE, 220);
  }
}
function petal(c, x, y, r, a, color) {
  const { buf, S } = c;
  const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
  const length = r * 1.45, width = r * 0.6;
  for (let py = Math.floor(y - length); py <= y + length; py++) {
    for (let px = Math.floor(x - length); px <= x + length; px++) {
      const dx = px - x, dy = py - y;
      const along = dx * ux + dy * uy, across = dx * vx + dy * vy;
      const t = clamp01((along + length * 0.2) / (length * 1.15));
      const half = width * Math.sin(Math.PI * t);
      if (along < -length * 0.2 || along > length * 0.9 || Math.abs(across) > half) continue;
      let col = mixRgb(color, WHITE, 0.18 + 0.3 * (1 - t));
      if (Math.abs(across) < Math.max(0.35 * S, half * 0.11)) col = mixRgb(col, WHITE, 0.22);
      buf.set(px, py, col, 235);
    }
  }
}
function tinyCrown(c, x, y, r) {
  const { pal, S, line } = c;
  line(x - r, y + r * 0.42, x + r, y + r * 0.42, r * 0.16, r * 0.13, pal.collarC, shadeRgb(pal.collarC, -0.32), mixRgb(pal.collarC, WHITE, 0.5));
  for (let i = -1; i <= 1; i++) {
    const bx = x + i * r * 0.56, by = y + r * 0.38;
    const tx = bx + i * r * 0.08, ty = y - r * (i === 0 ? 0.9 : 0.55);
    line(bx, by, tx, ty, r * 0.15, 0.35 * S, pal.collarC, shadeRgb(pal.collarC, -0.35), WHITE);
    c.buf.disc(tx, ty, Math.max(0.45 * S, r * 0.1), pal.gem2);
  }
  c.buf.disc(x, y + r * 0.04, r * 0.19, pal.gemC);
}
function hourglass(c, x, y, r) {
  const { buf, pal, S } = c;
  const w = r * 0.68, h = r * 1.05;
  for (let px = Math.floor(x - w); px <= x + w; px++) {
    buf.set(px, y - h, pal.collarC, 240);
    buf.set(px, y + h, shadeRgb(pal.collarC, -0.2), 240);
  }
  for (let py = Math.floor(y - h); py <= y + h; py++) {
    const f = (py - y) / h, half = w * (0.12 + 0.88 * Math.abs(f));
    for (let px = Math.floor(x - half); px <= x + half; px++) {
      const e = Math.abs(px - x) / Math.max(0.5, half);
      buf.blend(px, py, mixRgb(mixRgb(pal.gem2, WHITE, 0.5), pal.gemC, e), e > 0.82 ? 215 : 170);
    }
  }
  for (let py = y; py < y + h * 0.72; py += Math.max(1, S * 0.6)) buf.blend(x, py, WHITE, 230);
}
function drawOrbiters(c) {
  const { cfg, buf, geo, pal, anim, S, W, small, line } = c;
  if (cfg.orbiterStyle === "none" || cfg.orbiterCount <= 0 || small) return;
  const { headC, headR } = geo;
  const { gemC, gem2, collarC } = pal;
  const size = headR * cfg.orbiterSize;
  const orbitR = headR * cfg.orbiterRadius;
  const positions = [];
  for (let i = 0; i < cfg.orbiterCount; i++) {
    const a = i / cfg.orbiterCount * Math.PI * 2 + cfg.seed * 0.013 + Math.PI / 2 + anim.orbPhase;
    const bob = anim.on && anim.type === "orbit" ? Math.sin(a * 3 + anim.t * anim.TAU * 2) * headR * 0.06 * anim.intensity : 0;
    const px = headC[0] + Math.cos(a) * orbitR, py = headC[1] + Math.sin(a) * orbitR * 0.82 + bob;
    if (px < -size * 2 || py < -size * 2 || px > W + size * 2 || py > W + size * 2) continue;
    positions.push([px, py, a]);
  }
  if (cfg.orbiterStyle === "gem-chain" || cfg.orbiterStyle === "constellation") {
    for (let i = 0; i < positions.length; i++) {
      const [x0, y0] = positions[i], [x1, y1] = positions[(i + 1) % positions.length];
      line(
        x0,
        y0,
        x1,
        y1,
        Math.max(0.4 * S, size * 0.04),
        Math.max(0.35 * S, size * 0.025),
        cfg.orbiterStyle === "gem-chain" ? collarC : mixRgb(gem2, WHITE, 0.38),
        shadeRgb(collarC, -0.3),
        WHITE,
        cfg.orbiterStyle === "gem-chain" ? 190 : 150
      );
    }
  }
  positions.forEach(([x, y, a], i) => {
    switch (cfg.orbiterStyle) {
      case "orb":
        orb(c, x, y, size);
        break;
      case "shard":
        paintFaceted(c, x, y, size * 1.15, "diamond", i);
        break;
      case "crystal":
        paintCrystal(c, x, y, size * 1.22, mixRgb(gemC, WHITE, 0.1), gem2, i % 2 ? 0.16 : -0.16);
        break;
      case "rune":
        drawRune(c, x, y, size, i);
        break;
      case "rune-satellite":
        drawRune(c, x, y, size * 1.25, i);
        for (let q = 0; q < 3; q++) {
          const aa = a + q / 3 * Math.PI * 2 + anim.spinA;
          buf.blend(x + Math.cos(aa) * size * 1.42, y + Math.sin(aa) * size * 1.42, WHITE, 200);
        }
        break;
      case "star":
        for (let py = Math.floor(y - size * 1.2); py <= y + size * 1.2; py++) {
          for (let px = Math.floor(x - size * 1.2); px <= x + size * 1.2; px++) {
            const dx = px - x, dy = py - y, d = Math.hypot(dx, dy), aa = Math.atan2(dy, dx);
            const rr = size * (0.38 + 0.62 * Math.pow(0.5 + 0.5 * Math.cos(4 * aa), 0.35));
            if (d <= rr) buf.set(px, py, mixRgb(mixRgb(gem2, WHITE, 0.45), gemC, d / rr), 255);
          }
        }
        buf.blend(x, y, WHITE, 250);
        break;
      case "gear": {
        const teeth = 8, r = size;
        for (let py = Math.floor(y - r * 1.35); py <= y + r * 1.35; py++) {
          for (let px = Math.floor(x - r * 1.35); px <= x + r * 1.35; px++) {
            const dx = px - x, dy = py - y, d = Math.hypot(dx, dy), aa = Math.atan2(dy, dx);
            const rr = r * (0.78 + 0.3 * Math.pow(Math.max(0, Math.cos(teeth * aa)), 0.5));
            if (d > rr || d < r * 0.28) continue;
            let col = mixRgb(shadeRgb(collarC, 0.38), shadeRgb(collarC, -0.32), clamp01((dx + r) / (2 * r)));
            if (d < r * 0.42) col = mixRgb(col, gemC, 0.65);
            buf.set(px, py, col, 255);
          }
        }
        break;
      }
      case "leaf":
      case "feather": {
        const len = size * (cfg.orbiterStyle === "leaf" ? 1.55 : 1.8), width = size * 0.68;
        const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
        line(
          x - ux * len * 0.75,
          y - uy * len * 0.75,
          x + ux * len * 0.75,
          y + uy * len * 0.75,
          Math.max(0.45 * S, size * 0.09),
          0.35 * S,
          mixRgb(gemC, WHITE, 0.32),
          gemC,
          WHITE,
          238
        );
        for (let q = 0; q < 5; q++) {
          const t = (q + 1) / 6, bx = x + (t - 0.5) * len * ux, by = y + (t - 0.5) * len * uy;
          const span = width * Math.sin(t * Math.PI);
          for (const side of [-1, 1]) line(
            bx,
            by,
            bx + side * span * vx,
            by + side * span * vy,
            0.45 * S,
            0.3 * S,
            mixRgb(gem2, WHITE, 0.25),
            gemC,
            WHITE,
            210
          );
        }
        break;
      }
      case "ember": {
        const flick = anim.flicker;
        buf.disc(x, y, size * 0.72, mixRgb(gem2, WHITE, 0.5), 235 * flick);
        buf.disc(x, y, size * 0.3, WHITE, 245 * flick);
        buf.disc(x - size * 0.1, y + size * 1.1, size * 0.26, gemC, 135);
        break;
      }
      case "snowflake": {
        const color = mixRgb(gem2, WHITE, 0.45);
        for (let q = 0; q < 6; q++) {
          const aa = q / 6 * Math.PI * 2;
          line(x, y, x + Math.cos(aa) * size, y + Math.sin(aa) * size, 0.65 * S, 0.38 * S, color, color, WHITE, 235);
          const bx = x + Math.cos(aa) * size * 0.62, by = y + Math.sin(aa) * size * 0.62;
          line(bx, by, bx + Math.cos(aa + 0.7) * size * 0.3, by + Math.sin(aa + 0.7) * size * 0.3, 0.42 * S, 0.28 * S, color, color, WHITE, 205);
        }
        buf.blend(x, y, WHITE, 250);
        break;
      }
      case "spark":
        buf.blend(x, y, WHITE, 255);
        line(x - size, y, x + size, y, 0.4 * S, 0.35 * S, gem2, gem2, WHITE, 210);
        line(x, y - size, x, y + size, 0.4 * S, 0.35 * S, gem2, gem2, WHITE, 210);
        break;
      case "skull": {
        const s = size * 0.95;
        buf.disc(x, y, s, [222, 218, 202], 255);
        buf.disc(x - s * 0.36, y - s * 0.05, s * 0.22, [16, 11, 22], 255);
        buf.disc(x + s * 0.36, y - s * 0.05, s * 0.22, [16, 11, 22], 255);
        buf.blend(x - s * 0.36, y - s * 0.05, gemC, 220);
        buf.blend(x + s * 0.36, y - s * 0.05, gemC, 220);
        break;
      }
      case "bubble": {
        const br = size * 0.9;
        buf.disc(x, y, br, mixRgb(gemC, WHITE, 0.3), 55);
        buf.ring(x, y, br, Math.max(0.5 * S, br * 0.14), mixRgb(gem2, WHITE, 0.5), 230);
        buf.blend(x - br * 0.32, y - br * 0.35, WHITE, 240);
        break;
      }
      case "card": {
        const w = size * 0.7, h = size;
        for (let py = Math.floor(y - h); py <= y + h; py++) for (let px = Math.floor(x - w); px <= x + w; px++) {
          const dx = Math.abs(px - x) / w, dy = Math.abs(py - y) / h;
          if (dx > 1 || dy > 1) continue;
          let col = mixRgb([247, 242, 224], [190, 180, 156], dx * 0.28 + dy * 0.35);
          if (dx > 0.82 || dy > 0.86) col = shadeRgb(col, -0.3);
          buf.set(px, py, col, 255);
        }
        paintFaceted(c, x, y, size * 0.3, "round", i);
        break;
      }
      case "gem-set": {
        const stones = 3;
        for (let q = 0; q < stones; q++) {
          const aa = a + (q - 1) * 0.72;
          const sz = size * (q === 1 ? 0.72 : 0.52);
          const gx = x + Math.cos(aa) * size * 0.45, gy = y + Math.sin(aa) * size * 0.45;
          paintFaceted(c, gx, gy, sz, q === 1 ? "diamond" : "marquise", q);
          buf.ring(gx, gy, sz * 1.12, Math.max(0.4 * S, sz * 0.09), collarC, 225);
        }
        break;
      }
      case "twin-gem":
        paintFaceted(c, x - size * 0.45, y, size * 0.67, "marquise", i);
        paintFaceted(c, x + size * 0.45, y, size * 0.67, "diamond", i + 1);
        buf.blend(x - size * 0.45, y - size * 0.3, WHITE, 220);
        break;
      case "crown":
        tinyCrown(c, x, y, size);
        break;
      case "prism-ring": {
        const rr = size * 1.05;
        for (let q = 0; q < 6; q++) {
          const aa = a + q / 6 * Math.PI * 2;
          paintFaceted(c, x + Math.cos(aa) * rr, y + Math.sin(aa) * rr * 0.65, size * 0.47, "diamond", q);
        }
        buf.ring(x, y, rr * 0.82, Math.max(0.45 * S, size * 0.06), mixRgb(gem2, WHITE, 0.4), 160);
        break;
      }
      case "petal-orbit":
        for (let q = 0; q < 6; q++) petal(c, x, y, size * 0.62, a + q / 6 * Math.PI * 2, q % 2 ? gemC : mixRgb(gemC, gem2, 0.35));
        buf.disc(x, y, size * 0.24, WHITE, 230);
        break;
      case "mini-moon": {
        orb(c, x, y, size * 0.9, mixRgb(gemC, WHITE, 0.12), gem2);
        buf.disc(x + size * 0.46, y - size * 0.16, size * 0.8, [9, 7, 18], 245);
        buf.ring(x, y, size * 0.95, Math.max(0.4 * S, size * 0.06), pal.haloC, 170);
        break;
      }
      case "sigil":
        drawRune(c, x, y, size * 1.15, i);
        break;
      case "gem-chain": {
        const rr = size * 0.62;
        buf.ring(x, y, rr, Math.max(0.55 * S, size * 0.12), collarC, 230);
        paintFaceted(c, x, y, size * 0.35, "diamond", i);
        buf.disc(x + size * 0.72, y + size * 0.38, Math.max(0.45 * S, size * 0.12), pal.gem2, 240);
        break;
      }
      case "constellation": {
        const starCount = 4;
        const pts = [];
        for (let q = 0; q < starCount; q++) {
          const aa = a + q / starCount * Math.PI * 2;
          pts.push([x + Math.cos(aa) * size * (0.35 + q % 2 * 0.4), y + Math.sin(aa) * size * (0.35 + q % 2 * 0.4)]);
        }
        for (let q = 0; q < pts.length; q++) {
          const [x0, y0] = pts[q], [x1, y1] = pts[(q + 1) % pts.length];
          line(x0, y0, x1, y1, 0.4 * S, 0.3 * S, mixRgb(gem2, WHITE, 0.45), gem2, WHITE, 150);
          buf.disc(x0, y0, Math.max(0.55 * S, size * 0.11), WHITE, 245);
        }
        buf.disc(x, y, Math.max(0.5 * S, size * 0.09), gemC, 225);
        break;
      }
      case "orbit-diamonds": {
        paintFaceted(c, x, y, size * 0.86, "diamond", i);
        for (let q = 0; q < 4; q++) {
          const aa = a + q * Math.PI / 2;
          buf.disc(x + Math.cos(aa) * size * 0.95, y + Math.sin(aa) * size * 0.95, Math.max(0.45 * S, size * 0.11), WHITE, 225);
        }
        break;
      }
      case "hourglass":
        hourglass(c, x, y, size * 0.85);
        break;
      case "snow-globe": {
        const gr = size * 0.92;
        buf.disc(x, y, gr, [203, 230, 255], 55);
        buf.ring(x, y, gr, Math.max(0.6 * S, size * 0.14), mixRgb([215, 235, 250], WHITE, 0.5), 240);
        for (let t = 0; t < 2; t++) {
          const half = (t + 1) * gr * 0.12;
          line(
            x - size * 0.18 - half,
            y + gr * 0.22 - t * gr * 0.2,
            x - size * 0.18 + half,
            y + gr * 0.22 - t * gr * 0.2,
            gr * 0.05,
            gr * 0.035,
            [52, 132, 74],
            [30, 92, 48],
            [150, 215, 150],
            235
          );
        }
        buf.disc(x - size * 0.18, y - gr * 0.04, gr * 0.05, [252, 220, 100], 240);
        buf.disc(x + size * 0.32, y + gr * 0.05, gr * 0.07, [255, 232, 148], 245);
        for (let q = 0; q < 6; q++) {
          const aa = a + q * 1.02;
          buf.blend(x + Math.cos(aa) * gr * 0.42, y + Math.sin(aa) * gr * 0.34, WHITE, 245);
        }
        break;
      }
      case "butterfly-swarm": {
        const wingSpan = size * 0.72;
        for (const sd of [-1, 1]) {
          for (let py = Math.floor(y - size * 0.5); py <= y + size * 0.15; py++) {
            for (let px = Math.floor(x + sd * 0.05 * size); sd > 0 ? px <= x + sd * wingSpan : px >= x + sd * wingSpan; px++) {
              if (sd < 0 && px > x - 0.05 * size) continue;
              if (sd > 0 && px < x + 0.05 * size) continue;
              const nx = sd * (px - x) / wingSpan, ny = (py - y) / size;
              const span = 0.85 - ny * ny * 0.62;
              if (nx > span || ny > 0.12 - nx * 0.2) continue;
              let col = mixRgb(gemC, gem2, ny * 0.5 + 0.4);
              if (nx > span - 0.16) col = shadeRgb(col, -0.3);
              buf.set(px, py, col, 245);
            }
          }
        }
        line(x, y - size * 0.45, x, y + size * 0.45, size * 0.07, size * 0.045, pal.collarC, shadeRgb(pal.collarC, -0.2), WHITE, 230);
        buf.disc(x, y - size * 0.4, size * 0.07, WHITE, 220);
        for (const sd of [-1, 1]) line(x, y - size * 0.44, x + sd * size * 0.18, y - size * 0.75, 0.35 * S, 0.3 * S, pal.collarC, pal.collarC, WHITE, 200);
        break;
      }
      case "prism-comet": {
        const tx = x - Math.cos(a) * size * 1.4, ty = y - Math.sin(a) * size * 1.1;
        line(x, y, tx, ty, size * 0.3, size * 0.05, pal.gem2, pal.gemC, WHITE, 210);
        const perpX = -Math.sin(a), perpY = Math.cos(a);
        for (let q = 0; q < 4; q++) {
          const t2 = q / 4;
          line(
            x + (tx - x) * t2 - perpX * size * 0.06,
            y + (ty - y) * t2 - perpY * size * 0.06,
            x + (tx - x) * t2 + perpX * size * 0.06,
            y + (ty - y) * t2 + perpY * size * 0.06,
            0.45 * S,
            0.25 * S,
            WHITE,
            mixRgb(gem2, WHITE, 0.5),
            WHITE,
            145 - q * 30
          );
        }
        paintCrystal(c, x, y, size * 0.62, pal.gem2, WHITE);
        buf.disc(x, y, size * 0.2, WHITE, 245);
        break;
      }
      case "pearl": {
        const rr = size * 0.85;
        for (let py = Math.floor(y - rr); py <= y + rr; py++) {
          for (let px = Math.floor(x - rr); px <= x + rr; px++) {
            const d = Math.hypot(px - x, py - y) / rr;
            if (d > 1) continue;
            let col = mixRgb([250, 246, 240], [214, 200, 182], d * d * 0.72);
            if (d < 0.55) col = mixRgb(col, gem2, 0.22);
            if ((px + py) % 2 === 0 && d > 0.35 && d < 0.7) col = shadeRgb(col, -0.05);
            if (d > 0.86) col = shadeRgb(col, -0.22);
            buf.set(px, py, col, 255);
          }
        }
        buf.blend(x - rr * 0.32, y - rr * 0.36, WHITE, 245);
        buf.blend(x - rr * 0.16, y - rr * 0.2, WHITE, 200);
        for (let q = 0; q < 5; q++) {
          const aa = a + q / 5 * Math.PI * 2;
          buf.blend(x + Math.cos(aa) * rr * 1.3, y + Math.sin(aa) * rr * 1.3, gem2, 145);
        }
        break;
      }
      case "comet-dust": {
        for (let q = 0; q < 3; q++) {
          const aa = a - q * 0.28;
          const px2 = headC[0] + Math.cos(aa) * orbitR, py2 = headC[1] + Math.sin(aa) * orbitR * 0.82;
          const sz = size * (0.68 - q * 0.16);
          buf.disc(px2, py2, Math.max(0.55 * S, sz), q === 0 ? WHITE : mixRgb(gem2, WHITE, 0.55), 240);
          buf.ring(px2, py2, size * (0.9 - q * 0.1), Math.max(0.35 * S, size * 0.05), mixRgb(pal.glowC, WHITE, 0.35), 150 - q * 25);
        }
        break;
      }
    }
  });
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/render/adornments.ts
function drawAdornments(c) {
  const { cfg, buf, geo, pal, S, W, rng, line } = c;
  const style = cfg.adornmentStyle ?? "none";
  const density = cfg.adornmentDensity ?? 0;
  if (style === "none" || density < 0.02) return;
  if (geo.shaftless && style !== "petal-mantle" && style !== "geodesic") return;
  const { posAt, dir, perp, headC, headR, collarPos, collarW } = geo;
  const count = Math.max(2, Math.round((3 + density * 10) * (W / 64)));
  const gold = pal.collarC, brightGold = mixRgb(gold, WHITE, 0.42);
  if (style === "filigree") {
    for (let i = 0; i < count; i++) {
      const t = 0.14 + i / count * 0.72;
      const [x, y] = posAt(t);
      const side = i % 2 ? -1 : 1;
      const r = Math.max(S * 1.3, collarW * (0.52 + density * 0.18));
      const cx = x + perp[0] * side * collarW * 0.28, cy = y + perp[1] * side * collarW * 0.28;
      let prev = null;
      for (let q = 0; q <= 22; q++) {
        const a = q / 22 * Math.PI * 1.7 + i * 0.24;
        const rr = r * (0.18 + q / 22 * 0.82);
        const p = [
          cx + perp[0] * Math.cos(a) * rr + dir[0] * Math.sin(a) * rr * 0.55,
          cy + perp[1] * Math.cos(a) * rr + dir[1] * Math.sin(a) * rr * 0.55
        ];
        if (prev) line(prev[0], prev[1], p[0], p[1], 0.55 * S, 0.36 * S, brightGold, shadeRgb(gold, -0.3), WHITE, 225);
        prev = p;
      }
      if (i % 3 === 0) buf.disc(cx, cy, Math.max(0.7 * S, collarW * 0.16), pal.gem2, 235);
    }
  } else if (style === "star-map") {
    const points = [];
    for (let i = 0; i < count + 2; i++) {
      const t = 0.08 + i / (count + 1) * 0.82;
      const [x, y] = posAt(t);
      const side = (i % 2 ? -1 : 1) * (collarW * (0.65 + rng() * 0.8));
      points.push([x + perp[0] * side, y + perp[1] * side]);
    }
    for (let i = 0; i < points.length - 1; i++) {
      if (i % 2 === 0 || density > 0.7) line(
        points[i][0],
        points[i][1],
        points[i + 1][0],
        points[i + 1][1],
        0.42 * S,
        0.32 * S,
        mixRgb(pal.gem2, WHITE, 0.45),
        pal.gemC,
        WHITE,
        142 + density * 50
      );
    }
    points.forEach(([x, y], i) => {
      buf.disc(x, y, Math.max(0.65 * S, W * 8e-3), i % 3 === 0 ? WHITE : pal.gem2, 230);
      if (i % 3 === 0) {
        buf.disc(x, y, Math.max(1.1 * S, W * 0.018), pal.glowC, 48);
        buf.blend(x - 0.4 * S, y - 0.4 * S, WHITE, 210);
      }
    });
  } else if (style === "thorn-vine") {
    const turns = 4 + density * 6, steps = Math.round(turns * 18);
    let last = null;
    for (let i = 0; i <= steps; i++) {
      const t = 0.07 + i / steps * 0.86;
      const [x, y] = posAt(t);
      const a = t * turns * Math.PI * 2;
      const p = [x + perp[0] * Math.cos(a) * collarW * 0.92, y + perp[1] * Math.cos(a) * collarW * 0.92];
      if (last) line(
        last[0],
        last[1],
        p[0],
        p[1],
        Math.max(0.45 * S, collarW * 0.13),
        Math.max(0.35 * S, collarW * 0.09),
        pal.wrapC,
        shadeRgb(pal.wrapC, -0.32),
        mixRgb(pal.wrapC, WHITE, 0.32),
        240
      );
      if (i % 6 === 0) {
        const side = Math.sin(a) > 0 ? 1 : -1;
        const tx = p[0] + perp[0] * side * collarW * 0.75 - dir[0] * collarW * 0.35;
        const ty = p[1] + perp[1] * side * collarW * 0.75 - dir[1] * collarW * 0.35;
        line(p[0], p[1], tx, ty, collarW * 0.15, 0.3 * S, [58, 125, 46], [35, 70, 28], [130, 190, 80], 240);
      }
      last = p;
    }
  } else if (style === "gold-pave") {
    const studs = Math.round(7 + density * 17);
    for (let i = 0; i < studs; i++) {
      const t = 0.08 + i / studs * 0.84;
      const [x, y] = posAt(t);
      const side = (i % 2 ? -1 : 1) * collarW * 0.28;
      const px = x + perp[0] * side, py = y + perp[1] * side;
      const r = Math.max(0.65 * S, collarW * (i % 4 === 0 ? 0.23 : 0.13));
      buf.disc(px, py, r * 1.45, shadeRgb(gold, -0.28), 190);
      buf.disc(px, py, r, i % 4 === 0 ? pal.gem2 : brightGold, 250);
      buf.blend(px - r * 0.35, py - r * 0.35, WHITE, 205);
    }
  } else if (style === "rune-engraving") {
    const n = Math.round(3 + density * 7);
    for (let i = 0; i < n; i++) {
      const t = 0.16 + i / Math.max(1, n - 1) * 0.68;
      const [x, y] = posAt(t);
      const cx = x + perp[0] * collarW * 0.3, cy = y + perp[1] * collarW * 0.3;
      const rw = Math.max(1.1 * S, collarW * 0.42), v = i % 4;
      const rc = mixRgb(pal.gem2, WHITE, 0.4);
      if (v === 0) {
        line(cx - rw * 0.45, cy + rw * 0.36, cx + rw * 0.34, cy - rw * 0.36, 0.55 * S, 0.35 * S, rc, pal.gemC, WHITE, 235);
        line(cx - rw * 0.24, cy - rw * 0.1, cx + rw * 0.45, cy + rw * 0.22, 0.45 * S, 0.3 * S, rc, pal.gemC, WHITE, 210);
      } else if (v === 1) {
        line(cx - rw * 0.4, cy, cx + rw * 0.4, cy, 0.55 * S, 0.35 * S, rc, pal.gemC, WHITE, 235);
        line(cx, cy - rw * 0.42, cx, cy + rw * 0.42, 0.55 * S, 0.35 * S, rc, pal.gemC, WHITE, 220);
      } else if (v === 2) {
        line(cx - rw * 0.4, cy - rw * 0.3, cx + rw * 0.4, cy + rw * 0.3, 0.55 * S, 0.35 * S, rc, pal.gemC, WHITE, 235);
        buf.disc(cx, cy, Math.max(0.4 * S, rw * 0.12), WHITE, 220);
      } else {
        buf.ring(cx, cy, rw * 0.36, Math.max(0.4 * S, rw * 0.08), rc, 205);
        line(cx - rw * 0.35, cy + rw * 0.38, cx + rw * 0.35, cy - rw * 0.38, 0.5 * S, 0.3 * S, rc, pal.gemC, WHITE, 225);
      }
    }
  } else if (style === "chain-drape") {
    for (const side of [-1, 1]) {
      const a = [collarPos[0] + perp[0] * side * collarW * 0.7, collarPos[1] + perp[1] * side * collarW * 0.7];
      const b = [headC[0] + perp[0] * side * headR * 0.9, headC[1] + perp[1] * side * headR * 0.9];
      const sag = headR * 0.4;
      let prev = a;
      const links = Math.round(8 + density * 10);
      for (let i = 1; i <= links; i++) {
        const t = i / links;
        const x = a[0] + (b[0] - a[0]) * t + perp[0] * side * sag * Math.sin(Math.PI * t);
        const y = a[1] + (b[1] - a[1]) * t + perp[1] * side * sag * Math.sin(Math.PI * t);
        buf.ring(x, y, Math.max(0.65 * S, collarW * 0.14), Math.max(0.4 * S, collarW * 0.055), i % 2 ? gold : brightGold, 225);
        if (i % 2 === 0) line(prev[0], prev[1], x, y, 0.36 * S, 0.28 * S, gold, shadeRgb(gold, -0.25), WHITE, 180);
        prev = [x, y];
      }
      paintFaceted(c, b[0], b[1], Math.max(S, headR * 0.14), "diamond", side);
    }
  } else if (style === "petal-mantle") {
    for (let i = 0; i < Math.round(6 + density * 6); i++) {
      const a = i / Math.round(6 + density * 6) * Math.PI * 2;
      const r = headR * (0.95 + i % 2 * 0.13);
      const x = headC[0] + Math.cos(a) * r, y = headC[1] + Math.sin(a) * r;
      const tangent = a + Math.PI / 2;
      for (let q = 0; q < 7; q++) {
        const t = q / 7, bx = x + Math.cos(tangent) * headR * 0.26 * (t - 0.5), by = y + Math.sin(tangent) * headR * 0.26 * (t - 0.5);
        const spread = headR * 0.12 * Math.sin(t * Math.PI);
        for (const side of [-1, 1]) buf.blend(
          bx + Math.cos(a) * spread * side,
          by + Math.sin(a) * spread * side,
          i % 2 ? pal.gem2 : pal.gemC,
          210
        );
      }
      buf.disc(x, y, Math.max(0.55 * S, headR * 0.045), WHITE, 185);
    }
  } else if (style === "geodesic") {
    const r = headR * 1.18;
    for (let ring = 0; ring < 3; ring++) {
      const phase = ring * Math.PI / 3;
      const points = [];
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2 + phase;
        points.push([headC[0] + Math.cos(a) * r, headC[1] + Math.sin(a) * r * (ring === 1 ? 0.42 : 0.78)]);
      }
      for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        line(a[0], a[1], b[0], b[1], 0.45 * S, 0.3 * S, gold, shadeRgb(gold, -0.25), brightGold, 200);
      }
    }
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      buf.disc(headC[0] + Math.cos(a) * r, headC[1] + Math.sin(a) * r * 0.78, Math.max(0.6 * S, headR * 0.06), pal.gem2, 230);
    }
  } else if (style === "braided") {
    const steps = Math.round(24 + density * 30), waves = 3 + density * 4;
    for (const offset of [-1, 1]) {
      let prev = null;
      for (let i = 0; i <= steps; i++) {
        const t = 0.08 + 0.84 * i / steps, [x, y] = posAt(t);
        const phase = t * waves * Math.PI * 2 + (offset > 0 ? Math.PI : 0);
        const p = [x + perp[0] * Math.cos(phase) * collarW * 0.64, y + perp[1] * Math.cos(phase) * collarW * 0.64];
        if (prev) line(prev[0], prev[1], p[0], p[1], 0.65 * S, 0.42 * S, offset > 0 ? brightGold : gold, shadeRgb(gold, -0.3), WHITE, 225);
        prev = p;
      }
    }
  }
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/render/item-signatures.ts
function drawItemSignature(c) {
  const { cfg, buf, geo, pal, S, W, line } = c;
  const { itemType } = cfg;
  const { headC, headR, collarPos, collarW, dir, perp, start, posAt } = geo;
  const { collarC, gemC, gem2 } = pal;
  if (itemType === "grimoire") {
    const w = headR * 0.88, h = headR * 0.92;
    const x0 = headC[0] - w * 0.8, x1 = headC[0] + w * 0.8;
    const y0 = headC[1] - h * 0.82, y1 = headC[1] + h * 0.82;
    for (const x of [x0, x1]) for (const y of [y0, y1]) {
      buf.disc(x, y, Math.max(0.7 * S, headR * 0.075), collarC, 245);
      buf.disc(x, y, Math.max(0.35 * S, headR * 0.035), mixRgb(collarC, WHITE, 0.5), 240);
    }
    line(headC[0] - w * 0.35, headC[1], headC[0] + w * 0.32, headC[1], 0.65 * S, 0.5 * S, gem2, collarC, WHITE, 220);
    line(headC[0], headC[1] - h * 0.3, headC[0], headC[1] + h * 0.28, 0.65 * S, 0.5 * S, gem2, collarC, WHITE, 220);
    buf.disc(headC[0], headC[1], headR * 0.11, mixRgb(gemC, WHITE, 0.45), 240);
  } else if (itemType === "focus-orb") {
    const r = headR * 1.08, th = Math.max(0.7 * S, W * 0.01);
    buf.ring(headC[0], headC[1], r, th, collarC, 230);
    buf.ring(headC[0], headC[1], r * 0.74, th * 0.65, mixRgb(collarC, WHITE, 0.4), 205);
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * Math.PI + (c.anim.on ? c.anim.t * c.anim.TAU * 0.12 : 0);
      line(
        headC[0] + Math.cos(a) * r,
        headC[1] + Math.sin(a) * r,
        headC[0] - Math.cos(a) * r,
        headC[1] - Math.sin(a) * r,
        th * 0.55,
        th * 0.55,
        collarC,
        shadeRgb(collarC, -0.32),
        mixRgb(collarC, WHITE, 0.5),
        215
      );
    }
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const x = headC[0] + Math.cos(a) * r, y = headC[1] + Math.sin(a) * r;
      buf.disc(x, y, Math.max(0.7 * S, r * 0.075), collarC, 245);
    }
    buf.disc(headC[0], headC[1], headR * 0.18, WHITE, 185);
  } else if (itemType === "censer") {
    const bowlR = headR * 0.68;
    for (const side of [-1, 1]) {
      const bx = headC[0] + side * bowlR * 0.7, by = headC[1] - bowlR * 0.58;
      line(collarPos[0] + side * collarW * 0.6, collarPos[1], bx, by, 0.65 * S, 0.4 * S, collarC, shadeRgb(collarC, -0.3), WHITE, 215);
      for (let q = 0; q < 3; q++) buf.disc(bx + (q - 1) * S * 1.2, by + q * S * 1.2, Math.max(0.45 * S, collarW * 0.1), collarC, 230);
    }
    for (let i = -2; i <= 2; i++) {
      const x = headC[0] + i * bowlR * 0.22;
      buf.blend(x, headC[1] + bowlR * 0.27, [16, 11, 22], 185);
      if (i === 0) buf.blend(x, headC[1] + bowlR * 0.25, mixRgb(gem2, WHITE, 0.6), 240);
    }
  } else if (itemType === "bell") {
    const r = headR * 0.72;
    buf.ring(headC[0], headC[1] - r * 0.75, r * 0.36, Math.max(0.65 * S, W * 8e-3), collarC, 240);
    for (let i = 0; i < 3; i++) {
      const y = headC[1] - r * 0.15 + i * r * 0.26;
      const span = r * (0.54 + i * 0.1);
      line(
        headC[0] - span,
        y,
        headC[0] + span,
        y,
        Math.max(0.45 * S, W * 7e-3),
        Math.max(0.35 * S, W * 5e-3),
        mixRgb(collarC, WHITE, i === 0 ? 0.42 : 0.16),
        shadeRgb(collarC, -0.3),
        WHITE,
        205
      );
    }
    buf.disc(headC[0], headC[1] + r * 0.78, Math.max(0.6 * S, r * 0.13), mixRgb(gemC, WHITE, 0.25), 245);
    for (let i = 0; i < 3; i++) {
      const a = Math.PI + (i - 1) * 0.28;
      buf.blend(headC[0] + Math.cos(a) * r * 0.65, headC[1] + Math.sin(a) * r * 0.9, WHITE, 100);
    }
  } else if (itemType === "talisman") {
    const r = headR * 1.25;
    const points = 18;
    let prev = null;
    for (let i = 0; i <= points; i++) {
      const a = Math.PI * 0.12 + i / points * Math.PI * 0.76;
      const x = headC[0] + Math.cos(a) * r, y = headC[1] - Math.sin(a) * r * 0.75;
      if (prev) line(prev[0], prev[1], x, y, 0.55 * S, 0.38 * S, collarC, shadeRgb(collarC, -0.28), mixRgb(collarC, WHITE, 0.35), 225);
      if (i % 3 === 0) buf.disc(x, y, Math.max(0.45 * S, W * 8e-3), gem2, 220);
      prev = [x, y];
    }
    buf.ring(headC[0], headC[1], headR * 0.72, Math.max(0.5 * S, W * 9e-3), mixRgb(collarC, WHITE, 0.35), 190);
  } else if (itemType === "spear") {
    const gx = headC[0] - dir[0] * headR * 0.5, gy = headC[1] - dir[1] * headR * 0.5;
    line(
      gx + perp[0] * headR * 0.95,
      gy + perp[1] * headR * 0.95,
      gx - perp[0] * headR * 0.95,
      gy - perp[1] * headR * 0.95,
      headR * 0.1,
      headR * 0.06,
      collarC,
      shadeRgb(collarC, -0.4),
      mixRgb(collarC, WHITE, 0.55)
    );
    for (let i = -1; i <= 1; i++) {
      const x = gx + dir[0] * i * headR * 0.2, y = gy + dir[1] * i * headR * 0.2;
      buf.disc(x, y, Math.max(0.5 * S, headR * 0.07), gemC, 245);
    }
  } else if (itemType === "cane") {
    const [sx, sy] = start;
    const r = Math.max(collarW * 1.35, headR * 0.14);
    let last = [sx, sy];
    for (let i = 1; i <= 15; i++) {
      const t = i / 15, a = Math.PI * 0.9 + t * Math.PI * 1.5;
      const x = sx + Math.cos(a) * r, y = sy - r * 0.4 + Math.sin(a) * r;
      line(last[0], last[1], x, y, r * (0.28 - t * 0.08), r * (0.22 - t * 0.08), pal.shaftC, pal.shaftD, mixRgb(pal.shaftC, WHITE, 0.3));
      last = [x, y];
    }
    buf.disc(last[0], last[1], Math.max(0.6 * S, r * 0.15), collarC, 235);
  } else if (itemType === "wand") {
    for (const t of [0.24, 0.37, 0.5]) {
      const [x, y] = posAt(t);
      line(
        x - perp[0] * collarW * 0.7,
        y - perp[1] * collarW * 0.7,
        x + perp[0] * collarW * 0.7,
        y + perp[1] * collarW * 0.7,
        Math.max(0.5 * S, collarW * 0.22),
        Math.max(0.35 * S, collarW * 0.16),
        collarC,
        shadeRgb(collarC, -0.32),
        mixRgb(collarC, WHITE, 0.45),
        210
      );
    }
  } else if (itemType === "rod") {
    buf.ring(headC[0], headC[1], headR * 0.88, Math.max(0.5 * S, W * 8e-3), collarC, 175);
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2;
      const x = headC[0] + Math.cos(a) * headR * 0.9, y = headC[1] + Math.sin(a) * headR * 0.9;
      buf.disc(x, y, Math.max(0.45 * S, W * 6e-3), mixRgb(collarC, WHITE, 0.4), 230);
    }
  } else if (itemType === "scepter") {
    for (const t of [0.89, 0.95]) {
      const [x, y] = posAt(t);
      line(
        x - perp[0] * collarW * 1.15,
        y - perp[1] * collarW * 1.15,
        x + perp[0] * collarW * 1.15,
        y + perp[1] * collarW * 1.15,
        collarW * 0.28,
        collarW * 0.19,
        collarC,
        shadeRgb(collarC, -0.38),
        mixRgb(collarC, WHITE, 0.55)
      );
    }
    buf.disc(headC[0] - geo.dir[0] * headR * 0.68, headC[1] - geo.dir[1] * headR * 0.68, headR * 0.12, pal.gem2, 235);
  }
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/render/fx.ts
var EMBER_PAL = [[255, 120, 40], [255, 200, 90], [255, 80, 60], [255, 240, 200]];
function drawParticles(c) {
  const { cfg, buf, geo, pal, anim, S, N, W, rng, line } = c;
  const { headC, headR } = geo;
  const partC = pal.partC;
  const TAU = anim.TAU;
  const pRng = mulberry32(cfg.seed * 17 + 3);
  const pData = Array.from({ length: cfg.particles }, () => ({
    a: pRng() * Math.PI * 2,
    r: headR * (1.18 + pRng() * 1.4),
    ph: pRng(),
    tw: 150 + Math.floor(pRng() * 105),
    big: pRng() < 0.3
  }));
  for (let i = 0; i < cfg.particles; i++) {
    const { a: a0, r: rad0, ph, tw, big: big0 } = pData[i];
    let px0 = headC[0] + Math.cos(a0) * rad0, py0 = headC[1] + Math.sin(a0) * rad0;
    if (anim.on) {
      const drift = anim.t + ph;
      switch (anim.type) {
        case "bubbles-rise":
          py0 -= Math.sin(drift * TAU) * headR * 0.5;
          px0 += Math.sin(drift * TAU * 2) * headR * 0.08;
          break;
        case "petal-drift":
          py0 += Math.sin(drift * TAU) * headR * 0.6;
          px0 += Math.cos(drift * TAU * 1.3) * headR * 0.25;
          break;
        case "ember-swirl":
        case "flame-flicker":
          py0 -= Math.sin(drift * TAU) * headR * 0.9;
          px0 += Math.cos(a0 * 3 + drift * TAU * 2) * headR * 0.2;
          break;
        case "frost-shimmer":
          px0 += Math.sin(drift * TAU + ph * 7) * headR * 0.08;
          py0 += Math.cos(drift * TAU + ph * 7) * headR * 0.08;
          break;
        case "sparkle-cascade":
          px0 += Math.sin(drift * TAU * 2 + ph * 6) * headR * 0.18;
          py0 -= Math.sin(drift * TAU) * headR * 1;
          break;
        case "sakura-fall":
          px0 += Math.sin(drift * TAU * 3 + ph * 4) * headR * 0.3;
          py0 += drift % 1 * headR * 1.1 - headR * 0.55;
          break;
      }
    }
    const px = Math.round(px0), py = Math.round(py0);
    if (px < 0 || py < 0 || px >= W || py >= W) continue;
    if (buf.alpha(px, py) > 40 && rng() < 0.75) continue;
    let st = cfg.particleStyle;
    if (st === "mixed") st = ["sparkle", "dots", "plus", "diamonds"][Math.floor(rng() * 4)];
    const big = N >= 64 && big0;
    const alpha = tw * (anim.type === "flame-flicker" || anim.type === "ember-swirl" ? anim.flicker : 1);
    const plus = (col, k) => {
      buf.blend(px + 1, py, col, alpha * k);
      buf.blend(px - 1, py, col, alpha * k);
      buf.blend(px, py + 1, col, alpha * k);
      buf.blend(px, py - 1, col, alpha * k);
    };
    switch (st) {
      case "sparkle":
        buf.blend(px, py, rng() < 0.4 ? WHITE : partC, alpha);
        plus(partC, 0.7);
        if (big) {
          buf.blend(px + 2, py, partC, alpha * 0.35);
          buf.blend(px - 2, py, partC, alpha * 0.35);
          buf.blend(px, py + 2, partC, alpha * 0.35);
          buf.blend(px, py - 2, partC, alpha * 0.35);
        }
        break;
      case "dots": {
        const col = rng() < 0.3 ? WHITE : partC;
        buf.blend(px, py, col, alpha);
        if (big) {
          buf.blend(px + 1, py, col, alpha * 0.8);
          buf.blend(px, py + 1, col, alpha * 0.8);
        }
        break;
      }
      case "plus":
        buf.blend(px, py, WHITE, alpha);
        plus(WHITE, 0.6);
        break;
      case "diamonds":
        buf.blend(px, py, WHITE, alpha);
        plus(partC, 0.8);
        if (big) {
          buf.blend(px + 1, py + 1, partC, alpha * 0.4);
          buf.blend(px - 1, py - 1, partC, alpha * 0.4);
        }
        break;
      case "embers": {
        const col = EMBER_PAL[Math.floor(rng() * EMBER_PAL.length)];
        buf.blend(px, py, col, alpha);
        buf.blend(px, py - 1, col, alpha * 0.4);
        if (big) buf.blend(px, py + 1, col, alpha * 0.3);
        break;
      }
      case "bubbles": {
        const br = big ? 2.4 * S : 1.6 * S;
        for (let yy = -3 * S; yy <= 3 * S; yy++) for (let xx = -3 * S; xx <= 3 * S; xx++) {
          if (Math.abs(Math.hypot(xx, yy) - br) < 0.7) buf.blend(px + xx, py + yy, partC, alpha * 0.8);
        }
        buf.blend(px - 1, py - 1, WHITE, 205);
        break;
      }
      case "snow": {
        const sr = big ? 2.2 * S : 1.4 * S;
        for (let k = 0; k < 3; k++) {
          const a2 = k / 3 * Math.PI;
          line(px - Math.cos(a2) * sr, py - Math.sin(a2) * sr, px + Math.cos(a2) * sr, py + Math.sin(a2) * sr, 0.6 * S, 0.6 * S, partC, partC, WHITE, alpha * 0.9);
        }
        buf.blend(px, py, WHITE, 245);
        break;
      }
      case "leaf": {
        const lr = big ? 2.6 * S : 1.8 * S;
        for (let y = Math.floor(py - lr); y <= py + lr; y++) {
          for (let x = Math.floor(px - lr * 0.6); x <= px + lr * 0.6; x++) {
            const dx = (x - px) / (lr * 0.6), dy = (y - py) / lr;
            if (dx * dx + dy * dy > 1) continue;
            buf.blend(x, y, mixRgb(shadeRgb(partC, 0.2), shadeRgb(partC, -0.2), clamp01((dy + 1) / 2)), alpha);
          }
        }
        buf.blend(px, py, WHITE, 180);
        break;
      }
      case "stars": {
        const sr = big ? 2.6 * S : 1.8 * S;
        for (let y = Math.floor(py - sr); y <= py + sr; y++) {
          for (let x = Math.floor(px - sr); x <= px + sr; x++) {
            const dx = x - px, dy = y - py;
            const d = Math.hypot(dx, dy);
            const a2 = Math.atan2(dy, dx);
            const rr = sr * (0.34 + 0.66 * Math.pow(0.5 + 0.5 * Math.cos(5 * a2 - Math.PI / 2), 0.5));
            if (d <= rr) buf.blend(x, y, mixRgb(WHITE, partC, d / Math.max(0.5, rr)), alpha);
          }
        }
        break;
      }
      case "runes": {
        const rr = big ? 2.2 * S : 1.6 * S;
        buf.ring(px, py, rr, Math.max(0.5 * S, rr * 0.3), partC, alpha * 0.9);
        line(px - rr * 0.5, py, px + rr * 0.5, py, 0.5 * S, 0.5 * S, WHITE, WHITE, WHITE, alpha);
        line(px, py - rr * 0.55, px, py + rr * 0.55, 0.5 * S, 0.5 * S, WHITE, WHITE, WHITE, alpha * 0.85);
        break;
      }
      case "hearts": {
        const hr = big ? 2.3 * S : 1.6 * S;
        for (let y = Math.floor(py - hr); y <= py + hr * 1.2; y++) {
          for (let x = Math.floor(px - hr); x <= px + hr; x++) {
            const nx = (x - px) / hr, my = -((y - py) / hr - 0.2);
            if (Math.pow(nx * nx + my * my - 0.5, 3) - nx * nx * my * my * my > 0) continue;
            buf.blend(x, y, mixRgb(partC, WHITE, 0.25), alpha);
          }
        }
        break;
      }
      case "ash": {
        const col = mixRgb(partC, [70, 66, 62], 0.55);
        buf.blend(px, py, col, alpha);
        if (big) {
          buf.blend(px + 1, py, col, alpha * 0.6);
          buf.blend(px, py + 1, shadeRgb(col, -0.2), alpha * 0.5);
        }
        buf.blend(px, py - 1, mixRgb(col, WHITE, 0.25), alpha * 0.35);
        break;
      }
      case "musical": {
        const nr = big ? 2.2 * S : 1.5 * S;
        buf.disc(px, py + nr * 0.5, nr * 0.55, partC, alpha);
        line(px + nr * 0.5, py + nr * 0.5, px + nr * 0.5, py - nr, 0.5 * S, 0.5 * S, partC, partC, WHITE, alpha);
        line(px + nr * 0.5, py - nr, px + nr * 1.2, py - nr * 0.55, 0.5 * S, 0.4 * S, partC, partC, WHITE, alpha * 0.9);
        break;
      }
      case "firefly": {
        const spec = big ? 1.9 * S : 1.4 * S;
        buf.disc(px, py, spec, mixRgb(partC, WHITE, 0.9), alpha * 0.9);
        buf.disc(px, py, spec * 0.55, [255, 246, 190], alpha);
        for (let q = 0; q < 3; q++) {
          buf.blend(px - S * 1.1 * (q + 1) * (i % 2 ? 1 : -1), py - S * 0.5 * q, mixRgb(partC, [255, 220, 130], 0.5), alpha * (0.4 - q * 0.1));
        }
        if (big) buf.ring(px, py, spec * 2.2, 0.5 * S, partC, alpha * 0.22);
        break;
      }
      case "glow-dust": {
        const ep = big ? 1.2 * S : 0.85 * S;
        buf.disc(px, py, ep, mixRgb(partC, WHITE, 0.75), alpha);
        buf.blend(px + 1, py, partC, alpha * 0.5);
        buf.blend(px, py + 1, partC, alpha * 0.45);
        if (big) {
          buf.disc(px, py, ep * 2.3, partC, alpha * 0.22);
          buf.blend(px, py - 1, WHITE, alpha * 0.85);
        } else {
          buf.blend(px, py - 1, WHITE, alpha * 0.75);
        }
        break;
      }
    }
  }
}
function applyWear(c) {
  const { cfg, buf, W, S, rng } = c;
  const style = cfg.wearStyle ?? "none";
  const amt = cfg.wearAmount ?? 0;
  if (style === "none" || amt <= 0.01) return;
  const solid = [];
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (buf.alpha(x, y) > 200) solid.push([x, y]);
  if (solid.length === 0) return;
  const pickPx = () => solid[Math.floor(rng() * solid.length)];
  const speck = (x, y, col, a) => {
    const bx = Math.floor(x / S) * S, by = Math.floor(y / S) * S;
    for (let dy = 0; dy < S; dy++) {
      for (let dx = 0; dx < S; dx++) {
        if (buf.alpha(bx + dx, by + dy) > 60) buf.blend(bx + dx, by + dy, col, a);
      }
    }
  };
  switch (style) {
    case "chipped": {
      const edges = solid.filter(([x, y]) => buf.alpha(x + S, y) < 40 || buf.alpha(x - S, y) < 40 || buf.alpha(x, y + S) < 40 || buf.alpha(x, y - S) < 40);
      if (edges.length === 0) break;
      const bites = Math.max(3, Math.round(edges.length * amt * 0.035));
      for (let i = 0; i < bites; i++) {
        const [cx, cy] = edges[Math.floor(rng() * edges.length)];
        const r = (0.7 + rng() * 1.1) * S;
        for (let y = Math.floor(cy - r); y <= cy + r; y++) {
          for (let x = Math.floor(cx - r); x <= cx + r; x++) {
            if (Math.hypot(x - cx, y - cy) > r) continue;
            buf.set(x, y, [0, 0, 0], 0);
          }
        }
        for (let y = Math.floor(cy - r - S); y <= cy + r + S; y++) {
          for (let x = Math.floor(cx - r - S); x <= cx + r + S; x++) {
            const d = Math.hypot(x - cx, y - cy);
            if (d > r && d <= r + S && buf.alpha(x, y) > 60) buf.blend(x, y, [30, 22, 26], 190 * amt);
          }
        }
      }
      break;
    }
    case "cracked":
      for (let n = 0; n < Math.max(5, Math.round(amt * 16)); n++) {
        let [x, y] = pickPx();
        let a = rng() * Math.PI * 2;
        const steps = 18 + rng() * 26;
        for (let s = 0; s < steps; s++) {
          a += (rng() - 0.5) * 0.8;
          x += Math.cos(a) * S;
          y += Math.sin(a) * S;
          if (buf.alpha(Math.round(x), Math.round(y)) < 60) break;
          buf.blend(x, y, [16, 10, 18], 240 * amt);
          if (S > 1) buf.blend(x + 1, y, [16, 10, 18], 150 * amt);
          if (rng() < 0.3) buf.blend(x - 1, y - 1, [250, 250, 255], 110 * amt);
          if (rng() < 0.07) {
            let bx = x, by = y, ba = a + (rng() < 0.5 ? 1 : -1) * 0.9;
            for (let k = 0; k < 6 + rng() * 8; k++) {
              bx += Math.cos(ba) * S;
              by += Math.sin(ba) * S;
              if (buf.alpha(Math.round(bx), Math.round(by)) < 60) break;
              buf.blend(bx, by, [16, 10, 18], 190 * amt);
            }
          }
        }
      }
      break;
    case "scratched":
      for (let n = 0; n < Math.max(8, Math.round(amt * 38)); n++) {
        const [sx, sy] = pickPx();
        const a = -Math.PI / 4 + (rng() - 0.5) * 0.8;
        const len = (4 + rng() * 14) * S;
        const bright = rng() < 0.5;
        for (let s = 0; s < len; s++) {
          const x = sx + Math.cos(a) * s, y = sy + Math.sin(a) * s;
          if (buf.alpha(Math.round(x), Math.round(y)) < 60) break;
          buf.blend(x, y, bright ? [255, 255, 255] : [38, 30, 38], 175 * amt);
        }
      }
      break;
    case "burned": {
      const n = Math.round(solid.length / (S * S) * amt * 0.5);
      for (let i = 0; i < n; i++) {
        const [x, y] = pickPx();
        const soot = rng();
        if (soot < 0.58) speck(x, y, [24, 18, 17], 215 * amt);
        else if (soot < 0.84) speck(x, y, [74, 41, 22], 195 * amt);
        else speck(x, y, [255, 143, 48], 200 * amt);
      }
      break;
    }
    case "mossy": {
      const n = Math.round(solid.length / (S * S) * amt * 0.55);
      for (let i = 0; i < n; i++) {
        const [x, y] = pickPx();
        if (rng() > 0.25 + 0.75 * (y / W)) continue;
        const g = rng();
        speck(x, y, g < 0.55 ? [56, 102, 46] : g < 0.85 ? [88, 140, 62] : [124, 170, 90], 225 * amt);
      }
      break;
    }
    case "frosted-over": {
      const n = Math.round(solid.length / (S * S) * amt * 0.55);
      for (let i = 0; i < n; i++) {
        const [x, y] = pickPx();
        if (rng() > 0.3 + 0.7 * (1 - y / W)) continue;
        speck(x, y, rng() < 0.65 ? [210, 236, 255] : [255, 255, 255], 215 * amt);
      }
      break;
    }
    case "blood-stained":
      for (let n = 0; n < Math.max(3, Math.round(amt * 9)); n++) {
        const [sx, sy] = pickPx();
        const r = (1.2 + rng() * 2.4) * S;
        for (let y = Math.floor(sy - r); y <= sy + r; y++) {
          for (let x = Math.floor(sx - r); x <= sx + r; x++) {
            if (Math.hypot(x - sx, y - sy) > r || buf.alpha(x, y) < 60) continue;
            buf.blend(x, y, rng() < 0.75 ? [122, 18, 22] : [162, 34, 30], 215 * amt);
          }
        }
        for (let d = 0; d < r * 3; d++) {
          const y = sy + r * 0.6 + d;
          if (buf.alpha(Math.round(sx), Math.round(y)) < 60) break;
          buf.blend(sx, y, [104, 14, 18], 185 * amt * (1 - d / (r * 3)));
        }
      }
      break;
  }
}
function drawAnimEmbellish(c) {
  const { cfg, buf, geo, pal, anim, S, W, small, rng, line } = c;
  if (!anim.on || small) return;
  const { headC, headR } = geo;
  const { gemC, glowC } = pal;
  const aInt = anim.intensity;
  if (anim.type === "frost-shimmer" || cfg.element === "ice") {
    const n = Math.round(10 * aInt);
    const fc = mixRgb(gemC, WHITE, 0.6);
    for (let i = 0; i < n; i++) {
      const ang = rng() * Math.PI * 2, rad = headR * (0.5 + rng() * 1.5);
      const px = headC[0] + Math.cos(ang) * rad, py = headC[1] + Math.sin(ang) * rad;
      if (anim.frostBlink * rng() > 0.4) {
        buf.blend(px, py, WHITE, 255 * aInt);
        buf.blend(px + 1, py, fc, 180 * aInt);
        buf.blend(px - 1, py, fc, 180 * aInt);
        buf.blend(px, py + 1, fc, 180 * aInt);
        buf.blend(px, py - 1, fc, 180 * aInt);
      }
    }
  }
  if (anim.lightningOn) {
    const branches = 2 + Math.floor(rng() * 2);
    for (let b = 0; b < branches; b++) {
      const ang = rng() * Math.PI * 2;
      let x = headC[0], y = headC[1];
      const steps = 6 + Math.floor(rng() * 4);
      for (let s = 0; s < steps; s++) {
        const nx = x + (Math.cos(ang) + (rng() - 0.5) * 0.9) * headR * 0.35;
        const ny = y + (Math.sin(ang) + (rng() - 0.5) * 0.9) * headR * 0.35;
        line(x, y, nx, ny, 0.9 * S, 0.4 * S, WHITE, [200, 200, 255], WHITE, 255);
        line(x, y, nx, ny, 2.2 * S, 0.8 * S, glowC, glowC, glowC, 90);
        x = nx;
        y = ny;
      }
    }
  }
  if (anim.type === "void-breath") {
    const breath = 0.5 + 0.5 * Math.sin(anim.t * anim.TAU);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * anim.TAU + anim.t * 0.8;
      const r = headR * (1.3 + breath * 0.6 + rng() * 0.2);
      const px = headC[0] + Math.cos(a) * r, py = headC[1] + Math.sin(a) * r;
      buf.disc(px, py, headR * 0.28 * breath, [18, 10, 32], 120 * aInt);
      buf.ring(px, py, headR * 0.28 * breath, Math.max(0.7 * S, W * 7e-3), mixRgb(gemC, WHITE, 0.2), 80 * aInt);
    }
  }
}
function drawMotif(c) {
  const { cfg, buf, geo, pal, S, W, small, line } = c;
  if (cfg.motif === "none" || cfg.motifIntensity <= 0.02 || small) return;
  const { headC, headR } = geo;
  const { gemC, gem2 } = pal;
  const rng2 = mulberry32(cfg.seed * 7 + 13);
  const cnt = Math.max(2, Math.round(2 + cfg.motifIntensity * 9));
  const mI = cfg.motifIntensity;
  for (let i = 0; i < cnt; i++) {
    const a = rng2() * Math.PI * 2 + i / cnt * Math.PI * 2;
    const rad = headR * (1.1 + rng2() * 1.5);
    const px = headC[0] + Math.cos(a) * rad, py = headC[1] + Math.sin(a) * rad;
    if (px < 0 || py < 0 || px >= W || py >= W) continue;
    const sc = headR * 0.16;
    switch (cfg.motif) {
      case "flame": {
        const fy = py + sc * 1.2, fr = sc * 0.7;
        for (let y = Math.floor(fy - fr * 2.2); y <= fy + fr; y++) {
          for (let x = Math.floor(px - fr); x <= px + fr; x++) {
            const dd = ((x - px) / fr) ** 2 + ((y - fy) / (fr * 2)) ** 2;
            if (dd <= 1) buf.blend(x, y, mixRgb(gem2, mixRgb(gemC, WHITE, 0.45), dd), 235 * (1 - dd * 0.4) * mI);
          }
        }
        break;
      }
      case "frost": {
        const fc = mixRgb(gem2, WHITE, 0.4);
        for (let k = 0; k < 6; k++) {
          const a2 = k / 6 * Math.PI * 2;
          line(px, py, px + Math.cos(a2) * sc * 1.2, py + Math.sin(a2) * sc * 1.2, 0.7 * S, 0.5 * S, fc, fc, WHITE, 235 * mI);
        }
        buf.blend(px, py, WHITE, 250 * mI);
        break;
      }
      case "bolt": {
        let bx = px, by = py;
        for (let k = 0; k < 4; k++) {
          const nx = bx + (rng2() - 0.5) * sc * 2.2, ny = by + sc * (0.6 + rng2() * 0.6);
          line(bx, by, nx, ny, 0.8 * S, 0.6 * S, mixRgb(gem2, WHITE, 0.5), gemC, WHITE, 235 * mI);
          bx = nx;
          by = ny;
        }
        break;
      }
      case "leaf": {
        const lr = sc * 1.4;
        for (let y = Math.floor(py - lr); y <= py + lr; y++) {
          for (let x = Math.floor(px - lr * 0.6); x <= px + lr * 0.6; x++) {
            const dx = (x - px) / (lr * 0.6), dy = (y - py) / lr;
            const m = dx * dx + dy * dy;
            if (m <= 1) buf.blend(x, y, mixRgb(shadeRgb(gemC, 0.25), shadeRgb(gemC, -0.25), clamp01((dy + 1) / 2)), 230 * (1 - m * 0.3) * mI);
          }
        }
        break;
      }
      case "rays": {
        const a2 = rng2() * Math.PI * 2;
        line(px, py, px + Math.cos(a2) * sc * 2.4, py + Math.sin(a2) * sc * 2.4, 0.9 * S, 0.3 * S, mixRgb(gem2, WHITE, 0.5), gemC, WHITE, 235 * mI);
        break;
      }
      case "wisp": {
        const wr = sc * 0.9;
        for (let y = Math.floor(py - wr * 1.6); y <= py + wr * 0.8; y++) {
          for (let x = Math.floor(px - wr); x <= px + wr; x++) {
            const dd = ((x - px) / wr) ** 2 + ((y - py) / (wr * 1.4)) ** 2;
            if (dd <= 1) buf.blend(x, y, mixRgb([30, 20, 50], mixRgb(gemC, WHITE, 0.4), 1 - dd), 215 * (1 - dd * 0.5) * mI);
          }
        }
        buf.blend(px, py - wr * 0.3, WHITE, 190 * mI);
        break;
      }
      case "rune": {
        const rc = mixRgb(gem2, WHITE, 0.55), s2 = sc * 1.1;
        buf.disc(px, py, s2 * 0.75, rc, 225 * mI);
        buf.disc(px, py, s2 * 0.42, WHITE, 215 * mI);
        line(px - s2 * 0.35, py, px + s2 * 0.35, py, 0.7 * S, 0.7 * S, gemC, gemC, WHITE, 235 * mI);
        line(px, py - s2 * 0.4, px, py + s2 * 0.4, 0.7 * S, 0.7 * S, gemC, gemC, WHITE, 235 * mI);
        break;
      }
      case "drip": {
        const dr = sc * 0.5;
        for (let y = Math.floor(py); y <= py + sc * 2.2; y++) {
          const f = (y - py) / (sc * 2.2);
          const rr = dr * Math.sin(Math.PI * clamp01(f)) * 0.9 + 0.3;
          for (let x = Math.floor(px - rr); x <= px + rr; x++) if (Math.abs(x - px) <= rr) buf.blend(x, y, mixRgb(gemC, WHITE, 0.25 * (1 - f)), 230 * mI);
        }
        buf.blend(px, py, WHITE, 220 * mI);
        break;
      }
      case "wave":
        for (let k = 0; k < 10; k++) {
          const t2 = k / 10;
          buf.blend(px - sc * 1.4 + t2 * sc * 2.8, py + Math.sin(t2 * Math.PI * 2) * sc * 0.45, mixRgb(gem2, WHITE, 0.4), 225 * mI);
        }
        break;
      case "rock": {
        const rr = sc * (0.7 + rng2() * 0.5);
        for (let y = Math.floor(py - rr); y <= py + rr; y++) {
          for (let x = Math.floor(px - rr); x <= px + rr; x++) {
            const dd = Math.hypot(x - px, y - py) / rr;
            if (dd > 1) continue;
            let col = mixRgb(shadeRgb(gemC, 0.25), shadeRgb(gemC, -0.3), clamp01(dd));
            if (rng2() < 0.2) col = shadeRgb(col, -0.2);
            buf.blend(x, y, col, 235 * mI);
          }
        }
        break;
      }
      case "void": {
        const vr = sc * 0.9;
        buf.ring(px, py, vr, Math.max(0.7 * S, W * 0.01), [12, 8, 22], 240 * mI);
        buf.ring(px, py, vr * 1.5, Math.max(0.6 * S, W * 8e-3), mixRgb(gemC, WHITE, 0.3), 190 * mI);
        buf.blend(px, py, WHITE, 240 * mI);
        buf.blend(px + 2, py - 1, WHITE, 150 * mI);
        break;
      }
      case "constellation": {
        const starR = sc * 0.8;
        buf.disc(px, py, starR * 0.6, WHITE, 255 * mI);
        buf.ring(px, py, starR * 1.2, Math.max(0.6 * S, W * 8e-3), [147, 197, 253], 220 * mI);
        line(px, py, headC[0], headC[1], 0.5 * S, 0.3 * S, [191, 219, 254], [147, 197, 253], WHITE, 160 * mI);
        break;
      }
      case "sculk-tendril": {
        let tx = px, ty = py;
        for (let s = 0; s < 3; s++) {
          const ntx = tx + (rng2() - 0.5) * sc * 2, nty = ty - sc * (0.8 + rng2() * 0.5);
          line(tx, ty, ntx, nty, 0.9 * S, 0.5 * S, [6, 182, 212], [4, 30, 36], [20, 184, 166], 240 * mI);
          tx = ntx;
          ty = nty;
        }
        buf.disc(tx, ty, sc * 0.45, [6, 182, 212], 255 * mI);
        buf.blend(tx, ty, WHITE, 200 * mI);
        break;
      }
      case "mana-weave": {
        const rad2 = sc * 1.5;
        for (let q = 0; q < 8; q++) {
          const ma = q / 8 * Math.PI * 2;
          const mx = px + Math.cos(ma) * rad2, my = py + Math.sin(ma) * rad2 * 0.6;
          buf.blend(mx, my, [34, 211, 238], 220 * mI);
          buf.blend(mx + 1, my, [74, 222, 128], 150 * mI);
        }
        buf.blend(px, py, WHITE, 240 * mI);
        break;
      }
      case "chains": {
        const links = 4;
        for (let q = 0; q < links; q++) {
          const lx = px + q * sc * 0.85, ly = py + Math.sin(q * 1.1) * sc * 0.35;
          buf.ring(lx, ly, sc * 0.42, Math.max(0.5 * S, sc * 0.18), q % 2 ? shadeRgb(gemC, -0.2) : mixRgb(gemC, WHITE, 0.3), 235 * mI);
        }
        break;
      }
      case "feathers": {
        const fl = sc * 1.6;
        line(px, py + fl * 0.4, px, py - fl * 0.5, 0.6 * S, 0.4 * S, mixRgb(gem2, WHITE, 0.4), gemC, WHITE, 235 * mI);
        for (let q = 0; q < 5; q++) {
          const t = q / 5;
          const yy = py + fl * 0.3 - t * fl * 0.8;
          const sp = sc * 0.7 * Math.sin(t * Math.PI);
          for (const sd of [-1, 1]) line(px, yy, px + sd * sp, yy - sp * 0.35, 0.5 * S, 0.3 * S, mixRgb(gemC, WHITE, 0.35), gemC, WHITE, 225 * mI);
        }
        break;
      }
      case "gears": {
        const gr = sc * 0.9, teeth = 6;
        for (let y = Math.floor(py - gr * 1.4); y <= py + gr * 1.4; y++) {
          for (let x = Math.floor(px - gr * 1.4); x <= px + gr * 1.4; x++) {
            const dx = x - px, dy = y - py;
            const d = Math.hypot(dx, dy), a2 = Math.atan2(dy, dx);
            const rr = gr * (0.76 + 0.32 * Math.pow(Math.max(0, Math.cos(teeth * a2)), 0.5));
            if (d > rr || d < gr * 0.3) continue;
            buf.blend(x, y, mixRgb(shadeRgb(gemC, 0.3), shadeRgb(gemC, -0.3), clamp01((dx + gr) / (2 * gr))), 235 * mI);
          }
        }
        break;
      }
      case "shards": {
        for (let q = 0; q < 3; q++) {
          const a2 = rng2() * Math.PI * 2;
          const sx = px + Math.cos(a2) * sc * 0.9, sy = py + Math.sin(a2) * sc * 0.9;
          const h = sc * (0.7 + rng2() * 0.6);
          for (let y = Math.floor(sy - h); y <= sy + h; y++) {
            for (let x = Math.floor(sx - h * 0.4); x <= sx + h * 0.4; x++) {
              const m = Math.abs(x - sx) / (h * 0.4) + Math.abs(y - sy) / h;
              if (m > 1) continue;
              buf.blend(x, y, mixRgb(mixRgb(gem2, WHITE, 0.45), gemC, m), 235 * mI);
            }
          }
        }
        break;
      }
      case "petals": {
        for (let q = 0; q < 5; q++) {
          const a2 = q / 5 * Math.PI * 2 + rng2();
          const cx2 = px + Math.cos(a2) * sc * 0.75, cy2 = py + Math.sin(a2) * sc * 0.75;
          const prx = sc * 0.46, pry = sc * 0.3;
          for (let y = Math.floor(cy2 - prx); y <= cy2 + prx; y++) {
            for (let x = Math.floor(cx2 - prx); x <= cx2 + prx; x++) {
              const rx = (x - cx2) * Math.cos(-a2) - (y - cy2) * Math.sin(-a2);
              const ry = (x - cx2) * Math.sin(-a2) + (y - cy2) * Math.cos(-a2);
              if ((rx / prx) ** 2 + (ry / pry) ** 2 > 1) continue;
              buf.blend(x, y, mixRgb(mixRgb(gemC, WHITE, 0.35), gem2, 0.35), 230 * mI);
            }
          }
        }
        buf.blend(px, py, WHITE, 220 * mI);
        break;
      }
      case "notes": {
        const nr = sc * 0.8;
        buf.disc(px, py + nr * 0.6, nr * 0.55, mixRgb(gemC, WHITE, 0.25), 240 * mI);
        line(px + nr * 0.5, py + nr * 0.6, px + nr * 0.5, py - nr * 1.1, 0.5 * S, 0.5 * S, gemC, gemC, WHITE, 235 * mI);
        line(px + nr * 0.5, py - nr * 1.1, px + nr * 1.3, py - nr * 0.6, 0.5 * S, 0.4 * S, mixRgb(gem2, WHITE, 0.3), gemC, WHITE, 225 * mI);
        break;
      }
      case "clock": {
        const cr = sc * 1.05;
        buf.ring(px, py, cr, Math.max(0.6 * S, sc * 0.2), mixRgb(gemC, WHITE, 0.3), 235 * mI);
        for (let q = 0; q < 4; q++) {
          const a2 = q / 4 * Math.PI * 2;
          buf.blend(px + Math.cos(a2) * cr * 0.74, py + Math.sin(a2) * cr * 0.74, WHITE, 210 * mI);
        }
        const ha = rng2() * Math.PI * 2;
        line(px, py, px + Math.cos(ha) * cr * 0.6, py + Math.sin(ha) * cr * 0.6, 0.55 * S, 0.4 * S, WHITE, gemC, WHITE, 240 * mI);
        line(px, py, px + Math.cos(ha + 2.1) * cr * 0.4, py + Math.sin(ha + 2.1) * cr * 0.4, 0.5 * S, 0.4 * S, mixRgb(gem2, WHITE, 0.4), gemC, WHITE, 225 * mI);
        break;
      }
      case "bubbles-motif": {
        for (let q = 0; q < 3; q++) {
          const bx = px + (rng2() - 0.5) * sc * 2, by = py + (rng2() - 0.5) * sc * 2;
          const br = sc * (0.3 + rng2() * 0.4);
          buf.ring(bx, by, br, Math.max(0.5 * S, br * 0.35), mixRgb(gem2, WHITE, 0.45), 225 * mI);
          buf.blend(bx - br * 0.35, by - br * 0.35, WHITE, 205 * mI);
        }
        break;
      }
      case "aurora-waves": {
        const width = sc * 3.2, amp = sc * 0.55;
        for (let q = 0; q < 18; q++) {
          const t2 = q / 18, waveX = px - width / 2 + t2 * width;
          const waveY = py + Math.sin(t2 * Math.PI * 3 + a) * amp;
          const hue = q % 3 === 0 ? mixRgb(gem2, WHITE, 0.5) : q % 3 === 1 ? [103, 232, 249] : [167, 139, 250];
          buf.blend(waveX, waveY, hue, 220 * mI);
          if (q % 3 === 1) buf.blend(waveX, waveY - S, WHITE, 145 * mI);
        }
        break;
      }
      case "jewel-halo": {
        const rr = sc * 1.15;
        buf.ring(px, py, rr, Math.max(0.5 * S, sc * 0.18), mixRgb(gemC, WHITE, 0.35), 235 * mI);
        for (let q = 0; q < 6; q++) {
          const aa = a + q / 6 * Math.PI * 2;
          const gx = px + Math.cos(aa) * rr, gy = py + Math.sin(aa) * rr;
          buf.disc(gx, gy, Math.max(0.5 * S, sc * 0.13), q % 2 ? WHITE : mixRgb(gem2, WHITE, 0.4), 240 * mI);
        }
        buf.disc(px, py, sc * 0.3, mixRgb(gem2, WHITE, 0.4), 240 * mI);
        break;
      }
      case "music-notes": {
        const n2 = sc * 0.75;
        buf.disc(px, py + n2 * 0.6, n2 * 0.55, mixRgb(gemC, WHITE, 0.32), 240 * mI);
        line(px + n2 * 0.5, py + n2 * 0.6, px + n2 * 0.5, py - n2 * 1.1, 0.55 * S, 0.45 * S, gemC, gemC, WHITE, 235 * mI);
        line(px + n2 * 0.5, py - n2 * 1.1, px + n2 * 1.35, py - n2 * 0.55, 0.5 * S, 0.4 * S, mixRgb(gem2, WHITE, 0.35), gemC, WHITE, 225 * mI);
        if (i % 2 === 0) {
          const dx = px + sc * 1.9, dy = py - sc * 0.55;
          buf.disc(dx, dy + n2 * 0.7, n2 * 0.5, mixRgb(gemC, WHITE, 0.28), 230 * mI);
          line(dx + n2 * 0.5, dy + n2 * 0.7, dx + n2 * 0.5, dy - n2 * 1, 0.5 * S, 0.42 * S, gemC, gemC, WHITE, 225 * mI);
        }
        buf.blend(px + sc * 0.7, py - sc * 0.85, WHITE, 195 * mI);
        break;
      }
    }
  }
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/render/post.ts
function applyOutline(c) {
  const { cfg, buf, W, pal, geo } = c;
  if (cfg.outline === "none") return;
  const { LX, LY } = geo;
  const src = new Uint8ClampedArray(buf.d);
  const at = (x, y) => x < 0 || y < 0 || x >= W || y >= W ? 0 : src[(y * W + x) * 4 + 3];
  const colAt = (x, y) => {
    const i = (y * W + x) * 4;
    return [src[i], src[i + 1], src[i + 2]];
  };
  const ORTHO = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const DIAG = [[1, 1], [-1, -1], [1, -1], [-1, 1]];
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      if (at(x, y) > 26) continue;
      let n = 0, sr = 0, sg = 0, sb = 0, best = -1, bx = 0, by = 0;
      for (const [dx, dy] of ORTHO) {
        if (at(x + dx, y + dy) > 26) {
          const col = colAt(x + dx, y + dy);
          sr += col[0];
          sg += col[1];
          sb += col[2];
          n++;
          const l = lum(col);
          if (l > best) {
            best = l;
            bx = x + dx;
            by = y + dy;
          }
        }
      }
      if (W >= 32) {
        for (const [dx, dy] of DIAG) {
          if (at(x + dx, y + dy) > 26 && at(x + dx, y) <= 26 && at(x, y + dy) <= 26) {
            const col = colAt(x + dx, y + dy);
            sr += col[0];
            sg += col[1];
            sb += col[2];
            n++;
          }
        }
      }
      if (n === 0) continue;
      let oc;
      switch (cfg.outline) {
        case "light":
          oc = [245, 240, 230];
          break;
        case "gold":
          oc = [212, 175, 55];
          break;
        case "colored":
          oc = shadeRgb(pal.gemC, -0.5);
          break;
        case "rarity":
          oc = shadeRgb(pal.rarityC, -0.25);
          break;
        case "selout": {
          const facesLight = (bx - x) * LX + (by - y) * LY > 0;
          oc = mixRgb(shadeRgb([sr / n, sg / n, sb / n], facesLight ? -0.34 : -0.58), pal.gemC, 0.12);
          break;
        }
        default:
          oc = INK;
      }
      buf.set(x, y, oc, 255);
    }
  }
}
function applyEdgeLight(c) {
  const { cfg, buf, W, geo } = c;
  if (!(cfg.finish === "metallic" || cfg.finish === "glossy" || cfg.finish === "enchanted")) return;
  const { LX, LY } = geo;
  const src = new Uint8ClampedArray(buf.d);
  const at = (x, y) => x < 0 || y < 0 || x >= W || y >= W ? 0 : src[(y * W + x) * 4 + 3];
  const boost = cfg.finish === "metallic" ? 0.42 : 0.26;
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      if (at(x, y) < 200) continue;
      const nx = x + LX > x ? 1 : -1, ny = y + LY > y ? 1 : -1;
      if (at(x + nx, y + ny) > 40) continue;
      const i = (y * W + x) * 4;
      const col = [src[i], src[i + 1], src[i + 2]];
      if (lum(col) < 60) continue;
      buf.blend(x, y, mixRgb(col, WHITE, boost), 200);
    }
  }
}
function applyDropShadow(c) {
  const { cfg, buf, W, S } = c;
  if (!cfg.dropShadow) return buf;
  const sh = new Pix(W, W);
  const sx = Math.max(S, Math.round(W * 0.03)), sy = Math.max(S, Math.round(W * 0.045));
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (buf.alpha(x, y) > 26) sh.blend(x + sx, y + sy, [0, 0, 0], 100);
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const i = buf.idx(x, y);
      if (buf.d[i + 3] === 0) continue;
      const fi = sh.idx(x, y);
      const sa = buf.d[i + 3] / 255, da = sh.d[fi + 3] / 255;
      const out = sa + da * (1 - sa);
      sh.d[fi] = clamp255((buf.d[i] * sa + sh.d[fi] * da * (1 - sa)) / Math.max(1e-3, out));
      sh.d[fi + 1] = clamp255((buf.d[i + 1] * sa + sh.d[fi + 1] * da * (1 - sa)) / Math.max(1e-3, out));
      sh.d[fi + 2] = clamp255((buf.d[i + 2] * sa + sh.d[fi + 2] * da * (1 - sa)) / Math.max(1e-3, out));
      sh.d[fi + 3] = clamp255(out * 255);
    }
  }
  return sh;
}
function applyContrast(pix, contrast) {
  if (Math.abs(contrast - 1) <= 0.01) return;
  const d = pix.d;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    d[i] = clamp255((d[i] - 128) * contrast + 128);
    d[i + 1] = clamp255((d[i + 1] - 128) * contrast + 128);
    d[i + 2] = clamp255((d[i + 2] - 128) * contrast + 128);
  }
}
function downsample(pix, N, S, hardAlpha = true, threshold = 0.5) {
  const out = new Uint8ClampedArray(N * N * 4);
  if (S === 1) {
    out.set(pix.d);
    if (hardAlpha) for (let i = 3; i < out.length; i += 4) out[i] = out[i] >= 128 ? 255 : 0;
    return out;
  }
  const W = N * S;
  for (let oy = 0; oy < N; oy++) {
    for (let ox = 0; ox < N; ox++) {
      let sr = 0, sg = 0, sb = 0, sa = 0;
      for (let dy = 0; dy < S; dy++) {
        for (let dx = 0; dx < S; dx++) {
          const i = ((oy * S + dy) * W + (ox * S + dx)) * 4;
          const a = pix.d[i + 3];
          sr += pix.d[i] * a;
          sg += pix.d[i + 1] * a;
          sb += pix.d[i + 2] * a;
          sa += a;
        }
      }
      const o = (oy * N + ox) * 4;
      const cov = sa / (S * S);
      if (sa > 0) {
        out[o] = clamp255(sr / sa);
        out[o + 1] = clamp255(sg / sa);
        out[o + 2] = clamp255(sb / sa);
        out[o + 3] = hardAlpha ? cov >= threshold ? 255 : 0 : clamp255(cov);
      }
    }
  }
  return out;
}
function posterize(out, n) {
  if (!n || n < 2) return;
  const px = [];
  for (let i = 0; i < out.length; i += 4) if (out[i + 3] > 8) px.push({ r: out[i], g: out[i + 1], b: out[i + 2], i });
  if (px.length === 0) return;
  let boxes = [px];
  while (boxes.length < n) {
    let bi = -1, bestRange = -1, bestCh = "r";
    boxes.forEach((b, idx) => {
      if (b.length < 2) return;
      for (const ch of ["r", "g", "b"]) {
        let lo = 255, hi = 0;
        for (const p of b) {
          const v = p[ch];
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
        const range = hi - lo;
        if (range > bestRange) {
          bestRange = range;
          bi = idx;
          bestCh = ch;
        }
      }
    });
    if (bi < 0 || bestRange <= 0) break;
    const box = boxes[bi];
    box.sort((a, b) => a[bestCh] - b[bestCh]);
    const mid = box.length >> 1;
    boxes.splice(bi, 1, box.slice(0, mid), box.slice(mid));
  }
  for (const box of boxes) {
    if (box.length === 0) continue;
    let r = 0, g = 0, b = 0;
    for (const p of box) {
      r += p.r;
      g += p.g;
      b += p.b;
    }
    r = Math.round(r / box.length);
    g = Math.round(g / box.length);
    b = Math.round(b / box.length);
    for (const p of box) {
      out[p.i] = r;
      out[p.i + 1] = g;
      out[p.i + 2] = b;
    }
  }
}
function applyGlint(c, out) {
  const { cfg, N, anim } = c;
  if (!(anim.on && (anim.type === "enchant-glint" || cfg.animation?.blendGlint))) return;
  const phase = anim.t * (N * 2);
  const period = N * 1.6;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4;
      if (out[i + 3] < 20) continue;
      const d = ((x - y + phase) % period + period) % period;
      const band = Math.max(0, 1 - Math.abs(d - N * 0.5) / (N * 0.22));
      const band2 = Math.max(0, 1 - Math.abs(d - N * 1.2) / (N * 0.18));
      const s = Math.min(1, band + band2 * 0.7) * anim.intensity * 0.85;
      if (s <= 0.01) continue;
      out[i] = clamp255(out[i] + (255 - out[i]) * s * 0.65);
      out[i + 1] = clamp255(out[i + 1] + (180 - out[i + 1]) * s * 0.5);
      out[i + 2] = clamp255(out[i + 2] + (255 - out[i + 2]) * s * 0.65);
    }
  }
}

// ../weapons/minecraft-magic-staff-generator (1)/src/lib/render/index.ts
var PAINT_STAGES = [
  ["glow", drawOuterGlow],
  ["halo", drawHalo],
  ["wings", drawWings],
  ["shaft", drawShaft],
  ["collar", drawCollar],
  ["pommel", drawPommel],
  ["prongs", drawProngs],
  ["horns", drawHorns],
  ["head", drawHead],
  ["gem-settings", drawGemSettings],
  ["silhouette", drawSilhouette],
  ["item-signature", drawItemSignature],
  ["adornments", drawAdornments],
  ["tip", drawTip],
  ["dangles", drawDangles],
  ["wear", applyWear],
  ["orbiters", drawOrbiters],
  ["particles", drawParticles],
  ["anim-fx", drawAnimEmbellish],
  ["motif", drawMotif],
  ["motif2", drawMotif2],
  ["outline", applyOutline],
  ["edge-light", applyEdgeLight]
];
function drawMotif2(c) {
  const m2 = c.cfg.motif2;
  if (!m2 || m2 === "none") return;
  const alt = {
    ...c,
    cfg: { ...c.cfg, motif: m2, motifIntensity: c.cfg.motif2Intensity ?? 0.5, seed: c.cfg.seed + 7777 }
  };
  drawMotif(alt);
}
function renderPixels(cfg, anim) {
  const c = createContext(cfg, anim);
  for (const [, stage] of PAINT_STAGES) stage(c);
  const shadowed = applyDropShadow(c);
  applyContrast(shadowed, cfg.contrast);
  const out = downsample(shadowed, c.N, c.S, !cfg.softEdge);
  applyGlint(c, out);
  if (cfg.paletteSize && cfg.paletteSize >= 2) posterize(out, cfg.paletteSize);
  return { data: out, size: c.N };
}

// src/argv.ts
function cmd() {
  return process.env.MCASSET_CMD ?? "";
}
function args() {
  try {
    const parsed = JSON.parse(process.env.MCASSET_ARGS ?? "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
function arg(name, fallback) {
  const list = args();
  const i = list.indexOf(`--${name}`);
  if (i >= 0 && i + 1 < list.length) return list[i + 1];
  return fallback;
}
function fail(message) {
  console.error(message);
  process.exit(1);
}

// ../texture/texcraft/src/lib/pngCodec.ts
var import_node_zlib = require("node:zlib");
var CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    table[n] = c;
  }
  return table;
})();
function crc32(bytes) {
  let crc = 4294967295;
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 255] ^ crc >>> 8;
  return (crc ^ 4294967295) >>> 0;
}
function chunk(type, data) {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
function join(parts) {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}
function encodePng(tex) {
  const { w, h, d } = tex;
  const raw = new Uint8Array((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    raw.set(d.subarray(y * w * 4, (y + 1) * w * 4), y * (w * 4 + 1) + 1);
  }
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, w);
  view.setUint32(4, h);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  return join([sig, chunk("IHDR", ihdr), chunk("IDAT", (0, import_node_zlib.deflateSync)(raw)), chunk("IEND", new Uint8Array(0))]);
}

// src/arcane.ts
var command = cmd();
if (command === "render") {
  const out = arg("out") ?? fail("usage: arcane:render [--random] [--config file.json] [--size 64] --out file.png");
  let cfg = DEFAULT_CONFIG;
  const configPath = arg("config");
  if (configPath) {
    cfg = { ...DEFAULT_CONFIG, ...JSON.parse((0, import_node_fs.readFileSync)(configPath, "utf-8")) };
  } else if (arg("random") !== void 0 || !configPath) {
    cfg = randomConfig(DEFAULT_CONFIG);
  }
  const size = Number(arg("size", "64"));
  const { data, size: native } = renderPixels(cfg);
  const scale = Math.max(1, Math.round(size / native));
  const scaled = { w: native * scale, h: native * scale, d: new Uint8ClampedArray(native * scale * native * scale * 4) };
  for (let y = 0; y < scaled.h; y++) {
    for (let x = 0; x < scaled.w; x++) {
      const si = (Math.floor(y / scale) * native + Math.floor(x / scale)) * 4;
      const di = (y * scaled.w + x) * 4;
      scaled.d[di] = data[si] ?? 0;
      scaled.d[di + 1] = data[si + 1] ?? 0;
      scaled.d[di + 2] = data[si + 2] ?? 0;
      scaled.d[di + 3] = data[si + 3] ?? 0;
    }
  }
  (0, import_node_fs.writeFileSync)(out, encodePng(scaled));
  console.log(`wrote ${out} (${scaled.w}x${scaled.h}, seed=${cfg.seed})`);
} else if (command === "config") {
  console.log(JSON.stringify(randomConfig(DEFAULT_CONFIG), null, 2));
} else {
  console.log(`arcane commands: render [--random|--config file.json] [--size 64] --out file.png | config`);
}
