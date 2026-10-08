# MythicForge

コードを書かずに **Minecraft 1.21.11 (Fabric / Kotlin) の Mod** を作る Web アプリ。
ブロックを積んでスキルを設計し、アイテム・ブロック・モブ・実績・ショップを追加すると、Kotlin ソースと Gradle プロジェクトを生成し、ブラウザ上で静的解析・検証します。

## 機能
- **スキル**: トリガー → 条件 → アクション。待機/繰り返し/確率/変数/数値式、ミサイル、マナ・クールダウン、キー割り当て
- **アイテム / ブロック / モブ / レシピ**: 武器・防具・道具・食料、属性ボーナス、独自素材、鉱石、カスタムモブ、ドロップ表
- **拡張 (1.21.11)**: 復活エフェクト、進捗付き実績、取引画面のショップ、スキルポイント強化
- **ワールド生成**: 鉱石 / 地表クラスター (バイオーム指定)
- **ゲーム内武器工房 (1.21.11)**: 起動時に武器素体・鍛冶台・見た目候補ごとのアイテムIDを登録。バニラのチェスト型画面で見た目・素材・スキル・性能を選び、材料を消費して個別の武器を鍛造。PNG・BlockbenchのJavaモデルJSONをWebで同梱できます。
- **解析**: モデル検証 + Kotlin の字句/シンボル/API 検査 + スキルシミュレーション
- **出力**: Gradle Wrapper 同梱の ZIP (IntelliJ でそのまま開ける)、GitHub Actions 設定付き

## 技術構成
| 層 | 内容 |
|---|---|
| Web | Next.js (App Router) + Tailwind、PostgreSQL + Drizzle (プロジェクト保存) |
| Domain | `src/lib/mod/model/*` — プロジェクト/スキル/RPG拡張/武器工房・構造物の型。`types.ts` は互換barrel |
| Catalog | `src/lib/mod/catalog/*` — Minecraft定数 / アクションスキーマ / ファクトリ・プリセット。`catalog.ts` は互換barrel |
| Kotlin生成 | `src/lib/mod/codegen/*` — shared(リテラル) / kotlin(import解決) / runtime / skills / content / mobs / resources / supportFiles / projectFiles |
| Features | `weaponForge.ts` / `extrasgen.ts` / `structuresGen.ts` / `nbt.ts` — 独立機能の生成・検証 |
| 解析 | `src/lib/analyzer/` — lexer(字句) / kotlin(シンボル・API検査) / projectValidator(整合性) / pipeline(段階調停) / simulator / completeness |
| 環境 | `src/lib/mod/targets.ts` — プロファイル (1.21.11 Mojmap / 1.21.1 Yarn) と整合性チェック |
| Editor state | `src/components/editor/useProjectEditor.ts` — 読込・正規化・undo/redo・自動保存・遅延解析 |

### 設計上の依存方向

`UI → Domain/Catalog → Analyzer or Codegen → Generated Project`

- 生成方言 (`mojmap` / `yarn`) はすべて明示引数で伝搬し、グローバル可変状態を使用しません。
- Kotlin import解決 (`codegen/kotlin.ts`) とプロジェクト検証 (`projectValidator.ts`) は独立しています。
- 機能追加は既存の巨大ファイルへ追記せず、Feature/Generatorモジュールとして追加します。

## 開発
```bash
npm install
npx drizzle-kit push        # DB スキーマ反映
npm run dev
npx tsx scripts/verify.ts   # 全プリセット × 全プロファイルの回帰検証
npx tsx scripts/verify.ts --out /tmp/kv && cd /tmp/kv && ./gradlew build   # 生成物の実コンパイル
```
環境変数: `DATABASE_URL` (必須)、`ENABLE_SERVER_COMPILE=1` と JDK 21 / Gradle でアプリ内ビルドが有効化。

## 検証の方針
生成する Kotlin の Minecraft API 名は、公式マッピング (`server.txt`) と実 jar の `javap` で署名を確認したものだけを使います。
変更時は `scripts/verify.ts` と実コンパイルで確認してください。ゲーム内の挙動 (バランス・見た目) は実プレイでの確認が必要です。

## 既知の制限
- ゲーム内鍛冶台で武器を新規作成できますが、Minecraftの静的レジストリの制約により**起動後に任意の新アイテムIDを登録することはできません**。見た目候補ごとの登録ID・PNG・3DモデルはModのビルド時に同梱し、名前・能力値・スキルは武器個体のItemStackに保存します。新しい見た目を追加したらModを再ビルドし、全クライアントに同じjarを配布してください。
- 独自エンティティ (新モデル) / 構造物 / 独自 GUI 画面は未対応
- 拡張機能 (エフェクト/実績/ショップ/スキルポイント/属性ボーナス) は 1.21.11 プロファイル専用
- 地表・鉱石生成は新規チャンクのみ
