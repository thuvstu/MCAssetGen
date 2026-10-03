import { PRESETS, themeById, type Preset, type SetDef } from "./data";
import { MODES } from "./dress";
import { EFFECTS } from "./effects";
import { kindById } from "./kinds";
import type { EffectState, Layout, Params } from "./types";
import { clamp } from "./util";

export function defaultEffects(): Record<string, EffectState> {
  const out: Record<string, EffectState> = {};
  EFFECTS.forEach((e) => (out[e.id] = { on: false, amount: 5, size: 1, color: e.color }));
  return out;
}

export function defaultParams(kindId = "sword"): Params {
  const k = kindById(kindId);
  return {
    version: 3,
    grad: { mode: "none", power: 0.5 },
    name: "無銘の器",
    kind: k.id,
    style: 0,
    seed: 4207,
    length: k.length.def,
    width: k.width.def,
    detail: 2,
    runes: 4,
    tier: 1,
    overdrive: false,
    form: 1,
    mode: "none",
    palette: { ...themeById(k.palette).palette },
    effects: defaultEffects(),
    tex: 0,
    layout: "dense",
    share: true,
    snap: true,
    anim: { on: true, loop: 4, speed: 1, spin: 1, bob: 4 },
    view: { wire: false, bloom: 1, emissive: 1.4, grid: true, phantom: 0, phantomGap: 4 },
  };
}

/** 端末がモーション軽減を要求しているか */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/** 型の切替：寸法を型の既定値に、系譜・効果・表示設定は引き継ぐ */
export function switchKind(prev: Params, kindId: string): Params {
  const d = defaultParams(kindId);
  return { ...prev, kind: d.kind, style: 0, length: d.length, width: d.width, palette: d.palette };
}

function effectsFrom(src: Record<string, { amount?: number; size?: number; color?: string }>) {
  const effects = defaultEffects();
  Object.entries(src).forEach(([id, e]) => {
    if (!effects[id]) return;
    effects[id] = { ...effects[id], on: true, ...e };
  });
  return effects;
}

export function applyPreset(prev: Params, pr: Preset): Params {
  const k = kindById(pr.kind);
  return {
    ...prev,
    name: pr.name,
    kind: k.id,
    style: pr.style,
    length: pr.length ?? k.length.def,
    width: pr.width ?? k.width.def,
    detail: pr.detail ?? 2,
    runes: pr.runes ?? 4,
    tier: pr.tier ?? prev.tier,
    overdrive: !!pr.overdrive && (pr.tier ?? prev.tier) >= 5,
    form: pr.form ?? prev.form,
    mode: pr.mode ?? prev.mode,
    palette: { ...themeById(pr.theme).palette },
    effects: effectsFrom(pr.effects),
  };
}

/** 一式を適用（型は指定があればそれ、無ければ一式の先頭） */
export function applySet(prev: Params, s: SetDef, kindId?: string): Params {
  const k = kindById(kindId ?? s.kinds[0]);
  const d = defaultParams(k.id);
  return {
    ...prev,
    name: `${s.name}・${k.name}`,
    kind: k.id,
    style: prev.kind === k.id ? prev.style : 0,
    length: d.length,
    width: d.width,
    tier: s.tier,
    palette: { ...themeById(s.theme).palette },
    effects: effectsFrom(s.effects),
  };
}

export const presetById = (id: string) => PRESETS.find((p) => p.id === id);

const num = (v: unknown, d: number, lo: number, hi: number) =>
  typeof v === "number" && Number.isFinite(v) ? clamp(v, lo, hi) : d;
const hex = (v: unknown, d: string) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : d);

/** DBや旧バージョン(v1/v2)の値を安全に現行 Params へ */
export function normalize(raw: unknown, name?: string): Params {
  const r = (raw ?? {}) as Record<string, unknown>;
  const kindIdRaw = typeof r.kind === "string" ? r.kind : "sword";
  const legacyMap: Record<string, string> = { circle: "sigil", float: "relic" };
  const kindId = legacyMap[kindIdRaw] ?? kindIdRaw;
  const k = kindById(kindId);
  const d = defaultParams(k.id);
  const pal = (r.palette ?? {}) as Record<string, unknown>;
  const effRaw = (r.effects ?? {}) as Record<string, Record<string, unknown>>;
  const effects = defaultEffects();
  Object.keys(effects).forEach((id) => {
    const e = effRaw[id];
    if (!e) return;
    effects[id] = {
      on: !!e.on,
      amount: num(e.amount, 5, 1, 10),
      size: num(e.size, 1, 0.5, 1.6),
      color: hex(e.color, effects[id].color),
    };
  });
  const ver = typeof r.version === "number" ? r.version : 1;
  // v1 互換：浮遊物・微粒子 → 効果
  if (ver < 2) {
    if (typeof r.floaters === "number" && r.floaters > 0)
      effects.satellites = { ...effects.satellites, on: true, amount: clamp(Math.round(r.floaters), 1, 10) };
    if (typeof r.motes === "number" && r.motes > 0)
      effects.stars = { ...effects.stars, on: true, amount: clamp(Math.round(r.motes / 2), 1, 10) };
  }
  const a = (r.anim ?? {}) as Record<string, unknown>;
  const v = (r.view ?? {}) as Record<string, unknown>;
  const layout: Layout = r.layout === "grid" || r.layout === "strip" || r.layout === "dense" ? r.layout : d.layout;
  const tier = num(r.tier, ver < 3 ? 1 : d.tier, 0, 5);
  const gr = (r.grad ?? {}) as Record<string, unknown>;
  const gradMode = ["none", "rise", "fall", "heat", "abyss"].includes(gr.mode as string) ? (gr.mode as Params["grad"]["mode"]) : "none";
  const mode = typeof r.mode === "string" && MODES.some((m) => m.id === r.mode) ? r.mode : "none";
  return {
    version: 3,
    grad: { mode: gradMode, power: num(gr.power, 0.5, 0, 1) },
    name: (name ?? (typeof r.name === "string" ? r.name : d.name)).slice(0, 40),
    kind: k.id,
    style: num(r.style ?? r.guard ?? r.head ?? r.part, 0, 0, k.styles.length - 1),
    seed: num(r.seed, d.seed, 0, 99999),
    length: num(r.length, d.length, k.length.min, k.length.max),
    width: num(r.width, d.width, k.width.min, k.width.max),
    detail: num(r.detail, d.detail, 0, 3),
    runes: num(r.runes, d.runes, 0, 8),
    tier,
    overdrive: tier >= 5 && !!r.overdrive,
    form: num(r.form, d.form, 0, 2),
    mode,
    palette: {
      base: hex(pal.base, d.palette.base),
      shade: hex(pal.shade, d.palette.shade),
      metal: hex(pal.metal, d.palette.metal),
      glow: hex(pal.glow, d.palette.glow),
    },
    effects,
    tex: [0, 32, 64, 128, 256].includes(r.tex as number) ? (r.tex as number) : d.tex,
    layout,
    share: typeof r.share === "boolean" ? r.share : d.share,
    snap: typeof r.snap === "boolean" ? r.snap : d.snap,
    anim: {
      on: typeof a.on === "boolean" ? a.on : typeof r.animate === "boolean" ? (r.animate as boolean) : d.anim.on,
      loop: num(a.loop, d.anim.loop, 2, 8),
      speed: num(a.speed, d.anim.speed, 0.25, 3),
      spin: num(a.spin, d.anim.spin, -3, 3),
      bob: num(a.bob, d.anim.bob, 0, 12),
    },
    view: {
      wire: typeof v.wire === "boolean" ? v.wire : !!r.wire,
      bloom: num(v.bloom, d.view.bloom, 0, 2),
      emissive: num(v.emissive, d.view.emissive, 0, 3),
      grid: typeof v.grid === "boolean" ? v.grid : d.view.grid,
      phantom: num(v.phantom, d.view.phantom, 0, 5),
      phantomGap: num(v.phantomGap, d.view.phantomGap, 2, 12),
    },
  };
}
