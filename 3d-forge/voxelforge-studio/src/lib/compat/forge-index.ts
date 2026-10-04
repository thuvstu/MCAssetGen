import { Builder } from "./forge-builder";
import {
  dressAmount,
  dressPalette,
  effectActions,
  modeDressing,
  overdriveDressing,
  rootActions,
  sealForm,
  tierDressing,
  trueForm,
} from "./forge-dress";
import { EFFECTS } from "./forge-effects";
import { kindById } from "./forge-kinds-index";
import type { Bounds, Box, ClipMap, EffectState, Model, Params } from "./forge-types2";
import { clamp, hashStr, rng } from "./forge-util";

export * from "./forge-types2";
export { KINDS, FAMILIES, kindById } from "./forge-kinds-index";
export { EFFECTS, EFFECT_CATS, effectById } from "./forge-effects";
export { THEMES, PRESETS, SETS, themeById, setById } from "./forge-themes";
export { defaultParams, normalize, applyPreset, applySet, switchKind } from "./forge-params";
export { layoutAtlas, paintAtlas } from "./forge-atlas";
export { evaluate, rootIdle, sampleCount, clipAnims, CLIPS, clipById } from "./forge-anim";
export { RANKS, MODES, FORM_LABELS, modeById, dressPalette } from "./forge-dress";
export { prefersReducedMotion } from "./forge-params";

export function boundsOf(boxes: Box[]): Bounds {
  if (!boxes.length) return { min: [8, 0, 8], max: [8, 16, 8], center: [8, 8, 8], top: 16, bottom: 0, radius: 3 };
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  boxes.forEach((b) => {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], b.from[i]);
      max[i] = Math.max(max[i], b.to[i]);
    }
  });
  const radius = Math.max(2, Math.min(8, Math.max(max[0] - 8, 8 - min[0], max[2] - 8, 8 - min[2])));
  return {
    min,
    max,
    center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
    top: max[1],
    bottom: Math.max(0, min[1]),
    radius,
  };
}

export interface Generated extends Model {
  bounds: Bounds;
  bodyCount: number;
  fxCount: number;
  rootClips: ClipMap;
}

export function generate(p: Params): Generated {
  const palette = dressPalette(p.palette, p);
  const b = new Builder(palette, p.snap);
  const kind = kindById(p.kind);
  const r = rng(p.seed);

  // 段階は装飾密度と刻印数にも効く
  const eff: Params = {
    ...p,
    palette,
    detail: clamp(p.detail + (p.tier >= 4 ? 1 : 0) - (p.form === 0 ? 1 : 0), 0, 3),
    runes: clamp(p.runes + Math.floor(p.tier / 2) - (p.form === 0 ? 2 : 0), 0, 10),
  };
  kind.build(b, eff, r);
  b.body();

  if (p.form === 2) trueForm(b, boundsOf(b.boxes));
  const bodyBounds = boundsOf(b.boxes);
  if (p.form === 0) sealForm(b, bodyBounds, rng(p.seed ^ 0x5ea1));
  tierDressing(b, p, bodyBounds, rng(p.seed ^ 0x7123));
  if (p.mode !== "none") modeDressing(b, p, bodyBounds, rng(p.seed ^ 0x3f0d));
  if (p.overdrive) overdriveDressing(b, p, bodyBounds, rng(p.seed ^ 0x0dd1));
  b.body();

  const bodyCount = b.boxes.length;
  const bounds = boundsOf(b.boxes);
  const amountK = dressAmount(p);

  EFFECTS.forEach((e) => {
    const s = p.effects[e.id];
    if (!s?.on) return;
    const scaled: EffectState = { ...s, amount: clamp(Math.round(s.amount * amountK), 1, 14) };
    const before = b.groups.length;
    e.build({ b, bounds, s: scaled, r: rng((p.seed ^ hashStr(e.id)) >>> 0), id: e.id });
    b.body();
    // 効果由来のグループへ動作クリップを付与（効果が自前で定義したものを優先）
    for (let i = before; i < b.groups.length; i++) {
      const g = b.groups[i];
      if (g.effect !== e.id) continue;
      const actions = effectActions(g.clips.idle ?? [], scaled.amount / 6);
      Object.entries(actions).forEach(([clip, specs]) => {
        if (!g.clips[clip]?.length) g.clips[clip] = specs;
      });
    }
  });

  const model = b.build();
  return {
    ...model,
    bounds,
    bodyCount,
    fxCount: model.boxes.length - bodyCount,
    rootClips: rootActions(kind, p),
  };
}
