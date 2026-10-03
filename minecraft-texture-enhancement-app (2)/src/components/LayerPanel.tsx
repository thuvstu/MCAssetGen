import { useState } from 'react';
import { EFFECT_MAP, Layer, ParamDef, defaultParams, isLayerAnimated } from '../lib/effects';

interface Props {
  layers: Layer[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<Layer>, coalesceKey?: string) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}

function ParamControl({ def, value, onChange }: { def: ParamDef; value: any; onChange: (v: any) => void }) {
  switch (def.type) {
    case 'range':
      return (
        <label className="block">
          <div className="flex justify-between text-[11px] text-zinc-400">
            <span>{def.label}</span>
            <span className="font-mono text-zinc-200">{value}</span>
          </div>
          <input
            type="range" min={def.min} max={def.max} step={def.step ?? 1} value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full accent-lime-500 h-4"
          />
        </label>
      );
    case 'color':
      return (
        <label className="flex items-center justify-between text-[11px] text-zinc-400 gap-2">
          <span>{def.label}</span>
          <span className="flex items-center gap-1">
            <span className="font-mono text-zinc-300">{value}</span>
            <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-6 bg-transparent cursor-pointer" />
          </span>
        </label>
      );
    case 'select':
      return (
        <label className="flex items-center justify-between text-[11px] text-zinc-400 gap-2">
          <span className="shrink-0">{def.label}</span>
          <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-zinc-100 text-xs min-w-0 max-w-[60%]">
            {def.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      );
    case 'bool':
      return (
        <label className="flex items-center justify-between text-[11px] text-zinc-400 cursor-pointer">
          <span>{def.label}</span>
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="accent-lime-500 w-4 h-4" />
        </label>
      );
  }
}

export default function LayerPanel({ layers, selected, onSelect, onChange, onMove, onRemove, onDuplicate }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  if (!layers.length)
    return (
      <div className="text-center text-zinc-500 text-sm py-8 px-4 border-2 border-dashed border-zinc-700 rounded">
        エフェクトがありません<br />
        <span className="text-xs">左のライブラリやプリセットから追加してください</span>
      </div>
    );
  // display top of stack first
  const ordered = layers.map((l, i) => ({ l, i })).reverse();
  return (
    <div className="flex flex-col gap-1.5">
      {ordered.map(({ l, i }) => {
        const def = EFFECT_MAP[l.type];
        if (!def) return null;
        const open = selected === l.id;
        const anim = isLayerAnimated(l);
        return (
          <div
            key={l.id}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragIdx !== null && dragIdx !== i) onMove(dragIdx, i); setDragIdx(null); }}
            className={`rounded border-2 transition-colors ${open ? 'border-lime-500 bg-zinc-800' : 'border-zinc-700 bg-zinc-800/60 hover:border-zinc-500'} ${!l.enabled ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer" onClick={() => onSelect(open ? null : l.id)}>
              <span className="text-zinc-600 cursor-grab text-xs">⋮⋮</span>
              <span className="text-base w-5 text-center">{def.icon}</span>
              <span className="text-sm flex-1 truncate">{def.name}</span>
              {anim && <span className="text-[9px] bg-fuchsia-600 px-1 rounded">ANIM</span>}
              <button title="表示切替" className="w-6 h-6 hover:bg-zinc-700 rounded text-xs" onClick={(e) => { e.stopPropagation(); onChange(l.id, { enabled: !l.enabled }); }}>
                {l.enabled ? '👁' : '🚫'}
              </button>
              <button title="上へ" disabled={i === layers.length - 1} className="w-5 h-6 hover:bg-zinc-700 rounded text-xs disabled:opacity-20" onClick={(e) => { e.stopPropagation(); onMove(i, i + 1); }}>▲</button>
              <button title="下へ" disabled={i === 0} className="w-5 h-6 hover:bg-zinc-700 rounded text-xs disabled:opacity-20" onClick={(e) => { e.stopPropagation(); onMove(i, i - 1); }}>▼</button>
            </div>
            {open && (
              <div className="px-3 pb-3 pt-1 flex flex-col gap-2 border-t border-zinc-700">
                <p className="text-[11px] text-zinc-500">{def.desc}</p>
                <label className="block">
                  <div className="flex justify-between text-[11px] text-zinc-400"><span>レイヤー不透明度</span><span className="font-mono text-zinc-200">{l.opacity}%</span></div>
                  <input type="range" min={0} max={100} value={l.opacity} onChange={(e) => onChange(l.id, { opacity: +e.target.value }, 'op' + l.id)} className="w-full accent-lime-500 h-4" />
                </label>
                {def.params.map((pd) => (
                  <ParamControl
                    key={pd.key}
                    def={pd}
                    value={l.params[pd.key]}
                    onChange={(v) => onChange(l.id, { params: { ...l.params, [pd.key]: v } }, 'p' + l.id + pd.key)}
                  />
                ))}
                <div className="flex gap-1 pt-1 flex-wrap">
                  <button className="btn-mini" onClick={() => onChange(l.id, { seed: Math.floor(Math.random() * 99999) })}>🎲 乱数</button>
                  <button className="btn-mini" onClick={() => onChange(l.id, { params: defaultParams(def), opacity: 100 })}>↺ リセット</button>
                  <button className="btn-mini" onClick={() => onDuplicate(l.id)}>⧉ 複製</button>
                  <button className="btn-mini hover:!bg-red-700" onClick={() => onRemove(l.id)}>🗑 削除</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
