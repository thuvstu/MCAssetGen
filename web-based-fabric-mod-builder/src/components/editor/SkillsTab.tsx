"use client";

import { useMemo, useState } from "react";
import {
  ACTION_SCHEMAS, CATEGORY_STYLE, CONDITION_SCHEMAS, TRIGGERS, encodeVarCondition, newAction, newCondition, newSkill, parseVarCondition, schemaOf, uid,
  type ActionCategory, type FieldSchema,
} from "@/lib/mod/catalog";
import { customRanges } from "@/lib/mod/codegen";
import { simulateSkill } from "@/lib/analyzer/pipeline";
import type { Action, Diagnostic, ModProject, ParamValue } from "@/lib/mod/types";
import { Btn, Card, DiagnosticRow, Field, ListDetail, NumInput, Select, TextArea, TextInput, Toggle, slug, uniqueId, type TabProps } from "./ui";

const cloneWithNewUids = (a: Action): Action => ({
  ...structuredClone(a), uid: uid(), ...(a.children ? { children: a.children.map(cloneWithNewUids) } : {}),
});

function mapActions(list: Action[], fn: (a: Action) => void) {
  list.forEach((a) => { fn(a); if (a.children) mapActions(a.children, fn); });
}

interface ListCtx {
  project: ModProject;
  customDiags: (uid: string) => Diagnostic[];
  onFix: (d: Diagnostic) => void;
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
      return (
        <div className="col-span-full">
          <Field label={label}>
            <TextArea value={String(value)} onChange={onChange} rows={7} mono />
          </Field>
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

function ActionList({ actions, onChange, ctx, depth }: { actions: Action[]; onChange: (a: Action[]) => void; ctx: ListCtx; depth: number }) {
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

export default function SkillsTab({ project, update, analysis }: TabProps) {
  const [sel, setSel] = useState(0);
  const idx = Math.min(sel, project.skills.length - 1);
  const skill = project.skills[idx];

  const skillsFile = analysis.files.find((f) => f.path.endsWith("skill/Skills.kt"));
  const ranges = useMemo(() => (skillsFile ? customRanges(skillsFile.content) : {}), [skillsFile]);
  const customDiags = (id: string): Diagnostic[] => {
    const r = ranges[id];
    if (!r || !skillsFile) return [];
    return analysis.diagnostics.filter((d) => d.file === skillsFile.path && d.line >= r.start && d.line <= r.end).map((d) => ({ ...d, line: d.line - r.start + 1 }));
  };
  const importDiags = skillsFile
    ? analysis.diagnostics.filter((d) => d.file === skillsFile.path && /^KT-(IMPORT|UNUSED-IMPORT|DUP-IMPORT)/.test(d.code) || (d.file === skillsFile.path && d.code === "MC-PACKAGE"))
    : [];
  const fix = (d: Diagnostic) => {
    if (d.fix?.kind !== "addImport") return;
    const line = `import ${d.fix.fqn}`;
    update((p) => {
      if (!p.customImports.split("\n").some((l) => l.trim() === line)) p.customImports = (p.customImports.trim() ? p.customImports.trimEnd() + "\n" : "") + line;
    });
  };
  const ctx: ListCtx = { project, customDiags, onFix: fix };

  const rows = project.skills.map((s) => ({
    key: s.id, label: s.name, sub: `${s.id} · ${s.trigger.type === "MANUAL" ? "手動" : s.trigger.type}`,
    badge: analysis.diagnostics.filter((d) => d.file === "project" && d.severity === "error" && d.message.startsWith(`[スキル: ${s.id}`)).length,
  }));

  const add = () => {
    update((p) => { p.skills.push({ ...newSkill(), id: uniqueId("new_skill", p.skills.map((s) => s.id)), name: "新しいスキル" }); });
    setSel(project.skills.length);
  };
  const dup = () => {
    if (!skill) return;
    update((p) => {
      const c = structuredClone(p.skills[idx]);
      c.id = uniqueId(`${c.id}_copy`, p.skills.map((s) => s.id));
      c.name += " (コピー)";
      c.actions = c.actions.map(cloneWithNewUids);
      c.conditions = c.conditions.map((x) => ({ ...x, uid: uid() }));
      p.skills.splice(idx + 1, 0, c);
    });
    setSel(idx + 1);
  };
  const del = () => {
    if (!skill) return;
    update((p) => {
      const id = p.skills[idx].id;
      p.skills.splice(idx, 1);
      p.items.forEach((x) => { if (x.skillId === id) x.skillId = null; });
      p.blocks.forEach((x) => { if (x.skillId === id) x.skillId = null; });
    });
    setSel(Math.max(0, idx - 1));
  };
  const rename = (raw: string) => {
    const nid = slug(raw);
    update((p) => {
      const old = p.skills[idx].id;
      p.skills[idx].id = nid;
      p.items.forEach((x) => { if (x.skillId === old) x.skillId = nid; });
      p.blocks.forEach((x) => { if (x.skillId === old) x.skillId = nid; });
      p.skills.forEach((s) => mapActions(s.actions, (a) => { if (a.type === "castSkill" && a.params.skillId === old) a.params.skillId = nid; }));
    });
  };
  const set = (fn: (s: ModProject["skills"][number]) => void) => update((p) => fn(p.skills[idx]));

  const sim = useMemo(() => (skill ? simulateSkill(skill, project.skills) : null), [skill, project.skills]);
  const projDiags = skill ? analysis.diagnostics.filter((d) => d.file === "project" && d.message.startsWith(`[スキル: ${skill.id}`)) : [];
  const hasCustom = skill ? (() => { let f = false; mapActions(project.skills.flatMap((s) => s.actions), (a) => { if (a.type === "custom") f = true; }); return f; })() : false;

  return (
    <ListDetail
      title="スキル" rows={rows} selected={idx} onSelect={setSel} onAdd={add} onDuplicate={dup} onDelete={del}
      empty="スキルがありません。「＋ 追加」から作成しましょう。"
    >
      {!skill ? (
        <Card><p className="text-sm text-slate-400">左の「＋ 追加」でスキルを作成します。</p></Card>
      ) : (
        <div className="space-y-4 pb-8">
          <Card title="基本設定">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Field label="スキル名"><TextInput value={skill.name} onChange={(v) => set((s) => (s.name = v))} /></Field>
              <Field label="ID" hint="小文字英数字と _"><TextInput mono value={skill.id} onChange={rename} /></Field>
              <Field label="クールダウン (秒)"><NumInput value={skill.cooldown} min={0} step={0.5} onChange={(v) => set((s) => (s.cooldown = v))} /></Field>
              <Field label={`マナ消費 (最大${project.mana.max})`}><NumInput value={skill.manaCost} min={0} onChange={(v) => set((s) => (s.manaCost = v))} /></Field>
              <Field label="説明" className="col-span-full"><TextInput value={skill.description} onChange={(v) => set((s) => (s.description = v))} /></Field>
            </div>
          </Card>

          <Card title="トリガー(いつ発動するか)">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <Field label="発動タイミング" className="col-span-full lg:col-span-1">
                <Select value={skill.trigger.type} onChange={(v) => set((s) => (s.trigger.type = v as typeof s.trigger.type))} options={TRIGGERS} />
              </Field>
              {(skill.trigger.type === "PERIODIC" || skill.trigger.type === "WEAR") && (
                <Field label={skill.trigger.type === "WEAR" ? "判定間隔 (秒)" : "間隔 (秒)"}><NumInput value={skill.trigger.intervalSec} min={1} onChange={(v) => set((s) => (s.trigger.intervalSec = v))} /></Field>
              )}
              {skill.trigger.type === "WEAR" && (
                <Field label="装備するアイテムID (必須)" hint="防具のIDを指定。セット効果は条件「防具を装備している」を追加">
                  <TextInput mono list="item-datalist" value={skill.trigger.heldItem} onChange={(v) => set((s) => (s.trigger.heldItem = v))} />
                </Field>
              )}
              {skill.trigger.type !== "MANUAL" && skill.trigger.type !== "PLAYER_JOIN" && skill.trigger.type !== "WEAR" && (
                <Field label="メインハンドに持っている場合のみ (任意)" hint="例: mymod:fire_staff">
                  <TextInput mono list="item-datalist" value={skill.trigger.heldItem} onChange={(v) => set((s) => (s.trigger.heldItem = v))} />
                </Field>
              )}
            </div>
            {skill.trigger.type === "MANUAL" && (
              <p className="mt-2 text-xs text-slate-500">「アイテム」「ブロック」タブでこのスキルを割り当てると右クリックで発動します。`/skill cast {skill.id}` でも発動可能です。</p>
            )}
          </Card>

          <Card title="発動条件 (すべて満たす必要あり)" right={<Btn onClick={() => set((s) => s.conditions.push(newCondition()))} className="!py-1 text-xs">＋ 条件</Btn>}>
            {skill.conditions.length === 0 && <p className="text-xs text-slate-500">条件なし(常に発動可能)</p>}
            <div className="space-y-2">
              {skill.conditions.map((c, i) => {
                const cs = CONDITION_SCHEMAS.find((x) => x.type === c.type);
                return (
                  <div key={c.uid} className="flex items-center gap-2">
                    <div className="w-64">
                      <Select value={c.type} onChange={(v) => set((s) => (s.conditions[i].type = v))} options={CONDITION_SCHEMAS.map((x) => ({ value: x.type, label: x.label }))} />
                    </div>
                    {c.type === "VARIABLE" ? (() => {
                      const vc = parseVarCondition(c.value);
                      const upd = (patch: Partial<typeof vc>) => set((s) => (s.conditions[i].value = encodeVarCondition({ ...vc, ...patch })));
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-36"><Select value={vc.scope} onChange={(v) => upd({ scope: v })} options={[{ value: "SELF", label: "自分" }, { value: "TARGET", label: "敵" }, { value: "GLOBAL", label: "グローバル" }]} /></div>
                          <div className="w-36"><TextInput mono value={vc.name} placeholder="変数名" onChange={(v) => upd({ name: v.replace(/[^A-Za-z0-9_]/g, "") })} /></div>
                          <div className="w-24"><TextInput mono value={vc.min} placeholder="最小" onChange={(v) => upd({ min: v })} /></div>
                          <span className="text-xs text-slate-500">〜</span>
                          <div className="w-24"><TextInput mono value={vc.max} placeholder="最大" onChange={(v) => upd({ max: v })} /></div>
                        </div>
                      );
                    })() : cs?.hasValue && <div className="w-56"><TextInput mono list="item-datalist" value={c.value} placeholder={cs.placeholder} onChange={(v) => set((s) => (s.conditions[i].value = v))} /></div>}
                    <Btn variant="danger" onClick={() => set((s) => s.conditions.splice(i, 1))} className="!px-2 !py-1 text-xs">✕</Btn>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="アクション(上から順に実行)">
            <ActionList actions={skill.actions} onChange={(a) => set((s) => (s.actions = a))} ctx={ctx} depth={0} />
            {hasCustom && (
              <div className="mt-4 rounded-lg border border-violet-500/30 bg-violet-500/5 p-3">
                <Field label="カスタムKotlin用 import (プロジェクト共通)" hint="1行に1つ。例: import net.minecraft.util.math.Vec3d">
                  <TextArea mono rows={3} value={project.customImports} onChange={(v) => update((p) => (p.customImports = v))} />
                </Field>
                {importDiags.map((d, i) => <DiagnosticRow key={i} d={d} />)}
              </div>
            )}
          </Card>

          {sim && (
            <Card title="ロジック確認: シミュレーション" right={<span className="text-xs text-slate-500">AREA対象は{3}体想定</span>}>
              <div className="mb-3 grid grid-cols-2 gap-2 text-center lg:grid-cols-4">
                {[
                  ["総ダメージ", sim.totalDamage.toFixed(1)],
                  ["総回復", sim.totalHeal.toFixed(1)],
                  ["全体の所要時間", `${(sim.endTick / 20).toFixed(1)}秒`],
                  ["概算DPS", sim.dps.toFixed(1)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-[#0c0f14] p-2">
                    <p className="text-[11px] text-slate-500">{k}</p>
                    <p className="text-lg font-semibold text-emerald-300">{v}</p>
                  </div>
                ))}
              </div>
              <div className="relative mb-3 h-16 overflow-hidden rounded-lg border border-[#262f3e] bg-[#0c0f14]">
                <div className="absolute inset-x-0 bottom-4 h-px bg-[#2b3547]" />
                {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                  <div key={t} className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${8 + t * 84}%` }}>
                    <span className="h-1.5 w-px bg-[#2b3547]" />
                    <span className="text-[9px] text-slate-600">{(Math.max(1, sim.endTick) * t / 20).toFixed(1)}s</span>
                  </div>
                ))}
                {sim.events.slice(0, 60).map((e, i) => (
                  <div
                    key={i}
                    title={`t=${(e.tick / 20).toFixed(2)}s ${e.text}`}
                    className="absolute flex -translate-x-1/2 items-center rounded-full border border-emerald-400/40 bg-emerald-400/15 px-1 text-[10px] leading-4 text-emerald-100"
                    style={{ left: `${8 + (e.tick / Math.max(1, sim.endTick)) * 84}%`, top: `${4 + (e.depth % 3) * 15}px` }}
                  >
                    {e.icon}
                  </div>
                ))}
              </div>
              <div className="max-h-64 overflow-auto rounded-lg bg-[#0c0f14] p-2 font-code text-xs">
                <p className="px-2 py-1 text-slate-500">
                  ▶ /skill cast {skill.id} (マナ -{skill.manaCost}, クールダウン {skill.cooldown}秒)
                </p>
                {sim.events.map((e, i) => (
                  <p key={i} className="flex gap-2 px-2 py-0.5 text-slate-300" style={{ paddingLeft: 8 + e.depth * 14 }}>
                    <span className="w-24 shrink-0 text-amber-300/80">t={(e.tick / 20).toFixed(2)}s</span>
                    <span>{e.icon} {e.text}</span>
                  </p>
                ))}
              </div>
            </Card>
          )}

          {projDiags.length > 0 && (
            <Card title="このスキルの検証結果">
              {projDiags.map((d, i) => <DiagnosticRow key={i} d={d} />)}
            </Card>
          )}
        </div>
      )}
    </ListDetail>
  );
}
