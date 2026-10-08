"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { A, fromHex, type Pix, rgba } from "@/studios/adv/lib/pixel/core";
import { DEFAULT_SETTINGS, type GenSettings, renderWeapon, type RenderResult } from "@/studios/adv/lib/pixel/generator";
import { buildAnimation, infoFromPix, infoFromRender } from "@/studios/adv/lib/pixel/animations";
import { buildModel, buildModelJson, DEFAULT_MODEL, type ModelSettings } from "@/studios/adv/lib/pixel/model3d";
import {
  buildResourcePack, canvasToBlob, downloadBlob, framesToStrip, imageFileToPix, mcmeta, pixToCanvas, pixToDataUrl, slug, targetFor,
} from "@/studios/adv/lib/pixel/export";
import {
  DEFAULT_ANIMATION, DEFAULT_EXPORT, framesFromProject, normalizeProjectMeta, serialiseProject,
  type AnimationSettings, type AssetOrigin, type ExportSettings,
} from "@/studios/adv/lib/editor/project";
import { getShape } from "@/studios/adv/lib/pixel/shapes";
import { useAnimationPlayback } from "@/studios/adv/hooks/useAnimationPlayback";
import { useEditorShortcuts } from "@/studios/adv/hooks/useEditorShortcuts";
import { type FrameOperation, useFrameTimeline } from "@/studios/adv/hooks/useFrameTimeline";
import PixelCanvas from "./PixelCanvas";
import GeneratorPanel from "./GeneratorPanel";
import ToolPanel, { type ToolState } from "./ToolPanel";
import AnimationPanel from "./AnimationPanel";
import ModelPanel from "./ModelPanel";
import ExportPanel, { type ProjectRow } from "./ExportPanel";
import type { PreviewOpts } from "./Preview3D";
import { Btn, PixThumb } from "./ui";

const Preview3D = dynamic(() => import("./Preview3D"), { ssr: false });

type Tab = "generate" | "edit" | "animate" | "model" | "export";
type DownloadKind = "png" | "strip" | "mcmeta" | "model" | "zip" | "obj" | "glb" | "stl";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "generate", label: "生成", icon: "⚒" },
  { id: "edit", label: "編集", icon: "✎" },
  { id: "animate", label: "アニメ", icon: "▶" },
  { id: "model", label: "3D", icon: "⬡" },
  { id: "export", label: "出力", icon: "⇩" },
];

const initialRender = renderWeapon(DEFAULT_SETTINGS);

export default function Editor() {
  const [tab, setTab] = useState<Tab>("generate");
  const [gen, setGen] = useState<GenSettings>(DEFAULT_SETTINGS);
  const [anim, setAnim] = useState<AnimationSettings>(DEFAULT_ANIMATION);
  const [model, setModel] = useState<ModelSettings>(DEFAULT_MODEL);
  const [exp, setExp] = useState<ExportSettings>(DEFAULT_EXPORT);
  const [origin, setOrigin] = useState<AssetOrigin>("generator");
  const [render, setRender] = useState<RenderResult | null>(initialRender);
  const [preview, setPreview] = useState<PreviewOpts>({
    autoRotate: true, wireframe: false, bloom: true, particles: true, view: "iso", quality: "sculpt", studio: true,
  });
  const [show3D, setShow3D] = useState(false);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hoverXY, setHoverXY] = useState<[number, number] | null>(null);
  const [tool, setTool] = useState<ToolState>({
    tool: "pencil",
    color: fromHex("#ffd319"),
    color2: rgba(0, 0, 0, 0),
    size: 1,
    mirror: "none",
    zoom: 14,
    grid: true,
    onion: false,
    gradient: {
      type: "linear",
      stops: [{ t: 0, color: fromHex("#ff2a6d") }, { t: 1, color: fromHex("#05d9e8") }],
      dither: 0,
      steps: 0,
      maskOnly: true,
      mode: "replace",
    },
  });

  const fileInput = useRef<HTMLInputElement>(null);
  const didInitialGenerate = useRef(false);
  const toastTimer = useRef<number | null>(null);
  const {
    frames,
    currentFrame,
    currentPix: pix,
    replace: replaceTimeline,
    commitFrame: commitTimelineFrame,
    operate: operateTimeline,
    setCurrentFrame,
    undo,
    redo,
    clearHistory,
  } = useFrameTimeline(initialRender.pix);
  const timeline = useMemo(() => ({
    replace: replaceTimeline,
    commitFrame: commitTimelineFrame,
    operate: operateTimeline,
    setCurrentFrame,
    undo,
    redo,
    clearHistory,
  }), [clearHistory, commitTimelineFrame, operateTimeline, redo, replaceTimeline, setCurrentFrame, undo]);

  const say = useCallback((message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  const regenerate = useCallback((settings: GenSettings, record = true) => {
    const next = renderWeapon(settings);
    timeline.replace([next.pix], 0, record);
    setRender(next);
    setOrigin("generator");
    setExp((current) => ({ ...current, baseItem: getShape(settings.shape).baseItem }));
  }, [timeline]);

  // Generator controls are a live, intentionally destructive design workspace.
  useEffect(() => {
    if (tab !== "generate") return;
    const first = !didInitialGenerate.current;
    didInitialGenerate.current = true;
    const timer = window.setTimeout(() => regenerate(gen, !first), 50);
    return () => window.clearTimeout(timer);
  }, [gen, regenerate, tab]);

  useEffect(() => {
    setTool((current) => ({
      ...current,
      zoom: pix.w <= 16 ? 24 : pix.w <= 32 ? 14 : 8,
    }));
  }, [pix.w]);

  const commitFrame = useCallback((next: Pix) => {
    timeline.commitFrame(next);
    // The current bitmap now differs from its generator recipe. Reconstruct it as a genuine 2D→3D asset.
    setOrigin("edited");
    setRender(null);
  }, [timeline]);

  const applyGeneratedPatch = useCallback((patch: Partial<GenSettings>) => {
    setGen((current) => ({ ...current, ...patch }));
  }, []);

  const applyPreset = useCallback((patch: Partial<GenSettings>) => {
    setGen((current) => ({
      ...current,
      ...patch,
      params: { ...current.params, ...(patch.params ?? {}) },
    }));
    if (patch.shape) {
      const material = patch.material ? patch.material.charAt(0).toUpperCase() + patch.material.slice(1) : "";
      setExp((current) => ({ ...current, name: `${material} ${getShape(patch.shape!).name}`.trim() }));
    }
  }, []);

  const generateAnimation = useCallback(() => {
    const base = frames[0];
    const animationInfo = origin === "generator" && render && render.pix.w === base.w
      ? infoFromRender(render)
      : infoFromPix(base);
    const output = buildAnimation(base, animationInfo, anim.layers, anim.frameCount);
    timeline.replace(output, 0);
    setOrigin("animated");
    setRender(null);
    say(`${output.length} フレームを生成しました`);
  }, [anim, frames, origin, render, say, timeline]);

  const advanceFrame = useCallback(() => {
    timeline.setCurrentFrame((currentFrame + 1) % frames.length);
  }, [currentFrame, frames.length, timeline]);
  const playback = useAnimationPlayback(frames.length, anim.frametime, advanceFrame);

  const operateFrame = useCallback((op: "add" | "dup" | "del" | "left" | "right" | "clearAll" | "reverse" | "pingpong") => {
    const operations: Record<typeof op, FrameOperation> = {
      add: "add", dup: "duplicate", del: "delete", left: "moveLeft", right: "moveRight",
      clearAll: "single", reverse: "reverse", pingpong: "pingPong",
    };
    timeline.operate(operations[op]);
    setOrigin("edited");
    setRender(null);
  }, [timeline]);

  const reconstructionRender = origin === "generator" ? render : null;
  const built = useMemo(
    () => buildModel(frames[0], model, reconstructionRender),
    [frames, model, reconstructionRender],
  );
  const { depth, elements } = built;

  useEffect(() => {
    if (tab === "model") setShow3D(true);
  }, [tab]);

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      if (response.ok) setProjects(await response.json());
    } catch {
      // Local editor remains usable if the database is temporarily unavailable.
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const saveProject = useCallback(async (asNew = false) => {
    setBusy(true);
    try {
      const meta = { version: 2 as const, gen, anim, model, exp, origin };
      const body = serialiseProject(
        exp.name,
        frames,
        meta,
        pixToDataUrl(frames[0], Math.max(1, Math.floor(64 / frames[0].w))),
      );
      const response = await fetch(currentId && !asNew ? `/api/projects/${currentId}` : "/api/projects", {
        method: currentId && !asNew ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("保存に失敗しました");
      const row = await response.json();
      setCurrentId(row.id);
      await loadProjects();
      say("プロジェクトを保存しました");
    } catch (error) {
      say(error instanceof Error ? error.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }, [anim, currentId, exp, frames, gen, loadProjects, model, origin, say]);

  const loadProject = useCallback(async (id: number) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/projects/${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error("読み込みに失敗しました");
      const row = await response.json();
      const loadedFrames = framesFromProject(row.frames, row.width, row.height);
      if (!loadedFrames.length) throw new Error("フレームデータがありません");
      const meta = normalizeProjectMeta(row.meta, row.name);
      setGen(meta.gen);
      setAnim(meta.anim);
      setModel(meta.model);
      setExp(meta.exp);
      setOrigin(meta.origin);
      setRender(meta.origin === "generator" ? renderWeapon(meta.gen) : null);
      timeline.replace(loadedFrames, 0, false);
      timeline.clearHistory();
      setCurrentId(row.id);
      playback.setPlaying(false);
      setTab("edit");
      say(`「${row.name}」を開きました`);
    } catch (error) {
      say(error instanceof Error ? error.message : "読み込みに失敗しました");
    } finally {
      setBusy(false);
    }
  }, [playback, say, timeline]);

  const deleteProject = useCallback(async (id: number) => {
    if (!window.confirm("このプロジェクトを削除しますか？")) return;
    try {
      const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("削除に失敗しました");
      if (currentId === id) setCurrentId(null);
      await loadProjects();
      say("プロジェクトを削除しました");
    } catch (error) {
      say(error instanceof Error ? error.message : "削除に失敗しました");
    }
  }, [currentId, loadProjects, say]);

  const onImportFile = useCallback(async (file: File) => {
    try {
      const loaded = await imageFileToPix(file, pix.w);
      timeline.replace([loaded], 0);
      setOrigin("imported");
      setRender(null);
      setExp((current) => ({ ...current, name: file.name.replace(/\.[^.]+$/, "") || current.name }));
      playback.setPlaying(false);
      setTab("model");
      say("画像を読み込みました。現在のピクセルから3Dを再構築します。");
    } catch {
      say("画像の読み込みに失敗しました");
    }
  }, [pix.w, playback, say, timeline]);

  const onDownload = useCallback(async (kind: DownloadKind) => {
    const name = slug(exp.name);
    try {
      if (kind === "png") {
        downloadBlob(await canvasToBlob(pixToCanvas(pix)), `${name}.png`);
      } else if (kind === "strip") {
        downloadBlob(await canvasToBlob(pixToCanvas(framesToStrip(frames))), `${name}.png`);
      } else if (kind === "mcmeta") {
        downloadBlob(new Blob([mcmeta(anim.frametime, anim.interpolate, frames.length)], { type: "application/json" }), `${name}.png.mcmeta`);
      } else if (kind === "model") {
        const json = exp.mode3d
          ? buildModelJson(elements, `mcforge:item/${name}`, model, frames[0]?.w ?? 16)
          : { parent: "minecraft:item/handheld", textures: { layer0: `mcforge:item/${name}` } };
        downloadBlob(new Blob([JSON.stringify(json, null, 2)], { type: "application/json" }), `${name}.json`);
      } else if (kind === "obj" || kind === "glb" || kind === "stl") {
        // True 3D mesh export lives in a lazily loaded chunk so three.js stays out of the initial bundle.
        const exporters = await import("@/studios/adv/lib/three/exporters");
        const source = reconstructionRender;
        if (kind === "glb") {
          downloadBlob(await exporters.exportGLB(source, model, frames[0], depth), `${name}.glb`);
        } else if (kind === "stl") {
          downloadBlob(new Blob([exporters.exportSTL(source, model, frames[0], depth)], { type: "model/stl" }), `${name}.stl`);
        } else {
          downloadBlob(new Blob([exporters.exportOBJ(source, model, frames[0], depth)], { type: "text/plain" }), `${name}.obj`);
        }
        say(kind === "glb" ? "GLB(実メッシュ)を出力しました" : `${kind.toUpperCase()} を出力しました`);
      } else if (kind === "zip") {
        setBusy(true);
        const pack = await buildResourcePack({
          name: exp.name,
          description: `${exp.name} by MC Asset Forge`,
          frames,
          frametime: anim.frametime,
          interpolate: anim.interpolate,
          baseItem: exp.baseItem,
          customModelData: exp.customModelData,
          mode3d: exp.mode3d,
          elements,
          model,
          packFormat: exp.packFormat,
        });
        downloadBlob(pack, `${name}_pack.zip`);
        say("リソースパックを生成しました");
      }
    } catch (error) {
      say(`エクスポート失敗: ${error instanceof Error ? error.message : "不明なエラー"}`);
    } finally {
      setBusy(false);
    }
  }, [anim, depth, elements, exp, frames, model, pix, reconstructionRender, say]);

  const recentColors = useMemo(() => {
    const count = new Map<number, number>();
    for (const color of pix.data) if (A(color) === 255) count.set(color, (count.get(color) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([color]) => color);
  }, [pix]);

  useEditorShortcuts({
    frameCount: frames.length,
    onTool: (selectedTool) => setTool((current) => ({ ...current, tool: selectedTool })),
    onBrushDelta: (delta) => setTool((current) => ({ ...current, size: Math.max(1, Math.min(8, current.size + delta)) })),
    onZoomDelta: (delta) => setTool((current) => ({ ...current, zoom: Math.max(2, Math.min(40, current.zoom + delta)) })),
    onUndo: timeline.undo,
    onRedo: timeline.redo,
    onPlayback: playback.toggle,
    onNextFrame: () => timeline.setCurrentFrame((currentFrame + 1) % frames.length),
    onPreviousFrame: () => timeline.setCurrentFrame((currentFrame - 1 + frames.length) % frames.length),
    onToggle3D: () => setShow3D((value) => !value),
    onEditMode: () => setTab("edit"),
  });

  return (
    <div className="h-dvh min-h-[620px] flex flex-col bg-[#0b0b12] text-slate-100 overflow-hidden">
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onImportFile(file);
          event.target.value = "";
        }}
      />

      <header className="h-12 shrink-0 flex items-center gap-3 px-3 sm:px-4 border-b border-white/10 bg-gradient-to-r from-[#141422] via-[#1a1428] to-[#141422]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">⚒</span>
          <div className="hidden sm:block">
            <div className="text-sm font-bold tracking-wide leading-none">MC Asset Forge</div>
            <div className="text-[10px] text-slate-400 leading-none mt-0.5">武器テクスチャ / アニメ / 2D→3D</div>
          </div>
        </div>
        <div className="h-6 w-px bg-white/10 hidden sm:block" />
        <input aria-label="project name" className="min-w-0 max-w-56 bg-transparent border-b border-white/20 focus:border-amber-300 outline-none text-sm px-1" value={exp.name} onChange={(event) => setExp((current) => ({ ...current, name: event.target.value }))} />
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <Btn onClick={timeline.undo} title="Undo (Ctrl+Z)">↶</Btn>
          <Btn onClick={timeline.redo} title="Redo (Ctrl+Shift+Z)">↷</Btn>
          <Btn onClick={() => fileInput.current?.click()} className="hidden md:inline-flex">📥 画像</Btn>
          <Btn variant="primary" onClick={() => void saveProject(false)} disabled={busy}>💾 保存</Btn>
          <Btn onClick={() => void onDownload("zip")} disabled={busy} className="hidden sm:inline-flex">📦 パック</Btn>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-[340px] xl:w-[360px] shrink-0 border-r border-white/10 flex flex-col bg-[#0f0f18]">
          <div className="grid grid-cols-5 border-b border-white/10">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`py-2 text-xs font-semibold border-b-2 transition-colors ${tab === item.id ? "border-amber-400 text-amber-200 bg-amber-400/5" : "border-transparent text-slate-400 hover:text-slate-200"}`}
              >
                <span className="mr-1">{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {tab === "generate" && <GeneratorPanel s={gen} set={applyGeneratedPatch} onApplyPreset={applyPreset} />}
            {tab === "edit" && <ToolPanel t={tool} set={(patch) => setTool((current) => ({ ...current, ...patch }))} pix={pix} apply={(fn) => commitFrame(fn(pix))} recent={recentColors} />}
            {tab === "animate" && <AnimationPanel a={anim} set={(patch) => setAnim((current) => ({ ...current, ...patch }))} onGenerate={generateAnimation} frames={frames} current={currentFrame} setCurrent={timeline.setCurrentFrame} onFrameOp={operateFrame} playing={playback.playing} setPlaying={playback.setPlaying} />}
            {tab === "model" && <ModelPanel m={model} set={(patch) => setModel((current) => ({ ...current, ...patch }))} elementCount={elements.length} hasRoles={!!reconstructionRender} onImportClick={() => fileInput.current?.click()} depth={depth} pix={pix} preview={preview} setPreview={(patch) => setPreview((current) => ({ ...current, ...patch }))} />}
            {tab === "export" && <ExportPanel e={exp} set={(patch) => setExp((current) => ({ ...current, ...patch }))} onDownload={onDownload} projects={projects} onSave={() => void saveProject(false)} onSaveNew={() => void saveProject(true)} onLoad={(id) => void loadProject(id)} onDelete={(id) => void deleteProject(id)} currentId={currentId} busy={busy} onImport={() => fileInput.current?.click()} frames={frames} elements={elements} />}
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          <div className="h-9 shrink-0 flex items-center gap-2 px-3 border-b border-white/10 text-[11px] text-slate-400">
            <span>{pix.w}×{pix.h}</span>
            <span>・ フレーム {currentFrame + 1}/{frames.length}</span>
            <span className="hidden lg:inline">・ {origin === "generator" ? "生成モデル" : origin === "imported" ? "インポート画像" : origin === "animated" ? "アニメーション" : "手描き編集"}</span>
            {hoverXY && <span className="hidden md:inline">・ ({hoverXY[0]}, {hoverXY[1]})</span>}
            <div className="flex-1" />
            <Btn onClick={() => setTool((current) => ({ ...current, zoom: Math.max(2, current.zoom - 2) }))}>−</Btn>
            <span className="tabular-nums w-9 text-center">{tool.zoom}x</span>
            <Btn onClick={() => setTool((current) => ({ ...current, zoom: Math.min(40, current.zoom + 2) }))}>+</Btn>
            <Btn active={tool.grid} onClick={() => setTool((current) => ({ ...current, grid: !current.grid }))}>格子</Btn>
            <Btn active={playback.playing} onClick={playback.toggle} disabled={frames.length < 2}>{playback.playing ? "⏸" : "▶"}</Btn>
            <Btn active={show3D} onClick={() => setShow3D((value) => !value)} title="3 キー">⬡ 3D</Btn>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center bg-[radial-gradient(ellipse_at_center,#171726_0%,#0b0b12_70%)]">
            {show3D ? (
              <div className="w-full h-full">
                <Preview3D frames={frames} frameIndex={currentFrame} elements={elements} opts={preview} model={model} render={reconstructionRender} depth={depth} />
              </div>
            ) : (
              <div className="overflow-auto w-full h-full flex items-center justify-center p-6">
                <PixelCanvas
                  pix={pix}
                  onion={tool.onion && frames.length > 1 ? frames[(currentFrame - 1 + frames.length) % frames.length] : null}
                  tool={tool.tool}
                  color={tool.color}
                  color2={tool.color2}
                  size={tool.size}
                  mirror={tool.mirror}
                  gradient={tool.gradient}
                  zoom={tool.zoom}
                  showGrid={tool.grid}
                  onCommit={commitFrame}
                  onPick={(color) => setTool((current) => ({ ...current, color }))}
                  onHover={(x, y) => setHoverXY([x, y])}
                />
              </div>
            )}
          </div>

          <div className="h-20 shrink-0 border-t border-white/10 flex items-center gap-1 px-2 overflow-x-auto bg-[#0f0f18]">
            {frames.map((frame, index) => (
              <button key={index} type="button" onClick={() => timeline.setCurrentFrame(index)} className={`shrink-0 rounded border p-0.5 ${index === currentFrame ? "border-amber-300 bg-amber-400/10" : "border-white/10 hover:border-white/30"}`}>
                <PixThumb pix={frame} size={48} />
              </button>
            ))}
            <Btn onClick={() => operateFrame("dup")} className="shrink-0 h-12">＋複製</Btn>
            <Btn onClick={() => setTab("animate")} className="shrink-0 h-12">⚡ アニメ</Btn>
          </div>
        </main>

        <aside className="w-[320px] xl:w-[340px] shrink-0 border-l border-white/10 flex flex-col bg-[#0f0f18]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <span className="text-xs font-semibold uppercase tracking-wide">{show3D ? "2D キャンバス" : "3D プレビュー"}</span>
            <div className="flex gap-1">
              <Btn active={preview.autoRotate} onClick={() => setPreview((current) => ({ ...current, autoRotate: !current.autoRotate }))}>回転</Btn>
              <Btn active={preview.bloom} onClick={() => setPreview((current) => ({ ...current, bloom: !current.bloom }))}>発光</Btn>
              <span className="text-[10px] text-slate-500 self-center">{elements.length} el</span>
            </div>
          </div>
          <div className="h-[320px] shrink-0">
            {show3D ? (
              <div className="w-full h-full flex items-center justify-center bg-[#0b0b12]">
                <PixelCanvas
                  pix={pix}
                  onion={null}
                  tool={tool.tool}
                  color={tool.color}
                  color2={tool.color2}
                  size={tool.size}
                  mirror={tool.mirror}
                  gradient={tool.gradient}
                  zoom={Math.max(4, Math.min(10, tool.zoom))}
                  showGrid={false}
                  onCommit={commitFrame}
                  onPick={(color) => setTool((current) => ({ ...current, color }))}
                />
              </div>
            ) : (
              <Preview3D frames={frames} frameIndex={currentFrame} elements={elements} opts={preview} model={model} render={reconstructionRender} depth={depth} />
            )}
          </div>
          <div className="px-3 py-2 border-t border-b border-white/10 text-xs font-semibold uppercase tracking-wide">実寸プレビュー</div>
          <div className="p-3 flex items-end gap-4 flex-wrap">
            <div className="text-center"><PixThumb pix={pix} size={16} checker={false} /><div className="text-[9px] text-slate-500">GUI 1x</div></div>
            <div className="text-center"><PixThumb pix={pix} size={32} checker={false} /><div className="text-[9px] text-slate-500">2x</div></div>
            <div className="text-center"><PixThumb pix={pix} size={64} checker={false} /><div className="text-[9px] text-slate-500">4x</div></div>
            <div className="text-center rounded bg-[#c6c6c6] p-1"><div className="bg-[#8b8b8b] p-0.5"><PixThumb pix={pix} size={48} checker={false} /></div><div className="text-[9px] text-slate-700">ホットバー</div></div>
          </div>
          <div className="px-3 pb-3 text-[10px] text-slate-400 space-y-1">
            <div>ショートカット: B ペン / E 消し / G 塗り / I スポイト / 3 で2D⇄3D / Space 再生 / Ctrl+Z 取消</div>
            <div>3Dタブではスカルプト再構築・断面・厚み・Minecraft実機ボックスを切り替えできます。</div>
          </div>
          {render && origin === "generator" && (
            <div className="mt-auto px-3 py-2 border-t border-white/10 text-[10px] text-slate-500">
              {render.shape.nameJa} ・ {render.material.nameJa} ・ {gen.style} ・ 装飾 {gen.decorations.length}
            </div>
          )}
        </aside>
      </div>
      {toast && <div className="fixed z-50 bottom-4 left-1/2 -translate-x-1/2 rounded bg-amber-400 text-black text-xs font-semibold px-3 py-1.5 shadow-lg">{toast}</div>}
    </div>
  );
}
