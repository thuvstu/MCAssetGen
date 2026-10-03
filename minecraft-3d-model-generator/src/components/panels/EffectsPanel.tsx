"use client";
import { useState } from "react";
import { EFFECTS, EFFECT_CATS } from "@/lib/forge";
import type { EffectCat } from "@/lib/forge/effects";
import { useForge } from "@/lib/store";
import { Btn, Section, Slider } from "../ui";

export default function EffectsPanel() {
  const p = useForge((s) => s.params);
  const setEffect = useForge((s) => s.setEffect);
  const set = useForge((s) => s.set);
  const say = useForge((s) => s.say);
  const [cat, setCat] = useState<EffectCat | "all">("all");
  const list = EFFECTS.filter((e) => cat === "all" || e.cat === cat);
  const activeCount = EFFECTS.filter((e) => p.effects[e.id]?.on).length;

  const surprise = () => {
    const pool = [...EFFECTS].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));
    const effects = { ...p.effects };
    Object.keys(effects).forEach((id) => (effects[id] = { ...effects[id], on: false }));
    pool.forEach((e) => (effects[e.id] = { ...effects[e.id], on: true, amount: 3 + Math.floor(Math.random() * 6) }));
    set({ effects });
    say(`おまかせ：${pool.map((e) => e.name).join("・")}`);
  };
  const clear = () => {
    const effects = { ...p.effects };
    Object.keys(effects).forEach((id) => (effects[id] = { ...effects[id], on: false }));
    set({ effects });
  };

  return (
    <>
      <Section no="05" title="効果" en={`EFFECTS · ${activeCount}/${EFFECTS.length}`}>
        <p className="text-[11px] leading-[1.7] text-ink/65">
          効果はそれぞれ独立したボーン（グループ）として生成され、ループ内の整数周期で動きます。
          <span className="text-ink">.bbmodel と GLB にはそのままアニメーションとして書き出されます。</span>
        </p>
        <div className="flex gap-1.5">
          <Btn tone="ink" onClick={surprise}>
            おまかせ
          </Btn>
          <Btn onClick={clear} disabled={activeCount === 0}>
            全て外す
          </Btn>
        </div>
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="効果の分類">
          {(["all", ...EFFECT_CATS] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={cat === c}
              onClick={() => setCat(c)}
              className={`border px-2 py-0.5 text-[11px] transition-colors duration-100 ${
                cat === c ? "border-ink bg-ink text-paper" : "border-ink/30 text-ink/70 hover:border-ink"
              }`}
            >
              {c === "all" ? "全て" : c}
              <span className="ml-1 font-mono text-[9px] opacity-60">
                {c === "all" ? EFFECTS.length : EFFECTS.filter((e) => e.cat === c).length}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <div className="divide-y divide-ink/15 border-b border-rule/70">
        {list.map((e) => {
          const s = p.effects[e.id];
          const on = !!s?.on;
          return (
            <div key={e.id} className={`transition-colors duration-100 ${on ? "bg-paper2/70" : ""}`}>
              <button
                type="button"
                onClick={() => setEffect(e.id, { on: !on })}
                aria-pressed={on}
                className="flex w-full items-center gap-3 px-4 py-2 text-left outline-none hover:bg-paper2/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vermilion"
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center border font-display text-[17px] leading-none transition-all duration-150 ${
                    on ? "border-ink text-ink shadow-[2px_2px_0_rgba(21,19,15,0.8)]" : "border-ink/25 text-ink/45"
                  }`}
                  style={{ background: on ? s.color : "transparent" }}
                >
                  {e.glyph}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className={`font-display text-[14px] ${on ? "text-ink" : "text-ink/80"}`}>{e.name}</span>
                    <span className="font-mono text-[8px] tracking-[0.16em] text-ink/45">{e.en}</span>
                  </span>
                  <span className="block truncate text-[10px] text-ink/55">{e.note}</span>
                </span>
                <span className="font-mono text-[9px] text-ink/40">{e.cat}</span>
                <span className={`h-2.5 w-2.5 shrink-0 border ${on ? "border-vermilion bg-vermilion" : "border-ink/40"}`} />
              </button>
              {on && (
                <div className="space-y-2.5 px-4 pb-3 pl-[60px]">
                  <Slider label="密度" value={s.amount} min={1} max={10} onChange={(v) => setEffect(e.id, { amount: v })} />
                  <Slider label="範囲" value={s.size} min={0.5} max={1.6} step={0.1} unit="×" onChange={(v) => setEffect(e.id, { size: v })} />
                  <div className="flex items-center gap-2">
                    <label className="relative h-6 w-6 shrink-0 cursor-pointer overflow-hidden border border-ink/60" style={{ background: s.color }}>
                      <input
                        type="color"
                        value={s.color}
                        onChange={(ev) => setEffect(e.id, { color: ev.target.value })}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        aria-label={`${e.name}の色`}
                      />
                    </label>
                    <span className="font-mono text-[10px] uppercase tabular-nums text-ink/60">{s.color}</span>
                    <button type="button" onClick={() => setEffect(e.id, { color: p.palette.glow })} className="ml-auto text-[10px] text-ink/60 underline decoration-dotted underline-offset-2 hover:text-vermilion">
                      発光色に合わせる
                    </button>
                    <button type="button" onClick={() => setEffect(e.id, { color: e.color })} className="text-[10px] text-ink/60 underline decoration-dotted underline-offset-2 hover:text-vermilion">
                      既定色
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
