import { chain, gear, maker, ringOf } from "@/lib/generators/kit";
import { ColorPalette, ModelElement, TextureResolution, Vector3 } from "@/types/model";

interface PartContext {
  anchor: Vector3;
  palette: ColorPalette;
  res: TextureResolution;
  uid: string;
}

export interface PartDefinition {
  id: string;
  labelJa: string;
  category: "装飾" | "刃" | "機械" | "魔法" | "邪悪" | "銃器";
  build: (ctx: PartContext) => ModelElement[];
}

const G = "parts";

export const PART_LIBRARY: PartDefinition[] = [
  { id: "gem", labelJa: "宝石", category: "装飾", build: ({ anchor, palette, res, uid }) => [maker(res)(`${uid}_gem`, "Gem", anchor, [1.6, 1.6, 1.6], "gem", palette.glow, G, { emissive: true, rotation: [45, 45, 0] })] },
  {
    id: "gem_socket",
    labelJa: "宝石台座",
    category: "装飾",
    build: ({ anchor, palette, res, uid }) => {
      const P = maker(res);
      return [
        P(`${uid}_mount`, "Gem Mount", anchor, [2.4, 2.4, 0.8], "guard", palette.accent, G, { rotation: [0, 0, 45] }),
        P(`${uid}_gem`, "Socket Gem", [anchor[0], anchor[1], anchor[2] + 0.5], [1.4, 1.4, 0.8], "gem", palette.glow, G, { rotation: [0, 0, 45], emissive: true }),
      ];
    },
  },
  {
    id: "spike",
    labelJa: "棘",
    category: "邪悪",
    build: ({ anchor, palette, res, uid }) => [maker(res)(`${uid}_spike`, "Spike", [anchor[0], anchor[1] + 1.5, anchor[2]], [0.9, 3, 0.9], "blade", palette.dark, G, { origin: anchor })],
  },
  {
    id: "spike_pair",
    labelJa: "棘ペア",
    category: "邪悪",
    build: ({ anchor, palette, res, uid }) =>
      [-1, 1].map((side) => maker(res)(`${uid}_spike${side}`, `Spike ${side > 0 ? "R" : "L"}`, [anchor[0] + side * 1.6, anchor[1] + 1, anchor[2]], [0.8, 2.8, 0.8], "blade", palette.dark, G, { rotation: [0, 0, side * -35], origin: [anchor[0] + side * 0.6, anchor[1], anchor[2]] })),
  },
  { id: "ring", labelJa: "装飾リング", category: "装飾", build: ({ anchor, palette, res, uid }) => ringOf(`${uid}_ring`, "Ring Segment", anchor, 2.4, 10, [1.6, 0.5, 0.5], "xz", { region: "rune", color: palette.accent, group: G, resolution: res }) },
  { id: "gear", labelJa: "歯車", category: "機械", build: ({ anchor, palette, res, uid }) => gear(`${uid}_gear`, "Gear", anchor, 2, 0.8, palette.accent, res, G, 8) },
  { id: "chain", labelJa: "鎖", category: "邪悪", build: ({ anchor, palette, res, uid }) => chain(`${uid}_chain`, "Chain", anchor, [anchor[0], anchor[1] - 6, anchor[2]], 6, palette.dark, res, G) },
  {
    id: "blade_segment",
    labelJa: "刃セグメント",
    category: "刃",
    build: ({ anchor, palette, res, uid }) => {
      const P = maker(res);
      return [
        P(`${uid}_blade`, "Blade Segment", [anchor[0], anchor[1] + 3, anchor[2]], [2.2, 6, 0.6], "blade", palette.primary, G),
        P(`${uid}_edge`, "Blade Edge Glow", [anchor[0], anchor[1] + 3, anchor[2] + 0.35], [0.5, 5.6, 0.2], "rune", palette.glow, G, { emissive: true }),
      ];
    },
  },
  {
    id: "guard_bar",
    labelJa: "鍔",
    category: "刃",
    build: ({ anchor, palette, res, uid }) => {
      const P = maker(res);
      return [
        P(`${uid}_bar`, "Guard Bar", anchor, [7, 1, 1.6], "guard", palette.accent, G),
        ...[-1, 1].map((side) => P(`${uid}_cap${side}`, `Guard Cap ${side > 0 ? "R" : "L"}`, [anchor[0] + side * 3.8, anchor[1], anchor[2]], [1.2, 1.6, 1.8], "gem", palette.glow, G, { emissive: true, rotation: [0, 0, 45] })),
      ];
    },
  },
  {
    id: "orb",
    labelJa: "魔力球",
    category: "魔法",
    build: ({ anchor, palette, res, uid }) => {
      const P = maker(res);
      return [
        P(`${uid}_orb`, "Mana Orb", anchor, [2.6, 2.6, 2.6], "gem", palette.glow, G, { emissive: true, rotation: [45, 45, 0] }),
        P(`${uid}_shell`, "Orb Shell", anchor, [3.2, 3.2, 3.2], "rune", palette.glow, G, { emissive: true, rotation: [45, 45, 0], opacity: 0.35 }),
      ];
    },
  },
  {
    id: "tassel",
    labelJa: "房飾り",
    category: "装飾",
    build: ({ anchor, palette, res, uid }) => {
      const P = maker(res);
      return [
        P(`${uid}_cord`, "Tassel Cord", [anchor[0], anchor[1] - 0.6, anchor[2]], [0.3, 1.2, 0.3], "guard", palette.accent, G),
        P(`${uid}_plume`, "Tassel Plume", [anchor[0], anchor[1] - 3.2, anchor[2]], [1, 4, 0.4], "rune", palette.primary, G),
      ];
    },
  },
  {
    id: "horn",
    labelJa: "角",
    category: "邪悪",
    build: ({ anchor, palette, res, uid }) => {
      const P = maker(res);
      return [0, 1, 2].map((index) =>
        P(`${uid}_horn${index}`, `Horn Segment ${index + 1}`, [anchor[0] + index * 0.9, anchor[1] + 1.2 + index * 1.7, anchor[2]], [1.2 - index * 0.3, 2.2, 1.2 - index * 0.3], "guard", palette.dark, G, { rotation: [0, 0, -20 - index * 18] }),
      );
    },
  },
  {
    id: "eye",
    labelJa: "魔眼",
    category: "邪悪",
    build: ({ anchor, palette, res, uid }) => {
      const P = maker(res);
      return [
        P(`${uid}_eye`, "Eye", anchor, [2, 1.2, 0.5], "gem", palette.dark, G),
        P(`${uid}_pupil`, "Pupil", [anchor[0], anchor[1], anchor[2] + 0.3], [0.6, 1.1, 0.3], "gem", palette.glow, G, { emissive: true }),
      ];
    },
  },
  {
    id: "scope",
    labelJa: "スコープ",
    category: "銃器",
    build: ({ anchor, palette, res, uid }) => {
      const P = maker(res);
      return [
        P(`${uid}_body`, "Scope Body", anchor, [1.6, 1.6, 7], "guard", palette.dark, G),
        ...[-1, 1].map((side) => P(`${uid}_lens${side}`, `Scope Lens ${side > 0 ? "Front" : "Rear"}`, [anchor[0], anchor[1], anchor[2] + side * 3.6], [1.2, 1.2, 0.3], "gem", palette.glow, G, { emissive: true })),
        P(`${uid}_mount`, "Scope Mount", [anchor[0], anchor[1] - 1.1, anchor[2]], [1, 0.8, 3], "guard", palette.secondary, G),
      ];
    },
  },
  {
    id: "barrel",
    labelJa: "銃身",
    category: "銃器",
    build: ({ anchor, palette, res, uid }) => {
      const P = maker(res);
      return [
        P(`${uid}_barrel`, "Barrel", [anchor[0], anchor[1], anchor[2] + 4], [1.2, 1.2, 8], "blade", palette.secondary, G),
        P(`${uid}_muzzle`, "Muzzle", [anchor[0], anchor[1], anchor[2] + 8.4], [1.8, 1.8, 1.2], "guard", palette.dark, G),
      ];
    },
  },
  { id: "rune_plate", labelJa: "ルーン板", category: "魔法", build: ({ anchor, palette, res, uid }) => [maker(res)(`${uid}_plate`, "Rune Plate", anchor, [3, 3, 0.2], "rune", palette.glow, G, { emissive: true, rotation: [0, 0, 45] })] },
  {
    id: "feather_fan",
    labelJa: "羽根扇",
    category: "装飾",
    build: ({ anchor, palette, res, uid }) =>
      [-30, 0, 30].map((angle, index) => maker(res)(`${uid}_feather${index}`, `Feather ${index + 1}`, [anchor[0], anchor[1] + 2, anchor[2]], [0.9, 4, 0.2], "blade", palette.highlight, G, { rotation: [0, 0, angle], origin: anchor })),
  },
  {
    id: "skull",
    labelJa: "髑髏",
    category: "邪悪",
    build: ({ anchor, palette, res, uid }) => {
      const P = maker(res);
      return [
        P(`${uid}_cranium`, "Skull", anchor, [2.6, 2.4, 2.4], "guard", "#e8e0cc", G),
        P(`${uid}_jaw`, "Skull Jaw", [anchor[0], anchor[1] - 1.6, anchor[2] + 0.3], [1.8, 1, 1.8], "guard", "#d8cfb8", G),
        ...[-1, 1].map((side) => P(`${uid}_eye${side}`, `Skull Eye ${side > 0 ? "R" : "L"}`, [anchor[0] + side * 0.6, anchor[1], anchor[2] + 1.25], [0.6, 0.6, 0.2], "gem", palette.glow, G, { emissive: true })),
      ];
    },
  },
  {
    id: "pipe",
    labelJa: "L字配管",
    category: "機械",
    build: ({ anchor, palette, res, uid }) => {
      const P = maker(res);
      return [
        P(`${uid}_v`, "Pipe Vertical", [anchor[0], anchor[1] - 2, anchor[2]], [0.9, 4, 0.9], "guard", palette.secondary, G),
        P(`${uid}_h`, "Pipe Horizontal", [anchor[0] + 1.6, anchor[1] - 4, anchor[2]], [3.2, 0.9, 0.9], "guard", palette.secondary, G),
        P(`${uid}_j`, "Pipe Joint", [anchor[0], anchor[1] - 4, anchor[2]], [1.3, 1.3, 1.3], "rune", palette.accent, G),
      ];
    },
  },
  {
    id: "crystal",
    labelJa: "結晶",
    category: "魔法",
    build: ({ anchor, palette, res, uid }) => {
      const P = maker(res);
      return [
        P(`${uid}_c1`, "Crystal Main", [anchor[0], anchor[1] + 1.8, anchor[2]], [1.4, 3.6, 1.4], "gem", palette.glow, G, { emissive: true, rotation: [0, 45, 8], opacity: 0.9 }),
        P(`${uid}_c2`, "Crystal Side", [anchor[0] + 1, anchor[1] + 1, anchor[2]], [0.9, 2.2, 0.9], "gem", palette.highlight, G, { emissive: true, rotation: [0, 45, -25], opacity: 0.9 }),
      ];
    },
  },
  {
    id: "thruster",
    labelJa: "スラスター",
    category: "機械",
    build: ({ anchor, palette, res, uid }) => {
      const P = maker(res);
      return [
        P(`${uid}_nozzle`, "Nozzle", anchor, [1.8, 1.8, 2.2], "guard", palette.dark, G),
        P(`${uid}_flame`, "Thrust Flame", [anchor[0], anchor[1], anchor[2] - 2], [1.2, 1.2, 2.6], "gem", palette.glow, G, { emissive: true, opacity: 0.8 }),
      ];
    },
  },
];

let partCounter = 0;

export function buildPart(id: string, anchor: Vector3, palette: ColorPalette, res: TextureResolution): ModelElement[] {
  const definition = PART_LIBRARY.find((entry) => entry.id === id);
  if (!definition) return [];
  partCounter += 1;
  const uid = `p${Date.now().toString(36)}${partCounter.toString(36)}`;
  return definition.build({ anchor, palette, res, uid });
}
