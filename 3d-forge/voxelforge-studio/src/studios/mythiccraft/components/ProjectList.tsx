"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Row {
  id: number;
  name: string;
  modId: string;
  updatedAt: string;
  counts: { items: number; blocks: number; skills: number };
}

export default function ProjectList() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await fetch("/api/studios/mythiccraft/projects", { cache: "no-store" });
      if (!r.ok) throw new Error(await r.text());
      setRows(await r.json());
    } catch (e) {
      setError(String(e));
      setRows([]);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const create = async (template: "empty" | "sample") => {
    setBusy(true);
    try {
      const r = await fetch("/api/studios/mythiccraft/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || (template === "sample" ? "Mythic Sample" : "My Skill Mod"), template }),
      });
      const j = await r.json();
      router.push(`/p/${j.id}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("このプロジェクトを削除しますか？")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <section className="grid gap-6 md:grid-cols-[340px_1fr]">
      <div className="card h-fit p-5">
        <h2 className="mb-3 font-semibold">新規プロジェクト</h2>
        <label className="label">Mod 名</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: Arcane Magic" />
        <div className="mt-4 flex flex-col gap-2">
          <button className="btn-primary justify-center" disabled={busy} onClick={() => create("sample")}>
            ✨ サンプル付きで作成（おすすめ）
          </button>
          <button className="btn justify-center" disabled={busy} onClick={() => create("empty")}>
            空のプロジェクトを作成
          </button>
        </div>
        <p className="mt-4 text-xs text-zinc-500">サンプルには炎の杖・雷の剣・回復ブロック・ゾンビのスキル等が含まれます。</p>
      </div>
      <div>
        <h2 className="mb-3 font-semibold">プロジェクト</h2>
        {error && <div className="mb-3 rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{error}</div>}
        {rows === null ? (
          <div className="text-zinc-500">読み込み中...</div>
        ) : rows.length === 0 ? (
          <div className="card p-8 text-center text-zinc-500">まだプロジェクトがありません。左から作成してください。</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((r) => (
              <div key={r.id} className="card group p-4 transition hover:border-emerald-700">
                <Link href={`/p/${r.id}`} className="block">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-emerald-900/50 text-lg">⛏</div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold group-hover:text-emerald-300">{r.name}</div>
                      <div className="mono text-xs text-zinc-500">{r.modId}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-3 text-xs text-zinc-400">
                    <span>アイテム {r.counts.items}</span>
                    <span>ブロック {r.counts.blocks}</span>
                    <span>スキル {r.counts.skills}</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-600">更新: {new Date(r.updatedAt).toLocaleString("ja-JP")}</div>
                </Link>
                <div className="mt-3 flex justify-end">
                  <button className="btn-danger" onClick={() => remove(r.id)}>
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
