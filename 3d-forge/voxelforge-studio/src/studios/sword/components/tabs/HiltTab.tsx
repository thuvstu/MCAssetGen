import type { GemShape, GuardStyle, HandleStyle, PommelStyle } from "../../engine";
import { GRIP_LABELS, GUARD_LABELS, POMMEL_LABELS } from "../../generator/catalog";
import { ColorField, Segmented, Slider, Toggle } from "../ui";
import type { TabBaseProps } from "./shared";

const GUARD_STYLES = Object.entries(GUARD_LABELS).map(([id, label]) => ({ id: id as GuardStyle, label }));
const HANDLE_STYLES = Object.entries(GRIP_LABELS).map(([id, label]) => ({ id: id as HandleStyle, label }));
const POMMELS = Object.entries(POMMEL_LABELS).map(([id, label]) => ({ id: id as PommelStyle, label }));

const GEM_SHAPES: { id: GemShape; label: string }[] = [
  { id: "diamond", label: "Diamond" },
  { id: "circle", label: "Round" },
  { id: "hex", label: "Hexagon" },
  { id: "teardrop", label: "Teardrop" },
  { id: "marquise", label: "Marquise" },
  { id: "star", label: "Star" },
];

export function HiltTab({ opts, update }: TabBaseProps) {
  return (
    <div className="space-y-4 rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
      <h3 className="text-sm font-bold text-slate-100">Hilt &amp; Guard Ornaments（鍔・柄・柄頭）</h3>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Crossguard Style（鍔）</label>
        <Segmented value={opts.guardStyle} onChange={(v) => update({ guardStyle: v })} options={GUARD_STYLES} cols={4} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Slider label="Guard Width" value={opts.guardWidth} min={1} max={8} onChange={(v) => update({ guardWidth: v })} />
        <Slider label="Handle Length" value={opts.handleLength} min={2} max={5} onChange={(v) => update({ handleLength: v })} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Handle Grip Wrap（柄巻き）</label>
        <Segmented value={opts.handleStyle} onChange={(v) => update({ handleStyle: v })} options={HANDLE_STYLES} cols={4} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pommel Counterweight（柄頭）</label>
        <Segmented value={opts.pommelStyle} onChange={(v) => update({ pommelStyle: v })} options={POMMELS} cols={5} />
      </div>

      <div className="space-y-2 border-t border-[#29233f] pt-3">
        <Toggle
          label="Filigree Chiseled Gold Inlay（金銀彫金）"
          desc="Baroque swirling relief on the crossguard metal."
          checked={opts.filigree}
          onChange={(v) => update({ filigree: v })}
        />
        <Toggle label="Guard Gem Inlay（宝玉象嵌）" desc="Faceted gemstone set into the guard center." checked={opts.gem} onChange={(v) => update({ gem: v })}>
          <ColorField label="Gem Color" value={opts.gemColor} onChange={(v) => update({ gemColor: v })} />
          <Segmented value={opts.gemShape} onChange={(v) => update({ gemShape: v })} options={GEM_SHAPES} cols={3} />
          <Toggle label="Gem Pulsing Glow" checked={opts.gemGlow} onChange={(v) => update({ gemGlow: v })} />
        </Toggle>
      </div>
    </div>
  );
}
