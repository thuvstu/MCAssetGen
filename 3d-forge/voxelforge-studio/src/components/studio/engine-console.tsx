"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  asset?: { id: string; name: string; files: string[] };
}

interface AssetSummary {
  id: string;
  name: string;
  studio: string;
  kind: string;
  files: string[];
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
 * アセットバス連携:
 *   - 出力を名前をつけて保存 → 別スタジオが `--asset <名前>` で取り込める
 *   - 保存済みアセットを入力として受け取る (`?asset=` で外部からも指定可)
 */
export default function EngineConsole({ engines }: { engines: StudioEngine[] }) {
  const searchParams = useSearchParams();
  // ?engine=tex&command=render&asset=名前 で事前選択 (スタジオGUIからの導線)
  const wantedEngine = searchParams.get("engine") ?? "";
  const wantedCommand = searchParams.get("command") ?? "";
  const initialEngine =
    engines.find((entry) => entry.id === wantedEngine) ?? engines[0];
  const initialCommand =
    initialEngine?.commands.find((entry) => entry.id === wantedCommand) ?? initialEngine?.commands[0];
  const [group, setGroup] = useState<StudioGroup | "all">("all");
  const [engineId, setEngineId] = useState(initialEngine?.id ?? "voxel");
  const [command, setCommand] = useState(initialCommand?.id ?? "");
  const [argsOverride, setArgsOverride] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [showData, setShowData] = useState(false);
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [assetIn, setAssetIn] = useState(searchParams.get("asset") ?? "");
  const [saveName, setSaveName] = useState("");

  const refreshAssets = () =>
    fetch("/api/assets")
      .then((response) => response.json())
      .then((body: { assets?: AssetSummary[] }) => setAssets(body.assets ?? []))
      .catch(() => setAssets([]));

  useEffect(() => {
    void refreshAssets();
  }, []);

  const visibleEngines = useMemo(
    () => (group === "all" ? engines : engines.filter((entry) => entry.group === group)),
    [engines, group],
  );
  const engine = visibleEngines.find((entry) => entry.id === engineId) ?? visibleEngines[0];
  const selected = engine?.commands.find((entry) => entry.id === command) ?? engine?.commands[0];
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
        body: JSON.stringify({
          engine: engine.id,
          command: selected.id,
          args,
          ...(assetIn ? { asset: assetIn } : {}),
          ...(saveName.trim() ? { save: saveName.trim() } : {}),
        }),
      });
      setResult((await response.json()) as RunResult);
      if (saveName.trim()) void refreshAssets();
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
          全エンジン ({engines.length}) を API 経由で実行します。引数はサンプルが入力済み。
          <a className="underline" href="/assets">
            アセットバス
          </a>
          に保存すれば、別スタジオの入力として取り回せます。
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

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          アセットから入力 (別スタジオの出力)
          <select
            className="rounded border bg-transparent px-2 py-1"
            value={assetIn}
            onChange={(event) => setAssetIn(event.target.value)}
          >
            <option value="">使わない</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.name}>
                {asset.name} ({asset.studio}:{asset.kind}, {asset.files.length}件)
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          アセットバスへ保存 (空なら保存しない)
          <input
            className="rounded border bg-transparent px-2 py-1"
            placeholder="例: grass_texture"
            value={saveName}
            onChange={(event) => setSaveName(event.target.value)}
          />
        </label>
      </div>

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
          onClick={() =>
            navigator.clipboard?.writeText(
              `mcasset ${engine?.id}:${selected?.id}${assetIn ? ` --asset ${assetIn}` : ""}${saveName.trim() ? ` --save ${saveName.trim()}` : ""}`,
            )
          }
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
              {result.asset ? (
                <p className="mt-2 text-xs">
                  保存しました:{" "}
                  <a className="underline" href="/assets">
                    {result.asset.name}
                  </a>{" "}
                  — 別スタジオでは <code className="rounded bg-black/10 px-1">--asset {result.asset.name}</code> で取り込めます
                </p>
              ) : null}
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
