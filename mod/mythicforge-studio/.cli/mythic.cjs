// src/mythic.ts
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");

// ../mod/mythicforge-studio/src/lib/mod/materials.ts
var TOOL_BASE_DURABILITY = { WOOD: 59, STONE: 131, COPPER: 190, IRON: 250, GOLD: 32, DIAMOND: 1561, NETHERITE: 2031 };
var TOOL_KINDS = ["sword", "pickaxe", "axe", "shovel"];
function materialOf(project, it) {
  if (!it.materialId) return void 0;
  if (!TOOL_KINDS.includes(it.kind) && it.kind !== "armor") return void 0;
  return (project.materials ?? []).find((m) => m.id === it.materialId);
}
function scaledDurability(it, mat, armorBase) {
  const base = it.kind === "armor" ? it.durability > 0 ? it.durability : armorBase : it.durability > 0 ? it.durability : TOOL_BASE_DURABILITY[it.material] ?? 250;
  return Math.max(1, Math.round(base * mat.durabilityMultiplier));
}

// ../mod/mythicforge-studio/src/lib/mod/codegenMojmap.ts
var SOUND_IDS = {
  ENTITY_PLAYER_LEVELUP: "entity.player.levelup",
  ENTITY_GENERIC_EXPLODE: "entity.generic.explode",
  ENTITY_LIGHTNING_BOLT_THUNDER: "entity.lightning_bolt.thunder",
  ENTITY_ENDERMAN_TELEPORT: "entity.enderman.teleport",
  ENTITY_BLAZE_SHOOT: "entity.blaze.shoot",
  ENTITY_EXPERIENCE_ORB_PICKUP: "entity.experience_orb.pickup",
  ENTITY_PLAYER_ATTACK_SWEEP: "entity.player.attack.sweep",
  ENTITY_WITHER_SHOOT: "entity.wither.shoot",
  BLOCK_ANVIL_LAND: "block.anvil.land",
  ENTITY_ENDER_DRAGON_GROWL: "entity.ender_dragon.growl",
  ENTITY_FIREWORK_ROCKET_LAUNCH: "entity.firework_rocket.launch",
  BLOCK_BEACON_ACTIVATE: "block.beacon.activate",
  ENTITY_ILLUSIONER_CAST_SPELL: "entity.illusioner.cast_spell",
  ITEM_FIRECHARGE_USE: "item.firecharge.use"
};
var BLOCK_SOUND_MAP = { AMETHYST_BLOCK: "AMETHYST" };
var CLASS_MAP = {
  ServerPlayerEntity: "ServerPlayer",
  PlayerEntity: "Player",
  ServerWorld: "ServerLevel",
  Vec3d: "Vec3",
  Box: "AABB",
  ParticleEffect: "ParticleOptions",
  "<ParticleEffect>": "<ParticleOptions>",
  StatusEffectInstance: "MobEffectInstance",
  StatusEffects: "MobEffects",
  StatusEffect: "MobEffect",
  RegistryEntry: "Holder",
  Formatting: "ChatFormatting",
  Text: "Component",
  RaycastContext: "ClipContext",
  Registries: "BuiltInRegistries",
  World: "Level",
  WorldSavePath: "LevelResource",
  SoundCategory: "SoundSource",
  SmallFireballEntity: "SmallFireball",
  TitleS2CPacket: "ClientboundSetTitleTextPacket",
  SubtitleS2CPacket: "ClientboundSetSubtitleTextPacket",
  TitleFadeS2CPacket: "ClientboundSetTitlesAnimationPacket",
  ActionResult: "InteractionResult",
  Hand: "InteractionHand",
  CommandManager: "Commands",
  CommandSource: "SharedSuggestionProvider",
  ExperienceDroppingBlock: "DropExperienceBlock",
  UniformIntProvider: "UniformInt",
  ItemGroup: "CreativeModeTab",
  BlockSoundGroup: "SoundType",
  AbstractBlock: "BlockBehaviour",
  TypedActionResult: "InteractionResult",
  DataComponentTypes: "DataComponents",
  ScoreboardCriterion: "ObjectiveCriteria",
  BossBar: "BossEvent",
  ScreenHandlerContext: "ContainerLevelAccess",
  AnvilScreenHandler: "AnvilMenu",
  GenericContainerScreenHandler: "ChestMenu",
  CraftingScreenHandler: "CraftingMenu",
  SimpleNamedScreenHandlerFactory: "SimpleMenuProvider",
  EntityStatusS2CPacket: "ClientboundEntityEventPacket",
  MobEntity: "Mob",
  EntityAttributes: "Attributes",
  FoodComponent: "FoodProperties"
};
var MEMBER_RULES = [
  // --- 特別扱い (クラス名変換より前) ---
  [/\.customBossEvents\b/g, ".customBossEvents"],
  [/\.openHandledScreen\(/g, ".openMenu("],
  [/\.enderChestInventory\b/g, ".enderChestInventory"],
  [/\.createGeneric9x3\(/g, ".threeRows("],
  [/\bplayer\.x\b/g, "player.getX()"],
  [/\bplayer\.y\b/g, "player.getY()"],
  [/\bplayer\.z\b/g, "player.getZ()"],
  [/\bvictim\.x\b/g, "victim.getX()"],
  [/\bvictim\.y\b/g, "victim.getY()"],
  [/\bvictim\.z\b/g, "victim.getZ()"],
  [/\bowner\.x\b/g, "owner.getX()"],
  [/\bowner\.y\b/g, "owner.getY()"],
  [/\bowner\.z\b/g, "owner.getZ()"],
  [/\bRegistryKeys\./g, "@@REGKEYS@@."],
  [/RegistryKey\.of\(@@REGKEYS@@\./g, "ResourceKey.create(@@REGKEYS@@."],
  [/World\.ExplosionSourceType/g, "Level.ExplosionInteraction"],
  [/RaycastContext\.ShapeType\.COLLIDER/g, "ClipContext.Block.COLLIDER"],
  [/RaycastContext\.FluidHandling\.NONE/g, "ClipContext.Fluid.NONE"],
  [/GenerationStep\.Feature\b/g, "GenerationStep.Decoration"],
  [/\bRegistries\.ITEM\.get\(/g, "BuiltInRegistries.ITEM.getValue("],
  [/Identifier\.of\(([^,()]+)\)/g, "Identifier.parse($1)"],
  [/Identifier\.of\(/g, "Identifier.fromNamespaceAndPath("],
  [/\.requires \{ it\.hasPermissionLevel\(2\) \}/g, ".requires(Commands.hasPermission(Commands.LEVEL_GAMEMASTERS))"],
  [/\.commandSource\.withLevel\(4\)\.withSilent\(\)/g, ".createCommandSourceStack().withPermission(LevelBasedPermissionSet.OWNER).withSuppressedOutput()"],
  [/\.commandManager\.executeWithPrefix\(/g, ".commands.performPrefixedCommand("],
  [/\{ _, entity, killed ->/g, "{ _, entity, killed, _ ->"],
  [/\bfor \(stack in player\.armorItems\) \{/g, "for (stack in listOf(EquipmentSlot.HEAD, EquipmentSlot.CHEST, EquipmentSlot.LEGS, EquipmentSlot.FEET).map { player.getItemBySlot(it) }) {"],
  // --- 位置・ベクトル ---
  [/\b(hit|block)\.pos\b/g, "$1.location"],
  [/\.pos\b(?!\w|\()/g, ".position()"],
  [/\.eyePos\b/g, ".eyePosition"],
  [/\.rotationVector\b/g, ".lookAngle"],
  [/\.standingEyeHeight\b/g, ".eyeHeight"],
  [/\.stretch\(/g, ".expandTowards("],
  [/\.expand\(/g, ".inflate("],
  [/\.multiply\(/g, ".scale("],
  [/\.squaredDistanceTo\(/g, ".distanceToSqr("],
  [/\.raycast\(/g, ".clip("],
  [/\bBox\.of\(/g, "AABB.ofSize("],
  [/\.getOtherEntities\(/g, ".getEntities("],
  [/\.getEntitiesByClass\(/g, ".getEntitiesOfClass("],
  // --- World / ServerWorld ---
  [/\bworld\.damageSources\b(?!\()/g, "world.damageSources()"],
  [/\bworld\.time\b/g, "world.gameTime"],
  [/\bspawnParticles\b/g, "sendParticles"],
  [/\.spawnEntity\(/g, ".addFreshEntity("],
  [/\.setBlockState\(/g, ".setBlockAndUpdate("],
  [/\bworld\.breakBlock\(/g, "world.destroyBlock("],
  [/\.createExplosion\(/g, ".explode("],
  [/BlockPos\.ofFloored\(/g, "BlockPos.containing("],
  [/\.isClient\b/g, ".isClientSide"],
  [/\bserverWorld\b/g, "level()"],
  // --- Entity ---
  [/\.damage\(source,/g, ".hurt(source,"],
  [/\.addStatusEffect\(/g, ".addEffect("],
  [/\.clearStatusEffects\(\)/g, ".removeAllEffects()"],
  [/\.setOnFireFor\(/g, ".igniteForSeconds("],
  [/\.addVelocity\(/g, ".push("],
  [/\.velocityModified\b/g, ".hurtMarked"],
  [/\.requestTeleport\(/g, ".setPos("],
  [/\.teleportTo\(/g, ".setPos("],
  [/\.refreshPositionAfterTeleport\(/g, ".snapTo("],
  // --- ボスバー / スコアボード / モブ (1.21.11 公式マッピング) ---
  [/\bTagKey\.of\(/g, "TagKey.create("],
  [/\.bossBarManager\b/g, ".customBossEvents"],
  [/\bmanager\.add\(/g, "manager.create("],
  [/\bbar\.percent\b/g, "bar.progress"],
  [/BossBar\.Color/g, "@@BOSSCOLOR@@"],
  [/\.uuidAsString\b/g, ".stringUUID"],
  [/\.offHandStack\b/g, ".offhandItem"],
  [/\bdamageSource\.attacker\b/g, "damageSource.entity"],
  [/\.getNullableObjective\(/g, ".getObjective("],
  [/ScoreHolder\.fromName\(/g, "ScoreHolder.forNameOnly("],
  [/\.getOrCreateScore\(/g, ".getOrCreatePlayerScore("],
  [/\.setScore\(/g, ".set("],
  [/\.sendPacket\(/g, ".send("],
  [/\.getAttributeInstance\(/g, ".getAttribute("],
  [/EntityAttributes\.GENERIC_/g, "Attributes."],
  [/\.addCommandTag\(/g, ".addTag("],
  [/\.commandTags\b/g, ".tags"],
  [/\bentity\.world\b/g, "entity.level()"],
  [/\.create\(world\)(?! *,)/g, ".create(world, EntitySpawnReason.MOB_SUMMONED)"],
  [/\.addExperience\(/g, ".giveExperiencePoints("],
  [/\.setCosmetic\(/g, ".setVisualOnly("],
  [/\.hungerManager\.add\(/g, ".foodData.eat("],
  [/\.networkHandler\b/g, ".connection"],
  [/\bhandler\.sendPacket\(/g, "handler.send("],
  [/\.defaultState\b/g, ".defaultBlockState()"],
  [/\.mainHandStack\b/g, ".mainHandItem"],
  [/\.isSneaking\b/g, ".isShiftKeyDown"],
  [/\.isOnGround\b/g, ".onGround()"],
  [/\.isTouchingWater\b/g, ".isInWater"],
  [/\.getInventory\(\)\.offerOrDrop\(/g, ".inventory.placeItemBackInInventory("],
  [/\.create\(ctx\.world\)/g, ".create(ctx.world, EntitySpawnReason.TRIGGERED)"],
  // --- レジストリ / サーバー ---
  [/\.getId\(/g, ".getKey("],
  [/\.getSavePath\(/g, ".getWorldPath("],
  [/\bserver\.ticks\b/g, "server.tickCount"],
  [/\bserver\.playerManager\.playerList\b/g, "server.playerList.players"],
  [/\.sendMessage\(/g, ".displayClientMessage("],
  [/\.formatted\(/g, ".withStyle("],
  [/\.suggestMatching\(/g, ".suggest("],
  [/\.playerOrThrow\b/g, ".playerOrException"],
  [/\.sendFeedback\(/g, ".sendSuccess("]
];
function fixBlockSounds(s) {
  return s.replace(/\bBlockSoundGroup\.([A-Z0-9_]+)/g, (_m, k) => `SoundType.${BLOCK_SOUND_MAP[k] ?? k}`);
}
var MOJ_SOUND_FN = `    fun sound(ctx: SkillContext, id: String, volume: Float, pitch: Float) {
        val event = BuiltInRegistries.SOUND_EVENT.getValue(Identifier.parse(id)) ?: return
        ctx.world.playSound(null, BlockPos.containing(ctx.point), event, SoundSource.PLAYERS, volume, pitch)
    }`;
var CUSTOM_BLOCK = /\/\/ >>> custom:[\s\S]*?\/\/ <<< custom:\w+/g;
function translateBody(body) {
  const customs = [];
  let work = body.replace(CUSTOM_BLOCK, (m) => {
    customs.push(m);
    return `/*@@CUSTOM${customs.length - 1}@@*/`;
  });
  work = work.replace(/ {4}fun sound\(ctx: SkillContext, sound: SoundEvent[\s\S]*?sound\(ctx, sound\.value\(\), volume, pitch\)\n {4}\}/, MOJ_SOUND_FN);
  work = work.replace(/SoundEvents\.([A-Z0-9_]+)/g, (_m, k) => JSON.stringify(SOUND_IDS[k] ?? k.toLowerCase().replace(/_/g, ".")));
  for (const [re, rep] of MEMBER_RULES) work = work.replace(re, rep);
  work = fixBlockSounds(work);
  for (const [from, to] of Object.entries(CLASS_MAP)) {
    work = work.replace(new RegExp(`(?<![.\\w@])${from}\\b`, "g"), to);
  }
  work = work.replace(/@@REGKEYS@@/g, "Registries");
  work = work.replace(/@@BOSSCOLOR@@/g, "BossEvent.BossBarColor");
  return work.replace(/\/\*@@CUSTOM(\d+)@@\*\//g, (_m, n) => customs[Number(n)]);
}
var toolCall = (it, H, matConst) => {
  const mat = matConst ?? `ToolMaterial.${it.material}`;
  switch (it.kind) {
    case "sword":
      return `.sword(${mat}, ${H.f(it.attackDamage)}, ${H.f(it.attackSpeed)})`;
    case "pickaxe":
      return `.pickaxe(${mat}, ${H.f(it.attackDamage)}, ${H.f(it.attackSpeed)})`;
    case "axe":
      return `.axe(${mat}, ${H.f(it.attackDamage)}, ${H.f(it.attackSpeed)})`;
    case "shovel":
      return `.shovel(${mat}, ${H.f(it.attackDamage)}, ${H.f(it.attackSpeed)})`;
    default:
      return "";
  }
};
function mojItemProps(it, H, material, matConst) {
  const parts = [];
  if (it.kind === "armor") {
    const mat = it.armorMaterial === "TURTLE" ? "TURTLE_SCUTE" : it.armorMaterial;
    parts.push(`.humanoidArmor(ArmorMaterials.${mat}, ArmorType.${it.armorSlot})`);
    if (material) parts.push(`.durability(${H.i(scaledDurability(it, material, H.armorDurability(it)))})`);
    else if (it.durability > 0) parts.push(`.durability(${H.i(it.durability)})`);
  } else if (["sword", "pickaxe", "axe", "shovel"].includes(it.kind)) {
    parts.push(toolCall(it, H, matConst));
  } else if (it.durability > 0) parts.push(`.durability(${H.i(it.durability)})`);
  else if (it.maxCount !== 64) parts.push(`.stacksTo(${H.i(it.maxCount)})`);
  if (it.rarity !== "COMMON") parts.push(`.rarity(Rarity.${it.rarity})`);
  if (it.fireproof) parts.push(".fireResistant()");
  if (it.glint) parts.push(".component(DataComponents.ENCHANTMENT_GLINT_OVERRIDE, true)");
  if (it.food) parts.push(`.food(FoodProperties.Builder().nutrition(${H.i(it.food.nutrition)}).saturationModifier(${H.f(it.food.saturation)}).build())`);
  return parts.join("");
}
function mojModItemBody() {
  return `/** \u30B9\u30AD\u30EB\u3068\u30C4\u30FC\u30EB\u30C1\u30C3\u30D7\u3092\u6301\u3066\u308B\u6C4E\u7528\u30A2\u30A4\u30C6\u30E0 (\u9053\u5177\u30FB\u9632\u5177\u306B\u3082\u4F7F\u3048\u307E\u3059) */
class ModItem(
    properties: Item.Properties,
    private val skillId: String? = null,
    private val shiftSkillId: String? = null,
    private val leftClickSkillId: String? = null,
    private val tooltipLines: List<String> = emptyList(),
) : Item(properties) {
    override fun use(level: Level, player: Player, hand: InteractionHand): InteractionResult {
        val activeSkill = if (player.isShiftKeyDown && shiftSkillId != null) shiftSkillId else skillId
        if (activeSkill == null) return super.use(level, player, hand)
        if (level.isClientSide || player !is ServerPlayer) return InteractionResult.PASS
        if (!SkillManager.cast(activeSkill, player)) return InteractionResult.FAIL
        val cooldown = SkillManager.get(activeSkill)?.cooldownTicks ?: 0
        if (cooldown > 0) player.cooldowns.addCooldown(player.getItemInHand(hand), cooldown)
        return InteractionResult.SUCCESS
    }

    override fun appendHoverText(
        stack: ItemStack,
        context: Item.TooltipContext,
        display: TooltipDisplay,
        builder: Consumer<Component>,
        flag: TooltipFlag,
    ) {
        for (line in tooltipLines) builder.accept(Component.literal(line).withStyle(ChatFormatting.GRAY))
        if (skillId != null) builder.accept(Component.literal("Skill: " + skillId).withStyle(ChatFormatting.AQUA))
        super.appendHoverText(stack, context, display, builder, flag)
    }
}`;
}
function mojItemsBody(project, H) {
  const matConsts = /* @__PURE__ */ new Map();
  const lines = project.items.map((it) => {
    const material = materialOf(project, it);
    let matConst;
    if (material && TOOL_KINDS.includes(it.kind)) {
      matConst = `MAT_${H.constName(material.id)}_${it.material}`;
      if (!matConsts.has(matConst)) {
        matConsts.set(matConst, `private val ${matConst}: ToolMaterial = ToolMaterial.${it.material}.let { b -> ToolMaterial(b.incorrectBlocksForDrops(), (b.durability() * ${H.d(material.durabilityMultiplier)}).toInt(), b.speed() * ${H.f(material.speedMultiplier)}, b.attackDamageBonus() * ${H.f(material.damageMultiplier)}, b.enchantmentValue(), b.repairItems()) }`);
      }
    }
    const tip = it.tooltip.split("\n").map((x) => x.trim()).filter(Boolean);
    const custom = it.skillId || it.shiftSkillId || it.leftClickSkillId || tip.length > 0;
    const tail = `${it.skillId ? H.q(it.skillId) : "null"}, ${it.shiftSkillId ? H.q(it.shiftSkillId) : "null"}, ${it.leftClickSkillId ? H.q(it.leftClickSkillId) : "null"}${tip.length ? `, listOf(${tip.map(H.q).join(", ")})` : ""}`;
    const props = `p${mojItemProps(it, H, material, matConst)}`;
    const ctor = custom ? `ModItem(${props}, ${tail})` : `Item(${props})`;
    return `val ${H.constName(it.id)}: Item = register(${H.q(it.id)}) { p -> ${ctor} }`;
  });
  const leftClick = project.items.filter((x) => x.leftClickSkillId).map((x) => `${H.constName(x.id)} to ${H.q(x.leftClickSkillId)}`);
  return `object ModItems {
${matConsts.size ? H.ind([...matConsts.values()], 4).join("\n") + "\n\n" : ""}${H.ind(lines, 4).join("\n")}

    /** \u5DE6\u30AF\u30EA\u30C3\u30AF (\u6BB4\u308A) \u3067\u767A\u52D5\u3059\u308B\u30B9\u30AD\u30EB */
    val LEFT_CLICK_SKILLS: Map<Item, String> = ${leftClick.length ? `mapOf(${leftClick.join(", ")})` : "emptyMap()"}

    /** 1.21.2 \u4EE5\u964D\u306F\u30A2\u30A4\u30C6\u30E0\u306E\u30EC\u30B8\u30B9\u30C8\u30EA\u30AD\u30FC\u3092 Properties \u306B\u8A2D\u5B9A\u3059\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059 */
    private fun <T : Item> register(id: String, factory: (Item.Properties) -> T): T {
        val key = ResourceKey.create(Registries.ITEM, Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, id))
        return Registry.register(BuiltInRegistries.ITEM, key, factory(Item.Properties().setId(key)))
    }

    fun register() {
        ModInfo.LOGGER.info("Registered ${project.items.length} items")
    }
}`;
}
function mojBlocksBody(project, H) {
  const lines = project.blocks.map((b) => {
    const snd = BLOCK_SOUND_MAP[H.constName(b.sound)] ?? H.constName(b.sound);
    let s = `p.strength(${H.f(b.hardness)}, ${H.f(b.resistance)}).sound(SoundType.${snd})`;
    if (b.luminance > 0) s += `.lightLevel { _ -> ${H.i(b.luminance)} }`;
    if (b.requiresTool) s += ".requiresCorrectToolForDrops()";
    const ctor = b.ore && b.ore.xpMax > 0 ? `DropExperienceBlock(UniformInt.of(${H.i(b.ore.xpMin)}, ${H.i(Math.max(b.ore.xpMin, b.ore.xpMax))}), ${s})` : `Block(${s})`;
    return `val ${H.constName(b.id)}: Block = registerBlock(${H.q(b.id)}, ${b.skillId ? H.q(b.skillId) : "null"}, ${b.shiftSkillId ? H.q(b.shiftSkillId) : "null"}) { p -> ${ctor} }`;
  });
  return `object ModBlocks {
    /** \u53F3\u30AF\u30EA\u30C3\u30AF\u3067\u30B9\u30AD\u30EB\u304C\u767A\u52D5\u3059\u308B\u30D6\u30ED\u30C3\u30AF */
    val SKILL_BLOCKS = HashMap<Block, String>()
    val SHIFT_SKILL_BLOCKS = HashMap<Block, String>()

${H.ind(lines, 4).join("\n")}

    /** \u30D6\u30ED\u30C3\u30AF\u3068 BlockItem \u3092\u767B\u9332 (1.21.2 \u4EE5\u964D\u306F\u3069\u3061\u3089\u3082\u30EC\u30B8\u30B9\u30C8\u30EA\u30AD\u30FC\u306E\u8A2D\u5B9A\u304C\u5FC5\u9808) */
    private fun registerBlock(id: String, skillId: String?, shiftSkillId: String?, factory: (BlockBehaviour.Properties) -> Block): Block {
        val identifier = Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, id)
        val blockKey = ResourceKey.create(Registries.BLOCK, identifier)
        val itemKey = ResourceKey.create(Registries.ITEM, identifier)
        val block = Registry.register(BuiltInRegistries.BLOCK, blockKey, factory(BlockBehaviour.Properties.of().setId(blockKey)))
        Registry.register(BuiltInRegistries.ITEM, itemKey, BlockItem(block, Item.Properties().setId(itemKey).useBlockDescriptionPrefix()))
        if (skillId != null) SKILL_BLOCKS[block] = skillId
        if (shiftSkillId != null) SHIFT_SKILL_BLOCKS[block] = shiftSkillId
        return block
    }

    fun register() {
        ModInfo.LOGGER.info("Registered ${project.blocks.length} blocks")
    }
}`;
}
function mojGroupBody(project, H) {
  const icon = project.items[0] ? `ModItems.${H.constName(project.items[0].id)}` : project.blocks[0] ? `ModBlocks.${H.constName(project.blocks[0].id)}` : "Items.STICK";
  const entries = [
    ...project.items.map((x) => `output.accept(ModItems.${H.constName(x.id)})`),
    ...project.blocks.map((x) => `output.accept(ModBlocks.${H.constName(x.id)})`)
  ];
  return `object ModItemGroup {
    val MAIN: CreativeModeTab = Registry.register(
        BuiltInRegistries.CREATIVE_MODE_TAB,
        Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "main"),
        FabricItemGroup.builder()
            .icon { ItemStack(${icon}) }
            .title(Component.translatable("itemGroup." + ModInfo.MOD_ID + ".main"))
            .displayItems { _, output ->
${H.ind(entries.length ? entries : ["// (\u30A8\u30F3\u30C8\u30EA\u306A\u3057)"], 16).join("\n")}
            }
            .build(),
    )

    fun register() {
        ModInfo.LOGGER.info("Registered creative tab")
    }
}`;
}
function mojNetworkBody() {
  return `/** \u30B5\u30FC\u30D0\u30FC -> \u30AF\u30E9\u30A4\u30A2\u30F3\u30C8: \u30DE\u30CA\u306E\u540C\u671F */
class ManaSyncPayload(val mana: Float, val max: Float) : CustomPacketPayload {
    companion object {
        val TYPE = CustomPacketPayload.Type<ManaSyncPayload>(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "mana_sync"))
        val CODEC: StreamCodec<RegistryFriendlyByteBuf, ManaSyncPayload> = StreamCodec.composite(
            ByteBufCodecs.FLOAT, ManaSyncPayload::mana,
            ByteBufCodecs.FLOAT, ManaSyncPayload::max,
            ::ManaSyncPayload,
        )
    }

    override fun type(): CustomPacketPayload.Type<out CustomPacketPayload> = TYPE
}

/** \u30AF\u30E9\u30A4\u30A2\u30F3\u30C8 -> \u30B5\u30FC\u30D0\u30FC: \u30AD\u30FC\u30D0\u30A4\u30F3\u30C9\u306B\u3088\u308B\u30B9\u30AD\u30EB\u767A\u52D5 */
class CastSlotPayload(val slot: Int) : CustomPacketPayload {
    companion object {
        val TYPE = CustomPacketPayload.Type<CastSlotPayload>(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "cast_slot"))
        val CODEC: StreamCodec<RegistryFriendlyByteBuf, CastSlotPayload> = StreamCodec.composite(
            ByteBufCodecs.VAR_INT, CastSlotPayload::slot,
            ::CastSlotPayload,
        )
    }

    override fun type(): CustomPacketPayload.Type<out CustomPacketPayload> = TYPE
}

object ModNetworking {
    fun register() {
        PayloadTypeRegistry.playS2C().register(ManaSyncPayload.TYPE, ManaSyncPayload.CODEC)
        PayloadTypeRegistry.playC2S().register(CastSlotPayload.TYPE, CastSlotPayload.CODEC)
        ServerPlayNetworking.registerGlobalReceiver(CastSlotPayload.TYPE) { payload, context ->
            context.server().execute {
                SkillManager.castSlot(context.player(), payload.slot)
            }
        }
    }
}`;
}
function mojClientBody(project) {
  return `/** \u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u5074: \u30AD\u30FC\u30D0\u30A4\u30F3\u30C9\u3068\u30DE\u30CAHUD */
class ModClient : ClientModInitializer {
    private lateinit var slotKeys: List<KeyMapping>

    override fun onInitializeClient() {
        ClientPlayNetworking.registerGlobalReceiver(ManaSyncPayload.TYPE) { payload, _ ->
            HudState.mana = payload.mana
            HudState.maxMana = payload.max
        }

        // 1.21.9 \u4EE5\u964D\u306F\u30AD\u30FC\u30D0\u30A4\u30F3\u30C9\u306B\u30AB\u30C6\u30B4\u30EA (KeyMapping.Category) \u304C\u5FC5\u9808\u3002\u7FFB\u8A33\u30AD\u30FC: key.category.<modid>.main
        val category = KeyMapping.Category.register(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "main"))
        slotKeys = ModConfig.slotKeys.mapIndexed { i, code ->
            KeyMapping("key." + ModInfo.MOD_ID + ".slot" + (i + 1), InputConstants.Type.KEYSYM, code, category)
        }
        for (key in slotKeys) KeyBindingHelper.registerKeyBinding(key)

        ClientTickEvents.END_CLIENT_TICK.register { _ ->
            for (i in slotKeys.indices) {
                while (slotKeys[i].consumeClick()) ClientPlayNetworking.send(CastSlotPayload(i))
            }
        }

        // 1.21.6 \u4EE5\u964D\u306E HUD API: \u30DB\u30C3\u30C8\u30D0\u30FC\u306E\u5F8C\u308D\u306B\u30DE\u30CA\u30D0\u30FC\u3092\u8FFD\u52A0
        HudElementRegistry.attachElementAfter(
            VanillaHudElements.HOTBAR,
            Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "mana_bar"),
        ) { graphics, _ -> renderHud(graphics) }
        ModInfo.LOGGER.info("Client init: ${project.skills.length} skills")
    }

    private fun renderHud(graphics: GuiGraphics) {
        if (!ModConfig.hud) return
        val client = Minecraft.getInstance()
        val player = client.player ?: return
        if (client.options.hideGui || player.isSpectator) return
        if (HudState.maxMana <= 0f) return

        val width = graphics.guiWidth()
        val height = graphics.guiHeight()
        val barWidth = 124
        val x = width / 2 - barWidth / 2
        val y = height - 39
        val ratio = (HudState.mana / HudState.maxMana).coerceIn(0f, 1f)

        graphics.fill(x - 1, y - 1, x + barWidth + 1, y + 6, 0xCC000000.toInt())
        graphics.fill(x, y, x + (barWidth * ratio).toInt(), y + 5, 0xFF38BDF8.toInt())
        graphics.drawString(client.font, "MP " + HudState.mana.toInt() + "/" + HudState.maxMana.toInt(), x, y - 10, 0xFF7DD3FC.toInt(), true)

        for (i in ModConfig.slots.indices) {
            val label = ModConfig.slots[i].ifBlank { "-" }
            graphics.drawString(client.font, (i + 1).toString() + ":" + label, x + i * 32, y + 8, 0xFFCBD5E1.toInt(), true)
        }
    }
}

/** \u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u5074\u306E\u30DE\u30CA\u8868\u793A\u72B6\u614B (\u30B5\u30FC\u30D0\u30FC\u304B\u3089\u306E\u30D1\u30B1\u30C3\u30C8\u3067\u66F4\u65B0) */
object HudState {
    var mana: Float = 100f
    var maxMana: Float = 100f
}`;
}

// ../mod/mythicforge-studio/src/lib/analyzer/registryMojmap.ts
var MOJ_MINECRAFT_FQNS = [
  "com.mojang.blaze3d.platform.InputConstants",
  "net.minecraft.ChatFormatting",
  "net.minecraft.client.DeltaTracker",
  "net.minecraft.client.KeyMapping",
  "net.minecraft.client.Minecraft",
  "net.minecraft.client.gui.Font",
  "net.minecraft.client.gui.GuiGraphics",
  "net.minecraft.client.player.LocalPlayer",
  "net.minecraft.commands.CommandBuildContext",
  "net.minecraft.commands.CommandSourceStack",
  "net.minecraft.commands.Commands",
  "net.minecraft.commands.SharedSuggestionProvider",
  "net.minecraft.core.BlockPos",
  "net.minecraft.core.Direction",
  "net.minecraft.core.Holder",
  "net.minecraft.core.Registry",
  "net.minecraft.core.component.DataComponents",
  "net.minecraft.core.particles.ParticleOptions",
  "net.minecraft.core.particles.ParticleTypes",
  "net.minecraft.core.particles.SimpleParticleType",
  "net.minecraft.core.registries.BuiltInRegistries",
  "net.minecraft.core.registries.Registries",
  "net.minecraft.network.RegistryFriendlyByteBuf",
  "net.minecraft.network.chat.Component",
  "net.minecraft.network.chat.MutableComponent",
  "net.minecraft.network.codec.ByteBufCodecs",
  "net.minecraft.network.codec.StreamCodec",
  "net.minecraft.network.protocol.common.custom.CustomPacketPayload",
  "net.minecraft.network.protocol.game.ClientboundSetSubtitleTextPacket",
  "net.minecraft.network.protocol.game.ClientboundSetTitleTextPacket",
  "net.minecraft.network.protocol.game.ClientboundSetTitlesAnimationPacket",
  "net.minecraft.resources.Identifier",
  "net.minecraft.resources.ResourceKey",
  "net.minecraft.world.BossEvent",
  "net.minecraft.server.bossevents.CustomBossEvent",
  "net.minecraft.server.bossevents.CustomBossEvents",
  "net.minecraft.world.scores.Scoreboard",
  "net.minecraft.world.scores.ServerScoreboard",
  "net.minecraft.world.scores.Objective",
  "net.minecraft.world.scores.ScoreAccess",
  "net.minecraft.world.scores.ScoreHolder",
  "net.minecraft.world.scores.criteria.ObjectiveCriteria",
  "net.minecraft.network.protocol.game.ClientboundEntityEventPacket",
  "net.minecraft.world.SimpleMenuProvider",
  "net.minecraft.world.MenuProvider",
  "net.minecraft.world.inventory.CraftingMenu",
  "net.minecraft.world.inventory.ChestMenu",
  "net.minecraft.world.inventory.AnvilMenu",
  "net.minecraft.world.inventory.ContainerLevelAccess",
  "net.minecraft.world.entity.ai.attributes.AttributeInstance",
  "net.minecraft.world.effect.MobEffectCategory",
  "net.minecraft.world.item.trading.Merchant",
  "net.minecraft.world.item.trading.MerchantOffer",
  "net.minecraft.world.item.trading.MerchantOffers",
  "net.minecraft.world.item.trading.ItemCost",
  "net.minecraft.tags.TagKey",
  "net.minecraft.world.entity.ai.attributes.Attribute",
  "java.util.Optional",
  "net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents",
  "net.fabricmc.fabric.api.item.v1.DefaultItemComponentEvents",
  "net.minecraft.core.component.DataComponentMap",
  "net.minecraft.world.item.component.ItemAttributeModifiers",
  "net.minecraft.world.entity.ai.attributes.AttributeModifier",
  "net.minecraft.world.entity.EquipmentSlotGroup",
  "net.minecraft.server.MinecraftServer",
  "net.minecraft.server.level.ServerLevel",
  "net.minecraft.server.level.ServerPlayer",
  "net.minecraft.server.permissions.LevelBasedPermissionSet",
  "net.minecraft.sounds.SoundEvent",
  "net.minecraft.sounds.SoundEvents",
  "net.minecraft.sounds.SoundSource",
  "net.minecraft.tags.BlockTags",
  "net.minecraft.tags.ItemTags",
  "net.minecraft.util.Mth",
  "net.minecraft.util.RandomSource",
  "net.minecraft.util.valueproviders.IntProvider",
  "net.minecraft.util.valueproviders.UniformInt",
  "net.minecraft.world.InteractionHand",
  "net.minecraft.world.InteractionResult",
  "net.minecraft.world.damagesource.DamageSource",
  "net.minecraft.world.damagesource.DamageSources",
  "net.minecraft.world.effect.MobEffect",
  "net.minecraft.world.effect.MobEffectInstance",
  "net.minecraft.world.effect.MobEffects",
  "net.minecraft.world.entity.Entity",
  "net.minecraft.world.entity.EntitySpawnReason",
  "net.minecraft.world.entity.EntityType",
  "net.minecraft.world.entity.EquipmentSlot",
  "net.minecraft.world.entity.LightningBolt",
  "net.minecraft.world.entity.LivingEntity",
  "net.minecraft.world.entity.Mob",
  "net.minecraft.world.entity.item.ItemEntity",
  "net.minecraft.world.entity.ai.attributes.Attributes",
  "net.minecraft.world.entity.player.Player",
  "net.minecraft.world.entity.projectile.hurtingprojectile.SmallFireball",
  "net.minecraft.world.food.FoodProperties",
  "net.minecraft.world.item.BlockItem",
  "net.minecraft.world.item.CreativeModeTab",
  "net.minecraft.world.item.Item",
  "net.minecraft.world.item.ItemStack",
  "net.minecraft.world.item.Items",
  "net.minecraft.world.item.Rarity",
  "net.minecraft.world.item.ToolMaterial",
  "net.minecraft.world.item.TooltipFlag",
  "net.minecraft.world.item.component.TooltipDisplay",
  "net.minecraft.world.item.context.UseOnContext",
  "net.minecraft.world.item.equipment.ArmorMaterial",
  "net.minecraft.world.item.equipment.ArmorMaterials",
  "net.minecraft.world.item.equipment.ArmorType",
  "net.minecraft.world.level.ClipContext",
  "net.minecraft.world.level.Level",
  "net.minecraft.world.level.block.Block",
  "net.minecraft.world.level.block.Blocks",
  "net.minecraft.world.level.block.DropExperienceBlock",
  "net.minecraft.world.level.block.SoundType",
  "net.minecraft.world.level.block.entity.BlockEntity",
  "net.minecraft.world.level.block.state.BlockBehaviour",
  "net.minecraft.world.level.block.state.BlockState",
  "net.minecraft.world.level.levelgen.GenerationStep",
  "net.minecraft.world.level.levelgen.placement.PlacedFeature",
  "net.minecraft.world.level.storage.LevelResource",
  "net.minecraft.world.phys.AABB",
  "net.minecraft.world.phys.BlockHitResult",
  "net.minecraft.world.phys.EntityHitResult",
  "net.minecraft.world.phys.HitResult",
  "net.minecraft.world.phys.Vec3",
  "net.fabricmc.fabric.api.client.rendering.v1.hud.HudElementRegistry",
  "net.fabricmc.fabric.api.client.rendering.v1.hud.HudElement",
  "net.fabricmc.fabric.api.client.rendering.v1.hud.VanillaHudElements"
];
var YARN_TO_MOJ = {
  ...CLASS_MAP,
  PlayerEntity: "Player",
  MinecraftClient: "Minecraft",
  ClientPlayerEntity: "LocalPlayer",
  Items: "Items",
  Blocks: "Blocks",
  ItemStack: "ItemStack",
  ToolMaterials: "ToolMaterial",
  ArmorItem: "Item.Properties#humanoidArmor",
  SwordItem: "Item.Properties#sword",
  PickaxeItem: "Item.Properties#pickaxe",
  AxeItem: "Item.Properties#axe",
  ShovelItem: "Item.Properties#shovel",
  DrawContext: "GuiGraphics",
  KeyBinding: "KeyMapping",
  InputUtil: "InputConstants",
  PacketCodec: "StreamCodec",
  PacketCodecs: "ByteBufCodecs",
  CustomPayload: "CustomPacketPayload",
  RegistryByteBuf: "RegistryFriendlyByteBuf",
  ServerCommandSource: "CommandSourceStack",
  MinecraftServer: "MinecraftServer",
  RegistryKey: "ResourceKey",
  RegistryKeys: "Registries",
  TooltipType: "TooltipFlag",
  ItemGroups: "CreativeModeTabs",
  EntityAttributes: "Attributes",
  BlockState: "BlockState",
  SimpleParticleType: "SimpleParticleType",
  MathHelper: "Mth",
  Random: "RandomSource",
  Direction: "Direction"
};

// ../mod/mythicforge-studio/src/lib/analyzer/registry.ts
var KNOWN_FQNS = [
  // --- Fabric ---
  "net.fabricmc.api.ModInitializer",
  "net.fabricmc.api.ClientModInitializer",
  "net.fabricmc.api.EnvType",
  "net.fabricmc.api.Environment",
  "net.fabricmc.loader.api.FabricLoader",
  "net.fabricmc.fabric.api.event.Event",
  "net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents",
  "net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents",
  "net.fabricmc.fabric.api.event.lifecycle.v1.ServerEntityEvents",
  "net.fabricmc.fabric.api.event.player.PlayerBlockBreakEvents",
  "net.fabricmc.fabric.api.event.player.AttackEntityCallback",
  "net.fabricmc.fabric.api.event.player.UseBlockCallback",
  "net.fabricmc.fabric.api.event.player.UseItemCallback",
  "net.fabricmc.fabric.api.event.player.UseEntityCallback",
  "net.fabricmc.fabric.api.entity.event.v1.ServerEntityCombatEvents",
  "net.fabricmc.fabric.api.entity.event.v1.ServerLivingEntityEvents",
  "net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback",
  "net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents",
  "net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking",
  "net.fabricmc.fabric.api.itemgroup.v1.FabricItemGroup",
  "net.fabricmc.fabric.api.biome.v1.BiomeModifications",
  "net.fabricmc.fabric.api.biome.v1.BiomeSelectors",
  "net.fabricmc.fabric.api.biome.v1.BiomeSelectionContext",
  "net.minecraft.world.gen.GenerationStep",
  "net.minecraft.world.gen.feature.PlacedFeature",
  "net.minecraft.world.gen.feature.ConfiguredFeature",
  "net.minecraft.block.ExperienceDroppingBlock",
  "net.minecraft.util.math.intprovider.UniformIntProvider",
  "net.minecraft.util.math.intprovider.IntProvider",
  "net.minecraft.network.packet.s2c.play.TitleS2CPacket",
  "net.minecraft.network.packet.s2c.play.SubtitleS2CPacket",
  "net.minecraft.network.packet.s2c.play.TitleFadeS2CPacket",
  "net.minecraft.network.packet.Packet",
  "net.minecraft.entity.player.HungerManager",
  "net.fabricmc.fabric.api.itemgroup.v1.ItemGroupEvents",
  "net.fabricmc.fabric.api.object.builder.v1.block.FabricBlockSettings",
  "net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents",
  "net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper",
  "net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback",
  "net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking",
  "net.fabricmc.fabric.api.networking.v1.PayloadTypeRegistry",
  // --- Brigadier ---
  "com.mojang.brigadier.CommandDispatcher",
  "com.mojang.brigadier.arguments.StringArgumentType",
  "com.mojang.brigadier.arguments.IntegerArgumentType",
  "com.mojang.brigadier.arguments.DoubleArgumentType",
  "com.mojang.brigadier.context.CommandContext",
  "com.mojang.brigadier.suggestion.SuggestionsBuilder",
  // --- Minecraft: block ---
  "net.minecraft.block.Block",
  "net.minecraft.block.Blocks",
  "net.minecraft.block.BlockState",
  "net.minecraft.block.AbstractBlock",
  "net.minecraft.block.MapColor",
  "net.minecraft.block.entity.BlockEntity",
  "net.minecraft.sound.BlockSoundGroup",
  // --- Minecraft: item ---
  "net.minecraft.item.Item",
  "net.minecraft.item.Items",
  "net.minecraft.item.ItemStack",
  "net.minecraft.item.BlockItem",
  "net.minecraft.item.ItemGroup",
  "net.minecraft.item.ItemGroups",
  "net.minecraft.item.ItemConvertible",
  "net.minecraft.item.tooltip.TooltipType",
  "net.minecraft.component.DataComponentTypes",
  "net.minecraft.component.type.FoodComponent",
  "net.minecraft.util.Rarity",
  // --- Minecraft: entity ---
  "net.minecraft.entity.Entity",
  "net.minecraft.entity.EntityType",
  "net.minecraft.entity.LivingEntity",
  "net.minecraft.entity.EquipmentSlot",
  "net.minecraft.entity.player.PlayerEntity",
  "net.minecraft.entity.damage.DamageSource",
  "net.minecraft.entity.damage.DamageTypes",
  "net.minecraft.entity.effect.StatusEffect",
  "net.minecraft.entity.effect.StatusEffects",
  "net.minecraft.entity.effect.StatusEffectInstance",
  "net.minecraft.entity.mob.MobEntity",
  "net.minecraft.entity.mob.ZombieEntity",
  "net.minecraft.entity.mob.HostileEntity",
  "net.minecraft.entity.projectile.SmallFireballEntity",
  "net.minecraft.entity.projectile.ProjectileUtil",
  "net.minecraft.entity.LightningEntity",
  "net.minecraft.entity.ItemEntity",
  // --- Minecraft: server ---
  "net.minecraft.server.MinecraftServer",
  "net.minecraft.server.network.ServerPlayerEntity",
  "net.minecraft.server.network.ServerPlayNetworkHandler",
  "net.minecraft.server.world.ServerWorld",
  "net.minecraft.server.command.CommandManager",
  "net.minecraft.server.command.ServerCommandSource",
  "net.minecraft.command.CommandSource",
  // --- Minecraft: world / util ---
  "net.minecraft.world.World",
  "net.minecraft.world.RaycastContext",
  "net.minecraft.world.WorldView",
  "net.minecraft.util.Identifier",
  "net.minecraft.util.Hand",
  "net.minecraft.util.ActionResult",
  "net.minecraft.util.TypedActionResult",
  "net.minecraft.util.Formatting",
  "net.minecraft.util.math.BlockPos",
  "net.minecraft.util.math.Vec3d",
  "net.minecraft.util.math.Vec3i",
  "net.minecraft.util.math.Box",
  "net.minecraft.util.math.Direction",
  "net.minecraft.util.math.MathHelper",
  "net.minecraft.util.hit.HitResult",
  "net.minecraft.util.hit.BlockHitResult",
  "net.minecraft.util.hit.EntityHitResult",
  "net.minecraft.util.math.random.Random",
  "net.minecraft.sound.SoundEvent",
  "net.minecraft.sound.SoundEvents",
  "net.minecraft.sound.SoundCategory",
  "net.minecraft.particle.ParticleEffect",
  "net.minecraft.particle.ParticleTypes",
  "net.minecraft.text.Text",
  "net.minecraft.text.MutableText",
  "net.minecraft.nbt.NbtCompound",
  "net.minecraft.registry.Registry",
  "net.minecraft.registry.Registries",
  "net.minecraft.registry.RegistryKey",
  "net.minecraft.registry.RegistryKeys",
  "net.minecraft.registry.entry.RegistryEntry",
  "net.minecraft.network.packet.CustomPayload",
  "net.minecraft.network.codec.PacketCodec",
  "net.minecraft.network.codec.PacketCodecs",
  "net.minecraft.network.RegistryByteBuf",
  "net.minecraft.client.util.InputUtil",
  "net.minecraft.client.option.KeyBinding",
  "net.minecraft.client.option.GameOptions",
  "net.minecraft.client.gui.DrawContext",
  "net.minecraft.client.render.RenderTickCounter",
  "net.minecraft.client.font.TextRenderer",
  "net.minecraft.util.WorldSavePath",
  "net.minecraft.item.SwordItem",
  "net.minecraft.item.PickaxeItem",
  "net.minecraft.item.AxeItem",
  "net.minecraft.item.ShovelItem",
  "net.minecraft.item.ToolMaterial",
  "net.minecraft.item.ToolMaterials",
  "net.minecraft.item.ArmorItem",
  "net.minecraft.item.ArmorMaterials",
  // --- client (サーバー/共通コードでは使用不可) ---
  "net.minecraft.client.MinecraftClient",
  "net.minecraft.client.network.ClientPlayerEntity",
  // --- Kotlin / Java / logging ---
  "kotlin.math.max",
  "kotlin.math.min",
  "kotlin.math.abs",
  "kotlin.math.sqrt",
  "kotlin.math.floor",
  "kotlin.math.ceil",
  "kotlin.math.roundToInt",
  "kotlin.random.Random",
  "java.util.UUID",
  "java.util.Optional",
  "java.util.function.Consumer",
  "java.util.function.Function",
  "java.util.function.Supplier",
  "java.util.function.Predicate",
  "java.util.concurrent.ConcurrentHashMap",
  "java.util.concurrent.CompletableFuture",
  "com.google.gson.Gson",
  "com.google.gson.GsonBuilder",
  "com.google.gson.JsonObject",
  "com.google.gson.JsonParser",
  "org.lwjgl.glfw.GLFW",
  "java.nio.file.Files",
  "java.nio.file.Path",
  "java.nio.charset.StandardCharsets",
  "java.io.IOException",
  "net.fabricmc.fabric.api.event.player.AttackBlockCallback",
  "net.minecraft.entity.boss.BossBar",
  "net.minecraft.entity.boss.CustomBossEvent",
  "net.minecraft.scoreboard.Scoreboard",
  "net.minecraft.scoreboard.ScoreboardObjective",
  "net.minecraft.scoreboard.ScoreboardCriterion",
  "net.minecraft.scoreboard.ScoreHolder",
  "net.minecraft.network.packet.s2c.play.EntityStatusS2CPacket",
  "net.minecraft.screen.SimpleNamedScreenHandlerFactory",
  "net.minecraft.screen.CraftingScreenHandler",
  "net.minecraft.screen.GenericContainerScreenHandler",
  "net.minecraft.screen.AnvilScreenHandler",
  "net.minecraft.screen.ScreenHandlerContext",
  "net.minecraft.entity.boss.CommandBossBar",
  "net.minecraft.entity.boss.BossBarManager",
  "net.minecraft.scoreboard.ServerScoreboard",
  "net.minecraft.scoreboard.ScoreAccess",
  "net.minecraft.scoreboard.number.NumberFormat",
  "net.minecraft.entity.EntitySpawnReason",
  "net.minecraft.entity.attribute.EntityAttributes",
  "net.minecraft.entity.attribute.EntityAttributeInstance",
  "net.minecraft.registry.tag.TagKey",
  "net.minecraft.entity.attribute.EntityAttribute",
  "org.slf4j.Logger",
  "org.slf4j.LoggerFactory"
];
var simpleName = (fqn) => fqn.split(".").pop() ?? fqn;
var bySimple = /* @__PURE__ */ new Map();
for (const f2 of KNOWN_FQNS) {
  const s = simpleName(f2);
  bySimple.set(s, [...bySimple.get(s) ?? [], f2]);
}
var mode = "yarn";
var setRegistryMode = (m) => {
  mode = m;
};
var YARN_SET = new Set(KNOWN_FQNS);
var MOJ_FQNS = [.../* @__PURE__ */ new Set([...KNOWN_FQNS.filter((f2) => !f2.startsWith("net.minecraft.") && !/FabricBlockSettings|FabricItemSettings/.test(f2)), ...MOJ_MINECRAFT_FQNS])];
var MOJ_SET = new Set(MOJ_FQNS);
var mojBySimple = /* @__PURE__ */ new Map();
for (const f2 of MOJ_FQNS) {
  const s = simpleName(f2);
  mojBySimple.set(s, [...mojBySimple.get(s) ?? [], f2]);
}
var fqnsForSimple = (name) => (mode === "mojmap" ? mojBySimple : bySimple).get(name) ?? [];

// ../mod/mythicforge-studio/src/lib/analyzer/kotlin.ts
var KEYWORDS = /* @__PURE__ */ new Set([
  "package",
  "import",
  "class",
  "object",
  "interface",
  "fun",
  "val",
  "var",
  "if",
  "else",
  "when",
  "for",
  "while",
  "do",
  "return",
  "break",
  "continue",
  "is",
  "in",
  "as",
  "try",
  "catch",
  "finally",
  "throw",
  "override",
  "private",
  "public",
  "protected",
  "internal",
  "abstract",
  "open",
  "final",
  "data",
  "sealed",
  "enum",
  "companion",
  "init",
  "constructor",
  "this",
  "super",
  "null",
  "true",
  "false",
  "typealias",
  "by",
  "where",
  "const",
  "lateinit",
  "inline",
  "suspend",
  "vararg",
  "out",
  "operator",
  "infix",
  "annotation",
  "reified"
]);
var OPS = ["===", "!==", "..<", "?.", "?:", "!!", "::", "->", "==", "!=", "<=", ">=", "&&", "||", "..", "+=", "-=", "*=", "/=", "%=", "++", "--"];
var NUM_RE = /(0[xX][0-9a-fA-F_]+|0[bB][01_]+|\d[\d_]*(\.\d[\d_]*)?([eE][+-]?\d+)?)[fFLuU]*/y;
var IDENT_RE = /[A-Za-z_][A-Za-z0-9_]*/y;
function lexKotlin(src) {
  const tokens = [];
  const errors = [];
  const n = src.length;
  const lineStarts = [0];
  for (let k = 0; k < n; k++) if (src[k] === "\n") lineStarts.push(k + 1);
  const pos = (o) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = lo + hi + 1 >> 1;
      if (lineStarts[mid] <= o) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, col: o - lineStarts[lo] + 1 };
  };
  const push = (type, start, end) => {
    tokens.push({ type, text: src.slice(start, end), offset: start, ...pos(start) });
  };
  const err = (o, message) => errors.push({ ...pos(o), message });
  let i3 = 0;
  const lexUntil = (stopAtBrace) => {
    let depth = 0;
    while (i3 < n) {
      const c = src[i3];
      if (c === " " || c === "	" || c === "\r" || c === "\n") {
        i3++;
        continue;
      }
      if (c === "/" && src[i3 + 1] === "/") {
        const s = i3;
        while (i3 < n && src[i3] !== "\n") i3++;
        push("comment", s, i3);
        continue;
      }
      if (c === "/" && src[i3 + 1] === "*") {
        const s = i3;
        let d2 = 1;
        i3 += 2;
        while (i3 < n && d2 > 0) {
          if (src[i3] === "/" && src[i3 + 1] === "*") {
            d2++;
            i3 += 2;
          } else if (src[i3] === "*" && src[i3 + 1] === "/") {
            d2--;
            i3 += 2;
          } else i3++;
        }
        if (d2 > 0) err(s, "\u30B3\u30E1\u30F3\u30C8 `/*` \u304C\u9589\u3058\u3089\u308C\u3066\u3044\u307E\u305B\u3093");
        push("comment", s, Math.min(i3, n));
        continue;
      }
      if (c === '"' && src.startsWith('"""', i3)) {
        const s = i3;
        i3 += 3;
        let closed = false;
        while (i3 < n) {
          if (src.startsWith('"""', i3)) {
            i3 += 3;
            closed = true;
            break;
          }
          if (src[i3] === "$" && src[i3 + 1] === "{") {
            i3 += 2;
            lexUntil(true);
            continue;
          }
          i3++;
        }
        if (!closed) err(s, 'raw\u6587\u5B57\u5217 """ \u304C\u9589\u3058\u3089\u308C\u3066\u3044\u307E\u305B\u3093');
        push("string", s, Math.min(i3, n));
        continue;
      }
      if (c === '"') {
        const s = i3;
        i3++;
        let closed = false;
        while (i3 < n) {
          const ch = src[i3];
          if (ch === "\\") {
            i3 += 2;
            continue;
          }
          if (ch === '"') {
            i3++;
            closed = true;
            break;
          }
          if (ch === "\n") break;
          if (ch === "$" && src[i3 + 1] === "{") {
            i3 += 2;
            lexUntil(true);
            continue;
          }
          if (ch === "$" && /[A-Za-z_]/.test(src[i3 + 1] ?? "")) {
            i3++;
            IDENT_RE.lastIndex = i3;
            const m = IDENT_RE.exec(src);
            if (m) {
              push("ident", i3, i3 + m[0].length);
              i3 += m[0].length;
            }
            continue;
          }
          i3++;
        }
        if (!closed) err(s, '\u6587\u5B57\u5217\u30EA\u30C6\u30E9\u30EB\u304C\u9589\u3058\u3089\u308C\u3066\u3044\u307E\u305B\u3093 (`"` \u304C\u4E0D\u8DB3)');
        push("string", s, Math.min(i3, n));
        continue;
      }
      if (c === "'") {
        const s = i3;
        i3++;
        if (src[i3] === "\\") i3 += 2;
        else i3++;
        if (src[i3] === "'") i3++;
        else {
          err(s, "\u6587\u5B57\u30EA\u30C6\u30E9\u30EB\u304C\u6B63\u3057\u304F\u9589\u3058\u3089\u308C\u3066\u3044\u307E\u305B\u3093");
          while (i3 < n && src[i3] !== "'" && src[i3] !== "\n") i3++;
          if (src[i3] === "'") i3++;
        }
        push("char", s, Math.min(i3, n));
        continue;
      }
      if (c === "`") {
        const s = i3;
        i3++;
        while (i3 < n && src[i3] !== "`" && src[i3] !== "\n") i3++;
        if (src[i3] === "`") i3++;
        else err(s, "\u30D0\u30C3\u30AF\u30AF\u30A9\u30FC\u30C8\u8B58\u5225\u5B50\u304C\u9589\u3058\u3089\u308C\u3066\u3044\u307E\u305B\u3093");
        push("ident", s, i3);
        continue;
      }
      if (/[0-9]/.test(c)) {
        NUM_RE.lastIndex = i3;
        const m = NUM_RE.exec(src);
        const len = m ? m[0].length : 1;
        push("number", i3, i3 + len);
        i3 += len;
        continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        IDENT_RE.lastIndex = i3;
        const m = IDENT_RE.exec(src);
        const text = m[0];
        push(KEYWORDS.has(text) ? "keyword" : "ident", i3, i3 + text.length);
        i3 += text.length;
        continue;
      }
      if (c === "{") {
        depth++;
        push("symbol", i3, i3 + 1);
        i3++;
        continue;
      }
      if (c === "}") {
        if (stopAtBrace && depth === 0) {
          i3++;
          return;
        }
        depth--;
        push("symbol", i3, i3 + 1);
        i3++;
        continue;
      }
      const op = OPS.find((o) => src.startsWith(o, i3));
      if (op) {
        push("symbol", i3, i3 + op.length);
        i3 += op.length;
        continue;
      }
      push("symbol", i3, i3 + 1);
      i3++;
    }
  };
  lexUntil(false);
  return { tokens, errors };
}

// ../mod/mythicforge-studio/src/lib/mod/png.ts
var crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 4294967295;
  for (let i3 = 0; i3 < buf.length; i3++) c = crcTable[(c ^ buf[i3]) & 255] ^ c >>> 8;
  return (c ^ 4294967295) >>> 0;
}
function adler32(buf) {
  let a = 1;
  let b = 0;
  for (let i3 = 0; i3 < buf.length; i3++) {
    a = (a + buf[i3]) % 65521;
    b = (b + a) % 65521;
  }
  return (b << 16 | a) >>> 0;
}
var u32 = (n) => [n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255];
function chunk(type, data) {
  const t = Array.from(type).map((c) => c.charCodeAt(0));
  const body = new Uint8Array([...t, ...data]);
  return [...u32(data.length), ...Array.from(body), ...u32(crc32(body))];
}
function encodePng(width, height, rgb) {
  const raw = new Uint8Array(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0;
    raw.set(rgb.subarray(y * width * 3, (y + 1) * width * 3), y * (1 + width * 3) + 1);
  }
  const z = [120, 1];
  for (let off = 0; off < raw.length; off += 65535) {
    const len = Math.min(65535, raw.length - off);
    const last = off + len >= raw.length ? 1 : 0;
    z.push(last, len & 255, len >>> 8, ~len & 255, ~len >>> 8 & 255);
    for (let i3 = 0; i3 < len; i3++) z.push(raw[off + i3]);
  }
  z.push(...u32(adler32(raw)));
  const ihdr = new Uint8Array([...u32(width), ...u32(height), 8, 2, 0, 0, 0]);
  return new Uint8Array([
    137,
    80,
    78,
    71,
    13,
    10,
    26,
    10,
    ...chunk("IHDR", ihdr),
    ...chunk("IDAT", new Uint8Array(z)),
    ...chunk("IEND", new Uint8Array(0))
  ]);
}
function toBase64(bytes) {
  let s = "";
  for (let i3 = 0; i3 < bytes.length; i3 += 32768) s += String.fromCharCode(...bytes.subarray(i3, i3 + 32768));
  return btoa(s);
}
function hsl(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f2 = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f2(0) * 255), Math.round(f2(8) * 255), Math.round(f2(4) * 255)];
}
var cache = /* @__PURE__ */ new Map();
function makeIconPngBase64(seed) {
  const hit = cache.get(seed);
  if (hit) return hit;
  let hash = 7;
  for (const ch of seed) hash = hash * 31 + ch.charCodeAt(0) >>> 0;
  const hue = hash % 360;
  const N = 128;
  const px = new Uint8Array(N * N * 3);
  const cell = 8;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const gx = Math.floor(x / cell) * cell + cell / 2;
      const gy = Math.floor(y / cell) * cell + cell / 2;
      const d2 = Math.abs(gx - 64) + Math.abs(gy - 64);
      let c;
      if (d2 < 22) c = hsl(hue, 0.85, 0.82 - (gy - 40) / 400);
      else if (d2 < 44) c = hsl(hue, 0.7, gx < 64 ? 0.55 : 0.4);
      else if (d2 < 52) c = hsl(hue, 0.5, 0.2);
      else c = hsl((hue + 200) % 360, 0.35, 0.1 + gy / N * 0.08);
      const i3 = (y * N + x) * 3;
      px[i3] = c[0];
      px[i3 + 1] = c[1];
      px[i3 + 2] = c[2];
    }
  }
  const out = toBase64(encodePng(N, N, px));
  cache.set(seed, out);
  return out;
}
function parsePngDataUrl(url) {
  if (!url) return null;
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(url);
  return m ? m[1] : null;
}
function makeEffectIconBase64(hex) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 6737151;
  const [r, g, b] = [n >> 16 & 255, n >> 8 & 255, n & 255];
  const N = 18;
  const px = new Uint8Array(N * N * 3);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const d2 = Math.hypot(x - 8.5, y - 8.5);
      const i3 = (y * N + x) * 3;
      let k;
      if (d2 > 8.2) k = 0.12;
      else if (d2 > 7) k = 0.45;
      else k = 1 - d2 * 0.045 + (x + y < 14 ? 0.18 : 0);
      px[i3] = Math.min(255, Math.round(r * k));
      px[i3 + 1] = Math.min(255, Math.round(g * k));
      px[i3 + 2] = Math.min(255, Math.round(b * k));
    }
  }
  const bytes = encodePng(N, N, px);
  let s = "";
  for (let i3 = 0; i3 < bytes.length; i3 += 32768) s += String.fromCharCode(...bytes.subarray(i3, i3 + 32768));
  return btoa(s);
}

// ../mod/mythicforge-studio/src/lib/mod/wrapperData.ts
var WRAPPER_PROPERTIES = "distributionBase=GRADLE_USER_HOME\ndistributionPath=wrapper/dists\ndistributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip\nnetworkTimeout=60000\nvalidateDistributionUrl=true\nzipStoreBase=GRADLE_USER_HOME\nzipStorePath=wrapper/dists\n";
var GRADLEW = `#!/bin/sh

#
# Copyright \xA9 2015-2021 the original authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0
#

##############################################################################
#
#   Gradle start up script for POSIX generated by Gradle.
#
#   Important for running:
#
#   (1) You need a POSIX-compliant shell to run this script. If your /bin/sh is
#       noncompliant, but you have some other compliant shell such as ksh or
#       bash, then to run this script, type that shell name before the whole
#       command line, like:
#
#           ksh Gradle
#
#       Busybox and similar reduced shells will NOT work, because this script
#       requires all of these POSIX shell features:
#         * functions;
#         * expansions \xAB$var\xBB, \xAB\${var}\xBB, \xAB\${var:-default}\xBB, \xAB\${var+SET}\xBB,
#           \xAB\${var#prefix}\xBB, \xAB\${var%suffix}\xBB, and \xAB$( cmd )\xBB;
#         * compound commands having a testable exit status, especially \xABcase\xBB;
#         * various built-in commands including \xABcommand\xBB, \xABset\xBB, and \xABulimit\xBB.
#
#   Important for patching:
#
#   (2) This script targets any POSIX shell, so it avoids extensions provided
#       by Bash, Ksh, etc; in particular arrays are avoided.
#
#       The "traditional" practice of packing multiple parameters into a
#       space-separated string is a well documented source of bugs and security
#       problems, so this is (mostly) avoided, by progressively accumulating
#       options in "$@", and eventually passing that to Java.
#
#       Where the inherited environment variables (DEFAULT_JVM_OPTS, JAVA_OPTS,
#       and GRADLE_OPTS) rely on word-splitting, this is performed explicitly;
#       see the in-line comments for details.
#
#       There are tweaks for specific operating systems such as AIX, CygWin,
#       Darwin, MinGW, and NonStop.
#
#   (3) This script is generated from the Groovy template
#       https://github.com/gradle/gradle/blob/HEAD/platforms/jvm/plugins-application/src/main/resources/org/gradle/api/internal/plugins/unixStartScript.txt
#       within the Gradle project.
#
#       You can find Gradle at https://github.com/gradle/gradle/.
#
##############################################################################

# Attempt to set APP_HOME

# Resolve links: $0 may be a link
app_path=$0

# Need this for daisy-chained symlinks.
while
    APP_HOME=\${app_path%"\${app_path##*/}"}  # leaves a trailing /; empty if no leading path
    [ -h "$app_path" ]
do
    ls=$( ls -ld "$app_path" )
    link=\${ls#*' -> '}
    case $link in             #(
      /*)   app_path=$link ;; #(
      *)    app_path=$APP_HOME$link ;;
    esac
done

# This is normally unused
# shellcheck disable=SC2034
APP_BASE_NAME=\${0##*/}
# Discard cd standard output in case $CDPATH is set (https://github.com/gradle/gradle/issues/25036)
APP_HOME=$( cd -P "\${APP_HOME:-./}" > /dev/null && printf '%s
' "$PWD" ) || exit

# Use the maximum available, or set MAX_FD != -1 to use that value.
MAX_FD=maximum

warn () {
    echo "$*"
} >&2

die () {
    echo
    echo "$*"
    echo
    exit 1
} >&2

# OS specific support (must be 'true' or 'false').
cygwin=false
msys=false
darwin=false
nonstop=false
case "$( uname )" in                #(
  CYGWIN* )         cygwin=true  ;; #(
  Darwin* )         darwin=true  ;; #(
  MSYS* | MINGW* )  msys=true    ;; #(
  NONSTOP* )        nonstop=true ;;
esac

CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar


# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        # IBM's JDK on AIX uses strange locations for the executables
        JAVACMD=$JAVA_HOME/jre/sh/java
    else
        JAVACMD=$JAVA_HOME/bin/java
    fi
    if [ ! -x "$JAVACMD" ] ; then
        die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME

Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
    fi
else
    JAVACMD=java
    if ! command -v java >/dev/null 2>&1
    then
        die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.

Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
    fi
fi

# Increase the maximum file descriptors if we can.
if ! "$cygwin" && ! "$darwin" && ! "$nonstop" ; then
    case $MAX_FD in #(
      max*)
        # In POSIX sh, ulimit -H is undefined. That's why the result is checked to see if it worked.
        # shellcheck disable=SC2039,SC3045
        MAX_FD=$( ulimit -H -n ) ||
            warn "Could not query maximum file descriptor limit"
    esac
    case $MAX_FD in  #(
      '' | soft) :;; #(
      *)
        # In POSIX sh, ulimit -n is undefined. That's why the result is checked to see if it worked.
        # shellcheck disable=SC2039,SC3045
        ulimit -n "$MAX_FD" ||
            warn "Could not set maximum file descriptor limit to $MAX_FD"
    esac
fi

# Collect all arguments for the java command, stacking in reverse order:
#   * args from the command line
#   * the main class name
#   * -classpath
#   * -D...appname settings
#   * --module-path (only if needed)
#   * DEFAULT_JVM_OPTS, JAVA_OPTS, and GRADLE_OPTS environment variables.

# For Cygwin or MSYS, switch paths to Windows format before running java
if "$cygwin" || "$msys" ; then
    APP_HOME=$( cygpath --path --mixed "$APP_HOME" )
    CLASSPATH=$( cygpath --path --mixed "$CLASSPATH" )

    JAVACMD=$( cygpath --unix "$JAVACMD" )

    # Now convert the arguments - kludge to limit ourselves to /bin/sh
    for arg do
        if
            case $arg in                                #(
              -*)   false ;;                            # don't mess with options #(
              /?*)  t=\${arg#/} t=/\${t%%/*}              # looks like a POSIX filepath
                    [ -e "$t" ] ;;                      #(
              *)    false ;;
            esac
        then
            arg=$( cygpath --path --ignore --mixed "$arg" )
        fi
        # Roll the args list around exactly as many times as the number of
        # args, so each arg winds up back in the position where it started, but
        # possibly modified.
        #
        # NB: a \`for\` loop captures its iteration list before it begins, so
        # changing the positional parameters here affects neither the number of
        # iterations, nor the values presented in \`arg\`.
        shift                   # remove old arg
        set -- "$@" "$arg"      # push replacement arg
    done
fi


# Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'

# Collect all arguments for the java command:
#   * DEFAULT_JVM_OPTS, JAVA_OPTS, JAVA_OPTS, and optsEnvironmentVar are not allowed to contain shell fragments,
#     and any embedded shellness will be escaped.
#   * For example: A user cannot expect \${Hostname} to be expanded, as it is an environment variable and will be
#     treated as '\${Hostname}' itself on the command line.

set -- \\
        "-Dorg.gradle.appname=$APP_BASE_NAME" \\
        -classpath "$CLASSPATH" \\
        org.gradle.wrapper.GradleWrapperMain \\
        "$@"

# Stop when "xargs" is not available.
if ! command -v xargs >/dev/null 2>&1
then
    die "xargs is not available"
fi

# Use "xargs" to parse quoted args.
#
# With -n1 it outputs one arg per line, with the quotes and backslashes removed.
#
# In Bash we could simply go:
#
#   readarray ARGS < <( xargs -n1 <<<"$var" ) &&
#   set -- "\${ARGS[@]}" "$@"
#
# but POSIX shell has neither arrays nor command substitution, so instead we
# post-process each arg (as a line of input to sed) to backslash-escape any
# character that might be a shell metacharacter, then use eval to reverse
# that process (while maintaining the separation between arguments), and wrap
# the whole thing up as a single "set" statement.
#
# This will of course break if any of these variables contains a newline or
# an unmatched quote.
#

eval "set -- $(
        printf '%s\\n' "$DEFAULT_JVM_OPTS $JAVA_OPTS $GRADLE_OPTS" |
        xargs -n1 |
        sed ' s~[^-[:alnum:]+,./:=@_]~\\\\&~g; ' |
        tr '\\n' ' '
    )" '"$@"'

exec "$JAVACMD" "$@"
`;
var GRADLEW_BAT = `@rem\r
@rem Copyright 2015 the original author or authors.\r
@rem\r
@rem Licensed under the Apache License, Version 2.0 (the "License");\r
@rem you may not use this file except in compliance with the License.\r
@rem You may obtain a copy of the License at\r
@rem\r
@rem      https://www.apache.org/licenses/LICENSE-2.0\r
@rem\r
@rem Unless required by applicable law or agreed to in writing, software\r
@rem distributed under the License is distributed on an "AS IS" BASIS,\r
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r
@rem See the License for the specific language governing permissions and\r
@rem limitations under the License.\r
@rem\r
@rem SPDX-License-Identifier: Apache-2.0\r
@rem\r
\r
@if "%DEBUG%"=="" @echo off\r
@rem ##########################################################################\r
@rem\r
@rem  Gradle startup script for Windows\r
@rem\r
@rem ##########################################################################\r
\r
@rem Set local scope for the variables with windows NT shell\r
if "%OS%"=="Windows_NT" setlocal\r
\r
set DIRNAME=%~dp0\r
if "%DIRNAME%"=="" set DIRNAME=.\r
@rem This is normally unused\r
set APP_BASE_NAME=%~n0\r
set APP_HOME=%DIRNAME%\r
\r
@rem Resolve any "." and ".." in APP_HOME to make it shorter.\r
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi\r
\r
@rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.\r
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"\r
\r
@rem Find java.exe\r
if defined JAVA_HOME goto findJavaFromJavaHome\r
\r
set JAVA_EXE=java.exe\r
%JAVA_EXE% -version >NUL 2>&1\r
if %ERRORLEVEL% equ 0 goto execute\r
\r
echo. 1>&2\r
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH. 1>&2\r
echo. 1>&2\r
echo Please set the JAVA_HOME variable in your environment to match the 1>&2\r
echo location of your Java installation. 1>&2\r
\r
goto fail\r
\r
:findJavaFromJavaHome\r
set JAVA_HOME=%JAVA_HOME:"=%\r
set JAVA_EXE=%JAVA_HOME%/bin/java.exe\r
\r
if exist "%JAVA_EXE%" goto execute\r
\r
echo. 1>&2\r
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME% 1>&2\r
echo. 1>&2\r
echo Please set the JAVA_HOME variable in your environment to match the 1>&2\r
echo location of your Java installation. 1>&2\r
\r
goto fail\r
\r
:execute\r
@rem Setup the command line\r
\r
set CLASSPATH=%APP_HOME%\\gradle\\wrapper\\gradle-wrapper.jar\r
\r
\r
@rem Execute Gradle\r
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*\r
\r
:end\r
@rem End local scope for the variables with windows NT shell\r
if %ERRORLEVEL% equ 0 goto mainEnd\r
\r
:fail\r
rem Set variable GRADLE_EXIT_CONSOLE if you need the _script_ return code instead of\r
rem the _cmd.exe /c_ return code!\r
set EXIT_CODE=%ERRORLEVEL%\r
if %EXIT_CODE% equ 0 set EXIT_CODE=1\r
if not ""=="%GRADLE_EXIT_CONSOLE%" exit %EXIT_CODE%\r
exit /b %EXIT_CODE%\r
\r
:mainEnd\r
if "%OS%"=="Windows_NT" endlocal\r
\r
:omega\r
`;
var WRAPPER_JAR_B64 = "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AAAAAAAAAEQQAABvcmcvZ3JhZGxlL2NsaS9Db21tYW5kTGluZU9wdGlvbi5jbGFzc1VUBQABAAAAAFBLAQIUABQACAgIAAAAIQBkor0gWgIAALYEAAAzAAkAAAAAAAAAAAAAAA8TAABvcmcvZ3JhZGxlL2NsaS9Db21tYW5kTGluZVBhcnNlciRBZnRlck9wdGlvbnMuY2xhc3NVVAUAAQAAAABQSwECFAAUAAgICAAAACEAi+MxFywDAABdBwAAPAAJAAAAAAAAAAAAAADTFQAAb3JnL2dyYWRsZS9jbGkvQ29tbWFuZExpbmVQYXJzZXIkQmVmb3JlRmlyc3RTdWJDb21tYW5kLmNsYXNzVVQFAAEAAAAAUEsBAhQAFAAICAgAAAAhAOnaD7PfBgAAYg4AAD0ACQAAAAAAAAAAAAAAchkAAG9yZy9ncmFkbGUvY2xpL0NvbW1hbmRMaW5lUGFyc2VyJEtub3duT3B0aW9uUGFyc2VyU3RhdGUuY2xhc3NVVAUAAQAAAABQSwECFAAUAAgICAAAACEAQyd8okwCAACXBAAAPAAJAAAAAAAAAAAAAADFIAAAb3JnL2dyYWRsZS9jbGkvQ29tbWFuZExpbmVQYXJzZXIkTWlzc2luZ09wdGlvbkFyZ1N0YXRlLmNsYXNzVVQFAAEAAAAAUEsBAhQAFAAICAgAAAAhALSUW6PXAgAASgUAAD0ACQAAAAAAAAAAAAAAhCMAAG9yZy9ncmFkbGUvY2xpL0NvbW1hbmRMaW5lUGFyc2VyJE9wdGlvbkF3YXJlUGFyc2VyU3RhdGUuY2xhc3NVVAUAAQAAAABQSwECFAAUAAgICAAAACEAdVt6P6IBAAB9AgAAOAAJAAAAAAAAAAAAAADPJgAAb3JnL2dyYWRsZS9jbGkvQ29tbWFuZExpbmVQYXJzZXIkT3B0aW9uUGFyc2VyU3RhdGUuY2xhc3NVVAUAAQAAAABQSwECFAAUAAgICAAAACEAFtfpHA0CAABDAwAAMwAJAAAAAAAAAAAAAADgKAAAb3JnL2dyYWRsZS9jbGkvQ29tbWFuZExpbmVQYXJzZXIkT3B0aW9uU3RyaW5nLmNsYXNzVVQFAAEAAAAAUEsBAhQAFAAICAgAAAAhAJDJyYmnAQAAzgIAADIACQAAAAAAAAAAAAAAVysAAG9yZy9ncmFkbGUvY2xpL0NvbW1hbmRMaW5lUGFyc2VyJFBhcnNlclN0YXRlLmNsYXNzVVQFAAEAAAAAUEsBAhQAFAAICAgAAAAhAEvPlqBzAgAAxwQAAD8ACQAAAAAAAAAAAAAAZy0AAG9yZy9ncmFkbGUvY2xpL0NvbW1hbmRMaW5lUGFyc2VyJFVua25vd25PcHRpb25QYXJzZXJTdGF0ZS5jbGFzc1VUBQABAAAAAFBLAQIUABQACAgIAAAAIQAdjJnprwQAAGMIAAAmAAkAAAAAAAAAAAAAAFAwAABvcmcvZ3JhZGxlL2NsaS9Db21tYW5kTGluZVBhcnNlci5jbGFzc1VUBQABAAAAAFBLAQIUABQACAgIAAAAIQDrMneNOgQAAOEHAAAmAAkAAAAAAAAAAAAAAFw1AABvcmcvZ3JhZGxlL2NsaS9QYXJzZWRDb21tYW5kTGluZS5jbGFzc1VUBQABAAAAAFBLAQIUABQACAgIAAAAIQBa3XZtVAEAAKwBAAAsAAkAAAAAAAAAAAAAAPM5AABvcmcvZ3JhZGxlL2NsaS9QYXJzZWRDb21tYW5kTGluZU9wdGlvbi5jbGFzc1VUBQABAAAAAFBLAQIUABQACAgIAAAAIQD5JE8U/wIAAJwEAAAzAAkAAAAAAAAAAAAAAKo7AABvcmcvZ3JhZGxlL2ludGVybmFsL2ZpbGUvUGF0aFRyYXZlcnNhbENoZWNrZXIuY2xhc3NVVAUAAQAAAABQSwECFAAUAAgICAAAACEAebV3yocBAAADAgAAQQAJAAAAAAAAAAAAAAATPwAAb3JnL2dyYWRsZS9pbnRlcm5hbC9maWxlL2xvY2tpbmcvRXhjbHVzaXZlRmlsZUFjY2Vzc01hbmFnZXIuY2xhc3NVVAUAAQAAAABQSwECFAAUAAgICAAAACEAYqcGisEBAACjAgAAPgAJAAAAAAAAAAAAAAASQQAAb3JnL2dyYWRsZS91dGlsL2ludGVybmFsL1dyYXBwZXJEaXN0cmlidXRpb25VcmxDb252ZXJ0ZXIuY2xhc3NVVAUAAQAAAABQSwECFAAUAAgICAAAACEAnEXSmo4BAAAeAgAALwAJAAAAAAAAAAAAAABIQwAAb3JnL2dyYWRsZS93cmFwcGVyL0Jvb3RzdHJhcE1haW5TdGFydGVyJDEuY2xhc3NVVAUAAQAAAABQSwECFAAUAAgICAAAACEAgNMlBikDAADkBAAAQQAJAAAAAAAAAAAAAAA8RQAAb3JnL2dyYWRsZS93cmFwcGVyL0Rvd25sb2FkJERlZmF1bHREb3dubG9hZFByb2dyZXNzTGlzdGVuZXIuY2xhc3NVVAUAAQAAAABQSwECFAAUAAgICAAAACEAd6O2JuUCAAARBQAANAAJAAAAAAAAAAAAAADdSAAAb3JnL2dyYWRsZS93cmFwcGVyL0Rvd25sb2FkJFByb3h5QXV0aGVudGljYXRvci5jbGFzc1VUBQABAAAAAFBLAQIUABQACAgIAAAAIQAYBLAMZQkAACoSAAAhAAkAAAAAAAAAAAAAAC1MAABvcmcvZ3JhZGxlL3dyYXBwZXIvRG93bmxvYWQuY2xhc3NVVAUAAQAAAABQSwECFAAUAAgICAAAACEAQXMXCdkBAACyAgAALQAJAAAAAAAAAAAAAADqVQAAb3JnL2dyYWRsZS93cmFwcGVyL0dyYWRsZVVzZXJIb21lTG9va3VwLmNsYXNzVVQFAAEAAAAAUEsBAhQAFAAICAgAAAAhADWs/NofFQAA0CkAACoACQAAAAAAAAAAAAAAJ1gAAG9yZy9ncmFkbGUvd3JhcHBlci9HcmFkbGVXcmFwcGVyTWFpbi5jbGFzc1VUBQABAAAAAFBLAQIUABQACAgIAAAAIQA384MN5AsAAP8VAAAiAAkAAAAAAAAAAAAAAKdtAABvcmcvZ3JhZGxlL3dyYXBwZXIvSW5zdGFsbCQxLmNsYXNzVVQFAAEAAAAAUEsBAhQAFAAICAgAAAAhAKoEk0pqAQAA5wEAAC0ACQAAAAAAAAAAAAAA5HkAAG9yZy9ncmFkbGUvd3JhcHBlci9JbnN0YWxsJEluc3RhbGxDaGVjay5jbGFzc1VUBQABAAAAAFBLAQIUABQACAgIAAAAIQAZ0HXP9w4AAHgcAAAgAAkAAAAAAAAAAAAAALJ7AABvcmcvZ3JhZGxlL3dyYXBwZXIvSW5zdGFsbC5jbGFzc1VUBQABAAAAAFBLAQIUABQACAgIAAAAIQBd9rVvOwIAAB4EAAAfAAkAAAAAAAAAAAAAAACLAABvcmcvZ3JhZGxlL3dyYXBwZXIvTG9nZ2VyLmNsYXNzVVQFAAEAAAAAUEsBAhQAFAAICAgAAAAhAOopkz4kAQAAagEAACYACQAAAAAAAAAAAAAAkY0AAG9yZy9ncmFkbGUvd3JhcHBlci9QYXRoQXNzZW1ibGVyLmNsYXNzVVQFAAEAAAAAUEsBAhQAFAAICAgAAAAhANbjJayaAwAATgYAADAACQAAAAAAAAAAAAAAEo8AAG9yZy9ncmFkbGUvd3JhcHBlci9TeXN0ZW1Qcm9wZXJ0aWVzSGFuZGxlci5jbGFzc1VUBQABAAAAAFBLAQIUABQACAgIAAAAIQDmEQTJ7gIAAFAGAAAtAAkAAAAAAAAAAAAAABOTAABvcmcvZ3JhZGxlL3dyYXBwZXIvV3JhcHBlckNvbmZpZ3VyYXRpb24uY2xhc3NVVAUAAQAAAABQSwECFAAUAAgICAAAACEAEVlh6FMGAADFDAAAKAAJAAAAAAAAAAAAAABllgAAb3JnL2dyYWRsZS93cmFwcGVyL1dyYXBwZXJFeGVjdXRvci5jbGFzc1VUBQABAAAAAFBLBQYAAAAAIQAhABINAAAXnQAAAAA=";

// ../mod/mythicforge-studio/src/lib/mod/wrapperData9.ts
var WRAPPER9_PROPERTIES = "distributionBase=GRADLE_USER_HOME\ndistributionPath=wrapper/dists\ndistributionUrl=https\\://services.gradle.org/distributions/gradle-9.6.1-bin.zip\nnetworkTimeout=60000\nretries=0\nretryBackOffMs=500\nvalidateDistributionUrl=true\nzipStoreBase=GRADLE_USER_HOME\nzipStorePath=wrapper/dists\n";
var GRADLEW9 = `#!/bin/sh

#
# Copyright \xA9 2015 the original authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0
#

##############################################################################
#
#   gradlew start up script for POSIX generated by Gradle.
#
#   Important for running:
#
#   (1) You need a POSIX-compliant shell to run this script. If your /bin/sh is
#       noncompliant, but you have some other compliant shell such as ksh or
#       bash, then to run this script, type that shell name before the whole
#       command line, like:
#
#           ksh gradlew
#
#       Busybox and similar reduced shells will NOT work, because this script
#       requires all of these POSIX shell features:
#         * functions;
#         * expansions \xAB$var\xBB, \xAB\${var}\xBB, \xAB\${var:-default}\xBB, \xAB\${var+SET}\xBB,
#           \xAB\${var#prefix}\xBB, \xAB\${var%suffix}\xBB, and \xAB$( cmd )\xBB;
#         * compound commands having a testable exit status, especially \xABcase\xBB;
#         * various built-in commands including \xABcommand\xBB, \xABset\xBB, and \xABulimit\xBB.
#
#   Important for patching:
#
#   (2) This script targets any POSIX shell, so it avoids extensions provided
#       by Bash, Ksh, etc; in particular arrays are avoided.
#
#       The "traditional" practice of packing multiple parameters into a
#       space-separated string is a well documented source of bugs and security
#       problems, so this is (mostly) avoided, by progressively accumulating
#       options in "$@", and eventually passing that to Java.
#
#       Where the inherited environment variables (DEFAULT_JVM_OPTS, JAVA_OPTS,
#       and GRADLE_OPTS) rely on word-splitting, this is performed explicitly;
#       see the in-line comments for details.
#
#       There are tweaks for specific operating systems such as AIX, CygWin,
#       Darwin, MinGW, and NonStop.
#
#   (3) This script is generated from the Groovy template
#       https://github.com/gradle/gradle/blob/3d91ce3b8caaf77ad09f381f43615b715b53f72c/platforms/jvm/plugins-application/src/main/resources/org/gradle/api/internal/plugins/unixStartScript.txt
#       within the Gradle project.
#
#       You can find Gradle at https://github.com/gradle/gradle/.
#
##############################################################################

# Attempt to set APP_HOME

# Resolve links: $0 may be a link
app_path=$0

# Need this for daisy-chained symlinks.
while
    APP_HOME=\${app_path%"\${app_path##*/}"}  # leaves a trailing /; empty if no leading path
    [ -h "$app_path" ]
do
    ls=$( ls -ld "$app_path" )
    link=\${ls#*' -> '}
    case $link in             #(
      /*)   app_path=$link ;; #(
      *)    app_path=$APP_HOME$link ;;
    esac
done

# This is normally unused
# shellcheck disable=SC2034
APP_BASE_NAME=\${0##*/}
# Discard cd standard output in case $CDPATH is set (https://github.com/gradle/gradle/issues/25036)
APP_HOME=$( cd -P "\${APP_HOME:-./}" > /dev/null && printf '%s\\n' "$PWD" ) || exit

# Use the maximum available, or set MAX_FD != -1 to use that value.
MAX_FD=maximum

warn () {
    echo "$*"
} >&2

die () {
    echo
    echo "$*"
    echo
    exit 1
} >&2

# OS specific support (must be 'true' or 'false').
cygwin=false
msys=false
darwin=false
nonstop=false
case "$( uname )" in                #(
  CYGWIN* )         cygwin=true  ;; #(
  Darwin* )         darwin=true  ;; #(
  MSYS* | MINGW* )  msys=true    ;; #(
  NONSTOP* )        nonstop=true ;;
esac



# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        # IBM's JDK on AIX uses strange locations for the executables
        JAVACMD=$JAVA_HOME/jre/sh/java
    else
        JAVACMD=$JAVA_HOME/bin/java
    fi
    if [ ! -x "$JAVACMD" ] ; then
        die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME

Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
    fi
else
    JAVACMD=java
    if ! command -v java >/dev/null 2>&1
    then
        die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.

Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
    fi
fi

# Increase the maximum file descriptors if we can.
if ! "$cygwin" && ! "$darwin" && ! "$nonstop" ; then
    case $MAX_FD in #(
      max*)
        # In POSIX sh, ulimit -H is undefined. That's why the result is checked to see if it worked.
        # shellcheck disable=SC2039,SC3045
        MAX_FD=$( ulimit -H -n ) ||
            warn "Could not query maximum file descriptor limit"
    esac
    case $MAX_FD in  #(
      '' | soft) :;; #(
      *)
        # In POSIX sh, ulimit -n is undefined. That's why the result is checked to see if it worked.
        # shellcheck disable=SC2039,SC3045
        ulimit -n "$MAX_FD" ||
            warn "Could not set maximum file descriptor limit to $MAX_FD"
    esac
fi

# Collect all arguments for the java command, stacking in reverse order:
#   * args from the command line
#   * the main class name
#   * -classpath
#   * -D...appname settings
#   * --module-path (only if needed)
#   * DEFAULT_JVM_OPTS, JAVA_OPTS, and GRADLE_OPTS environment variables.

# For Cygwin or MSYS, switch paths to Windows format before running java
if "$cygwin" || "$msys" ; then
    APP_HOME=$( cygpath --path --mixed "$APP_HOME" )

    JAVACMD=$( cygpath --unix "$JAVACMD" )

    # Now convert the arguments - kludge to limit ourselves to /bin/sh
    for arg do
        if
            case $arg in                                #(
              -*)   false ;;                            # don't mess with options #(
              /?*)  t=\${arg#/} t=/\${t%%/*}              # looks like a POSIX filepath
                    [ -e "$t" ] ;;                      #(
              *)    false ;;
            esac
        then
            arg=$( cygpath --path --ignore --mixed "$arg" )
        fi
        # Roll the args list around exactly as many times as the number of
        # args, so each arg winds up back in the position where it started, but
        # possibly modified.
        #
        # NB: a \`for\` loop captures its iteration list before it begins, so
        # changing the positional parameters here affects neither the number of
        # iterations, nor the values presented in \`arg\`.
        shift                   # remove old arg
        set -- "$@" "$arg"      # push replacement arg
    done
fi


# Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'

# Collect all arguments for the java command:
#   * DEFAULT_JVM_OPTS, JAVA_OPTS, and optsEnvironmentVar are not allowed to contain shell fragments,
#     and any embedded shellness will be escaped.
#   * For example: A user cannot expect \${Hostname} to be expanded, as it is an environment variable and will be
#     treated as '\${Hostname}' itself on the command line.

set -- \\
        "-Dorg.gradle.appname=$APP_BASE_NAME" \\
        -jar "$APP_HOME/gradle/wrapper/gradle-wrapper.jar" \\
        "$@"

# Stop when "xargs" is not available.
if ! command -v xargs >/dev/null 2>&1
then
    die "xargs is not available"
fi

# Use "xargs" to parse quoted args.
#
# With -n1 it outputs one arg per line, with the quotes and backslashes removed.
#
# In Bash we could simply go:
#
#   readarray ARGS < <( xargs -n1 <<<"$var" ) &&
#   set -- "\${ARGS[@]}" "$@"
#
# but POSIX shell has neither arrays nor command substitution, so instead we
# post-process each arg (as a line of input to sed) to backslash-escape any
# character that might be a shell metacharacter, then use eval to reverse
# that process (while maintaining the separation between arguments), and wrap
# the whole thing up as a single "set" statement.
#
# This will of course break if any of these variables contains a newline or
# an unmatched quote.
#

eval "set -- $(
        printf '%s\\n' "$DEFAULT_JVM_OPTS $JAVA_OPTS $GRADLE_OPTS" |
        xargs -n1 |
        sed ' s~[^-[:alnum:]+,./:=@_]~\\\\&~g; ' |
        tr '\\n' ' '
    )" '"$@"'

exec "$JAVACMD" "$@"
`;
var GRADLEW9_BAT = `@rem\r
@rem Copyright 2015 the original author or authors.\r
@rem\r
@rem Licensed under the Apache License, Version 2.0 (the "License");\r
@rem you may not use this file except in compliance with the License.\r
@rem You may obtain a copy of the License at\r
@rem\r
@rem      https://www.apache.org/licenses/LICENSE-2.0\r
@rem\r
@rem Unless required by applicable law or agreed to in writing, software\r
@rem distributed under the License is distributed on an "AS IS" BASIS,\r
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r
@rem See the License for the specific language governing permissions and\r
@rem limitations under the License.\r
@rem\r
@rem SPDX-License-Identifier: Apache-2.0\r
@rem\r
\r
@if "%DEBUG%"=="" @echo off\r
@rem ##########################################################################\r
@rem\r
@rem  gradlew startup script for Windows\r
@rem\r
@rem ##########################################################################\r
\r
@rem Set local scope for the variables, and ensure extensions are enabled\r
setlocal EnableExtensions\r
\r
set DIRNAME=%~dp0\r
if "%DIRNAME%"=="" set DIRNAME=.\r
@rem This is normally unused\r
set APP_BASE_NAME=%~n0\r
set APP_HOME=%DIRNAME%\r
\r
@rem Resolve any "." and ".." in APP_HOME to make it shorter.\r
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi\r
\r
@rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.\r
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"\r
\r
@rem Find java.exe\r
if defined JAVA_HOME goto findJavaFromJavaHome\r
\r
set JAVA_EXE=java.exe\r
%JAVA_EXE% -version >NUL 2>&1\r
if %ERRORLEVEL% equ 0 goto execute\r
\r
echo. 1>&2\r
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH. 1>&2\r
echo. 1>&2\r
echo Please set the JAVA_HOME variable in your environment to match the 1>&2\r
echo location of your Java installation. 1>&2\r
\r
"%COMSPEC%" /c exit 1\r
\r
:findJavaFromJavaHome\r
set JAVA_HOME=%JAVA_HOME:"=%\r
set JAVA_EXE=%JAVA_HOME%/bin/java.exe\r
\r
if exist "%JAVA_EXE%" goto execute\r
\r
echo. 1>&2\r
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME% 1>&2\r
echo. 1>&2\r
echo Please set the JAVA_HOME variable in your environment to match the 1>&2\r
echo location of your Java installation. 1>&2\r
\r
"%COMSPEC%" /c exit 1\r
\r
:execute\r
@rem Setup the command line\r
\r
\r
\r
@rem Execute gradlew\r
@rem endlocal doesn't take effect until after the line is parsed and variables are expanded\r
@rem which allows us to clear the local environment before executing the java command\r
endlocal & "%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -jar "%APP_HOME%\\gradle\\wrapper\\gradle-wrapper.jar" %* & call :exitWithErrorLevel\r
\r
:exitWithErrorLevel\r
@rem Use "%COMSPEC%" /c exit to allow operators to work properly in scripts\r
"%COMSPEC%" /c exit %ERRORLEVEL%\r
`;
var WRAPPER9_JAR_B64 = "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";

// ../mod/mythicforge-studio/src/lib/mod/gradleGen.ts
var major = (v) => parseInt(v.split(".")[0], 10) || 0;
function wrapperFiles(env) {
  const nine = major(env.gradle) >= 9;
  const props = (nine ? WRAPPER9_PROPERTIES : WRAPPER_PROPERTIES).replace(/gradle-[0-9.]+(-[a-z]+)?-bin\.zip/, `gradle-${env.gradle}-bin.zip`);
  return [
    { path: "gradle/wrapper/gradle-wrapper.properties", kind: "text", content: props },
    { path: "gradle/wrapper/gradle-wrapper.jar", kind: "binary", encoding: "base64", content: nine ? WRAPPER9_JAR_B64 : WRAPPER_JAR_B64 },
    { path: "gradlew", kind: "text", content: nine ? GRADLEW9 : GRADLEW, executable: true },
    { path: "gradlew.bat", kind: "text", content: nine ? GRADLEW9_BAT : GRADLEW_BAT }
  ];
}
function gradleFiles(project, env) {
  const { meta } = project;
  const mojmap = env.mappings === "mojmap";
  const mappingsLine = mojmap ? `    mappings(loom.officialMojangMappings())` : `    mappings("net.fabricmc:yarn:\${project.property("yarn_mappings")}:v2")`;
  const build = `plugins {
    id("${env.loomPlugin}") version "${env.loom}"
    kotlin("jvm") version "${env.kotlin}"
}

base {
    archivesName.set(project.property("archives_base_name") as String)
}

version = project.property("mod_version") as String
group = project.property("maven_group") as String

repositories {
    mavenCentral()
}

dependencies {
    minecraft("com.mojang:minecraft:\${project.property("minecraft_version")}")
${mappingsLine}
    modImplementation("net.fabricmc:fabric-loader:\${project.property("loader_version")}")
    modImplementation("net.fabricmc.fabric-api:fabric-api:\${project.property("fabric_version")}")
    modImplementation("net.fabricmc:fabric-language-kotlin:\${project.property("kotlin_loader_version")}")
}

tasks.withType<JavaCompile>().configureEach {
    options.release.set(${env.java})
}

kotlin {
    jvmToolchain(${env.java})
}

java {
    withSourcesJar()
    sourceCompatibility = JavaVersion.VERSION_${env.java}
    targetCompatibility = JavaVersion.VERSION_${env.java}
}
`;
  const settings = `pluginManagement {
    repositories {
        maven("https://maven.fabricmc.net/") { name = "Fabric" }
        mavenCentral()
        gradlePluginPortal()
    }
}

// Minecraft ${env.minecraft} / Fabric Loom requires Gradle to run on JDK ${env.java} or newer.
if (!JavaVersion.current().isCompatibleWith(JavaVersion.VERSION_${env.java})) {
    throw GradleException(
        """
        |
        |  [!] This project needs JDK ${env.java}+ to build. Current Gradle JVM: \${JavaVersion.current()}
        |
        |  IntelliJ IDEA:
        |    1. File > Settings > Build, Execution, Deployment > Build Tools > Gradle
        |    2. Set "Gradle JVM" to a JDK ${env.java} (use "Download JDK..." if missing)
        |    3. File > Project Structure > Project > SDK = ${env.java}
        |    4. Click "Reload All Gradle Projects" in the Gradle tool window
        |
        |  Command line:
        |    Set JAVA_HOME to JDK ${env.java}, then run ./gradlew build
        |  (See README.md for details)
        """.trimMargin()
    )
}

rootProject.name = "${meta.modId}"
`;
  const props = `org.gradle.jvmargs=-Xmx2G
org.gradle.parallel=true

# --- Build environment (profile: ${env.profile}) ---
minecraft_version=${env.minecraft}
${mojmap ? "# mappings: Mojang official (loom.officialMojangMappings)" : `yarn_mappings=${env.yarn}`}
loader_version=${env.loader}
kotlin_loader_version=${env.kotlinLoader}
fabric_version=${env.fabricApi}

# --- Mod ---
mod_version=${meta.version}
maven_group=${meta.packageName}
archives_base_name=${meta.modId}
`;
  return [
    { path: "build.gradle.kts", kind: "gradle", content: build },
    { path: "settings.gradle.kts", kind: "gradle", content: settings },
    { path: "gradle.properties", kind: "text", content: props },
    ...wrapperFiles(env)
  ];
}

// ../mod/mythicforge-studio/src/lib/mod/extrasgen.ts
var i2 = (n) => Math.round(Number.isFinite(Number(n)) ? Number(n) : 0);
function extrasMojBody(project, H) {
  const { q: q2, f: f2, d: d2, ns: ns2 } = H;
  const effects = (project.effects ?? []).map((e) => `defineEffect(${q2(e.id)}, MobEffectCategory.${e.category}, ${parseInt(e.color.replace("#", ""), 16) || 0}, ${q2(e.tickSkillId)}, ${Math.max(1, i2(e.intervalTicks))}, ${e.revive ? "true" : "false"}, ${f2(e.reviveHealth)}, ${q2(e.reviveSkillId)})`);
  const advs = [];
  for (const a of project.advancements ?? []) {
    const steps = a.kind === "OBTAIN_ITEM" ? 1 : Math.max(1, i2(a.steps));
    advs.push(`advSteps[${q2(a.id)}] = ${steps}`);
    if (a.kind === "KILL_MOB") advs.push(`killRules.add(Pair(${q2(a.mob === "ANY" ? "ANY" : ns2(a.mob))}, ${q2(a.id)}))`);
  }
  const shops = (project.shops ?? []).map((s) => {
    const trades = s.trades.map((t) => `Trade(${q2(t.id)}, ${q2(ns2(t.offerItem))}, ${i2(t.offerCount)}, ${q2(ns2(t.requiredItem1))}, ${i2(t.requiredCount1)}, ${q2(t.requiredItem2 ? ns2(t.requiredItem2) : "")}, ${i2(t.requiredCount2)})`);
    const block = s.openedByBlockId ? `${project.meta.modId}:${s.openedByBlockId}` : "";
    return `defineShop(${q2(s.id)}, ${q2(s.name)}, ${q2(block)}, listOf(${trades.join(", ")}))`;
  });
  const upgrades = (project.skillPoints ?? []).map((u) => `defineUpgrade(${q2(u.id)}, ${q2(u.name)}, ${Math.max(1, i2(u.cost))}, ${q2(u.effect)}, ${d2(u.amount)})`);
  const defs = [...effects, ...advs, ...shops, ...upgrades];
  return `/** \u30AB\u30B9\u30BF\u30E0\u30B9\u30C6\u30FC\u30BF\u30B9\u52B9\u679C\u3002\u6BCEtick\u30B9\u30AD\u30EB\u306E\u767A\u52D5\u306B\u5BFE\u5FDC */
class ModEffect(category: MobEffectCategory, color: Int, private val tickSkill: String, private val interval: Int) : MobEffect(category, color) {
    override fun shouldApplyEffectTickThisTick(duration: Int, amplifier: Int): Boolean =
        tickSkill.isNotEmpty() && interval > 0 && duration % interval == 0

    override fun applyEffectTick(level: ServerLevel, entity: LivingEntity, amplifier: Int): Boolean {
        if (tickSkill.isNotEmpty() && entity is ServerPlayer) SkillManager.cast(tickSkill, entity, null, silent = true, free = true)
        return true
    }
}

/** \u62E1\u5F35\u30B7\u30B9\u30C6\u30E0 (\u30A8\u30D5\u30A7\u30AF\u30C8 / \u5B9F\u7E3E / \u30B7\u30E7\u30C3\u30D7 / \u30B9\u30AD\u30EB\u30DD\u30A4\u30F3\u30C8)\u3002Minecraft 1.21.11 \u5C02\u7528 */
object ModExtras {
    private class EffectSpec(val revive: Boolean, val reviveHealth: Float, val reviveSkill: String)
    private class Trade(val id: String, val offer: String, val offerCount: Int, val req1: String, val count1: Int, val req2: String, val count2: Int)
    private class Shop(val id: String, val name: String, val trades: List<Trade>)
    private class Upgrade(val id: String, val name: String, val cost: Int, val effect: String, val amount: Double)

    private val holders = LinkedHashMap<String, Holder<MobEffect>>()
    private val effectSpecs = LinkedHashMap<String, EffectSpec>()
    private val advSteps = LinkedHashMap<String, Int>()
    private val killRules = ArrayList<Pair<String, String>>()
    private val shops = LinkedHashMap<String, Shop>()
    private val shopBlocks = HashMap<String, String>()
    private val upgrades = LinkedHashMap<String, Upgrade>()

    private fun defineEffect(id: String, category: MobEffectCategory, color: Int, tickSkill: String, interval: Int, revive: Boolean, reviveHealth: Float, reviveSkill: String) {
        val effect: MobEffect = ModEffect(category, color, tickSkill, interval)
        holders[id] = Registry.registerForHolder(BuiltInRegistries.MOB_EFFECT, Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, id), effect)
        effectSpecs[id] = EffectSpec(revive, reviveHealth, reviveSkill)
    }

    private fun defineShop(id: String, name: String, block: String, trades: List<Trade>) {
        shops[id] = Shop(id, name, trades)
        if (block.isNotEmpty()) shopBlocks[block] = id
    }

    private fun defineUpgrade(id: String, name: String, cost: Int, effect: String, amount: Double) {
        upgrades[id] = Upgrade(id, name, cost, effect, amount)
    }

    // ------------------------------------------------------------ \u30A8\u30D5\u30A7\u30AF\u30C8
    fun applyEffect(ctx: SkillContext, mode: TargetMode, radius: Double, id: String, ticks: Int, amplifier: Int) {
        val holder = holders[id] ?: return
        for (e in ctx.entities(mode, radius)) e.addEffect(MobEffectInstance(holder, ticks, amplifier))
    }

    // ------------------------------------------------------------ \u5B9F\u7E3E
    fun advance(ctx: SkillContext, advId: String, amount: Int) = advance(ctx.player, advId, amount)

    fun advance(player: ServerPlayer, advId: String, amount: Int) {
        val holder = player.level().server.advancements.get(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, advId)) ?: return
        val tracker = player.advancements
        val total = advSteps[advId] ?: 1
        var left = amount.coerceAtLeast(1)
        val progress = tracker.getOrStartProgress(holder)
        for (n in 1..total) {
            if (left <= 0) break
            val name = "step_" + n
            if (progress.getCriterion(name)?.isDone == true) continue
            if (tracker.award(holder, name)) left -= 1
        }
    }

    // ------------------------------------------------------------ \u30B7\u30E7\u30C3\u30D7 (\u53D6\u5F15\u753B\u9762)
    private class ShopMerchant(private val offerList: MerchantOffers) : Merchant {
        private var customer: Player? = null
        override fun setTradingPlayer(player: Player?) { customer = player }
        override fun getTradingPlayer(): Player? = customer
        override fun getOffers(): MerchantOffers = offerList
        override fun overrideOffers(offers: MerchantOffers) {}
        override fun notifyTrade(offer: MerchantOffer) { offer.increaseUses() }
        override fun notifyTradeUpdated(stack: ItemStack) {}
        override fun getVillagerXp(): Int = 0
        override fun overrideXp(xp: Int) {}
        override fun showProgressBar(): Boolean = false
        override fun getNotifyTradeSound(): SoundEvent = SoundEvents.VILLAGER_YES
        override fun isClientSide(): Boolean = false
        override fun stillValid(player: Player): Boolean = customer === player
    }

    private fun itemOf(id: String) = BuiltInRegistries.ITEM.getValue(Identifier.parse(id))

    fun openShop(player: ServerPlayer, id: String) {
        val shop = shops[id]
        if (shop == null) {
            player.displayClientMessage(Component.literal("\u30B7\u30E7\u30C3\u30D7\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093: " + id), true)
            return
        }
        val offers = MerchantOffers()
        for (t in shop.trades) {
            val cost1 = ItemCost(itemOf(t.req1), t.count1)
            val cost2: Optional<ItemCost> = if (t.req2.isNotEmpty() && t.count2 > 0) Optional.of(ItemCost(itemOf(t.req2), t.count2)) else Optional.empty()
            offers.add(MerchantOffer(cost1, cost2, ItemStack(itemOf(t.offer), t.offerCount), 0, 9999999, 0, 0.0f))
        }
        val merchant = ShopMerchant(offers)
        merchant.setTradingPlayer(player)
        merchant.openTradingScreen(player, Component.literal(shop.name), 1)
    }

    // ------------------------------------------------------------ \u30B9\u30AD\u30EB\u30DD\u30A4\u30F3\u30C8
    private fun setBase(player: ServerPlayer, attr: Holder<Attribute>, value: Double) {
        val inst = player.getAttribute(attr) ?: return
        if (inst.baseValue != value) inst.baseValue = value
    }

    /** \u8CFC\u5165\u6E08\u307F\u5F37\u5316\u306E\u5408\u8A08\u3092\u5C5E\u6027\u306B\u53CD\u6620 (\u51AA\u7B49) */
    fun applyUpgrades(player: ServerPlayer) {
        if (upgrades.isEmpty()) return
        val ctx = SkillContext(player, player.level())
        val sum = HashMap<String, Double>()
        for (u in upgrades.values) sum[u.effect] = (sum[u.effect] ?: 0.0) + Variables.get(ctx, "SELF", "sp_" + u.id) * u.amount
        val defined = upgrades.values.map { it.effect }.toSet()
        if ("INCREASE_MAX_HEALTH" in defined) setBase(player, Attributes.MAX_HEALTH, 20.0 + (sum["INCREASE_MAX_HEALTH"] ?: 0.0))
        if ("INCREASE_DAMAGE" in defined) setBase(player, Attributes.ATTACK_DAMAGE, 1.0 + (sum["INCREASE_DAMAGE"] ?: 0.0))
        if ("INCREASE_DEFENSE" in defined) setBase(player, Attributes.ARMOR, sum["INCREASE_DEFENSE"] ?: 0.0)
        if ("INCREASE_SPEED" in defined) setBase(player, Attributes.MOVEMENT_SPEED, 0.1 + (sum["INCREASE_SPEED"] ?: 0.0))
        if ("INCREASE_LUCK" in defined) setBase(player, Attributes.LUCK, sum["INCREASE_LUCK"] ?: 0.0)
        if (player.health > player.maxHealth) player.health = player.maxHealth
    }

    /** \u6700\u5927\u30DE\u30CA\u306E\u52A0\u7B97\u5206 (SkillManager \u304B\u3089\u53C2\u7167) */
    fun extraMana(player: ServerPlayer): Int {
        if (upgrades.isEmpty()) return 0
        val ctx = SkillContext(player, player.level())
        var total = 0.0
        for (u in upgrades.values) if (u.effect == "INCREASE_MAX_MANA") total += Variables.get(ctx, "SELF", "sp_" + u.id) * u.amount
        return total.toInt()
    }

    private fun showUpgrades(player: ServerPlayer) {
        val ctx = SkillContext(player, player.level())
        val points = Variables.get(ctx, "SELF", "skill_points").toInt()
        player.displayClientMessage(Component.literal("=== \u30B9\u30AD\u30EB\u30DD\u30A4\u30F3\u30C8: " + points + " pt ===").withStyle(ChatFormatting.GOLD), false)
        for (u in upgrades.values) {
            val lv = Variables.get(ctx, "SELF", "sp_" + u.id).toInt()
            player.displayClientMessage(Component.literal("  /sp buy " + u.id + "  " + u.name + "  (\u5FC5\u8981 " + u.cost + "pt / \u73FE\u5728 Lv" + lv + ")").withStyle(ChatFormatting.YELLOW), false)
        }
    }

    private fun buyUpgrade(player: ServerPlayer, id: String): Boolean {
        val up = upgrades[id]
        if (up == null) {
            player.displayClientMessage(Component.literal("\u4E0D\u660E\u306A\u5F37\u5316: " + id).withStyle(ChatFormatting.RED), true)
            return false
        }
        val ctx = SkillContext(player, player.level())
        if (Variables.get(ctx, "SELF", "skill_points") < up.cost) {
            player.displayClientMessage(Component.literal("\u30B9\u30AD\u30EB\u30DD\u30A4\u30F3\u30C8\u304C\u8DB3\u308A\u307E\u305B\u3093 (\u5FC5\u8981 " + up.cost + "pt)").withStyle(ChatFormatting.RED), true)
            return false
        }
        Variables.add(ctx, "SELF", "skill_points", -up.cost.toDouble(), 0.0, 100000.0)
        Variables.add(ctx, "SELF", "sp_" + up.id, 1.0, 0.0, 1000.0)
        applyUpgrades(player)
        player.displayClientMessage(Component.literal("\u5F37\u5316\u300C" + up.name + "\u300D\u3092\u7FD2\u5F97\u3057\u307E\u3057\u305F").withStyle(ChatFormatting.GREEN), false)
        return true
    }

    // ------------------------------------------------------------ \u767B\u9332
    fun register() {
${H.ind(defs.length ? defs : ["// (\u62E1\u5F35\u5B9A\u7FA9\u306A\u3057)"], 8).join("\n")}

        // \u5FA9\u6D3B\u30A8\u30D5\u30A7\u30AF\u30C8 (\u4E0D\u6B7B\u306E\u30C8\u30FC\u30C6\u30E0\u98A8)
        ServerLivingEntityEvents.ALLOW_DEATH.register { entity, _, _ ->
            for ((id, spec) in effectSpecs) {
                if (!spec.revive) continue
                val holder = holders[id] ?: continue
                if (!entity.hasEffect(holder)) continue
                entity.removeAllEffects()
                entity.health = spec.reviveHealth.coerceIn(1.0f, entity.maxHealth)
                entity.addEffect(MobEffectInstance(MobEffects.REGENERATION, 900, 1))
                entity.addEffect(MobEffectInstance(MobEffects.ABSORPTION, 100, 1))
                entity.addEffect(MobEffectInstance(MobEffects.FIRE_RESISTANCE, 800, 0))
                (entity.level() as? ServerLevel)?.broadcastEntityEvent(entity, 35.toByte())
                if (spec.reviveSkill.isNotEmpty() && entity is ServerPlayer) SkillManager.cast(spec.reviveSkill, entity, null, silent = true, free = true)
                return@register false
            }
            true
        }

        // \u8A0E\u4F10\u30AB\u30A6\u30F3\u30C8\u5B9F\u7E3E
        if (killRules.isNotEmpty()) {
            ServerEntityCombatEvents.AFTER_KILLED_OTHER_ENTITY.register { _, entity, killed, _ ->
                if (entity is ServerPlayer) {
                    val typeId = BuiltInRegistries.ENTITY_TYPE.getKey(killed.type).toString()
                    for ((mob, adv) in killRules) if (mob == "ANY" || mob == typeId) advance(entity, adv, 1)
                }
            }
        }

        // \u30D6\u30ED\u30C3\u30AF\u53F3\u30AF\u30EA\u30C3\u30AF\u3067\u30B7\u30E7\u30C3\u30D7\u3092\u958B\u304F
        if (shopBlocks.isNotEmpty()) {
            UseBlockCallback.EVENT.register { player, level, hand, hit ->
                if (!level.isClientSide && hand == InteractionHand.MAIN_HAND && player is ServerPlayer && !player.isShiftKeyDown) {
                    val key = BuiltInRegistries.BLOCK.getKey(level.getBlockState(hit.blockPos).block).toString()
                    val shopId = shopBlocks[key]
                    if (shopId != null) {
                        openShop(player, shopId)
                        return@register InteractionResult.SUCCESS
                    }
                }
                InteractionResult.PASS
            }
        }

        // \u30B9\u30AD\u30EB\u30DD\u30A4\u30F3\u30C8\u5F37\u5316\u306E\u53CD\u6620
        if (upgrades.isNotEmpty()) {
            ServerPlayConnectionEvents.JOIN.register { handler, _, _ -> applyUpgrades(handler.player) }
            ServerTickEvents.END_SERVER_TICK.register { server ->
                if (server.tickCount % 100 == 0) for (p in server.playerList.players) applyUpgrades(p)
            }
        }

        CommandRegistrationCallback.EVENT.register { dispatcher, _, _ ->
            dispatcher.register(
                Commands.literal("sp")
                    .executes { c ->
                        showUpgrades(c.source.playerOrException)
                        1
                    }
                    .then(
                        Commands.literal("buy").then(
                            Commands.argument("id", StringArgumentType.word())
                                .suggests { _, b -> SharedSuggestionProvider.suggest(upgrades.keys, b) }
                                .executes { c -> if (buyUpgrade(c.source.playerOrException, StringArgumentType.getString(c, "id"))) 1 else 0 }
                        )
                    )
            )
            dispatcher.register(
                Commands.literal("shop").then(
                    Commands.argument("id", StringArgumentType.word())
                        .suggests { _, b -> SharedSuggestionProvider.suggest(shops.keys, b) }
                        .executes { c ->
                            openShop(c.source.playerOrException, StringArgumentType.getString(c, "id"))
                            1
                        }
                )
            )
        }
        ModInfo.LOGGER.info("Registered " + effectSpecs.size + " effects, " + advSteps.size + " advancements, " + shops.size + " shops, " + upgrades.size + " upgrades")
    }
}`;
}
function extrasYarnStub() {
  return `/** \u62E1\u5F35\u30B7\u30B9\u30C6\u30E0\u306F Minecraft 1.21.11 \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u5C02\u7528\u3067\u3059\u3002\u3053\u306E\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u3067\u306F\u4F55\u3082\u884C\u3044\u307E\u305B\u3093 */
object ModExtras {
    fun register() {
        ModInfo.LOGGER.info("Extended systems (effects/advancements/shops/upgrades) require the 1.21.11 profile")
    }

    fun applyEffect(ctx: SkillContext, mode: TargetMode, radius: Double, id: String, ticks: Int, amplifier: Int) {
        ModInfo.LOGGER.warn("Custom effects require the 1.21.11 profile")
    }

    fun advance(ctx: SkillContext, advId: String, amount: Int) {
        ModInfo.LOGGER.warn("Advancements require the 1.21.11 profile")
    }

    fun openShop(player: ServerPlayerEntity, id: String) {
        ModInfo.LOGGER.warn("Shops require the 1.21.11 profile")
    }

    fun extraMana(player: ServerPlayerEntity): Int = 0
}`;
}
var SLOT_GROUP = { HELMET: "HEAD", CHESTPLATE: "CHEST", LEGGINGS: "LEGS", BOOTS: "FEET" };
function itemAttributesMojBody(project, H) {
  const { q: q2, d: d2 } = H;
  const lines = [];
  for (const it of project.items) {
    const slot = it.kind === "armor" ? SLOT_GROUP[it.armorSlot] ?? "CHEST" : "MAINHAND";
    const entries = [];
    const add = (attr, tag, v) => {
      if (Number(v) > 0) entries.push(`Triple(Attributes.${attr}, ${q2(`${it.id}_${tag}`)}, ${d2(Number(v))})`);
    };
    add("MAX_HEALTH", "bonus_health", it.bonusMaxHealth);
    add("MOVEMENT_SPEED", "bonus_speed", it.bonusMovementSpeed);
    add("ARMOR", "bonus_armor", it.bonusArmor);
    add("ARMOR_TOUGHNESS", "bonus_toughness", it.bonusToughness);
    add("KNOCKBACK_RESISTANCE", "bonus_knockback", it.bonusKnockbackResistance);
    if (entries.length) lines.push(`modify(context, ModItems.${constOf(it.id)}, EquipmentSlotGroup.${slot}, listOf(${entries.join(", ")}))`);
  }
  return `/** \u30A2\u30A4\u30C6\u30E0\u306E\u5C5E\u6027\u30DC\u30FC\u30CA\u30B9\u3092\u65E2\u5B58\u306E\u5C5E\u6027\u4FEE\u98FE\u306B\u8FFD\u8A18\u3057\u307E\u3059 (\u5263\u306E\u653B\u6483\u529B\u306A\u3069\u306F\u4FDD\u6301) */
object ModItemAttributes {
    private fun modify(context: DefaultItemComponentEvents.ModifyContext, item: Item, slot: EquipmentSlotGroup, bonuses: List<Triple<Holder<Attribute>, String, Double>>) {
        context.modify(item) { builder ->
            var modifiers = item.components().get(DataComponents.ATTRIBUTE_MODIFIERS) ?: ItemAttributeModifiers.EMPTY
            for ((attribute, name, value) in bonuses) {
                modifiers = modifiers.withModifierAdded(attribute, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, name), value, AttributeModifier.Operation.ADD_VALUE), slot)
            }
            builder.set(DataComponents.ATTRIBUTE_MODIFIERS, modifiers)
        }
    }

    fun register() {
        DefaultItemComponentEvents.MODIFY.register { context ->
${H.ind(lines.length ? lines : ["// (\u5C5E\u6027\u30DC\u30FC\u30CA\u30B9\u306A\u3057)"], 12).join("\n")}
        }
        ModInfo.LOGGER.info("Registered attribute bonuses for ${lines.length} items")
    }
}`;
}
var constOf = (id) => {
  const c = id.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase();
  return /^[0-9]/.test(c) ? `_${c}` : c;
};
function itemAttributesYarnStub() {
  return `/** \u5C5E\u6027\u30DC\u30FC\u30CA\u30B9\u306F Minecraft 1.21.11 \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u5C02\u7528\u3067\u3059 */
object ModItemAttributes {
    fun register() {
        ModInfo.LOGGER.info("Item attribute bonuses require the 1.21.11 profile")
    }
}`;
}

// ../mod/mythicforge-studio/src/lib/mod/targets.ts
var PROFILES = {
  mc1_21_11_mojmap: {
    id: "mc1_21_11_mojmap",
    label: "Minecraft 1.21.11 / Mojang \u30DE\u30C3\u30D4\u30F3\u30B0 / Loom 1.14 (\u63A8\u5968)",
    note: "\u96E3\u8AAD\u5316\u3042\u308A\u306E\u6700\u5F8C\u306E\u30D0\u30FC\u30B8\u30E7\u30F3\u3002Yarn \u540D\u3092\u4F7F\u308F\u305A Mojang \u516C\u5F0F\u540D\u3067\u30B3\u30FC\u30C9\u3092\u751F\u6210\u3057\u307E\u3059\u3002",
    verified: "JDK 21 + Gradle 9.6.1 + Loom 1.14-SNAPSHOT \u3067\u5B9F\u30B3\u30F3\u30D1\u30A4\u30EB",
    env: {
      profile: "mc1_21_11_mojmap",
      minecraft: "1.21.11",
      mappings: "mojmap",
      yarn: "",
      loomPlugin: "net.fabricmc.fabric-loom-remap",
      loom: "1.14-SNAPSHOT",
      gradle: "9.6.1",
      loader: "0.19.5",
      fabricApi: "0.141.6+1.21.11",
      kotlinLoader: "1.13.10+kotlin.2.3.20",
      kotlin: "2.3.20",
      java: 21
    }
  },
  mc1_21_1_yarn: {
    id: "mc1_21_1_yarn",
    label: "Minecraft 1.21.1 / Yarn \u30DE\u30C3\u30D4\u30F3\u30B0 / Loom 1.7 (\u65E7)",
    note: "\u5F93\u6765\u306E\u751F\u6210\u5148\u3002\u65E2\u5B58\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u4E92\u63DB\u7528\u3067\u3059\u3002",
    verified: "JDK 21 + Gradle 8.10.2 + Loom 1.7.4 \u3067\u5B9F\u30B3\u30F3\u30D1\u30A4\u30EB",
    env: {
      profile: "mc1_21_1_yarn",
      minecraft: "1.21.1",
      mappings: "yarn",
      yarn: "1.21.1+build.3",
      loomPlugin: "fabric-loom",
      loom: "1.7.4",
      gradle: "8.10.2",
      loader: "0.16.5",
      fabricApi: "0.105.0+1.21.1",
      kotlinLoader: "1.12.1+kotlin.2.0.20",
      kotlin: "2.0.20",
      java: 21
    }
  }
};
var LEGACY_PROFILE = "mc1_21_1_yarn";
function resolveEnv(meta) {
  const id = meta?.env?.profile && PROFILES[meta.env.profile] ? meta.env.profile : LEGACY_PROFILE;
  return { ...PROFILES[id].env, ...meta?.env ?? {}, profile: id };
}

// ../mod/mythicforge-studio/src/lib/mod/codegen.ts
var ARMOR_FACTOR = { LEATHER: 5, CHAINMAIL: 15, IRON: 15, GOLD: 7, DIAMOND: 33, TURTLE: 25, NETHERITE: 37 };
var ARMOR_BASE = { HELMET: 11, CHESTPLATE: 16, LEGGINGS: 15, BOOTS: 13 };
var armorDurability = (it) => it.durability > 0 ? it.durability : (ARMOR_FACTOR[it.armorMaterial] ?? 15) * (ARMOR_BASE[it.armorSlot] ?? 15);
var clsOf = (it) => {
  const map = { sword: "SwordItem", pickaxe: "PickaxeItem", axe: "AxeItem", shovel: "ShovelItem" };
  return map[it.kind] ?? "SwordItem";
};
var DIALECT = "yarn";
var MOJ = () => ({ q, d, f, i, ind, constName, armorDurability });
var q = (s) => '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/\r?\n/g, "\\n") + '"';
var d = (n) => {
  const v = Number.isFinite(Number(n)) ? Number(n) : 0;
  return Number.isInteger(v) ? `${v}.0` : `${v}`;
};
var f = (n) => `${d(n)}f`;
var i = (n) => `${Math.round(Number.isFinite(Number(n)) ? Number(n) : 0)}`;
var constName = (id) => {
  const c = id.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase();
  return /^[0-9]/.test(c) ? `_${c}` : c;
};
var ind = (lines, n) => lines.map((l) => l.length ? " ".repeat(n) + l : l);
var js = (o) => JSON.stringify(o, null, 2) + "\n";
var num = (v, def = 0) => Number.isFinite(Number(v)) ? Number(v) : def;
var str = (v) => String(v ?? "");
var tm = (v) => `TargetMode.${["SELF", "TARGET", "AREA", "POINT"].includes(str(v)) ? str(v) : "TARGET"}`;
var scopeOf = (v) => q(["SELF", "TARGET", "GLOBAL"].includes(str(v)) ? str(v) : "SELF");
var varName = (v) => q(str(v).replace(/[^A-Za-z0-9_]/g, "_") || "var");
var ns = (project, id) => id.includes(":") ? id : `${project.meta.modId}:${id}`;
function projectSymbols(project) {
  const pkg = project.meta.packageName;
  const sk = `${pkg}.skill`;
  return {
    ModMain: `${pkg}.ModMain`,
    ModInfo: `${pkg}.ModInfo`,
    ModItems: `${pkg}.ModItems`,
    ModBlocks: `${pkg}.ModBlocks`,
    ModItem: `${pkg}.ModItem`,
    ModItemGroup: `${pkg}.ModItemGroup`,
    Skill: `${sk}.Skill`,
    SkillContext: `${sk}.SkillContext`,
    SkillManager: `${sk}.SkillManager`,
    SkillActions: `${sk}.SkillActions`,
    Scheduler: `${sk}.Scheduler`,
    TargetMode: `${sk}.TargetMode`,
    Skills: `${sk}.Skills`,
    SkillTriggers: `${sk}.SkillTriggers`,
    Variables: `${sk}.Variables`,
    Missiles: `${sk}.Missiles`,
    ModWorldGen: `${pkg}.ModWorldGen`,
    ModMobs: `${pkg}.ModMobs`,
    ModExtras: `${pkg}.ModExtras`,
    ModItemAttributes: `${pkg}.ModItemAttributes`,
    ModEffect: `${pkg}.ModEffect`,
    ModConfig: `${pkg}.ModConfig`,
    ModNetworking: `${pkg}.net.ModNetworking`,
    ManaSyncPayload: `${pkg}.net.ManaSyncPayload`,
    CastSlotPayload: `${pkg}.net.CastSlotPayload`,
    ModClient: `${pkg}.client.ModClient`,
    HudState: `${pkg}.client.HudState`
  };
}
function buildKotlin(project, pkg, bodyIn, opts = {}) {
  const body = DIALECT === "mojmap" && !opts.raw ? translateBody(bodyIn) : bodyIn;
  const masked = body.replace(/\/\/ >>> custom:[\s\S]*?\/\/ <<< custom:\w+/g, "");
  const syms = projectSymbols(project);
  const used = /* @__PURE__ */ new Set();
  const toks = lexKotlin(masked).tokens;
  toks.forEach((t, idx) => {
    if (t.type !== "ident") return;
    if (toks[idx - 1]?.text === ".") return;
    used.add(t.text);
  });
  const imports = /* @__PURE__ */ new Set();
  for (const name of used) {
    if (syms[name]) {
      const pkgOf = syms[name].slice(0, syms[name].lastIndexOf("."));
      if (pkgOf !== pkg) imports.add(syms[name]);
      continue;
    }
    const cands = fqnsForSimple(name);
    if (cands.length === 1) imports.add(cands[0]);
  }
  const extraFqn = /* @__PURE__ */ new Set();
  const extraLines = [];
  for (const line of opts.extraImports ?? []) {
    const m = line.trim().match(/^import\s+([\w.*]+)(\s+as\s+\w+)?$/);
    const key = m ? m[1] + (m[2] ?? "") : line.trim();
    if (!key || extraFqn.has(key) || m && !m[2] && imports.has(m[1])) continue;
    extraFqn.add(key);
    extraLines.push(line.trim());
  }
  const importLines = [...[...imports].sort().map((x) => `import ${x}`), ...extraLines];
  return `package ${pkg}

${importLines.join("\n")}${importLines.length ? "\n\n" : ""}${body.trimEnd()}
`;
}
function runtimeKt(project) {
  const pkg = `${project.meta.packageName}.skill`;
  const body = `/** \u30B9\u30AD\u30EB\u767A\u52D5\u6642\u306B\u6E21\u3055\u308C\u308B\u30B3\u30F3\u30C6\u30AD\u30B9\u30C8 */
enum class TargetMode { SELF, TARGET, AREA, POINT }

class SkillContext(
    val player: ServerPlayerEntity,
    val world: ServerWorld,
    private val explicitTarget: LivingEntity? = null,
    /** \u30DF\u30B5\u30A4\u30EB\u306E\u7740\u5F3E\u70B9\u306A\u3069\u3002null \u306E\u5834\u5408\u306F\u81EA\u5206\u306E\u4F4D\u7F6E */
    val origin: Vec3d? = null,
) {
    /** \u8996\u7DDA\u306E\u5148\u306B\u3044\u308B\u6700\u3082\u8FD1\u3044\u751F\u304D\u7269 (\u660E\u793A\u6307\u5B9A\u304C\u3042\u308C\u3070\u305D\u308C\u3092\u512A\u5148) */
    val target: LivingEntity? by lazy { explicitTarget ?: if (origin == null) findLookTarget(24.0) else null }

    /** \u767A\u52D5\u4F4D\u7F6E (\u901A\u5E38\u306F\u81EA\u5206\u306E\u4F4D\u7F6E\u3001\u30DF\u30B5\u30A4\u30EB\u7740\u5F3E\u6642\u306F\u7740\u5F3E\u70B9) */
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

    /** \u30D1\u30FC\u30C6\u30A3\u30AF\u30EB\u30FB\u96F7\u30FB\u30D6\u30ED\u30C3\u30AF\u8A2D\u7F6E\u306A\u3069\u300C\u4F4D\u7F6E\u300D\u3092\u4F7F\u3046\u30A2\u30AF\u30B7\u30E7\u30F3\u7528 */
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

/** \u9045\u5EF6\u5B9F\u884C\u30B9\u30B1\u30B8\u30E5\u30FC\u30E9 (\u30B5\u30FC\u30D0\u30FCtick\u3067\u99C6\u52D5) */
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

/** \u30EF\u30FC\u30EB\u30C9\u306B\u4FDD\u5B58\u3055\u308C\u308B\u6570\u5024\u5909\u6570 (\u65BD\u8853\u8005 / \u30BF\u30FC\u30B2\u30C3\u30C8 / \u30B0\u30ED\u30FC\u30D0\u30EB) */
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

    /** \u30C6\u30AD\u30B9\u30C8\u5185\u306E <var.x> <target.x> <global.x> <player> <mana> <health> \u3092\u7F6E\u63DB */
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

/** \u6BCEtick\u98DB\u7FD4\u3059\u308B\u5F3E\u3002\u7740\u5F3E(\u6575\u30FB\u30D6\u30ED\u30C3\u30AF\u30FB\u6642\u9593\u5207\u308C)\u3057\u305F\u5834\u6240\u3092 origin \u3068\u3057\u3066\u30B9\u30AD\u30EB\u3092\u767A\u52D5\u3059\u308B */
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

/** \u30B9\u30AD\u30EB\u767B\u9332\u30FB\u30AF\u30FC\u30EB\u30C0\u30A6\u30F3\u30FB\u30DE\u30CA\u7BA1\u7406 */
object SkillManager {
    /** ModConfig \u304B\u3089\u8D77\u52D5\u6642\u306B\u4E0A\u66F8\u304D\u3055\u308C\u308B */
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

    /** \u30D7\u30EC\u30A4\u30E4\u30FC\u3054\u3068\u306E\u6700\u5927\u30DE\u30CA (\u57FA\u672C\u5024 + \u30B9\u30AD\u30EB\u30DD\u30A4\u30F3\u30C8\u5F37\u5316) */
    fun capOf(player: ServerPlayerEntity): Int = maxMana + ModExtras.extraMana(player)

    fun getMana(player: ServerPlayerEntity): Int = mana.getOrDefault(player.uuid, capOf(player))

    fun addMana(player: ServerPlayerEntity, amount: Int) = setMana(player, getMana(player) + amount)

    fun setMana(player: ServerPlayerEntity, amount: Int) {
        mana[player.uuid] = amount.coerceIn(0, capOf(player))
        sync(player)
    }

    /** \u30DE\u30CA\u3092\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u306EHUD\u3078\u540C\u671F */
    fun sync(player: ServerPlayerEntity) {
        ServerPlayNetworking.send(player, ManaSyncPayload(getMana(player).toFloat(), capOf(player).toFloat()))
    }

    /** \u30AD\u30FC\u30D0\u30A4\u30F3\u30C9\u306E\u30B9\u30ED\u30C3\u30C8 (1\u301C4) \u304B\u3089\u30B9\u30AD\u30EB\u3092\u767A\u52D5 */
    fun castSlot(player: ServerPlayerEntity, slot: Int) {
        val id = ModConfig.slots.getOrNull(slot)
        if (id.isNullOrBlank()) {
            notify(player, "\u30B9\u30ED\u30C3\u30C8" + (slot + 1) + "\u306B\u306F\u30B9\u30AD\u30EB\u304C\u5272\u308A\u5F53\u3066\u3089\u308C\u3066\u3044\u307E\u305B\u3093 (/skill slots)", Formatting.YELLOW)
            return
        }
        cast(id, player)
    }

    // ---- \u30DE\u30CA\u306E\u4FDD\u5B58 (\u30EF\u30FC\u30EB\u30C9\u30D5\u30A9\u30EB\u30C0\u306B JSON) ----
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

    /** \u9632\u5177\u30B9\u30ED\u30C3\u30C8\u306E\u3044\u305A\u308C\u304B\u306B itemId \u3092\u88C5\u5099\u3057\u3066\u3044\u308B\u304B */
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
                if (!silent) notify(player, "\u5C01\u5370(\u6C88\u9ED9)\u72B6\u614B\u306E\u305F\u3081\u30B9\u30AD\u30EB\u3092\u4F7F\u7528\u3067\u304D\u307E\u305B\u3093", Formatting.RED)
                return false
            }
            val readyAt = cooldowns[player.uuid]?.get(id) ?: 0L
            if (now < readyAt) {
                if (!silent) notify(player, "\u30AF\u30FC\u30EB\u30C0\u30A6\u30F3\u4E2D: \u3042\u3068 " + ((readyAt - now + 19) / 20) + " \u79D2", Formatting.YELLOW)
                return false
            }
            if (getMana(player) < skill.manaCost) {
                if (!silent) notify(player, "\u30DE\u30CA\u304C\u8DB3\u308A\u307E\u305B\u3093 (" + getMana(player) + "/" + skill.manaCost + ")", Formatting.BLUE)
                return false
            }
        }
        if (!skill.condition(ctx)) {
            if (!silent) notify(player, "\u767A\u52D5\u6761\u4EF6\u3092\u6E80\u305F\u3057\u3066\u3044\u307E\u305B\u3093", Formatting.GRAY)
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

/** \u30D3\u30B8\u30E5\u30A2\u30EB\u30A8\u30C7\u30A3\u30BF\u306E\u5404\u30D6\u30ED\u30C3\u30AF\u304C\u547C\u3073\u51FA\u3059\u5B9F\u51E6\u7406 */
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

    /** 1.21.1 \u3067\u306F\u4E00\u90E8\u306E SoundEvents \u304C RegistryEntry \u3067\u5B9A\u7FA9\u3055\u308C\u3066\u3044\u308B\u305F\u3081\u3001\u4E21\u65B9\u306B\u5BFE\u5FDC */
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
        ctx.player.sendMessage(Text.literal("\u30B9\u30AD\u30EB\u30DD\u30A4\u30F3\u30C8 +" + points + " (\u5408\u8A08 " + Variables.get(ctx, "SELF", "skill_points").toInt() + "pt / /sp \u3067\u5F37\u5316)"), true)
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
                // \u4E0D\u6B7B\u306E\u30C8\u30FC\u30C6\u30E0\u767A\u52D5\u30D1\u30B1\u30C3\u30C8\u3068\u52B9\u679C
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

    /** \u30AB\u30B9\u30BF\u30E0\u30E2\u30D6 (ModMobs) \u3092\u53EC\u559A */
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
            // \u97F3\u3068\u7159\u3092\u4E21\u65B9\u306E\u4F4D\u7F6E\u306B\u51FA\u3059
            ctx.world.spawnParticles<ParticleEffect>(ParticleTypes.PORTAL, player.x, player.y + 1.0, player.z, 20, 0.2, 0.2, 0.2, 0.0)
            ctx.world.spawnParticles<ParticleEffect>(ParticleTypes.PORTAL, victim.x, victim.y + 1.0, victim.z, 20, 0.2, 0.2, 0.2, 0.0)
            sound(ctx, SoundEvents.ENTITY_ENDERMAN_TELEPORT, 0.8f, 1.3f)
            sound(ctx, SoundEvents.ENTITY_ENDERMAN_TELEPORT, 0.8f, 1.3f)
            break // \u6700\u521D\u306E1\u4F53\u3068\u306E\u307F\u5165\u308C\u66FF\u3048
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
                e.sendMessage(Text.literal("\xA7c\u30B9\u30AD\u30EB\u304C\u5C01\u5370\u3055\u308C\u305F\uFF01"), true)
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

    /** \u6700\u3082\u8FD1\u3044\u6575\u304B\u3089\u3001\u8FD1\u304F\u306E\u5225\u306E\u6575\u3078\u96F7\u304C\u9023\u9396\u3059\u308B (\u898B\u305F\u76EE\u3060\u3051\u306E\u96F7 + \u76F4\u63A5\u30C0\u30E1\u30FC\u30B8) */
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
function genCondition(c) {
  switch (c.type) {
    case "SNEAKING":
      return "c.player.isSneaking";
    case "ON_GROUND":
      return "c.player.isOnGround";
    case "IN_WATER":
      return "c.player.isTouchingWater";
    case "HAS_TARGET":
      return "c.target != null";
    case "HEALTH_BELOW":
      return `c.player.health < c.player.maxHealth * ${f(num(c.value, 50) / 100)}`;
    case "HOLDING":
      return `SkillManager.isHolding(c.player, ${q(c.value)})`;
    case "WEARING":
      return `SkillManager.isWearing(c.player, ${q(c.value)})`;
    case "SPRINTING":
      return "c.player.isSprinting";
    case "MANA_ABOVE":
      return `SkillManager.getMana(c.player) >= ${i(num(c.value, 0))}`;
    case "VARIABLE": {
      const [scope = "SELF", name = "", min = "", max = ""] = c.value.split("|");
      const lo = min.trim() === "" ? "Double.NEGATIVE_INFINITY" : d(num(min));
      const hi = max.trim() === "" ? "Double.POSITIVE_INFINITY" : d(num(max));
      return `Variables.inRange(c, ${scopeOf(scope)}, ${varName(name)}, ${lo}, ${hi})`;
    }
    case "NOT_SNEAKING":
      return "!c.player.isSneaking";
    case "HEARTS_BELOW":
      return `c.player.health <= ${f(num(c.value, 6))}`;
    case "IN_OFFHAND":
      return `SkillManager.isInOffhand(c.player, ${q(c.value)})`;
    case "IS_DAY":
      return "c.world.isDay";
    case "IS_NIGHT":
      return "c.world.isNight";
    default:
      return "true";
  }
}
var CUSTOM_OPEN = "// >>> custom:";
var CUSTOM_CLOSE = "// <<< custom:";
function genAction(a, customCodes) {
  const p = a.params;
  const target = tm(p.target);
  const radius = d(num(p.radius, 4));
  switch (a.type) {
    case "damage":
      return [`SkillActions.damage(ctx, ${target}, ${radius}, ${f(num(p.amount))})`];
    case "heal":
      return [`SkillActions.heal(ctx, ${target}, ${radius}, ${f(num(p.amount))})`];
    case "effect":
      return [`SkillActions.effect(ctx, ${target}, ${radius}, StatusEffects.${constName(str(p.effect))}, ${i(num(p.seconds) * 20)}, ${i(num(p.amplifier))})`];
    case "ignite":
      return [`SkillActions.ignite(ctx, ${target}, ${radius}, ${f(num(p.seconds))})`];
    case "launch":
      return [`SkillActions.launch(ctx, ${target}, ${radius}, ${d(num(p.power))}, ${d(num(p.up))})`];
    case "blink":
      return [`SkillActions.blink(ctx, ${d(num(p.distance, 8))})`];
    case "explosion":
      return [`SkillActions.explosion(ctx, ${target}, ${f(num(p.power, 2))}, ${p.fire ? "true" : "false"}, ${p.breakBlocks ? "true" : "false"})`];
    case "lightning":
      return [`SkillActions.lightning(ctx, ${target}, ${radius})`];
    case "particles":
      return [`SkillActions.particles(ctx, ${target}, ${radius}, ParticleTypes.${constName(str(p.particle))}, ${i(num(p.count, 10))})`];
    case "sound":
      return [`SkillActions.sound(ctx, SoundEvents.${constName(str(p.sound))}, ${f(num(p.volume, 1))}, ${f(num(p.pitch, 1))})`];
    case "message":
      return [`SkillActions.message(ctx, ${q(str(p.text))}, ${p.actionBar ? "true" : "false"})`];
    case "giveItem":
      return [`SkillActions.giveItem(ctx, ${q(str(p.item))}, ${i(num(p.count, 1))})`];
    case "command":
      return [`SkillActions.command(ctx, ${q(str(p.command).replace(/^\//, ""))})`];
    case "restoreMana":
      return [`SkillActions.restoreMana(ctx, ${i(num(p.amount))})`];
    case "missile":
      return [`SkillActions.missile(ctx, ParticleTypes.${constName(str(p.particle))}, ${d(num(p.speed, 1.4))}, ${d(num(p.gravity))}, ${d(num(p.hitRadius, 0.6))}, ${i(num(p.lifetime, 40))}, ${q(str(p.onHitSkill))})`];
    case "ring":
      return [`SkillActions.ring(ctx, ${target}, ${radius}, ${d(num(p.ringRadius, 3))}, ParticleTypes.${constName(str(p.particle))}, ${i(num(p.points, 24))})`];
    case "setVar":
      return [`SkillActions.setVar(ctx, ${scopeOf(p.scope)}, ${varName(p.name)}, ${d(num(p.value))})`];
    case "addVar":
      return [`SkillActions.addVar(ctx, ${scopeOf(p.scope)}, ${varName(p.name)}, ${d(num(p.amount, 1))}, ${d(num(p.min))}, ${d(num(p.max, 1e6))})`];
    case "title":
      return [`SkillActions.title(ctx, ${q(str(p.text))}, ${q(str(p.subtitle))})`];
    case "feed":
      return [`SkillActions.feed(ctx, ${i(num(p.amount, 6))})`];
    case "summonCustom":
      return [`SkillActions.summonCustom(ctx, ${target}, ${radius}, ${q(str(p.mobId))}, ${i(num(p.count, 1))})`];
    case "customEffect":
      return [`ModExtras.applyEffect(ctx, ${target}, ${radius}, ${q(str(p.effectId))}, ${i(num(p.seconds, 60) * 20)}, ${i(num(p.amplifier))})`];
    case "advance":
      return [`ModExtras.advance(ctx, ${q(str(p.advId))}, ${i(num(p.amount, 1))})`];
    case "openShop":
      return [`SkillActions.openShop(ctx, ${q(str(p.shopId))})`];
    case "grantSkillPoints":
      return [`SkillActions.grantSkillPoints(ctx, ${i(num(p.points, 1))})`];
    case "bossbar":
      return [`SkillActions.bossbar(ctx, ${q(str(p.text))}, ${f(num(p.percent, 100))}, ${q(str(p.color))})`];
    case "scoreboard":
      return [`SkillActions.scoreboard(ctx, ${q(str(p.objective))}, ${i(num(p.score, 10))})`];
    case "totemEffect":
      return [`SkillActions.totemEffect(ctx, ${target}, ${radius})`];
    case "spiral":
      return [`SkillActions.spiral(ctx, ${target}, ${radius}, ${d(num(p.radius, 2))}, ${d(num(p.height, 4))}, ParticleTypes.${constName(str(p.particle))})`];
    case "openGui":
      return [`SkillActions.openGui(ctx, ${q(str(p.guiType))})`];
    case "swap":
      return [`SkillActions.swap(ctx, ${target}, ${radius})`];
    case "knockup":
      return [`SkillActions.knockup(ctx, ${target}, ${radius}, ${d(num(p.power, 1.2))})`];
    case "gravity":
      return [`SkillActions.gravity(ctx, ${target}, ${radius}, ${d(num(p.power, 1.6))})`];
    case "silence":
      return [`SkillActions.silence(ctx, ${target}, ${radius}, ${i(num(p.seconds, 4) * 20)})`];
    case "pull":
      return [`SkillActions.pull(ctx, ${target}, ${radius}, ${d(num(p.power, 1.2))})`];
    case "lifesteal":
      return [`SkillActions.lifesteal(ctx, ${target}, ${radius}, ${f(num(p.amount, 4))}, ${d(num(p.ratio, 50) / 100)})`];
    case "chainLightning":
      return [`SkillActions.chainLightning(ctx, ${target}, ${radius}, ${i(num(p.jumps, 4))}, ${d(num(p.range, 6))}, ${f(num(p.amount, 5))})`];
    case "dropItem":
      return [`SkillActions.dropItem(ctx, ${target}, ${radius}, ${q(str(p.item))}, ${i(num(p.count, 1))})`];
    case "shield":
      return [`SkillActions.shield(ctx, ${f(num(p.amount, 6))})`];
    case "resetCooldowns":
      return [`SkillActions.resetCooldowns(ctx)`];
    case "ifVar":
      return [`if (Variables.inRange(ctx, ${scopeOf(p.scope)}, ${varName(p.name)}, ${d(num(p.min))}, ${d(num(p.max, 1e6))})) {`, ...ind(genActions(a.children ?? [], customCodes), 4), "}"];
    case "chance":
      return [`if (SkillActions.chance(ctx, ${d(num(p.percent, 30))})) {`, ...ind(genActions(a.children ?? [], customCodes), 4), "}"];
    case "summon":
      return [`SkillActions.summon(ctx, ${target}, ${radius}, EntityType.${constName(str(p.entity))}, ${i(num(p.count, 1))})`];
    case "fireball":
      return [`SkillActions.fireball(ctx, ${target}, ${radius}, ${d(num(p.speed, 1.5))})`];
    case "placeBlock":
      return [`SkillActions.placeBlock(ctx, ${target}, ${radius}, Blocks.${constName(str(p.block))}, ${i(num(p.yOffset))})`];
    case "breakBlock":
      return [`SkillActions.breakBlock(ctx, ${target}, ${radius}, ${p.drop ? "true" : "false"})`];
    case "teleportNear":
      return [`SkillActions.teleportNear(ctx, ${target}, ${radius}, ${d(num(p.distance, 2.5))})`];
    case "clearEffects":
      return [`SkillActions.clearEffects(ctx, ${target}, ${radius})`];
    case "giveXp":
      return [`SkillActions.giveXp(ctx, ${i(num(p.amount, 20))})`];
    case "castSkill":
      return [`SkillActions.castSkill(ctx, ${q(str(p.skillId))})`];
    case "delay":
      return [`SkillActions.later(ctx, ${i(num(p.ticks, 20))}) {`, ...ind(genActions(a.children ?? [], customCodes), 4), "}"];
    case "repeat":
      return [`SkillActions.repeatEvery(ctx, ${i(num(p.times, 3))}, ${i(num(p.interval, 10))}) {`, ...ind(genActions(a.children ?? [], customCodes), 4), "}"];
    case "custom": {
      const code = str(p.code);
      customCodes.push(code);
      return [`${CUSTOM_OPEN}${a.uid}`, ...code.split("\n"), `${CUSTOM_CLOSE}${a.uid}`];
    }
    default:
      return [`// unknown action: ${a.type}`];
  }
}
function genActions(actions, customCodes) {
  if (actions.length === 0) return ["// (\u30A2\u30AF\u30B7\u30E7\u30F3\u306A\u3057)"];
  return actions.flatMap((a) => genAction(a, customCodes));
}
function skillsKt(project) {
  const customCodes = [];
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
      `)`
    ];
  });
  const body = `/** \u3053\u306E\u30D5\u30A1\u30A4\u30EB\u306FMythicForge\u304C\u751F\u6210\u3057\u307E\u3057\u305F\u3002\u30B9\u30AD\u30EB\u5B9A\u7FA9\u306E\u767B\u9332\u3092\u884C\u3044\u307E\u3059\u3002 */
object Skills {
    fun register() {
${ind(blocks.flatMap((b, idx) => idx ? ["", ...b] : b), 8).join("\n")}
    }
}`;
  const extra = project.customImports.split("\n").map((l) => l.trim()).filter(Boolean);
  return buildKotlin(project, `${project.meta.packageName}.skill`, body, { extraImports: extra });
}
function holdingCheck(s, playerVar) {
  return s.trigger.heldItem.trim() ? ` && SkillManager.isHolding(${playerVar}, ${q(s.trigger.heldItem.trim())})` : "";
}
function triggersKt(project) {
  const auto = project.skills.filter((s) => s.trigger.type !== "MANUAL");
  const regs = [];
  const periodic = [];
  for (const s of auto) {
    const id = q(s.id);
    const h = (v) => holdingCheck(s, v);
    switch (s.trigger.type) {
      case "ATTACK_ENTITY":
        regs.push(
          `// ${s.name}: \u653B\u6483\u6642`,
          `AttackEntityCallback.EVENT.register { player, world, hand, entity, _ ->`,
          `    if (!world.isClient && hand == Hand.MAIN_HAND && player is ServerPlayerEntity && entity is LivingEntity${h("player")}) {`,
          `        SkillManager.cast(${id}, player, entity, silent = true)`,
          `    }`,
          `    ActionResult.PASS`,
          `}`,
          ""
        );
        break;
      case "KILL_ENTITY":
        regs.push(
          `// ${s.name}: \u6483\u7834\u6642`,
          `ServerEntityCombatEvents.AFTER_KILLED_OTHER_ENTITY.register { _, entity, killed ->`,
          `    if (entity is ServerPlayerEntity${h("entity")}) {`,
          `        SkillManager.cast(${id}, entity, killed, silent = true)`,
          `    }`,
          `}`,
          ""
        );
        break;
      case "BREAK_BLOCK":
        regs.push(
          `// ${s.name}: \u30D6\u30ED\u30C3\u30AF\u7834\u58CA\u6642`,
          `PlayerBlockBreakEvents.AFTER.register { _, player, _, _, _ ->`,
          `    if (player is ServerPlayerEntity${h("player")}) {`,
          `        SkillManager.cast(${id}, player, null, silent = true)`,
          `    }`,
          `}`,
          ""
        );
        break;
      case "WEAR": {
        const ticks = Math.max(1, Math.round(num(s.trigger.intervalSec, 5) * 20));
        const wid = q(ns(project, s.trigger.heldItem.trim() || "none"));
        periodic.push(
          `// ${s.name}: \u88C5\u5099\u4E2D`,
          `if (server.ticks % ${ticks} == 0) {`,
          `    for (player in server.playerManager.playerList) {`,
          `        if (SkillManager.isWearing(player, ${wid})) SkillManager.cast(${id}, player, null, silent = true, free = true)`,
          `    }`,
          `}`
        );
        break;
      }
      case "SWING":
        regs.push(
          `// ${s.name}: \u5DE6\u30AF\u30EA\u30C3\u30AF\u6642`,
          `AttackBlockCallback.EVENT.register { player, world, hand, _, _ ->`,
          `    if (!world.isClient && hand == Hand.MAIN_HAND && player is ServerPlayerEntity${h("player")}) {`,
          `        SkillManager.cast(${id}, player, null, silent = true)`,
          `    }`,
          `    ActionResult.PASS`,
          `}`,
          ""
        );
        break;
      case "DEATH":
        regs.push(
          `// ${s.name}: \u6B7B\u4EA1\u6642(\u5FA9\u6D3B)`,
          `ServerLivingEntityEvents.ALLOW_DEATH.register { entity, damageSource, _ ->`,
          `    if (entity is ServerPlayerEntity${h("entity")}) {`,
          `        val castSuccess = SkillManager.cast(${id}, entity, damageSource.attacker as? LivingEntity, silent = true)`,
          `        if (castSuccess && entity.health <= 0f) {`,
          `            entity.health = 4.0f`,
          `            false`,
          `        } else true`,
          `    } else true`,
          `}`,
          ""
        );
        break;
      case "TAKE_DAMAGE":
        regs.push(
          `// ${s.name}: \u88AB\u30C0\u30E1\u30FC\u30B8\u6642`,
          `ServerLivingEntityEvents.AFTER_DAMAGE.register { entity, _, _, damageTaken, blocked ->`,
          `    if (entity is ServerPlayerEntity && damageTaken > 0.0f && !blocked${h("entity")}) {`,
          `        SkillManager.cast(${id}, entity, null, silent = true)`,
          `    }`,
          `}`,
          ""
        );
        break;
      case "PLAYER_JOIN":
        regs.push(
          `// ${s.name}: \u53C2\u52A0\u6642`,
          `ServerPlayConnectionEvents.JOIN.register { handler, _, _ ->`,
          `    SkillManager.cast(${id}, handler.player, null, silent = true)`,
          `}`,
          ""
        );
        break;
      case "PERIODIC": {
        const ticks = Math.max(1, Math.round(num(s.trigger.intervalSec, 10) * 20));
        periodic.push(
          `if (server.ticks % ${ticks} == 0) {`,
          `    for (player in server.playerManager.playerList) {`,
          `        if (true${h("player")}) SkillManager.cast(${id}, player, null, silent = true)`,
          `    }`,
          `}`
        );
        break;
      }
    }
  }
  if (project.items.some((x) => x.leftClickSkillId)) {
    regs.push(
      `// \u30A2\u30A4\u30C6\u30E0\u5DE6\u30AF\u30EA\u30C3\u30AF (\u30D6\u30ED\u30C3\u30AF/\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3\u3092\u6BB4\u308B) \u3067\u30B9\u30AD\u30EB\u767A\u52D5`,
      `AttackBlockCallback.EVENT.register { player, world, hand, _, _ ->`,
      `    if (!world.isClient && hand == Hand.MAIN_HAND && player is ServerPlayerEntity) {`,
      `        val skillId = ModItems.LEFT_CLICK_SKILLS[player.mainHandStack.item]`,
      `        if (skillId != null) SkillManager.cast(skillId, player, null, silent = true)`,
      `    }`,
      `    ActionResult.PASS`,
      `}`,
      ``,
      `AttackEntityCallback.EVENT.register { player, world, hand, entity, _ ->`,
      `    if (!world.isClient && hand == Hand.MAIN_HAND && player is ServerPlayerEntity) {`,
      `        val skillId = ModItems.LEFT_CLICK_SKILLS[player.mainHandStack.item]`,
      `        if (skillId != null) SkillManager.cast(skillId, player, entity as? LivingEntity, silent = true)`,
      `    }`,
      `    ActionResult.PASS`,
      `}`,
      ``
    );
  }
  const skillBlocks = project.blocks.some((b) => b.skillId);
  const blockUse = skillBlocks ? [
    `// \u30D6\u30ED\u30C3\u30AF\u53F3\u30AF\u30EA\u30C3\u30AF\u3067\u30B9\u30AD\u30EB\u767A\u52D5`,
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
    ``
  ] : [];
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
                            c.source.sendFeedback({ Text.literal(ModConfig.slots.mapIndexed { i, s -> (i + 1).toString() + ". " + s.ifBlank { "(\u7A7A)" } }.joinToString("  ")) }, false)
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
function itemSettings(it, mat) {
  const parts = ["Item.Settings()"];
  const tool = ["sword", "pickaxe", "axe", "shovel"].includes(it.kind);
  const hasAttrs = Number(it.bonusMaxHealth) > 0 || Number(it.bonusMovementSpeed) > 0 || Number(it.bonusArmor) > 0 || Number(it.bonusToughness) > 0 || Number(it.bonusKnockbackResistance) > 0;
  if (DIALECT === "mojmap") {
    if (tool || it.kind === "armor" || hasAttrs) {
      parts.push(`.attributes(run {
`);
      parts.push(`            val b = ItemAttributeModifiers.builder()
`);
      const slotGroup = it.kind === "armor" ? { HELMET: "HEAD", CHESTPLATE: "CHEST", LEGGINGS: "LEGS", BOOTS: "FEET" }[it.armorSlot] ?? "CHEST" : "MAINHAND";
      if (tool) {
        const cls = clsOf(it);
        const dmg = it.kind === "sword" ? i(it.attackDamage) : f(it.attackDamage);
        parts.push(`            // \u30C4\u30FC\u30EB\u30FB\u6B66\u5668\u306E\u57FA\u790E\u653B\u6483\u529B\u3068\u653B\u6483\u901F\u5EA6
`);
        if (it.kind === "sword") {
          parts.push(`            b.add(Attributes.ATTACK_DAMAGE, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "base_attack_damage"), ${it.attackDamage + 3}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.MAINHAND)
`);
          parts.push(`            b.add(Attributes.ATTACK_SPEED, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "base_attack_speed"), ${it.attackSpeed}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.MAINHAND)
`);
        } else {
          parts.push(`            b.add(Attributes.ATTACK_DAMAGE, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "base_attack_damage"), ${it.attackDamage + 1}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.MAINHAND)
`);
          parts.push(`            b.add(Attributes.ATTACK_SPEED, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "base_attack_speed"), ${it.attackSpeed}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.MAINHAND)
`);
        }
      }
      if (it.kind === "armor") {
        const baseDef = { HELMET: 3, CHESTPLATE: 8, LEGGINGS: 6, BOOTS: 3 }[it.armorSlot] ?? 3;
        const baseTough = { DIAMOND: 2, NETHERITE: 3 }[it.armorMaterial] ?? 0;
        const baseKb = it.armorMaterial === "NETHERITE" ? 0.1 : 0;
        parts.push(`            // \u9632\u5177\u306E\u57FA\u790E\u9632\u5FA1\u529B\u3001\u30BF\u30D5\u30CD\u30B9\u3001\u30CE\u30C3\u30AF\u30D0\u30C3\u30AF\u8010\u6027
`);
        parts.push(`            b.add(Attributes.ARMOR, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "base_armor"), ${baseDef}.0, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})
`);
        if (baseTough > 0) parts.push(`            b.add(Attributes.ARMOR_TOUGHNESS, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "base_toughness"), ${baseTough}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})
`);
        if (baseKb > 0) parts.push(`            b.add(Attributes.KNOCKBACK_RESISTANCE, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "base_kb"), ${baseKb}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})
`);
      }
      if (Number(it.bonusMaxHealth) > 0) {
        parts.push(`            b.add(Attributes.MAX_HEALTH, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "bonus_max_health"), ${d(it.bonusMaxHealth || 0)}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})
`);
      }
      if (Number(it.bonusMovementSpeed) > 0) {
        parts.push(`            b.add(Attributes.MOVEMENT_SPEED, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "bonus_speed"), ${d(it.bonusMovementSpeed || 0)}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})
`);
      }
      if (Number(it.bonusArmor) > 0) {
        parts.push(`            b.add(Attributes.ARMOR, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "bonus_armor"), ${d(it.bonusArmor || 0)}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})
`);
      }
      if (Number(it.bonusToughness) > 0) {
        parts.push(`            b.add(Attributes.ARMOR_TOUGHNESS, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "bonus_toughness"), ${d(it.bonusToughness || 0)}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})
`);
      }
      if (Number(it.bonusKnockbackResistance) > 0) {
        parts.push(`            b.add(Attributes.KNOCKBACK_RESISTANCE, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "bonus_kb"), ${d(it.bonusKnockbackResistance || 0)}, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.${slotGroup})
`);
      }
      parts.push(`            b.build()
`);
      parts.push(`        })`);
    }
    if (it.kind === "armor" || it.durability > 0 && it.kind === "simple") parts.push(`.maxDamage(${i(it.durability || 100)})`);
    else if (!tool && it.maxCount !== 64) parts.push(`.stacksTo(${i(it.maxCount)})`);
  } else {
    if (tool) {
      const base = mat ? it.attackDamage * mat.dmg : it.attackDamage;
      const dmg = it.kind === "sword" ? i(base) : f(base);
      parts.push(`.attributeModifiers(${clsOf(it)}.createAttributeModifiers(ToolMaterials.${it.material}, ${dmg}, ${f(it.attackSpeed)}))`);
      if (mat) parts.push(`.maxDamage(${i(mat.dur)})`);
    } else if (it.kind === "armor") parts.push(`.maxDamage(${i(mat ? mat.dur : armorDurability(it))})`);
    else if (it.durability > 0 && it.kind === "simple") parts.push(`.maxDamage(${i(it.durability)})`);
    else if (it.maxCount !== 64) parts.push(`.maxCount(${i(it.maxCount)})`);
  }
  if (it.rarity !== "COMMON") parts.push(`.rarity(Rarity.${it.rarity})`);
  if (it.fireproof) parts.push(DIALECT === "mojmap" ? ".fireResistant()" : ".fireproof()");
  if (it.glint) parts.push(DIALECT === "mojmap" ? ".component(DataComponents.ENCHANTMENT_GLINT_OVERRIDE, true)" : ".component(DataComponentTypes.ENCHANTMENT_GLINT_OVERRIDE, true)");
  if (it.food) parts.push(DIALECT === "mojmap" ? `.food(FoodProperties.Builder().nutrition(${i(it.food.nutrition)}).saturationModifier(${f(it.food.saturation)}).build())` : `.food(FoodComponent.Builder().nutrition(${i(it.food.nutrition)}).saturationModifier(${f(it.food.saturation)}).build())`);
  return parts.join("");
}
function modItemKt(project) {
  if (DIALECT === "mojmap") return buildKotlin(project, project.meta.packageName, mojModItemBody(), { raw: true });
  const body = `/** \u30B9\u30AD\u30EB\u3068\u30C4\u30FC\u30EB\u30C1\u30C3\u30D7\u3092\u6301\u3066\u308B\u6C4E\u7528\u30A2\u30A4\u30C6\u30E0 */
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
function itemsKt(project) {
  if (DIALECT === "mojmap") return buildKotlin(project, project.meta.packageName, mojItemsBody(project, MOJ()), { raw: true });
  const lines = project.items.map((it) => {
    const mat = materialOf(project, it);
    const tip = it.tooltip.split("\n").map((x) => x.trim()).filter(Boolean);
    const custom = it.skillId || it.shiftSkillId || it.leftClickSkillId || tip.length > 0;
    const tail = `${it.skillId ? q(it.skillId) : "null"}, ${it.shiftSkillId ? q(it.shiftSkillId) : "null"}, ${it.leftClickSkillId ? q(it.leftClickSkillId) : "null"}${tip.length ? `, listOf(${tip.map(q).join(", ")})` : ""}`;
    const set = itemSettings(it, mat ? { dmg: mat.damageMultiplier, dur: scaledDurability(it, mat, armorDurability(it)) } : void 0);
    let ctor;
    switch (it.kind) {
      case "sword":
        ctor = `SwordItem(ToolMaterials.${it.material}, ${set})`;
        break;
      case "pickaxe":
        ctor = `PickaxeItem(ToolMaterials.${it.material}, ${set})`;
        break;
      case "axe":
        ctor = `AxeItem(ToolMaterials.${it.material}, ${set})`;
        break;
      case "shovel":
        ctor = `ShovelItem(ToolMaterials.${it.material}, ${set})`;
        break;
      case "armor":
        ctor = `ArmorItem(ArmorMaterials.${it.armorMaterial}, ArmorItem.Type.${it.armorSlot}, ${set})`;
        break;
      default:
        ctor = custom ? `ModItem(${set}, ${tail})` : `Item(${set})`;
    }
    return `val ${constName(it.id)}: Item = register(${q(it.id)}, ${ctor})`;
  });
  const leftClick = project.items.filter((x) => x.leftClickSkillId).map((x) => `${constName(x.id)} to ${q(x.leftClickSkillId)}`);
  const body = `object ModItems {
${ind(lines, 4).join("\n")}

    /** \u5DE6\u30AF\u30EA\u30C3\u30AF (\u6BB4\u308A) \u3067\u767A\u52D5\u3059\u308B\u30B9\u30AD\u30EB */
    val LEFT_CLICK_SKILLS: Map<Item, String> = ${leftClick.length ? `mapOf(${leftClick.join(", ")})` : "emptyMap()"}

    private fun <T : Item> register(id: String, item: T): T =
        Registry.register(Registries.ITEM, Identifier.of(ModInfo.MOD_ID, id), item)

    fun register() {
        ModInfo.LOGGER.info("Registered ${project.items.length} items")
    }
}`;
  return buildKotlin(project, project.meta.packageName, body);
}
function blocksKt(project) {
  if (DIALECT === "mojmap") return buildKotlin(project, project.meta.packageName, mojBlocksBody(project, MOJ()), { raw: true });
  const lines = project.blocks.map((b) => {
    let s = `AbstractBlock.Settings.create().strength(${f(b.hardness)}, ${f(b.resistance)}).sounds(BlockSoundGroup.${constName(b.sound)})`;
    if (b.luminance > 0) s += `.luminance { _ -> ${i(b.luminance)} }`;
    if (b.requiresTool) s += ".requiresTool()";
    const xp = b.ore && b.ore.xpMax > 0 ? `ExperienceDroppingBlock(UniformIntProvider.create(${i(b.ore.xpMin)}, ${i(Math.max(b.ore.xpMin, b.ore.xpMax))}), ${s})` : `Block(${s})`;
    return `val ${constName(b.id)}: Block = registerBlock(${q(b.id)}, ${xp}, ${b.skillId ? q(b.skillId) : "null"}, ${b.shiftSkillId ? q(b.shiftSkillId) : "null"})`;
  });
  const body = `object ModBlocks {
    /** \u53F3\u30AF\u30EA\u30C3\u30AF\u3067\u30B9\u30AD\u30EB\u304C\u767A\u52D5\u3059\u308B\u30D6\u30ED\u30C3\u30AF */
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
function groupKt(project) {
  if (DIALECT === "mojmap") return buildKotlin(project, project.meta.packageName, mojGroupBody(project, MOJ()), { raw: true });
  const icon = project.items[0] ? `ModItems.${constName(project.items[0].id)}` : project.blocks[0] ? `ModBlocks.${constName(project.blocks[0].id)}` : "Items.STICK";
  const entries = [
    ...project.items.map((x) => `entries.add(ModItems.${constName(x.id)})`),
    ...project.blocks.map((x) => `entries.add(ModBlocks.${constName(x.id)})`)
  ];
  const body = `object ModItemGroup {
    val MAIN: ItemGroup = Registry.register(
        Registries.ITEM_GROUP,
        Identifier.of(ModInfo.MOD_ID, "main"),
        FabricItemGroup.builder()
            .icon { ItemStack(${icon}) }
            .displayName(Text.translatable("itemGroup." + ModInfo.MOD_ID + ".main"))
            .entries { _, entries ->
${ind(entries.length ? entries : ["// (\u30A8\u30F3\u30C8\u30EA\u306A\u3057)"], 16).join("\n")}
            }
            .build(),
    )

    fun register() {
        ModInfo.LOGGER.info("Registered creative tab")
    }
}`;
  return buildKotlin(project, project.meta.packageName, body);
}
function configKt(project) {
  const c = project.config;
  const keys = c.slotKeys.length ? c.slotKeys.map(Number) : [82, 71, 72, 86];
  const slots = (c.slots.length ? c.slots : ["", "", "", ""]).slice(0, 4);
  while (slots.length < 4) slots.push("");
  const body = `/** config/${project.meta.modId}.json \u306B\u4FDD\u5B58\u3055\u308C\u308B\u8A2D\u5B9A */
object ModConfig {
    var maxMana: Int = ${Math.round(num(c.maxMana, 100))}
    var regenPerSecond: Int = ${Math.round(num(c.regenPerSecond, 2))}
    var hud: Boolean = ${c.hud ? "true" : "false"}
    /** \u30AD\u30FC\u30B9\u30ED\u30C3\u30C81\u301C4\u306B\u5272\u308A\u5F53\u3066\u308B\u30B9\u30AD\u30EBID */
    var slots: List<String> = listOf(${slots.map((x) => q(x)).join(", ")})
    /** GLFW\u30AD\u30FC\u30B3\u30FC\u30C9 (\u65E2\u5B9A: R / G / H / V) */
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
function networkingKt(project) {
  if (DIALECT === "mojmap") return buildKotlin(project, `${project.meta.packageName}.net`, mojNetworkBody(), { raw: true });
  const pkg = `${project.meta.packageName}.net`;
  const body = `/** \u30B5\u30FC\u30D0\u30FC -> \u30AF\u30E9\u30A4\u30A2\u30F3\u30C8: \u30DE\u30CA\u306E\u540C\u671F */
class ManaSyncPayload(val mana: Float, val max: Float) : CustomPayload {
    companion object {
        val ID = CustomPayload.Id<ManaSyncPayload>(Identifier.of(ModInfo.MOD_ID, "mana_sync"))
        val CODEC = PacketCodec.tuple(PacketCodecs.FLOAT, ManaSyncPayload::mana, PacketCodecs.FLOAT, ManaSyncPayload::max, ::ManaSyncPayload)
    }

    override fun getId(): CustomPayload.Id<*> = ID
}

/** \u30AF\u30E9\u30A4\u30A2\u30F3\u30C8 -> \u30B5\u30FC\u30D0\u30FC: \u30AD\u30FC\u30D0\u30A4\u30F3\u30C9\u306B\u3088\u308B\u30B9\u30AD\u30EB\u767A\u52D5 */
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
function clientKt(project) {
  if (DIALECT === "mojmap") return buildKotlin(project, `${project.meta.packageName}.client`, mojClientBody(project), { raw: true });
  const pkg = `${project.meta.packageName}.client`;
  const names = ["R", "G", "H", "V"];
  const keyLabel = names.join("/");
  const body = `/** \u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u5074: \u30AD\u30FC\u30D0\u30A4\u30F3\u30C9\u3068\u30DE\u30CAHUD */
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

/** \u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u5074\u306E\u30DE\u30CA\u8868\u793A\u72B6\u614B (\u30B5\u30FC\u30D0\u30FC\u304B\u3089\u306E\u30D1\u30B1\u30C3\u30C8\u3067\u66F4\u65B0) */
object HudState {
    var mana: Float = 100f
    var maxMana: Float = 100f
}`;
  return buildKotlin(project, pkg, body);
}
function worldGenKt(project) {
  const ores = project.blocks.filter((b) => b.ore);
  const surfaces = project.blocks.filter((b) => b.surface);
  const sel = { OVERWORLD: "foundInOverworld", NETHER: "foundInTheNether", END: "foundInTheEnd" };
  const tag = (t) => t && t.trim() ? `.and(BiomeSelectors.tag(TagKey.of(RegistryKeys.BIOME, Identifier.of(${q(t.trim())}))))` : "";
  const feature = (id) => `RegistryKey.of(RegistryKeys.PLACED_FEATURE, Identifier.of(ModInfo.MOD_ID, ${q(id)}))`;
  const lines = [
    ...ores.map((b) => `BiomeModifications.addFeature(BiomeSelectors.${sel[b.ore.dimension] ?? "foundInOverworld"}()${tag(b.ore.biomeTag)}, GenerationStep.Feature.UNDERGROUND_ORES, ${feature("ore_" + b.id)})`),
    ...surfaces.map((b) => `BiomeModifications.addFeature(BiomeSelectors.foundInOverworld()${tag(b.surface.biomeTag)}, GenerationStep.Feature.VEGETAL_DECORATION, ${feature("surface_" + b.id)})`)
  ];
  const body = `/** \u9271\u77F3\u30FB\u5730\u8868\u30AF\u30E9\u30B9\u30BF\u30FC\u306E\u30EF\u30FC\u30EB\u30C9\u751F\u6210 (\u65B0\u3057\u304F\u751F\u6210\u3055\u308C\u308B\u30C1\u30E3\u30F3\u30AF\u306E\u307F) */
object ModWorldGen {
    fun register() {
${ind(lines.length ? lines : ["// (\u751F\u6210\u8A2D\u5B9A\u306A\u3057)"], 8).join("\n")}
        ModInfo.LOGGER.info("Registered ${ores.length} ore generators, ${surfaces.length} surface generators")
    }
}`;
  return buildKotlin(project, project.meta.packageName, body);
}
function mainKt(project) {
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
function recipeJson(project, r) {
  const cells = r.grid.map((x) => x.trim());
  const ing = (raw) => {
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
  const usedRows = rows.map((row, y) => row.some(Boolean) ? y : -1).filter((y) => y >= 0);
  const usedCols = [0, 1, 2].filter((x) => rows.some((row) => row[x]));
  const keys = /* @__PURE__ */ new Map();
  const letters = "ABCDEFGHI";
  const pattern = usedRows.map(
    (y) => usedCols.map((x) => {
      const c = rows[y][x];
      if (!c) return " ";
      const id = c;
      if (!keys.has(id)) keys.set(id, letters[keys.size]);
      return keys.get(id);
    }).join("")
  );
  const key = {};
  keys.forEach((letter, id) => key[letter] = ing(id));
  return { type: "minecraft:crafting_shaped", category: "misc", pattern, key, result };
}
function lootTable(project, b) {
  const self = `${project.meta.modId}:${b.id}`;
  const o = b.ore;
  if (!o || !o.dropItem.trim() || ns(project, o.dropItem) === self) {
    return { type: "minecraft:block", pools: [{ rolls: 1, bonus_rolls: 0, entries: [{ type: "minecraft:item", name: self }], conditions: [{ condition: "minecraft:survives_explosion" }] }] };
  }
  const lo = Math.max(0, Math.round(o.dropMin));
  const hi = Math.max(lo, Math.round(o.dropMax));
  const functions = [
    lo === hi ? { function: "minecraft:set_count", count: lo } : { function: "minecraft:set_count", count: { type: "minecraft:uniform", min: lo, max: hi } }
  ];
  if (o.fortune) functions.push({ function: "minecraft:apply_bonus", enchantment: "minecraft:fortune", formula: "minecraft:ore_drops" });
  if (o.explosionDecay) functions.push({ function: "minecraft:explosion_decay" });
  const drop = { type: "minecraft:item", name: ns(project, o.dropItem), functions };
  const silk = {
    type: "minecraft:item",
    name: self,
    conditions: [{ condition: "minecraft:match_tool", predicate: { predicates: { "minecraft:enchantments": [{ enchantments: "minecraft:silk_touch", levels: { min: 1 } }] } } }]
  };
  return {
    type: "minecraft:block",
    pools: [{ rolls: 1, bonus_rolls: 0, entries: [o.silkTouch ? { type: "minecraft:alternatives", children: [silk, drop] } : drop] }]
  };
}
function mobsKt(project) {
  const mobs = project.mobs ?? [];
  const tables = project.drops ?? [];
  const entry = (itemId, lo, hi, chance) => `DropEntry(${q(ns(project, String(itemId)))}, ${i(num(lo, 1))}, ${i(Math.max(num(hi, 1), num(lo, 1)))}, ${d(Math.min(1, Math.max(0, num(chance, 1))))})`;
  const defines = mobs.map((mob) => `define(MobSpec(${q(mob.id)}, EntityType.${constName(mob.baseMob || "ZOMBIE")}, ${q(mob.name || mob.id)}, ${d(num(mob.maxHealth, 20))}, ${d(num(mob.movementSpeed, 0.3))}, ${d(num(mob.attackDamage, 3))}, listOf(${(mob.drops ?? []).map((x) => entry(x.item, x.countMin, x.countMax, x.chance)).join(", ")})))`);
  const adds = tables.map((t) => {
    const target = t.targetMob === "ANY" ? "ANY" : t.targetMob.includes(":") ? t.targetMob : `minecraft:${t.targetMob}`;
    return `dropTables.add(DropTable(${q(target)}, listOf(${(t.items ?? []).map((x) => entry(x.id, x.min, x.max, x.chance)).join(", ")})))`;
  });
  const body = `/** \u30AB\u30B9\u30BF\u30E0\u30E2\u30D6 (\u30D9\u30FC\u30B9Mob + \u540D\u524D/\u80FD\u529B\u5024/\u5C02\u7528\u30C9\u30ED\u30C3\u30D7) \u3068\u3001Mob\u5225\u30C9\u30ED\u30C3\u30D7\u8868 (\u30CF\u30AF\u30B9\u30E9\u7528) */
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

    /** \u30AB\u30B9\u30BF\u30E0\u30E2\u30D6\u3092\u5EA7\u6A19\u306B\u53EC\u559A\u3059\u308B (\u540D\u524D\u30FB\u80FD\u529B\u5024\u30FB\u30C9\u30ED\u30C3\u30D7\u30BF\u30B0\u3092\u9069\u7528) */
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
${ind(defines.length ? defines : ["// (\u30AB\u30B9\u30BF\u30E0\u30E2\u30D6\u306A\u3057)"], 8).join("\n")}
${ind(adds.length ? adds : ["// (\u30C9\u30ED\u30C3\u30D7\u8868\u306A\u3057)"], 8).join("\n")}
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
function advancementJsons(project) {
  const mod = project.meta.modId;
  const list = project.advancements ?? [];
  if (list.length === 0) return [];
  const out = [];
  out.push({
    id: "root",
    json: {
      display: {
        icon: { count: 1, id: ns(project, list[0].icon || "minecraft:nether_star") },
        title: { text: project.meta.name },
        description: { text: `${project.meta.name} \u306E\u5B9F\u7E3E` },
        background: "minecraft:gui/advancements/backgrounds/stone",
        show_toast: false,
        announce_to_chat: false
      },
      criteria: { auto: { trigger: "minecraft:tick" } },
      requirements: [["auto"]]
    }
  });
  for (const a of list) {
    const parent = a.parent ? list.some((x) => x.id === a.parent) ? `${mod}:${a.parent}` : a.parent : `${mod}:root`;
    let criteria;
    let requirements;
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
          title: { text: a.name },
          description: { text: a.description },
          frame: a.frame,
          show_toast: true,
          announce_to_chat: true,
          hidden: a.hidden
        },
        criteria,
        requirements,
        ...a.rewardXp > 0 ? { rewards: { experience: Math.round(a.rewardXp) } } : {}
      }
    });
  }
  return out;
}
function generateProject(project) {
  const { meta } = project;
  const env = resolveEnv(meta);
  const moj = env.mappings === "mojmap";
  const FABRIC = env;
  DIALECT = moj ? "mojmap" : "yarn";
  setRegistryMode(DIALECT);
  const pkgPath = meta.packageName.replace(/\./g, "/");
  const files = [];
  const kt = (path, content) => files.push({ path: `src/main/kotlin/${pkgPath}/${path}`, content, kind: "kotlin" });
  const res = (path, content, kind = "json") => files.push({ path: `src/main/resources/${path}`, content, kind });
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
  const exH = { q, d, f, i, ind, ns: (id) => ns(project, id) };
  kt("ModItemAttributes.kt", moj ? buildKotlin(project, meta.packageName, itemAttributesMojBody(project, exH), { raw: true }) : buildKotlin(project, meta.packageName, itemAttributesYarnStub()));
  kt("ModExtras.kt", moj ? buildKotlin(project, meta.packageName, extrasMojBody(project, exH), { raw: true }) : buildKotlin(project, meta.packageName, extrasYarnStub()));
  res("fabric.mod.json", js({
    schemaVersion: 1,
    id: meta.modId,
    version: meta.version,
    name: meta.name,
    description: meta.description,
    authors: [meta.author],
    license: meta.license,
    environment: "*",
    icon: `assets/${meta.modId}/icon.png`,
    entrypoints: { main: [{ adapter: "kotlin", value: `${meta.packageName}.ModMain` }] },
    depends: { fabricloader: `>=${FABRIC.loader}`, minecraft: `~${FABRIC.minecraft}`, java: `>=${FABRIC.java}`, "fabric-api": "*", "fabric-language-kotlin": "*" }
  }));
  const lang = { [`itemGroup.${meta.modId}.main`]: meta.name };
  project.items.forEach((x) => lang[`item.${meta.modId}.${x.id}`] = x.name);
  project.blocks.forEach((x) => lang[`block.${meta.modId}.${x.id}`] = x.name);
  const langJa = { [`itemGroup.${meta.modId}.main`]: meta.name };
  project.items.forEach((x) => langJa[`item.${meta.modId}.${x.id}`] = x.name);
  project.blocks.forEach((x) => langJa[`block.${meta.modId}.${x.id}`] = x.name);
  if (moj) project.effects.forEach((e) => {
    lang[`effect.${meta.modId}.${e.id}`] = e.name;
    langJa[`effect.${meta.modId}.${e.id}`] = e.name;
  });
  const catKey = moj ? `key.category.${meta.modId}.main` : `key.category.${meta.modId}`;
  const keyCat = { [catKey]: "\u30B9\u30AD\u30EB" };
  const keyNames = ["R", "G", "H", "V"];
  keyNames.forEach((_n, i3) => keyCat[`key.${meta.modId}.slot${i3 + 1}`] = `\u30B9\u30AD\u30EB\u30B9\u30ED\u30C3\u30C8${i3 + 1}`);
  res(`assets/${meta.modId}/lang/en_us.json`, js({ ...lang, ...keyCat }));
  res(`assets/${meta.modId}/lang/ja_jp.json`, js({ ...langJa, [catKey]: "\u30B9\u30AD\u30EB", ...Object.fromEntries(keyNames.map((_, i3) => [`key.${meta.modId}.slot${i3 + 1}`, `\u30B9\u30AD\u30EB\u30B9\u30ED\u30C3\u30C8${i3 + 1}`])) }));
  const bin = (path, b64) => files.push({ path, content: b64, kind: "binary", encoding: "base64" });
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
  const tags = {};
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
      const targets = o.dimension === "NETHER" ? [{ state, target: { predicate_type: "minecraft:tag_match", tag: "minecraft:base_stone_nether" } }] : o.dimension === "END" ? [{ state, target: { predicate_type: "minecraft:block_match", block: "minecraft:end_stone" } }] : [
        { state, target: { predicate_type: "minecraft:tag_match", tag: "minecraft:stone_ore_replaceables" } },
        { state, target: { predicate_type: "minecraft:tag_match", tag: "minecraft:deepslate_ore_replaceables" } }
      ];
      res(`data/${meta.modId}/worldgen/configured_feature/ore_${b.id}.json`, js({
        type: "minecraft:ore",
        config: { discard_chance_on_air_exposure: 0, size: Math.max(1, Math.round(o.veinSize)), targets }
      }));
      res(`data/${meta.modId}/worldgen/placed_feature/ore_${b.id}.json`, js({
        feature: fid,
        placement: [
          { type: "minecraft:count", count: Math.max(1, Math.round(o.veinsPerChunk)) },
          { type: "minecraft:in_square" },
          { type: "minecraft:height_range", height: { type: "minecraft:uniform", min_inclusive: { absolute: Math.round(o.minY) }, max_inclusive: { absolute: Math.round(Math.max(o.minY, o.maxY)) } } },
          { type: "minecraft:biome" }
        ]
      }));
    }
    if (b.tool !== "none") (tags[`mineable/${b.tool}`] ??= []).push(`${meta.modId}:${b.id}`);
    if (b.toolTier !== "none") (tags[`needs_${b.toolTier}_tool`] ??= []).push(`${meta.modId}:${b.id}`);
  }
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
            predicate: { type: "minecraft:all_of", predicates: [{ type: "minecraft:matching_blocks", blocks: "minecraft:air" }, { type: "minecraft:solid", offset: [0, -1, 0] }] }
          }]
        },
        tries: Math.max(1, Math.round(sf.tries)),
        xz_spread: Math.max(1, Math.round(sf.spread)),
        y_spread: 3
      }
    }));
    res(`data/${meta.modId}/worldgen/placed_feature/surface_${b.id}.json`, js({
      feature: `${meta.modId}:surface_${b.id}`,
      placement: [
        { type: "minecraft:rarity_filter", chance: Math.max(1, Math.round(sf.rarity)) },
        { type: "minecraft:in_square" },
        { type: "minecraft:heightmap", heightmap: "MOTION_BLOCKING" },
        { type: "minecraft:biome" }
      ]
    }));
  }
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
          has_the_recipe: { trigger: "minecraft:recipe_unlocked", conditions: { recipe: `${meta.modId}:${r.id}` } }
        },
        requirements: [["has_material", "has_the_recipe"]],
        rewards: { recipes: [`${meta.modId}:${r.id}`] }
      }));
    }
  }
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
  const list = (arr) => arr.length ? arr.map((x) => `- ${x}`).join("\n") : "- (\u306A\u3057)";
  files.push({ path: "README.md", kind: "text", content: `# ${meta.name}

MythicForge \u304C\u751F\u6210\u3057\u305F Minecraft ${FABRIC.minecraft} Fabric Mod (Kotlin) \u3067\u3059\u3002

## \u30D3\u30EB\u30C9\u74B0\u5883 (\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB: ${FABRIC.profile})
| \u9805\u76EE | \u5024 |
|---|---|
| Minecraft | ${FABRIC.minecraft} |
| \u30DE\u30C3\u30D4\u30F3\u30B0 | ${FABRIC.mappings === "mojmap" ? "Mojang \u516C\u5F0F (loom.officialMojangMappings)" : `Yarn ${FABRIC.yarn}`} |
| Fabric Loom | ${FABRIC.loom} (\u30D7\u30E9\u30B0\u30A4\u30F3ID: \`${FABRIC.loomPlugin}\`) |
| Gradle Wrapper | ${FABRIC.gradle} |
| Fabric Loader / API | ${FABRIC.loader} / ${FABRIC.fabricApi} |
| Kotlin / FLK | ${FABRIC.kotlin} / ${FABRIC.kotlinLoader} |
| Java | ${FABRIC.java} |

${FABRIC.mappings === "mojmap" ? "> \u30AB\u30B9\u30BF\u30E0Kotlin\u306F **Mojang \u540D** (\u4F8B: `ServerPlayer`, `Level`, `Identifier.fromNamespaceAndPath`) \u3067\u66F8\u3044\u3066\u304F\u3060\u3055\u3044\u3002Yarn \u540D (`ServerPlayerEntity` \u306A\u3069) \u3068\u6DF7\u305C\u308B\u3068\u30B3\u30F3\u30D1\u30A4\u30EB\u3067\u304D\u307E\u305B\u3093\u3002\n" : ""}
## \u3053\u306E Mod \u306B\u542B\u307E\u308C\u308B\u3082\u306E
**\u30B9\u30AD\u30EB (${project.skills.length})**
${list(project.skills.map((x) => `\`${x.id}\` ${x.name} \u2014 ${x.trigger.type === "MANUAL" ? "\u624B\u52D5" : x.trigger.type} / CD ${x.cooldown}s / MP ${x.manaCost}`))}

**\u30A2\u30A4\u30C6\u30E0 (${project.items.length})** \u2014 \u3046\u3061\u9632\u5177 ${armors.length}
${list(project.items.map((x) => `\`${meta.modId}:${x.id}\` ${x.name} (${x.kind})`))}

**\u30D6\u30ED\u30C3\u30AF (${project.blocks.length})** \u2014 \u3046\u3061\u9271\u77F3 ${ores.length}
${list(project.blocks.map((x) => `\`${meta.modId}:${x.id}\` ${x.name}${x.ore ? ` \u2014 \u9271\u77F3 (${x.ore.dimension}, Y ${x.ore.minY}\u301C${x.ore.maxY}, ${x.ore.veinsPerChunk}\u8108/\u30C1\u30E3\u30F3\u30AF, \u8108\u30B5\u30A4\u30BA${x.ore.veinSize})` : ""}`))}

**\u30EC\u30B7\u30D4 (${project.recipes.length})**
${list(project.recipes.map((x) => `\`${x.id}\` \u2192 ${x.resultItem} x${x.resultCount}`))}

## \u4E3B\u306A\u6A5F\u80FD
- **\u30B9\u30AD\u30EB\u767A\u52D5**: \u30A2\u30A4\u30C6\u30E0/\u30D6\u30ED\u30C3\u30AF\u306E\u53F3\u30AF\u30EA\u30C3\u30AF\u3001\u30AD\u30FC\u30B9\u30ED\u30C3\u30C8(\u65E2\u5B9A R/G/H/V)\u3001\`/skill cast <id>\`
- **\u30DF\u30B5\u30A4\u30EB**: \u6BCEtick\u98DB\u7FD4\u3059\u308B\u5F3E\u3002\u7740\u5F3E\u70B9\u3092 origin \u3068\u3057\u3066\u30B9\u30AD\u30EB\u3092\u767A\u52D5
- **\u5909\u6570**: \`setVar/addVar/ifVar\`\u3001\u6761\u4EF6 \`VARIABLE\`\u3001\u30C6\u30AD\u30B9\u30C8\u5185 \`<var.x> <target.x> <global.x> <player> <mana> <health>\`\u3002\u30EF\u30FC\u30EB\u30C9\u306E \`mythicforge_vars.json\` \u306B\u4FDD\u5B58
- **\u30DE\u30CA**: HUD\u8868\u793A + \u30D1\u30B1\u30C3\u30C8\u540C\u671F + \u30EF\u30FC\u30EB\u30C9\u306B\u4FDD\u5B58
- **\u9632\u5177**: \u7D20\u6750(LEATHER\u301CNETHERITE/TURTLE)\u306B\u5FDC\u3058\u305F\u9632\u5FA1\u529B\u30FB\u898B\u305F\u76EE\u3002\u88C5\u5099\u4E2D\u30C8\u30EA\u30AC\u30FC(WEAR)\u3067\u30BB\u30C3\u30C8\u52B9\u679C
- **\u9271\u77F3**: \u30C9\u30ED\u30C3\u30D7\u8A2D\u5B9A(\u5E78\u904B/\u30B7\u30EB\u30AF\u30BF\u30C3\u30C1/\u7206\u767A\u6E1B\u8870)\u3068\u30EF\u30FC\u30EB\u30C9\u751F\u6210(\u65B0\u898F\u30C1\u30E3\u30F3\u30AF\u306E\u307F)
- **\u8A2D\u5B9A**: \`config/${meta.modId}.json\`

## \u30D3\u30EB\u30C9\u65B9\u6CD5
### IntelliJ IDEA (\u63A8\u5968)
1. \u3053\u306E\u30D5\u30A9\u30EB\u30C0\u3092 **\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u3068\u3057\u3066\u958B\u304F** (build.gradle.kts \u3092\u9078\u629E \u2192 "Open as Project")
2. **JDK 21 \u3092\u7528\u610F**: File > Project Structure > SDKs \u3067\u8FFD\u52A0\u3001\u7121\u3051\u308C\u3070 "Download JDK" \u3067 Temurin 21
3. **Gradle JVM \u3092 21 \u306B**: File > Settings > Build, Execution, Deployment > Build Tools > Gradle > **Gradle JVM = 21**
4. Gradle \u30BF\u30D6\u306E \u{1F504} \u3092\u5B9F\u884C (\u521D\u56DE\u306F Minecraft \u306E\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u3068\u5909\u63DB\u3067\u6570\u5206\u304B\u304B\u308A\u307E\u3059)
5. \u5B9F\u884C\u69CB\u6210 **Minecraft Client / Minecraft Server** \u304C\u81EA\u52D5\u751F\u6210\u3055\u308C\u307E\u3059\u3002\`build\` \u30BF\u30B9\u30AF\u3067 \`build/libs/${meta.modId}-${meta.version}.jar\` \u304C\u51FA\u529B\u3055\u308C\u307E\u3059

> \u2757 \`This build uses a Java 8 JVM\` / \`Dependency requires at least JVM runtime version 21\` \u3068\u51FA\u305F\u5834\u5408\u306F\u624B\u98063\u306E Gradle JVM \u304C\u53E4\u3044 JDK \u306E\u307E\u307E\u3067\u3059\u3002

### \u30B3\u30DE\u30F3\u30C9\u30E9\u30A4\u30F3
\`\`\`
# JDK 21 \u3092 JAVA_HOME \u306B\u8A2D\u5B9A
./gradlew build          # Windows: gradlew.bat build
./gradlew runClient      # \u958B\u767A\u7528\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u8D77\u52D5
./gradlew runServer      # \u958B\u767A\u7528\u30B5\u30FC\u30D0\u30FC (\u521D\u56DE\u306F run/eula.txt \u306E eula=true \u304C\u5FC5\u8981)
\`\`\`
Gradle Wrapper (${FABRIC.gradle}) \u540C\u68B1\u306E\u305F\u3081 Gradle \u306E\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u306F\u4E0D\u8981\u3067\u3059\u3002

### GitHub Actions
push \u3059\u308B\u3060\u3051\u3067 \`.github/workflows/build.yml\` \u304C\u30D3\u30EB\u30C9\u3057\u3001Artifacts \u306B jar \u3092\u51FA\u529B\u3057\u307E\u3059\u3002

## \u5C0E\u5165
Fabric Loader ${FABRIC.loader}+ / Fabric API / Fabric Language Kotlin \u3092\u5165\u308C\u305F \`mods/\` \u306B jar \u3092\u914D\u7F6E\u3057\u3066\u304F\u3060\u3055\u3044\u3002

## \u30B2\u30FC\u30E0\u5185\u30B3\u30DE\u30F3\u30C9
\`\`\`
/skill cast <id>   # \u30B9\u30AD\u30EB\u767A\u52D5 (OP)
/skill list        # \u30B9\u30AD\u30EB\u4E00\u89A7
/skill mana        # \u30DE\u30CA\u78BA\u8A8D
/skill slots       # \u30AD\u30FC\u30B9\u30ED\u30C3\u30C8\u5272\u308A\u5F53\u3066
/shop <id>          # \u30B7\u30E7\u30C3\u30D7 (\u53D6\u5F15\u753B\u9762) \u3092\u958B\u304F  \u203B1.21.11
/sp                 # \u30B9\u30AD\u30EB\u30DD\u30A4\u30F3\u30C8\u4E00\u89A7 / /sp buy <id> \u3067\u5F37\u5316  \u203B1.21.11
/${meta.modId} spawn <mob>  # \u30AB\u30B9\u30BF\u30E0\u30E2\u30D6\u3092\u53EC\u559A
\`\`\`

## \u30C6\u30AF\u30B9\u30C1\u30E3
\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u3057\u305FPNG\u306F \`assets/${meta.modId}/textures/{item,block}/\` \u306B\u51FA\u529B\u3055\u308C\u307E\u3059\u3002\u672A\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u306E\u8981\u7D20\u306F\u30D0\u30CB\u30E9\u306E\u30C6\u30AF\u30B9\u30C1\u30E3\u3092\u53C2\u7167\u3057\u307E\u3059\u3002
` });
  return files;
}

// src/argv.ts
function cmd() {
  return process.env.MCASSET_CMD ?? "";
}
function args() {
  try {
    const parsed = JSON.parse(process.env.MCASSET_ARGS ?? "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
function arg(name, fallback) {
  const list = args();
  const i3 = list.indexOf(`--${name}`);
  if (i3 >= 0 && i3 + 1 < list.length) return list[i3 + 1];
  return fallback;
}
function fail(message) {
  console.error(message);
  process.exit(1);
}

// src/mythic.ts
var command = cmd();
if (command === "build") {
  const projPath = arg("project") ?? fail("usage: mythic:build --project file.json --out dir/");
  const out = arg("out") ?? fail("usage: mythic:build --project file.json --out dir/");
  const project = JSON.parse((0, import_node_fs.readFileSync)(projPath, "utf-8"));
  const files = generateProject(project);
  for (const file of files) {
    const target = (0, import_node_path.join)(out, file.path);
    (0, import_node_fs.mkdirSync)((0, import_node_path.dirname)(target), { recursive: true });
    (0, import_node_fs.writeFileSync)(target, file.content);
  }
  console.log(`wrote ${files.length} files to ${out}`);
} else {
  console.log(`mythic commands: build --project file.json --out dir/`);
}
