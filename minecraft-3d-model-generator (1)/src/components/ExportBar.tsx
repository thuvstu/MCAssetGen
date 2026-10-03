"use client";

import { useState } from "react";
import { downloadBbModel } from "@/lib/bbmodel";
import type { GeneratedModel } from "@/lib/generator";
import type { ModelSpec } from "@/lib/spec";

interface Props {
  spec: ModelSpec;
  model: GeneratedModel;
  onSave: () => void;
  saved: boolean;
}

export default function ExportBar({ spec, model, onSave, saved }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
      flash("ギャラリーに保存しました");
    } catch {
      flash("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      const payload = btoa(unescape(encodeURIComponent(JSON.stringify(spec))));
      const url = `${window.location.origin}${window.location.pathname}?m=${payload}`;
      await navigator.clipboard.writeText(url);
      flash("共有リンクをコピーしました");
    } catch {
      flash("リンクのコピーに失敗しました");
    }
  };

  return (
    <div className="border-t-2 border-[var(--color-line)] p-3">
      <div className="grid grid-cols-1 gap-2">
        <button
          className="pixel-btn bg-[var(--color-xp)] px-3 py-2.5 text-sm text-black"
          onClick={() => {
            downloadBbModel(spec, model);
            flash(".bbmodel をダウンロードしました");
          }}
        >
          ⬇ Blockbench (.bbmodel) で書き出し
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="pixel-btn bg-[var(--color-gold)] px-2 py-2 text-xs text-black" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "保存中…" : saved ? "✓ 保存済み" : "💾 ギャラリーに保存"}
          </button>
          <button className="pixel-btn bg-[var(--color-panel2)] px-2 py-2 text-xs text-[var(--color-fog)] outline outline-1 outline-[#3a4a66]" onClick={() => void handleShare()}>
            🔗 共有リンク
          </button>
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-[var(--color-fog)]/70">
        書き出した .bbmodel を Blockbench で開くと、ボーン・アニメーション・ピクセルテクスチャ付きで読み込めます。
      </p>
      {toast ? (
        <div className="toast-pop mt-2 border-2 border-[var(--color-xp)] bg-[rgba(110,224,106,0.12)] px-2 py-1.5 text-center font-pixel text-xs text-[var(--color-xp)]">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
