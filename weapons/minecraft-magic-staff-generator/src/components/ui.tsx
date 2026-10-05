import type { ReactNode } from "react";

export function Section({ title, children, extra }: { title: string; children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="section">
      <div className="section-head">
        <span className="sec-title"><i className="sec-gem" aria-hidden="true" />{title}</span>
        <span className="sec-rule" aria-hidden="true" />
        {extra}
      </div>
      {children}
    </div>
  );
}

export function Chips<T extends string | number>({ options, value, onChange, cols = 3 }: { options: [T, ReactNode][]; value: T; onChange: (v: T) => void; cols?: number }) {
  return (
    <div className="chips" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {options.map(([v, label]) => (
        <button key={String(v)} className={v === value ? "on" : ""} onClick={() => onChange(v)}>{label}</button>
      ))}
    </div>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, format }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="slider">
      <span><span>{label}</span><b>{format ? format(value) : value}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} style={{ ["--p" as string]: `${pct}%` }} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className="toggle-row" onClick={() => onChange(!value)} aria-pressed={value}>
      <div><span>{label}</span>{hint && <small>{hint}</small>}</div>
      <i className={`switch ${value ? "on" : ""}`}><i /></i>
    </button>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="color-field">
      <span className="sw" style={{ background: value }} />
      <span className="lbl">{label}</span>
      <code>{value.toUpperCase()}</code>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
