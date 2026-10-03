"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Studio } from "@/lib/state/useStudioState";
import { PanelId } from "./Rail";
import {
  CATEGORIES,
  FAMILY_LABELS,
  deriveThemeArsenalConfigs,
  deriveTieredConfig,
  LEGENDARY_PRESETS,
  LIMIT_BREAK_LEVELS,
  OPTION_SETS,
  PART_GROUP_LABELS,
  PART_TOGGLES,
  TACTICAL_MODES,
  THEME_LABELS,
  THEME_PALETTES,
  UPGRADE_TIERS,
  WEAPON_FORMS,
} from "@/lib/themes";
import { paintAtlas } from "@/lib/atlas";
import { GeneratedModel, GeneratorConfig, MagicTheme } from "@/lib/types";
import { generateModel } from "@/lib/generator";
import {
  createThemeArsenalPack,
  createTierProgressionPack,
  downloadFile,
} from "@/lib/export/resourcepack";
import { sanitizeIdentifier } from "@/lib/color";

/* ---------------- primitives ---------------- */

function Head({
  idx,
  title,
  en,
  lead,
}: {
  idx: string;
  title: string;
  en: string;
  lead?: string;
}) {
  return (
    <div className="mb-4">
      <div className="sec-head">
        <span className="sec-idx">{idx}</span>
        <h2 className="mincho text-[19px] font-bold leading-none text-bone">{title}</h2>
        <span className="lbl ml-auto">{en}</span>
      </div>
      {lead && <p className="text-[11.5px] leading-[1.85] text-ash">{lead}</p>}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block py-1">
      <span className="flex items-baseline justify-between">
        <span className="text-[11px] text-ash">{label}</span>
        <span className="num text-[12px] font-medium text-bone">
          {value}
          <span className="pl-0.5 text-[9px] text-ash">{unit}</span>
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function OptGrid<T extends string>({
  value,
  options,
  onChange,
  cols = 1,
}: {
  value: T;
  options: { id: T; ja: string; hint?: string }[];
  onChange: (v: T) => void;
  cols?: 1 | 2;
}) {
  return (
    <div className={`grid ${cols === 2 ? "grid-cols-2 gap-x-3" : "grid-cols-1"}`}>
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`opt ${value === o.id ? "opt-on" : ""}`}
        >
          <span className="tick" />
          <span className="flex-1">{o.ja}</span>
          {o.hint && <span className="lbl text-[8px] opacity-70">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`opt ${checked ? "opt-on" : ""}`}>
      <span className="tick" />
      <span className="flex-1">{label}</span>
      <span className="lbl text-[8px] opacity-70">{checked ? "ON" : "OFF"}</span>
    </button>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 mt-6 flex items-center gap-2">
      <span className="lbl">{children}</span>
      <span className="h-px flex-1 bg-line-soft" />
    </div>
  );
}

/* ---------------- atlas preview ---------------- */

function AtlasPreview({ model }: { model: GeneratedModel }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { palette, config } = model;

  useEffect(() => {
    if (!ref.current) return;
    const src = paintAtlas(palette, config.textureResolution, config.atlasPattern);
    const ctx = ref.current.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 140, 140);
    ctx.drawImage(src, 0, 0, 140, 140);
  }, [palette, config.textureResolution, config.atlasPattern]);

  return (
    <div className="border border-line bg-ink/50 p-3">
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="lbl">ITEM ATLAS</span>
        <span className="num text-[10px] text-ash">
          {config.textureResolution}² · {config.atlasPattern}
        </span>
      </div>
      <div className="flex justify-center border border-line-soft bg-black/45 p-3">
        <canvas
          ref={ref}
          width={140}
          height={140}
          className="border border-white/10"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}

/* ---------------- main inspector ---------------- */

interface Props {
  panel: PanelId;
  studio: Studio;
}

export function Inspector({ panel, studio }: Props) {
  const {
    config,
    model,
    update,
    replace,
    applyPreset,
    applyCategory,
    setUpgradeTier,
    setLimitBreak,
    setWeaponForm,
    setTacticalMode,
    triggerAnimation,
    resetPalette,
  } = studio;

  const [packing, setPacking] = useState<null | "tiers" | "arsenal">(null);

  const set = <K extends keyof GeneratorConfig>(key: K) => (value: GeneratorConfig[K]) =>
    update({ [key]: value } as Partial<GeneratorConfig>, key as string);

  const tierStats = useMemo(
    () =>
      UPGRADE_TIERS.map((t) => {
        const m = generateModel(deriveTieredConfig(config, t.tier, 0));
        return { ...t, voxels: m.stats.elementCount, h: m.stats.size[1] };
      }),
    [config]
  );

  const arsenal = useMemo(() => deriveThemeArsenalConfigs(config), [config]);

  const colorRows: { key: keyof typeof model.palette; label: string; en: string }[] = [
    { key: "primary", label: "主素材・刀身金属", en: "PRIMARY" },
    { key: "secondary", label: "副色・柄とリム", en: "SECONDARY" },
    { key: "accent", label: "鍔・紋様アクセント", en: "ACCENT" },
    { key: "gem", label: "宝玉コア発光", en: "GEM" },
    { key: "glow", label: "オーラ・粒子", en: "GLOW" },
    { key: "wood", label: "柄芯・木材", en: "WOOD" },
    { key: "bone", label: "骨・牙・羽根", en: "BONE" },
    { key: "cloth", label: "革・巻き紐", en: "CLOTH" },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-10 pt-4">
      {panel === "type" && (
        <>
          <Head
            idx="01"
            title="型と属性"
            en="TYPE / THEME"
            lead="生成する3Dモデルの基本形状と、材質カラーパレットを決める魔法属性を選択します。"
          />

          <SubHead>CATEGORY — 基本型（全{CATEGORIES.length}種）</SubHead>
          {(["melee", "caster", "ranged", "machine", "armor", "relic"] as const).map((family) => (
            <div key={family} className="mb-4">
              <div className="lbl mb-1 px-1 text-[8.5px] opacity-60">
                {FAMILY_LABELS[family]}
              </div>
              <div className="border-t border-line-soft">
                {CATEGORIES.filter((c) => c.family === family).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => applyCategory(cat.id)}
                    title={cat.note}
                    className={`opt ${config.category === cat.id ? "opt-on" : ""}`}
                  >
                    <span className="tick" />
                    <span className="num w-4 text-[10px] opacity-60">{cat.glyph}</span>
                    <span className="flex-1">{cat.ja}</span>
                    <span className="lbl text-[8px] opacity-60">{cat.en}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <SubHead>THEME — 魔法属性</SubHead>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(THEME_PALETTES) as MagicTheme[]).map((theme) => {
              const p = THEME_PALETTES[theme];
              const on = config.theme === theme;
              return (
                <button
                  key={theme}
                  onClick={() => update({ theme, customPalette: undefined })}
                  className={`border text-left transition-colors ${
                    on ? "border-ember" : "border-line hover:border-ash/60"
                  }`}
                >
                  <span
                    className="block h-8"
                    style={{
                      background: `linear-gradient(112deg, ${p.primary} 0%, ${p.secondary} 36%, ${p.accent} 70%, ${p.gem} 100%)`,
                    }}
                  />
                  <span className="block px-2 py-1.5">
                    <span className="block text-[10.5px] font-medium leading-tight text-bone">
                      {THEME_LABELS[theme].ja}
                    </span>
                    <span className="lbl block pt-1 text-[7.5px] opacity-65">
                      {THEME_LABELS[theme].en}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <SubHead>PRESETS — 伝説の型</SubHead>
          <div>
            {LEGENDARY_PRESETS.map((pr) => (
              <button key={pr.id} onClick={() => applyPreset(pr)} className="opt items-start">
                <span
                  className="mt-0.5 h-8 w-8 flex-none"
                  style={{
                    background: `linear-gradient(135deg, ${THEME_PALETTES[pr.theme].accent}, ${THEME_PALETTES[pr.theme].gem})`,
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-medium text-bone">{pr.nameJa}</span>
                  <span className="lbl block pt-1 text-[8px] opacity-65">
                    {pr.nameEn} · {pr.category}
                  </span>
                  <span className="mt-1 block text-[10.5px] leading-relaxed text-ash">
                    {pr.blurb}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <SubHead>VARIATION — 変異</SubHead>
          <Slider
            label="全体スケール"
            value={config.overallScale}
            min={0.6}
            max={1.8}
            step={0.05}
            unit="×"
            onChange={set("overallScale")}
          />
          <Slider
            label="乱数シード"
            value={config.seed}
            min={1}
            max={99999}
            onChange={set("seed")}
          />
        </>
      )}

      {panel === "evolution" && (
        <>
          <Head
            idx="02"
            title="進化と形態"
            en="EVOLUTION"
            lead="同一武器の5段階強化、限界突破、変形機構、一時バフモード、同テーマ別編成。すべて現在のデザインを継承して派生します。"
          />

          <SubHead>UPGRADE TIERS — 段階強化 ([ / ])</SubHead>
          <div className="border-t border-line-soft">
            {tierStats.map((t) => {
              const on = config.upgradeTier === t.tier;
              return (
                <button
                  key={t.tier}
                  onClick={() => setUpgradeTier(t.tier)}
                  className={`opt items-start ${on ? "opt-on" : ""}`}
                >
                  <span className="num w-7 flex-none pt-0.5 text-[15px] font-bold leading-none">
                    {t.roman}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-[12px] font-medium text-bone">{t.ja}</span>
                      <span className="lbl text-[8px] opacity-60">{t.en}</span>
                    </span>
                    <span className="mt-1 block text-[10.5px] leading-relaxed text-ash">
                      {t.desc}
                    </span>
                  </span>
                  <span className="num flex-none pt-0.5 text-right text-[10px] text-ash">
                    {t.voxels}v
                    <span className="block opacity-60">H{t.h}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={async () => {
              setPacking("tiers");
              try {
                const blob = await createTierProgressionPack(config);
                downloadFile(
                  blob,
                  `${sanitizeIdentifier(config.name)}_Evolution_Tier1to7.zip`,
                  "application/zip"
                );
              } finally {
                setPacking(null);
              }
            }}
            disabled={packing !== null}
            className="btn mt-3 w-full justify-center"
          >
            {packing === "tiers" ? "GENERATING…" : "全7段階 一括ZIP出力"}
          </button>

          <SubHead>LIMIT BREAK — 限界突破 (L)</SubHead>
          <div className="border-t border-line-soft">
            {LIMIT_BREAK_LEVELS.map((lb) => (
              <button
                key={lb.level}
                onClick={() => setLimitBreak(lb.level)}
                className={`opt items-start ${
                  config.limitBreak === lb.level ? "opt-on" : ""
                }`}
              >
                <span className="tick mt-1" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[12px] font-medium text-bone">{lb.ja}</span>
                    <span className="lbl text-[8px] opacity-60">{lb.en}</span>
                  </span>
                  <span className="mt-1 block text-[10.5px] leading-relaxed text-ash">
                    {lb.desc}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <SubHead>WEAPON FORM — 形態変化 (F)</SubHead>
          <div className="border-t border-line-soft">
            {WEAPON_FORMS.map((wf) => (
              <button
                key={wf.id}
                onClick={() => setWeaponForm(wf.id)}
                className={`opt items-start ${config.weaponForm === wf.id ? "opt-on" : ""}`}
              >
                <span className="tick mt-1" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[12px] font-medium text-bone">{wf.ja}</span>
                    <span className="lbl text-[8px] opacity-60">{wf.en}</span>
                  </span>
                  <span className="mt-1 block text-[10.5px] leading-relaxed text-ash">
                    {wf.desc}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <SubHead>TACTICAL MODE — 一時的モード変化 (M)</SubHead>
          <div className="border-t border-line-soft">
            {TACTICAL_MODES.map((tm) => (
              <button
                key={tm.id}
                onClick={() => setTacticalMode(tm.id)}
                className={`opt items-start ${config.tacticalMode === tm.id ? "opt-on" : ""}`}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 flex-none"
                  style={{ backgroundColor: tm.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[12px] font-medium text-bone">{tm.ja}</span>
                    <span className="lbl text-[8px] opacity-60">{tm.en}</span>
                  </span>
                  <span className="mt-1 block text-[10.5px] leading-relaxed text-ash">
                    {tm.desc}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <SubHead>{THEME_LABELS[config.theme].en} ARSENAL — 同一テーマ別モデル</SubHead>
          <p className="mb-2 px-1 text-[10.5px] leading-relaxed text-ash">
            {THEME_LABELS[config.theme].ja} × Tier {config.upgradeTier} の仕様を保ったまま、別カテゴリへ派生します。
          </p>
          <div className="border-t border-line-soft">
            {arsenal.map((itemCfg) => {
              const meta = CATEGORIES.find((c) => c.id === itemCfg.category)!;
              const on = config.category === itemCfg.category;
              return (
                <button
                  key={itemCfg.category}
                  onClick={() => replace(itemCfg)}
                  className={`opt ${on ? "opt-on" : ""}`}
                >
                  <span className="tick" />
                  <span className="flex-1 truncate">{itemCfg.name}</span>
                  <span className="lbl text-[8px] opacity-60">{meta.en}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={async () => {
              setPacking("arsenal");
              try {
                const blob = await createThemeArsenalPack(config);
                downloadFile(
                  blob,
                  `${config.theme}_Arsenal_14Items.zip`,
                  "application/zip"
                );
              } finally {
                setPacking(null);
              }
            }}
            disabled={packing !== null}
            className="btn btn-solid mt-3 w-full justify-center"
          >
            {packing === "arsenal" ? "GENERATING…" : "全14種 兵装一式 一括ZIP出力"}
          </button>
        </>
      )}

      {panel === "shape" && (
        <>
          <Head
            idx="03"
            title="形状と装飾"
            en="DIMENSIONS / ORNAMENT"
            lead="刀身・鍔・柄の寸法から、刻印やオーラ輪郭までの細部を設計します。"
          />

          <SubHead>DIMENSIONS — 寸法</SubHead>
          <Slider label="刀身・ヘッド長" value={config.bladeLength} min={6} max={36} unit="u" onChange={set("bladeLength")} />
          <Slider label="刀身の幅" value={config.bladeWidth} min={2} max={9} unit="u" onChange={set("bladeWidth")} />
          <Slider label="鍔の幅" value={config.crossguardWidth} min={4} max={24} unit="u" onChange={set("crossguardWidth")} />
          <Slider label="柄の長さ" value={config.handleLength} min={4} max={20} unit="u" onChange={set("handleLength")} />
          <Slider label="宝玉サイズ" value={config.coreGemSize} min={2} max={9} unit="u" onChange={set("coreGemSize")} />

          <SubHead>GUARD — 鍔・頭部の形状</SubHead>
          <OptGrid value={config.crossguardStyle} options={OPTION_SETS.crossguard} onChange={set("crossguardStyle")} />

          <SubHead>EDGE — 刃のエッジ</SubHead>
          <OptGrid value={config.bladeEdgeStyle} options={OPTION_SETS.edge} onChange={set("bladeEdgeStyle")} />

          <SubHead>PROFILE — 断面</SubHead>
          <OptGrid value={config.bladeProfile} options={OPTION_SETS.profile} onChange={set("bladeProfile")} cols={2} />

          <SubHead>MUZZLE — 砲口・放出機構</SubHead>
          <OptGrid value={config.muzzleStyle} options={OPTION_SETS.muzzle} onChange={set("muzzleStyle")} cols={2} />

          {/* ---- modular part library, grouped by flavour ---- */}
          {(["arcane", "machine", "cursed", "ornament"] as const).map((grp) => (
            <React.Fragment key={grp}>
              <SubHead>{PART_GROUP_LABELS[grp]}</SubHead>
              <div className="border-t border-line-soft">
                {PART_TOGGLES.filter((p) => p.group === grp).map((p) => (
                  <Toggle
                    key={p.key as string}
                    label={p.ja}
                    checked={Boolean(config[p.key])}
                    onChange={(v) => update({ [p.key]: v } as Partial<GeneratorConfig>)}
                  />
                ))}
              </div>
            </React.Fragment>
          ))}
        </>
      )}

      {panel === "floating" && (
        <>
          <Head
            idx="04"
            title="浮遊物"
            en="ORBITING RELICS"
            lead="本体の周りを巡る魔導片・結晶・怨霊など、三次元的な重なりを演出します。"
          />

          <SubHead>TYPE — 浮遊物の種類</SubHead>
          <div className="border-t border-line-soft">
            {OPTION_SETS.floating.map((f) => (
              <button
                key={f.id}
                onClick={() => update({ floatingType: f.id })}
                className={`opt ${config.floatingType === f.id ? "opt-on" : ""}`}
              >
                <span className="tick" />
                <span className="num w-5 text-[11px] opacity-60">{f.glyph}</span>
                <span className="flex-1">{f.ja}</span>
              </button>
            ))}
          </div>

          {config.floatingType !== "none" && (
            <>
              <SubHead>ORBIT — 軌道パラメータ</SubHead>
              <Slider label="浮遊個数" value={config.floatingCount} min={1} max={8} unit="個" onChange={set("floatingCount")} />
              <Slider label="周回半径" value={config.floatingRadius} min={4} max={26} unit="u" onChange={set("floatingRadius")} />
              <Slider label="浮遊高度" value={config.floatingHeightOffset} min={-10} max={20} unit="u" onChange={set("floatingHeightOffset")} />
            </>
          )}

          <SubHead>BONE HIERARCHY — 出力ボーン</SubHead>
          <p className="px-1 text-[11px] leading-[1.9] text-ash">
            浮遊物は <span className="num text-arcana">Floating</span>、限界突破の副兵装は{" "}
            <span className="num text-ember-bright">Funnel</span>、背面光輪は{" "}
            <span className="num text-arcana">Halo</span>、分裂刀身は{" "}
            <span className="num text-ember-bright">BladeL / BladeR</span> として独立ボーンで書き出されます。
          </p>
        </>
      )}

      {panel === "motion" && (
        <>
          <Head
            idx="05"
            title="動作とVFX"
            en="ANIMATION / VFX"
            lead="三連撃コンボ・溜め次元斬・大魔法詠唱・変形・覚醒バーストのモデルアニメーションと粒子演出。"
          />

          <div className="flex items-center justify-between border border-line px-3 py-2.5">
            <div>
              <div className="text-[12px] font-medium text-bone">アニメーション再生</div>
              <div className="lbl pt-1.5">SPACE キーで切替</div>
            </div>
            <button
              onClick={() => update({ animationEnabled: !config.animationEnabled })}
              className={`btn ${config.animationEnabled ? "btn-solid" : ""}`}
            >
              {config.animationEnabled ? "ON" : "OFF"}
            </button>
          </div>

          <SubHead>MOTION — モーション</SubHead>
          <div className="border-t border-line-soft">
            {OPTION_SETS.animation.map((m) => (
              <button
                key={m.id}
                onClick={() => triggerAnimation(m.id)}
                className={`opt ${config.animationMode === m.id ? "opt-on" : ""}`}
              >
                <span className="tick" />
                <span className="flex-1">{m.ja}</span>
                <span className="lbl text-[8px] opacity-65">{m.en}</span>
                <span
                  className={`lbl text-[7.5px] ${
                    m.kind === "attack"
                      ? "text-ember-bright"
                      : m.kind === "magic"
                      ? "text-arcana"
                      : "opacity-50"
                  }`}
                >
                  {m.kind}
                </span>
              </button>
            ))}
          </div>

          <SubHead>TIMING — タイミング</SubHead>
          <Slider label="速度" value={config.animationSpeed} min={0.2} max={3} step={0.1} unit="×" onChange={set("animationSpeed")} />
          <Slider label="振幅" value={config.floatAmplitude} min={0.2} max={2} step={0.1} unit="×" onChange={set("floatAmplitude")} />

          <SubHead>PARTICLE — 粒子放出</SubHead>
          <OptGrid value={config.particleEffect} options={OPTION_SETS.particles} onChange={set("particleEffect")} cols={2} />
          <div className="mt-3">
            <Slider label="粒子数" value={config.particleDensity} min={0} max={140} step={2} onChange={set("particleDensity")} />
            <Slider label="上昇速度" value={config.particleSpeed} min={0.2} max={3} step={0.1} unit="×" onChange={set("particleSpeed")} />
            <Slider label="発光強度" value={config.bloomIntensity} min={0.2} max={2.5} step={0.1} unit="×" onChange={set("bloomIntensity")} />
          </div>
        </>
      )}

      {panel === "colors" && (
        <>
          <Head
            idx="06"
            title="配色と生地"
            en="MATERIAL"
            lead="8チャンネルのマテリアルパレットと、Minecraft用ピクセルアトラスの生成規則。"
          />

          <SubHead>PALETTE — マテリアル</SubHead>
          <div>
            {colorRows.map((row) => {
              const current = model.palette[row.key];
              return (
                <label
                  key={row.key}
                  className="flex cursor-pointer items-center gap-3 border-b border-line-soft px-1 py-2 transition-colors hover:bg-white/[0.03]"
                >
                  <input
                    type="color"
                    value={current}
                    onChange={(e) =>
                      update(
                        { customPalette: { ...config.customPalette, [row.key]: e.target.value } },
                        `color-${row.key}`
                      )
                    }
                    className="h-7 w-7 flex-none cursor-pointer"
                  />
                  <span className="flex-1 text-[11.5px] text-ash">{row.label}</span>
                  <span className="lbl">{row.en}</span>
                  <span className="num w-[62px] text-right text-[10px] text-bone/80">
                    {current}
                  </span>
                </label>
              );
            })}
          </div>

          <button onClick={resetPalette} className="btn mt-3 w-full justify-center">
            規定色に戻す
          </button>

          <SubHead>RESOLUTION — 解像度</SubHead>
          <div className="flex">
            {[16, 32, 64].map((res) => (
              <button
                key={res}
                onClick={() => update({ textureResolution: res as 16 | 32 | 64 })}
                className={`num flex-1 border py-2 text-[11px] transition-colors ${
                  config.textureResolution === res
                    ? "border-ember text-ember-bright"
                    : "border-line text-ash hover:text-bone"
                } ${res !== 16 ? "-ml-px" : ""}`}
              >
                {res}²
              </button>
            ))}
          </div>

          <SubHead>PATTERN — 表面パターン</SubHead>
          <OptGrid value={config.atlasPattern} options={OPTION_SETS.atlas} onChange={set("atlasPattern")} cols={2} />

          <div className="mt-5">
            <AtlasPreview model={model} />
          </div>
        </>
      )}
    </div>
  );
}
