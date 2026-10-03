import { EFFECT_PRESETS, EFFECT_PRESET_LIST } from "../../engine";
import type { Element } from "../../engine";
import { ELEMENT_LABELS } from "../../generator/catalog";
import { Segmented, Slider, Toggle } from "../ui";
import type { TabBaseProps } from "./shared";

const ELEMENTS = Object.entries(ELEMENT_LABELS).map(([id, label]) => ({ id: id as Element, label }));

export function FxTab({ opts, update }: TabBaseProps) {
  return (
    <div className="space-y-4 rounded-[4px] border border-[#29233f] bg-[#14181c] p-5">
      <h3 className="text-sm font-bold text-slate-100">Elemental Infusion &amp; FX（属性・演出）</h3>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Effect Preset（一括適用）</label>
        <div className="grid grid-cols-3 gap-1.5">
          {EFFECT_PRESET_LIST.map((p) => (
            <button
              key={p}
              onClick={() =>
                update({
                  effectPreset: p,
                  ...EFFECT_PRESETS[p],
                  runePulse: opts.runeInlay && !!EFFECT_PRESETS[p].runePulse,
                })
              }
              className={`rounded-[3px] py-1.5 text-xs font-semibold border transition-all ${
                opts.effectPreset === p
                  ? "bg-emerald-600/15 border-emerald-500 text-amber-300"
                  : "bg-[#1d242a]/60 border-[#3a3357]/60 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Elemental Infusion（属性）</label>
        <Segmented value={opts.element} onChange={(v) => update({ element: v })} options={ELEMENTS} cols={4} />
      </div>

      {opts.element !== "none" && (
        <Slider label="Elemental Saturation" value={opts.elementIntensity} min={0.1} max={1} step={0.05} onChange={(v) => update({ elementIntensity: v })} />
      )}

      <div className="space-y-2 border-t border-[#29233f] pt-3">
        <Toggle label="Specular Sheen Sweep" desc="Dynamic metallic gleam passing across the blade." checked={opts.sheen} onChange={(v) => update({ sheen: v })}>
          <Slider label="Sheen Speed" value={opts.sheenSpeed} min={0.2} max={2} step={0.1} onChange={(v) => update({ sheenSpeed: v })} />
          <Slider label="Sheen Angle Offset" value={opts.sheenPos} min={0} max={1} step={0.02} onChange={(v) => update({ sheenPos: v })} />
        </Toggle>

        <Toggle label="Sparkle Particle Glints" desc="Gleaming glints scattering along the blade." checked={opts.sparkle} onChange={(v) => update({ sparkle: v })}>
          <Slider label="Glint Density" value={opts.sparkleDensity} min={0.1} max={1} step={0.05} onChange={(v) => update({ sparkleDensity: v })} />
        </Toggle>

        <Toggle label="Legendary Tip Glow" desc="Luminescent burst at the very tip." checked={opts.tipGlow} onChange={(v) => update({ tipGlow: v })} />

        <Toggle label="Floating Element Particles" desc="Drifting embers, frost motes, void dust." checked={opts.particles} onChange={(v) => update({ particles: v })} />

        <Toggle label="Crackling Lightning Arc" desc="Branched lightning crackling along the blade." checked={opts.lightning} onChange={(v) => update({ lightning: v })} />

        <Toggle label="Orbiting Shatter Shards" desc="Broken shards circling the blade." checked={opts.shatter} onChange={(v) => update({ shatter: v })} />

        <Toggle label="Pulsing Runic Glyphs" desc="Blade runes throb with magical energy." checked={opts.runePulse} onChange={(v) => update({ runePulse: v })} />

        <Toggle label="Holographic Shimmer" desc="Subtle hue shift across the blade surface." checked={opts.holographic} onChange={(v) => update({ holographic: v })} />

        <Toggle label="Mythic Ambient Aura Bloom" desc="Soft glow behind the preview based on rarity tier." checked={opts.auraBloom} onChange={(v) => update({ auraBloom: v })} />
      </div>
    </div>
  );
}
