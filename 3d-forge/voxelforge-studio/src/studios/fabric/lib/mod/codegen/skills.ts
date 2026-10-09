import type { Action, Condition, ModProject, SkillDef } from "../model";
import { buildKotlin } from "./kotlin";
import {
  armorDurability,
  constName,
  d,
  f,
  i,
  indent as ind,
  json as js,
  namespaced as ns,
  number as num,
  q,
  string as str,
  targetMode as tm,
  toolClass as clsOf,
  variableName as varName,
  variableScope as scopeOf,
  type Dialect,
} from "./shared";


// ---------- skills ----------
export function genCondition(c: Condition): string {
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

export function skillsKt(project: ModProject, dialect: Dialect): string {
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
  return buildKotlin(project, dialect, `${project.meta.packageName}.skill`, body, { extraImports: extra });
}

function holdingCheck(s: SkillDef, playerVar: string) {
  return s.trigger.heldItem.trim() ? ` && SkillManager.isHolding(${playerVar}, ${q(s.trigger.heldItem.trim())})` : "";
}

export function triggersKt(project: ModProject, dialect: Dialect): string {
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
  return buildKotlin(project, dialect, `${project.meta.packageName}.skill`, body);
}

// ---------- items / blocks ----------
