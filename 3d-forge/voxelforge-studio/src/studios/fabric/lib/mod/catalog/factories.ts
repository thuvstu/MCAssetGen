import { DEFAULT_PROFILE } from "../targets";
import type {
  Action, AdvancementDef, BlockDef, Condition, CustomEffectDef, DropRule, ForgeStyleDef,
  ItemDef, MaterialDef, MobDef, ModProject, OreDef, ParamValue, RecipeDef, ShopDef,
  ShopTrade, SkillDef, SkillPointDef, StructureDef, WeaponForgeDef,
} from "../model";
import { defaultParams, newAction, uid } from "./actions";

export function newItem(modId: string): ItemDef {
  return {
    id: "new_item", kind: "simple", material: "IRON", attackDamage: 3, attackSpeed: -2.4,
    armorSlot: "CHESTPLATE", armorMaterial: "IRON", name: "New Item", texture: "minecraft:item/nether_star", model: "generated",
    bonusMaxHealth: 0, bonusMovementSpeed: 0, bonusArmor: 0, bonusToughness: 0, bonusKnockbackResistance: 0,
    maxCount: 64, durability: 0, rarity: "COMMON", fireproof: false, glint: false, food: null, skillId: null, tooltip: "",
  };
}

export function newBlock(): BlockDef {
  return {
    id: "new_block", ore: null, surface: null, name: "New Block", texture: "minecraft:block/stone", hardness: 2, resistance: 6, luminance: 0,
    sound: "STONE", tool: "pickaxe", toolTier: "none", requiresTool: false, skillId: null,
  };
}

export function newSkill(): SkillDef {
  return {
    id: "new_skill", name: "New Skill", description: "", cooldown: 5, manaCost: 10,
    trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [], actions: [newAction("message")],
  };
}

export function newRecipe(): RecipeDef {
  return { id: "new_recipe", type: "shaped", grid: Array(9).fill(""), resultItem: "", resultCount: 1 };
}

export function newForgeStyle(): ForgeStyleDef {
  return {
    id: "new_blade", name: "新しい剣の外見", texture: "minecraft:item/iron_sword", parent: "handheld",
    costItem: "minecraft:iron_ingot", costCount: 2,
    defaultDamage: 6, defaultSpeed: -2.4, defaultDurability: 250, defaultSkillId: "",
  };
}

export function newStructure(): StructureDef {
  return {
    id: "new_structure",
    name: "新しい構造物",
    description: "カスタムNBTまたは初期村",
    biomes: "#minecraft:is_overworld",
    spawnNearOrigin: true,
    spacing: 16,
    separation: 6,
    terrainAdaptation: "beard_thin",
    step: "surface_structures",
    includeShopForge: true,
  };
}

export function newWeaponForge(): WeaponForgeDef {
  return {
    enabled: false,
    styles: [
      { ...newForgeStyle(), id: "steel", name: "鋼鉄の刃" },
      { ...newForgeStyle(), id: "crystal", name: "結晶の刃", texture: "minecraft:item/diamond_sword", costItem: "minecraft:amethyst_shard", costCount: 4, defaultDamage: 8, defaultDurability: 500 },
    ],
  };
}

export function emptyProject(): ModProject {
  return {
    meta: {
      modId: "mymod", name: "My Mod", version: "1.0.0", author: "Me", description: "Created with MythicForge",
      packageName: "com.example.mymod", license: "MIT",
    },
    mana: { max: 100, regenPerSecond: 2 },
    items: [], blocks: [], skills: [], recipes: [], mobs: [], drops: [], materials: [], effects: [], advancements: [], shops: [], skillPoints: [], customImports: "",
    forge: newWeaponForge(),
    structures: [],
    config: { maxMana: 100, regenPerSecond: 2, hud: true, slots: ["", "", "", ""], slotKeys: [82, 71, 72, 86] },
  };
}

export function starterProject(name: string): ModProject {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/^[0-9]+/, "") || "mymod";
  const p = emptyProject();
  p.meta.modId = id;
  p.meta.name = name;
  p.meta.packageName = `com.example.${id.replace(/_/g, "")}`;
  p.meta.env = { profile: DEFAULT_PROFILE }; // 新規プロジェクトは 1.21.11 / Mojang マッピング
  const a = (type: string, params: Record<string, ParamValue>, children?: Action[]): Action => ({
    ...newAction(type), params: { ...defaultParams(type), ...params }, ...(children ? { children } : {}),
  });
  p.skills = [
    {
      id: "fire_blast", name: "ファイアブラスト", description: "視線の先の敵を焼き、爆発させる", cooldown: 6, manaCost: 25,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" },
      conditions: [{ uid: uid(), type: "HAS_TARGET", value: "" }],
      actions: [
        a("sound", { sound: "ITEM_FIRECHARGE_USE" }),
        a("particles", { target: "TARGET", particle: "FLAME", count: 40 }),
        a("damage", { target: "TARGET", amount: 8 }),
        a("ignite", { target: "TARGET", seconds: 6 }),
        a("delay", { ticks: 10 }, [a("explosion", { target: "TARGET", power: 1.5 }), a("message", { text: "ドカーン!" })]),
      ],
    },
    {
      id: "dash", name: "ダッシュ", description: "前方へ素早く移動する", cooldown: 3, manaCost: 10,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("launch", { target: "SELF", power: 2.2, up: 0.2 }), a("particles", { target: "SELF", particle: "CLOUD", count: 15 }), a("sound", { sound: "ENTITY_ENDERMAN_TELEPORT", pitch: 1.5 })],
    },
    {
      id: "vampire_touch", name: "吸血", description: "敵を倒すと体力を回復する", cooldown: 0, manaCost: 0,
      trigger: { type: "KILL_ENTITY", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("heal", { target: "SELF", amount: 4 }), a("particles", { target: "SELF", particle: "HEART", count: 6 })],
    },
  ];
  const mythril = (extra: Partial<ItemDef>): ItemDef => ({ ...newItem(id), kind: "armor", armorMaterial: "IRON", durability: 0, maxCount: 1, rarity: "RARE", model: "generated", ...extra });
  p.skills.push(
    {
      id: "arcane_missile", name: "アーケインミサイル", description: "魔力の弾を撃ち、着弾点で範囲爆発する", cooldown: 2, manaCost: 20,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("sound", { sound: "ENTITY_ILLUSIONER_CAST_SPELL" }), a("missile", { particle: "END_ROD", speed: 1.4, gravity: 0, hitRadius: 0.6, lifetime: 40, onHitSkill: "arcane_impact" })],
    },
    {
      id: "arcane_impact", name: "アーケイン着弾", description: "ミサイルの着弾点で範囲ダメージ", cooldown: 0, manaCost: 0,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [
        a("ring", { target: "POINT", ringRadius: 3, particle: "END_ROD", points: 28 }),
        a("sound", { sound: "ENTITY_GENERIC_EXPLODE", pitch: 1.4, volume: 0.8 }),
        a("damage", { target: "POINT", radius: 4, amount: 8 }),
        a("explosion", { target: "POINT", power: 1.2 }),
      ],
    },
    {
      id: "combo_strike", name: "コンボストライク", description: "5回連続で当てると雷が落ちる", cooldown: 0, manaCost: 0,
      trigger: { type: "ATTACK_ENTITY", intervalSec: 10, heldItem: `${id}:mythic_blade` }, conditions: [],
      actions: [
        a("addVar", { scope: "SELF", name: "combo", amount: 1, min: 0, max: 5 }),
        a("message", { text: "コンボ <var.combo>/5", actionBar: true }),
        a("ifVar", { scope: "SELF", name: "combo", min: 5, max: 1000000 }, [
          a("lightning", { target: "TARGET" }),
          a("damage", { target: "TARGET", amount: 6 }),
          a("title", { text: "COMBO!", subtitle: "<player> の連撃" }),
          a("setVar", { scope: "SELF", name: "combo", value: 0 }),
        ]),
      ],
    },
    {
      id: "mythril_bonus", name: "ミスリルの加護", description: "ミスリルの胸当てを着ている間、速度と暗視を得る", cooldown: 0, manaCost: 0,
      trigger: { type: "WEAR", intervalSec: 4, heldItem: `${id}:mythril_chestplate` }, conditions: [],
      actions: [a("effect", { target: "SELF", effect: "SPEED", seconds: 8, amplifier: 0 }), a("effect", { target: "SELF", effect: "NIGHT_VISION", seconds: 12, amplifier: 0 })],
    },
  );
  p.config.slots = ["fire_blast", "dash", "arcane_missile", ""];
  p.items = [
    { ...newItem(id), id: "mythic_blade", name: "神話の剣", kind: "sword", material: "DIAMOND", attackDamage: 4, attackSpeed: -2.4, durability: 1561, texture: "minecraft:item/diamond_sword", model: "handheld", maxCount: 1, rarity: "EPIC", skillId: null, tooltip: "5連撃で雷が落ちる" },
    { ...newItem(id), id: "mana_robe", name: "マナのローブ", kind: "armor", armorSlot: "CHESTPLATE", armorMaterial: "IRON", durability: 240, texture: "minecraft:item/iron_chestplate", maxCount: 1, rarity: "RARE", glint: true, tooltip: "身にまとうだけで魔力がみなぎる" },
    { ...newItem(id), id: "fire_staff", name: "炎の杖", texture: "minecraft:item/blaze_rod", model: "handheld", maxCount: 1, rarity: "RARE", glint: true, skillId: "fire_blast", tooltip: "右クリックでファイアブラスト" },
    { ...newItem(id), id: "arcane_staff", name: "アーケインスタッフ", texture: "minecraft:item/amethyst_shard", model: "handheld", maxCount: 1, rarity: "EPIC", glint: true, skillId: "arcane_missile", tooltip: "MP20を消費し、着弾点で範囲爆発するミサイルを撃つ" },
    { ...newItem(id), id: "wind_boots_charm", name: "疾風のお守り", texture: "minecraft:item/amethyst_shard", maxCount: 1, rarity: "UNCOMMON", skillId: "dash", tooltip: "右クリックでダッシュ" },
    { ...newItem(id), id: "mana_fruit", name: "マナの実", texture: "minecraft:item/golden_apple", food: { nutrition: 4, saturation: 0.6 }, tooltip: "" },
    { ...newItem(id), id: "mythril_ingot", name: "ミスリルのインゴット", texture: "minecraft:item/iron_ingot", rarity: "UNCOMMON" },
    mythril({ id: "mythril_helmet", name: "ミスリルのヘルメット", armorSlot: "HELMET", texture: "minecraft:item/iron_helmet" }),
    mythril({ id: "mythril_chestplate", name: "ミスリルの胸当て", armorSlot: "CHESTPLATE", texture: "minecraft:item/iron_chestplate", glint: true, tooltip: "装備中は速度と暗視を得る" }),
    mythril({ id: "mythril_leggings", name: "ミスリルのレギンス", armorSlot: "LEGGINGS", texture: "minecraft:item/iron_leggings" }),
    mythril({ id: "mythril_boots", name: "ミスリルのブーツ", armorSlot: "BOOTS", texture: "minecraft:item/iron_boots" }),
  ];
  p.blocks = [
    { ...newBlock(), id: "mana_crystal_block", name: "マナ結晶ブロック", texture: "minecraft:block/amethyst_block", luminance: 10, sound: "AMETHYST_BLOCK", hardness: 3 },
    {
      ...newBlock(), id: "mythril_ore", name: "ミスリル鉱石", texture: "minecraft:block/iron_ore", hardness: 3, resistance: 3, requiresTool: true, toolTier: "stone",
      ore: { ...newOre(), dropItem: `${id}:mythril_ingot`, dropMin: 1, dropMax: 2, xpMin: 1, xpMax: 3, veinSize: 6, veinsPerChunk: 7, minY: -64, maxY: 32 },
    },
  ];
  const ing = `${id}:mythril_ingot`;
  p.recipes = [
    { id: "fire_staff", type: "shaped", grid: ["", "minecraft:blaze_powder", "minecraft:blaze_rod", "", "minecraft:blaze_rod", "minecraft:blaze_powder", "minecraft:blaze_rod", "", ""], resultItem: `${id}:fire_staff`, resultCount: 1 },
    { id: "arcane_staff", type: "shaped", grid: ["", ing, "minecraft:amethyst_shard", "", "minecraft:stick", ing, "minecraft:stick", "", ""], resultItem: `${id}:arcane_staff`, resultCount: 1 },
    { id: "mythril_chestplate", type: "shaped", grid: [ing, "", ing, ing, ing, ing, ing, ing, ing], resultItem: `${id}:mythril_chestplate`, resultCount: 1 },
    { id: "mythril_helmet", type: "shaped", grid: [ing, ing, ing, ing, "", ing, "", "", ""], resultItem: `${id}:mythril_helmet`, resultCount: 1 },
    { id: "mythril_leggings", type: "shaped", grid: [ing, ing, ing, ing, "", ing, ing, "", ing], resultItem: `${id}:mythril_leggings`, resultCount: 1 },
    { id: "mythril_boots", type: "shaped", grid: ["", "", "", ing, "", ing, ing, "", ing], resultItem: `${id}:mythril_boots`, resultCount: 1 },
  ];
  // ---- 拡張システム (エフェクト / 実績 / ショップ / スキルポイント / 素材) ----
  p.materials = [{ id: "mythril", name: "ミスリル", baseMaterial: "IRON", damageMultiplier: 1.3, speedMultiplier: 1.2, durabilityMultiplier: 1.5, description: "軽くて硬い魔法金属。攻撃力+30% / 採掘+20% / 耐久+50%" }];
  const blade = p.items.find((x) => x.id === "mythic_blade");
  if (blade) blade.materialId = "mythril";
  const chest = p.items.find((x) => x.id === "mythril_chestplate");
  if (chest) { chest.bonusMaxHealth = 4; chest.bonusKnockbackResistance = 0.1; chest.tooltip = "装備中は速度と暗視を得る\n最大HP+4 / ノックバック耐性+10%"; }
  const helmet = p.items.find((x) => x.id === "mythril_helmet");
  if (helmet) { helmet.bonusMovementSpeed = 0.01; helmet.materialId = "mythril"; }
  p.items.push({ ...newItem(id), id: "phoenix_feather", name: "不死鳥の羽", texture: "minecraft:item/feather", maxCount: 4, rarity: "EPIC", glint: true, skillId: "second_wind_cast", tooltip: "右クリックで60秒間「セカンドウィンド」\n致死ダメージを受けると復活する" });
  p.skills.push(
    {
      id: "second_wind_cast", name: "セカンドウィンド", description: "致死ダメージを一度だけ無効化するエフェクトを得る", cooldown: 120, manaCost: 40,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("customEffect", { target: "SELF", effectId: "second_wind", seconds: 60, amplifier: 0 }), a("spiral", { target: "SELF", particle: "TOTEM_OF_UNDYING", radius: 1.2, height: 2.4 }), a("message", { text: "不死鳥の加護が宿った…", actionBar: true })],
    },
    {
      id: "second_wind_burst", name: "不死鳥の復活", description: "セカンドウィンドで復活した時に発動", cooldown: 0, manaCost: 0,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("ring", { target: "SELF", ringRadius: 3, particle: "FLAME", points: 32 }), a("explosion", { target: "SELF", power: 0.1 }), a("restoreMana", { amount: 50 }), a("title", { text: "REBORN", subtitle: "<player> は不死鳥の力で蘇った" }), a("advance", { advId: "reborn", amount: 1 })],
    },
    {
      id: "arcane_focus_tick", name: "魔力集中", description: "エフェクト中、毎秒マナを回復", cooldown: 0, manaCost: 0,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("restoreMana", { amount: 4 })],
    },
    {
      id: "kill_reward", name: "討伐報酬", description: "敵を倒すとスキルポイントと実績進捗を得る", cooldown: 0, manaCost: 0,
      trigger: { type: "KILL_ENTITY", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("chance", { percent: 25 }, [a("grantSkillPoints", { points: 1 })])],
    },
  );
  p.effects = [
    { id: "second_wind", name: "セカンドウィンド", color: "#ffb347", category: "BENEFICIAL", tickSkillId: "", intervalTicks: 40, revive: true, reviveHealth: 10, reviveSkillId: "second_wind_burst" },
    { id: "arcane_focus", name: "魔力集中", color: "#66ccff", category: "BENEFICIAL", tickSkillId: "arcane_focus_tick", intervalTicks: 20, revive: false, reviveHealth: 4, reviveSkillId: "" },
  ];
  p.advancements = [
    { id: "first_mythril", name: "ミスリルを手にした", description: "ミスリルのインゴットを入手する", icon: `${id}:mythril_ingot`, frame: "task", parent: "", kind: "OBTAIN_ITEM", item: `${id}:mythril_ingot`, mob: "", steps: 1, rewardXp: 20, hidden: false },
    { id: "slayer", name: "ゾンビ・スレイヤー", description: "ゾンビを10体倒す (進捗が実績画面に表示されます)", icon: "minecraft:iron_sword", frame: "goal", parent: "first_mythril", kind: "KILL_MOB", item: "", mob: "minecraft:zombie", steps: 10, rewardXp: 60, hidden: false },
    { id: "reborn", name: "不死鳥の再誕", description: "セカンドウィンドで死から蘇る", icon: `${id}:phoenix_feather`, frame: "challenge", parent: "slayer", kind: "MANUAL", item: "", mob: "", steps: 1, rewardXp: 200, hidden: true },
  ];
  p.shops = [{
    id: "adventurer", name: "冒険者の店", openedByBlockId: "mana_crystal_block",
    trades: [
      { id: "t1", offerItem: `${id}:fire_staff`, offerCount: 1, requiredItem1: `${id}:mythril_ingot`, requiredCount1: 8, requiredItem2: "", requiredCount2: 0 },
      { id: "t2", offerItem: `${id}:mana_fruit`, offerCount: 3, requiredItem1: "minecraft:emerald", requiredCount1: 2, requiredItem2: "", requiredCount2: 0 },
      { id: "t3", offerItem: `${id}:phoenix_feather`, offerCount: 1, requiredItem1: "minecraft:nether_star", requiredCount1: 1, requiredItem2: `${id}:mythril_ingot`, requiredCount2: 4 },
    ],
  }];
  p.skillPoints = [
    { id: "vitality", name: "生命力", description: "最大HP +2 (ハート1個)", cost: 1, effect: "INCREASE_MAX_HEALTH", amount: 2 },
    { id: "power", name: "剛力", description: "攻撃力 +0.5", cost: 1, effect: "INCREASE_DAMAGE", amount: 0.5 },
    { id: "swiftness", name: "俊敏", description: "移動速度 +0.004", cost: 2, effect: "INCREASE_SPEED", amount: 0.004 },
    { id: "wisdom", name: "叡智", description: "最大マナ +10", cost: 1, effect: "INCREASE_MAX_MANA", amount: 10 },
    { id: "fortune", name: "幸運", description: "幸運 +0.5", cost: 2, effect: "INCREASE_LUCK", amount: 0.5 },
  ];
  const crystal = p.blocks.find((x) => x.id === "mana_crystal_block");
  if (crystal) crystal.surface = { biomeTag: "minecraft:is_mountain", rarity: 14, tries: 6, spread: 3 };
  p.mobs = [{ id: "blood_slime", name: "ブラッドスライム", baseMob: "MAGMA_CUBE", maxHealth: 40, movementSpeed: 0.4, attackDamage: 6, drops: [{ item: "minecraft:redstone", countMin: 1, countMax: 3, chance: 0.8 }, { item: `${id}:mythril_ingot`, countMin: 1, countMax: 1, chance: 0.15 }], behavior: "hostile" }];
  p.drops = [{ id: "zombie_loot", name: "ゾンビの落とし物", targetMob: "minecraft:zombie", items: [{ id: "minecraft:emerald", min: 1, max: 2, chance: 0.3 }] }];
  p.forge.enabled = true;
  p.forge.styles[1].defaultSkillId = "fire_blast";
  p.structures = [
    {
      id: "starter_village",
      name: "冒険者の初期村 (鍛冶工房 & 交易所)",
      description: "スポーン地点付近に自動生成される石レンガ建築。ショップや武器工房を備えた初期拠点",
      biomes: "#minecraft:is_overworld",
      spawnNearOrigin: true,
      spacing: 12,
      separation: 4,
      terrainAdaptation: "beard_thin",
      step: "surface_structures",
      includeShopForge: true,
    },
  ];
  return p;
}

/** アーキタイプ別の完成プリセット (スキル・アイテム・ブロック・レシピ入り) */
export function presetProject(name: string, kind: "ice" | "holy" | "ninja" | "knight"): ModProject {
  const p = starterProject(name);
  // スターター固有の拡張データ (ミスリル素材のショップ・実績等) は引き継がない
  p.mobs = []; p.drops = []; p.materials = []; p.effects = []; p.advancements = []; p.shops = []; p.skillPoints = []; p.structures = [];
  p.forge = newWeaponForge();
  const a = (type: string, params: Record<string, ParamValue>, children?: Action[]): Action => ({
    ...newAction(type), params: { ...defaultParams(type), ...params }, ...(children ? { children } : {}),
  });
  const id = p.meta.modId;

  if (kind === "ice") {
    p.meta.name = name || "Frost Legacy";
    p.skills = [
      { id: "frost_nova", name: "フロストノヴァ", description: "周囲の敵を凍結させダメージを与える", cooldown: 8, manaCost: 30,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
        actions: [a("sound", { sound: "ENTITY_PLAYER_LEVELUP", pitch: 0.6 }), a("particles", { target: "SELF", particle: "SNOWFLAKE", count: 60 }),
          a("effect", { target: "AREA", radius: 6, effect: "SLOWNESS", seconds: 6, amplifier: 3 }), a("damage", { target: "AREA", radius: 6, amount: 5 })] },
      { id: "blizzard", name: "ブリザード", description: "視線の敵へ連続した冷気", cooldown: 12, manaCost: 40,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [{ uid: uid(), type: "HAS_TARGET", value: "" }],
        actions: [a("repeat", { times: 5, interval: 6 }, [a("damage", { target: "TARGET", amount: 2 }), a("particles", { target: "TARGET", particle: "SNOWFLAKE", count: 12 })]),
          a("effect", { target: "TARGET", effect: "SLOWNESS", seconds: 8, amplifier: 2 })] },
      { id: "glacial_step", name: "グラシアルステップ", description: "氷の上のように素早く滑る", cooldown: 4, manaCost: 15,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
        actions: [a("launch", { target: "SELF", power: 2.6, up: 0.1 }), a("effect", { target: "SELF", effect: "SPEED", seconds: 6, amplifier: 1 }), a("particles", { target: "SELF", particle: "CLOUD", count: 20 })] },
      { id: "ice_lance", name: "アイスランス", description: "氷の槍を放ち、着弾点を凍結させる", cooldown: 3, manaCost: 22,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
        actions: [a("sound", { sound: "ENTITY_ILLUSIONER_CAST_SPELL", pitch: 1.4 }), a("missile", { particle: "SNOWFLAKE", speed: 1.8, gravity: 0.01, hitRadius: 0.5, lifetime: 50, onHitSkill: "ice_burst" })] },
      { id: "ice_burst", name: "アイスバースト", description: "着弾点の周囲を凍らせる", cooldown: 0, manaCost: 0,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
        actions: [a("ring", { target: "POINT", ringRadius: 3.5, particle: "SNOWFLAKE", points: 32 }), a("damage", { target: "POINT", radius: 3.5, amount: 6 }), a("effect", { target: "POINT", radius: 3.5, effect: "SLOWNESS", seconds: 5, amplifier: 2 }), a("sound", { sound: "BLOCK_ANVIL_LAND", pitch: 1.8, volume: 0.6 })] },
      { id: "cold_blooded", name: "冷却的心臓", description: "氷水に浸かると自然治癒する体質", cooldown: 0, manaCost: 0,
        trigger: { type: "PERIODIC", intervalSec: 5, heldItem: "" }, conditions: [{ uid: uid(), type: "IN_WATER", value: "" }],
        actions: [a("heal", { target: "SELF", amount: 1 })] },
    ];
    p.config.slots = ["frost_nova", "blizzard", "glacial_step", "ice_lance"];
    p.items = [
      { ...newItem(id), id: "frost_scepter", name: "氷結の杖", kind: "simple", texture: "minecraft:item/blaze_rod", maxCount: 1, rarity: "RARE", glint: true, skillId: "frost_nova", tooltip: "右クリックでフロストノヴァ" },
      { ...newItem(id), id: "ice_blade", name: "氷刃", kind: "sword", material: "DIAMOND", attackDamage: 4, attackSpeed: -2.4, durability: 1561, texture: "minecraft:item/diamond_sword", model: "handheld", rarity: "EPIC", tooltip: "冷気が纏わりつく刃" },
      { ...newItem(id), id: "frost_core", name: "霜の核", texture: "minecraft:item/heart_of_the_sea", maxCount: 16, rarity: "UNCOMMON" },
    ];
    p.blocks = [{ ...newBlock(), id: "permafrost_block", name: "永久凍土ブロック", texture: "minecraft:block/packed_ice", hardness: 3, resistance: 6, sound: "GLASS" }];
    p.recipes = [{ id: "frost_scepter", type: "shaped", grid: ["", "minecraft:heart_of_the_sea", "minecraft:blue_ice", "", "minecraft:stick", "minecraft:heart_of_the_sea", "minecraft:stick", "", ""], resultItem: `${id}:frost_scepter`, resultCount: 1 }];
    return p;
  }

  if (kind === "holy") {
    p.meta.name = name || "Sanctum";
    p.skills = [
      { id: "divine_light", name: "ディバインライト", description: "自分と周囲の味方を大きく回復", cooldown: 10, manaCost: 35,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
        actions: [a("sound", { sound: "BLOCK_BEACON_ACTIVATE" }), a("particles", { target: "SELF", particle: "TOTEM_OF_UNDYING", count: 30 }), a("heal", { target: "SELF", amount: 8 }), a("effect", { target: "SELF", effect: "REGENERATION", seconds: 8, amplifier: 1 })] },
      { id: "aegis", name: "イージス", description: "一定時間被ダメージを軽減する聖なる結界", cooldown: 20, manaCost: 45,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
        actions: [a("effect", { target: "SELF", effect: "RESISTANCE", seconds: 12, amplifier: 2 }), a("effect", { target: "SELF", effect: "ABSORPTION", seconds: 12, amplifier: 2 }), a("particles", { target: "SELF", particle: "END_ROD", count: 24 })] },
      { id: "smite", name: "スマイト", description: "視線の敵に聖なる雷を落とす", cooldown: 15, manaCost: 40,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [{ uid: uid(), type: "HAS_TARGET", value: "" }],
        actions: [a("lightning", { target: "TARGET" }), a("damage", { target: "TARGET", amount: 10 }), a("sound", { sound: "ENTITY_LIGHTNING_BOLT_THUNDER" })] },
      { id: "guardian_angel", name: "守護天使", description: "ピンチになると自動で回復する", cooldown: 5, manaCost: 20,
        trigger: { type: "TAKE_DAMAGE", intervalSec: 5, heldItem: "" }, conditions: [{ uid: uid(), type: "HEALTH_BELOW", value: "40" }],
        actions: [a("heal", { target: "SELF", amount: 6 }), a("particles", { target: "SELF", particle: "HEART", count: 12 }), a("message", { text: "守護天使があなたを救った", actionBar: true })] },
    ];
    p.config.slots = ["divine_light", "aegis", "smite", ""];
    p.items = [
      { ...newItem(id), id: "holy_relic", name: "聖遺物", texture: "minecraft:item/nether_star", maxCount: 1, rarity: "EPIC", glint: true, skillId: "divine_light", tooltip: "右クリックでディバインライト" },
      { ...newItem(id), id: "sanctum_plate", name: "聖堂の鎧", kind: "armor", armorSlot: "CHESTPLATE", armorMaterial: "DIAMOND", durability: 528, texture: "minecraft:item/diamond_chestplate", maxCount: 1, rarity: "RARE", tooltip: "祝福された鎧" },
      { ...newItem(id), id: "blessed_ingot", name: "祝福のインゴット", texture: "minecraft:item/gold_ingot", maxCount: 64, rarity: "UNCOMMON" },
    ];
    p.blocks = [{ ...newBlock(), id: "altar_block", name: "祭壇ブロック", texture: "minecraft:block/quartz_block", hardness: 2, resistance: 9, luminance: 12, sound: "STONE", skillId: "divine_light" }];
    p.recipes = [{ id: "holy_relic", type: "shapeless", grid: ["minecraft:nether_star", "minecraft:gold_ingot", `${id}:blessed_ingot`], resultItem: `${id}:holy_relic`, resultCount: 1 }];
    return p;
  }

  if (kind === "knight") {
    p.meta.name = name || "Dark Knight";
    p.skills = [
      { id: "shield_bash", name: "シールドバッシュ", description: "目の前の敵を殴り飛ばす", cooldown: 5, manaCost: 15,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [{ uid: uid(), type: "HAS_TARGET", value: "" }],
        actions: [a("sound", { sound: "ENTITY_PLAYER_ATTACK_SWEEP" }), a("launch", { target: "TARGET", power: 1.8, up: 0.35 }), a("damage", { target: "TARGET", amount: 4 }), a("particles", { target: "TARGET", particle: "CRIT", count: 10 })] },
      { id: "war_cry", name: "ウォークライ", description: "雄叫びで味方を鼓舞し、敵を怯ませる", cooldown: 20, manaCost: 30,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
        actions: [a("title", { text: "WAR CRY", subtitle: "全軍、続け!" }), a("sound", { sound: "ENTITY_ENDER_DRAGON_GROWL", pitch: 1.4, volume: 0.7 }), a("effect", { target: "SELF", effect: "STRENGTH", seconds: 12, amplifier: 1 }), a("ring", { target: "SELF", ringRadius: 4, particle: "ANGRY_VILLAGER", points: 24 })] },
      { id: "execute", name: "処刑", description: "体力30%以下の敵への攻撃時に大ダメージ", cooldown: 0, manaCost: 0,
        trigger: { type: "ATTACK_ENTITY", intervalSec: 10, heldItem: "" }, conditions: [{ uid: uid(), type: "TARGET_HEALTH_BELOW", value: "30" }],
        actions: [a("chance", { percent: 60 }, [a("damage", { target: "TARGET", amount: 10 }), a("sound", { sound: "BLOCK_ANVIL_LAND", pitch: 1.6, volume: 0.8 }), a("message", { text: "処刑!", actionBar: true })])] },
      { id: "thorns", name: "報復の炎", description: "ダメージを受けると30%で周囲に反撃", cooldown: 2, manaCost: 0,
        trigger: { type: "TAKE_DAMAGE", intervalSec: 5, heldItem: "" }, conditions: [],
        actions: [a("chance", { percent: 30 }, [a("damage", { target: "AREA", radius: 3, amount: 3 }), a("particles", { target: "SELF", particle: "FLAME", count: 24 }), a("ignite", { target: "AREA", radius: 3, seconds: 3 })])] },
      { id: "last_stand", name: "ラストスタンド", description: "ピンチの時だけ使える背水の陣", cooldown: 60, manaCost: 20,
        trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [{ uid: uid(), type: "HEALTH_BELOW", value: "40" }],
        actions: [a("effect", { target: "SELF", effect: "RESISTANCE", seconds: 10, amplifier: 2 }), a("effect", { target: "SELF", effect: "ABSORPTION", seconds: 30, amplifier: 2 }), a("heal", { target: "SELF", amount: 4 }), a("title", { text: "LAST STAND", subtitle: "" })] },
      { id: "dark_plate_bonus", name: "暗黒騎士の威厳", description: "暗黒騎士の胸当て装備中は耐性と攻撃上昇", cooldown: 0, manaCost: 0,
        trigger: { type: "WEAR", intervalSec: 4, heldItem: "knight:dark_chestplate" }, conditions: [],
        actions: [a("effect", { target: "SELF", effect: "RESISTANCE", seconds: 8, amplifier: 0 }), a("effect", { target: "SELF", effect: "STRENGTH", seconds: 8, amplifier: 0 })] },
    ];
    p.config.slots = ["shield_bash", "war_cry", "last_stand", ""];
    const dark = (extra: Partial<ItemDef>): ItemDef => ({ ...newItem(id), kind: "armor", armorMaterial: "NETHERITE", armorSlot: "CHESTPLATE", durability: 0, maxCount: 1, rarity: "EPIC", materialId: "dark_steel", ...extra });
    p.items = [
      { ...newItem(id), id: "dark_blade", name: "暗黒剣", kind: "sword", material: "NETHERITE", materialId: "dark_steel", attackDamage: 5, attackSpeed: -2.4, durability: 0, texture: "minecraft:item/netherite_sword", model: "handheld", maxCount: 1, rarity: "EPIC", glint: true, leftClickSkillId: null, tooltip: "処刑は攻撃時に自動発動" },
      dark({ id: "dark_helmet", name: "暗黒騎士の兜", armorSlot: "HELMET", texture: "minecraft:item/netherite_helmet" }),
      dark({ id: "dark_chestplate", name: "暗黒騎士の胸当て", armorSlot: "CHESTPLATE", texture: "minecraft:item/netherite_chestplate", bonusMaxHealth: 4, tooltip: "装備中は耐性と攻撃上昇" }),
      dark({ id: "dark_leggings", name: "暗黒騎士の腿当て", armorSlot: "LEGGINGS", texture: "minecraft:item/netherite_leggings" }),
      dark({ id: "dark_boots", name: "暗黒騎士の脛当て", armorSlot: "BOOTS", texture: "minecraft:item/netherite_boots", bonusKnockbackResistance: 0.1 }),
      { ...newItem(id), id: "dark_steel_ingot", name: "暗黒鋼インゴット", texture: "minecraft:item/netherite_ingot", maxCount: 64, rarity: "RARE" },
      { ...newItem(id), id: "war_horn", name: "戦争の角笛", texture: "minecraft:item/goat_horn", maxCount: 1, rarity: "RARE", skillId: "war_cry", tooltip: "右クリックでウォークライ" },
    ];
    p.blocks = [{ ...newBlock(), id: "dark_steel_block", name: "暗黒鋼ブロック", texture: "minecraft:block/netherite_block", hardness: 6, resistance: 1200, sound: "NETHERITE_BLOCK", tool: "pickaxe", toolTier: "diamond", requiresTool: true }];
    p.materials = [{ id: "dark_steel", name: "暗黒鋼", baseMaterial: "NETHERITE", damageMultiplier: 1.25, speedMultiplier: 1.1, durabilityMultiplier: 1.4, description: "攻撃+25% / 耐久+40%" }];
    p.mobs = [{ id: "dark_squire", name: "暗黒の見習い", baseMob: "VINDICATOR", maxHealth: 30, movementSpeed: 0.32, attackDamage: 6, drops: [{ item: `${id}:dark_steel_ingot`, countMin: 1, countMax: 2, chance: 0.5 }], behavior: "hostile" }];
    p.drops = [{ id: "knight_loot", name: "騎士狩り", targetMob: "minecraft:vindicator", items: [{ id: `${id}:dark_steel_ingot`, min: 1, max: 1, chance: 0.2 }] }];
    const ing = `${id}:dark_steel_ingot`;
    p.recipes = [
      { id: "dark_blade", type: "shaped", grid: ["", ing, "", "", ing, "", "minecraft:stick", "", ""], resultItem: `${id}:dark_blade`, resultCount: 1 },
      { id: "dark_chestplate", type: "shaped", grid: [ing, "", ing, ing, ing, ing, ing, ing, ing], resultItem: `${id}:dark_chestplate`, resultCount: 1 },
      { id: "dark_helmet", type: "shaped", grid: [ing, ing, ing, ing, "", ing, "", "", ""], resultItem: `${id}:dark_helmet`, resultCount: 1 },
      { id: "dark_leggings", type: "shaped", grid: [ing, ing, ing, ing, "", ing, ing, "", ing], resultItem: `${id}:dark_leggings`, resultCount: 1 },
      { id: "dark_boots", type: "shaped", grid: ["", "", "", ing, "", ing, ing, "", ing], resultItem: `${id}:dark_boots`, resultCount: 1 },
      { id: "dark_steel_ingot", type: "shapeless", grid: [ing, ing, ing, ing, ing, ing, ing, ing, ing], resultItem: `${id}:dark_steel_block`, resultCount: 1 },
      { id: "war_horn", type: "shapeless", grid: ["minecraft:goat_horn", ing], resultItem: `${id}:war_horn`, resultCount: 1 },
    ];
    return p;
  }

  p.meta.name = name || "Shadow Craft";
  p.skills = [
    { id: "shunpo", name: "瞬歩", description: "前方へ高速で移動し、短時間高速化", cooldown: 3, manaCost: 12,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("blink", { distance: 10 }), a("effect", { target: "SELF", effect: "SPEED", seconds: 4, amplifier: 2 }), a("particles", { target: "SELF", particle: "CLOUD", count: 10 }), a("sound", { sound: "ENTITY_ENDERMAN_TELEPORT", pitch: 1.6 })] },
    { id: "shuriken", name: "手裏剣", description: "視線の敵へ素早く3連撃", cooldown: 6, manaCost: 18,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [{ uid: uid(), type: "HAS_TARGET", value: "" }],
      actions: [a("sound", { sound: "ENTITY_PLAYER_ATTACK_SWEEP" }), a("repeat", { times: 3, interval: 5 }, [a("damage", { target: "TARGET", amount: 3 }), a("particles", { target: "TARGET", particle: "CRIT", count: 8 })])] },
    { id: "shadow_veil", name: "影纏い", description: "夜間・暗所で透明化と発光無効", cooldown: 25, manaCost: 50,
      trigger: { type: "MANUAL", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("effect", { target: "SELF", effect: "INVISIBILITY", seconds: 15, amplifier: 0 }), a("effect", { target: "SELF", effect: "NIGHT_VISION", seconds: 15, amplifier: 0 }), a("particles", { target: "SELF", particle: "SMOKE", count: 30 })] },
    { id: "assassinate", name: "暗殺", description: "背後から敵を倒すと体力を回復", cooldown: 0, manaCost: 0,
      trigger: { type: "KILL_ENTITY", intervalSec: 10, heldItem: "" }, conditions: [],
      actions: [a("heal", { target: "SELF", amount: 6 }), a("restoreMana", { amount: 15 }), a("particles", { target: "SELF", particle: "SWEEP_ATTACK", count: 5 })] },
  ];
  p.config.slots = ["shunpo", "shuriken", "shadow_veil", ""];
  p.items = [
    { ...newItem(id), id: "shadow_kunai", name: "影の苦無", kind: "sword", material: "IRON", attackDamage: 3, attackSpeed: -1.6, durability: 250, texture: "minecraft:item/iron_sword", model: "handheld", maxCount: 1, rarity: "RARE", tooltip: "素早く連続攻撃できる" },
    { ...newItem(id), id: "ninja_hood", name: "忍びの頭巾", kind: "armor", armorSlot: "HELMET", armorMaterial: "LEATHER", durability: 220, texture: "minecraft:item/leather_helmet", maxCount: 1, rarity: "UNCOMMON" },
    { ...newItem(id), id: "smoke_bomb", name: "煙玉", texture: "minecraft:item/fire_charge", maxCount: 16, skillId: "shadow_veil", tooltip: "右クリックで影纏い" },
  ];
  p.blocks = [{ ...newBlock(), id: "shadow_pad", name: "影の踏板", texture: "minecraft:block/black_wool", hardness: 0.8, resistance: 2, sound: "WOOL" }];
  p.recipes = [{ id: "smoke_bomb", type: "shapeless", grid: ["minecraft:coal", "minecraft:gunpowder", "minecraft:paper"], resultItem: `${id}:smoke_bomb`, resultCount: 3 }];
  return p;
}

export function newOre(): OreDef {
  return {
    dropItem: "", dropMin: 1, dropMax: 1, fortune: true, silkTouch: true, explosionDecay: true,
    xpMin: 0, xpMax: 0, dimension: "OVERWORLD", veinSize: 8, veinsPerChunk: 8, minY: -64, maxY: 64, biomeTag: "",
  };
}

/** 保存済みの古いプロジェクトに新フィールドを補完する */
export function normalizeProject(raw: Partial<ModProject>): ModProject {
  const normRecipe = (r: any): RecipeDef => ({ ...newRecipe(), ...r });
  const base = emptyProject();
  const items = (raw.items ?? []).map((it) => ({ ...newItem(raw.meta?.modId ?? base.meta.modId), bonusMaxHealth: 0, bonusMovementSpeed: 0, bonusArmor: 0, bonusToughness: 0, bonusKnockbackResistance: 0, ...it }));
  const blocks = (raw.blocks ?? []).map((b) => ({ ...newBlock(), ...b, ore: b.ore ? { ...newOre(), ...b.ore } : null, surface: b.surface ?? null }));
  const slots = [...(raw.config?.slots ?? []), "", "", "", ""].slice(0, 4);
  const keys = [...(raw.config?.slotKeys ?? []), ...base.config.slotKeys].slice(0, 4);
  const out = {
    ...base,
    ...raw,
    meta: { ...base.meta, ...raw.meta },
    mana: { ...base.mana, ...raw.mana },
    items,
    blocks,
    skills: (raw.skills ?? []).map((s) => ({ ...s, trigger: { ...newSkill().trigger, ...s.trigger }, conditions: s.conditions ?? [], actions: s.actions ?? [] })),
    recipes: (raw.recipes ?? []).map(normRecipe),
    mobs: (raw.mobs ?? []).map((m) => ({ ...newMob(), ...m, drops: m.drops ?? [] })),
    drops: (raw.drops ?? []).map((d) => ({ ...newDropRule(), ...d, items: d.items ?? [] })),
    materials: (raw.materials ?? []).map((m) => ({ ...newMaterial(), ...m })),
    effects: (raw.effects ?? []).map((e) => ({ ...newEffect(), ...e })),
    advancements: (raw.advancements ?? []).map((a) => ({ ...newAdvancement(), ...a })),
    shops: (raw.shops ?? []).map((s) => ({ ...newShop(), ...s, trades: (s.trades ?? []).map((t) => ({ ...newTrade(), ...t })) })),
    skillPoints: (raw.skillPoints ?? []).map((s) => ({ ...newSkillPoint(), ...s })),
    forge: {
      ...base.forge,
      ...raw.forge,
      styles: (raw.forge?.styles ?? base.forge.styles).map((s) => ({ ...newForgeStyle(), ...s })),
    },
    structures: (raw.structures ?? []).map((st) => ({ ...newStructure(), ...st })),
    customImports: raw.customImports ?? "",
    config: { ...base.config, ...raw.config, slots, slotKeys: keys },
  } as ModProject;
  // 旧バージョンで保存された未使用フィールドを破棄
  delete (out as unknown as Record<string, unknown>).statusEffects;
  delete (out as unknown as Record<string, unknown>).guilds;
  return out;
}

export function newMob(): MobDef {
  return { id: "new_mob", name: "新しいモブ", baseMob: "ZOMBIE", maxHealth: 30, movementSpeed: 0.3, attackDamage: 5, drops: [], behavior: "hostile" };
}

export function newDropRule(): DropRule {
  return { id: "new_drop", name: "新しいドロップ表", targetMob: "ANY", items: [] };
}

export function newEffect(): CustomEffectDef {
  return { id: "second_wind", name: "セカンドウィンド", color: "#ffb347", category: "BENEFICIAL", tickSkillId: "", intervalTicks: 40, revive: true, reviveHealth: 8, reviveSkillId: "" };
}

export function newAdvancement(): AdvancementDef {
  return { id: "new_advancement", name: "新しい実績", description: "条件を達成しよう", icon: "minecraft:nether_star", frame: "task", parent: "", kind: "MANUAL", item: "", mob: "", steps: 1, rewardXp: 0, hidden: false };
}

export function newMaterial(): MaterialDef {
  return { id: "new_material", name: "新しい素材", baseMaterial: "IRON", damageMultiplier: 1.2, speedMultiplier: 1.1, durabilityMultiplier: 1.3, description: "" };
}

export function newTrade(): ShopTrade {
  return { id: `t${Math.floor(Math.random() * 9000 + 1000)}`, offerItem: "minecraft:golden_apple", offerCount: 1, requiredItem1: "minecraft:emerald", requiredCount1: 3, requiredItem2: "", requiredCount2: 0 };
}

export function newShop(): ShopDef {
  return { id: "new_shop", name: "新しいショップ", trades: [newTrade()], openedByBlockId: "" };
}

export function newSkillPoint(): SkillPointDef {
  return { id: "new_upgrade", name: "新しい強化", description: "", cost: 1, effect: "INCREASE_MAX_HEALTH", amount: 2 };
}

export const SKILL_POINT_EFFECTS: { value: SkillPointDef["effect"]; label: string; hint: string }[] = [
  { value: "INCREASE_MAX_HEALTH", label: "最大HP", hint: "+2 = ハート1個" },
  { value: "INCREASE_MAX_MANA", label: "最大マナ", hint: "+10 など" },
  { value: "INCREASE_DAMAGE", label: "攻撃力", hint: "+0.5 など" },
  { value: "INCREASE_DEFENSE", label: "防御力(アーマー)", hint: "+1 = 防具1ポイント" },
  { value: "INCREASE_SPEED", label: "移動速度", hint: "標準0.1。+0.004で約4%" },
  { value: "INCREASE_LUCK", label: "幸運", hint: "+0.5 など" },
];
