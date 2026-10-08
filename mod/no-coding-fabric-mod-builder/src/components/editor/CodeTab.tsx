"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { lexKotlin } from "@/lib/analyzer/kotlin";
import type { Diagnostic } from "@/lib/mod/types";
import { Btn, DiagnosticRow, type TabProps } from "./ui";

interface Seg { text: string; cls: string }

function highlight(src: string, kotlin: boolean): Seg[][] {
  const lines: Seg[][] = [[]];
  const emit = (text: string, cls: string) => {
    const parts = text.split("\n");
    parts.forEach((p, i) => {
      if (i > 0) lines.push([]);
      if (p) lines[lines.length - 1].push({ text: p, cls });
    });
  };
  if (!kotlin) {
    const isJson = src.trimStart().startsWith("{");
    if (!isJson) { emit(src, ""); return lines; }
    const re = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+\.?\d*)|(true|false|null)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      emit(src.slice(last, m.index), "");
      emit(m[0], m[2] ? "text-sky-300" : m[1] ? "text-emerald-300" : m[3] ? "text-amber-300" : "text-violet-300");
      last = m.index + m[0].length;
    }
    emit(src.slice(last), "");
    return lines;
  }
  const toks = lexKotlin(src).tokens.sort((a, b) => a.offset - b.offset);
  let pos = 0;
  for (const t of toks) {
    if (t.offset < pos) continue;
    emit(src.slice(pos, t.offset), "");
    const cls =
      t.type === "comment" ? "text-slate-500 italic"
        : t.type === "string" || t.type === "char" ? "text-emerald-300"
          : t.type === "number" ? "text-amber-300"
            : t.type === "keyword" ? "text-violet-400"
              : t.type === "ident" && /^[A-Z][A-Za-z0-9]*[a-z]/.test(t.text) ? "text-sky-300"
                : t.type === "ident" && /^[A-Z][A-Z0-9_]+$/.test(t.text) ? "text-orange-300"
                  : "";
    emit(t.text, cls);
    pos = t.offset + t.text.length;
  }
  emit(src.slice(pos), "");
  return lines;
}

export default function CodeTab({ analysis, focus }: TabProps & { focus: { file: string; line: number; n: number } | null }) {
  const [file, setFile] = useState(analysis.files[0]?.path ?? "");
  const [flash, setFlash] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const cur = analysis.files.find((f) => f.path === file) ?? analysis.files[0];

  useEffect(() => {
    if (!focus) return;
    const t = window.setTimeout(() => {
      setFile(focus.file);
      setFlash(focus.line);
      boxRef.current?.querySelector(`[data-line="${focus.line}"]`)?.scrollIntoView({ block: "center" });
    }, 0);
    const t2 = window.setTimeout(() => setFlash(0), 2500);
    return () => { window.clearTimeout(t); window.clearTimeout(t2); };
  }, [focus]);

  const diags = useMemo(() => analysis.diagnostics.filter((d) => d.file === cur?.path), [analysis, cur]);
  const isBinary = cur?.encoding === "base64";
  const hl = useMemo(() => (cur && !isBinary ? highlight(cur.content, cur.kind === "kotlin") : []), [cur, isBinary]);
  const byLine = useMemo(() => {
    const m = new Map<number, Diagnostic[]>();
    diags.forEach((d) => m.set(d.line, [...(m.get(d.line) ?? []), d]));
    return m;
  }, [diags]);

  const tree = useMemo(() => {
    const groups = new Map<string, typeof analysis.files>();
    analysis.files.forEach((f) => {
      const dir = f.path.includes("/") ? f.path.slice(0, f.path.lastIndexOf("/")) : ".";
      groups.set(dir, [...(groups.get(dir) ?? []), f]);
    });
    return [...groups.entries()];
  }, [analysis]);

  if (!cur) return null;
  const fileErrors = (p: string) => analysis.diagnostics.filter((d) => d.file === p && d.severity === "error").length;

  return (
    <div className="grid h-full min-h-0 grid-cols-[300px_1fr] gap-4">
      <aside className="min-h-0 overflow-auto rounded-xl border border-[#262f3e] bg-[#141922] p-2 text-xs">
        {tree.map(([dir, fs]) => (
          <div key={dir} className="mb-2">
            <p className="font-code truncate px-2 py-1 text-[10px] text-slate-500">{dir.replace(/^src\/main\//, "")}</p>
            {fs.map((f) => {
              const e = fileErrors(f.path);
              return (
                <button key={f.path} onClick={() => setFile(f.path)}
                  className={`flex w-full items-center justify-between rounded px-2 py-1 text-left font-code ${f.path === cur.path ? "bg-emerald-500/15 text-emerald-200" : "text-slate-300 hover:bg-white/5"}`}>
                  <span className="truncate">{f.path.split("/").pop()}</span>
                  {e > 0 && <span className="ml-2 rounded-full bg-red-500/30 px-1.5 text-[10px] text-red-200">{e}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </aside>
      <div className="flex min-h-0 flex-col gap-3">
        <div className="flex items-center justify-between rounded-xl border border-[#262f3e] bg-[#141922] px-4 py-2">
          <span className="font-code truncate text-xs text-slate-300">{cur.path}</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">{isBinary ? "バイナリ" : `${cur.content.split("\n").length} 行`}</span>
            {!isBinary && <Btn className="!py-1 text-xs" onClick={() => navigator.clipboard?.writeText(cur.content)}>コピー</Btn>}
          </div>
        </div>
        {isBinary ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-[#262f3e] bg-[#0a0d12] p-6 text-center">
            {cur.path.endsWith(".png") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`data:image/png;base64,${cur.content}`} alt={cur.path} style={{ imageRendering: "pixelated" }} className="max-h-64 max-w-64 rounded-md border border-[#262f3e]" />
            ) : <span className="text-4xl">📦</span>}
            <p className="font-code text-xs text-slate-400">バイナリファイル · 約 {Math.round((cur.content.length * 3) / 4 / 1024)} KB (ZIPに含まれます)</p>
          </div>
        ) : (
        <div ref={boxRef} className="min-h-0 flex-1 overflow-auto rounded-xl border border-[#262f3e] bg-[#0a0d12] py-2 font-code text-[12.5px] leading-[1.35rem]">
          {hl.map((segs, i) => {
            const ln = i + 1;
            const ds = byLine.get(ln);
            const sev = ds?.some((d) => d.severity === "error") ? "error" : ds?.some((d) => d.severity === "warning") ? "warning" : ds ? "info" : null;
            return (
              <div key={i} data-line={ln} title={ds?.map((d) => `${d.code}: ${d.message}`).join("\n")}
                className={`flex whitespace-pre ${flash === ln ? "bg-sky-400/20" : sev === "error" ? "bg-red-500/10" : sev === "warning" ? "bg-amber-500/10" : ""}`}>
                <span className={`sticky left-0 w-12 shrink-0 select-none bg-[#0a0d12] pr-3 text-right ${sev === "error" ? "text-red-400" : sev === "warning" ? "text-amber-400" : "text-slate-600"}`}>{ln}</span>
                <span className="pr-6">
                  {segs.length === 0 ? " " : segs.map((s, k) => <span key={k} className={s.cls}>{s.text}</span>)}
                  {sev && <span className={`ml-3 select-none text-[11px] ${sev === "error" ? "text-red-400" : sev === "warning" ? "text-amber-400" : "text-sky-400"}`}>◀ {ds![0].message.slice(0, 70)}</span>}
                </span>
              </div>
            );
          })}
        </div>
        )}
        <div className="max-h-44 shrink-0 overflow-auto rounded-xl border border-[#262f3e] bg-[#141922] p-2">
          <p className="px-2 pb-1 text-xs font-semibold text-slate-400">このファイルの静的解析結果 ({diags.length})</p>
          {diags.length === 0 && <p className="px-2 text-xs text-emerald-300">✔ 問題なし</p>}
          {diags.map((d, i) => <DiagnosticRow key={i} d={d} onJump={(_f, l) => { setFlash(l); boxRef.current?.querySelector(`[data-line="${l}"]`)?.scrollIntoView({ block: "center" }); }} />)}
        </div>
      </div>
    </div>
  );
}
