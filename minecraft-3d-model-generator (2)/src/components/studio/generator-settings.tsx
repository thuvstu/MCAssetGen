"use client";
import { useState, type CSSProperties } from "react";
import {
  ChevronDown,
  Crown,
  Flame,
  Info,
  Settings2,
  Sparkles,
  Swords,
  WandSparkles,
} from "lucide-react";
import Toggle from "@/components/ui/toggle";
import {
  MAX_TIER,
  TEMPLATE_CATEGORIES,
  TEMPLATES,
  type ModelKind,
} from "@/lib/model-types";
import { presetsFor } from "@/lib/presets";
import {
  ACTION_OPTIONS,
  ANIMATION_OPTIONS,
  DIMENSION_FIELDS,
  EFFECT_OPTIONS,
  FLOATER_OPTIONS,
  FORM_OPTIONS,
  MODE_OPTIONS,
  PROMPT_SUGGESTIONS,
  QUALITY_OPTIONS,
  STYLE_OPTIONS,
  type Option,
} from "./settings-options";
import { useStudioStore } from "./studio-context";

function Options<T extends string>({
  items,
  value,
  onChange,
  className = "quad-options",
}: {
  items: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {items.map((o) => (
        <button
          key={o.id}
          className={value === o.id ? "selected" : ""}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.icon && <o.icon size={11} />} {o.label}
        </button>
      ))}
    </div>
  );
}
export default function GeneratorSettings() {
  const { studio } = useStudioStore(),
    s = studio.settings;
  const [advanced, setAdvanced] = useState(false);
  const template = TEMPLATES.find((t) => t.kind === s.kind)!;
  const examples = [...PROMPT_SUGGESTIONS, template.prompt],
    presets = presetsFor(s.kind);
  return (
    <div className="generator-settings">
      <div className="field-group type-field">
        <label htmlFor="model-type">
          モデルタイプ<span className="label-required">*</span>
        </label>
        <div className="type-select">
          <Swords size={16} />
          <select
            id="model-type"
            value={s.kind}
            disabled={studio.busy}
            onChange={(e) => studio.chooseTemplate(e.target.value as ModelKind)}
          >
            {TEMPLATE_CATEGORIES.map((cat) => (
              <optgroup key={cat.id} label={cat.label}>
                {TEMPLATES.filter((t) => t.category === cat.id).map((t) => (
                  <option key={t.kind} value={t.kind}>
                    {t.label}（{t.english}）
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown size={13} />
        </div>
      </div>
      <div className="field-group presets-field">
        <label>スキルプリセット</label>
        <div className="preset-chips">
          {presets.map((p) => (
            <button
              key={p.id}
              title={p.description}
              onClick={() => studio.applyPartial(p.settings)}
            >
              <Sparkles size={10} />
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field-group prompt-field">
        <div className="field-label">
          <label htmlFor="model-prompt">デザインのヒント</label>
          <span>任意</span>
        </div>
        <div className="prompt-input">
          <textarea
            id="model-prompt"
            value={s.prompt}
            maxLength={1000}
            onChange={(e) => studio.updateSetting("prompt", e.target.value)}
            placeholder="色・素材・世界観のキーワード…"
          />
          <button
            className="prompt-idea"
            title="別の配色のヒントを試す"
            onClick={() =>
              studio.updateSetting(
                "prompt",
                examples[(examples.indexOf(s.prompt) + 1) % examples.length],
              )
            }
          >
            <WandSparkles size={11} />
            ヒントを試す
          </button>
        </div>
        <p className="field-help">
          <Info size={10} />
          色・素材のキーワードで配色を調整
        </p>
      </div>
      <div className="field-group">
        <label>スタイル</label>
        <Options
          items={STYLE_OPTIONS}
          value={s.style}
          onChange={(v) => studio.updateSetting("style", v)}
          className="style-options"
        />
      </div>
      <div className="field-group quality-field">
        <label>生成品質</label>
        <Options
          items={QUALITY_OPTIONS}
          value={s.quality}
          onChange={(v) => studio.updateSetting("quality", v)}
          className="quality-options"
        />
      </div>
      <details className="tool-accordion" open>
        <summary>
          <Sparkles size={13} />
          演出・浮遊物
          <ChevronDown size={12} />
        </summary>
        <div>
          <div className="field-group floaters-field">
            <label>浮遊物</label>
            <Options
              items={FLOATER_OPTIONS}
              value={s.floaters}
              onChange={(v) => studio.updateSetting("floaters", v)}
            />
          </div>
          <div className="field-group effect-field">
            <label>エフェクト</label>
            <Options
              items={EFFECT_OPTIONS}
              value={s.effect}
              onChange={(v) => studio.updateSetting("effect", v)}
              className="effect-options"
            />
          </div>
          <div className="field-group animation-field">
            <label>浮遊物のアニメーション</label>
            <Options
              items={ANIMATION_OPTIONS}
              value={s.animation}
              onChange={studio.setAnimation}
              className="action-options"
            />
          </div>
          <div className="field-group">
            <label>発動モーション</label>
            <Options
              items={ACTION_OPTIONS}
              value={s.action}
              onChange={(v) => studio.updateSetting("action", v)}
              className="action-options"
            />
            <p className="field-help">
              <Info size={10} />
              可動パーツのモーションも .bbmodel に同梱
            </p>
          </div>
        </div>
      </details>
      <details className="tool-accordion" open>
        <summary>
          <Flame size={13} />
          強化・形態変化
          <ChevronDown size={12} />
        </summary>
        <div>
          <div className="field-group">
            <div className="field-label">
              <label>段階強化</label>
              <span>+{s.tier}</span>
            </div>
            <div className="tier-options" role="group" aria-label="段階強化">
              {Array.from({ length: MAX_TIER + 1 }, (_, tier) => (
                <button
                  key={tier}
                  className={s.tier === tier ? "selected" : ""}
                  aria-pressed={s.tier === tier}
                  onClick={() => studio.updateSetting("tier", tier)}
                >
                  +{tier}
                </button>
              ))}
            </div>
          </div>
          <div className="toggle-row limit-row">
            <span>
              <Crown size={11} />
              限界突破
            </span>
            <Toggle
              checked={s.limitBreak}
              onChange={() => studio.updateSetting("limitBreak", !s.limitBreak)}
              label="限界突破を有効化"
            />
          </div>
          <div className="field-group">
            <label>形態</label>
            <Options
              items={FORM_OPTIONS}
              value={s.form}
              onChange={(v) => studio.updateSetting("form", v)}
              className="tri-options"
            />
          </div>
          <div className="field-group">
            <label>一時モード</label>
            <Options
              items={MODE_OPTIONS}
              value={s.mode}
              onChange={(v) => studio.updateSetting("mode", v)}
              className="duo-options"
            />
          </div>
        </div>
      </details>
      <div className="field-group detail-field">
        <div className="field-label">
          <label htmlFor="detail-slider">ディテール</label>
          <span className="detail-value">
            {s.detail}
            <small>%</small>
          </span>
        </div>
        <input
          id="detail-slider"
          type="range"
          min={0}
          max={100}
          value={s.detail}
          onChange={(e) =>
            studio.updateSetting("detail", Number(e.target.value))
          }
          style={{ "--range-progress": `${s.detail}%` } as CSSProperties}
        />
        <div className="slider-labels">
          <span>シンプル</span>
          <span>繊細</span>
        </div>
      </div>
      <div className="field-group dimensions-field">
        <div className="field-label">
          <label>モデルサイズ</label>
          <span>px</span>
        </div>
        <div className="dimension-inputs">
          {DIMENSION_FIELDS.map((d) => (
            <label
              key={d.axis}
              className={`dimension-input axis-${d.axis.toLowerCase()}`}
            >
              <span>{d.axis}</span>
              <input
                type="number"
                aria-label={`モデルの${d.axis}サイズ`}
                min={d.min}
                max={d.max}
                value={s[d.key]}
                onChange={(e) =>
                  studio.updateSetting(
                    d.key,
                    Math.max(d.min, Math.min(d.max, Number(e.target.value))),
                  )
                }
              />
            </label>
          ))}
        </div>
      </div>
      <div className={`advanced-settings ${advanced ? "is-open" : ""}`}>
        <button
          className="advanced-heading"
          onClick={() => setAdvanced((v) => !v)}
          aria-expanded={advanced}
        >
          <span>
            <Settings2 size={13} />
            詳細設定
          </span>
          <ChevronDown size={13} />
        </button>
        {advanced && (
          <div className="advanced-content">
            <div className="toggle-row">
              <span>左右対称</span>
              <Toggle
                checked={s.symmetric}
                onChange={() => studio.updateSetting("symmetric", !s.symmetric)}
                label="左右対称"
              />
            </div>
            <div className="toggle-row">
              <span>自動UVマッピング</span>
              <Toggle
                checked={s.autoUV}
                onChange={() => studio.updateSetting("autoUV", !s.autoUV)}
                label="自動UVマッピング"
              />
            </div>
            <label className="seed-control">
              シード
              <input
                type="number"
                min={0}
                max={999999}
                aria-label="生成シード"
                value={s.seed}
                onChange={(e) =>
                  studio.updateSetting(
                    "seed",
                    Math.round(
                      Math.max(0, Math.min(999999, Number(e.target.value))),
                    ),
                  )
                }
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
