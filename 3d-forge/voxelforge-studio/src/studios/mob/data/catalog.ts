import type { ArchetypeId, ParticleId, Rarity, Temperament } from "@/studios/mob/types";

export const GROUP_LABEL: Record<string, string> = {
  head: "頭",
  body: "胴",
  arm: "腕",
  leg: "脚",
  wing: "翼",
  tail: "尾",
  extra: "付属",
};

export const TEMPERAMENT_LABEL: Record<Temperament, string> = {
  hostile: "敵対",
  neutral: "中立",
  passive: "友好",
};

export const CATEGORY_LABEL: Record<string, string> = {
  monster: "モンスター",
  creature: "クリーチャー",
  ambient: "環境",
  water_creature: "水棲",
  water_ambient: "水中環境",
  misc: "その他",
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "コモン",
  uncommon: "アンコモン",
  rare: "レア",
  epic: "エピック",
  legendary: "レジェンダリー",
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#9aa3ad",
  uncommon: "#3ddc84",
  rare: "#8eb7ff",
  epic: "#c084fc",
  legendary: "#e2b657",
};

export interface BehaviorDef {
  id: string;
  name: string;
  desc: string;
  goals: string[];
}

export const BEHAVIORS: BehaviorDef[] = [
  { id: "melee", name: "近接攻撃", desc: "射程に入ると殴る。敵対はプレイヤーを狙い、中立は反撃のみ。", goals: ["MeleeAttackGoal", "RevengeGoal", "ActiveTargetGoal"] },
  { id: "ranged", name: "遠隔攻撃", desc: "弾または光線。弾エンティティは後で差し替える。", goals: ["ProjectileAttackGoal"] },
  { id: "wander", name: "徘徊", desc: "目的なく歩く。ほぼ全モブの基礎。", goals: ["WanderAroundFarGoal"] },
  { id: "look", name: "周囲を見る", desc: "プレイヤーや同族を見て、首を振る。", goals: ["LookAtEntityGoal", "LookAroundGoal"] },
  { id: "flee", name: "逃走", desc: "低体力、または天敵から距離を取る。", goals: ["FleeEntityGoal"] },
  { id: "swim", name: "浮く", desc: "水に入ると水面へ上がる。", goals: ["SwimGoal"] },
  { id: "avoid_sun", name: "日光を避ける", desc: "昼は日陰を探す。", goals: ["AvoidSunlightGoal", "EscapeSunlightGoal"] },
  { id: "burn_sun", name: "日光で燃える", desc: "頭上が空なら炎上。ヘルメットで防ぐ想定。", goals: ["tick: setOnFire"] },
  { id: "break_door", name: "扉を壊す", desc: "木の扉を破壊して追跡する。", goals: ["BreakDoorGoal"] },
  { id: "open_door", name: "扉を開ける", desc: "木の扉を開閉する。", goals: ["LongDoorInteractGoal"] },
  { id: "pickup", name: "アイテムを拾う", desc: "落ちているアイテムを回収・装備。", goals: ["custom PickupGoal"] },
  { id: "breed", name: "繁殖", desc: "餌でハートを出して増える。", goals: ["AnimalMateGoal"] },
  { id: "tempt", name: "餌に寄る", desc: "指定アイテムを持ったプレイヤーへ寄る。", goals: ["TemptGoal"] },
  { id: "tame", name: "手懐け", desc: "条件を満たすと飼いならされる。", goals: ["TameableEntity"] },
  { id: "follow_owner", name: "主人に従う", desc: "手懐け後に追従し、座らせられる。", goals: ["FollowOwnerGoal", "SitGoal"] },
  { id: "pack", name: "群れ", desc: "同種が攻撃されたら加勢する。", goals: ["custom pack revenge"] },
  { id: "ambush", name: "待ち伏せ", desc: "動かず、近づくと飛びかかる。", goals: ["custom AmbushGoal"] },
  { id: "charge", name: "突進", desc: "直線に加速して体当たり。", goals: ["custom ChargeGoal"] },
  { id: "teleport", name: "転移", desc: "被弾・水・視線でテレポート。", goals: ["custom TeleportGoal"] },
  { id: "summon", name: "召喚", desc: "戦闘中に下位モブを呼ぶ。", goals: ["custom SummonGoal"] },
  { id: "explode", name: "爆発", desc: "接近、または死亡時に爆発する。", goals: ["custom IgniteGoal"] },
  { id: "nocturnal", name: "夜行性", desc: "夜だけ活発。スポーン条件とセットで使う。", goals: ["canSpawn time check"] },
  { id: "regenerate", name: "再生", desc: "非戦闘時に体力が戻る。", goals: ["custom heal tick"] },
  { id: "climb", name: "壁を登る", desc: "壁面に張り付いて移動する。", goals: ["horizontalCollision climb"] },
  { id: "fly_wander", name: "飛行徘徊", desc: "空中を漂う。飛行フラグと併用。", goals: ["FlyGoal"] },
  { id: "water_nav", name: "水中航行", desc: "水中を本拠に泳ぐ。", goals: ["SwimAroundGoal", "MoveIntoWaterGoal"] },
];

export interface AbilityDef {
  id: string;
  name: string;
  desc: string;
  effect: string;
}

export const ABILITIES: AbilityDef[] = [
  { id: "poison", name: "毒", desc: "攻撃時に毒。パワーが濃度と時間。", effect: "minecraft:poison" },
  { id: "wither", name: "ウィザー", desc: "攻撃時にウィザー。アンデッド相手には無効が無難。", effect: "minecraft:wither" },
  { id: "slowness", name: "鈍足", desc: "ヒット、または近距離オーラで鈍足。", effect: "minecraft:slowness" },
  { id: "weakness", name: "弱体", desc: "近距離で攻撃力を下げる。", effect: "minecraft:weakness" },
  { id: "levitation", name: "浮遊", desc: "弾が当たると浮遊。落下ダメージに注意。", effect: "minecraft:levitation" },
  { id: "fire", name: "着火", desc: "攻撃で火がつく。秒数はパワー依存。", effect: "setOnFire" },
  { id: "frost", name: "霜気", desc: "周囲に鈍足と採掘疲労。", effect: "slowness + mining_fatigue" },
  { id: "thorns", name: "荊", desc: "被弾時に反射ダメージ。", effect: "thorns" },
  { id: "regen", name: "再生", desc: "常時、または非戦闘で再生。", effect: "minecraft:regeneration" },
  { id: "lifesteal", name: "吸血", desc: "与ダメージの一部を回復。", effect: "heal on hit" },
  { id: "teleport_strike", name: "転移斬り", desc: "背後へ転移してから殴る。", effect: "custom" },
  { id: "summon", name: "召喚", desc: "子分を呼ぶ。数はパワー。", effect: "custom summon" },
  { id: "explode", name: "自爆", desc: "条件で爆発。威力 0.5 + power×0.7。", effect: "createExplosion" },
  { id: "web", name: "糸", desc: "鈍足弾、またはクモの巣を置く。", effect: "cobweb / slowness" },
  { id: "beam", name: "光線", desc: "連続ビーム。守護者型。", effect: "custom beam" },
  { id: "charge", name: "突進", desc: "ノックバック付きの体当たり。", effect: "custom charge" },
  { id: "spore", name: "胞子雲", desc: "範囲に毒と盲目。", effect: "poison + blindness" },
  { id: "invis", name: "隠蔽", desc: "非戦闘時に透明。攻撃で解ける。", effect: "minecraft:invisibility" },
  { id: "armor_shred", name: "鎧砕き", desc: "一時的に防御を下げる。", effect: "attribute modifier" },
  { id: "pull", name: "引き寄せ", desc: "プレイヤーを吸い寄せる。", effect: "velocity pull" },
  { id: "ignite_aura", name: "熱気", desc: "周囲のモブとプレイヤーに着火。", effect: "fire aura" },
];

export const PARTICLES: { id: ParticleId; name: string; mc: string }[] = [
  { id: "none", name: "なし", mc: "" },
  { id: "flame", name: "炎", mc: "minecraft:flame" },
  { id: "soul", name: "魂炎", mc: "minecraft:soul_fire_flame" },
  { id: "enchant", name: "エンチャント", mc: "minecraft:enchant" },
  { id: "spore", name: "胞子", mc: "minecraft:spore_blossom_air" },
  { id: "drip", name: "水滴", mc: "minecraft:dripping_water" },
  { id: "ash", name: "灰", mc: "minecraft:ash" },
  { id: "electric", name: "電撃", mc: "minecraft:electric_spark" },
  { id: "cherry", name: "花弁", mc: "minecraft:cherry_leaves" },
  { id: "note", name: "音符", mc: "minecraft:note" },
];

export interface Palette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  skin: string;
  eye: string;
  detail: string;
  eggBase: string;
  eggSpots: string;
}

export const PALETTES: Palette[] = [
  { id: "forest", name: "深森", primary: "#1b4332", secondary: "#2d6a4f", accent: "#c6f26d", skin: "#40916c", eye: "#f4ff8a", detail: "#081c15", eggBase: "#143528", eggSpots: "#c6f26d" },
  { id: "nether", name: "灰燼", primary: "#3d2218", secondary: "#6b3424", accent: "#ff7a32", skin: "#8a4632", eye: "#ffe08a", detail: "#1a0d0a", eggBase: "#2a1612", eggSpots: "#ff7a32" },
  { id: "soul", name: "魂", primary: "#1c2428", secondary: "#31464c", accent: "#7ee0e0", skin: "#3d555c", eye: "#d8fffb", detail: "#0c1214", eggBase: "#142024", eggSpots: "#7ee0e0" },
  { id: "gold", name: "金装", primary: "#3a2e16", secondary: "#7a6230", accent: "#e2b657", skin: "#c4a36a", eye: "#fff1c2", detail: "#1c160c", eggBase: "#2c2414", eggSpots: "#e2b657" },
  { id: "end", name: "虚空", primary: "#1a1430", secondary: "#3a2a62", accent: "#c084fc", skin: "#4c3d78", eye: "#f0d8ff", detail: "#0c0a16", eggBase: "#161028", eggSpots: "#c084fc" },
  { id: "blossom", name: "桜", primary: "#4a2c38", secondary: "#8a4a62", accent: "#ffb7c5", skin: "#e8c2c8", eye: "#fff0f4", detail: "#241018", eggBase: "#3a2030", eggSpots: "#ffb7c5" },
  { id: "copper", name: "銅緑", primary: "#6b3a28", secondary: "#a86a42", accent: "#6fbfa8", skin: "#c4845c", eye: "#ffe3b0", detail: "#2a160e", eggBase: "#4a2c1c", eggSpots: "#6fbfa8" },
  { id: "bone", name: "骨", primary: "#cfc6b6", secondary: "#8a8175", accent: "#e2b657", skin: "#e7dfd2", eye: "#7d5cff", detail: "#2a2622", eggBase: "#d7d0c4", eggSpots: "#5c5348" },
  { id: "abyss", name: "深海", primary: "#0e2c38", secondary: "#16485a", accent: "#7d5cff", skin: "#1f6a78", eye: "#d7c6ff", detail: "#07161c", eggBase: "#0c2430", eggSpots: "#7d5cff" },
  { id: "amethyst", name: "硝子", primary: "#bfeeed", secondary: "#8fd4d8", accent: "#c9a6ff", skin: "#e7fffd", eye: "#ffffff", detail: "#245e64", eggBase: "#d8fffb", eggSpots: "#b388ff" },
];

export interface SoundSet {
  id: string;
  name: string;
  ambient: string;
  hurt: string;
  death: string;
  step: string;
}

export const SOUND_SETS: SoundSet[] = [
  { id: "beast", name: "獣", ambient: "minecraft:entity.wolf.ambient", hurt: "minecraft:entity.wolf.hurt", death: "minecraft:entity.wolf.death", step: "minecraft:entity.wolf.step" },
  { id: "undead", name: "アンデッド", ambient: "minecraft:entity.zombie.ambient", hurt: "minecraft:entity.zombie.hurt", death: "minecraft:entity.zombie.death", step: "minecraft:entity.zombie.step" },
  { id: "bone", name: "骨", ambient: "minecraft:entity.skeleton.ambient", hurt: "minecraft:entity.skeleton.hurt", death: "minecraft:entity.skeleton.death", step: "minecraft:entity.skeleton.step" },
  { id: "slime", name: "粘体", ambient: "minecraft:entity.slime.squish", hurt: "minecraft:entity.slime.hurt", death: "minecraft:entity.slime.death", step: "minecraft:entity.slime.squish" },
  { id: "golem", name: "ゴーレム", ambient: "minecraft:entity.iron_golem.repair", hurt: "minecraft:entity.iron_golem.hurt", death: "minecraft:entity.iron_golem.death", step: "minecraft:entity.iron_golem.step" },
  { id: "insect", name: "節足", ambient: "minecraft:entity.spider.ambient", hurt: "minecraft:entity.spider.hurt", death: "minecraft:entity.spider.death", step: "minecraft:entity.spider.step" },
  { id: "water", name: "水棲", ambient: "minecraft:entity.guardian.ambient", hurt: "minecraft:entity.guardian.hurt", death: "minecraft:entity.guardian.death", step: "minecraft:entity.fish.swim" },
  { id: "phantom", name: "飛行", ambient: "minecraft:entity.phantom.ambient", hurt: "minecraft:entity.phantom.hurt", death: "minecraft:entity.phantom.death", step: "minecraft:entity.phantom.flap" },
  { id: "blaze", name: "炎", ambient: "minecraft:entity.blaze.ambient", hurt: "minecraft:entity.blaze.hurt", death: "minecraft:entity.blaze.death", step: "minecraft:entity.blaze.burn" },
  { id: "illager", name: "詠唱", ambient: "minecraft:entity.evoker.ambient", hurt: "minecraft:entity.evoker.hurt", death: "minecraft:entity.evoker.death", step: "minecraft:entity.evoker.cast_spell" },
  { id: "ender", name: "虚空", ambient: "minecraft:entity.enderman.ambient", hurt: "minecraft:entity.enderman.hurt", death: "minecraft:entity.enderman.death", step: "minecraft:entity.enderman.teleport" },
  { id: "hoglin", name: "巨獣", ambient: "minecraft:entity.hoglin.ambient", hurt: "minecraft:entity.hoglin.hurt", death: "minecraft:entity.hoglin.death", step: "minecraft:entity.hoglin.step" },
];

export const DIMENSIONS = [
  { id: "overworld", name: "オーバーワールド" },
  { id: "the_nether", name: "ネザー" },
  { id: "the_end", name: "エンド" },
];

export const BIOME_TAGS = [
  { id: "tag:minecraft:is_forest", name: "森林タグ" },
  { id: "tag:minecraft:is_taiga", name: "タイガタグ" },
  { id: "tag:minecraft:is_jungle", name: "ジャングルタグ" },
  { id: "tag:minecraft:is_ocean", name: "海洋タグ" },
  { id: "tag:minecraft:is_mountain", name: "山岳タグ" },
  { id: "tag:minecraft:is_nether", name: "ネザータグ" },
  { id: "tag:minecraft:is_end", name: "エンドタグ" },
  { id: "tag:c:is_cave", name: "洞窟 (c)" },
];

export const BIOMES: { id: string; name: string; key: string }[] = [
  { id: "plains", name: "平原", key: "PLAINS" },
  { id: "sunflower_plains", name: "ヒマワリ平原", key: "SUNFLOWER_PLAINS" },
  { id: "forest", name: "森林", key: "FOREST" },
  { id: "flower_forest", name: "花の森", key: "FLOWER_FOREST" },
  { id: "birch_forest", name: "白樺の森", key: "BIRCH_FOREST" },
  { id: "dark_forest", name: "暗い森", key: "DARK_FOREST" },
  { id: "cherry_grove", name: "サクラの林", key: "CHERRY_GROVE" },
  { id: "taiga", name: "タイガ", key: "TAIGA" },
  { id: "snowy_taiga", name: "雪のタイガ", key: "SNOWY_TAIGA" },
  { id: "old_growth_pine_taiga", name: "マツの原生林", key: "OLD_GROWTH_PINE_TAIGA" },
  { id: "jungle", name: "ジャングル", key: "JUNGLE" },
  { id: "sparse_jungle", name: "疎林ジャングル", key: "SPARSE_JUNGLE" },
  { id: "bamboo_jungle", name: "竹林", key: "BAMBOO_JUNGLE" },
  { id: "swamp", name: "湿地", key: "SWAMP" },
  { id: "mangrove_swamp", name: "マングローブ", key: "MANGROVE_SWAMP" },
  { id: "desert", name: "砂漠", key: "DESERT" },
  { id: "badlands", name: "悪地", key: "BADLANDS" },
  { id: "wooded_badlands", name: "森のある悪地", key: "WOODED_BADLANDS" },
  { id: "savanna", name: "サバンナ", key: "SAVANNA" },
  { id: "meadow", name: "草地", key: "MEADOW" },
  { id: "grove", name: "林", key: "GROVE" },
  { id: "snowy_slopes", name: "雪の斜面", key: "SNOWY_SLOPES" },
  { id: "jagged_peaks", name: "尖った峰", key: "JAGGED_PEAKS" },
  { id: "stony_peaks", name: "石の峰", key: "STONY_PEAKS" },
  { id: "ice_spikes", name: "氷樹", key: "ICE_SPIKES" },
  { id: "mushroom_fields", name: "キノコ島", key: "MUSHROOM_FIELDS" },
  { id: "ocean", name: "海洋", key: "OCEAN" },
  { id: "deep_ocean", name: "深海", key: "DEEP_OCEAN" },
  { id: "lukewarm_ocean", name: "ぬるい海", key: "LUKEWARM_OCEAN" },
  { id: "warm_ocean", name: "暖かい海", key: "WARM_OCEAN" },
  { id: "cold_ocean", name: "冷たい海", key: "COLD_OCEAN" },
  { id: "frozen_ocean", name: "凍った海", key: "FROZEN_OCEAN" },
  { id: "river", name: "川", key: "RIVER" },
  { id: "beach", name: "砂浜", key: "BEACH" },
  { id: "stony_shore", name: "石の海岸", key: "STONY_SHORE" },
  { id: "dripstone_caves", name: "鍾乳洞", key: "DRIPSTONE_CAVES" },
  { id: "lush_caves", name: "繁茂した洞窟", key: "LUSH_CAVES" },
  { id: "deep_dark", name: "ディープダーク", key: "DEEP_DARK" },
  { id: "pale_garden", name: "蒼白の庭", key: "PALE_GARDEN" },
  { id: "nether_wastes", name: "ネザーの荒地", key: "NETHER_WASTES" },
  { id: "soul_sand_valley", name: "ソウルサンドの谷", key: "SOUL_SAND_VALLEY" },
  { id: "crimson_forest", name: "真紅の森", key: "CRIMSON_FOREST" },
  { id: "warped_forest", name: "歪んだ森", key: "WARPED_FOREST" },
  { id: "basalt_deltas", name: "玄武岩デルタ", key: "BASALT_DELTAS" },
  { id: "the_end", name: "エンド", key: "THE_END" },
  { id: "end_highlands", name: "エンド高地", key: "END_HIGHLANDS" },
  { id: "end_midlands", name: "エンド中地", key: "END_MIDLANDS" },
  { id: "small_end_islands", name: "エンド外島", key: "SMALL_END_ISLANDS" },
];

export const ITEMS: { id: string; name: string }[] = [
  { id: "minecraft:rotten_flesh", name: "腐った肉" },
  { id: "minecraft:bone", name: "骨" },
  { id: "minecraft:string", name: "糸" },
  { id: "minecraft:spider_eye", name: "クモの目" },
  { id: "minecraft:gunpowder", name: "火薬" },
  { id: "minecraft:ender_pearl", name: "エンダーパール" },
  { id: "minecraft:slime_ball", name: "スライムボール" },
  { id: "minecraft:phantom_membrane", name: "ファントムの皮膜" },
  { id: "minecraft:blaze_rod", name: "ブレイズロッド" },
  { id: "minecraft:blaze_powder", name: "ブレイズパウダー" },
  { id: "minecraft:ghast_tear", name: "ガストの涙" },
  { id: "minecraft:magma_cream", name: "マグマクリーム" },
  { id: "minecraft:prismarine_shard", name: "プリズマリンの欠片" },
  { id: "minecraft:prismarine_crystals", name: "プリズマリンクリスタル" },
  { id: "minecraft:leather", name: "革" },
  { id: "minecraft:feather", name: "羽根" },
  { id: "minecraft:ink_sac", name: "イカスミ" },
  { id: "minecraft:glow_ink_sac", name: "輝くイカスミ" },
  { id: "minecraft:emerald", name: "エメラルド" },
  { id: "minecraft:iron_ingot", name: "鉄インゴット" },
  { id: "minecraft:gold_nugget", name: "金塊" },
  { id: "minecraft:gold_ingot", name: "金インゴット" },
  { id: "minecraft:copper_ingot", name: "銅インゴット" },
  { id: "minecraft:amethyst_shard", name: "アメジストの欠片" },
  { id: "minecraft:echo_shard", name: "残響の欠片" },
  { id: "minecraft:coal", name: "石炭" },
  { id: "minecraft:flint", name: "火打石" },
  { id: "minecraft:stick", name: "棒" },
  { id: "minecraft:arrow", name: "矢" },
  { id: "minecraft:glowstone_dust", name: "グロウストーンダスト" },
  { id: "minecraft:redstone", name: "レッドストーン" },
  { id: "minecraft:lapis_lazuli", name: "ラピスラズリ" },
  { id: "minecraft:quartz", name: "ネザークォーツ" },
  { id: "minecraft:nether_wart", name: "ネザーウォート" },
  { id: "minecraft:diamond", name: "ダイヤモンド" },
  { id: "minecraft:netherite_scrap", name: "ネザライトの欠片" },
  { id: "minecraft:book", name: "本" },
  { id: "minecraft:paper", name: "紙" },
  { id: "minecraft:experience_bottle", name: "エンチャントの瓶" },
  { id: "minecraft:spore_blossom", name: "胞子の花" },
  { id: "minecraft:moss_block", name: "苔ブロック" },
  { id: "minecraft:glow_berries", name: "グロウベリー" },
  { id: "minecraft:sweet_berries", name: "スイートベリー" },
  { id: "minecraft:honeycomb", name: "ハニカム" },
  { id: "minecraft:sculk_catalyst", name: "スカルクカタリスト" },
  { id: "minecraft:breeze_rod", name: "ブリーズロッド" },
  { id: "minecraft:wind_charge", name: "ウィンドチャージ" },
  { id: "minecraft:resin_clump", name: "樹脂の塊" },
  { id: "minecraft:heart_of_the_sea", name: "海洋の心" },
  { id: "minecraft:nautilus_shell", name: "オウムガイの殻" },
  { id: "minecraft:shulker_shell", name: "シュルカーの殻" },
  { id: "minecraft:totem_of_undying", name: "不死のトーテム" },
  { id: "minecraft:cod", name: "タラ" },
  { id: "minecraft:salmon", name: "鮭" },
  { id: "minecraft:wheat", name: "小麦" },
  { id: "minecraft:beef", name: "生の牛肉" },
  { id: "minecraft:chicken", name: "生の鶏肉" },
];

export const NAME_PREFIX = ["翠", "灰", "霜", "錆", "星", "淵", "苔", "琥珀", "夜", "銅", "骨", "嵐", "紅", "白", "幽", "硝子", "灯", "針", "金", "蒼"];

export const NAME_NOUN: Record<ArchetypeId, string[]> = {
  humanoid: ["行者", "巡礼", "影", "狩人", "亡者"],
  quadruped: ["狼", "獣", "牙", "獅子", "鹿"],
  flying: ["蛾", "鳥", "霊", "羽", "灯"],
  aquatic: ["眼", "魚", "淵", "鮫", "貝"],
  arachnid: ["蠍", "蜘蛛", "針", "殻", "鉗"],
  slime: ["粘", "核", "滴", "塊", "泥"],
  serpent: ["蛇", "龍", "鱗", "牙", "大蛇"],
  golem: ["守護", "像", "鐘", "柱", "鎧"],
  multi: ["嘆き", "三頭", "脊", "合唱", "骸"],
  tube: ["筒", "芽", "苔人", "胞子", "壺"],
  caster: ["詠み", "星見", "司書", "咒", "導師"],
  boss: ["王", "骸王", "古王", "覇", "主"],
};

export const NAME_EN: Record<ArchetypeId, string[]> = {
  humanoid: ["Pilgrim", "Walker", "Shade", "Hunter", "Husk"],
  quadruped: ["Wolf", "Beast", "Fang", "Lion", "Stag"],
  flying: ["Moth", "Bird", "Wisp", "Wing", "Lantern"],
  aquatic: ["Eye", "Koi", "Abyss", "Shark", "Shell"],
  arachnid: ["Scorpion", "Weaver", "Needle", "Carapace", "Claw"],
  slime: ["Slime", "Core", "Drop", "Blob", "Mud"],
  serpent: ["Serpent", "Wyrm", "Coil", "Scale", "Fang"],
  golem: ["Sentinel", "Idol", "Bell", "Pillar", "Armor"],
  multi: ["Lament", "Triad", "Spine", "Chorus", "Husk"],
  tube: ["Tube", "Sprout", "Moss", "Spore", "Urn"],
  caster: ["Cantor", "Stargazer", "Scribe", "Hex", "Tutor"],
  boss: ["King", "Regent", "Ancient", "Tyrant", "Lord"],
};

export const EN_PREFIX = ["Jade", "Ash", "Frost", "Rust", "Star", "Abyss", "Moss", "Amber", "Night", "Copper", "Bone", "Storm", "Crimson", "Pale", "Glass", "Lantern", "Needle", "Gold", "Pale"];
