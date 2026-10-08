import { lexKotlin } from "../analyzer/kotlin";
import { makeEffectIconBase64, makeIconPngBase64, parsePngDataUrl } from "./png";
import { gradleFiles } from "./gradleGen";
import { geckolibMobFiles, hasGeckolib } from "./geckolib";
import { extrasMojBody, extrasYarnStub, itemAttributesMojBody, itemAttributesYarnStub } from "./extrasgen";
import { materialOf, scaledDurability } from "./materials";
import { BLOCK_SOUND_MAP, mojBlocksBody, mojClientBody, mojGroupBody, mojItemsBody, mojModItemBody, mojNetworkBody, translateBody, type MojHelpers } from "./codegenMojmap";
import { resolveEnv, type TargetEnv } from "./targets";
import { setRegistryMode } from "../analyzer/registry";
import { fqnsForSimple } from "../analyzer/registry";
import type { Action, Condition, GeneratedFile, ItemDef, ModProject, SkillDef } from "./types";

const ARMOR_FACTOR: Record<string, number> = { LEATHER: 5, CHAINMAIL: 15, IRON: 15, GOLD: 7, DIAMOND: 33, TURTLE: 25, NETHERITE: 37 };
const ARMOR_BASE: Record<string, number> = { HELMET: 11, CHESTPLATE: 16, LEGGINGS: 15, BOOTS: 13 };
/** 防具の耐久値 (0指定ならバニラ素材の値に合わせる) */
export const armorDurability = (it: ItemDef) => (it.durability > 0 ? it.durability : (ARMOR_FACTOR[it.armorMaterial] ?? 15) * (ARMOR_BASE[it.armorSlot] ?? 15));

const clsOf = (it: ItemDef) => {
  const map: Partial<Record<ItemDef["kind"], string>> = { sword: "SwordItem", pickaxe: "PickaxeItem", axe: "AxeItem", shovel: "ShovelItem" };
  return map[it.kind] ?? "SwordItem";
};

/** 生成中のマッピング方言 (generateProject が設定。生成は同期処理なので安全) */
let DIALECT: "yarn" | "mojmap" = "yarn";
const MOJ = (): MojHelpers => ({ q, d, f, i, ind, constName, armorDurability });

/** 旧プロファイルの既定値 (互換用に残している) */
export const FABRIC = {
  minecraft: "1.21.1",
  yarn: "1.21.1+build.3",
  loader: "0.16.5",
  fabricApi: "0.105.0+1.21.1",
  kotlinLoader: "1.12.1+kotlin.2.0.20",
  loom: "1.7.4",
  kotlin: "2.0.20",
  gradle: "8.10.2",
};

// ---------- helpers ----------
export const q = (s: string) =>
  '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/\r?\n/g, "\\n") + '"';
const d = (n: number) => {
  const v = Number.isFinite(Number(n)) ? Number(n) : 0;
  return Number.isInteger(v) ? `${v}.0` : `${v}`;
};
const f = (n: number) => `${d(n)}f`;
const i = (n: number) => `${Math.round(Number.isFinite(Number(n)) ? Number(n) : 0)}`;
export const constName = (id: string) => {
  const c = id.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase();
  return /^[0-9]/.test(c) ? `_${c}` : c;
};
const ind = (lines: string[], n: number) => lines.map((l) => (l.length ? " ".repeat(n) + l : l));
const js = (o: unknown) => JSON.stringify(o, null, 2) + "\n";
const num = (v: unknown, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);
const str = (v: unknown) => String(v ?? "");
const tm = (v: unknown) => `TargetMode.${["SELF", "TARGET", "AREA", "POINT"].includes(str(v)) ? str(v) : "TARGET"}`;
const scopeOf = (v: unknown) => q(["SELF", "TARGET", "GLOBAL"].includes(str(v)) ? str(v) : "SELF");
const varName = (v: unknown) => q(str(v).replace(/[^A-Za-z0-9_]/g, "_") || "var");
const ns = (project: ModProject, id: string) => (id.includes(":") ? id : `${project.meta.modId}:${id}`);

// ---------- project symbols (same-project classes) ----------
export function projectSymbols(project: ModProject): Record<string, string> {
  const pkg = project.meta.packageName;
  const sk = `${pkg}.skill`;
  return {
    ModMain: `${pkg}.ModMain`, ModInfo: `${pkg}.ModInfo`, ModItems: `${pkg}.ModItems`, ModBlocks: `${pkg}.ModBlocks`,
    ModItem: `${pkg}.ModItem`, ModItemGroup: `${pkg}.ModItemGroup`,
    Skill: `${sk}.Skill`, SkillContext: `${sk}.SkillContext`, SkillManager: `${sk}.SkillManager`,
    SkillActions: `${sk}.SkillActions`, Scheduler: `${sk}.Scheduler`, TargetMode: `${sk}.TargetMode`,
    Skills: `${sk}.Skills`, SkillTriggers: `${sk}.SkillTriggers`,
    Variables: `${sk}.Variables`, Missiles: `${sk}.Missiles`, ModWorldGen: `${pkg}.ModWorldGen`, ModMobs: `${pkg}.ModMobs`, ModExtras: `${pkg}.ModExtras`, ModItemAttributes: `${pkg}.ModItemAttributes`, ModEffect: `${pkg}.ModEffect`,
    ModConfig: `${pkg}.ModConfig`, ModNetworking: `${pkg}.net.ModNetworking`,
    ManaSyncPayload: `${pkg}.net.ManaSyncPayload`, CastSlotPayload: `${pkg}.net.CastSlotPayload`,
    ModClient: `${pkg}.client.ModClient`, HudState: `${pkg}.client.HudState`,
  };
}

/** テンプレート部分から使用クラスを検出してimport文を自動生成 */
function buildKotlin(project: ModProject, pkg: string, bodyIn: string, opts: { extraImports?: string[]; raw?: boolean } = {}) {
  // Mojang マッピングでは Yarn 名で書かれたテンプレートを変換 (専用テンプレート raw はそのまま)
  const body = DIALECT === "mojmap" && !opts.raw ? translateBody(bodyIn) : bodyIn;
  // カスタムKotlinブロックは自動importの対象外 (ユーザーがimportを管理する)
  const masked = body.replace(/\/\/ >>> custom:[\s\S]*?\/\/ <<< custom:\w+/g, "");
  const syms = projectSymbols(project);
  const used = new Set<string>();
  const toks = lexKotlin(masked).tokens;
  toks.forEach((t, idx) => {
    if (t.type !== "ident") return;
    if (toks[idx - 1]?.text === ".") return;
    used.add(t.text);
  });
  const imports = new Set<string>();
  for (const name of used) {
    if (syms[name]) {
      const pkgOf = syms[name].slice(0, syms[name].lastIndexOf("."));
      if (pkgOf !== pkg) imports.add(syms[name]);
      continue;
    }
    const cands = fqnsForSimple(name);
    if (cands.length === 1) imports.add(cands[0]);
  }
  const extraFqn = new Set<string>();
  const extraLines: string[] = [];
  for (const line of opts.extraImports ?? []) {
    const m = line.trim().match(/^import\s+([\w.*]+)(\s+as\s+\w+)?$/);
    const key = m ? m[1] + (m[2] ?? "") : line.trim();
    if (!key || extraFqn.has(key) || (m && !m[2] && imports.has(m[1]))) continue;
    extraFqn.add(key);
    extraLines.push(line.trim());
  }
  const importLines = [...[...imports].sort().map((x) => `import ${x}`), ...extraLines];
  return `package ${pkg}\n\n${importLines.join("\n")}${importLines.length ? "\n\n" : ""}${body.trimEnd()}\n`;
}

// ---------- skill runtime (static Kotlin) ----------
function runtimeKt(project: ModProject): string {
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
  return buildKotlin(project, pkg, body);
}

// ---------- skills ----------
function genCondition(c: Condition): string {
  switch (c.type) {
    case "SNEAKING": return "c.player.isSneaking";
    case "ON_GROUND": return "c.player.isOnGround";
    case "IN_WATER": return "c.player.isTouchingWater";
    case "HAS_TARGET": return "c.target != null";
    case "HEALTH_BELOW": return `c.player.health < c.player.maxHealth * ${f(num(c.value, 50) / 100)}`;
    case "HOLDING": return `SkillManager.isHolding(c.player, ${q(c.value)})`;
    case "WEARING": return `SkillManager.isWearing(c.player, ${q(c.value)})`;
    case "SPRINTING": return "c.player.isSprinting";
    case "MANA_ABOVE": return `SkillManager.getMana(c.player) >= ${i(num(c.value, 0))}`;
    case "VARIABLE": {
      const [scope = "SELF", name = "", min = "", max = ""] = c.value.split("|");
      const lo = min.trim() === "" ? "Double.NEGATIVE_INFINITY" : d(num(min));
      const hi = max.trim() === "" ? "Double.POSITIVE_INFINITY" : d(num(max));
      return `Variables.inRange(c, ${scopeOf(scope)}, ${varName(name)}, ${lo}, ${hi})`;
    }
    case "NOT_SNEAKING": return "!c.player.isSneaking";
    case "HEARTS_BELOW": return `c.player.health <= ${f(num(c.value, 6))}`;
    case "IN_OFFHAND": return `SkillManager.isInOffhand(c.player, ${q(c.value)})`;
    case "IS_DAY": return "c.world.isDay";
    case "IS_NIGHT": return "c.world.isNight";
    default: return "true";
  }
}

export const CUSTOM_OPEN = "// >>> custom:";
export const CUSTOM_CLOSE = "// <<< custom:";

function genAction(a: Action, customCodes: string[]): string[] {
  const p = a.params;
  const target = tm(p.target);
  const radius = d(num(p.radius, 4));
  switch (a.type) {
    case "damage": return [`SkillActions.damage(ctx, ${target}, ${radius}, ${f(num(p.amount))})`];
    case "heal": return [`SkillActions.heal(ctx, ${target}, ${radius}, ${f(num(p.amount))})`];
    case "effect": return [`SkillActions.effect(ctx, ${target}, ${radius}, StatusEffects.${constName(str(p.effect))}, ${i(num(p.seconds) * 20)}, ${i(num(p.amplifier))})`];
    case "ignite": return [`SkillActions.ignite(ctx, ${target}, ${radius}, ${f(num(p.seconds))})`];
    case "launch": return [`SkillActions.launch(ctx, ${target}, ${radius}, ${d(num(p.power))}, ${d(num(p.up))})`];
    case "blink": return [`SkillActions.blink(ctx, ${d(num(p.distance, 8))})`];
    case "explosion": return [`SkillActions.explosion(ctx, ${target}, ${f(num(p.power, 2))}, ${p.fire ? "true" : "false"}, ${p.breakBlocks ? "true" : "false"})`];
    case "lightning": return [`SkillActions.lightning(ctx, ${target}, ${radius})`];
    case "particles": return [`SkillActions.particles(ctx, ${target}, ${radius}, ParticleTypes.${constName(str(p.particle))}, ${i(num(p.count, 10))})`];
    case "sound": return [`SkillActions.sound(ctx, SoundEvents.${constName(str(p.sound))}, ${f(num(p.volume, 1))}, ${f(num(p.pitch, 1))})`];
    case "message": return [`SkillActions.message(ctx, ${q(str(p.text))}, ${p.actionBar ? "true" : "false"})`];
    case "giveItem": return [`SkillActions.giveItem(ctx, ${q(str(p.item))}, ${i(num(p.count, 1))})`];
    case "command": return [`SkillActions.command(ctx, ${q(str(p.command).replace(/^\//, ""))})`];
    case "restoreMana": return [`SkillActions.restoreMana(ctx, ${i(num(p.amount))})`];
    case "missile":
      return [`SkillActions.missile(ctx, ParticleTypes.${constName(str(p.particle))}, ${d(num(p.speed, 1.4))}, ${d(num(p.gravity))}, ${d(num(p.hitRadius, 0.6))}, ${i(num(p.lifetime, 40))}, ${q(str(p.onHitSkill))})`];
    case "ring":
      return [`SkillActions.ring(ctx, ${target}, ${radius}, ${d(num(p.ringRadius, 3))}, ParticleTypes.${constName(str(p.particle))}, ${i(num(p.points, 24))})`];
    case "setVar": return [`SkillActions.setVar(ctx, ${scopeOf(p.scope)}, ${varName(p.name)}, ${d(num(p.value))})`];
    case "addVar": return [`SkillActions.addVar(ctx, ${scopeOf(p.scope)}, ${varName(p.name)}, ${d(num(p.amount, 1))}, ${d(num(p.min))}, ${d(num(p.max, 1000000))})`];
    case "title": return [`SkillActions.title(ctx, ${q(str(p.text))}, ${q(str(p.subtitle))})`];
    case "feed": return [`SkillActions.feed(ctx, ${i(num(p.amount, 6))})`];
    case "summonCustom": return [`SkillActions.summonCustom(ctx, ${target}, ${radius}, ${q(str(p.mobId))}, ${i(num(p.count, 1))})`];
    case "customEffect": return [`ModExtras.applyEffect(ctx, ${target}, ${radius}, ${q(str(p.effectId))}, ${i(num(p.seconds, 60) * 20)}, ${i(num(p.amplifier))})`];
    case "advance": return [`ModExtras.advance(ctx, ${q(str(p.advId))}, ${i(num(p.amount, 1))})`];
    case "openShop": return [`SkillActions.openShop(ctx, ${q(str(p.shopId))})`];
    case "grantSkillPoints": return [`SkillActions.grantSkillPoints(ctx, ${i(num(p.points, 1))})`];
    case "bossbar": return [`SkillActions.bossbar(ctx, ${q(str(p.text))}, ${f(num(p.percent, 100))}, ${q(str(p.color))})`];
    case "scoreboard": return [`SkillActions.scoreboard(ctx, ${q(str(p.objective))}, ${i(num(p.score, 10))})`];
    case "totemEffect": return [`SkillActions.totemEffect(ctx, ${target}, ${radius})`];
    case "spiral": return [`SkillActions.spiral(ctx, ${target}, ${radius}, ${d(num(p.radius, 2))}, ${d(num(p.height, 4))}, ParticleTypes.${constName(str(p.particle))})`];
    case "openGui": return [`SkillActions.openGui(ctx, ${q(str(p.guiType))})`];
    case "swap": return [`SkillActions.swap(ctx, ${target}, ${radius})`];
    case "knockup": return [`SkillActions.knockup(ctx, ${target}, ${radius}, ${d(num(p.power, 1.2))})`];
    case "gravity": return [`SkillActions.gravity(ctx, ${target}, ${radius}, ${d(num(p.power, 1.6))})`];
    case "silence": return [`SkillActions.silence(ctx, ${target}, ${radius}, ${i(num(p.seconds, 4) * 20)})`];
    case "pull": return [`SkillActions.pull(ctx, ${target}, ${radius}, ${d(num(p.power, 1.2))})`];
    case "lifesteal": return [`SkillActions.lifesteal(ctx, ${target}, ${radius}, ${f(num(p.amount, 4))}, ${d(num(p.ratio, 50) / 100)})`];
    case "chainLightning": return [`SkillActions.chainLightning(ctx, ${target}, ${radius}, ${i(num(p.jumps, 4))}, ${d(num(p.range, 6))}, ${f(num(p.amount, 5))})`];
    case "dropItem": return [`SkillActions.dropItem(ctx, ${target}, ${radius}, ${q(str(p.item))}, ${i(num(p.count, 1))})`];
    case "shield": return [`SkillActions.shield(ctx, ${f(num(p.amount, 6))})`];
    case "resetCooldowns": return [`SkillActions.resetCooldowns(ctx)`];
    case "ifVar":
      return [`if (Variables.inRange(ctx, ${scopeOf(p.scope)}, ${varName(p.name)}, ${d(num(p.min))}, ${d(num(p.max, 1000000))})) {`, ...ind(genActions(a.children ?? [], customCodes), 4), "}"];
    case "chance":
      return [`if (SkillActions.chance(ctx, ${d(num(p.percent, 30))})) {`, ...ind(genActions(a.children ?? [], customCodes), 4), "}"];
    case "summon": return [`SkillActions.summon(ctx, ${target}, ${radius}, EntityType.${constName(str(p.entity))}, ${i(num(p.count, 1))})`];
    case "fireball": return [`SkillActions.fireball(ctx, ${target}, ${radius}, ${d(num(p.speed, 1.5))})`];
    case "placeBlock": return [`SkillActions.placeBlock(ctx, ${target}, ${radius}, Blocks.${constName(str(p.block))}, ${i(num(p.yOffset))})`];
    case "breakBlock": return [`SkillActions.breakBlock(ctx, ${target}, ${radius}, ${p.drop ? "true" : "false"})`];
    case "teleportNear": return [`SkillActions.teleportNear(ctx, ${target}, ${radius}, ${d(num(p.distance, 2.5))})`];
    case "clearEffects": return [`SkillActions.clearEffects(ctx, ${target}, ${radius})`];
    case "giveXp": return [`SkillActions.giveXp(ctx, ${i(num(p.amount, 20))})`];
    case "castSkill": return [`SkillActions.castSkill(ctx, ${q(str(p.skillId))})`];
    case "delay":
      return [`SkillActions.later(ctx, ${i(num(p.ticks, 20))}) {`, ...ind(genActions(a.children ?? [], customCodes), 4), "}"];
    case "repeat":
      return [`SkillActions.repeatEvery(ctx, ${i(num(p.times, 3))}, ${i(num(p.interval, 10))}) {`, ...ind(genActions(a.children ?? [], customCodes), 4), "}"];
    case "custom": {
      const code = str(p.code);
      customCodes.push(code);
      return [`${CUSTOM_OPEN}${a.uid}`, ...code.split("\n"), `${CUSTOM_CLOSE}${a.uid}`];
    }
    default: return [`// unknown action: ${a.type}`];
  }
}

function genActions(actions: Action[], customCodes: string[]): string[] {
  if (actions.length === 0) return ["// (アクションなし)"];
  return actions.flatMap((a) => genAction(a, customCodes));
}

function skillsKt(project: ModProject): string {
  const customCodes: string[] = [];
  const blocks = project.skills.map((s) => {
    const cond = s.conditions.length ? s.conditions.map(genCondition).join(" && ") : "true";
    const actions = genActions(s.actions, customCodes);
    return [
      `// ${s.name}`,
      `SkillManager.register(`,
      `    Skill(`,
      `        id = ${q(s.id)},`,
      `        displayName = ${q(s.name)},`,
      `        cooldownTicks = ${i(num(s.cooldown) * 20)},`,
      `        manaCost = ${i(num(s.manaCost))},`,
      `        condition = { c -> ${cond} },`,
      `        run = { ctx ->`,
      ...ind(actions, 12),
      `        },`,
      `    ),`,
      `)`,
    ];
  });
  const body = `/** このファイルはMythicForgeが生成しました。スキル定義の登録を行います。 */
object Skills {
    fun register() {
${ind(blocks.flatMap((b, idx) => (idx ? ["", ...b] : b)), 8).join("\n")}
    }
}`;
  const extra = project.customImports.split("\n").map((l) => l.trim()).filter(Boolean);
  return buildKotlin(project, `${project.meta.packageName}.skill`, body, { extraImports: extra });
}

function holdingCheck(s: SkillDef, playerVar: string) {
  return s.trigger.heldItem.trim() ? ` && SkillManager.isHolding(${playerVar}, ${q(s.trigger.heldItem.trim())})` : "";
}

function triggersKt(project: ModProject): string {
  const auto = project.skills.filter((s) => s.trigger.type !== "MANUAL");
  const regs: string[] = [];
  const periodic: string[] = [];
  for (const s of auto) {
    const id = q(s.id);
    const h = (v: string) => holdingCheck(s, v);
    switch (s.trigger.type) {
      case "ATTACK_ENTITY":
        regs.push(`// ${s.name}: 攻撃時`, `AttackEntityCallback.EVENT.register { player, world, hand, entity, _ ->`,
          `    if (!world.isClient && hand == Hand.MAIN_HAND && player is ServerPlayerEntity && entity is LivingEntity${h("player")}) {`,
          `        SkillManager.cast(${id}, player, entity, silent = true)`, `    }`, `    ActionResult.PASS`, `}`, "");
        break;
      case "KILL_ENTITY":
        regs.push(`// ${s.name}: 撃破時`, `ServerEntityCombatEvents.AFTER_KILLED_OTHER_ENTITY.register { _, entity, killed ->`,
          `    if (entity is ServerPlayerEntity${h("entity")}) {`, `        SkillManager.cast(${id}, entity, killed, silent = true)`, `    }`, `}`, "");
        break;
      case "BREAK_BLOCK":
        regs.push(`// ${s.name}: ブロック破壊時`, `PlayerBlockBreakEvents.AFTER.register { _, player, _, _, _ ->`,
          `    if (player is ServerPlayerEntity${h("player")}) {`, `        SkillManager.cast(${id}, player, null, silent = true)`, `    }`, `}`, "");
        break;
      case "WEAR": {
        const ticks = Math.max(1, Math.round(num(s.trigger.intervalSec, 5) * 20));
        const wid = q(ns(project, s.trigger.heldItem.trim() || "none"));
        periodic.push(`// ${s.name}: 装備中`, `if (server.ticks % ${ticks} == 0) {`, `    for (player in server.playerManager.playerList) {`,
          `        if (SkillManager.isWearing(player, ${wid})) SkillManager.cast(${id}, player, null, silent = true, free = true)`, `    }`, `}`);
        break;
      }
      case "SWING":
        regs.push(`// ${s.name}: 左クリック時`, `AttackBlockCallback.EVENT.register { player, world, hand, _, _ ->`,
          `    if (!world.isClient && hand == Hand.MAIN_HAND && player is ServerPlayerEntity${h("player")}) {`,
          `        SkillManager.cast(${id}, player, null, silent = true)`, `    }`, `    ActionResult.PASS`, `}`, "");
        break;
      case "DEATH":
        regs.push(`// ${s.name}: 死亡時(復活)`, `ServerLivingEntityEvents.ALLOW_DEATH.register { entity, damageSource, _ ->`,
          `    if (entity is ServerPlayerEntity${h("entity")}) {`,
          `        val castSuccess = SkillManager.cast(${id}, entity, damageSource.attacker as? LivingEntity, silent = true)`,
          `        if (castSuccess && entity.health <= 0f) {`,
          `            entity.health = 4.0f`,
          `            false`,
          `        } else true`,
          `    } else true`, `}`, "");
        break;
      case "TAKE_DAMAGE":
        regs.push(`// ${s.name}: 被ダメージ時`, `ServerLivingEntityEvents.AFTER_DAMAGE.register { entity, _, _, damageTaken, blocked ->`,
          `    if (entity is ServerPlayerEntity && damageTaken > 0.0f && !blocked${h("entity")}) {`,
          `        SkillManager.cast(${id}, entity, null, silent = true)`, `    }`, `}`, "");
        break;
      case "PLAYER_JOIN":
        regs.push(`// ${s.name}: 参加時`, `ServerPlayConnectionEvents.JOIN.register { handler, _, _ ->`,
          `    SkillManager.cast(${id}, handler.player, null, silent = true)`, `}`, "");
        break;
      case "PERIODIC": {
        const ticks = Math.max(1, Math.round(num(s.trigger.intervalSec, 10) * 20));
        periodic.push(`if (server.ticks % ${ticks} == 0) {`, `    for (player in server.playerManager.playerList) {`,
          `        if (true${h("player")}) SkillManager.cast(${id}, player, null, silent = true)`, `    }`, `}`);
        break;
      }
    }
  }
  if (project.items.some((x) => x.leftClickSkillId)) {
    regs.push(
      `// アイテム左クリック (ブロック/エンティティを殴る) でスキル発動`,
      `AttackBlockCallback.EVENT.register { player, world, hand, _, _ ->`,
      `    if (!world.isClient && hand == Hand.MAIN_HAND && player is ServerPlayerEntity) {`,
      `        val skillId = ModItems.LEFT_CLICK_SKILLS[player.mainHandStack.item]`,
      `        if (skillId != null) SkillManager.cast(skillId, player, null, silent = true)`,
      `    }`, `    ActionResult.PASS`, `}`, ``,
      `AttackEntityCallback.EVENT.register { player, world, hand, entity, _ ->`,
      `    if (!world.isClient && hand == Hand.MAIN_HAND && player is ServerPlayerEntity) {`,
      `        val skillId = ModItems.LEFT_CLICK_SKILLS[player.mainHandStack.item]`,
      `        if (skillId != null) SkillManager.cast(skillId, player, entity as? LivingEntity, silent = true)`,
      `    }`, `    ActionResult.PASS`, `}`, ``,
    );
  }
  const skillBlocks = project.blocks.some((b) => b.skillId);
  const blockUse = skillBlocks
    ? [
        `// ブロック右クリックでスキル発動`,
        `UseBlockCallback.EVENT.register { player, world, hand, hit ->`,
        `    if (!world.isClient && hand == Hand.MAIN_HAND && player is ServerPlayerEntity && !player.isSneaking) {`,
        `        val block = world.getBlockState(hit.blockPos).block`,
        `        val skillId = if (player.isSneaking) ModBlocks.SHIFT_SKILL_BLOCKS[block] ?: ModBlocks.SKILL_BLOCKS[block] else ModBlocks.SKILL_BLOCKS[block]`,

        `        if (skillId != null) {`,
        `            SkillManager.cast(skillId, player)`,
        `            return@register ActionResult.SUCCESS`,
        `        }`,
        `    }`,
        `    ActionResult.PASS`,
        `}`,
        ``,
      ]
    : [];
  const body = `object SkillTriggers {
    fun register() {
        ServerTickEvents.END_SERVER_TICK.register { server ->
            Scheduler.tick()
            Missiles.tick()
            SkillManager.tick(server)
${ind(periodic, 12).join("\n")}
        }

        CommandRegistrationCallback.EVENT.register { dispatcher, _, _ ->
            dispatcher.register(
                CommandManager.literal("skill")
                    .then(
                        CommandManager.literal("cast")
                            .requires { it.hasPermissionLevel(2) }
                            .then(
                                CommandManager.argument("id", StringArgumentType.word())
                                    .suggests { _, builder -> CommandSource.suggestMatching(SkillManager.ids(), builder) }
                                    .executes { c ->
                                        val player = c.source.playerOrThrow
                                        val id = StringArgumentType.getString(c, "id")
                                        if (SkillManager.cast(id, player)) 1 else 0
                                    }
                            )
                    )
                    .then(
                        CommandManager.literal("list").executes { c ->
                            c.source.sendFeedback({ Text.literal("Skills: " + SkillManager.ids().joinToString(", ")) }, false)
                            1
                        }
                    )
                    .then(
                        CommandManager.literal("mana").executes { c ->
                            val player = c.source.playerOrThrow
                            c.source.sendFeedback({ Text.literal("Mana: " + SkillManager.getMana(player) + "/" + SkillManager.capOf(player)) }, false)
                            1
                        }
                    )
                    .then(
                        CommandManager.literal("slots").executes { c ->
                            c.source.sendFeedback({ Text.literal(ModConfig.slots.mapIndexed { i, s -> (i + 1).toString() + ". " + s.ifBlank { "(空)" } }.joinToString("  ")) }, false)
                            1
                        }
                    )
            )
        }

${ind([...blockUse, ...regs], 8).join("\n")}
    }
}`;
  return buildKotlin(project, `${project.meta.packageName}.skill`, body);
}

// ---------- items / blocks ----------
function itemSettings(it: ItemDef, mat?: { dmg: number; dur: number }): string {
  const parts = ["Item.Settings()"];
  const tool = ["sword", "pickaxe", "axe", "shovel"].includes(it.kind);

  // カスタム属性修飾 (MAX_HEALTH, MOVEMENT_SPEED, ARMOR, ARMOR_TOUGHNESS, KNOCKBACK_RESISTANCE)
  const hasAttrs = Number(it.bonusMaxHealth) > 0 || Number(it.bonusMovementSpeed) > 0 || Number(it.bonusArmor) > 0 || Number(it.bonusToughness) > 0 || Number(it.bonusKnockbackResistance) > 0;

  if (DIALECT === "mojmap") {
    // Mojang 1.21.11 の Item.Properties#attributes
    if (tool || it.kind === "armor" || hasAttrs) {
      parts.push(`.attributes(run {\n`);
      parts.push(`            val b = ItemAttributeModifiers.builder()\n`);
      const slotGroup = it.kind === "armor"
        ? ({ HELMET: "HEAD", CHESTPLATE: "CHEST", LEGGINGS: "LEGS", BOOTS: "FEET" }[it.armorSlot] ?? "CHEST")
        : "MAINHAND";

      if (tool) {
        const cls = clsOf(it);
        const dmg = it.kind === "sword" ? i(it.attackDamage) : f(it.attackDamage);
        // バニラツール基準値
        parts.push(`            // ツール・武器の基礎攻撃力と攻撃速度\n`);
        if (it.kind === "sword") {
          parts.push(`            b.add(Attributes.ATTACK_DAMAGE, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "base_attack_damage"), ${it.attackDamage + 3.0}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.MAINHAND)\n`);
          parts.push(`            b.add(Attributes.ATTACK_SPEED, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "base_attack_speed"), ${it.attackSpeed}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.MAINHAND)\n`);
        } else {
          parts.push(`            b.add(Attributes.ATTACK_DAMAGE, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "base_attack_damage"), ${it.attackDamage + 1.0}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.MAINHAND)\n`);
          parts.push(`            b.add(Attributes.ATTACK_SPEED, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "base_attack_speed"), ${it.attackSpeed}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.MAINHAND)\n`);
        }
      }

      if (it.kind === "armor") {
        // バニラ防具素材値 (素材設定があれば)
        const baseDef = { HELMET: 3, CHESTPLATE: 8, LEGGINGS: 6, BOOTS: 3 }[it.armorSlot] ?? 3;
        const baseTough = ({ DIAMOND: 2.0, NETHERITE: 3.0 } as Record<string, number>)[it.armorMaterial] ?? 0.0;
        const baseKb = it.armorMaterial === "NETHERITE" ? 0.1 : 0.0;
        parts.push(`            // 防具の基礎防御力、タフネス、ノックバック耐性\n`);
        parts.push(`            b.add(Attributes.ARMOR, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "base_armor"), ${baseDef}.0, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})\n`);
        if (baseTough > 0) parts.push(`            b.add(Attributes.ARMOR_TOUGHNESS, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "base_toughness"), ${baseTough}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})\n`);
        if (baseKb > 0) parts.push(`            b.add(Attributes.KNOCKBACK_RESISTANCE, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "base_kb"), ${baseKb}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})\n`);
      }

      if (Number(it.bonusMaxHealth) > 0) {
        parts.push(`            b.add(Attributes.MAX_HEALTH, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "bonus_max_health"), ${d(it.bonusMaxHealth || 0)}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})\n`);
      }
      if (Number(it.bonusMovementSpeed) > 0) {
        parts.push(`            b.add(Attributes.MOVEMENT_SPEED, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "bonus_speed"), ${d(it.bonusMovementSpeed || 0)}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})\n`);
      }
      if (Number(it.bonusArmor) > 0) {
        parts.push(`            b.add(Attributes.ARMOR, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "bonus_armor"), ${d(it.bonusArmor || 0)}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})\n`);
      }
      if (Number(it.bonusToughness) > 0) {
        parts.push(`            b.add(Attributes.ARMOR_TOUGHNESS, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "bonus_toughness"), ${d(it.bonusToughness || 0)}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})\n`);
      }
      if (Number(it.bonusKnockbackResistance) > 0) {
        parts.push(`            b.add(Attributes.KNOCKBACK_RESISTANCE, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "bonus_kb"), ${d(it.bonusKnockbackResistance || 0)}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})\n`);
      }

      parts.push(`            b.build()\n`);
      parts.push(`        })`);
    }

    if (it.kind === "armor" || (it.durability > 0 && it.kind === "simple")) parts.push(`.maxDamage(${i(it.durability || 100)})`);
    else if (!tool && it.maxCount !== 64) parts.push(`.stacksTo(${i(it.maxCount)})`);
  } else {
    // Yarn 1.21.1 形式 (既存と互換)
    if (tool) {
      const base = mat ? it.attackDamage * mat.dmg : it.attackDamage;
      const dmg = it.kind === "sword" ? i(base) : f(base);
      parts.push(`.attributeModifiers(${clsOf(it)}.createAttributeModifiers(ToolMaterials.${it.material}, ${dmg}, ${f(it.attackSpeed)}))`);
      if (mat) parts.push(`.maxDamage(${i(mat.dur)})`);
    }
    else if (it.kind === "armor") parts.push(`.maxDamage(${i(mat ? mat.dur : armorDurability(it))})`);
    else if (it.durability > 0 && it.kind === "simple") parts.push(`.maxDamage(${i(it.durability)})`);
    else if (it.maxCount !== 64) parts.push(`.maxCount(${i(it.maxCount)})`);
  }

  if (it.rarity !== "COMMON") parts.push(`.rarity(Rarity.${it.rarity})`);
  if (it.fireproof) parts.push(DIALECT === "mojmap" ? ".fireResistant()" : ".fireproof()");
  if (it.glint) parts.push(DIALECT === "mojmap" ? ".component(DataComponents.ENCHANTMENT_GLINT_OVERRIDE, true)" : ".component(DataComponentTypes.ENCHANTMENT_GLINT_OVERRIDE, true)");
  if (it.food) parts.push(DIALECT === "mojmap"
    ? `.food(FoodProperties.Builder().nutrition(${i(it.food.nutrition)}).saturationModifier(${f(it.food.saturation)}).build())`
    : `.food(FoodComponent.Builder().nutrition(${i(it.food.nutrition)}).saturationModifier(${f(it.food.saturation)}).build())`);
  return parts.join("");
}

function modItemKt(project: ModProject): string {
  if (DIALECT === "mojmap") return buildKotlin(project, project.meta.packageName, mojModItemBody(), { raw: true });
  const body = `/** スキルとツールチップを持てる汎用アイテム */
class ModItem(
    settings: Item.Settings,
    private val skillId: String? = null,
    private val shiftSkillId: String? = null,
    private val leftClickSkillId: String? = null,
    private val tooltipLines: List<String> = emptyList(),
) : Item(settings) {
    override fun use(world: World, user: PlayerEntity, hand: Hand): TypedActionResult<ItemStack> {
        val stack = user.getStackInHand(hand)
        val activeSkill = if (user.isSneaking && shiftSkillId != null) shiftSkillId else skillId
        if (activeSkill == null) return super.use(world, user, hand)
        if (world.isClient || user !is ServerPlayerEntity) return TypedActionResult.pass(stack)
        if (!SkillManager.cast(activeSkill, user)) return TypedActionResult.fail(stack)
        val cooldown = SkillManager.get(skillId)?.cooldownTicks ?: 0
        if (cooldown > 0) user.itemCooldownManager.set(this, cooldown)
        return TypedActionResult.success(stack)
    }

    override fun appendTooltip(stack: ItemStack, context: Item.TooltipContext, tooltip: MutableList<Text>, type: TooltipType) {
        for (line in tooltipLines) tooltip.add(Text.literal(line).formatted(Formatting.GRAY))
        if (skillId != null) tooltip.add(Text.literal("Skill: " + skillId).formatted(Formatting.AQUA))
        super.appendTooltip(stack, context, tooltip, type)
    }
}`;
  return buildKotlin(project, project.meta.packageName, body);
}

function itemsKt(project: ModProject): string {
  if (DIALECT === "mojmap") return buildKotlin(project, project.meta.packageName, mojItemsBody(project, MOJ()), { raw: true });
  const lines = project.items.map((it) => {
    const mat = materialOf(project, it);
    const tip = it.tooltip.split("\n").map((x) => x.trim()).filter(Boolean);
    const custom = it.skillId || it.shiftSkillId || it.leftClickSkillId || tip.length > 0;
    const tail = `${it.skillId ? q(it.skillId) : "null"}, ${it.shiftSkillId ? q(it.shiftSkillId) : "null"}, ${it.leftClickSkillId ? q(it.leftClickSkillId) : "null"}${tip.length ? `, listOf(${tip.map(q).join(", ")})` : ""}`;
    const set = itemSettings(it, mat ? { dmg: mat.damageMultiplier, dur: scaledDurability(it, mat, armorDurability(it)) } : undefined);
    let ctor: string;
    switch (it.kind) {
      case "sword": ctor = `SwordItem(ToolMaterials.${it.material}, ${set})`; break;
      case "pickaxe": ctor = `PickaxeItem(ToolMaterials.${it.material}, ${set})`; break;
      case "axe": ctor = `AxeItem(ToolMaterials.${it.material}, ${set})`; break;
      case "shovel": ctor = `ShovelItem(ToolMaterials.${it.material}, ${set})`; break;
      case "armor": ctor = `ArmorItem(ArmorMaterials.${it.armorMaterial}, ArmorItem.Type.${it.armorSlot}, ${set})`; break;
      default: ctor = custom ? `ModItem(${set}, ${tail})` : `Item(${set})`;
    }
    return `val ${constName(it.id)}: Item = register(${q(it.id)}, ${ctor})`;
  });
  const leftClick = project.items.filter((x) => x.leftClickSkillId).map((x) => `${constName(x.id)} to ${q(x.leftClickSkillId!)}`);
  const body = `object ModItems {
${ind(lines, 4).join("\n")}

    /** 左クリック (殴り) で発動するスキル */
    val LEFT_CLICK_SKILLS: Map<Item, String> = ${leftClick.length ? `mapOf(${leftClick.join(", ")})` : "emptyMap()"}

    private fun <T : Item> register(id: String, item: T): T =
        Registry.register(Registries.ITEM, Identifier.of(ModInfo.MOD_ID, id), item)

    fun register() {
        ModInfo.LOGGER.info("Registered ${project.items.length} items")
    }
}`;
  return buildKotlin(project, project.meta.packageName, body);
}

function blocksKt(project: ModProject): string {
  if (DIALECT === "mojmap") return buildKotlin(project, project.meta.packageName, mojBlocksBody(project, MOJ()), { raw: true });
  const lines = project.blocks.map((b) => {
    let s = `AbstractBlock.Settings.create().strength(${f(b.hardness)}, ${f(b.resistance)}).sounds(BlockSoundGroup.${constName(b.sound)})`;
    if (b.luminance > 0) s += `.luminance { _ -> ${i(b.luminance)} }`;
    if (b.requiresTool) s += ".requiresTool()";
    const xp = b.ore && b.ore.xpMax > 0 ? `ExperienceDroppingBlock(UniformIntProvider.create(${i(b.ore.xpMin)}, ${i(Math.max(b.ore.xpMin, b.ore.xpMax))}), ${s})` : `Block(${s})`;
    return `val ${constName(b.id)}: Block = registerBlock(${q(b.id)}, ${xp}, ${b.skillId ? q(b.skillId) : "null"}, ${b.shiftSkillId ? q(b.shiftSkillId) : "null"})`;
  });
  const body = `object ModBlocks {
    /** 右クリックでスキルが発動するブロック */
    val SKILL_BLOCKS = HashMap<Block, String>()
    val SHIFT_SKILL_BLOCKS = HashMap<Block, String>()

${ind(lines, 4).join("\n")}

    private fun registerBlock(id: String, block: Block, skillId: String? = null, shiftSkillId: String? = null): Block {
        val identifier = Identifier.of(ModInfo.MOD_ID, id)
        Registry.register(Registries.ITEM, identifier, BlockItem(block, Item.Settings()))
        if (skillId != null) SKILL_BLOCKS[block] = skillId
        if (shiftSkillId != null) SHIFT_SKILL_BLOCKS[block] = shiftSkillId
        return Registry.register(Registries.BLOCK, identifier, block)
    }

    fun register() {
        ModInfo.LOGGER.info("Registered ${project.blocks.length} blocks")
    }
}`;
  return buildKotlin(project, project.meta.packageName, body);
}

function groupKt(project: ModProject): string {
  if (DIALECT === "mojmap") return buildKotlin(project, project.meta.packageName, mojGroupBody(project, MOJ()), { raw: true });
  const icon = project.items[0] ? `ModItems.${constName(project.items[0].id)}` : project.blocks[0] ? `ModBlocks.${constName(project.blocks[0].id)}` : "Items.STICK";
  const entries = [
    ...project.items.map((x) => `entries.add(ModItems.${constName(x.id)})`),
    ...project.blocks.map((x) => `entries.add(ModBlocks.${constName(x.id)})`),
  ];
  const body = `object ModItemGroup {
    val MAIN: ItemGroup = Registry.register(
        Registries.ITEM_GROUP,
        Identifier.of(ModInfo.MOD_ID, "main"),
        FabricItemGroup.builder()
            .icon { ItemStack(${icon}) }
            .displayName(Text.translatable("itemGroup." + ModInfo.MOD_ID + ".main"))
            .entries { _, entries ->
${ind(entries.length ? entries : ["// (エントリなし)"], 16).join("\n")}
            }
            .build(),
    )

    fun register() {
        ModInfo.LOGGER.info("Registered creative tab")
    }
}`;
  return buildKotlin(project, project.meta.packageName, body);
}

function configKt(project: ModProject): string {
  const c = project.config;
  const keys: number[] = c.slotKeys.length ? c.slotKeys.map(Number) : [82, 71, 72, 86];
  const slots = (c.slots.length ? c.slots : ["", "", "", ""]).slice(0, 4);
  while (slots.length < 4) slots.push("");
  const body = `/** config/${project.meta.modId}.json に保存される設定 */
object ModConfig {
    var maxMana: Int = ${Math.round(num(c.maxMana, 100))}
    var regenPerSecond: Int = ${Math.round(num(c.regenPerSecond, 2))}
    var hud: Boolean = ${c.hud ? "true" : "false"}
    /** キースロット1〜4に割り当てるスキルID */
    var slots: List<String> = listOf(${slots.map((x) => q(x)).join(", ")})
    /** GLFWキーコード (既定: R / G / H / V) */
    var slotKeys: List<Int> = listOf(${keys.map((k) => Math.round(Number(k) || 0)).join(", ")})

    private val file: Path
        get() = FabricLoader.getInstance().configDir.resolve(ModInfo.MOD_ID + ".json")

    fun load() {
        val f = file
        if (Files.exists(f)) {
            try {
                val obj = JsonParser.parseString(Files.readString(f)).asJsonObject
                if (obj.has("maxMana")) maxMana = obj.get("maxMana").asInt
                if (obj.has("regenPerSecond")) regenPerSecond = obj.get("regenPerSecond").asInt
                if (obj.has("hud")) hud = obj.get("hud").asBoolean
                if (obj.has("slots")) {
                    val arr = obj.getAsJsonArray("slots")
                    slots = (0 until 4).map { i -> if (i < arr.size()) arr.get(i).asString else "" }
                }
                if (obj.has("slotKeys")) {
                    val arr = obj.getAsJsonArray("slotKeys")
                    slotKeys = (0 until 4).map { i -> if (i < arr.size()) arr.get(i).asInt else GLFW.GLFW_KEY_UNKNOWN }
                }
            } catch (e: Exception) {
                ModInfo.LOGGER.warn("Failed to read config, using defaults", e)
            }
        }
        save()
        ModInfo.LOGGER.info("Config loaded: maxMana=" + maxMana + " regen=" + regenPerSecond)
    }

    fun save() {
        val obj = JsonObject()
        obj.addProperty("maxMana", maxMana)
        obj.addProperty("regenPerSecond", regenPerSecond)
        obj.addProperty("hud", hud)
        val arr = com.google.gson.JsonArray()
        for (s in slots) arr.add(s)
        obj.add("slots", arr)
        val keys = com.google.gson.JsonArray()
        for (k in slotKeys) keys.add(k)
        obj.add("slotKeys", keys)
        try {
            Files.createDirectories(file.parent)
            Files.writeString(file, GsonBuilder().setPrettyPrinting().create().toJson(obj))
        } catch (e: IOException) {
            ModInfo.LOGGER.warn("Failed to write config", e)
        }
    }
}`;
  return buildKotlin(project, project.meta.packageName, body);
}

function networkingKt(project: ModProject): string {
  if (DIALECT === "mojmap") return buildKotlin(project, `${project.meta.packageName}.net`, mojNetworkBody(), { raw: true });
  const pkg = `${project.meta.packageName}.net`;
  const body = `/** サーバー -> クライアント: マナの同期 */
class ManaSyncPayload(val mana: Float, val max: Float) : CustomPayload {
    companion object {
        val ID = CustomPayload.Id<ManaSyncPayload>(Identifier.of(ModInfo.MOD_ID, "mana_sync"))
        val CODEC = PacketCodec.tuple(PacketCodecs.FLOAT, ManaSyncPayload::mana, PacketCodecs.FLOAT, ManaSyncPayload::max, ::ManaSyncPayload)
    }

    override fun getId(): CustomPayload.Id<*> = ID
}

/** クライアント -> サーバー: キーバインドによるスキル発動 */
class CastSlotPayload(val slot: Int) : CustomPayload {
    companion object {
        val ID = CustomPayload.Id<CastSlotPayload>(Identifier.of(ModInfo.MOD_ID, "cast_slot"))
        val CODEC = PacketCodec.tuple(PacketCodecs.VAR_INT, CastSlotPayload::slot, ::CastSlotPayload)
    }

    override fun getId(): CustomPayload.Id<*> = ID
}

object ModNetworking {
    fun register() {
        PayloadTypeRegistry.playS2C().register(ManaSyncPayload.ID, ManaSyncPayload.CODEC)
        PayloadTypeRegistry.playC2S().register(CastSlotPayload.ID, CastSlotPayload.CODEC)
        ServerPlayNetworking.registerGlobalReceiver(CastSlotPayload.ID) { payload, context ->
            context.player().server.execute {
                SkillManager.castSlot(context.player(), payload.slot)
            }
        }
    }
}`;
  return buildKotlin(project, pkg, body);
}

function clientKt(project: ModProject): string {
  if (DIALECT === "mojmap") return buildKotlin(project, `${project.meta.packageName}.client`, mojClientBody(project), { raw: true });
  const pkg = `${project.meta.packageName}.client`;
  const names = ["R", "G", "H", "V"];
  const keyLabel = names.join("/");
  const body = `/** クライアント側: キーバインドとマナHUD */
class ModClient : ClientModInitializer {
    private lateinit var slotKeys: List<KeyBinding>

    override fun onInitializeClient() {
        ClientPlayNetworking.registerGlobalReceiver(ManaSyncPayload.ID) { payload, _ ->
            HudState.mana = payload.mana
            HudState.maxMana = payload.max
        }

        slotKeys = ModConfig.slotKeys.mapIndexed { i, code ->
            KeyBinding("key." + ModInfo.MOD_ID + ".slot" + (i + 1), InputUtil.Type.KEYSYM, code, "key.category." + ModInfo.MOD_ID)
        }
        for (key in slotKeys) KeyBindingHelper.registerKeyBinding(key)

        ClientTickEvents.END_CLIENT_TICK.register { _ ->
            for (i in slotKeys.indices) {
                while (slotKeys[i].wasPressed()) ClientPlayNetworking.send(CastSlotPayload(i))
            }
        }

        HudRenderCallback.EVENT.register { context, _ -> renderHud(context) }
        ModInfo.LOGGER.info("Client init: ${project.skills.length} skills bound to keys ${keyLabel}")
    }

    private fun renderHud(context: DrawContext) {
        if (!ModConfig.hud) return
        val client = MinecraftClient.getInstance()
        val player = client.player ?: return
        if (client.options.hudHidden || player.isSpectator) return
        if (HudState.maxMana <= 0f) return

        val width = context.scaledWindowWidth
        val height = context.scaledWindowHeight
        val barWidth = 124
        val x = width / 2 - barWidth / 2
        val y = height - 39
        val ratio = (HudState.mana / HudState.maxMana).coerceIn(0f, 1f)

        context.fill(x - 1, y - 1, x + barWidth + 1, y + 6, 0xCC000000.toInt())
        context.fill(x, y, x + (barWidth * ratio).toInt(), y + 5, 0xFF38BDF8.toInt())
        context.drawTextWithShadow(client.textRenderer, "MP " + HudState.mana.toInt() + "/" + HudState.maxMana.toInt(), x, y - 10, 0xFF7DD3FC.toInt())

        for (i in ModConfig.slots.indices) {
            val label = ModConfig.slots[i].ifBlank { "-" }
            context.drawTextWithShadow(client.textRenderer, (i + 1).toString() + ":" + label, x + i * 32, y + 8, 0xFFCBD5E1.toInt())
        }
    }
}

/** クライアント側のマナ表示状態 (サーバーからのパケットで更新) */
object HudState {
    var mana: Float = 100f
    var maxMana: Float = 100f
}`;
  return buildKotlin(project, pkg, body);
}

function worldGenKt(project: ModProject): string {
  const ores = project.blocks.filter((b) => b.ore);
  const surfaces = project.blocks.filter((b) => b.surface);
  const sel = { OVERWORLD: "foundInOverworld", NETHER: "foundInTheNether", END: "foundInTheEnd" } as const;
  /** バイオームタグでの絞り込み (空 = 全バイオーム) */
  const tag = (t?: string) => (t && t.trim() ? `.and(BiomeSelectors.tag(TagKey.of(RegistryKeys.BIOME, Identifier.of(${q(t.trim())}))))` : "");
  const feature = (id: string) => `RegistryKey.of(RegistryKeys.PLACED_FEATURE, Identifier.of(ModInfo.MOD_ID, ${q(id)}))`;
  const lines = [
    ...ores.map((b) => `BiomeModifications.addFeature(BiomeSelectors.${sel[b.ore!.dimension] ?? "foundInOverworld"}()${tag(b.ore!.biomeTag)}, GenerationStep.Feature.UNDERGROUND_ORES, ${feature("ore_" + b.id)})`),
    ...surfaces.map((b) => `BiomeModifications.addFeature(BiomeSelectors.foundInOverworld()${tag(b.surface!.biomeTag)}, GenerationStep.Feature.VEGETAL_DECORATION, ${feature("surface_" + b.id)})`),
  ];
  const body = `/** 鉱石・地表クラスターのワールド生成 (新しく生成されるチャンクのみ) */
object ModWorldGen {
    fun register() {
${ind(lines.length ? lines : ["// (生成設定なし)"], 8).join("\n")}
        ModInfo.LOGGER.info("Registered ${ores.length} ore generators, ${surfaces.length} surface generators")
    }
}`;
  return buildKotlin(project, project.meta.packageName, body);
}

function mainKt(project: ModProject): string {
  const body = `object ModInfo {
    const val MOD_ID = ${q(project.meta.modId)}
    val LOGGER: Logger = LoggerFactory.getLogger(MOD_ID)
}

class ModMain : ModInitializer {
    override fun onInitialize() {
        ModInfo.LOGGER.info("Initializing " + ModInfo.MOD_ID)
        ModConfig.load()
        SkillManager.maxMana = ModConfig.maxMana
        SkillManager.regenPerSecond = ModConfig.regenPerSecond
        ModItems.register()
        ModBlocks.register()
        ModItemGroup.register()
        ModWorldGen.register()
        ModMobs.register()
        ModExtras.register()
        ModItemAttributes.register()
        Skills.register()
        ModNetworking.register()
        SkillTriggers.register()
        ServerLifecycleEvents.SERVER_STARTED.register { server ->
            SkillManager.load(server)
            Variables.load(server)
        }
        ServerLifecycleEvents.SERVER_STOPPING.register { server ->
            SkillManager.save(server)
            Variables.save(server)
        }
        ServerPlayConnectionEvents.JOIN.register { handler, _, _ -> SkillManager.sync(handler.player) }
    }
}`;
  return buildKotlin(project, project.meta.packageName, body);
}

// ---------- resources ----------
function recipeJson(project: ModProject, r: ProjectRecipe) {
  const cells = r.grid.map((x) => x.trim());
  // 1.21.2 以降は材料を文字列で表す ("minecraft:stick" / "#minecraft:planks")。それ以前は {item} / {tag}
  const ing = (raw: string): any => {
    const isTag = raw.startsWith("#");
    const id = ns(project, isTag ? raw.slice(1) : raw);
    if (DIALECT === "mojmap") return isTag ? `#${id}` : id;
    return isTag ? { tag: id } : { item: id };
  };

  const isCooking = ["smelting", "blasting", "smoking", "campfire_cooking"].includes(r.type);
  const resultId = ns(project, r.resultItem);
  const count = Math.max(1, Math.round(r.resultCount));

  if (isCooking) {
    const ingredient = ing(r.inputItem || "");
    const xp = Number(r.cookingExperience) || 0.1;
    const time = Math.max(1, Math.round(r.cookingTimeTicks ?? 200));
    return {
      type: `minecraft:${r.type}`,
      category: "misc",
      ingredient,
      result: DIALECT === "mojmap" ? resultId : { item: resultId },
      experience: xp,
      cookingtime: time
    };
  }

  if (r.type === "stonecutting") {
    const ingredient = ing(r.inputItem || "");
    return {
      type: "minecraft:stonecutting",
      ingredient,
      result: resultId,
      count
    };
  }

  const result = { id: resultId, count };
  if (r.type === "shapeless") {
    return { type: "minecraft:crafting_shapeless", category: "misc", ingredients: cells.filter(Boolean).map((c) => ing(c)), result };
  }
  const rows = [0, 1, 2].map((y) => cells.slice(y * 3, y * 3 + 3));
  const usedRows = rows.map((row, y) => (row.some(Boolean) ? y : -1)).filter((y) => y >= 0);
  const usedCols = [0, 1, 2].filter((x) => rows.some((row) => row[x]));
  const keys = new Map<string, string>();
  const letters = "ABCDEFGHI";
  const pattern = usedRows.map((y) =>
    usedCols.map((x) => {
      const c = rows[y][x];
      if (!c) return " ";
      const id = c;
      if (!keys.has(id)) keys.set(id, letters[keys.size]);
      return keys.get(id)!;
    }).join(""),
  );
  const key: Record<string, any> = {};
  keys.forEach((letter, id) => (key[letter] = ing(id)));
  return { type: "minecraft:crafting_shaped", category: "misc", pattern, key, result };
}
type ProjectRecipe = ModProject["recipes"][number];

/** ブロックのルートテーブル。鉱石はドロップ/幸運/シルクタッチ/爆発減衰に対応 */
function lootTable(project: ModProject, b: ModProject["blocks"][number]) {
  const self = `${project.meta.modId}:${b.id}`;
  const o = b.ore;
  if (!o || !o.dropItem.trim() || ns(project, o.dropItem) === self) {
    return { type: "minecraft:block", pools: [{ rolls: 1.0, bonus_rolls: 0.0, entries: [{ type: "minecraft:item", name: self }], conditions: [{ condition: "minecraft:survives_explosion" }] }] };
  }
  const lo = Math.max(0, Math.round(o.dropMin));
  const hi = Math.max(lo, Math.round(o.dropMax));
  const functions: Record<string, unknown>[] = [
    lo === hi ? { function: "minecraft:set_count", count: lo } : { function: "minecraft:set_count", count: { type: "minecraft:uniform", min: lo, max: hi } },
  ];
  if (o.fortune) functions.push({ function: "minecraft:apply_bonus", enchantment: "minecraft:fortune", formula: "minecraft:ore_drops" });
  if (o.explosionDecay) functions.push({ function: "minecraft:explosion_decay" });
  const drop = { type: "minecraft:item", name: ns(project, o.dropItem), functions };
  const silk = {
    type: "minecraft:item", name: self,
    conditions: [{ condition: "minecraft:match_tool", predicate: { predicates: { "minecraft:enchantments": [{ enchantments: "minecraft:silk_touch", levels: { min: 1 } }] } } }],
  };
  return {
    type: "minecraft:block",
    pools: [{ rolls: 1.0, bonus_rolls: 0.0, entries: [o.silkTouch ? { type: "minecraft:alternatives", children: [silk, drop] } : drop] }],
  };
}


/** カスタムモブ + ハクスラ型ドロップ表 (ModMobs.kt)。Yarn名で書き、mojmapへは translateBody が変換 */
function mobsKt(project: ModProject): string {
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
  return buildKotlin(project, project.meta.packageName, body);
}

/** 実績 (ルートタブ + 各実績)。進捗は impossible トリガーの段数 (step_1..N) で表現し、実行時に award する */
function advancementJsons(project: ModProject): { id: string; json: unknown }[] {
  const mod = project.meta.modId;
  const list = project.advancements ?? [];
  if (list.length === 0) return [];
  const out: { id: string; json: unknown }[] = [];
  out.push({
    id: "root",
    json: {
      display: {
        icon: { count: 1, id: ns(project, list[0].icon || "minecraft:nether_star") },
        title: { text: project.meta.name }, description: { text: `${project.meta.name} の実績` },
        background: "minecraft:gui/advancements/backgrounds/stone", show_toast: false, announce_to_chat: false,
      },
      criteria: { auto: { trigger: "minecraft:tick" } },
      requirements: [["auto"]],
    },
  });
  for (const a of list) {
    const parent = a.parent ? (list.some((x) => x.id === a.parent) ? `${mod}:${a.parent}` : a.parent) : `${mod}:root`;
    let criteria: Record<string, unknown>;
    let requirements: string[][];
    if (a.kind === "OBTAIN_ITEM") {
      criteria = { obtain: { trigger: "minecraft:inventory_changed", conditions: { items: [{ items: ns(project, a.item) }] } } };
      requirements = [["obtain"]];
    } else {
      const n = Math.max(1, Math.round(a.steps));
      criteria = Object.fromEntries(Array.from({ length: n }, (_, k) => [`step_${k + 1}`, { trigger: "minecraft:impossible" }]));
      requirements = Array.from({ length: n }, (_, k) => [`step_${k + 1}`]);
    }
    out.push({
      id: a.id,
      json: {
        parent,
        display: {
          icon: { count: 1, id: ns(project, a.icon) },
          title: { text: a.name }, description: { text: a.description },
          frame: a.frame, show_toast: true, announce_to_chat: true, hidden: a.hidden,
        },
        criteria, requirements,
        ...(a.rewardXp > 0 ? { rewards: { experience: Math.round(a.rewardXp) } } : {}),
      },
    });
  }
  return out;
}

export function generateProject(project: ModProject): GeneratedFile[] {
  const { meta } = project;
  const env: TargetEnv = resolveEnv(meta);
  const moj = env.mappings === "mojmap";
  const FABRIC = env; // eslint-disable-line @typescript-eslint/no-shadow
  DIALECT = moj ? "mojmap" : "yarn";
  setRegistryMode(DIALECT);
  const pkgPath = meta.packageName.replace(/\./g, "/");
  const files: GeneratedFile[] = [];
  const kt = (path: string, content: string) => files.push({ path: `src/main/kotlin/${pkgPath}/${path}`, content, kind: "kotlin" });
  const res = (path: string, content: string, kind: GeneratedFile["kind"] = "json") => files.push({ path: `src/main/resources/${path}`, content, kind });

  kt("ModMain.kt", mainKt(project));
  kt("ModItems.kt", itemsKt(project));
  kt("ModItem.kt", modItemKt(project));
  kt("ModBlocks.kt", blocksKt(project));
  kt("ModItemGroup.kt", groupKt(project));
  kt("ModWorldGen.kt", worldGenKt(project));
  kt("ModConfig.kt", configKt(project));
  kt("net/ModNetworking.kt", networkingKt(project));
  kt("client/ModClient.kt", clientKt(project));
  kt("skill/SkillRuntime.kt", runtimeKt(project));
  kt("skill/Skills.kt", skillsKt(project));
  kt("skill/SkillTriggers.kt", triggersKt(project));
  kt("ModMobs.kt", mobsKt(project));
  files.push(...geckolibMobFiles(project));
  const exH = { q, d, f, i, ind, ns: (id: string) => ns(project, id) };
  kt("ModItemAttributes.kt", moj ? buildKotlin(project, meta.packageName, itemAttributesMojBody(project, exH), { raw: true }) : buildKotlin(project, meta.packageName, itemAttributesYarnStub()));
  kt("ModExtras.kt", moj ? buildKotlin(project, meta.packageName, extrasMojBody(project, exH), { raw: true }) : buildKotlin(project, meta.packageName, extrasYarnStub()));

  res("fabric.mod.json", js({
    schemaVersion: 1, id: meta.modId, version: meta.version, name: meta.name, description: meta.description,
    authors: [meta.author], license: meta.license, environment: "*",
    icon: `assets/${meta.modId}/icon.png`,
    entrypoints: {
      main: [{ adapter: "kotlin", value: `${meta.packageName}.ModMain` }],
      ...(hasGeckolib(project)
        ? { client: [{ adapter: "kotlin", value: `${meta.packageName}.client.GeckoMobRenderers` }] }
        : {}),
    },
    depends: { fabricloader: `>=${FABRIC.loader}`, minecraft: `~${FABRIC.minecraft}`, java: `>=${FABRIC.java}`, "fabric-api": "*", "fabric-language-kotlin": "*" },
  }));

  const lang: Record<string, string> = { [`itemGroup.${meta.modId}.main`]: meta.name };
  project.items.forEach((x) => (lang[`item.${meta.modId}.${x.id}`] = x.name));
  project.blocks.forEach((x) => (lang[`block.${meta.modId}.${x.id}`] = x.name));
  const langJa: Record<string, string> = { [`itemGroup.${meta.modId}.main`]: meta.name };
  project.items.forEach((x) => (langJa[`item.${meta.modId}.${x.id}`] = x.name));
  project.blocks.forEach((x) => (langJa[`block.${meta.modId}.${x.id}`] = x.name));
  if (moj) project.effects.forEach((e) => { lang[`effect.${meta.modId}.${e.id}`] = e.name; langJa[`effect.${meta.modId}.${e.id}`] = e.name; });
  const catKey = moj ? `key.category.${meta.modId}.main` : `key.category.${meta.modId}`;
  const keyCat: Record<string, string> = { [catKey]: "スキル" };
  const keyNames = ["R", "G", "H", "V"];
  keyNames.forEach((_n, i) => (keyCat[`key.${meta.modId}.slot${i + 1}`] = `スキルスロット${i + 1}`));
  res(`assets/${meta.modId}/lang/en_us.json`, js({ ...lang, ...keyCat }));
  res(`assets/${meta.modId}/lang/ja_jp.json`, js({ ...langJa, [catKey]: "スキル", ...Object.fromEntries(keyNames.map((_, i) => [`key.${meta.modId}.slot${i + 1}`, `スキルスロット${i + 1}`])) }));

  const bin = (path: string, b64: string) => files.push({ path, content: b64, kind: "binary", encoding: "base64" });
  for (const it of project.items) {
    const png = parsePngDataUrl(it.customTexture);
    if (png) bin(`src/main/resources/assets/${meta.modId}/textures/item/${it.id}.png`, png);
    if (moj) res(`assets/${meta.modId}/items/${it.id}.json`, js({ model: { type: "minecraft:model", model: `${meta.modId}:item/${it.id}` } }));
    if (it.customModelJson && it.customModelJson.trim().startsWith("{")) {
      try {
        const customObj = JSON.parse(it.customModelJson);
        res(`assets/${meta.modId}/models/item/${it.id}.json`, js(customObj));
      } catch {
        res(`assets/${meta.modId}/models/item/${it.id}.json`, js({ parent: `minecraft:item/${it.model}`, textures: { layer0: png ? `${meta.modId}:item/${it.id}` : it.texture } }));
      }
    } else {
      res(`assets/${meta.modId}/models/item/${it.id}.json`, js({ parent: `minecraft:item/${it.model}`, textures: { layer0: png ? `${meta.modId}:item/${it.id}` : it.texture } }));
    }
  }
  bin(`src/main/resources/assets/${meta.modId}/icon.png`, makeIconPngBase64(meta.modId));
  const tags: Record<string, string[]> = {};
  for (const b of project.blocks) {
    res(`assets/${meta.modId}/blockstates/${b.id}.json`, js({ variants: { "": { model: `${meta.modId}:block/${b.id}` } } }));
    const bpng = parsePngDataUrl(b.customTexture);
    if (bpng) bin(`src/main/resources/assets/${meta.modId}/textures/block/${b.id}.png`, bpng);
    res(`assets/${meta.modId}/models/block/${b.id}.json`, js({ parent: "minecraft:block/cube_all", textures: { all: bpng ? `${meta.modId}:block/${b.id}` : b.texture } }));
    if (moj) res(`assets/${meta.modId}/items/${b.id}.json`, js({ model: { type: "minecraft:model", model: `${meta.modId}:block/${b.id}` } }));
    else res(`assets/${meta.modId}/models/item/${b.id}.json`, js({ parent: `${meta.modId}:block/${b.id}` }));
    res(`data/${meta.modId}/loot_table/blocks/${b.id}.json`, js(lootTable(project, b)));
    if (b.ore) {
      const o = b.ore;
      const fid = `${meta.modId}:ore_${b.id}`;
      const state = { Name: `${meta.modId}:${b.id}` };
      const targets =
        o.dimension === "NETHER" ? [{ state, target: { predicate_type: "minecraft:tag_match", tag: "minecraft:base_stone_nether" } }]
          : o.dimension === "END" ? [{ state, target: { predicate_type: "minecraft:block_match", block: "minecraft:end_stone" } }]
            : [
              { state, target: { predicate_type: "minecraft:tag_match", tag: "minecraft:stone_ore_replaceables" } },
              { state, target: { predicate_type: "minecraft:tag_match", tag: "minecraft:deepslate_ore_replaceables" } },
            ];
      res(`data/${meta.modId}/worldgen/configured_feature/ore_${b.id}.json`, js({
        type: "minecraft:ore",
        config: { discard_chance_on_air_exposure: 0.0, size: Math.max(1, Math.round(o.veinSize)), targets },
      }));
      res(`data/${meta.modId}/worldgen/placed_feature/ore_${b.id}.json`, js({
        feature: fid,
        placement: [
          { type: "minecraft:count", count: Math.max(1, Math.round(o.veinsPerChunk)) },
          { type: "minecraft:in_square" },
          { type: "minecraft:height_range", height: { type: "minecraft:uniform", min_inclusive: { absolute: Math.round(o.minY) }, max_inclusive: { absolute: Math.round(Math.max(o.minY, o.maxY)) } } },
          { type: "minecraft:biome" },
        ],
      }));
    }
    if (b.tool !== "none") (tags[`mineable/${b.tool}`] ??= []).push(`${meta.modId}:${b.id}`);
    if (b.toolTier !== "none") (tags[`needs_${b.toolTier}_tool`] ??= []).push(`${meta.modId}:${b.id}`);
  }
  // 地表クラスター生成 (random_patch)
  for (const b of project.blocks) {
    if (!b.surface) continue;
    const sf = b.surface;
    res(`data/${meta.modId}/worldgen/configured_feature/surface_${b.id}.json`, js({
      type: "minecraft:random_patch",
      config: {
        feature: {
          feature: { type: "minecraft:simple_block", config: { to_place: { type: "minecraft:simple_state_provider", state: { Name: `${meta.modId}:${b.id}` } } } },
          placement: [{
            type: "minecraft:block_predicate_filter",
            predicate: { type: "minecraft:all_of", predicates: [{ type: "minecraft:matching_blocks", blocks: "minecraft:air" }, { type: "minecraft:solid", offset: [0, -1, 0] }] },
          }],
        },
        tries: Math.max(1, Math.round(sf.tries)),
        xz_spread: Math.max(1, Math.round(sf.spread)),
        y_spread: 3,
      },
    }));
    res(`data/${meta.modId}/worldgen/placed_feature/surface_${b.id}.json`, js({
      feature: `${meta.modId}:surface_${b.id}`,
      placement: [
        { type: "minecraft:rarity_filter", chance: Math.max(1, Math.round(sf.rarity)) },
        { type: "minecraft:in_square" },
        { type: "minecraft:heightmap", heightmap: "MOTION_BLOCKING" },
        { type: "minecraft:biome" },
      ],
    }));
  }
  // カスタムエフェクトのアイコン / 実績 (1.21.11 のみ)
  if (moj) {
    for (const e of project.effects) bin(`src/main/resources/assets/${meta.modId}/textures/mob_effect/${e.id}.png`, makeEffectIconBase64(e.color));
    for (const adv of advancementJsons(project)) res(`data/${meta.modId}/advancement/${adv.id}.json`, js(adv.json));
  }
  for (const [tag, values] of Object.entries(tags)) res(`data/minecraft/tags/block/${tag}.json`, js({ replace: false, values }));
  for (const r of project.recipes) {
    res(`data/${meta.modId}/recipe/${r.id}.json`, js(recipeJson(project, r)));
    const material = r.grid.map((x) => x.trim()).find(Boolean);
    if (material) {
      res(`data/${meta.modId}/advancement/recipe/${r.id}.json`, js({
        parent: "minecraft:recipes/root",
        criteria: {
          has_material: { trigger: "minecraft:inventory_changed", conditions: { items: [{ items: [ns(project, material)] }] } },
          has_the_recipe: { trigger: "minecraft:recipe_unlocked", conditions: { recipe: `${meta.modId}:${r.id}` } },
        },
        requirements: [["has_material", "has_the_recipe"]],
        rewards: { recipes: [`${meta.modId}:${r.id}`] },
      }));
    }
  }

  // --- gradle ---
  files.push(...gradleFiles(project, env));
  files.push({ path: ".gitignore", kind: "text", content: `.gradle/
build/
out/
run/
.idea/
*.iml
.classpath
.project
.settings/
bin/
` });
  files.push({ path: ".github/workflows/build.yml", kind: "text", content: `name: build
on: [push, pull_request, workflow_dispatch]

jobs:
  build:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - uses: gradle/actions/setup-gradle@v4
      - name: Build
        run: chmod +x gradlew && ./gradlew build
      - uses: actions/upload-artifact@v4
        with:
          name: ${meta.modId}-jar
          path: build/libs/
` });
  const ores = project.blocks.filter((x) => x.ore);
  const armors = project.items.filter((x) => x.kind === "armor");
  const list = (arr: string[]) => (arr.length ? arr.map((x) => `- ${x}`).join("\n") : "- (なし)");
  files.push({ path: "README.md", kind: "text", content: `# ${meta.name}

MythicForge が生成した Minecraft ${FABRIC.minecraft} Fabric Mod (Kotlin) です。

## ビルド環境 (プロファイル: ${FABRIC.profile})
| 項目 | 値 |
|---|---|
| Minecraft | ${FABRIC.minecraft} |
| マッピング | ${FABRIC.mappings === "mojmap" ? "Mojang 公式 (loom.officialMojangMappings)" : `Yarn ${FABRIC.yarn}`} |
| Fabric Loom | ${FABRIC.loom} (プラグインID: \`${FABRIC.loomPlugin}\`) |
| Gradle Wrapper | ${FABRIC.gradle} |
| Fabric Loader / API | ${FABRIC.loader} / ${FABRIC.fabricApi} |
| Kotlin / FLK | ${FABRIC.kotlin} / ${FABRIC.kotlinLoader} |
| Java | ${FABRIC.java} |

${FABRIC.mappings === "mojmap" ? "> カスタムKotlinは **Mojang 名** (例: `ServerPlayer`, `Level`, `Identifier.fromNamespaceAndPath`) で書いてください。Yarn 名 (`ServerPlayerEntity` など) と混ぜるとコンパイルできません。\n" : ""}
## この Mod に含まれるもの
**スキル (${project.skills.length})**
${list(project.skills.map((x) => `\`${x.id}\` ${x.name} — ${x.trigger.type === "MANUAL" ? "手動" : x.trigger.type} / CD ${x.cooldown}s / MP ${x.manaCost}`))}

**アイテム (${project.items.length})** — うち防具 ${armors.length}
${list(project.items.map((x) => `\`${meta.modId}:${x.id}\` ${x.name} (${x.kind})`))}

**ブロック (${project.blocks.length})** — うち鉱石 ${ores.length}
${list(project.blocks.map((x) => `\`${meta.modId}:${x.id}\` ${x.name}${x.ore ? ` — 鉱石 (${x.ore.dimension}, Y ${x.ore.minY}〜${x.ore.maxY}, ${x.ore.veinsPerChunk}脈/チャンク, 脈サイズ${x.ore.veinSize})` : ""}`))}

**レシピ (${project.recipes.length})**
${list(project.recipes.map((x) => `\`${x.id}\` → ${x.resultItem} x${x.resultCount}`))}

## 主な機能
- **スキル発動**: アイテム/ブロックの右クリック、キースロット(既定 R/G/H/V)、\`/skill cast <id>\`
- **ミサイル**: 毎tick飛翔する弾。着弾点を origin としてスキルを発動
- **変数**: \`setVar/addVar/ifVar\`、条件 \`VARIABLE\`、テキスト内 \`<var.x> <target.x> <global.x> <player> <mana> <health>\`。ワールドの \`mythicforge_vars.json\` に保存
- **マナ**: HUD表示 + パケット同期 + ワールドに保存
- **防具**: 素材(LEATHER〜NETHERITE/TURTLE)に応じた防御力・見た目。装備中トリガー(WEAR)でセット効果
- **鉱石**: ドロップ設定(幸運/シルクタッチ/爆発減衰)とワールド生成(新規チャンクのみ)
- **設定**: \`config/${meta.modId}.json\`

## ビルド方法
### IntelliJ IDEA (推奨)
1. このフォルダを **プロジェクトとして開く** (build.gradle.kts を選択 → "Open as Project")
2. **JDK 21 を用意**: File > Project Structure > SDKs で追加、無ければ "Download JDK" で Temurin 21
3. **Gradle JVM を 21 に**: File > Settings > Build, Execution, Deployment > Build Tools > Gradle > **Gradle JVM = 21**
4. Gradle タブの 🔄 を実行 (初回は Minecraft のダウンロードと変換で数分かかります)
5. 実行構成 **Minecraft Client / Minecraft Server** が自動生成されます。\`build\` タスクで \`build/libs/${meta.modId}-${meta.version}.jar\` が出力されます

> ❗ \`This build uses a Java 8 JVM\` / \`Dependency requires at least JVM runtime version 21\` と出た場合は手順3の Gradle JVM が古い JDK のままです。

### コマンドライン
\`\`\`
# JDK 21 を JAVA_HOME に設定
./gradlew build          # Windows: gradlew.bat build
./gradlew runClient      # 開発用クライアント起動
./gradlew runServer      # 開発用サーバー (初回は run/eula.txt の eula=true が必要)
\`\`\`
Gradle Wrapper (${FABRIC.gradle}) 同梱のため Gradle のインストールは不要です。

### GitHub Actions
push するだけで \`.github/workflows/build.yml\` がビルドし、Artifacts に jar を出力します。

## 導入
Fabric Loader ${FABRIC.loader}+ / Fabric API / Fabric Language Kotlin を入れた \`mods/\` に jar を配置してください。

## ゲーム内コマンド
\`\`\`
/skill cast <id>   # スキル発動 (OP)
/skill list        # スキル一覧
/skill mana        # マナ確認
/skill slots       # キースロット割り当て
/shop <id>          # ショップ (取引画面) を開く  ※1.21.11
/sp                 # スキルポイント一覧 / /sp buy <id> で強化  ※1.21.11
/${meta.modId} spawn <mob>  # カスタムモブを召喚
\`\`\`

## テクスチャ
アップロードしたPNGは \`assets/${meta.modId}/textures/{item,block}/\` に出力されます。未アップロードの要素はバニラのテクスチャを参照します。
` });
  return files;
}

/** 生成済みSkills.ktからカスタムKotlinブロックの行範囲を取得 */
export function customRanges(content: string): Record<string, { start: number; end: number }> {
  const out: Record<string, { start: number; end: number }> = {};
  content.split("\n").forEach((line, idx) => {
    const t = line.trim();
    if (t.startsWith(CUSTOM_OPEN)) out[t.slice(CUSTOM_OPEN.length)] = { start: idx + 2, end: idx + 2 };
    else if (t.startsWith(CUSTOM_CLOSE)) {
      const r = out[t.slice(CUSTOM_CLOSE.length)];
      if (r) r.end = idx;
    }
  });
  return out;
}
