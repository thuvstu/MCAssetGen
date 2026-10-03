// Static Kotlin runtime files for the generated mod (Yarn mappings, Minecraft 1.21.1)

export function skillCoreKt(pkg: string, modId: string): string {
  return `package ${pkg}.skill

import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents
import net.minecraft.entity.Entity
import net.minecraft.entity.LivingEntity
import net.minecraft.nbt.NbtCompound
import net.minecraft.registry.RegistryWrapper
import net.minecraft.server.world.ServerWorld
import net.minecraft.util.math.Vec3d
import net.minecraft.world.PersistentState
import org.slf4j.LoggerFactory

/** スキル実行時のコンテキスト (MythicMobs の SkillMetadata 相当) */
data class SkillContext(
    val caster: Entity,
    val target: Entity?,
    val world: ServerWorld,
    val origin: Vec3d
)

/** ターゲッターが返す対象。エンティティ or 位置のみ */
data class SkillTarget(val entity: Entity?, val pos: Vec3d)

/** tick ベースの遅延実行スケジューラ */
object SkillScheduler {
    private val logger = LoggerFactory.getLogger("${modId}-skills")
    private val tasks = mutableListOf<Pair<Long, () -> Unit>>()
    private var tick = 0L

    fun init() {
        ServerTickEvents.END_SERVER_TICK.register { _ ->
            tick++
            if (tasks.isEmpty()) return@register
            val due = tasks.filter { it.first <= tick }
            if (due.isEmpty()) return@register
            tasks.removeAll { it.first <= tick }
            for (entry in due) {
                try {
                    entry.second.invoke()
                } catch (e: Exception) {
                    logger.error("Skill task failed", e)
                }
            }
        }
    }

    fun runLater(delay: Int, task: () -> Unit) {
        tasks.add(Pair(tick + delay.coerceAtLeast(1), task))
    }

    fun currentTick(): Long = tick
}

object SkillRuntime {
    private val cooldowns = HashMap<String, Long>()

    /** クールダウン中なら false */
    fun checkCooldown(skill: String, caster: Entity, seconds: Double): Boolean {
        if (seconds <= 0.0) return true
        val key = skill + ":" + caster.uuidAsString
        val now = SkillScheduler.currentTick()
        val until = cooldowns[key]
        if (until != null && until > now) return false
        cooldowns[key] = now + (seconds * 20.0).toLong()
        return true
    }

    fun contextOf(caster: Entity, target: Entity? = null, origin: Vec3d? = null): SkillContext? {
        val world = caster.world as? ServerWorld ?: return null
        return SkillContext(caster, target, world, origin ?: caster.pos)
    }

    /** <caster.name> <target.name> <caster.hp> プレースホルダ置換 */
    fun format(ctx: SkillContext, t: SkillTarget?, text: String): String {
        val targetName = t?.entity?.name?.string ?: ctx.target?.name?.string ?: ""
        val hp = (ctx.caster as? LivingEntity)?.health?.toInt()?.toString() ?: "0"
        var out = text
            .replace("<caster.name>", ctx.caster.name.string)
            .replace("<target.name>", targetName)
            .replace("<caster.hp>", hp)
        if (out.contains("<var.") || out.contains("<global.")) {
            out = VAR_PATTERN.replace(out) { m ->
                val owner = if (m.groupValues[1] == "global") null else ctx.caster
                Variables.format(Variables.get(ctx, owner, m.groupValues[2]))
            }
        }
        return out
    }

    private val VAR_PATTERN = Regex("<(var|global)\\\\.([A-Za-z0-9_]+)>")
}

/** 永続変数ストレージ (ワールドの data/${modId}_variables.dat に保存) */
class VariableState : PersistentState() {
    val data = HashMap<String, HashMap<String, Double>>()

    override fun writeNbt(nbt: NbtCompound, registryLookup: RegistryWrapper.WrapperLookup): NbtCompound {
        for ((owner, vars) in data) {
            val c = NbtCompound()
            for ((k, v) in vars) c.putDouble(k, v)
            nbt.put(owner, c)
        }
        return nbt
    }

    companion object {
        val TYPE: PersistentState.Type<VariableState> = PersistentState.Type(
            { VariableState() },
            { nbt, _ -> fromNbt(nbt) },
            null
        )

        fun fromNbt(nbt: NbtCompound): VariableState {
            val state = VariableState()
            for (owner in nbt.keys) {
                val c = nbt.getCompound(owner)
                val vars = HashMap<String, Double>()
                for (k in c.keys) vars[k] = c.getDouble(k)
                state.data[owner] = vars
            }
            return state
        }
    }
}

/** スキル変数 (MythicMobs の Variable 相当)。owner=null でグローバル */
object Variables {
    private fun state(ctx: SkillContext): VariableState =
        ctx.world.server.overworld.persistentStateManager.getOrCreate(VariableState.TYPE, "${modId}_variables")

    private fun key(owner: Entity?): String = owner?.uuidAsString ?: "global"

    fun get(ctx: SkillContext, owner: Entity?, name: String): Double =
        state(ctx).data[key(owner)]?.get(name) ?: 0.0

    fun set(ctx: SkillContext, owner: Entity?, name: String, value: Double) {
        if (owner == null && name.isEmpty()) return
        val st = state(ctx)
        st.data.getOrPut(key(owner)) { HashMap() }[name] = value
        st.markDirty()
    }

    fun add(ctx: SkillContext, owner: Entity?, name: String, amount: Double, min: Double, max: Double) {
        set(ctx, owner, name, (get(ctx, owner, name) + amount).coerceIn(min, max))
    }

    fun inRange(ctx: SkillContext, owner: Entity?, name: String, min: Double, max: Double): Boolean {
        val v = get(ctx, owner, name)
        return v >= min && v <= max
    }

    fun format(v: Double): String = if (v == Math.floor(v) && !v.isInfinite()) v.toLong().toString() else String.format("%.2f", v)
}
`;
}

export function targetersKt(pkg: string): string {
  return `package ${pkg}.skill

import net.minecraft.entity.LivingEntity
import net.minecraft.entity.player.PlayerEntity
import net.minecraft.entity.projectile.ProjectileUtil
import net.minecraft.util.hit.HitResult
import net.minecraft.util.math.Box
import net.minecraft.util.math.Vec3d
import kotlin.math.cos
import kotlin.math.sin

object Targeters {
    fun self(ctx: SkillContext): List<SkillTarget> = listOf(SkillTarget(ctx.caster, ctx.caster.pos))

    fun target(ctx: SkillContext): List<SkillTarget> {
        val t = ctx.target ?: return emptyList()
        return listOf(SkillTarget(t, t.pos))
    }

    fun nearestPlayer(ctx: SkillContext, radius: Double): List<SkillTarget> {
        val p = ctx.world.players
            .filter { it !== ctx.caster && it.isAlive && !it.isSpectator && it.squaredDistanceTo(ctx.origin) <= radius * radius }
            .minByOrNull { it.squaredDistanceTo(ctx.origin) } ?: return emptyList()
        return listOf(SkillTarget(p, p.pos))
    }

    fun origin(ctx: SkillContext): List<SkillTarget> = listOf(SkillTarget(null, ctx.origin))

    fun selfLocation(ctx: SkillContext): List<SkillTarget> = listOf(SkillTarget(null, ctx.caster.pos))

    fun targetLocation(ctx: SkillContext): List<SkillTarget> {
        val t = ctx.target ?: return emptyList()
        return listOf(SkillTarget(null, t.pos))
    }

    fun entitiesInRadius(ctx: SkillContext, radius: Double, playersOnly: Boolean): List<SkillTarget> {
        val box = Box.of(ctx.origin, radius * 2.0, radius * 2.0, radius * 2.0)
        val except = if (playersOnly) null else ctx.caster
        return ctx.world.getOtherEntities(except, box) { e ->
            e.isAlive && e is LivingEntity && e.squaredDistanceTo(ctx.origin) <= radius * radius &&
                (!playersOnly || e is PlayerEntity)
        }.map { SkillTarget(it, it.pos) }
    }

    fun lookEntity(ctx: SkillContext, range: Double): List<SkillTarget> {
        val caster = ctx.caster
        val start = caster.eyePos
        val dir = caster.rotationVector
        val end = start.add(dir.multiply(range))
        val box = caster.boundingBox.stretch(dir.multiply(range)).expand(1.0)
        val hit = ProjectileUtil.raycast(caster, start, end, box, { e -> !e.isSpectator && e.canHit() }, range * range)
            ?: return emptyList()
        val e = hit.entity
        return listOf(SkillTarget(e, e.pos))
    }

    fun lookBlock(ctx: SkillContext, range: Double): List<SkillTarget> {
        val hit = ctx.caster.raycast(range, 0.0f, false)
        return if (hit.type == HitResult.Type.BLOCK) listOf(SkillTarget(null, hit.pos)) else emptyList()
    }

    fun forward(ctx: SkillContext, distance: Double): List<SkillTarget> {
        val pos = ctx.caster.pos.add(ctx.caster.rotationVector.multiply(distance))
        return listOf(SkillTarget(null, pos))
    }

    fun ring(ctx: SkillContext, radius: Double, points: Int): List<SkillTarget> {
        val n = points.coerceAtLeast(1)
        return (0 until n).map { i ->
            val a = Math.PI * 2.0 * i / n
            SkillTarget(null, Vec3d(ctx.origin.x + cos(a) * radius, ctx.origin.y, ctx.origin.z + sin(a) * radius))
        }
    }
}
`;
}

export function conditionsKt(pkg: string): string {
  return `package ${pkg}.skill

import net.minecraft.entity.Entity
import net.minecraft.entity.LivingEntity
import net.minecraft.entity.effect.StatusEffect
import net.minecraft.entity.player.PlayerEntity
import net.minecraft.registry.Registries
import net.minecraft.registry.entry.RegistryEntry

object Conditions {
    fun healthPercent(e: Entity?, min: Double, max: Double): Boolean {
        val living = e as? LivingEntity ?: return false
        val pct = living.health.toDouble() / living.maxHealth.toDouble() * 100.0
        return pct >= min && pct <= max
    }

    fun sneaking(e: Entity?): Boolean = e?.isSneaking == true
    fun sprinting(e: Entity?): Boolean = e?.isSprinting == true
    fun onGround(e: Entity?): Boolean = e?.isOnGround == true
    fun inWater(e: Entity?): Boolean = e?.isTouchingWater == true
    fun burning(e: Entity?): Boolean = e?.isOnFire == true
    fun isPlayer(e: Entity?): Boolean = e is PlayerEntity
    fun isLiving(e: Entity?): Boolean = e is LivingEntity

    fun day(ctx: SkillContext): Boolean = ctx.world.isDay
    fun night(ctx: SkillContext): Boolean = ctx.world.isNight
    fun raining(ctx: SkillContext): Boolean = ctx.world.isRaining
    fun chance(ctx: SkillContext, p: Double): Boolean = ctx.world.random.nextDouble() < p

    fun holding(e: Entity?, itemId: String): Boolean {
        val living = e as? LivingEntity ?: return false
        return Registries.ITEM.getId(living.mainHandStack.item).toString() == itemId
    }

    fun entityType(e: Entity?, typeId: String): Boolean {
        if (e == null) return false
        return Registries.ENTITY_TYPE.getId(e.type).toString() == typeId
    }

    fun dimension(ctx: SkillContext, id: String): Boolean = ctx.world.registryKey.value.toString() == id

    fun altitude(e: Entity?, min: Double, max: Double): Boolean = e != null && e.y >= min && e.y <= max

    fun wearing(e: Entity?, itemId: String): Boolean {
        val living = e as? LivingEntity ?: return false
        return living.armorItems.any { Registries.ITEM.getId(it.item).toString() == itemId }
    }

    fun hasEffect(e: Entity?, effect: RegistryEntry<StatusEffect>): Boolean =
        (e as? LivingEntity)?.hasStatusEffect(effect) == true
}
`;
}

export function mechanicsKt(pkg: string): string {
  return `package ${pkg}.skill

import net.minecraft.entity.EntityType
import net.minecraft.entity.ItemEntity
import net.minecraft.entity.LivingEntity
import net.minecraft.entity.effect.StatusEffect
import net.minecraft.entity.effect.StatusEffectInstance
import net.minecraft.entity.player.PlayerEntity
import net.minecraft.entity.projectile.ProjectileEntity
import net.minecraft.item.ItemStack
import net.minecraft.network.packet.s2c.play.SubtitleS2CPacket
import net.minecraft.network.packet.s2c.play.TitleS2CPacket
import net.minecraft.particle.ParticleEffect
import net.minecraft.registry.Registries
import net.minecraft.registry.entry.RegistryEntry
import net.minecraft.server.network.ServerPlayerEntity
import net.minecraft.sound.SoundCategory
import net.minecraft.sound.SoundEvent
import net.minecraft.text.Text
import net.minecraft.util.Identifier
import net.minecraft.util.math.BlockPos
import net.minecraft.util.math.Box
import net.minecraft.world.World

object Mechanics {
    fun damage(ctx: SkillContext, t: SkillTarget, amount: Float, magic: Boolean) {
        val e = t.entity ?: return
        val caster = ctx.caster
        val sources = ctx.world.damageSources
        val source = when {
            magic || e === caster -> sources.magic()
            caster is PlayerEntity -> sources.playerAttack(caster)
            caster is LivingEntity -> sources.mobAttack(caster)
            else -> sources.magic()
        }
        e.damage(source, amount)
    }

    fun heal(t: SkillTarget, amount: Float) {
        (t.entity as? LivingEntity)?.heal(amount)
    }

    fun ignite(t: SkillTarget, ticks: Int) {
        t.entity?.setOnFireForTicks(ticks)
    }

    fun extinguish(t: SkillTarget) {
        t.entity?.extinguish()
    }

    fun potion(t: SkillTarget, effect: RegistryEntry<StatusEffect>, duration: Int, amplifier: Int, particles: Boolean) {
        (t.entity as? LivingEntity)?.addStatusEffect(StatusEffectInstance(effect, duration, amplifier, false, particles))
    }

    fun clearEffects(t: SkillTarget) {
        (t.entity as? LivingEntity)?.clearStatusEffects()
    }

    fun freeze(t: SkillTarget, ticks: Int) {
        t.entity?.frozenTicks = ticks
    }

    fun velocity(t: SkillTarget, x: Double, y: Double, z: Double) {
        val e = t.entity ?: return
        e.addVelocity(x, y, z)
        e.velocityModified = true
    }

    fun leap(t: SkillTarget, forward: Double, up: Double) {
        val e = t.entity ?: return
        val look = e.rotationVector
        e.addVelocity(look.x * forward, up, look.z * forward)
        e.velocityModified = true
    }

    fun push(ctx: SkillContext, t: SkillTarget, strength: Double, up: Double) {
        val e = t.entity ?: return
        var dir = e.pos.subtract(ctx.caster.pos)
        if (dir.lengthSquared() < 1.0E-4) dir = ctx.caster.rotationVector
        dir = dir.normalize()
        e.addVelocity(dir.x * strength, up, dir.z * strength)
        e.velocityModified = true
    }

    fun teleport(ctx: SkillContext, t: SkillTarget) {
        ctx.caster.requestTeleport(t.pos.x, t.pos.y, t.pos.z)
    }

    fun projectile(ctx: SkillContext, t: SkillTarget, kind: String, speed: Float) {
        val shooter = ctx.caster as? LivingEntity ?: return
        val from = shooter.eyePos
        val aim = t.pos.add(0.0, (t.entity?.height ?: 0.0f) * 0.5, 0.0)
        val dir = if (t.entity === shooter || aim.squaredDistanceTo(from) < 1.0) shooter.rotationVector
            else aim.subtract(from).normalize()
        val type: EntityType<out ProjectileEntity> = when (kind) {
            "snowball" -> EntityType.SNOWBALL
            "fireball" -> EntityType.SMALL_FIREBALL
            "large_fireball" -> EntityType.FIREBALL
            "wither_skull" -> EntityType.WITHER_SKULL
            "trident" -> EntityType.TRIDENT
            else -> EntityType.ARROW
        }
        val proj = type.create(ctx.world) ?: return
        proj.owner = shooter
        proj.refreshPositionAndAngles(from.x + dir.x, from.y + dir.y - 0.1, from.z + dir.z, shooter.yaw, shooter.pitch)
        proj.setVelocity(dir.x, dir.y, dir.z, speed, 1.0f)
        ctx.world.spawnEntity(proj)
    }

    fun summon(ctx: SkillContext, t: SkillTarget, typeId: String, amount: Int) {
        val type = EntityType.get(typeId).orElse(null) ?: return
        repeat(amount.coerceAtLeast(1)) {
            val e = type.create(ctx.world) ?: return@repeat
            e.refreshPositionAndAngles(t.pos.x, t.pos.y, t.pos.z, ctx.world.random.nextFloat() * 360.0f, 0.0f)
            ctx.world.spawnEntity(e)
        }
    }

    fun lightning(ctx: SkillContext, t: SkillTarget, cosmetic: Boolean) {
        val bolt = EntityType.LIGHTNING_BOLT.create(ctx.world) ?: return
        bolt.refreshPositionAfterTeleport(t.pos)
        bolt.setCosmetic(cosmetic)
        ctx.world.spawnEntity(bolt)
    }

    fun explosion(ctx: SkillContext, t: SkillTarget, power: Float, fire: Boolean, breakBlocks: Boolean) {
        val type = if (breakBlocks) World.ExplosionSourceType.TNT else World.ExplosionSourceType.NONE
        ctx.world.createExplosion(ctx.caster, t.pos.x, t.pos.y, t.pos.z, power, fire, type)
    }

    fun setBlock(ctx: SkillContext, t: SkillTarget, blockId: String) {
        val block = Registries.BLOCK.get(Identifier.of(blockId))
        ctx.world.setBlockState(BlockPos.ofFloored(t.pos), block.defaultState)
    }

    fun particles(ctx: SkillContext, t: SkillTarget, particle: ParticleEffect, count: Int, spread: Double, speed: Double, yOffset: Double) {
        ctx.world.spawnParticles(particle, t.pos.x, t.pos.y + yOffset, t.pos.z, count, spread, spread, spread, speed)
    }

    fun sound(ctx: SkillContext, t: SkillTarget, soundId: String, volume: Float, pitch: Float) {
        val event = SoundEvent.of(Identifier.of(soundId))
        ctx.world.playSound(null, t.pos.x, t.pos.y, t.pos.z, event, SoundCategory.PLAYERS, volume, pitch)
    }

    fun message(ctx: SkillContext, t: SkillTarget, text: String, actionBar: Boolean) {
        val player = t.entity as? PlayerEntity ?: return
        player.sendMessage(Text.literal(SkillRuntime.format(ctx, t, text)), actionBar)
    }

    fun title(ctx: SkillContext, t: SkillTarget, title: String, subtitle: String) {
        val player = t.entity as? ServerPlayerEntity ?: return
        if (subtitle.isNotEmpty()) {
            player.networkHandler.sendPacket(SubtitleS2CPacket(Text.literal(SkillRuntime.format(ctx, t, subtitle))))
        }
        player.networkHandler.sendPacket(TitleS2CPacket(Text.literal(SkillRuntime.format(ctx, t, title))))
    }

    fun giveItem(t: SkillTarget, itemId: String, amount: Int) {
        val player = t.entity as? PlayerEntity ?: return
        val item = Registries.ITEM.get(Identifier.of(itemId))
        player.giveItemStack(ItemStack(item, amount))
    }

    fun feed(t: SkillTarget, food: Int, saturation: Float) {
        (t.entity as? PlayerEntity)?.hungerManager?.add(food, saturation)
    }

    fun addXp(t: SkillTarget, amount: Int) {
        (t.entity as? PlayerEntity)?.addExperience(amount)
    }

    fun command(ctx: SkillContext, t: SkillTarget, cmd: String, asConsole: Boolean) {
        val server = ctx.world.server
        val source = if (asConsole) {
            server.commandSource.withWorld(ctx.world).withPosition(t.pos).withSilent()
        } else {
            (t.entity ?: ctx.caster).commandSource.withLevel(2).withSilent()
        }
        server.commandManager.executeWithPrefix(source, SkillRuntime.format(ctx, t, cmd))
    }

    fun beam(ctx: SkillContext, t: SkillTarget, particle: ParticleEffect, density: Double) {
        val from = ctx.caster.eyePos.subtract(0.0, 0.2, 0.0)
        val to = t.pos.add(0.0, (t.entity?.height ?: 0.0f) * 0.5, 0.0)
        val diff = to.subtract(from)
        val steps = (diff.length() * density).toInt().coerceIn(1, 400)
        for (i in 0..steps) {
            val p = from.add(diff.multiply(i.toDouble() / steps))
            ctx.world.spawnParticles(particle, p.x, p.y, p.z, 1, 0.0, 0.0, 0.0, 0.0)
        }
    }

    fun dropItem(ctx: SkillContext, t: SkillTarget, itemId: String, amount: Int) {
        val item = Registries.ITEM.get(Identifier.of(itemId))
        val entity = ItemEntity(ctx.world, t.pos.x, t.pos.y + 0.5, t.pos.z, ItemStack(item, amount.coerceAtLeast(1)))
        ctx.world.spawnEntity(entity)
    }

    fun remove(t: SkillTarget) {
        val e = t.entity ?: return
        if (e !is PlayerEntity) e.discard()
    }

    fun setHealthPercent(t: SkillTarget, percent: Float) {
        val e = t.entity as? LivingEntity ?: return
        e.health = (e.maxHealth * percent / 100.0f).coerceIn(0.0f, e.maxHealth)
    }

    /** tick ごとに移動する仮想弾。エンティティ or ブロックに当たると onHit を呼ぶ */
    fun missile(
        ctx: SkillContext, t: SkillTarget, speed: Double, maxTicks: Int, radius: Double, gravity: Double,
        particle: ParticleEffect, hitBlocks: Boolean, onHit: (SkillContext) -> Unit
    ) {
        val caster = ctx.caster
        val start = caster.eyePos.subtract(0.0, 0.2, 0.0)
        val aim = t.pos.add(0.0, (t.entity?.height ?: 0.0f) * 0.5, 0.0)
        val initial = if (t.entity === caster || aim.squaredDistanceTo(start) < 1.0) caster.rotationVector else aim.subtract(start).normalize()
        var pos = start
        var vel = initial.multiply(speed)
        var age = 0
        val world = ctx.world
        fun tick() {
            val steps = (vel.length() / 0.5).toInt().coerceIn(1, 10)
            val step = vel.multiply(1.0 / steps)
            for (i in 0 until steps) {
                pos = pos.add(step)
                world.spawnParticles(particle, pos.x, pos.y, pos.z, 1, 0.0, 0.0, 0.0, 0.0)
                val box = Box.of(pos, radius * 2.0, radius * 2.0, radius * 2.0)
                val hit = world.getOtherEntities(caster, box) { it is LivingEntity && it.isAlive && !it.isSpectator }.firstOrNull()
                if (hit != null) {
                    onHit(ctx.copy(target = hit, origin = pos))
                    return
                }
                val bp = BlockPos.ofFloored(pos)
                if (hitBlocks && !world.getBlockState(bp).getCollisionShape(world, bp).isEmpty) {
                    onHit(ctx.copy(target = null, origin = pos.subtract(step)))
                    return
                }
            }
            vel = vel.add(0.0, -gravity, 0.0)
            age++
            if (age >= maxTicks) {
                onHit(ctx.copy(target = null, origin = pos))
                return
            }
            SkillScheduler.runLater(1) { tick() }
        }
        tick()
    }

    fun repeatSkill(times: Int, interval: Int, action: (Int) -> Unit) {
        for (i in 0 until times.coerceAtLeast(1)) {
            if (i == 0) action(0) else SkillScheduler.runLater(i * interval.coerceAtLeast(1)) { action(i) }
        }
    }
}
`;
}
