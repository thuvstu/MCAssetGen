/**
 * スタジオ台帳 — 「別々のGUIスタジオ」を統合アプリ内へ取り込むための一覧。
 *
 * 方針 (2026-10-09〜):
 *   各スタジオの GUI を **書き換えずそのまま** src/studios/<id>/ に取り込み、
 *   1つのアプリ (/studios/<id>) から全部使えるようにする。微細な違いも
 *   損なわないため、ロジックは再実装せず原本を丸ごと持ってくる。
 *
 * status:
 *   "ported"  … GUI を取り込み済み (/studios/<id> で開ける)
 *   "engines" … 生成エンジンのみ統合済み (API/CLI から利用可、GUIは移植待ち)
 */
export type StudioStatus = "ported" | "engines";

export interface StudioEntry {
  id: string;
  label: string;
  group: string;
  description: string;
  /** 元アプリのパス (リポジトリ内) */
  origin: string;
  /** 対応する統合エンジン id (未指定なら id と同じ) */
  engine?: string;
  status: StudioStatus;
}

export const STUDIOS: StudioEntry[] = [
  {
    id: "texcraft",
    label: "TexCraft テクスチャスタジオ",
    group: "テクスチャ",
    description: "150種のエフェクト、66プリセット、パーツ合成、進化バリアント、mcpack出力",
    origin: "texture/texcraft",
    status: "ported",
  },
  {
    id: "sword",
    label: "剣テクスチャメーカー",
    group: "武器",
    description: "67プリセットの剣描画、エフェクト、アニメーション、リソースパック",
    origin: "weapons/minecraft-sword-texture-maker",
    status: "ported",
  },
  {
    id: "spell",
    label: "Spellforge 杖",
    group: "武器",
    description: "24エレメントの杖生成とプレビュー",
    origin: "weapons/minecraft-magic-staff-generator",
    status: "ported",
  },
  {
    id: "arcane",
    label: "Arcane Forge 杖",
    group: "武器",
    description: "設定ランダム生成つきの杖スタジオ",
    origin: "weapons/minecraft-magic-staff-generator (1)",
    status: "ported",
  },
  {
    id: "adv",
    label: "Advanced Weapon アセット",
    group: "武器",
    description: "形状×素材の武器、3Dモデル、アニメーションフレーム",
    origin: "weapons/advanced-minecraft-asset-generator",
    status: "ported",
  },
  {
    id: "mob",
    label: "モブメーカー",
    group: "モブ",
    description: "アーキタイプ別モブ、Java/Bedrock/Fabric/GeckoLib 出力",
    origin: "professional-minecraft-mob-maker",
    status: "ported",
  },
  {
    id: "armor",
    label: "アーマー生成",
    group: "アーマー",
    description: "8スタイルの装甲、GeckoLib 5 の8ボーン装備、プレビュー",
    origin: "minecraft-armor-asset-generator",
    status: "ported",
  },
  {
    id: "material",
    label: "マテリアルテクスチャ",
    group: "テクスチャ",
    description: "素材プリセットからアイテム/ブロックテクスチャ群を生成",
    origin: "minecraft-material-texture-generator",
    status: "ported",
  },
  {
    id: "structure",
    label: "NBT構造物",
    group: "構造物",
    description: "ボクセル構造の生成・3Dプレビュー・データパック出力",
    origin: "minecraft-nbt-structure-generator",
    status: "ported",
  },
  {
    id: "skyforge",
    label: "SkyForge アイテム",
    group: "SkyBlock",
    description: "Hypixel 風アイテムテクスチャ (ライブラリ保存つき)",
    origin: "skyblock/hypixel-skyblock-texture-generator (1)",
    status: "ported",
  },
  {
    id: "sky2",
    label: "SkyBlock クラシック描画",
    group: "SkyBlock",
    description: "旧描画エンジンのアイテムテクスチャ",
    origin: "skyblock/skyblock-texture-pack-generator",
    status: "ported",
  },
  {
    id: "mythicforge",
    label: "MythicForge (Fabric MOD)",
    group: "MOD",
    description: "Kotlin/Fabric MOD の統合開発スタジオ (コンパイルAPIつき)",
    origin: "mod/mythicforge-studio",
    status: "engines",
  },
  {
    id: "mythiccraft",
    label: "MythicCraft (MythicMobs)",
    group: "MOD",
    description: "スキル/モブ/ショップを組む MOD スタジオ",
    origin: "mod/mythiccraft-studio",
    status: "engines",
  },
  {
    id: "fabric",
    label: "Fabric MOD ビルダー",
    group: "MOD",
    description: "ノーコードの Fabric MOD ビルダー",
    origin: "mod/no-coding-fabric-mod-builder",
    status: "engines",
  },
];

export function studioById(id: string): StudioEntry | undefined {
  return STUDIOS.find((entry) => entry.id === id);
}

export const PORTED_STUDIOS = STUDIOS.filter((entry) => entry.status === "ported");
