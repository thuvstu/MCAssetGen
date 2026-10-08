"use client";

import { createContext, useContext, type ReactNode } from "react";

export const MobNamesContext = createContext<string[]>([]);
import type { ParamDef } from "@/studios/mythiccraft/lib/mod/catalog";
import type { ParamValue, Params } from "@/studios/mythiccraft/lib/mod/types";

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && <div className="mt-1 text-[11px] text-zinc-500">{hint}</div>}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return <input className={`input ${mono ? "mono" : ""}`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function NumInput({ value, onChange, step = 1, min, max }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number }) {
  return (
    <input
      type="number"
      className="input mono"
      value={Number.isFinite(value) ? value : 0}
      step={step}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
    />
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 text-sm">
      <span
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 rounded-full transition ${value ? "bg-emerald-600" : "bg-zinc-700"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${value ? "left-4" : "left-0.5"}`} />
      </span>
      <span onClick={() => onChange(!value)}>{label}</span>
    </label>
  );
}

export function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value as T)}>
      {!options.some((o) => o.value === value) && <option value={value}>{value || "(未選択)"}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ParamInput({ def, value, onChange, skills }: { def: ParamDef; value: ParamValue | undefined; onChange: (v: ParamValue) => void; skills: string[] }) {
  const v = value ?? def.default;
  const mobs = useContext(MobNamesContext);
  switch (def.type) {
    case "mob":
      return (
        <Field label={`${def.label} (${def.key})`}>
          <Select value={String(v)} onChange={onChange} options={mobs.map((s) => ({ value: s, label: s }))} />
        </Field>
      );
    case "boolean":
      return <Toggle value={v === true || v === "true"} onChange={onChange} label={def.label} />;
    case "number":
    case "int":
      return (
        <Field label={`${def.label} (${def.key})`}>
          <NumInput value={typeof v === "number" ? v : parseFloat(String(v))} step={def.type === "int" ? 1 : 0.1} onChange={(n) => onChange(def.type === "int" ? Math.trunc(n) : n)} />
        </Field>
      );
    case "select":
      return (
        <Field label={`${def.label} (${def.key})`}>
          <Select value={String(v)} onChange={onChange} options={def.options ?? []} />
        </Field>
      );
    case "skill":
      return (
        <Field label={`${def.label} (${def.key})`}>
          <Select value={String(v)} onChange={onChange} options={skills.map((s) => ({ value: s, label: s }))} />
        </Field>
      );
    case "code":
      return (
        <Field label={def.label} className="col-span-full" hint="使用可能: ctx (SkillContext: caster, target, world, origin), t (SkillTarget: entity, pos), e (Entity?)">
          <textarea
            className="input mono min-h-[120px] text-xs leading-5"
            spellCheck={false}
            value={String(v)}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const ta = e.currentTarget;
                const s = ta.selectionStart;
                const nv = ta.value.slice(0, s) + "    " + ta.value.slice(ta.selectionEnd);
                onChange(nv);
                requestAnimationFrame(() => ta.setSelectionRange(s + 4, s + 4));
              }
            }}
          />
        </Field>
      );
    default:
      return (
        <Field label={`${def.label} (${def.key})`}>
          <input className="input mono" list={def.options ? `dl-${def.key}` : undefined} value={String(v)} onChange={(e) => onChange(e.target.value)} />
          {def.options && (
            <datalist id={`dl-${def.key}`}>
              {def.options.map((o) => (
                <option key={o.value} value={o.value} />
              ))}
            </datalist>
          )}
        </Field>
      );
  }
}

export function ParamGrid({ defs, params, onChange, skills }: { defs: ParamDef[]; params: Params; onChange: (p: Params) => void; skills: string[] }) {
  if (defs.length === 0) return null;
  return (
    <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-4">
      {defs.map((d) => (
        <ParamInput key={d.key} def={d} value={params[d.key]} skills={skills} onChange={(v) => onChange({ ...params, [d.key]: v })} />
      ))}
    </div>
  );
}

export function SectionHeader({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {desc && <p className="mt-1 text-sm text-zinc-400">{desc}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function ListPane<T extends { id: string }>({
  items, selected, onSelect, render, onAdd, addLabel,
}: {
  items: T[];
  selected: string | null;
  onSelect: (id: string) => void;
  render: (t: T) => ReactNode;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="card flex h-fit flex-col p-2">
      <button className="btn-primary mb-2 justify-center" onClick={onAdd}>
        + {addLabel}
      </button>
      {items.length === 0 && <div className="p-3 text-center text-xs text-zinc-500">まだありません</div>}
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onSelect(it.id)}
          className={`rounded-md px-3 py-2 text-left text-sm transition ${selected === it.id ? "bg-emerald-900/50 text-emerald-200" : "hover:bg-zinc-800"}`}
        >
          {render(it)}
        </button>
      ))}
    </div>
  );
}
