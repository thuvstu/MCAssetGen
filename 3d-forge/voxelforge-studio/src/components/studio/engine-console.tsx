"use client";

import { useMemo, useState } from "react";
import type { StudioCommand, StudioEngine, StudioGroup } from "@/lib/studio/engine-utils";

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

const GROUP_LABEL: Record<StudioGroup, string> = {
  "3d": "3Dモデル",
  weapon: "武器",
  armor: "アーマー",
  mob: "モブ",
  structure: "構造物",
  texture: "テクスチャ",
  skyblock: "SkyBlock",
  mod: "MOD",
};

const download = (entry: RunFile) => {
  const bytes = Uint8Array.from(atob(entry.base64), (char) => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes]));
  const link = document.createElement("a");
  link.href = url;
  link.download = entry.path.split("/").pop() ?? entry.path;
  link.click();
  URL.revokeObjectURL(url);
};

const isImage = (entry: RunFile) => /\.(png|gif|webp)$/i.test(entry.path);
const isZip = (entry: RunFile) => /\.(zip|mcaddon|jar)$/i.test(entry.path);

const sampleText = (command: StudioCommand | undefined) =>
  command?.sample ? JSON.stringify(command.sample, null, 2) : command?.args?.length ? JSON.stringify(Object.fromEntries(command.args.map((key) => [key, ""])), null, 2) : "{}";

/**
 * Runs any registered engine command straight from the browser.
 *
 * This is the visible side of the unified engine registry (MERGE_PLAN): every
 * ported studio is reachable from one place, with the same command shape the
 * `mcasset` CLI uses. Args are pre-filled from the registry samples so the
 * whole catalog can be exercised without memorising any flag.
 */
export default function EngineConsole({ engines }: { engines: StudioEngine[] }) {
  const [group, setGroup] = useState<StudioGroup | "all">("all");
  const [engineId, setEngineId] = useState(engines[0]?.id ?? "voxel");
  const [command, setCommand] = useState(engines[0]?.commands[0]?.id ?? "");
  // null = サンプル引数を表示中 / 文字列 = ユーザーが編集した内容
  const [argsOverride, setArgsOverride] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [showData, setShowData] = useState(false);

  const visibleEngines = useMemo(
    () => (group === "all" ? engines : engines.filter((entry) => entry.group === group)),
    [engines, group],
  );
  const engine = visibleEngines.find((entry) => entry.id === engineId) ?? visibleEngines[0];
  const selected = engine?.commands.find((entry) => entry.id === command) ?? engine?.commands[0];
  // 表示中の引数は「編集値 ?? サンプル」。選択変更時に編集値を捨てるので effect 不要。
  const argsText = argsOverride ?? sampleText(selected);

  const run = async () => {
    if (!engine || !selected) return;
    setBusy(true);
    setResult(null);
    try {
      let args: Record<string, unknown> = {};
      if (argsText.trim()) {
        try {
          args = JSON.parse(argsText) as Record<string, unknown>;
        } catch {
          setResult({ ok: false, error: '引数はJSONで指定してください (例: {"kind":"sword"})' });
          return;
        }
      }
      const response = await fetch("/api/studio/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engine: engine.id, command: selected.id, args }),
      });
      setResult((await response.json()) as RunResult);
    } catch (error) {
      setResult({ ok: false, error: error instanceof Error ? error.message : "実行に失敗しました。" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">統一スタジオ / エンジンコンソール</h1>
        <p className="text-sm opacity-70">
          移植済みの全エンジン ({engines.length}) を API 経由で実行します。引数はサンプルが入力済みなので、
          そのまま「実行」で結果を確認できます。CLI の{" "}
          <code className="rounded bg-black/10 px-1">mcasset &lt;engine&gt;:&lt;command&gt;</code> と同じコマンド体系です。
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          className={`rounded border px-2 py-1 text-xs ${group === "all" ? "bg-black/10 font-semibold" : ""}`}
          onClick={() => setGroup("all")}
        >
          すべて
        </button>
        {(Object.keys(GROUP_LABEL) as StudioGroup[]).map((id) => (
          <button
            key={id}
            className={`rounded border px-2 py-1 text-xs ${group === id ? "bg-black/10 font-semibold" : ""}`}
            onClick={() => setGroup(id)}
          >
            {GROUP_LABEL[id]} ({engines.filter((entry) => entry.group === id).length})
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          エンジン
          <select
            className="rounded border bg-transparent px-2 py-1"
            value={engine?.id ?? ""}
            onChange={(event) => {
              setEngineId(event.target.value);
              setArgsOverride(null);
            }}
          >
            {visibleEngines.map((entry) => (
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
            value={selected?.id ?? ""}
            onChange={(event) => {
              setCommand(event.target.value);
              setArgsOverride(null);
            }}
          >
            {(engine?.commands ?? []).map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.id} — {entry.summary}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        引数 (JSON){" "}
        <span className="text-xs opacity-60">
          {selected?.args?.length ? `主なキー: ${selected.args.join(", ")}` : "引数なし"}
        </span>
        <textarea
          className="h-32 w-full rounded border bg-transparent px-2 py-1 font-mono text-xs"
          value={argsText}
          onChange={(event) => setArgsOverride(event.target.value)}
          spellCheck={false}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          onClick={run}
          disabled={busy}
        >
          {busy ? "実行中…" : "実行"}
        </button>
        <button className="rounded border px-3 py-1.5 text-xs" onClick={() => setArgsOverride(null)}>
          サンプルに戻す
        </button>
        <button
          className="rounded border px-3 py-1.5 text-xs"
          onClick={() => navigator.clipboard?.writeText(`mcasset ${engine?.id}:${selected?.id}`)}
        >
          CLIコマンドをコピー
        </button>
        {engine ? <span className="text-xs opacity-70">{engine.description}</span> : null}
      </div>

      {result ? (
        <section className="rounded border p-3 text-sm">
          {result.ok ? (
            <>
              {result.text ? <pre className="max-h-80 overflow-auto whitespace-pre-wrap">{result.text}</pre> : null}
              {result.files?.length ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {result.files.map((entry) => (
                    <li key={entry.path} className="flex items-center gap-2">
                      <button className="rounded bg-black/10 px-2 py-0.5 text-xs" onClick={() => download(entry)}>
                        {isZip(entry) ? "ZIPを保存" : "ダウンロード"}
                      </button>
                      {isImage(entry) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={entry.path}
                          className="h-12 w-12 border bg-black/5 [image-rendering:pixelated]"
                          src={`data:image/png;base64,${entry.base64}`}
                        />
                      ) : null}
                      <span className="font-mono text-xs">{entry.path}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {result.data !== undefined ? (
                <div className="mt-3">
                  <button className="rounded border px-2 py-0.5 text-xs" onClick={() => setShowData((value) => !value)}>
                    {showData ? "data を隠す" : "data (JSON) を表示"}
                  </button>
                  {showData ? (
                    <pre className="mt-2 max-h-64 overflow-auto rounded bg-black/5 p-2 font-mono text-xs">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  ) : null}
                </div>
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
