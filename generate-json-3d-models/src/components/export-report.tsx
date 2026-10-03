"use client";
import { useMemo, useState } from "react";
import { Check, ChevronDown, CircleHelp, FileCheck2 } from "lucide-react";
import { inspectExport } from "@/lib/export-check";
import type { VoxelModel } from "@/lib/models";

export default function ExportReport({ model }: { model: VoxelModel }) {
  const [open, setOpen] = useState(false);
  const checks = useMemo(() => inspectExport(model), [model]);
  const errors = checks.filter(check => check.status === "error");
  return <div className="export-report"><button type="button" className="report-toggle" aria-expanded={open} onClick={() => setOpen(!open)}><span><FileCheck2 size={14} />書き出し前チェック</span><small className={errors.length ? "has-errors" : ""}>{errors.length ? `${errors.length}件の問題` : "構造チェックOK"}</small><ChevronDown size={13} /></button>
    {open && <div className="report-body">{checks.map(check => <div className={`report-check ${check.status}`} key={check.id}>{check.status === "ok" ? <Check size={13} /> : <CircleHelp size={13} />}<div><strong>{check.label}</strong><p>{check.detail}</p></div></div>)}<div className="report-boundary"><strong>対象：Minecraft Java 1.21.4</strong><p>ここで確認するのはファイルの構造です。Minecraftクライアント上での見た目・動作は未検証です。本体のアニメーションはBlockbench用。パーティクルは別のデータパックが必要です。</p></div><ol className="install-steps"><li>リソースパックZIPを <code>.minecraft/resourcepacks</code> に置く</li><li>設定 → リソースパックで有効にする</li><li>権限のあるワールドで標準の /give コマンドを実行する</li></ol></div>}
  </div>;
}
