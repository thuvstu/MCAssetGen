"use client";

import { useCallback, useEffect, useState } from "react";
import { MODEL_TYPE_LABELS } from "@/lib/spec";
import type { ModelSpec } from "@/lib/spec";

export interface SavedModel {
  id: string;
  name: string;
  modelType: string;
  seed: string;
  spec: ModelSpec;
  createdAt: string;
}

interface Props {
  refreshKey: number;
  onLoad: (spec: ModelSpec) => void;
  currentId?: string;
}

export default function Gallery({ refreshKey, onLoad, currentId }: Props) {
  const [items, setItems] = useState<SavedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/models", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "load failed");
      setItems(data.models);
    } catch {
      setError("ギャラリーの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/models/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b-2 border-[var(--color-line)] px-4 py-3">
        <h3 className="font-pixel text-sm tracking-widest text-[var(--color-xp)]">保存済みモデル</h3>
        <button
          className="chip px-2 py-1 text-[10px]"
          data-on={false}
          onClick={() => void load()}
          title="再読み込み"
        >
          ↻
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <p className="p-4 text-center text-xs text-[var(--color-fog)]">読み込み中…</p>
        ) : error ? (
          <p className="p-4 text-center text-xs text-red-400">{error}</p>
        ) : items.length === 0 ? (
          <div className="rounded-none border-2 border-dashed border-[var(--color-line)] p-6 text-center">
            <p className="font-pixel text-xs text-[var(--color-fog)]">まだ保存されたモデルはありません</p>
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-fog)]/70">
              エディタで仕様を決めて
              <br />
              「ギャラリーに保存」を押してみよう
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((m) => (
              <li
                key={m.id}
                className={`group border-2 p-2 transition-colors ${
                  currentId === m.id
                    ? "border-[var(--color-xp)] bg-[rgba(110,224,106,0.07)]"
                    : "border-[var(--color-line)] bg-[var(--color-panel2)] hover:border-[#3a4a66]"
                }`}
              >
                <button className="w-full text-left" onClick={() => onLoad(m.spec)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold">{m.name}</span>
                    <span className="chip shrink-0 px-1.5 py-0.5 text-[10px]" data-on={false}>
                      {MODEL_TYPE_LABELS[m.modelType as keyof typeof MODEL_TYPE_LABELS] ?? m.modelType}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--color-fog)]">
                    <span className="font-pixel">seed {m.seed}</span>
                    <span>{new Date(m.createdAt).toLocaleDateString("ja-JP")}</span>
                  </div>
                </button>
                <button
                  className="mt-1 w-full border border-transparent px-1 py-0.5 text-left text-[10px] text-[var(--color-fog)]/60 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                  onClick={() => void remove(m.id)}
                  disabled={deleting === m.id}
                >
                  {deleting === m.id ? "削除中…" : "🗑 削除"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
