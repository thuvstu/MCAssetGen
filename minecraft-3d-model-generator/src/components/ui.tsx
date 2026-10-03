"use client";
import type { ReactNode } from "react";

export function Section({
  no,
  title,
  en,
  children,
}: {
  no: string;
  title: string;
  en: string;
  children: ReactNode;
}) {
  return (
    <section className="px-4 py-4 border-b border-rule/70">
      <header className="flex items-baseline gap-2 pb-2 mb-3 border-b border-ink/25">
        <span className="font-mono text-[10px] text-vermilion tabular-nums">{no}</span>
        <h3 className="font-display text-[15px] tracking-[0.2em] text-ink">{title}</h3>
        <span className="ml-auto font-mono text-[9px] tracking-[0.24em] text-ink/60">{en}</span>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block group">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[12px] text-ink/80 tracking-wide">{label}</span>
        <span className="font-mono text-[12px] tabular-nums text-ink">
          {value}
          <span className="text-ink/45 text-[10px] ml-0.5">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="forge-range w-full"
        aria-label={label}
      />
    </label>
  );
}

export function Choice<T extends string | number>({
  value,
  options,
  onChange,
  cols = 3,
}: {
  value: T;
  options: { value: T; label: string; sub?: string }[];
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div className="grid gap-px bg-ink/20 border border-ink/20" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`px-1.5 py-1.5 text-center transition-colors duration-100 outline-none focus-visible:ring-2 focus-visible:ring-vermilion ${
              active ? "bg-ink text-paper" : "bg-paper text-ink/70 hover:bg-paper2"
            }`}
          >
            <span className="block text-[12px] leading-tight">{o.label}</span>
            {o.sub && (
              <span className={`block font-mono text-[8px] tracking-[0.14em] ${active ? "text-paper/55" : "text-ink/40"}`}>
                {o.sub}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-1 outline-none focus-visible:ring-2 focus-visible:ring-vermilion"
    >
      <span className="text-[12px] text-ink/80">{label}</span>
      <span
        className={`relative h-[15px] w-[30px] shrink-0 border transition-colors duration-150 ${
          checked ? "border-vermilion bg-vermilion/15" : "border-ink/35 bg-paper2"
        }`}
      >
        <span
          className={`absolute top-[1px] h-[11px] w-[13px] transition-all duration-150 ${
            checked ? "left-[15px] bg-vermilion" : "left-[1px] bg-ink/45"
          }`}
        />
      </span>
    </button>
  );
}

export function Swatch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <span className="relative h-6 w-6 shrink-0 border border-ink/60 overflow-hidden" style={{ background: value }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label={label}
        />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[10px] text-ink/70 leading-none">{label}</span>
        <span className="block font-mono text-[10px] tabular-nums text-ink/50 uppercase leading-tight">{value}</span>
      </span>
    </label>
  );
}

export function Btn({
  children,
  onClick,
  tone = "line",
  full,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "line" | "ink" | "red";
  full?: boolean;
  disabled?: boolean;
}) {
  const tones = {
    line: "border-ink/45 text-ink hover:bg-ink hover:text-paper",
    ink: "border-ink bg-ink text-paper hover:bg-vermilion hover:border-vermilion",
    red: "border-vermilion/70 text-vermilion hover:bg-vermilion hover:text-paper",
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`border px-3 py-2 text-[11px] tracking-[0.14em] transition-colors duration-100 outline-none focus-visible:ring-2 focus-visible:ring-vermilion disabled:opacity-40 disabled:cursor-not-allowed ${
        tones[tone]
      } ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

export function Readout({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-[9px] tracking-[0.2em] text-ink/65">{k}</span>
      <span className="flex-1 border-b border-dotted border-ink/30 translate-y-[-3px]" />
      <span className="font-mono text-[11px] tabular-nums text-ink">{v}</span>
    </div>
  );
}
