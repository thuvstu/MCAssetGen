import { CONDITIONS, MECHANICS, TARGETERS, findCondition, findMechanic, findTargeter, kDouble, type GenCtx } from "./catalog";
import { conditionsKt, mechanicsKt, skillCoreKt, targetersKt } from "./kotlinRuntime";
import { serializeLine } from "./skillText";
import { genCustomMobsKt, genRecipes } from "./mobgen";
import type { ConditionRef, GeneratedFile, ModBlock, ModItem, ModProject, Skill, SkillLine } from "./types";

export const KOTLIN_KEYWORDS = new Set([
  "as", "break", "class", "continue", "do", "else", "false", "for", "fun", "if", "in", "interface", "is", "null",
  "object", "package", "return", "super", "this", "throw", "true", "try", "typealias", "typeof", "val", "var", "when", "while",
]);

export function toPascal(s: string): string {
  return s
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
}
export function toConst(s: string): string {
  return s.replace(/[^A-Za-z0-9]+/g, "_").replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
}
export function skillFnName(name: string): string {
  let n = name.replace(/[^A-Za-z0-9_]/g, "_");
  if (!n) n = "unnamed";
  if (/^[0-9]/.test(n)) n = "s_" + n;
  n = n[0].toLowerCase() + n.slice(1);
  if (KOTLIN_KEYWORDS.has(n)) n = n + "Skill";
  return n;
}
function jsonStr(o: unknown) {
  return JSON.stringify(o, null, 2) + "\n";
}
function indent(code: string, n: number): string {
  const pad = " ".repeat(n);
  return code
    .split("\n")
    .map((l) => (l.trim() ? pad + l : l))
    .join("\n");
}
function ktStr(s: string): string {
  return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/\n/g, "\\n") + '"';
}
function importBlock(set: Set<string>): string {
  return [...set].sort().map((i) => `import ${i}`).join("\n");
}

// ------------------------------------------------------------------ skills
function condExpr(conds: ConditionRef[], entityExpr: string, g: GenCtx): string | null {
  const parts: string[] = [];
  for (const c of conds) {
    const def = findCondition(c.type);
    if (!def) continue;
    const e = def.gen(c.params, entityExpr, g);
    parts.push(c.negate ? `!${e}` : e);
  }
  return parts.length ? parts.join(" && ") : null;
}

function genLines(skill: Skill, lines: SkillLine[], startIndex: number, g: GenCtx): string {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = startIndex + i + 1;
    const mech = findMechanic(line.mechanic);
    out.push(`// ${serializeLine(line)}`);
    if (!mech) {
      out.push(`// ⚠ 不明なメカニック: ${line.mechanic}`);
      continue;
    }
    if (mech.id === "delay") {
      const ticks = Math.max(1, Math.trunc(Number(line.params.ticks ?? 20)) || 20);
      const rest = genLines(skill, lines.slice(i + 1), startIndex + i + 1, g);
      out.push(`SkillScheduler.runLater(${ticks}) {`);
      out.push(indent(rest, 4));
      out.push(`}`);
      break;
    }
    const targ = findTargeter(line.targeter) ?? TARGETERS[0];
    const cond = condExpr(line.conditions, "t.entity", g);
    const body: string[] = [];
    if (cond) body.push(`if (!(${cond})) continue`);
    if (mech.id === "kotlin") {
      body.push(`val e = t.entity`);
      body.push(`// @origin skill=${skill.name} line=${lineNo}`);
      body.push(`run {`);
      body.push(indent(String(line.params.code ?? ""), 4));
      body.push(`}`);
      body.push(`// @end`);
    } else {
      body.push(mech.gen(line.params, g));
    }
    out.push(`for (t in ${targ.gen(line.targeterParams)}) {`);
    out.push(indent(body.join("\n"), 4));
    out.push(`}`);
  }
  return out.join("\n");
}

export function genSkillsKt(p: ModProject): string {
  const pkg = p.meta.packageName;
  const fnMap = new Map<string, string>();
  for (const s of p.skills) fnMap.set(s.name, skillFnName(s.name));
  const g: GenCtx = { imports: new Set(), skillFn: (n) => fnMap.get(n) };
  const bodies: string[] = [];
  for (const s of p.skills) {
    const fn = fnMap.get(s.name)!;
    for (const imp of (s.imports || "").split("\n").map((x) => x.trim().replace(/^import\s+/, "")).filter(Boolean)) g.imports.add(imp);
    const lines: string[] = [];
    if (s.cooldown > 0) lines.push(`if (!SkillRuntime.checkCooldown(${ktStr(s.name)}, ctx.caster, ${kDouble(s.cooldown)})) return`);
    const cond = condExpr(s.conditions, "ctx.caster", g);
    if (cond) lines.push(`if (!(${cond})) return`);
    lines.push(genLines(s, s.lines, 0, g));
    const doc = s.description ? `    /** ${s.description.replace(/\*\//g, "* /").replace(/\n/g, " ")} */\n` : "";
    bodies.push(`${doc}    fun ${fn}(ctx: SkillContext) {\n${indent(lines.join("\n"), 8)}\n    }`);
  }
  const names = p.skills.map((s) => ktStr(s.name)).join(", ");
  const cases = p.skills.map((s) => `            ${ktStr(s.name)} -> ${fnMap.get(s.name)}(ctx)`).join("\n");
  const imports = importBlock(g.imports);
  return `package ${pkg}.skill
${imports ? "\n" + imports + "\n" : ""}
/**
 * 自動生成されたスキル定義 (MythicCraft Studio)
 * 各スキルは SkillContext を受け取り、ターゲッター → 条件 → メカニック の順に実行されます。
 */
object Skills {
    val NAMES: List<String> = listOf(${names})

    fun cast(name: String, ctx: SkillContext): Boolean {
        when (name) {
${cases ? cases + "\n" : ""}            else -> return false
        }
        return true
    }
${bodies.length ? "\n" + bodies.join("\n\n") + "\n" : ""}}
`;
}

function call(skills: string[], ctxExpr: string, fnMap: Map<string, string>): string {
  const fns = skills.map((s) => fnMap.get(s)).filter(Boolean) as string[];
  if (fns.length === 0) return `// (スキル未設定)`;
  return `${ctxExpr}?.let { ctx ->\n${fns.map((f) => `    Skills.${f}(ctx)`).join("\n")}\n}`;
}

// ------------------------------------------------------------------ items
const ARMOR_KINDS = new Set(["helmet", "chestplate", "leggings", "boots"]);
const ARMOR_DURABILITY: Record<string, number> = { LEATHER: 5, CHAIN: 15, IRON: 15, GOLD: 7, DIAMOND: 33, NETHERITE: 37, TURTLE: 25 };
export const isArmor = (k: string) => ARMOR_KINDS.has(k);
const ITEM_BASE: Record<string, string> = {
  basic: "Item", food: "Item", sword: "SwordItem", pickaxe: "PickaxeItem", axe: "AxeItem", shovel: "ShovelItem", hoe: "HoeItem",
};

function genItemsKt(p: ModProject, fnMap: Map<string, string>): string {
  const pkg = p.meta.packageName;
  const imp = new Set<string>([
    "net.minecraft.item.Item",
    "net.minecraft.registry.Registries",
    "net.minecraft.registry.Registry",
    "net.minecraft.util.Identifier",
  ]);
  const regs: string[] = [];
  const classes: string[] = [];
  for (const it of p.items) {
    const cls = toPascal(it.registryName) + "Item";
    const armor = isArmor(it.kind);
    const isTool = it.kind !== "basic" && it.kind !== "food" && !armor;
    let settings = "Item.Settings()";
    if (armor) {
      imp.add("net.minecraft.item.ArmorItem");
      imp.add("net.minecraft.item.ArmorMaterials");
      settings += `.maxDamage(ArmorItem.Type.${it.kind.toUpperCase()}.getMaxDamage(${ARMOR_DURABILITY[it.armorMaterial ?? "IRON"] ?? 15}))`;
    } else if (!isTool) settings += `.maxCount(${Math.max(1, Math.min(99, it.maxCount || 64))})`;
    if (it.fireproof) settings += ".fireproof()";
    if (it.rarity !== "COMMON") {
      imp.add("net.minecraft.util.Rarity");
      settings += `.rarity(Rarity.${it.rarity})`;
    }
    if (it.kind === "food") {
      imp.add("net.minecraft.component.type.FoodComponent");
      settings += `.food(FoodComponent.Builder().nutrition(${Math.trunc(it.nutrition)}).saturationModifier(${kDouble(it.saturation)}f)${it.alwaysEdible ? ".alwaysEdible()" : ""}.build())`;
    }
    if (isTool) {
      imp.add("net.minecraft.item.ToolMaterials");
      if (it.kind === "sword") {
        imp.add("net.minecraft.item.SwordItem");
        settings += `.attributeModifiers(SwordItem.createAttributeModifiers(ToolMaterials.${it.material}, ${Math.trunc(it.attackDamage)}, ${kDouble(it.attackSpeed)}f))`;
      } else {
        imp.add("net.minecraft.item.MiningToolItem");
        imp.add(`net.minecraft.item.${ITEM_BASE[it.kind]}`);
        settings += `.attributeModifiers(MiningToolItem.createAttributeModifiers(ToolMaterials.${it.material}, ${kDouble(it.attackDamage)}f, ${kDouble(it.attackSpeed)}f))`;
      }
    }
    regs.push(`    val ${toConst(it.registryName)}: Item = register(${ktStr(it.registryName)}, ${cls}(${settings}))`);

    const base = ITEM_BASE[it.kind];
    const superCall = armor
      ? `ArmorItem(ArmorMaterials.${it.armorMaterial ?? "IRON"}, ArmorItem.Type.${it.kind.toUpperCase()}, settings)`
      : isTool ? `${base}(ToolMaterials.${it.material}, settings)` : `Item(settings)`;
    const members: string[] = [];
    const by = (tr: string) => it.triggers.filter((t) => t.trigger === tr).map((t) => t.skill);
    const onUse = by("onUse");
    if (onUse.length || it.useCooldown > 0) {
      ["net.minecraft.world.World", "net.minecraft.entity.player.PlayerEntity", "net.minecraft.util.Hand", "net.minecraft.util.TypedActionResult", "net.minecraft.item.ItemStack", `${pkg}.skill.SkillRuntime`, `${pkg}.skill.Skills`].forEach((x) => imp.add(x));
      const ret = it.kind === "food" ? "super.use(world, user, hand)" : "TypedActionResult.success(stack, world.isClient)";
      members.push(`    override fun use(world: World, user: PlayerEntity, hand: Hand): TypedActionResult<ItemStack> {
        val stack = user.getStackInHand(hand)
        if (!world.isClient) {
${indent(call(onUse, "SkillRuntime.contextOf(user)", fnMap), 12)}${it.useCooldown > 0 ? `\n            user.itemCooldownManager.set(this, ${Math.trunc(it.useCooldown)})` : ""}
        }
        return ${ret}
    }`);
    }
    const onAttack = by("onAttack");
    if (onAttack.length) {
      ["net.minecraft.item.ItemStack", "net.minecraft.entity.LivingEntity", `${pkg}.skill.SkillRuntime`, `${pkg}.skill.Skills`].forEach((x) => imp.add(x));
      members.push(`    override fun postHit(stack: ItemStack, target: LivingEntity, attacker: LivingEntity): Boolean {
        if (!attacker.world.isClient) {
${indent(call(onAttack, "SkillRuntime.contextOf(attacker, target, target.pos)", fnMap), 12)}
        }
        return super.postHit(stack, target, attacker)
    }`);
    }
    const onEat = by("onEat");
    if (onEat.length) {
      ["net.minecraft.item.ItemStack", "net.minecraft.entity.LivingEntity", "net.minecraft.world.World", `${pkg}.skill.SkillRuntime`, `${pkg}.skill.Skills`].forEach((x) => imp.add(x));
      members.push(`    override fun finishUsing(stack: ItemStack, world: World, user: LivingEntity): ItemStack {
        if (!world.isClient) {
${indent(call(onEat, "SkillRuntime.contextOf(user)", fnMap), 12)}
        }
        return super.finishUsing(stack, world, user)
    }`);
    }
    if (it.glint) {
      imp.add("net.minecraft.item.ItemStack");
      members.push(`    override fun hasGlint(stack: ItemStack): Boolean = true`);
    }
    if (it.tooltip.trim()) {
      ["net.minecraft.item.ItemStack", "net.minecraft.text.Text", "net.minecraft.util.Formatting", "net.minecraft.item.tooltip.TooltipType"].forEach((x) => imp.add(x));
      const adds = it.tooltip
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => `        tooltip.add(Text.literal(${ktStr(l)}).formatted(Formatting.GRAY))`)
        .join("\n");
      members.push(`    override fun appendTooltip(stack: ItemStack, context: Item.TooltipContext, tooltip: MutableList<Text>, type: TooltipType) {
${adds}
        super.appendTooltip(stack, context, tooltip, type)
    }`);
    }
    classes.push(
      `/** ${it.displayName} */\nclass ${cls}(settings: Item.Settings) : ${superCall}${members.length ? ` {\n${members.join("\n\n")}\n}` : ""}`,
    );
  }
  return `package ${pkg}

${importBlock(imp)}

object ModItems {
${regs.join("\n")}${regs.length ? "\n\n" : ""}    private fun register(name: String, item: Item): Item =
        Registry.register(Registries.ITEM, Identifier.of(${p.meta.mainClass}.MOD_ID, name), item)

    fun init() {
        ${p.meta.mainClass}.LOGGER.info("Registered ${p.items.length} items")
    }
}
${classes.length ? "\n" + classes.join("\n\n") + "\n" : ""}`;
}

// ------------------------------------------------------------------ blocks
function genBlocksKt(p: ModProject, fnMap: Map<string, string>): string {
  const pkg = p.meta.packageName;
  const imp = new Set<string>([
    "net.minecraft.block.AbstractBlock",
    "net.minecraft.block.Block",
    "net.minecraft.item.BlockItem",
    "net.minecraft.item.Item",
    "net.minecraft.registry.Registries",
    "net.minecraft.registry.Registry",
    "net.minecraft.util.Identifier",
  ]);
  const regs: string[] = [];
  const classes: string[] = [];
  for (const b of p.blocks) {
    const cls = toPascal(b.registryName) + "Block";
    let settings = `AbstractBlock.Settings.create().strength(${kDouble(b.hardness)}f, ${kDouble(b.resistance)}f)`;
    imp.add("net.minecraft.sound.BlockSoundGroup");
    settings += `.sounds(BlockSoundGroup.${b.sound})`;
    if (b.requiresTool) settings += ".requiresTool()";
    if (b.luminance > 0) settings += `.luminance { ${Math.min(15, Math.trunc(b.luminance))} }`;
    regs.push(`    val ${toConst(b.registryName)}: Block = register(${ktStr(b.registryName)}, ${cls}(${settings}))`);
    const by = (tr: string) => b.triggers.filter((t) => t.trigger === tr).map((t) => t.skill);
    const members: string[] = [];
    const common = ["net.minecraft.block.BlockState", "net.minecraft.util.math.BlockPos", "net.minecraft.world.World", "net.minecraft.util.math.Vec3d", `${pkg}.skill.SkillRuntime`, `${pkg}.skill.Skills`];
    const onInteract = by("onInteract");
    if (onInteract.length) {
      [...common, "net.minecraft.entity.player.PlayerEntity", "net.minecraft.util.hit.BlockHitResult", "net.minecraft.util.ActionResult"].forEach((x) => imp.add(x));
      members.push(`    override fun onUse(state: BlockState, world: World, pos: BlockPos, player: PlayerEntity, hit: BlockHitResult): ActionResult {
        if (!world.isClient) {
${indent(call(onInteract, "SkillRuntime.contextOf(player, null, Vec3d.ofCenter(pos))", fnMap), 12)}
        }
        return ActionResult.SUCCESS
    }`);
    }
    const onStep = by("onStep");
    if (onStep.length) {
      [...common, "net.minecraft.entity.Entity"].forEach((x) => imp.add(x));
      members.push(`    override fun onSteppedOn(world: World, pos: BlockPos, state: BlockState, entity: Entity) {
        if (!world.isClient) {
${indent(call(onStep, "SkillRuntime.contextOf(entity, null, Vec3d.ofCenter(pos))", fnMap), 12)}
        }
        super.onSteppedOn(world, pos, state, entity)
    }`);
    }
    const onPlace = by("onPlace");
    if (onPlace.length) {
      [...common, "net.minecraft.entity.LivingEntity", "net.minecraft.item.ItemStack"].forEach((x) => imp.add(x));
      members.push(`    override fun onPlaced(world: World, pos: BlockPos, state: BlockState, placer: LivingEntity?, itemStack: ItemStack) {
        super.onPlaced(world, pos, state, placer, itemStack)
        if (!world.isClient && placer != null) {
${indent(call(onPlace, "SkillRuntime.contextOf(placer, null, Vec3d.ofCenter(pos))", fnMap), 12)}
        }
    }`);
    }
    classes.push(`/** ${b.displayName} */\nclass ${cls}(settings: AbstractBlock.Settings) : Block(settings)${members.length ? ` {\n${members.join("\n\n")}\n}` : ""}`);
  }
  return `package ${pkg}

${importBlock(imp)}

object ModBlocks {
${regs.join("\n")}${regs.length ? "\n\n" : ""}    private fun register(name: String, block: Block): Block {
        val id = Identifier.of(${p.meta.mainClass}.MOD_ID, name)
        val registered = Registry.register(Registries.BLOCK, id, block)
        Registry.register(Registries.ITEM, id, BlockItem(registered, Item.Settings()))
        return registered
    }

    fun init() {
        ${p.meta.mainClass}.LOGGER.info("Registered ${p.blocks.length} blocks")
    }
}
${classes.length ? "\n" + classes.join("\n\n") + "\n" : ""}`;
}

function genItemGroupKt(p: ModProject): string {
  const pkg = p.meta.packageName;
  const entries = [
    ...p.items.map((i) => `ModItems.${toConst(i.registryName)}`),
    ...p.blocks.map((b) => `ModBlocks.${toConst(b.registryName)}`),
  ];
  const icon = entries[0] ?? "net.minecraft.item.Items.BOOK";
  return `package ${pkg}

import net.fabricmc.fabric.api.itemgroup.v1.FabricItemGroup
import net.minecraft.item.ItemGroup
import net.minecraft.item.ItemStack
import net.minecraft.registry.Registries
import net.minecraft.registry.Registry
import net.minecraft.text.Text
import net.minecraft.util.Identifier

object ModItemGroups {
    val MAIN: ItemGroup = Registry.register(
        Registries.ITEM_GROUP,
        Identifier.of(${p.meta.mainClass}.MOD_ID, "main"),
        FabricItemGroup.builder()
            .icon { ItemStack(${icon}) }
            .displayName(Text.translatable("itemGroup.${p.meta.modId}.main"))
            .entries { _, entries ->
${entries.map((e) => `                entries.add(${e})`).join("\n")}
            }
            .build()
    )

    fun init() {}
}
`;
}

// ------------------------------------------------------------------ events
function genEventsKt(p: ModProject, fnMap: Map<string, string>): string {
  const pkg = p.meta.packageName;
  const imp = new Set<string>([`${pkg}.skill.SkillRuntime`, `${pkg}.skill.Skills`]);
  const sections: string[] = [];

  // block break
  const breaks = p.blocks.filter((b) => b.triggers.some((t) => t.trigger === "onBreak"));
  if (breaks.length) {
    imp.add("net.fabricmc.fabric.api.event.player.PlayerBlockBreakEvents");
    imp.add("net.minecraft.util.math.Vec3d");
    const body = breaks
      .map((b) => `if (state.isOf(ModBlocks.${toConst(b.registryName)})) {\n${indent(call(b.triggers.filter((t) => t.trigger === "onBreak").map((t) => t.skill), "SkillRuntime.contextOf(player, null, Vec3d.ofCenter(pos))", fnMap), 4)}\n}`)
      .join("\n");
    sections.push(`// ~onBreak (ブロック破壊)
PlayerBlockBreakEvents.AFTER.register { world, player, pos, state, _ ->
    if (!world.isClient) {
${indent(body, 8)}
    }
}`);
  }

  const ge = (tr: string) => p.events.filter((e) => e.trigger === tr);
  if (ge("onJoin").length) {
    imp.add("net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents");
    sections.push(`// ~onJoin
ServerPlayConnectionEvents.JOIN.register { handler, _, _ ->
    val player = handler.player
${indent(call(ge("onJoin").map((e) => e.skill), "SkillRuntime.contextOf(player)", fnMap), 4)}
}`);
  }

  // ticks
  const tickParts: string[] = [];
  const intervals = new Map<number, string[]>();
  for (const e of ge("onTimer")) {
    const iv = Math.max(1, Math.trunc(e.interval || 20));
    intervals.set(iv, [...(intervals.get(iv) ?? []), e.skill]);
  }
  for (const [iv, skills] of intervals) {
    tickParts.push(`if (ticks % ${iv}L == 0L) {
    for (player in server.playerManager.playerList) {
${indent(call(skills, "SkillRuntime.contextOf(player)", fnMap), 8)}
    }
}`);
  }
  for (const it of p.items) {
    for (const t of it.triggers.filter((x) => x.trigger === "onHeld")) {
      const iv = Math.max(1, Math.trunc(t.interval || 20));
      tickParts.push(`if (ticks % ${iv}L == 0L) {
    for (player in server.playerManager.playerList) {
        if (player.mainHandStack.isOf(ModItems.${toConst(it.registryName)})) {
${indent(call([t.skill], "SkillRuntime.contextOf(player)", fnMap), 12)}
        }
    }
}`);
    }
  }
  for (const it of p.items) {
    for (const t of it.triggers.filter((x) => x.trigger === "onWear")) {
      const iv = Math.max(1, Math.trunc(t.interval || 20));
      tickParts.push(`if (ticks % ${iv}L == 0L) {
    for (player in server.playerManager.playerList) {
        if (player.inventory.armor.any { it.isOf(ModItems.${toConst(it.registryName)}) }) {
${indent(call([t.skill], "SkillRuntime.contextOf(player)", fnMap), 12)}
        }
    }
}`);
    }
  }
  for (const m of p.mobSkills.filter((x) => x.trigger === "onTimer")) {
    imp.add("net.minecraft.registry.Registries");
    imp.add("net.minecraft.entity.mob.MobEntity");
    const iv = Math.max(1, Math.trunc(m.interval || 40));
    tickParts.push(`if (ticks % ${iv}L == 0L) {
    for (world in server.worlds) {
        val mobs = world.iterateEntities().filter { it.isAlive && Registries.ENTITY_TYPE.getId(it.type).toString() == ${ktStr(m.entityType)} }
        for (mob in mobs) {
${indent(call([m.skill], "SkillRuntime.contextOf(mob, (mob as? MobEntity)?.target)", fnMap), 12)}
        }
    }
}`);
  }
  if (tickParts.length) {
    imp.add("net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents");
    sections.push(`// ~onTimer (タイマー系)
ServerTickEvents.END_SERVER_TICK.register { server ->
    ticks++
${indent(tickParts.join("\n"), 4)}
}`);
  }

  // death
  const deathParts: string[] = [];
  if (ge("onKill").length) {
    imp.add("net.minecraft.server.network.ServerPlayerEntity");
    deathParts.push(`if (attacker is ServerPlayerEntity) {\n${indent(call(ge("onKill").map((e) => e.skill), "SkillRuntime.contextOf(attacker, entity, entity.pos)", fnMap), 4)}\n}`);
  }
  if (ge("onDeath").length) {
    imp.add("net.minecraft.server.network.ServerPlayerEntity");
    deathParts.push(`if (entity is ServerPlayerEntity) {\n${indent(call(ge("onDeath").map((e) => e.skill), "SkillRuntime.contextOf(entity, attacker)", fnMap), 4)}\n}`);
  }
  const mobDeaths = p.mobSkills.filter((m) => m.trigger === "onDeath");
  for (const m of mobDeaths) {
    imp.add("net.minecraft.registry.Registries");
    deathParts.push(`if (Registries.ENTITY_TYPE.getId(entity.type).toString() == ${ktStr(m.entityType)}) {\n${indent(call([m.skill], "SkillRuntime.contextOf(entity, attacker)", fnMap), 4)}\n}`);
  }
  if (deathParts.length) {
    imp.add("net.fabricmc.fabric.api.entity.event.v1.ServerLivingEntityEvents");
    sections.push(`// ~onKill / ~onDeath
ServerLivingEntityEvents.AFTER_DEATH.register { entity, source ->
    val attacker = source.attacker
${indent(deathParts.join("\n"), 4)}
}`);
  }

  // damage
  const dmgParts: string[] = [];
  if (ge("onDamaged").length) {
    imp.add("net.minecraft.server.network.ServerPlayerEntity");
    dmgParts.push(`if (entity is ServerPlayerEntity) {\n${indent(call(ge("onDamaged").map((e) => e.skill), "SkillRuntime.contextOf(entity, attacker)", fnMap), 4)}\n}`);
  }
  if (ge("onAttack").length) {
    imp.add("net.minecraft.server.network.ServerPlayerEntity");
    dmgParts.push(`if (attacker is ServerPlayerEntity) {\n${indent(call(ge("onAttack").map((e) => e.skill), "SkillRuntime.contextOf(attacker, entity, entity.pos)", fnMap), 4)}\n}`);
  }
  for (const m of p.mobSkills.filter((x) => x.trigger === "onAttack")) {
    imp.add("net.minecraft.registry.Registries");
    dmgParts.push(`if (attacker != null && Registries.ENTITY_TYPE.getId(attacker.type).toString() == ${ktStr(m.entityType)}) {\n${indent(call([m.skill], "SkillRuntime.contextOf(attacker, entity, entity.pos)", fnMap), 4)}\n}`);
  }
  for (const m of p.mobSkills.filter((x) => x.trigger === "onDamaged")) {
    imp.add("net.minecraft.registry.Registries");
    dmgParts.push(`if (Registries.ENTITY_TYPE.getId(entity.type).toString() == ${ktStr(m.entityType)}) {\n${indent(call([m.skill], "SkillRuntime.contextOf(entity, attacker)", fnMap), 4)}\n}`);
  }
  if (dmgParts.length) {
    imp.add("net.fabricmc.fabric.api.entity.event.v1.ServerLivingEntityEvents");
    sections.push(`// ~onDamaged / ~onAttack (再帰防止ガード付き)
ServerLivingEntityEvents.ALLOW_DAMAGE.register { entity, source, _ ->
    if (!handlingDamage) {
        handlingDamage = true
        try {
            val attacker = source.attacker
${indent(dmgParts.join("\n"), 12)}
        } finally {
            handlingDamage = false
        }
    }
    true
}`);
  }

  return `package ${pkg}

${importBlock(imp)}

/** トリガー (~onX) とスキルの紐付け */
object ModEvents {
    private var ticks = 0L
    private var handlingDamage = false

    fun init() {
${sections.length ? indent(sections.join("\n\n"), 8) : "        // イベントなし"}
    }
}
`;
}

function genCommandsKt(p: ModProject, fnMap: Map<string, string>): string {
  const pkg = p.meta.packageName;
  const cmds = p.commands
    .map(
      (c) => `dispatcher.register(
    CommandManager.literal(${ktStr(c.name)})
        .requires { it.hasPermissionLevel(${Math.trunc(c.permissionLevel)}) }
        .executes { context ->
            val player = context.source.player ?: return@executes 0
            val base = SkillRuntime.contextOf(player) ?: return@executes 0
            val target = Targeters.lookEntity(base, 20.0).firstOrNull()?.entity
${indent(call([c.skill], "base.copy(target = target)", fnMap), 12)}
            1
        }
)`,
    )
    .join("\n");
  return `package ${pkg}

import ${pkg}.skill.CustomMobs
import ${pkg}.skill.SkillRuntime
import ${pkg}.skill.Skills
import ${pkg}.skill.Targeters
import com.mojang.brigadier.arguments.StringArgumentType
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback
import net.minecraft.command.CommandSource
import net.minecraft.server.command.CommandManager
import net.minecraft.text.Text

object ModCommands {
    fun init() {
        CommandRegistrationCallback.EVENT.register { dispatcher, _, _ ->
            // /${p.meta.modId} cast <skill> : 任意のスキルをデバッグ実行
            dispatcher.register(
                CommandManager.literal(${ktStr(p.meta.modId)})
                    .requires { it.hasPermissionLevel(2) }
                    .then(
                        CommandManager.literal("cast").then(
                            CommandManager.argument("skill", StringArgumentType.word())
                                .suggests { _, builder -> CommandSource.suggestMatching(Skills.NAMES, builder) }
                                .executes { context ->
                                    val player = context.source.player ?: return@executes 0
                                    val name = StringArgumentType.getString(context, "skill")
                                    val ctx = SkillRuntime.contextOf(player) ?: return@executes 0
                                    val target = Targeters.lookEntity(ctx, 20.0).firstOrNull()?.entity
                                    val ok = Skills.cast(name, ctx.copy(target = target))
                                    context.source.sendFeedback({ Text.literal(if (ok) "Cast: " + name else "Unknown skill: " + name) }, false)
                                    if (ok) 1 else 0
                                }
                        )
                    )
                    .then(
                        CommandManager.literal("spawn").then(
                            CommandManager.argument("mob", StringArgumentType.word())
                                .suggests { _, builder -> CommandSource.suggestMatching(CustomMobs.NAMES, builder) }
                                .executes { context ->
                                    val player = context.source.player ?: return@executes 0
                                    val name = StringArgumentType.getString(context, "mob")
                                    val world = context.source.world
                                    val pos = Targeters.forward(SkillRuntime.contextOf(player) ?: return@executes 0, 3.0).first().pos
                                    val e = CustomMobs.spawn(name, world, pos)
                                    context.source.sendFeedback({ Text.literal(if (e != null) "Spawned: " + name else "Unknown mob: " + name) }, false)
                                    if (e != null) 1 else 0
                                }
                        )
                    )
                    .then(
                        CommandManager.literal("skills").executes { context ->
                            context.source.sendFeedback({ Text.literal("Skills: " + Skills.NAMES.joinToString(", ")) }, false)
                            1
                        }
                    )
            )
${cmds ? indent(cmds, 12) + "\n" : ""}        }
    }
}
`;
}

function genWorldGenKt(p: ModProject): string {
  const pkg = p.meta.packageName;
  const ores = p.blocks.filter((b) => b.oreGen?.enabled);
  const sel = { overworld: "foundInOverworld", nether: "foundInTheNether", end: "foundInTheEnd" } as const;
  return `package ${pkg}

import net.fabricmc.fabric.api.biome.v1.BiomeModifications
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors
import net.minecraft.registry.RegistryKey
import net.minecraft.registry.RegistryKeys
import net.minecraft.util.Identifier
import net.minecraft.world.gen.GenerationStep

/** 鉱石の自然生成 (JSON: data/${p.meta.modId}/worldgen/) */
object ModWorldGen {
    fun init() {
${ores.length ? ores.map((b) => `        BiomeModifications.addFeature(
            BiomeSelectors.${sel[b.oreGen!.dimension]}(),
            GenerationStep.Feature.UNDERGROUND_ORES,
            RegistryKey.of(RegistryKeys.PLACED_FEATURE, Identifier.of(${p.meta.mainClass}.MOD_ID, "ore_${b.registryName}"))
        )`).join("\n") : "        // 鉱石生成なし"}
    }
}
`;
}

function genMainKt(p: ModProject): string {
  const pkg = p.meta.packageName;
  const hasGroup = p.items.length + p.blocks.length > 0;
  return `package ${pkg}

import ${pkg}.skill.CustomMobs
import ${pkg}.skill.SkillScheduler
import net.fabricmc.api.ModInitializer
import org.slf4j.Logger
import org.slf4j.LoggerFactory

object ${p.meta.mainClass} : ModInitializer {
    const val MOD_ID = ${ktStr(p.meta.modId)}
    val LOGGER: Logger = LoggerFactory.getLogger(MOD_ID)

    override fun onInitialize() {
        ModItems.init()
        ModBlocks.init()
${hasGroup ? "        ModItemGroups.init()\n" : ""}        SkillScheduler.init()
        ModEvents.init()
        CustomMobs.init()
        ModWorldGen.init()
        ModCommands.init()
        LOGGER.info("${p.meta.name} initialized")
    }
}
`;
}

// ------------------------------------------------------------------ resources
function genResources(p: ModProject): GeneratedFile[] {
  const m = p.meta;
  const files: GeneratedFile[] = [];
  const lang: Record<string, string> = { [`itemGroup.${m.modId}.main`]: m.name };
  for (const it of p.items) lang[`item.${m.modId}.${it.registryName}`] = it.displayName;
  for (const b of p.blocks) lang[`block.${m.modId}.${b.registryName}`] = b.displayName;
  files.push({ path: `src/main/resources/assets/${m.modId}/lang/en_us.json`, content: jsonStr(lang), language: "json" });
  files.push({ path: `src/main/resources/assets/${m.modId}/lang/ja_jp.json`, content: jsonStr(lang), language: "json" });

  for (const it of p.items) {
    const handheld = !["basic", "food"].includes(it.kind) && !isArmor(it.kind);
    files.push({
      path: `src/main/resources/assets/${m.modId}/models/item/${it.registryName}.json`,
      content: jsonStr({ parent: handheld ? "minecraft:item/handheld" : "minecraft:item/generated", textures: { layer0: `${m.modId}:item/${it.registryName}` } }),
      language: "json",
    });
  }
  const mineable: Record<string, string[]> = {};
  const levels: Record<string, string[]> = {};
  for (const b of p.blocks) {
    const id = `${m.modId}:${b.registryName}`;
    files.push({ path: `src/main/resources/assets/${m.modId}/blockstates/${b.registryName}.json`, content: jsonStr({ variants: { "": { model: `${m.modId}:block/${b.registryName}` } } }), language: "json" });
    files.push({ path: `src/main/resources/assets/${m.modId}/models/block/${b.registryName}.json`, content: jsonStr({ parent: "minecraft:block/cube_all", textures: { all: `${m.modId}:block/${b.registryName}` } }), language: "json" });
    files.push({ path: `src/main/resources/assets/${m.modId}/models/item/${b.registryName}.json`, content: jsonStr({ parent: `${m.modId}:block/${b.registryName}` }), language: "json" });
    if (b.dropItem && b.dropItem.trim()) {
      const min = Math.max(1, Math.trunc(b.dropMin ?? 1));
      const max = Math.max(min, Math.trunc(b.dropMax ?? 1));
      files.push({
        path: `src/main/resources/data/${m.modId}/loot_table/blocks/${b.registryName}.json`,
        content: jsonStr({
          type: "minecraft:block",
          pools: [{
            rolls: 1,
            bonus_rolls: 0,
            entries: [{
              type: "minecraft:alternatives",
              children: [
                {
                  type: "minecraft:item", name: id,
                  conditions: [{ condition: "minecraft:match_tool", predicate: { predicates: { "minecraft:enchantments": [{ enchantments: "minecraft:silk_touch", levels: { min: 1 } }] } } }],
                },
                {
                  type: "minecraft:item", name: b.dropItem.trim(),
                  functions: [
                    { function: "minecraft:set_count", count: { type: "minecraft:uniform", min, max }, add: false },
                    { function: "minecraft:apply_bonus", enchantment: "minecraft:fortune", formula: "minecraft:ore_drops" },
                    { function: "minecraft:explosion_decay" },
                  ],
                },
              ],
            }],
          }],
        }),
        language: "json",
      });
    } else if (b.dropsSelf) {
      files.push({
        path: `src/main/resources/data/${m.modId}/loot_table/blocks/${b.registryName}.json`,
        content: jsonStr({ type: "minecraft:block", pools: [{ rolls: 1, entries: [{ type: "minecraft:item", name: id }], conditions: [{ condition: "minecraft:survives_explosion" }] }] }),
        language: "json",
      });
    }
    const og = b.oreGen;
    if (og?.enabled) {
      const targets =
        og.dimension === "nether"
          ? [{ target: { predicate_type: "minecraft:tag_match", tag: "minecraft:base_stone_nether" }, state: { Name: id } }]
          : og.dimension === "end"
            ? [{ target: { predicate_type: "minecraft:block_match", block: "minecraft:end_stone" }, state: { Name: id } }]
            : [
                { target: { predicate_type: "minecraft:tag_match", tag: "minecraft:stone_ore_replaceables" }, state: { Name: id } },
                { target: { predicate_type: "minecraft:tag_match", tag: "minecraft:deepslate_ore_replaceables" }, state: { Name: id } },
              ];
      files.push({
        path: `src/main/resources/data/${m.modId}/worldgen/configured_feature/ore_${b.registryName}.json`,
        content: jsonStr({ type: "minecraft:ore", config: { size: Math.max(1, Math.min(64, Math.trunc(og.veinSize))), discard_chance_on_air_exposure: 0, targets } }),
        language: "json",
      });
      files.push({
        path: `src/main/resources/data/${m.modId}/worldgen/placed_feature/ore_${b.registryName}.json`,
        content: jsonStr({
          feature: `${m.modId}:ore_${b.registryName}`,
          placement: [
            { type: "minecraft:count", count: Math.max(1, Math.trunc(og.veinsPerChunk)) },
            { type: "minecraft:in_square" },
            { type: "minecraft:height_range", height: { type: "minecraft:trapezoid", min_inclusive: { absolute: Math.trunc(og.minY) }, max_inclusive: { absolute: Math.trunc(og.maxY) } } },
            { type: "minecraft:biome" },
          ],
        }),
        language: "json",
      });
    }
    if (b.tool !== "none") mineable[b.tool] = [...(mineable[b.tool] ?? []), id];
    if (b.toolLevel !== "any") levels[b.toolLevel] = [...(levels[b.toolLevel] ?? []), id];
  }
  for (const [tool, ids] of Object.entries(mineable))
    files.push({ path: `src/main/resources/data/minecraft/tags/block/mineable/${tool}.json`, content: jsonStr({ replace: false, values: ids }), language: "json" });
  for (const [lvl, ids] of Object.entries(levels))
    files.push({ path: `src/main/resources/data/minecraft/tags/block/needs_${lvl}_tool.json`, content: jsonStr({ replace: false, values: ids }), language: "json" });

  files.push({
    path: "src/main/resources/fabric.mod.json",
    content: jsonStr({
      schemaVersion: 1,
      id: m.modId,
      version: "${version}",
      name: m.name,
      description: m.description,
      authors: m.authors.split(",").map((s) => s.trim()).filter(Boolean),
      license: "MIT",
      icon: `assets/${m.modId}/icon.png`,
      environment: "*",
      entrypoints: { main: [{ adapter: "kotlin", value: `${m.packageName}.${m.mainClass}` }] },
      depends: {
        fabricloader: ">=0.16.0",
        minecraft: `~${m.minecraftVersion}`,
        java: ">=21",
        "fabric-api": "*",
        "fabric-language-kotlin": "*",
      },
    }),
    language: "json",
  });
  return files;
}

function genGradle(p: ModProject): GeneratedFile[] {
  const m = p.meta;
  return [
    {
      path: "settings.gradle.kts",
      language: "gradle",
      content: `pluginManagement {
    repositories {
        maven("https://maven.fabricmc.net/") { name = "Fabric" }
        mavenCentral()
        gradlePluginPortal()
    }
}

rootProject.name = "${m.modId}"
`,
    },
    {
      path: "build.gradle.kts",
      language: "gradle",
      content: `import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("fabric-loom") version "${m.loomVersion}"
    kotlin("jvm") version "${m.kotlinVersion}"
}

version = project.property("mod_version") as String
group = project.property("maven_group") as String

base {
    archivesName.set(project.property("archives_base_name") as String)
}

repositories {
    mavenCentral()
}

dependencies {
    minecraft("com.mojang:minecraft:\${project.property("minecraft_version")}")
    mappings("net.fabricmc:yarn:\${project.property("yarn_mappings")}:v2")
    modImplementation("net.fabricmc:fabric-loader:\${project.property("loader_version")}")
    modImplementation("net.fabricmc.fabric-api:fabric-api:\${project.property("fabric_version")}")
    modImplementation("net.fabricmc:fabric-language-kotlin:\${project.property("fabric_kotlin_version")}")
}

tasks.processResources {
    inputs.property("version", project.version)
    filesMatching("fabric.mod.json") {
        expand(mapOf("version" to project.version))
    }
}

tasks.withType<JavaCompile>().configureEach {
    options.release.set(21)
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_21)
    }
}

java {
    withSourcesJar()
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}
`,
    },
    {
      path: "gradle.properties",
      language: "properties",
      content: `org.gradle.jvmargs=-Xmx2G
org.gradle.parallel=true

# Fabric Properties (https://fabricmc.net/develop)
minecraft_version=${m.minecraftVersion}
yarn_mappings=${m.yarnMappings}
loader_version=${m.loaderVersion}

# Mod Properties
mod_version=${m.version}
maven_group=${m.packageName}
archives_base_name=${m.modId}

# Dependencies
fabric_version=${m.fabricVersion}
fabric_kotlin_version=${m.fabricKotlinVersion}
`,
    },
    {
      path: "gradle/wrapper/gradle-wrapper.properties",
      language: "properties",
      content: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-${m.gradleVersion}-bin.zip
networkTimeout=10000
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`,
    },
    {
      path: ".github/workflows/build.yml",
      language: "yaml",
      content: `name: build
on: [push, pull_request, workflow_dispatch]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: "${m.gradleVersion}"
      - run: gradle build --no-daemon
      - uses: actions/upload-artifact@v4
        with:
          name: ${m.modId}-jar
          path: build/libs/
`,
    },
    {
      path: ".gitignore",
      language: "text",
      content: `.gradle/\nbuild/\nout/\nrun/\n.idea/\n*.iml\n.kotlin/\n`,
    },
    {
      path: "README.md",
      language: "markdown",
      content: `# ${m.name}

${m.description}

MythicCraft Studio で生成された Minecraft ${m.minecraftVersion} Fabric Mod (Kotlin) です。

## ビルド方法

1. JDK 21 と Gradle ${m.gradleVersion} をインストール
2. このフォルダで Gradle Wrapper を生成: \`gradle wrapper --gradle-version ${m.gradleVersion}\`
3. \`./gradlew build\` → \`build/libs/${m.modId}-${m.version}.jar\`
4. 開発クライアント起動: \`./gradlew runClient\`

IntelliJ IDEA でフォルダを開くだけでもビルドできます。
GitHub に push すると \`.github/workflows/build.yml\` により自動で JAR がビルドされます。

## デバッグコマンド

- \`/${m.modId} skills\` : スキル一覧
- \`/${m.modId} cast <skill>\` : スキルを実行（視線先のエンティティがターゲット）
- \`/${m.modId} spawn <mob>\` : カスタムモブを召喚
${p.commands.map((c) => `- \`/${c.name}\` : スキル ${c.skill} を実行`).join("\n")}

## 収録コンテンツ

- アイテム: ${p.items.map((i) => `${i.displayName} (\`${m.modId}:${i.registryName}\`)`).join(", ") || "なし"}
- ブロック: ${p.blocks.map((b) => `${b.displayName}${b.oreGen?.enabled ? " [鉱石生成]" : ""}`).join(", ") || "なし"}
- カスタムモブ: ${p.mobs.map((x) => x.name).join(", ") || "なし"}
- スキル: ${p.skills.map((s) => s.name).join(", ") || "なし"}
- レシピ: ${p.recipes.length} 件

## 変数

スキル変数はワールドの \`data/${m.modId}_variables.dat\` に保存され、再起動後も保持されます。
テキスト内で \`<var.名前>\`（キャスター）/ \`<global.名前>\` で参照できます。

## テクスチャ

\`src/main/resources/assets/${m.modId}/textures/{item,block}/<name>.png\` に 16x16 PNG を置いてください。
（ZIPには仮テクスチャが含まれます）
`,
    },
  ];
}

export function generateProject(p: ModProject): GeneratedFile[] {
  const m = p.meta;
  const base = `src/main/kotlin/${m.packageName.replace(/\./g, "/")}`;
  const fnMap = new Map<string, string>();
  for (const s of p.skills) fnMap.set(s.name, skillFnName(s.name));
  const files: GeneratedFile[] = [
    ...genGradle(p),
    { path: `${base}/${m.mainClass}.kt`, content: genMainKt(p), language: "kotlin" },
    { path: `${base}/ModItems.kt`, content: genItemsKt(p, fnMap), language: "kotlin" },
    { path: `${base}/ModBlocks.kt`, content: genBlocksKt(p, fnMap), language: "kotlin" },
  ];
  if (p.items.length + p.blocks.length > 0) files.push({ path: `${base}/ModItemGroups.kt`, content: genItemGroupKt(p), language: "kotlin" });
  files.push(
    { path: `${base}/ModEvents.kt`, content: genEventsKt(p, fnMap), language: "kotlin" },
    { path: `${base}/ModWorldGen.kt`, content: genWorldGenKt(p), language: "kotlin" },
    { path: `${base}/ModCommands.kt`, content: genCommandsKt(p, fnMap), language: "kotlin" },
    { path: `${base}/skill/Skills.kt`, content: genSkillsKt(p), language: "kotlin" },
    { path: `${base}/skill/SkillCore.kt`, content: skillCoreKt(m.packageName, m.modId), language: "kotlin" },
    { path: `${base}/skill/Targeters.kt`, content: targetersKt(m.packageName), language: "kotlin" },
    { path: `${base}/skill/Conditions.kt`, content: conditionsKt(m.packageName), language: "kotlin" },
    { path: `${base}/skill/Mechanics.kt`, content: mechanicsKt(m.packageName), language: "kotlin" },
    { path: `${base}/skill/CustomMobs.kt`, content: genCustomMobsKt(p, fnMap), language: "kotlin" },
    ...genResources(p),
    ...genRecipes(p),
  );
  return files;
}

export function texturePaths(p: ModProject): { path: string; name: string; kind: "item" | "block" }[] {
  return [
    ...p.items.map((i) => ({ path: `src/main/resources/assets/${p.meta.modId}/textures/item/${i.registryName}.png`, name: i.registryName, kind: "item" as const })),
    ...p.blocks.map((b) => ({ path: `src/main/resources/assets/${p.meta.modId}/textures/block/${b.registryName}.png`, name: b.registryName, kind: "block" as const })),
  ];
}

export type { ModItem, ModBlock };
export { MECHANICS, CONDITIONS };
