import type { ReactNode } from "react";

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span className="text-slate-200 font-mono font-semibold">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-amber-400 cursor-pointer"
      />
    </label>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-[3px] bg-slate-800/60 border border-slate-700/60 px-2.5 py-1.5 cursor-pointer hover:border-slate-600 transition-all">
      <span className="text-xs font-medium text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-slate-400 uppercase">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-7 cursor-pointer rounded border-0 bg-transparent"
        />
      </div>
    </label>
  );
}

export function Toggle({
  label,
  desc,
  checked,
  onChange,
  children,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <div
      className={`rounded-[3px] border transition-all p-3 ${
        checked
          ? "border-emerald-500/50 bg-emerald-950/25"
          : "border-slate-800/80 bg-slate-900/50 hover:border-slate-700"
      }`}
    >
      <label className="flex items-center justify-between cursor-pointer">
        <div>
          <span className="text-xs font-bold text-slate-200 block">{label}</span>
          {desc && <span className="text-[10px] text-slate-500 block">{desc}</span>}
        </div>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-amber-400 rounded cursor-pointer"
        />
      </label>
      {checked && children && (
        <div className="mt-3 space-y-2.5 border-t border-slate-800/80 pt-2.5">{children}</div>
      )}
    </div>
  );
}

/** Segmented button group — generic over the value type */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  cols = 3,
  icon = false,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; icon?: string }[];
  cols?: number;
  icon?: boolean;
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`flex items-center justify-center gap-1 rounded-[3px] py-2 text-xs font-semibold border transition-all ${
            value === o.id
              ? "bg-emerald-600/15 border-emerald-500 text-amber-300"
              : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-700"
          }`}
        >
          {icon && <span>{o.icon}</span>}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-bold text-slate-100">{children}</h3>;
}
