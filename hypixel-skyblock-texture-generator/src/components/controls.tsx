import { memo, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { RARITY_COLOR, RARITY_JP, type ItemDef } from '../lib/items';
import { generateTexture } from '../lib/generator';
import type { ShapeOptions, StyleOptions, TextureEssence } from '../lib/design';

export function Slider({ label, jp, value, onChange, min = 0, max = 200 }: { label: string; jp: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="group">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[11px] font-bold tracking-wide text-slate-300">{jp} <span className="ml-1 font-mono text-[10px] font-normal text-slate-500">{label}</span></span>
        <span className="font-pixel rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-amber-300">{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" style={{ ['--fill' as string]: `${pct}%` }} />
    </div>
  );
}

export function EssenceSlider({ label, jp, value, onChange, max = 1 }: { label: string; jp: string; value: number; onChange: (v: number) => void; max?: number }) {
  const pct = (value / max) * 100;
  return (
    <label className="block min-w-0">
      <span className="mb-1 flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-bold text-slate-300">{jp}<span className="ml-1 font-mono text-[9px] font-normal tracking-wide text-slate-600">{label}</span></span>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-cyan-200">{value.toFixed(2)}</span>
      </span>
      <input type="range" min={0} max={max} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" style={{ ['--fill' as string]: `${pct}%` }} />
    </label>
  );
}

export const ItemThumb = memo(function ItemThumb({ item, active, style, essence, shape, onSelect }: { item: ItemDef; active: boolean; style: StyleOptions; essence: TextureEssence; shape: ShapeOptions; onSelect: (id: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) generateTexture(ref.current, item, 32, style, 7, item.palette, essence, undefined, shape);
  }, [item, style, essence, shape]);
  return (
    <button onClick={() => onSelect(item.id)} className={`group flex w-full items-center gap-2.5 rounded-xl border p-2 text-left transition-all ${active ? 'border-amber-400/70 bg-amber-400/10 shadow-[0_0_20px_rgba(245,197,66,.15)]' : 'border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]'}`}>
      <span className="checker flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-black/60"><canvas ref={ref} width={32} height={32} className="pixelated h-9 w-9" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold leading-tight text-slate-100">{item.jp}</span>
        <span className="block truncate font-mono text-[10px] text-slate-500">{item.name}</span>
        <span className="mt-0.5 inline-block rounded px-1 py-px font-pixel text-[10px]" style={{ color: RARITY_COLOR[item.rarity], background: `${RARITY_COLOR[item.rarity]}14` }}>{RARITY_JP[item.rarity]}</span>
      </span>
      {active && <Check className="h-4 w-4 shrink-0 text-amber-400" />}
    </button>
  );
});
