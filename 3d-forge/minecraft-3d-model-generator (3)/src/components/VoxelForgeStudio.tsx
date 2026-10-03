"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type {
  ArchetypeParams,
  CuboidElement,
  ModelDisplaySettings,
  VoxelModelRow,
} from "@/db/schema";
import {
  ARCHETYPE_CATALOG,
  generateArchetypeElements,
  generatePixelAtlasMatrix,
  getDefaultDisplaySettings,
  MATERIAL_PALETTES,
  SHADING_STYLES,
  type ArchetypeId,
  type MaterialPresetId,
  type RawBoxSpec,
} from "@/lib/voxelGenerator";
import { matrixToPngDataUrl } from "@/lib/pngEncoder";
import { DEFAULT_STAFF_FX, resolveStaffFx } from "@/lib/staffRig";
import {
  applyEvolutionStage,
  EVOLUTION_STAGES,
  FORGE_PRESETS,
  getVisualStyle,
  VISUAL_STYLES,
} from "@/lib/visualStyles";
import type { VisualStyleId } from "@/lib/visualStyles";
import type {
  AttackModeId,
  AttackPhaseId,
  EvolutionStageId,
} from "@/lib/visualStyles";
import { ATTACK_MODES, attackTotalMs } from "@/lib/visualStyles";
import { ARCHETYPE_FAMILIES, ARCHETYPE_FAMILY } from "@/lib/extraArchetypes";
import { PARTS_LIBRARY, buildPart } from "@/lib/partsLibrary";
import { EFFECT_PRESETS } from "@/lib/effects";
import type { EffectPresetId } from "@/db/schema";
import type { FloatingRigConfig } from "@/db/schema";
import Viewport3D from "./Viewport3D";
import StaffFxPanel from "./StaffFxPanel";
import UVAtlasEditor from "./UVAtlasEditor";
import ElementInspector from "./ElementInspector";
import ExportStudioModal from "./ExportStudioModal";
import {
  Bookmark,
  Check,
  CloudUpload,
  Cpu,
  Dices,
  Download,
  FolderOpen,
  Hammer,
  Layers,
  Palette,
  Sliders,
  Sparkles,
  Swords,
  Trash2,
  Wand2,
  Zap,
  Undo2,
  Redo2,
  Puzzle,
  Flame,
} from "lucide-react";

export default function VoxelForgeStudio() {
  // Active Model State
  const [activeModelId, setActiveModelId] = useState<number | null>(null);
  const [modelName, setModelName] = useState<string>(
    "蒼輝のダイヤ・ブロードソード"
  );
  const [modelSlug, setModelSlug] = useState<string>(
    "radiant_diamond_broadsword"
  );
  const [archetype, setArchetype] = useState<ArchetypeId>("sword");
  const [materialPreset, setMaterialPreset] =
    useState<MaterialPresetId>("diamond");
  const [atlasResolution, setAtlasResolution] = useState<number>(32);

  const [params, setParams] = useState<ArchetypeParams>(
    ARCHETYPE_CATALOG[0].defaultParams
  );
  const [elements, setElements] = useState<CuboidElement[]>([]);
  const [displaySettings, setDisplaySettings] = useState<ModelDisplaySettings>(
    getDefaultDisplaySettings("sword")
  );
  const [textureDataUrl, setTextureDataUrl] = useState<string>("");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );

  // Saved DB Presets & Custom Models
  const [savedModels, setSavedModels] = useState<VoxelModelRow[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // UI Panels
  const [leftSection, setLeftSection] = useState<
    "archetype" | "uv_material" | "evolution" | "modes" | "parts" | "library"
  >("archetype");
  const [evolutionStage, setEvolutionStage] = useState<EvolutionStageId>("base");
  const [visualStyle, setVisualStyle] = useState<VisualStyleId>("base");
  const [activeAttackMode, setActiveAttackMode] = useState<AttackModeId | null>(null);
  const [attackPhase, setAttackPhase] = useState<AttackPhaseId>("windup");
  const onAttackCompleteRef = useRef<() => void>(() => {});
  const [attackKey, setAttackKey] = useState<number>(0);
  const [archFilter, setArchFilter] = useState<string>("all");
  const [customParts, setCustomParts] = useState<RawBoxSpec[]>([]);
  const customPartsRef = useRef<RawBoxSpec[]>([]);
  const partSerialRef = useRef<number>(0);
  const [partScale, setPartScale] = useState<number>(1);

  // Undo / redo history (debounced snapshots of geometry + texture + params)
  type Snapshot = { elements: CuboidElement[]; textureDataUrl: string; params: ArchetypeParams };
  const historyRef = useRef<{ past: Snapshot[]; future: Snapshot[]; restoring: boolean }>({ past: [], future: [], restoring: false });
  const lastSnapRef = useRef<Snapshot | null>(null);
  const [historyVersion, setHistoryVersion] = useState<number>(0);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Rebuild Procedural Geometry & UV Atlas helper
  const rebuildModel = useCallback(
    (
      nextArch: ArchetypeId,
      nextMat: MaterialPresetId,
      nextParams: ArchetypeParams,
      nextRes: number
    ) => {
      const genElements = generateArchetypeElements(
        nextArch,
        nextParams,
        nextRes,
        customPartsRef.current
      );
      const matrix = generatePixelAtlasMatrix(
        genElements,
        nextMat,
        nextRes,
        nextParams.shadingStyle
      );
      const pngUrl = matrixToPngDataUrl(matrix);
      setElements(genElements);
      setTextureDataUrl(pngUrl);
      setSelectedElementId(null);
    },
    []
  );

  // Initial procedural build + fetch saved models from PostgreSQL
  useEffect(() => {
    rebuildModel("sword", "diamond", ARCHETYPE_CATALOG[0].defaultParams, 32);

    const fetchModels = async () => {
      try {
        setIsLoadingLibrary(true);
        const res = await fetch("/api/models");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models) && data.models.length > 0) {
            setSavedModels(data.models);
          }
        }
      } catch (e) {
        console.error("Failed to fetch models:", e);
      } finally {
        setIsLoadingLibrary(false);
      }
    };
    fetchModels();
  }, [rebuildModel]);

  // Switch Archetype ("型")
  const handleSelectArchetype = (archId: ArchetypeId) => {
    const meta =
      ARCHETYPE_CATALOG.find((a) => a.id === archId) || ARCHETYPE_CATALOG[0];
    const nextParams: ArchetypeParams = {
      ...meta.defaultParams,
      uvPadding: params.uvPadding,
    };
    customPartsRef.current = [];
    setCustomParts([]);
    setVisualStyle("base");
    setEvolutionStage("base");
    setArchetype(archId);
    setParams(nextParams);
    setDisplaySettings(getDefaultDisplaySettings(archId));

    const palMeta = MATERIAL_PALETTES[materialPreset];
    setModelName(`${palMeta.nameJa.split(" ")[0]}の${meta.nameJa.split(" ")[0]}`);
    setModelSlug(`${materialPreset}_${archId}`);
    rebuildModel(archId, materialPreset, nextParams, atlasResolution);
  };

  // Switch Material Palette
  const handleSelectMaterial = (matId: MaterialPresetId) => {
    setMaterialPreset(matId);
    const meta =
      ARCHETYPE_CATALOG.find((a) => a.id === archetype) || ARCHETYPE_CATALOG[0];
    const palMeta = MATERIAL_PALETTES[matId];
    setModelName(`${palMeta.nameJa.split(" ")[0]}の${meta.nameJa.split(" ")[0]}`);
    setModelSlug(`${matId}_${archetype}`);

    // Re-shade current elements with new material
    const matrix = generatePixelAtlasMatrix(
      elements,
      matId,
      atlasResolution,
      params.shadingStyle
    );
    setTextureDataUrl(matrixToPngDataUrl(matrix));
  };

  // Update Parametric Geometry Slider
  const handleUpdateParam = <K extends keyof ArchetypeParams>(
    key: K,
    value: ArchetypeParams[K]
  ) => {
    const next = { ...params, [key]: value };
    setParams(next);
    rebuildModel(archetype, materialPreset, next, atlasResolution);
  };

  // Change UV Atlas Resolution (16, 32, 64)
  const handleChangeResolution = (nextRes: number) => {
    setAtlasResolution(nextRes);
    rebuildModel(archetype, materialPreset, params, nextRes);
  };

  // Random Forge Generator
  const handleRandomForge = () => {
    const archList = ARCHETYPE_CATALOG.map((a) => a.id);
    const matList = Object.keys(MATERIAL_PALETTES) as MaterialPresetId[];
    const randArch = archList[Math.floor(Math.random() * archList.length)];
    const randMat = matList[Math.floor(Math.random() * matList.length)];
    const meta =
      ARCHETYPE_CATALOG.find((a) => a.id === randArch) || ARCHETYPE_CATALOG[0];

    const guardStyles: ArchetypeParams["guardStyle"][] = [
      "winged",
      "cruciform",
      "royal",
      "spiked",
      "katana_tsuba",
    ];
    const pommelStyles: ArchetypeParams["pommelStyle"][] = [
      "gem",
      "ring",
      "counterweight",
    ];
    const shadingStyles: ArchetypeParams["shadingStyle"][] = SHADING_STYLES.map((s) => s.id);
    customPartsRef.current = [];
    setCustomParts([]);

    const randParams: ArchetypeParams = {
      ...meta.defaultParams,
      bladeLength: Math.round(10 + Math.random() * 10),
      bladeWidth: Number((2.0 + Math.random() * 2.6).toFixed(1)),
      guardWidth: Number((5.0 + Math.random() * 5.5).toFixed(1)),
      voxelDepth: Number((1.0 + Math.random() * 1.4).toFixed(1)),
      taperSteps: Math.floor(3 + Math.random() * 3),
      guardStyle: guardStyles[Math.floor(Math.random() * guardStyles.length)],
      pommelStyle:
        pommelStyles[Math.floor(Math.random() * pommelStyles.length)],
      shadingStyle:
        shadingStyles[Math.floor(Math.random() * shadingStyles.length)],
      fullerGroove: Math.random() > 0.25,
      edgeBevel: true,
      gemAccent: Math.random() > 0.2,
      serration: Math.random() > 0.4,
      laserEdge: Math.random() > 0.4,
      knuckleGuard: Math.random() > 0.5,
      heatSinkVents: Math.random() > 0.4,
      magicCircleRings: randArch === "staff" && Math.random() > 0.3,
      elementalOrbs: randArch === "staff" && Math.random() > 0.4,
      transformed: false,
      strictMinecraftRotation: true,
      uvPadding: 1,
      floatingRig:
        randArch === "staff"
          ? {
              ...DEFAULT_STAFF_FX,
              crownStyle: (["cage", "halo", "eclipse", "comet"] as const)[
                Math.floor(Math.random() * 4)
              ],
              coreStyle: (["octahedron", "twin", "eclipse"] as const)[
                Math.floor(Math.random() * 3)
              ],
              orbitLayers: 1 + Math.floor(Math.random() * 3),
              satellites: 3 + Math.floor(Math.random() * 4),
              haloRings: Math.floor(Math.random() * 3),
              motes: [0, 6, 8, 12][Math.floor(Math.random() * 4)],
              loopSeconds: Number((3 + Math.random() * 3).toFixed(1)),
              bob: Number((0.2 + Math.random() * 0.7).toFixed(2)),
            }
          : undefined,
    };

    const palMeta = MATERIAL_PALETTES[randMat];
    setArchetype(randArch);
    setMaterialPreset(randMat);
    setParams(randParams);
    setDisplaySettings(getDefaultDisplaySettings(randArch));
    setModelName(
      `${palMeta.nameJa.split(" ")[0]}の${meta.nameJa.split(" ")[0]}`
    );
    setModelSlug(`${randMat}_${randArch}_${Math.floor(100 + Math.random() * 899)}`);
    setActiveModelId(null);
    rebuildModel(randArch, randMat, randParams, atlasResolution);
  };

  // Load a Model from PostgreSQL Library
  const handleLoadModelFromDB = (row: VoxelModelRow) => {
    setActiveModelId(row.id);
    setModelName(row.name);
    setModelSlug(row.slug);
    setArchetype((row.archetype as ArchetypeId) || "sword");
    setMaterialPreset((row.materialPreset as MaterialPresetId) || "diamond");
    setAtlasResolution(row.atlasResolution || 32);
    setParams(row.paramsJson);
    setElements(row.elementsJson);
    setDisplaySettings(row.displayJson);
    setTextureDataUrl(row.textureDataUrl);
    setSelectedElementId(null);
  };

  // Save Current Model to PostgreSQL
  const handleSaveToDB = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: modelName,
          slug: modelSlug,
          description: `${atlasResolution}x${atlasResolution} UV • ${elements.length} Cuboids • ${archetype}`,
          archetype,
          materialPreset,
          atlasResolution,
          paramsJson: params,
          elementsJson: elements,
          displayJson: displaySettings,
          textureDataUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.model) {
          setSavedModels((prev) => [data.model, ...prev]);
          setActiveModelId(data.model.id);
          setSaveFeedback("DBへ保存完了!");
          setTimeout(() => setSaveFeedback(null), 2500);
        }
      }
    } catch (e) {
      console.error("Failed to save model:", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete a User-Saved Model from DB
  const handleDeleteModelFromDB = async (
    id: number,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/models/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavedModels((prev) => prev.filter((m) => m.id !== id));
        if (activeModelId === id) setActiveModelId(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  useEffect(() => {
    if (elements.length === 0) return;
    const h = historyRef.current;
    if (h.restoring) {
      h.restoring = false;
      lastSnapRef.current = { elements, textureDataUrl, params };
      return;
    }
    const timer = window.setTimeout(() => {
      const last = lastSnapRef.current;
      if (last && (last.elements !== elements || last.textureDataUrl !== textureDataUrl)) {
        {
          h.past.push(last);
          if (h.past.length > 40) h.past.shift();
          h.future = [];
          setHistoryVersion((v) => v + 1);
        }
      }
      lastSnapRef.current = { elements, textureDataUrl, params };
    }, 250);
    return () => window.clearTimeout(timer);
  }, [elements, textureDataUrl, params]);

  const restoreSnapshot = (snap: Snapshot) => {
    historyRef.current.restoring = true;
    setElements(snap.elements);
    setTextureDataUrl(snap.textureDataUrl);
    setParams(snap.params);
    setSelectedElementId(null);
    setHistoryVersion((v) => v + 1);
  };

  const handleUndo = () => {
    const h = historyRef.current;
    const prev = h.past.pop();
    if (!prev || !lastSnapRef.current) return;
    h.future.push(lastSnapRef.current);
    restoreSnapshot(prev);
  };

  const handleRedo = () => {
    const h = historyRef.current;
    const next = h.future.pop();
    if (!next || !lastSnapRef.current) return;
    h.past.push(lastSnapRef.current);
    restoreSnapshot(next);
  };

  const handleDuplicateSelected = () => {
    const sel = elements.find((e) => e.id === selectedElementId);
    if (!sel) return;
    const dup: CuboidElement = {
      ...sel,
      id: `${sel.id}_dup_${Date.now()}`,
      name: `${sel.name} (Copy)`,
      from: [sel.from[0], sel.from[1] + 1, sel.from[2]],
      to: [sel.to[0], sel.to[1] + 1, sel.to[2]],
      origin: [sel.origin[0], sel.origin[1] + 1, sel.origin[2]],
    };
    setElements((prev) => [...prev, dup]);
    setSelectedElementId(dup.id);
  };

  const shortcutRef = useRef({ undo: handleUndo, redo: handleRedo, dup: handleDuplicateSelected, del: () => {} });
  shortcutRef.current = {
    undo: handleUndo,
    redo: handleRedo,
    dup: handleDuplicateSelected,
    del: () => {
      if (selectedElementId) handleDeleteElement(selectedElementId);
    },
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) shortcutRef.current.redo();
        else shortcutRef.current.undo();
      } else if (mod && key === "y") {
        e.preventDefault();
        shortcutRef.current.redo();
      } else if (mod && key === "d") {
        e.preventDefault();
        shortcutRef.current.dup();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        shortcutRef.current.del();
      } else if (e.key === "Escape") {
        setSelectedElementId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleAddPart = (partId: string) => {
    const sel = elements.find((e) => e.id === selectedElementId);
    let anchor: [number, number, number];
    if (sel) {
      anchor = [(sel.from[0] + sel.to[0]) / 2, Math.max(sel.from[1], sel.to[1]), (sel.from[2] + sel.to[2]) / 2];
    } else {
      const top = elements
        .filter((e) => e.visible && e.group !== "float")
        .reduce((m, e) => Math.max(m, e.from[1], e.to[1]), 8);
      anchor = [8, top, 8];
    }
    partSerialRef.current += 1;
    const specs = buildPart(partId, anchor, partScale, partSerialRef.current);
    const next = [...customPartsRef.current, ...specs];
    customPartsRef.current = next;
    setCustomParts(next);
    rebuildModel(archetype, materialPreset, params, atlasResolution);
  };

  const handleClearParts = () => {
    customPartsRef.current = [];
    setCustomParts([]);
    rebuildModel(archetype, materialPreset, params, atlasResolution);
  };

  const triggerAttack = (mode: AttackModeId) => {
    setActiveAttackMode(mode);
    setAttackKey((k) => k + 1);
    setAttackPhase("windup");
    const total = attackTotalMs(mode);
    window.setTimeout(() => setActiveAttackMode((cur) => (cur === mode ? null : cur)), total + 50);
  };

  // Update a single Cuboid Element
  const handleUpdateElement = (updated: CuboidElement) => {
    setElements((prev) =>
      prev.map((el) => (el.id === updated.id ? updated : el))
    );
  };

  const handleAddElement = (newEl: CuboidElement) => {
    setElements((prev) => [...prev, newEl]);
  };

  const handleDeleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleRegenerateProceduralAtlas = () => {
    const matrix = generatePixelAtlasMatrix(
      elements,
      materialPreset,
      atlasResolution,
      params.shadingStyle
    );
    setTextureDataUrl(matrixToPngDataUrl(matrix));
  };

  const handleRecordExport = async () => {
    if (!activeModelId) return;
    try {
      await fetch(`/api/models/${activeModelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incrementDownload: true }),
      });
      setSavedModels((prev) =>
        prev.map((m) =>
          m.id === activeModelId
            ? { ...m, downloadsCount: (m.downloadsCount || 0) + 1 }
            : m
        )
      );
    } catch {
      // ignore
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0D0E12] text-[#F1F5F9]">
      {/* 1. Top Command Header (56px) */}
      <header className="h-14 shrink-0 px-4 bg-[#141720] border-b border-[#262936] flex items-center justify-between gap-3">
        {/* Brand & Active Project Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#3B82F6] to-[#10B981] flex items-center justify-center shadow-md">
              <Swords className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">
                  VoxelForge
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/40">
                  Blockbench & MC 3D
                </span>
              </div>
              <p className="text-[10px] text-[#94A3B8]">
                UVアトラス＆型指定 高品質3Dモデル生成スタジオ
              </p>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-[#262936] hidden md:block" />

          {/* Editable Model Name & Resource ID */}
          <div className="flex items-center gap-1.5 bg-[#0D0E12] px-2.5 py-1 rounded border border-[#262936]">
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="モデル名..."
              className="bg-transparent text-xs font-semibold text-white focus:outline-none w-36 sm:w-44"
            />
            <span className="text-[#64748B] text-xs">/</span>
            <input
              type="text"
              value={modelSlug}
              onChange={(e) => setModelSlug(e.target.value)}
              placeholder="item_id"
              className="bg-transparent font-mono text-[11px] text-[#10B981] focus:outline-none w-28 sm:w-36"
            />
          </div>
        </div>

        {/* Right Studio Actions: UV Resolution, Random Forge, Save DB, Export */}
        <div className="flex items-center gap-2 shrink-0">
          {/* UV Atlas Resolution Switcher */}
          <div className="hidden lg:flex items-center gap-1 bg-[#0D0E12] p-1 rounded border border-[#262936]">
            <span className="text-[10px] font-mono text-[#94A3B8] px-1.5">
              UV解像度:
            </span>
            {([16, 32, 64] as const).map((res) => (
              <button
                key={res}
                onClick={() => handleChangeResolution(res)}
                className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                  atlasResolution === res
                    ? "bg-[#3B82F6] text-white font-semibold"
                    : "text-[#94A3B8] hover:text-white"
                }`}
              >
                {res}×{res}
              </button>
            ))}
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1" data-history={historyVersion}>
            <button
              onClick={handleUndo}
              disabled={historyRef.current.past.length === 0}
              title="元に戻す (Ctrl+Z)"
              className="p-1.5 rounded-md bg-[#161922] border border-[#262936] text-[#94A3B8] hover:text-white disabled:opacity-30"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyRef.current.future.length === 0}
              title="やり直し (Ctrl+Shift+Z)"
              className="p-1.5 rounded-md bg-[#161922] border border-[#262936] text-[#94A3B8] hover:text-white disabled:opacity-30"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Random Forge Button */}
          <button
            onClick={handleRandomForge}
            title="ランダムな型・材質・形状で3Dモデルを自動生成"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#161922] border border-[#262936] text-[#F1F5F9] hover:border-[#F59E0B] hover:text-[#FBBF24] transition-colors"
          >
            <Dices className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="hidden sm:inline">ランダム鍛造</span>
          </button>

          {/* Save to PostgreSQL Button */}
          <button
            onClick={handleSaveToDB}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#161922] border border-[#262936] text-[#F1F5F9] hover:border-[#10B981] hover:text-[#34D399] transition-colors"
          >
            {saveFeedback ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="text-[#10B981]">{saveFeedback}</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="hidden sm:inline">
                  {isSaving ? "保存中..." : "ライブラリ保存"}
                </span>
              </>
            )}
          </button>

          {/* Primary Export Studio Button */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>エクスポート (.bbmodel / .json)</span>
          </button>
        </div>
      </header>

      {/* 2. Main 4-Zone Studio Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* LEFT DOCK (340px): Archetype ("型"), UV Material, Parametric Controls & DB Library */}
        <aside className="w-full lg:w-[350px] shrink-0 bg-[#161922] border-b lg:border-b-0 lg:border-r border-[#262936] flex flex-col min-h-0 max-h-[42vh] lg:max-h-none">
          {/* Left Dock Navigation Tabs */}
          <div className="grid grid-cols-6 gap-1 p-2 bg-[#141720] border-b border-[#262936]">
            <button
              onClick={() => setLeftSection("archetype")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition-colors ${
                leftSection === "archetype"
                  ? "bg-[#3B82F6] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-white hover:bg-[#1E2230]"
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>型</span>
            </button>

            <button
              onClick={() => setLeftSection("uv_material")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition-colors ${
                leftSection === "uv_material"
                  ? "bg-[#3B82F6] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-white hover:bg-[#1E2230]"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>材質</span>
            </button>

            <button
              onClick={() => setLeftSection("evolution")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition-colors ${
                leftSection === "evolution"
                  ? "bg-[#F59E0B] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-white hover:bg-[#1E2230]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>段階</span>
            </button>

            <button
              onClick={() => setLeftSection("modes")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition-colors ${
                leftSection === "modes"
                  ? "bg-[#8B5CF6] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-white hover:bg-[#1E2230]"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>動き</span>
            </button>

            <button
              onClick={() => setLeftSection("parts")}
              className={`flex items-center justify-center gap-1 py-1.5 rounded text-[11px] font-medium transition-colors ${
                leftSection === "parts"
                  ? "bg-[#10B981] text-black shadow-sm"
                  : "text-[#94A3B8] hover:text-white hover:bg-[#1E2230]"
              }`}
            >
              <Puzzle className="w-3.5 h-3.5" />
              <span>部品</span>
            </button>

            <button
              onClick={() => setLeftSection("library")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition-colors ${
                leftSection === "library"
                  ? "bg-[#3B82F6] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-white hover:bg-[#1E2230]"
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>DB ({savedModels.length})</span>
            </button>
          </div>

          {/* Left Dock Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {leftSection === "archetype" && (
              <>
                {/* Archetype ("型") 8-Grid Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>武器・ツールの型 (Archetype)</span>
                    </span>
                    <span className="font-mono text-[11px] text-[#60A5FA]">
                      {archetype.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {ARCHETYPE_FAMILIES.map((fam) => (
                      <button
                        key={fam.id}
                        onClick={() => setArchFilter(fam.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] border transition-colors ${
                          archFilter === fam.id
                            ? "bg-[#3B82F6] border-[#3B82F6] text-white"
                            : "bg-[#0D0E12] border-[#262936] text-[#94A3B8] hover:text-white"
                        }`}
                      >
                        {fam.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {ARCHETYPE_CATALOG.filter(
                      (a) => archFilter === "all" || ARCHETYPE_FAMILY[a.id] === archFilter
                    ).map((item) => {
                      const active = archetype === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectArchetype(item.id)}
                          className={`flex flex-col items-start p-2.5 rounded-md border text-left transition-all ${
                            active
                              ? "bg-[#3B82F6]/15 border-[#3B82F6] text-white shadow-sm"
                              : "bg-[#0D0E12] border-[#262936] text-[#94A3B8] hover:text-white hover:border-[#334155]"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold text-[#F1F5F9]">
                              {item.nameJa.split(" ")[0]}
                            </span>
                            <span className="text-[10px] font-mono text-[#60A5FA]">
                              {item.id}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#94A3B8] mt-1 line-clamp-1">
                            {item.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Procedural Geometry Sliders */}
                <div className="pt-3 border-t border-[#262936] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>プロシージャル形状パラメータ</span>
                    </span>
                  </div>

                  {(
                    [
                      {
                        key: "bladeLength",
                        label: "刃長 / シャフト長 (Length)",
                        min: 7,
                        max: 22,
                        step: 0.5,
                        unit: "vxl",
                      },
                      {
                        key: "bladeWidth",
                        label: "刃幅 / ヘッド幅 (Width)",
                        min: 1.4,
                        max: 5.6,
                        step: 0.2,
                        unit: "vxl",
                      },
                      {
                        key: "guardWidth",
                        label: "鍔・クロスガード幅 (Guard)",
                        min: 3.0,
                        max: 12.0,
                        step: 0.5,
                        unit: "vxl",
                      },
                      {
                        key: "voxelDepth",
                        label: "ボクセル立体厚み (Depth)",
                        min: 0.8,
                        max: 2.8,
                        step: 0.2,
                        unit: "vxl",
                      },
                      {
                        key: "taperSteps",
                        label: "先端テーパー分割段数 (Steps)",
                        min: 2,
                        max: 6,
                        step: 1,
                        unit: "段",
                      },
                    ] as const
                  ).map((slider) => (
                    <div key={slider.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#94A3B8]">{slider.label}</span>
                        <span className="font-mono text-[#F1F5F9]">
                          {params[slider.key]} {slider.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={slider.min}
                        max={slider.max}
                        step={slider.step}
                        value={params[slider.key]}
                        onChange={(e) =>
                          handleUpdateParam(
                            slider.key,
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full h-1.5 bg-[#0D0E12] rounded-lg cursor-pointer accent-[#3B82F6]"
                      />
                    </div>
                  ))}

                  {/* Guard & Pommel Style Selectors */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <label className="flex flex-col gap-1 text-xs">
                      <span className="text-[#94A3B8]">ガード形状</span>
                      <select
                        value={params.guardStyle}
                        onChange={(e) =>
                          handleUpdateParam(
                            "guardStyle",
                            e.target.value as ArchetypeParams["guardStyle"]
                          )
                        }
                        className="bg-[#0D0E12] border border-[#262936] rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="winged">ウィング (22.5°)</option>
                        <option value="cruciform">十字 (Cruciform)</option>
                        <option value="royal">ロイヤル双角</option>
                        <option value="spiked">逆反りスパイク</option>
                        <option value="katana_tsuba">日本刀・鍔</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1 text-xs">
                      <span className="text-[#94A3B8]">柄頭 (Pommel)</span>
                      <select
                        value={params.pommelStyle}
                        onChange={(e) =>
                          handleUpdateParam(
                            "pommelStyle",
                            e.target.value as ArchetypeParams["pommelStyle"]
                          )
                        }
                        className="bg-[#0D0E12] border border-[#262936] rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="gem">ダイヤ宝玉型</option>
                        <option value="ring">リング型 (45°)</option>
                        <option value="counterweight">重錘スパイク型</option>
                      </select>
                    </label>
                  </div>

                  {archetype === "staff" && (
                    <StaffFxPanel
                      fx={resolveStaffFx(params)}
                      floaterCount={elements.filter((el) => el.group === "float").length}
                      onChange={(next: FloatingRigConfig) => handleUpdateParam("floatingRig", next)}
                    />
                  )}

                  {/* Detail & Mechanical Feature Checkboxes */}
                  <div className="pt-2">
                    <span className="text-[10px] font-mono text-[#94A3B8] block mb-1">
                      武器詳細ディテール & ロマン機構
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { key: "edgeBevel", label: "立体エッジ刃先" },
                          { key: "fullerGroove", label: "血溝・ルーンコア" },
                          { key: "gemAccent", label: "中央ソウル宝玉" },
                          { key: "serration", label: "鋸刃・セレーション" },
                          { key: "laserEdge", label: "フォトン発光エッジ" },
                          { key: "knuckleGuard", label: "重装ナックルガード" },
                          { key: "heatSinkVents", label: "排熱スリットフィン" },
                          { key: "magicCircleRings", label: "二重魔法陣サークル" },
                          { key: "elementalOrbs", label: "四元素オーブ浮遊" },
                          { key: "transformed", label: "変形展開形態" },
                          { key: "transformAnimation", label: "連続変形ループ" },
                          {
                            key: "strictMinecraftRotation",
                            label: "MC 22.5°厳密角度",
                          },
                        ] as const
                      ).map((tog) => (
                      <button
                        key={tog.key}
                        onClick={() =>
                          handleUpdateParam(tog.key, !params[tog.key])
                        }
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded border text-xs transition-colors ${
                          params[tog.key]
                            ? "bg-[#10B981]/15 border-[#10B981]/60 text-[#34D399]"
                            : "bg-[#0D0E12] border-[#262936] text-[#64748B]"
                        }`}
                      >
                        <span>{tog.label}</span>
                        <span className="font-mono text-[10px]">
                          {params[tog.key] ? "ON" : "OFF"}
                        </span>
                      </button>
                    ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {leftSection === "evolution" && (
              <>
                {/* Evolution Stage: same weapon, upgrade to limit break */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>段階強化 (Plus / Awakened / Ascendant)</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">同一武器の強化モデル</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {EVOLUTION_STAGES.map((stage) => {
                      const active = evolutionStage === stage.id;
                      return (
                        <button
                          key={stage.id}
                          onClick={() => {
                            setEvolutionStage(stage.id);
                            const { params: evolved, visualStyle: vis } =
                              applyEvolutionStage(archetype, params, stage.id);
                            const evolvedWithStyle = { ...evolved, visualStyle: vis } as ArchetypeParams;
                            setParams(evolvedWithStyle);
                            setVisualStyle(vis);
                            rebuildModel(archetype, materialPreset, evolvedWithStyle, atlasResolution);
                          }}
                          className={`flex flex-col items-start p-2 rounded-md border text-left transition-all ${
                            active
                              ? "bg-[#F59E0B]/15 border-[#F59E0B] text-white"
                              : "bg-[#0D0E12] border-[#262936] text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          <span className="text-[10px] font-bold text-[#FBBF24]">{stage.label}</span>
                          <span className="text-[9px] text-[#64748B] leading-tight mt-0.5">
                            {stage.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Visual Style: same theme, different form */}
                <div className="pt-3 border-t border-[#262936]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>視覚スタイル / 形態変化</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {VISUAL_STYLES.map((style) => {
                      const active = visualStyle === style.id;
                      return (
                        <button
                          key={style.id}
                          onClick={() => {
                            setVisualStyle(style.id);
                            const next = { ...params, visualStyle: style.id } as ArchetypeParams;
                            setParams(next);
                            rebuildModel(archetype, materialPreset, next, atlasResolution);
                          }}
                          className={`flex flex-col items-start p-2 rounded-md border text-left transition-all ${
                            active
                              ? "bg-[#3B82F6]/15 border-[#3B82F6] text-white"
                              : "bg-[#0D0E12] border-[#262936] text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold">{style.nameJa}</span>
                            <span className="text-[9px] font-mono text-[#60A5FA]">{style.nameEn}</span>
                          </div>
                          <span className="text-[10px] text-[#64748B] mt-0.5 leading-tight">{style.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Same-theme alternate model forge presets */}
                <div className="pt-3 border-t border-[#262936]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>同一テーマ別モデル (Preset Forge)</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {FORGE_PRESETS.map((preset) => {
                      const active = archetype === preset.archetype && visualStyle === preset.visualStyle;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => {
                            setArchetype(preset.archetype);
                            setVisualStyle(preset.visualStyle);
                            const meta =
                              ARCHETYPE_CATALOG.find((a) => a.id === preset.archetype) || ARCHETYPE_CATALOG[0];
                            const next = {
                              ...meta.defaultParams,
                              visualStyle: preset.visualStyle,
                            } as ArchetypeParams;
                            setParams(next);
                            setDisplaySettings(getDefaultDisplaySettings(preset.archetype));
                            setModelName(preset.label);
                            setModelSlug(preset.id);
                            rebuildModel(preset.archetype, materialPreset, next, atlasResolution);
                          }}
                          className={`flex flex-col items-start p-2 rounded-md border text-left transition-all ${
                            active
                              ? "bg-[#10B981]/15 border-[#10B981] text-white"
                              : "bg-[#0D0E12] border-[#262936] text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          <span className="text-xs font-bold">{preset.label}</span>
                          <span className="text-[10px] text-[#64748B] mt-0.5 leading-tight">{preset.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {leftSection === "modes" && (
              <>
                {/* Temporary mode shifts: eclipse / divine / arcane / void */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8B5CF6] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>一時モード変化</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">Eclipse / Divine / Arcane / Void</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "base", label: "標準形態", desc: "基本状態に戻る", color: "bg-[#0D0E12] border-[#262936]" },
                      { id: "eclipse", label: "蝕モード", desc: "闇核・反転ブレード", color: "bg-[#0D0E12] border-[#262936]" },
                      { id: "divine", label: "聖盾モード", desc: "祝福の浮遊石・巨大光輪", color: "bg-[#0D0E12] border-[#262936]" },
                      { id: "arcane", label: "魔導モード", desc: "三次元浮遊結晶・二重芯", color: "bg-[#0D0E12] border-[#262936]" },
                      { id: "void", label: "虚モード", desc: "断片化虚空結晶・不完全本体", color: "bg-[#0D0E12] border-[#262936]" },
                      { id: "plus", label: "改モード", desc: "増設装飾・強化", color: "bg-[#0D0E12] border-[#262936]" },
                      { id: "awakened", label: "覚醒モード", desc: "発光ルーン・光輪", color: "bg-[#0D0E12] border-[#262936]" },
                      { id: "ascendant", label: "限界突破", desc: "浮遊リング二重", color: "bg-[#0D0E12] border-[#262936]" },
                    ].map((mode) => {
                      const active = visualStyle === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => {
                            setVisualStyle(mode.id as VisualStyleId);
                            const next = { ...params, visualStyle: mode.id } as ArchetypeParams;
                            setParams(next);
                            rebuildModel(archetype, materialPreset, next, atlasResolution);
                          }}
                          className={`flex flex-col items-start p-2 rounded-md border text-left transition-all ${
                            active
                              ? "bg-[#8B5CF6]/20 border-[#8B5CF6] text-white"
                              : "bg-[#0D0E12] border-[#262936] text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          <span className="text-xs font-bold">{mode.label}</span>
                          <span className="text-[10px] text-[#64748B] mt-0.5 leading-tight">{mode.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Attack / magic-cast animation modes */}
                <div className="pt-3 border-t border-[#262936]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>攻撃・魔法発動アニメーション</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">Slash / Thrust / Spin...</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ...ATTACK_MODES.map((m) => ({ id: m.id as string, label: m.label, desc: m.detail })),
                      { id: "idle", label: "待機", desc: "浮遊アニメのみ" },
                    ].map((mode) => {
                      const active = activeAttackMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => {
                            if (mode.id === "idle") {
                              setActiveAttackMode(null);
                              return;
                            }
                            triggerAttack(mode.id as AttackModeId);
                          }}
                          className={`flex flex-col items-start p-2 rounded-md border text-left transition-all ${
                            active
                              ? "bg-[#F59E0B]/20 border-[#F59E0B] text-white"
                              : "bg-[#0D0E12] border-[#262936] text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          <span className="text-xs font-bold">{mode.label}</span>
                          <span className="text-[10px] text-[#64748B] mt-0.5 leading-tight">{mode.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {leftSection === "modes" && (
              <div className="pt-3 border-t border-[#262936]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F97316] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>エフェクト (パーティクル)</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#94A3B8]">データパックにも反映</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {EFFECT_PRESETS.map((fx) => {
                    const active = (params.effectPreset ?? "none") === fx.id;
                    return (
                      <button
                        key={fx.id}
                        onClick={() => handleUpdateParam("effectPreset", fx.id as EffectPresetId)}
                        title={fx.detail}
                        className={`flex flex-col items-start p-1.5 rounded border text-left transition-colors ${
                          active
                            ? "bg-[#F97316]/15 border-[#F97316] text-white"
                            : "bg-[#0D0E12] border-[#262936] text-[#94A3B8] hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-1 text-[11px] font-bold">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: `linear-gradient(135deg, ${fx.colors[0]}, ${fx.colors[1]})` }} />
                          {fx.label}
                        </span>
                        <span className="text-[9px] text-[#64748B] leading-tight">{fx.detail}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {leftSection === "parts" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
                    <Puzzle className="w-3.5 h-3.5" />
                    <span>パーツ追加</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#94A3B8]">{customParts.length} cubes added</span>
                </div>
                <p className="text-[10px] text-[#64748B] leading-relaxed">
                  選択中のパーツの上端に取り付けます（未選択ならモデル頂部）。形状パラメータを変えても追加パーツは保持されます。
                </p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#94A3B8]">パーツ倍率</span>
                    <span className="font-mono text-white">{partScale.toFixed(1)}×</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={partScale}
                    onChange={(e) => setPartScale(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-[#0D0E12] rounded-lg cursor-pointer accent-[#10B981]"
                  />
                </div>
                {(["装飾", "禍々", "魔法", "機械"] as const).map((cat) => (
                  <div key={cat} className="space-y-1">
                    <span className="text-[10px] font-mono text-[#94A3B8]">{cat}</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PARTS_LIBRARY.filter((part) => part.category === cat).map((part) => (
                        <button
                          key={part.id}
                          onClick={() => handleAddPart(part.id)}
                          className="px-1.5 py-1.5 rounded border text-[11px] bg-[#0D0E12] border-[#262936] text-[#F1F5F9] hover:border-[#10B981] hover:text-[#34D399] transition-colors"
                        >
                          ＋{part.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleClearParts}
                  disabled={customParts.length === 0}
                  className="w-full py-1.5 rounded text-[11px] border border-[#EF4444]/50 text-[#F87171] hover:bg-[#EF4444]/10 disabled:opacity-40"
                >
                  追加パーツをすべて外す
                </button>
                <div className="text-[10px] text-[#64748B] leading-relaxed border-t border-[#262936] pt-2">
                  ショートカット: Ctrl+Z 元に戻す / Ctrl+Shift+Z・Ctrl+Y やり直し / Ctrl+D 複製 / Delete 削除 / Esc 選択解除
                </div>
              </div>
            )}

            {leftSection === "uv_material" && (
              <>
                {/* UV Atlas Material Presets */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>材質カラーパレット (Material)</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(
                      Object.values(MATERIAL_PALETTES) as Array<
                        (typeof MATERIAL_PALETTES)[MaterialPresetId]
                      >
                    ).map((pal) => {
                      const active = materialPreset === pal.id;
                      return (
                        <button
                          key={pal.id}
                          onClick={() => handleSelectMaterial(pal.id)}
                          className={`flex flex-col gap-1.5 p-2.5 rounded-md border text-left transition-all ${
                            active
                              ? "bg-[#3B82F6]/15 border-[#3B82F6] text-white"
                              : "bg-[#0D0E12] border-[#262936] text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#F1F5F9]">
                              {pal.nameJa.split(" ")[0]}
                            </span>
                          </div>
                          {/* Color Swatch Strip */}
                          <div className="flex items-center gap-1">
                            {[
                              pal.edgeHighlight,
                              pal.primaryLight,
                              pal.primaryBase,
                              pal.trimBase,
                              pal.handleBase,
                              pal.gemBase,
                            ].map((hex, idx) => (
                              <span
                                key={idx}
                                style={{ backgroundColor: hex }}
                                className="w-3.5 h-3.5 rounded-xs border border-black/40"
                              />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* UV Atlas Resolution & Shading Algorithm */}
                <div className="pt-3 border-t border-[#262936] space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>UVアトラス生成アルゴリズム</span>
                  </span>

                  <div className="space-y-1.5">
                    <span className="text-xs text-[#94A3B8]">
                      テクスチャ解像度 (Blockbench / MC Texture Size)
                    </span>
                    <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                      {(
                        [
                          { res: 16, desc: "16×16 (Vanilla)" },
                          { res: 32, desc: "32×32 (HD推奨)" },
                          { res: 64, desc: "64×64 (高精細)" },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.res}
                          onClick={() => handleChangeResolution(item.res)}
                          className={`py-2 px-2 rounded border text-center transition-colors ${
                            atlasResolution === item.res
                              ? "bg-[#3B82F6] border-[#3B82F6] text-white font-bold"
                              : "bg-[#0D0E12] border-[#262936] text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          {item.desc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs text-[#94A3B8]">
                      ピクセルシェーディング表現
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {SHADING_STYLES.map((st) => (
                        <button
                          key={st.id}
                          onClick={() =>
                            handleUpdateParam("shadingStyle", st.id)
                          }
                          className={`flex flex-col items-start p-2 rounded border text-left ${
                            params.shadingStyle === st.id
                              ? "bg-[#10B981]/15 border-[#10B981] text-white"
                              : "bg-[#0D0E12] border-[#262936] text-[#94A3B8]"
                          }`}
                        >
                          <span className="font-bold">{st.label}</span>
                          <span className="text-[10px] text-[#64748B]">
                            {st.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94A3B8]">
                        UVアイランド間隔 (Bleed Padding)
                      </span>
                      <span className="font-mono text-white">
                        {params.uvPadding}px
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                      {([0, 1, 2] as const).map((pad) => (
                        <button
                          key={pad}
                          onClick={() => handleUpdateParam("uvPadding", pad)}
                          className={`py-1 rounded border ${
                            params.uvPadding === pad
                              ? "bg-[#3B82F6]/20 border-[#3B82F6] text-[#60A5FA]"
                              : "bg-[#0D0E12] border-[#262936] text-[#94A3B8]"
                          }`}
                        >
                          {pad}px 余白
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {leftSection === "library" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>プリセット＆保存済み3Dモデル</span>
                  </span>
                </div>

                {isLoadingLibrary ? (
                  <div className="py-8 text-center text-xs text-[#64748B]">
                    データベースからモデルを読み込み中...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedModels.map((item) => {
                      const isCurrent = activeModelId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleLoadModelFromDB(item)}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                            isCurrent
                              ? "bg-[#3B82F6]/15 border-[#3B82F6]"
                              : "bg-[#0D0E12] border-[#262936] hover:border-[#334155]"
                          }`}
                        >
                          {/* Mini UV Atlas Preview Thumbnail */}
                          <div className="w-12 h-12 rounded bg-[#161922] border border-[#262936] shrink-0 overflow-hidden flex items-center justify-center">
                            {item.textureDataUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.textureDataUrl}
                                alt={item.name}
                                className="w-full h-full object-contain"
                                style={{ imageRendering: "pixelated" }}
                              />
                            ) : (
                              <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white truncate">
                                {item.name}
                              </span>
                              {item.isPreset && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#3B82F6]/20 text-[#60A5FA]">
                                  PRESET
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1 font-mono text-[10px] text-[#64748B]">
                              <span className="text-[#10B981]">
                                {item.atlasResolution}×{item.atlasResolution}px
                              </span>
                              <span>•</span>
                              <span>
                                {Array.isArray(item.elementsJson)
                                  ? item.elementsJson.length
                                  : 0}{" "}
                                cubes
                              </span>
                              <span>•</span>
                              <span>DL: {item.downloadsCount}</span>
                            </div>
                          </div>

                          {!item.isPreset && (
                            <button
                              onClick={(e) =>
                                handleDeleteModelFromDB(item.id, e)
                              }
                              className="p-1.5 rounded text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                              title="削除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER STAGE (flex-1): Interactive 3D WebGL Viewport */}
        <main className="flex-1 min-w-0 min-h-[300px] relative flex flex-col">
          <Viewport3D
            elements={elements}
            textureDataUrl={textureDataUrl}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            displaySettings={displaySettings}
            atlasResolution={atlasResolution}
            previewFx={(archetype === "staff" && resolveStaffFx(params).previewFx) || visualStyle !== "base"}
            effectColor={MATERIAL_PALETTES[materialPreset].coreGlow}
            attackMode={activeAttackMode}
            attackKey={attackKey}
            effectPreset={params.effectPreset ?? (archetype === "staff" && resolveStaffFx(params).previewFx ? "mana" : "none")}
            transformed={params.transformed || false}
            transformLoop={params.transformAnimation || false}
          />
        </main>

        {/* RIGHT SPLIT DOCK (400px): Top = 2D UV Atlas Editor, Bottom = Cuboid Outliner & 3D Transform Inspector */}
        <aside className="w-full lg:w-[410px] shrink-0 bg-[#161922] border-t lg:border-t-0 lg:border-l border-[#262936] flex flex-col min-h-0">
          {/* Top Half: 2D UV Atlas & Pixel Inspector (52% height) */}
          <div className="h-[52%] min-h-[260px] border-b border-[#262936] flex flex-col overflow-hidden">
            <UVAtlasEditor
              elements={elements}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              textureDataUrl={textureDataUrl}
              onUpdateTextureDataUrl={setTextureDataUrl}
              onRegenerateProceduralAtlas={handleRegenerateProceduralAtlas}
              resolution={atlasResolution}
              materialPreset={materialPreset}
              modelSlug={modelSlug}
            />
          </div>

          {/* Bottom Half: Element Outliner & Transform / Display Inspector (48% height) */}
          <div className="flex-1 min-h-[220px] flex flex-col overflow-hidden">
            <ElementInspector
              elements={elements}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              onAddElement={handleAddElement}
              onDeleteElement={handleDeleteElement}
              displaySettings={displaySettings}
              onUpdateDisplaySettings={setDisplaySettings}
              resolution={atlasResolution}
              strictMinecraftRotation={params.strictMinecraftRotation}
            />
          </div>
        </aside>
      </div>

      {/* Export Studio Modal (.bbmodel, .json, .png, .zip) */}
      <ExportStudioModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        modelName={modelName}
        modelSlug={modelSlug}
        resolution={atlasResolution}
        elements={elements}
        displaySettings={displaySettings}
        textureDataUrl={textureDataUrl}
        effectPreset={params.effectPreset}
        onExportSuccess={handleRecordExport}
      />
    </div>
  );
}
