import type { GeneratedFile, ModProject } from "../model";
import type { TargetEnv } from "../targets";

export function generateSupportFiles(project: ModProject, env: TargetEnv): GeneratedFile[] {
  const output: GeneratedFile[] = [];
  const meta = project.meta;
  const FABRIC = env;
  const moj = env.mappings === "mojmap";
  output.push({ path: ".gitignore", kind: "text", content: `.gradle/
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
  output.push({ path: ".github/workflows/build.yml", kind: "text", content: `name: build
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
  const list = (arr: string[]) => (arr.length ? arr.map((x) => `- ${x}`).join("\n") : "- (なし)");
  output.push({ path: "README.md", kind: "text", content: `# ${meta.name}

MythicForge が生成した Minecraft ${FABRIC.minecraft} Fabric Mod (Kotlin) です。

## ビルド環境 (プロファイル: ${FABRIC.profile})
| 項目 | 値 |
|---|---|
| Minecraft | ${FABRIC.minecraft} |
| マッピング | ${FABRIC.mappings === "mojmap" ? "Mojang 公式 (loom.officialMojangMappings)" : `Yarn ${FABRIC.yarn}`} |
| Fabric Loom | ${FABRIC.loom} (プラグインID: \`${FABRIC.loomPlugin}\`) |
| Gradle Wrapper | ${FABRIC.gradle} |
| Fabric Loader / API | ${FABRIC.loader} / ${FABRIC.fabricApi} |
| Kotlin / FLK | ${FABRIC.kotlin} / ${FABRIC.kotlinLoader} |
| Java | ${FABRIC.java} |

${FABRIC.mappings === "mojmap" ? "> カスタムKotlinは **Mojang 名** (例: `ServerPlayer`, `Level`, `Identifier.fromNamespaceAndPath`) で書いてください。Yarn 名 (`ServerPlayerEntity` など) と混ぜるとコンパイルできません。\n" : ""}
## この Mod に含まれるもの
**スキル (${project.skills.length})**
${list(project.skills.map((x) => `\`${x.id}\` ${x.name} — ${x.trigger.type === "MANUAL" ? "手動" : x.trigger.type} / CD ${x.cooldown}s / MP ${x.manaCost}`))}

**アイテム (${project.items.length})** — うち防具 ${armors.length}
${list(project.items.map((x) => `\`${meta.modId}:${x.id}\` ${x.name} (${x.kind})`))}

**ブロック (${project.blocks.length})** — うち鉱石 ${ores.length}
${list(project.blocks.map((x) => `\`${meta.modId}:${x.id}\` ${x.name}${x.ore ? ` — 鉱石 (${x.ore.dimension}, Y ${x.ore.minY}〜${x.ore.maxY}, ${x.ore.veinsPerChunk}脈/チャンク, 脈サイズ${x.ore.veinSize})` : ""}`))}

**レシピ (${project.recipes.length})**
${list(project.recipes.map((x) => `\`${x.id}\` → ${x.resultItem} x${x.resultCount}`))}

${moj && project.forge?.enabled ? `**ゲーム内武器工房 (${project.forge.styles.length}種類の外見)**
武器素体 \`${meta.modId}:forged_weapon\`、鍛冶台ブロック \`${meta.modId}:weapon_forge\` と、外見ごとの登録アイテムIDを起動時に追加します。
${list(project.forge.styles.map((style) => `\`${meta.modId}:forged_${style.id}\` ${style.name} (材料: ${style.costItem} x${style.costCount})`))}

武器工房ブロックを右クリックするか \`/forge open\` で画面を開き、外見・素材・スキル・攻撃力・速度・耐久を選んで右下の「鍛造」を押します。
武器名は \`/forge name <名前>\`。ほかのコマンド: \`/forge style <id>\`、\`/forge material <tier>\`、\`/forge skill <id/none>\`、\`/forge shift <id/none>\`、\`/forge left <id/none>\`、\`/forge create\`。

> 注意: ゲーム起動後に新しい登録ID・PNG・モデルを追加することはできません。外見を追加した時はModを再ビルドし、導入先の全クライアントに同じjarを配布してください。ゲーム中に作る武器の個体差(名前/性能/スキル)はItemStackに保存されます。

` : ""}## 主な機能
- **スキル発動**: アイテム/ブロックの右クリック、キースロット(既定 R/G/H/V)、\`/skill cast <id>\`
- **ミサイル**: 毎tick飛翔する弾。着弾点を origin としてスキルを発動
- **変数**: \`setVar/addVar/ifVar\`、条件 \`VARIABLE\`、テキスト内 \`<var.x> <target.x> <global.x> <player> <mana> <health>\`。ワールドの \`mythicforge_vars.json\` に保存
- **マナ**: HUD表示 + パケット同期 + ワールドに保存
- **防具**: 素材(LEATHER〜NETHERITE/TURTLE)に応じた防御力・見た目。装備中トリガー(WEAR)でセット効果
- **鉱石**: ドロップ設定(幸運/シルクタッチ/爆発減衰)とワールド生成(新規チャンクのみ)
- **設定**: \`config/${meta.modId}.json\`

## ビルド方法
### IntelliJ IDEA (推奨)
1. このフォルダを **プロジェクトとして開く** (build.gradle.kts を選択 → "Open as Project")
2. **JDK 21 を用意**: File > Project Structure > SDKs で追加、無ければ "Download JDK" で Temurin 21
3. **Gradle JVM を 21 に**: File > Settings > Build, Execution, Deployment > Build Tools > Gradle > **Gradle JVM = 21**
4. Gradle タブの 🔄 を実行 (初回は Minecraft のダウンロードと変換で数分かかります)
5. 実行構成 **Minecraft Client / Minecraft Server** が自動生成されます。\`build\` タスクで \`build/libs/${meta.modId}-${meta.version}.jar\` が出力されます

> ❗ \`This build uses a Java 8 JVM\` / \`Dependency requires at least JVM runtime version 21\` と出た場合は手順3の Gradle JVM が古い JDK のままです。

### コマンドライン
\`\`\`
# JDK 21 を JAVA_HOME に設定
./gradlew build          # Windows: gradlew.bat build
./gradlew runClient      # 開発用クライアント起動
./gradlew runServer      # 開発用サーバー (初回は run/eula.txt の eula=true が必要)
\`\`\`
Gradle Wrapper (${FABRIC.gradle}) 同梱のため Gradle のインストールは不要です。

### GitHub Actions
push するだけで \`.github/workflows/build.yml\` がビルドし、Artifacts に jar を出力します。

## 導入
Fabric Loader ${FABRIC.loader}+ / Fabric API / Fabric Language Kotlin を入れた \`mods/\` に jar を配置してください。

## ゲーム内コマンド
\`\`\`
/skill cast <id>   # スキル発動 (OP)
/skill list        # スキル一覧
/skill mana        # マナ確認
/skill slots       # キースロット割り当て
/shop <id>          # ショップ (取引画面) を開く  ※1.21.11
/sp                 # スキルポイント一覧 / /sp buy <id> で強化  ※1.21.11
/${meta.modId} spawn <mob>  # カスタムモブを召喚
\`\`\`

## テクスチャ
アップロードしたPNGは \`assets/${meta.modId}/textures/{item,block}/\` に出力されます。未アップロードの要素はバニラのテクスチャを参照します。
` });
  return output;
}
