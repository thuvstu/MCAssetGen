"use client";

import { useState } from "react";
import { SKILL_POINT_EFFECTS, newAdvancement, newEffect, newMaterial, newShop, newSkillPoint, newTrade } from "@/studios/mythicforge/lib/mod/catalog";
import { resolveEnv } from "@/studios/mythicforge/lib/mod/targets";
import type { Diagnostic } from "@/studios/mythicforge/lib/mod/types";
import { Btn, Card, DiagnosticRow, Field, ListDetail, NumInput, Select, TextArea, TextInput, Toggle, slug, uniqueId, type TabProps } from "./ui";

type Sub = "effects" | "advancements" | "shops" | "skillPoints" | "materials";

const SUBS: { key: Sub; label: string; icon: string }[] = [
  { key: "effects", label: "エフェクト", icon: "🌟" },
  { key: "advancements", label: "実績", icon: "🏆" },
  { key: "shops", label: "ショップ", icon: "🏪" },
  { key: "skillPoints", label: "スキルポイント", icon: "⭐" },
  { key: "materials", label: "素材", icon: "⚙️" },
];

const MOBS = ["ANY", "minecraft:zombie", "minecraft:skeleton", "minecraft:creeper", "minecraft:spider", "minecraft:enderman", "minecraft:blaze", "minecraft:witch", "minecraft:wither_skeleton"];

function usePane(length: number) {
  const [sel, setSel] = useState(0);
  return { idx: Math.max(0, Math.min(sel, length - 1)), setSel };
}

function Diags({ diags }: { diags: Diagnostic[] }) {
  if (diags.length === 0) return null;
  return <Card title="検証結果">{diags.map((d, i) => <DiagnosticRow key={i} d={d} />)}</Card>;
}

export default function ExtrasTab(props: TabProps) {
  const [sub, setSub] = useState<Sub>("effects");
  const legacy = resolveEnv(props.project.meta).mappings === "yarn";
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1">
        {SUBS.map((s) => (
          <button key={s.key} onClick={() => setSub(s.key)} className={`rounded-lg px-3 py-1.5 text-sm transition ${sub === s.key ? "bg-emerald-500/20 font-semibold text-emerald-200 ring-1 ring-emerald-500/30" : "text-slate-400 hover:bg-white/5"}`}>
            {s.icon} {s.label} <span className="text-xs text-slate-500">{props.project[s.key].length}</span>
          </button>
        ))}
      </div>
      {legacy && sub !== "materials" && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          ⚠ この機能は <b>Minecraft 1.21.11 プロファイル</b>専用です。現在は旧 1.21.1/Yarn プロファイルのため、定義しても生成されず検証エラーになります。「Mod設定」でプロファイルを切り替えてください。
        </p>
      )}
      <div className="min-h-0 flex-1">
        {sub === "effects" && <EffectsPane {...props} />}
        {sub === "advancements" && <AdvancementsPane {...props} />}
        {sub === "shops" && <ShopsPane {...props} />}
        {sub === "skillPoints" && <SkillPointsPane {...props} />}
        {sub === "materials" && <MaterialsPane {...props} />}
      </div>
    </div>
  );
}

const diagsFor = (a: TabProps["analysis"], tag: string): Diagnostic[] => a.diagnostics.filter((d) => d.file === "project" && d.message.startsWith(`[${tag}`));
const errCount = (a: TabProps["analysis"], tag: string) => diagsFor(a, tag).filter((d) => d.severity === "error").length;

// ---------------------------------------------------------------- エフェクト
function EffectsPane({ project, update, analysis }: TabProps) {
  const { idx, setSel } = usePane(project.effects.length);
  const ef = project.effects[idx];
  const set = (fn: (x: NonNullable<typeof ef>) => void) => update((p) => fn(p.effects[idx]));
  const skills = [{ value: "", label: "(なし)" }, ...project.skills.map((s) => ({ value: s.id, label: `${s.name} (${s.id})` }))];
  return (
    <ListDetail
      title="カスタムエフェクト"
      rows={project.effects.map((x) => ({ key: x.id, label: x.name, sub: `${x.id} · ${x.revive ? "復活" : x.tickSkillId ? "毎tick" : "見た目"}`, badge: errCount(analysis, `エフェクト: ${x.id}`) }))}
      selected={idx} onSelect={setSel}
      onAdd={() => { update((p) => { p.effects.push({ ...newEffect(), id: uniqueId("new_effect", p.effects.map((x) => x.id)), revive: false }); }); setSel(project.effects.length); }}
      onDuplicate={() => { if (!ef) return; update((p) => { const c = structuredClone(p.effects[idx]); c.id = uniqueId(`${c.id}_copy`, p.effects.map((x) => x.id)); p.effects.splice(idx + 1, 0, c); }); setSel(idx + 1); }}
      onDelete={() => { if (!ef) return; update((p) => { p.effects.splice(idx, 1); }); setSel(Math.max(0, idx - 1)); }}
      empty="カスタムエフェクトがありません"
    >
      {!ef ? <Card><p className="text-sm text-slate-400">バニラにない独自のステータス効果を作ります。不死のトーテムのような「致死ダメージで復活」や、「効果中は毎秒スキル発動」ができます。スキルの「カスタムエフェクト付与」で付けます。</p></Card> : (
        <div className="space-y-4 pb-4">
          <Card title="基本">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Field label="表示名"><TextInput value={ef.name} onChange={(v) => set((x) => (x.name = v))} /></Field>
              <Field label="ID"><TextInput mono value={ef.id} onChange={(v) => set((x) => (x.id = slug(v)))} /></Field>
              <Field label="種類"><Select value={ef.category} onChange={(v) => set((x) => (x.category = v as typeof x.category))} options={[{ value: "BENEFICIAL", label: "有益 (青文字)" }, { value: "HARMFUL", label: "有害 (赤文字)" }, { value: "NEUTRAL", label: "中立" }]} /></Field>
              <Field label="色" hint="パーティクルとアイコンの色">
                <div className="flex items-center gap-2"><input type="color" value={ef.color} onChange={(e) => set((x) => (x.color = e.target.value))} className="h-9 w-12 cursor-pointer rounded border border-[#262f3e] bg-transparent" /><TextInput mono value={ef.color} onChange={(v) => set((x) => (x.color = v))} /></div>
              </Field>
            </div>
          </Card>
          <Card title="🔁 復活 (不死のトーテム風)">
            <Toggle checked={ef.revive} onChange={(v) => set((x) => (x.revive = v))} label="致死ダメージを受けた時にエフェクトを消費して復活する" />
            {ef.revive && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="復活時のHP"><NumInput value={ef.reviveHealth} min={1} max={100} onChange={(v) => set((x) => (x.reviveHealth = v))} /></Field>
                <Field label="復活時に発動するスキル" hint="演出・回復・実績など自由に"><Select value={ef.reviveSkillId} onChange={(v) => set((x) => (x.reviveSkillId = v))} options={skills} /></Field>
              </div>
            )}
            <p className="mt-2 text-[11px] text-slate-500">復活時は他の効果を全て消し、再生II・吸収II・火炎耐性を付与し、不死のトーテムの演出を再生します。</p>
          </Card>
          <Card title="⏱ 効果中のスキル (プレイヤーのみ)">
            <div className="grid grid-cols-2 gap-3">
              <Field label="一定間隔で発動するスキル"><Select value={ef.tickSkillId} onChange={(v) => set((x) => (x.tickSkillId = v))} options={skills} /></Field>
              <Field label="発動間隔 (tick)" hint="20tick = 1秒"><NumInput value={ef.intervalTicks} min={1} onChange={(v) => set((x) => (x.intervalTicks = v))} /></Field>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">毎tickスキルのマナ・クールダウンは無視されます (エフェクトを持つ間は無消費)。</p>
          </Card>
          <Diags diags={diagsFor(analysis, `エフェクト: ${ef.id}`)} />
        </div>
      )}
    </ListDetail>
  );
}

// ---------------------------------------------------------------- 実績
function AdvancementsPane({ project, update, analysis }: TabProps) {
  const { idx, setSel } = usePane(project.advancements.length);
  const ad = project.advancements[idx];
  const set = (fn: (x: NonNullable<typeof ad>) => void) => update((p) => fn(p.advancements[idx]));
  const parents = [{ value: "", label: "(Modのルート直下)" }, ...project.advancements.filter((x) => x.id !== ad?.id).map((x) => ({ value: x.id, label: x.name }))];
  return (
    <ListDetail
      title="実績"
      rows={project.advancements.map((x) => ({ key: x.id, label: x.name, sub: `${x.id} · ${x.kind === "OBTAIN_ITEM" ? "入手" : x.kind === "KILL_MOB" ? `討伐 ${x.steps}` : `手動 ${x.steps}段`}`, badge: errCount(analysis, `実績: ${x.id}`) }))}
      selected={idx} onSelect={setSel}
      onAdd={() => { update((p) => { p.advancements.push({ ...newAdvancement(), id: uniqueId("new_advancement", p.advancements.map((x) => x.id)) }); }); setSel(project.advancements.length); }}
      onDuplicate={() => { if (!ad) return; update((p) => { const c = structuredClone(p.advancements[idx]); c.id = uniqueId(`${c.id}_copy`, p.advancements.map((x) => x.id)); p.advancements.splice(idx + 1, 0, c); }); setSel(idx + 1); }}
      onDelete={() => { if (!ad) return; update((p) => { p.advancements.splice(idx, 1); }); setSel(Math.max(0, idx - 1)); }}
      empty="実績がありません"
    >
      {!ad ? <Card><p className="text-sm text-slate-400">進捗付きの実績を作ります。実績画面に Modのタブが追加され、アイテム入手・討伐カウント・スキルからの手動進行に対応します。</p></Card> : (
        <div className="space-y-4 pb-4">
          <Card title="表示">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Field label="名前"><TextInput value={ad.name} onChange={(v) => set((x) => (x.name = v))} /></Field>
              <Field label="ID"><TextInput mono value={ad.id} onChange={(v) => set((x) => (x.id = slug(v)))} /></Field>
              <Field label="アイコン (アイテムID)"><TextInput mono list="item-datalist" value={ad.icon} onChange={(v) => set((x) => (x.icon = v.trim()))} /></Field>
              <Field label="枠"><Select value={ad.frame} onChange={(v) => set((x) => (x.frame = v as typeof x.frame))} options={[{ value: "task", label: "通常 (四角)" }, { value: "goal", label: "目標 (丸み)" }, { value: "challenge", label: "挑戦 (トゲ・特別音)" }]} /></Field>
              <Field label="説明" className="col-span-2"><TextInput value={ad.description} onChange={(v) => set((x) => (x.description = v))} /></Field>
              <Field label="親の実績"><Select value={ad.parent} onChange={(v) => set((x) => (x.parent = v))} options={parents} /></Field>
              <Field label="報酬 経験値"><NumInput value={ad.rewardXp} min={0} onChange={(v) => set((x) => (x.rewardXp = v))} /></Field>
              <div className="flex items-end"><Toggle checked={ad.hidden} onChange={(v) => set((x) => (x.hidden = v))} label="達成するまで隠す" /></div>
            </div>
          </Card>
          <Card title="達成条件">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Field label="種類" className="col-span-2">
                <Select value={ad.kind} onChange={(v) => set((x) => (x.kind = v as typeof x.kind))} options={[
                  { value: "OBTAIN_ITEM", label: "アイテムを入手する (自動判定)" },
                  { value: "KILL_MOB", label: "モブを N 体倒す (進捗 n/N)" },
                  { value: "MANUAL", label: "スキルから進める (進捗 n/N)" },
                ]} />
              </Field>
              {ad.kind === "OBTAIN_ITEM" && <Field label="入手するアイテム" className="col-span-2"><TextInput mono list="item-datalist" value={ad.item} onChange={(v) => set((x) => (x.item = v.trim()))} /></Field>}
              {ad.kind === "KILL_MOB" && <Field label="倒す対象" hint="ANY = 全モブ" className="col-span-2"><TextInput mono list="mob-datalist" value={ad.mob} onChange={(v) => set((x) => (x.mob = v.trim()))} /></Field>}
              {ad.kind !== "OBTAIN_ITEM" && <Field label="必要な段数 (N)"><NumInput value={ad.steps} min={1} max={100} onChange={(v) => set((x) => (x.steps = Math.round(v)))} /></Field>}
            </div>
            {ad.kind === "MANUAL" && <p className="mt-2 text-[11px] text-slate-500">スキルのアクション「🏆 実績を進める」で1段ずつ進みます。</p>}
            <datalist id="mob-datalist">{MOBS.map((m) => <option key={m} value={m} />)}</datalist>
          </Card>
          <Diags diags={diagsFor(analysis, `実績: ${ad.id}`)} />
        </div>
      )}
    </ListDetail>
  );
}

// ---------------------------------------------------------------- ショップ
function ShopsPane({ project, update, analysis }: TabProps) {
  const { idx, setSel } = usePane(project.shops.length);
  const sh = project.shops[idx];
  const set = (fn: (x: NonNullable<typeof sh>) => void) => update((p) => fn(p.shops[idx]));
  const blocks = [{ value: "", label: "(ブロックでは開かない)" }, ...project.blocks.map((b) => ({ value: b.id, label: `${b.name} (${b.id})` }))];
  return (
    <ListDetail
      title="ショップ"
      rows={project.shops.map((x) => ({ key: x.id, label: x.name, sub: `${x.id} · ${x.trades.length}件`, badge: errCount(analysis, `ショップ: ${x.id}`) }))}
      selected={idx} onSelect={setSel}
      onAdd={() => { update((p) => { p.shops.push({ ...newShop(), id: uniqueId("new_shop", p.shops.map((x) => x.id)) }); }); setSel(project.shops.length); }}
      onDuplicate={() => { if (!sh) return; update((p) => { const c = structuredClone(p.shops[idx]); c.id = uniqueId(`${c.id}_copy`, p.shops.map((x) => x.id)); c.openedByBlockId = ""; p.shops.splice(idx + 1, 0, c); }); setSel(idx + 1); }}
      onDelete={() => { if (!sh) return; update((p) => { p.shops.splice(idx, 1); }); setSel(Math.max(0, idx - 1)); }}
      empty="ショップがありません"
    >
      {!sh ? <Card><p className="text-sm text-slate-400">村人の取引画面と同じUIで開く本物のショップです。最大2種類のアイテムを要求できます。ブロックの右クリック、<code className="font-code">/shop &lt;ID&gt;</code>、スキル「ショップを開く」から開けます。</p></Card> : (
        <div className="space-y-4 pb-4">
          <Card title="基本">
            <div className="grid grid-cols-3 gap-3">
              <Field label="店名 (取引画面のタイトル)"><TextInput value={sh.name} onChange={(v) => set((x) => (x.name = v))} /></Field>
              <Field label="ID"><TextInput mono value={sh.id} onChange={(v) => set((x) => (x.id = slug(v)))} /></Field>
              <Field label="右クリックで開くブロック"><Select value={sh.openedByBlockId ?? ""} onChange={(v) => set((x) => (x.openedByBlockId = v))} options={blocks} /></Field>
            </div>
          </Card>
          <Card title="取引" right={<Btn className="!py-1 text-xs" onClick={() => set((x) => x.trades.push(newTrade()))}>＋ 取引を追加</Btn>}>
            <div className="space-y-2">
              {sh.trades.length === 0 && <p className="text-xs text-slate-500">取引がありません</p>}
              {sh.trades.map((t, i) => (
                <div key={t.id + i} className="grid grid-cols-[1fr_70px_1fr_70px_1fr_70px_auto] items-end gap-2 rounded-lg border border-[#262f3e] bg-[#0c0f14] p-2">
                  <Field label="必要1"><TextInput mono list="item-datalist" value={t.requiredItem1} onChange={(v) => set((x) => (x.trades[i].requiredItem1 = v.trim()))} /></Field>
                  <Field label="個数"><NumInput value={t.requiredCount1} min={1} max={64} onChange={(v) => set((x) => (x.trades[i].requiredCount1 = Math.round(v)))} /></Field>
                  <Field label="必要2 (任意)"><TextInput mono list="item-datalist" value={t.requiredItem2} onChange={(v) => set((x) => (x.trades[i].requiredItem2 = v.trim()))} /></Field>
                  <Field label="個数"><NumInput value={t.requiredCount2} min={0} max={64} onChange={(v) => set((x) => (x.trades[i].requiredCount2 = Math.round(v)))} /></Field>
                  <Field label="→ 販売アイテム"><TextInput mono list="item-datalist" value={t.offerItem} onChange={(v) => set((x) => (x.trades[i].offerItem = v.trim()))} /></Field>
                  <Field label="個数"><NumInput value={t.offerCount} min={1} max={64} onChange={(v) => set((x) => (x.trades[i].offerCount = Math.round(v)))} /></Field>
                  <Btn variant="danger" className="!px-2 !py-1.5 text-xs" onClick={() => set((x) => x.trades.splice(i, 1))}>✕</Btn>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">取引回数は無制限です。プレイヤーが持っているアイテムとの交換になります (通貨はアイテムで表現: エメラルド等)。</p>
          </Card>
          <Diags diags={diagsFor(analysis, `ショップ: ${sh.id}`)} />
        </div>
      )}
    </ListDetail>
  );
}

// ---------------------------------------------------------------- スキルポイント
function SkillPointsPane({ project, update, analysis }: TabProps) {
  const { idx, setSel } = usePane(project.skillPoints.length);
  const sp = project.skillPoints[idx];
  const set = (fn: (x: NonNullable<typeof sp>) => void) => update((p) => fn(p.skillPoints[idx]));
  const eff = SKILL_POINT_EFFECTS.find((e) => e.value === sp?.effect);
  return (
    <ListDetail
      title="スキルポイント強化"
      rows={project.skillPoints.map((x) => ({ key: x.id, label: x.name, sub: `${x.id} · ${x.cost}pt`, badge: errCount(analysis, `強化: ${x.id}`) }))}
      selected={idx} onSelect={setSel}
      onAdd={() => { update((p) => { p.skillPoints.push({ ...newSkillPoint(), id: uniqueId("new_upgrade", p.skillPoints.map((x) => x.id)) }); }); setSel(project.skillPoints.length); }}
      onDuplicate={() => { if (!sp) return; update((p) => { const c = structuredClone(p.skillPoints[idx]); c.id = uniqueId(`${c.id}_copy`, p.skillPoints.map((x) => x.id)); p.skillPoints.splice(idx + 1, 0, c); }); setSel(idx + 1); }}
      onDelete={() => { if (!sp) return; update((p) => { p.skillPoints.splice(idx, 1); }); setSel(Math.max(0, idx - 1)); }}
      empty="強化がありません"
    >
      {!sp ? <Card><p className="text-sm text-slate-400">スキルポイントを消費して何度でも強化できるステータス振り分けです。ポイントはスキルの「スキルポイント獲得」で貯め、ゲーム内 <code className="font-code">/sp</code> で確認、<code className="font-code">/sp buy &lt;ID&gt;</code> で習得します。</p></Card> : (
        <div className="space-y-4 pb-4">
          <Card title="強化">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Field label="名前"><TextInput value={sp.name} onChange={(v) => set((x) => (x.name = v))} /></Field>
              <Field label="ID"><TextInput mono value={sp.id} onChange={(v) => set((x) => (x.id = slug(v)))} /></Field>
              <Field label="効果"><Select value={sp.effect} onChange={(v) => set((x) => (x.effect = v as typeof x.effect))} options={SKILL_POINT_EFFECTS.map((e) => ({ value: e.value, label: e.label }))} /></Field>
              <Field label="1回あたりの上昇量" hint={eff?.hint}><NumInput value={sp.amount} min={0} step={0.001} onChange={(v) => set((x) => (x.amount = v))} /></Field>
              <Field label="必要ポイント"><NumInput value={sp.cost} min={1} onChange={(v) => set((x) => (x.cost = Math.round(v)))} /></Field>
              <Field label="説明" className="col-span-3"><TextInput value={sp.description} onChange={(v) => set((x) => (x.description = v))} /></Field>
            </div>
          </Card>
          <Diags diags={diagsFor(analysis, `強化: ${sp.id}`)} />
        </div>
      )}
    </ListDetail>
  );
}

// ---------------------------------------------------------------- 素材
function MaterialsPane({ project, update, analysis }: TabProps) {
  const { idx, setSel } = usePane(project.materials.length);
  const m = project.materials[idx];
  const set = (fn: (x: NonNullable<typeof m>) => void) => update((p) => fn(p.materials[idx]));
  const users = m ? project.items.filter((it) => it.materialId === m.id) : [];
  return (
    <ListDetail
      title="素材"
      rows={project.materials.map((x) => ({ key: x.id, label: x.name, sub: `${x.id} · 攻撃×${x.damageMultiplier}`, badge: errCount(analysis, `素材: ${x.id}`) }))}
      selected={idx} onSelect={setSel}
      onAdd={() => { update((p) => { p.materials.push({ ...newMaterial(), id: uniqueId("new_material", p.materials.map((x) => x.id)) }); }); setSel(project.materials.length); }}
      onDuplicate={() => { if (!m) return; update((p) => { const c = structuredClone(p.materials[idx]); c.id = uniqueId(`${c.id}_copy`, p.materials.map((x) => x.id)); p.materials.splice(idx + 1, 0, c); }); setSel(idx + 1); }}
      onDelete={() => { if (!m) return; update((p) => { const id = p.materials[idx].id; p.items.forEach((it) => { if (it.materialId === id) it.materialId = undefined; }); p.materials.splice(idx, 1); }); setSel(Math.max(0, idx - 1)); }}
      empty="素材がありません"
    >
      {!m ? <Card><p className="text-sm text-slate-400">バニラの素材を元に、攻撃力・採掘速度・耐久に倍率をかけた独自素材を作ります。アイテムタブの「素材」で道具・防具に割り当てます。</p></Card> : (
        <div className="space-y-4 pb-4">
          <Card title="素材">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Field label="名前"><TextInput value={m.name} onChange={(v) => set((x) => (x.name = v))} /></Field>
              <Field label="ID"><TextInput mono value={m.id} onChange={(v) => set((x) => (x.id = slug(v)))} /></Field>
              <Field label="ベース素材" hint="道具のベース素材はアイテム側の設定を使います"><TextInput value="アイテムの素材設定" onChange={() => undefined} /></Field>
              <Field label="攻撃力 倍率" hint="素材の攻撃ボーナスに掛かる"><NumInput value={m.damageMultiplier} min={0.1} max={5} step={0.1} onChange={(v) => set((x) => (x.damageMultiplier = v))} /></Field>
              <Field label="採掘速度 倍率 (道具)"><NumInput value={m.speedMultiplier} min={0.1} max={5} step={0.1} onChange={(v) => set((x) => (x.speedMultiplier = v))} /></Field>
              <Field label="耐久 倍率"><NumInput value={m.durabilityMultiplier} min={0.1} max={10} step={0.1} onChange={(v) => set((x) => (x.durabilityMultiplier = v))} /></Field>
              <Field label="説明" className="col-span-2"><TextArea rows={2} value={m.description} onChange={(v) => set((x) => (x.description = v))} /></Field>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">使用中のアイテム: {users.length ? users.map((u) => u.name).join(", ") : "なし"} ／ 道具(剣・ピッケル・斧・シャベル)は攻撃・採掘・耐久、防具は耐久に反映。1.21.1/Yarn では攻撃力と耐久のみ。</p>
          </Card>
          <Diags diags={diagsFor(analysis, `素材: ${m.id}`)} />
        </div>
      )}
    </ListDetail>
  );
}
