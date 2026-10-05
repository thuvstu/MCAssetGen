"use client";

import { useEffect, useRef, useState } from "react";
import { downloadZip } from "@/lib/mod/exportZip";
import { checkCompleteness } from "@/lib/analyzer/pipeline";
import { resolveEnv } from "@/lib/mod/targets";
import { Btn, Card, DiagnosticRow, type TabProps } from "./ui";

const icon = { ok: "✔", warn: "⚠", error: "✖", skipped: "⏭" };
const color = {
  ok: "text-emerald-300 border-emerald-500/30",
  warn: "text-amber-300 border-amber-500/30",
  error: "text-red-300 border-red-500/30",
  skipped: "text-slate-400 border-slate-600/40",
};

export default function BuildTab({ project, analysis, update, onJump }: TabProps) {
  const [shown, setShown] = useState(analysis.stages.length);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [toolchain, setToolchain] = useState<string | null>(null);
  const [build, setBuild] = useState<{ state: "idle" | "running" | "done" | "failed" | "unavailable"; log?: string; message?: string; jar?: string; durationMs?: number }>({ state: "idle" });

  useEffect(() => {
    fetch("/api/compile")
      .then((r) => r.json())
      .then((d) => setToolchain(d.available ? `${d.javaHome} · Gradle` : null))
      .catch(() => setToolchain(null));
  }, []);

  const compile = async () => {
    setBuild({ state: "running", message: "Gradleでコンパイルしています… (初回は依存関係の取得で数分かかります)" });
    try {
      const r = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      });
      const d = await r.json();
      if (d.available === false || d.busy) setBuild({ state: "idle", message: d.error });
      else setBuild({ state: d.ok ? "done" : "failed", log: d.log, message: d.message, jar: d.jar, durationMs: d.durationMs });
    } catch (e) {
      setBuild({ state: "failed", message: `ビルドリクエストに失敗しました: ${String(e)}` });
    }
  };
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const run = () => {
    setShown(0);
    setRunning(true);
    let n = 0;
    timer.current = setInterval(() => {
      n++;
      setShown(n);
      if (n >= analysis.stages.length) {
        if (timer.current) clearInterval(timer.current);
        setRunning(false);
      }
    }, 320);
  };

  const fix = (d: { file: string; fix?: { kind: string; fqn: string } }) => {
    if (d.fix?.kind !== "addImport" || !d.file.endsWith("Skills.kt")) return;
    const line = `import ${d.fix.fqn}`;
    update((p) => {
      if (!p.customImports.split("\n").some((l) => l.trim() === line)) p.customImports = (p.customImports.trim() ? p.customImports.trimEnd() + "\n" : "") + line;
    });
  };
  const done = shown >= analysis.stages.length;
  const zipName = `${project.meta.modId}-${project.meta.version}-src`;
  const complete = checkCompleteness(project);
  const grade = complete.score >= 90 ? "S" : complete.score >= 75 ? "A" : complete.score >= 55 ? "B" : complete.score >= 35 ? "C" : "D";

  return (
    <div className="max-w-5xl space-y-4 pb-10">
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${!done ? "border-slate-600 bg-slate-800/30" : analysis.ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10"}`}>
        <div>
          <p className={`text-lg font-bold ${!done ? "text-slate-300" : analysis.ok ? "text-emerald-300" : "text-red-300"}`}>
            {!done ? "解析中…" : analysis.ok ? "✔ 静的チェック成功" : `✖ 静的チェック失敗 (${analysis.errors} エラー)`}
          </p>
          <p className="text-xs text-slate-400">{analysis.errors} エラー / {analysis.warnings} 警告 · {analysis.files.length} ファイル生成済み</p>
        </div>
        <div className="flex gap-2">
          <Btn onClick={run} disabled={running}>▶ チェックを再実行</Btn>
          <Btn variant="primary" onClick={() => downloadZip(zipName, analysis.files)}>⬇ Gradleプロジェクト(ZIP)</Btn>
        </div>
      </div>

      <Card title="📋 Mod完成度チェックリスト" right={<span className="text-xs text-slate-400">{complete.items.filter((i) => i.done).length} / {complete.items.length} 達成</span>}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-[#262f3e] bg-[#0c0f14]">
            <span className="text-center">
              <span className="block text-2xl font-extrabold text-emerald-300">{complete.score}%</span>
              <span className="block text-[10px] text-slate-500">ランク {grade}</span>
            </span>
          </div>
          <div className="grid min-w-[260px] flex-1 gap-1 sm:grid-cols-2">
            {complete.items.map((c) => (
              <div key={c.key} title={c.hint} className={`flex items-start gap-2 rounded-md px-2 py-1 text-xs ${c.done ? "text-slate-300" : "text-slate-500"}`}>
                <span className={c.done ? "text-emerald-400" : "text-slate-600"}>{c.done ? "✔" : "◻"}</span>
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">未達成の項目にカーソルを合わせると改善ヒントが表示されます。100%で「配布できるMod」と言えます。</p>
      </Card>

      <div className="space-y-2">
        {analysis.stages.slice(0, shown).map((s, i) => {
          const isOpen = open[s.key] ?? (s.status === "error" || s.status === "warn");
          const errs = s.diagnostics.filter((d) => d.severity === "error").length;
          return (
            <div key={s.key} className={`rounded-xl border bg-[#141922] ${color[s.status]}`}>
              <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen({ ...open, [s.key]: !isOpen })}>
                <span className="w-5 text-center text-lg">{icon[s.status]}</span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-100">{i + 1}. {s.name}</span>
                  <span className="block text-xs text-slate-500">{s.description}</span>
                </span>
                {s.diagnostics.length > 0 && <span className="text-xs">{errs > 0 ? `${errs} error` : ""} {s.diagnostics.length - errs > 0 ? `${s.diagnostics.length - errs} 件の指摘` : ""}</span>}
                <span className="text-[10px] text-slate-500">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (s.diagnostics.length > 0 || s.note) && (
                <div className="border-t border-[#262f3e] px-3 py-2">
                  {s.note && <p className="px-2 py-1 text-xs text-slate-400">{s.note}</p>}
                  {s.diagnostics.map((d, k) => <DiagnosticRow key={k} d={d} onJump={onJump} onFix={fix} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Card
        title="🚀 実コンパイル (kotlinc + Fabric Loom)"
        right={<span className="text-xs text-slate-500">{toolchain ? "ツールチェーン検出済み" : "ツールチェーン未検出"}</span>}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Btn variant="primary" onClick={compile} disabled={build.state === "running"}>
            {build.state === "running" ? "⏳ ビルド中… (1〜3分)" : "▶ 今すぐコンパイルして jar を作る"}
          </Btn>
          {build.durationMs ? <span className="text-xs text-slate-500">前回: {(build.durationMs / 1000).toFixed(1)}秒</span> : null}
          {build.jar && <span className="rounded-md bg-emerald-500/15 px-2 py-1 font-code text-xs text-emerald-300">{build.jar}</span>}
          {build.state === "done" && (
            <a href={`/api/compile/artifact?mod=${project.meta.modId}`} className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-black hover:bg-emerald-400">
              ⬇ Mod jar をダウンロード
            </a>
          )}
        </div>
        {build.message && (
          <p className={`mt-3 rounded-md p-3 text-sm ${build.state === "done" ? "bg-emerald-500/10 text-emerald-200" : build.state === "failed" ? "bg-red-500/10 text-red-200" : "bg-slate-700/30 text-slate-300"}`}>
            {build.message}
          </p>
        )}
        {build.log && (
          <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-[#0a0d12] p-3 font-code text-[11px] leading-4 text-slate-300">{build.log}</pre>
        )}
        <p className="mt-3 text-xs text-slate-500">
          生成したGradleプロジェクトを一時ディレクトリに展開し、JDK 21 + Fabric Loom で実際にコンパイルします。
          コンパイルが通れば <code className="font-code">build/libs</code> にMod jar が生成されます(実行環境にJDK/Gradleが必要です)。
        </p>
      </Card>

      <Card title="🧩 IntelliJ IDEA で開く (ZIPを展開してそのまま使えます)">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>ZIPを展開し、フォルダを <b>Open</b> (<code className="font-code">build.gradle.kts</code> を選んで「Open as Project」)。</li>
          <li><b>JDK 21</b> を用意: <code className="font-code">File → Project Structure → SDKs → ＋ → Download JDK…</code> で Temurin 21 など。</li>
          <li>
            <b>Gradle JVM を 21 に変更</b>:
            <code className="font-code"> Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JVM</code>
          </li>
          <li>Gradleタブの 🔄 (Reload All Gradle Projects)。初回はMinecraftの取得・変換に数分かかります。</li>
          <li>実行構成 <code className="font-code">Minecraft Client / Server</code> が自動生成されます。jar は <code className="font-code">gradlew build</code> で <code className="font-code">build/libs</code> に出力。</li>
        </ol>
        <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs text-slate-300">
          <p className="font-semibold text-red-300">こんなエラーが出たら</p>
          <p className="font-code mt-1 text-[11px] text-slate-400">Dependency requires at least JVM runtime version 21. This build uses a Java 8 JVM.</p>
          <p className="mt-1">→ 手順3の <b>Gradle JVM</b> が古いJDK(Java 8)のままです。21に変更して再読み込みしてください。
            ZIPには <b>Gradle Wrapper ({resolveEnv(project.meta).gradle})</b> と Loom ({resolveEnv(project.meta).loom}) の設定が含まれており、JDK 21未満で開いた場合は <code className="font-code">settings.gradle.kts</code> がこの手順を日本語で表示します。</p>
        </div>
      </Card>

      <Card title="手元・CIでコンパイルして jar を作るには">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>上のボタンで ZIP をダウンロードして展開します(<code className="font-code text-emerald-300">build.gradle.kts</code>、Kotlinソース、リソース一式が入っています)。</li>
          <li>
            <b>GitHub Actions</b>: フォルダをリポジトリに push するだけで <code className="font-code">.github/workflows/build.yml</code> が
            JDK 21 + Gradle で <code className="font-code">gradle build</code> を実行し、jar が Artifacts に出力されます。
          </li>
          <li>
            <b>ローカル</b>: JDK 21 と Gradle があれば <code className="font-code">gradle wrapper --gradle-version 8.10.2 &amp;&amp; ./gradlew build</code> → <code className="font-code">build/libs/*.jar</code>
          </li>
          <li>Fabric Loader 0.16.5+ / Fabric API / Fabric Language Kotlin と一緒に <code className="font-code">mods/</code> へ入れて起動。</li>
        </ol>
        <p className="mt-3 rounded-md bg-amber-500/10 p-3 text-xs text-amber-200">
          ※ 静的解析は「字句解析・括弧対応・import実在確認・未解決参照・旧API/Yarn名の混入検出・引数数チェック・参照整合性」までを即時実行します。
          型の厳密な検査やLoomのリマップは上記の実コンパイルで完了します(生成コードは選択中プロファイルの Loom / Gradle と JDK 21 でコンパイル検証済み)。
        </p>
      </Card>
    </div>
  );
}
