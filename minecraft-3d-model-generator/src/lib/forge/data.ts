import type { Palette } from "./types";

export interface Theme {
  id: string;
  name: string;
  en: string;
  palette: Palette;
}

/** 配色テーマ（地・陰・金具・発光） */
export const THEMES: Theme[] = [
  { id: "steel", name: "玉鋼", en: "STEEL", palette: { base: "#C9CED6", shade: "#4B515A", metal: "#B8912F", glow: "#D9482B" } },
  { id: "iron", name: "黒鉄", en: "IRON", palette: { base: "#8D9196", shade: "#2E3134", metal: "#6F5A3A", glow: "#FF8A3D" } },
  { id: "bronze", name: "青銅", en: "BRONZE", palette: { base: "#B98A4E", shade: "#3E2C1B", metal: "#4F8C7A", glow: "#F3C35B" } },
  { id: "wood", name: "檀木", en: "WOOD", palette: { base: "#8A5A34", shade: "#3A2517", metal: "#C9B27A", glow: "#9BE86B" } },
  { id: "arcane", name: "秘術", en: "ARCANE", palette: { base: "#6B4A2E", shade: "#2A1C12", metal: "#B8912F", glow: "#62B6FF" } },
  { id: "grimoire", name: "禁書", en: "GRIMOIRE", palette: { base: "#5B1F2B", shade: "#26090F", metal: "#C9A24A", glow: "#FF5D8F" } },
  { id: "celestial", name: "天球", en: "CELESTIAL", palette: { base: "#EFE9DD", shade: "#22405E", metal: "#B8912F", glow: "#7FD6FF" } },
  { id: "void", name: "虚空", en: "VOID", palette: { base: "#3A3448", shade: "#12101A", metal: "#8C7BB8", glow: "#B266FF" } },
  { id: "royal", name: "王家", en: "ROYAL", palette: { base: "#2C4A8C", shade: "#16254A", metal: "#D8B04A", glow: "#FFF1B5" } },
  { id: "samurai", name: "緋縅", en: "SAMURAI", palette: { base: "#B3261E", shade: "#2B1210", metal: "#1D1B19", glow: "#F0C24A" } },
  { id: "gold", name: "黄金", en: "GOLD", palette: { base: "#E3B341", shade: "#7A5314", metal: "#F6E3A1", glow: "#E8283F" } },
  { id: "inferno", name: "煉獄", en: "INFERNO", palette: { base: "#3A1A12", shade: "#140806", metal: "#C46A1E", glow: "#FF6A1F" } },
  { id: "glacier", name: "氷河", en: "GLACIER", palette: { base: "#CFEFFF", shade: "#3C6D8F", metal: "#E9F7FF", glow: "#6FE0FF" } },
  { id: "storm", name: "迅雷", en: "STORM", palette: { base: "#3D4660", shade: "#161A26", metal: "#C9CED6", glow: "#FFE45C" } },
  { id: "sakura", name: "桜花", en: "SAKURA", palette: { base: "#F6D6DF", shade: "#6B3444", metal: "#2A2226", glow: "#FF7FAA" } },
  { id: "jade", name: "翡翠", en: "JADE", palette: { base: "#4FA37E", shade: "#173D2D", metal: "#D9C27A", glow: "#B8FFD9" } },
  { id: "blood", name: "血盟", en: "BLOOD", palette: { base: "#6E0F14", shade: "#1C0305", metal: "#8A8F96", glow: "#FF2B3A" } },
  { id: "obsidian", name: "黒曜", en: "OBSIDIAN", palette: { base: "#23202A", shade: "#0B0A0E", metal: "#5E4B8C", glow: "#FF4DD2" } },
  { id: "verdant", name: "森羅", en: "VERDANT", palette: { base: "#5B7A2E", shade: "#1F2A10", metal: "#8A5A34", glow: "#D6FF6B" } },
  { id: "bone", name: "骨董", en: "BONE", palette: { base: "#E2D6BC", shade: "#6B5B45", metal: "#3C3630", glow: "#5CFFC8" } },
];

export const themeById = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0];

export interface PresetEffect {
  amount?: number;
  size?: number;
  color?: string;
}

export interface Preset {
  id: string;
  name: string;
  kind: string;
  style: number;
  theme: string;
  length?: number;
  width?: number;
  detail?: number;
  runes?: number;
  tier?: number;
  overdrive?: boolean;
  form?: number;
  mode?: string;
  effects: Record<string, PresetEffect>;
  caption: string;
}

export interface SetDef {
  id: string;
  name: string;
  en: string;
  theme: string;
  tier: number;
  kinds: string[];
  effects: Record<string, PresetEffect>;
  caption: string;
}

/** 一式（同一テーマで揃えた別型のモデル群） */
export const SETS: SetDef[] = [
  {
    id: "s-enki",
    name: "炎鬼一式",
    en: "ONI OF EMBERS",
    theme: "inferno",
    tier: 3,
    kinds: ["sword", "axe", "shield", "armor"],
    effects: { flame: { amount: 6 }, smoke: { amount: 3, color: "#2A1410" } },
    caption: "焔を吐く鬼の武具。刃も兜も同じ炉で打たれている。",
  },
  {
    id: "s-souhyo",
    name: "蒼氷一式",
    en: "AZURE FROST",
    theme: "glacier",
    tier: 4,
    kinds: ["staff", "tome", "sigil", "crown"],
    effects: { frost: { amount: 7 }, aurora: { amount: 4, color: "#8FE3FF" } },
    caption: "氷の書庫に納められた、霜を統べる魔導の一揃い。",
  },
  {
    id: "s-ouke",
    name: "王家一式",
    en: "ROYAL REGALIA",
    theme: "royal",
    tier: 5,
    kinds: ["sword", "shield", "crown", "armor"],
    effects: { halo: { amount: 5 }, stars: { amount: 4, color: "#FFF1B5" }, pillar: { amount: 3 } },
    caption: "戴冠の儀に並べられる四つの宝器。",
  },
  {
    id: "s-kokuu",
    name: "虚無一式",
    en: "VOIDBOUND",
    theme: "void",
    tier: 4,
    kinds: ["sword", "relic", "sigil", "tome"],
    effects: { void: { amount: 6 }, chains: { amount: 4, color: "#6F6A80" }, shatter: { amount: 5, color: "#6B5C8C" } },
    caption: "裂け目の向こうから引き上げられた、名を持たぬ器たち。",
  },
  {
    id: "s-shinra",
    name: "森羅一式",
    en: "VERDANT WILD",
    theme: "verdant",
    tier: 2,
    kinds: ["bow", "spear", "armor", "shield"],
    effects: { leaves: { amount: 7 }, sakura: { amount: 4, color: "#D6FF6B" } },
    caption: "森に棲む狩人の装い。木の葉が常に巻いている。",
  },
  {
    id: "s-raijin",
    name: "雷神一式",
    en: "THUNDER GOD",
    theme: "storm",
    tier: 5,
    kinds: ["axe", "spear", "crown", "relic"],
    effects: { thunder: { amount: 7 }, vortex: { amount: 4, color: "#FFE45C" } },
    caption: "雲の上で鍛えられ、常に放電を纏う一揃い。",
  },
];
export const setById = (id: string) => SETS.find((s) => s.id === id);

/** 型録（キュレーション済みの完成形） */
export const PRESETS: Preset[] = [
  { id: "p-homura", name: "焔の大太刀", kind: "sword", style: 1, theme: "inferno", length: 16, width: 4, detail: 2, runes: 5, effects: { flame: { amount: 6 }, slash: { amount: 4, color: "#FFB27A" } }, caption: "刃文に火を宿す反りの深い一振り" },
  { id: "p-seiken", name: "聖剣アストラ", kind: "sword", style: 0, theme: "royal", length: 14, width: 4, detail: 3, runes: 6, effects: { halo: { amount: 6 }, pillar: { amount: 4 }, wings: { amount: 6, size: 1.1 } }, caption: "光輪と翼を背負う王家の直剣" },
  { id: "p-raijin", name: "雷神の戦斧", kind: "axe", style: 1, theme: "storm", length: 15, width: 5, detail: 2, runes: 2, effects: { thunder: { amount: 6 }, stars: { amount: 3, color: "#FFF6B0" } }, caption: "両刃に放電を纏う迅雷の斧" },
  { id: "p-hyoso", name: "氷霜の杖", kind: "staff", style: 2, theme: "glacier", length: 15, width: 4, detail: 3, runes: 4, effects: { frost: { amount: 7 }, groundsigil: { amount: 4, color: "#8FE3FF" } }, caption: "晶の杖首から雪が降りしきる" },
  { id: "p-kokuu", name: "虚空の聖遺物", kind: "relic", style: 2, theme: "void", length: 8, width: 3, detail: 3, runes: 6, effects: { void: { amount: 6 }, stars: { amount: 5, color: "#D8B6FF" }, chains: { amount: 3, color: "#6F6A80" } }, caption: "天球儀の奥で裂け目が脈打つ" },
  { id: "p-ouka", name: "桜花の魔法陣", kind: "sigil", style: 0, theme: "sakura", length: 10, width: 1, detail: 2, runes: 6, effects: { sakura: { amount: 8 }, aurora: { amount: 3, color: "#FFD1E0" } }, caption: "花吹雪の中に立つ垂直陣" },
  { id: "p-kin", name: "黄金の宝冠", kind: "crown", style: 1, theme: "gold", length: 6, width: 5, detail: 3, runes: 5, effects: { satellites: { amount: 6, color: "#FF3355" }, stars: { amount: 4, color: "#FFF4C2" } }, caption: "額に大石を戴き、宝石が巡る" },
  { id: "p-kinsho", name: "封印の禁書", kind: "tome", style: 2, theme: "grimoire", length: 11, width: 4, detail: 3, runes: 5, effects: { chains: { amount: 5 }, smoke: { amount: 4, color: "#2B1B24" }, runering: { amount: 6, color: "#FF5D8F" } }, caption: "鎖に縛られ、禁じられた眼がひらく" },
  { id: "p-hisui", name: "翡翠の長弓", kind: "bow", style: 2, theme: "jade", length: 19, width: 3, detail: 2, runes: 4, effects: { leaves: { amount: 7 }, aurora: { amount: 4 } }, caption: "翼羽に森の旋風を宿す" },
  { id: "p-kaitei", name: "海底の三叉", kind: "spear", style: 1, theme: "bronze", length: 19, width: 3, detail: 2, runes: 2, effects: { bubbles: { amount: 8 }, vortex: { amount: 4, color: "#4DD2FF" } }, caption: "渦と気泡を従える海神の槍" },
  { id: "p-hiodoshi", name: "緋縅の兜", kind: "armor", style: 0, theme: "samurai", length: 10, width: 4, detail: 3, runes: 0, effects: { flame: { amount: 3, color: "#FF4A2F" }, runering: { amount: 5, color: "#F0C24A" } }, caption: "前立ての月と角を掲げる大将の兜" },
  { id: "p-shinden", name: "神殿の塔盾", kind: "shield", style: 2, theme: "royal", length: 16, width: 6, detail: 2, runes: 2, effects: { halo: { amount: 5 }, pillar: { amount: 3, color: "#FFF1B5" } }, caption: "聖柱を背負う不落の大盾" },
  { id: "p-dokuya", name: "瘴気の鉞", kind: "axe", style: 2, theme: "verdant", length: 16, width: 6, detail: 2, runes: 1, effects: { miasma: { amount: 8 }, smoke: { amount: 3, color: "#2F3B1A" } }, caption: "毒の靄に沈む沼地の処刑斧" },
  { id: "p-kessho", name: "血晶の大剣", kind: "sword", style: 2, theme: "blood", length: 15, width: 5, detail: 3, runes: 8, effects: { shatter: { amount: 7, color: "#B3121E" }, void: { amount: 3, color: "#FF2B3A" } }, caption: "剥がれ落ちる血晶が漂う" },
  { id: "p-kokuyo", name: "黒曜の八面晶", kind: "relic", style: 1, theme: "obsidian", length: 9, width: 4, detail: 2, runes: 4, effects: { satellites: { amount: 6, color: "#FF4DD2" }, vortex: { amount: 5, color: "#9A5CFF" } }, caption: "渦の中心に浮かぶ黒い結晶" },
  { id: "p-tenkyu", name: "天球の三重陣", kind: "sigil", style: 2, theme: "celestial", length: 11, width: 1, detail: 3, runes: 8, effects: { stars: { amount: 7 }, groundsigil: { amount: 5, color: "#7FD6FF" }, halo: { amount: 4 } }, caption: "三つの環が異なる速さで巡る" },
  {
    id: "p-gen-ei",
    name: "幻妖の太刀",
    kind: "sword",
    style: 1,
    theme: "obsidian",
    length: 16,
    width: 4,
    detail: 3,
    runes: 3,
    tier: 4,
    effects: { phantoms: { amount: 7, size: 1.15 }, miasma: { amount: 3, color: "#5B4A7A" }, slash: { amount: 5, color: "#C9E4FF" } },
    caption: "一撃ごとに分身が残り、遅れて同じ刃を振る",
  },
  {
    id: "p-magen",
    name: "無限の幻影陣",
    kind: "sigil",
    style: 1,
    theme: "celestial",
    length: 11,
    width: 1,
    detail: 3,
    runes: 8,
    tier: 5,
    overdrive: true,
    effects: { phantoms: { amount: 9 }, stars: { amount: 6 }, groundsigil: { amount: 5 } },
    caption: "限界を破った陣が、同じ術式をいくつも重ねて回す",
  },
  {
    id: "p-gouka",
    name: "業火の解体鋸",
    kind: "chainsaw",
    style: 1,
    theme: "inferno",
    length: 11,
    width: 6,
    detail: 3,
    runes: 2,
    tier: 3,
    mode: "overload",
    effects: { flame: { amount: 5 }, smoke: { amount: 4, color: "#241512" }, gears: { amount: 5 } },
    caption: "過負荷の機関が唸り、刃鎖が火を噴く",
  },
  {
    id: "p-jidou",
    name: "極光の磁道砲",
    kind: "railgun",
    style: 1,
    theme: "storm",
    length: 16,
    width: 3,
    detail: 3,
    runes: 5,
    tier: 5,
    overdrive: true,
    effects: { thunder: { amount: 6 }, aurora: { amount: 4, color: "#9FD8FF" }, gears: { amount: 3, color: "#C9CED6" } },
    caption: "六つの加速環が順に点火する限界突破の砲",
  },
  {
    id: "p-chinure",
    name: "血啜りの大鎌",
    kind: "bloodscythe",
    style: 2,
    theme: "blood",
    length: 16,
    width: 6,
    detail: 3,
    runes: 4,
    tier: 4,
    form: 2,
    effects: { bloodmist: { amount: 7 }, chains: { amount: 3, color: "#6F3A40" }, phantoms: { amount: 4, color: "#FF5A66" } },
    caption: "霧の中で分身とともに刈り取る血帝の鎌",
  },
  {
    id: "p-gisou",
    name: "儀仗の宝槍",
    kind: "ornspear",
    style: 2,
    theme: "gold",
    length: 18,
    width: 5,
    detail: 3,
    runes: 8,
    tier: 5,
    mode: "channel",
    effects: { halo: { amount: 5 }, sakura: { amount: 5, color: "#FFE9A8" }, satellites: { amount: 4 } },
    caption: "幡と鈴と飾環。祭礼のためだけに磨かれた槍",
  },
];
