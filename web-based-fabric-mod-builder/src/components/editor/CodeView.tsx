"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Diagnostic, GeneratedFile } from "@/lib/mod/types";

const KW = new Set([
  "package", "import", "class", "interface", "object", "fun", "val", "var", "if", "else", "when", "for", "while", "do",
  "return", "break", "continue", "throw", "try", "catch", "finally", "is", "as", "in", "null", "true", "false", "this",
  "super", "data", "private", "public", "internal", "protected", "override", "open", "abstract", "const", "companion",
  "plugins", "id", "version",
]);

function highlightLine(line: string, lang: string): ReactNode[] {
  const t = line.trimStart();
  if ((lang === "kotlin" || lang === "gradle") && (t.startsWith("//") || t.startsWith("/*") || t.startsWith("*"))) {
    return [<span key="c" className="tok-com">{line}</span>];
  }
  if ((lang === "properties" || lang === "yaml" || lang === "markdown") && t.startsWith("#")) {
    return [<span key="c" className="tok-com">{line}</span>];
  }
  const out: ReactNode[] = [];
  const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*"?)|('(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?[fFL]?\b)|(@[A-Za-z_]+)|([A-Za-z_][A-Za-z0-9_]*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const s = m[0];
    let cls = "";
    if (m[1]) cls = "tok-com";
    else if (m[2] || m[3]) cls = "tok-str";
    else if (m[4]) cls = "tok-num";
    else if (m[5]) cls = "tok-ann";
    else if (m[6]) {
      if (lang === "kotlin" || lang === "gradle") {
        if (KW.has(s)) cls = "tok-kw";
        else if (/^[A-Z]/.test(s)) cls = "tok-type";
      } else if (lang === "json" && (s === "true" || s === "false" || s === "null")) cls = "tok-kw";
    }
    out.push(cls ? <span key={k++} className={cls}>{s}</span> : s);
    last = m.index + s.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

export function CodeBlock({
  code, lang = "kotlin", diags = [], maxHeight, focusLine,
}: {
  code: string;
  lang?: string;
  diags?: Diagnostic[];
  maxHeight?: number;
  focusLine?: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => code.split("\n"), [code]);
  const byLine = useMemo(() => {
    const m = new Map<number, Diagnostic[]>();
    for (const d of diags) if (d.line) m.set(d.line, [...(m.get(d.line) ?? []), d]);
    return m;
  }, [diags]);
  useEffect(() => {
    if (focusLine && ref.current) {
      const el = ref.current.querySelector(`[data-line="${focusLine}"]`);
      el?.scrollIntoView({ block: "center" });
    }
  }, [focusLine, code]);
  return (
    <div ref={ref} className="mono overflow-auto bg-[#0b0d10] text-[12px] leading-5" style={{ maxHeight }}>
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((l, i) => {
            const ds = byLine.get(i + 1);
            const sev = ds?.some((d) => d.severity === "error") ? "error" : ds?.some((d) => d.severity === "warning") ? "warning" : ds ? "info" : null;
            const bg = sev === "error" ? "bg-red-950/60" : sev === "warning" ? "bg-amber-950/40" : sev === "info" ? "bg-sky-950/30" : focusLine === i + 1 ? "bg-emerald-950/40" : "";
            return (
              <Fragment key={i}>
                <tr data-line={i + 1} className={bg}>
                  <td className="w-10 select-none border-r border-zinc-800 pr-2 text-right align-top text-zinc-600">{i + 1}</td>
                  <td className="whitespace-pre pl-3 pr-4 text-zinc-200">{highlightLine(l, lang)}</td>
                </tr>
                {ds?.map((d, j) => (
                  <tr key={`d${j}`} className={bg}>
                    <td className="border-r border-zinc-800" />
                    <td className={`whitespace-pre-wrap pl-3 text-[11px] ${d.severity === "error" ? "text-red-300" : d.severity === "warning" ? "text-amber-300" : "text-sky-300"}`}>
                      {"  ".repeat(Math.max(0, (d.col ?? 1) - 1) > 40 ? 0 : 0)}↳ {d.message}
                      {d.fix ? ` — 修正案: ${d.fix}` : ""}
                    </td>
                  </tr>
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function CodeView({
  files, diags, focus, onFocus,
}: {
  files: GeneratedFile[];
  diags: Diagnostic[];
  focus: { file: string; line?: number } | null;
  onFocus: (f: { file: string; line?: number }) => void;
}) {
  const [filter, setFilter] = useState("");
  const current = files.find((f) => f.path === focus?.file) ?? files.find((f) => f.language === "kotlin") ?? files[0];
  const countFor = (p: string) => {
    const ds = diags.filter((d) => d.file === p);
    return { e: ds.filter((d) => d.severity === "error").length, w: ds.filter((d) => d.severity === "warning").length };
  };
  const shown = files.filter((f) => f.path.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className="grid h-[calc(100vh-180px)] min-h-[500px] gap-3 lg:grid-cols-[300px_1fr]">
      <div className="card flex min-h-0 flex-col p-2">
        <input className="input mb-2" placeholder="ファイル検索..." value={filter} onChange={(e) => setFilter(e.target.value)} />
        <div className="min-h-0 flex-1 overflow-auto">
          {shown.map((f) => {
            const c = countFor(f.path);
            const short = f.path.replace(/^src\/main\/(kotlin|resources)\//, "");
            return (
              <button
                key={f.path}
                onClick={() => onFocus({ file: f.path })}
                className={`mono flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] ${current?.path === f.path ? "bg-emerald-900/50 text-emerald-200" : "text-zinc-300 hover:bg-zinc-800"}`}
                title={f.path}
              >
                <span className="shrink-0">{f.language === "kotlin" ? "🟣" : f.language === "json" ? "🟡" : "⚙️"}</span>
                <span className="truncate">{short}</span>
                {c.e > 0 && <span className="ml-auto rounded bg-red-900 px-1 text-[10px] text-red-200">{c.e}</span>}
                {c.e === 0 && c.w > 0 && <span className="ml-auto rounded bg-amber-900 px-1 text-[10px] text-amber-200">{c.w}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="card flex min-h-0 flex-col overflow-hidden">
        <div className="mono flex items-center justify-between border-b border-zinc-800 px-3 py-2 text-xs text-zinc-400">
          <span className="truncate">{current?.path}</span>
          <button className="btn !py-0.5 text-xs" onClick={() => current && navigator.clipboard.writeText(current.content)}>
            コピー
          </button>
        </div>
        <div className="min-h-0 flex-1">
          {current && (
            <CodeBlock
              code={current.content}
              lang={current.language}
              diags={diags.filter((d) => d.file === current.path)}
              maxHeight={10000}
              focusLine={focus?.file === current.path ? focus.line ?? null : null}
            />
          )}
        </div>
      </div>
    </div>
  );
}
