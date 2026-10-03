"use client";

import type { FloatingRigConfig } from "@/db/schema";
import { CORE_STYLES, CROWN_STYLES } from "@/lib/staffRig";
type CrownStyle = (typeof CROWN_STYLES)[number]["id"];
import { Orbit, Sparkles } from "lucide-react";

interface StaffFxPanelProps {
  fx: FloatingRigConfig;
  floaterCount: number;
  onChange: (next: FloatingRigConfig) => void;
}

export default function StaffFxPanel({ fx, floaterCount, onChange }: StaffFxPanelProps) {
  const set = <K extends keyof FloatingRigConfig>(key: K, value: FloatingRigConfig[K]) => {
    onChange({ ...fx, [key]: value });
  };

  return (
    <div className="pt-3 border-t border-[#262936] space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#C084FC] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          浮遊リグ / idle_mana
        </span>
        <span className="font-mono text-[10px] text-[#94A3B8]">{floaterCount} floaters</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {CROWN_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => set("crownStyle", style.id)}
            className={`px-2 py-1.5 rounded border text-left ${
              fx.crownStyle === style.id
                ? "bg-[#8B5CF6]/20 border-[#8B5CF6] text-white"
                : "bg-[#0D0E12] border-[#262936] text-[#94A3B8]"
            }`}
          >
            <div className="text-xs font-bold">{style.label}</div>
            <div className="text-[10px] text-[#64748B] leading-tight">{style.detail}</div>
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <span className="text-[11px] text-[#94A3B8]">核の型</span>
        <div className="grid grid-cols-3 gap-1">
          {CORE_STYLES.map((core) => (
            <button
              key={core.id}
                onClick={() => set("coreStyle", core.id as FloatingRigConfig["coreStyle"])}
              className={`py-1 rounded border text-[11px] ${
                fx.coreStyle === core.id
                  ? "bg-[#3B82F6] border-[#3B82F6] text-white"
                  : "bg-[#0D0E12] border-[#262936] text-[#94A3B8]"
              }`}
            >
              {core.label}
            </button>
          ))}
        </div>
      </div>

      <CountRow
        label="周回レイヤー"
        value={fx.orbitLayers}
        options={[0, 1, 2, 3]}
        onPick={(n) => set("orbitLayers", n)}
      />
      <CountRow
        label="各層の衛星"
        value={fx.satellites}
        options={[3, 4, 5, 6]}
        onPick={(n) => set("satellites", n)}
      />
      <CountRow
        label="光輪"
        value={fx.haloRings}
        options={[0, 1, 2]}
        onPick={(n) => set("haloRings", n)}
      />
      <CountRow
        label="マナモート"
        value={fx.motes}
        options={[0, 6, 8, 12]}
        onPick={(n) => set("motes", n)}
      />

      <Slider
        label="1周の長さ"
        value={fx.loopSeconds}
        min={2.4}
        max={8}
        step={0.2}
        unit="s"
        onChange={(n) => set("loopSeconds", n)}
      />
      <Slider
        label="浮遊幅"
        value={fx.bob}
        min={0}
        max={1.2}
        step={0.05}
        unit="vxl"
        onChange={(n) => set("bob", n)}
      />

      <div className="grid grid-cols-2 gap-1.5">
        <Toggle
          label="発光パルス"
          on={fx.pulse}
          onClick={() => set("pulse", !fx.pulse)}
        />
        <Toggle
          label="プレビュー演出"
          on={fx.previewFx}
          onClick={() => set("previewFx", !fx.previewFx)}
        />
      </div>

      <p className="text-[10px] leading-relaxed text-[#64748B] flex gap-1.5">
        <Orbit className="w-3.5 h-3.5 shrink-0 text-[#8B5CF6]" />
        浮遊物は冠の中心を原点に共有し、Y回転で周回します。ビューポートの動きは Blockbench の idle_mana と同じです。Java の item JSON は静止ポーズです。
      </p>
    </div>
  );
}

function CountRow({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: number;
  options: number[];
  onPick: (n: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#94A3B8]">{label}</span>
        <span className="font-mono text-[#F1F5F9]">{value}</span>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((n) => (
          <button
            key={n}
            onClick={() => onPick(n)}
            className={`py-1 rounded border font-mono text-[11px] ${
              value === n
                ? "bg-[#8B5CF6] border-[#8B5CF6] text-white"
                : "bg-[#0D0E12] border-[#262936] text-[#94A3B8]"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#94A3B8]">{label}</span>
        <span className="font-mono text-[#F1F5F9]">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-[#0D0E12] rounded-lg cursor-pointer accent-[#8B5CF6]"
      />
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between px-2 py-1.5 rounded border text-[11px] ${
        on
          ? "bg-[#8B5CF6]/15 border-[#8B5CF6]/70 text-[#C084FC]"
          : "bg-[#0D0E12] border-[#262936] text-[#64748B]"
      }`}
    >
      <span>{label}</span>
      <span className="font-mono">{on ? "ON" : "OFF"}</span>
    </button>
  );
}


