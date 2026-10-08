import type { Palette } from "../../engine";
import { PALETTE_KITS } from "../../generator/catalog";
import { ColorField, Slider, Toggle } from "../ui";
import type { TabBaseProps } from "./shared";

const PALETTE_FIELDS: { key: keyof Palette; label: string }[] = [
  { key: "blade", label: "Blade Face" },
  { key: "bladeEdge", label: "Blade Edge" },
  { key: "bladeCore", label: "Blade Core" },
  { key: "guard", label: "Crossguard" },
  { key: "guardAccent", label: "Guard Accent" },
  { key: "handle", label: "Handle Grip" },
  { key: "handleAccent", label: "Grip Accent" },
  { key: "pommel", label: "Pommel" },
  { key: "outline", label: "Outline Base" },
  { key: "spur", label: "Spur / Flange" },
];

export function ColorsTab({
  opts,
  update,
  setPaletteField,
  onRoll,
  locked,
}: TabBaseProps & {
  setPaletteField: (patch: Partial<Palette>) => void;
  onRoll: () => void;
  locked: boolean;
}) {
  return (
    <div className="space-y-4 rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-100">Color Palette &amp; Shader（配色・陰影）</h3>
        <button
          onClick={onRoll}
          disabled={locked}
          className="rounded bg-[#1d242a] hover:bg-slate-700 px-2.5 py-1 text-xs text-slate-300 font-semibold"
        >
          配色だけ再生成
        </button>
      </div>

      {/* Curated palette kits */}
      <div>
        <span className="mb-1.5 block text-xs font-semibold text-slate-300">
          Curated Palette Kits（26種の厳選パレット）
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1">
          {PALETTE_KITS.map((kit) => (
            <button
              key={kit.id}
              onClick={() =>
                update({
                  palette: { ...kit.palette },
                  tipColor: kit.palette.bladeEdge,
                  midGradientColor: kit.palette.blade,
                  gemColor: kit.accent,
                  runeColor: kit.accent,
                  shardColor: kit.accent,
                })
              }
              className="flex items-center gap-1.5 rounded-[3px] border border-[#2b333b] bg-[#0b0e11] px-2 py-1.5 text-left hover:border-emerald-500 transition-all"
            >
              <span className="flex shrink-0 -space-x-1">
                <i className="h-3 w-3 rounded-full border border-black/40" style={{ background: kit.palette.bladeEdge }} />
                <i className="h-3 w-3 rounded-full border border-black/40" style={{ background: kit.palette.blade }} />
                <i className="h-3 w-3 rounded-full border border-black/40" style={{ background: kit.accent }} />
              </span>
              <span className="truncate text-[10px] font-semibold text-slate-300">
                {kit.label.split(" / ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PALETTE_FIELDS.map((f) => (
          <ColorField
            key={f.key}
            label={f.label}
            value={opts.palette[f.key]}
            onChange={(v) => setPaletteField({ [f.key]: v })}
          />
        ))}
      </div>

      {/* Value ladder preview */}
      <div>
        <span className="mb-1 block text-xs font-semibold text-slate-300">
          Value Ladder (刃先 → 刀身 → 芯 → 輪郭)
        </span>
        <div className="flex overflow-hidden rounded-[3px] border border-slate-700">
          {[opts.palette.bladeEdge, opts.palette.blade, opts.palette.bladeCore, opts.palette.outline].map((c, i) => (
            <div key={i} className="flex-1 h-5" style={{ background: c }} title={c} />
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t border-[#29233f] pt-3">
        <Slider label="Shading Contrast" value={opts.shading} min={0.1} max={1} step={0.05} onChange={(v) => update({ shading: v })} />
        <Slider label="Grain / Micro-Texture Noise" value={opts.noise} min={0} max={1} step={0.05} onChange={(v) => update({ noise: v })} />

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300">Outline Mode</span>
          <div className="flex gap-1">
            {(["dark", "tinted", "gold", "none"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => update({ outlineColorMode: mode })}
                className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase ${
                  opts.outlineColorMode === mode
                    ? "bg-emerald-600 text-white"
                    : "bg-[#1d242a] text-slate-400 hover:bg-slate-700"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <Toggle label="Item Silhouette Outline" checked={opts.outline} onChange={(v) => update({ outline: v })} />
      </div>
    </div>
  );
}
