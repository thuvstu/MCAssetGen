"use client";
import { useMemo } from "react";
import { DECORATIONS_LIST, GenSettings, GradientMode, PRESETS, Style } from "@/studios/adv/lib/pixel/generator";
import { MATERIALS } from "@/studios/adv/lib/pixel/palettes";
import { SHAPES } from "@/studios/adv/lib/pixel/shapes";
import { cssRgba } from "@/studios/adv/lib/pixel/core";
import { Btn, Section, Select, Slider } from "./ui";

const CATS: { id: string; label: string }[] = [
  { id: "melee", label: "近接" }, { id: "tool", label: "ツール" }, { id: "ranged", label: "遠距離" },
  { id: "magic", label: "魔法" }, { id: "tech", label: "機械" }, { id: "relic", label: "遺物" },
];
const GROUPS: { id: string; label: string }[] = [
  { id: "ornament", label: "装飾" }, { id: "magic", label: "魔法" }, { id: "effect", label: "エフェクト" },
  { id: "evil", label: "禍々しい/血" }, { id: "tech", label: "機械" }, { id: "nature", label: "自然" },
];

export default function GeneratorPanel({ s, set, onApplyPreset }: { s: GenSettings; set: (patch: Partial<GenSettings>) => void; onApplyPreset: (p: Partial<GenSettings>) => void }) {
  const shapesByCat = useMemo(() => CATS.map((c) => ({ ...c, shapes: SHAPES.filter((sh) => sh.category === c.id) })), []);
  const toggleDeco = (id: string) =>
    set({ decorations: s.decorations.includes(id) ? s.decorations.filter((d) => d !== id) : [...s.decorations, id] });

  return (
    <div className="space-y-2">
      <Section title="プリセット (ワンクリック)" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-1">
          {PRESETS.map((p) => (
            <Btn key={p.id} onClick={() => onApplyPreset(p.settings)} className="text-left truncate" title={p.name}>{p.nameJa}</Btn>
          ))}
        </div>
      </Section>

      <Section title="形状 / 武器タイプ">
        {shapesByCat.map((c) => (
          <div key={c.id}>
            <div className="text-[10px] text-slate-500 mb-1">{c.label}</div>
            <div className="flex flex-wrap gap-1 mb-1">
              {c.shapes.map((sh) => (
                <Btn key={sh.id} active={s.shape === sh.id} onClick={() => set({ shape: sh.id })} title={sh.name}>{sh.nameJa}</Btn>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="素材 / パレット">
        <div className="text-[10px] text-slate-500">メイン素材</div>
        <MaterialGrid value={s.material} onChange={(m) => set({ material: m })} />
        <div className="text-[10px] text-slate-500 mt-2">サブ素材 (ツートーン/装飾用)</div>
        <MaterialGrid value={s.material2} onChange={(m) => set({ material2: m })} />
      </Section>

      <Section title="スタイル & 解像度">
        <div className="flex flex-wrap gap-1">
          {([["vanilla", "バニラ+"], ["furfsky", "FurfSky風"], ["imperial", "ImperiaL風"], ["hypixelplus", "Hypixel+風"], ["painterly", "手描き風"]] as [Style, string][]).map(([v, l]) => (
            <Btn key={v} active={s.style === v} onClick={() => set({ style: v })}>{l}</Btn>
          ))}
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-[11px] text-slate-400 mr-1">サイズ</span>
          {([16, 32, 64] as const).map((n) => <Btn key={n} active={s.size === n} onClick={() => set({ size: n })}>{n}×{n}</Btn>)}
        </div>
        <Slider label="アウトライン強度" value={s.outline} min={0} max={1} onChange={(v) => set({ outline: v })} />
      </Section>

      <Section title="形状パラメータ">
        <Slider label="刃幅 / 太さ" value={s.params.width} min={0.5} max={1.8} onChange={(v) => set({ params: { ...s.params, width: v } })} />
        <Slider label="長さ" value={s.params.length} min={0.6} max={1.15} onChange={(v) => set({ params: { ...s.params, length: v } })} />
        <Slider label="ガード / 頭部サイズ" value={s.params.guard} min={0.4} max={2} onChange={(v) => set({ params: { ...s.params, guard: v } })} />
        <Slider label="装飾レベル (ornate)" value={s.params.ornate} min={0} max={3} step={1} onChange={(v) => set({ params: { ...s.params, ornate: v } })} />
        <Slider label="反り / 曲率" value={s.params.curve} min={-1} max={1} onChange={(v) => set({ params: { ...s.params, curve: v } })} />
      </Section>

      <Section title="グラデーション">
        <Select<GradientMode>
          value={s.gradient}
          onChange={(v) => set({ gradient: v })}
          options={[
            { value: "none", label: "なし" }, { value: "tip", label: "先端発光 (Tip glow)" }, { value: "length", label: "長さ方向" },
            { value: "width", label: "幅方向" }, { value: "twoTone", label: "ツートーン (素材1→素材2)" }, { value: "rainbow", label: "虹彩 (Rainbow)" },
            { value: "radial", label: "中心放射" }, { value: "fire", label: "炎ノイズ" },
          ]}
        />
        <Slider label="強さ" value={s.gradientStrength} min={0} max={1} onChange={(v) => set({ gradientStrength: v })} />
        <Slider label="オーラ (外側発光)" value={s.glow} min={0} max={1} onChange={(v) => set({ glow: v })} />
      </Section>

      <Section title="装飾 / パーツ / エフェクト" right={<span className="text-[10px] text-amber-300">{s.decorations.length}</span>}>
        {GROUPS.map((g) => (
          <div key={g.id}>
            <div className="text-[10px] text-slate-500 mb-1">{g.label}</div>
            <div className="flex flex-wrap gap-1 mb-1">
              {DECORATIONS_LIST.filter((d) => d.group === g.id).map((d) => (
                <Btn key={d.id} active={s.decorations.includes(d.id)} onClick={() => toggleDeco(d.id)} title={d.name}>{d.nameJa}</Btn>
              ))}
            </div>
          </div>
        ))}
        <div className="flex gap-1">
          <Btn onClick={() => set({ decorations: [] })} variant="ghost">全解除</Btn>
          <Btn onClick={() => set({ seed: Math.floor(Math.random() * 100000) })}>🎲 シード変更 ({s.seed})</Btn>
        </div>
      </Section>

      <Section title="色調整" defaultOpen={false}>
        <Slider label="色相シフト" value={s.hueShift} min={-0.5} max={0.5} onChange={(v) => set({ hueShift: v })} />
        <Slider label="彩度" value={s.saturation} min={-0.5} max={0.5} onChange={(v) => set({ saturation: v })} />
        <Slider label="明度" value={s.brightness} min={-0.3} max={0.3} onChange={(v) => set({ brightness: v })} />
      </Section>
    </div>
  );
}

function MaterialGrid({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {MATERIALS.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          title={m.name}
          className={`rounded border px-1 py-1 text-[10px] text-left truncate ${value === m.id ? "border-amber-300 bg-amber-400/10 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}
        >
          <div className="flex gap-px mb-0.5">
            {[1, 3, 5].map((i) => <span key={i} className="h-2 flex-1" style={{ background: cssRgba(m.primary[i]) }} />)}
            <span className="h-2 flex-1" style={{ background: cssRgba(m.secondary[3]) }} />
            <span className="h-2 flex-1" style={{ background: cssRgba(m.gem[4]) }} />
          </div>
          {m.nameJa}
        </button>
      ))}
    </div>
  );
}
