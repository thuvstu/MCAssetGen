import { DETAIL_LEVELS } from "../../engine/options";
import { ColorField, Segmented, Slider, Toggle } from "../ui";
import type { TabBaseProps } from "./shared";

export function SpursTab({ opts, update }: TabBaseProps) {
  return (
    <div className="space-y-4 rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
      <h3 className="text-sm font-bold text-slate-100">Attachments / アタッチメント</h3>
      <p className="text-[11px] text-slate-400">
        刀身にトゲ・骨突起・結晶クラスター・口金を追加します。
      </p>

      <Toggle label="Barbed Blade Spurs（ブレードスパイク）" desc="Razor flanges jutting perpendicular from the blade." checked={opts.spurs} onChange={(v) => update({ spurs: v })}>
        <Slider label="Spur Count" value={opts.spurCount} min={1} max={6} onChange={(v) => update({ spurCount: v })} />
      </Toggle>

      <Toggle label="Bone Spurs（骨棘）" desc="Jagged bone spurs growing along one edge." checked={opts.boneSpurs} onChange={(v) => update({ boneSpurs: v })} />

      <Toggle label="Crystal Shard Clusters（結晶クラスター）" desc="Faceted gems erupting along the blade flats." checked={opts.crystalShards} onChange={(v) => update({ crystalShards: v })}>
        <ColorField label="Shard Color" value={opts.shardColor} onChange={(v) => update({ shardColor: v })} />
      </Toggle>

      <Toggle label="Pommel Brass Band（口金バンド）" desc="Decorative golden band wrapping the top of the grip." checked={opts.pommelBand} onChange={(v) => update({ pommelBand: v })} />

      <div className="border-t border-[#29233f] pt-3 space-y-2">
        <span className="block text-xs font-semibold text-slate-300">Detail Level（描画モード）</span>
        <Segmented
          value={opts.detailLevel}
          onChange={(v) => update({ detailLevel: v })}
          options={DETAIL_LEVELS}
          cols={4}
        />
        <p className="text-[11px] text-slate-400">
          {DETAIL_LEVELS.find((d) => d.id === opts.detailLevel)?.desc}
        </p>
        <Toggle label="2× Anti-Aliasing" desc="Render at 2× and downsample for smoother diagonal lines." checked={opts.antiAlias} onChange={(v) => update({ antiAlias: v })} />
      </div>
    </div>
  );
}
