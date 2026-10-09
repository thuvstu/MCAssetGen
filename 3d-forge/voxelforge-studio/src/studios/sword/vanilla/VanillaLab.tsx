/**
 * Vanilla Lab — Minecraft-faithful texture viewer/editor.
 *
 * Two render modes, one pixel grid:
 *  - Pure Vanilla: palette lookup + nearest-neighbor upscale only.
 *    Zero interpolation, zero effects, zero ambiguity.
 *  - Vanilla+: identical silhouettes with refined shading (selective
 *    outline, inner highlight, bevel, grain, light falloff).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { WEAPON_DEFS, vanillaTexturePath } from "./pixmaps";
import type { Palette, SwordOptions, Silhouette } from "../engine/types";
import { canvasToPngBytes, createZip, downloadBlob, downloadDataUrl, utf8 } from "../utils/zip";
import { TIER_PALETTES, buildCustomPalette } from "./renderer";
import type { TierPalette } from "./renderer";
import {
  DEFAULT_VANILLA_PLUS,
  VANILLA_PLUS_PRESETS,
  renderVanillaLike,
  type VanillaPlusOptions,
  type VanillaPlusPresetId,
  type VanillaRenderMode,
} from "./vanillaPlus";
import { VanillaCanvas } from "./VanillaCanvas";
import { Slider, Toggle } from "../components/ui";
import { rgbToHex } from "../engine/color";
import type { RGB } from "../engine/types";
import type { VanillaWeaponId } from "./pixmaps";
import {
  applyThemeToPalette,
  themePlusOptions,
  THEME_LIST,
  type ThemeId,
} from "./themes";

type TierKey = keyof typeof TIER_PALETTES;
const TIER_KEYS = Object.keys(TIER_PALETTES) as TierKey[];
const SIZES = [16, 32, 48, 64, 128, 256] as const;

/** Map a vanilla weapon to the closest procedural silhouette */
const SILHOUETTE_FOR: Record<string, Silhouette> = {
  sword: "straight", netherite_sword: "straight", dagger: "tanto",
  axe: "battleaxe", pickaxe: "pickaxe", shovel: "spear", hoe: "glaive",
  trident: "trident", bow: "bow", crossbow: "bow", mace: "mace",
  fishing_rod: "whip", shield: "obelisk",
};

const rgbHex = (c: readonly number[]) => rgbToHex(c as RGB);

/** Render a vanilla-family texture offscreen (shared by all batch downloads). */
function renderOffscreen(
  map: number[][],
  palette: TierPalette,
  size: number,
  mode: VanillaRenderMode,
  plus: VanillaPlusOptions
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  renderVanillaLike(c.getContext("2d")!, map, palette, size, mode, plus);
  return c;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Props = {
  /** Hand the current vanilla look to the procedural studio */
  onApplyToStudio?: (patch: Partial<SwordOptions>) => void;
};

export default function VanillaLab({ onApplyToStudio }: Props = {}) {
  const [weapon, setWeapon] = useState<VanillaWeaponId>("sword");
  const [tier, setTier] = useState<TierKey>("diamond");
  const [outSize, setOutSize] = useState<number>(64);
  const [name, setName] = useState("diamond_sword");
  const [history, setHistory] = useState<{ url: string; label: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [customBase, setCustomBase] = useState("#4aedd9");
  const [customTone, setCustomTone] = useState<"warm" | "cool" | "neutral">("cool");
  const [useCustom, setUseCustom] = useState(false);
  const [mode, setMode] = useState<VanillaRenderMode>("vanilla");
  const [plusPreset, setPlusPreset] = useState<VanillaPlusPresetId>("balanced");
  const [plus, setPlus] = useState<VanillaPlusOptions>(DEFAULT_VANILLA_PLUS);
  const [theme, setTheme] = useState<ThemeId>("simple");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const applyPlusPreset = (id: VanillaPlusPresetId) => {
    setPlusPreset(id);
    setPlus({ ...VANILLA_PLUS_PRESETS[id].options });
  };

  const themeDef = THEME_LIST.find((t: (typeof THEME_LIST)[number]) => t.id === theme)!;

  const weaponDef = WEAPON_DEFS.find((w) => w.id === weapon)!;
  const customPalette = buildCustomPalette(customBase, customTone);
  const basePalette = useCustom ? customPalette : TIER_PALETTES[tier];
  const palette = applyThemeToPalette(basePalette, theme);
  const plusOptions = themePlusOptions(theme, plus);

  // Auto-set filename
  useEffect(() => {
    setName(vanillaTexturePath(weaponDef, tier) ?? `${tier}_${weaponDef.baseName}`);
  }, [tier, weaponDef]);

  // Render whenever inputs change
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    renderVanillaLike(c.getContext("2d")!, weaponDef.map, palette, outSize, mode, plusOptions);
  }, [weaponDef, palette, outSize, mode, plusOptions]);

  // Live preview at fixed 192px (nearest-neighbor upscale of whatever outSize is)
  const previewRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const pc = previewRef.current;
    const sc = canvasRef.current;
    if (!pc || !sc) return;
    pc.width = 192;
    pc.height = 192;
    const ctx = pc.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 192, 192);
    ctx.drawImage(sc, 0, 0, 192, 192);
  }, [weapon, tier, outSize, useCustom, customBase, customTone, mode, plus, theme, plusOptions]);

  const fileSuffix = mode === "vanilla_plus" ? "_plus" : "";

  const themeSuffix = theme === "simple" ? "" : `_${theme}`;
  const themeLabel = theme === "simple" ? palette.label : `${palette.label} ${themeDef.label}`;
  const download = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const url = c.toDataURL("image/png");
    downloadDataUrl(url, `${name}${fileSuffix}${themeSuffix}_${outSize}x${outSize}.png`);
    setHistory((h) => [{ url, label: `${name}${themeSuffix}` }, ...h].slice(0, 12));
  }, [name, outSize, fileSuffix, themeSuffix, palette]);

  const downloadResourcePack = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const bytes = canvasToPngBytes(c);
    const styleTag = mode === "vanilla_plus" ? "Vanilla+ " : "";
    const mcmeta = JSON.stringify({
      pack: { pack_format: 34, description: `${styleTag}Vanilla ${tier} ${weaponDef.label} (${outSize}x)` },
    }, null, 2);

    const blob = createZip([
      { path: "pack.mcmeta", data: utf8(mcmeta) },
      { path: `assets/minecraft/textures/item/${vanillaTexturePath(weaponDef, tier) ?? weaponDef.baseName}.png`, data: bytes },
    ]);
    downloadBlob(blob, `${tier}_${weaponDef.label.replace(/\s+/g, "_")}${fileSuffix}_ResourcePack.zip`);
  }, [tier, weaponDef, outSize, mode, fileSuffix]);

  const copyPng = useCallback(async () => {
    const c = canvasRef.current;
    if (!c) return;
    c.toBlob(async (blob) => {
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }, "image/png");
  }, []);

  // Preview at multiple sizes side by side
  const previewSizes = [16, 32, 64, 128] as const;

  return (
    <div className="space-y-6">
      {/* Weapon selector */}
      <div className="rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
        <h3 className="mb-3 text-sm font-bold text-slate-100">
          🟫 バニラ・ラボ (Vanilla Lab)
        </h3>
        <p className="mb-3 text-[11px] text-slate-400">
          バニラ専用レンダラー。Pureは本家Minecraftとピクセル一致を保証し、
          Vanilla+は同一シルエットのまま陰影・ベベル・質感だけを磨き上げます。
          テーマ（系）を選べば、完全に異なる雰囲気のバニラツールが作れます。
        </p>

        {/* Theme gallery ("系") */}
        <div className="mb-4 rounded-[3px] border border-[#3a3357] bg-[#171c21]/60 p-3">
          <h4 className="mb-2 text-xs font-bold uppercase text-slate-300">
            🎨 テーマ (系) — {themeDef.emoji} {themeLabel}
          </h4>
          <p className="mb-2 text-[10px] text-slate-500">{themeDef.description}</p>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-9 gap-1.5">
            {THEME_LIST.map((t: typeof THEME_LIST[number]) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={t.description}
                className={`flex flex-col items-center gap-1 rounded-[2px] py-2 transition-all ${
                  theme === t.id
                    ? "bg-emerald-600 text-white ring-1 ring-emerald-400/60"
                    : "bg-[#1d242a] text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span className="text-base">{t.emoji}</span>
                <span className="text-[9px] font-semibold leading-tight text-center">
                  {t.label.replace("剣", "").replace("系", "")}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Render mode: Pure Vanilla vs Vanilla+ */}
        <div className="mb-4 rounded-[3px] border border-[#3a3357] bg-[#171c21]/60 p-3">
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { id: "vanilla", label: "Pure Vanilla", desc: "完全一致" },
                { id: "vanilla_plus", label: "Vanilla+", desc: "磨き上げ" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`rounded-[3px] px-3 py-2 text-left transition-all ${
                  mode === m.id
                    ? "bg-emerald-600 text-white"
                    : "bg-[#1d242a] text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span className="block text-xs font-bold">{m.label}</span>
                <span className={`block text-[10px] ${mode === m.id ? "text-emerald-100" : "text-slate-500"}`}>
                  {m.desc}
                </span>
              </button>
            ))}
          </div>

          {mode === "vanilla_plus" && (
            <div className="mt-3 space-y-2.5 border-t border-[#3a3357]/60 pt-3">
              <div className="flex gap-1.5">
                {(Object.keys(VANILLA_PLUS_PRESETS) as VanillaPlusPresetId[]).map((id) => (
                  <button
                    key={id}
                    onClick={() => applyPlusPreset(id)}
                    title={VANILLA_PLUS_PRESETS[id].desc}
                    className={`flex-1 rounded-[2px] px-2 py-1 text-[11px] font-semibold transition-all ${
                      plusPreset === id
                        ? "bg-emerald-600 text-white"
                        : "bg-[#1d242a] text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {VANILLA_PLUS_PRESETS[id].label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Slider label="Bevel" value={plus.bevel} min={0} max={1} step={0.05} onChange={(v) => setPlus({ ...plus, bevel: v })} />
                <Slider label="Grain" value={plus.grain} min={0} max={1} step={0.05} onChange={(v) => setPlus({ ...plus, grain: v })} />
                <Slider label="Highlight" value={plus.highlight} min={0} max={1} step={0.05} onChange={(v) => setPlus({ ...plus, highlight: v })} />
                <Slider label="Gradient" value={plus.gradient} min={0} max={1} step={0.05} onChange={(v) => setPlus({ ...plus, gradient: v })} />
              </div>
              <Toggle
                label="Selective Outline"
                desc="光側の輪郭だけを柔らかくする (Vanilla Tweaks流)"
                checked={plus.selectiveOutline}
                onChange={(v) => setPlus({ ...plus, selectiveOutline: v })}
              />
            </div>
          )}
        </div>

        {/* Weapons grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
          {WEAPON_DEFS.map((w) => (
            <button
              key={w.id}
              onClick={() => setWeapon(w.id)}
              className={`flex flex-col items-center gap-1 rounded-[3px] border px-2 py-2 transition-all ${
                weapon === w.id
                  ? "border-emerald-500 bg-emerald-600/20 text-emerald-200"
                  : "border-[#3a3357] bg-[#1d242a]/60 text-slate-400 hover:bg-slate-700 hover:border-slate-500"
              }`}
            >
              <span className="text-lg">{w.emoji}</span>
              <span className="text-[10px] font-semibold leading-tight">{w.label}</span>
            </button>
          ))}
        </div>

        {/* Material tier selector */}
        <h4 className="mb-2 text-xs font-semibold text-slate-300">素材ティア (Material Tier)</h4>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
          {TIER_KEYS.map((t) => {
            const p = TIER_PALETTES[t];
            const active = !useCustom && tier === t;
            return (
              <button
                key={t}
                onClick={() => { setUseCustom(false); setTier(t); }}
                className={`flex items-center gap-2 rounded-[3px] border px-2 py-2 transition-all ${
                  active
                    ? "border-emerald-500 bg-emerald-600/20"
                    : "border-[#3a3357] bg-[#1d242a]/60 hover:bg-slate-700 hover:border-slate-500"
                }`}
              >
                <span
                  className="h-4 w-4 rounded border border-slate-600"
                  style={{ background: `rgb(${p.mid.join(",")})` }}
                />
                <span className="text-[11px] font-semibold text-slate-200">{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Resolution */}
        <h4 className="mb-2 text-xs font-semibold text-slate-300">出力サイズ (Resolution)</h4>
        <div className="flex gap-2 mb-4">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setOutSize(s)}
              className={`rounded-[3px] px-3 py-1.5 text-xs font-mono font-bold transition-all ${
                outSize === s
                  ? "bg-emerald-600 text-white"
                  : "bg-[#1d242a] text-slate-300 hover:bg-slate-700"
              }`}
            >
              {s}×{s}
            </button>
          ))}
        </div>

        {/* Grid overlay toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            className="accent-emerald-500"
          />
          <span className="text-xs text-slate-300">グリッド表示 (Show pixel grid)</span>
        </label>
      </div>

      {/* Main preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-100">
              {weaponDef.emoji} {weaponDef.label} · {themeLabel}
            </h4>
            <span className="flex items-center gap-2">
              <span
                className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold ${
                  mode === "vanilla_plus"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-slate-700/50 text-slate-300"
                }`}
              >
                {mode === "vanilla_plus" ? "Vanilla+" : "Pure"}
              </span>
              <span className="text-xs font-mono text-slate-400">{outSize}×{outSize}</span>
            </span>
          </div>

          {/* Checker background */}
          <div
            className="flex items-center justify-center rounded-[3px] p-6 min-h-[260px]"
            style={{
              backgroundImage:
                "linear-gradient(45deg,#1b2127 25%,transparent 25%),linear-gradient(-45deg,#1b2127 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1b2127 75%),linear-gradient(-45deg,transparent 75%,#1b2127 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
              backgroundColor: "#12141c",
            }}
          >
            {/* Hidden source canvas */}
            <canvas ref={canvasRef} className="hidden" />
            {/* Visible preview with optional grid */}
            <div className="relative">
              <canvas
                ref={previewRef}
                className="drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)] transition-transform hover:scale-105"
                style={{ width: 192, height: 192, imageRendering: "pixelated" }}
              />
              {showGrid && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                    backgroundSize: `${192 / 16}px ${192 / 16}px`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Export buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[^a-z0-9_]/g, "_").toLowerCase())}
              className="flex-1 min-w-[140px] rounded-[3px] border border-[#3a3357] bg-[#171c21] px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="diamond_sword"
            />
            <button
              onClick={download}
              className="rounded-[3px] bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition-all"
            >
              ⬇ PNG
            </button>
            <button
              onClick={copyPng}
              className={`rounded-[3px] px-4 py-2 text-sm font-bold transition-all ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-200"
              }`}
            >
              {copied ? "✅ Copied!" : "📋 Copy"}
            </button>
            <button
              onClick={downloadResourcePack}
              className="rounded-[3px] bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition-all"
            >
              📦 Pack .zip
            </button>
          </div>
        </div>

        {/* Multi-size preview strip */}
        <div className="rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
          <h4 className="mb-3 text-sm font-bold text-slate-100">全サイズプレビュー</h4>
          <div className="flex flex-wrap gap-4 items-end">
            {previewSizes.map((sz) => (
              <div key={sz} className="flex flex-col items-center gap-2">
                <VanillaCanvas map={weaponDef.map} palette={palette} size={sz} mode={mode} plus={plusOptions} theme={theme} />
                <span className="text-[10px] font-mono text-slate-400">{sz}×{sz}</span>
              </div>
            ))}
          </div>

          {/* Recent exports */}
          {history.length > 0 && (
            <div className="mt-4 border-t border-[#29233f] pt-4">
              <h5 className="mb-2 text-xs font-bold uppercase text-slate-400">エクスポート履歴</h5>
              <div className="flex flex-wrap gap-2">
                {history.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    download={item.label}
                    className="group relative flex h-14 w-14 items-center justify-center rounded-[3px] border border-[#3a3357] bg-[#171c21] p-1 hover:border-emerald-500 transition-all"
                  >
                    <img
                      src={item.url}
                      alt={item.label}
                      className="h-10 w-10 object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Palette preview */}
          <div className="mt-4 border-t border-[#29233f] pt-4">
            <h5 className="mb-2 text-xs font-bold uppercase text-slate-400">パレット</h5>
            <div className="flex gap-1">
              {(["light", "mid", "dark", "shadow", "handleLight", "handleDark", "guardLight", "guardDark"] as const).map(
                (k) => (
                  <div key={k} className="flex flex-col items-center gap-1">
                    <span
                      className="h-6 w-6 rounded border border-slate-600"
                      style={{ background: `rgb(${palette[k].join(",")})` }}
                    />
                    <span className="text-[8px] text-slate-500">{k.slice(0, 4)}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Batch export all tiers */}
          <div className="mt-4 border-t border-[#29233f] pt-4">
            <h5 className="mb-2 text-xs font-bold uppercase text-slate-400">バッチエクスポート</h5>
            <button
              onClick={async () => {
                for (const t of TIER_KEYS) {
                  const p = TIER_PALETTES[t];
                  const c = renderOffscreen(weaponDef.map, p, outSize, mode, plus);
                  downloadDataUrl(
                    c.toDataURL("image/png"),
                    `${vanillaTexturePath(weaponDef, t) ?? `${t}_${weaponDef.baseName}`}${fileSuffix}_${outSize}x${outSize}.png`
                  );
                  await sleep(200);
                }
              }}
              className="w-full rounded-[3px] bg-[#1d242a] hover:bg-slate-700 py-2 text-xs font-semibold text-slate-300 transition-all"
            >
              全ティア({TIER_KEYS.length}種)をダウンロード
            </button>
            {onApplyToStudio && (
              <button
                onClick={() => {
                  const p = palette;
                  const pal: Palette = {
                    blade: rgbHex(p.mid),
                    bladeEdge: rgbHex(p.light),
                    bladeCore: rgbHex(p.dark),
                    guard: rgbHex(p.guardDark),
                    guardAccent: rgbHex(p.guardLight),
                    handle: rgbHex(p.handleDark),
                    handleAccent: rgbHex(p.handleLight),
                    pommel: rgbHex(p.guardLight),
                    outline: rgbHex(p.shadow),
                    spur: rgbHex(p.light),
                  };
                  onApplyToStudio({
                    palette: pal,
                    silhouette: SILHOUETTE_FOR[weapon] ?? "straight",
                    surface: mode === "vanilla_plus" ? "vanilla_plus" : "vanilla",
                    element: "none",
                    effectPreset: "calm",
                    detailLevel: "minecraft",
                    shading: 0.62,
                    noise: 0.08,
                    outline: true,
                    outlineColorMode: "dark",
                    antiAlias: false,
                    gradientBlade: false,
                    gem: false,
                    filigree: false,
                    spurs: false,
                    boneSpurs: false,
                    crystalShards: false,
                    tipColor: rgbHex(p.light),
                    midGradientColor: rgbHex(p.mid),
                    gemColor: rgbHex(p.light),
                    shardColor: rgbHex(p.light),
                });
                }}
                className="mt-2 w-full rounded-[3px] border border-emerald-700 bg-emerald-950/40 py-2 text-xs font-semibold text-emerald-300 transition-all hover:border-emerald-500 hover:bg-emerald-900/40"
              >
                → この見た目をスタジオへ転送（{themeLabel} × {weaponDef.label}）
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Full Arsenal Grid: all weapons in current tier ─── */}
      <div className="rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-100">
            ⚔️ 全武器一覧 · {themeLabel}ティア
          </h4>
          <button
            onClick={async () => {
              for (const w of WEAPON_DEFS) {
                const c = renderOffscreen(w.map, palette, outSize, mode, plus);
                downloadDataUrl(
                  c.toDataURL("image/png"),
                  `${vanillaTexturePath(w, tier) ?? `${tier}_${w.baseName}`}${fileSuffix}_${outSize}x${outSize}.png`
                );
                await sleep(200);
              }
            }}
            className="rounded-[3px] bg-[#1d242a] hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all"
          >
            全武器を一括ダウンロード
          </button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
          {WEAPON_DEFS.map((w) => (
            <button
              key={w.id}
              onClick={() => setWeapon(w.id)}
              className={`flex flex-col items-center gap-2 rounded-[3px] border p-3 transition-all ${
                weapon === w.id
                  ? "border-emerald-500 bg-emerald-600/12 ring-1 ring-emerald-500/35"
                  : "border-[#29233f] bg-[#171c21]/50 hover:border-slate-600 hover:bg-[#1d242a]/50"
              }`}
            >
              <VanillaCanvas map={w.map} palette={palette} size={16} displaySize={48} mode={mode} plus={plusOptions} theme={theme} />
              <span className="text-[10px] font-semibold text-slate-300 leading-tight text-center">
                {w.emoji} {w.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tier Comparison Strip: current weapon across all tiers ─── */}
      <div className="rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
        <h4 className="mb-4 text-sm font-bold text-slate-100">
          🎨 {weaponDef.label} · 全素材比較
        </h4>
        <div className="flex flex-wrap gap-4">
          {TIER_KEYS.map((t) => {
            const p = TIER_PALETTES[t];
            return (
              <button
                key={t}
                onClick={() => { setUseCustom(false); setTier(t); }}
                className={`flex flex-col items-center gap-2 rounded-[3px] border p-3 transition-all ${
                  !useCustom && tier === t
                    ? "border-emerald-500 bg-emerald-600/12 ring-1 ring-emerald-500/35"
                    : "border-[#29233f] bg-[#171c21]/50 hover:border-slate-600"
                }`}
              >
                <VanillaCanvas map={weaponDef.map} palette={p} size={16} displaySize={48} mode={mode} plus={plusOptions} theme={theme} />
                <span className="text-[10px] font-semibold text-slate-300">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Custom Palette Builder ─── */}
      <div className="rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h4 className="text-sm font-bold text-slate-100">
            🎨 カスタムパレット (Custom Palette)
          </h4>
          <button
            onClick={() => setUseCustom((v) => !v)}
            className={`rounded-[3px] px-3 py-1 text-xs font-bold transition-all ${
              useCustom
                ? "bg-emerald-600 text-white"
                : "bg-[#1d242a] text-slate-300 hover:bg-slate-700"
            }`}
          >
            {useCustom ? "✓ メインプレビューに適用中" : "このカスタムパレットをメインに適用"}
          </button>
        </div>
        <p className="mb-3 text-[11px] text-slate-400">
          ベースカラーと陰影温度を指定すると、Minecraftの陰影ルール（ハイライト→ミッド→シャドウ）に沿って自動で9色パレットを生成します。
        </p>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <span className="text-xs text-slate-300">ベースカラー</span>
            <input
              type="color"
              value={customBase}
              onChange={(e) => setCustomBase(e.target.value)}
              className="h-8 w-12 rounded cursor-pointer"
            />
            <span className="font-mono text-xs text-slate-400">{customBase}</span>
          </label>
          <div className="flex items-center gap-1">
            {(
              [
                { id: "cool", label: "寒色シフト" },
                { id: "neutral", label: "ニュートラル" },
                { id: "warm", label: "暖色シフト" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setCustomTone(t.id)}
                className={`rounded-[2px] px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  customTone === t.id
                    ? "bg-emerald-600 text-white"
                    : "bg-[#1d242a] text-slate-400 hover:bg-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <CustomPalettePreview weaponDef={weaponDef} palette={customPalette} baseColor={customBase} mode={mode} plus={plusOptions} theme={theme} />
      </div>
    </div>
  );
}

/** Custom palette preview: renders the generated 9-tone palette */
function CustomPalettePreview({
  weaponDef,
  palette,
  baseColor,
  mode,
  plus,
  theme,
}: {
  weaponDef: { map: number[][] };
  palette: TierPalette;
  baseColor: string;
  mode: VanillaRenderMode;
  plus: VanillaPlusOptions;
  theme: ThemeId;
}) {
  return (
    <div className="flex items-start gap-4">
      <VanillaCanvas
        map={weaponDef.map}
        palette={palette}
        size={64}
        displaySize={128}
        mode={mode}
        plus={themePlusOptions(theme, plus)}
        theme={theme}
        className="rounded-[3px] bg-[#1d242a]/50"
      />
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase">生成パレット</span>
        <div className="flex gap-1">
          {(["light", "mid", "dark", "shadow", "handleLight", "handleDark", "guardLight", "guardDark", "accent"] as const).map(
            (k) => (
              <div key={k} className="flex flex-col items-center gap-0.5">
                <span
                  className="h-5 w-5 rounded border border-slate-600"
                  style={{ background: `rgb(${palette[k].join(",")})` }}
                />
                <span className="text-[7px] text-slate-500">{k.slice(0, 3)}</span>
              </div>
            )
          )}
        </div>
        <button
          onClick={() => {
            const c = renderOffscreen(weaponDef.map, palette, 64, mode, plus);
            const suffix = mode === "vanilla_plus" ? "_plus" : "";
            downloadDataUrl(c.toDataURL("image/png"), `custom_${baseColor.replace("#", "")}${suffix}_64x64.png`);
          }}
          className="mt-1 self-start rounded-[3px] bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition-all"
        >
          ⬇ カスタムPNGを保存
        </button>
      </div>
    </div>
  );
}