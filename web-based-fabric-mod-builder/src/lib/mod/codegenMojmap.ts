// Minecraft 1.21.11 + Mojang 公式マッピング向けの Kotlin 生成。
// 実行ロジック (SkillRuntime / Skills / Triggers / Main / WorldGen) は Yarn 版テンプレートを
// 変換表で Mojang 名へ写し、API の意味が変わる部分 (Item/Block/CreativeTab/Network/HUD) は専用テンプレートで生成します。
// すべて Minecraft 1.21.11 の実 jar (javap) で署名を確認して書いています。

import { TOOL_KINDS, materialOf, scaledDurability } from "./materials";
import type { ItemDef, MaterialDef, ModProject } from "./types";

export interface MojHelpers {
  q: (s: string) => string;
  d: (n: number) => string;
  f: (n: number) => string;
  i: (n: number) => string;
  ind: (lines: string[], n: number) => string[];
  constName: (id: string) => string;
  armorDurability: (it: ItemDef) => number;
}

// ------------------------------------------------------------------ サウンド
/** カタログのサウンドキー → レジストリID (Mojang 名の SoundEvents 定数は Yarn と異なるため ID 経由で引く) */
export const SOUND_IDS: Record<string, string> = {
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
  ITEM_FIRECHARGE_USE: "item.firecharge.use",
};

/** Yarn の BlockSoundGroup 名 → Mojang の SoundType 名 (差異のあるものだけ) */
export const BLOCK_SOUND_MAP: Record<string, string> = { AMETHYST_BLOCK: "AMETHYST" };

// ------------------------------------------------------------------ Yarn → Mojang 変換表
/** Yarn のクラス名 → Mojang のクラス名 */
export const CLASS_MAP: Record<string, string> = {
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
  FoodComponent: "FoodProperties",
};

type Rule = [RegExp | string, string];

/** 文字列(正規表現)置換。先に具体的なパターン、後で一般的なパターンを適用する */
const MEMBER_RULES: Rule[] = [
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
  [/\bowner\.z\b/g, "owner.getZ()"],  [/\bRegistryKeys\./g, "@@REGKEYS@@."],
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
  [/\.sendFeedback\(/g, ".sendSuccess("],
];

/** ブロックの効果音: BlockSoundGroup.X → SoundType.X (差異のあるものだけ補正) */
function fixBlockSounds(s: string): string {
  return s.replace(/\bBlockSoundGroup\.([A-Z0-9_]+)/g, (_m, k: string) => `SoundType.${BLOCK_SOUND_MAP[k] ?? k}`);
}

const MOJ_SOUND_FN = `    fun sound(ctx: SkillContext, id: String, volume: Float, pitch: Float) {
        val event = BuiltInRegistries.SOUND_EVENT.getValue(Identifier.parse(id)) ?: return
        ctx.world.playSound(null, BlockPos.containing(ctx.point), event, SoundSource.PLAYERS, volume, pitch)
    }`;

const CUSTOM_BLOCK = /\/\/ >>> custom:[\s\S]*?\/\/ <<< custom:\w+/g;

/** 1 つの Kotlin 本体 (import 無し) を Yarn 名から Mojang 名に写す。カスタムKotlinブロックは変更しない */
export function translateBody(body: string): string {
  const customs: string[] = [];
  let work = body.replace(CUSTOM_BLOCK, (m) => {
    customs.push(m);
    return `/*@@CUSTOM${customs.length - 1}@@*/`;
  });

  // サウンド関数 (2 オーバーロード) を ID 引きの 1 関数に差し替え
  work = work.replace(/ {4}fun sound\(ctx: SkillContext, sound: SoundEvent[\s\S]*?sound\(ctx, sound\.value\(\), volume, pitch\)\n {4}\}/, MOJ_SOUND_FN);
  // 呼び出し側: SoundEvents.KEY → "id"
  work = work.replace(/SoundEvents\.([A-Z0-9_]+)/g, (_m, k: string) => JSON.stringify(SOUND_IDS[k] ?? k.toLowerCase().replace(/_/g, ".")));

  for (const [re, rep] of MEMBER_RULES) work = work.replace(re as RegExp, rep);
  work = fixBlockSounds(work);

  // クラス名 (単語境界、先頭が '.' でないもの)
  for (const [from, to] of Object.entries(CLASS_MAP)) {
    work = work.replace(new RegExp(`(?<![.\\w@])${from}\\b`, "g"), to);
  }
  work = work.replace(/@@REGKEYS@@/g, "Registries");
  work = work.replace(/@@BOSSCOLOR@@/g, "BossEvent.BossBarColor");
  return work.replace(/\/\*@@CUSTOM(\d+)@@\*\//g, (_m, n: string) => customs[Number(n)]);
}

// ------------------------------------------------------------------ 専用テンプレート
const toolCall = (it: ItemDef, H: MojHelpers, matConst?: string) => {
  const mat = matConst ?? `ToolMaterial.${it.material}`;
  switch (it.kind) {
    case "sword": return `.sword(${mat}, ${H.f(it.attackDamage)}, ${H.f(it.attackSpeed)})`;
    case "pickaxe": return `.pickaxe(${mat}, ${H.f(it.attackDamage)}, ${H.f(it.attackSpeed)})`;
    case "axe": return `.axe(${mat}, ${H.f(it.attackDamage)}, ${H.f(it.attackSpeed)})`;
    case "shovel": return `.shovel(${mat}, ${H.f(it.attackDamage)}, ${H.f(it.attackSpeed)})`;
    default: return "";
  }
};

/** Item.Properties の設定チェーン (先頭の `p` を除く) */
export function mojItemProps(it: ItemDef, H: MojHelpers, material?: MaterialDef, matConst?: string): string {
  const parts: string[] = [];
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

export function mojModItemBody(): string {
  return `/** スキルとツールチップを持てる汎用アイテム (道具・防具にも使えます) */
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

export function mojItemsBody(project: ModProject, H: MojHelpers): string {
  const matConsts = new Map<string, string>();
  const lines = project.items.map((it) => {
    const material = materialOf(project, it);
    let matConst: string | undefined;
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
  const leftClick = project.items.filter((x) => x.leftClickSkillId).map((x) => `${H.constName(x.id)} to ${H.q(x.leftClickSkillId!)}`);
  return `object ModItems {
${matConsts.size ? H.ind([...matConsts.values()], 4).join("\n") + "\n\n" : ""}${H.ind(lines, 4).join("\n")}

    /** 左クリック (殴り) で発動するスキル */
    val LEFT_CLICK_SKILLS: Map<Item, String> = ${leftClick.length ? `mapOf(${leftClick.join(", ")})` : "emptyMap()"}

    /** 1.21.2 以降はアイテムのレジストリキーを Properties に設定する必要があります */
    private fun <T : Item> register(id: String, factory: (Item.Properties) -> T): T {
        val key = ResourceKey.create(Registries.ITEM, Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, id))
        return Registry.register(BuiltInRegistries.ITEM, key, factory(Item.Properties().setId(key)))
    }

    fun register() {
        ModInfo.LOGGER.info("Registered ${project.items.length} items")
    }
}`;
}

export function mojBlocksBody(project: ModProject, H: MojHelpers): string {
  const lines = project.blocks.map((b) => {
    const snd = BLOCK_SOUND_MAP[H.constName(b.sound)] ?? H.constName(b.sound);
    let s = `p.strength(${H.f(b.hardness)}, ${H.f(b.resistance)}).sound(SoundType.${snd})`;
    if (b.luminance > 0) s += `.lightLevel { _ -> ${H.i(b.luminance)} }`;
    if (b.requiresTool) s += ".requiresCorrectToolForDrops()";
    const ctor = b.ore && b.ore.xpMax > 0
      ? `DropExperienceBlock(UniformInt.of(${H.i(b.ore.xpMin)}, ${H.i(Math.max(b.ore.xpMin, b.ore.xpMax))}), ${s})`
      : `Block(${s})`;
    return `val ${H.constName(b.id)}: Block = registerBlock(${H.q(b.id)}, ${b.skillId ? H.q(b.skillId) : "null"}, ${b.shiftSkillId ? H.q(b.shiftSkillId) : "null"}) { p -> ${ctor} }`;
  });
  return `object ModBlocks {
    /** 右クリックでスキルが発動するブロック */
    val SKILL_BLOCKS = HashMap<Block, String>()
    val SHIFT_SKILL_BLOCKS = HashMap<Block, String>()

${H.ind(lines, 4).join("\n")}

    /** ブロックと BlockItem を登録 (1.21.2 以降はどちらもレジストリキーの設定が必須) */
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

export function mojGroupBody(project: ModProject, H: MojHelpers): string {
  const icon = project.items[0] ? `ModItems.${H.constName(project.items[0].id)}` : project.blocks[0] ? `ModBlocks.${H.constName(project.blocks[0].id)}` : "Items.STICK";
  const entries = [
    ...project.items.map((x) => `output.accept(ModItems.${H.constName(x.id)})`),
    ...project.blocks.map((x) => `output.accept(ModBlocks.${H.constName(x.id)})`),
  ];
  return `object ModItemGroup {
    val MAIN: CreativeModeTab = Registry.register(
        BuiltInRegistries.CREATIVE_MODE_TAB,
        Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "main"),
        FabricItemGroup.builder()
            .icon { ItemStack(${icon}) }
            .title(Component.translatable("itemGroup." + ModInfo.MOD_ID + ".main"))
            .displayItems { _, output ->
${H.ind(entries.length ? entries : ["// (エントリなし)"], 16).join("\n")}
            }
            .build(),
    )

    fun register() {
        ModInfo.LOGGER.info("Registered creative tab")
    }
}`;
}

export function mojNetworkBody(): string {
  return `/** サーバー -> クライアント: マナの同期 */
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

/** クライアント -> サーバー: キーバインドによるスキル発動 */
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

export function mojClientBody(project: ModProject): string {
  return `/** クライアント側: キーバインドとマナHUD */
class ModClient : ClientModInitializer {
    private lateinit var slotKeys: List<KeyMapping>

    override fun onInitializeClient() {
        ClientPlayNetworking.registerGlobalReceiver(ManaSyncPayload.TYPE) { payload, _ ->
            HudState.mana = payload.mana
            HudState.maxMana = payload.max
        }

        // 1.21.9 以降はキーバインドにカテゴリ (KeyMapping.Category) が必須。翻訳キー: key.category.<modid>.main
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

        // 1.21.6 以降の HUD API: ホットバーの後ろにマナバーを追加
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

/** クライアント側のマナ表示状態 (サーバーからのパケットで更新) */
object HudState {
    var mana: Float = 100f
    var maxMana: Float = 100f
}`;
}
