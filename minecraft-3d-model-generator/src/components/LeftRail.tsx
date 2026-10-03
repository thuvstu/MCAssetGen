"use client";
import { EFFECTS, RANKS } from "@/lib/forge";
import { useForge, type LeftTab } from "@/lib/store";
import ColorPanel from "./panels/ColorPanel";
import EffectsPanel from "./panels/EffectsPanel";
import LineagePanel from "./panels/LineagePanel";
import MotionPanel from "./panels/MotionPanel";
import ShapePanel from "./panels/ShapePanel";

const TABS: { k: LeftTab; label: string; en: string }[] = [
  { k: "shape", label: "造形", en: "FORM" },
  { k: "lineage", label: "系譜", en: "TIER" },
  { k: "fx", label: "効果", en: "FX" },
  { k: "color", label: "配色", en: "COLOR" },
  { k: "motion", label: "動き", en: "MOTION" },
];

export default function LeftRail() {
  const tab = useForge((s) => s.tab);
  const setTab = useForge((s) => s.setTab);
  const fxOn = useForge((s) => EFFECTS.filter((e) => s.params.effects[e.id]?.on).length);
  const tier = useForge((s) => s.params.tier);
  const overdrive = useForge((s) => s.params.overdrive);
  return (
    <div className="flex min-h-full flex-col">
      <div role="tablist" aria-label="編集パネル" className="sticky top-0 z-10 grid grid-cols-5 border-b border-ink/30 bg-paper/95 backdrop-blur-[2px]">
        {TABS.map((t) => {
          const on = tab === t.k;
          return (
            <button
              key={t.k}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.k)}
              className={`relative py-2 outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vermilion ${
                on ? "text-ink" : "text-ink/55 hover:text-ink"
              }`}
            >
              <span className="block font-display text-[14px] leading-tight">{t.label}</span>
              <span className="block font-mono text-[7.5px] tracking-[0.14em] opacity-70">
                {t.k === "lineage" ? `${RANKS[tier].no}${overdrive ? "+" : ""}` : t.en}
                {t.k === "fx" && fxOn > 0 ? ` · ${fxOn}` : ""}
              </span>
              <span className={`absolute inset-x-2 bottom-[-1px] h-[3px] transition-colors ${on ? "bg-vermilion" : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>
      <div className="flex-1 pb-16" role="tabpanel">
        {tab === "shape" && <ShapePanel />}
        {tab === "lineage" && <LineagePanel />}
        {tab === "fx" && <EffectsPanel />}
        {tab === "color" && <ColorPanel />}
        {tab === "motion" && <MotionPanel />}
      </div>
    </div>
  );
}
