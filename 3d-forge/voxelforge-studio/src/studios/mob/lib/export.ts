import { BEHAVIORS, BIOMES, PARTICLES } from "@/studios/mob/data/catalog";
import { getArchetype } from "@/studios/mob/data/archetypes";
import {
  abilityById,
  abilityTuning,
  combatScore,
  constName,
  estimateHitbox,
  hexToInt,
  pascal,
  rankOf,
  resolveParts,
  round2,
  warningsOf,
} from "@/studios/mob/lib/model";
import JSZip from "jszip";
import { drawTexture, type PackedFace } from "@/studios/mob/lib/texture";
import {
  buildFabric12111Project,
  clientMainClass,
  entityClass,
  entityTypesClass,
  modelClass,
  rendererClass,
} from "@/studios/mob/lib/fabric12111";
import { drawBoxUVTexture } from "@/studios/mob/lib/boxuv";
import type { MobDraft } from "@/studios/mob/types";

export type ExportKind =
  | "f11_entity"
  | "f11_types"
  | "f11_model"
  | "f11_renderer"
  | "f11_client"
  | "design"
  | "bbmodel"
  | "fabric120"
  | "fabric121"
  | "neoforge121"
  | "neoforge124"
  | "bedrock"
  | "loot"
  | "lang"
  | "geometry";

export const EXPORT_TABS: { id: ExportKind; label: string; file: string; group: string }[] = [
  { id: "f11_entity", label: "Entity", file: "Entity.java", group: "Fabric 1.21.11" },
  { id: "f11_types", label: "登録", file: "ModEntityTypes.java", group: "Fabric 1.21.11" },
  { id: "f11_model", label: "Model", file: "Model.java", group: "Fabric 1.21.11" },
  { id: "f11_renderer", label: "Renderer", file: "Renderer.java", group: "Fabric 1.21.11" },
  { id: "f11_client", label: "Client", file: "ModClient.java", group: "Fabric 1.21.11" },
  { id: "design", label: "設計書", file: "design.mobforge.json", group: "共通" },
  { id: "bbmodel", label: "Blockbench", file: "model.bbmodel", group: "共通" },
  { id: "loot", label: "ルート", file: "loot.json", group: "共通" },
  { id: "lang", label: "言語", file: "lang.json", group: "共通" },
  { id: "bedrock", label: "Bedrock BP", file: "entity.behavior.json", group: "統合版" },
  { id: "geometry", label: "ジオメトリ", file: "model.geo.json", group: "統合版" },
  { id: "fabric120", label: "Fabric 1.20.1", file: "ModEntities.java", group: "旧版" },
  { id: "fabric121", label: "Fabric 1.21.1", file: "ModEntities.java", group: "旧版" },
  { id: "neoforge121", label: "NeoForge 1.21.1", file: "ModEntities.java", group: "旧版" },
  { id: "neoforge124", label: "NeoForge 1.21.4+", file: "ModEntities.java", group: "旧版" },
];

function q(s: string): string {
  return s.replace(/\*\//g, "* /");
}

function f(n: number): string {
  const v = round2(n);
  return Number.isInteger(v) ? `${v}.0` : String(v);
}

function biomeIds(mob: MobDraft): string[] {
  const extra = mob.spawn.customBiomes
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return [...mob.spawn.biomes, ...extra];
}

function javaBiomeKeys(mob: MobDraft, style: "yarn" | "mojmap"): string {
  const ids = biomeIds(mob);
  if (ids.length === 0) return style === "yarn" ? "BiomeKeys.PLAINS" : "Biomes.PLAINS";
  return ids
    .map((id) => {
      if (id.startsWith("tag:")) return null;
      const known = BIOMES.find((b) => b.id === id || id.endsWith(b.id));
      if (known && !id.includes(":")) return style === "yarn" ? `BiomeKeys.${known.key}` : `Biomes.${known.key}`;
      const raw = id.includes(":") ? id : `minecraft:${id}`;
      return style === "yarn"
        ? `RegistryKey.of(RegistryKeys.BIOME, new Identifier("${raw.split(":")[0]}", "${raw.split(":")[1]}"))`
        : `ResourceKey.create(Registries.BIOME, ResourceLocation.parse("${raw}"))`;
    })
    .filter((x): x is string => Boolean(x))
    .join(", ");
}

function spawnGroupYarn(mob: MobDraft): string {
  switch (mob.category) {
    case "monster":
      return "MONSTER";
    case "ambient":
      return "AMBIENT";
    case "water_creature":
      return "WATER_CREATURE";
    case "water_ambient":
      return "WATER_AMBIENT";
    case "misc":
      return "MISC";
    default:
      return "CREATURE";
  }
}

function mobCategory(mob: MobDraft): string {
  switch (mob.category) {
    case "monster":
      return "MONSTER";
    case "ambient":
      return "AMBIENT";
    case "water_creature":
      return "WATER_CREATURE";
    case "water_ambient":
      return "WATER_AMBIENT";
    case "misc":
      return "MISC";
    default:
      return "CREATURE";
  }
}

function parentYarn(mob: MobDraft): string {
  if (mob.category === "monster" || mob.temperament === "hostile") return "HostileEntity";
  if (mob.breathesWater) return "WaterCreatureEntity";
  return "PathAwareEntity";
}

function parentMoj(mob: MobDraft): string {
  if (mob.category === "monster" || mob.temperament === "hostile") return "Monster";
  if (mob.breathesWater) return "WaterAnimal";
  return "PathfinderMob";
}

function goalBlock(mob: MobDraft, yarn: boolean): string {
  const lines: string[] = [];
  const add = (prio: number, goal: string) => lines.push(`        this.goalSelector.add(${prio}, ${goal});`);
  const tgt = (prio: number, goal: string) => lines.push(`        this.targetSelector.add(${prio}, ${goal});`);
  if (mob.behaviors.includes("swim") || mob.canSwim) add(0, yarn ? "new SwimGoal(this)" : "new FloatGoal(this)");
  if (mob.behaviors.includes("flee")) {
    add(1, yarn ? "new FleeEntityGoal<>(this, PlayerEntity.class, 8.0f, 1.2, 1.4)" : "new AvoidEntityGoal<>(this, Player.class, 8.0f, 1.2, 1.4)");
  }
  if (mob.behaviors.includes("melee")) {
    add(2, yarn ? "new MeleeAttackGoal(this, 1.2, false)" : "new MeleeAttackGoal(this, 1.2, false)");
  }
  if (mob.behaviors.includes("ranged")) {
    add(2, yarn ? "/* ProjectileAttackGoal — 弾クラスを接続 */ new ProjectileAttackGoal(this, 1.1, 30, 16.0f)" : "/* RangedAttackGoal — 弾を接続 */ new RangedAttackGoal(this, 1.1, 30, 16.0f)");
  }
  if (mob.behaviors.includes("tempt")) {
    add(3, yarn
      ? `new TemptGoal(this, 1.1, Ingredient.ofItems(Items.${itemConst(mob.foodItem)}), false)`
      : `new TemptGoal(this, 1.1, Ingredient.of(Items.${itemConst(mob.foodItem)}), false)`);
  }
  if (mob.behaviors.includes("breed")) {
    lines.push("        // AnimalMateGoal / BreedGoal は Animal 継承が必要。PathAware のままなら外す。");
    add(4, yarn ? "new AnimalMateGoal(this, 1.0)" : "new BreedGoal(this, 1.0)");
  }
  if (mob.behaviors.includes("follow_owner")) {
    lines.push("        // FollowOwnerGoal は Tameable 継承が必要。");
    add(5, yarn ? "new FollowOwnerGoal(this, 1.1, 10.0f, 2.0f, false)" : "new FollowOwnerGoal(this, 1.1, 10.0f, 2.0f)");
  }
  if (mob.canFly || mob.behaviors.includes("fly_wander")) add(6, yarn ? "new FlyGoal(this, 1.0)" : "new WaterAvoidingRandomFlyingGoal(this, 1.0)");
  else if (mob.behaviors.includes("wander") || mob.behaviors.includes("water_nav")) add(7, yarn ? "new WanderAroundFarGoal(this, 1.0)" : "new WaterAvoidingRandomStrollGoal(this, 1.0)");
  if (mob.behaviors.includes("look")) {
    add(8, yarn ? "new LookAtEntityGoal(this, PlayerEntity.class, 8.0f)" : "new LookAtPlayerGoal(this, Player.class, 8.0f)");
    add(8, yarn ? "new LookAroundGoal(this)" : "new RandomLookAroundGoal(this)");
  }
  if (mob.temperament !== "passive" && (mob.behaviors.includes("melee") || mob.behaviors.includes("ranged"))) {
    tgt(1, yarn ? "new RevengeGoal(this)" : "new HurtByTargetGoal(this)");
  }
  if (mob.temperament === "hostile") {
    tgt(2, yarn ? "new ActiveTargetGoal<>(this, PlayerEntity.class, true)" : "new NearestAttackableTargetGoal<>(this, Player.class, true)");
  }
  if (lines.length === 0) lines.push("        // 行動が未選択です。");
  return lines.join("\n");
}

function itemConst(id: string): string {
  const path = id.split(":").pop() ?? "stick";
  return path.replace(/[^a-z0-9]+/gi, "_").toUpperCase();
}

function attrYarn(prefixGeneric: boolean): string {
  const g = prefixGeneric ? "GENERIC_" : "";
  return g;
}

function attributesYarn(mob: MobDraft): string {
  const g = attrYarn(true);
  const lines = [
    `                .add(EntityAttributes.${g}MAX_HEALTH, ${f(mob.health)})`,
    `                .add(EntityAttributes.${g}MOVEMENT_SPEED, ${f(mob.movementSpeed)})`,
    `                .add(EntityAttributes.${g}ATTACK_DAMAGE, ${f(mob.attackDamage)})`,
    `                .add(EntityAttributes.${g}ARMOR, ${f(mob.armor)})`,
    `                .add(EntityAttributes.${g}ARMOR_TOUGHNESS, ${f(mob.armorToughness)})`,
    `                .add(EntityAttributes.${g}FOLLOW_RANGE, ${f(mob.followRange)})`,
    `                .add(EntityAttributes.${g}KNOCKBACK_RESISTANCE, ${f(mob.knockbackResistance)})`,
    `                .add(EntityAttributes.${g}ATTACK_KNOCKBACK, ${f(mob.attackKnockback)})`,
  ];
  if (mob.canFly) lines.push(`                .add(EntityAttributes.${g}FLYING_SPEED, ${f(mob.flyingSpeed)})`);
  return lines.join("\n");
}

function attributesMoj(mob: MobDraft, scaleAttr: boolean): string {
  const lines = [
    `                .add(Attributes.MAX_HEALTH, ${f(mob.health)})`,
    `                .add(Attributes.MOVEMENT_SPEED, ${f(mob.movementSpeed)})`,
    `                .add(Attributes.ATTACK_DAMAGE, ${f(mob.attackDamage)})`,
    `                .add(Attributes.ARMOR, ${f(mob.armor)})`,
    `                .add(Attributes.ARMOR_TOUGHNESS, ${f(mob.armorToughness)})`,
    `                .add(Attributes.FOLLOW_RANGE, ${f(mob.followRange)})`,
    `                .add(Attributes.KNOCKBACK_RESISTANCE, ${f(mob.knockbackResistance)})`,
    `                .add(Attributes.ATTACK_KNOCKBACK, ${f(mob.attackKnockback)})`,
  ];
  if (mob.canFly) lines.push(`                .add(Attributes.FLYING_SPEED, ${f(mob.flyingSpeed)})`);
  if (scaleAttr && Math.abs(mob.scale - 1) > 0.02) lines.push(`                .add(Attributes.SCALE, ${f(mob.scale)})`);
  return lines.join("\n");
}

function canSpawnYarn(mob: MobDraft): string {
  const light = `int light = world.getLightLevel(LightType.BLOCK, pos);
        if (light < ${mob.spawn.minLight} || light > ${mob.spawn.maxLight}) return false;`;
  const time =
    mob.spawn.time === "any"
      ? ""
      : `
        long tod = world.getTimeOfDay() % 24000L;
        boolean night = tod >= 13000 && tod <= 23000;
        if (${mob.spawn.time === "night" ? "!night" : "night"}) return false;`;
  const weather =
    mob.spawn.weather === "any"
      ? ""
      : `
        if (${mob.spawn.weather === "rain" ? "!world.isRaining()" : "world.isRaining()"}) return false;`;
  return `${light}${time}${weather}
        return MobEntity.canMobSpawn(type, world, reason, pos, random);`;
}

function fabricJava(mob: MobDraft, version: "1.20.1" | "1.21.1"): string {
  const cls = pascal(mob.entityId);
  const typeName = constName(mob.entityId);
  const box = estimateHitbox(mob);
  const parent = parentYarn(mob);
  const egg = hexToInt(mob.eggBase);
  const spots = hexToInt(mob.eggSpots);
  const biomeExpr = javaBiomeKeys(mob, "yarn") || "BiomeKeys.PLAINS";
  const idNew = version === "1.20.1" ? `new Identifier("${mob.modId}", "${mob.entityId}")` : `Identifier.of("${mob.modId}", "${mob.entityId}")`;
  const spawnEgg =
    version === "1.20.1"
      ? `new SpawnEggItem(ModEntities.${typeName}, 0x${egg.toString(16).padStart(6, "0")}, 0x${spots.toString(16).padStart(6, "0")}, new Item.Settings())`
      : `new SpawnEggItem(ModEntities.${typeName}, 0x${egg.toString(16).padStart(6, "0")}, 0x${spots.toString(16).padStart(6, "0")}, new Item.Settings())`;
  return `// Mobforge — Fabric ${version} (Yarn)
// ${q(mob.displayName)} / ${q(mob.displayNameEn)}
// 描画は Blockbench の Modded Entity 書き出しをこのクラスへ接続してください。
// 当たり判定はプレビューから推定: ${box.width} x ${box.height}（目の高さ ${box.eye}）

package com.example.${mob.modId};

import net.fabricmc.fabric.api.biome.v1.BiomeModifications;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;
import net.fabricmc.fabric.api.object.builder.v1.entity.FabricDefaultAttributeRegistry;
import net.fabricmc.fabric.api.object.builder.v1.entity.FabricEntityTypeBuilder;
import net.minecraft.entity.${parent === "HostileEntity" ? "mob.HostileEntity" : parent === "WaterCreatureEntity" ? "mob.WaterCreatureEntity" : "mob.PathAwareEntity"};
import net.minecraft.entity.EntityDimensions;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.entity.SpawnRestriction;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.Item;
import net.minecraft.item.Items;
import net.minecraft.item.SpawnEggItem;
import net.minecraft.recipe.Ingredient;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.random.Random;
import net.minecraft.world.Heightmap;
import net.minecraft.world.LightType;
import net.minecraft.world.SpawnReason;
import net.minecraft.world.World;
import net.minecraft.world.WorldAccess;
import net.minecraft.world.biome.BiomeKeys;

public final class ModEntities {
    public static final EntityType<${cls}Entity> ${typeName} = Registry.register(
            Registries.ENTITY_TYPE,
            ${idNew},
            FabricEntityTypeBuilder.create(SpawnGroup.${spawnGroupYarn(mob)}, ${cls}Entity::new)
                    .dimensions(EntityDimensions.fixed(${f(box.width)}f, ${f(box.height)}f))
                    .trackRangeBlocks(${mob.bossBar ? 16 : 10})
                    .trackedUpdateRate(3)
                    .build()
    );

    public static final Item ${typeName}_SPAWN_EGG = Registry.register(
            Registries.ITEM,
            ${version === "1.20.1" ? `new Identifier("${mob.modId}", "${mob.entityId}_spawn_egg")` : `Identifier.of("${mob.modId}", "${mob.entityId}_spawn_egg")`},
            ${spawnEgg}
    );

    public static void init() {
        FabricDefaultAttributeRegistry.register(${typeName}, ${cls}Entity.createAttributes());
        SpawnRestriction.register(
                ${typeName},
                SpawnRestriction.Location.${mob.breathesWater && !mob.canFly ? "IN_WATER" : "ON_GROUND"},
                Heightmap.Type.MOTION_BLOCKING_NO_LEAVES,
                ${cls}Entity::canSpawn
        );
        BiomeModifications.addSpawn(
                BiomeSelectors.includeByKey(${biomeExpr}),
                SpawnGroup.${spawnGroupYarn(mob)},
                ${typeName},
                ${mob.spawn.weight},
                ${mob.spawn.groupMin},
                ${mob.spawn.groupMax}
        );
    }

    private ModEntities() {}
}

class ${cls}Entity extends ${parent} {
    public ${cls}Entity(EntityType<? extends ${cls}Entity> type, World world) {
        super(type, world);
        this.experiencePoints = ${Math.max(0, Math.round(mob.xp))};
    }

    public static DefaultAttributeContainer.Builder createAttributes() {
        return MobEntity.createMobAttributes()
${attributesYarn(mob)};
    }

    public static boolean canSpawn(EntityType<${cls}Entity> type, WorldAccess world, SpawnReason reason, net.minecraft.util.math.BlockPos pos, Random random) {
        ${canSpawnYarn(mob)}
    }

    @Override
    protected void initGoals() {
${goalBlock(mob, true)}
    }

    // フラグ: fly=${mob.canFly} swim=${mob.canSwim} climb=${mob.canClimb} fireImmune=${mob.fireImmune}
    // undead=${mob.undead} arthropod=${mob.arthropod} bossBar=${mob.bossBar} tameable=${mob.tameable}
    // 攻撃間隔の目安: ${mob.attackInterval}s（MeleeAttackGoal のクールダウンは別途）
    // 餌: ${mob.foodItem}
}
`;
}

function neoJava(mob: MobDraft, version: "1.21.1" | "1.21.4"): string {
  const cls = pascal(mob.entityId);
  const typeName = constName(mob.entityId);
  const box = estimateHitbox(mob);
  const parent = parentMoj(mob);
  const egg = hexToInt(mob.eggBase);
  const spots = hexToInt(mob.eggSpots);
  const attrNote =
    version === "1.21.1"
      ? "属性 ID は generic.max_health のまま（1.21.1）。"
      : "1.21.2 以降、属性 ID は minecraft:max_health（generic. 接頭辞なし）。Java フィールドは Attributes.MAX_HEALTH。";
  const spawnEgg =
    version === "1.21.1"
      ? `() -> new SpawnEggItem(${typeName}.get(), 0x${egg.toString(16).padStart(6, "0")}, 0x${spots.toString(16).padStart(6, "0")}, new Item.Properties())`
      : `() -> new SpawnEggItem(new Item.Properties().spawnEgg(${typeName}.get()))
        // 卵色 base=#${mob.eggBase.replace("#", "")} spots=#${mob.eggSpots.replace("#", "")} はアイテムモデルの tint へ`;
  return `// Mobforge — NeoForge ${version} (Mojmap)
// ${q(mob.displayName)}
// ${attrNote}
// バイオーム追加は data/${mob.modId}/neoforge/biome_modifier/${mob.entityId}.json を同梱。

package com.example.${mob.modId};

import net.minecraft.world.entity.${parent === "Monster" ? "monster.Monster" : parent === "WaterAnimal" ? "animal.WaterAnimal" : "PathfinderMob"};
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.Mob;
import net.minecraft.world.entity.MobCategory;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.Items;
import net.minecraft.world.item.SpawnEggItem;
import net.minecraft.world.item.crafting.Ingredient;
import net.minecraft.world.level.Level;
import net.neoforged.neoforge.event.entity.EntityAttributeCreationEvent;
import net.neoforged.neoforge.event.entity.RegisterSpawnPlacementsEvent;
import net.neoforged.neoforge.registries.DeferredRegister;
import net.minecraft.core.registries.Registries;

import java.util.function.Supplier;

public final class ModEntities {
    public static final DeferredRegister<EntityType<?>> ENTITY_TYPES =
            DeferredRegister.create(Registries.ENTITY_TYPE, "${mob.modId}");
    public static final DeferredRegister<Item> ITEMS =
            DeferredRegister.create(Registries.ITEM, "${mob.modId}");

    public static final Supplier<EntityType<${cls}Entity>> ${typeName} = ENTITY_TYPES.register(
            "${mob.entityId}",
            () -> EntityType.Builder.of(${cls}Entity::new, MobCategory.${mobCategory(mob)})
                    .sized(${f(box.width)}f, ${f(box.height)}f)
                    .clientTrackingRange(${mob.bossBar ? 16 : 10})
                    .build("${mob.entityId}")
    );

    public static final Supplier<Item> ${typeName}_SPAWN_EGG = ITEMS.register(
            "${mob.entityId}_spawn_egg",
            ${spawnEgg}
    );

    public static void attributes(EntityAttributeCreationEvent event) {
        event.put(${typeName}.get(), ${cls}Entity.createAttributes().build());
    }

    public static void placements(RegisterSpawnPlacementsEvent event) {
        // Operation.REPLACE / AND はバージョンで列挙名が違うことがあります。
        event.register(${typeName}.get(),
                ${mob.breathesWater && !mob.canFly ? "SpawnPlacementTypes.IN_WATER" : "SpawnPlacementTypes.ON_GROUND"},
                net.minecraft.world.level.levelgen.Heightmap.Types.MOTION_BLOCKING_NO_LEAVES,
                (type, level, reason, pos, random) -> {
                    int light = level.getBrightness(net.minecraft.world.level.LightLayer.BLOCK, pos);
                    if (light < ${mob.spawn.minLight} || light > ${mob.spawn.maxLight}) return false;
                    return Mob.checkMobSpawnRules(type, level, reason, pos, random);
                },
                RegisterSpawnPlacementsEvent.Operation.REPLACE);
    }

    private ModEntities() {}
}

class ${cls}Entity extends ${parent} {
    public ${cls}Entity(EntityType<? extends ${cls}Entity> type, Level level) {
        super(type, level);
        this.xpReward = ${Math.max(0, Math.round(mob.xp))};
    }

    public static AttributeSupplier.Builder createAttributes() {
        return Mob.createMobAttributes()
${attributesMoj(mob, version === "1.21.4")};
    }

    @Override
    protected void registerGoals() {
${goalBlock(mob, false)}
    }
}
`;
}

export function lootTable(mob: MobDraft): string {
  const pools = mob.drops.map((drop) => ({
    rolls: 1,
    entries: [
      {
        type: "minecraft:item",
        name: drop.item.includes(":") ? drop.item : `minecraft:${drop.item}`,
        functions: [
          {
            function: "minecraft:set_count",
            count: { type: "minecraft:uniform", min: drop.min, max: drop.max },
          },
        ],
        conditions: [{ condition: "minecraft:random_chance", chance: round2(drop.chance) }],
      },
    ],
  }));
  return JSON.stringify(
    {
      type: "minecraft:entity",
      pools: pools.length
        ? pools
        : [{ rolls: 1, entries: [{ type: "minecraft:empty" }] }],
    },
    null,
    2,
  );
}

export function langFiles(mob: MobDraft): { ja: string; en: string } {
  const eggJa = `${mob.displayName}のスポーンエッグ`;
  const eggEn = `${mob.displayNameEn || mob.displayName} Spawn Egg`;
  const ja = {
    [`entity.${mob.modId}.${mob.entityId}`]: mob.displayName,
    [`item.${mob.modId}.${mob.entityId}_spawn_egg`]: eggJa,
  };
  const en = {
    [`entity.${mob.modId}.${mob.entityId}`]: mob.displayNameEn || mob.displayName,
    [`item.${mob.modId}.${mob.entityId}_spawn_egg`]: eggEn,
  };
  return { ja: JSON.stringify(ja, null, 2), en: JSON.stringify(en, null, 2) };
}

export function biomeModifier(mob: MobDraft): string {
  const ids = biomeIds(mob);
  const biomes = ids.length
    ? ids.map((id) => (id.startsWith("tag:") ? `#${id.slice(4)}` : id.includes(":") ? id : `minecraft:${id}`))
    : "#minecraft:is_overworld";
  return JSON.stringify(
    {
      type: "neoforge:add_spawns",
      biomes: biomes.length === 1 ? biomes[0] : biomes,
      spawners: [
        {
          type: `${mob.modId}:${mob.entityId}`,
          weight: mob.spawn.weight,
          minCount: mob.spawn.groupMin,
          maxCount: mob.spawn.groupMax,
        },
      ],
    },
    null,
    2,
  );
}

function boneRotation(axis: "x" | "y" | "z", deg: number): [number, number, number] {
  if (axis === "y") return [0, round2(deg), 0];
  if (axis === "z") return [0, 0, round2(deg)];
  return [round2(deg), 0, 0];
}

export function geometryJson(mob: MobDraft, faces: PackedFace[], texSize: number): string {
  const parts = resolveParts(mob);
  const bones = parts.map((part) => {
    const uv: Record<string, { uv: [number, number]; uv_size: [number, number] }> = {};
    for (const face of faces.filter((f) => f.partId === part.def.id)) {
      uv[face.face] = { uv: [face.u, face.v], uv_size: [face.w, face.h] };
    }
    const cube: Record<string, unknown> = {
      origin: part.origin.map((n) => round2(n * mob.scale)),
      size: part.size.map((n) => round2(n * mob.scale)),
      uv,
    };
    if (part.def.rotation.some((n) => Math.abs(n) > 0.1)) {
      cube.pivot = part.pivot.map((n) => round2(n * mob.scale));
      cube.rotation = part.def.rotation.map((n) => round2(n));
    }
    return {
      name: part.def.id,
      pivot: part.pivot.map((n) => round2(n * mob.scale)),
      cubes: [cube],
    };
  });
  const box = estimateHitbox(mob);
  return JSON.stringify(
    {
      format_version: "1.12.0",
      "minecraft:geometry": [
        {
          description: {
            identifier: `geometry.${mob.modId}.${mob.entityId}`,
            texture_width: texSize,
            texture_height: texSize,
            visible_bounds_width: Math.ceil(box.width + 1),
            visible_bounds_height: Math.ceil(box.height + 1),
            visible_bounds_offset: [0, round2(box.height / 2), 0],
          },
          bones,
        },
      ],
    },
    null,
    2,
  );
}

export function animationJson(mob: MobDraft): string {
  const parts = resolveParts(mob);
  const bones: Record<string, unknown> = {};
  for (const part of parts) {
    if (part.def.anim === "none" || part.def.anim === "bob" || part.def.anim === "pulse") continue;
    const amp = (part.def.amp * 180) / Math.PI;
    const axis = part.def.anim === "flap" ? "z" : part.def.anim === "wag" || part.def.anim === "wave" || part.def.anim === "look" ? "y" : part.def.axis;
    const a = part.def.anim === "look" ? 12 : amp;
    bones[part.def.id] = {
      rotation: {
        "0.0": boneRotation(axis, a),
        "0.5": boneRotation(axis, -a),
        "1.0": boneRotation(axis, a),
      },
    };
  }
  const id = `${mob.modId}.${mob.entityId}`;
  return JSON.stringify(
    {
      format_version: "1.8.0",
      animations: {
        [`animation.${id}.idle`]: { animation_length: 2, loop: true, bones },
        [`animation.${id}.walk`]: { animation_length: 1, loop: true, bones },
      },
    },
    null,
    2,
  );
}

export function animationController(mob: MobDraft): string {
  const id = `${mob.modId}.${mob.entityId}`;
  return JSON.stringify(
    {
      format_version: "1.10.0",
      animation_controllers: {
        [`controller.animation.${id}`]: {
          initial_state: "idle",
          states: {
            idle: {
              animations: [`idle`],
              transitions: [{ walk: "q.modified_move_speed > 0.1" }],
              blend_transition: 0.2,
            },
            walk: {
              animations: [`walk`],
              transitions: [{ idle: "q.modified_move_speed <= 0.1" }],
              blend_transition: 0.2,
            },
          },
        },
      },
    },
    null,
    2,
  );
}

export function clientEntity(mob: MobDraft): string {
  const id = `${mob.modId}:${mob.entityId}`;
  return JSON.stringify(
    {
      format_version: "1.10.0",
      "minecraft:client_entity": {
        description: {
          identifier: id,
          materials: { default: mob.translucent ? "entity_alphablend" : "entity_alphatest" },
          textures: { default: `textures/entity/${mob.entityId}` },
          geometry: { default: `geometry.${mob.modId}.${mob.entityId}` },
          render_controllers: ["controller.render.default"],
          animations: {
            idle: `animation.${mob.modId}.${mob.entityId}.idle`,
            walk: `animation.${mob.modId}.${mob.entityId}.walk`,
            ctrl: `controller.animation.${mob.modId}.${mob.entityId}`,
          },
          scripts: { animate: ["ctrl"] },
          spawn_egg: { base_color: mob.eggBase, overlay_color: mob.eggSpots },
        },
      },
    },
    null,
    2,
  );
}

export function behaviorEntity(mob: MobDraft): string {
  const box = estimateHitbox(mob);
  const family = ["mob", mob.entityId];
  if (mob.category === "monster" || mob.temperament === "hostile") family.push("monster");
  if (mob.undead) family.push("undead");
  if (mob.arthropod) family.push("arthropod");
  if (mob.temperament === "passive") family.push("creature");
  const components: Record<string, unknown> = {
    "minecraft:type_family": { family },
    "minecraft:health": { value: mob.health, max: mob.health },
    "minecraft:movement": { value: mob.movementSpeed },
    "minecraft:attack": { damage: mob.attackDamage },
    "minecraft:follow_range": { value: mob.followRange, max: mob.followRange },
    "minecraft:knockback_resistance": { value: mob.knockbackResistance },
    "minecraft:collision_box": { width: box.width, height: box.height },
    "minecraft:physics": {},
    "minecraft:pushable": { is_pushable: true, is_pushable_by_piston: true },
    "minecraft:experience_reward": { on_death: mob.xp },
    "minecraft:loot": { table: `loot_tables/entities/${mob.entityId}.json` },
    "minecraft:scale": { value: round2(mob.scale) },
  };
  if (mob.fireImmune) components["minecraft:fire_immune"] = {};
  if (mob.behaviors.includes("burn_sun")) components["minecraft:burns_in_daylight"] = {};
  if (mob.bossBar) components["minecraft:boss"] = { should_darken_sky: false, hud_range: 40 };
  if (mob.breathesWater) {
    components["minecraft:breathable"] = { breathes_water: true, breathes_air: false };
  } else {
    components["minecraft:breathable"] = { breathes_air: true };
  }
  if (mob.canFly) components["minecraft:navigation.fly"] = { can_path_over_water: true };
  else if (mob.canClimb) components["minecraft:navigation.climb"] = {};
  else components["minecraft:navigation.walk"] = { can_path_over_water: mob.canSwim };
  if (mob.canClimb) components["minecraft:can_climb"] = {};
  // movement / jump がないと Bedrock ではそもそも動かない
  if (mob.canFly) components["minecraft:movement.fly"] = {};
  else components["minecraft:movement.basic"] = {};
  components["minecraft:jump.static"] = {};
  // 遠隔攻撃には shooter（弾の定義）が必須
  if (mob.behaviors.includes("ranged")) {
    components["minecraft:shooter"] = { def: "minecraft:arrow" };
  }
  // モンスターは距離デスポーンさせるのがバニラ準拠
  if (mob.category === "monster") {
    components["minecraft:despawn"] = { despawn_from_distance: {} };
  }
  if (mob.behaviors.includes("swim") || mob.canSwim) components["minecraft:behavior.float"] = { priority: 0 };
  if (mob.temperament === "hostile") {
    components["minecraft:behavior.nearest_attackable_target"] = {
      priority: 2,
      must_see: true,
      entity_types: [{ filters: { test: "is_family", subject: "other", value: "player" }, max_dist: mob.followRange }],
    };
  }
  if (mob.temperament !== "passive") {
    components["minecraft:behavior.hurt_by_target"] = { priority: 1 };
  }
  if (mob.behaviors.includes("melee") && mob.temperament !== "passive") {
    components["minecraft:behavior.melee_attack"] = { priority: 3, speed_multiplier: 1.2, track_target: true };
  }
  if (mob.behaviors.includes("ranged") && mob.temperament !== "passive") {
    components["minecraft:behavior.ranged_attack"] = {
      priority: 3,
      attack_interval_min: Math.max(1, Math.round(mob.attackInterval)),
      attack_interval_max: Math.max(1, Math.round(mob.attackInterval + 1)),
      attack_radius: 16,
      speed_multiplier: 1,
    };
  }
  if (mob.behaviors.includes("flee")) components["minecraft:behavior.panic"] = { priority: 1, speed_multiplier: 1.3 };
  if (mob.behaviors.includes("wander")) components["minecraft:behavior.random_stroll"] = { priority: 6, speed_multiplier: 1 };
  if (mob.behaviors.includes("fly_wander") || mob.canFly) components["minecraft:behavior.random_fly"] = { priority: 6, speed_multiplier: 1 };
  if (mob.behaviors.includes("water_nav")) components["minecraft:behavior.random_swim"] = { priority: 6 };
  if (mob.behaviors.includes("look")) {
    components["minecraft:behavior.look_at_player"] = { priority: 8, look_distance: 8 };
    components["minecraft:behavior.random_look_around"] = { priority: 9 };
  }
  if (mob.behaviors.includes("tempt")) {
    components["minecraft:behavior.tempt"] = { priority: 4, speed_multiplier: 1.1, items: [mob.foodItem] };
  }
  if (mob.behaviors.includes("breed")) {
    components["minecraft:behavior.breed"] = { priority: 3, speed_multiplier: 1 };
  }
  if (mob.behaviors.includes("open_door")) components["minecraft:behavior.open_door"] = { priority: 5 };
  if (mob.behaviors.includes("break_door")) components["minecraft:behavior.break_door"] = { priority: 5 };
  if (mob.behaviors.includes("follow_owner") || mob.tameable) {
    components["minecraft:behavior.follow_owner"] = { priority: 5, speed_multiplier: 1.1, start_distance: 10, stop_distance: 2 };
  }
  return JSON.stringify(
    {
      format_version: "1.21.0",
      "minecraft:entity": {
        description: {
          identifier: `${mob.modId}:${mob.entityId}`,
          is_spawnable: true,
          is_summonable: true,
          is_experimental: false,
        },
        components,
      },
    },
    null,
    2,
  );
}

export function designJson(mob: MobDraft): string {
  const arch = getArchetype(mob.archetype);
  const box = estimateHitbox(mob);
  const score = combatScore(mob);
  return JSON.stringify(
    {
      format: "mobforge.design",
      version: 1,
      identity: {
        name: mob.displayName,
        name_en: mob.displayNameEn,
        id: `${mob.modId}:${mob.entityId}`,
        summary: mob.summary,
        archetype: arch.id,
        archetype_label: arch.name,
        variant: mob.variant,
        temperament: mob.temperament,
        category: mob.category,
        rarity: mob.rarity,
      },
      presentation: {
        colors: mob.colors,
        egg: { base: mob.eggBase, spots: mob.eggSpots, base_int: hexToInt(mob.eggBase), spots_int: hexToInt(mob.eggSpots) },
        scale: mob.scale,
        glow: mob.glow,
        translucent: mob.translucent,
        particles: PARTICLES.find((p) => p.id === mob.particles)?.mc ?? "",
      },
      combat: {
        rank: rankOf(score),
        score,
        health: mob.health,
        armor: mob.armor,
        armor_toughness: mob.armorToughness,
        attack_damage: mob.attackDamage,
        attack_interval_seconds: mob.attackInterval,
        attack_knockback: mob.attackKnockback,
        movement_speed: mob.movementSpeed,
        flying_speed: mob.flyingSpeed,
        follow_range: mob.followRange,
        knockback_resistance: mob.knockbackResistance,
        xp: mob.xp,
        hitbox: box,
      },
      flags: {
        can_fly: mob.canFly,
        can_swim: mob.canSwim,
        can_climb: mob.canClimb,
        fire_immune: mob.fireImmune,
        breathes_water: mob.breathesWater,
        undead: mob.undead,
        arthropod: mob.arthropod,
        boss_bar: mob.bossBar,
        tameable: mob.tameable,
      },
      ai: {
        behaviors: mob.behaviors.map((id) => ({ id, name: BEHAVIORS.find((b) => b.id === id)?.name ?? id })),
        abilities: mob.abilities.map((a) => ({
          id: a.id,
          name: abilityById(a.id)?.name ?? a.id,
          power: a.power,
          tuning: abilityTuning(a.power, a.id),
          effect: abilityById(a.id)?.effect ?? "",
        })),
        food: mob.foodItem,
      },
      spawn: mob.spawn,
      drops: mob.drops,
      sounds: mob.sounds,
      notes: mob.notes,
      parts: resolveParts(mob).map((p) => ({
        id: p.def.id,
        name: p.def.name,
        origin: p.origin,
        size: p.size,
        pivot: p.pivot,
        rotation: p.def.rotation,
        color: p.color,
      })),
      warnings: warningsOf(mob).map((w) => w.text),
      draft: mob,
    },
    null,
    2,
  );
}

export function readme(mob: MobDraft): string {
  return `モブ工房 Mobforge 書き出し
${mob.displayName} (${mob.modId}:${mob.entityId})

このパックは設計と雛形です。ゲームに入れる前に、バージョンの差分と描画を接続してください。

構成
- fabric-1.21.11/ ★本命。Mojmap の完全な Gradle プロジェクト。これ単体でビルドできる
- design/ 設計書 JSON（再インポート可）
- models/ Blockbench の .bbmodel
- java/fabric-1.20.1 と fabric-1.21.1 は Yarn（参考）
- java/neoforge-1.21.1 と neoforge-1.21.4 は Mojmap（参考）
- data/ ルートテーブルと NeoForge の biome modifier
- assets/ 言語ファイルとスポーンエッグのモデル
- bedrock/ ジオメトリ、テクスチャ、ビヘイビア、スポーンルール

まず fabric-1.21.11/README.md を読んでください。

座標
- 1 ブロック = 16。原点は足元、Y が上、正面は -Z。
- Blockbench で正面が逆なら、モデルを Y 180° 回してください。
- Java 版の ModelPart は Blockbench の Modded Entity プラグインで書き出すのが確実です。

どこまで「そのまま」使えるか（正直な評価）
- ◎ Bedrock: 別途書き出せる .mcaddon はインポートだけで動作想定。この ZIP 内の bedrock/ も同内容。
- ◎ data/ assets/ の JSON: パスを合わせて置けばそのまま読まれる。
- ◎ .bbmodel: Blockbench でそのまま開ける。
- △ Java 登録コード: 構造は正しいが、バージョン間 API 差で数行の修正前提。
  - 1.21.2+ は EntityType.Builder#build が ResourceKey 必須。
  - 1.21.4+ のスポーンエッグ色はアイテムモデル側（コード内コメント参照）。
  - 属性 ID は 1.21.2 以降 generic. 接頭辞なし。
- △ EntityModel/Renderer: コンパイル可能だが UV は box UV 再配置が必要（.bbmodel 経由推奨）。1.21.3+ は RenderState 移行で非対応。
- ✕ カスタム Goal（突進・召喚・転移など）: 雛形のみ。自作が必要。
`;
}

export function renderExport(mob: MobDraft, kind: ExportKind): string {
  const pkg = `com.example.${mob.modId}`;
  if (kind === "f11_entity") return entityClass(mob, pkg);
  if (kind === "f11_types") return entityTypesClass(mob, pkg);
  if (kind === "f11_model") return modelClass(mob, pkg);
  if (kind === "f11_renderer") return rendererClass(mob, pkg);
  if (kind === "f11_client") return clientMainClass(mob, pkg);
  if (kind === "design") return designJson(mob);
  if (kind === "bbmodel") return blockbenchModel(mob);
  if (kind === "fabric120") return fabricJava(mob, "1.20.1");
  if (kind === "fabric121") return fabricJava(mob, "1.21.1");
  if (kind === "neoforge121") return neoJava(mob, "1.21.1");
  if (kind === "neoforge124") return neoJava(mob, "1.21.4");
  if (kind === "bedrock") return behaviorEntity(mob);
  if (kind === "loot") return lootTable(mob);
  if (kind === "lang") return langFiles(mob).ja;
  const tex = drawTexture(mob);
  return geometryJson(mob, tex.faces, tex.size);
}

export function spawnEggModel(): string {
  return JSON.stringify({ parent: "minecraft:item/template_spawn_egg" }, null, 2);
}

// Blockbench (.bbmodel) 形式の生成
export function blockbenchModel(mob: MobDraft): string {
  const tex = drawTexture(mob);
  const parts = resolveParts(mob);
  const elements = parts.map((part, i) => {
    const ox = round2(part.origin[0] * mob.scale);
    const oy = round2(part.origin[1] * mob.scale);
    const oz = round2(part.origin[2] * mob.scale);
    const sx = round2(part.size[0] * mob.scale);
    const sy = round2(part.size[1] * mob.scale);
    const sz = round2(part.size[2] * mob.scale);
    const px = round2(part.pivot[0] * mob.scale);
    const py = round2(part.pivot[1] * mob.scale);
    const pz = round2(part.pivot[2] * mob.scale);

    const uvFace = (faceName: string) => {
      const f = tex.faces.find((fc) => fc.partId === part.def.id && fc.face === faceName);
      if (!f) return { uv: [0, 0, 1, 1], texture: 0 };
      return { uv: [f.u, f.v, f.u + f.w, f.v + f.h], texture: 0 };
    };

    return {
      name: part.def.id,
      from: [ox, oy, oz],
      to: [ox + sx, oy + sy, oz + sz],
      origin: [px, py, pz],
      rotation: part.def.rotation ? [round2(part.def.rotation[0]), round2(part.def.rotation[1]), round2(part.def.rotation[2])] : [0, 0, 0],
      color: i % 8,
      type: "cube",
      uuid: crypto.randomUUID ? crypto.randomUUID() : `part-${i}`,
      faces: {
        north: uvFace("north"),
        east: uvFace("east"),
        south: uvFace("south"),
        west: uvFace("west"),
        up: uvFace("up"),
        down: uvFace("down"),
      },
    };
  });

  const outlines = elements.map((e) => e.uuid);
  const textureDataUrl = tex.canvas.toDataURL("image/png");

  return JSON.stringify(
    {
      meta: {
        format_version: "4.8",
        model_format: "modded_entity",
        box_uv: false,
      },
      name: mob.entityId,
      model_identifier: `${mob.modId}:${mob.entityId}`,
      visible_box: [1, 2, 1],
      resolution: { width: tex.size, height: tex.size },
      elements,
      outliner: outlines,
      textures: [
        {
          path: `${mob.entityId}.png`,
          name: `${mob.entityId}.png`,
          folder: "textures/entity",
          namespace: mob.modId,
          id: "0",
          particle: false,
          render_mode: "default",
          visible: true,
          mode: "bitmap",
          saved: true,
          uuid: "texture-0",
          source: textureDataUrl,
        },
      ],
    },
    null,
    2
  );
}

// Minecraft Java 1.20-1.21 共通の EntityModel クラス生成
export function javaEntityModel(mob: MobDraft): string {
  const cls = pascal(mob.entityId);
  const parts = resolveParts(mob);
  const tex = drawTexture(mob);

  const partDeclarations = parts.map((p) => `    private final ModelPart ${p.def.id};`).join("\n");
  const partInitializers = parts
    .map((p) => `        this.${p.def.id} = root.getChild("${p.def.id}");`)
    .join("\n");

  const layerParts = parts
    .map((p) => {
      const sx = round2(p.size[0] * mob.scale);
      const sy = round2(p.size[1] * mob.scale);
      const sz = round2(p.size[2] * mob.scale);
      const ox = round2(p.origin[0] * mob.scale);
      const oy = round2(p.origin[1] * mob.scale);
      const oz = round2(p.origin[2] * mob.scale);
      const px = round2(p.pivot[0] * mob.scale);
      const py = round2(p.pivot[1] * mob.scale);
      const pz = round2(p.pivot[2] * mob.scale);

      // UVオフセット算出（面ごとパッキングなので box UV とは不一致。後述の注意参照）
      const f = tex.faces.find((fc) => fc.partId === p.def.id && fc.face === "north");
      const u = f ? f.u : 0;
      const v = f ? f.v : 0;

      // ★ Minecraft Java のモデル空間は Y が下向き。modelY = 24 - worldY で変換する。
      const modelPivotY = round2(24 - py);
      const boxX = round2(ox - px);
      const boxY = round2(py - oy - sy);
      const boxZ = round2(oz - pz);
      const hasRot = p.def.rotation.some((n) => Math.abs(n) > 0.01);
      const rx = round2((-p.def.rotation[0] * Math.PI) / 180);
      const ry = round2((-p.def.rotation[1] * Math.PI) / 180);
      const rz = round2((p.def.rotation[2] * Math.PI) / 180);
      const pose = hasRot
        ? `PartPose.offsetAndRotation(${px}F, ${modelPivotY}F, ${pz}F, ${rx}F, ${ry}F, ${rz}F)`
        : `PartPose.offset(${px}F, ${modelPivotY}F, ${pz}F)`;
      return `        root.addOrReplaceChild("${p.def.id}",
            CubeListBuilder.create().texOffs(${u}, ${v})
                .addBox(${boxX}F, ${boxY}F, ${boxZ}F, ${sx}F, ${sy}F, ${sz}F),
            ${pose});`;
    })
    .join("\n\n");

  // 実在する部位に対してのみアニメコードを生成する（コンパイル可能性を優先）
  const animLines: string[] = [];
  for (const p of parts) {
    const id = p.def.id;
    const ph =
      Math.abs(p.def.phase - Math.PI) < 0.05
        ? " + (float)Math.PI"
        : p.def.phase > 0.01
          ? ` + ${round2(p.def.phase)}F`
          : "";
    if (p.def.group === "head" && p.def.anim === "look") {
      animLines.push(`        this.${id}.yRot = netHeadYaw * ((float)Math.PI / 180F);`);
      animLines.push(`        this.${id}.xRot = headPitch * ((float)Math.PI / 180F);`);
    } else if (p.def.anim === "swing" && (p.def.group === "leg" || p.def.group === "arm")) {
      animLines.push(
        `        this.${id}.xRot = Mth.cos(limbSwing * 0.6662F${ph}) * ${round2(Math.min(1.4, p.def.amp * 2.2))}F * limbSwingAmount;`,
      );
    } else if (p.def.anim === "flap") {
      animLines.push(`        this.${id}.zRot = Mth.cos(ageInTicks * 0.35F${ph}) * ${round2(p.def.amp)}F;`);
    } else if (p.def.anim === "wag" || p.def.anim === "wave") {
      animLines.push(`        this.${id}.yRot = Mth.cos(ageInTicks * 0.27F${ph}) * ${round2(p.def.amp)}F;`);
    }
  }
  const animBlock = animLines.length
    ? animLines.join("\n")
    : "        // この型には自動アニメ対象の部位がありません";

  return `// Mobforge Java EntityModel 自動生成 (Mojmap)
// 対象: 1.20.1〜1.21.1。1.21.3+ は EntityRenderState 移行のため HierarchicalModel が使えません。
//
// ★正直な注意（必ず読むこと）:
// 1. 座標は Y軸反転(modelY = 24 - worldY)・回転のX/Y符号反転を変換済み。ただし左右ミラーは未検証。
//    ゲーム内で左右が逆なら Blockbench で .bbmodel を開いて確認するのが早い。
// 2. texOffs は「面ごとパッキング」の数値であり、addBox が前提とする box UV 配置とは一致しない。
//    → テクスチャを正しく貼るには同梱の .bbmodel を Blockbench で開き、UV を box UV に変換して再出力すること。
//    （形状・アニメの確認だけなら単色でもこのまま動く）
// 3. 階層は全パーツをroot直下に平坦化している。親子追従(attach)は手動で addOrReplaceChild を入れ子にすること。
package com.example.${mob.modId}.client.model;

import com.example.${mob.modId}.${cls}Entity;
import net.minecraft.client.model.HierarchicalModel;
import net.minecraft.client.model.geom.ModelLayerLocation;
import net.minecraft.client.model.geom.ModelPart;
import net.minecraft.client.model.geom.PartPose;
import net.minecraft.client.model.geom.builders.*;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.util.Mth;

public class ${cls}Model extends HierarchicalModel<${cls}Entity> {
    public static final ModelLayerLocation LAYER_LOCATION = new ModelLayerLocation(
        ResourceLocation.fromNamespaceAndPath("${mob.modId}", "${mob.entityId}"), "main"
    );

    private final ModelPart root;
${partDeclarations}

    public ${cls}Model(ModelPart root) {
        this.root = root;
${partInitializers}
    }

    public static LayerDefinition createBodyLayer() {
        MeshDefinition meshdefinition = new MeshDefinition();
        PartDefinition root = meshdefinition.getRoot();

${layerParts}

        return LayerDefinition.create(meshdefinition, ${tex.size}, ${tex.size});
    }

    @Override
    public void setupAnim(${cls}Entity entity, float limbSwing, float limbSwingAmount, float ageInTicks, float netHeadYaw, float headPitch) {
${animBlock}
    }

    @Override
    public ModelPart root() {
        return this.root;
    }
}
`;
}

// Java EntityRenderer クラス生成
export function javaEntityRenderer(mob: MobDraft): string {
  const cls = pascal(mob.entityId);
  return `// Mobforge Java EntityRenderer 自動生成
package com.example.${mob.modId}.client.renderer;

import com.example.${mob.modId}.${cls}Entity;
import com.example.${mob.modId}.client.model.${cls}Model;
import net.minecraft.client.renderer.entity.EntityRendererProvider;
import net.minecraft.client.renderer.entity.MobRenderer;
import net.minecraft.resources.ResourceLocation;

public class ${cls}Renderer extends MobRenderer<${cls}Entity, ${cls}Model> {
    private static final ResourceLocation TEXTURE = ResourceLocation.fromNamespaceAndPath("${mob.modId}", "textures/entity/${mob.entityId}.png");

    public ${cls}Renderer(EntityRendererProvider.Context context) {
        super(context, new ${cls}Model(context.bakeLayer(${cls}Model.LAYER_LOCATION)), ${round2((estimateHitbox(mob).width / 2) * 0.8)}F);
    }

    @Override
    public ResourceLocation getTextureLocation(${cls}Entity entity) {
        return TEXTURE;
    }
}
`;
}

// ===== Bedrock .mcaddon（そのまま導入可能を目指す本命） =====

// Bedrock 形式のルートテーブル（Java 形式とは別物）
export function bedrockLootTable(mob: MobDraft): string {
  const pools = mob.drops.map((d) => {
    const pool: Record<string, unknown> = {
      rolls: 1,
      entries: [
        {
          type: "item",
          name: d.item.includes(":") ? d.item : `minecraft:${d.item}`,
          weight: 1,
          functions: [{ function: "set_count", count: { min: d.min, max: d.max } }],
        },
      ],
    };
    if (d.chance < 1) pool.conditions = [{ condition: "random_chance", chance: round2(d.chance) }];
    return pool;
  });
  return JSON.stringify({ pools }, null, 2);
}

const BEDROCK_POP: Record<string, string> = {
  monster: "monster",
  creature: "animal",
  ambient: "ambient",
  water_creature: "water_animal",
  water_ambient: "water_animal",
  misc: "ambient",
};

function bedrockBiomeTags(mob: MobDraft): string[] {
  const map: [RegExp, string][] = [
    [/forest|grove|cherry|birch/, "forest"],
    [/taiga/, "taiga"],
    [/jungle|bamboo/, "jungle"],
    [/swamp|mangrove/, "swamp"],
    [/desert/, "desert"],
    [/badlands/, "mesa"],
    [/savanna/, "savanna"],
    [/ocean/, "ocean"],
    [/river/, "river"],
    [/beach|shore/, "beach"],
    [/peaks|slopes|meadow|stony/, "extreme_hills"],
    [/ice|frozen|snowy/, "frozen"],
    [/mushroom/, "mooshroom_island"],
    [/nether|crimson|warped|soul|basalt/, "nether"],
    [/end/, "the_end"],
    [/plains|sunflower/, "plains"],
  ];
  const tags = new Set<string>();
  for (const id of mob.spawn.biomes) {
    for (const [re, tag] of map) {
      if (re.test(id)) {
        tags.add(tag);
        break;
      }
    }
  }
  return [...tags];
}

export function spawnRulesJson(mob: MobDraft): string {
  const cond: Record<string, unknown> = {};
  if (mob.breathesWater) cond["minecraft:spawns_underwater"] = {};
  else if (mob.spawn.maxY < 60) cond["minecraft:spawns_underground"] = {};
  else cond["minecraft:spawns_on_surface"] = {};
  cond["minecraft:brightness_filter"] = {
    min: mob.spawn.minLight,
    max: mob.spawn.maxLight,
    adjust_for_weather: true,
  };
  if (mob.temperament === "hostile") cond["minecraft:difficulty_filter"] = { min: "easy" };
  cond["minecraft:weight"] = { default: mob.spawn.weight };
  cond["minecraft:herd"] = { min_size: mob.spawn.groupMin, max_size: mob.spawn.groupMax };
  cond["minecraft:height_filter"] = { min: mob.spawn.minY, max: mob.spawn.maxY };
  const tags = bedrockBiomeTags(mob);
  if (tags.length) {
    cond["minecraft:biome_filter"] = {
      any_of: tags.map((t) => ({ test: "has_biome_tag", operator: "==", value: t })),
    };
  }
  return JSON.stringify(
    {
      format_version: "1.8.0",
      "minecraft:spawn_rules": {
        description: {
          identifier: `${mob.modId}:${mob.entityId}`,
          population_control: BEDROCK_POP[mob.category] ?? "ambient",
        },
        conditions: [cond],
      },
    },
    null,
    2,
  );
}

function bedrockLangs(mob: MobDraft): { ja: string; en: string } {
  const key = `${mob.modId}:${mob.entityId}`;
  const en = `entity.${key}.name=${mob.displayNameEn || mob.displayName}\nitem.spawn_egg.entity.${key}.name=${mob.displayNameEn || mob.displayName} Spawn Egg\n`;
  const ja = `entity.${key}.name=${mob.displayName}\nitem.spawn_egg.entity.${key}.name=${mob.displayName}のスポーンエッグ\n`;
  return { ja, en };
}

function bpManifest(mob: MobDraft, bpUuid: string, moduleUuid: string, rpUuid: string): string {
  return JSON.stringify(
    {
      format_version: 2,
      header: {
        name: `${mob.displayName} BP (Mobforge)`,
        description: mob.summary || "Mobforge generated behavior pack",
        uuid: bpUuid,
        version: [1, 0, 0],
        min_engine_version: [1, 21, 0],
      },
      modules: [{ type: "data", uuid: moduleUuid, version: [1, 0, 0] }],
      dependencies: [{ uuid: rpUuid, version: [1, 0, 0] }],
    },
    null,
    2,
  );
}

function rpManifest(mob: MobDraft, rpUuid: string, moduleUuid: string): string {
  return JSON.stringify(
    {
      format_version: 2,
      header: {
        name: `${mob.displayName} RP (Mobforge)`,
        description: mob.summary || "Mobforge generated resource pack",
        uuid: rpUuid,
        version: [1, 0, 0],
        min_engine_version: [1, 21, 0],
      },
      modules: [{ type: "resources", uuid: moduleUuid, version: [1, 0, 0] }],
    },
    null,
    2,
  );
}

export async function buildMcaddon(mob: MobDraft): Promise<Blob> {
  const zip = new JSZip();
  const id = mob.entityId;
  const tex = drawTexture(mob);
  const png = await new Promise<Blob>((resolve, reject) => {
    tex.canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png");
  });
  const bpUuid = crypto.randomUUID();
  const rpUuid = crypto.randomUUID();
  const bp = `${id}_BP`;
  const rp = `${id}_RP`;
  zip.file(`${bp}/manifest.json`, bpManifest(mob, bpUuid, crypto.randomUUID(), rpUuid));
  zip.file(`${bp}/entities/${id}.json`, behaviorEntity(mob));
  zip.file(`${bp}/loot_tables/entities/${id}.json`, bedrockLootTable(mob));
  zip.file(`${bp}/spawn_rules/${id}.json`, spawnRulesJson(mob));
  zip.file(`${rp}/manifest.json`, rpManifest(mob, rpUuid, crypto.randomUUID()));
  zip.file(`${rp}/entity/${id}.entity.json`, clientEntity(mob));
  zip.file(`${rp}/models/entity/${id}.geo.json`, geometryJson(mob, tex.faces, tex.size));
  zip.file(`${rp}/animations/${id}.animation.json`, animationJson(mob));
  zip.file(`${rp}/animation_controllers/${id}.controllers.json`, animationController(mob));
  zip.file(`${rp}/textures/entity/${id}.png`, png);
  const langs = bedrockLangs(mob);
  zip.file(`${rp}/texts/en_US.lang`, langs.en);
  zip.file(`${rp}/texts/ja_JP.lang`, langs.ja);
  zip.file(`${rp}/texts/languages.json`, JSON.stringify(["en_US", "ja_JP"]));
  return zip.generateAsync({ type: "blob" });
}

// ===== 現実度レポート：どこまで「そのまま」使えるかを正直に示す =====
export interface RealityItem {
  target: string;
  level: "green" | "yellow" | "red";
  note: string;
}

export const REALITY_REPORT: RealityItem[] = [
  {
    target: "Fabric 1.21.11 プロジェクト一式",
    level: "green",
    note: "Mojmap・Identifier改名・ResourceKey登録・RenderState描画に対応した完全なGradleプロジェクト。gradle.properties の loader/fabric-api のバージョンだけ最新に直せば ./gradlew runClient で動く想定。",
  },
  {
    target: "モデル座標 / box UV テクスチャ",
    level: "green",
    note: "Y軸反転と回転符号を変換済み。親子階層も再現。テクスチャは box UV で詰めてあるので texOffs とピクセル単位で一致する。",
  },
  {
    target: "Bedrock .mcaddon",
    level: "green",
    note: "manifest付きBP+RP。インポートだけでスポーン・ドロップ・AI・モデルまで動作を想定。",
  },
  {
    target: "ルート / 言語 / .bbmodel",
    level: "green",
    note: "データ駆動ファイルはパスを合わせて置けばそのまま読まれる。.bbmodel は Blockbench でそのまま開ける。",
  },
  {
    target: "Gradle の依存バージョン",
    level: "yellow",
    note: "loader / fabric-api / loom のバージョンは日々変わるため固定値を置いてある。fabricmc.net/develop で 1.21.11 の値に要差し替え。",
  },
  {
    target: "多軸回転の部位",
    level: "yellow",
    note: "MC は Z→Y→X の順で回すが工房は X→Y→Z。角など2軸同時回転の部位はわずかにズレる可能性がある。",
  },
  {
    target: "カスタムGoal / 特殊能力",
    level: "red",
    note: "突進・召喚・転移・遠隔攻撃の弾は自作が必要。Entity.java 末尾の TODO に何を書くべきか列挙してある。",
  },
  {
    target: "旧版タブ (1.20.1 / NeoForge)",
    level: "red",
    note: "参考用の下書き。1.21.11 対応を優先しているため検証していない。",
  },
];

export async function buildPack(mob: MobDraft): Promise<Blob> {
  const zip = new JSZip();
  const id = mob.entityId;
  const mod = mob.modId;
  const tex = drawTexture(mob);
  const png = await new Promise<Blob>((resolve, reject) => {
    tex.canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png");
  });
  zip.file("README.txt", readme(mob));
  zip.file(`design/${id}.mobforge.json`, designJson(mob));
  zip.file(`models/${id}.bbmodel`, blockbenchModel(mob));
  // Fabric 1.21.11 プロジェクト一式（本命）
  const f11 = buildFabric12111Project(mob);
  for (const [path, content] of Object.entries(f11.files)) {
    zip.file(`fabric-1.21.11/${path}`, content);
  }
  const boxTex = drawBoxUVTexture(mob);
  const boxPng = await new Promise<Blob>((resolve, reject) => {
    boxTex.canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png");
  });
  zip.file(`fabric-1.21.11/${f11.texturePath}`, boxPng);
  zip.file(`java/fabric-1.20.1/${pascal(id)}Entity.java`, fabricJava(mob, "1.20.1"));
  zip.file(`java/fabric-1.21.1/${pascal(id)}Entity.java`, fabricJava(mob, "1.21.1"));
  zip.file(`java/neoforge-1.21.1/${pascal(id)}Entity.java`, neoJava(mob, "1.21.1"));
  zip.file(`java/neoforge-1.21.4/${pascal(id)}Entity.java`, neoJava(mob, "1.21.4"));
  zip.file(`data/${mod}/loot_table/entities/${id}.json`, lootTable(mob));
  zip.file(`data/${mod}/neoforge/biome_modifier/${id}.json`, biomeModifier(mob));
  const lang = langFiles(mob);
  zip.file(`assets/${mod}/lang/ja_jp.json`, lang.ja);
  zip.file(`assets/${mod}/lang/en_us.json`, lang.en);
  zip.file(`assets/${mod}/models/item/${id}_spawn_egg.json`, spawnEggModel());
  zip.file(`bedrock/entities/${id}.behavior.json`, behaviorEntity(mob));
  zip.file(`bedrock/spawn_rules/${id}.json`, spawnRulesJson(mob));
  zip.file(`bedrock/loot_tables/entities/${id}.json`, bedrockLootTable(mob));
  zip.file(`bedrock/entity/${id}.entity.json`, clientEntity(mob));
  zip.file(`bedrock/models/entity/${id}.geo.json`, geometryJson(mob, tex.faces, tex.size));
  zip.file(`bedrock/animations/${id}.animation.json`, animationJson(mob));
  zip.file(`bedrock/animation_controllers/${id}.controller.json`, animationController(mob));
  zip.file(`bedrock/textures/entity/${id}.png`, png);
  zip.file(
    `bedrock/uv-map.json`,
    JSON.stringify(
      tex.faces.map((f) => ({ part: f.partId, face: f.face, uv: [f.u, f.v], size: [f.w, f.h], color: f.color })),
      null,
      2,
    ),
  );
  return zip.generateAsync({ type: "blob" });
}
