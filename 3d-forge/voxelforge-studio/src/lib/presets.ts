import type { ModelKind, ModelSettings } from "./model-types";

export interface SkillPreset {
  id: string;
  label: string;
  description: string;
  kinds: ModelKind[] | "all";
  settings: Partial<ModelSettings>;
}

const WEAPONS: ModelKind[] = [
  "sword",
  "axe",
  "pickaxe",
  "runeblade",
  "cursedblade",
  "bloodblade",
  "spear",
  "mace",
];

/** One-click combinations of floaters, effects, forms and motions. */
export const SKILL_PRESETS: SkillPreset[] = [
  {
    id: "meteor",
    label: "メテオ召喚",
    description: "欠片が渦巻く詠唱",
    kinds: ["staff", "elderstaff", "bloodstaff", "grimoire"],
    settings: {
      floaters: "swarm",
      effect: "magic",
      animation: "spin",
      action: "cast",
    },
  },
  {
    id: "barrier",
    label: "結界展開",
    description: "解放形態で軌道を回すチャージ",
    kinds: ["staff", "elderstaff", "grimoire", "magiccircle", "shield"],
    settings: {
      floaters: "orbit",
      effect: "glow",
      animation: "spin",
      action: "charge",
      form: "released",
    },
  },
  {
    id: "stargaze",
    label: "星詠み",
    description: "浮かぶ結晶ときらめき",
    kinds: ["staff", "elderstaff", "bloodstaff", "grimoire"],
    settings: {
      floaters: "crystal",
      effect: "sparkle",
      animation: "float",
      action: "cast",
    },
  },
  {
    id: "unseal",
    label: "封印解除",
    description: "限界突破して解放",
    kinds: ["staff", "sword"],
    settings: {
      form: "released",
      limitBreak: true,
      effect: "magic",
      action: "charge",
    },
  },
  {
    id: "combo",
    label: "連撃",
    description: "斬撃モーション",
    kinds: WEAPONS,
    settings: { action: "slash", effect: "sparkle" },
  },
  {
    id: "flash",
    label: "一閃",
    description: "オーバードライブで刺突",
    kinds: WEAPONS,
    settings: { action: "thrust", effect: "glow", mode: "charged" },
  },
  {
    id: "whirlwind",
    label: "旋風斬り",
    description: "欠片を巻き込む回転斬り",
    kinds: WEAPONS,
    settings: { action: "spin", floaters: "swarm", animation: "spin" },
  },
  {
    id: "aegis",
    label: "聖盾",
    description: "光る軌道で守る",
    kinds: ["shield"],
    settings: { floaters: "orbit", effect: "glow", action: "charge" },
  },
  {
    id: "pulse",
    label: "脈動",
    description: "光りながら震える",
    kinds: ["block"],
    settings: { effect: "glow", action: "charge", mode: "charged" },
  },
  {
    id: "awaken",
    label: "覚醒",
    description: "+5・限界突破・マジック",
    kinds: "all",
    settings: { tier: 5, limitBreak: true, effect: "magic" },
  },
  {
    id: "gearup",
    label: "機駆動",
    description: "ギアを回して変形",
    kinds: ["drill", "cannon", "mechblade"],
    settings: {
      action: "transform",
      effect: "sparkle",
      animation: "spin",
      mode: "charged",
    },
  },
  {
    id: "fullpower",
    label: "全開出力",
    description: "限界突破して変形",
    kinds: ["drill", "mechblade"],
    settings: {
      action: "transform",
      mode: "charged",
      limitBreak: true,
      tier: 5,
      effect: "magic",
    },
  },
  {
    id: "overheat",
    label: "過熱",
    description: "火花と発光で回転斬り",
    kinds: ["drill", "cannon"],
    settings: {
      action: "spin",
      effect: "glow",
      floaters: "swarm",
      mode: "charged",
    },
  },
  {
    id: "treasure",
    label: "宝飾",
    description: "+3・輝く宝石の飾り",
    kinds: "all",
    settings: { tier: 3, effect: "sparkle", floaters: "crystal" },
  },
  {
    id: "burst",
    label: "アークバースト",
    description: "雷光を放つ射撃",
    kinds: ["pistol", "rifle", "railgun"],
    settings: { action: "shoot", effect: "electric", mode: "charged" },
  },
  {
    id: "reload",
    label: "リロード",
    description: "マガジンを引き抜いて装填",
    kinds: ["pistol", "rifle", "railgun"],
    settings: { action: "reload", effect: "none", mode: "normal" },
  },
  {
    id: "bloodmoon",
    label: "血月の儀式",
    description: "血晶と呪われた浮遊物",
    kinds: ["bloodblade", "bloodstaff", "cursedblade"],
    settings: {
      action: "ritual",
      effect: "blood",
      floaters: "swarm",
      animation: "pulse",
    },
  },
  {
    id: "summon",
    label: "天球召喚",
    description: "魔法陣と星の光",
    kinds: ["elderstaff", "grimoire", "magiccircle", "relic"],
    settings: {
      action: "summon",
      effect: "runes",
      floaters: "orbit",
      animation: "orbit",
    },
  },
  {
    id: "moonshot",
    label: "月光射",
    description: "光をためて弦を引く",
    kinds: ["bow"],
    settings: { action: "draw", effect: "frost" },
  },
  {
    id: "thunder",
    label: "雷槌",
    description: "雷光と振り下ろし",
    kinds: ["mace"],
    settings: { action: "slam", effect: "electric", mode: "charged" },
  },
  {
    id: "engine",
    label: "エンジン始動",
    description: "鋸歯を駆動する",
    kinds: ["chainsaw"],
    settings: { action: "rev", effect: "embers", mode: "charged" },
  },
];

export function presetsFor(kind: ModelKind): SkillPreset[] {
  return SKILL_PRESETS.filter(
    (preset) => preset.kinds === "all" || preset.kinds.includes(kind),
  );
}
