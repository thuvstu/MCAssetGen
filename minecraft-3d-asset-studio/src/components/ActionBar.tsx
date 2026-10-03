"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Star, Swords, Timer, X } from "lucide-react";
import { ACTION_DEFINITIONS, ACTION_LIST } from "@/lib/animation/actions";
import { TEMPORARY_MODE_LIST, TEMPORARY_MODES } from "@/lib/variants/modes";
import { ActionId, TemporaryModeId } from "@/types/model";

interface ActionBarProps {
  activeMode: TemporaryModeId | null;
  modeRemaining: number;
  signature: ActionId[];
  onAction: (id: ActionId) => void;
  onMode: (id: TemporaryModeId) => void;
  onCancelMode: () => void;
}

const CATEGORY_STYLE = {
  attack: "border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/25",
  magic: "border-sky-500/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/25",
  special: "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/25",
} as const;

const CATEGORY_LABEL = { attack: "攻撃", magic: "魔法", special: "特殊" } as const;

export function ActionBar({ activeMode, modeRemaining, signature, onAction, onMode, onCancelMode }: ActionBarProps) {
  const [showAll, setShowAll] = useState(false);
  const mode = activeMode ? TEMPORARY_MODES[activeMode] : null;

  return (
    <div className="pointer-events-auto flex max-w-full flex-col items-center gap-1.5">
      {mode && (
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-[11px] text-white shadow-lg backdrop-blur">
          <Timer className="h-3.5 w-3.5 animate-pulse" style={{ color: mode.tint ?? "#7dd3fc" }} />
          <span className="font-bold">{mode.labelJa}</span>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${modeRemaining * 100}%`, backgroundColor: mode.tint ?? "#7dd3fc" }} />
          </div>
          <span className="w-8 text-right font-mono text-[10px] text-neutral-300">{(modeRemaining * mode.duration).toFixed(1)}s</span>
          <button onClick={onCancelMode} className="rounded-full p-0.5 text-neutral-300 hover:bg-white/20 hover:text-white" aria-label="Cancel mode">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {showAll && (
        <div className="max-w-3xl rounded-xl border border-[#2d3240] bg-[#161822]/95 p-2 shadow-2xl backdrop-blur">
          {(["attack", "magic", "special"] as const).map((category) => (
            <div key={category} className="mb-1 flex flex-wrap items-center gap-1 last:mb-0">
              <span className="w-8 text-[10px] font-bold text-neutral-500">{CATEGORY_LABEL[category]}</span>
              {ACTION_LIST.filter((action) => action.category === category).map((action) => (
                <button key={action.id} onClick={() => onAction(action.id)} className={`rounded-md border px-2 py-0.5 text-[10.5px] font-semibold transition active:scale-95 ${CATEGORY_STYLE[action.category]}`} title={`${action.label} (${action.duration}s)`}>
                  {action.labelJa}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-1 rounded-xl border border-[#2d3240] bg-[#161822]/90 p-1.5 shadow-2xl backdrop-blur">
        <span className="flex items-center gap-1 px-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
          <Star className="h-3 w-3 fill-amber-300" /> 固有技
        </span>
        {signature.map((id, index) => {
          const action = ACTION_DEFINITIONS[id];
          return (
            <button key={id} onClick={() => onAction(id)} className={`rounded-md border px-2 py-1 text-[11px] font-bold transition active:scale-95 ${CATEGORY_STYLE[action.category]}`} title={`キー ${index + 1}`}>
              <span className="mr-1 font-mono text-[9px] opacity-60">{index + 1}</span>
              {action.labelJa}
            </button>
          );
        })}
        <button onClick={() => setShowAll((value) => !value)} className="flex items-center gap-0.5 rounded-md border border-[#3a4050] px-2 py-1 text-[11px] text-neutral-300 hover:text-white">
          <Swords className="h-3 w-3" /> 全{ACTION_LIST.length}技 {showAll ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>
        <span className="mx-1 h-5 w-px bg-[#2d3240]" />
        <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Mode</span>
        {TEMPORARY_MODE_LIST.map((definition) => {
          const active = activeMode === definition.id;
          return (
            <button
              key={definition.id}
              onClick={() => onMode(definition.id)}
              title={`${definition.description} (${definition.duration}s)`}
              className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition active:scale-95 ${active ? "border-white bg-white text-black" : "border-[#3a4050] bg-[#101217] text-neutral-200 hover:border-white/50"}`}
              style={!active && definition.tint ? { boxShadow: `inset 0 -2px 0 ${definition.tint}` } : undefined}
            >
              {definition.labelJa}
            </button>
          );
        })}
      </div>
    </div>
  );
}
