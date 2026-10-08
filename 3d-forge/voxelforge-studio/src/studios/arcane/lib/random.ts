/* ═══════════════════════════════════════════════════════
   Randomizer — respects 🔒 locks and 🎯 pools
   ═══════════════════════════════════════════════════════ */
import {
  StaffConfig, OutlineStyle, ALL_HEADS, ALL_SHAFTS, ALL_WRAPS, ALL_COLLARS, ALL_POMMELS,
  ALL_TIPS, ALL_ORBITERS, ALL_WINGS, ALL_HALOS, ALL_PARTICLES, ALL_FINISHES, ALL_MOTIFS, ALL_INNERS, ALL_MOD_ESSENCES,
  ALL_RARITIES, ALL_WEARS, ALL_DANGLES, ALL_HARMONIES, HarmonyScheme, ALL_GEM_CUTS, ALL_GEM_MOUNTS, ALL_ADORNMENTS,
} from './types';
import { getRarity } from './catalog/rarity';
import { applyHarmony } from './harmony';
import { mulberry32, shade } from './color';
import { ELEMENTS, getElement } from './catalog/elements';
import { ITEM_TYPES, getItemType } from './catalog/itemTypes';
import { ANIMATIONS } from './catalog/presets';
import { GEM_PALETTES, WOOD_PALETTES, METAL_COLORS } from './catalog/palettes';
import { DEFAULT_ANIMATION } from './defaults';
import { DEFAULT_RULES, LockKey, Locks, RandomRules } from './locks';

export interface RandomOptions { locks?: Locks; rules?: Partial<RandomRules>; seed?: number; }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function randomConfig(prev: StaffConfig, opts: RandomOptions = {}): StaffConfig {
  const locks = opts.locks ?? {};
  const rules: RandomRules = { ...DEFAULT_RULES, ...(opts.rules ?? {}) };
  const rand = mulberry32(opts.seed ?? Math.floor(Math.random() * 1e9));
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const range = (a: number, b: number) => a + rand() * (b - a);
  const jit = (v: number, amt: number) => v * (1 + (rand() - 0.5) * 2 * amt);
  const chance = (p: number) => rand() < p;

  /* ── identity (pools) ── */
  const elPool = rules.elements.length ? rules.elements : ELEMENTS.map((e) => e.id).filter((id) => id !== 'none');
  const element = locks.element ? prev.element : pick(elPool);
  const el = getElement(element);
  const typePool = rules.itemTypes.length ? rules.itemTypes : ITEM_TYPES.map((t) => t.id);
  const itemType = locks.itemType ? prev.itemType : pick(typePool);
  const type = getItemType(itemType);
  const headPool = rules.headShapes.length ? rules.headShapes : ALL_HEADS;
  const finishPool = rules.finishes.length ? rules.finishes : ALL_FINISHES;
  const tipPool = rules.tipStyles.length ? rules.tipStyles : ALL_TIPS;
  const orbiterPool = rules.orbiterStyles.length ? rules.orbiterStyles : ALL_ORBITERS;
  const cutPool = rules.gemCuts.length ? rules.gemCuts : ALL_GEM_CUTS;
  const adornmentPool = rules.adornments.length ? rules.adornments : ALL_ADORNMENTS;
  const essencePool = rules.modEssences.length ? rules.modEssences : ALL_MOD_ESSENCES;
  const modEssence = locks.modEssence ? prev.modEssence : pick(essencePool);
  const rarityPool = rules.rarities.length ? rules.rarities : ALL_RARITIES;
  const rarity = locks.rarity ? (prev.rarity ?? 'common') : pick(rarityPool);
  const rd = getRarity(rarity);

  /* ── colours ── */
  const follow = rules.colorsFollowElement;
  const tint = (hex: string) => shade(hex, (rand() - 0.5) * 0.16 * rules.jitter);
  const gem = pick(GEM_PALETTES), wood = pick(WOOD_PALETTES), metal = pick(METAL_COLORS);
  const colors: Partial<StaffConfig> = follow
    ? {
      gemColor: tint(el.gem), gemColor2: tint(el.gem2), glowColor: el.glow, particleColor: el.particle,
      shaftColor: tint(el.shaft), shaftColor2: tint(el.shaft2),
      collarColor: el.metal, prongColor: el.metal, pommelColor: el.metal,
      wrapColor: chance(0.5) ? el.metal : el.gem,
      haloColor: element === 'light' || element === 'arcane' ? '#ffd700' : el.glow,
      wingColor: chance(0.5) ? '#f5f0e6' : shade(el.gem2, 0.3), hornColor: '#e8dcc0',
    }
    : {
      gemColor: gem[0], gemColor2: gem[1], glowColor: gem[0], particleColor: gem[2],
      shaftColor: wood[0], shaftColor2: wood[1],
      collarColor: metal, prongColor: metal, pommelColor: metal,
      wrapColor: chance(0.5) ? metal : gem[0],
      haloColor: chance(0.5) ? '#ffd700' : gem[1],
      wingColor: chance(0.6) ? '#f5f0e6' : gem[2], hornColor: '#e8dcc0',
    };

  /* ── geometry (jitter around the item type's proportions, or free) ── */
  const p = type.patch;
  const J = rules.jitter;
  const geo: Partial<StaffConfig> = rules.keepTypeGeometry
    ? {
      shaftLength: clamp(jit(p.shaftLength ?? 0.86, 0.12 * J), 0.55, 1),
      shaftThickness: clamp(jit(p.shaftThickness ?? 0.06, 0.28 * J), 0.016, 0.13),
      shaftAngle: clamp((p.shaftAngle ?? -48) + (rand() - 0.5) * 22 * J, -70, -15),
      shaftCurve: clamp((p.shaftCurve ?? 0) + (rand() - 0.5) * 0.12 * J, -0.18, 0.18),
      headSize: clamp(jit(p.headSize ?? 0.3, 0.22 * J), 0.14, 0.44),
      collarStyle: chance(0.75) ? (p.collarStyle ?? pick(ALL_COLLARS)) : pick(ALL_COLLARS),
      pommelStyle: chance(0.7) ? (p.pommelStyle ?? pick(ALL_POMMELS)) : pick(ALL_POMMELS),
      prongs: chance(0.5) ? (p.prongs ?? 0) : Math.floor(rand() * 5),
    }
    : {
      shaftLength: range(0.7, 0.96), shaftThickness: range(0.024, 0.074),
      shaftAngle: range(-58, -32), shaftCurve: (rand() - 0.5) * 0.24, headSize: range(0.2, 0.38),
      collarStyle: pick(ALL_COLLARS), pommelStyle: pick(ALL_POMMELS), prongs: Math.floor(rand() * 5),
    };

  const out: StaffConfig = {
    ...prev,
    ...p,
    modEssence,
    rarity,
    element, itemType,
    seed: Math.floor(rand() * 999999),
    ...geo,
    shaftStyle: rules.keepTypeGeometry && p.shaftStyle && chance(0.72) ? p.shaftStyle : follow && chance(0.5) ? el.shaftStyle : pick(ALL_SHAFTS),
    shaftDetail: rand(),
    grain: rand() * 0.6,
    wrapStyle: rules.keepTypeGeometry && p.wrapStyle && chance(0.72) ? p.wrapStyle : pick(ALL_WRAPS),
    wrapDensity: 3 + Math.floor(rand() * 7),
    headShape: rules.keepTypeGeometry && p.headShape && chance(0.82) && headPool.includes(p.headShape) ? p.headShape
      : follow && chance(0.4) && headPool.includes(el.head) ? el.head : pick(headPool),
    gemGlow: 0.4 + rand() * 0.6,
    gemCut: p.gemCut ?? pick(cutPool),
    gemMount: p.gemMount ?? pick(ALL_GEM_MOUNTS),
    gemCount: p.gemCount ?? (1 + Math.floor(rand() * 7)),
    gemScale: p.gemScale ?? (0.1 + rand() * 0.25),
    adornmentStyle: p.adornmentStyle ?? pick(adornmentPool),
    adornmentDensity: p.adornmentDensity ?? (0.22 + rand() * 0.74),
    innerStyle: pick(ALL_INNERS),
    tipStyle: rules.keepTypeGeometry && p.tipStyle && chance(0.76) && tipPool.includes(p.tipStyle) ? p.tipStyle
      : follow && chance(0.45) && tipPool.includes(el.tip) ? el.tip : pick(tipPool),
    tipScale: 0.3 + rand() * 0.7,
    orbiterStyle: chance(0.24) && orbiterPool.includes('none') ? 'none' : pick(orbiterPool),
    orbiterCount: 1 + Math.floor(rand() * 5),
    orbiterRadius: 1.25 + rand() * 1.1,
    orbiterSize: 0.08 + rand() * 0.14,
    wings: follow && chance(0.5) ? el.wings : pick(['none', 'none', ...ALL_WINGS]),
    halo: follow && chance(0.5) ? el.halo : pick(['none', 'none', ...ALL_HALOS]),
    horns: chance(0.14),
    particles: 5 + Math.floor(rand() * 14),
    particleStyle: follow ? el.particleStyle : pick(ALL_PARTICLES),
    ...colors,
    shading: 0.55 + rand() * 0.4,
    dither: chance(0.7),
    outerGlow: 0.06 + rand() * 0.42,
    finish: follow && chance(0.4) && finishPool.includes(el.finish) ? el.finish : pick(finishPool),
    contrast: 0.95 + rand() * 0.3,
    outline: pick(['selout', 'selout', 'dark', 'dark', 'colored', 'gold', 'light'] as OutlineStyle[]),
    motif: follow ? el.motif : pick(ALL_MOTIFS),
    motifIntensity: rand() * 0.9,
    motif2: chance(0.25) ? pick(ALL_MOTIFS) : 'none',
    motif2Intensity: 0.2 + rand() * 0.5,
    dangleStyle: p.dangleStyle ?? (chance(0.45) ? pick(ALL_DANGLES) : 'none'),
    dangleCount: 1 + Math.floor(rand() * 3),
    wearStyle: chance(0.35) ? pick(ALL_WEARS) : 'none',
    wearAmount: 0.15 + rand() * 0.5,
  };

  /* ── レアリティが華やかさを支配する ── */
  if (rules.rarityDrivesOrnate) {
    Object.assign(out, rd.patch);
    out.rarity = rarity;
    // keep the rolled identity/shape, rarity only governs ornateness
    if (p.headShape) out.headShape = p.headShape;
    if (p.tipStyle) out.tipStyle = p.tipStyle;
    if (p.collarStyle) out.collarStyle = p.collarStyle;
    out.outerGlow = clamp((rd.patch.outerGlow ?? out.outerGlow) * (0.85 + rand() * 0.3), 0, 1);
    out.particles = Math.max(0, Math.round((rd.patch.particles ?? out.particles) * (0.8 + rand() * 0.4)));
    if (rd.ornateLevel < 2) { out.motif2 = 'none'; out.dangleStyle = 'none'; }
  }

  /* ── カラーハーモニーで一括再配色 ── */
  if (rules.useHarmony) {
    const scheme = pick(ALL_HARMONIES.filter((h) => h !== 'custom')) as HarmonyScheme;
    Object.assign(out, applyHarmony(out, scheme));
  }

  if (rules.randomizeAnimation) {
    const a = pick(ANIMATIONS.filter((x) => x.id !== 'none'));
    Object.assign(out, a.needs);
    out.animation = { ...(prev.animation ?? DEFAULT_ANIMATION), type: a.id, frames: a.frames, fps: a.fps, intensity: 0.5 + rand() * 0.5 };
  }

  /* ── 🔒 restore locked fields last so nothing above can override them ── */
  const bag = out as unknown as Record<string, unknown>;
  for (const k of Object.keys(locks) as LockKey[]) {
    if (locks[k]) bag[k] = prev[k];
  }
  return out;
}
