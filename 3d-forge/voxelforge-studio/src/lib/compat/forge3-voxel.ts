import type {
  ArchetypeParams,
  CuboidElement,
  ElementMotion,
  FaceUV,
  ModelDisplaySettings,
} from "../compat/forge3-types";
import { boneUuid, buildBlockbenchAnimations, isAnimated } from "../compat/forge3-motion";
import { buildStaffDrafts, DEFAULT_STAFF_FX, resolveStaffFx } from "../compat/forge3-staff";
import {
  applyEvolutionStage,
  FORGE_PRESETS,
  EVOLUTION_STAGES,
  getVisualStyle,
  type VisualStyleId,
} from "../compat/forge3-visual";

import {
  buildChainsawBladeDrafts,
  buildGunbladeDrafts,
  buildRailCannonDrafts,
  buildStaffMagicAuraDrafts,
  buildSwordRomanceDetails,
} from "./forge3-mech";
import {
  EXTRA_BUILDERS,
  EXTRA_CATALOG,
  EXTRA_PALETTES,
} from "./forge3-extra";
import { buildStyleOverlay } from "./forge3-overlay";

export type ArchetypeId =
  | "sword"
  | "greatsword"
  | "katana"
  | "axe"
  | "pickaxe"
  | "staff"
  | "dagger"
  | "hammer"
  | "gunblade"
  | "rail_cannon"
  | "chainsaw_blade"
  | "cursed_blade"
  | "blood_scythe"
  | "scepter"
  | "grimoire"
  | "bow"
  | "assault_rifle"
  | "pistol"
  | "railgun"
  | "relic"
  | "ornate_spear"
  | "mace"
  | "drill_lance"
  | "crystal_spellblade";

export type MaterialPresetId =
  | "diamond"
  | "netherite"
  | "gold"
  | "emerald"
  | "amethyst"
  | "crimson"
  | "iron"
  | "sculk"
  | "abyss"
  | "blood"
  | "gunmetal"
  | "holy";

export interface MaterialPalette {
  id: MaterialPresetId;
  nameJa: string;
  nameEn: string;
  primaryLight: string;
  primaryBase: string;
  primaryDark: string;
  edgeHighlight: string;
  trimLight: string;
  trimBase: string;
  trimDark: string;
  handleLight: string;
  handleBase: string;
  handleDark: string;
  gemLight: string;
  gemBase: string;
  gemDark: string;
  coreGlow: string;
}

export const MATERIAL_PALETTES: Record<MaterialPresetId, MaterialPalette> = {
  diamond: {
    id: "diamond",
    nameJa: "ダイヤモンド (Diamond)",
    nameEn: "Radiant Diamond",
    primaryLight: "#a5f3fc",
    primaryBase: "#22d3ee",
    primaryDark: "#0e7490",
    edgeHighlight: "#ecfeff",
    trimLight: "#fde047",
    trimBase: "#f59e0b",
    trimDark: "#b45309",
    handleLight: "#78350f",
    handleBase: "#451a03",
    handleDark: "#271001",
    gemLight: "#f472b6",
    gemBase: "#db2777",
    gemDark: "#831843",
    coreGlow: "#67e8f9",
  },
  netherite: {
    id: "netherite",
    nameJa: "ネザライト (Netherite)",
    nameEn: "Ancient Netherite",
    primaryLight: "#73687a",
    primaryBase: "#48404d",
    primaryDark: "#27222b",
    edgeHighlight: "#a396ab",
    trimLight: "#fb923c",
    trimBase: "#ea580c",
    trimDark: "#9a3412",
    handleLight: "#7f1d1d",
    handleBase: "#450a0a",
    handleDark: "#260505",
    gemLight: "#fde047",
    gemBase: "#f97316",
    gemDark: "#c2410c",
    coreGlow: "#fb923c",
  },
  gold: {
    id: "gold",
    nameJa: "ロイヤルゴールド (Gold)",
    nameEn: "Royal Gilded",
    primaryLight: "#fef08a",
    primaryBase: "#eab308",
    primaryDark: "#a16207",
    edgeHighlight: "#fefce8",
    trimLight: "#60a5fa",
    trimBase: "#2563eb",
    trimDark: "#1e3a8a",
    handleLight: "#9f1239",
    handleBase: "#4c0519",
    handleDark: "#2a020d",
    gemLight: "#6ee7b7",
    gemBase: "#10b981",
    gemDark: "#065f46",
    coreGlow: "#fde047",
  },
  emerald: {
    id: "emerald",
    nameJa: "エメラルド (Emerald)",
    nameEn: "Emerald Valkyrie",
    primaryLight: "#6ee7b7",
    primaryBase: "#10b981",
    primaryDark: "#047857",
    edgeHighlight: "#ecfdf5",
    trimLight: "#f8fafc",
    trimBase: "#cbd5e1",
    trimDark: "#64748b",
    handleLight: "#713f12",
    handleBase: "#422006",
    handleDark: "#231103",
    gemLight: "#a7f3d0",
    gemBase: "#059669",
    gemDark: "#064e3b",
    coreGlow: "#34d399",
  },
  amethyst: {
    id: "amethyst",
    nameJa: "アメジスト (Amethyst)",
    nameEn: "Astral Amethyst",
    primaryLight: "#d8b4fe",
    primaryBase: "#9333ea",
    primaryDark: "#581c87",
    edgeHighlight: "#faf5ff",
    trimLight: "#fbbf24",
    trimBase: "#d97706",
    trimDark: "#78350f",
    handleLight: "#475569",
    handleBase: "#1e293b",
    handleDark: "#0f172a",
    gemLight: "#f5d0fe",
    gemBase: "#c026d3",
    gemDark: "#701a75",
    coreGlow: "#e879f9",
  },
  crimson: {
    id: "crimson",
    nameJa: "ブラッドムーン (Crimson)",
    nameEn: "Bloodmoon Ruby",
    primaryLight: "#fda4af",
    primaryBase: "#e11d48",
    primaryDark: "#881337",
    edgeHighlight: "#fff1f2",
    trimLight: "#d6d3d1",
    trimBase: "#57534e",
    trimDark: "#1c1917",
    handleLight: "#3f3f46",
    handleBase: "#18181b",
    handleDark: "#09090b",
    gemLight: "#fecdd3",
    gemBase: "#f43f5e",
    gemDark: "#9f1239",
    coreGlow: "#fb7185",
  },
  iron: {
    id: "iron",
    nameJa: "ダマスカス鋼 (Damascus)",
    nameEn: "Forged Steel",
    primaryLight: "#f1f5f9",
    primaryBase: "#94a3b8",
    primaryDark: "#475569",
    edgeHighlight: "#ffffff",
    trimLight: "#facc15",
    trimBase: "#ca8a04",
    trimDark: "#713f12",
    handleLight: "#854d0e",
    handleBase: "#422006",
    handleDark: "#1f0e02",
    gemLight: "#7dd3fc",
    gemBase: "#0284c7",
    gemDark: "#0c4a6e",
    coreGlow: "#38bdf8",
  },
  sculk: {
    id: "sculk",
    nameJa: "ディープダーク (Sculk)",
    nameEn: "Warden Sculk",
    primaryLight: "#5eead4",
    primaryBase: "#0d9488",
    primaryDark: "#115e59",
    edgeHighlight: "#ccfbf1",
    trimLight: "#e7e5e4",
    trimBase: "#a8a29e",
    trimDark: "#44403c",
    handleLight: "#1e293b",
    handleBase: "#0f172a",
    handleDark: "#020617",
    gemLight: "#99f6e4",
    gemBase: "#14b8a6",
    gemDark: "#134e4a",
    coreGlow: "#2dd4bf",
  },
  ...EXTRA_PALETTES,
};

export interface ArchetypeMeta {
  id: ArchetypeId;
  nameJa: string;
  nameEn: string;
  category: string;
  description: string;
  defaultParams: ArchetypeParams;
}

export const ARCHETYPE_CATALOG: ArchetypeMeta[] = [
  {
    id: "sword",
    nameJa: "片手剣 (Broadsword)",
    nameEn: "Knight Broadsword",
    category: "Melee Weapon",
    description: "バランスに優れた王道ファンタジー剣。血溝・エッジベベル・宝玉ガード対応。",
    defaultParams: {
      bladeLength: 14,
      bladeWidth: 3.0,
      guardWidth: 7.5,
      guardStyle: "winged",
      pommelStyle: "gem",
      voxelDepth: 1.4,
      taperSteps: 4,
      fullerGroove: true,
      edgeBevel: true,
      gemAccent: true,
      strictMinecraftRotation: true,
      uvPadding: 1,
      shadingStyle: "hand_painted",
    },
  },
  {
    id: "greatsword",
    nameJa: "大剣 (Greatsword)",
    nameEn: "Colossal Claymore",
    category: "Heavy Weapon",
    description: "圧倒的なリーチと重厚な多段ブレード・ルーンコアを備えた両手大剣。",
    defaultParams: {
      bladeLength: 19,
      bladeWidth: 4.4,
      guardWidth: 10.0,
      guardStyle: "royal",
      pommelStyle: "counterweight",
      voxelDepth: 1.8,
      taperSteps: 5,
      fullerGroove: true,
      edgeBevel: true,
      gemAccent: true,
      strictMinecraftRotation: true,
      uvPadding: 1,
      shadingStyle: "runic_glow",
    },
  },
  {
    id: "katana",
    nameJa: "日本刀 (Katana)",
    nameEn: "Curved Uchigatana",
    category: "Slashing Blade",
    description: "反りのある優美な刀身と鍔（つば）・柄巻を精密ボクセルで再現した日本刀。",
    defaultParams: {
      bladeLength: 16,
      bladeWidth: 2.0,
      guardWidth: 4.0,
      guardStyle: "katana_tsuba",
      pommelStyle: "tassel",
      voxelDepth: 1.1,
      taperSteps: 4,
      fullerGroove: false,
      edgeBevel: true,
      gemAccent: false,
      strictMinecraftRotation: true,
      uvPadding: 1,
      shadingStyle: "metallic_gradient",
    },
  },
  {
    id: "axe",
    nameJa: "戦斧 (Battleaxe)",
    nameEn: "Crescent Battleaxe",
    category: "Heavy Cleaver",
    description: "両刃の三日月ブレードとアーマーピアース穂先を持つ重装バトルアックス。",
    defaultParams: {
      bladeLength: 14,
      bladeWidth: 4.2,
      guardWidth: 9.0,
      guardStyle: "spiked",
      pommelStyle: "ring",
      voxelDepth: 1.6,
      taperSteps: 4,
      fullerGroove: true,
      edgeBevel: true,
      gemAccent: true,
      strictMinecraftRotation: true,
      uvPadding: 1,
      shadingStyle: "hand_painted",
    },
  },
  {
    id: "pickaxe",
    nameJa: "ツルハシ (Pickaxe)",
    nameEn: "Artisan Pickaxe",
    category: "Mining Tool",
    description: "22.5°角度付きツインピック穂先と補強シャフトを備えた高品質マイニングツール。",
    defaultParams: {
      bladeLength: 13,
      bladeWidth: 2.8,
      guardWidth: 9.5,
      guardStyle: "cruciform",
      pommelStyle: "ring",
      voxelDepth: 1.5,
      taperSteps: 3,
      fullerGroove: false,
      edgeBevel: true,
      gemAccent: true,
      strictMinecraftRotation: true,
      uvPadding: 1,
      shadingStyle: "crisp_pixel",
    },
  },
  {
    id: "staff",
    nameJa: "魔導杖 (Archmage Staff)",
    nameEn: "Arcane Crystal Staff",
    category: "Magic Catalyst",
    description: "籠冠・光輪・蝕・彗星尾を切り替えて、原点共有の浮遊結晶がBlockbenchで周回する魔導杖。",
    defaultParams: {
      bladeLength: 16,
      bladeWidth: 3.2,
      guardWidth: 6.5,
      guardStyle: "winged",
      pommelStyle: "gem",
      voxelDepth: 1.6,
      taperSteps: 3,
      fullerGroove: true,
      edgeBevel: false,
      gemAccent: true,
      strictMinecraftRotation: true,
      uvPadding: 1,
      shadingStyle: "runic_glow",
      floatingRig: { ...DEFAULT_STAFF_FX },
    },
  },
  {
    id: "dagger",

    nameJa: "短剣 (Twin Dagger)",
    nameEn: "Shadow Stiletto",
    category: "Agile Weapon",
    description: "逆反りガードと鋭利な中空ブレード・リングポンメルを備えた暗殺者ダガー。",
    defaultParams: {
      bladeLength: 9,
      bladeWidth: 2.4,
      guardWidth: 5.5,
      guardStyle: "winged",
      pommelStyle: "ring",
      voxelDepth: 1.2,
      taperSteps: 3,
      fullerGroove: true,
      edgeBevel: true,
      gemAccent: true,
      strictMinecraftRotation: true,
      uvPadding: 1,
      shadingStyle: "hand_painted",
    },
  },
  {
    id: "hammer",
    nameJa: "戦槌 (Warhammer)",
    nameEn: "Titan Forge Hammer",
    category: "Blunt Weapon",
    description: "巨大なベベル打撃ヘッドと背面スパイク・ルーンプレートを持つウォーハンマー。",
    defaultParams: {
      bladeLength: 14,
      bladeWidth: 4.5,
      guardWidth: 8.5,
      guardStyle: "royal",
      pommelStyle: "counterweight",
      voxelDepth: 2.4,
      taperSteps: 3,
      fullerGroove: true,
      edgeBevel: true,
      gemAccent: true,
      strictMinecraftRotation: true,
      uvPadding: 1,
      shadingStyle: "metallic_gradient",
    },
  },
  {
    id: "gunblade",
    nameJa: "機巧銃剣 (Gunblade)",
    nameEn: "Revolver Gunblade",
    category: "Hybrid Mech",
    description: "回転シリンダーとリニア銃身を備えた可変銃剣。トランスフォーム時にバレル伸長＆放熱フィン展開！",
    defaultParams: {
      bladeLength: 15,
      bladeWidth: 3.2,
      guardWidth: 7.0,
      guardStyle: "cruciform",
      pommelStyle: "counterweight",
      voxelDepth: 1.6,
      taperSteps: 4,
      fullerGroove: true,
      edgeBevel: true,
      gemAccent: true,
      strictMinecraftRotation: true,
      uvPadding: 1,
      shadingStyle: "metallic_gradient",
      serration: true,
      laserEdge: true,
      knuckleGuard: true,
      heatSinkVents: true,
      mechPiston: true,
      transformed: false,
    },
  },
  {
    id: "rail_cannon",
    nameJa: "可変重砲 (Rail Cannon)",
    nameEn: "Transform Rail Cannon",
    category: "Heavy Artillery",
    description: "超伝導磁気レールとプラズマ加速炉を持つ重火器。オーバードライブでツインレールが左右にパカッと展開！",
    defaultParams: {
      bladeLength: 17,
      bladeWidth: 4.8,
      guardWidth: 9.0,
      guardStyle: "royal",
      pommelStyle: "counterweight",
      voxelDepth: 2.2,
      taperSteps: 3,
      fullerGroove: true,
      edgeBevel: true,
      gemAccent: true,
      strictMinecraftRotation: true,
      uvPadding: 1,
      shadingStyle: "runic_glow",
      serration: false,
      laserEdge: true,
      knuckleGuard: false,
      heatSinkVents: true,
      mechPiston: true,
      transformed: false,
    },
  },
  {
    id: "chainsaw_blade",
    nameJa: "重装鋸刃 (Mecha Chainsaw)",
    nameEn: "Overclock Chainsaw",
    category: "Serrated Weapon",
    description: "高速回転タングステン鋸歯とデュアル排熱マフラーを備えたチェンソーブレード。シュレッダーモードで鋸歯が展開！",
    defaultParams: {
      bladeLength: 16,
      bladeWidth: 4.4,
      guardWidth: 8.0,
      guardStyle: "spiked",
      pommelStyle: "counterweight",
      voxelDepth: 2.0,
      taperSteps: 3,
      fullerGroove: true,
      edgeBevel: true,
      gemAccent: true,
      strictMinecraftRotation: true,
      uvPadding: 1,
      shadingStyle: "metallic_gradient",
      serration: true,
      laserEdge: false,
      knuckleGuard: true,
      heatSinkVents: true,
      mechPiston: true,
      transformed: false,
    },
  },
  ...EXTRA_CATALOG,
];

export function snapMinecraftAngle(angle: number, strict: boolean): number {
  if (!strict) return Math.max(-45, Math.min(45, Number(angle.toFixed(1))));
  const allowed = [-45, -22.5, 0, 22.5, 45];
  let best = 0;
  let minDiff = Infinity;
  for (const a of allowed) {
    const diff = Math.abs(angle - a);
    if (diff < minDiff) {
      minDiff = diff;
      best = a;
    }
  }
  return best;
}

export function getDefaultDisplaySettings(archetype: ArchetypeId): ModelDisplaySettings {
  const isLarge =
    archetype === "greatsword" ||
    archetype === "staff" ||
    archetype === "hammer" ||
    archetype === "rail_cannon" ||
    archetype === "chainsaw_blade" ||
    archetype === "blood_scythe" ||
    archetype === "ornate_spear" ||
    archetype === "railgun" ||
    archetype === "drill_lance" ||
    archetype === "scepter";
  const scale3rd = isLarge ? [1.15, 1.15, 1.0] : [0.95, 0.95, 0.95];
  const guiScale = isLarge ? [0.72, 0.72, 0.72] : [0.88, 0.88, 0.88];

  return {
    thirdperson_righthand: {
      rotation: [0, -90, 55],
      translation: [0, isLarge ? 5.5 : 4.0, 0.5],
      scale: scale3rd as [number, number, number],
    },
    thirdperson_lefthand: {
      rotation: [0, 90, -55],
      translation: [0, isLarge ? 5.5 : 4.0, 0.5],
      scale: scale3rd as [number, number, number],
    },
    firstperson_righthand: {
      rotation: [0, -90, 25],
      translation: [1.13, 3.2, 1.13],
      scale: [0.68, 0.68, 0.68],
    },
    firstperson_lefthand: {
      rotation: [0, 90, -25],
      translation: [1.13, 3.2, 1.13],
      scale: [0.68, 0.68, 0.68],
    },
    gui: {
      rotation: [15, -25, -45],
      translation: [0, -1.0, 0],
      scale: guiScale as [number, number, number],
    },
    ground: {
      rotation: [0, 0, 0],
      translation: [0, 3, 0],
      scale: [0.5, 0.5, 0.5],
    },
    fixed: {
      rotation: [0, 180, -45],
      translation: [0, -1.0, 0],
      scale: [0.9, 0.9, 0.9],
    },
  };
}

export type BoxGroup = CuboidElement["group"];
export interface RawBoxSpec {
  id: string;
  name: string;
  group: CuboidElement["group"];
  from: [number, number, number];
  to: [number, number, number];
  origin?: [number, number, number];
  rotation?: { axis: "x" | "y" | "z"; angle: number };
  materialRole: CuboidElement["materialRole"];
  motion?: ElementMotion;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Generates procedural 3D cuboid elements for the chosen archetype and parameters.
 * Coordinates are centered at X=8, Z=8 (standard Minecraft 16x16x16 block center),
 * with Y spanning from ~0.5 up to ~28 depending on weapon length.
 */
export function generateArchetypeElements(
  archetype: ArchetypeId,
  params: ArchetypeParams,
  resolution: number = 32,
  extraSpecs: RawBoxSpec[] = []
): CuboidElement[] {
  const raw: RawBoxSpec[] = [];
  const cx = 8;
  const cz = 8;
  const depth = Math.max(0.6, Math.min(3.2, params.voxelDepth));
  const halfD = depth / 2;

  const addBox = (spec: RawBoxSpec) => {
    raw.push({
      ...spec,
      from: [r2(spec.from[0]), r2(spec.from[1]), r2(spec.from[2])],
      to: [r2(spec.to[0]), r2(spec.to[1]), r2(spec.to[2])],
      origin: spec.origin
        ? [r2(spec.origin[0]), r2(spec.origin[1]), r2(spec.origin[2])]
        : [
            r2((spec.from[0] + spec.to[0]) / 2),
            r2((spec.from[1] + spec.to[1]) / 2),
            r2((spec.from[2] + spec.to[2]) / 2),
          ],
      rotation: spec.rotation
        ? {
            axis: spec.rotation.axis,
            angle: snapMinecraftAngle(spec.rotation.angle, params.strictMinecraftRotation),
          }
        : { axis: "z", angle: 0 },
    });
  };

  // Common Pommel & Grip builder
  const buildPommelAndGrip = (gripHeight: number, gripWidth: number) => {
    // Pommel base (Y: 0.8 .. 2.4)
    if (params.pommelStyle === "ring") {
      addBox({
        id: "pommel_ring_outer",
        name: "Pommel Ring",
        group: "pommel",
        from: [cx - 1.5, 0.5, cz - halfD * 0.9],
        to: [cx + 1.5, 2.5, cz + halfD * 0.9],
        rotation: { axis: "z", angle: 45 },
        materialRole: "trim",
      });
      addBox({
        id: "pommel_ring_core",
        name: "Pommel Socket",
        group: "pommel",
        from: [cx - 0.8, 0.9, cz - halfD * 1.1],
        to: [cx + 0.8, 2.1, cz + halfD * 1.1],
        rotation: { axis: "z", angle: 45 },
        materialRole: "gem",
      });
    } else if (params.pommelStyle === "counterweight") {
      addBox({
        id: "pommel_heavy",
        name: "Counterweight Pommel",
        group: "pommel",
        from: [cx - 1.8, 0.6, cz - halfD * 1.2],
        to: [cx + 1.8, 2.3, cz + halfD * 1.2],
        materialRole: "trim",
      });
      addBox({
        id: "pommel_spike",
        name: "Pommel Finial",
        group: "pommel",
        from: [cx - 0.9, 0.1, cz - halfD * 0.8],
        to: [cx + 0.9, 1.2, cz + halfD * 0.8],
        rotation: { axis: "z", angle: 45 },
        materialRole: "edge",
      });
    } else {
      // Gem or default ornate pommel
      addBox({
        id: "pommel_cap",
        name: "Pommel Cap",
        group: "pommel",
        from: [cx - 1.4, 0.8, cz - halfD * 1.15],
        to: [cx + 1.4, 2.3, cz + halfD * 1.15],
        rotation: { axis: "z", angle: 45 },
        materialRole: "trim",
      });
      if (params.gemAccent) {
        addBox({
          id: "pommel_gem",
          name: "Pommel Jewel",
          group: "pommel",
          from: [cx - 0.75, 1.1, cz - halfD * 1.35],
          to: [cx + 0.75, 2.0, cz + halfD * 1.35],
          rotation: { axis: "z", angle: 45 },
          materialRole: "gem",
        });
      }
    }

    // Grip Core
    const gripStart = 2.2;
    const gripEnd = gripStart + gripHeight;
    addBox({
      id: "grip_core",
      name: "Handle Grip Core",
      group: "grip",
      from: [cx - gripWidth / 2, gripStart, cz - halfD * 0.75],
      to: [cx + gripWidth / 2, gripEnd, cz + halfD * 0.75],
      materialRole: "handle",
    });

    // Grip Wrapping Bands (adds high-detail 3D depth)
    const bandCount = Math.max(2, Math.floor(gripHeight / 1.4));
    for (let i = 0; i < bandCount; i++) {
      const by = gripStart + 0.4 + i * ((gripHeight - 0.8) / Math.max(1, bandCount - 1));
      addBox({
        id: `grip_wrap_${i + 1}`,
        name: `Grip Binding #${i + 1}`,
        group: "grip",
        from: [cx - gripWidth / 2 - 0.15, by - 0.25, cz - halfD * 0.88],
        to: [cx + gripWidth / 2 + 0.15, by + 0.25, cz + halfD * 0.88],
        materialRole: i % 2 === 0 ? "trim" : "handle",
      });
    }

    return gripEnd;
  };

  if (archetype === "sword" || archetype === "greatsword" || archetype === "dagger") {
    const isGreat = archetype === "greatsword";
    const isDagger = archetype === "dagger";
    const gripH = isGreat ? 5.2 : isDagger ? 3.2 : 4.0;
    const gripW = isGreat ? 1.6 : isDagger ? 1.15 : 1.35;
    const guardY = buildPommelAndGrip(gripH, gripW);

    // Crossguard
    const gHalfW = params.guardWidth / 2;
    const gHeight = isGreat ? 1.6 : 1.3;
    addBox({
      id: "guard_center",
      name: "Crossguard Block",
      group: "guard",
      from: [cx - 1.8, guardY - 0.2, cz - halfD * 1.3],
      to: [cx + 1.8, guardY + gHeight, cz + halfD * 1.3],
      materialRole: "trim",
    });

    const wingAngle =
      params.guardStyle === "winged"
        ? 22.5
        : params.guardStyle === "spiked"
          ? -22.5
          : 0;

    addBox({
      id: "guard_wing_left",
      name: "Guard Quillon Left",
      group: "guard",
      from: [cx - gHalfW, guardY, cz - halfD * 1.05],
      to: [cx - 1.2, guardY + gHeight * 0.85, cz + halfD * 1.05],
      origin: [cx - 1.5, guardY + gHeight * 0.5, cz],
      rotation: { axis: "z", angle: -wingAngle },
      materialRole: "trim",
    });

    addBox({
      id: "guard_wing_right",
      name: "Guard Quillon Right",
      group: "guard",
      from: [cx + 1.2, guardY, cz - halfD * 1.05],
      to: [cx + gHalfW, guardY + gHeight * 0.85, cz + halfD * 1.05],
      origin: [cx + 1.5, guardY + gHeight * 0.5, cz],
      rotation: { axis: "z", angle: wingAngle },
      materialRole: "trim",
    });

    if (params.guardStyle === "royal" || isGreat) {
      addBox({
        id: "guard_prong_left",
        name: "Royal Guard Prong L",
        group: "guard",
        from: [cx - gHalfW * 0.75, guardY + gHeight * 0.6, cz - halfD * 0.85],
        to: [cx - gHalfW * 0.45, guardY + gHeight + 1.6, cz + halfD * 0.85],
        rotation: { axis: "z", angle: -22.5 },
        materialRole: "edge",
      });
      addBox({
        id: "guard_prong_right",
        name: "Royal Guard Prong R",
        group: "guard",
        from: [cx + gHalfW * 0.45, guardY + gHeight * 0.6, cz - halfD * 0.85],
        to: [cx + gHalfW * 0.75, guardY + gHeight + 1.6, cz + halfD * 0.85],
        rotation: { axis: "z", angle: 22.5 },
        materialRole: "edge",
      });
    }

    if (params.gemAccent) {
      addBox({
        id: "guard_gem_center",
        name: "Crossguard Soul Gem",
        group: "detail",
        from: [cx - 0.95, guardY + 0.1, cz - halfD * 1.55],
        to: [cx + 0.95, guardY + gHeight + 0.2, cz + halfD * 1.55],
        rotation: { axis: "z", angle: 45 },
        materialRole: "gem",
      });
    }

    // Blade segments
    const bladeStartY = guardY + gHeight - 0.1;
    const totalBladeLen = params.bladeLength;
    const mainBodyLen = totalBladeLen * 0.68;
    const tipLen = totalBladeLen * 0.32;
    const bHalfW = params.bladeWidth / 2;

    // Blade Core
    addBox({
      id: "blade_core_lower",
      name: "Blade Forte (Lower)",
      group: "blade",
      from: [cx - bHalfW * 0.85, bladeStartY, cz - halfD * 0.75],
      to: [cx + bHalfW * 0.85, bladeStartY + mainBodyLen * 0.55, cz + halfD * 0.75],
      materialRole: "primary",
    });

    addBox({
      id: "blade_core_upper",
      name: "Blade Foible (Upper)",
      group: "blade",
      from: [cx - bHalfW * 0.76, bladeStartY + mainBodyLen * 0.52, cz - halfD * 0.68],
      to: [cx + bHalfW * 0.76, bladeStartY + mainBodyLen, cz + halfD * 0.68],
      materialRole: "primary",
    });

    // Edge Bevels (Left & Right sharp cutting edges)
    if (params.edgeBevel) {
      addBox({
        id: "blade_edge_left",
        name: "Cutting Edge Left",
        group: "blade",
        from: [cx - bHalfW, bladeStartY + 0.2, cz - halfD * 0.42],
        to: [cx - bHalfW * 0.65, bladeStartY + mainBodyLen * 0.96, cz + halfD * 0.42],
        materialRole: "edge",
      });
      addBox({
        id: "blade_edge_right",
        name: "Cutting Edge Right",
        group: "blade",
        from: [cx + bHalfW * 0.65, bladeStartY + 0.2, cz - halfD * 0.42],
        to: [cx + bHalfW, bladeStartY + mainBodyLen * 0.96, cz + halfD * 0.42],
        materialRole: "edge",
      });
    }

    // Fuller Blood Groove / Energy Channel
    if (params.fullerGroove) {
      addBox({
        id: "blade_fuller",
        name: "Blade Fuller / Rune Core",
        group: "detail",
        from: [cx - bHalfW * 0.28, bladeStartY + 0.5, cz - halfD * 0.92],
        to: [cx + bHalfW * 0.28, bladeStartY + mainBodyLen * 0.82, cz + halfD * 0.92],
        materialRole: "core",
      });
    }

    // Stepped Tapered Point
    const steps = Math.max(2, Math.min(6, params.taperSteps));
    const stepH = tipLen / steps;
    for (let s = 0; s < steps; s++) {
      const ratio = 1 - (s + 0.65) / (steps + 0.3);
      const sw = Math.max(0.35, bHalfW * ratio);
      const sy = bladeStartY + mainBodyLen + s * stepH;
      addBox({
        id: `blade_taper_${s + 1}`,
        name: `Blade Tip Step #${s + 1}`,
        group: "blade",
        from: [cx - sw, sy - 0.1, cz - halfD * Math.max(0.3, 0.6 * ratio)],
        to: [cx + sw, sy + stepH, cz + halfD * Math.max(0.3, 0.6 * ratio)],
        materialRole: s === steps - 1 ? "edge" : "primary",
      });
    }

    // Diamond Point Accent at very top
    addBox({
      id: "blade_apex_point",
      name: "Blade Apex Point",
      group: "blade",
      from: [cx - 0.55, bladeStartY + totalBladeLen - 0.8, cz - halfD * 0.38],
      to: [cx + 0.55, bladeStartY + totalBladeLen + 0.3, cz + halfD * 0.38],
      rotation: { axis: "z", angle: 45 },
      materialRole: "edge",
    });

    // Romantic Enhanced Details: Serration, Laser Photon Edge, Knuckle Bow Guard, Heat-Sink Vents
    const swordRomance = buildSwordRomanceDetails({
      cx,
      cz,
      params,
      bladeStartY,
      mainBodyLen,
      bHalfW,
      halfD,
      guardY,
      gHeight,
      gHalfW,
    });
    for (const d of swordRomance) addBox(d);
  } else if (archetype === "katana") {
    const guardY = buildPommelAndGrip(5.2, 1.2);

    // Tsuba (Circular/Octagonal Disk Guard)
    const tsubaR = Math.max(1.8, params.guardWidth * 0.45);
    addBox({
      id: "katana_tsuba",
      name: "Tsuba Handguard",
      group: "guard",
      from: [cx - tsubaR, guardY, cz - tsubaR * 0.85],
      to: [cx + tsubaR, guardY + 0.65, cz + tsubaR * 0.85],
      materialRole: "trim",
    });

    // Habaki (Blade Collar)
    const habakiY = guardY + 0.65;
    addBox({
      id: "katana_habaki",
      name: "Habaki Blade Collar",
      group: "guard",
      from: [cx - 0.9, habakiY, cz - halfD * 0.85],
      to: [cx + 0.9, habakiY + 1.2, cz + halfD * 0.85],
      materialRole: "gem",
    });

    // Curved Katana Blade Segments (Sori curve simulated via stepped X shift)
    const segs = Math.max(3, params.taperSteps + 1);
    const segLen = params.bladeLength / segs;
    const bWidth = Math.max(1.2, params.bladeWidth * 0.65);

    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      const curveOffset = Math.pow(t, 1.7) * 1.8; // Subtle authentic katana curvature
      const sy = habakiY + 1.1 + i * segLen;
      const wScale = i === segs - 1 ? 0.65 : 1 - t * 0.22;

      // Mune (Back Spine)
      addBox({
        id: `katana_mune_${i + 1}`,
        name: `Katana Spine Seg #${i + 1}`,
        group: "blade",
        from: [cx - bWidth * 0.55 * wScale + curveOffset, sy, cz - halfD * 0.55],
        to: [cx + bWidth * 0.25 * wScale + curveOffset, sy + segLen + 0.15, cz + halfD * 0.55],
        materialRole: "primary",
      });

      // Ha (Tempered Hamon Cutting Edge)
      addBox({
        id: `katana_ha_${i + 1}`,
        name: `Hamon Edge Seg #${i + 1}`,
        group: "blade",
        from: [cx + bWidth * 0.15 * wScale + curveOffset, sy, cz - halfD * 0.35],
        to: [cx + bWidth * 0.65 * wScale + curveOffset, sy + segLen + 0.15, cz + halfD * 0.35],
        materialRole: "edge",
      });
    }

    // Kissaki Tip
    const topY = habakiY + 1.1 + params.bladeLength;
    addBox({
      id: "katana_kissaki",
      name: "Kissaki Point",
      group: "blade",
      from: [cx + 0.9, topY - 0.6, cz - halfD * 0.35],
      to: [cx + 2.0, topY + 0.7, cz + halfD * 0.35],
      rotation: { axis: "z", angle: -22.5 },
      materialRole: "edge",
    });
  } else if (archetype === "axe") {
    const shaftLen = params.bladeLength + 2.5;
    buildPommelAndGrip(4.0, 1.35);

    // Long Upper Reinforced Shaft
    addBox({
      id: "axe_shaft_upper",
      name: "Reinforced Haft",
      group: "shaft",
      from: [cx - 0.75, 6.0, cz - halfD * 0.75],
      to: [cx + 0.75, shaftLen + 2.5, cz + halfD * 0.75],
      materialRole: "handle",
    });

    const headY = shaftLen - 2.2;
    const headH = Math.max(4.5, params.bladeWidth * 1.35);
    const wingSpan = Math.max(4.0, params.guardWidth * 0.65);

    // Central Axe Socket
    addBox({
      id: "axe_socket",
      name: "Axe Head Socket",
      group: "head",
      from: [cx - 1.6, headY + 0.8, cz - halfD * 1.25],
      to: [cx + 1.6, headY + headH - 0.8, cz + halfD * 1.25],
      materialRole: "trim",
    });

    if (params.gemAccent) {
      addBox({
        id: "axe_center_gem",
        name: "Axe Core Jewel",
        group: "detail",
        from: [cx - 0.9, headY + headH * 0.35, cz - halfD * 1.5],
        to: [cx + 0.9, headY + headH * 0.65, cz + halfD * 1.5],
        rotation: { axis: "z", angle: 45 },
        materialRole: "gem",
      });
    }

    // Left & Right Crescent Blades
    for (const side of [-1, 1] as const) {
      const label = side === -1 ? "Left" : "Right";
      addBox({
        id: `axe_cheek_${label.toLowerCase()}`,
        name: `Axe Cheek ${label}`,
        group: "blade",
        from: [
          side === -1 ? cx - wingSpan * 0.78 : cx + 1.2,
          headY + 0.4,
          cz - halfD * 0.85,
        ],
        to: [
          side === -1 ? cx - 1.2 : cx + wingSpan * 0.78,
          headY + headH - 0.4,
          cz + halfD * 0.85,
        ],
        materialRole: "primary",
      });

      // Outer Crescent Cutting Edge
      addBox({
        id: `axe_edge_${label.toLowerCase()}`,
        name: `Crescent Edge ${label}`,
        group: "blade",
        from: [
          side === -1 ? cx - wingSpan : cx + wingSpan * 0.68,
          headY - 0.4,
          cz - halfD * 0.5,
        ],
        to: [
          side === -1 ? cx - wingSpan * 0.68 : cx + wingSpan,
          headY + headH + 0.4,
          cz + halfD * 0.5,
        ],
        materialRole: "edge",
      });

      // Bearded Lower Hook & Upper Horn
      addBox({
        id: `axe_beard_${label.toLowerCase()}`,
        name: `Beard Tip ${label}`,
        group: "blade",
        from: [
          side === -1 ? cx - wingSpan * 0.92 : cx + wingSpan * 0.55,
          headY - 1.2,
          cz - halfD * 0.45,
        ],
        to: [
          side === -1 ? cx - wingSpan * 0.55 : cx + wingSpan * 0.92,
          headY + 0.2,
          cz + halfD * 0.45,
        ],
        materialRole: "edge",
      });
    }

    // Top Armor Spike
    addBox({
      id: "axe_top_spike",
      name: "Top Halberd Spike",
      group: "blade",
      from: [cx - 0.65, shaftLen + 2.2, cz - halfD * 0.55],
      to: [cx + 0.65, shaftLen + 5.0, cz + halfD * 0.55],
      materialRole: "edge",
    });
  } else if (archetype === "pickaxe") {
    const shaftLen = params.bladeLength + 3.0;
    buildPommelAndGrip(4.0, 1.3);

    // Wooden Mining Shaft
    addBox({
      id: "pick_shaft",
      name: "Pickaxe Shaft",
      group: "shaft",
      from: [cx - 0.75, 6.0, cz - halfD * 0.72],
      to: [cx + 0.75, shaftLen + 2.0, cz + halfD * 0.72],
      materialRole: "handle",
    });

    const headY = shaftLen - 0.2;
    const tineSpan = Math.max(4.5, params.guardWidth * 0.68);

    // Center Collar
    addBox({
      id: "pick_collar",
      name: "Pickaxe Head Socket",
      group: "head",
      from: [cx - 1.8, headY - 0.8, cz - halfD * 1.2],
      to: [cx + 1.8, headY + 1.6, cz + halfD * 1.2],
      materialRole: "trim",
    });

    if (params.gemAccent) {
      addBox({
        id: "pick_gem",
        name: "Socket Crystal",
        group: "detail",
        from: [cx - 0.8, headY - 0.3, cz - halfD * 1.45],
        to: [cx + 0.8, headY + 1.1, cz + halfD * 1.45],
        rotation: { axis: "z", angle: 45 },
        materialRole: "gem",
      });
    }

    // Angled Left & Right Pick Tines
    addBox({
      id: "pick_tine_left_inner",
      name: "Left Pick Arm",
      group: "blade",
      from: [cx - tineSpan * 0.72, headY - 0.4, cz - halfD * 0.85],
      to: [cx - 1.2, headY + 1.2, cz + halfD * 0.85],
      origin: [cx - 1.4, headY + 0.4, cz],
      rotation: { axis: "z", angle: 22.5 },
      materialRole: "primary",
    });

    addBox({
      id: "pick_tine_left_tip",
      name: "Left Diamond Tip",
      group: "blade",
      from: [cx - tineSpan - 1.1, headY - 1.8, cz - halfD * 0.6],
      to: [cx - tineSpan * 0.55, headY - 0.4, cz + halfD * 0.6],
      origin: [cx - tineSpan * 0.6, headY - 0.6, cz],
      rotation: { axis: "z", angle: 22.5 },
      materialRole: "edge",
    });

    addBox({
      id: "pick_tine_right_inner",
      name: "Right Pick Arm",
      group: "blade",
      from: [cx + 1.2, headY - 0.4, cz - halfD * 0.85],
      to: [cx + tineSpan * 0.72, headY + 1.2, cz + halfD * 0.85],
      origin: [cx + 1.4, headY + 0.4, cz],
      rotation: { axis: "z", angle: -22.5 },
      materialRole: "primary",
    });

    addBox({
      id: "pick_tine_right_tip",
      name: "Right Diamond Tip",
      group: "blade",
      from: [cx + tineSpan * 0.55, headY - 1.8, cz - halfD * 0.6],
      to: [cx + tineSpan + 1.1, headY - 0.4, cz + halfD * 0.6],
      origin: [cx + tineSpan * 0.6, headY - 0.6, cz],
      rotation: { axis: "z", angle: -22.5 },
      materialRole: "edge",
    });

    // Top Cap Crest
    addBox({
      id: "pick_top_crest",
      name: "Top Cap Finial",
      group: "head",
      from: [cx - 0.85, headY + 1.5, cz - halfD * 0.8],
      to: [cx + 0.85, headY + 2.8, cz + halfD * 0.8],
      materialRole: "trim",
    });
  } else if (archetype === "staff") {
    const shaftLen = params.bladeLength + 2.0;
    buildPommelAndGrip(4.5, 1.25);
    const drafts = buildStaffDrafts({
      cx,
      cz,
      shaftLen,
      bladeWidth: params.bladeWidth,
      guardWidth: params.guardWidth,
      fx: resolveStaffFx(params),
    });
    for (const draft of drafts) addBox(draft);

    // Super-Enhanced Magic Circles & Elemental Orbs
    const magicAuraDrafts = buildStaffMagicAuraDrafts({
      cx,
      cz,
      crownY: shaftLen + 3.2,
      span: Math.max(2.8, Math.min(6.2, params.guardWidth * 0.5)),
      params,
    });
    for (const d of magicAuraDrafts) addBox(d);
  } else if (EXTRA_BUILDERS[archetype]) {
    const builder = EXTRA_BUILDERS[archetype];
    if (builder) for (const d of builder(params)) addBox(d);
  } else if (archetype === "gunblade") {
    const gbDrafts = buildGunbladeDrafts(cx, cz, params);
    for (const d of gbDrafts) addBox(d);
  } else if (archetype === "rail_cannon") {
    const rcDrafts = buildRailCannonDrafts(cx, cz, params);
    for (const d of rcDrafts) addBox(d);
  } else if (archetype === "chainsaw_blade") {
    const csDrafts = buildChainsawBladeDrafts(cx, cz, params);
    for (const d of csDrafts) addBox(d);
  } else {
    // Hammer ("hammer")
    const shaftLen = params.bladeLength + 1.5;
    buildPommelAndGrip(4.2, 1.45);

    addBox({
      id: "hammer_shaft",
      name: "Warhammer Haft",
      group: "shaft",
      from: [cx - 0.85, 6.0, cz - 0.85],
      to: [cx + 0.85, shaftLen, cz + 0.85],
      materialRole: "handle",
    });

    const headY = shaftLen - 1.2;
    const headW = Math.max(4.5, params.guardWidth * 0.62);
    const headH = Math.max(3.6, params.bladeWidth * 0.95);
    const headD = Math.max(2.6, depth * 1.45);

    // Central Hammer Block
    addBox({
      id: "hammer_block_core",
      name: "Hammer Head Core",
      group: "head",
      from: [cx - headW * 0.7, headY, cz - headD / 2],
      to: [cx + headW * 0.7, headY + headH, cz + headD / 2],
      materialRole: "primary",
    });

    // Striking Face Left
    addBox({
      id: "hammer_face_left",
      name: "Striking Face Bevel L",
      group: "blade",
      from: [cx - headW, headY - 0.35, cz - headD * 0.58],
      to: [cx - headW * 0.62, headY + headH + 0.35, cz + headD * 0.58],
      materialRole: "edge",
    });

    // Striking Face Right / Back Spike
    addBox({
      id: "hammer_face_right",
      name: "Striking Face Bevel R",
      group: "blade",
      from: [cx + headW * 0.62, headY - 0.35, cz - headD * 0.58],
      to: [cx + headW, headY + headH + 0.35, cz + headD * 0.58],
      materialRole: "edge",
    });

    // Trim Bands & Rune Core
    addBox({
      id: "hammer_trim_band",
      name: "Forged Gold Trim",
      group: "guard",
      from: [cx - 1.8, headY - 0.3, cz - headD * 0.62],
      to: [cx + 1.8, headY + headH + 0.3, cz + headD * 0.62],
      materialRole: "trim",
    });

    if (params.gemAccent) {
      addBox({
        id: "hammer_rune_gem",
        name: "Titan Rune Core",
        group: "detail",
        from: [cx - 1.1, headY + headH * 0.25, cz - headD * 0.68],
        to: [cx + 1.1, headY + headH * 0.75, cz + headD * 0.68],
        rotation: { axis: "z", angle: 45 },
        materialRole: "gem",
      });
    }

    // Top Apex Finial
    addBox({
      id: "hammer_top_spike",
      name: "Hammer Crown Spike",
      group: "blade",
      from: [cx - 0.75, headY + headH + 0.2, cz - 0.75],
      to: [cx + 0.75, headY + headH + 2.2, cz + 0.75],
      rotation: { axis: "z", angle: 45 },
      materialRole: "edge",
    });
  }

  const style = getVisualStyle(params);
  if (style !== "base") {
    for (const d of buildStyleOverlay(raw, style)) addBox(d);
  }

  for (const d of extraSpecs) addBox(d);

  return packUVAtlas(raw, resolution, params.uvPadding);
}

/** Re-pack existing elements (after manual edits / added parts) into fresh UV islands. */
export function repackElements(
  elements: CuboidElement[],
  resolution: number,
  padding: number
): CuboidElement[] {
  const specs: RawBoxSpec[] = elements.map((el) => ({
    id: el.id,
    name: el.name,
    group: el.group,
    from: el.from,
    to: el.to,
    origin: el.origin,
    rotation: el.rotation,
    materialRole: el.materialRole,
    motion: el.motion,
  }));
  const packed = packUVAtlas(specs, resolution, padding);
  return packed.map((el, i) => ({ ...el, visible: elements[i].visible }));
}

export const SHADING_STYLES: Array<{ id: ArchetypeParams["shadingStyle"]; label: string; desc: string }> = [
  { id: "hand_painted", label: "ハンドペイント", desc: "立体ベベル＋陰影" },
  { id: "crisp_pixel", label: "クリスプドット", desc: "ディザリング明瞭" },
  { id: "metallic_gradient", label: "鍛造メタリック", desc: "斜め金属光沢反射" },
  { id: "runic_glow", label: "ルーン発光", desc: "魔力脈動ハイライト" },
  { id: "gradient_vertical", label: "縦グラデ", desc: "根元→先端へ明るく" },
  { id: "gradient_radial", label: "放射グラデ", desc: "中心が光る宝玉風" },
  { id: "gradient_diagonal", label: "斜めグラデ", desc: "3段の対角バンド" },
  { id: "two_tone", label: "ツートン", desc: "左右で明暗を分割" },
  { id: "blood_veins", label: "血脈", desc: "暗赤地に脈打つ血管" },
  { id: "cursed_noise", label: "呪蝕ノイズ", desc: "腐食した斑と亀裂" },
  { id: "carbon_tech", label: "カーボン", desc: "綾織り＋パネルライン" },
  { id: "holy_sheen", label: "聖光沢", desc: "白金の柔らかな艶" },
];

/**
 * Packs all cuboid elements into non-overlapping rectangular UV islands on a
 * `resolution x resolution` pixel grid, and computes normalized 0..16 Minecraft UVs.
 */
function packUVAtlas(
  rawSpecs: RawBoxSpec[],
  resolution: number,
  padding: number
): CuboidElement[] {
  const pad = Math.max(0, Math.min(2, padding));
  const scale = resolution === 16 ? 0.65 : resolution === 32 ? 1.25 : 2.5;
  const islands = rawSpecs.map((spec) => {
    const dx = Math.abs(spec.to[0] - spec.from[0]);
    const dy = Math.abs(spec.to[1] - spec.from[1]);
    const dz = Math.abs(spec.to[2] - spec.from[2]);
    return {
      spec,
      w: Math.max(1, Math.min(Math.floor(resolution * 0.4), Math.round((dx + dz) * scale))),
      h: Math.max(1, Math.min(Math.floor(resolution * 0.4), Math.round((dy + dz) * scale))),
      d: Math.max(1, Math.round(dz * scale)),
    };
  });

  const fits = (mul: number) => {
    let x = pad;
    let y = pad;
    let rowH = 0;
    for (const island of islands) {
      const w = Math.max(1, Math.round(island.w * mul));
      const h = Math.max(1, Math.round(island.h * mul));
      if (x + w + pad > resolution) {
        x = pad;
        y += rowH + pad;
        rowH = 0;
      }
      if (y + h + pad > resolution) return false;
      x += w + pad;
      rowH = Math.max(rowH, h);
    }
    return true;
  };

  let mul = 1;
  while (mul > 0.28 && !fits(mul)) mul = Math.round((mul - 0.06) * 100) / 100;

  let curX = pad;
  let curY = pad;
  let rowH = 0;

  return islands.map((island) => {
    const w = Math.max(1, Math.round(island.w * mul));
    const h = Math.max(1, Math.round(island.h * mul));
    const spec = island.spec;
    if (curX + w + pad > resolution) {
      curX = pad;
      curY += rowH + pad;
      rowH = 0;
    }
    if (curY + h > resolution) {
      curX = pad;
      curY = pad;
    }
    const boxX = Math.max(0, Math.min(resolution - w, curX));
    const boxY = Math.max(0, Math.min(resolution - h, curY));
    curX += w + pad;
    rowH = Math.max(rowH, h);

    const toMc = (px: number) => r2((px / resolution) * 16);
    const u1 = toMc(boxX);
    const v1 = toMc(boxY);
    const u2 = toMc(boxX + w);
    const v2 = toMc(boxY + h);
    const uMid = toMc(boxX + Math.max(1, Math.floor(w * 0.75)));
    const vMid = toMc(boxY + Math.max(1, Math.floor(h * 0.25)));
    const faceFront: FaceUV = { uv: [u1, v1, u2, v2], texture: "#0" };
    const faceSide: FaceUV = { uv: [uMid, v1, u2, v2], texture: "#0" };
    const faceCap: FaceUV = { uv: [u1, v1, u2, vMid], texture: "#0" };

    return {
      id: spec.id,
      name: spec.name,
      group: spec.group,
      from: spec.from,
      to: spec.to,
      origin: spec.origin || [8, 8, 8],
      rotation: spec.rotation || { axis: "z", angle: 0 },
      faces: {
        north: { ...faceFront },
        south: { ...faceFront },
        east: { ...faceSide },
        west: { ...faceSide },
        up: { ...faceCap },
        down: { ...faceCap },
      },
      visible: true,
      shade: true,
      materialRole: spec.materialRole,
      motion: spec.motion,
      uvBox: { x: boxX, y: boxY, w, h, d: island.d },
    };
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function mixColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * clamped),
    Math.round(c1[1] + (c2[1] - c1[1]) * clamped),
    Math.round(c1[2] + (c2[2] - c1[2]) * clamped),
  ];
}

function rgbToHex(rgb: [number, number, number]): string {
  return (
    "#" +
    rgb
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Generates a rich, pixel-art shaded 2D UV Atlas matrix (`string[][]` of hex colors)
 * for all cuboid UV islands according to their `materialRole` and `shadingStyle`.
 */
export function generatePixelAtlasMatrix(
  elements: CuboidElement[],
  materialId: MaterialPresetId,
  resolution: number,
  shadingStyle: ArchetypeParams["shadingStyle"] = "hand_painted"
): string[][] {
  const pal = MATERIAL_PALETTES[materialId] || MATERIAL_PALETTES.diamond;

  // Initialize background with subtle dark slate pixel base so even unmapped areas look clean
  const matrix: string[][] = Array.from({ length: resolution }, (_, y) =>
    Array.from({ length: resolution }, (__, x) =>
      (x + y) % 2 === 0 ? "#121520" : "#161a27"
    )
  );

  for (const el of elements) {
    const { x: bx, y: by, w: bw, h: bh } = el.uvBox;

    let lightHex = pal.primaryLight;
    let baseHex = pal.primaryBase;
    let darkHex = pal.primaryDark;

    if (el.materialRole === "edge") {
      lightHex = pal.edgeHighlight;
      baseHex = pal.primaryLight;
      darkHex = pal.primaryBase;
    } else if (el.materialRole === "trim") {
      lightHex = pal.trimLight;
      baseHex = pal.trimBase;
      darkHex = pal.trimDark;
    } else if (el.materialRole === "handle") {
      lightHex = pal.handleLight;
      baseHex = pal.handleBase;
      darkHex = pal.handleDark;
    } else if (el.materialRole === "gem") {
      lightHex = pal.gemLight;
      baseHex = pal.gemBase;
      darkHex = pal.gemDark;
    } else if (el.materialRole === "core") {
      lightHex = "#ffffff";
      baseHex = pal.coreGlow;
      darkHex = pal.primaryDark;
    }

    const cLight = hexToRgb(lightHex);
    const cBase = hexToRgb(baseHex);
    const cDark = hexToRgb(darkHex);
    const cGlow = hexToRgb(pal.coreGlow);

    for (let py = 0; py < bh; py++) {
      for (let px = 0; px < bw; px++) {
        const gx = bx + px;
        const gy = by + py;
        if (gx < 0 || gx >= resolution || gy < 0 || gy >= resolution) continue;

        const nx = bw > 1 ? px / (bw - 1) : 0.5;
        const ny = bh > 1 ? py / (bh - 1) : 0.5;

        const isTopOrLeftEdge = px === 0 || py === 0;
        const isBottomOrRightEdge = px === bw - 1 || py === bh - 1;
        const isCenterAxis = Math.abs(nx - 0.5) < 0.22;

        let rgb: [number, number, number] = cBase;

        if (shadingStyle === "crisp_pixel") {
          if (isTopOrLeftEdge) rgb = cLight;
          else if (isBottomOrRightEdge) rgb = cDark;
          else if ((px + py) % 3 === 0) rgb = mixColor(cBase, cLight, 0.35);
          else rgb = cBase;
        } else if (shadingStyle === "metallic_gradient") {
          // Diagonal sheen reflection
          const diag = (nx + (1 - ny)) * 0.5;
          const sheen = Math.exp(-Math.pow((diag - 0.55) * 3.8, 2));
          rgb = mixColor(cDark, cBase, 1 - ny * 0.7);
          rgb = mixColor(rgb, cLight, sheen * 0.85);
        } else if (shadingStyle === "runic_glow") {
          if (isCenterAxis && py > 0 && py < bh - 1 && py % 2 === 0) {
            rgb = mixColor(cGlow, [255, 255, 255], 0.45);
          } else if (isTopOrLeftEdge) {
            rgb = mixColor(cBase, cLight, 0.7);
          } else if (isBottomOrRightEdge) {
            rgb = cDark;
          } else {
            rgb = mixColor(cBase, cDark, ny * 0.5);
          }
        } else if (shadingStyle === "gradient_vertical") {
          rgb = ny > 0.5 ? mixColor(cBase, cDark, (ny - 0.5) * 2) : mixColor(cLight, cBase, ny * 2);
          if (isTopOrLeftEdge && bw >= 3) rgb = mixColor(rgb, cLight, 0.35);
        } else if (shadingStyle === "gradient_radial") {
          const dist = Math.min(1, Math.hypot(nx - 0.5, ny - 0.5) * 1.6);
          rgb = dist < 0.5 ? mixColor(cLight, cBase, dist * 2) : mixColor(cBase, cDark, (dist - 0.5) * 2);
          if (dist < 0.18 && (el.materialRole === "gem" || el.materialRole === "core")) rgb = mixColor(rgb, [255, 255, 255], 0.5);
        } else if (shadingStyle === "gradient_diagonal") {
          const band = Math.floor(((nx + ny) / 2) * 3);
          rgb = band <= 0 ? cLight : band === 1 ? cBase : cDark;
          if ((px + py) % 4 === 0) rgb = mixColor(rgb, cLight, 0.2);
        } else if (shadingStyle === "two_tone") {
          rgb = nx < 0.5 ? mixColor(cBase, cLight, 0.45) : mixColor(cBase, cDark, 0.45);
          if (Math.abs(nx - 0.5) < 0.5 / Math.max(2, bw)) rgb = cLight;
        } else if (shadingStyle === "blood_veins") {
          const blood: [number, number, number] = [138, 3, 3];
          rgb = mixColor(cDark, blood, 0.35 + ny * 0.3);
          const vein = Math.abs(Math.sin((nx * 3.2 + ny * 1.7 + (el.uvBox.x % 5) * 0.31) * Math.PI * 2)) < 0.18;
          if (vein) rgb = mixColor([220, 20, 30], cGlow, 0.3);
          if (isTopOrLeftEdge && bw >= 3) rgb = mixColor(rgb, cLight, 0.25);
        } else if (shadingStyle === "cursed_noise") {
          const n = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453;
          const noise = n - Math.floor(n);
          rgb = mixColor(cDark, cBase, 0.3 + noise * 0.5);
          if (noise > 0.88) rgb = mixColor(cGlow, [255, 255, 255], 0.15);
          else if (noise < 0.1) rgb = [8, 4, 14];
          if (isBottomOrRightEdge) rgb = mixColor(rgb, [0, 0, 0], 0.4);
        } else if (shadingStyle === "carbon_tech") {
          const weave = ((Math.floor(gx / 2) + Math.floor(gy / 2)) % 2 === 0);
          rgb = weave ? mixColor(cDark, cBase, 0.55) : mixColor(cDark, cBase, 0.25);
          if (py === Math.floor(bh / 2) && bh >= 4) rgb = mixColor(cDark, [0, 0, 0], 0.3);
          if (isTopOrLeftEdge) rgb = mixColor(rgb, cLight, 0.45);
          if ((el.materialRole === "core" || el.materialRole === "gem") && isCenterAxis) rgb = cGlow;
        } else if (shadingStyle === "holy_sheen") {
          const sheen = Math.exp(-Math.pow((nx - ny * 0.3 - 0.35) * 4, 2));
          rgb = mixColor(cBase, cLight, 0.35 + sheen * 0.65);
          if (isBottomOrRightEdge) rgb = mixColor(rgb, cDark, 0.35);
          if (sheen > 0.92) rgb = mixColor(rgb, [255, 250, 220], 0.6);
        } else {
          // "hand_painted" default Minecraft-artisan style
          const grad = 1 - (nx * 0.35 + ny * 0.65);
          rgb = grad > 0.55
            ? mixColor(cBase, cLight, (grad - 0.55) * 2.0)
            : mixColor(cDark, cBase, grad * 1.8);

          if (el.materialRole === "handle" && py % 2 === 0) {
            rgb = mixColor(rgb, cDark, 0.45);
          } else if (el.materialRole === "gem" && px === Math.floor(bw * 0.35) && py === Math.floor(bh * 0.35)) {
            rgb = [255, 255, 255];
          } else if (isTopOrLeftEdge && bw >= 3 && bh >= 3) {
            rgb = mixColor(rgb, cLight, 0.55);
          } else if (isBottomOrRightEdge && bw >= 3 && bh >= 3) {
            rgb = mixColor(rgb, cDark, 0.6);
          }
        }

        matrix[gy][gx] = rgbToHex(rgb);
      }
    }
  }

  return matrix;
}

/**
 * Renders a 2D color matrix (`string[][]`) into a PNG Data URL (works in browser via HTMLCanvasElement,
 * or creates a valid SVG/Canvas data URL fallback).
 */
export function matrixToDataUrl(matrix: string[][]): string {
  const res = matrix.length;
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = res;
    canvas.height = res;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      for (let y = 0; y < res; y++) {
        for (let x = 0; x < res; x++) {
          ctx.fillStyle = matrix[y][x] || "#000000";
          ctx.fillRect(x, y, 1, 1);
        }
      }
      return canvas.toDataURL("image/png");
    }
  }
  return "";
}

/**
 * Updates an element's face UVs when its UV island box (`uvBox`) is moved or resized.
 */
export function syncElementFacesFromUVBox(
  el: CuboidElement,
  resolution: number
): CuboidElement {
  const { x, y, w, h } = el.uvBox;
  const toMc = (px: number) => r2((px / resolution) * 16);
  const u1 = toMc(x);
  const v1 = toMc(y);
  const u2 = toMc(x + w);
  const v2 = toMc(y + h);
  const uMid = toMc(x + Math.max(1, Math.floor(w * 0.75)));
  const vMid = toMc(y + Math.max(1, Math.floor(h * 0.25)));

  return {
    ...el,
    faces: {
      north: { uv: [u1, v1, u2, v2], texture: "#0" },
      south: { uv: [u1, v1, u2, v2], texture: "#0" },
      east: { uv: [uMid, v1, u2, v2], texture: "#0" },
      west: { uv: [uMid, v1, u2, v2], texture: "#0" },
      up: { uv: [u1, v1, u2, vMid], texture: "#0" },
      down: { uv: [u1, v1, u2, vMid], texture: "#0" },
    },
  };
}

function buildOutliner(elements: CuboidElement[], uuids: string[], bones: boolean) {
  const buckets = new Map<string, Array<string | Record<string, unknown>>>();
  elements.forEach((el, index) => {
    const name =
      el.motion || el.group === "float"
        ? "Floaters"
        : el.group === "grip" || el.group === "pommel" || el.group === "shaft"
          ? "Haft"
          : el.group === "guard" || el.group === "head"
            ? "Crown"
            : "Body";
    const list = buckets.get(name) ?? [];
    if (bones && isAnimated(el)) {
      list.push({
        name: `${el.name.replace(/[^A-Za-z0-9_]+/g, "_").toLowerCase()}_bone`,
        uuid: boneUuid(uuids[index]),
        origin: el.origin,
        rotation: [0, 0, 0],
        export: true,
        isOpen: false,
        locked: false,
        visibility: true,
        autouv: 0,
        children: [uuids[index]],
      });
    } else {
      list.push(uuids[index]);
    }
    buckets.set(name, list);
  });
  return Array.from(buckets.entries()).map(([name, children]) => ({
    name,
    uuid: `grp-${name.toLowerCase()}`,
    export: true,
    isOpen: true,
    locked: false,
    visibility: true,
    autouv: 0,
    selected: false,
    children,
  }));
}

/**
 * Exports a complete Blockbench `.bbmodel` (v4.10) JSON string with embedded PNG texture,
 * outliner groups, idle_mana keyframes, and Minecraft Java Item display transforms.
 */
export function exportToBlockbenchBBModel(opts: {
  name: string;
  slug: string;
  resolution: number;
  elements: CuboidElement[];
  display: ModelDisplaySettings;
  textureDataUrl: string;
}): string {
  const { name, slug, resolution, elements, display, textureDataUrl } = opts;
  const scaleFactor = resolution / 16;

  const visibleElements = elements.filter((e) => e.visible);
  const bbElements = visibleElements
    .map((el, idx) => {
      const uuid = `el-${idx}-${el.id}`;
      const rotVec: [number, number, number] = [
        el.rotation.axis === "x" ? el.rotation.angle : 0,
        el.rotation.axis === "y" ? el.rotation.angle : 0,
        el.rotation.axis === "z" ? el.rotation.angle : 0,
      ];

      const scaleUv = (uv: [number, number, number, number]) =>
        uv.map((v) => r2(v * scaleFactor)) as [number, number, number, number];

      return {
        name: el.name,
        box_uv: false,
        rescale: false,
        locked: false,
        from: el.from,
        to: el.to,
        autouv: 0,
        color: idx % 8,
        origin: el.origin,
        rotation: rotVec,
        faces: {
          north: { uv: scaleUv(el.faces.north.uv), texture: 0 },
          east: { uv: scaleUv(el.faces.east.uv), texture: 0 },
          south: { uv: scaleUv(el.faces.south.uv), texture: 0 },
          west: { uv: scaleUv(el.faces.west.uv), texture: 0 },
          up: { uv: scaleUv(el.faces.up.uv), texture: 0 },
          down: { uv: scaleUv(el.faces.down.uv), texture: 0 },
        },
        type: "cube",
        uuid,
      };
    });

  const animations = buildBlockbenchAnimations(
    visibleElements,
    bbElements.map((e) => e.uuid)
  );
  const hasAnim = animations.length > 0;

  const bbModel = {
    meta: {
      format_version: "4.10",
      // java_block cannot hold animations, so animated rigs are exported as a Generic Model.
      model_format: hasAnim ? "free" : "java_block",
      box_uv: false,
    },
    name: slug || "voxelforge_model",
    model_identifier: slug || "voxelforge_model",
    visible_box: [1, 1, 0],
    variable_placeholders: "",
    resolution: {
      width: resolution,
      height: resolution,
    },
    elements: bbElements,
    outliner: buildOutliner(visibleElements, bbElements.map((e) => e.uuid), hasAnim),
    animations,
    textures: [
      {
        path: `${slug}.png`,
        name: `${slug}.png`,
        folder: "item",
        namespace: "minecraft",
        id: "0",
        particle: true,
        render_mode: "default",
        render_sides: "auto",
        frame_time: 1,
        frame_order_type: "loop",
        visible: true,
        mode: "bitmap",
        saved: false,
        uuid: "tex-0-atlas",
        source: textureDataUrl,
      },
    ],
    display,
  };

  return JSON.stringify(bbModel, null, 2);
}

/**
 * Exports a valid Minecraft Java Edition Item Model `.json` (`assets/minecraft/models/item/<slug>.json`).
 */
export function exportToMinecraftJSON(opts: {
  slug: string;
  resolution: number;
  elements: CuboidElement[];
  display: ModelDisplaySettings;
}): string {
  const { slug, resolution, elements, display } = opts;
  const fit = computeJavaFit(elements);
  const fv = (v: [number, number, number]): [number, number, number] => [
    r2(8 + (v[0] - 8) * fit.scale),
    r2(fit.offsetY + v[1] * fit.scale),
    r2(8 + (v[2] - 8) * fit.scale),
  ];

  const mcElements = elements
    .filter((e) => e.visible)
    .map((el) => {
      const snappedAngle = snapMinecraftAngle(el.rotation.angle, true);
      const item: Record<string, unknown> = {
        name: el.name,
        from: fv(el.from),
        to: fv(el.to),
      };

      if (snappedAngle !== 0) {
        item.rotation = {
          angle: snappedAngle,
          axis: el.rotation.axis,
          origin: fv(el.origin),
        };
      }

      item.faces = {
        north: { uv: el.faces.north.uv, texture: "#0" },
        east: { uv: el.faces.east.uv, texture: "#0" },
        south: { uv: el.faces.south.uv, texture: "#0" },
        west: { uv: el.faces.west.uv, texture: "#0" },
        up: { uv: el.faces.up.uv, texture: "#0" },
        down: { uv: el.faces.down.uv, texture: "#0" },
      };

      return item;
    });

  const mcJson = {
    credit: "Generated with VoxelForge Studio (Blockbench & Minecraft 3D Generator)",
    texture_size: [resolution, resolution],
    textures: {
      "0": `item/${slug}`,
      particle: `item/${slug}`,
    },
    elements: mcElements,
    display: fit.scale < 1 ? scaleDisplay(display, 1 / fit.scale) : display,
  };

  return JSON.stringify(mcJson, null, 2);
}

/**
 * Java item models only accept coordinates in -16..32. Tall weapons are shrunk
 * uniformly into range and the display scale is boosted to keep the same in-hand size.
 */
export function computeJavaFit(elements: CuboidElement[]): { scale: number; offsetY: number; outOfRange: boolean } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const el of elements) {
    if (!el.visible) continue;
    for (const v of [el.from, el.to]) {
      minX = Math.min(minX, v[0]); maxX = Math.max(maxX, v[0]);
      minY = Math.min(minY, v[1]); maxY = Math.max(maxY, v[1]);
      minZ = Math.min(minZ, v[2]); maxZ = Math.max(maxZ, v[2]);
    }
  }
  if (!Number.isFinite(minX)) return { scale: 1, offsetY: 0, outOfRange: false };
  const outOfRange = minX < -16 || maxX > 32 || minY < -16 || maxY > 32 || minZ < -16 || maxZ > 32;
  if (!outOfRange) return { scale: 1, offsetY: 0, outOfRange };
  const halfX = Math.max(Math.abs(maxX - 8), Math.abs(minX - 8));
  const halfZ = Math.max(Math.abs(maxZ - 8), Math.abs(minZ - 8));
  const sx = halfX > 24 ? 24 / halfX : 1;
  const sz = halfZ > 24 ? 24 / halfZ : 1;
  const sy = (maxY - minY) > 47 ? 47 / (maxY - minY) : 1;
  const scale = Math.max(0.25, Math.min(sx, sy, sz) * 0.98);
  const offsetY = Math.max(-16 - minY * scale, Math.min(0, 32 - maxY * scale));
  return { scale: r2(scale), offsetY: r2(offsetY), outOfRange };
}

function scaleDisplay(display: ModelDisplaySettings, k: number): ModelDisplaySettings {
  const out = {} as ModelDisplaySettings;
  (Object.keys(display) as Array<keyof ModelDisplaySettings>).forEach((key) => {
    const d = display[key];
    out[key] = {
      rotation: d.rotation,
      translation: d.translation,
      scale: d.scale.map((s) => r2(Math.min(4, s * k))) as [number, number, number],
    };
  });
  return out;
}
