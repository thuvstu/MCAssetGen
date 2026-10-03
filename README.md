# MCAssetGen — Minecraft Asset Generators

Minecraft向けアセット生成スタジオ集。テクスチャ・3Dモデル・武器・SkyBlock・Modを
ブラウザで生成し、リソースパック / Blockbench / Fabric Mod として書き出す。

## グループ構成

| グループ | 内容 | 件数 |
|---|---|---|
| `3d-forge/` | 3Dボクセルモデル生成スタジオ | 8 |
| `skyblock/` | Hypixel SkyBlockテクスチャ鍛造所 | 4 |
| `texture/` | 汎用テクスチャ編集・強化・変換 | 5 |
| `weapons/` | 杖・剣の特化生成 | 3 |
| `mod/` | Fabric Modビルダー | 1 |

## 3d-forge/ — 3Dボクセル

| フォルダ | 概要 | 技術 |
|---|---|---|
| `minecraft-3d-model-generator (2)` | **VoxelForge Studio**(統合の基盤候補)。24刀種/強化派生/発光/UV/Blockbench・RP出力、テスト付き | Next.js+three |
| `minecraft-3d-asset-studio` | フル編集室。EvolutionLab/アトラス編集、**fabricMod/Bedrock/Java/OBJ出力**を持つ唯一の輸出核 | Next.js+three |
| `advanced-minecraft-model-generator` | 武器/防具/機械/遺物の進化生成。bbmodel/mc/rpの3種出力 | Next.js+three |
| `minecraft-3d-model-generator` | 和紙調UIのForge。**R3F+Drei+postprocessing**の高品質レンダリング | Next.js+R3F |
| `generate-json-3d-models` | プロンプト/装飾からJSONモデル生成。互換性検証・品質ゲート付き | Next.js+three |
| `minecraft-3d-model-generator (3)` | staff寄りVoxel forge。staffRig/浮遊/発光エフェクト | Next.js+three |
| `minecraft-3d-model-generator (1)` | スペック駆動の軽量生成器。魔法演出辞書付き | Next.js+three |
| `generate-3d-minecraft-models` | 画像→ボクセル変換の最小構成。Bedrock/Java両pack出力 | Vite(軽量) |

## skyblock/ — SkyBlock鍛造

| フォルダ | 概要 | 技術 |
|---|---|---|
| `hypixel-skyblock-texture-generator (1)` | **SkyForge本家**(統合の基盤)。ギャラリー/DB保存/72点Masterwork一括ZIP | Next.js+jimp |
| `skyblock-texture-pack-generator` | SKYBLOCK TEXTURE FORGE。鍛造テーマ+検証ツール群 | Vite |
| `hypixel-skyblock-texture-generator` | 64px武器ピクセル鍛造所。DBなし軽量Vite版 | Vite |

## texture/ — 汎用テクスチャ

| フォルダ | 概要 | 技術 |
|---|---|---|
| `minecraft-texture-enhancement-app (1)` | **TexCraft**(統合の基盤)。レイヤ/ForgeLab/武器工房/保存まで最多機能 | Vite |
| `minecraft-texture-enhancement-app` | PIXELFORGE。効果スタック+3Dプレビュー+McPack出力 | Vite+three |
| `pixel-art-conversion-apps` | 画像→ドット絵→MCテクスチャ変換。k-means減色/タイリング | Vite+three |
| `minecraft-texture-editor-app` | PIXELBLOOM最小エディタ。学習用サンプル | Vite |

## weapons/ — 杖・剣

| フォルダ | 概要 | 技術 |
|---|---|---|
| `minecraft-magic-staff-generator (1)` | **Arcane Forge**(杖の基盤)。要素/器種/レアリティの総合作成所 | Vite |
| `minecraft-magic-staff-generator` | Spellforge Atelier。4段階進化+Life Pack研究の配布pack設計 | Vite |
| `minecraft-sword-texture-maker` | **AegisBlade Studio**(剣の基盤)。42輪郭×部位ロック+ARCHITECTURE.md | Vite |

## mod/ — Mod出力

| フォルダ | 概要 | 技術 |
|---|---|---|
| `web-based-fabric-mod-builder` | **MythicCraft Studio**。MythicMobs式スキル+MCreator式ビジュアルでFabric/KotlinをZIP出力。全グループの最終出力口候補 | Next.js |

## 開発

各フォルダは独立プロジェクト:

```bash
cd <group>/<project>
npm install
npm run dev        # Next.jsは :3000、Viteは :5173 (重複時は --port 指定)
```

Next.js+Drizzle系(`3d-forge`の多く、`skyblock/(1)`、`mod`)はPostgresが必要。
各フォルダに`.env`で`DATABASE_URL`を設定すること。

## 統合ロードマップ

- 3D系: `(2)`を基盤に`3d-asset-studio`の輸出核・`R3F`レンダラ・魔法辞書・quantizeを移植
- Sky系: `(1)`を基盤に鍛造テーマ・検証ツール・軽量blueprintを取込み
- 汎用系: `(1)TexCraft`を基盤に3Dプレビュー・McPack・k-means変換を統合
- 武器系: 杖`#19`・剣`#20`を基盤に進化知見を移植(設計思想が別のため2本立て維持)
- Mod系: 全グループのpack出力を`MythicCraft`に集約

## 履歴

- 2026-10-04: 作り直し開始。旧リポジトリの破綻した統合物を白紙化し、
  素材21件のスナップショットから再出発(旧履歴は断絶)。Public化。

## 統合方針(重要)

- 見た目が似ていても各フォルダは**微量に異なる別物**(アセット・調整値・辞書・
  スクリプトが分岐)。例: `hypixel...(1)`と`...generator2`は同名65ファイルが
  異なり、後者は`bootstrap.ts`/`masterwork-pixels.ts`/`baseline-16x.txt`/
  独自export経路を持つ。`enhancement (1)`と`(2)`もeffects/presets/samplesの
  中身が異なり、後者はParts/Weapon特化のUI・ロジックを持つ。
- よって削除による統合はしない。**基盤アプリに独自要素を移植する方式**で統合し、
  移植元は移植完了の確認が取れるまで残す。移植記録は各基盤のREADMEに残す。
