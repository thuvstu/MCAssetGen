"use client";

import { useMemo, useState } from "react";
import { CONDITIONS, MECHANICS, TARGETERS, defaultParams, findCondition, findMechanic, findTargeter } from "@/studios/mythiccraft/lib/mod/catalog";
import { genSkillsKt, skillFnName } from "@/studios/mythiccraft/lib/mod/codegen";
import { newCondition, newLine, newSkill } from "@/studios/mythiccraft/lib/mod/defaults";
import { parseSkillText, serializeConditions, serializeLine } from "@/studios/mythiccraft/lib/mod/skillText";
import type { ConditionRef, Diagnostic, ModProject, Skill, SkillLine } from "@/studios/mythiccraft/lib/mod/types";
import { uid } from "@/studios/mythiccraft/lib/mod/types";
import { CodeBlock } from "./CodeView";
import { DiagList } from "./Diagnostics";
import { Field, ListPane, NumInput, ParamGrid, SectionHeader, TextInput } from "./ui";

type Mutate = (fn: (d: ModProject) => void) => void;

const CATS = [...new Set(MECHANICS.map((m) => m.category))];

function ConditionEditor({ conds, onChange, skills, title }: { conds: ConditionRef[]; onChange: (c: ConditionRef[]) => void; skills: string[]; title: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-amber-300">{title}</span>
        <button className="btn !px-2 !py-0.5 text-xs" onClick={() => onChange([...conds, newCondition("chance")])}>
          + 条件
        </button>
      </div>
      <div className="space-y-2">
        {conds.map((c, i) => {
          const def = findCondition(c.type);
          return (
            <div key={c.id} className="rounded-md border border-amber-900/50 bg-amber-950/20 p-2">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <select
                  className="input !w-auto"
                  value={def?.id ?? c.type}
                  onChange={(e) => {
                    const nd = findCondition(e.target.value)!;
                    const n = [...conds];
                    n[i] = { ...c, type: nd.id, params: defaultParams(nd.params) };
                    onChange(n);
                  }}
                >
                  {CONDITIONS.map((cd) => (
                    <option key={cd.id} value={cd.id}>
                      ?{cd.id} — {cd.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={!!c.negate}
                    onChange={(e) => {
                      const n = [...conds];
                      n[i] = { ...c, negate: e.target.checked };
                      onChange(n);
                    }}
                  />
                  否定 (?!)
                </label>
                <span className="text-xs text-zinc-500">{def?.description}</span>
                <button className="btn-danger ml-auto" onClick={() => onChange(conds.filter((x) => x.id !== c.id))}>
                  ✕
                </button>
              </div>
              {def && (
                <ParamGrid
                  defs={def.params}
                  params={c.params}
                  skills={skills}
                  onChange={(p) => {
                    const n = [...conds];
                    n[i] = { ...c, params: p };
                    onChange(n);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineCard({
  line, index, total, skills, onChange, onRemove, onMove, onDuplicate,
}: {
  line: SkillLine;
  index: number;
  total: number;
  skills: string[];
  onChange: (l: SkillLine) => void;
  onRemove: () => void;
  onMove: (d: -1 | 1) => void;
  onDuplicate: () => void;
}) {
  const mech = findMechanic(line.mechanic);
  const targ = findTargeter(line.targeter);
  const isDelay = mech?.id === "delay";
  return (
    <div className={`card p-3 ${isDelay ? "border-sky-900 bg-sky-950/20" : ""}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mono grid h-6 w-6 place-items-center rounded bg-zinc-800 text-xs text-zinc-400">{index + 1}</span>
        <select
          className="input !w-auto font-semibold"
          value={mech?.id ?? line.mechanic}
          onChange={(e) => {
            const m = findMechanic(e.target.value)!;
            onChange({ ...line, mechanic: m.id, params: defaultParams(m.params) });
          }}
        >
          {CATS.map((c) => (
            <optgroup key={c} label={c}>
              {MECHANICS.filter((m) => m.category === c).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.id})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <span className="text-xs text-zinc-500">{mech?.description}</span>
        <div className="ml-auto flex gap-1">
          <button className="btn !px-2 !py-0.5 text-xs" disabled={index === 0} onClick={() => onMove(-1)}>
            ↑
          </button>
          <button className="btn !px-2 !py-0.5 text-xs" disabled={index === total - 1} onClick={() => onMove(1)}>
            ↓
          </button>
          <button className="btn !px-2 !py-0.5 text-xs" onClick={onDuplicate}>
            複製
          </button>
          <button className="btn-danger" onClick={onRemove}>
            削除
          </button>
        </div>
      </div>
      {mech && <ParamGrid defs={mech.params} params={line.params} skills={skills} onChange={(p) => onChange({ ...line, params: p })} />}
      {!isDelay && (
        <div className="mt-3 grid gap-3 border-t border-zinc-800 pt-3 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-semibold text-sky-300">ターゲッター</div>
            <select
              className="input mb-2"
              value={targ?.id ?? line.targeter}
              onChange={(e) => {
                const t = findTargeter(e.target.value)!;
                onChange({ ...line, targeter: t.id, targeterParams: defaultParams(t.params) });
              }}
            >
              {TARGETERS.map((t) => (
                <option key={t.id} value={t.id}>
                  @{t.id} — {t.label} {t.returnsEntities ? "" : "(位置)"}
                </option>
              ))}
            </select>
            {targ && (
              <>
                <div className="mb-2 text-[11px] text-zinc-500">{targ.description}</div>
                <ParamGrid defs={targ.params} params={line.targeterParams} skills={skills} onChange={(p) => onChange({ ...line, targeterParams: p })} />
              </>
            )}
            {mech?.entityOnly && targ && !targ.returnsEntities && (
              <div className="mt-2 rounded bg-amber-950/40 px-2 py-1 text-xs text-amber-300">⚠ このメカニックはエンティティが必要です。位置ターゲッターでは効果がありません。</div>
            )}
          </div>
          <ConditionEditor title="ターゲット条件 (各ターゲットに対して判定)" conds={line.conditions} skills={skills} onChange={(c) => onChange({ ...line, conditions: c })} />
        </div>
      )}
      <div className="mono mt-3 truncate rounded bg-black/40 px-2 py-1 text-[11px] text-emerald-300/80">{serializeLine(line)}</div>
    </div>
  );
}

function extractFn(code: string, fn: string): string {
  const lines = code.split("\n");
  let start = lines.findIndex((l) => l.startsWith(`    fun ${fn}(ctx: SkillContext)`));
  if (start < 0) return "";
  if (start > 0 && lines[start - 1].trim().startsWith("/**")) start--;
  const end = lines.findIndex((l, i) => i > start && l === "    }");
  return lines
    .slice(start, end + 1)
    .map((l) => l.slice(4))
    .join("\n");
}

export default function SkillEditor({ project, mutate, diags }: { project: ModProject; mutate: Mutate; diags: Diagnostic[] }) {
  const [sel, setSel] = useState<string | null>(project.skills[0]?.id ?? null);
  const [mode, setMode] = useState<"visual" | "text">("visual");
  const [text, setText] = useState("");
  const [textErrors, setTextErrors] = useState<{ line: number; message: string }[]>([]);
  const skill = project.skills.find((s) => s.id === sel) ?? null;
  const skillNames = project.skills.map((s) => s.name);

  const upd = (fn: (s: Skill) => void) =>
    mutate((d) => {
      const s = d.skills.find((x) => x.id === sel);
      if (s) fn(s);
    });

  const renameSkill = (oldName: string, newName: string) =>
    mutate((d) => {
      const s = d.skills.find((x) => x.id === sel);
      if (!s) return;
      s.name = newName;
      // update references
      const fix = (n: string) => (n === oldName ? newName : n);
      d.items.forEach((i) => i.triggers.forEach((t) => (t.skill = fix(t.skill))));
      d.blocks.forEach((b) => b.triggers.forEach((t) => (t.skill = fix(t.skill))));
      d.mobSkills.forEach((m) => (m.skill = fix(m.skill)));
      d.events.forEach((e) => (e.skill = fix(e.skill)));
      d.commands.forEach((c) => (c.skill = fix(c.skill)));
      d.skills.forEach((x) => x.lines.forEach((l) => {
        if ((l.mechanic === "skill" || l.mechanic === "repeat") && l.params.s === oldName) l.params.s = newName;
      }));
    });

  const kotlin = useMemo(() => {
    if (!skill) return "";
    return extractFn(genSkillsKt(project), skillFnName(skill.name));
  }, [project, skill]);

  const myDiags = skill ? diags.filter((d) => d.location?.startsWith(`スキル ${skill.name}`)) : [];

  const enterText = () => {
    if (!skill) return;
    setText(["# MythicMobs 形式: - mechanic{k=v} @Targeter{k=v} ?condition{k=v}", ...skill.lines.map(serializeLine)].join("\n"));
    setTextErrors([]);
    setMode("text");
  };
  const applyText = () => {
    const r = parseSkillText(text);
    setTextErrors(r.errors);
    if (r.errors.length === 0) {
      upd((s) => (s.lines = r.lines));
      setMode("visual");
    }
  };

  return (
    <div>
      <SectionHeader
        title="スキル"
        desc="MythicMobs 風のスキル。各行 = メカニック + ターゲッター + 条件。トリガーはアイテム/ブロック/モブ/イベントから紐付けます。"
      />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <ListPane
          items={project.skills}
          selected={sel}
          onSelect={(id) => {
            setSel(id);
            setMode("visual");
          }}
          addLabel="スキル追加"
          onAdd={() => {
            let n = 1;
            while (project.skills.some((s) => s.name === `NewSkill${n}`)) n++;
            const s = newSkill(`NewSkill${n}`);
            mutate((d) => d.skills.push(s));
            setSel(s.id);
          }}
          render={(s) => (
            <div>
              <div className="mono font-medium">{s.name}</div>
              <div className="truncate text-[11px] text-zinc-500">{s.lines.length} 行{s.cooldown > 0 ? ` · CD ${s.cooldown}s` : ""}</div>
            </div>
          )}
        />
        {skill ? (
          <div className="space-y-4">
            <div className="card grid gap-3 p-4 md:grid-cols-[1fr_1fr_140px_auto]">
              <Field label="スキル名 (内部名)">
                <TextInput mono value={skill.name} onChange={(v) => renameSkill(skill.name, v)} />
              </Field>
              <Field label="説明">
                <TextInput value={skill.description} onChange={(v) => upd((s) => (s.description = v))} />
              </Field>
              <Field label="クールダウン(秒)">
                <NumInput value={skill.cooldown} step={0.5} min={0} onChange={(v) => upd((s) => (s.cooldown = v))} />
              </Field>
              <div className="flex items-end gap-2">
                <button
                  className="btn"
                  onClick={() => {
                    const c = structuredClone(skill);
                    c.id = uid();
                    c.name = skill.name + "Copy";
                    c.lines.forEach((l) => (l.id = uid()));
                    mutate((d) => d.skills.push(c));
                    setSel(c.id);
                  }}
                >
                  複製
                </button>
                <button
                  className="btn-danger !py-1.5"
                  onClick={() => {
                    if (!confirm(`スキル ${skill.name} を削除しますか？`)) return;
                    mutate((d) => (d.skills = d.skills.filter((s) => s.id !== skill.id)));
                    setSel(null);
                  }}
                >
                  削除
                </button>
              </div>
              <div className="md:col-span-4">
                <ConditionEditor title="スキル条件 (キャスターに対して判定。満たさない場合スキル全体を中止)" conds={skill.conditions} skills={skillNames} onChange={(c) => upd((s) => (s.conditions = c))} />
                {skill.conditions.length > 0 && <div className="mono mt-2 text-[11px] text-amber-300/70">Conditions: {serializeConditions(skill.conditions)}</div>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-md border border-zinc-700 p-0.5">
                <button className={`rounded px-3 py-1 text-sm ${mode === "visual" ? "bg-zinc-700" : ""}`} onClick={() => setMode("visual")}>
                  ビジュアル
                </button>
                <button className={`rounded px-3 py-1 text-sm ${mode === "text" ? "bg-zinc-700" : ""}`} onClick={enterText}>
                  テキスト (MythicMobs形式)
                </button>
              </div>
              {mode === "visual" && (
                <button className="btn-primary ml-auto" onClick={() => upd((s) => s.lines.push(newLine("damage", "Target")))}>
                  + メカニック行
                </button>
              )}
            </div>

            {mode === "visual" ? (
              <div className="space-y-3">
                {skill.lines.map((l, i) => (
                  <LineCard
                    key={l.id}
                    line={l}
                    index={i}
                    total={skill.lines.length}
                    skills={skillNames}
                    onChange={(nl) => upd((s) => (s.lines[i] = nl))}
                    onRemove={() => upd((s) => s.lines.splice(i, 1))}
                    onDuplicate={() => upd((s) => s.lines.splice(i + 1, 0, { ...structuredClone(l), id: uid() }))}
                    onMove={(dir) =>
                      upd((s) => {
                        const j = i + dir;
                        [s.lines[i], s.lines[j]] = [s.lines[j], s.lines[i]];
                      })
                    }
                  />
                ))}
                {skill.lines.length === 0 && <div className="card p-6 text-center text-sm text-zinc-500">メカニック行を追加してください</div>}
              </div>
            ) : (
              <div className="card p-3">
                <textarea className="input mono min-h-[260px] text-xs leading-5" spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} />
                {textErrors.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-red-300">
                    {textErrors.map((e, i) => (
                      <li key={i}>
                        行 {e.line}: {e.message}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <button className="btn-primary" onClick={applyText}>
                    解析して適用
                  </button>
                  <button className="btn" onClick={() => setMode("visual")}>
                    キャンセル
                  </button>
                  <span className="text-[11px] text-zinc-500">例: - damage{"{"}amount=8;magic=true{"}"} @EntitiesInRadius{"{"}r=5{"}"} ?!isPlayer ?chance{"{"}p=0.5{"}"}</span>
                </div>
              </div>
            )}

            {myDiags.length > 0 && (
              <div className="card p-3">
                <div className="mb-2 text-sm font-semibold">このスキルの問題</div>
                <DiagList diags={myDiags} />
              </div>
            )}

            <div className="card overflow-hidden">
              <div className="border-b border-zinc-800 px-3 py-2 text-xs text-zinc-400">生成される Kotlin (Skills.kt)</div>
              <CodeBlock code={kotlin} maxHeight={360} />
            </div>
          </div>
        ) : (
          <div className="card p-10 text-center text-zinc-500">スキルを選択または追加してください</div>
        )}
      </div>
    </div>
  );
}
