"use client";

import { useState } from "react";
import { ACTION_SCHEMAS, CATEGORY_STYLE, newAction, schemaOf, type ActionCategory, type FieldSchema } from "@/lib/mod/catalog";
import type { Action, Diagnostic, ModProject, ParamValue } from "@/lib/mod/model";
import { Btn, DiagnosticRow, Field, NumInput, Select, TextArea, TextInput, Toggle } from "./ui";
import { cloneWithNewUids } from "./actionUtils";
import { KOTLIN_SNIPPETS } from "./kotlinSnippets";

export interface ListCtx {
  project: ModProject;
  customDiags: (uid: string) => Diagnostic[];
  onFix: (d: Diagnostic) => void;
  /** スニペット挿入時に必要な import をプロジェクトへ追加する */
  addImports: (imports: string[]) => void;
}

function FieldInput({ f, value, onChange, ctx, uidKey }: { f: FieldSchema; value: ParamValue; onChange: (v: ParamValue) => void; ctx: ListCtx; uidKey: string }) {
  const label = f.unit ? `${f.label} (${f.unit})` : f.label;
  switch (f.kind) {
    case "number":
      return <Field label={label} hint={f.hint}><NumInput value={Number(value)} onChange={onChange} min={f.min} max={f.max} step={f.step} /></Field>;
    case "select":
      return <Field label={label} hint={f.hint}><Select value={String(value)} onChange={onChange} options={f.options ?? []} /></Field>;
    case "bool":
      return <div className="flex items-end"><Toggle checked={Boolean(value)} onChange={onChange} label={f.label} /></div>;
    case "skill":
      return (
        <Field label={label}>
          <Select value={String(value)} onChange={onChange} options={[{ value: "", label: "(選択してください)" }, ...ctx.project.skills.map((s) => ({ value: s.id, label: `${s.name} (${s.id})` }))]} />
        </Field>
      );
    case "customEffect":
      return (
        <Field label={label} hint={f.hint}>
          <Select value={String(value)} onChange={onChange} options={[{ value: "", label: "(選択してください)" }, ...ctx.project.effects.map((e) => ({ value: e.id, label: `${e.name} (${e.id})` }))]} />
        </Field>
      );
    case "shop":
      return (
        <Field label={label} hint={f.hint}>
          <Select value={String(value)} onChange={onChange} options={[{ value: "", label: "(選択してください)" }, ...ctx.project.shops.map((x) => ({ value: x.id, label: `${x.name} (${x.id})` }))]} />
        </Field>
      );
    case "advancement":
      return (
        <Field label={label} hint={f.hint}>
          <Select value={String(value)} onChange={onChange} options={[{ value: "", label: "(選択してください)" }, ...ctx.project.advancements.map((a) => ({ value: a.id, label: `${a.name} (${a.id})` }))]} />
        </Field>
      );
    case "mob":
      return (
        <Field label={label} hint={f.hint}>
          <Select value={String(value)} onChange={onChange} options={[{ value: "", label: "(選択してください)" }, ...ctx.project.mobs.map((m) => ({ value: m.id, label: `${m.name} (${m.id})` }))]} />
        </Field>
      );
    case "item":
      return <Field label={label}><TextInput value={String(value)} onChange={onChange} list="item-datalist" mono /></Field>;
    case "textarea": {
      const diags = ctx.customDiags(uidKey);
      const errs = diags.filter((d) => d.severity === "error").length;
      const snippets = f.key === "code" ? KOTLIN_SNIPPETS : [];
      return (
        <div className="col-span-full">
          <Field label={label}>
            <TextArea value={String(value)} onChange={onChange} rows={7} mono />
          </Field>
          {snippets.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500">スニペット:</span>
              {snippets.map((sn) => (
                <button
                  key={sn.label}
                  type="button"
                  title={sn.imports.length ? `import追加: ${sn.imports.join(", ")}` : "import不要"}
                  onClick={() => {
                    onChange((String(value).trimEnd() ? `${String(value).trimEnd()}\n` : "") + sn.code);
                    if (sn.imports.length) ctx.addImports(sn.imports);
                  }}
                  className="rounded border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[11px] text-violet-200 hover:bg-violet-500/20"
                >
                  {sn.label}
                </button>
              ))}
            </div>
          )}
          <div className={`mt-2 rounded-md border px-3 py-2 text-xs ${errs ? "border-red-500/40 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
            <p className={errs ? "text-red-300" : "text-emerald-300"}>
              {errs ? `✖ 静的解析: ${errs} 件のエラー` : diags.length ? `⚠ 静的解析: ${diags.length} 件の指摘` : "✔ 静的解析: 問題は見つかりませんでした"}
            </p>
            {diags.map((d, i) => (
              <DiagnosticRow key={i} d={d} onFix={ctx.onFix} />
            ))}
            <p className="mt-1 text-[11px] text-slate-500">
              使用可能: ctx.player / ctx.world / ctx.target / ctx.entities(mode, radius) — 使うクラスは下の「import」欄に追加してください(🔧で自動追加)。
            </p>
          </div>
        </div>
      );
    }
    default:
      return <Field label={label} hint={f.hint}><TextInput value={String(value)} onChange={onChange} /></Field>;
  }
}

function AddMenu({ onAdd }: { onAdd: (type: string) => void }) {
  const [open, setOpen] = useState(false);
  const cats = Object.keys(CATEGORY_STYLE) as ActionCategory[];
  return (
    <div>
      <Btn onClick={() => setOpen(!open)} className="w-full border-dashed !text-emerald-300">{open ? "✕ 閉じる" : "＋ ブロックを追加"}</Btn>
      {open && (
        <div className="mt-2 space-y-2 rounded-lg border border-[#262f3e] bg-[#0c0f14] p-3">
          {cats.map((c) => (
            <div key={c} className="flex flex-wrap items-center gap-1.5">
              <span className={`w-16 text-[11px] font-bold ${CATEGORY_STYLE[c].text}`}>{CATEGORY_STYLE[c].label}</span>
              {ACTION_SCHEMAS.filter((s) => s.category === c).map((s) => (
                <button
                  key={s.type}
                  onClick={() => { onAdd(s.type); setOpen(false); }}
                  className={`rounded-md border px-2 py-1 text-xs hover:brightness-125 ${CATEGORY_STYLE[c].bg}`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionCard({
  a, index, total, onChange, onMove, onDup, onDelete, ctx, defaultOpen, depth, drag,
}: {
  a: Action; index: number; total: number; onChange: (a: Action) => void; onMove: (d: -1 | 1) => void; onDup: () => void; onDelete: () => void;
  ctx: ListCtx; defaultOpen: boolean; depth: number;
  drag: { dragging: boolean; over: boolean; onHandleDown: () => void; onStart: () => void; onEnd: () => void; onOver: () => void; onDrop: () => void; armed: boolean };
}) {
  const [open, setOpen] = useState(defaultOpen);
  const sc = schemaOf(a.type);
  if (!sc) return <div className="rounded-md border border-red-500/40 p-2 text-xs text-red-300">不明なアクション: {a.type}</div>;
  const st = CATEGORY_STYLE[sc.category];
  const customErr = a.type === "custom" ? ctx.customDiags(a.uid).filter((d) => d.severity === "error").length : 0;
  return (
    <div
      draggable={drag.armed}
      onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", a.uid); drag.onStart(); }}
      onDragEnd={drag.onEnd}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); drag.onOver(); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); drag.onDrop(); }}
      className={`overflow-hidden rounded-lg border transition ${st.bg} ${drag.dragging ? "opacity-40" : ""} ${drag.over ? "ring-2 ring-emerald-400" : ""}`}
    >
      <div className="flex items-stretch">
        <div
          title="ドラッグして並べ替え"
          onMouseDown={drag.onHandleDown}
          className={`flex w-5 shrink-0 cursor-grab items-center justify-center text-[10px] text-white/30 hover:text-white/70 ${st.bar}/30`}
        >
          ⋮⋮
        </div>
        <div className={`w-1 shrink-0 ${st.bar}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 px-3 py-2">
            <button onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <span className="text-base">{sc.icon}</span>
              <span className={`text-sm font-semibold ${st.text}`}>{sc.label}</span>
              <span className="truncate text-xs text-slate-400">{sc.describe(a.params)}</span>
              {customErr > 0 && <span className="rounded-full bg-red-500/30 px-1.5 text-[10px] text-red-200">{customErr} error</span>}
              <span className="ml-auto text-[10px] text-slate-500">{open ? "▲" : "▼"}</span>
            </button>
            <div className="flex shrink-0 gap-0.5 text-xs">
              <button title="上へ" disabled={index === 0} onClick={() => onMove(-1)} className="rounded px-1.5 py-0.5 text-slate-400 hover:bg-white/10 disabled:opacity-30">↑</button>
              <button title="下へ" disabled={index === total - 1} onClick={() => onMove(1)} className="rounded px-1.5 py-0.5 text-slate-400 hover:bg-white/10 disabled:opacity-30">↓</button>
              <button title="複製" onClick={onDup} className="rounded px-1.5 py-0.5 text-slate-400 hover:bg-white/10">⧉</button>
              <button title="削除" onClick={onDelete} className="rounded px-1.5 py-0.5 text-red-400 hover:bg-red-500/10">✕</button>
            </div>
          </div>
          {open && (
            <div className="grid grid-cols-2 gap-3 border-t border-white/5 px-3 py-3 lg:grid-cols-3">
              {sc.fields.map((f) => {
                if (f.key === "radius" && a.params.target !== "AREA") return null;
                return (
                  <FieldInput
                    key={f.key} f={f} ctx={ctx} uidKey={a.uid} value={a.params[f.key] ?? f.default}
                    onChange={(v) => onChange({ ...a, params: { ...a.params, [f.key]: v } })}
                  />
                );
              })}
            </div>
          )}
          {sc.container && (
            <div className="border-t border-white/5 bg-black/20 p-2 pl-4">
              <ActionList actions={a.children ?? []} onChange={(children) => onChange({ ...a, children })} ctx={ctx} depth={depth + 1} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActionList({ actions, onChange, ctx, depth }: { actions: Action[]; onChange: (a: Action[]) => void; ctx: ListCtx; depth: number }) {
  const [lastAdded, setLastAdded] = useState("");
  const [armed, setArmed] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const n = [...actions];
    const [it] = n.splice(from, 1);
    n.splice(to, 0, it);
    onChange(n);
  };
  const reset = () => { setArmed(null); setDragIdx(null); setOverIdx(null); };
  const move = (i: number, d: -1 | 1) => {
    const n = [...actions];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    onChange(n);
  };
  return (
    <div className="space-y-2">
      {actions.map((a, i) => (
        <ActionCard
          key={a.uid} a={a} index={i} total={actions.length} ctx={ctx} depth={depth} defaultOpen={a.uid === lastAdded}
          drag={{
            armed: armed === i, dragging: dragIdx === i, over: overIdx === i && dragIdx !== null && dragIdx !== i,
            onHandleDown: () => setArmed(i), onStart: () => setDragIdx(i), onEnd: reset,
            onOver: () => setOverIdx(i),
            onDrop: () => { if (dragIdx !== null) reorder(dragIdx, i); reset(); },
          }}
          onChange={(na) => onChange(actions.map((x, k) => (k === i ? na : x)))}
          onMove={(d) => move(i, d)}
          onDup={() => onChange([...actions.slice(0, i + 1), cloneWithNewUids(a), ...actions.slice(i + 1)])}
          onDelete={() => onChange(actions.filter((_, k) => k !== i))}
        />
      ))}
      {actions.length === 0 && <p className="px-2 py-1 text-xs text-slate-500">ブロックがありません</p>}
      <AddMenu onAdd={(t) => { const na = newAction(t); setLastAdded(na.uid); onChange([...actions, na]); }} />
    </div>
  );
}
