# MCAssetGen API Usage

HTTP APIとCLIの使い方まとめ。ベースURLは各アプリのdevポート。

| アプリ | 既定ポート |
|---|---|
| texcraft | :5135 |
| SkyForge (`skyblock/hypixel-skyblock-texture-generator (1)`) | :5132 |
| voxelforge-studio | :5131 |
| mythiccraft-studio | :5141 |
| mythicforge-studio | :5142 |

## mcasset 統合CLI (全スタジオ)

```bash
cd MCAssetGen/cli
npm run mcasset -- <studio>:<command> [options]
```

| スタジオ | コマンド例 |
|---|---|
| `tex` | texcraft CLIに委譲(下記参照) |
| `sky` | `sky:items` / `sky:render --item hyperion --seed 7 --res 16 --out mm/tex.png` |
| `vox` | `vox:kinds` / `vox:generate --kind sword --seed 42 --out model.bbmodel` |
| `arcane` | `arcane:render --random --size 64 --out mm/staff.png` / `arcane:config` |
| `mythic` | `mythic:build --project proj.json --out moddev/mymod` |
| `mythiccraft` | `mythiccraft:sample --name mymod --out project.json` / `mythiccraft:build --project file.json --out dir/` |

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
| `render --preset <id> [--sample <id>] [--size 16] --out file.png` | プリセット適用レンダリング |
| `convert --in file.png [--palette <name>] [--colors 16] --out file.png` | 減色変換(PNGのみ入力可、パレット名は前方一致可) |
| `effect --id <effect> [--sample <id>] [--size 16] [--params k=v,k=v] --out file.png` | 単体エフェクト適用 |

例:
```bash
npm run asset -- render --preset legendary --sample sword --size 32 --out mm/tex.png
npm run asset -- convert --in mm/tex.png --palette PICO-8 --out mm/tex-dot.png
npm run asset -- effect --id bloom --params threshold=150,radius=3 --out mm/glow.png
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

- DB要アプリは `.env` の `DATABASE_URL` (Supabaseプーラー) が必要。未設定では5xxになる
- `/api/compile` のビルドは JDK21 + Gradle が必要(手元は8/17/24のため未検証)
- ブラウザFile System Access APIはChrome/Edgeのみ対応


# 基本的に64pxがおすすめです