export type Masterwork = {
  itemId: string;
  file: string;
  titleJa: string;
  note: string;
};

function mw(itemId: string, titleJa: string, note: string): Masterwork {
  return { itemId, file: `/masterworks/${itemId}.png`, titleJa, note };
}

/**
 * Original high-fidelity art foundations, authored as 64x64 sprites.
 *
 * These are loaded into Studio as real RGBA pixels, so they can be edited,
 * saved and exported exactly like procedurally forged textures. They are
 * original designs — no existing pack assets are used.
 */
export const MASTERWORKS: Masterwork[] = [
  // Blades
  mw("hyperion", "ヴァイオレット・トランジットブレード", "銀の刃身に紫の芯とシアンの転移核。"),
  mw("aspect_of_the_dragons", "ドラゴンウェイク・ロングブレード", "真紅の刃と金の竜装飾。"),
  mw("astraea", "アイボリー・ウィザーブレード", "骨白の刃と淡緑の髑髏柄頭。"),
  mw("scylla", "クリムゾン・ウィザーブレード", "黒と深紅に燠火の芯。"),
  mw("valkyrie", "シアン・クリティカルレイピア", "細身の刃に銀の鍔。"),
  mw("giants_sword", "ジャイアント・ボーンソード", "巨大な骨白の刃と鉄鋲。"),
  mw("dark_claymore", "オブシディアン・クレイモア", "影を纏う黒曜の大剣。"),
  mw("livid_dagger", "ティール・アサシンダガー", "曲刃の短剣。"),
  mw("midas_sword", "ミダス・ゴールドブレード", "琥珀の宝玉を抱く黄金剣。"),
  mw("flower_of_truth", "ローズ・フローラルブレード", "薔薇色の刃と蔓の鍔。"),
  mw("shadow_fury", "シャドウ・ファントムブレード", "紫電を帯びた影の刃。"),

  mw("superior_leggings", "スペリオル・ドラゴングリーヴ", "琥珀鱗の黄金脚甲。"),
  mw("superior_boots", "スペリオル・ドラゴンブーツ", "翼飾りの黄金具足。"),
  mw("shadow_assassin_chestplate", "シャドウ・アサシンメイル", "青緑の発光線を持つ黒胸甲。"),
  mw("shadow_assassin_leggings", "シャドウ・アサシングリーヴ", "青緑の稜線を持つ黒脚甲。"),
  mw("shadow_assassin_boots", "シャドウ・アサシンブーツ", "刃先を持つ黒の高速靴。"),
  mw("crimson_chestplate", "クリムゾン・メイル", "溶岩の亀裂が走る深紅胸甲。"),
  mw("aurora_helmet", "オーロラ・ヘルム", "青緑と紅紫が揺らぐ艶な兜。"),
  mw("frozen_blaze_helmet", "フローズン・ブレイズヘルム", "氷柱の冠に燠火の核。"),
  mw("frozen_blaze_chestplate", "フローズン・ブレイズメイル", "氷片の胸甲に橙の火。"),
  // Ranged and staves
  mw("terminator", "ヴォイド・ターミネーターボウ", "シアンの弦と虚空の輪郭。"),
  mw("juju_shortbow", "ジェイド・ショートボウ", "翡翠の小弓と白い弦。"),
  mw("last_breath", "フロスト・ロングボウ", "銀と淡青の霜の長弓。"),
  mw("mosquito_bow", "ヴェノム・ボウ", "翠の毒が滴る弓。"),
  mw("spirit_bow", "スピリット・ボウ", "半透明の霊弓。"),
  mw("runaans_bow", "アルケイン・トリプルボウ", "紫のエネルギー弦を持つ三連弓。"),
  mw("spirit_sceptre", "スピリット・コンジット", "ラベンダーの結晶核を持つ霊杖。"),
  mw("bonzo_staff", "バルーン・ジェスタースタッフ", "紅白の道化杖。"),
  mw("midas_staff", "ゴールデン・セプター", "金細工と琥珀のオーブ。"),
  mw("fire_veil_wand", "フレイム・クラウンワンド", "炎冠を戴く火杖。"),
  mw("wand_of_atonement", "ミント・ヒーリングワンド", "銀翼と薄荷結晶の治癒杖。"),

  // Armor
  mw("necron_helmet", "ソヴリン・バイザー", "黒金と紫の視界スリット。"),
  mw("necron_chestplate", "ソヴリン・カラペイス", "青紫の宝石を抱く重装胸甲。"),
  mw("necron_leggings", "ソヴリン・グリーヴ", "紫のルーンを刻む黒鉄の脚甲。"),
  mw("necron_boots", "ソヴリン・サバトン", "金装飾の重装足甲。"),
  mw("storm_helmet", "ストーム・ヘルム", "雷光の縁取りを持つ蒼兜。"),
  mw("storm_chestplate", "ストーム・キュイラス", "銀の稲妻を走らせた電青の胸甲。"),
  mw("superior_helmet", "スペリオル・ドラゴンヘルム", "紅玉の眼を持つ黄金竜兜。"),
  mw("superior_chestplate", "スペリオル・ドラゴンメイル", "琥珀鱗の黄金胸甲。"),
  mw("shadow_assassin_helmet", "シャドウ・アサシンマスク", "青緑に光る眼の黒頭巾。"),
  mw("crimson_helmet", "クリムゾン・ヘルム", "溶岩の亀裂が走る深紅兜。"),
  mw("aurora_chestplate", "オーロラ・キュイラス", "青緑と紅紫が揺らぐ胸甲。"),

  // Companions
  mw("golden_dragon_pet", "ゴールデン・ドラゴン", "琥珀の翼を持つ黄金竜。"),
  mw("blue_whale_pet", "ブルー・ホエール", "淡い腹の丸い蒼鯨。"),
  mw("tiger_pet", "タイガー・カブ", "橙の縞を持つ仔虎。"),
  mw("black_cat_pet", "ブラック・キャット", "琥珀の眼の黒猫。"),
  mw("griffin_pet", "グリフィン", "羽根翼の白茶の聖獣。"),
  mw("bee_pet", "ビー", "透明翅の黄黒の蜂。"),
  mw("phoenix_pet", "フェニックス", "紅の尾を引く炎の不死鳥。"),
  mw("enderman_pet", "エンダーマン", "紫の眼の細身の黒影。"),
  mw("snow_minion", "スノー・イエティミニオン", "氷青の角を持つ白毛の作業体。"),

  mw("aspect_of_the_void", "ヴォイド・アスペクトブレード", "転移晶を持つ虚無の刃。"),
  mw("frozen_scythe", "フローズン・サイズ", "霜の鎌刃にリーム。"),
  mw("axe_of_the_shredded", "シュレッダー・アックス", "粉碎歯を持つ鉄の重斧。"),
  mw("reaper_falchion", "リーパー・ファルシオン", "曲刃と骨巻きの柄。"),
  mw("mathematical_hoe", "ゴールデン・ガーデンクワ", "葉飾りと翡翠を嵌めた金の鍬。"),
  mw("relic_of_power", "レリック・オブ・パワー", "浮く深紅の護星。"),
  mw("speed_talisman", "スピード・タリスマン", "光る鎖の銀の徽章。"),
  mw("personal_compactor", "パーソナル・コンパクター", "翡翠核を持つ金の圧縮箱。"),
  mw("gemstone_mixture", "ジェムストーン・ミクスチャー", "積層した虹色の結晶塊。"),
  // Tools and accessories
  mw("gemstone_gauntlet", "ミスリル・アーティフィサーグローブ", "可動指節とティールの宝石。"),
  mw("stonk", "ゴールデン・ピッケル", "翠玉を嵌めた金の鶴嘴。"),
  mw("treecapitator", "ウッドカッター・アックス", "樫柄の広刃斧。"),
  mw("titanium_drill", "チタニウム・ドリル", "回転刃を持つ青緑の掘削機。"),
  mw("grappling_hook", "アイアン・グラップリングフック", "巻いた縄と鉄鉤。"),
  mw("rod_of_the_sea", "オーシャン・ロッド", "真珠の浮子を持つ釣竿。"),
  mw("hegemony_artifact", "ヘゲモニー・アーティファクト", "金環に浮く紫の護符。"),
  mw("overflux_capacitor", "オーバーフラックス・オーブ", "真鍮籠に収めた赤い力の球。"),
  mw("plasmaflux", "アストラル・フラックスコア", "シアンの星核を封じた多面オーブ。"),
  mw("treasure_ring", "トレジャー・リング", "蒼玉を戴く銀の指輪。"),
  mw("critical_potion", "クリティカル・ポーション", "泡立つ緋色の秘薬。"),
  mw("enchanted_book", "コーデックス・オブ・エンバーズ", "金の角と淡いルーンの魔導書。"),
];

export const MASTERWORK_BY_ITEM = Object.fromEntries(
  MASTERWORKS.map((masterwork) => [masterwork.itemId, masterwork]),
) as Record<string, Masterwork | undefined>;

export function getMasterwork(itemId: string): Masterwork | undefined {
  return MASTERWORK_BY_ITEM[itemId];
}

export function hasMasterwork(itemId: string): boolean {
  return itemId in MASTERWORK_BY_ITEM;
}
