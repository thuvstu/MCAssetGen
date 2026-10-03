# SkyForge — SkyBlock テクスチャパックメーカー

Hypixel SkyBlock の人気テクスチャパック（FurfSky Reborn / ImperiaL's / Vanilla+ / Faithful 32x / SkyPixel / 3D SkyBlock など）の
**「エッセンス」＝描き方のルールだけ**をパラメータ化し、それを混ぜ合わせて
**オリジナルのピクセルテクスチャとMinecraftリソースパックZIPを生成する** Webアプリです。

既存パックの画像・素材は一切使用していません。生成物100%オリジナル。

---

## このプロジェクトをどう扱うか（最短フロー）

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────────┐
│ 1. 鍛造      │ ──▶ │ 2. 保存      │ ──▶ │ 3. ダウンロード & 導入 │
│ /studio     │     │ パックに保存  │     │ ZIP → resourcepacks/ │
│ アイテム選択 │     │ DBに永続化   │     │ OptiFine等で有効化    │
└─────────────┘     └─────────────┘     └──────────────────────┘
```

| したいこと | やること |
|---|---|
| テクスチャを1枚作る | `/studio` を開き、左でアイテム選択 → 右で「画法」「系譜」を選ぶ → 「この調合で鍛造」 |
| 高品質な原画を起点にする | スタジオ中央下の **ORIGINAL MASTERWORK FOUNDATIONS**（54点/77アイテム、カテゴリ別）から選ぶ → 64pxで読込 → 必要箇所をピクセル編集。カタログの★印が原画ありの目印 |
| 気に入ったものをストックする | 「パックに保存」（初回はパック名・作者を入力） |
| 1枚だけを出力する | パックページのカード → **PNG ↓ / 単体ZIP ↓**、またはスタジオ上部の **単体PNG / 単体ZIP** |
| パック全体を1つのスタイルで揃える | 「全N点に適用」 |
| Minecraftで使う | パックページ（`/packs/[id]`）またはスタジオの「ZIP書き出し」→ `resourcepacks/` フォルダへ |
| 他人のパックを継承する | ギャラリー `/gallery` → 気になるパック → 「スタジオで開く」 |

---

## ローカルで動かす

前提: Node.js 20+, PostgreSQL（`.env` の `DATABASE_URL` に接続先を設定）

```bash
# 1. 依存関係
npm install

# 2. DBスキーマを適用（初回のみ / schema.ts を変更したら再実行）
npx drizzle-kit push

# 3. 開発サーバー
npm run dev
# → http://localhost:3000
```

本番ビルド:

```bash
npm run build
npm start
```

デモパック5点（16×/32×/64×）は初回アクセス時に `src/lib/seed.ts` が自動生成します。
再設計を反映させたいときはDBから `demo_%` のパックを削除し、再度アクセスしてください。

---

## 用語（アプリ内の表示と対応）

| 画面の言葉 | 意味 | 例 |
|---|---|---|
| **画法 (Signature)** | どう描くか（輪郭の硬さ・階調・装飾量・立体感）。最大2つまでブレンド | リボーン・クラリティ（FurfSky系）, インペリアル・レガリア（ImperiaL's系）, バニラプラス, スカイピクセル・クリスプ, フェイスフル・スムース, デプス3D, グリッティPvP, ネオンブルーム, オーバーホール・インテリケート, ネームレス・ヒロイック |
| **系譜 (Palette)** | 何でできているか（金属・宝石・木・革・発光体の色）。最大3つまでブレンド | 地下墓地, 虚空, 結晶洞, 真紅の島, 氷, 妖精工房, 竜, ミダス, ミスリル, ウィザー王, 収穫 |
| **シード (Seed)** | 同じ型でも細部が揺れる乱数源 | 数値を直接編集可 |
| **カオス (Chaos)** | シードによる変化量（宝石追加・刃の欠け・ルーン脈） | 0=設計図どおり, 100=荒い |
| **レアリティ** | 輪郭の発光色と名前の色 | FurfSky 風の COMMON〜MYTHIC 対応 |
| **TRUE NATIVE 64** | 64×64は16/32を拡大せず、**64座標で別設計した別シルエット** | 全46型が64px専用で存在 |

---

## アーキテクチャ

```
[UI: studio / gallery / packs]
        │
        ▼
[API routes: /api/packs, /api/generate, /api/packs/[id]/export …]
        │
        ├── PostgreSQL (drizzle-orm)
        │     packs   : パックメタ（名前・作者・公開・ダウンロード数）
        │     textures: テクスチャ本体（RGBAピクセルjsonb + 生成パラメータ）
        │
        ▼ 生成パイプライン（src/lib/）
  catalog.ts     77のSkyBlockアイテム定義（型候補・CITパターン・レアリティ）
        │
        ├── masterworks.ts + public/masterworks/  … 54枚のオリジナル64px原画
        │   masterwork-pixels.ts                  … サーバー側PNGデコード（シード用）
        │                 ブラウザ/サーバー双方でRGBA化 → 編集・保存・ZIPまで同一経路
        │
        ├── 16/32: templates.ts   16座標の46シルエット（材質マップ文字列）
        └── 64:    native64.ts    64座標で別設計した46シルエット
                              （Bezier曲線・独立パーツ・1px刻印・負の空間）
        │
  styles.ts      画法10 × 系譜12 の定義とブレンド計算
        │
  generate.ts    型選択 → シード変異（カオス）→ 64なら構造エッセンスパス
        │
  shade.ts       距離場ライティング（法線・ベベル・断面・軸グラデ・
                 発光体・色付き輪郭・レアリティグロー）
        │
  png.ts         依存ライブラリなしのPNGエンコーダ
        │
  zip-pack.ts    pack.mcmeta + OptiFine CIT .properties + pack.png を
                 JSZipで組み立て → /api/packs/[id]/export から .zip
```

### なぜ「画像セットを配布する」方式ではないか

- 既存パックのテクスチャを乗せると著作権が乗る。**描き方のルールだけ**を
  パラメータにしたため、生成物は常にオリジナルであり、
  「FurfSkyの輪郭の硬さ + ImperiaL'sの装飾量 + 氷系譜の色」のように
  既存パックでは存在しない組み合わせを作れる。
- パラメトリックなので**1型 = 無限の変種**（シード×カオス×色相×発光）。
- サーバー生成 + DB保存により、ブラウザだけで
  作成 → 保存 → 共有（ギャラリー）→ ZIPダウンロード が成立する。

---

## API

| メソッド・パス | 用途 |
|---|---|
| `GET /api/health` | DB疎通チェック |
| `GET /api/packs` / `POST /api/packs` | パック一覧 / 作成 |
| `GET /api/packs/[id]` | パック詳細（ピクセル含む） |
| `PATCH /api/packs/[id]` | パック更新（名前・公開・解像度…） |
| `DELETE /api/packs/[id]` | 削除（デモパックは不可） |
| `POST /api/packs/[id]/textures` | テクスチャ保存・上書き（itemIdキー） |
| `DELETE /api/textures/[id]` | 1枚削除 |
| `GET /api/textures/[id]/png?dl=1` | 1枚のPNG配信（`dl=1` で添付ファイル名付きダウンロード） |
| `GET /api/textures/[id]/export?dl=1` | **単体リソースパックZIP**（その1枚だけで導入できる完全パック） |
| `GET /api/packs/[id]/icon` | パックサムネイル（4枚コラージュ） |
| `POST /api/packs/[id]/like` | いいね |
| `GET /api/packs/[id]/export` | **リソースパックZIPダウンロード** |
| `POST /api/generate` | 生成のみ（保存しない） |

---

## 検証・開発スクリプト

| コマンド | 何を確認するか |
|---|---|
| `npx tsx scripts/resolution.ts` | **64×が16×の拡大でないことの証明**（4×4混在率・1px構造・拡大画像との一致率上限・生産経路がnative64であること） |
| `npx tsx scripts/preview.ts` | 全テンプレート・画法・系譜のコンタクトシートPNGを `.preview/` に出力 |
| `npx tsx scripts/native64-preview.ts` | 64ネイティブ12点のコンタクトシート |
| `npx tsx scripts/inspect.ts raw <itemId> <res> <sig> <pal> [seed]` | 1枚をフル解像度ASCIIでダンプ（目視検証用） |
| `npx tsx scripts/metrics.ts` | 画法・系譜・シード分離の定量値（RMS）・トーン階調ヒストグラム |
| `npx tsx scripts/snapshot.ts [16\|32]` | テンプレート形状のハッシュ固定（リファクタ時の回帰検知） |
| `npm run lint` / `npm run typecheck` | ESLint / tsc |

---

## ディレクトリ

```
src/
  app/
    page.tsx                 トップ（特徴 + 公開パック）
    studio/                  鍛造スタジオ（クライアントコンポーネント）
    gallery/                 公開パック一覧
    packs/[id]/              パック詳細 + ZIPダウンロード
    guide/                   使い方ガイド
    api/                     上記API
  components/                studio-app, pixel-editor, pixel-image …
  lib/
    catalog.ts               SkyBlockアイテム77（CITパターン付き）
    templates.ts             16/32シルエット
    native64.ts              64専用シルエット + 構造エッセンスパス
    styles.ts                画法×系譜の定義
    shade.ts                 距離場ライティング
    generate.ts              パイプライン統合
    png.ts / zip-pack.ts     PNGエンコーダ / リソースパック組み立て
    seed.ts                  デモパック生成
    data.ts / serialize.ts   DB読み書きとDTO
  db/                        drizzle-orm + pg
scripts/                     上記検証ツール
```

---

## Minecraftでの導入

1. スタジオの「ZIP書き出し」またはパックページの「リソースパック ZIP」をダウンロード
2. `\.minecraft\resourcepacks\` にZIPのまま配置
3. CIT対応クライアント（OptiFine / SkyClient / CIT Resourcemap等）で
   オプション → リソースパック → 有効化
4. ゲーム内のアイテム名（例 `*Hyperion*`）にマッチした瞬間に差し替わる

ZIP内: `pack.mcmeta`（新旧クライアント両対応）/ `pack.png` / `textures/*.png` /
`assets/minecraft/optifine/cit/skyforge/*.properties`

---

## 権利

生成物はプロシージャルに描画されたオリジナル画像です。
Hypixel / SkyBlock は各権利者の商標であり、本プロジェクトは無関係です。
