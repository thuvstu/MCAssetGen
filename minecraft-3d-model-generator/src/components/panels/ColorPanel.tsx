"use client";
import { EFFECTS, THEMES } from "@/lib/forge";
import type { PaletteRole } from "@/lib/forge/types";
import { useForge } from "@/lib/store";
import { Btn, Choice, Section, Slider, Swatch } from "../ui";

const ROLES: { k: PaletteRole; label: string }[] = [
  { k: "base", label: "地色 / BODY" },
  { k: "shade", label: "陰 / SHADE" },
  { k: "metal", label: "金具 / METAL" },
  { k: "glow", label: "発光 / EMISSIVE" },
];

export default function ColorPanel() {
  const p = useForge((s) => s.params);
  const set = useForge((s) => s.set);
  const say = useForge((s) => s.say);
  const current = THEMES.find((t) => ROLES.every((r) => t.palette[r.k].toLowerCase() === p.palette[r.k].toLowerCase()));

  const unifyFx = () => {
    const effects = { ...p.effects };
    EFFECTS.forEach((e) => {
      if (effects[e.id].on) effects[e.id] = { ...effects[e.id], color: p.palette.glow };
    });
    set({ effects });
    say("効果の色を発光色に統一しました");
  };
  const remix = () => {
    const pick = () => THEMES[Math.floor(Math.random() * THEMES.length)].palette;
    set({ palette: { base: pick().base, shade: pick().shade, metal: pick().metal, glow: pick().glow } });
  };

  return (
    <>
      <Section no="06" title="配色帖" en={`THEMES · ${THEMES.length}`}>
        <div className="grid grid-cols-4 gap-1.5">
          {THEMES.map((t) => {
            const on = current?.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => set({ palette: { ...t.palette } })}
                aria-pressed={on}
                title={`${t.name} ${t.en}`}
                className={`group border p-1 text-left outline-none transition-all duration-100 focus-visible:ring-2 focus-visible:ring-vermilion ${
                  on ? "border-ink bg-paper shadow-[2px_2px_0_rgba(21,19,15,0.85)]" : "border-ink/20 hover:border-ink/60"
                }`}
              >
                <span className="flex h-7">
                  <span className="flex-[3]" style={{ background: t.palette.base }} />
                  <span className="flex-[2]" style={{ background: t.palette.shade }} />
                  <span className="flex-1" style={{ background: t.palette.metal }} />
                  <span className="flex-1" style={{ background: t.palette.glow, boxShadow: `0 0 8px ${t.palette.glow}` }} />
                </span>
                <span className="mt-1 block font-display text-[12px] leading-none text-ink">{t.name}</span>
                <span className="block font-mono text-[7.5px] tracking-[0.12em] text-ink/50">{t.en}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section no="07" title="調色" en="CUSTOM">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          {ROLES.map((r) => (
            <Swatch key={r.k} label={r.label} value={p.palette[r.k]} onChange={(v) => set({ palette: { ...p.palette, [r.k]: v } })} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <Btn onClick={() => set({ palette: { ...p.palette, base: p.palette.shade, shade: p.palette.base } })}>地と陰を入替</Btn>
          <Btn onClick={remix}>配色を混ぜる</Btn>
          <Btn onClick={unifyFx}>効果色を統一</Btn>
          <Btn onClick={() => set({ palette: { ...p.palette, glow: p.palette.metal, metal: p.palette.glow } })}>金具と発光を入替</Btn>
        </div>
      </Section>

      <Section no="08" title="階調" en="GRADIENT">
        <Choice
          cols={5}
          value={p.grad.mode}
          onChange={(v) => set({ grad: { ...p.grad, mode: v } })}
          options={[
            { value: "none", label: "無地", sub: "FLAT" },
            { value: "rise", label: "昇光", sub: "RISE" },
            { value: "fall", label: "沈影", sub: "FALL" },
            { value: "heat", label: "熾火", sub: "HEAT" },
            { value: "abyss", label: "深淵", sub: "ABYSS" },
          ]}
        />
        {p.grad.mode !== "none" && (
          <Slider label="階調の強さ" value={p.grad.power} min={0} max={1} step={0.05} onChange={(v) => set({ grad: { ...p.grad, power: v } })} />
        )}
        <p className="text-[10px] leading-[1.7] text-ink/60">
          世界高さに沿ってアトラスの塗りへ階調をかけます。昇光＝上ほど明るく、沈影＝上ほど暗く、熾火＝先端が発光色へ溶け、深淵＝足元が闇に沈む。UV共有中は代表要素の高さで塗られます。
        </p>
      </Section>
    </>
  );
}
