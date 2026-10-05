"use client";
import { ReactNode, useEffect, useRef, useState } from "react";
import { A, cssRgba, Pix } from "@/lib/pixel/core";

export function PixThumb({ pix, size = 64, className = "", checker = true }: { pix: Pix; size?: number; className?: string; checker?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = pix.w;
    c.height = pix.h;
    ctx.clearRect(0, 0, pix.w, pix.h);
    if (checker) {
      for (let y = 0; y < pix.h; y += 4)
        for (let x = 0; x < pix.w; x += 4) {
          ctx.fillStyle = ((x / 4 + y / 4) % 2 === 0) ? "#2a2a33" : "#20202a";
          ctx.fillRect(x, y, 4, 4);
        }
    }
    const img = ctx.getImageData(0, 0, pix.w, pix.h);
    for (let i = 0; i < pix.w * pix.h; i++) {
      const v = pix.data[i];
      const a = A(v) / 255;
      if (a === 0) continue;
      const r = (v >>> 24) & 255, g = (v >>> 16) & 255, b = (v >>> 8) & 255;
      img.data[i * 4] = r * a + img.data[i * 4] * (1 - a);
      img.data[i * 4 + 1] = g * a + img.data[i * 4 + 1] * (1 - a);
      img.data[i * 4 + 2] = b * a + img.data[i * 4 + 2] * (1 - a);
      img.data[i * 4 + 3] = Math.max(img.data[i * 4 + 3], a * 255);
    }
    ctx.putImageData(img, 0, 0);
  }, [pix, checker]);
  return <canvas ref={ref} width={pix.w} height={pix.h} style={{ width: size, height: size, imageRendering: "pixelated" }} className={className} />;
}

export function Section({ title, children, defaultOpen = true, right }: { title: string; children: ReactNode; defaultOpen?: boolean; right?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between px-3 py-2 cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <span className="text-xs font-semibold tracking-wide text-slate-200 uppercase">{title}</span>
        <div className="flex items-center gap-2">{right}<span className="text-slate-500 text-xs">{open ? "▾" : "▸"}</span></div>
      </div>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

export function Slider({ label, value, min, max, step = 0.01, onChange, format }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <label className="block text-[11px] text-slate-300">
      <div className="flex justify-between"><span>{label}</span><span className="text-slate-400 tabular-nums">{format ? format(value) : (Number.isInteger(step) ? value : value.toFixed(2))}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-amber-400 h-1.5" />
    </label>
  );
}

export function Select<T extends string>({ label, value, options, onChange }: { label?: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <label className="block text-[11px] text-slate-300">
      {label && <div className="mb-0.5">{label}</div>}
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="w-full rounded bg-slate-900 border border-white/10 px-2 py-1 text-xs text-slate-100">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Btn({ children, onClick, active, className = "", title, disabled, variant = "default" }: { children: ReactNode; onClick?: () => void; active?: boolean; className?: string; title?: string; disabled?: boolean; variant?: "default" | "primary" | "danger" | "ghost" }) {
  const base = "rounded px-2 py-1 text-xs font-medium transition border disabled:opacity-40 disabled:cursor-not-allowed";
  const v =
    variant === "primary" ? "bg-amber-500 hover:bg-amber-400 text-black border-amber-300"
    : variant === "danger" ? "bg-rose-600/80 hover:bg-rose-500 text-white border-rose-400/50"
    : variant === "ghost" ? "bg-transparent hover:bg-white/10 text-slate-200 border-transparent"
    : active ? "bg-amber-400/20 text-amber-200 border-amber-400/60" : "bg-white/5 hover:bg-white/10 text-slate-200 border-white/10";
  return <button type="button" title={title} disabled={disabled} onClick={onClick} className={`${base} ${v} ${className}`}>{children}</button>;
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-amber-400" />
      {label}
    </label>
  );
}

export function Swatch({ color, selected, onClick, size = 18 }: { color: number; selected?: boolean; onClick?: () => void; size?: number }) {
  return (
    <button type="button" onClick={onClick} style={{ width: size, height: size, background: cssRgba(color) }} className={`rounded-sm border ${selected ? "border-amber-300 ring-1 ring-amber-300" : "border-black/40"}`} />
  );
}
