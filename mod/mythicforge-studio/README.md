# MythicForge

コードを書かずに **Minecraft 1.21.11 (Fabric / Kotlin) の Mod** を作る Web アプリ。
ブロックを積んでスキルを設計し、アイテム・ブロック・モブ・実績・ショップを追加すると、Kotlin ソースと Gradle プロジェクトを生成し、ブラウザ上で静的解析・検証します。

## 機能
- **スキル**: トリガー → 条件 → アクション。待機/繰り返し/確率/変数/数値式、ミサイル、マナ・クールダウン、キー割り当て
- **アイテム / ブロック / モブ / レシピ**: 武器・防具・道具・食料、属性ボーナス、独自素材、鉱石、カスタムモブ、ドロップ表
- **拡張 (1.21.11)**: 復活エフェクト、進捗付き実績、取引画面のショップ、スキルポイント強化
- **ワールド生成**: 鉱石 / 地表クラスター (バイオーム指定)
- **解析**: モデル検証 + Kotlin の字句/シンボル/API 検査 + スキルシミュレーション
- **出力**: Gradle Wrapper 同梱の ZIP (IntelliJ でそのまま開ける)、GitHub Actions 設定付き

## 技術構成
| 層 | 内容 |
|---|---|
| Web | Next.js (App Router) + Tailwind、PostgreSQL + Drizzle (プロジェクト保存) |
| 生成 | `src/lib/mod/*` — `codegen.ts` (共通) / `codegenMojmap.ts` (1.21.11 Mojang名) / `extrasgen.ts` (拡張) / `gradleGen.ts` |
| 解析 | `src/lib/analyzer/*` — `pipeline.ts` (検証) / `kotlin.ts` (字句・シンボル) / `registry*.ts` (クラス辞書) |
| 環境 | `src/lib/mod/targets.ts` — プロファイル (1.21.11 Mojmap / 1.21.1 Yarn) と整合性チェック |

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
- 独自エンティティ (新モデル) / 構造物 / 独自 GUI 画面は未対応
- 拡張機能 (エフェクト/実績/ショップ/スキルポイント/属性ボーナス) は 1.21.11 プロファイル専用
- 地表・鉱石生成は新規チャンクのみ
