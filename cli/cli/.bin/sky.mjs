// src/sky.ts
import { writeFileSync } from "node:fs";

// ../skyblock/hypixel-skyblock-texture-generator (1)/src/lib/catalog.ts
var CATALOG = [
  {
    id: "hyperion",
    name: "Hyperion",
    nameJa: "\u30CF\u30A4\u30D4\u30EA\u30AA\u30F3",
    category: "sword",
    templates: ["sword_wither", "sword_long", "sword_gear"],
    rarity: "legendary",
    mcItems: ["diamond_sword"],
    citPattern: "Hyperion",
    lore: "\u30A6\u30A3\u30B6\u30FC\u30D6\u30EC\u30A4\u30C9\u3002\u7206\u767A\u3068\u30C6\u30EC\u30DD\u30FC\u30C8\u306E\u8C61\u5FB4\u3002",
    tags: ["dungeon", "mage", "wither"]
  },
  {
    id: "astraea",
    name: "Astraea",
    nameJa: "\u30A2\u30B9\u30C8\u30EC\u30A2",
    category: "sword",
    templates: ["sword_wither", "sword_great", "sword_gear"],
    rarity: "legendary",
    mcItems: ["diamond_sword"],
    citPattern: "Astraea",
    lore: "\u9632\u5FA1\u5BC4\u308A\u306E\u30A6\u30A3\u30B6\u30FC\u30D6\u30EC\u30A4\u30C9\u3002",
    tags: ["dungeon", "tank", "wither"]
  },
  {
    id: "scylla",
    name: "Scylla",
    nameJa: "\u30B9\u30AD\u30E5\u30E9",
    category: "sword",
    templates: ["sword_wither", "sword_rapier", "sword_gear"],
    rarity: "legendary",
    mcItems: ["diamond_sword"],
    citPattern: "Scylla",
    lore: "\u30AF\u30EA\u30C6\u30A3\u30AB\u30EB\u306B\u7279\u5316\u3057\u305F\u4E00\u632F\u308A\u3002",
    tags: ["dungeon", "crit", "wither"]
  },
  {
    id: "valkyrie",
    name: "Valkyrie",
    nameJa: "\u30F4\u30A1\u30EB\u30AD\u30EA\u30FC",
    category: "sword",
    templates: ["sword_wither", "sword_broad", "sword_gear"],
    rarity: "legendary",
    mcItems: ["diamond_sword"],
    citPattern: "Valkyrie",
    lore: "\u6226\u58EB\u306E\u30A6\u30A3\u30B6\u30FC\u30D6\u30EC\u30A4\u30C9\u3002",
    tags: ["dungeon", "berserk", "wither"]
  },
  {
    id: "dark_claymore",
    name: "Dark Claymore",
    nameJa: "\u30C0\u30FC\u30AF\u30AF\u30EC\u30A4\u30E2\u30A2",
    category: "sword",
    templates: ["sword_great", "sword_gear"],
    rarity: "legendary",
    mcItems: ["stone_sword", "iron_sword"],
    citPattern: "Dark Claymore",
    lore: "\u4E21\u624B\u6301\u3061\u306E\u5DE8\u5927\u5263\u3002\u5F71\u304C\u5203\u306B\u306A\u308B\u3002",
    tags: ["dungeon", "berserk"]
  },
  {
    id: "giants_sword",
    name: "Giant's Sword",
    nameJa: "\u30B8\u30E3\u30A4\u30A2\u30F3\u30C4\u30BD\u30FC\u30C9",
    category: "sword",
    templates: ["sword_great", "sword_long", "sword_gear"],
    rarity: "legendary",
    mcItems: ["iron_sword", "golden_sword"],
    citPattern: "Giant's Sword",
    lore: "\u5DE8\u4EBA\u306E\u9AA8\u304B\u3089\u935B\u3048\u3089\u308C\u305F\u5927\u5263\u3002",
    tags: ["dungeon", "berserk"]
  },
  {
    id: "livid_dagger",
    name: "Livid Dagger",
    nameJa: "\u30EA\u30D3\u30C3\u30C9\u30C0\u30AC\u30FC",
    category: "sword",
    templates: ["sword_dagger", "sword_rapier", "sword_gear"],
    rarity: "legendary",
    mcItems: ["iron_sword", "diamond_sword"],
    citPattern: "Livid Dagger",
    lore: "\u80CC\u5F8C\u3092\u72D9\u3046\u6697\u6BBA\u8005\u306E\u77ED\u5263\u3002",
    tags: ["dungeon", "assassin"]
  },
  {
    id: "shadow_fury",
    name: "Shadow Fury",
    nameJa: "\u30B7\u30E3\u30C9\u30A6\u30D5\u30E5\u30FC\u30EA\u30FC",
    category: "sword",
    templates: ["sword_long", "sword_dagger", "sword_gear"],
    rarity: "legendary",
    mcItems: ["diamond_sword"],
    citPattern: "Shadow Fury",
    lore: "\u5F71\u3092\u99C6\u3051\u3001\u8907\u6570\u306E\u6575\u3092\u8CAB\u304F\u3002",
    tags: ["dungeon", "assassin"]
  },
  {
    id: "aspect_of_the_dragons",
    name: "Aspect of the Dragons",
    nameJa: "\u30A2\u30B9\u30DA\u30AF\u30C8\u30FB\u30AA\u30D6\u30FB\u30B6\u30FB\u30C9\u30E9\u30B4\u30F3\u30BA",
    category: "sword",
    templates: ["sword_long", "sword_broad", "sword_gear"],
    rarity: "legendary",
    mcItems: ["diamond_sword"],
    citPattern: "Aspect of the Dragons",
    lore: "\u30C9\u30E9\u30B4\u30F3\u306E\u606F\u3092\u4E57\u305B\u308B\u53E4\u5178\u306E\u540D\u5263\u3002",
    tags: ["dragon", "classic"]
  },
  {
    id: "aspect_of_the_void",
    name: "Aspect of the Void",
    nameJa: "\u30A2\u30B9\u30DA\u30AF\u30C8\u30FB\u30AA\u30D6\u30FB\u30B6\u30FB\u30F4\u30A9\u30A4\u30C9",
    category: "sword",
    templates: ["sword_broad", "sword_rapier", "sword_gear"],
    rarity: "epic",
    mcItems: ["diamond_sword"],
    citPattern: "Aspect of the Void",
    lore: "\u865A\u7A7A\u3092\u6298\u308A\u305F\u305F\u3093\u3067\u77AC\u79FB\u3059\u308B\u3002",
    tags: ["end", "utility"]
  },
  {
    id: "flower_of_truth",
    name: "Flower of Truth",
    nameJa: "\u30D5\u30E9\u30EF\u30FC\u30FB\u30AA\u30D6\u30FB\u30C8\u30A5\u30EB\u30FC\u30B9",
    category: "sword",
    templates: ["sword_long", "sword_scythe", "sword_gear"],
    rarity: "legendary",
    mcItems: ["diamond_sword", "red_tulip"],
    citPattern: "Flower of Truth",
    lore: "\u8594\u8587\u304C\u98DB\u3073\u3001\u771F\u5B9F\u3092\u88C2\u304F\u3002",
    tags: ["dungeon", "mage"]
  },
  {
    id: "frozen_scythe",
    name: "Frozen Scythe",
    nameJa: "\u30D5\u30ED\u30FC\u30BA\u30F3\u30B5\u30A4\u30BA",
    category: "sword",
    templates: ["sword_scythe", "sword_gear"],
    rarity: "rare",
    mcItems: ["diamond_hoe", "iron_hoe"],
    citPattern: "Frozen Scythe",
    lore: "\u6C37\u306E\u5F27\u3092\u6295\u3052\u308B\u5927\u938C\u3002",
    tags: ["ice", "mage"]
  },
  {
    id: "axe_of_the_shredded",
    name: "Axe of the Shredded",
    nameJa: "\u30A2\u30C3\u30AF\u30B9\u30FB\u30AA\u30D6\u30FB\u30B6\u30FB\u30B7\u30E5\u30EC\u30C3\u30C7\u30C3\u30C9",
    category: "sword",
    templates: ["tool_axe", "sword_great", "sword_gear"],
    rarity: "legendary",
    mcItems: ["diamond_axe"],
    citPattern: "Axe of the Shredded",
    lore: "\u30BE\u30F3\u30D3\u3092\u633D\u304F\u305F\u3081\u306E\u5100\u5F0F\u65A7\u3002",
    tags: ["undead", "berserk"]
  },
  {
    id: "reaper_falchion",
    name: "Reaper Falchion",
    nameJa: "\u30EA\u30FC\u30D1\u30FC\u30D5\u30A1\u30EB\u30B7\u30AA\u30F3",
    category: "sword",
    templates: ["sword_long", "sword_scythe", "sword_gear"],
    rarity: "epic",
    mcItems: ["diamond_sword", "golden_sword"],
    citPattern: "Reaper Falchion",
    lore: "\u6B7B\u795E\u306E\u6E7E\u5200\u3002\u30A2\u30F3\u30C7\u30C3\u30C9\u7279\u52B9\u3002",
    tags: ["undead"]
  },
  {
    id: "midas_sword",
    name: "Midas' Sword",
    nameJa: "\u30DF\u30C0\u30B9\u30BD\u30FC\u30C9",
    category: "sword",
    templates: ["sword_long", "sword_great", "sword_gear"],
    rarity: "legendary",
    mcItems: ["golden_sword"],
    citPattern: "Midas' Sword",
    lore: "\u6255\u3063\u305F\u91D1\u8CA8\u306E\u679A\u6570\u304C\u5203\u306B\u306A\u308B\u3002",
    tags: ["gold", "classic"]
  },
  {
    id: "terminator",
    name: "Terminator",
    nameJa: "\u30BF\u30FC\u30DF\u30CD\u30FC\u30BF\u30FC",
    category: "bow",
    templates: ["bow_heavy", "bow_crossbow", "bow_repeater"],
    rarity: "legendary",
    mcItems: ["bow"],
    citPattern: "Terminator",
    lore: "\u4E09\u672C\u306E\u77E2\u3092\u540C\u6642\u306B\u653E\u3064\u7D42\u672B\u306E\u5F13\u3002",
    tags: ["dungeon", "archer"]
  },
  {
    id: "juju_shortbow",
    name: "Juju Shortbow",
    nameJa: "\u30B8\u30E5\u30B8\u30E5\u30B7\u30E7\u30FC\u30C8\u30DC\u30A6",
    category: "bow",
    templates: ["bow_short", "bow_long", "bow_repeater"],
    rarity: "epic",
    mcItems: ["bow"],
    citPattern: "Juju Shortbow",
    lore: "\u901F\u5C04\u306E\u77ED\u5F13\u3002\u30A2\u30FC\u30C1\u30E3\u30FC\u306E\u901A\u904E\u5100\u793C\u3002",
    tags: ["archer"]
  },
  {
    id: "last_breath",
    name: "Last Breath",
    nameJa: "\u30E9\u30B9\u30C8\u30D6\u30EC\u30B9",
    category: "bow",
    templates: ["bow_long", "bow_short", "bow_repeater"],
    rarity: "epic",
    mcItems: ["bow"],
    citPattern: "Last Breath",
    lore: "\u5B88\u8B77\u3092\u524A\u308B\u6700\u5F8C\u306E\u606F\u3002",
    tags: ["dungeon", "archer"]
  },
  {
    id: "mosquito_bow",
    name: "Mosquito Bow",
    nameJa: "\u30E2\u30B9\u30AD\u30FC\u30C8\u30DC\u30A6",
    category: "bow",
    templates: ["bow_long", "bow_repeater"],
    rarity: "legendary",
    mcItems: ["bow"],
    citPattern: "Mosquito Bow",
    lore: "\u751F\u547D\u3092\u5438\u3046\u7FBD\u97F3\u306E\u5F13\u3002",
    tags: ["arachne", "archer"]
  },
  {
    id: "spirit_bow",
    name: "Spirit Bow",
    nameJa: "\u30B9\u30D4\u30EA\u30C3\u30C8\u30DC\u30A6",
    category: "bow",
    templates: ["bow_short", "bow_long", "bow_repeater"],
    rarity: "epic",
    mcItems: ["bow"],
    citPattern: "Spirit Bow",
    lore: "\u5730\u4E0B\u5893\u5730\u306B\u97FF\u304F\u970A\u5F13\u3002",
    tags: ["dungeon"]
  },
  {
    id: "runaans_bow",
    name: "Runaan's Bow",
    nameJa: "\u30EB\u30CA\u30FC\u30F3\u30DC\u30A6",
    category: "bow",
    templates: ["bow_long", "bow_repeater"],
    rarity: "legendary",
    mcItems: ["bow"],
    citPattern: "Runaan's Bow",
    lore: "\u5206\u5C90\u3059\u308B\u9B54\u529B\u306E\u77E2\u3002",
    tags: ["archer", "classic"]
  },
  {
    id: "spirit_sceptre",
    name: "Spirit Sceptre",
    nameJa: "\u30B9\u30D4\u30EA\u30C3\u30C8\u30BB\u30D7\u30BF\u30FC",
    category: "staff",
    templates: ["staff_sceptre", "staff_wand"],
    rarity: "legendary",
    mcItems: ["bone", "blaze_rod"],
    citPattern: "Spirit Sceptre",
    lore: "\u8759\u8760\u3092\u653E\u3064\u970A\u6756\u3002",
    tags: ["dungeon", "mage"]
  },
  {
    id: "bonzo_staff",
    name: "Bonzo's Staff",
    nameJa: "\u30DC\u30F3\u30BE\u30B9\u30BF\u30C3\u30D5",
    category: "staff",
    templates: ["staff_wand", "staff_sceptre"],
    rarity: "rare",
    mcItems: ["blaze_rod", "stick"],
    citPattern: "Bonzo's Staff",
    lore: "\u98A8\u8239\u3092\u3076\u3064\u3051\u308B\u9053\u5316\u306E\u6756\u3002",
    tags: ["dungeon", "mage"]
  },
  {
    id: "midas_staff",
    name: "Midas' Staff",
    nameJa: "\u30DF\u30C0\u30B9\u30B9\u30BF\u30C3\u30D5",
    category: "staff",
    templates: ["staff_sceptre", "staff_orb"],
    rarity: "legendary",
    mcItems: ["golden_shovel", "blaze_rod"],
    citPattern: "Midas' Staff",
    lore: "\u91D1\u306E\u584A\u3092\u964D\u3089\u305B\u308B\u546A\u6756\u3002",
    tags: ["gold", "mage"]
  },
  {
    id: "fire_veil_wand",
    name: "Fire Veil Wand",
    nameJa: "\u30D5\u30A1\u30A4\u30A2\u30F4\u30A7\u30FC\u30EB\u30EF\u30F3\u30C9",
    category: "staff",
    templates: ["staff_wand"],
    rarity: "epic",
    mcItems: ["blaze_rod"],
    citPattern: "Fire Veil Wand",
    lore: "\u708E\u306E\u30F4\u30A7\u30FC\u30EB\u3092\u8EAB\u306B\u307E\u3068\u3046\u3002",
    tags: ["crimson", "mage"]
  },
  {
    id: "wand_of_atonement",
    name: "Wand of Atonement",
    nameJa: "\u30EF\u30F3\u30C9\u30FB\u30AA\u30D6\u30FB\u30A2\u30C8\u30FC\u30F3\u30E1\u30F3\u30C8",
    category: "staff",
    templates: ["staff_wand"],
    rarity: "epic",
    mcItems: ["stick", "blaze_rod"],
    citPattern: "Wand of Atonement",
    lore: "\u81EA\u5DF1\u56DE\u5FA9\u306E\u6700\u7D42\u5F62\u3002",
    tags: ["healing"]
  },
  {
    id: "necron_helmet",
    name: "Necron's Helmet",
    nameJa: "\u30CD\u30AF\u30ED\u30F3\u30D8\u30EB\u30E1\u30C3\u30C8",
    category: "armor",
    templates: ["armor_helm_full", "armor_helm_horn"],
    rarity: "legendary",
    mcItems: ["diamond_helmet"],
    citPattern: "Necron's Helmet",
    lore: "\u30A6\u30A3\u30B6\u30FC\u738B\u306E\u515C\u3002\u706B\u529B\u306E\u8C61\u5FB4\u3002",
    tags: ["dungeon", "berserk"]
  },
  {
    id: "necron_chestplate",
    name: "Necron's Chestplate",
    nameJa: "\u30CD\u30AF\u30ED\u30F3\u30C1\u30A7\u30B9\u30C8\u30D7\u30EC\u30FC\u30C8",
    category: "armor",
    templates: ["armor_chest_plate", "armor_chest_plate"],
    rarity: "legendary",
    mcItems: ["diamond_chestplate"],
    citPattern: "Necron's Chestplate",
    lore: "\u9ED2\u91D1\u306E\u80F8\u5F53\u3066\u3002",
    tags: ["dungeon", "berserk"]
  },
  {
    id: "necron_leggings",
    name: "Necron's Leggings",
    nameJa: "\u30CD\u30AF\u30ED\u30F3\u30EC\u30AE\u30F3\u30B9",
    category: "armor",
    templates: ["armor_legs"],
    rarity: "legendary",
    mcItems: ["diamond_leggings"],
    citPattern: "Necron's Leggings",
    lore: "\u30AB\u30BF\u30B3\u30F3\u30D6\u6700\u6DF1\u90E8\u306E\u5B88\u8B77\u3092\u7E8F\u3046\u3002",
    tags: ["dungeon"]
  },
  {
    id: "necron_boots",
    name: "Necron's Boots",
    nameJa: "\u30CD\u30AF\u30ED\u30F3\u30D6\u30FC\u30C4",
    category: "armor",
    templates: ["armor_boots"],
    rarity: "legendary",
    mcItems: ["diamond_boots"],
    citPattern: "Necron's Boots",
    lore: "\u738B\u306E\u8DB3\u97F3\u3002",
    tags: ["dungeon"]
  },
  {
    id: "storm_helmet",
    name: "Storm's Helmet",
    nameJa: "\u30B9\u30C8\u30FC\u30E0\u30D8\u30EB\u30E1\u30C3\u30C8",
    category: "armor",
    templates: ["armor_helm_hood", "armor_helm_full"],
    rarity: "legendary",
    mcItems: ["diamond_helmet"],
    citPattern: "Storm's Helmet",
    lore: "\u9B54\u529B\u306E\u5D50\u3092\u9589\u3058\u8FBC\u3081\u305F\u515C\u3002",
    tags: ["dungeon", "mage"]
  },
  {
    id: "storm_chestplate",
    name: "Storm's Chestplate",
    nameJa: "\u30B9\u30C8\u30FC\u30E0\u30C1\u30A7\u30B9\u30C8\u30D7\u30EC\u30FC\u30C8",
    category: "armor",
    templates: ["armor_chest_plate"],
    rarity: "legendary",
    mcItems: ["diamond_chestplate"],
    citPattern: "Storm's Chestplate",
    lore: "\u96F7\u5149\u3092\u5E2F\u3073\u305F\u6CD5\u8863\u93A7\u3002",
    tags: ["dungeon", "mage"]
  },
  {
    id: "superior_helmet",
    name: "Superior Dragon Helmet",
    nameJa: "\u30B9\u30DA\u30EA\u30AA\u30EB\u30C9\u30E9\u30B4\u30F3\u30D8\u30EB\u30E1\u30C3\u30C8",
    category: "armor",
    templates: ["armor_helm_horn"],
    rarity: "legendary",
    mcItems: ["player_head", "diamond_helmet"],
    citPattern: "Superior Dragon Helmet",
    lore: "\u6700\u4E0A\u4F4D\u7ADC\u306E\u982D\u84CB\u3002",
    tags: ["dragon"]
  },
  {
    id: "superior_chestplate",
    name: "Superior Dragon Chestplate",
    nameJa: "\u30B9\u30DA\u30EA\u30AA\u30EB\u30C9\u30E9\u30B4\u30F3\u30C1\u30A7\u30B9\u30C8\u30D7\u30EC\u30FC\u30C8",
    category: "armor",
    templates: ["armor_chest_plate"],
    rarity: "legendary",
    mcItems: ["diamond_chestplate"],
    citPattern: "Superior Dragon Chestplate",
    lore: "\u8679\u8272\u306B\u8FD1\u3044\u7ADC\u9C57\u3002",
    tags: ["dragon"]
  },
  {
    id: "superior_leggings",
    name: "Superior Dragon Leggings",
    nameJa: "\u30B9\u30DA\u30EA\u30AA\u30EB\u30C9\u30E9\u30B4\u30F3\u30EC\u30AE\u30F3\u30B9",
    category: "armor",
    templates: ["armor_legs"],
    rarity: "legendary",
    mcItems: ["diamond_leggings"],
    citPattern: "Superior Dragon Leggings",
    lore: "\u5168\u3066\u306E\u30B9\u30C6\u30FC\u30BF\u30B9\u3092\u5E95\u4E0A\u3052\u3059\u308B\u3002",
    tags: ["dragon"]
  },
  {
    id: "superior_boots",
    name: "Superior Dragon Boots",
    nameJa: "\u30B9\u30DA\u30EA\u30AA\u30EB\u30C9\u30E9\u30B4\u30F3\u30D6\u30FC\u30C4",
    category: "armor",
    templates: ["armor_boots"],
    rarity: "legendary",
    mcItems: ["diamond_boots"],
    citPattern: "Superior Dragon Boots",
    lore: "\u7ADC\u306E\u8E35\u3002",
    tags: ["dragon"]
  },
  {
    id: "shadow_assassin_helmet",
    name: "Shadow Assassin Helmet",
    nameJa: "\u30B7\u30E3\u30C9\u30A6\u30A2\u30B5\u30B7\u30F3\u30D8\u30EB\u30E1\u30C3\u30C8",
    category: "armor",
    templates: ["armor_helm_hood"],
    rarity: "legendary",
    mcItems: ["player_head", "leather_helmet"],
    citPattern: "Shadow Assassin Helmet",
    lore: "\u95C7\u306B\u6EB6\u3051\u308B\u4EEE\u9762\u3002",
    tags: ["dungeon", "assassin"]
  },
  {
    id: "shadow_assassin_chestplate",
    name: "Shadow Assassin Chestplate",
    nameJa: "\u30B7\u30E3\u30C9\u30A6\u30A2\u30B5\u30B7\u30F3\u30C1\u30A7\u30B9\u30C8\u30D7\u30EC\u30FC\u30C8",
    category: "armor",
    templates: ["armor_chest_light"],
    rarity: "legendary",
    mcItems: ["leather_chestplate"],
    citPattern: "Shadow Assassin Chestplate",
    lore: "\u6697\u6BBA\u8005\u306E\u80F4\u8863\u3002",
    tags: ["dungeon", "assassin"]
  },
  {
    id: "shadow_assassin_leggings",
    name: "Shadow Assassin Leggings",
    nameJa: "\u30B7\u30E3\u30C9\u30A6\u30A2\u30B5\u30B7\u30F3\u30EC\u30AE\u30F3\u30B9",
    category: "armor",
    templates: ["armor_legs"],
    rarity: "legendary",
    mcItems: ["leather_leggings"],
    citPattern: "Shadow Assassin Leggings",
    lore: "\u8DB3\u97F3\u3092\u6D88\u3059\u3002",
    tags: ["dungeon"]
  },
  {
    id: "shadow_assassin_boots",
    name: "Shadow Assassin Boots",
    nameJa: "\u30B7\u30E3\u30C9\u30A6\u30A2\u30B5\u30B7\u30F3\u30D6\u30FC\u30C4",
    category: "armor",
    templates: ["armor_boots"],
    rarity: "legendary",
    mcItems: ["leather_boots"],
    citPattern: "Shadow Assassin Boots",
    lore: "\u8DF3\u8E8D\u3059\u308B\u5F71\u3002",
    tags: ["dungeon"]
  },
  {
    id: "crimson_helmet",
    name: "Crimson Helmet",
    nameJa: "\u30AF\u30EA\u30E0\u30BE\u30F3\u30D8\u30EB\u30E1\u30C3\u30C8",
    category: "armor",
    templates: ["armor_helm_full", "armor_helm_horn"],
    rarity: "legendary",
    mcItems: ["player_head", "leather_helmet"],
    citPattern: "Crimson Helmet",
    lore: "\u771F\u7D05\u306E\u5CF6\u306E\u8987\u515C\u3002",
    tags: ["crimson", "kuudra"]
  },
  {
    id: "crimson_chestplate",
    name: "Crimson Chestplate",
    nameJa: "\u30AF\u30EA\u30E0\u30BE\u30F3\u30C1\u30A7\u30B9\u30C8\u30D7\u30EC\u30FC\u30C8",
    category: "armor",
    templates: ["armor_chest_plate", "armor_chest_plate"],
    rarity: "legendary",
    mcItems: ["leather_chestplate"],
    citPattern: "Crimson Chestplate",
    lore: "\u6EB6\u5CA9\u306E\u5FC3\u62CD\u3002",
    tags: ["crimson", "kuudra"]
  },
  {
    id: "aurora_helmet",
    name: "Aurora Helmet",
    nameJa: "\u30AA\u30FC\u30ED\u30E9\u30D8\u30EB\u30E1\u30C3\u30C8",
    category: "armor",
    templates: ["armor_helm_hood"],
    rarity: "legendary",
    mcItems: ["player_head", "leather_helmet"],
    citPattern: "Aurora Helmet",
    lore: "\u6975\u5149\u3092\u9589\u3058\u8FBC\u3081\u305F\u6CD5\u5E3D\u3002",
    tags: ["crimson", "mage"]
  },
  {
    id: "aurora_chestplate",
    name: "Aurora Chestplate",
    nameJa: "\u30AA\u30FC\u30ED\u30E9\u30C1\u30A7\u30B9\u30C8\u30D7\u30EC\u30FC\u30C8",
    category: "armor",
    templates: ["armor_chest_plate"],
    rarity: "legendary",
    mcItems: ["leather_chestplate"],
    citPattern: "Aurora Chestplate",
    lore: "\u591C\u7A7A\u304C\u93A7\u306B\u306A\u3063\u305F\u3002",
    tags: ["crimson", "mage"]
  },
  {
    id: "frozen_blaze_helmet",
    name: "Frozen Blaze Helmet",
    nameJa: "\u30D5\u30ED\u30FC\u30BA\u30F3\u30D6\u30EC\u30A4\u30BA\u30D8\u30EB\u30E1\u30C3\u30C8",
    category: "armor",
    templates: ["armor_helm_hood", "armor_helm_full"],
    rarity: "legendary",
    mcItems: ["player_head", "diamond_helmet"],
    citPattern: "Frozen Blaze Helmet",
    lore: "\u51CD\u3066\u3064\u3044\u305F\u708E\u306E\u51A0\u3002",
    tags: ["blaze", "ice"]
  },
  {
    id: "frozen_blaze_chestplate",
    name: "Frozen Blaze Chestplate",
    nameJa: "\u30D5\u30ED\u30FC\u30BA\u30F3\u30D6\u30EC\u30A4\u30BA\u30C1\u30A7\u30B9\u30C8\u30D7\u30EC\u30FC\u30C8",
    category: "armor",
    templates: ["armor_chest_plate"],
    rarity: "legendary",
    mcItems: ["diamond_chestplate"],
    citPattern: "Frozen Blaze Chestplate",
    lore: "\u51B7\u708E\u306E\u7089\u5FC3\u3002",
    tags: ["blaze", "ice"]
  },
  {
    id: "stonk",
    name: "Stonk",
    nameJa: "\u30B9\u30C8\u30C3\u30AF",
    category: "tool",
    templates: ["tool_pickaxe"],
    rarity: "epic",
    mcItems: ["golden_pickaxe", "diamond_pickaxe"],
    citPattern: "Stonk",
    lore: "\u52B9\u7387\u3068\u7D4C\u9A13\u5024\u306E\u9EC4\u91D1\u30C4\u30EB\u30CF\u30B7\u3002",
    tags: ["mining", "dungeon"]
  },
  {
    id: "treecapitator",
    name: "Treecapitator",
    nameJa: "\u30C4\u30EA\u30FC\u30AD\u30E3\u30D4\u30C6\u30A4\u30BF\u30FC",
    category: "tool",
    templates: ["tool_axe"],
    rarity: "epic",
    mcItems: ["golden_axe", "diamond_axe"],
    citPattern: "Treecapitator",
    lore: "\u4E00\u672C\u306E\u632F\u308A\u3067\u68EE\u304C\u5012\u308C\u308B\u3002",
    tags: ["foraging"]
  },
  {
    id: "titanium_drill",
    name: "Titanium Drill DR-X655",
    nameJa: "\u30C1\u30BF\u30CB\u30A6\u30E0\u30C9\u30EA\u30EB",
    category: "tool",
    templates: ["tool_drill"],
    rarity: "legendary",
    mcItems: ["prismarine_shard", "diamond_pickaxe"],
    citPattern: "Titanium Drill",
    lore: "\u30C9\u30EF\u30FC\u30D5\u9271\u5C71\u306E\u6700\u4E0A\u7D1A\u7A7F\u5B54\u6A5F\u3002",
    tags: ["mining"]
  },
  {
    id: "gemstone_gauntlet",
    name: "Gemstone Gauntlet",
    nameJa: "\u30B8\u30A7\u30E0\u30B9\u30C8\u30FC\u30F3\u30AC\u30F3\u30C8\u30EC\u30C3\u30C8",
    category: "tool",
    templates: ["tool_gauntlet"],
    rarity: "legendary",
    mcItems: ["player_head"],
    citPattern: "Gemstone Gauntlet",
    lore: "\u5B9D\u77F3\u3092\u5D4C\u3081\u305F\u63A1\u6398\u62F3\u3002",
    tags: ["mining", "crystal"]
  },
  {
    id: "grappling_hook",
    name: "Grappling Hook",
    nameJa: "\u30B0\u30E9\u30C3\u30D7\u30EA\u30F3\u30B0\u30D5\u30C3\u30AF",
    category: "tool",
    templates: ["tool_hook", "tool_rod"],
    rarity: "uncommon",
    mcItems: ["fishing_rod"],
    citPattern: "Grappling Hook",
    lore: "\u30D5\u30C3\u30AF\u3067\u5B99\u3092\u6CF3\u3050\u3002",
    tags: ["utility"]
  },
  {
    id: "rod_of_the_sea",
    name: "Rod of the Sea",
    nameJa: "\u30ED\u30C3\u30C9\u30FB\u30AA\u30D6\u30FB\u30B6\u30FB\u30B7\u30FC",
    category: "tool",
    templates: ["tool_rod"],
    rarity: "legendary",
    mcItems: ["fishing_rod"],
    citPattern: "Rod of the Sea",
    lore: "\u6D77\u305D\u306E\u3082\u306E\u3092\u91E3\u308B\u7AFF\u3002",
    tags: ["fishing"]
  },
  {
    id: "mathematical_hoe",
    name: "Mathematical Hoe Blueprint",
    nameJa: "\u30DE\u30B9\u30DE\u30C6\u30A3\u30AB\u30EB\u30AF\u30EF",
    category: "tool",
    templates: ["tool_hoe"],
    rarity: "legendary",
    mcItems: ["diamond_hoe", "golden_hoe"],
    citPattern: "Mathematical Hoe",
    lore: "\u53CE\u7A6B\u3092\u6570\u5F0F\u306B\u3059\u308B\u3002",
    tags: ["farming"]
  },
  {
    id: "hegemony_artifact",
    name: "Hegemony Artifact",
    nameJa: "\u30D8\u30B2\u30E2\u30CB\u30FC\u30A2\u30FC\u30C6\u30A3\u30D5\u30A1\u30AF\u30C8",
    category: "accessory",
    templates: ["acc_artifact"],
    rarity: "legendary",
    mcItems: ["player_head"],
    citPattern: "Hegemony Artifact",
    lore: "\u529B\u306E\u8987\u6A29\u3092\u793A\u3059\u907A\u7269\u3002",
    tags: ["accessory", "mp"]
  },
  {
    id: "overflux_capacitor",
    name: "Overflux Power Orb",
    nameJa: "\u30AA\u30FC\u30D0\u30FC\u30D5\u30E9\u30C3\u30AF\u30B9",
    category: "accessory",
    templates: ["acc_artifact", "acc_crystal"],
    rarity: "epic",
    mcItems: ["player_head"],
    citPattern: "Overflux",
    lore: "\u8D64\u3044\u529B\u306E\u30AA\u30FC\u30D6\u3002",
    tags: ["orb"]
  },
  {
    id: "plasmaflux",
    name: "Plasmaflux Power Orb",
    nameJa: "\u30D7\u30E9\u30BA\u30DE\u30D5\u30E9\u30C3\u30AF\u30B9",
    category: "accessory",
    templates: ["acc_artifact", "acc_crystal"],
    rarity: "legendary",
    mcItems: ["player_head"],
    citPattern: "Plasmaflux",
    lore: "\u7D2B\u96FB\u306E\u30AA\u30FC\u30D6\u3002",
    tags: ["orb"]
  },
  {
    id: "relic_of_power",
    name: "Relic of Power",
    nameJa: "\u30EC\u30EA\u30C3\u30AF\u30FB\u30AA\u30D6\u30FB\u30D1\u30EF\u30FC",
    category: "accessory",
    templates: ["acc_talisman", "acc_artifact"],
    rarity: "epic",
    mcItems: ["player_head"],
    citPattern: "Relic of Power",
    lore: "\u9B54\u529B\u3092\u5E95\u4E0A\u3052\u3059\u308B\u907A\u7269\u3002",
    tags: ["accessory"]
  },
  {
    id: "speed_talisman",
    name: "Speed Talisman",
    nameJa: "\u30B9\u30D4\u30FC\u30C9\u30BF\u30EA\u30B9\u30DE\u30F3",
    category: "accessory",
    templates: ["acc_talisman"],
    rarity: "common",
    mcItems: ["player_head"],
    citPattern: "Speed Talisman",
    lore: "\u6700\u521D\u306E\u52A0\u901F\u306E\u304A\u5B88\u308A\u3002",
    tags: ["accessory", "early"]
  },
  {
    id: "treasure_ring",
    name: "Treasure Ring",
    nameJa: "\u30C8\u30EC\u30B8\u30E3\u30FC\u30EA\u30F3\u30B0",
    category: "accessory",
    templates: ["acc_ring"],
    rarity: "epic",
    mcItems: ["player_head"],
    citPattern: "Treasure Ring",
    lore: "\u5B9D\u3092\u547C\u3073\u5BC4\u305B\u308B\u6307\u8F2A\u3002",
    tags: ["accessory", "fishing"]
  },
  {
    id: "personal_compactor",
    name: "Personal Compactor 7000",
    nameJa: "\u30D1\u30FC\u30BD\u30CA\u30EB\u30B3\u30F3\u30D1\u30AF\u30BF\u30FC",
    category: "accessory",
    templates: ["acc_artifact"],
    rarity: "legendary",
    mcItems: ["player_head", "dropper"],
    citPattern: "Personal Compactor",
    lore: "\u30A4\u30F3\u30D9\u30F3\u30C8\u30EA\u3092\u5727\u7E2E\u3059\u308B\u6A5F\u68B0\u3002",
    tags: ["utility"]
  },
  {
    id: "golden_dragon_pet",
    name: "Golden Dragon",
    nameJa: "\u30B4\u30FC\u30EB\u30C7\u30F3\u30C9\u30E9\u30B4\u30F3",
    category: "pet",
    templates: ["pet_dragon"],
    rarity: "legendary",
    mcItems: ["player_head"],
    citPattern: "Golden Dragon",
    lore: "\u91D1\u8CA8\u3092\u7523\u3080\u4F1D\u8AAC\u306E\u4ED4\u7ADC\u3002",
    tags: ["pet", "gold"]
  },
  {
    id: "blue_whale_pet",
    name: "Blue Whale",
    nameJa: "\u30D6\u30EB\u30FC\u30DB\u30A8\u30FC\u30EB",
    category: "pet",
    templates: ["pet_whale"],
    rarity: "legendary",
    mcItems: ["player_head"],
    citPattern: "Blue Whale",
    lore: "HP\u306E\u6D77\u3002",
    tags: ["pet", "tank"]
  },
  {
    id: "tiger_pet",
    name: "Tiger",
    nameJa: "\u30BF\u30A4\u30AC\u30FC",
    category: "pet",
    templates: ["pet_quadruped"],
    rarity: "legendary",
    mcItems: ["player_head"],
    citPattern: "Tiger",
    lore: "\u30AF\u30EA\u30C6\u30A3\u30AB\u30EB\u306E\u7363\u3002",
    tags: ["pet", "crit"]
  },
  {
    id: "black_cat_pet",
    name: "Black Cat",
    nameJa: "\u30D6\u30E9\u30C3\u30AF\u30AD\u30E3\u30C3\u30C8",
    category: "pet",
    templates: ["pet_quadruped"],
    rarity: "legendary",
    mcItems: ["player_head"],
    citPattern: "Black Cat",
    lore: "\u901F\u5EA6\u3068\u9B54\u6CD5\u767A\u898B\u306E\u9ED2\u732B\u3002",
    tags: ["pet", "magic_find"]
  },
  {
    id: "griffin_pet",
    name: "Griffin",
    nameJa: "\u30B0\u30EA\u30D5\u30A3\u30F3",
    category: "pet",
    templates: ["pet_bird", "pet_dragon"],
    rarity: "legendary",
    mcItems: ["player_head"],
    citPattern: "Griffin",
    lore: "\u795E\u8A71\u72E9\u308A\u3092\u5C0E\u304F\u8056\u7363\u3002",
    tags: ["pet", "mythological"]
  },
  {
    id: "bee_pet",
    name: "Bee",
    nameJa: "\u30D3\u30FC",
    category: "pet",
    templates: ["pet_bee"],
    rarity: "legendary",
    mcItems: ["player_head"],
    citPattern: "Bee",
    lore: "\u82B1\u7C89\u3068\u77E5\u80FD\u306E\u76F8\u68D2\u3002",
    tags: ["pet", "farming"]
  },
  {
    id: "phoenix_pet",
    name: "Phoenix",
    nameJa: "\u30D5\u30A7\u30CB\u30C3\u30AF\u30B9",
    category: "pet",
    templates: ["pet_bird", "pet_dragon"],
    rarity: "legendary",
    mcItems: ["player_head"],
    citPattern: "Phoenix",
    lore: "\u7070\u304B\u3089\u8607\u308B\u706B\u529B\u3002",
    tags: ["pet", "mage"]
  },
  {
    id: "enderman_pet",
    name: "Enderman",
    nameJa: "\u30A8\u30F3\u30C0\u30FC\u30DE\u30F3",
    category: "pet",
    templates: ["pet_quadruped", "minion_base"],
    rarity: "legendary",
    mcItems: ["player_head"],
    citPattern: "Enderman",
    lore: "\u865A\u7A7A\u306E\u8996\u7DDA\u3002",
    tags: ["pet", "end"]
  },
  {
    id: "inferno_minion",
    name: "Inferno Minion",
    nameJa: "\u30A4\u30F3\u30D5\u30A7\u30EB\u30CE\u30DF\u30CB\u30AA\u30F3",
    category: "minion",
    templates: ["minion_base"],
    rarity: "legendary",
    mcItems: ["player_head"],
    citPattern: "Inferno Minion",
    lore: "\u5730\u7344\u306E\u81EA\u52D5\u88C5\u7F6E\u3002",
    tags: ["minion", "crimson"]
  },
  {
    id: "vampire_minion",
    name: "Vampire Minion",
    nameJa: "\u30F4\u30A1\u30F3\u30D1\u30A4\u30A2\u30DF\u30CB\u30AA\u30F3",
    category: "minion",
    templates: ["minion_base"],
    rarity: "rare",
    mcItems: ["player_head"],
    citPattern: "Vampire Minion",
    lore: "\u8840\u3092\u6EF4\u3089\u305B\u308B\u4F5C\u696D\u54E1\u3002",
    tags: ["minion", "rift"]
  },
  {
    id: "snow_minion",
    name: "Snow Minion",
    nameJa: "\u30B9\u30CE\u30FC\u30DF\u30CB\u30AA\u30F3",
    category: "minion",
    templates: ["minion_base"],
    rarity: "rare",
    mcItems: ["player_head"],
    citPattern: "Snow Minion",
    lore: "\u96EA\u3092\u7A4D\u307F\u7D9A\u3051\u308B\u3002",
    tags: ["minion", "event"]
  },
  {
    id: "clay_minion",
    name: "Clay Minion",
    nameJa: "\u30AF\u30EC\u30A4\u30DF\u30CB\u30AA\u30F3",
    category: "minion",
    templates: ["minion_base"],
    rarity: "rare",
    mcItems: ["player_head"],
    citPattern: "Clay Minion",
    lore: "\u521D\u671F\u306E\u76F8\u68D2\u3002\u7C98\u571F\u3092\u6398\u308B\u3002",
    tags: ["minion", "early"]
  },
  {
    id: "enchanted_book",
    name: "Enchanted Book",
    nameJa: "\u30A8\u30F3\u30C1\u30E3\u30F3\u30C8\u672C",
    category: "misc",
    templates: ["acc_book"],
    rarity: "uncommon",
    mcItems: ["enchanted_book"],
    citPattern: "Enchanted Book",
    lore: "\u672A\u77E5\u306E\u30EB\u30FC\u30F3\u304C\u8D70\u308B\u518A\u5B50\u3002",
    tags: ["enchanting"]
  },
  {
    id: "critical_potion",
    name: "Critical Potion",
    nameJa: "\u30AF\u30EA\u30C6\u30A3\u30AB\u30EB\u30DD\u30FC\u30B7\u30E7\u30F3",
    category: "misc",
    templates: ["acc_potion"],
    rarity: "rare",
    mcItems: ["potion"],
    citPattern: "Critical I",
    lore: "\u4F1A\u5FC3\u3092\u716E\u8A70\u3081\u305F\u74F6\u3002",
    tags: ["alchemy"]
  },
  {
    id: "gemstone_mixture",
    name: "Gemstone Mixture",
    nameJa: "\u30B8\u30A7\u30E0\u30B9\u30C8\u30FC\u30F3\u30DF\u30C3\u30AF\u30B9",
    category: "misc",
    templates: ["acc_crystal"],
    rarity: "rare",
    mcItems: ["player_head", "prismarine_crystals"],
    citPattern: "Gemstone Mixture",
    lore: "\u5B9D\u77F3\u3092\u6EB6\u304B\u3057\u5408\u308F\u305B\u305F\u584A\u3002",
    tags: ["mining", "crystal"]
  },
  {
    id: "wither_shield_scroll",
    name: "Wither Shield",
    nameJa: "\u30A6\u30A3\u30B6\u30FC\u30B7\u30FC\u30EB\u30C9",
    category: "misc",
    templates: ["acc_book", "acc_artifact"],
    rarity: "epic",
    mcItems: ["paper", "enchanted_book"],
    citPattern: "Wither Shield",
    lore: "\u30D6\u30EC\u30A4\u30C9\u306B\u8F09\u305B\u308B\u9632\u5FA1\u30B9\u30AF\u30ED\u30FC\u30EB\u3002",
    tags: ["dungeon", "scroll"]
  },
  {
    id: "implosion_scroll",
    name: "Implosion",
    nameJa: "\u30A4\u30F3\u30D7\u30ED\u30FC\u30B8\u30E7\u30F3",
    category: "misc",
    templates: ["acc_book", "acc_crystal"],
    rarity: "epic",
    mcItems: ["paper", "enchanted_book"],
    citPattern: "Implosion",
    lore: "\u4E00\u70B9\u306B\u4E16\u754C\u3092\u6298\u308A\u7573\u3080\u3002",
    tags: ["dungeon", "scroll"]
  },
  {
    id: "mithril_drill_sx_r226",
    name: "Mithril Drill SX-R226",
    nameJa: "\u30DF\u30B9\u30EA\u30EB\u30C9\u30EA\u30EB SX-R226",
    category: "tool",
    templates: ["tool_drill", "tool_drill_heavy"],
    rarity: "rare",
    mcItems: ["iron_pickaxe", "prismarine_shard"],
    citPattern: "Mithril Drill SX-R226",
    lore: "HotM Tier 2 \u3067\u4F5C\u308C\u308B\u30DF\u30B9\u30EA\u30EB\u30C9\u30EA\u30EB\u3002Breaking Power 5\u3002",
    tags: ["mechanical", "drill", "mining", "forge"]
  },
  {
    id: "mithril_drill_sx_r326",
    name: "Mithril Drill SX-R326",
    nameJa: "\u30DF\u30B9\u30EA\u30EB\u30C9\u30EA\u30EB SX-R326",
    category: "tool",
    templates: ["tool_drill", "tool_drill_heavy"],
    rarity: "rare",
    mcItems: ["iron_pickaxe", "prismarine_shard"],
    citPattern: "Mithril Drill SX-R326",
    lore: "SX-R226 \u306E\u4E0A\u4F4D\u578B\u3002\u63A1\u6398\u901F\u5EA6600\u3002",
    tags: ["mechanical", "drill", "mining", "forge"]
  },
  {
    id: "titanium_drill_dr_x355",
    name: "Titanium Drill DR-X355",
    nameJa: "\u30C1\u30BF\u30CB\u30A6\u30E0\u30C9\u30EA\u30EB DR-X355",
    category: "tool",
    templates: ["tool_drill", "tool_drill_heavy"],
    rarity: "epic",
    mcItems: ["iron_pickaxe", "iron_ingot"],
    citPattern: "Titanium Drill DR-X355",
    lore: "\u30C1\u30BF\u30F3\u672C\u6D41\u306E\u5165\u53E3\u3002\u30DF\u30B9\u30EA\u30EB\u304B\u3089\u6D3E\u751F\u305B\u305A\u539F\u77F3\u304B\u3089\u4F5C\u308B\u3002",
    tags: ["mechanical", "drill", "mining", "forge"]
  },
  {
    id: "titanium_drill_dr_x455",
    name: "Titanium Drill DR-X455",
    nameJa: "\u30C1\u30BF\u30CB\u30A6\u30E0\u30C9\u30EA\u30EB DR-X455",
    category: "tool",
    templates: ["tool_drill", "tool_drill_heavy"],
    rarity: "epic",
    mcItems: ["iron_pickaxe", "iron_ingot"],
    citPattern: "Titanium Drill DR-X455",
    lore: "\u63A1\u6398\u901F\u5EA6900\u306E\u4E2D\u9593\u578B\u3002\u30A8\u30F3\u30B8\u30F3\u63DB\u88C5\u304C\u53EF\u80FD\u3002",
    tags: ["mechanical", "drill", "mining", "forge"]
  },
  {
    id: "titanium_drill_dr_x555",
    name: "Titanium Drill DR-X555",
    nameJa: "\u30C1\u30BF\u30CB\u30A6\u30E0\u30C9\u30EA\u30EB DR-X555",
    category: "tool",
    templates: ["tool_drill", "tool_drill_heavy"],
    rarity: "epic",
    mcItems: ["iron_pickaxe", "iron_ingot"],
    citPattern: "Titanium Drill DR-X555",
    lore: "\u63A1\u6398\u901F\u5EA61200\u3002\u30B8\u30A7\u30E0\u30B9\u30C8\u30FC\u30F3\u30B9\u30ED\u30C3\u30C8\u304C2\u3064\u3002",
    tags: ["mechanical", "drill", "mining", "forge"]
  },
  {
    id: "gemstone_drill_lt_522",
    name: "Gemstone Drill LT-522",
    nameJa: "\u30B8\u30A7\u30E0\u30B9\u30C8\u30FC\u30F3\u30C9\u30EA\u30EB LT-522",
    category: "tool",
    templates: ["tool_drill", "tool_drill_heavy"],
    rarity: "rare",
    mcItems: ["iron_pickaxe", "prismarine_crystals"],
    citPattern: "Gemstone Drill LT-522",
    lore: "\u5B9D\u77F3\u63A1\u6398\u306B\u7279\u5316\u3057\u305F Breaking Power 8 \u306E\u30C9\u30EA\u30EB\u3002",
    tags: ["mechanical", "drill", "gemstone", "forge"]
  },
  {
    id: "ruby_drill_tx_15",
    name: "Ruby Drill TX-15",
    nameJa: "\u30EB\u30D3\u30FC\u30C9\u30EA\u30EB TX-15",
    category: "tool",
    templates: ["tool_drill", "tool_drill_heavy"],
    rarity: "rare",
    mcItems: ["iron_pickaxe", "redstone"],
    citPattern: "Ruby Drill TX-15",
    lore: "\u30EB\u30D3\u30FC\u63A1\u6398\u306B\u6700\u9069\u5316\u3055\u308C\u305F\u71B1\u3044\u30C9\u30EA\u30EB\u3002",
    tags: ["mechanical", "drill", "ruby", "forge"]
  },
  {
    id: "topaz_drill_kgr_12",
    name: "Topaz Drill KGR-12",
    nameJa: "\u30C8\u30D1\u30FC\u30BA\u30C9\u30EA\u30EB KGR-12",
    category: "tool",
    templates: ["tool_drill", "tool_drill_heavy"],
    rarity: "epic",
    mcItems: ["iron_pickaxe", "gold_ingot"],
    citPattern: "Topaz Drill KGR-12",
    lore: "\u7425\u73C0\u8272\u306E\u56DE\u8EE2\u5203\u3092\u6301\u3064\u4E0A\u4F4D\u30C9\u30EA\u30EB\u3002",
    tags: ["mechanical", "drill", "topaz", "forge"]
  },
  {
    id: "jasper_drill_x",
    name: "Jasper Drill X",
    nameJa: "\u30B8\u30E3\u30B9\u30D1\u30FC\u30C9\u30EA\u30EB X",
    category: "tool",
    templates: ["tool_drill", "tool_drill_heavy"],
    rarity: "epic",
    mcItems: ["iron_pickaxe", "gold_nugget"],
    citPattern: "Jasper Drill X",
    lore: "\u30B8\u30E3\u30B9\u30D1\u30FC\u3068Treasurite\u3067\u7D44\u307F\u4E0A\u3052\u305F\u7279\u6B8A\u30C9\u30EA\u30EB\u3002",
    tags: ["mechanical", "drill", "jasper", "forge"]
  },
  {
    id: "divans_drill",
    name: "Divan's Drill",
    nameJa: "\u30C7\u30A3\u30D0\u30F3\u30BA\u30C9\u30EA\u30EB",
    category: "tool",
    templates: ["tool_drill_heavy", "tool_drill"],
    rarity: "mythic",
    mcItems: ["iron_pickaxe", "diamond"],
    citPattern: "Divan's Drill",
    lore: "\u30C9\u30EA\u30EB\u7CFB\u7D71\u306E\u5230\u9054\u70B9\u3002Mythic\u3002\u30DF\u30B9\u30EA\u30EB\u304B\u3089\u6D3E\u751F\u3057\u306A\u3044\u6700\u4E0A\u4F4D\u6A5F\u3002",
    tags: ["mechanical", "drill", "mythic", "forge"]
  },
  {
    id: "titanium_plated_drill_engine",
    name: "Titanium-Plated Drill Engine",
    nameJa: "\u30C1\u30BF\u30CB\u30A6\u30E0\u30FB\u30C9\u30EA\u30EB\u30A8\u30F3\u30B8\u30F3",
    category: "accessory",
    templates: ["acc_cog", "acc_orb"],
    rarity: "epic",
    mcItems: ["player_head"],
    citPattern: "Titanium-Plated Drill Engine",
    lore: "\u30C1\u30BF\u30F3\u88AB\u8986\u306E\u9AD8\u51FA\u529B\u30A8\u30F3\u30B8\u30F3\u3002",
    tags: ["mechanical", "part", "engine"]
  },
  {
    id: "ruby_polished_drill_engine",
    name: "Ruby-Polished Drill Engine",
    nameJa: "\u30EB\u30D3\u30FC\u30FB\u30DD\u30EA\u30C3\u30B7\u30E5\u30C9\u30A8\u30F3\u30B8\u30F3",
    category: "accessory",
    templates: ["acc_cog", "acc_orb"],
    rarity: "epic",
    mcItems: ["player_head"],
    citPattern: "Ruby-Polished Drill Engine",
    lore: "\u7814\u78E8\u3055\u308C\u305F\u30EB\u30D3\u30FC\u3067\u52A0\u901F\u3059\u308B\u30A8\u30F3\u30B8\u30F3\u3002",
    tags: ["mechanical", "part", "engine", "ruby"]
  },
  {
    id: "amber_polished_drill_engine",
    name: "Amber-Polished Drill Engine",
    nameJa: "\u30A2\u30F3\u30D0\u30FC\u30FB\u30DD\u30EA\u30C3\u30B7\u30E5\u30C9\u30A8\u30F3\u30B8\u30F3",
    category: "accessory",
    templates: ["acc_cog", "acc_orb"],
    rarity: "epic",
    mcItems: ["player_head"],
    citPattern: "Amber-Polished Drill Engine",
    lore: "\u7425\u73C0\u7814\u78E8\u3067\u8010\u4E45\u3092\u4E0A\u3052\u305F\u30A8\u30F3\u30B8\u30F3\u3002",
    tags: ["mechanical", "part", "engine", "amber"]
  },
  {
    id: "perfectly_cut_fuel_tank",
    name: "Perfectly-Cut Fuel Tank",
    nameJa: "\u30D1\u30FC\u30D5\u30A7\u30AF\u30C8\u30AB\u30C3\u30C8\u71C3\u6599\u30BF\u30F3\u30AF",
    category: "accessory",
    templates: ["acc_cog", "acc_orb"],
    rarity: "epic",
    mcItems: ["player_head"],
    citPattern: "Perfectly-Cut Fuel Tank",
    lore: "\u524A\u308A\u51FA\u3057\u3067\u71C3\u6599\u3092\u8A70\u3081\u308B\u6A5F\u68B0\u90E8\u54C1\u3002",
    tags: ["mechanical", "part", "tank"]
  },
  {
    id: "gemstone_fuel_tank",
    name: "Gemstone Fuel Tank",
    nameJa: "\u30B8\u30A7\u30E0\u30B9\u30C8\u30FC\u30F3\u71C3\u6599\u30BF\u30F3\u30AF",
    category: "accessory",
    templates: ["acc_cog", "acc_orb"],
    rarity: "rare",
    mcItems: ["player_head"],
    citPattern: "Gemstone Fuel Tank",
    lore: "\u5B9D\u77F3\u3092\u71C3\u6599\u306B\u5909\u63DB\u3059\u308B\u30BF\u30F3\u30AF\u3002",
    tags: ["mechanical", "part", "tank", "gemstone"]
  },
  {
    id: "titanium_infused_fuel_tank",
    name: "Titanium-Infused Fuel Tank",
    nameJa: "\u30C1\u30BF\u30CB\u30A6\u30E0\u71C3\u6599\u30BF\u30F3\u30AF",
    category: "accessory",
    templates: ["acc_cog", "acc_orb"],
    rarity: "epic",
    mcItems: ["player_head"],
    citPattern: "Titanium-Infused Fuel Tank",
    lore: "\u30C1\u30BF\u30F3\u3092\u6CE8\u5165\u3055\u308C\u305F\u9AD8\u8010\u4E45\u30BF\u30F3\u30AF\u3002",
    tags: ["mechanical", "part", "tank"]
  },
  {
    id: "halberd_of_the_shredded",
    name: "Halberd of the Shredded",
    nameJa: "\u30CF\u30EB\u30D0\u30FC\u30C9\u30FB\u30AA\u30D6\u30FB\u30B6\u30FB\u30B7\u30E5\u30EC\u30C3\u30C7\u30C3\u30C9",
    category: "sword",
    templates: ["sword_gear", "sword_great"],
    rarity: "legendary",
    mcItems: ["iron_axe", "diamond_axe"],
    citPattern: "Halberd of the Shredded",
    lore: "\u7C89\u788E\u6A5F\u304B\u3089\u751F\u307E\u308C\u305F\u6A5F\u68B0\u65A7\u69CD\u3002\u5203\u306B\u56DE\u8EE2\u6A5F\u69CB\u304C\u5BBF\u308B\u3002",
    tags: ["mechanical", "weapon", "shredded"]
  },
  {
    id: "anti_sentient_pickaxe",
    name: "Anti-Sentient Pickaxe",
    nameJa: "\u30A2\u30F3\u30C1\u30FB\u30BB\u30F3\u30C1\u30A8\u30F3\u30C8\u30FB\u30D4\u30C3\u30B1\u30EB",
    category: "tool",
    templates: ["sword_gear", "tool_pickaxe"],
    rarity: "legendary",
    mcItems: ["diamond_pickaxe", "iron_pickaxe"],
    citPattern: "Anti-Sentient Pickaxe",
    lore: "\u610F\u8B58\u3092\u5207\u308A\u843D\u3068\u3059\u6A5F\u68B0\u306E\u9DB4\u5634\u3002\u6B66\u5668\u3068\u3057\u3066\u3082\u6271\u3048\u308B\u3002",
    tags: ["mechanical", "weapon", "pickaxe"]
  },
  {
    id: "gyrokinetic_wand",
    name: "Gyrokinetic Wand",
    nameJa: "\u30B8\u30E3\u30A4\u30ED\u30AD\u30CD\u30C6\u30A3\u30C3\u30AF\u30EF\u30F3\u30C9",
    category: "staff",
    templates: ["staff_gyro", "staff_sceptre"],
    rarity: "epic",
    mcItems: ["blaze_rod", "stick"],
    citPattern: "Gyrokinetic Wand",
    lore: "\u7269\u7406\u6CD5\u5247\u3092\u6B6A\u3081\u3066\u5468\u56F2\u306E\u6575\u3092\u56DE\u8EE2\u5438\u5F15\u3059\u308B\u6642\u8A08\u4ED5\u639B\u3051\u306E\u30B8\u30E3\u30A4\u30ED\u6756\u3002",
    tags: ["mechanical", "clockwork", "utility", "mage"]
  },
  {
    id: "hyper_cleaver",
    name: "Hyper Cleaver",
    nameJa: "\u30CF\u30A4\u30D1\u30FC\u30AF\u30EA\u30FC\u30D0\u30FC",
    category: "sword",
    templates: ["sword_chainsaw", "sword_great"],
    rarity: "rare",
    mcItems: ["golden_sword", "iron_sword"],
    citPattern: "Hyper Cleaver",
    lore: "\u8D85\u9AD8\u901F\u56DE\u8EE2\u3059\u308B\u9023\u9396\u5203\u3092\u5099\u3048\u305F\u91CD\u88C5\u5175\u7528\u5927\u578B\u6A5F\u68B0\u5927\u9248\u3002",
    tags: ["mechanical", "cleaver", "dungeon", "berserk"]
  },
  {
    id: "plasma_chainsaw",
    name: "Plasma Chainsaw",
    nameJa: "\u30D7\u30E9\u30BA\u30DE\u30C1\u30A7\u30FC\u30F3\u30BD\u30FC",
    category: "sword",
    templates: ["sword_chainsaw", "sword_piston"],
    rarity: "legendary",
    mcItems: ["diamond_axe", "diamond_sword"],
    citPattern: "Plasma Chainsaw",
    lore: "\u8D85\u9AD8\u71B1\u30D7\u30E9\u30BA\u30DE\u3092\u5E2F\u3073\u305F\u9AD8\u901F\u56DE\u8EE2\u6B6F\u8ECA\u3067\u88C5\u7532\u3092\u713C\u304D\u5207\u308B\u5DE5\u696D\u4F10\u63A1\u6A5F\u3002",
    tags: ["mechanical", "cyber", "plasma", "industrial"]
  },
  {
    id: "steampunk_railgun",
    name: "Dwarven Railgun",
    nameJa: "\u30C9\u30EF\u30FC\u30D5\u30FB\u30EC\u30FC\u30EB\u30AC\u30F3",
    category: "bow",
    templates: ["bow_railgun", "bow_heavy"],
    rarity: "legendary",
    mcItems: ["bow", "crossbow"],
    citPattern: "Dwarven Railgun",
    lore: "\u96FB\u78C1\u30EC\u30FC\u30EB\u30B3\u30A4\u30EB\u3067\u9244\u676D\u3092\u97F3\u901F\u5C04\u51FA\u3059\u308B\u30C9\u30EF\u30FC\u30D5\u8D85\u5175\u5668\u3002",
    tags: ["mechanical", "dwarf", "railgun", "archer"]
  },
  {
    id: "flintlock_repeater",
    name: "Clockwork Repeater",
    nameJa: "\u30AF\u30ED\u30C3\u30AF\u30EF\u30FC\u30AF\u30FB\u30EA\u30D4\u30FC\u30BF\u30FC",
    category: "bow",
    templates: ["bow_crossbow", "bow_railgun"],
    rarity: "epic",
    mcItems: ["crossbow", "bow"],
    citPattern: "Clockwork Repeater",
    lore: "\u7CBE\u5BC6\u6B6F\u8ECA\u306E\u9023\u52D5\u306B\u3088\u308A\u77E2\u3092\u9AD8\u901F\u88C5\u586B\u3057\u3066\u9023\u5C04\u3059\u308B\u6A5F\u68B0\u5F13\u9283\u3002",
    tags: ["mechanical", "clockwork", "steampunk", "archer"]
  },
  {
    id: "steam_pilebunker",
    name: "Hydraulic Pilebunker",
    nameJa: "\u6CB9\u5727\u30D1\u30A4\u30EB\u30D0\u30F3\u30AB\u30FC",
    category: "tool",
    templates: ["tool_pilebunker", "tool_gauntlet"],
    rarity: "legendary",
    mcItems: ["diamond_pickaxe", "iron_pickaxe"],
    citPattern: "Hydraulic Pilebunker",
    lore: "\u8D85\u9AD8\u5727\u84B8\u6C17\u30B7\u30EA\u30F3\u30C0\u30FC\u3067\u8D85\u786C\u8CEA\u676D\u3092\u5C04\u3061\u8FBC\u307F\u5CA9\u76E4\u3092\u7C89\u7815\u3059\u308B\u8155\u90E8\u5175\u5668\u3002",
    tags: ["mechanical", "steam", "mining", "heavy"]
  },
  {
    id: "artificer_wrench",
    name: "Artificer's Omni-Wrench",
    nameJa: "\u30A2\u30FC\u30C6\u30A3\u30D5\u30A3\u30B5\u30FC\u30BA\u30FB\u30EC\u30F3\u30C1",
    category: "tool",
    templates: ["tool_wrench", "tool_drill"],
    rarity: "rare",
    mcItems: ["iron_pickaxe", "shears"],
    citPattern: "Artificer's Omni-Wrench",
    lore: "\u3042\u3089\u3086\u308B\u6A5F\u68B0\u69CB\u9020\u3092\u77AC\u6642\u306B\u8ABF\u6574\u30FB\u5206\u89E3\u3067\u304D\u308B\u5DE5\u623F\u306E\u4E07\u80FD\u5909\u5F62\u30EC\u30F3\u30C1\u3002",
    tags: ["mechanical", "steampunk", "tool", "utility"]
  },
  {
    id: "automaton_blade",
    name: "Automaton Heartblade",
    nameJa: "\u30AA\u30FC\u30C8\u30DE\u30BF\u30FB\u30CF\u30FC\u30C8\u30D6\u30EC\u30FC\u30C9",
    category: "sword",
    templates: ["sword_piston", "sword_broad"],
    rarity: "legendary",
    mcItems: ["diamond_sword", "iron_sword"],
    citPattern: "Automaton Heartblade",
    lore: "\u53E4\u4EE3\u30AA\u30FC\u30C8\u30DE\u30BF\u306E\u6C38\u4E45\u6A5F\u95A2\u30B3\u30A2\u3092\u7D44\u307F\u8FBC\u307F\u3001\u84B8\u6C17\u5727\u3067\u65AC\u6483\u3092\u52A0\u901F\u3059\u308B\u6A5F\u68B0\u5263\u3002",
    tags: ["mechanical", "automaton", "steampunk", "berserk"]
  },
  {
    id: "tachyon_cleaver",
    name: "Tachyon Cleaver",
    nameJa: "\u30BF\u30AD\u30AA\u30F3\u30AF\u30EA\u30FC\u30D0\u30FC",
    category: "sword",
    templates: ["sword_chainsaw", "sword_katana"],
    rarity: "legendary",
    mcItems: ["diamond_sword"],
    citPattern: "Tachyon Cleaver",
    lore: "\u6642\u9593\u52A0\u901F\u30D4\u30B9\u30C8\u30F3\u3068\u96FB\u78C1\u30D6\u30EC\u30FC\u30C9\u306B\u3088\u308A\u632F\u308A\u306E\u77AC\u9593\u3060\u3051\u52A0\u901F\u3059\u308B\u8D85\u672A\u6765\u5927\u9248\u3002",
    tags: ["mechanical", "cyber", "tachyon", "crit"]
  },
  {
    id: "mecha_gauntlet",
    name: "Steamwork Power Gauntlet",
    nameJa: "\u30B9\u30C1\u30FC\u30E0\u30EF\u30FC\u30AF\u30FB\u30D1\u30EF\u30FC\u30AC\u30F3\u30C8\u30EC\u30C3\u30C8",
    category: "tool",
    templates: ["tool_pilebunker", "tool_gauntlet"],
    rarity: "epic",
    mcItems: ["player_head", "golden_pickaxe"],
    citPattern: "Steamwork Power Gauntlet",
    lore: "\u771F\u936E\u6B6F\u8ECA\u3068\u6392\u6C17\u30D0\u30EB\u30D6\u3092\u642D\u8F09\u3057\u3001\u6253\u6483\u3068\u63A1\u6398\u3092\u540C\u6642\u306B\u5F37\u5316\u3059\u308B\u5F37\u5316\u624B\u7532\u3002",
    tags: ["mechanical", "steampunk", "brass", "mining"]
  }
];
var CATALOG_MAP = Object.fromEntries(
  CATALOG.map((item) => [item.id, item])
);
function getItem(id) {
  return CATALOG_MAP[id];
}

// ../skyblock/hypixel-skyblock-texture-generator (1)/src/lib/colors.ts
function clamp(n, lo = 0, hi = 255) {
  return Math.max(lo, Math.min(hi, n));
}
function hexToRgb(hex) {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16)
  ];
}
function mixRgb(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
}
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
      break;
  }
  return [h / 6 * 360, s, l];
}
function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
function hslToRgb(h, s, l) {
  h = (h % 360 + 360) % 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hn = h / 360;
  return [
    Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hn) * 255),
    Math.round(hue2rgb(p, q, hn - 1 / 3) * 255)
  ];
}
function shiftHueRgb(rgb, deg) {
  if (!deg) return rgb;
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  return hslToRgb(h + deg, s, l);
}
function saturateRgb(rgb, amount) {
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  return hslToRgb(h, clamp(s + amount, 0, 1), l);
}

// ../skyblock/hypixel-skyblock-texture-generator (1)/src/lib/rng.ts
function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function rngInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
function rngPick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}
function rngBool(rng, chance = 0.5) {
  return rng() < chance;
}

// ../skyblock/hypixel-skyblock-texture-generator (1)/src/lib/rarity.ts
var RARITY_IDS = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "divine",
  "special",
  "very_special",
  "ultimate"
];
var RARITIES = {
  common: { label: "COMMON", labelJa: "\u30B3\u30E2\u30F3", color: "#f2f2f2", glow: "#9aa0a6", sparkle: 0 },
  uncommon: { label: "UNCOMMON", labelJa: "\u30A2\u30F3\u30B3\u30E2\u30F3", color: "#55ff55", glow: "#2ecc71", sparkle: 0 },
  rare: { label: "RARE", labelJa: "\u30EC\u30A2", color: "#5555ff", glow: "#4d6dff", sparkle: 1 },
  epic: { label: "EPIC", labelJa: "\u30A8\u30D4\u30C3\u30AF", color: "#aa00aa", glow: "#d946ef", sparkle: 2 },
  legendary: { label: "LEGENDARY", labelJa: "\u30EC\u30B8\u30A7\u30F3\u30C0\u30EA\u30FC", color: "#ffaa00", glow: "#f5c542", sparkle: 3 },
  mythic: { label: "MYTHIC", labelJa: "\u30DF\u30B7\u30C3\u30AF", color: "#ff55ff", glow: "#ff6bff", sparkle: 5 },
  divine: { label: "DIVINE", labelJa: "\u30C7\u30A3\u30D0\u30A4\u30F3", color: "#55ffff", glow: "#67e8f9", sparkle: 6 },
  special: { label: "SPECIAL", labelJa: "\u30B9\u30DA\u30B7\u30E3\u30EB", color: "#ff5555", glow: "#fb7185", sparkle: 4 },
  very_special: { label: "VERY SPECIAL", labelJa: "\u30D9\u30EA\u30FC\u30FB\u30B9\u30DA\u30B7\u30E3\u30EB", color: "#ff5555", glow: "#ff7a7a", sparkle: 6 },
  ultimate: { label: "ULTIMATE", labelJa: "\u30A2\u30EB\u30C6\u30A3\u30E1\u30C3\u30C8", color: "#ff6b33", glow: "#ff8a3d", sparkle: 8 }
};
function isRarity(v) {
  return RARITY_IDS.includes(v);
}

// ../skyblock/hypixel-skyblock-texture-generator (1)/src/lib/shade.ts
var BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];
function bayer(x, y) {
  return (BAYER4[y & 3][x & 3] + 0.5) / 16;
}
var CHAR_TO_MATERIAL = {
  b: "blade",
  B: "core",
  m: "iron",
  M: "gold",
  g: "gem",
  w: "wood",
  l: "leather",
  c: "cloth",
  s: "string",
  e: "energy",
  k: "bone",
  p: "fur",
  r: "rune"
};
var MATERIAL_BASE = {
  blade: "metal",
  core: "metal",
  iron: "metal",
  gold: "gold",
  gem: "gem",
  wood: "wood",
  leather: "leather",
  cloth: "cloth",
  string: "bone",
  energy: "energy",
  bone: "bone",
  fur: "fur",
  rune: "energy"
};
var MATERIAL_TONE = {
  blade: [0.14, 0.06],
  core: [-0.1, -0.06],
  iron: [-0.02, -0.1],
  gold: [0.1, 0.12],
  gem: [0.04, 0.3],
  wood: [-0.04, -0.04],
  leather: [-0.08, -0.08],
  cloth: [-0.02, 0.02],
  string: [0.16, -0.2],
  energy: [0.16, 0.24],
  bone: [0.1, -0.16],
  fur: [-0.02, 0.06],
  rune: [0.1, 0.2]
};
function materialBase(material, pal, hueShift) {
  const key = MATERIAL_BASE[material];
  let rgb = pal[key];
  rgb = shiftHueRgb(rgb, hueShift);
  const [dl, ds] = MATERIAL_TONE[material];
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  const lo = material === "energy" || material === "rune" ? 0.42 : 0.26;
  const hi = material === "gem" || material === "energy" ? 0.6 : 0.5;
  return hslToRgb(h, clamp(s + ds, 0.18, 0.96), clamp(l + dl, lo, hi));
}
var EMISSIVE = {
  blade: 0,
  core: 0,
  iron: 0,
  gold: 0.08,
  gem: 0.42,
  wood: 0,
  leather: 0,
  cloth: 0,
  string: 0,
  energy: 1,
  bone: 0,
  fur: 0,
  rune: 0.9
};
var MATERIAL_LEVEL = {
  blade: 0.34,
  core: -0.1,
  iron: -0.02,
  gold: 0.22,
  gem: 0.12,
  wood: -0.04,
  leather: -0.16,
  cloth: -0.06,
  string: 0.2,
  energy: 0.4,
  bone: 0.14,
  fur: -0.02,
  rune: 0.3
};
var SPECULAR = {
  blade: 1,
  core: 0.55,
  iron: 0.7,
  gold: 1,
  gem: 1,
  wood: 0.12,
  leather: 0.15,
  cloth: 0.05,
  string: 0.2,
  energy: 0.8,
  bone: 0.25,
  fur: 0.1,
  rune: 0.6
};
var LIGHT = (() => {
  const x = -0.62;
  const y = -0.78;
  const l = Math.hypot(x, y);
  return [x / l, y / l];
})();
function computeField(grid) {
  const size = grid.length;
  const n = size * size;
  const mask = new Array(n).fill(false);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) mask[y * size + x] = grid[y][x] !== ".";
  const dist = new Array(n).fill(-1);
  const queue = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      if (!mask[i]) continue;
      const open = x === 0 || y === 0 || x === size - 1 || y === size - 1 || !mask[i - 1] || !mask[i + 1] || !mask[i - size] || !mask[i + size];
      if (open) {
        dist[i] = 0;
        queue.push(i);
      }
    }
  }
  let head = 0;
  let maxDist = 0;
  while (head < queue.length) {
    const i = queue[head++];
    const x = i % size;
    const y = Math.floor(i / size);
    const d = dist[i] + 1;
    const nb = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ];
    for (const [ox, oy] of nb) {
      if (ox < 0 || oy < 0 || ox >= size || oy >= size) continue;
      const j = oy * size + ox;
      if (!mask[j] || dist[j] !== -1) continue;
      dist[j] = d;
      if (d > maxDist) maxDist = d;
      queue.push(j);
    }
  }
  let cx = 0;
  let cy = 0;
  let count = 0;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (mask[y * size + x]) {
        cx += x;
        cy += y;
        count++;
      }
  cx = count ? cx / count : size / 2;
  cy = count ? cy / count : size / 2;
  const nx = new Array(n).fill(0);
  const ny = new Array(n).fill(0);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      if (!mask[i]) continue;
      let ax = 0;
      let ay = 0;
      if (dist[i] === 0) {
        if (x === 0 || !mask[i - 1]) ax -= 1;
        if (x === size - 1 || !mask[i + 1]) ax += 1;
        if (y === 0 || !mask[i - size]) ay -= 1;
        if (y === size - 1 || !mask[i + size]) ay += 1;
      } else {
        const l = dist[i - 1] ?? dist[i];
        const r = dist[i + 1] ?? dist[i];
        const u = dist[i - size] ?? dist[i];
        const d2 = dist[i + size] ?? dist[i];
        ax = (l ?? 0) - (r ?? 0);
        ay = (u ?? 0) - (d2 ?? 0);
      }
      const len = Math.hypot(ax, ay);
      if (len > 1e-3) {
        nx[i] = ax / len;
        ny[i] = ay / len;
      } else {
        const dx = x - cx;
        const dy = y - cy;
        const dl = Math.hypot(dx, dy) || 1;
        nx[i] = dx / dl;
        ny[i] = dy / dl;
      }
    }
  }
  return { size, mask, dist, maxDist: Math.max(1, maxDist), nx, ny, ax: 1, ay: 0 };
}
function principalAxis(field, size) {
  let cx = 0;
  let cy = 0;
  let n = 0;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (field.mask[y * size + x]) {
        cx += x;
        cy += y;
        n++;
      }
  if (!n) return [1, 0];
  cx /= n;
  cy /= n;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (field.mask[y * size + x]) {
        sxx += (x - cx) ** 2;
        syy += (y - cy) ** 2;
        sxy += (x - cx) * (y - cy);
      }
  if (sxx + syy + Math.abs(sxy) < 0.01) return [1, 0];
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  let ax = Math.cos(theta);
  let ay = Math.sin(theta);
  if (ax * LIGHT[0] + ay * LIGHT[1] < 0) {
    ax = -ax;
    ay = -ay;
  }
  return [ax, ay];
}
function ramp(base, level, dark, light, satMul, hiCap) {
  const [h, s, l] = rgbToHsl(base[0], base[1], base[2]);
  const ls = clamp(s * satMul * (1 + Math.abs(level) * 0.14), 0, 1);
  const ll = clamp(l + level * 0.3, 0.04, 0.94);
  let rgb = hslToRgb(h, ls, ll);
  if (level < 0) {
    rgb = mixRgb(rgb, dark, Math.min(0.78, -level * 0.7));
  } else {
    rgb = mixRgb(rgb, light, Math.min(hiCap, level * 0.3));
  }
  return rgb;
}
function quantise(level, bands, dither, x, y) {
  const steps = Math.max(2, bands - 1);
  const scaled = level * steps;
  if (dither <= 0.02) return Math.round(scaled) / steps;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  const threshold = bayer(x, y);
  const q = frac > threshold + (1 - dither) * 0.5 ? floor + 1 : floor;
  return q / steps;
}
function ornamentValue(material, x, y, field, cfg, rng) {
  const amount = cfg.sig.ornament;
  if (amount <= 0.02) return 0;
  const d = cfg.detailScale;
  const i = y * field.size + x;
  const dist = field.dist[i] ?? 0;
  const along = x * field.ax + y * field.ay;
  const perp = x * -field.ay + y * field.ax;
  const onLine = (period, phase = 0, width = 1) => ((x + y + phase) % period + period) % period < width * d;
  const microGate = (d - 1) / 3;
  const microGain = (v) => v > 0 ? v * 0.66 : v * 1.05;
  switch (material) {
    case "gold":
    case "iron": {
      const lattice = (onLine(4 * d) ? 0.16 : 0) + (((x - y) % (5 * d) + 5 * d) % (5 * d) === 0 ? -0.12 : 0);
      const rivet = (x * 7 + y * 13) % (11 * d) === 0 ? 0.3 : 0;
      let micro = 0;
      if (microGate > 0) {
        const scroll2 = Math.sin(along / (2.2 * d)) * 0.5 + 0.5;
        micro = Math.abs(perp % (3 * d)) < 1 ? (scroll2 - 0.35) * 0.34 : 0;
        if (dist === 1 && Math.round(along) % Math.max(2, 2 * d) === 0) micro += 0.16;
      }
      return (lattice + rivet) * amount + microGain(micro) * microGate * amount;
    }
    case "blade":
    case "core": {
      const grind = onLine(3 * d) ? 0.1 : 0;
      const nick = 0;
      let micro = 0;
      if (microGate > 0) {
        micro = Math.abs(perp % (4 * d)) < 1.2 ? -0.12 : 0;
        micro += Math.abs(perp) < 0.9 * d ? 0.2 : 0;
        if (dist === 0 && Math.round(along) % Math.max(2, 2 * d) === 0) micro += 0.14;
      }
      return grind * amount + nick + (dist === 0 ? 0.06 * amount : 0) + microGain(micro) * microGate * amount;
    }
    case "gem": {
      const wedge = ((x + y) % (2 * d) < d ? 0.18 : -0.14) * amount;
      const inner = dist === 0 ? 0.1 * amount : 0;
      let micro = 0;
      if (microGate > 0) {
        const a = Math.floor(along / (2 * d));
        const b = Math.floor(perp / (2 * d));
        micro = (a + b) % 2 === 0 ? 0.16 : -0.12;
        if (dist >= 1 && dist <= 2 * d) micro += 0.1;
      }
      return wedge + inner + microGain(micro) * microGate * amount;
    }
    case "wood": {
      const grain = ((x * 2 + y) % (5 * d) < 2 * d ? -0.14 : 0.06) * amount;
      let micro = 0;
      if (microGate > 0) {
        const wave = Math.sin(along / (3 * d)) * 0.8;
        micro = Math.abs(perp + wave) % (2 * d) < 1 ? -0.14 : 0.05;
      }
      return grain + microGain(micro) * microGate * amount;
    }
    case "leather":
    case "cloth": {
      const weave = ((x % (2 * d) < d ? 1 : 0) + (y % (2 * d) < d ? 1 : 0)) % 2 === 0 ? 0.07 : -0.07;
      const stitch = (x + y) % (7 * d) === 0 ? 0.18 : 0;
      let micro = 0;
      if (microGate > 0) {
        micro = Math.abs(perp % (3 * d)) < 1 ? 0.12 : 0;
        if ((x * 5 + y * 3) % (13 * d) === 0) micro -= 0.1;
      }
      return (weave + stitch) * amount + microGain(micro) * microGate * amount;
    }
    case "fur": {
      const speckle = 0;
      const stripe = ((x + Math.floor(y / d)) % (4 * d) === 0 ? -0.2 : 0) * amount;
      let micro = 0;
      if (microGate > 0) {
        const wave = Math.sin(along / (4 * d)) * 1.2;
        micro = Math.abs(perp + wave) % (1.6 * d) < 0.9 ? -0.18 : 0.08;
      }
      return speckle + stripe + microGain(micro) * microGate * amount;
    }
    case "bone": {
      const crack = (x * 3 + y * 5) % (9 * d) === 0 ? -0.3 * amount : 0;
      let micro = 0;
      if (microGate > 0) {
        micro = Math.abs(perp % (5 * d)) < 1 ? -0.1 : 0;
        micro += (rng() - 0.5) * 0.12;
      }
      return crack + (rng() - 0.5) * 0.1 * amount + microGain(micro) * microGate * amount;
    }
    case "energy":
    case "rune": {
      const pulse = Math.sin((x + y) / (1.4 * d)) * 0.14 * amount;
      let micro = 0;
      if (microGate > 0) {
        const wisp = Math.sin(along / (1.8 * d) + Math.sin(perp / (2.5 * d)) * 1.4);
        micro = wisp > 0.72 ? 0.3 : wisp < -0.86 ? -0.18 : 0;
      }
      return pulse + microGain(micro) * microGate * amount;
    }
    default:
      return 0;
  }
}
function localCross(field, px, py) {
  const size = field.size;
  const u = new Array(size * size).fill(0.5);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      if (!field.mask[i]) continue;
      const march = (sx, sy, dx, dy) => {
        let steps = 0;
        let cx = sx;
        let cy = sy;
        while (steps < size) {
          cx += dx * 0.5;
          cy += dy * 0.5;
          const rx = Math.round(cx);
          const ry = Math.round(cy);
          if (rx < 0 || ry < 0 || rx >= size || ry >= size) break;
          if (!field.mask[ry * size + rx]) break;
          steps++;
        }
        return steps * 0.5;
      };
      const back = march(x, y, -px, -py);
      const fwd = march(x, y, px, py);
      const total = back + fwd;
      u[i] = total > 1e-3 ? back / total : 0.5;
    }
  }
  return u;
}
function shadeGrid(grid, cfg) {
  const rng = mulberry32(cfg.seed ^ 1374496513);
  const field = computeField(grid);
  const size = field.size;
  const pixels = new Array(size * size * 4).fill(0);
  const detail = Math.max(1, Math.round(cfg.detailScale ?? 1));
  const axis = principalAxis(field, size);
  field.ax = axis[0];
  field.ay = axis[1];
  const dark = mixRgb(cfg.pal.outline, [0, 0, 0], 0.25);
  const lightTint = mixRgb([255, 250, 235], cfg.pal.accent, 0.34);
  const outlineRgb = mixRgb(
    cfg.pal.outline,
    cfg.pal.metal,
    cfg.sig.outlineSoft * 0.42
  );
  const specRgb = mixRgb([255, 255, 255], cfg.pal.gem, 0.12);
  const metalT = cfg.metallic / 100;
  const bands = cfg.sig.bands <= 3 ? 3 : Math.min(10, Math.round(cfg.sig.bands * (1 + (detail - 1) * 0.45)));
  const satMul = cfg.sig.sat * (0.85 + metalT * 0.3);
  const contrast = 1 + cfg.sig.contrast * 0.7;
  const cleanFactor = 1 - cfg.sig.clean * 0.6;
  const inkDepth = Math.max(1, Math.round(detail * 0.5));
  const hiCap = 0.34 * (1 - (detail - 1) * 0.055);
  const ax = field.ax;
  const ay = field.ay;
  let cxm = 0;
  let cym = 0;
  let nMask = 0;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      if (!field.mask[i]) continue;
      nMask++;
      cxm += x;
      cym += y;
    }
  cxm /= Math.max(1, nMask);
  cym /= Math.max(1, nMask);
  let px = -ay;
  let py = ax;
  if (px * LIGHT[0] + py * LIGHT[1] < 0) {
    px = -px;
    py = -py;
  }
  const axialT = new Array(size * size).fill(0.5);
  const crossT = new Array(size * size).fill(0.5);
  if (nMask > 3) {
    let minA = Infinity;
    let maxA = -Infinity;
    let minC = Infinity;
    let maxC = -Infinity;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        if (!field.mask[i]) continue;
        const a = (x - cxm) * ax + (y - cym) * ay;
        const c = (x - cxm) * px + (y - cym) * py;
        axialT[i] = a;
        crossT[i] = c;
        if (a < minA) minA = a;
        if (a > maxA) maxA = a;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    const spanA = Math.max(1e-3, maxA - minA);
    for (let i = 0; i < axialT.length; i++) axialT[i] = (axialT[i] - minA) / spanA;
  }
  void (() => {
    for (let i = 0; i < crossT.length; i++) crossT[i] = 0.5;
  })();
  const crossLocal = localCross(field, px, py);
  for (let i = 0; i < crossT.length; i++) crossT[i] = crossLocal[i] ?? 0.5;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const ch = grid[y][x];
      if (ch === "." || !field.mask[i]) continue;
      const material = CHAR_TO_MATERIAL[ch];
      if (!material) continue;
      const base = materialBase(material, cfg.pal, cfg.hueShift);
      const d = field.dist[i] ?? 0;
      const nx = field.nx[i] ?? 0;
      const ny = field.ny[i] ?? 0;
      const lambert = clamp(nx * LIGHT[0] + ny * LIGHT[1], -1, 1);
      const form = d / field.maxDist;
      const emissive = EMISSIVE[material];
      const step = Math.max(1, detail);
      const openAt = (dx, dy) => {
        const xx = x + dx * step;
        const yy = y + dy * step;
        if (xx < 0 || yy < 0 || xx >= size || yy >= size) return true;
        return !field.mask[yy * size + xx];
      };
      let openFaces = 0;
      if (openAt(-1, 0)) openFaces++;
      if (openAt(1, 0)) openFaces++;
      if (openAt(0, -1)) openFaces++;
      if (openAt(0, 1)) openFaces++;
      const thinMix = clamp((openFaces - 1) / 2.2, 0, 0.85);
      const lambertEff = lambert * (1 - thinMix) + MATERIAL_LEVEL[material] * thinMix * 1.35;
      const rim = lambertEff * cfg.sig.bevel * 0.95;
      const formCurve = (form - 0.5) * cfg.sig.depth * 0.26;
      const occlusion = form > 0.62 ? -(form - 0.62) * cfg.sig.depth * 0.55 : 0;
      const pseudo = ny * cfg.sig.pseudo3d * 0.3 + nx * cfg.sig.pseudo3d * 0.1;
      const axial = ((axialT[i] ?? 0.5) - 0.45) * cfg.sig.axialGrad * 0.8;
      const cylWeight = material === "blade" || material === "core" ? 1 : material === "gold" || material === "iron" ? 0.6 : 0.35;
      const cyl = (0.5 - (crossT[i] ?? 0.5)) * (cfg.sig.bevel * 0.5 + cfg.sig.depth * 0.24) * 1.7 * cylWeight;
      const materialBias = MATERIAL_LEVEL[material] * (1 - thinMix) * 0.3;
      let level = clamp(
        (rim + formCurve + occlusion + axial + cyl + materialBias - pseudo) * contrast * 0.78 - 0.04,
        -1,
        1
      );
      level = Math.max(level, emissive * 0.5);
      const ornament = ornamentValue(material, x, y, field, cfg, rng) * cleanFactor;
      level = clamp(level + ornament, -1, 1);
      const isBoundary = d === 0;
      const innerRing = d === inkDepth && cfg.sig.doubleEdge > 0.05;
      let rgb;
      let alpha = 255;
      const inkThreshold = 0.15 + cfg.sig.edgeDark * 0.55;
      const inked = d < inkDepth && emissive < 0.5;
      if (inked) {
        const litSide = lambert > inkThreshold ? 0.45 : 0;
        const soft = (1 - cfg.sig.outline) * 0.6 + litSide;
        const bodyDark = ramp(base, -0.55, dark, lightTint, satMul, hiCap);
        rgb = mixRgb(mixRgb(outlineRgb, bodyDark, 0.55), ramp(base, level - 0.2, dark, lightTint, satMul, hiCap), soft);
        if (innerRing) rgb = mixRgb(rgb, dark, 0.24 * cfg.sig.doubleEdge);
      } else {
        let bodyLevel = level;
        const rimBand = d >= inkDepth && d < inkDepth + inkDepth;
        if (rimBand && cfg.sig.innerRim > 0.02 && lambert > -0.1) {
          bodyLevel += cfg.sig.innerRim * 0.22 * clamp(lambert + 0.4, 0, 1);
        }
        const q = quantise(clamp(bodyLevel, -1, 1), bands, cfg.sig.dither, x, y);
        rgb = ramp(base, q, dark, lightTint, satMul, hiCap);
        if (innerRing && lambert < 0) rgb = mixRgb(rgb, dark, 0.3 * cfg.sig.doubleEdge);
        if (isBoundary && lambert > 0.3) {
          const power = clamp((lambert - 0.3) * (0.28 + cfg.sig.innerRim * 0.5), 0, 0.45);
          rgb = mixRgb(rgb, lightTint, power);
        }
        const specPower = SPECULAR[material] * cfg.sig.spec * (0.4 + metalT * 0.6);
        if (specPower > 0.5 && lambert > 0.86 && d === inkDepth && (x + y * 3) % 7 === 0) {
          rgb = mixRgb(rgb, specRgb, clamp(0.45 + specPower * 0.35, 0, 0.85));
        }
        if (emissive > 0) {
          const boost = emissive * (0.35 + cfg.glow / 160);
          rgb = mixRgb(rgb, mixRgb(specRgb, base, 0.35), clamp(boost, 0, 0.75));
        }
      }
      if (cfg.sig.grain > 0.4) {
        const n = (bayer(x, y) - 0.5) * 6 * cfg.sig.grain;
        rgb = [rgb[0] + n, rgb[1] + n, rgb[2] + n];
      }
      rgb = saturateRgb(rgb, (satMul - 1) * 0.35);
      const o = i * 4;
      pixels[o] = clamp(rgb[0]);
      pixels[o + 1] = clamp(rgb[1]);
      pixels[o + 2] = clamp(rgb[2]);
      pixels[o + 3] = alpha;
    }
  }
  bloomAndGlow(pixels, field, cfg);
  return { pixels, width: size, height: size };
}
function bloomAndGlow(pixels, field, cfg) {
  const size = field.size;
  const strength = cfg.glow / 100 * (0.35 + cfg.sig.rim * 0.9);
  if (strength <= 0.01) return;
  const glowRgb = cfg.glowColor;
  const spill = new Array(size * size).fill(0);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      if (!field.mask[i]) continue;
      const a = pixels[i * 4 + 3] ?? 0;
      if (a < 200) continue;
      const bright = (pixels[i * 4] + pixels[i * 4 + 1] + pixels[i * 4 + 2]) / 3;
      if (bright < 170) continue;
      for (let oy = -1; oy <= 1; oy++)
        for (let ox = -1; ox <= 1; ox++) {
          if (!ox && !oy) continue;
          const j = (y + oy) * size + (x + ox);
          if (j < 0 || j >= size * size) continue;
          spill[j] += ox === 0 || oy === 0 ? 0.5 : 0.28;
        }
    }
  }
  for (let i = 0; i < size * size; i++) {
    if (!field.mask[i] || spill[i] <= 0) continue;
    const t = clamp(spill[i] * 0.22 * strength, 0, 0.5);
    pixels[i * 4] = clamp(pixels[i * 4] + glowRgb[0] * t);
    pixels[i * 4 + 1] = clamp(pixels[i * 4 + 1] + glowRgb[1] * t);
    pixels[i * 4 + 2] = clamp(pixels[i * 4 + 2] + glowRgb[2] * t);
  }
}
function sparklePass(pixels, field, count, seed) {
  if (count <= 0) return;
  const rng = mulberry32(seed ^ 625341585);
  const size = field.size;
  let placed = 0;
  let guard = 0;
  while (placed < count && guard < 600) {
    guard++;
    const x = 1 + Math.floor(rng() * (size - 2));
    const y = 1 + Math.floor(rng() * (size - 2));
    const i = y * size + x;
    if (!field.mask[i]) continue;
    if ((pixels[i * 4 + 3] ?? 0) < 200) continue;
    const bright = (pixels[i * 4] + pixels[i * 4 + 1] + pixels[i * 4 + 2]) / 3;
    if (bright < 90) continue;
    pixels[i * 4] = 255;
    pixels[i * 4 + 1] = 252;
    pixels[i * 4 + 2] = 235;
    pixels[i * 4 + 3] = 255;
    if (rngBool(rng, 0.5)) {
      const j = i + (rng() < 0.5 ? 1 : size);
      if (field.mask[j] && (pixels[j * 4 + 3] ?? 0) > 150) {
        pixels[j * 4] = mixRgb([pixels[j * 4], pixels[j * 4 + 1], pixels[j * 4 + 2]], [255, 250, 225], 0.6)[0];
        pixels[j * 4 + 1] = 250;
        pixels[j * 4 + 2] = 225;
      }
    }
    placed++;
  }
}

// ../skyblock/hypixel-skyblock-texture-generator (1)/src/lib/styles.ts
var SIGNATURES = [
  {
    id: "reborn_clean",
    name: "Reborn Clarity",
    nameJa: "\u30EA\u30DC\u30FC\u30F3\u30FB\u30AF\u30E9\u30EA\u30C6\u30A3",
    tagline: "clean \u3067\u7CBE\u5BC6\u3002\u30A2\u30A4\u30B3\u30F3\u3068\u3057\u3066\u5373\u8AAD\u3081\u308B",
    essence: "\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3\u6700\u5927\u624B\u306E\u201C\u898B\u305B\u308B pack\u201D\u306E\u753B\u6CD5\u3002\u8F2A\u90ED\u306F\u786C\u304F\u3001\u9762\u306F\u5C11\u306A\u3044\u30D0\u30F3\u30C9\u3067\u660E\u5FEB\u306B\u3001\u5B9D\u77F3\u306F\u30C4\u30E4\u91CD\u8996\u3002\u30E1\u30CB\u30E5\u30FC\u306B\u4E26\u3093\u3060\u77AC\u9593\u306B\u4F55\u306E\u30A2\u30A4\u30C6\u30E0\u304B\u5206\u304B\u308B\u60C5\u5831\u8A2D\u8A08\u3002",
    inspiredNote: "FurfSky Reborn \u7CFB\u306E clean & detailed",
    tags: ["clean", "detailed", "readable"],
    outline: 0.95,
    outlineSoft: 0.25,
    doubleEdge: 0.35,
    bevel: 0.92,
    depth: 0.4,
    pseudo3d: 0.3,
    bands: 4,
    dither: 0.3,
    spec: 0.75,
    ornament: 0.55,
    sat: 1.18,
    contrast: 0.62,
    grain: 0.12,
    rim: 0.5,
    clean: 0.75,
    edgeDark: 0.85,
    innerRim: 0.9,
    axialGrad: 0.38
  },
  {
    id: "imperial_ornate",
    name: "Imperial Regalia",
    nameJa: "\u30A4\u30F3\u30DA\u30EA\u30A2\u30EB\u30FB\u30EC\u30AC\u30EA\u30A2",
    tagline: "\u91CD\u539A\u3002\u91D1\u7D30\u5DE5\u3068\u6DF1\u3044\u9670\u5F71\u306E\u738B\u5BA4\u88C5\u98FE",
    essence: "\u88C5\u98FE\u91CF\u3067\u62BC\u3059\u753B\u6CD5\u3002\u6697\u3044\u5730\u91D1\u306B\u91D1\u306E\u30D5\u30A3\u30EA\u30B0\u30EA\u30FC\u3001\u539A\u3044\u9670\u5F71\u3001\u5B9D\u77F3\u306E\u591A\u9762\u30AB\u30C3\u30C8\u3002\u6B66\u5668\u3068\u3044\u3046\u3088\u308A\u5B9D\u5668\u3002",
    inspiredNote: "ImperiaL's \u7CFB\u306E ornate / 3D \u30DA\u30C3\u30C8",
    tags: ["ornate", "dark", "regalia"],
    outline: 0.85,
    outlineSoft: 0.45,
    doubleEdge: 0.6,
    bevel: 0.78,
    depth: 0.85,
    pseudo3d: 0.52,
    bands: 5,
    dither: 0.35,
    spec: 0.88,
    ornament: 1,
    sat: 0.95,
    contrast: 0.85,
    grain: 0.26,
    rim: 0.35,
    clean: 0.35,
    edgeDark: 0.7,
    innerRim: 0.32,
    axialGrad: 0.2
  },
  {
    id: "vanilla_plus",
    name: "Vanilla Plus",
    nameJa: "\u30D0\u30CB\u30E9\u30D7\u30E9\u30B9",
    tagline: "\u30D0\u30CB\u30E9\u306E\u9AA8\u683C\u3002\u7BC0\u5EA6\u306E\u3042\u308B\u4F5C\u308A\u8FBC\u307F",
    essence: "\u5143\u306E\u30A2\u30A4\u30C6\u30E0\u5F62\u72B6\u3068\u8272\u6E29\u5EA6\u3092\u5C0A\u91CD\u3057\u3001\u30CF\u30A4\u30E9\u30A4\u30C8\u3068\u9670\u5F71\u3060\u3051\u3092\u8DB3\u3059\u753B\u6CD5\u3002inventory \u304C\u8352\u308C\u306A\u3044\u30021000 \u8D85\u306E\u30A2\u30A4\u30C6\u30E0\u3092\u7834\u7DBB\u306A\u304F\u4E26\u3079\u308B\u305F\u3081\u306E\u7BC0\u5EA6\u3002",
    inspiredNote: "Vanilla+ \u7CFB\u306E classic & simple",
    tags: ["vanilla", "subtle", "clean"],
    outline: 0.7,
    outlineSoft: 0.5,
    doubleEdge: 0.2,
    bevel: 0.55,
    depth: 0.34,
    pseudo3d: 0.24,
    bands: 3,
    dither: 0.2,
    spec: 0.3,
    ornament: 0.2,
    sat: 0.9,
    contrast: 0.34,
    grain: 0.2,
    rim: 0.12,
    clean: 0.85,
    edgeDark: 0.58,
    innerRim: 0.22,
    axialGrad: 0.14
  },
  {
    id: "skypixel_crisp",
    name: "SkyPixel Crisp",
    nameJa: "\u30B9\u30AB\u30A4\u30D4\u30AF\u30BB\u30EB\u30FB\u30AF\u30EA\u30B9\u30D7",
    tagline: "2 \u30C8\u30FC\u30F3\u306E\u8F2A\u90ED\u3002\u30C9\u30C3\u30C8\u7D75\u3068\u3057\u3066\u306E\u6F54\u3055",
    essence: "\u9762\u3092\u5927\u304D\u304F2\u301C3\u968E\u8ABF\u306B\u5272\u308A\u5207\u308B\u753B\u6CD5\u3002\u30C7\u30A3\u30B6\u3067\u3064\u306A\u3050\u306E\u3067\u9060\u76EE\u306B\u3082\u8FD1\u304F\u306B\u3082\u5F37\u3044\u3002",
    inspiredNote: "SkyPixel / crisp pixel art \u7CFB",
    tags: ["crisp", "flat", "bold"],
    outline: 1,
    outlineSoft: 0.1,
    doubleEdge: 0.15,
    bevel: 0.82,
    depth: 0.2,
    pseudo3d: 0.14,
    bands: 3,
    dither: 0.88,
    spec: 0.5,
    ornament: 0.3,
    sat: 1.35,
    contrast: 0.95,
    grain: 0.02,
    rim: 0.4,
    clean: 0.9,
    edgeDark: 1,
    innerRim: 0.08,
    axialGrad: 0.05
  },
  {
    id: "faithful_smooth",
    name: "Faithful Smooth",
    nameJa: "\u30D5\u30A7\u30A4\u30B9\u30D5\u30EB\u30FB\u30B9\u30E0\u30FC\u30B9",
    tagline: "\u591A\u968E\u8ABF\u306E\u306A\u3081\u3089\u304B\u30E9\u30F3\u30D7\u300232x \u306E\u54C1\u683C",
    essence: "\u30D0\u30F3\u30C9\u3092\u5897\u3084\u3057\u3001\u30C7\u30A3\u30B6\u3068\u30B0\u30EC\u30A4\u30F3\u3067\u6ED1\u3089\u304B\u306B\u3064\u306A\u3050\u753B\u6CD5\u3002\u62E1\u5927\u3057\u3066\u3082\u7834\u7DBB\u3057\u306A\u3044\u3002",
    inspiredNote: "Faithful 32x \u7CFB\u306E smooth ramp",
    tags: ["smooth", "hires", "soft"],
    outline: 0.6,
    outlineSoft: 0.6,
    doubleEdge: 0.25,
    bevel: 0.7,
    depth: 0.52,
    pseudo3d: 0.36,
    bands: 6,
    dither: 0.62,
    spec: 0.45,
    ornament: 0.48,
    sat: 1.02,
    contrast: 0.3,
    grain: 0.32,
    rim: 0.3,
    clean: 0.7,
    edgeDark: 0.48,
    innerRim: 0.42,
    axialGrad: 0.3
  },
  {
    id: "depth_3d",
    name: "Depth 3D",
    nameJa: "\u30C7\u30D7\u30B93D",
    tagline: "\u64EC\u4F3C3D\u3002\u4E0A\u9762\u30E9\u30A4\u30C8\u3068\u6DF1\u3044\u5E95\u5F71",
    essence: "\u4E0A\u304B\u3089\u306E\u5149\u3068\u4E0B\u9762\u306E\u6DF1\u3044\u5F71\u3067\u7ACB\u4F53\u3092\u4F5C\u308B\u753B\u6CD5\u3002\u8F2A\u90ED\u3092\u4E8C\u91CD\u306B\u3057\u3066\u539A\u307F\u3092\u51FA\u3059\u3002",
    inspiredNote: "3D SkyBlock \u7CFB\u306E pseudo-3d",
    tags: ["3d", "volume", "shadow"],
    outline: 0.9,
    outlineSoft: 0.3,
    doubleEdge: 0.9,
    bevel: 1,
    depth: 0.95,
    pseudo3d: 1,
    bands: 4,
    dither: 0.24,
    spec: 0.62,
    ornament: 0.34,
    sat: 1.05,
    contrast: 0.92,
    grain: 0.15,
    rim: 0.25,
    clean: 0.6,
    edgeDark: 0.92,
    innerRim: 0.18,
    axialGrad: 0.1
  },
  {
    id: "gritty_pvp",
    name: "Gritty PvP",
    nameJa: "\u30B0\u30EA\u30C3\u30C6\u30A3PvP",
    tagline: "\u5F69\u5EA6\u3092\u843D\u3068\u3057\u3066\u8996\u8A8D\u6027\u3060\u3051\u3092\u4E0A\u3052\u308B",
    essence: "\u88C5\u98FE\u3092\u524A\u304E\u843D\u3068\u3057\u3001\u30B7\u30EB\u30A8\u30C3\u30C8\u3068\u660E\u5EA6\u5DEE\u3060\u3051\u3067\u8AAD\u307E\u305B\u308B\u753B\u6CD5\u3002\u9577\u6642\u9593\u306E\u30B0\u30E9\u30A4\u30F3\u30C9\u3067\u3082\u75B2\u308C\u306A\u3044\u3002",
    inspiredNote: "simple PvP / low-detail \u7CFB",
    tags: ["pvp", "desaturated", "minimal"],
    outline: 1,
    outlineSoft: 0.15,
    doubleEdge: 0.1,
    bevel: 0.46,
    depth: 0.42,
    pseudo3d: 0.2,
    bands: 3,
    dither: 0.14,
    spec: 0.18,
    ornament: 0.08,
    sat: 0.62,
    contrast: 0.72,
    grain: 0.08,
    rim: 0.08,
    clean: 0.95,
    edgeDark: 1,
    innerRim: 0.04,
    axialGrad: 0
  },
  {
    id: "neon_bloom",
    name: "Neon Bloom",
    nameJa: "\u30CD\u30AA\u30F3\u30D6\u30EB\u30FC\u30E0",
    tagline: "\u767A\u5149\u4F53\u3002\u9B54\u6CD5\u304C\u8F2A\u90ED\u304B\u3089\u6EA2\u308C\u308B",
    essence: "\u30A8\u30DF\u30C3\u30B7\u30D6\u6838\u3068\u30EA\u30E0\u30D6\u30EB\u30FC\u30E0\u3067\u5168\u4F53\u3092\u767A\u5149\u3055\u305B\u308B\u753B\u6CD5\u3002\u30C0\u30F3\u30B8\u30E7\u30F3\u3084\u30A8\u30F3\u30C9\u7CFB\u306E\u6D3E\u624B\u3055\u3002",
    inspiredNote: "glowy / enchanted overlay \u7CFB",
    tags: ["glow", "emissive", "neon"],
    outline: 0.75,
    outlineSoft: 0.55,
    doubleEdge: 0.3,
    bevel: 0.72,
    depth: 0.3,
    pseudo3d: 0.2,
    bands: 5,
    dither: 0.52,
    spec: 0.82,
    ornament: 0.5,
    sat: 1.4,
    contrast: 0.56,
    grain: 0.08,
    rim: 1,
    clean: 0.65,
    edgeDark: 0.52,
    innerRim: 0.78,
    axialGrad: 0.48
  },
  {
    id: "overhaul_intricate",
    name: "Overhaul Intricate",
    nameJa: "\u30AA\u30FC\u30D0\u30FC\u30DB\u30FC\u30EB\u30FB\u30A4\u30F3\u30C6\u30EA\u30B1\u30FC\u30C8",
    tagline: "64px\u306E\u9762\u7A4D\u3092\u4F7F\u3044\u5207\u308B\u3002\u591A\u5C64\u91D1\u5177\u30FB\u7D30\u7DDA\u30FB\u9BAE\u70C8\u306A\u8272",
    essence: "\u9AD8\u89E3\u50CF\u5EA6\u3092\u7E2E\u5C0F\u7248\u3067\u306F\u306A\u304F\u5225\u30E2\u30C7\u30EB\u3068\u3057\u3066\u6271\u3046\u753B\u6CD5\u3002\u5203\u30FB\u82AF\u30FB\u30D5\u30E9\u30FC\u30FB\u91D1\u5177\u30FB\u5B9D\u77F3\u3092\u5225\u9762\u306B\u5206\u5272\u3057\u30011px\u523B\u5370\u3068\u591A\u968E\u8ABF\u30E9\u30F3\u30D7\u3092\u540C\u5C45\u3055\u305B\u308B\u300232x\u5C02\u7528\u3067\u7570\u306A\u308B\u6B66\u5668\u30E2\u30C7\u30EB\u3092\u4F5C\u3063\u305FSkyBlock Overhaul\u306E\u8A2D\u8A08\u601D\u60F3\u309264px\u3078\u767A\u5C55\u3002",
    inspiredNote: "SkyBlock Overhaul 32x \u306E intricate designs / unique models",
    tags: ["64-native", "intricate", "overhaul", "hires"],
    outline: 0.72,
    outlineSoft: 0.52,
    doubleEdge: 0.7,
    bevel: 0.88,
    depth: 0.82,
    pseudo3d: 0.62,
    bands: 8,
    dither: 0.5,
    spec: 0.86,
    ornament: 1,
    sat: 1.16,
    contrast: 0.66,
    grain: 0.2,
    rim: 0.5,
    clean: 0.62,
    edgeDark: 0.68,
    innerRim: 0.64,
    axialGrad: 0.4
  },
  {
    id: "nameless_heroic",
    name: "Nameless Heroic",
    nameJa: "\u30CD\u30FC\u30E0\u30EC\u30B9\u30FB\u30D2\u30ED\u30A4\u30C3\u30AF",
    tagline: "\u30A2\u30A4\u30C6\u30E0\u3054\u3068\u306B\u5225\u306E\u82F1\u96C4\u7684\u30B7\u30EB\u30A8\u30C3\u30C8",
    essence: "\u540C\u3058\u5200\u8EAB\u306E\u8272\u66FF\u3048\u3067\u306F\u306A\u304F\u3001\u5263\u30FB\u5F13\u306E\u7528\u9014\u3092\u8F2A\u90ED\u305D\u306E\u3082\u306E\u306B\u3059\u308B\u753B\u6CD5\u3002\u592A\u3044\u4E3B\u5F62\u72B6\u3068\u7D30\u3044\u5185\u90E8\u8A18\u53F7\u3092\u5BFE\u6BD4\u3055\u305B\u3001\u30A4\u30F3\u30D9\u30F3\u30C8\u30EA\u3067\u3082\u500B\u4F53\u5DEE\u3092\u5373\u8AAD\u3067\u304D\u308B\u3002",
    inspiredNote: "Nameless Skyblock Pack \u306E all-swords / distinct-bows \u65B9\u91DD",
    tags: ["64-native", "heroic", "distinct", "weapon"],
    outline: 0.94,
    outlineSoft: 0.28,
    doubleEdge: 0.42,
    bevel: 0.86,
    depth: 0.56,
    pseudo3d: 0.44,
    bands: 6,
    dither: 0.34,
    spec: 0.7,
    ornament: 0.72,
    sat: 1.24,
    contrast: 0.82,
    grain: 0.1,
    rim: 0.52,
    clean: 0.8,
    edgeDark: 0.9,
    innerRim: 0.72,
    axialGrad: 0.34
  },
  {
    id: "clockwork_steam",
    name: "Clockwork Steam",
    nameJa: "\u30AF\u30ED\u30C3\u30AF\u30EF\u30FC\u30AF\u30FB\u30B9\u30C1\u30FC\u30E0",
    tagline: "\u771F\u936E\u6B6F\u8ECA\u3001\u84B8\u6C17\u6392\u6C17\u5F01\u3001\u92FC\u9244\u30EA\u30D9\u30C3\u30C8\u306E\u5E7E\u4F55\u5B66\u5DE5\u5B66",
    essence: "\u30C9\u30EF\u30FC\u30D5\u5DE5\u623F\u3068\u30B9\u30C1\u30FC\u30E0\u30D1\u30F3\u30AF\u306E\u6A5F\u69CB\u7F8E\u3002\u786C\u8CEA\u306A\u771F\u936E\u30A8\u30C3\u30B8\u3001\u7B49\u9593\u9694\u306E\u30EA\u30D9\u30C3\u30C8\u6253\u3061\u3001\u84B8\u6C17\u5727\u30B9\u30EA\u30C3\u30C8\u306B\u3088\u308B\u6A5F\u68B0\u7684\u9670\u5F71\u3002",
    inspiredNote: "Steampunk / Clockwork / Factory \u7CFB\u30E1\u30AB\u30CB\u30AB\u30EB\u30D1\u30C3\u30AF",
    tags: ["mechanical", "steampunk", "brass", "gears"],
    outline: 0.9,
    outlineSoft: 0.32,
    doubleEdge: 0.65,
    bevel: 0.95,
    depth: 0.78,
    pseudo3d: 0.58,
    bands: 5,
    dither: 0.42,
    spec: 0.88,
    ornament: 0.95,
    sat: 1.15,
    contrast: 0.82,
    grain: 0.16,
    rim: 0.45,
    clean: 0.72,
    edgeDark: 0.88,
    innerRim: 0.68,
    axialGrad: 0.36
  },
  {
    id: "cyber_matrix",
    name: "Cyber Matrix",
    nameJa: "\u30B5\u30A4\u30D0\u30FC\u30FB\u30DE\u30C8\u30EA\u30AF\u30B9",
    tagline: "\u767A\u5149\u30B5\u30FC\u30AD\u30C3\u30C8\u3001\u96FB\u78C1\u30EC\u30FC\u30EB\u3001\u8D85\u786C\u8CEA\u30C1\u30BF\u30F3",
    essence: "\u30CF\u30A4\u30C6\u30AF\u30FB\u30B5\u30A4\u30D0\u30FC\u30D1\u30F3\u30AF\u306E\u672A\u6765\u5175\u5668\u3002\u9ED2\u66DC\u30C1\u30BF\u30F3\u306E\u786C\u8CEA\u30DC\u30C7\u30A3\u306B\u9BAE\u70C8\u306A\u30CD\u30AA\u30F3\u56DE\u8DEF\u30B9\u30EA\u30C3\u30C8\u304C\u8D70\u308A\u3001\u30A8\u30DF\u30C3\u30B7\u30D6\u306A\u9AD8\u30A8\u30CD\u30EB\u30AE\u30FC\u3092\u653E\u51FA\u3059\u308B\u3002",
    inspiredNote: "Cyberpunk / High-Tech / Sci-Fi \u7CFB\u30C6\u30AF\u30B9\u30C1\u30E3\u30D1\u30C3\u30AF",
    tags: ["cyber", "neon", "matrix", "scifi"],
    outline: 0.96,
    outlineSoft: 0.2,
    doubleEdge: 0.35,
    bevel: 0.92,
    depth: 0.45,
    pseudo3d: 0.32,
    bands: 4,
    dither: 0.22,
    spec: 0.95,
    ornament: 0.82,
    sat: 1.45,
    contrast: 0.9,
    grain: 0.04,
    rim: 0.95,
    clean: 0.88,
    edgeDark: 0.95,
    innerRim: 0.85,
    axialGrad: 0.42
  },
  {
    id: "sig_mechworks",
    name: "Machineworks",
    nameJa: "\u30DE\u30B7\u30F3\u30EF\u30FC\u30AF\u30B9",
    tagline: "\u92F2\u6253\u3061\u30FB\u6CB9\u819C\u30FB\u786C\u8CEA\u306A\u91D1\u5C5E\u3002\u6A5F\u68B0\u304C\u52D5\u304F\u97F3\u307E\u3067\u805E\u3053\u3048\u308B",
    essence: "\u30C9\u30EA\u30EB\u3084\u6B6F\u8ECA\u3068\u3044\u3063\u305F\u6A5F\u68B0\u7CFB\u306E\u305F\u3081\u306E\u753B\u6CD5\u3002\u8F2A\u90ED\u3092\u6975\u7AEF\u306B\u786C\u304F\u3057\u3001\u93E1\u9762\u30CF\u30A4\u30E9\u30A4\u30C8\u3068\u6DF1\u3044\u63A5\u5408\u5F71\u3092\u540C\u5C45\u3055\u305B\u308B\u3002\u88C5\u98FE\u306F\u6709\u6A5F\u7684\u306A\u66F2\u7DDA\u3067\u306F\u306A\u304F\u3001\u92F2\u30FB\u30EA\u30D6\u30FB\u51B7\u5374\u30D5\u30A3\u30F3\u3068\u3044\u3046\u5DE5\u696D\u8A18\u53F7\u3067\u69CB\u6210\u3059\u308B\u3002",
    inspiredNote: "Dwarven Mines / Forge \u306E\u6A5F\u68B0\u5DE5\u82B8",
    tags: ["mechanical", "industrial", "hard", "metal"],
    outline: 0.98,
    outlineSoft: 0.16,
    doubleEdge: 0.55,
    bevel: 0.98,
    depth: 0.8,
    pseudo3d: 0.72,
    bands: 5,
    dither: 0.22,
    spec: 0.95,
    ornament: 0.72,
    sat: 0.82,
    contrast: 0.88,
    grain: 0.12,
    rim: 0.3,
    clean: 0.55,
    edgeDark: 0.98,
    innerRim: 0.32,
    axialGrad: 0.2
  }
];
var PALETTES = [
  {
    id: "reborn_flare",
    name: "Reborn Flare",
    nameJa: "\u30EA\u30DC\u30FC\u30F3\u30D5\u30EC\u30A2",
    tagline: "\u9AD8\u5F69\u5EA6\u306E\u796D\u5178\u8272",
    essence: "\u30AA\u30EC\u30F3\u30B8\u306E\u5203\u3001\u30B7\u30A2\u30F3\u306E\u30A2\u30AF\u30BB\u30F3\u30C8\u3001\u6843\u306E\u5B9D\u77F3\u3002\u660E\u308B\u3044\u9EC4\u91D1\u306E\u91D1\u5177\u3002",
    tags: ["saturated", "heroic"],
    metal: "#b9c4d4",
    gold: "#f0c33c",
    gem: "#ff3d7f",
    wood: "#8a4a22",
    leather: "#6b3a22",
    cloth: "#c8452f",
    energy: "#3ec6ff",
    accent: "#7cff6b",
    bone: "#e8d9b8",
    outline: "#171019"
  },
  {
    id: "catacomb_ink",
    name: "Catacomb Ink",
    nameJa: "\u30AB\u30BF\u30B3\u30F3\u30D6\u30A4\u30F3\u30AF",
    tagline: "\u5730\u4E0B\u5893\u5730\u306E\u9AA8\u3068\u82D4",
    essence: "\u9306\u3073\u305F\u9244\u3001\u8150\u98DF\u7DD1\u3001\u9AA8\u767D\u3002\u5149\u306F\u5C4A\u304B\u306A\u3044\u3002",
    tags: ["dungeon", "undead"],
    metal: "#6b7280",
    gold: "#b08d2a",
    gem: "#22c55e",
    wood: "#44403c",
    leather: "#57534e",
    cloth: "#3f4a3a",
    energy: "#84cc16",
    accent: "#a3e635",
    bone: "#efe6c9",
    outline: "#0d120d"
  },
  {
    id: "voidthorn",
    name: "Voidthorn",
    nameJa: "\u30F4\u30A9\u30A4\u30C9\u30BD\u30FC\u30F3",
    tagline: "\u865A\u7A7A\u306E\u7D2B\u3068\u9ED2\u3044\u68D8",
    essence: "\u9ED2\u7D2B\u306E silhouette \u306B\u30B7\u30A2\u30F3\u306E\u6838\u3002\u30A8\u30F3\u30C9\u306E\u9759\u3051\u3055\u3002",
    tags: ["end", "void"],
    metal: "#4b4460",
    gold: "#8b7bb8",
    gem: "#22d3ee",
    wood: "#2a1f36",
    leather: "#2a2030",
    cloth: "#3b2a5a",
    energy: "#a855f7",
    accent: "#e879f9",
    bone: "#b7a8c9",
    outline: "#05040a"
  },
  {
    id: "gemnest",
    name: "Gemnest",
    nameJa: "\u30B8\u30A7\u30E0\u30CD\u30B9\u30C8",
    tagline: "\u8679\u8272\u306E\u7D50\u6676\u6D1E",
    essence: "\u77F3\u3068\u30AC\u30E9\u30B9\u306E\u4F53\u306B\u30D7\u30EA\u30BA\u30E0\u306E\u6838\u3002\u9271\u8108\u306E\u51B7\u305F\u3044\u5149\u3002",
    tags: ["crystal", "mining"],
    metal: "#9aa7b4",
    gold: "#cfd8e3",
    gem: "#34d399",
    wood: "#4a5560",
    leather: "#3a4650",
    cloth: "#4b6b7a",
    energy: "#67e8f9",
    accent: "#f472b6",
    bone: "#dbe7ef",
    outline: "#101620"
  },
  {
    id: "crimson_wake",
    name: "Crimson Wake",
    nameJa: "\u30AF\u30EA\u30E0\u30BE\u30F3\u30A6\u30A7\u30A4\u30AF",
    tagline: "\u6EB6\u5CA9\u3068\u7164\u306E\u771F\u7D05",
    essence: "\u8D64\u9ED2\u306E\u30B0\u30E9\u30C7\u306B\u786B\u9EC4\u306E\u30CF\u30A4\u30E9\u30A4\u30C8\u3002\u5CF6\u306E\u71B1\u3002",
    tags: ["nether", "fire"],
    metal: "#6b2a22",
    gold: "#fb923c",
    gem: "#facc15",
    wood: "#3a1610",
    leather: "#4a1c14",
    cloth: "#8a1c1c",
    energy: "#fb7185",
    accent: "#f97366",
    bone: "#e8b4a8",
    outline: "#120606"
  },
  {
    id: "glacite_veil",
    name: "Glacite Veil",
    nameJa: "\u30B0\u30EC\u30A4\u30B5\u30A4\u30C8\u30F4\u30A7\u30FC\u30EB",
    tagline: "\u6C37\u6676\u3068\u84BC\u9280",
    essence: "\u767D\u9280\u306E\u30E1\u30BF\u30EB\u306B\u8584\u3044\u30B7\u30A2\u30F3\u306E\u6838\u3002\u8F2A\u90ED\u306F\u591C\u306E\u6E56\u3002",
    tags: ["ice", "cold"],
    metal: "#94a3b8",
    gold: "#cbd5e1",
    gem: "#22d3ee",
    wood: "#64748b",
    leather: "#475569",
    cloth: "#7dd3fc",
    energy: "#a5f3fc",
    accent: "#38bdf8",
    bone: "#e2e8f0",
    outline: "#0b1520"
  },
  {
    id: "fairy_atelier",
    name: "Fairy Atelier",
    nameJa: "\u30D5\u30A7\u30A2\u30EA\u30FC\u30A2\u30C8\u30EA\u30A8",
    tagline: "\u30D1\u30B9\u30C6\u30EB\u3068\u91D1\u7B94",
    essence: "\u685C\u8272\u3001\u30DF\u30F3\u30C8\u3001\u8584\u3044\u91D1\u3002\u512A\u3057\u3044\u306E\u306B\u8F2A\u90ED\u306F\u6B8B\u308B\u3002",
    tags: ["pastel", "fairy"],
    metal: "#e6d3e0",
    gold: "#f0d38a",
    gem: "#fbbf24",
    wood: "#e8b4b8",
    leather: "#f5c2c7",
    cloth: "#f9a8d4",
    energy: "#c4b5fd",
    accent: "#86efac",
    bone: "#fde68a",
    outline: "#3b2a36"
  },
  {
    id: "dragonwake",
    name: "Dragonwake",
    nameJa: "\u30C9\u30E9\u30B4\u30F3\u30A6\u30A7\u30A4\u30AF",
    tagline: "\u7ADC\u9C57\u3068\u91D1\u7D2B\u306E\u8987\u6C17",
    essence: "\u9C57\u306E\u53CD\u5FA9\u3001\u91D1\u306E\u722A\u3001\u7D2B\u306E\u606F\u3002\u30DC\u30B9\u306E\u4F59\u71B1\u3002",
    tags: ["dragon", "boss"],
    metal: "#7a6a8a",
    gold: "#d4af37",
    gem: "#f43f5e",
    wood: "#5b3418",
    leather: "#7c2d12",
    cloth: "#6b21a8",
    energy: "#c084fc",
    accent: "#f5c542",
    bone: "#fde68a",
    outline: "#140c14"
  },
  {
    id: "midas_gild",
    name: "Midas Gild",
    nameJa: "\u30DF\u30C0\u30B9\u30AE\u30EB\u30C9",
    tagline: "\u5168\u3066\u3092\u91D1\u306B\u5909\u3048\u308B\u546A\u3044",
    essence: "\u7425\u73C0\u3001\u53E4\u91D1\u3001\u9ED2\u3044\u4E80\u88C2\u3002\u30CF\u30A4\u30E9\u30A4\u30C8\u306F\u592A\u967D\u3002",
    tags: ["gold", "luxury"],
    metal: "#c9a227",
    gold: "#f5d76e",
    gem: "#ef4444",
    wood: "#8b5a2b",
    leather: "#a16207",
    cloth: "#b45309",
    energy: "#facc15",
    accent: "#fb923c",
    bone: "#fde68a",
    outline: "#2a1a08"
  },
  {
    id: "mithril_vein",
    name: "Mithril Vein",
    nameJa: "\u30DF\u30B9\u30EA\u30EB\u30F4\u30A7\u30A4\u30F3",
    tagline: "\u84BC\u9280\u306E\u9271\u8108",
    essence: "\u30C6\u30A3\u30FC\u30EB\u306E\u9271\u77F3\u3068\u51B7\u305F\u3044\u9244\u3001\u7C89\u3063\u307D\u3044\u30CF\u30A4\u30E9\u30A4\u30C8\u3002",
    tags: ["mithril", "dwarf"],
    metal: "#7c9aa5",
    gold: "#9fb3bd",
    gem: "#2dd4bf",
    wood: "#3f4a52",
    leather: "#334155",
    cloth: "#115e59",
    energy: "#5eead4",
    accent: "#38bdf8",
    bone: "#d1fae5",
    outline: "#0c1418"
  },
  {
    id: "wither_sovereign",
    name: "Wither Sovereign",
    nameJa: "\u30A6\u30A3\u30B6\u30FC\u30BD\u30F4\u30EA\u30F3",
    tagline: "\u738B\u306E\u9ED2\u3068\u7D2B\u96FB",
    essence: "\u30DE\u30C3\u30C8\u306A\u9ED2\u91D1\u306B\u7D2B\u306E\u653E\u96FB\u3002\u30CD\u30B6\u30FC\u306E\u738B\u3002",
    tags: ["wither", "royal"],
    metal: "#3f3a4a",
    gold: "#8a6a18",
    gem: "#a855f7",
    wood: "#241c28",
    leather: "#2a2030",
    cloth: "#2a1848",
    energy: "#c084fc",
    accent: "#22d3ee",
    bone: "#cbbca0",
    outline: "#05040a"
  },
  {
    id: "harvest_sun",
    name: "Harvest Sun",
    nameJa: "\u30CF\u30FC\u30D9\u30B9\u30C8\u30B5\u30F3",
    tagline: "\u9EA6\u3068\u571F\u3068\u65E5\u5DEE\u3057",
    essence: "\u85C1\u8272\u3001\u571F\u8910\u3001\u719F\u308C\u305F\u8D64\u3002\u8FB2\u5834\u306E\u6E29\u304B\u3055\u3002",
    tags: ["farming", "warm"],
    metal: "#a8a29e",
    gold: "#eab308",
    gem: "#f97316",
    wood: "#8b5a2b",
    leather: "#7c4a28",
    cloth: "#a3b565",
    energy: "#fde047",
    accent: "#84cc16",
    bone: "#f5e6c8",
    outline: "#1b140f"
  },
  {
    id: "brass_clockwork",
    name: "Brass Clockwork",
    nameJa: "\u30AF\u30ED\u30C3\u30AF\u30EF\u30FC\u30AF\u30FB\u30D6\u30E9\u30B9",
    tagline: "\u771F\u936E\u91D1\u3068\u53E4\u92FC\u9244\u3001\u84B8\u6C17\u3068\u8A08\u5668\u30A2\u30F3\u30D0\u30FC",
    essence: "\u6B6F\u8ECA\u4ED5\u639B\u3051\u3068\u84B8\u6C17\u6A5F\u95A2\u3002\u30DD\u30EA\u30C3\u30B7\u30E5\u3055\u308C\u305F\u771F\u936E\u3001\u91CD\u539A\u306A\u92F3\u9244\u3001\u5727\u529B\u8A08\u306E\u7425\u73C0\u8272\u767A\u5149\u3002",
    tags: ["mechanical", "steampunk", "brass", "gear"],
    metal: "#787a82",
    gold: "#d49a37",
    gem: "#f59e0b",
    wood: "#4a3525",
    leather: "#663e28",
    cloth: "#8a5832",
    energy: "#fbbf24",
    accent: "#38bdf8",
    bone: "#e2d6b5",
    outline: "#181410"
  },
  {
    id: "cyber_neon",
    name: "Cyber Neon",
    nameJa: "\u30B5\u30A4\u30D0\u30FC\u30CD\u30AA\u30F3",
    tagline: "\u9ED2\u66DC\u30C1\u30BF\u30F3\u3068\u9AD8\u8F1D\u5EA6\u30CD\u30AA\u30F3\u30B7\u30A2\u30F3",
    essence: "\u96FB\u78C1\u30EC\u30FC\u30EB\u3068\u56DE\u8DEF\u57FA\u677F\u3002\u6F06\u9ED2\u306E\u30C1\u30BF\u30F3\u30D5\u30EC\u30FC\u30E0\u306B\u92ED\u5229\u306A\u30CD\u30AA\u30F3\u30B7\u30A2\u30F3\u3068\u30DE\u30BC\u30F3\u30BF\u306E\u653E\u96FB\u3002",
    tags: ["cyber", "neon", "scifi", "plasma"],
    metal: "#333842",
    gold: "#00f0ff",
    gem: "#ff007f",
    wood: "#1a1c23",
    leather: "#252830",
    cloth: "#0f172a",
    energy: "#00f0ff",
    accent: "#39ff14",
    bone: "#94a3b8",
    outline: "#07090e"
  },
  {
    id: "dwarven_steam",
    name: "Dwarven Steamforge",
    nameJa: "\u30C9\u30EF\u30FC\u30D5\u30FB\u30B9\u30C1\u30FC\u30E0\u30D5\u30A9\u30FC\u30B8",
    tagline: "\u30C9\u30EF\u30FC\u30D5\u5F37\u5316\u92FC\u3068\u30EB\u30D3\u30FC\u6A5F\u95A2\u7089\u5FC3",
    essence: "\u9271\u5C71\u6DF1\u5C64\u306E\u91CD\u6A5F\u95A2\u3002\u8010\u71B1\u91CD\u5408\u91D1\u3001\u8D64\u71B1\u3059\u308B\u7089\u5FC3\u71B1\u6C17\u3001\u30EA\u30D9\u30C3\u30C8\u3067\u88DC\u5F37\u3055\u308C\u305F\u525B\u4F53\u3002",
    tags: ["dwarf", "steam", "forge", "heavy"],
    metal: "#636978",
    gold: "#e5a93b",
    gem: "#ef4444",
    wood: "#382c22",
    leather: "#4d3222",
    cloth: "#78350f",
    energy: "#f97316",
    accent: "#fbbf24",
    bone: "#d1c7a5",
    outline: "#121114"
  },
  {
    id: "lin_mechworks",
    name: "Machineworks Lineage",
    nameJa: "\u30DE\u30B7\u30F3\u30EF\u30FC\u30AF\u30B9\u7CFB\u8B5C",
    tagline: "\u92FC\u30FB\u771F\u936E\u30FB\u30B0\u30EA\u30B9\u30FB\u30C6\u30A3\u30FC\u30EB\u306E\u52D5\u529B",
    essence: "\u9271\u5C71\u6A5F\u68B0\u306E\u6E29\u5EA6\u3002\u51B7\u305F\u3044\u92FC\u306B\u771F\u92FC\u306B\u771F\u936E\u306E\u7D99\u304E\u624B\u3001\u30B0\u30EA\u30B9\u306E\u6697\u90E8\u3001\u52D5\u529B\u3092\u793A\u3059\u30C6\u30A3\u30FC\u30EB\u306E\u767A\u5149\u3002",
    tags: ["mechanical", "dwarven", "forge"],
    metal: "#8b939e",
    gold: "#d8a24a",
    gem: "#4fd6c8",
    wood: "#4a4038",
    leather: "#3a322c",
    cloth: "#5c6670",
    energy: "#37d6e6",
    accent: "#e0724a",
    bone: "#c8c2b4",
    outline: "#0a0d12"
  }
];
var SIGNATURE_MAP = Object.fromEntries(
  SIGNATURES.map((s) => [s.id, s])
);
var PALETTE_MAP = Object.fromEntries(
  PALETTES.map((p) => [p.id, p])
);
function getSignature(id) {
  return SIGNATURE_MAP[id] ?? SIGNATURES[0];
}
function getPalette(id) {
  return PALETTE_MAP[id] ?? PALETTES[0];
}
function normalise(mix) {
  const cleaned = mix.map((m) => ({ id: m.id, weight: Math.max(0, Number(m.weight) || 0) })).filter((m) => m.weight > 0);
  return cleaned;
}
function mixSignatures(mix) {
  const entries = normalise(mix).map((m) => ({ sig: getSignature(m.id), weight: m.weight })).filter((e) => e.sig);
  const used = entries.length ? entries : [{ sig: SIGNATURES[0], weight: 1 }];
  const total = used.reduce((s, e) => s + e.weight, 0);
  const keys = [
    "tagline",
    "essence",
    "inspiredNote",
    "outline",
    "outlineSoft",
    "doubleEdge",
    "bevel",
    "depth",
    "pseudo3d",
    "bands",
    "dither",
    "spec",
    "ornament",
    "sat",
    "contrast",
    "grain",
    "rim",
    "clean",
    "edgeDark",
    "innerRim",
    "axialGrad"
  ];
  const out = { ids: used.map((e) => e.sig.id) };
  for (const key of keys) {
    if (key === "tagline" || key === "essence" || key === "inspiredNote") {
      out[key] = used[0].sig[key];
      continue;
    }
    let acc = 0;
    for (const e of used) acc += e.sig[key] * (e.weight / total);
    out[key] = key === "bands" ? Math.max(3, Math.round(acc)) : acc;
  }
  return out;
}
var PALETTE_KEYS = [
  "metal",
  "gold",
  "gem",
  "wood",
  "leather",
  "cloth",
  "energy",
  "accent",
  "bone",
  "outline"
];
function mixPalettes(mix) {
  const entries = normalise(mix).map((m) => ({ pal: getPalette(m.id), weight: m.weight })).filter((e) => e.pal);
  const used = entries.length ? entries : [{ pal: PALETTES[0], weight: 1 }];
  const total = used.reduce((s, e) => s + e.weight, 0);
  const out = { ids: used.map((e) => e.pal.id) };
  for (const key of PALETTE_KEYS) {
    let acc = [0, 0, 0];
    for (const e of used) {
      const rgb = hexToRgb(e.pal[key]);
      const w = e.weight / total;
      acc = [acc[0] + rgb[0] * w, acc[1] + rgb[1] * w, acc[2] + rgb[2] * w];
    }
    out[key] = acc;
  }
  out.fur = mixRgb(out.leather, out.accent, 0.45);
  return out;
}

// ../skyblock/hypixel-skyblock-texture-generator (1)/src/lib/draw.ts
var MAT = {
  empty: ".",
  blade: "b",
  // sharpened weapon edge (catches light)
  bladeCore: "B",
  // fuller / flat of the blade
  metalDark: "m",
  // iron, dark trim, rivets
  metalBright: "M",
  // gold / polished trim
  gem: "g",
  // faceted crystal
  wood: "w",
  // handle, shaft
  leather: "l",
  // grip wrap, straps
  cloth: "c",
  // robes, capes
  string: "s",
  // bowstring, thread
  energy: "e",
  // emissive magic core
  bone: "k",
  // bone / skull
  fur: "p",
  // hide, scales of pets
  rune: "r"
  // emissive inscription
};
var MATERIAL_CHARS = new Set(Object.values(MAT));
function makeGrid(n = 16) {
  return Array.from({ length: n }, () => Array(n).fill("."));
}
function inBounds(g, x, y) {
  return y >= 0 && y < g.length && x >= 0 && x < g[0].length;
}
function set(g, x, y, ch) {
  if (!inBounds(g, x, y)) return;
  g[y][x] = ch;
}
function get(g, x, y) {
  if (!inBounds(g, x, y)) return ".";
  return g[y][x];
}
function rect(g, x, y, w, h, ch) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(g, i, j, ch);
}
function line(g, x0, y0, x1, y1, ch) {
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (; ; ) {
    set(g, x, y, ch);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}
function thickPath(g, x0, y0, x1, y1, size, ch) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const xe = Math.round(x1);
  const ye = Math.round(y1);
  const dx = Math.abs(xe - x);
  const dy = -Math.abs(ye - y);
  const sx = x < xe ? 1 : -1;
  const sy = y < ye ? 1 : -1;
  let err = dx + dy;
  const lo = -Math.floor((size - 1) / 2);
  const hi = lo + size - 1;
  for (; ; ) {
    for (let j = lo; j <= hi; j++) for (let i = lo; i <= hi; i++) set(g, x + i, y + j, ch);
    if (x === xe && y === ye) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}
function thickLine(g, x0, y0, x1, y1, width, ch) {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;
  const half = (width - 1) / 2;
  const minX = Math.floor(Math.min(x0, x1) - width);
  const maxX = Math.ceil(Math.max(x0, x1) + width);
  const minY = Math.floor(Math.min(y0, y1) - width);
  const maxY = Math.ceil(Math.max(y0, y1) + width);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x - x0;
      const py = y - y0;
      const along = (px * (x1 - x0) + py * (y1 - y0)) / len;
      const perp = Math.abs(px * nx + py * ny);
      if (along >= -0.5 && along <= len + 0.5 && perp <= half + 0.35) set(g, x, y, ch);
    }
  }
}
function poly(g, pts, ch) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    const crossings = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      if (y0 === y1) continue;
      if (y + 0.5 < Math.min(y0, y1) || y + 0.5 >= Math.max(y0, y1)) continue;
      crossings.push(x0 + (y + 0.5 - y0) / (y1 - y0) * (x1 - x0));
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const xa = Math.round(crossings[i] - 0.5);
      const xb = Math.round(crossings[i + 1] - 0.5);
      for (let x = xa; x <= xb; x++) set(g, x, y, ch);
    }
  }
  void xs;
}
function ellipse(g, cx, cy, rx, ry, ch, fill = true) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const v = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
      if (fill ? v <= 1 : v > 0.72 && v <= 1.12) set(g, x, y, ch);
    }
  }
}
function antiBand(g, sumMin, sumMax, xMin, xMax, yMin, yMax, ch) {
  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const s = x + y;
      if (s >= sumMin && s <= sumMax) set(g, x, y, ch);
    }
  }
}
function diagBand(g, dMin, dMax, xMin, xMax, yMin, yMax, ch) {
  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const d = x - y;
      if (d >= dMin && d <= dMax) set(g, x, y, ch);
    }
  }
}
function arc(g, cx, cy, r, a0, a1, ch, thickness = 1) {
  const steps = Math.max(24, Math.ceil(r * 12));
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (a1 - a0) * i / steps;
    for (let t = 0; t < thickness; t++) {
      const rr = r - t * 0.5;
      set(g, Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr), ch);
    }
  }
}
function swap(g, from, to) {
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < g[0].length; x++) if (g[y][x] === from) g[y][x] = to;
}
function validateGrid(g, id, expected) {
  const n = g.length;
  if (expected && n !== expected) throw new Error(`template ${id}: height ${n} != ${expected}`);
  if (!expected && n < 16) throw new Error(`template ${id}: height ${n}`);
  for (let y = 0; y < n; y++) {
    if (g[y].length !== n) throw new Error(`template ${id}: row ${y} width ${g[y].length}`);
    for (let x = 0; x < n; x++) {
      const ch = g[y][x];
      if (!MATERIAL_CHARS.has(ch)) throw new Error(`template ${id}: bad char "${ch}" @${x},${y}`);
    }
  }
  let count = 0;
  for (const row of g) for (const ch of row) if (ch !== ".") count++;
  if (count < 18) throw new Error(`template ${id}: too few pixels (${count})`);
}
function makeCtx(size) {
  const s = Math.max(1, Math.round(size / 16));
  const n = 16 * s;
  const g = makeGrid(n);
  const block = (x, y, ch) => {
    const bx = Math.round(x) * s;
    const by = Math.round(y) * s;
    for (let j = 0; j < s; j++)
      for (let i = 0; i < s; i++) set(g, bx + i, by + j, ch);
  };
  const ctr = (v) => v * s + (s - 1) / 2;
  return {
    g,
    s,
    n,
    set: block,
    line: (x0, y0, x1, y1, ch) => thickPath(g, ctr(x0), ctr(y0), ctr(x1), ctr(y1), Math.max(1, s), ch),
    thickLine: (x0, y0, x1, y1, w, ch) => thickLine(g, ctr(x0), ctr(y0), ctr(x1), ctr(y1), Math.max(1, w * s), ch),
    rect: (x, y, w, h, ch) => rect(g, Math.round(x) * s, Math.round(y) * s, Math.round(w) * s, Math.round(h) * s, ch),
    poly: (pts, ch) => poly(
      g,
      pts.map(([x, y]) => [ctr(x), ctr(y)]),
      ch
    ),
    ellipse: (cx, cy, rx, ry, ch, fill = true) => ellipse(g, ctr(cx), ctr(cy), Math.max(0.5, rx * s), Math.max(0.5, ry * s), ch, fill),
    arc: (cx, cy, r, a0, a1, ch, thickness = 1) => arc(g, ctr(cx), ctr(cy), Math.max(0.5, r * s), a0, a1, ch, Math.max(1, Math.round(thickness * s))),
    antiBand: (sumMin, sumMax, xMin, xMax, yMin, yMax, ch) => antiBand(
      g,
      Math.round(sumMin * s),
      Math.round((sumMax + 1) * s) - 1,
      Math.round(xMin * s),
      Math.round((xMax + 1) * s) - 1,
      Math.round(yMin * s),
      Math.round((yMax + 1) * s) - 1,
      ch
    ),
    diagBand: (dMin, dMax, xMin, xMax, yMin, yMax, ch) => diagBand(
      g,
      Math.round(dMin * s),
      Math.round((dMax + 1) * s) - 1,
      Math.round(xMin * s),
      Math.round((xMax + 1) * s) - 1,
      Math.round(yMin * s),
      Math.round((yMax + 1) * s) - 1,
      ch
    ),
    clear: (x, y, w, h) => rect(g, Math.round(x) * s, Math.round(y) * s, Math.round(w) * s, Math.round(h) * s, ".")
  };
}

// ../skyblock/hypixel-skyblock-texture-generator (1)/src/lib/native64.ts
var MAT2 = {
  ...MAT,
  core: MAT.bladeCore,
  iron: MAT.metalDark,
  gold: MAT.metalBright
};
var NATIVE64_TEMPLATE_IDS = [
  "sword_long",
  "sword_broad",
  "sword_great",
  "sword_katana",
  "sword_dagger",
  "sword_rapier",
  "sword_scythe",
  "sword_wither",
  "sword_chainsaw",
  "sword_piston",
  "bow_long",
  "bow_short",
  "bow_heavy",
  "bow_crossbow",
  "bow_railgun",
  "staff_wand",
  "staff_sceptre",
  "staff_orb",
  "staff_scythe",
  "staff_gyro",
  "tool_pickaxe",
  "tool_axe",
  "tool_drill",
  "tool_hoe",
  "tool_rod",
  "tool_hook",
  "tool_gauntlet",
  "tool_pilebunker",
  "tool_wrench",
  "armor_helm_full",
  "armor_helm_horn",
  "armor_helm_hood",
  "armor_helm_crown",
  "armor_chest_plate",
  "armor_chest_robe",
  "armor_chest_light",
  "armor_legs",
  "armor_boots",
  "acc_talisman",
  "acc_ring",
  "acc_artifact",
  "acc_orb",
  "acc_book",
  "acc_potion",
  "acc_crystal",
  "acc_scroll",
  "pet_dragon",
  "pet_quadruped",
  "pet_bird",
  "pet_bee",
  "pet_whale",
  "minion_base"
];
var NATIVE_SET = new Set(NATIVE64_TEMPLATE_IDS);
function bezierPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [
    p0[0] * a + p1[0] * b + p2[0] * c + p3[0] * d,
    p0[1] * a + p1[1] * b + p2[1] * c + p3[1] * d
  ];
}
function bezier(g, p0, p1, p2, p3, width, ch) {
  let prev = p0;
  const steps = 96;
  for (let i = 1; i <= steps; i++) {
    const p = bezierPoint(p0, p1, p2, p3, i / steps);
    thickLine(g, prev[0], prev[1], p[0], p[1], width, ch);
    prev = p;
  }
}
function clippedBezier(g, p0, p1, p2, p3, width, ch) {
  const mask = g.map((r) => r.map((v) => v !== MAT2.empty));
  const overlay = makeGrid(64);
  bezier(overlay, p0, p1, p2, p3, width, ch);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) if (mask[y][x] && overlay[y][x] !== MAT2.empty) g[y][x] = ch;
}
function clippedLine(g, a, b, width, ch) {
  const mask = g.map((r) => r.map((v) => v !== MAT2.empty));
  const overlay = makeGrid(64);
  thickLine(overlay, a[0], a[1], b[0], b[1], width, ch);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) if (mask[y][x] && overlay[y][x] !== MAT2.empty) g[y][x] = ch;
}
function cutEllipse(g, cx, cy, rx, ry) {
  ellipse(g, cx, cy, rx, ry, MAT2.empty);
}
function gem(g, cx, cy, r = 3) {
  ellipse(g, cx, cy, r + 1.2, r + 1.2, MAT2.gold);
  ellipse(g, cx, cy, r, r, MAT2.gem);
  set(g, Math.round(cx - r * 0.35), Math.round(cy - r * 0.45), MAT2.energy);
  set(g, Math.round(cx + r * 0.45), Math.round(cy + r * 0.35), MAT2.core);
}
function wrap(g, a, b, width) {
  thickLine(g, a[0], a[1], b[0], b[1], width, MAT2.leather);
  const steps = 7;
  for (let i = 1; i < steps; i += 2) {
    const t = i / steps;
    const x = a[0] + (b[0] - a[0]) * t;
    const y = a[1] + (b[1] - a[1]) * t;
    set(g, Math.round(x), Math.round(y), MAT2.gold);
  }
}
function runeTicks(g, a, b, count) {
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const x = Math.round(a[0] + (b[0] - a[0]) * t);
    const y = Math.round(a[1] + (b[1] - a[1]) * t);
    if (get(g, x, y) !== MAT2.empty) set(g, x, y, i % 3 === 0 ? MAT2.energy : MAT2.rune);
  }
}
function swordStandard(g, opt) {
  const dagger2 = !!opt.dagger;
  const great = !!opt.great;
  const broad = !!opt.broad || great;
  const tip = dagger2 ? [55, 8] : [59, 3];
  const base = dagger2 ? [31, 34] : [28, 37];
  const half = great ? 8.5 : broad ? 6.2 : 4.4;
  const px = 0.7;
  const py = 0.7;
  const l = [base[0] - px * half, base[1] - py * half];
  const r = [base[0] + px * half, base[1] + py * half];
  const tl = [tip[0] - 2.2, tip[1] + 0.7];
  const tr = [tip[0] - 0.7, tip[1] + 2.2];
  poly(g, [tip, tr, r, l, tl], MAT2.blade);
  poly(
    g,
    [
      [tip[0] - 2, tip[1] + 2],
      [tip[0] - 3.3, tip[1] + 3.8],
      [base[0] + half * 0.43, base[1] + half * 0.43],
      [base[0] - half * 0.46, base[1] - half * 0.46]
    ],
    opt.wither ? MAT2.energy : MAT2.core
  );
  clippedLine(g, [tip[0] - 1, tip[1] + 2], [r[0] - 1, r[1] - 1], 1, MAT2.gold);
  clippedLine(g, [tip[0] - 4, tip[1] + 4], [base[0], base[1]], great ? 2 : 1, opt.wither ? MAT2.rune : MAT2.iron);
  runeTicks(g, [tip[0] - 5, tip[1] + 5], [base[0], base[1]], dagger2 ? 3 : 7);
  const guardA = dagger2 ? [22, 29] : great ? [15, 28] : [17, 31];
  const guardB = dagger2 ? [37, 44] : great ? [39, 52] : [36, 50];
  thickLine(g, guardA[0], guardA[1], guardB[0], guardB[1], great ? 4 : 3, MAT2.gold);
  thickLine(g, guardA[0] + 2, guardA[1], guardA[0] - 1, guardA[1] + 3, 3, MAT2.iron);
  thickLine(g, guardB[0], guardB[1] - 2, guardB[0] + 3, guardB[1] + 1, 3, MAT2.iron);
  const gripA = dagger2 ? [24, 40] : [23, 43];
  const gripB = dagger2 ? [12, 52] : [8, 58];
  wrap(g, gripA, gripB, great ? 7 : 5);
  ellipse(g, gripB[0] - 2, gripB[1] + 2, great ? 4.5 : 3.5, great ? 4.5 : 3.5, MAT2.gold);
  gem(g, guardA[0] + (guardB[0] - guardA[0]) * 0.5, guardA[1] + (guardB[1] - guardA[1]) * 0.5, great ? 3 : 2.3);
  if (opt.wither) {
    ellipse(g, 19, 32, 5.5, 5.5, MAT2.bone);
    cutEllipse(g, 17.5, 31, 1.2, 1.2);
    cutEllipse(g, 21.2, 33.2, 1.1, 1.1);
    gem(g, 19.5, 32.5, 2.1);
    clippedBezier(g, [29, 36], [37, 28], [45, 21], [54, 9], 1, MAT2.rune);
  }
}
function swordKatana(g) {
  bezier(g, [14, 55], [28, 42], [44, 22], [58, 3], 7, MAT2.core);
  bezier(g, [15, 53], [29, 40], [45, 20], [59, 3], 2, MAT2.blade);
  bezier(g, [18, 52], [31, 40], [44, 24], [56, 8], 1, MAT2.gold);
  ellipse(g, 17, 51, 6, 4.5, MAT2.gold, false);
  wrap(g, [14, 54], [5, 62], 5);
  runeTicks(g, [25, 43], [52, 10], 7);
}
function swordRapier(g) {
  thickLine(g, 26, 39, 59, 4, 4, MAT2.blade);
  thickLine(g, 28, 37, 57, 7, 1, MAT2.gold);
  arc(g, 23, 42, 10, Math.PI * 0.5, Math.PI * 1.48, MAT2.gold, 3);
  arc(g, 23, 42, 7, Math.PI * 0.54, Math.PI * 1.42, MAT2.iron, 1);
  wrap(g, [19, 45], [7, 58], 4);
  ellipse(g, 5, 60, 3.5, 3.5, MAT2.gold);
  gem(g, 22, 42, 2.2);
}
function swordScythe(g, magical = false) {
  bezier(g, [9, 16], [27, 1], [51, 3], [59, 18], 8, MAT2.core);
  bezier(g, [8, 13], [28, -1], [53, 3], [61, 16], 2, MAT2.blade);
  bezier(g, [12, 18], [30, 7], [48, 8], [56, 19], 1, magical ? MAT2.energy : MAT2.gold);
  thickLine(g, 47, 17, 11, 59, 6, magical ? MAT2.iron : MAT2.wood);
  wrap(g, [22, 46], [11, 59], 6);
  gem(g, 46, 18, 3);
  if (magical) runeTicks(g, [42, 23], [17, 52], 8);
}
function swordChainsaw(g) {
  poly(g, [[16, 42], [22, 48], [54, 16], [48, 10]], MAT2.iron);
  poly(g, [[18, 40], [24, 46], [52, 18], [46, 12]], MAT2.core);
  for (let t = 0; t <= 36; t += 4) {
    const p1 = [18 + t * 0.9, 44 - t * 0.9];
    set(g, Math.round(p1[0] - 2), Math.round(p1[1] + 2), MAT2.blade);
    set(g, Math.round(p1[0] - 1), Math.round(p1[1] + 3), MAT2.blade);
    const p2 = [15 + t * 0.9, 41 - t * 0.9];
    set(g, Math.round(p2[0] + 2), Math.round(p2[1] - 2), MAT2.blade);
    set(g, Math.round(p2[0] + 3), Math.round(p2[1] - 1), MAT2.blade);
  }
  rect(g, 10, 44, 14, 12, MAT2.gold);
  rect(g, 12, 46, 10, 8, MAT2.iron);
  ellipse(g, 17, 50, 3, 3, MAT2.energy);
  thickLine(g, 12, 54, 5, 61, 5, MAT2.leather);
  set(g, 4, 62, MAT2.gold);
}
function swordPiston(g) {
  poly(g, [[20, 36], [24, 40], [58, 6], [54, 2]], MAT2.blade);
  poly(g, [[22, 34], [26, 38], [56, 8], [52, 4]], MAT2.core);
  rect(g, 22, 30, 8, 8, MAT2.gold);
  rect(g, 24, 32, 4, 4, MAT2.energy);
  thickLine(g, 26, 34, 38, 22, 3, MAT2.iron);
  rect(g, 34, 18, 6, 6, MAT2.gold);
  set(g, 37, 21, MAT2.energy);
  thickLine(g, 18, 42, 6, 54, 6, MAT2.iron);
  wrap(g, [16, 44], [6, 54], 5);
  ellipse(g, 4, 56, 4, 4, MAT2.gold);
}
function buildSword(id, g) {
  if (id === "sword_katana") return swordKatana(g);
  if (id === "sword_rapier") return swordRapier(g);
  if (id === "sword_scythe") return swordScythe(g);
  if (id === "sword_chainsaw") return swordChainsaw(g);
  if (id === "sword_piston") return swordPiston(g);
  swordStandard(g, {
    broad: id === "sword_broad",
    great: id === "sword_great",
    dagger: id === "sword_dagger",
    wither: id === "sword_wither"
  });
}
function buildBow(id, g) {
  if (id === "bow_railgun") {
    thickLine(g, 8, 32, 54, 32, 6, MAT2.iron);
    thickLine(g, 10, 24, 56, 24, 3, MAT2.gold);
    thickLine(g, 10, 40, 56, 40, 3, MAT2.gold);
    for (let x = 16; x <= 48; x += 8) {
      rect(g, x, 22, 3, 20, MAT2.energy);
    }
    poly(g, [[52, 26], [61, 32], [52, 38]], MAT2.blade);
    wrap(g, [6, 32], [14, 48], 6);
    gem(g, 20, 32, 3);
    return;
  }
  if (id === "bow_crossbow") {
    thickLine(g, 8, 32, 48, 32, 8, MAT2.wood);
    poly(g, [[42, 22], [61, 31], [42, 42], [46, 33]], MAT2.blade);
    thickLine(g, 23, 28, 15, 55, 7, MAT2.leather);
    bezier(g, [20, 7], [46, 10], [55, 20], [48, 31], 4, MAT2.gold);
    bezier(g, [48, 33], [55, 44], [45, 54], [20, 57], 4, MAT2.gold);
    line(g, 20, 7, 48, 32, MAT2.string);
    line(g, 48, 32, 20, 57, MAT2.string);
    gem(g, 28, 32, 3);
    runeTicks(g, [33, 32], [48, 32], 4);
    return;
  }
  const heavy = id === "bow_heavy";
  const short = id === "bow_short";
  const top = short ? [21, 15] : [18, 6];
  const bottom = short ? [21, 49] : [18, 58];
  const outside = heavy ? 58 : short ? 49 : 55;
  const width = heavy ? 7 : 5;
  const material = heavy ? MAT2.iron : MAT2.wood;
  bezier(g, top, [outside, 8], [outside, 24], [35, 32], width, material);
  bezier(g, [35, 32], [outside, 40], [outside, 56], bottom, width, material);
  bezier(g, [top[0] + 2, top[1] + 2], [outside - 3, 12], [outside - 3, 23], [37, 31], 1, MAT2.gold);
  bezier(g, [37, 33], [outside - 3, 41], [outside - 3, 52], [bottom[0] + 2, bottom[1] - 2], 1, MAT2.gold);
  line(g, top[0], top[1], bottom[0], bottom[1], MAT2.string);
  thickLine(g, 32, 28, 32, 36, heavy ? 8 : 6, MAT2.leather);
  gem(g, 35, 32, heavy ? 3.5 : 2.7);
  if (heavy) {
    rect(g, 15, 4, 8, 5, MAT2.gold);
    rect(g, 15, 55, 8, 5, MAT2.gold);
    runeTicks(g, [43, 19], [43, 45], 5);
  }
}
function buildStaff(id, g) {
  if (id === "staff_scythe") return swordScythe(g, true);
  if (id === "staff_gyro") {
    thickLine(g, 10, 59, 42, 22, 5, MAT2.wood);
    wrap(g, [11, 58], [20, 48], 6);
    ellipse(g, 46, 18, 13, 13, MAT2.gold, false);
    ellipse(g, 46, 18, 9, 9, MAT2.iron, false);
    ellipse(g, 46, 18, 5, 5, MAT2.energy);
    line(g, 46, 4, 46, 32, MAT2.gold);
    line(g, 32, 18, 60, 18, MAT2.gold);
    gem(g, 46, 18, 3);
    return;
  }
  const orb = id === "staff_orb";
  const sceptre2 = id === "staff_sceptre";
  const head = orb ? [45, 16] : sceptre2 ? [47, 15] : [51, 10];
  thickLine(g, 10, 59, head[0] - 5, head[1] + 7, sceptre2 ? 6 : 5, MAT2.wood);
  wrap(g, [11, 58], [22, 47], 6);
  clippedBezier(g, [20, 48], [28, 37], [34, 28], [42, 20], 1, MAT2.rune);
  if (orb) {
    ellipse(g, head[0], head[1], 11, 11, MAT2.energy);
    ellipse(g, head[0], head[1], 8, 8, MAT2.gem);
    arc(g, head[0], head[1], 13, 0, Math.PI * 2, MAT2.gold, 2);
    line(g, 35, 12, 55, 20, MAT2.gold);
    line(g, 37, 23, 53, 8, MAT2.gold);
  } else if (sceptre2) {
    arc(g, head[0], head[1], 11, 0, Math.PI * 2, MAT2.gold, 3);
    gem(g, head[0], head[1], 6);
    for (const a of [-1.15, -0.5, 0.15]) {
      const x = head[0] + Math.cos(a) * 15;
      const y = head[1] + Math.sin(a) * 15;
      thickLine(g, head[0], head[1], x, y, 2, MAT2.gold);
    }
  } else {
    gem(g, head[0], head[1], 5);
    bezier(g, [43, 15], [46, 3], [58, 2], [60, 12], 3, MAT2.gold);
    bezier(g, [46, 17], [55, 18], [59, 25], [54, 30], 2, MAT2.gold);
  }
}
function buildTool(id, g) {
  if (id === "tool_wrench") {
    thickLine(g, 12, 58, 44, 26, 7, MAT2.iron);
    wrap(g, [12, 58], [24, 46], 8);
    poly(g, [[38, 12], [58, 12], [62, 32], [46, 36], [32, 22]], MAT2.gold);
    rect(g, 46, 18, 14, 12, ".");
    gem(g, 36, 26, 3.5);
    return;
  }
  if (id === "tool_pilebunker") {
    poly(g, [[12, 24], [23, 14], [52, 20], [58, 44], [46, 56], [16, 56], [8, 42]], MAT2.iron);
    poly(g, [[17, 28], [26, 20], [48, 24], [52, 42], [42, 50], [20, 50], [14, 40]], MAT2.core);
    poly(g, [[32, 6], [40, 2], [44, 18], [28, 18]], MAT2.blade);
    rect(g, 26, 26, 16, 12, MAT2.gold);
    ellipse(g, 34, 32, 5, 5, MAT2.energy);
    wrap(g, [16, 54], [44, 54], 8);
    return;
  }
  if (id === "tool_gauntlet") {
    poly(g, [[12, 24], [23, 14], [49, 20], [56, 35], [49, 52], [22, 55], [8, 42]], MAT2.iron);
    poly(g, [[17, 28], [26, 20], [45, 24], [50, 35], [44, 47], [24, 49], [14, 40]], MAT2.core);
    for (let i = 0; i < 4; i++) {
      rect(g, 21 + i * 7, 15 + i % 2, 5, 13, MAT2.gold);
      gem(g, 23 + i * 7, 23, 2.1);
    }
    gem(g, 34, 37, 6);
    runeTicks(g, [19, 43], [48, 39], 7);
    return;
  }
  if (id === "tool_drill") {
    poly(g, [[7, 39], [19, 24], [44, 19], [56, 28], [55, 39], [39, 46], [18, 48]], MAT2.iron);
    poly(g, [[41, 19], [61, 24], [61, 34], [42, 39], [50, 30]], MAT2.blade);
    thickLine(g, 22, 44, 16, 59, 8, MAT2.leather);
    rect(g, 13, 56, 12, 6, MAT2.gold);
    gem(g, 32, 33, 6);
    for (let x = 45; x < 59; x += 4) line(g, x, 23, x - 2, 36, MAT2.gold);
    clippedLine(g, [12, 39], [49, 30], 1, MAT2.rune);
    return;
  }
  if (id === "tool_rod") {
    bezier(g, [8, 59], [21, 43], [36, 21], [50, 6], 5, MAT2.wood);
    clippedBezier(g, [11, 57], [24, 40], [37, 20], [49, 8], 1, MAT2.gold);
    line(g, 50, 6, 57, 46, MAT2.string);
    gem(g, 57, 48, 3);
    wrap(g, [8, 59], [18, 47], 6);
    return;
  }
  if (id === "tool_hook") {
    thickLine(g, 8, 58, 39, 27, 5, MAT2.wood);
    wrap(g, [8, 58], [18, 48], 6);
    bezier(g, [38, 29], [61, 22], [61, 49], [43, 50], 6, MAT2.iron);
    bezier(g, [41, 31], [55, 28], [55, 43], [44, 46], 2, MAT2.blade);
    gem(g, 39, 29, 3);
    return;
  }
  thickLine(g, 13, 58, 39, 28, 6, MAT2.wood);
  wrap(g, [13, 58], [25, 44], 7);
  gem(g, 38, 29, 2.5);
  if (id === "tool_pickaxe") {
    bezier(g, [16, 24], [29, 8], [48, 4], [61, 16], 7, MAT2.iron);
    bezier(g, [17, 21], [31, 7], [50, 7], [60, 18], 2, MAT2.blade);
    runeTicks(g, [23, 18], [55, 14], 6);
  } else if (id === "tool_axe") {
    poly(g, [[28, 12], [48, 5], [59, 13], [55, 33], [39, 35], [32, 28]], MAT2.blade);
    poly(g, [[34, 15], [47, 10], [53, 15], [50, 27], [39, 30], [34, 25]], MAT2.core);
    clippedBezier(g, [35, 18], [43, 15], [49, 17], [51, 25], 1, MAT2.gold);
  } else {
    poly(g, [[24, 17], [58, 7], [60, 15], [32, 29]], MAT2.blade);
    poly(g, [[30, 19], [55, 12], [48, 20], [35, 26]], MAT2.core);
  }
}
function helmBase(g, hood = false) {
  if (hood) {
    poly(g, [[13, 50], [9, 27], [18, 10], [33, 4], [49, 12], [57, 29], [52, 53], [43, 59], [20, 58]], MAT2.cloth);
    poly(g, [[18, 48], [16, 28], [23, 17], [35, 13], [47, 21], [51, 35], [46, 49]], MAT2.core);
  } else {
    poly(g, [[10, 48], [11, 23], [21, 9], [33, 4], [47, 10], [55, 25], [54, 49], [44, 58], [20, 57]], MAT2.iron);
    poly(g, [[16, 44], [17, 25], [25, 14], [34, 10], [44, 16], [49, 28], [48, 45], [40, 52], [23, 51]], MAT2.core);
  }
}
function buildHelm(id, g) {
  if (id === "armor_helm_crown") {
    poly(g, [[9, 47], [13, 19], [22, 31], [31, 8], [40, 30], [52, 17], [56, 48]], MAT2.gold);
    poly(g, [[14, 42], [18, 28], [24, 37], [31, 19], [39, 37], [49, 27], [52, 43]], MAT2.iron);
    rect(g, 11, 43, 44, 9, MAT2.gold);
    gem(g, 32, 43, 4);
    gem(g, 17, 42, 2.2);
    gem(g, 48, 42, 2.2);
    return;
  }
  const hood = id === "armor_helm_hood";
  helmBase(g, hood);
  if (id === "armor_helm_horn") {
    poly(g, [[18, 15], [4, 2], [9, 25]], MAT2.bone);
    poly(g, [[45, 14], [59, 1], [54, 25]], MAT2.bone);
    clippedLine(g, [8, 5], [16, 17], 1, MAT2.gold);
    clippedLine(g, [56, 5], [48, 17], 1, MAT2.gold);
  }
  if (!hood) {
    poly(g, [[13, 33], [51, 30], [50, 38], [14, 41]], MAT2.gold);
    rect(g, 21, 33, 25, 5, MAT2.empty);
    for (let x = 22; x <= 45; x += 5) set(g, x, 36, MAT2.rune);
    clippedBezier(g, [18, 24], [28, 17], [40, 17], [48, 25], 1, MAT2.gold);
  } else {
    gem(g, 33, 18, 3);
    clippedBezier(g, [16, 31], [28, 22], [42, 23], [50, 36], 1, MAT2.rune);
  }
}
function chestPlate(g, light = false) {
  poly(g, [[6, 23], [17, 8], [26, 15], [38, 15], [48, 8], [59, 23], [53, 34], [50, 59], [14, 59], [11, 34]], light ? MAT2.leather : MAT2.iron);
  poly(g, [[15, 25], [23, 16], [41, 16], [50, 25], [45, 53], [19, 53]], light ? MAT2.cloth : MAT2.core);
  poly(g, [[26, 16], [38, 16], [44, 28], [38, 45], [26, 45], [20, 28]], MAT2.gold);
  poly(g, [[29, 20], [35, 20], [39, 29], [35, 39], [29, 39], [25, 29]], light ? MAT2.leather : MAT2.core);
  gem(g, 32, 29, 4);
  clippedBezier(g, [15, 33], [24, 43], [40, 43], [50, 33], 1, MAT2.rune);
  if (light) {
    cutEllipse(g, 13, 45, 3, 7);
    cutEllipse(g, 51, 45, 3, 7);
  }
}
function buildArmor(id, g) {
  if (id.startsWith("armor_helm")) return buildHelm(id, g);
  if (id === "armor_chest_plate") return chestPlate(g);
  if (id === "armor_chest_light") return chestPlate(g, true);
  if (id === "armor_chest_robe") {
    poly(g, [[7, 21], [19, 8], [27, 15], [38, 15], [47, 8], [58, 22], [50, 35], [55, 61], [10, 61], [15, 35]], MAT2.cloth);
    poly(g, [[21, 14], [43, 14], [48, 33], [42, 56], [22, 56], [16, 33]], MAT2.core);
    poly(g, [[27, 14], [37, 14], [40, 55], [24, 55]], MAT2.gold);
    gem(g, 32, 27, 4);
    clippedBezier(g, [17, 38], [28, 31], [39, 32], [49, 40], 1, MAT2.rune);
    return;
  }
  if (id === "armor_legs") {
    poly(g, [[14, 8], [50, 8], [53, 28], [45, 59], [31, 59], [31, 32], [27, 59], [12, 59], [10, 28]], MAT2.iron);
    poly(g, [[19, 13], [45, 13], [47, 27], [40, 53], [34, 53], [34, 27], [28, 27], [26, 53], [18, 53], [16, 27]], MAT2.core);
    rect(g, 12, 9, 39, 6, MAT2.gold);
    gem(g, 32, 13, 3);
    clippedLine(g, [18, 22], [24, 51], 1, MAT2.rune);
    clippedLine(g, [46, 22], [40, 51], 1, MAT2.rune);
    return;
  }
  poly(g, [[11, 14], [27, 11], [31, 23], [27, 47], [8, 55], [3, 47], [10, 38]], MAT2.iron);
  poly(g, [[37, 11], [53, 14], [54, 38], [61, 47], [56, 55], [37, 47], [33, 23]], MAT2.iron);
  poly(g, [[14, 17], [23, 16], [26, 25], [22, 42], [10, 47], [14, 36]], MAT2.core);
  poly(g, [[41, 16], [50, 17], [50, 36], [54, 47], [42, 42], [38, 25]], MAT2.core);
  thickLine(g, 8, 51, 27, 45, 4, MAT2.gold);
  thickLine(g, 37, 45, 57, 51, 4, MAT2.gold);
  gem(g, 21, 22, 2.2);
  gem(g, 43, 22, 2.2);
}
function buildAccessory(id, g) {
  if (id === "acc_ring") {
    ellipse(g, 32, 35, 20, 20, MAT2.gold, false);
    ellipse(g, 32, 35, 15, 15, MAT2.iron, false);
    poly(g, [[21, 19], [27, 8], [38, 8], [44, 19], [38, 28], [27, 28]], MAT2.gold);
    gem(g, 32, 17, 7);
    return;
  }
  if (id === "acc_orb") {
    ellipse(g, 32, 32, 24, 24, MAT2.energy);
    ellipse(g, 32, 32, 19, 19, MAT2.gem);
    ellipse(g, 32, 32, 13, 13, MAT2.core);
    arc(g, 32, 32, 27, 0, Math.PI * 2, MAT2.gold, 3);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const x = 32 + Math.cos(a) * 27;
      const y = 32 + Math.sin(a) * 27;
      gem(g, x, y, 2);
    }
    clippedBezier(g, [15, 37], [24, 15], [42, 49], [50, 27], 1, MAT2.rune);
    return;
  }
  if (id === "acc_book") {
    poly(g, [[8, 13], [31, 9], [32, 55], [8, 59]], MAT2.leather);
    poly(g, [[32, 9], [57, 13], [57, 59], [32, 55]], MAT2.leather);
    poly(g, [[12, 17], [29, 14], [29, 51], [12, 55]], MAT2.bone);
    poly(g, [[35, 14], [53, 17], [53, 55], [35, 51]], MAT2.bone);
    line(g, 32, 10, 32, 56, MAT2.gold);
    clippedBezier(g, [16, 25], [21, 20], [25, 29], [27, 23], 1, MAT2.rune);
    clippedBezier(g, [38, 24], [43, 18], [49, 30], [51, 22], 1, MAT2.rune);
    gem(g, 32, 33, 3);
    return;
  }
  if (id === "acc_potion") {
    rect(g, 25, 5, 14, 9, MAT2.gold);
    rect(g, 22, 12, 20, 8, MAT2.bone);
    poly(g, [[21, 18], [43, 18], [51, 31], [48, 55], [40, 61], [24, 61], [16, 55], [13, 31]], MAT2.iron);
    poly(g, [[18, 34], [46, 34], [45, 53], [38, 57], [25, 57], [19, 52]], MAT2.energy);
    ellipse(g, 32, 42, 10, 9, MAT2.gem);
    set(g, 27, 39, MAT2.energy);
    set(g, 37, 46, MAT2.core);
    return;
  }
  if (id === "acc_crystal") {
    poly(g, [[32, 2], [50, 22], [43, 53], [32, 62], [20, 52], [13, 23]], MAT2.gem);
    poly(g, [[32, 5], [36, 31], [32, 59], [22, 49], [18, 24]], MAT2.energy);
    poly(g, [[36, 8], [47, 23], [40, 47], [36, 31]], MAT2.core);
    line(g, 32, 6, 32, 57, MAT2.rune);
    return;
  }
  if (id === "acc_scroll") {
    poly(g, [[12, 8], [52, 8], [57, 15], [52, 55], [13, 55], [7, 48]], MAT2.bone);
    ellipse(g, 14, 12, 7, 7, MAT2.gold, false);
    ellipse(g, 51, 51, 7, 7, MAT2.gold, false);
    for (let y = 19; y <= 45; y += 6) line(g, 18, y, 47 - (y % 12 === 0 ? 5 : 0), y, MAT2.rune);
    gem(g, 33, 34, 3);
    return;
  }
  if (id === "acc_artifact") {
    poly(g, [[32, 3], [55, 15], [60, 39], [44, 59], [20, 59], [4, 39], [9, 15]], MAT2.gold);
    poly(g, [[32, 10], [49, 19], [53, 37], [40, 52], [24, 52], [11, 37], [15, 19]], MAT2.iron);
    poly(g, [[32, 16], [45, 24], [46, 38], [37, 47], [27, 47], [18, 38], [19, 24]], MAT2.core);
    gem(g, 32, 32, 7);
    runeTicks(g, [15, 18], [49, 47], 9);
    return;
  }
  ellipse(g, 32, 32, 22, 22, MAT2.gold);
  ellipse(g, 32, 32, 17, 17, MAT2.iron);
  poly(g, [[32, 12], [45, 32], [32, 52], [19, 32]], MAT2.core);
  gem(g, 32, 32, 6);
  line(g, 32, 3, 32, 10, MAT2.string);
  ellipse(g, 32, 4, 4, 4, MAT2.gold, false);
}
function buildPet(id, g) {
  if (id === "pet_bee") {
    ellipse(g, 32, 34, 19, 15, MAT2.gold);
    ellipse(g, 32, 34, 14, 12, MAT2.fur);
    for (let x = 25; x <= 39; x += 7) rect(g, x, 22, 3, 25, MAT2.iron);
    ellipse(g, 16, 28, 10, 8, MAT2.energy);
    ellipse(g, 48, 28, 10, 8, MAT2.energy);
    ellipse(g, 25, 31, 2.5, 3, MAT2.gem);
    ellipse(g, 39, 31, 2.5, 3, MAT2.gem);
    line(g, 25, 20, 21, 10, MAT2.string);
    line(g, 39, 20, 43, 10, MAT2.string);
    return;
  }
  if (id === "pet_whale") {
    bezier(g, [5, 37], [10, 12], [48, 10], [59, 32], 24, MAT2.fur);
    bezier(g, [8, 40], [22, 52], [48, 49], [58, 34], 12, MAT2.core);
    poly(g, [[8, 37], [0, 25], [2, 46]], MAT2.fur);
    ellipse(g, 45, 28, 3, 3, MAT2.gem);
    clippedBezier(g, [18, 23], [27, 16], [40, 18], [50, 25], 1, MAT2.energy);
    line(g, 32, 48, 28, 57, MAT2.fur);
    line(g, 38, 47, 44, 56, MAT2.fur);
    return;
  }
  if (id === "pet_bird") {
    ellipse(g, 34, 32, 15, 18, MAT2.fur);
    poly(g, [[24, 31], [4, 17], [13, 44], [28, 48]], MAT2.fur);
    poly(g, [[43, 30], [59, 18], [54, 42], [40, 48]], MAT2.fur);
    poly(g, [[45, 28], [58, 34], [45, 37]], MAT2.gold);
    ellipse(g, 38, 27, 2.6, 2.6, MAT2.gem);
    clippedBezier(g, [22, 30], [31, 22], [41, 38], [47, 30], 1, MAT2.energy);
    line(g, 30, 49, 25, 59, MAT2.gold);
    line(g, 39, 49, 44, 59, MAT2.gold);
    return;
  }
  if (id === "pet_dragon") {
    ellipse(g, 39, 31, 14, 12, MAT2.fur);
    poly(g, [[26, 27], [8, 8], [14, 36]], MAT2.fur);
    poly(g, [[45, 23], [57, 5], [58, 28]], MAT2.fur);
    poly(g, [[29, 41], [15, 58], [36, 49]], MAT2.fur);
    poly(g, [[43, 42], [55, 58], [53, 39]], MAT2.fur);
    bezier(g, [31, 37], [18, 43], [11, 34], [5, 25], 5, MAT2.fur);
    poly(g, [[48, 30], [61, 34], [49, 39]], MAT2.gold);
    ellipse(g, 43, 27, 2.5, 2.5, MAT2.gem);
    clippedBezier(g, [27, 28], [35, 20], [45, 21], [51, 30], 1, MAT2.energy);
    for (let x = 28; x <= 47; x += 5) set(g, x, 36 + (x / 5 % 2 | 0), MAT2.gold);
    return;
  }
  ellipse(g, 36, 32, 18, 14, MAT2.fur);
  ellipse(g, 48, 23, 11, 10, MAT2.fur);
  poly(g, [[42, 18], [42, 6], [49, 15]], MAT2.fur);
  poly(g, [[53, 17], [60, 7], [58, 21]], MAT2.fur);
  thickLine(g, 24, 41, 21, 57, 7, MAT2.fur);
  thickLine(g, 43, 42, 47, 58, 7, MAT2.fur);
  bezier(g, [20, 31], [5, 25], [6, 43], [14, 46], 4, MAT2.fur);
  ellipse(g, 51, 22, 2.5, 2.5, MAT2.gem);
  clippedBezier(g, [24, 29], [33, 22], [44, 25], [51, 34], 1, MAT2.energy);
  for (let x = 28; x <= 42; x += 5) set(g, x, 37, MAT2.gold);
}
function buildMinion(g) {
  poly(g, [[15, 10], [49, 10], [57, 20], [55, 47], [45, 57], [19, 57], [9, 47], [7, 20]], MAT2.cloth);
  poly(g, [[17, 17], [47, 17], [50, 42], [42, 50], [22, 50], [14, 42]], MAT2.core);
  rect(g, 16, 23, 32, 15, MAT2.iron);
  ellipse(g, 24, 30, 4, 4, MAT2.gem);
  ellipse(g, 40, 30, 4, 4, MAT2.gem);
  set(g, 23, 29, MAT2.energy);
  set(g, 39, 29, MAT2.energy);
  rect(g, 24, 41, 16, 3, MAT2.gold);
  thickLine(g, 12, 37, 4, 48, 5, MAT2.wood);
  thickLine(g, 52, 37, 60, 48, 5, MAT2.wood);
  thickLine(g, 24, 51, 22, 62, 6, MAT2.leather);
  thickLine(g, 40, 51, 42, 62, 6, MAT2.leather);
  gem(g, 32, 14, 3);
  clippedBezier(g, [18, 20], [28, 14], [38, 15], [47, 22], 1, MAT2.rune);
}
var BUILDERS = Object.fromEntries(
  NATIVE64_TEMPLATE_IDS.map((id) => [
    id,
    (g) => {
      if (id.startsWith("sword_")) buildSword(id, g);
      else if (id.startsWith("bow_")) buildBow(id, g);
      else if (id.startsWith("staff_")) buildStaff(id, g);
      else if (id.startsWith("tool_")) buildTool(id, g);
      else if (id.startsWith("armor_")) buildArmor(id, g);
      else if (id.startsWith("acc_")) buildAccessory(id, g);
      else if (id.startsWith("pet_")) buildPet(id, g);
      else buildMinion(g);
    }
  ])
);
var cache = /* @__PURE__ */ new Map();
function isNative64Template(id) {
  return NATIVE_SET.has(id);
}
function getNative64Template(id) {
  if (!isNative64Template(id)) throw new Error(`No native 64\xD764 template: ${id}`);
  let grid = cache.get(id);
  if (!grid) {
    grid = makeGrid(64);
    BUILDERS[id](grid);
    validateGrid(grid, `native64:${id}`, 64);
    cache.set(id, grid);
  }
  return grid.map((row) => [...row]);
}
function applyNative64Essence(grid, input) {
  const g = grid.map((row) => [...row]);
  const ids = new Set(input.signatureIds);
  const overhaul = ids.has("overhaul_intricate");
  const nameless = ids.has("nameless_heroic");
  const imperial = ids.has("imperial_ornate");
  const reborn = ids.has("reborn_clean");
  const depth = ids.has("depth_3d");
  const source = grid.map((row) => [...row]);
  const hash = (x, y, salt) => {
    let n = x * 374761393 + y * 668265263 + input.seed * 1442695041 + salt * 1013904223 | 0;
    n = Math.imul(n ^ n >>> 13, 1274126177);
    return (n ^ n >>> 16) >>> 0;
  };
  const occupied = (x, y) => get(source, x, y) !== MAT2.empty;
  const interior = (x, y) => occupied(x, y) && occupied(x - 1, y) && occupied(x + 1, y) && occupied(x, y - 1) && occupied(x, y + 1);
  for (let y = 1; y < 63; y++) {
    for (let x = 1; x < 63; x++) {
      const ch = source[y][x];
      if (ch === MAT2.empty) continue;
      const h = hash(x, y, 7);
      if (ch === MAT2.gem) {
        if ((x + y + (input.seed & 3)) % (overhaul ? 4 : 6) === 0) g[y][x] = MAT2.energy;
        else if ((x - y + 128) % 7 === 0) g[y][x] = MAT2.core;
        continue;
      }
      if ((overhaul || imperial) && interior(x, y) && (ch === MAT2.core || ch === MAT2.iron)) {
        const wave = Math.round(Math.sin(x / 6 + input.seed * 0.01) * 3);
        const band = ((y - 32 + wave) % 10 + 10) % 10;
        if (band === 0 && interior(x, y - 1) && interior(x, y + 1)) {
          g[y][x] = overhaul && (x + input.seed) % 9 === 0 ? MAT2.rune : MAT2.gold;
          continue;
        }
      }
      if (nameless && interior(x, y) && (ch === MAT2.core || ch === MAT2.blade)) {
        const heraldic = (x + y + input.seed % 11) % 13;
        if (heraldic === 0 || heraldic === 1 && h % 4 === 0) {
          g[y][x] = h % 3 === 0 ? MAT2.energy : MAT2.rune;
          continue;
        }
      }
      if (reborn && input.clean > 0.6 && interior(x, y) && (ch === MAT2.core || ch === MAT2.gold)) {
        if ((x * 5 + y * 3 + input.seed) % 89 === 0) g[y][x] = MAT2.energy;
      }
      if (depth && input.pseudo3d > 0.7 && ch === MAT2.core && x + y > 72 && h % 5 === 0) {
        g[y][x] = MAT2.iron;
      }
    }
  }
  return g;
}

// ../skyblock/hypixel-skyblock-texture-generator (1)/src/lib/templates.ts
var M = {
  blade: "b",
  core: "B",
  iron: "m",
  gold: "M",
  gem: "g",
  wood: "w",
  leather: "l",
  cloth: "c",
  string: "s",
  energy: "e",
  bone: "k",
  fur: "p",
  rune: "r"
};
function classicSword(c) {
  c.antiBand(13, 13, 3, 15, 0, 12, M.blade);
  c.antiBand(14, 14, 3, 15, 0, 12, M.core);
  c.antiBand(15, 15, 4, 15, 1, 12, M.iron);
  c.set(15, 0, M.blade);
  c.set(14, 0, M.blade);
  c.thickLine(2, 8, 8, 14, 1, M.gold);
  c.set(2, 8, M.iron);
  c.set(8, 14, M.iron);
  c.set(5, 11, M.gem);
  c.line(4, 11, 1, 14, M.leather);
  c.set(0, 15, M.gold);
  c.set(1, 15, M.gold);
}
function broadSword(c) {
  c.antiBand(12, 12, 3, 15, 0, 12, M.blade);
  c.antiBand(13, 14, 3, 15, 0, 12, M.core);
  c.antiBand(15, 15, 4, 15, 1, 12, M.iron);
  c.set(15, 0, M.blade);
  c.set(14, 0, M.blade);
  c.set(15, 1, M.blade);
  c.thickLine(1, 7, 8, 14, 2, M.gold);
  c.set(1, 7, M.iron);
  c.set(8, 14, M.iron);
  c.set(4, 10, M.gem);
  c.line(4, 11, 1, 14, M.leather);
  c.set(0, 15, M.gold);
  c.set(1, 15, M.gold);
}
function greatSword(c) {
  c.antiBand(11, 11, 2, 15, 0, 13, M.blade);
  c.antiBand(12, 14, 2, 15, 0, 13, M.core);
  c.antiBand(15, 16, 3, 15, 1, 13, M.iron);
  c.antiBand(13, 13, 6, 12, 1, 7, M.gold);
  c.set(15, 0, M.blade);
  c.set(14, 0, M.blade);
  c.set(15, 1, M.blade);
  c.thickLine(0, 7, 8, 15, 2, M.gold);
  c.set(0, 7, M.iron);
  c.set(8, 15, M.iron);
  c.set(4, 11, M.gem);
  c.line(3, 12, 1, 14, M.leather);
  c.set(0, 15, M.gold);
}
function katana(c) {
  for (let t = 0; t <= 11; t++) {
    const x = 4 + t;
    const y = 13 - t - Math.floor(t * t / 26);
    c.set(x, y, M.blade);
    c.set(x - 1, y + 1, M.core);
  }
  c.set(15, 0, M.blade);
  c.ellipse(4, 12, 1.7, 1.7, M.gold);
  c.line(3, 13, 1, 15, M.leather);
  c.set(0, 15, M.gold);
}
function dagger(c) {
  c.antiBand(13, 13, 6, 14, 1, 8, M.blade);
  c.antiBand(14, 14, 6, 14, 1, 8, M.core);
  c.antiBand(15, 15, 7, 14, 2, 8, M.iron);
  c.set(15, 0, M.blade);
  c.set(14, 1, M.blade);
  c.thickLine(5, 8, 10, 13, 1, M.gold);
  c.set(5, 8, M.iron);
  c.set(10, 13, M.iron);
  c.set(7, 10, M.gem);
  c.line(6, 10, 3, 13, M.leather);
  c.set(2, 14, M.gold);
  c.set(3, 14, M.gold);
}
function rapier(c) {
  c.antiBand(15, 15, 5, 15, 0, 10, M.blade);
  c.set(15, 0, M.blade);
  c.arc(5, 10, 2.6, Math.PI * 0.55, Math.PI * 1.45, M.gold, 1);
  c.set(5, 10, M.iron);
  c.line(4, 11, 2, 13, M.leather);
  c.set(1, 14, M.gold);
}
function scythe(c) {
  c.arc(8, 9, 6.6, Math.PI * 1.08, Math.PI * 1.92, M.blade, 1);
  c.arc(8, 9, 5.7, Math.PI * 1.12, Math.PI * 1.88, M.core, 1);
  c.thickLine(8, 8, 3, 14, 1, M.wood);
  c.set(6, 10, M.leather);
  c.set(5, 11, M.leather);
  c.set(2, 15, M.iron);
}
function witherBlade(c) {
  classicSword(c);
  swap(c.g, M.core, M.energy);
  c.antiBand(14, 14, 9, 13, 1, 5, M.core);
  c.ellipse(3, 6, 1.6, 1.6, M.bone);
  c.ellipse(9, 13, 1.6, 1.6, M.bone);
  c.set(3, 6, M.energy);
  c.set(9, 13, M.energy);
  c.set(2, 5, M.gold);
}
function bowLong(c) {
  c.arc(10, 8, 6.4, Math.PI * 0.62, Math.PI * 1.38, M.wood, 2);
  c.set(6, 13, M.gold);
  c.set(6, 3, M.gold);
  c.line(6, 3, 6, 13, M.string);
  c.thickLine(3, 7, 3, 9, 1, M.leather);
  c.set(4, 8, M.gold);
  c.set(3, 8, M.gem);
}
function bowShort(c) {
  c.arc(10, 8, 4.8, Math.PI * 0.6, Math.PI * 1.4, M.wood, 2);
  c.set(7, 12, M.gold);
  c.set(7, 4, M.gold);
  c.line(7, 4, 7, 12, M.string);
  c.set(5, 8, M.leather);
  c.set(6, 8, M.gold);
}
function bowHeavy(c) {
  c.arc(11, 8, 6.6, Math.PI * 0.6, Math.PI * 1.4, M.iron, 2);
  c.rect(5, 1, 3, 2, M.gold);
  c.rect(5, 13, 3, 2, M.gold);
  c.line(6, 3, 6, 13, M.string);
  c.thickLine(4, 6, 4, 10, 2, M.iron);
  c.set(4, 8, M.gem);
  c.set(3, 8, M.gold);
  c.set(8, 4, M.energy);
  c.set(8, 12, M.energy);
}
function crossbow(c) {
  c.thickLine(2, 8, 11, 8, 2, M.wood);
  c.set(2, 8, M.leather);
  c.set(3, 9, M.leather);
  c.set(5, 10, M.iron);
  c.line(10, 2, 12, 6, M.gold);
  c.line(12, 10, 10, 14, M.gold);
  c.line(10, 2, 8, 8, M.string);
  c.line(8, 8, 10, 14, M.string);
  c.line(6, 7, 13, 7, M.iron);
  c.set(14, 7, M.blade);
  c.set(13, 6, M.blade);
}
function wand(c) {
  c.thickLine(2, 14, 10, 6, 1, M.wood);
  c.set(4, 12, M.leather);
  c.set(5, 11, M.leather);
  c.line(10, 6, 12, 3, M.gold);
  c.line(10, 6, 13, 6, M.gold);
  c.ellipse(13, 3, 2.1, 2.1, M.energy);
  c.set(13, 3, M.gem);
  c.set(12, 2, M.gem);
}
function sceptre(c) {
  c.thickLine(3, 14, 8, 9, 1, M.wood);
  c.set(5, 12, M.leather);
  c.set(6, 11, M.leather);
  c.ellipse(11, 5, 3.2, 3.2, M.gold, false);
  c.ellipse(11, 5, 1.8, 1.8, M.gem);
  c.set(11, 5, M.energy);
  c.set(9, 2, M.gold);
  c.set(11, 1, M.gold);
  c.set(13, 2, M.gold);
  c.set(8, 9, M.iron);
}
function orbStaff(c) {
  c.thickLine(4, 15, 8, 10, 1, M.wood);
  c.set(6, 13, M.leather);
  c.set(7, 11, M.iron);
  c.ellipse(10, 6, 3.6, 3.6, M.energy);
  c.ellipse(10, 6, 2, 2, M.gem);
  c.set(9, 5, M.blade);
  c.arc(10, 6, 4.4, Math.PI * 0.15, Math.PI * 0.85, M.gold, 1);
}
function magicScythe(c) {
  c.thickLine(3, 15, 11, 6, 1, M.wood);
  c.set(5, 13, M.leather);
  c.arc(10, 7, 5.4, Math.PI * 1.05, Math.PI * 1.95, M.energy, 1);
  c.arc(10, 7, 4.6, Math.PI * 1.1, Math.PI * 1.9, M.blade, 1);
  c.set(11, 6, M.gold);
}
function pickaxe(c) {
  c.arc(8, 13, 7.4, Math.PI * 1.06, Math.PI * 1.94, M.iron, 2);
  c.arc(8, 13, 6.5, Math.PI * 1.1, Math.PI * 1.9, M.gold, 1);
  c.thickLine(8, 6, 8, 15, 1, M.wood);
  c.set(8, 11, M.leather);
  c.set(8, 12, M.leather);
  c.set(8, 7, M.iron);
}
function battleAxe(c) {
  c.poly(
    [
      [6, 2],
      [12, 3],
      [13, 7],
      [11, 11],
      [6, 10]
    ],
    M.iron
  );
  c.line(12, 3, 13, 7, M.blade);
  c.line(13, 7, 11, 11, M.blade);
  c.set(12, 5, M.gold);
  c.set(12, 9, M.gold);
  c.thickLine(6, 2, 3, 15, 1, M.wood);
  c.set(5, 8, M.leather);
  c.set(4, 11, M.leather);
}
function drill(c) {
  c.rect(5, 3, 6, 8, M.iron);
  c.rect(6, 4, 4, 2, M.gold);
  c.set(7, 7, M.gem);
  c.set(9, 5, M.energy);
  c.poly(
    [
      [6, 11],
      [10, 11],
      [8, 15]
    ],
    M.gold
  );
  c.set(8, 14, M.blade);
  c.rect(3, 6, 2, 4, M.leather);
  c.rect(11, 6, 2, 3, M.iron);
  c.set(12, 5, M.energy);
}
function hoe(c) {
  c.rect(6, 3, 8, 2, M.gold);
  c.rect(6, 5, 8, 1, M.iron);
  c.set(13, 3, M.blade);
  c.thickLine(7, 4, 3, 15, 1, M.wood);
  c.set(5, 9, M.leather);
  c.set(4, 12, M.leather);
}
function fishingRod(c) {
  c.thickLine(2, 14, 12, 4, 1, M.wood);
  c.set(3, 13, M.leather);
  c.set(4, 12, M.leather);
  c.ellipse(6, 10, 1.4, 1.4, M.gold);
  c.line(12, 4, 14, 9, M.string);
  c.line(14, 9, 12, 13, M.string);
  c.set(12, 14, M.iron);
  c.set(11, 13, M.gem);
}
function grapplingHook(c) {
  c.line(2, 14, 9, 7, M.string);
  c.set(3, 13, M.leather);
  c.set(4, 12, M.leather);
  c.ellipse(10, 6, 1.8, 1.8, M.iron);
  c.line(10, 5, 8, 2, M.gold);
  c.line(11, 5, 14, 3, M.gold);
  c.line(11, 7, 14, 9, M.gold);
  c.set(8, 2, M.blade);
  c.set(14, 3, M.blade);
  c.set(14, 9, M.blade);
}
function gauntlet(c) {
  c.poly(
    [
      [3, 6],
      [12, 4],
      [13, 10],
      [9, 13],
      [4, 12]
    ],
    M.iron
  );
  c.line(3, 6, 12, 4, M.gold);
  c.set(5, 3, M.gold);
  c.set(8, 2, M.gold);
  c.set(11, 2, M.gold);
  c.ellipse(8, 8, 1.8, 1.8, M.gem);
  c.set(8, 8, M.energy);
  c.rect(4, 12, 5, 2, M.leather);
}
function helmFull(c) {
  c.ellipse(8, 7, 5, 5, M.iron);
  c.line(8, 1, 8, 4, M.gold);
  c.set(7, 2, M.gold);
  c.set(9, 2, M.gold);
  c.rect(3, 7, 10, 1, M.gold);
  c.rect(4, 8, 8, 3, ".");
  c.set(5, 9, M.energy);
  c.set(10, 9, M.energy);
  c.rect(3, 8, 1, 4, M.iron);
  c.rect(12, 8, 1, 4, M.iron);
  c.rect(5, 12, 6, 2, M.iron);
  c.set(8, 12, M.gold);
}
function helmHorned(c) {
  c.ellipse(8, 8, 5, 4.4, M.iron);
  c.line(4, 5, 1, 1, M.bone);
  c.line(12, 5, 15, 1, M.bone);
  c.set(2, 2, M.gold);
  c.set(14, 2, M.gold);
  c.set(6, 7, M.energy);
  c.set(10, 7, M.energy);
  c.rect(6, 10, 4, 2, M.gold);
  c.set(8, 3, M.gold);
  c.set(7, 4, M.iron);
  c.set(9, 4, M.iron);
  c.rect(4, 12, 8, 1, M.iron);
}
function helmHood(c) {
  c.poly(
    [
      [3, 4],
      [8, 1],
      [13, 4],
      [14, 12],
      [11, 14],
      [5, 14],
      [2, 12]
    ],
    M.cloth
  );
  c.poly(
    [
      [5, 6],
      [11, 6],
      [11, 11],
      [8, 13],
      [5, 11]
    ],
    "."
  );
  c.set(6, 8, M.energy);
  c.set(10, 8, M.energy);
  c.line(4, 5, 8, 3, M.leather);
  c.line(12, 5, 8, 3, M.leather);
  c.set(8, 4, M.gold);
}
function helmCrown(c) {
  c.poly(
    [
      [3, 9],
      [4, 4],
      [6, 7],
      [8, 2],
      [10, 7],
      [12, 4],
      [13, 9]
    ],
    M.gold
  );
  c.rect(3, 9, 11, 3, M.gold);
  c.rect(3, 11, 11, 1, M.iron);
  c.set(5, 10, M.gem);
  c.set(8, 10, M.gem);
  c.set(11, 10, M.gem);
  c.set(8, 3, M.energy);
}
function chestPlate2(c) {
  c.poly(
    [
      [4, 4],
      [12, 4],
      [13, 13],
      [9, 15],
      [7, 15],
      [3, 13]
    ],
    M.iron
  );
  c.ellipse(3, 5, 2.2, 1.8, M.gold);
  c.ellipse(13, 5, 2.2, 1.8, M.gold);
  c.rect(6, 2, 4, 3, M.gold);
  c.line(8, 5, 8, 14, M.gold);
  c.set(8, 7, M.gem);
  c.rect(4, 13, 9, 1, M.gold);
  c.set(5, 9, M.leather);
  c.set(11, 9, M.leather);
}
function chestRobe(c) {
  c.poly(
    [
      [5, 2],
      [11, 2],
      [14, 15],
      [2, 15]
    ],
    M.cloth
  );
  c.line(5, 2, 3, 15, M.gold);
  c.line(11, 2, 13, 15, M.gold);
  c.set(8, 3, M.gem);
  c.set(8, 6, M.rune);
  c.set(7, 9, M.rune);
  c.set(9, 9, M.rune);
  c.set(8, 12, M.rune);
  c.rect(6, 1, 4, 2, M.leather);
}
function chestLight(c) {
  c.poly(
    [
      [4, 3],
      [12, 3],
      [12, 14],
      [4, 14]
    ],
    M.leather
  );
  c.line(5, 3, 11, 13, M.iron);
  c.line(11, 3, 5, 13, M.iron);
  c.set(8, 8, M.gold);
  c.rect(4, 3, 8, 1, M.iron);
  c.rect(4, 13, 8, 1, M.iron);
  c.set(6, 5, M.gold);
  c.set(10, 11, M.gold);
}
function leggings(c) {
  c.rect(3, 2, 5, 12, M.iron);
  c.rect(9, 2, 5, 12, M.iron);
  c.rect(3, 1, 11, 2, M.gold);
  c.rect(4, 7, 4, 2, M.gold);
  c.rect(10, 7, 4, 2, M.gold);
  c.rect(3, 13, 5, 1, M.leather);
  c.rect(9, 13, 5, 1, M.leather);
  c.set(5, 4, M.gem);
  c.set(11, 4, M.gem);
}
function boots(c) {
  c.poly(
    [
      [2, 5],
      [7, 5],
      [7, 11],
      [8, 12],
      [8, 14],
      [2, 14]
    ],
    M.iron
  );
  c.poly(
    [
      [9, 5],
      [14, 5],
      [14, 14],
      [8, 14],
      [8, 12],
      [9, 11]
    ],
    M.iron
  );
  c.rect(2, 13, 6, 2, M.gold);
  c.rect(9, 13, 6, 2, M.gold);
  c.rect(2, 4, 5, 1, M.leather);
  c.rect(9, 4, 5, 1, M.leather);
  c.set(4, 8, M.gem);
  c.set(12, 8, M.gem);
}
function talisman(c) {
  c.ellipse(8, 9, 4.6, 4.6, M.gold, false);
  c.ellipse(8, 9, 3.4, 3.4, M.iron, false);
  c.ellipse(8, 4, 1.9, 1.9, M.gem);
  c.set(8, 9, M.energy);
  c.set(5, 6, M.energy);
  c.set(11, 12, M.energy);
  c.set(6, 2, M.gold);
  c.set(10, 2, M.gold);
}
function ring(c) {
  c.ellipse(8, 10, 4.2, 4.2, M.gold, false);
  c.ellipse(8, 10, 3.2, 3.2, M.iron, false);
  c.poly(
    [
      [6, 2],
      [10, 2],
      [11, 5],
      [8, 7],
      [5, 5]
    ],
    M.gem
  );
  c.set(7, 3, M.energy);
  c.set(5, 12, M.energy);
}
function artifact(c) {
  c.ellipse(8, 8, 6, 6, M.iron);
  c.ellipse(8, 8, 4.4, 4.4, M.gold);
  c.ellipse(8, 8, 2.6, 2.6, M.gem);
  c.set(8, 8, M.energy);
  c.set(8, 2, M.rune);
  c.set(8, 14, M.rune);
  c.set(2, 8, M.rune);
  c.set(14, 8, M.rune);
  c.set(3, 3, M.gold);
  c.set(13, 13, M.gold);
}
function powerOrb(c) {
  c.ellipse(8, 8, 5.4, 5.4, M.energy);
  c.ellipse(8, 8, 3.4, 3.4, M.gem);
  c.set(6, 6, M.blade);
  c.set(7, 5, M.blade);
  c.arc(8, 8, 5.9, Math.PI * 0.1, Math.PI * 0.9, M.gold, 1);
  c.rect(6, 14, 5, 1, M.iron);
  c.set(11, 4, M.energy);
  c.set(4, 11, M.energy);
}
function book(c) {
  c.rect(2, 3, 12, 11, M.leather);
  c.rect(4, 4, 9, 9, M.bone);
  c.rect(2, 3, 2, 11, M.iron);
  c.line(6, 6, 11, 6, M.rune);
  c.line(6, 8, 11, 8, M.rune);
  c.line(6, 10, 9, 10, M.rune);
  c.rect(12, 7, 2, 3, M.gold);
  c.set(8, 5, M.gem);
}
function potion(c) {
  c.rect(7, 2, 3, 2, M.wood);
  c.rect(7, 4, 3, 3, M.bone);
  c.ellipse(8, 11, 4.2, 4.2, M.energy);
  c.ellipse(8, 12, 3.2, 3, M.gem);
  c.set(6, 9, M.blade);
  c.set(7, 13, M.energy);
  c.set(10, 10, M.energy);
  c.rect(6, 6, 1, 2, M.bone);
  c.rect(10, 6, 1, 2, M.bone);
}
function crystalShard(c) {
  c.poly(
    [
      [8, 1],
      [12, 6],
      [10, 15],
      [6, 15],
      [4, 6]
    ],
    M.gem
  );
  c.line(8, 1, 8, 15, M.energy);
  c.set(6, 5, M.blade);
  c.set(5, 7, M.blade);
  c.poly(
    [
      [12, 8],
      [15, 11],
      [13, 15],
      [11, 14]
    ],
    M.gem
  );
  c.set(13, 11, M.energy);
}
function scroll(c) {
  c.rect(3, 4, 10, 9, M.bone);
  c.rect(2, 2, 12, 2, M.leather);
  c.rect(2, 13, 12, 2, M.leather);
  c.line(5, 6, 11, 6, M.rune);
  c.line(5, 8, 11, 8, M.rune);
  c.line(5, 10, 9, 10, M.rune);
  c.ellipse(8, 11, 1.6, 1.6, M.gold);
  c.set(8, 11, M.gem);
}
function petDragon(c) {
  c.poly(
    [
      [7, 8],
      [2, 2],
      [4, 9]
    ],
    M.fur
  );
  c.poly(
    [
      [9, 8],
      [14, 2],
      [12, 9]
    ],
    M.fur
  );
  c.ellipse(8, 10, 4, 3, M.fur);
  c.ellipse(12, 6, 2.4, 2.1, M.fur);
  c.set(11, 5, M.energy);
  c.set(13, 5, M.energy);
  c.line(10, 3, 9, 1, M.bone);
  c.line(14, 4, 15, 2, M.bone);
  c.poly(
    [
      [5, 11],
      [2, 14],
      [6, 13]
    ],
    M.fur
  );
  c.rect(7, 12, 3, 1, M.leather);
  c.set(3, 3, M.gold);
  c.set(13, 3, M.gold);
}
function petQuadruped(c) {
  c.ellipse(8, 10, 5, 3, M.fur);
  c.ellipse(12, 6, 2.6, 2.3, M.fur);
  c.poly(
    [
      [10, 4],
      [11, 2],
      [12, 4]
    ],
    M.fur
  );
  c.poly(
    [
      [13, 4],
      [14, 2],
      [15, 4]
    ],
    M.fur
  );
  c.set(11, 6, M.energy);
  c.set(14, 6, M.energy);
  c.rect(4, 12, 2, 3, M.fur);
  c.rect(7, 12, 2, 3, M.fur);
  c.rect(11, 11, 2, 3, M.fur);
  c.line(3, 9, 1, 6, M.fur);
  c.set(6, 9, M.leather);
  c.set(9, 10, M.leather);
  c.set(12, 8, M.leather);
}
function petBird(c) {
  c.poly(
    [
      [7, 9],
      [1, 3],
      [3, 10]
    ],
    M.fur
  );
  c.poly(
    [
      [9, 9],
      [15, 3],
      [13, 10]
    ],
    M.fur
  );
  c.ellipse(8, 10, 3.4, 3, M.fur);
  c.ellipse(11, 6, 2.1, 1.9, M.fur);
  c.poly(
    [
      [13, 6],
      [15, 7],
      [13, 8]
    ],
    M.gold
  );
  c.set(11, 5, M.energy);
  c.set(10, 3, M.energy);
  c.set(12, 3, M.energy);
  c.line(6, 12, 3, 15, M.fur);
  c.set(4, 14, M.gold);
}
function petBee(c) {
  c.ellipse(6, 4, 3.2, 1.7, M.string);
  c.ellipse(11, 4, 3.2, 1.7, M.string);
  c.ellipse(8, 10, 4.2, 3.2, M.fur);
  c.set(6, 9, M.leather);
  c.set(6, 10, M.leather);
  c.set(9, 9, M.leather);
  c.set(9, 10, M.leather);
  c.set(9, 11, M.leather);
  c.ellipse(12, 8, 2.1, 2, M.fur);
  c.set(12, 7, M.energy);
  c.set(14, 8, M.energy);
  c.set(3, 10, M.gold);
  c.line(6, 13, 5, 15, M.iron);
  c.line(10, 13, 11, 15, M.iron);
}
function petWhale(c) {
  c.ellipse(8, 9, 6, 4, M.fur);
  c.poly(
    [
      [2, 6],
      [0, 9],
      [2, 12],
      [4, 9]
    ],
    M.fur
  );
  c.poly(
    [
      [7, 5],
      [9, 2],
      [11, 5]
    ],
    M.fur
  );
  c.arc(8, 10, 5, Math.PI * 0.15, Math.PI * 0.85, M.leather, 2);
  c.set(11, 8, M.energy);
  c.set(13, 10, M.iron);
  c.set(12, 4, M.energy);
}
function minion(c) {
  c.rect(5, 2, 6, 5, M.fur);
  c.set(6, 4, M.energy);
  c.set(9, 4, M.energy);
  c.rect(7, 6, 2, 1, M.iron);
  c.rect(4, 7, 8, 6, M.leather);
  c.rect(4, 10, 8, 1, M.iron);
  c.rect(2, 8, 2, 4, M.fur);
  c.rect(12, 8, 2, 4, M.fur);
  c.rect(5, 13, 2, 2, M.iron);
  c.rect(9, 13, 2, 2, M.iron);
  c.set(8, 8, M.gold);
  c.line(13, 7, 15, 5, M.gold);
}
function chainsawSword(c) {
  c.antiBand(11, 11, 2, 15, 0, 13, M.blade);
  c.antiBand(12, 13, 2, 15, 0, 13, M.core);
  c.antiBand(14, 14, 3, 15, 1, 13, M.iron);
  for (let t = 2; t <= 12; t += 2) {
    c.set(15 - t, t - 1, M.blade);
  }
  c.rect(2, 8, 4, 4, M.iron);
  c.set(3, 9, M.gold);
  c.set(4, 10, M.energy);
  c.line(2, 12, 0, 14, M.leather);
  c.set(0, 15, M.iron);
}
function pistonSword(c) {
  c.antiBand(12, 12, 3, 15, 0, 12, M.blade);
  c.antiBand(13, 13, 3, 15, 0, 12, M.core);
  c.antiBand(14, 15, 4, 15, 1, 12, M.iron);
  c.set(15, 0, M.blade);
  c.rect(5, 7, 3, 3, M.gold);
  c.set(6, 8, M.energy);
  c.thickLine(1, 9, 7, 15, 1, M.iron);
  c.line(3, 12, 1, 14, M.leather);
  c.set(0, 15, M.gold);
}
function railgunBow(c) {
  c.line(2, 8, 14, 8, M.iron);
  c.line(2, 6, 14, 6, M.gold);
  c.line(2, 10, 14, 10, M.gold);
  c.set(6, 7, M.energy);
  c.set(10, 7, M.energy);
  c.set(14, 7, M.blade);
  c.line(3, 3, 3, 13, M.string);
  c.rect(1, 7, 2, 3, M.leather);
  c.set(2, 8, M.iron);
}
function gyroStaff(c) {
  c.thickLine(3, 14, 9, 8, 1, M.wood);
  c.ellipse(11, 5, 4, 4, M.gold, false);
  c.ellipse(11, 5, 2.5, 2.5, M.iron, false);
  c.set(11, 5, M.energy);
  c.set(11, 1, M.gold);
  c.set(15, 5, M.gold);
  c.set(11, 9, M.gold);
  c.set(7, 5, M.gold);
  c.set(5, 12, M.leather);
}
function pilebunkerTool(c) {
  c.poly([[3, 4], [12, 4], [14, 12], [4, 14]], M.iron);
  c.rect(6, 6, 5, 5, M.core);
  c.set(8, 8, M.energy);
  c.thickLine(7, 0, 9, 5, 2, M.blade);
  c.rect(4, 12, 8, 3, M.leather);
  c.set(4, 12, M.gold);
  c.set(11, 12, M.gold);
}
function wrenchTool(c) {
  c.thickLine(2, 14, 10, 6, 2, M.iron);
  c.poly([[9, 2], [14, 2], [15, 8], [11, 9], [7, 5]], M.gold);
  c.rect(11, 4, 3, 3, ".");
  c.set(8, 7, M.iron);
  c.set(4, 11, M.leather);
  c.set(1, 15, M.iron);
}
var TEMPLATE_DEFS = [
  { id: "sword_chainsaw", name: "Chainsaw Sword", kind: "weapon", build: chainsawSword },
  { id: "sword_piston", name: "Piston Sword", kind: "weapon", build: pistonSword },
  { id: "bow_railgun", name: "Railgun Bow", kind: "ranged", build: railgunBow },
  { id: "staff_gyro", name: "Gyrokinetic Wand", kind: "staff", build: gyroStaff },
  { id: "tool_pilebunker", name: "Steam Pilebunker", kind: "tool", build: pilebunkerTool },
  { id: "tool_wrench", name: "Artificer Wrench", kind: "tool", build: wrenchTool },
  { id: "sword_long", name: "Longsword", kind: "weapon", build: classicSword },
  { id: "sword_broad", name: "Broadsword", kind: "weapon", build: broadSword },
  { id: "sword_great", name: "Greatsword", kind: "weapon", build: greatSword },
  { id: "sword_katana", name: "Katana", kind: "weapon", build: katana },
  { id: "sword_dagger", name: "Dagger", kind: "weapon", build: dagger },
  { id: "sword_rapier", name: "Rapier", kind: "weapon", build: rapier },
  { id: "sword_scythe", name: "Scythe", kind: "weapon", build: scythe },
  { id: "sword_wither", name: "Wither Blade", kind: "weapon", build: witherBlade },
  { id: "bow_long", name: "Longbow", kind: "ranged", build: bowLong },
  { id: "bow_short", name: "Shortbow", kind: "ranged", build: bowShort },
  { id: "bow_heavy", name: "Heavy Bow", kind: "ranged", build: bowHeavy },
  { id: "bow_crossbow", name: "Crossbow", kind: "ranged", build: crossbow },
  { id: "staff_wand", name: "Wand", kind: "staff", build: wand },
  { id: "staff_sceptre", name: "Sceptre", kind: "staff", build: sceptre },
  { id: "staff_orb", name: "Orb Staff", kind: "staff", build: orbStaff },
  { id: "staff_scythe", name: "Magic Scythe", kind: "staff", build: magicScythe },
  { id: "tool_pickaxe", name: "Pickaxe", kind: "tool", build: pickaxe },
  { id: "tool_axe", name: "Battle Axe", kind: "tool", build: battleAxe },
  { id: "tool_drill", name: "Drill", kind: "tool", build: drill },
  { id: "tool_hoe", name: "Hoe", kind: "tool", build: hoe },
  { id: "tool_rod", name: "Fishing Rod", kind: "tool", build: fishingRod },
  { id: "tool_hook", name: "Grappling Hook", kind: "tool", build: grapplingHook },
  { id: "tool_gauntlet", name: "Gauntlet", kind: "tool", build: gauntlet },
  { id: "armor_helm_full", name: "Full Helm", kind: "armor", build: helmFull },
  { id: "armor_helm_horn", name: "Horned Helm", kind: "armor", build: helmHorned },
  { id: "armor_helm_hood", name: "Hood", kind: "armor", build: helmHood },
  { id: "armor_helm_crown", name: "Crown", kind: "armor", build: helmCrown },
  { id: "armor_chest_plate", name: "Chestplate", kind: "armor", build: chestPlate2 },
  { id: "armor_chest_robe", name: "Robe", kind: "armor", build: chestRobe },
  { id: "armor_chest_light", name: "Light Chest", kind: "armor", build: chestLight },
  { id: "armor_legs", name: "Leggings", kind: "armor", build: leggings },
  { id: "armor_boots", name: "Boots", kind: "armor", build: boots },
  { id: "acc_talisman", name: "Talisman", kind: "accessory", build: talisman },
  { id: "acc_ring", name: "Ring", kind: "accessory", build: ring },
  { id: "acc_artifact", name: "Artifact", kind: "accessory", build: artifact },
  { id: "acc_orb", name: "Power Orb", kind: "accessory", build: powerOrb },
  { id: "acc_book", name: "Book", kind: "accessory", build: book },
  { id: "acc_potion", name: "Potion", kind: "accessory", build: potion },
  { id: "acc_crystal", name: "Crystal", kind: "accessory", build: crystalShard },
  { id: "acc_scroll", name: "Scroll", kind: "accessory", build: scroll },
  { id: "pet_dragon", name: "Dragon Pet", kind: "creature", build: petDragon },
  { id: "pet_quadruped", name: "Beast Pet", kind: "creature", build: petQuadruped },
  { id: "pet_bird", name: "Bird Pet", kind: "creature", build: petBird },
  { id: "pet_bee", name: "Insect Pet", kind: "creature", build: petBee },
  { id: "pet_whale", name: "Aquatic Pet", kind: "creature", build: petWhale },
  { id: "minion_base", name: "Minion", kind: "creature", build: minion }
];
var cache2 = /* @__PURE__ */ new Map();
function getTemplate(id, size = 16) {
  const def = TEMPLATE_DEFS.find((t) => t.id === id) ?? TEMPLATE_DEFS[0];
  const key = `${def.id}@${size}`;
  let g = cache2.get(key);
  if (!g) {
    const c = makeCtx(size);
    def.build(c);
    g = c.g;
    validateGrid(g, def.id, size);
    cache2.set(key, g);
  }
  return g.map((row) => [...row]);
}
function templateIds() {
  return TEMPLATE_DEFS.map((t) => t.id);
}

// ../skyblock/hypixel-skyblock-texture-generator (1)/src/lib/generate.ts
var KNOWN_TEMPLATES = /* @__PURE__ */ new Set([...templateIds(), ...NATIVE64_TEMPLATE_IDS]);
function safeTemplatesFor(item) {
  const valid = item.templates.filter((id) => KNOWN_TEMPLATES.has(id));
  return valid.length ? valid : [templateIds()[0]];
}
var DEFAULT_SIGNATURE = "reborn_clean";
var DEFAULT_PALETTE = "reborn_flare";
function clone(grid) {
  return grid.map((row) => [...row]);
}
function stamp(g, x, y, s, ch, allowNew = false) {
  const n = g.length;
  for (let j = 0; j < s; j++)
    for (let i = 0; i < s; i++) {
      const xx = x + i;
      const yy = y + j;
      if (yy < 0 || yy >= n || xx < 0 || xx >= n) continue;
      if (!allowNew && g[yy][xx] === ".") continue;
      g[yy][xx] = ch;
    }
}
function flip(grid) {
  return grid.map((row) => [...row].reverse());
}
function mutate(grid, rng, chaos, item, scale) {
  const g = clone(grid);
  const n = g.length;
  const t = chaos / 100;
  const field = computeField(g);
  const interior = [];
  const boundary = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (!field.mask[i]) continue;
      if (field.dist[i] === 0) boundary.push([x, y]);
      else interior.push([x, y]);
    }
  if (!interior.length && !boundary.length) return g;
  const gems = Math.round(t * 3.2);
  for (let i = 0; i < gems; i++) {
    const pool = interior.length ? interior : boundary;
    const [x, y] = rngPick(rng, pool);
    stamp(g, x - (scale >> 1), y - (scale >> 1), scale, "g");
    if (rngBool(rng, 0.35)) {
      const ox = x + rngInt(rng, -1, 1) * scale;
      const oy = y + rngInt(rng, -1, 1) * scale;
      if (oy >= 0 && oy < n && ox >= 0 && ox < n && g[oy][ox] !== ".") {
        stamp(g, ox - (scale >> 1), oy - (scale >> 1), scale, "g");
      }
    }
  }
  if (t > 0.3 && (item.category === "sword" || item.category === "staff" || item.category === "bow")) {
    const veins = 1 + Math.floor(t * 3);
    for (let v = 0; v < veins; v++) {
      let [x, y] = rngPick(rng, interior.length ? interior : boundary);
      const ch = rngBool(rng, 0.6) ? "e" : "r";
      const steps = 4;
      for (let step = 0; step < steps; step++) {
        if (grid[y]?.[x] !== void 0 && grid[y][x] !== ".") {
          stamp(g, x - (scale >> 1), y - (scale >> 1), scale, ch);
        }
        x = Math.max(0, Math.min(n - scale, x + rngInt(rng, -1, 1) * scale));
        y = Math.max(0, Math.min(n - scale, y + rngInt(rng, -1, 1) * scale));
      }
    }
  }
  if (t > 0.5 && item.category === "sword") {
    const spikes = Math.round((t - 0.5) * 5);
    for (let s = 0; s < spikes; s++) {
      const [x, y] = rngPick(rng, boundary);
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ];
      for (const [dx, dy] of dirs) {
        const ox = x + dx * scale;
        const oy = y + dy * scale;
        if (ox < 0 || oy < 0 || ox >= n || oy >= n) continue;
        if (g[oy][ox] !== ".") continue;
        stamp(g, ox - (scale >> 1), oy - (scale >> 1), scale, rngBool(rng, 0.5) ? "M" : "b", true);
        break;
      }
    }
  }
  if (t > 0.25 && (item.category === "armor" || item.category === "accessory")) {
    const trims = Math.round(t * 4);
    for (let i = 0; i < trims; i++) {
      const [x, y] = rngPick(rng, boundary);
      if (rngBool(rng, 0.6)) stamp(g, x - (scale >> 1), y - (scale >> 1), scale, "M");
    }
  }
  if (t > 0.65 && rngBool(rng, 0.5)) {
    const from = rngPick(rng, ["m", "w", "l", "c", "k"]);
    const to = rngPick(rng, ["M", "g", "e", "b"]);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) if (g[y][x] === from && rngBool(rng, 0.4)) stamp(g, x, y, scale, to);
  }
  return g;
}
function glowColorFor(rarity, pal, hueShift) {
  const r = RARITIES[rarity] ?? RARITIES.legendary;
  const mixed = [
    hexToRgb(r.glow)[0] * 0.6 + pal.energy[0] * 0.4,
    hexToRgb(r.glow)[1] * 0.6 + pal.energy[1] * 0.4,
    hexToRgb(r.glow)[2] * 0.6 + pal.energy[2] * 0.4
  ];
  const [h, s, l] = [0, 0, 0];
  void h;
  void s;
  void l;
  return mixed.map((v) => Math.max(0, Math.min(255, v)));
}
function generateTexture(input) {
  const item = CATALOG_MAP[input.itemId];
  if (!item) throw new Error(`Unknown item: ${input.itemId}`);
  const shapeRng = mulberry32(input.seed >>> 0);
  const paletteMix = input.styleMix?.length ? input.styleMix : [{ id: DEFAULT_PALETTE, weight: 1 }];
  const signatureMix = input.signatureMix?.length ? input.signatureMix : [{ id: DEFAULT_SIGNATURE, weight: 1 }];
  const sig = mixSignatures(signatureMix);
  const pal = mixPalettes(paletteMix);
  const templates = safeTemplatesFor(item);
  const templateId = input.templateId && templates.includes(input.templateId) ? input.templateId : rngPick(shapeRng, templates);
  const resolution = input.resolution === 64 ? 64 : input.resolution === 32 ? 32 : 16;
  const native64 = resolution === 64;
  let grid = native64 ? getNative64Template(templateId) : getTemplate(templateId, resolution);
  const chaos = Math.round(input.chaos * (1 - sig.clean * 0.45));
  if (rngBool(shapeRng, 0.2 + chaos / 400)) grid = flip(grid);
  const featureScale = native64 ? 2 : resolution / 16;
  grid = mutate(grid, shapeRng, chaos, item, featureScale);
  if (native64) {
    grid = applyNative64Essence(grid, {
      signatureIds: sig.ids,
      ornament: sig.ornament,
      clean: sig.clean,
      pseudo3d: sig.pseudo3d,
      seed: input.seed
    });
  }
  const cfg = {
    sig,
    pal,
    glowColor: glowColorFor(input.rarity, pal, input.hueShift),
    hueShift: input.hueShift,
    glow: input.glow,
    metallic: input.metallic,
    chaos,
    seed: input.seed,
    detailScale: resolution / 16
  };
  const shaded = shadeGrid(grid, cfg);
  const rarity = RARITIES[input.rarity] ?? RARITIES.legendary;
  void sparklePass;
  void rarity;
  return {
    width: shaded.width,
    height: shaded.height,
    pixels: shaded.pixels,
    templateId,
    renderMode: native64 ? "native64" : resolution === 32 ? "refined32" : "classic16",
    paletteHex: {
      metal: toHex(pal.metal),
      gold: toHex(pal.gold),
      gem: toHex(pal.gem),
      wood: toHex(pal.wood),
      leather: toHex(pal.leather),
      cloth: toHex(pal.cloth),
      energy: toHex(pal.energy),
      accent: toHex(pal.accent),
      bone: toHex(pal.bone),
      outline: toHex(pal.outline),
      fur: toHex(pal.fur)
    },
    signatureIds: sig.ids,
    paletteIds: pal.ids
  };
}
function toHex(rgb) {
  return `#${rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}

// ../skyblock/hypixel-skyblock-texture-generator (1)/src/lib/png.ts
import { deflateSync, inflateSync } from "node:zlib";
var CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(buf) {
  let c = 4294967295;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 255] ^ c >>> 8;
  }
  return (c ^ 4294967295) >>> 0;
}
function u32(n) {
  return new Uint8Array([n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255]);
}
function chunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const crcInput = new Uint8Array(typeBytes.length + data.length);
  crcInput.set(typeBytes, 0);
  crcInput.set(data, typeBytes.length);
  const crc = u32(crc32(crcInput));
  const out = new Uint8Array(4 + 4 + data.length + 4);
  out.set(u32(data.length), 0);
  out.set(typeBytes, 4);
  out.set(data, 8);
  out.set(crc, 8 + data.length);
  return out;
}
function encodePng(width, height, rgba) {
  const stride = width * 4 + 1;
  const raw = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = y * stride + 1 + x * 4;
      raw[di] = clamp(rgba[si] ?? 0);
      raw[di + 1] = clamp(rgba[si + 1] ?? 0);
      raw[di + 2] = clamp(rgba[si + 2] ?? 0);
      raw[di + 3] = clamp(rgba[si + 3] ?? 0);
    }
  }
  const compressed = deflateSync(raw, { level: 9 });
  const ihdr = new Uint8Array(13);
  ihdr.set(u32(width), 0);
  ihdr.set(u32(height), 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", new Uint8Array())];
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

// src/argv.ts
function cmd() {
  return process.env.MCASSET_CMD ?? "";
}
function args() {
  try {
    const parsed = JSON.parse(process.env.MCASSET_ARGS ?? "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
function arg(name, fallback) {
  const list = args();
  const i = list.indexOf(`--${name}`);
  if (i >= 0 && i + 1 < list.length) return list[i + 1];
  return fallback;
}
function fail(message) {
  console.error(message);
  process.exit(1);
}

// src/sky.ts
var command = cmd();
if (command === "items") {
  for (const item of CATALOG) console.log(`${item.id}	${item.rarity}	${item.name}`);
} else if (command === "render") {
  const out = arg("out") ?? fail("usage: sky:render --item <id> [--seed 7] [--res 16] --out file.png");
  const item = getItem(arg("item") ?? "") ?? fail(`unknown item: ${arg("item")} (see sky:items)`);
  const res = arg("res", "16") === "64" ? 64 : arg("res") === "32" ? 32 : 16;
  const generated = generateTexture({
    itemId: item.id,
    resolution: res,
    seed: Number(arg("seed", "1")),
    styleMix: [{ id: DEFAULT_PALETTE, weight: 1 }],
    signatureMix: [{ id: DEFAULT_SIGNATURE, weight: 1 }],
    rarity: isRarity(arg("rarity", "")) ? arg("rarity") : item.rarity,
    hueShift: 0,
    glow: 40,
    metallic: 45,
    chaos: 25
  });
  writeFileSync(out, encodePng(generated.width, generated.height, generated.pixels));
  console.log(`wrote ${out} (${generated.width}x${generated.height}, item=${item.id}, mode=${generated.renderMode})`);
} else {
  console.log(`sky commands: items | render --item <id> [--seed 7] [--res 16|32|64] [--rarity <id>] --out file.png`);
}
