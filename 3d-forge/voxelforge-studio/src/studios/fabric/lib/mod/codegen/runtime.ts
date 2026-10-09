import type { ModProject } from "../model";
import type { KotlinBodyBuilder } from "./kotlin";
import { number as num } from "./shared";

export function generateRuntimeKotlin(project: ModProject, build: KotlinBodyBuilder): string {
  const pkg = `${project.meta.packageName}.skill`;
  const body = `/** スキル発動時に渡されるコンテキスト */
enum class TargetMode { SELF, TARGET, AREA, POINT }

class SkillContext(
    val player: ServerPlayerEntity,
    val world: ServerWorld,
    private val explicitTarget: LivingEntity? = null,
    /** ミサイルの着弾点など。null の場合は自分の位置 */
    val origin: Vec3d? = null,
) {
    /** 視線の先にいる最も近い生き物 (明示指定があればそれを優先) */
    val target: LivingEntity? by lazy { explicitTarget ?: if (origin == null) findLookTarget(24.0) else null }

    /** 発動位置 (通常は自分の位置、ミサイル着弾時は着弾点) */
    val point: Vec3d
        get() = origin ?: player.pos

    private fun findLookTarget(range: Double): LivingEntity? {
        val look = player.rotationVector
        val start = player.eyePos
        val end = start.add(look.multiply(range))
        val box = player.boundingBox.stretch(look.multiply(range)).expand(1.0)
        var best: LivingEntity? = null
        var bestDist = Double.MAX_VALUE
        for (e in world.getOtherEntities(player, box) { it is LivingEntity && it.isAlive }) {
            val hit = e.boundingBox.expand(0.3).raycast(start, end)
            if (hit.isPresent) {
                val dist = start.squaredDistanceTo(hit.get())
                if (dist < bestDist) {
                    bestDist = dist
                    best = e as LivingEntity
                }
            }
        }
        return best
    }

    fun entities(mode: TargetMode, radius: Double): List<LivingEntity> = when (mode) {
        TargetMode.SELF -> listOf<LivingEntity>(player)
        TargetMode.TARGET -> listOfNotNull(target)
        TargetMode.AREA -> world.getEntitiesByClass(LivingEntity::class.java, player.boundingBox.expand(radius)) { it !== player && it.isAlive }
        TargetMode.POINT -> world.getEntitiesByClass(LivingEntity::class.java, Box.of(point, radius * 2.0, radius * 2.0, radius * 2.0)) { it !== player && it.isAlive }
    }

    /** パーティクル・雷・ブロック設置など「位置」を使うアクション用 */
    fun positions(mode: TargetMode, radius: Double): List<Vec3d> = when (mode) {
        TargetMode.POINT -> listOf(point)
        TargetMode.SELF -> listOf(player.pos)
        else -> entities(mode, radius).map { it.pos }
    }

    fun anchor(mode: TargetMode): Vec3d? = when (mode) {
        TargetMode.TARGET -> target?.pos
        TargetMode.POINT -> point
        else -> player.pos
    }
}

class Skill(
    val id: String,
    val displayName: String,
    val cooldownTicks: Int,
    val manaCost: Int,
    val condition: (SkillContext) -> Boolean,
    val run: (SkillContext) -> Unit,
)

/** 遅延実行スケジューラ (サーバーtickで駆動) */
object Scheduler {
    private class Task(var remaining: Int, val action: () -> Unit)

    private val tasks = ArrayList<Task>()

    fun schedule(ticks: Int, action: () -> Unit) {
        tasks.add(Task(ticks, action))
    }

    fun tick() {
        if (tasks.isEmpty()) return
        val due = ArrayList<Task>()
        for (t in tasks) {
            t.remaining -= 1
            if (t.remaining <= 0) due.add(t)
        }
        tasks.removeAll(due)
        for (t in due) {
            try {
                t.action()
            } catch (e: Exception) {
                ModInfo.LOGGER.error("Scheduled skill action failed", e)
            }
        }
    }
}

/** ワールドに保存される数値変数 (施術者 / ターゲット / グローバル) */
object Variables {
    private val global = HashMap<String, Double>()
    private val entities = HashMap<UUID, HashMap<String, Double>>()
    private val placeholder = Regex("<(var|target|global)[.]([A-Za-z0-9_]+)>")

    fun get(ctx: SkillContext, scope: String, name: String): Double = when (scope) {
        "GLOBAL" -> global[name] ?: 0.0
        "TARGET" -> ctx.target?.let { entities[it.uuid]?.get(name) } ?: 0.0
        else -> entities[ctx.player.uuid]?.get(name) ?: 0.0
    }

    fun set(ctx: SkillContext, scope: String, name: String, value: Double) {
        when (scope) {
            "GLOBAL" -> global[name] = value
            "TARGET" -> ctx.target?.let { entities.getOrPut(it.uuid) { HashMap() }[name] = value }
            else -> entities.getOrPut(ctx.player.uuid) { HashMap() }[name] = value
        }
    }

    fun add(ctx: SkillContext, scope: String, name: String, amount: Double, min: Double, max: Double) {
        set(ctx, scope, name, (get(ctx, scope, name) + amount).coerceIn(min, max))
    }

    fun inRange(ctx: SkillContext, scope: String, name: String, min: Double, max: Double): Boolean {
        val v = get(ctx, scope, name)
        return v >= min && v <= max
    }

    private fun format(v: Double): String =
        if (v == Math.floor(v) && Math.abs(v) < 1.0e15) v.toLong().toString() else (Math.round(v * 100.0) / 100.0).toString()

    /** テキスト内の <var.x> <target.x> <global.x> <player> <mana> <health> を置換 */
    fun render(text: String, ctx: SkillContext): String {
        var out = text
            .replace("<player>", ctx.player.name.string)
            .replace("<mana>", SkillManager.getMana(ctx.player).toString())
            .replace("<health>", format(ctx.player.health.toDouble()))
        out = placeholder.replace(out) { m ->
            val scope = when (m.groupValues[1]) {
                "global" -> "GLOBAL"
                "target" -> "TARGET"
                else -> "SELF"
            }
            format(get(ctx, scope, m.groupValues[2]))
        }
        return out
    }

    private fun file(server: MinecraftServer) = server.getSavePath(WorldSavePath.ROOT).resolve("mythicforge_vars.json")

    fun load(server: MinecraftServer) {
        val f = file(server)
        if (!Files.exists(f)) return
        try {
            val root = JsonParser.parseString(Files.readString(f)).asJsonObject
            root.getAsJsonObject("global")?.let { g -> for (k in g.keySet()) global[k] = g.get(k).asDouble }
            root.getAsJsonObject("entities")?.let { en ->
                for (id in en.keySet()) {
                    val m = HashMap<String, Double>()
                    val o = en.getAsJsonObject(id)
                    for (k in o.keySet()) m[k] = o.get(k).asDouble
                    entities[UUID.fromString(id)] = m
                }
            }
            ModInfo.LOGGER.info("Loaded variables: " + global.size + " global, " + entities.size + " entities")
        } catch (e: Exception) {
            ModInfo.LOGGER.warn("Failed to read variables", e)
        }
    }

    fun save(server: MinecraftServer) {
        val root = JsonObject()
        val g = JsonObject()
        for ((k, v) in global) g.addProperty(k, v)
        root.add("global", g)
        val en = JsonObject()
        for ((id, vars) in entities) {
            if (vars.isEmpty()) continue
            val o = JsonObject()
            for ((k, v) in vars) o.addProperty(k, v)
            en.add(id.toString(), o)
        }
        root.add("entities", en)
        try {
            val f = file(server)
            Files.createDirectories(f.parent)
            Files.writeString(f, GsonBuilder().setPrettyPrinting().create().toJson(root))
        } catch (e: IOException) {
            ModInfo.LOGGER.warn("Failed to save variables", e)
        }
    }
}

/** 毎tick飛翔する弾。着弾(敵・ブロック・時間切れ)した場所を origin としてスキルを発動する */
object Missiles {
    private class Missile(
        val world: ServerWorld,
        val owner: ServerPlayerEntity,
        var at: Vec3d,
        var velocity: Vec3d,
        val particle: ParticleEffect,
        val gravity: Double,
        val radius: Double,
        var life: Int,
        val onHit: String,
    )

    private val active = ArrayList<Missile>()
    private val incoming = ArrayList<Missile>()

    fun launch(
        owner: ServerPlayerEntity, world: ServerWorld, speed: Double, particle: ParticleEffect,
        gravity: Double, radius: Double, lifetime: Int, onHit: String,
    ) {
        val look = owner.rotationVector
        val start = owner.eyePos.add(look.multiply(0.6))
        incoming.add(Missile(world, owner, start, look.multiply(speed), particle, gravity, radius, lifetime, onHit))
    }

    fun tick() {
        if (incoming.isNotEmpty()) {
            active.addAll(incoming)
            incoming.clear()
        }
        if (active.isEmpty()) return
        val finished = ArrayList<Triple<Missile, Vec3d, LivingEntity?>>()
        val iter = active.iterator()
        while (iter.hasNext()) {
            val m = iter.next()
            if (m.owner.isRemoved) {
                iter.remove()
                continue
            }
            val next = m.at.add(m.velocity)
            var impact: Vec3d? = null
            var victim: LivingEntity? = null

            val block = m.world.raycast(RaycastContext(m.at, next, RaycastContext.ShapeType.COLLIDER, RaycastContext.FluidHandling.NONE, m.owner))
            if (block.type != HitResult.Type.MISS) impact = block.pos

            var best = Double.MAX_VALUE
            val sweep = Box(m.at, next).expand(m.radius)
            for (e in m.world.getEntitiesByClass(LivingEntity::class.java, sweep) { it !== m.owner && it.isAlive }) {
                val hit = e.boundingBox.expand(m.radius).raycast(m.at, next)
                if (hit.isPresent) {
                    val d = m.at.squaredDistanceTo(hit.get())
                    if (d < best) {
                        best = d
                        victim = e
                        impact = hit.get()
                    }
                }
            }

            m.world.spawnParticles(m.particle, next.x, next.y, next.z, 2, 0.05, 0.05, 0.05, 0.0)
            m.at = next
            m.velocity = m.velocity.add(0.0, -m.gravity, 0.0)
            m.life -= 1
            if (impact != null || m.life <= 0) {
                iter.remove()
                finished.add(Triple(m, impact ?: next, victim))
            }
        }
        for ((m, pos, victim) in finished) {
            m.world.spawnParticles(ParticleTypes.CLOUD, pos.x, pos.y, pos.z, 6, 0.2, 0.2, 0.2, 0.02)
            if (m.onHit.isNotBlank()) SkillManager.cast(m.onHit, m.owner, victim, silent = true, free = true, origin = pos)
        }
    }
}

/** スキル登録・クールダウン・マナ管理 */
object SkillManager {
    /** ModConfig から起動時に上書きされる */
    var maxMana: Int = ${Math.round(num(project.config?.maxMana ?? project.mana.max, 100))}
    var regenPerSecond: Int = ${Math.round(num(project.config?.regenPerSecond ?? project.mana.regenPerSecond, 2))}

    private val skills = LinkedHashMap<String, Skill>()
    private val cooldowns = HashMap<UUID, HashMap<String, Long>>()
    private val silenceUntil = HashMap<UUID, Long>()
    private val mana = HashMap<UUID, Int>()
    private var depth = 0

    fun silence(player: ServerPlayerEntity, ticks: Int) {
        val world = player.serverWorld
        silenceUntil[player.uuid] = world.time + ticks
    }

    fun isSilenced(player: ServerPlayerEntity): Boolean {
        val world = player.serverWorld
        val until = silenceUntil[player.uuid] ?: 0L
        return world.time < until
    }

    fun register(skill: Skill) {
        skills[skill.id] = skill
    }

    fun get(id: String): Skill? = skills[id]

    fun ids(): List<String> = skills.keys.toList()

    /** プレイヤーごとの最大マナ (基本値 + スキルポイント強化) */
    fun capOf(player: ServerPlayerEntity): Int = maxMana + ModExtras.extraMana(player)

    fun getMana(player: ServerPlayerEntity): Int = mana.getOrDefault(player.uuid, capOf(player))

    fun addMana(player: ServerPlayerEntity, amount: Int) = setMana(player, getMana(player) + amount)

    fun setMana(player: ServerPlayerEntity, amount: Int) {
        mana[player.uuid] = amount.coerceIn(0, capOf(player))
        sync(player)
    }

    /** マナをクライアントのHUDへ同期 */
    fun sync(player: ServerPlayerEntity) {
        ServerPlayNetworking.send(player, ManaSyncPayload(getMana(player).toFloat(), capOf(player).toFloat()))
    }

    /** キーバインドのスロット (1〜4) からスキルを発動 */
    fun castSlot(player: ServerPlayerEntity, slot: Int) {
        val id = ModConfig.slots.getOrNull(slot)
        if (id.isNullOrBlank()) {
            notify(player, "スロット" + (slot + 1) + "にはスキルが割り当てられていません (/skill slots)", Formatting.YELLOW)
            return
        }
        cast(id, player)
    }

    // ---- マナの保存 (ワールドフォルダに JSON) ----
    private fun manaFile(server: MinecraftServer) = server.getSavePath(WorldSavePath.ROOT).resolve("mythicforge_mana.json")

    fun load(server: MinecraftServer) {
        val file = manaFile(server)
        if (!Files.exists(file)) return
        try {
            val obj = JsonParser.parseString(Files.readString(file)).asJsonObject
            for (key in obj.keySet()) mana[UUID.fromString(key)] = obj.get(key).asInt
            ModInfo.LOGGER.info("Loaded mana data for " + mana.size + " players")
        } catch (e: Exception) {
            ModInfo.LOGGER.warn("Failed to read mana data", e)
        }
    }

    fun save(server: MinecraftServer) {
        val obj = JsonObject()
        for ((uuid, value) in mana) obj.addProperty(uuid.toString(), value)
        try {
            val file = manaFile(server)
            Files.createDirectories(file.parent)
            Files.writeString(file, GsonBuilder().setPrettyPrinting().create().toJson(obj))
        } catch (e: IOException) {
            ModInfo.LOGGER.warn("Failed to save mana data", e)
        }
    }

    fun resetCooldowns(player: ServerPlayerEntity) {
        cooldowns.remove(player.uuid)
    }

    /** 特定スキルのクールダウンだけを解除する */
    fun resetCooldown(player: ServerPlayerEntity, skillId: String) {
        cooldowns[player.uuid]?.remove(skillId)
    }

    fun isInOffhand(player: PlayerEntity, itemId: String): Boolean =
        Registries.ITEM.getId(player.offHandStack.item).toString() == itemId

    fun isHolding(player: PlayerEntity, itemId: String): Boolean =
        Registries.ITEM.getId(player.mainHandStack.item).toString() == itemId

    /** 防具スロットのいずれかに itemId を装備しているか */
    fun isWearing(player: PlayerEntity, itemId: String): Boolean {
        for (stack in player.armorItems) {
            if (!stack.isEmpty && Registries.ITEM.getId(stack.item).toString() == itemId) return true
        }
        return false
    }

    fun tick(server: MinecraftServer) {
        if (server.ticks % 6000 == 0) {
            save(server)
            Variables.save(server)
        }
        if (server.ticks % 20 != 0) return
        for (player in server.playerManager.playerList) {
            if (getMana(player) < capOf(player)) addMana(player, regenPerSecond)
        }
    }

    private fun notify(player: ServerPlayerEntity, message: String, color: Formatting) {
        player.sendMessage(Text.literal(message).formatted(color), true)
    }

    fun cast(
        id: String, player: ServerPlayerEntity, target: LivingEntity? = null,
        silent: Boolean = false, free: Boolean = false, origin: Vec3d? = null,
    ): Boolean {
        val skill = skills[id]
        if (skill == null) {
            if (!silent) notify(player, "Unknown skill: " + id, Formatting.RED)
            return false
        }
        if (depth > 8) {
            ModInfo.LOGGER.warn("Skill chain too deep at '" + id + "' (circular reference?)")
            return false
        }
        val world = player.serverWorld
        val ctx = SkillContext(player, world, target, origin)
        val now = world.time
        if (!free) {
            if (isSilenced(player)) {
                if (!silent) notify(player, "封印(沈黙)状態のためスキルを使用できません", Formatting.RED)
                return false
            }
            val readyAt = cooldowns[player.uuid]?.get(id) ?: 0L
            if (now < readyAt) {
                if (!silent) notify(player, "クールダウン中: あと " + ((readyAt - now + 19) / 20) + " 秒", Formatting.YELLOW)
                return false
            }
            if (getMana(player) < skill.manaCost) {
                if (!silent) notify(player, "マナが足りません (" + getMana(player) + "/" + skill.manaCost + ")", Formatting.BLUE)
                return false
            }
        }
        if (!skill.condition(ctx)) {
            if (!silent) notify(player, "発動条件を満たしていません", Formatting.GRAY)
            return false
        }
        if (!free) {
            addMana(player, -skill.manaCost)
            if (skill.cooldownTicks > 0) {
                cooldowns.getOrPut(player.uuid) { HashMap() }[id] = now + skill.cooldownTicks
            }
        }
        depth += 1
        try {
            skill.run(ctx)
        } catch (e: Exception) {
            ModInfo.LOGGER.error("Skill '" + id + "' failed", e)
            return false
        } finally {
            depth -= 1
        }
        if (!silent && !free) notify(player, skill.displayName + "  MP " + getMana(player) + "/" + capOf(player), Formatting.AQUA)
        return true
    }
}

/** ビジュアルエディタの各ブロックが呼び出す実処理 */
object SkillActions {
    fun damage(ctx: SkillContext, mode: TargetMode, radius: Double, amount: Float) {
        val source = ctx.world.damageSources.playerAttack(ctx.player)
        for (e in ctx.entities(mode, radius)) e.damage(source, amount)
    }

    fun heal(ctx: SkillContext, mode: TargetMode, radius: Double, amount: Float) {
        for (e in ctx.entities(mode, radius)) e.heal(amount)
    }

    fun effect(ctx: SkillContext, mode: TargetMode, radius: Double, effect: RegistryEntry<StatusEffect>, ticks: Int, amplifier: Int) {
        for (e in ctx.entities(mode, radius)) e.addStatusEffect(StatusEffectInstance(effect, ticks, amplifier))
    }

    fun ignite(ctx: SkillContext, mode: TargetMode, radius: Double, seconds: Float) {
        for (e in ctx.entities(mode, radius)) e.setOnFireFor(seconds)
    }

    fun launch(ctx: SkillContext, mode: TargetMode, radius: Double, power: Double, up: Double) {
        for (e in ctx.entities(mode, radius)) {
            val dir = if (e === ctx.player) ctx.player.rotationVector else e.pos.subtract(ctx.point).normalize()
            e.addVelocity(dir.x * power, up, dir.z * power)
            e.velocityModified = true
        }
    }

    fun blink(ctx: SkillContext, distance: Double) {
        val player = ctx.player
        val look = player.rotationVector
        val start = player.eyePos
        val end = start.add(look.multiply(distance))
        val hit = ctx.world.raycast(RaycastContext(start, end, RaycastContext.ShapeType.COLLIDER, RaycastContext.FluidHandling.NONE, player))
        val dest = if (hit.type == HitResult.Type.MISS) end else hit.pos.subtract(look.multiply(0.6))
        player.requestTeleport(dest.x, dest.y - player.standingEyeHeight, dest.z)
    }

    fun explosion(ctx: SkillContext, mode: TargetMode, power: Float, fire: Boolean, breakBlocks: Boolean) {
        val p = ctx.anchor(mode) ?: return
        val type = if (breakBlocks) World.ExplosionSourceType.MOB else World.ExplosionSourceType.NONE
        ctx.world.createExplosion(null, p.x, p.y, p.z, power, fire, type)
    }

    fun lightning(ctx: SkillContext, mode: TargetMode, radius: Double) {
        for (p in ctx.positions(mode, radius)) {
            val bolt = EntityType.LIGHTNING_BOLT.create(ctx.world) ?: continue
            bolt.refreshPositionAfterTeleport(p)
            ctx.world.spawnEntity(bolt)
        }
    }

    fun particles(ctx: SkillContext, mode: TargetMode, radius: Double, particle: ParticleEffect, count: Int) {
        for (p in ctx.positions(mode, radius)) {
            ctx.world.spawnParticles(particle, p.x, p.y + 0.9, p.z, count, 0.4, 0.4, 0.4, 0.05)
        }
    }

    fun ring(ctx: SkillContext, mode: TargetMode, radius: Double, ringRadius: Double, particle: ParticleEffect, points: Int) {
        for (p in ctx.positions(mode, radius)) {
            for (k in 0 until points) {
                val angle = Math.PI * 2.0 * k / points
                ctx.world.spawnParticles(particle, p.x + Math.cos(angle) * ringRadius, p.y + 0.2, p.z + Math.sin(angle) * ringRadius, 1, 0.0, 0.0, 0.0, 0.0)
            }
        }
    }

    fun sound(ctx: SkillContext, sound: SoundEvent, volume: Float, pitch: Float) {
        ctx.world.playSound(null, BlockPos.ofFloored(ctx.point), sound, SoundCategory.PLAYERS, volume, pitch)
    }

    /** 1.21.1 では一部の SoundEvents が RegistryEntry で定義されているため、両方に対応 */
    fun sound(ctx: SkillContext, sound: RegistryEntry<SoundEvent>, volume: Float, pitch: Float) {
        sound(ctx, sound.value(), volume, pitch)
    }

    fun message(ctx: SkillContext, text: String, actionBar: Boolean) {
        ctx.player.sendMessage(Text.literal(Variables.render(text, ctx)), actionBar)
    }

    fun title(ctx: SkillContext, text: String, subtitle: String) {
        val handler = ctx.player.networkHandler
        handler.sendPacket(TitleFadeS2CPacket(5, 40, 10))
        if (subtitle.isNotBlank()) handler.sendPacket(SubtitleS2CPacket(Text.literal(Variables.render(subtitle, ctx))))
        handler.sendPacket(TitleS2CPacket(Text.literal(Variables.render(text, ctx))))
    }

    fun feed(ctx: SkillContext, amount: Int) {
        ctx.player.hungerManager.add(amount, 0.5f)
    }

    fun setVar(ctx: SkillContext, scope: String, name: String, value: Double) {
        Variables.set(ctx, scope, name, value)
    }

    fun addVar(ctx: SkillContext, scope: String, name: String, amount: Double, min: Double, max: Double) {
        Variables.add(ctx, scope, name, amount, min, max)
    }

    fun chance(ctx: SkillContext, percent: Double): Boolean = ctx.world.random.nextDouble() * 100.0 < percent

    fun missile(ctx: SkillContext, particle: ParticleEffect, speed: Double, gravity: Double, hitRadius: Double, lifetime: Int, onHitSkill: String) {
        Missiles.launch(ctx.player, ctx.world, speed, particle, gravity, hitRadius, lifetime, onHitSkill)
    }

    fun openShop(ctx: SkillContext, shopId: String) {
        ModExtras.openShop(ctx.player, shopId)
    }

    fun grantSkillPoints(ctx: SkillContext, points: Int) {
        Variables.add(ctx, "SELF", "skill_points", points.toDouble(), 0.0, 100000.0)
        ctx.player.sendMessage(Text.literal("スキルポイント +" + points + " (合計 " + Variables.get(ctx, "SELF", "skill_points").toInt() + "pt / /sp で強化)"), true)
    }

    fun bossbar(ctx: SkillContext, title: String, percent: Float, color: String) {
        val manager = ctx.world.server.bossBarManager
        val barId = Identifier.of(ModInfo.MOD_ID, "skill_bar_" + ctx.player.uuidAsString)
        val bar = manager.get(barId) ?: manager.add(barId, Text.literal(Variables.render(title, ctx)))
        bar.name = Text.literal(Variables.render(title, ctx))
        val parsed = BossBar.Color.values().firstOrNull { it.getName() == color.lowercase() }
        if (parsed != null) bar.color = parsed
        bar.percent = (percent / 100.0f).coerceIn(0.0f, 1.0f)
        bar.addPlayer(ctx.player)
    }

    fun scoreboard(ctx: SkillContext, objectiveName: String, score: Int) {
        val sb = ctx.world.server.scoreboard
        val obj = sb.getNullableObjective(objectiveName)
            ?: sb.addObjective(objectiveName, ScoreboardCriterion.DUMMY, Text.literal(objectiveName), ScoreboardCriterion.RenderType.INTEGER, true, null)
        sb.getOrCreateScore(ScoreHolder.fromName(ctx.player.name.string), obj).setScore(score)
    }

    fun totemEffect(ctx: SkillContext, mode: TargetMode, radius: Double) {
        for (e in ctx.entities(mode, radius)) {
            if (e is ServerPlayerEntity) {
                // 不死のトーテム発動パケットと効果
                e.networkHandler.sendPacket(EntityStatusS2CPacket(e, 35.toByte()))
                e.clearStatusEffects()
                e.addStatusEffect(StatusEffectInstance(StatusEffects.REGENERATION, 900, 1))
                e.addStatusEffect(StatusEffectInstance(StatusEffects.FIRE_RESISTANCE, 800, 0))
                e.addStatusEffect(StatusEffectInstance(StatusEffects.ABSORPTION, 100, 1))
            }
        }
    }

    fun spiral(ctx: SkillContext, mode: TargetMode, radius: Double, spiralRadius: Double, height: Double, particle: ParticleEffect) {
        for (p in ctx.positions(mode, radius)) {
            val steps = (height * 8).toInt().coerceIn(10, 80)
            for (step in 0 until steps) {
                val progress = step.toDouble() / steps
                val y = p.y + progress * height
                val angle = progress * Math.PI * 6.0
                val x = p.x + Math.cos(angle) * spiralRadius
                val z = p.z + Math.sin(angle) * spiralRadius
                ctx.world.spawnParticles(particle, x, y, z, 1, 0.0, 0.0, 0.0, 0.0)
            }
        }
    }

    fun openGui(ctx: SkillContext, guiType: String) {
        when (guiType) {
            "CRAFTING" -> ctx.player.openHandledScreen(SimpleNamedScreenHandlerFactory({ syncId, inv, _ ->
                CraftingScreenHandler(syncId, inv, ScreenHandlerContext.create(ctx.world, BlockPos.ofFloored(ctx.point)))
            }, Text.translatable("container.crafting")))
            "ENDER_CHEST" -> ctx.player.openHandledScreen(SimpleNamedScreenHandlerFactory({ syncId, inv, _ ->
                GenericContainerScreenHandler.createGeneric9x3(syncId, inv, ctx.player.enderChestInventory)
            }, Text.translatable("container.enderchest")))
            "ANVIL" -> ctx.player.openHandledScreen(SimpleNamedScreenHandlerFactory({ syncId, inv, _ ->
                AnvilScreenHandler(syncId, inv, ScreenHandlerContext.create(ctx.world, BlockPos.ofFloored(ctx.point)))
            }, Text.translatable("container.repair")))
        }
    }

    /** カスタムモブ (ModMobs) を召喚 */
    fun summonCustom(ctx: SkillContext, mode: TargetMode, radius: Double, mobId: String, count: Int) {
        for (p in ctx.positions(mode, radius)) {
            repeat(count) { ModMobs.spawn(mobId, ctx.world, p) }
        }
    }

    fun swap(ctx: SkillContext, mode: TargetMode, radius: Double) {
        val player = ctx.player
        for (victim in ctx.entities(mode, radius)) {
            if (victim === player) continue
            val tempPos = player.pos
            player.teleportTo(victim.pos)
            victim.teleportTo(tempPos)
            // 音と煙を両方の位置に出す
            ctx.world.spawnParticles<ParticleEffect>(ParticleTypes.PORTAL, player.x, player.y + 1.0, player.z, 20, 0.2, 0.2, 0.2, 0.0)
            ctx.world.spawnParticles<ParticleEffect>(ParticleTypes.PORTAL, victim.x, victim.y + 1.0, victim.z, 20, 0.2, 0.2, 0.2, 0.0)
            sound(ctx, SoundEvents.ENTITY_ENDERMAN_TELEPORT, 0.8f, 1.3f)
            sound(ctx, SoundEvents.ENTITY_ENDERMAN_TELEPORT, 0.8f, 1.3f)
            break // 最初の1体とのみ入れ替え
        }
    }

    fun knockup(ctx: SkillContext, mode: TargetMode, radius: Double, power: Double) {
        for (e in ctx.entities(mode, radius)) {
            e.addVelocity(0.0, power, 0.0)
            e.velocityModified = true
        }
    }

    fun gravity(ctx: SkillContext, mode: TargetMode, radius: Double, power: Double) {
        for (e in ctx.entities(mode, radius)) {
            e.addVelocity(0.0, -power, 0.0)
            e.velocityModified = true
        }
    }

    fun silence(ctx: SkillContext, mode: TargetMode, radius: Double, ticks: Int) {
        for (e in ctx.entities(mode, radius)) {
            if (e is ServerPlayerEntity) {
                SkillManager.silence(e, ticks)
                e.sendMessage(Text.literal("§cスキルが封印された！"), true)
            }
        }
    }

    fun pull(ctx: SkillContext, mode: TargetMode, radius: Double, power: Double) {
        for (e in ctx.entities(mode, radius)) {
            if (e === ctx.player) continue
            val dir = ctx.player.pos.subtract(e.pos).normalize()
            e.addVelocity(dir.x * power, 0.25, dir.z * power)
            e.velocityModified = true
        }
    }

    fun lifesteal(ctx: SkillContext, mode: TargetMode, radius: Double, amount: Float, ratio: Double) {
        val source = ctx.world.damageSources.playerAttack(ctx.player)
        var dealt = 0.0f
        for (e in ctx.entities(mode, radius)) {
            if (e === ctx.player) continue
            e.damage(source, amount)
            dealt += amount
        }
        if (dealt > 0.0f) ctx.player.heal(dealt * ratio.toFloat())
    }

    /** 最も近い敵から、近くの別の敵へ雷が連鎖する (見た目だけの雷 + 直接ダメージ) */
    fun chainLightning(ctx: SkillContext, mode: TargetMode, radius: Double, jumps: Int, range: Double, amount: Float) {
        val source = ctx.world.damageSources.playerAttack(ctx.player)
        val hit = HashSet<LivingEntity>()
        var current: LivingEntity? = ctx.entities(mode, radius).firstOrNull { it !== ctx.player }
        var remaining = jumps
        while (current != null && remaining > 0) {
            val from: LivingEntity = current
            hit.add(from)
            val bolt = EntityType.LIGHTNING_BOLT.create(ctx.world)
            if (bolt != null) {
                bolt.refreshPositionAfterTeleport(from.pos)
                bolt.setCosmetic(true)
                ctx.world.spawnEntity(bolt)
            }
            from.damage(source, amount)
            current = ctx.world.getEntitiesByClass(LivingEntity::class.java, Box.of(from.pos, range * 2.0, range * 2.0, range * 2.0)) { it !== ctx.player && it.isAlive && !hit.contains(it) }
                .minByOrNull { it.squaredDistanceTo(from) }
            remaining -= 1
        }
    }

    fun shield(ctx: SkillContext, amount: Float) {
        ctx.player.absorptionAmount = amount.coerceAtLeast(ctx.player.absorptionAmount)
    }

    fun resetCooldowns(ctx: SkillContext) {
        SkillManager.resetCooldowns(ctx.player)
    }

    fun dropItem(ctx: SkillContext, mode: TargetMode, radius: Double, itemId: String, count: Int) {
        val item = Registries.ITEM.get(Identifier.of(itemId))
        for (p in ctx.positions(mode, radius)) {
            ctx.world.spawnEntity(ItemEntity(ctx.world, p.x, p.y + 0.5, p.z, ItemStack(item, count)))
        }
    }

    fun giveItem(ctx: SkillContext, itemId: String, count: Int) {
        val item = Registries.ITEM.get(Identifier.of(itemId))
        ctx.player.getInventory().offerOrDrop(ItemStack(item, count))
    }

    fun command(ctx: SkillContext, command: String) {
        val source = ctx.player.commandSource.withLevel(4).withSilent()
        ctx.world.server.commandManager.executeWithPrefix(source, command)
    }

    fun restoreMana(ctx: SkillContext, amount: Int) {
        SkillManager.addMana(ctx.player, amount)
    }

    fun summon(ctx: SkillContext, mode: TargetMode, radius: Double, type: EntityType<out LivingEntity>, count: Int) {
        for (p in ctx.positions(mode, radius)) {
            repeat(count) {
                val mob = type.create(ctx.world) ?: return@repeat
                mob.refreshPositionAfterTeleport(
                    p.x + ctx.world.random.nextDouble() * 2.0 - 1.0,
                    p.y,
                    p.z + ctx.world.random.nextDouble() * 2.0 - 1.0,
                )
                ctx.world.spawnEntity(mob)
            }
        }
    }

    fun fireball(ctx: SkillContext, mode: TargetMode, radius: Double, speed: Double) {
        for (e in ctx.entities(mode, radius)) {
            val dir = e.pos.subtract(ctx.player.pos).normalize()
            val ball = SmallFireballEntity(ctx.world, ctx.player, dir.multiply(speed))
            ball.refreshPositionAfterTeleport(ctx.player.eyePos)
            ctx.world.spawnEntity(ball)
        }
    }

    fun placeBlock(ctx: SkillContext, mode: TargetMode, radius: Double, block: Block, yOffset: Int) {
        for (p in ctx.positions(mode, radius)) {
            val pos = BlockPos.ofFloored(p.x, p.y + yOffset, p.z)
            if (ctx.world.getBlockState(pos).isAir) ctx.world.setBlockState(pos, block.defaultState)
        }
    }

    fun breakBlock(ctx: SkillContext, mode: TargetMode, radius: Double, drop: Boolean) {
        for (p in ctx.positions(mode, radius)) {
            val pos = BlockPos.ofFloored(p.x, p.y, p.z)
            if (!ctx.world.getBlockState(pos).isAir) ctx.world.breakBlock(pos, drop, ctx.player)
        }
    }

    fun teleportNear(ctx: SkillContext, mode: TargetMode, radius: Double, distance: Double) {
        val dir = ctx.player.rotationVector
        for (e in ctx.entities(mode, radius)) {
            val dest = ctx.player.pos.add(dir.x * distance, 0.0, dir.z * distance)
            e.requestTeleport(dest.x, dest.y, dest.z)
        }
    }

    fun clearEffects(ctx: SkillContext, mode: TargetMode, radius: Double) {
        for (e in ctx.entities(mode, radius)) e.clearStatusEffects()
    }

    fun giveXp(ctx: SkillContext, amount: Int) {
        ctx.player.addExperience(amount)
    }

    fun castSkill(ctx: SkillContext, skillId: String) {
        SkillManager.cast(skillId, ctx.player, ctx.target, silent = true, free = true, origin = ctx.origin)
    }

    fun later(ctx: SkillContext, ticks: Int, block: () -> Unit) {
        Scheduler.schedule(ticks) { if (!ctx.player.isRemoved) block() }
    }

    fun repeatEvery(ctx: SkillContext, times: Int, interval: Int, block: () -> Unit) {
        for (n in 0 until times) later(ctx, n * interval, block)
    }
}`;
  return build(pkg, body);
}
