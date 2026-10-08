"use client";

import Link from "next/link";
import { useState } from "react";
import { COMMON_VANILLA_ITEMS } from "@/lib/mod/catalog";
import { downloadZip } from "@/lib/mod/exportZip";
import { resolveEnv } from "@/lib/mod/targets";
import type { ModProject } from "@/lib/mod/model";
import BuildTab from "./BuildTab";
import CodeTab from "./CodeTab";
import ItemsTab from "./ItemsTab";
import BlocksTab from "./BlocksTab";
import { MetaTab, RecipesTab } from "./RecipesMetaTabs";
import SkillsTab from "./SkillsTab";
import MobsTab from "./MobsTab";
import ForgeTab from "./ForgeTab";
import ExtrasTab from "./ExtrasTab";
import StructuresTab from "./StructuresTab";
import { Btn } from "./ui";
import { useProjectEditor } from "./useProjectEditor";

type TabKey = "meta" | "skills" | "items" | "blocks" | "mobs" | "recipes" | "forge" | "structures" | "extras" | "code" | "build";

export default function Editor({ id }: { id: string }) {
  const { project, analysis, missing, saveState: save, update, replace, undo, redo, canUndo, canRedo } = useProjectEditor(id);
  const [tab, setTab] = useState<TabKey>("skills");
  const [focus, setFocus] = useState<{ file: string; line: number; n: number } | null>(null);

  if (missing) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-slate-300">プロジェクトが見つかりません。</p>
        <Link href="/" className="text-emerald-300 underline">ホームへ戻る</Link>
      </div>
    );
  }
  if (!project || !analysis) return <div className="flex h-screen items-center justify-center text-slate-400">読み込み中…</div>;

  const duplicate = async () => {
    const r = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `${project.meta.name} (コピー)`, template: "empty" }) });
    const { id: nid } = await r.json();
    await fetch(`/api/projects/${nid}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `${project.meta.name} (コピー)`, data: project }) });
    window.location.href = `/editor/${nid}`;
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ name: project.meta.name, data: project }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.meta.modId}.mythicforge.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as { data?: ModProject };
        const data = (parsed.data ?? parsed) as ModProject;
        if (!data?.meta?.modId) throw new Error("invalid");
        replace(data);
      } catch {
        alert("MythicForgeのJSONファイルを読み込めませんでした");
      }
    };
    reader.readAsText(file);
  };

  const jump = (file: string, line: number) => { setFocus({ file, line, n: Date.now() }); setTab("code"); };
  const props = { project, update, analysis, onJump: jump };
  const errors = analysis.errors;

  const tabs: { key: TabKey; label: string; icon: string; count?: number }[] = [
    { key: "meta", label: "Mod設定", icon: "⚙️" },
    { key: "skills", label: "スキル", icon: "🪄", count: project.skills.length },
    { key: "items", label: "アイテム", icon: "🗡️", count: project.items.length },
    { key: "blocks", label: "ブロック", icon: "🧱", count: project.blocks.length },
    { key: "mobs", label: "モブ", icon: "🧌", count: project.mobs.length + project.drops.length },
    { key: "recipes", label: "レシピ", icon: "📜", count: project.recipes.length },
    { key: "forge", label: "武器工房", icon: "⚒️", count: project.forge.styles.length },
    { key: "structures", label: "構造物/初期村", icon: "🏛️", count: project.structures?.length ?? 0 },
    { key: "extras", label: "拡張", icon: "🌟", count: project.effects.length + project.advancements.length + project.shops.length + project.skillPoints.length + project.materials.length },
    { key: "code", label: "Kotlinコード", icon: "📄", count: analysis.files.length },
    { key: "build", label: "ビルド・解析", icon: "🛠️" },
  ];
  const saveLabel = { saved: "✔ 保存済み", dirty: "● 未保存…", saving: "保存中…", error: "⚠ 保存失敗(再試行中)" }[save];

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-4 border-b border-[#262f3e] bg-[#10141b] px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-emerald-300">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500 text-black">⛏</span>MythicForge
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm font-semibold">{project.meta.name}</span>
        <span className="font-code text-xs text-slate-500">{project.meta.modId} · MC {resolveEnv(project.meta).minecraft} · {resolveEnv(project.meta).mappings === "mojmap" ? "Mojmap" : "Yarn"} · Kotlin</span>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={undo} disabled={!canUndo} title="元に戻す (Ctrl+Z)" className="rounded-md border border-[#2b3547] px-2.5 py-1.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-30">↶</button>
          <button onClick={redo} disabled={!canRedo} title="やり直す (Ctrl+Shift+Z)" className="rounded-md border border-[#2b3547] px-2.5 py-1.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-30">↷</button>
          <Link href="/docs" target="_blank" className="rounded-md border border-[#2b3547] px-2.5 py-1.5 text-sm text-slate-300 hover:bg-white/5" title="ドキュメント">?</Link>
          <span className={`text-xs ${save === "error" ? "text-red-300" : "text-slate-400"}`}>{saveLabel}</span>
          <button onClick={() => setTab("build")} className={`rounded-full px-3 py-1 text-xs font-semibold ${errors ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"}`}>
            {errors ? `✖ ${errors} エラー` : "✔ 解析OK"}{analysis.warnings ? ` · ⚠ ${analysis.warnings}` : ""}
          </button>
          <label className="cursor-pointer rounded-md border border-[#2b3547] px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5">
            ⬆ JSON読込
            <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
          </label>
          <Btn onClick={exportJson}>⬇ JSON保存</Btn>
          <Btn onClick={duplicate}>⧉ 複製</Btn>
          <Btn variant="primary" onClick={() => downloadZip(`${project.meta.modId}-${project.meta.version}-src`, analysis.files)}>⬇ ZIP出力</Btn>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav className="w-52 shrink-0 space-y-1 border-r border-[#262f3e] bg-[#10141b] p-3">
          {tabs.map((t) => (
            <button
              key={t.key} onClick={() => setTab(t.key)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${tab === t.key ? "bg-emerald-500/15 font-semibold text-emerald-200 ring-1 ring-emerald-500/30" : "text-slate-300 hover:bg-white/5"}`}
            >
              <span>{t.icon}</span>
              <span className="flex-1">{t.label}</span>
              {t.count !== undefined && <span className="text-xs text-slate-500">{t.count}</span>}
              {t.key === "build" && errors > 0 && <span className="rounded-full bg-red-500/30 px-1.5 text-[10px] text-red-200">{errors}</span>}
            </button>
          ))}
          <div className="mt-6 rounded-lg border border-[#262f3e] p-3 text-[11px] leading-relaxed text-slate-500">
            ブロックを組み合わせてスキルを作ると、裏で <span className="text-slate-300">Kotlin</span> コードが自動生成され、リアルタイムで静的解析されます。
          </div>
        </nav>
        <main className="grid-bg min-w-0 flex-1 overflow-auto p-4">
          <div className={tab === "skills" || tab === "items" || tab === "blocks" || tab === "mobs" || tab === "recipes" || tab === "forge" || tab === "structures" || tab === "extras" || tab === "code" ? "h-full" : ""}>
            {tab === "meta" && <MetaTab {...props} />}
            {tab === "skills" && <SkillsTab {...props} />}
            {tab === "items" && <ItemsTab {...props} />}
            {tab === "blocks" && <BlocksTab {...props} />}
            {tab === "mobs" && <MobsTab {...props} />}
            {tab === "recipes" && <RecipesTab {...props} />}
            {tab === "forge" && <ForgeTab {...props} />}
            {tab === "structures" && <StructuresTab {...props} />}
            {tab === "extras" && <ExtrasTab {...props} />}
            {tab === "code" && <CodeTab {...props} focus={focus} />}
            {tab === "build" && <BuildTab {...props} />}
          </div>
        </main>
      </div>
      <datalist id="item-datalist">
        {[...COMMON_VANILLA_ITEMS, ...project.items.map((i) => `${project.meta.modId}:${i.id}`), ...project.blocks.map((b) => `${project.meta.modId}:${b.id}`)].map((v) => <option key={v} value={v} />)}
      </datalist>
    </div>
  );
}
