"use client";

import { useState } from "react";
import { exportMobsYaml, exportSkillsYaml, importMythicYaml, type ImportResult } from "@/studios/mythiccraft/lib/mod/mythicYaml";
import type { ModProject } from "@/studios/mythiccraft/lib/mod/types";
import { SectionHeader } from "./ui";

type Mutate = (fn: (d: ModProject) => void) => void;

const EXAMPLE = `# MythicMobs の Skills/Mobs YAML を貼り付け
IceNova:
  Cooldown: 6
  Skills:
  - potion{type=SLOWNESS;duration=80;level=2} @EntitiesInRadius{r=6}
  - particles{p=SNOWFLAKE;a=80;hs=3} @Self
  - damage{a=5} @EntitiesInRadius{r=6} ?!isPlayer

FrostGiant:
  Type: STRAY
  Display: '&b&lFrost Giant'
  Health: 120
  Damage: 8
  Equipment:
  - diamond_axe HAND
  Drops:
  - exp 50
  - packed_ice 2-6 1
  Skills:
  - skill{s=IceNova} ~onTimer:120
  - freeze{ticks=100} @target ~onAttack`;

function download(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function ImportExport({ project, mutate, replace }: { project: ModProject; mutate: Mutate; replace: (p: ModProject) => void }) {
  const [yaml, setYaml] = useState(EXAMPLE);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [applied, setApplied] = useState<string | null>(null);
  const [tab, setTab] = useState<"skills" | "mobs">("skills");

  const preview = () => {
    setApplied(null);
    setResult(importMythicYaml(yaml));
  };
  const apply = () => {
    if (!result) return;
    mutate((d) => {
      for (const s of result.skills) {
        const i = d.skills.findIndex((x) => x.name === s.name);
        if (i >= 0) d.skills[i] = s;
        else d.skills.push(s);
      }
      for (const m of result.mobs) {
        const i = d.mobs.findIndex((x) => x.name === m.name);
        if (i >= 0) d.mobs[i] = m;
        else d.mobs.push(m);
      }
    });
    setApplied(`スキル ${result.skills.length} 件・カスタムモブ ${result.mobs.length} 件を取り込みました（同名は上書き）`);
    setResult(null);
  };

  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as ModProject;
      if (!data.meta || !Array.isArray(data.skills)) throw new Error("MythicCraft のプロジェクト JSON ではありません");
      if (!confirm("現在のプロジェクト内容を置き換えます。よろしいですか？（元に戻すで復元可能）")) return;
      replace(data);
      setApplied("プロジェクト JSON を読み込みました");
    } catch (e) {
      alert(String(e));
    }
  };

  const exported = tab === "skills" ? exportSkillsYaml(project) : exportMobsYaml(project);

  return (
    <div>
      <SectionHeader title="インポート / エクスポート" desc="MythicMobs 形式の YAML を取り込んで Fabric Mod 化、または書き出し。プロジェクト全体の JSON バックアップも可能。" />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-2 font-semibold">MythicMobs YAML を取り込む</h3>
          <textarea className="input mono min-h-[340px] text-xs leading-5" spellCheck={false} value={yaml} onChange={(e) => setYaml(e.target.value)} />
          <div className="mt-2 flex gap-2">
            <button className="btn" onClick={preview}>🔍 解析</button>
            <button className="btn-primary" disabled={!result || (result.skills.length + result.mobs.length === 0)} onClick={apply}>
              取り込む
            </button>
          </div>
          {applied && <div className="mt-3 rounded bg-emerald-950/50 p-2 text-sm text-emerald-300">✔ {applied}</div>}
          {result && (
            <div className="mt-3 space-y-2 text-sm">
              <div>
                スキル: <span className="mono text-emerald-300">{result.skills.map((s) => s.name).join(", ") || "なし"}</span>
              </div>
              <div>
                モブ: <span className="mono text-emerald-300">{result.mobs.map((m) => m.name).join(", ") || "なし"}</span>
              </div>
              {result.messages.length > 0 && (
                <ul className="space-y-0.5 text-xs text-amber-300">
                  {result.messages.map((m, i) => (
                    <li key={i}>⚠ {m}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <p className="mt-3 text-[11px] text-zinc-500">
            対応: スキル (Cooldown / Conditions / Skills)、モブ (Type / Display / Health / Damage / Armor / Options / Equipment / Drops / Skills の ~onX トリガー)。未対応メカニックは警告として表示されます。
          </p>
        </div>
        <div className="space-y-4">
          <div className="card p-4">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="font-semibold">MythicMobs YAML に書き出す</h3>
              <div className="ml-auto inline-flex rounded-md border border-zinc-700 p-0.5 text-xs">
                <button className={`rounded px-2 py-0.5 ${tab === "skills" ? "bg-zinc-700" : ""}`} onClick={() => setTab("skills")}>Skills</button>
                <button className={`rounded px-2 py-0.5 ${tab === "mobs" ? "bg-zinc-700" : ""}`} onClick={() => setTab("mobs")}>Mobs</button>
              </div>
            </div>
            <pre className="mono max-h-[300px] overflow-auto rounded bg-black/50 p-2 text-[11px] text-zinc-300">{exported}</pre>
            <div className="mt-2 flex gap-2">
              <button className="btn" onClick={() => navigator.clipboard.writeText(exported)}>コピー</button>
              <button className="btn" onClick={() => download(`${tab}.yml`, exported)}>⬇ {tab}.yml</button>
            </div>
          </div>
          <div className="card p-4">
            <h3 className="mb-2 font-semibold">プロジェクト JSON</h3>
            <div className="flex flex-wrap gap-2">
              <button className="btn" onClick={() => download(`${project.meta.modId}.mythiccraft.json`, JSON.stringify(project, null, 2), "application/json")}>
                ⬇ JSON をダウンロード
              </button>
              <label className="btn cursor-pointer">
                ⬆ JSON を読み込む
                <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
