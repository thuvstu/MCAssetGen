import type { ItemDef, ModProject } from "../model";
import { mojBlocksBody, mojClientBody, mojGroupBody, mojItemsBody, mojModItemBody, mojNetworkBody, type MojHelpers } from "../codegenMojmap";
import { materialOf, scaledDurability } from "../materials";
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
  mojHelpers,
} from "./shared";

export function itemSettings(it: ItemDef, dialect: Dialect, mat?: { dmg: number; dur: number }): string {
  const parts = ["Item.Settings()"];
  const tool = ["sword", "pickaxe", "axe", "shovel"].includes(it.kind);

  // カスタム属性修飾 (MAX_HEALTH, MOVEMENT_SPEED, ARMOR, ARMOR_TOUGHNESS, KNOCKBACK_RESISTANCE)
  const hasAttrs = Number(it.bonusMaxHealth) > 0 || Number(it.bonusMovementSpeed) > 0 || Number(it.bonusArmor) > 0 || Number(it.bonusToughness) > 0 || Number(it.bonusKnockbackResistance) > 0;

  if (dialect === "mojmap") {
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
  if (it.fireproof) parts.push(dialect === "mojmap" ? ".fireResistant()" : ".fireproof()");
  if (it.glint) parts.push(dialect === "mojmap" ? ".component(DataComponents.ENCHANTMENT_GLINT_OVERRIDE, true)" : ".component(DataComponentTypes.ENCHANTMENT_GLINT_OVERRIDE, true)");
  if (it.food) parts.push(dialect === "mojmap"
    ? `.food(FoodProperties.Builder().nutrition(${i(it.food.nutrition)}).saturationModifier(${f(it.food.saturation)}).build())`
    : `.food(FoodComponent.Builder().nutrition(${i(it.food.nutrition)}).saturationModifier(${f(it.food.saturation)}).build())`);
  return parts.join("");
}

export function modItemKt(project: ModProject, dialect: Dialect): string {
  if (dialect === "mojmap") return buildKotlin(project, dialect, project.meta.packageName, mojModItemBody(), { raw: true });
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
  return buildKotlin(project, dialect, project.meta.packageName, body);
}

export function itemsKt(project: ModProject, dialect: Dialect): string {
  if (dialect === "mojmap") return buildKotlin(project, dialect, project.meta.packageName, mojItemsBody(project, mojHelpers()), { raw: true });
  const lines = project.items.map((it) => {
    const mat = materialOf(project, it);
    const tip = it.tooltip.split("\n").map((x) => x.trim()).filter(Boolean);
    const custom = it.skillId || it.shiftSkillId || it.leftClickSkillId || tip.length > 0;
    const tail = `${it.skillId ? q(it.skillId) : "null"}, ${it.shiftSkillId ? q(it.shiftSkillId) : "null"}, ${it.leftClickSkillId ? q(it.leftClickSkillId) : "null"}${tip.length ? `, listOf(${tip.map(q).join(", ")})` : ""}`;
    const set = itemSettings(it, dialect, mat ? { dmg: mat.damageMultiplier, dur: scaledDurability(it, mat, armorDurability(it)) } : undefined);
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
  return buildKotlin(project, dialect, project.meta.packageName, body);
}

export function blocksKt(project: ModProject, dialect: Dialect): string {
  if (dialect === "mojmap") return buildKotlin(project, dialect, project.meta.packageName, mojBlocksBody(project, mojHelpers()), { raw: true });
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
  return buildKotlin(project, dialect, project.meta.packageName, body);
}

export function groupKt(project: ModProject, dialect: Dialect): string {
  if (dialect === "mojmap") return buildKotlin(project, dialect, project.meta.packageName, mojGroupBody(project, mojHelpers()), { raw: true });
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
  return buildKotlin(project, dialect, project.meta.packageName, body);
}

export function configKt(project: ModProject, dialect: Dialect): string {
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
  return buildKotlin(project, dialect, project.meta.packageName, body);
}

export function networkingKt(project: ModProject, dialect: Dialect): string {
  if (dialect === "mojmap") return buildKotlin(project, dialect, `${project.meta.packageName}.net`, mojNetworkBody(), { raw: true });
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
  return buildKotlin(project, dialect, pkg, body);
}

export function clientKt(project: ModProject, dialect: Dialect): string {
  if (dialect === "mojmap") return buildKotlin(project, dialect, `${project.meta.packageName}.client`, mojClientBody(project), { raw: true });
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
  return buildKotlin(project, dialect, pkg, body);
}

export function worldGenKt(project: ModProject, dialect: Dialect): string {
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
  return buildKotlin(project, dialect, project.meta.packageName, body);
}

export function mainKt(project: ModProject, dialect: Dialect): string {
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
${dialect === "mojmap" && project.forge?.enabled ? "        WeaponForge.register()\n" : ""}        ModItemGroup.register()
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
  return buildKotlin(project, dialect, project.meta.packageName, body);
}
