"use client";

import { useState } from "react";
import type { StudioEngine } from "@/lib/studio/dispatch";

interface RunFile {
  path: string;
  base64: string;
}

interface RunResult {
  ok: boolean;
  text?: string;
  error?: string;
  files?: RunFile[];
  data?: unknown;
}

const download = (entry: RunFile) => {
  const bytes = Uint8Array.from(atob(entry.base64), (char) => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes]));
  const link = document.createElement("a");
  link.href = url;
  link.download = entry.path.split("/").pop() ?? entry.path;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Runs any registered engine command straight from the browser.
 *
 * This is the visible side of the unified engine registry (MERGE_PLAN): every
 * ported studio is reachable from one place, with the same command shape the
 * `mcasset` CLI uses.
 */
export default function EngineConsole({ engines }: { engines: StudioEngine[] }) {
  const [engineId, setEngineId] = useState(engines[0]?.id ?? "voxel");
  const [command, setCommand] = useState(engines[0]?.commands[0]?.id ?? "");
  const [argsText, setArgsText] = useState("{}");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const engine = engines.find((entry) => entry.id === engineId) ?? engines[0];

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(argsText) as Record<string, unknown>;
      } catch {
        setResult({ ok: false, error: "引数はJSONで指定してください (例: {\"kind\":\"sword\"})" });
        return;
      }
      const response = await fetch("/api/studio/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engine: engineId, command, args }),
      });
      setResult((await response.json()) as RunResult);
    } catch (error) {
      setResult({ ok: false, error: error instanceof Error ? error.message : "実行に失敗しました。" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">統一スタジオ / エンジンコンソール</h1>
        <p className="text-sm opacity-70">
          移植済みの全エンジンを API 経由で実行します。CLI の{" "}
          <code className="rounded bg-black/10 px-1">mcasset &lt;engine&gt;:&lt;command&gt;</code> と同じコマンド体系です。
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          エンジン
          <select
            className="rounded border bg-transparent px-2 py-1"
            value={engineId}
            onChange={(event) => {
              const next = event.target.value;
              setEngineId(next);
              const selected = engines.find((entry) => entry.id === next);
              setCommand(selected?.commands[0]?.id ?? "");
            }}
          >
            {engines.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.id} — {entry.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          コマンド
          <select
            className="rounded border bg-transparent px-2 py-1"
            value={command}
            onChange={(event) => setCommand(event.target.value)}
          >
            {(engine?.commands ?? []).map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.id} — {entry.summary}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          引数 (JSON)
          <input
            className="rounded border bg-transparent px-2 py-1 font-mono text-xs"
            value={argsText}
            onChange={(event) => setArgsText(event.target.value)}
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          onClick={run}
          disabled={busy}
        >
          {busy ? "実行中…" : "実行"}
        </button>
        {engine ? <span className="text-xs opacity-70">{engine.description}</span> : null}
      </div>

      {result ? (
        <section className="rounded border p-3 text-sm">
          {result.ok ? (
            <>
              {result.text ? <pre className="whitespace-pre-wrap">{result.text}</pre> : null}
              {result.files?.length ? (
                <ul className="mt-2 flex flex-col gap-1">
                  {result.files.map((entry) => (
                    <li key={entry.path} className="flex items-center gap-2">
                      <button className="rounded bg-black/10 px-2 py-0.5 text-xs" onClick={() => download(entry)}>
                        ダウンロード
                      </button>
                      <span className="font-mono text-xs">{entry.path}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <p className="text-red-600">{result.error}</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
