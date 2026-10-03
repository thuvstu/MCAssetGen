# VoxelForge Studio

Minecraft向けのキューブモデルを作る Next.js App Router / PostgreSQL / Drizzle アプリです。外部生成AIやAPIキーなしで動作する、決定的なテンプレート式生成エンジンです。

## 制作機能

- 24形状、5カテゴリ、検索可能なカタログ
- +0〜+5、限界突破、封印／解放、オーバードライブ、同テーマの派生モデル
- 可動機構を含む13発動モーションと5浮遊物モーション
- 9種類の有効エフェクト（点光源と粒子はアプリ内プレビューのみ）
- 縦／横／斜め／放射グラデーション、段階色、ミックス／乗算。PNGへ焼き込み
- 10種類の装飾パーツを追加、位置・倍率・素材・浮遊・発光を指定
- クリック選択、アウトライナー、位置／サイズ／塗り／発光、複製・非表示・追加キューブ
- 非破壊編集レシピと32ステップのUndo／Redo。編集内容をDBに保存
- Blockbench、PNG、Java 1.21.4リソースパック、Custom Model Dataバリアント一式の書き出し

## 構成

- `src/lib/template-catalog.ts`: 寸法、カテゴリ、デフォルトモーション、バニラ置換アイテム
- `src/lib/model-types.ts`: 共通型と選択肢の単一ソース
- `src/lib/geometry`: 形状、共通プリミティブ、強化モディファイア、後付けパーツ
- `src/lib/model-generator.ts`: UV・生成・編集適用・テクスチャ仕上げのパイプライン
- `src/lib/editor-recipe.ts`: 部品単位の非破壊編集
- `src/lib/texture-finishing.ts`: 共有パッチを使うグラデーション／塗りのPNG焼き込み
- `src/lib/animation`: プレビューとBlockbenchが共有するキーフレーム定義
- `src/lib/export`: 形式別のシリアライズ
- `src/components/viewport`: バッチ描画、クリック選択、可動パーツ、軽量粒子
- `src/components/studio`: 生成／仕上げ／パーツ編集、履歴、保存、各パネル
- `src/db/schema.ts`: `voxel_projects`（設定とモデルのJSONB。追加の編集設定も同じスキーマ）

## 性能方針

数百キューブをキューブごとに描かず、レイヤー・可動機構・材質別にメッシュを結合します。面インデックスに対応する部品名を保持するため、まとめ描画でも個別選択できます。静止時は描画更新を省き、非表示タブ・非表示ページでは描画を停止。編集時は同じPNGテクスチャを再利用します。生成側の基本アトラスとアップロード画像サンプルは容量制限付きキャッシュで再利用し、履歴・パーツ数・入力サイズにも上限を設けています。

## 開発・検証

環境の `DATABASE_URL` を使用します。テーブルは環境を起動した後 `npx drizzle-kit push` で反映してください。

- ユニットテスト: `npx vitest run`
- 型生成: `npx next typegen`
- TypeScript: `npm exec tsc -- --noEmit --pretty false`
- 本番ビルド: `npm run build`
- 稼働中アプリの回帰操作: `node scripts/verify.mjs`
- APIと書き出しの回帰テスト: `node scripts/verify-api.mjs`
- 新ワークショップ操作: `node scripts/verify-workshop.mjs`

ブラウザテストにはChromiumとPlaywrightのOS依存パッケージが必要です。テストは自身が作ったプロジェクトのみ削除し、既存のユーザーモデルは削除しません。

## 書き出しの制限

Minecraft Javaのアイテムモデルは静止モデルです。プレビューの粒子・点光源・アニメーションはバニラのアイテムモデルでは再生されません。アニメーション付き `.bbmodel` はGeneric Model、静止 `.bbmodel` はJava Block/Itemとして出力します。パーツの塗りとグラデーションはPNGにも反映されます。ゲーム内の武器の性能は変更しません。バリアントはCustom Model Dataの番号を書き換えて切り替えます。コードによるゲーム内制御、Bedrock変換や高度なメッシュ編集には別途データパック／プラグイン／Blockbenchが必要です。
