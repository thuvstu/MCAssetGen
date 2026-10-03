import React from 'react';
import { Lock, LockOpen, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';
import { useForge, ForgeContext } from '../hooks/useForge';
import { LockKey, allLocked, anyLocked } from '../lib/locks';
import { PanelTitle } from './ornaments';

/* ── 🔒 Lock pin ── */
export function LockPin({ keys, size = 'sm', label }: { keys: LockKey | LockKey[]; size?: 'sm' | 'md'; label?: string }) {
  const { locks, setLocks } = useForge();
  const arr = Array.isArray(keys) ? keys : [keys];
  const all = allLocked(locks, arr);
  const some = !all && anyLocked(locks, arr);
  const lockedN = arr.filter((k) => locks[k]).length;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setLocks(arr, !all); }}
      title={all ? '固定を解除' : '固定（ランダム時に変更しない）'}
      className={cn(
        'group/pin inline-flex shrink-0 items-center gap-1 rounded-md transition',
        size === 'sm' ? 'h-5 px-1' : 'h-6 px-1.5',
        all ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-300/40' : some ? 'bg-amber-400/10 text-amber-400/70' : 'text-stone-600 hover:bg-white/8 hover:text-stone-300',
      )}
    >
      {all || some ? <Lock className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} /> : <LockOpen className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5', 'opacity-60 group-hover/pin:opacity-100')} />}
      {label && <span className="text-[10px] font-semibold">{label}</span>}
      {arr.length > 1 && (all || some) && <span className="font-mono text-[9px]">{lockedN}/{arr.length}</span>}
    </button>
  );
}

function FieldLabel({ label, lockKey, right }: { label: string; lockKey?: LockKey; right?: React.ReactNode }) {
  const { locks } = useForge();
  const locked = lockKey ? !!locks[lockKey] : false;
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5">
        <span className={cn('text-xs font-medium', locked ? 'text-amber-200' : 'text-stone-400')}>{label}</span>
        {lockKey && <LockPin keys={lockKey} />}
      </span>
      {right}
    </div>
  );
}

/* ── Section (collapsible panel) ── */
export function Section({ title, icon, keys, children, defaultOpen = true, tone = 'amber' }: {
  title: string; icon?: React.ReactNode; keys?: LockKey[]; children: React.ReactNode; defaultOpen?: boolean;
  tone?: 'amber' | 'violet' | 'fuchsia' | 'cyan' | 'emerald';
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const forge = React.useContext(ForgeContext)!;
  const lockedN = keys ? keys.filter((k) => forge.locks[k]).length : 0;
  const toneCls = { amber: 'text-amber-300/90', violet: 'text-violet-300', fuchsia: 'text-fuchsia-300', cyan: 'text-cyan-300', emerald: 'text-emerald-300' }[tone];
  return (
    <div className={cn('panel-luxe overflow-hidden rounded-2xl', lockedN > 0 && 'ring-1 ring-amber-300/25')}>
      <div className="flex items-center gap-1 pr-2">
        <button onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 items-center justify-between px-4 py-3 text-left transition hover:bg-white/[0.03]">
          <PanelTitle
            title={title}
            icon={icon && <span className={toneCls}>{icon}</span>}
            right={lockedN > 0 ? <span className="rounded-md bg-amber-400/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300">🔒{lockedN}</span> : undefined}
          />
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-stone-500 transition-transform duration-300', open && 'rotate-180')} />
        </button>
        {keys && keys.length > 0 && (
          <LockPin keys={keys} size="md" />
        )}
      </div>
      <div className="hairline opacity-30" />
      <div className={cn('grid transition-all duration-300 ease-out', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
        <div className="overflow-hidden">
          <div className="space-y-4 px-4 pb-4 pt-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Slider ── */
export function Slider({ label, value, min, max, step = 0.01, onChange, format, lockKey }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; format?: (v: number) => string; lockKey?: LockKey;
}) {
  return (
    <div>
      <FieldLabel label={label} lockKey={lockKey}
        right={<span className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-amber-200/90">{format ? format(value) : value.toFixed(2)}</span>} />
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="arcane-slider w-full" />
    </div>
  );
}

/* ── Color field ── */
export function ColorField({ label, value, onChange, swatches, lockKey }: {
  label: string; value: string; onChange: (v: string) => void; swatches?: string[]; lockKey?: LockKey;
}) {
  return (
    <div>
      <FieldLabel label={label} lockKey={lockKey}
        right={
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase text-stone-500">{value}</span>
            <label className="relative h-6 w-9 cursor-pointer overflow-hidden rounded-lg border border-white/15 shadow-inner" style={{ background: value }}>
              <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
            </label>
          </div>
        } />
      {swatches && (
        <div className="flex flex-wrap gap-1.5">
          {swatches.map((s) => (
            <button key={s} onClick={() => onChange(s)} title={s}
              className={cn('h-5 w-5 rounded-full border transition hover:scale-110', value.toLowerCase() === s.toLowerCase() ? 'border-amber-300 ring-1 ring-amber-300/60' : 'border-white/15')}
              style={{ background: s }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Segmented control ── */
export function Segmented<T extends string>({ label, value, options, onChange, cols = 3, lockKey, tone = 'amber' }: {
  label: string; value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void; cols?: number; lockKey?: LockKey; tone?: 'amber' | 'violet' | 'fuchsia' | 'cyan';
}) {
  const active = {
    amber: 'from-amber-300/25 to-amber-500/15 text-amber-100 ring-amber-300/30',
    violet: 'from-violet-500/30 to-fuchsia-500/15 text-violet-100 ring-violet-400/40',
    fuchsia: 'from-fuchsia-500/30 to-pink-500/15 text-fuchsia-100 ring-fuchsia-400/40',
    cyan: 'from-cyan-500/30 to-teal-500/15 text-cyan-100 ring-cyan-400/40',
  }[tone];
  return (
    <div>
      <FieldLabel label={label} lockKey={lockKey} />
      <div className="grid gap-1 rounded-xl bg-black/30 p-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {options.map((o) => (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={cn('rounded-lg px-1 py-1.5 text-[11px] font-medium transition-all duration-200',
              value === o.value ? cn('bg-gradient-to-b shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] ring-1', active) : 'text-stone-500 hover:bg-white/5 hover:text-stone-300')}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Icon grid ── */
export function IconGrid<T extends string>({ label, value, options, onChange, cols = 4, lockKey, tone = 'violet', showLabel = true, maxHeight }: {
  label: string; value: T; options: Array<{ value: T; icon: React.ReactNode; label?: string }>; onChange: (v: T) => void;
  cols?: number; lockKey?: LockKey; tone?: 'amber' | 'violet' | 'fuchsia' | 'cyan'; showLabel?: boolean; maxHeight?: number;
}) {
  const active = {
    amber: 'from-amber-300/25 to-amber-500/10 text-amber-100 ring-amber-300/40',
    violet: 'from-violet-500/30 to-fuchsia-500/15 text-violet-100 ring-violet-400/40',
    fuchsia: 'from-fuchsia-500/30 to-pink-500/15 text-fuchsia-100 ring-fuchsia-400/40',
    cyan: 'from-cyan-500/30 to-teal-500/15 text-cyan-100 ring-cyan-400/40',
  }[tone];
  return (
    <div>
      <FieldLabel label={label} lockKey={lockKey} />
      <div className={cn('custom-scroll grid gap-1 rounded-xl bg-black/30 p-1', maxHeight && 'overflow-y-auto')} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, maxHeight }}>
        {options.map((o) => (
          <button key={o.value} onClick={() => onChange(o.value)} title={o.label ?? o.value}
            className={cn('flex flex-col items-center gap-1 rounded-lg py-2 transition-all duration-200',
              value === o.value ? cn('bg-gradient-to-b ring-1', active) : 'text-stone-500 hover:bg-white/5 hover:text-stone-300')}>
            {o.icon}
            {showLabel && <span className="text-[9px] font-medium leading-none">{o.label ?? o.value}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Toggle ── */
export function Toggle({ label, value, onChange, hint, lockKey }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string; lockKey?: LockKey }) {
  const { locks } = useForge();
  const locked = lockKey ? !!locks[lockKey] : false;
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(!value)} className="flex min-w-0 flex-1 items-center justify-between rounded-xl px-1 py-1 text-left transition hover:bg-white/[0.03]">
        <span className="min-w-0">
          <span className={cn('block text-xs font-medium', locked ? 'text-amber-200' : 'text-stone-300')}>{label}</span>
          {hint && <span className="block text-[11px] text-stone-600">{hint}</span>}
        </span>
        <span className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300', value ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-white/10')}>
          <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-300', value ? 'left-[18px]' : 'left-0.5')} />
        </span>
      </button>
      {lockKey && <LockPin keys={lockKey} />}
    </div>
  );
}

/* ── Stepper ── */
export function Stepper({ label, value, min, max, onChange, lockKey }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; lockKey?: LockKey }) {
  const { locks } = useForge();
  const locked = lockKey ? !!locks[lockKey] : false;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5">
        <span className={cn('text-xs font-medium', locked ? 'text-amber-200' : 'text-stone-400')}>{label}</span>
        {lockKey && <LockPin keys={lockKey} />}
      </span>
      <div className="flex items-center gap-1 rounded-lg bg-black/30 p-0.5">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 transition hover:bg-white/10 hover:text-white">−</button>
        <span className="w-6 text-center font-mono text-xs text-amber-200">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 transition hover:bg-white/10 hover:text-white">+</button>
      </div>
    </div>
  );
}

/* ── Chip (pool selection) ── */
export function Chip({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button onClick={onClick}
      className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition',
        active ? 'border-fuchsia-300/50 bg-fuchsia-500/20 text-fuchsia-100' : 'border-white/10 text-stone-500 hover:border-white/25 hover:text-stone-300')}>
      {color && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  );
}
