import JSZip from "jszip";
import { exportToBlockbench } from "@/lib/exporters/blockbench";
import { exportBedrockAnimations } from "@/lib/exporters/minecraftBedrock";
import { exportToMinecraftJava } from "@/lib/exporters/minecraftJava";
import { generateProceduralAtlas } from "@/lib/generators/textureBaker";
import { buildVariant, buildVariantSet, stripVariantName } from "@/lib/variants/variantEngine";
import { ModelData, VariantState } from "@/types/model";

const MOD_ID = "mc3d_weapons";
const MOD_GROUP = "com.mc3dforge.weapons";
const MOD_VERSION = "1.0.0";
const MC_VERSION = "1.21.1";

const YARN_MAPPINGS = "1.21.1+build.3";
const LOADER_VERSION = "0.16.4";
const FABRIC_API_VERSION = "0.102.0+1.21.1";

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "") || "model";
}

function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

function javaClass(className: string, body: string): string {
  return `package ${MOD_GROUP};\n\n${body}`;
}

export interface FabricModResult {
  blob: Blob;
  fileName: string;
  itemCount: number;
}

/**
 * Builds a ready-to-compile Fabric Loom project containing one registered item per
 * generated model (base + tiers + limit breaks + forms), with java item models,
 * textures, translations and creative-tab entries.
 */
export async function exportFabricMod(base: ModelData, current: VariantState): Promise<FabricModResult> {
  const zip = new JSZip();
  const entries = buildVariantSet(current);
  const baseSlug = slug(stripVariantName(base.name));

  // ----- Gradle build files -----
  zip.file(
    "build.gradle",
    `plugins {
    id 'fabric-loom' version '1.7-SNAPSHOT'
    id 'maven-publish'
}

version = '${MOD_VERSION}'
group = '${MOD_GROUP}'
base { archivesName = '${baseSlug}' }

repositories { mavenCentral() }

dependencies {
    minecraft 'com.mojang:minecraft:\${project.minecraft_version}'
    mappings 'net.fabricmc:yarn:\${project.yarn_mappings}:v2'
    modImplementation 'net.fabricmc:fabric-loader:\${project.loader_version}'
    modImplementation 'net.fabricmc.fabric-api:fabric-api:\${project.fabric_version}'
}

processResources {
    inputs.property 'version', project.version
    filesMatching('fabric.mod.json') { expand 'version': project.version }
}

tasks.withType(JavaCompile).configureEach { it.options.release = 21 }

java {
    withSourcesJar()
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}
`,
  );

  zip.file(
    "settings.gradle",
    `pluginManagement {
    repositories {
        maven { name = 'Fabric'; url = 'https://maven.fabricmc.net/' }
        mavenCentral()
        gradlePluginPortal()
    }
}

rootProject.name = '${baseSlug}'
`,
  );

  zip.file(
    "gradle.properties",
    `org.gradle.jvmargs=-Xmx2G
org.gradle.parallel=true
minecraft_version=${MC_VERSION}
yarn_mappings=${YARN_MAPPINGS}
loader_version=${LOADER_VERSION}
fabric_version=${FABRIC_API_VERSION}
mod_version=${MOD_VERSION}
maven_group=${MOD_GROUP}
archives_base_name=${baseSlug}
`,
  );

  zip.file(
    "fabric.mod.json",
    JSON.stringify(
      {
        schemaVersion: 1,
        id: MOD_ID,
        version: "${version}",
        name: `${stripVariantName(base.name)} Pack`,
        description: `Generated weapons: ${entries.length} model variants (tiers, limit breaks and forms) built with Minecraft 3D Model Forge.`,
        authors: ["Minecraft 3D Model Forge"],
        license: "CC0-1.0",
        environment: "*",
        entrypoints: { main: [`${MOD_GROUP}.ModInit`], client: [`${MOD_GROUP}.ClientInit`] },
        depends: { fabricloader: ">=0.16.0", minecraft: `~${MC_VERSION}`, java: ">=21", "fabric-api": "*" },
      },
      null,
      2,
    ),
  );

  // ----- Java sources -----
  const itemKeys = entries.map((entry) => `${baseSlug}_${entry.key}`);
  const melee = base.category === "sword";
  const itemConsts = entries
    .map((entry, index) => {
      const glint = entry.state.limitBreak > 0;
      const rarity = entry.state.limitBreak >= 2 ? "EPIC" : entry.state.tier >= 3 || entry.state.limitBreak === 1 ? "RARE" : entry.state.tier >= 1 ? "UNCOMMON" : "COMMON";
      const factory = melee
        ? `melee(${3 + entry.state.tier + entry.state.limitBreak * 2}, ${(-2.4 + entry.state.limitBreak * 0.2).toFixed(1)}F, ${glint}, Rarity.${rarity})`
        : `basic(${glint}, Rarity.${rarity})`;
      return `    public static final Item ITEM_${index} = register("${itemKeys[index]}", ${factory});`;
    })
    .join("\n");

  zip.file(
    `src/main/java/${MOD_GROUP.replace(/\./g, "/")}/ModItems.java`,
    javaClass(
      "ModItems",
      `import java.util.ArrayList;
import java.util.List;
import net.minecraft.component.DataComponentTypes;
import net.minecraft.item.Item;
import net.minecraft.item.SwordItem;
import net.minecraft.item.ToolMaterials;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import net.minecraft.util.Rarity;

/** One registered item per generated model variant. ALL must be declared first (static init order). */
public final class ModItems {
    public static final List<Item> ALL = new ArrayList<>();

${itemConsts}

    private ModItems() {}

    /** Netherite-tier sword stats scaled by upgrade tier / limit break. */
    private static Item melee(int damage, float speed, boolean glint, Rarity rarity) {
        Item.Settings settings = new Item.Settings()
                .rarity(rarity)
                .fireproof()
                .attributeModifiers(SwordItem.createAttributeModifiers(ToolMaterials.NETHERITE, damage, speed));
        if (glint) settings = settings.component(DataComponentTypes.ENCHANTMENT_GLINT_OVERRIDE, true);
        return new SwordItem(ToolMaterials.NETHERITE, settings);
    }

    private static Item basic(boolean glint, Rarity rarity) {
        Item.Settings settings = new Item.Settings().maxCount(1).rarity(rarity).fireproof();
        if (glint) settings = settings.component(DataComponentTypes.ENCHANTMENT_GLINT_OVERRIDE, true);
        return new Item(settings);
    }

    private static Item register(String path, Item item) {
        ALL.add(item);
        return Registry.register(Registries.ITEM, Identifier.of("${MOD_ID}", path), item);
    }

    public static void initialize() {
        // Statically triggers item registration.
    }
}
`,
    ),
  );

  zip.file(
    `src/main/java/${MOD_GROUP.replace(/\./g, "/")}/ModCreativeTab.java`,
    javaClass(
      "ModCreativeTab",
      `import net.fabricmc.fabric.api.itemgroup.v1.FabricItemGroup;
import net.minecraft.item.ItemGroup;
import net.minecraft.item.ItemStack;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;

public final class ModCreativeTab {
    public static final ItemGroup GROUP = FabricItemGroup.builder()
            .icon(() -> new ItemStack(ModItems.ITEM_0))
            .displayName(Text.translatable("itemGroup.${MOD_ID}.group"))
            .entries((context, entries) -> ModItems.ALL.forEach(entries::add))
            .build();

    private ModCreativeTab() {}

    public static void initialize() {
        Registry.register(Registries.ITEM_GROUP, Identifier.of("${MOD_ID}", "group"), GROUP);
    }
}
`,
    ),
  );

  zip.file(
    `src/main/java/${MOD_GROUP.replace(/\./g, "/")}/ModInit.java`,
    javaClass(
      "ModInit",
      `import net.fabricmc.api.ModInitializer;

public class ModInit implements ModInitializer {
    @Override
    public void onInitialize() {
        ModItems.initialize();
        ModCreativeTab.initialize();
        System.out.println("[${MOD_ID}] loaded ${entries.length} model items");
    }
}
`,
    ),
  );

  zip.file(
    `src/main/java/${MOD_GROUP.replace(/\./g, "/")}/ClientInit.java`,
    javaClass(
      "ClientInit",
      `import net.fabricmc.api.ClientModInitializer;

/** Client-only hooks (custom animations / GeckoLib wiring can be added here). */
public class ClientInit implements ClientModInitializer {
    @Override
    public void onInitializeClient() {
        // Item models are resolved automatically from assets/${MOD_ID}/models/item/<id>.json
    }
}
`,
    ),
  );

  // ----- Assets: models, textures, language -----
  const langEn: Record<string, string> = { [`itemGroup.${MOD_ID}.group`]: "MC3D Forge Weapons" };
  const langJa: Record<string, string> = { [`itemGroup.${MOD_ID}.group`]: "MC3D フォージ武器" };

  entries.forEach((entry, index) => {
    const key = itemKeys[index];
    const variantModel = buildVariant(base, entry.state);
    const texture = generateProceduralAtlas(variantModel.palette, base.textureWidth, entry.state);

    zip.file(`src/main/resources/assets/${MOD_ID}/models/item/${key}.json`, exportToMinecraftJava(variantModel, `${MOD_ID}:item/${key}`));
    zip.file(`src/main/resources/assets/${MOD_ID}/textures/item/${key}.png`, dataUrlToBase64(texture), { base64: true });
    zip.file(`extras/blockbench/${key}.bbmodel`, exportToBlockbench(variantModel, texture));
    zip.file(`extras/animations/${key}.animation.json`, exportBedrockAnimations(variantModel));

    langEn[`item.${MOD_ID}.${key}`] = variantModel.name;
    langJa[`item.${MOD_ID}.${key}`] = variantModel.name;
  });

  zip.file(`src/main/resources/assets/${MOD_ID}/lang/en_us.json`, JSON.stringify(langEn, null, 2));
  zip.file(`src/main/resources/assets/${MOD_ID}/lang/ja_jp.json`, JSON.stringify(langJa, null, 2));

  // ----- README -----
  zip.file(
    "README.md",
    `# ${stripVariantName(base.name)} — Fabric Mod

Minecraft 3D Model Forge が生成した **${entries.length} 種**の武器モデルを持つ Fabric mod プロジェクトです。
Gradle プロジェクトとしてそのままビルドできます。

## ビルド手順

1. JDK 21 をインストールする（\`java -version\` で確認）
2. このフォルダで初回ビルド（Gradle Wrapper が無い場合はローカルの Gradle 8.8+ を使用）
   \`\`\`
   gradle build
   \`\`\`
3. 完成物は \`build/libs/${baseSlug}-${MOD_VERSION}.jar\`
4. \`%appdata%/.minecraft/mods/\` に jar を置き、**Fabric Loader ${LOADER_VERSION}+** と **Fabric API** を導入して起動
5. クリエイティブタブ「MC3D Forge Weapons」から各武器を取得

## 対応バージョン

| 項目 | 値 |
| --- | --- |
| Minecraft | ${MC_VERSION} |
| Fabric Loader | ${LOADER_VERSION}+ |
| Fabric API | ${FABRIC_API_VERSION} |
| Java | 21 |
| Mappings | Yarn ${YARN_MAPPINGS} |

## 構成

- \`src/main/resources/assets/${MOD_ID}/models/item/*.json\` — Java エディション用3Dモデル
- \`src/main/resources/assets/${MOD_ID}/textures/item/*.png\` — UVアトラステクスチャ
- \`src/main/resources/assets/${MOD_ID}/lang/\` — 英語 / 日本語 表示名
- \`extras/blockbench/*.bbmodel\` — Blockbench でそのまま編集できる元データ（アニメーション9本入り）
- \`extras/animations/*.animation.json\` — Bedrock 向けアニメーションデータ

## 自由に改造する場合

- **攻撃力 / スピードを付ける**: \`ModItems.java\` の \`new Item(...)\` を \`SwordItem\` やカスタムクラスに差し替え
- **インゲームアニメーション**: \`ClientInit\` に GeckoLib を導入し、\`extras/blockbench/*.bbmodel\` のキーフレームを移行
- **発光 / エンチャント風演出**: \`postEffect\` やカスタムレンダラを追加

> 近接系(刀剣/打撃/長柄/機械/邪悪/ブラッド)は \`SwordItem\`(ネザライト基準)として登録され、
> 強化段階・限界突破に応じて攻撃力・攻撃速度・レアリティ・エンチャント光沢が自動設定されます。
> 銃・弓・杖・魔導書・レリックは見た目用の \`Item\` です(射撃/魔法の挙動は別途実装が必要)。
`,
  );

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  return { blob, fileName: `${baseSlug}_fabric_mod.zip`, itemCount: entries.length };
}
