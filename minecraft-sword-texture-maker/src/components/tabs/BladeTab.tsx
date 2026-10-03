import { useState } from "react";
import type { Silhouette, SwordOptions } from "../../engine";
import { SURFACE_LABELS } from "../../engine/surfaces";
import {
  BLADE_LABELS,
  SILHOUETTE_CATEGORIES,
  SURFACE_CATEGORIES,
  type SilhouetteCategory,
  type SurfaceCategory,
} from "../../generator/catalog";
import { ColorField, Segmented, Slider, Toggle } from "../ui";
import type { TabBaseProps } from "./shared";

const ALL_SILHOUETTES = Object.entries(BLADE_LABELS).map(([id, label]) => ({
  id: id as Silhouette,
  label,
}));

const ALL_SURFACES = Object.entries(SURFACE_LABELS).map(([id, label]) => ({
  id: id as SwordOptions["surface"],
  label: label.split(" / ")[0] ?? label,
}));

export function BladeTab({ opts, update }: TabBaseProps) {
  const [silCat, setSilCat] = useState<SilhouetteCategory>("all");
  const [surfCat, setSurfCat] = useState<SurfaceCategory>("all");

  const activeSilCat = SILHOUETTE_CATEGORIES.find((c) => c.id === silCat);
  const visibleSilhouettes = activeSilCat?.items
    ? ALL_SILHOUETTES.filter((s) => activeSilCat.items!.includes(s.id))
    : ALL_SILHOUETTES;

  const activeSurfCat = SURFACE_CATEGORIES.find((c) => c.id === surfCat);
  const visibleSurfaces = activeSurfCat?.items
    ? ALL_SURFACES.filter((s) => activeSurfCat.items!.includes(s.id))
    : ALL_SURFACES;

  return (
    <div className="space-y-4 rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-100">Blade Architecture（刀身設計）</h3>
        <span className="text-[11px] font-mono text-amber-300">
          {BLADE_LABELS[opts.silhouette]} · {SURFACE_LABELS[opts.surface].split(" / ")[0]}
        </span>
      </div>

      {/* Silhouette selector with category filter */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <label className="text-xs font-semibold text-slate-300">Blade Silhouette（型）</label>
          <div className="flex flex-wrap gap-1">
            {SILHOUETTE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSilCat(c.id)}
                className={`rounded-[2px] px-2 py-0.5 text-[10px] font-semibold transition-all ${
                  silCat === c.id
                    ? "bg-emerald-600 text-white"
                    : "bg-[#1d242a] text-slate-400 hover:bg-slate-700"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <Segmented
          value={opts.silhouette}
          onChange={(v) => update({ silhouette: v })}
          options={visibleSilhouettes}
          cols={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Slider label="Blade Length" value={opts.bladeLength} min={5} max={12} onChange={(v) => update({ bladeLength: v })} />
        <Slider label="Blade Width" value={opts.bladeWidth} min={1} max={4} onChange={(v) => update({ bladeWidth: v })} />
      </div>

      {/* Surface selector with category filter */}
      <div className="space-y-2 border-t border-[#29233f] pt-3">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <label className="text-xs font-semibold text-slate-300">Surface Material（素材・表面模様）</label>
          <div className="flex flex-wrap gap-1">
            {SURFACE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSurfCat(c.id)}
                className={`rounded-[2px] px-2 py-0.5 text-[10px] font-semibold transition-all ${
                  surfCat === c.id
                    ? "bg-emerald-600 text-white"
                    : "bg-[#1d242a] text-slate-400 hover:bg-slate-700"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <Segmented
          value={opts.surface}
          onChange={(v) => update({ surface: v })}
          options={visibleSurfaces}
          cols={3}
        />

        <Toggle label="Fuller (Blood Groove / 樋)" desc="Lightweight recess running along the spine." checked={opts.fuller} onChange={(v) => update({ fuller: v })}>
          <Slider label="Fuller Length" value={opts.fullerLength} min={0.3} max={1} step={0.05} onChange={(v) => update({ fullerLength: v })} />
        </Toggle>

        <Toggle label="Serrated Edge Teeth（鋸刃）" desc="Jagged cutting teeth along the blade." checked={opts.serrated} onChange={(v) => update({ serrated: v })} />

        <Toggle label="Runic Inlay Glyphs（ルーン象嵌）" desc="Glowing ancient script carved down the flat." checked={opts.runeInlay} onChange={(v) => update({ runeInlay: v })}>
          <ColorField label="Rune Color" value={opts.runeColor} onChange={(v) => update({ runeColor: v })} />
        </Toggle>

        <Toggle label="Ombre Multi-Gradient（縦グラデーション）" desc="Base → midtone → tip highlight." checked={opts.gradientBlade} onChange={(v) => update({ gradientBlade: v })}>
          <div className="grid grid-cols-2 gap-2">
            <ColorField label="Mid Color" value={opts.midGradientColor} onChange={(v) => update({ midGradientColor: v })} />
            <ColorField label="Tip Color" value={opts.tipColor} onChange={(v) => update({ tipColor: v })} />
          </div>
        </Toggle>

        <Toggle label="Spine → Edge Gradient（煉獄）" desc="棟が冷たく、刃先が燃え上がる煉獄の刃。研ぎの方向が変わるグラデーション。" checked={opts.edgeGradient} onChange={(v) => update({ edgeGradient: v })} />

        <Toggle label="Ricasso（刃元）" desc="鍔の上の研がれていない四角い区画。実在剣の構造。" checked={opts.ricasso} onChange={(v) => update({ ricasso: v })} />

        <Toggle label="Horimono（彫り物）" desc="棟に沿って刻まれた装飾彫刻。" checked={opts.horimono} onChange={(v) => update({ horimono: v })} />

        <Toggle label="Bevel Depth Line（鎬筋）" desc="Shaded line separating edge from flat." checked={opts.bevelLine} onChange={(v) => update({ bevelLine: v })} />
        <Toggle label="Extra Edge Highlight（刃先ハイライト）" desc="Bright polishing pass on the cutting edge." checked={opts.edgeHighlight} onChange={(v) => update({ edgeHighlight: v })} />
      </div>
    </div>
  );
}
