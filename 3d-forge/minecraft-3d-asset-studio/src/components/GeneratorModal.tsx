"use client";

import { useMemo, useState } from "react";
import { Check, Search, Sparkles, X } from "lucide-react";
import { ARCHETYPE_CATALOG, CATALOG_GROUPS } from "@/lib/generators/catalog";
import { PALETTES } from "@/lib/generators/textureBaker";
import { ModelArchetype, ModelTheme, TEXTURE_RESOLUTIONS, TextureResolution } from "@/types/model";

interface GeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (type: ModelArchetype, theme: ModelTheme, resolution: TextureResolution) => void;
}

const RESOLUTION_NOTES: Record<TextureResolution, string> = { 16: "クラシック", 32: "HD", 64: "高精細", 128: "シネマ" };

export function GeneratorModal({ isOpen, onClose, onGenerate }: GeneratorModalProps) {
  const [selectedType, setSelectedType] = useState<ModelArchetype>("sword");
  const [selectedTheme, setSelectedTheme] = useState<ModelTheme>("void");
  const [selectedRes, setSelectedRes] = useState<TextureResolution>(32);
  const [group, setGroup] = useState<string>("すべて");
  const [query, setQuery] = useState("");

  const entries = useMemo(() => {
    const text = query.trim().toLowerCase();
    return ARCHETYPE_CATALOG.filter((entry) => (group === "すべて" || entry.group === group) && (!text || `${entry.labelJa}${entry.description}${entry.type}`.toLowerCase().includes(text)));
  }, [group, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[#2d3139] bg-[#181a22] text-neutral-200 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2d3139] bg-[#1e212b] px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/40 bg-blue-600/20 text-blue-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">モデル鍛造 — {ARCHETYPE_CATALOG.length} 種のアーキタイプ</h2>
              <p className="text-xs text-neutral-400">武器・杖・魔導書・銃器・レリックを UV テクスチャ付きで生成</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-[#282d3b] hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-4 overflow-y-auto p-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1">
              {["すべて", ...CATALOG_GROUPS].map((entry) => (
                <button key={entry} onClick={() => setGroup(entry)} className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${group === entry ? "bg-blue-600 text-white" : "bg-[#1f232d] text-neutral-400 hover:text-white"}`}>
                  {entry}
                </button>
              ))}
              <div className="relative ml-auto">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="検索..." className="w-40 rounded-md border border-[#2d3139] bg-[#101217] py-1 pl-7 pr-2 text-xs outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {entries.map((entry) => {
                const selected = selectedType === entry.type;
                return (
                  <button key={entry.type} onClick={() => setSelectedType(entry.type)} className={`rounded-lg border p-2.5 text-left transition ${selected ? "border-blue-500 bg-blue-600/20 ring-1 ring-blue-500/50" : "border-[#2c313d] bg-[#1f232d] hover:border-[#3d4454]"}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500">{entry.group}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-blue-400" />}
                    </div>
                    <span className="block text-xs font-bold leading-tight text-white">{entry.labelJa}</span>
                    <span className="mt-0.5 line-clamp-2 block text-[10px] text-neutral-400">{entry.description}</span>
                  </button>
                );
              })}
              {entries.length === 0 && <p className="col-span-full py-6 text-center text-xs text-neutral-500">該当なし</p>}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-300">属性テーマ</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.values(PALETTES).map((palette) => {
                const selected = selectedTheme === palette.id;
                return (
                  <button key={palette.id} onClick={() => setSelectedTheme(palette.id)} className={`flex flex-col rounded-lg border p-2 text-left transition ${selected ? "border-purple-500 bg-purple-600/20 ring-1 ring-purple-500/50" : "border-[#2c313d] bg-[#1f232d] hover:border-[#3d4454]"}`}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{palette.name}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                    </div>
                    <div className="flex space-x-1">
                      {[palette.primary, palette.secondary, palette.glow].map((color) => (
                        <span key={color} className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-300">UV アトラス解像度</label>
            <div className="grid grid-cols-4 gap-2">
              {TEXTURE_RESOLUTIONS.map((resolution) => (
                <button key={resolution} onClick={() => setSelectedRes(resolution)} className={`rounded-lg border p-2.5 text-center transition ${selectedRes === resolution ? "border-emerald-500 bg-emerald-600/20 ring-1 ring-emerald-500/50" : "border-[#2c313d] bg-[#1f232d] hover:border-[#3d4454]"}`}>
                  <span className="block text-sm font-bold text-white">
                    {resolution}×{resolution}
                  </span>
                  <span className="text-[10px] text-neutral-400">{RESOLUTION_NOTES[resolution]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#2d3139] bg-[#1a1d26] px-5 py-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-medium text-neutral-400 transition hover:text-white">
            キャンセル
          </button>
          <button
            onClick={() => {
              onGenerate(selectedType, selectedTheme, selectedRes);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg transition hover:opacity-95"
          >
            <Sparkles className="h-4 w-4" /> 鍛造する
          </button>
        </div>
      </div>
    </div>
  );
}
