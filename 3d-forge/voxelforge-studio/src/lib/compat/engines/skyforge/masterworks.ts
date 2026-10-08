export type Masterwork = {
  itemId: string;
  file: string;
  title: string;
  titleJa: string;
  discipline: string;
  note: string;
};

/**
 * Original high-fidelity 64px art foundations covering the catalogue. Each is
 * an authored hero piece the user can load in Studio, edit pixel-by-pixel,
 * persist and export exactly like a procedural texture. Not copied pack assets.
 */
export const MASTERWORKS: Masterwork[] = [
  { itemId: "hyperion", file: "/masterworks/hyperion.png", title: "Violet Transit Blade", titleJa: "ヴァイオレット・トランジットブレード", discipline: "sword", note: "銀の刃身、紫の芯、シアンの転移核。" },
  { itemId: "astraea", file: "/masterworks/astraea.png", title: "Bulwark Wither Blade", titleJa: "バルワーク・ウィザーブレード", discipline: "sword", note: "広い鍔と骨の柄頭を持つ守りの刃。" },
  { itemId: "scylla", file: "/masterworks/scylla.png", title: "Needle of Ruin", titleJa: "ニードル・オブ・ルイン", discipline: "sword", note: "会心に特化した細身の紫刃。" },
  { itemId: "valkyrie", file: "/masterworks/valkyrie.png", title: "Warbringer Blade", titleJa: "ウォーブリンガー・ブレード", discipline: "sword", note: "紅玉を抱く戦士の刃。" },
  { itemId: "dark_claymore", file: "/masterworks/dark_claymore.png", title: "Umbral Claymore", titleJa: "アンブラル・クレイモア", discipline: "sword", note: "影が刃になる黒曜の両手剣。" },
  { itemId: "giants_sword", file: "/masterworks/giants_sword.png", title: "Titanbone Greatsword", titleJa: "タイタンボーン・グレートソード", discipline: "sword", note: "巨人の骨と鉄の粗削りの大剣。" },
  { itemId: "livid_dagger", file: "/masterworks/livid_dagger.png", title: "Venomshade Dirk", titleJa: "ヴェノムシェード・ダーク", discipline: "sword", note: "毒緑に光る暗殺者の短剣。" },
  { itemId: "shadow_fury", file: "/masterworks/shadow_fury.png", title: "Afterimage Katana", titleJa: "アフターイメージ・カタナ", discipline: "sword", note: "紫の残像を曳く黒刀。" },
  { itemId: "aspect_of_the_dragons", file: "/masterworks/aspect_of_the_dragons.png", title: "Dragonwake Longblade", titleJa: "ドラゴンウェイク・ロングブレード", discipline: "sword", note: "真紅の刃と金の竜装飾。" },
  { itemId: "aspect_of_the_void", file: "/masterworks/aspect_of_the_void.png", title: "Endstep Blade", titleJa: "エンドステップ・ブレード", discipline: "sword", note: "虚空を折りたたむ淡緑の刃。" },
  { itemId: "flower_of_truth", file: "/masterworks/flower_of_truth.png", title: "Rosethorn Blade", titleJa: "ローズソーン・ブレード", discipline: "sword", note: "薔薇の刃と茨の柄。" },
  { itemId: "frozen_scythe", file: "/masterworks/frozen_scythe.png", title: "Glacial Reaper", titleJa: "グレイシャル・リーパー", discipline: "sword", note: "氷晶の弧を持つ大鎌。" },
  { itemId: "axe_of_the_shredded", file: "/masterworks/axe_of_the_shredded.png", title: "Rotgrinder Axe", titleJa: "ロットグラインダー・アックス", discipline: "sword", note: "腐食した儀式斧。" },
  { itemId: "reaper_falchion", file: "/masterworks/reaper_falchion.png", title: "Bonewake Falchion", titleJa: "ボーンウェイク・ファルシオン", discipline: "sword", note: "骨の刃を持つ死神の湾刀。" },
  { itemId: "midas_sword", file: "/masterworks/midas_sword.png", title: "Aurum Coin Blade", titleJa: "オーラム・コインブレード", discipline: "sword", note: "金貨で鍛えた黄金の剣。" },
  { itemId: "terminator", file: "/masterworks/terminator.png", title: "Void Terminator Bow", titleJa: "ヴォイド・ターミネーターボウ", discipline: "bow", note: "シアンの弓弦と虚空の輪郭。" },
  { itemId: "juju_shortbow", file: "/masterworks/juju_shortbow.png", title: "Junglewood Shortbow", titleJa: "ジャングルウッド・ショートボウ", discipline: "bow", note: "羽飾りとティールの弦。" },
  { itemId: "last_breath", file: "/masterworks/last_breath.png", title: "Wraithsigh Longbow", titleJa: "レイスサイ・ロングボウ", discipline: "bow", note: "霊気をまとう白緑の長弓。" },
  { itemId: "mosquito_bow", file: "/masterworks/mosquito_bow.png", title: "Bloodwing Bow", titleJa: "ブラッドウィング・ボウ", discipline: "bow", note: "虫翅の弓身と真紅の弦。" },
  { itemId: "spirit_bow", file: "/masterworks/spirit_bow.png", title: "Ectoplasm Bow", titleJa: "エクトプラズム・ボウ", discipline: "bow", note: "青い霊体で編まれた弓。" },
  { itemId: "runaans_bow", file: "/masterworks/runaans_bow.png", title: "Trinity Longbow", titleJa: "トリニティ・ロングボウ", discipline: "bow", note: "三条に分かれる金の魔矢印。" },
  { itemId: "spirit_sceptre", file: "/masterworks/spirit_sceptre.png", title: "Spirit Conduit", titleJa: "スピリット・コンジット", discipline: "staff", note: "ラベンダーの結晶核を持つ霊杖。" },
  { itemId: "bonzo_staff", file: "/masterworks/bonzo_staff.png", title: "Jester Balloon Staff", titleJa: "ジェスター・バルーンスタッフ", discipline: "staff", note: "赤青の風船をつけた道化杖。" },
  { itemId: "midas_staff", file: "/masterworks/midas_staff.png", title: "Aurum Nugget Staff", titleJa: "オーラム・ナゲットスタッフ", discipline: "staff", note: "金塊を戴く純金の杖。" },
  { itemId: "fire_veil_wand", file: "/masterworks/fire_veil_wand.png", title: "Emberveil Wand", titleJa: "エンバーヴェイル・ワンド", discipline: "staff", note: "炎のヴェールを纏う短杖。" },
  { itemId: "wand_of_atonement", file: "/masterworks/wand_of_atonement.png", title: "Mercy Wand", titleJa: "マーシー・ワンド", discipline: "staff", note: "桃色の心臓結晶を戴く癒しの杖。" },
  { itemId: "necron_helmet", file: "/masterworks/necron_helmet.png", title: "Sovereign Visor", titleJa: "ソヴリン・バイザー", discipline: "armor", note: "黒金と紫の視界スリット。" },
  { itemId: "necron_chestplate", file: "/masterworks/necron_chestplate.png", title: "Sovereign Carapace", titleJa: "ソヴリン・カラペイス", discipline: "armor", note: "青紫の宝石を抱いた重装胸甲。" },
  { itemId: "necron_leggings", file: "/masterworks/necron_leggings.png", title: "Sovereign Greaves", titleJa: "ソヴリン・グリーヴ", discipline: "armor", note: "黒金と紫縁の重装脚甲。" },
  { itemId: "necron_boots", file: "/masterworks/necron_boots.png", title: "Sovereign Sabatons", titleJa: "ソヴリン・サバトン", discipline: "armor", note: "王の足音を刻む鉄靴。" },
  { itemId: "storm_helmet", file: "/masterworks/storm_helmet.png", title: "Tempest Crest", titleJa: "テンペスト・クレスト", discipline: "armor", note: "雷紋を頂くシアンの兜。" },
  { itemId: "storm_chestplate", file: "/masterworks/storm_chestplate.png", title: "Tempest Plate", titleJa: "テンペスト・プレート", discipline: "armor", note: "稲妻の紋章を抱く法衣鎧。" },
  { itemId: "superior_helmet", file: "/masterworks/superior_helmet.png", title: "Apex Dragon Helm", titleJa: "エイペックス・ドラゴンヘルム", discipline: "armor", note: "金の角を持つ深紫の竜兜。" },
  { itemId: "superior_chestplate", file: "/masterworks/superior_chestplate.png", title: "Apex Dragon Plate", titleJa: "エイペックス・ドラゴンプレート", discipline: "armor", note: "金鱗縁と桃玉の竜胸甲。" },
  { itemId: "superior_leggings", file: "/masterworks/superior_leggings.png", title: "Apex Dragon Greaves", titleJa: "エイペックス・ドラゴングリーヴ", discipline: "armor", note: "金鱗の竜脚甲。" },
  { itemId: "superior_boots", file: "/masterworks/superior_boots.png", title: "Apex Dragon Talons", titleJa: "エイペックス・ドラゴンタロン", discipline: "armor", note: "金爪の竜靴。" },
  { itemId: "shadow_assassin_helmet", file: "/masterworks/shadow_assassin_helmet.png", title: "Nightveil Mask", titleJa: "ナイトヴェイル・マスク", discipline: "armor", note: "赤く光る目の頭巾。" },
  { itemId: "shadow_assassin_chestplate", file: "/masterworks/shadow_assassin_chestplate.png", title: "Nightveil Wrap", titleJa: "ナイトヴェイル・ラップ", discipline: "armor", note: "赤帯の暗殺者胴衣。" },
  { itemId: "shadow_assassin_leggings", file: "/masterworks/shadow_assassin_leggings.png", title: "Nightveil Leggings", titleJa: "ナイトヴェイル・レギンス", discipline: "armor", note: "赤い膝巻きの脚衣。" },
  { itemId: "shadow_assassin_boots", file: "/masterworks/shadow_assassin_boots.png", title: "Nightveil Treads", titleJa: "ナイトヴェイル・トレッド", discipline: "armor", note: "赤紐の柔靴。" },
  { itemId: "crimson_helmet", file: "/masterworks/crimson_helmet.png", title: "Magmaheart Helm", titleJa: "マグマハート・ヘルム", discipline: "armor", note: "溶岩の亀裂が走る真紅の角兜。" },
  { itemId: "crimson_chestplate", file: "/masterworks/crimson_chestplate.png", title: "Magmaheart Plate", titleJa: "マグマハート・プレート", discipline: "armor", note: "溶岩核を抱く真紅の胸甲。" },
  { itemId: "aurora_helmet", file: "/masterworks/aurora_helmet.png", title: "Polaris Hat", titleJa: "ポラリス・ハット", discipline: "armor", note: "極光の帯をまとう藍の法帽。" },
  { itemId: "aurora_chestplate", file: "/masterworks/aurora_chestplate.png", title: "Polaris Robe", titleJa: "ポラリス・ローブ", discipline: "armor", note: "極光の縞を持つ藍の法衣。" },
  { itemId: "frozen_blaze_helmet", file: "/masterworks/frozen_blaze_helmet.png", title: "Rimefire Helm", titleJa: "ライムファイア・ヘルム", discipline: "armor", note: "凍った炎の冠。" },
  { itemId: "frozen_blaze_chestplate", file: "/masterworks/frozen_blaze_chestplate.png", title: "Rimefire Plate", titleJa: "ライムファイア・プレート", discipline: "armor", note: "冷炎の炉心を抱く氷甲。" },
  { itemId: "stonk", file: "/masterworks/stonk.png", title: "Emerald Efficiency Pick", titleJa: "エメラルド・エフィシェンシーピック", discipline: "tool", note: "翠玉を戴く黄金ツルハシ。" },
  { itemId: "treecapitator", file: "/masterworks/treecapitator.png", title: "Oakfell Axe", titleJa: "オークフェル・アックス", discipline: "tool", note: "樫の葉紋の黄金斧。" },
  { itemId: "titanium_drill", file: "/masterworks/titanium_drill.png", title: "DR-X Titanium Drill", titleJa: "DR-X チタニウムドリル", discipline: "tool", note: "ティールの動力核を持つ穿孔機。" },
  { itemId: "gemstone_gauntlet", file: "/masterworks/gemstone_gauntlet.png", title: "Mithril Artificer Glove", titleJa: "ミスリル・アーティフィサーグローブ", discipline: "tool", note: "可動指節とティールの宝石。" },
  { itemId: "grappling_hook", file: "/masterworks/grappling_hook.png", title: "Ironclaw Grapple", titleJa: "アイアンクロー・グラップル", discipline: "tool", note: "巻いたロープと鉄の爪。" },
  { itemId: "rod_of_the_sea", file: "/masterworks/rod_of_the_sea.png", title: "Tidal Trident Rod", titleJa: "タイダル・トライデントロッド", discipline: "tool", note: "真珠と波紋の海釣り竿。" },
  { itemId: "mathematical_hoe", file: "/masterworks/mathematical_hoe.png", title: "Blueprint Hoe", titleJa: "ブループリント・ホー", discipline: "tool", note: "青図面を巻いた黄金のクワ。" },
  { itemId: "hegemony_artifact", file: "/masterworks/hegemony_artifact.png", title: "Suncrown Artifact", titleJa: "サンクラウン・アーティファクト", discipline: "accessory", note: "紅玉核と放射する金の棘。" },
  { itemId: "overflux_capacitor", file: "/masterworks/overflux_capacitor.png", title: "Ember Flux Orb", titleJa: "エンバー・フラックスオーブ", discipline: "accessory", note: "鉄台に据えた赤橙の多面球。" },
  { itemId: "plasmaflux", file: "/masterworks/plasmaflux.png", title: "Astral Flux Core", titleJa: "アストラル・フラックスコア", discipline: "accessory", note: "シアンの星核を封じた多面オーブ。" },
  { itemId: "relic_of_power", file: "/masterworks/relic_of_power.png", title: "Runic Relic Tablet", titleJa: "ルーニック・レリックタブレット", discipline: "accessory", note: "魔法ルーンの光る紫の石板。" },
  { itemId: "speed_talisman", file: "/masterworks/speed_talisman.png", title: "Featherstep Charm", titleJa: "フェザーステップ・チャーム", discipline: "accessory", note: "白い羽根の革のお守り。" },
  { itemId: "treasure_ring", file: "/masterworks/treasure_ring.png", title: "Emerald Fortune Ring", titleJa: "エメラルド・フォーチュンリング", discipline: "accessory", note: "翠玉を嵌めた黄金の指輪。" },
  { itemId: "personal_compactor", file: "/masterworks/personal_compactor.png", title: "Brass Compactor", titleJa: "ブラス・コンパクター", discipline: "accessory", note: "歯車と光るスロットの真鍮箱。" },
  { itemId: "golden_dragon_pet", file: "/masterworks/golden_dragon_pet.png", title: "Coinscale Hatchling", titleJa: "コインスケイル・ハッチリング", discipline: "pet", note: "金貨の鱗を持つ仔竜。" },
  { itemId: "blue_whale_pet", file: "/masterworks/blue_whale_pet.png", title: "Tidecalf", titleJa: "タイドカーフ", discipline: "pet", note: "潮を吹く丸い仔鯨。" },
  { itemId: "tiger_pet", file: "/masterworks/tiger_pet.png", title: "Emberstripe Cub", titleJa: "エンバーストライプ・カブ", discipline: "pet", note: "橙縞の虎の子。" },
  { itemId: "black_cat_pet", file: "/masterworks/black_cat_pet.png", title: "Greeneye Shadowcat", titleJa: "グリーンアイ・シャドウキャット", discipline: "pet", note: "緑の目の黒猫。" },
  { itemId: "griffin_pet", file: "/masterworks/griffin_pet.png", title: "Dawnfeather Chick", titleJa: "ドーンフェザー・チック", discipline: "pet", note: "白金の羽のグリフィンの雛。" },
  { itemId: "bee_pet", file: "/masterworks/bee_pet.png", title: "Honeyfuzz", titleJa: "ハニーファズ", discipline: "pet", note: "丸くふわふわの蜜蜂。" },
  { itemId: "phoenix_pet", file: "/masterworks/phoenix_pet.png", title: "Cinderwing Chick", titleJa: "シンダーウィング・チック", discipline: "pet", note: "炎の尾を曳く不死鳥の雛。" },
  { itemId: "enderman_pet", file: "/masterworks/enderman_pet.png", title: "Voidling", titleJa: "ヴォイドリング", discipline: "pet", note: "小さなブロックを抱く紫目の子。" },
  { itemId: "enchanted_book", file: "/masterworks/enchanted_book.png", title: "Codex of Embers", titleJa: "コーデックス・オブ・エンバーズ", discipline: "misc", note: "金の角と淡いルーンの赤革魔導書。" },
  { itemId: "critical_potion", file: "/masterworks/critical_potion.png", title: "Crimson Crit Vial", titleJa: "クリムゾン・クリットバイアル", discipline: "misc", note: "煌めく真紅の薬瓶。" },
  { itemId: "gemstone_mixture", file: "/masterworks/gemstone_mixture.png", title: "Prismatic Cluster", titleJa: "プリズマティック・クラスター", discipline: "misc", note: "四色の宝石が溶け合う塊。" },
  { itemId: "wither_shield_scroll", file: "/masterworks/wither_shield_scroll.png", title: "Wither Ward Scroll", titleJa: "ウィザー・ワードスクロール", discipline: "misc", note: "骸骨の封蝋の巻物。" },
  { itemId: "gyrokinetic_wand", file: "/masterworks/gyrokinetic_wand.png", title: "Gyrokinetic Clockwork Wand", titleJa: "ジャイロキネティック・ワンド", discipline: "staff", note: "真鍮ジンバルと時計仕掛けの回転コアを持つ重力歪曲杖。" },
  { itemId: "hyper_cleaver", file: "/masterworks/hyper_cleaver.png", title: "Hyper Chain-Cleaver", titleJa: "ハイパー・チェーンクリーバー", discipline: "sword", note: "高速循環する回転連鎖刃を備えた重工業大鉈。" },
  { itemId: "plasma_chainsaw", file: "/masterworks/plasma_chainsaw.png", title: "High-Frequency Plasma Saw", titleJa: "プラズマ・チェーンソー", discipline: "sword", note: "超高熱プラズマを帯びた高速回転歯車の伐採兵器。" },
  { itemId: "steampunk_railgun", file: "/masterworks/steampunk_railgun.png", title: "Dwarven Coil Railgun", titleJa: "ドワーフ・レールガン", discipline: "bow", note: "電磁レールコイルで鉄杭を音速射出する重火器。" },
  { itemId: "flintlock_repeater", file: "/masterworks/flintlock_repeater.png", title: "Clockwork Repeating Crossbow", titleJa: "クロックワーク・リピーター", discipline: "bow", note: "精密歯車の連動により矢を高速連射する機械弩弓。" },
  { itemId: "steam_pilebunker", file: "/masterworks/steam_pilebunker.png", title: "Hydraulic Steam Pilebunker", titleJa: "油圧パイルバンカー", discipline: "tool", note: "超高圧蒸気シリンダーで超硬質杭を撃ち込む腕部破城兵器。" },
  { itemId: "artificer_wrench", file: "/masterworks/artificer_wrench.png", title: "Artificer's Omni-Wrench", titleJa: "アーティフィサーズ・レンチ", discipline: "tool", note: "あらゆる機械構造を瞬時に調整・分解できる工房の万能変形レンチ。" },
  { itemId: "automaton_blade", file: "/masterworks/automaton_blade.png", title: "Automaton Heartblade", titleJa: "オートマタ・ハートブレード", discipline: "sword", note: "古代オートマタの永久機関コアを組み込んだ蒸気機械剣。" },
  { itemId: "tachyon_cleaver", file: "/masterworks/tachyon_cleaver.png", title: "Tachyon Accelerator Cleaver", titleJa: "タキオンクリーバー", discipline: "sword", note: "時間加速ピストンと電磁ブレードを備えた超未来大鉈。" },
  { itemId: "mecha_gauntlet", file: "/masterworks/mecha_gauntlet.png", title: "Steamwork Power Gauntlet", titleJa: "スチームワーク・パワーガントレット", discipline: "tool", note: "真鍮歯車と排気バルブを搭載した蒸気駆動強化手甲。" },
{ itemId: "snow_minion", file: "/masterworks/snow_minion.png", title: "Snow Minion", titleJa: "スノー・ミニオン", discipline: "misc", note: "雪の角が生えた冬の使い魔。(generator2より移植。原文の日本語はソース時点で文字化けしていたため転記)" },
];

export const MASTERWORK_BY_ITEM = Object.fromEntries(
  MASTERWORKS.map((masterwork) => [masterwork.itemId, masterwork]),
) as Record<string, Masterwork | undefined>;

export function getMasterwork(itemId: string): Masterwork | undefined {
  return MASTERWORK_BY_ITEM[itemId];
}
