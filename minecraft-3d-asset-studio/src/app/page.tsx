"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes,
  ChevronDown,
  ChevronUp,
  Download,
  FlaskConical,
  FolderOpen,
  Gem,
  Grid,
  Hammer,
  Keyboard,
  Layers,
  Lock,
  Move,
  MousePointer2,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  RotateCw,
  Save,
  Scaling,
  Sparkles,
  Sun,
  Undo2,
} from "lucide-react";
import { ActionBar } from "@/components/ActionBar";
import { DecorationPanel } from "@/components/DecorationPanel";
import { ElementInspector } from "@/components/ElementInspector";
import { EvolutionLab } from "@/components/EvolutionLab";
import { ExportModal } from "@/components/ExportModal";
import { GeneratorModal } from "@/components/GeneratorModal";
import { CameraView, ModelViewport, ViewportHandle } from "@/components/ModelViewport";
import { PresetsModal } from "@/components/PresetsModal";
import { TextureAtlasEditor } from "@/components/TextureAtlasEditor";
import { useModelWorkspace } from "@/hooks/useModelWorkspace";
import { useStatusMessage } from "@/hooks/useStatusMessage";
import { ACTION_DEFINITIONS } from "@/lib/animation/actions";
import { getArchetypeInfo } from "@/lib/generators/catalog";
import { PALETTES } from "@/lib/generators/textureBaker";
import { TEMPORARY_MODES } from "@/lib/variants/modes";
import { buildVariant, FORM_DEFINITIONS } from "@/lib/variants/variantEngine";
import { ActionId, ColorPalette, GizmoMode, ModelArchetype, ModelData, ModelTheme, TemporaryModeId, TextureResolution, VariantState, Vector3 } from "@/types/model";

type LightingMode = "minecraft" | "shaded" | "studio";
type LeftPanel = "lab" | "decor" | null;

const LIGHTING_MODES: LightingMode[] = ["shaded", "minecraft", "studio"];
const CAMERA_BUTTONS: Array<{ view: CameraView; label: string; title: string }> = [
  { view: "perspective", label: "Persp", title: "Perspective view" },
  { view: "isometric", label: "Iso", title: "Isometric view" },
  { view: "front", label: "Front", title: "Front view" },
  { view: "first_person", label: "In-Hand", title: "Minecraft first-person hand view" },
];
const GIZMO_BUTTONS: Array<{ mode: GizmoMode; key: string; label: string; icon: typeof Move }> = [
  { mode: "none", key: "Q", label: "選択", icon: MousePointer2 },
  { mode: "translate", key: "W", label: "移動", icon: Move },
  { mode: "rotate", key: "E", label: "回転", icon: RotateCw },
  { mode: "scale", key: "R", label: "拡縮", icon: Scaling },
];
const FALLBACK_SIGNATURE: ActionId[] = ["attack_slash", "spell_release", "ultimate_burst"];

interface ModeSession {
  id: TemporaryModeId;
  endsAt: number;
  duration: number;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export default function HomePage() {
  const viewportRef = useRef<ViewportHandle>(null);
  const workspace = useModelWorkspace();
  const { message: statusMessage, showStatus } = useStatusMessage("Ready to design");

  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [lightingMode, setLightingMode] = useState<LightingMode>("shaded");
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(true);
  const [isAtlasOpen, setIsAtlasOpen] = useState(true);
  const [leftPanel, setLeftPanel] = useState<LeftPanel>("lab");
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>("none");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPack, setIsExportingPack] = useState(false);
  const [modeSession, setModeSession] = useState<ModeSession | null>(null);
  const [modeRemaining, setModeRemaining] = useState(0);

  const { model, baseModel, variant, isVariantActive, selectedElementId } = workspace;
  const activeModeId = modeSession?.id ?? null;
  const signature = getArchetypeInfo(baseModel.archetype)?.signature ?? FALLBACK_SIGNATURE;

  const displayModel = useMemo<ModelData>(() => {
    const override = activeModeId ? TEMPORARY_MODES[activeModeId].variantOverride : undefined;
    return override ? buildVariant(baseModel, { ...variant, ...override }) : model;
  }, [activeModeId, baseModel, model, variant]);

  // Cube editing always targets the base model; effect settings are the base values (variant boosts are layered on top).
  const inspectorModel = useMemo<ModelData>(
    () => (isVariantActive ? { ...model, floatingItems: baseModel.floatingItems, magicCircle: baseModel.magicCircle, particles: baseModel.particles, animations: baseModel.animations } : baseModel),
    [baseModel, isVariantActive, model],
  );

  const selectedDisplayElement = selectedElementId ? displayModel.elements.find((element) => element.id === selectedElementId) ?? null : null;
  const selectedIsEditable = !isVariantActive && Boolean(selectedElementId && baseModel.elements.some((element) => element.id === selectedElementId));

  useEffect(() => {
    if (!modeSession) return;
    const interval = setInterval(() => {
      const remaining = (modeSession.endsAt - Date.now()) / 1000;
      if (remaining <= 0) {
        setModeSession(null);
        setModeRemaining(0);
      } else {
        setModeRemaining(remaining / modeSession.duration);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [modeSession]);

  const playAction = useCallback((id: ActionId) => viewportRef.current?.playAction(id), []);

  const handleAction = useCallback(
    (id: ActionId) => {
      playAction(id);
      showStatus(`Action: ${ACTION_DEFINITIONS[id].labelJa}`, 1500);
    },
    [playAction, showStatus],
  );

  const handleMode = useCallback(
    (id: TemporaryModeId) => {
      const definition = TEMPORARY_MODES[id];
      setModeSession({ id, endsAt: Date.now() + definition.duration * 1000, duration: definition.duration });
      setModeRemaining(1);
      if (definition.transitionAction) playAction(definition.transitionAction);
      showStatus(`一時モード発動: ${definition.labelJa} (${definition.duration}s)`);
    },
    [playAction, showStatus],
  );

  const cancelMode = useCallback(() => {
    setModeSession(null);
    setModeRemaining(0);
    showStatus("一時モード解除");
  }, [showStatus]);

  const lockedNotice = useCallback(() => showStatus("バリアント表示中は編集がロックされます。「確定 (Bake)」で編集可能になります。"), [showStatus]);

  const guardEdit = useCallback(
    (action: () => void) => {
      if (isVariantActive) lockedNotice();
      else action();
    },
    [isVariantActive, lockedNotice],
  );

  const handleVariantChange = useCallback(
    (partial: Partial<VariantState>) => {
      const previous = variant;
      const next = workspace.updateVariant(partial);
      if (next.form !== previous.form || next.limitBreak > previous.limitBreak) playAction("transform");
      else if (next.tier > previous.tier) playAction("spell_release");
      setGizmoMode("none");
      showStatus(`Variant → +${next.tier} / 突破${next.limitBreak} / ${FORM_DEFINITIONS[next.form].labelJa}`);
    },
    [playAction, showStatus, variant, workspace],
  );

  const handleExportPack = useCallback(async () => {
    try {
      setIsExportingPack(true);
      const { exportVariantPack } = await import("@/lib/exporters/variantPack");
      const { blob, fileName, variantCount } = await exportVariantPack(baseModel, variant);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      showStatus(`${variantCount} 種のバリアントパックを書き出しました。`);
    } catch (error) {
      console.error("Variant pack export failed", error);
      showStatus("パック書き出しに失敗しました。");
    } finally {
      setIsExportingPack(false);
    }
  }, [baseModel, showStatus, variant]);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: model.name,
          description: model.description,
          category: model.category,
          theme: model.theme,
          textureResolution: model.textureWidth,
          modelData: model,
          textureDataUrl: workspace.textureDataUrl,
          thumbnailDataUrl: viewportRef.current?.captureScreenshot() || null,
        }),
      });
      const payload: { success?: boolean; error?: string } = await response.json();
      showStatus(payload.success ? `保存しました: ${model.name}` : `Save failed: ${payload.error || "unknown error"}`);
    } catch (error) {
      console.error("Saving model failed", error);
      showStatus("Save failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [model, showStatus, workspace.textureDataUrl]);

  const insertAnchor = useCallback((): Vector3 => {
    const target = selectedDisplayElement;
    if (!target) return [0, 8, 2];
    return [(target.from[0] + target.to[0]) / 2, Math.max(target.from[1], target.to[1]) + 1, (target.from[2] + target.to[2]) / 2];
  }, [selectedDisplayElement]);

  const handleInsertPart = useCallback(
    (partId: string) =>
      guardEdit(() => {
        const count = workspace.insertPart(partId, insertAnchor());
        showStatus(count ? `パーツを挿入しました (${count} キューブ)` : "パーツを挿入できませんでした");
      }),
    [guardEdit, insertAnchor, showStatus, workspace],
  );

  const handleUndo = useCallback(() => showStatus(workspace.undo() ? "元に戻しました" : "これ以上戻せません", 1200), [showStatus, workspace]);
  const handleRedo = useCallback(() => showStatus(workspace.redo() ? "やり直しました" : "これ以上やり直せません", 1200), [showStatus, workspace]);

  // ---------- keyboard shortcuts ----------
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (mod && key === "z") {
        event.preventDefault();
        if (event.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if (mod && key === "y") {
        event.preventDefault();
        handleRedo();
        return;
      }
      if (mod && key === "d") {
        event.preventDefault();
        if (selectedElementId) guardEdit(() => workspace.duplicateElement(selectedElementId));
        return;
      }
      if (mod) return;
      const gizmo = GIZMO_BUTTONS.find((button) => button.key.toLowerCase() === key);
      if (gizmo) {
        setGizmoMode(gizmo.mode);
        return;
      }
      if ((key === "delete" || key === "backspace") && selectedElementId) {
        guardEdit(() => workspace.deleteElement(selectedElementId));
        return;
      }
      if (key === "m" && selectedElementId) {
        guardEdit(() => workspace.mirrorElement(selectedElementId));
        return;
      }
      if (key === " ") {
        event.preventDefault();
        setIsPlayingAnimation((value) => !value);
        return;
      }
      if (/^[1-9]$/.test(key)) {
        const action = signature[Number(key) - 1];
        if (action) handleAction(action);
        return;
      }
      const arrows: Record<string, Vector3> = {
        arrowleft: [-0.5, 0, 0],
        arrowright: [0.5, 0, 0],
        arrowup: event.shiftKey ? [0, 0, -0.5] : [0, 0.5, 0],
        arrowdown: event.shiftKey ? [0, 0, 0.5] : [0, -0.5, 0],
      };
      if (arrows[key] && selectedElementId) {
        event.preventDefault();
        guardEdit(() => workspace.nudgeElement(selectedElementId, arrows[key]));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [guardEdit, handleAction, handleRedo, handleUndo, selectedElementId, signature, workspace]);

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#12141a] font-sans text-neutral-200">
      <header className="z-20 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-[#282d3b] bg-[#171922] px-3 select-none">
        <div className="flex min-w-0 items-center space-x-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md">
            <Boxes className="h-4 w-4" />
          </div>
          <div className="hidden xl:block">
            <h1 className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-xs font-black uppercase tracking-wide text-transparent">MC 3D Model Forge</h1>
            <span className="text-[10px] font-medium text-neutral-400">Blockbench · Fabric · Resource Pack</span>
          </div>
          <input
            type="text"
            value={isVariantActive ? model.name : baseModel.name}
            readOnly={isVariantActive}
            onChange={(event) => workspace.updateModelName(event.target.value)}
            className="w-48 truncate rounded border border-[#2d3240] bg-[#101217] px-2 py-1 text-xs font-bold text-white outline-none hover:border-[#3e4559] focus:border-blue-500"
            title={isVariantActive ? "Variant name (bake to rename)" : "Rename model"}
          />
          <div className="flex items-center rounded-lg border border-[#282d3b] bg-[#101217] p-0.5">
            <button onClick={handleUndo} disabled={!workspace.canUndo} className="rounded p-1 text-neutral-300 hover:bg-[#20242e] disabled:opacity-30" title="元に戻す (Ctrl+Z)">
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleRedo} disabled={!workspace.canRedo} className="rounded p-1 text-neutral-300 hover:bg-[#20242e] disabled:opacity-30" title="やり直し (Ctrl+Shift+Z)">
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="hidden items-center rounded-lg border border-[#282d3b] bg-[#101217] p-0.5 lg:flex">
            {GIZMO_BUTTONS.map(({ mode, key, label, icon: Icon }) => (
              <button key={mode} onClick={() => setGizmoMode(mode)} className={`flex items-center gap-1 rounded px-1.5 py-1 text-[10.5px] ${gizmoMode === mode ? "bg-blue-600 text-white" : "text-neutral-400 hover:text-white"}`} title={`${label} (${key})`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden 2xl:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="hidden items-center space-x-1 rounded-lg border border-[#282d3b] bg-[#101217] p-0.5 md:flex">
          {CAMERA_BUTTONS.map((button) => (
            <button key={button.view} onClick={() => viewportRef.current?.setCameraAngle(button.view)} className={`rounded px-2 py-1 text-[11px] hover:bg-[#20242e] hover:text-white ${button.view === "first_person" ? "font-semibold text-blue-400" : "text-neutral-300"}`} title={button.title}>
              {button.label}
            </button>
          ))}
          <div className="mx-0.5 h-3.5 w-px bg-[#282d3b]" />
          <button onClick={() => setShowGrid((value) => !value)} className={`rounded p-1 ${showGrid ? "bg-blue-900/20 text-blue-400" : "text-neutral-500 hover:text-neutral-300"}`} title="Toggle grid">
            <Grid className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setWireframe((value) => !value)} className={`rounded p-1 ${wireframe ? "bg-blue-900/20 text-blue-400" : "text-neutral-500 hover:text-neutral-300"}`} title="Toggle wireframe">
            <Boxes className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setLightingMode((current) => LIGHTING_MODES[(LIGHTING_MODES.indexOf(current) + 1) % LIGHTING_MODES.length])} className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-neutral-300 hover:text-white" title="Switch lighting mode">
            <Sun className="h-3 w-3 text-amber-400" />
            <span className="capitalize">{lightingMode}</span>
          </button>
          <button onClick={() => viewportRef.current?.resetCamera()} className="rounded p-1 text-neutral-400 hover:text-white" title="Reset camera">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          <div className="flex items-center rounded-lg border border-[#282d3b] bg-[#101217] p-0.5">
            <button onClick={() => setLeftPanel((value) => (value === "lab" ? null : "lab"))} className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold ${leftPanel === "lab" ? "bg-amber-500/20 text-amber-200" : "text-neutral-400 hover:text-white"}`}>
              <FlaskConical className="h-3.5 w-3.5" /> 進化
            </button>
            <button onClick={() => setLeftPanel((value) => (value === "decor" ? null : "decor"))} className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold ${leftPanel === "decor" ? "bg-fuchsia-500/20 text-fuchsia-200" : "text-neutral-400 hover:text-white"}`}>
              <Gem className="h-3.5 w-3.5" /> 装飾
              {(baseModel.decorations?.length ?? 0) > 0 && <span className="rounded bg-fuchsia-600 px-1 text-[9px] text-white">{baseModel.decorations?.length}</span>}
            </button>
          </div>
          <button onClick={() => setIsPlayingAnimation((value) => !value)} className={`rounded px-2 py-1 text-xs font-semibold transition ${isPlayingAnimation ? "border border-emerald-500/30 bg-emerald-600/20 text-emerald-300" : "bg-[#20242e] text-neutral-400 hover:text-white"}`} title="Play / pause (Space)">
            {isPlayingAnimation ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
          <button onClick={() => setIsGeneratorOpen(true)} className="flex items-center gap-1.5 rounded bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-md transition hover:from-blue-500 hover:to-indigo-500">
            <Sparkles className="h-3.5 w-3.5" />
            Forge
          </button>
          <button onClick={() => setIsPresetsOpen(true)} className="flex items-center gap-1 rounded border border-[#2d3240] bg-[#20242e] px-2 py-1 text-xs text-neutral-200 transition hover:bg-[#282d3b]" title="Library">
            <FolderOpen className="h-3.5 w-3.5 text-blue-400" />
          </button>
          <button onClick={handleSave} disabled={isSaving || !workspace.textureDataUrl} className="flex items-center gap-1 rounded border border-[#2d3240] bg-[#20242e] px-2 py-1 text-xs text-neutral-200 transition hover:bg-[#282d3b] disabled:opacity-50">
            <Save className="h-3.5 w-3.5 text-emerald-400" />
            {isSaving ? "..." : "Save"}
          </button>
          <button onClick={() => setIsExportOpen(true)} className="flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-md transition hover:bg-emerald-500">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </header>

      <section className="relative flex flex-1 overflow-hidden">
        {leftPanel && (
          <aside className="z-10 h-full w-72 shrink-0">
            {leftPanel === "lab" ? (
              <EvolutionLab
                model={model}
                baseModel={baseModel}
                variant={variant}
                isExporting={isExportingPack}
                onClose={() => setLeftPanel(null)}
                onVariantChange={handleVariantChange}
                onBake={() => {
                  workspace.bakeCurrentVariant();
                  showStatus("バリアントを確定しました。全キューブが編集可能です。");
                }}
                onReset={() => {
                  workspace.resetVariant();
                  showStatus("基本形に戻しました。");
                }}
                onLoadArchetype={(type: ModelArchetype) => {
                  const next = workspace.loadArchetype(type);
                  showStatus(`同一テーマ別モデル: ${next.name}`);
                }}
                onRetheme={(theme: ModelTheme) => {
                  workspace.retheme(theme);
                  playAction("transform");
                  showStatus(`テーマ違い: ${PALETTES[theme].name} Edition`);
                }}
                onExportPack={handleExportPack}
              />
            ) : (
              <DecorationPanel
                decorations={baseModel.decorations ?? []}
                onAdd={(type) => {
                  workspace.addDecoration(type);
                  showStatus("装飾レイヤーを追加しました");
                }}
                onUpdate={workspace.updateDecoration}
                onRemove={workspace.removeDecoration}
                onDuplicate={workspace.duplicateDecoration}
                onRandomize={() => {
                  workspace.randomizeDecorations();
                  showStatus("ランダム装飾を3層追加しました");
                }}
                onClear={workspace.clearDecorations}
                onBake={() => {
                  workspace.bakeDecorations();
                  showStatus("装飾を通常キューブとして確定しました");
                }}
              />
            )}
          </aside>
        )}

        <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <div className="relative h-full flex-1 overflow-hidden bg-[#101217]">
            <ModelViewport
              ref={viewportRef}
              model={displayModel}
              textureDataUrl={workspace.textureDataUrl}
              selectedElementId={selectedElementId}
              onSelectElement={workspace.setSelectedElementId}
              wireframe={wireframe}
              showGrid={showGrid}
              lightingMode={lightingMode}
              isPlayingAnimation={isPlayingAnimation}
              activeMode={activeModeId}
              gizmoMode={gizmoMode}
              editable={selectedIsEditable}
              onTransformElement={workspace.transformElement}
            />
            <div className="pointer-events-none absolute left-3 top-3 flex flex-col space-y-1">
              <div className="rounded border border-[#282d3b] bg-[#161822]/85 px-2.5 py-1 text-[11px] text-neutral-300 shadow-lg backdrop-blur">
                <span className="font-semibold text-white">{displayModel.name}</span>
                <span className="mx-1.5 text-neutral-500">•</span>
                <span className="text-blue-400">{displayModel.elements.length} Cubes</span>
                <span className="mx-1.5 text-neutral-500">•</span>
                <span className="text-emerald-400">
                  {displayModel.textureWidth}×{displayModel.textureHeight}px
                </span>
              </div>
              {selectedDisplayElement && (
                <div className="w-fit rounded border border-blue-500/40 bg-[#161822]/85 px-2.5 py-0.5 text-[10px] text-blue-300 backdrop-blur">
                  Selected: {selectedDisplayElement.name}
                  {gizmoMode !== "none" && !selectedIsEditable && <span className="ml-1 text-amber-300">(編集不可: 装飾/バリアント)</span>}
                </div>
              )}
            </div>

            <button onClick={() => setShowShortcuts((value) => !value)} className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded border border-[#2d3240] bg-[#161822]/85 px-2 py-1 text-[10px] text-neutral-300 backdrop-blur hover:text-white">
              <Keyboard className="h-3 w-3" /> ショートカット
            </button>
            {showShortcuts && (
              <div className="absolute right-3 top-10 z-10 w-56 rounded-lg border border-[#2d3240] bg-[#161822]/95 p-2.5 text-[10.5px] leading-relaxed text-neutral-300 shadow-xl backdrop-blur">
                {[
                  ["Q / W / E / R", "選択 / 移動 / 回転 / 拡縮"],
                  ["矢印 (+Shift)", "0.5px 移動 (Shift=奥行)"],
                  ["Ctrl+Z / Ctrl+Y", "元に戻す / やり直し"],
                  ["Ctrl+D", "複製"],
                  ["M", "X軸ミラー複製"],
                  ["Delete", "削除"],
                  ["1 – 3", "固有技を発動"],
                  ["Space", "再生 / 停止"],
                ].map(([keys, label]) => (
                  <div key={keys} className="flex justify-between gap-2">
                    <span className="font-mono text-blue-300">{keys}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-11 z-10 flex justify-center px-3">
              <ActionBar activeMode={activeModeId} modeRemaining={modeRemaining} signature={signature} onAction={handleAction} onMode={handleMode} onCancelMode={cancelMode} />
            </div>

            <div className="absolute bottom-2 left-3 z-10">
              <button onClick={() => setIsAtlasOpen((value) => !value)} className="flex items-center gap-1.5 rounded border border-[#2d3240] bg-[#181a24]/90 px-2.5 py-1 text-xs text-neutral-300 shadow-lg backdrop-blur transition hover:bg-[#20242e]">
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                <span>UV Atlas ({model.textureWidth}px)</span>
                {isAtlasOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          {isAtlasOpen && (
            <div className="relative z-10 h-64 shrink-0 border-t border-[#282d3b]">
              <TextureAtlasEditor
                model={model}
                textureDataUrl={workspace.textureDataUrl}
                onUpdateTexture={workspace.setTextureDataUrl}
                onUpdateResolution={(resolution: TextureResolution) => {
                  workspace.updateResolution(resolution);
                  showStatus(`Rescaled all UVs to ${resolution}×${resolution}px.`);
                }}
                onSelectPalette={(palette: ColorPalette) => {
                  workspace.selectPalette(palette);
                  showStatus(`Applied ${palette.name} and re-baked the atlas.`);
                }}
                selectedElement={selectedDisplayElement}
              />
            </div>
          )}
        </div>

        <aside className="z-10 flex h-full w-80 shrink-0 flex-col">
          {isVariantActive && (
            <div className="flex items-center gap-2 border-b border-l border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 leading-tight">バリアント表示中 — キューブ編集はロック中</span>
              <button
                onClick={() => {
                  workspace.bakeCurrentVariant();
                  showStatus("バリアントを確定しました。");
                }}
                className="flex items-center gap-1 rounded bg-amber-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-amber-500"
              >
                <Hammer className="h-3 w-3" /> Bake
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1">
            <ElementInspector
              model={inspectorModel}
              selectedElementId={selectedElementId}
              onSelectElement={workspace.setSelectedElementId}
              onUpdateElement={(element) => guardEdit(() => workspace.updateElement(element))}
              onAddElement={() => guardEdit(() => workspace.addElement())}
              onDeleteElement={(id) => guardEdit(() => workspace.deleteElement(id))}
              onDuplicateElement={(id) => guardEdit(() => workspace.duplicateElement(id))}
              onUpdateFloatingItems={workspace.updateFloatingItems}
              onUpdateMagicCircle={workspace.updateMagicCircle}
              onUpdateParticles={workspace.updateParticles}
              onUpdateAnimations={workspace.updateAnimations}
              onInsertPart={handleInsertPart}
              onMirrorElement={(id) => guardEdit(() => workspace.mirrorElement(id))}
            />
          </div>
        </aside>
      </section>

      <footer className="flex h-6 shrink-0 items-center justify-between border-t border-[#252834] bg-[#13151c] px-3 text-[11px] text-neutral-400 select-none">
        <span className="flex items-center gap-1 truncate text-neutral-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {statusMessage}
        </span>
        <div className="hidden items-center space-x-3 md:flex">
          <span>Gizmo: {GIZMO_BUTTONS.find((button) => button.mode === gizmoMode)?.label}</span>
          <span className="text-neutral-600">|</span>
          <span>Mode: {activeModeId ? TEMPORARY_MODES[activeModeId].labelJa : "—"}</span>
          <span className="text-neutral-600">|</span>
          <span>Blockbench 4.x · Java 1.20–1.21.4+ · Fabric 1.21.1 · Bedrock</span>
        </div>
      </footer>

      <GeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onGenerate={(type, theme, resolution) => {
          const next = workspace.generateModel(type, theme, resolution);
          showStatus(`Synthesized ${next.name} with a ${resolution}px UV atlas.`);
        }}
      />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} model={model} textureDataUrl={workspace.textureDataUrl} baseModel={baseModel} variant={variant} />
      <PresetsModal isOpen={isPresetsOpen} onClose={() => setIsPresetsOpen(false)} onLoadModel={(candidate, texture) => showStatus(workspace.loadModel(candidate, texture) ? "Model loaded into the workspace." : "Could not load this model data.")} />
    </main>
  );
}
