import type { ArmorParams, PartId } from "./armor-types";
import { PART_LABELS } from "./armor-types";

export const PARTS: PartId[] = ["helmet", "chest", "leggings", "boots"];

export const SLOT_NAME: Record<PartId, string> = {
  helmet: "HELMET",
  chest: "CHESTPLATE",
  leggings: "LEGGINGS",
  boots: "BOOTS",
};

const EN_PART: Record<PartId, string> = {
  helmet: "Helmet",
  chest: "Chestplate",
  leggings: "Leggings",
  boots: "Boots",
};

export function sanitizeId(input: string, fallback: string): string {
  const value = input.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  return value ? /^[a-z]/.test(value) ? value : `a_${value}` : fallback;
}

export function toPascal(id: string): string {
  return id.split("_").filter(Boolean).map((word) => word[0].toUpperCase() + word.slice(1)).join("");
}

export function itemId(params: ArmorParams, part: PartId): string {
  return `${params.armorId}_${part}`;
}

export function equipmentJson(params: ArmorParams): string {
  const texture = `${params.namespace}:${params.armorId}`;
  return JSON.stringify({
    layers: {
      humanoid: [{ texture }],
      humanoid_leggings: [{ texture }],
    },
  }, null, 2);
}

export function itemModelJson(params: ArmorParams, part: PartId): string {
  return JSON.stringify({
    parent: "minecraft:item/generated",
    textures: { layer0: `${params.namespace}:item/${itemId(params, part)}` },
  }, null, 2);
}

export function itemDefinitionJson(params: ArmorParams, part: PartId): string {
  return JSON.stringify({
    model: { type: "minecraft:model", model: `${params.namespace}:item/${itemId(params, part)}` },
  }, null, 2);
}

export function langJson(params: ArmorParams, locale: "en_us" | "ja_jp"): string {
  const result: Record<string, string> = {};
  for (const part of PARTS) {
    result[`item.${params.namespace}.${itemId(params, part)}`] = locale === "ja_jp"
      ? `${params.displayName}の${PART_LABELS[part]}`
      : `${params.displayName} ${EN_PART[part]}`;
  }
  return JSON.stringify(result, null, 2);
}

export function repairTagJson(): string {
  return JSON.stringify({ replace: false, values: ["minecraft:iron_ingot"] }, null, 2);
}

/** The registry is the same for vanilla and Geo items; only the item class changes. */
export function armorJava(params: ArmorParams): string {
  const cls = `${toPascal(params.armorId)}Armor`;
  const itemClass = `${toPascal(params.armorId)}GeoItem`;
  const ns = params.namespace;
  const registers = PARTS.map((part) => {
    const field = part === "chest" ? "CHESTPLATE" : SLOT_NAME[part];
    return `    public static final Item ${field} = register("${itemId(params, part)}", EquipmentType.${SLOT_NAME[part]});`;
  }).join("\n");
  return `package com.example.${ns};

// Fabric 1.21.11 / Yarn mappings. Call ${cls}.initialize() from ModInitializer.
import java.util.Map;
import net.minecraft.item.Item;
import net.minecraft.item.equipment.ArmorMaterial;
import net.minecraft.item.equipment.EquipmentAsset;
import net.minecraft.item.equipment.EquipmentAssetKeys;
import net.minecraft.item.equipment.EquipmentType;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.registry.tag.TagKey;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.Identifier;

public final class ${cls} {
    public static final String MOD_ID = "${ns}";
    private static final int DURABILITY = 30;
    public static final RegistryKey<EquipmentAsset> ASSET = RegistryKey.of(
            EquipmentAssetKeys.REGISTRY_KEY, Identifier.of(MOD_ID, "${params.armorId}"));
    private static final TagKey<Item> REPAIR = TagKey.of(
            RegistryKeys.ITEM, Identifier.of(MOD_ID, "repairs_${params.armorId}"));

    public static final ArmorMaterial MATERIAL = new ArmorMaterial(
            DURABILITY,
            Map.of(EquipmentType.HELMET, 3, EquipmentType.CHESTPLATE, 8,
                   EquipmentType.LEGGINGS, 6, EquipmentType.BOOTS, 3),
            15, SoundEvents.ITEM_ARMOR_EQUIP_IRON, 2.0F, 0.0F, REPAIR, ASSET);

${registers}

    private static Item register(String name, EquipmentType type) {
        RegistryKey<Item> key = RegistryKey.of(RegistryKeys.ITEM, Identifier.of(MOD_ID, name));
        Item.Settings settings = new Item.Settings().registryKey(key)
                .armor(MATERIAL, type).maxDamage(type.getMaxDamage(DURABILITY));
        return Registry.register(Registries.ITEM, key, ${params.includeGeckolib ? `new ${itemClass}(settings)` : "new Item(settings)"});
    }

    public static void initialize() { /* Static fields perform registration. */ }
}
`;
}

/** Static GeoItem: no animation controllers, only custom equipment geometry. */
export function geckoItemJava(params: ArmorParams): string {
  const name = `${toPascal(params.armorId)}GeoItem`;
  const renderer = `${toPascal(params.armorId)}ArmorRenderer`;
  return `package com.example.${params.namespace};

// GeckoLib 5.x / Fabric. Put the renderer in client sources when split sources are enabled.
import java.util.function.Consumer;
import net.minecraft.entity.EquipmentSlot;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import software.bernie.geckolib.animatable.GeoItem;
import software.bernie.geckolib.animatable.client.GeoRenderProvider;
import software.bernie.geckolib.animatable.instance.AnimatableInstanceCache;
import software.bernie.geckolib.animatable.manager.AnimatableManager;
import software.bernie.geckolib.renderer.GeoArmorRenderer;
import software.bernie.geckolib.util.GeckoLibUtil;

public final class ${name} extends Item implements GeoItem {
    private final AnimatableInstanceCache cache = GeckoLibUtil.createInstanceCache(this);

    public ${name}(Settings settings) {
        super(settings);
    }

    @Override
    public void createGeoRenderer(Consumer<GeoRenderProvider> consumer) {
        consumer.accept(new GeoRenderProvider() {
            private ${renderer} renderer;

            @Override
            public GeoArmorRenderer getGeoArmorRenderer(ItemStack stack, EquipmentSlot slot) {
                if (this.renderer == null) this.renderer = new ${renderer}();
                return this.renderer;
            }
        });
    }

    @Override
    public void registerControllers(AnimatableManager.ControllerRegistrar controllers) {
        // Geometry only. Add controllers later if this set needs animations.
    }

    @Override
    public AnimatableInstanceCache getAnimatableInstanceCache() {
        return this.cache;
    }
}
`;
}

export function geckoRendererJava(params: ArmorParams): string {
  const renderer = `${toPascal(params.armorId)}ArmorRenderer`;
  return `package com.example.${params.namespace};

// GeckoLib 5.4+ maps armorHead, armorBody, armorRightArm/LeftArm,
// armorRightLeg/LeftLeg, armorRightBoot/LeftBoot to equipment slots.
import net.minecraft.util.Identifier;
import software.bernie.geckolib.model.DefaultedItemGeoModel;
import software.bernie.geckolib.renderer.GeoArmorRenderer;

@SuppressWarnings({"rawtypes", "unchecked"})
public final class ${renderer} extends GeoArmorRenderer {
    public ${renderer}() {
        // geo/item/armor/${params.armorId}.geo.json
        // textures/item/armor/${params.armorId}.png
        super(new DefaultedItemGeoModel<>(Identifier.of("${params.namespace}", "armor/${params.armorId}")));
    }
}
`;
}

export function readme(params: ArmorParams, geoSize = 256): string {
  const ns = params.namespace;
  const id = params.armorId;
  const cls = `${toPascal(id)}Armor`;
  return `# ${params.displayName} - ${ns}:${id}

対象: Minecraft Java 1.21.11 / Fabric。ZIPの \`assets/\` と \`data/\` を MOD の \`src/main/resources/\` にコピーしてください。

## 出力内容

- \`assets/${ns}/textures/entity/equipment/humanoid/${id}.png\` (64x32): バニラ表示の頭・胴・ブーツ
- \`assets/${ns}/textures/entity/equipment/humanoid_leggings/${id}.png\` (64x32): バニラ表示のレギンス
- \`assets/${ns}/equipment/${id}.json\`: 装備アセット定義
- \`textures/item/\` 4点、\`models/item/\` 4点、\`items/\` 4点、\`lang/\` 2点
- \`data/${ns}/tags/item/repairs_${id}.json\`: 修理素材タグ（初期値: 鉄インゴット）
- \`reference/\`: バニラUVのガイドと白紙テンプレート（Minecraftには読み込まれません）
${params.includeGeckolib ? `- \`assets/${ns}/geo/item/armor/${id}.geo.json\`: 8装備ボーン・角・面頬・肩当てなどを含む実モデル
- \`assets/${ns}/textures/item/armor/${id}.png\` (${geoSize}x${geoSize}): 上記モデルとUVが一致する専用テクスチャ（各キューブを個別の島に展開）
- \`assets/${ns}/animations/item/armor/${id}.animation.json\`: 静的モデル用の空の定義（アニメーションは実装していません）
` : ""}${params.includeJava ? `- \`java/com/example/${ns}/${cls}.java\`: アイテム登録の参考コード${params.includeGeckolib ? `、${toPascal(id)}GeoItem.java、${toPascal(id)}ArmorRenderer.java` : ""}
` : ""}
## バニラとGeoの違い

バニラ用の64x32テクスチャだけでは、角や立体的な面頬を追加できません。プレビューの「VANILLA / UV」はその制約下の見た目です。${params.includeGeckolib ? "角などの立体造形は、GeoItem と GeoRenderProvider を使って装備時に GeoArmorRenderer で描画した場合にのみ表示されます。GEOプレビューと .geo.json は同じキューブ定義を使っています。" : "このZIPにはGeoモデルを含めていません。"}

${params.includeGeckolib ? `## GeckoLib 5 / Fabric での組み込み

1. Fabric 1.21.11に対応したGeckoLib 5.4系をMODの依存関係に追加し、\`fabric.mod.json\` の依存関係にも記載してください。
2. \`assets/\` と \`data/\` を \`src/main/resources/\` にコピーします。
3. 参考Javaのpackageを既存MODに合わせ、\`ModInitializer\` から \`${cls}.initialize()\` を呼びます。split sourcesならRendererはクライアント側のソースに置いてください。
4. GeoItemの \`getGeoArmorRenderer(ItemStack, EquipmentSlot)\` からRendererを返します。8つの装備ボーン名はGeckoLib 5.4系が認識する名前です。
5. \`.geo.json\` はBlockbenchでインポートして調整可能です。インベントリ内アイコンは従来のitemモデルを使用します。

JavaはGeckoLib 5.4系 / Yarn 1.21.11のソースを参照したサンプルです。このWebツール上でJavaやゲーム内動作はコンパイル・検証していません。導入先のマッピングとJarのAPIに合わせて確認してください。

` : ""}## 注意

- バニラ用64x32とGeo用UVアトラスは別画像です。片方を読み込んでももう片方は書き換わりません。
- 「顔を見せる」ではバニラ用の目元を透明にしています。素体の顔が透けます。
- 明るい眼や熔岩の亀裂は絵としての明色であり、発光シェーダーではありません。
`;
}