# MCAssetGen — Minecraft Asset Generators

Minecraft向けアセット生成スタジオ集。テクスチャ・3Dモデル・武器・SkyBlock・Modを
ブラウザで生成し、リソースパック / Blockbench / Fabric Mod として書き出す。

## グループ構成(統合後)

| グループ | 内容 | 構成 |
|---|---|---|
| `3d-forge/voxelforge-studio` | 3Dボクセル統合基盤。他7件のエンジン/データを移植済み | Next.js+three |
| `skyblock/` | SkyForge統合基盤 + Vite系2スタジオ | 3件 |
| `texture/texcraft` | 汎用テクスチャ統合基盤 | Vite |
| `weapons/` | 杖統合基盤(Arcane Forge)+剣(AegisBlade) | 2件 |
| `mod/` | Fabric Modビルダー(単独) | 1件 |

## 3d-forge/voxelforge-studio — 3D統合基盤

24刀種/強化派生/発光/UV/Blockbench・RP出力、テスト付き。
`src/lib/compat/` に他7件の移植資産:

| compat | 出所 | 内容 |
|---|---|---|
| `advanced-*` | advanced | 13テーマ/12伝説プリセット/7ジェネレータ(鎧/機械/遺物/武器/進化) |
| `spec-*` | (1) | 23種Spec/14魔法体系/WeaponApi9/パターン焼き |
| `forge-*` | 無印Forge | 20テーマ/18種/KINDS/GLB/セット出力/Forgeパネル系ロジック |
| `json-*` | gen-json | 39種カタログ/プロンプト推論/デコ62/輸出(bundle/datapack) |
| `forge3-*` | (3) | 24元型/12材質/進化/浮遊リグ/シード完成品/Blockbenchアニメ |
| `asset-*` | asset-studio | 46元型/解剖学/パーツLB/Bedrock/OBJ/fabricMod出力 |
| `voxel-*` | gen-3d | 画像押出/k-means減色/glTF/OBJ/Java+Bedrockパック |
| UI次段階 | 各兄弟 | MERGE_PLAN.mdのUI一覧を `components/studio/compat/` へ吸収予定 |

## skyblock/ — SkyBlock鍛造

| フォルダ | 概要 | 技術 |
|---|---|---|
| `hypixel-skyblock-texture-generator (1)` | **SkyForge統合基盤**。generator2の資産(bootstrap/単体export/ドリル18/メカワークス/デモ2種)を統合。S1エンジン+データ、S3 FORGE一式を参照モジュールとして内包 | Next.js+jimp |
| `hypixel-skyblock-texture-generator` | 64px武器ピクセル鍛造所。DBなし軽量Vite版(別実装のため維持) | Vite |
| `skyblock-texture-pack-generator` | SKYBLOCK TEXTURE FORGE。鍛造テーマ+検証ツール(別理論のため維持) | Vite |

## texture/texcraft — 汎用テクスチャ統合基盤

150エフェクト(内41はPIXELFORGE移植)/66プリセット(内44移植)/40+サンプル。
(2)のParts/Weapon、PIXELFORGEのMcPack/Bedrock/70手続きテクスチャ、
PIXELBLOOMの21ルック+変異表、変換器のk-means/8パレットを統合。smoke検証付き。

## weapons/ — 杖・剣

| フォルダ | 概要 | 技術 |
|---|---|---|
| `minecraft-magic-staff-generator` | **Spellforge Atelier(杖の本体)** | Vite |
| `minecraft-magic-staff-generator (1)` | Arcane Forge(別設計として併存) | Vite |
| `minecraft-sword-texture-maker` | **AegisBlade Studio**(分離維持)。42輪郭×部位ロック+ARCHITECTURE.md | Vite |

## mod/ — Mod出力

| フォルダ | 概要 | 技術 |
|---|---|---|
| `mod/mythicforge-studio` | **MythicForge**(Mojang-code Fabric Mod開発用) | Next.js |
| `mod/mythiccraft-studio` | **MythicCraft Studio**(MythicMobs連携・サーバー連携ハブ) | Next.js |

## 開発

各フォルダは独立プロジェクト:

```bash
cd <group>/<project>
npm install
npm run dev        # Next.jsは :3000、Viteは :5173 (重複時は --port 指定)
```

Next.js+Drizzle系はPostgresが必要。各フォルダに`.env`で`DATABASE_URL`を設定すること。

## 履歴

- 2026-10-04: 作り直し開始。旧リポジトリの破綻した統合物を白紙化し、
  素材21件のスナップショットから再出発(旧履歴は断絶)。Public化。
- texture群→texcraftに統合(150fx/66プリセット)、skyblock群→SkyForgeに統合、
  weapons-staff→Arcaneに統合、3d-forge群→voxelforge-studioに統合。
  詳細はMERGE_PLAN.md。各群の移植元は検証後に削除(履歴に保存)。
