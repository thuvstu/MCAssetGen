"use client";

import { useState } from "react";
import { ENTITY_TYPES, newDropRule, newMob } from "@/studios/mythicforge/lib/mod/catalog";
import { Btn, Card, DiagnosticRow, Field, ListDetail, NumInput, Select, TextInput, slug, uniqueId, type TabProps } from "./ui";

/** ドロップ品1行 (カスタムモブ / ドロップ表 共用) */
function DropRow({
  item, min, max, chance, onChange, onDelete,
}: { item: string; min: number; max: number; chance: number; onChange: (v: { item: string; min: number; max: number; chance: number }) => void; onDelete: () => void }) {
  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1"><Field label="アイテムID"><TextInput mono list="item-datalist" value={item} onChange={(v) => onChange({ item: v.trim(), min, max, chance })} /></Field></div>
      <div className="w-20"><Field label="最小"><NumInput value={min} min={0} max={64} onChange={(v) => onChange({ item, min: v, max, chance })} /></Field></div>
      <div className="w-20"><Field label="最大"><NumInput value={max} min={0} max={64} onChange={(v) => onChange({ item, min, max: v, chance })} /></Field></div>
      <div className="w-24"><Field label="確率 (0〜1)"><NumInput value={chance} min={0} max={1} step={0.05} onChange={(v) => onChange({ item, min, max, chance: v })} /></Field></div>
      <Btn variant="danger" onClick={onDelete} className="!px-2 !py-1.5 text-xs">✕</Btn>
    </div>
  );
}

export default function MobsTab({ project, update, analysis }: TabProps) {
  const [sel, setSel] = useState(0);
  const idx = Math.min(sel, project.mobs.length - 1);
  const mob = project.mobs[idx];
  const set = (fn: (x: typeof mob) => void) => update((p) => fn(p.mobs[idx]));
  const diags = mob ? analysis.diagnostics.filter((d) => d.file === "project" && d.message.startsWith(`[モブ: ${mob.id}]`)) : [];

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="min-h-0 flex-1">
        <ListDetail
          title="カスタムモブ"
          rows={project.mobs.map((m) => ({ key: m.id, label: m.name, sub: `${m.id} · base: ${m.baseMob}`, badge: analysis.diagnostics.filter((d) => d.severity === "error" && d.message.startsWith(`[モブ: ${m.id}]`)).length }))}
          selected={idx} onSelect={setSel}
          onAdd={() => { update((p) => { p.mobs.push({ ...newMob(), id: uniqueId("new_mob", p.mobs.map((x) => x.id)) }); }); setSel(project.mobs.length); }}
          onDuplicate={() => { if (!mob) return; update((p) => { const c = structuredClone(p.mobs[idx]); c.id = uniqueId(`${c.id}_copy`, p.mobs.map((x) => x.id)); p.mobs.splice(idx + 1, 0, c); }); setSel(idx + 1); }}
          onDelete={() => { if (!mob) return; update((p) => { p.mobs.splice(idx, 1); }); setSel(Math.max(0, idx - 1)); }}
          empty="カスタムモブがありません"
        >
          {!mob ? (
            <Card>
              <p className="text-sm text-slate-400">
                「＋ 追加」でカスタムモブを作成します。ベースのバニラMobに名前・能力値・専用ドロップを適用したモブで、
                スキルアクション「カスタムモブ召喚」から出現させられます。
              </p>
            </Card>
          ) : (
            <div className="space-y-4 pb-4">
              <Card title="基本">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Field label="表示名 (頭上に表示)"><TextInput value={mob.name} onChange={(v) => set((x) => (x.name = v))} /></Field>
                  <Field label="ID"><TextInput mono value={mob.id} onChange={(v) => set((x) => (x.id = slug(v)))} /></Field>
                  <Field label="ベースMob" hint="見た目とAIはこのMobを使います">
                    <Select value={mob.baseMob} onChange={(v) => set((x) => (x.baseMob = v))} options={ENTITY_TYPES.map((e) => ({ value: e.key, label: `${e.label} (${e.key})` }))} />
                  </Field>
                  <Field label="最大体力 (HP)"><NumInput value={mob.maxHealth} min={1} max={1024} onChange={(v) => set((x) => (x.maxHealth = v))} /></Field>
                  <Field label="移動速度" hint="ゾンビ=0.23 / 0.4で高速"><NumInput value={mob.movementSpeed} min={0} max={2} step={0.01} onChange={(v) => set((x) => (x.movementSpeed = v))} /></Field>
                  <Field label="攻撃力"><NumInput value={mob.attackDamage} min={0} max={100} step={0.5} onChange={(v) => set((x) => (x.attackDamage = v))} /></Field>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  召喚方法: スキルアクション「🧌 カスタムモブ召喚」。倒すと下のドロップが確率で落ちます(バニラのドロップに追加)。
                </p>
              </Card>
              <Card title="専用ドロップ" right={<Btn className="!py-1 text-xs" onClick={() => set((x) => x.drops.push({ item: "minecraft:emerald", countMin: 1, countMax: 1, chance: 0.5 }))}>＋ ドロップ追加</Btn>}>
                {mob.drops.length === 0 && <p className="text-xs text-slate-500">専用ドロップなし (バニラのドロップのみ)</p>}
                <div className="space-y-2">
                  {mob.drops.map((dr, i) => (
                    <DropRow key={i} item={dr.item} min={dr.countMin} max={dr.countMax} chance={dr.chance}
                      onChange={(v) => set((x) => (x.drops[i] = { item: v.item, countMin: v.min, countMax: v.max, chance: v.chance }))}
                      onDelete={() => set((x) => x.drops.splice(i, 1))} />
                  ))}
                </div>
              </Card>
              {diags.length > 0 && <Card title="検証結果">{diags.map((d, i) => <DiagnosticRow key={i} d={d} />)}</Card>}
            </div>
          )}
        </ListDetail>
      </div>

      <Card
        title="🎲 ドロップ表 (ハクスラ用: バニラ含む任意のMobが対象)"
        right={<Btn className="!py-1 text-xs" onClick={() => update((p) => p.drops.push({ ...newDropRule(), id: uniqueId("new_drop", p.drops.map((x) => x.id)) }))}>＋ ドロップ表追加</Btn>}
      >
        {project.drops.length === 0 && <p className="text-xs text-slate-500">ドロップ表なし。対象Mob (例: minecraft:zombie、ANY=全Mob) を倒した時に確率でアイテムを追加ドロップさせます。</p>}
        <div className="space-y-3">
          {project.drops.map((rule, ri) => (
            <div key={rule.id + ri} className="rounded-lg border border-[#262f3e] bg-[#0c0f14] p-3">
              <div className="mb-2 flex items-end gap-2">
                <div className="w-44"><Field label="ドロップ表ID"><TextInput mono value={rule.id} onChange={(v) => update((p) => (p.drops[ri].id = slug(v)))} /></Field></div>
                <div className="min-w-0 flex-1">
                  <Field label="対象Mob" hint="ANY / minecraft:zombie / mymod:カスタムモブのベースMob ID">
                    <TextInput mono value={rule.targetMob} onChange={(v) => update((p) => (p.drops[ri].targetMob = v.trim()))} />
                  </Field>
                </div>
                <Btn className="!py-1 text-xs" onClick={() => update((p) => p.drops[ri].items.push({ id: "minecraft:diamond", min: 1, max: 1, chance: 0.1 }))}>＋ 品目</Btn>
                <Btn variant="danger" className="!py-1 text-xs" onClick={() => update((p) => { p.drops.splice(ri, 1); })}>削除</Btn>
              </div>
              <div className="space-y-2">
                {rule.items.map((it, ii) => (
                  <DropRow key={ii} item={it.id} min={it.min} max={it.max} chance={it.chance}
                    onChange={(v) => update((p) => (p.drops[ri].items[ii] = { id: v.item, min: v.min, max: v.max, chance: v.chance }))}
                    onDelete={() => update((p) => p.drops[ri].items.splice(ii, 1))} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
