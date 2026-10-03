import type { GeneratedFile, ModMob, ModProject, ModRecipe } from "./types";

function ktStr(s: string): string {
  return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/\n/g, "\\n") + '"';
}
function d(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return Number.isInteger(v) ? v.toFixed(1) : String(v);
}
export function mobFnName(name: string): string {
  return "apply" + name.replace(/[^A-Za-z0-9]/g, "_").replace(/^./, (c) => c.toUpperCase());
}

const SLOTS: [keyof ModMob["equipment"], string][] = [
  ["mainhand", "MAINHAND"], ["offhand", "OFFHAND"], ["head", "HEAD"], ["chest", "CHEST"], ["legs", "LEGS"], ["feet", "FEET"],
];

function applyFn(m: ModMob): string {
  const lines: string[] = [];
  lines.push(`e.addCommandTag(TAG + ${ktStr(m.name)})`);
  if (m.displayName.trim()) {
    lines.push(`e.customName = Text.literal(${ktStr(m.displayName)})`);
    lines.push(`e.isCustomNameVisible = ${m.showName}`);
  }
  if (m.glowing) lines.push(`e.isGlowing = true`);
  if (m.silent) lines.push(`e.isSilent = true`);
  const living: string[] = [];
  living.push(`setAttr(e, EntityAttributes.GENERIC_MAX_HEALTH, ${d(m.health)})`);
  living.push(`e.health = ${d(m.health)}f`);
  living.push(`setAttr(e, EntityAttributes.GENERIC_ATTACK_DAMAGE, ${d(m.damage)})`);
  if (m.speedMultiplier !== 1) living.push(`mulAttr(e, EntityAttributes.GENERIC_MOVEMENT_SPEED, ${d(m.speedMultiplier)})`);
  if (m.armor > 0) living.push(`setAttr(e, EntityAttributes.GENERIC_ARMOR, ${d(m.armor)})`);
  if (m.knockbackResistance > 0) living.push(`setAttr(e, EntityAttributes.GENERIC_KNOCKBACK_RESISTANCE, ${d(Math.min(1, m.knockbackResistance))})`);
  for (const [k, slot] of SLOTS) if (m.equipment[k]?.trim()) living.push(`equip(e, EquipmentSlot.${slot}, ${ktStr(m.equipment[k].trim())})`);
  for (const ef of m.effects)
    living.push(`e.addStatusEffect(StatusEffectInstance(StatusEffects.${ef.type.toUpperCase()}, StatusEffectInstance.INFINITE, ${Math.max(0, Math.trunc(ef.level))}, false, false))`);
  lines.push(`if (e is LivingEntity) {\n${living.map((l) => "    " + l).join("\n")}\n}`);
  if (m.persistent) lines.push(`(e as? MobEntity)?.setPersistent()`);
  return `    /** ${m.displayName.replace(/\*\//g, "")} (${m.baseType}) */\n    private fun ${mobFnName(m.name)}(e: Entity) {\n${lines.map((l) => l.split("\n").map((x) => "        " + x).join("\n")).join("\n")}\n    }`;
}

export function genCustomMobsKt(p: ModProject, fnMap: Map<string, string>): string {
  const pkg = p.meta.packageName;
  const mobs = p.mobs;
  const names = mobs.map((m) => ktStr(m.name)).join(", ");
  const baseCases = mobs.map((m) => `            ${ktStr(m.name)} -> ${ktStr(m.baseType)}`).join("\n");
  const applyCases = mobs.map((m) => `            ${ktStr(m.name)} -> ${mobFnName(m.name)}(e)`).join("\n");

  // trigger dispatch
  const fireCases: string[] = [];
  const timers: { mob: string; interval: number; skills: string[] }[] = [];
  for (const m of mobs) {
    const by = new Map<string, string[]>();
    for (const t of m.triggers) {
      const fn = fnMap.get(t.skill);
      if (!fn) continue;
      if (t.trigger === "onTimer") {
        const iv = Math.max(1, Math.trunc(t.interval ?? 40));
        const ex = timers.find((x) => x.mob === m.name && x.interval === iv);
        if (ex) ex.skills.push(fn);
        else timers.push({ mob: m.name, interval: iv, skills: [fn] });
        continue;
      }
      by.set(t.trigger, [...(by.get(t.trigger) ?? []), fn]);
    }
    for (const [tr, fns] of by) fireCases.push(`            ${ktStr(m.name + ":" + tr)} -> {\n${fns.map((f) => `                Skills.${f}(ctx)`).join("\n")}\n            }`);
  }
  for (const t of timers)
    fireCases.push(`            ${ktStr(`${t.mob}:onTimer:${t.interval}`)} -> {\n${t.skills.map((f) => `                Skills.${f}(ctx)`).join("\n")}\n            }`);

  const dropCases = mobs
    .filter((m) => m.drops.length || m.xp > 0)
    .map((m) => {
      const ls = m.drops.map((dr) => `                drop(e, ${ktStr(dr.item)}, ${Math.max(1, Math.trunc(dr.min))}, ${Math.max(Math.trunc(dr.min), Math.trunc(dr.max), 1)}, ${d(dr.chance)})`);
      if (m.xp > 0) ls.push(`                xp(e, ${Math.trunc(m.xp)})`);
      return `            ${ktStr(m.name)} -> {\n${ls.join("\n")}\n            }`;
    });

  const timerCode = timers
    .map((t) => `            if (ticks % ${t.interval}L == 0L) forEachMob(server, ${ktStr(t.mob)}) { mob -> fire(${ktStr(t.mob)}, ${ktStr(`onTimer:${t.interval}`)}, mob, (mob as? MobEntity)?.target) }`)
    .join("\n");

  const natural = mobs.filter((m) => m.naturalSpawn && m.spawnChance > 0);
  const naturalCode = natural
    .map((m) => `                if (typeId == ${ktStr(m.baseType)} && world.random.nextDouble() < ${d(m.spawnChance)}) {\n                    apply(${ktStr(m.name)}, entity)\n                    SkillScheduler.runLater(1) { fire(${ktStr(m.name)}, "onSpawn", entity, null) }\n                    return@register\n                }`)
    .join("\n");

  return `package ${pkg}.skill

import net.fabricmc.fabric.api.entity.event.v1.ServerLivingEntityEvents
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerEntityEvents
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents
import net.minecraft.entity.Entity
import net.minecraft.entity.EntityType
import net.minecraft.entity.EquipmentSlot
import net.minecraft.entity.ExperienceOrbEntity
import net.minecraft.entity.LivingEntity
import net.minecraft.entity.attribute.EntityAttribute
import net.minecraft.entity.attribute.EntityAttributes
import net.minecraft.entity.effect.StatusEffectInstance
import net.minecraft.entity.effect.StatusEffects
import net.minecraft.entity.mob.MobEntity
import net.minecraft.item.ItemStack
import net.minecraft.registry.Registries
import net.minecraft.registry.entry.RegistryEntry
import net.minecraft.server.MinecraftServer
import net.minecraft.server.world.ServerWorld
import net.minecraft.text.Text
import net.minecraft.util.Identifier
import net.minecraft.util.math.Vec3d

/**
 * カスタムモブ (MythicMobs 方式)
 * バニラのエンティティにタグ・名前・属性・装備・スキルを付与して実装します（クライアント側の追加描画は不要）。
 */
object CustomMobs {
    private const val TAG = "mcs_mob:"
    private const val CHECKED = "mcs_checked"
    private var ticks = 0L
    private var handlingDamage = false

    val NAMES: List<String> = listOf(${names})

    fun idOf(e: Entity?): String? = e?.commandTags?.firstOrNull { it.startsWith(TAG) }?.removePrefix(TAG)

    fun isMob(e: Entity?, id: String): Boolean = idOf(e) == id

    fun spawn(name: String, world: ServerWorld, pos: Vec3d): Entity? {
        val base: String = when (name) {
${baseCases ? baseCases + "\n" : ""}            else -> return null
        }
        val type = EntityType.get(base).orElse(null) ?: return null
        val e = type.create(world) ?: return null
        e.refreshPositionAndAngles(pos.x, pos.y, pos.z, world.random.nextFloat() * 360.0f, 0.0f)
        e.addCommandTag(CHECKED)
        apply(name, e)
        world.spawnEntity(e)
        fire(name, "onSpawn", e, null)
        return e
    }

    fun apply(name: String, e: Entity) {
        when (name) {
${applyCases ? applyCases + "\n" : ""}            else -> {}
        }
    }
${mobs.length ? "\n" + mobs.map(applyFn).join("\n\n") + "\n" : ""}
    private fun setAttr(e: LivingEntity, attr: RegistryEntry<EntityAttribute>, value: Double) {
        e.getAttributeInstance(attr)?.baseValue = value
    }

    private fun mulAttr(e: LivingEntity, attr: RegistryEntry<EntityAttribute>, factor: Double) {
        val inst = e.getAttributeInstance(attr) ?: return
        inst.baseValue = inst.baseValue * factor
    }

    private fun equip(e: LivingEntity, slot: EquipmentSlot, itemId: String) {
        e.equipStack(slot, ItemStack(Registries.ITEM.get(Identifier.of(itemId))))
        (e as? MobEntity)?.setEquipmentDropChance(slot, 0.0f)
    }

    private fun fire(name: String, trigger: String, caster: Entity, target: Entity?) {
        val ctx = SkillRuntime.contextOf(caster, target) ?: return
        when (name + ":" + trigger) {
${fireCases.length ? fireCases.join("\n") + "\n" : ""}            else -> {}
        }
    }

    private fun drop(e: LivingEntity, itemId: String, min: Int, max: Int, chance: Double) {
        val world = e.world as? ServerWorld ?: return
        if (world.random.nextDouble() >= chance) return
        val count = min + world.random.nextInt(max - min + 1)
        e.dropStack(ItemStack(Registries.ITEM.get(Identifier.of(itemId)), count))
    }

    private fun xp(e: LivingEntity, amount: Int) {
        val world = e.world as? ServerWorld ?: return
        ExperienceOrbEntity.spawn(world, e.pos, amount)
    }

    private fun drops(name: String, e: LivingEntity) {
        when (name) {
${dropCases.length ? dropCases.join("\n") + "\n" : ""}            else -> {}
        }
    }

    private fun forEachMob(server: MinecraftServer, name: String, action: (Entity) -> Unit) {
        for (world in server.worlds) {
            val list = world.iterateEntities().filter { it.isAlive && idOf(it) == name }
            for (mob in list) action(mob)
        }
    }

    fun init() {
        ServerLivingEntityEvents.AFTER_DEATH.register { entity, source ->
            val name = idOf(entity) ?: return@register
            drops(name, entity)
            fire(name, "onDeath", entity, source.attacker)
        }
        ServerLivingEntityEvents.ALLOW_DAMAGE.register { entity, source, _ ->
            if (!handlingDamage) {
                handlingDamage = true
                try {
                    val attacker = source.attacker
                    val victimId = idOf(entity)
                    if (victimId != null) fire(victimId, "onDamaged", entity, attacker)
                    val attackerId = idOf(attacker)
                    if (attackerId != null && attacker != null) fire(attackerId, "onAttack", attacker, entity)
                } finally {
                    handlingDamage = false
                }
            }
            true
        }
        ServerTickEvents.END_SERVER_TICK.register { server ->
            ticks++
${timerCode ? timerCode + "\n" : ""}        }
        ServerEntityEvents.ENTITY_LOAD.register { entity, world ->
            if (entity.commandTags.contains(CHECKED)) return@register
            entity.addCommandTag(CHECKED)
            if (idOf(entity) != null) return@register
            val typeId = Registries.ENTITY_TYPE.getId(entity.type).toString()
${naturalCode ? naturalCode + "\n" : `            if (typeId.isEmpty() || world.isClient) return@register\n`}        }
    }
}
`;
}

// ------------------------------------------------------------------ recipes
function ing(id: string): Record<string, string> {
  const s = id.trim();
  return s.startsWith("#") ? { tag: s.slice(1) } : { item: s };
}

/** 3x3 グリッドを最小の形に切り詰めて pattern/key を作る */
export function shapedFromGrid(grid: string[]): { pattern: string[]; key: Record<string, string> } {
  const cells = Array.from({ length: 9 }, (_, i) => (grid[i] ?? "").trim());
  const rows = [0, 1, 2].filter((r) => [0, 1, 2].some((c) => cells[r * 3 + c]));
  const cols = [0, 1, 2].filter((c) => [0, 1, 2].some((r) => cells[r * 3 + c]));
  const symbols = "ABCDEFGHI";
  const key: Record<string, string> = {};
  const map = new Map<string, string>();
  const pattern = rows.map((r) =>
    cols
      .map((c) => {
        const id = cells[r * 3 + c];
        if (!id) return " ";
        if (!map.has(id)) {
          const sym = symbols[map.size];
          map.set(id, sym);
          key[sym] = id;
        }
        return map.get(id)!;
      })
      .join(""),
  );
  return { pattern, key };
}

function recipeJson(r: ModRecipe): unknown {
  const result = { id: r.result.trim(), count: Math.max(1, Math.trunc(r.count)) };
  switch (r.type) {
    case "shaped": {
      const { pattern, key } = shapedFromGrid(r.grid);
      return {
        type: "minecraft:crafting_shaped",
        category: "misc",
        pattern,
        key: Object.fromEntries(Object.entries(key).map(([k, v]) => [k, ing(v)])),
        result,
      };
    }
    case "shapeless":
      return { type: "minecraft:crafting_shapeless", category: "misc", ingredients: r.grid.filter((g) => g.trim()).map(ing), result };
    case "stonecutting":
      return { type: "minecraft:stonecutting", ingredient: ing(r.input), result };
    default:
      return {
        type: `minecraft:${r.type}`,
        category: "misc",
        ingredient: ing(r.input),
        result: { id: r.result.trim() },
        experience: r.experience,
        cookingtime: Math.max(1, Math.trunc(r.cookingTime)),
      };
  }
}

export function genRecipes(p: ModProject): GeneratedFile[] {
  return p.recipes.map((r) => ({
    path: `src/main/resources/data/${p.meta.modId}/recipe/${r.name}.json`,
    content: JSON.stringify(recipeJson(r), null, 2) + "\n",
    language: "json" as const,
  }));
}
