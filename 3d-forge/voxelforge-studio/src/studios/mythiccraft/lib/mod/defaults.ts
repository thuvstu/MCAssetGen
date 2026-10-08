import { defaultParams, findCondition, findMechanic, findTargeter } from "./catalog";
import type { ConditionRef, ModBlock, ModItem, ModMeta, ModMob, ModProject, ModRecipe, Skill, SkillLine } from "./types";
import { uid } from "./types";

export function defaultMeta(name = "My Skill Mod"): ModMeta {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "mymod";
  const modId = /^[a-z]/.test(slug) ? slug.slice(0, 40) : "mod_" + slug.slice(0, 36);
  const pascal = modId.split("_").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("") || "MyMod";
  return {
    modId,
    name,
    version: "1.0.0",
    packageName: `com.example.${modId.replace(/_/g, "")}`,
    mainClass: pascal.match(/^[A-Z]/) ? pascal : "MyMod",
    authors: "You",
    description: "MythicCraft Studio で作成したスキルMod",
    minecraftVersion: "1.21.1",
    yarnMappings: "1.21.1+build.3",
    loaderVersion: "0.16.14",
    fabricVersion: "0.116.17+1.21.1",
    fabricKotlinVersion: "1.13.3+kotlin.2.1.21",
    kotlinVersion: "2.1.21",
    loomVersion: "1.11.8",
    gradleVersion: "8.14.3",
  };
}

export function newItem(registryName = "new_item"): ModItem {
  return {
    id: uid(), registryName, displayName: "New Item", kind: "basic", maxCount: 64, material: "IRON",
    attackDamage: 3, attackSpeed: -2.4, nutrition: 4, saturation: 0.3, alwaysEdible: false, fireproof: false,
    rarity: "COMMON", glint: false, tooltip: "", useCooldown: 0, triggers: [],
  };
}

export function newBlock(registryName = "new_block"): ModBlock {
  return {
    id: uid(), registryName, displayName: "New Block", hardness: 1.5, resistance: 6, sound: "STONE", luminance: 0,
    requiresTool: false, tool: "pickaxe", toolLevel: "any", dropsSelf: true, triggers: [],
  };
}

export function newLine(mechanic = "damage", targeter = "Target"): SkillLine {
  const m = findMechanic(mechanic)!;
  const t = findTargeter(targeter)!;
  return { id: uid(), mechanic: m.id, params: defaultParams(m.params), targeter: t.id, targeterParams: defaultParams(t.params), conditions: [] };
}

export function newCondition(type = "chance"): ConditionRef {
  const c = findCondition(type)!;
  return { id: uid(), type: c.id, params: defaultParams(c.params) };
}

export function newMob(name = "NewMob"): ModMob {
  return {
    id: uid(), name, displayName: "§c" + name, baseType: "minecraft:zombie", health: 40, damage: 6, speedMultiplier: 1,
    armor: 0, knockbackResistance: 0, showName: true, glowing: false, persistent: true, silent: false,
    equipment: { mainhand: "", offhand: "", head: "", chest: "", legs: "", feet: "" },
    effects: [], drops: [], xp: 10, naturalSpawn: false, spawnChance: 0.05, triggers: [],
  };
}

export function newRecipe(name = "new_recipe", result = "minecraft:diamond"): ModRecipe {
  return { id: uid(), name, type: "shaped", grid: ["", "", "", "", "", "", "", "", ""], input: "minecraft:iron_ingot", result, count: 1, experience: 0.1, cookingTime: 200 };
}

export function newSkill(name = "new_skill"): Skill {
  return { id: uid(), name, description: "", cooldown: 0, conditions: [], lines: [newLine("message", "Self")], imports: "" };
}

function line(mechanic: string, params: Record<string, string | number | boolean>, targeter: string, tp: Record<string, number> = {}, conds: ConditionRef[] = []): SkillLine {
  const l = newLine(mechanic, targeter);
  return { ...l, params: { ...l.params, ...params }, targeterParams: { ...l.targeterParams, ...tp }, conditions: conds };
}

export function emptyProject(name: string): ModProject {
  return { meta: defaultMeta(name), items: [], blocks: [], skills: [], mobSkills: [], events: [], commands: [], mobs: [], recipes: [] };
}

export function sampleProject(name: string): ModProject {
  const p = emptyProject(name);
  const fireball: Skill = {
    id: uid(), name: "FireBolt", description: "視線方向に火の玉を放つ", cooldown: 1.5, conditions: [], imports: "",
    lines: [
      line("sound", { sound: "entity.blaze.shoot", volume: 1, pitch: 1.2 }, "Self"),
      line("particles", { particle: "FLAME", amount: 30, spread: 0.3, speed: 0.02, yOffset: 1.5 }, "Self"),
      line("projectile", { type: "fireball", speed: 1.8 }, "Self"),
    ],
  };
  const thunder: Skill = {
    id: uid(), name: "ThunderStrike", description: "攻撃相手に雷と追加ダメージ（30%）", cooldown: 3, imports: "",
    conditions: [],
    lines: [
      line("lightning", { cosmetic: true }, "Target", {}, [{ ...newCondition("chance"), params: { p: 0.3 } }]),
      line("damage", { amount: 6, magic: true }, "Target"),
      line("message", { text: "§e⚡ <target.name> に雷撃！" }, "Self"),
    ],
  };
  const shockwave: Skill = {
    id: uid(), name: "Shockwave", description: "周囲を吹き飛ばし、1秒後に爆発", cooldown: 8, imports: "",
    conditions: [{ ...newCondition("sneaking") }],
    lines: [
      line("push", { strength: 1.6, up: 0.6 }, "EntitiesInRadius", { r: 6 }),
      line("particles", { particle: "EXPLOSION", amount: 10, spread: 2, speed: 0, yOffset: 0.5 }, "Ring", { r: 4, points: 16 }),
      line("delay", { ticks: 20 }, "Self"),
      line("explosion", { power: 1.5, fire: false, breakBlocks: false }, "SelfLocation"),
    ],
  };
  const heal: Skill = {
    id: uid(), name: "HealingAura", description: "周囲のプレイヤーを回復", cooldown: 0, imports: "",
    conditions: [],
    lines: [
      line("heal", { amount: 2 }, "PlayersInRadius", { r: 8 }),
      line("particles", { particle: "HEART", amount: 3, spread: 0.5, speed: 0, yOffset: 2 }, "PlayersInRadius", { r: 8 }),
    ],
  };
  const summonMinions: Skill = {
    id: uid(), name: "SummonMinions", description: "HP50%以下で手下を召喚", cooldown: 20, imports: "",
    conditions: [{ ...newCondition("health"), params: { min: 0, max: 50 } }],
    lines: [
      line("summon", { type: "minecraft:vex", amount: 2 }, "SelfLocation"),
      line("title", { title: "§cThe Necromancer rages!", subtitle: "" }, "PlayersInRadius", { r: 20 }),
    ],
  };
  const welcome: Skill = {
    id: uid(), name: "Welcome", description: "ログイン時の挨拶", cooldown: 0, imports: "", conditions: [],
    lines: [line("message", { text: "§aようこそ <caster.name>！ 炎の杖を右クリックしてみよう" }, "Self")],
  };
  const jump: Skill = {
    id: uid(), name: "SuperJump", description: "カスタムKotlinで上方向に跳ぶ", cooldown: 2, imports: "", conditions: [],
    lines: [
      { ...line("kotlin", {}, "Self"), params: { code: "e?.let {\n    it.addVelocity(0.0, 1.2, 0.0)\n    it.velocityModified = true\n}" } },
      line("sound", { sound: "entity.firework_rocket.launch", volume: 1, pitch: 1 }, "Self"),
    ],
  };
  p.skills = [fireball, thunder, shockwave, heal, summonMinions, welcome, jump];
  const wand = newItem("fire_wand");
  Object.assign(wand, { displayName: "Fire Wand", maxCount: 1, rarity: "RARE", glint: true, tooltip: "右クリック: FireBolt\nスニーク+右クリック: Shockwave", useCooldown: 10 });
  wand.triggers = [
    { id: uid(), trigger: "onUse", skill: "FireBolt" },
    { id: uid(), trigger: "onUse", skill: "Shockwave" },
  ];
  const sword = newItem("thunder_blade");
  Object.assign(sword, { displayName: "Thunder Blade", kind: "sword", material: "DIAMOND", attackDamage: 4, attackSpeed: -2.4, rarity: "EPIC", tooltip: "攻撃時 30% で雷撃" });
  sword.triggers = [{ id: uid(), trigger: "onAttack", skill: "ThunderStrike" }];
  const block = newBlock("healing_stone");
  Object.assign(block, { displayName: "Healing Stone", luminance: 10, sound: "AMETHYST_BLOCK", hardness: 3, requiresTool: true });
  block.triggers = [{ id: uid(), trigger: "onInteract", skill: "HealingAura" }];
  p.items = [wand, sword];
  p.blocks = [block];
  p.mobSkills = [{ id: uid(), entityType: "minecraft:zombie", trigger: "onDamaged", skill: "SummonMinions", interval: 40 }];
  p.events = [{ id: uid(), trigger: "onJoin", skill: "Welcome", interval: 20 }];
  p.commands = [{ id: uid(), name: "superjump", skill: "SuperJump", permissionLevel: 0 }];

  // --- カスタムモブ (MythicMobs 風ボス)
  const boneStorm: Skill = {
    id: uid(), name: "BoneStorm", description: "ボスの周囲攻撃: ビーム + 鈍足", cooldown: 0, imports: "", conditions: [],
    lines: [
      line("beam", { particle: "SOUL_FIRE_FLAME", density: 4 }, "PlayersInRadius", { r: 12 }),
      line("damage", { amount: 4, magic: false }, "PlayersInRadius", { r: 12 }),
      line("potion", { type: "SLOWNESS", duration: 60, level: 1, particles: true }, "PlayersInRadius", { r: 12 }),
      line("sound", { sound: "entity.wither.shoot", volume: 1, pitch: 0.7 }, "Self"),
    ],
  };
  const kingSpawn: Skill = {
    id: uid(), name: "KingArrives", description: "ボス出現演出", cooldown: 0, imports: "", conditions: [],
    lines: [
      line("lightning", { cosmetic: true }, "SelfLocation"),
      line("title", { title: "§4Skeleton King", subtitle: "§7が目覚めた..." }, "PlayersInRadius", { r: 40 }),
    ],
  };
  p.skills.push(boneStorm, kingSpawn);
  const king = newMob("SkeletonKing");
  Object.assign(king, {
    displayName: "§4§lSkeleton King", baseType: "minecraft:wither_skeleton", health: 200, damage: 10, speedMultiplier: 1.2, armor: 8,
    knockbackResistance: 0.8, glowing: true, xp: 200, naturalSpawn: true, spawnChance: 0.02,
    equipment: { mainhand: "minecraft:netherite_sword", offhand: "", head: "minecraft:golden_helmet", chest: "", legs: "", feet: "" },
  });
  king.effects = [{ id: uid(), type: "FIRE_RESISTANCE", level: 0 }];
  king.drops = [
    { id: uid(), item: "minecraft:nether_star", min: 1, max: 1, chance: 1 },
    { id: uid(), item: "minecraft:bone", min: 4, max: 12, chance: 1 },
  ];
  king.triggers = [
    { id: uid(), trigger: "onSpawn", skill: "KingArrives" },
    { id: uid(), trigger: "onTimer", skill: "BoneStorm", interval: 100 },
    { id: uid(), trigger: "onDamaged", skill: "SummonMinions" },
  ];
  p.mobs = [king];

  // --- レシピ
  const r1 = newRecipe("fire_wand", `${p.meta.modId}:fire_wand`);
  r1.grid = ["", "", "minecraft:blaze_powder", "", "minecraft:blaze_rod", "", "minecraft:stick", "", ""];
  const r2 = newRecipe("healing_stone", `${p.meta.modId}:healing_stone`);
  r2.type = "shapeless";
  r2.grid = ["minecraft:stone", "minecraft:glistering_melon_slice", "minecraft:amethyst_shard", "", "", "", "", "", ""];
  const r3 = newRecipe("smelt_rotten_flesh", "minecraft:leather");
  Object.assign(r3, { type: "smelting", input: "minecraft:rotten_flesh", experience: 0.2, cookingTime: 200 });
  p.recipes = [r1, r2, r3];

  // --- マナシステム (永続変数)
  const manaRegen: Skill = {
    id: uid(), name: "ManaRegen", description: "毎秒マナ+5 (最大100) をアクションバー表示", cooldown: 0, imports: "", conditions: [],
    lines: [
      line("addvar", { var: "mana", amount: 5, min: 0, max: 100, scope: "caster" }, "Self"),
      line("actionbar", { text: "§b✦ Mana: <var.mana> / 100" }, "Self"),
    ],
  };
  const orbHit: Skill = {
    id: uid(), name: "ArcaneOrbHit", description: "アーケインオーブ命中時", cooldown: 0, imports: "", conditions: [],
    lines: [
      line("damage", { amount: 7, magic: true }, "EntitiesInRadius", { r: 2.5 }),
      line("particles", { particle: "WITCH", amount: 40, spread: 1, speed: 0.1, yOffset: 0 }, "Origin"),
      line("sound", { sound: "entity.illusioner.cast_spell", volume: 1, pitch: 1.4 }, "Origin"),
    ],
  };
  const orb: Skill = {
    id: uid(), name: "ArcaneOrb", description: "マナ20消費: 追尾しない魔法弾", cooldown: 0.5, imports: "",
    conditions: [{ ...newCondition("variable"), params: { var: "mana", min: 20, max: 1000000, scope: "caster" } }],
    lines: [
      line("addvar", { var: "mana", amount: -20, min: 0, max: 100, scope: "caster" }, "Self"),
      line("missile", { onHit: "ArcaneOrbHit", speed: 1.4, ticks: 40, radius: 0.8, gravity: 0, particle: "WITCH", hitBlocks: true }, "Self"),
    ],
  };
  const mythrilBonus: Skill = {
    id: uid(), name: "MythrilSetBonus", description: "ミスリル胸当て: 移動速度と暗視", cooldown: 0, imports: "", conditions: [],
    lines: [
      line("potion", { type: "SPEED", duration: 60, level: 0, particles: false }, "Self"),
      line("potion", { type: "NIGHT_VISION", duration: 300, level: 0, particles: false }, "Self"),
    ],
  };
  p.skills.push(manaRegen, orbHit, orb, mythrilBonus);
  p.events.push({ id: uid(), trigger: "onTimer", skill: "ManaRegen", interval: 20 });
  const staff = newItem("arcane_staff");
  Object.assign(staff, { displayName: "Arcane Staff", maxCount: 1, rarity: "EPIC", glint: true, tooltip: "右クリック: Arcane Orb (マナ20)" });
  staff.triggers = [{ id: uid(), trigger: "onUse", skill: "ArcaneOrb" }];
  const ingot = newItem("mythril_ingot");
  Object.assign(ingot, { displayName: "Mythril Ingot", rarity: "UNCOMMON" });
  const ore = newBlock("mythril_ore");
  Object.assign(ore, {
    displayName: "Mythril Ore", hardness: 3, resistance: 3, requiresTool: true, tool: "pickaxe", toolLevel: "iron", sound: "STONE",
    dropItem: `${p.meta.modId}:mythril_ingot`, dropMin: 1, dropMax: 2,
    oreGen: { enabled: true, dimension: "overworld", veinSize: 6, veinsPerChunk: 4, minY: -48, maxY: 32 },
  });
  p.blocks.push(ore);
  p.items.push(staff, ingot);
  const pieces = [["helmet", "Mythril Helmet", ["I", "I", "I", "I", "", "I", "", "", ""]], ["chestplate", "Mythril Chestplate", ["I", "", "I", "I", "I", "I", "I", "I", "I"]], ["leggings", "Mythril Leggings", ["I", "I", "I", "I", "", "I", "I", "", "I"]], ["boots", "Mythril Boots", ["", "", "", "I", "", "I", "I", "", "I"]]] as const;
  for (const [kind, label, grid] of pieces) {
    const a = newItem(`mythril_${kind}`);
    Object.assign(a, { displayName: label, kind, armorMaterial: "DIAMOND", maxCount: 1, rarity: "RARE" });
    if (kind === "chestplate") a.triggers = [{ id: uid(), trigger: "onWear", skill: "MythrilSetBonus", interval: 40 }];
    p.items.push(a);
    const r = newRecipe(`mythril_${kind}`, `${p.meta.modId}:mythril_${kind}`);
    r.grid = grid.map((g) => (g ? `${p.meta.modId}:mythril_ingot` : ""));
    p.recipes.push(r);
  }
  const rs = newRecipe("arcane_staff", `${p.meta.modId}:arcane_staff`);
  rs.grid = ["", "", "minecraft:amethyst_shard", "", `${p.meta.modId}:mythril_ingot`, "", "minecraft:stick", "", ""];
  p.recipes.push(rs);
  return p;
}
