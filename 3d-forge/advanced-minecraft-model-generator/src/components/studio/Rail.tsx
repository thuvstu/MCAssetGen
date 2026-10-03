"use client";

import React from "react";

export type PanelId = "type" | "evolution" | "shape" | "floating" | "motion" | "colors";

interface Props {
  active: PanelId;
  onSelect: (id: PanelId) => void;
}

const ITEMS: { id: PanelId; label: string; en: string; idx: string }[] = [
  { id: "type", label: "型と属性", en: "TYPE", idx: "01" },
  { id: "evolution", label: "進化と形態", en: "EVOLVE", idx: "02" },
  { id: "shape", label: "形状と装飾", en: "FORM", idx: "03" },
  { id: "floating", label: "浮遊物", en: "ORBIT", idx: "04" },
  { id: "motion", label: "動作とVFX", en: "MOTION", idx: "05" },
  { id: "colors", label: "配色と生地", en: "MATERIAL", idx: "06" },
];

export function Rail({ active, onSelect }: Props) {
  return (
    <nav className="flex shrink-0 flex-row overflow-x-auto border-b border-line bg-panel lg:h-full lg:w-[112px] lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r">
      {ITEMS.map((item) => {
        const on = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            title={`${item.idx} ${item.label} (${item.idx})`}
            className={`group relative flex shrink-0 items-baseline gap-2 px-3.5 py-3 text-left transition-colors lg:gap-1.5 lg:py-3.5 ${
              on ? "text-bone" : "text-ash hover:text-bone"
            }`}
          >
            <span
              className={`absolute bottom-0 left-0 h-[2px] w-full transition-colors lg:bottom-auto lg:left-0 lg:top-0 lg:h-full lg:w-[2px] ${
                on ? "bg-ember" : "bg-transparent"
              }`}
            />
            <span
              className={`num text-[9px] transition-colors ${
                on ? "text-ember" : "text-ash/55 group-hover:text-ash"
              }`}
            >
              {item.idx}
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-[12px] font-medium leading-none">{item.label}</span>
              <span className="lbl text-[8.5px] opacity-70">{item.en}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
