"use client";

import { useEffect, useState } from "react";
import { downloadZip } from "@/lib/mod/zip";
import type { Diagnostic, GeneratedFile, ModProject } from "@/lib/mod/types";
import { SectionHeader } from "./ui";

interface Toolchain {
  available: boolean;
  java: string | null;
  javaVersion: string | null;
  gradle: string | null;
  enabled: boolean;
}

export default function BuildPanel({ project, files, diags }: { project: ModProject; files: GeneratedFile[]; diags: Diagnostic[] }) {
  const [tc, setTc] = useState<Toolchain | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string>("");
  const [result, setResult] = useState<{ ok: boolean; jars?: string[]; seconds?: number } | null>(null);
  const errors = diags.filter((d) => d.severity === "error").length;
  const warnings = diags.filter((d) => d.severity === "warning").length;

  useEffect(() => {
    fetch("/api/compile")
      .then((r) => r.json())
      .then(setTc)
      .catch(() => setTc(null));
  }, []);

  const compile = async () => {
    setBusy(true);
    setLog("Gradle ビルドを実行中...（初回は Minecraft のダウンロードで数分かかります）");
    setResult(null);
    try {
      const r = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: files.map((f) => ({ path: f.path, content: f.content })) }),
      });
      const j = await r.json();
      setLog(j.log ?? "");
      setResult({ ok: !!j.ok, jars: j.jars, seconds: j.seconds });
    } catch (e) {
      setLog(String(e));
    } finally {
      setBusy(false);
    }
  };

  const kt = files.filter((f) => f.language === "kotlin");
  const lines = kt.reduce((a, f) => a + f.content.split("\n").length, 0);

  return (
    <div>
      <SectionHeader title="ビルド / エクスポート" desc="Gradle (Kotlin DSL) プロジェクトとして出力し、そのまま ./gradlew build で JAR を作成できます。" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 font-semibold">① ソース ZIP をダウンロード</h3>
          <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-md bg-black/30 p-2">
              <div className="text-lg font-bold">{files.length}</div>
              <div className="text-[11px] text-zinc-500">ファイル</div>
            </div>
            <div className="rounded-md bg-black/30 p-2">
              <div className="text-lg font-bold">{kt.length}</div>
              <div className="text-[11px] text-zinc-500">Kotlin</div>
            </div>
            <div className="rounded-md bg-black/30 p-2">
              <div className="text-lg font-bold">{lines}</div>
              <div className="text-[11px] text-zinc-500">行</div>
            </div>
          </div>
          {errors > 0 ? (
            <div className="mb-3 rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">⛔ エラーが {errors} 件あります。ビルドは失敗する可能性が高いです（「解析」タブを確認）。</div>
          ) : (
            <div className="mb-3 rounded-md border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-300">
              ✔ 静的解析エラーなし{warnings ? `（警告 ${warnings} 件）` : ""}
            </div>
          )}
          <button className="btn-primary w-full justify-center py-2" onClick={() => downloadZip(project, files)}>
            📦 {project.meta.modId}-{project.meta.version}-src.zip をダウンロード
          </button>
          <p className="mt-2 text-[11px] text-zinc-500">
            仮テクスチャ（16x16 PNG）を自動生成して同梱します。生成テンプレートは全メカニック/ターゲッター/条件/トリガーを含むプロジェクトで JDK 21 + Gradle 8.14.3 + Loom 1.11.8 による実コンパイル (BUILD SUCCESSFUL) を確認済みです。
          </p>
          <div className="mt-4 rounded-md bg-black/40 p-3 text-xs leading-6">
            <div className="mb-1 font-semibold text-zinc-300">ローカルでビルド</div>
            <pre className="mono whitespace-pre-wrap text-emerald-300">{`# JDK 21 + Gradle ${project.meta.gradleVersion}
cd ${project.meta.modId}
gradle wrapper --gradle-version ${project.meta.gradleVersion}
./gradlew build        # → build/libs/${project.meta.modId}-${project.meta.version}.jar
./gradlew runClient    # 開発用クライアントで動作確認`}</pre>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-2 font-semibold">② GitHub Actions でクラウドビルド</h3>
            <p className="text-sm text-zinc-400">
              ZIP に <code className="mono text-emerald-300">.github/workflows/build.yml</code> が含まれています。GitHub リポジトリに push すると自動でコンパイルされ、JAR が Artifacts
              として取得できます（ローカルに JDK 不要）。
            </p>
          </div>
          <div className="card p-5">
            <h3 className="mb-2 font-semibold">③ サーバー上でコンパイル</h3>
            {tc === null ? (
              <div className="text-sm text-zinc-500">ツールチェーン確認中...</div>
            ) : (
              <div className="mb-3 space-y-1 text-xs">
                <div>
                  Java: {tc.java ? <span className="text-emerald-400">{tc.javaVersion ?? tc.java}</span> : <span className="text-red-400">見つかりません</span>}
                </div>
                <div>Gradle: {tc.gradle ? <span className="text-emerald-400">{tc.gradle}</span> : <span className="text-red-400">見つかりません</span>}</div>
                <div>ENABLE_SERVER_COMPILE: {tc.enabled ? <span className="text-emerald-400">有効</span> : <span className="text-zinc-500">未設定</span>}</div>
              </div>
            )}
            <p className="mb-3 text-xs text-zinc-500">
              JDK 21 と Gradle がインストールされたサーバーで環境変数 ENABLE_SERVER_COMPILE=1 を設定すると、実際の Kotlin コンパイラ (Gradle + Loom) でビルドしてエラーログを表示できます。
            </p>
            <button className="btn w-full justify-center" disabled={busy || !tc?.available} onClick={compile}>
              {busy ? "ビルド中..." : tc?.available ? "🔨 サーバーでビルド" : "🔒 この環境では利用不可"}
            </button>
            {result && (
              <div className={`mt-3 text-sm ${result.ok ? "text-emerald-400" : "text-red-400"}`}>
                {result.ok ? `✔ BUILD SUCCESSFUL (${result.seconds}s) ${result.jars?.join(", ") ?? ""}` : "✖ BUILD FAILED"}
              </div>
            )}
            {log && <pre className="mono mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-black/50 p-2 text-[11px] text-zinc-300">{log}</pre>}
          </div>
        </div>
      </div>
    </div>
  );
}
