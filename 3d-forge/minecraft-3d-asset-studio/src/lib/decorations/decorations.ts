import { deg, gear, group, maker, outward, PartMaker, ringOf } from "@/lib/generators/kit";
import { analyzeModel, ModelAnatomy } from "@/lib/model/anatomy";
import {
  ColorPalette,
  DECORATION_COLOR_SOURCES,
  DECORATION_TYPES,
  DecorationColorSource,
  DecorationInstance,
  DecorationType,
  ModelData,
  ModelElement,
  TextureResolution,
  Vector3,
} from "@/types/model";

export interface DecorationDefinition {
  type: DecorationType;
  labelJa: string;
  group: "装甲" | "魔法" | "機械" | "邪悪" | "有機" | "装身";
  description: string;
  defaults: Partial<DecorationInstance>;
}

export const DECORATION_DEFS: Record<DecorationType, DecorationDefinition> = {
  halo_ring: { type: "halo_ring", labelJa: "光輪", group: "魔法", description: "頭上に浮かぶ水平リング", defaults: { count: 16, radius: 4, height: 1.08, size: 1 } },
  sun_disk: { type: "sun_disk", labelJa: "日輪円盤", group: "魔法", description: "背面の放射状ディスク", defaults: { count: 20, radius: 7, height: 0.7, offsetZ: -2.5, opacity: 0.8 } },
  spike_row: { type: "spike_row", labelJa: "棘列", group: "邪悪", description: "両側面に並ぶ棘", defaults: { count: 6, size: 1, height: 0.8, radius: 10, emissive: false, colorSource: "dark", tilt: 38 } },
  spike_crown: { type: "spike_crown", labelJa: "棘の冠", group: "邪悪", description: "放射状に開く棘冠", defaults: { count: 8, radius: 2.5, height: 1, tilt: 30, emissive: false, colorSource: "accent" } },
  gem_studs: { type: "gem_studs", labelJa: "宝石鋲", group: "装身", description: "中心線に並ぶ宝石", defaults: { count: 5, size: 0.9, height: 0.85 } },
  gem_cluster: { type: "gem_cluster", labelJa: "宝石群", group: "装身", description: "鍔元の宝石クラスタ", defaults: { count: 7, size: 1, height: 0.45, radius: 2 } },
  chain_wrap: { type: "chain_wrap", labelJa: "巻き鎖", group: "邪悪", description: "螺旋状に巻き付く鎖", defaults: { count: 14, size: 1, height: 0.9, twist: 540, colorSource: "dark", emissive: false } },
  rune_bands: { type: "rune_bands", labelJa: "ルーン帯", group: "魔法", description: "等間隔の発光帯", defaults: { count: 3, size: 1, height: 0.9, radius: 3 } },
  wing_pair: { type: "wing_pair", labelJa: "翼", group: "装身", description: "扇状に開く左右の翼", defaults: { count: 5, radius: 7, height: 0.45, tilt: 15, colorSource: "highlight", opacity: 0.9 } },
  horn_pair: { type: "horn_pair", labelJa: "角", group: "邪悪", description: "湾曲する一対の角", defaults: { count: 4, size: 1, height: 0.45, tilt: 20, colorSource: "dark", emissive: false } },
  tassels: { type: "tassels", labelJa: "房飾り", group: "装身", description: "垂れ下がる房", defaults: { count: 3, size: 1, radius: 4, height: 0.42, colorSource: "accent", emissive: false } },
  ribbon_spiral: { type: "ribbon_spiral", labelJa: "螺旋リボン", group: "魔法", description: "周囲を巻く光の帯", defaults: { count: 18, radius: 3.4, height: 0.95, twist: 720, opacity: 0.75 } },
  shard_ring: { type: "shard_ring", labelJa: "結晶片の輪", group: "魔法", description: "浮遊する結晶片の環", defaults: { count: 8, radius: 6, height: 0.75, tilt: 25 } },
  gear_cluster: { type: "gear_cluster", labelJa: "歯車群", group: "機械", description: "側面の駆動歯車", defaults: { count: 2, size: 1.4, height: 0.5, colorSource: "accent", emissive: false, mirror: true } },
  pipes: { type: "pipes", labelJa: "配管", group: "機械", description: "背面を走るパイプ", defaults: { count: 2, size: 0.8, radius: 6, height: 0.6, colorSource: "secondary", emissive: false } },
  cooling_fins: { type: "cooling_fins", labelJa: "冷却フィン", group: "機械", description: "積層された放熱板", defaults: { count: 6, size: 1, height: 0.5, colorSource: "dark", emissive: false } },
  thrusters: { type: "thrusters", labelJa: "スラスター", group: "機械", description: "背面の推進噴射口", defaults: { count: 2, size: 1.2, height: 0.5, offsetZ: 0, mirror: true } },
  eye_cluster: { type: "eye_cluster", labelJa: "魔眼群", group: "邪悪", description: "表面に開く複数の眼", defaults: { count: 5, size: 1, radius: 2.5, height: 0.75 } },
  blood_drips: { type: "blood_drips", labelJa: "血の滴", group: "有機", description: "滴り落ちる血", defaults: { count: 7, size: 1, height: 0.95, radius: 10, colorSource: "custom", customColor: "#8b0000" } },
  crystal_growth: { type: "crystal_growth", labelJa: "結晶の侵食", group: "魔法", description: "表面から生える結晶", defaults: { count: 9, size: 1, radius: 2.5, height: 0.8, opacity: 0.85 } },
  energy_edge: { type: "energy_edge", labelJa: "エネルギー刃縁", group: "魔法", description: "両縁を走る光刃", defaults: { size: 1, radius: 8, height: 0.95, opacity: 0.7 } },
  rune_plates: { type: "rune_plates", labelJa: "周回ルーン板", group: "魔法", description: "外向きのルーン板の環", defaults: { count: 6, radius: 5, height: 0.8, size: 1.2 } },
  bone_ribs: { type: "bone_ribs", labelJa: "肋骨", group: "邪悪", description: "湾曲する骨の肋", defaults: { count: 4, size: 1, height: 0.8, colorSource: "custom", customColor: "#e8e0cc", emissive: false } },
  feather_tuft: { type: "feather_tuft", labelJa: "羽根飾り", group: "有機", description: "頂部の放射状の羽根", defaults: { count: 7, radius: 1.2, height: 1, tilt: 35, colorSource: "highlight", emissive: false } },
  banner: { type: "banner", labelJa: "軍旗", group: "装身", description: "横棒から垂れる旗", defaults: { size: 1, radius: 6, height: 0.8, colorSource: "primary", emissive: false } },
  skull: { type: "skull", labelJa: "髑髏飾り", group: "邪悪", description: "眼が光る髑髏", defaults: { size: 1, height: 0.45, offsetZ: 1, colorSource: "custom", customColor: "#e8e0cc", emissive: false } },
};

export const DECORATION_LIST = DECORATION_TYPES.map((type) => DECORATION_DEFS[type]);

const BASE_DEFAULTS: Omit<DecorationInstance, "id" | "type"> = {
  enabled: true,
  count: 6,
  size: 1,
  radius: 6,
  height: 0.85,
  tilt: 0,
  twist: 0,
  offsetZ: 0,
  colorSource: "glow",
  customColor: "#ffffff",
  emissive: true,
  opacity: 1,
  mirror: false,
};

export const DECORATION_RANGES = {
  count: { min: 1, max: 32, step: 1, label: "数" },
  size: { min: 0.2, max: 4, step: 0.1, label: "サイズ" },
  radius: { min: 0.5, max: 18, step: 0.25, label: "半径/長さ" },
  height: { min: -0.1, max: 1.3, step: 0.01, label: "高さ位置" },
  tilt: { min: -90, max: 90, step: 1, label: "傾き" },
  twist: { min: -1080, max: 1080, step: 5, label: "ねじれ" },
  offsetZ: { min: -8, max: 8, step: 0.25, label: "前後オフセット" },
  opacity: { min: 0.1, max: 1, step: 0.05, label: "不透明度" },
} as const;

let decorationCounter = 0;
export function newDecorationId(): string {
  decorationCounter += 1;
  return `d${Date.now().toString(36)}${decorationCounter.toString(36)}`;
}

export function createDecoration(type: DecorationType): DecorationInstance {
  return { ...BASE_DEFAULTS, ...DECORATION_DEFS[type].defaults, id: newDecorationId(), type };
}

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function hashId(id: string): number {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) hash = Math.imul(hash ^ id.charCodeAt(index), 16777619);
  return hash >>> 0;
}

export function randomDecorations(count = 3): DecorationInstance[] {
  const random = seeded(Date.now());
  return Array.from({ length: count }, () => {
    const type = DECORATION_TYPES[Math.floor(random() * DECORATION_TYPES.length)];
    const base = createDecoration(type);
    return {
      ...base,
      count: Math.max(1, Math.round(base.count * (0.6 + random() * 0.9))),
      size: Math.round(base.size * (0.7 + random() * 0.8) * 10) / 10,
      height: Math.round((0.35 + random() * 0.7) * 100) / 100,
      colorSource: DECORATION_COLOR_SOURCES[Math.floor(random() * 5)],
    };
  });
}

function resolveColor(source: DecorationColorSource, custom: string, palette: ColorPalette): string {
  return source === "custom" ? custom : palette[source];
}

interface Ctx {
  inst: DecorationInstance;
  a: ModelAnatomy;
  P: PartMaker;
  color: string;
  palette: ColorPalette;
  res: TextureResolution;
  id: (suffix: string | number) => string;
  y: number;
  w: number;
  d: number;
  n: number;
  s: number;
  random: () => number;
}

type Generator = (ctx: Ctx) => ModelElement[];

const G = "decor";

const GENERATORS: Record<DecorationType, Generator> = {
  halo_ring: ({ inst, color, res, id, y, n, s }) =>
    ringOf(id("h"), "Halo", [0, y + 2, inst.offsetZ], inst.radius, n, [s * 1.4, s * 0.4, s * 0.5], "xz", { region: "rune", color, group: G, resolution: res, emissive: inst.emissive, opacity: inst.opacity, generated: true }),
  sun_disk: ({ inst, color, palette, res, id, y, n, s }) =>
    ringOf(id("sd"), "Sun Ray", [0, y, inst.offsetZ], inst.radius, n, [s * 2.2, s * 0.5, 0.2], "xy", { region: "rune", color, group: G, resolution: res, emissive: inst.emissive, opacity: inst.opacity, generated: true }, 0, (index) =>
      index % 2 === 0 ? [s * 2.4, s * 0.5, 0.2] : [s * 1.2, s * 0.4, 0.2],
    ).map((element, index) => (index % 2 === 1 ? { ...element, color: palette.accent } : element)),
  spike_row: ({ inst, P, color, id, y, w, n, s }) => {
    const span = Math.max(2, inst.radius);
    return Array.from({ length: n }, (_, index) => {
      const side = index % 2 === 0 ? 1 : -1;
      const py = y - (index / Math.max(1, n - 1)) * span;
      const x = side * (w + 0.6 * s);
      return P(id(index), `Spike ${index + 1}`, [x, py, inst.offsetZ], [0.8 * s, 2.4 * s, 0.6 * s], "blade", color, G, {
        rotation: [0, 0, side * -inst.tilt],
        origin: [x - side * 0.4 * s, py - s, inst.offsetZ],
        emissive: inst.emissive,
        opacity: inst.opacity,
      });
    });
  },
  spike_crown: ({ inst, P, color, id, y, n, s }) =>
    Array.from({ length: n }, (_, index) => {
      const angle = (index / n) * Math.PI * 2;
      const center: Vector3 = [Math.cos(angle) * inst.radius, y + 1.2 * s, Math.sin(angle) * inst.radius + inst.offsetZ];
      return P(id(index), `Crown Spike ${index + 1}`, center, [0.7 * s, 2.6 * s * (index % 2 === 0 ? 1 : 0.7), 0.7 * s], "blade", color, G, {
        rotation: outward(angle, inst.tilt),
        origin: [center[0], y, center[2]],
        emissive: inst.emissive,
        opacity: inst.opacity,
      });
    }),
  gem_studs: ({ inst, P, color, id, y, d, n, s }) =>
    Array.from({ length: n }, (_, index) =>
      P(id(index), `Gem Stud ${index + 1}`, [0, y - index * 1.7 * s, d + 0.35 + inst.offsetZ], [s, s, 0.5 * s], "gem", color, G, {
        rotation: [0, 0, 45 + inst.tilt],
        emissive: inst.emissive,
        opacity: inst.opacity,
      }),
    ),
  gem_cluster: ({ inst, P, color, palette, id, y, d, n, s, random }) =>
    Array.from({ length: n }, (_, index) => {
      const angle = random() * Math.PI * 2;
      const r = random() * inst.radius;
      return P(id(index), `Cluster Gem ${index + 1}`, [Math.cos(angle) * r, y + Math.sin(angle) * r, d + 0.4 + inst.offsetZ], [s * (0.6 + random() * 0.7), s * (0.6 + random() * 0.9), s * 0.6], "gem", index % 3 === 0 ? palette.highlight : color, G, {
        rotation: [random() * 40, random() * 40, 45 + random() * 30],
        emissive: inst.emissive,
        opacity: inst.opacity,
      });
    }),
  chain_wrap: ({ inst, P, color, id, y, w, n, s }) => {
    const turns = (Math.PI * 2 * inst.twist) / 360;
    return Array.from({ length: n }, (_, index) => {
      const t = index / Math.max(1, n - 1);
      const angle = t * turns;
      const radius = w + 0.6 * s;
      return P(id(index), `Wrap Link ${index + 1}`, [Math.cos(angle) * radius, y - index * 1.05 * s, Math.sin(angle) * radius + inst.offsetZ], [0.7 * s, 1.1 * s, 0.7 * s], "guard", color, G, {
        rotation: [inst.tilt, -deg(angle) + (index % 2) * 90, 0],
        emissive: inst.emissive,
        opacity: inst.opacity,
      });
    });
  },
  rune_bands: ({ inst, P, color, id, y, w, d, n, s }) =>
    Array.from({ length: n }, (_, index) =>
      P(id(index), `Rune Band ${index + 1}`, [0, y - index * Math.max(1.2, inst.radius), inst.offsetZ], [w * 2 + 0.6 * s, 0.5 * s, d * 2 + 0.6 * s], "rune", color, G, {
        rotation: [0, inst.twist * (index / Math.max(1, n)), inst.tilt],
        emissive: inst.emissive,
        opacity: inst.opacity,
      }),
    ),
  wing_pair: ({ inst, P, color, palette, id, y, a, n, s }) =>
    [-1, 1].flatMap((side) =>
      Array.from({ length: n }, (_, index) => {
        const length = inst.radius * (0.55 + (index / Math.max(1, n)) * 0.6);
        const baseX = side * (a.guardHalfWidth + 0.5);
        return P(id(`${side}_${index}`), `Wing ${side > 0 ? "R" : "L"}${index + 1}`, [baseX + side * (length / 2), y + 0.5, inst.offsetZ - 0.8 - index * 0.15], [length, 1.1 * s, 0.3 * s], index % 2 === 0 ? "rune" : "blade", index % 2 === 0 ? color : palette.glow, G, {
          rotation: [0, 0, side * (inst.tilt + index * (70 / Math.max(1, n)))],
          origin: [baseX, y, inst.offsetZ - 0.8],
          emissive: inst.emissive && index % 2 === 0,
          opacity: inst.opacity,
        });
      }),
    ),
  horn_pair: ({ inst, P, color, id, y, a, n, s }) =>
    [-1, 1].flatMap((side) => {
      let x = side * (a.guardHalfWidth + 0.6);
      let py = y + 0.6;
      return Array.from({ length: n }, (_, index) => {
        const angle = inst.tilt + index * 22;
        const length = 2.4 * s * (1 - index * 0.12);
        const center: Vector3 = [x + side * Math.sin((angle * Math.PI) / 180) * length * 0.5, py + Math.cos((angle * Math.PI) / 180) * length * 0.5, inst.offsetZ];
        x += side * Math.sin((angle * Math.PI) / 180) * length * 0.9;
        py += Math.cos((angle * Math.PI) / 180) * length * 0.9;
        const thickness = Math.max(0.3, 1.1 * s * (1 - index * 0.18));
        return P(id(`${side}_${index}`), `Horn ${side > 0 ? "R" : "L"}${index + 1}`, center, [thickness, length, thickness], "guard", color, G, {
          rotation: [0, 0, side * -angle],
          emissive: inst.emissive,
          opacity: inst.opacity,
        });
      });
    }),
  tassels: ({ inst, P, color, palette, id, y, n, s }) =>
    Array.from({ length: n }, (_, index) => {
      const x = (index - (n - 1) / 2) * 1.6 * s;
      const length = inst.radius * 0.6 + 2;
      return [
        P(id(`c${index}`), `Tassel Cord ${index + 1}`, [x, y - 0.4, inst.offsetZ + 1], [0.3 * s, 0.8, 0.3 * s], "guard", palette.accent, G, { emissive: false, opacity: inst.opacity }),
        P(id(index), `Tassel ${index + 1}`, [x, y - 0.8 - length / 2, inst.offsetZ + 1], [0.8 * s, length, 0.3 * s], "rune", color, G, {
          rotation: [inst.tilt * 0.3, 0, (index - (n - 1) / 2) * 6],
          origin: [x, y - 0.8, inst.offsetZ + 1],
          emissive: inst.emissive,
          opacity: inst.opacity,
        }),
      ];
    }).flat(),
  ribbon_spiral: ({ inst, P, color, id, y, n, s }) => {
    const turns = (Math.PI * 2 * inst.twist) / 360;
    return Array.from({ length: n }, (_, index) => {
      const t = index / Math.max(1, n - 1);
      const angle = t * turns;
      return P(id(index), `Ribbon ${index + 1}`, [Math.cos(angle) * inst.radius, y - t * inst.radius * 3, Math.sin(angle) * inst.radius + inst.offsetZ], [1.4 * s, 0.25 * s, 0.6 * s], "rune", color, G, {
        rotation: [inst.tilt, -deg(angle) + 90, 12],
        emissive: inst.emissive,
        opacity: inst.opacity,
      });
    });
  },
  shard_ring: ({ inst, P, color, id, y, n, s }) =>
    Array.from({ length: n }, (_, index) => {
      const angle = (index / n) * Math.PI * 2;
      const center: Vector3 = [Math.cos(angle) * inst.radius, y + Math.sin(index * 1.7) * 0.8, Math.sin(angle) * inst.radius + inst.offsetZ];
      return P(id(index), `Floating Shard ${index + 1}`, center, [0.7 * s, 2 * s, 0.7 * s], "gem", color, G, {
        rotation: [index % 2 === 0 ? inst.tilt : -inst.tilt, deg(angle), 0],
        emissive: inst.emissive,
        opacity: inst.opacity,
      });
    }),
  gear_cluster: ({ inst, color, res, id, y, w, n, s }) =>
    Array.from({ length: Math.min(6, n) }, (_, index) =>
      gear(id(index), `Deco Gear ${index + 1}`, [w + 1.4 * s + index * 0.8 * s, y - index * 2.6 * s, inst.offsetZ], 1.4 * s * (1 - index * 0.12), 0.8 * s, color, res, G, 6 + index * 2, true),
    ).flat(),
  pipes: ({ inst, P, color, palette, id, y, w, d, n, s }) =>
    Array.from({ length: n }, (_, index) => {
      const x = (index - (n - 1) / 2) * 1.6 * s + (w > 2 ? 0 : 0);
      const length = inst.radius * 2;
      const z = -(d + 0.5 * s) + inst.offsetZ;
      return [
        P(id(index), `Pipe ${index + 1}`, [x, y - length / 2, z], [0.8 * s, length, 0.8 * s], "guard", color, G, { emissive: false, opacity: inst.opacity }),
        P(id(`cap${index}`), `Pipe Joint ${index + 1}`, [x, y, z], [1.2 * s, 0.8 * s, 1.2 * s], "rune", palette.accent, G, { emissive: inst.emissive, opacity: inst.opacity }),
        P(id(`elb${index}`), `Pipe Elbow ${index + 1}`, [x, y - length, z + 0.6 * s], [0.8 * s, 0.8 * s, 1.6 * s], "guard", color, G, { emissive: false, opacity: inst.opacity }),
      ];
    }).flat(),
  cooling_fins: ({ inst, P, color, id, y, w, d, n, s }) =>
    Array.from({ length: n }, (_, index) =>
      P(id(index), `Cooling Fin ${index + 1}`, [0, y - index * 0.8 * s, inst.offsetZ], [w * 2 + 2.4 * s, 0.3 * s, d * 2 + 0.6 * s], "blade", color, G, {
        rotation: [0, inst.twist * (index / Math.max(1, n)), inst.tilt],
        emissive: inst.emissive,
        opacity: inst.opacity,
      }),
    ),
  thrusters: ({ inst, P, color, palette, id, y, w, d, n, s }) =>
    Array.from({ length: n }, (_, index) => {
      const z = -(d + 1 * s) + inst.offsetZ;
      const py = y - index * 2.6 * s;
      const x = w * 0.6;
      return [
        P(id(`n${index}`), `Thruster Nozzle ${index + 1}`, [x, py, z], [1.6 * s, 1.6 * s, 2 * s], "guard", palette.dark, G, { rotation: [inst.tilt, 0, 0], emissive: false, opacity: 1 }),
        P(id(index), `Thruster Flame ${index + 1}`, [x, py, z - 1.8 * s], [1.1 * s, 1.1 * s, 2.4 * s], "gem", color, G, { rotation: [inst.tilt, 0, 0], emissive: true, opacity: Math.min(inst.opacity, 0.8) }),
      ];
    }).flat(),
  eye_cluster: ({ inst, P, color, palette, id, y, d, n, s, random }) =>
    Array.from({ length: n }, (_, index) => {
      const angle = random() * Math.PI * 2;
      const r = index === 0 ? 0 : random() * inst.radius;
      const center: Vector3 = [Math.cos(angle) * r, y + Math.sin(angle) * r, d + 0.3 + inst.offsetZ];
      const scale = s * (index === 0 ? 1.4 : 0.7 + random() * 0.5);
      return [
        P(id(`w${index}`), `Eye ${index + 1}`, center, [1.6 * scale, 1 * scale, 0.4], "gem", palette.dark, G, { emissive: false, opacity: inst.opacity }),
        P(id(index), `Pupil ${index + 1}`, [center[0], center[1], center[2] + 0.25], [0.5 * scale, 0.9 * scale, 0.3], "gem", color, G, { emissive: inst.emissive, opacity: inst.opacity }),
      ];
    }).flat(),
  blood_drips: ({ inst, P, color, id, y, w, n, s, random }) =>
    Array.from({ length: n }, (_, index) => {
      const length = (1 + random() * 2.5) * s;
      return P(id(index), `Drip ${index + 1}`, [(random() - 0.5) * w * 2.2, y - random() * inst.radius, 0.6 + inst.offsetZ], [0.5 * s, length, 0.4 * s], "gem", color, G, {
        emissive: inst.emissive,
        opacity: inst.opacity,
      });
    }),
  crystal_growth: ({ inst, P, color, palette, id, y, w, n, s, random }) =>
    Array.from({ length: n }, (_, index) => {
      const side = random() > 0.5 ? 1 : -1;
      const width = (0.6 + random() * 0.9) * s;
      return P(id(index), `Crystal ${index + 1}`, [side * (w * 0.5 + random() * inst.radius * 0.5), y - random() * inst.radius * 2, (random() - 0.5) * 2 + inst.offsetZ], [width, (1.6 + random() * 2.6) * s, width], "gem", index % 3 === 0 ? palette.highlight : color, G, {
        rotation: [(random() - 0.5) * 50 + inst.tilt, random() * 90, side * (10 + random() * 30)],
        emissive: inst.emissive,
        opacity: inst.opacity,
      });
    }),
  energy_edge: ({ inst, P, color, id, y, w, s }) =>
    [-1, 1].map((side) =>
      P(id(side), `Energy Edge ${side > 0 ? "R" : "L"}`, [side * (w + 0.25 * s), y - inst.radius, inst.offsetZ], [0.35 * s, inst.radius * 2, 1.1 * s], "rune", color, G, {
        rotation: [0, 0, side * inst.tilt * 0.2],
        emissive: inst.emissive,
        opacity: inst.opacity,
      }),
    ),
  rune_plates: ({ inst, P, color, id, y, n, s }) =>
    Array.from({ length: n }, (_, index) => {
      const angle = (index / n) * Math.PI * 2 + (inst.twist * Math.PI) / 180;
      return P(id(index), `Rune Plate ${index + 1}`, [Math.cos(angle) * inst.radius, y, Math.sin(angle) * inst.radius + inst.offsetZ], [s, s * 1.4, 0.2], "rune", color, G, {
        rotation: [inst.tilt, -deg(angle) + 90, 0],
        emissive: inst.emissive,
        opacity: inst.opacity,
      });
    }),
  bone_ribs: ({ inst, P, color, id, y, w, n, s }) =>
    Array.from({ length: n }, (_, index) => {
      const py = y - index * 1.8 * s;
      return [-1, 1].flatMap((side) => [
        P(id(`${side}a${index}`), `Rib ${side > 0 ? "R" : "L"}${index + 1}a`, [side * (w + 1 * s), py, inst.offsetZ], [2 * s, 0.6 * s, 0.6 * s], "guard", color, G, { rotation: [0, 0, side * (15 + inst.tilt)], emissive: inst.emissive, opacity: inst.opacity }),
        P(id(`${side}b${index}`), `Rib ${side > 0 ? "R" : "L"}${index + 1}b`, [side * (w + 2.4 * s), py - 0.8 * s, inst.offsetZ + 0.4], [0.6 * s, 1.8 * s, 0.6 * s], "guard", color, G, { rotation: [0, 0, side * (25 + inst.tilt)], emissive: inst.emissive, opacity: inst.opacity }),
      ]);
    }).flat(),
  feather_tuft: ({ inst, P, color, id, y, n, s }) =>
    Array.from({ length: n }, (_, index) => {
      const angle = (index / n) * Math.PI * 2;
      const center: Vector3 = [Math.cos(angle) * inst.radius, y + 1.6 * s, Math.sin(angle) * inst.radius + inst.offsetZ];
      return P(id(index), `Feather ${index + 1}`, center, [0.9 * s, 3.2 * s, 0.2], "blade", color, G, {
        rotation: outward(angle, inst.tilt),
        origin: [center[0], y, center[2]],
        emissive: inst.emissive,
        opacity: inst.opacity,
      });
    }),
  banner: ({ inst, P, color, palette, id, y, s }) => [
    P(id("bar"), "Banner Crossbar", [0, y, inst.offsetZ], [inst.radius * 0.9, 0.5 * s, 0.5 * s], "guard", palette.accent, G, { emissive: false, opacity: 1 }),
    P(id("cloth"), "Banner Cloth", [0, y - inst.radius * 0.6, inst.offsetZ + 0.3], [inst.radius * 0.8, inst.radius * 1.2, 0.2], "rune", color, G, {
      rotation: [inst.tilt * 0.3, 0, 0],
      origin: [0, y, inst.offsetZ + 0.3],
      emissive: inst.emissive,
      opacity: inst.opacity,
    }),
    P(id("emblem"), "Banner Emblem", [0, y - inst.radius * 0.5, inst.offsetZ + 0.5], [1.4 * s, 1.4 * s, 0.3], "gem", palette.glow, G, { rotation: [0, 0, 45], emissive: true, opacity: 1 }),
  ],
  skull: ({ inst, P, color, palette, id, y, d, s }) => {
    const z = d + 1 * s + inst.offsetZ;
    return [
      P(id("cranium"), "Skull Cranium", [0, y + 0.4 * s, z], [2.6 * s, 2.4 * s, 2.4 * s], "guard", color, G, { rotation: [inst.tilt, 0, 0], emissive: inst.emissive, opacity: inst.opacity }),
      P(id("jaw"), "Skull Jaw", [0, y - 1.2 * s, z + 0.3 * s], [1.8 * s, 1 * s, 1.8 * s], "guard", color, G, { rotation: [inst.tilt, 0, 0], emissive: inst.emissive, opacity: inst.opacity }),
      ...[-1, 1].map((side) =>
        P(id(`eye${side}`), `Skull Eye ${side > 0 ? "R" : "L"}`, [side * 0.6 * s, y + 0.4 * s, z + 1.25 * s], [0.6 * s, 0.6 * s, 0.2], "gem", palette.glow, G, { emissive: true, opacity: 1 }),
      ),
    ];
  },
};

function mirrorX(elements: ModelElement[], tag: string): ModelElement[] {
  return elements
    .filter((element) => Math.abs((element.from[0] + element.to[0]) / 2) > 0.3)
    .map((element) => ({
      ...element,
      id: `${element.id}_${tag}`,
      name: `${element.name} (Mirror)`,
      from: [-element.to[0], element.from[1], element.from[2]],
      to: [-element.from[0], element.to[1], element.to[2]],
      origin: [-element.origin[0], element.origin[1], element.origin[2]],
      rotation: [element.rotation[0], -element.rotation[1], -element.rotation[2]],
    }));
}

export function generateDecoration(inst: DecorationInstance, anatomy: ModelAnatomy, palette: ColorPalette, res: TextureResolution): ModelElement[] {
  const ctx: Ctx = {
    inst,
    a: anatomy,
    P: maker(res, true),
    color: resolveColor(inst.colorSource, inst.customColor, palette),
    palette,
    res,
    id: (suffix) => `dc_${inst.id}_${suffix}`,
    y: anatomy.minY + anatomy.height * inst.height,
    w: anatomy.upperHalfWidth,
    d: anatomy.upperHalfDepth,
    n: Math.max(1, Math.min(32, Math.round(inst.count))),
    s: Math.max(0.2, inst.size),
    random: seeded(hashId(inst.id)),
  };
  const elements = GENERATORS[inst.type](ctx).map((element) => ({ ...element, generated: true, group: `decor_${inst.id}` }));
  return inst.mirror ? [...elements, ...mirrorX(elements, "m")] : elements;
}

/** Appends every enabled decoration layer as real geometry (with its own outliner group). */
export function applyDecorations(model: ModelData, anatomySource: ModelData = model): ModelData {
  const layers = (model.decorations ?? []).filter((decoration) => decoration.enabled);
  if (layers.length === 0) return model;
  const anatomy = analyzeModel(anatomySource.elements);
  const extra: ModelElement[] = [];
  const groups = model.groups.filter((entry) => !entry.id.startsWith("decor_"));
  layers.forEach((inst) => {
    const elements = generateDecoration(inst, anatomy, model.palette, model.textureWidth);
    extra.push(...elements);
    groups.push(group(`decor_${inst.id}`, `装飾: ${DECORATION_DEFS[inst.type].labelJa}`, elements.map((element) => element.id)));
  });
  return { ...model, elements: [...model.elements, ...extra], groups };
}

export function normalizeDecorations(value: unknown): DecorationInstance[] {
  if (!Array.isArray(value)) return [];
  const num = (input: unknown, fallback: number, min: number, max: number) => {
    const parsed = typeof input === "number" ? input : Number(input);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
  };
  return value
    .filter((item): item is DecorationInstance => Boolean(item) && typeof item === "object" && (DECORATION_TYPES as readonly string[]).includes((item as DecorationInstance).type))
    .slice(0, 40)
    .map((item) => {
      const base = createDecoration(item.type);
      return {
        id: typeof item.id === "string" && /^[a-z0-9]+$/i.test(item.id) ? item.id : base.id,
        type: item.type,
        enabled: item.enabled !== false,
        count: num(item.count, base.count, 1, 32),
        size: num(item.size, base.size, 0.2, 4),
        radius: num(item.radius, base.radius, 0.5, 18),
        height: num(item.height, base.height, -0.1, 1.3),
        tilt: num(item.tilt, base.tilt, -90, 90),
        twist: num(item.twist, base.twist, -1080, 1080),
        offsetZ: num(item.offsetZ, base.offsetZ, -8, 8),
        colorSource: (DECORATION_COLOR_SOURCES as readonly string[]).includes(item.colorSource) ? item.colorSource : base.colorSource,
        customColor: typeof item.customColor === "string" && /^#[0-9a-f]{6}$/i.test(item.customColor) ? item.customColor : base.customColor,
        emissive: typeof item.emissive === "boolean" ? item.emissive : base.emissive,
        opacity: num(item.opacity, base.opacity, 0.1, 1),
        mirror: Boolean(item.mirror),
      };
    });
}

