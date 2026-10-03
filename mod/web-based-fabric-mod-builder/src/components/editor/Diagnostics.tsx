"use client";

import { useState } from "react";
import type { Diagnostic } from "@/lib/mod/types";

const ICON = { error: "⛔", warning: "⚠️", info: "ℹ️" } as const;
const COLOR = { error: "text-red-300", warning: "text-amber-300", info: "text-sky-300" } as const;

export function DiagList({ diags, onOpen }: { diags: Diagnostic[]; onOpen?: (d: Diagnostic) => void }) {
  if (diags.length === 0) return <div className="text-sm text-emerald-400">✔ 問題は見つかりませんでした</div>;
  return (
    <ul className="space-y-1">
      {diags.map((d, i) => (
        <li
          key={i}
          className={`rounded-md border border-zinc-800 bg-black/20 px-3 py-2 text-sm ${d.file && onOpen ? "cursor-pointer hover:border-zinc-600" : ""}`}
          onClick={() => d.file && onOpen?.(d)}
        >
          <div className={`flex gap-2 ${COLOR[d.severity]}`}>
            <span>{ICON[d.severity]}</span>
            <span className="flex-1">{d.message}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 pl-6 text-[11px] text-zinc-500">
            {d.location && <span>📍 {d.location}</span>}
            {d.file && (
              <span className="mono">
                {d.file.split("/").pop()}:{d.line}
                {d.col ? `:${d.col}` : ""}
              </span>
            )}
            {d.fix && <span className="text-emerald-400/80">💡 {d.fix}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function DiagnosticsPanel({ diags, onOpen, stats }: { diags: Diagnostic[]; onOpen: (d: Diagnostic) => void; stats: { files: number; lines: number; ms: number } }) {
  const [sev, setSev] = useState<"all" | "error" | "warning" | "info">("all");
  const [src, setSrc] = useState<"all" | "model" | "kotlin">("all");
  const shown = diags.filter((d) => (sev === "all" || d.severity === sev) && (src === "all" || d.source === src));
  const n = (s: string) => diags.filter((d) => d.severity === s).length;
  return (
    <div>
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <div className="card p-4">
          <div className="text-xs text-zinc-400">エラー</div>
          <div className={`text-2xl font-bold ${n("error") ? "text-red-400" : "text-emerald-400"}`}>{n("error")}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-zinc-400">警告</div>
          <div className="text-2xl font-bold text-amber-400">{n("warning")}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-zinc-400">情報</div>
          <div className="text-2xl font-bold text-sky-400">{n("info")}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-zinc-400">解析対象</div>
          <div className="text-sm">
            {stats.files} Kotlinファイル / {stats.lines} 行
          </div>
          <div className="text-[11px] text-zinc-500">{stats.ms.toFixed(1)} ms</div>
        </div>
      </div>
      <div className="card mb-4 p-4 text-xs leading-6 text-zinc-400">
        <div className="mb-1 font-semibold text-zinc-200">実行される解析</div>
        <div>① <b>モデル検証</b>: ID形式・重複・スキル参照・無限再帰検出・メカニックとターゲッターの互換性・パラメータ型・トリガー適合性</div>
        <div>② <b>Kotlin 字句解析</b>: 文字列/テンプレート/エスケープ・括弧の対応・コメント閉じ忘れ</div>
        <div>③ <b>シンボル解決</b>: import の存在確認（Minecraft 1.21.1 Yarn / Fabric API 辞書）・未解決参照・未使用/重複/衝突 import・package とパス整合</div>
        <div>④ <b>API Lint</b>: 1.21 で変わった API (Identifier コンストラクタ等)・Mojang マッピング名の混入・override 可能メソッド確認・ラムダ内 continue 等</div>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {(["all", "error", "warning", "info"] as const).map((s) => (
          <button key={s} className={`btn !py-1 text-xs ${sev === s ? "!bg-emerald-800" : ""}`} onClick={() => setSev(s)}>
            {s === "all" ? "すべて" : s === "error" ? "エラー" : s === "warning" ? "警告" : "情報"}
          </button>
        ))}
        <span className="mx-2 border-l border-zinc-700" />
        {(["all", "model", "kotlin"] as const).map((s) => (
          <button key={s} className={`btn !py-1 text-xs ${src === s ? "!bg-emerald-800" : ""}`} onClick={() => setSrc(s)}>
            {s === "all" ? "全ソース" : s === "model" ? "モデル" : "Kotlin"}
          </button>
        ))}
      </div>
      <DiagList diags={shown} onOpen={onOpen} />
    </div>
  );
}
