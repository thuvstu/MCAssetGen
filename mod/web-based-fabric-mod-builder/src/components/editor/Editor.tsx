"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { analyzeKotlinFiles } from "@/lib/mod/analyzer";
import { CONDITIONS, MECHANICS, TARGETERS } from "@/lib/mod/catalog";
import { generateProject } from "@/lib/mod/codegen";
import { defaultMeta } from "@/lib/mod/defaults";
import { validateProject } from "@/lib/mod/validate";
import { downloadZip } from "@/lib/mod/zip";
import type { Diagnostic, ModProject } from "@/lib/mod/types";
import BuildPanel from "./BuildPanel";
import CodeView from "./CodeView";
import DiagnosticsPanel from "./Diagnostics";
import { BlocksEditor, CommandsEditor, EventsEditor, ItemsEditor, MetaEditor, MobSkillsEditor } from "./ElementEditors";
import SkillEditor from "./SkillEditor";
import ImportExport from "./ImportExport";
import ServerLink from "./ServerLink";
import { MobsEditor, RecipesEditor } from "./MobRecipeEditors";
import { MobNamesContext, SectionHeader } from "./ui";

type Section = "meta" | "items" | "blocks" | "skills" | "mobs" | "custommobs" | "recipes" | "events" | "commands" | "code" | "analysis" | "build" | "reference" | "io" | "link";

function normalize(data: Partial<ModProject> | null, name: string): ModProject {
  const d = data ?? {};
  return {
    meta: { ...defaultMeta(name), ...(d.meta ?? {}) },
    items: d.items ?? [],
    blocks: d.blocks ?? [],
    skills: (d.skills ?? []).map((s) => ({ ...s, imports: s.imports ?? "", conditions: s.conditions ?? [] })),
    mobSkills: d.mobSkills ?? [],
    events: d.events ?? [],
    commands: d.commands ?? [],
    mobs: d.mobs ?? [],
    recipes: d.recipes ?? [],
  };
}

function Reference() {
  return (
    <div>
      <SectionHeader title="スキルリファレンス" desc="テキストモードでは MythicMobs と同様の構文が使えます: - mechanic{k=v;k=v} @Targeter{k=v} ?condition{k=v} ?!negated" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-3">
          <h3 className="mb-2 font-semibold text-emerald-300">メカニック ({MECHANICS.length})</h3>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {MECHANICS.map((m) => (
              <div key={m.id} className="rounded-md bg-black/30 p-2 text-xs">
                <div className="mono text-emerald-300">
                  {m.id}
                  {m.params.length > 0 && <span className="text-zinc-500">{"{"}{m.params.map((p) => `${p.key}=${String(p.default).slice(0, 12)}`).join(";")}{"}"}</span>}
                </div>
                <div className="text-zinc-400">
                  {m.label} — {m.description}
                  {m.aliases.length > 0 && <span className="text-zinc-600"> (別名: {m.aliases.join(", ")})</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="mb-2 font-semibold text-sky-300">ターゲッター ({TARGETERS.length})</h3>
          {TARGETERS.map((t) => (
            <div key={t.id} className="mb-2 text-xs">
              <div className="mono text-sky-300">
                @{t.id}
                {t.params.length > 0 && <span className="text-zinc-500">{"{"}{t.params.map((p) => `${p.key}=${p.default}`).join(";")}{"}"}</span>}
              </div>
              <div className="text-zinc-400">{t.description}{!t.returnsEntities && " (位置)"}</div>
            </div>
          ))}
        </div>
        <div className="card p-4">
          <h3 className="mb-2 font-semibold text-amber-300">条件 ({CONDITIONS.length})</h3>
          {CONDITIONS.map((c) => (
            <div key={c.id} className="mb-2 text-xs">
              <div className="mono text-amber-300">
                ?{c.id}
                {c.params.length > 0 && <span className="text-zinc-500">{"{"}{c.params.map((p) => `${p.key}=${p.default}`).join(";")}{"}"}</span>}
              </div>
              <div className="text-zinc-400">{c.description}</div>
            </div>
          ))}
        </div>
        <div className="card p-4 text-xs leading-6 text-zinc-400">
          <h3 className="mb-2 font-semibold text-zinc-200">実行モデル</h3>
          <p>トリガー発火 → SkillContext(caster, target, world, origin) を作成 → スキル条件をキャスターで判定 → 各行ごとにターゲッターで対象列挙 → ターゲット条件で絞り込み → メカニック実行。</p>
          <p className="mt-2">delay 行以降は SkillScheduler で指定 tick 後に実行。クールダウンはキャスター UUID ごと。</p>
          <p className="mt-2">プレースホルダ: &lt;caster.name&gt; &lt;target.name&gt; &lt;caster.hp&gt;</p>
          <p className="mt-2">カスタムKotlin行では ctx / t / e が利用可能。追加 import はスキルの JSON に imports として保持されます。</p>
        </div>
      </div>
    </div>
  );
}

export default function Editor({ id }: { id: number }) {
  const [project, setProject] = useState<ModProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>("skills");
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving" | "error">("saved");
  const [focus, setFocus] = useState<{ file: string; line?: number } | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    fetch(`/api/projects/${id}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "プロジェクトが見つかりません" : await r.text());
        return r.json();
      })
      .then((j) => {
        setProject(normalize(j.data, j.name));
        loaded.current = true;
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, [id]);

  const past = useRef<ModProject[]>([]);
  const future = useRef<ModProject[]>([]);
  const lastPush = useRef(0);
  const [, force] = useState(0);

  const mutate = useCallback((fn: (d: ModProject) => void) => {
    setProject((p) => {
      if (!p) return p;
      const now = Date.now();
      // 連続入力(600ms以内)は1つの履歴にまとめる
      if (now - lastPush.current > 600) {
        past.current.push(p);
        if (past.current.length > 100) past.current.shift();
      }
      lastPush.current = now;
      future.current = [];
      const d = structuredClone(p);
      fn(d);
      return d;
    });
    setSaveState("dirty");
  }, []);

  const replace = useCallback((next: ModProject) => {
    setProject((p) => {
      if (p) past.current.push(p);
      future.current = [];
      return normalize(next, next.meta?.name ?? "Imported");
    });
    setSaveState("dirty");
  }, []);

  const undo = useCallback(() => {
    setProject((p) => {
      const prev = past.current.pop();
      if (!prev || !p) return p;
      future.current.push(p);
      lastPush.current = 0;
      return prev;
    });
    setSaveState("dirty");
    force((x) => x + 1);
  }, []);
  const redo = useCallback(() => {
    setProject((p) => {
      const next = future.current.pop();
      if (!next || !p) return p;
      past.current.push(p);
      lastPush.current = 0;
      return next;
    });
    setSaveState("dirty");
    force((x) => x + 1);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA") return; // テキストエリア内はネイティブの undo を優先
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // autosave
  useEffect(() => {
    if (!project || saveState !== "dirty") return;
    const t = setTimeout(async () => {
      setSaveState("saving");
      try {
        const r = await fetch(`/api/projects/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: project }) });
        setSaveState(r.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [project, saveState, id]);

  const deferred = useDeferredValue(project);
  const analysis = useMemo(() => {
    if (!deferred) return { files: [], diags: [] as Diagnostic[], stats: { files: 0, lines: 0, ms: 0 } };
    const t0 = performance.now();
    const files = generateProject(deferred);
    const model = validateProject(deferred);
    let kotlin: Diagnostic[] = [];
    try {
      kotlin = analyzeKotlinFiles(files, deferred.meta.packageName);
    } catch (e) {
      kotlin = [{ severity: "error", source: "kotlin", message: `解析器エラー: ${String(e)}` }];
    }
    const order = { error: 0, warning: 1, info: 2 };
    const diags = [...model, ...kotlin].sort((a, b) => order[a.severity] - order[b.severity]);
    const kt = files.filter((f) => f.language === "kotlin");
    return { files, diags, stats: { files: kt.length, lines: kt.reduce((a, f) => a + f.content.split("\n").length, 0), ms: performance.now() - t0 } };
  }, [deferred]);

  if (error)
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="card p-8 text-center">
          <div className="mb-4 text-red-300">{error}</div>
          <Link href="/" className="btn">
            ← 戻る
          </Link>
        </div>
      </div>
    );
  if (!project) return <div className="grid min-h-screen place-items-center text-zinc-500">読み込み中...</div>;

  const errs = analysis.diags.filter((d) => d.severity === "error").length;
  const warns = analysis.diags.filter((d) => d.severity === "warning").length;

  const nav: { id: Section; label: string; icon: string; badge?: number | string; group: string }[] = [
    { id: "meta", label: "Mod設定", icon: "⚙️", group: "プロジェクト" },
    { id: "skills", label: "スキル", icon: "✨", badge: project.skills.length, group: "スキルシステム" },
    { id: "custommobs", label: "カスタムモブ", icon: "👹", badge: project.mobs.length, group: "スキルシステム" },
    { id: "mobs", label: "バニラモブスキル", icon: "🧟", badge: project.mobSkills.length, group: "スキルシステム" },
    { id: "events", label: "イベント", icon: "📡", badge: project.events.length, group: "スキルシステム" },
    { id: "commands", label: "コマンド", icon: "⌨️", badge: project.commands.length, group: "スキルシステム" },
    { id: "items", label: "アイテム", icon: "🗡️", badge: project.items.length, group: "要素" },
    { id: "blocks", label: "ブロック", icon: "🧱", badge: project.blocks.length, group: "要素" },
    { id: "recipes", label: "レシピ", icon: "🛠️", badge: project.recipes.length, group: "要素" },
    { id: "code", label: "コード", icon: "📝", badge: analysis.files.length, group: "出力" },
    { id: "analysis", label: "解析", icon: "🔍", badge: errs ? `${errs}` : warns ? `${warns}` : "✓", group: "出力" },
    { id: "build", label: "ビルド", icon: "📦", group: "出力" },
    { id: "io", label: "インポート/エクスポート", icon: "🔄", group: "出力" },
    { id: "link", label: "サーバー連携", icon: "🔗", group: "出力" },
    { id: "reference", label: "リファレンス", icon: "📖", group: "ヘルプ" },
  ];
  const groups = [...new Set(nav.map((n) => n.group))];

  const openDiag = (d: Diagnostic) => {
    if (!d.file) return;
    setFocus({ file: d.file, line: d.line });
    setSection("code");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 py-2.5 backdrop-blur">
        <Link href="/" className="text-sm font-bold">
          <span className="text-emerald-400">Mythic</span>Craft
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="font-semibold">{project.meta.name}</span>
        <span className="mono rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-400">
          {project.meta.modId} · MC {project.meta.minecraftVersion}
        </span>
        <span className={`text-xs ${saveState === "error" ? "text-red-400" : saveState === "saved" ? "text-zinc-500" : "text-amber-400"}`}>
          {saveState === "saved" ? "✓ 保存済み" : saveState === "saving" ? "保存中..." : saveState === "dirty" ? "● 未保存" : "保存失敗"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button className="btn !px-2 !py-1 text-xs" title="元に戻す (Ctrl+Z)" disabled={past.current.length === 0} onClick={undo}>
            ↶
          </button>
          <button className="btn !px-2 !py-1 text-xs" title="やり直す (Ctrl+Shift+Z)" disabled={future.current.length === 0} onClick={redo}>
            ↷
          </button>
          <button onClick={() => setSection("analysis")} className={`rounded-md px-2 py-1 text-xs ${errs ? "bg-red-950 text-red-300" : warns ? "bg-amber-950 text-amber-300" : "bg-emerald-950 text-emerald-300"}`}>
            {errs ? `⛔ ${errs} エラー` : warns ? `⚠ ${warns} 警告` : "✔ 解析OK"}
          </button>
          <button className="btn-primary" onClick={() => downloadZip(project, analysis.files)}>
            📦 ZIP出力
          </button>
        </div>
      </header>
      <div className="flex flex-1">
        <nav className="sticky top-[49px] h-[calc(100vh-49px)] w-52 shrink-0 overflow-y-auto border-r border-zinc-800 p-3">
          {groups.map((g) => (
            <div key={g} className="mb-4">
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{g}</div>
              {nav
                .filter((n) => n.group === g)
                .map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSection(n.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition ${section === n.id ? "bg-emerald-900/50 text-emerald-200" : "text-zinc-300 hover:bg-zinc-800"}`}
                  >
                    <span>{n.icon}</span>
                    <span>{n.label}</span>
                    {n.badge !== undefined && (
                      <span
                        className={`ml-auto rounded px-1.5 text-[10px] ${n.id === "analysis" && errs ? "bg-red-900 text-red-200" : n.id === "analysis" && warns ? "bg-amber-900 text-amber-200" : "bg-zinc-800 text-zinc-400"}`}
                      >
                        {n.badge}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          ))}
        </nav>
        <MobNamesContext.Provider value={project.mobs.map((m) => m.name)}>
        <main className="min-w-0 flex-1 p-6">
          {section === "custommobs" && <MobsEditor project={project} mutate={mutate} />}
          {section === "recipes" && <RecipesEditor project={project} mutate={mutate} />}
          {section === "io" && <ImportExport project={project} mutate={mutate} replace={replace} />}
          {section === "link" && <ServerLink project={project} mutate={mutate} replace={replace} />}
          {section === "meta" && <MetaEditor project={project} mutate={mutate} />}
          {section === "items" && <ItemsEditor project={project} mutate={mutate} />}
          {section === "blocks" && <BlocksEditor project={project} mutate={mutate} />}
          {section === "skills" && <SkillEditor project={project} mutate={mutate} diags={analysis.diags} />}
          {section === "mobs" && <MobSkillsEditor project={project} mutate={mutate} />}
          {section === "events" && <EventsEditor project={project} mutate={mutate} />}
          {section === "commands" && <CommandsEditor project={project} mutate={mutate} />}
          {section === "code" && <CodeView files={analysis.files} diags={analysis.diags} focus={focus} onFocus={setFocus} />}
          {section === "analysis" && <DiagnosticsPanel diags={analysis.diags} onOpen={openDiag} stats={analysis.stats} />}
          {section === "build" && <BuildPanel project={project} files={analysis.files} diags={analysis.diags} />}
          {section === "reference" && <Reference />}
        </main>
        </MobNamesContext.Provider>
      </div>
    </div>
  );
}
