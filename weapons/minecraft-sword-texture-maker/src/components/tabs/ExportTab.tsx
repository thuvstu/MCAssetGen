import { useEffect, useState } from "react";
import { TIER_CONFIG } from "../../engine";
import {
  MC_VERSIONS,
  SERVER_BASE_ITEMS,
  type McVersion,
  type ServerItemConfig,
} from "../../studio/exports";
import { Icon } from "../Icon";
import type { ExportActions, TabBaseProps } from "./shared";

export function ExportTab({
  opts,
  name,
  setName,
  customTier,
  setCustomTier,
  actions,
}: Omit<TabBaseProps, "update"> & {
  name: string;
  setName: (v: string) => void;
  customTier: string;
  setCustomTier: (v: string) => void;
  actions: ExportActions;
}) {
  const [frames, setFrames] = useState(8);
  const [copied, setCopied] = useState(false);
  const [cmdCopied, setCmdCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  // Multiplayer server item (CIT / CustomModelData) settings
  const [baseItem, setBaseItem] = useState<string>("diamond_sword");
  const [matchMode, setMatchMode] = useState<"both" | "cit" | "cmd">("both");
  const [citName, setCitName] = useState<string>("");
  const [cmdNumber, setCmdNumber] = useState<number>(1001);
  const [version, setVersion] = useState<McVersion>(MC_VERSIONS[MC_VERSIONS.length - 2]); // 1.21.x

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  useEffect(() => {
    if (!cmdCopied) return;
    const id = setTimeout(() => setCmdCopied(false), 2000);
    return () => clearTimeout(id);
  }, [cmdCopied]);

  const handleCopy = async () => {
    setCopyError("");
    try {
      await actions.copyPng();
      setCopied(true);
    } catch (error) {
      setCopyError(
        error instanceof Error
          ? error.message
          : "コピーできませんでした。PNG書き出しをご利用ください。"
      );
    }
  };

  const effectiveCitName = citName.trim() || name.replace(/_/g, " ") || "Custom Blade";

  const giveCommand = version.modernModels
    ? `/give @s minecraft:${baseItem}[custom_model_data={floats:[${cmdNumber}]},item_name='{"text":"${effectiveCitName}","italic":false}']`
    : version.packFormat >= 32
      ? `/give @s minecraft:${baseItem}[custom_model_data=${cmdNumber},item_name='{"text":"${effectiveCitName}","italic":false}']`
      : `/give @s minecraft:${baseItem}{CustomModelData:${cmdNumber},display:{Name:'{"text":"${effectiveCitName}","italic":false}'}}`;

  const serverConfig: ServerItemConfig = {
    baseItem,
    matchMode,
    citName: effectiveCitName,
    cmd: cmdNumber,
    version,
  };

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
        <h3 className="text-sm font-bold text-slate-100">Export &amp; Resource Pack</h3>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Texture Name</label>
          <div className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase())}
              className="flex-1 rounded-[3px] border border-[#3a3357] bg-[#171c21] px-3 py-2 font-mono text-sm text-slate-100 outline-none ring-emerald-500 focus:ring-2"
              placeholder="diamond_sword"
            />
            <span className="font-mono text-xs text-slate-500">.png</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Rarity Tier</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"] as const).map((tierKey) => {
              const t = TIER_CONFIG[tierKey];
              const active = customTier === tierKey;
              return (
                <button
                  key={tierKey}
                  onClick={() => setCustomTier(tierKey)}
                  className={`rounded-[3px] py-1.5 text-xs font-black uppercase transition-all ${
                    active ? "ring-2 ring-white" : "bg-[#1d242a]/80 hover:bg-slate-700"
                  }`}
                  style={{ background: active ? t.bg : undefined, color: t.color }}
                >
                  {tierKey}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 border-t border-[#29233f] pt-3">
          <button
            onClick={actions.downloadPNG}
            className="flex w-full items-center justify-center gap-2 rounded-[3px] bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 py-3 text-sm font-bold text-[#2a1d05] shadow-[inset_1px_1px_0_#fff8e0,inset_-1px_-2px_0_#8a6412,0_6px_20px_-8px_#f2c14eaa] hover:brightness-105 active:scale-98 transition-all"
          >
            <Icon name="download" size={16} />
            <span>Download Texture ({opts.size}×{opts.size} PNG)</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded-[3px] bg-[#1d242a] hover:bg-slate-700 py-3 text-sm font-bold text-white transition-all"
          >
            <Icon name={copied ? "check" : "copy"} size={16} />
            <span>{copied ? "Copied!" : "Copy PNG to Clipboard"}</span>
          </button>

          {copyError && (
            <p className="inline-error" role="alert">
              {copyError}
            </p>
          )}

          <button
            onClick={actions.exportAllSizes}
            className="flex w-full items-center justify-center gap-2 rounded-[3px] bg-gradient-to-b from-orange-400 via-red-600 to-red-800 py-3 text-sm font-bold text-[#1f0703] shadow-[inset_1px_1px_0_#ffd9c0,inset_-1px_-2px_0_#7a2312] hover:brightness-105 active:scale-98 transition-all"
          >
            <Icon name="layers" size={16} />
            <span>Batch ZIP (16 / 32 / 64 / 128)</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex rounded-[3px] bg-[#1d242a] p-1">
              {[4, 8, 16].map((f) => (
                <button
                  key={f}
                  onClick={() => setFrames(f)}
                  className={`rounded-[3px] px-3 py-1.5 text-xs font-bold ${
                    frames === f ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f}f
                </button>
              ))}
            </div>
            <button
              onClick={() => actions.downloadSprite(frames)}
              className="flex flex-1 items-center justify-center gap-2 rounded-[3px] bg-gradient-to-b from-sky-400 via-sky-600 to-blue-800 py-2.5 text-sm font-bold text-[#04121f] shadow-[inset_1px_1px_0_#cfe9ff,inset_-1px_-2px_0_#1c4a75] hover:brightness-105 active:scale-98 transition-all"
            >
              <Icon name="play" size={16} />
              <span>Animation ZIP ({frames} frames)</span>
            </button>
          </div>

          <button
            onClick={actions.downloadZip}
            className="flex w-full items-center justify-center gap-2 rounded-[3px] bg-[#1d242a] border border-[#3a444c] hover:bg-slate-700 py-2.5 text-xs font-bold text-slate-200 transition-all"
          >
            <Icon name="download" size={15} />
            <span>バニラ剣 単純置換パック (.zip)</span>
          </button>

          <button
            onClick={actions.saveCustomPreset}
            disabled={actions.isCustomSaved}
            className="flex w-full items-center justify-center gap-2 rounded-[3px] bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:hover:bg-slate-700 py-2.5 text-sm font-bold text-white transition-all"
          >
            <Icon name="save" size={16} />
            <span>{actions.isCustomSaved ? "Saved to My Presets" : "Save Current as Custom Preset"}</span>
          </button>
        </div>
      </div>

      {/* ─── Multiplayer Server Item Pack (CIT / CustomModelData) ─── */}
      <div className="space-y-4 rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
        <div>
          <h3 className="text-sm font-bold text-amber-300">
            🏯 マルチプレイサーバー用アイテム書き出し (CIT / CustomModelData)
          </h3>
          <p className="mt-1 text-[11px] text-slate-400">
            アジ鯖LifeやRPGサーバーのように、バニラ武器の性能・見た目を保ったまま「金床リネーム (OptiFine / CIT Resewn)」または「CustomModelData」で現在のカスタム武器を表示するリソースパックを生成します。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-300">ベースアイテム</span>
            <select
              value={baseItem}
              onChange={(e) => setBaseItem(e.target.value)}
              className="w-full rounded-[3px] border border-[#3a3357] bg-[#171c21] px-2.5 py-2 text-xs text-slate-100"
            >
              {SERVER_BASE_ITEMS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} ({item.id})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-300">方式</span>
            <select
              value={matchMode}
              onChange={(e) => setMatchMode(e.target.value as "both" | "cit" | "cmd")}
              className="w-full rounded-[3px] border border-[#3a3357] bg-[#171c21] px-2.5 py-2 text-xs text-slate-100"
            >
              <option value="both">CIT + CustomModelData 両対応 (推奨)</option>
              <option value="cit">OptiFine / CIT Resewn (金床リネーム)</option>
              <option value="cmd">CustomModelData のみ (バニラ標準)</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-300">
              CIT 表示名 (金床で付ける名前)
            </span>
            <input
              value={citName}
              onChange={(e) => setCitName(e.target.value)}
              placeholder={name.replace(/_/g, " ") || "氷律剣 ReVerence Code"}
              className="w-full rounded-[3px] border border-[#3a3357] bg-[#171c21] px-2.5 py-1.5 text-xs text-slate-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-300">
              CustomModelData 番号
            </span>
            <input
              type="number"
              min={1}
              value={cmdNumber}
              onChange={(e) => setCmdNumber(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full rounded-[3px] border border-[#3a3357] bg-[#171c21] px-2.5 py-1.5 font-mono text-xs text-slate-100"
            />
          </label>
        </div>

        <div>
          <span className="mb-1.5 block text-[11px] font-semibold text-slate-300">
            対象バージョン (pack_format {version.packFormat})
          </span>
          <div className="grid grid-cols-5 gap-1">
            {MC_VERSIONS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVersion(v)}
                className={`rounded-[2px] py-1 text-[10px] font-mono font-bold transition-all ${
                  version.id === v.id
                    ? "bg-emerald-600 text-white"
                    : "bg-[#1d242a] text-slate-400 hover:bg-slate-700"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[3px] border border-[#2b333b] bg-[#0b0e11] p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400">配布コマンド (/give)</span>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(giveCommand);
                  setCmdCopied(true);
                } catch {
                  // ignore clipboard error
                }
              }}
              className="rounded bg-[#1d242a] px-2 py-0.5 text-[10px] font-semibold text-emerald-300 hover:bg-slate-700"
            >
              {cmdCopied ? "コピー完了" : "コマンドをコピー"}
            </button>
          </div>
          <code className="block break-all font-mono text-[10px] text-amber-300">
            {giveCommand}
          </code>
        </div>

        <button
          onClick={() => actions.downloadServerItem(serverConfig)}
          className="flex w-full items-center justify-center gap-2 rounded-[3px] bg-gradient-to-b from-emerald-400 via-emerald-600 to-teal-700 py-3 text-sm font-bold text-[#04170e] shadow-[inset_1px_1px_0_#c9ffe2,inset_-1px_-2px_0_#14603c,0_6px_20px_-8px_#3ddc84aa] hover:brightness-105 active:scale-98 transition-all"
        >
          <Icon name="download" size={16} />
          <span>サーバー配布用アイテムパック (.zip) を書き出す</span>
        </button>
      </div>
    </div>
  );
}
