import { useEffect, useRef } from "react";
import { renderSword } from "../engine/render";
import type { SwordOptions } from "../engine/types";
import type { GenerationResult } from "../generator/generate";
import { BLADE_LABELS } from "../generator/catalog";
import { Icon } from "./Icon";

export function SwordThumbnail({ options, size = 64 }: { options: SwordOptions; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) renderSword(ref.current, { ...options, size: 64, antiAlias: false }, 0.5);
  }, [options]);
  return <canvas ref={ref} width={64} height={64} style={{ width: size, height: size, imageRendering: "pixelated" }} aria-hidden="true" />;
}

export default function VariationStrip({ candidates, selected, onSelect }: { candidates: GenerationResult[]; selected: SwordOptions; onSelect: (candidate: GenerationResult) => void }) {
  if (!candidates.length) return null;
  return <section className="variation-section panel-enter" aria-label="生成候補の比較">
    <div className="variation-heading"><span className="eyebrow">VARIATIONS</span><span>気に入った一本を選択</span></div>
    <div className="variations">{candidates.map((candidate, i) => {
      const active = selected === candidate.options;
      return <button key={i} className={`variation-option ${active ? "selected" : ""}`} aria-pressed={active} onClick={() => onSelect(candidate)}>
        <span className="variation-index">0{i + 1}</span>{active && <Icon name="check" className="variation-check" size={13} />}
        <SwordThumbnail options={candidate.options} size={76} /><span className="variation-name">{BLADE_LABELS[candidate.options.silhouette]}</span>
        <span className="variation-seed">#{candidate.report.seed}</span>
      </button>;
    })}</div>
  </section>;
}