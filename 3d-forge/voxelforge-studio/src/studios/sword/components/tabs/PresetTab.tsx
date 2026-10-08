import { useState } from "react";
import { PRESETS, PRESET_CATEGORIES, TIER_CONFIG } from "../../engine";
import type { SwordOptions } from "../../engine";
import { BLADE_LABELS } from "../../generator/catalog";
import { Icon } from "../Icon";
import { SIZES, type TabBaseProps } from "./shared";

const CATEGORY_LABELS: Record<string, string> = {
  all: "すべて",
  serverpack: "サーバーパック",
  skyblock: "SkyBlock",
  fantasy: "ファンタジー",
  gemtools: "宝石ツール",
  dragon: "ドラゴン系",
  machine: "機械剣",
  magic: "魔法剣",
  holy: "聖剣",
  cursed: "禍々しい",
  simple: "素朴な剣",
  rainbow: "虹彩剣",
};

export function PresetTab({
  opts, update, currentPresetKey, applyPreset, customPresets, applyCustom, deleteCustom,
}: TabBaseProps & {
  currentPresetKey: string;
  applyPreset: (key: string) => void;
  customPresets: Record<string, SwordOptions>;
  applyCustom: (key: string) => void;
  deleteCustom: (key: string) => void;
}) {
  const [category, setCategory] = useState<string>("all");
  const filtered = Object.entries(PRESETS).filter(([, p]) => category === "all" || p.category === category);

  return (
    <div className="space-y-4 rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Masterwork Presets ({filtered.length})</h3>
          <p className="text-[11px] text-slate-400">
            マルチサーバー風（宝石・和名アーティファクト）、SkyBlock、神話系プリセット
          </p>
        </div>
        <div className="flex flex-wrap gap-1 text-[11px]">
          {PRESET_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-[3px] px-2.5 py-1 font-semibold transition-all ${
                category === cat
                  ? "bg-emerald-600 text-white"
                  : "bg-[#1d242a] text-slate-400 hover:bg-slate-700"
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {filtered.map(([key, p]) => {
          const pTier = TIER_CONFIG[p.tier];
          const isSelected = currentPresetKey === key;
          return (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`flex flex-col items-start rounded-[3px] p-3 text-left transition-all border ${
                isSelected
                  ? "bg-[#1d242a]/90 ring-2 ring-emerald-500 border-emerald-500"
                  : "bg-[#0b0e11] border-[#29233f]/80 hover:border-[#3a3357] hover:bg-[#1d242a]/50"
              }`}
            >
              <div className="flex w-full items-center justify-between mb-1">
                <span className="h-3 w-3 rounded-full border border-white/20 shadow-sm" style={{ background: p.palette.blade }} />
                <span className="rounded px-1.5 py-0.2 text-[9px] font-black uppercase" style={{ color: pTier.color, background: pTier.bg }}>
                  {p.tier}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-200 line-clamp-1">{p.name}</span>
              <span className="text-[10px] text-slate-500 line-clamp-1">{p.desc}</span>
            </button>
          );
        })}
      </div>

      {Object.keys(customPresets).length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-300">My Presets (保存済み)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(customPresets).map(([key, o]) => (
              <div
                key={key}
                className="group relative flex flex-col items-start rounded-[3px] p-3 text-left border bg-[#0b0e11] border-[#29233f]/80 hover:border-emerald-500 transition-all"
              >
                <div className="flex w-full items-center justify-between mb-1">
                  <span className="h-3 w-3 rounded-full border border-white/20" style={{ background: o.palette.blade }} />
                  <button
                    onClick={() => deleteCustom(key)}
                    className="text-[10px] text-slate-600 hover:text-red-400"
                    title="Delete"
                    aria-label={`${key}を削除`}
                  >
                    <Icon name="close" size={12} />
                  </button>
                </div>
                <button onClick={() => applyCustom(key)} className="w-full text-left">
                  <span className="block text-xs font-bold text-slate-200">{key}</span>
                  <span className="text-[10px] text-slate-500">
                    {o.size}x / {BLADE_LABELS[o.silhouette] ?? o.silhouette}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-[#29233f] pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">Texture Resolution</span>
          <span className="text-[11px] text-slate-500">高解像度ほど細部のベベル・刃文・結晶が精細になります</span>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => update({ size: s })}
              className={`rounded-[3px] py-1.5 text-xs font-mono font-bold transition-all ${
                opts.size === s
                  ? "bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 text-[#2a1d05] shadow-[inset_1px_1px_0_#fff8e0,inset_-1px_-2px_0_#8a6412]"
                  : "bg-[#1d242a]/80 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
