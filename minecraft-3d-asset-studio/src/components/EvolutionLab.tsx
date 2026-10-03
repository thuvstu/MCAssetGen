"use client";

import { useMemo } from "react";
import { Crown, FlaskConical, Hammer, Layers3, Package, RotateCcw, Shield, Sparkles, Star, Sword, Swords, Wand2, X, Zap } from "lucide-react";
import { PALETTES } from "@/lib/generators/textureBaker";
import { ARCHETYPE_CATALOG, CatalogGroup } from "@/lib/generators/catalog";
import {
  buildVariantSet,
  FORM_DEFINITIONS,
  isDefaultVariant,
  LIMIT_BREAK_LABELS,
  MAX_LIMIT_BREAK,
  MAX_TIER,
  TIER_LABELS,
} from "@/lib/variants/variantEngine";
import { FORM_IDS, ModelArchetype, ModelData, ModelTheme, VariantState } from "@/types/model";

interface EvolutionLabProps {
  model: ModelData;
  baseModel: ModelData;
  variant: VariantState;
  isExporting: boolean;
  onClose: () => void;
  onVariantChange: (partial: Partial<VariantState>) => void;
  onBake: () => void;
  onReset: () => void;
  onLoadArchetype: (type: ModelArchetype) => void;
  onRetheme: (theme: ModelTheme) => void;
  onExportPack: () => void;
}

const GROUP_ICONS: Record<CatalogGroup, typeof Sword> = {
  刀剣: Sword,
  打撃: Hammer,
  長柄: Swords,
  機械: Hammer,
  近代銃器: Zap,
  射撃: Swords,
  魔法: Sparkles,
  杖: Wand2,
  魔導書: Sparkles,
  邪悪: Swords,
  ブラッド: Swords,
  レリック: Crown,
  防具: Shield,
};

const ARSENAL: Array<{ type: ModelArchetype; label: string; group: string; icon: typeof Sword }> = ARCHETYPE_CATALOG.map((entry) => ({
  type: entry.type,
  label: entry.labelJa,
  group: entry.group,
  icon: GROUP_ICONS[entry.group],
}));

function Section({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: typeof Star; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#2d3139] bg-[#1a1d26]">
      <header className="flex items-center gap-2 border-b border-[#262a34] px-3 py-2">
        <Icon className="h-3.5 w-3.5 text-amber-300" />
        <div>
          <h3 className="text-[11px] font-bold text-neutral-100">{title}</h3>
          <p className="text-[10px] text-neutral-500">{subtitle}</p>
        </div>
      </header>
      <div className="space-y-2 p-3">{children}</div>
    </section>
  );
}

export function EvolutionLab({
  model,
  baseModel,
  variant,
  isExporting,
  onClose,
  onVariantChange,
  onBake,
  onReset,
  onLoadArchetype,
  onRetheme,
  onExportPack,
}: EvolutionLabProps) {
  const variantSet = useMemo(() => buildVariantSet(variant), [variant]);
  const isDefault = isDefaultVariant(variant);
  const generatedCount = model.elements.filter((element) => element.generated).length;

  return (
    <div className="flex h-full flex-col border-r border-[#2d3139] bg-[#15171e] text-xs text-neutral-300 select-none">
      <div className="flex items-center justify-between border-b border-[#2d3139] bg-gradient-to-r from-amber-900/30 via-[#1a1d24] to-purple-900/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-amber-300" />
          <div>
            <h2 className="text-xs font-black tracking-wide text-white">EVOLUTION LAB</h2>
            <p className="text-[10px] text-neutral-400">強化・覚醒・形態変化スタジオ</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded p-1 text-neutral-400 hover:bg-[#262a34] hover:text-white" aria-label="Close Evolution Lab">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-purple-500/10 p-3">
          <p className="text-[10px] uppercase tracking-wider text-amber-300/80">Current Variant</p>
          <p className="mt-0.5 text-sm font-bold leading-tight text-white">{model.name}</p>
          <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-200">強化 {TIER_LABELS[variant.tier]}</span>
            <span className="rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-fuchsia-200">突破 {LIMIT_BREAK_LABELS[variant.limitBreak]}</span>
            <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-cyan-200">{FORM_DEFINITIONS[variant.form].labelJa}</span>
            <span className="rounded bg-neutral-700/50 px-1.5 py-0.5 text-neutral-300">+{generatedCount} 装飾パーツ</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <button onClick={onBake} disabled={isDefault} className="flex items-center justify-center gap-1 rounded bg-amber-600 px-2 py-1.5 text-[11px] font-bold text-white transition hover:bg-amber-500 disabled:opacity-40" title="現在の変化を通常キューブとして確定し、手動編集可能にします">
              <Hammer className="h-3.5 w-3.5" /> 確定 (Bake)
            </button>
            <button onClick={onReset} disabled={isDefault} className="flex items-center justify-center gap-1 rounded bg-[#262a34] px-2 py-1.5 text-[11px] text-neutral-200 transition hover:bg-[#323744] disabled:opacity-40">
              <RotateCcw className="h-3.5 w-3.5" /> 基本形に戻す
            </button>
          </div>
        </div>

        <Section title="段階強化" subtitle="Upgrade Tier +0 〜 +5 · 装飾・宝石・オーラが段階的に追加" icon={Star}>
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: MAX_TIER + 1 }, (_, tier) => (
              <button
                key={tier}
                onClick={() => onVariantChange({ tier })}
                className={`rounded py-1.5 text-[11px] font-bold transition ${variant.tier === tier ? "bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]" : "bg-[#101217] text-neutral-400 hover:text-white"}`}
              >
                {TIER_LABELS[tier]}
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-0.5 text-amber-400">
            {Array.from({ length: MAX_TIER }, (_, index) => (
              <Star key={index} className={`h-3.5 w-3.5 ${index < variant.tier ? "fill-amber-400" : "opacity-25"}`} />
            ))}
          </div>
          <p className="text-[10px] leading-relaxed text-neutral-500">+1 ルーン帯 / +2 宝石ソケット / +3 金装鍔・2本目の帯 / +4 王冠・大柄頭 / +5 オーラシェル</p>
        </Section>

        <Section title="限界突破" subtitle="Limit Break · 配色覚醒・光輪・エネルギー翼" icon={Crown}>
          <div className="grid grid-cols-4 gap-1">
            {Array.from({ length: MAX_LIMIT_BREAK + 1 }, (_, level) => (
              <button
                key={level}
                onClick={() => onVariantChange({ limitBreak: level })}
                className={`rounded py-1.5 text-[11px] font-black transition ${
                  variant.limitBreak === level
                    ? "bg-gradient-to-r from-fuchsia-500 via-amber-400 to-fuchsia-500 text-black shadow-[0_0_14px_rgba(217,70,239,0.5)]"
                    : "bg-[#101217] text-neutral-400 hover:text-white"
                }`}
              >
                {level === 0 ? "なし" : LIMIT_BREAK_LABELS[level]}
              </button>
            ))}
          </div>
          <p className="text-[10px] leading-relaxed text-neutral-500">I エネルギー冠 / II 光翼フィン・金配色・上位魔法陣 / III 光輪・太陽円盤・超越配色</p>
        </Section>

        <Section title="形態変化" subtitle="Form Change · 同一武器の別形態" icon={Layers3}>
          <div className="grid grid-cols-2 gap-1.5">
            {FORM_IDS.map((form) => {
              const definition = FORM_DEFINITIONS[form];
              const active = variant.form === form;
              return (
                <button
                  key={form}
                  onClick={() => onVariantChange({ form })}
                  className={`rounded border p-2 text-left transition ${active ? "border-cyan-400 bg-cyan-500/15" : "border-[#2d3139] bg-[#101217] hover:border-[#3d4454]"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-cyan-300">{definition.icon}</span>
                    <span className="text-[11px] font-bold text-white">{definition.labelJa}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[9.5px] leading-snug text-neutral-500">{definition.description}</p>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="バリアントセット" subtitle={`全 ${variantSet.length} 種 · クリックで即プレビュー`} icon={Zap}>
          <div className="flex flex-wrap gap-1">
            {variantSet.map((entry) => {
              const active = entry.state.tier === variant.tier && entry.state.limitBreak === variant.limitBreak && entry.state.form === variant.form;
              const color = entry.kind === "tier" ? "amber" : entry.kind === "limit_break" ? "fuchsia" : "cyan";
              return (
                <button
                  key={entry.key}
                  onClick={() => onVariantChange(entry.state)}
                  className={`rounded px-2 py-1 text-[10px] font-semibold transition ${
                    active
                      ? "bg-white text-black"
                      : color === "amber"
                        ? "bg-amber-500/15 text-amber-200 hover:bg-amber-500/30"
                        : color === "fuchsia"
                          ? "bg-fuchsia-500/15 text-fuchsia-200 hover:bg-fuchsia-500/30"
                          : "bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/30"
                  }`}
                >
                  {entry.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={onExportPack}
            disabled={isExporting}
            className="flex w-full items-center justify-center gap-1.5 rounded bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-[11px] font-bold text-white shadow transition hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
          >
            <Package className="h-3.5 w-3.5" />
            {isExporting ? "パック生成中..." : `全${variantSet.length}種をリソースパック化 (.zip)`}
          </button>
          <p className="text-[9.5px] leading-snug text-neutral-500">Java用 custom_model_data 切替(旧形式 + 1.21.4 items) · 各 .bbmodel · Bedrock geo/animation · テクスチャを同梱</p>
        </Section>

        <Section title="同一テーマ別モデル" subtitle={`${PALETTES[baseModel.theme].name} テーマの装備一式 (${ARSENAL.length}種)`} icon={Sword}>
          {Array.from(new Set(ARSENAL.map((entry) => entry.group))).map((groupLabel) => (
            <div key={groupLabel}>
              <p className="mb-1 text-[9.5px] font-bold uppercase tracking-wider text-neutral-500">{groupLabel}</p>
              <div className="grid grid-cols-3 gap-1">
                {ARSENAL.filter((entry) => entry.group === groupLabel).map(({ type, label, icon: Icon }) => (
                  <button key={type} onClick={() => onLoadArchetype(type)} className="flex flex-col items-center gap-1 rounded border border-[#2d3139] bg-[#101217] py-2 text-[10px] text-neutral-300 transition hover:border-purple-500/60 hover:text-white">
                    <Icon className="h-3.5 w-3.5 text-purple-300" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[9.5px] text-neutral-500">現在の強化段階・突破・形態を保ったまま別武器に切替</p>
        </Section>

        <Section title="テーマ違い" subtitle="同じ形状 × 別属性エディション" icon={Sparkles}>
          <div className="grid grid-cols-4 gap-1.5">
            {Object.values(PALETTES).map((palette) => (
              <button
                key={palette.id}
                onClick={() => onRetheme(palette.id)}
                className={`rounded border p-1.5 text-left transition ${baseModel.theme === palette.id ? "border-white/70" : "border-[#2d3139] hover:border-[#4b5263]"}`}
                title={palette.name}
                style={{ background: `linear-gradient(135deg, ${palette.dark}, ${palette.primary}55)` }}
              >
                <div className="flex gap-0.5">
                  {[palette.primary, palette.accent, palette.glow].map((color) => (
                    <span key={color} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <span className="mt-1 block truncate text-[9px] font-semibold capitalize text-white">{palette.id}</span>
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
