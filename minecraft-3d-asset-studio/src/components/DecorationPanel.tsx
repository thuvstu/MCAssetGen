"use client";

import { useMemo, useState } from "react";
import { Copy, Dices, Eye, EyeOff, Gem, Hammer, Plus, Trash2 } from "lucide-react";
import { DECORATION_DEFS, DECORATION_LIST, DECORATION_RANGES } from "@/lib/decorations/decorations";
import { DECORATION_COLOR_SOURCES, DecorationColorSource, DecorationInstance, DecorationType } from "@/types/model";

interface DecorationPanelProps {
  decorations: DecorationInstance[];
  onAdd: (type: DecorationType) => void;
  onUpdate: (inst: DecorationInstance) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRandomize: () => void;
  onClear: () => void;
  onBake: () => void;
}

const COLOR_LABELS: Record<DecorationColorSource, string> = {
  glow: "発光色",
  accent: "アクセント",
  primary: "主色",
  secondary: "副色",
  highlight: "ハイライト",
  dark: "暗色",
  custom: "カスタム",
};

type NumericKey = keyof typeof DECORATION_RANGES;
const SLIDERS: NumericKey[] = ["count", "size", "radius", "height", "tilt", "twist", "offsetZ", "opacity"];

export function DecorationPanel({ decorations, onAdd, onUpdate, onRemove, onDuplicate, onRandomize, onClear, onBake }: DecorationPanelProps) {
  const [filter, setFilter] = useState<string>("すべて");
  const [expanded, setExpanded] = useState<string | null>(null);
  const groups = useMemo(() => ["すべて", ...Array.from(new Set(DECORATION_LIST.map((definition) => definition.group)))], []);
  const visible = filter === "すべて" ? DECORATION_LIST : DECORATION_LIST.filter((definition) => definition.group === filter);

  return (
    <div className="flex h-full flex-col border-r border-[#2d3139] bg-[#15171e] text-xs text-neutral-300 select-none">
      <div className="border-b border-[#2d3139] bg-gradient-to-r from-fuchsia-900/30 via-[#1a1d24] to-cyan-900/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <Gem className="h-4 w-4 text-fuchsia-300" />
          <div>
            <h2 className="text-xs font-black tracking-wide text-white">DECORATION STUDIO</h2>
            <p className="text-[10px] text-neutral-400">26種の調節可能装飾 · すべて実キューブとして書き出し可能</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-b border-[#262a34] p-3">
        <div className="flex flex-wrap gap-1">
          {groups.map((group) => (
            <button key={group} onClick={() => setFilter(group)} className={`rounded px-2 py-0.5 text-[10px] font-semibold ${filter === group ? "bg-fuchsia-600 text-white" : "bg-[#101217] text-neutral-400 hover:text-white"}`}>
              {group}
            </button>
          ))}
        </div>
        <div className="grid max-h-40 grid-cols-3 gap-1 overflow-y-auto pr-1">
          {visible.map((definition) => (
            <button key={definition.type} onClick={() => onAdd(definition.type)} title={definition.description} className="flex items-center gap-1 rounded border border-[#2d3139] bg-[#101217] px-1.5 py-1.5 text-left text-[10px] text-neutral-200 transition hover:border-fuchsia-500/60">
              <Plus className="h-3 w-3 shrink-0 text-fuchsia-300" />
              <span className="truncate">{definition.labelJa}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1">
          <button onClick={onRandomize} className="flex items-center justify-center gap-1 rounded bg-[#262a34] py-1.5 text-[10px] text-neutral-200 hover:bg-[#323744]">
            <Dices className="h-3 w-3" /> ランダム
          </button>
          <button onClick={onBake} disabled={decorations.length === 0} className="flex items-center justify-center gap-1 rounded bg-amber-600 py-1.5 text-[10px] font-bold text-white hover:bg-amber-500 disabled:opacity-40" title="装飾を通常キューブとして確定(手動編集可能に)">
            <Hammer className="h-3 w-3" /> 確定
          </button>
          <button onClick={onClear} disabled={decorations.length === 0} className="flex items-center justify-center gap-1 rounded bg-[#262a34] py-1.5 text-[10px] text-neutral-200 hover:bg-rose-900/60 disabled:opacity-40">
            <Trash2 className="h-3 w-3" /> 全削除
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {decorations.length === 0 && <p className="py-8 text-center text-[11px] leading-relaxed text-neutral-500">上のボタンから装飾を追加してください。<br />各レイヤーは数・サイズ・位置・傾き・ねじれ・色・発光を自由に調節できます。</p>}
        {decorations.map((inst) => {
          const definition = DECORATION_DEFS[inst.type];
          const open = expanded === inst.id;
          const set = (patch: Partial<DecorationInstance>) => onUpdate({ ...inst, ...patch });
          return (
            <div key={inst.id} className={`rounded-lg border ${inst.enabled ? "border-[#363b48]" : "border-[#22252e] opacity-60"} bg-[#1a1d26]`}>
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <button onClick={() => set({ enabled: !inst.enabled })} className="p-0.5 text-neutral-400 hover:text-white" title={inst.enabled ? "非表示" : "表示"}>
                  {inst.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => setExpanded(open ? null : inst.id)} className="flex-1 truncate text-left text-[11px] font-bold text-white">
                  {definition.labelJa}
                  <span className="ml-1 text-[9px] font-normal text-neutral-500">{definition.group}</span>
                </button>
                <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: inst.colorSource === "custom" ? inst.customColor : undefined }} />
                <button onClick={() => onDuplicate(inst.id)} className="p-0.5 text-neutral-400 hover:text-white" title="複製">
                  <Copy className="h-3 w-3" />
                </button>
                <button onClick={() => onRemove(inst.id)} className="p-0.5 text-neutral-400 hover:text-rose-400" title="削除">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              {open && (
                <div className="space-y-1.5 border-t border-[#262a34] p-2.5">
                  {SLIDERS.map((key) => {
                    const range = DECORATION_RANGES[key];
                    const value = inst[key];
                    return (
                      <label key={key} className="block">
                        <div className="flex justify-between text-[10px] text-neutral-400">
                          <span>{range.label}</span>
                          <span className="font-mono text-fuchsia-300">{Number.isInteger(range.step) ? value : value.toFixed(2)}</span>
                        </div>
                        <input type="range" min={range.min} max={range.max} step={range.step} value={value} onChange={(event) => set({ [key]: Number(event.target.value) } as Partial<DecorationInstance>)} className="w-full accent-fuchsia-500" />
                      </label>
                    );
                  })}
                  <div className="flex items-center gap-1.5">
                    <select value={inst.colorSource} onChange={(event) => set({ colorSource: event.target.value as DecorationColorSource })} className="flex-1 rounded border border-[#2d3139] bg-[#101217] px-1.5 py-1 text-[10px] text-neutral-200 outline-none">
                      {DECORATION_COLOR_SOURCES.map((source) => (
                        <option key={source} value={source}>
                          {COLOR_LABELS[source]}
                        </option>
                      ))}
                    </select>
                    {inst.colorSource === "custom" && <input type="color" value={inst.customColor} onChange={(event) => set({ customColor: event.target.value })} className="h-6 w-6 cursor-pointer rounded border border-[#2d3139] bg-transparent" />}
                  </div>
                  <div className="flex gap-3 text-[10px]">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={inst.emissive} onChange={(event) => set({ emissive: event.target.checked })} className="accent-fuchsia-500" /> 発光
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={inst.mirror} onChange={(event) => set({ mirror: event.target.checked })} className="accent-fuchsia-500" /> 左右ミラー
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
