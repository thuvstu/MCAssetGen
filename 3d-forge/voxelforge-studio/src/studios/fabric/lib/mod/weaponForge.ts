import { parsePngDataUrl } from "./png";
import type { Diagnostic, ForgeStyleDef, GeneratedFile, ModProject } from "./types";
import { resolveEnv } from "./targets";

/** 登録時に固定されるID、画像・モデルの参照、ゲーム内パラメータを事前検証 */
export function checkWeaponForge(project: ModProject): Diagnostic[] {
  if (!project.forge?.enabled) return [];
  const result: Diagnostic[] = [];
  const add = (severity: Diagnostic["severity"], code: string, where: string, message: string) =>
    result.push({ file: "project", line: 0, col: 0, severity, code, message: `[武器工房: ${where}] ${message}` });
  if (resolveEnv(project.meta).mappings !== "mojmap") add("error", "FORGE-PROFILE", "環境", "ゲーム内武器工房は Minecraft 1.21.11 / Mojang公式マッピング専用です");
  if (!project.forge.styles.length) add("error", "FORGE-EMPTY", "外見", "最低1件の外見を登録してください");
  if (project.forge.styles.length > 64) add("error", "FORGE-LIMIT", "外見", "見た目は64件までです");
  const ids = new Set<string>();
  const skillIds = new Set(project.skills.map((s) => s.id));
  const itemIds = new Set([...project.items.map((it) => it.id), ...project.blocks.map((b) => b.id)]);
  for (const fixed of ["forged_weapon", "weapon_forge"]) {
    if (itemIds.has(fixed)) add("error", "FORGE-ID", "登録", `ID '${fixed}' は武器工房が使います。同名のアイテム/ブロックを変更してください`);
  }
  if (project.recipes.some((r) => r.id === "weapon_forge")) add("error", "FORGE-RECIPE", "登録", "レシピID 'weapon_forge' は武器工房が使います");
  for (const style of project.forge.styles) {
    const w = style.id || "(未設定)";
    if (itemIds.has(`forged_${style.id}`)) add("error", "FORGE-ID", w, `ID 'forged_${style.id}' は武器工房の外見アイテムとして登録されます。同名のアイテム/ブロックを変更してください`);
    if (!/^[a-z][a-z0-9_]*$/.test(style.id)) add("error", "FORGE-ID", w, "見た目IDは小文字英数字と_のみ、英字始まりにしてください");
    if (ids.has(style.id)) add("error", "FORGE-DUP", w, "見た目IDが重複しています");
    ids.add(style.id);
    if (!style.name.trim()) add("error", "FORGE-NAME", w, "名前が空です");
    if (style.name.length > 32) add("warning", "FORGE-NAME", w, "名前の先頭32文字だけがゲーム内で表示されます");
    if (!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(style.texture)) add("error", "FORGE-TEXTURE", w, "テクスチャは 'minecraft:item/iron_sword' のようなIDにしてください");
    if (style.customTexture) {
      const png = parsePngDataUrl(style.customTexture);
      if (!png) add("error", "FORGE-PNG", w, "テクスチャはPNGのdata URLでアップロードしてください");
      else if (png.length > 90_000) add("error", "FORGE-PNG", w, "PNGが大きすぎます (64KBまで)");
    }
    if (style.modelJson?.trim()) {
      try {
        if (style.modelJson.length > 90_000) throw new Error("モデルJSONは90KB以下にしてください");
        const obj: unknown = JSON.parse(style.modelJson);
        if (!obj || typeof obj !== "object" || Array.isArray(obj)) throw new Error("オブジェクト形式のJSONが必要です");
        const model = obj as Record<string, unknown>;
        if ("meta" in model && "outliner" in model) throw new Error(".bbmodel形式です。Blockbenchから『Java Block/Itemモデル』のJSONとしてエクスポートしてください");
        if (!("parent" in model || "elements" in model)) throw new Error("モデルに parent または elements が必要です");
      } catch (e) { add("error", "FORGE-MODEL", w, (e as Error).message); }
    }
    if (!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(style.costItem)) add("error", "FORGE-COST", w, "材料IDは 'minecraft:iron_ingot' の形式にしてください");
    else if (style.costItem.startsWith(`${project.meta.modId}:`) && !itemIds.has(style.costItem.split(":")[1])) add("error", "FORGE-REF", w, `材料 '${style.costItem}' はこのModに存在しません`);
    if (!Number.isInteger(style.costCount) || style.costCount < 1 || style.costCount > 64) add("error", "FORGE-COST", w, "材料の個数は1〜64です");
    if (!Number.isFinite(style.defaultDamage) || style.defaultDamage < 1 || style.defaultDamage > 20) add("error", "FORGE-STAT", w, "初期攻撃力は1〜20です");
    if (!Number.isFinite(style.defaultSpeed) || style.defaultSpeed < -4 || style.defaultSpeed > 0) add("error", "FORGE-STAT", w, "初期攻撃速度補正は-4〜0です");
    if (!Number.isInteger(style.defaultDurability) || style.defaultDurability < 32 || style.defaultDurability > 4096) add("error", "FORGE-STAT", w, "初期耐久値は32〜4096です");
    if (style.defaultSkillId && !skillIds.has(style.defaultSkillId)) add("error", "FORGE-SKILL", w, `初期スキル '${style.defaultSkillId}' は存在しません`);
    if (style.defaultSkillId && project.skills.find((sk) => sk.id === style.defaultSkillId)?.trigger.type !== "MANUAL") add("warning", "FORGE-SKILL", w, "自動発動スキルを武器に初期割り当てしています (二重発動の可能性)");
  }
  return result;
}

/** 1.21.11/Mojang 向け: 一度だけ登録する武器素体と鍛冶台。アイテムの各個体は data components で区別する。 */
export function weaponForgeBody(project: ModProject, q: (s: string) => string): string {
  const styles = project.forge.styles.map((s) =>
    `style(Style(${q(s.id)}, ${q(s.name)}, ${q(s.costItem)}, ${Math.round(s.costCount)}, ${Number(s.defaultDamage).toFixed(1)}, ${Number(s.defaultSpeed).toFixed(1)}, ${Math.round(s.defaultDurability)}, ${q(s.defaultSkillId)}))`,
  );
  return `/**
 * ゲーム内武器工房 (MC 1.21.11 / Mojang Mappings)。
 * Minecraft は起動後にアイテムの新しいレジストリIDを登録できません。
 * forged_weapon と weapon_forge の2種類を起動時に登録し、完成した武器の個体差は
 * CUSTOM_DATA / ATTRIBUTE_MODIFIERS / ITEM_MODEL に保存します。
 * 見た目のPNG・Blockbenchモデルは Mod に同梱した候補から選びます。
 */
object WeaponForge {
    data class Style(val id: String, val name: String, val costItem: String, val costCount: Int, val damage: Double, val speed: Double, val durability: Int, val defaultSkill: String)
    private data class Design(
        var style: String,
        var tier: String = "IRON",
        var name: String = "",
        var damage: Double = 6.0,
        var speed: Double = -2.4,
        var durability: Int = 250,
        var skill: String = "",
        var shiftSkill: String = "",
        var leftSkill: String = "",
        var editSkill: Int = 0,
        var stylePage: Int = 0,
        var skillPage: Int = 0,
    )

    private val styles = LinkedHashMap<String, Style>()
    /** 外見ごとに起動時に登録する本物のアイテムID (modid:forged_<外見ID>) */
    val STYLE_ITEMS = LinkedHashMap<String, Item>()
    private val sessions = HashMap<UUID, Design>()
    private val tiers = listOf("WOOD", "STONE", "COPPER", "IRON", "GOLD", "DIAMOND", "NETHERITE")
    private val tierIngredient = listOf("minecraft:oak_planks", "minecraft:cobblestone", "minecraft:copper_ingot", "minecraft:iron_ingot", "minecraft:gold_ingot", "minecraft:diamond", "minecraft:netherite_ingot")
    private val tierIcons = listOf(Items.OAK_PLANKS, Items.COBBLESTONE, Items.COPPER_INGOT, Items.IRON_INGOT, Items.GOLD_INGOT, Items.DIAMOND, Items.NETHERITE_INGOT)

    lateinit var WEAPON: Item
        private set
    lateinit var TABLE: Block
        private set
    lateinit var TABLE_ITEM: Item
        private set

    private fun style(id: Style) { styles[id.id] = id }
    private fun selected(d: Design): Style = styles[d.style] ?: styles.values.first()
    private fun get(player: ServerPlayer): Design {
        val first = styles.values.first()
        return sessions.getOrPut(player.uuid) { Design(first.id, name = first.name, damage = first.damage, speed = first.speed, durability = first.durability, skill = first.defaultSkill) }
    }

    /** 鍛造済みの武器からスキルを安全に読み出す */
    private fun skillOf(stack: ItemStack, tag: String): String {
        if (stack.item != WEAPON && stack.item !in STYLE_ITEMS.values) return ""
        val data = stack.get(DataComponents.CUSTOM_DATA)?.copyTag() ?: return ""
        if (data.getIntOr("ForgeVersion", 0) != 1) return ""
        val id = data.getStringOr(tag, "")
        return if (id.isNotBlank() && SkillManager.get(id) != null) id else ""
    }

    private class ForgedWeapon(properties: Item.Properties) : Item(properties) {
        override fun use(level: Level, player: Player, hand: InteractionHand): InteractionResult {
            val stack = player.getItemInHand(hand)
            if (level.isClientSide || player !is ServerPlayer) return InteractionResult.PASS
            val tag = if (player.isShiftKeyDown) "ShiftSkill" else "Skill"
            val id = skillOf(stack, tag).ifBlank { if (player.isShiftKeyDown) skillOf(stack, "Skill") else "" }
            if (id.isBlank()) return InteractionResult.PASS
            return if (SkillManager.cast(id, player)) InteractionResult.SUCCESS else InteractionResult.FAIL
        }

        override fun appendHoverText(stack: ItemStack, context: Item.TooltipContext, display: TooltipDisplay, builder: Consumer<Component>, flag: TooltipFlag) {
            val tag = stack.get(DataComponents.CUSTOM_DATA)?.copyTag()
            if (tag?.getIntOr("ForgeVersion", 0) == 1) {
                builder.accept(Component.literal("鍛造: " + tag.getStringOr("Style", "?") + " / " + tag.getStringOr("Tier", "IRON")).withStyle(ChatFormatting.GRAY))
                val a = tag.getStringOr("Skill", "")
                val b = tag.getStringOr("ShiftSkill", "")
                val c = tag.getStringOr("LeftSkill", "")
                if (a.isNotBlank()) builder.accept(Component.literal("右クリック: " + a).withStyle(ChatFormatting.AQUA))
                if (b.isNotBlank()) builder.accept(Component.literal("Shift+右クリック: " + b).withStyle(ChatFormatting.LIGHT_PURPLE))
                if (c.isNotBlank()) builder.accept(Component.literal("左クリック: " + c).withStyle(ChatFormatting.YELLOW))
            }
            super.appendHoverText(stack, context, display, builder, flag)
        }
    }

    private fun display(item: Item, text: String): ItemStack = ItemStack(item).also {
        it.set(DataComponents.ITEM_NAME, Component.literal(text))
    }

    /** 6行チェストのバニラ画面を使う。スロット0..53はすべてゴーストボタン: 持ち出し/投入/複製を遮断。 */
    private class ForgeMenu(id: Int, inventory: Inventory, private val owner: ServerPlayer) : AbstractContainerMenu(MenuType.GENERIC_9x6, id) {
        private val buttons = SimpleContainer(54)
        init {
            for (row in 0 until 6) for (col in 0 until 9) {
                addSlot(Slot(buttons, row * 9 + col, 8 + col * 18, 18 + row * 18))
            }
            addStandardInventorySlots(inventory, 8, 140)
            refresh()
        }

        private fun put(slot: Int, item: Item, label: String) { buttons.setItem(slot, display(item, label)) }
        private fun refresh() {
            val state = get(owner)
            buttons.clearContent()
            val styleList = styles.values.toList()
            for (j in 0 until 18) {
                val st = styleList.getOrNull(state.stylePage * 18 + j) ?: continue
                val appearance = display(STYLE_ITEMS[st.id] ?: WEAPON, (if (st.id == state.style) "● " else "") + st.name + " [" + st.id + "]")
                appearance.set(DataComponents.ITEM_MODEL, Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "forge/" + st.id))
                put(j, appearance)
            }
            for (n in tiers.indices) put(18 + n, tierIcons[n], (if (tiers[n] == state.tier) "● " else "") + tiers[n])
            put(25, Items.ARROW, "外見 ← 前ページ")
            put(26, Items.ARROW, "外見 → 次ページ")
            val ids = SkillManager.ids()
            for (j in 0 until 8) {
                val id = ids.getOrNull(state.skillPage * 8 + j) ?: continue
                val active = when (state.editSkill) { 1 -> state.shiftSkill == id; 2 -> state.leftSkill == id; else -> state.skill == id }
                put(27 + j, if (active) Items.ENCHANTED_BOOK else Items.BOOK, (if (active) "● " else "") + (SkillManager.get(id)?.displayName ?: id) + " [" + id + "]")
            }
            put(35, Items.BARRIER, "選択中のスキルを解除")
            put(36, Items.STICK, (if (state.editSkill == 0) "● " else "") + "右クリックのスキル")
            put(37, Items.BLAZE_ROD, (if (state.editSkill == 1) "● " else "") + "Shift+右クリックのスキル")
            put(38, Items.IRON_SWORD, (if (state.editSkill == 2) "● " else "") + "左クリックのスキル")
            put(39, Items.EMERALD, "攻撃力 +1 (最大20)")
            put(40, Items.REDSTONE, "攻撃力 -1 (最低1)")
            put(41, Items.SUGAR, "攻撃速度 +0.2 (最大0)")
            put(42, Items.COBWEB, "攻撃速度 -0.2 (最低-4)")
            put(43, Items.DIAMOND, "耐久 +100 (最大4096)")
            put(44, Items.FLINT, "耐久 -100 (最低32)")
            put(45, preview(state))
            put(46, Items.PAPER, "攻撃+" + state.damage + " / 速度" + state.speed + " / 耐久" + state.durability)
            put(47, Items.NAME_TAG, "名前の変更 → /forge name <名前> (チャット)")
            val st = selected(state)
            put(48, itemOf(st.costItem), "必要: " + st.costItem + " x" + st.costCount + " + " + tierIngredient[tiers.indexOf(state.tier)] + " x1")
            put(49, Items.BARRIER, "選択を初期化")
            put(50, Items.ARROW, "スキル ← 前ページ")
            put(51, Items.ARROW, "スキル → 次ページ")
            put(52, Items.BOOK, "GUIで見た目・素材・スキルを選択。名前は /forge name")
            put(53, Items.SMITHING_TABLE, "⚒ この武器を鍛造して受け取る")
            broadcastChanges()
        }

        private fun put(slot: Int, stack: ItemStack) { buttons.setItem(slot, stack) }

        override fun clicked(slotId: Int, button: Int, click: ClickType, player: Player) {
            if (player !== owner) return
            if (slotId in 0..53) {
                // ゴーストアイテムは一切動かさない。クリックはサーバー上の設定にのみ反映する。
                if (click != ClickType.PICKUP && click != ClickType.QUICK_MOVE) return
                val state = get(owner)
                when (slotId) {
                    in 0..17 -> styles.values.toList().getOrNull(state.stylePage * 18 + slotId)?.let {
                        state.style = it.id; state.name = it.name; state.damage = it.damage; state.speed = it.speed; state.durability = it.durability; state.skill = it.defaultSkill; state.shiftSkill = ""; state.leftSkill = ""
                    }
                    in 18..24 -> state.tier = tiers[slotId - 18]
                    25 -> state.stylePage = (state.stylePage - 1).coerceAtLeast(0)
                    26 -> state.stylePage = (state.stylePage + 1).coerceAtMost((styles.size - 1).coerceAtLeast(0) / 18)
                    in 27..34 -> SkillManager.ids().getOrNull(state.skillPage * 8 + slotId - 27)?.let { setSkill(state, it) }
                    35 -> setSkill(state, "")
                    36 -> state.editSkill = 0
                    37 -> state.editSkill = 1
                    38 -> state.editSkill = 2
                    39 -> state.damage = (state.damage + 1).coerceAtMost(20.0)
                    40 -> state.damage = (state.damage - 1).coerceAtLeast(1.0)
                    41 -> state.speed = (state.speed + 0.2).coerceAtMost(0.0)
                    42 -> state.speed = (state.speed - 0.2).coerceAtLeast(-4.0)
                    43 -> state.durability = (state.durability + 100).coerceAtMost(4096)
                    44 -> state.durability = (state.durability - 100).coerceAtLeast(32)
                    47 -> owner.displayClientMessage(Component.literal("名前を変更: /forge name <新しい名前> を入力。画面を開き直して反映されます"), false)
                    49 -> { val st = selected(state); sessions[owner.uuid] = Design(st.id, name = st.name, damage = st.damage, speed = st.speed, durability = st.durability, skill = st.defaultSkill) }
                    50 -> state.skillPage = (state.skillPage - 1).coerceAtLeast(0)
                    51 -> state.skillPage = (state.skillPage + 1).coerceAtMost((SkillManager.ids().size - 1).coerceAtLeast(0) / 8)
                    53 -> craft(owner)
                }
                refresh()
                return
            }
            // Shift+クリックでプレイヤーの持ち物をゴーストスロットへ移さない。
            if (click == ClickType.QUICK_MOVE || click == ClickType.QUICK_CRAFT || click == ClickType.PICKUP_ALL || click == ClickType.CLONE) return
            super.clicked(slotId, button, click, player)
        }

        override fun quickMoveStack(player: Player, slot: Int): ItemStack = ItemStack.EMPTY
        override fun stillValid(player: Player): Boolean = player === owner && !owner.isRemoved
    }

    private fun setSkill(d: Design, id: String) {
        when (d.editSkill) { 1 -> d.shiftSkill = id; 2 -> d.leftSkill = id; else -> d.skill = id }
    }

    private fun itemOf(id: String): Item = BuiltInRegistries.ITEM.getValue(Identifier.parse(id)) ?: Items.AIR

    /** スタック1個に刻んだ状態。リログ/再起動/マルチプレイで消えない。 */
    private fun preview(d: Design): ItemStack {
        val st = selected(d)
        val stack = ItemStack(STYLE_ITEMS[st.id] ?: WEAPON)
        val data = CompoundTag()
        data.putInt("ForgeVersion", 1)
        data.putString("Style", st.id)
        data.putString("Tier", d.tier)
        data.putString("Skill", d.skill)
        data.putString("ShiftSkill", d.shiftSkill)
        data.putString("LeftSkill", d.leftSkill)
        stack.set(DataComponents.CUSTOM_DATA, CustomData.of(data))
        stack.set(DataComponents.ITEM_NAME, Component.literal(d.name.take(32)))
        stack.set(DataComponents.ITEM_MODEL, Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "forge/" + st.id))
        stack.set(DataComponents.MAX_DAMAGE, d.durability.coerceIn(32, 4096))
        stack.set(DataComponents.ATTRIBUTE_MODIFIERS, ItemAttributeModifiers.builder()
            .add(Attributes.ATTACK_DAMAGE, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "forge_damage"), d.damage.coerceIn(1.0, 20.0), AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.MAINHAND)
            .add(Attributes.ATTACK_SPEED, AttributeModifier(Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "forge_speed"), d.speed.coerceIn(-4.0, 0.0), AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.MAINHAND)
            .build())
        stack.set(DataComponents.ENCHANTMENT_GLINT_OVERRIDE, d.skill.isNotEmpty() || d.shiftSkill.isNotEmpty() || d.leftSkill.isNotEmpty())
        return stack
    }

    /** 必要個数を先に全チェックしてから差し引く (途中で失敗して材料だけ失うことを防止) */
    private fun craft(player: ServerPlayer) {
        val d = get(player)
        val st = selected(d)
        val cost = LinkedHashMap<Item, Int>()
        val styleItem = itemOf(st.costItem)
        val tierItem = itemOf(tierIngredient[tiers.indexOf(d.tier)])
        if (styleItem == Items.AIR || tierItem == Items.AIR) {
            player.displayClientMessage(Component.literal("鍛造の材料IDが不正です").withStyle(ChatFormatting.RED), true)
            return
        }
        cost[styleItem] = st.costCount
        cost[tierItem] = (cost[tierItem] ?: 0) + 1
        if (!player.isCreative) {
            for ((item, required) in cost) {
                var count = 0
                for (slot in 0 until player.inventory.containerSize) {
                    val stack = player.inventory.getItem(slot)
                    if (stack.item == item) count += stack.count
                }
                if (count < required) {
                    player.displayClientMessage(Component.literal("材料が不足: " + BuiltInRegistries.ITEM.getKey(item) + " x" + required).withStyle(ChatFormatting.RED), true)
                    return
                }
            }
            for ((item, required) in cost) {
                var left = required
                for (slot in 0 until player.inventory.containerSize) {
                    if (left <= 0) break
                    val stack = player.inventory.getItem(slot)
                    if (stack.item != item) continue
                    val take = minOf(left, stack.count)
                    stack.shrink(take)
                    left -= take
                }
            }
            player.inventory.setChanged()
        }
        val weapon = preview(d)
        player.inventory.placeItemBackInInventory(weapon)
        player.displayClientMessage(Component.literal("鍛造完了: " + d.name + " (" + st.id + " / " + d.tier + ")").withStyle(ChatFormatting.GREEN), false)
    }

    fun open(player: ServerPlayer) {
        if (styles.isEmpty()) {
            player.displayClientMessage(Component.literal("武器工房の外見候補がありません。Webエディタで追加し、Modを再ビルドしてください").withStyle(ChatFormatting.RED), false)
            return
        }
        player.openMenu(SimpleMenuProvider({ id, inventory, _ -> ForgeMenu(id, inventory, player) }, Component.literal("MythicForge | 武器工房")))
    }

    fun register() {
        val id = Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "forged_weapon")
        val itemKey = ResourceKey.create(Registries.ITEM, id)
        WEAPON = Registry.register(BuiltInRegistries.ITEM, itemKey, ForgedWeapon(Item.Properties().setId(itemKey).sword(ToolMaterial.IRON, 3.0f, -2.4f)))
        val blockId = Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "weapon_forge")
        val blockKey = ResourceKey.create(Registries.BLOCK, blockId)
        val blockItemKey = ResourceKey.create(Registries.ITEM, blockId)
        TABLE = Registry.register(BuiltInRegistries.BLOCK, blockKey, Block(BlockBehaviour.Properties.of().setId(blockKey).strength(3.5f, 6.0f).sound(SoundType.METAL)))
        TABLE_ITEM = Registry.register(BuiltInRegistries.ITEM, blockItemKey, BlockItem(TABLE, Item.Properties().setId(blockItemKey).useBlockDescriptionPrefix()))
${styles.length ? styles.map((l) => `        ${l}`).join("\n") : "        // 見た目は未登録"}
        for (st in styles.values) {
            val key = ResourceKey.create(Registries.ITEM, Identifier.fromNamespaceAndPath(ModInfo.MOD_ID, "forged_" + st.id))
            STYLE_ITEMS[st.id] = Registry.register(BuiltInRegistries.ITEM, key, ForgedWeapon(Item.Properties().setId(key).sword(ToolMaterial.IRON, 3.0f, -2.4f)))
        }

        UseBlockCallback.EVENT.register { player, level, hand, hit ->
            if (hand != InteractionHand.MAIN_HAND || level.getBlockState(hit.blockPos).block != TABLE) return@register InteractionResult.PASS
            if (!level.isClientSide && player is ServerPlayer) open(player)
            InteractionResult.SUCCESS
        }
        AttackBlockCallback.EVENT.register { player, level, hand, _, _ ->
            if (!level.isClientSide && hand == InteractionHand.MAIN_HAND && player is ServerPlayer) {
                val skill = skillOf(player.mainHandItem, "LeftSkill")
                if (skill.isNotEmpty()) SkillManager.cast(skill, player, null, silent = true)
            }
            InteractionResult.PASS
        }
        AttackEntityCallback.EVENT.register { player, level, hand, target, _ ->
            if (!level.isClientSide && hand == InteractionHand.MAIN_HAND && player is ServerPlayer) {
                val skill = skillOf(player.mainHandItem, "LeftSkill")
                if (skill.isNotEmpty()) SkillManager.cast(skill, player, target as? LivingEntity, silent = true)
            }
            InteractionResult.PASS
        }
        CommandRegistrationCallback.EVENT.register { dispatcher, _, _ ->
            dispatcher.register(Commands.literal("forge")
                .executes { c -> open(c.source.playerOrException); 1 }
                .then(Commands.literal("open").executes { c -> open(c.source.playerOrException); 1 })
                .then(Commands.literal("create").executes { c -> craft(c.source.playerOrException); 1 })
                .then(Commands.literal("help").executes { c ->
                    c.source.playerOrException.displayClientMessage(Component.literal("/forge open | name <名前> | style <id> | material <WOOD/STONE/COPPER/IRON/GOLD/DIAMOND/NETHERITE> | skill <id/none> | shift <id/none> | left <id/none> | damage <1-20> | speed <-4..0> | durability <32-4096> | create").withStyle(ChatFormatting.AQUA), false)
                    1
                })
                .then(Commands.literal("name").then(Commands.argument("value", StringArgumentType.greedyString()).executes { c ->
                    val p = c.source.playerOrException
                    val name = StringArgumentType.getString(c, "value").trim().take(32)
                    if (name.isEmpty()) return@executes 0
                    get(p).name = name
                    p.displayClientMessage(Component.literal("名前: " + name), true)
                    1
                }))
                .then(Commands.literal("style").then(Commands.argument("value", StringArgumentType.word()).suggests { _, b -> SharedSuggestionProvider.suggest(styles.keys, b) }.executes { c ->
                    val key = StringArgumentType.getString(c, "value")
                    val st = styles[key] ?: return@executes 0
                    val d = get(c.source.playerOrException)
                    d.style = st.id; d.name = st.name; d.damage = st.damage; d.speed = st.speed; d.durability = st.durability; d.skill = st.defaultSkill
                    1
                }))
                .then(Commands.literal("material").then(Commands.argument("value", StringArgumentType.word()).suggests { _, b -> SharedSuggestionProvider.suggest(tiers, b) }.executes { c ->
                    val tier = StringArgumentType.getString(c, "value").uppercase()
                    if (tier !in tiers) return@executes 0
                    get(c.source.playerOrException).tier = tier
                    1
                }))
                .then(Commands.literal("skill").then(Commands.argument("value", StringArgumentType.word()).suggests { _, b -> SharedSuggestionProvider.suggest(SkillManager.ids() + "none", b) }.executes { c -> setCommandSkill(c.source.playerOrException, StringArgumentType.getString(c, "value"), 0) }))
                .then(Commands.literal("shift").then(Commands.argument("value", StringArgumentType.word()).suggests { _, b -> SharedSuggestionProvider.suggest(SkillManager.ids() + "none", b) }.executes { c -> setCommandSkill(c.source.playerOrException, StringArgumentType.getString(c, "value"), 1) }))
                .then(Commands.literal("left").then(Commands.argument("value", StringArgumentType.word()).suggests { _, b -> SharedSuggestionProvider.suggest(SkillManager.ids() + "none", b) }.executes { c -> setCommandSkill(c.source.playerOrException, StringArgumentType.getString(c, "value"), 2) }))
                .then(Commands.literal("damage").then(Commands.argument("value", DoubleArgumentType.doubleArg(1.0, 20.0)).executes { c ->
                    get(c.source.playerOrException).damage = DoubleArgumentType.getDouble(c, "value"); 1
                }))
                .then(Commands.literal("speed").then(Commands.argument("value", DoubleArgumentType.doubleArg(-4.0, 0.0)).executes { c ->
                    get(c.source.playerOrException).speed = DoubleArgumentType.getDouble(c, "value"); 1
                }))
                .then(Commands.literal("durability").then(Commands.argument("value", IntegerArgumentType.integer(32, 4096)).executes { c ->
                    get(c.source.playerOrException).durability = IntegerArgumentType.getInteger(c, "value"); 1
                }))
            )
        }
        ServerPlayConnectionEvents.DISCONNECT.register { handler, _ -> sessions.remove(handler.player.uuid) }
        ModInfo.LOGGER.info("Registered weapon forge: " + styles.size + " appearances")
    }

    private fun setCommandSkill(player: ServerPlayer, key: String, slot: Int): Int {
        if (key != "none" && SkillManager.get(key) == null) {
            player.displayClientMessage(Component.literal("不明なスキル: " + key).withStyle(ChatFormatting.RED), true)
            return 0
        }
        val d = get(player)
        d.editSkill = slot
        setSkill(d, if (key == "none") "" else key)
        player.displayClientMessage(Component.literal("スキルを設定しました: " + key), true)
        return 1
    }
}`;
}

/** Webエディタに登録した見た目をModのリソースパックに同梱する。起動後に別のPNGを受け取る方式ではない。 */
export function weaponForgeResources(project: ModProject): GeneratedFile[] {
  if (!project.forge?.enabled) return [];
  const id = project.meta.modId;
  const files: GeneratedFile[] = [];
  const json = (name: string, data: unknown) => files.push({ path: `src/main/resources/${name}`, content: JSON.stringify(data, null, 2) + "\n", kind: "json" });
  const bin = (name: string, base64: string) => files.push({ path: `src/main/resources/${name}`, content: base64, kind: "binary", encoding: "base64" });

  json(`assets/${id}/models/item/forged_weapon.json`, { parent: "minecraft:item/handheld", textures: { layer0: "minecraft:item/iron_sword" } });
  json(`assets/${id}/items/forged_weapon.json`, { model: { type: "minecraft:model", model: `${id}:item/forged_weapon` } });
  json(`assets/${id}/blockstates/weapon_forge.json`, { variants: { "": { model: `${id}:block/weapon_forge` } } });
  json(`assets/${id}/models/block/weapon_forge.json`, { parent: "minecraft:block/cube_all", textures: { all: "minecraft:block/smithing_table_top" } });
  json(`assets/${id}/items/weapon_forge.json`, { model: { type: "minecraft:model", model: `${id}:block/weapon_forge` } });
  json(`data/${id}/loot_table/blocks/weapon_forge.json`, { type: "minecraft:block", pools: [{ rolls: 1, entries: [{ type: "minecraft:item", name: `${id}:weapon_forge` }] }] });
  json(`data/${id}/recipe/weapon_forge.json`, { type: "minecraft:crafting_shaped", category: "misc", pattern: ["III", "CSC", "CCC"], key: { I: "minecraft:iron_ingot", C: "minecraft:cobblestone", S: "minecraft:smithing_table" }, result: { id: `${id}:weapon_forge`, count: 1 } });
  for (const style of project.forge.styles) {
    const png = parsePngDataUrl(style.customTexture);
    if (png) bin(`assets/${id}/textures/item/forge/${style.id}.png`, png);
    const texId = `${id}:item/forge/${style.id}`;
    let model: Record<string, unknown> = { parent: `minecraft:item/${style.parent}`, textures: { layer0: png ? texId : style.texture } };
    if (style.modelJson?.trim()) {
      try {
        const custom = JSON.parse(style.modelJson) as Record<string, unknown>;
        if (custom && typeof custom === "object" && !Array.isArray(custom)) {
          model = { ...custom };
          if (png) {
            const textures = custom.textures && typeof custom.textures === "object" && !Array.isArray(custom.textures) ? { ...(custom.textures as Record<string, unknown>) } : {};
            for (const [key, value] of Object.entries(textures)) if (value === "$uploaded" || value === "$texture") textures[key] = texId;
            if (!Object.keys(textures).length) { textures.layer0 = texId; textures["0"] = texId; }
            model.textures = textures;
          }
        }
      } catch { /* Webのバリデーションがエラーを表示し、コンパイルは安全な標準モデルで続行 */ }
    }
    json(`assets/${id}/models/item/forge/${style.id}.json`, model);
    json(`assets/${id}/items/forge/${style.id}.json`, { model: { type: "minecraft:model", model: `${id}:item/forge/${style.id}` } });
    json(`assets/${id}/items/forged_${style.id}.json`, { model: { type: "minecraft:model", model: `${id}:item/forge/${style.id}` } });
  }
  return files;
}
