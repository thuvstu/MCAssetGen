"use client";
import {
  ArrowDownUp,
  Check,
  Gem,
  Layers,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ATTACHMENT_LABELS } from "@/lib/geometry/attachments";
import {
  ATTACHMENT_IDS,
  DEFAULT_GRADIENT,
  type AttachmentKind,
  type AttachmentSettings,
  type GradientSettings,
  type Vec3,
} from "@/lib/model-types";
import Toggle from "@/components/ui/toggle";
import { useStudioStore } from "./studio-context";

const MODES: { id: GradientSettings["mode"]; label: string }[] = [
  { id: "vertical", label: "縦" },
  { id: "horizontal", label: "横" },
  { id: "diagonal", label: "斜め" },
  { id: "radial", label: "放射" },
];
const COLOURS = [
  { label: "オーロラ", from: "#7551d8", to: "#9dffe4" },
  { label: "血月", from: "#421226", to: "#ff5064" },
  { label: "星霜", from: "#24429b", to: "#e2f8ff" },
  { label: "黄金", from: "#543128", to: "#ffe4a0" },
];

export default function FinishingPanel() {
  const { studio } = useStudioStore(),
    settings = studio.settings;
  const gradient = { ...DEFAULT_GRADIENT, ...settings.gradient },
    attachments = settings.attachments ?? [];
  const changeGradient = (patch: Partial<GradientSettings>) =>
    studio.updateSetting("gradient", { ...gradient, ...patch });
  const preview = () => studio.applyPartial({ gradient, attachments });
  const add = (kind: AttachmentKind) => {
    if (attachments.length >= 24) return;
    const part: AttachmentSettings = {
      id: crypto.randomUUID(),
      kind,
      position: [
        0,
        kind === "chain" ? -settings.height * 0.2 : settings.height * 0.2,
        kind === "runes" ? settings.depth / 2 + 0.4 : 0,
      ],
      scale: 1,
      material: kind === "gear" || kind === "chain" ? 6 : 3,
      emissive: !["gear", "chain", "scope"].includes(kind),
      floating: false,
    };
    studio.applyPartial({ attachments: [...attachments, part] });
  };
  const update = (id: string, patch: Partial<AttachmentSettings>) =>
    studio.updateSetting(
      "attachments",
      attachments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
  return (
    <div className="finishing-panel">
      <div className="inspector-section-title">
        <Layers size={14} />
        <span>グラデーション</span>
        <Toggle
          checked={gradient.enabled}
          onChange={() => changeGradient({ enabled: !gradient.enabled })}
          label="グラデーションを有効化"
        />
      </div>
      <p className="inspector-description">
        色の変化をPNGに焼き込み。Minecraftでも
        <br />
        同じ配色を使えます。
      </p>
      <div
        className="gradient-sample"
        style={{
          background:
            gradient.mode === "radial"
              ? `radial-gradient(circle,${gradient.from},${gradient.to})`
              : `linear-gradient(${gradient.mode === "vertical" ? "0deg" : gradient.mode === "horizontal" ? "90deg" : "45deg"},${gradient.from},${gradient.to})`,
        }}
      >
        <span>{gradient.enabled ? "COLOR FINISH" : "GRADIENT PREVIEW"}</span>
      </div>
      <div className="gradient-presets">
        {COLOURS.map((c) => (
          <button
            key={c.label}
            title={`${c.label}の配色`}
            onClick={() =>
              changeGradient({ from: c.from, to: c.to, enabled: true })
            }
          >
            <i
              style={{ background: `linear-gradient(45deg,${c.from},${c.to})` }}
            />
            {c.label}
          </button>
        ))}
      </div>
      <div className="quad-options">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={gradient.mode === m.id ? "selected" : ""}
            onClick={() => changeGradient({ mode: m.id })}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="gradient-colours">
        <label>
          <span>始点</span>
          <input
            type="color"
            value={gradient.from}
            aria-label="グラデーションの始点色"
            onChange={(e) => changeGradient({ from: e.target.value })}
          />
          <small>{gradient.from}</small>
        </label>
        <button
          title="色を入れ替える"
          aria-label="グラデーションの色を入れ替える"
          onClick={() =>
            changeGradient({ from: gradient.to, to: gradient.from })
          }
        >
          <ArrowDownUp size={15} />
        </button>
        <label>
          <span>終点</span>
          <input
            type="color"
            value={gradient.to}
            aria-label="グラデーションの終点色"
            onChange={(e) => changeGradient({ to: e.target.value })}
          />
          <small>{gradient.to}</small>
        </label>
      </div>
      <div className="field-group">
        <div className="field-label">
          <label htmlFor="gradient-strength">強さ</label>
          <span>{gradient.strength}%</span>
        </div>
        <input
          id="gradient-strength"
          type="range"
          min={0}
          max={100}
          value={gradient.strength}
          onChange={(e) => changeGradient({ strength: Number(e.target.value) })}
          style={
            {
              "--range-progress": `${gradient.strength}%`,
            } as React.CSSProperties
          }
        />
      </div>
      <div className="finish-control-row">
        <label>
          段階
          <select
            aria-label="グラデーションの段階数"
            value={gradient.steps}
            onChange={(e) => changeGradient({ steps: Number(e.target.value) })}
          >
            <option value={16}>滑らか · 16色</option>
            <option value={8}>8色</option>
            <option value={4}>ピクセル · 4色</option>
            <option value={2}>2色</option>
          </select>
        </label>
        <label>
          合成
          <select
            aria-label="グラデーションの合成"
            value={gradient.blend}
            onChange={(e) =>
              changeGradient({
                blend: e.target.value as GradientSettings["blend"],
              })
            }
          >
            <option value="mix">ミックス</option>
            <option value="multiply">乗算</option>
          </select>
        </label>
      </div>
      <button className="finish-apply" onClick={preview} disabled={studio.busy}>
        <Check size={14} />
        仕上げをプレビュー
      </button>

      <div className="inspector-section-title attachment-title">
        <Gem size={14} />
        <span>追加パーツ</span>
        <small>{attachments.length} / 24</small>
      </div>
      <p className="inspector-description">
        本体の大きさを変えずに、装飾を重ねる。
      </p>
      <div className="attachment-catalog">
        {ATTACHMENT_IDS.map((kind) => (
          <button
            key={kind}
            onClick={() => add(kind)}
            disabled={studio.busy || attachments.length >= 24}
          >
            <Plus size={11} />
            {ATTACHMENT_LABELS[kind]}
          </button>
        ))}
      </div>
      <div className="attachment-list">
        {attachments.map((a, i) => (
          <div className="attachment-card" key={a.id}>
            <div className="attachment-card-heading">
              <span>
                <Gem size={12} />
                {ATTACHMENT_LABELS[a.kind]}
                <small>{String(i + 1).padStart(2, "0")}</small>
              </span>
              <button
                className="icon-button small"
                title="装飾を削除"
                onClick={() =>
                  studio.applyPartial({
                    attachments: attachments.filter((p) => p.id !== a.id),
                  })
                }
              >
                <Trash2 size={12} />
              </button>
            </div>
            <div className="mini-vector">
              {["X", "Y", "Z"].map((axis, j) => (
                <label key={axis}>
                  <span>{axis}</span>
                  <input
                    type="number"
                    aria-label={`${ATTACHMENT_LABELS[a.kind]} ${i + 1} ${axis}位置`}
                    min={-20}
                    max={20}
                    step={0.5}
                    value={a.position[j]}
                    onChange={(e) =>
                      update(a.id, {
                        position: a.position.map((n, k) =>
                          k === j
                            ? Math.max(
                                -20,
                                Math.min(20, Number(e.target.value)),
                              )
                            : n,
                        ) as Vec3,
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="attachment-controls">
              <label>
                倍率
                <input
                  type="number"
                  aria-label={`装飾 ${i + 1} の倍率`}
                  step={0.25}
                  min={0.25}
                  max={2.5}
                  value={a.scale}
                  onChange={(e) =>
                    update(a.id, {
                      scale: Math.max(
                        0.25,
                        Math.min(2.5, Number(e.target.value)),
                      ),
                    })
                  }
                />
              </label>
              <label>
                素材
                <select
                  value={a.material}
                  aria-label={`装飾 ${i + 1} の素材`}
                  onChange={(e) =>
                    update(a.id, { material: Number(e.target.value) })
                  }
                >
                  {studio.model.palette.map((_, m) => (
                    <option key={m} value={m}>
                      {
                        [
                          "暗色",
                          "金属",
                          "結晶",
                          "明色",
                          "ハイライト",
                          "革",
                          "金",
                          "補色",
                        ][m]
                      }
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="attachment-flags">
              <label>
                <input
                  type="checkbox"
                  checked={a.emissive}
                  onChange={(e) => update(a.id, { emissive: e.target.checked })}
                />
                発光
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={a.floating}
                  onChange={(e) => update(a.id, { floating: e.target.checked })}
                />
                浮遊
              </label>
            </div>
          </div>
        ))}
      </div>
      {attachments.length > 0 && (
        <button
          className="finish-apply"
          onClick={preview}
          disabled={studio.busy}
        >
          <Sparkles size={14} />
          パーツ設定を適用
        </button>
      )}
      <button
        className="finish-reset text-button"
        onClick={() =>
          studio.applyPartial({ gradient: undefined, attachments: [] })
        }
      >
        <RotateCcw size={12} />
        仕上げ設定をリセット
      </button>
    </div>
  );
}
