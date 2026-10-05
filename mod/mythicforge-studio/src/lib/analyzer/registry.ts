import { MOJ_MINECRAFT_FQNS, MOJ_PITFALLS } from "./registryMojmap";
// Minecraft 1.21.1 (Yarn mappings) / Fabric API / Kotlin 用の既知クラス一覧。
// 静的解析でのimport検証・未解決参照の検出・自動import生成に利用します。

export const KNOWN_FQNS: string[] = [
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
  "org.slf4j.LoggerFactory",
];

export const simpleName = (fqn: string) => fqn.split(".").pop() ?? fqn;

const bySimple = new Map<string, string[]>();
for (const f of KNOWN_FQNS) {
  const s = simpleName(f);
  bySimple.set(s, [...(bySimple.get(s) ?? []), f]);
}

// ---- マッピング切り替え (Yarn / Mojang) ----
export type RegistryMode = "yarn" | "mojmap";
let mode: RegistryMode = "yarn";
export const setRegistryMode = (m: RegistryMode) => { mode = m; };
export const getRegistryMode = (): RegistryMode => mode;

const YARN_SET = new Set(KNOWN_FQNS);
/** Mojang 版: Minecraft 本体以外 (Fabric API / brigadier / Gson / Java 等) は共通、本体は Mojang 名の辞書に差し替え */
export const MOJ_FQNS: string[] = [...new Set([...KNOWN_FQNS.filter((f) => !f.startsWith("net.minecraft.") && !/FabricBlockSettings|FabricItemSettings/.test(f)), ...MOJ_MINECRAFT_FQNS])];
const MOJ_SET = new Set(MOJ_FQNS);
const mojBySimple = new Map<string, string[]>();
for (const f of MOJ_FQNS) {
  const s = simpleName(f);
  mojBySimple.set(s, [...(mojBySimple.get(s) ?? []), f]);
}

export const fqnsForSimple = (name: string): string[] => (mode === "mojmap" ? mojBySimple : bySimple).get(name) ?? [];
export const isKnownFqn = (fqn: string) => (mode === "mojmap" ? MOJ_SET : YARN_SET).has(fqn);

/** クライアント専用クラス: 専用サーバーでクラッシュするため警告対象 */
export const CLIENT_ONLY_PACKAGES = ["net.minecraft.client."];

/** 明示importなしで使える Kotlin / Java の既定シンボル */
export const DEFAULT_SYMBOLS = new Set([
  "String", "Int", "Long", "Float", "Double", "Boolean", "Char", "Byte", "Short", "Unit", "Any", "Nothing",
  "Array", "IntArray", "List", "MutableList", "Set", "MutableSet", "Map", "MutableMap", "Collection", "MutableCollection",
  "Iterable", "MutableIterable", "Iterator", "Pair", "Triple", "Sequence", "Regex", "Number", "Comparable", "CharSequence",
  "Throwable", "Exception", "RuntimeException", "Error", "IllegalStateException", "IllegalArgumentException",
  "NullPointerException", "UnsupportedOperationException", "IndexOutOfBoundsException", "NumberFormatException",
  "Math", "System", "Thread", "Runnable", "StringBuilder", "Object", "Class", "Enum", "Lazy", "Result",
  "ArrayList", "HashMap", "HashSet", "LinkedHashMap", "LinkedHashSet", "IntRange", "LongRange", "Void",
  "Override", "Deprecated", "Suppress", "JvmStatic", "JvmField", "JvmOverloads", "JvmName", "Volatile", "Synchronized",
  "Function", "Comparator", "Process", "Character", "Integer",
]);

/** 現在のマッピングで使えない/非推奨なAPIパターン */
export const pitfalls = () => (mode === "mojmap" ? MOJ_PITFALLS : API_PITFALLS);

/** 1.21.1 (Yarn) で使えない/非推奨なAPIパターン */
export const API_PITFALLS: { re: RegExp; message: string; severity: "error" | "warning"; code: string }[] = [
  { re: /^Registry\.(ITEM|BLOCK|ITEM_GROUP|ENTITY_TYPE|STATUS_EFFECT|SOUND_EVENT|PARTICLE_TYPE)$/, message: "旧API: `Registry.ITEM` ではなく `Registries.ITEM` を使用してください (1.19.3+)", severity: "error", code: "MC-REGISTRY" },
  { re: /^FabricItemSettings$/, message: "`FabricItemSettings` は 1.21 で削除されました。`Item.Settings()` を使用してください", severity: "error", code: "MC-SETTINGS" },
  { re: /^FabricBlockSettings$/, message: "`FabricBlockSettings` は削除されました。`AbstractBlock.Settings.create()` を使用してください", severity: "error", code: "MC-SETTINGS" },
  { re: /^(LiteralText|TranslatableText)$/, message: "`LiteralText`/`TranslatableText` は削除されました。`Text.literal()` / `Text.translatable()` を使用してください", severity: "error", code: "MC-TEXT" },
  { re: /^MinecraftClient$/, message: "クライアント専用クラスです。専用サーバーで NoClassDefFoundError になります (サーバー側コードでは使用不可)", severity: "error", code: "MC-CLIENT-ONLY" },
  { re: /^ClientPlayerEntity$/, message: "クライアント専用クラスです。サーバー側コードでは使用できません", severity: "error", code: "MC-CLIENT-ONLY" },
];
