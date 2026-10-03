# アジ鯖Life リソースパック徹底分析

GitHub: https://github.com/azisaba/resourcepacks (action-v9967)

## 1. パッケージ構造

```
life.zip/
├── pack.mcmeta (pack_format: 34 for MC 1.21)
├── assets/minecraft/
│   ├── optifine/cit/           # OptiFine CIT (金床リネーム対応)
│   ├── citresewn/cit/          # CIT Resewn (バニラ対応)
│   └── textures/item/          # バニラ置換テクスチャ
└── assets/aegisblades/         # カスタム武器テクスチャ
```

## 2. 武器カテゴリー別リスト

### 初級・中級 (Basic Tier)
| 武器名 | 想定ベースアイテム | テクスチャ特徴 |
|---|---|---|
| 無双剣 | diamond_sword | 直剣、鋭い刃先、銀色ベース |
| タイタンボウ | bow | 大型弓、金色装飾 |
| たそがれギガントアックス | diamond_axe | 巨大斧、紫色グラデーション |

### 6層・穢汚の洞窟 (Layer 6)
| 武器名 | 想定ベースアイテム | テクスチャ特徴 |
|---|---|---|
| 焔戒剣 ReBelion Code | diamond_sword | 炎属性、赤色グラデーション、Code系接尾辞 |
| 氷律剣 ReVerence Code | diamond_sword | 氷属性、水色グラデーション、Code系接尾辞 |

### 7層・星影秘蔵院 (Layer 7 - 音楽テーマ)
| 武器名 | 想定ベースアイテム | テクスチャ特徴 |
|---|---|---|
| 春薙刀 アルコントラルト | diamond_axe | 薙刀形状、桜色、音楽用語(Alto) |
| 炎鎖鋸 バスプロフォンド | diamond_axe | 炎属性、鎖鋸形状、音楽用語(Basso Profondo) |
| 水晶刃 ヘルデンテノール | diamond_sword | 水晶属性、音楽用語(Tenor) |
| 十字盾 カヴァリエバリトン | shield | 十字盾、音楽用語(Baritone) |
| 虹彩剣 ソプラノリリコ | diamond_sword | 虹色グラデーション、音楽用語(Soprano) |

### レイド・時計塔製武器 (Raid / Clock Tower)
| 武器名 | 想定ベースアイテム | テクスチャ特徴 |
|---|---|---|
| ダメージ to ヒール | diamond_sword | HP吸収系、紫色 |
| 創時槍 | trident | 時間属性、槍形状 |
| 真・創時槍 | trident | 創時槍の強化版 |
| 絶幻の氷 | diamond_sword | 氷属性、幻想的 |
| Garnet Sword | diamond_sword | 赤色宝石系、直剣 |
| Sapphire Sword | diamond_sword | 青色宝石系、直剣 |
| Amethyst Slasher | diamond_sword | 紫色宝石系、曲刀 |

### 宝剣シリーズ (Sacred Sword Series)
| 武器名 | 想定ベースアイテム | テクスチャ特徴 |
|---|---|---|
| 宝剣レーヴァテイン・神炎 | diamond_sword | 炎属性、赤色、神聖系 |
| 宝剣レーヴァテイン・神閃 | diamond_sword | 雷属性、黄色、神聖系 |

### 時計塔製・封印の宮殿 (Clock Tower / Sealed Palace)
| 武器名 | 想定ベースアイテム | テクスチャ特徴 |
|---|---|---|
| 大威太刀 天零 | diamond_sword | 日本刀形状、天零(てんれい) |
| 端青麟狼 弓 | bow | 弓、青麟狼(せいりんろう) |
| 黒魔剣:グラン | diamond_sword | 黒魔術系、暗紫色 |

### その他伝説級
| 武器名 | 想定ベースアイテム | テクスチャ特徴 |
|---|---|---|
| 空刻 NEO | diamond_sword | 空属性、近未来的 |
| Fly Wing | diamond_sword | 翼属性、飛行系 |
| 天裂&影裂 | diamond_sword | 二刀流、天と影 |

## 3. 命名規則パターン

### パターンA: 「日本語名 + 英語サブタイトル」
```
氷律剣 ReVerence Code
焔戒剣 ReBelion Code
大威太刀 天零
端青麟狼 弓
春薙刀 アルコントラルト
```
- CIT用: `ipattern:*氷律剣 ReVerence Code*`
- 金床で「氷律剣 ReVerence Code」とリネーム

### パターンB: 「宝石名 + 武器種」
```
Garnet Sword
Sapphire Sword
Amethyst Slasher
```
- CIT用: `ipattern:*Garnet Sword*`
- シンプルで分かりやすい

### パターンC: 「接頭辞 + 武器名 + 接尾辞」
```
宝剣レーヴァテイン・神炎
宝剣レーヴァテイン・神閃
真・創時槍
```
- CIT用: `ipattern:*宝剣レーヴァテイン・神炎*`
- 多層構造、強化段階を表現

### パターンD: 「音楽用語シリーズ」(7層)
```
春薙刀 アルコントラルト (Alto)
炎鎖鋸 バスプロフォンド (Basso Profondo)
水晶刃 ヘルデンテノール (Tenor)
十字盾 カヴァリエバリトン (Baritone)
虹彩剣 ソプラノリリコ (Soprano)
```
- 声楽用語で統一
- 各層のテーマと連動

### パターンE: 「Code系接尾辞」
```
ReVerence Code (氷律剣)
ReBelion Code (焔戒剣)
```
- 「Re」で始まる接頭辞
- 「Code」で終わる接尾辞
- 規律・法則をイメージ

## 4. テクスチャ品質特徴

### 解像度
- バニラ武器: 16x16 (基本)
- カスタム武器: 32x32 (高精細)
- 伝説級: 64x64 (最高品質)

### 色数とグラデーション
- **初級**: 3-4色、単純なグラデーション
- **中級**: 5-6色、2段グラデーション
- **伝説級**: 7-8色、3段以上の多段グラデーション
- **神話級**: 発光エフェクト付き、パーティクル描画

### 陰影テクニック
1. **エッジハイライト**: 刃先に1-2pxの明るいハイライト
2. **ベベルライン**: 刃と芯の境界に陰影線
3. **グラデーション**: 根本→中間→切先の3段構造
4. **発光**: 伝説級武器はエミッシブ(発光)テクスチャ
5. **パーティクル**: 属性パーティクル(炎、氷、雷など)

### 属性別カラーパレット
| 属性 | メインカラー | アクセント | パーティクル色 |
|---|---|---|---|
| 炎 (Flame) | #ff6b35 | #ffaa00 | #ffdd00 |
| 氷 (Frost) | #5b9bd8 | #a8d8ff | #e0f7ff |
| 雷 (Lightning) | #ffdd00 | #fffacd | #ffffcc |
| 虚無 (Void) | #6b3fa0 | #a855f7 | #d8b4ff |
| 神聖 (Holy) | #ffd700 | #fffacd | #fff9c4 |
| 毒 (Poison) | #7bc950 | #b4f08a | #d4f7c0 |
| 影 (Shadow) | #6b4a8a | #9d75b8 | #c4a8d8 |
| 血 (Blood) | #cc2936 | #ff6b6b | #ffa8a8 |

## 5. CIT プロパティ例

### 氷律剣 ReVerence Code
```properties
# optifine/cit/ice_law_sword.properties
type=item
items=minecraft:diamond_sword
texture=ice_law_sword.png
nbt.display.Name=ipattern:*氷律剣 ReVerence Code*
```

### Garnet Sword
```properties
# optifine/cit/garnet_sword.properties
type=item
items=minecraft:diamond_sword
texture=garnet_sword.png
nbt.display.Name=ipattern:*Garnet Sword*
```

### 宝剣レーヴァテイン・神炎
```properties
# optifine/cit/sacred_sword_flame.properties
type=item
items=minecraft:diamond_sword
texture=sacred_sword_flame.png
nbt.display.Name=ipattern:*宝剣レーヴァテイン・神炎*
```

## 6. 実装優先度

### Phase 1: 基本武器 (Must Have)
1. 氷律剣 ReVerence Code (氷属性、Code系)
2. Garnet Sword (宝石系)
3. Sapphire Sword (宝石系)
4. Amethyst Slasher (宝石系)

### Phase 2: 伝説級 (Should Have)
1. 宝剣レーヴァテイン・神炎 (炎属性)
2. 宝剣レーヴァテイン・神閃 (雷属性)
3. 大威太刀 天零 (日本刀)
4. 創時槍 (槍、時間属性)

### Phase 3: 音楽シリーズ (Nice to Have)
1. 春薙刀 アルコントラルト (薙刀、桜)
2. 水晶刃 ヘルデンテノール (水晶)
3. 虹彩剣 ソプラノリリコ (虹色)

### Phase 4: 拡張 (Future)
1. 空刻 NEO (空属性)
2. 黒魔剣:グラン (黒魔術)
3. 天裂&影裂 (二刀流)

## 7. テクスチャ生成の改善ポイント

### 現在のAegisBlade Studioの課題
1. **日本語武器名のCIT対応**: `ipattern:*日本語名*` の自動生成が必要
2. **音楽シリーズ未対応**: 声楽用語ベースの武器名パターンがない
3. **Code系接尾辞未対応**: 「Re〇〇 Code」パターンの自動生成がない
4. **属性カラーの統一**: アジ鯖固有の属性カラーパレットを適用する必要がある
5. **伝説級の発光表現**: エミッシブテクスチャの自動生成が必要

### 実装方針
1. `src/engine/presets.ts` にアジ鯖Life武器プリセットを追加
2. `src/vanilla/PackBuilderPanel.tsx` に「アジ鯖Life風」プリセットボタンを追加
3. CIT生成時に日本語武器名を自動で `ipattern` に設定
4. 属性カラーパレットをアジ鯖仕様に調整
5. 伝説級武器には発光エフェクトを自動付与
