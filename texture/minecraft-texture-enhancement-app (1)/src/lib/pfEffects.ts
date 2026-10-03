import { Tex } from './tex';
import { Ctx, EffectDef as TexEffect, ParamDef } from './effects';
import { DECOR_FX, MATERIAL_FX, SPECIAL_FX } from './pfEffects2';
import { EXTRA_FX } from './pfEffects3';
import { COLOR_FX, PIXEL_FX } from './pfEffectsCore';
import type { EffectDef as PFEffect, ParamSpec } from './pfTypes';

// Adapter: PIXELFORGE ImageData effects -> TexCraft Tex effects.
// PF apply() mutates an ImageData in place; we bridge via a plain
// {width,height,data} object (no canvas/DOM needed).

function convertParam(p: ParamSpec): ParamDef {
  if (p.type === 'range') return { key: p.key, label: p.label, type: 'range', min: p.min, max: p.max, step: p.step, default: p.def };
  if (p.type === 'color') return { key: p.key, label: p.label, type: 'color', default: p.def };
  if (p.type === 'select') return { key: p.key, label: p.label, type: 'select', default: p.def, options: p.options.map((o) => [o.v, o.l] as [string, string]) };
  return { key: p.key, label: p.label, type: 'bool', default: p.def };
}

function adaptPF(def: PFEffect): TexEffect {
  return {
    id: def.id,
    name: def.name,
    category: def.cat as TexEffect['category'],
    icon: def.icon,
    desc: def.desc,
    params: def.params.map(convertParam),
    animated: def.animated ? () => true : undefined,
    apply: (src: Tex, v: Record<string, number | string | boolean>, ctx: Ctx): Tex => {
      const img = { width: src.w, height: src.h, data: new Uint8ClampedArray(src.d) } as ImageData;
      def.apply(img, v as Record<string, never>, { size: Math.max(src.w, src.h), t: ctx.t, seed: ctx.seed });
      return { w: src.w, h: src.h, d: img.data };
    },
  };
}

const ALL_PF: PFEffect[] = [...COLOR_FX, ...PIXEL_FX, ...DECOR_FX, ...MATERIAL_FX, ...SPECIAL_FX, ...EXTRA_FX];

export function buildPfEffects(existingIds: Set<string>): TexEffect[] {
  const out: TexEffect[] = [];
  for (const def of ALL_PF) {
    if (existingIds.has(def.id)) continue;
    existingIds.add(def.id);
    out.push(adaptPF(def));
  }
  return out;
}
