"use client";

import React, { useEffect, useState } from "react";
import { GeneratorConfig } from "@/lib/types";
import { X, Search } from "lucide-react";

/* ------------------------------- save ------------------------------- */

interface SaveProps {
  open: boolean;
  onClose: () => void;
  config: GeneratorConfig;
  preview: string | null;
}

export function SaveModal({ open, onClose, config, preview }: SaveProps) {
  const [title, setTitle] = useState(config.name);
  const [blurb, setBlurb] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    if (open) {
      setTitle(config.name);
      setBlurb("");
      setState("idle");
    }
  }, [open, config.name]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setState("idle");
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: blurb.trim(),
          category: config.category,
          theme: config.theme,
          config: { ...config, name: title.trim() },
          previewDataUrl: preview,
        }),
      });
      const data = await res.json();
      setState(data.success ? "saved" : "error");
      if (data.success) setTimeout(onClose, 1100);
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md border border-line bg-panel-2 shadow-[0_50px_140px_-50px_#000]"
      >
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <div className="lbl">SAVE</div>
            <h2 className="mincho mt-2 text-[22px] font-bold leading-none text-bone">
              設計図を納める
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-ash hover:text-bone">
            <X className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {preview ? (
            <img
              src={preview}
              alt="render preview"
              className="h-36 w-full border border-line bg-ink object-contain p-2"
            />
          ) : (
            <div className="border border-dashed border-line px-4 py-5 text-[10.5px] leading-relaxed text-ash">
              ビューポート右上の <span className="num text-ember-bright">CAMERA</span>{" "}
              でスナップショットを撮ると、描画を同梱できます（任意）。
            </div>
          )}

          <label className="block">
            <span className="lbl">MODEL NAME</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="field mt-2"
            />
          </label>

          <label className="block">
            <span className="lbl">NOTE</span>
            <textarea
              value={blurb}
              onChange={(e) => setBlurb(e.target.value)}
              rows={3}
              placeholder="サーバーのボスドロップ用／Modの素材名など"
              className="field mt-2 resize-none text-[12px]"
            />
          </label>

          {state === "error" && (
            <p className="text-[11px] text-[#ff8f7a]">保存に失敗しました。</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <button type="button" onClick={onClose} className="btn">
            キャンセル
          </button>
          <button
            type="submit"
            disabled={busy || state === "saved"}
            className="btn btn-solid"
          >
            {state === "saved" ? "保存しました" : busy ? "保存中…" : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------- vault ------------------------------- */

export interface VaultItem {
  id: number;
  title: string;
  description: string | null;
  category: string;
  theme: string;
  config: GeneratorConfig;
  previewDataUrl: string | null;
  likesCount: number;
  downloadsCount: number;
  createdAt: string;
}

interface VaultProps {
  open: boolean;
  onClose: () => void;
  onLoad: (config: GeneratorConfig) => void;
}

export function VaultModal({ open, onClose, onLoad }: VaultProps) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [family, setFamily] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/models?category=${family}&search=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setItems(data.success ? data.models ?? [] : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(load, q ? 260 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, family, q]);

  if (!open) return null;

  const like = async (id: number) => {
    setItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, likesCount: (m.likesCount ?? 0) + 1 } : m))
    );
    try {
      await fetch(`/api/models/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
      });
    } catch {
      /* optimistic only */
    }
  };

  const filters = [
    ["all", "すべて"],
    ["sword", "剣"],
    ["staff", "杖"],
    ["greatsword", "大剣"],
    ["scythe", "鎌"],
    ["bow", "弓"],
    ["shield", "盾"],
    ["armor_helmet", "冠"],
    ["armor_wings", "翼"],
    ["relic_crystal", "水晶"],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden border border-line bg-panel-2 shadow-[0_50px_140px_-50px_#000]">
        <div className="flex items-end justify-between border-b border-line px-6 py-5">
          <div>
            <div className="lbl">VAULT</div>
            <h2 className="mincho mt-2 text-[22px] font-bold leading-none text-bone">
              蔵 — 保存済みの設計図
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-ash hover:text-bone">
            <X className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-line px-6 py-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-56">
            <Search className="absolute left-2.5 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-ash" strokeWidth={1.5} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="名前・説明で検索"
              className="field py-2 pl-8 text-[12px]"
            />
          </div>
          <div className="flex gap-4 overflow-x-auto">
            {filters.map(([id, ja]) => (
              <button
                key={id}
                onClick={() => setFamily(id)}
                className={`shrink-0 border-b pb-1 text-[11px] transition-colors ${
                  family === id
                    ? "border-ember text-bone"
                    : "border-transparent text-ash hover:text-bone"
                }`}
              >
                {ja}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-52 items-center justify-center">
              <span className="lbl animate-pulse">READING VAULT…</span>
            </div>
          ) : items.length === 0 ? (
            <div>
              <div
                className="h-52 bg-cover bg-center"
                style={{
                  backgroundImage: "url(images/empty-vault.jpg)",
                  filter: "brightness(0.72) saturate(0.85)",
                }}
              />
              <div className="border-t border-line px-6 py-6">
                <p className="mincho text-[17px] font-bold text-bone">蔵はまだ空です</p>
                <p className="mt-2 max-w-[52ch] text-[11px] leading-[1.9] text-ash">
                  上部の「保存」から設計図を納めてください。強化段階・形態・限界突破・配色・
                  アニメーション設定までまとめて記録され、いつでもこの場から復元できます。
                </p>
              </div>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onLoad(item.config);
                    onClose();
                  }}
                  className="group flex w-full items-center gap-4 border-b border-line-soft px-6 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <div className="h-16 w-24 flex-none border border-line-soft bg-ink">
                    {item.previewDataUrl ? (
                      <img
                        src={item.previewDataUrl}
                        alt=""
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{
                          background:
                            "radial-gradient(circle at 50% 65%, #2a2028, #0a0a0b 72%)",
                        }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mincho truncate text-[15px] font-bold text-bone group-hover:text-ember-bright">
                      {item.title}
                    </div>
                    {item.description && (
                      <p className="mt-1 truncate text-[11px] text-ash">{item.description}</p>
                    )}
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="lbl">{item.category}</div>
                    <div className="lbl mt-1.5 opacity-65">
                      {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      like(item.id);
                    }}
                    className="num w-12 text-right text-[11px] text-ash transition-colors hover:text-[#ff8fa8]"
                  >
                    ♥ {item.likesCount ?? 0}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
