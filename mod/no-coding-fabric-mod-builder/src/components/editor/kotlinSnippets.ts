/**
 * Custom Kotlin snippets for the visual editor.
 * Written with 1.21.11 Mojang official mapping names
 * (ServerPlayer / ServerLevel / Component / Identifier.fromNamespaceAndPath).
 * Each entry lists required imports so the editor can add them automatically.
 */
export interface KotlinSnippet {
  label: string;
  code: string;
  imports: string[];
}

export const KOTLIN_SNIPPETS: KotlinSnippet[] = [
  {
    label: "チャットへ送信",
    code: 'ctx.player.sendSystemMessage(Component.literal("Hello"))',
    imports: ["net.minecraft.network.chat.Component"],
  },
  {
    label: "アクションバーへ送信",
    code: 'ctx.player.displayClientMessage(Component.literal("MP " + SkillManager.getMana(ctx.player)), true)',
    imports: ["net.minecraft.network.chat.Component"],
  },
  {
    label: "視線の敵のHP表示",
    code: `ctx.target?.let {
    ctx.player.sendSystemMessage(Component.literal(it.name.string + " HP " + it.health.toInt() + "/" + it.maxHealth.toInt()))
}`,
    imports: ["net.minecraft.network.chat.Component"],
  },
  {
    label: "周囲の敵へ追加ダメージ",
    code: `for (e in ctx.entities(TargetMode.AREA, 5.0)) {
    e.hurt(ctx.world.damageSources().playerAttack(ctx.player), 2.0f)
}`,
    imports: [],
  },
  {
    label: "周囲の敵をスロウ",
    code: `for (e in ctx.entities(TargetMode.AREA, 6.0)) {
    e.addEffect(MobEffectInstance(MobEffects.SLOWNESS, 100, 1))
}`,
    imports: ["net.minecraft.world.effect.MobEffectInstance", "net.minecraft.world.effect.MobEffects"],
  },
  {
    label: "足元に円形パーティクル",
    code: `val base = ctx.player.position()
for (k in 0 until 24) {
    val a = Math.PI * 2.0 * k / 24
    ctx.world.sendParticles(ParticleTypes.END_ROD, base.x + Math.cos(a) * 2.0, base.y + 0.2, base.z + Math.sin(a) * 2.0, 1, 0.0, 0.0, 0.0, 0.0)
}`,
    imports: ["net.minecraft.core.particles.ParticleTypes"],
  },
  {
    label: "自分の防具を確認",
    code: `for (slot in listOf(EquipmentSlot.HEAD, EquipmentSlot.CHEST, EquipmentSlot.LEGS, EquipmentSlot.FEET)) {
    val stack = ctx.player.getItemBySlot(slot)
    if (!stack.isEmpty) ctx.player.sendSystemMessage(Component.literal(slot.name + ": " + stack.hoverName.string))
}`,
    imports: ["net.minecraft.network.chat.Component", "net.minecraft.world.entity.EquipmentSlot"],
  },
  {
    label: "手持ちの耐久を減らす",
    code: `val durabilityHeld = ctx.player.mainHandItem
if (durabilityHeld.isDamageableItem) durabilityHeld.hurtAndBreak(1, ctx.player, EquipmentSlot.MAINHAND)`,
    imports: ["net.minecraft.world.entity.EquipmentSlot"],
  },
  {
    label: "手持ちを消費する",
    code: `val consumed = ctx.player.mainHandItem
if (!consumed.isEmpty && !ctx.player.isCreative) consumed.shrink(1)`,
    imports: [],
  },
  {
    label: "経験値を与える",
    code: "ctx.player.giveExperiencePoints(10)",
    imports: [],
  },
  {
    label: "満腹度を回復",
    code: "ctx.player.foodData.eat(6, 0.5f)",
    imports: [],
  },
  {
    label: "天候を晴にする",
    code: "ctx.world.server.overworld().setWeatherParameters(6000, 0, false, false)",
    imports: [],
  },
  {
    label: "近くのアイテムエンティティを回収",
    code: `val box = ctx.player.boundingBox.inflate(4.0)
for (e in ctx.world.getEntitiesOfClass(net.minecraft.world.entity.item.ItemEntity::class.java, box) { it.isAlive }) {
    val taken = e.item.copy()
    e.discard()
    ctx.player.inventory.placeItemBackInInventory(taken)
}`,
    imports: ["net.minecraft.world.entity.item.ItemEntity"],
  },
  {
    label: "変数を読み書き",
    code: `Variables.add(ctx, "SELF", "combo", 1.0, 0.0, 100.0)
val combo = Variables.get(ctx, "SELF", "combo").toInt()
ctx.player.displayClientMessage(Component.literal("combo " + combo), true)`,
    imports: ["net.minecraft.network.chat.Component"],
  },
  {
    label: "コールドダウンをリセット",
    code: 'SkillManager.resetCooldown(ctx.player, "skill_id")',
    imports: [],
  },
];
