"use client";

import { useEffect, useState } from "react";
import { exportMobsYaml, exportSkillsYaml, importMythicYaml } from "@/lib/mod/mythicYaml";
import type { GeneratedFile, ModProject } from "@/lib/mod/types";
import { SectionHeader } from "./ui";
import {
  LINK_ROOTS,
  clearRootHandle,
  listRoot,
  loadRootHandle,
  pickRoot,
  readTextFile,
  writeBinaryFile,
  writeFileTree,
  writeTextFile,
  type FSDirHandle,
  type TreeEntry,
} from "@/lib/link/serverfs";

type Mutate = (fn: (d: ModProject) => void) => void;

interface BbInfo {
  elements: number;
  textures: number;
  resolution: string;
  error?: string;
}

export default function ServerLink({ project, mutate, files }: { project: ModProject; mutate: Mutate; replace: (p: ModProject) => void; files: GeneratedFile[] }) {
  const [root, setRoot] = useState<FSDirHandle | null>(null);
  const [rootName, setRootName] = useState("");
  const [trees, setTrees] = useState<Record<string, { entries: TreeEntry[]; missing: boolean }>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [opened, setOpened] = useState<{ path: string; text: string } | null>(null);
  const [preview, setPreview] = useState("");
  const [bb, setBb] = useState<BbInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    loadRootHandle().then((h) => {
      if (h) { setRoot(h); setRootName(h.name); }
    }).catch(() => undefined);
  }, []);

  const refresh = async (handle: FSDirHandle) => {
    setBusy(true);
    setError("");
    try {
      const next: Record<string, { entries: TreeEntry[]; missing: boolean }> = {};
      for (const rel of LINK_ROOTS) next[rel] = await listRoot(handle, rel);
      setTrees(next);
      try {
        const raw = await readTextFile(handle, "model.bbmodel");
        const data = JSON.parse(raw) as { resolution?: { width?: number; height?: number }; elements?: unknown[]; textures?: unknown[] };
        setBb({
          elements: data.elements?.length ?? 0,
          textures: data.textures?.length ?? 0,
          resolution: `${data.resolution?.width ?? "?"}x${data.resolution?.height ?? "?"}`,
        });
      } catch {
        setBb({ elements: 0, textures: 0, resolution: "-", error: "model.bbmodel が見つからないか読み込めません" });
      }
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  const connect = async () => {
    setError("");
    try {
      const handle = await pickRoot();
      setRoot(handle);
      setRootName(handle.name);
      await refresh(handle);
      setNotice("minecraftフォルダを接続しました。権限はこのブラウザに保存されます。");
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  };

  const disconnect = async () => {
    await clearRootHandle();
    setRoot(null);
    setTrees({});
    setOpened(null);
    setBb(null);
    setNotice("接続を解除しました。");
  };

  const openFile = async (entry: TreeEntry) => {
    if (!root || !entry.name.endsWith(".yml")) return;
    try {
      const text = await readTextFile(root, entry.path);
      setOpened({ path: entry.path, text });
      const parsed = importMythicYaml(text);
      setPreview(`スキル ${parsed.skills.length} 件 (${parsed.skills.map((s) => s.name).join(", ") || "なし"}) / モブ ${parsed.mobs.length} 件 (${parsed.mobs.map((m) => m.name).join(", ") || "なし"})`);
    } catch (e) {
      setError(`読み込み失敗: ${entry.path} — ${String(e instanceof Error ? e.message : e)}`);
    }
  };

  const applyOpened = () => {
    if (!opened) return;
    const parsed = importMythicYaml(opened.text);
    mutate((d) => {
      for (const s of parsed.skills) {
        const i = d.skills.findIndex((x) => x.name === s.name);
        if (i >= 0) d.skills[i] = s; else d.skills.push(s);
      }
      for (const m of parsed.mobs) {
        const i = d.mobs.findIndex((x) => x.name === m.name);
        if (i >= 0) d.mobs[i] = m; else d.mobs.push(m);
      }
    });
    setNotice(`${opened.path} を取り込みました（同名は上書き）。`);
  };

  const saveBack = async (kind: "skills" | "mobs", targetPath: string) => {
    if (!root) return;
    setBusy(true);
    try {
      const content = kind === "skills" ? exportSkillsYaml(project) : exportMobsYaml(project);
      await writeTextFile(root, targetPath, content);
      await refresh(root);
      setNotice(`${targetPath} に書き出しました。サーバー側で /mm reload が必要です。`);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  const deployPack = async (kind: "skills" | "mobs") => {
    if (!root) return;
    const base = "paperserver-121/plugins/MythicMobs";
    await saveBack(kind, `${base}/${kind}/${kind}.yml`);
  };

  const deployModSources = async () => {
    if (!root || !files.length) return;
    setBusy(true);
    setProgress("");
    try {
      const modId = (project.meta.modId || "mymod").toLowerCase().replace(/[^a-z0-9_.-]+/g, "_");
      await writeFileTree(root, `moddev/${modId}`, files, (done, total) => setProgress(`${done}/${total}`));
      await refresh(root);
      setProgress("");
      setNotice(`moddev/${modId}/ に ${files.length} ファイルを展開しました。IntelliJ で開けます。`);
    } catch (e) {
      setProgress("");
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  const downloadBbmodel = async () => {
    if (!root) return;
    try {
      const raw = await readTextFile(root, "model.bbmodel");
      const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "model.bbmodel";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setNotice("model.bbmodel をダウンロードしました。VoxelForge の取込から開けます。");
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  };

  return (
    <div>
      <SectionHeader title="サーバー連携" desc="ローカルの minecraft フォルダと接続し、MythicMobs の YAML を直接読み書き・配布します。" />
      {error && <div className="mb-3 rounded bg-red-950/50 p-2 text-sm text-red-300">⚠ {error}</div>}
      {notice && <div className="mb-3 rounded bg-emerald-950/50 p-2 text-sm text-emerald-300">✔ {notice}</div>}
      <div className="card mb-4 p-4">
        <h3 className="mb-2 font-semibold">接続</h3>
        {root ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>📁 <span className="mono">{rootName}</span> に接続中</span>
            <button className="btn" disabled={busy} onClick={() => refresh(root)}>🔄 再読込</button>
            <button className="btn" onClick={disconnect}>切断</button>
          </div>
        ) : (
          <div className="text-sm">
            <p className="mb-2 text-zinc-400">`C:\Users\gogok\Documents\minecraft` を選択してください（Chrome / Edge 推奨）。初回のみ権限確認が出ます。</p>
            <button className="btn-primary" onClick={connect}>📁 minecraftフォルダを選択</button>
          </div>
        )}
      </div>
      {root && (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="card p-4">
            <h3 className="mb-2 font-semibold">MythicMobs ツリー</h3>
            {LINK_ROOTS.map((rel) => {
              const tree = trees[rel];
              return (
                <div key={rel} className="mb-3">
                  <div className="mono mb-1 text-xs text-zinc-400">{rel}{tree?.missing ? "（なし）" : ""}</div>
                  {!tree ? <div className="text-xs text-zinc-600">読込中…</div> :
                    tree.missing ? <div className="text-xs text-zinc-600">フォルダがありません</div> :
                    tree.entries.length === 0 ? <div className="text-xs text-zinc-600">空です</div> : (
                    <ul className="space-y-1 text-sm">
                      {tree.entries.map((entry) => (
                        <li key={entry.path}>
                          <button
                            className="text-left text-zinc-200 hover:text-emerald-300 disabled:text-zinc-600"
                            disabled={!entry.name.endsWith(".yml")}
                            onClick={() => openFile(entry)}
                            title={entry.name.endsWith(".yml") ? "開いて取り込む" : "YAML のみ開けます"}
                          >
                            📄 {entry.name} <span className="text-xs text-zinc-500">{((entry.size ?? 0) / 1024).toFixed(1)}KB</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
            {opened && (
              <div className="mt-3 rounded bg-black/50 p-2">
                <div className="mono mb-1 text-xs text-zinc-400">{opened.path}</div>
                <div className="mb-2 text-xs text-emerald-300">{preview}</div>
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={applyOpened}>取り込む</button>
                  <button className="btn" onClick={() => { setOpened(null); setPreview(""); }}>閉じる</button>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="mb-2 font-semibold">サーバーへ配布</h3>
              <p className="mb-2 text-xs text-zinc-400">現在のプロジェクト内容をサーバーの MythicMobs に直接書き出します。反映にはサーバー側で <span className="mono">/mm reload</span> が必要です。</p>
              <div className="flex flex-wrap gap-2">
                <button className="btn" disabled={busy} onClick={() => deployPack("skills")}>Skills → plugins/MythicMobs/skills/skills.yml</button>
                <button className="btn" disabled={busy} onClick={() => deployPack("mobs")}>Mobs → plugins/MythicMobs/mobs/mobs.yml</button>
              </div>
            </div>
            <div className="card p-4">
              <h3 className="mb-2 font-semibold">model.bbmodel</h3>
              {!bb ? <div className="text-xs text-zinc-600">読込中…</div> :
                bb.error ? <div className="text-xs text-zinc-500">{bb.error}</div> : (
                <div className="text-sm">
                  <div>要素 {bb.elements} / テクスチャ {bb.textures} / 解像度 {bb.resolution}</div>
                  <button className="btn mt-2" onClick={downloadBbmodel}>⬇ ダウンロード（VoxelForge の取込から開く）</button>
                </div>
              )}
            </div>
            <div className="card p-4">
              <h3 className="mb-2 font-semibold">Mod開発に持っていく</h3>
              <p className="mb-2 text-xs text-zinc-400">生成済み {files.length} ファイルを開発フォルダに展開します。IntelliJ で開いてすぐ開発できます（初回は `gradle wrapper` 生成→ `./gradlew build`）。</p>
              <button className="btn-primary" disabled={busy || !files.length} onClick={deployModSources}>
                ⬇ moddev/{(project.meta.modId || "mymod").toLowerCase()}/ に展開{progress ? ` (${progress})` : ""}
              </button>
            </div>
            <div className="card p-4">
              <h3 className="mb-2 font-semibold">リソースパック配布</h3>
              <p className="mb-2 text-xs text-zinc-400">TexCraft / SkyForge などで作った ZIP をサーバー配布用に配置します。server.properties の resource-pack には配布 URL の設定が別途必要です（現在は未設定）。</p>
              <label className="btn cursor-pointer">
                ⬆ ZIP を resourcepack/ に配置
                <input
                  type="file"
                  accept=".zip,application/zip"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file || !root) return;
                    setBusy(true);
                    try {
                      await writeBinaryFile(root, `mm/life-pve-aibou/resourcepack/${file.name}`, file);
                      await refresh(root);
                      setNotice(`${file.name} を resourcepack/ に配置しました。`);
                    } catch (err) {
                      setError(String(err instanceof Error ? err.message : err));
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
