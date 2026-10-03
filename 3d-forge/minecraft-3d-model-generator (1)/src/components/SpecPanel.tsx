"use client";

import { useState } from "react";
import type { ModelSpec } from "@/lib/spec";
import {
  ANIMATION_LABELS,
  AURA_LABELS,
  DECORATION_LABELS,
  FLOATING_LABELS,
  LIMIT_BREAK_BLURBS,
  LIMIT_BREAK_LABELS,
  MAGIC_LABELS,
  MAGIC_THEMES,
  MODEL_CATEGORIES,
  MORPH_BLURBS,
  MORPH_LABELS,
  MODEL_TYPE_ICONS,
  MODEL_TYPE_LABELS,
  PARTICLE_LABELS,
  PHANTOM_LABELS,
  STYLE_PRESETS,
  TEXTURE_PATTERN_LABELS,
  TIER_BLURBS,
  TIER_LABELS,
  TRAIL_LABELS,
} from "@/lib/spec";
import type { ModelType, PhantomKind } from "@/lib/spec";
import type { LimitBreak, MorphKind, Tier } from "@/lib/spec";

interface Props {
  spec: ModelSpec;
  onChange: (patch: Partial<ModelSpec>) => void;
  onRandomize: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

const DECORATIONS = Object.keys(DECORATION_LABELS) as (keyof typeof DECORATION_LABELS)[];
const FLOATING_KEYS = Object.keys(FLOATING_LABELS) as (keyof typeof FLOATING_LABELS)[];
const ANIMATION_KEYS = Object.keys(ANIMATION_LABELS) as (keyof typeof ANIMATION_LABELS)[];
const PARTICLE_KEYS = Object.keys(PARTICLE_LABELS) as (keyof typeof PARTICLE_LABELS)[];
const AURA_KEYS = Object.keys(AURA_LABELS) as (keyof typeof AURA_LABELS)[];
const TRAIL_KEYS = Object.keys(TRAIL_LABELS) as (keyof typeof TRAIL_LABELS)[];
const TEXTURE_KEYS = Object.keys(TEXTURE_PATTERN_LABELS) as (keyof typeof TEXTURE_PATTERN_LABELS)[];
const PHANTOM_KEYS = Object.keys(PHANTOM_LABELS) as PhantomKind[];

// --- Reusable tiny components -----------------------------------------------

function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="border-b-2 border-[var(--color-line)] px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-pixel text-sm tracking-widest text-[var(--color-xp)]">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function Slider({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs text-[var(--color-fog)]">{label}</span>
        <span className="font-pixel text-xs text-[var(--color-gold)]">{Math.round(value * 100)}%</span>
      </div>
      <input type="range" min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {hint ? <p className="mt-1 text-[10px] leading-snug text-[var(--color-fog)]/70">{hint}</p> : null}
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="mb-2 flex items-center gap-3">
      <span className="w-18 shrink-0 text-xs text-[var(--color-fog)]">{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <span className="font-pixel text-[10px] uppercase text-[var(--color-fog)]">{value}</span>
    </label>
  );
}

function Select<T extends string>({ label, value, onChange, options, labels }: {
  label: string; value: T; onChange: (v: T) => void; options: readonly T[]; labels: Record<T, string>;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs text-[var(--color-fog)]">{label}</span>
      <select className="w-full" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o} value={o}>{labels[o]}</option>)}
      </select>
    </label>
  );
}

function ChipRow<T extends string>({ label, value, onChange, options, labels }: {
  label: string; value: T; onChange: (v: T) => void; options: readonly T[]; labels: Record<T, string>;
}) {
  return (
    <div className="mb-3">
      <span className="mb-1 block text-xs text-[var(--color-fog)]">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button key={o} className="chip px-2 py-1.5 text-xs" data-on={value === o} onClick={() => onChange(o)}>
            {labels[o]}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Tab definitions --------------------------------------------------------

type TabId = "type" | "power" | "style" | "colors" | "effects";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "type", label: "タイプ", icon: "⚔️" },
  { id: "power", label: "強化", icon: "⚡" },
  { id: "style", label: "スタイル", icon: "🎨" },
  { id: "colors", label: "カラー", icon: "🌈" },
  { id: "effects", label: "エフェクト", icon: "✨" },
];

// --- Main panel -------------------------------------------------------------

export default function SpecPanel({ spec, onChange, onRandomize, onUndo, canUndo }: Props) {
  const [tab, setTab] = useState<TabId>("type");
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const typeList = (Object.keys(MODEL_TYPE_LABELS) as ModelType[]).filter((t) => {
    const inCat = cat === "all" || (MODEL_CATEGORIES.find((c) => c.id === cat)?.types.includes(t) ?? true);
    const q = query.trim();
    const inQ = !q || MODEL_TYPE_LABELS[t].includes(q) || t.includes(q.toLowerCase());
    return inCat && inQ;
  });

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex shrink-0 border-b-2 border-[var(--color-line)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`flex-1 py-2 text-center font-pixel text-xs transition-colors ${
              tab === t.id ? "bg-[rgba(110,224,106,0.1)] text-[var(--color-xp)] border-b-2 border-[var(--color-xp)]" : "text-[var(--color-fog)] hover:text-white"
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* TYPE tab */}
        {tab === "type" && (
          <>
            <Section
              title="モデル"
              right={
                <div className="flex gap-1">
                  <button className="pixel-btn bg-[var(--color-panel2)] px-2 py-1 text-xs text-[var(--color-fog)]" onClick={onUndo} disabled={!canUndo}>↩ 戻す</button>
                  <button className="pixel-btn bg-[var(--color-gold)] px-2 py-1 text-xs text-black" onClick={onRandomize}>⚄ ランダム</button>
                </div>
              }
            >
              <label className="mb-3 block">
                <span className="mb-1 block text-xs text-[var(--color-fog)]">モデル名</span>
                <input type="text" className="w-full" value={spec.name} maxLength={40} onChange={(e) => onChange({ name: e.target.value })} />
              </label>

              <span className="mb-1 block text-xs text-[var(--color-fog)]">カテゴリ</span>
              <div className="mb-2 flex flex-wrap gap-1">
                {MODEL_CATEGORIES.map((c) => (
                  <button key={c.id} className="chip px-2 py-1 text-[10px]" data-on={cat === c.id} onClick={() => setCat(c.id)}>
                    {c.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="mb-2 w-full text-xs"
                placeholder="タイプ検索…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="mb-2 block text-xs text-[var(--color-fog)]">モデルタイプ（{typeList.length}）</span>
              <div className="grid grid-cols-4 gap-1">
                {typeList.map((t) => (
                  <button key={t} className="chip flex flex-col items-center gap-0.5 px-1 py-2 text-[10px]" data-on={spec.type === t} onClick={() => onChange({ type: t })}>
                    <span className="text-base">{MODEL_TYPE_ICONS[t]}</span>
                    <span>{MODEL_TYPE_LABELS[t]}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="プロポーション">
              <Slider label="全体サイズ" value={spec.scale} onChange={(v) => onChange({ scale: v })} />
              <Slider label="長さ" value={spec.length} onChange={(v) => onChange({ length: v })} hint="刃・杖・弓の丈を伸ばします" />
              <Slider label="幅" value={spec.width} onChange={(v) => onChange({ width: v })} hint="刃幅・盾幅・柄太さに影響" />
              <Slider label="細部密度" value={spec.detail} onChange={(v) => onChange({ detail: v })} hint="符文・破片・装飾の多さ" />
              <Slider label="ブロック感" value={spec.blockiness} onChange={(v) => onChange({ blockiness: v })} hint="大きい块にスナップしテクスチャも滑らかに" />
              <label className="mt-1 block">
                <span className="mb-1 block text-xs text-[var(--color-fog)]">シード</span>
                <div className="flex gap-2">
                  <input type="number" className="w-full font-pixel" value={spec.seed} onChange={(e) => onChange({ seed: Number(e.target.value) || 0 })} />
                  <button className="pixel-btn shrink-0 bg-[var(--color-xp)] px-3 text-sm text-black" onClick={() => onChange({ seed: Math.floor(Math.random() * 1e9) })}>🎲</button>
                </div>
              </label>
            </Section>
          </>
        )}

        {/* POWER (強化) tab */}
        {tab === "power" && (
          <>
            <Section title="段階強化">
              <div className="mb-2 grid grid-cols-2 gap-1.5">
                {([1, 2, 3, 4] as Tier[]).map((t) => (
                  <button
                    key={t}
                    className={`chip px-2 py-2 text-left text-xs ${spec.tier === t ? "border-[var(--color-xp)]" : ""}`}
                    data-on={spec.tier === t}
                    onClick={() => onChange({ tier: t })}
                  >
                    <div className="font-bold">{TIER_LABELS[t]}</div>
                    <div className="mt-0.5 text-[10px] leading-tight text-[var(--color-fog)]">{TIER_BLURBS[t]}</div>
                  </button>
                ))}
              </div>
            </Section>
            <Section title="限界突破">
              <div className="mb-2 grid grid-cols-4 gap-1">
                {([0, 1, 2, 3] as LimitBreak[]).map((lb) => (
                  <button
                    key={lb}
                    className="chip px-1 py-2 text-center text-xs"
                    data-on={spec.limitBreak === lb}
                    onClick={() => onChange({ limitBreak: lb })}
                  >
                    {LIMIT_BREAK_LABELS[lb]}
                  </button>
                ))}
              </div>
              <p className="text-[11px] leading-snug text-[var(--color-fog)]/80">{LIMIT_BREAK_BLURBS[spec.limitBreak]}</p>
            </Section>
            <Section title="形態変化">
              <div className="mb-2 grid grid-cols-2 gap-1.5">
                {(Object.keys(MORPH_LABELS) as MorphKind[]).map((m) => (
                  <button
                    key={m}
                    className={`chip px-2 py-2 text-left text-xs ${spec.morph === m ? "border-[var(--color-xp)]" : ""}`}
                    data-on={spec.morph === m}
                    onClick={() => onChange({ morph: m })}
                  >
                    <div className="font-bold">{MORPH_LABELS[m]}</div>
                    <div className="mt-0.5 text-[10px] leading-tight text-[var(--color-fog)]">{MORPH_BLURBS[m]}</div>
                  </button>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* STYLE tab */}
        {tab === "style" && (
          <>
            <Section title="スタイルプリセット">
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(STYLE_PRESETS) as (keyof typeof STYLE_PRESETS)[]).map((p) => {
                  const preset = STYLE_PRESETS[p];
                  return (
                    <button
                      key={p}
                      className={`chip px-2 py-2 text-left text-xs ${spec.stylePreset === p ? "border-[var(--color-xp)]" : ""}`}
                      data-on={spec.stylePreset === p}
                      onClick={() => {
                        const next = { ...spec, stylePreset: p };
                        preset.apply(next);
                        onChange({ ...next, stylePreset: p, magic: preset.magic });
                      }}
                    >
                      <div className="font-bold">{preset.label}</div>
                      <div className="mt-0.5 text-[10px] text-[var(--color-fog)]">{preset.blurb}</div>
                    </button>
                  );
                })}
              </div>
            </Section>
            <Section title="魔法系統">
              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(MAGIC_LABELS) as (keyof typeof MAGIC_LABELS)[]).map((m) => (
                  <button
                    key={m}
                    className="chip flex items-center gap-1.5 px-2 py-1.5 text-xs"
                    data-on={spec.magic === m}
                    onClick={() => onChange({ magic: m })}
                  >
                    <span className="inline-block h-3 w-3 border border-black/20" style={{ background: MAGIC_THEMES[m].accent }} />
                    {MAGIC_LABELS[m]}
                  </button>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* COLORS tab */}
        {tab === "colors" && (
          <>
            <Section title="カラーパレット">
              <div className="mb-2 grid grid-cols-2 gap-x-3 gap-y-1">
                <ColorRow label="本体" value={spec.primaryColor} onChange={(v) => onChange({ primaryColor: v })} />
                <ColorRow label="副素材" value={spec.secondaryColor} onChange={(v) => onChange({ secondaryColor: v })} />
                <ColorRow label="魔法の光" value={spec.accentColor} onChange={(v) => onChange({ accentColor: v })} />
                <ColorRow label="発光色" value={spec.glowColor} onChange={(v) => onChange({ glowColor: v })} />
                <ColorRow label="柄 / 木" value={spec.handleColor} onChange={(v) => onChange({ handleColor: v })} />
                <ColorRow label="宝石" value={spec.gemColor} onChange={(v) => onChange({ gemColor: v })} />
              </div>
              <Slider label="発光強度" value={spec.glowIntensity} onChange={(v) => onChange({ glowIntensity: v })} />
            </Section>
            <Section title="テクスチャ">
              <ChipRow label="パターン" value={spec.texturePattern} onChange={(v) => onChange({ texturePattern: v })} options={TEXTURE_KEYS} labels={TEXTURE_PATTERN_LABELS} />
              <Slider label="ノイズ量" value={spec.textureNoise} onChange={(v) => onChange({ textureNoise: v })} hint="0 で滑らか、1 でガチガチ" />
            </Section>
          </>
        )}

        {/* EFFECTS tab */}
        {tab === "effects" && (
          <>
            <Section title="特殊装飾">
              <div className="flex flex-wrap gap-1.5">
                {DECORATIONS.map((d) => (
                  <button
                    key={d}
                    className="chip px-2 py-1.5 text-xs"
                    data-on={spec.decorations.includes(d)}
                    onClick={() => {
                      const has = spec.decorations.includes(d);
                      onChange({ decorations: has ? spec.decorations.filter((x) => x !== d) : [...spec.decorations, d] });
                    }}
                  >
                    {DECORATION_LABELS[d]}
                  </button>
                ))}
              </div>
            </Section>
            <Section title="浮遊物">
              <ChipRow label="浮遊モード" value={spec.floating} onChange={(v) => onChange({ floating: v })} options={FLOATING_KEYS} labels={FLOATING_LABELS} />
            </Section>
            <Section title="アニメーション">
              <ChipRow label="アニメーション" value={spec.animation} onChange={(v) => onChange({ animation: v })} options={ANIMATION_KEYS} labels={ANIMATION_LABELS} />
            </Section>
            <Section title="パーティクル">
              <Select label="パーティクル" value={spec.particles} onChange={(v) => onChange({ particles: v })} options={PARTICLE_KEYS} labels={PARTICLE_LABELS} />
            </Section>
            <Section title="オーラ・軌跡">
              <Select label="オーラ" value={spec.aura} onChange={(v) => onChange({ aura: v })} options={AURA_KEYS} labels={AURA_LABELS} />
              <Select label="軌跡" value={spec.trail} onChange={(v) => onChange({ trail: v })} options={TRAIL_KEYS} labels={TRAIL_LABELS} />
            </Section>
            <Section title="幻影分身">
              <div className="mb-1 text-xs text-[var(--color-fog)]">幻影フィールド</div>
              <div className="flex flex-wrap gap-1.5">
                {PHANTOM_KEYS.map((p) => (
                  <button
                    key={p}
                    className="chip px-2 py-1.5 text-xs"
                    data-on={spec.phantom === p}
                    onClick={() => onChange({ phantom: p })}
                  >
                    {PHANTOM_LABELS[p]}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-snug text-[var(--color-fog)]/70">
                武器本体のゴースト分身を浮遊させ、動きに応じて残像が追従します。
              </p>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}