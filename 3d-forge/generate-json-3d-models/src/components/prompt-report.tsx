"use client";

import { Check, ChevronDown, Info, ScanLine } from "lucide-react";
import type { PromptAnalysis } from "@/lib/prompt";

export default function PromptReport({ analysis, imageMode }: { analysis: PromptAnalysis; imageMode: boolean }) {
  return <div className="prompt-report" aria-label="タグの解析結果" aria-live="polite">
    <div className="prompt-report-heading"><span><ScanLine size={13} />選択内容の反映</span><span className="engine-badge">ルール生成</span></div>
    {imageMode ? <p className="prompt-image-note">画像モードでは輪郭を画像から作ります。長さや色のタグでは画像を変形しません。厚み・背景は画像パネルで調整できます。</p> : <>
      <div className="prompt-summary">{analysis.summary.map(label => <span key={label}>{label}</span>)}</div>
      {!analysis.blueprint.kind && <p className="prompt-missing"><Info size={12} />剣・弓・家などの形状を1つ指定してください。</p>}
      <details className="tag-feedback"><summary>タグごとの反映内容<ChevronDown size={11} /></summary><ul>{analysis.tags.map((entry, index) => <li key={`${entry.tag}-${index}`} data-status={entry.status}><span>{entry.status === "applied" ? <Check size={11} /> : <Info size={11} />}{entry.tag}</span><small>{entry.effects.join(" / ")}</small></li>)}</ul></details>
      {analysis.warnings.length > 0 && <div className="prompt-warnings">{analysis.warnings.map(warning => <p key={warning}>{warning}</p>)}</div>}
    </>}
    <p className="prompt-engine-note">選択した設定がキューブ形状へ直接反映される、ルールベースの確定生成です。同じ選択からはいつでも同じモデルが生まれます。</p>
  </div>;
}
