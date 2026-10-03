"use client";
import { FAMILIES, KINDS, kindById } from "@/lib/forge";
import { useForge } from "@/lib/store";
import { Btn, Choice, Section, Slider, Toggle } from "../ui";

export default function ShapePanel() {
  const p = useForge((s) => s.params);
  const set = useForge((s) => s.set);
  const setKind = useForge((s) => s.setKind);
  const k = kindById(p.kind);

  return (
    <>
      <Section no="01" title="型" en="TYPE">
        <div className="space-y-2.5">
          {FAMILIES.map((fam) => (
            <div key={fam}>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] tracking-[0.3em] text-ink/60">{fam}</span>
                <span className="h-px flex-1 bg-ink/15" />
              </div>
              <div className="grid grid-cols-4 gap-px border border-ink/20 bg-ink/20">
                {KINDS.filter((x) => x.family === fam).map((x) => {
                  const on = x.id === p.kind;
                  return (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => setKind(x.id)}
                      aria-pressed={on}
                      className={`relative flex flex-col items-center py-1.5 outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-vermilion ${
                        on ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-paper2"
                      }`}
                    >
                      <span className={`absolute left-1 top-0.5 font-mono text-[8px] tabular-nums ${on ? "text-vermilion" : "text-ink/40"}`}>{x.no}</span>
                      <span className="font-display text-[20px] leading-tight">{x.name.length > 2 ? x.name.slice(0, 2) : x.name}</span>
                      <span className={`font-mono text-[8px] tracking-[0.14em] ${on ? "text-paper/60" : "text-ink/50"}`}>{x.en}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="border-l-2 border-vermilion/70 pl-2 text-[11px] leading-[1.7] text-ink/70">
          <span className="font-display text-[13px] text-ink">{k.name}</span>　{k.note}
        </p>
      </Section>

      <Section no="02" title="様式" en="STYLE">
        <Choice cols={Math.min(4, k.styles.length)} value={p.style} onChange={(v) => set({ style: v })} options={k.styles.map((s, i) => ({ value: i, label: s.label, sub: s.sub }))} />
      </Section>

      <Section no="03" title="寸法と装飾" en="DIMENSION">
        <Slider label={k.length.label} value={p.length} min={k.length.min} max={k.length.max} step={0.5} unit="/16" onChange={(v) => set({ length: v })} />
        <Slider label={k.width.label} value={p.width} min={k.width.min} max={k.width.max} step={0.5} unit="/16" onChange={(v) => set({ width: v })} />
        <Slider label="ルーン・字の数" value={p.runes} min={0} max={8} onChange={(v) => set({ runes: v })} />
        <div>
          <div className="mb-1 text-[12px] text-ink/80">装飾密度</div>
          <Choice
            cols={4}
            value={p.detail}
            onChange={(v) => set({ detail: v })}
            options={[
              { value: 0, label: "素", sub: "PLAIN" },
              { value: 1, label: "並", sub: "TRIM" },
              { value: 2, label: "上", sub: "FINE" },
              { value: 3, label: "極", sub: "ORNATE" },
            ]}
          />
        </div>
      </Section>

      <Section no="04" title="種と格子" en="SEED / GRID">
        <div className="flex items-stretch gap-2">
          <label className="flex-1 border border-ink/35 bg-paper2/60 px-3 py-1.5">
            <span className="block font-mono text-[9px] tracking-[0.2em] text-ink/55">SEED</span>
            <input
              type="number"
              min={0}
              max={99999}
              value={p.seed}
              onChange={(e) => set({ seed: Math.max(0, Math.min(99999, Number(e.target.value) || 0)) })}
              className="w-full bg-transparent font-mono text-[15px] tabular-nums text-ink outline-none"
              aria-label="シード値"
            />
          </label>
          <Btn tone="ink" onClick={() => set({ seed: Math.floor(Math.random() * 99999) })}>
            振り直す
          </Btn>
        </div>
        <Toggle label="ブロック格子にスナップ（0.5刻み・整数寸法）" checked={p.snap} onChange={(v) => set({ snap: v })} />
      </Section>
    </>
  );
}
