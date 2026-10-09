import { drawBoxUVTexture, packBoxUV, type BoxUVAtlas, type BoxUVEntry } from "./mob-boxuv";
import { estimateHitbox, pascal, resolveParts, round2 } from "./mob-model";
import type { MobDraft, ResolvedPart } from "./mob-types";

/**
 * Minecraft 1.21.11 / Fabric / Mojang 公式マッピング 向けの生成器。
 *
 * 1.21.11 固有の確定事項（FabricMC 公式リファレンス実装で確認済み）:
 *  - ResourceLocation は Identifier に改名済み (net.minecraft.resources.Identifier)
 *  - EntityType 登録は ResourceKey 必須: Registry.register(BuiltInRegistries.ENTITY_TYPE, key, builder.build(key))
 *  - 属性は generic. 接頭辞なし (Attributes.MAX_HEALTH)
 *  - 描画は EntityRenderState 方式: MobRenderer<E, S, M> + createRenderState()
 *  - Yarn は 26.1 で廃止。1.21.11 は Mojmap で書くのが正解
 */

const MODEL_ORIGIN_Y = 24;

function javaId(id: string): string {
  const safe = id.replace(/[^A-Za-z0-9_]/g, "_");
  return /^[0-9]/.test(safe) ? `p${safe}` : safe;
}

function f(n: number): string {
  const v = round2(n);
  return `${v}F`;
}

interface Node {
  part: ResolvedPart;
  uv: BoxUVEntry;
  parent: Node | null;
  children: Node[];
}

function buildTree(mob: MobDraft, atlas: BoxUVAtlas): { roots: Node[]; all: Node[] } {
  const parts = resolveParts(mob);
  const nodes = new Map<string, Node>();
  for (const part of parts) {
    const uv = atlas.byId.get(part.def.id);
    if (!uv) continue;
    nodes.set(part.def.id, { part, uv, parent: null, children: [] });
  }
  const roots: Node[] = [];
  for (const node of nodes.values()) {
    const attach = node.part.def.attach;
    const parent = attach ? nodes.get(attach) : undefined;
    // 自己参照・循環を避ける
    if (parent && parent !== node) {
      let cursor: Node | null = parent;
      let cyclic = false;
      let depth = 0;
      while (cursor && depth < 8) {
        if (cursor === node) {
          cyclic = true;
          break;
        }
        cursor = cursor.parent;
        depth += 1;
      }
      if (!cyclic) {
        node.parent = parent;
        parent.children.push(node);
        continue;
      }
    }
    roots.push(node);
  }
  const all: Node[] = [];
  const walk = (list: Node[]) => {
    for (const n of list) {
      all.push(n);
      walk(n.children);
    }
  };
  walk(roots);
  return { roots, all };
}

/** root からのアクセス式。例: root.getChild("body").getChild("head") */
function accessPath(node: Node): string {
  const chain: string[] = [];
  let cursor: Node | null = node;
  while (cursor) {
    chain.unshift(cursor.part.def.id);
    cursor = cursor.parent;
  }
  return chain.map((id) => `.getChild("${id}")`).join("");
}

function emitMesh(node: Node, parentVar: string, out: string[], indent = 2) {
  const pad = "\t".repeat(indent);
  const p = node.part;
  const uv = node.uv;
  const myVar = `def_${javaId(p.def.id)}`;

  const px = p.pivot[0];
  const py = p.pivot[1];
  const pz = p.pivot[2];

  // ピボット位置（モデル空間は Y が下向き: modelY = 24 - worldY）
  let ox: number;
  let oy: number;
  let oz: number;
  if (node.parent) {
    const pp = node.parent.part.pivot;
    ox = px - pp[0];
    oy = pp[1] - py; // (24-py) - (24-ppy)
    oz = pz - pp[2];
  } else {
    ox = px;
    oy = MODEL_ORIGIN_Y - py;
    oz = pz;
  }

  // 箱の左上奥（モデル空間）をピボット基準で
  const bx = p.origin[0] - px;
  const by = py - p.origin[1] - uv.h;
  const bz = p.origin[2] - pz;

  const hasRot = p.def.rotation.some((n) => Math.abs(n) > 0.01);
  // Y 反転により X/Y/Z すべて符号が逆転する
  const rx = (-p.def.rotation[0] * Math.PI) / 180;
  const ry = (-p.def.rotation[1] * Math.PI) / 180;
  const rz = (-p.def.rotation[2] * Math.PI) / 180;

  const pose = hasRot
    ? `PartPose.offsetAndRotation(${f(ox)}, ${f(oy)}, ${f(oz)}, ${f(rx)}, ${f(ry)}, ${f(rz)})`
    : `PartPose.offset(${f(ox)}, ${f(oy)}, ${f(oz)})`;

  const decl = node.children.length > 0 ? `PartDefinition ${myVar} = ` : "";
  out.push(
    `${pad}${decl}${parentVar}.addOrReplaceChild("${p.def.id}",\n` +
      `${pad}\t\tCubeListBuilder.create().texOffs(${uv.u}, ${uv.v})\n` +
      `${pad}\t\t\t\t.addBox(${f(bx)}, ${f(by)}, ${f(bz)}, ${uv.w}, ${uv.h}, ${uv.d}),\n` +
      `${pad}\t\t${pose});`,
  );
  for (const child of node.children) emitMesh(child, myVar, out, indent);
}

function soundConst(id: string): string {
  const path = (id.split(":").pop() ?? "").trim();
  if (!path) return "";
  const stripped = path.replace(/^(entity|block|item|ambient|music|ui)\./, "");
  return stripped.replace(/[^a-z0-9]+/gi, "_").toUpperCase();
}

function itemConst(id: string): string {
  const path = id.split(":").pop() ?? "stick";
  return path.replace(/[^a-z0-9]+/gi, "_").toUpperCase();
}

const BIOME_KEYS: Record<string, string> = {
  plains: "PLAINS",
  sunflower_plains: "SUNFLOWER_PLAINS",
  forest: "FOREST",
  flower_forest: "FLOWER_FOREST",
  birch_forest: "BIRCH_FOREST",
  dark_forest: "DARK_FOREST",
  cherry_grove: "CHERRY_GROVE",
  taiga: "TAIGA",
  snowy_taiga: "SNOWY_TAIGA",
  old_growth_pine_taiga: "OLD_GROWTH_PINE_TAIGA",
  jungle: "JUNGLE",
  sparse_jungle: "SPARSE_JUNGLE",
  bamboo_jungle: "BAMBOO_JUNGLE",
  swamp: "SWAMP",
  mangrove_swamp: "MANGROVE_SWAMP",
  desert: "DESERT",
  badlands: "BADLANDS",
  wooded_badlands: "WOODED_BADLANDS",
  savanna: "SAVANNA",
  meadow: "MEADOW",
  grove: "GROVE",
  snowy_slopes: "SNOWY_SLOPES",
  jagged_peaks: "JAGGED_PEAKS",
  stony_peaks: "STONY_PEAKS",
  ice_spikes: "ICE_SPIKES",
  mushroom_fields: "MUSHROOM_FIELDS",
  ocean: "OCEAN",
  deep_ocean: "DEEP_OCEAN",
  lukewarm_ocean: "LUKEWARM_OCEAN",
  warm_ocean: "WARM_OCEAN",
  cold_ocean: "COLD_OCEAN",
  frozen_ocean: "FROZEN_OCEAN",
  river: "RIVER",
  beach: "BEACH",
  stony_shore: "STONY_SHORE",
  dripstone_caves: "DRIPSTONE_CAVES",
  lush_caves: "LUSH_CAVES",
  deep_dark: "DEEP_DARK",
  pale_garden: "PALE_GARDEN",
  nether_wastes: "NETHER_WASTES",
  soul_sand_valley: "SOUL_SAND_VALLEY",
  crimson_forest: "CRIMSON_FOREST",
  warped_forest: "WARPED_FOREST",
  basalt_deltas: "BASALT_DELTAS",
  the_end: "THE_END",
  end_highlands: "END_HIGHLANDS",
  end_midlands: "END_MIDLANDS",
  small_end_islands: "SMALL_END_ISLANDS",
};

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

function parentClass(mob: MobDraft): "Monster" | "WaterAnimal" | "PathfinderMob" {
  if (mob.category === "monster" || mob.temperament === "hostile") return "Monster";
  if (mob.breathesWater) return "WaterAnimal";
  return "PathfinderMob";
}

// ===== 個別ファイル生成 =====

export function entityClass(mob: MobDraft, pkg: string): string {
  const cls = pascal(mob.entityId);
  const parent = parentClass(mob);
  const attrBase = parent === "Monster" ? "Monster.createMonsterAttributes()" : "Mob.createMobAttributes()";

  const attrs: string[] = [
    `\t\t\t\t.add(Attributes.MAX_HEALTH, ${round2(mob.health)})`,
    `\t\t\t\t.add(Attributes.MOVEMENT_SPEED, ${round2(mob.movementSpeed)})`,
    `\t\t\t\t.add(Attributes.ATTACK_DAMAGE, ${round2(mob.attackDamage)})`,
    `\t\t\t\t.add(Attributes.ARMOR, ${round2(mob.armor)})`,
    `\t\t\t\t.add(Attributes.ARMOR_TOUGHNESS, ${round2(mob.armorToughness)})`,
    `\t\t\t\t.add(Attributes.FOLLOW_RANGE, ${round2(mob.followRange)})`,
    `\t\t\t\t.add(Attributes.KNOCKBACK_RESISTANCE, ${round2(mob.knockbackResistance)})`,
    `\t\t\t\t.add(Attributes.ATTACK_KNOCKBACK, ${round2(mob.attackKnockback)})`,
  ];
  if (mob.canFly) attrs.push(`\t\t\t\t.add(Attributes.FLYING_SPEED, ${round2(mob.flyingSpeed)})`);
  if (Math.abs(mob.scale - 1) > 0.02) {
    attrs.push(`\t\t\t\t.add(Attributes.SCALE, ${round2(mob.scale)}) // 当たり判定ごと拡大する場合`);
  }

  const goals: string[] = [];
  const todo: string[] = [];
  const add = (p: number, g: string) => goals.push(`\t\tthis.goalSelector.addGoal(${p}, ${g});`);
  const tgt = (p: number, g: string) => goals.push(`\t\tthis.targetSelector.addGoal(${p}, ${g});`);

  if (mob.behaviors.includes("swim") || mob.canSwim) add(0, "new FloatGoal(this)");
  if (mob.behaviors.includes("flee")) add(1, "new AvoidEntityGoal<>(this, Player.class, 8.0F, 1.2, 1.4)");
  if (mob.behaviors.includes("melee")) add(2, "new MeleeAttackGoal(this, 1.2, false)");
  if (mob.behaviors.includes("tempt")) {
    add(3, `new TemptGoal(this, 1.1, Ingredient.of(Items.${itemConst(mob.foodItem)}), false)`);
  }
  if (mob.canFly || mob.behaviors.includes("fly_wander")) add(6, "new WaterAvoidingRandomFlyingGoal(this, 1.0)");
  else if (mob.behaviors.includes("wander") || mob.behaviors.includes("water_nav")) {
    add(7, "new WaterAvoidingRandomStrollGoal(this, 1.0)");
  }
  if (mob.behaviors.includes("look")) {
    add(8, "new LookAtPlayerGoal(this, Player.class, 8.0F)");
    add(9, "new RandomLookAroundGoal(this)");
  }
  if (mob.temperament !== "passive") tgt(1, "new HurtByTargetGoal(this)");
  if (mob.temperament === "hostile") tgt(2, "new NearestAttackableTargetGoal<>(this, Player.class, true)");

  if (mob.behaviors.includes("ranged")) todo.push("遠隔攻撃: RangedAttackGoal + 自作の弾エンティティが必要");
  if (mob.behaviors.includes("breed")) todo.push("繁殖: Animal を継承しないと BreedGoal は使えない");
  if (mob.behaviors.includes("tame") || mob.tameable) todo.push("手懐け: TamableAnimal 継承と SitGoal/FollowOwnerGoal が必要");
  for (const b of ["charge", "teleport", "summon", "ambush", "explode", "pack"]) {
    if (mob.behaviors.includes(b)) todo.push(`${b}: 自作 Goal が必要（バニラに相当品なし）`);
  }
  for (const a of mob.abilities) {
    todo.push(`能力 ${a.id} (強度${a.power}): doHurtTarget / tick でのエフェクト付与を自作`);
  }

  const todoBlock = todo.length
    ? todo.map((t) => `\t// TODO: ${t}`).join("\n")
    : "\t// 追加実装が必要な項目はありません";

  const sounds: string[] = [];
  const amb = soundConst(mob.sounds.ambient);
  const hurt = soundConst(mob.sounds.hurt);
  const death = soundConst(mob.sounds.death);
  const step = soundConst(mob.sounds.step);
  if (amb) {
    sounds.push(`\t@Override
	protected SoundEvent getAmbientSound() {
		return SoundEvents.${amb};
	}`);
  }
  if (hurt) {
    sounds.push(`\t@Override
	protected SoundEvent getHurtSound(DamageSource source) {
		return SoundEvents.${hurt};
	}`);
  }
  if (death) {
    sounds.push(`\t@Override
	protected SoundEvent getDeathSound() {
		return SoundEvents.${death};
	}`);
  }
  if (step) {
    sounds.push(`\t@Override
	protected void playStepSound(BlockPos pos, BlockState state) {
		this.playSound(SoundEvents.${step}, 0.15F, 1.0F);
	}`);
  }

  const fireImmune = mob.fireImmune
    ? `
	@Override
	public boolean fireImmune() {
		return true;
	}
`
    : "";

  const climb = mob.canClimb
    ? `
	@Override
	public void tick() {
		super.tick();
		if (!this.level().isClientSide()) {
			this.setClimbing(this.horizontalCollision);
		}
	}

	@Override
	public boolean onClimbable() {
		return this.climbing;
	}

	private boolean climbing;

	private void setClimbing(boolean value) {
		this.climbing = value;
	}
`
    : "";

  return `package ${pkg}.entity;

import net.minecraft.core.BlockPos;
import net.minecraft.sounds.SoundEvent;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.Mob;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.ai.goal.*;
import net.minecraft.world.entity.ai.goal.target.HurtByTargetGoal;
import net.minecraft.world.entity.ai.goal.target.NearestAttackableTargetGoal;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.animal.WaterAnimal;
import net.minecraft.world.entity.PathfinderMob;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Items;
import net.minecraft.world.item.crafting.Ingredient;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.state.BlockState;

/**
 * ${mob.displayName} (${mob.displayNameEn})
 * ${mob.summary.replace(/\n/g, " ")}
 *
 * 生成: Mobforge / Minecraft 1.21.11 / Fabric / Mojang 公式マッピング
 */
public class ${cls}Entity extends ${parent} {
	public ${cls}Entity(EntityType<? extends ${cls}Entity> type, Level level) {
		super(type, level);
		this.xpReward = ${Math.max(0, Math.round(mob.xp))};
	}

	public static AttributeSupplier.Builder createAttributes() {
		return ${attrBase}
${attrs.join("\n")};
	}

	@Override
	protected void registerGoals() {
${goals.length ? goals.join("\n") : "\t\t// 行動が未選択です"}
	}
${fireImmune}${climb}
${sounds.join("\n\n")}

	// ===== 未実装メモ =====
${todoBlock}
}
`;
}

export function entityTypesClass(mob: MobDraft, pkg: string): string {
  const cls = pascal(mob.entityId);
  const box = estimateHitbox(mob);
  const biomeList = mob.spawn.biomes
    .map((id) => BIOME_KEYS[id])
    .filter(Boolean)
    .map((k) => `Biomes.${k}`);
  const biomeExpr = biomeList.length ? biomeList.join(", ") : "Biomes.PLAINS";
  const placementType = mob.breathesWater && !mob.canFly ? "IN_WATER" : "ON_GROUND";

  return `package ${pkg};

import ${pkg}.entity.${cls}Entity;

import net.minecraft.core.Registry;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.Identifier;
import net.minecraft.resources.ResourceKey;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.Mob;
import net.minecraft.world.entity.MobCategory;
import net.minecraft.world.entity.SpawnPlacementTypes;
import net.minecraft.world.entity.SpawnPlacements;
import net.minecraft.world.level.LightLayer;
import net.minecraft.world.level.biome.Biomes;
import net.minecraft.world.level.levelgen.Heightmap;

import net.fabricmc.fabric.api.biome.v1.BiomeModifications;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;
import net.fabricmc.fabric.api.object.builder.v1.entity.FabricDefaultAttributeRegistry;

public final class ModEntityTypes {
	public static final EntityType<${cls}Entity> ${cls.toUpperCase()} = register(
			"${mob.entityId}",
			EntityType.Builder.<${cls}Entity>of(${cls}Entity::new, MobCategory.${mobCategory(mob)})
					.sized(${f(box.width)}, ${f(box.height)})
					.eyeHeight(${f(box.eye)})
					.clientTrackingRange(${mob.bossBar ? 16 : 10})
	);

	private static <T extends Entity> EntityType<T> register(String name, EntityType.Builder<T> builder) {
		ResourceKey<EntityType<?>> key = ResourceKey.create(
				Registries.ENTITY_TYPE,
				Identifier.fromNamespaceAndPath(${pascal(mob.modId)}Mod.MOD_ID, name)
		);
		return Registry.register(BuiltInRegistries.ENTITY_TYPE, key, builder.build(key));
	}

	public static void registerAll() {
		// クラスロードのきっかけ用
	}

	public static void registerAttributes() {
		FabricDefaultAttributeRegistry.register(${cls.toUpperCase()}, ${cls}Entity.createAttributes());
	}

	public static void registerSpawning() {
		SpawnPlacements.register(
				${cls.toUpperCase()},
				SpawnPlacementTypes.${placementType},
				Heightmap.Types.MOTION_BLOCKING_NO_LEAVES,
				(type, level, reason, pos, random) -> {
					int light = level.getBrightness(LightLayer.BLOCK, pos);
					if (light < ${mob.spawn.minLight} || light > ${mob.spawn.maxLight}) return false;
					if (pos.getY() < ${mob.spawn.minY} || pos.getY() > ${mob.spawn.maxY}) return false;
					return Mob.checkMobSpawnRules(type, level, reason, pos, random);
				}
		);

		BiomeModifications.addSpawn(
				BiomeSelectors.includeByKey(${biomeExpr}),
				MobCategory.${mobCategory(mob)},
				${cls.toUpperCase()},
				${mob.spawn.weight},
				${mob.spawn.groupMin},
				${mob.spawn.groupMax}
		);
	}

	private ModEntityTypes() {
	}
}
`;
}

export function itemsClass(mob: MobDraft, pkg: string): string {
  const cls = pascal(mob.entityId);
  return `package ${pkg};

import net.minecraft.core.Registry;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.Identifier;
import net.minecraft.resources.ResourceKey;
import net.minecraft.world.item.CreativeModeTabs;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.SpawnEggItem;

import net.fabricmc.fabric.api.itemgroup.v1.ItemGroupEvents;

public final class ModItems {
	public static final ResourceKey<Item> ${cls.toUpperCase()}_SPAWN_EGG_KEY = ResourceKey.create(
			Registries.ITEM,
			Identifier.fromNamespaceAndPath(${pascal(mob.modId)}Mod.MOD_ID, "${mob.entityId}_spawn_egg")
	);

	public static final Item ${cls.toUpperCase()}_SPAWN_EGG = Registry.register(
			BuiltInRegistries.ITEM,
			${cls.toUpperCase()}_SPAWN_EGG_KEY,
			new SpawnEggItem(new Item.Properties()
					.spawnEgg(ModEntityTypes.${cls.toUpperCase()})
					.setId(${cls.toUpperCase()}_SPAWN_EGG_KEY))
	);

	public static void registerAll() {
		ItemGroupEvents.modifyEntriesEvent(CreativeModeTabs.SPAWN_EGGS)
				.register(entries -> entries.accept(${cls.toUpperCase()}_SPAWN_EGG));
	}

	private ModItems() {
	}
}
`;
}

export function mainClass(mob: MobDraft, pkg: string): string {
  const M = pascal(mob.modId);
  return `package ${pkg};

import net.fabricmc.api.ModInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ${M}Mod implements ModInitializer {
	public static final String MOD_ID = "${mob.modId}";
	public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

	@Override
	public void onInitialize() {
		ModEntityTypes.registerAll();
		ModEntityTypes.registerAttributes();
		ModEntityTypes.registerSpawning();
		ModItems.registerAll();
		LOGGER.info("Mobforge: {} ready", MOD_ID);
	}
}
`;
}

export function renderStateClass(mob: MobDraft, pkg: string): string {
  const cls = pascal(mob.entityId);
  return `package ${pkg}.client;

import net.minecraft.client.renderer.entity.state.LivingEntityRenderState;

/**
 * 1.21.2 以降、描画はエンティティ本体ではなく RenderState を経由する。
 * 独自データを描画に使いたい場合はここにフィールドを足し、
 * Renderer#extractRenderState でコピーする。
 */
public class ${cls}RenderState extends LivingEntityRenderState {
}
`;
}

export function modelClass(mob: MobDraft, pkg: string): string {
  const cls = pascal(mob.entityId);
  const atlas = packBoxUV(mob);
  const { roots, all } = buildTree(mob, atlas);

  const meshLines: string[] = [];
  for (const root of roots) emitMesh(root, "root", meshLines);

  // アニメ対象の部位だけフィールドにする
  const animated = all.filter((n) => {
    const a = n.part.def.anim;
    return a === "look" || a === "swing" || a === "flap" || a === "wag" || a === "wave" || a === "bob";
  });

  const fields = animated.map((n) => `\tprivate final ModelPart ${javaId(n.part.def.id)};`).join("\n");
  const assigns = animated
    .map((n) => `\t\tthis.${javaId(n.part.def.id)} = root${accessPath(n)};`)
    .join("\n");

  const anim: string[] = [];
  for (const n of animated) {
    const id = javaId(n.part.def.id);
    const d = n.part.def;
    const phase =
      Math.abs(d.phase - Math.PI) < 0.05 ? " + Mth.PI" : d.phase > 0.01 ? ` + ${round2(d.phase)}F` : "";
    if (d.anim === "look") {
      anim.push(`\t\tthis.${id}.yRot = state.yRot * Mth.DEG_TO_RAD;`);
      anim.push(`\t\tthis.${id}.xRot = state.xRot * Mth.DEG_TO_RAD;`);
    } else if (d.anim === "swing") {
      const amp = round2(Math.min(1.45, d.amp * 2.2));
      anim.push(
        `\t\tthis.${id}.xRot = Mth.cos(state.walkAnimationPos * 0.6662F${phase}) * ${amp}F * state.walkAnimationSpeed;`,
      );
    } else if (d.anim === "flap") {
      anim.push(`\t\tthis.${id}.zRot = Mth.cos(state.ageInTicks * 0.35F${phase}) * ${round2(d.amp)}F;`);
    } else if (d.anim === "wag" || d.anim === "wave") {
      anim.push(`\t\tthis.${id}.yRot = Mth.cos(state.ageInTicks * 0.27F${phase}) * ${round2(d.amp)}F;`);
    } else if (d.anim === "bob") {
      anim.push(`\t\tthis.${id}.y += Mth.cos(state.ageInTicks * 0.14F${phase}) * 0.35F;`);
    }
  }

  return `package ${pkg}.client;

import net.minecraft.client.model.EntityModel;
import net.minecraft.client.model.geom.ModelPart;
import net.minecraft.client.model.geom.PartPose;
import net.minecraft.client.model.geom.builders.CubeListBuilder;
import net.minecraft.client.model.geom.builders.LayerDefinition;
import net.minecraft.client.model.geom.builders.MeshDefinition;
import net.minecraft.client.model.geom.builders.PartDefinition;
import net.minecraft.util.Mth;

/**
 * ${mob.displayName} のモデル。
 *
 * 座標について:
 *  - モデル空間は Y が下向き（足元が y=24、頭上が y=0 付近）。工房の値から変換済み。
 *  - 回転は Y 反転にあわせて X/Y/Z すべて符号を反転済み。
 *  - 複数軸を同時に回す部位は、適用順の違い（MC は Z→Y→X）でわずかにズレることがある。
 *  - UV は box UV 方式で詰めてあるので、同梱の ${mob.entityId}.png をそのまま使えば一致する。
 *    テクスチャサイズ: ${atlas.size} x ${atlas.size}
 */
public class ${cls}Model extends EntityModel<${cls}RenderState> {
${fields || "\t// アニメーションする部位はありません"}

	public ${cls}Model(ModelPart root) {
		super(root);
${assigns}
	}

	public static LayerDefinition getTexturedModelData() {
		MeshDefinition mesh = new MeshDefinition();
		PartDefinition root = mesh.getRoot();

${meshLines.join("\n\n")}

		return LayerDefinition.create(mesh, ${atlas.size}, ${atlas.size});
	}

	@Override
	public void setupAnim(${cls}RenderState state) {
		super.setupAnim(state);

${anim.length ? anim.join("\n") : "\t\t// 自動アニメーションなし"}
	}
}
`;
}

export function rendererClass(mob: MobDraft, pkg: string): string {
  const cls = pascal(mob.entityId);
  const box = estimateHitbox(mob);
  const shadow = round2(Math.min(1.2, Math.max(0.2, box.width * 0.45)));
  const needScale = Math.abs(mob.scale - 1) > 0.02;
  const scaleBlock = needScale
    ? `
	@Override
	protected void scale(${cls}RenderState state, PoseStack pose) {
		pose.scale(${f(mob.scale)}, ${f(mob.scale)}, ${f(mob.scale)});
	}
`
    : "";
  const imports = needScale ? "import com.mojang.blaze3d.vertex.PoseStack;\n" : "";

  return `package ${pkg}.client;

${imports}import ${pkg}.${pascal(mob.modId)}Mod;
import ${pkg}.entity.${cls}Entity;

import net.minecraft.client.renderer.entity.EntityRendererProvider;
import net.minecraft.client.renderer.entity.MobRenderer;
import net.minecraft.resources.Identifier;

public class ${cls}Renderer extends MobRenderer<${cls}Entity, ${cls}RenderState, ${cls}Model> {
	private static final Identifier TEXTURE = Identifier.fromNamespaceAndPath(
			${pascal(mob.modId)}Mod.MOD_ID, "textures/entity/${mob.entityId}.png"
	);

	public ${cls}Renderer(EntityRendererProvider.Context context) {
		super(context, new ${cls}Model(context.bakeLayer(ModEntityModelLayers.${cls.toUpperCase()})), ${f(shadow)});
	}

	@Override
	public ${cls}RenderState createRenderState() {
		return new ${cls}RenderState();
	}

	@Override
	public Identifier getTextureLocation(${cls}RenderState state) {
		return TEXTURE;
	}
${scaleBlock}}
`;
}

export function modelLayersClass(mob: MobDraft, pkg: string): string {
  const cls = pascal(mob.entityId);
  return `package ${pkg}.client;

import ${pkg}.${pascal(mob.modId)}Mod;

import net.minecraft.client.model.geom.ModelLayerLocation;
import net.minecraft.resources.Identifier;

import net.fabricmc.fabric.api.client.rendering.v1.EntityModelLayerRegistry;

public final class ModEntityModelLayers {
	public static final ModelLayerLocation ${cls.toUpperCase()} = new ModelLayerLocation(
			Identifier.fromNamespaceAndPath(${pascal(mob.modId)}Mod.MOD_ID, "${mob.entityId}"), "main"
	);

	public static void registerAll() {
		// 注: Fabric API 26.1 以降はこのクラスが ModelLayerRegistry に改名されている。
		// 1.21.11 では EntityModelLayerRegistry が正しい。
		EntityModelLayerRegistry.registerModelLayer(${cls.toUpperCase()}, ${cls}Model::getTexturedModelData);
	}

	private ModEntityModelLayers() {
	}
}
`;
}

export function clientMainClass(mob: MobDraft, pkg: string): string {
  const cls = pascal(mob.entityId);
  const M = pascal(mob.modId);
  return `package ${pkg}.client;

import ${pkg}.ModEntityTypes;

import net.fabricmc.api.ClientModInitializer;
import net.minecraft.client.renderer.entity.EntityRenderers;

public class ${M}ModClient implements ClientModInitializer {
	@Override
	public void onInitializeClient() {
		ModEntityModelLayers.registerAll();
		EntityRenderers.register(ModEntityTypes.${cls.toUpperCase()}, ${cls}Renderer::new);
	}
}
`;
}

function fabricModJson(mob: MobDraft, pkg: string): string {
  const M = pascal(mob.modId);
  return JSON.stringify(
    {
      schemaVersion: 1,
      id: mob.modId,
      version: "1.0.0",
      name: mob.displayName,
      description: mob.summary || `Mobforge generated mob: ${mob.displayName}`,
      authors: ["Mobforge"],
      license: "MIT",
      environment: "*",
      entrypoints: {
        main: [`${pkg}.${M}Mod`],
        client: [`${pkg}.client.${M}ModClient`],
      },
      depends: {
        fabricloader: ">=0.17.0",
        minecraft: "~1.21.11",
        java: ">=21",
        "fabric-api": "*",
      },
    },
    null,
    2,
  );
}

function buildGradle(): string {
  return `// Minecraft 1.21.11 / Fabric / Mojang 公式マッピング
// ※ loom と依存のバージョンは https://fabricmc.net/develop/ で最新を確認してください。
plugins {
	id 'fabric-loom' version '1.11-SNAPSHOT'
	id 'maven-publish'
}

version = project.mod_version
group = project.maven_group

base {
	archivesName = project.archives_base_name
}

repositories {
	mavenCentral()
}

dependencies {
	minecraft "com.mojang:minecraft:\${project.minecraft_version}"
	// 1.21.11 は最後の難読化バージョン。Yarn は 26.1 で廃止されたため公式マッピングを使う。
	mappings loom.officialMojangMappings()
	modImplementation "net.fabricmc:fabric-loader:\${project.loader_version}"
	modImplementation "net.fabricmc.fabric-api:fabric-api:\${project.fabric_version}"
}

processResources {
	inputs.property "version", project.version
	filesMatching("fabric.mod.json") {
		expand "version": project.version
	}
}

tasks.withType(JavaCompile).configureEach {
	it.options.release = 21
}

java {
	withSourcesJar()
	sourceCompatibility = JavaVersion.VERSION_21
	targetCompatibility = JavaVersion.VERSION_21
}
`;
}

function gradleProperties(mob: MobDraft): string {
  return `org.gradle.jvmargs=-Xmx2G
org.gradle.parallel=true

# ↓ 必ず https://fabricmc.net/develop/ で 1.21.11 向けの最新値に差し替えてください
minecraft_version=1.21.11
loader_version=0.17.2
fabric_version=0.135.0+1.21.11

mod_version=1.0.0
maven_group=com.example.${mob.modId}
archives_base_name=${mob.modId}
`;
}

function lootTableJson(mob: MobDraft): string {
  const pools = mob.drops.map((d) => ({
    rolls: 1,
    entries: [
      {
        type: "minecraft:item",
        name: d.item.includes(":") ? d.item : `minecraft:${d.item}`,
        functions: [
          { function: "minecraft:set_count", count: { type: "minecraft:uniform", min: d.min, max: d.max } },
        ],
        conditions: [{ condition: "minecraft:random_chance", chance: round2(d.chance) }],
      },
    ],
  }));
  return JSON.stringify(
    { type: "minecraft:entity", pools: pools.length ? pools : [{ rolls: 1, entries: [{ type: "minecraft:empty" }] }] },
    null,
    2,
  );
}

export interface GeneratedProject {
  files: Record<string, string>;
  texturePath: string;
  atlasSize: number;
}

export function buildFabric12111Project(mob: MobDraft): GeneratedProject {
  const pkg = `com.example.${mob.modId}`;
  const dir = pkg.replace(/\./g, "/");
  const M = pascal(mob.modId);
  const cls = pascal(mob.entityId);
  const atlas = packBoxUV(mob);

  const files: Record<string, string> = {};
  files["build.gradle"] = buildGradle();
  files["gradle.properties"] = gradleProperties(mob);
  files["settings.gradle"] = `pluginManagement {
	repositories {
		maven { name = 'Fabric'; url = 'https://maven.fabricmc.net/' }
		mavenCentral()
		gradlePluginPortal()
	}
}
`;
  files[`src/main/resources/fabric.mod.json`] = fabricModJson(mob, pkg);
  files[`src/main/java/${dir}/${M}Mod.java`] = mainClass(mob, pkg);
  files[`src/main/java/${dir}/ModEntityTypes.java`] = entityTypesClass(mob, pkg);
  files[`src/main/java/${dir}/ModItems.java`] = itemsClass(mob, pkg);
  files[`src/main/java/${dir}/entity/${cls}Entity.java`] = entityClass(mob, pkg);
  files[`src/client/java/${dir}/client/${M}ModClient.java`] = clientMainClass(mob, pkg);
  files[`src/client/java/${dir}/client/ModEntityModelLayers.java`] = modelLayersClass(mob, pkg);
  files[`src/client/java/${dir}/client/${cls}RenderState.java`] = renderStateClass(mob, pkg);
  files[`src/client/java/${dir}/client/${cls}Model.java`] = modelClass(mob, pkg);
  files[`src/client/java/${dir}/client/${cls}Renderer.java`] = rendererClass(mob, pkg);

  files[`src/main/resources/assets/${mob.modId}/lang/ja_jp.json`] = JSON.stringify(
    {
      [`entity.${mob.modId}.${mob.entityId}`]: mob.displayName,
      [`item.${mob.modId}.${mob.entityId}_spawn_egg`]: `${mob.displayName}のスポーンエッグ`,
    },
    null,
    2,
  );
  files[`src/main/resources/assets/${mob.modId}/lang/en_us.json`] = JSON.stringify(
    {
      [`entity.${mob.modId}.${mob.entityId}`]: mob.displayNameEn || mob.displayName,
      [`item.${mob.modId}.${mob.entityId}_spawn_egg`]: `${mob.displayNameEn || mob.displayName} Spawn Egg`,
    },
    null,
    2,
  );
  // 1.21.4 以降のアイテムモデル定義
  files[`src/main/resources/assets/${mob.modId}/items/${mob.entityId}_spawn_egg.json`] = JSON.stringify(
    { model: { type: "minecraft:model", model: `${mob.modId}:item/${mob.entityId}_spawn_egg` } },
    null,
    2,
  );
  files[`src/main/resources/assets/${mob.modId}/models/item/${mob.entityId}_spawn_egg.json`] = JSON.stringify(
    { parent: "minecraft:item/template_spawn_egg" },
    null,
    2,
  );
  files[`src/main/resources/data/${mob.modId}/loot_table/entities/${mob.entityId}.json`] = lootTableJson(mob);

  files["README.md"] = `# ${mob.displayName} — Fabric 1.21.11

Mobforge が生成した Fabric Mod プロジェクトです。

## 使い方
1. \`gradle.properties\` の loader / fabric-api のバージョンを https://fabricmc.net/develop/ の **1.21.11** の値に差し替える
2. \`./gradlew build\` （初回は Gradle のダウンロードに時間がかかります）
3. \`./gradlew runClient\` で起動し、\`/summon ${mob.modId}:${mob.entityId}\` または スポーンエッグで確認

## このバージョン特有の注意
- **1.21.11 は最後の難読化バージョン**。Yarn は 26.1 で廃止されたため、本プロジェクトは **Mojang 公式マッピング** で書かれています。
- \`ResourceLocation\` は **\`Identifier\`** に改名済みです (\`net.minecraft.resources.Identifier\`)。
- 描画は **EntityRenderState 方式**です。モデルは \`EntityModel<${cls}RenderState>\`、レンダラーは \`MobRenderer<E, S, M>\` の3型引数です。
- 属性 ID から \`generic.\` は外れています（\`Attributes.MAX_HEALTH\`）。

## テクスチャ
\`assets/${mob.modId}/textures/entity/${mob.entityId}.png\` (${atlas.size}x${atlas.size}) は **box UV** で詰めてあり、
モデルの \`texOffs\` とピクセル単位で一致します。そのまま塗り替えて構いません。

## 手を入れる必要がある箇所
\`${cls}Entity.java\` の末尾 \`// TODO:\` を参照してください。
バニラ Goal で表現できない能力（突進・召喚・転移など）は自作が必要です。
`;

  return {
    files,
    texturePath: `src/main/resources/assets/${mob.modId}/textures/entity/${mob.entityId}.png`,
    atlasSize: atlas.size,
  };
}

export async function buildFabric12111Zip(mob: MobDraft): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const project = buildFabric12111Project(mob);
  for (const [path, content] of Object.entries(project.files)) {
    zip.file(path, content);
  }
  const { canvas } = drawBoxUVTexture(mob);
  const png = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png");
  });
  zip.file(project.texturePath, png);
  return zip.generateAsync({ type: "blob" });
}
