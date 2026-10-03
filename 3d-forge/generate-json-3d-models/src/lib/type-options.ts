import { PALETTES, type ConcretePalette, type ModelKind } from "./model-types";
import type { Blueprint } from "./prompt";

/** The studio now uses an explicit type/configurator instead of free-form prompt tags. */
export type ConfiguredKind = ModelKind | "hammer" | "scythe";
export interface PromptTerm {
  kind: ConfiguredKind;
  material: Blueprint["material"];
  motif: Blueprint["profile"];
  style: Blueprint["style"];
  length: number;
  width: number;
  thickness: number;
  scale: number;
  glow: boolean;
  spikes: boolean;
  colors: ConcretePalette[];
  uvMode: "tile" | "atlas";
}
export interface TypeOption<T extends string> { id: T; label: string; hint?: string }

export const KIND_OPTIONS: TypeOption<ConfiguredKind>[] = [
  { id: "sword", label: "剣", hint: "近接武器の中心。片刃・両刃を問わない" },
  { id: "pickaxe", label: "ピッケル", hint: "採掘の代表的な両側成形ツール" },
  { id: "axe", label: "斧", hint: "伐採・近接向けの積層片刃" },
  { id: "hammer", label: "ハンマー", hint: "大きく打つ打撃系の重戦鎚" },
  { id: "scythe", label: "鎌", hint: "先細の長柄と横向きの刃" },
  { id: "chainsaw", label: "チェーンソー", hint: "動力で回る刃の切断工具" },
  { id: "drill", label: "ドリル", hint: "螺旋ビットで穴を開ける工具" },
  { id: "nailgun", label: "ネイルガン", hint: "釘を撃ち出す作業工具" },
  { id: "circularsaw", label: "丸鋸", hint: "円盤刃の切断工具" },
  { id: "flamethrower", label: "火炎放射器", hint: "火を吹く重火器" },
  { id: "jackhammer", label: "ジャックハンマー", hint: "圧縮空気で砕く破砕工具" },
  { id: "spell_sword", label: "魔法の剣", hint: "魔力を宿した光の刃" },
  { id: "enchanted_axe", label: "魔法の斧", hint: "魔力の結晶を組み込んだ斧" },
  { id: "cursed_blade", label: "呪いの刃", hint: "闇の力が脈打つ魔剣" },
  { id: "soul_reaper", label: "魂刈り鎌", hint: "死神の持つ巨大な鎌" },
  { id: "shadow_dagger", label: "影の短剣", hint: "闇に溶け込む短い刃" },
  { id: "blood_sword", label: "血の剣", hint: "血潮に染まった深紅の剣" },
  { id: "blood_axe", label: "血の斧", hint: "血痕が残る戦斧" },
  { id: "grimoire", label: "魔導書", hint: "魔力の書物・知識の遺産" },
  { id: "magic_circle", label: "魔法陣", hint: "大地に描かれた光の紋様" },
  { id: "assault_rifle", label: "アサルトライフル", hint: "現代の自動小銃" },
  { id: "sniper_rifle", label: "スナイパーライフル", hint: "精密射撃用の狙撃銃" },
  { id: "pistol", label: "ピストル", hint: "片手で扱う拳銃" },
  { id: "shotgun", label: "ショットガン", hint: "散弾を撃つ近距離武器" },
  { id: "railgun", label: "レールガン", hint: "電磁加速の未来兵器" },
  { id: "relic", label: "レリック", hint: "古代文明の神秘的な遺物" },
  { id: "spear", label: "豪華スピア", hint: "装飾を極めた華麗な槍" },
  { id: "mace", label: "メイス", hint: "重厚な撃撃武器" },
  { id: "shovel", label: "シャベル", hint: "土・砂利を刻む掘削ツール" },
  { id: "bow", label: "弓", hint: "引き絞り3段階の手持ち道具" },
  { id: "staff", label: "杖", hint: "オーブ・宝石を先端に置く道具" },
  { id: "trident", label: "トライデント", hint: "海向けの三叉の投げ槍" },
  { id: "lantern", label: "ランタン", hint: "持ち歩き照明オブジェ" },
  { id: "crystal", label: "クリスタル", hint: "クリアな多面体・陳列向け" },
  { id: "chest", label: "宝箱", hint: "錠前つき収納ボックス" },
  { id: "mushroom", label: "キノコ", hint: "傘形の有機的オブジェ" },
  { id: "house", label: "家", hint: "ミニ構造物・依頼主の家" },
  { id: "tree", label: "木", hint: "幹と葉の自然オブジェ" },
  { id: "robot", label: "ロボット", hint: "機械の小型お供・自動人形" },
];
export const MATERIAL_OPTIONS: TypeOption<Blueprint["material"]>[] = [
  { id: "crystal", label: "結晶" },
  { id: "diamond", label: "ダイヤ" },
  { id: "iron", label: "鉄" },
  { id: "netherite", label: "ネザライト" },
  { id: "wood", label: "木" },
  { id: "gold", label: "金" },
  { id: "stone", label: "石" },
];
export const MOTIF_OPTIONS: TypeOption<Blueprint["profile"]>[] = [
  { id: "katana", label: "刀", hint: "反りのある片刃" },
  { id: "dagger", label: "短剣", hint: "短く鋭い" },
  { id: "broad", label: "大剣", hint: "幅のある両刃" },
  { id: "spear", label: "槍", hint: "先細の突き道具" },
  { id: "curved", label: "シャムシール", hint: "枕木のように反る一本刃" },
];
export const STYLE_OPTIONS: TypeOption<Blueprint["style"]>[] = [
  { id: "plain", label: "シンプル", hint: "装飾なし・実用快適" },
  { id: "ornate", label: "宝石・装飾", hint: "宝飾・金の縁取り" },
  { id: "ancient", label: "古代", hint: "刻印・風化石" },
  { id: "elven", label: "葉・自然", hint: "葉の装飾と流線" },
  { id: "mechanical", label: "機械", hint: "リベット・分割線" },
];
export const SLOT_OPTIONS = Array.from({ length: 8 }, (_, index) => index);
export const PALETTE_OPTION_LABELS: Record<ConcretePalette, string> = {
  violet: "紫",
  mint: "緑",
  ice: "青",
  warm: "金",
  diamond: "ダイヤ",
  iron: "無彩色",
  netherite: "黒",
};

export const DEFAULT_PROMPT_TERM: PromptTerm = {
  kind: "sword",
  material: "crystal",
  motif: "katana",
  style: "ornate",
  length: 1,
  width: 1,
  thickness: 1,
  scale: 1,
  glow: false,
  spikes: false,
  colors: ["violet"],
  uvMode: "tile",
};
export function optionLabel<T extends string>(options: TypeOption<T>[], value: T) {
  return options.find(option => option.id === value)?.label ?? "自動";
}
