"use client";
import { ANIM_TYPES, AnimLayer, AnimType } from "@/studios/adv/lib/pixel/animations";
import { Pix } from "@/studios/adv/lib/pixel/core";
import type { AnimationSettings } from "@/studios/adv/lib/editor/project";
import { Btn, PixThumb, Section, Select, Slider, Toggle } from "./ui";

export type AnimState = AnimationSettings;

const ANIM_PRESETS: { nameJa: string; layers: AnimLayer[]; frames: number; frametime: number }[] = [
  { nameJa: "宝石の脈動", layers: [{ type: "glow_pulse", intensity: 1, speed: 1, enabled: true }, { type: "aura_breathe", intensity: 0.8, speed: 1, enabled: true }], frames: 8, frametime: 3 },
  { nameJa: "虹彩剣", layers: [{ type: "rainbow_cycle", intensity: 0.9, speed: 1, enabled: true }, { type: "sparkle", intensity: 0.8, speed: 1, enabled: true }], frames: 12, frametime: 2 },
  { nameJa: "聖なる輝き", layers: [{ type: "shimmer", intensity: 1, speed: 1, enabled: true }, { type: "glow_pulse", intensity: 0.7, speed: 2, enabled: true }, { type: "sparkle", intensity: 1, speed: 1, enabled: true }], frames: 12, frametime: 2 },
  { nameJa: "炎の武器", layers: [{ type: "fire", intensity: 1, speed: 1, enabled: true }, { type: "flicker", intensity: 0.8, speed: 1, enabled: true }], frames: 8, frametime: 2 },
  { nameJa: "ブラッド", layers: [{ type: "drip", intensity: 1, speed: 1, enabled: true }, { type: "glow_pulse", intensity: 0.5, speed: 1, enabled: true }], frames: 10, frametime: 3 },
  { nameJa: "虚空/呪い", layers: [{ type: "smoke", intensity: 1, speed: 1, enabled: true }, { type: "hue_wave", intensity: 0.8, speed: 1, enabled: true }, { type: "flicker", intensity: 0.6, speed: 1, enabled: true }], frames: 10, frametime: 3 },
  { nameJa: "電撃/レールガン", layers: [{ type: "electric_arc", intensity: 1, speed: 1, enabled: true }, { type: "energy_flow", intensity: 1, speed: 1, enabled: true }, { type: "lightning", intensity: 0.7, speed: 1, enabled: true }], frames: 8, frametime: 1 },
  { nameJa: "魔法陣回転", layers: [{ type: "rotate", intensity: 1, speed: 1, enabled: true }, { type: "glow_pulse", intensity: 0.8, speed: 2, enabled: true }], frames: 16, frametime: 2 },
  { nameJa: "浮遊レリック", layers: [{ type: "bob", intensity: 1, speed: 1, enabled: true }, { type: "sparkle", intensity: 0.7, speed: 1, enabled: true }, { type: "aura_breathe", intensity: 1, speed: 1, enabled: true }], frames: 12, frametime: 3 },
];

export default function AnimationPanel({ a, set, onGenerate, frames, current, setCurrent, onFrameOp, playing, setPlaying }: {
  a: AnimState; set: (p: Partial<AnimState>) => void; onGenerate: () => void;
  frames: Pix[]; current: number; setCurrent: (i: number) => void;
  onFrameOp: (op: "add" | "dup" | "del" | "left" | "right" | "clearAll" | "reverse" | "pingpong") => void;
  playing: boolean; setPlaying: (v: boolean) => void;
}) {
  const setLayer = (i: number, p: Partial<AnimLayer>) => set({ layers: a.layers.map((l, k) => (k === i ? { ...l, ...p } : l)) });
  return (
    <div className="space-y-2">
      <Section title="アニメーションプリセット">
        <div className="grid grid-cols-2 gap-1">
          {ANIM_PRESETS.map((p) => <Btn key={p.nameJa} onClick={() => set({ layers: p.layers.map((l) => ({ ...l })), frameCount: p.frames, frametime: p.frametime })}>{p.nameJa}</Btn>)}
        </div>
      </Section>
      <Section title="エフェクトレイヤー (重ね掛け可)">
        {a.layers.map((l, i) => (
          <div key={i} className="rounded border border-white/10 p-2 space-y-1 bg-black/20">
            <div className="flex items-center gap-1">
              <input type="checkbox" checked={l.enabled} onChange={(e) => setLayer(i, { enabled: e.target.checked })} className="accent-amber-400" />
              <div className="flex-1"><Select<AnimType> value={l.type} onChange={(v) => setLayer(i, { type: v })} options={ANIM_TYPES.map((t) => ({ value: t.id, label: t.nameJa }))} /></div>
              <Btn variant="ghost" onClick={() => set({ layers: a.layers.filter((_, k) => k !== i) })}>✕</Btn>
            </div>
            <Slider label="強さ" value={l.intensity} min={0} max={1.5} onChange={(v) => setLayer(i, { intensity: v })} />
            <Slider label="速度 (周期数)" value={l.speed} min={1} max={4} step={1} onChange={(v) => setLayer(i, { speed: v })} />
          </div>
        ))}
        <Btn onClick={() => set({ layers: [...a.layers, { type: "glow_pulse", intensity: 1, speed: 1, enabled: true }] })}>+ レイヤー追加</Btn>
      </Section>
      <Section title="生成設定">
        <Slider label="フレーム数" value={a.frameCount} min={2} max={32} step={1} onChange={(v) => set({ frameCount: v })} />
        <Slider label="frametime (tick/frame)" value={a.frametime} min={1} max={20} step={1} onChange={(v) => set({ frametime: v })} />
        <Toggle label="interpolate (補間)" checked={a.interpolate} onChange={(v) => set({ interpolate: v })} />
        <div className="text-[10px] text-slate-400">現在のフレーム(1枚目)をベースに全フレームを生成します。生成後も各フレームを手描き編集できます。</div>
        <Btn variant="primary" onClick={onGenerate} className="w-full">⚡ アニメーションを生成</Btn>
      </Section>
      <Section title={`フレーム (${frames.length})`}>
        <div className="flex flex-wrap gap-1">
          <Btn active={playing} onClick={() => setPlaying(!playing)}>{playing ? "⏸ 停止" : "▶ 再生"}</Btn>
          <Btn onClick={() => onFrameOp("add")}>+ 空</Btn>
          <Btn onClick={() => onFrameOp("dup")}>複製</Btn>
          <Btn onClick={() => onFrameOp("left")}>←</Btn>
          <Btn onClick={() => onFrameOp("right")}>→</Btn>
          <Btn onClick={() => onFrameOp("reverse")}>反転</Btn>
          <Btn onClick={() => onFrameOp("pingpong")}>往復化</Btn>
          <Btn variant="danger" onClick={() => onFrameOp("del")} disabled={frames.length <= 1}>削除</Btn>
          <Btn variant="danger" onClick={() => onFrameOp("clearAll")} disabled={frames.length <= 1}>1枚に戻す</Btn>
        </div>
        <div className="flex flex-wrap gap-1 max-h-48 overflow-auto">
          {frames.map((f, i) => (
            <button key={i} type="button" onClick={() => setCurrent(i)} className={`rounded border p-0.5 ${i === current ? "border-amber-300" : "border-white/10"}`}>
              <PixThumb pix={f} size={40} />
              <div className="text-[9px] text-center text-slate-400">{i + 1}</div>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
