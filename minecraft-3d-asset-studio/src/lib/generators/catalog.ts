import { ActionId, ModelArchetype, ModelCategory } from "@/types/model";

export const CATALOG_GROUPS = ["刀剣", "打撃", "長柄", "機械", "近代銃器", "射撃", "魔法", "杖", "魔導書", "邪悪", "ブラッド", "レリック", "防具"] as const;
export type CatalogGroup = (typeof CATALOG_GROUPS)[number];

export interface ArchetypeInfo {
  type: ModelArchetype;
  labelJa: string;
  group: CatalogGroup;
  description: string;
  signature: ActionId[];
}

const GROUP_CATEGORY: Record<CatalogGroup, ModelCategory> = {
  刀剣: "sword",
  打撃: "sword",
  長柄: "sword",
  機械: "sword",
  近代銃器: "ranged",
  射撃: "ranged",
  魔法: "staff",
  杖: "staff",
  魔導書: "magic",
  邪悪: "sword",
  ブラッド: "sword",
  レリック: "relic",
  防具: "armor",
};

/** Single source of truth for every archetype: label, grouping, export category and signature moves. */
export const ARCHETYPE_CATALOG: ArchetypeInfo[] = [
  { type: "sword", labelJa: "星界の刀", group: "刀剣", description: "ルーン溝と浮遊結晶を持つ刀", signature: ["attack_slash", "combo_strike", "dash_strike"] },
  { type: "greatsword", labelJa: "天使の大剣", group: "刀剣", description: "翼の鍔と陽光紋の両手剣", signature: ["smash", "spin_attack", "ultimate_burst"] },
  { type: "rapier", labelJa: "氷牙の細剣", group: "刀剣", description: "雪結晶のカップガード", signature: ["attack_thrust", "dash_strike", "combo_strike"] },
  { type: "scythe", labelJa: "獄炎の大鎌", group: "刀剣", description: "骨の脊椎と溶岩刃", signature: ["spin_attack", "attack_slash", "summon"] },
  { type: "mace", labelJa: "溶鉄メイス", group: "打撃", description: "十二の鋭刺と溶鉄の心核", signature: ["smash", "uppercut", "spin_attack"] },
  { type: "morning_star", labelJa: "モーニングスター", group: "打撃", description: "鎖で振るう全方位棘鉄球", signature: ["spin_attack", "smash", "uppercut"] },
  { type: "holy_mace", labelJa: "聖翼の戦鎚", group: "打撃", description: "翼と光輪を持つ聖鎚", signature: ["smash", "relic_resonate", "ultimate_burst"] },
  { type: "spear", labelJa: "天穹の装飾槍", group: "長柄", description: "金細工・宝石六連・房飾り", signature: ["attack_thrust", "dash_strike", "spin_attack"] },
  { type: "halberd", labelJa: "王宮ハルバード", group: "長柄", description: "斧刃・鉤爪・宝飾帯の長柄", signature: ["attack_slash", "attack_thrust", "spin_attack"] },
  { type: "trident", labelJa: "海神の三叉槍", group: "長柄", description: "波飾りと真珠の三叉", signature: ["attack_thrust", "summon", "channel_beam"] },
  { type: "mech_hammer", labelJa: "歯車ハンマー", group: "機械", description: "ボイラー心核と駆動歯車", signature: ["smash", "overheat_vent", "uppercut"] },
  { type: "chainsaw", labelJa: "モーターチェーンソー", group: "機械", description: "二気筒エンジンと駆動歯", signature: ["saw_spin", "overheat_vent", "attack_slash"] },
  { type: "chainsaw_sword", labelJa: "チェーンソード", group: "機械", description: "両刃にチェーン歯が回る剣", signature: ["saw_spin", "combo_strike", "overheat_vent"] },
  { type: "drill_lance", labelJa: "ドリルランス", group: "機械", description: "螺旋ドリルと動力ハウジング", signature: ["drill_spin", "dash_strike", "overheat_vent"] },
  { type: "pile_bunker", labelJa: "パイルバンカー", group: "機械", description: "炸薬ドラムで杭を射出する籠手", signature: ["attack_thrust", "reload", "overheat_vent"] },
  { type: "gun", labelJa: "アサルトカービン", group: "近代銃器", description: "ホロサイトとエネルギーセル", signature: ["shoot", "reload", "guard_stance"] },
  { type: "smg", labelJa: "サブマシンガン", group: "近代銃器", description: "フォアグリップとライト搭載", signature: ["shoot", "reload", "dash_strike"] },
  { type: "shotgun", labelJa: "ポンプショットガン", group: "近代銃器", description: "チューブ弾倉とシェルホルダー", signature: ["shoot", "reload", "smash"] },
  { type: "sniper", labelJa: "狙撃ライフル", group: "近代銃器", description: "長銃身・サプレッサー・二脚", signature: ["shoot", "reload", "rail_charge"] },
  { type: "revolver", labelJa: "彫金リボルバー", group: "近代銃器", description: "金彫りの回転式拳銃", signature: ["shoot", "reload", "spin_attack"] },
  { type: "railgun", labelJa: "レールガン", group: "近代銃器", description: "誘導コイルとコンデンサ群", signature: ["rail_charge", "channel_beam", "overheat_vent"] },
  { type: "rail_cannon", labelJa: "重レールキャノン", group: "近代銃器", description: "七連コイルと冷却フィンの大砲", signature: ["rail_charge", "overheat_vent", "channel_beam"] },
  { type: "bow", labelJa: "森の長弓", group: "射撃", description: "分割リムと光る弦", signature: ["arrow_release", "spell_charge", "summon"] },
  { type: "compound_bow", labelJa: "コンパウンドボウ", group: "射撃", description: "カム・スタビライザー・照準器", signature: ["arrow_release", "rail_charge", "guard_stance"] },
  { type: "crossbow", labelJa: "クロスボウ", group: "射撃", description: "巻き上げ機と魔力ボルト", signature: ["arrow_release", "reload", "shoot"] },
  { type: "wand", labelJa: "星光のワンド", group: "魔法", description: "八芒星結晶の短杖", signature: ["spell_release", "spell_charge", "summon"] },
  { type: "crystal_scepter", labelJa: "結晶の王笏", group: "魔法", description: "巨大結晶と周回する小結晶", signature: ["spell_charge", "channel_beam", "summon"] },
  { type: "orb_catalyst", labelJa: "宝珠カタリスト", group: "魔法", description: "二重環に保持された魔力球", signature: ["channel_beam", "spell_release", "relic_resonate"] },
  { type: "staff", labelJa: "天球儀の杖", group: "杖", description: "回転する時の核", signature: ["spell_charge", "spell_release", "summon"] },
  { type: "wizard_staff", labelJa: "大魔導師の杖", group: "杖", description: "三叉の揺籃とマナ球", signature: ["spell_charge", "channel_beam", "summon"] },
  { type: "frost_staff", labelJa: "氷霜の杖", group: "杖", description: "放射状の氷棘と雪華板", signature: ["spell_charge", "spell_release", "channel_beam"] },
  { type: "druid_staff", labelJa: "ドルイドの杖", group: "杖", description: "捻れた幹・葉・蔦と種子", signature: ["summon", "spell_release", "relic_resonate"] },
  { type: "magic", labelJa: "秘術の魔導書", group: "魔導書", description: "開いた浮遊魔導書", signature: ["page_turn", "spell_release", "summon"] },
  { type: "necro_grimoire", labelJa: "死霊の魔導書", group: "魔導書", description: "髑髏と鎖で封じられた禁書", signature: ["page_turn", "blood_drain", "summon"] },
  { type: "celestial_codex", labelJa: "天文の写本", group: "魔導書", description: "星図ページと周回する惑星", signature: ["page_turn", "channel_beam", "relic_resonate"] },
  { type: "cursed_blade", labelJa: "呪詛の魔眼刃", group: "邪悪", description: "魔眼と封鎖鎖の刃", signature: ["summon", "blood_drain", "ultimate_burst"] },
  { type: "bone_scythe", labelJa: "骸骨の大鎌", group: "邪悪", description: "脊椎の柄と肋骨の刃", signature: ["spin_attack", "summon", "blood_drain"] },
  { type: "soul_lantern", labelJa: "魂喰らいのランタン", group: "邪悪", description: "魂を閉じ込めた吊り灯籠", signature: ["summon", "blood_drain", "relic_resonate"] },
  { type: "blood_blade", labelJa: "鮮血の刃", group: "ブラッド", description: "脈打つ心核と血の溝", signature: ["blood_drain", "combo_strike", "attack_slash"] },
  { type: "blood_scythe", labelJa: "血華の大鎌", group: "ブラッド", description: "血管が走る真紅の大鎌", signature: ["blood_drain", "spin_attack", "attack_slash"] },
  { type: "hemo_lance", labelJa: "ヘモランス", group: "ブラッド", description: "血球が漂う吸血の槍", signature: ["blood_drain", "attack_thrust", "dash_strike"] },
  { type: "holy_grail", labelJa: "聖杯", group: "レリック", description: "宝石と光輪を持つ聖なる杯", signature: ["relic_resonate", "summon", "ultimate_burst"] },
  { type: "ancient_crown", labelJa: "古代王の冠", group: "レリック", description: "八尖の宝冠と中央宝珠", signature: ["relic_resonate", "spell_release", "summon"] },
  { type: "cursed_amulet", labelJa: "呪いの護符", group: "レリック", description: "魔眼と棘の吊り護符", signature: ["blood_drain", "relic_resonate", "summon"] },
  { type: "relic_orb", labelJa: "ジャイロ宝珠", group: "レリック", description: "三軸ジャイロ環の宝珠", signature: ["relic_resonate", "channel_beam", "ultimate_burst"] },
  { type: "armor", labelJa: "戦乙女の肩鎧", group: "防具", description: "翼板と宝石核の肩鎧", signature: ["guard_stance", "relic_resonate", "transform"] },
];

export function getArchetypeInfo(type: ModelArchetype | undefined): ArchetypeInfo | undefined {
  return type ? ARCHETYPE_CATALOG.find((entry) => entry.type === type) : undefined;
}

export function categoryForArchetype(type: ModelArchetype): ModelCategory {
  const info = getArchetypeInfo(type);
  return info ? GROUP_CATEGORY[info.group] : "custom";
}
