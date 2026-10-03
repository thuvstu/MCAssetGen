/**
 * Resource Pack Builder — assembles a complete, drop-in Minecraft pack
 * from any combination of weapons × material tiers, plus procedural studio
 * weapons and server-pack presets, with optional CustomModelData models
 * and OptiFine / CIT Resewn properties.
 */

import { useMemo, useState } from "react";
import { DEFAULT_OPTIONS, PRESETS, optionsForPreset } from "../engine";
import type { SwordOptions } from "../engine";
import { sanitizeName } from "../utils/names";
import { WEAPON_DEFS } from "./pixmaps";
import { TIER_PALETTES } from "./renderer";
import {
  VANILLA_PLUS_PRESETS,
  type VanillaPlusPresetId,
} from "./vanillaPlus";
import {
  MC_VERSIONS,
  downloadPack,
  buildPackFiles,
  type McVersion,
  type PackEntry,
  type PackOptions,
  type StudioPackEntry,
  type VanillaPackStyle,
} from "./packBuilder";

type TierKey = keyof typeof TIER_PALETTES;
const TIER_KEYS = Object.keys(TIER_PALETTES) as TierKey[];
const SIZES = [16, 32, 64, 128] as const;

const SERVER_PRESET_ENTRIES = Object.entries(PRESETS).filter(
  ([, p]) => p.category === "serverpack"
);

function baseItemForSilhouette(silhouette: SwordOptions["silhouette"]): string {
  switch (silhouette) {
    case "bow":
      return "bow";
    case "trident":
      return "trident";
    case "mace":
      return "mace";
    case "battleaxe":
    case "cleaver":
      return "diamond_axe";
    case "pickaxe":
    case "warpick":
      return "diamond_pickaxe";
    default:
      return "diamond_sword";
  }
}

/** One-click server-pack configurations — the shapes JP multiplayer packs actually ship. */
type PackRecipe = {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  weapons: string[];
  tiers: string[];
  size: number;
  replaceVanilla: boolean;
  emitModels: boolean;
  emitCit: boolean;
  includeServerPresets?: boolean;
  style?: VanillaPackStyle;
  cmdStart: number;
  name: string;
  description: string;
};

const ALL_WEAPONS = WEAPON_DEFS.map((w) => w.id);
const VANILLA_TIERS = ["wood", "stone", "iron", "gold", "diamond", "netherite"];

const PACK_RECIPES: PackRecipe[] = [
  {
    id: "azisaba_life",
    label: "アジ鯖Life風 RPGアーティファクト＆宝石パック",
    emoji: "🌌",
    desc: "氷律剣・天零・レーヴァテイン・宝石シリーズ等19種のサーバー武器を32xで一括同梱 (CIT + CMD)。",
    weapons: [],
    tiers: [],
    size: 32,
    replaceVanilla: false,
    emitModels: true,
    emitCit: true,
    includeServerPresets: true,
    cmdStart: 1001,
    name: "Azisaba_Style_RPG_Weapons",
    description: "§6RPG Artifact & Gem Weapons §7- CIT & CMD Pack",
  },
  {
    id: "azisaba_layer6",
    label: "6層・穢汚の洞窟パック",
    emoji: "🔥",
    desc: "焔戒剣 ReBelion Code・氷律剣 ReVerence Code等のCode系武器 (CIT + CMD)。",
    weapons: [],
    tiers: [],
    size: 32,
    replaceVanilla: false,
    emitModels: true,
    emitCit: true,
    includeServerPresets: true,
    cmdStart: 2001,
    name: "Layer6_Code_Weapons",
    description: "§cLayer 6 Code Weapons §7- ReVerence & ReBelion",
  },
  {
    id: "azisaba_layer7",
    label: "7層・星影秘蔵院パック",
    emoji: "🌸",
    desc: "春薙刀・水晶刃・虹彩剣等の音楽テーマ武器 (CIT + CMD)。",
    weapons: [],
    tiers: [],
    size: 32,
    replaceVanilla: false,
    emitModels: true,
    emitCit: true,
    includeServerPresets: true,
    cmdStart: 3001,
    name: "Layer7_Music_Weapons",
    description: "§dLayer 7 Music Weapons §7- Spring Naginata & Crystal Blade",
  },
  {
    id: "azisaba_sacred",
    label: "宝剣レーヴァテインシリーズ",
    emoji: "⚔️",
    desc: "宝剣レーヴァテイン・神炎・神閃の初心者向け宝剣 (CIT + CMD)。",
    weapons: [],
    tiers: [],
    size: 32,
    replaceVanilla: false,
    emitModels: true,
    emitCit: true,
    includeServerPresets: true,
    cmdStart: 4001,
    name: "Sacred_Sword_Laevatein",
    description: "§6Sacred Sword Laevatein §7- Flame & Flash",
  },
  {
    id: "azisaba",
    label: "サーバー統合パック (バニラ＋CIT＋CMD)",
    emoji: "🏯",
    desc: "全武器×バニラ6素材を丸ごと置換＋CIT＋CMD。サーバー配布の定番構成。",
    weapons: ALL_WEAPONS,
    tiers: VANILLA_TIERS,
    size: 16,
    replaceVanilla: true,
    emitModels: true,
    emitCit: true,
    includeServerPresets: false,
    cmdStart: 2001,
    name: "Server_Weapons_Pack",
    description: "§6Server Weapons §7- all tiers + CIT + CMD",
  },
  {
    id: "gem",
    label: "宝石シリーズ (CIT)",
    emoji: "💎",
    desc: "ガーネット／サファイア／アメジスト系の命名アイテム。金床リネームで切替。",
    weapons: ["sword", "axe", "pickaxe", "bow", "dagger"],
    tiers: ["amethyst", "prismarine", "emerald", "diamond"],
    size: 32,
    replaceVanilla: false,
    emitModels: false,
    emitCit: true,
    includeServerPresets: false,
    cmdStart: 3001,
    name: "Gemstone_Series",
    description: "§dGemstone Series §7- rename to swap (CIT)",
  },
  {
    id: "legend",
    label: "和風レジェンダリー (CMD)",
    emoji: "⛩️",
    desc: "バニラを保ったまま伝説級を追加。/give の custom_model_data で呼ぶ。",
    weapons: ["sword", "netherite_sword", "trident", "mace"],
    tiers: ["gold", "netherite", "breeze"],
    size: 32,
    replaceVanilla: false,
    emitModels: true,
    emitCit: false,
    includeServerPresets: false,
    cmdStart: 4001,
    name: "Legendary_Blades",
    description: "§eLegendary Blades §7- CustomModelData 4001+",
  },
  {
    id: "faithful",
    label: "バニラ忠実 16x",
    emoji: "🟫",
    desc: "ツール一式を16xで素直に置換。見た目を変えすぎたくない鯖向け。",
    weapons: ["sword", "axe", "pickaxe", "shovel", "hoe"],
    tiers: VANILLA_TIERS,
    size: 16,
    replaceVanilla: true,
    emitModels: false,
    emitCit: false,
    includeServerPresets: false,
    cmdStart: 5001,
    name: "Faithful_Tools_16x",
    description: "§2Faithful Tools §7- clean 16x vanilla replacement",
  },
  {
    id: "pvp",
    label: "PvP 1.8.9 短剣",
    emoji: "⚔️",
    desc: "競技系で定番のショートブレード。剣テクスチャをそのまま短剣に差し替え。",
    weapons: ["dagger"],
    tiers: ["iron", "gold", "diamond", "netherite"],
    size: 16,
    replaceVanilla: true,
    emitModels: false,
    emitCit: true,
    includeServerPresets: false,
    cmdStart: 6001,
    name: "PvP_Shortblades",
    description: "§cPvP Shortblades §7- competitive 16x",
  },
  {
    id: "vanilla_plus",
    label: "Vanilla+ 仕上げ 32x",
    emoji: "✨",
    desc: "同一シルエットのまま陰影・ベベル・質感を磨き上げたVanilla+置換。",
    weapons: ["sword", "axe", "pickaxe", "shovel", "hoe"],
    tiers: VANILLA_TIERS,
    size: 32,
    replaceVanilla: true,
    emitModels: false,
    emitCit: false,
    includeServerPresets: false,
    style: "vanilla_plus",
    cmdStart: 7001,
    name: "VanillaPlus_Tools_32x",
    description: "§eVanilla+ Tools §7- refined shading, identical silhouettes",
  },
  {
    id: "gem_tools",
    label: "宝石ツール一式 32x (CIT)",
    emoji: "💎",
    desc: "ルビー・サファイア・エメラルド・トパーズ・オニキスを全武器に適用。金床リネームで切替。",
    weapons: ["sword", "axe", "pickaxe", "shovel", "hoe"],
    tiers: [],
    size: 32,
    replaceVanilla: false,
    emitModels: false,
    emitCit: true,
    includeServerPresets: false,
    cmdStart: 8001,
    name: "Gemstone_Tool_Set",
    description: "§dGemstone Tool Set §7- rename to swap (CIT)",
  },
];

export interface PackBuilderProps {
  currentOptions?: SwordOptions;
  currentName?: string;
  customPresets?: Record<string, SwordOptions>;
}

export default function PackBuilderPanel({
  currentOptions,
  currentName,
  customPresets = {},
}: PackBuilderProps = {}) {
  const [packName, setPackName] = useState("AegisBlade_Server_Pack");
  const [description, setDescription] = useState("§6AegisBlade §7Server & Vanilla Weapon Pack");
  const [version, setVersion] = useState<McVersion>(MC_VERSIONS[MC_VERSIONS.length - 2]); // 1.21
  const [size, setSize] = useState<number>(32);

  const [selWeapons, setSelWeapons] = useState<Set<string>>(
    new Set(["sword", "axe", "pickaxe", "trident", "mace", "bow"])
  );
  const [selTiers, setSelTiers] = useState<Set<string>>(
    new Set(["iron", "gold", "diamond", "netherite"])
  );

  // Studio / procedural weapons bundling
  const [includeCurrent, setIncludeCurrent] = useState(true);
  const [includeCustom, setIncludeCustom] = useState(true);
  const [includeServerPresets, setIncludeServerPresets] = useState(false);

  const [replaceVanilla, setReplaceVanilla] = useState(true);
  const [emitModels, setEmitModels] = useState(true);
  const [emitCit, setEmitCit] = useState(true);
  const [style, setStyle] = useState<VanillaPackStyle>("vanilla");
  const [plusPreset, setPlusPreset] = useState<VanillaPlusPresetId>("balanced");
  const [cmdStart, setCmdStart] = useState(1001);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const applyRecipe = (r: PackRecipe) => {
    setSelWeapons(new Set(r.weapons));
    setSelTiers(new Set(r.tiers));
    setSize(r.size);
    setReplaceVanilla(r.replaceVanilla);
    setEmitModels(r.emitModels);
    setEmitCit(r.emitCit);
    if (r.includeServerPresets !== undefined) setIncludeServerPresets(r.includeServerPresets);
    if (r.style) setStyle(r.style);
    setCmdStart(r.cmdStart);
    setPackName(r.name);
    setDescription(r.description);
    setLastResult(`構成「${r.label}」を適用しました。`);
  };

  const toggle = (set: Set<string>, id: string, fn: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    fn(next);
  };

  // Build the vanilla entry list + studio procedural entry list
  const { entries, studioEntries } = useMemo(() => {
    const out: PackEntry[] = [];
    const studio: StudioPackEntry[] = [];
    let cmd = cmdStart;

    for (const tk of TIER_KEYS) {
      if (!selTiers.has(tk)) continue;
      for (const w of WEAPON_DEFS) {
        if (!selWeapons.has(w.id)) continue;
        const palette = TIER_PALETTES[tk];
        out.push({
          weapon: w,
          palette,
          tierKey: tk,
          customModelData: emitModels ? cmd++ : undefined,
          citName: emitCit ? `${palette.label} ${w.label}` : undefined,
        });
      }
    }

    if (includeCurrent && currentOptions) {
      const clean = sanitizeName(currentName || "current_blade") || "current_blade";
      const baseItem = baseItemForSilhouette(currentOptions.silhouette);
      studio.push({
        slug: clean,
        displayName: currentName || clean,
        baseItem,
        options: currentOptions,
        customModelData: emitModels ? cmd++ : undefined,
        citName: emitCit ? (currentName || clean).replace(/_/g, " ") : undefined,
      });
    }

    if (includeCustom) {
      for (const [k, o] of Object.entries(customPresets)) {
        const clean = sanitizeName(k) || "custom";
        const baseItem = baseItemForSilhouette(o.silhouette);
        studio.push({
          slug: `custom_${clean}`,
          displayName: k,
          baseItem,
          options: o,
          customModelData: emitModels ? cmd++ : undefined,
          citName: emitCit ? k.replace(/_/g, " ") : undefined,
        });
      }
    }

    if (includeServerPresets) {
      for (const [key, preset] of SERVER_PRESET_ENTRIES) {
        const o = optionsForPreset(key, DEFAULT_OPTIONS);
        const clean = sanitizeName(key) || "server_item";
        const baseItem = baseItemForSilhouette(o.silhouette);
        // Japanese name before " / " makes anvil renaming intuitive on JP servers
        const jpName = preset.name.split(" / ")[0] ?? preset.name;
        studio.push({
          slug: clean,
          displayName: preset.name,
          baseItem,
          options: o,
          customModelData: emitModels ? cmd++ : undefined,
          citName: emitCit ? jpName : undefined,
        });
      }
    }

    return { entries: out, studioEntries: studio };
  }, [
    selWeapons,
    selTiers,
    emitModels,
    emitCit,
    cmdStart,
    includeCurrent,
    includeCustom,
    includeServerPresets,
    currentOptions,
    currentName,
    customPresets,
  ]);

  const totalTextures = entries.length + studioEntries.length;

  const opts: PackOptions = {
    packName,
    description,
    version,
    size,
    replaceVanilla,
    emitCit,
    emitModels,
    style,
    plusOptions: VANILLA_PLUS_PRESETS[plusPreset].options,
  };

  const fileCount = useMemo(() => {
    if (totalTextures === 0) return 0;
    try {
      let n = 2; // pack.mcmeta + README
      n += totalTextures; // custom textures
      if (replaceVanilla) n += new Set(entries.map((e) => e.weapon.baseName)).size;
      if (emitModels) {
        const baseSet = new Set([
          ...entries.map((e) => e.weapon.baseName),
          ...studioEntries.map((s) => s.baseItem),
        ]);
        n += totalTextures + baseSet.size;
      }
      if (emitCit) n += totalTextures * 4;
      return n;
    } catch {
      return 0;
    }
  }, [entries, studioEntries, totalTextures, replaceVanilla, emitModels, emitCit]);

  const doBuild = async () => {
    if (totalTextures === 0) return;
    setBusy(true);
    setLastResult(null);
    await new Promise((r) => setTimeout(r, 30));
    try {
      const count = downloadPack(entries, opts, studioEntries);
      setLastResult(`✅ ${count} ファイルを含む .zip を生成しました`);
    } catch (err) {
      setLastResult(`❌ 生成に失敗: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const manifestPreview = useMemo(() => {
    if (totalTextures === 0) return [];
    const files = buildPackFiles(entries.slice(0, 1), opts, studioEntries.slice(0, 1));
    return files.map((f) => f.path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, studioEntries, totalTextures, packName, description, version, size, replaceVanilla, emitCit, emitModels, style, plusPreset]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
        <h3 className="mb-2 text-sm font-bold text-slate-100">
          📦 リソースパック・ビルダー (Resource Pack Builder)
        </h3>
        <p className="text-[11px] text-slate-400">
          バニラ武器×素材、さらにスタジオの生成武器やアジ鯖Life風サーバープリセット19種をまとめて
          <code className="mx-1 rounded bg-black/50 px-1 font-mono text-[10px] text-emerald-300">
            .minecraft/resourcepacks/
          </code>
          に入れられる .zip として一括出力します。CustomModelData モデルと OptiFine / CIT Resewn
          プロパティも自動生成。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Left: selection ── */}
        <div className="space-y-5">
          {/* Studio & Server-Pack Weapons */}
          <div className="rounded-[4px] border border-[#29233f] bg-[#14181c] p-5 space-y-2.5">
            <h4 className="text-xs font-bold uppercase text-amber-300">
              ✨ スタジオ・サーバー武器を同梱 ({studioEntries.length}件)
            </h4>
            <p className="text-[10px] text-slate-400">
              プロシージャル描画エンジンで生成した高精細武器を、CIT / CustomModelData アイテムとして同じパックに同梱します。
            </p>
            {currentOptions && (
              <ModeToggle
                on={includeCurrent}
                onChange={setIncludeCurrent}
                title={`現在のスタジオ武器 (${currentName || "untitled"})`}
                desc="左のプレビューで編集中の武器をこのパックに含めます。"
              />
            )}
            <ModeToggle
              on={includeServerPresets}
              onChange={setIncludeServerPresets}
              title={`サーバーパック系プリセット (${SERVER_PRESET_ENTRIES.length}種)`}
              desc="氷律剣 ReVerence Code・大威太刀 天零・宝剣レーヴァテイン・石榴石の剣など19種を一括同梱。"
            />
            {Object.keys(customPresets).length > 0 && (
              <ModeToggle
                on={includeCustom}
                onChange={setIncludeCustom}
                title={`保存済みマイプリセット (${Object.keys(customPresets).length}種)`}
                desc="ブラウザに保存した自作プリセットをすべて同梱します。"
              />
            )}
          </div>

          {/* Weapons */}
          <div className="rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-slate-300">
                バニラ武器 ({selWeapons.size}/{WEAPON_DEFS.length})
              </h4>
              <div className="flex gap-1">
                <button
                  onClick={() => setSelWeapons(new Set(WEAPON_DEFS.map((w) => w.id)))}
                  className="rounded bg-[#1d242a] px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
                >
                  全選択
                </button>
                <button
                  onClick={() => setSelWeapons(new Set())}
                  className="rounded bg-[#1d242a] px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
                >
                  解除
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {WEAPON_DEFS.map((w) => {
                const on = selWeapons.has(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => toggle(selWeapons, w.id, setSelWeapons)}
                    className={`flex items-center gap-1.5 rounded-[3px] border px-2 py-1.5 text-left transition-all ${
                      on
                        ? "border-emerald-500 bg-emerald-600/15 text-emerald-200"
                        : "border-[#29233f] bg-[#171c21]/50 text-slate-500 hover:border-slate-600"
                    }`}
                  >
                    <span className="text-sm">{w.emoji}</span>
                    <span className="text-[10px] font-semibold leading-tight truncate">
                      {w.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tiers */}
          <div className="rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-slate-300">
                バニラ素材 ({selTiers.size}/{TIER_KEYS.length})
              </h4>
              <div className="flex gap-1">
                <button
                  onClick={() => setSelTiers(new Set(TIER_KEYS))}
                  className="rounded bg-[#1d242a] px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
                >
                  全選択
                </button>
                <button
                  onClick={() => setSelTiers(new Set())}
                  className="rounded bg-[#1d242a] px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
                >
                  解除
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {TIER_KEYS.map((tk) => {
                const p = TIER_PALETTES[tk];
                const on = selTiers.has(tk);
                return (
                  <button
                    key={tk}
                    onClick={() => toggle(selTiers, tk, setSelTiers)}
                    className={`flex items-center gap-2 rounded-[3px] border px-2 py-1.5 transition-all ${
                      on
                        ? "border-emerald-500 bg-emerald-600/15"
                        : "border-[#29233f] bg-[#171c21]/50 hover:border-slate-600"
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded border border-slate-600 shrink-0"
                      style={{ background: `rgb(${p.mid.join(",")})` }}
                    />
                    <span
                      className={`text-[10px] font-semibold truncate ${
                        on ? "text-slate-100" : "text-slate-500"
                      }`}
                    >
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right: pack settings ── */}
        <div className="space-y-5">
          {/* One-click server pack recipes */}
          <div className="rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
            <h4 className="mb-1 text-xs font-bold uppercase text-slate-300">
              ⚡ サーバー構成プリセット
            </h4>
            <p className="mb-3 text-[10px] leading-relaxed text-slate-500">
              マルチプレイ配布でよく使う構成をワンクリックで適用します。適用後も個別に調整できます。
            </p>
            <div className="space-y-1.5">
              {PACK_RECIPES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => applyRecipe(r)}
                  className="group flex w-full items-start gap-3 rounded-[3px] border border-[#2b333b] bg-[#1a2026] px-3 py-2.5 text-left transition-all hover:border-[#6b7a86] hover:bg-[#1f272d]"
                >
                  <span className="mt-0.5 text-base leading-none">{r.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold text-slate-200 group-hover:text-amber-200">
                      {r.label}
                    </span>
                    <span className="block text-[10px] leading-snug text-slate-500">{r.desc}</span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {r.includeServerPresets && <Tag tone="gold">サーバー武器19種</Tag>}
                      {r.weapons.length > 0 && <Tag>{r.weapons.length} 武器</Tag>}
                      {r.tiers.length > 0 && <Tag>{r.tiers.length} 素材</Tag>}
                      <Tag>{r.size}px</Tag>
                      {r.replaceVanilla && <Tag tone="gold">置換</Tag>}
                      {r.emitModels && <Tag tone="emerald">CMD</Tag>}
                      {r.emitCit && <Tag tone="sky">CIT</Tag>}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[4px] border border-[#29233f] bg-[#14181c] p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-300">パック設定</h4>

            {/* Name */}
            <label className="block">
              <span className="mb-1 block text-[11px] text-slate-400">パック名</span>
              <input
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                className="w-full rounded-[3px] border border-[#3a3357] bg-[#171c21] px-3 py-2 font-mono text-xs text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>

            {/* Description */}
            <label className="block">
              <span className="mb-1 block text-[11px] text-slate-400">
                説明文 (§ カラーコード使用可)
              </span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-[3px] border border-[#3a3357] bg-[#171c21] px-3 py-2 font-mono text-xs text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>

            {/* MC version */}
            <div>
              <span className="mb-1.5 block text-[11px] text-slate-400">
                対象バージョン → pack_format {version.packFormat}
              </span>
              <div className="grid grid-cols-5 gap-1">
                {MC_VERSIONS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVersion(v)}
                    className={`rounded px-1 py-1.5 text-[10px] font-mono font-bold transition-all ${
                      version.id === v.id
                        ? "bg-emerald-600 text-white"
                        : "bg-[#1d242a] text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              {version.modernModels && (
                <p className="mt-1.5 text-[10px] text-amber-300">
                  ⚠ 1.21.4+ は新しい item model definition 形式で出力します
                </p>
              )}
            </div>

            {/* Size */}
            <div>
              <span className="mb-1.5 block text-[11px] text-slate-400">テクスチャ解像度</span>
              <div className="flex gap-1.5">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`flex-1 rounded-[3px] py-1.5 text-[11px] font-mono font-bold transition-all ${
                      size === s
                        ? "bg-emerald-600 text-white"
                        : "bg-[#1d242a] text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            {/* Vanilla render style */}
            <div>
              <span className="mb-1.5 block text-[11px] text-slate-400">
                バニラ仕上げ (シルエットは同一)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: "vanilla", label: "Pure Vanilla" },
                    { id: "vanilla_plus", label: "Vanilla+" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setStyle(m.id)}
                    className={`rounded-[3px] py-1.5 text-[11px] font-bold transition-all ${
                      style === m.id
                        ? "bg-emerald-600 text-white"
                        : "bg-[#1d242a] text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {style === "vanilla_plus" && (
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  {(Object.keys(VANILLA_PLUS_PRESETS) as VanillaPlusPresetId[]).map((id) => (
                    <button
                      key={id}
                      onClick={() => setPlusPreset(id)}
                      title={VANILLA_PLUS_PRESETS[id].desc}
                      className={`rounded-[2px] px-2 py-1 text-[10px] font-semibold transition-all ${
                        plusPreset === id
                          ? "bg-emerald-600 text-white"
                          : "bg-[#1d242a] text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {VANILLA_PLUS_PRESETS[id].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Output modes */}
          <div className="rounded-[4px] border border-[#29233f] bg-[#14181c] p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-300">出力内容</h4>

            <ModeToggle
              on={replaceVanilla}
              onChange={setReplaceVanilla}
              title="バニラ置換"
              desc="デフォルトのアイテムテクスチャを直接上書きします。一番手軽。"
            />

            <ModeToggle
              on={emitModels}
              onChange={setEmitModels}
              title="CustomModelData モデル"
              desc="バニラを保ったまま、コマンドで呼び出せるカスタムアイテムを追加。Mod不要。"
            >
              <label className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-slate-400">開始番号</span>
                <input
                  type="number"
                  value={cmdStart}
                  onChange={(e) => setCmdStart(parseInt(e.target.value) || 1)}
                  className="w-24 rounded border border-[#3a3357] bg-[#171c21] px-2 py-1 font-mono text-[11px] text-slate-100"
                />
                <span className="text-[10px] text-slate-500">
                  → {cmdStart} 〜 {cmdStart + Math.max(0, totalTextures - 1)}
                </span>
              </label>
            </ModeToggle>

            <ModeToggle
              on={emitCit}
              onChange={setEmitCit}
              title="OptiFine / CIT Resewn"
              desc="金床でリネームするとテクスチャが変わる .properties を同梱。アジ鯖Life等のサーバー向け。"
            />
          </div>

          {/* Build */}
          <div className="rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
            <div className="mb-3 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                テクスチャ数{" "}
                <span className="font-mono font-bold text-slate-100">{totalTextures}</span>
                {studioEntries.length > 0 && (
                  <span className="ml-1 text-[10px] text-amber-300">
                    (内スタジオ武器 {studioEntries.length})
                  </span>
                )}
              </span>
              <span className="text-slate-400">
                推定ファイル数{" "}
                <span className="font-mono font-bold text-slate-100">{fileCount}</span>
              </span>
            </div>

            <button
              onClick={doBuild}
              disabled={totalTextures === 0 || busy}
              className="w-full rounded-[3px] bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 py-3 text-sm font-bold text-[#2a1d05] shadow-[inset_1px_1px_0_#fff8e0,inset_-1px_-2px_0_#8a6412,0_6px_20px_-8px_#f2c14eaa] transition-all hover:brightness-105 disabled:opacity-40 disabled:hover:brightness-100"
            >
              {busy ? "⏳ 生成中…" : `📦 リソースパックを生成 (${totalTextures} textures)`}
            </button>

            {lastResult && (
              <p className="mt-2 text-center text-[11px] text-slate-300">{lastResult}</p>
            )}

            {totalTextures === 0 && (
              <p className="mt-2 text-center text-[11px] text-amber-400">
                同梱する武器を1つ以上選択してください
              </p>
            )}
          </div>
        </div>
      </div>

      {/* File tree preview */}
      {totalTextures > 0 && (
        <div className="rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
          <h4 className="mb-2 text-xs font-bold uppercase text-slate-300">
            ファイル構成プレビュー (抜粋)
          </h4>
          <pre className="max-h-48 overflow-auto rounded-[3px] bg-black/50 p-3 font-mono text-[10px] leading-relaxed text-emerald-300">
            {manifestPreview.join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
}

function ModeToggle({
  on,
  onChange,
  title,
  desc,
  children,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  title: string;
  desc: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[3px] border p-3 transition-all ${
        on ? "border-emerald-500/50 bg-emerald-950/25" : "border-[#29233f] bg-[#171c21]/40"
      }`}
    >
      <label className="flex cursor-pointer items-start justify-between gap-3">
        <div>
          <span className="block text-[11px] font-bold text-slate-200">{title}</span>
          <span className="block text-[10px] leading-snug text-slate-500">{desc}</span>
        </div>
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-emerald-500"
        />
      </label>
      {on && children}
    </div>
  );
}

function Tag({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "gold" | "emerald" | "sky";
}) {
  const tones = {
    slate: "border-[#333d46] bg-[#141a1f] text-slate-400",
    gold: "border-[#6b5a1e] bg-[#2a2410] text-amber-300",
    emerald: "border-[#1c5c3c] bg-[#0f2a1e] text-emerald-300",
    sky: "border-[#1e4a6b] bg-[#0f2130] text-sky-300",
  } as const;
  return (
    <span className={`rounded-[2px] border px-1.5 py-px font-mono text-[9px] ${tones[tone]}`}>
      {children}
    </span>
  );
}
