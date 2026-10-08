"use client";

import type { ReactNode } from "react";
import type { Diagnostic, ModProject } from "@/lib/mod/types";
import type { PipelineResult } from "@/lib/analyzer/pipeline";

export interface TabProps {
  project: ModProject;
  update: (fn: (d: ModProject) => void) => void;
  analysis: PipelineResult;
  onJump: (file: string, line: number) => void;
}

const inputCls =
  "w-full rounded-md border border-[#262f3e] bg-[#0c0f14] px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-emerald-400/70 placeholder:text-slate-600";

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

export function TextInput(props: { value: string; onChange: (v: string) => void; placeholder?: string; list?: string; mono?: boolean }) {
  return (
    <input
      className={`${inputCls} ${props.mono ? "font-code" : ""}`}
      value={props.value}
      list={props.list}
      placeholder={props.placeholder}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}

export function NumInput(props: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      className={inputCls}
      value={Number.isFinite(props.value) ? props.value : 0}
      min={props.min}
      max={props.max}
      step={props.step ?? 1}
      onChange={(e) => props.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
    />
  );
}

export function TextArea(props: { value: string; onChange: (v: string) => void; rows?: number; mono?: boolean; placeholder?: string }) {
  return (
    <textarea
      className={`${inputCls} resize-y ${props.mono ? "font-code text-[13px] leading-5" : ""}`}
      rows={props.rows ?? 3}
      value={props.value}
      placeholder={props.placeholder}
      spellCheck={false}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}

export function Select(props: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select className={inputCls} value={props.value} onChange={(e) => props.onChange(e.target.value)}>
      {props.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 rounded-md py-1 text-sm text-slate-300"
    >
      <span className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-emerald-500" : "bg-slate-700"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

export function Btn({
  children, onClick, variant = "ghost", title, disabled, className = "",
}: { children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger"; title?: string; disabled?: boolean; className?: string }) {
  const v =
    variant === "primary"
      ? "bg-emerald-500 text-black hover:bg-emerald-400 font-semibold"
      : variant === "danger"
        ? "border border-red-500/30 text-red-300 hover:bg-red-500/10"
        : "border border-[#2b3547] text-slate-300 hover:bg-white/5";
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm transition disabled:opacity-40 ${v} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ title, children, right, className = "" }: { title?: string; children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-[#262f3e] bg-[#141922] ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-[#262f3e] px-4 py-2.5">
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ListDetail({
  title, rows, selected, onSelect, onAdd, onDuplicate, onDelete, children, empty,
}: {
  title: string;
  rows: { key: string; label: string; sub?: string; badge?: number }[];
  selected: number;
  onSelect: (i: number) => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  children: ReactNode;
  empty: string;
}) {
  return (
    <div className="grid h-full min-h-0 grid-cols-[260px_1fr] gap-4">
      <aside className="flex min-h-0 flex-col rounded-xl border border-[#262f3e] bg-[#141922]">
        <div className="flex items-center justify-between border-b border-[#262f3e] px-3 py-2.5">
          <span className="text-sm font-semibold">{title}</span>
          <Btn variant="primary" onClick={onAdd} className="!px-2.5 !py-1 text-xs">＋ 追加</Btn>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-auto p-2">
          {rows.length === 0 && <p className="p-3 text-xs text-slate-500">{empty}</p>}
          {rows.map((r, i) => (
            <button
              key={r.key + i}
              onClick={() => onSelect(i)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${i === selected ? "bg-emerald-500/15 ring-1 ring-emerald-500/40" : "hover:bg-white/5"}`}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-slate-100">{r.label || "(名称未設定)"}</span>
                <span className="block truncate font-code text-[11px] text-slate-500">{r.sub}</span>
              </span>
              {!!r.badge && <span className="ml-2 rounded-full bg-red-500/20 px-1.5 text-[10px] text-red-300">{r.badge}</span>}
            </button>
          ))}
        </div>
        {rows.length > 0 && (
          <div className="flex gap-2 border-t border-[#262f3e] p-2">
            <Btn onClick={onDuplicate} className="flex-1 !py-1 text-xs">複製</Btn>
            <Btn variant="danger" onClick={onDelete} className="flex-1 !py-1 text-xs">削除</Btn>
          </div>
        )}
      </aside>
      <div className="min-h-0 overflow-auto pr-1">{children}</div>
    </div>
  );
}

const sevStyle = {
  error: "bg-red-500/15 text-red-300 border-red-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  info: "bg-sky-500/15 text-sky-300 border-sky-500/30",
};
const sevLabel = { error: "ERROR", warning: "WARN", info: "INFO" };

export function DiagnosticRow({
  d, onJump, onFix,
}: { d: Diagnostic; onJump?: (file: string, line: number) => void; onFix?: (d: Diagnostic) => void }) {
  const jumpable = onJump && d.line > 0 && d.file !== "project";
  return (
    <div className="flex items-start gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-white/5">
      <span className={`mt-0.5 shrink-0 rounded border px-1.5 text-[10px] font-bold ${sevStyle[d.severity]}`}>{sevLabel[d.severity]}</span>
      <div className="min-w-0 flex-1">
        <p className="break-words text-slate-200">{d.message}</p>
        <p className="font-code text-[11px] text-slate-500">
          {d.file !== "project" && (
            <button disabled={!jumpable} onClick={() => onJump?.(d.file, d.line)} className={jumpable ? "text-sky-400 hover:underline" : ""}>
              {d.file.split("/").slice(-2).join("/")}:{d.line}:{d.col}
            </button>
          )}{" "}
          {d.code}
        </p>
      </div>
      {d.fix && onFix && (
        <button onClick={() => onFix(d)} className="shrink-0 rounded-md bg-emerald-500/20 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/30">
          🔧 import追加
        </button>
      )}
    </div>
  );
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9_]/g, "");

export function uniqueId(base: string, taken: string[]) {
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}_${n}`)) n++;
  return `${base}_${n}`;
}

/** PNGテクスチャのアップロード (data URL として保存、64KBまで) */
export function TextureUpload({ value, onChange, kind }: { value?: string; onChange: (v: string | undefined) => void; kind: "item" | "block" }) {
  const read = (file: File) => {
    if (file.type !== "image/png") return alert("PNG画像のみアップロードできます");
    if (file.size > 64 * 1024) return alert("64KB以下のPNGにしてください (16x16〜32x32 推奨)");
    const r = new FileReader();
    r.onload = () => {
      const url = String(r.result);
      const img = new Image();
      img.onload = () => {
        if (img.width !== img.height || img.width > 256) return alert(`正方形(例: 16x16)で256px以下のPNGにしてください (現在 ${img.width}x${img.height})`);
        onChange(url);
      };
      img.src = url;
    };
    r.readAsDataURL(file);
  };
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-[#2b3547] bg-[#0c0f14] p-3">
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-md border border-[#262f3e] bg-[repeating-conic-gradient(#1a212d_0%_25%,#141922_0%_50%)] bg-[length:12px_12px]">
        {/* Data URLs are local previews and cannot be optimized by next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={value} alt="texture" style={{ imageRendering: "pixelated" }} className="h-14 w-14" /> : <span className="text-[10px] text-slate-600">なし</span>}
      </div>
      <div className="min-w-0 flex-1 text-xs text-slate-400">
        <p className="mb-1 font-medium text-slate-300">オリジナルテクスチャ ({kind === "item" ? "textures/item" : "textures/block"})</p>
        <p>未設定ならバニラのテクスチャを使います。正方形のPNG (16x16 など)。</p>
        <div className="mt-2 flex gap-2">
          <label className="cursor-pointer rounded-md border border-[#2b3547] px-2.5 py-1 text-slate-200 hover:bg-white/5">
            PNGを選択
            <input type="file" accept="image/png" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) read(f); e.target.value = ""; }} />
          </label>
          {value && <button type="button" onClick={() => onChange(undefined)} className="rounded-md border border-red-500/30 px-2.5 py-1 text-red-300 hover:bg-red-500/10">削除</button>}
        </div>
      </div>
    </div>
  );
}
