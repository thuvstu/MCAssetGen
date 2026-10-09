"use client";

import { useState } from "react";
import { newRecipe } from "@/studios/fabric/lib/mod/catalog";
import { PROFILES, checkEnv, resolveEnv, type ProfileId, type TargetEnv } from "@/studios/fabric/lib/mod/targets";
import { Card, DiagnosticRow, Field, ListDetail, NumInput, Select, TextArea, TextInput, Toggle, slug, uniqueId, type TabProps } from "./ui";

const RECIPE_TYPES = [
  { value: "shaped", label: "作業台 (定形)" },
  { value: "shapeless", label: "作業台 (不定形)" },
  { value: "smelting", label: "かまど (Smelting)" },
  { value: "blasting", label: "溶鉱炉 (Blasting)" },
  { value: "smoking", label: "燻製器 (Smoking)" },
  { value: "campfire_cooking", label: "焚き火 (Campfire Cooking)" },
  { value: "stonecutting", label: "石切台 (Stonecutting)" },
] as const;

/** 各レシピ種類の既定値 (かまどは溶鉱炉より時間が長い、石切台は経験値なし など) */
const RECIPE_DEFAULTS: Partial<Record<(typeof RECIPE_TYPES)[number]["value"], { cookingExperience?: number; cookingTimeTicks?: number }>> = {
  smelting: { cookingExperience: 0.1, cookingTimeTicks: 200 },
  blasting: { cookingExperience: 0.1, cookingTimeTicks: 100 },
  smoking: { cookingExperience: 0.1, cookingTimeTicks: 100 },
  campfire_cooking: { cookingExperience: 0.1, cookingTimeTicks: 600 },
  stonecutting: {},
};

export function RecipesTab({ project, update, analysis }: TabProps) {
  const [sel, setSel] = useState(0);
  const idx = Math.min(sel, project.recipes.length - 1);
  const r = project.recipes[idx];
  const set = (fn: (x: typeof r) => void) => update((p) => fn(p.recipes[idx]));
  const diags = r ? analysis.diagnostics.filter((d) => d.file === "project" && d.message.startsWith(`[レシピ: ${r.id}]`)) : [];
  const { modId } = project.meta;

  return (
    <ListDetail
      title="レシピ"
      rows={project.recipes.map((x) => ({ key: x.id, label: x.resultItem || "(完成品未設定)", sub: `${x.id} · ${x.type === "shaped" ? "定型" : "不定形"}` }))}
      selected={idx} onSelect={setSel}
      onAdd={() => { update((p) => { const n = newRecipe(); n.id = uniqueId("new_recipe", p.recipes.map((x) => x.id)); n.resultItem = p.items[0] ? `${p.meta.modId}:${p.items[0].id}` : ""; p.recipes.push(n); }); setSel(project.recipes.length); }}
      onDuplicate={() => { if (!r) return; update((p) => { const c = structuredClone(p.recipes[idx]); c.id = uniqueId(`${c.id}_copy`, p.recipes.map((x) => x.id)); p.recipes.splice(idx + 1, 0, c); }); setSel(idx + 1); }}
      onDelete={() => { if (!r) return; update((p) => { p.recipes.splice(idx, 1); }); setSel(Math.max(0, idx - 1)); }}
      empty="レシピがありません"
    >
      {!r ? <Card><p className="text-sm text-slate-400">「＋ 追加」で作業台レシピを作成します。</p></Card> : (
        <div className="space-y-4 pb-8">
          <Card title={RECIPE_TYPES.find((t) => t.value === r.type)?.label ?? "レシピ"}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="レシピID"><TextInput mono value={r.id} onChange={(v) => set((x) => (x.id = slug(v)))} /></Field>
              <Field label="レシピの種類">
                <Select
                  value={r.type}
                  onChange={(v) => set((x) => {
                    x.type = v as typeof x.type;
                    const preset = RECIPE_DEFAULTS[v as keyof typeof RECIPE_DEFAULTS];
                    if (preset) {
                      if (preset.cookingExperience !== undefined) x.cookingExperience = preset.cookingExperience;
                      if (preset.cookingTimeTicks !== undefined) x.cookingTimeTicks = preset.cookingTimeTicks;
                    }
                  })}
                  options={RECIPE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                />
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-6">
              {["shaped", "shapeless"].includes(r.type) ? (
                <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-[#3a4458] bg-[#0c0f14] p-2">
                  {r.grid.map((c, i) => (
                    <input
                      key={i} value={c} list="item-datalist" placeholder="空"
                      onChange={(e) => set((x) => (x.grid[i] = e.target.value.trim()))}
                      className="font-code h-16 w-40 rounded-md border border-[#2b3547] bg-[#141922] px-2 text-center text-[11px] text-slate-200 outline-none transition focus:border-emerald-500"
                    />
                  ))}
                </div>
              ) : (
                <div className="w-80 space-y-3">
                  <Field label="材料 (単一)" hint="製錬・石切に使用されるアイテムID">
                    <TextInput mono list="item-datalist" value={r.inputItem || ""} onChange={(v) => set((x) => (x.inputItem = v.trim()))} />
                  </Field>
                  {!["stonecutting"].includes(r.type) && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="獲得経験値 (exp)">
                        <NumInput value={r.cookingExperience ?? 0.1} min={0} step={0.1} onChange={(v) => set((x) => (x.cookingExperience = v))} />
                      </Field>
                      <Field label="調理時間 (tick)" hint="20tick = 1秒">
                        <NumInput value={r.cookingTimeTicks ?? 200} min={1} onChange={(v) => set((x) => (x.cookingTimeTicks = v))} />
                      </Field>
                    </div>
                  )}
                </div>
              )}

              <span className="text-3xl text-slate-500">→</span>

              <div className="w-64 space-y-2">
                <Field label="完成品"><TextInput mono list="item-datalist" value={r.resultItem} onChange={(v) => set((x) => (x.resultItem = v.trim()))} /></Field>
                <Field label="個数"><NumInput value={r.resultCount} min={1} max={64} onChange={(v) => set((x) => (x.resultCount = v))} /></Field>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              材料は <code className="font-code">minecraft:stick</code> や <code className="font-code">{modId}:アイテムID</code> の形式。名前空間を省略すると minecraft: が補われます。
              かまど系は材料1種のみ、石切台は経験値を持ちません。
            </p>
          </Card>
          {diags.length > 0 && <Card title="検証結果">{diags.map((d, i) => <DiagnosticRow key={i} d={d} />)}</Card>}
        </div>
      )}
    </ListDetail>
  );
}

export function MetaTab({ project, update, analysis }: TabProps) {
  const m = project.meta;
  const diags = analysis.diagnostics.filter((d) => d.file === "project" && /^\[(Mod設定|マナ設定)\]/.test(d.message));
  const set = (fn: (p: typeof project) => void) => update(fn);
  return (
    <div className="max-w-4xl space-y-4 pb-8">
      <Card title="Mod情報">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mod名"><TextInput value={m.name} onChange={(v) => set((p) => (p.meta.name = v))} /></Field>
          <Field label="Mod ID" hint="小文字英数字と _ のみ (例: mythic_skills)"><TextInput mono value={m.modId} onChange={(v) => set((p) => (p.meta.modId = slug(v)))} /></Field>
          <Field label="バージョン"><TextInput mono value={m.version} onChange={(v) => set((p) => (p.meta.version = v))} /></Field>
          <Field label="作者"><TextInput value={m.author} onChange={(v) => set((p) => (p.meta.author = v))} /></Field>
          <Field label="Kotlinパッケージ名" hint="例: com.example.mymod"><TextInput mono value={m.packageName} onChange={(v) => set((p) => (p.meta.packageName = v.trim().toLowerCase()))} /></Field>
          <Field label="ライセンス"><TextInput value={m.license} onChange={(v) => set((p) => (p.meta.license = v))} /></Field>
          <Field label="説明" className="col-span-full"><TextArea rows={2} value={m.description} onChange={(v) => set((p) => (p.meta.description = v))} /></Field>
        </div>
      </Card>
      <Card title="マナシステム">
        <div className="grid grid-cols-2 gap-3">
          <Field label="最大マナ"><NumInput value={project.mana.max} min={1} onChange={(v) => set((p) => (p.mana.max = v))} /></Field>
          <Field label="毎秒の自然回復量"><NumInput value={project.mana.regenPerSecond} min={0} onChange={(v) => set((p) => (p.mana.regenPerSecond = v))} /></Field>
        </div>
        <p className="mt-2 text-xs text-slate-500">マナはプレイヤーごとに管理され、スキル発動時にアクションバーへ残量が表示されます。</p>
      </Card>
      <Card title="キースロット設定 (キーボードでスキル発動)">
        <p className="mb-3 text-xs text-slate-400">クライアントのキーバインドにスキルを割り当てます。押すとサーバー側で発動されます(既定: R / G / H / V)。</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {project.config.slots.map((slot, i) => (
            <Field key={i} label={`スロット${i + 1} (既定キー: ${["R", "G", "H", "V"][i]})`}>
              <Select
                value={slot}
                onChange={(v) => update((p) => (p.config.slots[i] = v))}
                options={[{ value: "", label: "(未割り当て)" }, ...project.skills.map((s) => ({ value: s.id, label: `${s.name} (${s.id})` }))]}
              />
            </Field>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="キーコード (GLFW)" hint="R=82, G=71, H=72, V=86。カンマ区切りで4つ">
            <TextInput
              mono
              value={project.config.slotKeys.join(", ")}
              onChange={(v) => update((p) => (p.config.slotKeys = v.split(",").map((x) => Number(x.trim()) || 0).slice(0, 4)))}
            />
          </Field>
          <div className="flex items-end">
            <Toggle checked={project.config.hud} onChange={(v) => update((p) => (p.config.hud = v))} label="マナHUDを表示する" />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">これらの値は <code className="font-code">config/{project.meta.modId}.json</code> に出力され、ゲーム内から編集可能です。</p>
      </Card>
      <EnvCard project={project} update={update} />
      {diags.length > 0 && <Card title="検証結果">{diags.map((d, i) => <DiagnosticRow key={i} d={d} />)}</Card>}
    </div>
  );
}


const SEV_ICON = { error: "⛔", warning: "⚠️", info: "ℹ️" } as const;
const SEV_COLOR = { error: "text-red-300", warning: "text-amber-300", info: "text-sky-300" } as const;

function EnvCard({ project, update }: { project: TabProps["project"]; update: TabProps["update"] }) {
  const env = resolveEnv(project.meta);
  const profile = PROFILES[env.profile];
  const issues = checkEnv(env);
  const setEnv = (patch: Partial<TargetEnv>) => update((p) => { p.meta.env = { ...resolveEnv(p.meta), ...patch }; });
  const setProfile = (id: ProfileId) => {
    if (id === env.profile) return;
    if (!confirm("プロファイルを切り替えると、生成されるKotlinのAPI名(Yarn ⇄ Mojang)とビルド設定が変わります。\n「カスタムKotlin」ブロックは自動変換されないので、手書きコードがある場合は書き換えが必要です。切り替えますか？")) return;
    update((p) => { p.meta.env = { ...PROFILES[id].env }; });
  };
  const field = (label: string, key: keyof TargetEnv, hint?: string) => (
    <Field label={label} hint={hint}>
      <TextInput mono value={String(env[key] ?? "")} onChange={(v) => setEnv({ [key]: key === "java" ? Number(v) || 21 : v } as Partial<TargetEnv>)} />
    </Field>
  );
  const errors = issues.filter((i) => i.severity === "error").length;
  return (
    <Card
      title="🛠 ビルド環境 (Minecraft / Loom / Gradle / マッピング)"
      right={<span className={`text-xs ${errors ? "text-red-300" : "text-emerald-300"}`}>{errors ? `${errors} 件の不整合` : "✔ 整合しています"}</span>}
    >
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Field label="ターゲットプロファイル" hint={profile.note}>
          <Select value={env.profile} onChange={(v) => setProfile(v as ProfileId)} options={Object.values(PROFILES).map((x) => ({ value: x.id, label: x.label }))} />
        </Field>
        <div className="rounded-md border border-[#262f3e] bg-[#0c0f14] p-2 text-[11px] leading-5 text-slate-400">
          <p className="font-semibold text-slate-300">コンパイル検証済みの構成</p>
          <p>{profile.verified}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {field("Minecraft", "minecraft")}
        <Field label="マッピング" hint="プロファイルで決まります">
          <div className="input font-code !bg-[#0c0f14] text-slate-300">{env.mappings === "mojmap" ? "Mojang Official (officialMojangMappings)" : `Yarn ${env.yarn}`}</div>
        </Field>
        <Field label="Loom プラグインID">
          <Select value={env.loomPlugin} onChange={(v) => setEnv({ loomPlugin: v })} options={[
            { value: "net.fabricmc.fabric-loom-remap", label: "net.fabricmc.fabric-loom-remap (1.14+)" },
            { value: "fabric-loom", label: "fabric-loom (旧名)" },
            { value: "net.fabricmc.fabric-loom", label: "net.fabricmc.fabric-loom (26.1+ 非難読化)" },
          ]} />
        </Field>
        {field("Fabric Loom", "loom", "例: 1.14-SNAPSHOT / 1.11.8")}
        {field("Gradle (Wrapper)", "gradle", "Loom 1.14 は 9.5 以上")}
        {field("Fabric Loader", "loader")}
        {field("Fabric API", "fabricApi", "末尾は +Minecraft版")}
        {field("Fabric Language Kotlin", "kotlinLoader")}
        {field("Kotlin プラグイン", "kotlin", "FLK の +kotlin.X と一致")}
        {env.mappings === "yarn" && field("Yarn", "yarn")}
        {field("Java", "java", "21 以上")}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => update((p) => { p.meta.env = { ...PROFILES[env.profile].env }; })} className="rounded-md border border-[#2b3547] px-2.5 py-1 text-xs text-slate-200 hover:bg-white/5">
          このプロファイルの既定値に戻す
        </button>
        <span className="text-[11px] text-slate-500">変更はビルド設定 (build.gradle.kts / gradle.properties / gradle-wrapper.properties / fabric.mod.json) に反映されます</span>
      </div>
      {issues.length > 0 && (
        <ul className="mt-3 space-y-1">
          {issues.map((i, k) => (
            <li key={k} className={`text-xs ${SEV_COLOR[i.severity]}`}>{SEV_ICON[i.severity]} <span className="font-code text-[10px] opacity-70">{i.code}</span> {i.message}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
