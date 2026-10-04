"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  ChevronDown,
  Expand,
  Grid3X3,
  Layers,
  LoaderCircle,
  Maximize,
  Minus,
  Mouse,
  MousePointer2,
  Move,
  Plus,
  RotateCcw,
  RotateCw,
  ScanLine,
  X,
  Zap,
} from "lucide-react";
import ModelViewport from "@/components/viewport";
import type { CameraView } from "@/components/viewport/types";
import * as api from "@/lib/api-client";
import { TEMPLATES, type GeneratedModel } from "@/lib/model-types";
import ActionPlayer from "./action-player";
import { ZOOM_LIMITS } from "./hooks/use-viewport-state";
import { useStudioStore, type EditorTab } from "./studio-context";
import UvEditor from "./uv-editor";
import VariantsPanel from "./variants-panel";

const VIEW_LABELS: Record<CameraView, string> = {
  perspective: "パースペクティブ",
  front: "正面",
  right: "右側面",
  top: "上面",
};

const TABS: { id: EditorTab; label: string; icon: typeof Box }[] = [
  { id: "preview", label: "3Dプレビュー", icon: Box },
  { id: "uv", label: "UVエディタ", icon: ScanLine },
  { id: "variants", label: "バリアント", icon: Layers },
];

/** How long the temporary mode stays active in the preview. */
const TEMPORARY_MODE_MS = 4000;

function GenerationOverlay() {
  return (
    <div className="generation-overlay">
      <div className="generation-orbit">
        <Box size={27} />
        <span />
      </div>
      <strong>ピクセルに、命を吹き込んでいます。</strong>
      <p>形状とUVマッピングを生成中…</p>
      <div className="generation-progress">
        <span />
      </div>
    </div>
  );
}

function AxisGizmo({ onSelect }: { onSelect: (view: CameraView) => void }) {
  return (
    <div className="axis-gizmo">
      <svg viewBox="0 0 84 84" aria-hidden="true">
        <path d="M40 44V15" stroke="#90b6a1" strokeWidth="1.5" />
        <path d="m40 44 28 12" stroke="#ba777f" strokeWidth="1.5" />
        <path d="m40 44-22 15" stroke="#8584b8" strokeWidth="1.5" />
        <circle cx="40" cy="44" r="4" fill="#a4a5b0" />
      </svg>
      <button
        className="axis-y"
        title="上面を見る"
        onClick={() => onSelect("top")}
      >
        Y
      </button>
      <button
        className="axis-x"
        title="右側面を見る"
        onClick={() => onSelect("right")}
      >
        X
      </button>
      <button
        className="axis-z"
        title="正面を見る"
        onClick={() => onSelect("front")}
      >
        Z
      </button>
    </div>
  );
}

/**
 * Temporarily previews the opposite mode (normal ⇄ overdrive) with a motion,
 * then reverts. The editor's own settings are never modified.
 */
function useTemporaryMode(
  model: GeneratedModel,
  notify: (message: string, type?: "error") => void,
) {
  const [override, setOverride] = useState<GeneratedModel | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    setOverride(null);
    if (timer.current) clearTimeout(timer.current);
  }, [model]);

  const trigger = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { settings } = model;
      const preview = await api.previewModel({
        ...settings,
        mode: settings.mode === "charged" ? "normal" : "charged",
        action: settings.action === "none" ? "charge" : settings.action,
      });
      setOverride(preview);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setOverride(null), TEMPORARY_MODE_MS);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "一時モードを発動できませんでした。",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return { override, loading, trigger };
}

export default function PreviewCard({
  onOpenAtlasPicker,
}: {
  onOpenAtlasPicker: () => void;
}) {
  const {
    studio,
    viewport,
    viewportActions,
    tab,
    setTab,
    notify,
    setInspectorTab,
  } = useStudioStore();
  const { model, busy, dirty } = studio;
  const temporary = useTemporaryMode(model, notify);
  const shown = temporary.override ?? model;
  const template = TEMPLATES.find((item) => item.kind === shown.settings.kind);
  const objectLabel =
    shown.settings.kind === "sword" ? "Crystal blade" : template?.english;
  const badges = [
    shown.settings.tier > 0 && `+${shown.settings.tier}`,
    shown.settings.limitBreak && "限界突破",
    shown.settings.form === "sealed" && "封印",
    shown.settings.form === "released" && "解放",
    shown.settings.mode === "charged" && "オーバードライブ",
  ].filter(Boolean) as string[];

  return (
    <section
      className={`preview-card ${viewport.expanded ? "preview-expanded" : ""}`}
      aria-label="モデルプレビュー"
    >
      <div className="preview-tabs">
        <div className="tab-buttons">
          {TABS.map((item) => (
            <button
              key={item.id}
              className={`preview-tab ${tab === item.id ? "active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              <item.icon size={15} />
              {item.label}
            </button>
          ))}
        </div>
        <div className="preview-tab-actions">
          <span className="live-tag">
            <i />
            LIVE
          </span>
          <span className="mini-divider" />
          <button
            className="icon-button small"
            title={viewport.expanded ? "拡大表示を終了 (F)" : "拡大表示 (F)"}
            onClick={viewportActions.toggleExpanded}
          >
            {viewport.expanded ? <X size={15} /> : <Expand size={15} />}
          </button>
        </div>
      </div>

      <div className={`viewer-surface ${tab !== "preview" ? "show-uv" : ""}`}>
        <div
          className="model-scene"
          style={{ display: tab === "preview" ? "block" : "none" }}
        >
          <ModelViewport
            model={shown}
            grid={viewport.grid}
            wireframe={viewport.wireframe}
            autoRotate={viewport.autoRotate}
            tool={viewport.tool}
            view={viewport.view}
            zoom={viewport.zoom}
            resetKey={viewport.resetKey}
            actionPlaying={viewport.actionPlaying}
            actionScrub={viewport.actionScrub}
            onZoomChange={viewportActions.setZoom}
            selectedCube={studio.selectedCube}
            onSelectCube={(name) => {
              studio.selectCube(name);
              setInspectorTab("edit");
              viewportActions.setActionScrub(0);
            }}
          />
        </div>

        {tab === "preview" && (
          <>
            <div className="view-options">
              <div className="view-select-wrap">
                <select
                  aria-label="カメラの向き"
                  value={viewport.view}
                  onChange={(event) =>
                    viewportActions.setView(event.target.value as CameraView)
                  }
                >
                  {(Object.keys(VIEW_LABELS) as CameraView[]).map((view) => (
                    <option key={view} value={view}>
                      {VIEW_LABELS[view]}
                    </option>
                  ))}
                </select>
                <ChevronDown size={11} />
              </div>
              <span className="view-shading-label">
                {viewport.wireframe ? "WIREFRAME" : "TEXTURED"}
              </span>
              {badges.map((badge) => (
                <span key={badge} className="variant-badge">
                  {badge}
                </span>
              ))}
              {temporary.override && (
                <span className="mode-badge">
                  <Zap size={10} />
                  一時モード発動中
                </span>
              )}
            </div>

            <div className="viewport-tools">
              <button
                className={viewport.tool === "orbit" ? "active" : ""}
                onClick={() => viewportActions.setTool("orbit")}
                title="回転ツール"
                aria-label="回転ツール"
              >
                <MousePointer2 size={17} />
              </button>
              <button
                className={viewport.tool === "pan" ? "active" : ""}
                onClick={() => viewportActions.setTool("pan")}
                title="移動ツール"
                aria-label="移動ツール"
              >
                <Move size={17} />
              </button>
              <div />
              <button
                className={viewport.autoRotate ? "active" : ""}
                onClick={viewportActions.toggleAutoRotate}
                title="自動回転"
                aria-label="自動回転"
                aria-pressed={viewport.autoRotate}
              >
                <RotateCw size={17} />
              </button>
              <button
                onClick={viewportActions.resetCamera}
                title="ビューをリセット (R)"
                aria-label="ビューをリセット"
              >
                <Maximize size={17} />
              </button>
              <div />
              <button
                className={temporary.override ? "active" : ""}
                onClick={() => void temporary.trigger()}
                disabled={busy || temporary.loading}
                title="一時モード発動（4秒間）"
                aria-label="一時モード発動"
              >
                {temporary.loading ? (
                  <LoaderCircle size={17} className="spinning" />
                ) : (
                  <Zap size={17} />
                )}
              </button>
            </div>

            <AxisGizmo onSelect={viewportActions.setView} />

            <div className="scene-object-label">
              <span className="object-label-line" />
              <span>
                {objectLabel}
                <small>
                  {shown.settings.quality === "ultra"
                    ? "ULTRA DETAIL"
                    : "VOXEL GEOMETRY"}
                </small>
              </span>
            </div>

            <ActionPlayer action={shown.settings.action} />

            <div className="viewer-bottom">
              <div className="viewport-display-tools">
                <button
                  className={viewport.grid ? "active" : ""}
                  onClick={viewportActions.toggleGrid}
                  title="グリッド表示 (G)"
                  aria-label="グリッド表示"
                  aria-pressed={viewport.grid}
                >
                  <Grid3X3 size={15} />
                </button>
                <button
                  className={viewport.wireframe ? "active" : ""}
                  onClick={viewportActions.toggleWireframe}
                  title="ワイヤーフレーム (W)"
                  aria-label="ワイヤーフレーム"
                  aria-pressed={viewport.wireframe}
                >
                  <Box size={15} />
                </button>
                <span />
                <button
                  onClick={viewportActions.resetCamera}
                  title="ビューをリセット"
                  aria-label="リセット"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <div className="orbit-hint">
                <Mouse size={12} />
                <span>ドラッグで回転</span>
                <i />
                <span>スクロールでズーム</span>
              </div>
              <div className="zoom-control">
                <button
                  onClick={() => viewportActions.zoomBy(-ZOOM_LIMITS.step)}
                  aria-label="ズームアウト"
                >
                  <Minus size={13} />
                </button>
                <span>{viewport.zoom}%</span>
                <button
                  onClick={() => viewportActions.zoomBy(ZOOM_LIMITS.step)}
                  aria-label="ズームイン"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </>
        )}
        {tab === "uv" && (
          <UvEditor model={model} onOpenAtlasPicker={onOpenAtlasPicker} />
        )}
        {tab === "variants" && <VariantsPanel />}

        {busy && <GenerationOverlay />}
      </div>

      <div className="preview-status">
        <span className="preview-state">
          <i />
          {busy
            ? "生成中"
            : dirty
              ? "設定を変更しました。生成して適用できます"
              : "プレビュー準備完了"}
        </span>
        <div className="geometry-stats">
          <span>
            <b>{shown.cubes.length}</b> キューブ
          </span>
          <i />
          <span>
            <b>{(shown.cubes.length * 6).toLocaleString()}</b> 面
          </span>
          <i />
          <span>
            <b>
              {shown.texture.width} × {shown.texture.height}
            </b>{" "}
            テクスチャ
          </span>
        </div>
      </div>
    </section>
  );
}
