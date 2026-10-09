"use client";
import { useState } from "react";
import { fromHex, GradientOpts, GradientType, hex, Pix, A, adjustLight, shiftHue, outerOutline, mix, rgba, withAlpha, clonePix, flipH, flipV, rotate90, shift, cssRgba } from "@/studios/adv/lib/pixel/core";
import { EDITOR_PALETTE } from "@/studios/adv/lib/pixel/palettes";
import type { Mirror, Tool } from "./PixelCanvas";
import { Btn, Section, Select, Slider, Swatch, Toggle } from "./ui";

const TOOLS: { id: Tool; label: string; icon: string; key: string }[] = [
  { id: "pencil", label: "ペン", icon: "✏️", key: "B" },
  { id: "eraser", label: "消しゴム", icon: "🧽", key: "E" },
  { id: "fill", label: "塗りつぶし (Shift=全体)", icon: "🪣", key: "G" },
  { id: "picker", label: "スポイト", icon: "💉", key: "I" },
  { id: "line", label: "直線", icon: "📏", key: "L" },
  { id: "rect", label: "矩形", icon: "▭", key: "R" },
  { id: "rectfill", label: "矩形塗り", icon: "▬", key: "" },
  { id: "ellipse", label: "楕円", icon: "◯", key: "O" },
  { id: "ellipsefill", label: "楕円塗り", icon: "⬤", key: "" },
  { id: "gradient", label: "グラデーション", icon: "🌈", key: "D" },
  { id: "lighten", label: "明るく", icon: "☀️", key: "" },
  { id: "darken", label: "暗く", icon: "🌙", key: "" },
  { id: "hue", label: "色相回し", icon: "🎨", key: "" },
  { id: "glow", label: "グローブラシ", icon: "✨", key: "" },
  { id: "dither", label: "ディザ", icon: "▦", key: "" },
  { id: "smudge", label: "ぼかし", icon: "👆", key: "" },
  { id: "select", label: "範囲選択 (グラデ領域)", icon: "⬚", key: "M" },
];

export type ToolState = {
  tool: Tool; color: number; color2: number; size: number; mirror: Mirror; gradient: GradientOpts; zoom: number; grid: boolean; onion: boolean;
};

export default function ToolPanel({ t, set, pix, apply, recent }: { t: ToolState; set: (p: Partial<ToolState>) => void; pix: Pix; apply: (fn: (p: Pix) => Pix, label: string) => void; recent: number[] }) {
  const [adj, setAdj] = useState({ h: 0, s: 0, l: 0 });
  const g = t.gradient;
  const setG = (p: Partial<GradientOpts>) => set({ gradient: { ...g, ...p } });

  return (
    <div className="space-y-2">
      <Section title="ツール">
        <div className="grid grid-cols-6 gap-1">
          {TOOLS.map((tl) => (
            <button key={tl.id} type="button" title={`${tl.label}${tl.key ? ` (${tl.key})` : ""}`} onClick={() => set({ tool: tl.id })}
              className={`h-9 rounded border text-base ${t.tool === tl.id ? "border-amber-300 bg-amber-400/20" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>{tl.icon}</button>
          ))}
        </div>
        <div className="text-[10px] text-slate-400">選択中: {TOOLS.find((x) => x.id === t.tool)?.label} ・ 右クリック=サブカラー</div>
        <Slider label="ブラシサイズ" value={t.size} min={1} max={8} step={1} onChange={(v) => set({ size: v })} />
        <div className="flex gap-1 items-center flex-wrap">
          <span className="text-[11px] text-slate-400">ミラー</span>
          {([["none", "なし"], ["h", "左右"], ["v", "上下"], ["both", "4方向"], ["diag", "武器軸"]] as [Mirror, string][]).map(([v, l]) => (
            <Btn key={v} active={t.mirror === v} onClick={() => set({ mirror: v })}>{l}</Btn>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <Toggle label="グリッド" checked={t.grid} onChange={(v) => set({ grid: v })} />
          <Toggle label="オニオンスキン" checked={t.onion} onChange={(v) => set({ onion: v })} />
        </div>
      </Section>

      <Section title="カラー">
        <div className="flex items-center gap-2">
          <label className="relative">
            <span className="block w-9 h-9 rounded border border-white/20" style={{ background: cssRgba(t.color) }} />
            <input type="color" value={hex(t.color)} onChange={(e) => set({ color: fromHex(e.target.value) })} className="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
          <label className="relative">
            <span className="block w-6 h-6 rounded border border-white/20" style={{ background: cssRgba(t.color2) }} />
            <input type="color" value={hex(t.color2)} onChange={(e) => set({ color2: fromHex(e.target.value) })} className="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
          <Btn onClick={() => set({ color: t.color2, color2: t.color })} title="入替">⇄</Btn>
          <input className="flex-1 min-w-0 rounded bg-slate-900 border border-white/10 px-2 py-1 text-xs font-mono" value={hex(t.color)} onChange={(e) => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) set({ color: fromHex(e.target.value) }); }} />
        </div>
        <Slider label="不透明度" value={A(t.color)} min={0} max={255} step={1} onChange={(v) => set({ color: withAlpha(t.color, v) })} />
        <div className="flex gap-1">
          {[-0.15, -0.08, 0.08, 0.15].map((d) => <Btn key={d} onClick={() => set({ color: adjustLight(t.color, d) })}>{d > 0 ? "+" : ""}{Math.round(d * 100)}L</Btn>)}
          {[-0.05, 0.05].map((d) => <Btn key={d} onClick={() => set({ color: shiftHue(t.color, d) })}>{d > 0 ? "+" : "-"}H</Btn>)}
        </div>
        {recent.length > 0 && (
          <>
            <div className="text-[10px] text-slate-500">画像内の色</div>
            <div className="flex flex-wrap gap-1">{recent.map((c, i) => <Swatch key={i} color={c} selected={c === t.color} onClick={() => set({ color: c })} />)}</div>
          </>
        )}
        <div className="text-[10px] text-slate-500">パレット</div>
        <div className="flex flex-wrap gap-1">{EDITOR_PALETTE.map((h) => <Swatch key={h} color={fromHex(h)} selected={fromHex(h) === t.color} onClick={() => set({ color: fromHex(h) })} />)}</div>
      </Section>

      <Section title="グラデーション設定" defaultOpen={t.tool === "gradient"}>
        <div className="text-[10px] text-slate-400">グラデーションツールでドラッグ。範囲選択があればその中だけに適用。</div>
        <Select<GradientType> label="タイプ" value={g.type} onChange={(v) => setG({ type: v })}
          options={[{ value: "linear", label: "線形" }, { value: "radial", label: "放射" }, { value: "diagonal", label: "対角" }, { value: "reflected", label: "反射" }, { value: "conic", label: "円錐" }, { value: "rainbow", label: "虹" }]} />
        <Select<GradientOpts["mode"]> label="合成モード" value={g.mode} onChange={(v) => setG({ mode: v })}
          options={[{ value: "replace", label: "置換" }, { value: "tint", label: "着色 (陰影保持)" }, { value: "multiply", label: "乗算" }, { value: "overlay", label: "オーバーレイ" }]} />
        <div className="space-y-1">
          {g.stops.map((st, i) => (
            <div key={i} className="flex items-center gap-1">
              <label className="relative"><span className="block w-6 h-6 rounded border border-white/20" style={{ background: cssRgba(st.color) }} />
                <input type="color" value={hex(st.color)} onChange={(e) => setG({ stops: g.stops.map((x, k) => (k === i ? { ...x, color: withAlpha(fromHex(e.target.value), A(x.color)) } : x)) })} className="absolute inset-0 opacity-0 cursor-pointer" /></label>
              <input type="range" min={0} max={1} step={0.01} value={st.t} onChange={(e) => setG({ stops: g.stops.map((x, k) => (k === i ? { ...x, t: parseFloat(e.target.value) } : x)).sort((a, b) => a.t - b.t) })} className="flex-1 accent-amber-400 h-1" />
              <Btn onClick={() => setG({ stops: g.stops.map((x, k) => (k === i ? { ...x, color: t.color } : x)) })} title="現在色を適用">←</Btn>
              {g.stops.length > 2 && <Btn variant="ghost" onClick={() => setG({ stops: g.stops.filter((_, k) => k !== i) })}>✕</Btn>}
            </div>
          ))}
          <Btn onClick={() => setG({ stops: [...g.stops, { t: 0.5, color: t.color }].sort((a, b) => a.t - b.t) })}>+ ストップ追加</Btn>
        </div>
        <Slider label="ディザ量" value={g.dither} min={0} max={1} onChange={(v) => setG({ dither: v })} />
        <Slider label="段階数 (0=滑らか)" value={g.steps} min={0} max={8} step={1} onChange={(v) => setG({ steps: v })} />
        <Toggle label="既存ピクセルのみに適用" checked={g.maskOnly} onChange={(v) => setG({ maskOnly: v })} />
      </Section>

      <Section title="変形" defaultOpen={false}>
        <div className="flex flex-wrap gap-1">
          <Btn onClick={() => apply(flipH, "左右反転")}>左右反転</Btn>
          <Btn onClick={() => apply(flipV, "上下反転")}>上下反転</Btn>
          <Btn onClick={() => apply(rotate90, "回転")}>90°回転</Btn>
          <Btn onClick={() => apply((p) => shift(p, -1, 0), "移動")}>←</Btn>
          <Btn onClick={() => apply((p) => shift(p, 1, 0), "移動")}>→</Btn>
          <Btn onClick={() => apply((p) => shift(p, 0, -1), "移動")}>↑</Btn>
          <Btn onClick={() => apply((p) => shift(p, 0, 1), "移動")}>↓</Btn>
        </div>
      </Section>

      <Section title="フレーム全体の調整" defaultOpen={false}>
        <Slider label="色相" value={adj.h} min={-0.5} max={0.5} onChange={(v) => setAdj({ ...adj, h: v })} />
        <Slider label="彩度" value={adj.s} min={-0.5} max={0.5} onChange={(v) => setAdj({ ...adj, s: v })} />
        <Slider label="明度" value={adj.l} min={-0.4} max={0.4} onChange={(v) => setAdj({ ...adj, l: v })} />
        <div className="flex gap-1 flex-wrap">
          <Btn variant="primary" onClick={() => { apply((p) => { const o = clonePix(p); for (let i = 0; i < o.data.length; i++) { if (A(o.data[i]) === 0) continue; o.data[i] = adjustLight(shiftHue(o.data[i], adj.h), adj.l, adj.s); } return o; }, "色調整"); setAdj({ h: 0, s: 0, l: 0 }); }}>適用</Btn>
          <Btn onClick={() => apply((p) => { const o = clonePix(p); const m = outerOutline(p); for (let i = 0; i < m.length; i++) if (m[i]) o.data[i] = t.color; return o; }, "アウトライン")}>アウトライン追加 (現在色)</Btn>
          <Btn onClick={() => apply((p) => { const o = clonePix(p); const m = outerOutline(p, true); for (let i = 0; i < m.length; i++) if (m[i]) o.data[i] = withAlpha(t.color, 90); return o; }, "グロー")}>外周グロー</Btn>
          <Btn onClick={() => apply((p) => { const o = clonePix(p); for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const i = y * p.w + x; if (A(o.data[i]) === 0) continue; const lit = x > 0 && y > 0 && A(p.data[i - 1]) === 0 || A(p.data[i - p.w] ?? 0) === 0; const dark = (x < p.w - 1 && A(p.data[i + 1]) === 0) || (y < p.h - 1 && A(p.data[i + p.w]) === 0); if (lit && !dark) o.data[i] = adjustLight(o.data[i], 0.12); else if (dark && !lit) o.data[i] = adjustLight(o.data[i], -0.14); } return o; }, "自動陰影")}>自動ベベル陰影</Btn>
          <Btn onClick={() => apply((p) => { const o = clonePix(p); for (let i = 0; i < o.data.length; i++) if (A(o.data[i]) > 0) o.data[i] = mix(o.data[i], rgba(0, 0, 0, A(o.data[i])), 0); return o; }, "noop")} className="hidden">-</Btn>
          <Btn variant="danger" onClick={() => apply((p) => { const o = clonePix(p); o.data.fill(0); return o; }, "クリア")}>フレームをクリア</Btn>
        </div>
      </Section>
    </div>
  );
}
