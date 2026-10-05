// src/vox.ts
var import_node_fs = require("node:fs");

// ../3d-forge/voxelforge-studio/src/lib/template-catalog.ts
var TEMPLATE_CATALOG = [
  {
    kind: "sword",
    label: "\u5263",
    english: "Sword",
    category: "classic",
    name: "\u30AF\u30EA\u30B9\u30BF\u30EB\u30BD\u30FC\u30C9",
    prompt: "\u900F\u304D\u901A\u308B\u30AF\u30EA\u30B9\u30BF\u30EB\u306E\u5200\u8EAB\u3068\u3001\u30C0\u30FC\u30AF\u30E1\u30BF\u30EB\u306E\u9354\u3002\u67C4\u306B\u306F\u7D2B\u306E\u30EC\u30B6\u30FC\u3092\u5DFB\u304D\u3001\u30D5\u30A1\u30F3\u30BF\u30B8\u30FC\u306E\u4E16\u754C\u306B\u5408\u3046\u5263\u306B\u3002",
    dimensions: [16, 32, 4],
    vanillaItem: "diamond_sword"
  },
  {
    kind: "pickaxe",
    label: "\u30C4\u30EB\u30CF\u30B7",
    english: "Pickaxe",
    category: "classic",
    name: "\u30AF\u30EA\u30B9\u30BF\u30EB\u30D4\u30C3\u30B1\u30EB",
    prompt: "\u30C0\u30A4\u30E4\u30E2\u30F3\u30C9\u306E\u5203\u3068\u4E08\u592B\u306A\u67C4\u3002\u5148\u7AEF\u304C\u92ED\u304F\u3001\u9271\u77F3\u306E\u8F1D\u304D\u3092\u611F\u3058\u308B\u30D5\u30A1\u30F3\u30BF\u30B8\u30FC\u306E\u30C4\u30EB\u30CF\u30B7\u3002",
    dimensions: [16, 32, 4],
    vanillaItem: "diamond_pickaxe"
  },
  {
    kind: "axe",
    label: "\u65A7",
    english: "Axe",
    category: "classic",
    name: "\u30A8\u30E1\u30E9\u30EB\u30C9\u30A2\u30C3\u30AF\u30B9",
    prompt: "\u30A8\u30E1\u30E9\u30EB\u30C9\u306B\u8F1D\u304F\u5927\u304D\u306A\u5203\u3001\u30C0\u30FC\u30AF\u30E1\u30BF\u30EB\u306E\u30D5\u30EC\u30FC\u30E0\u3068\u9769\u5DFB\u304D\u306E\u67C4\u3092\u6301\u3064\u65A7\u3002",
    dimensions: [16, 32, 4],
    vanillaItem: "diamond_axe"
  },
  {
    kind: "shield",
    label: "\u76FE",
    english: "Shield",
    category: "classic",
    name: "\u53E4\u4EE3\u306E\u30EB\u30FC\u30F3\u30B7\u30FC\u30EB\u30C9",
    prompt: "\u7D2B\u306E\u30AF\u30EA\u30B9\u30BF\u30EB\u3092\u4E2D\u592E\u306B\u57CB\u3081\u8FBC\u307F\u3001\u91D1\u8272\u306E\u7E01\u53D6\u308A\u3068\u53E4\u4EE3\u306E\u30EB\u30FC\u30F3\u3092\u3042\u3057\u3089\u3063\u305F\u76FE\u3002",
    dimensions: [16, 24, 4],
    vanillaItem: "paper"
  },
  {
    kind: "staff",
    label: "\u6756",
    english: "Staff",
    category: "arcane",
    name: "\u30A2\u30E1\u30B8\u30B9\u30C8\u306E\u6756",
    prompt: "\u7D2B\u306E\u30A2\u30E1\u30B8\u30B9\u30C8\u3092\u5148\u7AEF\u306B\u6D6E\u304B\u3079\u305F\u9B54\u6CD5\u306E\u6756\u3002\u9577\u3044\u67C4\u306B\u91D1\u8272\u306E\u88C5\u98FE\u3068\u5C0F\u3055\u306A\u5B9D\u77F3\u3002",
    dimensions: [16, 32, 4],
    vanillaItem: "stick",
    defaults: { floaters: "crystal", effect: "glow", animation: "float" }
  },
  {
    kind: "block",
    label: "\u30D6\u30ED\u30C3\u30AF",
    english: "Block",
    category: "classic",
    name: "\u30AF\u30EA\u30B9\u30BF\u30EB\u30D6\u30ED\u30C3\u30AF",
    prompt: "\u6DF1\u3044\u9752\u7DD1\u306E\u9271\u77F3\u3092\u542B\u3080\u88C5\u98FE\u30D6\u30ED\u30C3\u30AF\u3002\u8868\u9762\u306B\u30AF\u30EA\u30B9\u30BF\u30EB\u306E\u6A21\u69D8\u3068\u91D1\u8272\u306E\u30E9\u30A4\u30F3\u3002",
    dimensions: [16, 16, 16],
    vanillaItem: "paper"
  },
  {
    kind: "drill",
    label: "\u30C9\u30EA\u30EB",
    english: "Drill",
    category: "mechanical",
    name: "\u30AE\u30A2\u30C9\u30EA\u30EB",
    prompt: "\u56DE\u8EE2\u3059\u308B\u30AE\u30A2\u3068\u92FC\u9244\u306E\u30C9\u30EA\u30EB\u3002\u706B\u82B1\u3092\u6563\u3089\u3059\u6A5F\u68B0\u7684\u306A\u8FD1\u63A5\u6B66\u5668\u3002",
    dimensions: [14, 30, 14],
    vanillaItem: "iron_pickaxe",
    defaults: {
      floaters: "orbit",
      effect: "sparkle",
      animation: "spin",
      action: "spin"
    }
  },
  {
    kind: "cannon",
    label: "\u30AD\u30E3\u30CE\u30F3",
    english: "Cannon",
    category: "mechanical",
    name: "\u9B54\u5C0E\u30AD\u30E3\u30CE\u30F3",
    prompt: "\u9752\u767D\u3044\u5149\u3092\u6E9C\u3081\u308B\u6A5F\u68B0\u306E\u7832\u8EAB\u3002\u30AE\u30A2\u3068\u9285\u306E\u30D1\u30A4\u30D7\u304C\u4E26\u3076\u9B54\u5C0E\u5175\u5668\u3002",
    dimensions: [14, 30, 12],
    vanillaItem: "crossbow",
    defaults: { floaters: "orbit", effect: "glow", action: "charge" }
  },
  {
    kind: "mechblade",
    label: "\u6A5F\u5203",
    english: "Mecha Blade",
    category: "mechanical",
    name: "\u8D77\u52D5\u5F0F\u6A5F\u5203",
    prompt: "\u6298\u308A\u305F\u305F\u307E\u308C\u305F\u5203\u304C\u5C55\u958B\u3059\u308B\u6A5F\u68B0\u306E\u5263\u3002\u30CD\u30AA\u30F3\u306E\u767A\u5149\u30E9\u30A4\u30F3\u3068\u91D1\u5C5E\u306E\u88C5\u7532\u3002",
    dimensions: [12, 32, 6],
    vanillaItem: "iron_sword",
    defaults: { floaters: "crystal", effect: "magic", action: "transform" }
  },
  {
    kind: "runeblade",
    label: "\u9B54\u6CD5\u5263",
    english: "Rune Blade",
    category: "arcane",
    name: "\u661F\u8A60\u307F\u306E\u30EB\u30FC\u30F3\u30D6\u30EC\u30FC\u30C9",
    prompt: "\u7D2B\u306E\u9B54\u6CD5\u5263\u3002\u767D\u91D1\u306E\u30D5\u30EC\u30FC\u30E0\u306B\u5C01\u3058\u305F\u661F\u306E\u7D50\u6676\u3068\u3001\u5B99\u306B\u6D6E\u304F\u30EB\u30FC\u30F3\u3002",
    dimensions: [14, 32, 5],
    vanillaItem: "diamond_sword",
    defaults: {
      effect: "runes",
      animation: "orbit",
      floaters: "orbit",
      action: "cast"
    }
  },
  {
    kind: "cursedblade",
    label: "\u798D\u5203",
    english: "Abyss Blade",
    category: "dark",
    name: "\u6DF1\u6DF5\u306E\u798D\u5203",
    prompt: "\u798D\u3005\u3057\u3044\u9ED2\u66DC\u77F3\u306E\u5203\u3002\u66F2\u304C\u3063\u305F\u89D2\u3001\u92F8\u72B6\u306E\u68D8\u3001\u7D2B\u306E\u90AA\u773C\u3068\u546A\u5370\u3002",
    dimensions: [16, 32, 5],
    vanillaItem: "netherite_sword",
    defaults: { effect: "void", animation: "pulse", floaters: "swarm" }
  },
  {
    kind: "bloodblade",
    label: "\u8840\u6676\u5263",
    english: "Blood Blade",
    category: "dark",
    name: "\u7D05\u6708\u306E\u8840\u6676\u5263",
    prompt: "\u30D6\u30E9\u30C3\u30C9\u306E\u8D64\u3044\u7D50\u6676\u5263\u3002\u8840\u6676\u306E\u8108\u52D5\u3001\u9ED2\u3044\u9AA8\u683C\u3001\u771F\u7D05\u306E\u7D0B\u7AE0\u3002",
    dimensions: [14, 32, 4],
    vanillaItem: "netherite_sword",
    defaults: { effect: "blood", animation: "pulse", action: "slash" }
  },
  {
    kind: "elderstaff",
    label: "\u8CE2\u8005\u306E\u6756",
    english: "Astral Staff",
    category: "arcane",
    name: "\u5929\u7403\u306E\u8CE2\u8005\u6756",
    prompt: "\u9752\u3044\u661F\u3092\u5305\u3080\u4E8C\u91CD\u306E\u5929\u7403\u5100\u3002\u91D1\u306E\u88C5\u98FE\u3068\u87BA\u65CB\u306E\u30EB\u30FC\u30F3\u3092\u6301\u3064\u8CE2\u8005\u306E\u6756\u3002",
    dimensions: [16, 36, 9],
    vanillaItem: "stick",
    defaults: {
      floaters: "orbit",
      animation: "orbit",
      effect: "runes",
      action: "summon"
    }
  },
  {
    kind: "bloodstaff",
    label: "\u8840\u6708\u306E\u6756",
    english: "Bloodmoon Staff",
    category: "dark",
    name: "\u8840\u6708\u306E\u5100\u5F0F\u6756",
    prompt: "\u30D6\u30E9\u30C3\u30C9\u306E\u5100\u5F0F\u6756\u3002\u8D64\u3044\u4E09\u65E5\u6708\u3001\u798D\u3005\u3057\u3044\u89D2\u3001\u9396\u306B\u7E4B\u304C\u308C\u305F\u8840\u6676\u3002",
    dimensions: [16, 34, 6],
    vanillaItem: "stick",
    defaults: {
      floaters: "crystal",
      animation: "pulse",
      effect: "blood",
      action: "ritual"
    }
  },
  {
    kind: "grimoire",
    label: "\u9B54\u5C0E\u66F8",
    english: "Grimoire",
    category: "arcane",
    name: "\u661F\u8FB0\u306E\u9B54\u5C0E\u66F8",
    prompt: "\u7D2B\u306E\u9B54\u5C0E\u66F8\u3002\u958B\u3044\u305F\u53E4\u3044\u30DA\u30FC\u30B8\u306B\u5149\u308B\u30EB\u30FC\u30F3\u3001\u91D1\u306E\u89D2\u98FE\u308A\u3001\u6D6E\u904A\u3059\u308B\u5C01\u5370\u3002",
    dimensions: [24, 18, 8],
    vanillaItem: "book",
    defaults: {
      floaters: "orbit",
      effect: "runes",
      animation: "float",
      action: "ritual"
    }
  },
  {
    kind: "magiccircle",
    label: "\u9B54\u6CD5\u9663",
    english: "Magic Circle",
    category: "arcane",
    name: "\u516D\u8292\u306E\u53EC\u559A\u9663",
    prompt: "\u9752\u3044\u4E8C\u91CD\u306E\u9B54\u6CD5\u9663\u3002\u516D\u8292\u661F\u3068\u30EB\u30FC\u30F3\u3001\u5916\u5468\u306B\u6D6E\u904A\u3059\u308B\u7D50\u6676\u3002",
    dimensions: [26, 26, 3],
    vanillaItem: "paper",
    defaults: {
      effect: "runes",
      floaters: "orbit",
      animation: "spin",
      action: "summon"
    }
  },
  {
    kind: "bow",
    label: "\u5F13",
    english: "Celestial Bow",
    category: "classic",
    name: "\u6708\u5149\u306E\u5F13",
    prompt: "\u30A8\u30E1\u30E9\u30EB\u30C9\u306E\u98FE\u308A\u3092\u3042\u3057\u3089\u3063\u305F\u7CBE\u970A\u306E\u5F13\u3002\u91D1\u306E\u30A2\u30FC\u30E0\u3068\u5F35\u308A\u3064\u3081\u305F\u5149\u306E\u5F26\u3002",
    dimensions: [18, 32, 5],
    vanillaItem: "bow",
    defaults: { effect: "glow", action: "draw" }
  },
  {
    kind: "rifle",
    label: "\u30E9\u30A4\u30D5\u30EB",
    english: "Tactical Rifle",
    category: "modern",
    name: "A-17 \u30BF\u30AF\u30C6\u30A3\u30AB\u30EB\u30E9\u30A4\u30D5\u30EB",
    prompt: "\u92FC\u9244\u306E\u8FD1\u4EE3\u30E9\u30A4\u30D5\u30EB\u3002\u30EC\u30FC\u30EB\u3001\u30B9\u30B3\u30FC\u30D7\u3001\u30DE\u30AC\u30B8\u30F3\u3001\u51B7\u5374\u7528\u306E\u30D9\u30F3\u30C8\u3068\u7CBE\u5BC6\u306A\u88C5\u7532\u3002",
    dimensions: [30, 14, 5],
    vanillaItem: "crossbow",
    defaults: { action: "shoot", effect: "embers" }
  },
  {
    kind: "pistol",
    label: "\u9283",
    english: "Arc Pistol",
    category: "modern",
    name: "\u30A2\u30FC\u30AF\u30D4\u30B9\u30C8\u30EB",
    prompt: "\u92FC\u9244\u306E\u9283\u3002\u30B3\u30F3\u30D1\u30AF\u30C8\u306A\u30B9\u30E9\u30A4\u30C9\u3001\u767A\u5149\u30B5\u30A4\u30C8\u3001\u771F\u936E\u306E\u30C8\u30EA\u30AC\u30FC\u3068\u51B7\u5374\u53E3\u3002",
    dimensions: [22, 16, 5],
    vanillaItem: "crossbow",
    defaults: { action: "shoot", effect: "electric" }
  },
  {
    kind: "railgun",
    label: "\u30EC\u30FC\u30EB\u30AC\u30F3",
    english: "Railgun",
    category: "modern",
    name: "R-09 \u30EC\u30FC\u30EB\u30AC\u30F3",
    prompt: "\u6A5F\u68B0\u306E\u30EC\u30FC\u30EB\u30AC\u30F3\u30022\u672C\u306E\u5C0E\u4F53\u30EC\u30FC\u30EB\u3001\u9752\u3044\u30B3\u30A4\u30EB\u3068\u5B99\u306B\u6D6E\u3044\u305F\u84C4\u96FB\u30B3\u30A2\u3002",
    dimensions: [32, 14, 7],
    vanillaItem: "crossbow",
    defaults: { action: "charge", effect: "electric" }
  },
  {
    kind: "chainsaw",
    label: "\u30C1\u30A7\u30FC\u30F3\u30BD\u30FC",
    english: "Chainsaw",
    category: "mechanical",
    name: "\u30AE\u30A2\u30D5\u30A1\u30F3\u30B0\u30FB\u30C1\u30A7\u30FC\u30F3\u30BD\u30FC",
    prompt: "\u6A5F\u68B0\u5F0F\u30C1\u30A7\u30FC\u30F3\u30BD\u30FC\u3002\u9285\u306E\u30A8\u30F3\u30B8\u30F3\u3001\u92F8\u6B6F\u306E\u30C1\u30A7\u30FC\u30F3\u3068\u6392\u6C17\u7BA1\u3001\u9632\u8B77\u30CF\u30F3\u30C9\u30EB\u3002",
    dimensions: [14, 32, 7],
    vanillaItem: "iron_axe",
    defaults: { action: "rev", effect: "embers" }
  },
  {
    kind: "relic",
    label: "\u30EC\u30EA\u30C3\u30AF",
    english: "Relic",
    category: "arcane",
    name: "\u9ECE\u660E\u306E\u30EC\u30EA\u30C3\u30AF",
    prompt: "\u91D1\u306E\u53E4\u4EE3\u30EC\u30EA\u30C3\u30AF\u3002\u8056\u306A\u308B\u5E7E\u4F55\u5B66\u306E\u7C60\u3001\u767D\u3044\u5FC3\u81D3\u306E\u7D50\u6676\u3068\u6D6E\u904A\u3059\u308B\u7D0B\u7AE0\u3002",
    dimensions: [18, 26, 12],
    vanillaItem: "amethyst_shard",
    defaults: {
      effect: "runes",
      floaters: "orbit",
      animation: "orbit",
      action: "summon"
    }
  },
  {
    kind: "spear",
    label: "\u88C5\u98FE\u30B9\u30D4\u30A2",
    english: "Regal Spear",
    category: "classic",
    name: "\u738B\u51A0\u306E\u30BB\u30EC\u30E2\u30CB\u30A2\u30EB\u30B9\u30D4\u30A2",
    prompt: "\u7D2B\u306E\u7D50\u6676\u3092\u9802\u304F\u8C6A\u83EF\u306A\u30B9\u30D4\u30A2\u3002\u7FFC\u306E\u9354\u3001\u738B\u51A0\u3001\u91D1\u306E\u7D30\u5DE5\u3001\u5B9D\u77F3\u3001\u9396\u3001\u623F\u98FE\u308A\u3002",
    dimensions: [16, 38, 5],
    vanillaItem: "trident",
    defaults: { effect: "glow", action: "thrust" }
  },
  {
    kind: "mace",
    label: "\u30E1\u30A4\u30B9",
    english: "Royal Mace",
    category: "classic",
    name: "\u96F7\u51A0\u306E\u30E1\u30A4\u30B9",
    prompt: "\u92FC\u9244\u306E\u30E1\u30A4\u30B9\u30026\u679A\u306E\u30D5\u30E9\u30F3\u30B8\u3001\u91D1\u306E\u7D0B\u7AE0\u3068\u9752\u3044\u96F7\u6676\u3001\u9396\u3068\u88C5\u98FE\u306E\u67C4\u3002",
    dimensions: [14, 30, 11],
    vanillaItem: "mace",
    defaults: { effect: "electric", action: "slam" }
  }
];

// ../3d-forge/voxelforge-studio/src/lib/model-types.ts
var MECHANICAL_KINDS = [
  "drill",
  "cannon",
  "mechblade",
  "chainsaw",
  "rifle",
  "pistol",
  "railgun"
];
var DEFAULT_GRADIENT = {
  enabled: false,
  mode: "vertical",
  from: "#5e3b9a",
  to: "#a5f7e0",
  strength: 55,
  steps: 16,
  blend: "mix"
};
var RIG_IDS = [
  "mechanism",
  "magazine",
  "string",
  "page",
  "panel_left",
  "panel_right"
];
var TEMPLATES = TEMPLATE_CATALOG;
var DEFAULT_SETTINGS = {
  name: TEMPLATES[0].name,
  kind: "sword",
  prompt: TEMPLATES[0].prompt,
  quality: "high",
  style: "fantasy",
  detail: 72,
  width: 16,
  height: 32,
  depth: 4,
  symmetric: true,
  autoUV: true,
  seed: 42,
  floaters: "none",
  effect: "none",
  animation: "none",
  tier: 0,
  limitBreak: false,
  form: "base",
  mode: "normal",
  action: "none"
};
var DEFAULT_PALETTE = [
  "#183b43",
  "#287c82",
  "#42cbbd",
  "#87ebd8",
  "#c6ffe8",
  "#514168",
  "#ba985e",
  "#8872ad"
];
function normalizeSettings(value) {
  return {
    ...DEFAULT_SETTINGS,
    ...value,
    name: value.name || DEFAULT_SETTINGS.name,
    kind: value.kind || DEFAULT_SETTINGS.kind,
    prompt: value.prompt ?? DEFAULT_SETTINGS.prompt
  };
}

// ../3d-forge/voxelforge-studio/src/lib/atlas.ts
var import_pngjs = require("pngjs");
var FALLBACK_ATLAS_SIZE = 64;
var FALLBACK_TILE_WIDTH = 16;
var FALLBACK_TILE_HEIGHT = 32;
var SAMPLE_GRID = 16;
var DATA_URL_PREFIX = "data:image/png;base64,";
function toDataUrl(buffer) {
  return DATA_URL_PREFIX + buffer.toString("base64");
}
function decodeDataUrl(source) {
  return Buffer.from(source.split(",")[1], "base64");
}
function toHexColor(rgb) {
  return "#" + rgb.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("");
}
function toRgb(hex) {
  return [1, 3, 5].map(
    (index) => parseInt(hex.slice(index, index + 2), 16)
  );
}
function createFallbackAtlas(palette) {
  const png = new import_pngjs.PNG({
    width: FALLBACK_ATLAS_SIZE,
    height: FALLBACK_ATLAS_SIZE
  });
  for (let y = 0; y < FALLBACK_ATLAS_SIZE; y++) {
    for (let x = 0; x < FALLBACK_ATLAS_SIZE; x++) {
      const tile = Math.floor(x / FALLBACK_TILE_WIDTH) + Math.floor(y / FALLBACK_TILE_HEIGHT) * 4;
      const color = toRgb(palette[tile]);
      const localX = x % FALLBACK_TILE_WIDTH;
      const localY = y % FALLBACK_TILE_HEIGHT;
      const isBorder = localX < 1 || localX > 14 || localY < 1 || localY > 30;
      const grain = ((Math.floor(localX / 3) * 31 + Math.floor(localY / 3) * 17 + tile * 13) % 13 - 6) * 0.65;
      const offset = (y * FALLBACK_ATLAS_SIZE + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        png.data[offset + channel] = isBorder ? Math.round(color[channel] * 0.45) : Math.max(0, Math.min(255, color[channel] + grain));
      }
      png.data[offset + 3] = 255;
    }
  }
  return toDataUrl(import_pngjs.PNG.sync.write(png));
}
var sampleCache = /* @__PURE__ */ new Map();
function sampleAtlasTiles(atlas) {
  const cached = sampleCache.get(atlas.source);
  if (cached) return cached;
  const png = import_pngjs.PNG.sync.read(decodeDataUrl(atlas.source));
  const tileWidth = Math.max(1, Math.floor(png.width / SAMPLE_GRID));
  const tileHeight = Math.max(1, Math.floor(png.height / SAMPLE_GRID));
  const tiles = [];
  for (let y = 0; y <= png.height - tileHeight; y += tileHeight) {
    for (let x = 0; x <= png.width - tileWidth; x += tileWidth) {
      const sums = [0, 0, 0];
      let opaque = 0;
      for (let py = y; py < y + tileHeight; py++) {
        for (let px = x; px < x + tileWidth; px++) {
          const index = (py * png.width + px) * 4;
          if (png.data[index + 3] < 128) continue;
          for (let channel = 0; channel < 3; channel++)
            sums[channel] += png.data[index + channel];
          opaque++;
        }
      }
      if (opaque > 0) {
        tiles.push({
          color: sums.map((sum) => sum / opaque),
          uv: [x, y, x + tileWidth, y + tileHeight]
        });
      }
    }
  }
  if (sampleCache.size >= 4)
    sampleCache.delete(sampleCache.keys().next().value);
  sampleCache.set(atlas.source, tiles);
  return tiles;
}
function matchPaletteToTiles(palette, tiles, autoUV) {
  return palette.map((color, index) => {
    if (!autoUV)
      return tiles[Math.floor(index * tiles.length / palette.length)];
    const target = toRgb(color);
    const distance = (tile) => tile.color.reduce(
      (sum, value, channel) => sum + (value - target[channel]) ** 2,
      0
    );
    return tiles.reduce(
      (best, tile) => distance(tile) < distance(best) ? tile : best
    );
  });
}

// ../3d-forge/voxelforge-studio/src/lib/editor-recipe.ts
function applyCubeEdits(cubes, edits = [], custom = []) {
  const byName = new Map(edits.map((edit) => [edit.target, edit]));
  return [...cubes, ...custom].map((cube) => {
    const edit = byName.get(cube.name);
    if (!edit) return cube;
    return {
      ...cube,
      from: edit.from ?? cube.from,
      to: edit.to ?? cube.to,
      color: edit.color ?? cube.color,
      label: edit.label ?? cube.label,
      hidden: edit.hidden ?? cube.hidden,
      emissive: edit.emissive ?? cube.emissive,
      painted: edit.color ? true : cube.painted
    };
  }).filter((cube) => cube.to.every((value, axis) => value > cube.from[axis]));
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/builder.ts
var ATLAS_COLUMNS = 4;
var TILE_WIDTH = 16;
var TILE_HEIGHT = 32;
var MINIMAL_MATERIAL_ALIASES = { 7: 5 };
var DETAIL_THRESHOLD = 35;
var GeometryBuilder = class {
  constructor(settings, palette, regions) {
    this.settings = settings;
    this.palette = palette;
    this.regions = regions;
    this.cubes = [];
    /** How far form changes raised the top of the model; floaters follow it. */
    this.anchorLift = 0;
    let hash = settings.seed;
    for (const char of settings.prompt)
      hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
    this.hash = hash;
  }
  /** True when the model should receive its decorative detail pass. */
  get detailed() {
    const { quality, detail, style } = this.settings;
    return quality !== "standard" && detail > DETAIL_THRESHOLD && style !== "minimal";
  }
  /** How many decorative accents a detailed model receives. */
  get accentCount() {
    return this.settings.quality === "ultra" ? 5 : 3;
  }
  /** Deterministic 0-99 value derived from the seed and the prompt. */
  noise(a, b) {
    return (((a + 29) * 73856093 ^ (b + 53) * 19349663 ^ this.hash) >>> 0) % 100;
  }
  /** Adds a cube belonging to the solid body of the model. */
  box(name, from, to, material, emissive = false) {
    const resolved = this.resolveMaterial(material);
    this.cubes.push({
      name,
      from,
      to,
      color: this.palette[resolved] ?? this.palette[0],
      material: resolved,
      uv: this.uvFor(resolved),
      ...emissive ? { emissive: true } : {}
    });
  }
  /** Adds a cube that floats around the model and animates separately. */
  floater(name, from, to, material, emissive = false) {
    this.box(name, from, to, material, emissive);
    this.cubes[this.cubes.length - 1].layer = "floater";
  }
  /**
   * Adds a decoration from an upgrade or form modifier. Ornaments do not
   * count towards the requested model size, so upgrades never shrink the body.
   */
  ornament(name, from, to, material, emissive = false, floating = false) {
    this.box(name, from, to, material, emissive);
    const cube = this.cubes[this.cubes.length - 1];
    cube.ornament = true;
    if (floating) cube.layer = "floater";
  }
  /** Cubes of the solid weapon itself (no floaters, no ornaments). */
  bodyCubes() {
    return this.cubes.filter((cube) => !cube.layer && !cube.ornament);
  }
  bodyBounds() {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const cube of this.bodyCubes()) {
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], cube.from[axis]);
        max[axis] = Math.max(max[axis], cube.to[axis]);
      }
    }
    return { min, max };
  }
  /** Horizontal extent of the body at height `y` (falls back to the full width). */
  spanAt(y) {
    let low = Infinity;
    let high = -Infinity;
    for (const cube of this.bodyCubes()) {
      if (cube.from[1] > y || cube.to[1] < y) continue;
      low = Math.min(low, cube.from[0]);
      high = Math.max(high, cube.to[0]);
    }
    if (Number.isFinite(low)) return [low, high];
    const { min, max } = this.bodyBounds();
    return [min[0], max[0]];
  }
  /** Shared grip used by every handheld template. */
  handle(bottom, top, width = 1.6) {
    const half = width / 2;
    this.box(
      "handle_core",
      [-half - 0.2, bottom, -0.9],
      [half + 0.2, top, 0.9],
      0
    );
    for (let y = bottom + 0.3; y < top - 0.4; y += 1.25) {
      const wrapTop = Math.min(top - 0.2, y + 0.85);
      this.box(
        "leather_wrap",
        [-half, y, -1],
        [half, wrapTop, 1],
        Math.round(y) % 3 === 0 ? 7 : 5
      );
    }
    this.box("pommel", [-1.4, bottom - 0.7, -1.2], [1.4, bottom + 0.5, 1.2], 0);
    this.box(
      "pommel_inlay",
      [-0.8, bottom - 0.45, 1.2],
      [0.8, bottom + 0.3, 1.5],
      6
    );
  }
  resolveMaterial(material) {
    if (this.settings.style !== "minimal") return material;
    return MINIMAL_MATERIAL_ALIASES[material] ?? material;
  }
  uvFor(material) {
    const sampled = this.regions?.[material];
    if (sampled) return sampled;
    const u = material % ATLAS_COLUMNS * TILE_WIDTH;
    const v = Math.floor(material / ATLAS_COLUMNS) * TILE_HEIGHT;
    const row = this.cubes.length % 3;
    return [u + 2, v + 2 + row * 9, u + 14, v + 10 + row * 9];
  }
};

// ../3d-forge/voxelforge-studio/src/lib/geometry/floaters.ts
var FLOATER_ANCHORS = {
  sword: [0, 17.5, 0],
  pickaxe: [0, 10.5, 0],
  axe: [8, 8, 0],
  shield: [0, 13, 0],
  staff: [0, 18.5, 0],
  block: [0, 10.5, 0],
  drill: [0, 19, 0],
  cannon: [0, 18, 0],
  mechblade: [0, 19.5, 0]
};
var ORBIT_COUNT = 8;
var ORBIT_RADIUS = 3.4;
function buildCrystal(builder, anchor) {
  const [, y] = anchor;
  builder.floater(
    "floater_crystal",
    [-0.7, y + 4.2, -0.7],
    [0.7, y + 6.4, 0.7],
    3,
    true
  );
  builder.floater(
    "floater_crystal_glint",
    [-0.45, y + 5.6, 0.55],
    [0.35, y + 6.3, 0.7],
    4,
    true
  );
  builder.floater(
    "floater_rock",
    [-1.9, y + 2.6, 0.5],
    [-1.05, y + 3.35, 1.25],
    1
  );
  builder.floater("floater_rock", [1.3, y + 5, -1], [2, y + 5.65, -0.35], 0);
  if (builder.settings.quality !== "standard") {
    builder.floater(
      "floater_rock",
      [-1.6, y + 6.6, -0.8],
      [-1, y + 7.15, -0.3],
      2
    );
  }
}
function buildOrbit(builder, anchor) {
  const [ax, ay, az] = anchor;
  for (let i = 0; i < ORBIT_COUNT; i++) {
    const angle = i / ORBIT_COUNT * Math.PI * 2;
    const x = ax + Math.cos(angle) * ORBIT_RADIUS;
    const z = az + Math.sin(angle) * ORBIT_RADIUS;
    const y = ay + 1.6;
    builder.floater(
      "floater_orb",
      [x - 0.45, y - 0.45, z - 0.45],
      [x + 0.45, y + 0.45, z + 0.45],
      i % 2 ? 3 : 4,
      i % 2 === 0
    );
  }
  builder.floater(
    "floater_core",
    [ax - 0.5, ay + 1.1, az - 0.5],
    [ax + 0.5, ay + 2.1, az + 0.5],
    2,
    true
  );
}
function buildSwarm(builder, anchor) {
  const [ax, ay, az] = anchor;
  const count = builder.settings.quality === "standard" ? 7 : 10;
  for (let i = 0; i < count; i++) {
    const azimuth = builder.noise(i + 5, 7) / 100 * Math.PI * 2;
    const elevation = (builder.noise(i + 5, 13) / 100 - 0.5) * 2.4;
    const radius = 2.4 + builder.noise(i + 5, 21) / 100 * 2.8;
    const x = ax + Math.cos(azimuth) * Math.cos(elevation) * radius;
    const y = ay + 2 + Math.sin(elevation) * radius * 0.85;
    const z = az + Math.sin(azimuth) * Math.cos(elevation) * radius;
    const size = 0.45 + builder.noise(i + 5, 31) / 100 * 0.55;
    const material = 1 + builder.noise(i + 5, 41) % 4;
    builder.floater(
      "floater_shard",
      [x - size / 2, y - size / 2, z - size / 2],
      [x + size / 2, y + size / 2, z + size / 2],
      material,
      material === 4
    );
  }
}
function applyFloaters(builder) {
  const { floaters, kind } = builder.settings;
  if (!floaters || floaters === "none") return;
  const bounds = builder.bodyBounds();
  const [x, y, z] = FLOATER_ANCHORS[kind] ?? [
    (bounds.min[0] + bounds.max[0]) / 2,
    bounds.max[1] + 1,
    0
  ];
  const anchor = [
    x,
    y + (FLOATER_ANCHORS[kind] ? builder.anchorLift : 0),
    z
  ];
  if (floaters === "crystal") buildCrystal(builder, anchor);
  else if (floaters === "orbit") buildOrbit(builder, anchor);
  else buildSwarm(builder, anchor);
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/modifiers.ts
var RELEASE_THRESHOLD = 0.55;
var RELEASE_STRETCH = 1.35;
var RELEASE_WIDEN = 1.25;
var SEAL_BANDS = [0.2, 0.45, 0.7, 0.9];
var HALO_COUNT = 6;
var SPARK_COUNT = 6;
var GLOWING_MATERIALS = /* @__PURE__ */ new Set([2, 3, 4]);
function applyForm(b) {
  const { form } = b.settings;
  if (form === "base") return;
  const { min, max } = b.bodyBounds();
  const height = max[1] - min[1];
  const centerX = (min[0] + max[0]) / 2;
  if (form === "sealed") {
    for (const cube of b.bodyCubes()) delete cube.emissive;
    for (const ratio of SEAL_BANDS) {
      const y = min[1] + height * ratio;
      const [low2, high2] = b.spanAt(y + 0.3);
      b.ornament(
        "seal_chain",
        [low2 - 0.3, y, min[2] - 0.25],
        [high2 + 0.3, y + 0.6, max[2] + 0.25],
        0
      );
    }
    const sigilY = min[1] + height * 0.55;
    b.ornament(
      "seal_sigil",
      [centerX - 0.6, sigilY, max[2] + 0.25],
      [centerX + 0.6, sigilY + 1.2, max[2] + 0.5],
      6
    );
    return;
  }
  const threshold = min[1] + height * RELEASE_THRESHOLD;
  const stretch = (y) => y > threshold ? threshold + (y - threshold) * RELEASE_STRETCH : y;
  for (const cube of b.bodyCubes()) {
    const centerY = (cube.from[1] + cube.to[1]) / 2;
    if (centerY > threshold) {
      cube.from[0] = centerX + (cube.from[0] - centerX) * RELEASE_WIDEN;
      cube.to[0] = centerX + (cube.to[0] - centerX) * RELEASE_WIDEN;
    }
    cube.from[1] = stretch(cube.from[1]);
    cube.to[1] = stretch(cube.to[1]);
  }
  const top = stretch(max[1]);
  b.anchorLift = top - max[1];
  const [low, high] = b.spanAt(top - 3);
  for (const side of [-1, 1]) {
    const edge = side < 0 ? low : high;
    for (let i = 0; i < 3; i++) {
      const x = edge + side * (0.2 + i * 0.8);
      const y = top - 6 + i * 1.6;
      const [x0, x1] = side < 0 ? [x - 0.8, x] : [x, x + 0.8];
      b.ornament("release_spike", [x0, y, -0.5], [x1, y + 1.4, 0.5], 3, true);
    }
  }
}
function applyTier(b) {
  const tier = b.settings.tier;
  if (!tier) return;
  const { min, max } = b.bodyBounds();
  const height = max[1] - min[1];
  const centerX = (min[0] + max[0]) / 2;
  const front = max[2];
  if (["staff", "elderstaff", "bloodstaff"].includes(b.settings.kind)) {
    for (let i = 0; i < tier; i++) {
      const angle = i / tier * Math.PI * 2;
      const x = centerX + Math.cos(angle) * 3.1;
      const z = Math.sin(angle) * 3.1;
      const y = max[1] - 3 + i % 2 * 1.4;
      b.ornament(
        "tier_gem",
        [x - 0.45, y, z - 0.45],
        [x + 0.45, y + 0.9, z + 0.45],
        i % 2 ? 3 : 4,
        tier >= 2
      );
    }
  } else {
    for (let i = 0; i < tier; i++) {
      const y = min[1] + height * (0.3 + i * 0.1);
      b.ornament(
        "tier_gem",
        [centerX - 0.45, y, front],
        [centerX + 0.45, y + 0.9, front + 0.3],
        i % 2 ? 3 : 4,
        tier >= 2
      );
    }
  }
  if (tier >= 2) {
    b.ornament(
      "tier_crest",
      [centerX - 0.8, max[1], -0.5],
      [centerX + 0.8, max[1] + 0.8, 0.5],
      6
    );
  }
  if (tier >= 3) {
    const y = min[1] + height * 0.7;
    const [low, high] = b.spanAt(y);
    b.ornament("tier_fin", [low - 1.4, y, -0.4], [low, y + 2.4, 0.4], 3, true);
    b.ornament(
      "tier_fin",
      [high, y, -0.4],
      [high + 1.4, y + 2.4, 0.4],
      3,
      true
    );
  }
  if (tier >= 4) {
    for (let i = 0; i < HALO_COUNT; i++) {
      const angle = i / HALO_COUNT * Math.PI * 2;
      const x = centerX + Math.cos(angle) * 2.6;
      const z = Math.sin(angle) * 2.6;
      const y = max[1] + 2.4;
      b.ornament(
        "tier_halo",
        [x - 0.35, y - 0.35, z - 0.35],
        [x + 0.35, y + 0.35, z + 0.35],
        6,
        true,
        true
      );
    }
  }
  if (tier >= 5) {
    const y = min[1] + height * 0.5;
    b.ornament(
      "tier_core",
      [centerX - 0.6, y, front + 0.3],
      [centerX + 0.6, y + 1.2, front + 0.7],
      4,
      true
    );
  }
}
function applyLimitBreak(b) {
  if (!b.settings.limitBreak) return;
  const { min, max } = b.bodyBounds();
  const height = max[1] - min[1];
  const centerX = (min[0] + max[0]) / 2;
  for (const cube of b.bodyCubes())
    if (cube.material === 6) cube.emissive = true;
  const wingY = min[1] + height * 0.58;
  const [low, high] = b.spanAt(wingY);
  for (const side of [-1, 1]) {
    const edge = side < 0 ? low : high;
    for (let i = 0; i < 4; i++) {
      const x = edge + side * (0.3 + i * 1);
      const y = wingY + i * 0.8;
      const length = 3.2 - i * 0.5;
      const [x0, x1] = side < 0 ? [x - 1, x] : [x, x + 1];
      b.ornament("limit_wing", [x0, y, -0.25], [x1, y + length, 0.25], 4, true);
    }
    const crownX = centerX + side * 2.2;
    b.ornament(
      "limit_crown",
      [crownX - 0.5, max[1] + 2, -0.5],
      [crownX + 0.5, max[1] + 3.6, 0.5],
      3,
      true,
      true
    );
  }
}
function applyMode(b) {
  if (b.settings.mode !== "charged") return;
  const { min, max } = b.bodyBounds();
  const height = max[1] - min[1];
  const centerX = (min[0] + max[0]) / 2;
  const radius = (max[0] - min[0]) / 2 + 1.5;
  for (const cube of b.bodyCubes())
    if (GLOWING_MATERIALS.has(cube.material)) cube.emissive = true;
  for (let i = 0; i < SPARK_COUNT; i++) {
    const angle = i / SPARK_COUNT * Math.PI * 2 + b.noise(i, 99) / 50;
    const x = centerX + Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * 0.6;
    const y = min[1] + height * (0.25 + i * 0.1);
    b.ornament(
      "overdrive_spark",
      [x - 0.25, y - 0.25, z - 0.25],
      [x + 0.25, y + 0.25, z + 0.25],
      4,
      true,
      true
    );
  }
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/normalize.ts
var AXES = [0, 1, 2];
var JAVA_EXTENT_LIMIT = 23.5;
var round = (value) => +value.toFixed(4);
function normalizeCubes(cubes, settings) {
  const reference = cubes.some((cube) => !cube.ornament) ? cubes.filter((cube) => !cube.ornament) : cubes;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const cube of reference) {
    for (const axis of AXES) {
      min[axis] = Math.min(min[axis], cube.from[axis]);
      max[axis] = Math.max(max[axis], cube.to[axis]);
    }
  }
  const target = [settings.width, settings.height, settings.depth];
  const project = (value, axis) => {
    const center = (min[axis] + max[axis]) / 2;
    const span = max[axis] - min[axis];
    return round((value - center) * target[axis] / span);
  };
  let result = cubes.map((cube, index) => ({
    ...cube,
    name: `${cube.name}_${index + 1}`,
    from: cube.from.map(project),
    to: cube.to.map(project)
  }));
  const extent = Math.max(
    ...result.flatMap((cube) => [...cube.from, ...cube.to].map(Math.abs))
  );
  if (extent > JAVA_EXTENT_LIMIT) {
    const factor = JAVA_EXTENT_LIMIT / extent;
    result = result.map((cube) => ({
      ...cube,
      from: cube.from.map((value) => round(value * factor)),
      to: cube.to.map((value) => round(value * factor))
    }));
  }
  return result;
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/palette.ts
var STEEL_PALETTE = [
  "#22262c",
  "#3b434c",
  "#69757f",
  "#9fadb8",
  "#dfe9f2",
  "#2c241c",
  "#c98f3a",
  "#3f6f8a"
];
var PALETTE_RULES = [
  {
    match: /ブラッド|血晶|血月|blood/i,
    colors: [
      "#24101a",
      "#4e1a2b",
      "#aa203c",
      "#f04a60",
      "#ffd4cc",
      "#392330",
      "#bd8e67",
      "#742741"
    ]
  },
  {
    match: /禍々|深淵|黒曜|呪|abyss|cursed/i,
    colors: [
      "#17141f",
      "#30283e",
      "#704492",
      "#b573d6",
      "#e6bbff",
      "#29222e",
      "#987984",
      "#51315b"
    ]
  },
  {
    match: /紫|アメジスト|purple|amethyst/i,
    veto: /刀身|ダイヤモンド|透き通る/i,
    colors: [
      "#322946",
      "#63508c",
      "#9878d9",
      "#c4a1f3",
      "#e5d4ff",
      "#3c314d",
      "#b99a65",
      "#745c99"
    ]
  },
  {
    match: /炎|赤い|ルビー|fire|ruby|red/i,
    colors: [
      "#482c36",
      "#a04448",
      "#e76552",
      "#ffac76",
      "#ffe0a0",
      "#4b3345",
      "#b39356",
      "#835566"
    ]
  },
  {
    match: /エメラルド|緑|emerald|green/i,
    colors: [
      "#213e35",
      "#2b7b56",
      "#58c48a",
      "#98e9b1",
      "#d9ffe0",
      "#423745",
      "#b49a60",
      "#667c57"
    ]
  },
  {
    match: /氷|青い|ice|blue/i,
    colors: [
      "#253c54",
      "#3c6e9d",
      "#62afe6",
      "#a0d7ff",
      "#def5ff",
      "#3c405e",
      "#aaa5bd",
      "#7886ae"
    ]
  },
  {
    match: /機械|鋼鉄|メタル|steel|machine|metal|ネオン/i,
    colors: STEEL_PALETTE
  }
];
function paletteForPrompt(prompt, kind) {
  for (const rule of PALETTE_RULES) {
    if (!rule.match.test(prompt)) continue;
    if (rule.veto?.test(prompt)) continue;
    return [...rule.colors];
  }
  return kind && MECHANICAL_KINDS.includes(kind) ? [...STEEL_PALETTE] : [...DEFAULT_PALETTE];
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/shapes/axe.ts
function buildAxe(b) {
  b.handle(-14, 12, 1.8);
  for (let y = 3; y < 13; y++) {
    const reach = y < 5 || y > 10 ? 6 : 8;
    for (let x = 1; x < reach; x++) {
      const edge = x === reach - 1 || y === 3 || y === 12;
      const material = edge ? 0 : x > reach - 3 ? 3 : b.noise(x, y) < 35 ? 1 : 2;
      b.box("axe_blade", [x, y, -0.75], [x + 1, y + 1, 0.75], material);
    }
  }
  b.box("axe_neck", [-3.5, 6, -1.2], [2, 10, 1.2], 0);
  b.box("axe_back_spike", [-5, 7, -0.8], [-3.5, 9, 0.8], 1);
  b.box("axe_binding", [-1.3, 6.5, -1.3], [1.3, 10.5, 1.3], 6);
  b.box("axe_gem", [-0.75, 7.5, 1.3], [0.75, 9.5, 1.6], 3, true);
  if (b.detailed && b.settings.style === "fantasy") {
    for (let i = 0; i < b.accentCount; i++) {
      const x = 2.4 + i % 2;
      const y = 4.8 + i * 1.2;
      b.box("axe_rune", [x, y, 0.75], [x + 0.6, y + 0.8, 0.95], 4);
    }
  }
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/shapes/block.ts
function buildBlock(b) {
  b.box("block_core", [-8, -8, -8], [8, 8, 8], 0);
  for (let x = -7; x < 8; x += 2) {
    for (let y = -7; y < 8; y += 2) {
      const sample = b.noise(x, y);
      const material = sample < 40 ? 1 : sample < 65 ? 2 : 0;
      b.box("ore_front", [x, y, 8], [x + 1.8, y + 1.8, 8.15], material);
      b.box("ore_side", [8, y, x], [8.15, y + 1.8, x + 1.8], material);
      b.box(
        "ore_top",
        [x, 8, y],
        [x + 1.8, 8.15, y + 1.8],
        material === 0 ? 1 : 3,
        material !== 0
      );
    }
  }
  if (b.detailed && b.settings.style === "fantasy") {
    for (let i = 0; i < b.accentCount; i++) {
      const x = -5 + i * 2.1;
      b.box(
        "ore_crystal_facet",
        [x, -3 + i, 8.15],
        [x + 1.3, -1.7 + i, 8.4],
        3
      );
    }
  }
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/shapes/cannon.ts
var BARREL_STEPS = 9;
var GEAR_TEETH = 6;
function buildCannon(b) {
  b.handle(-13, -3, 1.8);
  b.box("cannon_receiver", [-3, -3, -2.4], [3, 3, 2.4], 0);
  b.box("cannon_plate", [-3.2, -3.2, 2.4], [3.2, 3.2, 2.7], 6);
  b.box("cannon_plate_back", [-3.2, -3.2, -2.7], [3.2, 3.2, -2.4], 1);
  b.box("cannon_rail", [-0.7, -3.4, 2.7], [0.7, 3.4, 3.1], 2, true);
  for (let i = 0; i < BARREL_STEPS; i++) {
    const y = 3 + i * 1.35;
    const width = 1.7 + (i > 6 ? (i - 6) * 0.35 : 0);
    b.box(
      "cannon_barrel",
      [-width, y, -width],
      [width, y + 1.25, width],
      i % 2 ? 0 : 1
    );
    if (i % 3 === 1) {
      b.box(
        "cannon_barrel_glow",
        [-0.45, y + 0.2, width],
        [0.45, y + 1.05, width + 0.35],
        2,
        true
      );
    }
  }
  b.box("cannon_muzzle", [-2.9, 14.6, -2.9], [2.9, 16.2, 2.9], 6);
  b.box("cannon_muzzle_ring", [-3.3, 16.2, -3.3], [3.3, 16.9, 3.3], 0);
  b.box("cannon_core", [-1.5, 15, -1.5], [1.5, 16.6, 1.5], 2, true);
  b.box("cannon_core_lens", [-0.8, 16.9, -0.8], [0.8, 17.6, 0.8], 4, true);
  for (const side of [-1, 1]) {
    const x = side * 3;
    b.box("cannon_gear", [x - 0.5, -1.7, -1.7], [x + 0.5, 1.7, 1.7], 6);
    b.box(
      "cannon_gear_hub",
      [x + (side < 0 ? -1.1 : 0.5), -0.7, -0.7],
      [x + (side < 0 ? -0.5 : 1.1), 0.7, 0.7],
      0
    );
    for (let i = 0; i < GEAR_TEETH; i++) {
      const angle = i / GEAR_TEETH * Math.PI * 2;
      const y = Math.cos(angle) * 2.5;
      const z = Math.sin(angle) * 2.5;
      b.box(
        "cannon_gear_tooth",
        [x - 0.5, y - 0.45, z - 0.45],
        [x + 0.5, y + 0.45, z + 0.45],
        i % 2 ? 1 : 2
      );
    }
    b.box(
      "cannon_pipe",
      [side * 3.7 - 0.4, -2, -1.2],
      [side * 3.7 + 0.4, 6.5, -0.4],
      6
    );
    b.box(
      "cannon_pipe_elbow",
      [side * 3.7 - 0.4, 6.5, -1.2],
      [side * 3.7 + 0.4, 7.4, 1.4],
      0
    );
    b.box(
      "cannon_grip_guard",
      [side * 2 - 0.35, -5.4, -1.5],
      [side * 2 + 0.35, -3, -1.1],
      1
    );
  }
  if (b.detailed) {
    for (let i = 0; i < b.accentCount; i++) {
      const x = -1.8 + i * 1.8;
      b.box("cannon_rivet", [x - 0.3, 0.6, 2.7], [x + 0.3, 1.2, 3], 4, true);
    }
  }
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/shapes/drill.ts
var FLIGHT_STEPS = 26;
var FLIGHT_TURNS = 5;
var GEAR_TEETH2 = 8;
function buildDrill(b) {
  b.handle(-15, -2, 1.8);
  b.box("drill_gear_housing", [-3.2, -2, -2.2], [3.2, 3.2, 2.2], 0);
  b.box("drill_gear_face", [-2.4, 3.2, -2.4], [2.4, 3.9, 2.4], 1);
  for (let i = 0; i < GEAR_TEETH2; i++) {
    const angle = i / GEAR_TEETH2 * Math.PI * 2;
    const x = Math.cos(angle) * 3.6;
    const z = Math.sin(angle) * 3.6;
    b.box(
      "drill_gear_tooth",
      [x - 0.55, 0.2, z - 0.55],
      [x + 0.55, 2.2, z + 0.55],
      i % 2 ? 1 : 2
    );
  }
  for (let i = 0; i < 4; i++) {
    const angle = i / 4 * Math.PI * 2 + Math.PI / 4;
    b.box(
      "drill_bolt",
      [Math.cos(angle) * 1.7 - 0.35, 3.9, Math.sin(angle) * 1.7 - 0.35],
      [Math.cos(angle) * 1.7 + 0.35, 4.5, Math.sin(angle) * 1.7 + 0.35],
      6
    );
  }
  b.box("drill_shaft", [-0.85, 3.4, -0.85], [0.85, 16, 0.85], 0);
  for (let i = 0; i < FLIGHT_STEPS; i++) {
    const t = i / (FLIGHT_STEPS - 1);
    const y = 3.6 + t * 12.2;
    const angle = t * Math.PI * 2 * FLIGHT_TURNS;
    const radius = 2.5 * (1 - t * 0.82);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const span = 1.15 - t * 0.55;
    b.box(
      "drill_flight",
      [x - span, y, z - span],
      [x + span, y + 0.55, z + span],
      i % 3 === 0 ? 2 : 1
    );
    if (i % 4 === 1)
      b.box(
        "drill_flight_light",
        [x - span * 0.5, y + 0.55, z - span * 0.5],
        [x + span * 0.5, y + 0.75, z + span * 0.5],
        3,
        true
      );
  }
  b.box("drill_tip", [-0.5, 16, -0.5], [0.5, 18, 0.5], 2, true);
  b.box("drill_tip_point", [-0.22, 18, -0.22], [0.22, 19.2, 0.22], 4, true);
  for (const side of [-1, 1]) {
    const x = side * 3.6;
    b.box("drill_pipe", [x - 0.45, -1.2, -1.5], [x + 0.45, 4.2, -0.6], 6);
    b.box("drill_pipe_cap", [x - 0.62, 4.2, -1.68], [x + 0.62, 5.1, -0.42], 0);
    b.box(
      "drill_exhaust_glow",
      [x - 0.32, 4.3, -1.36],
      [x + 0.32, 4.9, -0.74],
      3,
      true
    );
    b.box("drill_vent", [x - 0.35, -1.6, 1.4], [x + 0.35, 1.4, 1.8], 1);
  }
  if (b.detailed) {
    for (let i = 0; i < b.accentCount; i++) {
      const y = -1 + i * 1.5;
      b.box("drill_cable", [-3.9, y, -0.3], [-3.2, y + 0.6, 0.3], 0);
      b.box("drill_cable", [3.2, y, -0.3], [3.9, y + 0.6, 0.3], 0);
    }
  }
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/shapes/mechblade.ts
var SEGMENTS = 6;
function buildMechBlade(b) {
  b.handle(-15, -5, 2);
  b.box("mech_guard", [-3.4, -6, -1.9], [3.4, -3.6, 1.9], 0);
  b.box("mech_guard_plate", [-3.6, -6.2, 1.9], [3.6, -3.4, 2.15], 6);
  b.box("mech_guard_plate", [-3.6, -6.2, -2.15], [3.6, -3.4, -1.9], 1);
  for (const side of [-1, 1]) {
    const x = side * 3.6;
    b.box("mech_thruster", [x - 0.8, -5.4, -1.2], [x + 0.8, -1.6, 1.2], 1);
    b.box(
      "mech_thruster_ring",
      [x - 0.95, -1.6, -1.35],
      [x + 0.95, -1, 1.35],
      0
    );
    b.box(
      "mech_thruster_glow",
      [x - 0.5, -0.95, -0.6],
      [x + 0.5, -0.1, 0.6],
      2,
      true
    );
    b.box("mech_wing_rail", [x - 0.3, -3.4, -1], [x + 0.3, -1, 1], 6);
  }
  for (let segment = 0; segment < SEGMENTS; segment++) {
    const y = -3 + segment * 3.1;
    const half = segment < 4 ? 2.6 : 2.1;
    b.box("mech_blade_segment", [-half, y, -0.85], [half, y + 2.6, 0.85], 1);
    b.box(
      "mech_blade_plate",
      [-half + 0.35, y + 0.35, 0.85],
      [half - 0.35, y + 2.25, 1.05],
      3
    );
    for (const side of [-1, 1]) {
      const edgeX = side < 0 ? -half - 0.25 : half - 0.25;
      b.box(
        "mech_blade_edge",
        [edgeX, y, -0.7],
        [edgeX + 0.5, y + 2.6, 0.7],
        4,
        true
      );
    }
    if (segment < SEGMENTS - 1) {
      b.box(
        "mech_neon_line",
        [-0.35, y + 2.6, 0.85],
        [0.35, y + 3.15, 1.1],
        2,
        true
      );
      b.box("mech_joint", [-0.9, y + 2.6, -0.9], [0.9, y + 3.15, 0.9], 0);
    }
    if (b.detailed && segment % 2 === 0) {
      b.box("mech_rune", [-0.6, y + 0.9, 1.05], [0.6, y + 1.8, 1.25], 4, true);
    }
  }
  b.box("mech_tip", [-1.6, 15.6, -0.85], [1.6, 17.6, 0.85], 1);
  b.box("mech_tip_crown", [-0.9, 17.6, -0.6], [0.9, 18.6, 0.6], 0);
  b.box("mech_tip_glow", [-0.4, 18.6, -0.35], [0.4, 20, 0.35], 2, true);
  for (const cube of b.cubes) {
    if (cube.name.startsWith("mech_thruster") || cube.name.startsWith("mech_wing_rail"))
      cube.rig = cube.from[0] < 0 ? "panel_left" : "panel_right";
  }
  if (!b.settings.symmetric) {
    b.box("mech_asymmetric_rail", [3.2, -2, -1.6], [3.9, 8, -0.9], 6);
  }
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/shapes/pickaxe.ts
function buildPickaxe(b) {
  b.handle(-14, 8, 1.6);
  const headHeight = (x) => 10 - Math.floor(Math.abs(x + 0.5) / 2.5);
  for (let x = -8; x < 8; x++) {
    const y = headHeight(x);
    b.box("pick_frame", [x, y - 2, -1.1], [x + 1, y + 1, 1.1], 0);
    b.box(
      "pick_crystal",
      [x, y - 0.9, -1.15],
      [x + 1, y + 0.75, 1.15],
      x < 1 ? 3 : 2
    );
  }
  b.box("left_tip", [-9, 5, -0.85], [-8, 8, 0.85], 2);
  b.box("right_tip", [8, 5, -0.85], [9, 8, 0.85], 1);
  b.box("head_binding", [-1.5, 7, -1.3], [1.5, 10.5, 1.3], 6);
  b.box("head_gem", [-0.8, 8, 1.3], [0.8, 9.7, 1.6], 3, true);
  if (b.detailed && b.settings.style === "fantasy") {
    for (let i = 0; i < b.accentCount; i++) {
      const x = -5 + i * 2;
      const y = headHeight(x);
      b.box(
        "pick_crystal_facet",
        [x, y - 0.5, 1.15],
        [x + 0.7, y + 0.5, 1.35],
        4
      );
    }
  }
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/shapes/shield.ts
function buildShield(b) {
  for (let y = -11; y < 12; y++) {
    const half = y < -5 ? Math.max(1, Math.floor((y + 13) / 1.4)) : y > 9 ? 6 : 8;
    for (let x = -half; x < half; x++) {
      const edge = x === -half || x === half - 1 || y === 11;
      const border = x === -half + 1 || x === half - 2 || y === 10;
      const material = edge ? 0 : border ? 6 : Math.abs(x) < 1 ? 7 : 5;
      b.box("shield_pixel", [x, y, -0.8], [x + 1, y + 1, 0.8], material);
    }
  }
  b.box("emblem_frame", [-3, -1, 0.8], [3, 5, 1.4], 6);
  b.box("emblem_dark", [-2.5, -0.5, 1.4], [2.5, 4.5, 1.6], 0);
  b.box("emblem_crystal", [-1.6, 0.4, 1.6], [1.6, 3.6, 2.3], 2, true);
  b.box("emblem_glint", [-1.3, 2.5, 2.3], [-0.4, 3.3, 2.45], 4, true);
  b.box("shield_grip", [-2.5, -2.5, -2], [2.5, 2.5, -1.6], 6);
  if (b.detailed && b.settings.style === "fantasy") {
    for (const side of [-1, 1]) {
      for (let i = 0; i < b.accentCount; i++) {
        const offset = !b.settings.symmetric && side < 0 ? 0.75 : 0;
        const y = -4 + i * 2.5 + offset;
        const x = side < 0 ? -5.5 : 4.5;
        b.box("shield_rune", [x, y, 0.8], [x + 1, y + 1.4, 1.1], 6);
      }
    }
  }
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/shapes/staff.ts
function buildStaff(b) {
  b.handle(-16, 7, 1.4);
  for (const side of [-1, 1]) {
    const armX = side < 0 ? -4 : 2.5;
    b.box("crown_arm", [armX, 6, -0.85], [armX + 1.5, 12, 0.85], 6);
    const tipX = side < 0 ? -3.5 : 2;
    b.box("crown_tip", [tipX, 12, -0.8], [tipX + 1.5, 14, 0.8], 0);
  }
  b.box("crown_base", [-3, 6, -1], [3, 8, 1], 0);
  for (let y = 9; y < 17; y++) {
    const half = y < 11 || y > 14 ? 1 : 2;
    for (let x = -half; x < half; x++) {
      b.box(
        "staff_crystal",
        [x, y, -1.4],
        [x + 1, y + 1, 1.4],
        x < 0 ? 3 : 2,
        x >= 0
      );
    }
  }
  if (b.detailed) {
    for (let y = -12; y < 5; y += 4)
      b.box("staff_rune", [-0.4, y, 1], [0.4, y + 1, 1.2], 3, true);
  }
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/shapes/sword.ts
var BLADE_ROWS = 22;
var GRIP_RINGS = 5;
function buildSword(b) {
  const { symmetric, detail, style } = b.settings;
  b.handle(-14.5, -6.4, 1.8);
  for (let row = 0; row < BLADE_ROWS; row++) {
    const y = -6 + row;
    const half = row > 19 ? 1 : row > 17 ? 2 : 3;
    for (let x = -half; x < half; x++) {
      const edge = x === -half || x === half - 1;
      let material = edge ? x < 0 ? 1 : 0 : x <= -1 ? 3 : 2;
      if (!edge && b.noise(symmetric ? Math.abs(x + 0.5) : x, row) < detail / 4)
        material = x < 0 ? 4 : 1;
      if (style === "vanilla" && !edge) material = 2;
      b.box("blade_pixel", [x, y, -0.65], [x + 1, y + 1, 0.65], material);
    }
    if (style === "vanilla") continue;
    if (half === 3 && row > 0 && row < 19) {
      b.box("blade_edge_light", [-3, y, 0.62], [-2, y + 1, 0.82], 4, true);
      b.box("blade_edge_light", [2, y, 0.62], [3, y + 1, 0.82], 4, true);
    }
    if (half === 3) {
      b.box("blade_fuller", [-0.6, y, -0.62], [0.6, y + 1, 0.62], 0);
      b.box("blade_fuller_ridge", [-0.16, y, -0.72], [0.16, y + 1, 0.72], 3);
    }
  }
  b.box("blade_tip", [-1.4, 16, -0.6], [1.4, 17, 0.6], 2);
  b.box("blade_tip", [-0.75, 17, -0.5], [0.75, 18, 0.5], 3);
  if (style !== "vanilla") {
    b.box("blade_tip_point", [-0.28, 18, -0.3], [0.28, 18.9, 0.3], 4, true);
  }
  b.box("guard_center", [-2.3, -7.7, -1.5], [2.3, -5.7, 1.5], 0);
  b.box("guard_plate", [-2.5, -7.9, 1.5], [2.5, -5.5, 1.75], 6);
  for (const side of [-1, 1]) {
    const armX = side < 0 ? -5.4 : 2.3;
    b.box("guard_arm", [armX, -7.1, -1.1], [armX + 3.1, -5.5, 1.1], 0);
    b.box(
      "guard_gold_inlay",
      [armX + 0.25, -6.1, 1.1],
      [armX + 2.85, -5.65, 1.32],
      style === "vanilla" ? 1 : 6
    );
    b.box(
      "guard_rune",
      [armX + 0.6, -6.95, 1.32],
      [armX + 1.5, -6.25, 1.52],
      6,
      true
    );
    const tipX = side < 0 ? -6.7 : 5.4;
    b.box("guard_tip", [tipX, -6.4, -1.15], [tipX + 1.3, -4.1, 1.15], 0);
    b.box(
      "guard_tip_light",
      [tipX + 0.2, -5, 1.15],
      [tipX + 1.1, -4.25, 1.3],
      1
    );
    if (style !== "vanilla") {
      b.box(
        "guard_tip_crystal",
        [tipX + 0.35, -3.7, -0.7],
        [tipX + 0.95, -2.7, 0.7],
        2,
        true
      );
    }
  }
  b.box("hilt_gold", [-1.5, -7.65, 1.5], [1.5, -5.75, 1.7], 6);
  b.box("hilt_gem_frame", [-1.1, -7.4, 1.7], [1.1, -5.9, 1.9], 0);
  b.box("hilt_crystal", [-0.7, -7.15, 1.9], [0.7, -6.15, 2.3], 2, true);
  if (style !== "vanilla") {
    for (let i = 0; i < GRIP_RINGS; i++) {
      const y = -13.2 + i * 1.35;
      b.box("grip_ring", [-1.35, y, -1.15], [1.35, y + 0.38, 1.15], 0);
      b.box(
        "grip_ring_trim",
        [-1.1, y + 0.38, -1.05],
        [1.1, y + 0.58, 1.05],
        6
      );
    }
  }
  if (b.detailed) {
    const step = b.settings.quality === "ultra" ? 1.5 : 3;
    for (let y = -4; y < 12; y += step) {
      b.box(
        "crystal_facet",
        [-0.15, y, 0.72],
        [0.55, y + 1.2, 0.88],
        b.noise(3, Math.floor(y)) > 45 ? 3 : 2
      );
    }
    b.box("pommel_crystal", [-0.55, -15.5, -0.7], [0.55, -14.9, 0.7], 2, true);
    b.ornament("pommel_chain", [-0.5, -16.7, -0.5], [0.5, -15.7, 0.5], 6);
    b.ornament("pommel_chain", [-0.38, -17.8, -0.38], [0.38, -16.9, 0.38], 0);
    b.ornament(
      "pommel_chain_link",
      [-0.28, -18.7, -0.28],
      [0.28, -18, 0.28],
      6,
      true
    );
  }
  if (!symmetric) b.box("asymmetric_guard", [4.8, -4.1, -1], [6.5, -1.6, 1], 6);
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/primitives.ts
function rigBox(b, name, from, to, material, rig, emissive = false) {
  b.box(name, from, to, material, emissive);
  b.cubes[b.cubes.length - 1].rig = rig;
}
function voxelLine(b, name, a, end, thickness, material, emissive = false, rig) {
  const length = Math.max(...end.map((value, i) => Math.abs(value - a[i])));
  const steps = Math.max(1, Math.ceil(length / Math.max(thickness * 0.9, 0.5)));
  for (let step = 0; step <= steps; step++) {
    const p = a.map(
      (value, i) => value + (end[i] - value) * step / steps
    );
    const from = p.map((value) => value - thickness / 2);
    const to = p.map((value) => value + thickness / 2);
    if (rig) rigBox(b, name, from, to, material, rig, emissive);
    else b.box(name, from, to, material, emissive);
  }
}
function ring(b, name, center, radius, count, thickness, material, plane = "xy", emissive = false) {
  for (let i = 0; i < count; i++) {
    const a = i * Math.PI * 2 / count;
    const p = [center[0] + Math.cos(a) * radius, center[1], center[2]];
    if (plane === "xy") p[1] += Math.sin(a) * radius;
    else p[2] += Math.sin(a) * radius;
    b.box(
      name,
      p.map((n) => n - thickness / 2),
      p.map((n) => n + thickness / 2),
      material,
      emissive
    );
  }
}
function crystal(b, name, center, height, width, material = 2, emissive = true) {
  for (let y = 0; y < 7; y++) {
    const half = width * (y === 0 || y === 6 ? 0.25 : y === 1 || y === 5 ? 0.36 : 0.5);
    const bottom = center[1] - height / 2 + y * height / 7;
    b.box(
      name,
      [center[0] - half, bottom, center[2] - half],
      [center[0] + half, bottom + height / 7, center[2] + half],
      y % 3 === 1 ? Math.min(4, material + 1) : material,
      emissive
    );
  }
}
function hangingChain(b, name, start, links, material = 6) {
  for (let i = 0; i < links; i++) {
    const y = start[1] - i * 1.2;
    if (i % 2)
      b.box(
        name,
        [start[0] - 0.2, y - 0.9, start[2] - 0.55],
        [start[0] + 0.2, y, start[2] + 0.55],
        material
      );
    else {
      for (const x of [-0.45, 0.3])
        b.box(
          name,
          [start[0] + x, y - 0.9, start[2] - 0.18],
          [start[0] + x + 0.15, y, start[2] + 0.18],
          material
        );
      b.box(
        name,
        [start[0] - 0.45, y - 0.9, start[2] - 0.18],
        [start[0] + 0.45, y - 0.7, start[2] + 0.18],
        material
      );
    }
  }
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/shapes/arcane.ts
function buildRuneBlade(b) {
  buildSword(b);
  for (let y = -3; y < 14; y += 2) {
    b.box("rune_blade_glyph", [-0.8, y, 0.9], [0.8, y + 0.35, 1.15], 4, true);
    b.box(
      "rune_blade_glyph",
      [-0.25, y - 0.4, 0.9],
      [0.25, y + 0.9, 1.15],
      3,
      true
    );
  }
  ring(b, "rune_guard_seal", [0, -6, 2.4], 2, 16, 0.4, 6, "xy", true);
}
function buildCursedBlade(b) {
  b.handle(-16, -6, 2);
  b.box("abyss_spine", [-1.1, -6, -0.9], [1.1, 18, 0.9], 0);
  for (let y = -5; y < 16; y++) {
    const w = y > 12 ? 1.5 : 2.8;
    b.box("abyss_blade", [-w, y, -0.7], [w, y + 1, 0.7], y % 4 ? 1 : 2);
    if (y % 3 === 0)
      for (const s of [-1, 1]) {
        b.box(
          "abyss_serration",
          [s < 0 ? -w - 1.6 : w, y, -0.55],
          [s < 0 ? -w : w + 1.6, y + 1.8, 0.55],
          0
        );
        b.box("abyss_vein", [-0.2, y, 0.7], [0.2, y + 1.6, 1], 3, true);
      }
  }
  for (const s of [-1, 1]) {
    voxelLine(b, "abyss_horn", [s * 1.5, -6, 0], [s * 5.2, -3.8, 0], 1.5, 0);
    voxelLine(
      b,
      "abyss_horn_tip",
      [s * 5.2, -3.8, 0],
      [s * 4.8, -1, 0],
      0.8,
      1
    );
    hangingChain(b, "abyss_chain", [s * 4.2, -6, 0], 4, 6);
  }
  crystal(b, "abyss_eye", [0, -5, 1.2], 2.4, 2.2, 3);
  b.box("abyss_eye_pupil", [-0.18, -5.6, 2.4], [0.18, -4.3, 2.7], 0);
  b.box("abyss_point", [-0.45, 18, -0.45], [0.45, 20, 0.45], 3, true);
}
function buildBloodBlade(b) {
  b.handle(-16, -5, 1.7);
  for (let y = -5; y < 17; y++) {
    const reach = y > 12 ? 2 : 3.2;
    b.box(
      "blood_blade",
      [-reach, y, -0.7],
      [reach, y + 1, 0.7],
      y % 3 === 0 ? 3 : 2,
      true
    );
    b.box("blood_spine", [-0.5, y, -0.82], [0.5, y + 1, 0.82], 0);
    if (y % 4 === 0)
      for (const s of [-1, 1])
        b.box(
          "blood_fang",
          [s < 0 ? -reach - 1.3 : reach, y, -0.5],
          [s < 0 ? -reach : reach + 1.3, y + 2, 0.5],
          1
        );
  }
  voxelLine(b, "blood_crossguard", [-5, -6, 0], [5, -6, 0], 1.5, 0);
  crystal(b, "blood_heart", [0, -5.4, 1], 2.8, 2.5, 3);
  for (const s of [-1, 1])
    voxelLine(
      b,
      "blood_crescent",
      [s * 4.5, -6, 0],
      [s * 3.4, -2.8, 0],
      0.9,
      6
    );
  b.box("blood_tip", [-0.6, 17, -0.4], [0.6, 19, 0.4], 4, true);
}
function buildElderStaff(b) {
  b.handle(-18, 6, 1.5);
  b.box("astral_neck", [-1.7, 4, -1.5], [1.7, 7, 1.5], 6);
  ring(b, "astral_armillary_outer", [0, 11, 0], 5.2, 28, 0.65, 6);
  ring(b, "astral_armillary_inner", [0, 11, 0], 3.9, 24, 0.45, 3, "xz", true);
  crystal(b, "astral_star", [0, 11, 0], 5, 3.2, 2);
  for (const s of [-1, 1]) {
    voxelLine(b, "astral_crown", [s * 3.7, 14, 0], [s * 2, 18.2, 0], 0.65, 6);
    hangingChain(b, "astral_chain", [s * 4.4, 10, 0], 5, 6);
  }
  for (let y = -15; y < 5; y += 3) {
    ring(b, "astral_grip_ring", [0, y, 0], 1.4, 8, 0.35, 6, "xz");
    b.box("astral_handle_glyph", [-0.25, y, 1], [0.25, y + 1, 1.3], 4, true);
  }
}
function buildBloodStaff(b) {
  b.handle(-18, 5, 1.4);
  for (const s of [-1, 1]) {
    voxelLine(b, "blood_moon", [0, 5, 0], [s * 4.2, 9, 0], 1.2, 0);
    voxelLine(b, "blood_moon", [s * 4.2, 9, 0], [s * 3.4, 15, 0], 1, 2, true);
    voxelLine(
      b,
      "blood_moon_tip",
      [s * 3.4, 15, 0],
      [s * 1.7, 17, 0],
      0.6,
      3,
      true
    );
    hangingChain(b, "blood_staff_chain", [s * 3.5, 10, 0], 4, 6);
  }
  crystal(b, "blood_staff_heart", [0, 11, 0], 4.8, 2.4, 3);
  for (let y = -12; y < 5; y += 3.5) {
    b.box("blood_bone_wrap", [-1.4, y, -1.2], [1.4, y + 0.6, 1.2], 0);
    b.box("blood_staff_rune", [-0.3, y + 0.6, 1], [0.3, y + 1.6, 1.3], 3, true);
  }
}
function buildGrimoire(b) {
  b.box("grimoire_spine", [-0.65, -6, -1.4], [0.65, 6, 1.4], 6);
  for (const side of [-1, 1]) {
    const x = side < 0 ? -8 : 0.6;
    const X = side < 0 ? -0.6 : 8;
    b.box("grimoire_cover", [x, -6, -1.7], [X, 6, -1.1], 0);
    for (let p = 0; p < 5; p++)
      rigBox(
        b,
        "grimoire_page",
        [x + 0.2, -5.7, -1 + p * 0.28],
        [X - 0.2, 5.7, -0.76 + p * 0.28],
        p % 2 ? 4 : 6,
        "page"
      );
    for (const y of [-5.7, 5.1])
      b.box(
        "grimoire_gold_corner",
        [side < 0 ? -8 : 6.4, y, -0.1],
        [side < 0 ? -6.4 : 8, y + 0.6, 0.5],
        6
      );
    for (let y = -4; y < 4; y += 1.4) {
      rigBox(
        b,
        "grimoire_ink",
        [side < 0 ? -6.8 : 1.5, y, 0.65],
        [side < 0 ? -1.5 : 6.8, y + 0.15, 0.82],
        y % 2 ? 1 : 3,
        "page",
        true
      );
      rigBox(
        b,
        "grimoire_glyph",
        [side * 4 - 0.25, y + 0.15, 0.65],
        [side * 4 + 0.25, y + 0.7, 0.85],
        3,
        "page",
        true
      );
    }
    hangingChain(b, "grimoire_bookmark", [side * 6, -6, 0], 3);
  }
  ring(b, "grimoire_sigil", [0, 1, 2.2], 2.4, 16, 0.4, 3, "xy", true);
  crystal(b, "grimoire_seal", [0, 1, 2.2], 2, 1.3, 3);
}
function buildMagicCircle(b) {
  ring(b, "sigil_outer", [0, 0, 0], 11, 64, 0.5, 3, "xy", true);
  ring(b, "sigil_gold", [0, 0, 0], 10.1, 56, 0.35, 6);
  ring(b, "sigil_inner", [0, 0, 0], 8, 48, 0.35, 3, "xy", true);
  const points = Array.from({ length: 6 }, (_, i) => [
    Math.cos(i * Math.PI / 3) * 7,
    Math.sin(i * Math.PI / 3) * 7,
    0
  ]);
  for (let i = 0; i < 6; i++)
    voxelLine(b, "sigil_star", points[i], points[(i + 2) % 6], 0.3, 2, true);
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    const x = Math.cos(a) * 9, y = Math.sin(a) * 9;
    b.box(
      "sigil_glyph",
      [x - 0.2, y - 0.7, -0.2],
      [x + 0.2, y + 0.7, 0.2],
      4,
      true
    );
    b.box(
      "sigil_glyph",
      [x - 0.65, y + 0.1, -0.2],
      [x + 0.65, y + 0.35, 0.2],
      6
    );
  }
  crystal(b, "sigil_core", [0, 0, 0], 3, 2, 3);
}
function buildRelic(b) {
  crystal(b, "relic_heart", [0, 1, 0], 9, 4, 3);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const x = Math.cos(a) * 4, z = Math.sin(a) * 4;
    voxelLine(b, "relic_cage", [0, -7, 0], [x, 0, z], 0.55, 6);
    voxelLine(b, "relic_cage", [x, 0, z], [0, 9, 0], 0.55, 6);
    crystal(b, "relic_satellite", [x * 1.3, 2, z * 1.3], 2.5, 1, 3);
  }
  ring(b, "relic_halo", [0, 0, 0], 5, 32, 0.4, 6, "xz", true);
  ring(b, "relic_halo", [0, 4, 0], 4, 24, 0.3, 3, "xz", true);
  b.box("relic_crown", [-1, 9, -1], [1, 11, 1], 6);
  hangingChain(b, "relic_chain", [0, -7, 0], 4, 6);
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/shapes/armory.ts
function buildBow(b) {
  b.box("bow_grip", [2.5, -3, -1], [4.2, 3, 1], 5);
  for (const s of [-1, 1]) {
    voxelLine(b, "bow_limb", [3, s * 2, 0], [5, s * 7, 0], 1.25, 6);
    voxelLine(b, "bow_limb", [5, s * 7, 0], [2, s * 12, 0], 1.15, 0);
    voxelLine(b, "bow_limb", [2, s * 12, 0], [-2, s * 15, 0], 0.8, 6);
    crystal(b, "bow_gem", [3, s * 10, 0.8], 2, 1, 3);
    voxelLine(
      b,
      "bow_string",
      [-2, s * 15, 0],
      [-3, 0, 0],
      0.2,
      4,
      true,
      "string"
    );
  }
  rigBox(b, "bow_arrow", [-3, -0.18, 0], [9, 0.18, 0.4], 6, "string");
  rigBox(
    b,
    "bow_arrow_head",
    [9, -0.65, -0.3],
    [11, 0.65, 0.6],
    3,
    "string",
    true
  );
  for (let y = -2.5; y < 3; y += 1)
    b.box("bow_grip_ring", [2.4, y, -1.1], [4.3, y + 0.25, 1.1], 0);
}
function receiver(b, pistol = false) {
  b.box("gun_receiver", [-7, -1.6, -1.2], [pistol ? 3 : 6, 1.6, 1.2], 1);
  rigBox(
    b,
    "gun_slide",
    [-6, 1.6, -1.35],
    [pistol ? 5 : 5.5, 2.8, 1.35],
    3,
    "mechanism"
  );
  b.box("gun_grip", [-6, -7, -1], [-3, -1.5, 1], 5);
  b.box("gun_trigger_guard", [-3.1, -3.9, -0.6], [0.8, -3.55, 0.6], 0);
  b.box("gun_trigger", [-1.8, -3.5, -0.3], [-1.5, -1.7, 0.3], 6);
  b.box("gun_trigger_guard", [0.5, -3.9, -0.6], [0.85, -1.5, 0.6], 0);
  for (let y = -6.5; y < -2; y += 1)
    b.box("gun_grip_texture", [-6.1, y, 1], [-3.2, y + 0.3, 1.2], 1);
}
function buildPistol(b) {
  receiver(b, true);
  b.box("pistol_muzzle", [3, -0.8, -0.95], [6.8, 1.5, 0.95], 0);
  b.box("pistol_muzzle_rim", [6.8, -0.95, -1.1], [7.3, 1.65, 1.1], 1);
  for (const x of [-5.5, 4])
    b.box("pistol_sight", [x, 2.8, -0.4], [x + 0.5, 3.4, 0.4], 3, true);
  for (let x = -5; x < 1; x += 1)
    rigBox(
      b,
      "pistol_slide_vent",
      [x, 1.7, 1.35],
      [x + 0.35, 2.6, 1.55],
      0,
      "mechanism"
    );
  rigBox(
    b,
    "pistol_magazine",
    [-5.7, -7.4, -0.9],
    [-3.3, -6.8, 0.9],
    6,
    "magazine"
  );
}
function buildRifle(b) {
  receiver(b);
  b.box("rifle_stock", [-14, -1.8, -1.5], [-7, 1.4, 1.5], 0);
  b.box("rifle_stock_pad", [-14.7, -2.2, -1.6], [-14, 1.8, 1.6], 5);
  b.box("rifle_handguard", [6, -1.2, -1.4], [12, 1.5, 1.4], 0);
  b.box("rifle_barrel", [12, -0.35, -0.5], [17, 0.65, 0.5], 2);
  b.box("rifle_muzzle", [17, -0.7, -0.8], [19, 1, 0.8], 0);
  rigBox(b, "rifle_magazine", [0, -6, -1], [3, -1.6, 1], 2, "magazine");
  for (let x = 6.3; x < 12; x += 0.9)
    b.box("rifle_cooling_vent", [x, -0.9, 1.4], [x + 0.4, 1, 1.55], 2);
  b.box("rifle_scope_mount", [-2, 2.8, -0.75], [3, 3.3, 0.75], 0);
  b.box("rifle_scope", [-3, 3.3, -1], [4, 4.8, 1], 1);
  b.box("rifle_scope_lens", [4, 3.45, -0.8], [4.25, 4.65, 0.8], 3, true);
  for (let x = -5; x < 12; x += 1.4)
    b.box("rifle_top_rail", [x, 2.7, -0.4], [x + 0.5, 3.05, 0.4], 0);
}
function buildRailgun(b) {
  receiver(b);
  b.box("railgun_stock", [-12, -1.8, -1.8], [-7, 1.8, 1.8], 0);
  for (const s of [-1, 1]) {
    b.box(
      "railgun_conductor",
      [4, -0.6, s < 0 ? -2.1 : 1.3],
      [19, 0.9, s < 0 ? -1.3 : 2.1],
      2
    );
    b.box(
      "railgun_energy_track",
      [5, 0.9, s < 0 ? -1.8 : 1.5],
      [19, 1.15, s < 0 ? -1.5 : 1.8],
      3,
      true
    );
    for (let x = 5; x < 18; x += 2.3) {
      b.box(
        "railgun_coil",
        [x, -1.3, s < 0 ? -2.9 : 1.9],
        [x + 0.7, 1.6, s < 0 ? -1.9 : 2.9],
        6
      );
      b.box(
        "railgun_capacitor",
        [x, -1.45, s < 0 ? -2.5 : 2.1],
        [x + 0.5, -1.25, s < 0 ? -2.1 : 2.5],
        3,
        true
      );
    }
  }
  crystal(b, "railgun_core", [-2, 1, 0], 3.5, 2, 3);
  b.box("railgun_energy_chamber", [-4, -1.5, 1.3], [2, 1.5, 1.65], 0);
  for (let x = -3; x < 2; x++)
    b.box(
      "railgun_chamber_glow",
      [x, -0.8, 1.65],
      [x + 0.45, 0.8, 1.85],
      3,
      true
    );
  rigBox(b, "railgun_cell", [-1, -5.5, -1.1], [2, -1.6, 1.1], 6, "magazine");
}
function buildChainsaw(b) {
  b.handle(-14, -3, 1.8);
  b.box("chainsaw_engine", [-3.5, -3, -2.4], [3.5, 3, 2.4], 6);
  b.box("chainsaw_motor_cover", [-2.8, -2.2, 2.4], [2.8, 2.2, 2.8], 0);
  ring(b, "chainsaw_motor_gear", [0, 0, 2.9], 1.6, 12, 0.4, 2);
  b.box("chainsaw_bar", [-2.2, 3, -0.6], [2.2, 17, 0.6], 1);
  b.box("chainsaw_bar_tip", [-1.5, 17, -0.6], [1.5, 19, 0.6], 2);
  for (let y = 3; y < 18; y += 1)
    for (const s of [-1, 1]) {
      rigBox(
        b,
        "chainsaw_chain_tooth",
        [s < 0 ? -3.2 : 2.2, y, -0.7],
        [s < 0 ? -2.2 : 3.2, y + 0.55, 0.7],
        3,
        "mechanism"
      );
      rigBox(
        b,
        "chainsaw_chain_link",
        [s < 0 ? -2.7 : 2.1, y + 0.6, -0.8],
        [s < 0 ? -2.1 : 2.7, y + 0.85, 0.8],
        0,
        "mechanism"
      );
    }
  b.box("chainsaw_safety_guard", [-4.5, 1, -3], [4.5, 1.6, -2.4], 0);
  for (const s of [-1, 1])
    voxelLine(
      b,
      "chainsaw_handle",
      [s * 4, -3, -2.8],
      [s * 4, 1, -2.8],
      0.65,
      0
    );
  voxelLine(b, "chainsaw_handle", [-4, -3, -2.8], [4, -3, -2.8], 0.65, 0);
  for (let y = -2; y < 2; y += 0.7)
    b.box("chainsaw_exhaust", [-4, y, -1], [-3.5, y + 0.3, 1], 0);
}
function buildSpear(b) {
  b.handle(-22, 7, 1.15);
  for (let y = 5; y < 20; y++) {
    const w = y > 16 ? 0.5 : y > 13 ? 1.2 : y > 10 ? 1.8 : 2.5;
    b.box(
      "spear_leaf_blade",
      [-w, y, -0.45],
      [w, y + 1, 0.45],
      y % 3 ? 3 : 2,
      true
    );
    b.box("spear_gold_spine", [-0.23, y, -0.55], [0.23, y + 1, 0.55], 6);
  }
  for (const s of [-1, 1]) {
    for (let i = 0; i < 5; i++)
      b.box(
        "spear_wing",
        [s < 0 ? -2.3 - i * 0.8 : 1.5 + i * 0.8, 5 + i * 0.5, -0.45],
        [s < 0 ? -1.5 - i * 0.8 : 2.3 + i * 0.8, 8.5 + i * 0.25, 0.45],
        i % 2 ? 6 : 0
      );
    hangingChain(b, "spear_ceremonial_chain", [s * 3, 5, 0], 5);
    for (let i = 0; i < 4; i++)
      b.box(
        "spear_tassel",
        [s * 3 - 0.6 + i * 0.3, -2.5, 0],
        [s * 3 - 0.4 + i * 0.3, 1.2 - i * 0.3, 0.3],
        7
      );
    crystal(b, "spear_crown_gem", [s * 2, 9, 0], 2.2, 1.1, 3);
  }
  for (let y = -18; y < 7; y += 3) {
    ring(b, "spear_gold_collar", [0, y, 0], 1.2, 8, 0.25, 6, "xz");
    b.box(
      "spear_grip_rune",
      [-0.2, y + 0.3, 0.95],
      [0.2, y + 1.3, 1.1],
      3,
      true
    );
  }
  crystal(b, "spear_guard_heart", [0, 5, 1], 3, 2, 3);
  b.box("spear_heel_spike", [-0.4, -24, -0.4], [0.4, -22, 0.4], 6);
}
function buildMace(b) {
  b.handle(-15, 5, 1.8);
  b.box("mace_head_core", [-2, 4, -2], [2, 12, 2], 0);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, x = Math.cos(a) * 3, z = Math.sin(a) * 3;
    b.box("mace_flange", [x - 0.55, 5, z - 0.55], [x + 0.55, 11, z + 0.55], 2);
    b.box(
      "mace_flange_crown",
      [x - 0.6, 11, z - 0.6],
      [x + 0.6, 12.5, z + 0.6],
      6
    );
    b.box(
      "mace_energy_glyph",
      [x - 0.22, 6, z + 0.6],
      [x + 0.22, 9, z + 0.9],
      3,
      true
    );
  }
  ring(b, "mace_crown_ring", [0, 11, 0], 2.5, 16, 0.55, 6, "xz");
  crystal(b, "mace_lightning_core", [0, 12, 0], 3.4, 2.3, 3);
  ring(b, "mace_bottom_collar", [0, 5, 0], 2.5, 12, 0.5, 6, "xz");
  hangingChain(b, "mace_chain", [1.5, -14, 0], 4);
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/shapes/index.ts
var SHAPE_BUILDERS = {
  sword: buildSword,
  pickaxe: buildPickaxe,
  axe: buildAxe,
  shield: buildShield,
  staff: buildStaff,
  block: buildBlock,
  drill: buildDrill,
  cannon: buildCannon,
  mechblade: buildMechBlade,
  runeblade: buildRuneBlade,
  cursedblade: buildCursedBlade,
  bloodblade: buildBloodBlade,
  elderstaff: buildElderStaff,
  bloodstaff: buildBloodStaff,
  grimoire: buildGrimoire,
  magiccircle: buildMagicCircle,
  bow: buildBow,
  rifle: buildRifle,
  pistol: buildPistol,
  railgun: buildRailgun,
  chainsaw: buildChainsaw,
  relic: buildRelic,
  spear: buildSpear,
  mace: buildMace
};

// ../3d-forge/voxelforge-studio/src/lib/geometry/index.ts
function buildGeometry(settings, palette = paletteForPrompt(settings.prompt, settings.kind), regions) {
  const builder = new GeometryBuilder(settings, palette, regions);
  SHAPE_BUILDERS[settings.kind](builder);
  applyForm(builder);
  applyFloaters(builder);
  applyTier(builder);
  applyLimitBreak(builder);
  applyMode(builder);
  return normalizeCubes(builder.cubes, settings);
}

// ../3d-forge/voxelforge-studio/src/lib/geometry/attachments.ts
var ATTACHMENT_LABELS = {
  crystal: "\u7D50\u6676",
  wings: "\u7FFC\u306E\u98FE\u308A",
  halo: "\u5149\u8F2A",
  chain: "\u9396",
  runes: "\u30EB\u30FC\u30F3",
  gear: "\u30AE\u30A2",
  scope: "\u30B9\u30B3\u30FC\u30D7",
  bayonet: "\u9283\u5263",
  sigil: "\u9B54\u6CD5\u9663",
  spikes: "\u68D8"
};
function decorate(b, a) {
  const m = a.material;
  switch (a.kind) {
    case "crystal":
      crystal(b, "crystal", [0, 0, 0], 4, 2, m, a.emissive);
      break;
    case "halo":
      ring(b, "halo", [0, 0, 0], 3, 24, 0.4, m, "xz", a.emissive);
      break;
    case "gear":
      ring(b, "gear_ring", [0, 0, 0], 2, 16, 0.7, m, "xy", a.emissive);
      for (let i = 0; i < 8; i++) {
        const ang = i * Math.PI / 4, x = Math.cos(ang) * 2.8, y = Math.sin(ang) * 2.8;
        b.box(
          "gear_tooth",
          [x - 0.4, y - 0.4, -0.4],
          [x + 0.4, y + 0.4, 0.4],
          m,
          a.emissive
        );
      }
      break;
    case "chain":
      hangingChain(b, "chain", [0, 0, 0], 6, m);
      break;
    case "wings":
      for (const s of [-1, 1])
        for (let i = 0; i < 4; i++) {
          const x = s * (1 + i * 0.8);
          b.box(
            "wing_feather",
            [x - 0.4, -i * 0.45, -0.3],
            [x + 0.4, 2.8 - i * 0.75, 0.3],
            m,
            a.emissive
          );
        }
      break;
    case "runes":
      for (let i = 0; i < 3; i++) {
        b.box(
          "rune",
          [-0.25, i * 1.5, -0.2],
          [0.25, i * 1.5 + 1, 0.2],
          m,
          a.emissive
        );
        b.box(
          "rune",
          [-0.7, i * 1.5 + 0.25, -0.2],
          [0.7, i * 1.5 + 0.5, 0.2],
          m,
          a.emissive
        );
      }
      break;
    case "scope":
      b.box("scope_body", [-3, -0.6, -0.7], [3, 0.6, 0.7], 0);
      b.box("scope_lens", [3, -0.45, -0.5], [3.2, 0.45, 0.5], m, a.emissive);
      b.box("scope_mount", [-1, -1.5, -0.4], [1, -0.6, 0.4], 6);
      break;
    case "bayonet":
      voxelLine(b, "bayonet", [0, 0, 0], [0, 4, 0], 0.6, m, a.emissive);
      b.box("bayonet_guard", [-1, -0.2, -0.3], [1, 0.2, 0.3], 6);
      break;
    case "spikes":
      for (const s of [-1, 0, 1])
        crystal(
          b,
          "spike",
          [s * 1.3, s ? -0.5 : 0, 0],
          s ? 2.2 : 3.4,
          0.8,
          m,
          a.emissive
        );
      break;
    case "sigil":
      ring(b, "sigil", [0, 0, 0], 3, 32, 0.3, m, "xy", a.emissive);
      for (let i = 0; i < 3; i++) {
        const ang = i * Math.PI * 2 / 3, ang2 = (i + 1) * Math.PI * 2 / 3;
        voxelLine(
          b,
          "sigil_line",
          [Math.cos(ang) * 2.2, Math.sin(ang) * 2.2, 0],
          [Math.cos(ang2) * 2.2, Math.sin(ang2) * 2.2, 0],
          0.2,
          m,
          a.emissive
        );
      }
      break;
  }
}
function buildAttachments(settings, palette, regions) {
  return (settings.attachments ?? []).flatMap((a) => {
    const b = new GeometryBuilder(settings, palette, regions);
    decorate(b, a);
    return b.cubes.map((c, i) => ({
      ...c,
      name: `attachment_${a.id}_${a.kind}_${i}`,
      label: `${ATTACHMENT_LABELS[a.kind]} ${i + 1}`,
      ornament: true,
      from: c.from.map(
        (v, j) => Math.max(-23.4, Math.min(23, v * a.scale + a.position[j]))
      ),
      to: c.to.map(
        (v, j) => Math.max(-23.3, Math.min(23.4, v * a.scale + a.position[j]))
      ),
      emissive: a.emissive,
      layer: a.floating ? "floater" : void 0
    })).filter((c) => c.to.every((v, i) => v > c.from[i]));
  });
}

// ../3d-forge/voxelforge-studio/src/lib/settings-schema.ts
var import_pngjs2 = require("pngjs");

// ../3d-forge/voxelforge-studio/src/lib/atlas-limits.ts
var ATLAS_LIMITS = {
  minSize: 16,
  maxSize: 1024,
  maxBytes: 2 * 1024 * 1024,
  /** Base64 data URLs are ~33% larger than the binary they carry. */
  maxDataUrlChars: 3e6,
  maxRequestChars: 31e5
};
var ATLAS_SIZE_MESSAGE = `\u30A2\u30C8\u30E9\u30B9\u306E\u30B5\u30A4\u30BA\u306F${ATLAS_LIMITS.minSize}\u301C${ATLAS_LIMITS.maxSize} px\u306B\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;

// ../3d-forge/voxelforge-studio/src/lib/settings-schema.ts
var MAX_REQUEST_CHARS = ATLAS_LIMITS.maxRequestChars;
var ValidationError = class extends Error {
};

// ../3d-forge/voxelforge-studio/src/lib/texture-finishing.ts
var import_pngjs3 = require("pngjs");
var PATCH = 16;
var mix = (a, b, t) => a + (b - a) * t;
function gradientProgress(cube, bounds, mode) {
  const centre2 = cube.from.map((v, i) => (v + cube.to[i]) / 2);
  const norm = centre2.map(
    (v, i) => (v - bounds.min[i]) / Math.max(0.01, bounds.max[i] - bounds.min[i])
  );
  const value = mode === "vertical" ? norm[1] : mode === "horizontal" ? norm[0] : mode === "diagonal" ? (norm[0] + norm[1]) / 2 : Math.min(1, Math.hypot((norm[0] - 0.5) * 2, (norm[1] - 0.5) * 2));
  return Math.max(0, Math.min(1, value));
}
function finishTexture(model) {
  const gradient = { ...DEFAULT_GRADIENT, ...model.settings.gradient };
  if (!gradient.enabled && !model.cubes.some((c) => c.painted)) return model;
  const source = import_pngjs3.PNG.sync.read(decodeDataUrl(model.texture.source));
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const c of model.cubes)
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], c.from[a]);
      max[a] = Math.max(max[a], c.to[a]);
    }
  const from = toRgb(gradient.from), to = toRgb(gradient.to);
  const patches = /* @__PURE__ */ new Map();
  const keys = model.cubes.map((c) => {
    const t = gradient.enabled ? gradientProgress(c, { min, max }, gradient.mode) : 0;
    const level = Math.round(t * (gradient.steps - 1));
    const key3 = `${c.uv.join(",")}|${c.painted ? c.color : ""}|${level}`;
    if (!patches.has(key3))
      patches.set(key3, {
        uv: c.uv,
        paint: c.painted ? c.color : void 0,
        level,
        index: patches.size
      });
    return key3;
  });
  const columns = 2 ** Math.ceil(Math.log2(Math.max(1, Math.ceil(Math.sqrt(patches.size)))));
  const rows = 2 ** Math.ceil(Math.log2(Math.max(1, Math.ceil(patches.size / columns))));
  const png = new import_pngjs3.PNG({ width: columns * PATCH, height: rows * PATCH });
  const patchColours = /* @__PURE__ */ new Map();
  for (const [key3, p] of patches) {
    const ox = p.index % columns * PATCH, oy = Math.floor(p.index / columns) * PATCH;
    const tint = from.map(
      (v, i) => mix(v, to[i], p.level / Math.max(1, gradient.steps - 1))
    );
    const paint = p.paint ? toRgb(p.paint) : void 0;
    const sum = [0, 0, 0];
    let count = 0;
    for (let y = 0; y < PATCH; y++)
      for (let x = 0; x < PATCH; x++) {
        const sx = Math.max(
          0,
          Math.min(
            source.width - 1,
            Math.floor(p.uv[0] + (p.uv[2] - p.uv[0]) * (x + 0.5) / PATCH)
          )
        );
        const sy = Math.max(
          0,
          Math.min(
            source.height - 1,
            Math.floor(p.uv[1] + (p.uv[3] - p.uv[1]) * (y + 0.5) / PATCH)
          )
        );
        const si = (sy * source.width + sx) * 4, di = ((oy + y) * png.width + ox + x) * 4;
        for (let a = 0; a < 3; a++) {
          const base = paint?.[a] ?? source.data[si + a];
          const target = gradient.blend === "multiply" ? base * tint[a] / 255 : tint[a];
          png.data[di + a] = Math.round(
            gradient.enabled ? mix(base, target, gradient.strength / 100) : base
          );
          sum[a] += png.data[di + a];
        }
        png.data[di + 3] = paint ? 255 : source.data[si + 3];
        count++;
      }
    patchColours.set(key3, toHexColor(sum.map((v) => v / count)));
  }
  return {
    ...model,
    texture: {
      ...model.texture,
      width: png.width,
      height: png.height,
      source: toDataUrl(import_pngjs3.PNG.sync.write(png)),
      name: model.texture.name.replace(/\.png$/i, "_finished.png")
    },
    cubes: model.cubes.map((c, i) => {
      const p = patches.get(keys[i]), x = p.index % columns * PATCH, y = Math.floor(p.index / columns) * PATCH;
      return {
        ...c,
        color: patchColours.get(keys[i]),
        painted: false,
        uv: [x, y, x + PATCH, y + PATCH]
      };
    })
  };
}

// ../3d-forge/voxelforge-studio/src/lib/model-generator.ts
var fallbackCache = /* @__PURE__ */ new Map();
function fallbackTexture(settings, palette) {
  const key3 = palette.join(",");
  let source = fallbackCache.get(key3);
  if (!source) {
    source = createFallbackAtlas(palette);
    if (fallbackCache.size >= 24)
      fallbackCache.delete(fallbackCache.keys().next().value);
    fallbackCache.set(key3, source);
  }
  return {
    source,
    width: FALLBACK_ATLAS_SIZE,
    height: FALLBACK_ATLAS_SIZE,
    name: `${settings.kind === "sword" ? "crystal_sword" : settings.kind}_atlas.png`
  };
}
function generateModel(input) {
  const settings = normalizeSettings(input);
  let palette = settings.paletteOverride ?? paletteForPrompt(settings.prompt, settings.kind), regions;
  if (settings.limitBreak && !settings.atlas) {
    palette = [...palette];
    palette[4] = "#fff3cf";
    palette[6] = "#f3c35a";
  }
  const texture = settings.atlas ?? fallbackTexture(settings, palette);
  if (settings.atlas) {
    const tiles = sampleAtlasTiles(settings.atlas);
    if (!tiles.length)
      throw new ValidationError(
        "\u30A2\u30C8\u30E9\u30B9\u304C\u900F\u660E\u3067\u3059\u3002\u8272\u306E\u3042\u308BPNG\u753B\u50CF\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044\u3002"
      );
    const matches = matchPaletteToTiles(palette, tiles, settings.autoUV);
    regions = matches.map((tile) => tile.uv);
    palette = matches.map((tile) => toHexColor(tile.color));
  }
  const base = [
    ...buildGeometry(settings, palette, regions),
    ...buildAttachments(settings, palette, regions)
  ];
  const custom = (settings.customCubes ?? []).map((c) => ({
    ...c,
    painted: true
  }));
  const cubes = applyCubeEdits(base, settings.edits, custom);
  return finishTexture({ cubes, texture, palette, settings });
}

// ../3d-forge/voxelforge-studio/src/lib/export/blockbench.ts
var import_node_crypto = require("node:crypto");

// ../3d-forge/voxelforge-studio/src/lib/animation/actions.ts
var ZERO = [0, 0, 0];
var UNIT = [1, 1, 1];
var key = (time, rotation = ZERO, position = ZERO, scale = UNIT, glow = 1) => ({ time, rotation, position, scale, glow });
var ACTIONS = {
  slash: {
    label: "\u65AC\u6483",
    length: 1.2,
    keyframes: [
      key(0),
      key(0.25, [0, 0, 35]),
      key(0.5, [0, 0, -95], [2, 0, 0], UNIT, 1.6),
      key(0.8, [0, 0, -95], [2, 0, 0], UNIT, 1.2),
      key(1.2)
    ]
  },
  thrust: {
    label: "\u523A\u7A81",
    length: 1.2,
    keyframes: [
      key(0),
      key(0.3, ZERO, [0, -3, 0]),
      key(0.45, ZERO, [0, 6, 0], UNIT, 1.8),
      key(0.8, ZERO, [0, 6, 0], UNIT, 1.2),
      key(1.2)
    ]
  },
  spin: {
    label: "\u56DE\u8EE2\u65AC\u308A",
    length: 1,
    keyframes: [
      key(0),
      key(0.2, [0, 0, 20]),
      key(0.7, [0, 360, 20], ZERO, UNIT, 1.6),
      key(1, [0, 360, 0])
    ]
  },
  cast: {
    label: "\u8A60\u5531",
    length: 1.6,
    keyframes: [
      key(0),
      key(0.4, [-15, 0, 0], [0, 3, 0], UNIT, 2.2),
      key(1, [-15, 0, 0], [0, 3, 0], UNIT, 2.6),
      key(1.6)
    ]
  },
  charge: {
    label: "\u30C1\u30E3\u30FC\u30B8",
    length: 1.2,
    keyframes: [
      key(0),
      key(0.15, [0, 0, 4], [0, 0.6, 0], UNIT, 1.4),
      key(0.3, [0, 0, -4], [0, 0.8, 0], UNIT, 1.8),
      key(0.45, [0, 0, 4], [0, 1, 0], UNIT, 2.2),
      key(0.6, [0, 0, -4], [0, 1, 0], UNIT, 2.6),
      key(0.9, ZERO, [0, 1, 0], UNIT, 3),
      key(1.2)
    ]
  },
  transform: {
    label: "\u5909\u5F62",
    length: 1.8,
    keyframes: [
      key(0),
      key(0.25, [0, 0, -12], [0, -1.2, 0], [1, 0.5, 1.4], 1.3),
      key(0.55, [0, 180, -26], [0, 2.2, 0], [1.4, 1.2, 1.4], 2.6),
      key(0.85, [0, 360, 0], [0, 4.5, 0], [1, 1.7, 1], 3.2),
      key(1.15, [0, 360, 0], [0, 2, 0], [1, 1.15, 1], 2.4),
      key(1.8)
    ],
    rigs: {
      panel_left: [
        key(0),
        key(0.55, [0, 0, 35], [-1, 0, 0]),
        key(1.15, [0, 0, 35], [-1, 0, 0]),
        key(1.8)
      ],
      panel_right: [
        key(0),
        key(0.55, [0, 0, -35], [1, 0, 0]),
        key(1.15, [0, 0, -35], [1, 0, 0]),
        key(1.8)
      ]
    }
  },
  shoot: {
    label: "\u5C04\u6483",
    length: 0.8,
    keyframes: [
      key(0),
      key(0.08, [0, 0, 6], [-1.4, 0, 0], UNIT, 2.5),
      key(0.2, [0, 0, 2], [-0.4, 0, 0]),
      key(0.8)
    ],
    rigs: {
      mechanism: [key(0), key(0.08, ZERO, [-1.3, 0, 0]), key(0.25), key(0.8)]
    }
  },
  reload: {
    label: "\u30EA\u30ED\u30FC\u30C9",
    length: 2.2,
    keyframes: [key(0), key(0.4, [0, 0, 18]), key(1.5, [0, 0, 18]), key(2.2)],
    rigs: {
      magazine: [
        key(0),
        key(0.5, ZERO, [0, -4, 0]),
        key(1.2, ZERO, [0, -4, 0]),
        key(1.7),
        key(2.2)
      ]
    }
  },
  draw: {
    label: "\u5F13\u5F15\u304D",
    length: 1.8,
    keyframes: [
      key(0),
      key(0.8, [0, 0, -4], ZERO, UNIT, 1.8),
      key(1.2, [0, 0, -4], ZERO, UNIT, 2),
      key(1.4),
      key(1.8)
    ],
    rigs: {
      string: [
        key(0),
        key(0.8, ZERO, [-3, 0, 0]),
        key(1.2, ZERO, [-3, 0, 0]),
        key(1.35),
        key(1.8)
      ]
    }
  },
  summon: {
    label: "\u53EC\u559A",
    length: 2.4,
    keyframes: [
      key(0),
      key(0.6, [0, 15, 0], [0, 2, 0], UNIT, 1.6),
      key(1.2, [0, 30, 0], [0, 3, 0], [1.1, 1.1, 1.1], 3),
      key(1.8, [0, 15, 0], [0, 2, 0], UNIT, 1.8),
      key(2.4)
    ]
  },
  ritual: {
    label: "\u5100\u5F0F",
    length: 3,
    keyframes: [
      key(0),
      key(1, [0, 0, 4], [0, 1.2, 0], UNIT, 2),
      key(2, [0, 0, -4], [0, 1.2, 0], UNIT, 2.5),
      key(3)
    ],
    rigs: {
      page: [
        key(0),
        key(1, [0, 12, 0], [0, 0, 0.25]),
        key(2, [0, -12, 0], [0, 0, 0.25]),
        key(3)
      ]
    }
  },
  slam: {
    label: "\u632F\u308A\u4E0B\u308D\u3057",
    length: 1.5,
    keyframes: [
      key(0),
      key(0.4, [0, 0, 55], [0, 2, 0]),
      key(0.65, [0, 0, -115], [0, -3, 0], UNIT, 2.8),
      key(0.95, [0, 0, -100], [0, -2, 0], UNIT, 1.5),
      key(1.5)
    ]
  },
  rev: {
    label: "\u30C1\u30A7\u30FC\u30F3\u99C6\u52D5",
    length: 0.6,
    keyframes: [
      key(0),
      key(0.15, [0, 0, 1], [0, 0.1, 0], UNIT, 1.6),
      key(0.3, [0, 0, -1], [0, -0.1, 0], UNIT, 1.8),
      key(0.6)
    ],
    rigs: {
      mechanism: [
        key(0),
        key(0.15, ZERO, [0, 0.35, 0]),
        key(0.3, ZERO, [0, -0.35, 0]),
        key(0.6)
      ]
    }
  }
};
function isActiveAction(action) {
  return !!action && action !== "none" && action in ACTIONS;
}
function actionPivotY(height) {
  return -height * 0.3;
}

// ../3d-forge/voxelforge-studio/src/lib/animation/floating.ts
var FLOATING_LENGTH = 3;
var FRAME_CACHE = /* @__PURE__ */ new Map();
function floatingFrames(style) {
  const cached = FRAME_CACHE.get(style);
  if (cached) return cached;
  const frames = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12, angle = t * Math.PI * 2;
    return {
      time: t * FLOATING_LENGTH,
      position: style === "orbit" ? [
        Math.sin(angle) * 1.1,
        Math.sin(angle) * 0.25,
        (Math.cos(angle) - 1) * 1.1
      ] : [0, style === "float" ? Math.sin(angle) * 0.7 : 0, 0],
      rotation: style === "spin" ? [0, t * 360, 0] : style === "sway" ? [Math.sin(angle) * 6, 0, 0] : [0, 0, 0],
      scale: style === "pulse" ? [
        1 + Math.sin(angle) * 0.12,
        1 + Math.sin(angle) * 0.12,
        1 + Math.sin(angle) * 0.12
      ] : [1, 1, 1]
    };
  });
  FRAME_CACHE.set(style, frames);
  return frames;
}

// ../3d-forge/voxelforge-studio/src/lib/export/display.ts
var FACE_DIRECTIONS = [
  "north",
  "east",
  "south",
  "west",
  "up",
  "down"
];
var DISPLAY_TRANSFORMS = {
  thirdperson_righthand: {
    rotation: [0, 90, -35],
    translation: [0, 1, -2],
    scale: [0.65, 0.65, 0.65]
  },
  thirdperson_lefthand: {
    rotation: [0, -90, 35],
    translation: [0, 1, -2],
    scale: [0.65, 0.65, 0.65]
  },
  firstperson_righthand: {
    rotation: [0, -90, 25],
    translation: [1.1, 3.2, 1.1],
    scale: [0.6, 0.6, 0.6]
  },
  firstperson_lefthand: {
    rotation: [0, 90, -25],
    translation: [1.1, 3.2, 1.1],
    scale: [0.6, 0.6, 0.6]
  },
  gui: {
    rotation: [0, 0, -40],
    translation: [0, 0, 0],
    scale: [0.55, 0.55, 0.55]
  },
  ground: {
    rotation: [0, 0, 0],
    translation: [0, 3, 0],
    scale: [0.25, 0.25, 0.25]
  },
  fixed: {
    rotation: [0, 180, 0],
    translation: [0, 0, 0],
    scale: [0.5, 0.5, 0.5]
  }
};
var VANILLA_ITEM_BY_KIND = Object.fromEntries(
  TEMPLATES.map((template) => [template.kind, template.vanillaItem])
);

// ../3d-forge/voxelforge-studio/src/lib/export/blockbench.ts
function element(c) {
  return {
    name: c.label ?? c.name,
    type: "cube",
    uuid: (0, import_node_crypto.randomUUID)(),
    from: c.from.map((n) => n + 8),
    to: c.to.map((n) => n + 8),
    origin: [8, 8, 8],
    rotation: [0, 0, 0],
    color: c.material,
    box_uv: false,
    rescale: false,
    autouv: 0,
    export: !c.hidden,
    visibility: !c.hidden,
    ...c.emissive ? { render_mode: "emissive" } : {},
    faces: Object.fromEntries(
      FACE_DIRECTIONS.map((f) => [f, { uv: c.uv, texture: 0 }])
    )
  };
}
function key2(channel, time, v) {
  return {
    channel,
    time,
    data_points: [
      {
        x: channel === "scale" ? v[0] : -v[0],
        y: channel === "rotation" ? -v[1] : v[1],
        z: v[2]
      }
    ],
    interpolation: "linear"
  };
}
function centre(cubes) {
  const visible = cubes.filter((c) => !c.hidden), reference = visible.length ? visible : cubes;
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const c of reference)
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], c.from[a]);
      max[a] = Math.max(max[a], c.to[a]);
    }
  return min.map((n, a) => (n + max[a]) / 2 + 8);
}
function group(name, origin) {
  return {
    name,
    uuid: (0, import_node_crypto.randomUUID)(),
    origin,
    rotation: [0, 0, 0],
    export: true,
    isOpen: true,
    children: []
  };
}
function clip(name, length, animators) {
  return {
    uuid: (0, import_node_crypto.randomUUID)(),
    name,
    loop: "loop",
    length,
    override: false,
    snapping: 20,
    selected: false,
    blend_weight: "1",
    anim_time_update: "",
    start_delay: "",
    loop_delay: "",
    animators
  };
}
function toBlockbench(model) {
  const { settings } = model, root = group(settings.name, [8, 8 + actionPivotY(settings.height), 8]);
  const groups = /* @__PURE__ */ new Map();
  const grouped = /* @__PURE__ */ new Map();
  for (const c of model.cubes) {
    const name = c.layer === "floater" ? "floaters" : c.rig;
    if (name) grouped.set(name, [...grouped.get(name) ?? [], c]);
  }
  for (const [name, cubes] of grouped) {
    const g = group(name, centre(cubes));
    groups.set(name, g);
    root.children.push(g);
  }
  const elements = model.cubes.map((c) => {
    const e = element(c), name = c.layer === "floater" ? "floaters" : c.rig;
    (name ? groups.get(name) : root).children.push(e.uuid);
    return e;
  });
  const animations = [];
  const floats = groups.get("floaters");
  if (floats && settings.animation !== "none") {
    const style = settings.animation;
    const channel = style === "pulse" ? "scale" : style === "spin" || style === "sway" ? "rotation" : "position";
    const frames = floatingFrames(style).map(
      (f) => key2(
        channel,
        f.time,
        channel === "scale" ? f.scale : channel === "rotation" ? f.rotation : f.position
      )
    );
    animations.push(
      clip(`floaters_${style}`, FLOATING_LENGTH, {
        [floats.uuid]: { name: "floaters", type: "bone", keyframes: frames }
      })
    );
  }
  if (isActiveAction(settings.action)) {
    const action = ACTIONS[settings.action], keys = (frames) => frames.flatMap((f) => [
      key2("rotation", f.time, f.rotation),
      key2("position", f.time, f.position),
      key2("scale", f.time, f.scale)
    ]);
    const animators = {
      [root.uuid]: {
        name: root.name,
        type: "bone",
        keyframes: keys(action.keyframes)
      }
    };
    for (const rig of RIG_IDS) {
      const g = groups.get(rig), frames = action.rigs?.[rig];
      if (g && frames)
        animators[g.uuid] = {
          name: rig,
          type: "bone",
          keyframes: keys(frames)
        };
    }
    animations.push(
      clip(`action_${settings.action}`, action.length, animators)
    );
  }
  return {
    meta: {
      format_version: "4.10",
      model_format: animations.length ? "free" : "java_block",
      box_uv: false
    },
    name: settings.name,
    model_identifier: `voxelforge_${settings.kind}`,
    credit: "Created with VoxelForge Studio",
    resolution: { width: model.texture.width, height: model.texture.height },
    elements,
    outliner: [root],
    textures: [
      {
        uuid: (0, import_node_crypto.randomUUID)(),
        id: "0",
        name: model.texture.name,
        width: model.texture.width,
        height: model.texture.height,
        uv_width: model.texture.width,
        uv_height: model.texture.height,
        source: model.texture.source,
        mode: "bitmap",
        internal: true,
        saved: false,
        visible: true,
        render_mode: "default",
        render_sides: "auto"
      }
    ],
    display: DISPLAY_TRANSFORMS,
    animations
  };
}

// ../3d-forge/voxelforge-studio/src/lib/export/resource-pack.ts
var import_fflate = require("fflate");

// ../3d-forge/voxelforge-studio/src/lib/export/variant-pack.ts
var import_fflate2 = require("fflate");

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

// src/vox.ts
var command = cmd();
if (command === "kinds") {
  for (const t of TEMPLATES) console.log(`${t.kind}	${t.label}`);
} else if (command === "generate") {
  const out = arg("out") ?? fail("usage: vox:generate --kind <kind> [--seed 42] --out model.bbmodel");
  const kind = arg("kind", "sword");
  if (!TEMPLATES.some((t) => t.kind === kind)) fail(`unknown kind: ${kind} (see vox:kinds)`);
  const seed = Number(arg("seed", "42"));
  const model = generateModel({
    ...DEFAULT_SETTINGS,
    kind,
    seed,
    name: `${kind}-${seed}`
  });
  const format = out.endsWith(".bbmodel") ? "bbmodel" : "json";
  const content = format === "bbmodel" ? JSON.stringify(toBlockbench(model), null, 2) : JSON.stringify(model, null, 2);
  (0, import_node_fs.writeFileSync)(out, content);
  console.log(`wrote ${out} (kind=${kind}, cubes=${model.cubes.length})`);
} else {
  console.log(`vox commands: kinds | generate --kind <kind> [--seed 42] --out model.bbmodel`);
}
