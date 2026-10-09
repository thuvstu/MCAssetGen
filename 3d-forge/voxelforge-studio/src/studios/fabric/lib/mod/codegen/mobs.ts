import type { ModProject } from "../model";
import { constName, d, i, indent as ind, namespaced as ns, number as num, q } from "./shared";
import type { KotlinBodyBuilder } from "./kotlin";

/** カスタムモブ + ハクスラ型ドロップ表 (ModMobs.kt)。Yarn名で書き、mojmapへは translateBody が変換 */
export function generateMobsKotlin(project: ModProject, build: KotlinBodyBuilder): string {
  const mobs = project.mobs ?? [];
  const tables = project.drops ?? [];
  const entry = (itemId: string, lo: unknown, hi: unknown, chance: unknown) =>
    `DropEntry(${q(ns(project, String(itemId)))}, ${i(num(lo, 1))}, ${i(Math.max(num(hi, 1), num(lo, 1)))}, ${d(Math.min(1, Math.max(0, num(chance, 1))))})`;
  const defines = mobs.map((mob) =>
    `define(MobSpec(${q(mob.id)}, EntityType.${constName(mob.baseMob || "ZOMBIE")}, ${q(mob.name || mob.id)}, ${d(num(mob.maxHealth, 20))}, ${d(num(mob.movementSpeed, 0.3))}, ${d(num(mob.attackDamage, 3))}, listOf(${(mob.drops ?? []).map((x) => entry(x.item, x.countMin, x.countMax, x.chance)).join(", ")})))`);
  const adds = tables.map((t) => {
    const target = t.targetMob === "ANY" ? "ANY" : (t.targetMob.includes(":") ? t.targetMob : `minecraft:${t.targetMob}`);
    return `dropTables.add(DropTable(${q(target)}, listOf(${(t.items ?? []).map((x) => entry(x.id, x.min, x.max, x.chance)).join(", ")})))`;
  });
  const body = `/** カスタムモブ (ベースMob + 名前/能力値/専用ドロップ) と、Mob別ドロップ表 (ハクスラ用) */
object ModMobs {
    class DropEntry(val itemId: String, val min: Int, val max: Int, val chance: Double)
    class MobSpec(val id: String, val base: EntityType<*>, val displayName: String, val maxHealth: Double, val speed: Double, val attackDamage: Double, val drops: List<DropEntry>)
    class DropTable(val target: String, val items: List<DropEntry>)

    private const val TAG_PREFIX = "mythicforge_mob_"
    private val specs = LinkedHashMap<String, MobSpec>()
    private val dropTables = ArrayList<DropTable>()

    fun ids(): List<String> = specs.keys.toList()

    private fun define(spec: MobSpec) {
        specs[spec.id] = spec
    }

    /** カスタムモブを座標に召喚する (名前・能力値・ドロップタグを適用) */
    fun spawn(id: String, world: ServerWorld, pos: Vec3d): MobEntity? {
        val spec = specs[id]
        if (spec == null) {
            ModInfo.LOGGER.warn("Unknown custom mob: " + id)
            return null
        }
        val entity = spec.base.create(world) as? MobEntity ?: return null
        entity.refreshPositionAfterTeleport(pos)
        entity.customName = Text.literal(spec.displayName)
        entity.isCustomNameVisible = true
        entity.getAttributeInstance(EntityAttributes.GENERIC_MAX_HEALTH)?.baseValue = spec.maxHealth
        entity.getAttributeInstance(EntityAttributes.GENERIC_MOVEMENT_SPEED)?.baseValue = spec.speed
        entity.getAttributeInstance(EntityAttributes.GENERIC_ATTACK_DAMAGE)?.baseValue = spec.attackDamage
        entity.health = spec.maxHealth.toFloat()
        entity.addCommandTag(TAG_PREFIX + spec.id)
        world.spawnEntity(entity)
        return entity
    }

    private fun rollDrops(world: ServerWorld, entity: LivingEntity, drops: List<DropEntry>) {
        for (entryItem in drops) {
            if (world.random.nextDouble() >= entryItem.chance) continue
            val item = Registries.ITEM.get(Identifier.of(entryItem.itemId))
            val span = entryItem.max - entryItem.min
            val count = entryItem.min + if (span > 0) world.random.nextInt(span + 1) else 0
            if (count <= 0) continue
            world.spawnEntity(ItemEntity(world, entity.x, entity.y + 0.5, entity.z, ItemStack(item, count)))
        }
    }

    fun register() {
${ind(defines.length ? defines : ["// (カスタムモブなし)"], 8).join("\n")}
${ind(adds.length ? adds : ["// (ドロップ表なし)"], 8).join("\n")}
        ServerLivingEntityEvents.AFTER_DEATH.register { entity, _ ->
            val world = entity.world as? ServerWorld ?: return@register
            for (tag in entity.commandTags) {
                if (tag.startsWith(TAG_PREFIX)) specs[tag.substring(TAG_PREFIX.length)]?.let { rollDrops(world, entity, it.drops) }
            }
            if (dropTables.isEmpty()) return@register
            val typeId = Registries.ENTITY_TYPE.getId(entity.type).toString()
            for (table in dropTables) {
                if (table.target == "ANY" || table.target == typeId) rollDrops(world, entity, table.items)
            }
        }
        ModInfo.LOGGER.info("Registered " + specs.size + " custom mobs, " + dropTables.size + " drop tables")
    }
}`;
  return build(project.meta.packageName, body);
}
