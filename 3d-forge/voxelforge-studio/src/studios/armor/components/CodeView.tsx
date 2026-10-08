import { useState } from "react";
import { Button } from "./ui";

export interface CodePreview {
  label: string;
  path: string;
  content: string;
  lang: string;
}

interface Props {
  previews: CodePreview[];
  files: string[];
}

export function CodeView({ previews, files }: Props) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const current = previews[Math.min(active, previews.length - 1)];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="grid gap-7 xl:grid-cols-[300px_minmax(0,1fr)]">
      <div className="space-y-3">
        <h3 className="text-[12px] font-semibold text-[#e5e3d9]">ZIP に含まれる {files.length} ファイル</h3>
        <ul className="max-h-[620px] space-y-2 overflow-auto border-t border-[#51584d] bg-[#1c211e] px-3 py-4 font-mono text-[10px] leading-relaxed text-[#a6afa3] custom-scrollbar">
          {files.map((f) => (
            <li key={f} className="break-all border-l border-[#53604d] pl-2">
              {f.includes("/geo/") || f.includes("/textures/item/armor/") ? <span className="text-[#e0bd88]">{f}</span> : f}
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {previews.map((p, i) => (
              <button
                key={p.path}
                type="button"
                onClick={() => setActive(i)}
                className={`border px-2.5 py-1.5 font-mono text-[10px] tracking-wider transition-colors ${
                  i === active ? "border-[#ceaa7a] bg-[#373426] text-[#f0d6ae]" : "border-[#41483f] bg-[#252a26] text-[#a9b1a5] hover:border-[#908772]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={copy}>
            {copied ? "コピーしました" : "コードをコピー"}
          </Button>
        </div>
        <div className="break-all font-mono text-[10px] text-[#a2aa9d]">{current.path}</div>
        <pre className="max-h-[640px] overflow-auto border border-[#434a40] bg-[#191e1b] p-5 font-mono text-[11px] leading-relaxed text-[#d1d3c9] custom-scrollbar">
          <code>{current.content}</code>
        </pre>
      </div>
    </div>
  );
}
