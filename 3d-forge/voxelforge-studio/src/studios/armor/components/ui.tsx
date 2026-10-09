import type { ReactNode } from "react";

export function Section({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return (
    <section className="border-t border-[#3a3b37] pt-6 pb-7">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-semibold tracking-[0.08em] text-[#e9e4da]">{title}</h3>
        {hint && <span className="text-[10px] text-[#777b76]">{hint}</span>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Slider({
  label, value, min, max, step = 1, onChange, format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between text-[11px] text-[#b8b8ae]">
        <span>{label}</span>
        <span className="font-mono text-[#e6bd83]">{format ? format(value) : value}</span>
      </span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="forge-range w-full cursor-pointer"
      />
    </label>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center justify-between text-[11px] text-[#b8b8ae]">
      <span>{label}</span>
      <span className="flex items-center gap-3">
        <span className="font-mono uppercase tracking-[0.04em] text-[#8d918d]">{value}</span>
        <input
          type="color" value={value} onChange={(event) => onChange(event.target.value)}
          className="h-7 w-9 cursor-pointer border border-[#53534d] bg-transparent p-0.5"
        />
      </span>
    </label>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 text-[11px] leading-relaxed text-[#b8b8ae]">
      <span>{label}</span>
      <span className={`relative inline-flex h-[19px] w-9 shrink-0 items-center rounded-full border transition-colors ${checked ? "border-[#d6ad72] bg-[#a97a48]" : "border-[#676863] bg-[#353a37]"}`}>
        <span className={`h-3 w-3 rounded-full bg-[#f2e5ce] transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
        <input className="sr-only" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      </span>
    </label>
  );
}

export function TextField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] text-[#a8aaa4]">{label}</span>
      <input
        type="text" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-sm border border-[#3a3f3b] bg-[#121615] px-3 py-2 text-xs text-[#f1eee8] outline-none transition-colors placeholder:text-[#6c706a] focus:border-[#d2a66a]"
      />
    </label>
  );
}

export function Button({ children, onClick, variant = "secondary", disabled, className = "", title }: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  const classes = {
    primary: "border border-[#cda06b] bg-[#d8ae77] text-[#1c1b18] hover:bg-[#ecc797]",
    secondary: "border border-[#555950] bg-[#282d2a] text-[#e7e5db] hover:border-[#aa946f] hover:bg-[#343934]",
    ghost: "border border-transparent text-[#bcbcb3] hover:text-[#e8c18b]",
    danger: "border border-[#734b46] text-[#e6a59b] hover:bg-[#422c2a]",
  }[variant];
  return (
    <button
      type="button" title={title} onClick={onClick} disabled={disabled}
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-sm px-3 text-xs font-medium tracking-[0.04em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${classes} ${className}`}
    >
      {children}
    </button>
  );
}