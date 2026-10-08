import type { ModProject } from "./types";

/** 生成ヘルパー (codegen.ts と共有) */
export interface ExtrasHelpers {
  q: (s: string) => string;
  d: (n: number) => string;
  f: (n: number) => string;
  i: (n: number) => string;
  ind: (lines: string[], n: number) => string[];
  ns: (id: string) => string;
}

const i2 = (n: number) => Math.round(Number.isFinite(Number(n)) ? Number(n) : 0);

/**
 * 拡張システム (Minecraft 1.21.11 / Mojang 公式マッピング専用)
 *  - カスタムステータス効果 (毎tickスキル / トーテム風の復活)
 *  - 実績 (進捗 n/N / アイテム入手 / 討伐カウント)
 *  - ショップ (本物の取引画面 / ブロック右クリックで開く)
 *  - スキルポイント強化 (/sp)
 * すべて Minecraft 1.21.11 の公式マッピング (server.txt) で署名確認済みの API だけを使用します。
 */
export function extrasMojBody(project: ModProject, H: ExtrasHelpers): string {
  const { q, f, d, ns } = H;
  const effects = (project.effects ?? []).map((e) =>
    `defineEffect(${q(e.id)}, MobEffectCategory.${e.category}, ${parseInt(e.color.replace("#", ""), 16) || 0}, ${q(e.tickSkillId)}, ${Math.max(1, i2(e.intervalTicks))}, ${e.revive ? "true" : "false"}, ${f(e.reviveHealth)}, ${q(e.reviveSkillId)})`);
  const advs: string[] = [];
  for (const a of project.advancements ?? []) {
    const steps = a.kind === "OBTAIN_ITEM" ? 1 : Math.max(1, i2(a.steps));
    advs.push(`advSteps[${q(a.id)}] = ${steps}`);
    if (a.kind === "KILL_MOB") advs.push(`killRules.add(Pair(${q(a.mob === "ANY" ? "ANY" : ns(a.mob))}, ${q(a.id)}))`);
  }
  const shops = (project.shops ?? []).map((s) => {
    const trades = s.trades.map((t) =>
      `Trade(${q(t.id)}, ${q(ns(t.offerItem))}, ${i2(t.offerCount)}, ${q(ns(t.requiredItem1))}, ${i2(t.requiredCount1)}, ${q(t.requiredItem2 ? ns(t.requiredItem2) : "")}, ${i2(t.requiredCount2)})`);
    const block = s.openedByBlockId ? `${project.meta.modId}:${s.openedByBlockId}` : "";
    return `defineShop(${q(s.id)}, ${q(s.name)}, ${q(block)}, listOf(${trades.join(", ")}))`;
  });
  const upgrades = (project.skillPoints ?? []).map((u) => `defineUpgrade(${q(u.id)}, ${q(u.name)}, ${Math.max(1, i2(u.cost))}, ${q(u.effect)}, ${d(u.amount)})`);
  const defs = [...effects, ...advs, ...shops, ...upgrades];

  return `/** カスタムステータス効果。毎tickスキルの発動に対応 */
class ModEffect(category: MobEffectCategory, color: Int, private val tickSkill: String, private val interval: Int) : MobEffect(category, color) {
    override fun shouldApplyEffectTickThisTick(duration: Int, amplifier: Int): Boolean =
        tickSkill.isNotEmpty() && interval > 0 && duration % interval == 0

    override fun applyEffectTick(level: ServerLevel, entity: LivingEntity, amplifier: Int): Boolean {
        if (tickSkill.isNotEmpty() && entity is ServerPlayer) SkillManager.cast(tickSkill, entity, null, silent = true, free = true)
        return true
    }
}

/** 拡張システム (エフェクト / 実績 / ショップ / スキルポイント)。Minecraft 1.21.11 専用 */
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

    // ------------------------------------------------------------ エフェクト
    fun applyEffect(ctx: SkillContext, mode: TargetMode, radius: Double, id: String, ticks: Int, amplifier: Int) {
        val holder = holders[id] ?: return
        for (e in ctx.entities(mode, radius)) e.addEffect(MobEffectInstance(holder, ticks, amplifier))
    }

    // ------------------------------------------------------------ 実績
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

    // ------------------------------------------------------------ ショップ (取引画面)
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
            player.displayClientMessage(Component.literal("ショップが見つかりません: " + id), true)
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

    // ------------------------------------------------------------ スキルポイント
    private fun setBase(player: ServerPlayer, attr: Holder<Attribute>, value: Double) {
        val inst = player.getAttribute(attr) ?: return
        if (inst.baseValue != value) inst.baseValue = value
    }

    /** 購入済み強化の合計を属性に反映 (冪等) */
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

    /** 最大マナの加算分 (SkillManager から参照) */
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
        player.displayClientMessage(Component.literal("=== スキルポイント: " + points + " pt ===").withStyle(ChatFormatting.GOLD), false)
        for (u in upgrades.values) {
            val lv = Variables.get(ctx, "SELF", "sp_" + u.id).toInt()
            player.displayClientMessage(Component.literal("  /sp buy " + u.id + "  " + u.name + "  (必要 " + u.cost + "pt / 現在 Lv" + lv + ")").withStyle(ChatFormatting.YELLOW), false)
        }
    }

    private fun buyUpgrade(player: ServerPlayer, id: String): Boolean {
        val up = upgrades[id]
        if (up == null) {
            player.displayClientMessage(Component.literal("不明な強化: " + id).withStyle(ChatFormatting.RED), true)
            return false
        }
        val ctx = SkillContext(player, player.level())
        if (Variables.get(ctx, "SELF", "skill_points") < up.cost) {
            player.displayClientMessage(Component.literal("スキルポイントが足りません (必要 " + up.cost + "pt)").withStyle(ChatFormatting.RED), true)
            return false
        }
        Variables.add(ctx, "SELF", "skill_points", -up.cost.toDouble(), 0.0, 100000.0)
        Variables.add(ctx, "SELF", "sp_" + up.id, 1.0, 0.0, 1000.0)
        applyUpgrades(player)
        player.displayClientMessage(Component.literal("強化「" + up.name + "」を習得しました").withStyle(ChatFormatting.GREEN), false)
        return true
    }

    // ------------------------------------------------------------ 登録
    fun register() {
${H.ind(defs.length ? defs : ["// (拡張定義なし)"], 8).join("\n")}

        // 復活エフェクト (不死のトーテム風)
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

        // 討伐カウント実績
        if (killRules.isNotEmpty()) {
            ServerEntityCombatEvents.AFTER_KILLED_OTHER_ENTITY.register { _, entity, killed, _ ->
                if (entity is ServerPlayer) {
                    val typeId = BuiltInRegistries.ENTITY_TYPE.getKey(killed.type).toString()
                    for ((mob, adv) in killRules) if (mob == "ANY" || mob == typeId) advance(entity, adv, 1)
                }
            }
        }

        // ブロック右クリックでショップを開く
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

        // スキルポイント強化の反映
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

/** 旧プロファイル (1.21.1 / Yarn) 用スタブ。機能は無効で、呼び出しても安全 */
export function extrasYarnStub(): string {
  return `/** 拡張システムは Minecraft 1.21.11 プロファイル専用です。このプロファイルでは何も行いません */
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

const SLOT_GROUP: Record<string, string> = { HELMET: "HEAD", CHESTPLATE: "CHEST", LEGGINGS: "LEGS", BOOTS: "FEET" };

/**
 * アイテムの属性ボーナス (持つ/装備するだけで適用)。
 * DefaultItemComponentEvents で「既存の属性修飾 (剣の攻撃力・防具値) に追記」するため、基本性能は上書きされません。
 */
export function itemAttributesMojBody(project: ModProject, H: ExtrasHelpers): string {
  const { q, d } = H;
  const lines: string[] = [];
  for (const it of project.items) {
    const slot = it.kind === "armor" ? SLOT_GROUP[it.armorSlot] ?? "CHEST" : "MAINHAND";
    const entries: string[] = [];
    const add = (attr: string, tag: string, v: number | undefined) => {
      if (Number(v) > 0) entries.push(`Triple(Attributes.${attr}, ${q(`${it.id}_${tag}`)}, ${d(Number(v))})`);
    };
    add("MAX_HEALTH", "bonus_health", it.bonusMaxHealth);
    add("MOVEMENT_SPEED", "bonus_speed", it.bonusMovementSpeed);
    add("ARMOR", "bonus_armor", it.bonusArmor);
    add("ARMOR_TOUGHNESS", "bonus_toughness", it.bonusToughness);
    add("KNOCKBACK_RESISTANCE", "bonus_knockback", it.bonusKnockbackResistance);
    if (entries.length) lines.push(`modify(context, ModItems.${constOf(it.id)}, EquipmentSlotGroup.${slot}, listOf(${entries.join(", ")}))`);
  }
  return `/** アイテムの属性ボーナスを既存の属性修飾に追記します (剣の攻撃力などは保持) */
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
${H.ind(lines.length ? lines : ["// (属性ボーナスなし)"], 12).join("\n")}
        }
        ModInfo.LOGGER.info("Registered attribute bonuses for ${lines.length} items")
    }
}`;
}

const constOf = (id: string) => {
  const c = id.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase();
  return /^[0-9]/.test(c) ? `_${c}` : c;
};

export function itemAttributesYarnStub(): string {
  return `/** 属性ボーナスは Minecraft 1.21.11 プロファイル専用です */
object ModItemAttributes {
    fun register() {
        ModInfo.LOGGER.info("Item attribute bonuses require the 1.21.11 profile")
    }
}`;
}
