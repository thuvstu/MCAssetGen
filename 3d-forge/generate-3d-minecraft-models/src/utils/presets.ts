import type { PresetItem, TextureInput } from "../types/model";

export const PRESET_ITEMS: PresetItem[] = [
  {
    id: "ruby_mushroom",
    name: "ruby_mushroom",
    jaTitle: "紅発光キノコ",
    category: "ブロック・植物",
    description: "発光胞子を持つネザー風キノコ。明度レリーフやドーム立体化に最適。",
    recommendedStyle: "relief",
    recommendedThickness: 5,
    recommendedDisplay: "block",
    emissiveKeys: ["R", "Y"],
    pixels: [
      "......rrrr......",
      "....rrrrrrrr....",
      "..rrrrRRrrrrrr..",
      ".rrrrrYYrrrrrrr.",
      "rrrrrrrrrrRRrrrr",
      "rrrRRrrrrrYYrrrr",
      "rrrYYroorrrrrrrr",
      "rrrrrooooorrrrrr",
      "rrrrrrrrrrrrrrrr",
      "...oooooooooo...",
      "......wwww......",
      "......WWWW......",
      ".....WWWWWW.....",
      ".....WWwWWW.....",
      "......WWWW......",
      "......WWww......",
    ],
    palette: {
      r: "#b53638",
      R: "#ff8c6b",
      Y: "#ffe478",
      o: "#6e232e",
      W: "#e7e9d8",
      w: "#a9b39b",
    },
  },
  {
    id: "ender_blade",
    name: "ender_blade",
    jaTitle: "エンダーブレード",
    category: "武器・剣",
    description: "中心軸ブレード造形と手持武器ディスプレイ設定に適した魔剣テクスチャ。",
    recommendedStyle: "blade",
    recommendedThickness: 4,
    recommendedDisplay: "tool",
    emissiveKeys: ["E", "C"],
    pixels: [
      ".............ddD",
      "............dCCD",
      "...........dCEED",
      "..........dCCEEd",
      ".........dCCEEdd",
      "........dCCEEdd.",
      ".......dCCEEdd..",
      "..gg..dCCEEdd...",
      "..gGgdCCEEdd....",
      "...gGEECCdd.....",
      "...gGEEEdd......",
      "..sSgGgdd.......",
      ".sSSsgGg........",
      "pPs..gg.........",
      "PPp.............",
      ".p..............",
    ],
    palette: {
      d: "#183038",
      D: "#2b525c",
      C: "#56f2d6",
      E: "#a3fff0",
      g: "#3c2a4d",
      G: "#7b52ab",
      s: "#574329",
      S: "#8a6b3f",
      p: "#9353ff",
      P: "#d2b3ff",
    },
  },
  {
    id: "emerald_amulet",
    name: "emerald_amulet",
    jaTitle: "エメラルドの護符",
    category: "装飾品・宝石",
    description: "黄金フレームと中央の宝石が立体的に浮かび上がるドームレリーフ向きアセット。",
    recommendedStyle: "dome",
    recommendedThickness: 6,
    recommendedDisplay: "item",
    emissiveKeys: ["L", "E"],
    pixels: [
      ".....gggggg.....",
      "....gG....Gg....",
      "...gG......Gg...",
      "...g..yyyy..g...",
      ".....yYYYYy.....",
      "....yYYeeYYy....",
      "...yYYeELeYYy...",
      "...yYeELLLeYy...",
      "...yYeELLLeYy...",
      "...yYYeELeYYy...",
      "....yYYeeYYy....",
      ".....yYYYYy.....",
      "......yyyy......",
      ".......yy.......",
      ".......EE.......",
      ".......e........",
    ],
    palette: {
      g: "#59606b",
      G: "#8c96a6",
      y: "#9e6b1b",
      Y: "#f5c542",
      e: "#137547",
      E: "#2be384",
      L: "#a8ffcf",
    },
  },
  {
    id: "golden_pickaxe",
    name: "golden_pickaxe",
    jaTitle: "ルーンの黄金ツルハシ",
    category: "ツール・採掘",
    description: "マイクラ定番のツルハシ形状。グリーディ統合で少ないキューブ数に最適化可能。",
    recommendedStyle: "blade",
    recommendedThickness: 3,
    recommendedDisplay: "tool",
    emissiveKeys: ["B"],
    pixels: [
      "........yyyyyy..",
      ".......yYYYYYYy.",
      "......yYYBBYYYYy",
      "......yYYYYyYYYy",
      ".......yy..sYYYy",
      "..........sSsyYy",
      ".........sSs.yYy",
      "........sSs..yYy",
      ".......sSs....yy",
      "......sSs.......",
      ".....sSs........",
      "....sSs.........",
      "...sSs..........",
      "..sSs...........",
      ".sB.............",
      "sS..............",
    ],
    palette: {
      y: "#9c6316",
      Y: "#ffd34d",
      B: "#73f7ff",
      s: "#5c3c1e",
      S: "#8f6133",
    },
  },
  {
    id: "soul_lantern",
    name: "soul_lantern",
    jaTitle: "蒼魂のランタン",
    category: "照明・ブロック",
    description: "金属フレームの奥で蒼い魂が輝くランタン。色相レイヤー段差や明度レリーフに最適。",
    recommendedStyle: "terraced",
    recommendedThickness: 6,
    recommendedDisplay: "block",
    emissiveKeys: ["C", "W"],
    pixels: [
      "......iiii......",
      ".....iI..Ii.....",
      "......iiii......",
      "....iiiiiiii....",
      "...iIIIIIIIIi...",
      "...iIbbccbbIi...",
      "...iIbCCCCbIi...",
      "...iIcCWWCcIi...",
      "...iIcCWWCcIi...",
      "...iIbCCCCbIi...",
      "...iIbbccbbIi...",
      "...iIIIIIIIIi...",
      "..iiiiiiiiiiii..",
      "..iIIIIIIIIIIi..",
      "...iiiiiiiiii...",
      "................",
    ],
    palette: {
      i: "#2a3038",
      I: "#546070",
      b: "#195c78",
      c: "#28a9c7",
      C: "#63f2ff",
      W: "#e0ffff",
    },
  },
  {
    id: "ancient_shield",
    name: "ancient_shield",
    jaTitle: "古代樹の紋章盾",
    category: "防具・盾",
    description: "前面レリーフと相性抜群の重厚な紋章シールド。階層別のボーン出力にも対応。",
    recommendedStyle: "relief",
    recommendedThickness: 5,
    recommendedDisplay: "shield",
    emissiveKeys: ["G"],
    pixels: [
      "..mmmmmmmmmmmm..",
      ".mMMMMMMMMMMMMm.",
      ".mMwwwwwwwwwwMm.",
      ".mMwWWWWWWWWwMm.",
      ".mMwWmmGGmmWwMm.",
      ".mMwWmGGGGmWwMm.",
      ".mMwWWmGGmWWwMm.",
      ".mMwWWWGGWWWwMm.",
      "..mMwWWGGWWwMm..",
      "..mMwWWGGWWwMm..",
      "...mMwWGGWwMm...",
      "...mMwwGGwwMm...",
      "....mMwGGwMm....",
      ".....mMMMMm.....",
      "......mmmm......",
      "................",
    ],
    palette: {
      m: "#47525e",
      M: "#8f9eab",
      w: "#54371d",
      W: "#825730",
      G: "#b9f257",
    },
  },
];

export function createTextureFromPreset(preset: PresetItem): {
  texture: TextureInput;
  emissiveSet: Set<string>;
} {
  const height = preset.pixels.length;
  const width = preset.pixels[0]?.length ?? 16;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is not available.");
  }

  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = false;

  const emissiveSet = new Set<string>();
  const emissiveKeys = new Set(preset.emissiveKeys ?? []);

  preset.pixels.forEach((line, row) => {
    [...line].forEach((char, col) => {
      if (char === "." || !preset.palette[char]) return;
      context.fillStyle = preset.palette[char];
      context.fillRect(col, row, 1, 1);
      if (emissiveKeys.has(char)) {
        emissiveSet.add(`${col}:${row}`);
      }
    });
  });

  return {
    texture: {
      source: canvas,
      width,
      height,
      name: `${preset.name}.png`,
    },
    emissiveSet,
  };
}
