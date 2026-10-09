# MCAssetGen API Usage

HTTP APIとCLIの使い方まとめ。ベースURLは各アプリのdevポート。

| アプリ | 既定ポート |
|---|---|
| texcraft | :5135 |
| SkyForge (`skyblock/hypixel-skyblock-texture-generator (1)`) | :5132 |
| voxelforge-studio | :5131 |
| 統合された各スタジオ (取り込み済み) | :5131 の `/studios/<id>` (元ポートは不要) |
| mythiccraft-studio | :5141 |
| mythicforge-studio | :5142 |

## 統合スタジオAPI (VoxelForge :5131)

移植済みの全エンジンは統合レジストリ経由で実行する。CLIもこれだけを使う。

| メソッド | パス | 用途 |
|---|---|---|
| GET | `/api/studio/engines` | エンジン/コマンド一覧 (各コマンドの `sample` 引数つき) |
| POST | `/api/studio/run` | `{"engine","command","args"}` → `{ok,text,files[],data}` (files は base64) |

```bash
curl localhost:5131/api/studio/engines
curl -X POST localhost:5131/api/studio/run -H 'Content-Type: application/json' \
  -d '{"engine":"voxel","command":"export","args":{"format":"geckolib","kind":"sword","seed":42}}'
```

ブラウザからは `http://localhost:5131/engines` のコンソールで同じ操作ができる
(引数は `sample` が事前入力され、結果PNGのプレビューとダウンロードも付く)。
`tests/studio-command-samples.test.ts` が全コマンドのサンプルを実行検証している。

## アセットバス (スタジオ間の受け渡し)

| メソッド | パス | 用途 |
|---|---|---|
| GET | `/api/assets` | 保存済みアセット一覧 (サムネイル付き) |
| POST | `/api/assets` | `{name,studio,kind,files:[{path,base64}]}` を保存 |
| GET | `/api/assets/<id or 名前>` | ファイル本体 (base64) |
| DELETE | `/api/assets/<id or 名前>` | 削除 |

エンジン実行に連携の口がある:
`POST /api/studio/run {"engine","command","args","save":"名前","asset":"名前"}`
- `save` : 成功した出力をバスへ保存
- `asset`: バス内のアセットを入力に渡す (コマンドの宣言argsに応じて `in` / `project` / `texture`)。
  **配列で複数指定できる** (`{"asset": ["myproj", "mod_tex"]}`)

```bash
# 素材スタジオの出力を保存し、テクスチャスタジオで使う
npm run mcasset -- material:render --preset iron --shape ingot --save iron_ingot_tex --out mm/ingot.png
npm run mcasset -- tex:convert --asset iron_ingot_tex --palette PICO-8 --out mm/dot.png
# MODプロジェクトの受け渡し
npm run mcasset -- mythic:sample --save myproject
npm run mcasset -- mythic:build --asset myproject --out-dir moddev/mymod

# テクスチャ → MOD (一気通貫)。asset は複数指定できる
npm run mcasset -- tex:render --sample stone --save mod_tex
npm run mcasset -- mythic:build --asset myproject --asset mod_tex --out-dir moddev/mymod
# → src/main/resources/assets/<modId>/textures/item/<item>.png に画像が入り、
#    アイテム登録 (Kotlin) / モデルJSON / lang も同じ id で生成される
npm run mcasset -- mythic:build --project proj.json --asset mod_tex --textureTarget bus_blade
npm run mcasset -- mythiccraft:build --asset myproject --asset mod_tex --out-dir moddev/mcmod
```

保存先は `3d-forge/voxelforge-studio/.mcasset-assets/` (gitignore済)。ブラウザでは
`/assets` 一覧、`/engines` の「アセットから入力 / バスへ保存」から同じ操作ができる。

## 取り込み済みスタジオのAPI (`:5131`)

GUIを取り込んだスタジオも元アプリのAPIを `/api/studios/<id>/` 配下で使える
(DBは `DATABASE_URL` があればPostgres、無ければメモリ保存)。

| スタジオ | API | 備考 |
|---|---|---|
| SkyForge | `/api/studios/skyforge/...` | `packs` (GET/POST/PATCH/DELETE) `/packs/[id]/{export,icon,like,textures}` `/textures/[id]/{export,png,zip}` `/generate` `/masterworks/pack` `/health` |
| MythicForge | `/api/studios/mythicforge/...` | `projects` + `compile` (JDK21/Gradleが無い環境では503と案内)、`compile/artifact` |
| MythicCraft | `/api/studios/mythiccraft/...` | `projects` + `compile` |
| Fabric | `/api/studios/fabric/...` | `projects` + `compile`、`compile/artifact` |

SkyForgeのマスターワーク原画 (`public/masterworks/*.png`) は元アプリでも
リポジトリ非同梱 (抽出スクリプトで生成) なので、`/masterworks/pack` は
原画が無い環境ではエラーを返す。それ以外の生成・保存・書き出しは全て動作する。

## mcasset 統合CLI (全スタジオ / API駆動)

```bash
cd MCAssetGen/cli
npm run mcasset -- <studio>:<command> [options] [--out file|dir]
npm run mcasset -- engines                      # エンジン一覧
npm run mcasset -- engines --json               # コマンド定義 (sample引数つき)
npm run mcasset -- tex:render --out mm/x.png    # 引数省略=サンプル引数で実行
MCASSET_STUDIO_URL=http://host:5131 npm run mcasset -- sky:items
```

CLIは統合スタジオAPIへのHTTPクライアント(スタジオのソースはimportしない)。
起動時に `/api/studio/engines` からコマンド定義を取得し、**引数を省略すると
サンプル引数で実行**する (`--no-sample` で無効化、`--dry-run` で送信内容を確認)。
`--out` を省略した場合は各ファイルの既定パスに書き出し、複数ファイル出力
(`build` など)では `--out` をディレクトリとして扱う。`--in` はPNG等をbase64で
アップロード、`--project`/`--config` はJSONファイルを読んで送信する。

| スタジオ | コマンド例 |
|---|---|
| `tex` | `tex:list-effects` / `tex:effect --id edgewear --sample sword --out mm/edge.png` / `tex:texture --id diamond_ore --size 32 --out mm/d.png` / `tex:variant --id tier5 --sample sword --frame strip --out mm/tier5.png` / `tex:convert --in mm/tex.png --palette PICO-8 --out mm/dot.png` |
| `sky` | `sky:items` / `sky:render --item hyperion --seed 7 --res 16 --out mm/tex.png` |
| `sky2` | `sky2:items` / `sky2:render --item hyperion --size 32 --out mm/tex.png` (旧 `skyblock/hypixel-skyblock-texture-generator`、ヘッドレス描画) |
| `forge` | `forge:items` / `forge:render --item HYPERION --res 32 --anim pulse --strip --out mm/forge.png` / `forge:pack --items HYPERION,TERMINATOR --target catharsis --out pack.zip` |
| `vox` | `vox:kinds` / `vox:generate --kind sword --seed 42 --out model.bbmodel` |
| `adv` | `adv:shapes` / `adv:materials` / `adv:render --shape sword --material ruby --out mm/w.png` / `adv:model --shape sword --out model.json` / `adv:anim --layers glow_pulse,sparkle --frames 4 --out strip.png` |
| `arcane` | `arcane:render --random --size 64 --out mm/staff.png` / `arcane:config` |
| `spell` | `spell:elements` / `spell:render --element fire --size 64 --out mm/staff.png` |
| `sword` | `sword:render --preset Hyperion --size 64 --out mm/sword.png` |
| `mythic` | `mythic:build --project proj.json --out moddev/mymod` |
| `mythiccraft` | `mythiccraft:sample --name mymod --out project.json` / `mythiccraft:build --project file.json --out dir/` |
| `armor` | `armor:presets` / `armor:render --armorId test --geo` / `armor:bundle --armorId test --namespace mymod --geckolib` |
| `mob` | `mob:presets` / `mob:render --archetype humanoid --entityId foo` / `mob:bundle --archetype humanoid` / `mob:geckolib --archetype humanoid` |
| `structure` | `structure:samples` / `structure:nbt --sample house --out house.nbt` / `structure:export --sample house --out dir/` |
| `material` | `material:shapes` / `material:render --preset iron --out dir/` / `material:pack --preset iron --modId mymod --out pack.zip` |

`forge:pack --target` は `catharsis`(1.21.11+ Mod) / `optifine`(1.8.9 CIT) / `vanilla`(1.21.4+ item_model + datapack) の3系統。`--items all` でカタログ全件を同梱できる。

## mcasset CLI (texcraft個別)

```bash
cd MCAssetGen/texture/texcraft
npm run asset -- <command>
```

| コマンド | 用途 |
|---|---|
| `list-effects` | 150エフェクト一覧( id / category / name ) |
| `list-presets` | 66プリセット一覧 |
| `list-samples` | サンプルテクスチャ一覧 |
| `list-palettes` | 8パレット一覧 |
| `list-textures [--group <name>]` | 手続き生成テクスチャ(350種)一覧(`pfTextures`) |
| `list-parts [--category <id>]` | パーツスタンプ(47種)一覧 |
| `list-variants [--group <id>]` / `list-groups` | 武器バリエーション(95種)/強化グループ一覧 |
| `render --preset <id> [--sample <id>] [--size 16] --out file.png` | プリセット適用レンダリング |
| `convert --in file.png [--palette <name>] [--colors 16] --out file.png` | 減色変換(PNGのみ入力可、パレット名は前方一致可) |
| `effect --id <effect> [--sample <id>] [--size 16] [--params k=v,k=v] --out file.png` | 単体エフェクト適用 |
| `texture --id <texture> [--size 16] [--seed 7] --out file.png` | 手続きテクスチャの直接生成 |
| `stamp --part <id> [--in file.png\|--sample <id>] [--size 16] [--recolor #hex] --out file.png` | パーツスタンプ合成 |
| `variant --id <variant> [--in file.png\|--sample <id>] [--size 16] [--accent #hex] [--frame 0\|strip] --out file.png` | 進化/限界突破/形態変化バリエーション生成(`strip`で縦ストリップ) |

例:
```bash
npm run asset -- render --preset legendary --sample sword --size 32 --out mm/tex.png
npm run asset -- convert --in mm/tex.png --palette PICO-8 --out mm/tex-dot.png
npm run asset -- effect --id bloom --params threshold=150,radius=3 --out mm/glow.png
npm run asset -- texture --id diamond_ore --size 32 --seed 7 --out mm/diamond.png
npm run asset -- stamp --part blade_long --sample sword --size 32 --out mm/stamped.png
npm run asset -- variant --id tier5 --sample sword --size 32 --frame strip --out mm/tier5.png
```

## MythicCraft API (:5141)

| メソッド | パス | 用途 |
|---|---|---|
| GET | `/api/health` | DB疎通確認 |
| GET | `/api/projects` | プロジェクト一覧(id/name/updatedAt/modId/件数) |
| POST | `/api/projects` | 作成。`{"name": "...", "template": "sample"?}` → `{"id"}` |
| GET | `/api/projects/[id]` | 取得(プロジェクトJSON全体) |
| PUT | `/api/projects/[id]` | 更新(プロジェクトJSON全体を送信) |
| DELETE | `/api/projects/[id]` | 削除 |

例:
```bash
curl -X POST localhost:5141/api/projects -H 'Content-Type: application/json' -d '{"name":"My Skill Mod"}'
curl -X PUT localhost:5141/api/projects/<id> -H 'Content-Type: application/json' -d @project.json
```

## MythicForge API (:5142)

| メソッド | パス | 用途 |
|---|---|---|
| GET | `/api/health` | DB疎通確認 |
| GET | `/api/projects` | プロジェクト一覧 |
| POST | `/api/projects` | 作成 |
| GET | `/api/compile` | ツールチェイン状態 `{"available","javaHome","gradle","busy"}` (JDK21/Gradle必須) |
| POST | `/api/compile` | ビルド。`{"project": {...}}` → `{"available","ok",...}`。同時1件(409 busy) |
| GET | `/api/compile/artifact?mod=<modId>` | ビルド成果物jarをダウンロード |

例:
```bash
curl localhost:5142/api/compile
curl -X POST localhost:5142/api/compile -H 'Content-Type: application/json' -d @project.json
curl 'localhost:5142/api/compile/artifact?mod=mymod' -o mymod.jar
```

## SkyForge API (:5132)

| メソッド | パス | 用途 |
|---|---|---|
| GET | `/api/health` | DB疎通確認 |
| POST | `/api/generate` | テクスチャ生成(`itemId/templateId/seed`等を指定) |
| GET/POST | `/api/packs`, `/api/packs/[id]` | パックCRUD |
| GET | `/api/packs/[id]/export` | パックZIP出力 |
| GET | `/api/textures/[id]/png` | PNG取得 |
| GET | `/api/textures/[id]/zip?size=16\|32\|64` | 単体CITパックZIP |
| GET | `/api/textures/[id]/export` | 単体完結リソパ |

## VoxelForge API (:5131)

| メソッド | パス | 用途 |
|---|---|---|
| GET | `/api/health` | DB疎通確認 |
| GET/POST | `/api/models`, `/api/models/[id]` | モデルCRUD |
| POST | `/api/export` | bbmodel/resourcepack等の書き出し |
| POST | `/api/variants` | バリアント生成 |

## サーバー連携 (MythicCraft :5141 の「サーバー連携」)

ブラウザ操作(Chrome/Edge):
1. `minecraft`フォルダを選択して接続
2. `paperserver-121/plugins/MythicMobs/{mobs,items,skills}` と `mm/life-pve-aibou/production/{Items,Skills}` をブラウズ
3. YAMLを開いて取込、または現在の内容をサーバーへ直接書出し(反映は `/mm reload`)
4. 生成Modソースを `moddev/<modId>/` に展開(IntelliJで開いて開発継続)
5. `resourcepack/` へZIP配置、`model.bbmodel` のダウンロード

## 注意

- CLIは統合スタジオ(`3d-forge/voxelforge-studio`, 既定 :5131)が起動している必要がある。接続先は `MCASSET_STUDIO_URL` で変更
- GeckoLib: `vox:export --format geckolib`、`armor:*`(GeckoLib 5の8ボーン)、`mob:geckolib`、`mythic:build` で `geckolib: true` のモブ(geo/animation/Kotlin/Gradle依存)
- `sky2:render` はヘッドレス実装のため、ブラウザ版と異なり放射グロー背景とアニメーションフレームは出力しない(本体ピクセル・アウトライン・エレメント・ウェアは同等)
- `mythic:build` はMythicForge形式のプロジェクトJSONが必要(`mythiccraft:sample` の出力は `mythiccraft:build` 用で別スキーマ)
- DB要アプリは `.env` の `DATABASE_URL` (Supabaseプーラー) が必要。未設定では5xxになる
- `/api/compile` のビルドは JDK21 + Gradle が必要(手元は8/17/24のため未検証)
- ブラウザFile System Access APIはChrome/Edgeのみ対応


# 基本的に64pxがおすすめです