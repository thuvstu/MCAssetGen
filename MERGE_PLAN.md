# MCAssetGen 統合計画 (MERGE_PLAN)

方針: 各フォルダの微量な差分(アセット・調整値・辞書)は全て残す。
基盤アプリに独自要素を移植し、検証後に移植元フォルダは削除する。
削除による統合はしない。移植記録は本ファイルに残す。

## グループと基盤

| 群 | 基盤 | 移植元 | 状態 |
|---|---|---|---|
| texture | `texture/texcraft` (旧`minecraft-texture-enhancement-app (1)`) | enhancement無印、(2)、editor、pixel-art | **完了** |
| skyblock | `skyblock/hypixel-skyblock-texture-generator (1)` (SkyForge) | generator2(完了・削除済)、無印・pack-generator(エンジン+データ保存、UIは残置) | **部分完了** |
| weapons-staff | `weapons/minecraft-magic-staff-generator` (**Spellforge・杖の本体**) + `(1)`Arcane(別設計として併存) | 完了(復元済み) |
| 3d-forge | `3d-forge/voxelforge-studio` (旧`(2)`) | 他7件(完了・削除済) | **完了(エンジン/データ/輸出)/UIは次段階** |
| mod | `mod/web-based-fabric-mod-builder` (単独維持) | なし | — |

---

## texture群 → TexCraft基盤

### (2) → 基盤【最優先・ほぼそのまま移植可】
1. `src/lib/parts.ts` → 新規追加(依存はtex.tsのみ)
2. `src/lib/weapon.ts` → 新規追加(STAGES/FORMS/MODES)
3. `effects.ts`末尾22エフェクト(edgewear〜partstamp)→追記+`CATEGORIES`にparts追加+parts import追加(EXTRA_EFFECTS維持)
4. `presets.ts`末尾10件(marble/fabric/ancient/opal/bloodied/angel/demon/iaido/cyber+α)→追記
5. `PartsPanel.tsx` → そのまま追加
6. `WeaponPanel.tsx` → そのまま追加(WeaponWorkshopと別タブ共存)
7. `samples.ts`差分(obsidian/endstone/netherrack/deepslate/water/wool/glass生成器)→欠け分のみ補完

### PIXELFORGE(無印) → 基盤【要アダプタ(ImageData→Tex)】
8. `textures.ts`(約70手続きテクスチャ)→追加+TextureLibraryから呼ぶ分岐
9. `mcpack.ts`(TEX_TO_MC/COMMON_PATHS/buildEntry)→追加(基盤にMcPack出力なし)
10. `pipeline.ts`のamountブレンド/countColors/averageColor/isAnimated→概念移植
11. `fxutil.ts`抜粋(boxBlur/extractPalette/bayer/noise/合成系)→tex.tsへ写経
12. `effects2/3.ts`から選択移植(ベースと重複しないもの、Texラッパー必須)
13. `presets.ts`14件→レシピのみ参考移植(ベース型に正規化)
14. `Minecraft3DPreview.tsx`→追加(three依存追加)
15. `McPackModal/PixelDrawToolbar/EffectStack/Stage`→必要に応じ追加
16. `scripts/smoke.mjs`→CI用に追加

### PIXELBLOOM(editor) → 基盤【データのみ】
17. `engine/data.ts`のTIERS/FORMS/THEMES/MODES/ANIMATIONS数値表+PRESETS21/DECORATIONS22→presets/weaponPartsへ写経
18. `engine/render.ts`の合成手順→参考のみ
19. `engine/io.ts`+`ui/Slider+Icon`→小物として流用可

### pixel-art-conversion → 基盤【変換・書出のみ】
20. `pixel.ts`(k-means/BAYER/PALETTES8)→`lib/pixelConvert.ts`として新規追加
21. `minecraftExport.ts`(TEXTURE_TARGETS28/MC_VERSIONS8/Java+Bedrock)→mcpack拡張として統合
22. `sampleImages.ts`5種→samples.tsのテスト素材として追加
23. `SeamlessTilingPreview/BlockPreview3D/MinecraftPackModal`→流用可(B-14/15と重複時は統一)

---

## skyblock群 → SkyForge基盤

### generator2 → 基盤【同型・そのまま移植可・最優先】
- `lib/bootstrap.ts`(ensureSchema)→seed.tsとserver entryに追加
- `lib/masterwork-pixels.ts`→追加(png.ts decodePngと共存)
- `api/textures/[id]/export/route.ts`→新規追加+`zip-pack.ts`2関数追記
- `generate.ts`のKNOWN_TEMPLATES/safeTemplatesFor→パッチ
- `scripts/baseline-16x.txt`+`snapshot.ts`→回帰資産化
- `seed.ts`のdemo_masterworks/demo_mechworks→併存(steampunk残す)
- `catalog.ts`のドリル18件→追加(蒸気8件は残す)
- `styles.ts`のsig_mechworks/lin_mechworks→追加
- native64/draw/shade微差→目視パッチ

### generator無印(Vite) → 基盤【概念移植・リネーム必須】
- `minecraft.ts`(MINECRAFT_TARGETS 6)→`minecraft-targets.ts`として追加
- `forms.ts`(BASE_FORMS 18/DECORATIONS 20)→`forms-sampler.ts`として追加
- `layers.ts`(積層UI logic)→追加
- `blueprints.ts`(localStorage永続)→追加
- `items.ts`(HySky実名32件)→`hypixel-items.ts`名寄せ辞書として追加

### pack-generator(FORGE) → 基盤【理論・データ移植】
- `essence.ts`(実測24指標×5パック)→`measured-essence.ts`として追加
- `materials.ts`(OKLCH48種)→`oklch-materials.ts`として追加
- `forgeThemes.ts`(25件)→追加(デモ量産に直結)
- `catalog.ts`(近代・魔導・遺物35件)→BASEスキーマに翻訳して追加
- `engine.ts`(forge)→`forge-engine.ts`として追加(二刀流)
- `exporter.ts`(3ターゲット)→`pack-exporter.ts`として追加
- `gradient/raster/edits/designOps/color/measure.ts`→同名追加一式
- `tools/*.mts`(5)→`tools/forge-*`として追加
- `archetypes.ts`(32種)→段階移植

---

## weapons-staff → Arcane Forge基盤

### staff無印(Spellforge) → 基盤【新規追加が基本・破壊変更なし】
- P0: `LIFE_PACK_RESEARCH.md`複写、`evolution.ts`(4段階進化)→`lib/evolution.ts`、pack版表・検証・マニフェスト(`MC_VERSIONS15`/`validateServerCollection`/集合出力/進化連動scale)、6仕上げ(`applyAtelierFinish`として追加)
- P1: バニラ工具系(pattern/mount/core/preset/motif)、DESIGN_MOTIFS 23、MASTERPIECES 14、useAtelierのrail/favorite概念
- P2: 自前zip.ts、日本語命名
- sword(AegisBlade)は分離維持、手をつけない

---

## 3d-forge群 → VoxelForge基盤

### テーマ・パレット系(最優先)
- advanced `themes.ts`(13テーマ/12プレセット/8モード等)→`compat/advanced-themes.ts`
- 無印Forge `forge/data.ts`(20テーマ+SETS)→`compat/forge-themes.ts`
- (1) `spec.ts`(23種/14魔法体系等)→`compat/spec-catalog.ts`
- (3) `MATERIAL_PALETTES 12`+`ARCHETYPE_CATALOG 24`→`compat/material-palettes.ts`
- (3) `seedPresets`/`visualStyles+floatingRigs`→`compat/`
- gen-3d `presets.ts`(ドット絵6)→`compat/dot-presets.ts`
- gen-json `model-types.ts`(39種対応表)→`compat/json-catalog.ts`

### ジェネレータ系
- advanced generator 7種→`geometry/compat/advanced-*`
- gen-json items/models/prompt/configurator/shape→`compat/json-engine/`
- asset-studio generators+anatomy+partLibrary→`compat/asset-studio/`
- 無印Forge builder/kinds→`compat/forge-kinds/`
- (1) generator/weapons/rng→`compat/spec-engine/`
- (3) voxel/extra/mech/staffRig→`geometry/compat/voxelforge-*`
- gen-3d modelBuilder/quantize→`compat/image-to-voxel/`

### エクスポート系
- gen-3d exporters+pack(glTF/OBJ/Bedrock)→`export/compat/`
- asset-studio bedrock/obj/fabricMod→`export/compat/`(最重要)
- 無印Forge glb/set→`export/compat/`
- gen-json bundle/datapack/shimmer/give→`export/compat/`
- (1) bbmodel patterns→`export/compat/`
- (3) motion/pngEncoder→`export/compat/`

### UI系
- 各兄弟のパネル群→`components/studio/compat/`以下にパネル追加方式で吸収

---

## 完了条件(群ごと)

1. 移植リストの全項目を基盤に実装
2. 基盤のtypecheck+lint+dev起動が通る
3. 移植記録を基盤READMEに追記
4. 移植元フォルダを削除し、commit+push

## 3d-forge UI次段階メモ(基盤 `src/components/studio/compat/` への吸収候補)

- advanced: studio/{Header,Inspector,Rail,StatusBar}、Viewport3D、modals/{Export,Save}
- gen-3d: PixelEditor、Viewport3D、App(6タブ)
- gen-json: studio、decor-editor、texture-studio、prompt-report、export-report、model-viewer/thumbnail
- asset-studio: EvolutionLab、TextureAtlasEditor、ElementInspector、DecorationPanel、GeneratorModal、PresetsModal、ActionBar、ModelViewport、ExportModal
- 無印Forge: panels/{Color,Effects,Lineage,Motion,Shape}、right/{AtlasSheet,ExportPanel,LibraryPanel}、stage/{Stage,StageHud,StageBoundary}、ForgeProvider、LeftRail
- (1): SpecPanel、SetGenerator、Gallery、Viewer、ExportBar
- (3): VoxelForgeStudio、StaffFxPanel、UVAtlasEditor、ExportStudioModal、Viewport3D、ElementInspector
